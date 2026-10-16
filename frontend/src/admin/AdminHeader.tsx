import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSearch, useAlerts, useDismissAlert } from './hooks/useAdminData';
import { Bell, User, Check, X, Info, AlertTriangle, AlertCircle, Calendar } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface AdminHeaderProps {
  profile: any;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

const PAGE_LABELS: Record<string, [string, string]> = {
  '/admin':               ['Dashboard', 'Overview'],
  '/admin/support':       ['Inbox', 'Messages'],
  '/admin/production':    ['Production', 'Kanban Board'],
  '/admin/leads':         ['Leads', 'Pipeline'],
  '/admin/customers':     ['Customers', 'All Clients'],
  '/admin/pipeline':      ['Sales Pipeline', 'Deals & Stages'],
  '/admin/deals':         ['Deals', 'Active Deals'],
  '/admin/campaigns':     ['Campaigns', 'Email & Outreach'],
  '/admin/automation':    ['Automation', 'Workflows'],
  '/admin/landing-pages': ['Landing Pages', 'Web Pages'],
  '/admin/quotebuilder':  ['Quote Builder', 'Create Quote'],
  '/admin/quotations':    ['Custom Pricing Breakdown', 'Incoming Requests'],
  '/admin/templates':     ['Templates', 'Reusable Templates'],
  '/admin/platform':      ['Platform', 'Branding & Config'],
  '/admin/analytics':         ['Analytics', 'Metrics & Insights'],
  '/admin/visitor-analytics': ['Visitors', 'Real-time Visitor Analytics'],
  '/admin/reports':       ['Reports', 'Generated Reports'],
  '/admin/team':          ['Team', 'Staff & Editors'],
  '/admin/integrations':  ['Integrations', 'Connected Apps'],
  '/admin/invoicing':     ['Invoicing', 'Billing'],
  '/admin/payroll':       ['Payroll', 'Staff Pay'],
  '/admin/payouts':       ['Payouts', 'Disbursements'],
  '/admin/pricing':       ['Pricing Matrix', 'Rate Cards'],
  '/admin/cms':           ['Page Editor', 'Content'],
  '/admin/chatbot':       ['Reframe AI', 'Configuration'],
  '/admin/compliance':    ['Compliance', 'Policies'],
  '/admin/quality':       ['Quality Control', 'QC'],
  '/admin/tasks':         ['Tasks', 'Task Board'],
};

const QUICK_PAGES = [
  { label: 'Dashboard', path: '/admin' },
  { label: 'Production', path: '/admin/production' },
  { label: 'Leads', path: '/admin/leads' },
  { label: 'Quotes', path: '/admin/quotations' },
  { label: 'Team', path: '/admin/team' },
  { label: 'Settings', path: '/admin/platform' },
];

export const AdminHeader: React.FC<AdminHeaderProps> = ({ profile, sidebarCollapsed, setSidebarCollapsed }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [search, setSearch] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  
  const { data: searchResults } = useSearch(search);
  const { data: alerts = [] } = useAlerts();
  const dismissMutation = useDismissAlert();
  
  const isSearching = search.length > 0;
  const unreadAlerts = alerts.filter(a => !a.isDismissed);
  const hasUnread = unreadAlerts.length > 0;

  const labels = PAGE_LABELS[location.pathname] ?? ['Admin', ''];
  const [mainLabel, subLabel] = labels;

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setShowSearchResults(value.length > 0);
  };

  const handleSearchSelect = (item: any) => {
    if (item.path) {
      navigate(item.path);
    }
    setSearch('');
    setShowSearchResults(false);
  };

  const filteredPages = QUICK_PAGES.filter(page =>
    page.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="an-topbar">
      {/* Menu toggle */}
      <button
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        style={{
          width: 30, height: 30, border: '1px solid var(--an-border)',
          borderRadius: 'var(--an-radius)', background: 'transparent',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--an-text2)', transition: 'all .1s', flexShrink: 0,
        }}
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </button>

      {/* Breadcrumb */}
      <div className="an-breadcrumb">
        <span>Reframe</span>
        <span className="an-breadcrumb-sep">/</span>
        <span className="an-bc-current">{mainLabel}</span>
        {subLabel && (
          <>
            <span className="an-breadcrumb-sep">/</span>
            <span style={{ color: 'var(--an-text2)' }}>{subLabel}</span>
          </>
        )}
      </div>

      {/* Search */}
      <div className="an-search-wrap" style={{ position: 'relative' }}>
        <svg viewBox="0 0 16 16" fill="none" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 14, color: 'var(--an-text3)' }}>
          <circle cx="6.5" cy="6.5" r="4" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M11 11l2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <input
          className="an-search-input"
          placeholder="Search... (Press / to focus)"
          value={search}
          onChange={e => handleSearchChange(e.target.value)}
          onFocus={() => setShowSearchResults(true)}
          style={{ paddingLeft: 32 }}
        />
        
        {showSearchResults && search && (
          <div className="an-search-dropdown" style={{
            position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 8,
            background: 'white', borderRadius: 12, border: '1px solid var(--an-border)',
            boxShadow: '0 10px 40px rgba(0,0,0,0.15)', zIndex: 100, maxHeight: 400, overflow: 'auto'
          }}>
            {filteredPages.length > 0 && (
              <div style={{ padding: 8 }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--an-text3)', textTransform: 'uppercase', padding: '4px 8px' }}>Quick Navigation</div>
                {filteredPages.map(page => (
                  <button key={page.path} onClick={() => handleSearchSelect(page)} className="an-nav-item" style={{ width: '100%', fontSize: 13 }}>
                    {page.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ flex: 1 }} />

      {/* Status chip */}
      <div className="an-status-chip">
        <span className="an-pulse" />
        All systems live
      </div>

      {/* Icon buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, position: 'relative' }}>
        <div style={{ position: 'relative' }}>
          <button className={`an-icon-btn ${showNotifications ? 'active' : ''}`} onClick={() => setShowNotifications(!showNotifications)}>
            {hasUnread && <span className="dot" />}
            <Bell size={14} />
          </button>

          {showNotifications && (
            <div className="an-search-dropdown" style={{ position: 'absolute', top: '100%', right: 0, width: 320, marginTop: 8, background: 'white', borderRadius: 12, border: '1px solid var(--an-border)', boxShadow: '0 10px 40px rgba(0,0,0,0.15)', zIndex: 100 }}>
              <div style={{ padding: 12, fontWeight: 700, borderBottom: '1px solid var(--an-border)' }}>Notifications</div>
              <div style={{ maxHeight: 300, overflowY: 'auto', padding: 8 }}>
                {unreadAlerts.length === 0 ? (
                  <div style={{ padding: 20, textAlign: 'center', color: 'var(--an-text3)', fontSize: 12 }}>No new notifications</div>
                ) : (
                  unreadAlerts.map(alert => (
                    <div key={alert.id} style={{ padding: 8, fontSize: 12, borderBottom: '1px solid var(--an-border)' }}>
                      <strong>{alert.title}</strong>
                      <div>{alert.message}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div style={{ position: 'relative' }}>
          <button className={`an-icon-btn ${showProfile ? 'active' : ''}`} onClick={() => setShowProfile(!showProfile)}>
            <User size={14} />
          </button>

          {showProfile && (
            <div className="an-search-dropdown" style={{ position: 'absolute', top: '100%', right: 0, width: 180, marginTop: 8, background: 'white', borderRadius: 12, border: '1px solid var(--an-border)', boxShadow: '0 10px 40px rgba(0,0,0,0.15)', zIndex: 100, padding: 8 }}>
              <div style={{ padding: 8, borderBottom: '1px solid var(--an-border)', marginBottom: 4 }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{profile?.username || 'Admin'}</div>
                <div style={{ fontSize: 11, color: 'var(--an-text3)' }}>{profile?.role || 'Staff'}</div>
              </div>
              <button className="an-nav-item" style={{ width: '100%', fontSize: 12 }} onClick={() => {
                localStorage.clear();
                window.location.href = '/admin/login';
              }}>Sign Out</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
