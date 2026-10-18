import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle, Clock, FileText, RefreshCw, Search } from 'lucide-react';
import { adminFetch } from '../utils/api';

const colors = {
  bgPrimary: '#FFFFFF', bgSecondary: '#F7F7F5', bgTertiary: '#EFEFEF',
  textPrimary: '#37352F', textSecondary: '#787774', textTertiary: '#9B9A97',
  borderLight: '#E9E9E8', accentGreen: '#007A5A', accentOrange: '#FF9F2E', accentBlue: '#0066FF',
  accentRed: '#FF3B30',
};

interface Contract {
  id: string;
  title: string;
  type: string;
  status: string;
  expiresAt?: string | null;
  createdAt: string;
  updatedAt?: string;
}

const normalizeStatus = (contract: Contract) => {
  if (contract.status === 'signed' && contract.expiresAt) {
    const days = (new Date(contract.expiresAt).getTime() - Date.now()) / 86400000;
    if (days >= 0 && days <= 30) return 'expiring_soon';
  }
  return contract.status || 'draft';
};

const formatDate = (value?: string | null) => value ? new Date(value).toLocaleDateString() : '-';

export const NDAManagementPage: React.FC = () => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  const loadContracts = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminFetch<{ contracts: Contract[] }>('/operations/nda/contracts');
      setContracts(data.contracts || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load contracts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContracts();
  }, []);

  const filteredContracts = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return contracts;
    return contracts.filter((contract) =>
      [contract.title, contract.type, contract.status].some((value) => value?.toLowerCase().includes(needle))
    );
  }, [contracts, query]);

  const summary = useMemo(() => {
    const active = contracts.filter((contract) => ['signed', 'active'].includes(contract.status)).length;
    const expiring = contracts.filter((contract) => normalizeStatus(contract) === 'expiring_soon').length;
    const drafts = contracts.filter((contract) => contract.status === 'draft').length;
    const withExpiry = contracts.filter((contract) => !!contract.expiresAt).length;
    return { active, expiring, drafts, withExpiry };
  }, [contracts]);

  return (
    <div className="p-4 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-4 gap-4">
        <div>
          <h1 className="text-[20px] font-bold" style={{ color: colors.textPrimary }}>NDA & Contract Management</h1>
          <p className="text-[14px]" style={{ color: colors.textTertiary }}>Track signed agreements and contract expiry from live contract records</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: colors.textTertiary }} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search contracts..."
              className="pl-8 pr-3 py-2 text-[14px] rounded-md border focus:outline-none w-64"
              style={{ background: colors.bgSecondary, borderColor: colors.borderLight, color: colors.textPrimary }}
            />
          </div>
          <button onClick={loadContracts} className="px-4 py-2 text-[15px] font-medium rounded-md flex items-center gap-2 border" style={{ borderColor: colors.borderLight, color: colors.textPrimary }}>
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button className="px-4 py-2 text-[15px] font-medium rounded-md flex items-center gap-2" style={{ background: colors.textPrimary, color: '#FFF' }}><FileText size={16} /> New Contract</button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-4">
        <div className="p-4 rounded-md border" style={{ background: colors.bgPrimary, borderColor: colors.borderLight }}>
          <div className="flex items-center gap-2 mb-2"><CheckCircle size={16} style={{ color: colors.accentGreen }} /><span className="text-[14px] font-medium" style={{ color: colors.textSecondary }}>Active Contracts</span></div>
          <div className="text-[24px] font-semibold" style={{ color: colors.textPrimary }}>{summary.active}</div>
        </div>
        <div className="p-4 rounded-md border" style={{ background: colors.bgPrimary, borderColor: colors.borderLight }}>
          <div className="flex items-center gap-2 mb-2"><Clock size={16} style={{ color: colors.accentOrange }} /><span className="text-[14px] font-medium" style={{ color: colors.textSecondary }}>Expiring Soon</span></div>
          <div className="text-[24px] font-semibold" style={{ color: colors.accentOrange }}>{summary.expiring}</div>
        </div>
        <div className="p-4 rounded-md border" style={{ background: colors.bgPrimary, borderColor: colors.borderLight }}>
          <div className="flex items-center gap-2 mb-2"><FileText size={16} style={{ color: colors.textSecondary }} /><span className="text-[14px] font-medium" style={{ color: colors.textSecondary }}>Drafts</span></div>
          <div className="text-[24px] font-semibold" style={{ color: colors.textPrimary }}>{summary.drafts}</div>
        </div>
        <div className="p-4 rounded-md border" style={{ background: colors.bgPrimary, borderColor: colors.borderLight }}>
          <div className="flex items-center gap-2 mb-2"><AlertCircle size={16} style={{ color: colors.accentBlue }} /><span className="text-[14px] font-medium" style={{ color: colors.textSecondary }}>Tracked Expiry</span></div>
          <div className="text-[24px] font-semibold" style={{ color: colors.textPrimary }}>{summary.withExpiry}</div>
        </div>
      </div>

      {error && <div className="mb-4 rounded-md border border-red-100 bg-red-50 px-4 py-3 text-[14px] text-red-700">{error}</div>}

      <div className="rounded-md border overflow-hidden" style={{ borderColor: colors.borderLight, background: colors.bgPrimary }}>
        {loading ? (
          <div className="p-10 flex items-center justify-center gap-2" style={{ color: colors.textSecondary }}><RefreshCw size={18} className="animate-spin" /> Loading contracts...</div>
        ) : filteredContracts.length === 0 ? (
          <div className="p-10 text-center" style={{ color: colors.textSecondary }}>No contracts found.</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ background: colors.bgSecondary }}>
                <th className="text-left px-4 py-3 text-[14px] font-medium" style={{ color: colors.textSecondary }}>Type</th>
                <th className="text-left px-4 py-3 text-[14px] font-medium" style={{ color: colors.textSecondary }}>Contract</th>
                <th className="text-left px-4 py-3 text-[14px] font-medium" style={{ color: colors.textSecondary }}>Created</th>
                <th className="text-left px-4 py-3 text-[14px] font-medium" style={{ color: colors.textSecondary }}>Expires</th>
                <th className="text-left px-4 py-3 text-[14px] font-medium" style={{ color: colors.textSecondary }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredContracts.map((contract) => {
                const status = normalizeStatus(contract);
                return (
                  <tr key={contract.id} className="border-b" style={{ borderColor: colors.borderLight }}>
                    <td className="px-4 py-3"><span className="text-[14px] px-2 py-1 rounded uppercase" style={{ background: colors.bgTertiary, color: colors.textSecondary }}>{contract.type}</span></td>
                    <td className="px-4 py-3 text-[15px] font-medium" style={{ color: colors.textPrimary }}>{contract.title}</td>
                    <td className="px-4 py-3 text-[14px]" style={{ color: colors.textSecondary }}>{formatDate(contract.createdAt)}</td>
                    <td className="px-4 py-3 text-[14px]" style={{ color: status === 'expiring_soon' ? colors.accentRed : colors.textSecondary }}>{formatDate(contract.expiresAt)}</td>
                    <td className="px-4 py-3"><span className={`text-[14px] px-2 py-1 rounded capitalize ${status === 'signed' || status === 'active' ? 'bg-green-100 text-green-700' : status === 'expiring_soon' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>{status.replace('_', ' ')}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
