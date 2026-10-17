import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Building2, Check, Copy, CreditCard, Edit3, Globe, KeyRound, Lock, Mail, Monitor, Phone, RefreshCw, Search, ShieldCheck, ShoppingBag, X } from 'lucide-react';
import { adminFetch } from '../utils/api';
import { useToast } from '../ToastContext';

interface SessionEntry {
  id: string;
  message: string;
  createdAt: string;
}

interface Customer {
  id: string;
  tenantId: string;
  customerNumber?: number | null;
  name?: string | null;
  email: string;
  companyName?: string | null;
  industry?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  country?: string | null;
  lastIp?: string | null;
  tier: string;
  monthlyVolume: number;
  creditLimit: number;
  creditBalance: number;
  totalOrders: number;
  totalSpent: number;
  revisionRate: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  lastOrderDate?: string | null;
  orders?: any[];
  quotations?: any[];
  invoices?: any[];
}

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const customerCode = (customer: Customer) => customer.customerNumber ? `CLT${String(customer.customerNumber).padStart(3, '0')}` : customer.tenantId || customer.id.slice(0, 8);
const displayName = (customer?: Customer | null) => customer?.companyName || customer?.name || customer?.email || 'Unnamed customer';

const badgeClass = (status: string) => {
  const normalized = status.toLowerCase();
  if (['active', 'healthy'].includes(normalized)) return 'an-badge-green';
  if (['new', 'trial'].includes(normalized)) return 'an-badge-blue';
  if (['risk', 'overdue', 'paused'].includes(normalized)) return 'an-badge-yellow';
  return 'an-badge-gray';
};

