"""
Reminder SQLAlchemy model.
"""

from datetime import datetime, timezone

from sqlalchemy import Column, Integer, String, Date, Time, DateTime

from app.database.connection import Base


class Reminder(Base):
    __tablename__ = "reminders"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(String(500), nullable=True)
    reminder_date = Column(Date, nullable=False)
    reminder_time = Column(Time, nullable=True)
    status = Column(String(20), nullable=False, default="active")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "reminder_date": self.reminder_date.isoformat() if self.reminder_date else None,
            "reminder_time": self.reminder_time.isoformat() if self.reminder_time else None,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
