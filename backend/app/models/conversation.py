from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime
from enum import Enum


class CallStatus(str, Enum):
    SUCCESSFUL = "successful"
    FAILED = "failed"
    NO_ANSWER = "no_answer"
    BUSY = "busy"


class Sentiment(str, Enum):
    POSITIVE = "positive"
    NEUTRAL = "neutral"
    NEGATIVE = "negative"


class Message(BaseModel):
    id: int
    conversation_id: str
    role: str  # "agent" or "user"
    content: str
    timestamp: datetime
    created_at: datetime

    class Config:
        from_attributes = True


class Conversation(BaseModel):
    id: int
    conversation_id: str
    agent_id: str
    end_user_id: Optional[str] = None
    duration_secs: Optional[int] = None
    total_cost: Optional[int] = None
    call_successful: Optional[CallStatus] = None
    summary: Optional[str] = None
    title: Optional[str] = None
    sentiment: Optional[Sentiment] = None
    intent: Optional[str] = None
    webhook_payload: Optional[Dict[str, Any]] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ConversationWithMessages(Conversation):
    messages: List[Message] = []