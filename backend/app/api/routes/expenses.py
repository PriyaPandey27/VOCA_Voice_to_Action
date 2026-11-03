"""
Expense CRUD routes.
"""

from datetime import date
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.dependencies import get_db
from app.schemas.expense import ExpenseCreate, ExpenseUpdate, ExpenseResponse
from app.services import expense_service

router = APIRouter(prefix="/api/expenses", tags=["expenses"])


@router.get("/summary")
def get_expenses_summary(
    period: str = "month",
    db: Session = Depends(get_db),
):
    """Get expense summary for today, week, or month."""
    return expense_service.get_expense_summary(db, period=period)


@router.get("/", response_model=List[ExpenseResponse])
def list_expenses(
    category: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    """List expenses with optional filters."""
    return expense_service.get_expenses(
        db, category=category, start_date=start_date, end_date=end_date, limit=limit
    )


@router.post("/", response_model=ExpenseResponse, status_code=201)
def create_expense(data: ExpenseCreate, db: Session = Depends(get_db)):
    """Create a new expense."""
    return expense_service.add_expense(data, db)


@router.put("/{expense_id}", response_model=ExpenseResponse)
def update_expense(expense_id: int, data: ExpenseUpdate, db: Session = Depends(get_db)):
    """Update an existing expense."""
    expense = expense_service.update_expense(expense_id, data, db)
    if expense is None:
        raise HTTPException(status_code=404, detail=f"Expense #{expense_id} not found")
    return expense


@router.delete("/{expense_id}", status_code=204)
def delete_expense(expense_id: int, db: Session = Depends(get_db)):
    """Delete an expense."""
    if not expense_service.delete_expense(expense_id, db):
        raise HTTPException(status_code=404, detail=f"Expense #{expense_id} not found")
