import { motion } from 'framer-motion';
import { cx, layout, tokens, typography } from '../../utils/theme';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const PortfolioAbout = () => {
  return (
    <section className="px-5 sm:px-6 lg:px-12 py-16 sm:py-24 bg-white relative overflow-hidden border-t border-black/[0.18]">
      <div className={cx(layout.compactShell, "relative z-10")}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className={cx(typography.vercelSection, "text-[var(--color-text-primary)] mb-6 tracking-tight")}>
              Built by post-production specialists who got tired of inconsistent output.
            </h2>
            <div className="space-y-4 text-[16px] sm:text-[17px] text-black/70 leading-relaxed font-normal mb-8">
              <p>
                Reframe Visuals was built by a team of post-production specialists who spent years editing for e-commerce brands and grew frustrated watching great products get overlooked because of inconsistent, rushed imagery.
              </p>
              <p>
                Every service we offer is handled by experienced editors who have worked through thousands of commercial product images. We don't automate what requires a human eye, ensuring your images leave us ready for any marketplace.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <a
                href="/free-trial"
                className="inline-flex items-center justify-center rounded-full bg-black text-white text-[15px] font-semibold px-8 py-3.5 hover:bg-black/85 transition-colors"
              >
                Try 3 images free
              </a>
              <a
                href="/services"
                className="inline-flex items-center justify-center rounded-full border border-black/20 text-[15px] font-medium px-8 py-3.5 text-black/80 hover:border-black/40 transition-colors"
              >
                View all services & pricing
              </a>
            </div>

            <Link 
              to="/about"
              className="group inline-flex items-center gap-2 text-[15px] font-bold text-black"
            >
              <span className="relative">
                Read our full story
                <span className={tokens.interactiveUnderline} />
              </span>
              <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className={cx(
              "p-6 sm:p-8 transition-all duration-500 bg-[var(--color-text-primary)] flex flex-col text-white",
              tokens.radiusCard
            )}
          >
            <h3 className="text-[20px] sm:text-[24px] font-heading font-bold tracking-tight leading-snug mb-6">
              What brands can rely on, every order.
            </h3>
            <div className="grid grid-cols-1 gap-4">
              <div className="rounded-xl border border-white/15 bg-white/5 px-5 py-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/60 mb-1">Turnaround</p>
                <p className="text-[16px] font-bold text-white">24-48 hour standard turnaround</p>
              </div>
              <div className="rounded-xl border border-white/15 bg-white/5 px-5 py-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/60 mb-1">Revisions</p>
                <p className="text-[16px] font-bold text-white">Unlimited revisions on every order</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default PortfolioAbout;
