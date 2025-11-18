"""
Agent Actions API - Endpoints that ElevenLabs AI agents can call during conversations
These endpoints don't require user authentication but use agent-specific tokens
"""

from fastapi import APIRouter, HTTPException, status, Header
from typing import List, Optional
from datetime import datetime, timedelta, date
from pydantic import BaseModel
from app.database import get_supabase
from app.schemas.calendar import AppointmentStatus
import hmac
import hashlib

router = APIRouter(prefix="/agent-actions", tags=["Agent Actions"])


class CheckAvailabilityRequest(BaseModel):
    """Request to check appointment availability"""
    date: str  # YYYY-MM-DD format
    time: Optional[str] = None  # HH:MM format (optional)
    duration_minutes: int = 30


class AvailableSlot(BaseModel):
    """Available time slot"""
    date: str
    start_time: str
    end_time: str
    available: bool


class BookAppointmentRequest(BaseModel):
    """Request to book an appointment"""
    date: str  # YYYY-MM-DD
    start_time: str  # HH:MM
    duration_minutes: int
    customer_name: str
    customer_phone: str
    customer_email: Optional[str] = None
    notes: Optional[str] = None


def verify_agent_token(agent_token: str, agent_id: str) -> bool:
    """Verify that the agent token is valid for the given agent"""
    try:
        supabase = get_supabase()

        # Get agent from database
        agent_response = supabase.table("agents").select("*").eq(
            "agent_id", agent_id
        ).execute()

        if not agent_response.data:
            return False

        agent = agent_response.data[0]
        expected_token = agent.get("api_token")

        # Constant-time comparison to prevent timing attacks
        return hmac.compare_digest(agent_token, expected_token) if expected_token else False

    except Exception:
        return False


@router.post("/check-availability/{agent_id}")
async def check_availability(
    agent_id: str,
    request: CheckAvailabilityRequest,
    x_agent_token: str = Header(..., alias="X-Agent-Token")
):
    """
    Check appointment availability for a specific date/time

    This endpoint is called by ElevenLabs AI agents during phone conversations
    to check if appointments are available.

    Example conversation:
    Customer: "Do you have any appointments available on December 15th?"
    AI Agent: *calls this endpoint* "Yes, we have slots at 9am, 11am, and 2pm available."
    """
    try:
        # Verify agent authentication
        if not verify_agent_token(x_agent_token, agent_id):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid agent token"
            )

        supabase = get_supabase()

        # Get agent's user_id (clinic/business owner)
        agent_response = supabase.table("agents").select("user_id").eq(
            "agent_id", agent_id
        ).execute()

        if not agent_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Agent not found"
            )

        user_id = agent_response.data[0]["user_id"]

        # Parse date
        try:
            check_date = datetime.strptime(request.date, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid date format. Use YYYY-MM-DD"
            )

        # Get business hours for this user
        settings_response = supabase.table("calendar_settings").select("*").eq(
            "user_id", user_id
        ).execute()

        # Default business hours (9 AM to 5 PM)
        business_hours = {
            "start": "09:00",
            "end": "17:00",
            "slot_duration": request.duration_minutes
        }

        if settings_response.data:
            settings = settings_response.data[0]
            business_hours["slot_duration"] = settings.get("slot_duration_minutes", 30)

        # Build datetime range for the day
        start_of_day = datetime.combine(check_date, datetime.strptime(business_hours["start"], "%H:%M").time())
        end_of_day = datetime.combine(check_date, datetime.strptime(business_hours["end"], "%H:%M").time())

        # Get existing appointments for this day
        appointments_response = supabase.table("appointments").select("*").eq(
            "user_id", user_id
        ).gte("start_time", start_of_day.isoformat()).lte(
            "start_time", end_of_day.isoformat()
        ).not_.in_("status", [AppointmentStatus.CANCELLED.value]).execute()

        booked_appointments = appointments_response.data

        # Generate available time slots
        available_slots = []
        current_time = start_of_day
        slot_duration = timedelta(minutes=business_hours["slot_duration"])

        while current_time < end_of_day:
            slot_end = current_time + slot_duration

            # Check if this slot conflicts with any booked appointment
            is_available = True
            for appt in booked_appointments:
                appt_start = datetime.fromisoformat(appt["start_time"])
                appt_end = datetime.fromisoformat(appt["end_time"])

                # Check for overlap
                if current_time < appt_end and slot_end > appt_start:
                    is_available = False
                    break

            available_slots.append(AvailableSlot(
                date=request.date,
                start_time=current_time.strftime("%H:%M"),
                end_time=slot_end.strftime("%H:%M"),
                available=is_available
            ))

            current_time = slot_end

        # Filter to only available slots
        available_only = [slot for slot in available_slots if slot.available]

        return {
            "date": request.date,
            "total_slots": len(available_slots),
            "available_slots": len(available_only),
            "slots": available_only[:10],  # Return first 10 available slots
            "message": f"Found {len(available_only)} available slots on {request.date}"
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to check availability: {str(e)}"
        )


