import React from 'react';
import { Eye, Bell, TrendingUp, Target } from 'lucide-react';

const colors = {
  bgPrimary: '#FFFFFF', bgSecondary: '#F7F7F5', bgTertiary: '#EFEFEF',
  textPrimary: '#37352F', textSecondary: '#787774', textTertiary: '#9B9A97',
  borderLight: '#E9E9E8', accentGreen: '#007A5A', accentOrange: '#FF9F2E', accentRed: '#FF3B30',
};

export const WatchlistPage: React.FC = () => {
  const entries = [
    { id: '1', company: 'Gymshark', website: 'gymshark.com', industry: 'Apparel & Fitness', volume: 5000, priority: 'high', notes: 'Fast-growing fitness brand. Currently using competitor (Clipping Path India). Recent funding round of $100M.', tags: ['high-value', 'fitness', 'funded'], lastActivity: '2026-03-24' },
    { id: '2', company: 'Allbirds', website: 'allbirds.com', industry: 'Footwear', volume: 3000, priority: 'high', notes: 'Sustainable footwear brand. Strong eCommerce presence. Potential for regular monthly batches.', tags: ['footwear', 'sustainable', 'ecommerce'], lastActivity: '2026-03-23' },
    { id: '3', company: 'Glossier', website: 'glossier.com', industry: 'Beauty & Cosmetics', volume: 2000, priority: 'medium', notes: 'Beauty brand with consistent product launches. High-quality imagery standards.', tags: ['beauty', 'regular', 'premium'], lastActivity: '2026-03-20' },
    { id: '4', company: 'Away Luggage', website: 'awaytravel.com', industry: 'Travel & Luggage', volume: 1500, priority: 'medium', notes: 'DTC travel brand. Product photography needs for new collections.', tags: ['travel', 'DTC'], lastActivity: '2026-03-18' },
  ];

  const alerts = [
    { id: '1', company: 'Gymshark', type: 'funding', message: 'Gymshark raised $100M in Series D funding', date: '2026-03-24' },
    { id: '2', company: 'Allbirds', type: 'hiring', message: 'Allbirds is hiring a Photography Manager', date: '2026-03-22' },
    { id: '3', company: 'Glossier', type: 'product', message: 'Glossier launching new skincare line', date: '2026-03-20' },
  ];

  return (
    <div className="p-4 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-[20px] font-bold" style={{ color: colors.textPrimary }}>Observations / Watchlist</h1>
          <p className="text-[14px]" style={{ color: colors.textTertiary }}>High-value target tracking and activity monitoring</p>
        </div>
        <button className="px-4 py-2 text-[15px] font-medium rounded-md flex items-center gap-2" style={{ background: colors.textPrimary, color: '#FFF' }}>+ Add Company</button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <div className="p-4 rounded-md border" style={{ background: colors.bgPrimary, borderColor: colors.borderLight }}>
          <div className="flex items-center gap-2 mb-2"><Eye size={16} style={{ color: colors.textSecondary }} /><span className="text-[14px] font-medium" style={{ color: colors.textSecondary }}>Companies Tracked</span></div>
          <div className="text-[24px] font-semibold" style={{ color: colors.textPrimary }}>{entries.length}</div>
        </div>
        <div className="p-4 rounded-md border" style={{ background: colors.bgPrimary, borderColor: colors.borderLight }}>
          <div className="flex items-center gap-2 mb-2"><Target size={16} style={{ color: colors.textSecondary }} /><span className="text-[14px] font-medium" style={{ color: colors.textSecondary }}>High Priority</span></div>
          <div className="text-[24px] font-semibold" style={{ color: colors.accentRed }}>{entries.filter(e => e.priority === 'high').length}</div>
        </div>
        <div className="p-4 rounded-md border" style={{ background: colors.bgPrimary, borderColor: colors.borderLight }}>
          <div className="flex items-center gap-2 mb-2"><Bell size={16} style={{ color: colors.textSecondary }} /><span className="text-[14px] font-medium" style={{ color: colors.textSecondary }}>Alerts (7d)</span></div>
          <div className="text-[24px] font-semibold" style={{ color: colors.textPrimary }}>{alerts.length}</div>
        </div>
        <div className="p-4 rounded-md border" style={{ background: colors.bgPrimary, borderColor: colors.borderLight }}>
          <div className="flex items-center gap-2 mb-2"><TrendingUp size={16} style={{ color: colors.textSecondary }} /><span className="text-[14px] font-medium" style={{ color: colors.textSecondary }}>Est. Total Volume</span></div>
          <div className="text-[24px] font-semibold" style={{ color: colors.textPrimary }}>{(entries.reduce((sum, e) => sum + e.volume, 0) / 1000).toFixed(1)}K/mo</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {/* Watchlist Entries */}
        <div className="col-span-2 rounded-md border overflow-hidden" style={{ borderColor: colors.borderLight, background: colors.bgPrimary }}>
          <div className="px-4 py-3 border-b" style={{ borderColor: colors.borderLight }}>
            <h3 className="text-[14px] font-semibold" style={{ color: colors.textPrimary }}>Companies</h3>
          </div>
          <div className="divide-y" style={{ borderColor: colors.borderLight }}>
            {entries.map(entry => (
              <div key={entry.id} className="px-4 py-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="text-[14px] font-semibold" style={{ color: colors.textPrimary }}>{entry.company}</div>
                      <div className="text-[14px]" style={{ color: colors.textTertiary }}>{entry.website} • {entry.industry}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-[14px] px-2 py-1 rounded font-medium ${entry.priority === 'high' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>{entry.priority.toUpperCase()}</span>
                    <span className="text-[14px] font-medium" style={{ color: colors.textSecondary }}>{entry.volume.toLocaleString()} imgs/mo</span>
                  </div>
                </div>
                <div className="text-[14px] mb-2" style={{ color: colors.textSecondary }}>{entry.notes}</div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 flex-wrap">
                    {entry.tags.map((tag, i) => (
                      <span key={i} className="text-[14px] px-1.5 py-0.5 rounded" style={{ background: colors.bgTertiary, color: colors.textSecondary }}>#{tag}</span>
                    ))}
                  </div>
                  <span className="text-[14px]" style={{ color: colors.textTertiary }}>Last activity: {entry.lastActivity}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Activity Alerts */}
        <div className="rounded-md border overflow-hidden" style={{ borderColor: colors.borderLight, background: colors.bgPrimary }}>
          <div className="px-4 py-3 border-b" style={{ borderColor: colors.borderLight }}>
            <h3 className="text-[14px] font-semibold" style={{ color: colors.textPrimary }}>Recent Activity</h3>
          </div>
          <div className="divide-y" style={{ borderColor: colors.borderLight }}>
            {alerts.map(alert => (
              <div key={alert.id} className="px-4 py-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`w-2 h-2 rounded-full ${alert.type === 'funding' ? 'bg-green-500' : alert.type === 'hiring' ? 'bg-blue-500' : 'bg-orange-500'}`} />
                  <span className="text-[14px] font-medium capitalize" style={{ color: colors.textSecondary }}>{alert.type}</span>
                </div>
                <div className="text-[14px] font-medium mb-1" style={{ color: colors.textPrimary }}>{alert.company}</div>
                <div className="text-[14px]" style={{ color: colors.textTertiary }}>{alert.message}</div>
                <div className="text-[14px] mt-1" style={{ color: colors.textTertiary }}>{alert.date}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
