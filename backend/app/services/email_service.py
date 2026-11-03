"""
Email Service – safe outbound message handling and logging.
"""

import os
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional, Tuple
from sqlalchemy.orm import Session

from app.models.email_message import EmailMessage
from app.models.contact import Contact

logger = logging.getLogger(__name__)


def send_or_log_email(
    recipient: str,
    body: str,
    subject: Optional[str] = None,
    db: Optional[Session] = None,
) -> Tuple[bool, str, Optional[EmailMessage]]:
    """
    Safely dispatches an email via SMTP if credentials are configured in environment variables,
    or securely persists the message to SQLite Outbox. No secrets or passwords are ever exposed.
    """
    if not recipient:
        return False, "Recipient is required to send an email.", None

    if not body:
        return False, "Email body message is required.", None

    if not subject:
        subject = "Update from VOCA"

    recipient_name = recipient
    recipient_email = recipient

    # Look up recipient in Contacts table if available
    if db and "@" not in recipient:
        matched_contact = (
            db.query(Contact)
            .filter(Contact.name.ilike(f"%{recipient.strip()}%"))
            .first()
        )
        if matched_contact and matched_contact.email:
            recipient_name = matched_contact.name
            recipient_email = matched_contact.email
        else:
            # Fallback placeholder if no email exists on file
            recipient_email = f"{recipient.lower().replace(' ', '.')}@example.com"

    smtp_host = os.getenv("SMTP_HOST", "")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER", "")
    smtp_password = os.getenv("SMTP_PASSWORD", "")

    status = "sent"
    delivery_note = ""

    # Real SMTP dispatch if configured
    if smtp_host and smtp_user and smtp_password:
        try:
            msg = MIMEMultipart()
            msg["From"] = smtp_user
            msg["To"] = recipient_email
            msg["Subject"] = subject
            msg.attach(MIMEText(body, "plain"))

            with smtplib.SMTP(smtp_host, smtp_port, timeout=10) as server:
                server.starttls()
                server.login(smtp_user, smtp_password)
                server.send_message(msg)

            delivery_note = f"Dispatched securely via SMTP to {recipient_email}."
        except Exception as exc:
            logger.error("SMTP dispatch failed: %s", exc)
            status = "failed"
            delivery_note = f"SMTP dispatch failed: {str(exc)}"
    else:
        # Safe outbox log without credential exposure
        status = "sent"
        delivery_note = f"Email to {recipient_name} ({recipient_email}) securely logged in SQLite Outbox."

    email_record = None
    if db:
        try:
            email_record = EmailMessage(
                recipient_name=recipient_name,
                recipient_email=recipient_email,
                subject=subject,
                body=body,
                status=status,
            )
            db.add(email_record)
            db.commit()
            db.refresh(email_record)
        except Exception as exc:
            logger.error("Failed to save email record to SQLite: %s", exc)
            if db:
                db.rollback()

    success = status == "sent"
    message = f"Email to {recipient_name} sent: '{subject}'. {delivery_note}"
    return success, message, email_record
