from fastapi import APIRouter, Depends, HTTPException
from app.services.calendar_service import calendar_service
from app.services.supabase_service import supabase_service
from app.api.deps import get_current_user
from app.models.user import User
import secrets

router = APIRouter(prefix="/integrations", tags=["Integrations"])


@router.get("/google/auth-url")
async def get_google_auth_url(user: User = Depends(get_current_user)):
    """Get Google OAuth authorization URL"""
    state = secrets.token_urlsafe(32)
    # Store state in session/cache for verification
    auth_url = calendar_service.get_authorization_url(state)
    return {"auth_url": auth_url, "state": state}


@router.post("/google/callback")
async def google_callback(code: str, user: User = Depends(get_current_user)):
    """Handle Google OAuth callback"""
    try:
        tokens = await calendar_service.exchange_code_for_tokens(code)

        # Get user's calendars
        calendars = await calendar_service.list_calendars(tokens["access_token"])

        # Save connection (using primary calendar by default)
        primary_calendar = next((cal for cal in calendars if cal.get("primary")), calendars[0] if calendars else None)

        if primary_calendar:
            await supabase_service.save_calendar_connection(
                user_id=user.id,
                provider="google",
                calendar_id=primary_calendar["id"],
                access_token=tokens["access_token"],
                refresh_token=tokens["refresh_token"],
                expires_at=tokens["token_expires_at"]
            )

        return {"status": "connected", "calendars": calendars}

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to connect calendar: {str(e)}")


@router.get("/google/calendars")
async def list_calendars(user: User = Depends(get_current_user)):
    """List user's Google calendars"""
    connection = await supabase_service.get_calendar_connection(user.id)
    if not connection:
        raise HTTPException(status_code=404, detail="Calendar not connected")

    calendars = await calendar_service.list_calendars(connection["access_token"])
    return {"calendars": calendars}


@router.delete("/google/disconnect")
async def disconnect_google(user: User = Depends(get_current_user)):
    """Disconnect Google Calendar"""
    connection = await supabase_service.get_calendar_connection(user.id)
    if connection:
        await supabase_service.update_calendar_connection(connection["id"], {"status": "disconnected"})

    return {"status": "disconnected"}
