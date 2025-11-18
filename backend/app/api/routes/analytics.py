from fastapi import APIRouter, Depends, Query, HTTPException
from typing import List
from app.schemas.analytics import ConversationResponse, AnalyticsStats
from app.services.supabase_service import supabase_service
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/conversations", response_model=List[ConversationResponse])
async def get_conversations(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    user: User = Depends(get_current_user)
):
    """Get conversation history"""
    agent = await supabase_service.get_agent_by_user(user.id)
    if not agent:
        return []

    offset = (page - 1) * per_page
    conversations = await supabase_service.get_conversations(agent.agent_id, per_page, offset)
    return conversations


@router.get("/conversations/{conversation_id}", response_model=ConversationResponse)
async def get_conversation(
    conversation_id: str,
    user: User = Depends(get_current_user)
):
    """Get conversation details"""
    # Get user's agent first
    agent = await supabase_service.get_agent_by_user(user.id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    conversation = await supabase_service.get_conversation_by_id(conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # SECURITY: Verify conversation belongs to user's agent
    if conversation.agent_id != agent.agent_id:
        raise HTTPException(status_code=403, detail="Access forbidden")

    return conversation


@router.get("/stats", response_model=AnalyticsStats)
async def get_stats(
    days: int = Query(7, ge=1, le=90),
    user: User = Depends(get_current_user)
):
    """Get analytics stats"""
    agent = await supabase_service.get_agent_by_user(user.id)
    if not agent:
        # Return empty stats if no agent
        return AnalyticsStats(
            total_calls=0,
            total_minutes=0.0,
            successful_calls=0,
            success_rate=0.0,
            avg_duration_secs=0.0,
            failed_calls=0,
            appointments_booked=0,
            sentiment_breakdown={}
        )

    # Get stats from database
    stats = await supabase_service.get_analytics_stats(agent.agent_id, days)

    # Calculate success rate
    success_rate = 0.0
    if stats['total_calls'] > 0:
        success_rate = (stats['successful_calls'] / stats['total_calls']) * 100

    return AnalyticsStats(
        total_calls=stats['total_calls'],
        total_minutes=stats['total_minutes'],
        successful_calls=stats['successful_calls'],
        success_rate=success_rate,
        avg_duration_secs=stats['avg_duration_secs'],
        failed_calls=stats.get('failed_calls', 0),
        appointments_booked=stats.get('appointments_booked', 0),
        sentiment_breakdown=stats.get('sentiment_breakdown', {})
    )
