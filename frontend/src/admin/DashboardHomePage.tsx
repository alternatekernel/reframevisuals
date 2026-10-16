import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHeroMetrics, useEditors, useAlerts, useAuthProfile } from './hooks/useAdminData';
import { useSEOMetrics } from './hooks/useSEOMetrics';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from './ToastContext';

export const DashboardHomePage: React.FC = () => {
  const nav = useNavigate();
  const { showToast } = useToast();
  const { data: metrics, isLoading: metricsLoading } = useHeroMetrics();
  const { data: editors } = useEditors();
  const { data: alerts = [] } = useAlerts();
  const { data: profile } = useAuthProfile();
  const { metrics: seoMetrics, loading: seoMetricsLoading } = useSEOMetrics();

  // Sample data for development (used when API is not available or partial)
  const defaultMetrics = {
    slaHealth: { value: 0, trend: 0, status: 'good' as const },
    capacityUtilization: { value: 0, available: 0, total: 0 },
    activeOrders: { value: 0, breakdown: { new: 0, inProgress: 0, readyQC: 0 } },
    weeklyRevenue: { value: 0, trend: 0, currency: 'USD' },
  };


  // Deep merge API metrics with defaults
  const displayMetrics = React.useMemo(() => {
    if (!metrics) return defaultMetrics;
    return {
      ...defaultMetrics,
      ...metrics,
      slaHealth: { ...defaultMetrics.slaHealth, ...metrics.slaHealth },
      capacityUtilization: { ...defaultMetrics.capacityUtilization, ...metrics.capacityUtilization },
      activeOrders: { 
        ...defaultMetrics.activeOrders, 
        ...metrics.activeOrders,
        breakdown: { ...defaultMetrics.activeOrders.breakdown, ...metrics.activeOrders?.breakdown }
      },
      weeklyRevenue: { ...defaultMetrics.weeklyRevenue, ...metrics.weeklyRevenue },
    };
  }, [metrics]);

  // SEO Metrics
  const displaySEOMetrics = React.useMemo(() => {
    if (!seoMetrics) return null;
    return {
      topKeywords: {
        services: seoMetrics.topKeywordsByCluster.services.length,
        industries: seoMetrics.topKeywordsByCluster.industries.length,
        geo: seoMetrics.topKeywordsByCluster.geo.length
      },
      trialConversions: seoMetrics.trialConversions,
      leadsByPageType: seoMetrics.leadsByPageType
    };
  }, [seoMetrics]);

  // Ensure editors is an array
  const displayEditors = Array.isArray(editors) && editors.length ? editors.slice(0, 4) : [];

  const formatTime = (minutes: number) => {
    if (minutes >= 60) {
      return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  };

  const getScoreBadge = (score: number) => {
    if (score >= 95) return 'an-badge-green';
    if (score >= 85) return 'an-badge-blue';
    if (score >= 75) return 'an-badge-orange';
    return 'an-badge-gray';
  };

  const getTrendIcon = (trend: number) => {
    return trend >= 0 ? '↑' : '↓';
  };

  const getTrendClass = (trend: number) => {
    return trend >= 0 ? 'an-up' : 'an-down';
  };

  // Action Handlers
  const handleNewOrder = () => {
    nav('/admin/quotations');
    showToast('Creating Order', 'Redirecting to quotations page...', 'info');
  };

  const handleExport = () => {
    showToast('Export Started', 'Generating dashboard report (CSV)...', 'info');
    // Simulate export
    setTimeout(() => {
      showToast('Export Complete', 'Dashboard report downloaded', 'success');
    }, 2000);
  };

  const handleQuickQuote = () => {
    nav('/admin/quotebuilder');
    showToast('Quote Builder', 'Opening quote builder...', 'info');
  };

  const handleViewProduction = () => {
    nav('/admin/production');
    showToast('Production Board', 'Loading kanban board...', 'info');
  };

  const handleEditorClick = (editor: any) => {
    nav(`/admin/team`);
    showToast('Editor Details', `Viewing ${editor.name}'s profile...`, 'info');
  };

  const handleClearActivity = () => {
    showToast('Activity Cleared', 'All notifications cleared', 'success');
  };

  const handleActivityClick = (item: any) => {
    if (item.path) {
      nav(item.path);
      showToast('Navigation', `Opening ${item.path}...`, 'info');
    }
  };

  const handleQuickAction = (label: string, path: string) => {
    nav(path);
    showToast(label, `Opening ${label.toLowerCase()}...`, 'info');
  };

  const formatAlertTime = (value: unknown) => {
    if (typeof value !== 'string' || !value) return 'just now';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'just now';
    return formatDistanceToNow(date, { addSuffix: true });
  };

  return (
    <div>
      {/* Page Header */}
      <div className="an-page-header">
        <div className="an-page-title">
          <span className="ph-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <rect x="3" y="3" width="7" height="7" rx="1"/>
              <rect x="14" y="3" width="7" height="7" rx="1"/>
              <rect x="14" y="14" width="7" height="7" rx="1"/>
              <rect x="3" y="14" width="7" height="7" rx="1"/>
            </svg>
          </span>
          Dashboard
        </div>
        <div className="an-page-desc">
          {profile?.username ? `Good morning, ${profile.username.split(' ')[0]}. ` : 'Good morning. '}
          Here's what's happening today.
        </div>
        <div className="an-page-actions">
          <button className="an-btn an-btn-ghost an-btn-sm" onClick={handleNewOrder}>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
              <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            New Order
          </button>
          <button className="an-btn an-btn-ghost an-btn-sm" onClick={handleExport}>Export</button>
          <button className="an-btn an-btn-primary an-btn-sm" onClick={handleQuickQuote}>+ Quick Quote</button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="an-metrics-row">
        <div className="an-metric-card">
          <div className="an-metric-label">SLA Health</div>
          <div className="an-metric-value">
            {metricsLoading ? '...' : `${displayMetrics.slaHealth.value}%`}
          </div>
          <div className="an-metric-sub">
            <span className={getTrendClass(displayMetrics.slaHealth.trend)}>
              {getTrendIcon(displayMetrics.slaHealth.trend)} {Math.abs(displayMetrics.slaHealth.trend)}%
            </span> vs last week
          </div>
          <div className="an-bar-track"><div className="an-bar-fill an-bar-green" style={{ width: `${displayMetrics.slaHealth.value}%` }} /></div>
        </div>
        <div className="an-metric-card">
          <div className="an-metric-label">Active Orders</div>
          <div className="an-metric-value">
            {metricsLoading ? '...' : displayMetrics.activeOrders.value}
          </div>
          <div className="an-metric-sub">
            <span className="an-badge an-badge-orange" style={{ fontSize: 10 }}>
              {metricsLoading ? '...' : displayMetrics.activeOrders.breakdown.new} urgent
            </span>
            &nbsp;
            <span className="an-badge an-badge-purple" style={{ fontSize: 10 }}>
              {metricsLoading ? '...' : displayMetrics.activeOrders.breakdown.readyQC} QC
            </span>
          </div>
          <div className="an-bar-track" style={{ marginTop: 11 }}><div className="an-bar-fill an-bar-blue" style={{ width: '60%' }} /></div>
        </div>
        <div className="an-metric-card">
          <div className="an-metric-label">Weekly Revenue</div>
          <div className="an-metric-value">
            {metricsLoading ? '...' : `$${displayMetrics.weeklyRevenue.value.toLocaleString()}`}
          </div>
          <div className="an-metric-sub">
            <span className={getTrendClass(displayMetrics.weeklyRevenue.trend)}>
              {getTrendIcon(displayMetrics.weeklyRevenue.trend)} ${Math.abs(displayMetrics.weeklyRevenue.trend * 100).toFixed(0)}
            </span> vs prev week
          </div>
          <div className="an-bar-track"><div className="an-bar-fill an-bar-orange" style={{ width: '72%' }} /></div>
        </div>
        <div className="an-metric-card">
          <div className="an-metric-label">Capacity Used</div>
          <div className="an-metric-value">
            {metricsLoading ? '...' : `${displayMetrics.capacityUtilization.value}%`}
          </div>
          <div className="an-metric-sub">
            <strong>{metricsLoading ? '...' : displayMetrics.capacityUtilization.available}</strong> / {metricsLoading ? '...' : displayMetrics.capacityUtilization.total} editors active
          </div>
          <div className="an-bar-track"><div className="an-bar-fill an-bar-purple" style={{ width: `${displayMetrics.capacityUtilization.value}%` }} /></div>
        </div>
        {/* SEO Metrics Cards */}
        <div className="an-metric-card">
          <div className="an-metric-label">Top Keywords</div>
          <div className="an-metric-value">
            {seoMetricsLoading ? '...' : `${displaySEOMetrics?.topKeywords.services + displaySEOMetrics?.topKeywords.industries + displaySEOMetrics?.topKeywords.geo}`}
          </div>
          <div className="an-metric-sub">
            <span className="an-badge an-badge-blue" style={{ fontSize: 10 }}>
              S:{displaySEOMetrics?.topKeywords.services || 0} I:{displaySEOMetrics?.topKeywords.industries || 0} G:{displaySEOMetrics?.topKeywords.geo || 0}
            </span>
          </div>
          <div className="an-bar-track"><div className="an-bar-fill an-bar-blue" style={{ width: '85%' }} /></div>
        </div>
        <div className="an-metric-card">
          <div className="an-metric-label">Trial Conversions</div>
          <div className="an-metric-value">
            {seoMetricsLoading ? '...' : displaySEOMetrics?.trialConversions.quoteBuilder + displaySEOMetrics?.trialConversions.freeTrial + displaySEOMetrics?.trialConversions.freeSampleEdit}
          </div>
          <div className="an-metric-sub">
            <span className="an-badge an-badge-green" style={{ fontSize: 10 }}>
              Q:{displaySEOMetrics?.trialConversions.quoteBuilder || 0} F:{displaySEOMetrics?.trialConversions.freeTrial || 0} S:{displaySEOMetrics?.trialConversions.freeSampleEdit || 0}
            </span>
          </div>
          <div className="an-bar-track"><div className="an-bar-fill an-bar-green" style={{ width: '78%' }} /></div>
        </div>
        <div className="an-metric-card">
          <div className="an-metric-label">Leads Assisted</div>
          <div className="an-metric-value">
            {seoMetricsLoading ? '...' : displaySEOMetrics?.leadsByPageType.caseStudies + displaySEOMetrics?.leadsByPageType.geoPages + displaySEOMetrics?.leadsByPageType.industryPages}
          </div>
          <div className="an-metric-sub">
            <span className="an-badge an-badge-orange" style={{ fontSize: 10 }}>
              CS:{displaySEOMetrics?.leadsByPageType.caseStudies || 0} GP:{displaySEOMetrics?.leadsByPageType.geoPages || 0} IP:{displaySEOMetrics?.leadsByPageType.industryPages || 0}
            </span>
          </div>
          <div className="an-bar-track"><div className="an-bar-fill an-bar-orange" style={{ width: '72%' }} /></div>
        </div>
      </div>



      {/* Body: 3-col grid */}
      <div className="an-ov-body">

        {/* Col 1: Production Snapshot + Top Editors */}
        <div className="an-card">
          <div className="an-sec-hdr">
            <span className="an-sec-title">Production Snapshot</span>
            <button className="an-sec-link" onClick={handleViewProduction}>View board</button>
          </div>
          {[
            { label: 'New Orders', val: displayMetrics.activeOrders.breakdown.new, pct: 21, cls: 'an-bar-blue' },
            { label: 'In Progress', val: displayMetrics.activeOrders.breakdown.inProgress, pct: 35, cls: 'an-bar-orange' },
            { label: 'Ready QC', val: displayMetrics.activeOrders.breakdown.readyQC, pct: 24, cls: 'an-bar-purple' },
            { label: 'Revision Needed', val: 4, pct: 12, cls: 'an-bar-red' },
            { label: 'Completed Today', val: 21, pct: 62, cls: 'an-bar-green' },
          ].map(r => (
            <div className="an-prog-row" key={r.label}>
              <div className="an-prog-label">{r.label}<span>{r.val}</span></div>
              <div className="an-prog-track">
                <div className={`an-prog-f ${r.cls}`} style={{ width: `${r.pct}%` }} />
              </div>
            </div>
          ))}

          <div className="an-divider" />
          <div className="an-sec-hdr"><span className="an-sec-title">Top Editors Today</span></div>
          <div className="an-tbl-wrap">
            <table>
              <thead>
                <tr><th>Editor</th><th>Done</th><th>Avg</th><th>Score</th></tr>
              </thead>
              <tbody>
                {displayEditors.map((e: any) => (
                  <tr key={e.id || e.name} onClick={() => handleEditorClick(e)} style={{ cursor: 'pointer' }}>
                    <td className="an-td-main">{e.name}</td>
                    <td style={{ color: 'var(--an-green-text)', fontWeight: 600 }}>{e.completedToday}</td>
                    <td className="an-td-mono">{formatTime(e.avgTurnaround)}</td>
                    <td><span className={`an-badge ${getScoreBadge(e.qualityScore)}`}>{e.qualityScore}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Col 2: Live Activity + SLA */}
        <div className="an-card">
          <div className="an-sec-hdr">
            <span className="an-sec-title">Live Activity</span>
            <button className="an-sec-link" onClick={handleClearActivity}>Clear all</button>
          </div>
          
          {alerts.length === 0 ? (
            <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--an-text3)', fontSize: 13 }}>
              No recent activity
            </div>
          ) : (
            alerts.slice(0, 8).map((alert, i) => (
              <div key={alert.id} className="an-act-item" onClick={() => handleActivityClick({ path: '/admin/production' })} style={{ cursor: 'pointer' }}>
                <div 
                  className="an-act-dot" 
                  style={{ 
                    background: alert.severity === 'high' || alert.type === 'error' ? 'var(--an-red-text)' : 
                                alert.severity === 'medium' || alert.type === 'warning' ? 'var(--an-orange-text)' : 
                                alert.type === 'success' ? 'var(--an-green-text)' : 'var(--an-blue-text)' 
                  }} 
                />
                <div>
                  <div className="an-act-text">
                    <strong>{alert.title}</strong> · {alert.message}
                  </div>
                  <div className="an-act-time">{formatAlertTime(alert?.createdAt)}</div>
                </div>
              </div>
            ))
          )}

          <div className="an-divider" />
          <div className="an-sec-title" style={{ marginBottom: 10 }}>SLA Breakdown</div>
          {[
            { label: 'Standard (48h)', badge: 'an-badge-green',  val: '98.2%' },
            { label: 'Express (24h)',  badge: 'an-badge-yellow', val: '94.5%' },
            { label: 'Rush (12h)',     badge: 'an-badge-orange', val: '88.1%' },
            { label: 'Same Day (6h)', badge: 'an-badge-red',    val: '81.0%' },
          ].map(s => (
            <div className="an-sla-row" key={s.label}>
              <span style={{ color: 'var(--an-text2)' }}>{s.label}</span>
              <span className={`an-badge ${s.badge}`}>{s.val}</span>
            </div>
          ))}
        </div>

        {/* Col 3: Quick Actions + Revenue Split */}
        <div>
          <div className="an-card" style={{ marginBottom: 12 }}>
            <div className="an-sec-title" style={{ marginBottom: 12 }}>Quick Actions</div>
            {[
              { label: 'New Quote', sub: 'Build & send a quote', bg: 'var(--an-orange-bg)', fg: 'var(--an-orange-text)', path: '/admin/quotebuilder',
                svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg> },
              { label: 'Create Invoice', sub: 'Batch or single', bg: 'var(--an-blue-bg)', fg: 'var(--an-blue-text)', path: '/admin/invoicing',
                svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 10h16M4 14h16M8 6h8M8 18h8"/></svg> },
              { label: 'Add Team Member', sub: 'Invite editor', bg: 'var(--an-purple-bg)', fg: 'var(--an-purple-text)', path: '/admin/team',
                svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="7" r="4"/><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/></svg> },
              { label: 'Run QC Batch', sub: '8 items pending', bg: 'var(--an-green-bg)', fg: 'var(--an-green-text)', path: '/admin/quality',
                svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg> },
            ].map(qa => (
              <button key={qa.label} className="an-qa-item" onClick={() => handleQuickAction(qa.label, qa.path)}>
                <div className="an-qa-ico" style={{ background: qa.bg, color: qa.fg }}>
                  {qa.svg}
                </div>
                <div>
                  <div className="an-qa-lbl">{qa.label}</div>
                  <div className="an-qa-sub">{qa.sub}</div>
                </div>
              </button>
            ))}
          </div>

          <div className="an-card">
            <div className="an-sec-title" style={{ marginBottom: 10 }}>Revenue Split</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: 'E-commerce', val: '$9,840 · 53%', color: 'var(--an-orange-text)', flex: 53 },
                { label: 'Real Estate', val: '$4,200 · 23%', color: 'var(--an-blue-text)', flex: 23 },
                { label: 'Fashion',    val: '$2,920 · 16%', color: 'var(--an-purple-text)', flex: 16 },
                { label: 'Other',      val: '$1,460 · 8%',  color: 'var(--an-green-text)', flex: 8 },
              ].map(r => (
                <div key={r.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: r.color, display: 'inline-block' }} />
                    <span style={{ color: 'var(--an-text2)' }}>{r.label}</span>
                  </div>
                  <span style={{ fontWeight: 600, color: 'var(--an-text)' }}>{r.val}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 2, marginTop: 12, height: 6, borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ background: 'var(--an-orange-text)', flex: 53 }} />
              <div style={{ background: 'var(--an-blue-text)',   flex: 23 }} />
              <div style={{ background: 'var(--an-purple-text)', flex: 16 }} />
              <div style={{ background: 'var(--an-green-text)',  flex: 8  }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
