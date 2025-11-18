from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import List, Optional
from datetime import datetime, date, timedelta
from app.schemas.calls import (
    CreateCallRequest, CallResponse, CallListResponse, CallDetailResponse,
    EndCallRequest, CallFeedbackRequest, CallStatsResponse,
    CallTranscriptResponse, CallRecordingResponse, ScheduleCallRequest,
    BulkCallRequest, BulkCallResponse, CallStatus, CallSentiment, CallDirection
)
from app.models.user import User
from app.api.deps import get_current_user
from app.database import get_supabase
from app.services.supabase_service import supabase_service
from app.services.elevenlabs_service import elevenlabs_service
from app.config import settings

router = APIRouter(prefix="/calls", tags=["Calls Management"])


@router.get("", response_model=CallListResponse)
async def get_calls(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    status: Optional[CallStatus] = None,
    sentiment: Optional[CallSentiment] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    agent_id: Optional[str] = None,
    user: User = Depends(get_current_user)
):
    """
    Get paginated list of calls with optional filtering
    """
    try:
        supabase = get_supabase()
        offset = (page - 1) * per_page

        # Build query
        query = supabase.table("calls").select(
            "*, agents(name)", count="exact"
        ).eq("user_id", user.id)

        # Apply filters
        if status:
            query = query.eq("status", status.value)
        if sentiment:
            query = query.eq("sentiment", sentiment.value)
        if date_from:
            query = query.gte("created_at", date_from.isoformat())
        if date_to:
            query = query.lte("created_at", (date_to + timedelta(days=1)).isoformat())
        if agent_id:
            query = query.eq("agent_id", agent_id)

        # Execute with pagination
        response = query.order("created_at", desc=True).range(
            offset, offset + per_page - 1
        ).execute()

        # Transform data
        calls = []
        for call_data in response.data:
            agent_data = call_data.get("agents", {})
            calls.append(CallResponse(
                id=call_data["id"],
                user_id=call_data["user_id"],
                agent_id=call_data["agent_id"],
                agent_name=agent_data.get("name") if agent_data else None,
                phone_number=call_data["phone_number"],
                status=CallStatus(call_data["status"]),
                direction=CallDirection(call_data.get("direction", "outbound")),
                duration_secs=call_data.get("duration_secs"),
                recording_url=call_data.get("recording_url"),
                transcript=call_data.get("transcript"),
                summary=call_data.get("summary"),
                sentiment=CallSentiment(call_data["sentiment"]) if call_data.get("sentiment") else None,
                call_successful=call_data.get("call_successful"),
                error_message=call_data.get("error_message"),
                metadata=call_data.get("metadata"),
                created_at=call_data["created_at"],
                started_at=call_data.get("started_at"),
                ended_at=call_data.get("ended_at")
            ))

        total = response.count if response.count else 0
        pages = (total + per_page - 1) // per_page

        return CallListResponse(
            calls=calls,
            total=total,
            page=page,
            per_page=per_page,
            pages=pages
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch calls: {str(e)}"
        )


@router.post("", response_model=CallResponse)
async def create_call(
    request: CreateCallRequest,
    user: User = Depends(get_current_user)
):
    """
    Create a new outbound call
    """
    try:
        supabase = get_supabase()

        # Verify agent belongs to user
        agent_response = supabase.table("agents").select("*").eq(
            "agent_id", request.agent_id
        ).eq("user_id", user.id).execute()

        if not agent_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Agent not found or access denied"
            )

        agent = agent_response.data[0]

        # Create call record
        call_data = {
            "user_id": user.id,
            "agent_id": request.agent_id,
            "phone_number": request.phone_number,
            "status": CallStatus.PENDING.value if request.scheduled_at else CallStatus.RINGING.value,
            "direction": CallDirection.OUTBOUND.value,
            "metadata": request.metadata,
            "created_at": datetime.utcnow().isoformat()
        }

        if request.scheduled_at:
            call_data["scheduled_at"] = request.scheduled_at.isoformat()

        call_response = supabase.table("calls").insert(call_data).execute()

        if not call_response.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create call"
            )

        call = call_response.data[0]

        # If not scheduled, initiate call immediately via ElevenLabs
        if not request.scheduled_at:
            try:
                # Initiate call using ElevenLabs conversational AI
                call_id = await elevenlabs_service.initiate_call(
                    phone_number=request.phone_number,
                    agent_id=agent.get("elevenlabs_agent_id"),
                    callback_url=f"{settings.BACKEND_URL}/api/webhooks/elevenlabs/call-status"
                )

                # Update call with ElevenLabs call ID
                supabase.table("calls").update({
                    "external_call_id": call_id,
                    "status": CallStatus.IN_PROGRESS.value,
                    "started_at": datetime.utcnow().isoformat()
                }).eq("id", call["id"]).execute()

            except Exception as call_error:
                # Update call status to failed
                supabase.table("calls").update({
                    "status": CallStatus.FAILED.value,
                    "error_message": str(call_error)
                }).eq("id", call["id"]).execute()

                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Failed to initiate call: {str(call_error)}"
                )

        return CallResponse(
            id=call["id"],
            user_id=call["user_id"],
            agent_id=call["agent_id"],
            agent_name=agent.get("name"),
            phone_number=call["phone_number"],
            status=CallStatus(call["status"]),
            direction=CallDirection(call["direction"]),
            duration_secs=call.get("duration_secs"),
            recording_url=call.get("recording_url"),
            transcript=call.get("transcript"),
            summary=call.get("summary"),
            sentiment=CallSentiment(call["sentiment"]) if call.get("sentiment") else None,
            call_successful=call.get("call_successful"),
            error_message=call.get("error_message"),
            metadata=call.get("metadata"),
            created_at=call["created_at"],
            started_at=call.get("started_at"),
            ended_at=call.get("ended_at")
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create call: {str(e)}"
        )


