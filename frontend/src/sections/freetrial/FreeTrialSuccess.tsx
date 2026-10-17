import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ButtonWithIcon } from '../../components/ui/button-with-icon';
import { cx, tokens, typography } from '../../utils/theme';

interface FreeTrialSuccessProps {
  onBack: () => void;
}

const FreeTrialSuccess: React.FC<FreeTrialSuccessProps> = ({ onBack }) => {
  const navigate = useNavigate();
  const isAuthenticated = !!localStorage.getItem('portal_token');

  return (
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
            Trial <span className="text-black/40">submitted.</span>
          </h1>

          <p className="text-[15px] sm:text-[16px] text-black/60 max-w-md mx-auto leading-relaxed mb-4">
            Your 3 sample images are in our queue. Expect the edited files back within 24 hours.
          </p>
          <p className="text-[14px] text-black/45 max-w-md mx-auto leading-relaxed mb-10">
            {isAuthenticated
              ? 'Track updates from your dashboard. We will also email you with details.'
              : 'Create an account to track updates from your dashboard. Otherwise, we will email you with details.'}
          </p>

          <div className="grid w-full max-w-md grid-cols-1 gap-3 sm:grid-cols-2">
            <ButtonWithIcon
              label={isAuthenticated ? 'Go to Dashboard' : 'Create account to track request'}
              variant="default"
              className="!w-full !h-12 !rounded-full"
              animated={false}
              onClick={() => navigate(isAuthenticated ? '/dashboard' : '/signup')}
            />
            <ButtonWithIcon
              label="Return Home"
              variant="outline"
              className="!w-full !h-12 !rounded-full"
              animated={false}
              onClick={onBack}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FreeTrialSuccess;
