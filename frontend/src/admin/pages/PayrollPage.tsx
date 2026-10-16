import React from 'react';
import { FileText, Plus, Download, Send, CreditCard, Banknote, ShieldAlert, Search, MoreHorizontal, Zap } from 'lucide-react';
import { SectionHeader } from '../components/SectionHeader';
import { cx } from '../../utils/theme';

interface PaySlip {
  id: number;
  employee: string;
  period: string;
  base: number;
  bonus: number;
  deductions: number;
  net: number;
  status: 'paid' | 'pending';
}

export const PayrollPage: React.FC = () => {
  const slips: PaySlip[] = [
    { id: 1, employee: 'Ravi Kumar', period: 'Mar 2026', base: 3500, bonus: 200, deductions: 150, net: 3550, status: 'paid' },
    { id: 2, employee: 'Priya Sharma', period: 'Mar 2026', base: 4200, bonus: 300, deductions: 200, net: 4300, status: 'paid' },
    { id: 3, employee: 'Amit Patel', period: 'Mar 2026', base: 2800, bonus: 0, deductions: 100, net: 2700, status: 'pending' },
  ];

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-[var(--admin-green-dim)] text-[var(--admin-green)] border-[var(--admin-green)]/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]';
      case 'pending': return 'bg-[var(--admin-accent-dim)] text-[var(--admin-accent)] border-[var(--admin-accent)]/20 shadow-[0_0_15px_rgba(232,148,58,0.1)]';
      default: return 'bg-[var(--admin-surface-3)] text-[var(--admin-text-3)]';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-1000">
      <SectionHeader 
        title="Human Capital Payroll" 
        description="Encrypted terminal for compensation distribution, tax compliance, and benefit yield tracking."
        parentPage="Operations / Payroll"
      />

      {/* Payroll Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Operational OpEx', value: '$10,550', trend: 'STABLE', icon: <Banknote size={18} />, color: 'var(--admin-accent)' },
          { label: 'Tax Liabilities', value: '$2,140', trend: 'SYNCED', icon: <ShieldAlert size={18} />, color: 'var(--admin-blue)' },
          { label: 'Disbursement Vel.', value: '98.4%', trend: 'OPTIMAL', icon: <Zap size={18} />, color: 'var(--admin-green)' },
          { label: 'Compliance Audit', value: 'PASS', trend: 'Q1_2024', icon: <FileText size={18} />, color: 'var(--admin-text-3)' },
        ].map((m, i) => (
          <div key={i} className="bg-[var(--admin-surface)] border border-[var(--admin-border)] rounded-[2rem] p-6 shadow-xl relative overflow-hidden group hover:border-[var(--admin-accent)]/30 transition-all">
            <div className="absolute top-0 right-0 p-5 opacity-5 group-hover:opacity-10 transition-opacity">{m.icon}</div>
            <div className="text-[10px] font-black text-[var(--admin-text-3)] uppercase tracking-[0.2em] mb-2">{m.label}</div>
            <div className="text-[28px] font-[var(--admin-font-display)] font-black text-[var(--admin-text)] tracking-tighter mb-1">{m.value}</div>
            <div className="flex items-center gap-2">
               <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-[var(--admin-surface-3)] text-[var(--admin-text-2)] uppercase tracking-widest">{m.trend}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Salary Stream Terminal */}
      <div className="bg-[var(--admin-surface)] border border-[var(--admin-border)] rounded-[2.5rem] overflow-hidden shadow-2xl">
         <div className="px-8 py-6 border-b border-[var(--admin-border)] bg-[var(--admin-surface-2)]/50 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-6">
               <h3 className="text-[18px] font-black text-[var(--admin-text)] uppercase tracking-tight flex items-center gap-3 font-[var(--admin-font-display)]">
                  <CreditCard size={20} className="text-[var(--admin-accent)]" /> Multi-Layer Disbursement
               </h3>
               <div className="relative group hidden md:block">
                  <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--admin-text-3)]" />
                  <input 
                    type="text" 
                    placeholder="Search personnel payroll..." 
                    className="pl-11 pr-4 py-2 bg-[var(--admin-surface-3)] border border-[var(--admin-border)] rounded-xl text-[12px] font-bold text-[var(--admin-text)] focus:outline-none focus:border-[var(--admin-accent)] focus:ring-1 focus:ring-[var(--admin-accent)]/20 transition-all w-64 shadow-inner"
                  />
               </div>
            </div>
            
            <div className="flex items-center gap-4">
               <button className="flex items-center gap-2 px-6 py-2.5 bg-[var(--admin-surface-3)] border border-[var(--admin-border)] text-[var(--admin-text)] rounded-xl text-[13px] font-black transition-all hover:bg-[var(--admin-surface-2)] uppercase tracking-tighter">
                  <Download size={18} /> EXPORT_AUDIT
               </button>
               <button className="flex items-center gap-2 px-6 py-2.5 bg-[var(--admin-accent)] text-black rounded-xl text-[13px] font-black transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_20px_rgba(232,148,58,0.3)] uppercase tracking-tighter">
                  <Plus size={18} strokeWidth={3} /> GENERATE_PAYSLIPS
               </button>
            </div>
         </div>

         <div className="overflow-x-auto">
           <table className="w-full text-left">
             <thead>
               <tr className="bg-[var(--admin-surface-2)]/30 border-b border-[var(--admin-border)]">
                 <th className="px-8 py-5 text-[11px] font-black text-[var(--admin-text-3)] uppercase tracking-widest">Personnel Node</th>
                 <th className="px-8 py-5 text-[11px] font-black text-[var(--admin-text-3)] uppercase tracking-widest">Fiscal Cycle</th>
                 <th className="px-8 py-5 text-[11px] font-black text-[var(--admin-text-3)] uppercase tracking-widest text-right">Base Allocation</th>
                 <th className="px-8 py-5 text-[11px] font-black text-[var(--admin-text-3)] uppercase tracking-widest text-right">Performance Yield</th>
                 <th className="px-8 py-5 text-[11px] font-black text-[var(--admin-text-3)] uppercase tracking-widest text-right">Deduction Mass</th>
                 <th className="px-8 py-5 text-[11px] font-black text-[var(--admin-text-3)] uppercase tracking-widest text-right">Net Liquidation</th>
                 <th className="px-8 py-5 text-[11px] font-black text-[var(--admin-text-3)] uppercase tracking-widest text-center">Status</th>
                 <th className="px-8 py-5"></th>
               </tr>
             </thead>
             <tbody className="divide-y divide-[var(--admin-border)] bg-[var(--admin-bg)]/10">
               {slips.map(slip => (
                 <tr key={slip.id} className="hover:bg-[var(--admin-surface-2)]/40 transition-colors group">
                   <td className="px-8 py-6">
                      <div className="text-[14px] font-black text-[var(--admin-text)] tracking-tight uppercase leading-none mb-1">
                        {slip.employee}
                      </div>
                      <div className="text-[10px] font-bold text-[var(--admin-text-3)] uppercase tracking-tighter">SEC_LVL: P2_CORE</div>
                   </td>
                   <td className="px-8 py-6">
                      <div className="text-[13px] font-black text-[var(--admin-text-2)] uppercase tracking-tighter">{slip.period}</div>
                   </td>
                   <td className="px-8 py-6 text-right">
                      <div className="text-[14px] font-[var(--admin-font-mono)] font-black text-[var(--admin-text-2)]">${slip.base.toLocaleString()}</div>
                   </td>
                   <td className="px-8 py-6 text-right">
                      <div className="text-[13px] font-[var(--admin-font-mono)] font-black text-[var(--admin-green)]">
                         {slip.bonus > 0 ? `+$${slip.bonus}` : '--'}
                      </div>
                   </td>
                   <td className="px-8 py-6 text-right">
                      <div className="text-[13px] font-[var(--admin-font-mono)] font-black text-[var(--admin-red)]">
                         {slip.deductions > 0 ? `-$${slip.deductions}` : '--'}
                      </div>
                   </td>
                   <td className="px-8 py-6 text-right">
                      <div className="text-[16px] font-[var(--admin-font-mono)] font-black text-[var(--admin-text)] tracking-tighter">
                         ${slip.net.toLocaleString()}
                      </div>
                   </td>
                   <td className="px-8 py-6 text-center">
                      <span className={cx("text-[10px] font-black px-3 py-1 bg-opacity-10 rounded-lg uppercase tracking-widest border", getStatusStyles(slip.status))}>
                        {slip.status}
                      </span>
                   </td>
                   <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        <button className="p-2.5 rounded-xl bg-[var(--admin-surface-3)] border border-[var(--admin-border)] text-[var(--admin-text-3)] hover:text-[var(--admin-accent)] transition-all">
                           <Download size={14} />
                        </button>
                        <button className="p-2.5 rounded-xl bg-[var(--admin-surface-3)] border border-[var(--admin-border)] text-[var(--admin-text-3)] hover:text-[var(--admin-blue)] transition-all">
                           <Send size={14} />
                        </button>
                        <button className="p-2.5 rounded-xl bg-[var(--admin-surface-3)] border border-[var(--admin-border)] text-[var(--admin-text-3)] hover:text-[var(--admin-text)]">
                           <MoreHorizontal size={14} />
                        </button>
                      </div>
                   </td>
                 </tr>
               ))}
             </tbody>
           </table>
         </div>

         <div className="px-8 py-5 bg-[var(--admin-surface-2)]/30 border-t border-[var(--admin-border)] flex items-center justify-between">
            <div className="flex items-center gap-6">
               <div className="flex items-center gap-2 text-[11px] font-black text-[var(--admin-text-3)] uppercase tracking-widest">
                  Process Velocity: <span className="text-[var(--admin-green)]">REAL-TIME</span>
               </div>
               <div className="flex items-center gap-2 text-[11px] font-black text-[var(--admin-text-3)] uppercase tracking-widest border-l border-[var(--admin-border)] pl-6">
                  Vault Integrity: <span className="text-[var(--admin-text)]">QUANTUM_ENCRYPTED</span>
               </div>
            </div>
            <div className="text-[10px] font-bold text-[var(--admin-text-3)] uppercase tracking-widest opacity-60">
               Generated Cluster: RE-PLATFORM_AUDIT_FRAG_3
            </div>
         </div>
      </div>
    </div>
  );
};
