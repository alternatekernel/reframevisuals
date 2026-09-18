import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { cx } from '../utils/theme';
import { Service } from '../data/services';
import BeforeAfterCard from './BeforeAfterCard';
import { getStartingPrice } from '../utils/pricing';
import { useCurrency } from '../context/CurrencyContext';
import { formatCurrency } from '../utils/currency';
import { Check, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ServiceDetailProps {
  service: Service | any;
  showOrderNow?: boolean;
}

const ServiceDetail: React.FC<ServiceDetailProps> = ({ service, showOrderNow = true }) => {
  const [activeVariantIndex, setActiveVariantIndex] = useState(0);
  const [isInView, setIsInView] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const { currency, convertFromUsd } = useCurrency();
  
  // Use examples from service, fallback to a single variant without label if none exist
  const displayVariants = (service.examples && service.examples.length > 0) ? service.examples : [
    { before: service.beforeImage || '', after: service.afterImage || '', label: '' }
  ];
  
  const activeVariant = displayVariants[activeVariantIndex] || displayVariants[0];
  const price = getStartingPrice(service.id, service.price || service.startingPrice || 0);
  const turnaround = service.tiers?.[0]?.processingTime || "24-48h";

  // Create sequence array for continuous animation
  const sequence = React.useMemo(() => {
    if (displayVariants.length > 1) {
      // Use the last variant's before image so the final "return to half" perfectly matches the final variant
      const lastVariant = displayVariants[displayVariants.length - 1];
      return [
        { image: lastVariant.before, label: 'BEFORE' },
        ...displayVariants.map((v: any, i: number) => ({ 
          image: v.after, 
          label: v.label || `OPTION ${i + 1}` 
        }))
      ];
    }
    return undefined;
  }, [displayVariants]);

  const handleSequenceChange = (seqIndex: number) => {
    if (isAutoPlaying && sequence) {
      // seqIndex 0 means sweeping to Variant 0
      // seqIndex 1 means sweeping to Variant 1
      // seqIndex 2 means sweeping back to Before
      if (seqIndex === sequence.length - 1) {
        setActiveVariantIndex(displayVariants.length - 1);
      } else {
        setActiveVariantIndex(seqIndex);
      }
    }
  };

  const handleVariantClick = (i: number) => {
    setIsAutoPlaying(false);
    setActiveVariantIndex(i);
  };

  return (
    <div className="group relative">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-center">
        
        {/* VISUAL PREVIEW - RIGHT side on desktop, TOP on mobile */}
        <div className="order-first lg:order-last lg:col-span-7 flex flex-col items-center lg:items-end">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            onViewportEnter={() => setIsInView(true)}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
            className="w-full flex flex-col gap-6"
          >
            {/* Strict 4:5 container with 70vh limit - SHARP CORNERS */}
            <div className="relative h-[50vh] sm:h-[60vh] lg:h-[70vh] aspect-[4/5] overflow-hidden bg-black/5 self-center lg:self-end">
              <div className="absolute inset-0 overflow-hidden">
                <BeforeAfterCard 
                  beforeImage={isAutoPlaying ? (displayVariants[displayVariants.length - 1]?.before || '') : (activeVariant?.before || '')}
                  afterImage={isAutoPlaying ? (displayVariants[displayVariants.length - 1]?.after || '') : (activeVariant?.after || '')}
                  sequence={isAutoPlaying ? sequence : undefined}
                  onSequenceChange={handleSequenceChange}
                  aspectRatio="h-full w-full"
                  className="border-none w-full h-full rounded-none"
                  isActive={isInView}
                  disableEntryAnimation={true}
                />
              </div>
            </div>

            {/* VARIANT SWITCHER - BELOW THE IMAGE */}
            {displayVariants.length > 1 && displayVariants.some((v: any) => v.label) && (
              <div className="flex justify-center lg:justify-end pr-0 lg:pr-4">
                <div className="flex gap-1 bg-black/5 p-1 rounded-full">
                  {displayVariants.map((variant: any, i: number) => (
                    <button
                      key={variant.label || i}
                      onClick={() => handleVariantClick(i)}
                      className={cx(
                        "px-4 py-1.5 rounded-full text-[9px] font-bold tracking-wider uppercase transition-all",
                        activeVariantIndex === i 
                          ? "bg-black text-white" 
                          : "text-black/40 hover:text-black/60"
                      )}
                    >
                      {variant.label || `Option ${i + 1}`}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* TEXT CONTENT */}
        <div className="lg:col-span-5">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >


            <h2 className="text-3xl lg:text-4xl font-heading font-normal tracking-[-0.05em] text-[#171717] mb-6 leading-tight">
              {service.name}
            </h2>
            
            <p className="text-xl font-medium text-[#333333] leading-relaxed mb-4 max-w-md">
              {service.description}
            </p>

            <p className="text-base text-[#666666] leading-[1.6] sm:leading-relaxed mb-6 sm:mb-8 max-w-md">
              {service.detail}
            </p>
            
            {service.bestFor && (
              <div className="mb-8 sm:mb-10">
                <span className="text-[10px] font-bold tracking-[0.15em] text-black/30 uppercase mb-2 block">
                  IDEAL FOR
                </span>
                <p className="text-sm font-medium text-[#4d4d4d] max-w-md leading-relaxed">
                  {service.bestFor}
                </p>
              </div>
            )}

            {/* FEATURES GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3 sm:gap-4 mb-8 sm:mb-10">
              {(service.includes || []).slice(0, 4).map((feature: any) => (
                <div key={feature} className="flex items-center gap-3 group/item">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-black/5 flex items-center justify-center">
                    <Check className="w-3 h-3 text-[#171717]" />
                  </div>
                  <span className="text-sm font-medium text-[#4d4d4d]">{feature}</span>
                </div>
              ))}
            </div>

            {/* ACTION FOOTER */}
            <div className="flex flex-wrap items-center gap-6 sm:gap-8 pt-6 sm:pt-8 border-t border-black/5">
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-[10px] font-bold text-black/20 tracking-widest uppercase mb-1">FROM</p>
                  <p className="text-xl font-heading font-bold text-[#171717]">{formatCurrency(convertFromUsd(price), currency)}</p>
                </div>
                
                {showOrderNow && (
                  <button 
                    onClick={() => window.location.href = `/order?serviceId=${service.id}`}
                    className="h-12 rounded-full bg-[#171717] px-6 text-[12px] font-bold uppercase tracking-widest text-white shadow-[0_8px_24px_rgba(0,0,0,0.10)] transition-all hover:bg-black active:scale-95"
                  >
                    Order Now
                  </button>
                )}
              </div>

              
              <div className="ml-auto pt-2 lg:pt-0">
                <Link 
                  to={`/services/${service.id}`}
                  className="group/link inline-flex min-h-10 items-center gap-2 text-[12px] font-bold text-[#171717] tracking-widest underline-offset-4 hover:underline"
                >
                  View Service Details <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover/link:-rotate-45" />
                </Link>
              </div>
            </div>
          </motion.div>
        </div>

      </div>
    </div>
  );
};

export default ServiceDetail;
