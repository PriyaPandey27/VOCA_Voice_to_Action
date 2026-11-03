"""
Expense Service – CRUD operations for expenses.
"""

from datetime import date, timedelta, datetime, timezone
from typing import List, Optional

import pytz
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.expense import Expense
from app.schemas.expense import ExpenseCreate, ExpenseUpdate


def _today_in_tz() -> date:
    """Return today's date in the configured timezone."""
    tz = pytz.timezone(settings.DEFAULT_TIMEZONE)
    return datetime.now(tz).date()


def add_expense(data: ExpenseCreate, db: Session) -> Expense:
    """Create and persist a new expense."""
    expense = Expense(
        amount=data.amount,
        category=data.category,
        description=data.description,
        expense_date=data.expense_date,
        payment_method=data.payment_method,
    )
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return expense


def update_expense(expense_id: int, data: ExpenseUpdate, db: Session) -> Optional[Expense]:
    """Update an existing expense. Returns None if not found."""
    expense = db.query(Expense).filter(Expense.id == expense_id).first()
    if expense is None:
        return None

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(expense, key, value)

    db.commit()
    db.refresh(expense)
    return expense


def delete_expense(expense_id: int, db: Session) -> bool:
    """Delete an expense by id. Returns True if deleted."""
    expense = db.query(Expense).filter(Expense.id == expense_id).first()
    if expense is None:
        return False
    db.delete(expense)
    db.commit()
    return True


def get_expense_by_id(expense_id: int, db: Session) -> Optional[Expense]:
    """Get a single expense by id."""
    return db.query(Expense).filter(Expense.id == expense_id).first()


def get_expenses(
    db: Session,
    category: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    limit: int = 50,
) -> List[Expense]:
    """List expenses with optional filters."""
    query = db.query(Expense)

    if category:
        query = query.filter(Expense.category.ilike(f"%{category}%"))
    if start_date:
        query = query.filter(Expense.expense_date >= start_date)
    if end_date:
        query = query.filter(Expense.expense_date <= end_date)

    return query.order_by(Expense.expense_date.desc()).limit(limit).all()


def get_recent_expenses(db: Session, limit: int = 5) -> List[Expense]:
    """Get the most recent expenses."""
    return (
        db.query(Expense)
        .order_by(Expense.created_at.desc())
        .limit(limit)
        .all()
    )


def get_expense_summary(db: Session, period: str = "month") -> dict:
    """
    Summarise expenses for a time period.

    period: "today", "week", or "month".
    """
    today = _today_in_tz()

    if period == "today":
        start = today
    elif period == "week":
        start = today - timedelta(days=today.weekday())  # Monday
    else:  # month
        start = today.replace(day=1)

    rows = (
        db.query(Expense)
        .filter(Expense.expense_date >= start, Expense.expense_date <= today)
        .all()
    )

    total = sum(e.amount for e in rows)
    by_category: dict[str, float] = {}
    for e in rows:
        cat = e.category or "Uncategorized"
        by_category[cat] = by_category.get(cat, 0) + e.amount

    return {
        "period": period,
        "start_date": start.isoformat(),
        "end_date": today.isoformat(),
        "total": round(total, 2),
        "count": len(rows),
        "by_category": by_category,
    }
