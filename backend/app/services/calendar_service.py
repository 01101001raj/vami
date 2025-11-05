from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from app.config import settings


class CalendarService:
    SCOPES = ['https://www.googleapis.com/auth/calendar']

    def __init__(self):
        self.client_config = {
            "web": {
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "redirect_uris": [settings.GOOGLE_REDIRECT_URI],
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
            }
        }

    def get_authorization_url(self, state: str) -> str:
        """Generate Google OAuth authorization URL"""
        flow = Flow.from_client_config(
            self.client_config,
            scopes=self.SCOPES,
            redirect_uri=settings.GOOGLE_REDIRECT_URI
        )

        authorization_url, _ = flow.authorization_url(
            access_type='offline',
            include_granted_scopes='true',
            state=state,
            prompt='consent'  # Force consent to get refresh token
        )

        return authorization_url

    async def exchange_code_for_tokens(self, code: str) -> Dict[str, Any]:
        """Exchange authorization code for access and refresh tokens"""
        flow = Flow.from_client_config(
            self.client_config,
            scopes=self.SCOPES,
            redirect_uri=settings.GOOGLE_REDIRECT_URI
        )

        flow.fetch_token(code=code)
        credentials = flow.credentials

        return {
            "access_token": credentials.token,
            "refresh_token": credentials.refresh_token,
            "token_expires_at": credentials.expiry,
            "scopes": credentials.scopes
        }

    def refresh_access_token(self, refresh_token: str) -> Dict[str, Any]:
        """Refresh access token using refresh token"""
        credentials = Credentials(
            token=None,
            refresh_token=refresh_token,
            token_uri=self.client_config["web"]["token_uri"],
            client_id=settings.GOOGLE_CLIENT_ID,
            client_secret=settings.GOOGLE_CLIENT_SECRET,
            scopes=self.SCOPES
        )

        credentials.refresh(Request())

        return {
            "access_token": credentials.token,
            "token_expires_at": credentials.expiry
        }

    def _get_calendar_service(self, access_token: str):
        """Get authenticated calendar service"""
        credentials = Credentials(token=access_token)
        return build('calendar', 'v3', credentials=credentials)

    async def list_calendars(self, access_token: str) -> List[Dict[str, Any]]:
        """List user's calendars"""
        service = self._get_calendar_service(access_token)
        calendar_list = service.calendarList().list().execute()

        return [
            {
                "id": cal["id"],
                "summary": cal["summary"],
                "primary": cal.get("primary", False)
            }
            for cal in calendar_list.get("items", [])
        ]

    async def create_event(
        self,
        access_token: str,
        calendar_id: str,
        summary: str,
        description: str,
        start_time: datetime,
        end_time: datetime,
        attendee_emails: List[str] = None,
        timezone: str = "America/New_York"
    ) -> Dict[str, Any]:
        """Create a calendar event"""
        service = self._get_calendar_service(access_token)

        event = {
            "summary": summary,
            "description": description,
            "start": {
                "dateTime": start_time.isoformat(),
                "timeZone": timezone,
            },
            "end": {
                "dateTime": end_time.isoformat(),
                "timeZone": timezone,
            },
            "reminders": {
                "useDefault": False,
                "overrides": [
                    {"method": "email", "minutes": 24 * 60},  # 1 day before
                    {"method": "popup", "minutes": 60},  # 1 hour before
                ],
            },
        }

        if attendee_emails:
            event["attendees"] = [{"email": email} for email in attendee_emails]

        created_event = service.events().insert(
            calendarId=calendar_id,
            body=event,
            sendUpdates='all'  # Send email notifications
        ).execute()

        return {
            "event_id": created_event["id"],
            "htmlLink": created_event.get("htmlLink"),
            "start": created_event["start"],
            "end": created_event["end"]
        }

    async def check_availability(
        self,
        access_token: str,
        calendar_id: str,
        date: str,
        timezone: str = "America/New_York"
    ) -> List[Dict[str, str]]:
        """Check available time slots for a given date"""
        service = self._get_calendar_service(access_token)

        # Parse date and get start/end of day
        target_date = datetime.fromisoformat(date)
        time_min = target_date.replace(hour=8, minute=0, second=0)
        time_max = target_date.replace(hour=18, minute=0, second=0)

        # Get existing events
        events_result = service.events().list(
            calendarId=calendar_id,
            timeMin=time_min.isoformat() + 'Z',
            timeMax=time_max.isoformat() + 'Z',
            singleEvents=True,
            orderBy='startTime'
        ).execute()

        events = events_result.get('items', [])

        # Calculate available slots (30-minute slots)
        available_slots = []
        current_time = time_min

        while current_time < time_max:
            slot_end = current_time + timedelta(minutes=30)

            # Check if slot conflicts with any event
            is_available = True
            for event in events:
                event_start = datetime.fromisoformat(event['start'].get('dateTime', event['start'].get('date')))
                event_end = datetime.fromisoformat(event['end'].get('dateTime', event['end'].get('date')))

                if not (slot_end <= event_start or current_time >= event_end):
                    is_available = False
                    break

            if is_available:
                available_slots.append({
                    "start": current_time.strftime("%H:%M"),
                    "end": slot_end.strftime("%H:%M")
                })

            current_time = slot_end

        return available_slots

    async def cancel_event(
        self,
        access_token: str,
        calendar_id: str,
        event_id: str
    ) -> bool:
        """Cancel a calendar event"""
        service = self._get_calendar_service(access_token)

        try:
            service.events().delete(
                calendarId=calendar_id,
                eventId=event_id,
                sendUpdates='all'
            ).execute()
            return True
        except Exception:
            return False


# Singleton instance
calendar_service = CalendarService()
