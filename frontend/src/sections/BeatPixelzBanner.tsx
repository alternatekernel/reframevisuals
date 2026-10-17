import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const BeatPixelzBanner = () => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
      className="relative overflow-hidden"
    >
      <div className="relative z-10 mx-auto max-w-7xl px-5 py-7 sm:px-8 sm:py-8 lg:px-10 lg:py-9">
        <div className="relative overflow-hidden rounded-[28px] border border-black/[0.16] animate-card-bg px-5 py-6 shadow-[0_24px_60px_-34px_rgba(15,23,42,0.18)] sm:px-6 lg:flex lg:items-center lg:justify-between lg:gap-10 lg:px-8 lg:py-7">
          {/* Decorative blurs */}
          <div className="pointer-events-none absolute -top-10 -right-10 h-36 w-36 rounded-full bg-white/55 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-12 -left-8 h-36 w-36 rounded-full bg-black/[0.05] blur-2xl" />

          {/* Left: Copy */}
          <div className="relative z-10 flex flex-col gap-1.5">
            <h2 className="text-[22px] sm:text-[26px] lg:text-[30px] font-bold leading-[1.2] tracking-[-0.03em] text-[var(--color-text-primary)]">
              Better edges than AI tools. Lower price than enterprise studios.{' '}
              <span className="text-black/35">From $0.39/image.</span>
            </h2>
            <p className="mt-1 max-w-2xl text-[16px] leading-relaxed text-black/55">
              Human QA, cleaner edges, and per-image pricing with no subscription.
            </p>
          </div>

          {/* Right: CTAs */}
          <div className="relative z-10 mt-5 flex shrink-0 flex-col gap-2.5 sm:flex-row lg:mt-0 lg:flex-col lg:items-stretch">
            <Link
              to="/free-trial?type=pilot"
              className="group inline-flex min-h-12 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-[var(--color-text-primary)] py-1.5 pl-6 pr-1.5 text-[16px] font-bold text-white shadow-[0_8px_24px_rgba(0,0,0,0.10)] transition-all hover:bg-black active:scale-95"
            >
              <span>Get 3 Free Sample Edits</span>
              <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/90 text-black">
                <ArrowRight size={14} className="transition-transform duration-300 group-hover:-rotate-45" />
              </span>
            </Link>
            <Link
              to="/pricing"
              className="inline-flex min-h-12 items-center justify-center whitespace-nowrap rounded-full border border-black/[0.18] bg-white px-6 text-[16px] font-bold text-[var(--color-text-primary)] transition-all hover:bg-black/[0.05] active:scale-95"
            >
              See pricing
            </Link>
          </div>
        </div>
      </div>
    </motion.section>
  );
};

export default BeatPixelzBanner;
