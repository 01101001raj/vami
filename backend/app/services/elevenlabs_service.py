from typing import Optional, Dict, Any
from app.config import settings


class ElevenLabsService:
    def __init__(self):
        # ElevenLabs client initialization
        # For production, install and use: from elevenlabs import ElevenLabs
        # self.client = ElevenLabs(api_key=settings.ELEVENLABS_API_KEY)
        self.api_key = settings.ELEVENLABS_API_KEY
        self.client = None  # Placeholder for development

    async def create_agent(
        self,
        name: str,
        prompt: str,
        voice_id: str = "21m00Tcm4TlvDq8ikWAM",  # Default Rachel voice
        language: str = "en",
    ) -> Dict[str, Any]:
        """Create an ElevenLabs conversational AI agent"""
        try:
            # Note: This is a placeholder - actual ElevenLabs API calls depend on their SDK
            # The actual implementation would use their agent creation endpoint
            agent_config = {
                "name": name,
                "prompt": prompt,
                "voice": {
                    "voice_id": voice_id
                },
                "language": language,
                "conversation_config": {
                    "agent": {
                        "prompt": {
                            "prompt": prompt
                        }
                    }
                }
            }

            # This would be the actual API call:
            # response = self.client.agents.create(**agent_config)

            # For development, return mock data
            return {
                "agent_id": f"agent_{name.lower().replace(' ', '_')}",
                "name": name,
                "status": "active",
                "metadata": agent_config
            }

        except Exception as e:
            raise Exception(f"Failed to create ElevenLabs agent: {str(e)}")

    async def update_agent(self, agent_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
        """Update agent configuration"""
        try:
            # response = self.client.agents.update(agent_id, **updates)
            return {"agent_id": agent_id, "status": "updated"}
        except Exception as e:
            raise Exception(f"Failed to update agent: {str(e)}")

    async def delete_agent(self, agent_id: str) -> bool:
        """Delete an agent"""
        try:
            # self.client.agents.delete(agent_id)
            return True
        except Exception as e:
            raise Exception(f"Failed to delete agent: {str(e)}")

    async def add_knowledge_base(
        self, agent_id: str, content: str, content_type: str = "text"
    ) -> Dict[str, Any]:
        """Add knowledge base content to agent"""
        try:
            # This would upload documents/URLs to the agent's knowledge base
            # response = self.client.agents.knowledge_base.add(agent_id, content, content_type)
            return {"status": "added", "content_type": content_type}
        except Exception as e:
            raise Exception(f"Failed to add knowledge base: {str(e)}")

    async def get_conversation(self, conversation_id: str) -> Dict[str, Any]:
        """Get conversation details"""
        try:
            # response = self.client.conversations.get(conversation_id)
            return {"conversation_id": conversation_id}
        except Exception as e:
            raise Exception(f"Failed to get conversation: {str(e)}")

    def verify_webhook_signature(self, payload: bytes, signature: str, timestamp: str) -> bool:
        """Verify ElevenLabs webhook signature using HMAC and check timestamp"""
        import hmac
        import hashlib
        from datetime import datetime, timedelta

        # Verify timestamp is recent (within 5 minutes) to prevent replay attacks
        try:
            webhook_time = datetime.fromtimestamp(int(timestamp))
            current_time = datetime.utcnow()
            time_diff = abs((current_time - webhook_time).total_seconds())

            # Reject if timestamp is more than 5 minutes old
            if time_diff > 300:  # 5 minutes
                return False
        except (ValueError, TypeError):
            # Invalid timestamp format
            return False

        # Create the signed payload string
        signed_payload = f"{timestamp}.{payload.decode('utf-8')}"

        # Compute the expected signature
        expected_signature = hmac.new(
            settings.ELEVENLABS_WEBHOOK_SECRET.encode(),
            signed_payload.encode(),
            hashlib.sha256
        ).hexdigest()

        # Compare signatures using constant-time comparison
        return hmac.compare_digest(expected_signature, signature)


# Singleton instance
elevenlabs_service = ElevenLabsService()
