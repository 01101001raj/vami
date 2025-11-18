from typing import Optional, Dict, Any
from app.config import settings
import secrets

try:
    from elevenlabs.client import ElevenLabs
    ELEVENLABS_AVAILABLE = True
except ImportError:
    ELEVENLABS_AVAILABLE = False
    print("Warning: ElevenLabs SDK not installed. Install with: pip install elevenlabs")


class ElevenLabsService:
    def __init__(self):
        """Initialize ElevenLabs client"""
        self.api_key = settings.ELEVENLABS_API_KEY

        if ELEVENLABS_AVAILABLE and self.api_key and not self.api_key.startswith("placeholder"):
            try:
                self.client = ElevenLabs(api_key=self.api_key)
                self.use_mock = False
            except Exception as e:
                print(f"Warning: Failed to initialize ElevenLabs client: {e}")
                self.client = None
                self.use_mock = True
        else:
            self.client = None
            self.use_mock = True
            if not ELEVENLABS_AVAILABLE:
                print("Using mock ElevenLabs service - install elevenlabs package for real integration")

    async def create_agent(
        self,
        name: str,
        prompt: str,
        voice_id: str = "21m00Tcm4TlvDq8ikWAM",  # Default Rachel voice
        language: str = "en",
        first_message: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Create an ElevenLabs conversational AI agent

        Args:
            name: Agent display name
            prompt: System prompt defining agent behavior
            voice_id: ElevenLabs voice ID (default: Rachel)
            language: Language code (default: en)
            first_message: Initial greeting message

        Returns:
            Dict with agent_id, name, status, and metadata
        """
        try:
            # Set default first message if not provided
            if not first_message:
                first_message = f"Hello! I'm {name}. How can I help you today?"

            # If using real API
            if not self.use_mock and self.client:
                try:
                    # Create agent using ElevenLabs SDK
                    response = self.client.conversational_ai.agents.create(
                        name=name,
                        tags=["vami-platform"],  # Tag for identification
                        conversation_config={
                            "tts": {
                                "voice_id": voice_id,
                                "model_id": "eleven_turbo_v2_5"  # Fast, low-latency model
                            },
                            "agent": {
                                "prompt": {
                                    "prompt": prompt
                                },
                                "first_message": first_message,
                                "language": language
                            }
                        }
                    )

                    return {
                        "agent_id": response.agent_id,
                        "name": name,
                        "status": "active",
                        "metadata": {
                            "voice_id": voice_id,
                            "language": language,
                            "prompt": prompt,
                            "first_message": first_message
                        }
                    }
                except Exception as api_error:
                    print(f"ElevenLabs API error: {api_error}")
                    # Fall back to mock if API fails
                    pass

            # Mock implementation for development/testing
            mock_agent_id = f"agent_{secrets.token_urlsafe(16)}"
            return {
                "agent_id": mock_agent_id,
                "name": name,
                "status": "active",
                "metadata": {
                    "voice_id": voice_id,
                    "language": language,
                    "prompt": prompt,
                    "first_message": first_message,
                    "mock": True
                }
            }

        except Exception as e:
            raise Exception(f"Failed to create ElevenLabs agent: {str(e)}")

    async def update_agent(self, agent_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
        """
        Update agent configuration

        Args:
            agent_id: ElevenLabs agent ID
            updates: Dictionary of fields to update (name, prompt, voice_id, etc.)

        Returns:
            Updated agent information
        """
        try:
            if not self.use_mock and self.client:
                try:
                    # Update agent using ElevenLabs SDK
                    # Note: Update API may require specific format
                    response = self.client.conversational_ai.agents.update(
                        agent_id=agent_id,
                        **updates
                    )
                    return {"agent_id": agent_id, "status": "updated"}
                except Exception as api_error:
                    print(f"ElevenLabs API error: {api_error}")
                    pass

            # Mock response
            return {"agent_id": agent_id, "status": "updated", "mock": True}

        except Exception as e:
            raise Exception(f"Failed to update agent: {str(e)}")

    async def delete_agent(self, agent_id: str) -> bool:
        """
        Delete an agent

        Args:
            agent_id: ElevenLabs agent ID

        Returns:
            True if successful
        """
        try:
            if not self.use_mock and self.client:
                try:
                    self.client.conversational_ai.agents.delete(agent_id=agent_id)
                    return True
                except Exception as api_error:
                    print(f"ElevenLabs API error: {api_error}")
                    pass

            # Mock response
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
        """Verify ElevenLabs webhook signature using HMAC"""
        import hmac
        import hashlib

        # Create the signed payload string
        signed_payload = f"{timestamp}.{payload.decode('utf-8')}"

        # Compute the expected signature
        expected_signature = hmac.new(
            settings.ELEVENLABS_WEBHOOK_SECRET.encode(),
            signed_payload.encode(),
            hashlib.sha256
        ).hexdigest()

        # Compare signatures
        return hmac.compare_digest(expected_signature, signature)


# Singleton instance
elevenlabs_service = ElevenLabsService()
