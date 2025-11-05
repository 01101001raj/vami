import stripe
from typing import Optional
from datetime import datetime
from app.config import settings
from app.models.user import SubscriptionPlan

stripe.api_key = settings.STRIPE_SECRET_KEY


class StripeService:
    # Price ID mapping
    PRICE_IDS = {
        SubscriptionPlan.STARTER_TRIAL: settings.STRIPE_PRICE_STARTER_TRIAL,
        SubscriptionPlan.BASIC: settings.STRIPE_PRICE_BASIC,
        SubscriptionPlan.PROFESSIONAL: settings.STRIPE_PRICE_PROFESSIONAL,
        SubscriptionPlan.PREMIUM: settings.STRIPE_PRICE_PREMIUM,
    }

    async def create_customer(self, email: str, name: Optional[str] = None) -> str:
        """Create Stripe customer"""
        customer = stripe.Customer.create(
            email=email,
            name=name,
            metadata={"platform": "vami"}
        )
        return customer.id

    async def create_checkout_session(
        self,
        customer_id: str,
        plan: SubscriptionPlan,
        success_url: str,
        cancel_url: str,
        trial_days: int = 0,
    ) -> str:
        """Create Stripe Checkout session"""
        price_id = self.PRICE_IDS.get(plan)
        if not price_id:
            raise ValueError(f"No price ID configured for plan: {plan}")

        session_params = {
            "customer": customer_id,
            "payment_method_types": ["card"],
            "line_items": [
                {
                    "price": price_id,
                    "quantity": 1,
                }
            ],
            "mode": "subscription",
            "success_url": success_url,
            "cancel_url": cancel_url,
            "metadata": {
                "plan": plan.value,
            },
        }

        # Add trial if specified
        if trial_days > 0:
            session_params["subscription_data"] = {
                "trial_period_days": trial_days
            }

        session = stripe.checkout.Session.create(**session_params)
        return session.url

    async def get_subscription(self, subscription_id: str):
        """Get subscription details"""
        return stripe.Subscription.retrieve(subscription_id)

    async def cancel_subscription(self, subscription_id: str, at_period_end: bool = True):
        """Cancel subscription"""
        if at_period_end:
            return stripe.Subscription.modify(
                subscription_id,
                cancel_at_period_end=True
            )
        else:
            return stripe.Subscription.cancel(subscription_id)

    async def reactivate_subscription(self, subscription_id: str):
        """Reactivate a subscription scheduled for cancellation"""
        return stripe.Subscription.modify(
            subscription_id,
            cancel_at_period_end=False
        )

    async def change_subscription_plan(self, subscription_id: str, new_plan: SubscriptionPlan):
        """Change subscription plan"""
        price_id = self.PRICE_IDS.get(new_plan)
        if not price_id:
            raise ValueError(f"No price ID configured for plan: {new_plan}")

        subscription = stripe.Subscription.retrieve(subscription_id)

        # Update subscription with new price
        return stripe.Subscription.modify(
            subscription_id,
            items=[{
                "id": subscription["items"]["data"][0].id,
                "price": price_id,
            }],
            proration_behavior="always_invoice",  # Immediate upgrade with proration
        )

    async def create_customer_portal_session(self, customer_id: str, return_url: str) -> str:
        """Create customer portal session for managing billing"""
        session = stripe.billing_portal.Session.create(
            customer=customer_id,
            return_url=return_url,
        )
        return session.url

    async def get_invoices(self, customer_id: str, limit: int = 10):
        """Get customer invoices"""
        return stripe.Invoice.list(
            customer=customer_id,
            limit=limit
        )

    def verify_webhook_signature(self, payload: bytes, signature: str) -> dict:
        """Verify Stripe webhook signature"""
        try:
            event = stripe.Webhook.construct_event(
                payload, signature, settings.STRIPE_WEBHOOK_SECRET
            )
            return event
        except ValueError:
            raise ValueError("Invalid payload")
        except stripe.error.SignatureVerificationError:
            raise ValueError("Invalid signature")


# Singleton instance
stripe_service = StripeService()
