"""
Command History SQLAlchemy model.
"""

from datetime import datetime, timezone

from sqlalchemy import Column, Integer, String, Text, DateTime

from app.database.connection import Base


class CommandHistory(Base):
    __tablename__ = "command_history"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    original_transcript = Column(Text, nullable=True)
    detected_intents = Column(Text, nullable=True)  # JSON string
    execution_results = Column(Text, nullable=True)  # JSON string
    assistant_response = Column(Text, nullable=True)
    status = Column(String(20), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "original_transcript": self.original_transcript,
            "detected_intents": self.detected_intents,
            "execution_results": self.execution_results,
            "assistant_response": self.assistant_response,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
