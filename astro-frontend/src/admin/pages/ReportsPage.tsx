import React from 'react';

export const ReportsPage: React.FC = () => (
  <div>
    <div className="an-page-header">
      <div className="an-page-title">
        <span className="ph-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <rect x="3" y="4" width="18" height="18" rx="2"/>
            <path d="M16 2v4M8 2v4M3 10h18"/>
          </svg>
        </span>
        Reports
      </div>
      <div className="an-page-desc">Generate and download business intelligence reports</div>
      <div className="an-page-actions">
        <button className="an-btn an-btn-primary an-btn-sm">+ Generate Report</button>
      </div>
    </div>

    <div className="an-card">
      {[
        { title: 'Monthly Financial Statement - Feb 2024', sub: 'Ready for download · PDF', btn: 'Download' },
        { title: 'Editor Productivity Audit - Q1',        sub: 'Ready for download · XLSX', btn: 'Download' },
        { title: 'SLA Compliance Summary - Mar 2024',     sub: 'Generating… · PDF', btn: 'Wait' },
      ].map(r => (
        <div key={r.title} className="an-act-item">
          <div style={{ flex: 1 }}>
            <div className="an-act-text">{r.title}</div>
            <div className="an-act-time">{r.sub}</div>
          </div>
          <button className="an-btn an-btn-ghost an-btn-sm">{r.btn}</button>
        </div>
      ))}
    </div>
  </div>
);
