from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date
from decimal import Decimal


class Subscription(BaseModel):
    id: int
    user_id: str
    stripe_subscription_id: str
    status: str
    plan: str
    current_period_start: datetime
    current_period_end: datetime
    cancel_at_period_end: bool = False
    canceled_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class Invoice(BaseModel):
    id: int
    user_id: str
    stripe_invoice_id: str
    amount_due: int
    amount_paid: int
    currency: str = "usd"
    status: str
    invoice_pdf: Optional[str] = None
    hosted_invoice_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class UsageRecord(BaseModel):
    id: int
    user_id: str
    conversation_id: Optional[str] = None
    minutes_used: Decimal
    billing_period_start: date
    billing_period_end: date
    created_at: datetime

    class Config:
        from_attributes = True