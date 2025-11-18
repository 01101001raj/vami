from pydantic import BaseModel, EmailStr, validator
from typing import Optional, List
from datetime import datetime
from enum import Enum


class TeamRole(str, Enum):
    """Team member roles with hierarchical permissions"""
    OWNER = "owner"
    ADMIN = "admin"
    MEMBER = "member"


class TeamMemberBase(BaseModel):
    """Base team member schema"""
    email: EmailStr
    role: TeamRole


class TeamMemberResponse(BaseModel):
    """Response schema for team member"""
    id: str
    email: str
    full_name: Optional[str] = None
    role: TeamRole
    avatar_url: Optional[str] = None
    joined_at: datetime
    last_active: Optional[datetime] = None
    status: str = "active"  # active, inactive, pending

    class Config:
        from_attributes = True


class InviteTeamMemberRequest(BaseModel):
    """Request schema for inviting team member"""
    email: EmailStr
    role: TeamRole
    message: Optional[str] = None

    @validator('role')
    def validate_role(cls, v):
        if v == TeamRole.OWNER:
            raise ValueError("Cannot invite a member with owner role")
        return v


class UpdateRoleRequest(BaseModel):
    """Request schema for updating team member role"""
    role: TeamRole

    @validator('role')
    def validate_role(cls, v):
        if v == TeamRole.OWNER:
            raise ValueError("Cannot assign owner role through this endpoint")
        return v


class TeamInvitationResponse(BaseModel):
    """Response schema for team invitation"""
    id: str
    email: str
    role: TeamRole
    invited_by: str
    invited_by_name: Optional[str] = None
    created_at: datetime
    expires_at: datetime
    status: str  # pending, accepted, expired, revoked
    message: Optional[str] = None

    class Config:
        from_attributes = True


class AcceptInvitationRequest(BaseModel):
    """Request schema for accepting invitation"""
    token: str
    full_name: Optional[str] = None


class TeamStatsResponse(BaseModel):
    """Response schema for team statistics"""
    total_members: int
    active_members: int
    pending_invitations: int
    roles_breakdown: dict  # {role: count}


class TeamPermission(BaseModel):
    """Team permission definition"""
    action: str
    allowed_roles: List[TeamRole]
    description: str


class TeamPermissionsResponse(BaseModel):
    """Response schema for team permissions matrix"""
    permissions: List[TeamPermission]
