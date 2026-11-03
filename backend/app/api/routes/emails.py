"""
Emails API routes.
"""

from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_db
from app.models.email_message import EmailMessage
from app.schemas.email_message import EmailCreate, EmailResponse
from app.services.email_service import send_or_log_email

router = APIRouter(prefix="/api/emails", tags=["emails"])


@router.get("", response_model=List[EmailResponse])
@router.get("/", response_model=List[EmailResponse])
def get_emails(db: Session = Depends(get_db)):
    """Retrieve all dispatched email records from the Outbox."""
    return db.query(EmailMessage).order_by(EmailMessage.created_at.desc()).all()


@router.post("", response_model=EmailResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=EmailResponse, status_code=status.HTTP_201_CREATED)
def create_email(email_in: EmailCreate, db: Session = Depends(get_db)):
    """Compose and send/log an email."""
    success, msg, record = send_or_log_email(
        recipient=email_in.recipient_email,
        body=email_in.body,
        subject=email_in.subject,
        db=db,
    )
    return record
