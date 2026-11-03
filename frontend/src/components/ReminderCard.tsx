import React from 'react';
import type { Reminder } from '../types';
import { formatDate, formatTime } from '../utils/formatters';
import { Pencil, Trash2, Bell, Clock } from 'lucide-react';

interface ReminderCardProps {
  reminder: Reminder;
  onEdit?: (reminder: Reminder) => void;
  onDelete?: (id: number) => void;
  compact?: boolean;
}

export const ReminderCard: React.FC<ReminderCardProps> = ({
  reminder,
  onEdit,
  onDelete,
  compact = false,
}) => {
  const isActive = reminder.status === 'active' || reminder.status === 'pending';

  return (
    <div
      className={`bg-white border border-slate-200/90 rounded-xl p-4 hover:border-slate-300 hover:shadow-xs transition-all group ${
        !isActive ? 'opacity-65 bg-slate-50/50' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-amber-50 border border-amber-200/80 flex items-center justify-center shrink-0">
          <Bell size={18} className="text-amber-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-900">{reminder.title}</p>
          {reminder.description && !compact && (
            <p className="text-xs text-slate-600 font-medium mt-1 line-clamp-2">
              {reminder.description}
            </p>
          )}
          <div className="flex items-center gap-2 mt-2">
            <span className="inline-flex items-center gap-1 text-xs text-slate-500 font-medium">
              <Clock size={11} className="text-slate-400" />
              <span>{formatDate(reminder.reminder_date)}</span>
              {reminder.reminder_time && <span>at {formatTime(reminder.reminder_time)}</span>}
            </span>
            <span
              className={`text-[11px] px-2 py-0.5 rounded-md font-semibold border ${
                isActive
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}
            >
              {reminder.status}
            </span>
          </div>
        </div>
        {(onEdit || onDelete) && (
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            {onEdit && (
              <button
                onClick={() => onEdit(reminder)}
                className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 hover:text-indigo-600 transition-colors"
                title="Edit"
              >
                <Pencil size={14} />
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(reminder.id)}
                className="p-1.5 rounded-md hover:bg-rose-50 text-slate-500 hover:text-rose-600 transition-colors"
                title="Delete"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
