import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: { value: number; label: string };
  color?: 'indigo' | 'blue' | 'emerald' | 'amber' | 'rose' | 'violet';
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon: Icon,
  trend,
  color = 'indigo',
}) => {
  const colorMap = {
    indigo: {
      badge: 'bg-indigo-50 text-indigo-600 border-indigo-200/80',
      accent: 'border-l-indigo-600',
    },
    blue: {
      badge: 'bg-sky-50 text-sky-600 border-sky-200/80',
      accent: 'border-l-sky-500',
    },
    emerald: {
      badge: 'bg-emerald-50 text-emerald-600 border-emerald-200/80',
      accent: 'border-l-emerald-600',
    },
    amber: {
      badge: 'bg-amber-50 text-amber-600 border-amber-200/80',
      accent: 'border-l-amber-500',
    },
    rose: {
      badge: 'bg-rose-50 text-rose-600 border-rose-200/80',
      accent: 'border-l-rose-500',
    },
    violet: {
      badge: 'bg-violet-50 text-violet-600 border-violet-200/80',
      accent: 'border-l-violet-600',
    },
  };

  const style = colorMap[color] || colorMap.indigo;

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs hover:shadow-md hover:border-slate-300 transition-all">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">{title}</p>
          <p className="text-2xl font-bold text-slate-900 tracking-tight">{value}</p>
          {trend && (
            <div className="flex items-center gap-1.5 mt-2">
              {trend.value >= 0 ? (
                <TrendingUp size={13} className="text-emerald-600" />
              ) : (
                <TrendingDown size={13} className="text-rose-600" />
              )}
              <span className={`text-xs font-semibold ${trend.value >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {trend.value >= 0 ? '+' : ''}
                {trend.value}%
              </span>
              <span className="text-xs text-slate-500 font-medium">{trend.label}</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-xl border ${style.badge} shadow-xs`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
};
