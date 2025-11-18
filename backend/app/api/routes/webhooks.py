from fastapi import APIRouter, Request, HTTPException, Header
from app.services.stripe_service import stripe_service
from app.services.elevenlabs_service import elevenlabs_service
from app.services.supabase_service import supabase_service
from app.services.email_service import email_service
from app.models.user import SubscriptionPlan
from datetime import datetime
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

router = APIRouter(prefix="/webhooks", tags=["Webhooks"])


@router.post("/stripe")
@limiter.limit("100/minute")  # Allow burst of webhook events
async def stripe_webhook(request: Request, stripe_signature: str = Header(None)):
    """Handle Stripe webhooks"""
    try:
        payload = await request.body()
        event = stripe_service.verify_webhook_signature(payload, stripe_signature)

        if event["type"] == "checkout.session.completed":
            session = event["data"]["object"]
            customer_id = session["customer"]
            subscription_id = session["subscription"]

            # Get user by Stripe customer ID
            result = supabase_service.db.table("users").select("*").eq("stripe_customer_id", customer_id).execute()
            if not result.data:
                return {"status": "user_not_found"}

            user_id = result.data[0]["id"]
            user_email = result.data[0]["email"]
            company_name = result.data[0]["company_name"]
            plan = SubscriptionPlan(session["metadata"].get("plan", "starter_trial"))

            # Get subscription details
            subscription = await stripe_service.get_subscription(subscription_id)

            # Update user subscription
            await supabase_service.update_user_subscription(
                user_id=user_id,
                stripe_customer_id=customer_id,
                stripe_subscription_id=subscription_id,
                status=subscription["status"],
                current_period_end=datetime.fromtimestamp(subscription["current_period_end"]),
                plan=plan
            )

            # Create ElevenLabs agent
            agent_response = await elevenlabs_service.create_agent(
                name=f"{company_name or user_email} Agent",
                prompt="You are a friendly and professional receptionist. Help customers book appointments and answer questions.",
            )

            # Save agent to database
            await supabase_service.create_agent(
                user_id=user_id,
                agent_id=agent_response["agent_id"],
                agent_name=agent_response["name"],
                metadata=agent_response.get("metadata")
            )

            # Send welcome email
            await email_service.send_welcome_email(user_email, company_name or user_email, agent_response["agent_id"])

        elif event["type"] == "invoice.payment_failed":
            # Handle payment failure
            invoice = event["data"]["object"]
            customer_id = invoice["customer"]

            result = supabase_service.db.table("users").select("email, company_name").eq("stripe_customer_id", customer_id).execute()
            if result.data:
                await email_service.send_payment_failed_email(result.data[0]["email"], result.data[0]["company_name"])

        return {"status": "success"}

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/elevenlabs")
@limiter.limit("100/minute")  # Allow burst of webhook events
async def elevenlabs_webhook(
    request: Request,
    xi_signature: str = Header(None, alias="xi-signature"),
    xi_timestamp: str = Header(None, alias="xi-timestamp")
):
    """Handle ElevenLabs post-call webhooks"""
    try:
        payload = await request.body()

        # Verify webhook signature
        if not xi_signature or not xi_timestamp:
            raise HTTPException(status_code=401, detail="Missing webhook signature headers")

        if not elevenlabs_service.verify_webhook_signature(payload, xi_signature, xi_timestamp):
            raise HTTPException(status_code=401, detail="Invalid webhook signature")

        # Parse JSON from payload
        import json
        data = json.loads(payload.decode('utf-8'))

        # Store conversation
        conversation_data = {
            "conversation_id": data.get("conversation_id"),
            "agent_id": data.get("agent_id"),
            "end_user_id": data.get("end_user_id"),
            "duration_secs": data.get("duration_secs"),
            "call_successful": data.get("call_successful"),
            "summary": data.get("summary"),
            "title": data.get("title"),
            "sentiment": data.get("sentiment"),
            "intent": data.get("intent"),
            "webhook_payload": data
        }

        await supabase_service.create_conversation(conversation_data)

        # Record usage
        if data.get("duration_secs"):
            minutes = data["duration_secs"] / 60
            # Get agent and user
            agent = await supabase_service.get_agent_by_id(data["agent_id"])
            if agent:
                from datetime import date
                from dateutil.relativedelta import relativedelta

                today = date.today()
                period_start = today.replace(day=1)
                period_end = (period_start + relativedelta(months=1)) - relativedelta(days=1)

                await supabase_service.record_usage(
                    user_id=agent.user_id,
                    conversation_id=data["conversation_id"],
                    minutes_used=minutes,
                    billing_period_start=period_start,
                    billing_period_end=period_end
                )

        return {"status": "success"}

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
