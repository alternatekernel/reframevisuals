import { motion } from 'framer-motion';
import { cx, layout, typography } from '../../utils/theme';

const AboutHero = () => {
  return (
    <section data-section="hero" className="relative px-6 lg:px-12 pt-24 pb-16 bg-white overflow-hidden">
      <div className={cx(layout.compactShell, "relative z-10")}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-4xl mx-auto"
        >
          <h1 className={cx(typography.vercelSection, "text-[#171717] mb-8")}>
            Product photo editing <br />
            <span className="text-black/40">for ecommerce brands.</span>
          </h1>
          <p className="text-[18px] lg:text-[20px] text-[#4d4d4d] leading-relaxed max-w-2xl mx-auto font-normal">
            Reframe Visuals edits product photos for online brands. Human editors handle each image,
            and a QA reviewer checks every file before it ships.
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default AboutHero;
