import { forwardRef, useCallback, useLayoutEffect, useImperativeHandle, useRef } from 'react';
import { ArrowUp, AudioLines, ChevronUp, Paperclip } from 'lucide-react';

interface Props {
  isExpanded: boolean;
  text: string;
  onTextChange: (value: string) => void;
  onSend: () => void;
  onExpand: () => void;
  onAttach: () => void;
  onPasteFiles: (files: File[]) => void;
  isSending: boolean;
  isListening: boolean;
  onToggleDictation: () => void;
  idlePhrase: string;
  idlePhraseVisible: boolean;
  /** First line of an unread team reply, shown on the collapsed bar. */
  replyPreview: string;
  attachLabel: string;
}

export interface ComposerHandle {
  focus: () => void;
}

const MAX_HEIGHT = { expanded: 120, collapsed: 40 };

const Composer = forwardRef<ComposerHandle, Props>(function Composer({
  isExpanded, text, onTextChange, onSend, onExpand, onAttach, onPasteFiles, isSending,
  isListening, onToggleDictation, idlePhrase, idlePhraseVisible, replyPreview, attachLabel,
}, ref) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  useImperativeHandle(ref, () => ({ focus: () => inputRef.current?.focus() }), []);

  const hasText = Boolean(text.trim());
  const canSend = hasText && !isSending;

  useLayoutEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    const max = isExpanded ? MAX_HEIGHT.expanded : MAX_HEIGHT.collapsed;
    input.style.height = 'auto';
    input.style.height = `${Math.min(input.scrollHeight, max)}px`;
    input.style.overflowY = input.scrollHeight > max && isExpanded ? 'auto' : 'hidden';
  }, [text, isExpanded]);

  const handlePaste = useCallback((event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const files = Array.from(event.clipboardData?.items || [])
      .filter(item => item.type.startsWith('image/'))
      .map(item => item.getAsFile())
      .filter((file): file is File => Boolean(file))
      .map(file => new File([file], `screenshot_${Date.now()}.png`, { type: file.type }));
    if (!files.length) return;
    event.preventDefault();
    onPasteFiles(files);
  }, [onPasteFiles]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) return;
    event.preventDefault();
    if (canSend) onSend();
  };

  const showIdlePhrase = !hasText && !isListening && !replyPreview;

  return (
    <div
      className={`relative flex min-h-[64px] w-full shrink-0 items-center gap-2 px-3 py-2 sm:gap-3 sm:px-4 ${
        isExpanded ? 'border-t border-[#f1f1f1] bg-white' : 'cursor-text'
      }`}
      style={isExpanded ? { paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' } : undefined}
      onClick={() => { if (!isExpanded) onExpand(); }}
    >
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={event => { event.stopPropagation(); onAttach(); }}
          className="group relative flex h-10 w-10 items-center justify-center gap-2 rounded-full border border-black/80 bg-[#171717] text-[12px] font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_2px_3px_rgba(0,0,0,0.12),0_7px_16px_rgba(0,0,0,0.12)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-black sm:w-auto sm:px-3.5"
          aria-label={attachLabel}
          title={attachLabel}
        >
          <Paperclip size={13} className="shrink-0" />
          <span className="hidden whitespace-nowrap sm:inline">{attachLabel}</span>
        </button>
        <button
          type="button"
          onClick={event => { event.stopPropagation(); onToggleDictation(); }}
          aria-pressed={isListening}
          aria-label={isListening ? 'Stop voice typing' : 'Voice typing'}
          className={`flex h-9 w-9 items-center justify-center rounded-full border transition-all duration-300 sm:h-10 sm:w-10 ${
            isListening
              ? 'border-semantic-error-border bg-semantic-error-light text-semantic-error ring-2 ring-semantic-error/20'
              : 'border-black/[0.20] bg-bg-soft text-text-primary hover:-translate-y-0.5 hover:border-black/[0.18] hover:bg-white'
          }`}
        >
          <AudioLines size={14} className={isListening ? 'animate-pulse' : ''} />
        </button>
      </div>

      <div className="relative flex min-w-0 flex-1 items-center">
        {!isExpanded && hasText && (
          <span className="mr-2 shrink-0 rounded-full bg-black/[0.06] px-2 py-0.5 text-12 font-bold uppercase tracking-wide text-text-subtle">
            Draft
          </span>
        )}
        <textarea
          ref={inputRef}
          value={text}
          rows={1}
          onChange={event => onTextChange(event.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onFocus={() => { if (!isExpanded) onExpand(); }}
          aria-label="Message Reframe CS"
          placeholder={isListening ? 'Listening…' : ''}
          className="min-h-10 w-full resize-none border-none bg-transparent py-2.5 text-left text-14 leading-[1.35] text-text-primary outline-none placeholder:text-text-placeholder"
        />
        {replyPreview && !hasText && !isListening && (
          <span aria-hidden className="pointer-events-none absolute inset-0 flex items-center gap-1.5 text-14">
            <span className="shrink-0 font-semibold text-text-primary">New reply:</span>
            <span className="truncate text-text-subtle">{replyPreview}</span>
          </span>
        )}
        {showIdlePhrase && (
          <span
            aria-hidden
            className={`pointer-events-none absolute inset-0 flex min-w-0 items-center text-14 text-text-placeholder transition-opacity duration-200 ${
              isExpanded ? 'justify-start' : 'justify-center'
            } ${idlePhraseVisible ? 'opacity-100' : 'opacity-0'}`}
          >
            <span className="min-w-0 truncate">{isExpanded ? 'Type a message…' : idlePhrase}</span>
          </span>
        )}
      </div>

      <button
        type="button"
        onClick={event => {
          event.stopPropagation();
          if (canSend) onSend();
          else if (!isExpanded) onExpand();
        }}
        disabled={isExpanded && !canSend}
        aria-label={!isExpanded && !hasText ? 'Open chat' : 'Send message'}
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-all duration-300 sm:h-10 sm:w-10 ${
          canSend
            ? 'border-black/80 bg-text-primary text-white hover:-translate-y-0.5 hover:bg-black'
            : !isExpanded
              ? 'border-black/[0.20] bg-bg-soft text-text-primary hover:-translate-y-0.5 hover:bg-white'
              : 'cursor-not-allowed border-black/[0.20] bg-black/[0.06] text-black/30'
        }`}
      >
        {!isExpanded && !hasText ? <ChevronUp size={16} /> : <ArrowUp size={16} />}
      </button>
    </div>
  );
});

export default Composer;