@router.post("/book-appointment/{agent_id}")
async def book_appointment(
    agent_id: str,
    request: BookAppointmentRequest,
    x_agent_token: str = Header(..., alias="X-Agent-Token")
):
    """
    Book an appointment

    Called by ElevenLabs AI agents to book appointments during conversations.

    Example conversation:
    Customer: "I'd like to book the 2pm slot on December 15th"
    AI Agent: *calls this endpoint* "Great! I've booked your appointment for 2pm on December 15th."
    """
    try:
        # Verify agent authentication
        if not verify_agent_token(x_agent_token, agent_id):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid agent token"
            )

        supabase = get_supabase()

        # Get agent's user_id
        agent_response = supabase.table("agents").select("user_id").eq(
            "agent_id", agent_id
        ).execute()

        if not agent_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Agent not found"
            )

        user_id = agent_response.data[0]["user_id"]

        # Parse date and time
        try:
            appt_date = datetime.strptime(request.date, "%Y-%m-%d").date()
            appt_time = datetime.strptime(request.start_time, "%H:%M").time()
            start_datetime = datetime.combine(appt_date, appt_time)
            end_datetime = start_datetime + timedelta(minutes=request.duration_minutes)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid date/time format"
            )

        # Check if slot is still available
        existing_appts = supabase.table("appointments").select("*").eq(
            "user_id", user_id
        ).gte("start_time", start_datetime.isoformat()).lte(
            "start_time", end_datetime.isoformat()
        ).not_.in_("status", [AppointmentStatus.CANCELLED.value]).execute()

        if existing_appts.data:
            # Slot is already booked
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This time slot is no longer available"
            )

        # Create appointment
        appointment_data = {
            "user_id": user_id,
            "title": f"Appointment - {request.customer_name}",
            "description": request.notes,
            "start_time": start_datetime.isoformat(),
            "end_time": end_datetime.isoformat(),
            "timezone": "UTC",
            "status": AppointmentStatus.SCHEDULED.value,
            "attendee_name": request.customer_name,
            "attendee_phone": request.customer_phone,
            "attendee_email": request.customer_email,
            "send_reminders": True,
            "metadata": {
                "booked_via": "voice_ai",
                "agent_id": agent_id
            },
            "created_at": datetime.utcnow().isoformat()
        }

        appointment_response = supabase.table("appointments").insert(
            appointment_data
        ).execute()

        if not appointment_response.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create appointment"
            )

        appointment = appointment_response.data[0]

        # TODO: Send confirmation email/SMS to customer

        return {
            "success": True,
            "appointment_id": appointment["id"],
            "date": request.date,
            "start_time": request.start_time,
            "duration_minutes": request.duration_minutes,
            "customer_name": request.customer_name,
            "message": f"Appointment booked successfully for {request.customer_name} on {request.date} at {request.start_time}"
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to book appointment: {str(e)}"
        )


@router.get("/appointments/{agent_id}/today")
async def get_todays_appointments(
    agent_id: str,
    x_agent_token: str = Header(..., alias="X-Agent-Token")
):
    """
    Get today's appointments

    Useful for the AI agent to know what appointments are coming up today.
    """
    try:
        if not verify_agent_token(x_agent_token, agent_id):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid agent token"
            )

        supabase = get_supabase()

        agent_response = supabase.table("agents").select("user_id").eq(
            "agent_id", agent_id
        ).execute()

        if not agent_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Agent not found"
            )

        user_id = agent_response.data[0]["user_id"]

        # Get today's date range
        today = date.today()
        start_of_day = datetime.combine(today, datetime.min.time())
        end_of_day = datetime.combine(today, datetime.max.time())

        # Get appointments
        appointments = supabase.table("appointments").select("*").eq(
            "user_id", user_id
        ).gte("start_time", start_of_day.isoformat()).lte(
            "start_time", end_of_day.isoformat()
        ).not_.in_("status", [AppointmentStatus.CANCELLED.value]).order(
            "start_time"
        ).execute()

        result = []
        for appt in appointments.data:
            start = datetime.fromisoformat(appt["start_time"])
            result.append({
                "time": start.strftime("%H:%M"),
                "customer_name": appt.get("attendee_name", "Unknown"),
                "status": appt["status"]
            })

        return {
            "date": today.isoformat(),
            "total_appointments": len(result),
            "appointments": result
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch appointments: {str(e)}"
        )
