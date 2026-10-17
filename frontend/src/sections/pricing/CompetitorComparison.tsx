import React from 'react';
import { motion } from 'framer-motion';
import { Check, X, AlertTriangle } from 'lucide-react';
import { cx, layout, typography } from '../../utils/theme';

interface CellData {
  text: string;
  status: 'success' | 'warning' | 'danger';
}

interface ComparisonRow {
  feature: string;
  ourModel: string;
  traditionalAgencies: CellData;
  enterpriseStudios: CellData;
  automatedAI: CellData;
}

const StatusIcon = ({ status }: { status: 'success' | 'warning' | 'danger' }) => {
  if (status === 'success') return <Check size={14} strokeWidth={2.5} className="text-emerald-500 shrink-0 mt-[2px]" />;
  if (status === 'warning') return <AlertTriangle size={14} strokeWidth={2.5} className="text-amber-400 shrink-0 mt-[2px]" />;
  return <X size={14} strokeWidth={2.5} className="text-rose-400 shrink-0 mt-[2px]" />;
};

const comparisonData: ComparisonRow[] = [
  {
    feature: 'Edge Precision',
    ourModel: '100% manual Pen Tool tracing for clean, pixel-perfect paths.',
    traditionalAgencies: { text: 'Highly variable; often relies on quick magic-wand.', status: 'warning' },
    enterpriseStudios: { text: 'Consistent quality, but premium-priced complexity tiers.', status: 'success' },
    automatedAI: { text: 'Severe masking errors on laces, hair, and glass.', status: 'danger' },
  },
  {
    feature: 'Turnaround SLA',
    ourModel: 'Guaranteed 12h–72h turnaround chosen directly at checkout.',
    traditionalAgencies: { text: 'Unpredictable schedules managed via email chains.', status: 'danger' },
    enterpriseStudios: { text: '24h standard; rush orders carry heavy surcharges.', status: 'warning' },
    automatedAI: { text: 'Near-instant speed but requires manual clean-up afterwards.', status: 'success' },
  },
  {
    feature: 'Revisions Loop',
    ourModel: 'Free unlimited revisions within 14 days via on-image markup.',
    traditionalAgencies: { text: 'Email-based requests leading to delays and confusion.', status: 'danger' },
    enterpriseStudios: { text: 'Restricted rounds or extra fees per revision.', status: 'warning' },
    automatedAI: { text: 'Self-serve only; requires manual edit in Photoshop.', status: 'danger' },
  },
  {
    feature: 'Pricing & Commits',
    ourModel: 'Per-image rates from $0.30. Pay-as-you-go, zero commits.',
    traditionalAgencies: { text: 'No instant pricing; hours of waiting for custom quotes.', status: 'warning' },
    enterpriseStudios: { text: 'Monthly commitments or high volume minimums required.', status: 'danger' },
    automatedAI: { text: 'Cheap credit tiers but high internal clean-up labor cost.', status: 'success' },
  },
  {
    feature: 'Support',
    ourModel: '24/7 live chat coordination and dedicated customer support.',
    traditionalAgencies: { text: 'Offshore barriers with timezone and language delays.', status: 'danger' },
    enterpriseStudios: { text: 'Standard ticketing with slow and generic responses.', status: 'warning' },
    automatedAI: { text: 'None; self-serve help center docs only.', status: 'danger' },
  },
];

