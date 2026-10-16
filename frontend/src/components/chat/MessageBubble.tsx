import React, { useState } from 'react';
import { Message, AiData } from '../../types/dashboard';
import MarkdownRenderer from './MarkdownRenderer';
import SuggestedActions from './SuggestedActions';
import { Clock, FileText } from 'lucide-react';
import { useContent } from '../../context/ContentBase';

interface MessageBubbleProps {
  message: Message;
  showAvatar?: boolean;
  showMetadata?: boolean;
  deliveryState?: 'sent' | 'delivered' | 'seen';
}

const parseAiData = (metadata?: string): AiData | undefined => {
  if (!metadata) return undefined;
  try {
    const parsed = JSON.parse(metadata);
    // Normalize suggestedActions — handle both string[] and {text,url}[] formats
    if (parsed.suggestedActions) {
      parsed.suggestedActions = parsed.suggestedActions.map((a: any) =>
        typeof a === 'string' ? { text: a } : a
      );
    }
    return parsed;
  } catch {
    return undefined;
  }
};

const parseMetadata = (metadata?: string): Record<string, any> => {
  if (!metadata) return {};
  try {
    return JSON.parse(metadata);
  } catch {
    return {};
  }
};

const getOrderCard = (metadata?: string) => parseMetadata(metadata).orderCard || null;
const getAttachments = (metadata?: string): Array<{ url: string; filename: string; type?: string; size?: number }> => {
  const raw = parseMetadata(metadata).attachments;
  return Array.isArray(raw) ? raw.filter((a: any) => a?.url) : [];
};

