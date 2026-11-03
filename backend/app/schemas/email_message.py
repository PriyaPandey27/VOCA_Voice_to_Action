"""
Email Message Pydantic schemas.
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class EmailCreate(BaseModel):
    recipient_name: Optional[str] = None
    recipient_email: str
    subject: str = "Notification from VOCA"
    body: str


class EmailResponse(BaseModel):
    id: int
    recipient_name: Optional[str] = None
    recipient_email: str
    subject: str
    body: str
    status: str
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
