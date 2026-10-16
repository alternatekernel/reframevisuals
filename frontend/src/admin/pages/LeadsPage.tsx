import React, { useState, useEffect, useCallback, useRef } from 'react';
import { adminFetch } from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../ToastContext';
import { Modal } from '../components/Modal';
import {
  Mail, RefreshCw, Plus, Download, Pencil, Trash2, ExternalLink,
  LayoutGrid, List, Phone, FileText, Users, Calendar, MessageSquare,
  Send, ChevronRight, X, Clock, Search, Zap, StopCircle, BellOff,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────

interface StaffUser {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
  role?: string;
}

interface Lead {
  id: string;
  name: string;
  company: string;
  email: string;
  status: LeadStatus;
  score: number;
  source: string;
  notes: string;
  assignedToId: string | null;
  assignedTo: StaffUser | null;
  lastContactedAt: string | null;
  nextFollowUpAt: string | null;
  unsubscribed: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: { activities: number };
}

interface LeadActivity {
  id: string;
  type: string;
  content: string;
  metadata?: string | null;
  createdAt: string;
  user: StaffUser;
}

interface SequenceStep {
  id?: string;
  delayDays: number;
  subject: string;
  body: string;
}

interface Sequence {
  id: string;
  name: string;
  active: boolean;
  steps: SequenceStep[];
  stats?: Record<string, number>;
}

interface Enrollment {
  id: string;
  sequenceId: string;
  status: string; // active | completed | replied | stopped | unsubscribed
  currentStep: number;
  nextSendAt: string | null;
  lastSentAt: string | null;
  sequence: { name: string; _count?: { steps: number } };
}

const ENROLLMENT_BADGE: Record<string, string> = {
  active: 'an-badge-blue',
  completed: 'an-badge-green',
  replied: 'an-badge-green',
  stopped: 'an-badge-gray',
  unsubscribed: 'an-badge-red',
};

type LeadStatus = 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost';
type ViewMode = 'kanban' | 'table';
type FilterTab = 'all' | 'mine' | 'unassigned';

// ─── Constants ────────────────────────────────────────────────

const STAGES: { key: LeadStatus; label: string; color: string; badgeCls: string }[] = [
  { key: 'new',         label: 'Incoming',  color: '#3b82f6', badgeCls: 'an-badge-blue'   },
  { key: 'contacted',   label: 'Contacted', color: '#10b981', badgeCls: 'an-badge-green'  },
  { key: 'qualified',   label: 'Quoted',    color: '#f59e0b', badgeCls: 'an-badge-yellow' },
  { key: 'proposal',    label: 'Proposal',  color: '#f97316', badgeCls: 'an-badge-orange' },
  { key: 'negotiation', label: 'Trial',     color: '#ef4444', badgeCls: 'an-badge-red'    },
  { key: 'won',         label: 'Won',       color: '#10b981', badgeCls: 'an-badge-green'  },
  { key: 'lost',        label: 'Lost',      color: '#9ca3af', badgeCls: 'an-badge-gray'   },
];

const STAGE_MAP = Object.fromEntries(STAGES.map(s => [s.key, s]));

const SOURCES = ['free-trial', 'book-meeting', 'inquiry', 'Website', 'Referral', 'LinkedIn', 'Google Ads', 'Other'];

const ACTIVITY_TYPES = [
  { value: 'call',    label: 'Phone Call',  Icon: Phone },
  { value: 'note',    label: 'Note',        Icon: FileText },
  { value: 'meeting', label: 'Meeting',     Icon: Users },
  { value: 'email',   label: 'Email',       Icon: Mail },
];

// ─── Helpers ──────────────────────────────────────────────────

const fmt = (n: number) =>
  n === 0 ? '—' : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

const rel = (iso: string | null) => {
  if (!iso) return '—';
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (d === 0) return 'Today';
  if (d === 1) return 'Yesterday';
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

const initials = (u: StaffUser | null) =>
  u ? `${u.firstName[0] ?? ''}${u.lastName[0] ?? ''}`.toUpperCase() : '';

// Value bar: filled segments are relative to the largest deal in the pipeline,
// so a $500 lead and a $10k lead read differently instead of both maxing out.
const scoreBar = (score: number, maxScore: number) => (
  <div className="flex gap-[3px] mt-2">
    {[1, 2, 3, 4, 5].map(i => (
      <div key={i} style={{ height: 3, flex: 1, borderRadius: 2, background: i <= Math.ceil((score / Math.max(maxScore, 1)) * 5) ? '#171717' : 'var(--an-border)' }} />
    ))}
  </div>
);

const EMPTY_FORM = { name: '', company: '', email: '', score: '', source: 'Website', notes: '', assignedToId: '', nextFollowUpAt: '' };
const EMPTY_ACTIVITY = { type: 'note', content: '' };
const EMPTY_EMAIL = { subject: '', body: '' };

const mapLead = (l: any): Lead => ({
  id: l.id,
  name: l.name || '',
  company: l.company || '',
  email: l.email || '',
  status: (l.status as LeadStatus) || 'new',
  score: Number(l.score ?? 0),
  source: l.source || 'Website',
  notes: l.notes || '',
  assignedToId: l.assignedToId || null,
  assignedTo: l.assignedTo || null,
  lastContactedAt: l.lastContactedAt || null,
  nextFollowUpAt: l.nextFollowUpAt || null,
  unsubscribed: !!l.unsubscribed,
  createdAt: l.createdAt,
  updatedAt: l.updatedAt,
  _count: l._count,
});

// ─── Assignee Avatar ──────────────────────────────────────────

const Avatar: React.FC<{ user: StaffUser | null; size?: number }> = ({ user, size = 22 }) => {
  if (!user) return null;
  return user.avatarUrl
    ? <img src={user.avatarUrl} alt={user.firstName} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover' }} />
    : (
      <div style={{ width: size, height: size, borderRadius: '50%', background: 'var(--an-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.4, fontWeight: 600, color: 'var(--an-text2)' }}>
        {initials(user)}
      </div>
    );
};

// ─── Activity icon ────────────────────────────────────────────

const activityIcon = (type: string) => {
  const map: Record<string, React.ReactNode> = {
    email: <Mail size={13} />,
    call: <Phone size={13} />,
    note: <FileText size={13} />,
    meeting: <Users size={13} />,
    status_change: <ChevronRight size={13} />,
  };
  return map[type] ?? <MessageSquare size={13} />;
};

// ─── Page ─────────────────────────────────────────────────────

export const LeadsPage: React.FC = () => {
  const nav = useNavigate();
  const { showToast } = useToast();

  // Data
  const [leads, setLeads] = useState<Lead[]>([]);
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);

  // View / filter state
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [filterTab, setFilterTab] = useState<FilterTab>('all');
  const [dragOver, setDragOver] = useState<LeadStatus | null>(null);
  const [search, setSearch] = useState('');
  const [totalLeads, setTotalLeads] = useState<number | null>(null);

  // Current user id (stored in localStorage by admin auth)
  const currentUserId = (() => {
    try { return JSON.parse(localStorage.getItem('admin_user') || '{}')?.id ?? null; } catch { return null; }
  })();

  // Create / Edit form
  const [showCreate, setShowCreate] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [busy, setBusy] = useState(false);

  // Detail drawer
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [activities, setActivities] = useState<LeadActivity[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);

  // Log activity modal
  const [showLogActivity, setShowLogActivity] = useState(false);
  const [activityForm, setActivityForm] = useState(EMPTY_ACTIVITY);
  const [activityBusy, setActivityBusy] = useState(false);

  // Send email form (inline in drawer)
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [emailForm, setEmailForm] = useState(EMPTY_EMAIL);
  const [emailBusy, setEmailBusy] = useState(false);

  // Drawer detail edit state
  const [drawerEditing, setDrawerEditing] = useState(false);
  const [drawerForm, setDrawerForm] = useState({ notes: '', assignedToId: '', nextFollowUpAt: '' });
  const drawerRef = useRef<HTMLDivElement>(null);

  // Outreach sequences
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [showSequences, setShowSequences] = useState(false);
  const [seqEditor, setSeqEditor] = useState<{ id?: string; name: string; active: boolean; steps: SequenceStep[] } | null>(null);
  const [seqBusy, setSeqBusy] = useState(false);
  const [leadEnrollments, setLeadEnrollments] = useState<Enrollment[]>([]);
  const [enrollSeqId, setEnrollSeqId] = useState('');
  const [enrollBusy, setEnrollBusy] = useState(false);

  // ── Fetch ──────────────────────────────────────────────────

  const buildQuery = useCallback(() => {
    // Load the whole pipeline in one request — the backend default of 20 was
    // silently hiding every lead beyond the most recent page.
    const params = new URLSearchParams({ limit: '500' });
    if (filterTab === 'mine' && currentUserId) params.set('assignedToId', currentUserId);
    if (filterTab === 'unassigned') params.set('assignedToId', 'unassigned');
    return `?${params.toString()}`;
  }, [filterTab, currentUserId]);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminFetch(`/business/leads${buildQuery()}`);
      setLeads((data.leads ?? []).map(mapLead));
      setTotalLeads(data.pagination?.total ?? null);
    } catch {
      showToast('Error', 'Failed to load leads', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast, buildQuery]);

  const fetchStaff = useCallback(async () => {
    try {
      const data = await adminFetch('/auth/users');
      setStaff((data.users ?? []).map((u: any) => ({ id: u.id, firstName: u.firstName, lastName: u.lastName, avatarUrl: u.avatarUrl, role: u.role })));
    } catch { /* non-critical */ }
  }, []);

  const fetchActivities = useCallback(async (leadId: string) => {
    setLoadingActivities(true);
    try {
      const data = await adminFetch(`/business/leads/${leadId}/activities`);
      setActivities(data.activities ?? []);
    } catch { /* non-critical */ }
    finally { setLoadingActivities(false); }
  }, []);

  const fetchSequences = useCallback(async () => {
    try {
      const data = await adminFetch('/outreach/sequences');
      setSequences(data.sequences ?? []);
    } catch { /* non-critical */ }
  }, []);

  const fetchEnrollments = useCallback(async (leadId: string) => {
    try {
      const data = await adminFetch(`/outreach/enrollments?leadId=${leadId}`);
      setLeadEnrollments(data.enrollments ?? []);
    } catch { setLeadEnrollments([]); }
  }, []);

  useEffect(() => { void fetchLeads(); void fetchStaff(); void fetchSequences(); }, [fetchLeads, fetchStaff, fetchSequences]);
  useEffect(() => {
    if (selectedLead) { fetchActivities(selectedLead.id); fetchEnrollments(selectedLead.id); }
    else setLeadEnrollments([]);
  }, [selectedLead?.id]);

  // Close drawer on Esc
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setSelectedLead(null); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  // ── Mutations ──────────────────────────────────────────────

  const patchLead = async (id: string, patch: Record<string, any>) => {
    const updated = await adminFetch(`/business/leads/${id}`, { method: 'PATCH', body: JSON.stringify(patch) });
    const mapped = mapLead(updated.lead);
    setLeads(prev => prev.map(l => l.id === id ? mapped : l));
    if (selectedLead?.id === id) setSelectedLead(mapped);
    return mapped;
  };

  const handleDrop = async (e: React.DragEvent, status: LeadStatus) => {
    e.preventDefault();
    setDragOver(null);
    const id = e.dataTransfer.getData('text/plain');
    if (!id) return;
    try {
      await patchLead(id, { status });
      showToast('Moved', `Lead moved to ${STAGE_MAP[status].label}`, 'success');
      if (selectedLead?.id === id) fetchActivities(id);
    } catch { showToast('Error', 'Failed to move lead', 'error'); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete lead "${name}"? This cannot be undone.`)) return;
    try {
      await adminFetch(`/business/leads/${id}`, { method: 'DELETE' });
      setLeads(prev => prev.filter(l => l.id !== id));
      if (selectedLead?.id === id) setSelectedLead(null);
      showToast('Deleted', 'Lead removed', 'success');
    } catch { showToast('Error', 'Failed to delete lead', 'error'); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) { showToast('Validation', 'Name and email are required', 'error'); return; }
    setBusy(true);
    try {
      const payload: Record<string, any> = {
        name: form.name.trim(),
        company: form.company.trim() || undefined,
        email: form.email.trim(),
        score: Number(form.score) || 0,
        source: form.source,
        notes: form.notes.trim() || undefined,
        assignedToId: form.assignedToId || undefined,
        nextFollowUpAt: form.nextFollowUpAt || undefined,
      };
      if (editingLead) {
        await patchLead(editingLead.id, payload);
        showToast('Saved', 'Lead updated', 'success');
        setEditingLead(null);
      } else {
        const data = await adminFetch('/business/leads', { method: 'POST', body: JSON.stringify({ ...payload, status: 'new' }) });
        setLeads(prev => [mapLead(data.lead), ...prev]);
        showToast('Created', 'Lead added to pipeline', 'success');
        setShowCreate(false);
      }
      setForm(EMPTY_FORM);
    } catch { showToast('Error', editingLead ? 'Failed to update lead' : 'Failed to create lead', 'error'); }
    finally { setBusy(false); }
  };

  const openEdit = (lead: Lead) => {
    setEditingLead(lead);
    setForm({
      name: lead.name, company: lead.company, email: lead.email,
      score: String(lead.score || ''), source: lead.source,
      notes: lead.notes || '',
      assignedToId: lead.assignedToId || '',
      nextFollowUpAt: lead.nextFollowUpAt ? lead.nextFollowUpAt.slice(0, 10) : '',
    });
  };

  const openDrawer = (lead: Lead) => {
    setSelectedLead(lead);
    setDrawerEditing(false);
    setShowEmailForm(false);
    setShowLogActivity(false);
  };

  const saveDrawerEdit = async () => {
    if (!selectedLead) return;
    setBusy(true);
    try {
      await patchLead(selectedLead.id, {
        notes: drawerForm.notes,
        assignedToId: drawerForm.assignedToId || null,
        nextFollowUpAt: drawerForm.nextFollowUpAt || null,
      });
      setDrawerEditing(false);
      showToast('Saved', 'Lead updated', 'success');
    } catch { showToast('Error', 'Failed to save', 'error'); }
    finally { setBusy(false); }
  };

  // Keep the activity count and last-contacted stamp in sync without a refetch.
  const bumpActivity = (leadId: string) => {
    const now = new Date().toISOString();
    const bump = (l: Lead): Lead => ({ ...l, _count: { activities: (l._count?.activities ?? 0) + 1 }, lastContactedAt: now });
    setLeads(prev => prev.map(l => (l.id === leadId ? bump(l) : l)));
    setSelectedLead(prev => (prev && prev.id === leadId ? bump(prev) : prev));
  };

  const handleLogActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead || !activityForm.content.trim()) return;
    setActivityBusy(true);
    try {
      const data = await adminFetch(`/business/leads/${selectedLead.id}/activities`, {
        method: 'POST',
        body: JSON.stringify(activityForm),
      });
      setActivities(prev => [data.activity, ...prev]);
      bumpActivity(selectedLead.id);
      setActivityForm(EMPTY_ACTIVITY);
      setShowLogActivity(false);
      showToast('Logged', 'Activity recorded', 'success');
    } catch { showToast('Error', 'Failed to log activity', 'error'); }
    finally { setActivityBusy(false); }
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead || !emailForm.subject.trim() || !emailForm.body.trim()) return;
    setEmailBusy(true);
    try {
      const data = await adminFetch(`/business/leads/${selectedLead.id}/email`, {
        method: 'POST',
        body: JSON.stringify({ subject: emailForm.subject, body: emailForm.body }),
      });
      setActivities(prev => [data.activity, ...prev]);
      bumpActivity(selectedLead.id);
      setEmailForm(EMPTY_EMAIL);
      setShowEmailForm(false);
      showToast('Sent', 'Email sent to lead', 'success');
    } catch { showToast('Error', 'Failed to send email', 'error'); }
    finally { setEmailBusy(false); }
  };

  // ── Sequence mutations ─────────────────────────────────────

  const saveSequence = async () => {
    if (!seqEditor || !seqEditor.name.trim()) { showToast('Validation', 'Sequence name is required', 'error'); return; }
    if (seqEditor.steps.some(s => !s.subject.trim() || !s.body.trim())) {
      showToast('Validation', 'Every step needs a subject and body', 'error'); return;
    }
    setSeqBusy(true);
    try {
      const payload = { name: seqEditor.name.trim(), active: seqEditor.active, steps: seqEditor.steps };
      if (seqEditor.id) await adminFetch(`/outreach/sequences/${seqEditor.id}`, { method: 'PATCH', body: JSON.stringify(payload) });
      else await adminFetch('/outreach/sequences', { method: 'POST', body: JSON.stringify(payload) });
      setSeqEditor(null);
      await fetchSequences();
      showToast('Saved', 'Sequence saved', 'success');
    } catch (err) { showToast('Error', err instanceof Error ? err.message : 'Failed to save sequence', 'error'); }
    finally { setSeqBusy(false); }
  };

  const deleteSequence = async (id: string, name: string) => {
    if (!confirm(`Delete sequence "${name}"? Active enrollments will stop.`)) return;
    try {
      await adminFetch(`/outreach/sequences/${id}`, { method: 'DELETE' });
      await fetchSequences();
      showToast('Deleted', 'Sequence removed', 'success');
    } catch { showToast('Error', 'Failed to delete sequence', 'error'); }
  };

  const toggleSequenceActive = async (seq: Sequence) => {
    try {
      await adminFetch(`/outreach/sequences/${seq.id}`, { method: 'PATCH', body: JSON.stringify({ active: !seq.active }) });
      await fetchSequences();
    } catch { showToast('Error', 'Failed to update sequence', 'error'); }
  };

  const enrollLead = async () => {
    if (!selectedLead || !enrollSeqId) return;
    setEnrollBusy(true);
    try {
      const result = await adminFetch(`/outreach/sequences/${enrollSeqId}/enroll`, {
        method: 'POST',
        body: JSON.stringify({ leadIds: [selectedLead.id] }),
      });
      if (result.enrolled > 0) showToast('Enrolled', 'Lead added to sequence — first email queued', 'success');
      else if (result.skippedExisting > 0) showToast('Skipped', 'Lead is already in this sequence', 'error');
      else if (result.skippedUnsubscribed > 0) showToast('Skipped', 'Lead has unsubscribed from outreach', 'error');
      setEnrollSeqId('');
      await fetchEnrollments(selectedLead.id);
    } catch { showToast('Error', 'Failed to enroll lead', 'error'); }
    finally { setEnrollBusy(false); }
  };

  const stopEnrollment = async (enrollmentId: string) => {
    if (!selectedLead) return;
    try {
      await adminFetch(`/outreach/enrollments/${enrollmentId}/stop`, { method: 'POST' });
      await fetchEnrollments(selectedLead.id);
      showToast('Stopped', 'Sequence stopped for this lead', 'success');
    } catch { showToast('Error', 'Failed to stop sequence', 'error'); }
  };

  const emptyStep = (): SequenceStep => ({ delayDays: 3, subject: '', body: '' });

  const handleExport = () => {
    const rows = [
      ['Name', 'Company', 'Email', 'Status', 'Score', 'Source', 'Assigned To', 'Last Contacted', 'Created'],
      ...leads.map(l => [l.name, l.company, l.email, l.status, String(l.score), l.source, l.assignedTo ? `${l.assignedTo.firstName} ${l.assignedTo.lastName}` : '', rel(l.lastContactedAt), l.createdAt]),
    ];
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  // ── Derived ────────────────────────────────────────────────

  const needle = search.trim().toLowerCase();
  const visibleLeads = needle
    ? leads.filter(l => [l.name, l.email, l.company, l.source].some(v => (v || '').toLowerCase().includes(needle)))
    : leads;

  const byStatus = STAGES.reduce((acc, s) => {
    acc[s.key] = visibleLeads.filter(l => l.status === s.key);
    return acc;
  }, {} as Record<LeadStatus, Lead[]>);

  const maxScore = Math.max(...leads.map(l => l.score), 1);
  // Active pipeline = deals still in play; won revenue is reported separately.
  const totalPipeline = leads.filter(l => l.status !== 'lost' && l.status !== 'won').reduce((sum, l) => sum + l.score, 0);
  const wonTotal = leads.filter(l => l.status === 'won').reduce((sum, l) => sum + l.score, 0);

  // ── Sub-forms ──────────────────────────────────────────────

  const LeadFormFields = (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="an-field-label">Name *</span>
          <input className="an-input w-full" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Jane Smith" />
        </label>
        <label className="block">
          <span className="an-field-label">Company</span>
          <input className="an-input w-full" value={form.company} onChange={e => setForm(p => ({ ...p, company: e.target.value }))} placeholder="Acme Store" />
        </label>
      </div>
      <label className="block">
        <span className="an-field-label">Email *</span>
        <input className="an-input w-full" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="jane@acme.com" />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="an-field-label">Est. Value ($)</span>
          <input className="an-input w-full" type="number" min="0" value={form.score} onChange={e => setForm(p => ({ ...p, score: e.target.value }))} placeholder="2000" />
        </label>
        <label className="block">
          <span className="an-field-label">Source</span>
          <select className="an-input w-full" value={form.source} onChange={e => setForm(p => ({ ...p, source: e.target.value }))}>
            {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="an-field-label">Assign To</span>
          <select className="an-input w-full" value={form.assignedToId} onChange={e => setForm(p => ({ ...p, assignedToId: e.target.value }))}>
            <option value="">Unassigned</option>
            {staff.map(u => <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="an-field-label">Follow-Up Date</span>
          <input className="an-input w-full" type="date" value={form.nextFollowUpAt} onChange={e => setForm(p => ({ ...p, nextFollowUpAt: e.target.value }))} />
        </label>
      </div>
      <label className="block">
        <span className="an-field-label">Notes</span>
        <textarea className="an-input w-full" rows={2} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Internal notes…" style={{ resize: 'vertical' }} />
      </label>
    </div>
  );

  // ── Render ─────────────────────────────────────────────────

  return (
    <div>
      {/* Header */}
      <div className="an-page-header">
        <div>
          <div className="an-page-title">
            <span className="ph-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
            Leads
          </div>
          <div className="an-page-desc">
            {totalLeads ?? leads.length} leads · {fmt(totalPipeline)} active pipeline{wonTotal > 0 ? <> · <span style={{ color: 'var(--an-green-text)' }}>{fmt(wonTotal)} won</span></> : null}
          </div>
        </div>
        <div className="an-page-actions">
          {/* View toggle */}
          <div className="flex border border-[var(--an-border)] rounded-md overflow-hidden">
            <button
              className={`px-2.5 py-1.5 flex items-center gap-1 text-[12px] transition-colors ${viewMode === 'kanban' ? 'bg-black text-white' : 'bg-white text-[var(--an-text2)] hover:text-[var(--an-text)]'}`}
              onClick={() => setViewMode('kanban')}
              title="Kanban view"
            >
              <LayoutGrid size={13} />
            </button>
            <button
              className={`px-2.5 py-1.5 flex items-center gap-1 text-[12px] transition-colors ${viewMode === 'table' ? 'bg-black text-white' : 'bg-white text-[var(--an-text2)] hover:text-[var(--an-text)]'}`}
              onClick={() => setViewMode('table')}
              title="Table view"
            >
              <List size={13} />
            </button>
          </div>
          <button className="an-btn an-btn-ghost an-btn-sm" onClick={() => setShowSequences(true)}>
            <Zap size={13} /> Sequences
          </button>
          <button className="an-btn an-btn-ghost an-btn-sm" onClick={fetchLeads} disabled={loading}>
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button className="an-btn an-btn-ghost an-btn-sm" onClick={handleExport}>
            <Download size={13} /> Export
          </button>
          <button className="an-btn an-btn-primary an-btn-sm" onClick={() => { setEditingLead(null); setForm(EMPTY_FORM); setShowCreate(true); }}>
            <Plus size={14} /> New Lead
          </button>
        </div>
      </div>

      {/* Filter tabs + search */}
      <div className="flex items-center justify-between gap-3 mb-4 border-b border-[var(--an-border)]" style={{ marginTop: -4 }}>
        <div className="flex gap-0">
          {([['all', 'All Leads'], ['mine', 'My Leads'], ['unassigned', 'Unassigned']] as [FilterTab, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilterTab(key)}
              className={`px-4 py-2 text-[13px] font-medium border-b-2 transition-colors -mb-px ${
                filterTab === key ? 'border-black text-[var(--an-text)]' : 'border-transparent text-[var(--an-text2)] hover:text-[var(--an-text)]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="relative mb-2 flex-shrink-0">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--an-text3)' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search name, email, company…"
            className="an-input"
            style={{ paddingLeft: 30, width: 240, fontSize: 13 }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--an-text3)' }}
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* ── Kanban ─────────────────────────────────────────── */}
      {viewMode === 'kanban' && (
        <div className="an-pipeline">
          {STAGES.map(stage => {
            const stageLeads = byStatus[stage.key];
            const stageTotal = stageLeads.reduce((s, l) => s + l.score, 0);
            return (
              <div
                key={stage.key}
                className="an-pipe-col"
                onDragOver={e => { e.preventDefault(); setDragOver(stage.key); }}
                onDragLeave={() => setDragOver(null)}
                onDrop={e => handleDrop(e, stage.key)}
                style={{ outline: dragOver === stage.key ? `2px solid ${stage.color}` : undefined, borderRadius: 8, transition: 'outline 0.1s' }}
              >
                <div className="an-pipe-head">
                  <div className="an-pipe-stage" style={{ color: stage.color }}>{stage.label}</div>
                  <div className="an-pipe-val">{stageTotal > 0 ? fmt(stageTotal) : `${stageLeads.length} lead${stageLeads.length !== 1 ? 's' : ''}`}</div>
                </div>
                <div className="an-pipe-body">
                  {stageLeads.map(lead => (
                    <div
                      key={lead.id}
                      className="an-lead-card"
                      draggable
                      onDragStart={e => e.dataTransfer.setData('text/plain', lead.id)}
                      onClick={() => openDrawer(lead)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="flex justify-between items-start gap-1">
                        <div className="an-lc-co truncate">{lead.company || lead.name}</div>
                        <button
                          className="an-btn an-btn-ghost an-btn-xs shrink-0"
                          style={{ padding: '1px 5px', fontSize: 12, lineHeight: 1 }}
                          onClick={e => { e.stopPropagation(); handleDelete(lead.id, lead.name); }}
                        >×</button>
                      </div>
                      {lead.company && <div className="an-lc-person">{lead.name}</div>}
                      <div className="an-lc-foot">
                        {lead.score > 0 && <span className="an-lc-val">{fmt(lead.score)}</span>}
                        <span className={`an-badge ${stage.badgeCls}`}>{stage.label}</span>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div className="an-lc-meta" style={{ fontSize: 11, color: 'var(--an-text2)' }}>
                          {lead.source} · {rel(lead.createdAt)}
                        </div>
                        {lead.assignedTo && (
                          <div title={`${lead.assignedTo.firstName} ${lead.assignedTo.lastName}`}>
                            <Avatar user={lead.assignedTo} size={18} />
                          </div>
                        )}
                      </div>
                      {lead.score > 0 && scoreBar(lead.score, maxScore)}
                    </div>
                  ))}
                  {stageLeads.length === 0 && (
                    <div style={{ padding: 14, textAlign: 'center', color: 'var(--an-text3)', fontSize: 12, border: '2px dashed var(--an-border)', borderRadius: 8 }}>
                      Drop leads here
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Table ──────────────────────────────────────────── */}
      {viewMode === 'table' && (
        <div className="an-tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Company</th>
                <th>Status</th>
                <th>Assigned To</th>
                <th>Est. Value</th>
                <th>Last Contacted</th>
                <th>Follow-Up</th>
                <th>Activities</th>
                <th>Added</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={10} style={{ textAlign: 'center', color: 'var(--an-text2)', padding: 32 }}>Loading…</td></tr>
              )}
              {!loading && visibleLeads.length === 0 && (
                <tr><td colSpan={10} style={{ textAlign: 'center', color: 'var(--an-text2)', padding: 32 }}>{search ? 'No leads match your search' : 'No leads yet'}</td></tr>
              )}
              {visibleLeads.map(lead => {
                const stage = STAGE_MAP[lead.status];
                return (
                  <tr key={lead.id} onClick={() => openDrawer(lead)} style={{ cursor: 'pointer' }}>
                    <td>
                      <div className="font-medium text-[var(--an-text)]">{lead.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--an-text2)' }}>{lead.email}</div>
                    </td>
                    <td>{lead.company || '—'}</td>
                    <td><span className={`an-badge ${stage.badgeCls}`}>{stage.label}</span></td>
                    <td>
                      {lead.assignedTo
                        ? <div className="flex items-center gap-1.5"><Avatar user={lead.assignedTo} size={20} /><span style={{ fontSize: 13 }}>{lead.assignedTo.firstName}</span></div>
                        : <span style={{ color: 'var(--an-text2)', fontSize: 12 }}>—</span>}
                    </td>
                    <td style={{ fontWeight: 500, color: lead.score > 0 ? 'var(--an-green-text)' : undefined }}>{fmt(lead.score)}</td>
                    <td style={{ fontSize: 12 }}>{rel(lead.lastContactedAt)}</td>
                    <td style={{ fontSize: 12 }}>{lead.nextFollowUpAt ? <span style={{ color: new Date(lead.nextFollowUpAt) < new Date() ? 'var(--an-red-text)' : undefined }}>{fmtDate(lead.nextFollowUpAt)}</span> : '—'}</td>
                    <td style={{ fontSize: 12 }}>{lead._count?.activities ?? 0}</td>
                    <td style={{ fontSize: 12, color: 'var(--an-text2)' }}>{rel(lead.createdAt)}</td>
                    <td onClick={e => e.stopPropagation()}>
                      <button className="an-btn an-btn-ghost an-btn-xs" onClick={() => handleDelete(lead.id, lead.name)}>
                        <Trash2 size={12} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Create / Edit modal ────────────────────────────── */}
      <Modal
        isOpen={showCreate || !!editingLead}
        onClose={() => { setShowCreate(false); setEditingLead(null); setForm(EMPTY_FORM); }}
        title={editingLead ? 'Edit Lead' : 'New Lead'}
        footer={
          <>
            <button className="an-btn an-btn-ghost an-btn-sm" onClick={() => { setShowCreate(false); setEditingLead(null); setForm(EMPTY_FORM); }}>Cancel</button>
            <button className="an-btn an-btn-primary an-btn-sm" onClick={handleSubmit} disabled={busy}>
              {busy ? 'Saving…' : editingLead ? 'Save Changes' : 'Create Lead'}
            </button>
          </>
        }
      >
        {LeadFormFields}
      </Modal>

      {/* ── Log Activity modal ─────────────────────────────── */}
      <Modal
        isOpen={showLogActivity}
        onClose={() => { setShowLogActivity(false); setActivityForm(EMPTY_ACTIVITY); }}
        title="Log Activity"
        footer={
          <>
            <button className="an-btn an-btn-ghost an-btn-sm" onClick={() => setShowLogActivity(false)}>Cancel</button>
            <button className="an-btn an-btn-primary an-btn-sm" onClick={handleLogActivity} disabled={activityBusy}>
              {activityBusy ? 'Saving…' : 'Log Activity'}
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <span className="an-field-label">Type</span>
            <div className="flex gap-2 mt-1.5 flex-wrap">
              {ACTIVITY_TYPES.map(({ value, label, Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setActivityForm(p => ({ ...p, type: value }))}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-[12px] font-medium transition-colors ${
                    activityForm.type === value ? 'bg-black text-white border-black' : 'bg-white text-[var(--an-text)] border-[var(--an-border)] hover:border-black/30'
                  }`}
                >
                  <Icon size={12} /> {label}
                </button>
              ))}
            </div>
          </div>
          <label className="block">
            <span className="an-field-label">Notes</span>
            <textarea
              className="an-input w-full"
              rows={4}
              value={activityForm.content}
              onChange={e => setActivityForm(p => ({ ...p, content: e.target.value }))}
              placeholder="What happened? Any next steps?"
              style={{ resize: 'vertical' }}
            />
          </label>
        </div>
      </Modal>

      {/* ── Sequences manager modal ────────────────────────── */}
      <Modal
        isOpen={showSequences}
        onClose={() => { setShowSequences(false); setSeqEditor(null); }}
        title={seqEditor ? (seqEditor.id ? 'Edit Sequence' : 'New Sequence') : 'Outreach Sequences'}
        footer={
          seqEditor ? (
            <>
              <button className="an-btn an-btn-ghost an-btn-sm" onClick={() => setSeqEditor(null)}>Back</button>
              <button className="an-btn an-btn-primary an-btn-sm" onClick={saveSequence} disabled={seqBusy}>
                {seqBusy ? 'Saving…' : 'Save Sequence'}
              </button>
            </>
          ) : (
            <>
              <button className="an-btn an-btn-ghost an-btn-sm" onClick={() => setShowSequences(false)}>Close</button>
              <button className="an-btn an-btn-primary an-btn-sm" onClick={() => setSeqEditor({ name: '', active: true, steps: [{ delayDays: 0, subject: '', body: '' }] })}>
                <Plus size={13} /> New Sequence
              </button>
            </>
          )
        }
      >
        {!seqEditor ? (
          <div className="space-y-2">
            {sequences.length === 0 && (
              <div style={{ fontSize: 13, color: 'var(--an-text2)', padding: '16px 0', textAlign: 'center' }}>
                No sequences yet. A sequence is a series of automatic follow-up emails sent from your Google mailbox —
                it stops the moment the lead replies or unsubscribes.
              </div>
            )}
            {sequences.map(seq => {
              const active = seq.stats?.active ?? 0;
              const replied = seq.stats?.replied ?? 0;
              const completed = seq.stats?.completed ?? 0;
              return (
                <div key={seq.id} style={{ border: '1px solid var(--an-border)', borderRadius: 10, padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                  <div style={{ minWidth: 0 }}>
                    <div className="flex items-center gap-2">
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{seq.name}</span>
                      <span className={`an-badge ${seq.active ? 'an-badge-green' : 'an-badge-gray'}`}>{seq.active ? 'active' : 'paused'}</span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--an-text2)', marginTop: 2 }}>
                      {seq.steps.length} step{seq.steps.length !== 1 ? 's' : ''} · {active} in progress · {replied} replied · {completed} completed
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      className="an-btn an-btn-ghost an-btn-xs"
                      title={seq.active ? 'Pause sequence' : 'Activate sequence'}
                      onClick={() => toggleSequenceActive(seq)}
                    >
                      {seq.active ? 'Pause' : 'Activate'}
                    </button>
                    <button
                      className="an-btn an-btn-ghost an-btn-xs"
                      onClick={() => setSeqEditor({ id: seq.id, name: seq.name, active: seq.active, steps: seq.steps.map(s => ({ delayDays: s.delayDays, subject: s.subject, body: s.body })) })}
                    >
                      <Pencil size={11} />
                    </button>
                    <button className="an-btn an-btn-ghost an-btn-xs text-red-500" onClick={() => deleteSequence(seq.id, seq.name)}>
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
              );
            })}
            <div style={{ fontSize: 11, color: 'var(--an-text3)', paddingTop: 8, lineHeight: 1.5 }}>
              Sends go out weekdays 8:00–18:00 with randomized timing, capped at 30/day, from your Google outreach mailbox.
              Replies stop the sequence automatically and every email carries an unsubscribe link.
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex gap-3 items-end">
              <label className="block flex-1">
                <span className="an-field-label">Sequence Name *</span>
                <input className="an-input w-full" value={seqEditor.name} onChange={e => setSeqEditor(p => p ? { ...p, name: e.target.value } : p)} placeholder="e.g. Free Trial Follow-up" />
              </label>
              <label className="flex items-center gap-2 pb-2 cursor-pointer" style={{ fontSize: 13 }}>
                <input type="checkbox" checked={seqEditor.active} onChange={e => setSeqEditor(p => p ? { ...p, active: e.target.checked } : p)} />
                Active
              </label>
            </div>

            {seqEditor.steps.map((step, i) => (
              <div key={i} style={{ border: '1px solid var(--an-border)', borderRadius: 10, padding: 12 }}>
                <div className="flex items-center justify-between mb-2">
                  <span style={{ fontSize: 12, fontWeight: 700 }}>Step {i + 1}</span>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1.5" style={{ fontSize: 12, color: 'var(--an-text2)' }}>
                      {i === 0 ? 'Send after enrollment:' : 'Wait after previous:'}
                      <input
                        type="number" min="0" max="60"
                        className="an-input"
                        style={{ width: 56, padding: '2px 6px', fontSize: 12 }}
                        value={step.delayDays}
                        onChange={e => setSeqEditor(p => p ? { ...p, steps: p.steps.map((s, j) => j === i ? { ...s, delayDays: Number(e.target.value) } : s) } : p)}
                      /> days
                    </label>
                    {seqEditor.steps.length > 1 && (
                      <button
                        className="an-btn an-btn-ghost an-btn-xs text-red-500"
                        onClick={() => setSeqEditor(p => p ? { ...p, steps: p.steps.filter((_, j) => j !== i) } : p)}
                      >
                        <Trash2 size={11} />
                      </button>
                    )}
                  </div>
                </div>
                <input
                  className="an-input w-full mb-2"
                  placeholder="Subject — supports {{firstName}}, {{name}}, {{company}}"
                  value={step.subject}
                  onChange={e => setSeqEditor(p => p ? { ...p, steps: p.steps.map((s, j) => j === i ? { ...s, subject: e.target.value } : s) } : p)}
                />
                <textarea
                  className="an-input w-full"
                  rows={4}
                  placeholder={'Hi {{firstName}},\n\nPlain text works best — write like you would to one person.'}
                  value={step.body}
                  onChange={e => setSeqEditor(p => p ? { ...p, steps: p.steps.map((s, j) => j === i ? { ...s, body: e.target.value } : s) } : p)}
                  style={{ resize: 'vertical', fontSize: 13 }}
                />
              </div>
            ))}

            <button
              className="an-btn an-btn-ghost an-btn-sm w-full"
              onClick={() => setSeqEditor(p => p ? { ...p, steps: [...p.steps, emptyStep()] } : p)}
            >
              <Plus size={13} /> Add Follow-up Step
            </button>
            <div style={{ fontSize: 11, color: 'var(--an-text3)', lineHeight: 1.5 }}>
              Variables: {'{{firstName}}'}, {'{{name}}'}, {'{{company}}'}, {'{{email}}'} — filled from the lead record.
              An unsubscribe line is appended automatically; don't add your own.
            </div>
          </div>
        )}
      </Modal>

      {/* ── Detail Drawer ───────────────────────────────────── */}
      {selectedLead && (
        <>
          {/* Backdrop */}
          <div
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.15)', zIndex: 49 }}
            onClick={() => setSelectedLead(null)}
          />
          {/* Drawer */}
          <div
            ref={drawerRef}
            style={{
              position: 'fixed', top: 0, right: 0, bottom: 0, width: 480,
              background: 'var(--an-surface)', borderLeft: '1px solid var(--an-border)',
              zIndex: 50, overflowY: 'auto', display: 'flex', flexDirection: 'column',
              boxShadow: 'var(--an-shadow-lg)',
            }}
          >
            {/* Drawer header */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--an-border)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexShrink: 0 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--an-text)', lineHeight: 1.3 }}>{selectedLead.company || selectedLead.name}</div>
                {selectedLead.company && <div style={{ fontSize: 13, color: 'var(--an-text2)', marginTop: 2 }}>{selectedLead.name}</div>}
              </div>
              <div className="flex items-center gap-1.5">
                <button className="an-btn an-btn-ghost an-btn-xs" onClick={() => { openEdit(selectedLead); setSelectedLead(null); }}>
                  <Pencil size={12} /> Edit
                </button>
                <button className="an-btn an-btn-ghost an-btn-xs text-red-500" onClick={() => { handleDelete(selectedLead.id, selectedLead.name); }}>
                  <Trash2 size={12} />
                </button>
                <button className="an-btn an-btn-ghost an-btn-xs" onClick={() => setSelectedLead(null)}>
                  <X size={14} />
                </button>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 24px' }}>
              {/* Info grid */}
              <div style={{ paddingTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 24px', fontSize: 13 }}>
                <div>
                  <div className="an-field-label mb-0.5">Email</div>
                  <a href={`mailto:${selectedLead.email}`} className="flex items-center gap-1 hover:underline" style={{ color: 'var(--an-text)' }}>
                    <Mail size={12} /> {selectedLead.email}
                  </a>
                </div>
                <div>
                  <div className="an-field-label mb-0.5">Source</div>
                  <div>{selectedLead.source}</div>
                </div>
                <div>
                  <div className="an-field-label mb-0.5">Est. Value</div>
                  <div style={{ fontWeight: 600, color: 'var(--an-green-text)' }}>{fmt(selectedLead.score)}</div>
                </div>
                <div>
                  <div className="an-field-label mb-0.5">Last Contacted</div>
                  <div>{rel(selectedLead.lastContactedAt)}</div>
                </div>
                <div>
                  <div className="an-field-label mb-0.5">Follow-Up</div>
                  <div style={{ color: selectedLead.nextFollowUpAt && new Date(selectedLead.nextFollowUpAt) < new Date() ? 'var(--an-red-text)' : undefined }}>
                    {fmtDate(selectedLead.nextFollowUpAt)}
                  </div>
                </div>
                <div>
                  <div className="an-field-label mb-0.5">Added</div>
                  <div>{rel(selectedLead.createdAt)}</div>
                </div>
              </div>

              {/* Stage selector */}
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--an-border)' }}>
                <div className="an-field-label mb-2">Stage</div>
                <div className="flex flex-wrap gap-1.5">
                  {STAGES.map(s => (
                    <button
                      key={s.key}
                      onClick={async () => { await patchLead(selectedLead.id, { status: s.key }); fetchActivities(selectedLead.id); }}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-colors ${
                        selectedLead.status === s.key ? 'bg-black text-white border-black' : 'bg-white text-[var(--an-text)] border-[var(--an-border)] hover:border-black/30'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Assigned To + Notes (inline edit) */}
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--an-border)' }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="an-field-label">Details</div>
                  {!drawerEditing
                    ? <button className="an-btn an-btn-ghost an-btn-xs" onClick={() => { setDrawerEditing(true); setDrawerForm({ notes: selectedLead.notes || '', assignedToId: selectedLead.assignedToId || '', nextFollowUpAt: selectedLead.nextFollowUpAt ? selectedLead.nextFollowUpAt.slice(0, 10) : '' }); }}>
                        <Pencil size={11} /> Edit
                      </button>
                    : <div className="flex gap-1">
                        <button className="an-btn an-btn-ghost an-btn-xs" onClick={() => setDrawerEditing(false)}>Cancel</button>
                        <button className="an-btn an-btn-primary an-btn-xs" onClick={saveDrawerEdit} disabled={busy}>Save</button>
                      </div>
                  }
                </div>

                {!drawerEditing ? (
                  <div style={{ fontSize: 13, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div className="flex items-center gap-2">
                      <Users size={13} style={{ color: 'var(--an-text2)', flexShrink: 0 }} />
                      {selectedLead.assignedTo
                        ? <div className="flex items-center gap-1.5"><Avatar user={selectedLead.assignedTo} size={20} /> {selectedLead.assignedTo.firstName} {selectedLead.assignedTo.lastName}</div>
                        : <span style={{ color: 'var(--an-text2)' }}>Unassigned</span>
                      }
                    </div>
                    {selectedLead.nextFollowUpAt && (
                      <div className="flex items-center gap-2">
                        <Calendar size={13} style={{ color: 'var(--an-text2)', flexShrink: 0 }} />
                        <span>Follow-up: {fmtDate(selectedLead.nextFollowUpAt)}</span>
                      </div>
                    )}
                    {selectedLead.notes && (
                      <div className="flex items-start gap-2">
                        <FileText size={13} style={{ color: 'var(--an-text2)', flexShrink: 0, marginTop: 2 }} />
                        <span style={{ whiteSpace: 'pre-wrap' }}>{selectedLead.notes}</span>
                      </div>
                    )}
                    {!selectedLead.notes && !selectedLead.nextFollowUpAt && !selectedLead.assignedTo && (
                      <span style={{ color: 'var(--an-text2)', fontSize: 12 }}>No details yet. Click Edit to add notes or assign this lead.</span>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <label className="block">
                      <span className="an-field-label">Assign To</span>
                      <select className="an-input w-full" value={drawerForm.assignedToId} onChange={e => setDrawerForm(p => ({ ...p, assignedToId: e.target.value }))}>
                        <option value="">Unassigned</option>
                        {staff.map(u => <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>)}
                      </select>
                    </label>
                    <label className="block">
                      <span className="an-field-label">Follow-Up Date</span>
                      <input className="an-input w-full" type="date" value={drawerForm.nextFollowUpAt} onChange={e => setDrawerForm(p => ({ ...p, nextFollowUpAt: e.target.value }))} />
                    </label>
                    <label className="block">
                      <span className="an-field-label">Notes</span>
                      <textarea className="an-input w-full" rows={3} value={drawerForm.notes} onChange={e => setDrawerForm(p => ({ ...p, notes: e.target.value }))} style={{ resize: 'vertical' }} />
                    </label>
                  </div>
                )}
              </div>

              {/* Outreach actions */}
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--an-border)' }}>
                <div className="an-field-label mb-2">Outreach</div>
                <div className="flex gap-2 flex-wrap">
                  <button className="an-btn an-btn-ghost an-btn-sm" onClick={() => { setShowEmailForm(v => !v); }}>
                    <Mail size={13} /> {showEmailForm ? 'Hide Email' : 'Send Email'}
                  </button>
                  <button className="an-btn an-btn-ghost an-btn-sm" onClick={() => setShowLogActivity(true)}>
                    <Clock size={13} /> Log Activity
                  </button>
                  <a
                    href={`https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent([selectedLead.name, selectedLead.company].filter(Boolean).join(' '))}`}
                    target="_blank" rel="noopener noreferrer"
                    className="an-btn an-btn-ghost an-btn-sm"
                  >
                    <ExternalLink size={13} /> LinkedIn
                  </a>
                  <button className="an-btn an-btn-primary an-btn-sm" onClick={() => { nav('/admin/quotations/new'); setSelectedLead(null); }}>
                    Create Quote
                  </button>
                </div>

                {/* Inline email form */}
                {showEmailForm && (
                  <form onSubmit={handleSendEmail} style={{ marginTop: 12, background: 'var(--an-bg, #f9f9f9)', border: '1px solid var(--an-border)', borderRadius: 8, padding: 14 }}>
                    <div className="space-y-2">
                      <label className="block">
                        <span className="an-field-label">To</span>
                        <input className="an-input w-full" value={selectedLead.email} readOnly style={{ background: 'var(--an-border)', opacity: 0.7 }} />
                      </label>
                      <label className="block">
                        <span className="an-field-label">Subject *</span>
                        <input className="an-input w-full" value={emailForm.subject} onChange={e => setEmailForm(p => ({ ...p, subject: e.target.value }))} placeholder="Subject…" required />
                      </label>
                      <label className="block">
                        <span className="an-field-label">Message *</span>
                        <textarea className="an-input w-full" rows={4} value={emailForm.body} onChange={e => setEmailForm(p => ({ ...p, body: e.target.value }))} placeholder="Write your outreach message…" required style={{ resize: 'vertical' }} />
                      </label>
                      <div className="flex justify-end gap-2">
                        <button type="button" className="an-btn an-btn-ghost an-btn-xs" onClick={() => setShowEmailForm(false)}>Cancel</button>
                        <button type="submit" className="an-btn an-btn-primary an-btn-xs" disabled={emailBusy}>
                          <Send size={11} /> {emailBusy ? 'Sending…' : 'Send'}
                        </button>
                      </div>
                    </div>
                  </form>
                )}
              </div>

              {/* Sequence enrollment */}
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--an-border)' }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="an-field-label flex items-center gap-1"><Zap size={11} /> Sequence</div>
                  {selectedLead.unsubscribed && (
                    <span className="an-badge an-badge-red inline-flex items-center gap-1"><BellOff size={10} /> Unsubscribed</span>
                  )}
                </div>

                {leadEnrollments.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {leadEnrollments.map(en => (
                      <div key={en.id} style={{ fontSize: 12, border: '1px solid var(--an-border)', borderRadius: 8, padding: '8px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                        <div>
                          <div style={{ fontWeight: 600 }}>{en.sequence.name}</div>
                          <div style={{ color: 'var(--an-text2)', marginTop: 2 }}>
                            Step {en.currentStep}/{en.sequence._count?.steps ?? '?'}
                            {en.status === 'active' && en.nextSendAt && <> · next send {fmtDate(en.nextSendAt)}</>}
                            {en.lastSentAt && <> · last sent {rel(en.lastSentAt)}</>}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className={`an-badge ${ENROLLMENT_BADGE[en.status] || 'an-badge-gray'}`}>{en.status}</span>
                          {en.status === 'active' && (
                            <button
                              className="an-btn an-btn-ghost an-btn-xs text-red-500"
                              title="Stop sequence for this lead"
                              onClick={() => stopEnrollment(en.id)}
                            >
                              <StopCircle size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {!selectedLead.unsubscribed && !leadEnrollments.some(en => en.status === 'active') && (
                  sequences.filter(s => s.active).length > 0 ? (
                    <div className="flex gap-2">
                      <select className="an-input flex-1" value={enrollSeqId} onChange={e => setEnrollSeqId(e.target.value)} style={{ fontSize: 12 }}>
                        <option value="">Choose a sequence…</option>
                        {sequences.filter(s => s.active).map(s => (
                          <option key={s.id} value={s.id}>{s.name} ({s.steps.length} steps)</option>
                        ))}
                      </select>
                      <button className="an-btn an-btn-primary an-btn-sm shrink-0" onClick={enrollLead} disabled={!enrollSeqId || enrollBusy}>
                        {enrollBusy ? 'Enrolling…' : 'Enroll'}
                      </button>
                    </div>
                  ) : (
                    <div style={{ fontSize: 12, color: 'var(--an-text2)' }}>
                      No active sequences yet.{' '}
                      <button className="underline" onClick={() => { setShowSequences(true); }}>Create one</button> to automate follow-ups.
                    </div>
                  )
                )}
              </div>

              {/* Activity log */}
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--an-border)' }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="an-field-label">Activity ({activities.length})</div>
                </div>
                {loadingActivities && <div style={{ color: 'var(--an-text2)', fontSize: 12 }}>Loading…</div>}
                {!loadingActivities && activities.length === 0 && (
                  <div style={{ color: 'var(--an-text2)', fontSize: 12, fontStyle: 'italic' }}>No activity yet. Send an email or log a call to start the timeline.</div>
                )}
                <div className="space-y-3">
                  {activities.map(act => {
                    let meta: any = null;
                    try { if (act.metadata) meta = JSON.parse(act.metadata); } catch { /* ignore */ }
                    return (
                      <div key={act.id} style={{ display: 'flex', gap: 10, fontSize: 13 }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--an-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'var(--an-text2)' }}>
                          {activityIcon(act.type)}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span style={{ fontWeight: 600 }}>{act.user.firstName}</span>
                            <span style={{ color: 'var(--an-text2)', textTransform: 'capitalize' }}>{act.type.replace('_', ' ')}</span>
                            {meta?.subject && <span style={{ color: 'var(--an-text2)' }}>— "{meta.subject}"</span>}
                            <span style={{ color: 'var(--an-text2)', fontSize: 11, marginLeft: 'auto' }}>{rel(act.createdAt)}</span>
                          </div>
                          <div style={{ color: 'var(--an-text2)', marginTop: 2, whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{act.content}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
