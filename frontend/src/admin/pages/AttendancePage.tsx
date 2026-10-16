import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, Clock, UserCheck, UserX, Search, Filter, ArrowRight, CheckCircle2, AlertCircle, Zap, RefreshCw } from 'lucide-react';
import { SectionHeader } from '../components/SectionHeader';
import { cx } from '../../utils/theme';
import { adminFetch } from '../utils/api';

interface AttendanceLog {
  id: string;
  userId: string;
  date: string;
  createdAt: string;
}

type AttendanceStatus = 'PRESENT' | 'LATE' | 'ABSENT' | 'REMOTE';

interface AttendanceRecord {
  id: string;
  name: string;
  role: string;
  status: AttendanceStatus;
  checkIn: string;
  checkOut: string | null;
  hours: string;
  coverage: number;
  date: string;
}

const formatTime = (value: string) => new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
const formatDate = (value: string) => new Date(value).toLocaleDateString();

const getStatusFromLog = (log: AttendanceLog): AttendanceStatus => {
  const created = new Date(log.createdAt);
  const hour = created.getHours();
  const minute = created.getMinutes();
  if (hour > 9 || (hour === 9 && minute > 0)) return 'LATE';
  return 'PRESENT';
};

const getDuration = (value: string) => {
  const ms = Math.max(0, Date.now() - new Date(value).getTime());
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  return `${hours}h ${minutes}m`;
};

const toRecord = (log: AttendanceLog): AttendanceRecord => {
  const status = getStatusFromLog(log);
  return {
    id: log.id,
    name: log.userId,
    role: 'Team Member',
    status,
    checkIn: formatTime(log.createdAt),
    checkOut: null,
    hours: getDuration(log.createdAt),
    coverage: status === 'PRESENT' ? 98 : 78,
    date: log.date,
  };
};

