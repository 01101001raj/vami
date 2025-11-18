from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
from datetime import datetime, timedelta
import secrets
from app.schemas.team import (
    TeamMemberResponse, InviteTeamMemberRequest, UpdateRoleRequest,
    TeamInvitationResponse, AcceptInvitationRequest, TeamStatsResponse,
    TeamPermissionsResponse, TeamPermission, TeamRole
)
from app.models.user import User
from app.api.deps import get_current_user
from app.database import get_supabase
from app.services.supabase_service import supabase_service
from app.services.email_service import email_service
from app.config import settings

router = APIRouter(prefix="/team", tags=["Team Management"])


async def require_admin(user: User = Depends(get_current_user)) -> User:
    """Dependency to require admin or owner role"""
    supabase = get_supabase()

    # Check if user is owner (organization creator)
    org_response = supabase.table("organizations").select("*").eq("owner_id", user.id).execute()
    if org_response.data:
        return user

    # Check if user is admin
    member_response = supabase.table("team_members").select("*").eq("user_id", user.id).execute()
    if member_response.data and member_response.data[0].get("role") == "admin":
        return user

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Admin or owner access required"
    )


async def get_user_organization_id(user: User) -> str:
    """Get the organization ID for the current user"""
    supabase = get_supabase()

    # Check if user owns an organization
    org_response = supabase.table("organizations").select("id").eq("owner_id", user.id).execute()
    if org_response.data:
        return org_response.data[0]["id"]

    # Check if user is a member of an organization
    member_response = supabase.table("team_members").select("organization_id").eq("user_id", user.id).execute()
    if member_response.data:
        return member_response.data[0]["organization_id"]

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="User is not part of any organization"
    )


@router.get("/members", response_model=List[TeamMemberResponse])
async def get_team_members(user: User = Depends(get_current_user)):
    """
    Get all team members in the organization
    """
    try:
        supabase = get_supabase()
        org_id = await get_user_organization_id(user)

        # Get all team members for the organization
        response = supabase.table("team_members").select(
            "*, users(email, full_name, avatar_url, last_active)"
        ).eq("organization_id", org_id).execute()

        members = []
        for member_data in response.data:
            user_data = member_data.get("users", {})
            members.append(TeamMemberResponse(
                id=member_data["user_id"],
                email=user_data.get("email", ""),
                full_name=user_data.get("full_name"),
                role=member_data["role"],
                avatar_url=user_data.get("avatar_url"),
                joined_at=member_data["joined_at"],
                last_active=user_data.get("last_active"),
                status=member_data.get("status", "active")
            ))

        # Add organization owner
        owner_response = supabase.table("organizations").select(
            "owner_id, users(email, full_name, avatar_url, last_active, created_at)"
        ).eq("id", org_id).execute()

        if owner_response.data:
            owner_data = owner_response.data[0]
            owner_user = owner_data.get("users", {})
            members.insert(0, TeamMemberResponse(
                id=owner_data["owner_id"],
                email=owner_user.get("email", ""),
                full_name=owner_user.get("full_name"),
                role=TeamRole.OWNER,
                avatar_url=owner_user.get("avatar_url"),
                joined_at=owner_user.get("created_at"),
                last_active=owner_user.get("last_active"),
                status="active"
            ))

        return members

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch team members: {str(e)}"
        )


