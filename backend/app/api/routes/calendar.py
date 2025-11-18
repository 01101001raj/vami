from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import List, Optional
from datetime import datetime, date, timedelta
import secrets
from app.schemas.calendar import (
    CalendarIntegrationResponse, ConnectCalendarRequest, CalendarAuthUrlResponse,
    CreateAppointmentRequest, UpdateAppointmentRequest, AppointmentResponse,
    AppointmentListResponse, AvailabilityRequest, AvailabilityResponse,
    CalendarSettingsRequest, CalendarSettingsResponse, SyncCalendarRequest,
    SyncCalendarResponse, RescheduleAppointmentRequest, CancelAppointmentRequest,
    AppointmentStatsResponse, CalendarProvider, AppointmentStatus, AvailabilitySlot
)
from app.models.user import User
from app.api.deps import get_current_user
from app.database import get_supabase
from app.config import settings

router = APIRouter(prefix="/calendar", tags=["Calendar Management"])


@router.get("/integrations", response_model=List[CalendarIntegrationResponse])
async def get_calendar_integrations(user: User = Depends(get_current_user)):
    """
    Get all calendar integrations for the user
    """
    try:
        supabase = get_supabase()

        response = supabase.table("calendar_integrations").select("*").eq(
            "user_id", user.id
        ).execute()

        integrations = []
        for integration_data in response.data:
            integrations.append(CalendarIntegrationResponse(
                id=integration_data["id"],
                user_id=integration_data["user_id"],
                provider=CalendarProvider(integration_data["provider"]),
                provider_email=integration_data["provider_email"],
                calendar_id=integration_data.get("calendar_id"),
                calendar_name=integration_data.get("calendar_name"),
                is_active=integration_data.get("is_active", True),
                sync_enabled=integration_data.get("sync_enabled", True),
                last_sync=integration_data.get("last_sync"),
                created_at=integration_data["created_at"],
                access_token_expires=integration_data.get("access_token_expires")
            ))

        return integrations

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch calendar integrations: {str(e)}"
        )


@router.get("/auth-url/{provider}", response_model=CalendarAuthUrlResponse)
async def get_calendar_auth_url(
    provider: CalendarProvider,
    user: User = Depends(get_current_user)
):
    """
    Get OAuth authorization URL for calendar provider
    """
    try:
        # Generate state token for CSRF protection
        state = secrets.token_urlsafe(32)

        # Store state in session/cache for validation
        supabase = get_supabase()
        supabase.table("oauth_states").insert({
            "user_id": user.id,
            "state": state,
            "provider": provider.value,
            "created_at": datetime.utcnow().isoformat(),
            "expires_at": (datetime.utcnow() + timedelta(minutes=10)).isoformat()
        }).execute()

        # Build OAuth URL based on provider
        if provider == CalendarProvider.GOOGLE:
            scopes = [
                "https://www.googleapis.com/auth/calendar",
                "https://www.googleapis.com/auth/calendar.events"
            ]
            auth_url = (
                f"https://accounts.google.com/o/oauth2/v2/auth"
                f"?client_id={settings.GOOGLE_CLIENT_ID}"
                f"&redirect_uri={settings.FRONTEND_URL}/calendar/callback"
                f"&response_type=code"
                f"&scope={' '.join(scopes)}"
                f"&state={state}"
                f"&access_type=offline"
                f"&prompt=consent"
            )
        elif provider == CalendarProvider.OUTLOOK:
            scopes = ["Calendars.ReadWrite", "offline_access"]
            auth_url = (
                f"https://login.microsoftonline.com/common/oauth2/v2.0/authorize"
                f"?client_id={settings.MICROSOFT_CLIENT_ID}"
                f"&redirect_uri={settings.FRONTEND_URL}/calendar/callback"
                f"&response_type=code"
                f"&scope={' '.join(scopes)}"
                f"&state={state}"
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Provider {provider} not yet supported"
            )

        return CalendarAuthUrlResponse(
            provider=provider,
            auth_url=auth_url,
            state=state
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate auth URL: {str(e)}"
        )


