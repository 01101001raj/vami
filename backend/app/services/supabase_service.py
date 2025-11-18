from typing import Optional, Dict, Any, List
from datetime import datetime, date
from app.database import get_supabase
from app.models.user import User, UserFeatures, SubscriptionPlan, PLAN_FEATURES
from app.models.agent import Agent
from app.models.conversation import Conversation
from app.models.subscription import UsageRecord
from decimal import Decimal


class SupabaseService:
    def __init__(self):
        self.db = get_supabase()

    # User Operations
    async def create_user_profile(
        self, user_id: str, email: str, company_name: Optional[str], plan: SubscriptionPlan
    ) -> User:
        """Create user profile in database"""
        features = PLAN_FEATURES[plan]

        user_data = {
            "id": user_id,
            "email": email,
            "company_name": company_name,
            "plan": plan.value,
            "features": features.dict(),
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
        }

        result = self.db.table("users").insert(user_data).execute()
        return User(**result.data[0])

    async def get_user(self, user_id: str) -> Optional[User]:
        """Get user by ID"""
        result = self.db.table("users").select("*").eq("id", user_id).execute()
        if result.data:
            return User(**result.data[0])
        return None

    async def update_user(self, user_id: str, updates: Dict[str, Any]) -> User:
        """Update user profile"""
        updates["updated_at"] = datetime.utcnow().isoformat()
        result = self.db.table("users").update(updates).eq("id", user_id).execute()
        return User(**result.data[0])

    async def update_user_subscription(
        self,
        user_id: str,
        stripe_customer_id: str,
        stripe_subscription_id: str,
        status: str,
        current_period_end: datetime,
        plan: SubscriptionPlan,
    ) -> User:
        """Update user subscription info"""
        features = PLAN_FEATURES[plan]

        updates = {
            "stripe_customer_id": stripe_customer_id,
            "stripe_subscription_id": stripe_subscription_id,
            "subscription_status": status,
            "current_period_end": current_period_end.isoformat(),
            "plan": plan.value,
            "features": features.dict(),
            "updated_at": datetime.utcnow().isoformat(),
        }

        result = self.db.table("users").update(updates).eq("id", user_id).execute()
        return User(**result.data[0])

    # Agent Operations
    async def create_agent(
        self, user_id: str, agent_id: str, agent_name: str, metadata: Optional[Dict] = None
    ) -> Agent:
        """Create agent record"""
        agent_data = {
            "user_id": user_id,
            "agent_id": agent_id,
            "agent_name": agent_name,
            "status": "active",
            "elevenlabs_metadata": metadata or {},
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
        }

        result = self.db.table("agents").insert(agent_data).execute()
        return Agent(**result.data[0])

    async def get_agent_by_user(self, user_id: str) -> Optional[Agent]:
        """Get agent for user"""
        result = self.db.table("agents").select("*").eq("user_id", user_id).eq("status", "active").execute()
        if result.data:
            return Agent(**result.data[0])
        return None

    async def get_agent_by_id(self, agent_id: str) -> Optional[Agent]:
        """Get agent by ElevenLabs agent ID"""
        result = self.db.table("agents").select("*").eq("agent_id", agent_id).execute()
        if result.data:
            return Agent(**result.data[0])
        return None

    # Conversation Operations
    async def create_conversation(self, conversation_data: Dict[str, Any]) -> Conversation:
        """Store conversation from webhook"""
        conversation_data["created_at"] = datetime.utcnow().isoformat()
        result = self.db.table("conversations").insert(conversation_data).execute()
        return Conversation(**result.data[0])

    async def get_conversations(
        self, agent_id: str, limit: int = 20, offset: int = 0
    ) -> List[Conversation]:
        """Get conversations for an agent"""
        result = (
            self.db.table("conversations")
            .select("*")
            .eq("agent_id", agent_id)
            .order("created_at", desc=True)
            .limit(limit)
            .offset(offset)
            .execute()
        )
        return [Conversation(**conv) for conv in result.data]

    async def get_conversation_by_id(self, conversation_id: str) -> Optional[Conversation]:
        """Get conversation by ID"""
        result = self.db.table("conversations").select("*").eq("conversation_id", conversation_id).execute()
        if result.data:
            return Conversation(**result.data[0])
        return None

    # Usage Tracking
    async def record_usage(
        self,
        user_id: str,
        conversation_id: str,
        minutes_used: float,
        billing_period_start: date,
        billing_period_end: date,
    ):
        """Record usage for billing period"""
        usage_data = {
            "user_id": user_id,
            "conversation_id": conversation_id,
            "minutes_used": str(minutes_used),
            "billing_period_start": billing_period_start.isoformat(),
            "billing_period_end": billing_period_end.isoformat(),
            "created_at": datetime.utcnow().isoformat(),
        }

        self.db.table("usage_records").insert(usage_data).execute()

    async def get_usage_for_period(
        self, user_id: str, period_start: date, period_end: date
    ) -> float:
        """Get total usage for billing period"""
        result = (
            self.db.table("usage_records")
            .select("minutes_used")
            .eq("user_id", user_id)
            .gte("billing_period_start", period_start.isoformat())
            .lte("billing_period_end", period_end.isoformat())
            .execute()
        )

        total = sum(Decimal(record["minutes_used"]) for record in result.data)
        return float(total)

    # Calendar Connection
    async def save_calendar_connection(
        self,
        user_id: str,
        provider: str,
        calendar_id: str,
        access_token: str,
        refresh_token: str,
        expires_at: datetime,
    ):
        """Save or update calendar connection"""
        # Check if connection exists
        existing = (
            self.db.table("calendar_connections")
            .select("id")
            .eq("user_id", user_id)
            .eq("provider", provider)
            .execute()
        )

        connection_data = {
            "user_id": user_id,
            "provider": provider,
            "calendar_id": calendar_id,
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_expires_at": expires_at.isoformat(),
            "status": "active",
            "updated_at": datetime.utcnow().isoformat(),
        }

        if existing.data:
            # Update existing
            self.db.table("calendar_connections").update(connection_data).eq("id", existing.data[0]["id"]).execute()
        else:
            # Create new
            connection_data["created_at"] = datetime.utcnow().isoformat()
            self.db.table("calendar_connections").insert(connection_data).execute()

    async def get_calendar_connection(self, user_id: str, provider: str = "google"):
        """Get calendar connection"""
        result = (
            self.db.table("calendar_connections")
            .select("*")
            .eq("user_id", user_id)
            .eq("provider", provider)
            .eq("status", "active")
            .execute()
        )
        if result.data:
            return result.data[0]
        return None

    async def update_agent(self, agent_id: int, updates: Dict[str, Any]):
        """Update agent record"""
        updates["updated_at"] = datetime.utcnow().isoformat()
        result = self.db.table("agents").update(updates).eq("id", agent_id).execute()
        return result.data[0] if result.data else None

    async def update_calendar_connection(self, connection_id: int, updates: Dict[str, Any]):
        """Update calendar connection"""
        updates["updated_at"] = datetime.utcnow().isoformat()
        self.db.table("calendar_connections").update(updates).eq("id", connection_id).execute()

    async def get_analytics_stats(self, agent_id: str, days: int = 7) -> Dict[str, Any]:
        """Get analytics statistics for an agent"""
        from datetime import timedelta

        # Calculate date range
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)

        # Get all conversations in the period
        result = (
            self.db.table("conversations")
            .select("*")
            .eq("agent_id", agent_id)
            .gte("created_at", start_date.isoformat())
            .lte("created_at", end_date.isoformat())
            .execute()
        )

        conversations = result.data
        total_calls = len(conversations)
        successful_calls = sum(1 for c in conversations if c.get('call_successful') == 'success')
        total_duration_secs = sum(c.get('duration_secs', 0) or 0 for c in conversations)
        total_minutes = total_duration_secs / 60.0 if total_duration_secs > 0 else 0
        avg_duration_secs = total_duration_secs / total_calls if total_calls > 0 else 0

        # Count sentiment breakdown
        sentiment_breakdown = {}
        for c in conversations:
            sentiment = c.get('sentiment')
            if sentiment:
                sentiment_breakdown[sentiment] = sentiment_breakdown.get(sentiment, 0) + 1

        return {
            'total_calls': total_calls,
            'successful_calls': successful_calls,
            'failed_calls': total_calls - successful_calls,
            'total_minutes': total_minutes,
            'avg_duration_secs': avg_duration_secs,
            'appointments_booked': 0,  # Would need to parse conversation data
            'sentiment_breakdown': sentiment_breakdown
        }


# Singleton instance
supabase_service = SupabaseService()
