from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.models.conversation import CallStatus, Sentiment


class MessageResponse(BaseModel):
    role: str
    content: str
    timestamp: datetime


class ConversationResponse(BaseModel):
    id: int
    conversation_id: str
    agent_id: str
    end_user_id: Optional[str]
    duration_secs: Optional[int]
    call_successful: Optional[CallStatus]
    summary: Optional[str]
    title: Optional[str]
    sentiment: Optional[Sentiment]
    intent: Optional[str]
    created_at: datetime
    messages: List[MessageResponse] = []

    class Config:
        from_attributes = True


class AnalyticsStats(BaseModel):
    total_calls: int  # Renamed from total_conversations for frontend compatibility
    total_minutes: float
    successful_calls: int
    success_rate: float  # Added for frontend compatibility (percentage 0-100)
    avg_duration_secs: float  # Renamed from average_duration for frontend compatibility

    # Keep these for backward compatibility if needed
    failed_calls: Optional[int] = 0
    appointments_booked: Optional[int] = 0
    sentiment_breakdown: Optional[dict] = {}
