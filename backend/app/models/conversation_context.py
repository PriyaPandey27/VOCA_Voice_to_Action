"""
Conversation Context SQLAlchemy model.
"""

from datetime import datetime, timezone

from sqlalchemy import Column, Integer, String, Text, DateTime

from app.database.connection import Base


class ConversationContext(Base):
    __tablename__ = "conversation_context"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    session_id = Column(String(100), nullable=False, index=True)
    latest_successful_action = Column(String(50), nullable=True)
    latest_record_type = Column(String(50), nullable=True)
    latest_record_id = Column(Integer, nullable=True)
    context_data = Column(Text, nullable=True)  # JSON string
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "session_id": self.session_id,
            "latest_successful_action": self.latest_successful_action,
            "latest_record_type": self.latest_record_type,
            "latest_record_id": self.latest_record_id,
            "context_data": self.context_data,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
