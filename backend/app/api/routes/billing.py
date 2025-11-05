from fastapi import APIRouter, Depends, HTTPException
from app.schemas.billing import CheckoutRequest, SubscriptionResponse, UsageResponse
from app.services.stripe_service import stripe_service
from app.services.supabase_service import supabase_service
from app.api.deps import get_current_user
from app.models.user import User
from app.config import settings
from datetime import date
from dateutil.relativedelta import relativedelta

router = APIRouter(prefix="/billing", tags=["Billing"])


@router.post("/create-checkout")
async def create_checkout(
    request: CheckoutRequest,
    user: User = Depends(get_current_user)
):
    """Create Stripe checkout session"""
    checkout_url = await stripe_service.create_checkout_session(
        customer_id=user.stripe_customer_id,
        plan=request.plan,
        success_url=request.success_url or f"{settings.FRONTEND_URL}/payment-success",
        cancel_url=request.cancel_url or f"{settings.FRONTEND_URL}/billing"
    )
    return {"checkout_url": checkout_url}


@router.post("/cancel")
async def cancel_subscription(user: User = Depends(get_current_user)):
    """Cancel subscription"""
    if not user.stripe_subscription_id:
        raise HTTPException(status_code=400, detail="No active subscription")

    await stripe_service.cancel_subscription(user.stripe_subscription_id)
    return {"message": "Subscription canceled"}


@router.post("/reactivate")
async def reactivate_subscription(user: User = Depends(get_current_user)):
    """Reactivate canceled subscription"""
    if not user.stripe_subscription_id:
        raise HTTPException(status_code=400, detail="No subscription found")

    await stripe_service.reactivate_subscription(user.stripe_subscription_id)
    return {"message": "Subscription reactivated"}


@router.post("/portal")
async def customer_portal(user: User = Depends(get_current_user)):
    """Get customer portal URL"""
    portal_url = await stripe_service.create_customer_portal_session(
        customer_id=user.stripe_customer_id,
        return_url=f"{settings.FRONTEND_URL}/billing"
    )
    return {"portal_url": portal_url}


@router.get("/usage", response_model=UsageResponse)
async def get_usage(user: User = Depends(get_current_user)):
    """Get current usage"""
    today = date.today()
    period_start = today.replace(day=1)
    period_end = (period_start + relativedelta(months=1)) - relativedelta(days=1)

    usage = await supabase_service.get_usage_for_period(user.id, period_start, period_end)
    features_dict = user.features.dict() if hasattr(user.features, 'dict') else user.features
    limit = features_dict.get("minutes_limit", 0)

    return UsageResponse(
        minutes_used=usage,
        minutes_limit=limit,
        percentage_used=(usage / limit * 100) if limit > 0 else 0,
        billing_period_start=period_start,
        billing_period_end=period_end
    )
