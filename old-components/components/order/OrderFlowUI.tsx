import React, { useCallback, useImperativeHandle, useRef, useState } from 'react';
import { ChevronRight, Zap, Save, RotateCcw, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { OrderFlowData, OrderFlowStep } from './types';
import { useOrderSubmit } from './hooks/useOrderSubmit';
import RequirementsStep from './steps/RequirementsStep';
import FilesStep from './steps/FilesStep';
import SpecsStep from './steps/SpecsStep';
import ReviewStep from './steps/ReviewStep';
import { useDashboard } from '../../context/DashboardContext';
import { orderPrimaryButtonClass, orderSecondaryButtonClass } from './flow-controls';

export interface OrderFlowUIHandle {
  navigateTo: (step: OrderFlowStep) => void;
}

interface Props {
  orderFlowStep: OrderFlowStep;
  setOrderFlowStep: React.Dispatch<React.SetStateAction<OrderFlowStep>>;
  orderData: OrderFlowData;
  setOrderData: React.Dispatch<React.SetStateAction<OrderFlowData>>;
  guestId: string;
  isUsingTemplate?: boolean;
  draftKey?: string;
  hideBreadcrumb?: boolean;
  onCancel: () => void;
  onComplete: () => void;
}

const STEPS = [
  { id: 'requirements', label: 'What you need' },
  { id: 'files', label: 'Upload files' },
  { id: 'specs', label: 'Specs' },
  { id: 'review', label: 'Review' },
] as const;

const STEP_ORDER = ['requirements', 'files', 'specs', 'review'] as const;

const stepVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 24 : -24, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -24 : 24, opacity: 0 }),
};

const stepTransition = { duration: 0.22, ease: [0.0, 0, 0.2, 1] as any };

const DRAFT_KEY = 'reframe_order_draft';

