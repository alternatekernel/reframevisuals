import { memo, useRef, type ReactNode } from 'react';
import { Check, Paperclip, RotateCw, Users } from 'lucide-react';
import MarkdownRenderer from '../chat/MarkdownRenderer';
import SuggestedActions from '../chat/SuggestedActions';
import { formatFileSize, getAttachments, getOrderCard, isImageAttachment, normalizeActions, orderStatusTone } from './lib';
import type { ChatMessage, SuggestedAction } from './types';

interface Props {
  message: ChatMessage;
  isHuman: boolean;
  time: string;
  seen: boolean;
  contactCard: ReactNode;
  onAction: (action: SuggestedAction) => void;
  onRequestHuman: () => void;
  onRetry: (message: ChatMessage) => void;
  onOpenActions: (message: ChatMessage) => void;
  onNavigate: () => void;
}

const Dots = ({ tone = 'bg-[#171717]' }: { tone?: string }) => (
  <span className="inline-flex gap-1" aria-hidden>
    {[0, 150, 300].map(delay => (
      <span key={delay} className={`h-1.5 w-1.5 animate-bounce rounded-full ${tone}`} style={{ animationDelay: `${delay}ms` }} />
    ))}
  </span>
);

export const TypingBubble = ({ label }: { label: string }) => (
  <div className="flex justify-start" role="status">
    <div className="flex items-center gap-2 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-2">
      <Dots tone="bg-blue-500" />
      <span className="text-[12px] font-medium text-blue-700">{label}</span>
    </div>
  </div>
);

