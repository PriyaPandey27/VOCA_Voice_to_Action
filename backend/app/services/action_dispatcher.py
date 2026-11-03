"""
Action Dispatcher – central execution engine.

Takes a list of parsed ActionIntents and dispatches each to the appropriate
service function, collecting results and updating conversation context.
"""

import json
import logging
from datetime import date, time, datetime, timezone
from typing import List, Tuple, Optional

from sqlalchemy.orm import Session

from app.schemas.voice import ActionIntent
from app.schemas.common import ActionResult
from app.schemas.expense import ExpenseCreate, ExpenseUpdate
from app.schemas.task import TaskCreate, TaskUpdate
from app.schemas.reminder import ReminderCreate, ReminderUpdate
from app.services import expense_service, task_service, reminder_service, context_service, email_service
from app.models.command_history import CommandHistory
from app.models.expense import Expense
from app.models.task import Task
from app.models.reminder import Reminder

logger = logging.getLogger(__name__)

# Simple in-memory dedup: set of (session_id, transcript_hash, timestamp_bucket)
_recent_requests: dict[str, float] = {}
_DEDUP_WINDOW_SECONDS = 2.0


def _dedup_key(session_id: str, transcript: str) -> str:
    return f"{session_id}::{transcript.strip().lower()}"


def _is_duplicate(session_id: str, transcript: str) -> bool:
    key = _dedup_key(session_id, transcript)
    now = datetime.now(timezone.utc).timestamp()
    if key in _recent_requests:
        if now - _recent_requests[key] < _DEDUP_WINDOW_SECONDS:
            return True
    _recent_requests[key] = now
    # Prune old entries periodically
    if len(_recent_requests) > 500:
        cutoff = now - 60
        to_remove = [k for k, v in _recent_requests.items() if v < cutoff]
        for k in to_remove:
            _recent_requests.pop(k, None)
    return False


def _safe_date(value) -> Optional[date]:
    """Convert a string or date to a date object."""
    if value is None:
        return None
    if isinstance(value, date):
        return value
    try:
        return date.fromisoformat(str(value))
    except (ValueError, TypeError):
        return None


def _safe_time(value) -> Optional[time]:
    """Convert a string or time to a time object."""
    if value is None:
        return None
    if isinstance(value, time):
        return value
    try:
        return time.fromisoformat(str(value))
    except (ValueError, TypeError):
        return None


def _resolve_record_id(
    intent: ActionIntent,
    id_param_name: str,
    record_type: str,
    session_id: str,
    db: Session,
) -> Optional[int]:
    """
    Resolve a record ID from intent params or from conversation context
    when the user references a previous record.
    """
    params = intent.params

    # Direct ID provided
    if id_param_name in params and params[id_param_name] is not None:
        try:
            return int(params[id_param_name])
        except (ValueError, TypeError):
            pass

    # Reference to previous record
    if params.get("reference_to_previous", False):
        ctx = context_service.get_context(session_id, db)
        if ctx.get("latest_record_type") == record_type and ctx.get("latest_record_id"):
            return int(ctx["latest_record_id"])

    return None


# ---------------------------------------------------------------------------
# Individual intent handlers
# ---------------------------------------------------------------------------

def _handle_add_expense(params: dict, db: Session) -> ActionResult:
    amount = params.get("amount")
    if amount is None:
        return ActionResult(success=False, action="ADD_EXPENSE", message="Amount is required to add an expense.")

    expense_date = _safe_date(params.get("expense_date")) or date.today()
    data = ExpenseCreate(
        amount=float(amount),
        category=params.get("category", "General"),
        description=params.get("description", ""),
        expense_date=expense_date,
        payment_method=params.get("payment_method"),
    )
    expense = expense_service.add_expense(data, db)
    return ActionResult(
        success=True,
        action="ADD_EXPENSE",
        message=f"Added expense of Rs. {expense.amount} for {expense.category}.",
        data=expense.to_dict(),
    )


