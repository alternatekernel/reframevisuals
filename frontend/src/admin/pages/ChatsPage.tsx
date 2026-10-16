import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { adminFetch } from '../utils/api';
import { useToast } from '../ToastContext';
import { AlertCircle, Archive, Bell, BellOff, CheckCheck, Clock, Copy, Download, FileText, Image as ImageIcon, Info, Mail, MessageSquare, AudioLines, MoreVertical, Paperclip, Phone, RefreshCw, Search, Star, Trash2, UserCircle, Volume2, VolumeX, X } from 'lucide-react';
import MarkdownRenderer from '../../components/chat/MarkdownRenderer';
import { API_BASE_URL } from '../utils/api';
import { RealtimeSource } from '../../lib/realtimeSource';
import { uploadFetch } from '../../lib/directUpload';

const urlBase64ToUint8Array = (base64String: string) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
};

interface Conversation {
  id: string;
  title: string;
  updatedAt: string;
  archivedAt?: string | null;
  pinnedAt?: string | null;
  adminReadAt?: string | null;
  tags?: string | null;
  customerId: string;
  isEscalated?: boolean;
  assignedTo?: string | null;
  customer?: {
    id: string;
    name: string;
    email: string;
    companyName: string;
    contactPhone?: string | null;
    contactEmail?: string | null;
    industry?: string | null;
    customerNumber?: number | null;
    isGuest?: boolean;
    activeStatus?: 'active' | 'inactive';
    lastActiveAt?: string | null;
  };
  messages: Message[];
}

interface ChatAttachment {
  url: string;
  filename: string;
  size?: number;
  type?: string;
  path?: string;
  folderPath?: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'admin' | string;
  content: string;
  createdAt: string;
  metadata?: string | null;
}

interface ConversationRealtime {
  customerTyping?: boolean;
  supportTyping?: boolean;
  customerSeen?: {
    messageId: string;
    seenAt: number;
  } | null;
  supportSeen?: {
    messageId: string;
    seenAt: number;
  } | null;
}

const getTimeAgo = (dateString?: string) => {
  if (!dateString) return 'Just now';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
};

const shortId = (id: string) => id.slice(0, 8);

const customerShortCode = (conv?: Conversation | null) => {
  if (!conv) return 'Unknown';
  if (conv.customer?.customerNumber) return `CLT${String(conv.customer.customerNumber).padStart(3, '0')}`;
  const sourceId = conv.customer?.id || conv.customerId || '';
  return `Guest #${shortId(sourceId).toUpperCase()}`;
};

const customerLabel = (conv?: Conversation | null) => {
  if (!conv) return 'Guest User';
  const label = conv.customer?.name || conv.customer?.companyName;
  if (label && label !== 'Guest User') return label;
  if (conv.customer?.isGuest || conv.customer?.email?.includes('@reframe.internal')) return customerShortCode(conv);
  return conv.customer?.email || customerShortCode(conv);
};

const conversationLabel = (conv?: Conversation | null) => `${customerShortCode(conv)} · Chat #${shortId(conv?.id || '').toUpperCase()}`;

const customerDisplayName = (conv?: Conversation | null) => {
  if (!conv) return 'Guest User';
  const name = conv.customer?.name || conv.customer?.companyName || (conv.customer?.isGuest ? 'Guest User' : conv.customer?.email);
  return `${name || 'Guest User'} (${customerShortCode(conv)})`;
};

const latestMessage = (conv: Conversation) => {
  if (!conv.messages?.length) return undefined;
  return [...conv.messages].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
};

const formatMessageTime = (dateString?: string) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
};

const formatMessageDateTime = (dateString?: string) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleString();
};
const SAME_MINUTE_MS = 60 * 1000;
const linkifyText = (text: string) => {
  const regex = /(https?:\/\/[^\s]+)/g;
  return text.split(regex).map((chunk, idx) => (
    /^https?:\/\//.test(chunk)
      ? <a key={`${chunk}-${idx}`} href={chunk} target="_blank" rel="noreferrer" className="break-all underline">{chunk}</a>
      : <React.Fragment key={`${idx}-${chunk.slice(0, 8)}`}>{chunk}</React.Fragment>
  ));
};

const isHumanSupportMessage = (message?: Message) => {
  if (!message || message.role !== 'assistant') return false;
  const meta = parseMessageMetadata(message);
  return meta?.isHuman === true || meta?.source === 'admin-dashboard' || meta?.source === 'telegram';
};

const isAiSupportMessage = (message?: Message) => {
  if (!message || message.role !== 'assistant') return false;
  return !isHumanSupportMessage(message);
};

const isCustomerMessage = (message?: Message) => message?.role === 'user';

const parseMessageMetadata = (message?: Message): Record<string, any> => {
  if (!message?.metadata) return {};
  try {
    return typeof message.metadata === 'string' ? JSON.parse(message.metadata) : message.metadata;
  } catch {
    return {};
  }
};

const getMessageAttachments = (message?: Message): ChatAttachment[] => {
  const attachments = parseMessageMetadata(message).attachments;
  return Array.isArray(attachments) ? attachments.filter((item) => item?.url) : [];
};
const getOrderCard = (message?: Message) => parseMessageMetadata(message)?.orderCard || null;

const formatFileSize = (size?: number) => {
  if (!size) return '';
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

const messagePreview = (message?: Message) => {
  if (!message) return '';
  const attachments = getMessageAttachments(message);
  const text = message.content?.trim();
  if (text) return text;
  if (attachments.length) return `Attached ${attachments.length} file${attachments.length > 1 ? 's' : ''}`;
  return '';
};

const getErrorStatus = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error || '');
  const match = message.match(/\((\d{3})\s+at\s+/);
  return match ? Number(match[1]) : null;
};

const sortConversationsByActivity = (conversations: Conversation[]) =>
  [...conversations].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

const updateConversationInPlace = (existing: Conversation[], conversation: Conversation) => {
  const index = existing.findIndex((item) => item.id === conversation.id);
  if (index === -1) return [conversation, ...existing];
  const next = [...existing];
  next[index] = conversation;
  return next;
};

// Raw minutes stop being readable within a day — "Overdue 12040m" tells an admin
// nothing. Step up to hours and days once the wait is long enough.
const formatElapsed = (minutes: number): string => {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    const remainder = minutes % 60;
    return remainder ? `${hours}h ${remainder}m` : `${hours}h`;
  }
  const days = Math.floor(hours / 24);
  const remainderHours = hours % 24;
  return remainderHours ? `${days}d ${remainderHours}h` : `${days}d`;
};

