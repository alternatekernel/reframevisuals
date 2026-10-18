import React, { useState, useEffect, useCallback } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { adminFetch } from '../utils/api';
import { useToast } from '../ToastContext';
import {
  FileText, Globe, Mail, Image, Tag, TrendingUp, TrendingDown,
  CheckCircle, AlertCircle, Clock, Star, BarChart2, RefreshCw,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface AnalyticsOverview {
  blog: {
    total: number;
    published: number;
    draft: number;
    scheduled: number;
    featured: number;
    withMetaDescription: number;
    withMetaTitle: number;
    withFocusKeywords: number;
    byCategory: { name: string; count: number }[];
    byMonth: { month: string; count: number }[];
    geoScopeBreakdown: { scope: string; count: number }[];
    schemaTypeBreakdown: { type: string; count: number }[];
    hreflangBreakdown: { lang: string; count: number }[];
    avgReadTime: number;
  };
  pages: {
    total: number;
    published: number;
    draft: number;
    withMetaDescription: number;
    withMetaTitle: number;
    withFocusKeywords: number;
    geoBreakdown: { scope: string; count: number }[];
  };
  newsletter: {
    total: number;
    confirmed: number;
    pending: number;
    byMonth: { month: string; total: number; confirmed: number }[];
  };
  media: { total: number };
  content: {
    categories: { name: string; count: number }[];
    topTags: { name: string; count: number }[];
    totalTags: number;
  };
}

interface HeroMetrics {
  slaHealth: { value: number; trend: string };
  capacityUtilization: { value: number };
  activeOrders: { value: number };
  weeklyRevenue: { value: number; trend: string };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const pct = (n: number, total: number) =>
  total === 0 ? 0 : Math.round((n / total) * 100);

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6', '#14b8a6'];

const GEO_COLOR: Record<string, string> = {
  global:   '#6366f1',
  regional: '#10b981',
  local:    '#f59e0b',
  none:     '#94a3b8',
  'not set': '#e2e8f0',
};

// ── Sub-components ────────────────────────────────────────────────────────────

const KPICard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  trend?: 'up' | 'down' | 'neutral';
  accent?: string;
}> = ({ icon, label, value, sub, trend, accent = '#6366f1' }) => (
  <div className="an-metric-card" style={{ borderTop: `3px solid ${accent}` }}>
    <div className="flex items-center justify-between mb-2">
      <div className="an-metric-label">{label}</div>
      <span style={{ color: accent, opacity: 0.7 }}>{icon}</span>
    </div>
    <div className="an-metric-value">{value}</div>
    {sub && (
      <div className="flex items-center gap-1 mt-1">
        {trend === 'up'   && <TrendingUp size={11} className="text-emerald-500" />}
        {trend === 'down' && <TrendingDown size={11} className="text-red-400" />}
        <span className="an-metric-sub">{sub}</span>
      </div>
    )}
  </div>
);

const CoverageBar: React.FC<{ label: string; value: number; total: number; color?: string }> = ({
  label, value, total, color = '#6366f1',
}) => {
  const p = pct(value, total);
  return (
    <div className="mb-3">
      <div className="flex justify-between text-[11px] mb-1">
        <span className="text-gray-600">{label}</span>
        <span className="font-semibold text-gray-800">{value}/{total} <span className="text-gray-400 font-normal">({p}%)</span></span>
      </div>
      <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${p}%`, background: color }}
        />
      </div>
    </div>
  );
};

const SectionTitle: React.FC<{ icon: React.ReactNode; title: string; sub?: string }> = ({
  icon, title, sub,
}) => (
  <div className="flex items-center gap-2 mb-4">
    <span className="text-indigo-500">{icon}</span>
    <div>
      <div className="font-bold text-[13px] text-gray-800">{title}</div>
      {sub && <div className="text-[11px] text-gray-400">{sub}</div>}
    </div>
  </div>
);

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-white rounded-xl border border-gray-200 p-5 ${className}`}>{children}</div>
);

// ── Custom Tooltip ────────────────────────────────────────────────────────────

const ChartTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-[11px]">
      <div className="font-semibold text-gray-700 mb-1">{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-gray-500">{p.name ?? p.dataKey}:</span>
          <span className="font-semibold text-gray-800">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────

export const AnalyticsPage: React.FC = () => {
  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [hero, setHero] = useState<HeroMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const { showToast } = useToast();

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      adminFetch('/analytics/overview'),
      adminFetch('/metrics/hero'),
    ])
      .then(([analytics, metrics]) => {
        setData(analytics);
        setHero(metrics);
        setLastUpdated(new Date());
      })
      .catch(() => showToast('Error', 'Failed to load analytics', 'error'))
      .finally(() => setLoading(false));
  }, [showToast]);

  useEffect(() => { load(); }, [load]);

  const handleExport = () => {
    if (!data) return;
    const b = data.blog;
    const p = data.pages;
    const n = data.newsletter;
    const rows = [
      ['Section', 'Metric', 'Value'],
      ['Blog', 'Total Posts', b.total],
      ['Blog', 'Published', b.published],
      ['Blog', 'Draft', b.draft],
      ['Blog', 'Scheduled', b.scheduled],
      ['Blog', 'Featured', b.featured],
      ['Blog', 'With Meta Description', b.withMetaDescription],
      ['Blog', 'With Focus Keywords', b.withFocusKeywords],
      ['Blog', 'Avg Read Time (min)', b.avgReadTime],
      ['Pages', 'Total Pages', p.total],
      ['Pages', 'Published', p.published],
      ['Pages', 'With Meta Description', p.withMetaDescription],
      ['Newsletter', 'Total Subscribers', n.total],
      ['Newsletter', 'Confirmed', n.confirmed],
      ['Newsletter', 'Pending', n.pending],
      ['Media', 'Total Assets', data.media.total],
    ];
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `platform-analytics-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Export Complete', 'Analytics CSV downloaded', 'success');
  };

  const b = data?.blog;
  const pg = data?.pages;
  const nl = data?.newsletter;

  return (
    <div className="pb-12">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="an-page-header">
        <div className="an-page-title">
          <span className="ph-icon">
            <BarChart2 size={16} />
          </span>
          Platform Analytics
        </div>
        <div className="an-page-desc">
          Blog · SEO · Geo · Newsletter · Content · Platform performance
          {lastUpdated && (
            <span className="ml-2 text-gray-400">
              · Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
        <div className="an-page-actions">
          <button
            className="an-btn an-btn-ghost an-btn-sm flex items-center gap-1.5"
            onClick={load}
            disabled={loading}
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button className="an-btn an-btn-ghost an-btn-sm" onClick={handleExport} disabled={!data}>
            Export CSV
          </button>
        </div>
      </div>

      {loading && !data ? (
        <div className="flex items-center justify-center h-64 text-gray-400 text-sm">Loading analytics…</div>
      ) : data ? (
        <div className="space-y-6">

          {/* ── KPI Overview ───────────────────────────────────────────── */}
          <div className="an-metrics-row" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
            <KPICard
              icon={<FileText size={15} />}
              label="Blog Posts"
              value={b!.total}
              sub={`${b!.published} published · ${b!.draft} draft`}
              accent="#6366f1"
            />
            <KPICard
              icon={<Globe size={15} />}
              label="Pages"
              value={`${pg!.published}/${pg!.total}`}
              sub="published / total"
              accent="#3b82f6"
            />
            <KPICard
              icon={<Mail size={15} />}
              label="Subscribers"
              value={nl!.confirmed}
              sub={`${nl!.pending} pending confirmation`}
              trend={nl!.confirmed > 0 ? 'up' : 'neutral'}
              accent="#10b981"
            />
            <KPICard
              icon={<CheckCircle size={15} />}
              label="Blog SEO"
              value={`${pct(b!.withMetaDescription, b!.total)}%`}
              sub={`${b!.withMetaDescription}/${b!.total} with meta desc`}
              trend={pct(b!.withMetaDescription, b!.total) >= 80 ? 'up' : 'down'}
              accent={pct(b!.withMetaDescription, b!.total) >= 80 ? '#10b981' : '#f59e0b'}
            />
            <KPICard
              icon={<Star size={15} />}
              label="Featured Posts"
              value={b!.featured}
              sub={`of ${b!.total} total posts`}
              accent="#f59e0b"
            />
            <KPICard
              icon={<Image size={15} />}
              label="Media Assets"
              value={data.media.total}
              sub="in media library"
              accent="#8b5cf6"
            />
            <KPICard
              icon={<Clock size={15} />}
              label="Avg Read Time"
              value={b!.avgReadTime ? `${b!.avgReadTime} min` : '—'}
              sub="across all posts"
              accent="#14b8a6"
            />
            <KPICard
              icon={<Tag size={15} />}
              label="Tags"
              value={data.content.totalTags}
              sub={`${data.content.categories.length} categories`}
              accent="#ec4899"
            />
          </div>

          {/* ── Blog Performance ────────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Monthly trend */}
            <Card className="lg:col-span-2">
              <SectionTitle icon={<TrendingUp size={14} />} title="Posts Published per Month" sub="Last 12 months" />
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={b!.byMonth} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
                  <defs>
                    <linearGradient id="blogGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="count"
                    name="Posts"
                    stroke="#6366f1"
                    strokeWidth={2}
                    fill="url(#blogGrad)"
                    dot={{ r: 3, fill: '#6366f1', strokeWidth: 0 }}
                    activeDot={{ r: 5 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Card>

            {/* By category */}
            <Card>
              <SectionTitle icon={<FileText size={14} />} title="Posts by Category" />
              {b!.byCategory.length === 0 ? (
                <p className="text-[12px] text-gray-400">No categories yet.</p>
              ) : (
                <div className="space-y-2">
                  {b!.byCategory.slice(0, 8).map((c, i) => (
                    <div key={c.name} className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="text-[11px] text-gray-600 flex-1 truncate">{c.name}</span>
                      <span className="text-[11px] font-semibold text-gray-800">{c.count}</span>
                      <div className="w-12 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${pct(c.count, b!.total)}%`,
                            background: COLORS[i % COLORS.length],
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* ── Blog Status Distribution ─────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <SectionTitle icon={<BarChart2 size={14} />} title="Content Status Distribution" sub="Blog posts" />
              <div className="flex items-center gap-4">
                <div style={{ width: 140, height: 140 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Published', value: b!.published },
                          { name: 'Draft',     value: b!.draft },
                          { name: 'Scheduled', value: b!.scheduled },
                        ].filter(d => d.value > 0)}
                        cx="50%"
                        cy="50%"
                        innerRadius={38}
                        outerRadius={60}
                        dataKey="value"
                        strokeWidth={2}
                        stroke="#fff"
                      >
                        <Cell fill="#10b981" />
                        <Cell fill="#94a3b8" />
                        <Cell fill="#f59e0b" />
                      </Pie>
                      <Tooltip content={<ChartTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-2">
                  {[
                    { label: 'Published', value: b!.published, color: '#10b981' },
                    { label: 'Draft',     value: b!.draft,     color: '#94a3b8' },
                    { label: 'Scheduled', value: b!.scheduled, color: '#f59e0b' },
                  ].map(s => (
                    <div key={s.label} className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: s.color }} />
                      <span className="text-[11px] text-gray-600 flex-1">{s.label}</span>
                      <span className="text-[12px] font-bold text-gray-800">{s.value}</span>
                      <span className="text-[10px] text-gray-400">({pct(s.value, b!.total)}%)</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* Top tags */}
            <Card>
              <SectionTitle icon={<Tag size={14} />} title="Top Tags" sub={`${data.content.totalTags} total tags`} />
              {data.content.topTags.length === 0 ? (
                <p className="text-[12px] text-gray-400">No tags yet.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {data.content.topTags.map((t, i) => (
                    <span
                      key={t.name}
                      className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                      style={{
                        background: `${COLORS[i % COLORS.length]}18`,
                        color: COLORS[i % COLORS.length],
                        border: `1px solid ${COLORS[i % COLORS.length]}30`,
                      }}
                    >
                      {t.name} {t.count > 0 && <span className="opacity-60">·{t.count}</span>}
                    </span>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* ── SEO Health ──────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Coverage scores */}
            <Card>
              <SectionTitle icon={<CheckCircle size={14} />} title="SEO Coverage" sub="Blog posts" />
              <CoverageBar label="Meta Description" value={b!.withMetaDescription} total={b!.total}  color="#6366f1" />
              <CoverageBar label="Meta Title"       value={b!.withMetaTitle}       total={b!.total}  color="#3b82f6" />
              <CoverageBar label="Focus Keywords"   value={b!.withFocusKeywords}   total={b!.total}  color="#10b981" />
              <div className="mt-4 pt-3 border-t border-gray-100">
                <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Pages</div>
                <CoverageBar label="Meta Description" value={pg!.withMetaDescription} total={pg!.total} color="#f59e0b" />
                <CoverageBar label="Focus Keywords"   value={pg!.withFocusKeywords}   total={pg!.total} color="#ec4899" />
              </div>
            </Card>

            {/* Geo scope */}
            <Card>
              <SectionTitle icon={<Globe size={14} />} title="Geo Scope Targeting" sub="Published posts" />
              {b!.geoScopeBreakdown.length === 0 ? (
                <p className="text-[12px] text-gray-400">No data yet.</p>
              ) : (
                <>
                  <div style={{ height: 140 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={b!.geoScopeBreakdown}
                          dataKey="count"
                          nameKey="scope"
                          cx="50%"
                          cy="50%"
                          innerRadius={35}
                          outerRadius={58}
                          strokeWidth={2}
                          stroke="#fff"
                        >
                          {b!.geoScopeBreakdown.map((entry) => (
                            <Cell key={entry.scope} fill={GEO_COLOR[entry.scope] ?? '#94a3b8'} />
                          ))}
                        </Pie>
                        <Tooltip content={<ChartTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-1 mt-1">
                    {b!.geoScopeBreakdown.map(entry => (
                      <div key={entry.scope} className="flex items-center gap-2 text-[11px]">
                        <span className="w-2 h-2 rounded-full" style={{ background: GEO_COLOR[entry.scope] ?? '#94a3b8' }} />
                        <span className="capitalize text-gray-600 flex-1">{entry.scope}</span>
                        <span className="font-semibold text-gray-800">{entry.count}</span>
                        <span className="text-gray-400">({pct(entry.count, b!.published)}%)</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </Card>

            {/* Schema & Hreflang */}
            <Card>
              <SectionTitle icon={<AlertCircle size={14} />} title="Schema & Hreflang" sub="Published posts" />
              <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Schema Type</div>
              <div className="space-y-1 mb-4">
                {b!.schemaTypeBreakdown.slice(0, 5).map((s, i) => (
                  <div key={s.type} className="flex items-center gap-2 text-[11px]">
                    <span className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="text-gray-600 flex-1 truncate">{s.type}</span>
                    <span className="font-semibold text-gray-800">{s.count}</span>
                  </div>
                ))}
                {b!.schemaTypeBreakdown.length === 0 && <p className="text-[11px] text-gray-400">None set.</p>}
              </div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Hreflang / Locale</div>
              <div className="space-y-1">
                {b!.hreflangBreakdown.slice(0, 5).map((h, i) => (
                  <div key={h.lang} className="flex items-center gap-2 text-[11px]">
                    <span className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="text-gray-600 flex-1">{h.lang}</span>
                    <span className="font-semibold text-gray-800">{h.count}</span>
                  </div>
                ))}
                {b!.hreflangBreakdown.length === 0 && <p className="text-[11px] text-gray-400">None set.</p>}
              </div>
            </Card>
          </div>

          {/* ── Newsletter ──────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Stats */}
            <Card>
              <SectionTitle icon={<Mail size={14} />} title="Newsletter" sub="Ghost-style double opt-in" />
              <div className="space-y-4">
                <div className="flex items-end gap-3">
                  <div>
                    <div className="text-[32px] font-extrabold text-gray-900 leading-none">{nl!.confirmed}</div>
                    <div className="text-[11px] text-gray-400 mt-0.5">confirmed subscribers</div>
                  </div>
                </div>
                <div className="h-px bg-gray-100" />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-[18px] font-bold text-gray-700">{nl!.total}</div>
                    <div className="text-[10px] text-gray-400">total sign-ups</div>
                  </div>
                  <div>
                    <div className="text-[18px] font-bold text-amber-500">{nl!.pending}</div>
                    <div className="text-[10px] text-gray-400">awaiting confirm</div>
                  </div>
                </div>
                {nl!.total > 0 && (
                  <div>
                    <div className="text-[10px] text-gray-400 mb-1">Confirmation rate</div>
                    <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                        style={{ width: `${pct(nl!.confirmed, nl!.total)}%` }}
                      />
                    </div>
                    <div className="text-[10px] text-gray-500 mt-0.5">{pct(nl!.confirmed, nl!.total)}% confirmed</div>
                  </div>
                )}
              </div>
            </Card>

            {/* Growth chart */}
            <Card className="lg:col-span-2">
              <SectionTitle icon={<TrendingUp size={14} />} title="Subscriber Growth" sub="Last 6 months" />
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={nl!.byMonth} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend
                    iconSize={8}
                    iconType="circle"
                    wrapperStyle={{ fontSize: 10, paddingTop: 8 }}
                  />
                  <Bar dataKey="total"     name="Sign-ups"  fill="#6366f120" stroke="#6366f1" strokeWidth={1.5} radius={[3,3,0,0]} />
                  <Bar dataKey="confirmed" name="Confirmed" fill="#10b981"   radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {/* ── Pages SEO ───────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <SectionTitle icon={<Globe size={14} />} title="Pages Overview" sub="Static site pages" />
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[
                  { label: 'Total',     value: pg!.total,     color: '#6366f1' },
                  { label: 'Published', value: pg!.published, color: '#10b981' },
                  { label: 'Draft',     value: pg!.draft,     color: '#94a3b8' },
                ].map(s => (
                  <div key={s.label} className="text-center p-3 rounded-lg" style={{ background: `${s.color}10` }}>
                    <div className="text-[22px] font-extrabold" style={{ color: s.color }}>{s.value}</div>
                    <div className="text-[10px] text-gray-500">{s.label}</div>
                  </div>
                ))}
              </div>
              <CoverageBar label="Meta Description" value={pg!.withMetaDescription} total={pg!.total} color="#6366f1" />
              <CoverageBar label="Focus Keywords"   value={pg!.withFocusKeywords}   total={pg!.total} color="#10b981" />
            </Card>

            {/* Pages geo breakdown */}
            <Card>
              <SectionTitle icon={<Globe size={14} />} title="Pages Geo Targeting" />
              {pg!.geoBreakdown.length === 0 ? (
                <p className="text-[12px] text-gray-400">No geo data set on pages.</p>
              ) : (
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart
                    data={pg!.geoBreakdown}
                    layout="vertical"
                    margin={{ top: 4, right: 16, left: 40, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="scope" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} width={48} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="count" name="Pages" radius={[0,3,3,0]}>
                      {pg!.geoBreakdown.map((entry) => (
                        <Cell key={entry.scope} fill={GEO_COLOR[entry.scope] ?? '#94a3b8'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>
          </div>

          {/* ── Platform Ops ────────────────────────────────────────────── */}
          {hero && (
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-3">
                Platform Operations
              </div>
              <div className="an-metrics-row">
                <div className="an-metric-card" style={{ borderTop: '3px solid #10b981' }}>
                  <div className="an-metric-label">SLA Health</div>
                  <div className="an-metric-value">{hero.slaHealth.value}%</div>
                  <div className="an-metric-sub">{hero.slaHealth.trend}</div>
                </div>
                <div className="an-metric-card" style={{ borderTop: '3px solid #6366f1' }}>
                  <div className="an-metric-label">Capacity</div>
                  <div className="an-metric-value">{hero.capacityUtilization.value}%</div>
                  <div className="h-1.5 rounded-full bg-gray-100 mt-2 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-indigo-500"
                      style={{ width: `${hero.capacityUtilization.value}%` }}
                    />
                  </div>
                </div>
                <div className="an-metric-card" style={{ borderTop: '3px solid #f59e0b' }}>
                  <div className="an-metric-label">Active Orders</div>
                  <div className="an-metric-value">{hero.activeOrders.value}</div>
                </div>
                <div className="an-metric-card" style={{ borderTop: '3px solid #3b82f6' }}>
                  <div className="an-metric-label">Weekly Revenue</div>
                  <div className="an-metric-value">${(hero.weeklyRevenue.value / 1000).toFixed(1)}k</div>
                  <div className="an-metric-sub">{hero.weeklyRevenue.trend}</div>
                </div>
              </div>
            </div>
          )}

        </div>
      ) : null}
    </div>
  );
};
