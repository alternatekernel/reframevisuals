import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cx, layout, tokens, typography } from '../utils/theme';
import { Activity, ArrowRight } from 'lucide-react';
import { useContent } from '../context/ContentBase';
import { ButtonWithIcon } from '../components/ui/button-with-icon';
import { useCurrency } from '../context/CurrencyContext';
import { formatCurrency } from '../utils/currency';
import ServiceTable from './Services';


const PricingCard = React.memo(({ p, index }: { p: { name: string; price: number | null; services: string[]; savings: string; highlight?: boolean }; index: number }) => {
  const [isHovered, setIsHovered] = useState(false);
  const { isUserAuthenticated } = useContent();
  const navigate = useNavigate();
  const { currency, convertFromUsd } = useCurrency();
  const tone = p.highlight
    ? null
    : {
        shell: "bg-white border border-black/[0.18] shadow-[0_4px_12px_rgba(0,0,0,0.02)]",
        title: "text-black/80",
        sub: "text-black/45",
        dot: "bg-black/20",
        text: "text-black/65 group-hover/item:text-black",
        chip: "bg-black/5 text-black/75 border border-black/[0.18]",
      };

  return (
    <div 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cx(
        "group relative flex flex-col p-1 transition-all duration-300",
        tokens.radiusLargeCard,
        p.highlight ? "z-20" : "z-10"
      )}
    >
      {/* 1. OUTER SHELL */}
      <div className={cx(
        "absolute inset-0 overflow-hidden border transition-all duration-300",
        tokens.radiusLargeCard,
        p.highlight ? "bg-[var(--color-text-primary)]" : tone?.shell,
        isHovered && !p.highlight ? `${tokens.shadowShowcase} border-black/[0.18]` : ""
      )}>
        {!p.highlight && <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.95),transparent)]" />}
      </div>

      {/* 2. INNER CONTENT AREA */}
      <div className={cx(
        "relative flex-1 flex flex-col p-6 lg:p-8 overflow-hidden transition-all duration-500",
        tokens.radiusLargeCard,
        p.highlight ? "bg-transparent text-white" : "bg-transparent"
      )}>
        
        {/* Pricing Identity */}
        <div className="space-y-2 mb-6 lg:mb-8">
          <h4 className={cx(
            typography.label,
            p.highlight ? "text-white" : tone?.title
          )}>
            {p.name}
          </h4>
          <div className="flex items-baseline gap-2">
            <span className={cx(
              typography.price,
              "text-[30px] leading-none",
              p.highlight ? "text-white" : "text-black"
            )}>
              {p.price !== null ? formatCurrency(convertFromUsd(p.price), currency) : 'Custom'}
            </span>
            <span className={cx(
              "text-[16px] font-medium",
              p.highlight ? "text-white/50" : tone?.sub
            )}>
              /image
            </span>
          </div>
        </div>

        {/* Feature Matrix */}
        <div className="flex-1 space-y-3 mb-8 lg:mb-10">
          {p.services?.map((s, si) => (
            <div 
              key={si} 
              className="flex items-center gap-3 group/item"
            >
              <div className={cx(
                "w-1.5 h-1.5 rounded-full transition-all duration-300 shrink-0",
                p.highlight ? "bg-white/30" : tone?.dot,
                isHovered && !p.highlight ? "bg-black/50" : ""
              )} />
              <span className={cx(
                "text-[16px] font-medium transition-colors",
                p.highlight ? "text-white/70 group-hover/item:text-white" : tone?.text
              )}>
                {s}
              </span>
            </div>
          ))}
          <div className="pt-2">
            <div className={cx(
                "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px] font-black uppercase tracking-wider",
                p.highlight ? "bg-white/10 text-white/70" : tone?.chip
              )}>
                <Activity size={12} />
                {p.savings}
             </div>
          </div>
        </div>

        {/* Hero Style CTA */}
        <div className="pt-4">
          <ButtonWithIcon 
            variant={p.highlight ? "white" : "default"}
            label={isUserAuthenticated ? 'Start Editing' : 'Get Started'}
            className="!w-full !max-w-none"
            animated={false}
            onClick={() => navigate(isUserAuthenticated ? '/dashboard?view=new-project' : '/free-trial')}
          />
        </div>
      </div>
    </div>
  );
});

const TrustProofRow = () => {
  const stats = [
    { label: 'Turnaround', value: '12-72h' },
    { label: 'QA reviewed', value: '100%' },
    { label: 'Per image, from', value: '$0.39' },
  ];

  return (
    <div className="mt-10 md:mt-14 lg:mt-20">
      <div className="rounded-2xl border border-black/[0.18] bg-[var(--color-bg-secondary)] px-6 py-5 sm:px-8 sm:py-6">
        <div className="flex flex-col items-center gap-5 sm:flex-row sm:gap-0 sm:divide-x sm:divide-black/[0.07]">
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-1 flex-col items-center gap-1 sm:px-8">
              <span className="text-[28px] font-black leading-none tracking-[-0.04em] text-[var(--color-text-primary)] sm:text-[32px]">
                {stat.value}
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-widest text-black/40">
                {stat.label}
              </span>
            </div>
          ))}
          <div className="hidden h-10 w-px bg-black/[0.07] sm:block" />
          <div className="flex flex-1 items-center justify-center gap-2.5 sm:px-8">
            <img src="/logo.svg" alt="Reframe Visuals" aria-hidden="true" className="h-4 w-4 shrink-0 object-contain opacity-30" />
            <span className="text-[11px] font-semibold uppercase tracking-widest text-black/35">
              Guaranteed by Reframe Visuals
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