@router.post("/connect", response_model=CalendarIntegrationResponse)
async def connect_calendar(
    request: ConnectCalendarRequest,
    user: User = Depends(get_current_user)
):
    """
    Connect a calendar provider using OAuth code
    """
    try:
        supabase = get_supabase()

        # Exchange auth code for tokens (implementation depends on provider)
        # This is a simplified version - real implementation would call provider APIs

        integration_data = {
            "user_id": user.id,
            "provider": request.provider.value,
            "provider_email": user.email,  # Would get from provider API
            "is_active": True,
            "sync_enabled": True,
            "created_at": datetime.utcnow().isoformat()
        }

        response = supabase.table("calendar_integrations").insert(
            integration_data
        ).execute()

        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create calendar integration"
            )

        integration = response.data[0]

        return CalendarIntegrationResponse(
            id=integration["id"],
            user_id=integration["user_id"],
            provider=CalendarProvider(integration["provider"]),
            provider_email=integration["provider_email"],
            calendar_id=integration.get("calendar_id"),
            calendar_name=integration.get("calendar_name"),
            is_active=integration["is_active"],
            sync_enabled=integration["sync_enabled"],
            last_sync=integration.get("last_sync"),
            created_at=integration["created_at"],
            access_token_expires=integration.get("access_token_expires")
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to connect calendar: {str(e)}"
        )


@router.delete("/integrations/{integration_id}")
async def disconnect_calendar(
    integration_id: str,
    user: User = Depends(get_current_user)
):
    """
    Disconnect a calendar integration
    """
    try:
        supabase = get_supabase()

        response = supabase.table("calendar_integrations").delete().eq(
            "id", integration_id
        ).eq("user_id", user.id).execute()

        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Calendar integration not found"
            )

        return {"message": "Calendar disconnected successfully"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to disconnect calendar: {str(e)}"
        )


@router.get("/appointments", response_model=AppointmentListResponse)
async def get_appointments(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    status: Optional[AppointmentStatus] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    user: User = Depends(get_current_user)
):
    """
    Get paginated list of appointments
    """
    try:
        supabase = get_supabase()
        offset = (page - 1) * per_page

        query = supabase.table("appointments").select(
            "*, calendar_integrations(provider)", count="exact"
        ).eq("user_id", user.id)

        if status:
            query = query.eq("status", status.value)
        if date_from:
            query = query.gte("start_time", date_from.isoformat())
        if date_to:
            query = query.lte("start_time", (date_to + timedelta(days=1)).isoformat())

        response = query.order("start_time", desc=False).range(
            offset, offset + per_page - 1
        ).execute()

        appointments = []
        for appt_data in response.data:
            integration_data = appt_data.get("calendar_integrations", {})
            appointments.append(AppointmentResponse(
                id=appt_data["id"],
                user_id=appt_data["user_id"],
                calendar_integration_id=appt_data.get("calendar_integration_id"),
                external_event_id=appt_data.get("external_event_id"),
                title=appt_data["title"],
                description=appt_data.get("description"),
                start_time=appt_data["start_time"],
                end_time=appt_data["end_time"],
                location=appt_data.get("location"),
                timezone=appt_data.get("timezone", "UTC"),
                status=AppointmentStatus(appt_data["status"]),
                attendee_email=appt_data.get("attendee_email"),
                attendee_name=appt_data.get("attendee_name"),
                attendee_phone=appt_data.get("attendee_phone"),
                send_reminders=appt_data.get("send_reminders", True),
                reminder_sent=appt_data.get("reminder_sent", False),
                metadata=appt_data.get("metadata"),
                created_at=appt_data["created_at"],
                updated_at=appt_data.get("updated_at"),
                cancelled_at=appt_data.get("cancelled_at"),
                provider=CalendarProvider(integration_data["provider"]) if integration_data.get("provider") else None,
                meeting_url=appt_data.get("meeting_url"),
                is_synced=appt_data.get("is_synced", False)
            ))

        total = response.count if response.count else 0
        pages = (total + per_page - 1) // per_page

        return AppointmentListResponse(
            appointments=appointments,
            total=total,
            page=page,
            per_page=per_page,
            pages=pages
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch appointments: {str(e)}"
        )