def _handle_update_expense(params: dict, expense_id: Optional[int], db: Session) -> ActionResult:
    if expense_id is None:
        all_count = db.query(Expense).count()
        if all_count == 0:
            return ActionResult(success=False, action="UPDATE_EXPENSE", message="You haven't added any expenses yet.")
        desc = params.get("description") or params.get("category")
        if desc:
            matched = db.query(Expense).filter(
                (Expense.description.ilike(f"%{desc}%")) | (Expense.category.ilike(f"%{desc}%"))
            ).order_by(Expense.expense_date.desc()).first()
            if matched:
                expense_id = matched.id
            else:
                return ActionResult(success=False, action="UPDATE_EXPENSE", message=f"I couldn't find a {desc} expense in your records.")
        else:
            return ActionResult(success=False, action="UPDATE_EXPENSE", message="Could not determine which expense to update.")

    update_fields: dict = {}
    if "amount" in params and params["amount"] is not None:
        update_fields["amount"] = float(params["amount"])
    if "category" in params and params["category"] is not None:
        update_fields["category"] = params["category"]
    if "description" in params and params["description"] is not None:
        update_fields["description"] = params["description"]
    if "expense_date" in params:
        d = _safe_date(params["expense_date"])
        if d:
            update_fields["expense_date"] = d
    if "payment_method" in params and params["payment_method"] is not None:
        update_fields["payment_method"] = params["payment_method"]

    if not update_fields:
        return ActionResult(success=False, action="UPDATE_EXPENSE", message="No fields to update.")

    data = ExpenseUpdate(**update_fields)
    expense = expense_service.update_expense(expense_id, data, db)
    if expense is None:
        desc = params.get("description") or params.get("category")
        if desc:
            return ActionResult(success=False, action="UPDATE_EXPENSE", message=f"I couldn't find a {desc} expense in your records.")
        return ActionResult(success=False, action="UPDATE_EXPENSE", message=f"Expense #{expense_id} not found in your records.")
    return ActionResult(
        success=True,
        action="UPDATE_EXPENSE",
        message=f"Updated expense #{expense_id}.",
        data=expense.to_dict(),
    )


def _handle_delete_expense(expense_id: Optional[int], db: Session) -> ActionResult:
    if expense_id is None:
        all_count = db.query(Expense).count()
        if all_count == 0:
            return ActionResult(success=False, action="DELETE_EXPENSE", message="You don't have any expenses to delete.")
        last_exp = db.query(Expense).order_by(Expense.created_at.desc()).first()
        if last_exp:
            expense_id = last_exp.id
        else:
            return ActionResult(success=False, action="DELETE_EXPENSE", message="You don't have any expenses to delete.")
    ok = expense_service.delete_expense(expense_id, db)
    if not ok:
        return ActionResult(success=False, action="DELETE_EXPENSE", message=f"Expense #{expense_id} not found in your records.")
    return ActionResult(success=True, action="DELETE_EXPENSE", message=f"Deleted expense #{expense_id}.")


def _handle_get_recent_expenses(params: dict, db: Session) -> ActionResult:
    limit = int(params.get("limit", 5))
    expenses = expense_service.get_recent_expenses(db, limit=limit)
    if not expenses:
        return ActionResult(
            success=True,
            action="GET_RECENT_EXPENSES",
            message="You haven't added any expenses yet.",
            data={"expenses": []},
        )
    return ActionResult(
        success=True,
        action="GET_RECENT_EXPENSES",
        message=f"Found {len(expenses)} recent expense(s).",
        data={"expenses": [e.to_dict() for e in expenses]},
    )


def _handle_get_expense_summary(params: dict, db: Session) -> ActionResult:
    period = params.get("period", "month")
    summary = expense_service.get_expense_summary(db, period=period)
    if summary['count'] == 0:
        period_text = "this month" if period == "month" else "this week" if period == "week" else "today"
        return ActionResult(
            success=True,
            action="GET_EXPENSE_SUMMARY",
            message=f"You haven't recorded any expenses {period_text}.",
            data=summary,
        )
    return ActionResult(
        success=True,
        action="GET_EXPENSE_SUMMARY",
        message=f"Expense summary for {period}: Rs. {summary['total']} across {summary['count']} transactions.",
        data=summary,
    )


def _handle_create_task(params: dict, db: Session) -> ActionResult:
    title = params.get("title")
    if not title:
        return ActionResult(success=False, action="CREATE_TASK", message="Task title is required.")

    data = TaskCreate(
        title=title,
        description=params.get("description"),
        priority=params.get("priority", "medium"),
        due_date=_safe_date(params.get("due_date")),
    )
    task = task_service.create_task(data, db)
    return ActionResult(
        success=True,
        action="CREATE_TASK",
        message=f"Created task: {task.title}.",
        data=task.to_dict(),
    )


