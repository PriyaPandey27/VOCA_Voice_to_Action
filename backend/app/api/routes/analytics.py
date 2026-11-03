"""
Expense analytics route.
"""

from datetime import timedelta, datetime

import pytz
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.dependencies import get_db
from app.models.expense import Expense

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.get("/expenses")
def get_expense_analytics(db: Session = Depends(get_db)):
    """Return category breakdown and daily expense data for charts."""
    tz = pytz.timezone(settings.DEFAULT_TIMEZONE)
    today = datetime.now(tz).date()
    month_start = today.replace(day=1)

    expenses = (
        db.query(Expense)
        .filter(Expense.expense_date >= month_start)
        .all()
    )

    # Category breakdown
    category_totals: dict[str, dict] = {}
    for e in expenses:
        cat = e.category or "Uncategorized"
        if cat not in category_totals:
            category_totals[cat] = {"total": 0.0, "count": 0}
        category_totals[cat]["total"] += e.amount
        category_totals[cat]["count"] += 1

    category_breakdown = [
        {"category": cat, "total": round(data["total"], 2), "count": data["count"]}
        for cat, data in sorted(category_totals.items(), key=lambda x: x[1]["total"], reverse=True)
    ]

    # Daily expenses for the last 14 days
    daily_map: dict[str, float] = {}
    for i in range(14):
        d = today - timedelta(days=13 - i)
        daily_map[d.isoformat()] = 0.0

    for e in expenses:
        key = e.expense_date.isoformat() if e.expense_date else None
        if key and key in daily_map:
            daily_map[key] += e.amount

    daily_expenses = [
        {"date": d, "total": round(t, 2)}
        for d, t in daily_map.items()
    ]

    return {
        "category_breakdown": category_breakdown,
        "daily_expenses": daily_expenses,
    }
