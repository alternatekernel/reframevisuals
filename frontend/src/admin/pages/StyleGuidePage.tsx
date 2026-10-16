import React from 'react';
import { BookOpen, Search, Video, Download } from 'lucide-react';

const colors = {
  bgPrimary: '#FFFFFF', bgSecondary: '#F7F7F5', bgTertiary: '#EFEFEF', bgHover: '#EAEAE5',
  textPrimary: '#37352F', textSecondary: '#787774', textTertiary: '#9B9A97',
  borderLight: '#E9E9E8', accentBlue: '#0066FF',
};

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
    <div className="p-4 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-[20px] font-bold" style={{ color: colors.textPrimary }}>Style Guide Documentation</h1>
          <p className="text-[14px]" style={{ color: colors.textTertiary }}>Editing standards, examples, and best practices</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: colors.textTertiary }} />
            <input type="text" placeholder="Search guides..." className="pl-8 pr-3 py-1.5 text-[15px] rounded-md border focus:outline-none w-64" style={{ background: colors.bgSecondary, borderColor: colors.borderLight, color: colors.textPrimary }} />
          </div>
          <button className="px-4 py-2 text-[15px] font-medium rounded-md" style={{ background: colors.textPrimary, color: '#FFF' }}>New Guide</button>
        </div>
      </div>

      {/* Categories */}
      <div className="flex items-center gap-2 mb-4">
        {categories.map(cat => (
          <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-3 py-1.5 text-[14px] font-medium rounded-full capitalize ${activeCategory === cat ? 'font-semibold' : ''}`} style={{ background: activeCategory === cat ? colors.textPrimary : colors.bgSecondary, color: activeCategory === cat ? '#FFF' : colors.textSecondary }}>{cat}</button>
        ))}
      </div>

      {/* Guides Grid */}
      <div className="grid grid-cols-3 gap-4">
        {filteredGuides.map(guide => (
          <div key={guide.id} className="p-4 rounded-md border hover:shadow-md transition-shadow" style={{ background: colors.bgPrimary, borderColor: colors.borderLight }}>
            <div className="flex items-center gap-2 mb-3">
              <BookOpen size={16} style={{ color: colors.textSecondary }} />
              <span className="text-[14px] uppercase font-medium px-2 py-0.5 rounded" style={{ background: colors.bgTertiary, color: colors.textSecondary }}>{guide.category}</span>
            </div>
            <h3 className="text-[14px] font-semibold mb-2" style={{ color: colors.textPrimary }}>{guide.title}</h3>
            <div className="flex items-center justify-between text-[14px] mb-3" style={{ color: colors.textTertiary }}>
              <span>v{guide.version}</span>
              <span>Updated {guide.updated}</span>
            </div>
            <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: colors.borderLight }}>
              <div className="flex items-center gap-3">
                <button className="flex items-center gap-1 text-[14px] hover:underline" style={{ color: colors.accentBlue }}><Video size={12} /> Tutorial</button>
                <button className="flex items-center gap-1 text-[14px] hover:underline" style={{ color: colors.accentBlue }}><Download size={12} /> PDF</button>
              </div>
              <span className="text-[14px]" style={{ color: colors.textTertiary }}>{guide.views} views</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
