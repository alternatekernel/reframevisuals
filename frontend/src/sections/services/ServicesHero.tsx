import React from 'react';
import { motion } from 'framer-motion';
import { cx, layout, typography } from '../../utils/theme';

interface ServicesHeroProps {
  content: any;
}

const ServicesHero: React.FC<ServicesHeroProps> = ({ content }) => {
  return (
    <section className="px-6 lg:px-12 py-16 bg-white relative overflow-hidden border-b border-black/5">
      {/* Background Watermark */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 opacity-[0.02] pointer-events-none">
        <img src="/logo.svg" alt="Reframe Services Background Icon" className="w-[500px] h-[500px] -translate-x-1/2" />
      </div>

      <div className={cx(layout.compactShell, "relative z-10")}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-4xl mx-auto mb-8"
        >
          {/* Heading - Like AboutPhilosophy */}
          <h1 className={cx(typography.vercelSection, typography.sectionTitleInk, "mb-8")}>
            {content.heading || 'Every editing service'}<br />
            <span className="text-black/40">{content.subheading || 'reviewed by hand.'}</span>
          </h1>

          {/* Description - Like AboutPhilosophy */}
          <p className={cx('text-[18px] leading-relaxed max-w-2xl mx-auto font-normal', typography.sectionSubtitleMuted)}>
            {content.description || 'Background removal, clipping paths, ghost mannequin, retouching, and color correction for ecommerce brands at any volume.'}
          </p>
        </motion.div>
        
        {/* Turnaround selector — pill tabs matching platform design */}
        <div className="flex flex-wrap items-center justify-center gap-2">
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
        <p className="text-center text-[12px] text-black/38 mt-3">
          Prices shown are for 24h Standard turnaround, Simple tier
        </p>
      </div>
    </section>
  );
};

export default ServicesHero;
