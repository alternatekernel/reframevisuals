import { motion } from 'framer-motion';
import { cx, layout, tokens, typography } from '../../utils/theme';

const AboutExpertise = () => {
  return (
    <section className="px-5 sm:px-6 lg:px-12 pt-6 sm:pt-8 lg:pt-10 pb-8 sm:pb-10 lg:pb-14 bg-white overflow-hidden border-b border-[#f5f5f5]">
      <div className={cx(layout.compactShell, 'relative z-10')}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-4xl mx-auto mb-7 sm:mb-10 lg:mb-16"
        >
          <h2 className={cx(typography.vercelSection, 'text-[var(--color-text-primary)] mb-8')}>
            Our team <br />
            <span className="text-black/40">focused on delivery, accountable on quality.</span>
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className={cx(
            'max-w-5xl mx-auto p-5 sm:p-7 lg:p-10 bg-white border border-black/10',
            tokens.radiusCard
          )}
          style={{ boxShadow: tokens.shadowStandard }}
        >
          <p className="text-[16px] text-black/80 leading-[1.65] sm:leading-relaxed font-normal">
            Reframe Visuals is run by a focused team of editors, quality reviewers, and client coordinators.
            We don&apos;t list names because we believe our work should speak, but every project has a dedicated
            editor and a QA reviewer before delivery.
          </p>
          <p className="mt-4 text-[16px] text-black/80 leading-[1.65] sm:leading-relaxed font-normal">
            When you contact us, you&apos;ll hear back within 30 minutes. When something isn&apos;t right, we fix it:
            no forms, no back-and-forth, just a direct reply.
          </p>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-2xl border border-black/10 bg-white px-4 py-3 shadow-sm">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-black/50">Response SLA</p>
              <p className="text-[16px] font-bold text-[var(--color-text-primary)]">Within 30 minutes</p>
            </div>
            <div className="rounded-2xl border border-black/10 bg-white px-4 py-3 shadow-sm">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-black/50">Workflow</p>
              <p className="text-[16px] font-bold text-[var(--color-text-primary)]">Dedicated editor + QA reviewer</p>
            </div>
            <div className="rounded-2xl border border-black/10 bg-white px-4 py-3 shadow-sm">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-black/50">Revision Process</p>
              <p className="text-[16px] font-bold text-[var(--color-text-primary)]">Direct reply, fast resolution</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default AboutExpertise;
