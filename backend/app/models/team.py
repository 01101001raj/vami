from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from enum import Enum


class TeamRole(str, Enum):
    ADMIN = "admin"
    EDITOR = "editor"
    VIEWER = "viewer"


class TeamMember(BaseModel):
    id: int
    user_id: str  # Account owner
    member_user_id: str  # Team member's user ID
    email: EmailStr
    role: TeamRole = TeamRole.VIEWER
    status: str = "active"  # active, invited, suspended
    invited_at: datetime
    joined_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True