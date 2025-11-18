from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime
from enum import Enum


class AgentStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"
    DELETED = "deleted"



class Agent(BaseModel):
    id: int
    user_id: str
    agent_id: str  # ElevenLabs agent ID
    agent_name: str
    status: AgentStatus = AgentStatus.ACTIVE
    elevenlabs_metadata: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True