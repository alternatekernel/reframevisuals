import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSearch, useAlerts, useDismissAlert, useAuthProfile } from './hooks/useAdminData';
import { Bell, User, Check, X, Info, AlertTriangle, AlertCircle, ExternalLink, Calendar } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface AdminTopBarProps {
  onMenuToggle: () => void;
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
  '/admin/audit':         ['Audit Log', 'Activity History'],
  '/admin/users':         ['Staff Users', 'User Management'],
};

const QUICK_PAGES = [
  { label: 'Dashboard', path: '/admin' },
  { label: 'Production', path: '/admin/production' },
  { label: 'Leads', path: '/admin/leads' },
  { label: 'Quotes', path: '/admin/quotations' },
  { label: 'Team', path: '/admin/team' },
  { label: 'Settings', path: '/admin/platform' },
];

export const AdminTopBar: React.FC<AdminTopBarProps> = ({ onMenuToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [search, setSearch] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  
  const { data: searchResults } = useSearch(search);
  const { data: alerts = [], isLoading: alertsLoading } = useAlerts();
  const { data: profile } = useAuthProfile();
  const dismissMutation = useDismissAlert();
  
  const isSearching = search.length > 0;
  const unreadAlerts = alerts.filter((a: any) => !a.isDismissed);
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
      <style>{`
        .an-icon-btn {
          position: relative;
          background: transparent;
          border: none;
          color: var(--an-text2);
          padding: 8px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }
        .an-icon-btn:hover { background: var(--an-hover); color: var(--an-text); }
        .an-icon-btn.active { background: var(--an-blue-bg); color: var(--an-blue-text); }
        .an-icon-btn .dot {
          position: absolute;
          top: 6px;
          right: 6px;
          width: 8px;
          height: 8px;
          background: var(--an-red-text);
          border-radius: 50%;
          border: 2px solid white;
        }
        @media (max-width: 768px) {
          .an-icon-btn {
            width: 32px;
            height: 32px;
            padding: 0;
            border-radius: 6px;
            background: transparent;
          }
          .an-icon-btn:hover,
          .an-icon-btn.active {
            background: transparent;
          }
          .an-icon-btn svg {
            width: 24px;
            height: 24px;
            stroke-width: 1.9;
          }
          .an-icon-btn .dot {
            top: 3px;
            right: 3px;
          }
        }
      `}</style>
      {/* Menu toggle */}
      <button
        onClick={onMenuToggle}
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
        <svg viewBox="0 0 16 16" fill="none">
          <circle cx="6.5" cy="6.5" r="4" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M11 11l2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <input
          className="an-search-input"
          placeholder="Search... (Press / to focus)"
          value={search}
          onChange={e => handleSearchChange(e.target.value)}
          onFocus={() => setShowSearchResults(true)}
          onKeyDown={e => {
            if (e.key === 'Escape') {
              setShowSearchResults(false);
              (e.target as HTMLInputElement).blur();
            }
          }}
        />
        
        {/* Search Results Dropdown */}
        {showSearchResults && search && (
          <div className="an-search-dropdown" style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: 8,
            background: 'white',
            borderRadius: 12,
            border: '1px solid var(--an-border)',
            boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
            zIndex: 100,
            maxHeight: 400,
            overflow: 'auto',
          }}>
            {/* Quick Pages */}
            {filteredPages.length > 0 && (
              <div style={{ padding: 8 }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--an-text3)', textTransform: 'uppercase', padding: '4px 8px', marginBottom: 4 }}>
                  Quick Navigation
                </div>
                {filteredPages.map(page => (
                  <button
                    key={page.path}
                    onClick={() => handleSearchSelect(page)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontSize: 13,
                      color: 'var(--an-text)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--an-sidebar)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--an-text3)' }}>
                      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                    </svg>
                    {page.label}
                  </button>
                ))}
              </div>
            )}

            {search.length > 2 && !searchResults && (
              <div style={{ padding: 16, textAlign: 'center', color: 'var(--an-text3)', fontSize: 13 }}>
                Searching...
              </div>
            )}
            {searchResults && Array.isArray(searchResults) && searchResults.length > 0 && (
              <div style={{ padding: 8 }}>
                {(['order', 'customer', 'task'] as const).map(type => {
                  const group = searchResults.filter((r: any) => r.type === type);
                  if (!group.length) return null;
                  const labels: Record<string, string> = { order: 'Orders', customer: 'Customers', task: 'Tasks' };
                  return (
                    <div key={type} style={{ marginBottom: 4 }}>
                      <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--an-text3)', textTransform: 'uppercase', padding: '4px 8px' }}>
                        {labels[type]}
                      </div>
                      {group.map((item: any) => (
                        <button
                          key={item.id}
                          onClick={() => handleSearchSelect(item)}
                          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left' }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--an-sidebar)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                        >
                          <div style={{ width: 28, height: 28, borderRadius: 6, background: type === 'order' ? 'var(--an-blue-bg)' : type === 'customer' ? 'var(--an-green-bg)' : 'var(--an-purple-bg, var(--an-blue-bg))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <ExternalLink size={12} style={{ color: type === 'order' ? 'var(--an-blue-text)' : type === 'customer' ? 'var(--an-green-text)' : 'var(--an-text2)' }} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--an-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title || '—'}</div>
                            {item.subtitle && <div style={{ fontSize: 11, color: 'var(--an-text3)', marginTop: 1 }}>{item.subtitle}</div>}
                          </div>
                        </button>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
            {searchResults && Array.isArray(searchResults) && searchResults.length === 0 && filteredPages.length === 0 && (
              <div style={{ padding: 16, textAlign: 'center', color: 'var(--an-text3)', fontSize: 13 }}>
                No results for "{search}"
              </div>
            )}
            
            {/* Keyboard shortcut hint */}
            <div style={{
              padding: '8px 12px',
              borderTop: '1px solid var(--an-border)',
              fontSize: 11,
              color: 'var(--an-text3)',
              display: 'flex',
              justifyContent: 'space-between',
            }}>
              <span>Press <kbd style={{ padding: '2px 6px', background: 'var(--an-sidebar)', borderRadius: 4, fontSize: 10 }}>↓</kbd> to navigate</span>
              <span>Press <kbd style={{ padding: '2px 6px', background: 'var(--an-sidebar)', borderRadius: 4, fontSize: 10 }}>Esc</kbd> to close</span>
            </div>
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
          <button 
            className={`an-icon-btn ${showNotifications ? 'active' : ''}`} 
            title="Notifications"
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfile(false);
            }}
          >
            {hasUnread && <span className="dot" />}
            <Bell size={14} strokeWidth={2} />
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="an-search-dropdown" style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              width: 340,
              marginTop: 8,
              background: 'white',
              borderRadius: 12,
              border: '1px solid var(--an-border)',
              boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
              zIndex: 100,
              display: 'flex',
              flexDirection: 'column',
              maxHeight: 500,
            }}>
              <div style={{ 
                padding: '12px 16px', 
                borderBottom: '1px solid var(--an-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'var(--an-sidebar)',
                borderTopLeftRadius: 11,
                borderTopRightRadius: 11,
              }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--an-text)' }}>Notifications</div>
                {hasUnread && (
                  <span style={{ 
                    fontSize: 10, 
                    fontWeight: 700, 
                    background: 'var(--an-blue-bg)', 
                    color: 'var(--an-blue-text)',
                    padding: '2px 6px',
                    borderRadius: 10,
                  }}>
                    {unreadAlerts.length} New
                  </span>
                )}
              </div>

              <div style={{ overflowY: 'auto', flex: 1 }}>
                {unreadAlerts.length === 0 ? (
                  <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                    <div style={{ color: 'var(--an-text3)', marginBottom: 8 }}>
                      <Check size={24} style={{ margin: '0 auto', opacity: 0.5 }} />
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--an-text2)', fontWeight: 500 }}>All caught up!</div>
                    <div style={{ fontSize: 11, color: 'var(--an-text3)' }}>No new alerts at the moment.</div>
                  </div>
                ) : (
                  <div className="divide-y divide-[var(--an-border)]">
                    {unreadAlerts.slice(0, 10).map((alert) => (
                      <div 
                        key={alert.id} 
                        style={{ 
                          padding: '12px 16px', 
                          display: 'flex', 
                          gap: 12,
                          transition: 'background 0.1s',
                          cursor: 'default',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--an-hover)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <div style={{ 
                          width: 28, 
                          height: 28, 
                          borderRadius: 8, 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          flexShrink: 0,
                          marginTop: 2,
                          background: alert.severity === 'high' || alert.type === 'error' ? 'var(--an-red-bg)' : 
                                      alert.severity === 'medium' || alert.type === 'warning' ? 'var(--an-orange-bg)' : 
                                      alert.type === 'success' ? 'var(--an-green-bg)' : 'var(--an-blue-bg)',
                          color: alert.severity === 'high' || alert.type === 'error' ? 'var(--an-red-text)' : 
                                 alert.severity === 'medium' || alert.type === 'warning' ? 'var(--an-orange-text)' : 
                                 alert.type === 'success' ? 'var(--an-green-text)' : 'var(--an-blue-text)',
                        }}>
                          {alert.severity === 'high' || alert.type === 'error' ? <AlertCircle size={14} /> : 
                           alert.severity === 'medium' || alert.type === 'warning' ? <AlertTriangle size={14} /> : 
                           alert.type === 'success' ? <Check size={14} /> : <Info size={14} />}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--an-text)', marginBottom: 2 }}>
                              {alert.title}
                            </div>
                            <button 
                              onClick={() => dismissMutation.mutate(alert.id)}
                              style={{ 
                                border: 'none', 
                                background: 'transparent', 
                                padding: 2, 
                                cursor: 'pointer',
                                color: 'var(--an-text3)',
                                borderRadius: 4,
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--an-red-text)'}
                              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--an-text3)'}
                            >
                              <X size={12} />
                            </button>
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--an-text2)', lineHeight: 1.4, marginBottom: 6 }}>
                            {alert.message}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'var(--an-text3)' }}>
                            <Calendar size={10} />
                            {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ 
                padding: 10, 
                borderTop: '1px solid var(--an-border)',
                textAlign: 'center',
              }}>
                <button 
                  className="an-btn an-btn-ghost an-btn-sm" 
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => navigate('/admin/quality')} // Or a dedicated alerts page
                >
                  View All Notifications
                </button>
              </div>
            </div>
          )}
        </div>

        <div style={{ position: 'relative' }}>
          <button 
            className={`an-icon-btn ${showProfile ? 'active' : ''}`} 
            title="Profile"
            onClick={() => {
              setShowProfile(!showProfile);
              setShowNotifications(false);
            }}
          >
            <User size={14} strokeWidth={2} />
          </button>

          {/* Profile Dropdown */}
          {showProfile && (
            <div className="an-search-dropdown" style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              width: 220,
              marginTop: 8,
              background: 'white',
              borderRadius: 12,
              border: '1px solid var(--an-border)',
              boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
              zIndex: 100,
              padding: 8,
            }}>
              <div style={{ padding: '8px 12px 12px', borderBottom: '1px solid var(--an-border)', marginBottom: 4 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--an-text)' }}>{profile?.username || 'Admin User'}</div>
                <div style={{ fontSize: 11, color: 'var(--an-text3)' }}>{profile?.role || 'Administrator'}</div>
              </div>
              
              <button 
                className="an-nav-item" 
                style={{ width: '100%', fontSize: 12 }}
                onClick={() => navigate('/admin/platform')}
              >
                Account Settings
              </button>
              <button 
                className="an-nav-item" 
                style={{ width: '100%', fontSize: 12 }}
                onClick={() => {
                  localStorage.removeItem('admin_token');
                  localStorage.removeItem('admin_user');
                  window.location.href = '/admin/login';
                }}
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
