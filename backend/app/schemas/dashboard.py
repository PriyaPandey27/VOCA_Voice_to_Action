"""
Dashboard Pydantic schemas.
"""

from typing import List, Optional

from pydantic import BaseModel

from app.schemas.expense import ExpenseResponse
from app.schemas.task import TaskResponse
from app.schemas.reminder import ReminderResponse


class ExpenseSummary(BaseModel):
    """Summary of expenses for the dashboard."""

    total_today: float = 0.0
    total_this_week: float = 0.0
    total_this_month: float = 0.0
    count_today: int = 0
    count_this_week: int = 0
    count_this_month: int = 0


class TaskSummary(BaseModel):
    """Summary of tasks for the dashboard."""

    total_pending: int = 0
    total_completed: int = 0
    high_priority_pending: int = 0


class ReminderSummary(BaseModel):
    """Summary of reminders for the dashboard."""

    total_active: int = 0
    upcoming_count: int = 0


class RecentActivity(BaseModel):
    """A single recent activity entry."""

    type: str  # "expense", "task", "reminder"
    action: str  # "created", "completed", etc.
    description: str
    timestamp: Optional[str] = None


class DashboardSummary(BaseModel):
    """Full dashboard summary supporting both nested and flat structures."""

    expenses: ExpenseSummary = ExpenseSummary()
    tasks: TaskSummary = TaskSummary()
    reminders: ReminderSummary = ReminderSummary()
    recent_activity: List[RecentActivity] = []

    # Flattened properties matching frontend DashboardSummary
    total_expenses_today: float = 0.0
    total_expenses_week: float = 0.0
    total_expenses_month: float = 0.0
    pending_tasks_count: int = 0
    upcoming_reminders_count: int = 0
    recent_expenses: List[ExpenseResponse] = []
    recent_tasks: List[TaskResponse] = []
    recent_reminders: List[ReminderResponse] = []
