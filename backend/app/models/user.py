from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from enum import Enum


class SubscriptionPlan(str, Enum):
    STARTER_TRIAL = "starter_trial"
    BASIC = "basic"
    PROFESSIONAL = "professional"
    PREMIUM = "premium"
    CUSTOM = "custom"


class UserFeatures(BaseModel):
    minutes_limit: int
    concurrent_calls: int
    business_numbers: int
    team_members: int
    inbound_calls: bool
    outbound_calls: bool
    calendar_booking: bool
    email_confirmation: bool
    sms_confirmation: bool
    call_transcripts: bool
    call_recordings: bool
    basic_analytics: bool
    advanced_analytics: bool
    sentiment_analysis: bool
    priority_support: bool
    custom_integrations: bool
    voice_cloning: bool
    call_routing: bool
    multi_location: bool
    white_labeling: bool
    dedicated_account_manager: bool


class User(BaseModel):
    id: str
    email: EmailStr
    company_name: Optional[str] = None
    plan: SubscriptionPlan = SubscriptionPlan.STARTER_TRIAL
    stripe_customer_id: Optional[str] = None
    stripe_subscription_id: Optional[str] = None
    subscription_status: str = "incomplete"
    current_period_end: Optional[datetime] = None
    features: UserFeatures
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Plan feature mappings
PLAN_FEATURES = {
    SubscriptionPlan.STARTER_TRIAL: UserFeatures(
        minutes_limit=240,
        concurrent_calls=1,
        business_numbers=1,
        team_members=1,
        inbound_calls=True,
        outbound_calls=False,
        calendar_booking=True,
        email_confirmation=False,
        sms_confirmation=False,
        call_transcripts=False,
        call_recordings=False,
        basic_analytics=True,
        advanced_analytics=False,
        sentiment_analysis=False,
        priority_support=False,
        custom_integrations=False,
        voice_cloning=False,
        call_routing=False,
        multi_location=False,
        white_labeling=False,
        dedicated_account_manager=False,
    ),
    SubscriptionPlan.BASIC: UserFeatures(
        minutes_limit=1500,
        concurrent_calls=10,
        business_numbers=1,
        team_members=1,
        inbound_calls=True,
        outbound_calls=False,
        calendar_booking=True,
        email_confirmation=True,
        sms_confirmation=True,
        call_transcripts=True,
        call_recordings=False,
        basic_analytics=True,
        advanced_analytics=False,
        sentiment_analysis=False,
        priority_support=False,
        custom_integrations=False,
        voice_cloning=False,
        call_routing=False,
        multi_location=False,
        white_labeling=False,
        dedicated_account_manager=False,
    ),
    SubscriptionPlan.PROFESSIONAL: UserFeatures(
        minutes_limit=4200,
        concurrent_calls=10,
        business_numbers=3,
        team_members=3,
        inbound_calls=True,
        outbound_calls=True,
        calendar_booking=True,
        email_confirmation=True,
        sms_confirmation=True,
        call_transcripts=True,
        call_recordings=True,
        basic_analytics=False,
        advanced_analytics=True,
        sentiment_analysis=False,
        priority_support=True,
        custom_integrations=False,
        voice_cloning=False,
        call_routing=False,
        multi_location=False,
        white_labeling=False,
        dedicated_account_manager=False,
    ),
    SubscriptionPlan.PREMIUM: UserFeatures(
        minutes_limit=13800,
        concurrent_calls=20,
        business_numbers=10,
        team_members=7,
        inbound_calls=True,
        outbound_calls=True,
        calendar_booking=True,
        email_confirmation=True,
        sms_confirmation=True,
        call_transcripts=True,
        call_recordings=True,
        basic_analytics=False,
        advanced_analytics=True,
        sentiment_analysis=True,
        priority_support=True,
        custom_integrations=True,
        voice_cloning=True,
        call_routing=True,
        multi_location=True,
        white_labeling=False,
        dedicated_account_manager=True,
    ),
    SubscriptionPlan.CUSTOM: UserFeatures(
        minutes_limit=999999,
        concurrent_calls=999,
        business_numbers=999,
        team_members=999,
        inbound_calls=True,
        outbound_calls=True,
        calendar_booking=True,
        email_confirmation=True,
        sms_confirmation=True,
        call_transcripts=True,
        call_recordings=True,
        basic_analytics=False,
        advanced_analytics=True,
        sentiment_analysis=True,
        priority_support=True,
        custom_integrations=True,
        voice_cloning=True,
        call_routing=True,
        multi_location=True,
        white_labeling=True,
        dedicated_account_manager=True,
    ),
}