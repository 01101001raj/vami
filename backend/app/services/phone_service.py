"""
Phone Number Provisioning Service

Handles automatic phone number provisioning for multi-tenant system.
Each user/agent gets their own dedicated phone number.
"""

from typing import Optional, Dict, Any
from twilio.rest import Client
from twilio.base.exceptions import TwilioRestException
from app.config import settings
from app.database import get_supabase
import logging

logger = logging.getLogger(__name__)


class PhoneService:
    def __init__(self):
        """Initialize Twilio client"""
        self.client = Client(
            settings.TWILIO_ACCOUNT_SID,
            settings.TWILIO_AUTH_TOKEN
        )
        self.db = get_supabase()

    async def list_available_numbers(
        self,
        area_code: Optional[str] = None,
        country: str = "US",
        limit: int = 20
    ) -> list[Dict[str, Any]]:
        """
        List available phone numbers from Twilio that can be purchased

        Args:
            area_code: Filter by area code (e.g., "212" for NYC)
            country: Country code (default: "US")
            limit: Maximum numbers to return

        Returns:
            List of available phone numbers with details
        """
        try:
            search_params = {
                "country": country,
                "voice_enabled": True,
                "capabilities": {"voice": True}
            }

            if area_code:
                search_params["area_code"] = area_code

            # Search for available numbers
            available_numbers = self.client.available_phone_numbers(country).local.list(
                **search_params,
                limit=limit
            )

            # Format response
            numbers_list = []
            for num in available_numbers:
                numbers_list.append({
                    "phone_number": num.phone_number,
                    "friendly_name": num.friendly_name,
                    "locality": num.locality,
                    "region": num.region,
                    "postal_code": num.postal_code,
                    "capabilities": {
                        "voice": num.capabilities.get("voice", False),
                        "sms": num.capabilities.get("SMS", False),
                        "mms": num.capabilities.get("MMS", False)
                    }
                })

            return numbers_list

        except TwilioRestException as e:
            logger.error(f"Twilio error listing numbers: {e}")
            raise Exception(f"Failed to list available numbers: {str(e)}")

    async def list_owned_numbers(self) -> list[Dict[str, Any]]:
        """
        List all phone numbers already owned in Twilio account

        Returns:
            List of owned phone numbers with assignment status
        """
        try:
            # Get all incoming phone numbers from Twilio
            incoming_numbers = self.client.incoming_phone_numbers.list()

            # Get assigned numbers from database
            assigned_result = self.db.table("phone_numbers").select("phone_number, user_id, agent_id, status").execute()
            assigned_map = {row["phone_number"]: row for row in assigned_result.data}

            numbers_list = []
            for num in incoming_numbers:
                phone_number = num.phone_number
                assigned_info = assigned_map.get(phone_number)

                numbers_list.append({
                    "phone_number": phone_number,
                    "phone_number_sid": num.sid,
                    "friendly_name": num.friendly_name,
                    "is_assigned": phone_number in assigned_map,
                    "assigned_to_user": assigned_info["user_id"] if assigned_info else None,
                    "assigned_to_agent": assigned_info["agent_id"] if assigned_info else None,
                    "status": assigned_info["status"] if assigned_info else "available"
                })

            return numbers_list

        except Exception as e:
            logger.error(f"Error listing owned numbers: {e}")
            raise Exception(f"Failed to list owned numbers: {str(e)}")

    async def assign_phone_number(
        self,
        user_id: str,
        agent_id: str,
        phone_number: str,
        phone_number_sid: str
    ) -> Dict[str, Any]:
        """
        Assign an existing owned phone number to a user/agent
        This is the preferred method - assigns from pool of owned numbers

        Args:
            user_id: User ID
            agent_id: Agent ID (ElevenLabs agent ID)
            phone_number: The phone number to assign (e.g., "+12125551234")
            phone_number_sid: Twilio SID of the phone number

        Returns:
            Assignment details
        """
        try:
            # Check if number is already assigned
            existing = self.db.table("phone_numbers").select("*").eq("phone_number", phone_number).execute()

            if existing.data:
                raise Exception(f"Phone number {phone_number} is already assigned")

            # Update the phone number's webhook to point to ElevenLabs
            # This connects incoming calls to the specific agent
            elevenlabs_webhook = f"{settings.ELEVENLABS_WEBHOOK_URL}/{agent_id}"

            self.client.incoming_phone_numbers(phone_number_sid).update(
                voice_url=elevenlabs_webhook,
                voice_method="POST",
                status_callback=f"{settings.WEBHOOK_BASE_URL}/api/webhooks/call/status",
                status_callback_method="POST"
            )

            # Store assignment in database
            phone_data = {
                "user_id": user_id,
                "agent_id": agent_id,
                "phone_number": phone_number,
                "phone_number_sid": phone_number_sid,
                "provider": "twilio",
                "status": "active",
                "provisioned_at": "now()"
            }

            result = self.db.table("phone_numbers").insert(phone_data).execute()

            # Update agents table for quick lookup
            self.db.table("agents").update({
                "phone_number": phone_number,
                "phone_number_sid": phone_number_sid,
                "phone_number_provider": "twilio",
                "phone_number_status": "active"
            }).eq("agent_id", agent_id).execute()

            logger.info(f"Assigned phone number {phone_number} to agent {agent_id}")

            return {
                "phone_number": phone_number,
                "phone_number_sid": phone_number_sid,
                "status": "active",
                "assigned_at": phone_data["provisioned_at"]
            }

        except Exception as e:
            logger.error(f"Error assigning phone number: {e}")
            raise Exception(f"Failed to assign phone number: {str(e)}")

    async def provision_phone_number(
        self,
        user_id: str,
        agent_id: str,
        phone_number: Optional[str] = None,
        area_code: Optional[str] = None,
        country: str = "US"
    ) -> Dict[str, Any]:
        """
        Buy a NEW phone number from Twilio and assign it

        This is used during onboarding when customer selects a specific number

        Args:
            user_id: User ID
            agent_id: Agent ID
            phone_number: Specific phone number to purchase (if customer selected one)
            area_code: Preferred area code (e.g., "212" for NYC) - used if phone_number not provided
            country: Country code (default: "US")

        Returns:
            Phone number details including number and SID
        """
        try:
            # If specific phone number provided, purchase that one
            if phone_number:
                # Purchase the specific phone number the customer selected
                elevenlabs_webhook = f"{settings.ELEVENLABS_WEBHOOK_URL}/{agent_id}"

                purchased_number = self.client.incoming_phone_numbers.create(
                    phone_number=phone_number,
                    voice_url=elevenlabs_webhook,
                    voice_method="POST",
                    status_callback=f"{settings.WEBHOOK_BASE_URL}/api/webhooks/call/status",
                    status_callback_method="POST"
                )
            else:
                # Search for available phone numbers
                search_params = {
                    "country": country,
                    "voice_enabled": True,
                    "capabilities": {"voice": True}
                }

                if area_code:
                    search_params["area_code"] = area_code

                # Find available numbers
                available_numbers = self.client.available_phone_numbers(country).local.list(
                    **search_params,
                    limit=1
                )

                if not available_numbers:
                    raise Exception(f"No available phone numbers in {country}" +
                                  (f" with area code {area_code}" if area_code else ""))

                selected_number = available_numbers[0]

                # Purchase the phone number
                elevenlabs_webhook = f"{settings.ELEVENLABS_WEBHOOK_URL}/{agent_id}"

                purchased_number = self.client.incoming_phone_numbers.create(
                    phone_number=selected_number.phone_number,
                    voice_url=elevenlabs_webhook,
                    voice_method="POST",
                    status_callback=f"{settings.WEBHOOK_BASE_URL}/api/webhooks/call/status",
                    status_callback_method="POST"
                )

            # Store in database
            phone_data = {
                "user_id": user_id,
                "agent_id": agent_id,
                "phone_number": purchased_number.phone_number,
                "phone_number_sid": purchased_number.sid,
                "provider": "twilio",
                "status": "active",
                "country_code": country,
                "friendly_name": purchased_number.friendly_name,
                "capabilities": {
                    "voice": True,
                    "sms": purchased_number.capabilities.get("sms", False) if hasattr(purchased_number, 'capabilities') else False,
                    "mms": purchased_number.capabilities.get("mms", False) if hasattr(purchased_number, 'capabilities') else False
                },
                "provisioned_at": "now()"
            }

            result = self.db.table("phone_numbers").insert(phone_data).execute()

            # Also update agents table for quick lookup
            self.db.table("agents").update({
                "phone_number": purchased_number.phone_number,
                "phone_number_sid": purchased_number.sid,
                "phone_number_provider": "twilio",
                "phone_number_status": "active"
            }).eq("agent_id", agent_id).execute()

            logger.info(f"Provisioned phone number {purchased_number.phone_number} for agent {agent_id}")

            return {
                "phone_number": purchased_number.phone_number,
                "phone_number_sid": purchased_number.sid,
                "friendly_name": purchased_number.friendly_name,
                "capabilities": phone_data["capabilities"],
                "status": "active"
            }

        except TwilioRestException as e:
            logger.error(f"Twilio error provisioning phone number: {e}")
            raise Exception(f"Failed to provision phone number: {str(e)}")

        except Exception as e:
            logger.error(f"Error provisioning phone number: {e}")
            raise

    async def release_phone_number(
        self,
        agent_id: str,
        phone_number_sid: str
    ) -> bool:
        """
        Release a phone number back to Twilio

        Args:
            agent_id: Agent ID
            phone_number_sid: Twilio phone number SID

        Returns:
            True if successful
        """
        try:
            # Release from Twilio
            self.client.incoming_phone_numbers(phone_number_sid).delete()

            # Update database
            self.db.table("phone_numbers").update({
                "status": "released",
                "released_at": "now()"
            }).eq("phone_number_sid", phone_number_sid).execute()

            # Update agents table
            self.db.table("agents").update({
                "phone_number_status": "inactive"
            }).eq("agent_id", agent_id).execute()

            logger.info(f"Released phone number {phone_number_sid} for agent {agent_id}")

            return True

        except TwilioRestException as e:
            logger.error(f"Twilio error releasing phone number: {e}")
            raise Exception(f"Failed to release phone number: {str(e)}")

        except Exception as e:
            logger.error(f"Error releasing phone number: {e}")
            raise

    async def get_agent_by_phone_number(self, phone_number: str) -> Optional[Dict[str, Any]]:
        """
        Get agent details by their phone number (for routing incoming calls)

        Args:
            phone_number: Phone number in E.164 format (e.g., +12125551234)

        Returns:
            Agent details or None if not found
        """
        try:
            result = self.db.table("agents").select(
                "*, users(email, company_name, plan)"
            ).eq("phone_number", phone_number).eq("status", "active").execute()

            if result.data:
                return result.data[0]

            return None

        except Exception as e:
            logger.error(f"Error getting agent by phone number: {e}")
            return None

    async def update_webhook_urls(
        self,
        phone_number_sid: str,
        voice_url: Optional[str] = None,
        status_callback_url: Optional[str] = None
    ) -> bool:
        """
        Update webhook URLs for a phone number

        Args:
            phone_number_sid: Twilio phone number SID
            voice_url: New voice webhook URL
            status_callback_url: New status callback URL

        Returns:
            True if successful
        """
        try:
            update_params = {}

            if voice_url:
                update_params["voice_url"] = voice_url
                update_params["voice_method"] = "POST"

            if status_callback_url:
                update_params["status_callback"] = status_callback_url
                update_params["status_callback_method"] = "POST"

            if update_params:
                self.client.incoming_phone_numbers(phone_number_sid).update(**update_params)
                logger.info(f"Updated webhook URLs for phone number {phone_number_sid}")
                return True

            return False

        except TwilioRestException as e:
            logger.error(f"Twilio error updating webhooks: {e}")
            raise Exception(f"Failed to update webhooks: {str(e)}")

        except Exception as e:
            logger.error(f"Error updating webhooks: {e}")
            raise

    async def list_user_phone_numbers(self, user_id: str) -> list:
        """
        Get all phone numbers for a user

        Args:
            user_id: User ID

        Returns:
            List of phone numbers
        """
        try:
            result = self.db.table("phone_numbers").select("*").eq(
                "user_id", user_id
            ).order("created_at", desc=True).execute()

            return result.data

        except Exception as e:
            logger.error(f"Error listing phone numbers: {e}")
            return []


# Global instance
phone_service = PhoneService()
