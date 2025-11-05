from pydantic import BaseModel, EmailStr
from typing import Optional
from app.models.user import User, SubscriptionPlan


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    company_name: Optional[str] = None
    plan: SubscriptionPlan = SubscriptionPlan.STARTER_TRIAL


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenData(BaseModel):
    user_id: str
    email: str


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: User
    checkout_url: Optional[str] = None  # For new registrations
