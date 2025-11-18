from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
from datetime import datetime, timedelta
import secrets
import hashlib
from app.schemas.settings import (
    SettingsResponse, UpdateSettingsRequest, UserProfileUpdate,
    UpdatePasswordRequest, APIKeyCreate, APIKeyResponse,
    WebhookEndpoint, WebhookEndpointResponse, NotificationSettings,
    VoiceSettings, AIModelSettings, IntegrationSettings,
    SecuritySettings, DataExportRequest, DataExportResponse,
    AccountDeletionRequest, BillingPreferences, UsageQuotasResponse,
    UsageQuota
)
from app.models.user import User
from app.api.deps import get_current_user
from app.database import get_supabase
from app.services.supabase_service import supabase_service

router = APIRouter(prefix="/settings", tags=["Settings Management"])


@router.get("", response_model=SettingsResponse)
async def get_settings(user: User = Depends(get_current_user)):
    """
    Get all user settings
    """
    try:
        supabase = get_supabase()

        # Get notification settings
        notif_response = supabase.table("notification_settings").select("*").eq(
            "user_id", user.id
        ).execute()

        notifications = [
            NotificationSettings(**n) for n in notif_response.data
        ] if notif_response.data else []

        # Get voice settings
        voice_response = supabase.table("voice_settings").select("*").eq(
            "user_id", user.id
        ).execute()

        voice_settings = VoiceSettings(
            **voice_response.data[0]
        ) if voice_response.data else VoiceSettings()

        # Get AI model settings
        ai_response = supabase.table("ai_model_settings").select("*").eq(
            "user_id", user.id
        ).execute()

        ai_model_settings = AIModelSettings(
            **ai_response.data[0]
        ) if ai_response.data else AIModelSettings()

        # Get integrations
        integrations_response = supabase.table("integration_settings").select("*").eq(
            "user_id", user.id
        ).execute()

        integrations = [
            IntegrationSettings(**i) for i in integrations_response.data
        ] if integrations_response.data else []

        # Get API keys count
        api_keys_response = supabase.table("api_keys").select(
            "*", count="exact"
        ).eq("user_id", user.id).eq("is_active", True).execute()

        api_keys_count = api_keys_response.count or 0

        # Get webhooks count
        webhooks_response = supabase.table("webhook_endpoints").select(
            "*", count="exact"
        ).eq("user_id", user.id).eq("is_active", True).execute()

        webhooks_count = webhooks_response.count or 0

        # User profile
        user_profile = {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "company_name": user.company_name,
            "phone_number": user.phone_number,
            "avatar_url": user.avatar_url,
            "timezone": user.timezone,
            "language": user.language
        }

        return SettingsResponse(
            user_profile=user_profile,
            notifications=notifications,
            voice_settings=voice_settings,
            ai_model_settings=ai_model_settings,
            integrations=integrations,
            api_keys_count=api_keys_count,
            webhooks_count=webhooks_count
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch settings: {str(e)}"
        )


@router.put("", response_model=SettingsResponse)
async def update_settings(
    request: UpdateSettingsRequest,
    user: User = Depends(get_current_user)
):
    """
    Update user settings
    """
    try:
        supabase = get_supabase()

        # Update notification settings
        if request.notifications is not None:
            # Delete existing and insert new
            supabase.table("notification_settings").delete().eq(
                "user_id", user.id
            ).execute()

            for notif in request.notifications:
                supabase.table("notification_settings").insert({
                    "user_id": user.id,
                    **notif.dict()
                }).execute()

        # Update voice settings
        if request.voice_settings is not None:
            voice_data = request.voice_settings.dict(exclude_none=True)
            voice_data["user_id"] = user.id

            # Upsert
            existing = supabase.table("voice_settings").select("*").eq(
                "user_id", user.id
            ).execute()

            if existing.data:
                supabase.table("voice_settings").update(voice_data).eq(
                    "user_id", user.id
                ).execute()
            else:
                supabase.table("voice_settings").insert(voice_data).execute()

        # Update AI model settings
        if request.ai_model_settings is not None:
            ai_data = request.ai_model_settings.dict(exclude_none=True)
            ai_data["user_id"] = user.id

            # Upsert
            existing = supabase.table("ai_model_settings").select("*").eq(
                "user_id", user.id
            ).execute()

            if existing.data:
                supabase.table("ai_model_settings").update(ai_data).eq(
                    "user_id", user.id
                ).execute()
            else:
                supabase.table("ai_model_settings").insert(ai_data).execute()

        # Update integration settings
        if request.integrations is not None:
            for integration in request.integrations:
                supabase.table("integration_settings").upsert({
                    "user_id": user.id,
                    **integration.dict()
                }).execute()

        # Return updated settings
        return await get_settings(user)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update settings: {str(e)}"
        )


