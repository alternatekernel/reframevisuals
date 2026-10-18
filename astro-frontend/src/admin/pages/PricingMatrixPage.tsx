import React, { useState } from 'react';
import { Download, Edit2, Plus, Trash2, TrendingUp, DollarSign, Target, PieChart, ShieldCheck, Zap, Activity } from 'lucide-react';
import { SectionHeader } from '../components/SectionHeader';
import { cx } from '../../utils/theme';

export const PricingMatrixPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'customer' | 'editor' | 'margin'>('customer');
  const [tiers] = useState([
    { id: 't1', name: 'Startup Tier', minVolume: 0, maxVolume: 99, discount: 0, prices: { standard: { low: 8.5, medium: 10.2, high: 12.8 }, premium: { low: 11.0, medium: 13.2, high: 15.8 }, express: { low: 14.5, medium: 17.2, high: 20.5 } } },
    { id: 't2', name: 'Growth Tier', minVolume: 100, maxVolume: 499, discount: 10, prices: { standard: { low: 7.65, medium: 9.18, high: 11.52 }, premium: { low: 9.9, medium: 11.88, high: 14.22 }, express: { low: 13.05, medium: 15.48, high: 18.45 } } },
    { id: 't3', name: 'Enterprise Tier', minVolume: 500, maxVolume: null, discount: 25, prices: { standard: { low: 6.2, medium: 7.44, high: 9.36 }, premium: { low: 8.25, medium: 9.9, high: 11.85 }, express: { low: 10.92, medium: 12.96, high: 15.48 } } },
  ]);

  const [marginMetrics] = useState({
    takeVsGiveRatio: 2.1,
    targetRatio: 2.5,
    grossMargin: 54,
    netMargin: 28,
    recentQuotes: [
      { code: 'QT-0847', customer: 'Nike_Global', price: 2070, payout: 1064, margin: 49 },
      { code: 'QT-0846', customer: 'Amazon_Prime', price: 1840, payout: 920, margin: 50 },
      { code: 'QT-0845', customer: 'Shopify_Plus', price: 945, payout: 472, margin: 50 },
    ],
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-1000 pb-20">
      <SectionHeader
        title="Pricing Matrix"
        description="Customer rates, editor payouts, and margin tracking by volume tier."
        parentPage="Fiscal / Pricing"
      />

      {/* Control Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-6 px-1">
         <div className="flex p-1.5 bg-[var(--admin-surface)] border border-[var(--admin-border)] rounded-2xl shadow-xl">
            {[
              { id: 'customer', label: 'Customer Rates', icon: <TrendingUp size={16} /> },
              { id: 'editor', label: 'Editor Payouts', icon: <DollarSign size={16} /> },
              { id: 'margin', label: 'Margin Analysis', icon: <ShieldCheck size={16} /> },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cx(
                  "flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-[12px] font-black uppercase tracking-widest transition-all",
                  activeTab === tab.id 
                    ? "bg-[var(--admin-accent)] text-black shadow-lg shadow-[var(--admin-accent)]/20" 
                    : "text-[var(--admin-text-3)] hover:text-[var(--admin-text)] hover:bg-[var(--admin-surface-2)]"
                )}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
         </div>
         
         <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-6 py-3 bg-[var(--admin-surface)] border border-[var(--admin-border)] text-[var(--admin-text)] rounded-xl text-[11px] font-black transition-all hover:bg-[var(--admin-surface-2)] shadow-xl uppercase tracking-widest">
               <Download size={16} /> EXPORT
            </button>
            <button className="px-8 py-3 bg-[var(--admin-accent)] text-black rounded-xl text-[11px] font-black transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-[var(--admin-accent)]/20 uppercase tracking-widest">
               CONFIGURE TIERS
            </button>
         </div>
      </div>

      {activeTab === 'customer' && (
        <div className="space-y-8">
          {tiers.map(tier => (
            <div key={tier.id} className="bg-[var(--admin-surface)] border border-[var(--admin-border)] rounded-[2.5rem] overflow-hidden shadow-2xl relative group">
              <div className="px-10 py-8 border-b border-[var(--admin-border)] bg-[var(--admin-surface-2)]/30 flex flex-wrap items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                   <div className="w-16 h-16 rounded-[2rem] bg-[var(--admin-bg)] border border-[var(--admin-border)] flex items-center justify-center text-[var(--admin-accent)] shadow-2xl">
                      <Zap size={24} />
                   </div>
                   <div>
                     <h3 className="text-[24px] font-[var(--admin-font-display)] font-black text-[var(--admin-text)] tracking-tighter uppercase leading-none mb-1">{tier.name}</h3>
                     <p className="text-[13px] text-[var(--admin-text-3)] font-medium uppercase tracking-tight">Volume: {tier.minVolume}-{tier.maxVolume || '∞'} units/mo • <span className="text-[var(--admin-accent)]">{tier.discount}% discount</span></p>
                   </div>
                </div>
                <div className="flex items-center gap-2">
                   <button className="p-3 bg-[var(--admin-surface-3)] border border-[var(--admin-border)] rounded-2xl text-[var(--admin-text-3)] hover:text-[var(--admin-text)] transition-all shadow-xl"><Edit2 size={18} /></button>
                   <button className="p-3 bg-[var(--admin-surface-3)] border border-[var(--admin-border)] rounded-2xl text-[var(--admin-text-3)] hover:text-[var(--admin-red)] transition-all shadow-xl"><Trash2 size={18} /></button>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[var(--admin-bg)]/5">
                      <th className="px-10 py-5 text-[10px] font-black text-[var(--admin-text-3)] uppercase tracking-[0.2em] border-b border-[var(--admin-border)]">Service Complexity</th>
                      <th className="px-10 py-5 text-[10px] font-black text-[var(--admin-text-3)] uppercase tracking-[0.2em] border-b border-[var(--admin-border)]">Standard_Logic</th>
                      <th className="px-10 py-5 text-[10px] font-black text-[var(--admin-text-3)] uppercase tracking-[0.2em] border-b border-[var(--admin-border)]">Premium_Logic</th>
                      <th className="px-10 py-5 text-[10px] font-black text-[var(--admin-text-3)] uppercase tracking-[0.2em] border-b border-[var(--admin-border)]">Express_Direct</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--admin-border)]">
                    {(['low', 'medium', 'high'] as const).map((complexity) => (
                      <tr key={complexity} className="hover:bg-[var(--admin-surface-2)]/40 transition-colors group/row">
                        <td className="px-10 py-6 text-[14px] font-black text-[var(--admin-text)] uppercase tracking-tight border-r border-[var(--admin-border)]">
                           Complexity: <span className="text-[var(--admin-accent)]">{complexity}</span>
                        </td>
                        <td className="px-10 py-6">
                           <div className="text-[16px] font-[var(--admin-font-mono)] font-black text-[var(--admin-text)]">${tier.prices.standard[complexity].toFixed(2)}</div>
                           <div className="text-[9px] font-black text-[var(--admin-text-3)] uppercase tracking-widest mt-0.5">Standard</div>
                        </td>
                        <td className="px-10 py-6">
                           <div className="text-[16px] font-[var(--admin-font-mono)] font-black text-[var(--admin-text)]">${tier.prices.premium[complexity].toFixed(2)}</div>
                           <div className="text-[9px] font-black text-[var(--admin-text-3)] uppercase tracking-widest mt-0.5">Premium</div>
                        </td>
                        <td className="px-10 py-6">
                           <div className="text-[16px] font-[var(--admin-font-mono)] font-black text-[var(--admin-accent)]">${tier.prices.express[complexity].toFixed(2)}</div>
                           <div className="text-[9px] font-black text-[var(--admin-text-3)] uppercase tracking-widest mt-0.5">Express</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
          <button className="w-full py-8 border-2 border-dashed border-[var(--admin-border)] rounded-[2.5rem] flex items-center justify-center gap-3 text-[var(--admin-text-3)] hover:border-[var(--admin-accent)] hover:text-[var(--admin-accent)] transition-all group shadow-inner">
             <Plus size={24} className="group-hover:scale-125 transition-transform" />
             <span className="text-[16px] font-black uppercase tracking-[0.2em]">Add Pricing Tier</span>
          </button>
        </div>
      )}

      {activeTab === 'margin' && (
        <div className="space-y-8 animate-in slide-in-from-bottom-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: 'Take vs. Give Ratio', value: `${marginMetrics.takeVsGiveRatio}:1`, target: `Target ${marginMetrics.targetRatio}:1`, icon: <Activity size={20} />, color: 'var(--admin-blue)' },
              { label: 'Gross Margin', value: `${marginMetrics.grossMargin}%`, target: 'Target 60%', icon: <PieChart size={20} />, color: 'var(--admin-green)' },
              { label: 'Net Margin', value: `${marginMetrics.netMargin}%`, target: 'Target 35%', icon: <Target size={20} />, color: 'var(--admin-accent)' },
              { label: 'Avg per Image', value: '$9.20', target: 'Revenue per image', icon: <DollarSign size={20} />, color: 'var(--admin-text)' },
            ].map((stat, i) => (
              <div key={i} className="bg-[var(--admin-surface)] border border-[var(--admin-border)] rounded-3xl p-6 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity" style={{ color: stat.color }}>{stat.icon}</div>
                <div className="text-[10px] font-black text-[var(--admin-text-3)] uppercase tracking-widest mb-1">{stat.label}</div>
                <div className="text-[28px] font-black text-[var(--admin-text)] tracking-tighter" style={{ color: i < 3 && i !== 0 ? (parseInt(stat.value) < parseInt(stat.target.match(/\d+/)?.[0] || '0') ? 'var(--admin-accent)' : 'var(--admin-green)') : 'inherit' }}>{stat.value}</div>
                <div className="text-[11px] font-medium text-[var(--admin-text-3)] mt-2 uppercase tracking-tighter opacity-70">{stat.target}</div>
              </div>
            ))}
          </div>

          <div className="bg-[var(--admin-surface)] border border-[var(--admin-border)] rounded-[2.5rem] overflow-hidden shadow-2xl">
             <div className="px-10 py-6 border-b border-[var(--admin-border)] bg-[var(--admin-surface-2)]/50 flex items-center justify-between">
                <h3 className="text-[18px] font-black text-[var(--admin-text)] uppercase tracking-tight flex items-center gap-3 font-[var(--admin-font-display)]">
                   <Target size={20} className="text-[var(--admin-accent)]" /> Margin Analysis
                </h3>
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-[var(--admin-green)] animate-pulse" />
                   <span className="text-[10px] font-black text-[var(--admin-green)] uppercase tracking-widest">LIVE_GUARD_MONITORING</span>
                </div>
             </div>
             <table className="w-full text-left">
               <thead>
                 <tr className="bg-[var(--admin-bg)]/5">
                   <th className="px-10 py-5 text-[10px] font-black text-[var(--admin-text-3)] uppercase tracking-widest">Protocol ID</th>
                   <th className="px-10 py-5 text-[10px] font-black text-[var(--admin-text-3)] uppercase tracking-widest">Client Segment</th>
                   <th className="px-10 py-5 text-[10px] font-black text-[var(--admin-text-3)] uppercase tracking-widest">Price Ingress</th>
                   <th className="px-10 py-5 text-[10px] font-black text-[var(--admin-text-3)] uppercase tracking-widest">Payout Egress</th>
                   <th className="px-10 py-5 text-[10px] font-black text-[var(--admin-text-3)] uppercase tracking-widest">Margin Delta</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-[var(--admin-border)]">
                 {marginMetrics.recentQuotes.map((quote, i) => (
                   <tr key={i} className="hover:bg-[var(--admin-surface-2)]/40 transition-colors">
                     <td className="px-10 py-5 text-[14px] font-[var(--admin-font-mono)] font-black text-[var(--admin-text)]">{quote.code}</td>
                     <td className="px-10 py-5 text-[13px] font-black text-[var(--admin-text-3)] uppercase">{quote.customer}</td>
                     <td className="px-10 py-5 text-[15px] font-[var(--admin-font-mono)] font-black text-[var(--admin-text)]">${quote.price}</td>
                     <td className="px-10 py-5 text-[15px] font-[var(--admin-font-mono)] font-black text-[var(--admin-accent)]">${quote.payout}</td>
                     <td className="px-10 py-5">
                        <span className={cx(
                          "px-3 py-1.5 rounded-xl text-[11px] font-black tracking-widest",
                          quote.margin >= 50 ? "bg-[var(--admin-green-dim)] text-[var(--admin-green)] border border-[var(--admin-green)]/20" : "bg-[var(--admin-red-dim)] text-[var(--admin-red)] border border-[var(--admin-red)]/20 shadow-lg shadow-[var(--admin-red)]/10"
                        )}>
                          {quote.margin}%
                        </span>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
             <div className="px-10 py-5 border-t border-[var(--admin-border)] bg-[var(--admin-surface-2)]/30 text-center">
                <button className="text-[11px] font-black text-[var(--admin-text-3)] uppercase tracking-widest hover:text-[var(--admin-text)] transition-all">Audit Full Fiscal Logs</button>
             </div>
          </div>
        </div>
      )}

      {activeTab === 'editor' && (
        <div className="space-y-8 animate-in slide-in-from-bottom-4">
           {['Junior Fragment', 'Senior Architect', 'Specialist Kernel'].map((tierName, i) => (
            <div key={tierName} className="bg-[var(--admin-surface)] border border-[var(--admin-border)] rounded-[2.5rem] overflow-hidden shadow-2xl relative group">
              <div className="px-10 py-8 border-b border-[var(--admin-border)] bg-[var(--admin-surface-2)]/30 flex flex-wrap items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                   <div className={cx(
                      "w-16 h-16 rounded-2xl bg-[var(--admin-bg)] border border-[var(--admin-border)] flex items-center justify-center shadow-2xl transition-all group-hover:rotate-12",
                      i === 0 ? "text-[var(--admin-text-3)]" : i === 1 ? "text-[var(--admin-blue)]" : "text-[var(--admin-accent)]"
                   )}>
                      {i === 0 ? <Zap size={24} /> : i === 1 ? <TrendingUp size={24} /> : <Target size={24} />}
                   </div>
                   <div>
                     <h3 className="text-[20px] font-black text-[var(--admin-text)] tracking-tight uppercase leading-none mb-1">{tierName}</h3>
                     <p className="text-[12px] text-[var(--admin-text-3)] font-medium uppercase tracking-widest opacity-70">
                        {i === 0 ? 'Protocol Onboarding' : i === 1 ? 'High Precision Array' : 'Master System Logic'}
                     </p>
                   </div>
                </div>
                <div className="px-4 py-2 bg-[var(--admin-surface-3)] rounded-xl border border-[var(--admin-border)]">
                   <div className="text-[9px] font-black text-[var(--admin-text-3)] uppercase tracking-widest mb-0.5">QC_Compliance</div>
                   <div className="text-[14px] font-black text-[var(--admin-text)]">{i === 0 ? '>92%' : i === 1 ? '95-98%' : '>98.5%'}</div>
                </div>
              </div>
              
              <div className="p-4 overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-[var(--admin-bg)]/5 rounded-2xl overflow-hidden">
                      <th className="px-8 py-4 text-[10px] font-black text-[var(--admin-text-3)] uppercase tracking-[0.2em]">Protocol Map</th>
                      <th className="px-8 py-4 text-[10px] font-black text-[var(--admin-text-3)] uppercase tracking-[0.2em]">Base Flux</th>
                      <th className="px-8 py-4 text-[10px] font-black text-[var(--admin-text-3)] uppercase tracking-[0.2em]">Weight Multiplier</th>
                      <th className="px-8 py-4 text-[10px] font-black text-[var(--admin-text-3)] uppercase tracking-[0.2em]">Net Egress</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--admin-border)]">
                    {(['standard', 'premium', 'express', 'revision'] as const).map((service, si) => (
                      <tr key={service} className="hover:bg-[var(--admin-surface-2)]/40 transition-colors">
                        <td className="px-8 py-5 text-[14px] font-black text-[var(--admin-text)] uppercase tracking-tight">{service}</td>
                        <td className="px-8 py-5 text-[15px] font-[var(--admin-font-mono)] text-[var(--admin-text-2)]">${(3.5 + i).toFixed(2)}</td>
                        <td className="px-8 py-5 text-[12px] font-black text-[var(--admin-text-3)]">{(1 + si * 0.5).toFixed(2)}x</td>
                        <td className="px-8 py-5 text-[16px] font-[var(--admin-font-mono)] font-black text-[var(--admin-green)]">
                           ${((3.5 + i) * (1 + si * 0.5)).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
