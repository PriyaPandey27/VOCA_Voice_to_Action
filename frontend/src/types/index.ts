// Voice Assistant States
export type VoiceState = 'IDLE' | 'LISTENING' | 'PROCESSING' | 'EXECUTING' | 'SPEAKING' | 'ERROR';

// Expense
export interface Expense {
  id: number;
  amount: number;
  category: string;
  description: string;
  expense_date: string;
  payment_method: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface ExpenseCreate {
  amount: number;
  category: string;
  description: string;
  expense_date: string;
  payment_method?: string;
}

// Task
export interface Task {
  id: number;
  title: string;
  description: string | null;
  priority: 'low' | 'medium' | 'high';
  due_date: string | null;
  status: 'pending' | 'completed';
  created_at: string;
  updated_at: string | null;
}

export interface TaskCreate {
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  due_date?: string;
}

// Reminder
export interface Reminder {
  id: number;
  title: string;
  description: string | null;
  reminder_date: string;
  reminder_time: string | null;
  status: string;
  created_at: string;
  updated_at: string | null;
}

export interface ReminderCreate {
  title: string;
  description?: string;
  reminder_date: string;
  reminder_time?: string;
}

// Voice
export interface VoiceCommandRequest {
  transcript: string;
  session_id?: string;
}

export interface ActionResult {
  success: boolean;
  action: string;
  message: string;
  data?: Record<string, unknown>;
}

export interface VoiceCommandResponse {
  success: boolean;
  transcript: string;
  intents: Array<{
    intent: string;
    module: string;
    params: Record<string, unknown>;
    confidence: number;
  }>;
  results: ActionResult[];
  response_text: string;
  spoken_text: string;
  is_fallback?: boolean;
}

// Dashboard
export interface DashboardSummary {
  total_expenses_today: number;
  total_expenses_week: number;
  total_expenses_month: number;
  pending_tasks_count: number;
  upcoming_reminders_count: number;
  recent_expenses: Expense[];
  recent_tasks: Task[];
  recent_reminders: Reminder[];
}

// Command History
export interface CommandHistoryEntry {
  id: number;
  original_transcript: string;
  detected_intents: string;
  execution_results: string;
  assistant_response: string;
  status: string;
  created_at: string;
}

// Analytics
export interface ExpenseAnalytics {
  category_breakdown: Array<{ category: string; total: number; count: number }>;
  daily_expenses: Array<{ date: string; total: number }>;
}

// Contacts
export interface Contact {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ContactCreate {
  name: string;
  email?: string;
  phone?: string;
  notes?: string;
}

// Emails
export interface EmailMessage {
  id: number;
  recipient_name?: string;
  recipient_email: string;
  subject: string;
  body: string;
  status: string;
  created_at?: string;
}
