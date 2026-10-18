import React, { useState } from 'react';
import { Save, Share2, RotateCcw, Download, Check } from 'lucide-react';
import { PRICING_MATRIX } from '../../data/pricingMatrix';
import { SERVICE_DISPLAY_ORDER } from '../../data/services';

interface ServiceTier {
  id: string;
  complexity: string;
  processingTime: string;
  price24h: number;
  selected: boolean;
}

const TURNAROUNDS = [
  { id: '12h', label: '12h', multiplier: 1.3 },
  { id: '24h', label: '24h', multiplier: 1.0 },
  { id: '48h', label: '48h', multiplier: 0.9 },
  { id: '72h', label: '72h', multiplier: 0.85 },
  { id: '7d', label: '7d', multiplier: 0.8 },
];

export const AdminQuoteBuilder: React.FC = () => {
  const serviceOrderIndex = new Map(SERVICE_DISPLAY_ORDER.map((id, index) => [id, index]));
  const orderedPricingServices = [...PRICING_MATRIX].sort((a, b) => {
    const ai = serviceOrderIndex.get(a.id) ?? Number.MAX_SAFE_INTEGER;
    const bi = serviceOrderIndex.get(b.id) ?? Number.MAX_SAFE_INTEGER;
    if (ai !== bi) return ai - bi;
    return a.id.localeCompare(b.id);
  });

  // Flatten all services with their tiers
  const [allServices, setAllServices] = useState<ServiceTier[]>(
    orderedPricingServices.flatMap(service => 
      service.tiers.map(tier => ({
        id: `${service.id}-${tier.complexity}`,
        name: service.name,
        complexity: tier.complexity,
        processingTime: tier.processingTime,
        price24h: tier.price24h,
        selected: false,
      }))
    )
  );

  const [turnaround, setTurnaround] = useState('24h');
  const [quantity, setQuantity] = useState(10);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const selectedServices = allServices.filter(s => s.selected);
  const selectedCount = selectedServices.length;

  const calculatePerImage = () => {
    if (selectedCount === 0) return 0;
    const total = selectedServices.reduce((sum, s) => sum + s.price24h, 0);
    const turnaroundMult = TURNAROUNDS.find(t => t.id === turnaround)?.multiplier || 1;
    return total * turnaroundMult;
  };

  const perImage = calculatePerImage();
  const subtotal = perImage * quantity;
  const discount = quantity > 100 ? subtotal * 0.1 : quantity > 500 ? subtotal * 0.15 : 0;
  const total = subtotal - discount;

  const toggleService = (id: string) => {
    setAllServices(allServices.map(s => 
      s.id === id ? { ...s, selected: !s.selected } : s
    ));
  };

  const reset = () => {
    setAllServices(allServices.map(s => ({ ...s, selected: false })));
    setTurnaround('24h');
    setQuantity(10);
  };

  // Group services by category
  const servicesByCategory = orderedPricingServices.reduce((acc, service) => {
    const category = service.categoryId;
    if (!acc[category]) acc[category] = [];
    service.tiers.forEach(tier => {
      const serviceItem = allServices.find(s => s.id === `${service.id}-${tier.complexity}`);
      if (serviceItem) acc[category].push({ ...serviceItem, serviceName: service.name });
    });
    return acc;
  }, {} as Record<string, (ServiceTier & { serviceName: string; complexity: string; processingTime: string; price24h: number; selected: boolean; id: string; })[]>);

  const categoryLabels: Record<string, string> = {
    foundation: 'Foundation',
    enhancement: 'Enhancement',
    retouch: 'Retouch',
    advanced: 'Advanced',
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[32px] font-bold text-[#37352F] mb-1" style={{ letterSpacing: '-0.02em' }}>
            Quote Builder
          </h1>
          <p className="text-[14px] text-[#9B9A97]">Select services and configure your quote</p>
        </div>
        <button
          onClick={reset}
          className="flex items-center gap-2 px-3 py-1.5 rounded text-[15px] font-medium text-[#787774] hover:bg-[#F7F6F3] transition-colors"
        >
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      {/* Main Content - Two Column Layout */}
      <div className="flex gap-3 mb-4" style={{ height: 'calc(100vh - 280px)' }}>
        
        {/* Left: Service Selection by Category */}
        <div className="flex-1 rounded border border-[#EDECE9] bg-white overflow-hidden flex flex-col">
          <div className="p-4 border-b border-[#EDECE9] flex items-center justify-between">
            <div>
              <h2 className="text-[14px] font-semibold text-[#37352F]">Services</h2>
              <p className="text-[14px] text-[#9B9A97] mt-0.5">{selectedCount} selected</p>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {Object.entries(servicesByCategory).map(([category, services]) => (
              <div key={category} className="border-b border-[#EDECE9] last:border-b-0">
                {/* Category Header */}
                <button
                  onClick={() => setExpandedCategory(expandedCategory === category ? null : category)}
                  className="w-full p-3 bg-[#F7F6F3] flex items-center justify-between hover:bg-[#EFEFEF] transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[15px] font-semibold text-[#37352F]">{categoryLabels[category]}</span>
                    <span className="text-[14px] text-[#9B9A97]">({services.length} options)</span>
                  </div>
                  <svg 
                    className={`w-4 h-4 text-[#9B9A97] transition-transform ${expandedCategory === category ? 'rotate-180' : ''}`}
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {/* Services List */}
                {expandedCategory === category && (
                  <div className="p-2 space-y-1">
                    {services.map((service) => (
                      <div
                        key={service.id}
                        onClick={() => toggleService(service.id)}
                        className={`p-3 rounded border cursor-pointer transition-colors ${
                          service.selected 
                            ? 'bg-[#D3E5FF]/30 border-[#D3E5FF]' 
                            : 'bg-white border-[#EDECE9] hover:bg-[#F7F6F3]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                              service.selected ? 'bg-[#1B73D1] border-[#1B73D1]' : 'border-[#D3D1CB]'
                            }`}>
                              {service.selected && <Check size={12} className="text-white" />}
                            </div>
                            <div>
                              <div className="text-[15px] font-medium text-[#37352F]">{service.serviceName}</div>
                              <div className="text-[14px] text-[#9B9A97]">
                                {service.complexity} • {service.processingTime}
                              </div>
                            </div>
                          </div>
                          <span className="text-[14px] font-semibold text-[#37352F] font-mono">
                            ${service.price24h.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right: Configuration */}
        <div className="w-[320px] rounded border border-[#EDECE9] bg-white overflow-hidden flex flex-col">
          <div className="p-4 border-b border-[#EDECE9]">
            <h2 className="text-[14px] font-semibold text-[#37352F]">Configuration</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            
            {/* Turnaround */}
            <div>
              <label className="text-[14px] font-medium text-[#787774] mb-2 block">Turnaround</label>
              <div className="grid grid-cols-5 gap-1">
                {TURNAROUNDS.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTurnaround(t.id)}
                    className={`px-2 py-2 rounded text-[14px] font-medium border transition-colors ${
                      turnaround === t.id
                        ? 'bg-[#37352F] text-white border-[#37352F]'
                        : 'bg-white text-[#787774] border-[#EDECE9] hover:border-[#37352F]/30'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity */}
            <div>
              <label className="text-[14px] font-medium text-[#787774] mb-2 block">Quantity</label>
              <input
                type="number"
                min={1}
                max={10000}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-3 py-2 bg-[#F7F6F3] border border-[#EDECE9] rounded text-[15px] font-medium focus:outline-none focus:border-[#37352F] focus:ring-1 focus:ring-black/5"
              />
            </div>

            {/* Selected Services Summary */}
            {selectedCount > 0 && (
              <div>
                <label className="text-[14px] font-medium text-[#787774] mb-2 block">Selected Services</label>
                <div className="space-y-1.5">
                  {selectedServices.map((service) => (
                    <div key={service.id} className="p-2 bg-[#F7F6F3] rounded border border-[#EDECE9]">
                      <div className="flex items-center justify-between">
                        <div className="text-[14px] font-medium text-[#37352F]">{(service as any).serviceName}</div>
                        <button
                          onClick={() => toggleService(service.id)}
                          className="text-[#9B9A97] hover:text-[#D44C47] transition-colors"
                        >
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      <div className="text-[14px] text-[#9B9A97] mt-0.5">
                        {service.complexity} • ${service.price24h.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pricing Footer */}
      <div className="rounded border border-[#EDECE9] bg-white p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            {/* Pricing Breakdown */}
            <div className="flex items-center gap-6">
              <div>
                <div className="text-[14px] font-medium text-[#9B9A97] uppercase tracking-wide mb-1">Per Image</div>
                <div className="text-[18px] font-semibold text-[#37352F] font-mono">${perImage.toFixed(2)}</div>
              </div>
              <div className="border-l border-[#EDECE9] pl-6">
                <div className="text-[14px] font-medium text-[#9B9A97] uppercase tracking-wide mb-1">Subtotal</div>
                <div className="text-[18px] font-semibold text-[#37352F] font-mono">${subtotal.toFixed(2)}</div>
              </div>
              {discount > 0 && (
                <div className="border-l border-[#EDECE9] pl-6">
                  <div className="text-[14px] font-medium text-[#54AE60] uppercase tracking-wide mb-1">Discount</div>
                  <div className="text-[18px] font-semibold text-[#54AE60] font-mono">-${discount.toFixed(2)}</div>
                </div>
              )}
            </div>
          </div>

          {/* Total + Actions */}
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-[14px] font-medium text-[#9B9A97] uppercase tracking-wide mb-1">Total</div>
              <div className="text-[28px] font-bold text-[#37352F] font-mono">${total.toFixed(2)}</div>
              {selectedCount > 0 && (
                <div className="text-[14px] text-[#9B9A97] mt-1">
                  {selectedCount} service{selectedCount > 1 ? 's' : ''} • {quantity} images
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 border-l border-[#EDECE9] pl-4">
              <button className="p-2 rounded hover:bg-[#F7F6F3] transition-colors text-[#787774]">
                <Save size={16} />
              </button>
              <button className="p-2 rounded hover:bg-[#F7F6F3] transition-colors text-[#787774]">
                <Share2 size={16} />
              </button>
              <button className="p-2 rounded hover:bg-[#F7F6F3] transition-colors text-[#787774]">
                <Download size={16} />
              </button>
              <button className="px-4 py-2 bg-[#37352F] text-white text-[15px] font-medium rounded hover:bg-[#1F1E1B] transition-colors">
                Generate Quote
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminQuoteBuilder;
