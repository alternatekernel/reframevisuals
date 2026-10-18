import React, { useState, useCallback } from 'react';
import { X, Send } from 'lucide-react';

const colors = {
  bgPrimary: '#FFFFFF', bgSecondary: '#F7F7F5', bgTertiary: '#EFEFEF', bgHover: '#EAEAE5',
  textPrimary: '#37352F', textSecondary: '#787774', textTertiary: '#9B9A97',
  borderLight: '#E9E9E8', accentBlue: '#0066FF', accentGreen: '#007A5A', accentOrange: '#FF9F2E',
  accentGreenLight: '#E8F5E9',
};

interface QuoteBuilderDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  customerId?: string;
}

export const QuoteBuilderDrawer: React.FC<QuoteBuilderDrawerProps> = ({ isOpen, onClose, customerId: _customerId }) => {
  const [step, setStep] = useState(1);
  const [quote, setQuote] = useState({
    volume: '',
    serviceType: 'standard',
    complexity: 'medium',
    deliveryDays: '5',
    customerName: '',
    customerEmail: '',
  });
  const [pricing, setPricing] = useState({ basePrice: 0, discount: 0, total: 0, margin: 0 });
  const [sending, setSending] = useState(false);

  const calculatePricing = useCallback(() => {
    const vol = parseInt(quote.volume) || 0;
    const basePrices: Record<string, Record<string, number>> = {
      standard: { low: 8.5, medium: 10.2, high: 12.8 },
      premium: { low: 11.0, medium: 13.2, high: 15.8 },
      express: { low: 14.5, medium: 17.2, high: 20.5 },
    };
    const basePrice = basePrices[quote.serviceType][quote.complexity];
    const subtotal = vol * basePrice;
    let discountPercent = 0;
    if (vol >= 500) discountPercent = 25;
    else if (vol >= 100) discountPercent = 10;
    const discount = subtotal * (discountPercent / 100);
    const total = subtotal - discount;
    const margin = (total - (total * 0.48)) / total * 100;
    setPricing({ basePrice, discount: discountPercent, total, margin });
  }, [quote]);

  React.useEffect(() => { calculatePricing(); }, [calculatePricing]);

  const handleSend = async () => {
    setSending(true);
    await new Promise(r => setTimeout(r, 1500));
    setSending(false);
    setStep(3);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-[480px] h-full shadow-2xl flex flex-col" style={{ background: colors.bgPrimary }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: colors.borderLight }}>
          <div>
            <h2 className="text-[18px] font-semibold" style={{ color: colors.textPrimary }}>Create Quote</h2>
            <p className="text-[14px]" style={{ color: colors.textTertiary }}>Step {step} of 3</p>
          </div>
          <button onClick={onClose} className="p-2 rounded hover:bg-gray-100"><X size={18} style={{ color: colors.textSecondary }} /></button>
        </div>

        {/* Progress */}
        <div className="px-6 py-3 border-b" style={{ borderColor: colors.borderLight }}>
          <div className="flex items-center gap-2">
            {[1, 2, 3].map(s => (
              <React.Fragment key={s}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[14px] font-medium ${s <= step ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-500'}`}>{s}</div>
                {s < 3 && <div className={`flex-1 h-0.5 ${s < step ? 'bg-gray-900' : 'bg-gray-200'}`} />}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-[14px] font-semibold mb-3" style={{ color: colors.textPrimary }}>Customer Information</h3>
              <div>
                <label className="block text-[14px] font-medium mb-1.5" style={{ color: colors.textSecondary }}>Customer Name</label>
                <input type="text" value={quote.customerName} onChange={e => setQuote({ ...quote, customerName: e.target.value })} className="w-full px-3 py-2 text-[15px] rounded-md border focus:outline-none" style={{ background: colors.bgSecondary, borderColor: colors.borderLight, color: colors.textPrimary }} placeholder="e.g., Nike Retail Inc." />
              </div>
              <div>
                <label className="block text-[14px] font-medium mb-1.5" style={{ color: colors.textSecondary }}>Customer Email</label>
                <input type="email" value={quote.customerEmail} onChange={e => setQuote({ ...quote, customerEmail: e.target.value })} className="w-full px-3 py-2 text-[15px] rounded-md border focus:outline-none" style={{ background: colors.bgSecondary, borderColor: colors.borderLight, color: colors.textPrimary }} placeholder="e.g., john@nike.com" />
              </div>
              <div>
                <label className="block text-[14px] font-medium mb-1.5" style={{ color: colors.textSecondary }}>Image Volume</label>
                <input type="number" value={quote.volume} onChange={e => setQuote({ ...quote, volume: e.target.value })} className="w-full px-3 py-2 text-[15px] rounded-md border focus:outline-none" style={{ background: colors.bgSecondary, borderColor: colors.borderLight, color: colors.textPrimary }} placeholder="e.g., 250" />
              </div>
              <button onClick={() => setStep(2)} disabled={!quote.volume || !quote.customerName} className="w-full px-4 py-2.5 text-[15px] font-medium rounded-md mt-4 disabled:opacity-50" style={{ background: colors.textPrimary, color: '#FFF' }}>Next: Service Details</button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-[14px] font-semibold mb-3" style={{ color: colors.textPrimary }}>Service Details</h3>
              <div>
                <label className="block text-[14px] font-medium mb-1.5" style={{ color: colors.textSecondary }}>Service Type</label>
                <select value={quote.serviceType} onChange={e => setQuote({ ...quote, serviceType: e.target.value })} className="w-full px-3 py-2 text-[15px] rounded-md border focus:outline-none" style={{ background: colors.bgSecondary, borderColor: colors.borderLight, color: colors.textPrimary }}>
                  <option value="standard">Standard</option>
                  <option value="premium">Premium</option>
                  <option value="express">Express</option>
                </select>
              </div>
              <div>
                <label className="block text-[14px] font-medium mb-1.5" style={{ color: colors.textSecondary }}>Complexity</label>
                <select value={quote.complexity} onChange={e => setQuote({ ...quote, complexity: e.target.value })} className="w-full px-3 py-2 text-[15px] rounded-md border focus:outline-none" style={{ background: colors.bgSecondary, borderColor: colors.borderLight, color: colors.textPrimary }}>
                  <option value="low">Low (simple products)</option>
                  <option value="medium">Medium (some details)</option>
                  <option value="high">High (complex items)</option>
                </select>
              </div>
              <div>
                <label className="block text-[14px] font-medium mb-1.5" style={{ color: colors.textSecondary }}>Delivery (days)</label>
                <input type="number" value={quote.deliveryDays} onChange={e => setQuote({ ...quote, deliveryDays: e.target.value })} className="w-full px-3 py-2 text-[15px] rounded-md border focus:outline-none" style={{ background: colors.bgSecondary, borderColor: colors.borderLight, color: colors.textPrimary }} />
              </div>

              {/* Pricing Summary */}
              <div className="mt-6 p-4 rounded-md border" style={{ background: colors.bgSecondary, borderColor: colors.borderLight }}>
                <h4 className="text-[15px] font-semibold mb-3" style={{ color: colors.textPrimary }}>Pricing Summary</h4>
                <div className="space-y-2 text-[14px]">
                  <div className="flex justify-between"><span style={{ color: colors.textSecondary }}>Base Price</span><span style={{ color: colors.textPrimary }}>${pricing.basePrice.toFixed(2)}/image</span></div>
                  <div className="flex justify-between"><span style={{ color: colors.textSecondary }}>Volume Discount</span><span style={{ color: colors.textPrimary }}>{pricing.discount}%</span></div>
                  <div className="flex justify-between pt-2 border-t" style={{ borderColor: colors.borderLight }}><span className="font-medium" style={{ color: colors.textPrimary }}>Total</span><span className="font-semibold" style={{ color: colors.textPrimary }}>${pricing.total.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span style={{ color: colors.textSecondary }}>Est. Margin</span><span style={{ color: pricing.margin >= 50 ? colors.accentGreen : colors.accentOrange }}>{pricing.margin.toFixed(0)}%</span></div>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <button onClick={() => setStep(1)} className="flex-1 px-4 py-2.5 text-[15px] rounded-md" style={{ background: colors.bgTertiary, color: colors.textSecondary }}>Back</button>
                <button onClick={handleSend} disabled={sending} className="flex-1 px-4 py-2.5 text-[15px] font-medium rounded-md flex items-center justify-center gap-2 disabled:opacity-50" style={{ background: colors.textPrimary, color: '#FFF' }}>
                  {sending ? 'Sending...' : <><Send size={14} /> Send Quote</>}
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: colors.accentGreenLight }}><Send size={24} style={{ color: colors.accentGreen }} /></div>
              <h3 className="text-[16px] font-semibold mb-2" style={{ color: colors.textPrimary }}>Quote Sent!</h3>
              <p className="text-[15px] mb-6" style={{ color: colors.textSecondary }}>The quote has been sent to {quote.customerEmail}</p>
              <button onClick={onClose} className="px-6 py-2.5 text-[15px] font-medium rounded-md" style={{ background: colors.textPrimary, color: '#FFF' }}>Done</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