def _handle_update_task(params: dict, task_id: Optional[int], db: Session) -> ActionResult:
    if task_id is None:
        return ActionResult(success=False, action="UPDATE_TASK", message="Could not determine which task to update.")

    update_fields: dict = {}
    for field in ("title", "description", "priority", "status"):
        if field in params and params[field] is not None:
            update_fields[field] = params[field]
    if "due_date" in params:
        d = _safe_date(params["due_date"])
        if d:
            update_fields["due_date"] = d

    if not update_fields:
        return ActionResult(success=False, action="UPDATE_TASK", message="No fields to update.")

    data = TaskUpdate(**update_fields)
    task = task_service.update_task(task_id, data, db)
    if task is None:
        return ActionResult(success=False, action="UPDATE_TASK", message=f"Task #{task_id} not found.")
    return ActionResult(success=True, action="UPDATE_TASK", message=f"Updated task #{task_id}.", data=task.to_dict())


def _handle_complete_task(task_id: Optional[int], db: Session) -> ActionResult:
    if task_id is None:
        return ActionResult(success=False, action="COMPLETE_TASK", message="Could not determine which task to complete.")
    task = task_service.complete_task(task_id, db)
    if task is None:
        return ActionResult(success=False, action="COMPLETE_TASK", message=f"Task #{task_id} not found.")
    return ActionResult(success=True, action="COMPLETE_TASK", message=f"Marked task '{task.title}' as completed.", data=task.to_dict())


def _handle_delete_task(task_id: Optional[int], db: Session) -> ActionResult:
    if task_id is None:
        all_count = db.query(Task).count()
        if all_count == 0:
            return ActionResult(success=False, action="DELETE_TASK", message="You don't have any tasks to delete.")
        last_t = db.query(Task).order_by(Task.created_at.desc()).first()
        if last_t:
            task_id = last_t.id
        else:
            return ActionResult(success=False, action="DELETE_TASK", message="You don't have any tasks to delete.")
    ok = task_service.delete_task(task_id, db)
    if not ok:
        return ActionResult(success=False, action="DELETE_TASK", message=f"Task #{task_id} not found in your records.")
    return ActionResult(success=True, action="DELETE_TASK", message=f"Deleted task #{task_id}.")


def _handle_get_pending_tasks(db: Session) -> ActionResult:
    tasks = task_service.get_pending_tasks(db)
    if not tasks:
        return ActionResult(
            success=True,
            action="GET_PENDING_TASKS",
            message="You haven't created any tasks yet.",
            data={"tasks": []},
        )
    return ActionResult(
        success=True,
        action="GET_PENDING_TASKS",
        message=f"You have {len(tasks)} pending task(s).",
        data={"tasks": [t.to_dict() for t in tasks]},
    )


def _handle_create_reminder(params: dict, db: Session) -> ActionResult:
    title = params.get("title")
    reminder_date = _safe_date(params.get("reminder_date"))
    if not title:
        return ActionResult(success=False, action="CREATE_REMINDER", message="Reminder title is required.")
    if reminder_date is None:
        return ActionResult(success=False, action="CREATE_REMINDER", message="Reminder date is required.")

    data = ReminderCreate(
        title=title,
        description=params.get("description"),
        reminder_date=reminder_date,
        reminder_time=_safe_time(params.get("reminder_time")),
    )
    reminder = reminder_service.create_reminder(data, db)
    return ActionResult(
        success=True,
        action="CREATE_REMINDER",
        message=f"Created reminder: {reminder.title} on {reminder.reminder_date}.",
        data=reminder.to_dict(),
    )


def _handle_update_reminder(params: dict, reminder_id: Optional[int], db: Session) -> ActionResult:
    if reminder_id is None:
        return ActionResult(success=False, action="UPDATE_REMINDER", message="Could not determine which reminder to update.")

    update_fields: dict = {}
    for field in ("title", "description", "status"):
        if field in params and params[field] is not None:
            update_fields[field] = params[field]
    if "reminder_date" in params:
        d = _safe_date(params["reminder_date"])
        if d:
            update_fields["reminder_date"] = d
    if "reminder_time" in params:
        t = _safe_time(params["reminder_time"])
        if t:
            update_fields["reminder_time"] = t

    if not update_fields:
        return ActionResult(success=False, action="UPDATE_REMINDER", message="No fields to update.")

    data = ReminderUpdate(**update_fields)
    reminder = reminder_service.update_reminder(reminder_id, data, db)
    if reminder is None:
        return ActionResult(success=False, action="UPDATE_REMINDER", message=f"Reminder #{reminder_id} not found.")
    return ActionResult(success=True, action="UPDATE_REMINDER", message=f"Updated reminder #{reminder_id}.", data=reminder.to_dict())


