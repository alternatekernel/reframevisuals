import React from 'react';

const TEMPLATES = [
  { title: 'Amazon Product Specs',  sub: 'Last updated 12 days ago' },
  { title: 'Ghost Mannequin SOP',   sub: 'Standard quality guidelines' },
  { title: 'Express Rush Briefing', sub: 'Rush turnaround instructions' },
];

export const QuoteTemplatesPage: React.FC = () => (
  <div>
    <div className="an-page-header">
      <div className="an-page-title">
        <span className="ph-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
            <path d="M9 9h10M9 13h10M9 17h6"/>
          </svg>
        </span>
        Templates
      </div>
      <div className="an-page-desc">Reusable document and retouching specification templates</div>
      <div className="an-page-actions">
        <button className="an-btn an-btn-primary an-btn-sm">+ New Template</button>
      </div>
    </div>
    <div className="an-grid3">
      {TEMPLATES.map(t => (
        <div key={t.title} className="an-card">
          <div className="an-sec-title">{t.title}</div>
          <div className="an-metric-sub">{t.sub}</div>
          <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
            <button className="an-btn an-btn-ghost an-btn-sm">Edit</button>
            <button className="an-btn an-btn-ghost an-btn-sm">Duplicate</button>
          </div>
        </div>
      ))}
    </div>
  </div>
);
