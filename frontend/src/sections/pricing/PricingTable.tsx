import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { FileText, List, Hash, ArrowRight } from 'lucide-react';
import { cx, layout, tokens, typography } from '../../utils/theme';
import { useServicesContext } from '../../context/ServicesContext';
import { sortServicesByDisplayOrder } from '../../data/services';
import { useCurrency } from '../../context/CurrencyContext';
import { formatCurrency } from '../../utils/currency';
import { PublicInput, publicInlineSubmitButtonClass } from '../../components/ui/form-controls';

const pastelStyles = [
  { 
    hoverClass: 'hover:bg-red-50/10',
    tagClass: 'bg-red-50 text-neutral-600 border-red-100'
  },
  { 
    hoverClass: 'hover:bg-orange-50/10',
    tagClass: 'bg-orange-50 text-neutral-600 border-orange-100'
  },
  { 
    hoverClass: 'hover:bg-emerald-50/10',
    tagClass: 'bg-emerald-50 text-neutral-600 border-emerald-100'
  },
  { 
    hoverClass: 'hover:bg-blue-50/10',
    tagClass: 'bg-blue-50 text-neutral-600 border-blue-100'
  },
  { 
    hoverClass: 'hover:bg-purple-50/10',
    tagClass: 'bg-purple-50 text-neutral-600 border-purple-100'
  }
];

