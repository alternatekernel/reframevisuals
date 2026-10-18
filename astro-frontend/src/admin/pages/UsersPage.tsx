import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Mail, Pencil, Plus, RefreshCw, Search, Trash2, UserCheck, UserX, Users } from 'lucide-react';
import { adminFetch } from '../utils/api';
import { Modal } from '../components/Modal';
import { FormInput } from '../components/FormInput';
import { useToast } from '../ToastContext';

interface AdminUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  active: boolean;
  pendingInvite?: boolean;
  createdAt: string;
  updatedAt: string;
}

const ROLES = ['admin', 'manager', 'accountant', 'editor', 'author', 'contributor'] as const;

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-black text-white',
  manager: 'bg-blue-600 text-white',
  accountant: 'bg-amber-500 text-white',
  editor: 'bg-emerald-600 text-white',
  author: 'bg-purple-600 text-white',
  contributor: 'bg-slate-500 text-white',
};

const RoleBadge: React.FC<{ role: string }> = ({ role }) => (
  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wide ${ROLE_COLORS[role] ?? 'bg-gray-100 text-gray-600'}`}>
    {role}
  </span>
);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const selectClass = 'h-9 rounded-lg border border-[var(--an-border)] px-3 text-[13px] outline-none focus:border-black/40 bg-[var(--an-bg)]';

const formatDate = (iso: string) => {
  const d = new Date(iso);
  const diff = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return `${diff}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const SelectField: React.FC<{ label: string; value: string; onChange: (v: string) => void; options: string[] }> = ({ label, value, onChange, options }) => (
  <label className="block">
    <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-[#777]">{label}</span>
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full rounded-lg border border-[var(--an-border)] px-3 py-2 text-[13px] outline-none focus:border-black/40 focus:ring-1 focus:ring-black/5 bg-white"
    >
      {options.map(o => <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>)}
    </select>
  </label>
);

export const UsersPage: React.FC = () => {
  const { showToast } = useToast();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showInvite, setShowInvite] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [invite, setInvite] = useState({ firstName: '', lastName: '', email: '', role: 'editor' });
  const [formBusy, setFormBusy] = useState(false);
  const [resetBusyId, setResetBusyId] = useState<string | null>(null);

  const deleteTarget = useMemo(() => users.find(u => u.id === deleteTargetId), [users, deleteTargetId]);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminFetch<{ success: boolean; data: { users: AdminUser[] } }>('/users');
      setUsers(data.data?.users || []);
    } catch (error) {
      showToast('Error', error instanceof Error ? error.message : 'Failed to load users', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { void loadUsers(); }, [loadUsers]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return users.filter(user => {
      const matchesQuery = !needle || [user.firstName, user.lastName, user.email].some(v => String(v || '').toLowerCase().includes(needle));
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      let matchesStatus = true;
      if (statusFilter === 'active') matchesStatus = user.active && !user.pendingInvite;
      else if (statusFilter === 'pending') matchesStatus = !!user.pendingInvite;
      else if (statusFilter === 'inactive') matchesStatus = !user.active && !user.pendingInvite;
      return matchesQuery && matchesRole && matchesStatus;
    });
  }, [users, query, roleFilter, statusFilter]);

  const metrics = useMemo(() => ({
    total: users.length,
    active: users.filter(u => u.active).length,
    admins: users.filter(u => u.role === 'admin').length,
    editors: users.filter(u => u.role === 'editor').length,
  }), [users]);

  const saveInvite = async () => {
    const { firstName, lastName, email } = invite;
    if (!firstName.trim() || !lastName.trim()) { showToast('Validation', 'First and last name are required', 'error'); return; }
    if (!EMAIL_RE.test(email)) { showToast('Validation', 'Enter a valid email address', 'error'); return; }
    setFormBusy(true);
    try {
      await adminFetch('/users/invite', { method: 'POST', body: JSON.stringify(invite) });
      showToast('Invited', `Invitation sent to ${email}`, 'success');
      setShowInvite(false);
      setInvite({ firstName: '', lastName: '', email: '', role: 'editor' });
      await loadUsers();
    } catch (error) {
      showToast('Error', error instanceof Error ? error.message : 'Failed to invite user', 'error');
    } finally { setFormBusy(false); }
  };

  const saveEdit = async () => {
    if (!editingUser) return;
    if (!editingUser.firstName.trim() || !editingUser.lastName.trim()) { showToast('Validation', 'Name fields cannot be empty', 'error'); return; }
    if (!EMAIL_RE.test(editingUser.email)) { showToast('Validation', 'Enter a valid email address', 'error'); return; }
    setFormBusy(true);
    try {
      await adminFetch(`/users/${editingUser.id}`, { method: 'PUT', body: JSON.stringify(editingUser) });
      showToast('Saved', 'User updated', 'success');
      setEditingUser(null);
      await loadUsers();
    } catch (error) {
      showToast('Error', error instanceof Error ? error.message : 'Failed to update user', 'error');
    } finally { setFormBusy(false); }
  };

  const toggleActive = async (user: AdminUser) => {
    // Optimistic update to avoid full-list reload flicker
    setUsers(prev => prev.map(u => u.id === user.id ? { ...u, active: !u.active } : u));
    try {
      await adminFetch(`/users/${user.id}/deactivate`, { method: 'PATCH' });
      showToast('Updated', user.active ? 'User deactivated' : 'User activated', 'success');
    } catch (error) {
      // Roll back on failure
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, active: user.active } : u));
      showToast('Error', error instanceof Error ? error.message : 'Failed to update status', 'error');
    }
  };

  const sendReset = async (user: AdminUser) => {
    setResetBusyId(user.id);
    try {
      await adminFetch(`/users/${user.id}/reset-password`, { method: 'POST' });
      showToast('Sent', user.pendingInvite ? 'Invite resent' : 'Password reset email sent', 'success');
    } catch (error) {
      showToast('Error', error instanceof Error ? error.message : 'Failed to send email', 'error');
    } finally { setResetBusyId(null); }
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    try {
      await adminFetch(`/users/${deleteTargetId}`, { method: 'DELETE' });
      showToast('Deleted', 'User removed', 'success');
      setDeleteTargetId(null);
      await loadUsers();
    } catch (error) {
      showToast('Error', error instanceof Error ? error.message : 'Failed to delete user', 'error');
    }
  };

  return (
    <div className="space-y-5">
      <div className="an-page-header">
        <div className="an-page-title">
          <span className="ph-icon"><Users size={16} strokeWidth={2.5} /></span>
          Staff Users
        </div>
        <div className="an-page-desc">Manage staff accounts, roles, and access. Portal customers are in the Customers section.</div>
        <div className="an-page-actions">
          <button className="an-btn an-btn-ghost an-btn-sm" onClick={loadUsers}>
            <RefreshCw size={13} /> Refresh
          </button>
          <button className="an-btn an-btn-primary an-btn-sm" onClick={() => setShowInvite(true)}>
            <Plus size={14} /> Invite Staff
          </button>
        </div>
      </div>

      <div className="an-card-flush p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#999] pointer-events-none" />
          <input
            className="w-full h-9 rounded-lg border border-[var(--an-border)] pl-9 pr-3 text-[14px] outline-none transition-[border-color,box-shadow] duration-200 focus:border-black/40 focus:ring-1 focus:ring-black/5"
            placeholder="Search by name or email…"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>
        <select className={selectClass} value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
          <option value="all">All roles</option>
          {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
        </select>
        <select className={selectClass} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="all">All status</option>
          <option value="active">Active</option>
          <option value="pending">Pending invite</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <div className="an-card-flush overflow-hidden">
        {loading ? (
          <div className="divide-y divide-[var(--an-border)]">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-3.5 animate-pulse">
                <div className="w-8 h-8 rounded-full bg-[var(--an-hover)] shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-[var(--an-hover)] rounded w-32" />
                  <div className="h-2.5 bg-[var(--an-hover)] rounded w-48" />
                </div>
                <div className="h-5 bg-[var(--an-hover)] rounded w-16" />
                <div className="h-5 bg-[var(--an-hover)] rounded w-12" />
                <div className="h-7 bg-[var(--an-hover)] rounded w-24" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Users size={28} className="mx-auto mb-3 text-[var(--an-text3)]" />
            <p className="text-[13px] text-[var(--an-text2)]">
              {users.length === 0 ? 'No staff users yet. Invite someone to get started.' : 'No users match your filters.'}
            </p>
          </div>
        ) : (
          <table className="w-full text-[13px]">
            <thead className="border-b border-[var(--an-border)] bg-[var(--an-bg)]">
              <tr>
                <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-[var(--an-text2)]">User</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-[var(--an-text2)]">Role</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-[var(--an-text2)]">Status</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-[var(--an-text2)]">Joined</th>
                <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-[var(--an-text2)] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--an-border)]">
              {filtered.map(user => (
                <tr key={user.id} className="hover:bg-[var(--an-hover)] transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-[12px] font-semibold shrink-0">
                        {(user.firstName?.[0] || user.email[0]).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-[var(--an-text)]">{user.firstName} {user.lastName}</div>
                        <div className="text-[12px] text-[var(--an-text2)]">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5"><RoleBadge role={user.role} /></td>
                  <td className="px-4 py-3.5">
                    {user.pendingInvite ? (
                      <span className="an-badge an-badge-yellow">Pending invite</span>
                    ) : user.active ? (
                      <span className="an-badge an-badge-green">Active</span>
                    ) : (
                      <span className="an-badge an-badge-gray">Inactive</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-[var(--an-text2)]">
                    {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1">
                      <button className="an-btn an-btn-ghost an-btn-sm" onClick={() => setEditingUser(user)} title="Edit user">
                        <Pencil size={13} />
                      </button>
                      <button
                        className="an-btn an-btn-ghost an-btn-sm"
                        onClick={() => sendReset(user)}
                        disabled={resetBusyId === user.id}
                        title={user.pendingInvite ? 'Resend invite' : 'Send password reset'}
                      >
                        <Mail size={13} />
                      </button>
                      <button
                        className="an-btn an-btn-ghost an-btn-sm"
                        onClick={() => toggleActive(user)}
                        title={user.active ? 'Deactivate' : 'Activate'}
                      >
                        {user.active ? <UserX size={13} /> : <UserCheck size={13} />}
                      </button>
                      <button
                        className="an-btn an-btn-ghost an-btn-sm text-red-500 hover:bg-red-50"
                        onClick={() => setDeleteTargetId(user.id)}
                        title="Delete user"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showInvite && (
        <Modal
          isOpen
          onClose={() => setShowInvite(false)}
          title="Invite Staff Member"
          footer={
            <div className="flex justify-end gap-2">
              <button className="an-btn an-btn-ghost an-btn-sm" onClick={() => setShowInvite(false)}>Cancel</button>
              <button className="an-btn an-btn-primary an-btn-sm" onClick={saveInvite} disabled={formBusy}>
                {formBusy ? 'Sending…' : 'Send invite'}
              </button>
            </div>
          }
        >
          <div>
            <FormInput label="First name" value={invite.firstName} onChange={v => setInvite(x => ({ ...x, firstName: v }))} placeholder="Jane" />
            <FormInput label="Last name" value={invite.lastName} onChange={v => setInvite(x => ({ ...x, lastName: v }))} placeholder="Smith" />
            <FormInput label="Email" type="email" value={invite.email} onChange={v => setInvite(x => ({ ...x, email: v }))} placeholder="jane@company.com" />
            <div className="mb-3">
              <label className="block text-[13px] font-medium text-[var(--an-text)] mb-1.5">Role</label>
              <select className={`w-full ${selectClass}`} value={invite.role} onChange={e => setInvite(x => ({ ...x, role: e.target.value }))}>
                {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
              </select>
            </div>
          </div>
        </Modal>
      )}

      {editingUser && (
        <Modal
          isOpen
          onClose={() => setEditingUser(null)}
          title="Edit User"
          footer={
            <div className="flex justify-end gap-2">
              <button className="an-btn an-btn-ghost an-btn-sm" onClick={() => setEditingUser(null)}>Cancel</button>
              <button className="an-btn an-btn-primary an-btn-sm" onClick={saveEdit} disabled={formBusy}>
                {formBusy ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          }
        >
          <div>
            <FormInput label="First name" value={editingUser.firstName} onChange={v => setEditingUser(u => u ? { ...u, firstName: v } : u)} />
            <FormInput label="Last name" value={editingUser.lastName} onChange={v => setEditingUser(u => u ? { ...u, lastName: v } : u)} />
            <FormInput label="Email" value={editingUser.email} onChange={v => setEditingUser(u => u ? { ...u, email: v } : u)} />
            <div className="mb-3">
              <label className="block text-[13px] font-medium text-[var(--an-text)] mb-1.5">Role</label>
              <select className={`w-full ${selectClass}`} value={editingUser.role} onChange={e => setEditingUser(u => u ? { ...u, role: e.target.value } : u)}>
                {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
              </select>
            </div>
          </div>
        </Modal>
      )}

      {deleteTargetId && (
        <Modal
          isOpen
          onClose={() => setDeleteTargetId(null)}
          title="Delete User"
          footer={
            <div className="flex justify-end gap-2">
              <button className="an-btn an-btn-ghost an-btn-sm" onClick={() => setDeleteTargetId(null)}>Cancel</button>
              <button className="an-btn an-btn-sm bg-red-600 text-white hover:bg-red-700" onClick={confirmDelete}>
                Delete {deleteTarget ? `${deleteTarget.firstName} ${deleteTarget.lastName}` : 'user'}
              </button>
            </div>
          }
        >
          <p className="text-[13px] text-[var(--an-text2)]">
            This permanently removes <strong className="text-[var(--an-text)]">{deleteTarget?.firstName} {deleteTarget?.lastName}</strong> ({deleteTarget?.email}) and cannot be undone. Any content or audit entries linked to this account will also be affected.
          </p>
          <p className="mt-2 text-[12px] text-[var(--an-text3)]">If you only need to prevent access, consider deactivating the account instead.</p>
        </Modal>
      )}
    </div>
  );
};

export default UsersPage;
