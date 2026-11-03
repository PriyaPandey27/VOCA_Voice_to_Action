"""
Dashboard summary route.
"""

from datetime import timedelta, datetime

import pytz
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.config import settings
from app.core.dependencies import get_db
from app.models.expense import Expense
from app.models.task import Task
from app.models.reminder import Reminder
from app.schemas.dashboard import (
    DashboardSummary,
    ExpenseSummary,
    TaskSummary,
    ReminderSummary,
    RecentActivity,
)

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/summary", response_model=DashboardSummary)
def get_dashboard_summary(db: Session = Depends(get_db)):
    """Return aggregated dashboard data from real database records."""
    tz = pytz.timezone(settings.DEFAULT_TIMEZONE)
    today = datetime.now(tz).date()
    week_start = today - timedelta(days=today.weekday())
    month_start = today.replace(day=1)

    # Expense summary
    all_expenses = db.query(Expense).all()
    today_total = sum(e.amount for e in all_expenses if e.expense_date == today)
    week_total = sum(e.amount for e in all_expenses if e.expense_date and e.expense_date >= week_start)
    month_total = sum(e.amount for e in all_expenses if e.expense_date and e.expense_date >= month_start)
    today_count = sum(1 for e in all_expenses if e.expense_date == today)
    week_count = sum(1 for e in all_expenses if e.expense_date and e.expense_date >= week_start)
    month_count = sum(1 for e in all_expenses if e.expense_date and e.expense_date >= month_start)

    # Task summary
    pending_tasks = db.query(Task).filter(Task.status == "pending").count()
    completed_tasks = db.query(Task).filter(Task.status == "completed").count()
    high_priority = db.query(Task).filter(Task.status == "pending", Task.priority == "high").count()

    # Reminder summary
    active_reminders = db.query(Reminder).filter(Reminder.status == "active").count()
    upcoming = db.query(Reminder).filter(
        Reminder.status == "active",
        Reminder.reminder_date >= today,
        Reminder.reminder_date <= today + timedelta(days=7),
    ).count()

    # Recent activity
    recent_activity = []
    recent_expenses = db.query(Expense).order_by(Expense.created_at.desc()).limit(3).all()
    for e in recent_expenses:
        recent_activity.append(RecentActivity(
            type="expense",
            action="created",
            description=f"Rs. {e.amount} on {e.category or 'General'}",
            timestamp=e.created_at.isoformat() if e.created_at else None,
        ))
    recent_tasks = db.query(Task).order_by(Task.created_at.desc()).limit(3).all()
    for t in recent_tasks:
        recent_activity.append(RecentActivity(
            type="task",
            action="created" if t.status == "pending" else "completed",
            description=t.title,
            timestamp=t.created_at.isoformat() if t.created_at else None,
        ))
    recent_reminders_list = db.query(Reminder).order_by(Reminder.created_at.desc()).limit(3).all()
    for r in recent_reminders_list:
        recent_activity.append(RecentActivity(
            type="reminder",
            action="created",
            description=f"{r.title} on {r.reminder_date}",
            timestamp=r.created_at.isoformat() if r.created_at else None,
        ))

    # Sort recent activity by timestamp
    recent_activity.sort(key=lambda a: a.timestamp or "", reverse=True)

    return DashboardSummary(
        expenses=ExpenseSummary(
            total_today=round(today_total, 2),
            total_this_week=round(week_total, 2),
            total_this_month=round(month_total, 2),
            count_today=today_count,
            count_this_week=week_count,
            count_this_month=month_count,
        ),
        tasks=TaskSummary(
            total_pending=pending_tasks,
            total_completed=completed_tasks,
            high_priority_pending=high_priority,
        ),
        reminders=ReminderSummary(
            total_active=active_reminders,
            upcoming_count=upcoming,
        ),
        recent_activity=recent_activity[:8],
        total_expenses_today=round(today_total, 2),
        total_expenses_week=round(week_total, 2),
        total_expenses_month=round(month_total, 2),
        pending_tasks_count=pending_tasks,
        upcoming_reminders_count=upcoming,
        recent_expenses=recent_expenses[:5],
        recent_tasks=recent_tasks[:5],
        recent_reminders=recent_reminders_list[:5],
    )