@router.post("/appointments", response_model=AppointmentResponse)
async def create_appointment(
    request: CreateAppointmentRequest,
    user: User = Depends(get_current_user)
):
    """
    Create a new appointment
    """
    try:
        supabase = get_supabase()

        appointment_data = {
            "user_id": user.id,
            "calendar_integration_id": request.calendar_integration_id,
            "title": request.title,
            "description": request.description,
            "start_time": request.start_time.isoformat(),
            "end_time": request.end_time.isoformat(),
            "location": request.location,
            "timezone": request.timezone,
            "status": AppointmentStatus.SCHEDULED.value,
            "attendee_email": request.attendee_email,
            "attendee_name": request.attendee_name,
            "attendee_phone": request.attendee_phone,
            "send_reminders": request.send_reminders,
            "metadata": request.metadata,
            "created_at": datetime.utcnow().isoformat()
        }

        response = supabase.table("appointments").insert(appointment_data).execute()

        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create appointment"
            )

        appointment = response.data[0]

        # Sync to external calendar if integration is specified
        if request.calendar_integration_id:
            # Implementation would call provider API to create event
            pass

        return AppointmentResponse(
            id=appointment["id"],
            user_id=appointment["user_id"],
            calendar_integration_id=appointment.get("calendar_integration_id"),
            external_event_id=appointment.get("external_event_id"),
            title=appointment["title"],
            description=appointment.get("description"),
            start_time=appointment["start_time"],
            end_time=appointment["end_time"],
            location=appointment.get("location"),
            timezone=appointment["timezone"],
            status=AppointmentStatus(appointment["status"]),
            attendee_email=appointment.get("attendee_email"),
            attendee_name=appointment.get("attendee_name"),
            attendee_phone=appointment.get("attendee_phone"),
            send_reminders=appointment["send_reminders"],
            reminder_sent=appointment.get("reminder_sent", False),
            metadata=appointment.get("metadata"),
            created_at=appointment["created_at"],
            updated_at=appointment.get("updated_at"),
            cancelled_at=appointment.get("cancelled_at"),
            meeting_url=appointment.get("meeting_url"),
            is_synced=appointment.get("is_synced", False)
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create appointment: {str(e)}"
        )


@router.get("/appointments/{appointment_id}", response_model=AppointmentResponse)
async def get_appointment(
    appointment_id: str,
    user: User = Depends(get_current_user)
):
    """
    Get a specific appointment
    """
    try:
        supabase = get_supabase()

        response = supabase.table("appointments").select(
            "*, calendar_integrations(provider)"
        ).eq("id", appointment_id).eq("user_id", user.id).execute()

        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Appointment not found"
            )

        appt_data = response.data[0]
        integration_data = appt_data.get("calendar_integrations", {})

        return AppointmentResponse(
            id=appt_data["id"],
            user_id=appt_data["user_id"],
            calendar_integration_id=appt_data.get("calendar_integration_id"),
            external_event_id=appt_data.get("external_event_id"),
            title=appt_data["title"],
            description=appt_data.get("description"),
            start_time=appt_data["start_time"],
            end_time=appt_data["end_time"],
            location=appt_data.get("location"),
            timezone=appt_data.get("timezone", "UTC"),
            status=AppointmentStatus(appt_data["status"]),
            attendee_email=appt_data.get("attendee_email"),
            attendee_name=appt_data.get("attendee_name"),
            attendee_phone=appt_data.get("attendee_phone"),
            send_reminders=appt_data.get("send_reminders", True),
            reminder_sent=appt_data.get("reminder_sent", False),
            metadata=appt_data.get("metadata"),
            created_at=appt_data["created_at"],
            updated_at=appt_data.get("updated_at"),
            cancelled_at=appt_data.get("cancelled_at"),
            provider=CalendarProvider(integration_data["provider"]) if integration_data.get("provider") else None,
            meeting_url=appt_data.get("meeting_url"),
            is_synced=appt_data.get("is_synced", False)
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch appointment: {str(e)}"
        )


