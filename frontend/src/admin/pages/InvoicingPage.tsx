import React, { useEffect, useMemo, useState } from 'react';
import { CreditCard, Download, Search, Filter, ArrowRight, CheckCircle2, AlertCircle, FileText, Zap, DollarSign, RefreshCw } from 'lucide-react';
import { SectionHeader } from '../components/SectionHeader';
import { cx } from '../../utils/theme';
import { adminFetch } from '../utils/api';

interface Invoice {
  id: string;
  code: string;
  customer: string;
  amount: number;
  status: string;
  issued: string;
  due: string;
  paid?: string | null;
}

interface InvoiceMetrics {
  totalOutstanding: number;
  overdue: number;
  paidThisMonth: number;
  avgPaymentTime: string;
}

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const normalizeStatus = (status: string) => status.toLowerCase();

export const InvoicingPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [metrics, setMetrics] = useState<InvoiceMetrics>({ totalOutstanding: 0, overdue: 0, paidThisMonth: 0, avgPaymentTime: 'N/A' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadInvoices = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminFetch<{ invoices: Invoice[]; metrics: InvoiceMetrics }>('/finance/invoices');
      setInvoices(data.invoices || []);
      setMetrics(data.metrics || { totalOutstanding: 0, overdue: 0, paidThisMonth: 0, avgPaymentTime: 'N/A' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  const filteredInvoices = useMemo(() => {
    const needle = searchQuery.trim().toLowerCase();
    if (!needle) return invoices;
    return invoices.filter((invoice) =>
      [invoice.code, invoice.customer, invoice.status, invoice.issued, invoice.due]
        .some((value) => String(value || '').toLowerCase().includes(needle))
    );
  }, [invoices, searchQuery]);

  const paymentVelocity = invoices.length
    ? Math.round((invoices.filter((invoice) => normalizeStatus(invoice.status) === 'paid').length / invoices.length) * 100)
    : 0;

  const exportCsv = () => {
    const rows = [
      ['Code', 'Customer', 'Amount', 'Status', 'Issued', 'Due', 'Paid'],
      ...filteredInvoices.map((invoice) => [invoice.code, invoice.customer, invoice.amount, invoice.status, invoice.issued, invoice.due, invoice.paid || ''])
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `reframe-invoices-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getStatusStyles = (statusValue: string) => {
    const status = normalizeStatus(statusValue);
    switch (status) {
      case 'paid': return 'bg-[var(--admin-green-dim)] text-[var(--admin-green)] border-[var(--admin-green)]/20 shadow-[0_0_10px_rgba(34,197,94,0.1)]';
      case 'pending':
      case 'unpaid': return 'bg-[var(--admin-blue-dim)] text-[var(--admin-blue)] border-[var(--admin-blue)]/20';
      case 'overdue': return 'bg-[var(--admin-red-dim)] text-[var(--admin-red)] border-[var(--admin-red)]/20 shadow-[0_0_10px_rgba(239,68,68,0.1)]';
      default: return 'bg-[var(--admin-surface-3)] text-[var(--admin-text-3)]';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <SectionHeader
        title="Invoicing"
        description="Track invoices, outstanding balances, and payment history."
        parentPage="Finance / Invoicing"
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Paid This Month', value: currency.format(metrics.paidThisMonth), icon: DollarSign, sub: 'Revenue collected' },
          { label: 'Outstanding', value: currency.format(metrics.totalOutstanding), icon: CreditCard, sub: 'Pending settlement' },
          { label: 'Overdue', value: currency.format(metrics.overdue), icon: AlertCircle, sub: 'Needs follow-up' },
          { label: 'Payment Rate', value: `${paymentVelocity}%`, icon: Zap, sub: `Avg ${metrics.avgPaymentTime}` },
        ].map((m, i) => (
          <div key={i} className="bg-[var(--admin-surface)] border border-[var(--admin-border)] rounded-3xl p-6 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><m.icon size={48} className="text-white" /></div>
            <div className="text-[10px] font-black text-[var(--admin-text-3)] uppercase tracking-[0.2em] mb-2">{m.label}</div>
            <div className="text-[32px] font-[var(--admin-font-display)] font-black text-[var(--admin-text)] tracking-tighter mb-1">{m.value}</div>
            <div className="text-[11px] font-medium text-[var(--admin-text-3)]">{m.sub}</div>
          </div>
        ))}
      </div>

      {error && <div className="rounded-2xl border border-[var(--admin-red)]/20 bg-[var(--admin-red-dim)] px-5 py-4 text-[13px] font-bold text-[var(--admin-red)]">{error}</div>}

      <div className="bg-[var(--admin-surface)] border border-[var(--admin-border)] rounded-[2.5rem] overflow-hidden shadow-2xl">
        <div className="px-8 py-6 border-b border-[var(--admin-border)] bg-[var(--admin-surface-2)]/50 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <h3 className="text-[16px] font-black text-[var(--admin-text)] uppercase tracking-tight flex items-center gap-3"><FileText size={20} className="text-[var(--admin-accent)]" /> Ledger Dispatch</h3>
            <div className="relative group">
              <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--admin-text-3)] group-focus-within:text-[var(--admin-accent)] transition-colors" />
              <input 
                type="text" 
                placeholder="Search ledger..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 pr-4 py-2 bg-[var(--admin-surface-3)] border border-[var(--admin-border)] rounded-xl text-[13px] font-bold text-[var(--admin-text)] focus:outline-none focus:border-[var(--admin-accent)]/50 focus:ring-1 focus:ring-[var(--admin-accent)]/20 transition-all w-64"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-[var(--admin-surface-3)] border border-[var(--admin-border)] rounded-xl text-[13px] font-bold text-[var(--admin-text-2)] hover:text-[var(--admin-text)] transition-colors"><Filter size={14} /> Matrix Filter</button>
            <button onClick={loadInvoices} className="flex items-center gap-2 px-4 py-2 bg-[var(--admin-surface-3)] border border-[var(--admin-border)] rounded-xl text-[13px] font-bold text-[var(--admin-text-2)] hover:text-[var(--admin-accent)] transition-colors"><RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Sync</button>
            <button onClick={exportCsv} className="flex items-center gap-2 px-5 py-2 bg-[var(--admin-accent)] text-black rounded-xl text-[13px] font-black hover:bg-[var(--admin-accent)]/90 transition-all shadow-[0_0_20px_rgba(255,191,0,0.2)]"><Download size={14} /> EXPORT CSV</button>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 flex items-center justify-center gap-2 text-[var(--admin-text-3)]"><RefreshCw className="animate-spin" size={18} /> Loading invoices...</div>
          ) : filteredInvoices.length === 0 ? (
            <div className="p-12 text-center text-[var(--admin-text-3)]">No invoices found.</div>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[var(--admin-surface-2)]/30 border-b border-[var(--admin-border)]">
                  <th className="px-8 py-4 text-left text-[11px] font-black text-[var(--admin-text-3)] uppercase tracking-[0.1em]">Customer</th>
                  <th className="px-8 py-4 text-left text-[11px] font-black text-[var(--admin-text-3)] uppercase tracking-[0.1em]">Type</th>
                  <th className="px-8 py-4 text-left text-[11px] font-black text-[var(--admin-text-3)] uppercase tracking-[0.1em]">Amount</th>
                  <th className="px-8 py-4 text-left text-[11px] font-black text-[var(--admin-text-3)] uppercase tracking-[0.1em]">Status</th>
                  <th className="px-8 py-4 text-right text-[11px] font-black text-[var(--admin-text-3)] uppercase tracking-[0.1em]">Dates</th>
                  <th className="px-8 py-4 text-right text-[11px] font-black text-[var(--admin-text-3)] uppercase tracking-[0.1em]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--admin-border)]">
                {filteredInvoices.map((inv) => {
                  const status = normalizeStatus(inv.status);
                  return (
                    <tr key={inv.id} className="group hover:bg-[var(--admin-surface-2)]/20 transition-colors">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-[var(--admin-surface-3)] flex items-center justify-center font-bold text-[var(--admin-accent)] border border-[var(--admin-border)] relative overflow-hidden group-hover:border-[var(--admin-accent)]/50 transition-colors"><div className="absolute inset-0 bg-gradient-to-br from-[var(--admin-accent)]/5 to-transparent" />{inv.customer.charAt(0)}</div>
                          <div><div className="text-[14px] font-black text-[var(--admin-text)] tracking-tight group-hover:text-[var(--admin-accent)] transition-colors">{inv.customer}</div><div className="text-[12px] text-[var(--admin-text-3)] font-medium uppercase tracking-widest">{inv.code}</div></div>
                        </div>
                      </td>
                      <td className="px-8 py-5"><div className="text-[13px] font-bold text-[var(--admin-text-2)]">INVOICE</div><div className="text-[10px] font-black text-[var(--admin-text-3)] uppercase tracking-wider">{inv.id}</div></td>
                      <td className="px-8 py-5"><div className="text-[15px] font-[var(--admin-font-mono)] font-bold text-[var(--admin-text)] tracking-tighter">{currency.format(inv.amount)}</div></td>
                      <td className="px-8 py-5"><span className={cx('inline-flex items-center px-3 py-1.5 rounded-lg text-[10px] font-black border uppercase tracking-wider gap-2', getStatusStyles(inv.status))}>{status === 'paid' && <CheckCircle2 size={10} className="fill-current" />}{status === 'overdue' && <AlertCircle size={10} />}{status}</span></td>
                      <td className="px-8 py-5 text-right"><div className="text-[13px] font-bold text-[var(--admin-text)]">DUE: {inv.due}</div><div className="text-[10px] font-black text-[var(--admin-text-3)] uppercase tracking-widest mt-0.5">ISSUED: {inv.issued}</div>{inv.paid && <div className="text-[10px] font-black text-[var(--admin-green)] uppercase tracking-widest mt-0.5">PAID: {inv.paid}</div>}</td>
                      <td className="px-8 py-5 text-right"><div className="flex items-center justify-end gap-2"><button title="Download PDF" className="p-2.5 bg-[var(--admin-surface-3)] border border-[var(--admin-border)] rounded-xl text-[var(--admin-text-3)] hover:text-[var(--admin-accent)] hover:bg-[var(--admin-accent)]/5 hover:border-[var(--admin-accent)]/20 transition-all"><Download size={16} /></button><button title="View Matrix" className="p-2.5 bg-[var(--admin-surface-3)] border border-[var(--admin-border)] rounded-xl text-[var(--admin-text-3)] hover:text-[var(--admin-accent)] hover:bg-[var(--admin-accent)]/5 hover:border-[var(--admin-accent)]/20 transition-all"><ArrowRight size={16} /></button></div></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          <div className="px-8 py-4 bg-[var(--admin-surface-2)]/20 flex items-center justify-between">
            <div className="text-[12px] text-[var(--admin-text-3)] font-medium italic underline decoration-[var(--admin-border)] underline-offset-4">Live data</div>
            <div className="flex items-center gap-2"><span className="text-[11px] font-black text-[var(--admin-text-3)] uppercase tracking-widest">{filteredInvoices.length} invoices</span></div>
          </div>
        </div>
      </div>
    </div>
  );
};
