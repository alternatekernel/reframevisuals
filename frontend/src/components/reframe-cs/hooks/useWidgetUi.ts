import { useCallback, useEffect, useRef, useState } from 'react';
import { clearDraft, loadDraft, saveDraft } from '../../../utils/chatSmart';
import { CTA_DWELL_MS, STORAGE } from '../constants';

const draftId = (conversationId: string | null) => conversationId || 'new';

/** Composer text, persisted per conversation so switching threads never leaks a draft. */
export const useComposerDraft = (conversationId: string | null) => {
  const [text, setTextState] = useState(() => loadDraft(draftId(conversationId)));
  const idRef = useRef(conversationId);

  useEffect(() => {
    if (idRef.current === conversationId) return;
    const previous = draftId(idRef.current);
    idRef.current = conversationId;
    // A brand-new chat that just got its server id keeps what the visitor is typing.
    if (previous === 'new' && conversationId) {
      clearDraft('new');
      return;
    }
    setTextState(loadDraft(draftId(conversationId)));
  }, [conversationId]);

  const setText = useCallback((value: string) => {
    setTextState(value);
    const key = draftId(idRef.current);
    if (value) saveDraft(key, value);
    else clearDraft(key);
  }, []);

  return [text, setText] as const;
};

export const useCompactViewport = () => {
  const read = () => ({
    isCompact: typeof window !== 'undefined' ? window.innerWidth < 768 : false,
    // Visual viewport shrinks when the mobile keyboard opens; layout viewport doesn't.
    height: typeof window !== 'undefined' ? (window.visualViewport?.height || window.innerHeight) : 0,
    offsetTop: typeof window !== 'undefined' ? (window.visualViewport?.offsetTop || 0) : 0,
  });
  const [state, setState] = useState(read);

  useEffect(() => {
    const update = () => setState(read());
    const vv = window.visualViewport;
    window.addEventListener('resize', update);
    vv?.addEventListener('resize', update);
    vv?.addEventListener('scroll', update);
    return () => {
      window.removeEventListener('resize', update);
      vv?.removeEventListener('resize', update);
      vv?.removeEventListener('scroll', update);
    };
  }, []);

  return state;
};

export const useDictation = (
  onTranscript: (text: string) => void,
  onError: (title: string, message: string) => void,
) => {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const stop = useCallback(() => {
    recognitionRef.current?.stop?.();
    setIsListening(false);
  }, []);

  const toggle = useCallback(async () => {
    if (isListening) {
      stop();
      return;
    }
    const Recognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!Recognition) {
      onError('Not supported', 'Voice typing needs Chrome or Edge on desktop, or Chrome on Android.');
      return;
    }
    try {
      const permission = await (navigator.permissions as any)?.query({ name: 'microphone' });
      if (permission?.state === 'denied') {
        onError('Microphone blocked', 'Allow microphone access for this site in your browser settings, then try again.');
        return;
      }
    } catch {
      // permissions.query is not universal; recognition reports its own errors.
    }

    const recognition = new Recognition();
    recognitionRef.current = recognition;
    recognition.lang = navigator.language || 'en-US';
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (event: any) => {
      setIsListening(false);
      const messages: Record<string, string> = {
        'not-allowed': 'Microphone permission is blocked. Enable it for this site in your browser settings.',
        'service-not-allowed': 'Dictation is blocked by the browser.',
        'no-speech': 'No speech detected. Try again somewhere quieter.',
        'audio-capture': 'No microphone found, or another app is using it.',
        aborted: '',
      };
      const message = messages[event?.error] ?? 'Dictation failed. Please try again.';
      if (message) onError('Dictation', message);
    };
    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results).map((result: any) => result[0].transcript).join('');
      onTranscript(transcript);
    };
    recognition.start();
  }, [isListening, onError, onTranscript, stop]);

  useEffect(() => () => recognitionRef.current?.abort?.(), []);

  return { isListening, toggle };
};

/** Placeholder that cycles through prompts while the composer is idle. */
export const useRotatingPhrase = (phrases: string[], paused: boolean) => {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (paused) return;
    let swapTimer: number | undefined;
    const dwellTimer = window.setTimeout(() => {
      setVisible(false);
      swapTimer = window.setTimeout(() => {
        setIndex(current => (current + 1) % phrases.length);
        setVisible(true);
      }, 180);
    }, CTA_DWELL_MS[index] || 2600);
    return () => {
      window.clearTimeout(dwellTimer);
      if (swapTimer) window.clearTimeout(swapTimer);
    };
  }, [index, paused, phrases.length]);

  return { phrase: phrases[index % phrases.length], visible: paused || visible };
};

/**
 * Entrance timing for the floating launcher, and the hand-off to the landing-page
 * showcase: while the embedded widget is on screen the launcher lifts out of the way.
 */
export const useLauncherPresence = (enabled: boolean) => {
  const [isVisible, setIsVisible] = useState(!enabled);
  const [showcaseInView, setShowcaseInView] = useState(false);
  const [glow, setGlow] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const seen = sessionStorage.getItem(STORAGE.introSeen);
    const delay = reducedMotion ? 0 : seen ? 300 : window.scrollY > 100 ? 500 : 1400;
    const timer = window.setTimeout(() => {
      setIsVisible(true);
      sessionStorage.setItem(STORAGE.introSeen, '1');
    }, delay);
    return () => window.clearTimeout(timer);
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    const onShowcase = (event: Event) => {
      const inView = Boolean((event as CustomEvent).detail?.inView) && window.innerWidth >= 768;
      setShowcaseInView(inView);
    };
    window.addEventListener('reframe-cs-showcase-view', onShowcase);
    return () => window.removeEventListener('reframe-cs-showcase-view', onShowcase);
  }, [enabled]);

  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    setGlow(true);
    const timer = window.setTimeout(() => setGlow(false), showcaseInView ? 1300 : 1900);
    return () => window.clearTimeout(timer);
  }, [showcaseInView]);

  return { isVisible, showcaseInView, glow };
};
