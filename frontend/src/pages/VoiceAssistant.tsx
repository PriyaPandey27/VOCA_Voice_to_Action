import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useVoiceAssistant } from '../hooks/useVoiceAssistant';
import { AcousticWaveRing } from '../components/AcousticWaveRing';
import {
  Send,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Volume2,
  VolumeX,
  Play,
  RotateCcw,
  Receipt,
  CheckSquare,
  Bell,
  ExternalLink,
  Sparkles,
  Database,
} from 'lucide-react';
import { getExpenses, getTasks, getReminders } from '../services/api';
import type { Expense, Task, Reminder } from '../types';
import { formatCurrency, formatDate, getCategoryIcon } from '../utils/formatters';

export const VoiceAssistant: React.FC = () => {
  const {
    state,
    transcript,
    interimTranscript,
    response,
    results,
    startListening,
    stopListening,
    sendTextCommand,
    stopSpeaking,
    isMuted,
    toggleMute,
    error,
    isProcessing,
    isSupported,
  } = useVoiceAssistant();

  const [textInput, setTextInput] = useState('');
  const [recentExpenses, setRecentExpenses] = useState<Expense[]>([]);
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [recentReminders, setRecentReminders] = useState<Reminder[]>([]);

  const fetchLiveDatabaseRecords = useCallback(async () => {
    try {
      const [exp, tsk, rem] = await Promise.all([
        getExpenses({ limit: 4 } as any),
        getTasks(),
        getReminders(),
      ]);
      setRecentExpenses(exp.slice(0, 4));
      setRecentTasks(tsk.slice(0, 3));
      setRecentReminders(rem.slice(0, 3));
    } catch (e) {
      console.error('Failed to fetch live database records:', e);
    }
  }, []);

  useEffect(() => {
    fetchLiveDatabaseRecords();
  }, [fetchLiveDatabaseRecords]);

  useEffect(() => {
    if (response) {
      fetchLiveDatabaseRecords();
    }
  }, [response, fetchLiveDatabaseRecords]);

  const handleToggleVoice = () => {
    if (state === 'LISTENING') {
      stopListening();
    } else if (state === 'IDLE' || state === 'ERROR') {
      startListening();
    }
  };

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim() || isProcessing) return;
    const cmd = textInput;
    setTextInput('');
    await sendTextCommand(cmd);
  };

  const demoScenarios = [
    {
      label: '1. Add Expense',
      cmd: 'I spent 200 on coffee today',
      badge: 'Add Record',
      desc: 'Adds coffee to SQLite expenses table',
    },
    {
      label: '2. Smart Follow-up',
      cmd: 'Actually, change that to 250',
      badge: 'Context AI',
      desc: 'Resolves "that" to update coffee to ₹250',
    },
    {
      label: '3. Multi-Action Intent',
      cmd: 'I spent 400 on groceries, create task to finish report, and remind me tomorrow at 7 PM',
      badge: '3 Actions',
      desc: 'Executes expense, task, and reminder at once',
    },
    {
      label: '4. Priority Task',
      cmd: 'Create a task to complete project today',
      badge: 'Task Manager',
      desc: 'Schedules pending task with priority',
    },
    {
      label: '5. Query Expenses',
      cmd: 'Show my expenses from this week',
      badge: 'Database Query',
      desc: 'Aggregates totals and returns actual data',
    },
  ];

  return (
    <div className="space-y-10 pb-16">
      {/* Browser Speech API Banner */}
      {!isSupported && (
        <div className="p-4 rounded-xl border border-amber-200 bg-amber-50 text-amber-900 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <strong className="font-bold block">Microphone Notice</strong>
            Speech recognition works natively in <strong>Google Chrome</strong> and <strong>Microsoft Edge</strong>. You can also type commands directly in the input box below.
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center py-4">
        {/* Left: Typography & Actions */}
        <div className="lg:col-span-7 space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-xs font-bold text-indigo-700">
            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
            <span>Voice-to-Action Engine</span>
            <span className="text-slate-300">·</span>
            <span className="text-emerald-700 font-semibold">Zero Fake Data</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
            Voice AI,<br />
            for real <span className="text-indigo-600 underline decoration-indigo-300 decoration-wavy underline-offset-8">actions.</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 max-w-xl leading-relaxed font-medium">
            Speak naturally. Let Gemini AI parse your intention, and watch VOCA execute real operations directly in your persistent SQLite database.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={handleToggleVoice}
              className={`inline-flex items-center gap-2.5 px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-md active:scale-95 ${
                state === 'LISTENING'
                  ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-500/30 animate-pulse'
                  : 'bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white shadow-indigo-500/25'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${state === 'LISTENING' ? 'bg-white animate-ping' : 'bg-emerald-400'}`} />
              <span>{state === 'LISTENING' ? 'Listening... Tap to stop' : 'Start Voice Input'}</span>
            </button>

            <button
              onClick={toggleMute}
              className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-semibold transition-colors shadow-xs"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-600" /> : <Volume2 className="w-4 h-4 text-emerald-600" />}
              <span>{isMuted ? 'Audio Muted' : 'Voice Feedback On'}</span>
            </button>
          </div>

          {/* State Indicator */}
          <div className="flex items-center gap-2 pt-1 text-xs text-slate-500 font-medium">
            <span>Status:</span>
            <span className="font-bold text-indigo-700 uppercase tracking-wider">{state}</span>
            <span>·</span>
            <span className="text-emerald-700 font-semibold flex items-center gap-1">
              <Database className="w-3 h-3 text-emerald-600" /> SQLite Persistent
            </span>
          </div>
        </div>

        {/* Right: Acoustic Wave Ring */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center">
          <AcousticWaveRing state={state} onToggle={handleToggleVoice} size={280} />
          {state === 'SPEAKING' && (
            <button
              onClick={stopSpeaking}
              className="mt-4 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5 text-indigo-600" />
              <span>Stop Speaking</span>
            </button>
          )}
        </div>
      </section>

      {/* Input Bar & Live Transcript Display */}
      <section className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs space-y-3.5">
        {(transcript || interimTranscript) && (
          <div className="p-4 rounded-lg bg-indigo-50/50 border border-indigo-100 text-left">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 block mb-1">
              Spoken Input (Transcribed):
            </span>
            <p className="text-base text-slate-900 font-semibold">
              "{transcript}"
              <span className="text-slate-500 italic"> {interimTranscript}</span>
            </p>
          </div>
        )}

        {/* Text Input */}
        <form onSubmit={handleTextSubmit} className="relative flex items-center">
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Or type a command (e.g. 'I spent 200 on coffee', 'Change that to 250')..."
            disabled={isProcessing}
            className="w-full py-3.5 pl-4 pr-14 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!textInput.trim() || isProcessing}
            className="absolute right-2 p-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-40 disabled:pointer-events-none transition-all shadow-sm shadow-indigo-500/20"
            title="Send command"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </section>

      {/* Execution Results Verification */}
      {response && (
        <section className="bg-white border border-slate-200/90 rounded-xl p-6 space-y-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3.5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                <CheckCircle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Execution Proof & Database Output</h3>
                <p className="text-xs text-slate-500">Operation verified in SQLite database</p>
              </div>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Database className="w-3 h-3 text-emerald-600" />
              <span>Verified Record</span>
            </span>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Assistant Voice Response:
            </span>
            <p className="text-sm font-semibold text-emerald-800">
              "{response.spoken_text || response.response_text}"
            </p>
          </div>

          {results && results.length > 0 && (
            <div className="space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block">
                Executed Database Operations ({results.length}):
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {results.map((res, idx) => {
                  const isExpense = res.action.includes('EXPENSE');
                  const isTask = res.action.includes('TASK');
                  const isReminder = res.action.includes('REMINDER');

                  return (
                    <div
                      key={idx}
                      className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex flex-col justify-between gap-3"
                    >
                      <div className="flex items-start gap-2.5">
                        <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <strong className="text-xs font-bold text-slate-900 block uppercase tracking-wider">
                            {res.action}
                          </strong>
                          <p className="text-xs text-slate-700 font-medium mt-0.5">{res.message}</p>
                          {res.data && res.data.id ? (
                            <p className="mt-1 text-[11px] text-slate-500 font-mono">
                              Table: <strong>{isExpense ? 'expenses' : isTask ? 'tasks' : 'reminders'}</strong> (Row #{String(res.data.id)})
                            </p>
                          ) : null}
                        </div>
                      </div>

                      {isExpense && (
                        <Link
                          to="/expenses"
                          className="inline-flex items-center justify-between text-xs font-semibold text-indigo-600 hover:text-indigo-800 pt-2 border-t border-slate-200 transition-colors"
                        >
                          <span>Open in Expenses Table</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      )}
                      {isTask && (
                        <Link
                          to="/tasks"
                          className="inline-flex items-center justify-between text-xs font-semibold text-indigo-600 hover:text-indigo-800 pt-2 border-t border-slate-200 transition-colors"
                        >
                          <span>Open in Tasks Board</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      )}
                      {isReminder && (
                        <Link
                          to="/reminders"
                          className="inline-flex items-center justify-between text-xs font-semibold text-indigo-600 hover:text-indigo-800 pt-2 border-t border-slate-200 transition-colors"
                        >
                          <span>Open in Reminders</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {response.intents && response.intents.length > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Gemini Intent Understanding Breakdown:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {response.intents.map((it, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                    <span className="text-indigo-700 font-bold block">{it.intent}</span>
                    <span className="text-slate-500 text-[11px]">Module: {it.module}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Live SQLite Database Feed */}
      <section className="bg-white border border-slate-200/90 rounded-xl p-6 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3.5">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-emerald-600" />
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Live Database Feed (Persistent SQLite Storage)</h3>
              <p className="text-xs text-slate-500">Every voice action writes directly to <code className="text-indigo-600 font-semibold">voca.db</code></p>
            </div>
          </div>
          <Link
            to="/expenses"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
          >
            <span>View Full Expenses Table</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Expenses */}
          <div className="space-y-2.5">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
              <Receipt className="w-3.5 h-3.5 text-indigo-600" />
              <span>Recent Expenses</span>
            </span>
            <div className="space-y-2">
              {recentExpenses.length > 0 ? (
                recentExpenses.map((exp) => (
                  <div
                    key={exp.id}
                    className="p-3 rounded-lg border border-slate-200 flex items-center justify-between gap-3 text-xs hover:border-slate-300 hover:shadow-xs transition-all bg-white"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-base">{getCategoryIcon(exp.category)}</span>
                      <div className="min-w-0">
                        <strong className="text-slate-900 block font-semibold truncate">
                          {exp.description || exp.category}
                        </strong>
                        <span className="text-[11px] text-slate-500 font-medium">
                          {formatDate(exp.expense_date)} · {exp.category}
                        </span>
                      </div>
                    </div>
                    <span className="font-bold text-slate-900 text-sm shrink-0">
                      {formatCurrency(exp.amount)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-4 rounded-lg border border-dashed border-slate-200 text-center text-xs text-slate-400 font-medium">
                  No expenses in database yet
                </div>
              )}
            </div>
          </div>

          {/* Tasks */}
          <div className="space-y-2.5">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
              <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
              <span>Pending Tasks</span>
            </span>
            <div className="space-y-2">
              {recentTasks.length > 0 ? (
                recentTasks.map((t) => (
                  <div
                    key={t.id}
                    className="p-3 rounded-lg border border-slate-200 flex items-center justify-between gap-3 text-xs bg-white"
                  >
                    <div className="min-w-0">
                      <strong className="text-slate-900 block font-semibold truncate">{t.title}</strong>
                      <span className="text-[11px] text-slate-500 capitalize font-medium">
                        Priority: {t.priority} · {t.status}
                      </span>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                      #{t.id}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-4 rounded-lg border border-dashed border-slate-200 text-center text-xs text-slate-400 font-medium">
                  No pending tasks in database yet
                </div>
              )}
            </div>
          </div>

          {/* Reminders */}
          <div className="space-y-2.5">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
              <Bell className="w-3.5 h-3.5 text-amber-600" />
              <span>Reminders</span>
            </span>
            <div className="space-y-2">
              {recentReminders.length > 0 ? (
                recentReminders.map((r) => (
                  <div
                    key={r.id}
                    className="p-3 rounded-lg border border-slate-200 flex items-center justify-between gap-3 text-xs bg-white"
                  >
                    <div className="min-w-0">
                      <strong className="text-slate-900 block font-semibold truncate">{r.title}</strong>
                      <span className="text-[11px] text-slate-500 font-medium">
                        {r.reminder_date} {r.reminder_time ? `at ${r.reminder_time}` : ''}
                      </span>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                      #{r.id}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-4 rounded-lg border border-dashed border-slate-200 text-center text-xs text-slate-400 font-medium">
                  No reminders in database yet
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Suggested Voice Scenarios */}
      <section className="bg-white border border-slate-200/90 rounded-xl p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>Interactive Demo Scenarios</span>
          </div>
          <span className="text-xs text-slate-500 font-medium">Click to execute live</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {demoScenarios.map((demo, idx) => (
            <button
              key={idx}
              onClick={() => sendTextCommand(demo.cmd)}
              disabled={isProcessing}
              className="p-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-slate-50/80 text-left transition-all group flex flex-col justify-between shadow-2xs"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                    {demo.label}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700">
                    {demo.badge}
                  </span>
                </div>
                <p className="text-xs text-slate-700 font-semibold">"{demo.cmd}"</p>
              </div>
              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>{demo.desc}</span>
                <Play className="w-3 h-3 text-indigo-600 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};
