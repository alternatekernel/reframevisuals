import React from 'react';
import { motion } from 'framer-motion';
import { Check, Image as ImageIcon, Zap } from 'lucide-react';
import { tokens } from '../../utils/theme';

interface FreeTrialInfoProps {
  content: any;
}

const PERKS = [
  { icon: ImageIcon, label: '3 free image edits' },
  { icon: Zap,       label: '24-hour turnaround' },
  { icon: Check,     label: 'Pay after review' },
];

const FreeTrialInfo: React.FC<FreeTrialInfoProps> = ({ content }) => {
  return (
    <div className="flex flex-col justify-center w-full">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 p-1.5 bg-[#fafafa] rounded-lg border border-black/5" style={{ boxShadow: tokens.shadowStandard }}>
            <img src="/logo.svg" alt="Reframe Free Trial Icon" className="w-full h-full object-contain" />
          </div>
          <p className="text-[9px] font-black tracking-[0.4em] text-[#666666] uppercase">System • Trial</p>
        </div>

        <h1
          className="text-[32px] lg:text-[56px] font-heading font-black leading-[0.95] mb-6 tracking-[-0.07em] text-[#171717]"
        >
          {content.heading || 'Start Trial'}
        </h1>
        <p className="text-[16px] lg:text-[18px] mb-8 leading-relaxed text-[#666666] font-medium max-w-md">
          {content.description ||
            'Get 3 free image edits. No credit card required. Review your results before you decide.'}
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-3"
      >
        {PERKS.map(({ icon: Icon, label }) => (
          <div key={label} className="flex items-center gap-4 p-3.5 bg-[#fafafa] rounded-xl border border-black/5">
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shrink-0 border border-black/5 shadow-sm">
              <Icon size={14} className="text-[#171717]" />
            </div>
            <span className="text-[14px] font-bold text-[#171717]">
              {label}
            </span>
          </div>
        ))}
      </motion.div>
    </div>
  );
};

export default FreeTrialInfo;
