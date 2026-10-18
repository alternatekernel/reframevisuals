import { motion } from 'framer-motion';
import { cx, layout, typography } from '../../utils/theme';

const PortfolioHero = () => {
  return (
    <section data-section="hero" className="px-6 lg:px-12 py-16 bg-white border-b border-[#f5f5f5] relative overflow-hidden">
      <div className="absolute top-1/2 left-0 -translate-y-1/2 opacity-[0.02] pointer-events-none">
        <img src="/logo.svg" alt="Reframe Portfolio Background Graphic" className="w-[260px] h-[260px] sm:w-[420px] sm:h-[420px] -translate-x-1/2" />
      </div>

      <div className={cx(layout.compactShell, 'relative z-10')}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-2xl mx-auto"
        >
          <h1 className={cx(typography.vercelSection, 'text-[#171717] mb-8')}>
            Portfolio Samples.<br />
            <span className="text-black/40">Real ecommerce outputs.</span>
          </h1>
          <p className="text-[18px] text-[#4d4d4d] leading-relaxed max-w-2xl mx-auto font-normal">
            A quick sample of production-grade edits across background removal, clipping path, color work, and retouching.
            Need your own proof test? Start with a free trial and review quality on your exact image types.
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default PortfolioHero;
