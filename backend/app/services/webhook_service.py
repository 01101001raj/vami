"""
Webhook processing service for handling ElevenLabs callbacks
"""
from typing import Dict, Any
from datetime import datetime
from app.services.supabase_service import supabase_service
from app.services.calendar_service import calendar_service
from app.services.email_service import email_service
from app.services.sms_service import sms_service


class WebhookService:
    async def process_appointment_booking(
        self,
        agent_id: str,
        patient_name: str,
        patient_phone: str,
        patient_email: str,
        date: str,
        time: str,
        reason: str
    ) -> Dict[str, Any]:
        """Process appointment booking from voice agent"""
        try:
            # Get agent to find user
            agent = await supabase_service.get_agent_by_id(agent_id)
            if not agent:
                return {"success": False, "error": "Agent not found"}

            # Get user
            user = await supabase_service.get_user(agent.user_id)
            if not user:
                return {"success": False, "error": "User not found"}

            # Check if user has calendar connected
            calendar_conn = await supabase_service.get_calendar_connection(user.id)
            if not calendar_conn:
                return {"success": False, "error": "Calendar not connected"}

            # Create calendar event
            start_time = datetime.strptime(f"{date} {time}", "%Y-%m-%d %H:%M")
            end_time = start_time.replace(hour=start_time.hour + 1)  # 1 hour appointment

            event = await calendar_service.create_event(
                access_token=calendar_conn["access_token"],
                calendar_id=calendar_conn["calendar_id"],
                summary=f"Patient: {patient_name}",
                description=f"Reason: {reason}\nPhone: {patient_phone}",
                start_time=start_time,
                end_time=end_time,
                attendee_emails=[patient_email] if patient_email else []
            )

            # Send email confirmation if feature enabled
            features_dict = user.features.dict() if hasattr(user.features, 'dict') else user.features
            if features_dict.get("email_confirmation") and patient_email:
                await email_service.send_appointment_confirmation(
                    to_email=patient_email,
                    patient_name=patient_name,
                    appointment_date=date,
                    appointment_time=time,
                    business_name=user.company_name or "Healthcare Practice"
                )

            # Send SMS confirmation if feature enabled
            if features_dict.get("sms_confirmation") and patient_phone:
                await sms_service.send_appointment_confirmation(
                    to_phone=patient_phone,
                    patient_name=patient_name,
                    appointment_date=date,
                    appointment_time=time,
                    business_name=user.company_name or "Healthcare Practice"
                )

            return {
                "success": True,
                "event_id": event["event_id"],
                "message": f"Appointment booked for {date} at {time}"
            }

        except Exception as e:
            return {"success": False, "error": str(e)}

    async def check_availability(
        self,
        agent_id: str,
        date: str
    ) -> Dict[str, Any]:
        """Check calendar availability for a date"""
        try:
            # Get agent to find user
            agent = await supabase_service.get_agent_by_id(agent_id)
            if not agent:
                return {"success": False, "error": "Agent not found"}

            # Get calendar connection
            calendar_conn = await supabase_service.get_calendar_connection(agent.user_id)
            if not calendar_conn:
                return {"success": False, "available_slots": []}

            # Get available slots
            slots = await calendar_service.check_availability(
                access_token=calendar_conn["access_token"],
                calendar_id=calendar_conn["calendar_id"],
                date=date
            )

            return {
                "success": True,
                "available_slots": slots
            }

        except Exception as e:
            return {"success": False, "error": str(e)}


# Singleton instance
webhook_service = WebhookService()
