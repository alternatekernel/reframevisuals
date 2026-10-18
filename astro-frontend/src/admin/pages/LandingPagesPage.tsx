import React from 'react';

const PAGES = [
  { name: 'E-commerce Solutions', path: '/industries/ecommerce', views: '12.4k', conv: '14.2%', convCls: 'an-badge-green', status: 'Live', statusCls: 'an-badge-green' },
  { name: 'Real Estate Retouching', path: '/industries/real-estate', views: '3.1k', conv: '9.1%', convCls: 'an-badge-blue', status: 'Live', statusCls: 'an-badge-green' },
  { name: 'Fashion Retouching', path: '/industries/fashion', views: '1.8k', conv: '7.4%', convCls: 'an-badge-blue', status: 'Draft', statusCls: 'an-badge-gray' },
];

export const LandingPagesPage: React.FC = () => (
  <div>
    <div className="an-page-header">
      <div className="an-page-title">
        <span className="ph-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z"/>
            <path d="M13 2v7h7"/>
          </svg>
        </span>
        Landing Pages
      </div>
      <div className="an-page-desc">Marketing pages and lead capture sites</div>
      <div className="an-page-actions">
        <button className="an-btn an-btn-primary an-btn-sm">+ New Page</button>
      </div>
    </div>

    <div className="an-card-flush">
      <div className="an-tbl-wrap">
        <table>
          <thead>
            <tr><th>Page Name</th><th>URL Path</th><th>Views</th><th>Conversion</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {PAGES.map(p => (
              <tr key={p.name}>
                <td className="an-td-main">{p.name}</td>
                <td style={{ fontSize: 12, color: 'var(--an-text3)' }}>{p.path}</td>
                <td className="an-td-mono">{p.views}</td>
                <td><span className={`an-badge ${p.convCls}`}>{p.conv}</span></td>
                <td><span className={`an-badge ${p.statusCls}`}>{p.status}</span></td>
                <td><button className="an-btn an-btn-ghost an-btn-sm">Edit</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);
