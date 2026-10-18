import React from 'react';

export const AutomationPage: React.FC = () => (
  <div>
    <div className="an-page-header">
      <div className="an-page-title">
        <span className="ph-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 21a9 9 0 100-18 9 9 0 000 18z"/>
            <path d="M12 7v5l3 3"/>
          </svg>
        </span>
        Automation
      </div>
      <div className="an-page-desc">System workflows and trigger-based actions</div>
      <div className="an-page-actions">
        <button className="an-btn an-btn-primary an-btn-sm">+ New Workflow</button>
      </div>
    </div>

    <div className="an-card">
      <div className="an-sec-hdr">
        <span className="an-sec-title">Active Workflows</span>
        <span className="an-badge an-badge-green">2 active</span>
      </div>
      {[
        { name: 'Onboarding Sequence', desc: 'Triggers on new customer signup', stat: 'Running · 42 processed this month' },
        { name: 'SLA Breach Alert',    desc: 'Pings #ops-urgent on Slack when SLA breached', stat: 'Enabled' },
        { name: 'Invoice Auto-send',   desc: 'Sends invoice after order is marked complete', stat: 'Running · 18 sent this month' },
        { name: 'Lead Follow-up',      desc: 'Sends follow-up email 48h after quote sent', stat: 'Paused' },
      ].map(w => (
        <div key={w.name} className="an-act-item" style={{ cursor: 'pointer' }}>
          <div style={{ flex: 1 }}>
            <div className="an-act-text"><strong>{w.name}</strong> · {w.desc}</div>
            <div className="an-act-time">{w.stat}</div>
          </div>
          <button className="an-btn an-btn-ghost an-btn-sm">Edit</button>
        </div>
      ))}
    </div>
  </div>
);
