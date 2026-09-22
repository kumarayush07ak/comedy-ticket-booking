from email.message import EmailMessage
import smtplib

from app.config import settings


class EmailService:

    @staticmethod
    def send_verification_email(
        recipient_email: str,
        recipient_name: str,
        verification_token: str,
    ) -> None:
        verification_link = (
            f"{settings.frontend_base_url}/verify-email"
            f"?token={verification_token}"
        )

        message = EmailMessage()

        message["Subject"] = "Verify your Comedy Ticket Booking account"
        message["From"] = settings.smtp_from_email
        message["To"] = recipient_email

        message.set_content(
            f"""Hello {recipient_name},

Welcome to the Comedy Ticket Booking Platform!

Please verify your email address by clicking the link below:

{verification_link}

This verification link will expire in
{settings.email_verification_expire_minutes} minutes.

If you did not create this account, you can safely ignore this email.

Regards,
Comedy Ticket Booking Platform
"""
        )

        with smtplib.SMTP(
            settings.smtp_host,
            settings.smtp_port,
            timeout=30,
        ) as smtp:
            smtp.starttls()
            smtp.login(
                settings.smtp_username,
                settings.smtp_password,
            )
            smtp.send_message(message)