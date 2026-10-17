import React from 'react';
import { motion } from 'framer-motion';
import { Clock, RotateCcw, ShieldCheck, HelpCircle } from 'lucide-react';
import { cx, layout, tokens, typography } from '../../utils/theme';

const PricingPolicies: React.FC = () => {
  const policies = [
    {
      icon: Clock,
      title: 'Turnaround SLAs',
      description: 'Choose from flexible delivery windows tailored to your catalog production speed:',
      items: [
        { label: 'Express (12h)', detail: 'Priority queue for urgent product launches.' },
        { label: 'Standard (24h)', detail: 'Recommended default for daily operations.' },
        { label: 'Relaxed (48h)', detail: 'Budget-friendly with consistent turnaround.' },
        { label: 'Economy (72h)', detail: 'Maximum savings for massive catalog batches.' },
      ],
    },
    {
      icon: RotateCcw,
      title: 'Revision Policy',
      description: 'Need a correction? Here\'s how revisions work:',
      items: [
        { label: '14-Day Request Window', detail: 'Request updates up to two weeks after image delivery.' },
        { label: 'Unlimited Rounds', detail: 'Our editors adjust masking, lighting, or color until it fits your guidelines.' },
        { label: 'Standard SLA Match', detail: 'Revisions are processed within your original order speed.' },
      ],
    },
    {
      icon: ShieldCheck,
      title: 'Refund Terms',
      description: 'If we can\'t deliver what was approved, you don\'t pay:',
      items: [
        { label: 'Quality Guarantee', detail: 'If we fail to meet the approved sample quality, we fix it immediately.' },
        { label: 'Full Batch Refund', detail: 'If corrections cannot resolve the issues, get a 100% refund on the batch.' },
        { label: 'Pre-Production Trial', detail: 'Start with 3 free sample edits to verify quality before any payment.' },
      ],
    },
  ];

  return (
    <section className="px-6 lg:px-12 py-20 bg-[var(--color-bg-secondary)] border-t border-[var(--color-border-light)] relative overflow-hidden">
      <div className={cx(layout.compactShell, 'relative z-10')}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <div className={cx(typography.vercelMono, 'mb-4 text-black/50')}>
            Operational Policies
          </div>
          <h2 className={cx(typography.vercelSection, typography.sectionTitleInk, 'mb-6')}>
            Turnaround, Revisions, <br className="hidden sm:inline" />
            <span className="text-black/45">and Refund Terms.</span>
          </h2>
          <p className="text-[16px] text-[var(--color-text-secondary)] leading-relaxed">
            How we handle delivery windows, revisions, and refunds.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {policies.map((policy, index) => {
            const Icon = policy.icon;
            return (
              <motion.div
                key={policy.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.4 }}
                className={cx('flex flex-col p-6', tokens.surfaceCard, tokens.motionInteractive, 'hover:shadow-[0_12px_40px_rgb(0,0,0,0.04)]')}
              >
                <div className="flex items-center gap-3 mb-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black text-white">
                    <Icon size={20} />
                  </div>
                  <h3 className="text-[18px] font-bold text-[var(--color-text-primary)] tracking-tight">{policy.title}</h3>
                </div>

                <p className="text-[14px] text-black/60 leading-relaxed mb-6 font-medium">
                  {policy.description}
                </p>

                <ul className="space-y-4 mt-auto">
                  {policy.items.map((item) => (
                    <li key={item.label} className="text-[12px] leading-relaxed border-t border-black/[0.12] pt-3 first:border-t-0 first:pt-0">
                      <p className="font-bold text-[var(--color-text-primary)]">{item.label}</p>
                      <p className="text-black/55 mt-0.5">{item.detail}</p>
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default PricingPolicies;
