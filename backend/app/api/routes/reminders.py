"""
Reminder CRUD routes.
"""

from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.dependencies import get_db
from app.schemas.reminder import ReminderCreate, ReminderUpdate, ReminderResponse
from app.services import reminder_service

router = APIRouter(prefix="/api/reminders", tags=["reminders"])


@router.get("", response_model=List[ReminderResponse])
@router.get("/", response_model=List[ReminderResponse])
def list_reminders(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """List reminders with optional filters."""
    return reminder_service.get_reminders(db, status=status)


@router.post("", response_model=ReminderResponse, status_code=201)
@router.post("/", response_model=ReminderResponse, status_code=201)
def create_reminder(data: ReminderCreate, db: Session = Depends(get_db)):
    """Create a new reminder."""
    return reminder_service.create_reminder(data, db)


@router.put("/{reminder_id}", response_model=ReminderResponse)
def update_reminder(reminder_id: int, data: ReminderUpdate, db: Session = Depends(get_db)):
    """Update an existing reminder."""
    reminder = reminder_service.update_reminder(reminder_id, data, db)
    if reminder is None:
        raise HTTPException(status_code=404, detail=f"Reminder #{reminder_id} not found")
    return reminder


@router.delete("/{reminder_id}", status_code=204)
def delete_reminder(reminder_id: int, db: Session = Depends(get_db)):
    """Delete a reminder."""
    if not reminder_service.delete_reminder(reminder_id, db):
        raise HTTPException(status_code=404, detail=f"Reminder #{reminder_id} not found")
