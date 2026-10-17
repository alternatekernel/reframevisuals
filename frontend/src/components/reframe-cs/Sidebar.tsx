import { motion } from 'framer-motion';
import { MessageSquare, Pin, Plus, Settings, Trash2, Zap } from 'lucide-react';
import type { ConversationPreview } from './types';

export interface WidgetNavItem {
  id: string;
  label: string;
  icon: React.FC<{ size?: number; className?: string }>;
  active: boolean;
  onSelect: () => void;
}

interface Props {
  orderLabel: string;
  orderGlow: boolean;
  onOrderAction: () => void;
  navItems: WidgetNavItem[];
  conversations: ConversationPreview[];
  conversationsLoading: boolean;
  activeConversationId: string | null;
  isChatTab: boolean;
  pinnedIds: string[];
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onTogglePin: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  userName: string;
  userLabel: string;
  isAuthenticated: boolean;
  onAccount: () => void;
}

export const sortConversations = (list: ConversationPreview[], pinnedIds: string[]) =>
  [...list].sort((a, b) => {
    const pinDelta = Number(pinnedIds.includes(b.id)) - Number(pinnedIds.includes(a.id));
    return pinDelta || new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

export const conversationTitle = (conversation: ConversationPreview) =>
  conversation.title || `Chat ${conversation.id.slice(0, 4)}`;

const Sidebar = ({
  orderLabel, orderGlow, onOrderAction, navItems, conversations, conversationsLoading, activeConversationId,
  isChatTab, pinnedIds, onSelectConversation, onNewChat, onTogglePin, onDeleteConversation,
  userName, userLabel, isAuthenticated, onAccount,
}: Props) => {
  const initials = userName.split(' ').map(part => part[0]).join('').toUpperCase().slice(0, 2);

  return (
    <motion.aside
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: 200, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="flex shrink-0 flex-col overflow-hidden border-r border-black/[0.16] bg-bg-soft"
      aria-label="Reframe CS navigation"
    >
      <div className="flex h-full w-[200px] min-h-0 flex-col">
        <div className="flex shrink-0 items-center gap-2 px-4 pb-4 pt-4">
          <span className="flex h-5 w-5 items-center justify-center rounded-md bg-text-primary">
            <Zap size={10} className="fill-white text-white" />
          </span>
          <span className="text-12 font-semibold uppercase tracking-[-0.02em] text-text-primary">Reframe CS</span>
        </div>

        <nav className="shrink-0 space-y-1 px-3">
          <button
            type="button"
            onClick={onOrderAction}
            className={`group mb-3 flex w-full items-center gap-2.5 rounded-full bg-text-primary px-3 py-2 text-12 font-medium text-white transition-all hover:bg-black ${
              orderGlow
                ? 'shadow-[0_0_0_2px_rgba(59,130,246,0.88),0_0_0_8px_rgba(59,130,246,0.18),0_0_24px_rgba(59,130,246,0.42)]'
                : 'shadow-token-subtle'
            }`}
          >
            <Plus size={14} className={`text-white/70 group-hover:text-white ${orderGlow ? 'animate-pulse' : ''}`} />
            {orderLabel}
          </button>
          {navItems.map(item => (
            <button
              key={item.id}
              type="button"
              onClick={item.onSelect}
              aria-current={item.active ? 'page' : undefined}
              className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-1.5 text-12 font-semibold transition-colors ${
                item.active ? 'bg-[var(--brand-secondary)] text-text-primary' : 'text-text-secondary hover:bg-white hover:text-text-primary'
              }`}
            >
              <item.icon size={13} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="mt-3 min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-3 scrollbar-hide">
          <p className="mb-1.5 px-2 text-12 font-bold uppercase tracking-wider text-text-muted">Chats</p>
          <button
            type="button"
            onClick={onNewChat}
            className={`mb-2 flex h-8 w-full items-center gap-2.5 rounded-lg px-3 text-12 font-semibold transition-colors ${
              isChatTab && !activeConversationId
                ? 'bg-[var(--brand-secondary)] text-text-primary'
                : 'border border-dashed border-black/[0.18] text-text-secondary hover:bg-white hover:text-text-primary'
            }`}
          >
            <MessageSquare size={13} />
            New chat
          </button>

          {conversationsLoading && !conversations.length ? (
            <div className="space-y-1.5 px-1" aria-busy="true">
              {[0, 1, 2].map(row => <div key={row} className="h-9 animate-pulse rounded-lg bg-black/[0.04]" />)}
            </div>
          ) : !conversations.length ? (
            <p className="px-3 py-2 text-12 text-text-placeholder">No previous chats</p>
          ) : (
            <ul className="space-y-0.5">
              {sortConversations(conversations, pinnedIds).map(conversation => {
                const active = isChatTab && conversation.id === activeConversationId;
                const pinned = pinnedIds.includes(conversation.id);
                return (
                  <li key={conversation.id} className="group relative">
                    <button
                      type="button"
                      onClick={() => onSelectConversation(conversation.id)}
                      aria-current={active ? 'true' : undefined}
                      className={`flex w-full flex-col gap-0.5 rounded-lg border px-3 py-2 pr-14 text-left transition-colors ${
                        active ? 'border-black/[0.18] bg-white shadow-sm' : 'border-transparent hover:bg-white/80'
                      }`}
                    >
                      <span className="flex min-w-0 items-center gap-1.5">
                        {pinned && <Pin size={8} className="shrink-0 fill-text-faint text-text-faint" />}
                        <span className={`truncate text-12 font-semibold ${active ? 'text-text-primary' : 'text-text-subtle'}`}>
                          {conversationTitle(conversation)}
                        </span>
                      </span>
                      <span className="text-12 text-text-faint">{new Date(conversation.updatedAt).toLocaleDateString()}</span>
                    </button>
                    <div className="absolute right-1 top-1/2 flex -translate-y-1/2 items-center opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => onTogglePin(conversation.id)}
                        aria-label={pinned ? 'Unpin chat' : 'Pin chat'}
                        className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors ${pinned ? 'text-text-primary' : 'text-text-faint hover:bg-white hover:text-text-primary'}`}
                      >
                        <Pin size={11} className={pinned ? 'fill-current' : ''} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteConversation(conversation.id)}
                        aria-label="Delete chat"
                        className="flex h-7 w-7 items-center justify-center rounded-md text-text-faint transition-colors hover:bg-semantic-error-light hover:text-semantic-error"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="flex min-h-[64px] shrink-0 items-center gap-3 border-t border-black/[0.16] bg-white/50 px-4 py-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-text-primary text-12 font-medium text-white">
            {initials}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-12 font-semibold text-text-primary">{userName}</p>
            <p className="text-12 text-text-muted">{userLabel}</p>
          </div>
          <button
            type="button"
            onClick={onAccount}
            aria-label={isAuthenticated ? 'Open dashboard' : 'Sign in'}
            title={isAuthenticated ? 'Open dashboard' : 'Sign in'}
            className="flex h-7 w-7 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-white hover:text-text-primary"
          >
            <Settings size={13} />
          </button>
        </div>
      </div>
    </motion.aside>
  );
};

export default Sidebar;