def _handle_delete_reminder(reminder_id: Optional[int], db: Session) -> ActionResult:
    if reminder_id is None:
        all_count = db.query(Reminder).count()
        if all_count == 0:
            return ActionResult(success=False, action="DELETE_REMINDER", message="You don't have any reminders to delete.")
        last_r = db.query(Reminder).order_by(Reminder.created_at.desc()).first()
        if last_r:
            reminder_id = last_r.id
        else:
            return ActionResult(success=False, action="DELETE_REMINDER", message="You don't have any reminders to delete.")
    ok = reminder_service.delete_reminder(reminder_id, db)
    if not ok:
        return ActionResult(success=False, action="DELETE_REMINDER", message=f"Reminder #{reminder_id} not found in your records.")
    return ActionResult(success=True, action="DELETE_REMINDER", message=f"Deleted reminder #{reminder_id}.")


def _handle_get_upcoming_reminders(params: dict, db: Session) -> ActionResult:
    days = int(params.get("days", 7))
    reminders = reminder_service.get_upcoming_reminders(db, days=days)
    if not reminders:
        return ActionResult(
            success=True,
            action="GET_UPCOMING_REMINDERS",
            message="You haven't created any reminders yet.",
            data={"reminders": []},
        )
    return ActionResult(
        success=True,
        action="GET_UPCOMING_REMINDERS",
        message=f"You have {len(reminders)} upcoming reminder(s).",
        data={"reminders": [r.to_dict() for r in reminders]},
    )


def _handle_send_email(params: dict, db: Session) -> ActionResult:
    recipient = params.get("recipient") or params.get("recipient_name") or params.get("to") or ""
    body = params.get("body") or params.get("message") or params.get("content") or ""
    subject = params.get("subject") or "Notification from VOCA"

    if not recipient:
        return ActionResult(
            success=False,
            action="SEND_EMAIL",
            message="Please specify the recipient for the email.",
        )

    if not body:
        return ActionResult(
            success=False,
            action="SEND_EMAIL",
            message="Please specify the message content to send.",
        )

    success, msg, record = email_service.send_or_log_email(
        recipient=recipient,
        body=body,
        subject=subject,
        db=db,
    )

    data = record.to_dict() if record else {"recipient": recipient, "subject": subject}
    return ActionResult(success=success, action="SEND_EMAIL", message=msg, data=data)


# ---------------------------------------------------------------------------
# Intent → record type mapping (for context tracking)
# ---------------------------------------------------------------------------

_INTENT_RECORD_MAP = {
    "ADD_EXPENSE": "expense",
    "UPDATE_EXPENSE": "expense",
    "DELETE_EXPENSE": "expense",
    "GET_RECENT_EXPENSES": "expense",
    "GET_EXPENSE_SUMMARY": "expense",
    "CREATE_TASK": "task",
    "UPDATE_TASK": "task",
    "COMPLETE_TASK": "task",
    "DELETE_TASK": "task",
    "GET_PENDING_TASKS": "task",
    "CREATE_REMINDER": "reminder",
    "UPDATE_REMINDER": "reminder",
    "DELETE_REMINDER": "reminder",
    "GET_UPCOMING_REMINDERS": "reminder",
    "SEND_EMAIL": "email",
}


# ---------------------------------------------------------------------------
# Main dispatch function
# ---------------------------------------------------------------------------

