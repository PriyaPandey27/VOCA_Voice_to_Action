import React from 'react';
import type { Expense } from '../types';
import { formatCurrency, formatDate, getCategoryIcon } from '../utils/formatters';
import { Pencil, Trash2 } from 'lucide-react';

interface ExpenseCardProps {
  expense: Expense;
  onEdit?: (expense: Expense) => void;
  onDelete?: (id: number) => void;
  compact?: boolean;
}

export const ExpenseCard: React.FC<ExpenseCardProps> = ({
  expense,
  onEdit,
  onDelete,
  compact = false,
}) => {
  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-4 hover:border-slate-300 hover:shadow-xs transition-all group">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-lg shrink-0">
          {getCategoryIcon(expense.category)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-900 truncate">
            {expense.description || expense.category}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded capitalize">
              {expense.category}
            </span>
            {!compact && (
              <>
                <span className="text-slate-300">·</span>
                <span className="text-xs text-slate-500 font-medium">
                  {formatDate(expense.expense_date)}
                </span>
                {expense.payment_method && (
                  <>
                    <span className="text-slate-300">·</span>
                    <span className="text-xs text-slate-500 font-medium capitalize">
                      {expense.payment_method}
                    </span>
                  </>
                )}
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-slate-900 whitespace-nowrap">
            {formatCurrency(expense.amount)}
          </span>
          {(onEdit || onDelete) && (
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              {onEdit && (
                <button
                  onClick={() => onEdit(expense)}
                  className="p-1.5 rounded-md hover:bg-slate-100 text-slate-600 hover:text-indigo-600 transition-colors"
                  title="Edit"
                >
                  <Pencil size={14} />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => onDelete(expense.id)}
                  className="p-1.5 rounded-md hover:bg-rose-50 text-slate-600 hover:text-rose-600 transition-colors"
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
