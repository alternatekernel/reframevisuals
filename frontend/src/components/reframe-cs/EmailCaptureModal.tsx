import { createPortal } from 'react-dom';
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { getApiEndpoint } from '../../lib/apiConfig';

interface EmailCaptureModalProps {
  conversationId: string | null;
  guestId: string;
  mode?: 'pre-chat' | 'post-message';
  onCaptured: () => void;
  onDismiss: () => void;
}

// Reframe R lettermark — white on transparent
const RMark = ({ size = 28 }: { size?: number }) => (
  <svg
    viewBox="350 420 1240 1240"
    width={size}
    height={size}
    fill="white"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path d="M764.961 1646L413 1300.48V852.229H867.74L413 432L1278.52 432C1428.02 432 1580.64 531.61 1580.64 677.908V852.229H867.74L1581 1646H1157.41L764.961 1228.88V1646Z" />
  </svg>
);

const COPY = {
  'pre-chat': {
    heading: 'Chat with us.',
    sub: 'Real people reply — usually within 30 minutes.',
    cta: 'Keep me in the loop',
    skip: "I'm just browsing",
    placeholder: 'your@email.com',
  },
  'post-message': {
    heading: "Don't miss the reply.",
    sub: "We'll reach you directly — even if you close this tab.",
    cta: 'Notify me when you reply',
    skip: 'Skip for now',
    placeholder: 'your@email.com',
  },
};

const EmailCaptureModal = ({
  conversationId,
  guestId,
  mode = 'post-message',
  onCaptured,
  onDismiss,
}: EmailCaptureModalProps) => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const copy = COPY[mode];

  useEffect(() => {
    const timer = window.setTimeout(() => inputRef.current?.focus(), 150);
    document.body.style.overflow = 'hidden';
    return () => {
      window.clearTimeout(timer);
      document.body.style.overflow = '';
    };
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onDismiss(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onDismiss]);

  const submit = async () => {
    const trimmed = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError('Enter a valid email address.');
      return;
    }
    setIsSubmitting(true);
    setError('');
    try {
      if (conversationId) {
        const response = await fetch(getApiEndpoint('/portal/chat/capture-email'), {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json', 'X-Guest-ID': guestId },
          body: JSON.stringify({ conversationId, email: trimmed }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data?.success) throw new Error(data?.message || 'Could not save that right now.');
      } else {
        sessionStorage.setItem('reframe_pending_email', trimmed);
      }
      onCaptured();
    } catch (err: any) {
      setError(err?.message || 'Could not save that right now. Try again.');
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="email-capture-heading"
    >
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-black/60"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onDismiss}
        aria-hidden="true"
      />

      {/* Card */}
      <motion.div
        className="relative w-full max-w-lg overflow-hidden rounded-[24px] bg-[var(--color-text-primary,#171717)] shadow-[0_32px_80px_rgba(0,0,0,0.22),0_0_0_1px_rgba(0,0,0,0.06)]"
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 340, damping: 28 }}
      >
        {/* Brand header */}
        <div className="flex flex-col items-center bg-[var(--color-text-primary,#171717)] px-8 pb-8 pt-9">
          <span className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-white/10">
            <RMark size={28} />
          </span>
          <h2
            id="email-capture-heading"
            className="text-center text-[26px] font-bold leading-[1.15] tracking-[-0.03em] text-white"
          >
            {copy.heading}
          </h2>
          <p className="mt-2.5 text-center text-[15px] leading-relaxed text-white/60">
            {copy.sub}
          </p>
        </div>

        {/* Body */}
        <div className="bg-white px-8 pb-8 pt-7">
          <form noValidate onSubmit={event => { event.preventDefault(); submit(); }}>
            <input
              ref={inputRef}
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder={copy.placeholder}
              aria-label="Email address"
              value={email}
              onChange={event => { setEmail(event.target.value); if (error) setError(''); }}
              disabled={isSubmitting}
              className="mb-3 h-[52px] w-full rounded-xl border border-black/[0.14] bg-bg-soft px-4 text-body text-text-primary placeholder-text-placeholder focus:border-text-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/[0.07] transition-colors duration-150"
            />
            {error && (
              <p role="alert" className="mb-3 text-caption font-medium text-semantic-error">{error}</p>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className="h-[52px] w-full rounded-xl bg-[var(--color-text-primary,#171717)] text-[16px] font-semibold text-white shadow-sm transition-all duration-200 hover:opacity-90 active:scale-[0.99] disabled:opacity-50"
            >
              {isSubmitting ? 'Saving…' : copy.cta}
            </button>
          </form>

          <div className="mt-5 flex items-center justify-center">
            <button
              type="button"
              onClick={onDismiss}
              className="text-caption text-text-placeholder underline-offset-2 transition-colors hover:text-text-subtle hover:underline"
            >
              {copy.skip}
            </button>
          </div>
        </div>
      </motion.div>
    </div>,
    document.body,
  );
};

export default EmailCaptureModal;
