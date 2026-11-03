"""
Expense Pydantic schemas.
"""

from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, Field


class ExpenseCreate(BaseModel):
    """Schema for creating an expense."""

    amount: float = Field(..., gt=0, description="Expense amount, must be greater than 0")
    category: str = Field(..., min_length=1, max_length=100, description="Expense category")
    description: str = Field("", max_length=500, description="Expense description")
    expense_date: date = Field(..., description="Date of the expense")
    payment_method: Optional[str] = Field(None, max_length=50, description="Payment method")


class ExpenseUpdate(BaseModel):
    """Schema for updating an expense. All fields optional."""

    amount: Optional[float] = Field(None, gt=0)
    category: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    expense_date: Optional[date] = None
    payment_method: Optional[str] = Field(None, max_length=50)


class ExpenseResponse(BaseModel):
    """Schema for expense response."""

    id: int
    amount: float
    category: Optional[str] = None
    description: Optional[str] = None
    expense_date: date
    payment_method: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
