import React, { useState, useEffect } from 'react';
import { Users, Search, Plus, Mail, Phone, Building2, MapPin, BadgeCheck, Zap, MoreHorizontal, UserCheck, UserX, Clock, ArrowRight } from 'lucide-react';
import { SectionHeader } from '../components/SectionHeader';
import { cx } from '../../utils/theme';

interface TeamMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  title: string;
  department: string;
  location: string;
  joinDate: string;
  status: 'ONLINE' | 'AWAY' | 'OFFLINE' | 'BUSY';
  accessLevel: 'P0' | 'P1' | 'P2' | 'P3';
}

import { adminFetch } from '../utils/api';

export const TeamDirectoryPage: React.FC = () => {
  const [employees, setEmployees] = useState<TeamMember[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    adminFetch('/operations/team/directory')
      .then(data => {
        setEmployees(data.employees || []);
        setDepartments(data.departments || []);
        setLoading(false);
      })
      .catch(e => {
        console.error(e);
        setLoading(false);
      });
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ONLINE': return 'text-[var(--admin-green)] bg-[var(--admin-green-dim)] border-[var(--admin-green)]/20 shadow-[0_0_10px_rgba(16,185,129,0.2)]';
      case 'BUSY': return 'text-[var(--admin-red)] bg-[var(--admin-red-dim)] border-[var(--admin-red)]/20 shadow-[0_0_10px_rgba(239,68,68,0.2)]';
      case 'AWAY': return 'text-[var(--admin-accent)] bg-[var(--admin-accent-dim)] border-[var(--admin-accent)]/20';
      default: return 'text-[var(--admin-text-3)] bg-[var(--admin-surface-3)] border-[var(--admin-border)]';
    }
  };

  const getAccessBadge = (level: string) => {
    switch (level) {
      case 'P0': return 'bg-gradient-to-r from-red-500 to-orange-500 text-black font-black outline outline-2 outline-red-500/20 shadow-lg shadow-red-500/20';
      case 'P1': return 'bg-[var(--admin-accent)] text-black font-black outline outline-2 outline-[var(--admin-accent)]/20 shadow-lg shadow-[var(--admin-accent)]/20';
      case 'P2': return 'bg-[var(--admin-blue)] text-black font-black outline outline-2 outline-[var(--admin-blue)]/20';
      default: return 'bg-[var(--admin-surface-3)] text-[var(--admin-text-2)] font-bold';
    }
  };

  if (loading) return <div className="h-full flex items-center justify-center bg-[var(--admin-bg)]"><Zap className="animate-spin text-[var(--admin-accent)]" /></div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-1000">
      <SectionHeader 
        title="Human Resource Stream" 
        description="Core operational intelligence and team synchronization terminal."
        parentPage="Operations / Team"
      />

      {/* Org Snapshot */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {departments.map((dept, i) => (
          <div key={i} className="bg-[var(--admin-surface)] border border-[var(--admin-border)] rounded-[2rem] p-6 shadow-xl relative overflow-hidden group hover:border-[var(--admin-accent)]/30 transition-all">
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity"><Building2 size={48} /></div>
            <div className="text-[10px] font-black text-[var(--admin-text-3)] uppercase tracking-[0.2em] mb-2">{dept.name}</div>
            <div className="text-[32px] font-[var(--admin-font-display)] font-black text-[var(--admin-text)] tracking-tighter mb-1">{dept.employeeCount}</div>
            <div className="flex items-center gap-2">
               <span className="text-[11px] font-black text-[var(--admin-accent)] uppercase tracking-tight">Access Level Core</span>
               <div className="h-1 flex-1 bg-[var(--admin-surface-3)] rounded-full overflow-hidden">
                  <div className="h-full bg-[var(--admin-accent)]" style={{ width: '40%' }} />
               </div>
            </div>
          </div>
        ))}
      </div>

      {/* Directory Terminal */}
      <div className="bg-[var(--admin-surface)] border border-[var(--admin-border)] rounded-[2.5rem] overflow-hidden shadow-2xl">
         <div className="px-8 py-6 border-b border-[var(--admin-border)] bg-[var(--admin-surface-2)]/50 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-6">
               <h3 className="text-[18px] font-black text-[var(--admin-text)] uppercase tracking-tight flex items-center gap-3 font-[var(--admin-font-display)]">
                  <Users size={20} className="text-[var(--admin-accent)]" /> Personnel Node
               </h3>
               <div className="relative group">
                  <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--admin-text-3)]" />
                  <input 
                    type="text" 
                    placeholder="Search personnel..." 
                    className="pl-11 pr-4 py-2 bg-[var(--admin-surface-3)] border border-[var(--admin-border)] rounded-xl text-[13px] font-bold text-[var(--admin-text)] focus:outline-none focus:border-[var(--admin-accent)] focus:ring-1 focus:ring-[var(--admin-accent)]/20 transition-all w-72 shadow-inner"
                  />
               </div>
            </div>
            
            <div className="flex items-center gap-4">
               <div className="flex bg-[var(--admin-surface-3)] border border-[var(--admin-border)] rounded-xl p-1 shadow-inner">
                  <button onClick={() => setView('grid')} className={cx("px-4 py-1.5 rounded-lg text-[11px] font-black transition-all", view === 'grid' ? "bg-[var(--admin-accent)] text-black shadow-lg" : "text-[var(--admin-text-3)] hover:text-[var(--admin-text)]")}>GRID_MAT</button>
                  <button onClick={() => setView('list')} className={cx("px-4 py-1.5 rounded-lg text-[11px] font-black transition-all", view === 'list' ? "bg-[var(--admin-accent)] text-black shadow-lg" : "text-[var(--admin-text-3)] hover:text-[var(--admin-text)]")}>LIST_STRM</button>
               </div>
               <button className="flex items-center gap-2 px-6 py-2.5 bg-[var(--admin-accent)] text-black rounded-xl text-[13px] font-black transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_20px_rgba(232,148,58,0.3)] uppercase tracking-tighter">
                  <Plus size={18} strokeWidth={3} /> NEW_PERSONNEL
               </button>
            </div>
         </div>

         {view === 'grid' ? (
           <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 bg-[var(--admin-bg)]/30">
             {employees.map(emp => (
               <div key={emp.id} className="bg-[var(--admin-surface)] border border-[var(--admin-border)] rounded-[2rem] p-6 shadow-xl relative overflow-hidden group hover:border-[var(--admin-accent)]/30 transition-all flex flex-col items-center text-center">
                  <div className="absolute top-4 right-4 group-hover:scale-110 transition-transform">
                     <span className={cx("text-[8px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest", getAccessBadge(emp.accessLevel || 'P2'))}>{emp.accessLevel || 'P2'}</span>
                  </div>
                  
                  <div className="relative mb-4">
                     <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[var(--admin-surface-3)] to-[var(--admin-surface-2)] border border-[var(--admin-border)] flex items-center justify-center p-0.5 shadow-2xl group-hover:-translate-y-1 transition-transform">
                        <div className="w-full h-full rounded-[1.4rem] bg-[var(--admin-surface)] flex items-center justify-center overflow-hidden">
                           <span className="text-[28px] font-black text-[var(--admin-text-2)]">{emp.firstName.charAt(0)}</span>
                        </div>
                     </div>
                     <div className={cx("absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-4 border-[var(--admin-surface)] flex items-center justify-center", getStatusColor(emp.status || 'ONLINE'))}>
                        <div className="w-1.5 h-1.5 rounded-full bg-current shadow-[0_0_5px_currentColor]" />
                     </div>
                  </div>

                  <h4 className="text-[17px] font-black text-[var(--admin-text)] tracking-tight leading-none mb-1 uppercase">{emp.firstName} {emp.lastName}</h4>
                  <div className="text-[11px] font-black text-[var(--admin-accent)] uppercase tracking-widest mb-4 opacity-80">{emp.title}</div>
                  
                  <div className="w-full space-y-3 pt-4 border-t border-[var(--admin-border)] mt-auto">
                     <div className="flex items-center justify-center gap-2 text-[12px] text-[var(--admin-text-2)] font-medium">
                        <Building2 size={13} className="text-[var(--admin-text-3)]" /> {emp.department}
                     </div>
                     <div className="flex items-center justify-center gap-2 text-[12px] text-[var(--admin-text-2)] font-medium">
                        <MapPin size={13} className="text-[var(--admin-text-3)]" /> {emp.location || 'Remote Node'}
                     </div>
                     <div className="flex items-center justify-center gap-1.5 pt-2">
                        <button className="p-2 rounded-lg bg-[var(--admin-surface-3)] hover:text-[var(--admin-accent)] transition-all border border-[var(--admin-border)]"><Mail size={14} /></button>
                        <button className="p-2 rounded-lg bg-[var(--admin-surface-3)] hover:text-[var(--admin-blue)] transition-all border border-[var(--admin-border)]"><Phone size={14} /></button>
                        <button className="p-2 rounded-lg bg-[var(--admin-surface-3)] hover:text-[var(--admin-text)] transition-all border border-[var(--admin-border)]"><BadgeCheck size={14} /></button>
                     </div>
                  </div>
               </div>
             ))}
           </div>
         ) : (
           <div className="overflow-x-auto">
             <table className="w-full text-left">
               <thead>
                 <tr className="bg-[var(--admin-surface-2)]/30 border-b border-[var(--admin-border)]">
                   <th className="px-8 py-5 text-[11px] font-black text-[var(--admin-text-3)] uppercase tracking-widest">Personnel Status</th>
                   <th className="px-8 py-5 text-[11px] font-black text-[var(--admin-text-3)] uppercase tracking-widest">Designation</th>
                   <th className="px-8 py-5 text-[11px] font-black text-[var(--admin-text-3)] uppercase tracking-widest">Department</th>
                   <th className="px-8 py-5 text-[11px] font-black text-[var(--admin-text-3)] uppercase tracking-widest text-center">Security Level</th>
                   <th className="px-8 py-5 text-[11px] font-black text-[var(--admin-text-3)] uppercase tracking-widest">Operational Hub</th>
                   <th className="px-8 py-5"></th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-[var(--admin-border)] bg-[var(--admin-bg)]/10">
                 {employees.map(emp => (
                   <tr key={emp.id} className="hover:bg-[var(--admin-surface-2)]/40 transition-colors group border-b border-[var(--admin-border)]">
                     <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                           <div className="relative">
                              <div className="w-10 h-10 rounded-xl bg-[var(--admin-surface-3)] border border-[var(--admin-border)] shadow-xl flex items-center justify-center font-black text-[14px]">
                                {emp.firstName.charAt(0)}
                              </div>
                              <div className={cx("absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-[var(--admin-bg)]", getStatusColor(emp.status || 'ONLINE'))}>
                                <div className="w-1 h-1 rounded-full bg-current m-auto mt-[1px]" />
                              </div>
                           </div>
                           <div>
                              <div className="text-[14px] font-black text-[var(--admin-text)] tracking-tight">{emp.firstName} {emp.lastName}</div>
                              <div className="text-[11px] font-medium text-[var(--admin-text-3)]">{emp.email}</div>
                           </div>
                        </div>
                     </td>
                     <td className="px-8 py-5">
                        <div className="text-[13px] font-black text-[var(--admin-accent)] uppercase tracking-widest">{emp.title}</div>
                        <div className="text-[10px] font-medium text-[var(--admin-text-3)] mt-0.5">Joined {new Date(emp.joinDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</div>
                     </td>
                     <td className="px-8 py-5 text-[13px] font-black text-[var(--admin-text-2)] uppercase tracking-tighter">
                        {emp.department}
                     </td>
                     <td className="px-8 py-5 text-center">
                        <span className={cx("text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest", getAccessBadge(emp.accessLevel || 'P2'))}>
                          {emp.accessLevel || 'P2'}
                        </span>
                     </td>
                     <td className="px-8 py-5 flex items-center gap-2">
                        <MapPin size={13} className="text-[var(--admin-text-3)]" />
                        <span className="text-[12px] font-medium text-[var(--admin-text-2)]">{emp.location || 'Remote Hub'}</span>
                     </td>
                     <td className="px-8 py-5 text-right">
                        <button className="p-2 rounded-xl text-[var(--admin-text-3)] hover:text-[var(--admin-text)] hover:bg-[var(--admin-surface-3)] transition-all">
                           <MoreHorizontal size={18} />
                        </button>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
         )}

         <div className="px-8 py-5 bg-[var(--admin-surface-2)]/30 border-t border-[var(--admin-border)] flex items-center justify-between">
            <div className="flex items-center gap-6">
               <div className="flex items-center gap-2 text-[10px] font-black text-[var(--admin-text-3)] uppercase tracking-widest">
                  <UserCheck size={14} className="text-[var(--admin-green)]" /> Online: <span className="text-[var(--admin-text)]">14</span>
               </div>
               <div className="flex items-center gap-2 text-[10px] font-black text-[var(--admin-text-3)] uppercase tracking-widest">
                  <UserX size={14} className="text-[var(--admin-red)]" /> Offline: <span className="text-[var(--admin-text)]">4</span>
               </div>
               <div className="flex items-center gap-2 text-[10px] font-black text-[var(--admin-text-3)] uppercase tracking-widest border-l border-[var(--admin-border)] pl-6">
                  <Clock size={14} className="text-[var(--admin-accent)]" /> Sync: <span className="text-[var(--admin-text)]">ACTIVE_1.2s</span>
               </div>
            </div>
            <button className="group flex items-center gap-2 px-6 py-2 bg-[var(--admin-surface-3)] border border-[var(--admin-border)] rounded-xl text-[11px] font-black text-[var(--admin-text-3)] hover:text-[var(--admin-text)] transition-all uppercase tracking-widest">
               Audit Personnel <ArrowRight size={14} className="transition-transform duration-300 group-hover:-rotate-45" />
            </button>
         </div>
      </div>
    </div>
  );
};
