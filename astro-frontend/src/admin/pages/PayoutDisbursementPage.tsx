import React, { useEffect, useMemo, useState } from 'react';
import { Plus, CheckCircle, Clock, DollarSign, ArrowRight, MoreHorizontal, Wallet, Zap, ShieldCheck, AlertTriangle, RefreshCw } from 'lucide-react';
import { SectionHeader } from '../components/SectionHeader';
import { cx } from '../../utils/theme';
import { adminFetch } from '../utils/api';

interface Batch {
  id: string;
  code: string;
  totalAmount: number;
  paymentCount: number;
  editorCount: number;
  status: string;
  createdAt: string;
  paymentMethod: string;
}

const normalizeStatus = (status: string) => {
  const normalized = status.toLowerCase();
  if (normalized === 'pending') return 'pending_approval';
  if (normalized === 'approved') return 'processing';
  if (normalized === 'paid' || normalized === 'sent') return 'completed';
  return normalized;
};

export const PayoutDisbursementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadBatches = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminFetch<{ batches: Batch[] }>('/payouts/batches');
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

  const visibleBatches = useMemo(() => {
    if (activeTab === 'pending') return batches.filter((batch) => ['pending', 'approved'].includes(batch.status.toLowerCase()));
    return batches.filter((batch) => !['pending', 'approved'].includes(batch.status.toLowerCase()));
  }, [activeTab, batches]);

  const pendingTotal = batches.filter((batch) => batch.status.toLowerCase() === 'pending').reduce((sum, batch) => sum + batch.totalAmount, 0);
  const processingTotal = batches.filter((batch) => batch.status.toLowerCase() === 'approved').reduce((sum, batch) => sum + batch.totalAmount, 0);
  const settledTotal = batches.filter((batch) => ['paid', 'sent', 'completed'].includes(batch.status.toLowerCase())).reduce((sum, batch) => sum + batch.totalAmount, 0);
  const avgYield = batches.length ? Math.round(batches.reduce((sum, batch) => sum + batch.totalAmount, 0) / batches.length) : 0;

  const getStatusStyles = (statusValue: string) => {
    const status = normalizeStatus(statusValue);
    switch (status) {
      case 'completed': return 'bg-[var(--admin-green-dim)] text-[var(--admin-green)] border-[var(--admin-green)]/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]';
      case 'processing': return 'bg-[var(--admin-blue-dim)] text-[var(--admin-blue)] border-[var(--admin-blue)]/20 animate-pulse';
      case 'pending_approval': return 'bg-[var(--admin-accent-dim)] text-[var(--admin-accent)] border-[var(--admin-accent)]/20';
      case 'failed': return 'bg-[var(--admin-red-dim)] text-[var(--admin-red)] border-[var(--admin-red)]/20';
      default: return 'bg-[var(--admin-surface-3)] text-[var(--admin-text-3)]';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-1000">
      <SectionHeader 
        title="Payout Disbursement" 
        description="Unified interface for partner settlements, batch processing, and global remittance."
        parentPage="Executive / Finance"
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Pending Disbursement', value: `$${pendingTotal.toLocaleString()}`, trend: 'ACTIVE_BATCH', icon: <Wallet size={18} />, color: 'var(--admin-accent)' },
          { label: 'Processing Stream', value: `$${processingTotal.toLocaleString()}`, trend: 'IN_TRANSIT', icon: <Zap size={18} />, color: 'var(--admin-blue)' },
          { label: 'Settled (MTD)', value: `$${settledTotal.toLocaleString()}`, trend: 'LIVE', icon: <CheckCircle size={18} />, color: 'var(--admin-green)' },
          { label: 'Avg Unit Yield', value: `$${avgYield.toLocaleString()}`, trend: 'BATCH_AVG', icon: <DollarSign size={18} />, color: 'var(--admin-text-3)' },
        ].map((m, i) => (
          <div key={i} className="bg-[var(--admin-surface)] border border-[var(--admin-border)] rounded-[2rem] p-6 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-5 opacity-5 group-hover:opacity-10 transition-opacity">{m.icon}</div>
            <div className="text-[10px] font-black text-[var(--admin-text-3)] uppercase tracking-[0.2em] mb-2">{m.label}</div>
            <div className="text-[28px] font-[var(--admin-font-display)] font-black text-[var(--admin-text)] tracking-tighter mb-1">{m.value}</div>
            <div className="flex items-center gap-2"><span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-[var(--admin-surface-3)] text-[var(--admin-text-2)] uppercase tracking-widest">{m.trend}</span></div>
          </div>
        ))}
      </div>

      {error && <div className="rounded-2xl border border-[var(--admin-red)]/20 bg-[var(--admin-red-dim)] px-5 py-4 text-[13px] font-bold text-[var(--admin-red)]">{error}</div>}

      <div className="bg-[var(--admin-surface)] border border-[var(--admin-border)] rounded-[2.5rem] overflow-hidden shadow-2xl">
         <div className="px-8 py-6 border-b border-[var(--admin-border)] bg-[var(--admin-surface-2)]/50 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-6">
               <h3 className="text-[18px] font-black text-[var(--admin-text)] uppercase tracking-tight flex items-center gap-3 font-[var(--admin-font-display)]"><Clock size={20} className="text-[var(--admin-accent)]" /> Settlement Batches</h3>
               <div className="flex bg-[var(--admin-surface-3)] border border-[var(--admin-border)] rounded-xl p-1 shadow-inner h-10">
                  {['pending', 'history'].map(t => (
                    <button key={t} onClick={() => setActiveTab(t as any)} className={cx('px-6 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all', activeTab === t ? 'bg-[var(--admin-accent)] text-black shadow-lg' : 'text-[var(--admin-text-3)] hover:text-[var(--admin-text-2)]')}>{t}</button>
                  ))}
               </div>
            </div>
            <div className="flex items-center gap-3">
               <button onClick={loadBatches} className="flex items-center gap-2 px-5 py-2.5 bg-[var(--admin-surface-3)] border border-[var(--admin-border)] text-[var(--admin-text-2)] rounded-xl text-[13px] font-black uppercase tracking-tighter"><RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> SYNC</button>
               <button className="flex items-center gap-2 px-6 py-2.5 bg-[var(--admin-accent)] text-black rounded-xl text-[13px] font-black transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_20px_rgba(232,148,58,0.3)] uppercase tracking-tighter"><Plus size={18} strokeWidth={3} /> NEW_DISBURSEMENT</button>
            </div>
         </div>

         <div className="overflow-x-auto">
           {loading ? (
             <div className="p-12 flex items-center justify-center gap-2 text-[var(--admin-text-3)]"><RefreshCw className="animate-spin" size={18} /> Loading settlement batches...</div>
           ) : visibleBatches.length === 0 ? (
             <div className="p-12 text-center text-[var(--admin-text-3)]">No settlement batches in this view.</div>
           ) : (
             <table className="w-full text-left">
               <thead>
                 <tr className="bg-[var(--admin-surface-2)]/30 border-b border-[var(--admin-border)]">
                   <th className="px-8 py-5 text-[11px] font-black text-[var(--admin-text-3)] uppercase tracking-widest">Batch Reference</th>
                   <th className="px-8 py-5 text-[11px] font-black text-[var(--admin-text-3)] uppercase tracking-widest text-right">Aggregate Mass</th>
                   <th className="px-8 py-5 text-[11px] font-black text-[var(--admin-text-3)] uppercase tracking-widest">Personnel Count</th>
                   <th className="px-8 py-5 text-[11px] font-black text-[var(--admin-text-3)] uppercase tracking-widest">Protocol</th>
                   <th className="px-8 py-5 text-[11px] font-black text-[var(--admin-text-3)] uppercase tracking-widest">Timestamp</th>
                   <th className="px-8 py-5 text-[11px] font-black text-[var(--admin-text-3)] uppercase tracking-widest text-center">Status</th>
                   <th className="px-8 py-5"></th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-[var(--admin-border)] bg-[var(--admin-bg)]/10">
                 {visibleBatches.map(batch => {
                   const status = normalizeStatus(batch.status);
                   return (
                     <tr key={batch.id} className="hover:bg-[var(--admin-surface-2)]/40 transition-colors group">
                       <td className="px-8 py-6"><div className="text-[14px] font-[var(--admin-font-mono)] font-black text-[var(--admin-text)] tracking-tighter uppercase">{batch.code}</div><div className="text-[10px] font-bold text-[var(--admin-text-3)] uppercase tracking-tighter opacity-60">Settlement Code: {batch.id.slice(0, 8)}</div></td>
                       <td className="px-8 py-6 text-right"><div className="text-[16px] font-[var(--admin-font-mono)] font-black text-[var(--admin-text)] tracking-tighter">${batch.totalAmount.toLocaleString()}</div><div className="text-[10px] font-bold text-[var(--admin-text-3)] uppercase tracking-tighter opacity-60">USD Aggregate</div></td>
                       <td className="px-8 py-6"><div className="text-[13px] font-black text-[var(--admin-text-2)] uppercase tracking-tight">{batch.paymentCount} Units</div><div className="text-[10px] font-medium text-[var(--admin-text-3)]">{batch.editorCount} Individual Nodes</div></td>
                       <td className="px-8 py-6"><div className="flex items-center gap-2"><ShieldCheck size={14} className="text-[var(--admin-blue)]" /><span className="text-[12px] font-black text-[var(--admin-text-2)] uppercase tracking-tighter">{batch.paymentMethod}</span></div></td>
                       <td className="px-8 py-6"><div className="text-[12px] font-black text-[var(--admin-text-3)]">{new Date(batch.createdAt).toLocaleDateString()}</div></td>
                       <td className="px-8 py-6 text-center"><span className={cx('text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest border', getStatusStyles(batch.status))}>{status.replace('_', ' ')}</span></td>
                       <td className="px-8 py-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                             {batch.status.toLowerCase() === 'pending' ? (
                               <>
                                  <button onClick={() => approveBatch(batch.id)} disabled={approvingId === batch.id} className="px-4 py-1.5 bg-[var(--admin-green)] text-black text-[11px] font-black rounded-lg uppercase tracking-widest shadow-lg shadow-[var(--admin-green)]/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-60">{approvingId === batch.id ? 'SYNCING' : 'APPROVE'}</button>
                                  <button className="p-2.5 rounded-xl bg-[var(--admin-surface-3)] border border-[var(--admin-border)] text-[var(--admin-text-3)] hover:text-[var(--admin-text)] transition-all"><MoreHorizontal size={16} /></button>
                               </>
                             ) : (
                               <button className="group px-5 py-2 bg-[var(--admin-surface-3)] border border-[var(--admin-border)] text-[var(--admin-text-3)] text-[11px] font-black rounded-xl uppercase tracking-widest hover:text-[var(--admin-text)] transition-all flex items-center gap-2">View Audit <ArrowRight size={14} className="transition-transform duration-300 group-hover:-rotate-45" /></button>
                             )}
                          </div>
                       </td>
                     </tr>
                   );
                 })}
               </tbody>
             </table>
           )}
         </div>

         <div className="px-8 py-5 bg-[var(--admin-surface-2)]/30 border-t border-[var(--admin-border)] flex items-center justify-between">
            <div className="flex items-center gap-4 text-[11px] font-black text-[var(--admin-text-3)] uppercase tracking-[0.2em]"><div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[var(--admin-green)] shadow-[0_0_5px_var(--admin-green)]" /> Settlement Gateway: ONLINE</div><div className="w-px h-3 bg-[var(--admin-border)] mx-2" /><div className="flex items-center gap-2"><AlertTriangle size={14} className="text-[var(--admin-accent)]" /> Security Level: P0_COMPLIANT</div></div>
            <button className="text-[11px] font-black text-[var(--admin-accent)] uppercase tracking-widest hover:underline transition-all">Export Global Audit Fragment (CSV)</button>
         </div>
      </div>
    </div>
  );
};