async def dispatch(
    intents: List[ActionIntent],
    session_id: str,
    db: Session,
    transcript: str = "",
) -> Tuple[List[ActionResult], str]:
    """
    Execute every intent and return (results, natural_language_summary).

    Handles multi-intent commands, contextual references, and partial failures.
    """
    # Duplicate guard
    if transcript and _is_duplicate(session_id, transcript):
        return (
            [ActionResult(success=False, action="DUPLICATE", message="Duplicate request ignored.")],
            "It looks like this command was just processed.",
        )

    results: List[ActionResult] = []

    for intent in intents:
        try:
            result = _execute_single(intent, session_id, db)
            results.append(result)

            # Update context on success
            if result.success:
                record_type = _INTENT_RECORD_MAP.get(intent.intent, "general")
                record_id = None
                if result.data and "id" in result.data:
                    record_id = result.data["id"]
                context_service.update_context(
                    session_id=session_id,
                    action=intent.intent,
                    record_type=record_type,
                    record_id=record_id,
                    extra_data=result.data,
                    db=db,
                )
        except Exception as exc:
            logger.error("Error executing intent %s: %s", intent.intent, exc)
            results.append(ActionResult(
                success=False,
                action=intent.intent,
                message=f"Failed to execute {intent.intent}: {str(exc)}",
            ))

    # Store in command history
    try:
        history = CommandHistory(
            original_transcript=transcript,
            detected_intents=json.dumps([i.model_dump() for i in intents]),
            execution_results=json.dumps([r.model_dump() for r in results]),
            assistant_response=_build_summary(results),
            status="success" if all(r.success for r in results) else (
                "partial" if any(r.success for r in results) else "failed"
            ),
        )
        db.add(history)
        db.commit()
    except Exception as exc:
        logger.error("Failed to save command history: %s", exc)

    summary = _build_summary(results)
    return results, summary


def _execute_single(intent: ActionIntent, session_id: str, db: Session) -> ActionResult:
    """Route a single intent to its handler."""
    name = intent.intent
    params = intent.params

    # --- Expense ---
    if name == "ADD_EXPENSE":
        return _handle_add_expense(params, db)
    if name == "UPDATE_EXPENSE":
        eid = _resolve_record_id(intent, "expense_id", "expense", session_id, db)
        return _handle_update_expense(params, eid, db)
    if name == "DELETE_EXPENSE":
        eid = _resolve_record_id(intent, "expense_id", "expense", session_id, db)
        return _handle_delete_expense(eid, db)
    if name == "GET_RECENT_EXPENSES":
        return _handle_get_recent_expenses(params, db)
    if name == "GET_EXPENSE_SUMMARY":
        return _handle_get_expense_summary(params, db)

    # --- Task ---
    if name == "CREATE_TASK":
        return _handle_create_task(params, db)
    if name == "UPDATE_TASK":
        tid = _resolve_record_id(intent, "task_id", "task", session_id, db)
        return _handle_update_task(params, tid, db)
    if name == "COMPLETE_TASK":
        tid = _resolve_record_id(intent, "task_id", "task", session_id, db)
        return _handle_complete_task(tid, db)
    if name == "DELETE_TASK":
        tid = _resolve_record_id(intent, "task_id", "task", session_id, db)
        return _handle_delete_task(tid, db)
    if name == "GET_PENDING_TASKS":
        return _handle_get_pending_tasks(db)

    # --- Reminder ---
    if name == "CREATE_REMINDER":
        return _handle_create_reminder(params, db)
    if name == "UPDATE_REMINDER":
        rid = _resolve_record_id(intent, "reminder_id", "reminder", session_id, db)
        return _handle_update_reminder(params, rid, db)
    if name == "DELETE_REMINDER":
        rid = _resolve_record_id(intent, "reminder_id", "reminder", session_id, db)
        return _handle_delete_reminder(rid, db)
    if name == "GET_UPCOMING_REMINDERS":
        return _handle_get_upcoming_reminders(params, db)

    # --- Email ---
    if name == "SEND_EMAIL":
        return _handle_send_email(params, db)

    # --- General / Clarification ---
    if name == "GENERAL_QUERY":
        query = params.get("query", "")
        return ActionResult(success=True, action="GENERAL_QUERY", message=f"You asked: {query}", data={"query": query})

    if name == "CLARIFICATION_REQUIRED":
        missing = params.get("missing_fields", [])
        return ActionResult(
            success=True,
            action="CLARIFICATION_REQUIRED",
            message=f"I need more information: {', '.join(missing)}.",
            data={"missing_fields": missing},
        )

    return ActionResult(success=False, action=name, message=f"Unknown intent: {name}")


def _build_summary(results: List[ActionResult]) -> str:
    """Generate a natural-language summary from action results."""
    if not results:
        return "No actions were performed."

    parts = [r.message for r in results]
    return " ".join(parts)
