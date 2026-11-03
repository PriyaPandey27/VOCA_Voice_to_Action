
import logging
import resend

from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.email_message import EmailMessage

logger = logging.getLogger(__name__)


def send_or_log_email(
    recipient: str,
    body: str,
    subject: str,
    db: Session,
):
    success = False
    message = ""

    try:
        if not settings.RESEND_API_KEY:
            raise ValueError("RESEND_API_KEY is not configured")

        resend.api_key = settings.RESEND_API_KEY

        result = resend.Emails.send({
            "from": settings.EMAIL_FROM,
            "to": [recipient],
            "subject": subject,
            "text": body,
        })

        logger.info("Resend response: %s", result)

        success = True
        message = "Email accepted by Resend"

    except Exception as exc:
        logger.exception("Email sending failed")
        message = str(exc)

    record = EmailMessage(
        recipient_email=recipient,
        subject=subject,
        body=body,
        status="sent" if success else "failed",
    )

    db.add(record)
    db.commit()
    db.refresh(record)

    return success, message, record
