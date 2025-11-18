from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.user import SubscriptionPlan


class CheckoutRequest(BaseModel):
    plan: SubscriptionPlan
    success_url: Optional[str] = None
    cancel_url: Optional[str] = None




class SubscriptionResponse(BaseModel):
    id: int
    status: str
    plan: str
    current_period_start: datetime
    current_period_end: datetime
    cancel_at_period_end: bool

    class Config:
        from_attributes = True


class UsageResponse(BaseModel):
    minutes_used: float
    minutes_limit: int
    percentage_used: float
    billing_period_start: datetime
    billing_period_end: datetime
