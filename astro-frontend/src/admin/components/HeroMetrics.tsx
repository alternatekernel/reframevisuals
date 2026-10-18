import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Clock, Users, Package, DollarSign, Activity } from 'lucide-react';
import { cx } from '../../utils/theme';
import { adminFetch } from '../utils/api';

interface HeroMetricsData {
  slaHealth?: {
    value: number;
    trend: number;
    status: string;
  };
  capacityUtilization?: {
    value: number;
    available: number;
    total: number;
    trend: number;
  };
  activeOrders?: {
    value: number;
    breakdown: {
      new: number;
      inProgress: number;
      readyQC: number;
    };
    trend: number;
  };
  weeklyRevenue?: {
    value: number;
    currency: string;
    trend: number;
  };
}

export const HeroMetrics: React.FC = () => {
  const [data, setData] = useState<HeroMetricsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const result = await adminFetch('/metrics/hero');
      setData(result);
    } catch (err: any) {
      console.error('Error fetching metrics:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 rounded-[2rem] bg-[var(--admin-surface)] border border-[var(--admin-border)] animate-pulse shadow-xl" />
        ))}
      </div>
    );
  }

  const formatValue = (val: number | undefined) => (val !== undefined ? val : 0);

  const metrics = [
    {
      label: 'System SLA Health',
      value: `${formatValue(data?.slaHealth?.value)}%`,
      sub: data?.slaHealth?.status === 'good' ? 'OPTIMAL' : 'LATENCY WARNING',
      trend: data?.slaHealth?.trend || 0,
      icon: <Clock size={20} />,
      color: 'var(--admin-accent)',
      glow: 'rgba(232,148,58,0.2)'
    },
    {
      label: 'Resource Capacity',
      value: `${formatValue(data?.capacityUtilization?.value)}%`,
      sub: `${data?.capacityUtilization?.available || 0} SLOTS AVAILABLE`,
      trend: data?.capacityUtilization?.trend || 0,
      icon: <Users size={20} />,
      color: 'var(--admin-purple)',
      glow: 'rgba(168,85,247,0.2)'
    },
    {
      label: 'Operation Throughput',
      value: formatValue(data?.activeOrders?.value),
      sub: 'ACTIVE PIPELINE',
      trend: data?.activeOrders?.trend || 0,
      icon: <Package size={20} />,
      color: 'var(--admin-blue)',
      glow: 'rgba(59,130,246,0.2)'
    },
    {
      label: 'Cumulative Yield',
      value: `$${(formatValue(data?.weeklyRevenue?.value) / 1000).toFixed(1)}K`,
      sub: 'WEEKLY PROJECTION',
      trend: data?.weeklyRevenue?.trend || 0,
      icon: <DollarSign size={20} />,
      color: 'var(--admin-green)',
      glow: 'rgba(16,185,129,0.2)'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
      {metrics.map((m, i) => (
        <div key={i} className="group relative bg-[var(--admin-surface)] border border-[var(--admin-border)] rounded-[2rem] p-6 shadow-2xl transition-all hover:scale-[1.02] hover:border-[var(--admin-border-2)] overflow-hidden">
          {/* Background Decor */}
          <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full blur-3xl transition-opacity opacity-20 group-hover:opacity-40" style={{ backgroundColor: m.color }} />
          
          <div className="flex items-center justify-between mb-4">
            <div className="p-2.5 rounded-2xl bg-[var(--admin-surface-3)] border border-[var(--admin-border)] text-[var(--admin-text-3)] group-hover:text-[var(--admin-text)] transition-colors shadow-inner" style={{ boxShadow: `inset 0 0 15px ${m.glow}` }}>
              {m.icon}
            </div>
            <div className={cx(
              "flex items-center gap-1 text-[11px] font-black px-2 py-1 rounded-lg uppercase tracking-wider",
              m.trend >= 0 ? "bg-[var(--admin-green-dim)] text-[var(--admin-green)]" : "bg-[var(--admin-red-dim)] text-[var(--admin-red)]"
            )}>
              {m.trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {Math.abs(m.trend)}%
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-[10px] font-black text-[var(--admin-text-3)] uppercase tracking-[0.2em]">{m.label}</div>
            <div className="text-[32px] font-[var(--admin-font-display)] font-black text-[var(--admin-text)] tracking-tighter leading-none">{m.value}</div>
            <div className="text-[10px] font-bold text-[var(--admin-text-2)] uppercase tracking-tight flex items-center gap-1.5 opacity-60">
               <Activity size={10} className="text-[var(--admin-accent)]" /> {m.sub}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
