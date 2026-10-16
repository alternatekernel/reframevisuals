import React from 'react';
import { useNavigate } from 'react-router-dom';

export const DealsPage: React.FC = () => {
  const nav = useNavigate();
  return (
    <div>
      <div className="an-page-header">
        <div className="an-page-title">
          <span className="ph-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 21a9 9 0 100-18 9 9 0 000 18z"/>
              <path d="M8 12l3 3 5-5"/>
            </svg>
          </span>
          Deals
        </div>
        <div className="an-page-desc">Large scale contracts and long-term partnerships</div>
        <div className="an-page-actions">
          <button className="an-btn an-btn-primary an-btn-sm">+ New Deal</button>
        </div>
      </div>

      <div className="an-card" style={{ marginBottom: 12 }}>
        <div className="an-sec-title" style={{ marginBottom: 12 }}>Pending Signatures</div>
        <div className="an-act-item" style={{ cursor: 'pointer' }} onClick={() => nav('/admin/nda')}>
          <div>
            <div className="an-act-text"><strong>Master Services Agreement</strong> · Acme Corp ($48k/yr)</div>
            <div className="an-act-time">Sent 2 days ago</div>
          </div>
          <button className="an-btn an-btn-blue an-btn-sm" style={{ marginLeft: 'auto', marginTop: 4 }}>View NDA</button>
        </div>
      </div>

      <div className="an-card-flush">
        <div className="an-tbl-wrap">
          <table>
            <thead><tr><th>Deal Name</th><th>Client</th><th>Value</th><th>Stage</th><th>Closing</th></tr></thead>
            <tbody>
              {[
                { name: 'Annual Retouching Contract', client: 'StyleHouse Inc.', value: '$43,200', stage: 'Negotiation', stageCls: 'an-badge-yellow' },
                { name: 'Product Photography SLA',    client: 'Nike Retail',     value: '$62,000', stage: 'Proposed',    stageCls: 'an-badge-blue' },
              ].map(d => (
                <tr key={d.name} style={{ cursor: 'pointer' }}>
                  <td className="an-td-main">{d.name}</td>
                  <td>{d.client}</td>
                  <td style={{ fontWeight: 600 }}>{d.value}</td>
                  <td><span className={`an-badge ${d.stageCls}`}>{d.stage}</span></td>
                  <td className="an-td-mono">Apr 15</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
