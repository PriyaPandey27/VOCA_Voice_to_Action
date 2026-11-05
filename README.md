# VOCA – Voice to Action Assistant

<div align="center">

🎙️ **Voice-Powered AI Action Assistant**

*Speak naturally. Let AI understand. Watch actions execute.*

</div>

---
## What is VOCA?

VOCA is a voice-first AI assistant that lets you manage **expenses**, **tasks**, **reminders**, **contacts**, and **emails** through natural spoken language. It is not just a chatbot — it is an **AI-powered voice-to-action application**.

## Demo_Video
https://drive.google.com/file/d/1be2i8_EfcgvvEPL_uaUmUzE0gxO298dg/view?usp=sharing

## Documentation_VOCA
https://drive.google.com/file/d/1AqtQjqKy9iNyC-kPDEbhzuivDHPbT1k9/view?usp=sharing

### Complete Architecture Workflow

```
Voice Input ──▶ Speech-to-Text ──▶ Gemini AI Intent Understanding ──▶ Action Execution ──▶ SQLite Database ──▶ Voice Response & Live UI
```

---

## 🚀 Key Features

- 🎙️ **Voice & Text Commands** — Speak or type naturally to create and manage records
- 🧠 **AI Intent Understanding** — Google Gemini 2.0 / 3.8 extracts structured intents from natural language
- 🔄 **Smart Follow-up Intelligence** — Say "change that to 650" and VOCA resolves context automatically
- ⚡ **Multi-Action Execution** — One command triggers multiple actions (e.g., "Add expense of 500 and remind me tomorrow to pay bills")
- 🔊 **Voice Responses (TTS)** — Speaks back confirmations and results
- 💾 **Persistent Storage** — SQLite database survives server restarts
- 📊 **Analytics Dashboard** — Real-time expense charts, category breakdown, and summary statistics
- 🛡️ **Offline Fallback Parser** — Full regex fallback parser when offline or without Gemini API key

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons |
| **Backend** | Python 3.11, FastAPI, SQLAlchemy ORM, Pydantic v2 |
| **Database** | SQLite (`backend/voca.db`) |
| **AI Engine** | Google Gemini Generative AI SDK (`gemini-2.0-flash` / `gemini-3.8-flash`) |
| **Voice Engine** | Web Speech API (SpeechRecognition + SpeechSynthesis) |

---

## ⚡ Quick Start

### 1. One-Click Launcher (Windows)
Double-click `run_voca.bat` in the project root:
```bat
run_voca.bat
```
This automatically starts:
- **Backend API**: `http://127.0.0.1:8000` (docs at `http://127.0.0.1:8000/docs`)
- **Frontend App**: `http://localhost:5173`

---

### 2. Manual Startup

#### Backend
```powershell
cd backend
.\.venv\Scripts\activate
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

#### Frontend
```powershell
cd frontend
npm run dev
```

---

## 🎙️ Demo Commands to Test

1. **Expense Tracking**:
   > *"I spent 100 rupees on lunch."*
   - Categorizes as **Lunch**, logs ₹100 under today's date, updates live dashboard.

2. **Reminders**:
   > *"Remind me tomorrow at 7 PM to complete my project."*
   - Calculates tomorrow's date, sets time to `19:00:00`, adds active reminder.

3. **Tasks**:
   > *"Add a high priority task to review the pitch deck."*
   - Creates task with high priority in pending status.

4. **Contacts & Emails**:
   > *"Send an email to Priya saying the demo is ready."*
   - Dispatches to email outbox.

---

## 🔒 Security & Environment Configuration

Copy the example environment file:
```powershell
cd backend
copy .env.example .env
```
Fill in your credentials, for safety:
```env
GEMINI_API_KEY=your_gemini_api_key_here
DATABASE_URL=sqlite:///./voca.db
RESEND_API_KEY=your_resend_api_key_here
EMAIL_FROM=onboarding@resend.dev
```