const resetOrderData = (prev: OrderFlowData): OrderFlowData => ({
  projectName: '',
  instructions: '',
  selectedServices: [],
  outputFormat: 'jpg',
  turnaround: '24',
  files: [],
  supportFiles: [],
  sourceLinks: [],
  background: 'white',
  cropRatio: 'original',
  resizeWidth: '',
  resizeHeight: '',
  colorProfile: 'sRGB',
  resolutionDPI: '72',
  layering: 'Flat',
  namingPattern: '',
  marginPercent: '0',
  deliveryVector: 'Dashboard',
  sourceTemplateId: prev.sourceTemplateId,
  customFilesLink: '',
  customFilesCount: undefined,
  idempotencyKey: (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : 'idemp-' + Math.random().toString(36).substring(2, 15),
  email: '',
  maintainAspectRatio: true,
});

const OrderFlowUI = React.forwardRef<OrderFlowUIHandle, Props>(function OrderFlowUI(props, ref) {
  const {
    orderFlowStep,
    setOrderFlowStep,
    orderData,
    setOrderData,
    guestId,
    isUsingTemplate,
    draftKey = DRAFT_KEY,
    hideBreadcrumb = false,
    onCancel,
    onComplete,
  } = props;
  const { isTemplateMode, saveTemplate, setCurrentView, setIsTemplateMode } = useDashboard();
  const directionRef = useRef(1);
  const prevStepRef = useRef(orderFlowStep);

  const navigateTo = useCallback((next: OrderFlowStep) => {
    const prevIdx = STEP_ORDER.indexOf(prevStepRef.current as any);
    const nextIdx = STEP_ORDER.indexOf(next as any);
    directionRef.current = nextIdx >= prevIdx ? 1 : -1;
    prevStepRef.current = next;
    setOrderFlowStep(next);
  }, [setOrderFlowStep]);

  useImperativeHandle(ref, () => ({ navigateTo }), [navigateTo]);

  const { handleSubmit, isSubmitting, error } = useOrderSubmit({
    orderData,
    guestId,
    draftKey,
    setOrderFlowStep,
    onComplete,
  });

  const [showEmailGate, setShowEmailGate] = useState(false);
  const [emailError, setEmailError] = useState('');

  const handleSubmitWithEmailCheck = () => {
    const token = localStorage.getItem('portal_token');
    const isGuest = !token || token === 'null';
    if (isGuest && !orderData.email.trim()) {
      setShowEmailGate(true);
      return;
    }
    handleSubmit();
  };

  const handleGuestEmailConfirm = async () => {
    const email = orderData.email.trim();
    if (!email || !email.includes('@')) {
      setEmailError('Please enter a valid email address.');
      return;
    }
    setEmailError('');
    const success = await handleSubmit();
    if (success) setShowEmailGate(false);
  };

  const handleSaveAsTemplate = () => {
    saveTemplate({
      id: orderData.sourceTemplateId,
      name: orderData.projectName || 'Unnamed Template',
      services: orderData.selectedServices,
      specs: {
        format: orderData.outputFormat,
        background: orderData.background,
        sizing: orderData.resizeWidth ? `${orderData.resizeWidth}x${orderData.resizeHeight || 'auto'}px` : 'Original',
        turnaround: orderData.turnaround,
        cropRatio: orderData.cropRatio,
        colorProfile: orderData.colorProfile,
        resolutionDPI: orderData.resolutionDPI,
        layering: orderData.layering as 'Flat' | 'Layered',
        deliveryVector: orderData.deliveryVector,
        resizeWidth: orderData.resizeWidth,
        resizeHeight: orderData.resizeHeight,
        maintainAspectRatio: orderData.maintainAspectRatio,
        customBgColor: orderData.customBgColor,
        customBgFileName: orderData.customBgFile?.name || orderData.customBgImage?.name,
      },
      instructions: orderData.instructions
    });
    localStorage.removeItem(draftKey);
    setIsTemplateMode(false);
    setCurrentView('templates');
  };

  const handleSaveDraft = () => {
    const { files, supportFiles, customBgFile, customBgImage, ...draft } = orderData;
    localStorage.setItem(draftKey, JSON.stringify(draft));
  };

  const handleResetOrder = () => {
    if (!window.confirm('Reset this order and clear the saved draft?')) return;
    localStorage.removeItem(draftKey);
    setOrderData(prev => resetOrderData(prev));
    setOrderFlowStep('requirements');
  };

  if (showEmailGate) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center space-y-5 px-2">
        <div className="w-14 h-14 rounded-full bg-black/[0.05] flex items-center justify-center">
          <Mail size={22} className="text-[var(--color-text-primary)]" />
        </div>
        <div className="space-y-1.5">
          <h3 className="text-body-lg font-heading font-black tracking-tight text-[var(--color-text-primary)]">Where should we send your quote?</h3>
          <p className="text-caption text-[var(--color-text-secondary)] max-w-[300px] mx-auto leading-relaxed">
            Enter your email and we'll send a pricing breakdown within 30 minutes.
          </p>
        </div>
        <div className="w-full max-w-sm space-y-2.5">
          {emailError && (
            <p className="text-caption text-red-500 font-medium">{emailError}</p>
          )}
          {error && (
            <p className="text-caption text-red-500 font-medium">{error}</p>
          )}
          <input
            type="email"
            placeholder="your@email.com"
            value={orderData.email}
            autoFocus
            onChange={(e) => { setEmailError(''); setOrderData(prev => ({ ...prev, email: e.target.value })); }}
            onKeyDown={(e) => { if (e.key === 'Enter') handleGuestEmailConfirm(); }}
            className="w-full h-11 px-4 bg-white border border-[var(--color-border-subtle)] rounded-xl text-caption text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-text-primary)] focus:ring-2 focus:ring-black/[0.06] transition-all placeholder-[var(--color-text-muted)]"
          />
          <button
            onClick={handleGuestEmailConfirm}
            disabled={isSubmitting}
            className={`${orderPrimaryButtonClass} w-full h-11 rounded-xl shadow-lg shadow-black/10`}
          >
            {isSubmitting ? 'Placing Order...' : 'Place My Order'}
          </button>
          <button
            onClick={() => { setShowEmailGate(false); setEmailError(''); }}
            className="block w-full text-caption text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors"
          >
            ← Back to review
          </button>
          <p className="text-caption text-[var(--color-text-muted)]">No marketing emails. Quote delivery only.</p>
        </div>
      </div>
    );
  }

  if (orderFlowStep === 'complete') {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-12"
      >
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[var(--color-text-primary)] flex items-center justify-center text-white shadow-xl relative">
          <Zap size={32} fill="currentColor" />
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1.5, opacity: 0 }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute inset-0 bg-black/20 rounded-full"
          />
        </div>
        <h3 className="text-heading-4 font-heading font-black text-[var(--color-text-primary)] mb-3 tracking-tight">
          {isTemplateMode ? 'Template Registered' : 'Project Initialized'}
        </h3>
        <p className="text-body-sm text-gray-500 mb-10 max-w-sm mx-auto leading-relaxed">
          {isTemplateMode 
            ? 'Your technical preset is ready for one-click deployment.' 
            : 'Your order is being processed. Expect formal pricing in your inbox within 30 minutes.'}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={isTemplateMode ? () => { setIsTemplateMode(false); setCurrentView('templates'); } : onComplete}
            className={`${orderPrimaryButtonClass} w-full sm:w-auto h-auto px-8 py-3 text-caption font-bold rounded-xl active:scale-[0.98] transition-[background-color,transform]`}
          >
            {isTemplateMode ? 'Manage Templates' : 'Track Progress'}
          </button>
          {!isTemplateMode && (
            <button
              onClick={() => setCurrentView('chat')}
              className={`${orderSecondaryButtonClass} w-full sm:w-auto h-auto px-8 py-3 text-caption font-bold rounded-xl active:scale-[0.98] transition-[background-color,border-color,transform]`}
            >
              Contact Support
            </button>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Step Breadcrumb */}
      {!hideBreadcrumb && <div className="flex items-center justify-between gap-2 px-2 sm:px-3 mb-2">
        <div className="flex items-center gap-1 sm:gap-2 text-caption overflow-x-auto">
          {STEPS.map((step, idx) => (
            <React.Fragment key={step.id}>
              <button
                onClick={() => navigateTo(step.id as OrderFlowStep)}
                className={`relative px-3 sm:px-4 py-1.5 rounded-full font-heading font-bold text-caption transition-colors duration-200 cursor-pointer whitespace-nowrap ${
                  orderFlowStep === step.id
                    ? 'bg-[var(--research-blue-light)] text-[var(--color-text-primary)]'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
                }`}
              >
                {step.label}
              </button>
              {idx < STEPS.length - 1 && <ChevronRight size={8} className="text-[var(--color-border-light)] shrink-0" />}
            </React.Fragment>
          ))}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {!isTemplateMode && (
            <button
              type="button"
              onClick={handleSaveDraft}
              className={`${orderSecondaryButtonClass} h-8 px-2.5 text-caption flex items-center gap-1.5`}
              title="Save draft without files"
            >
              <Save size={13} />
              <span className="hidden sm:inline">Save</span>
            </button>
          )}
          <button
            type="button"
            onClick={handleResetOrder}
            className={`${orderSecondaryButtonClass} h-8 px-2.5 text-caption flex items-center gap-1.5`}
            title="Reset order"
          >
            <RotateCcw size={13} />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>}

      {/* Steps — directional slide transition */}
      <div className="relative flex-1 overflow-hidden">
        <AnimatePresence initial={false} custom={directionRef.current} mode="wait">
          <motion.div
            key={orderFlowStep}
            custom={directionRef.current}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={stepTransition}
            className="h-full flex flex-col"
          >
            {orderFlowStep === 'requirements' && (
              <RequirementsStep
                orderData={orderData}
                setOrderData={setOrderData}
                isTemplateMode={isTemplateMode}
                onNext={() => navigateTo('files')}
                onCancel={onCancel}
              />
            )}
            {orderFlowStep === 'files' && (
              <FilesStep
                orderData={orderData}
                setOrderData={setOrderData}
                isTemplateMode={isTemplateMode}
                isUsingTemplate={isUsingTemplate}
                onFastTrack={() => navigateTo('review')}
                onNext={() => navigateTo('specs')}
                onBack={() => {
                  if (isUsingTemplate) onCancel();
                  else navigateTo('requirements');
                }}
              />
            )}
            {orderFlowStep === 'specs' && (
              <SpecsStep
                orderData={orderData}
                setOrderData={setOrderData}
                onNext={() => navigateTo('review')}
                onBack={() => navigateTo('files')}
              />
            )}
            {orderFlowStep === 'review' && (
              <ReviewStep
                orderData={orderData}
                isSubmitting={isSubmitting}
                error={error}
                isTemplateMode={isTemplateMode}
                onSubmit={isTemplateMode ? handleSaveAsTemplate : handleSubmitWithEmailCheck}
                onBack={() => navigateTo('specs')}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
});

export default OrderFlowUI;
