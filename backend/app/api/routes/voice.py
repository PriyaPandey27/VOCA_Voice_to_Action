"""
Voice/command processing route.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_db
from app.schemas.voice import VoiceCommandRequest, VoiceCommandResponse
from app.services.gemini_service import extract_intents
from app.services.action_dispatcher import dispatch
from app.services.context_service import get_context

router = APIRouter()


async def _process_command(req: VoiceCommandRequest, db: Session) -> VoiceCommandResponse:
    """Shared processing logic for voice and text commands."""
    session_id = req.session_id or "default"

    # Get conversation context for follow-up resolution
    context = get_context(session_id, db)

    # Extract intents via Gemini (or fallback)
    ai_response = await extract_intents(req.transcript, context)

    # If clarification is needed, return without executing
    if ai_response.needs_clarification:
        return VoiceCommandResponse(
            success=True,
            transcript=req.transcript,
            intents=[i.model_dump() for i in ai_response.intents],
            results=[],
            response_text=ai_response.clarification_question or ai_response.response_text,
            spoken_text=ai_response.clarification_question or ai_response.response_text,
        )

    # Dispatch all intents
    results, summary = await dispatch(
        intents=ai_response.intents,
        session_id=session_id,
        db=db,
        transcript=req.transcript,
    )

    # Build spoken text
    spoken_parts = []
    for r in results:
        spoken_parts.append(r.message)
    spoken_text = " ".join(spoken_parts) if spoken_parts else ai_response.response_text

    return VoiceCommandResponse(
        success=any(r.success for r in results) if results else True,
        transcript=req.transcript,
        intents=[i.model_dump() for i in ai_response.intents],
        results=[r.model_dump() for r in results],
        response_text=ai_response.response_text or summary,
        spoken_text=spoken_text,
    )


@router.post("/api/voice/process", response_model=VoiceCommandResponse)
async def process_voice(req: VoiceCommandRequest, db: Session = Depends(get_db)):
    """Process a voice command transcript."""
    return await _process_command(req, db)


@router.post("/api/commands/process", response_model=VoiceCommandResponse)
async def process_command(req: VoiceCommandRequest, db: Session = Depends(get_db)):
    """Process a text command (same logic as voice)."""
    return await _process_command(req, db)
