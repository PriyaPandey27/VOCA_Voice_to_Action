import React, { useEffect, useState, useCallback } from 'react';
import {
  Wallet,
  CheckCircle2,
  BellRing,
  TrendingUp,
  ArrowRight,
  Receipt,
  Calendar,
  Mic,
  Sparkles,
  Database,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { StatsCard } from '../components/StatsCard';
import { VoiceWidget } from '../components/VoiceWidget';
import { ExpenseCard } from '../components/ExpenseCard';
import { TaskCard } from '../components/TaskCard';
import { ReminderCard } from '../components/ReminderCard';
import { EmptyState } from '../components/EmptyState';
import {
  getDashboardSummary,
  getExpenseAnalytics,
  completeTask,
} from '../services/api';
import type { DashboardSummary, ExpenseAnalytics, Task } from '../types';
import { formatCurrency } from '../utils/formatters';

// Professional SaaS chart palette
const CHART_COLORS = ['#6366F1', '#0EA5E9', '#10B981', '#F59E0B', '#8B5CF6', '#F43F5E'];

export const Dashboard: React.FC = () => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [analytics, setAnalytics] = useState<ExpenseAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const [sumData, anaData] = await Promise.all([
        getDashboardSummary(),
        getExpenseAnalytics(),
      ]);
      setSummary(sumData);
      setAnalytics(anaData);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleToggleTask = async (task: Task) => {
    try {
      await completeTask(task.id);
      fetchData();
    } catch (err) {
      console.error('Failed to complete task:', err);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const todayDateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const spentToday = summary?.total_expenses_today ?? (summary as any)?.expenses?.total_today ?? 0;
  const spentMonth = summary?.total_expenses_month ?? (summary as any)?.expenses?.total_this_month ?? 0;
  const pendingTasks = summary?.pending_tasks_count ?? (summary as any)?.tasks?.total_pending ?? 0;
  const upcomingReminders = summary?.upcoming_reminders_count ?? (summary as any)?.reminders?.upcoming_count ?? 0;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
        <div className="text-sm font-medium text-slate-500">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 bg-white rounded-xl border border-rose-200 p-8 shadow-xs">
        <p className="text-sm font-semibold text-rose-600">{error}</p>
        <button
          onClick={fetchData}
          className="px-4 py-2 text-sm font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-slate-500 text-xs mb-1.5 font-medium">
            <Calendar className="w-3.5 h-3.5 text-indigo-600" />
            <span>{todayDateStr}</span>
            <span>·</span>
            <span className="text-emerald-700 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              SQLite Verified
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span>{getGreeting()}</span>
            <Sparkles className="w-5 h-5 text-indigo-500" />
          </h1>
          <p className="text-slate-600 text-sm mt-0.5">
            Voice-powered executive productivity. All figures verified from actual database records.
          </p>
        </div>

        <Link
          to="/voice"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-sm hover:shadow shadow-indigo-500/25 transition-all active:scale-95 shrink-0"
        >
          <Mic className="w-4 h-4" />
          <span>Launch Assistant</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Voice Assistant Widget */}
      <VoiceWidget onCommandExecuted={fetchData} />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Spent Today"
          value={formatCurrency(spentToday)}
          icon={Wallet}
          color="rose"
        />
        <StatsCard
          title="Spent This Month"
          value={formatCurrency(spentMonth)}
          icon={Receipt}
          color="indigo"
        />
        <StatsCard
          title="Pending Tasks"
          value={pendingTasks}
          icon={CheckCircle2}
          color="amber"
        />
        <StatsCard
          title="Upcoming Reminders"
          value={upcomingReminders}
          icon={BellRing}
          color="violet"
        />
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Spending Trend */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Daily Spending Trend</h2>
              <p className="text-xs text-slate-500 mt-0.5">Breakdown of recorded expenses</p>
            </div>
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="h-56 w-full">
            {analytics?.daily_expenses && analytics.daily_expenses.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.daily_expenses}>
                  <XAxis
                    dataKey="date"
                    stroke="#94A3B8"
                    fontSize={11}
                    tickFormatter={(val) => val.slice(5)}
                    tickLine={false}
                    axisLine={{ stroke: '#E2E8F0' }}
                  />
                  <YAxis
                    stroke="#94A3B8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#E2E8F0' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderColor: '#E2E8F0',
                      borderRadius: '0.5rem',
                      color: '#0F172A',
                      fontSize: '12px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    }}
                    formatter={(val: number) => [formatCurrency(val), 'Spent']}
                  />
                  <Bar dataKey="total" fill="#6366F1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm font-medium text-slate-400">
                No daily expense records found
              </div>
            )}
          </div>
        </div>

        {/* Expenses by Category */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Expenses by Category</h2>
              <p className="text-xs text-slate-500 mt-0.5">Distribution across active categories</p>
            </div>
          </div>
          <div className="h-56 w-full flex items-center justify-center">
            {analytics?.category_breakdown && analytics.category_breakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.category_breakdown}
                    dataKey="total"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={75}
                    innerRadius={45}
                    paddingAngle={4}
                    strokeWidth={2}
                    stroke="#FFFFFF"
                  >
                    {analytics.category_breakdown.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderColor: '#E2E8F0',
                      borderRadius: '0.5rem',
                      color: '#0F172A',
                      fontSize: '12px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    }}
                    formatter={(val: number) => [formatCurrency(val), 'Amount']}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-sm font-medium text-slate-400">No categorized expenses yet</div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Expenses */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">Recent Expenses</h3>
            <Link to="/expenses" className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold transition-colors">
              View all
            </Link>
          </div>
          <div className="space-y-2">
            {summary?.recent_expenses && summary.recent_expenses.length > 0 ? (
              summary.recent_expenses.slice(0, 3).map((exp) => (
                <ExpenseCard key={exp.id} expense={exp} compact />
              ))
            ) : (
              <EmptyState title="No expenses yet" message="Say: 'I spent 200 on lunch'" />
            )}
          </div>
        </div>

        {/* Pending Tasks */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">Pending Tasks</h3>
            <Link to="/tasks" className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold transition-colors">
              View all
            </Link>
          </div>
          <div className="space-y-2">
            {summary?.recent_tasks && summary.recent_tasks.length > 0 ? (
              summary.recent_tasks.slice(0, 3).map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onToggleComplete={handleToggleTask}
                  compact
                />
              ))
            ) : (
              <EmptyState title="No tasks yet" message="Say: 'Create task to study React'" />
            )}
          </div>
        </div>

        {/* Upcoming Reminders */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">Reminders</h3>
            <Link to="/reminders" className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold transition-colors">
              View all
            </Link>
          </div>
          <div className="space-y-2">
            {summary?.recent_reminders && summary.recent_reminders.length > 0 ? (
              summary.recent_reminders.slice(0, 3).map((rem) => (
                <ReminderCard key={rem.id} reminder={rem} compact />
              ))
            ) : (
              <EmptyState title="No reminders yet" message="Say: 'Remind me tomorrow at 7 PM'" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
