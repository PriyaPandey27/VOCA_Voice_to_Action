"""
Gemini AI Service – intent extraction from voice transcripts.

Integrates with the Google Gemini generative AI SDK.  When the API key is
missing or a call fails the service falls back to keyword-based extraction.
"""

import asyncio
import json
import re
import logging
from datetime import datetime
from typing import Optional

import pytz

from app.core.config import settings
from app.schemas.voice import AIResponse, ActionIntent

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Gemini SDK initialisation (lazy)
# ---------------------------------------------------------------------------
_model = None
_client = None
_gemini_disabled = False


def _get_model():
    global _client, _gemini_disabled

    if _gemini_disabled:
        return None

    if _client is not None:
        return _client

    if not settings.GEMINI_API_KEY:
        return None

    # Check for invalid key prefixes that cause SDK retry hangs
    if settings.GEMINI_API_KEY.startswith("AQ."):
        logger.warning("GEMINI_API_KEY appears invalid. Using instant high-speed fallback.")
        _gemini_disabled = True
        return None

    try:
        from google import genai

        _client = genai.Client(
            api_key=settings.GEMINI_API_KEY
        )
        return _client

    except Exception as exc:
        logger.error("Gemini initialization failed: %s", exc)
        _gemini_disabled = True
        return None

# ---------------------------------------------------------------------------
# System prompt builder
# ---------------------------------------------------------------------------

def _build_system_prompt(context: dict) -> str:
    """Build the system prompt that instructs Gemini how to parse commands."""
    tz = pytz.timezone(settings.DEFAULT_TIMEZONE)
    now = datetime.now(tz)
    now_str = now.strftime("%Y-%m-%d %H:%M:%S %Z")
    today_str = now.strftime("%Y-%m-%d")

    context_block = ""
    if context and any(context.get(k) for k in ("latest_successful_action", "latest_record_type", "latest_record_id")):
        context_block = f"""
## Current Conversation Context
- Last successful action: {context.get('latest_successful_action', 'None')}
- Last record type: {context.get('latest_record_type', 'None')}
- Last record ID: {context.get('latest_record_id', 'None')}
- Extra context data: {json.dumps(context.get('context_data', {}))}

Use this context to resolve follow-up references such as "it", "that", "the last one", "change that", "delete it", "update that expense", etc.
If the user says "change the amount to 500" without specifying which record, use the latest record from context.
"""

    return f"""You are VOCA, a Voice-Operated Command Assistant that helps users manage expenses, tasks, and reminders through natural language.

## Current Date & Time
{now_str}
Today's date: {today_str}

{context_block}

## Supported Intents

### Expense Module
- ADD_EXPENSE: Add a new expense. Params: amount (float, required), category (string), description (string), expense_date (YYYY-MM-DD, defaults to today), payment_method (string)
- UPDATE_EXPENSE: Update an existing expense. Params: expense_id (int), amount (float), category (string), description (string), expense_date (YYYY-MM-DD), payment_method (string), reference_to_previous (bool – true if user refers to "it"/"that"/"last one")
- DELETE_EXPENSE: Delete an expense. Params: expense_id (int), reference_to_previous (bool)
- GET_RECENT_EXPENSES: Fetch recent expenses. Params: limit (int, default 5)
- GET_EXPENSE_SUMMARY: Get expense summary. Params: period ("today"|"week"|"month")

### Task Module
- CREATE_TASK: Create a new task. Params: title (string, required), description (string), priority ("low"|"medium"|"high"), due_date (YYYY-MM-DD)
- UPDATE_TASK: Update a task. Params: task_id (int), title, description, priority, due_date, reference_to_previous (bool)
- COMPLETE_TASK: Mark task as done. Params: task_id (int), reference_to_previous (bool)
- DELETE_TASK: Delete a task. Params: task_id (int), reference_to_previous (bool)
- GET_PENDING_TASKS: List pending tasks. Params: none

### Reminder Module
- CREATE_REMINDER: Create a reminder. Params: title (string, required), description (string), reminder_date (YYYY-MM-DD, required), reminder_time (HH:MM:SS)
- UPDATE_REMINDER: Update a reminder. Params: reminder_id (int), title, description, reminder_date, reminder_time, reference_to_previous (bool)
- DELETE_REMINDER: Delete a reminder. Params: reminder_id (int), reference_to_previous (bool)
- GET_UPCOMING_REMINDERS: List upcoming reminders. Params: days (int, default 7)

### Email Module
- SEND_EMAIL: Send or draft an email. Params: recipient (string, name or email address, required), body (string, message body text, required), subject (string, optional)

### General
- GENERAL_QUERY: For general questions, greetings, or help requests. Params: query (string)
- CLARIFICATION_REQUIRED: When required information is missing. Params: missing_fields (list of strings)

## Rules
1. Extract ALL intents from the user's message. A single message can contain multiple intents (e.g., "Add an expense of 500 for lunch and create a task to buy groceries").
2. Always output valid JSON matching the schema below. No extra text before or after the JSON.
3. NEVER invent missing amounts or dates. If the user says "add an expense for lunch" without an amount, use CLARIFICATION_REQUIRED.
4. For relative dates: "today" → {today_str}, "tomorrow" → compute from today, "next Monday" → compute, etc.
5. Resolve "it", "that", "the last one", "change that" using the conversation context above.
6. Confidence should reflect how certain you are (0.0 – 1.0).
7. response_text is a friendly natural-language summary of what you understood.

## Output JSON Schema
{{
  "intents": [
    {{
      "intent": "INTENT_NAME",
      "module": "expense|task|reminder|general",
      "params": {{ ... }},
      "confidence": 0.95
    }}
  ],
  "response_text": "Friendly summary",
  "needs_clarification": false,
  "clarification_question": null
}}

Respond ONLY with the JSON object. Do not wrap it in markdown code fences.
"""


