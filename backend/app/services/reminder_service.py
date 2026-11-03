"""
Reminder Service – CRUD operations for reminders.
"""

from datetime import date, timedelta
from typing import List, Optional

import pytz
from datetime import datetime

from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.reminder import Reminder
from app.schemas.reminder import ReminderCreate, ReminderUpdate


def _today_in_tz() -> date:
    tz = pytz.timezone(settings.DEFAULT_TIMEZONE)
    return datetime.now(tz).date()


def create_reminder(data: ReminderCreate, db: Session) -> Reminder:
    """Create and persist a new reminder."""
    reminder = Reminder(
        title=data.title,
        description=data.description,
        reminder_date=data.reminder_date,
        reminder_time=data.reminder_time,
    )
    db.add(reminder)
    db.commit()
    db.refresh(reminder)
    return reminder


def update_reminder(reminder_id: int, data: ReminderUpdate, db: Session) -> Optional[Reminder]:
    """Update an existing reminder. Returns None if not found."""
    reminder = db.query(Reminder).filter(Reminder.id == reminder_id).first()
    if reminder is None:
        return None

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(reminder, key, value)

    db.commit()
    db.refresh(reminder)
    return reminder


def delete_reminder(reminder_id: int, db: Session) -> bool:
    """Delete a reminder by id."""
    reminder = db.query(Reminder).filter(Reminder.id == reminder_id).first()
    if reminder is None:
        return False
    db.delete(reminder)
    db.commit()
    return True


def get_reminder_by_id(reminder_id: int, db: Session) -> Optional[Reminder]:
    """Get a single reminder by id."""
    return db.query(Reminder).filter(Reminder.id == reminder_id).first()


def get_reminders(
    db: Session,
    status: Optional[str] = None,
    reminder_date: Optional[date] = None,
) -> List[Reminder]:
    """List reminders with optional filters."""
    query = db.query(Reminder)

    if status:
        query = query.filter(Reminder.status == status)
    if reminder_date:
        query = query.filter(Reminder.reminder_date == reminder_date)

    return query.order_by(Reminder.reminder_date.asc()).all()


def get_upcoming_reminders(db: Session, days: int = 7) -> List[Reminder]:
    """Get reminders coming up within the next N days."""
    today = _today_in_tz()
    end = today + timedelta(days=days)
    return (
        db.query(Reminder)
        .filter(
            Reminder.status == "active",
            Reminder.reminder_date >= today,
            Reminder.reminder_date <= end,
        )
        .order_by(Reminder.reminder_date.asc(), Reminder.reminder_time.asc())
        .all()
    )
