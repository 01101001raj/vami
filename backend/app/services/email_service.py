from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, Email, To, Content
from typing import Optional
from app.config import settings
import html
import logging

logger = logging.getLogger(__name__)


class EmailService:
    def __init__(self):
        self.client = SendGridAPIClient(settings.SENDGRID_API_KEY)
        self.from_email = Email(settings.SENDGRID_FROM_EMAIL, settings.SENDGRID_FROM_NAME)

    def _sanitize(self, text: str) -> str:
        """Sanitize user input for HTML email templates"""
        if not text:
            return ""
        return html.escape(str(text))

    async def send_welcome_email(self, to_email: str, company_name: str, agent_id: str):
        """Send welcome email to new user"""
        company_name = self._sanitize(company_name)
        agent_id = self._sanitize(agent_id)
        subject = f"Welcome to {settings.APP_NAME}!"

        html_content = f"""
        <html>
            <body>
                <h1>Welcome to Vami, {company_name}!</h1>
                <p>Your AI voice agent is now active and ready to handle calls 24/7.</p>

                <h2>Next Steps:</h2>
                <ol>
                    <li>Upload your knowledge base documents</li>
                    <li>Connect your Google Calendar</li>
                    <li>Configure your business hours</li>
                    <li>Test your agent</li>
                </ol>

                <p>Your Agent ID: <strong>{agent_id}</strong></p>

                <p>
                    <a href="{settings.FRONTEND_URL}/dashboard" style="background-color: #4CAF50; color: white; padding: 14px 20px; text-decoration: none; border-radius: 4px;">
                        Go to Dashboard
                    </a>
                </p>

                <p>Need help? Reply to this email or visit our support center.</p>

                <p>Best regards,<br>The Vami Team</p>
            </body>
        </html>
        """

        await self._send_email(to_email, subject, html_content)

    async def send_appointment_confirmation(
        self,
        to_email: str,
        patient_name: str,
        appointment_date: str,
        appointment_time: str,
        business_name: str
    ):
        """Send appointment confirmation email"""
        patient_name = self._sanitize(patient_name)
        appointment_date = self._sanitize(appointment_date)
        appointment_time = self._sanitize(appointment_time)
        business_name = self._sanitize(business_name)
        subject = f"Appointment Confirmation - {business_name}"

        html_content = f"""
        <html>
            <body>
                <h1>Appointment Confirmed</h1>
                <p>Hello {patient_name},</p>

                <p>Your appointment has been confirmed:</p>

                <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
                    <p><strong>Date:</strong> {appointment_date}</p>
                    <p><strong>Time:</strong> {appointment_time}</p>
                    <p><strong>Location:</strong> {business_name}</p>
                </div>

                <p>Please arrive 10 minutes early for check-in.</p>

                <p>If you need to cancel or reschedule, please call us as soon as possible.</p>

                <p>Best regards,<br>{business_name}</p>
            </body>
        </html>
        """

        await self._send_email(to_email, subject, html_content)

    async def send_usage_alert(
        self,
        to_email: str,
        company_name: str,
        minutes_used: float,
        minutes_limit: int,
        percentage: float
    ):
        """Send usage alert when approaching limit"""
        company_name = self._sanitize(company_name)
        subject = f"Usage Alert: {percentage:.0f}% of Monthly Minutes Used"

        html_content = f"""
        <html>
            <body>
                <h1>Usage Alert</h1>
                <p>Hello {company_name},</p>

                <p>You've used {percentage:.0f}% of your monthly minute allowance:</p>

                <div style="background-color: #fff3cd; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
                    <p><strong>Minutes Used:</strong> {minutes_used:.1f} / {minutes_limit}</p>
                    <p><strong>Percentage:</strong> {percentage:.1f}%</p>
                </div>

                <p>Consider upgrading your plan to avoid service interruption.</p>

                <p>
                    <a href="{settings.FRONTEND_URL}/billing" style="background-color: #007bff; color: white; padding: 14px 20px; text-decoration: none; border-radius: 4px;">
                        View Billing
                    </a>
                </p>

                <p>Best regards,<br>The Vami Team</p>
            </body>
        </html>
        """

        await self._send_email(to_email, subject, html_content)

    async def send_payment_failed_email(self, to_email: str, company_name: str):
        """Send payment failed notification"""
        company_name = self._sanitize(company_name)
        subject = "Payment Failed - Action Required"

        html_content = f"""
        <html>
            <body>
                <h1>Payment Failed</h1>
                <p>Hello {company_name},</p>

                <p style="color: #d32f2f;">We were unable to process your recent payment.</p>

                <p>Please update your payment method to avoid service interruption.</p>

                <p>
                    <a href="{settings.FRONTEND_URL}/billing" style="background-color: #d32f2f; color: white; padding: 14px 20px; text-decoration: none; border-radius: 4px;">
                        Update Payment Method
                    </a>
                </p>

                <p>If you have questions, please contact our support team.</p>

                <p>Best regards,<br>The Vami Team</p>
            </body>
        </html>
        """

        await self._send_email(to_email, subject, html_content)

    async def _send_email(self, to_email: str, subject: str, html_content: str):
        """Internal method to send email"""
        try:
            message = Mail(
                from_email=self.from_email,
                to_emails=To(to_email),
                subject=subject,
                html_content=Content("text/html", html_content)
            )

            response = self.client.send(message)
            return response.status_code == 202
        except Exception as e:
            logger.error(f"Failed to send email: {str(e)}")
            return False


# Singleton instance
email_service = EmailService()
