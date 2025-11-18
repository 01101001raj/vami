from pydantic import BaseModel, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class CallStatus(str, Enum):
    """Call status values"""
    PENDING = "pending"
    RINGING = "ringing"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    NO_ANSWER = "no_answer"


class CallSentiment(str, Enum):
    """Call sentiment analysis values"""
    POSITIVE = "positive"
    NEUTRAL = "neutral"
    NEGATIVE = "negative"
    MIXED = "mixed"


class CallDirection(str, Enum):
    """Call direction"""
    INBOUND = "inbound"
    OUTBOUND = "outbound"


class CallBase(BaseModel):
    """Base call schema"""
    phone_number: str
    agent_id: Optional[str] = None


class CreateCallRequest(BaseModel):
    """Request schema for creating a call"""
    phone_number: str
    agent_id: str
    scheduled_at: Optional[datetime] = None
    metadata: Optional[Dict[str, Any]] = None

    @validator('phone_number')
    def validate_phone(cls, v):
        # Basic phone validation (can be enhanced)
        import re
        phone_pattern = r'^\+?1?\d{9,15}$'
        if not re.match(phone_pattern, v.replace('-', '').replace(' ', '')):
            raise ValueError("Invalid phone number format")
        return v


class CallResponse(BaseModel):
    """Response schema for call"""
    id: str
    user_id: str
    agent_id: str
    agent_name: Optional[str] = None
    phone_number: str
    status: CallStatus
    direction: CallDirection
    duration_secs: Optional[int] = None
    recording_url: Optional[str] = None
    transcript: Optional[str] = None
    summary: Optional[str] = None
    sentiment: Optional[CallSentiment] = None
    call_successful: Optional[bool] = None
    error_message: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    created_at: datetime
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class CallListResponse(BaseModel):
    """Response schema for paginated call list"""
    calls: List[CallResponse]
    total: int
    page: int
    per_page: int
    pages: int


class CallDetailResponse(BaseModel):
    """Detailed response for a single call"""
    id: str
    user_id: str
    agent_id: str
    agent_name: Optional[str] = None
    phone_number: str
    status: CallStatus
    direction: CallDirection
    duration_secs: Optional[int] = None
    recording_url: Optional[str] = None
    transcript: Optional[str] = None
    summary: Optional[str] = None
    sentiment: Optional[CallSentiment] = None
    call_successful: Optional[bool] = None
    error_message: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    created_at: datetime
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None

    # Additional details
    conversation_turns: Optional[List[Dict[str, Any]]] = None
    sentiment_analysis: Optional[Dict[str, Any]] = None
    extracted_data: Optional[Dict[str, Any]] = None
    follow_up_required: Optional[bool] = None

    class Config:
        from_attributes = True


class EndCallRequest(BaseModel):
    """Request schema for ending a call"""
    summary: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class CallFeedbackRequest(BaseModel):
    """Request schema for call feedback"""
    rating: int
    feedback: Optional[str] = None
    issues: Optional[List[str]] = None

    @validator('rating')
    def validate_rating(cls, v):
        if v < 1 or v > 5:
            raise ValueError("Rating must be between 1 and 5")
        return v


class CallStatsResponse(BaseModel):
    """Response schema for call statistics"""
    total_calls: int
    successful_calls: int
    failed_calls: int
    average_duration: float
    total_duration: int
    calls_by_status: Dict[str, int]
    calls_by_sentiment: Dict[str, int]
    success_rate: float
    average_rating: Optional[float] = None


class TranscriptSegment(BaseModel):
    """Schema for transcript segment"""
    speaker: str  # "agent" or "customer"
    text: str
    timestamp: float
    confidence: Optional[float] = None


class CallTranscriptResponse(BaseModel):
    """Response schema for call transcript"""
    call_id: str
    segments: List[TranscriptSegment]
    full_text: str
    language: str = "en"
    created_at: datetime


class CallRecordingResponse(BaseModel):
    """Response schema for call recording"""
    call_id: str
    recording_url: str
    duration_secs: int
    format: str = "mp3"
    size_bytes: Optional[int] = None
    expires_at: Optional[datetime] = None


class ScheduleCallRequest(BaseModel):
    """Request schema for scheduling a call"""
    phone_number: str
    agent_id: str
    scheduled_at: datetime
    timezone: str = "UTC"
    metadata: Optional[Dict[str, Any]] = None

    @validator('scheduled_at')
    def validate_future_time(cls, v):
        if v <= datetime.utcnow():
            raise ValueError("Scheduled time must be in the future")
        return v


class BulkCallRequest(BaseModel):
    """Request schema for bulk calls"""
    phone_numbers: List[str]
    agent_id: str
    scheduled_at: Optional[datetime] = None
    metadata: Optional[Dict[str, Any]] = None

    @validator('phone_numbers')
    def validate_phone_list(cls, v):
        if len(v) == 0:
            raise ValueError("At least one phone number is required")
        if len(v) > 100:
            raise ValueError("Maximum 100 phone numbers per bulk request")
        return v


class BulkCallResponse(BaseModel):
    """Response schema for bulk call creation"""
    total_requested: int
    calls_created: int
    failed: int
    call_ids: List[str]
    errors: Optional[List[Dict[str, str]]] = None
