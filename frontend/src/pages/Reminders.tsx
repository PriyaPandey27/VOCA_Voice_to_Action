import React, { useEffect, useState, useCallback } from 'react';
import {
  Bell,
  Plus,
  Clock,
  X,
  Search,
  Calendar,
} from 'lucide-react';
import { ReminderCard } from '../components/ReminderCard';
import { EmptyState } from '../components/EmptyState';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { StatsCard } from '../components/StatsCard';
import {
  getReminders,
  createReminder,
  updateReminder,
  deleteReminder,
} from '../services/api';
import type { Reminder, ReminderCreate } from '../types';

export const Reminders: React.FC = () => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [formData, setFormData] = useState<ReminderCreate>({
    title: '',
    description: '',
    reminder_date: new Date().toISOString().slice(0, 10),
    reminder_time: '19:00:00',
  });

  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const params: { status?: string } = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      const data = await getReminders(params);
      setReminders(data);
    } catch (err) {
      console.error('Failed to load reminders:', err);
      setError('Failed to load reminders from local database. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenAdd = () => {
    setEditingReminder(null);
    setFormData({
      title: '',
      description: '',
      reminder_date: new Date().toISOString().slice(0, 10),
      reminder_time: '19:00:00',
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (reminder: Reminder) => {
    setEditingReminder(reminder);
    setFormData({
      title: reminder.title,
      description: reminder.description || '',
      reminder_date: reminder.reminder_date,
      reminder_time: reminder.reminder_time || '19:00:00',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.reminder_date) return;

    try {
      if (editingReminder) {
        await updateReminder(editingReminder.id, formData);
      } else {
        await createReminder(formData);
      }
      setModalOpen(false);
      fetchData();
    } catch (err) {
      console.error('Failed to save reminder:', err);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return;
    try {
      await deleteReminder(deleteTargetId);
      setDeleteTargetId(null);
      fetchData();
    } catch (err) {
      console.error('Failed to delete reminder:', err);
    }
  };

  const filteredReminders = reminders.filter((r) =>
    r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.description && r.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const activeCount = reminders.filter((r) => r.status === 'active' || r.status === 'pending').length;
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayCount = reminders.filter((r) => r.reminder_date === todayStr).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex items-center gap-3 text-slate-700 font-semibold text-sm">
          <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <span>Loading reminders from SQLite...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <p className="text-sm font-semibold text-rose-600">{error}</p>
        <button
          onClick={fetchData}
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white shadow-xs">
            <Bell size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Reminders</h1>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">
              Keep track of time-sensitive alerts, appointments, and upcoming commitments.
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-xs transition-colors self-start sm:self-center"
        >
          <Plus size={16} />
          <span>Add Reminder</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatsCard
          title="Active Reminders"
          value={activeCount}
          icon={Bell}
          color="violet"
        />
        <StatsCard
          title="Due Today"
          value={todayCount}
          icon={Clock}
          color="amber"
        />
      </div>

      {/* Search and Filters */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 flex flex-col md:flex-row gap-3 justify-between items-center shadow-xs">
        <div className="relative w-full md:w-72">
          <Search size={16} className="text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search reminders..."
            className="w-full pl-9 pr-3.5 py-1.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-colors"
          />
        </div>

        <div className="flex p-0.5 rounded-lg bg-slate-100 border border-slate-200/80 w-full md:w-auto">
          {(['all', 'active', 'completed'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`text-xs px-3 py-1 rounded-md capitalize font-semibold transition-all ${
                statusFilter === tab
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Reminder List */}
      <div className="space-y-2.5">
        {filteredReminders.length > 0 ? (
          filteredReminders.map((reminder) => (
            <ReminderCard
              key={reminder.id}
              reminder={reminder}
              onEdit={handleOpenEdit}
              onDelete={(id) => setDeleteTargetId(id)}
            />
          ))
        ) : (
          <EmptyState
            title="No reminders yet."
            message={
              searchQuery
                ? 'No reminders matched your search.'
                : 'You have no scheduled reminders. Try saying: "Remind me to submit monthly report tomorrow at 5 PM".'
            }
            actionLabel="Add Reminder"
            onAction={handleOpenAdd}
          />
        )}
      </div>

      {/* Add / Edit Reminder Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={() => setModalOpen(false)}
          />
          <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                  <Bell size={16} />
                </div>
                <h2 className="text-base font-bold text-slate-900">
                  {editingReminder ? 'Edit Reminder' : 'Add New Reminder'}
                </h2>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Submit project review"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-slate-900 font-medium text-sm focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 placeholder-slate-400"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={formData.description || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Additional context or notes..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-slate-900 font-medium text-sm focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 placeholder-slate-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.reminder_date}
                    onChange={(e) =>
                      setFormData({ ...formData, reminder_date: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-semibold text-sm focus:outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                    Time
                  </label>
                  <input
                    type="time"
                    value={formData.reminder_time?.slice(0, 5) || '19:00'}
                    onChange={(e) =>
                      setFormData({ ...formData, reminder_time: `${e.target.value}:00` })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-semibold text-sm focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-xs"
                >
                  {editingReminder ? 'Save Changes' : 'Create Reminder'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteTargetId !== null}
        title="Delete Reminder"
        message="Are you sure you want to delete this reminder? This action cannot be undone."
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTargetId(null)}
      />
    </div>
  );
};
