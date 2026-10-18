import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ArrowDown } from 'lucide-react';
import ContactCaptureCard from './ContactCaptureCard';
import MessageBubble, { TypingBubble } from './MessageBubble';
import { BOTTOM_THRESHOLD_PX, SAME_GROUP_MS } from './constants';
import { formatClock, isHumanMessage, messageTime, renderKey, serverKey } from './lib';
import type { ChatSession } from './hooks/useChatSession';
import type { ChatMessage, SuggestedAction } from './types';

interface Props {
  session: ChatSession;
  guestId: string;
  onAction: (action: SuggestedAction) => void;
  onOpenActions: (message: ChatMessage) => void;
  onNavigate: () => void;
}

const senderKey = (message: ChatMessage) =>
  message.role === 'user' ? 'user' : isHumanMessage(message) ? 'team' : 'bot';

const groupsWithNext = (message: ChatMessage, next?: ChatMessage) => {
  if (!next || senderKey(next) !== senderKey(message)) return false;
  const a = new Date(messageTime(message)).getTime();
  const b = new Date(messageTime(next)).getTime();
  return Number.isFinite(a) && Number.isFinite(b) && Math.abs(b - a) < SAME_GROUP_MS;
};

const ThreadSkeleton = () => (
  <div className="space-y-3" aria-busy="true" aria-label="Loading conversation">
    {[60, 40, 70].map((width, index) => (
      <div key={width} className={`flex ${index % 2 ? 'justify-end' : 'justify-start'}`}>
        <div className="h-10 animate-pulse rounded-2xl bg-black/[0.05]" style={{ width: `${width}%` }} />
      </div>
    ))}
  </div>
);

/**
 * Follows new messages only while the reader is already at the bottom. Scrolling up
 * pins the view and surfaces a jump button that counts what arrived in the meantime.
 */
const ChatThread = ({ session, guestId, onAction, onOpenActions, onNavigate }: Props) => {
  const { messages, threadLoading, isSupportTyping, supportSeenId, unreadFromKey, contactCaptured, conversationId } = session;
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const atBottomRef = useRef(true);
  const lengthRef = useRef(messages.length);
  const [showJump, setShowJump] = useState(false);
  const [unseenCount, setUnseenCount] = useState(0);

  const stick = useCallback(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight <= BOTTOM_THRESHOLD_PX;
    atBottomRef.current = atBottom;
    setShowJump(!atBottom);
    if (atBottom) setUnseenCount(0);
  };

  // Instant on purpose: the site's Lenis smooth-scroll swallows native smooth scrolling.
  const jumpToLatest = () => {
    atBottomRef.current = true;
    setShowJump(false);
    setUnseenCount(0);
    stick();
  };

  useLayoutEffect(() => {
    const previous = lengthRef.current;
    lengthRef.current = messages.length;
    const added = messages.slice(previous);
    const userJustSent = added.some(message => message.role === 'user');
    const threadReplaced = messages.length < previous || threadLoading;

    if (atBottomRef.current || userJustSent || threadReplaced) {
      atBottomRef.current = true;
      setShowJump(false);
      setUnseenCount(0);
      stick();
    } else if (added.length) {
      setUnseenCount(count => count + added.filter(message => message.role !== 'user').length);
    }
  }, [messages, isSupportTyping, threadLoading, stick]);

  // Images and cards change height after paint; keep the bottom pinned while following.
  useEffect(() => {
    const content = contentRef.current;
    if (!content || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => { if (atBottomRef.current) stick(); });
    observer.observe(content);
    return () => observer.disconnect();
  }, [stick]);

  const seenIndex = supportSeenId ? messages.findIndex(message => String(message.id) === supportSeenId) : -1;
  const lastContactAsk = messages.reduce((found, message, index) => (message.requestContact ? index : found), -1);

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      data-lenis-prevent
      className="relative h-full overflow-y-auto overscroll-contain"
      role="log"
      aria-live="polite"
      aria-relevant="additions"
    >
      <div ref={contentRef} className="mx-auto max-w-3xl space-y-2 p-3 sm:p-6">
        {threadLoading ? <ThreadSkeleton /> : messages.map((message, index) => {
          const isHuman = isHumanMessage(message);
          const showDivider = Boolean(unreadFromKey && isHuman && serverKey(message) === unreadFromKey);
          const contactCard = index === lastContactAsk && !contactCaptured ? (
            <ContactCaptureCard conversationId={conversationId} guestId={guestId} onCaptured={session.markContactCaptured} />
          ) : null;

          return (
            <div key={renderKey(message, index)} className="space-y-1">
              {showDivider && (
                <div className="flex items-center gap-3 py-1" role="separator">
                  <div className="h-px flex-1 bg-semantic-error-border" />
                  <span className="text-12 font-bold uppercase tracking-wide text-semantic-error">New replies</span>
                  <div className="h-px flex-1 bg-semantic-error-border" />
                </div>
              )}
              <MessageBubble
                message={message}
                isHuman={isHuman}
                time={groupsWithNext(message, messages[index + 1]) ? '' : formatClock(messageTime(message))}
                seen={message.role === 'user' && seenIndex >= index}
                contactCard={contactCard}
                onAction={onAction}
                onRequestHuman={session.requestHuman}
                onRetry={session.retryMessage}
                onOpenActions={onOpenActions}
                onNavigate={onNavigate}
              />
            </div>
          );
        })}
        {!threadLoading && isSupportTyping && <TypingBubble label="Support is typing…" />}
      </div>

      {showJump && (
        <div className="pointer-events-none sticky bottom-3 flex justify-center">
          <button
            type="button"
            onClick={jumpToLatest}
            className="pointer-events-auto flex items-center gap-1.5 rounded-full bg-[#171717] px-3 py-1.5 text-[12px] font-semibold text-white shadow-lg transition-colors hover:bg-black"
          >
            <ArrowDown size={12} />
            {unseenCount > 0 ? `${unseenCount} new message${unseenCount === 1 ? '' : 's'}` : 'Latest'}
          </button>
        </div>
      )}
    </div>
  );
};

export default ChatThread;