@router.put("/appointments/{appointment_id}", response_model=AppointmentResponse)
async def update_appointment(
    appointment_id: str,
    request: UpdateAppointmentRequest,
    user: User = Depends(get_current_user)
):
    """
    Update an appointment
    """
    try:
        supabase = get_supabase()

        # Build update data
        update_data = {"updated_at": datetime.utcnow().isoformat()}

        if request.title is not None:
            update_data["title"] = request.title
        if request.description is not None:
            update_data["description"] = request.description
        if request.start_time is not None:
            update_data["start_time"] = request.start_time.isoformat()
        if request.end_time is not None:
            update_data["end_time"] = request.end_time.isoformat()
        if request.location is not None:
            update_data["location"] = request.location
        if request.status is not None:
            update_data["status"] = request.status.value
        if request.metadata is not None:
            update_data["metadata"] = request.metadata

        response = supabase.table("appointments").update(update_data).eq(
            "id", appointment_id
        ).eq("user_id", user.id).execute()

        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Appointment not found"
            )

        # Return updated appointment
        return await get_appointment(appointment_id, user)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update appointment: {str(e)}"
        )


@router.delete("/appointments/{appointment_id}")
async def delete_appointment(
    appointment_id: str,
    user: User = Depends(get_current_user)
):
    """
    Delete an appointment
    """
    try:
        supabase = get_supabase()

        response = supabase.table("appointments").delete().eq(
            "id", appointment_id
        ).eq("user_id", user.id).execute()

        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Appointment not found"
            )

        return {"message": "Appointment deleted successfully"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete appointment: {str(e)}"
        )


@router.post("/appointments/{appointment_id}/reschedule")
async def reschedule_appointment(
    appointment_id: str,
    request: RescheduleAppointmentRequest,
    user: User = Depends(get_current_user)
):
    """
    Reschedule an appointment
    """
    try:
        supabase = get_supabase()

        update_data = {
            "start_time": request.new_start_time.isoformat(),
            "end_time": request.new_end_time.isoformat(),
            "status": AppointmentStatus.RESCHEDULED.value,
            "updated_at": datetime.utcnow().isoformat()
        }

        if request.reason:
            metadata = {"reschedule_reason": request.reason}
            update_data["metadata"] = metadata

        response = supabase.table("appointments").update(update_data).eq(
            "id", appointment_id
        ).eq("user_id", user.id).execute()

        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Appointment not found"
            )

        # Send notification if requested
        if request.notify_attendee:
            # Implementation would send email/SMS notification
            pass

        return {"message": "Appointment rescheduled successfully"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to reschedule appointment: {str(e)}"
        )


@router.post("/appointments/{appointment_id}/cancel")
async def cancel_appointment(
    appointment_id: str,
    request: CancelAppointmentRequest,
    user: User = Depends(get_current_user)
):
    """
    Cancel an appointment
    """
    try:
        supabase = get_supabase()

        update_data = {
            "status": AppointmentStatus.CANCELLED.value,
            "cancelled_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }

        if request.reason:
            metadata = {"cancellation_reason": request.reason}
            update_data["metadata"] = metadata

        response = supabase.table("appointments").update(update_data).eq(
            "id", appointment_id
        ).eq("user_id", user.id).execute()

        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Appointment not found"
            )

        # Send notification if requested
        if request.notify_attendee:
            # Implementation would send email/SMS notification
            pass

        return {"message": "Appointment cancelled successfully"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to cancel appointment: {str(e)}"
        )


