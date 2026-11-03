import React, { useEffect, useState, useCallback } from 'react';
import {
  Users,
  Plus,
  Mail,
  Phone,
  Search,
  Trash2,
  X,
  ShieldCheck,
  UserCheck,
  Send,
  Clock,
  CheckCircle2,
  Inbox,
  Lock,
} from 'lucide-react';
import { EmptyState } from '../components/EmptyState';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { getContacts, createContact, deleteContact, getEmails, sendEmail } from '../services/api';
import type { Contact, ContactCreate, EmailMessage } from '../types';
import { formatDate } from '../utils/formatters';

export const Contacts: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'contacts' | 'outbox'>('contacts');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [emails, setEmails] = useState<EmailMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Add Contact Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState<ContactCreate>({
    name: '',
    email: '',
    phone: '',
    notes: '',
  });

  // Compose Email Modal
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailFormData, setEmailFormData] = useState({
    recipient_email: '',
    subject: '',
    body: '',
  });

  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

  const fetchContacts = useCallback(async () => {
    try {
      setError(null);
      const [contactData, emailData] = await Promise.all([
        getContacts(searchQuery || undefined),
        getEmails(),
      ]);
      setContacts(contactData);
      setEmails(emailData);
    } catch (err) {
      console.error('Failed to load contacts or emails:', err);
      setError('Failed to load records from SQLite database.');
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      notes: '',
    });
    setModalOpen(true);
  };

  const handleOpenCompose = (prefillEmail?: string) => {
    setEmailFormData({
      recipient_email: prefillEmail || '',
      subject: 'Update from VOCA',
      body: '',
    });
    setEmailModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      await createContact(formData);
      setModalOpen(false);
      fetchContacts();
    } catch (err) {
      console.error('Failed to save contact:', err);
    }
  };

  const handleSendEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailFormData.recipient_email.trim() || !emailFormData.body.trim()) return;

    try {
      await sendEmail({
        recipient_email: emailFormData.recipient_email,
        subject: emailFormData.subject || 'Update from VOCA',
        body: emailFormData.body,
      });
      setEmailModalOpen(false);
      setActiveTab('outbox');
      fetchContacts();
    } catch (err) {
      console.error('Failed to send email:', err);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return;
    try {
      await deleteContact(deleteTargetId);
      setDeleteTargetId(null);
      fetchContacts();
    } catch (err) {
      console.error('Failed to delete contact:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex items-center gap-3 text-slate-700 font-semibold text-sm">
          <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <span>Loading contacts & outbox from SQLite...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <p className="text-sm font-semibold text-rose-600">{error}</p>
        <button
          onClick={fetchContacts}
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
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-xs">
            <Users size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Contacts & Email Outbox</h1>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">
              Verified recipient address book and secure outbound email dispatch.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-center">
          <button
            onClick={() => handleOpenCompose()}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm shadow-xs transition-colors"
          >
            <Send size={15} className="text-indigo-600" />
            <span>Compose Email</span>
          </button>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-xs transition-colors"
          >
            <Plus size={16} />
            <span>Add Contact</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('contacts')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'contacts'
                ? 'bg-indigo-50 text-indigo-700 shadow-2xs border border-indigo-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Address Book ({contacts.length})
          </button>
          <button
            onClick={() => setActiveTab('outbox')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'outbox'
                ? 'bg-indigo-50 text-indigo-700 shadow-2xs border border-indigo-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sent Emails & Outbox ({emails.length})
          </button>
        </div>

        {activeTab === 'contacts' && contacts.length > 0 && (
          <div className="relative w-64 hidden sm:block">
            <Search size={14} className="text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search contacts..."
              className="w-full pl-8 pr-3 py-1 rounded-lg border border-slate-200 text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600"
            />
          </div>
        )}
      </div>

      {/* Active Tab: Contacts */}
      {activeTab === 'contacts' && (
        <>
          {contacts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {contacts.map((contact) => (
                <div
                  key={contact.id}
                  className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:border-slate-300 hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
                          {contact.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 text-sm">{contact.name}</h3>
                          {contact.notes && (
                            <p className="text-xs text-slate-500 font-medium line-clamp-1">{contact.notes}</p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => setDeleteTargetId(contact.id)}
                        className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors opacity-0 group-hover:opacity-100"
                        title="Delete contact"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                      {contact.email && (
                        <div className="flex items-center justify-between text-slate-700 font-medium">
                          <div className="flex items-center gap-2 truncate">
                            <Mail size={13} className="text-indigo-500 shrink-0" />
                            <span className="truncate">{contact.email}</span>
                          </div>
                          <button
                            onClick={() => handleOpenCompose(contact.email)}
                            className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 ml-2"
                          >
                            Email
                          </button>
                        </div>
                      )}
                      {contact.phone && (
                        <div className="flex items-center gap-2 text-slate-700 font-medium">
                          <Phone size={13} className="text-emerald-500 shrink-0" />
                          <span>{contact.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs">
              <EmptyState
                icon={Users}
                title="No contacts yet."
                message="You have not added any contacts. Click 'Add Contact' above to record verified contacts in your SQLite database."
                actionLabel="Add Contact"
                onAction={handleOpenAdd}
              />
            </div>
          )}
        </>
      )}

      {/* Active Tab: Outbox & Sent Emails */}
      {activeTab === 'outbox' && (
        <div className="space-y-3">
          {emails.length > 0 ? (
            emails.map((email) => (
              <div
                key={email.id}
                className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:border-slate-300 transition-all space-y-2.5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100 shrink-0">
                      <Mail size={16} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{email.subject}</h4>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        To: <strong className="text-slate-800">{email.recipient_name || email.recipient_email}</strong> ({email.recipient_email})
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-start sm:self-center">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      <CheckCircle2 size={12} className="text-emerald-600" />
                      <span className="uppercase tracking-wider">{email.status}</span>
                    </span>
                    {email.created_at && (
                      <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                        <Clock size={11} />
                        {formatDate(email.created_at)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-100 text-xs text-slate-800 font-medium whitespace-pre-wrap leading-relaxed">
                  {email.body}
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs">
              <EmptyState
                icon={Inbox}
                title="No sent emails yet."
                message="Emails sent via voice command or composed here will appear in this Outbox audit trail."
                actionLabel="Compose Email"
                onAction={() => handleOpenCompose()}
              />
            </div>
          )}
        </div>
      )}

      {/* Security & Credentials Notice Card */}
      <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/90 flex items-start gap-3">
        <Lock size={18} className="text-indigo-600 shrink-0 mt-0.5" />
        <div className="text-xs">
          <p className="font-bold text-slate-900">Zero Credential Exposure Guarantee</p>
          <p className="text-slate-600 font-medium mt-0.5">
            Passwords, SMTP secrets, and private keys are never exposed in the browser or code. All dispatched messages are securely verified and stored in the SQLite database (`voca.db`).
          </p>
        </div>
      </div>

      {/* Add Contact Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={() => setModalOpen(false)}
          />
          <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  <UserCheck size={16} />
                </div>
                <h2 className="text-base font-bold text-slate-900">Add New Contact</h2>
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
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Professor John"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-slate-900 font-medium text-sm focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 placeholder-slate-400"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g., professor.john@university.edu"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-slate-900 font-medium text-sm focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 placeholder-slate-400"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="e.g., +91 98765 43210"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-slate-900 font-medium text-sm focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 placeholder-slate-400"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                  Notes / Role
                </label>
                <input
                  type="text"
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="e.g., Thesis Advisor / Department Head"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-slate-900 font-medium text-sm focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 placeholder-slate-400"
                />
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
                  Save Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Compose Email Modal */}
      {emailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={() => setEmailModalOpen(false)}
          />
          <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  <Send size={16} />
                </div>
                <h2 className="text-base font-bold text-slate-900">Compose & Send Email</h2>
              </div>
              <button
                onClick={() => setEmailModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSendEmailSubmit} className="space-y-4 mt-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                  Recipient Email or Contact *
                </label>
                <input
                  type="text"
                  required
                  value={emailFormData.recipient_email}
                  onChange={(e) => setEmailFormData({ ...emailFormData, recipient_email: e.target.value })}
                  placeholder="e.g., professor.john@university.edu"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-slate-900 font-medium text-sm focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 placeholder-slate-400"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  value={emailFormData.subject}
                  onChange={(e) => setEmailFormData({ ...emailFormData, subject: e.target.value })}
                  placeholder="e.g., Project Draft Submission"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-slate-900 font-medium text-sm focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 placeholder-slate-400"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                  Message Body *
                </label>
                <textarea
                  rows={4}
                  required
                  value={emailFormData.body}
                  onChange={(e) => setEmailFormData({ ...emailFormData, body: e.target.value })}
                  placeholder="Dear Professor, please find the project review attached for your feedback..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-slate-900 font-medium text-sm focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 placeholder-slate-400"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEmailModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-xs flex items-center gap-2"
                >
                  <Send size={14} />
                  <span>Send Message</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteTargetId !== null}
        title="Delete Contact"
        message="Are you sure you want to delete this contact? This action cannot be undone."
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTargetId(null)}
      />
    </div>
  );
};
