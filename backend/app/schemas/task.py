"""
Task Pydantic schemas.
"""

from datetime import date, datetime
from typing import Optional, Literal

from pydantic import BaseModel, Field


class TaskCreate(BaseModel):
    """Schema for creating a task."""

    title: str = Field(..., min_length=1, max_length=200, description="Task title")
    description: Optional[str] = Field(None, max_length=500, description="Task description")
    priority: Literal["low", "medium", "high"] = Field("medium", description="Task priority")
    due_date: Optional[date] = Field(None, description="Task due date")


class TaskUpdate(BaseModel):
    """Schema for updating a task. All fields optional."""

    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=500)
    priority: Optional[Literal["low", "medium", "high"]] = None
    due_date: Optional[date] = None
    status: Optional[Literal["pending", "completed"]] = None


class TaskResponse(BaseModel):
    """Schema for task response."""

    id: int
    title: str
    description: Optional[str] = None
    priority: str
    due_date: Optional[date] = None
    status: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