@router.put("/profile")
async def update_profile(
    request: UserProfileUpdate,
    user: User = Depends(get_current_user)
):
    """
    Update user profile
    """
    try:
        update_data = request.dict(exclude_none=True)

        if update_data:
            await supabase_service.update_user(user.id, update_data)

        return {"message": "Profile updated successfully"}

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update profile: {str(e)}"
        )


@router.put("/password")
async def update_password(
    request: UpdatePasswordRequest,
    user: User = Depends(get_current_user)
):
    """
    Change user password
    """
    try:
        supabase = get_supabase()

        # Verify current password by attempting to sign in
        try:
            supabase.auth.sign_in_with_password({
                "email": user.email,
                "password": request.current_password
            })
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect"
            )

        # Update password
        supabase.auth.update_user({
            "password": request.new_password
        })

        return {"message": "Password updated successfully"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update password: {str(e)}"
        )


@router.get("/api-keys", response_model=List[APIKeyResponse])
async def get_api_keys(user: User = Depends(get_current_user)):
    """
    Get all API keys for the user
    """
    try:
        supabase = get_supabase()

        response = supabase.table("api_keys").select("*").eq(
            "user_id", user.id
        ).order("created_at", desc=True).execute()

        api_keys = []
        for key_data in response.data:
            # Only show preview of the key
            full_key = key_data["api_key"]
            key_preview = f"{full_key[:8]}...{full_key[-4:]}"

            api_keys.append(APIKeyResponse(
                id=key_data["id"],
                user_id=key_data["user_id"],
                name=key_data["name"],
                description=key_data.get("description"),
                key_preview=key_preview,
                permissions=key_data.get("permissions"),
                created_at=key_data["created_at"],
                expires_at=key_data.get("expires_at"),
                last_used_at=key_data.get("last_used_at"),
                is_active=key_data.get("is_active", True)
            ))

        return api_keys

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch API keys: {str(e)}"
        )


@router.post("/api-keys", response_model=APIKeyResponse)
async def create_api_key(
    request: APIKeyCreate,
    user: User = Depends(get_current_user)
):
    """
    Create a new API key
    """
    try:
        supabase = get_supabase()

        # Generate secure API key
        api_key = f"vami_{secrets.token_urlsafe(32)}"

        # Hash the key for storage
        key_hash = hashlib.sha256(api_key.encode()).hexdigest()

        key_data = {
            "user_id": user.id,
            "name": request.name,
            "description": request.description,
            "api_key": key_hash,  # Store hash
            "permissions": request.permissions,
            "created_at": datetime.utcnow().isoformat(),
            "is_active": True
        }

        if request.expires_in_days:
            expires_at = datetime.utcnow() + timedelta(days=request.expires_in_days)
            key_data["expires_at"] = expires_at.isoformat()

        response = supabase.table("api_keys").insert(key_data).execute()

        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create API key"
            )

        key = response.data[0]
        key_preview = f"{api_key[:8]}...{api_key[-4:]}"

        return APIKeyResponse(
            id=key["id"],
            user_id=key["user_id"],
            name=key["name"],
            description=key.get("description"),
            key_preview=key_preview,
            full_key=api_key,  # Only return full key on creation
            permissions=key.get("permissions"),
            created_at=key["created_at"],
            expires_at=key.get("expires_at"),
            last_used_at=key.get("last_used_at"),
            is_active=key["is_active"]
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create API key: {str(e)}"
        )


@router.delete("/api-keys/{key_id}")
async def delete_api_key(
    key_id: str,
    user: User = Depends(get_current_user)
):
    """
    Delete an API key
    """
    try:
        supabase = get_supabase()

        response = supabase.table("api_keys").delete().eq(
            "id", key_id
        ).eq("user_id", user.id).execute()

        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="API key not found"
            )

        return {"message": "API key deleted successfully"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete API key: {str(e)}"
        )


@router.get("/webhooks", response_model=List[WebhookEndpointResponse])
async def get_webhooks(user: User = Depends(get_current_user)):
    """
    Get all webhook endpoints
    """
    try:
        supabase = get_supabase()

        response = supabase.table("webhook_endpoints").select("*").eq(
            "user_id", user.id
        ).execute()

        webhooks = []
        for webhook_data in response.data:
            secret_preview = None
            if webhook_data.get("secret"):
                secret_preview = f"{webhook_data['secret'][:8]}..."

            webhooks.append(WebhookEndpointResponse(
                id=webhook_data["id"],
                user_id=webhook_data["user_id"],
                url=webhook_data["url"],
                events=webhook_data["events"],
                secret_preview=secret_preview,
                is_active=webhook_data["is_active"],
                created_at=webhook_data["created_at"],
                last_triggered_at=webhook_data.get("last_triggered_at"),
                success_count=webhook_data.get("success_count", 0),
                failure_count=webhook_data.get("failure_count", 0)
            ))

        return webhooks

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch webhooks: {str(e)}"
        )


