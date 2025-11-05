from fastapi import APIRouter, Depends, HTTPException
from app.schemas.agent import AgentCreate, AgentUpdate, AgentResponse
from app.services.elevenlabs_service import elevenlabs_service
from app.services.supabase_service import supabase_service
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/agents", tags=["Agents"])


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
