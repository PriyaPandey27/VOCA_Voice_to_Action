import axios from 'axios';
import type {
  VoiceCommandResponse,
  DashboardSummary,
  Expense,
  ExpenseCreate,
  Task,
  TaskCreate,
  Reminder,
  ReminderCreate,
  CommandHistoryEntry,
  ExpenseAnalytics,
  Contact,
  ContactCreate,
  EmailMessage,
} from '../types';

const api = axios.create({
  baseURL: '',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Voice
export async function processVoiceCommand(
  transcript: string,
  sessionId?: string
): Promise<VoiceCommandResponse> {
  const { data } = await api.post<VoiceCommandResponse>('/api/voice/process', {
    transcript,
    session_id: sessionId,
  });
  return data;
}

// Dashboard
export async function getDashboardSummary(): Promise<DashboardSummary> {
  const { data } = await api.get<DashboardSummary>('/api/dashboard/summary');
  return data;
}

// Expenses
export async function getExpenses(params?: {
  category?: string;
  start_date?: string;
  end_date?: string;
}): Promise<Expense[]> {
  const { data } = await api.get<Expense[]>('/api/expenses/', { params });
  return data;
}

export async function createExpense(expense: ExpenseCreate): Promise<Expense> {
  const { data } = await api.post<Expense>('/api/expenses/', expense);
  return data;
}

export async function updateExpense(
  id: number,
  expense: Partial<ExpenseCreate>
): Promise<Expense> {
  const { data } = await api.put<Expense>(`/api/expenses/${id}`, expense);
  return data;
}

export async function deleteExpense(id: number): Promise<void> {
  await api.delete(`/api/expenses/${id}`);
}

// Tasks
export async function getTasks(params?: {
  status?: string;
  priority?: string;
}): Promise<Task[]> {
  const { data } = await api.get<Task[]>('/api/tasks/', { params });
  return data;
}

export async function createTask(task: TaskCreate): Promise<Task> {
  const { data } = await api.post<Task>('/api/tasks/', task);
  return data;
}

export async function updateTask(
  id: number,
  task: Partial<TaskCreate & { status?: string }>
): Promise<Task> {
  const { data } = await api.put<Task>(`/api/tasks/${id}`, task);
  return data;
}

export async function completeTask(id: number): Promise<Task> {
  const { data } = await api.patch<Task>(`/api/tasks/${id}/complete`);
  return data;
}

export async function deleteTask(id: number): Promise<void> {
  await api.delete(`/api/tasks/${id}`);
}

// Reminders
export async function getReminders(params?: {
  status?: string;
}): Promise<Reminder[]> {
  const { data } = await api.get<Reminder[]>('/api/reminders/', { params });
  return data;
}

export async function createReminder(
  reminder: ReminderCreate
): Promise<Reminder> {
  const { data } = await api.post<Reminder>('/api/reminders/', reminder);
  return data;
}

export async function updateReminder(
  id: number,
  reminder: Partial<ReminderCreate>
): Promise<Reminder> {
  const { data } = await api.put<Reminder>(`/api/reminders/${id}`, reminder);
  return data;
}

export async function deleteReminder(id: number): Promise<void> {
  await api.delete(`/api/reminders/${id}`);
}

// Command History
export async function getCommandHistory(): Promise<CommandHistoryEntry[]> {
  const { data } = await api.get<CommandHistoryEntry[]>('/api/history/');
  return data;
}

// Analytics
export async function getExpenseAnalytics(): Promise<ExpenseAnalytics> {
  const { data } = await api.get<ExpenseAnalytics>('/api/analytics/expenses');
  return data;
}

// Contacts
export async function getContacts(search?: string): Promise<Contact[]> {
  const { data } = await api.get<Contact[]>('/api/contacts', {
    params: search ? { search } : undefined,
  });
  return data;
}

export async function createContact(contact: ContactCreate): Promise<Contact> {
  const { data } = await api.post<Contact>('/api/contacts', contact);
  return data;
}

export async function updateContact(id: number, contact: Partial<ContactCreate>): Promise<Contact> {
  const { data } = await api.put<Contact>(`/api/contacts/${id}`, contact);
  return data;
}

export async function deleteContact(id: number): Promise<void> {
  await api.delete(`/api/contacts/${id}`);
}

// Emails
export async function getEmails(): Promise<EmailMessage[]> {
  const { data } = await api.get<EmailMessage[]>('/api/emails');
  return data;
}

export async function sendEmail(email: { recipient_email: string; subject: string; body: string }): Promise<EmailMessage> {
  const { data } = await api.post<EmailMessage>('/api/emails', email);
  return data;
}

// Health
export async function checkHealth(): Promise<boolean> {
  try {
    await api.get('/health');
    return true;
  } catch {
    return false;
  }
}

export default api;
