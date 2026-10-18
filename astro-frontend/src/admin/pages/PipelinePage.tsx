import React from 'react';

export const PipelinePage: React.FC = () => (
  <div>
    <div className="an-page-header">
      <div className="an-page-title">
        <span className="ph-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M3 12l3-3 4 4 7-7m-1 7l1-1 4 4"/>
          </svg>
        </span>
        Sales Pipeline
      </div>
      <div className="an-page-desc">Funnel performance and conversion metrics</div>
    </div>

    <div className="an-grid2" style={{ marginBottom: 12 }}>
      <div className="an-card">
        <div className="an-sec-title">Conversion Rates</div>
        {[
          { label: 'Visitor to Lead', pct: 8.2,  bar: 82, cls: 'an-bar-blue' },
          { label: 'Lead to Trial',   pct: 24,   bar: 44, cls: 'an-bar-purple' },
          { label: 'Trial to Paid',   pct: 62,   bar: 62, cls: 'an-bar-green' },
        ].map(r => (
          <div className="an-prog-row" key={r.label}>
            <div className="an-prog-label">{r.label}<span>{r.pct}%</span></div>
            <div className="an-bar-track"><div className={`an-bar-fill ${r.cls}`} style={{ width: `${r.bar}%` }} /></div>
          </div>
        ))}
      </div>
      <div className="an-card">
        <div className="an-sec-title">Monthly Goal ($50k)</div>
        <div className="an-metric-value" style={{ marginTop: 8 }}>$32,400</div>
        <div className="an-bar-track" style={{ height: 12, marginTop: 20 }}>
          <div className="an-bar-fill an-bar-green" style={{ width: '65%' }} />
        </div>
        <div className="an-metric-sub" style={{ marginTop: 10 }}>65% of target reached</div>
      </div>
    </div>

    <div className="an-card">
      <div className="an-sec-title" style={{ marginBottom: 12 }}>Recent Opportunities</div>
      <div className="an-tbl-wrap">
        <table>
          <thead><tr><th>Company</th><th>Stage</th><th>Value</th><th>Score</th><th>Last Activity</th></tr></thead>
          <tbody>
            {[
              { co: 'Acme Fashion', stage: 'Quoted', val: '$4,200', score: 'an-badge-green', scoreVal: 'Hot', last: '2h ago' },
              { co: 'UrbanCo', stage: 'Trial', val: '$5,600', score: 'an-badge-blue', scoreVal: 'Warm', last: 'Yesterday' },
            ].map(r => (
              <tr key={r.co}>
                <td className="an-td-main">{r.co}</td>
                <td>{r.stage}</td>
                <td style={{ fontWeight: 600, color: 'var(--an-orange-text)' }}>{r.val}</td>
                <td><span className={`an-badge ${r.score}`}>{r.scoreVal}</span></td>
                <td className="an-td-mono">{r.last}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);