export const AttendancePage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAttendance = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminFetch<{ logs: AttendanceLog[] }>('/business/attendance?limit=100');
      setRecords((data.logs || []).map(toRecord));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load attendance logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttendance();
  }, []);

  const filteredRecords = useMemo(() => {
    const needle = searchQuery.trim().toLowerCase();
    if (!needle) return records;
    return records.filter((record) =>
      [record.name, record.role, record.status, record.date].some((value) => value.toLowerCase().includes(needle))
    );
  }, [records, searchQuery]);

  const presentCount = records.filter((record) => ['PRESENT', 'LATE', 'REMOTE'].includes(record.status)).length;
  const lateCount = records.filter((record) => record.status === 'LATE').length;
  const absentCount = records.filter((record) => record.status === 'ABSENT').length;
  const coverageAvg = records.length ? Math.round(records.reduce((sum, record) => sum + record.coverage, 0) / records.length) : 0;

  const getStatusStyles = (status: AttendanceRecord['status']) => {
    switch (status) {
      case 'PRESENT': return 'bg-[var(--admin-green-dim)] text-[var(--admin-green)] border-[var(--admin-green)]/20 shadow-[0_0_10px_rgba(34,197,94,0.1)]';
      case 'LATE': return 'bg-[var(--admin-accent-dim)] text-[var(--admin-accent)] border-[var(--admin-accent)]/20 shadow-[0_0_10px_rgba(255,191,0,0.1)]';
      case 'REMOTE': return 'bg-[var(--admin-blue-dim)] text-[var(--admin-blue)] border-[var(--admin-blue)]/20';
      case 'ABSENT': return 'bg-[var(--admin-red-dim)] text-[var(--admin-red)] border-[var(--admin-red)]/20 shadow-[0_0_10px_rgba(239,68,68,0.1)]';
      default: return 'bg-[var(--admin-surface-3)] text-[var(--admin-text-3)]';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <SectionHeader 
        title="Human Resource Vectors" 
        description="Real-time monitoring of operational availability, session duration, and team distribution across the global grid."
        parentPage="People / Attendance"
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Signal Active', value: String(presentCount), icon: UserCheck, sub: 'Clocked-in logs' },
          { label: 'Latency Node', value: `${lateCount}`, icon: Clock, sub: 'Late arrivals' },
          { label: 'Out of Range', value: String(absentCount), icon: UserX, sub: 'Absence signals' },
          { label: 'System Uptime', value: `${coverageAvg}%`, icon: CheckCircle2, sub: 'Coverage average' },
        ].map((m, i) => (
          <div key={i} className="bg-[var(--admin-surface)] border border-[var(--admin-border)] rounded-3xl p-6 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <m.icon size={48} className="text-white" />
            </div>
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
            <h3 className="text-[16px] font-black text-[var(--admin-text)] uppercase tracking-tight flex items-center gap-3">
              <Calendar size={20} className="text-[var(--admin-accent)]" /> Availability Log
            </h3>
            <div className="relative group">
              <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--admin-text-3)] group-focus-within:text-[var(--admin-accent)] transition-colors" />
              <input 
                type="text" 
                placeholder="Search staff..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 pr-4 py-2 bg-[var(--admin-surface-3)] border border-[var(--admin-border)] rounded-xl text-[13px] font-bold text-[var(--admin-text)] focus:outline-none focus:border-[var(--admin-accent)]/50 focus:ring-1 focus:ring-[var(--admin-accent)]/20 transition-all w-64"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-[var(--admin-surface-3)] border border-[var(--admin-border)] rounded-xl text-[13px] font-bold text-[var(--admin-text-2)] hover:text-[var(--admin-text)] transition-colors">
              <Filter size={14} /> Matrix Filter
            </button>
            <button onClick={loadAttendance} className="flex items-center gap-2 px-5 py-2 bg-[var(--admin-accent)] text-black rounded-xl text-[13px] font-black hover:bg-[var(--admin-accent)]/90 transition-all shadow-[0_0_20px_rgba(255,191,0,0.2)]">
               <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> SYNC SESSION
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 flex items-center justify-center gap-2 text-[var(--admin-text-3)]"><RefreshCw className="animate-spin" size={18} /> Loading attendance logs...</div>
          ) : filteredRecords.length === 0 ? (
            <div className="p-12 text-center text-[var(--admin-text-3)]">No attendance logs found.</div>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[var(--admin-surface-2)]/30 border-b border-[var(--admin-border)]">
                  <th className="px-8 py-4 text-left text-[11px] font-black text-[var(--admin-text-3)] uppercase tracking-[0.1em]">Resource Entity</th>
                  <th className="px-8 py-4 text-left text-[11px] font-black text-[var(--admin-text-3)] uppercase tracking-[0.1em]">Status Signal</th>
                  <th className="px-8 py-4 text-left text-[11px] font-black text-[var(--admin-text-3)] uppercase tracking-[0.1em]">Session Start</th>
                  <th className="px-8 py-4 text-left text-[11px] font-black text-[var(--admin-text-3)] uppercase tracking-[0.1em]">Duration Vector</th>
                  <th className="px-8 py-4 text-right text-[11px] font-black text-[var(--admin-text-3)] uppercase tracking-[0.1em]">Availability Index</th>
                  <th className="px-8 py-4 text-right text-[11px] font-black text-[var(--admin-text-3)] uppercase tracking-[0.1em]">Nexus</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--admin-border)]">
                {filteredRecords.map((rec) => (
                  <tr key={rec.id} className="group hover:bg-[var(--admin-surface-2)]/20 transition-colors">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-[var(--admin-surface-3)] flex items-center justify-center font-bold text-[var(--admin-accent)] border border-[var(--admin-border)] relative overflow-hidden group-hover:border-[var(--admin-accent)]/50 transition-colors">
                          <div className="absolute inset-0 bg-gradient-to-br from-[var(--admin-accent)]/5 to-transparent" />
                          {rec.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-[14px] font-black text-[var(--admin-text)] tracking-tight group-hover:text-[var(--admin-accent)] transition-colors">{rec.name}</div>
                          <div className="text-[12px] text-[var(--admin-text-3)] font-medium uppercase tracking-widest">{rec.role} · {formatDate(rec.date)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className={cx(
                        'inline-flex items-center px-3 py-1.5 rounded-lg text-[10px] font-black border uppercase tracking-wider gap-2',
                        getStatusStyles(rec.status)
                      )}>
                        {rec.status === 'PRESENT' && <Zap size={10} className="fill-current" />}
                        {rec.status === 'LATE' && <AlertCircle size={10} />}
                        {rec.status}
                      </span>
                    </td>
                    <td className="px-8 py-5"><div className="text-[15px] font-[var(--admin-font-mono)] font-bold text-[var(--admin-text)] tracking-tighter">{rec.checkIn}</div><div className="text-[10px] font-black text-[var(--admin-text-3)] uppercase tracking-widest mt-0.5">Matrix Entry</div></td>
                    <td className="px-8 py-5"><div className="text-[15px] font-[var(--admin-font-mono)] font-bold text-[var(--admin-text)] tracking-tighter">{rec.hours}</div><div className="text-[10px] font-black text-[var(--admin-text-3)] uppercase tracking-widest mt-0.5">Time Vector</div></td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-3 translate-y-1">
                        <div className="w-24 h-1.5 bg-[var(--admin-surface-3)] rounded-full overflow-hidden border border-white/5">
                          <div className={cx('h-full transition-all duration-1000', rec.coverage > 90 ? 'bg-[var(--admin-green)] shadow-[0_0_10px_rgba(34,197,94,0.3)]' : rec.coverage > 50 ? 'bg-[var(--admin-accent)] shadow-[0_0_10px_rgba(255,191,0,0.3)]' : 'bg-[var(--admin-red)] shadow-[0_0_10px_rgba(239,68,68,0.3)]')} style={{ width: `${rec.coverage}%` }} />
                        </div>
                        <span className="text-[11px] font-black text-[var(--admin-text)] font-[var(--admin-font-mono)]">{rec.coverage}%</span>
                      </div>
                      <div className="text-[9px] font-black text-[var(--admin-text-3)] uppercase tracking-widest mt-1">Avail Index</div>
                    </td>
                    <td className="px-8 py-5 text-right"><button className="group p-2.5 bg-[var(--admin-surface-3)] border border-[var(--admin-border)] rounded-xl text-[var(--admin-text-3)] hover:text-[var(--admin-accent)] hover:bg-[var(--admin-accent)]/5 hover:border-[var(--admin-accent)]/20 transition-all"><ArrowRight size={16} className="transition-transform duration-300 group-hover:-rotate-45" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div className="px-8 py-4 bg-[var(--admin-surface-2)]/20 flex items-center justify-between">
            <div className="text-[12px] text-[var(--admin-text-3)] font-medium underline decoration-[var(--admin-border)] underline-offset-4">Sector Distribution: {coverageAvg}% Active</div>
            <div className="flex items-center gap-2"><span className="text-[11px] font-black text-[var(--admin-text-3)] uppercase tracking-widest">End of Daily Cycle</span></div>
          </div>
        </div>
      </div>
    </div>
  );
};
