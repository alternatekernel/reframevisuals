import React from 'react';
import { BookOpen, Search, Video, Download } from 'lucide-react';

export const StyleGuidePage: React.FC = () => {
  const guides = [
    { id: '1', title: 'Shadow & Reflection Standards', category: 'shadows', version: '2.3', updated: '2026-03-20', views: 234, approved: 'Priya Sharma' },
    { id: '2', title: 'Background Removal Guidelines', category: 'background', version: '1.8', updated: '2026-03-18', views: 189, approved: 'Rajesh Kumar' },
    { id: '3', title: 'Color Correction Best Practices', category: 'color', version: '3.1', updated: '2026-03-15', views: 312, approved: 'Priya Sharma' },
    { id: '4', title: 'Jewelry Editing Standards', category: 'specialty', version: '1.2', updated: '2026-03-10', views: 156, approved: 'Rajesh Kumar' },
    { id: '5', title: 'Apparel Ghost Mannequin', category: 'specialty', version: '2.0', updated: '2026-03-08', views: 178, approved: 'Priya Sharma' },
    { id: '6', title: 'White Background Standards', category: 'background', version: '4.2', updated: '2026-03-05', views: 445, approved: 'Rajesh Kumar' },
  ];

  const categories = ['all', 'shadows', 'background', 'color', 'specialty'];
  const [activeCategory, setActiveCategory] = React.useState('all');

  const filteredGuides = activeCategory === 'all' ? guides : guides.filter(g => g.category === activeCategory);

  return (
    <div className="an-content" style={{ maxWidth: 1400 }}>
      <div className="an-page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="an-page-title">Style Guide Documentation</h1>
            <p className="an-page-desc">Editing standards, examples, and best practices</p>
          </div>
          <div className="an-page-actions">
            <div className="an-search-wrap">
              <Search size={13} />
              <input type="text" placeholder="Search guides..." className="an-search-input" style={{ width: 240 }} />
            </div>
            <button className="an-btn an-btn-primary">New Guide</button>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="an-tabs-pill mb-4" style={{ width: 'fit-content' }}>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`an-tab-pill capitalize${activeCategory === cat ? ' active' : ''}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Guides Grid */}
      <div className="an-grid3">
        {filteredGuides.map(guide => (
          <div key={guide.id} className="an-card">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen size={14} style={{ color: 'var(--an-text3)' }} />
              <span className="an-badge an-badge-gray uppercase">{guide.category}</span>
            </div>
            <h3 style={{ fontSize: 'var(--an-text-md)', fontWeight: 600, color: 'var(--an-text)', marginBottom: 6 }}>{guide.title}</h3>
            <div className="flex items-center justify-between" style={{ fontSize: 'var(--an-text-sm)', color: 'var(--an-text3)', marginBottom: 12 }}>
              <span>v{guide.version}</span>
              <span>Updated {guide.updated}</span>
            </div>
            <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid var(--an-border)' }}>
              <div className="flex items-center gap-3">
                <button className="an-btn an-btn-ghost an-btn-sm flex items-center gap-1"><Video size={11} /> Tutorial</button>
                <button className="an-btn an-btn-ghost an-btn-sm flex items-center gap-1"><Download size={11} /> PDF</button>
              </div>
              <span style={{ fontSize: 'var(--an-text-sm)', color: 'var(--an-text3)' }}>{guide.views} views</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
