"""
Context Service – manages conversation context for follow-up command resolution.
"""

import json
from typing import Optional

from sqlalchemy.orm import Session

from app.models.conversation_context import ConversationContext


def get_context(session_id: str, db: Session) -> dict:
    """
    Retrieve the current conversation context for a session.

    Returns a dict with latest_successful_action, latest_record_type,
    latest_record_id, and any extra context_data.
    """
    ctx = (
        db.query(ConversationContext)
        .filter(ConversationContext.session_id == session_id)
        .order_by(ConversationContext.updated_at.desc())
        .first()
    )
    if ctx is None:
        return {
            "latest_successful_action": None,
            "latest_record_type": None,
            "latest_record_id": None,
            "context_data": {},
        }

    extra = {}
    if ctx.context_data:
        try:
            extra = json.loads(ctx.context_data)
        except (json.JSONDecodeError, TypeError):
            extra = {}

    return {
        "latest_successful_action": ctx.latest_successful_action,
        "latest_record_type": ctx.latest_record_type,
        "latest_record_id": ctx.latest_record_id,
        "context_data": extra,
    }


def update_context(
    session_id: str,
    action: str,
    record_type: str,
    record_id: Optional[int],
    extra_data: Optional[dict],
    db: Session,
) -> None:
    """
    Upsert the conversation context for a session after a successful action.
    """
    ctx = (
        db.query(ConversationContext)
        .filter(ConversationContext.session_id == session_id)
        .first()
    )

    data_str = json.dumps(extra_data) if extra_data else None

    if ctx is None:
        ctx = ConversationContext(
            session_id=session_id,
            latest_successful_action=action,
            latest_record_type=record_type,
            latest_record_id=record_id,
            context_data=data_str,
        )
        db.add(ctx)
    else:
        ctx.latest_successful_action = action
        ctx.latest_record_type = record_type
        ctx.latest_record_id = record_id
        ctx.context_data = data_str

    db.commit()
