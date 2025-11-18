from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from typing import List, Optional
from datetime import datetime
import os
import uuid
import logging
from app.schemas.agent import AgentCreate, AgentUpdate, AgentResponse
from app.services.elevenlabs_service import elevenlabs_service
from app.services.supabase_service import supabase_service
from app.services.phone_service import phone_service
from app.api.deps import get_current_user
from app.models.user import User
from app.database import get_supabase
from app.config import settings
from app.templates_config.agent_templates import customize_template
from pydantic import BaseModel

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/agents", tags=["Agents"])


# Response schemas
class AgentTokenResponse(BaseModel):
    """Agent API token response"""
    agent_id: str
    api_token: str
    token_preview: str
    message: str

    class Config:
        from_attributes = True


class KnowledgeBaseFileResponse(BaseModel):
    id: str
    user_id: str
    agent_id: str
    filename: str
    file_size: int
    file_type: str
    storage_url: str
    uploaded_at: datetime
    processed: bool = False

    class Config:
        from_attributes = True


@router.post("/", response_model=AgentResponse, status_code=status.HTTP_201_CREATED)
async def create_agent(
    agent_data: AgentCreate,
    template_key: Optional[str] = None,
    business_name: Optional[str] = None,
    phone_number: Optional[str] = None,
    area_code: Optional[str] = None,
    provision_phone: bool = False,  # Changed to False - customers pick numbers in onboarding
    user: User = Depends(get_current_user)
):
    """
    Create a new agent for the user

    This will:
    1. Create an agent in ElevenLabs using a template (if template_key provided)
    2. Store the agent details in the database
    3. Generate an API token for agent actions
    4. Provision a dedicated phone number (if provision_phone=True)

    Args:
        agent_data: Agent configuration
        template_key: Template identifier (healthcare, legal, real_estate, general)
        business_name: Business name for template customization
        phone_number: Phone number for template customization
        area_code: Preferred area code for phone number (e.g., "212")
        provision_phone: Whether to provision a phone number (default: False)
        user: Current authenticated user
    """
    # Check if user already has an agent
    existing_agent = await supabase_service.get_agent_by_user(user.id)
    if existing_agent:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already has an agent. Use PUT to update it."
        )

    try:
        # If template_key provided, use template-based creation
        if template_key:
            if not business_name:
                business_name = "Our Business"  # Default fallback
            if not phone_number:
                phone_number = "+1 (555) 000-0000"  # Default fallback

            # Customize template with business details
            customized = customize_template(
                template_key=template_key,
                agent_name=agent_data.agent_name,
                business_name=business_name,
                phone_number=phone_number
            )

            prompt = customized["prompt"]
            first_message = customized["first_message"]
            voice_id = customized["voice_id"]
        else:
            # Manual creation with provided prompt
            prompt = agent_data.prompt or f"You are {agent_data.agent_name}, a helpful AI assistant for a healthcare practice. You assist patients with scheduling appointments, answering common questions, and providing general information."
            first_message = None
            voice_id = agent_data.voice_id or "21m00Tcm4TlvDq8ikWAM"

        # Create agent in ElevenLabs
        elevenlabs_agent = await elevenlabs_service.create_agent(
            name=agent_data.agent_name,
            prompt=prompt,
            voice_id=voice_id,
            language="en",
            first_message=first_message
        )

        # Store agent in database with generated API token
        agent = await supabase_service.create_agent(
            user_id=user.id,
            agent_id=elevenlabs_agent["agent_id"],
            agent_name=agent_data.agent_name,
            metadata=elevenlabs_agent
        )

        # Convert agent model to dict for response
        agent_dict = agent.dict() if hasattr(agent, 'dict') else dict(agent)

        # Provision phone number if requested (disabled by default for now)
        phone_info = None
        if provision_phone:
            try:
                phone_info = await phone_service.provision_phone_number(
                    user_id=user.id,
                    agent_id=elevenlabs_agent["agent_id"],
                    area_code=area_code,
                    country="US"
                )
                # Add phone info to response
                agent_dict["phone_number"] = phone_info["phone_number"]
                agent_dict["phone_number_status"] = "active"
            except Exception as phone_error:
                # Log error but don't fail agent creation
                logger.warning(f"Failed to provision phone number: {phone_error}")
                agent_dict["phone_number"] = None
                agent_dict["phone_number_status"] = "pending"

        return agent_dict

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create agent: {str(e)}"
        )


