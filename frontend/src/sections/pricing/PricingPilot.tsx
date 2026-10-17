import React from 'react';
import { motion } from 'framer-motion';
import { Check, ArrowRight, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cx, layout, tokens, typography } from '../../utils/theme';
import { Button } from '../../components/ui/button';

const PricingPilot: React.FC = () => {
  const navigate = useNavigate();

  const criteria = [
    { title: 'Manual Edge Precision', desc: '100% human-edited Pen Tool vector paths with clean mask borders.' },
    { title: 'Pantone Color Accuracy', desc: 'Verified color balance matching exact reference colorways or hex codes.' },
    { title: 'Non-Destructive Layered Files', desc: 'Fully separated subject, drop/cast shadows, and transparent backgrounds.' },
    { title: 'Lead QA Validation', desc: 'Pre-delivery inspection by a Senior Editor to guarantee catalog consistency.' },
  ];

  return (
    <section className="px-6 lg:px-12 py-16 bg-white border-t border-black/[0.12] relative overflow-hidden">
      <div className={cx(layout.compactShell, 'relative z-10')}>
        <div className={cx('max-w-4xl mx-auto rounded-3xl p-8 lg:p-12 flex flex-col md:flex-row gap-8 lg:gap-12 items-stretch', tokens.surfaceMuted, 'shadow-[0_16px_50px_rgba(0,0,0,0.08)]')}>
          
          {/* Left Block: The Offer */}
          <div className="flex-1 flex flex-col justify-between">
            <div>
              <h2 className="text-[28px] lg:text-[36px] font-bold text-[var(--color-text-primary)] tracking-tight leading-[1.1] mb-4">
                Paid Starter<br />
                <span className="text-black/45">Test Batch.</span>
              </h2>
              <p className="text-[15px] sm:text-[16px] text-[var(--color-text-secondary)] leading-relaxed mb-6">
                A controlled test batch lets you verify edit quality and turnaround before committing to a full catalog order.
              </p>
            </div>

            <div className="border-t border-black/[0.12] pt-6 mt-6">
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-[36px] font-black text-[var(--color-text-primary)] tracking-tight">$19</span>
                <span className="text-[14px] text-black/45 font-medium">/ 15 standard images</span>
              </div>
              <Button
                onClick={() => navigate('/free-trial?type=pilot')}
                className="group min-h-12 w-full gap-3 px-6 font-bold shadow-md md:w-auto"
              >
                <span>Start Starter Test Batch</span>
                <ArrowRight size={14} className="transition-transform duration-300 group-hover:-rotate-45" />
              </Button>
            </div>
          </div>

          {/* Right Block: Success Criteria Checklist */}
          <div className={cx('flex-1 p-6 lg:p-8 flex flex-col justify-center', tokens.surfaceCardSoft)}>
            <h3 className="text-[12px] font-black uppercase tracking-wider text-black/45 mb-6">
              Defined Success Criteria
            </h3>
            <div className="space-y-5">
              {criteria.map((item) => (
                <div key={item.title} className="flex gap-4">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-50 flex items-center justify-center border border-green-500/10">
                    <Check size={13} className="text-green-600 font-bold" />
                  </div>
                  <div>
                    <h4 className="text-[13px] font-bold text-[var(--color-text-primary)] leading-none mb-1">
                      {item.title}
                    </h4>
                    <p className="text-[12px] text-black/55 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default PricingPilot;
