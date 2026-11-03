"""
Common Pydantic schemas shared across modules.
"""

from typing import Optional

from pydantic import BaseModel


class ActionResult(BaseModel):
    """Result of a single dispatched action."""

    success: bool
    action: str
    message: str
    data: Optional[dict] = None
