from pydantic import BaseModel, EmailStr, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class CalendarProvider(str, Enum):
    """Supported calendar providers"""
    GOOGLE = "google"
    OUTLOOK = "outlook"
    APPLE = "apple"


class AppointmentStatus(str, Enum):
    """Appointment status values"""
    SCHEDULED = "scheduled"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"
    COMPLETED = "completed"
    NO_SHOW = "no_show"
    RESCHEDULED = "rescheduled"


class CalendarIntegrationBase(BaseModel):
    """Base calendar integration schema"""
    provider: CalendarProvider


class CalendarIntegrationResponse(BaseModel):
    """Response schema for calendar integration"""
    id: str
    user_id: str
    provider: CalendarProvider
    provider_email: str
    calendar_id: Optional[str] = None
    calendar_name: Optional[str] = None
    is_active: bool = True
    sync_enabled: bool = True
    last_sync: Optional[datetime] = None
    created_at: datetime
    access_token_expires: Optional[datetime] = None

    class Config:
        from_attributes = True


class ConnectCalendarRequest(BaseModel):
    """Request schema for connecting calendar"""
    provider: CalendarProvider
    auth_code: str
    redirect_uri: str


class CalendarAuthUrlResponse(BaseModel):
    """Response schema for calendar auth URL"""
    provider: CalendarProvider
    auth_url: str
    state: str


class AppointmentBase(BaseModel):
    """Base appointment schema"""
    title: str
    description: Optional[str] = None
    start_time: datetime
    end_time: datetime
    attendee_email: Optional[EmailStr] = None
    attendee_name: Optional[str] = None
    attendee_phone: Optional[str] = None


class CreateAppointmentRequest(AppointmentBase):
    """Request schema for creating appointment"""
    calendar_integration_id: Optional[str] = None
    location: Optional[str] = None
    timezone: str = "UTC"
    send_reminders: bool = True
    metadata: Optional[Dict[str, Any]] = None

    @validator('end_time')
    def validate_end_time(cls, v, values):
        if 'start_time' in values and v <= values['start_time']:
            raise ValueError("End time must be after start time")
        return v


class UpdateAppointmentRequest(BaseModel):
    """Request schema for updating appointment"""
    title: Optional[str] = None
    description: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    location: Optional[str] = None
    status: Optional[AppointmentStatus] = None
    metadata: Optional[Dict[str, Any]] = None


class AppointmentResponse(BaseModel):
    """Response schema for appointment"""
    id: str
    user_id: str
    calendar_integration_id: Optional[str] = None
    external_event_id: Optional[str] = None
    title: str
    description: Optional[str] = None
    start_time: datetime
    end_time: datetime
    location: Optional[str] = None
    timezone: str
    status: AppointmentStatus
    attendee_email: Optional[str] = None
    attendee_name: Optional[str] = None
    attendee_phone: Optional[str] = None
    send_reminders: bool
    reminder_sent: bool = False
    metadata: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    cancelled_at: Optional[datetime] = None

    # Additional fields
    provider: Optional[CalendarProvider] = None
    meeting_url: Optional[str] = None
    is_synced: bool = False

    class Config:
        from_attributes = True


class AppointmentListResponse(BaseModel):
    """Response schema for paginated appointment list"""
    appointments: List[AppointmentResponse]
    total: int
    page: int
    per_page: int
    pages: int


class AvailabilitySlot(BaseModel):
    """Schema for availability time slot"""
    start_time: datetime
    end_time: datetime
    is_available: bool
    reason: Optional[str] = None  # e.g., "booked", "outside_hours", "blocked"


class AvailabilityRequest(BaseModel):
    """Request schema for checking availability"""
    date_from: datetime
    date_to: datetime
    duration_minutes: int = 30
    timezone: str = "UTC"

    @validator('date_to')
    def validate_date_range(cls, v, values):
        if 'date_from' in values and v <= values['date_from']:
            raise ValueError("date_to must be after date_from")
        return v


class AvailabilityResponse(BaseModel):
    """Response schema for availability"""
    date_from: datetime
    date_to: datetime
    timezone: str
    available_slots: List[AvailabilitySlot]
    total_slots: int
    available_count: int


class BusinessHours(BaseModel):
    """Schema for business hours configuration"""
    day_of_week: int  # 0 = Monday, 6 = Sunday
    start_time: str  # HH:MM format
    end_time: str  # HH:MM format
    is_available: bool = True

    @validator('day_of_week')
    def validate_day(cls, v):
        if v < 0 or v > 6:
            raise ValueError("day_of_week must be between 0 (Monday) and 6 (Sunday)")
        return v


class CalendarSettingsRequest(BaseModel):
    """Request schema for calendar settings"""
    business_hours: Optional[List[BusinessHours]] = None
    slot_duration_minutes: Optional[int] = 30
    buffer_time_minutes: Optional[int] = 0
    max_advance_booking_days: Optional[int] = 30
    min_advance_booking_hours: Optional[int] = 24
    timezone: Optional[str] = "UTC"
    auto_confirm: Optional[bool] = False


class CalendarSettingsResponse(BaseModel):
    """Response schema for calendar settings"""
    user_id: str
    business_hours: List[BusinessHours]
    slot_duration_minutes: int
    buffer_time_minutes: int
    max_advance_booking_days: int
    min_advance_booking_hours: int
    timezone: str
    auto_confirm: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class SyncCalendarRequest(BaseModel):
    """Request schema for syncing calendar"""
    calendar_integration_id: str
    sync_past_days: int = 7
    sync_future_days: int = 30


class SyncCalendarResponse(BaseModel):
    """Response schema for calendar sync"""
    calendar_integration_id: str
    events_synced: int
    appointments_created: int
    appointments_updated: int
    last_sync: datetime
    errors: Optional[List[str]] = None


class RescheduleAppointmentRequest(BaseModel):
    """Request schema for rescheduling appointment"""
    new_start_time: datetime
    new_end_time: datetime
    reason: Optional[str] = None
    notify_attendee: bool = True

    @validator('new_end_time')
    def validate_times(cls, v, values):
        if 'new_start_time' in values and v <= values['new_start_time']:
            raise ValueError("End time must be after start time")
        return v


class CancelAppointmentRequest(BaseModel):
    """Request schema for cancelling appointment"""
    reason: Optional[str] = None
    notify_attendee: bool = True


class AppointmentStatsResponse(BaseModel):
    """Response schema for appointment statistics"""
    total_appointments: int
    upcoming_appointments: int
    completed_appointments: int
    cancelled_appointments: int
    no_show_count: int
    appointments_by_status: Dict[str, int]
    average_duration_minutes: float
    total_hours_booked: float


class WebhookEventType(str, Enum):
    """Calendar webhook event types"""
    APPOINTMENT_CREATED = "appointment.created"
    APPOINTMENT_UPDATED = "appointment.updated"
    APPOINTMENT_CANCELLED = "appointment.cancelled"
    APPOINTMENT_COMPLETED = "appointment.completed"


class CalendarWebhookPayload(BaseModel):
    """Payload for calendar webhooks"""
    event_type: WebhookEventType
    appointment: AppointmentResponse
    timestamp: datetime
    user_id: str