const MessageExtras = ({ message, onNavigate }: { message: ChatMessage; onNavigate: () => void }) => {
  const orderCard = getOrderCard(message);
  const attachments = getAttachments(message);
  return (
    <>
      {message.content && <MarkdownRenderer content={message.content} onNavigate={onNavigate} />}
      {orderCard && (
        <a
          href={orderCard.customerLink}
          target="_blank"
          rel="noreferrer"
          className="mt-2 block rounded-xl border border-black/[0.18] bg-white p-3 text-[12px] text-[#171717] shadow-sm"
        >
          <div className="flex items-start justify-between gap-2">
            <span className="font-bold">{orderCard.code || orderCard.orderId || 'Order'}</span>
            <span className={`inline-flex rounded-full border px-2 py-0.5 text-[12px] font-semibold ${orderStatusTone(orderCard.status)}`}>
              {(orderCard.status || 'new').replace(/_/g, ' ')}
            </span>
          </div>
          <div className="mt-1 font-semibold">{orderCard.title || 'Order details'}</div>
          <div className="mt-2 text-[12px] text-[#666]">Updates automatically · <span className="font-bold underline">View order</span></div>
        </a>
      )}
      {attachments.length > 0 && (
        <div className="mt-2 space-y-2">
          {attachments.map(attachment => (
            <div key={attachment.url} className="rounded-xl border border-black/[0.18] bg-white/80 p-2 text-[#171717]">
              {isImageAttachment(attachment) && (
                <a href={attachment.url} target="_blank" rel="noreferrer" className="mb-2 block overflow-hidden rounded-lg">
                  <img src={attachment.url} alt={attachment.filename} loading="lazy" className="max-h-40 max-w-full object-cover" />
                </a>
              )}
              <div className="flex items-center gap-2 text-[12px]">
                <Paperclip size={12} className="shrink-0" />
                <span className="min-w-0 flex-1 truncate font-semibold">{attachment.filename}</span>
                <span className="text-[#999]">{formatFileSize(attachment.size)}</span>
                <a href={attachment.url} download target="_blank" rel="noreferrer" className="rounded-full bg-black px-2 py-1 text-[12px] font-bold text-white">
                  Download
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

const MessageBubble = ({
  message, isHuman, time, seen, contactCard, onAction, onRequestHuman, onRetry, onOpenActions, onNavigate,
}: Props) => {
  const pressTimer = useRef<number | null>(null);
  const isUser = message.role === 'user';
  const actions = normalizeActions(message.suggestedActions);

  const cancelPress = () => {
    if (pressTimer.current) window.clearTimeout(pressTimer.current);
    pressTimer.current = null;
  };
  const gestures = {
    onContextMenu: (event: React.MouseEvent) => { event.preventDefault(); onOpenActions(message); },
    onTouchStart: () => { cancelPress(); pressTimer.current = window.setTimeout(() => onOpenActions(message), 520); },
    onTouchEnd: cancelPress,
    onTouchMove: cancelPress,
    onTouchCancel: cancelPress,
  };

  const handoff = message.isHandoff && (
    <button
      type="button"
      onClick={onRequestHuman}
      className="mt-3 flex items-center gap-2 rounded-lg border border-black/[0.16] bg-black/[0.04] px-3 py-1.5 text-[12px] font-semibold text-[#171717] transition-colors hover:bg-black/[0.08]"
    >
      <Users size={12} />
      Talk to a human
    </button>
  );

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[85%] flex-col gap-1 ${isUser ? 'items-end' : 'items-start'}`}>
        {isHuman && (
          <div className="mb-0.5 flex items-center gap-1.5 px-1">
            <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-blue-600">
              <Check size={8} className="text-white" strokeWidth={4} />
            </span>
            <span className="text-[12px] font-bold uppercase tracking-tight text-blue-700">Studio team</span>
          </div>
        )}

        {isUser ? (
          <div
            {...gestures}
            className={`rounded-2xl px-4 py-2.5 text-[14px] leading-relaxed text-white ${message.failed ? 'bg-[#171717]/70' : 'bg-[#171717]'}`}
          >
            <MessageExtras message={message} onNavigate={onNavigate} />
          </div>
        ) : isHuman ? (
          <div {...gestures} className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-2.5 text-[14px] leading-relaxed text-[#171717] shadow-sm">
            <MessageExtras message={message} onNavigate={onNavigate} />
            {actions.length > 0 && <SuggestedActions actions={actions} onActionClick={onAction} />}
            {contactCard && <div className="mt-3">{contactCard}</div>}
            {handoff}
          </div>
        ) : (
          <div {...gestures} className="w-full overflow-hidden rounded-2xl border border-black/[0.16] bg-white text-[14px] text-[#171717] shadow-sm">
            <div className="flex items-center gap-2 border-b border-black/[0.20] px-4 py-2">
              <span className="h-2 w-2 shrink-0 rounded-full bg-[#171717]" />
              <span className="text-[12px] font-semibold tracking-tight">Reframe CS</span>
              {message.pending ? (
                <span className="ml-auto"><Dots tone="bg-[#bbb]" /></span>
              ) : (
                <span className="ml-auto text-[9px] font-bold uppercase tracking-widest text-[#999]">AI</span>
              )}
            </div>
            <div className="px-4 py-3 leading-relaxed">
              <MessageExtras message={message} onNavigate={onNavigate} />
              {handoff}
            </div>
            {actions.length > 0 && (
              <div className="border-t border-black/[0.20] px-4 pb-3 pt-1">
                <SuggestedActions actions={actions} onActionClick={onAction} />
              </div>
            )}
            {contactCard && <div className="px-4 pb-3">{contactCard}</div>}
          </div>
        )}

        {message.failed ? (
          <button
            type="button"
            onClick={() => onRetry(message)}
            className="flex items-center gap-1 px-1 text-[12px] font-medium text-red-600 hover:underline"
          >
            <RotateCw size={11} />
            Not delivered · Retry
          </button>
        ) : time ? (
          <div className="px-1 text-[12px] text-[#999]">
            {time}
            {isUser && message.id != null && (
              <span className={`ml-1.5 ${seen ? 'text-blue-600' : 'text-[#aaa]'}`} title={seen ? 'Seen' : 'Delivered'}>
                {seen ? '✓✓ Seen' : '✓'}
              </span>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default memo(MessageBubble);