@router.post("/availability", response_model=AvailabilityResponse)
async def check_availability(
    request: AvailabilityRequest,
    user: User = Depends(get_current_user)
):
    """
    Check availability for booking appointments
    """
    try:
        supabase = get_supabase()

        # Get existing appointments in the date range
        appointments_response = supabase.table("appointments").select("*").eq(
            "user_id", user.id
        ).gte("start_time", request.date_from.isoformat()).lte(
            "end_time", request.date_to.isoformat()
        ).not_.in_("status", [AppointmentStatus.CANCELLED.value]).execute()

        booked_slots = appointments_response.data

        # Generate time slots based on duration
        available_slots = []
        current_time = request.date_from
        slot_duration = timedelta(minutes=request.duration_minutes)

        while current_time < request.date_to:
            slot_end = current_time + slot_duration

            # Check if slot overlaps with existing appointments
            is_available = True
            reason = None

            for appointment in booked_slots:
                appt_start = datetime.fromisoformat(appointment["start_time"])
                appt_end = datetime.fromisoformat(appointment["end_time"])

                if (current_time < appt_end and slot_end > appt_start):
                    is_available = False
                    reason = "booked"
                    break

            available_slots.append(AvailabilitySlot(
                start_time=current_time,
                end_time=slot_end,
                is_available=is_available,
                reason=reason
            ))

            current_time = slot_end

        available_count = len([s for s in available_slots if s.is_available])

        return AvailabilityResponse(
            date_from=request.date_from,
            date_to=request.date_to,
            timezone=request.timezone,
            available_slots=available_slots,
            total_slots=len(available_slots),
            available_count=available_count
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to check availability: {str(e)}"
        )


@router.get("/stats", response_model=AppointmentStatsResponse)
async def get_appointment_stats(
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    user: User = Depends(get_current_user)
):
    """
    Get appointment statistics
    """
    try:
        supabase = get_supabase()

        query = supabase.table("appointments").select("*").eq("user_id", user.id)

        if date_from:
            query = query.gte("start_time", date_from.isoformat())
        if date_to:
            query = query.lte("start_time", (date_to + timedelta(days=1)).isoformat())

        response = query.execute()
        appointments = response.data

        total_appointments = len(appointments)
        upcoming_appointments = len([
            a for a in appointments
            if datetime.fromisoformat(a["start_time"]) > datetime.utcnow()
            and a["status"] == AppointmentStatus.SCHEDULED.value
        ])
        completed_appointments = len([
            a for a in appointments if a["status"] == AppointmentStatus.COMPLETED.value
        ])
        cancelled_appointments = len([
            a for a in appointments if a["status"] == AppointmentStatus.CANCELLED.value
        ])
        no_show_count = len([
            a for a in appointments if a["status"] == AppointmentStatus.NO_SHOW.value
        ])

        # Appointments by status
        appointments_by_status = {}
        for appointment in appointments:
            status_val = appointment["status"]
            appointments_by_status[status_val] = appointments_by_status.get(status_val, 0) + 1

        # Calculate duration stats
        durations = []
        for appointment in appointments:
            start = datetime.fromisoformat(appointment["start_time"])
            end = datetime.fromisoformat(appointment["end_time"])
            duration_minutes = (end - start).total_seconds() / 60
            durations.append(duration_minutes)

        average_duration_minutes = sum(durations) / len(durations) if durations else 0
        total_hours_booked = sum(durations) / 60

        return AppointmentStatsResponse(
            total_appointments=total_appointments,
            upcoming_appointments=upcoming_appointments,
            completed_appointments=completed_appointments,
            cancelled_appointments=cancelled_appointments,
            no_show_count=no_show_count,
            appointments_by_status=appointments_by_status,
            average_duration_minutes=average_duration_minutes,
            total_hours_booked=total_hours_booked
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch appointment stats: {str(e)}"
        )
