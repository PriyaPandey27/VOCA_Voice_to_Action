"""
Reminder Pydantic schemas.
"""

from datetime import date, time, datetime
from typing import Optional

from pydantic import BaseModel, Field


class ReminderCreate(BaseModel):
    """Schema for creating a reminder."""

    title: str = Field(..., min_length=1, max_length=200, description="Reminder title")
    description: Optional[str] = Field(None, max_length=500, description="Reminder description")
    reminder_date: date = Field(..., description="Date for the reminder")
    reminder_time: Optional[time] = Field(None, description="Time for the reminder")


class ReminderUpdate(BaseModel):
    """Schema for updating a reminder. All fields optional."""

    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=500)
    reminder_date: Optional[date] = None
    reminder_time: Optional[time] = None
    status: Optional[str] = Field(None, max_length=20)


class ReminderResponse(BaseModel):
    """Schema for reminder response."""

    id: int
    title: str
    description: Optional[str] = None
    reminder_date: date
    reminder_time: Optional[time] = None
    status: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
