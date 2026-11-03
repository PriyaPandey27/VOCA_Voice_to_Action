"""
Expense SQLAlchemy model.
"""

from datetime import datetime, timezone

from sqlalchemy import Column, Integer, Float, String, Date, DateTime

from app.database.connection import Base


class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    amount = Column(Float, nullable=False)
    category = Column(String(100), nullable=True)
    description = Column(String(500), nullable=True)
    expense_date = Column(Date, nullable=False)
    payment_method = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "amount": self.amount,
            "category": self.category,
            "description": self.description,
            "expense_date": self.expense_date.isoformat() if self.expense_date else None,
            "payment_method": self.payment_method,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