@router.post("/invite", response_model=TeamInvitationResponse)
async def invite_team_member(
    request: InviteTeamMemberRequest,
    user: User = Depends(require_admin)
):
    """
    Invite a new team member (Admin/Owner only)
    """
    try:
        supabase = get_supabase()
        org_id = await get_user_organization_id(user)

        # Check if user is already a member
        existing_member = supabase.table("team_members").select("*").eq(
            "organization_id", org_id
        ).execute()

        member_emails = [m.get("users", {}).get("email") for m in existing_member.data]
        if request.email in member_emails:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User is already a team member"
            )

        # Check for pending invitation
        pending = supabase.table("team_invitations").select("*").eq(
            "organization_id", org_id
        ).eq("email", request.email).eq("status", "pending").execute()

        if pending.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="An invitation has already been sent to this email"
            )

        # Generate secure invitation token
        invitation_token = secrets.token_urlsafe(32)
        expires_at = datetime.utcnow() + timedelta(days=7)

        # Create invitation
        invitation_data = {
            "organization_id": org_id,
            "email": request.email,
            "role": request.role.value,
            "invited_by": user.id,
            "token": invitation_token,
            "expires_at": expires_at.isoformat(),
            "status": "pending",
            "message": request.message
        }

        invitation_response = supabase.table("team_invitations").insert(
            invitation_data
        ).execute()

        if not invitation_response.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create invitation"
            )

        invitation = invitation_response.data[0]

        # Send invitation email
        invitation_url = f"{settings.FRONTEND_URL}/team/accept-invitation?token={invitation_token}"

        try:
            await email_service.send_team_invitation(
                to_email=request.email,
                inviter_name=user.full_name or user.email,
                organization_name=user.company_name or "Vami AI",
                invitation_url=invitation_url,
                role=request.role.value,
                message=request.message
            )
        except Exception as email_error:
            # Log email error but don't fail the invitation
            print(f"Failed to send invitation email: {email_error}")

        return TeamInvitationResponse(
            id=invitation["id"],
            email=invitation["email"],
            role=TeamRole(invitation["role"]),
            invited_by=invitation["invited_by"],
            invited_by_name=user.full_name,
            created_at=invitation["created_at"],
            expires_at=invitation["expires_at"],
            status=invitation["status"],
            message=invitation.get("message")
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to invite team member: {str(e)}"
        )


@router.delete("/members/{user_id}")
async def remove_team_member(
    user_id: str,
    user: User = Depends(require_admin)
):
    """
    Remove a team member (Admin/Owner only)
    """
    try:
        supabase = get_supabase()
        org_id = await get_user_organization_id(user)

        # Check if trying to remove owner
        org_response = supabase.table("organizations").select("owner_id").eq("id", org_id).execute()
        if org_response.data and org_response.data[0]["owner_id"] == user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot remove organization owner"
            )

        # Remove team member
        delete_response = supabase.table("team_members").delete().eq(
            "organization_id", org_id
        ).eq("user_id", user_id).execute()

        if not delete_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Team member not found"
            )

        return {"message": "Team member removed successfully"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to remove team member: {str(e)}"
        )


@router.put("/members/{user_id}/role")
async def update_member_role(
    user_id: str,
    request: UpdateRoleRequest,
    user: User = Depends(require_admin)
):
    """
    Update team member role (Admin/Owner only)
    """
    try:
        supabase = get_supabase()
        org_id = await get_user_organization_id(user)

        # Check if trying to change owner role
        org_response = supabase.table("organizations").select("owner_id").eq("id", org_id).execute()
        if org_response.data and org_response.data[0]["owner_id"] == user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot change owner role"
            )

        # Update role
        update_response = supabase.table("team_members").update({
            "role": request.role.value
        }).eq("organization_id", org_id).eq("user_id", user_id).execute()

        if not update_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Team member not found"
            )

        return {"message": "Role updated successfully"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update role: {str(e)}"
        )


@router.post("/invitations/{token}/accept")
async def accept_invitation(token: str, request: AcceptInvitationRequest):
    """
    Accept a team invitation
    """
    try:
        supabase = get_supabase()

        # Get invitation
        invitation_response = supabase.table("team_invitations").select("*").eq(
            "token", token
        ).eq("status", "pending").execute()

        if not invitation_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Invalid or expired invitation"
            )

        invitation = invitation_response.data[0]

        # Check if expired
        if datetime.fromisoformat(invitation["expires_at"]) < datetime.utcnow():
            supabase.table("team_invitations").update({
                "status": "expired"
            }).eq("id", invitation["id"]).execute()

            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invitation has expired"
            )

        # Check if user already exists
        user_response = supabase.table("users").select("*").eq(
            "email", invitation["email"]
        ).execute()

        user_id = None
        if user_response.data:
            user_id = user_response.data[0]["id"]
        else:
            # Create a placeholder user (they'll need to complete registration)
            new_user = supabase.table("users").insert({
                "email": invitation["email"],
                "full_name": request.full_name,
                "status": "invited"
            }).execute()
            user_id = new_user.data[0]["id"]

        # Add to team members
        member_data = {
            "organization_id": invitation["organization_id"],
            "user_id": user_id,
            "role": invitation["role"],
            "joined_at": datetime.utcnow().isoformat(),
            "status": "active"
        }

        supabase.table("team_members").insert(member_data).execute()

        # Mark invitation as accepted
        supabase.table("team_invitations").update({
            "status": "accepted",
            "accepted_at": datetime.utcnow().isoformat()
        }).eq("id", invitation["id"]).execute()

        return {"message": "Invitation accepted successfully"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to accept invitation: {str(e)}"
        )


