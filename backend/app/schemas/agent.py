from pydantic import BaseModel
from typing import Optional, Dict, Any
from app.models.agent import AgentStatus


class AgentCreate(BaseModel):
    agent_name: str
    prompt: Optional[str] = None
    voice_id: Optional[str] = None


class AgentUpdate(BaseModel):
    agent_name: Optional[str] = None
    status: Optional[AgentStatus] = None


class AgentResponse(BaseModel):
    id: int
    user_id: str
    agent_id: str
    agent_name: str
    status: AgentStatus
    elevenlabs_metadata: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True
