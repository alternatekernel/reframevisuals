import { useEffect, useRef } from 'react';
import { ArrowRight, MessageSquare, Minus, Plus } from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';
import { conversationTitle, sortConversations, type WidgetNavItem } from './Sidebar';
import type { ChatMessage, ConversationPreview } from './types';

interface HeaderProps {
  title: string;
  showIntro: boolean;
  introTitle: string;
  showSignUp: boolean;
  showCollapse: boolean;
  showDashboard: boolean;
  onSignUp: () => void;
  onCollapse: () => void;
  onDashboard: () => void;
}

const roundButton = 'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#e5e5e5] bg-white shadow-sm transition-colors hover:border-[#d4d4d4]';

export const PanelHeader = ({
  title, showIntro, introTitle, showSignUp, showCollapse, showDashboard, onSignUp, onCollapse, onDashboard,
}: HeaderProps) => (
  <header className={`flex shrink-0 justify-between gap-3 border-b border-black/[0.08] bg-white px-4 sm:px-6 ${showIntro ? 'items-start py-3' : 'h-14 items-center sm:h-12'}`}>
    <div className="min-w-0 flex-1">
      {showIntro ? (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-[14px] font-semibold tracking-[-0.01em] text-[#171717]">{introTitle}</h2>
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Replies in minutes
            </span>
          </div>
          <p className="mt-1 max-w-[360px] text-[12px] leading-snug text-[#6f6f6f]">
            Ask about services, pricing, or your account. A real teammate replies.
          </p>
        </>
      ) : (
        <h2 className="truncate text-[13px] font-semibold tracking-[-0.01em] text-[#171717]">{title}</h2>
      )}
    </div>
    <div className="flex items-center gap-2 self-center">
      {showSignUp && (
        <button type="button" onClick={onSignUp} className="h-8 shrink-0 rounded-full border border-[#e5e5e5] bg-white px-3 text-[12px] font-semibold text-[#171717] transition-colors hover:border-[#d4d4d4]">
          Sign up
        </button>
      )}
      {showDashboard && (
        <button type="button" onClick={onDashboard} aria-label="Open dashboard" className={`${roundButton} group text-[#808080] hover:text-[#171717]`}>
          <ArrowRight size={14} className="transition-transform duration-300 group-hover:-rotate-45" />
        </button>
      )}
      {showCollapse && (
        <button type="button" onClick={onCollapse} aria-label="Minimize Reframe CS" className={`${roundButton} text-[#171717]`}>
          <Minus size={15} />
        </button>
      )}
    </div>
  </header>
);

interface MobileTabsProps {
  orderLabel: string;
  orderActive: boolean;
  orderHighlighted: boolean;
  onOrderAction: () => void;
  chatActive: boolean;
  onChats: () => void;
  navItems: WidgetNavItem[];
}

const pill = 'flex min-h-[40px] shrink-0 items-center gap-1.5 rounded-full px-3 text-[12px] font-semibold transition-colors';

export const MobileTabs = ({ orderLabel, orderActive, orderHighlighted, onOrderAction, chatActive, onChats, navItems }: MobileTabsProps) => (
  <div className="shrink-0 overflow-x-auto border-b border-black/[0.08] bg-white px-4 py-2 scrollbar-hide">
    <div className="flex min-w-max items-center gap-2">
      <button
        type="button"
        onClick={onOrderAction}
        className={`${pill} ${orderActive ? 'bg-[#171717] text-white' : orderHighlighted ? 'bg-[var(--research-blue)]/15 text-[#171717] ring-2 ring-[var(--research-blue)]/60' : 'bg-[#f5f5f5] text-[#171717]'}`}
      >
        <Plus size={13} />
        {orderLabel}
      </button>
      <button type="button" onClick={onChats} className={`${pill} ${chatActive ? 'bg-[var(--research-blue)] text-[#171717]' : 'bg-[#f5f5f5] text-[#555]'}`}>
        <MessageSquare size={13} />
        Chats
      </button>
      {navItems.map(item => (
        <button key={item.id} type="button" onClick={item.onSelect} className={`${pill} ${item.active ? 'bg-[var(--research-blue)] text-[#171717]' : 'bg-[#f5f5f5] text-[#555]'}`}>
          <item.icon size={13} />
          {item.label}
        </button>
      ))}
    </div>
  </div>
);

interface ChipsProps {
  conversations: ConversationPreview[];
  activeId: string | null;
  pinnedIds: string[];
  onSelect: (id: string) => void;
  onNewChat: () => void;
}

export const ConversationChips = ({ conversations, activeId, pinnedIds, onSelect, onNewChat }: ChipsProps) => {
  if (!conversations.length) return null;
  return (
    <div className="flex shrink-0 gap-2 overflow-x-auto border-b border-black/[0.05] bg-white px-4 py-2 scrollbar-hide">
      <button type="button" onClick={onNewChat} className={`min-h-9 shrink-0 rounded-full border px-3 text-[11px] font-semibold ${!activeId ? 'border-[var(--research-blue)] bg-[var(--research-blue-light)] text-[#171717]' : 'border-dashed border-black/15 text-[#555]'}`}>
        + New
      </button>
      {sortConversations(conversations, pinnedIds).slice(0, 8).map(conversation => (
        <button
          key={conversation.id}
          type="button"
          onClick={() => onSelect(conversation.id)}
          className={`min-h-9 max-w-[160px] shrink-0 rounded-full border px-3 text-left text-[11px] font-semibold ${
            conversation.id === activeId ? 'border-[var(--research-blue)] bg-[var(--research-blue-light)] text-[#171717]' : 'border-black/10 bg-white text-[#555]'
          }`}
        >
          <span className="block truncate">{conversationTitle(conversation)}</span>
        </button>
      ))}
    </div>
  );
};

const statusTone = (status: string) => (
  status === 'processing' ? 'bg-[var(--research-blue-light)] border-[var(--research-blue)]/30'
    : status === 'review' ? 'bg-[var(--research-peach-light)] border-[var(--research-peach)]/30'
      : 'bg-white border-black/10'
);

const EmptyState = ({ text, actionLabel, onAction }: { text: string; actionLabel?: string; onAction?: () => void }) => (
  <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
    <p className="text-[13px] text-[#666]">{text}</p>
    {actionLabel && (
      <button type="button" onClick={onAction} className="rounded-full bg-[#171717] px-4 py-2 text-[12px] font-semibold text-white hover:bg-black">
        {actionLabel}
      </button>
    )}
  </div>
);

export const AccountTab = ({ tab, onStartOrder, onOpenPath }: {
  tab: 'jobs' | 'orders' | 'gallery';
  onStartOrder: () => void;
  onOpenPath: (path: string) => void;
}) => {
  const { jobs } = useDashboard();
  const active = jobs.filter(job => job.status !== 'delivered');
  const delivered = jobs.filter(job => job.status === 'delivered');

  return (
    <div className="h-full overflow-y-auto overscroll-contain">
      <div className="mx-auto max-w-3xl p-3 sm:p-6">
        {tab === 'jobs' && (active.length ? (
          <ul className="space-y-3">
            {active.map(job => (
              <li key={job.id}>
                <button type="button" onClick={() => onOpenPath('/dashboard')} className="relative w-full overflow-hidden rounded-xl border border-black/10 bg-white p-4 text-left transition-colors hover:border-black/20">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="truncate text-[13px] font-semibold text-[#171717]">{job.title}</span>
                      {job.isPriority && <span className="rounded-md bg-red-50 px-1.5 py-0.5 text-[9px] font-bold uppercase text-red-600">Priority</span>}
                    </span>
                    <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#171717] ${statusTone(job.status)}`}>{job.status}</span>
                  </div>
                  <div className="text-[11px] text-[#808080]">{job.itemCount} items · ${job.totalPrice || '0.00'}</div>
                </button>
              </li>
            ))}
          </ul>
        ) : <EmptyState text="No active projects." actionLabel="Start an order" onAction={onStartOrder} />)}

        {tab === 'orders' && (delivered.length ? (
          <ul className="space-y-3">
            {delivered.map(order => (
              <li key={order.id} className="flex items-center justify-between gap-3 rounded-xl border border-black/10 bg-white p-4">
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-[#171717]">{order.title}</p>
                  <p className="mt-1 text-[11px] text-[#808080]">ID {String(order.id).slice(0, 8)} · ${order.totalPrice}</p>
                </div>
                <button type="button" onClick={() => onOpenPath('/dashboard/orders')} className="shrink-0 rounded-full bg-[#171717] px-3 py-1.5 text-[11px] font-medium text-white hover:bg-black">
                  View
                </button>
              </li>
            ))}
          </ul>
        ) : <EmptyState text="No completed orders yet." />)}

        {tab === 'gallery' && (() => {
          const files = delivered.flatMap(job => job.deliveredFiles || []).filter((file: any) => file?.url).slice(0, 9);
          return files.length ? (
            <div className="grid grid-cols-3 gap-3">
              {files.map((file: any) => (
                <a key={file.url} href={file.url} target="_blank" rel="noreferrer" download className="group relative aspect-square overflow-hidden rounded-xl border border-black/10 bg-white">
                  <img src={file.url} alt={file.name || 'Delivered image'} loading="lazy" className="h-full w-full object-cover" />
                  <span className="absolute inset-0 flex items-center justify-center bg-black/0 text-[10px] font-bold uppercase tracking-wider text-white opacity-0 transition-all group-hover:bg-black/40 group-hover:opacity-100">Download</span>
                </a>
              ))}
            </div>
          ) : <EmptyState text="Delivered images will appear here." />;
        })()}
      </div>
    </div>
  );
};

export const MessageActionsSheet = ({ message, onClose, onCopy, onEdit, onResend }: {
  message: ChatMessage;
  onClose: () => void;
  onCopy: () => void;
  onEdit: () => void;
  onResend: () => void;
}) => {
  const firstRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    firstRef.current?.focus();
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const item = 'w-full rounded-xl px-3 py-2.5 text-left text-[13px] font-semibold text-[#171717] hover:bg-black/[0.04] focus:bg-black/[0.04] focus:outline-none';
  return (
    <div className="absolute inset-0 z-[80] bg-black/20" onClick={onClose}>
      <div role="menu" aria-label="Message actions" className="absolute bottom-4 left-1/2 w-[88%] max-w-xs -translate-x-1/2 rounded-2xl bg-white p-2 shadow-2xl" onClick={event => event.stopPropagation()}>
        <button ref={firstRef} type="button" role="menuitem" className={item} onClick={onCopy}>Copy message</button>
        {message.role === 'user' && (
          <>
            <button type="button" role="menuitem" className={item} onClick={onEdit}>Edit and resend</button>
            <button type="button" role="menuitem" className={item} onClick={onResend}>Send again</button>
          </>
        )}
      </div>
    </div>
  );
};
