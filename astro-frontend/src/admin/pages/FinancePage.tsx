import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, BarChart3, DollarSign, PieChart, RefreshCw, TrendingUp } from 'lucide-react';
import { cx } from '../../utils/theme';
import { adminFetch } from '../utils/api';

interface FinanceDashboard {
  metrics: {
    revenue: number;
    cogs: number;
    grossMargin: number;
    grossMarginPercent: number;
    netProfit: number;
    burnRate: number;
  };
  trends: Array<{ month: string; revenue: number; profit: number }>;
}

interface Invoice {
  id: string;
  code: string;
  customer: string;
  amount: number;
  status: string;
  due: string;
}

interface PayoutBatch {
  id: string;
  code: string;
  totalAmount: number;
  status: string;
}

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export const FinancePage: React.FC = () => {
  const nav = useNavigate();
  const [financeData, setFinanceData] = useState<FinanceDashboard | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payouts, setPayouts] = useState<PayoutBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFinance = async () => {
    setLoading(true);
    setError(null);
    try {
      const [dashboard, invoiceData, payoutData] = await Promise.all([
        adminFetch<FinanceDashboard>('/finance/dashboard'),
        adminFetch<{ invoices: Invoice[] }>('/finance/invoices'),
        adminFetch<{ batches: PayoutBatch[] }>('/payouts/batches'),
      ]);
      setFinanceData(dashboard);
      setInvoices(invoiceData.invoices || []);
      setPayouts(payoutData.batches || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load finance data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFinance();
  }, []);

  const pendingPayouts = useMemo(() =>
    payouts.filter((batch) => batch.status.toLowerCase() === 'pending').reduce((sum, batch) => sum + batch.totalAmount, 0),
  [payouts]);

  const metrics = financeData?.metrics || { revenue: 0, cogs: 0, grossMargin: 0, grossMarginPercent: 0, netProfit: 0, burnRate: 0 };
  const displayMetrics = [
    { icon: <DollarSign size={20} />, label: 'Total Revenue', value: currency.format(metrics.revenue), trend: 'LIVE', color: 'var(--admin-accent)' },
    { icon: <TrendingUp size={20} />, label: 'Cost of Goods', value: currency.format(metrics.cogs), trend: 'COGS', color: 'var(--admin-purple)' },
    { icon: <Activity size={20} />, label: 'Gross Margin', value: `${metrics.grossMarginPercent}%`, trend: currency.format(metrics.grossMargin), color: 'var(--admin-green)' },
    { icon: <BarChart3 size={20} />, label: 'Net Profit', value: currency.format(metrics.netProfit), trend: 'EST', color: 'var(--admin-blue)' },
  ];

  if (loading) {
    return <div className="h-full flex items-center justify-center bg-[var(--admin-bg)]"><RefreshCw className="animate-spin text-[var(--admin-accent)]" /></div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-1000">
      <div className="an-page-header">
        <div className="an-page-title">
          <span className="ph-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="2" y="2" width="20" height="20" rx="2"/><path d="M12 6v12M6 12h12"/></svg></span>
          Finance
        </div>
        <div className="an-page-desc">P&L overview · {invoices.length} invoices · {payouts.length} payout batches</div>
        <div className="an-page-actions">
          <button className="an-btn an-btn-ghost an-btn-sm" onClick={loadFinance}><RefreshCw size={14} /> Sync</button>
          <button className="an-btn an-btn-ghost an-btn-sm" onClick={() => nav('/admin/reports')}>Export Report</button>
          <button className="an-btn an-btn-primary an-btn-sm" onClick={() => nav('/admin/invoicing')}>View Invoices</button>
        </div>
      </div>

      {error && <div className="rounded-2xl border border-[var(--admin-red)]/20 bg-[var(--admin-red-dim)] px-5 py-4 text-[13px] font-bold text-[var(--admin-red)]">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {displayMetrics.map((m, i) => (
          <div key={i} className="bg-[var(--admin-surface)] border border-[var(--admin-border)] rounded-[2rem] p-8 shadow-2xl shadow-black/40 group hover:border-[var(--admin-accent)]/30 transition-all relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity translate-x-4 -translate-y-4 text-[var(--admin-text)]">{m.icon}</div>
            <div className="flex items-center justify-between mb-6 relative">
               <div className="p-3.5 rounded-2xl bg-[var(--admin-surface-2)] border border-[var(--admin-border)] shadow-xl shadow-black/20" style={{ color: m.color }}>{React.cloneElement(m.icon as any, { size: 24 })}</div>
               <span className="text-[10px] font-black px-2.5 py-1 rounded-full border tracking-widest uppercase bg-[var(--admin-green-dim)] text-[var(--admin-green)] border-[var(--admin-green)]/20">{m.trend}</span>
            </div>
            <div className="text-[11px] font-black text-[var(--admin-text-3)] uppercase tracking-[0.2em] mb-2 opacity-60">{m.label}</div>
            <div className="text-[32px] font-[var(--admin-font-display)] font-black text-[var(--admin-text)] tracking-tighter leading-none">{m.value}</div>
            <div className="mt-8 w-full h-1.5 bg-black/40 rounded-full overflow-hidden border border-[var(--admin-border)]"><div className="h-full bg-current rounded-full transition-all duration-1000 ease-out" style={{ width: '70%', color: m.color }} /></div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-[var(--admin-surface)] border border-[var(--admin-border)] rounded-[3rem] overflow-hidden shadow-2xl group">
          <div className="px-8 py-6 border-b border-[var(--admin-border)] bg-[var(--admin-surface-2)]/50 flex flex-wrap items-center justify-between gap-4">
            <h3 className="text-[20px] font-black text-[var(--admin-text)] uppercase tracking-tight flex items-center gap-3"><PieChart size={24} className="text-[var(--admin-accent)]" /> Outstanding Invoices</h3>
            <button className="an-btn an-btn-ghost an-btn-sm" onClick={() => nav('/admin/invoicing')}>View All</button>
          </div>
          <div className="p-10 space-y-6">
            {invoices.slice(0, 4).map((invoice) => (
              <div key={invoice.id} className="flex justify-between items-center pb-4 border-b border-[var(--admin-border)] last:border-0">
                <div><div className="text-[13px] font-bold text-[var(--admin-text)]">{invoice.customer}</div><div className="text-[11px] text-[var(--admin-text-3)]">Due: {invoice.due}</div></div>
                <div className="text-right"><div className="text-[16px] font-bold text-[var(--admin-text)]">{currency.format(invoice.amount || 0)}</div><span className={`an-badge ${invoice.status === 'paid' ? 'an-badge-green' : invoice.status === 'overdue' ? 'an-badge-red' : 'an-badge-yellow'}`}>{invoice.status}</span></div>
              </div>
            ))}
            {invoices.length === 0 && <div className="text-center py-8 text-[var(--admin-text-3)]">No invoices found</div>}
          </div>
        </div>

        <div className="bg-[var(--admin-surface)] border border-[var(--admin-border)] rounded-[3rem] overflow-hidden shadow-2xl flex flex-col justify-between group">
          <div className="px-8 py-6 border-b border-[var(--admin-border)] bg-[var(--admin-surface-2)]/50">
            <h3 className="text-[20px] font-black text-[var(--admin-text)] uppercase tracking-tight flex items-center gap-3"><Activity size={24} className="text-[var(--admin-purple)]" /> Pending Payouts</h3>
          </div>
          <div className="p-10">
            <div className="mb-8"><div className="text-[11px] font-black text-[var(--admin-text-3)] uppercase tracking-[0.3em] mb-4 opacity-60">Total Pending</div><div className="text-[48px] font-[var(--admin-font-display)] font-black text-[var(--admin-text)] tracking-tighter leading-none">{currency.format(pendingPayouts)}</div></div>
            <div className="space-y-3">
              {payouts.slice(0, 3).map((batch) => (
                <div key={batch.id} className="p-4 rounded-[1.5rem] border border-[var(--admin-border)] bg-[var(--admin-surface-2)] flex justify-between items-center"><span className="text-[13px] font-bold text-[var(--admin-text-3)]">{batch.code}</span><span className="text-[16px] font-bold text-[var(--admin-text)]">{currency.format(batch.totalAmount)}</span></div>
              ))}
              {payouts.length === 0 && <div className="p-4 rounded-[1.5rem] border border-[var(--admin-border)] bg-[var(--admin-surface-2)] text-[13px] text-[var(--admin-text-3)]">No payout batches found</div>}
            </div>
            <button className="mt-8 w-full py-4 bg-[var(--admin-surface-3)] border border-[var(--admin-border)] rounded-2xl text-[13px] font-black text-[var(--admin-text)] hover:bg-[var(--admin-accent)] hover:text-black hover:border-transparent tracking-[0.2em] uppercase transition-all shadow-xl" onClick={() => nav('/admin/payouts')}>Review & Approve</button>
          </div>
        </div>
      </div>
    </div>
  );
};
