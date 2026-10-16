import React, { useCallback, useEffect, useState } from 'react';
import { Shield, RefreshCw } from 'lucide-react';
import { adminFetch } from '../utils/api';

interface AdminUser { id: string; role: string; }

const ROLE_DEFS: { key: string; label: string; badge: string; summary: string; can: string[] }[] = [
  { key: 'admin', label: 'Administrator', badge: 'an-badge-red', summary: 'Full access to everything, including users and settings.',
    can: ['Manage all content', 'Manage users & roles', 'Manage settings & permalinks', 'Delete any content'] },
  { key: 'manager', label: 'Manager', badge: 'an-badge-blue', summary: 'Runs operations, finance, and content — no user administration.',
    can: ['Manage all content', 'Manage finance & operations', 'Publish posts & pages'] },
  { key: 'editor', label: 'Editor', badge: 'an-badge-green', summary: 'Publishes and manages all blog posts and pages.',
    can: ['Create, edit & publish any post', 'Manage categories & tags', 'Manage media library'] },
  { key: 'author', label: 'Author', badge: 'an-badge-purple', summary: 'Writes and publishes their own posts.',
    can: ['Create & publish own posts', 'Upload media', 'Cannot edit others’ posts'] },
  { key: 'contributor', label: 'Contributor', badge: 'an-badge-gray', summary: 'Writes drafts for review; cannot publish.',
    can: ['Create & edit own drafts', 'Cannot publish', 'Cannot upload media'] },
  { key: 'accountant', label: 'Accountant', badge: 'an-badge-yellow', summary: 'Finance-only access.',
    can: ['View & manage invoices, payouts', 'No content access'] },
];

export const RolesPage: React.FC = () => {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminFetch<{ data: { users: AdminUser[] } }>('/users');
      const c: Record<string, number> = {};
      (data.data?.users || []).forEach((u) => { c[u.role] = (c[u.role] || 0) + 1; });
      setCounts(c);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-5">
      <div className="an-page-header">
        <div className="an-page-title">
          <span className="ph-icon"><Shield size={16} strokeWidth={2.5} /></span>
          Roles &amp; Capabilities
        </div>
        <div className="an-page-desc">What each role can do. Assign roles when inviting or editing users in Staff Users.</div>
        <div className="an-page-actions">
          <button onClick={load} className="an-btn an-btn-ghost an-btn-sm"><RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ROLE_DEFS.map((r) => (
          <div key={r.key} className="an-card p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className={`an-badge ${r.badge} uppercase`}>{r.label}</span>
              </div>
              <span className="text-[12px] text-[var(--an-text2)]">{counts[r.key] || 0} {(counts[r.key] || 0) === 1 ? 'user' : 'users'}</span>
            </div>
            <p className="text-[13px] text-[var(--an-text2)] mb-3">{r.summary}</p>
            <ul className="space-y-1">
              {r.can.map((c, i) => (
                <li key={i} className="text-[12px] text-[var(--an-text)] flex items-start gap-2">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-black/30" />{c}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RolesPage;
