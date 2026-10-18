import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { MoreHorizontal, MessageCircle, UserCheck, UserX } from 'lucide-react';
import { API_BASE_URL } from '../../lib/apiConfig';
import { usePageVisibility } from '../../hooks/usePageVisibility';

// Notion color palette
const colors = {
  bgPrimary: '#FFFFFF',
  bgSecondary: '#F7F7F5',
  bgTertiary: '#EFEFEF',
  bgHover: '#EAEAE5',
  textPrimary: '#37352F',
  textSecondary: '#787774',
  textTertiary: '#9B9A97',
  borderLight: '#E9E9E8',
  borderMedium: '#D3D1CB',
  accentBlue: '#0066FF',
  accentBlueLight: '#E3F2FD',
  accentGreen: '#007A5A',
  accentGreenLight: '#E8F5E9',
  accentOrange: '#FF9F2E',
  accentOrangeLight: '#FFF3E0',
  accentRed: '#FF3B30',
  accentRedLight: '#FFEBEE',
};

interface Editor {
  id: string;
  name: string;
  tier: string;
  status: string;
  lastActiveAt: string | null;
  metrics: {
    currentLoad: number;
    capacity: number;
    avgTAT: string;
    qualityScore: number;
    qualityTrend: string;
    utilization: number;
    firstPassQCRate: number;
  };
}

interface EditorsData {
  editors: Editor[];
  totalCount: number;
  onlineCount: number;
}

const getStatusStyle = (status: string) => {
  switch (status) {
    case 'online':
      return { color: colors.accentGreen, bg: colors.accentGreenLight, label: 'Online' };
    case 'offline':
      return { color: colors.accentRed, bg: colors.accentRedLight, label: 'Offline' };
    case 'on_break':
      return { color: colors.accentOrange, bg: colors.accentOrangeLight, label: 'On Break' };
    case 'away':
      return { color: colors.textSecondary, bg: colors.bgTertiary, label: 'Away' };
    default:
      return { color: colors.textSecondary, bg: colors.bgTertiary, label: status };
  }
};

const getQualityTrend = (trend: string) => {
  switch (trend) {
    case 'up':
      return { icon: '↑', color: colors.accentGreen };
    case 'down':
      return { icon: '↓', color: colors.accentRed };
    default:
      return { icon: '→', color: colors.textTertiary };
  }
};

const getQualityColor = (score: number) => {
  if (score >= 95) return colors.accentGreen;
  if (score >= 90) return colors.accentOrange;
  return colors.accentRed;
};

const getUtilizationColor = (utilization: number) => {
  if (utilization >= 80) return colors.accentGreen;
  if (utilization >= 50) return colors.accentOrange;
  return colors.accentRed;
};

