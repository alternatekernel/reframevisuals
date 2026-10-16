import React from 'react';
import { FileText, Shield, AlertTriangle, CheckCircle2, MoreHorizontal, Search, Download, ExternalLink, Lock } from 'lucide-react';
import { SectionHeader } from '../components/SectionHeader';
import { cx } from '../../utils/theme';

export const CompliancePage: React.FC = () => {
  const contracts = [
    { id: 1, type: 'NDA_V4', party: 'TechStart Inc.', signed: '2026-02-15', expires: '2027-02-15', status: 'ACTIVE_PROTOCOL', level: 'SECURE' },
    { id: 2, type: 'SERVICE_MSA', party: 'E-Shop Co.', signed: '-', expires: '-', status: 'PENDING_SIG', level: 'RESTRICTED' },
    { id: 3, type: 'NDA_V4', party: 'Brand Labs', signed: '2026-01-20', expires: '2027-01-20', status: 'ACTIVE_PROTOCOL', level: 'SECURE' },
    { id: 4, type: 'DPA_ANNEX', party: 'Cloud Systems', signed: '2026-03-01', expires: '2029-03-01', status: 'ACTIVE_PROTOCOL', level: 'INTERNAL' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-1000">
      <SectionHeader
        title="Compliance & Legal"
        description="Legal documents, contracts, and compliance records."
        parentPage="Legal / Compliance"
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         <div className="bg-[var(--admin-surface)] border border-[var(--admin-border)] rounded-2xl p-6 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><Shield size={48} /></div>
            <div className="text-[10px] font-black text-[var(--admin-text-3)] uppercase tracking-[0.2em] mb-2">Protocol Status</div>
            <div className="text-[24px] font-[var(--admin-font-display)] font-black text-[var(--admin-green)] flex items-center gap-2">
               98.4% <span className="text-[12px] text-[var(--admin-text-3)] font-black">SECURE</span>
            </div>
         </div>
         <div className="bg-[var(--admin-surface)] border border-[var(--admin-border)] rounded-2xl p-6 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><FileText size={48} /></div>
            <div className="text-[10px] font-black text-[var(--admin-text-3)] uppercase tracking-[0.2em] mb-2">Active Contracts</div>
            <div className="text-[24px] font-[var(--admin-font-display)] font-black text-[var(--admin-text)]">142 <span className="text-[12px] text-[var(--admin-text-3)] font-black">CONTRACTS</span></div>
         </div>
         <div className="bg-[var(--admin-surface)] border border-[var(--admin-border)] rounded-2xl p-6 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><AlertTriangle size={48} /></div>
            <div className="text-[10px] font-black text-[var(--admin-text-3)] uppercase tracking-[0.2em] mb-2">Pending Review</div>
            <div className="text-[24px] font-[var(--admin-font-display)] font-black text-[var(--admin-red)]">03 <span className="text-[12px] text-[var(--admin-text-3)] font-black">ALERTS</span></div>
         </div>
         <div className="bg-[var(--admin-surface)] border border-[var(--admin-border)] rounded-2xl p-6 shadow-xl flex items-center justify-center border-dashed group hover:border-[var(--admin-accent)] transition-all cursor-pointer">
            <div className="flex flex-col items-center gap-2">
               <div className="p-2 rounded-lg bg-[var(--admin-surface-2)] text-[var(--admin-text-3)] group-hover:text-[var(--admin-accent)] transition-all"><FileText size={20} /></div>
               <span className="text-[11px] font-black text-[var(--admin-text-3)] group-hover:text-[var(--admin-text)] transition-all uppercase tracking-widest">New Protocol</span>
            </div>
         </div>
      </div>

      <div className="bg-[var(--admin-surface)] border border-[var(--admin-border)] rounded-[2.5rem] overflow-hidden shadow-2xl">
        <div className="px-8 py-6 border-b border-[var(--admin-border)] bg-[var(--admin-surface-2)]/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
               <h3 className="text-[18px] font-black text-[var(--admin-text)] uppercase tracking-tight flex items-center gap-2">
                 <Shield size={20} className="text-[var(--admin-accent)]" /> Secure Archive
               </h3>
            </div>
            <div className="flex items-center gap-3">
               <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--admin-text-3)]" />
                  <input 
                    type="text" 
                    placeholder="Search contracts..."
                    className="pl-9 pr-4 py-2 bg-[var(--admin-surface-3)] border border-[var(--admin-border)] rounded-xl text-[12px] font-bold text-[var(--admin-text)] focus:outline-none focus:border-[var(--admin-accent)]/50 focus:ring-1 focus:ring-[var(--admin-accent)]/20 transition-all w-64"
                  />
               </div>
               <button className="p-2.5 bg-[var(--admin-surface-3)] border border-[var(--admin-border)] rounded-xl text-[var(--admin-text-3)] hover:text-[var(--admin-text)] transition-all"><Download size={18} /></button>
            </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[var(--admin-surface-2)]/30 border-b border-[var(--admin-border)]">
                <th className="px-8 py-5 text-[11px] font-black text-[var(--admin-text-3)] uppercase tracking-widest text-center w-16">Rank</th>
                <th className="px-6 py-5 text-[11px] font-black text-[var(--admin-text-3)] uppercase tracking-widest">Protocol Type</th>
                <th className="px-6 py-5 text-[11px] font-black text-[var(--admin-text-3)] uppercase tracking-widest">Connected Party</th>
                <th className="px-6 py-5 text-[11px] font-black text-[var(--admin-text-3)] uppercase tracking-widest">Init Date</th>
                <th className="px-6 py-5 text-[11px] font-black text-[var(--admin-text-3)] uppercase tracking-widest">Term Date</th>
                <th className="px-6 py-5 text-[11px] font-black text-[var(--admin-text-3)] uppercase tracking-widest">Protocol Status</th>
                <th className="px-6 py-5 text-[11px] font-black text-[var(--admin-text-3)] uppercase tracking-widest">Access</th>
                <th className="px-8 py-5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--admin-border)]">
              {contracts.map(c => (
                <tr key={c.id} className="hover:bg-[var(--admin-surface-2)]/40 transition-colors group">
                  <td className="px-8 py-6 text-center">
                    <span className="text-[12px] font-[var(--admin-font-mono)] font-black text-[var(--admin-text-3)]">#{c.id}</span>
                  </td>
                  <td className="px-6 py-6">
                    <div className="flex items-center gap-3">
                       <div className="p-2 rounded-lg bg-[var(--admin-surface-3)] border border-[var(--admin-border)] text-[var(--admin-text-3)]"><FileText size={16} /></div>
                       <span className="text-[13px] font-black text-[var(--admin-text-2)] uppercase tracking-tighter">{c.type}</span>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <div className="text-[14px] font-black text-[var(--admin-text)] tracking-tight">{c.party}</div>
                    <div className="text-[10px] font-bold text-[var(--admin-accent)] uppercase tracking-widest mt-0.5 opacity-70">Verified</div>
                  </td>
                  <td className="px-6 py-6 text-[13px] font-[var(--admin-font-mono)] font-bold text-[var(--admin-text-3)]">{c.signed}</td>
                  <td className="px-6 py-6 text-[13px] font-[var(--admin-font-mono)] font-bold text-[var(--admin-text-3)]">{c.expires}</td>
                  <td className="px-6 py-6">
                    <div className="flex items-center gap-2">
                       {c.status === 'ACTIVE_PROTOCOL' ? (
                         <div className="flex items-center gap-1.5 text-[var(--admin-green)] animate-pulse">
                            <CheckCircle2 size={12} />
                            <span className="text-[10px] font-black uppercase tracking-widest">{c.status}</span>
                         </div>
                       ) : (
                         <div className="flex items-center gap-1.5 text-[var(--admin-red)]">
                            <AlertTriangle size={12} />
                            <span className="text-[10px] font-black uppercase tracking-widest">{c.status}</span>
                         </div>
                       )}
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <div className={cx(
                      "inline-flex items-center gap-1.5 px-2 py-1 rounded-md border text-[9px] font-black uppercase tracking-[0.1em]",
                      c.level === 'SECURE' ? "bg-[var(--admin-green-dim)] text-[var(--admin-green)] border-[var(--admin-green)]/20" :
                      c.level === 'RESTRICTED' ? "bg-[var(--admin-red-dim)] text-[var(--admin-red)] border-[var(--admin-red)]/20" :
                      "bg-[var(--admin-blue-dim)] text-[var(--admin-blue)] border-[var(--admin-blue)]/20"
                    )}>
                      <Lock size={10} /> {c.level}
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                       <button className="p-2 rounded-lg hover:bg-[var(--admin-surface-3)] text-[var(--admin-text-3)] hover:text-[var(--admin-text)] opacity-0 group-hover:opacity-100 transition-all">
                          <ExternalLink size={16} />
                       </button>
                       <button className="p-2 rounded-lg hover:bg-[var(--admin-surface-3)] text-[var(--admin-text-3)] hover:text-[var(--admin-text)]">
                          <MoreHorizontal size={16} />
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-gradient-to-br from-[var(--admin-surface)] to-[var(--admin-surface-2)] border border-[var(--admin-border)] rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden group">
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
         <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="max-w-xl">
               <h3 className="text-[24px] font-[var(--admin-font-display)] font-black text-[var(--admin-text)] tracking-tighter uppercase mb-2">Automated Compliance Check</h3>
               <p className="text-[15px] text-[var(--admin-text-3)] font-medium leading-relaxed">AI audits are active. Incoming legal documents are verified and flagged for review automatically.</p>
            </div>
            <div className="flex-shrink-0 flex items-center gap-6">
                <div className="text-right">
                   <div className="text-[10px] font-black text-[var(--admin-text-3)] uppercase tracking-widest mb-1">Audit Score</div>
                   <div className="text-[32px] font-black text-[var(--admin-accent)]">AAA+</div>
                </div>
                <button className="px-10 py-4 bg-[var(--admin-accent)] text-black rounded-2xl text-[14px] font-black uppercase tracking-widest shadow-[0_0_30px_rgba(232,148,58,0.3)] hover:scale-105 transition-all active:scale-[0.98]">
                   Run Full Audit
                </button>
            </div>
         </div>
      </div>
    </div>
  );
};
