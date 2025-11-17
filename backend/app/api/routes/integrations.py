from fastapi import APIRouter, Depends, HTTPException
from app.services.calendar_service import calendar_service
from app.services.supabase_service import supabase_service
from app.api.deps import get_current_user
from app.models.user import User
import secrets
from datetime import datetime, timedelta

router = APIRouter(prefix="/integrations", tags=["Integrations"])

# In-memory state storage (use Redis in production)
oauth_states = {}


@router.get("/google/auth-url")
async def get_google_auth_url(user: User = Depends(get_current_user)):
    """Get Google OAuth authorization URL"""
    state = secrets.token_urlsafe(32)
    # Store state with user_id and expiration (5 minutes)
    oauth_states[state] = {
        "user_id": str(user.id),
        "expires_at": datetime.utcnow() + timedelta(minutes=5)
    }
    auth_url = calendar_service.get_authorization_url(state)
    return {"auth_url": auth_url, "state": state}


@router.post("/google/callback")
async def google_callback(code: str, state: str, user: User = Depends(get_current_user)):
    """Handle Google OAuth callback"""
    try:
        # Validate state token
        if state not in oauth_states:
            raise HTTPException(status_code=400, detail="Invalid or expired state token")

        stored_state = oauth_states[state]

        # Check expiration
        if datetime.utcnow() > stored_state["expires_at"]:
            del oauth_states[state]
            raise HTTPException(status_code=400, detail="State token expired")

        # Verify user_id matches
        if stored_state["user_id"] != str(user.id):
            raise HTTPException(status_code=403, detail="State token mismatch")

        # Delete state after successful validation
        del oauth_states[state]

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
