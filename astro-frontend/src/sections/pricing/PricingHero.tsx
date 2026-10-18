import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { cx, layout, typography } from '../../utils/theme';
import { ButtonWithIcon } from '../../components/ui/button-with-icon';
import { Button } from '../../components/ui/button';

const PricingHero = () => {
  const navigate = useNavigate();

  return (
    <section data-section="hero" className="relative pt-4 pb-20 overflow-hidden bg-white border-b border-[#ebebeb]">
      <div className={cx(layout.compactShell, "px-6 lg:px-12 relative z-10")}>
        <div className="pt-4 pb-20 px-8 lg:px-20 text-center relative">
          {/* Vercel-style workflow badge */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center mb-6"
          >
            <div className="px-3 py-1 bg-[#ebf5ff] text-[#0068d6] rounded-full text-[12px] font-semibold tracking-wide">
              Pricing & Infrastructure
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-10"
          >
            <h1 className={cx(typography.vercelHero, typography.sectionTitleInk, "max-w-5xl mx-auto")}>
              Pricing that scales with your <br className="hidden lg:block" />
              <span className="text-[var(--color-text-muted)]">creative vision.</span>
            </h1>

            <p className="text-[20px] lg:text-[24px] text-[var(--color-text-secondary)] max-w-2xl mx-auto leading-[1.6] font-normal">
              Simple, transparent pricing for teams of all sizes. 
              No hidden fees. No complexity-based surcharges. Built for dependable daily output.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <ButtonWithIcon 
                onClick={() => navigate('/free-trial')}
                variant="default"
                label="Get Pricing Breakdown"
                className="!w-full sm:!w-auto shadow-sm"
                animated={false}
              />
              <Button
                onClick={() => navigate('/services')}
                variant="white"
                className="h-12 w-full rounded-full px-6 text-sm font-medium sm:w-auto"
              >
                Explore Services
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};


export default PricingHero;