@router.get("/invitations", response_model=List[TeamInvitationResponse])
async def get_pending_invitations(user: User = Depends(get_current_user)):
    """
    Get all pending invitations for the organization
    """
    try:
        supabase = get_supabase()
        org_id = await get_user_organization_id(user)

        response = supabase.table("team_invitations").select(
            "*, users(full_name)"
        ).eq("organization_id", org_id).eq("status", "pending").execute()

        invitations = []
        for inv_data in response.data:
            inviter_data = inv_data.get("users", {})
            invitations.append(TeamInvitationResponse(
                id=inv_data["id"],
                email=inv_data["email"],
                role=TeamRole(inv_data["role"]),
                invited_by=inv_data["invited_by"],
                invited_by_name=inviter_data.get("full_name"),
                created_at=inv_data["created_at"],
                expires_at=inv_data["expires_at"],
                status=inv_data["status"],
                message=inv_data.get("message")
            ))

        return invitations

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch invitations: {str(e)}"
        )


@router.get("/stats", response_model=TeamStatsResponse)
async def get_team_stats(user: User = Depends(get_current_user)):
    """
    Get team statistics
    """
    try:
        supabase = get_supabase()
        org_id = await get_user_organization_id(user)

        # Get team members count
        members_response = supabase.table("team_members").select(
            "role, status", count="exact"
        ).eq("organization_id", org_id).execute()

        # Get pending invitations count
        invitations_response = supabase.table("team_invitations").select(
            "*", count="exact"
        ).eq("organization_id", org_id).eq("status", "pending").execute()

        # Calculate stats
        total_members = len(members_response.data) + 1  # +1 for owner
        active_members = len([m for m in members_response.data if m.get("status") == "active"]) + 1
        pending_invitations = len(invitations_response.data)

        # Roles breakdown
        roles_breakdown = {"owner": 1, "admin": 0, "member": 0}
        for member in members_response.data:
            role = member.get("role", "member")
            roles_breakdown[role] = roles_breakdown.get(role, 0) + 1

        return TeamStatsResponse(
            total_members=total_members,
            active_members=active_members,
            pending_invitations=pending_invitations,
            roles_breakdown=roles_breakdown
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch team stats: {str(e)}"
        )


@router.get("/permissions", response_model=TeamPermissionsResponse)
async def get_team_permissions():
    """
    Get team permissions matrix
    """
    permissions = [
        TeamPermission(
            action="manage_team",
            allowed_roles=[TeamRole.OWNER, TeamRole.ADMIN],
            description="Invite, remove, and manage team members"
        ),
        TeamPermission(
            action="manage_agents",
            allowed_roles=[TeamRole.OWNER, TeamRole.ADMIN],
            description="Create, edit, and delete AI agents"
        ),
        TeamPermission(
            action="view_analytics",
            allowed_roles=[TeamRole.OWNER, TeamRole.ADMIN, TeamRole.MEMBER],
            description="View analytics and reports"
        ),
        TeamPermission(
            action="make_calls",
            allowed_roles=[TeamRole.OWNER, TeamRole.ADMIN, TeamRole.MEMBER],
            description="Initiate and manage calls"
        ),
        TeamPermission(
            action="manage_billing",
            allowed_roles=[TeamRole.OWNER],
            description="Manage subscription and billing"
        ),
        TeamPermission(
            action="manage_integrations",
            allowed_roles=[TeamRole.OWNER, TeamRole.ADMIN],
            description="Connect and manage integrations"
        ),
        TeamPermission(
            action="manage_calendar",
            allowed_roles=[TeamRole.OWNER, TeamRole.ADMIN, TeamRole.MEMBER],
            description="Manage calendar and appointments"
        ),
    ]

    return TeamPermissionsResponse(permissions=permissions)