export const ChatsPage: React.FC = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { conversationId: routeConversationId } = useParams();
  const [searchParams] = useSearchParams();
  const linkedConversationId = routeConversationId || searchParams.get('conversation') || '';
  const prefillOrderId = searchParams.get('orderId') || '';
  const prefillCustomerId = searchParams.get('customerId') || '';

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string>(linkedConversationId);
  const [activeConvDetails, setActiveConvDetails] = useState<Conversation | null>(null);
  const [replyText, setReplyText] = useState(() => localStorage.getItem(`admin_reply_draft_${linkedConversationId}`) || '');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshingChats, setIsRefreshingChats] = useState(false);
  const [serverConversationCount, setServerConversationCount] = useState<number | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [staleTicketId, setStaleTicketId] = useState<string | null>(null);
  const [seenConversationUpdates, setSeenConversationUpdates] = useState<Record<string, string>>({});
  const [unreadDividerAfter, setUnreadDividerAfter] = useState<Record<string, string>>({});
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [openMenuPosition, setOpenMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const [profileConversation, setProfileConversation] = useState<Conversation | null>(null);
  const [hydratingConversationId, setHydratingConversationId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  // Filter and sort are how an admin scopes their queue; resetting them on every
  // reload silently changed which conversations were on screen.
  const [typeFilter, setTypeFilter] = useState<'all' | 'open' | 'unread' | 'needs-reply' | 'active' | 'guest' | 'registered' | 'pinned' | 'archived' | 'assigned'>(
    () => (localStorage.getItem('admin_chats_filter') as any) || 'all'
  );
  const [sortMode, setSortMode] = useState<'newest' | 'unread' | 'active'>(
    () => (localStorage.getItem('admin_chats_sort') as any) || 'newest'
  );

  useEffect(() => { localStorage.setItem('admin_chats_filter', typeFilter); }, [typeFilter]);
  useEffect(() => { localStorage.setItem('admin_chats_sort', sortMode); }, [sortMode]);
  const [searchInput, setSearchInput] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showMobileToolbarMenu, setShowMobileToolbarMenu] = useState(false);
  const [showInChatNotifications, setShowInChatNotifications] = useState(false);
  const [messageActionTarget, setMessageActionTarget] = useState<Message | null>(null);
  const [replyAttachments, setReplyAttachments] = useState<ChatAttachment[]>([]);
  const [previewImage, setPreviewImage] = useState<ChatAttachment | null>(null);
  const [activeRealtime, setActiveRealtime] = useState<ConversationRealtime | null>(null);
  const adminFileInputRef = React.useRef<HTMLInputElement | null>(null);
  const lastFetchErrorToastAt = React.useRef(0);
  const activeConvIdRef = React.useRef(activeConvId);
  const selectionRequestRef = React.useRef(0);
  const threadEndRef = React.useRef<HTMLDivElement | null>(null);
  const threadContainerRef = React.useRef<HTMLDivElement | null>(null);
  const linkedConversationIdRef = React.useRef(linkedConversationId);
  const activeConvDetailsRef = React.useRef(activeConvDetails);
  const conversationsCountRef = React.useRef(conversations.length);
  const isFetchingConversationsRef = React.useRef(false);
  const hasInitializedSeenUpdatesRef = React.useRef(false);
  const suppressAutoOpenRef = React.useRef(false);
  const closedConversationIdRef = React.useRef('');
  const typingTimeoutRef = React.useRef<number | null>(null);
  const [showNewMessageBanner, setShowNewMessageBanner] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState<boolean>(() => (
    typeof window !== 'undefined' ? window.innerWidth < 1024 : false
  ));
  const menuTriggerRef = React.useRef<HTMLButtonElement | null>(null);
  const previousUnreadCountRef = React.useRef(0);
  const hasUnreadAnchorScrolledRef = React.useRef<string | null>(null);
  const lastNotifiedCustomerMessageRef = React.useRef<Record<string, string>>({});
  const notificationHydratedRef = React.useRef(false);
  const chatSseRef = React.useRef<RealtimeSource | null>(null);

  useEffect(() => {
    activeConvIdRef.current = activeConvId;
  }, [activeConvId]);

  useEffect(() => {
    const onResize = () => setIsMobileViewport(window.innerWidth < 1024);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    linkedConversationIdRef.current = linkedConversationId;
  }, [linkedConversationId]);

  useEffect(() => {
    activeConvDetailsRef.current = activeConvDetails;
  }, [activeConvDetails]);

  useEffect(() => {
    conversationsCountRef.current = conversations.length;
  }, [conversations.length]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setSearchQuery(searchInput.trim());
    }, 400);
    return () => window.clearTimeout(handle);
  }, [searchInput]);

  const loadConversationDetails = useCallback(async (id: string, syncUrl = false, silent = false, updateList = false) => {
    if (!id) return false;
    if (syncUrl) closedConversationIdRef.current = '';
    const requestId = ++selectionRequestRef.current;

    try {
      if (!silent) setHydratingConversationId(id);
      const data = await adminFetch<{ conversation: Conversation; realtime?: ConversationRealtime }>(`/support/conversations/${id}`);
      if (data.conversation) {
        if (requestId !== selectionRequestRef.current || (activeConvIdRef.current && activeConvIdRef.current !== id)) {
          return false;
        }
        const isReturningToList =
          (suppressAutoOpenRef.current || closedConversationIdRef.current === id) &&
          linkedConversationIdRef.current !== id &&
          activeConvIdRef.current !== id;
        if (isReturningToList) {
          setConversations((current) => updateConversationInPlace(current, data.conversation));
          return true;
        }

        setStaleTicketId((current) => current === id ? null : current);
        setActiveConvId(id);
        activeConvIdRef.current = id;
        if (syncUrl) navigate(`/admin/chats/${id}`, { replace: true });
        setActiveConvDetails((current) => {
          if (!current || current.id !== data.conversation.id) return data.conversation;
          const currentFingerprint = `${current.updatedAt}:${current.messages.length}:${current.messages.map((m) => m.id || `${m.role}:${m.content}:${m.createdAt}`).join('|')}`;
          const nextFingerprint = `${data.conversation.updatedAt}:${data.conversation.messages.length}:${data.conversation.messages.map((m) => m.id || `${m.role}:${m.content}:${m.createdAt}`).join('|')}`;
          return currentFingerprint === nextFingerprint ? current : data.conversation;
        });
        setSeenConversationUpdates((current) => ({ ...current, [id]: data.conversation.updatedAt }));
        setActiveRealtime(data.realtime || null);
        // A Telegram deep link can point to an older conversation outside the
        // current page of results. Keep that exact ticket visible in the list.
        if (updateList) {
          setConversations((current) => updateConversationInPlace(current, data.conversation));
        }
        return true;
      }
    } catch (error) {
      console.error('Failed to load conversation details:', error);
      const status = getErrorStatus(error);
      const isPermanentFailure = status === 403 || status === 404;

      if (isPermanentFailure) {
        setStaleTicketId((current) => current || id);
        if (!silent) showToast('Error', 'This chat ticket could not be loaded. It will stay listed until an admin removes it.', 'error');
      } else if (!silent) {
        showToast('Error', 'Could not refresh this conversation. Keeping the current chat visible.', 'error');
      }
    } finally {
      if (!silent) setHydratingConversationId((current) => current === id ? null : current);
    }
    return false;
  }, [navigate, showToast]);

  const selectConversation = useCallback((conversation: Conversation) => {
    const previousSeen = seenConversationUpdates[conversation.id];
    const latestMsg = latestMessage(conversation);
    const hasUnreadCustomerMessage = isCustomerMessage(latestMsg) && previousSeen !== conversation.updatedAt;
    activeConvIdRef.current = conversation.id;
    setActiveConvId(conversation.id);
    setReplyText(localStorage.getItem(`admin_reply_draft_${conversation.id}`) || '');
    setActiveConvDetails((current) => {
      if (current?.id === conversation.id) return current;
      return {
        ...conversation,
        messages: conversation.messages?.length ? conversation.messages : [],
      };
    });
    setOpenMenuId(null);
    if (hasUnreadCustomerMessage && previousSeen) {
      setUnreadDividerAfter((current) => ({ ...current, [conversation.id]: previousSeen }));
    } else {
      setUnreadDividerAfter((current) => {
        const next = { ...current };
        delete next[conversation.id];
        return next;
      });
    }
    navigate(`/admin/chats/${conversation.id}`, { replace: true });
    loadConversationDetails(conversation.id, false, true, false);
  }, [loadConversationDetails, navigate, seenConversationUpdates]);

  const fetchConversations = useCallback(async (forceRefresh = false) => {
    if (isFetchingConversationsRef.current && !forceRefresh) return;
    isFetchingConversationsRef.current = true;
    try {
      const params = new URLSearchParams({ limit: '100' });
      if (searchQuery.trim()) params.set('search', searchQuery.trim());
      if (typeFilter === 'active') params.set('active', 'true');
      if (typeFilter === 'guest') params.set('customerType', 'guest');
      if (typeFilter === 'registered') params.set('customerType', 'registered');
      if (typeFilter === 'archived') params.set('status', 'archived');
      if (typeFilter === 'pinned') params.set('pinned', 'true');
      const data = await adminFetch<{ conversations: Conversation[]; totalCount?: number }>(`/support/conversations?${params.toString()}`);
      const fetchedConversations = data.conversations || [];
      // The list is capped at `limit`, so the badge must be able to say "N of M"
      // rather than presenting a page size as if it were the total.
      setServerConversationCount(
        typeof data.totalCount === 'number' ? data.totalCount : fetchedConversations.length
      );
      const currentActiveId = activeConvIdRef.current;
      const currentLinkedId = linkedConversationIdRef.current;
      if (!hasInitializedSeenUpdatesRef.current) {
        hasInitializedSeenUpdatesRef.current = true;
        setSeenConversationUpdates((current) => {
          const next = { ...current };
          fetchedConversations.forEach((conversation) => {
            next[conversation.id] = conversation.updatedAt;
          });
          return next;
        });
      }
      // Replace list with latest server scope so search/sort/filter remain deterministic.
      setConversations(fetchedConversations);

      if (!suppressAutoOpenRef.current && !currentActiveId && currentLinkedId) {
        await loadConversationDetails(currentLinkedId, false, true, true);
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
      const now = Date.now();
      const hasCachedChats = conversationsCountRef.current > 0 || Boolean(activeConvDetailsRef.current);
      if (!hasCachedChats && now - lastFetchErrorToastAt.current > 30000) {
        lastFetchErrorToastAt.current = now;
        showToast('Error', 'Could not refresh conversations. Please check your connection and try again.', 'error');
      }
    } finally {
      isFetchingConversationsRef.current = false;
      setIsLoading(false);
    }
  }, [loadConversationDetails, searchQuery, showToast, typeFilter]);

  const handleRefreshChats = useCallback(async () => {
    setIsRefreshingChats(true);
    setIsLoading(true);
    try {
      await fetchConversations(true);
      if (activeConvIdRef.current) {
        await loadConversationDetails(activeConvIdRef.current, false, true, true);
      }
      showToast('Refreshed', 'Chat list updated', 'success');
    } finally {
      setIsRefreshingChats(false);
      setIsLoading(false);
    }
  }, [fetchConversations, loadConversationDetails, showToast]);

  useEffect(() => {
    if (!linkedConversationId) {
      suppressAutoOpenRef.current = false;
      return;
    }

    if (linkedConversationId && linkedConversationId !== activeConvId) {
      suppressAutoOpenRef.current = false;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadConversationDetails(linkedConversationId, false, false, true);
    }
  }, [activeConvId, linkedConversationId, loadConversationDetails]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchConversations();
    const interval = setInterval(() => fetchConversations(), 10000);
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') fetchConversations();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchConversations]);

  useEffect(() => {
    if (!activeConvId) return;

    // Initial load of conversation details
    loadConversationDetails(activeConvId, false, true);

    // Open SSE connection for real-time updates
    const token = localStorage.getItem('admin_token') || '';
    const es = new RealtimeSource(
      `${API_BASE_URL}/support/chat/stream?conversationId=${encodeURIComponent(activeConvId)}&token=${encodeURIComponent(token)}`
    );
    chatSseRef.current = es;

    es.addEventListener('new_message', (e) => {
      try {
        const { message } = JSON.parse(e.data);
        if (!message) return;
        setActiveConvDetails((current) => {
          if (!current) return current;
          if (current.messages.some((m) => m.id === message.id)) return current;
          return { ...current, messages: [...current.messages, message] };
        });
        // Bubble up to conversation list so updatedAt re-sorts
        setConversations((prev) =>
          prev.map((c) => c.id === activeConvId ? { ...c, updatedAt: new Date().toISOString() } : c)
        );
      } catch { /* ignore parse errors */ }
    });

    es.addEventListener('typing', (e) => {
      try {
        const { role, isTyping } = JSON.parse(e.data);
        if (role === 'user') {
          setActiveRealtime((r) => ({ ...(r || {}), customerTyping: isTyping } as ConversationRealtime));
        }
      } catch { /* ignore */ }
    });

    es.addEventListener('seen', (e) => {
      try {
        const { role, messageId } = JSON.parse(e.data);
        if (role === 'user') {
          setActiveRealtime((r) => ({ ...(r || {}), customerSeen: messageId } as ConversationRealtime));
        }
      } catch { /* ignore */ }
    });

    es.onerror = () => {
      es.close();
      if (chatSseRef.current === es) chatSseRef.current = null;
    };

    return () => {
      es.close();
      if (chatSseRef.current === es) chatSseRef.current = null;
    };
  }, [activeConvId, loadConversationDetails]);

  useEffect(() => {
    if (!activeConvId || !activeConvDetails?.messages?.length) return;
    const latestCustomerMessage = [...activeConvDetails.messages].reverse().find((message) => message.role === 'user');
    if (!latestCustomerMessage?.id) return;
    adminFetch(`/support/conversations/${activeConvId}/seen`, {
      method: 'POST',
      body: JSON.stringify({ messageId: latestCustomerMessage.id }),
    }).catch(() => {});
  }, [activeConvDetails?.id, activeConvDetails?.messages, activeConvId]);

  const activeTicketLink = useMemo(() => {
    if (!activeConvId || typeof window === 'undefined') return '';
    return `${window.location.origin}/admin/chats/${activeConvId}`;
  }, [activeConvId]);

  const menuConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === openMenuId) || null,
    [conversations, openMenuId]
  );

  const handleBackToChats = useCallback(() => {
    const closingId = activeConvIdRef.current;
    suppressAutoOpenRef.current = true;
    closedConversationIdRef.current = closingId;
    activeConvIdRef.current = '';
    linkedConversationIdRef.current = '';
    activeConvDetailsRef.current = null;
    setActiveConvDetails(null);
    setActiveRealtime(null);
    setActiveConvId('');
    navigate('/admin/chats', { replace: true });
  }, [navigate]);

  const handleSendReply = async () => {
    if ((!replyText.trim() && replyAttachments.length === 0) || !activeConvId || isSending) return;
    const content = replyText.trim();
    setIsSending(true);

    try {
      const data = await adminFetch<{ message: Message; success: boolean }>(`/support/conversations/${activeConvId}/reply`, {
        method: 'POST',
        body: JSON.stringify({ content, attachments: replyAttachments }),
      });

      if (data.message) {
        if (typingTimeoutRef.current) {
          window.clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = null;
        }
        adminFetch(`/support/conversations/${activeConvId}/typing`, {
          method: 'POST',
          body: JSON.stringify({ isTyping: false }),
        }).catch(() => {});
        const nextUpdatedAt = new Date().toISOString();
        setActiveConvDetails((current) => current ? {
          ...current,
          messages: [...current.messages, data.message],
          updatedAt: nextUpdatedAt,
          isEscalated: true,
        } : current);
        setSeenConversationUpdates((current) => ({ ...current, [activeConvId]: nextUpdatedAt }));
        setReplyText('');
        localStorage.removeItem(`admin_reply_draft_${activeConvId}`);
        setReplyAttachments([]);
        showToast('Reply Sent', `Sent to ${customerLabel(activeConvDetails)}`, 'success');
        fetchConversations();
      }
    } catch (error) {
      console.error('Failed to send reply:', error);
      showToast('Error', 'Failed to send reply', 'error');
    } finally {
      setIsSending(false);
    }
  };
  const handleSendOrderCard = async (targetOrderId?: string) => {
    const orderId = String(targetOrderId || '').trim();
    if (!activeConvId || !orderId || isSending) return;
    setIsSending(true);
    try {
      const order = await adminFetch<any>(`/orders/${orderId}`);
      await adminFetch<{ message: Message; success: boolean }>(`/support/conversations/${activeConvId}/reply`, {
        method: 'POST',
        body: JSON.stringify({
          content: `Order update: ${order?.code || orderId}`,
          metadata: {
            orderCard: {
              orderId: order.id,
              code: order.code,
              title: order.title,
              status: order.status,
              customerLink: `${window.location.origin}/order?id=${encodeURIComponent(order.id)}`
            }
          }
        }),
      });
      await loadConversationDetails(activeConvId, false, true, true);
      showToast('Sent', 'Order card sent to chat', 'success');
    } catch (error) {
      showToast('Error', 'Failed to send order card', 'error');
    } finally {
      setIsSending(false);
    }
  };

  useEffect(() => {
    if (!prefillOrderId || !prefillCustomerId || !conversations.length) return;
    const match = conversations.find((c) => c.customerId === prefillCustomerId);
    if (!match) return;
    if (activeConvId !== match.id) {
      selectConversation(match);
      return;
    }
    handleSendOrderCard(prefillOrderId);
    navigate('/admin/chats', { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefillOrderId, prefillCustomerId, conversations, activeConvId]);

  useEffect(() => {
    const container = threadContainerRef.current;
    if (!container) return;
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    const nearBottom = distanceFromBottom < 120;
    const shouldAutoScroll = nearBottom || isSending;
    if (shouldAutoScroll) {
      threadEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      setShowNewMessageBanner(false);
      return;
    }
    setShowNewMessageBanner(true);
  }, [activeConvDetails?.id, activeConvDetails?.messages.length, isSending]);

  const copyTicketLink = async () => {
    if (!activeTicketLink) return;
    await navigator.clipboard.writeText(activeTicketLink);
    showToast('Copied', 'Chat ticket link copied', 'success');
  };

  const toggleThreadMenu = (conversationId: string, e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    menuTriggerRef.current = e.currentTarget;
    if (openMenuId === conversationId) {
      setOpenMenuId(null);
      setOpenMenuPosition(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    setOpenMenuPosition({ top: rect.bottom + 6, left: Math.max(8, rect.right - 192) });
    setOpenMenuId(conversationId);
  };

  useEffect(() => {
    if (!openMenuId) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenMenuId(null);
        setOpenMenuPosition(null);
        menuTriggerRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openMenuId]);

  const markConversationRead = (conversation: Conversation, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSeenConversationUpdates((current) => ({ ...current, [conversation.id]: conversation.updatedAt }));
    setUnreadDividerAfter((current) => {
      const next = { ...current };
      delete next[conversation.id];
      return next;
    });
    setOpenMenuId(null);
  };

  const markConversationUnread = (conversation: Conversation, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSeenConversationUpdates((current) => ({ ...current, [conversation.id]: '' }));
    setOpenMenuId(null);
  };

  const updateConversationState = async (conversation: Conversation, action: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      const data = await adminFetch<{ conversation: Conversation; success: boolean }>(`/support/conversations/${conversation.id}/state`, {
        method: 'PATCH',
        body: JSON.stringify({ action }),
      });
      const nextConversation = { ...conversation, ...data.conversation };
      setConversations((current) => action === 'delete'
        ? current.filter((item) => item.id !== conversation.id)
        : updateConversationInPlace(current, nextConversation));
      if (activeConvDetails?.id === conversation.id) {
        setActiveConvDetails(action === 'delete' ? null : { ...activeConvDetails, ...data.conversation });
      }
      if (action === 'read') markConversationRead(nextConversation);
      if (action === 'unread') markConversationUnread(nextConversation);
      setOpenMenuId(null);
      setOpenMenuPosition(null);
      showToast('Updated', `Chat ${action.replace('un', 'un-')} complete`, 'success');
    } catch (error) {
      console.error('Failed to update chat state:', error);
      showToast('Error', 'Could not update this chat', 'error');
    }
  };

  const uploadAdminFiles = async (files: File[]) => {
    const token = localStorage.getItem('admin_token');
    const uploaded: ChatAttachment[] = [];
    for (const file of files.slice(0, 8)) {
      const formData = new FormData();
      formData.append('file', file);
      const response = await uploadFetch(`${API_BASE_URL}/portal/upload`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: formData,
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || 'Upload failed');
      uploaded.push({
        url: result.data.url,
        filename: result.data.filename || file.name,
        size: result.data.size || file.size,
        type: file.type,
        path: result.data.path,
        folderPath: result.data.folderPath,
      });
    }
    return uploaded;
  };

  const addAdminFiles = async (files: File[]) => {
    if (!files.length) return;
    try {
      setIsSending(true);
      const uploaded = await uploadAdminFiles(files);
      setReplyAttachments((current) => [...current, ...uploaded]);
      showToast('Uploaded', `${uploaded.length} file(s) ready to send`, 'success');
    } catch (error) {
      console.error('Admin upload failed:', error);
      showToast('Upload failed', 'Could not upload one or more files', 'error');
    } finally {
      setIsSending(false);
    }
  };

  const handleAdminFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    await addAdminFiles(files);
  };

  const startAdminVoiceTyping = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showToast('Voice typing unavailable', 'This browser does not support speech recognition.', 'error');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognition.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript || '';
      if (transcript) setReplyText((current) => `${current}${current ? ' ' : ''}${transcript}`);
    };
    recognition.start();
  };

  const handleReplyChange = (value: string) => {
    setReplyText(value);
    if (!activeConvId) return;
    if (value) {
      localStorage.setItem(`admin_reply_draft_${activeConvId}`, value);
    } else {
      localStorage.removeItem(`admin_reply_draft_${activeConvId}`);
    }

    adminFetch(`/support/conversations/${activeConvId}/typing`, {
      method: 'POST',
      body: JSON.stringify({ isTyping: value.trim().length > 0 }),
    }).catch(() => {});

    if (typingTimeoutRef.current) {
      window.clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = window.setTimeout(() => {
      adminFetch(`/support/conversations/${activeConvId}/typing`, {
        method: 'POST',
        body: JSON.stringify({ isTyping: false }),
      }).catch(() => {});
    }, 2500);
  };

  useEffect(() => () => {
    if (typingTimeoutRef.current) {
      window.clearTimeout(typingTimeoutRef.current);
    }
  }, []);

  const profileFields = profileConversation ? [
    ['User ID', profileConversation.customer?.id || profileConversation.customerId],
    ['Customer Code', customerShortCode(profileConversation)],
    ['Conversation', conversationLabel(profileConversation)],
    ['Name', profileConversation.customer?.name || profileConversation.customer?.companyName || 'Guest User'],
    ['Email', profileConversation.customer?.email || profileConversation.customer?.contactEmail || 'Not captured'],
    ['Phone', profileConversation.customer?.contactPhone || 'Not captured'],
    ['Activity', profileConversation.customer?.activeStatus === 'active' ? 'Active now' : `Last active ${profileConversation.customer?.lastActiveAt ? getTimeAgo(profileConversation.customer.lastActiveAt) : 'unknown'}`],
    ['Location / Address', 'Not captured'],
    ['Country', 'Not captured'],
    ['Local time', new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })],
  ] : [];

  const getNeedsReply = useCallback((conv: Conversation) => {
    const latestMsg = latestMessage(conv);
    return Boolean(latestMsg && latestMsg.role === 'user');
  }, []);

  const getUnreadForConversation = useCallback((conv: Conversation) => {
    const latestMsg = latestMessage(conv);
    if (!latestMsg) return false;
    if (latestMsg.role !== 'user') return false;
    if (activeConvDetails?.id === conv.id) return false;
    const localSeenAt = seenConversationUpdates[conv.id] ? new Date(seenConversationUpdates[conv.id]).getTime() : 0;
    const adminReadAt = conv.adminReadAt ? new Date(conv.adminReadAt).getTime() : 0;
    const seenAt = Math.max(localSeenAt, adminReadAt);
    return new Date(latestMsg.createdAt).getTime() > seenAt;
  }, [activeConvDetails, seenConversationUpdates]);

  const getSlaState = useCallback((conv: Conversation): { label: string; tone: 'green' | 'amber' | 'red' } | null => {
    if (!getNeedsReply(conv)) return null;
    const latestMsg = latestMessage(conv);
    if (!latestMsg) return null;
    const minutes = Math.max(0, Math.floor((Date.now() - new Date(latestMsg.createdAt).getTime()) / 60000));
    const elapsed = formatElapsed(minutes);
    if (minutes >= 15) return { label: `Overdue ${elapsed}`, tone: 'red' };
    if (minutes >= 7) return { label: `Waiting ${elapsed}`, tone: 'amber' };
    return { label: `Waiting ${elapsed}`, tone: 'green' };
  }, [getNeedsReply]);

  const visibleConversations = useMemo(() => {
    const filtered = conversations.filter((conv) => {
      const unread = getUnreadForConversation(conv);
      const needsReply = getNeedsReply(conv);
      if (typeFilter === 'open' && conv.archivedAt) return false;
      if (typeFilter === 'unread' && !unread) return false;
      if (typeFilter === 'needs-reply' && !needsReply) return false;
      if (typeFilter === 'active' && conv.customer?.activeStatus !== 'active') return false;
      if (typeFilter === 'guest' && !conv.customer?.isGuest) return false;
      if (typeFilter === 'registered' && conv.customer?.isGuest) return false;
      if (typeFilter === 'pinned' && !conv.pinnedAt) return false;
      if (typeFilter === 'archived' && !conv.archivedAt) return false;
      if (typeFilter === 'assigned') {
        const mine = String(localStorage.getItem('admin_user_id') || '');
        if (!mine || conv.assignedTo !== mine) return false;
      }
      return true;
    });

    return [...filtered].sort((a, b) => {
      const pinnedDiff = Number(Boolean(b.pinnedAt)) - Number(Boolean(a.pinnedAt));
      if (pinnedDiff) return pinnedDiff;
      if (sortMode === 'unread') {
        const aUnread = getUnreadForConversation(a);
        const bUnread = getUnreadForConversation(b);
        const unreadDiff = Number(bUnread) - Number(aUnread);
        if (unreadDiff) return unreadDiff;
      }
      if (sortMode === 'active') {
        const activeDiff = Number((b.customer as any)?.activeStatus === 'active') - Number((a.customer as any)?.activeStatus === 'active');
        if (activeDiff) return activeDiff;
        const unreadDiff = Number(getUnreadForConversation(b)) - Number(getUnreadForConversation(a));
        if (unreadDiff) return unreadDiff;
      }
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [conversations, getNeedsReply, getUnreadForConversation, sortMode, typeFilter]);

  const showMobileConversationMode = isMobileViewport && Boolean(activeConvDetails);
  useEffect(() => {
    const cls = 'an-chat-mobile-in-conversation';
    if (showMobileConversationMode) document.body.classList.add(cls);
    else document.body.classList.remove(cls);
    return () => document.body.classList.remove(cls);
  }, [showMobileConversationMode]);

  const unreadCount = useMemo(() => conversations.filter((conv) => getUnreadForConversation(conv)).length, [conversations, getUnreadForConversation]);

  useEffect(() => {
    document.title = unreadCount > 0 ? `(${unreadCount}) Reframe Dashboard` : 'Reframe Dashboard';
  }, [unreadCount]);

  useEffect(() => {
    if (!notificationHydratedRef.current) {
      conversations.forEach((conv) => {
        const latestMsg = latestMessage(conv);
        if (!latestMsg) return;
        lastNotifiedCustomerMessageRef.current[conv.id] = `${latestMsg.id}:${latestMsg.createdAt}`;
      });
      notificationHydratedRef.current = true;
      previousUnreadCountRef.current = unreadCount;
      return;
    }

    const newlyUnread = conversations.filter((conv) => {
      const latestMsg = latestMessage(conv);
      if (!latestMsg || latestMsg.role !== 'user') return false;
      if (seenConversationUpdates[conv.id] === conv.updatedAt) return false;
      const fingerprint = `${latestMsg.id}:${latestMsg.createdAt}`;
      if (lastNotifiedCustomerMessageRef.current[conv.id] === fingerprint) return false;
      lastNotifiedCustomerMessageRef.current[conv.id] = fingerprint;
      return true;
    });

    if (newlyUnread.length === 0) {
      previousUnreadCountRef.current = unreadCount;
      return;
    }

    if (soundEnabled) {
      try {
        const AudioContextCtor = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextCtor) {
          const ctx = new AudioContextCtor();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.frequency.value = 780;
          gain.gain.setValueAtTime(0.0001, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.06, ctx.currentTime + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.18);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.2);
          window.setTimeout(() => ctx.close().catch(() => {}), 250);
        }
      } catch {}
    }

    if (notificationsEnabled && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      const first = newlyUnread[0];
      const firstMsg = latestMessage(first);
      if (firstMsg?.content) {
        new Notification(customerDisplayName(first), {
          body: firstMsg.content.slice(0, 120),
          tag: `chat-${first.id}`,
        });
      }
    }

    previousUnreadCountRef.current = unreadCount;
  }, [conversations, notificationsEnabled, seenConversationUpdates, soundEnabled, unreadCount]);

  useEffect(() => {
    if (!activeConvDetails?.id || !threadContainerRef.current) return;
    if (hasUnreadAnchorScrolledRef.current === activeConvDetails.id) return;
    const anchor = threadContainerRef.current.querySelector<HTMLElement>(`[data-unread-anchor="${activeConvDetails.id}"]`);
    if (!anchor) return;
    anchor.scrollIntoView({ behavior: 'smooth', block: 'start' });
    hasUnreadAnchorScrolledRef.current = activeConvDetails.id;
  }, [activeConvDetails?.id, unreadDividerAfter]);

  return (
    <div className={`an-chat-page h-[calc(100dvh-64px)] flex flex-col ${activeConvDetails ? 'has-active-chat' : ''}`}>
      {!showMobileConversationMode && (
      <div className="shrink-0 border-b border-black/10 bg-white px-4 py-3 space-y-2">
        {/* Row 1 — title + action controls */}
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-semibold text-[#171717]">
            Chats
            {visibleConversations.length > 0 && (
              <span
                className="ml-1.5 rounded-full bg-black/[0.07] px-1.5 py-0.5 text-[11px] font-medium text-[#555]"
                title={
                  serverConversationCount !== null && serverConversationCount > visibleConversations.length
                    ? `Showing ${visibleConversations.length} of ${serverConversationCount} conversations in this filter`
                    : `${visibleConversations.length} conversations in this filter`
                }
              >
                {serverConversationCount !== null && serverConversationCount > visibleConversations.length
                  ? `${visibleConversations.length} of ${serverConversationCount}`
                  : visibleConversations.length}
              </span>
            )}
          </span>
          <div className="flex items-center gap-1.5">
            {unreadCount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full border border-orange-200 bg-orange-50 px-2 py-0.5 text-[11px] font-semibold text-orange-700">
                <Bell size={11} />
                {unreadCount} unread
              </span>
            )}
            <button
              type="button"
              onClick={async () => {
                if (typeof Notification === 'undefined') return;
                if (Notification.permission === 'granted') {
                  setNotificationsEnabled((v) => !v);
                  return;
                }
                const result = await Notification.requestPermission();
                if (result === 'granted') {
                  setNotificationsEnabled(true);
                  try {
                    if ('serviceWorker' in navigator && 'PushManager' in window) {
                      const vapidPublicKey = (import.meta.env.VITE_PUSH_PUBLIC_KEY || '').trim();
                      if (vapidPublicKey) {
                        const registration = await navigator.serviceWorker.register('/push-sw.js');
                        let subscription = await registration.pushManager.getSubscription();
                        if (!subscription) {
                          subscription = await registration.pushManager.subscribe({
                            userVisibleOnly: true,
                            applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
                          });
                        }
                        await adminFetch('/push/subscribe', {
                          method: 'POST',
                          body: JSON.stringify(subscription),
                        });
                      }
                    }
                  } catch {
                    // best-effort only
                  }
                }
              }}
              className={`inline-flex h-[28px] w-[28px] items-center justify-center rounded-lg border text-[11px] transition-colors ${notificationsEnabled ? 'border-black bg-black text-white' : 'border-black/15 bg-white text-[#666] hover:bg-black/[0.04]'}`}
              aria-label="Toggle browser notifications"
              title={notificationsEnabled ? 'Notifications on' : 'Notifications off'}
            >
              {notificationsEnabled ? <Bell size={13} /> : <BellOff size={13} />}
            </button>
            <button
              type="button"
              onClick={() => setSoundEnabled((v) => !v)}
              className={`inline-flex h-[28px] w-[28px] items-center justify-center rounded-lg border text-[11px] transition-colors ${soundEnabled ? 'border-black bg-black text-white' : 'border-black/15 bg-white text-[#666] hover:bg-black/[0.04]'}`}
              aria-label="Toggle sound alerts"
              title={soundEnabled ? 'Sound on' : 'Sound off'}
            >
              {soundEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
            </button>
            <button
              type="button"
              onClick={handleRefreshChats}
              disabled={isRefreshingChats}
              className="inline-flex h-[28px] w-[28px] items-center justify-center rounded-lg border border-black/15 bg-white text-[#666] hover:bg-black/[0.04] disabled:opacity-50 transition-colors"
              aria-label="Refresh chats"
              title="Refresh"
            >
              <RefreshCw size={13} className={(isLoading || isRefreshingChats) ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
        {/* Row 2 — search + filter + sort */}
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-black/10 bg-white px-3 py-[7px] text-xs text-[#777] focus-within:border-black/25">
            <Search size={13} className="shrink-0" />
            <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search chats..." className="min-w-0 flex-1 bg-transparent text-[#171717] outline-none text-[12px]" />
          </label>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as any)} className="h-[32px] shrink-0 rounded-lg border border-black/10 bg-white px-2 text-[11px] text-[#333] outline-none">
            <option value="all">All chats</option>
            <option value="open">Open</option>
            <option value="unread">Unread</option>
            <option value="needs-reply">Needs Reply</option>
            <option value="active">Active Now</option>
            <option value="guest">Guests</option>
            <option value="registered">Registered</option>
            <option value="pinned">Pinned</option>
            <option value="archived">Archived</option>
            <option value="assigned">Assigned to me</option>
          </select>
          <select value={sortMode} onChange={(e) => setSortMode(e.target.value as any)} className="h-[32px] shrink-0 rounded-lg border border-black/10 bg-white px-2 text-[11px] text-[#333] outline-none">
            <option value="newest">Newest</option>
            <option value="unread">Unread first</option>
            <option value="active">Active first</option>
          </select>
        </div>
      </div>
      )}

      <div className="an-inbox-wrap an-chat-shell flex-1 min-h-0 flex flex-col lg:flex-row">
        {!showMobileConversationMode && (
        <div className={`an-inbox-list an-chat-list w-full flex-1 lg:flex-none lg:w-[360px] overflow-y-auto border-r border-black/10 ${activeConvDetails ? 'has-mobile-selection' : ''}`}>
          <div className="an-inbox-body p-0">
            {isLoading && conversations.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#999]">Loading chats...</div>
            ) : visibleConversations.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#999]">
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-black/[0.04]">
                  <MessageSquare size={16} className="text-[#777]" />
                </div>
                <div className="font-semibold text-[#555]">No active conversations</div>
                <div className="mt-1 leading-relaxed">New customer chat tickets will appear here automatically.</div>
              </div>
            ) : (
              visibleConversations.map(conv => {
                const latestMsg = latestMessage(conv);
                const isActive = activeConvId === conv.id;
                const isUnread = !isActive && isCustomerMessage(latestMsg) && seenConversationUpdates[conv.id] !== conv.updatedAt;
                const needsReply = getNeedsReply(conv);
                const sla = getSlaState(conv);
                const latestAttachments = getMessageAttachments(latestMsg);
                return (
                  <div
                    key={conv.id}
                    role="button"
                    tabIndex={0}
                    className={`an-msg group block w-full max-w-full overflow-hidden box-border text-left ${isActive ? 'active' : ''} ${isUnread ? 'unread' : ''}`}
                    onClick={() => selectConversation(conv)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        selectConversation(conv);
                      }
                    }}
                    style={{ cursor: 'pointer', padding: '16px', borderBottom: '1px solid var(--an-border)' }}
                  >
                    <div className="an-msg-from flex justify-between items-center gap-3 mb-1 min-w-0">
                      <span className={`min-w-0 flex-1 text-[13px] truncate pr-2 ${isUnread ? 'font-bold text-[#171717]' : 'font-semibold'}`}>
                        {isUnread && <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-orange-400 align-middle shadow-[0_0_0_3px_rgba(251,146,60,0.14)]" />}
                        {conv.pinnedAt && <Star size={12} className="mr-1 inline-block fill-amber-400 text-amber-500 align-middle" />}
                        {conv.customer?.activeStatus === 'active' && <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-emerald-500 align-middle shadow-[0_0_0_3px_rgba(16,185,129,0.14)]" />}
                        {customerDisplayName(conv)}
                      </span>
                      <span className={`an-msg-time text-[11px] shrink-0 ${isUnread ? 'font-semibold text-orange-600' : 'text-[#999]'}`}>{getTimeAgo(conv.updatedAt)}</span>
                    </div>
                    <div className={`an-msg-prev text-[12px] mb-1 whitespace-nowrap overflow-hidden text-ellipsis ${isUnread ? 'font-bold text-[#171717]' : 'text-[#666]'}`}>
                      {latestMsg
                        ? `${latestMsg.role === 'user' ? 'Customer:' : isAiSupportMessage(latestMsg) ? 'AI:' : 'Admin:'} ${messagePreview(latestMsg)}`
                        : (conv.title || `Chat Ticket ${shortId(conv.id)}`)}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <span className="rounded-full bg-black/[0.04] px-2 py-0.5 text-[10px] font-semibold text-[#555]">
                        {conv.customer?.isGuest ? 'Guest' : 'Registered'}
                      </span>
                      {needsReply && (
                        <span className="rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-semibold text-orange-700">Needs reply</span>
                      )}
                      {sla && (
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          sla.tone === 'red' ? 'bg-red-50 text-red-700' : sla.tone === 'amber' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
                        }`}>
                          {sla.label}
                        </span>
                      )}
                      {latestAttachments.length > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                          <Paperclip size={10} /> {latestAttachments.length}
                        </span>
                      )}
                    </div>
                    <div className="absolute right-3 top-3">
                      <button
                        type="button"
                        onClick={(e) => toggleThreadMenu(conv.id, e)}
                        className="rounded-full p-1 text-[#777] opacity-0 transition-opacity hover:bg-black/5 group-hover:opacity-100"
                        aria-label="Thread options"
                      >
                        <MoreVertical size={15} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
        )}

        {(!isMobileViewport || activeConvDetails) && <div className={`an-inbox-detail an-chat-detail flex flex-col flex-1 h-full bg-[#FAFAFA] min-w-0 ${activeConvDetails ? 'has-mobile-selection' : ''}`}>
          {activeConvDetails ? (
            <>
              <div className={`an-detail-head sticky top-0 z-10 shrink-0 bg-white border-b border-black/5 ${showMobileConversationMode ? 'px-3 py-2' : ''}`} style={{ padding: showMobileConversationMode ? undefined : '10px 16px' }}>
                {showMobileConversationMode ? (
                  <div className="flex items-center gap-2">
                    <button className="inline-flex h-11 w-11 -ml-1 items-center justify-center text-[20px] font-bold text-[#333]" onClick={handleBackToChats} aria-label="Back to chats">
                      ←
                    </button>
                    <div className="min-w-0 flex-1 truncate text-[13px] font-semibold text-[#171717]">{customerDisplayName(activeConvDetails)}</div>
                    <div className="relative">
                      <button
                        onClick={() => setShowInChatNotifications((v) => !v)}
                        className="inline-flex items-center justify-center p-1.5 text-[#555]"
                        aria-label="Notifications"
                        title="Notifications"
                      >
                        <Bell size={16} />
                        {unreadCount > 0 && <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-red-500" />}
                      </button>
                      {showInChatNotifications && (
                        <div className="absolute right-0 top-full z-[260] mt-2 w-72 overflow-hidden rounded-xl border border-black/10 bg-white shadow-xl">
                          <div className="border-b border-black/10 px-3 py-2 text-[12px] font-semibold">Notifications</div>
                          <div className="max-h-72 overflow-y-auto">
                            {conversations.filter((conv) => getUnreadForConversation(conv)).slice(0, 8).map((conv) => {
                              const latestMsg = latestMessage(conv);
                              return (
                                <button
                                  key={conv.id}
                                  type="button"
                                  className="block w-full border-b border-black/5 px-3 py-2 text-left last:border-b-0 hover:bg-black/[0.03]"
                                  onClick={() => {
                                    setShowInChatNotifications(false);
                                    selectConversation(conv);
                                  }}
                                >
                                  <div className="truncate text-[12px] font-semibold">{customerDisplayName(conv)}</div>
                                  <div className="truncate text-[11px] text-[#666]">{latestMsg ? messagePreview(latestMsg) : 'New message'}</div>
                                </button>
                              );
                            })}
                            {conversations.filter((conv) => getUnreadForConversation(conv)).length === 0 && (
                              <div className="px-3 py-4 text-center text-[11px] text-[#777]">No unread chat notifications</div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => setProfileConversation(activeConvDetails)}
                      className="inline-flex items-center justify-center p-1.5 text-[#555]"
                      aria-label="Conversation info"
                      title="Conversation info"
                    >
                      <Info size={16} />
                    </button>
                  </div>
                ) : (
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="truncate text-[14px] font-semibold text-[#171717]">
                        {activeConvDetails.customer?.activeStatus === 'active' && <span className="h-2 w-2 rounded-full bg-emerald-500" />}
                        {customerDisplayName(activeConvDetails)}
                      </span>
                      <span className="shrink-0 rounded-full bg-black/[0.05] px-2 py-0.5 text-[10px] font-semibold text-[#555]">{customerShortCode(activeConvDetails)}</span>
                      <span className="hidden shrink-0 text-[11px] text-[#777] sm:inline">{activeConvDetails.customer?.activeStatus === 'active' ? 'Active now' : 'Inactive'}</span>
                    </div>
                    <div className="hidden truncate text-[11px] text-[#777] sm:block">Ticket #{shortId(activeConvDetails.id)} · {activeConvDetails.title || 'Customer conversation'}</div>
                  </div>
                  <div className="an-chat-actions flex shrink-0 items-center gap-1.5">
                    <button
                      onClick={() => setProfileConversation(activeConvDetails)}
                      className="inline-flex items-center justify-center rounded-full border border-black/10 bg-white p-2 text-[#555] hover:border-black/30"
                      aria-label="Customer info"
                    >
                      <Info size={13} />
                      {showMobileConversationMode ? <span className="ml-1 text-[11px] font-semibold">Info</span> : null}
                    </button>
                  </div>
                </div>
                )}
                <div className={`mt-2 ${showMobileConversationMode ? 'hidden' : 'hidden lg:flex flex-wrap items-center gap-2 text-[11px] text-[#777]'}`}>
                  <span>{conversationLabel(activeConvDetails)}</span>
                  <span>·</span>
                  <span className="inline-flex items-center gap-1"><Mail size={12} /> {activeConvDetails.customer?.email || 'No email provided'}</span>
                  <span>·</span>
                  <span className="inline-flex items-center gap-1"><Phone size={12} /> {activeConvDetails.customer?.contactPhone || 'No phone'}</span>
                  <span>·</span>
                  <span className="inline-flex items-center gap-1"><Clock size={12}/> {activeConvDetails.customer?.activeStatus === 'active' ? 'Active now' : `Last active ${activeConvDetails.customer?.lastActiveAt ? getTimeAgo(activeConvDetails.customer.lastActiveAt) : 'unknown'}`}</span>
                </div>
              </div>

              <div ref={threadContainerRef} className={`an-chat-thread relative flex-1 overflow-y-auto space-y-2 ${showMobileConversationMode ? 'p-3 pb-4' : 'p-4 md:p-6'}`}>
                {hydratingConversationId === activeConvDetails.id && activeConvDetails.messages.length > 0 && (
                  <div className="text-center text-[10px] font-medium text-[#999]">Loading history...</div>
                )}
                {activeConvDetails.messages.map((msg, i) => {
                  const isUser = msg.role === 'user';
                  const isHumanSupport = isHumanSupportMessage(msg);
                  const isAiSupport = isAiSupportMessage(msg);
                  const attachments = getMessageAttachments(msg);
                  const orderCard = getOrderCard(msg);
                  const previousMsg = activeConvDetails.messages[i - 1];
                  const nextMsg = activeConvDetails.messages[i + 1];
                  const showDateGroup = !previousMsg || new Date(previousMsg.createdAt).toDateString() !== new Date(msg.createdAt).toDateString();
                  const dividerAfter = unreadDividerAfter[activeConvDetails.id];
                  const showUnreadDivider = Boolean(dividerAfter && isUser && new Date(msg.createdAt).getTime() > new Date(dividerAfter).getTime() && (i === 0 || new Date(activeConvDetails.messages[i - 1].createdAt).getTime() <= new Date(dividerAfter).getTime()));
                  const sameMinuteAsNext = Boolean(nextMsg && nextMsg.role === msg.role && Math.abs(new Date(nextMsg.createdAt).getTime() - new Date(msg.createdAt).getTime()) < SAME_MINUTE_MS);
                  const showMetaRow = !sameMinuteAsNext;
                  return (
                    <React.Fragment key={msg.id || i}>
                      {showDateGroup && <div className="text-center text-[10px] font-bold uppercase tracking-wide text-[#aaa]">{new Date(msg.createdAt).toLocaleDateString()}</div>}
                      {showUnreadDivider && <div data-unread-anchor={activeConvDetails.id} className="flex items-center gap-3 py-1"><div className="h-px flex-1 bg-red-200" /><span className="text-[10px] font-bold uppercase tracking-wide text-red-600">Unread messages</span><div className="h-px flex-1 bg-red-200" /></div>}
                      <div className={`flex flex-col ${isUser ? 'items-start' : 'items-end'}`}>
                        <div className={`flex ${isUser ? 'justify-start' : 'justify-end'} w-full`}>
                          <div
                            className={`max-w-[92%] md:max-w-[70%] rounded-2xl text-[14px] ${
                            isUser
                              ? 'px-4 py-3 bg-white border border-black/10 text-[#171717] shadow-sm'
                              : isAiSupport
                                ? 'overflow-hidden bg-white border border-black/[0.08] text-[#171717] shadow-sm'
                                : 'px-4 py-3 bg-[#171717] text-white'
                          }`}
                            onContextMenu={(e) => {
                              if (!showMobileConversationMode) return;
                              e.preventDefault();
                              setMessageActionTarget(msg);
                            }}
                          >
                            {isAiSupport && (
                              <div className="flex items-center gap-1.5 px-4 py-2 border-b border-black/[0.06]">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#171717] shrink-0" />
                                <span className="text-[10px] font-semibold text-[#171717] tracking-tight">Reframe CS</span>
                                <span className="ml-auto text-[9px] font-bold uppercase tracking-widest text-[#aaa]">AI</span>
                              </div>
                            )}
                            <div className={isAiSupport ? 'px-4 py-3' : ''}>
                              {msg.content && (isUser ? <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>{linkifyText(msg.content)}</div> : <MarkdownRenderer content={msg.content} />)}
                              {orderCard && (
                                <a href={orderCard.customerLink} target="_blank" rel="noreferrer" className={`mt-3 block rounded-xl border p-3 text-xs ${(isUser || isAiSupport) ? 'border-black/10 bg-black/[0.03]' : 'border-white/20 bg-white/10'}`}>
                                  <div className="font-semibold">{orderCard.code || orderCard.orderId}</div>
                                  <div className="mt-1">{orderCard.title || 'Order details'}</div>
                                  <div className="mt-1 opacity-70">Status: {orderCard.status || 'new'}</div>
                                  <div className="mt-2 font-semibold underline">View order</div>
                                </a>
                              )}
                              {attachments.length > 0 && (
                                <div className="mt-3 space-y-2">
                                  {attachments.map((attachment) => {
                                    const isImage = attachment.type?.startsWith('image/') || /\.(png|jpe?g|gif|webp|tiff?)$/i.test(attachment.filename);
                                    return (
                                      <div key={attachment.url} className={`rounded-xl border p-2 ${(isUser || isAiSupport) ? 'border-black/10 bg-black/[0.03]' : 'border-white/20 bg-white/10'}`}>
                                        {isImage && <button type="button" onClick={() => setPreviewImage(attachment)} className="mb-2 block overflow-hidden rounded-lg"><img src={attachment.url} alt={attachment.filename} className="max-h-48 max-w-full object-cover" /></button>}
                                        <div className="flex items-center gap-2">
                                          {isImage ? <ImageIcon size={15} /> : <FileText size={15} />}
                                          <span className="min-w-0 flex-1 truncate text-xs font-semibold">{attachment.filename}</span>
                                          <span className="text-[10px] opacity-60">{formatFileSize(attachment.size)}</span>
                                          <a href={attachment.url} download target="_blank" rel="noreferrer" className="rounded-full p-1 hover:bg-black/10"><Download size={14} /></a>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        {showMetaRow && <div className="mt-1 w-full">
                          <div className={`flex w-full ${isUser ? 'justify-start' : 'justify-end'}`}>
                            <div className={`flex min-h-[18px] items-center gap-1.5 text-[10px] text-[#7b7b7b] ${showMobileConversationMode ? '' : 'group'}`}>
                              <span className={`leading-none ${showMobileConversationMode ? '' : 'group-hover:hidden group-focus-within:hidden'}`} title={formatMessageDateTime(msg.createdAt)}>{formatMessageTime(msg.createdAt)}</span>
                              <span className={`leading-none ${showMobileConversationMode ? 'hidden' : 'hidden group-hover:inline group-focus-within:inline'} max-w-[260px] truncate`} title={formatMessageDateTime(msg.createdAt)}>{formatMessageDateTime(msg.createdAt)}</span>
                              {!isUser && isHumanSupport && (() => {
                                const isSeen = activeRealtime?.customerSeen?.messageId === msg.id;
                                const receiptLabel = isSeen ? 'Seen' : 'Delivered';
                                return (
                                  <span className={`inline-flex items-center gap-1 leading-none ${isSeen ? 'text-blue-600' : 'text-[#7b7b7b]'}`} aria-label={receiptLabel} title={receiptLabel}>
                                    {isSeen ? <CheckCheck size={12} /> : <CheckCheck size={12} />}
                                    <span className="text-[10px]">{receiptLabel.toLowerCase()}</span>
                                  </span>
                                );
                              })()}
                              {!showMobileConversationMode && <button type="button" onClick={() => navigator.clipboard.writeText(msg.content || '')} className="hidden h-4 w-4 items-center justify-center rounded-full p-0 text-[#8b8b8b] hover:bg-black/10 hover:text-[#333] group-hover:inline-flex group-focus-within:inline-flex" aria-label="Copy message" title="Copy message"><Copy size={10} /></button>}
                            </div>
                          </div>
                        </div>}
                      </div>
                    </React.Fragment>
                  );
                })}
                {Boolean(activeRealtime?.customerTyping) && (
                  <div className="flex justify-start">
                    <div className="rounded-2xl border border-black/10 bg-white px-4 py-2 text-[12px] text-[#666] shadow-sm">
                      Customer is typing...
                    </div>
                  </div>
                )}
                {showNewMessageBanner && (
                  <button
                    type="button"
                    onClick={() => {
                      threadEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
                      setShowNewMessageBanner(false);
                    }}
                    className="sticky bottom-3 mx-auto block rounded-full bg-black px-3 py-1.5 text-[11px] font-semibold text-white shadow-lg"
                  >
                    New message ↓
                  </button>
                )}
                <div ref={threadEndRef} />
              </div>

              <div
                className={`an-chat-composer bg-white border-t border-black/5 shrink-0 ${showMobileConversationMode ? 'sticky bottom-0 p-3' : 'p-4'}`}
                style={showMobileConversationMode ? { paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' } : undefined}
              >
                <div
                  className="max-w-4xl mx-auto flex flex-col bg-white border border-black/20 rounded-[16px] p-1.5 focus-within:border-black transition-colors"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    addAdminFiles(Array.from(e.dataTransfer.files || []));
                  }}
                  onPaste={(e) => {
                    const files = Array.from(e.clipboardData.files || []);
                    if (files.length) addAdminFiles(files);
                  }}
                >
                  <input ref={adminFileInputRef} type="file" multiple className="hidden" onChange={handleAdminFileSelect} />
                  {replyAttachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 border-b border-black/5 p-2">
                      {replyAttachments.map((attachment) => (
                        <div key={attachment.url} className="inline-flex max-w-full items-center gap-2 rounded-full bg-black/[0.05] px-3 py-1.5 text-[11px] font-semibold text-[#333]">
                          <Paperclip size={12} />
                          <span className="max-w-[160px] truncate">{attachment.filename}</span>
                          <button onClick={() => setReplyAttachments((current) => current.filter((item) => item.url !== attachment.url))} className="text-[#777] hover:text-black"><X size={12} /></button>
                        </div>
                      ))}
                    </div>
                  )}
                  <textarea
                    value={replyText}
                    onChange={(e) => handleReplyChange(e.target.value)}
                    placeholder={`Reply to ${customerLabel(activeConvDetails)}...`}
                    rows={2}
                    className="w-full bg-transparent border-none outline-none text-[14px] py-2 px-3 resize-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendReply();
                      }
                    }}
                  />
                  <div className="flex justify-between items-center px-2 pb-1 gap-3">
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => adminFileInputRef.current?.click()} className="rounded-full p-2 text-[#666] hover:bg-black/[0.05]" aria-label="Attach files"><Paperclip size={15} /></button>
                      <button type="button" onClick={startAdminVoiceTyping} className="rounded-full p-2 text-[#666] hover:bg-black/[0.05]" aria-label="Voice typing (dictation)" title="Voice typing (dictation)"><AudioLines size={15} /></button>
                      {!showMobileConversationMode && <div className="hidden text-[10px] text-[#999] sm:block">Sending to this conversation only.</div>}
                    </div>
                    <button onClick={handleSendReply} disabled={(!replyText.trim() && replyAttachments.length === 0) || isSending} className="px-4 py-1.5 bg-black text-white text-xs font-medium rounded-full hover:bg-black/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all shrink-0">
                      {isSending ? 'Sending...' : 'Send Reply'}
                    </button>
                  </div>
                </div>
                {!showMobileConversationMode && <div className="text-center mt-2 text-[10px] text-[#999]">Replies send as Reframe CS and save to this conversation.</div>}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-6 text-center">
              <div className="max-w-sm rounded-2xl border border-black/5 bg-white p-8 shadow-sm">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-black/[0.04]">
                  {staleTicketId ? <AlertCircle size={20} className="text-amber-600" /> : <MessageSquare size={20} className="text-[#777]" />}
                </div>
                <div className="text-[15px] font-semibold text-[#171717]">
                  {staleTicketId ? 'Chat ticket could not load' : 'Select a conversation'}
                </div>
                <p className="mt-2 text-[13px] leading-relaxed text-[#777]">
                  {staleTicketId
                    ? `Ticket #${shortId(staleTicketId)} failed to load. It stays in the list until an admin removes it.`
                    : 'Pick a conversation on the left to read it and reply.'}
                </p>
                <button
                  onClick={handleRefreshChats}
                  className="mt-5 inline-flex items-center gap-2 rounded-full bg-black px-4 py-2 text-[12px] font-semibold text-white hover:bg-black/80"
                >
                  <RefreshCw size={13} /> Refresh chats
                </button>
              </div>
            </div>
          )}
        </div>}
      </div>
      {menuConversation && openMenuPosition && (
        <div
          className="fixed z-[250] w-48 overflow-hidden rounded-xl border border-black/10 bg-white py-1 text-left text-[12px] shadow-xl"
          style={{ top: openMenuPosition.top, left: openMenuPosition.left }}
        >
          <button type="button" onClick={(e) => { e.stopPropagation(); window.open(`${window.location.origin}/admin/chats/${menuConversation.id}`, '_blank', 'noopener,noreferrer'); setOpenMenuId(null); setOpenMenuPosition(null); }} className="flex w-full items-center gap-2 px-3 py-2 hover:bg-black/[0.04]"><UserCircle size={14} /> Open in new window</button>
          <button type="button" onClick={(e) => updateConversationState(menuConversation, menuConversation.archivedAt ? 'unarchive' : 'archive', e)} className="flex w-full items-center gap-2 px-3 py-2 hover:bg-black/[0.04]"><Archive size={14} /> {menuConversation.archivedAt ? 'Unarchive' : 'Archive'}</button>
          <button type="button" onClick={(e) => updateConversationState(menuConversation, menuConversation.pinnedAt ? 'unpin' : 'pin', e)} className="flex w-full items-center gap-2 px-3 py-2 hover:bg-black/[0.04]"><Star size={14} /> {menuConversation.pinnedAt ? 'Unpin' : 'Pin'}</button>
          <button type="button" onClick={(e) => updateConversationState(menuConversation, 'unread', e)} className="flex w-full items-center gap-2 px-3 py-2 hover:bg-black/[0.04]"><MessageSquare size={14} /> Mark unread</button>
          <button type="button" onClick={(e) => updateConversationState(menuConversation, 'delete', e)} className="flex w-full items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50"><Trash2 size={14} /> Delete chat</button>
        </div>
      )}
      {messageActionTarget && (
        <div className="fixed inset-0 z-[320] bg-black/30" onClick={() => setMessageActionTarget(null)}>
          <div className="absolute bottom-4 left-1/2 w-[92%] max-w-sm -translate-x-1/2 rounded-2xl bg-white p-2 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <button className="w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-black/5" onClick={async () => { await navigator.clipboard.writeText(messageActionTarget.content || ''); setMessageActionTarget(null); }}>
              Copy message
            </button>
          </div>
        </div>
      )}
      {previewImage && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 p-4" onClick={() => setPreviewImage(null)}>
          <div className="max-h-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
            <img src={previewImage.url} alt={previewImage.filename} className="max-h-[82vh] max-w-full rounded-2xl object-contain" />
            <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3 text-sm">
              <span className="truncate font-semibold">{previewImage.filename}</span>
              <a href={previewImage.url} download target="_blank" rel="noreferrer" className="rounded-full bg-black px-4 py-2 text-xs font-semibold text-white">Download</a>
            </div>
          </div>
        </div>
      )}
      {profileConversation && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/30 p-4" onClick={() => setProfileConversation(null)}>
          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="border-b border-black/10 px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-[11px] font-bold text-white">{customerLabel(profileConversation).slice(0, 2).toUpperCase()}</div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14px] font-semibold text-[#171717]">{customerDisplayName(profileConversation)}</div>
                  <div className="text-[11px] text-[#777]">{profileConversation.customer?.activeStatus === 'active' ? 'Active now' : `Last active ${profileConversation.customer?.lastActiveAt ? getTimeAgo(profileConversation.customer.lastActiveAt) : 'unknown'}`}</div>
                </div>
              </div>
            </div>
            <div className="max-h-[62vh] overflow-y-auto px-4 py-2 md:max-h-[58vh]">
              {profileFields.map(([label, value]) => (
                <div key={label} className="grid grid-cols-[110px_1fr] items-start gap-2 border-b border-black/5 py-2.5 text-[13px] last:border-b-0">
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-[#8a8a8a]">{label}</div>
                  <div className="break-words font-medium text-[#171717]">{value}</div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2 border-t border-black/10 p-3">
              <button onClick={copyTicketLink} className="rounded-lg border border-black/10 bg-white px-3 py-2 text-[12px] font-semibold text-[#171717] hover:border-black/30">Copy link</button>
              <button onClick={() => setProfileConversation(null)} className="rounded-lg bg-black px-3 py-2 text-[12px] font-semibold text-white">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
