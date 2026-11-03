"""
Voice command Pydantic schemas.
"""

from typing import List, Optional

from pydantic import BaseModel, Field


class VoiceCommandRequest(BaseModel):
    """Incoming voice command request."""

    transcript: str = Field(..., min_length=1, description="Voice transcript text")
    session_id: Optional[str] = Field("default", description="Session ID for context tracking")


class ActionIntent(BaseModel):
    """A single parsed intent from the AI."""

    intent: str = Field(..., description="Intent identifier e.g. ADD_EXPENSE")
    module: str = Field(..., description="Module: expense, task, reminder, or general")
    params: dict = Field(default_factory=dict, description="Extracted parameters")
    confidence: float = Field(0.0, ge=0.0, le=1.0, description="Confidence score")


class AIResponse(BaseModel):
    """Structured response from the AI service."""

    intents: List[ActionIntent] = Field(default_factory=list)
    response_text: str = ""
    needs_clarification: bool = False
    clarification_question: Optional[str] = None


class VoiceCommandResponse(BaseModel):
    """Response sent back to the client after processing a voice command."""

    success: bool
    transcript: str
    intents: List[dict] = Field(default_factory=list)
    results: List[dict] = Field(default_factory=list)
    response_text: str = ""
    spoken_text: str = ""