@router.get("/", response_model=AgentResponse)
async def get_agent(user: User = Depends(get_current_user)):
    """Get user's agent"""
    agent = await supabase_service.get_agent_by_user(user.id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return agent


@router.put("/{agent_id}", response_model=AgentResponse)
async def update_agent(
    agent_id: str,
    updates: AgentUpdate,
    user: User = Depends(get_current_user)
):
    """Update agent configuration"""
    # Verify ownership
    agent = await supabase_service.get_agent_by_id(agent_id)
    if not agent or agent.user_id != user.id:
        raise HTTPException(status_code=404, detail="Agent not found")

    # Update in ElevenLabs if needed
    if updates.agent_name:
        await elevenlabs_service.update_agent(agent_id, {"name": updates.agent_name})

    # Update in database
    db_updates = updates.dict(exclude_unset=True)
    result = await supabase_service.update_agent(agent.id, db_updates)

    return result


@router.get("/{agent_id}/api-token", response_model=AgentTokenResponse)
async def get_agent_token(
    agent_id: str,
    user: User = Depends(get_current_user)
):
    """
    Get the API token for an agent

    This token is used by ElevenLabs AI agents to authenticate when calling
    the Agent Actions API endpoints (check-availability, book-appointment, etc.)
    """
    try:
        supabase = get_supabase()

        # Verify agent belongs to user
        agent_response = supabase.table("agents").select("*").eq(
            "agent_id", agent_id
        ).eq("user_id", user.id).execute()

        if not agent_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Agent not found or access denied"
            )

        agent = agent_response.data[0]
        api_token = agent.get("api_token")

        if not api_token:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="API token not found. Please regenerate the token."
            )

        # Create preview (first 12 and last 6 characters)
        token_preview = f"{api_token[:12]}...{api_token[-6:]}"

        return AgentTokenResponse(
            agent_id=agent_id,
            api_token=api_token,
            token_preview=token_preview,
            message="Use this token in the X-Agent-Token header when configuring ElevenLabs function calling"
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve token: {str(e)}"
        )


@router.post("/{agent_id}/regenerate-token", response_model=AgentTokenResponse)
async def regenerate_agent_token(
    agent_id: str,
    user: User = Depends(get_current_user)
):
    """
    Regenerate the API token for an agent

    ⚠️ WARNING: This will invalidate the old token. You must update the token
    in your ElevenLabs agent configuration after regenerating.
    """
    try:
        # Regenerate token
        new_token = await supabase_service.regenerate_agent_token(agent_id, user.id)

        # Create preview
        token_preview = f"{new_token[:12]}...{new_token[-6:]}"

        return AgentTokenResponse(
            agent_id=agent_id,
            api_token=new_token,
            token_preview=token_preview,
            message="Token regenerated successfully. Update this token in your ElevenLabs agent configuration."
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to regenerate token: {str(e)}"
        )


@router.post("/knowledge-base/upload", response_model=KnowledgeBaseFileResponse)
async def upload_knowledge_base_file(
    agent_id: str,
    file: UploadFile = File(...),
    user: User = Depends(get_current_user)
):
    """
    Upload a file to the knowledge base for the agent
    """
    try:
        supabase = get_supabase()

        # Verify agent belongs to user
        agent_response = supabase.table("agents").select("*").eq(
            "agent_id", agent_id
        ).eq("user_id", user.id).execute()

        if not agent_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Agent not found or access denied"
            )

        # Validate file type
        allowed_types = [
            'application/pdf',
            'text/plain',
            'text/csv',
            'application/json',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ]

        if file.content_type not in allowed_types:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File type {file.content_type} not supported. Allowed: PDF, TXT, CSV, JSON, DOCX, XLSX"
            )

        # Validate file size (max 10MB)
        file_content = await file.read()
        file_size = len(file_content)

        if file_size > 10 * 1024 * 1024:  # 10MB
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File size exceeds 10MB limit"
            )

        # Reset file pointer
        await file.seek(0)

        # Generate unique filename
        file_extension = os.path.splitext(file.filename)[1]
        unique_filename = f"{user.id}/{agent_id}/{uuid.uuid4()}{file_extension}"

        # Upload to Supabase Storage
        try:
            storage_response = supabase.storage.from_("knowledge-base").upload(
                path=unique_filename,
                file=file_content,
                file_options={"content-type": file.content_type}
            )

            # Get public URL
            storage_url = supabase.storage.from_("knowledge-base").get_public_url(unique_filename)

        except Exception as storage_error:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to upload file to storage: {str(storage_error)}"
            )

        # Save file metadata to database
        file_data = {
            "user_id": user.id,
            "agent_id": agent_id,
            "filename": file.filename,
            "file_size": file_size,
            "file_type": file.content_type,
            "storage_path": unique_filename,
            "storage_url": storage_url,
            "uploaded_at": datetime.utcnow().isoformat(),
            "processed": False
        }

        db_response = supabase.table("knowledge_base_files").insert(file_data).execute()

        if not db_response.data:
            # Cleanup uploaded file
            try:
                supabase.storage.from_("knowledge-base").remove([unique_filename])
            except Exception as e:
                # Log but don't fail if cleanup fails
                import logging
                logging.error(f"Failed to cleanup file from storage: {e}")

            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to save file metadata"
            )

        file_record = db_response.data[0]

        # TODO: Trigger async job to process file and extract knowledge

        return KnowledgeBaseFileResponse(
            id=file_record["id"],
            user_id=file_record["user_id"],
            agent_id=file_record["agent_id"],
            filename=file_record["filename"],
            file_size=file_record["file_size"],
            file_type=file_record["file_type"],
            storage_url=file_record["storage_url"],
            uploaded_at=file_record["uploaded_at"],
            processed=file_record["processed"]
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload file: {str(e)}"
        )