const CompetitorComparison: React.FC = () => {
  return (
    <section className="px-6 lg:px-12 pt-10 pb-10 sm:pt-12 sm:pb-12 lg:pt-16 lg:pb-16 bg-white">
      <div className={cx(layout.compactShell)}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-2xl mx-auto mb-12"
        >
          <div className={cx(typography.vercelMono, 'mb-4 text-black/40')}>
            Why Us?
          </div>
          <h2 className={cx(typography.vercelSection, typography.sectionTitleInk, 'mb-5')}>
            How we compare
          </h2>
          <p className="text-[16px] text-black/50 leading-relaxed">
            Reframe versus offshore agencies, enterprise studios, and automated AI tools.
          </p>
        </motion.div>

        {/* Desktop */}
        <div className="hidden md:block w-full rounded-2xl border border-black/[0.18] overflow-hidden shadow-[0_8px_24px_rgba(0,0,0,0.09)]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-black/[0.18]">
                <th className="py-4 px-6 text-[12px] font-semibold font-mono uppercase tracking-widest text-black/40 w-[18%] bg-[var(--color-bg-secondary)]" />
                <th className="py-4 px-6 text-[12px] font-semibold font-mono uppercase tracking-widest text-white w-[24%] bg-[var(--color-text-primary)] border-x border-white/10">
                  Reframe Visuals
                </th>
                <th className="py-4 px-6 text-[12px] font-semibold font-mono uppercase tracking-widest text-black/40 w-[19%] bg-[var(--color-bg-secondary)]">Offshore Agencies</th>
                <th className="py-4 px-6 text-[12px] font-semibold font-mono uppercase tracking-widest text-black/40 w-[19%] bg-[var(--color-bg-secondary)] border-x border-black/[0.14]">Enterprise Studios</th>
                <th className="py-4 px-6 text-[12px] font-semibold font-mono uppercase tracking-widest text-black/40 w-[19%] bg-[var(--color-bg-secondary)]">Remove.bg / Auto-AI</th>
              </tr>
            </thead>
            <tbody>
              {comparisonData.map((row, i) => {
                const isEven = i % 2 === 0;
                const rowBg = isEven ? 'bg-white' : 'bg-[var(--color-bg-secondary)]/60';
                const isLast = i === comparisonData.length - 1;
                return (
                  <tr key={row.feature} className={isLast ? '' : 'border-b border-black/[0.14]'}>
                    <td className={cx('py-6 px-6 text-[16px] font-semibold text-[var(--color-text-primary)] align-top', rowBg)}>
                      {row.feature}
                    </td>
                    <td className="py-6 px-6 text-[16px] text-white/90 leading-relaxed align-top bg-[var(--color-text-primary)] border-x border-white/[0.08]">
                      <div className="flex gap-2.5 items-start">
                        <Check size={15} strokeWidth={2.5} className="text-emerald-400 shrink-0 mt-[2px]" />
                        <span>{row.ourModel}</span>
                      </div>
                    </td>
                    <td className={cx('py-6 px-6 text-[15px] text-black/75 leading-relaxed align-top', rowBg)}>
                      <div className="flex gap-2.5 items-start">
                        <StatusIcon status={row.traditionalAgencies.status} />
                        <span>{row.traditionalAgencies.text}</span>
                      </div>
                    </td>
                    <td className={cx('py-6 px-6 text-[15px] text-black/75 leading-relaxed align-top border-x border-black/[0.14]', rowBg)}>
                      <div className="flex gap-2.5 items-start">
                        <StatusIcon status={row.enterpriseStudios.status} />
                        <span>{row.enterpriseStudios.text}</span>
                      </div>
                    </td>
                    <td className={cx('py-6 px-6 text-[15px] text-black/75 leading-relaxed align-top', rowBg)}>
                      <div className="flex gap-2.5 items-start">
                        <StatusIcon status={row.automatedAI.status} />
                        <span>{row.automatedAI.text}</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile */}
        <div className="md:hidden rounded-2xl border border-black/[0.18] overflow-hidden shadow-[0_8px_24px_rgba(0,0,0,0.09)]">
          {comparisonData.map((row, i) => (
            <div key={row.feature} className={cx('p-4', i % 2 !== 0 && 'bg-[var(--color-bg-secondary)]/60', i < comparisonData.length - 1 && 'border-b border-black/[0.14]')}>
              <p className="text-[12px] font-bold font-mono uppercase tracking-widest text-black/45 mb-2.5">{row.feature}</p>

              <div className="rounded-xl bg-[var(--color-text-primary)] px-3.5 py-3 mb-2.5 flex gap-2 items-start">
                <Check size={14} strokeWidth={2.5} className="text-emerald-400 shrink-0 mt-[2px]" />
                <p className="text-[14px] text-white/90 leading-relaxed">{row.ourModel}</p>
              </div>

              <div className="space-y-2.5">
                {[
                  { label: 'Offshore Agencies', data: row.traditionalAgencies },
                  { label: 'Enterprise Studios', data: row.enterpriseStudios },
                  { label: 'Remove.bg / Auto-AI', data: row.automatedAI },
                ].map(({ label, data }) => (
                  <div key={label} className="flex gap-2.5 items-start">
                    <StatusIcon status={data.status} />
                    <div>
                      <span className="text-[12px] font-bold font-mono uppercase tracking-widest text-black/45 block mb-0.5">{label}</span>
                      <p className="text-[14px] text-black/70 leading-relaxed">{data.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CompetitorComparison;
