import { motion } from 'framer-motion';
import { cx, layout, tokens, typography } from '../../utils/theme';
import { Globe, Users, Database, Zap } from 'lucide-react';

const SCALE_ITEMS = [
  {
    label: 'Pricing',
    value: '$0.39',
    unit: 'Per Image',
    desc: 'Clipping path and background removal start at $0.39. No subscription, no minimum order.',
    icon: Database
  },
  {
    label: 'Turnaround',
    value: '12-72h',
    unit: 'Delivery Window',
    desc: 'Pick 12-hour express, 24-hour standard, 48-hour, or 72-hour delivery per order.',
    icon: Zap
  },
  {
    label: 'Quality Control',
    value: '100%',
    unit: 'Manual QA',
    desc: 'A senior editor reviews every image against a QA checklist before delivery.',
    icon: Users
  },
  {
    label: 'Risk-Free Start',
    value: '3',
    unit: 'Free Sample Edits',
    desc: 'Send 3 images and judge the quality yourself before placing a paid order.',
    icon: Globe
  }
];

const AboutScale = () => {
  return (
    <section className="px-6 lg:px-12 pt-16 pb-24 bg-[#fafafa] overflow-hidden border-b border-[#f5f5f5]">
      <div className={cx(layout.compactShell, "relative z-10")}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-4xl mx-auto mb-20"
        >
          <h2 className={cx(typography.vercelSection, "text-[#171717] mb-8")}>
            How we <span className="text-black/40">work.</span>
          </h2>
          <p className="text-[18px] text-[#4d4d4d] leading-relaxed max-w-2xl mx-auto font-normal">
            Per-image pricing, a turnaround window you choose, and a manual QA pass on every file before it reaches you.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
          {SCALE_ITEMS.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className={cx(
                "p-8 transition-all duration-500 bg-white flex flex-col",
                tokens.radiusCard
              )}
              style={{ boxShadow: tokens.shadowStandard }}
            >
              <div className="w-10 h-10 rounded-lg bg-[#fafafa] flex items-center justify-center mb-6 border border-black/5">
                <item.icon size={20} className="text-[#171717]" />
              </div>
              <div className="mb-4">
                <span className="text-[32px] font-heading font-black tracking-[-0.05em] text-[#171717]">
                  {item.value}
                </span>
                <span className="ml-2 text-[12px] font-heading font-black text-black/40 uppercase tracking-widest">
                  {item.unit}
                </span>
              </div>
              <p className={cx(typography.vercelMono, "mb-4 text-black/60 uppercase tracking-widest text-[11px]")}>{item.label}</p>
              <p className="text-[13px] text-[#333] font-normal leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AboutScale;