# ---------------------------------------------------------------------------
# Primary extraction via Gemini
# ---------------------------------------------------------------------------

def _parse_json_from_response(text: str) -> dict:
    """Parse JSON from Gemini's response, handling markdown code blocks."""
    text = text.strip()

    # Strip markdown code fences if present
    if text.startswith("```"):
        # Remove opening fence (```json or ```)
        first_newline = text.index("\n") if "\n" in text else len(text)
        text = text[first_newline + 1:]
        # Remove closing fence
        if text.rstrip().endswith("```"):
            text = text.rstrip()[:-3].rstrip()

    return json.loads(text)


async def extract_intents(transcript: str, context: dict) -> AIResponse:
    """
    Use Gemini to extract structured intents from a voice transcript.

    Falls back to keyword matching if the API key is missing or the call fails/times out.
    """
    global _gemini_disabled

    model = _get_model()
    if model is None or _gemini_disabled:
        return extract_intents_fallback(transcript)

    system_prompt = _build_system_prompt(context)
    user_message = f"User command: {transcript}"

    def _call_gemini():
        return model.models.generate_content(
            model="gemini-2.0-flash",
            contents=system_prompt + "\n\n" + user_message,
            config={
                "temperature": 0.1,
                "max_output_tokens": 2048,
            },
        )

    try:
        # Enforce strict 1.5s timeout to guarantee instant execution
        response = await asyncio.wait_for(asyncio.to_thread(_call_gemini), timeout=1.5)
        raw = response.text
        parsed = _parse_json_from_response(raw)

        intents = [
            ActionIntent(
                intent=i.get("intent", "GENERAL_QUERY"),
                module=i.get("module", "general"),
                params=i.get("params", {}),
                confidence=float(i.get("confidence", 0.5)),
            )
            for i in parsed.get("intents", [])
        ]

        return AIResponse(
            intents=intents,
            response_text=parsed.get("response_text", ""),
            needs_clarification=parsed.get("needs_clarification", False),
            clarification_question=parsed.get("clarification_question"),
        )

    except Exception as exc:
        logger.warning("Gemini call timed out or failed (%s) — falling back instantly to local parser", exc)
        _gemini_disabled = True
        return extract_intents_fallback(transcript)


# ---------------------------------------------------------------------------
# Fallback keyword-based extraction
# ---------------------------------------------------------------------------

