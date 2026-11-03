"""
Command history route.
"""

from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_db
from app.models.command_history import CommandHistory

router = APIRouter(prefix="/api/history", tags=["history"])


@router.get("/")
def get_history(limit: int = 50, db: Session = Depends(get_db)):
    """Return command history ordered by most recent."""
    entries = (
        db.query(CommandHistory)
        .order_by(CommandHistory.created_at.desc())
        .limit(limit)
        .all()
    )
    return [e.to_dict() for e in entries]