@router.get("/{call_id}", response_model=CallDetailResponse)
async def get_call(
    call_id: str,
    user: User = Depends(get_current_user)
):
    """
    Get detailed information about a specific call
    """
    try:
        supabase = get_supabase()

        # Get call with agent details
        response = supabase.table("calls").select(
            "*, agents(name)"
        ).eq("id", call_id).eq("user_id", user.id).execute()

        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Call not found"
            )

        call_data = response.data[0]
        agent_data = call_data.get("agents", {})

        # Get conversation turns if available
        conversation_turns = None
        if call_data.get("transcript"):
            # Parse transcript into turns (simplified)
            conversation_turns = []

        return CallDetailResponse(
            id=call_data["id"],
            user_id=call_data["user_id"],
            agent_id=call_data["agent_id"],
            agent_name=agent_data.get("name") if agent_data else None,
            phone_number=call_data["phone_number"],
            status=CallStatus(call_data["status"]),
            direction=CallDirection(call_data.get("direction", "outbound")),
            duration_secs=call_data.get("duration_secs"),
            recording_url=call_data.get("recording_url"),
            transcript=call_data.get("transcript"),
            summary=call_data.get("summary"),
            sentiment=CallSentiment(call_data["sentiment"]) if call_data.get("sentiment") else None,
            call_successful=call_data.get("call_successful"),
            error_message=call_data.get("error_message"),
            metadata=call_data.get("metadata"),
            created_at=call_data["created_at"],
            started_at=call_data.get("started_at"),
            ended_at=call_data.get("ended_at"),
            conversation_turns=conversation_turns,
            sentiment_analysis=call_data.get("sentiment_analysis"),
            extracted_data=call_data.get("extracted_data"),
            follow_up_required=call_data.get("follow_up_required")
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch call details: {str(e)}"
        )


@router.post("/{call_id}/end")
async def end_call(
    call_id: str,
    request: EndCallRequest,
    user: User = Depends(get_current_user)
):
    """
    End an active call
    """
    try:
        supabase = get_supabase()

        # Get call
        call_response = supabase.table("calls").select("*").eq(
            "id", call_id
        ).eq("user_id", user.id).execute()

        if not call_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Call not found"
            )

        call = call_response.data[0]

        # Check if call can be ended
        if call["status"] not in [CallStatus.IN_PROGRESS.value, CallStatus.RINGING.value]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Call cannot be ended in current status"
            )

        # End call via ElevenLabs if external call exists
        if call.get("external_call_id"):
            try:
                await elevenlabs_service.end_call(call["external_call_id"])
            except Exception as e:
                # Log but don't fail
                print(f"Failed to end external call: {e}")

        # Calculate duration
        duration_secs = None
        if call.get("started_at"):
            started = datetime.fromisoformat(call["started_at"])
            ended = datetime.utcnow()
            duration_secs = int((ended - started).total_seconds())

        # Update call
        update_data = {
            "status": CallStatus.COMPLETED.value,
            "ended_at": datetime.utcnow().isoformat(),
            "duration_secs": duration_secs
        }

        if request.summary:
            update_data["summary"] = request.summary
        if request.metadata:
            update_data["metadata"] = {**call.get("metadata", {}), **request.metadata}

        supabase.table("calls").update(update_data).eq("id", call_id).execute()

        return {"message": "Call ended successfully"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to end call: {str(e)}"
        )


@router.get("/{call_id}/recording", response_model=CallRecordingResponse)
async def get_call_recording(
    call_id: str,
    user: User = Depends(get_current_user)
):
    """
    Get call recording URL
    """
    try:
        supabase = get_supabase()

        response = supabase.table("calls").select("*").eq(
            "id", call_id
        ).eq("user_id", user.id).execute()

        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Call not found"
            )

        call = response.data[0]

        if not call.get("recording_url"):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Recording not available for this call"
            )

        return CallRecordingResponse(
            call_id=call["id"],
            recording_url=call["recording_url"],
            duration_secs=call.get("duration_secs", 0),
            format="mp3",
            size_bytes=call.get("recording_size_bytes")
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch recording: {str(e)}"
        )