const MobilePricingCard = React.memo(({ p, index }: { p: { name: string; price: number | null; services: string[]; savings: string; highlight?: boolean }; index: number }) => {
  const { isUserAuthenticated } = useContent();
  const navigate = useNavigate();
  const { currency, convertFromUsd } = useCurrency();
  const services = (p.services || []).slice(0, 2);
  const tone = p.highlight
    ? null
    : {
        shell: "bg-white border border-black/[0.18] shadow-sm",
        title: "text-black/80",
        chip: "bg-black/5 text-black/75 border border-black/[0.18]",
        button: "bg-[var(--color-text-primary)] text-white",
        sub: "text-black/45",
      };

  return (
    <article
      className={cx(
        "rounded-2xl border p-3 shadow-[0_14px_34px_-28px_rgba(0,0,0,0.5)]",
        p.highlight ? "border-[#171717] bg-[var(--color-text-primary)] text-white" : `${tone?.shell} text-[var(--color-text-primary)]`
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h3
            className={cx(
              "truncate text-[11px] font-black uppercase tracking-[0.16em]",
              p.highlight ? "text-white/75" : tone?.title
            )}
          >
            {p.name}
          </h3>
        </div>
        <span
          className={cx(
            "shrink-0 rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-[0.08em]",
            p.highlight ? "bg-white/10 text-white/70" : tone?.chip
          )}
        >
          {p.savings}
        </span>
      </div>

      <div className="mt-2 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-baseline gap-1.5">
            <span className="text-[25px] font-black leading-none tracking-[-0.04em]">{p.price !== null ? formatCurrency(convertFromUsd(p.price), currency) : 'Custom'}</span>
            <span className={cx("text-[11px] font-medium", p.highlight ? "text-white/55" : tone?.sub)}>/image</span>
          </div>
          <div className="mt-2 flex min-w-0 gap-1.5">
            {services.map((service) => (
              <span
                key={service}
                className={cx(
                  "max-w-[120px] truncate rounded-full px-2 py-1 text-[10px] font-semibold leading-none",
                  p.highlight ? "bg-white/10 text-white/70" : tone?.chip
                )}
              >
                {service}
              </span>
            ))}
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate(isUserAuthenticated ? '/dashboard?view=new-project' : '/free-trial')}
          className={cx(
            "group flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-[12px] font-bold transition-transform active:scale-[0.98]",
            p.highlight ? "bg-white text-[var(--color-text-primary)]" : tone?.button
          )}
        >
          <span>Start</span>
          <ArrowRight size={14} className="transition-transform duration-300 group-hover:-rotate-45" />
        </button>
      </div>
    </article>
  );
});

const Pricing = () => {
  const { getSectionContent } = useContent();
  const bundlesData = getSectionContent('bundles');
  const pricingContent = getSectionContent('pricingPage');

  const pricingPlans = (bundlesData.bundles || [])
    .filter((b: any) => b.price !== null)
    .slice(0, 3);

  return (
  <section id="pricing" className="pt-12 pb-12 sm:pt-14 sm:pb-14 lg:pt-20 lg:pb-20 bg-white relative scroll-mt-nav overflow-hidden">
    <div className={cx(layout.compactShell, "relative z-10 px-5 sm:px-6 lg:px-12")}>
      
      {/* Simplified Header */}
      <div className="text-center max-w-2xl mx-auto space-y-1.5 mb-5 md:mb-12 lg:mb-16">
        <h2 className={cx(typography.displayLg, "text-[var(--color-text-primary)]")}>
          Pricing plans. <br />
          <span className="text-black/40">For every scale.</span>
        </h2>
        <p className="text-black/60 text-[16px] lg:text-[18px] leading-relaxed max-w-lg mx-auto font-normal">
          {pricingContent.landingDescription || 'Pre-configured workflows. Order instantly, ship faster.'}
        </p>
      </div>

      <ServiceTable />

      <div className="grid grid-cols-1 gap-2.5 md:hidden">
        {pricingPlans.map((p: any, i: number) => (
          <MobilePricingCard key={p.id || i} p={p} index={i} />
        ))}
      </div>
       
      <div className="relative hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10 max-w-6xl mx-auto items-center">
        {pricingPlans.map((p: any, i: number) => (
          <PricingCard key={p.id || i} p={p} index={i} />
        ))}
      </div>

      {/* Trust stat strip */}
      <div className="mt-10 md:mt-14 max-w-6xl mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-black/[0.06] rounded-2xl border border-black/[0.18] bg-white overflow-hidden">
          {[
            { value: '12–72h', label: 'Turnaround' },
            { value: '100%', label: 'QA reviewed' },
            { value: '$0.39', label: 'Per image, from' },
            { value: '3 free', label: 'To start, no card' },
          ].map((stat) => (
            <div key={stat.label} className="flex flex-col items-center justify-center gap-1 px-6 py-5">
              <span className="font-heading text-[22px] sm:text-[26px] font-black tracking-[-0.04em] text-[var(--color-text-primary)]">
                {stat.value}
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-widest text-black/38">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  </section>
  );
};

export default Pricing;
