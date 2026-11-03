import React from 'react';
import type { Task } from '../types';
import { formatDate } from '../utils/formatters';
import { Pencil, Trash2, CheckCircle2, Circle, Calendar, Flag } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  onEdit?: (task: Task) => void;
  onDelete?: (id: number) => void;
  onToggleComplete?: (task: Task) => void;
  compact?: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onEdit,
  onDelete,
  onToggleComplete,
  compact = false,
}) => {
  const isCompleted = task.status === 'completed';

  const priorityStyles = {
    low: 'bg-slate-100 text-slate-700 border-slate-200',
    medium: 'bg-amber-50 text-amber-700 border-amber-200',
    high: 'bg-rose-50 text-rose-700 border-rose-200',
  };

  return (
    <div
      className={`bg-white border border-slate-200/90 rounded-xl p-4 hover:border-slate-300 hover:shadow-xs transition-all group ${
        isCompleted ? 'opacity-70 bg-slate-50/60' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        {onToggleComplete && (
          <button
            onClick={() => onToggleComplete(task)}
            className="mt-0.5 shrink-0 transition-transform active:scale-90"
            title={isCompleted ? 'Mark pending' : 'Mark completed'}
          >
            {isCompleted ? (
              <CheckCircle2 size={19} className="text-emerald-600" />
            ) : (
              <Circle size={19} className="text-slate-400 hover:text-indigo-600 transition-colors" />
            )}
          </button>
        )}
        <div className="flex-1 min-w-0">
          <p
            className={`text-sm font-semibold ${
              isCompleted ? 'line-through text-slate-400' : 'text-slate-900'
            }`}
          >
            {task.title}
          </p>
          {task.description && !compact && (
            <p className="text-xs text-slate-600 font-medium mt-1 line-clamp-2">
              {task.description}
            </p>
          )}
          <div className="flex items-center gap-2.5 mt-2">
            <span
              className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md font-semibold border ${
                priorityStyles[task.priority] || priorityStyles.medium
              }`}
            >
              <Flag size={10} />
              <span className="capitalize">{task.priority}</span>
            </span>
            {task.due_date && (
              <span className="inline-flex items-center gap-1 text-xs text-slate-500 font-medium">
                <Calendar size={11} className="text-slate-400" />
                <span>{formatDate(task.due_date)}</span>
              </span>
            )}
          </div>
        </div>
        {(onEdit || onDelete) && (
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            {onEdit && (
              <button
                onClick={() => onEdit(task)}
                className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 hover:text-indigo-600 transition-colors"
                title="Edit"
              >
                <Pencil size={14} />
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(task.id)}
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