export const CustomersPage: React.FC = () => {
  const navigate = useNavigate();
  const { customerId } = useParams();
  const { showToast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [drawerError, setDrawerError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Customer>>({});
  const [sessions, setSessions] = useState<SessionEntry[]>([]);
  const [resetBusy, setResetBusy] = useState(false);
  const [tempPasswordBusy, setTempPasswordBusy] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState<'all' | 'registered' | 'guest'>('all');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 50;
  const originalEditData = useRef<Partial<Customer>>({});

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminFetch<{ customers: Customer[] }>('/business/customers?limit=500');
      setCustomers(data.customers || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCustomerDetail = useCallback(async (id: string) => {
    setDetailLoading(true);
    setDrawerError(null);
    try {
      const data = await adminFetch<{ customer: Customer; sessions?: SessionEntry[] }>(`/business/customers/${id}`);
      setSelectedCustomer(data.customer);
      setEditData(data.customer);
      originalEditData.current = data.customer;
      setSessions(data.sessions || []);
    } catch (err) {
      setDrawerError(err instanceof Error ? err.message : 'Failed to load customer detail');
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  useEffect(() => {
    if (customerId) loadCustomerDetail(customerId);
  }, [customerId, loadCustomerDetail]);

  // Heuristic: no server-side isGuest flag exists yet. Until one is added to the Customer model,
  // classify by email prefix and missing name. May misclassify edge cases (e.g. guest_smith@co.com).
  const isGuest = (customer: Customer) =>
    /^guest[_-]/i.test(customer.email) || customer.name === 'Guest User' || !customer.name;

  const filteredCustomers = useMemo(() => {
    const needle = query.trim().toLowerCase();
    let list = customers;
    if (tab === 'registered') list = customers.filter((c) => !isGuest(c));
    else if (tab === 'guest') list = customers.filter((c) => isGuest(c));
    if (!needle) return list;
    return list.filter((customer) =>
      [customer.name, customer.companyName, customer.email, customer.industry, customer.tier, customer.status, customerCode(customer)]
        .some((value) => String(value || '').toLowerCase().includes(needle))
    );
  }, [customers, query, tab]);

  const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / PAGE_SIZE));
  const pagedCustomers = filteredCustomers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1); }, [query, tab]);

  const metrics = useMemo(() => {
    const active = customers.filter((customer) => customer.status?.toLowerCase() === 'active').length;
    const revenue = customers.reduce((sum, customer) => sum + Number(customer.totalSpent || 0), 0);
    const orders = customers.reduce((sum, customer) => sum + Number(customer.totalOrders || 0), 0);
    const credits = customers.reduce((sum, customer) => sum + Number(customer.creditBalance || 0), 0);
    return { active, revenue, orders, credits };
  }, [customers]);

  const openCustomer = (id: string) => {
    navigate(`/admin/customers/${id}`);
  };

  const hasUnsavedChanges = () => {
    const orig = originalEditData.current;
    const keys: (keyof Partial<Customer>)[] = ['name', 'companyName', 'industry', 'contactEmail', 'contactPhone', 'country', 'tier', 'status', 'monthlyVolume', 'creditLimit', 'creditBalance'];
    return keys.some(k => String(editData[k] ?? '') !== String(orig[k] ?? ''));
  };

  const closeDetail = () => {
    if (hasUnsavedChanges() && !window.confirm('You have unsaved changes. Discard them?')) return;
    setSelectedCustomer(null);
    setTempPassword(null);
    setDrawerError(null);
    navigate('/admin/customers');
  };

  const saveCustomer = async () => {
    if (!selectedCustomer) return;
    setSaving(true);
    setDrawerError(null);
    try {
      const payload = {
        name: editData.name,
        companyName: editData.companyName,
        industry: editData.industry,
        contactEmail: editData.contactEmail,
        contactPhone: editData.contactPhone,
        country: editData.country || null,
        tier: editData.tier,
        status: editData.status,
        monthlyVolume: Number(editData.monthlyVolume || 0),
        creditLimit: Number(editData.creditLimit || 0),
        creditBalance: Number(editData.creditBalance || 0),
      };
      const data = await adminFetch<{ customer: Customer }>(`/business/customers/${selectedCustomer.id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      setSelectedCustomer(data.customer);
      setEditData(data.customer);
      originalEditData.current = data.customer;
      showToast('Saved', 'Customer updated', 'success');
      await loadCustomers();
    } catch (err) {
      setDrawerError(err instanceof Error ? err.message : 'Failed to save customer');
    } finally {
      setSaving(false);
    }
  };

  const sendPasswordReset = async () => {
    if (!selectedCustomer) return;
    setResetBusy(true);
    try {
      await adminFetch(`/business/customers/${selectedCustomer.id}/reset-password`, { method: 'POST' });
      showToast('Sent', `Reset email sent to ${selectedCustomer.email}`, 'success');
    } catch (err) {
      setDrawerError(err instanceof Error ? err.message : 'Failed to send reset email');
    } finally { setResetBusy(false); }
  };

  const setTempPasswordForCustomer = async () => {
    if (!selectedCustomer) return;
    setTempPasswordBusy(true);
    try {
      const data = await adminFetch<{ success: boolean; data: { tempPassword: string } }>(
        `/business/customers/${selectedCustomer.id}/temp-password`,
        { method: 'POST' }
      );
      setTempPassword(data.data?.tempPassword || null);
      setCopied(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set temporary password');
    } finally { setTempPasswordBusy(false); }
  };

  const copyTempPassword = () => {
    if (!tempPassword) return;
    navigator.clipboard.writeText(tempPassword).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="space-y-5">
      <div className="an-page-header">
        <div className="an-page-title">
          <span className="ph-icon"><Building2 size={16} strokeWidth={2.5} /></span>
          Customers
        </div>
        <div className="an-page-desc">{metrics.active} active clients · {currency.format(metrics.revenue)} lifetime revenue · {metrics.orders} total orders</div>
        <div className="an-page-actions">
          <button onClick={loadCustomers} className="an-btn an-btn-ghost an-btn-sm"><RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh</button>
          <button className="an-btn an-btn-ghost an-btn-sm">Export</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Customers', value: String(customers.length), icon: Building2 },
          { label: 'Active Clients', value: String(metrics.active), icon: ShieldCheck },
          { label: 'Lifetime Revenue', value: currency.format(metrics.revenue), icon: CreditCard },
          { label: 'Credit Balance', value: currency.format(metrics.credits), icon: ShoppingBag },
        ].map((metric) => (
          <div key={metric.label} className="an-card p-4">
            <div className="flex items-center gap-2 text-[12px] font-semibold text-[var(--an-text2)]"><metric.icon size={15} /> {metric.label}</div>
            <div className="mt-2 text-[24px] font-bold text-[var(--an-text)]">{metric.value}</div>
          </div>
        ))}
      </div>

      {error && <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-[13px] text-red-700">{error}</div>}

      <div className="an-card-flush overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--an-border)] px-4 py-3">
          <div className="flex items-center gap-1">
            {([
              { key: 'all', label: 'All', count: customers.length },
              { key: 'registered', label: 'Registered', count: customers.filter((c) => !isGuest(c)).length },
              { key: 'guest', label: 'Guests', count: customers.filter((c) => isGuest(c)).length },
            ] as const).map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors ${tab === key ? 'bg-black text-white' : 'text-[var(--an-text2)] hover:bg-black/5'}`}
              >
                {label} <span className={`ml-1 text-[11px] ${tab === key ? 'text-white/60' : 'text-[#aaa]'}`}>{count}</span>
              </button>
            ))}
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#999]" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search customers..."
              className="w-full sm:w-72 rounded-lg border border-[var(--an-border)] bg-white py-2 pl-9 pr-3 text-[13px] outline-none focus:border-black/40 focus:ring-1 focus:ring-black/5"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-10 text-center text-sm text-[#888]">Loading customers...</div>
        ) : filteredCustomers.length === 0 ? (
          <div className="p-10 text-center text-sm text-[#888]">No customers found.</div>
        ) : (
          <>
          <div className="an-tbl-wrap">
            <table>
              <thead>
                <tr>
                  <th>Client</th><th>Industry</th><th>Country</th><th>Last Order</th><th>Revenue</th><th>Orders</th><th>Status</th><th></th>
                </tr>
              </thead>
              <tbody>
                {pagedCustomers.map((customer) => (
                  <tr key={customer.id} style={{ cursor: 'pointer' }} onClick={() => openCustomer(customer.id)}>
                    <td>
                      <div className="an-td-main">{displayName(customer)}</div>
                      <div className="text-[12px] text-[#777]">{customer.email} · {customerCode(customer)}</div>
                    </td>
                    <td>{customer.industry || 'Uncategorized'}</td>
                    <td>{customer.country || '—'}</td>
                    <td className="text-[12px] text-[#777]">
                      {customer.lastOrderDate ? new Date(customer.lastOrderDate).toLocaleDateString() : '—'}
                    </td>
                    <td>{currency.format(Number(customer.totalSpent || 0))}</td>
                    <td>{customer.totalOrders || 0}</td>
                    <td><span className={`an-badge ${badgeClass(customer.status)}`}>{customer.status}</span></td>
                    <td><button className="an-btn an-btn-ghost an-btn-sm" onClick={(event) => { event.stopPropagation(); openCustomer(customer.id); }}>View</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--an-border)] text-[13px] text-[var(--an-text2)]">
              <span>Showing {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, filteredCustomers.length)} of {filteredCustomers.length}</span>
              <div className="flex items-center gap-1">
                <button className="an-btn an-btn-ghost an-btn-sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>← Prev</button>
                <span className="px-2">{page} / {totalPages}</span>
                <button className="an-btn an-btn-ghost an-btn-sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next →</button>
              </div>
            </div>
          )}
          </>
        )}
      </div>

      {selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-black/30 flex justify-end" onClick={closeDetail}>
          <div className="h-full w-full max-w-2xl overflow-y-auto bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="sticky top-0 z-10 border-b border-[var(--an-border)] bg-white px-5 py-4 flex items-start justify-between gap-4">
              <div>
                <div className="text-[18px] font-bold text-[var(--an-text)]">{displayName(selectedCustomer)}</div>
                <div className="text-[12px] text-[#777]">{customerCode(selectedCustomer)} · {selectedCustomer.email}</div>
              </div>
              <button onClick={closeDetail} className="rounded-full p-2 hover:bg-black/5"><X size={18} /></button>
            </div>

            {detailLoading ? (
              <div className="p-10 text-center text-sm text-[#888]">Loading customer...</div>
            ) : (
              <div className="p-5 space-y-5">
                {drawerError && (
                  <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-[13px] text-red-700">{drawerError}</div>
                )}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: 'Spent', value: currency.format(Number(selectedCustomer.totalSpent || 0)) },
                    { label: 'Orders', value: String(selectedCustomer.totalOrders || 0) },
                    { label: 'Credits', value: `${selectedCustomer.creditBalance}/${selectedCustomer.creditLimit}` },
                    { label: 'Revision', value: `${Number(selectedCustomer.revisionRate || 0)}%` },
                  ].map((metric) => (
                    <div key={metric.label} className="rounded-xl border border-[var(--an-border)] p-3">
                      <div className="text-[11px] uppercase tracking-wide text-[#777]">{metric.label}</div>
                      <div className="mt-1 text-[18px] font-bold">{metric.value}</div>
                    </div>
                  ))}
                </div>

                <div className="rounded-2xl border border-[var(--an-border)] p-4">
                  <div className="mb-4 flex items-center gap-2 font-semibold"><Edit3 size={16} /> Customer Profile</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Field label="Name" value={editData.name || ''} onChange={(value) => setEditData((prev) => ({ ...prev, name: value }))} />
                    <Field label="Company" value={editData.companyName || ''} onChange={(value) => setEditData((prev) => ({ ...prev, companyName: value }))} />
                    <Field label="Industry" value={editData.industry || ''} onChange={(value) => setEditData((prev) => ({ ...prev, industry: value }))} />
                    <Field label="Contact email" value={editData.contactEmail || ''} onChange={(value) => setEditData((prev) => ({ ...prev, contactEmail: value }))} />
                    <Field label="Phone" value={editData.contactPhone || ''} onChange={(value) => setEditData((prev) => ({ ...prev, contactPhone: value }))} />
                    <Field label="Country" value={editData.country || ''} onChange={(value) => setEditData((prev) => ({ ...prev, country: value }))} />
                    <Field label="Tier" value={editData.tier || ''} onChange={(value) => setEditData((prev) => ({ ...prev, tier: value }))} />
                    <Field label="Status" value={editData.status || ''} onChange={(value) => setEditData((prev) => ({ ...prev, status: value }))} />
                    <Field label="Monthly volume" type="number" value={String(editData.monthlyVolume || 0)} onChange={(value) => setEditData((prev) => ({ ...prev, monthlyVolume: Number(value) }))} />
                    <Field label="Credit limit" type="number" value={String(editData.creditLimit || 0)} onChange={(value) => setEditData((prev) => ({ ...prev, creditLimit: Number(value) }))} />
                    <Field label="Credit balance" type="number" value={String(editData.creditBalance || 0)} onChange={(value) => setEditData((prev) => ({ ...prev, creditBalance: Number(value) }))} />
                  </div>
                  <div className="mt-4 flex justify-end">
                    <button onClick={saveCustomer} disabled={saving} className="an-btn an-btn-primary an-btn-sm">{saving ? 'Saving...' : 'Save Customer'}</button>
                  </div>
                </div>

                <div className="rounded-2xl border border-[var(--an-border)] p-4">
                  <div className="mb-4 flex items-center gap-2 font-semibold"><KeyRound size={16} /> Account Access</div>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 rounded-xl bg-black/[0.05] p-3">
                      <Mail size={15} className="mt-0.5 shrink-0 text-[var(--an-text2)]" />
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-medium text-[var(--an-text)]">Send password reset email</div>
                        <div className="text-[12px] text-[var(--an-text2)] mt-0.5">Customer receives a link to set their own password. Valid for 24 hours.</div>
                      </div>
                      <button
                        className="an-btn an-btn-ghost an-btn-sm shrink-0"
                        onClick={sendPasswordReset}
                        disabled={resetBusy}
                      >
                        {resetBusy ? 'Sending…' : 'Send email'}
                      </button>
                    </div>

                    <div className="flex items-start gap-3 rounded-xl bg-black/[0.05] p-3">
                      <Lock size={15} className="mt-0.5 shrink-0 text-[var(--an-text2)]" />
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-medium text-[var(--an-text)]">Set temporary password</div>
                        <div className="text-[12px] text-[var(--an-text2)] mt-0.5">Generate a password you can share verbally or via chat. Customer can change it after logging in.</div>
                        {tempPassword && (
                          <div className="mt-2 flex items-center gap-2">
                            <code className="rounded bg-white border border-[var(--an-border)] px-2 py-1 text-[13px] font-mono text-[var(--an-text)] select-all">
                              {tempPassword}
                            </code>
                            <button
                              className="an-btn an-btn-ghost an-btn-sm"
                              onClick={copyTempPassword}
                              title="Copy to clipboard"
                            >
                              {copied ? <Check size={13} className="text-green-600" /> : <Copy size={13} />}
                            </button>
                          </div>
                        )}
                      </div>
                      <button
                        className="an-btn an-btn-ghost an-btn-sm shrink-0"
                        onClick={setTempPasswordForCustomer}
                        disabled={tempPasswordBusy}
                      >
                        {tempPasswordBusy ? 'Generating…' : tempPassword ? 'Regenerate' : 'Generate'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <RelatedList title="Recent Orders" items={selectedCustomer.orders || []} empty="No recent orders" />
                  <RelatedList title="Recent Quotes" items={selectedCustomer.quotations || []} empty="No recent quotes" />
                  <RelatedList title="Recent Invoices" items={selectedCustomer.invoices || []} empty="No recent invoices" />
                  <div className="rounded-2xl border border-[var(--an-border)] p-4">
                    <div className="mb-3 font-semibold">Contact</div>
                    <div className="space-y-2 text-[13px] text-[#555]">
                      <div className="flex items-center gap-2"><Mail size={14} /> {selectedCustomer.contactEmail || selectedCustomer.email}</div>
                      <div className="flex items-center gap-2"><Phone size={14} /> {selectedCustomer.contactPhone || 'No phone saved'}</div>
                      {selectedCustomer.country && (
                        <div className="flex items-center gap-2"><Globe size={14} /> {selectedCustomer.country}</div>
                      )}
                      {selectedCustomer.lastIp && (
                        <div className="flex items-center gap-2"><Monitor size={14} /> Last IP: <span className="font-mono text-[12px]">{selectedCustomer.lastIp}</span></div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-[var(--an-border)] p-4">
                  <div className="mb-3 flex items-center gap-2 font-semibold"><Monitor size={16} /> Session Log</div>
                  {sessions.length === 0 ? (
                    <div className="text-[13px] text-[#888]">No sessions recorded yet.</div>
                  ) : (
                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                      {sessions.map((session) => {
                        let parsed: { ip?: string; userAgent?: string; action?: string; provider?: string } = {};
                        try { parsed = JSON.parse(session.message); } catch {}
                        const uaShort = parsed.userAgent
                          ? parsed.userAgent.replace(/\s*\([^)]*\)/g, '').trim().slice(0, 60)
                          : 'Unknown device';
                        const actionLabel = parsed.action === 'signup' ? 'Signed up' : 'Logged in';
                        const providerLabel = parsed.provider ? ` via ${parsed.provider}` : '';
                        return (
                          <div key={session.id} className="rounded-lg bg-black/[0.05] px-3 py-2 text-[12px]">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-medium text-[#333]">{actionLabel}{providerLabel}</span>
                              <span className="text-[#999]">{new Date(session.createdAt).toLocaleString()}</span>
                            </div>
                            <div className="mt-0.5 text-[#666] flex items-center gap-2 flex-wrap">
                              {parsed.ip && <span className="font-mono">{parsed.ip}</span>}
                              {parsed.ip && <span className="text-[#ccc]">·</span>}
                              <span className="truncate">{uaShort}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const Field: React.FC<{ label: string; value: string; onChange: (value: string) => void; type?: string }> = ({ label, value, onChange, type = 'text' }) => (
  <label className="block">
    <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-[#777]">{label}</span>
    <input
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="w-full rounded-lg border border-[var(--an-border)] px-3 py-2 text-[13px] outline-none focus:border-black/40 focus:ring-1 focus:ring-black/5"
    />
  </label>
);

const RelatedList: React.FC<{ title: string; items: any[]; empty: string }> = ({ title, items, empty }) => (
  <div className="rounded-2xl border border-[var(--an-border)] p-4">
    <div className="mb-3 font-semibold">{title}</div>
    {items.length === 0 ? (
      <div className="text-[13px] text-[#888]">{empty}</div>
    ) : (
      <div className="space-y-2">
        {items.slice(0, 5).map((item) => (
          <div key={item.id} className="rounded-lg bg-black/[0.05] px-3 py-2 text-[13px]">
            <div className="font-semibold">{item.code || item.title || item.id}</div>
            <div className="text-[12px] text-[#777]">{item.status || item.createdAt ? `${item.status || 'created'} · ${item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ''}` : 'No status'}</div>
          </div>
        ))}
      </div>
    )}
  </div>
);
