import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { adminFetch } from '../utils/api';
import { useToast } from '../ToastContext';
import {
  Users, Eye, MousePointer, Clock, TrendingUp, RefreshCw,
  Globe, Monitor, Smartphone, Tablet, Zap, Target, ExternalLink,
  ChevronLeft, ChevronRight, AlertCircle,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface UmamiStats {
  pageviews:  { value: number };
  visitors:   { value: number };
  visits:     { value: number };
  bounces:    { value: number };
  totaltime:  { value: number };
  _mock?: boolean;
}

interface PageviewPoint {
  x: string;  // ISO date string from Umami
  y: number;
}

interface UmamiPageviews {
  pageviews: PageviewPoint[];
  sessions:  PageviewPoint[];
}

interface UmamiMetric {
  x: string;   // label
  y: number;   // count
}

interface UmamiSession {
  id:          string;
  createdAt:   string;
  country:     string | null;
  city:        string | null;
  device:      string | null;
  browser:     string | null;
  os:          string | null;
  duration:    number;
  views:       number;
  referrer:    string | null;
}

interface SessionsResponse {
  data:     UmamiSession[];
  count:    number;
  page:     number;
  pageSize: number;
}

type DayRange = 1 | 7 | 30 | 90;
type MetricType = 'url' | 'referrer' | 'device' | 'country' | 'browser' | 'os';

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt = Intl.NumberFormat('en-US', { notation: 'compact' }).format;

function avgDuration(stats: UmamiStats): string {
  if (!stats.visits.value) return '0s';
  const secs = Math.round(stats.totaltime.value / stats.visits.value);
  if (secs < 60) return `${secs}s`;
  return `${Math.floor(secs / 60)}m ${secs % 60}s`;
}

function bounceRate(stats: UmamiStats): string {
  if (!stats.visits.value) return '0%';
  return `${Math.round((stats.bounces.value / stats.visits.value) * 100)}%`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function deviceIcon(device: string | null) {
  const d = (device || '').toLowerCase();
  if (d === 'mobile')  return <Smartphone size={12} />;
  if (d === 'tablet')  return <Tablet size={12} />;
  return <Monitor size={12} />;
}

function countryFlag(countryCode: string | null): string {
  if (!countryCode || countryCode.length !== 2) return '🌐';
  return String.fromCodePoint(
    ...[...countryCode.toUpperCase()].map(c => 0x1F1E6 + c.charCodeAt(0) - 65),
  );
}

const CHART_COLOR = '#6366f1';
const SESSION_COLOR = '#10b981';

// ── Sub-components ────────────────────────────────────────────────────────────

const KPI: React.FC<{ icon: React.ReactNode; label: string; value: string; sub?: string; accent?: string }> = ({
  icon, label, value, sub, accent = '#6366f1',
}) => (
  <div className="an-metric-card" style={{ borderTop: `3px solid ${accent}` }}>
    <div className="flex items-center justify-between mb-2">
      <div className="an-metric-label">{label}</div>
      <span style={{ color: accent, opacity: 0.6 }}>{icon}</span>
    </div>
    <div className="an-metric-value">{value}</div>
    {sub && <div className="an-metric-sub mt-1">{sub}</div>}
  </div>
);

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-white rounded-xl border border-gray-200 p-5 ${className}`}>{children}</div>
);

const SectionTitle: React.FC<{ icon: React.ReactNode; title: string; sub?: string }> = ({ icon, title, sub }) => (
  <div className="flex items-center gap-2 mb-4">
    <span className="text-indigo-500">{icon}</span>
    <div>
      <div className="font-bold text-[13px] text-gray-800">{title}</div>
      {sub && <div className="text-[11px] text-gray-400">{sub}</div>}
    </div>
  </div>
);

const ChartTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-[11px]">
      <div className="font-semibold text-gray-700 mb-1">{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-gray-500">{p.name}:</span>
          <span className="font-semibold text-gray-800">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

const MetricTable: React.FC<{ rows: UmamiMetric[]; label: string; loading: boolean }> = ({ rows, label, loading }) => (
  <div className="overflow-hidden">
    {loading ? (
      <div className="text-[12px] text-gray-400 animate-pulse">Loading…</div>
    ) : rows.length === 0 ? (
      <div className="text-[12px] text-gray-400">No data yet.</div>
    ) : (
      <div className="space-y-1">
        {rows.slice(0, 10).map((r, i) => {
          const max = rows[0]?.y || 1;
          return (
            <div key={i} className="flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <div className="text-[11px] text-gray-600 truncate" title={r.x}>{r.x || '(direct)'}</div>
                <div className="h-1 mt-0.5 rounded-full bg-gray-100 overflow-hidden">
                  <div className="h-full rounded-full bg-indigo-400" style={{ width: `${(r.y / max) * 100}%` }} />
                </div>
              </div>
              <div className="text-[11px] font-semibold text-gray-800 w-10 text-right flex-shrink-0">{fmt(r.y)}</div>
            </div>
          );
        })}
      </div>
    )}
    {!loading && rows.length > 0 && (
      <div className="text-[10px] text-gray-400 mt-3">{label} · top {Math.min(rows.length, 10)} of {rows.length}</div>
    )}
  </div>
);

// ── Setup prompt shown when Umami isn't configured ────────────────────────────

const SetupPrompt: React.FC = () => (
  <div className="max-w-xl mx-auto mt-12 bg-white border border-dashed border-indigo-200 rounded-2xl p-8 text-center">
    <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-4">
      <AlertCircle size={22} className="text-indigo-500" />
    </div>
    <h2 className="font-bold text-[15px] text-gray-800 mb-2">Umami not connected</h2>
    <p className="text-[13px] text-gray-500 mb-6 leading-relaxed">
      Visitor analytics are powered by <strong>Umami</strong> — a self-hosted, privacy-first,
      open-source analytics platform. No cookies, no GDPR headaches.
    </p>
    <div className="bg-gray-50 rounded-xl p-4 text-left text-[11px] font-mono text-gray-600 mb-6 space-y-1">
      <div><span className="text-gray-400">1.</span> Deploy Umami via Coolify on your server</div>
      <div><span className="text-gray-400">2.</span> Add site <code className="bg-white px-1 rounded">reframevisuals.com</code></div>
      <div><span className="text-gray-400">3.</span> Set in Coolify env vars:</div>
      <div className="pl-4 text-indigo-600">UMAMI_URL=https://analytics.reframevisuals.com</div>
      <div className="pl-4 text-indigo-600">UMAMI_API_KEY=your_api_key</div>
      <div className="pl-4 text-indigo-600">UMAMI_WEBSITE_ID=your_website_id</div>
      <div className="pl-4 text-indigo-600">VITE_UMAMI_URL=https://analytics.reframevisuals.com</div>
      <div className="pl-4 text-indigo-600">VITE_UMAMI_WEBSITE_ID=your_website_id</div>
      <div><span className="text-gray-400">4.</span> Redeploy — tracking starts immediately</div>
    </div>
    <a
      href="https://github.com/umami-software/umami"
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-[12px] text-indigo-600 hover:underline font-semibold"
    >
      <ExternalLink size={12} />
      Umami on GitHub (24k+ stars, MIT)
    </a>
    <p className="text-[11px] text-gray-400 mt-3">See <code>scripts/umami-setup.md</code> in this repo for full Coolify deployment steps.</p>
  </div>
);

// ── Main Page ─────────────────────────────────────────────────────────────────

export const VisitorAnalyticsPage: React.FC = () => {
  const [configured, setConfigured]     = useState<boolean | null>(null);
  const [days, setDays]                 = useState<DayRange>(30);
  const [stats, setStats]               = useState<UmamiStats | null>(null);
  const [pageviews, setPageviews]       = useState<UmamiPageviews | null>(null);
  const [activeNow, setActiveNow]       = useState<number>(0);
  const [pages, setPages]               = useState<UmamiMetric[]>([]);
  const [referrers, setReferrers]       = useState<UmamiMetric[]>([]);
  const [countries, setCountries]       = useState<UmamiMetric[]>([]);
  const [devices, setDevices]           = useState<UmamiMetric[]>([]);
  const [browsers, setBrowsers]         = useState<UmamiMetric[]>([]);
  const [events, setEvents]             = useState<UmamiMetric[]>([]);
  const [sessions, setSessions]         = useState<SessionsResponse | null>(null);
  const [sessionPage, setSessionPage]   = useState(1);

  const [loadingStats, setLoadingStats] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [loadingMetrics, setLoadingMetrics]   = useState(false);

  const { showToast } = useToast();
  const activeInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Check Umami config ─────────────────────────────────────────────────────
  useEffect(() => {
    adminFetch('/visitor-analytics/status')
      .then((s) => setConfigured(s.configured))
      .catch(() => setConfigured(false));
  }, []);

  // ── Poll active visitors every 60s ─────────────────────────────────────────
  useEffect(() => {
    if (!configured) return;
    const fetchActive = () =>
      adminFetch('/visitor-analytics/active')
        .then((d) => setActiveNow(d?.x ?? 0))
        .catch(() => {});
    fetchActive();
    activeInterval.current = setInterval(fetchActive, 60_000);
    return () => { if (activeInterval.current) clearInterval(activeInterval.current); };
  }, [configured]);

  // ── Load stats & time-series when days change ──────────────────────────────
  const loadStats = useCallback(() => {
    if (!configured) return;
    setLoadingStats(true);
    Promise.all([
      adminFetch(`/visitor-analytics/stats?days=${days}`),
      adminFetch(`/visitor-analytics/pageviews?days=${days}&unit=${days <= 1 ? 'hour' : 'day'}`),
    ])
      .then(([s, pv]) => { setStats(s); setPageviews(pv); })
      .catch(() => showToast('Error', 'Failed to load visitor stats', 'error'))
      .finally(() => setLoadingStats(false));
  }, [configured, days, showToast]);

  // ── Load breakdown metrics ─────────────────────────────────────────────────
  const loadMetrics = useCallback(() => {
    if (!configured) return;
    setLoadingMetrics(true);
    const q = `?days=${days}&limit=20`;
    Promise.all([
      adminFetch(`/visitor-analytics/metrics${q}&type=url`),
      adminFetch(`/visitor-analytics/metrics${q}&type=referrer`),
      adminFetch(`/visitor-analytics/metrics${q}&type=country`),
      adminFetch(`/visitor-analytics/metrics${q}&type=device`),
      adminFetch(`/visitor-analytics/metrics${q}&type=browser`),
      adminFetch(`/visitor-analytics/events${q}`),
    ])
      .then(([pg, ref, ctry, dev, brw, ev]) => {
        setPages(Array.isArray(pg) ? pg : []);
        setReferrers(Array.isArray(ref) ? ref : []);
        setCountries(Array.isArray(ctry) ? ctry : []);
        setDevices(Array.isArray(dev) ? dev : []);
        setBrowsers(Array.isArray(brw) ? brw : []);
        setEvents(Array.isArray(ev) ? ev : []);
      })
      .catch(() => {})
      .finally(() => setLoadingMetrics(false));
  }, [configured, days]);

  // ── Load sessions ──────────────────────────────────────────────────────────
  const loadSessions = useCallback(() => {
    if (!configured) return;
    setLoadingSessions(true);
    adminFetch(`/visitor-analytics/sessions?days=${days}&page=${sessionPage}&pageSize=20`)
      .then(setSessions)
      .catch(() => {})
      .finally(() => setLoadingSessions(false));
  }, [configured, days, sessionPage]);

  useEffect(() => { loadStats(); loadMetrics(); }, [loadStats, loadMetrics]);
  useEffect(() => { loadSessions(); }, [loadSessions]);

  const refresh = () => { loadStats(); loadMetrics(); loadSessions(); };

  // ── Chart data ─────────────────────────────────────────────────────────────
  const chartData = React.useMemo(() => {
    if (!pageviews?.pageviews?.length) return [];
    const pvMap = new Map(pageviews.pageviews.map((p) => [p.x, p.y]));
    const seMap = new Map((pageviews.sessions || []).map((p) => [p.x, p.y]));
    const keys  = [...new Set([...pvMap.keys(), ...seMap.keys()])].sort();
    return keys.map((k) => ({
      date:     formatDate(k),
      Pageviews: pvMap.get(k) ?? 0,
      Visitors:  seMap.get(k) ?? 0,
    }));
  }, [pageviews]);

  // ── Device pie data ────────────────────────────────────────────────────────
  const deviceTotal = devices.reduce((s, d) => s + d.y, 0) || 1;

  if (configured === null) {
    return <div className="flex items-center justify-center h-64 text-gray-400 text-sm">Checking Umami connection…</div>;
  }

  if (!configured) return <SetupPrompt />;

  return (
    <div className="pb-12">
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="an-page-header">
        <div className="an-page-title">
          <span className="ph-icon"><Eye size={16} /></span>
          Visitor Analytics
        </div>
        <div className="an-page-desc">
          Page views · Sessions · Geo · Devices · Conversions — powered by Umami
        </div>
        <div className="an-page-actions">
          {/* Day range selector */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
            {([1, 7, 30, 90] as DayRange[]).map((d) => (
              <button
                key={d}
                onClick={() => { setDays(d); setSessionPage(1); }}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                  days === d ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {d === 1 ? 'Today' : `${d}d`}
              </button>
            ))}
          </div>
          <button
            className="an-btn an-btn-ghost an-btn-sm flex items-center gap-1.5"
            onClick={refresh}
            disabled={loadingStats}
          >
            <RefreshCw size={12} className={loadingStats ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* ── KPI row ──────────────────────────────────────────────────── */}
        <div className="an-metrics-row">
          <KPI
            icon={<Users size={15} />}
            label="Unique Visitors"
            value={stats ? fmt(stats.visitors.value) : '—'}
            sub={`last ${days === 1 ? '24h' : `${days} days`}`}
            accent="#6366f1"
          />
          <KPI
            icon={<Eye size={15} />}
            label="Page Views"
            value={stats ? fmt(stats.pageviews.value) : '—'}
            accent="#3b82f6"
          />
          <KPI
            icon={<MousePointer size={15} />}
            label="Sessions"
            value={stats ? fmt(stats.visits.value) : '—'}
            accent="#10b981"
          />
          <KPI
            icon={<Clock size={15} />}
            label="Avg Duration"
            value={stats ? avgDuration(stats) : '—'}
            accent="#f59e0b"
          />
          <KPI
            icon={<TrendingUp size={15} />}
            label="Bounce Rate"
            value={stats ? bounceRate(stats) : '—'}
            accent="#ec4899"
          />
          <div className="an-metric-card" style={{ borderTop: '3px solid #10b981' }}>
            <div className="flex items-center justify-between mb-2">
              <div className="an-metric-label">Active Now</div>
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
            </div>
            <div className="an-metric-value">{activeNow}</div>
            <div className="an-metric-sub">in last 5 min</div>
          </div>
        </div>

        {/* ── Trend chart ──────────────────────────────────────────────── */}
        <Card>
          <SectionTitle icon={<TrendingUp size={14} />} title="Visitors &amp; Page Views Over Time" sub={`Last ${days === 1 ? '24 hours' : `${days} days`} · daily granularity`} />
          {loadingStats ? (
            <div className="h-52 flex items-center justify-center text-gray-400 text-sm animate-pulse">Loading chart…</div>
          ) : chartData.length === 0 ? (
            <div className="h-52 flex items-center justify-center text-gray-400 text-sm">No data for this period.</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData} margin={{ top: 4, right: 12, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: 10, paddingTop: 8 }} />
                <Line type="monotone" dataKey="Pageviews" stroke={CHART_COLOR}   strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                <Line type="monotone" dataKey="Visitors"  stroke={SESSION_COLOR} strokeWidth={2} dot={false} activeDot={{ r: 4 }} strokeDasharray="4 2" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* ── Top Pages + Referrers ─────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <SectionTitle icon={<Eye size={14} />} title="Top Pages" sub="By page views" />
            <MetricTable rows={pages} label="pages" loading={loadingMetrics} />
          </Card>
          <Card>
            <SectionTitle icon={<ExternalLink size={14} />} title="Traffic Sources" sub="Top referrers" />
            <MetricTable rows={referrers} label="referrers" loading={loadingMetrics} />
          </Card>
        </div>

        {/* ── Geo + Devices ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Countries */}
          <Card className="lg:col-span-2">
            <SectionTitle icon={<Globe size={14} />} title="Countries" sub="Sessions by country" />
            {loadingMetrics ? (
              <div className="text-[12px] text-gray-400 animate-pulse">Loading…</div>
            ) : countries.length === 0 ? (
              <div className="text-[12px] text-gray-400">No geographic data yet.</div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart
                    data={countries.slice(0, 10)}
                    layout="vertical"
                    margin={{ top: 4, right: 16, left: 56, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis
                      type="category"
                      dataKey="x"
                      tick={{ fontSize: 10, fill: '#64748b' }}
                      axisLine={false}
                      tickLine={false}
                      width={60}
                      tickFormatter={(v) => `${countryFlag(v)} ${v}`}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="y" name="Sessions" fill={CHART_COLOR} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </>
            )}
          </Card>

          {/* Devices + Browsers */}
          <div className="flex flex-col gap-4">
            <Card>
              <SectionTitle icon={<Monitor size={14} />} title="Devices" />
              {devices.length === 0 ? (
                <div className="text-[12px] text-gray-400">No device data.</div>
              ) : (
                <div className="space-y-2">
                  {devices.map((d) => (
                    <div key={d.x} className="flex items-center gap-2">
                      <span className="text-gray-400">{deviceIcon(d.x)}</span>
                      <span className="text-[11px] text-gray-600 capitalize flex-1">{d.x || 'Other'}</span>
                      <span className="text-[11px] font-semibold text-gray-800">{fmt(d.y)}</span>
                      <span className="text-[10px] text-gray-400">({Math.round((d.y / deviceTotal) * 100)}%)</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
            <Card>
              <SectionTitle icon={<Globe size={14} />} title="Browsers" />
              <MetricTable rows={browsers} label="browsers" loading={loadingMetrics} />
            </Card>
          </div>
        </div>

        {/* ── Conversion Events ─────────────────────────────────────────── */}
        <Card>
          <SectionTitle icon={<Target size={14} />} title="Conversion Events" sub="Custom events tracked on your site" />
          {events.length === 0 ? (
            <p className="text-[12px] text-gray-400">
              No custom events recorded yet. Events fire when visitors click CTAs, submit forms,
              or subscribe to the newsletter. They start appearing once real traffic hits the site.
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {events.map((e) => (
                <div key={e.x} className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 text-center">
                  <div className="text-[22px] font-extrabold text-indigo-600">{fmt(e.y)}</div>
                  <div className="text-[10px] text-indigo-400 mt-0.5 font-medium truncate" title={e.x}>{e.x}</div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* ── Sessions Log ──────────────────────────────────────────────── */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <SectionTitle icon={<Zap size={14} />} title="Sessions" sub={`Most recent visits${sessions ? ` · ${sessions.count} total` : ''}`} />
          </div>

          {loadingSessions ? (
            <div className="text-[12px] text-gray-400 animate-pulse py-6 text-center">Loading sessions…</div>
          ) : !sessions || sessions.data.length === 0 ? (
            <div className="text-[12px] text-gray-400 py-6 text-center">No sessions recorded for this period.</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left font-semibold text-gray-500 pb-2 pr-3">When</th>
                      <th className="text-left font-semibold text-gray-500 pb-2 pr-3">Location</th>
                      <th className="text-left font-semibold text-gray-500 pb-2 pr-3">Device</th>
                      <th className="text-left font-semibold text-gray-500 pb-2 pr-3">Browser</th>
                      <th className="text-left font-semibold text-gray-500 pb-2 pr-3">Duration</th>
                      <th className="text-left font-semibold text-gray-500 pb-2 pr-3">Pages</th>
                      <th className="text-left font-semibold text-gray-500 pb-2">Referrer</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.data.map((s) => (
                      <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="py-2 pr-3 text-gray-500 whitespace-nowrap">
                          {new Date(s.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-2 pr-3 whitespace-nowrap">
                          <span className="mr-1">{countryFlag(s.country)}</span>
                          <span className="text-gray-600">{s.city || s.country || '—'}</span>
                        </td>
                        <td className="py-2 pr-3">
                          <span className="flex items-center gap-1 text-gray-600 capitalize">
                            {deviceIcon(s.device)}{s.device || '—'}
                          </span>
                        </td>
                        <td className="py-2 pr-3 text-gray-600">{s.browser || '—'}</td>
                        <td className="py-2 pr-3 text-gray-600">
                          {s.duration < 60 ? `${s.duration}s` : `${Math.floor(s.duration / 60)}m`}
                        </td>
                        <td className="py-2 pr-3 text-gray-600">{s.views}</td>
                        <td className="py-2 text-gray-400 max-w-[140px] truncate" title={s.referrer || undefined}>
                          {s.referrer || '(direct)'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {sessions.count > sessions.pageSize && (
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                  <span className="text-[11px] text-gray-400">
                    Page {sessions.page} · {sessions.count} total sessions
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setSessionPage((p) => Math.max(1, p - 1))}
                      disabled={sessions.page <= 1}
                      className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <button
                      onClick={() => setSessionPage((p) => p + 1)}
                      disabled={sessions.page * sessions.pageSize >= sessions.count}
                      className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </Card>
      </div>
    </div>
  );
};
