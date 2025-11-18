from pydantic import BaseModel, EmailStr, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class NotificationChannel(str, Enum):
    """Notification channels"""
    EMAIL = "email"
    SMS = "sms"
    WEBHOOK = "webhook"
    IN_APP = "in_app"


class NotificationEvent(str, Enum):
    """Events that trigger notifications"""
    CALL_COMPLETED = "call.completed"
    CALL_FAILED = "call.failed"
    APPOINTMENT_BOOKED = "appointment.booked"
    APPOINTMENT_REMINDER = "appointment.reminder"
    APPOINTMENT_CANCELLED = "appointment.cancelled"
    USAGE_LIMIT_WARNING = "usage.limit_warning"
    SUBSCRIPTION_EXPIRING = "subscription.expiring"
    TEAM_MEMBER_INVITED = "team.member_invited"


class NotificationSettings(BaseModel):
    """Notification preferences"""
    event: NotificationEvent
    enabled: bool = True
    channels: List[NotificationChannel] = [NotificationChannel.EMAIL]


class UserProfileUpdate(BaseModel):
    """Request schema for updating user profile"""
    full_name: Optional[str] = None
    company_name: Optional[str] = None
    phone_number: Optional[str] = None
    avatar_url: Optional[str] = None
    timezone: Optional[str] = None
    language: Optional[str] = "en"


class UpdatePasswordRequest(BaseModel):
    """Request schema for changing password"""
    current_password: str
    new_password: str
    confirm_password: str

    @validator('confirm_password')
    def passwords_match(cls, v, values):
        if 'new_password' in values and v != values['new_password']:
            raise ValueError("Passwords do not match")
        return v

    @validator('new_password')
    def password_strength(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(c.islower() for c in v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one digit")
        return v


class APIKeyCreate(BaseModel):
    """Request schema for creating API key"""
    name: str
    description: Optional[str] = None
    expires_in_days: Optional[int] = None
    permissions: Optional[List[str]] = None


class APIKeyResponse(BaseModel):
    """Response schema for API key"""
    id: str
    user_id: str
    name: str
    description: Optional[str] = None
    key_preview: str  # Only first/last few characters
    full_key: Optional[str] = None  # Only returned on creation
    permissions: Optional[List[str]] = None
    created_at: datetime
    expires_at: Optional[datetime] = None
    last_used_at: Optional[datetime] = None
    is_active: bool = True

    class Config:
        from_attributes = True


class WebhookEndpoint(BaseModel):
    """Webhook endpoint configuration"""
    url: str
    events: List[str]
    secret: Optional[str] = None
    is_active: bool = True

    @validator('url')
    def validate_url(cls, v):
        if not v.startswith(('http://', 'https://')):
            raise ValueError("URL must start with http:// or https://")
        return v


class WebhookEndpointResponse(BaseModel):
    """Response schema for webhook endpoint"""
    id: str
    user_id: str
    url: str
    events: List[str]
    secret_preview: Optional[str] = None
    is_active: bool
    created_at: datetime
    last_triggered_at: Optional[datetime] = None
    success_count: int = 0
    failure_count: int = 0

    class Config:
        from_attributes = True


class IntegrationSettings(BaseModel):
    """Integration settings"""
    integration_name: str
    enabled: bool = True
    config: Dict[str, Any] = {}


class VoiceSettings(BaseModel):
    """Voice AI settings"""
    voice_id: Optional[str] = None
    voice_stability: Optional[float] = 0.5
    voice_similarity_boost: Optional[float] = 0.75
    voice_style: Optional[float] = 0.0
    use_speaker_boost: Optional[bool] = True

    @validator('voice_stability', 'voice_similarity_boost', 'voice_style')
    def validate_range(cls, v):
        if v is not None and (v < 0 or v > 1):
            raise ValueError("Value must be between 0 and 1")
        return v


class AIModelSettings(BaseModel):
    """AI model configuration settings"""
    model_provider: Optional[str] = "elevenlabs"
    temperature: Optional[float] = 0.7
    max_tokens: Optional[int] = None
    system_prompt: Optional[str] = None
    custom_instructions: Optional[str] = None

    @validator('temperature')
    def validate_temperature(cls, v):
        if v is not None and (v < 0 or v > 2):
            raise ValueError("Temperature must be between 0 and 2")
        return v


class SettingsResponse(BaseModel):
    """Complete settings response"""
    user_profile: Dict[str, Any]
    notifications: List[NotificationSettings]
    voice_settings: VoiceSettings
    ai_model_settings: AIModelSettings
    integrations: List[IntegrationSettings]
    api_keys_count: int
    webhooks_count: int

    class Config:
        from_attributes = True


class UpdateSettingsRequest(BaseModel):
    """Request schema for updating settings"""
    notifications: Optional[List[NotificationSettings]] = None
    voice_settings: Optional[VoiceSettings] = None
    ai_model_settings: Optional[AIModelSettings] = None
    integrations: Optional[List[IntegrationSettings]] = None


class SecuritySettings(BaseModel):
    """Security settings"""
    two_factor_enabled: bool = False
    session_timeout_minutes: int = 60
    allowed_ip_addresses: Optional[List[str]] = None
    require_password_change_days: Optional[int] = None

    @validator('session_timeout_minutes')
    def validate_timeout(cls, v):
        if v < 5 or v > 1440:
            raise ValueError("Session timeout must be between 5 and 1440 minutes")
        return v


class DataExportRequest(BaseModel):
    """Request schema for data export"""
    include_calls: bool = True
    include_analytics: bool = True
    include_appointments: bool = True
    include_agents: bool = True
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    format: str = "json"  # json, csv

    @validator('format')
    def validate_format(cls, v):
        if v not in ['json', 'csv']:
            raise ValueError("Format must be 'json' or 'csv'")
        return v


class DataExportResponse(BaseModel):
    """Response schema for data export"""
    export_id: str
    status: str  # pending, processing, completed, failed
    download_url: Optional[str] = None
    expires_at: Optional[datetime] = None
    created_at: datetime
    size_bytes: Optional[int] = None

    class Config:
        from_attributes = True


class AccountDeletionRequest(BaseModel):
    """Request schema for account deletion"""
    password: str
    confirmation: str
    reason: Optional[str] = None

    @validator('confirmation')
    def validate_confirmation(cls, v):
        if v != "DELETE MY ACCOUNT":
            raise ValueError("Confirmation text must be 'DELETE MY ACCOUNT'")
        return v


class BillingPreferences(BaseModel):
    """Billing preferences"""
    billing_email: Optional[EmailStr] = None
    invoice_company_name: Optional[str] = None
    invoice_address: Optional[str] = None
    invoice_vat_number: Optional[str] = None
    auto_renew: bool = True
    payment_method_id: Optional[str] = None


class UsageQuota(BaseModel):
    """Usage quota information"""
    resource: str  # e.g., "minutes", "calls", "storage"
    used: int
    limit: int
    unit: str
    reset_at: Optional[datetime] = None
    percentage_used: float


class UsageQuotasResponse(BaseModel):
    """Response schema for usage quotas"""
    quotas: List[UsageQuota]
    billing_period_start: datetime
    billing_period_end: datetime
    is_trial: bool = False
    days_remaining: Optional[int] = None
