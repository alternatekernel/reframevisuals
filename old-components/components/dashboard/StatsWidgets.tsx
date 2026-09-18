import React, { useState, useEffect } from 'react';
import { portalFetch } from '../../lib/apiConfig';
import { motion } from 'framer-motion';
import { CreditCard, TrendingUp, Clock, MessageSquare, Package, CheckCircle2, AlertCircle } from 'lucide-react';
import { DashboardSurface } from './dashboard-primitives';

interface ActivityItem {
  id: string;
  type: 'order' | 'invoice' | 'chat';
  title?: string;
  status?: string;
  code?: string;
  amount?: number;
  message: string;
  timestamp: string;
}

interface UsageData {
  consumed: number;
  quota: number;
  balance: number;
  resetDate: string;
}

export const UsageWidget: React.FC = () => {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    portalFetch('/portal/billing/profile')
    .then(res => res.json())
    .then(res => {
      if (res.success && res.data?.usage) setUsage(res.data.usage);
      setLoading(false);
    })
    .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="h-32 animate-pulse rounded-2xl bg-bg-secondary" />;
  if (!usage) return null;

  const percentage = Math.min(100, Math.round((usage.consumed / usage.quota) * 100));

  return (
    <DashboardSurface className="p-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-[14px] font-semibold text-text-primary mb-1">Monthly Usage</h3>
          <p className="text-[12px] text-text-secondary">Credits reset on {usage.resetDate}</p>
        </div>
        <div className="rounded-lg bg-bg-secondary p-2">
          <CreditCard size={18} className="text-text-primary" />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-end">
          <div className="flex items-baseline gap-1">
            <span className="text-[24px] font-bold text-text-primary">{usage.consumed}</span>
            <span className="text-[14px] text-text-secondary">/ {usage.quota} assets</span>
          </div>
          <span className="text-[12px] font-medium px-2 py-1 bg-gray-100 rounded-md">
            {100 - percentage}% remaining
          </span>
        </div>

        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-full bg-brand-ink"
          />
        </div>

        <div className="flex gap-4 pt-2">
          <button className="text-[12px] font-medium text-text-primary hover:underline">
            Upgrade Plan
          </button>
          <button className="text-[12px] font-medium text-text-primary hover:underline">
            Buy Add-ons
          </button>
        </div>
      </div>
    </DashboardSurface>
  );
};

export const ActivityFeed: React.FC = () => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    portalFetch('/portal/activity')
    .then(res => res.json())
    .then(res => {
      if (res.success && Array.isArray(res.data)) setActivities(res.data);
      setLoading(false);
    })
    .catch(() => setLoading(false));
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case 'order': return <Package size={14} />;
      case 'invoice': return <TrendingUp size={14} />;
      case 'chat': return <MessageSquare size={14} />;
      default: return <Clock size={14} />;
    }
  };

  if (loading) return <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-16 bg-gray-50 animate-pulse rounded-xl" />)}</div>;

  return (
    <div className="space-y-4">
      <h3 className="text-[14px] font-semibold text-text-primary px-1">Recent Activity</h3>
      <div className="space-y-3">
        {activities.map((item) => (
          <div 
            key={item.id} 
            className="group flex cursor-pointer items-start gap-4 rounded-xl border border-transparent p-3 transition-colors duration-200 hover:border-borderSubtle hover:bg-bg-secondary"
          >
            <div className={`p-2 rounded-lg shrink-0 ${
              item.type === 'order' ? 'bg-blue-50 text-blue-600' :
              item.type === 'invoice' ? 'bg-green-50 text-green-600' :
              'bg-orange-50 text-orange-600'
            }`}>
              {getIcon(item.type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start">
                <p className="text-[13px] font-medium text-text-primary truncate">
                  {item.title || (item.type === 'order' ? `Order #${item.code}` : item.type.toUpperCase())}
                </p>
                <span className="text-[11px] text-text-tertiary whitespace-nowrap ml-2">
                  {new Date(item.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                </span>
              </div>
              <p className="text-[12px] text-text-secondary line-clamp-1 mt-0.5">
                {item.message}
              </p>
            </div>
          </div>
        ))}
        {activities.length === 0 && (
          <div className="text-center py-8">
            <p className="text-[13px] text-text-tertiary">No recent activity to show.</p>
          </div>
        )}
      </div>
    </div>
  );
};
