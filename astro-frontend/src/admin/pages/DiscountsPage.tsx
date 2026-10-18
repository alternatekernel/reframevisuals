import React, { useState } from 'react';
import { Plus, Tag, Percent } from 'lucide-react';

const colors = {
  bgPrimary: '#FFFFFF', bgSecondary: '#F7F7F5', bgTertiary: '#EFEFEF',
  textPrimary: '#37352F', textSecondary: '#787774', textTertiary: '#9B9A97',
  borderLight: '#E9E9E8', accentGreen: '#007A5A', accentBlue: '#0066FF', accentOrange: '#FF9F2E',
};

export const DiscountsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'promo' | 'volume'>('promo');
  
  const promoCodes = [
    { id: '1', code: 'WELCOME20', type: 'percentage', value: 20, minOrder: 100, uses: 45, maxUses: 100, validUntil: '2026-06-30', status: 'active' },
    { id: '2', code: 'BULK50', type: 'fixed', value: 50, minOrder: 500, uses: 12, maxUses: 50, validUntil: '2026-04-30', status: 'active' },
    { id: '3', code: 'NEWYEAR2026', type: 'percentage', value: 30, minOrder: 200, uses: 234, maxUses: 200, validUntil: '2026-01-15', status: 'expired' },
    { id: '4', code: 'SPRING15', type: 'percentage', value: 15, minOrder: 0, uses: 0, maxUses: 100, validUntil: '2026-05-31', status: 'disabled' },
  ];

  const volumeTiers = [
    { minVolume: 0, maxVolume: 99, discount: 0 },
    { minVolume: 100, maxVolume: 499, discount: 10 },
    { minVolume: 500, maxVolume: 999, discount: 15 },
    { minVolume: 1000, maxVolume: null, discount: 25 },
  ];

  return (
    <div className="p-4 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-[20px] font-bold" style={{ color: colors.textPrimary }}>Discounts & Promotions</h1>
          <p className="text-[14px]" style={{ color: colors.textTertiary }}>Promo codes and volume discounts</p>
        </div>
        <button className="px-4 py-2 text-[15px] font-medium rounded-md flex items-center gap-2" style={{ background: colors.textPrimary, color: '#FFF' }}><Plus size={16} /> Create Promo</button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-4 border-b" style={{ borderColor: colors.borderLight }}>
        <button onClick={() => setActiveTab('promo')} className={`px-4 py-2 text-[15px] font-medium border-b-2 ${activeTab === 'promo' ? 'border-gray-900' : 'border-transparent'}`} style={{ color: activeTab === 'promo' ? colors.textPrimary : colors.textSecondary }}>
          <span className="flex items-center gap-2"><Tag size={14} /> Promo Codes</span>
        </button>
        <button onClick={() => setActiveTab('volume')} className={`px-4 py-2 text-[15px] font-medium border-b-2 ${activeTab === 'volume' ? 'border-gray-900' : 'border-transparent'}`} style={{ color: activeTab === 'volume' ? colors.textPrimary : colors.textSecondary }}>
          <span className="flex items-center gap-2"><Percent size={14} /> Volume Discounts</span>
        </button>
      </div>

      {activeTab === 'promo' ? (
        <div className="rounded-md border overflow-hidden" style={{ borderColor: colors.borderLight, background: colors.bgPrimary }}>
          <table className="w-full">
            <thead>
              <tr style={{ background: colors.bgSecondary }}>
                <th className="text-left px-4 py-3 text-[14px] font-medium" style={{ color: colors.textSecondary }}>Code</th>
                <th className="text-left px-4 py-3 text-[14px] font-medium" style={{ color: colors.textSecondary }}>Type</th>
                <th className="text-left px-4 py-3 text-[14px] font-medium" style={{ color: colors.textSecondary }}>Min Order</th>
                <th className="text-left px-4 py-3 text-[14px] font-medium" style={{ color: colors.textSecondary }}>Uses</th>
                <th className="text-left px-4 py-3 text-[14px] font-medium" style={{ color: colors.textSecondary }}>Valid Until</th>
                <th className="text-left px-4 py-3 text-[14px] font-medium" style={{ color: colors.textSecondary }}>Status</th>
                <th className="w-20"></th>
              </tr>
            </thead>
            <tbody>
              {promoCodes.map(code => (
                <tr key={code.id} className="border-b" style={{ borderColor: colors.borderLight }}>
                  <td className="px-4 py-3">
                    <div className="text-[15px] font-mono font-medium" style={{ color: colors.textPrimary }}>{code.code}</div>
                  </td>
                  <td className="px-4 py-3 text-[14px]" style={{ color: colors.textSecondary }}>{code.type === 'percentage' ? `${code.value}% off` : `$${code.value} off`}</td>
                  <td className="px-4 py-3 text-[14px]" style={{ color: colors.textSecondary }}>{code.minOrder > 0 ? `$${code.minOrder}` : 'None'}</td>
                  <td className="px-4 py-3 text-[14px]" style={{ color: colors.textSecondary }}>{code.uses}/{code.maxUses}</td>
                  <td className="px-4 py-3 text-[14px]" style={{ color: colors.textSecondary }}>{code.validUntil}</td>
                  <td className="px-4 py-3"><span className={`text-[14px] px-2 py-1 rounded capitalize ${code.status === 'active' ? 'bg-green-100 text-green-700' : code.status === 'expired' ? 'bg-gray-100 text-gray-700' : 'bg-orange-100 text-orange-700'}`}>{code.status}</span></td>
                  <td className="px-4 py-3"><button className="text-[14px] font-medium hover:underline" style={{ color: colors.accentBlue }}>Edit</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div>
          <div className="p-4 rounded-md border mb-4" style={{ background: colors.bgPrimary, borderColor: colors.borderLight }}>
            <h3 className="text-[14px] font-semibold mb-3" style={{ color: colors.textPrimary }}>Volume Discount Tiers</h3>
            <div className="space-y-3">
              {volumeTiers.map((tier, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-md" style={{ background: colors.bgSecondary }}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: colors.accentBlue, color: '#FFF' }}>{i + 1}</div>
                    <div>
                      <div className="text-[15px] font-medium" style={{ color: colors.textPrimary }}>{tier.minVolume.toLocaleString()} - {tier.maxVolume ? tier.maxVolume.toLocaleString() : '∞'} images</div>
                      <div className="text-[14px]" style={{ color: colors.textTertiary }}>Monthly volume tier</div>
                    </div>
                  </div>
                  <div className="text-[24px] font-semibold" style={{ color: colors.accentGreen }}>{tier.discount}% <span className="text-[14px] font-normal" style={{ color: colors.textSecondary }}>discount</span></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
