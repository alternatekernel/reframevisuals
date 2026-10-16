import React, { useEffect, useMemo, useState } from 'react';
import { ExternalLink, Filter, Globe, HeartHandshake, Plus, RefreshCw, Search, TrendingUp, Users, Wallet } from 'lucide-react';
import { SectionHeader } from '../components/SectionHeader';
import { cx } from '../../utils/theme';
import { adminFetch } from '../utils/api';

interface Partner {
  id: string;
  name: string;
  type: string;
  contact?: string | null;
  status: string;
  createdAt: string;
  updatedAt?: string;
}

const normalizeStatus = (status: string) => status.toUpperCase().replace(/\s+/g, '_');
const normalizeType = (type: string) => type.toUpperCase().replace(/\s+/g, '_');
const healthForPartner = (partner: Partner) => {
  const status = normalizeStatus(partner.status);
  if (status === 'ACTIVE') return 96;
  if (status === 'RENEWAL') return 58;
  if (status === 'PENDING') return 72;
  return 45;
};

export const PartnershipsPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPartners = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminFetch<{ partners: Partner[] }>('/business/partners');
      setPartners(data.partners || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load partners');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPartners();
  }, []);

  const filteredPartners = useMemo(() => {
    const needle = searchQuery.trim().toLowerCase();
    if (!needle) return partners;
    return partners.filter((partner) =>
      [partner.name, partner.type, partner.contact, partner.status].some((value) => value?.toLowerCase().includes(needle))
    );
  }, [partners, searchQuery]);

  const activeCount = partners.filter((partner) => normalizeStatus(partner.status) === 'ACTIVE').length;
  const typeCount = new Set(partners.map((partner) => normalizeType(partner.type))).size;
  const renewalCount = partners.filter((partner) => normalizeStatus(partner.status) === 'RENEWAL').length;
  const growth = partners.length > 0 ? Math.round((activeCount / partners.length) * 100) : 0;

  const getStatusStyles = (statusValue: string) => {
    const status = normalizeStatus(statusValue);
    switch (status) {
      case 'ACTIVE': return 'bg-[var(--admin-green-dim)] text-[var(--admin-green)] border-[var(--admin-green)]/20 shadow-[0_0_10px_rgba(34,197,94,0.1)]';
      case 'PENDING': return 'bg-[var(--admin-text-3)]/10 text-[var(--admin-text-3)] border-[var(--admin-text-3)]/20';
      case 'RENEWAL': return 'bg-[var(--admin-red-dim)] text-[var(--admin-red)] border-[var(--admin-red)]/20 shadow-[0_0_10px_rgba(239,68,68,0.1)]';
      default: return 'bg-[var(--admin-surface-3)] text-[var(--admin-text-3)]';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <SectionHeader
        title="Partnerships"
        description="Manage affiliate programs, white-label partners, and enterprise accounts."
        parentPage="Operations / Partnerships"
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Partners', value: String(partners.length), icon: HeartHandshake, sub: 'Live records' },
          { label: 'Active Partners', value: String(activeCount), icon: Wallet, sub: 'Active accounts' },
          { label: 'Partner Types', value: String(typeCount), icon: TrendingUp, sub: 'Classifications' },
          { label: 'Active Ratio', value: `${growth}%`, icon: Globe, sub: `${renewalCount} renewal watch` },
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
              <Users size={20} className="text-[var(--admin-accent)]" /> Alliance Entities
            </h3>
            <div className="relative group">
              <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--admin-text-3)] group-focus-within:text-[var(--admin-accent)] transition-colors" />
              <input 
                type="text" 
                placeholder="Search alliances..." 
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
            <button onClick={loadPartners} className="flex items-center gap-2 px-4 py-2 bg-[var(--admin-surface-3)] border border-[var(--admin-border)] rounded-xl text-[13px] font-bold text-[var(--admin-text-2)] hover:text-[var(--admin-accent)] transition-colors">
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Sync
            </button>
            <button className="flex items-center gap-2 px-5 py-2 bg-[var(--admin-accent)] text-black rounded-xl text-[13px] font-black hover:bg-[var(--admin-accent)]/90 transition-all shadow-[0_0_20px_rgba(255,191,0,0.2)]">
              <Plus size={16} /> ADD ALLIANCE
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 flex items-center justify-center gap-2 text-[var(--admin-text-3)]"><RefreshCw className="animate-spin" size={18} /> Loading alliances...</div>
          ) : filteredPartners.length === 0 ? (
            <div className="p-12 text-center text-[var(--admin-text-3)]">No partner records found.</div>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[var(--admin-surface-2)]/30 border-b border-[var(--admin-border)]">
                  <th className="px-8 py-4 text-left text-[11px] font-black text-[var(--admin-text-3)] uppercase tracking-[0.1em]">Entity Vector</th>
                  <th className="px-8 py-4 text-left text-[11px] font-black text-[var(--admin-text-3)] uppercase tracking-[0.1em]">Classification</th>
                  <th className="px-8 py-4 text-left text-[11px] font-black text-[var(--admin-text-3)] uppercase tracking-[0.1em]">Created</th>
                  <th className="px-8 py-4 text-left text-[11px] font-black text-[var(--admin-text-3)] uppercase tracking-[0.1em]">Status Signal</th>
                  <th className="px-8 py-4 text-right text-[11px] font-black text-[var(--admin-text-3)] uppercase tracking-[0.1em]">System Health</th>
                  <th className="px-8 py-4 text-right text-[11px] font-black text-[var(--admin-text-3)] uppercase tracking-[0.1em]">Nexus</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--admin-border)]">
                {filteredPartners.map((partner) => {
                  const health = healthForPartner(partner);
                  return (
                    <tr key={partner.id} className="group hover:bg-[var(--admin-surface-2)]/20 transition-colors">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-[var(--admin-surface-3)] flex items-center justify-center font-bold text-[var(--admin-accent)] border border-[var(--admin-border)] relative overflow-hidden group-hover:border-[var(--admin-accent)]/50 transition-colors">
                            <div className="absolute inset-0 bg-gradient-to-br from-[var(--admin-accent)]/5 to-transparent" />
                            {partner.name.charAt(0)}
                          </div>
                          <div>
                            <div className="text-[14px] font-black text-[var(--admin-text)] tracking-tight group-hover:text-[var(--admin-accent)] transition-colors">{partner.name}</div>
                            <div className="text-[12px] text-[var(--admin-text-3)] font-medium">{partner.contact || 'No contact saved'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="text-[13px] font-bold text-[var(--admin-text-2)]">{normalizeType(partner.type)}</div>
                        <div className="text-[10px] font-black text-[var(--admin-accent)] uppercase tracking-wider">Partner record</div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="text-[15px] font-[var(--admin-font-mono)] font-bold text-[var(--admin-text)] tracking-tighter">
                          {new Date(partner.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className={cx(
                          'inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black border uppercase tracking-wider',
                          getStatusStyles(partner.status)
                        )}>
                          {normalizeStatus(partner.status)}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex items-center justify-end gap-3 translate-y-1">
                          <div className="w-24 h-1.5 bg-[var(--admin-surface-3)] rounded-full overflow-hidden border border-white/5">
                            <div 
                              className={cx(
                                'h-full transition-all duration-1000',
                                health > 80 ? 'bg-[var(--admin-green)] shadow-[0_0_10px_rgba(34,197,94,0.3)]' : 
                                health > 50 ? 'bg-[var(--admin-accent)] shadow-[0_0_10px_rgba(255,191,0,0.3)]' : 
                                'bg-[var(--admin-red)] shadow-[0_0_10px_rgba(239,68,68,0.3)]'
                              )}
                              style={{ width: `${health}%` }}
                            />
                          </div>
                          <span className="text-[11px] font-black text-[var(--admin-text)] font-[var(--admin-font-mono)]">{health}%</span>
                        </div>
                        <div className="text-[9px] font-black text-[var(--admin-text-3)] uppercase tracking-widest mt-1">Record Health</div>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <button className="p-2.5 bg-[var(--admin-surface-3)] border border-[var(--admin-border)] rounded-xl text-[var(--admin-text-3)] hover:text-[var(--admin-accent)] hover:bg-[var(--admin-accent)]/5 hover:border-[var(--admin-accent)]/20 transition-all">
                          <ExternalLink size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
