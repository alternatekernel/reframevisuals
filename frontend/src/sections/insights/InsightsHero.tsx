import { motion } from 'framer-motion';
import { cx, layout, typography } from '../../utils/theme';

const InsightsHero = () => {
  return (
    <section data-section="hero" className="px-5 sm:px-6 lg:px-12 pt-8 sm:pt-10 pb-8 sm:pb-12 bg-white relative overflow-hidden border-b border-[#f5f5f5]">
      {/* Background Watermark */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 opacity-[0.02] pointer-events-none">
        <img src="/logo.svg" alt="Reframe Blog Background Graphic" className="w-[260px] h-[260px] sm:w-[420px] sm:h-[420px] -translate-x-1/2" />
      </div>

      <div className={cx(layout.compactShell, "relative z-10")}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-4xl mx-auto"
        >
          <h1 className={cx(typography.vercelSection, "text-[#171717] mb-8")}>
            Decoding the future <br />
            <span className="text-black/40">of visual output.</span>
          </h1>
          <p className="text-[15px] sm:text-[18px] text-[#4d4d4d] leading-relaxed max-w-2xl mx-auto font-normal px-2 sm:px-0">
            Deep dives into neural processing, color science, and the 
            intersection of human artistry with machine throughput.
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default InsightsHero;
