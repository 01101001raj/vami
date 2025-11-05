from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from enum import Enum


class CalendarProvider(str, Enum):
    GOOGLE = "google"
    MICROSOFT = "microsoft"


class CalendarConnection(BaseModel):
    id: int
    user_id: str
    provider: CalendarProvider = CalendarProvider.GOOGLE
    calendar_id: Optional[str] = None
    access_token: Optional[str] = None
    refresh_token: Optional[str] = None
    token_expires_at: Optional[datetime] = None
    status: str = "active"  # active, expired, disconnected
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True