import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCw, Search, Shield, Users, Wallet, Briefcase } from 'lucide-react';
import { adminFetch } from '../utils/api';

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  createdAt: string;
  updatedAt: string;
}

interface Department {
  id: string;
  name: string;
  employeeCount: number;
}

const initials = (employee: Employee) => `${employee.firstName?.[0] || ''}${employee.lastName?.[0] || ''}`.toUpperCase() || 'TM';
const fullName = (employee: Employee) => `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || employee.email;
const accessForDepartment = (department: string) => {
  const key = department.toLowerCase();
  if (key.includes('finance')) return 'Finance';
  if (key.includes('quality') || key.includes('qc')) return 'QC';
  if (key.includes('admin') || key.includes('management')) return 'Admin';
  return 'Production';
};

export const TeamPage: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTeam = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminFetch<{ employees: Employee[]; departments: Department[] }>('/operations/team/directory');
      setEmployees(data.employees || []);
      setDepartments(data.departments || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load team directory');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadTeam(); }, 0);
    return () => window.clearTimeout(timer);
  }, [loadTeam]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return employees;
    return employees.filter((employee) => [fullName(employee), employee.email, employee.department].some((value) => value.toLowerCase().includes(needle)));
  }, [employees, query]);

  return (
    <div className="space-y-5">
      <div className="an-page-header">
        <div className="an-page-title"><span className="ph-icon"><Shield size={16} /></span>Team</div>
        <div className="an-page-desc">{employees.length} live team members · {departments.length} departments</div>
        <div className="an-page-actions">
          <button className="an-btn an-btn-ghost an-btn-sm" onClick={loadTeam}><RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh</button>
          <button className="an-btn an-btn-ghost an-btn-sm">Export</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="an-card p-4"><div className="flex items-center gap-2 text-[12px] font-semibold text-[var(--an-text2)]"><Users size={15} /> Members</div><div className="mt-2 text-[24px] font-bold">{employees.length}</div></div>
        <div className="an-card p-4"><div className="flex items-center gap-2 text-[12px] font-semibold text-[var(--an-text2)]"><Briefcase size={15} /> Departments</div><div className="mt-2 text-[24px] font-bold">{departments.length}</div></div>
        <div className="an-card p-4"><div className="flex items-center gap-2 text-[12px] font-semibold text-[var(--an-text2)]"><Wallet size={15} /> Payroll Records</div><div className="mt-2 text-[24px] font-bold">Live</div></div>
      </div>

      {error && <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-[13px] text-red-700">{error}</div>}

      <div className="an-card-flush overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--an-border)] px-4 py-3">
          <div className="font-semibold text-[14px] text-[var(--an-text)]">Team Directory</div>
          <div className="relative"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#999]" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search team..." className="w-full sm:w-72 rounded-lg border border-[var(--an-border)] bg-white py-2 pl-9 pr-3 text-[13px] outline-none focus:border-black/40 focus:ring-1 focus:ring-black/5" /></div>
        </div>
        {loading ? <div className="p-10 text-center text-sm text-[#888]">Loading team...</div> : filtered.length === 0 ? <div className="p-10 text-center text-sm text-[#888]">No team members found.</div> : (
          <div className="an-tbl-wrap">
            <table>
              <thead><tr><th>Member</th><th>Department</th><th>Access</th><th>Status</th><th>Joined</th></tr></thead>
              <tbody>{filtered.map((employee) => (
                <tr key={employee.id}>
                  <td className="an-td-main"><div className="flex items-center gap-3"><div className="an-mini-av bg-black text-white">{initials(employee)}</div><div><div className="font-medium">{fullName(employee)}</div><div className="text-[12px] text-[var(--an-text2)]">{employee.email}</div></div></div></td>
                  <td>{employee.department}</td>
                  <td><span className="an-badge an-badge-blue">{accessForDepartment(employee.department)}</span></td>
                  <td><span className="an-badge an-badge-green">Active</span></td>
                  <td>{new Date(employee.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