// Memoized Editor Row component
const EditorRow = React.memo(({ editor }: { editor: Editor }) => {
  const statusStyle = useMemo(() => getStatusStyle(editor.status), [editor.status]);
  const qualityColor = useMemo(() => getQualityColor(editor.metrics.qualityScore), [editor.metrics.qualityScore]);
  const utilizationColor = useMemo(() => getUtilizationColor(editor.metrics.utilization), [editor.metrics.utilization]);
  const qualityTrend = useMemo(() => getQualityTrend(editor.metrics.qualityTrend), [editor.metrics.qualityTrend]);

  return (
    <tr className="transition-colors" style={{ borderBottom: `1px solid ${colors.borderLight}` }}>
      {/* Editor Name */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-[14px] font-medium flex-shrink-0"
            style={{ background: colors.bgTertiary, color: colors.textSecondary }}
          >
            {editor.name.charAt(0)}
          </div>
          <div>
            <div
              className="text-[15px] font-medium"
              style={{ color: colors.textPrimary }}
            >
              {editor.name}
            </div>
            <div
              className="text-[14px] capitalize"
              style={{ color: colors.textTertiary }}
            >
              {editor.tier}
            </div>
          </div>
        </div>
      </td>

      {/* Current Load */}
      <td className="px-4 py-3">
        <div
          className="text-[15px]"
          style={{ color: colors.textPrimary }}
        >
          {editor.metrics.currentLoad} / {editor.metrics.capacity}
        </div>
        <div
          className="text-[14px]"
          style={{ color: colors.textTertiary }}
        >
          images
        </div>
      </td>

      {/* Avg TAT */}
      <td className="px-4 py-3">
        <div
          className="text-[15px]"
          style={{ color: colors.textPrimary }}
        >
          {editor.metrics.avgTAT}
        </div>
      </td>

      {/* Quality % */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-1">
          <span
            className="text-[15px] font-medium"
            style={{ color: qualityColor }}
          >
            {editor.metrics.qualityScore}%
          </span>
          <span
            className="text-[14px] font-medium"
            style={{ color: qualityTrend.color }}
          >
            {qualityTrend.icon}
          </span>
        </div>
      </td>

      {/* Status */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ background: statusStyle.color }}
          />
          <span
            className="text-[14px] capitalize"
            style={{ color: colors.textSecondary }}
          >
            {statusStyle.label.replace('_', ' ')}
          </span>
        </div>
      </td>

      {/* Utilization */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: colors.bgTertiary }}>
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${editor.metrics.utilization}%`,
                background: utilizationColor,
              }}
            />
          </div>
          <span
            className="text-[14px] w-8 text-right"
            style={{ color: colors.textTertiary }}
          >
            {editor.metrics.utilization}%
          </span>
        </div>
      </td>

      {/* Actions */}
      <td className="px-4 py-3">
        <div className="relative group">
          <button
            className="p-1 rounded transition-colors"
            style={{ color: colors.textTertiary }}
            onMouseOver={(e) => e.currentTarget.style.background = colors.bgHover}
            onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <MoreHorizontal size={16} />
          </button>
          <div
            className="absolute right-0 top-full mt-1 rounded-lg shadow-lg py-1 z-10 hidden group-hover:block"
            style={{
              background: colors.bgPrimary,
              borderColor: colors.borderLight,
              borderWidth: '1px',
            }}
          >
            <button
              className="w-full px-3 py-1.5 text-left text-[14px] flex items-center gap-2 transition-colors"
              style={{ color: colors.textSecondary }}
              onMouseOver={(e) => e.currentTarget.style.background = colors.bgHover}
              onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <MessageCircle size={12} />
              Send Message
            </button>
            <button
              className="w-full px-3 py-1.5 text-left text-[14px] flex items-center gap-2 transition-colors"
              style={{ color: colors.textSecondary }}
              onMouseOver={(e) => e.currentTarget.style.background = colors.bgHover}
              onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <UserCheck size={12} />
              View Profile
            </button>
            <button
              className="w-full px-3 py-1.5 text-left text-[14px] flex items-center gap-2 transition-colors"
              style={{ color: colors.textSecondary }}
              onMouseOver={(e) => e.currentTarget.style.background = colors.bgHover}
              onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <UserX size={12} />
              Pause Availability
            </button>
          </div>
        </div>
      </td>
    </tr>
  );
});

EditorRow.displayName = 'EditorRow';

export const ActiveEditorsTable: React.FC = () => {
  const [data, setData] = useState<EditorsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    status: '',
    tier: '',
    sort: 'name',
    order: 'asc',
  });

  const fetchEditors = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filter.status) params.append('status', filter.status);
      if (filter.tier) params.append('tier', filter.tier);
      params.append('sort', filter.sort);
      params.append('order', filter.order);

      const response = await fetch(`${API_BASE_URL}/editors?${params}`);
      if (!response.ok) throw new Error('Failed to fetch editors');
      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error('Error fetching editors:', err);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  const isVisible = usePageVisibility();

  useEffect(() => {
    fetchEditors();
    
    // Only poll when the page is visible to reduce server overhead
    if (!isVisible) return;
    
    const interval = setInterval(fetchEditors, 15000);
    return () => clearInterval(interval);
  }, [fetchEditors, isVisible]);

  if (loading) {
    return (
      <div
        className="rounded-lg border overflow-hidden"
        style={{ background: colors.bgPrimary, borderColor: colors.borderLight }}
      >
        <div className="h-96 animate-pulse" style={{ background: colors.bgTertiary }} />
      </div>
    );
  }

  return (
    <div
      className="rounded-lg border overflow-hidden"
      style={{ background: colors.bgPrimary, borderColor: colors.borderLight }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: colors.borderLight }}
      >
        <div className="flex items-center gap-3">
          <h3
            className="text-[14px] font-semibold"
            style={{ color: colors.textPrimary }}
          >
            Active Editors
          </h3>
          <span
            className="text-[14px]"
            style={{ color: colors.textTertiary }}
          >
            {data?.onlineCount || 0} online
          </span>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filter.status}
            onChange={(e) => setFilter({ ...filter, status: e.target.value })}
            className="px-3 py-1.5 rounded-lg text-[15px] focus:outline-none focus:ring-2 transition-all"
            style={{
              background: colors.bgPrimary,
              borderColor: colors.borderLight,
              color: colors.textPrimary,
            }}
          >
            <option value="">All Status</option>
            <option value="online">Online</option>
            <option value="offline">Offline</option>
            <option value="on_break">On Break</option>
            <option value="away">Away</option>
          </select>
          <select
            value={filter.tier}
            onChange={(e) => setFilter({ ...filter, tier: e.target.value })}
            className="px-3 py-1.5 rounded-lg text-[15px] focus:outline-none focus:ring-2 transition-all"
            style={{
              background: colors.bgPrimary,
              borderColor: colors.borderLight,
              color: colors.textPrimary,
            }}
          >
            <option value="">All Tiers</option>
            <option value="junior">Junior</option>
            <option value="senior">Senior</option>
            <option value="specialist">Specialist</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr
              style={{ background: colors.bgSecondary, borderBottom: `1px solid ${colors.borderLight}` }}
            >
              <th className="text-left px-4 py-3 text-[14px] font-medium" style={{ color: colors.textSecondary }}>
                Editor
              </th>
              <th className="text-left px-4 py-3 text-[14px] font-medium" style={{ color: colors.textSecondary }}>
                Current Load
              </th>
              <th className="text-left px-4 py-3 text-[14px] font-medium" style={{ color: colors.textSecondary }}>
                Avg TAT
              </th>
              <th className="text-left px-4 py-3 text-[14px] font-medium" style={{ color: colors.textSecondary }}>
                Quality %
              </th>
              <th className="text-left px-4 py-3 text-[14px] font-medium" style={{ color: colors.textSecondary }}>
                Status
              </th>
              <th className="text-left px-4 py-3 text-[14px] font-medium" style={{ color: colors.textSecondary }}>
                Utilization
              </th>
              <th className="w-10 px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {data?.editors.map((editor) => (
              <EditorRow key={editor.id} editor={editor} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