@router.post("/webhooks", response_model=WebhookEndpointResponse)
async def create_webhook(
    request: WebhookEndpoint,
    user: User = Depends(get_current_user)
):
    """
    Create a new webhook endpoint
    """
    try:
        supabase = get_supabase()

        # Generate webhook secret if not provided
        secret = request.secret or secrets.token_urlsafe(32)

        webhook_data = {
            "user_id": user.id,
            "url": request.url,
            "events": request.events,
            "secret": secret,
            "is_active": request.is_active,
            "created_at": datetime.utcnow().isoformat(),
            "success_count": 0,
            "failure_count": 0
        }

        response = supabase.table("webhook_endpoints").insert(webhook_data).execute()

        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create webhook"
            )

        webhook = response.data[0]
        secret_preview = f"{secret[:8]}..."

        return WebhookEndpointResponse(
            id=webhook["id"],
            user_id=webhook["user_id"],
            url=webhook["url"],
            events=webhook["events"],
            secret_preview=secret_preview,
            is_active=webhook["is_active"],
            created_at=webhook["created_at"],
            last_triggered_at=webhook.get("last_triggered_at"),
            success_count=webhook["success_count"],
            failure_count=webhook["failure_count"]
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create webhook: {str(e)}"
        )


@router.delete("/webhooks/{webhook_id}")
async def delete_webhook(
    webhook_id: str,
    user: User = Depends(get_current_user)
):
    """
    Delete a webhook endpoint
    """
    try:
        supabase = get_supabase()

        response = supabase.table("webhook_endpoints").delete().eq(
            "id", webhook_id
        ).eq("user_id", user.id).execute()

        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Webhook not found"
            )

        return {"message": "Webhook deleted successfully"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete webhook: {str(e)}"
        )


@router.post("/export-data", response_model=DataExportResponse)
async def request_data_export(
    request: DataExportRequest,
    user: User = Depends(get_current_user)
):
    """
    Request data export
    """
    try:
        supabase = get_supabase()

        # Create export job
        export_data = {
            "user_id": user.id,
            "status": "pending",
            "config": request.dict(),
            "created_at": datetime.utcnow().isoformat()
        }

        response = supabase.table("data_exports").insert(export_data).execute()

        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create export request"
            )

        export = response.data[0]

        # TODO: Trigger async job to generate export

        return DataExportResponse(
            export_id=export["id"],
            status=export["status"],
            created_at=export["created_at"]
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to request data export: {str(e)}"
        )


@router.get("/usage-quotas", response_model=UsageQuotasResponse)
async def get_usage_quotas(user: User = Depends(get_current_user)):
    """
    Get usage quotas for current billing period
    """
    try:
        from dateutil.relativedelta import relativedelta
        from datetime import date

        # Calculate billing period
        today = date.today()
        period_start = datetime.combine(today.replace(day=1), datetime.min.time())
        period_end = period_start + relativedelta(months=1) - timedelta(seconds=1)

        # Get usage stats
        usage_stats = await supabase_service.get_usage_for_period(
            user.id, period_start.date(), period_end.date()
        )

        # Get plan limits
        features = user.features.dict() if hasattr(user.features, 'dict') else user.features

        quotas = []

        # Minutes quota
        minutes_limit = features.get("minutes_limit", 0)
        minutes_used = usage_stats or 0
        quotas.append(UsageQuota(
            resource="minutes",
            used=minutes_used,
            limit=minutes_limit,
            unit="minutes",
            reset_at=period_end,
            percentage_used=(minutes_used / minutes_limit * 100) if minutes_limit > 0 else 0
        ))

        # Check if trial
        is_trial = user.subscription_status == "trialing"
        days_remaining = None

        if is_trial and user.trial_end_date:
            trial_end = datetime.fromisoformat(user.trial_end_date) if isinstance(user.trial_end_date, str) else user.trial_end_date
            days_remaining = (trial_end - datetime.utcnow()).days

        return UsageQuotasResponse(
            quotas=quotas,
            billing_period_start=period_start,
            billing_period_end=period_end,
            is_trial=is_trial,
            days_remaining=days_remaining
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch usage quotas: {str(e)}"
        )


@router.delete("/account")
async def delete_account(
    request: AccountDeletionRequest,
    user: User = Depends(get_current_user)
):
    """
    Delete user account (irreversible)
    """
    try:
        supabase = get_supabase()

        # Verify password
        try:
            supabase.auth.sign_in_with_password({
                "email": user.email,
                "password": request.password
            })
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password is incorrect"
            )

        # Mark account for deletion
        # In production, this would trigger an async job to delete all user data
        await supabase_service.update_user(user.id, {
            "status": "pending_deletion",
            "deletion_requested_at": datetime.utcnow().isoformat(),
            "deletion_reason": request.reason
        })

        # Sign out user
        supabase.auth.sign_out()

        return {
            "message": "Account deletion initiated. Your data will be permanently deleted within 30 days."
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete account: {str(e)}"
        )
