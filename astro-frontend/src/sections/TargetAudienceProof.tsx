import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { cx, layout, tokens } from '../utils/theme';

const segments = [
  {
    eyebrow: 'Ecommerce sellers',
    headline: 'Quality without\nenterprise commitments.',
    cta: { label: 'Get 3 free edits', href: '/free-trial' },
    eyebrowColor: 'text-black/40',
  },
  {
    eyebrow: 'Amazon sellers',
    headline: 'Listing images that pass\ncompliance and drive clicks.',
    cta: { label: 'See how it works', href: '/how-it-works' },
    eyebrowColor: 'text-black/40',
  },
  {
    eyebrow: 'Startup & scaling brands',
    headline: 'Test quality before\nyou commit to anyone.',
    cta: { label: 'Start test batch', href: '/free-trial?type=pilot' },
    eyebrowColor: 'text-black/40',
  },
];

const TargetAudienceProof = () => {
  return (
    <section className={cx("pt-10 pb-4 lg:pt-16 lg:pb-6 px-5 sm:px-6 lg:px-10", layout.compactShell)}>
      <motion.h2
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="text-[32px] font-semibold tracking-[-0.04em] leading-[1.05] text-[var(--color-text-primary)] sm:text-[42px] lg:text-[50px] mb-8 lg:mb-12 text-center"
      >
        The same editing quality, without{' '}
        <span className="text-black/40">the enterprise minimums.</span>
      </motion.h2>

      <div className="grid gap-4 md:grid-cols-3 lg:gap-6">
        {segments.map((seg, i) => (
          <motion.div
            key={seg.eyebrow}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1], delay: i * 0.07 }}
            className="group flex flex-col py-2 text-center"
          >
            <p className={`mb-3 text-[12px] font-semibold uppercase tracking-widest ${seg.eyebrowColor}`}>
              {seg.eyebrow}
            </p>
            <h3 className="flex-1 whitespace-pre-line text-[22px] lg:text-[26px] font-semibold tracking-[-0.03em] leading-[1.15] text-[var(--color-text-primary)] mb-6">
              {seg.headline}
            </h3>
            <Link
              to={seg.cta.href}
              className="inline-flex items-center justify-center gap-1.5 text-[15px] font-bold text-[var(--color-text-primary)] transition-all"
            >
              <span className="relative">
                {seg.cta.label}
                <span className={tokens.interactiveUnderline} />
              </span>
              <ArrowRight size={14} className="text-black/40 transition-all duration-300 group-hover:-rotate-45 group-hover:text-black/70 shrink-0" />
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default TargetAudienceProof;
