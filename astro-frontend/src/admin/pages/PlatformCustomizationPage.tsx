import React, { useState } from 'react';

export const PlatformCustomizationPage: React.FC = () => {
  const [clientPortalSettings, setClientPortalSettings] = useState({
    allowUploads: true,
    showProgress: true,
    enableChat: false,
  });

  const handleToggleSetting = (key: keyof typeof clientPortalSettings) => {
    setClientPortalSettings({
      ...clientPortalSettings,
      [key]: !clientPortalSettings[key],
    });
  };

  return (
    <div>
      <div className="an-page-header">
        <div className="an-page-title">
          <span className="ph-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.6a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9V15z"/>
            </svg>
          </span>
          Platform Customization
        </div>
        <div className="an-page-desc">Customize platform appearance and core configurations</div>
      </div>

      <div className="an-grid2">
        <div className="an-card">
          <div className="an-sec-title" style={{ marginBottom: 14 }}>Client Portal Settings</div>
          {[
            { label: 'Allow client file uploads', key: 'allowUploads' as const },
            { label: 'Show progress tracker', key: 'showProgress' as const },
            { label: 'Enable live chat widget', key: 'enableChat' as const },
            { label: 'Show invoice history', key: 'showInvoices' as const },
            { label: 'Enable quote approval', key: 'quoteApproval' as const },
          ].map((s, i) => (
            <div key={i} className="an-sla-row">
              <span style={{ color: 'var(--an-text)' }}>{s.label}</span>
              <button
                onClick={() => 'key' in s ? handleToggleSetting(s.key as any) : null}
                style={{
                  width: 34,
                  height: 18,
                  borderRadius: 10,
                  background: (clientPortalSettings as any)[s.key] ? 'var(--an-green-text)' : 'var(--an-border2)',
                  position: 'relative',
                  cursor: 'pointer',
                  border: 'none',
                  padding: 0,
                }}
              >
                <div style={{
                  position: 'absolute',
                  top: 2,
                  left: (clientPortalSettings as any)[s.key] ? 18 : 2,
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  background: '#fff',
                  boxShadow: '0 1px 3px rgba(0,0,0,.25)',
                  transition: 'left .2s'
                }} />
              </button>
            </div>
          ))}

          <div className="an-divider" />

          <div className="an-sec-title" style={{ marginBottom: 14 }}>Email Notifications</div>
          {[
            { label: 'New order notifications', enabled: true },
            { label: 'Payment received', enabled: true },
            { label: 'Low stock alerts', enabled: false },
            { label: 'Weekly reports', enabled: true },
          ].map((s, i) => (
            <div key={i} className="an-sla-row">
              <span style={{ color: 'var(--an-text)' }}>{s.label}</span>
              <div style={{
                width: 34,
                height: 18,
                borderRadius: 10,
                background: s.enabled ? 'var(--an-green-text)' : 'var(--an-border2)',
                position: 'relative',
                cursor: 'pointer',
              }}>
                <div style={{
                  position: 'absolute',
                  top: 2,
                  left: s.enabled ? 18 : 2,
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  background: '#fff',
                  boxShadow: '0 1px 3px rgba(0,0,0,.25)',
                  transition: 'left .2s'
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
