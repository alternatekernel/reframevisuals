import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cx, layout, tokens, typography } from '../../utils/theme';
import BeforeAfterCard from '../../components/BeforeAfterCard';
import { ButtonWithIcon } from '../../components/ui/button-with-icon';
import { getStartingPrice } from '../../utils/pricing';
import { useCurrency } from '../../context/CurrencyContext';
import { formatCurrency } from '../../utils/currency';

interface ServiceHeroProps {
  service: any;
  isUserAuthenticated: boolean;
}

const ServiceHero: React.FC<ServiceHeroProps> = ({ service, isUserAuthenticated }) => {
  const price = getStartingPrice(service.id, service.price);
  const { currency, convertFromUsd } = useCurrency();
  const navigate = useNavigate();

  return (
    <section data-section="hero" className="relative overflow-hidden bg-white px-6 pt-20 pb-12 lg:px-12 lg:pt-28 lg:pb-16 border-b border-[var(--color-border-light)]">
      {/* Background Watermark (Matches Portfolio & About Page) */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 opacity-[0.02] pointer-events-none">
        <img src="/logo.svg" alt="Reframe Service Background Graphic" className="w-[300px] h-[300px] sm:w-[500px] sm:h-[500px] -translate-x-1/2" />
      </div>

      <div className={cx(layout.compactShell, "relative z-10")}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          
          {/* Left Side: Content */}
          <div className="lg:col-span-7 space-y-8 lg:space-y-10">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
              className="space-y-4 lg:space-y-6"
            >
              <div className={cx(typography.vercelMono, 'text-black/45')}>Service Detail</div>
              <h1 className={cx("text-[40px] lg:text-[64px] font-bold leading-[1.05] tracking-[-0.04em]", typography.sectionTitleInk)}>
                {service.name}
              </h1>
              <p className="text-[16px] lg:text-[18px] text-[var(--color-text-secondary)] leading-relaxed max-w-xl font-medium">
                {service.detail || service.description || "Professional retouching with human editors and QA review on every file."}
              </p>
            </motion.div>

            {/* Floating Metrics Grid */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
              className="grid grid-cols-2 overflow-hidden rounded-2xl border border-white/70 bg-white/70 shadow-[0_18px_48px_rgba(15,23,42,0.06)] backdrop-blur-xl lg:grid-cols-4 lg:rounded-3xl"
            >
              <div className="p-4 lg:p-6 space-y-1 lg:space-y-2 border-r border-b lg:border-b-0 border-white/60">
                <span className="block text-[9px] lg:text-[12px] font-bold tracking-widest text-black/40 uppercase">Starting</span>
                <p className="text-xl lg:text-2xl font-bold text-[var(--color-text-primary)] tracking-tighter">{formatCurrency(convertFromUsd(price), currency)}</p>
              </div>
              <div className="p-4 lg:p-6 space-y-1 lg:space-y-2 border-b lg:border-b-0 lg:border-r border-white/60">
                <span className="block text-[9px] lg:text-[12px] font-bold tracking-widest text-black/40 uppercase">Daily Capacity</span>
                <p className="text-xl lg:text-2xl font-bold text-[var(--color-text-primary)] tracking-tighter">{service.servicePageContent?.dailyCapacity || '10k+'}</p>
              </div>
              <div className="p-4 lg:p-6 space-y-1 lg:space-y-2 border-r border-white/60">
                <span className="block text-[9px] lg:text-[12px] font-bold tracking-[0.2em] text-black/40 uppercase">Precision</span>
                <p className="text-xl lg:text-2xl font-bold tracking-tighter text-[var(--color-text-primary)]">
                  Pixel
                </p>
              </div>
              <div className="p-4 lg:p-6 space-y-1 lg:space-y-2">
                <span className="block text-[9px] lg:text-[12px] font-bold tracking-widest text-black/40 uppercase">Revisions</span>
                <p className="text-xl lg:text-2xl font-bold text-[var(--color-text-primary)] tracking-tighter">∞</p>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center gap-3 lg:gap-4 pt-2"
            >
              <ButtonWithIcon
                variant="default"
                label={isUserAuthenticated ? 'Start Production' : 'Order Now'}
                onClick={() => navigate('/order')}
                className="!w-full sm:!w-auto !h-[50px] lg:!h-[56px] !text-[15px] lg:!text-[16px]"
              />
              <Link
                to="/pricing"
                className="flex h-[50px] lg:h-[56px] items-center justify-center rounded-full border border-black/[0.18] bg-white px-8 text-[15px] lg:text-[16px] font-bold text-[var(--color-text-primary)] transition-all hover:bg-black/5 active:scale-95 w-full sm:w-auto"
              >
                View Pricing
              </Link>
            </motion.div>
          </div>

          {/* Right Side: Visual */}
          <div className="lg:col-span-5 relative w-full max-w-sm lg:max-w-md mx-auto">
            {/* Abstract geometric frame behind the image */}
            <div className="absolute -inset-3 lg:-inset-4 bg-white/40 backdrop-blur-3xl rounded-[32px] lg:rounded-[40px] border border-white/60 shadow-[0_20px_40px_rgba(0,0,0,0.09)] lg:shadow-[0_40px_80px_rgba(0,0,0,0.10)] rotate-[-2deg] scale-[0.98] transition-transform duration-700 hover:rotate-0" />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
              className="relative aspect-square lg:aspect-[4/5] bg-[var(--color-text-primary)] rounded-[24px] lg:rounded-[32px] border border-black/[0.16] overflow-hidden shadow-[0_24px_60px_rgba(15,23,42,0.16)]"
            >
              {service.beforeImage && service.afterImage ? (
                <BeforeAfterCard
                  key={service.id}
                  beforeImage={service.beforeImage}
                  afterImage={service.afterImage}
                  aspectRatio="h-full w-full"
                  className="absolute inset-0 w-full h-full rounded-none border-none"
                  isActive={true}
                  hideHandle={false}
                  hideLabels={false}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-[var(--color-bg-secondary)]">
                  <p className="text-xs lg:text-sm font-bold tracking-widest text-black/30 uppercase">Preview Loading...</p>
                </div>
              )}
            </motion.div>
            
            {/* Floating indicator */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="absolute -bottom-4 -left-4 lg:-bottom-6 lg:-left-6 bg-white border border-black/[0.18] shadow-xl rounded-xl lg:rounded-2xl p-3 lg:p-4 flex items-center gap-3 lg:gap-4 z-20"
            >
              <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-brand/10 flex items-center justify-center">
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[var(--color-brand-primary)]"></span>
              </div>
              <div>
                <p className="text-[9px] lg:text-[12px] font-bold tracking-widest text-black/40 uppercase">Interactive</p>
                <p className="text-[12px] lg:text-[14px] font-bold text-[var(--color-text-primary)] tracking-tight">Drag to Compare</p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ServiceHero;
