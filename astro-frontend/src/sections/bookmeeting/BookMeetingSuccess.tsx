import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { ButtonWithIcon } from '../../components/ui/button-with-icon';
import { cx, tokens, typography } from '../../utils/theme';

interface BookMeetingSuccessProps {
  onBack: () => void;
}

const BookMeetingSuccess: React.FC<BookMeetingSuccessProps> = ({ onBack }) => (
  <div className="min-h-screen bg-[var(--color-bg-secondary)] relative flex items-start justify-center overflow-hidden py-12">
    <div className="w-full h-auto lg:h-[62vh] relative z-10 flex flex-col items-center px-4 lg:px-8 pt-8 lg:pt-[4vh]">
      <div className={cx("w-full h-full max-w-[800px] bg-white border border-black/[0.18] flex flex-col items-center justify-center p-8 lg:p-12 text-center overflow-hidden", tokens.radiusCard)}>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 20 }}
          className="w-16 h-16 mb-8 rounded-full flex items-center justify-center bg-[#F0FDF4] border border-[#BBF7D0]"
        >
          <Check size={24} className="text-[#16A34A]" />
        </motion.div>
        
        <h1 className={cx(typography.vercelSection, "text-[var(--color-text-primary)] mb-6")}>
           Meeting <span className="text-black/40">confirmed.</span>
        </h1>
        
        <p className="text-[15px] sm:text-[16px] text-black/60 max-w-md mx-auto leading-relaxed mb-10">
           We'll confirm your meeting time by email within 24 hours.
        </p>

        <div className="w-full max-w-xs">
          <ButtonWithIcon 
            label="Return to Home"
            variant="default"
            className="!w-full !h-12 !rounded-full"
            animated={false}
            onClick={onBack}
          />
        </div>
      </div>
    </div>
  </div>
);

export default BookMeetingSuccess;
