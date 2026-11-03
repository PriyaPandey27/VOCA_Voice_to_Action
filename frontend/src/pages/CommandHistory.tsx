import React, { useEffect, useState } from 'react';
import {
  History,
  CheckCircle,
  AlertCircle,
  Clock,
  Mic,
  Zap,
} from 'lucide-react';
import { EmptyState } from '../components/EmptyState';
import { getCommandHistory } from '../services/api';
import type { CommandHistoryEntry } from '../types';
import { formatDate } from '../utils/formatters';

export const CommandHistory: React.FC = () => {
  const [history, setHistory] = useState<CommandHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setError(null);
        const data = await getCommandHistory();
        setHistory(data);
      } catch (err) {
        console.error('Failed to load command history:', err);
        setError('Failed to load activity history from local database. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const parseJsonSafe = (raw: string) => {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex items-center gap-3 text-slate-700 font-semibold text-sm">
          <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <span>Loading activity history from SQLite...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <p className="text-sm font-semibold text-rose-600">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 text-sm rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors shadow-xs"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white shadow-xs">
          <History size={20} />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Activity History</h1>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">
            Audit trail of voice and typed commands, detected intents, and database execution results.
          </p>
        </div>
      </div>

      {/* History Items */}
      <div className="space-y-3">
        {history.length > 0 ? (
          history.map((entry) => {
            const intents = parseJsonSafe(entry.detected_intents) || [];
            const results = parseJsonSafe(entry.execution_results) || [];
            const isSuccess = entry.status === 'success';

            return (
              <div
                key={entry.id}
                className="bg-white border border-slate-200/90 rounded-xl p-5 hover:border-slate-300 hover:shadow-xs transition-all space-y-3.5"
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-start sm:items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-indigo-50 border border-indigo-100/80 shrink-0 text-indigo-600">
                      <Mic size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        "{entry.original_transcript}"
                      </p>
                      <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mt-0.5">
                        <Clock size={12} className="text-slate-400" />
                        <span>{formatDate(entry.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider self-start sm:self-center border ${
                      isSuccess
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}
                  >
                    {isSuccess ? (
                      <CheckCircle size={13} className="text-emerald-600" />
                    ) : (
                      <AlertCircle size={13} className="text-rose-600" />
                    )}
                    <span>{entry.status}</span>
                  </span>
                </div>

                {/* Assistant response */}
                {entry.assistant_response && (
                  <div className="p-3.5 rounded-xl bg-indigo-50/60 border border-indigo-100 text-xs">
                    <span className="font-bold text-indigo-900 uppercase tracking-wider block mb-1 text-[10px] flex items-center gap-1">
                      <Zap size={11} className="text-indigo-600" />
                      <span>VOCA Response</span>
                    </span>
                    <p className="text-slate-900 font-semibold leading-relaxed">
                      {entry.assistant_response}
                    </p>
                  </div>
                )}

                {/* Intents and Results Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  {/* Intents */}
                  <div className="p-3.5 rounded-xl border border-slate-200/90 bg-slate-50/40">
                    <span className="font-bold text-slate-600 uppercase tracking-wider block mb-2 text-[10px]">
                      Extracted Intents ({intents.length})
                    </span>
                    <div className="space-y-1.5">
                      {intents.length > 0 ? (
                        intents.map((i: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between text-slate-900 font-medium bg-white p-2 rounded-lg border border-slate-200/70">
                            <span className="font-semibold text-indigo-700">{i.intent}</span>
                            <span className="text-[11px] text-slate-500 font-mono">
                              module: {i.module}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-slate-400 italic">No structured intents extracted</p>
                      )}
                    </div>
                  </div>

                  {/* Execution Results */}
                  <div className="p-3.5 rounded-xl border border-slate-200/90 bg-slate-50/40">
                    <span className="font-bold text-slate-600 uppercase tracking-wider block mb-2 text-[10px]">
                      Execution Results ({results.length})
                    </span>
                    <div className="space-y-1.5">
                      {results.length > 0 ? (
                        results.map((r: any, idx: number) => (
                          <div key={idx} className="flex items-center gap-2 text-slate-900 font-medium bg-white p-2 rounded-lg border border-slate-200/70 truncate">
                            {r.success ? (
                              <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[10px] shrink-0">✓</span>
                            ) : (
                              <span className="w-4 h-4 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-[10px] shrink-0">✗</span>
                            )}
                            <span className="truncate text-xs font-semibold">{r.message}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-slate-400 italic">No execution events recorded</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <EmptyState
            icon={History}
            title="No activity history yet."
            message="Your voice and text command logs, extracted actions, and execution responses will appear here as you interact with VOCA."
          />
        )}
      </div>
    </div>
  );
};