const PricingTable: React.FC = () => {
  const navigate = useNavigate();
  const { services, isLoading } = useServicesContext();
  const { currency, convertFromUsd } = useCurrency();
  const orderedServices = sortServicesByDisplayOrder(services as any[]);
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const rowElementsRef = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (!orderedServices.length) return;
    const selectedStillExists = orderedServices.some((service: any) => service.id === selectedServiceId);
    if (!selectedServiceId || !selectedStillExists) {
      setSelectedServiceId(orderedServices[0].id);
    }
  }, [orderedServices, selectedServiceId]);

  const selectedService = useMemo(
    () => orderedServices.find((service: any) => service.id === selectedServiceId) || orderedServices[0],
    [orderedServices, selectedServiceId]
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.innerWidth >= 640) return;
    if (!orderedServices.length) return;

    const ratios: Record<string, number> = {};
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const serviceId = (entry.target as HTMLElement).dataset.serviceId;
          if (!serviceId) continue;
          ratios[serviceId] = entry.isIntersecting ? entry.intersectionRatio : 0;
        }

        let bestId: string | null = null;
        let bestRatio = 0;
        for (const service of orderedServices) {
          const ratio = ratios[service.id] || 0;
          if (ratio > bestRatio) {
            bestRatio = ratio;
            bestId = service.id;
          }
        }

        if (bestId) {
          setSelectedServiceId((prev) => (prev === bestId ? prev : bestId));
        }
      },
      {
        root: null,
        rootMargin: '-20% 0px -35% 0px',
        threshold: [0.15, 0.3, 0.5, 0.7, 0.9],
      }
    );

    for (const service of orderedServices) {
      const element = rowElementsRef.current[service.id];
      if (element) observer.observe(element);
    }

    return () => observer.disconnect();
  }, [orderedServices]);

  const getSimplePrice = (service: any) => {
    if (service.tiers && service.tiers.length > 0) {
      const simpleTier = service.tiers.find((t: any) => 
        t.complexity === 'S' || t.complexity === 'Single' || t.complexity === 'Basic'
      );
      if (simpleTier?.prices?.['24h']) {
        return simpleTier.prices['24h'];
      }
    }
    return service.startingPrice || service.price || 0;
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubmitted(true);
    }
  };

  if (isLoading) {
    return (
      <section className="px-6 lg:px-12 py-12 bg-white">
        <div className="text-center text-black/40">Loading pricing...</div>
      </section>
    );
  }

  return (
    <section className="px-6 lg:px-12 py-16 bg-white border-b border-[#f5f5f5] relative overflow-hidden">
      {/* Randomly positioned background logo watermarks - visible while scrolling */}
      <div className="absolute top-[5%] right-[3%] opacity-[0.06] pointer-events-none">
        <img src="/logo.svg" alt="Reframe Pricing Graphic 1" className="w-[300px] h-[300px] rotate-10" />
      </div>
      <div className="absolute top-[40%] left-[2%] opacity-[0.05] pointer-events-none">
        <img src="/logo.svg" alt="Reframe Pricing Graphic 2" className="w-[200px] h-[200px] -rotate-6" />
      </div>
      <div className="absolute top-[70%] right-[4%] opacity-[0.05] pointer-events-none">
        <img src="/logo.svg" alt="Reframe Pricing Graphic 3" className="w-[250px] h-[250px] rotate-8" />
      </div>
      <div className="absolute bottom-[5%] left-[5%] opacity-[0.06] pointer-events-none">
        <img src="/logo.svg" alt="Reframe Pricing Graphic 4" className="w-[280px] h-[280px] -rotate-12" />
      </div>
      
      <div className={cx(layout.compactShell, "relative z-10")}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-2xl mx-auto mb-12"
        >
          <h2 className={cx(typography.vercelSection, typography.sectionTitleInk, "mb-8")}>
            Transparent Pricing.<br />
            <span className="text-black/40">No surprises.</span>
          </h2>
          <p className="text-[18px] text-[#4d4d4d] leading-relaxed max-w-2xl mx-auto font-normal">
            Simple, transparent pricing for every service. Prices shown are for 24-hour Standard turnaround with Simple complexity.
          </p>
        </motion.div>

        {/* Table with sticky header */}
        <div className="max-w-5xl mx-auto">
          {/* Turnaround Pill Strip */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
            {[
              { time: '12h', label: 'Express' },
              { time: '24h', label: 'Standard' },
              { time: '48h', label: 'Relaxed' },
              { time: '72h', label: 'Economy' },
            ].map(({ time, label }) => (
              <div
                key={label}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 ${
                  label === 'Standard'
                    ? 'border-[var(--color-text-primary)] bg-[var(--color-text-primary)] text-white'
                    : 'border-black/10 bg-white text-[var(--color-text-primary)]'
                }`}
              >
                <span className="text-[14px] font-bold">{time}</span>
                <span className={`text-[12px] font-medium ${label === 'Standard' ? 'text-white/65' : 'text-black/45'}`}>
                  {label}
                </span>
              </div>
            ))}
          </div>

          <div className={cx('relative w-full overflow-hidden', tokens.surfacePanel)}>
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(23,23,23,0.18),transparent)]" />
            <div className="w-full">
              <div className="w-full text-left border-collapse">
                {/* Header Row */}
                <div className="grid grid-cols-[1fr_120px] sm:grid-cols-[25%_50%_25%] w-full items-stretch bg-[var(--color-bg-secondary)] border-b border-neutral-300/80 text-[12px] font-heading font-semibold text-neutral-600 uppercase tracking-[0.18em] select-none h-11">
                  <div className="flex items-center gap-1.5 border-r border-neutral-300/60 px-6">
                    <FileText size={13} className="text-neutral-400 shrink-0" />
                    <span>Service</span>
                  </div>
                  <div className="hidden sm:flex items-center gap-1.5 border-r border-neutral-300/60 px-6">
                    <List size={13} className="text-neutral-400 shrink-0" />
                    <span>Description</span>
                  </div>
                  <div className="flex items-center pl-4 pr-6">
                    <div className="flex-1 flex items-center justify-center gap-1.5">
                      <Hash size={13} className="text-neutral-400 shrink-0" />
                      <span className="whitespace-nowrap">Starting price</span>
                    </div>
                    <div className="hidden sm:block w-10 ml-3 shrink-0" />
                  </div>
                </div>

                {/* Table Body */}
                <div className="w-full">
                  {orderedServices.map((service: any, index: number) => {
                    const price = getSimplePrice(service);
                    const Icon = service.icon;
                    const style = pastelStyles[index % pastelStyles.length];
                    const isSelected = selectedService?.id === service.id;

                    return (
                      <div
                        key={service.id ?? service.name}
                        ref={(el) => {
                          rowElementsRef.current[service.id] = el;
                        }}
                        data-service-id={service.id}
                        onClick={() => {
                          if (window.innerWidth < 640) {
                            setSelectedServiceId(service.id);
                          } else {
                            navigate(`/services/${service.id}`);
                          }
                        }}
                        className={cx(
                          "group border-b border-neutral-200/80 last:border-b-0 grid grid-cols-[1fr_120px] sm:grid-cols-[25%_50%_25%] w-full items-stretch transition-all duration-200 cursor-pointer text-[14px]",
                          style.hoverClass,
                          isSelected ? "bg-black/[0.03] sm:bg-black/[0.015]" : "hover:bg-black/[0.015]"
                        )}
                      >
                        {/* Column 1: Service Name */}
                        <div className="py-5 px-6 border-r border-neutral-200/70 flex items-center gap-3 min-w-0">
                          <div className="flex h-5 w-5 shrink-0 items-center justify-center text-neutral-400 group-hover:text-neutral-800 group-hover:scale-105 transition-all duration-200">
                            {Icon && React.createElement(Icon, { size: 16, className: "shrink-0" })}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-heading text-[15px] font-semibold text-neutral-900 group-hover:text-black transition-colors leading-tight">
                              {service.name}
                            </span>
                            {/* Mobile-only description display */}
                            <div className="sm:hidden mt-1 text-[12px] text-neutral-500 leading-normal">
                              {service.description || 'Professional image editing service'}
                            </div>
                          </div>
                        </div>

                        {/* Column 2: Description */}
                        <div className="py-5 px-6 border-r border-neutral-200/70 hidden sm:flex items-center min-w-0">
                          <span className="text-neutral-700 font-sans text-[13px] leading-relaxed">
                            {service.description || 'Professional image editing service'}
                          </span>
                        </div>

                        {/* Column 3: Price & Action */}
                        <div className="py-5 pl-4 pr-6 flex items-center min-w-0">
                          <div className="flex-1 flex items-center justify-center">
                            <span className="font-heading text-[16px] font-semibold text-neutral-900 tabular-nums tracking-tight whitespace-nowrap">
                              {formatCurrency(convertFromUsd(price), currency)}
                            </span>
                          </div>
                          
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              window.location.href = `/order?serviceId=${service.id}`;
                            }}
                            className="hidden sm:inline-flex items-center justify-center min-w-10 h-10 ml-3 rounded-full bg-neutral-50 border border-neutral-300 text-neutral-500 group-hover:bg-neutral-900 group-hover:border-neutral-900 group-hover:text-white transition-all duration-200 shrink-0 sm:opacity-70 sm:group-hover:opacity-100"
                          >
                            <ArrowRight size={14} className="transition-transform duration-300 group-hover:-rotate-45" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer with email form */}
            <div className="px-6 py-10 bg-[var(--color-bg-secondary)] border-t border-neutral-300/80">
              <div className="text-center mb-8">
                <p className="text-[16px] text-[var(--color-text-primary)] font-semibold mb-3">
                  Need detailed pricing for your specific images?
                </p>
                <p className="text-[15px] text-[var(--color-text-secondary)] max-w-md mx-auto leading-relaxed">
                  Send us your email and sample images. We'll review and send you a personalized quote within ~30 minutes.
                </p>
              </div>
              
              {submitted ? (
                <div className="max-w-md mx-auto p-5 bg-green-50 border border-green-200 rounded-xl text-center">
                  <p className="text-green-700 text-[14px] font-medium">Thanks! We'll be in touch soon with your custom quote.</p>
                </div>
              ) : (
                <form onSubmit={handleEmailSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                  <PublicInput 
                    type="email" 
                    placeholder="Enter your work email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="flex-1 border-black/15 focus:border-black/40"
                  />
                  <button 
                    type="submit"
                    className={cx(publicInlineSubmitButtonClass, 'rounded-xl px-8 font-semibold shadow-md')}
                  >
                    Order now
                  </button>
                </form>
              )}
              <p className="text-center text-[13px] text-black/40 mt-4">
                We'll analyze your images and provide accurate pricing tailored to your needs.
              </p>
            </div>
          </div>
        </div>
      </div>

      {selectedService && (
        <div className="sm:hidden fixed left-1/2 -translate-x-1/2 bottom-[88px] z-[220] w-[calc(100%-24px)] max-w-md">
          <button
            onClick={() => window.location.href = `/order?serviceId=${selectedService.id}`}
            className="w-full h-12 rounded-full bg-[var(--color-text-primary)] text-white text-[12px] font-semibold tracking-wide shadow-[0_8px_24px_rgba(0,0,0,0.2)]"
          >
            Order now: {selectedService.name}
          </button>
        </div>
      )}
    </section>
  );
};

export default PricingTable;