@router.post("/{call_id}/feedback")
async def submit_call_feedback(
    call_id: str,
    request: CallFeedbackRequest,
    user: User = Depends(get_current_user)
):
    """
    Submit feedback for a call
    """
    try:
        supabase = get_supabase()

        # Verify call exists and belongs to user
        call_response = supabase.table("calls").select("*").eq(
            "id", call_id
        ).eq("user_id", user.id).execute()

        if not call_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Call not found"
            )

        # Create or update feedback
        feedback_data = {
            "call_id": call_id,
            "user_id": user.id,
            "rating": request.rating,
            "feedback": request.feedback,
            "issues": request.issues,
            "created_at": datetime.utcnow().isoformat()
        }

        supabase.table("call_feedback").insert(feedback_data).execute()

        return {"message": "Feedback submitted successfully"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to submit feedback: {str(e)}"
        )


@router.get("/stats/summary", response_model=CallStatsResponse)
async def get_call_stats(
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    agent_id: Optional[str] = None,
    user: User = Depends(get_current_user)
):
    """
    Get call statistics and metrics
    """
    try:
        supabase = get_supabase()

        # Build query
        query = supabase.table("calls").select("*").eq("user_id", user.id)

        if date_from:
            query = query.gte("created_at", date_from.isoformat())
        if date_to:
            query = query.lte("created_at", (date_to + timedelta(days=1)).isoformat())
        if agent_id:
            query = query.eq("agent_id", agent_id)

        response = query.execute()
        calls = response.data

        # Calculate stats
        total_calls = len(calls)
        successful_calls = len([c for c in calls if c.get("call_successful")])
        failed_calls = len([c for c in calls if c["status"] == CallStatus.FAILED.value])

        durations = [c.get("duration_secs", 0) for c in calls if c.get("duration_secs")]
        average_duration = sum(durations) / len(durations) if durations else 0
        total_duration = sum(durations)

        # Calls by status
        calls_by_status = {}
        for call in calls:
            status_val = call["status"]
            calls_by_status[status_val] = calls_by_status.get(status_val, 0) + 1

        # Calls by sentiment
        calls_by_sentiment = {}
        for call in calls:
            if call.get("sentiment"):
                sentiment_val = call["sentiment"]
                calls_by_sentiment[sentiment_val] = calls_by_sentiment.get(sentiment_val, 0) + 1

        success_rate = (successful_calls / total_calls * 100) if total_calls > 0 else 0

        # Get average rating from feedback
        feedback_response = supabase.table("call_feedback").select("rating").eq(
            "user_id", user.id
        ).execute()
        ratings = [f["rating"] for f in feedback_response.data if f.get("rating")]
        average_rating = sum(ratings) / len(ratings) if ratings else None

        return CallStatsResponse(
            total_calls=total_calls,
            successful_calls=successful_calls,
            failed_calls=failed_calls,
            average_duration=average_duration,
            total_duration=total_duration,
            calls_by_status=calls_by_status,
            calls_by_sentiment=calls_by_sentiment,
            success_rate=success_rate,
            average_rating=average_rating
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch call stats: {str(e)}"
        )


@router.post("/schedule", response_model=CallResponse)
async def schedule_call(
    request: ScheduleCallRequest,
    user: User = Depends(get_current_user)
):
    """
    Schedule a call for future execution
    """
    try:
        create_request = CreateCallRequest(
            phone_number=request.phone_number,
            agent_id=request.agent_id,
            scheduled_at=request.scheduled_at,
            metadata={
                **(request.metadata or {}),
                "timezone": request.timezone
            }
        )
        return await create_call(create_request, user)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to schedule call: {str(e)}"
        )


@router.post("/bulk", response_model=BulkCallResponse)
async def create_bulk_calls(
    request: BulkCallRequest,
    user: User = Depends(get_current_user)
):
    """
    Create multiple calls in bulk
    """
    try:
        call_ids = []
        errors = []
        calls_created = 0

        for phone_number in request.phone_numbers:
            try:
                create_request = CreateCallRequest(
                    phone_number=phone_number,
                    agent_id=request.agent_id,
                    scheduled_at=request.scheduled_at,
                    metadata=request.metadata
                )
                call = await create_call(create_request, user)
                call_ids.append(call.id)
                calls_created += 1
            except Exception as e:
                errors.append({
                    "phone_number": phone_number,
                    "error": str(e)
                })

        return BulkCallResponse(
            total_requested=len(request.phone_numbers),
            calls_created=calls_created,
            failed=len(errors),
            call_ids=call_ids,
            errors=errors if errors else None
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create bulk calls: {str(e)}"
        )
