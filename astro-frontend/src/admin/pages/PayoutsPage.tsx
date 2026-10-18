import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, CreditCard, RefreshCw, Search, ShieldCheck, Users, Wallet } from 'lucide-react';
import { adminFetch } from '../utils/api';

interface PayoutBatch {
  id: string;
  code: string;
  status: string;
  totalAmount: number;
  paymentCount: number;
  editorCount: number;
  createdAt: string;
  paymentMethod: string;
  scheduledSendAt?: string | null;
}

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

const statusClass = (status: string) => {
  switch (status.toLowerCase()) {
    case 'approved':
      return 'bg-green-50 text-green-700 border-green-100';
    case 'sent':
    case 'paid':
      return 'bg-blue-50 text-blue-700 border-blue-100';
    case 'pending':
      return 'bg-amber-50 text-amber-700 border-amber-100';
    default:
      return 'bg-gray-50 text-gray-700 border-gray-100';
  }
};

export const PayoutsPage: React.FC = () => {
  const [batches, setBatches] = useState<PayoutBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadBatches = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminFetch<{ batches: PayoutBatch[] }>('/payouts/batches');
      setBatches(data.batches || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load payout batches');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBatches();
  }, []);

  const approveBatch = async (id: string) => {
    setApprovingId(id);
    setError(null);
    try {
      await adminFetch(`/payouts/batches/${id}/approve`, { method: 'PATCH' });
      await loadBatches();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve payout batch');
    } finally {
      setApprovingId(null);
    }
  };

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return batches;
    return batches.filter((batch) =>
      [batch.code, batch.status, batch.paymentMethod].some((value) => value?.toLowerCase().includes(needle))
    );
  }, [batches, query]);

  const totalPending = batches
    .filter((batch) => batch.status.toLowerCase() === 'pending')
    .reduce((sum, batch) => sum + batch.totalAmount, 0);
  const approvedCount = batches.filter((batch) => batch.status.toLowerCase() === 'approved').length;
  const editorCount = batches.reduce((sum, batch) => sum + (batch.editorCount || 0), 0);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-bold text-[#2C2C2A]">Payouts</h1>
          <p className="text-[14px] text-[#757575] mt-1">Manage editor payments, approvals, and payout batches</p>
        </div>
        <button
          onClick={loadBatches}
          className="inline-flex items-center gap-2 rounded-lg border border-[#E0E0E0] bg-white px-4 py-2 text-[14px] font-semibold text-[#2C2C2A] hover:bg-[#F7F7F5]"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Pending Amount', value: currency.format(totalPending), icon: Wallet },
          { label: 'Total Batches', value: String(batches.length), icon: CreditCard },
          { label: 'Approved', value: String(approvedCount), icon: ShieldCheck },
          { label: 'Editor Payments', value: String(editorCount), icon: Users },
        ].map((metric) => (
          <div key={metric.label} className="rounded-xl border border-[#E0E0E0] bg-white p-5">
            <div className="flex items-center gap-2 text-[13px] font-semibold text-[#757575]"><metric.icon size={16} /> {metric.label}</div>
            <div className="mt-2 text-[26px] font-bold text-[#2C2C2A]">{metric.value}</div>
          </div>
        ))}
      </div>

      {error && <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-[14px] text-red-700">{error}</div>}

      <div className="rounded-xl border border-[#E0E0E0] bg-white overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E0E0E0] px-5 py-4">
          <div>
            <h2 className="text-[16px] font-semibold text-[#2C2C2A]">Payout batches</h2>
            <p className="text-[13px] text-[#757575]">Approve pending batches after verification checks pass.</p>
          </div>
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9E9E9E]" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search batches..."
              className="w-64 rounded-lg border border-[#E0E0E0] bg-[#F7F7F5] py-2 pl-9 pr-3 text-[14px] outline-none focus:border-[#2C2C2A] focus:ring-1 focus:ring-black/5"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 p-10 text-[#757575]"><RefreshCw className="animate-spin" size={18} /> Loading payouts...</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center">
            <CreditCard size={42} className="mx-auto text-[#9E9E9E] mb-3" />
            <h3 className="text-[16px] font-semibold text-[#2C2C2A]">No payout batches found</h3>
            <p className="text-[14px] text-[#757575] mt-1">Create pending editor payouts first, then batch them for approval.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[#F7F7F5] text-[12px] uppercase tracking-wide text-[#757575]">
                <tr>
                  <th className="px-5 py-3 font-semibold">Batch</th>
                  <th className="px-5 py-3 font-semibold">Amount</th>
                  <th className="px-5 py-3 font-semibold">Payments</th>
                  <th className="px-5 py-3 font-semibold">Method</th>
                  <th className="px-5 py-3 font-semibold">Created</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E0E0E0]">
                {filtered.map((batch) => (
                  <tr key={batch.id} className="hover:bg-[#FAFAF9]">
                    <td className="px-5 py-4 font-mono text-[14px] font-semibold text-[#2C2C2A]">{batch.code}</td>
                    <td className="px-5 py-4 text-[14px] font-semibold text-[#2C2C2A]">{currency.format(batch.totalAmount)}</td>
                    <td className="px-5 py-4 text-[14px] text-[#757575]">{batch.paymentCount} payments · {batch.editorCount} editors</td>
                    <td className="px-5 py-4 text-[14px] text-[#757575]">{batch.paymentMethod}</td>
                    <td className="px-5 py-4 text-[14px] text-[#757575]">{new Date(batch.createdAt).toLocaleDateString()}</td>
                    <td className="px-5 py-4"><span className={`rounded-full border px-2.5 py-1 text-[12px] font-semibold capitalize ${statusClass(batch.status)}`}>{batch.status}</span></td>
                    <td className="px-5 py-4 text-right">
                      {batch.status.toLowerCase() === 'pending' ? (
                        <button
                          onClick={() => approveBatch(batch.id)}
                          disabled={approvingId === batch.id}
                          className="inline-flex items-center gap-2 rounded-lg bg-[#2C2C2A] px-3 py-2 text-[13px] font-semibold text-white disabled:opacity-60"
                        >
                          {approvingId === batch.id ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={14} />} Approve
                        </button>
                      ) : (
                        <span className="text-[13px] text-[#9E9E9E]">Verified</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