@router.get("/knowledge-base/files", response_model=List[KnowledgeBaseFileResponse])
async def get_knowledge_base_files(
    agent_id: str,
    user: User = Depends(get_current_user)
):
    """
    Get all knowledge base files for an agent
    """
    try:
        supabase = get_supabase()

        # Verify agent belongs to user
        agent_response = supabase.table("agents").select("*").eq(
            "agent_id", agent_id
        ).eq("user_id", user.id).execute()

        if not agent_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Agent not found or access denied"
            )

        # Get files
        files_response = supabase.table("knowledge_base_files").select("*").eq(
            "agent_id", agent_id
        ).order("uploaded_at", desc=True).execute()

        files = []
        for file_data in files_response.data:
            files.append(KnowledgeBaseFileResponse(
                id=file_data["id"],
                user_id=file_data["user_id"],
                agent_id=file_data["agent_id"],
                filename=file_data["filename"],
                file_size=file_data["file_size"],
                file_type=file_data["file_type"],
                storage_url=file_data["storage_url"],
                uploaded_at=file_data["uploaded_at"],
                processed=file_data.get("processed", False)
            ))

        return files

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch files: {str(e)}"
        )


@router.delete("/knowledge-base/{file_id}")
async def delete_knowledge_base_file(
    file_id: str,
    user: User = Depends(get_current_user)
):
    """
    Delete a knowledge base file
    """
    try:
        supabase = get_supabase()

        # Get file record
        file_response = supabase.table("knowledge_base_files").select("*").eq(
            "id", file_id
        ).eq("user_id", user.id).execute()

        if not file_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="File not found"
            )

        file_record = file_response.data[0]

        # Delete from storage
        try:
            supabase.storage.from_("knowledge-base").remove([file_record["storage_path"]])
        except Exception as storage_error:
            # Log but don't fail
            logger.error(f"Failed to delete file from storage: {storage_error}")

        # Delete from database
        supabase.table("knowledge_base_files").delete().eq("id", file_id).execute()

        return {"message": "File deleted successfully"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete file: {str(e)}"
        )


# ============================================================
# PHONE NUMBER MANAGEMENT ENDPOINTS
# ============================================================

@router.post("/{agent_id}/phone-number", status_code=status.HTTP_201_CREATED)
async def provision_phone_number_for_agent(
    agent_id: str,
    area_code: Optional[str] = None,
    country: str = "US",
    user: User = Depends(get_current_user)
):
    """
    Provision a dedicated phone number for an agent

    Each agent gets their own phone number for receiving calls.
    """
    try:
        supabase = get_supabase()

        # Verify agent belongs to user
        agent_response = supabase.table("agents").select("*").eq(
            "agent_id", agent_id
        ).eq("user_id", user.id).execute()

        if not agent_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Agent not found or access denied"
            )

        agent = agent_response.data[0]

        # Check if agent already has a phone number
        if agent.get("phone_number"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Agent already has phone number: {agent['phone_number']}"
            )

        # Provision phone number
        phone_info = await phone_service.provision_phone_number(
            user_id=user.id,
            agent_id=agent_id,
            area_code=area_code,
            country=country
        )

        return {
            "message": f"Phone number {phone_info['phone_number']} provisioned successfully",
            **phone_info
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to provision phone number: {str(e)}"
        )


@router.get("/phone-numbers")
async def list_phone_numbers(user: User = Depends(get_current_user)):
    """
    List all phone numbers for the current user
    """
    try:
        phone_numbers = await phone_service.list_user_phone_numbers(user.id)
        return {"phone_numbers": phone_numbers, "total": len(phone_numbers)}

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list phone numbers: {str(e)}"
        )


@router.delete("/{agent_id}/phone-number")
async def release_phone_number_for_agent(
    agent_id: str,
    user: User = Depends(get_current_user)
):
    """
    Release a phone number back to the provider
    """
    try:
        supabase = get_supabase()

        # Verify agent belongs to user
        agent_response = supabase.table("agents").select("*").eq(
            "agent_id", agent_id
        ).eq("user_id", user.id).execute()

        if not agent_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Agent not found or access denied"
            )

        agent = agent_response.data[0]

        if not agent.get("phone_number_sid"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Agent does not have a phone number"
            )

        # Release phone number
        await phone_service.release_phone_number(
            agent_id=agent_id,
            phone_number_sid=agent["phone_number_sid"]
        )

        return {
            "message": f"Phone number {agent.get('phone_number')} released successfully"
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to release phone number: {str(e)}"
        )
