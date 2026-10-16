import { motion } from 'framer-motion';
import { cx, layout, tokens, typography } from '../../utils/theme';

const AboutPhilosophy = () => {
  return (
    <section className="px-5 sm:px-6 lg:px-12 pt-12 pb-14 sm:pt-14 sm:pb-16 lg:pt-20 lg:pb-24 bg-white relative overflow-hidden border-b border-[#f5f5f5]">
      {/* Background Watermark */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 opacity-[0.02] pointer-events-none">
        <img src="/logo.svg" alt="Reframe Philosophy Background Icon" className="w-[500px] h-[500px] -translate-x-1/2" />
      </div>

      <div className={cx(layout.compactShell, "relative z-10")}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-4xl mx-auto mb-7 sm:mb-10 lg:mb-20"
        >
          <h2 className={cx(typography.vercelSection, "text-[var(--color-text-primary)] mb-8")}>
            Precision editing, built for e-commerce brands <br />
            <span className="text-black/40">that can't afford mistakes.</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:gap-8 max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className={cx(
              "p-5 sm:p-7 lg:p-10 transition-all duration-500 bg-white flex flex-col border border-black/10",
              tokens.radiusCard
            )}
            style={{ boxShadow: tokens.shadowStandard }}
          >
            <h3 className="text-[24px] sm:text-[30px] lg:text-[36px] font-heading font-bold tracking-[-0.04em] lg:tracking-[-0.05em] text-[var(--color-text-primary)] leading-[1.0] mb-5 sm:mb-6">
              Built by post-production specialists who got tired of inconsistent output.
            </h3>
            <div className="space-y-4 text-[16px] text-black/80 leading-[1.6] sm:leading-relaxed font-normal">
              <p>
                Reframe Visuals was built by a team of post-production specialists who spent years editing for e-commerce brands and grew frustrated watching great products get overlooked because of inconsistent, rushed imagery.
              </p>
              <p>
                We launched with one goal: give online sellers access to editing that&apos;s fast, precise, and consistent without the unpredictability of freelancers or the cost of in-house teams.
              </p>
              <p>
                Every service we offer (including background removal, ghost mannequin, jewelry retouch, clipping path, and color correction) is handled by experienced editors who have worked through thousands of commercial product images.
              </p>
              <p>
                We don&apos;t automate what requires a human eye, and we don&apos;t promise luxury output at commodity prices.
              </p>
              <p>
                What we do promise: clean work, clear communication, and a straightforward revision process. Your images leave us ready for Amazon, any marketplace, or your storefront, or we fix them until they are.
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className={cx(
              "p-5 sm:p-7 lg:p-10 transition-all duration-500 bg-[var(--color-text-primary)] flex flex-col text-white",
              tokens.radiusCard
            )}
          >
            <h3 className="text-[24px] sm:text-[30px] lg:text-[34px] font-heading font-bold tracking-[-0.04em] leading-[1.0] mb-6">
              What brands can rely on, every order.
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-xl border border-white/15 bg-white/5 px-4 py-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/60 mb-2">Turnaround</p>
                <p className="text-[18px] font-bold text-white">24-48 hour standard turnaround</p>
              </div>
              <div className="rounded-xl border border-white/15 bg-white/5 px-4 py-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/60 mb-2">Revisions</p>
                <p className="text-[18px] font-bold text-white">Unlimited revisions on every order</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AboutPhilosophy;
