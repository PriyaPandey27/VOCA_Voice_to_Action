"""
Email Message SQLAlchemy model.
"""

from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime

from app.database.connection import Base


class EmailMessage(Base):
    __tablename__ = "email_messages"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    recipient_name = Column(String(100), nullable=True)
    recipient_email = Column(String(200), nullable=False)
    subject = Column(String(250), nullable=False, default="Notification from VOCA")
    body = Column(Text, nullable=False)
    status = Column(String(50), nullable=False, default="sent")  # 'sent', 'queued', 'failed'
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "recipient_name": self.recipient_name,
            "recipient_email": self.recipient_email,
            "subject": self.subject,
            "body": self.body,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