const AttachmentList: React.FC<{ attachments: ReturnType<typeof getAttachments>; dark?: boolean }> = ({ attachments, dark }) => (
  <div className="mt-2 space-y-1.5">
    {attachments.map((a, i) => {
      const isImage = a.type?.startsWith('image/') || /\.(png|jpe?g|gif|webp|tiff?)$/i.test(a.filename);
      return (
        <div key={i}>
          {isImage ? (
            <a href={a.url} target="_blank" rel="noreferrer" className="block">
              <img
                src={a.url}
                alt={a.filename}
                className="max-h-48 max-w-full rounded-xl object-cover border border-white/10"
                loading="lazy"
              />
            </a>
          ) : (
            <a
              href={a.url}
              target="_blank"
              rel="noreferrer"
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-[12px] font-medium border ${dark ? 'bg-white/10 border-white/15 text-white' : 'bg-black/5 border-black/10 text-text-primary'}`}
            >
              <FileText size={14} className="shrink-0" />
              <span className="truncate max-w-[200px]">{a.filename}</span>
              {a.size ? <span className="ml-auto opacity-60 shrink-0">{(a.size / 1024).toFixed(0)} KB</span> : null}
            </a>
          )}
        </div>
      );
    })}
  </div>
);

const linkifyPlainText = (text: string) => {
  const regex = /(https?:\/\/[^\s]+)/g;
  return text.split(regex).map((chunk, idx) => (
    /^https?:\/\//.test(chunk)
      ? <a key={`${chunk}-${idx}`} href={chunk} target="_blank" rel="noreferrer" className="break-all underline underline-offset-2">{chunk}</a>
      : <React.Fragment key={`${idx}-${chunk.slice(0, 8)}`}>{chunk}</React.Fragment>
  ));
};

const formatTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
};

// Detect if content has rich elements (tables, lists, multiple paragraphs)
const hasRichContent = (content?: string): boolean => {
  if (!content) return false;
  return content.includes('|') ||
         content.includes('\n\n') ||
         content.includes('**') ||
         content.includes('1. ') ||
         content.includes('- ') ||
         content.includes('##');
};

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, showAvatar = false, showMetadata = true, deliveryState }) => {
  const { currentUser } = useContent();
  const [showTimestamp, setShowTimestamp] = useState(false);
  const isUser = message.role === 'user';
  const aiData = parseAiData(message.metadata);
  const orderCard = getOrderCard(message.metadata);
  const attachments = getAttachments(message.metadata);
  const isRichContent = !isUser && hasRichContent(message.content);
  const sharedWidthClass = 'w-full max-w-[80%] sm:max-w-[64%]';

  // User messages stay as bubbles
  if (isUser) {
    return (
      <div 
        className="flex justify-end animate-fadeSlideUp"
        onMouseEnter={() => setShowTimestamp(true)}
        onMouseLeave={() => setShowTimestamp(false)}
      >
        <div className={`flex flex-row-reverse items-end gap-2 ${sharedWidthClass}`}>
          {showAvatar && (
            currentUser?.avatarUrl ? (
              <img src={currentUser.avatarUrl} alt="User" className="h-7 w-7 rounded-full object-cover shrink-0 mb-0.5 border border-black/5 shadow-sm" />
            ) : (
              <div className="h-7 w-7 rounded-full bg-brand-ink text-white flex items-center justify-center font-bold text-[10px] shrink-0 mb-0.5 shadow-sm">
                {currentUser?.name?.[0]?.toUpperCase() || 'U'}
              </div>
            )
          )}
          <div className="relative group">
            <div data-msg-bubble className="bg-[#171717] text-white px-4 py-2.5 rounded-[20px] text-[14px] leading-[1.45] shadow-sm">
              {message.content && <p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{linkifyPlainText(message.content)}</p>}
              {attachments.length > 0 && <AttachmentList attachments={attachments} dark />}
              {orderCard && (
                <a href={orderCard.customerLink} target="_blank" rel="noreferrer" className="mt-3 block rounded-2xl border border-white/15 bg-white/10 p-3 text-[12px] text-white">
                  <span className="block font-bold">{orderCard.code || orderCard.orderId || 'Order'}</span>
                  <span className="mt-1 block font-semibold">{orderCard.title || 'Order details'}</span>
                  <span className="mt-1 block opacity-70">Status: {orderCard.status || 'new'}</span>
                  <span className="mt-2 block font-bold underline">View order</span>
                </a>
              )}
            </div>
            {showMetadata && <div className={`absolute right-0 -bottom-6 flex items-center gap-1 text-[11px] text-[#999] transition-opacity duration-200 ${showTimestamp ? 'opacity-100' : 'opacity-30'}`}>
              <Clock size={10} />
              <span>{formatTime(message.createdAt)}</span>
              {deliveryState && (
                <span className={deliveryState === 'seen' ? 'text-blue-600' : 'text-[#999]'}>
                  {deliveryState === 'sent' ? 'Sent' : deliveryState === 'delivered' ? 'Delivered' : 'Seen'}
                </span>
              )}
            </div>}
          </div>
        </div>
      </div>
    );
  }

  // AI messages with rich card style - no bubble constraint
  return (
    <div 
      className="flex justify-start animate-fadeSlideUp"
      onMouseEnter={() => setShowTimestamp(true)}
      onMouseLeave={() => setShowTimestamp(false)}
    >
      <div className={`flex flex-row items-start gap-2 ${sharedWidthClass}`}>
        {/* Rich Card Message */}
        <div className="relative group min-w-0">
          {/* Main content card - expanded, no bubble constraint */}
          <div
            data-msg-bubble
            className={
              isRichContent
                ? 'bg-white border border-black/10 shadow-md rounded-2xl overflow-hidden w-full'
                : 'bg-black/[0.03] border border-black/5 rounded-[20px] overflow-hidden w-full'
            }
          >
            {/* Header for rich content */}
            {isRichContent && (
              <div className="px-4 py-2.5 border-b border-black/5 bg-gradient-to-r from-black/[0.02] to-transparent">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-semibold text-[#171717]">Reframe CS</span>
                  <span className="px-1.5 py-0.5 bg-[#171717] text-white text-[9px] font-medium rounded">Support</span>
                </div>
              </div>
            )}
            
            {/* Content area - more padding for rich content */}
            <div className={`${isRichContent ? 'p-4' : 'px-4 py-2.5'} min-w-0`}>
              {message.content && (
                <div className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
                  <MarkdownRenderer content={message.content} />
                </div>
              )}
              {attachments.length > 0 && <AttachmentList attachments={attachments} />}
              {orderCard && (
                <a href={orderCard.customerLink} target="_blank" rel="noreferrer" className="mt-3 block rounded-2xl border border-black/10 bg-white p-3 text-[12px] text-[#171717] shadow-sm">
                  <span className="block font-bold">{orderCard.code || orderCard.orderId || 'Order'}</span>
                  <span className="mt-1 block font-semibold">{orderCard.title || 'Order details'}</span>
                  <span className="mt-1 block text-[#777]">Status: {orderCard.status || 'new'}</span>
                  <span className="mt-2 block font-bold underline">View order</span>
                </a>
              )}
            </div>

            {/* Suggested Actions - inside card for rich content */}
            {aiData?.suggestedActions && aiData.suggestedActions.length > 0 && (
              <div className={`px-5 ${isRichContent ? 'pb-5' : 'pb-4'} mt-2`}>
                <SuggestedActions actions={aiData.suggestedActions} />
              </div>
            )}
          </div>

          {/* Timestamp - outside the card */}
          {showMetadata && <div className={`flex items-center gap-1 text-[11px] text-[#999] mt-2 ml-1 transition-opacity duration-200 ${showTimestamp ? 'opacity-100' : 'opacity-30'}`}>
            <Clock size={10} />
            <span>{formatTime(message.createdAt)}</span>
          </div>}
        </div>
      </div>
    </div>
  );
};

export const DateSeparator: React.FC<{ date: string }> = ({ date }) => (
  <div className="flex items-center justify-center my-6">
    <div className="flex items-center gap-3">
      <div className="h-px w-12 bg-black/10" />
      <span className="text-[11px] font-medium text-[#999] uppercase tracking-wide">
        {formatDate(date)}
      </span>
      <div className="h-px w-12 bg-black/10" />
    </div>
  </div>
);

export default MessageBubble;
