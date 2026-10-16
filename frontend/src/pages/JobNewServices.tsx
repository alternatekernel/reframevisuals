import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Settings2, Info } from 'lucide-react';
import { ButtonWithIcon } from '../components/ui/button-with-icon';
import { layout } from '../utils/theme';

const SERVICES = [
  { id: 'bg', name: 'Background Removal', price: 0.50, icon: '✄' },
  { id: 'color', name: 'Color Correction', price: 0.75, icon: '🎨' },
  { id: 'ghost', name: 'Ghost Mannequin', price: 1.50, icon: '👤' },
  { id: 'shadow', name: 'Drop Shadow', price: 0.25, icon: '🌓' },
  { id: 'retouch', name: 'High-end Retouch', price: 2.50, icon: '✦' },
  { id: 'jewelry', name: 'Jewelry Polishing', price: 3.00, icon: '💎' },
];

const JobNewServices = () => {
  const navigate = useNavigate();
  const [selectedServices, setSelectedServices] = useState<string[]>(['bg']);
  const imageCount = 24;

  const deliveryDate = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase();
  })();

  const toggleService = (id: string) => {
    setSelectedServices(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const totalPrice = selectedServices.reduce((acc, id) => {
    const service = SERVICES.find(s => s.id === id);
    return acc + (service?.price || 0) * imageCount;
  }, 0);

  return (
    <div className="min-h-screen pb-32 pt-32" style={{ backgroundColor: '#ffffff' }}>
      <div className={`${layout.compactShell} ${layout.sectionGutter}`}>
        <div className="flex flex-col lg:flex-row gap-10">
          {/* Left: Services Grid */}
          <div className="flex-1 space-y-8">
            <div>
              <h1 className="text-3xl font-black tracking-tight mb-2 font-heading uppercase" style={{ color: '#171717' }}>
                WHAT DO YOU NEED?
              </h1>
              <p className="text-sm font-medium" style={{ color: '#666666' }}>
                Select the services you want to apply to all images.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {SERVICES.map((service) => {
                const isSelected = selectedServices.includes(service.id);
                return (
                  <button
                    key={service.id}
                    onClick={() => toggleService(service.id)}
                    className="p-6 rounded-2xl transition-all duration-300 flex items-start gap-4 text-left relative overflow-hidden group"
                    style={{ 
                      backgroundColor: isSelected ? '#f5f5f5' : '#ffffff',
                      boxShadow: 'rgba(0,0,0,0.08) 0px 0px 0px 1px'
                    }}
                  >
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-all duration-300"
                      style={{ 
                        backgroundColor: isSelected ? '#171717' : '#fafafa',
                        color: isSelected ? '#ffffff' : '#a3a3a3'
                      }}
                    >
                      {service.icon}
                    </div>
                    <div>
                      <h3 
                        className="text-[12px] font-heading font-black uppercase tracking-widest mb-1 transition-colors"
                        style={{ color: isSelected ? '#171717' : '#171717' }}
                      >
                        {service.name}
                      </h3>
                      <p className="text-[12px] font-bold uppercase tracking-widest" style={{ color: '#a3a3a3' }}>
                        ${service.price.toFixed(2)} / IMAGE
                      </p>
                    </div>
                    {isSelected && (
                      <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-4 right-4 w-5 h-5 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: '#171717' }}
                      >
                        <Check size={12} strokeWidth={3} color="#ffffff" />
                      </motion.div>
                    )}
                  </button>
                );
              })}
            </div>

            <button 
              className="flex items-center gap-2 text-[12px] font-heading font-black uppercase tracking-widest transition-all"
              style={{ color: '#a3a3a3' }}
            >
              <Settings2 size={14} />
              CUSTOMIZE OPTIONS (COMPLEXITY / TURNAROUND)
            </button>
          </div>

          {/* Right: Summary */}
          <div className="w-full lg:w-96 space-y-6">
            <div 
              className="bg-white rounded-3xl shadow-md p-8 sticky top-32" 
              style={{ boxShadow: 'rgba(0,0,0,0.08) 0px 0px 0px 1px' }}
            >
              <h3 
                className="text-xs font-black uppercase tracking-widest mb-8 pb-4" 
                style={{ color: '#171717', borderBottom: '1px solid #f5f5f5' }}
              >
                YOUR ORDER
              </h3>
              
              <div className="space-y-6 mb-10">
                <div className="flex justify-between items-end">
                  <span className="text-[12px] font-black uppercase tracking-widest" style={{ color: '#a3a3a3' }}>IMAGES</span>
                  <span className="text-sm font-black" style={{ color: '#171717' }}>{imageCount} IMAGES</span>
                </div>

                <div className="space-y-3">
                  <span className="text-[12px] font-black uppercase tracking-widest block mb-1" style={{ color: '#a3a3a3' }}>SERVICES</span>
                  {selectedServices.map(id => {
                    const s = SERVICES.find(x => x.id === id);
                    return (
                      <div 
                        key={id} 
                        className="flex justify-between items-center px-3 py-2 rounded-lg"
                        style={{ backgroundColor: '#fafafa' }}
                      >
                        <span className="text-[12px] font-black uppercase tracking-widest" style={{ color: '#171717' }}>{s?.name}</span>
                        <span className="text-[12px] font-bold" style={{ color: '#171717' }}>${s?.price.toFixed(2)}</span>
                      </div>
                    );
                  })}
                  {selectedServices.length === 0 && (
                    <p className="text-[12px] font-bold italic" style={{ color: '#ef4444' }}>No services selected</p>
                  )}
                </div>

                <div className="flex justify-between items-end pt-4" style={{ borderTop: '1px solid #f5f5f5' }}>
                  <span className="text-[12px] font-black uppercase tracking-widest" style={{ color: '#a3a3a3' }}>DELIVERY</span>
                  <span className="text-xs font-black" style={{ color: '#171717' }}>EST. {deliveryDate}</span>
                </div>
              </div>

              <div 
                className="p-4 rounded-2xl flex items-start gap-3"
                style={{ backgroundColor: '#f5f5f5' }}
              >
                <Info size={16} style={{ color: '#171717' }} />
                <p className="text-[12px] leading-relaxed font-medium" style={{ color: '#666666' }}>
                  Prices are based on standard complexity. 1 free revision included per image.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Bar */}
      <div
        className="fixed bottom-0 left-0 right-0 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] lg:p-6 z-50 backdrop-blur-xl"
        style={{ backgroundColor: 'rgba(255,255,255,0.8)', borderTop: '1px solid #f5f5f5' }}
      >
        <div className={`${layout.compactShell} flex items-center justify-between`}>
          <div className="hidden md:block">
            <p className="text-[12px] font-black uppercase tracking-widest mb-1" style={{ color: '#a3a3a3' }}>TOTAL ESTIMATE</p>
            <p className="text-xl font-black" style={{ color: '#171717' }}>${totalPrice.toFixed(2)}</p>
          </div>
          <div className="flex items-center gap-4 w-full md:w-auto">
            <button 
              onClick={() => navigate('/dashboard?view=new-project')}
              className="text-[12px] font-black uppercase tracking-widest transition-all px-4"
              style={{ color: '#a3a3a3' }}
            >
              BACK
            </button>
            <ButtonWithIcon
              label="NEXT"
              disabled={selectedServices.length === 0}
              className="flex-1 md:w-[200px] uppercase tracking-[0.12em] font-black text-[12px]"
              onClick={() => navigate('/jobs/new/review')}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobNewServices;
