import { useState } from 'react';
import { Info } from 'lucide-react';
import { getApiEndpoint } from '../../lib/apiConfig';

interface Props {
  conversationId: string | null;
  guestId: string;
  onCaptured: () => void;
}

/**
 * Inline, skippable ask for a way to reach a guest back. It lives inside the bot reply
 * rather than as an overlay so it reads as part of the conversation, not a popup.
 */
const ContactCaptureCard = ({ conversationId, guestId, onCaptured }: Props) => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const submit = async () => {
    const trimmed = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError('Enter a valid email address.');
      return;
    }
    if (!conversationId) {
      setError('Send a message first, then we can save your email.');
      return;
    }
    setIsSubmitting(true);
    setError('');
    try {
      const response = await fetch(getApiEndpoint('/portal/chat/capture-email'), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'X-Guest-ID': guestId },
        body: JSON.stringify({ conversationId, email: trimmed }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.success) throw new Error(data?.message || 'Could not save that right now.');
      onCaptured();
    } catch (err: any) {
      setError(err?.message || 'Could not save that right now. Try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const note = 'Used only to continue this support conversation. We never sell it or send marketing.';

  return (
    <div className="rounded-xl border border-black/[0.16] bg-black/[0.04] p-3">
      <div className="mb-1 flex items-start gap-1.5">
        <p className="text-[12px] font-semibold leading-snug text-[#171717]">Where should we reach you?</p>
        <span title={note} aria-label={note} className="mt-[1px] cursor-help text-[#999]"><Info size={12} /></span>
      </div>
      <p className="mb-2.5 text-[12px] leading-snug text-[#666]">
        So we can pick this up with you if you close the tab. Support replies only.
      </p>
      <form
        className="flex gap-2"
        noValidate
        onSubmit={event => { event.preventDefault(); submit(); }}
      >
        <input
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="your@email.com"
          aria-label="Email address"
          value={email}
          onChange={event => { setEmail(event.target.value); if (error) setError(''); }}
          disabled={isSubmitting}
          className="h-9 min-w-0 flex-1 rounded-lg border border-black/[0.1] bg-white px-3 text-[14px] text-[#171717] placeholder-[#aaa] focus:border-[#171717] focus:outline-none focus:ring-2 focus:ring-black/[0.06]"
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="h-9 shrink-0 rounded-lg bg-[#171717] px-3.5 text-[12px] font-semibold text-white transition-colors hover:bg-black disabled:opacity-50"
        >
          {isSubmitting ? 'Saving…' : 'Save'}
        </button>
      </form>
      {error && <p role="alert" className="mt-1.5 text-[12px] font-medium text-red-600">{error}</p>}
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="mt-2 text-[12px] font-medium text-[#888] underline-offset-2 hover:text-[#555] hover:underline"
      >
        Skip
      </button>
    </div>
  );
};

export default ContactCaptureCard;
