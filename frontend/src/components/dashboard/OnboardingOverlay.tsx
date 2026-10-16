import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, CheckCircle, FileImage, Zap } from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';
import { dashboardPrimaryButtonClass, dashboardSecondaryButtonClass } from './dashboard-primitives';

const ONBOARDING_KEY = 'reframe_onboarding_done';

interface Props {
  onDismiss: () => void;
}

const steps = [
  {
    icon: Zap,
    title: 'Welcome to Reframe Visuals',
    body: 'We edit product images for e-commerce brands — background removal, retouching, shadow creation, and more. Most orders are turned around within 48 hours.',
    cta: 'Get started',
  },
  {
    icon: FileImage,
    title: 'Place your first order in 4 steps',
    body: 'Tell us what you need, upload your files, set output specs (format, size, background), then review and submit. Pricing arrives in your inbox within 30 minutes.',
    cta: 'Place an order now',
    ctaAction: 'order',
  },
  {
    icon: CheckCircle,
    title: 'Track, approve, and download',
    body: 'Watch your order move through production in real time. When assets are ready, inspect each image, request revisions if needed, then download the full set as a ZIP.',
    cta: 'Go to my dashboard',
    ctaAction: 'done',
  },
];

const OnboardingOverlay = ({ onDismiss }: Props) => {
  const [step, setStep] = useState(0);
  const { setCurrentView } = useDashboard();
  const current = steps[step];

  const finish = () => {
    localStorage.setItem(ONBOARDING_KEY, '1');
    onDismiss();
  };

  const handleCta = () => {
    if (current.ctaAction === 'order') {
      finish();
      setCurrentView('orderFlow');
      return;
    }
    if (current.ctaAction === 'done' || step === steps.length - 1) {
      finish();
      return;
    }
    setStep(s => s + 1);
  };

  const Icon = current.icon;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl"
      >
        {/* Step dots */}
        <div className="flex items-center gap-1.5 mb-8">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? 'w-6 bg-brand-ink' : i < step ? 'w-3 bg-brand-ink/40' : 'w-3 bg-gray-200'}`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.2 }}
          >
            <div className="w-14 h-14 rounded-2xl bg-brand-ink flex items-center justify-center text-white mb-6">
              <Icon size={26} fill="currentColor" />
            </div>
            <h2 className="text-[22px] font-bold text-text-primary tracking-tight mb-3">{current.title}</h2>
            <p className="text-[14px] text-text-secondary leading-relaxed">{current.body}</p>
          </motion.div>
        </AnimatePresence>

        <div className="mt-8 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={finish}
            className="text-[13px] text-text-secondary hover:text-text-primary transition-colors"
          >
            Skip
          </button>
          <div className="flex items-center gap-2">
            {step > 0 && (
              <button
                type="button"
                onClick={() => setStep(s => s - 1)}
                className={`${dashboardSecondaryButtonClass} px-4 py-2 text-[13px]`}
              >
                Back
              </button>
            )}
            <button
              type="button"
              onClick={handleCta}
              className={`${dashboardPrimaryButtonClass} flex items-center gap-2 px-5 py-2 text-[13px]`}
            >
              {current.cta}
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export { ONBOARDING_KEY };
export default OnboardingOverlay;
