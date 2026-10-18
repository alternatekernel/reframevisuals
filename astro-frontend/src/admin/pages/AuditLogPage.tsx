import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, RefreshCw, Search } from 'lucide-react';
import { adminFetch } from '../utils/api';

interface ActivityLog {
  id: string;
  type: string;
  message: string;
  createdAt: string;
  customer?: { id: string; name?: string; companyName?: string; email?: string } | null;
  order?: { id: string; code: string } | null;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

const TYPE_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  status_change:  { bg: 'var(--an-blue-bg)',   text: 'var(--an-blue-text)',   label: 'Status' },
  proposal:       { bg: 'var(--an-purple-bg, var(--an-blue-bg))', text: 'var(--an-text2)', label: 'Proposal' },
  revision:       { bg: 'var(--an-orange-bg)', text: 'var(--an-orange-text)', label: 'Revision' },
  approval:       { bg: 'var(--an-green-bg)',  text: 'var(--an-green-text)',  label: 'Approval' },
  cancellation:   { bg: 'var(--an-red-bg)',    text: 'var(--an-red-text)',    label: 'Cancelled' },
  login:          { bg: 'var(--an-sidebar)',   text: 'var(--an-text2)',       label: 'Login' },
};

const TYPE_OPTIONS = ['status_change', 'proposal', 'revision', 'approval', 'cancellation', 'login'];

const fmt = (iso: string) => new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

const AuditLogPage: React.FC = () => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '30' });
      if (typeFilter) params.set('type', typeFilter);
      if (search) params.set('q', search);
      const data = await adminFetch(`/business/activity?${params}`);
      setLogs(data.logs || []);
      setPagination(data.pagination || null);
    } catch (err) {
      console.error('[AuditLog] fetch failed', err);
    } finally {
      setLoading(false);
    }
  }, [page, typeFilter, search]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  return (
    <div>
      <div className="an-page-header">
        <div className="an-page-title">
          <span className="ph-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
              <rect x="9" y="3" width="6" height="4" rx="1"/>
              <path d="M9 12h6M9 16h4"/>
            </svg>
          </span>
          Audit Log
        </div>
        <div className="an-page-desc">
          {pagination ? `${pagination.total} total events` : 'Activity across all orders and customers'}
        </div>
        <div className="an-page-actions">
          <button className="an-btn an-btn-ghost an-btn-sm" onClick={() => { setPage(1); fetchLogs(); }}>
            <RefreshCw size={13} /> Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="an-card p-4 mb-5 flex flex-wrap items-center gap-3">
        <form onSubmit={handleSearch} className="flex items-center gap-2 flex-1 min-w-[200px]">
          <div className="relative flex-1">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--an-text3)]" />
            <input
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Search messages..."
              className="w-full pl-8 pr-3 py-2 rounded-lg border border-[var(--an-border)] bg-[var(--an-surface)] text-[13px] text-[var(--an-text)] outline-none focus:border-[var(--an-blue-text)]"
            />
          </div>
          <button type="submit" className="an-btn an-btn-primary an-btn-sm">Search</button>
          {(search || typeFilter) && (
            <button type="button" className="an-btn an-btn-ghost an-btn-sm" onClick={() => { setSearch(''); setSearchInput(''); setTypeFilter(''); setPage(1); }}>
              Clear
            </button>
          )}
        </form>
        <select
          value={typeFilter}
          onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-lg border border-[var(--an-border)] bg-[var(--an-surface)] text-[13px] text-[var(--an-text)] outline-none"
        >
          <option value="">All event types</option>
          {TYPE_OPTIONS.map(t => <option key={t} value={t}>{TYPE_COLORS[t]?.label || t}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="an-card overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-[13px] text-[var(--an-text3)]">Loading...</div>
        ) : logs.length === 0 ? (
          <div className="p-10 text-center text-[13px] text-[var(--an-text3)]">No activity found.</div>
        ) : (
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-[var(--an-border)]">
                <th className="px-4 py-3 text-left font-semibold text-[var(--an-text2)] text-[11px] uppercase tracking-wide">Time</th>
                <th className="px-4 py-3 text-left font-semibold text-[var(--an-text2)] text-[11px] uppercase tracking-wide">Type</th>
                <th className="px-4 py-3 text-left font-semibold text-[var(--an-text2)] text-[11px] uppercase tracking-wide">Event</th>
                <th className="px-4 py-3 text-left font-semibold text-[var(--an-text2)] text-[11px] uppercase tracking-wide">Customer</th>
                <th className="px-4 py-3 text-left font-semibold text-[var(--an-text2)] text-[11px] uppercase tracking-wide">Order</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--an-border)]">
              {logs.map(log => {
                const cfg = TYPE_COLORS[log.type] || { bg: 'var(--an-sidebar)', text: 'var(--an-text2)', label: log.type };
                return (
                  <tr key={log.id} className="hover:bg-[var(--an-hover)] transition-colors">
                    <td className="px-4 py-3 text-[var(--an-text3)] whitespace-nowrap font-mono text-[11px]">{fmt(log.createdAt)}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: cfg.bg, color: cfg.text }}>
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[var(--an-text)] max-w-sm">
                      <span className="line-clamp-2">{log.message}</span>
                    </td>
                    <td className="px-4 py-3">
                      {log.customer ? (
                        <button
                          onClick={() => navigate(`/admin/customers/${log.customer!.id}`)}
                          className="text-[var(--an-blue-text)] hover:underline text-left"
                        >
                          {log.customer.companyName || log.customer.name || log.customer.email || '—'}
                        </button>
                      ) : <span className="text-[var(--an-text3)]">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      {log.order ? (
                        <button
                          onClick={() => navigate(`/admin/production/${log.order!.id}`)}
                          className="flex items-center gap-1 text-[var(--an-blue-text)] hover:underline font-mono text-[11px]"
                        >
                          {log.order.code} <ArrowRight size={10} />
                        </button>
                      ) : <span className="text-[var(--an-text3)]">—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-between mt-4 text-[13px]">
          <span className="text-[var(--an-text3)]">
            Page {pagination.page} of {pagination.pages} · {pagination.total} events
          </span>
          <div className="flex gap-2">
            <button className="an-btn an-btn-ghost an-btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</button>
            <button className="an-btn an-btn-ghost an-btn-sm" disabled={page >= pagination.pages} onClick={() => setPage(p => p + 1)}>Next</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogPage;
