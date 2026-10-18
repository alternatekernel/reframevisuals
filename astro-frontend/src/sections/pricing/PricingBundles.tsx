import React from 'react';
import { motion } from 'framer-motion';
import { cx, layout, typography } from '../../utils/theme';
import BundleCard from '../../components/pricing/BundleCard';

interface PricingBundlesProps {
  bundles: any[];
}

const PricingBundles: React.FC<PricingBundlesProps> = ({ bundles }) => (
  <section className="relative px-6 lg:px-12 pt-16 pb-20 bg-white overflow-hidden">
    {/* Background Watermark */}
    <div className="absolute top-1/2 left-0 -translate-y-1/2 opacity-[0.02] pointer-events-none">
      <img src="/logo.svg" alt="Reframe Pricing Bundles Backdrop" className="w-[500px] h-[500px] -translate-x-1/2" />
    </div>

    <div className={cx(layout.compactShell, "relative z-10")}>
      {/* Section header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-4xl mx-auto mb-24"
      >
        <h2 className={cx(typography.vercelSection, typography.sectionTitleInk, "mb-8")}>
          Pick your bundle. <br />
          <span className="text-black/20">Start in seconds.</span>
        </h2>
        <p className="text-[18px] lg:text-[20px] text-[var(--color-text-secondary)] leading-relaxed max-w-2xl mx-auto font-normal">
          Transparent pricing for pre-configured workflows. 
          Order instantly, ship faster, scale without friction.
        </p>
      </motion.div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 items-stretch max-w-6xl mx-auto">
        {bundles.map((b: any, i: number) => (
          <BundleCard key={b.id ?? i} b={b} i={i} />
        ))}
      </div>

      </div>
    </section>
);

export default PricingBundles;

