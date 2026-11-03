"""
VOCA API — main FastAPI application entry point.
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.database.connection import engine, Base

# Import models first so they register with Base.metadata
from app.models.expense import Expense  # noqa: F401
from app.models.task import Task  # noqa: F401
from app.models.reminder import Reminder  # noqa: F401
from app.models.command_history import CommandHistory  # noqa: F401
from app.models.conversation_context import ConversationContext  # noqa: F401
from app.models.contact import Contact  # noqa: F401
from app.models.email_message import EmailMessage  # noqa: F401

# Create tables immediately on module load to guarantee persistence and table existence
Base.metadata.create_all(bind=engine)

# Import routers
from app.api.routes.voice import router as voice_router
from app.api.routes.expenses import router as expenses_router
from app.api.routes.tasks import router as tasks_router
from app.api.routes.reminders import router as reminders_router
from app.api.routes.dashboard import router as dashboard_router
from app.api.routes.history import router as history_router
from app.api.routes.analytics import router as analytics_router
from app.api.routes.contacts import router as contacts_router
from app.api.routes.emails import router as emails_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create database tables on startup."""
    logger.info("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    logger.info("VOCA API is ready.")
    yield
    logger.info("VOCA API shutting down.")


app = FastAPI(
    title="VOCA API",
    description="Voice-Operated Command Assistant — Your Voice. Your Actions.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ],
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(voice_router)
app.include_router(expenses_router)
app.include_router(tasks_router)
app.include_router(reminders_router)
app.include_router(dashboard_router)
app.include_router(history_router)
app.include_router(analytics_router)
app.include_router(contacts_router)
app.include_router(emails_router)


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    gemini_status = "configured" if settings.GEMINI_API_KEY else "not configured"
    return {
        "status": "healthy",
        "service": "VOCA API",
        "version": "1.0.0",
        "gemini": gemini_status,
    }
