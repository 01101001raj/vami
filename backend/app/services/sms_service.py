from twilio.rest import Client
from app.config import settings
import logging

logger = logging.getLogger(__name__)


class SMSService:
    def __init__(self):
        self.client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
        self.from_number = settings.TWILIO_PHONE_NUMBER

    async def send_appointment_confirmation(
        self,
        to_phone: str,
        patient_name: str,
        appointment_date: str,
        appointment_time: str,
        business_name: str
    ):
        """Send appointment confirmation SMS"""
        message_body = (
            f"Hi {patient_name}, your appointment with {business_name} "
            f"is confirmed for {appointment_date} at {appointment_time}. "
            f"Reply CANCEL to cancel."
        )

        return await self._send_sms(to_phone, message_body)

    async def send_appointment_reminder(
        self,
        to_phone: str,
        patient_name: str,
        appointment_time: str,
        business_name: str
    ):
        """Send appointment reminder SMS"""
        message_body = (
            f"Reminder: {patient_name}, you have an appointment with {business_name} "
            f"at {appointment_time} today. Reply CONFIRM to confirm."
        )

        return await self._send_sms(to_phone, message_body)

    async def _send_sms(self, to_phone: str, message_body: str):
        """Internal method to send SMS"""
        try:
            message = self.client.messages.create(
                body=message_body,
                from_=self.from_number,
                to=to_phone
            )
            return message.sid
        except Exception as e:
            logger.error(f"Failed to send SMS: {str(e)}")
            return None


# Singleton instance
sms_service = SMSService()
