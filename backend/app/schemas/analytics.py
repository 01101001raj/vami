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
    total_conversations: int
    total_minutes: float
    successful_calls: int
    failed_calls: int
    average_duration: float
    appointments_booked: int
    sentiment_breakdown: dict
