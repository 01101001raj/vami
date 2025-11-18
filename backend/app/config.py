from pydantic_settings import BaseSettings
from typing import List
import json


class Settings(BaseSettings):
    # Application
    APP_NAME: str = "Vami Platform"
    DEBUG: bool = False
    SECRET_KEY: str
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000

    # Database (Supabase)
    SUPABASE_URL: str
    SUPABASE_KEY: str
    SUPABASE_SERVICE_KEY: str
    SUPABASE_JWT_SECRET: str

    # ElevenLabs
    ELEVENLABS_API_KEY: str
    ELEVENLABS_WEBHOOK_SECRET: str

    # Stripe
    STRIPE_SECRET_KEY: str
    STRIPE_PUBLISHABLE_KEY: str
    STRIPE_WEBHOOK_SECRET: str
    STRIPE_PRICE_STARTER_TRIAL: str
    STRIPE_PRICE_BASIC: str
    STRIPE_PRICE_PROFESSIONAL: str
    STRIPE_PRICE_PREMIUM: str

    # Google Calendar
    GOOGLE_CLIENT_ID: str
    GOOGLE_CLIENT_SECRET: str
    GOOGLE_REDIRECT_URI: str

    # SendGrid
    SENDGRID_API_KEY: str
    SENDGRID_FROM_EMAIL: str
    SENDGRID_FROM_NAME: str = "Vami Platform"

    # Twilio
    TWILIO_ACCOUNT_SID: str
    TWILIO_AUTH_TOKEN: str
    TWILIO_PHONE_NUMBER: str

    # URLs
    FRONTEND_URL: str = "http://localhost:5173"
    MARKETING_SITE_URL: str = "https://vami.app"
    CORS_ORIGINS: str = '["http://localhost:5173"]'
    WEBHOOK_BASE_URL: str = "https://api.vami.app"
    ELEVENLABS_WEBHOOK_URL: str = "https://api.elevenlabs.io/v1/convai/conversation/phone"

    @property
    def cors_origins_list(self) -> List[str]:
        return json.loads(self.CORS_ORIGINS)

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()