"""
Task Service – CRUD operations for tasks.
"""

from typing import List, Optional

from sqlalchemy.orm import Session

from app.models.task import Task
from app.schemas.task import TaskCreate, TaskUpdate


def create_task(data: TaskCreate, db: Session) -> Task:
    """Create and persist a new task."""
    task = Task(
        title=data.title,
        description=data.description,
        priority=data.priority,
        due_date=data.due_date,
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


def update_task(task_id: int, data: TaskUpdate, db: Session) -> Optional[Task]:
    """Update an existing task. Returns None if not found."""
    task = db.query(Task).filter(Task.id == task_id).first()
    if task is None:
        return None

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(task, key, value)

    db.commit()
    db.refresh(task)
    return task


def complete_task(task_id: int, db: Session) -> Optional[Task]:
    """Mark a task as completed."""
    task = db.query(Task).filter(Task.id == task_id).first()
    if task is None:
        return None
    task.status = "completed"
    db.commit()
    db.refresh(task)
    return task


def delete_task(task_id: int, db: Session) -> bool:
    """Delete a task by id."""
    task = db.query(Task).filter(Task.id == task_id).first()
    if task is None:
        return False
    db.delete(task)
    db.commit()
    return True


def get_task_by_id(task_id: int, db: Session) -> Optional[Task]:
    """Get a single task by id."""
    return db.query(Task).filter(Task.id == task_id).first()


def get_tasks(
    db: Session,
    status: Optional[str] = None,
    priority: Optional[str] = None,
) -> List[Task]:
    """List tasks with optional filters."""
    query = db.query(Task)

    if status:
        query = query.filter(Task.status == status)
    if priority:
        query = query.filter(Task.priority == priority)

    return query.order_by(Task.created_at.desc()).all()


def get_pending_tasks(db: Session) -> List[Task]:
    """Get all pending tasks ordered by priority then due date."""
    priority_order = {"high": 0, "medium": 1, "low": 2}
    tasks = db.query(Task).filter(Task.status == "pending").all()
    tasks.sort(key=lambda t: (priority_order.get(t.priority, 1), t.due_date or "9999-12-31"))
    return tasks
