"""
Backend integration tests using FastAPI TestClient.
"""

import sys
import os

# Ensure the backend package is importable
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest
from fastapi.testclient import TestClient
from app.main import app as fastapi_app
from app.database.connection import engine, Base

# Ensure tables exist
Base.metadata.create_all(bind=engine)

@pytest.fixture(scope="module")
def client():
    with TestClient(fastapi_app) as c:
        yield c


def test_health(client):
    r = client.get("/health")
    assert r.status_code == 200
    data = r.json()
    assert data["status"] == "healthy"
    assert data["service"] == "VOCA API"


def test_create_expense(client):
    r = client.post("/api/expenses/", json={
        "amount": 250,
        "category": "Lunch",
        "description": "Office lunch",
        "expense_date": "2026-11-03",
        "payment_method": "UPI"
    })
    assert r.status_code == 201
    data = r.json()
    assert data["amount"] == 250
    assert data["category"] == "Lunch"
    assert data["id"] is not None


def test_list_expenses(client):
    r = client.get("/api/expenses/")
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_create_task(client):
    r = client.post("/api/tasks/", json={
        "title": "Complete project",
        "priority": "high",
        "due_date": "2026-11-04",
    })
    assert r.status_code == 201
    data = r.json()
    assert data["title"] == "Complete project"
    assert data["priority"] == "high"
    assert data["status"] == "pending"


def test_complete_task(client):
    r = client.post("/api/tasks/", json={"title": "Test task for completion"})
    task_id = r.json()["id"]

    r2 = client.patch(f"/api/tasks/{task_id}/complete")
    assert r2.status_code == 200
    assert r2.json()["status"] == "completed"


def test_create_reminder(client):
    r = client.post("/api/reminders/", json={
        "title": "Revise Java",
        "reminder_date": "2026-11-04",
        "reminder_time": "19:00:00",
    })
    assert r.status_code == 201
    data = r.json()
    assert data["title"] == "Revise Java"
    assert data["status"] == "active"


def test_dashboard_summary(client):
    r = client.get("/api/dashboard/summary")
    assert r.status_code == 200
    data = r.json()
    assert "expenses" in data
    assert "tasks" in data
    assert "reminders" in data


def test_voice_process_fallback(client):
    """Test voice processing — uses fallback mode when Gemini key is absent."""
    r = client.post("/api/voice/process", json={
        "transcript": "I spent 300 rupees on lunch",
        "session_id": "test_session",
    })
    assert r.status_code == 200
    data = r.json()
    assert data["transcript"] == "I spent 300 rupees on lunch"
    assert "results" in data


def test_command_history(client):
    r = client.get("/api/history/")
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_analytics(client):
    r = client.get("/api/analytics/expenses")
    assert r.status_code == 200
    data = r.json()
    assert "category_breakdown" in data
    assert "daily_expenses" in data


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
