"""
Task CRUD routes.
"""

from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.dependencies import get_db
from app.schemas.task import TaskCreate, TaskUpdate, TaskResponse
from app.services import task_service

router = APIRouter(prefix="/api/tasks", tags=["tasks"])


@router.get("", response_model=List[TaskResponse])
@router.get("/", response_model=List[TaskResponse])
def list_tasks(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """List tasks with optional filters."""
    return task_service.get_tasks(db, status=status, priority=priority)


@router.post("", response_model=TaskResponse, status_code=201)
@router.post("/", response_model=TaskResponse, status_code=201)
def create_task(data: TaskCreate, db: Session = Depends(get_db)):
    """Create a new task."""
    return task_service.create_task(data, db)


@router.put("/{task_id}", response_model=TaskResponse)
def update_task(task_id: int, data: TaskUpdate, db: Session = Depends(get_db)):
    """Update an existing task."""
    task = task_service.update_task(task_id, data, db)
    if task is None:
        raise HTTPException(status_code=404, detail=f"Task #{task_id} not found")
    return task


@router.patch("/{task_id}/complete", response_model=TaskResponse)
def complete_task(task_id: int, db: Session = Depends(get_db)):
    """Mark a task as completed."""
    task = task_service.complete_task(task_id, db)
    if task is None:
        raise HTTPException(status_code=404, detail=f"Task #{task_id} not found")
    return task


@router.delete("/{task_id}", status_code=204)
def delete_task(task_id: int, db: Session = Depends(get_db)):
    """Delete a task."""
    if not task_service.delete_task(task_id, db):
        raise HTTPException(status_code=404, detail=f"Task #{task_id} not found")