def _extract_single_fallback_intent(text: str, original_clause: str) -> Optional[ActionIntent]:
    """Extract intent for a single clause."""
    tz = pytz.timezone(settings.DEFAULT_TIMEZONE)
    today = datetime.now(tz).date()
    today_str = today.strftime("%Y-%m-%d")

    amount_match = re.search(r"(?:rs\.?|\u20b9|inr|rupees)?\s*(\d+(?:\.\d+)?)", text)
    extracted_amount = float(amount_match.group(1)) if amount_match else None

    # --- DELETE / REMOVE ---
    if re.search(r"\b(delete|remove)\b", text):
        if re.search(r"\bexpense", text):
            id_match = re.search(r"(?:#|id\s*)?(\d+)", text)
            params: dict = {"expense_id": int(id_match.group(1))} if id_match else {"reference_to_previous": True}
            return ActionIntent(intent="DELETE_EXPENSE", module="expense", params=params, confidence=0.7)
        elif re.search(r"\btask", text):
            id_match = re.search(r"(?:#|id\s*)?(\d+)", text)
            params = {"task_id": int(id_match.group(1))} if id_match else {"reference_to_previous": True}
            return ActionIntent(intent="DELETE_TASK", module="task", params=params, confidence=0.7)
        elif re.search(r"\breminder", text):
            id_match = re.search(r"(?:#|id\s*)?(\d+)", text)
            params = {"reminder_id": int(id_match.group(1))} if id_match else {"reference_to_previous": True}
            return ActionIntent(intent="DELETE_REMINDER", module="reminder", params=params, confidence=0.7)

    # --- CREATE TASK (Check before COMPLETE_TASK to avoid matching "create a task to complete project") ---
    if re.search(r"\b(create|add|new|set)\s+(?:a\s+)?(?:task|todo)\b", text) or (
        re.search(r"\b(task|todo)\b", text) and not re.search(r"\b(mark|completed|done|finished)\b", text)
    ):
        title_match = re.search(r"(?:task|todo|assignment)\s+(?:to\s+)?(.+)", text)
        title = title_match.group(1).strip() if title_match else original_clause
        params = {"title": title}
        if "high" in text:
            params["priority"] = "high"
        elif "low" in text:
            params["priority"] = "low"
        if "today" in text:
            params["due_date"] = today_str
        elif "tomorrow" in text:
            from datetime import timedelta
            params["due_date"] = (today + timedelta(days=1)).isoformat()
        return ActionIntent(intent="CREATE_TASK", module="task", params=params, confidence=0.7)

    # --- COMPLETE / DONE / FINISH TASK ---
    if re.search(r"\b(mark.*as\s+completed|mark.*as\s+done|complete\s+task|finish\s+task)\b", text) or re.search(r"\b(completed|done|finished)\b", text):
        id_match = re.search(r"(?:#|id\s*)?(\d+)", text)
        params = {"task_id": int(id_match.group(1))} if id_match else {"reference_to_previous": True}
        return ActionIntent(intent="COMPLETE_TASK", module="task", params=params, confidence=0.7)

    # --- CREATE REMINDER ---
    if re.search(r"\b(remind|reminder)\b", text) and not re.search(r"\b(show|list|get|view|what)\b", text):
        title_match = re.search(r"(?:remind\s+(?:me\s+)?(?:to\s+)?|reminder\s+(?:for\s+)?)(.+)", text)
        title = title_match.group(1).strip() if title_match else original_clause
        params = {"title": title, "reminder_date": today_str, "reminder_time": "19:00:00"}
        if "tomorrow" in text:
            from datetime import timedelta
            params["reminder_date"] = (today + timedelta(days=1)).isoformat()
        time_match = re.search(r"(\d{1,2})(?::(\d{2}))?\s*(am|pm)", text, re.I)
        if time_match:
            hr = int(time_match.group(1))
            mn = int(time_match.group(2) or 0)
            ampm = time_match.group(3).lower()
            if ampm == "pm" and hr < 12:
                hr += 12
            elif ampm == "am" and hr == 12:
                hr = 0
            params["reminder_time"] = f"{hr:02d}:{mn:02d}:00"
        return ActionIntent(intent="CREATE_REMINDER", module="reminder", params=params, confidence=0.7)

    # --- SHOW / LIST / GET QUERIES ---
    if re.search(r"\b(show|list|get|view|what|how much)\b", text):
        if re.search(r"\b(expense|spent|spend|spending|cost|money)\b", text):
            if re.search(r"\b(summary|total|how much)\b", text):
                period = "month"
                if "today" in text:
                    period = "today"
                elif "week" in text:
                    period = "week"
                return ActionIntent(intent="GET_EXPENSE_SUMMARY", module="expense", params={"period": period}, confidence=0.7)
            return ActionIntent(intent="GET_RECENT_EXPENSES", module="expense", params={"limit": 5}, confidence=0.7)
        elif re.search(r"\btask", text):
            return ActionIntent(intent="GET_PENDING_TASKS", module="task", params={}, confidence=0.7)
        elif re.search(r"\breminder", text):
            return ActionIntent(intent="GET_UPCOMING_REMINDERS", module="reminder", params={"days": 7}, confidence=0.7)

    # --- SEND / DRAFT EMAIL ---
    if re.search(r"\b(send\s+email|email\s+to|send\s+an\s+email|draft\s+email|mail\s+to)\b", text):
        email_match = re.search(r"(?:send\s+(?:an\s+)?email\s+to|email\s+to|mail\s+to)\s+([a-zA-Z0-9_\-\.]+@?[a-zA-Z0-9_\-\.\s]*?)(?:\s+(?:about|regarding|saying|that|with\s+message|:)\s+(.+))?$", text)
        recipient = "recipient"
        body = original_clause
        subject = "Notification from VOCA"
        if email_match:
            recipient = email_match.group(1).strip()
            if email_match.group(2):
                body = email_match.group(2).strip()
        return ActionIntent(
            intent="SEND_EMAIL",
            module="email",
            params={"recipient": recipient, "body": body, "subject": subject},
            confidence=0.8,
        )

    # --- ADD EXPENSE ---
    if re.search(r"\b(spent|expense|cost|paid|bought)\b", text) or (extracted_amount is not None and re.search(r"\b(rupees|rs|inr|for|on)\b", text)):
        params = {"expense_date": today_str}
        if extracted_amount is not None:
            params["amount"] = extracted_amount

        categories = ["food", "lunch", "dinner", "breakfast", "groceries", "transport",
                      "taxi", "uber", "coffee", "shopping", "bills", "rent", "fuel",
                      "petrol", "snacks", "movie", "entertainment", "health", "medicine"]
        for cat in categories:
            if cat in text:
                params["category"] = cat.capitalize()
                params["description"] = cat.capitalize()
                break
        if "category" not in params:
            params["category"] = "General"
            params["description"] = original_clause

        if "amount" in params:
            return ActionIntent(intent="ADD_EXPENSE", module="expense", params=params, confidence=0.7)
        else:
            return ActionIntent(
                intent="CLARIFICATION_REQUIRED", module="general",
                params={"missing_fields": ["amount"]},
                confidence=0.7,
            )

    return None


def extract_intents_fallback(transcript: str) -> AIResponse:
    """
    Enhanced keyword-based intent extraction used when Gemini is unavailable.
    Supports multi-clause commands split by ' and ', ' then ', etc.
    """
    raw_clauses = re.split(r",?\s+(?:and\s+also|and\s+then|and|also|then)\s+", transcript, flags=re.I)
    intents: list[ActionIntent] = []

    for clause in raw_clauses:
        clause_clean = clause.lower().strip()
        if not clause_clean:
            continue
        extracted = _extract_single_fallback_intent(clause_clean, clause.strip())
        if extracted:
            intents.append(extracted)

    if not intents:
        intents.append(ActionIntent(
            intent="GENERAL_QUERY", module="general",
            params={"query": transcript},
            confidence=0.4,
        ))

    if any(i.intent == "CLARIFICATION_REQUIRED" for i in intents):
        return AIResponse(
            intents=intents,
            response_text="I need a bit more information.",
            needs_clarification=True,
            clarification_question="Could you please provide the missing details?",
        )

    return AIResponse(
        intents=intents,
        response_text=f"[Fallback mode] Understood {len(intents)} action(s).",
        needs_clarification=False,
        clarification_question=None,
    )
