import * as React from 'react';
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, Settings, Plus, ChevronRight, ChevronDown, Minus, 
  ArrowRight, ArrowUp, Paperclip, AudioLines, Users, Clock,
  Maximize2, Minimize2, Trash2, Check, RefreshCw, Save, RotateCcw, Pin,
  MessageSquare, Link, Link2, X, Info
} from 'lucide-react';
import { useContent } from '../context/ContentBase';
import { useDashboard } from '../context/DashboardContext';
import { useLocation, useNavigate } from 'react-router-dom';
import MarkdownRenderer from './chat/MarkdownRenderer';
import SuggestedActions from './chat/SuggestedActions';
import { useModal } from '../context/ModalContext';

import { getApiEndpoint } from '../lib/apiConfig';
import { getLocalCsResponse } from '../utils/localCsResponses';
import { clearDraft, loadDraft, resolveSlashCommand, saveDraft } from '../utils/chatSmart';
import { useSharedChatController } from '../hooks/useSharedChatController';
import { ADMIN_NAV_ITEMS, CUSTOMER_NAV_ITEMS } from '../constants/navigation';
import { 
  CloudUploadIcon, Image01Icon, FolderOpenIcon, FileValidationIcon, 
  Settings03Icon, CpuIcon, DatabaseIcon 
} from 'hugeicons-react';
import { SERVICES } from '../data/services';
import { useOrderSubmit } from './order/hooks/useOrderSubmit';
import { calculateOrderVolume } from '../utils/orderVolume';

const createIdempotencyKey = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  const values = new Uint32Array(4);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(values);
  }
  return `idemp-${Array.from(values, value => value.toString(36)).join('')}`;
};

interface Message {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  isHandoff?: boolean;
  /** Server asks this guest for a way to be reached back — renders ContactCaptureCard. */
  requestContact?: boolean;
  suggestedActions?: Array<string | { text: string; url?: string }>;
  metadata?: any;
  createdAt?: string;
  updatedAt?: string;
  timestamp?: string;
}

interface ChatAttachment {
  url: string;
  filename: string;
  size?: number;
  type?: string;
  path?: string;
  folderPath?: string;
}

const SAME_MINUTE_MS = 60 * 1000;

const parseMessageMetadata = (message?: Message): Record<string, any> => {
  if (!message?.metadata) return {};
  try {
    return typeof message.metadata === 'string' ? JSON.parse(message.metadata) : message.metadata;
  } catch {
    return {};
  }
};

const getMessageAttachments = (message: Message): ChatAttachment[] => {
  const attachments = parseMessageMetadata(message).attachments;
  return Array.isArray(attachments) ? attachments.filter((item: ChatAttachment) => item?.url) : [];
};

const getOrderCard = (message: Message) => parseMessageMetadata(message).orderCard || null;

const getOrderStatusTone = (status?: string) => {
  const normalized = String(status || 'new').toLowerCase();
  if (['completed', 'delivered', 'done'].includes(normalized)) return 'bg-emerald-100 text-emerald-700 border-emerald-200';
  if (['review', 'in_review', 'quality_check'].includes(normalized)) return 'bg-amber-100 text-amber-700 border-amber-200';
  if (['processing', 'in_progress', 'working'].includes(normalized)) return 'bg-blue-100 text-blue-700 border-blue-200';
  return 'bg-zinc-100 text-zinc-700 border-zinc-200';
};

const getMessageTimestamp = (message?: Message) => message?.createdAt || message?.timestamp || message?.updatedAt || '';

const getMessageSenderKey = (message: Message, isHuman: boolean) => (
  message.role === 'user' ? 'user' : isHuman ? 'human-support' : 'assistant'
);

const formatFileSize = (size?: number) => {
  if (!size) return '';
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

interface OrderIntake {
  step: 'initial' | 'service_selection' | 'media_upload' | 'file_count_verify' | 'instructions' | 'timeline' | 'email' | 'complete';
  selectedService?: string;
  fileCount?: number;
  deadline?: string;
  email?: string;
}

interface OrderFlowData {
  projectName: string;
  instructions: string;
  selectedServices: string[];
  outputFormat: string;
  turnaround: string;
  region: string;
  files: File[];
  supportFiles: File[];
  sourceLinks: string[];
  background: string;
  customBgFile?: File;
  customBgColor?: string;
  customBgImage?: File;
  cropRatio: string;
  resizeWidth: string;
  resizeHeight: string;
  maintainAspectRatio?: boolean;
  colorProfile: string;
  resolutionDPI: string;
  layering: string;
  namingPattern: string;
  marginPercent: string;
  deliveryVector: string;
  email: string;
  customFilesLink?: string;
  customFilesCount?: number;
  idempotencyKey?: string;
}

interface ReframeCsOpenDetail {
  mode?: 'default' | 'feedback-escalation';
  issueType?: string;
  pageTitle?: string;
  pagePath?: string;
  prompt?: string;
  focus?: boolean;
}

const INITIAL_ORDER_DATA: OrderFlowData = {
  projectName: '',
  instructions: '',
  selectedServices: [],
  outputFormat: 'jpg',
  turnaround: '48',
  files: [],
  supportFiles: [],
  sourceLinks: [],
  background: 'white',
  customBgColor: undefined,
  customBgImage: undefined,
  cropRatio: 'original',
  resizeWidth: '',
  resizeHeight: '',
  region: 'US',
  colorProfile: 'sRGB',
  resolutionDPI: '72',
  layering: 'Flat',
  namingPattern: '',
  marginPercent: '0',
  deliveryVector: 'Dashboard',
  email: '',
  customFilesLink: '',
  customFilesCount: undefined
};

const DEFAULT_CHAT_STARTER_ACTIONS = [
  { text: 'Get a Quote', url: '/free-trial' },
  { text: 'Our Services', url: '/services' },
  { text: 'Pricing Bundles', url: '/pricing' },
  { text: 'Assurance Support' }
];

const CHAT_IDENTITY_KEY = 'reframe_cs_identity';

// The widget caches the open conversation and its transcript in localStorage so the
// thread survives a reload. That cache belongs to one identity — when the browser
// switches identity without an explicit logout (token expiry, cleared cookie, a
// registered session lapsing back to guest), the cache must be dropped, or the next
// visitor renders the previous customer's messages.
const syncChatIdentityCache = (identity: string | null) => {
  if (typeof window === 'undefined' || !identity) return;
  const previous = localStorage.getItem(CHAT_IDENTITY_KEY);
  if (previous === identity) return;

  if (previous) {
    localStorage.removeItem('reframe_cs_messages');
    localStorage.removeItem('reframe_cs_last_admin_msg_id');
    // A new identity has not given us their contact details — re-arm the ask.
    localStorage.removeItem(CONTACT_CAPTURED_KEY);
    const staleConvId = localStorage.getItem('reframe_cs_conv_id');
    if (staleConvId) localStorage.removeItem(`reframe_cs_draft_${staleConvId}`);
    localStorage.removeItem('reframe_cs_conv_id');
    localStorage.removeItem('reframe_cs_draft_new');
  }
  localStorage.setItem(CHAT_IDENTITY_KEY, identity);
};

// Set once a guest gives us a way to reach them, so the card does not reappear on
// reload. Cleared alongside the rest of the chat cache whenever identity changes —
// otherwise the next visitor on this browser is silently treated as already-captured.
const CONTACT_CAPTURED_KEY = 'reframe_cs_contact_captured';

/**
 * Inline, skippable ask for a way to reach a guest back.
 *
 * A guest could previously send one message and leave, and the team had no address to
 * follow up on. This renders inside the first bot reply rather than as an overlay, so
 * it reads as part of the conversation instead of a popup from a site they just met.
 */
const ContactCaptureCard = ({ conversationId, guestId, onCaptured }: {
  conversationId: string | null;
  guestId: string;
  onCaptured: () => void;
}) => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const handleSubmit = async () => {
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes('@')) {
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
      const res = await fetch(getApiEndpoint('/portal/chat/capture-email'), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'X-Guest-ID': guestId },
        body: JSON.stringify({ conversationId, email: trimmed }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) {
        throw new Error(data?.message || 'Could not save that right now.');
      }
      localStorage.setItem(CONTACT_CAPTURED_KEY, '1');
      onCaptured();
    } catch (err: any) {
      setError(err?.message || 'Could not save that right now. Try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-xl border border-black/[0.08] bg-black/[0.02] p-3">
      <div className="mb-2 flex items-start gap-1.5">
        <p className="text-[11px] font-semibold leading-snug text-[#171717]">
          Where should we reach you?
        </p>
        <span
          title="Used only to continue this support conversation. We never sell it or send marketing."
          aria-label="Used only to continue this support conversation. We never sell it or send marketing."
          className="mt-[1px] cursor-help text-[#999]"
        >
          <Info size={12} />
        </span>
      </div>
      <p className="mb-2.5 text-[10px] leading-snug text-[#777]">
        So we can pick this up with you if you close the tab — support replies only, no marketing.
      </p>

      <div className="flex gap-2">
        <input
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => { setEmail(e.target.value); if (error) setError(''); }}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
          disabled={isSubmitting}
          className="h-9 min-w-0 flex-1 rounded-lg border border-black/[0.1] bg-white px-3 text-[12px] font-medium text-[#171717] placeholder-[#bbb] transition-all focus:border-[#171717] focus:outline-none focus:ring-2 focus:ring-black/[0.06]"
        />
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="h-9 shrink-0 rounded-lg bg-[#171717] px-3.5 text-[11px] font-bold text-white transition-all hover:bg-black active:scale-[0.98] disabled:opacity-50"
        >
          {isSubmitting ? 'Saving…' : 'Save'}
        </button>
      </div>

      {/* Phase 2 slots the "Enable notifications" button here. */}

      {error && <p className="mt-1.5 text-[10px] font-medium text-red-600">{error}</p>}

      <button
        onClick={() => setDismissed(true)}
        className="mt-2 text-[10px] font-semibold text-[#999] underline-offset-2 transition-colors hover:text-[#666] hover:underline"
      >
        Skip
      </button>
    </div>
  );
};

interface ReframeCSProps {
  variant?: 'floating' | 'embedded' | 'page';
  defaultExpanded?: boolean;
  showLauncher?: boolean;
}

const ReframeCS = ({ variant = 'floating', defaultExpanded = false, showLauncher = true }: ReframeCSProps = {}) => {
  const { currentUser } = useContent();
  const { jobs } = useDashboard();
  const { fetchConversationList, fetchConversationDetails, sendConversationMessage } = useSharedChatController();
  const location = useLocation();
  const navigate = useNavigate();
  const { showAlert, showConfirm } = useModal();
  const isAdminRoute = location.pathname.startsWith('/admin');
  
  // State declarations first!
  const isEmbeddedPresentation = variant === 'embedded' || variant === 'page';
  const [isExpanded, setIsExpanded] = useState(defaultExpanded || isEmbeddedPresentation);
  const isExpandedRef = useRef(defaultExpanded || isEmbeddedPresentation);
  const activeTabRef = useRef('chats');
  const [isCompactViewport, setIsCompactViewport] = useState(() => (
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  ));
  // Mobile keyboard handling: keep the widget within the *visual* viewport so the header does not slide under the keyboard.
  const [visualViewportHeight, setVisualViewportHeight] = useState<number>(() => {
    if (typeof window === 'undefined') return 0;
    return (window as any).visualViewport?.height || window.innerHeight;
  });
  const [activeTab, setActiveTab] = useState<string>('chats');
  const [query, setQuery] = useState(() => {
    const convId = localStorage.getItem('reframe_cs_conv_id');
    return localStorage.getItem(convId ? `reframe_cs_draft_${convId}` : 'reframe_cs_draft_new') || '';
  });
  const [unreadAdminCount, setUnreadAdminCount] = useState(0);
  const [latestAdminPreview, setLatestAdminPreview] = useState('');
  const [unreadAdminStartId, setUnreadAdminStartId] = useState('');
  const [isSupportTyping, setIsSupportTyping] = useState(false);
  const [supportSeenMessageId, setSupportSeenMessageId] = useState('');
  const [messageActionTarget, setMessageActionTarget] = useState<Message | null>(null);
  const lastNotifiedAdminMessageRef = useRef(localStorage.getItem('reframe_cs_last_admin_msg_id') || '');
  const hasHydratedAdminMessagesRef = useRef(false);
  const typingTimeoutRef = useRef<number | null>(null);
  const longPressTimerRef = useRef<number | null>(null);
  const preflightIdRef = useRef<string | null>(null);
  const [showJumpToLatest, setShowJumpToLatest] = useState(false);

  const createGuestId = useCallback(() => (
    (typeof crypto !== 'undefined' && crypto.randomUUID)
      ? crypto.randomUUID()
      : 'guest-' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  ), []);

  const [guestId, setGuestId] = useState(() => {
    let id = localStorage.getItem('portal_guest_id');
    if (!id) {
      id = createGuestId();
      localStorage.setItem('portal_guest_id', id);
    }
    return id;
  });

  // Runs before the cached transcript is read below. `currentUser` is null while the
  // session is still resolving, so only claim an identity once it is unambiguous —
  // a loaded customer, or no portal token at all (a genuine guest).
  const hasPortalToken = Boolean(
    typeof window !== 'undefined'
    && localStorage.getItem('portal_token')
    && localStorage.getItem('portal_token') !== 'null'
  );
  syncChatIdentityCache(currentUser?.id || (hasPortalToken ? null : guestId));

  // Hides the contact-capture card once this visitor has given us an address. Read
  // after syncChatIdentityCache, which clears the flag when identity changes.
  const [contactCaptured, setContactCaptured] = useState(
    () => localStorage.getItem(CONTACT_CAPTURED_KEY) === '1'
  );
  // Read at render rather than held in state — the card only appears after a message
  // has been sent, by which point the id is already written.
  const currentConversationId = localStorage.getItem('reframe_cs_conv_id');

  const [conversations, setConversations] = useState([]);
  const [isConversationsLoading, setIsConversationsLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [pinnedIds, setPinnedIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('reframe_cs_pinned_chats');
    return saved ? JSON.parse(saved) : [];
  });
  const [hasPendingOrderFlow, setHasPendingOrderFlow] = useState(false);
  const [showResumeOrderGlow, setShowResumeOrderGlow] = useState(false);

  useEffect(() => {
    localStorage.setItem('reframe_cs_pinned_chats', JSON.stringify(pinnedIds));
  }, [pinnedIds]);

  useEffect(() => {
    isExpandedRef.current = isExpanded;
    if (isExpanded && activeTab === 'chats') {
      setUnreadAdminCount(0);
      window.setTimeout(() => setUnreadAdminStartId(''), 1500);
    }
  }, [isExpanded, activeTab]);

  useEffect(() => {
    const handleOpenRequest = (event: Event) => {
      const customEvent = event as CustomEvent<ReframeCsOpenDetail>;
      const detail = customEvent.detail;
      const shouldFocusInput = detail?.focus !== false;
      setIsExpanded(true);
      setActiveTab('chats');
      setUnreadAdminCount(0);

      if (detail?.mode === 'feedback-escalation') {
        const pageTitle = detail.pageTitle?.trim() || 'this page';
        const pagePath = detail.pagePath?.trim();
        const issueType = detail.issueType?.trim() || 'general';
        const contextLine = pagePath ? `${pageTitle} (${pagePath})` : pageTitle;
        startNewChat({
          intro: `We’re here to help. Share what happened and we’ll route this to a human support teammate.\n\nContext: ${contextLine}\nIssue type: ${issueType}`,
          suggestedActions: ['Bug report', 'Feature request', 'General question']
        });
        setLatestAdminPreview('');
        setQuery('');
        if (shouldFocusInput) {
          setTimeout(() => inputRef.current?.focus(), 300);
        }
        return;
      }

      if (shouldFocusInput) {
        setTimeout(() => inputRef.current?.focus(), 300);
      }
    };

    window.addEventListener('reframe-cs:open', handleOpenRequest);
    return () => window.removeEventListener('reframe-cs:open', handleOpenRequest);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const vv = (window as any).visualViewport as VisualViewport | undefined;
    const update = () => setVisualViewportHeight(vv?.height || window.innerHeight);
    update();
    vv?.addEventListener('resize', update);
    vv?.addEventListener('scroll', update);
    window.addEventListener('resize', update);
    return () => {
      vv?.removeEventListener('resize', update);
      vv?.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('reframe-cs:state', { detail: { open: isExpanded } }));
  }, [isExpanded]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (isExpanded) {
      document.body.setAttribute('data-reframe-cs-open', 'true');
    } else {
      document.body.removeAttribute('data-reframe-cs-open');
    }

    return () => {
      document.body.removeAttribute('data-reframe-cs-open');
    };
  }, [isExpanded]);

  const isHumanAdminMessage = useCallback((message: any) => {
    if (!message || message.role !== 'assistant') return false;
    const meta = parseMessageMetadata(message);
    return meta?.isHuman === true || meta?.source === 'admin-dashboard' || meta?.source === 'telegram' || meta?.source === 'slack';
  }, []);

  const playAdminReplySound = useCallback(() => {
    try {
      const AudioContextCtor = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextCtor) return;
      const audioCtx = new AudioContextCtor();
      const oscillator = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
      oscillator.frequency.setValueAtTime(660, audioCtx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.08, audioCtx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.22);
      oscillator.connect(gain);
      gain.connect(audioCtx.destination);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.24);
      window.setTimeout(() => audioCtx.close().catch(() => {}), 300);
    } catch {
      // Browser may block notification sounds until user interaction.
    }
  }, []);

  useEffect(() => {
    const handleResize = () => setIsCompactViewport(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const togglePin = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPinnedIds(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const deleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const confirmed = await showConfirm({
      title: 'Delete Conversation',
      message: 'Are you sure you want to delete this conversation? This action cannot be undone.',
      variant: 'danger',
      confirmLabel: 'Delete'
    });
    if (!confirmed) return;

    try {
      const token = localStorage.getItem('portal_token');
      const headers = { 'X-Guest-ID': guestId };
      if (token && token !== 'null') headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(getApiEndpoint(`/portal/conversations/${id}`), {
        method: 'DELETE',
        headers,
        credentials: 'include'
      });
      const result = await response.json();
      if (result.success) {
        setConversations(prev => prev.filter(c => c.id !== id));
        if (localStorage.getItem('reframe_cs_conv_id') === id) {
          startNewChat();
        }
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    }
  };

  const fetchConversations = useCallback(async () => {
    setIsConversationsLoading(true);
    try {
      const list = await fetchConversationList();
      setConversations(list || []);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setIsConversationsLoading(false);
    }
  }, [fetchConversationList]);

  const loadConversation = async (convId) => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      localStorage.setItem('reframe_cs_conv_id', convId);
      const details = await fetchConversationDetails(convId);
      if (details?.messages) {
          const formattedMessages = formatConversationMessages(details.messages);
        setMessages(formattedMessages);
      }
    } catch (error) {
      console.error('Failed to load conversation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const startNewChat = (options?: {
    intro?: string;
    suggestedActions?: Array<string | { text: string; url?: string }>;
  }) => {
    localStorage.removeItem('reframe_cs_conv_id');
    setMessages([{ 
      role: 'assistant', 
      content: options?.intro || 'How can I help?', 
      suggestedActions: options?.suggestedActions || DEFAULT_CHAT_STARTER_ACTIONS
    }]);
    setActiveTab('chats');
  };
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem('reframe_cs_messages');
    return saved ? JSON.parse(saved) : [{
      role: 'assistant',
      content: 'How can I help?',
      suggestedActions: DEFAULT_CHAT_STARTER_ACTIONS
    }];
  });

  useEffect(() => {
    const convId = localStorage.getItem('reframe_cs_conv_id');
    if (!convId) return;
    setQuery(loadDraft(convId));
  }, [isExpanded, activeTab]);

  useEffect(() => {
    const convId = localStorage.getItem('reframe_cs_conv_id');
    if (!convId) return;
    saveDraft(convId, query);
  }, [query]);

  const formatConversationMessages = useCallback((rawMessages: any[]): Message[] => {
    return rawMessages.map((m: any) => {
      let suggestedActions = [];
      let requestContact = false;
      if (m.metadata) {
        try {
          const meta = typeof m.metadata === 'string' ? JSON.parse(m.metadata) : m.metadata;
          suggestedActions = meta.suggestedActions || [];
          requestContact = meta.requestContact === true;
        } catch (e) {
          console.warn('Unable to parse Reframe CS metadata:', e);
        }
      }
      return { ...m, suggestedActions, requestContact };
    });
  }, []);

  const fetchCurrentConversationMessages = useCallback(async (silent = true) => {
    const convId = localStorage.getItem('reframe_cs_conv_id');
    if (!convId) return;

    if (!silent) setIsLoading(true);
    try {
      const token = localStorage.getItem('portal_token');
      const headers: Record<string, string> = { 'X-Guest-ID': guestId };
      if (token && token !== 'null') {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(getApiEndpoint(`/portal/conversations/${convId}`), { headers });
      const result = await response.json();
      const realtimeResponse = await fetch(getApiEndpoint(`/portal/conversations/${convId}/realtime`), { headers });
      const realtimeResult = await realtimeResponse.json();
      if (realtimeResult?.success) {
        setIsSupportTyping(Boolean(realtimeResult?.data?.supportTyping));
        setSupportSeenMessageId(String(realtimeResult?.data?.supportSeen?.messageId || ''));
      }
      if (result.success && result.data.messages) {
        const formattedMessages = formatConversationMessages(result.data.messages);
        const latestHumanAdminMessage = [...formattedMessages].reverse().find(isHumanAdminMessage);
        const latestHumanAdminId = latestHumanAdminMessage
          ? `${latestHumanAdminMessage.id || latestHumanAdminMessage.createdAt || ''}:${latestHumanAdminMessage.content}`
          : '';

        if (!hasHydratedAdminMessagesRef.current) {
          hasHydratedAdminMessagesRef.current = true;
          if (latestHumanAdminId && !lastNotifiedAdminMessageRef.current) {
            lastNotifiedAdminMessageRef.current = latestHumanAdminId;
            localStorage.setItem('reframe_cs_last_admin_msg_id', latestHumanAdminId);
          }
        } else if (latestHumanAdminMessage && latestHumanAdminId && lastNotifiedAdminMessageRef.current !== latestHumanAdminId) {
          lastNotifiedAdminMessageRef.current = latestHumanAdminId;
          localStorage.setItem('reframe_cs_last_admin_msg_id', latestHumanAdminId);
          const firstLinePreview = latestHumanAdminMessage.content.split('\n')[0].slice(0, 90);
          setLatestAdminPreview(firstLinePreview);
          if (!isExpandedRef.current || activeTabRef.current !== 'chats') {
            setUnreadAdminCount((count) => count + 1);
            setUnreadAdminStartId((current) => current || latestHumanAdminId);
          } else {
            setUnreadAdminCount(0);
          }
          playAdminReplySound();
        }

        setMessages(prev => {
          const prevFingerprint = prev.map((m: any) => `${m.id || ''}:${m.role}:${m.content}`).join('|');
          const nextFingerprint = formattedMessages.map((m: any) => `${m.id || ''}:${m.role}:${m.content}`).join('|');
          return prevFingerprint === nextFingerprint ? prev : formattedMessages;
        });

        if (latestHumanAdminMessage && isExpandedRef.current && activeTabRef.current === 'chats' && latestHumanAdminMessage.id && document.visibilityState === 'visible') {
          fetch(getApiEndpoint(`/portal/conversations/${convId}/seen`), {
            method: 'POST',
            headers: {
              ...headers,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ messageId: latestHumanAdminMessage.id }),
          }).catch(() => {});
        }
      }
    } catch (error) {
      if (!silent) console.error('Failed to fetch chat history:', error);
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [formatConversationMessages, guestId, isHumanAdminMessage, playAdminReplySound]);

  const [isListening, setIsListening] = useState(false);
  const [isVisible, setIsVisible] = useState(isEmbeddedPresentation);
  const [showcaseInView, setShowcaseInView] = useState(false);
  const [isCSHidden, setIsCSHidden] = useState(false);

  useEffect(() => {
    if (isEmbeddedPresentation) return;

    const handleShowcaseView = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (window.innerWidth >= 768) {
        setShowcaseInView(!!customEvent.detail?.inView);
      } else {
        setShowcaseInView(false);
      }
    };

    window.addEventListener('reframe-cs-showcase-view', handleShowcaseView);
    return () => window.removeEventListener('reframe-cs-showcase-view', handleShowcaseView);
  }, [isEmbeddedPresentation]);

  const [showCSGlow, setShowCSGlow] = useState(false);
  const prevShowcaseInView = useRef(showcaseInView);

  useEffect(() => {
    if (isEmbeddedPresentation) return;

    if (showcaseInView !== prevShowcaseInView.current) {
      if (showcaseInView) {
        // Showcase entered view:
        // 1. Show the glow immediately while it is still sitting at the bottom
        setShowCSGlow(true);
        setIsCSHidden(false); // stay at bottom

        // 2. After 800ms, launch it up
        const launchTimer = setTimeout(() => {
          setIsCSHidden(true); // fly up
          // Keep glow on for a moment while flying up
          const glowTimer = setTimeout(() => setShowCSGlow(false), 500);
          return () => clearTimeout(glowTimer);
        }, 800);

        return () => clearTimeout(launchTimer);
      } else {
        // Showcase left view (returning):
        // 1. Immediately start sliding back down
        setIsCSHidden(false);
        // 2. Immediately start glowing so it glows *while* arriving
        setShowCSGlow(true);

        // 3. Keep glowing until it lands and stabilizes (total 1900ms)
        const glowTimer = setTimeout(() => {
          setShowCSGlow(false);
        }, 1900);

        return () => clearTimeout(glowTimer);
      }
    }
    prevShowcaseInView.current = showcaseInView;
  }, [showcaseInView, isEmbeddedPresentation]);
  const dynamicCtaPhrasesDesktop = [
    'Ask Reframe CS.',
    'Need pricing or turnaround?',
    'Ask about file prep.',
    'Human replies instantly.',
    'Share your project.',
    'Get a quote.',
  ];
  const dynamicCtaPhrasesMobile = [
    'Ask anything about our editing services.',
    'How much for 500 product photos?',
    'What turnaround options do you offer?',
    'Tell us about your project, we\'ll quote it.',
    'Need ghost mannequin or jewelry retouching?',
    'Ask about bulk pricing and volume discounts.',
  ];
  const dynamicCtaPhrases = isCompactViewport ? dynamicCtaPhrasesMobile : dynamicCtaPhrasesDesktop;
  const dynamicCtaDurations = [5200, 2600, 2600, 2600, 2600, 2600];
  const [dynamicCtaIndex, setDynamicCtaIndex] = useState(0);
  const [isDynamicCtaVisible, setIsDynamicCtaVisible] = useState(
    typeof sessionStorage !== 'undefined' && !!sessionStorage.getItem('reframe_cs_intro_seen')
  );
  
  
  // Order intake state
  const [, setOrderIntake] = useState<OrderIntake>({
    step: 'initial'
  });
  const uploadedFilesRef = useRef<File[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  
  // Order flow state
  const [flowType, setFlowType] = useState<'standard' | 'asset-first'>('standard');
  const [orderFlowStep, setOrderFlowStep] = useState<'requirements' | 'files' | 'specs' | 'review' | 'complete'>('requirements');
  const [orderData, setOrderData] = useState<OrderFlowData>(() => {
    const savedDraft = localStorage.getItem('reframe_order_draft');
    let baseData = INITIAL_ORDER_DATA;
    if (savedDraft) {
      try {
        baseData = JSON.parse(savedDraft);
      } catch (e) {
        // ignore
      }
    }
    return {
      ...baseData,
      idempotencyKey: baseData.idempotencyKey || createIdempotencyKey()
    };
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const contentScrollRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Role Logic
  const isExplicitAdminRoute = location.pathname.startsWith('/admin');
  const isDashboardRoute = location.pathname.startsWith('/dashboard');
  const isAdminUser = (currentUser as any)?.role === 'admin';
  const isAdmin = isExplicitAdminRoute ? true : (isDashboardRoute ? false : isAdminUser);

  useEffect(() => {
    if (isListening || latestAdminPreview || query.trim()) {
      setIsDynamicCtaVisible(true);
      return;
    }

    let hideTimer: number | undefined;
    let nextTimer: number | undefined;

    const scheduleNext = () => {
      const dwellTime = dynamicCtaDurations[dynamicCtaIndex] || 2600;
      nextTimer = window.setTimeout(() => {
        setIsDynamicCtaVisible(false);
        hideTimer = window.setTimeout(() => {
          setDynamicCtaIndex((prev) => (prev + 1) % dynamicCtaPhrases.length);
          setIsDynamicCtaVisible(true);
          scheduleNext();
        }, 180);
      }, dwellTime);
    };

    scheduleNext();

    return () => {
      if (hideTimer) window.clearTimeout(hideTimer);
      if (nextTimer) window.clearTimeout(nextTimer);
    };
  }, [dynamicCtaIndex, dynamicCtaPhrases.length, isListening, latestAdminPreview, query]);

  // Message rendering logic moved to inline to support complex structures
  const hasCollapsedDraft = !isExpanded && Boolean(query.trim());
  const collapsedDraftLabel = hasCollapsedDraft ? 'Draft' : '';
  const hasUserStartedChat = messages.some(message => message.role === 'user');
  const showSupportHeaderDetails = activeTab === 'chats' && !hasUserStartedChat;

  const scrollToBottom = useCallback((force = false) => {
    const scrollContainer = contentScrollRef.current;
    if (!scrollContainer) return;
    const distanceFromBottom = scrollContainer.scrollHeight - scrollContainer.scrollTop - scrollContainer.clientHeight;
    if (force || distanceFromBottom < 120) {
      scrollContainer.scrollTo({ top: scrollContainer.scrollHeight, behavior: 'smooth' });
    }
  }, []);

  const openMessageActions = useCallback((message: Message) => {
    if (!message.content?.trim()) return;
    setMessageActionTarget(message);
  }, []);

  const startMessageLongPress = useCallback((message: Message) => {
    if (longPressTimerRef.current) window.clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = window.setTimeout(() => openMessageActions(message), 520);
  }, [openMessageActions]);

  const cancelMessageLongPress = useCallback(() => {
    if (!longPressTimerRef.current) return;
    window.clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = null;
  }, []);

  useEffect(() => {
    const handlePortalLogout = () => {
      const nextGuestId = createGuestId();
      localStorage.setItem('portal_guest_id', nextGuestId);
      localStorage.setItem(CHAT_IDENTITY_KEY, nextGuestId);
      localStorage.removeItem('reframe_cs_conv_id');
      localStorage.removeItem('reframe_cs_messages');
      localStorage.removeItem('reframe_cs_last_admin_msg_id');
      localStorage.removeItem(CONTACT_CAPTURED_KEY);
      setContactCaptured(false);
      setGuestId(nextGuestId);
      setLatestAdminPreview('');
      setUnreadAdminCount(0);
      setConversations([]);
      setMessages([{ 
        role: 'assistant', 
        content: 'How can I help?', 
        suggestedActions: [
          { text: 'Get a Quote', url: '/free-trial' },
          { text: 'Our Services', url: '/services' },
          { text: 'Pricing Bundles', url: '/pricing' }
        ]
      }]);
    };
    window.addEventListener('portal-logout', handlePortalLogout);
    return () => window.removeEventListener('portal-logout', handlePortalLogout);
  }, [createGuestId]);

  useEffect(() => {
    if (isExpanded) {
      const container = contentScrollRef.current;
      const dist = container
        ? container.scrollHeight - container.scrollTop - container.clientHeight
        : 0;
      if (dist > 120) {
        setShowJumpToLatest(true);
      } else {
        scrollToBottom();
        setShowJumpToLatest(false);
      }
      if (activeTab === 'chats') {
        fetchConversations();
      }
    }
  }, [messages, isExpanded, activeTab, fetchConversations, scrollToBottom]);

  useEffect(() => {
    const pingPresence = async () => {
      try {
        const token = localStorage.getItem('portal_token');
        const headers: Record<string, string> = { 'Content-Type': 'application/json', 'X-Guest-ID': guestId };
        if (token && token !== 'null') headers.Authorization = `Bearer ${token}`;
        await fetch(getApiEndpoint('/portal/presence'), { method: 'POST', headers, body: JSON.stringify({ path: location.pathname }) });
      } catch {
        // Presence is best-effort and intentionally avoids database writes.
      }
    };
    pingPresence();
    const interval = window.setInterval(pingPresence, 45000);
    return () => window.clearInterval(interval);
  }, [guestId, location.pathname]);

  // Fetch conversation history on mount and keep the active conversation fresh
  // so Telegram admin replies appear in the customer widget without a reload.
  useEffect(() => {
    fetchCurrentConversationMessages(true);
  }, [fetchCurrentConversationMessages]);

  useEffect(() => {
    // Keep polling regardless of when the conversation ID is created.
    // fetchCurrentConversationMessages() exits early when no chat exists.
    fetchCurrentConversationMessages(true);
    const poll = window.setInterval(() => {
      fetchCurrentConversationMessages(true);
    }, isExpanded && activeTab === 'chats' ? 3000 : 12000);

    return () => window.clearInterval(poll);
  }, [activeTab, fetchCurrentConversationMessages, isExpanded]);

  // Initial Boot Sequence
  useEffect(() => {
    if (isEmbeddedPresentation) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const alreadySeen = sessionStorage.getItem('reframe_cs_intro_seen');
    const isScrolled = window.scrollY > 100;

    const bootDelay = reducedMotion ? 0 : (alreadySeen ? 300 : (isScrolled ? 500 : 1400));

    const boot = window.setTimeout(() => {
      setIsVisible(true);
      sessionStorage.setItem('reframe_cs_intro_seen', '1');
      if (!alreadySeen && !reducedMotion) {
        window.setTimeout(() => setIsDynamicCtaVisible(true), 600);
      }
    }, bootDelay);

    return () => window.clearTimeout(boot);
  }, [isEmbeddedPresentation]);

  // Persist draft — uses pre-conv key when no conversation exists yet
  useEffect(() => {
    const convId = localStorage.getItem('reframe_cs_conv_id');
    const key = convId ? `reframe_cs_draft_${convId}` : 'reframe_cs_draft_new';
    if (query) localStorage.setItem(key, query);
    else localStorage.removeItem(key);
  }, [query]);

  useEffect(() => {
    const capped = messages.length > 150 ? messages.slice(-150) : messages;
    localStorage.setItem('reframe_cs_messages', JSON.stringify(capped));
  }, [messages]);

  // Track scroll position to show/hide jump-to-latest
  useEffect(() => {
    const container = contentScrollRef.current;
    if (!container || !isExpanded) return;
    const onScroll = () => {
      const dist = container.scrollHeight - container.scrollTop - container.clientHeight;
      if (dist <= 120) setShowJumpToLatest(false);
    };
    container.addEventListener('scroll', onScroll, { passive: true });
    return () => container.removeEventListener('scroll', onScroll);
  }, [isExpanded]);

  // Click outside to collapse
  useEffect(() => {
    if (!isExpanded) return;
    if (isEmbeddedPresentation) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        // Don't auto-collapse if we're in the middle of an order flow to prevent data loss/confusion
        if (activeTab === 'orderFlow') return;
        setIsExpanded(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isExpanded, activeTab, isEmbeddedPresentation]);

  const isAuthenticated = Boolean(currentUser);
  const currentNavItems = isAdmin
    ? ADMIN_NAV_ITEMS
    : (isAuthenticated ? CUSTOMER_NAV_ITEMS : []);

  // Sync activeTab with current route
  useEffect(() => {
    const matchingItem = currentNavItems.find(item => {
      if (item.path === '/dashboard' || item.path === '/admin') {
        return location.pathname === item.path;
      }
      return location.pathname.startsWith(item.path);
    });
    
    if (matchingItem) {
      setActiveTab(matchingItem.id);
    } else if (location.pathname === '/' && activeTab !== 'chats' && activeTab !== 'orderFlow') {
      setActiveTab('chats');
    }
  }, [location.pathname, currentNavItems]);

  const userLabel = isAdmin ? 'Admin Access' : (isAuthenticated ? 'Customer' : 'Visitor');
  const userName = currentUser?.name || (isAdmin ? 'Admin User' : 'Visitor');
  const userInitial = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const mobileNavItems = currentNavItems.filter(item => item.id !== 'chats');
  const startOrderFlow = useCallback(() => {
    setIsExpanded(true);
    setHasPendingOrderFlow(true);
    setShowResumeOrderGlow(false);
    window.requestAnimationFrame(() => {
      setOrderIntake({ step: 'initial' });
      setActiveTab('orderFlow');
      setFlowType('standard');
      setOrderFlowStep('requirements');
      setOrderData({
        ...INITIAL_ORDER_DATA,
        email: currentUser?.email || ''
      });
    });
  }, [currentUser?.email]);

  const resumeOrderFlow = useCallback(() => {
    setActiveTab('orderFlow');
    setIsExpanded(true);
    setShowResumeOrderGlow(false);
  }, []);

  useEffect(() => {
    if (activeTab !== 'chats' || !hasPendingOrderFlow) {
      setShowResumeOrderGlow(false);
      return;
    }

    setShowResumeOrderGlow(true);
    const timer = window.setTimeout(() => setShowResumeOrderGlow(false), 2600);
    return () => window.clearTimeout(timer);
  }, [activeTab, hasPendingOrderFlow]);

  const orderActionLabel = activeTab === 'orderFlow'
    ? 'Exit Order'
    : hasPendingOrderFlow
      ? 'Resume Order'
      : 'New Order';
  const handleOrderActionClick = useCallback(() => {
    if (activeTab === 'orderFlow') {
      startOrderFlow();
      return;
    }
    if (hasPendingOrderFlow) {
      resumeOrderFlow();
      return;
    }
    startOrderFlow();
  }, [activeTab, hasPendingOrderFlow, resumeOrderFlow, startOrderFlow]);

  const toggleExpand = useCallback(() => {
    setIsExpanded(prev => {
      if (!prev) {
        setUnreadAdminCount(0);
        setLatestAdminPreview('');
        setActiveTab('chats');
        setTimeout(() => inputRef.current?.focus(), 300);
      }
      return !prev;
    });
  }, []);
  const resizeInput = useCallback(() => {
    const input = inputRef.current;
    if (!input) return;
    input.style.height = 'auto';
    const maxHeight = isExpanded ? 96 : 40;
    input.style.height = `${Math.min(input.scrollHeight, maxHeight)}px`;
    input.style.overflowY = isExpanded && input.scrollHeight > maxHeight ? 'auto' : 'hidden';
  }, [isExpanded]);

  useEffect(() => {
    resizeInput();
  }, [query, isExpanded, resizeInput]);

  const handleQueryChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const nextValue = e.target.value;
    setQuery(nextValue);

    const convId = localStorage.getItem('reframe_cs_conv_id');
    const token = localStorage.getItem('portal_token');
    if (!convId) return;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Guest-ID': guestId
    };
    if (token && token !== 'null') {
      headers['Authorization'] = `Bearer ${token}`;
    }

    fetch(getApiEndpoint(`/portal/conversations/${convId}/typing`), {
      method: 'POST',
      headers,
      body: JSON.stringify({ isTyping: nextValue.trim().length > 0 }),
    }).catch(() => {});

    if (typingTimeoutRef.current) {
      window.clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = window.setTimeout(() => {
      fetch(getApiEndpoint(`/portal/conversations/${convId}/typing`), {
        method: 'POST',
        headers,
        body: JSON.stringify({ isTyping: false }),
      }).catch(() => {});
    }, 2500);
  }, [guestId]);

  const handleSendMessage = async (customQuery?: string, attachments: ChatAttachment[] = []) => {
    const userContent = customQuery || query;
    if ((!userContent.trim() && attachments.length === 0) || isLoading) return;
    const slash = resolveSlashCommand(userContent);
    const finalContent = slash ? slash.message : userContent;

    const userMessage: Message = {
      role: 'user',
      content: finalContent || (attachments.length ? `[Attached ${attachments.length} file(s)]` : ''),
      metadata: attachments.length ? { attachments } : undefined,
    };
    
    setMessages(prev => [...prev, userMessage]);
    setQuery('');
    const convIdBeforeSend = localStorage.getItem('reframe_cs_conv_id');
    if (convIdBeforeSend) clearDraft(convIdBeforeSend);
    localStorage.removeItem('reframe_cs_draft_new');

    // Show pre-flight response immediately — replaced when API returns
    const preflight = getLocalCsResponse(finalContent);
    const preflightId = `pf_${Date.now()}`;
    preflightIdRef.current = preflightId;
    setMessages(prev => [...prev, {
      role: 'assistant',
      id: preflightId,
      content: preflight.content,
      suggestedActions: preflight.suggestedActions
    }]);

    setIsLoading(true);

    try {
      const token = localStorage.getItem('portal_token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Guest-ID': guestId
      };

      if (token && token !== 'null') {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const data = await sendConversationMessage({
        content: finalContent,
        conversationId: localStorage.getItem('reframe_cs_conv_id') || undefined,
        attachments,
        guestId: !currentUser ? guestId : undefined
      });
      const resultData: any = data || {};
      const result = { success: Boolean(data), data: resultData };
      if (typingTimeoutRef.current) {
        window.clearTimeout(typingTimeoutRef.current);
      }
      const typingConversationId = result?.data?.conversationId || localStorage.getItem('reframe_cs_conv_id');
      if (typingConversationId) {
        fetch(getApiEndpoint(`/portal/conversations/${typingConversationId}/typing`), {
          method: 'POST',
          headers,
          body: JSON.stringify({ isTyping: false }),
        }).catch(() => {});
      }
      
      if (result.success) {
        if (result.data.conversationId) {
          const isNewConv = result.data.conversationId !== convIdBeforeSend;
          localStorage.setItem('reframe_cs_conv_id', result.data.conversationId);
          if (isNewConv) fetchConversations();
        }
        
        const responseMessage = resultData?.message || resultData;
        const assistantContent = responseMessage?.content || result.data?.content || '';

        if (result.data?.awaitingHuman || result.data?.aiData?.awaitingHuman) {
          setMessages(prev => prev.filter(m => m.id !== preflightId));
          preflightIdRef.current = null;
          fetchCurrentConversationMessages(true);
          return;
        }

        if (!assistantContent) {
          throw new Error('Chat endpoint returned no customer-facing response');
        }

        const responseMeta = (() => {
          try {
            const raw = responseMessage?.metadata;
            if (!raw) return {};
            return typeof raw === 'string' ? JSON.parse(raw) : raw;
          } catch { return {}; }
        })();

        const assistantMsg: Message = {
          id: responseMessage?.id,
          role: 'assistant',
          content: assistantContent,
          requestContact: responseMeta.requestContact === true,
          suggestedActions: result.data?.aiData?.suggestedActions || responseMessage?.suggestedActions || []
        };

        // Replace pre-flight with real AI response
        setMessages(prev => prev.map(m => m.id === preflightId ? assistantMsg : m));
        preflightIdRef.current = null;

        // Smart Handoff Detection
        if (result.data.aiData?.intentAnalysis?.needHumanHandoff) {
          setTimeout(() => {
            setMessages(prev => [...prev, {
              role: 'assistant',
              content: "This looks like something our team should handle. Want me to loop in a human?",
              isHandoff: true
            }]);
          }, 1000);
        }
      } else {
        throw new Error('Chat request failed');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      // API failed — keep the pre-flight response but finalize it (strip temp id)
      setMessages(prev => prev.map(m => m.id === preflightId ? { ...m, id: undefined } : m));
      preflightIdRef.current = null;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const originalTitle = document.title;
    if (unreadAdminCount > 0) {
      document.title = `(${unreadAdminCount}) ${originalTitle}`;
      return () => {
        document.title = originalTitle;
      };
    }

    document.title = originalTitle;
    return () => {
      document.title = originalTitle;
    };
  }, [unreadAdminCount]);

  useEffect(() => () => {
    if (typingTimeoutRef.current) {
      window.clearTimeout(typingTimeoutRef.current);
    }
  }, []);

  const handleAttachClick = useCallback((type: 'image' | 'document' = 'image') => {
    if (type === 'image') {
      if (isExpanded && activeTab === 'chats') {
        window.setTimeout(() => fileInputRef.current?.click(), 0);
      } else {
        setFlowType('asset-first');
        setOrderFlowStep('files');
        setActiveTab('orderFlow');
        setIsExpanded(true);
        window.setTimeout(() => fileInputRef.current?.click(), 0);
      }
    } else {
      const docInput = document.getElementById('doc-upload-input') as HTMLInputElement;
      docInput?.click();
    }
  }, [activeTab, isExpanded]);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const isSupportUpload = orderFlowStep !== 'requirements' && (uploadedFilesRef.current.length > 0 || orderData.files.length > 0);
    // When the widget is minimized, never route uploads into chat.
    // Instead, move directly into the order flow and keep the files as order inputs.
    if (!isExpanded) {
      setOrderData(prev => ({
        ...prev,
        files: isSupportUpload ? prev.files : [...files, ...prev.files],
        supportFiles: isSupportUpload ? [...(prev.supportFiles || []), ...files] : (prev.supportFiles || [])
      }));
      if (isSupportUpload) {
        setFlowType('asset-first');
      } else {
        setFlowType('asset-first');
      }
      setOrderFlowStep('files');
      setActiveTab('orderFlow');
      setIsExpanded(true);
      return;
    }

    if (activeTab !== 'chats') {
      return;
    }

    const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.tiff', '.psd', '.bmp'];
    const isImages = files.every(f => imageExts.some(ext => f.name.toLowerCase().endsWith(ext)));

    // Show uploading message and track its index for removal
    let uploadingMsgIdx = -1;
    setMessages(prev => {
      uploadingMsgIdx = prev.length;
      return [...prev, { 
        role: 'assistant', 
        content: `Uploading...`,
        suggestedActions: []
      }];
    });
    setIsLoading(true);

    try {
      const token = localStorage.getItem('portal_token');
      const headers: Record<string, string> = {
        'X-Guest-ID': guestId
      };
      if (token && token !== 'null') {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const uploadedAttachments: ChatAttachment[] = [];

      // Upload each file to backend
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(getApiEndpoint('/portal/upload'), {
          method: 'POST',
          headers: {
            ...headers,
            'X-Upload-Category': isSupportUpload ? 'support' : 'original',
          },
          body: formData,
        });

        const result = await response.json();
        
        if (result.success && result.data?.url) {
          uploadedAttachments.push({
            url: result.data.url,
            filename: result.data.filename || file.name,
            size: result.data.size || file.size,
            type: file.type,
            path: result.data.path,
            folderPath: result.data.folderPath,
          });
        }
      }

      if (uploadedAttachments.length > 0) {
        // Remove the "Uploading..." message and send the actual result
        if (uploadingMsgIdx >= 0) {
          setMessages(prev => prev.filter((_, i) => i !== uploadingMsgIdx));
        }
        setIsLoading(false);
        await handleSendMessage(isImages ? `Uploaded ${files.length} image(s)` : `Attached ${files.length} document(s)`, uploadedAttachments);
        if (isImages) {
          if (!isSupportUpload) {
            setUploadedFiles(prev => [...prev, ...files]);
            uploadedFilesRef.current = [...uploadedFilesRef.current, ...files];
          }
          setOrderIntake(prev => ({ ...prev, step: 'file_count_verify', fileCount: files.length }));
        }
      } else {
        // Upload failed — remove uploading message, show fallback
        if (isImages) {
          setMessages(prev => {
            const next = prev.filter((_, i) => i !== uploadingMsgIdx);
            return [...next, { 
              role: 'user', 
              content: `[Uploaded ${files.length} image(s): ${files.map(f => f.name).join(', ')}]` 
            }];
          });
        } else {
          setMessages(prev => {
            const next = prev.filter((_, i) => i !== uploadingMsgIdx);
            return [...next, { 
              role: 'user', 
              content: `[Attached ${files.length} document(s): ${files.map(f => f.name).join(', ')}]` 
            }];
          });
        }
      }
    } catch (error) {
      console.error('Upload failed:', error);
      setMessages(prev => {
        const next = prev.filter((_, i) => i !== uploadingMsgIdx);
        return [...next, { 
          role: 'assistant', 
          content: 'Upload failed. Try again.'
        }];
      });
    } finally {
      setIsLoading(false);
    }
  }, [isExpanded, activeTab, guestId, handleSendMessage]);

  const handlePaste = useCallback(async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    const files: File[] = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf('image') !== -1) {
        const file = item.getAsFile();
        if (file) {
          const renameFile = new File([file], `screenshot_${Date.now()}.png`, { type: file.type });
          files.push(renameFile);
        }
      }
    }

    if (files.length > 0) {
      e.preventDefault();
      await handleFileChange({
        target: {
          files: files as any
        }
      } as React.ChangeEvent<HTMLInputElement>);
    }
  }, [handleFileChange]);

  const handleOrderAction = useCallback((action: string, value?: any) => {
    switch (action) {
      case 'select_service':
        setOrderIntake(prev => ({ ...prev, step: 'media_upload', selectedService: value }));
        break;
      case 'confirm_files':
        setOrderIntake(prev => ({ ...prev, step: 'instructions' }));
        break;
      case 'add_files':
        if (!isExpanded || activeTab !== 'orderFlow') {
          setFlowType('asset-first');
          setOrderFlowStep('files');
          setActiveTab('orderFlow');
          setIsExpanded(true);
          window.setTimeout(() => fileInputRef.current?.click(), 0);
        } else {
          fileInputRef.current?.click();
        }
        break;
      case 'remove_files':
        setUploadedFiles([]);
        uploadedFilesRef.current = [];
        setOrderIntake(prev => ({ ...prev, step: 'media_upload', fileCount: 0 }));
        break;
      case 'confirm_instructions':
        setOrderIntake(prev => ({ ...prev, step: 'timeline' }));
        break;
      case 'set_deadline':
        setOrderIntake(prev => ({ ...prev, step: 'email', deadline: value }));
        break;
      case 'submit_email':
        setOrderIntake(prev => ({ 
          ...prev, 
          step: 'complete', 
          email: value 
        }));
        // Send final confirmation to backend
        break;
      case 'start_new_order':
        setOrderIntake({ step: 'initial' });
        setUploadedFiles([]);
        uploadedFilesRef.current = [];
        break;
    }
  }, []);

  const toggleListening = useCallback(async () => {
    if (isListening) {
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRecognition) {
      showAlert({
        title: 'Not Supported',
        message: 'Voice typing (dictation) requires Chrome on Android or desktop Chrome/Edge. iPhone Safari/Chrome do not support Web Speech dictation.',
        variant: 'info'
      });
      return;
    }

    // Proactively check mic permission so we never show a failure without prompting first
    try {
      const result = await (navigator.permissions as any).query({ name: 'microphone' });
      if (result.state === 'denied') {
        showAlert({
          title: 'Microphone Blocked',
          message: 'Microphone access is blocked for this site. Please enable it in your browser settings (click the lock/tune icon in the address bar) and try again.',
          variant: 'info'
        });
        return;
      }
    } catch {
      // permissions.query not supported — proceed and let SpeechRecognition handle it
    }

    const recognition = new SpeechRecognition();
    try {
      recognition.lang = (navigator as any).language || 'en-US';
    } catch {}
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (e: any) => {
      setIsListening(false);
      const code = e?.error || 'unknown';
      const msg =
        code === 'not-allowed'
          ? 'Microphone permission is blocked. Enable mic access for this site in your browser settings.'
          : code === 'service-not-allowed'
            ? 'Dictation service is blocked by the browser.'
            : code === 'no-speech'
              ? 'No speech detected. Try again in a quieter place.'
              : code === 'audio-capture'
                ? 'No microphone found or it is in use by another app.'
                : 'Dictation failed. Please try again.';
      showAlert({ title: 'Dictation', message: msg, variant: 'info' });
    };

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0])
        .map((result: any) => result.transcript)
        .join('');
      
      setQuery(transcript);
      if (event.results[0].isFinal) {
        setIsListening(false);
      }
    };

    recognition.start();
  }, [isListening, showAlert]);

  if (isAdminRoute) return null;

  return (
    <motion.div
      ref={containerRef}
      initial={false}
      animate={{ 
        width: isEmbeddedPresentation
          ? '100%'
          : (isCompactViewport ? (isExpanded ? '100vw' : 'calc(100vw - 24px)') : (isExpanded ? 900 : 440)),
        height: isEmbeddedPresentation
          ? (isCompactViewport ? 620 : 624)
          : (isCompactViewport
            ? (isExpanded ? '100dvh' : 64)
            : (isExpanded ? 624 : 64)),
        x: isEmbeddedPresentation ? 0 : "-50%",
        y: isEmbeddedPresentation 
          ? 0 
          : (showcaseInView ? -360 : (isVisible ? 0 : 100)),
        opacity: isEmbeddedPresentation 
          ? 1 
          : (showcaseInView ? 0 : (isVisible ? 1 : 0)),
        scale: isEmbeddedPresentation 
          ? 1 
          : (showcaseInView ? 0.75 : (isVisible ? 1 : 0.92))
      }}
      transition={{
        type: "tween",
        duration: isCompactViewport ? 0.3 : 0.5,
        ease: [0.22, 1, 0.36, 1]
      }}
      className={`${isEmbeddedPresentation ? 'relative z-10 mx-auto' : 'fixed z-[260]'} ${
        !isExpanded && !isEmbeddedPresentation
          ? 'bg-[#f8f8f6] shadow-[inset_0_1px_0_rgba(255,255,255,0.94),0_2px_3px_rgba(0,0,0,0.05),0_12px_32px_rgba(0,0,0,0.10)]'
          : 'bg-white shadow-[0_24px_80px_-12px_rgba(0,0,0,0.15),0_0_0_1px_rgba(0,0,0,0.05)]'
      } ${
        !isEmbeddedPresentation
          ? (showCSGlow
              ? 'border-[#3b82f6] ring-4 ring-[#3b82f6]/20'
              : `hover:border-[#3b82f6] hover:ring-4 hover:ring-[#3b82f6]/20 ${
                  !isExpanded ? 'border-black/[0.14]' : 'border-[black/10]'
                }`)
          : 'border-[black/10]'
      } ${
        !isExpanded && !isEmbeddedPresentation
          ? 'after:content-[""] after:absolute after:-inset-10 after:rounded-[60px] after:pointer-events-auto after:z-[-1]'
          : ''
      } overflow-visible rounded-[24px] border transition-[border-color,box-shadow] duration-500`}
      style={{
        left: isEmbeddedPresentation ? undefined : '50%',
        bottom: isEmbeddedPresentation
          ? undefined
          : (isCompactViewport
            ? (isExpanded ? '0px' : '12px')
            : '16px'),
        borderRadius: isEmbeddedPresentation ? '24px' : (isCompactViewport ? (isExpanded ? '0px' : '18px') : '24px'),
        borderWidth: !isEmbeddedPresentation && isCompactViewport && isExpanded ? '0px' : '1px',
        pointerEvents: 'auto',
        willChange: 'transform, width, height, opacity',
        transition: isCompactViewport && !isEmbeddedPresentation
          ? 'bottom 0.3s cubic-bezier(0.22,1,0.36,1), border-radius 0.3s cubic-bezier(0.22,1,0.36,1), border-width 0.3s cubic-bezier(0.22,1,0.36,1)'
          : undefined
      }}
    >
      {unreadAdminCount > 0 && !isExpanded && (
        <div className="absolute -right-2 -top-2 z-[120] flex h-6 min-w-6 items-center justify-center rounded-full bg-red-600 px-1.5 text-[10px] font-black text-white shadow-lg ring-4 ring-white animate-pulse">
          {unreadAdminCount > 9 ? '9+' : unreadAdminCount}
        </div>
      )}
      <div className="flex w-full h-full overflow-hidden rounded-[inherit]">
        {/* Sidebar - Stable Width Animation */}
        <motion.div
          initial={false}
          layout
          animate={{ 
            width: isExpanded && !isCompactViewport ? 200 : 0,
            opacity: isExpanded && !isCompactViewport ? 1 : 0
          }}
          transition={{ 
            type: "tween",
            duration: 0.4,
            ease: [0.22, 1, 0.36, 1]
          }}
          className="bg-[#FDFDFD] border-r border-[black/10] flex flex-col shrink-0 overflow-hidden"
        >
                              <div className="w-[200px] h-full flex flex-col min-h-0">
            <div className="flex items-center gap-2 mb-5 shrink-0 px-4 pt-4">
              <motion.div 
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="w-5 h-5 rounded-md bg-[#171717] flex items-center justify-center"
              >
                <Zap size={10} className="text-white fill-white" />
              </motion.div>
              <span className="text-[11px] font-semibold tracking-[-0.02em] text-[#171717] uppercase">Reframe CS</span>
            </div>

            <nav className="space-y-1 overflow-y-auto overscroll-contain pr-2 scrollbar-hide mb-4 px-4">
              <button 
                type="button"
                onClick={handleOrderActionClick}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-full bg-[#171717] text-[12px] font-medium text-white hover:bg-black transition-all mb-4 group ${
                      showResumeOrderGlow && activeTab !== 'orderFlow'
                        ? 'shadow-[0_0_0_2px_rgba(59,130,246,0.88),0_0_0_8px_rgba(59,130,246,0.18),0_0_24px_rgba(59,130,246,0.42)] ring-2 ring-[var(--research-blue)]/45 ring-offset-2 ring-offset-white'
                        : 'shadow-[0px_0px_0px_1px_rgba(0,0,0,0.08)]'
                    }`}
                  >
                <Plus size={14} className={`text-white/70 group-hover:text-white transition-colors ${showResumeOrderGlow && activeTab !== 'orderFlow' ? 'animate-pulse' : ''}`} />
                {orderActionLabel}
              </button>
              {currentNavItems.filter(item => item.id !== 'chats').map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                    activeTab === item.id 
                      ? 'bg-[var(--research-blue)] text-[#171717] shadow-[0px_0px_0px_1px_rgba(0,0,0,0.08)]' 
                      : 'text-[#666666] hover:bg-[white] hover:text-[#171717]'
                  }`}
                >
                  <item.icon size={13} />
                  {item.label}
                </button>
              ))}
            </nav>

            {/* Combined Chat & History Section */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-6 mb-4 mt-2 scrollbar-hide">
              <div className="px-2 mb-1.5">
                <span className="text-[10px] font-bold text-[#808080] uppercase tracking-wider">Chats</span>
              </div>
              
              {/* New Chat / Support Button */}
              {currentNavItems.filter(item => item.id === 'chats').map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab('chats');
                    startNewChat();
                  }}
                  className={`w-full h-8 flex items-center gap-2.5 px-3 rounded-lg text-[11px] font-bold transition-all mb-2 ${
                    activeTab === 'chats' && !localStorage.getItem('reframe_cs_conv_id')
                      ? 'bg-[var(--research-blue)] text-[#171717] shadow-[0px_0px_0px_1px_rgba(0,0,0,0.08)]' 
                      : 'text-[#666666] border border-dashed border-[black/10] hover:bg-[white] hover:text-[#171717]'
                  }`}
                >
                  <MessageSquare size={13} />
                  New Chat
                </button>
              ))}

              {isConversationsLoading && conversations.length === 0 ? (
                <div className="px-3 py-2 text-[11px] text-[#999] animate-pulse">Loading...</div>
              ) : conversations.length === 0 ? (
                <div className="px-3 py-2 text-[11px] text-[#999] text-left bg-[white] rounded-lg">
                  No previous chats
                </div>
              ) : (
                <div className="space-y-0.5">
                  {[...conversations].sort((a, b) => {
                    const aPinned = pinnedIds.includes(a.id);
                    const bPinned = pinnedIds.includes(b.id);
                    if (aPinned && !bPinned) return -1;
                    if (!aPinned && bPinned) return 1;
                    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
                  }).map((conv) => (
                    <div
                      key={conv.id}
                      onClick={() => {
                        setActiveTab('chats');
                        loadConversation(conv.id);
                      }}
                      className={`w-full group relative flex items-center justify-between px-3 py-2.5 rounded-lg transition-all cursor-pointer border ${
                        localStorage.getItem('reframe_cs_conv_id') === conv.id
                          ? 'bg-[white] border-[black/10] shadow-sm'
                          : 'border-transparent hover:bg-[white]/80'
                      }`}
                    >
                      <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          {pinnedIds.includes(conv.id) && (
                            <Pin size={8} className="text-[var(--color-text-muted)] fill-[var(--color-text-muted)] shrink-0" />
                          )}
                          <span className={`text-[11px] font-bold truncate ${
                            localStorage.getItem('reframe_cs_conv_id') === conv.id ? 'text-[#171717]' : 'text-[#555]'
                          }`}>
                            {conv.title || `Chat Session ${conv.id.slice(0, 4)}`}
                          </span>
                        </div>
                        <span className="text-[9px] text-[#999] font-medium pl-0">
                          {new Date(conv.updatedAt).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Hover Actions */}
                      <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity ml-2 shrink-0">
                        <button
                          onClick={(e) => togglePin(conv.id, e)}
                          className={`min-w-10 min-h-10 p-1 rounded-md transition-colors flex items-center justify-center ${pinnedIds.includes(conv.id) ? 'text-[var(--color-text-primary)] bg-[var(--color-bg-secondary)]' : 'text-[#999] hover:bg-white hover:text-[#171717]'}`}
                          title={pinnedIds.includes(conv.id) ? "Unpin" : "Pin"}
                        >
                          <Pin size={10} className={pinnedIds.includes(conv.id) ? "fill-current" : ""} />
                        </button>
                        <button
                          onClick={(e) => deleteConversation(conv.id, e)}
                          className="min-w-10 min-h-10 p-1 text-[#999] hover:text-red-500 hover:bg-red-50 rounded-md transition-colors flex items-center justify-center"
                          title="Delete"
                        >
                          <Trash2 size={10} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

            <div className={`mt-auto border-t border-[black/10] bg-[white]/50 w-full flex items-center shrink-0 ${isExpanded ? 'min-h-[72px] sm:min-h-[64px]' : 'min-h-[64px]'}`}>
            <div className="px-4 py-3 flex items-center gap-3 w-full">
              <div className="w-8 h-8 rounded-full bg-[#171717] text-white flex items-center justify-center text-[10px] font-medium shadow-[0px_0px_0px_1px_rgba(0,0,0,0.08)] mr-2">{userInitial}</div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold text-[#171717] truncate tracking-[-0.01em]">{userName}</p>
                <p className="text-[9px] text-[#808080] font-medium">{userLabel}</p>
              </div>
              <Settings size={13} className="text-[#808080] hover:text-[#171717] cursor-pointer transition-colors" />
            </div>
          </div>
        </motion.div>

        {/* Main Content Pane */}
        <div className="flex-1 flex flex-col min-w-0 bg-transparent overflow-hidden">
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <div
              style={{
                height: isExpanded ? (showSupportHeaderDetails ? (isCompactViewport ? 88 : 92) : (isCompactViewport ? 56 : 48)) : 0,
                opacity: isExpanded ? 1 : 0,
                transition: 'height 200ms ease-out, opacity 200ms ease-out'
              }}
              className="overflow-hidden bg-white"
            >
              <div className={`px-4 sm:px-8 border-b border-[black/10] flex justify-between gap-3 ${showSupportHeaderDetails ? 'min-h-[92px] py-3 items-start' : 'h-14 sm:h-12 items-center'}`}>
                <div className={`flex min-w-0 flex-1 ${showSupportHeaderDetails ? 'flex-col gap-1.5 pr-2 pt-0' : 'items-center gap-2.5'}`}>
                  {showSupportHeaderDetails ? (
                    <>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[#171717] text-[14px] sm:text-[14px] font-semibold sm:font-medium tracking-[-0.01em]">
                          {isAdmin ? 'Assistance' : 'Human support'}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-emerald-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          Replies in minutes
                        </span>
                      </div>
                      <span className="max-w-[360px] text-[11px] sm:text-[12px] leading-snug text-[#6f6f6f]">
                        Ask about services, pricing, or your account. A real teammate replies.
                      </span>
                    </>
                  ) : (
                    <span className="text-[#171717] text-[14px] sm:text-[13px] font-semibold sm:font-medium capitalize tracking-[-0.01em]">
                      {currentNavItems.find(n => n.id === activeTab)?.label || activeTab}
                    </span>
                  )}
                </div>
                <div className="flex h-full items-center gap-2 self-center">
                  {!isAdmin && !isAuthenticated && activeTab === 'chats' && (
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isEmbeddedPresentation) setIsExpanded(false);
                        setHasPendingOrderFlow(false);
                        navigate('/signup');
                      }}
                      className="inline-flex h-8 sm:h-9 shrink-0 items-center justify-center rounded-full border border-[#e5e5e5] bg-white px-2.5 sm:px-3 text-[11px] sm:text-[12px] font-semibold text-[#171717] transition-all hover:border-[#d9d9d9] hover:bg-[white]"
                      aria-label="Sign up"
                    >
                      Sign up
                    </motion.button>
                  )}
                  {showLauncher && (
                    <motion.button 
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpand();
                      }} 
                      className="w-8 h-8 sm:w-8 sm:h-8 shrink-0 border border-[#e5e5e5] bg-white text-[#171717] hover:border-[#d9d9d9] hover:bg-white rounded-full transition-all shadow-sm flex items-center justify-center"
                      aria-label={isExpanded ? 'Collapse Reframe CS' : 'Expand Reframe CS'}
                    >
                      {isExpanded ? <Minus size={15} /> : <Maximize2 size={15} />}
                    </motion.button>
                  )}
                   {(isAdmin || isAuthenticated) && (
                    <motion.button 
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(isAdmin ? '/admin' : '/dashboard');
                      }}
                      className="group w-8 h-8 sm:w-8 sm:h-8 shrink-0 border border-[#e5e5e5] bg-white hover:border-[#d9d9d9] hover:bg-white rounded-full transition-all text-[#808080] hover:text-[#171717] shadow-sm flex items-center justify-center"
                      aria-label="Open dashboard"
                    >
                      <ArrowRight size={14} className="transition-transform duration-300 group-hover:-rotate-45" />
                    </motion.button>
                  )}
                </div>
              </div>
            </div>

            {isExpanded && isCompactViewport && (
              <div className="border-b border-[black/10] bg-white px-4 py-2.5 overflow-x-auto scrollbar-hide">
                <div className="flex items-center gap-2 min-w-max">
                  <button
                    type="button"
                    onClick={handleOrderActionClick}
                    className={`min-h-[44px] px-3 rounded-full text-[11px] font-bold transition-all flex items-center gap-1.5 ${
                      activeTab === 'orderFlow'
                        ? 'bg-[#171717] text-white'
                        : hasPendingOrderFlow
                          ? 'bg-[var(--research-blue)]/15 text-[#171717] ring-2 ring-[var(--research-blue)]/60 ring-offset-2 ring-offset-white shadow-[0_0_0_4px_rgba(59,130,246,0.20),0_0_18px_rgba(59,130,246,0.30)]'
                          : 'bg-[#f5f5f5] text-[#171717]'
                    }`}
                  >
                    <Plus size={13} />
                    {orderActionLabel}
                  </button>
                  <button
                    onClick={() => { setActiveTab('chats'); fetchConversations(); }}
                    className={`min-h-[44px] px-3 rounded-full text-[11px] font-bold transition-all flex items-center gap-1.5 ${
                      activeTab === 'chats' ? 'bg-[var(--research-blue)] text-[#171717]' : 'bg-[#f5f5f5] text-[#555]'
                    }`}
                  >
                    <MessageSquare size={13} />
                    Chats
                  </button>
                  {mobileNavItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`min-h-[44px] px-3 rounded-full text-[11px] font-bold transition-all flex items-center gap-1.5 ${
                        activeTab === item.id ? 'bg-[var(--research-blue)] text-[#171717]' : 'bg-[#f5f5f5] text-[#555]'
                      }`}
                    >
                      <item.icon size={13} />
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Content Area */}
            <div
              ref={contentScrollRef}
              className={`flex-1 relative ${
                activeTab === 'orderFlow'
                  ? 'overflow-hidden'
                  : `overflow-y-auto overscroll-contain ${isCompactViewport && isExpanded ? 'scrollbar-hide' : ''}`
              }`}
            >
              <AnimatePresence mode="popLayout">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ 
                      duration: 0.3, 
                      ease: "easeOut"
                    }}
                    className={`max-w-3xl mx-auto ${activeTab === 'orderFlow' ? 'h-full px-3 sm:px-8 py-2' : 'p-3 sm:p-6'}`}
                  >
                  {activeTab === 'chats' ? (
                    <div className="space-y-2">
                    <div className="space-y-2">
                      {isCompactViewport && activeTab === 'chats' && conversations.length > 0 && (
                        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                          {[...conversations]
                            .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                            .slice(0, 8)
                            .map((conv) => (
                              <button
                                key={conv.id}
                                onClick={() => loadConversation(conv.id)}
                                className={`min-h-9 max-w-[160px] shrink-0 rounded-full border px-3 text-left text-[11px] font-bold transition-all ${
                                  localStorage.getItem('reframe_cs_conv_id') === conv.id
                                    ? 'border-[var(--research-blue)] bg-[var(--research-blue-light)] text-[#171717]'
                                    : 'border-[black/10] bg-white text-[#555]'
                                }`}
                              >
                                <span className="block truncate">{conv.title || `Chat ${conv.id.slice(0, 4)}`}</span>
                              </button>
                            ))}
                        </div>
                      )}

                      {messages.map((msg, i) => {
                        const attachments = getMessageAttachments(msg);
                        const orderCard = getOrderCard(msg);
                        const rawTimestamp = getMessageTimestamp(msg);
                        const timestamp = rawTimestamp
                          ? new Date(rawTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : '';
                        const meta = parseMessageMetadata(msg);
                        const isHuman = Boolean(meta.isHuman || meta.source === 'admin-dashboard' || meta.source === 'telegram');
                        const nextMsg = messages[i + 1];
                        const nextMeta = nextMsg ? parseMessageMetadata(nextMsg) : {};
                        const nextIsHuman = Boolean(nextMeta.isHuman || nextMeta.source === 'admin-dashboard' || nextMeta.source === 'telegram');
                        const sameMinuteAsNext = Boolean(
                          nextMsg &&
                          getMessageSenderKey(nextMsg, nextIsHuman) === getMessageSenderKey(msg, isHuman) &&
                          Math.abs(new Date(getMessageTimestamp(nextMsg)).getTime() - new Date(rawTimestamp).getTime()) < SAME_MINUTE_MS
                        );
                        const showMetaRow = Boolean(timestamp && !sameMinuteAsNext);
                        const messageIdentity = `${msg.id || msg.createdAt || ''}:${msg.content}`;
                        const showUnreadDivider = Boolean(unreadAdminStartId && isHuman && messageIdentity === unreadAdminStartId);

                        return (
                          <div key={i} className="space-y-1 group">
                            {showUnreadDivider && (
                              <div className="flex items-center gap-3 py-1">
                                <div className="h-px flex-1 bg-red-200" />
                                <span className="text-[10px] font-bold uppercase tracking-wide text-red-600">Unread messages</span>
                                <div className="h-px flex-1 bg-red-200" />
                              </div>
                            )}
                            <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                              <div className="max-w-[85%] flex flex-col gap-1">
                                {isHuman && (
                                  <div className="flex items-center gap-1.5 px-1 mb-0.5">
                                    <div className="w-3.5 h-3.5 rounded-full bg-blue-600 flex items-center justify-center">
                                      <Check size={8} className="text-white" strokeWidth={4} />
                                    </div>
                                    <span className="text-[10px] font-bold text-blue-700 uppercase tracking-tight">Studio Admin</span>
                                  </div>
                                )}
                                {msg.role === 'user' ? (
                                  <div
                                    className="px-4 py-2.5 rounded-2xl text-[13px] leading-relaxed bg-[#171717] text-white"
                                    onContextMenu={(e) => { e.preventDefault(); openMessageActions(msg); }}
                                    onTouchStart={() => startMessageLongPress(msg)}
                                    onTouchEnd={cancelMessageLongPress}
                                    onTouchMove={cancelMessageLongPress}
                                    onTouchCancel={cancelMessageLongPress}
                                  >
                                    {msg.content && <MarkdownRenderer content={msg.content} onNavigate={() => { if (!isEmbeddedPresentation) setIsExpanded(false); }} />}
                                    {orderCard && (
                                      <a href={orderCard.customerLink} target="_blank" rel="noreferrer" className="mt-2 block rounded-xl border border-black/10 bg-white/75 p-3 text-[12px] text-[#171717] shadow-sm">
                                        <div className="flex items-start justify-between gap-2">
                                          <div className="font-bold">{orderCard.code || orderCard.orderId || 'Order'}</div>
                                          <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${getOrderStatusTone(orderCard.status)}`}>{(orderCard.status || 'new').replace(/_/g, ' ')}</span>
                                        </div>
                                        <div className="mt-1 font-semibold">{orderCard.title || 'Order details'}</div>
                                        <div className="mt-2 text-[11px] text-[#666]">Updates automatically</div>
                                        <div className="mt-2 text-[11px] font-bold underline">View order</div>
                                      </a>
                                    )}
                                    {attachments.length > 0 && (
                                      <div className="mt-2 space-y-2">
                                        {attachments.map((attachment) => {
                                          const isImage = attachment.type?.startsWith('image/') || /\.(png|jpe?g|gif|webp|tiff?)$/i.test(attachment.filename);
                                          return (
                                            <div key={attachment.url} className="rounded-xl border border-black/10 bg-white/70 p-2">
                                              {isImage && <a href={attachment.url} target="_blank" rel="noreferrer" className="mb-2 block overflow-hidden rounded-lg"><img src={attachment.url} alt={attachment.filename} className="max-h-40 max-w-full object-cover" /></a>}
                                              <div className="flex items-center gap-2 text-[11px]">
                                                <Paperclip size={12} />
                                                <span className="min-w-0 flex-1 truncate font-bold">{attachment.filename}</span>
                                                <span className="text-[#999]">{formatFileSize(attachment.size)}</span>
                                                <a href={attachment.url} download target="_blank" rel="noreferrer" className="rounded-full bg-black px-2 py-1 text-[10px] font-bold text-white">Download</a>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                ) : isHuman ? (
                                  <div
                                    className="px-4 py-2.5 rounded-2xl text-[13px] leading-relaxed bg-blue-50 border border-blue-100 shadow-sm text-[#171717]"
                                    onContextMenu={(e) => { e.preventDefault(); openMessageActions(msg); }}
                                    onTouchStart={() => startMessageLongPress(msg)}
                                    onTouchEnd={cancelMessageLongPress}
                                    onTouchMove={cancelMessageLongPress}
                                    onTouchCancel={cancelMessageLongPress}
                                  >
                                    {msg.content && <MarkdownRenderer content={msg.content} onNavigate={() => { if (!isEmbeddedPresentation) setIsExpanded(false); }} />}
                                    {orderCard && (
                                      <a href={orderCard.customerLink} target="_blank" rel="noreferrer" className="mt-2 block rounded-xl border border-black/10 bg-white/75 p-3 text-[12px] text-[#171717] shadow-sm">
                                        <div className="flex items-start justify-between gap-2">
                                          <div className="font-bold">{orderCard.code || orderCard.orderId || 'Order'}</div>
                                          <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${getOrderStatusTone(orderCard.status)}`}>{(orderCard.status || 'new').replace(/_/g, ' ')}</span>
                                        </div>
                                        <div className="mt-1 font-semibold">{orderCard.title || 'Order details'}</div>
                                        <div className="mt-2 text-[11px] text-[#666]">Updates automatically</div>
                                        <div className="mt-2 text-[11px] font-bold underline">View order</div>
                                      </a>
                                    )}
                                    {attachments.length > 0 && (
                                      <div className="mt-2 space-y-2">
                                        {attachments.map((attachment) => {
                                          const isImage = attachment.type?.startsWith('image/') || /\.(png|jpe?g|gif|webp|tiff?)$/i.test(attachment.filename);
                                          return (
                                            <div key={attachment.url} className="rounded-xl border border-black/10 bg-white/70 p-2">
                                              {isImage && <a href={attachment.url} target="_blank" rel="noreferrer" className="mb-2 block overflow-hidden rounded-lg"><img src={attachment.url} alt={attachment.filename} className="max-h-40 max-w-full object-cover" /></a>}
                                              <div className="flex items-center gap-2 text-[11px]">
                                                <Paperclip size={12} />
                                                <span className="min-w-0 flex-1 truncate font-bold">{attachment.filename}</span>
                                                <span className="text-[#999]">{formatFileSize(attachment.size)}</span>
                                                <a href={attachment.url} download target="_blank" rel="noreferrer" className="rounded-full bg-black px-2 py-1 text-[10px] font-bold text-white">Download</a>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                    {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                                      <SuggestedActions
                                        actions={msg.suggestedActions.map(a => typeof a === 'string' ? { text: a } : a)}
                                        onActionClick={(action) => {
                                          if (action.url) {
                                            if (action.url.startsWith('/')) { navigate(action.url); } else { window.open(action.url, '_blank'); }
                                            if (!isEmbeddedPresentation) setIsExpanded(false);
                                          } else { handleSendMessage(action.text); }
                                        }}
                                      />
                                    )}
                                    {msg.requestContact && !contactCaptured && (
                                      <div className="mt-3">
                                        <ContactCaptureCard
                                          conversationId={currentConversationId}
                                          guestId={guestId}
                                          onCaptured={() => setContactCaptured(true)}
                                        />
                                      </div>
                                    )}
                                    {msg.isHandoff && (
                                      <button
                                        onClick={async () => {
                                          const convId = localStorage.getItem('reframe_cs_conv_id');
                                          if (!convId) return;
                                          try {
                                            setIsLoading(true);
                                            const token = localStorage.getItem('portal_token');
                                            const headers: Record<string, string> = { 'Content-Type': 'application/json', 'X-Guest-ID': guestId };
                                            if (token && token !== 'null') headers['Authorization'] = `Bearer ${token}`;
                                            const response = await fetch(getApiEndpoint('/portal/chat/escalate'), { method: 'POST', headers, body: JSON.stringify({ conversationId: convId }) });
                                            const result = await response.json();
                                            if (result.success) {
                                              setMessages(prev => [...prev, { role: 'assistant', content: "I've notified the team. Keep typing. They'll see your messages here." }]);
                                              fetchConversations();
                                            }
                                          } catch (err) { console.error("Escalation failed:", err); } finally { setIsLoading(false); }
                                        }}
                                        className="mt-2 px-3 py-1.5 rounded-lg bg-blue-50 text-[11px] font-bold text-blue-600 hover:bg-blue-100 flex items-center gap-2 transition-all border border-blue-200/50 shadow-sm"
                                      >
                                        <Users size={12} />
                                        Talk to a human
                                      </button>
                                    )}
                                  </div>
                                ) : (
                                  <div
                                    className="bg-white border border-black/[0.08] shadow-sm rounded-2xl overflow-hidden text-[13px] text-[#171717]"
                                    onContextMenu={(e) => { e.preventDefault(); openMessageActions(msg); }}
                                    onTouchStart={() => startMessageLongPress(msg)}
                                    onTouchEnd={cancelMessageLongPress}
                                    onTouchMove={cancelMessageLongPress}
                                    onTouchCancel={cancelMessageLongPress}
                                  >
                                    <div className="flex items-center gap-2 px-4 py-2.5 border-b border-black/[0.05]">
                                      <div className="w-2 h-2 rounded-full bg-[#171717] shrink-0" />
                                      <span className="text-[11px] font-semibold text-[#171717] tracking-tight">Reframe CS</span>
                                      <span className="ml-auto text-[9px] font-bold uppercase tracking-widest text-[#aaa]">AI</span>
                                    </div>
                                    <div className="px-4 py-3 leading-relaxed">
                                      {msg.content && <MarkdownRenderer content={msg.content} onNavigate={() => { if (!isEmbeddedPresentation) setIsExpanded(false); }} />}
                                      {orderCard && (
                                        <a href={orderCard.customerLink} target="_blank" rel="noreferrer" className="mt-2 block rounded-xl border border-black/10 bg-[#fafafa] p-3 text-[12px] text-[#171717] shadow-sm">
                                          <div className="flex items-start justify-between gap-2">
                                            <div className="font-bold">{orderCard.code || orderCard.orderId || 'Order'}</div>
                                            <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${getOrderStatusTone(orderCard.status)}`}>{(orderCard.status || 'new').replace(/_/g, ' ')}</span>
                                          </div>
                                          <div className="mt-1 font-semibold">{orderCard.title || 'Order details'}</div>
                                          <div className="mt-2 text-[11px] text-[#666]">Updates automatically</div>
                                          <div className="mt-2 text-[11px] font-bold underline">View order</div>
                                        </a>
                                      )}
                                      {attachments.length > 0 && (
                                        <div className="mt-2 space-y-2">
                                          {attachments.map((attachment) => {
                                            const isImage = attachment.type?.startsWith('image/') || /\.(png|jpe?g|gif|webp|tiff?)$/i.test(attachment.filename);
                                            return (
                                              <div key={attachment.url} className="rounded-xl border border-black/10 bg-[#fafafa] p-2">
                                                {isImage && <a href={attachment.url} target="_blank" rel="noreferrer" className="mb-2 block overflow-hidden rounded-lg"><img src={attachment.url} alt={attachment.filename} className="max-h-40 max-w-full object-cover" /></a>}
                                                <div className="flex items-center gap-2 text-[11px]">
                                                  <Paperclip size={12} />
                                                  <span className="min-w-0 flex-1 truncate font-bold">{attachment.filename}</span>
                                                  <span className="text-[#999]">{formatFileSize(attachment.size)}</span>
                                                  <a href={attachment.url} download target="_blank" rel="noreferrer" className="rounded-full bg-black px-2 py-1 text-[10px] font-bold text-white">Download</a>
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      )}
                                      {msg.isHandoff && (
                                        <button
                                          onClick={async () => {
                                            const convId = localStorage.getItem('reframe_cs_conv_id');
                                            if (!convId) return;
                                            try {
                                              setIsLoading(true);
                                              const token = localStorage.getItem('portal_token');
                                              const headers: Record<string, string> = { 'Content-Type': 'application/json', 'X-Guest-ID': guestId };
                                              if (token && token !== 'null') headers['Authorization'] = `Bearer ${token}`;
                                              const response = await fetch(getApiEndpoint('/portal/chat/escalate'), { method: 'POST', headers, body: JSON.stringify({ conversationId: convId }) });
                                              const result = await response.json();
                                              if (result.success) {
                                                setMessages(prev => [...prev, { role: 'assistant', content: "I've notified the team. Keep typing. They'll see your messages here." }]);
                                                fetchConversations();
                                              }
                                            } catch (err) { console.error("Escalation failed:", err); } finally { setIsLoading(false); }
                                          }}
                                          className="mt-3 px-3 py-1.5 rounded-lg bg-black/[0.04] text-[11px] font-bold text-[#171717] hover:bg-black/[0.07] flex items-center gap-2 transition-all border border-black/[0.06]"
                                        >
                                          <Users size={12} />
                                          Talk to a human
                                        </button>
                                      )}
                                    </div>
                                    {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                                      <div className="px-4 pb-3 border-t border-black/[0.04] pt-1">
                                        <SuggestedActions
                                          actions={msg.suggestedActions.map(a => typeof a === 'string' ? { text: a } : a)}
                                          onActionClick={(action) => {
                                            if (action.url) {
                                              if (action.url.startsWith('/')) { navigate(action.url); } else { window.open(action.url, '_blank'); }
                                              if (!isEmbeddedPresentation) setIsExpanded(false);
                                            } else { handleSendMessage(action.text); }
                                          }}
                                        />
                                      </div>
                                    )}
                                    {msg.requestContact && !contactCaptured && (
                                      <div className="px-4 pb-3">
                                        <ContactCaptureCard
                                          conversationId={currentConversationId}
                                          guestId={guestId}
                                          onCaptured={() => setContactCaptured(true)}
                                        />
                                      </div>
                                    )}
                                  </div>
                                )}
                                {showMetaRow && (
                                  <div className={`text-[9px] text-[#aaaaaa] ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                                    {timestamp}
                                    {msg.role === 'user' ? (
                                      <span
                                        className={`ml-1.5 inline-flex items-center ${supportSeenMessageId === msg.id ? 'text-blue-600' : 'text-[#9b9b9b]'}`}
                                        aria-label={supportSeenMessageId === msg.id ? 'Seen' : 'Delivered'}
                                        title={supportSeenMessageId === msg.id ? 'Seen' : 'Delivered'}
                                      >
                                        ✓✓
                                      </span>
                                    ) : null}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      
                      {isLoading && !preflightIdRef.current && (
                        <div className="flex justify-start">
                          <div className="bg-white border border-black/[0.08] shadow-sm rounded-2xl overflow-hidden text-[13px] text-[#171717]">
                            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-black/[0.05]">
                              <div className="w-2 h-2 rounded-full bg-[#171717] shrink-0" />
                              <span className="text-[11px] font-semibold text-[#171717] tracking-tight">Reframe CS</span>
                              <span className="ml-auto text-[9px] font-bold uppercase tracking-widest text-[#aaa]">AI</span>
                            </div>
                            <div className="px-4 py-3 flex items-center gap-2">
                              <div className="flex gap-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#171717] animate-bounce" style={{ animationDelay: '0ms' }} />
                                <div className="w-1.5 h-1.5 rounded-full bg-[#555] animate-bounce" style={{ animationDelay: '150ms' }} />
                                <div className="w-1.5 h-1.5 rounded-full bg-[#171717] animate-bounce" style={{ animationDelay: '300ms' }} />
                              </div>
                              <span className="text-[11px] text-[#777]">Thinking...</span>
                            </div>
                          </div>
                        </div>
                      )}
                      {!isLoading && isSupportTyping && (
                        <div className="flex justify-start">
                          <div className="bg-blue-50 border border-blue-100 px-4 py-2 rounded-2xl flex items-center gap-2">
                            <div className="flex gap-1">
                              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                            <span className="text-[11px] text-blue-700 font-medium">Support is typing...</span>
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                    {showJumpToLatest && (
                      <div className="sticky bottom-3 flex justify-center">
                        <button
                          onClick={() => { scrollToBottom(true); setShowJumpToLatest(false); }}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#171717] text-white text-[11px] font-semibold rounded-full shadow-lg hover:bg-black transition-all"
                        >
                          <ArrowRight size={11} className="rotate-90" />
                          New message
                        </button>
                      </div>
                    )}
                    </div>
                  ) : activeTab === 'jobs' ? (
                    <div className="space-y-3">
                      {jobs.filter(j => j.status !== 'delivered').map(job => (
                        <div key={job.id} className="p-4 rounded-xl border border-[black/10] bg-white hover:border-[#171717]/10 transition-all group relative overflow-hidden">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <h3 className="text-[13px] font-semibold text-[#171717]">{job.title}</h3>
                              {job.isPriority && (
                                <span className="text-[9px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded-md font-bold uppercase tracking-tight">Priority</span>
                              )}
                            </div>
                            <span className={`px-2 py-0.5 rounded-full border text-[9px] font-bold uppercase tracking-wider ${
                              job.status === 'processing' ? 'bg-[var(--research-blue-light)] border-[var(--research-blue)]/30 text-[#171717]' : 
                              job.status === 'review' ? 'bg-[var(--research-peach-light)] border-[var(--research-peach)]/30 text-[#171717]' :
                              'bg-[white] border-[black/10] text-[#171717]'
                            }`}>
                              {job.status}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-[#808080]">
                            <div className="flex items-center gap-3">
                              <span>{job.itemCount} Items</span>
                              <span>•</span>
                              <span>${job.totalPrice || '0.00'}</span>
                            </div>
                            <span className="text-[10px] font-medium text-[#171717] opacity-0 group-hover:opacity-100 transition-opacity">Track Details</span>
                          </div>
                          {job.status === 'processing' && (
                            <div className="absolute bottom-0 left-0 h-[2px] bg-[var(--research-blue)] w-[60%]" />
                          )}
                        </div>
                      ))}
                      {jobs.filter(j => j.status !== 'delivered').length === 0 && (
                        <div className="text-center py-10">
                          <p className="text-[13px] text-[#666]">No active jobs.</p>
                        </div>
                      )}
                    </div>
                  ) : activeTab === 'orders' ? (
                    <div className="space-y-3">
                      {jobs.filter(j => j.status === 'delivered').map(order => (
                        <div key={order.id} className="p-4 rounded-xl border border-[black/10] bg-[white]/30 hover:bg-white transition-all flex items-center justify-between group">
                          <div>
                            <h3 className="text-[13px] font-semibold text-[#171717]">{order.title}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <p className="text-[10px] text-[#808080]">ID: {order.id.slice(0,8)}</p>
                              <span className="text-[10px] text-[black/10]">|</span>
                              <p className="text-[10px] text-[#808080]">${order.totalPrice}</p>
                            </div>
                          </div>
                          <button className="px-3 py-1.5 rounded-full bg-[#171717] text-white text-[11px] font-medium opacity-0 group-hover:opacity-100 transition-opacity">Reorder</button>
                        </div>
                      ))}
                    </div>
                  ) : activeTab === 'gallery' ? (
                    <div className="grid grid-cols-3 gap-3">
                      {jobs.filter(j => j.status === 'delivered' && (j.deliveredFiles?.length ?? 0) > 0).flatMap(j => j.deliveredFiles || []).slice(0, 9).map((file, i) => (
                        <div key={i} className="aspect-square rounded-xl bg-[white] border border-[black/10] overflow-hidden group cursor-pointer relative">
                           {file?.url && (
                             <img 
                              src={file.url} 
                              alt="Delivered Asset" 
                              className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                            />
                           )}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <span className="text-white text-[10px] font-bold uppercase tracking-wider">Download</span>
                          </div>
                        </div>
                      ))}
                      {jobs.filter(j => j.status === 'delivered' && (j.deliveredFiles?.length ?? 0) > 0).length === 0 && (
                         [1,2,3,4,5,6].map(i => (
                          <div key={i} className="aspect-square rounded-xl bg-[white] border border-[black/10] overflow-hidden group cursor-pointer relative">
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="text-[10px] text-[black/10] font-bold uppercase tracking-widest">No Asset</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  ) : activeTab === 'orderFlow' ? (
                    <div className="h-full">
                      <OrderFlowUI 
                        orderFlowStep={orderFlowStep}
                        setOrderFlowStep={setOrderFlowStep}
                        flowType={flowType}
                        orderData={orderData}
                      setOrderData={setOrderData}
                      guestId={guestId}
                      isExpanded={isExpanded}
                      setIsExpanded={setIsExpanded}
                      onCancel={() => setActiveTab('chats')}
                      onComplete={() => {
                        setHasPendingOrderFlow(false);
                        setActiveTab('chats');
                      }}
                      onOpenChat={() => {
                        setActiveTab('chats');
                        setIsExpanded(true);
                      }}
                    />
                  </div>
                  ) : (
                    <div className="text-center py-20">
                      <p className="text-[13px] text-[#666]">Coming soon.</p>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
            {/* File Previews (Crops) */}
            {uploadedFiles.length > 0 && (
              <div className="px-5 py-2 flex gap-2 border-b border-[#f1f1f1]/50 overflow-x-auto bg-white/50">
                {uploadedFiles.map((file, idx) => (
                  <div key={idx} className="relative shrink-0 group">
                    <ObjectUrlImage
                      file={file}
                      alt="preview"
                      className="w-10 h-10 sm:w-8 sm:h-8 rounded-md object-cover border border-black/5"
                    />
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setUploadedFiles(prev => prev.filter((_, i) => i !== idx));
                      }}
                      className="absolute -top-2 -right-2 w-7 h-7 sm:w-5 sm:h-5 bg-black text-white rounded-full flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shadow-md" aria-label="Remove preview"
                    >
                      <Minus size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Hide chat input bar in order flow */}
            {activeTab !== 'orderFlow' && (
            <div className={`relative mt-auto flex w-full flex-col shrink-0 ${
              !isExpanded && !isEmbeddedPresentation
                ? 'border-t border-transparent bg-[#f8f8f6]'
                : 'border-t border-[#f1f1f1] bg-white'
            } ${isExpanded ? 'min-h-[72px] sm:min-h-[64px] h-auto' : 'min-h-[64px] h-auto'}`}>
              {isExpanded && isCompactViewport && !isEmbeddedPresentation && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsExpanded(false);
                  }}
                  className="absolute right-4 -top-11 z-30 h-8 w-8 rounded-lg border border-[#e5e5e5] bg-white text-[#777777] shadow-sm hover:bg-[#f7f7f7] transition-colors flex items-center justify-center"
                  aria-label="Minimize Reframe CS"
                >
                  <ChevronDown size={15} />
                </button>
              )}
              <div
                className={`flex items-center flex-1 min-h-[64px] sm:min-h-[64px]`}
                style={isCompactViewport && isExpanded && !isEmbeddedPresentation ? { paddingBottom: 'env(safe-area-inset-bottom, 0px)' } : undefined}
              >
              <div
                className={`relative w-full flex items-center gap-2 sm:gap-3 px-4 sm:px-4 cursor-text min-h-[64px] sm:min-h-[64px] py-1.5 sm:py-2`}
                onClick={() => {
                  if (!isExpanded) {
                    setIsExpanded(true);
                  }
                  setTimeout(() => inputRef.current?.focus(), 100);
                }}
              >
                {/* Left Actions - Grouped with balanced spacing */}
                <div className="flex items-center gap-2 shrink-0 sm:mr-1">
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    className="hidden"
                    accept="image/*"
                    multiple
                  />
                  <input 
                    id="doc-upload-input"
                    type="file"
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.txt"
                    multiple
                  />
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleAttachClick('image'); }}
                    className="group relative flex h-10 w-10 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full border border-black/80 bg-[#171717] text-[11px] font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_2px_3px_rgba(0,0,0,0.12),0_7px_16px_rgba(0,0,0,0.12)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-black hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_3px_4px_rgba(0,0,0,0.14),0_10px_22px_rgba(0,0,0,0.16)] sm:w-[128px] sm:px-3"
                    aria-label="Upload images"
                  >
                    <Paperclip size={13} className="shrink-0" />
                    <span className="hidden sm:inline whitespace-nowrap leading-none">
                      <span className="transition-opacity duration-200 group-hover:opacity-0">Upload Images</span>
                      <span className="absolute inset-x-0 px-3 top-1/2 -translate-y-1/2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">New Order</span>
                    </span>
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); toggleListening(); }}
                    className={`flex h-9 w-9 items-center justify-center rounded-full border transition-all duration-300 sm:h-10 sm:w-10 ${
                      isListening ? 'text-red-500 bg-red-50 ring-2 ring-red-200 border-red-100' : 'border-black/[0.12] bg-[#f8f8f6] text-[#171717] shadow-[inset_0_1px_0_rgba(255,255,255,0.94),0_1px_2px_rgba(0,0,0,0.04)] hover:-translate-y-0.5 hover:border-black/[0.18] hover:bg-white'
                    }`}
                    aria-label="Voice typing (dictation)"
                  >
                    <AudioLines size={14} className={isListening ? 'animate-pulse' : ''} />
                  </button>
                </div>
                
                {/* Stretchy Center - Improved Padding and Alignment */}
                <div className={`relative flex-1 min-w-0 h-full flex items-center gap-2 px-1 sm:px-2 ${hasCollapsedDraft ? 'justify-center' : ''}`}>
                  <textarea
                    ref={inputRef}
                    value={query}
                    onChange={handleQueryChange}
                    onPaste={handlePaste}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        if (e.shiftKey) {
                          e.preventDefault();
                          const input = inputRef.current;
                          if (input) {
                            const start = input.selectionStart ?? 0;
                            const end = input.selectionEnd ?? 0;
                            const newValue = query.substring(0, start) + '\n' + query.substring(end);
                            setQuery(newValue);
                            setTimeout(() => {
                              input.selectionStart = input.selectionEnd = start + 1;
                              resizeInput();
                            }, 0);
                          }
                        } else {
                          e.preventDefault();
                          if (!isLoading && query.trim()) handleSendMessage();
                        }
                      }
                    }}
                    onFocus={() => { if (!isEmbeddedPresentation) setIsExpanded(true); }}
                    aria-label={hasCollapsedDraft ? 'Draft saved. Tap to expand and continue editing.' : 'Message input'}
                    placeholder={
                      isListening
                        ? "Listening..."
                        : (latestAdminPreview ? `New reply: ${latestAdminPreview}` : '')
                    }
                    rows={1}
                    className={`w-full resize-none border-none outline-none text-left text-[12px] sm:text-[13px] font-normal text-black placeholder-[#A1A1AA] leading-[1.35] bg-transparent min-h-10 max-h-40 py-2.5 sm:py-2.5 ${isExpanded ? 'pl-4 sm:pl-3' : 'px-0 sm:px-2'} ${!isExpanded ? 'overflow-hidden ' : ''}${hasCollapsedDraft ? 'text-transparent caret-transparent selection:bg-transparent' : ''}`}
                  />
                  {!query.trim() && !isListening && !latestAdminPreview && (
                    <div
                      className={`pointer-events-none absolute inset-y-0 left-0 right-0 flex items-center justify-center text-center truncate text-[12px] sm:text-[13px] text-[#A1A1AA] transition-opacity duration-200 px-14 pb-1 ${
                        isDynamicCtaVisible ? 'opacity-100' : 'opacity-0'
                      }`}
                    >
                      {dynamicCtaPhrases[dynamicCtaIndex]}
                    </div>
                  )}
                </div>

                {hasCollapsedDraft && (
                  <div className="pointer-events-none absolute inset-y-0 left-1/2 flex -translate-x-1/2 items-center justify-center px-3 text-[12px] font-semibold tracking-[0.06em] text-[#171717]/80 uppercase">
                    {collapsedDraftLabel}
                  </div>
                )}
                
                {/* Right Action */}
                <div className="shrink-0 self-center">
                  <button 
                    className={`flex h-9 w-9 items-center justify-center rounded-full border transition-all duration-300 sm:h-10 sm:w-10 ${
                      query.trim() || uploadedFiles.length > 0
                        ? 'border-black/80 bg-[#171717] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_2px_3px_rgba(0,0,0,0.12),0_7px_16px_rgba(0,0,0,0.12)] hover:-translate-y-0.5 hover:bg-black'
                        : 'border-black/[0.05] bg-black/[0.06] text-black/30 cursor-not-allowed'
                    }`}
                    onClick={(e) => { e.stopPropagation(); handleSendMessage(); }}
                  >
                    <ArrowUp size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
          )}
          {messageActionTarget && (
            <div className="absolute inset-0 z-[80] bg-black/20" onClick={() => setMessageActionTarget(null)}>
              <div className="absolute bottom-4 left-1/2 w-[88%] max-w-xs -translate-x-1/2 rounded-2xl bg-white p-2 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  className="w-full rounded-xl px-3 py-2 text-left text-[13px] font-semibold text-[#171717] hover:bg-black/[0.04]"
                  onClick={async () => {
                    await navigator.clipboard.writeText(messageActionTarget.content || '');
                    setMessageActionTarget(null);
                  }}
                >
                  Copy message
                </button>
                <button
                  type="button"
                  className="w-full rounded-xl px-3 py-2 text-left text-[13px] font-semibold text-[#171717] hover:bg-black/[0.04]"
                  onClick={() => {
                    setQuery(messageActionTarget.content || '');
                    setMessageActionTarget(null);
                  }}
                >
                  Edit and resend
                </button>
                <button
                  type="button"
                  className="w-full rounded-xl px-3 py-2 text-left text-[13px] font-semibold text-[#171717] hover:bg-black/[0.04]"
                  onClick={async () => {
                    const text = messageActionTarget.content || '';
                    if (text.trim()) await handleSendMessage(text);
                    setMessageActionTarget(null);
                  }}
                >
                  Regenerate
                </button>
              </div>
            </div>
          )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const ObjectUrlImage = ({ file, alt, className }: { file: File; alt: string; className?: string }) => {
  const src = useMemo(() => URL.createObjectURL(file), [file]);

  useEffect(() => {
    return () => URL.revokeObjectURL(src);
  }, [src]);

  return <img src={src} alt={alt} className={className} />;
};

const OrderFlowUI = ({ orderFlowStep, setOrderFlowStep, flowType, orderData, setOrderData, guestId, isExpanded, setIsExpanded, onCancel, onComplete, onOpenChat }: {
  orderFlowStep: 'requirements' | 'files' | 'specs' | 'review' | 'complete';
  setOrderFlowStep: React.Dispatch<React.SetStateAction<'requirements' | 'files' | 'specs' | 'review' | 'complete'>>;
  flowType: 'standard' | 'asset-first';
  orderData: OrderFlowData;
  setOrderData: React.Dispatch<React.SetStateAction<OrderFlowData>>;
  guestId: string;
  isExpanded: boolean;
  setIsExpanded: (v: boolean) => void;
  onCancel: () => void;
  onComplete: () => void;
  onOpenChat: () => void;
}) => {
  const { currentUser } = useContent();
  const { showAlert, showConfirm } = useModal();
  const [guestConfirmed, setGuestConfirmed] = useState(false);
  const { handleSubmit, isSubmitting } = useOrderSubmit({
    orderData,
    guestId,
    setOrderFlowStep,
    onComplete,
    onError: (msg) => showAlert({ title: 'Submission Failed', message: msg, variant: 'danger' }),
  });
  const [isDragging, setIsDragging] = useState(false);
  const [customInputs, setCustomInputs] = useState({
    colorProfile: '',
    resolutionDPI: '',
    outputFormat: '',
    background: '',
    layering: '',
  });
  const [sourceLinkDraft, setSourceLinkDraft] = useState('');
  const [sourceLinkError, setSourceLinkError] = useState<string | null>(null);
  const [showCustomBg, setShowCustomBg] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supportInputRef = useRef<HTMLInputElement>(null);
  const customBgInputRef = useRef<HTMLInputElement>(null);

  const handleCustomInput = (field: keyof typeof customInputs, value: string) => {
    setCustomInputs(prev => ({ ...prev, [field]: value }));
    setOrderData(prev => ({ ...prev, [field]: value }));
  };

  const toggleService = (serviceId: string) => {
    setOrderData(prev => ({
      ...prev,
      selectedServices: prev.selectedServices.includes(serviceId)
        ? prev.selectedServices.filter(id => id !== serviceId)
        : [...prev.selectedServices, serviceId]
    }));
  };

  const addFiles = (files: File[], isSupporting: boolean = false) => {
    if (files.length === 0) return;
    setOrderData(prev => ({
      ...prev,
      files: isSupporting ? prev.files : [...files, ...prev.files],
      supportFiles: isSupporting ? [...(prev.supportFiles || []), ...files] : (prev.supportFiles || [])
    }));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, isSupporting: boolean = false) => {
    addFiles(Array.from(e.target.files || []), isSupporting);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    addFiles(files, false);
  };

  const removeFile = (file: File) => {
    setOrderData(prev => ({
      ...prev,
      files: prev.files.filter(f => f !== file),
      supportFiles: (prev.supportFiles || []).filter(f => f !== file)
    }));
  };

  const addSourceLinks = () => {
    const rawLinks = sourceLinkDraft.split(/[\n,]+/).map(link => link.trim()).filter(Boolean);
    if (rawLinks.length === 0) return;

    const validLinks: string[] = [];
    const invalidLinks: string[] = [];
    rawLinks.forEach(link => {
      try {
        const parsed = new URL(link);
        if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('Unsupported protocol');
        validLinks.push(parsed.toString());
      } catch {
        invalidLinks.push(link);
      }
    });

    if (invalidLinks.length > 0) {
      setSourceLinkError('Please enter full links starting with https:// or http://');
      return;
    }

    setOrderData(prev => ({
      ...prev,
      sourceLinks: Array.from(new Set([...(prev.sourceLinks || []), ...validLinks]))
    }));
    setSourceLinkDraft('');
    setSourceLinkError(null);
  };

  const removeSourceLink = (link: string) => {
    setOrderData(prev => ({
      ...prev,
      sourceLinks: (prev.sourceLinks || []).filter(existing => existing !== link)
    }));
  };

  const hasSourceInput = orderData.files.length > 0 || (orderData.sourceLinks || []).length > 0 || (orderData.supportFiles || []).length > 0;

  const serviceList = SERVICES.filter(s => !['marketplace-ready', 'ghost-mannequin-complete', 'jewelry-essentials'].includes(s.id));
  const serviceNames = orderData.selectedServices.map(id => SERVICES.find(s => s.id === id)?.name).filter(Boolean);
  const estimatedPrice = orderData.selectedServices.reduce((sum, id) => {
    const svc = SERVICES.find(s => s.id === id);
    return sum + (svc?.price || 0);
  }, 0) * Math.max(1, calculateOrderVolume(orderData));
  const tatMultiplier = orderData.turnaround === '12' ? 1.5 : orderData.turnaround === '24' ? 1.25 : orderData.turnaround === '72' ? 0.9 : 1;
  const totalEstimate = estimatedPrice * tatMultiplier;

  // Separate work files and support files (store indices)
  const workFileCount = orderData.customFilesLink
    ? (orderData.customFilesCount || 1)
    : orderData.files.length;
  const supportFileCount = orderData.customFilesLink ? 0 : (orderData.supportFiles || []).length;
  const sourceLinkCount = (orderData.sourceLinks || []).length;

  if (!isExpanded) {
    return (
      <div className="relative flex h-full items-center justify-center px-3 py-2">
        <button
          type="button"
          onClick={() => { setOrderFlowStep('requirements'); onCancel(); }}
          className="absolute left-3 top-1/2 flex -translate-y-1/2 items-center gap-1.5 rounded-full border border-black/10 bg-white px-3 py-1.5 text-[11px] font-bold text-[#171717] shadow-sm hover:bg-[white] transition-colors"
          aria-label="Exit order flow"
        >
          <X size={12} />
          Exit order
        </button>
        <div className="flex items-center gap-2 rounded-full border border-[var(--research-blue)]/20 bg-[var(--research-blue-light)] px-4 py-2 shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#171717]">
            Order in progress
          </span>
        </div>
        <button
          type="button"
          onClick={onOpenChat}
          className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1.5 rounded-full border border-black/10 bg-white px-3 py-1.5 text-[11px] font-bold text-[#171717] shadow-sm hover:bg-[white] transition-colors"
          aria-label="Open chat"
        >
          <MessageSquare size={12} />
          Chat
        </button>
      </div>
    );
  }

  if (orderFlowStep === 'complete') {
    // Guest email collection — order hasn't been submitted yet
    if (!currentUser && !guestConfirmed) {
      const handleGuestConfirm = async () => {
        if (!orderData.email.trim()) {
          showAlert({ title: 'Email required', message: 'Enter your email so we can send the pricing breakdown.', variant: 'warning' });
          return;
        }
        const success = await handleSubmit();
        if (success) setGuestConfirmed(true);
      };
      return (
        <div className="flex flex-col items-center justify-center py-8 px-2 text-center space-y-5">
          <div className="w-14 h-14 rounded-full bg-black/[0.05] flex items-center justify-center">
            <Check size={26} className="text-[#171717]" strokeWidth={2.5} />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-[18px] font-bold text-[#171717]">Ready to place your order</h3>
            <p className="text-[13px] text-[#666] max-w-[280px] mx-auto leading-snug">
              Enter your email and we'll send a quote breakdown within 30 minutes.
            </p>
          </div>
          <div className="w-full max-w-[320px] space-y-2.5">
            <input
              type="email"
              placeholder="your@email.com"
              value={orderData.email}
              autoFocus
              onChange={(e) => setOrderData(prev => ({ ...prev, email: e.target.value }))}
              onKeyDown={(e) => { if (e.key === 'Enter') handleGuestConfirm(); }}
              className="w-full h-12 px-4 bg-white border-2 border-black/[0.1] rounded-xl text-[14px] font-medium text-[#171717] focus:outline-none focus:border-[#171717] focus:ring-4 focus:ring-black/[0.06] transition-all placeholder-[#bbb]"
            />
            <button
              onClick={handleGuestConfirm}
              disabled={isSubmitting}
              className="w-full h-12 bg-[#171717] text-white text-[14px] font-bold rounded-xl hover:bg-black disabled:opacity-50 transition-all active:scale-[0.98]"
            >
              {isSubmitting ? 'Placing order...' : 'Place My Order'}
            </button>
            <p className="text-[10px] text-[#aaa]">No marketing emails. Quote delivery only.</p>
          </div>
        </div>
      );
    }

    // Confirmed (guest post-submit or authenticated post-submit)
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-[var(--research-blue-light)] flex items-center justify-center shadow-inner">
          <Check size={32} className="text-[var(--research-blue)]" strokeWidth={3} />
        </div>

        <div className="space-y-2">
          <h3 className="text-[20px] font-bold text-[#171717]">Order Successfully Placed</h3>
          <p className="text-[14px] text-[#666] font-medium max-w-sm mx-auto">
            Your project is in the production queue and being audited by our specialists.
          </p>
        </div>

        <div className="w-full max-w-md bg-[var(--research-blue-light)]/50 border border-[var(--research-blue)]/10 rounded-2xl p-6">
          <div className="flex items-start gap-4 text-left">
            <div className="p-2.5 bg-white rounded-xl shadow-sm text-[var(--research-blue)] shrink-0">
              <Users size={20} strokeWidth={2.5} />
            </div>
            <div className="space-y-1">
              <p className="text-[14px] font-bold text-[#171717]">Manual Agent Audit</p>
              <p className="text-[12px] text-[#171717]/80 font-medium leading-relaxed">
                Specialists will audit your specs. Pricing breakdown arrives in{' '}
                <span className="font-bold underline decoration-[var(--research-peach)] decoration-2">~30 minutes</span>.
              </p>
            </div>
          </div>
        </div>

        <div className="w-full max-w-md text-[12px] text-[#888] space-y-0.5 text-center">
          <p>Confirmation sent to: <span className="font-semibold text-[#555]">{currentUser?.email || orderData.email}</span></p>
          <p>Questions? <a href="mailto:hello@reframevisuals.com" className="underline text-[#555]">hello@reframevisuals.com</a></p>
        </div>

        <button
          onClick={onComplete}
          className="h-11 px-8 bg-[#171717] text-white text-[14px] font-bold rounded-xl hover:bg-black transition-all shadow-lg shadow-black/10 active:scale-95"
        >
          {currentUser ? 'Return to Dashboard' : 'Done'}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div
        className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 ${isExpanded ? 'mb-3 sm:mb-4' : 'mb-0 h-full cursor-pointer hover:bg-gray-50/50 rounded-xl transition-colors'} px-1 shrink-0`}
        onClick={() => { if (!isExpanded) setIsExpanded(true); }}
      >
        <div className="w-full sm:w-auto flex items-center gap-1 sm:gap-2 overflow-x-auto scrollbar-hide pb-1 sm:pb-0">
          {(flowType === 'standard' ? [
            { id: 'requirements', label: 'Requirements' },
            { id: 'files', label: 'Assets' },
            { id: 'specs', label: 'Specifications' },
            { id: 'review', label: 'Review' }
          ] : [
            { id: 'files', label: 'Assets' },
            { id: 'requirements', label: 'Requirements' },
            { id: 'specs', label: 'Specifications' },
            { id: 'review', label: 'Review' }
          ]).map((step, idx) => (
            <React.Fragment key={step.id}>
              <button 
                onClick={() => {
                  setOrderFlowStep(step.id as any);
                  if (!isExpanded) setIsExpanded(true);
                }}
                className={`relative min-h-9 px-3 sm:px-4 py-2 rounded-full font-bold text-[12px] sm:text-[13px] transition-all cursor-pointer whitespace-nowrap ${
                  orderFlowStep === step.id 
                    ? 'bg-[var(--research-blue-light)] text-[#171717] shadow-md' 
                    : 'text-[#666] hover:text-[#171717] hover:bg-gray-100'
                }`}
              >
                {step.label}
              </button>
              {idx < 3 && <ChevronRight size={14} className="text-[#bbb]" strokeWidth={2.5} />}
            </React.Fragment>
          ))}
        </div>

        <div className="flex items-center gap-1 self-end sm:self-auto sm:ml-4">
          {!isExpanded && (
            <button
              onClick={() => setIsExpanded(true)}
              className="p-2 text-[var(--research-blue)] hover:bg-[var(--research-blue)]/10 rounded-lg transition-all"
              title="Expand Flow"
            >
              <Maximize2 size={16} strokeWidth={2.5} />
            </button>
          )}

          <button
            onClick={async () => {
              const confirmed = await showConfirm({
                title: 'Start Fresh?',
                message: 'All selections and files will be cleared. Are you sure?',
                variant: 'warning'
              });
              if (confirmed) {
                setOrderData({
                  ...INITIAL_ORDER_DATA,
                  email: currentUser?.email || '',
                  idempotencyKey: createIdempotencyKey()
                });
                setOrderFlowStep('requirements');
                localStorage.removeItem('reframe_order_draft');
              }
            }}
            className="p-2 text-[#999] hover:text-red-600 transition-all group"
            title="Reset Order"
          >
            <RotateCcw size={16} strokeWidth={2.5} className="group-hover:-rotate-90 transition-transform" />
          </button>
          
          <button
            onClick={() => {
              const { files, customBgFile, ...metadata } = orderData;
              localStorage.setItem('reframe_order_draft', JSON.stringify(metadata));
              showAlert({
                title: 'Draft Saved',
                message: 'Draft saved locally!',
                variant: 'success'
              });
            }}
            className="p-2 text-[#999] hover:text-[#171717] transition-all group"
            title="Save Draft"
          >
            <Save size={16} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* Step 1: Requirements */}
      {orderFlowStep === 'requirements' && (
        <div className="flex flex-col flex-1 py-2 sm:py-3 min-h-0">
          <div className="flex-1 overflow-y-auto min-h-0 space-y-2 sm:space-y-3 px-1">
            <div className="space-y-2 mb-4">
              <p className="text-[12px] font-bold text-[#171717]">Project Title</p>
              <input
                type="text"
                placeholder="e.g., Summer Collection Shoot"
                value={orderData.projectName}
                onChange={(e) => setOrderData(prev => ({ ...prev, projectName: e.target.value }))}
                className="w-full h-10 px-3 bg-white border border-[#e5e7eb] rounded-lg text-[13px] font-medium text-[#171717] focus:outline-none focus:border-[var(--research-blue)] focus:ring-2 focus:ring-[var(--research-blue)]/10 transition-all placeholder-[#999]"
              />
            </div>
            <p className="text-[12px] font-normal text-[#171717] mb-2">Pick services</p>
            
            <div className="flex flex-wrap gap-2 mb-3">
              {serviceList.map(service => {
                const IconComponent = service.icon;
                const isSelected = orderData.selectedServices.includes(service.id);
                return (
                  <button
                    key={service.id}
                    onClick={() => toggleService(service.id)}
                    className={`h-8 px-3 rounded-full text-[12px] font-bold transition-all flex items-center justify-center gap-1.5 border shadow-sm ${
                      isSelected
                        ? 'bg-[#171717] text-white border-transparent shadow-md'
                        : 'bg-[var(--color-bg-secondary)] border-[var(--color-border-light)] text-[#171717] hover:bg-white'
                    }`}
                  >
                    <IconComponent
                      size={14}
                      className={isSelected ? 'text-white' : 'text-[#171717]/60'} 
                      strokeWidth={2.5}
                    />
                    <span>{service.name}</span>
                  </button>
                );
              })}
            </div>
            <p className="text-[13px] font-semibold text-[#171717] mt-3 mb-2">Project Instructions</p>
            <textarea
              value={orderData.instructions}
              onChange={(e) => {
                setOrderData(prev => ({ ...prev, instructions: e.target.value }));
                // Auto-grow logic
                e.target.style.height = 'auto';
                e.target.style.height = e.target.scrollHeight + 'px';
              }}
              placeholder="Detail your requirements here..."
              className="w-full h-32 px-4 py-3 text-[12px] font-medium border-2 border-[#171717]/5 rounded-2xl resize-none focus:outline-none focus:border-[var(--research-blue)] focus:ring-4 focus:ring-[var(--research-blue)]/10 bg-white placeholder-[#999] transition-all shadow-sm"
              style={{ minHeight: '128px', maxHeight: '250px' }}
            />
          </div>
          <div className="flex items-center justify-between mt-auto pt-3 border-t border-[#f5f5f5]">
            <button
              onClick={flowType === 'standard' ? onCancel : () => setOrderFlowStep('files')}
              className="h-9 px-5 flex items-center justify-center rounded-lg border border-[#e5e5e5] text-[13px] text-[#666] font-medium hover:bg-[white] transition-colors"
            >
              {flowType === 'standard' ? 'Close' : '← Back'}
            </button>
            <button
              onClick={() => setOrderFlowStep(flowType === 'standard' ? 'files' : 'specs')}
              disabled={orderData.selectedServices.length === 0}
              className="h-9 px-6 flex items-center justify-center bg-[#171717] text-white text-[13px] font-semibold rounded-lg disabled:opacity-50 shadow-sm"
            >
              {flowType === 'standard' ? 'Next: Upload Files' : 'Next: Technical Specs'}
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Files */}
      {orderFlowStep === 'files' && (
        <div className="flex flex-col flex-1 space-y-2 sm:space-y-3 py-2 sm:py-3 min-h-0">
          <div className="flex-1 overflow-y-auto min-h-0 space-y-2 sm:space-y-3 px-1">
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="text-[12px] font-semibold text-[#171717]">Original / Main Files</p>
              <span className="rounded-full bg-[var(--color-bg-secondary)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-secondary)]">Counted for editing</span>
            </div>

            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed transition-all duration-300 overflow-hidden flex flex-col items-center justify-center ${
                isDragging 
                  ? 'border-[var(--research-blue)] bg-[var(--research-blue)]/5 ring-8 ring-[var(--research-blue)]/5 scale-[0.99]' 

                  : 'border-[var(--research-blue)]/20 bg-[var(--research-blue-light)]'
              } rounded-3xl h-[180px] sm:h-[240px] ${
                workFileCount === 0 || isDragging ? 'cursor-pointer group' : 'p-2'
              }`}
            >
              <AnimatePresence mode="wait">
                {isDragging ? (
                  <motion.div
                    key="dragging"
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 1.1, y: -10 }}
                    className="flex flex-col items-center justify-center space-y-4"
                  >
                    <div className="w-20 h-20 bg-[var(--research-blue)] text-white rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(var(--research-blue-rgb),0.3)] animate-pulse">
                      <CloudUploadIcon size={40} />
                    </div>
                    <div className="text-center">
                      <p className="text-[16px] text-[var(--research-blue)] font-normal">Release to Upload</p>
                      <p className="text-[12px] text-[var(--research-blue)]/60 font-normal mt-1">Ready for processing</p>
                    </div>
                  </motion.div>
                ) : workFileCount === 0 ? (
                  <motion.div
                    key="idle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-full flex flex-col items-center justify-center"
                  >
                    {/* Decorative background icons */}
                    <div className="absolute top-6 left-6 opacity-5 -rotate-12 group-hover:rotate-0 transition-transform duration-1000">
                      <CpuIcon size={60} />
                    </div>
                    <div className="absolute bottom-6 right-6 opacity-5 rotate-12 group-hover:rotate-0 transition-transform duration-1000">
                      <DatabaseIcon size={60} />
                    </div>

                    <div className="relative z-10">
                      <div className="flex justify-center items-center gap-6 mb-4">
                        <Image01Icon size={28} className="text-[var(--research-blue)] opacity-40" />
                        <CloudUploadIcon size={52} className="text-[var(--research-blue)]" />
                        <FolderOpenIcon size={28} className="text-[var(--research-blue)] opacity-40" />
                      </div>
                      <p className="text-[14px] text-[#171717] font-semibold">
                        Drop original files to upload
                      </p>
                      <p className="text-[12px] text-[#171717]/60 font-medium mt-1">Main images, PSD, TIFF, RAW</p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="gallery"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full h-full flex flex-col"
                  >
                    <div className="flex items-center gap-2 mb-3 px-1 shrink-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-[var(--research-blue)] animate-pulse" />
                      <p className="text-[12px] text-[#171717] font-normal">
                        {workFileCount} Main File{workFileCount === 1 ? '' : 's'} Ready for Processing
                      </p>
                    </div>
                    <div className="flex-1 overflow-y-auto pr-1">
                      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                        {orderData.files.map((file, i) => (
                          <div key={i} className="aspect-square relative bg-white rounded-lg overflow-hidden border border-black/5 group/item">
                            <ObjectUrlImage file={file} alt="Uploaded asset preview" className="w-full h-full object-cover" />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeFile(file);
                              }}
                              className="absolute inset-0 bg-red-500/80 text-white flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover/item:opacity-100 transition-opacity" aria-label="Remove image"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))}
                        <div className="aspect-square rounded-lg border-2 border-dashed border-[var(--research-blue)]/40 bg-white/40 flex items-center justify-center cursor-pointer hover:bg-white/60 hover:border-[var(--research-blue)] transition-all group" onClick={() => fileInputRef.current?.click()}>
                  <Plus size={24} className="text-[var(--research-blue)] group-hover:scale-110 transition-transform" />
                </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => handleFileSelect(e, false)}
              className="hidden"
            />
            <input
              ref={supportInputRef}
              type="file"
              accept="*"
              multiple
              onChange={(e) => handleFileSelect(e, true)}
              className="hidden"
            />

            <div className="rounded-2xl border border-[#e5e5e5] bg-white/70 p-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 w-7 h-7 rounded-full bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] flex items-center justify-center shrink-0">
                  <Link2 size={15} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] text-[#171717] font-semibold">Prefer a file link?</p>
                  <p className="text-[11px] text-[#171717]/60 mt-0.5 leading-relaxed">Paste Dropbox, Drive, WeTransfer, or any direct file link instead of uploading here.</p>
                  <div className="mt-3 flex flex-col sm:flex-row gap-2">
                    <textarea
                      value={sourceLinkDraft}
                      onChange={e => { setSourceLinkDraft(e.target.value); setSourceLinkError(null); }}
                      onBlur={() => { if (sourceLinkDraft.trim()) addSourceLinks(); }}
                      placeholder="https://..."
                      rows={2}
                      className="min-h-[42px] flex-1 resize-none rounded-xl border border-[#e5e5e5] bg-white px-3 py-2 text-[12px] text-[#171717] placeholder:text-[#999] focus:outline-none focus:border-[var(--research-blue)] focus:ring-2 focus:ring-[var(--research-blue)]/10"
                    />
                    <button type="button" onClick={addSourceLinks} className="h-[42px] px-4 rounded-xl border border-[#e5e5e5] bg-white text-[12px] font-semibold text-[#171717] hover:bg-[white] transition-colors shrink-0">
                      Add Link
                    </button>
                  </div>
                  {sourceLinkError && <p className="mt-2 text-[11px] text-red-500">{sourceLinkError}</p>}
                  {(orderData.sourceLinks || []).length > 0 && (
                    <div className="mt-3 space-y-1.5">
                      {(orderData.sourceLinks || []).map(link => (
                        <div key={link} className="flex items-center justify-between gap-2 rounded-lg border border-[#e5e5e5] bg-[white] px-3 py-2">
                          <span className="truncate text-[11px] text-[#666]">{link}</span>
                          <button type="button" onClick={() => removeSourceLink(link)} className="text-[#999] hover:text-red-500 transition-colors" aria-label="Remove link">
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <section className="rounded-2xl border border-[var(--research-peach)]/35 bg-[var(--research-peach-light)]/35 p-3 sm:p-4">
              <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[13px] font-semibold text-[#171717]">Supporting files / references</p>
                  <p className="text-[11px] text-[#666] leading-relaxed">Briefs, examples, reference images, PDFs, or notes. These stay separate from main files.</p>
                </div>
                <span className="w-fit rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--research-peach)]">Not counted as main</span>
              </div>
              <div
                onClick={() => supportInputRef.current?.click()}
                className="p-3 rounded-xl border border-dashed border-[var(--research-peach)]/50 bg-white/70 flex items-center justify-center gap-3 cursor-pointer hover:bg-white transition-all group"
              >
                <Plus size={18} className="text-[var(--research-peach)]" />
                <span className="text-[13px] text-[#171717] font-medium group-hover:text-[#171717]">Add supporting files only</span>
              </div>

              {supportFileCount > 0 && (
                <div className="mt-3 space-y-1.5">
                  {(orderData.supportFiles || []).map((file, i) => (
                    <div key={i} className="flex items-center justify-between p-2 px-3 bg-white border border-[var(--research-peach)]/25 rounded-lg group/file">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <FolderOpenIcon size={14} className="text-[var(--research-peach)] shrink-0" />
                      <span className="text-[10px] text-[#171717] font-medium truncate uppercase">{file.name}</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(file);
                      }}
                      className="min-w-8 min-h-8 p-1 hover:bg-red-50 text-red-400 opacity-100 sm:opacity-0 sm:group-hover/file:opacity-100 transition-opacity flex items-center justify-center rounded-md" aria-label="Remove support file"
                    >
                      <Trash2 size={14} />
                    </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          <div className="flex items-center justify-between mt-auto pt-3 border-t border-[#f5f5f5]">
            <button
              onClick={flowType === 'standard' ? () => setOrderFlowStep('requirements') : onCancel}
              className="h-9 px-5 flex items-center justify-center rounded-lg border border-[#e5e5e5] text-[13px] text-[#666] font-medium hover:bg-[white] transition-colors"
            >
              {flowType === 'standard' ? '← Back' : 'Close'}
            </button>
            <button
              onClick={() => setOrderFlowStep(flowType === 'standard' ? 'specs' : 'requirements')}
              disabled={!hasSourceInput && !orderData.customFilesLink}
              className="h-9 px-6 flex items-center justify-center bg-[#171717] text-white text-[13px] font-semibold rounded-lg disabled:opacity-50"
            >
              {flowType === 'standard' ? 'Technical Specs' : 'Next: Requirements'}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Specs */}
      {orderFlowStep === 'specs' && (
        <div className="flex flex-col flex-1 py-2 sm:py-3 space-y-3 min-h-0">
          <div className="flex-1 overflow-y-auto min-h-0 space-y-3 px-1">
            <p className="text-[12px] font-normal text-[#171717] mb-1">Technical Specs</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <span className="text-[12px] text-[#666] font-medium uppercase tracking-tight opacity-70">Delivery Format</span>
                <div className="flex gap-1.5 flex-wrap">
                  {[
                    { value: 'jpg', label: 'JPG' },
                    { value: 'png', label: 'PNG' },
                    { value: 'webp', label: 'WEBP' },
                    { value: 'tiff', label: 'TIFF' }
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setOrderData(prev => ({ ...prev, outputFormat: opt.value }))}
                      className={`py-1.5 px-2.5 rounded-md text-[11px] font-normal transition-all border ${
                        orderData.outputFormat === opt.value
                          ? 'bg-[var(--research-blue)] text-[#171717] border-[var(--research-blue)] ring-2 ring-[var(--research-blue)]/20'
                          : 'border-[#ccc] bg-white text-[#666] hover:border-[#999] hover:bg-[#f5f5f5]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={customInputs.outputFormat || ''}
                      onChange={(e) => handleCustomInput('outputFormat', e.target.value)}
                      placeholder="Other"
                      className={`w-16 px-2 py-1.5 rounded-md text-[11px] transition-all border focus:outline-none ${
                        customInputs.outputFormat
                          ? 'border-[var(--research-blue)] bg-white ring-2 ring-[var(--research-blue)]/20'
                          : 'border-[#e5e5e5] bg-white focus:border-[var(--research-blue)]'
                      }`}
                    />
                    {customInputs.outputFormat && (
                      <button
                        onClick={() => setOrderData(prev => ({ ...prev, outputFormat: customInputs.outputFormat }))}
                        className="p-1.5 bg-black text-white rounded-md hover:bg-[#333]"
                      >
                        <Check size={14} strokeWidth={3} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-[12px] text-[#666] font-normal">Color Profile</span>
                <div className="flex gap-1.5 flex-wrap">
                  {[
                    { value: 'sRGB', label: 'sRGB' },
                    { value: 'AdobeRGB', label: 'Adobe' },
                    { value: 'CMYK', label: 'CMYK' }
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setOrderData(prev => ({ ...prev, colorProfile: opt.value }))}
                      className={`py-1.5 px-2.5 rounded-md text-[11px] font-normal transition-all border ${
                        orderData.colorProfile === opt.value
                          ? 'bg-[var(--research-blue)] text-[#171717] border-[var(--research-blue)] ring-2 ring-[var(--research-blue)]/20'
                          : 'border-[#ccc] bg-white text-[#666] hover:border-[#999] hover:bg-[#f5f5f5]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={customInputs.colorProfile || ''}
                      onChange={(e) => handleCustomInput('colorProfile', e.target.value)}
                      placeholder="Other"
                      className={`w-16 px-2 py-1.5 rounded-md text-[11px] transition-all border focus:outline-none ${
                        customInputs.colorProfile
                          ? 'border-[var(--research-blue)] bg-white ring-2 ring-[var(--research-blue)]/20'
                          : 'border-[#e5e5e5] bg-white focus:border-[var(--research-blue)]'
                      }`}
                    />
                    {customInputs.colorProfile && (
                      <button
                        onClick={() => setOrderData(prev => ({ ...prev, colorProfile: customInputs.colorProfile }))}
                        className="p-1.5 bg-black text-white rounded-md hover:bg-[#333]"
                      >
                        <Check size={14} strokeWidth={3} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-4">
              <div className="space-y-1">
                <span className="text-[12px] text-[#666] font-normal">Resolution (DPI)</span>
                <div className="flex gap-1.5 flex-wrap">
                  {[
                    { value: '72', label: '72' },
                    { value: '150', label: '150' },
                    { value: '300', label: '300' },
                    { value: '600', label: '600' }
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setOrderData(prev => ({ ...prev, resolutionDPI: opt.value }))}
                      className={`py-1.5 px-2.5 rounded-md text-[11px] font-normal transition-all border ${
                        orderData.resolutionDPI === opt.value
                          ? 'bg-[var(--research-blue)] text-[#171717] border-[var(--research-blue)] ring-2 ring-[var(--research-blue)]/20'
                          : 'border-[#ccc] bg-white text-[#666] hover:border-[#999] hover:bg-[#f5f5f5]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={customInputs.resolutionDPI || ''}
                      onChange={(e) => handleCustomInput('resolutionDPI', e.target.value)}
                      placeholder="Other"
                      className={`w-16 px-2 py-1.5 rounded-md text-[11px] transition-all border focus:outline-none ${
                        customInputs.resolutionDPI
                          ? 'border-[var(--research-blue)] bg-white ring-2 ring-[var(--research-blue)]/20'
                          : 'border-[#e5e5e5] bg-white focus:border-[var(--research-blue)]'
                      }`}
                    />
                    {customInputs.resolutionDPI && (
                      <button
                        onClick={() => setOrderData(prev => ({ ...prev, resolutionDPI: customInputs.resolutionDPI }))}
                        className="p-1.5 bg-black text-white rounded-md hover:bg-[#333]"
                      >
                        <Check size={14} strokeWidth={3} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-[12px] text-[#666] font-normal">Background</span>
                {showCustomBg ? (
                  <div className="space-y-2 p-3 rounded-lg border border-[#e5e5e5] bg-white">
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <span className="text-[10px] text-[#999] font-normal block mb-1">Color</span>
                        <input
                          type="color"
                          value={orderData.customBgColor || '#ffffff'}
                          onChange={(e) => setOrderData(prev => ({ ...prev, customBgColor: e.target.value }))}
                          className="w-full h-8 rounded cursor-pointer"
                        />
                      </div>
                      <div className="flex-1">
                        <span className="text-[10px] text-[#999] font-normal block mb-1">Hex</span>
                        <input
                          type="text"
                          value={orderData.customBgColor || '#ffffff'}
                          onChange={(e) => setOrderData(prev => ({ ...prev, customBgColor: e.target.value }))}
                          placeholder="#fff"
                          className="w-full px-2 py-2 text-[12px] border border-[#e5e5e5] rounded bg-white"
                        />
                      </div>
                    </div>
                    <label className="flex items-center gap-2 px-2 py-1.5 rounded border border-dashed border-[#e5e5e5] cursor-pointer hover:bg-[white]">
                      <input
                        ref={customBgInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setOrderData(prev => ({ ...prev, customBgFile: file, customBgImage: file }));
                          }
                        }}
                        className="hidden"
                      />
                      <span className="text-[11px] text-[#666]">
                        {orderData.customBgFile ? orderData.customBgFile.name : 'Upload image'}
                      </span>
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowCustomBg(false)}
                        className="flex-1 py-1.5 bg-[#171717] text-white text-[11px] rounded font-normal"
                      >
                        Done
                      </button>
                      <button
                        onClick={() => {
                          setShowCustomBg(false);
                          setOrderData(prev => ({ ...prev, background: 'white', customBgColor: undefined }));
                        }}
                        className="flex-1 py-1.5 border border-[#e5e5e5] text-[#666] text-[11px] rounded font-normal"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-1.5">
                    {[
                      { value: 'white', label: 'White' },
                      { value: 'transparent', label: 'Trans' },
                      { value: 'original', label: 'Orig' },
                      { value: 'custom', label: 'Custom' }
                    ].map(bg => (
                      <button
                        key={bg.value}
                        onClick={() => {
                          if (bg.value === 'Custom') {
                            setShowCustomBg(true);
                          }
                          setOrderData(prev => ({ ...prev, background: bg.value as any }));
                        }}
                        className={`flex-1 py-1.5 px-2 rounded-md text-[11px] font-normal transition-all border ${
                          orderData.background === bg.value
                            ? 'bg-[var(--research-blue)] text-[#171717] border-[var(--research-blue)] ring-2 ring-[var(--research-blue)]/20'
                            : 'border-[#ccc] bg-white text-[#666] hover:border-[#999] hover:bg-[#f5f5f5]'
                        }`}
                      >
                        {bg.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Resize Options */}
            <div className="flex items-center gap-4">
              <span className="text-[12px] text-[#666] font-medium whitespace-nowrap">Resize</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={orderData.resizeWidth}
                  onChange={(e) => setOrderData(prev => ({ ...prev, resizeWidth: e.target.value }))}
                  placeholder="W"
                  className="w-16 px-3 py-1.5 text-[12px] border border-[#e5e5e5] rounded-lg bg-white focus:outline-none focus:border-[var(--research-blue)]"
                />
                <span className="text-[#999]">×</span>
                <input
                  type="number"
                  value={orderData.resizeHeight}
                  onChange={(e) => setOrderData(prev => ({ ...prev, resizeHeight: e.target.value }))}
                  placeholder="H"
                  className="w-16 px-3 py-1.5 text-[12px] border border-[#e5e5e5] rounded-lg bg-white focus:outline-none focus:border-[var(--research-blue)]"
                />
                <span className="text-[11px] text-[#999]">px</span>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={orderData.maintainAspectRatio || false}
                  onChange={(e) => setOrderData(prev => ({ ...prev, maintainAspectRatio: e.target.checked }))}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <span className="text-[12px] text-[#666]">Lock ratio</span>
              </label>
            </div>

            {/* Turnaround with subtle color dots */}
            <div className="flex items-center gap-3">
              <span className="text-[12px] text-[#666] font-medium whitespace-nowrap">Turnaround Time</span>
              <div className="flex gap-2">
                {[
                  { value: '12', label: '12h', color: 'var(--research-peach)' },
                  { value: '24', label: '24h', color: '#999' },
                  { value: '48', label: '48h', color: '#999' },
                  { value: '72', label: '72h', color: '#999' }
                ].map(tat => (
                  <button
                    key={tat.value}
                    onClick={() => setOrderData(prev => ({ ...prev, turnaround: tat.value }))}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all border ${
                      orderData.turnaround === tat.value
                        ? 'bg-[var(--research-blue)] text-[#171717] border-[var(--research-blue)] ring-2 ring-[var(--research-blue)]/20'
                        : 'border-[#ccc] bg-white text-[#666] hover:border-[#999] hover:bg-[#f5f5f5]'
                    }`}
                  >
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: tat.color }} />
                    {tat.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mt-auto pt-3 border-t border-[#f5f5f5]">
            <button
              onClick={() => setOrderFlowStep(flowType === 'standard' ? 'files' : 'requirements')}
              className="h-9 px-5 flex items-center justify-center rounded-lg border border-[#e5e5e5] text-[13px] text-[#666] font-medium hover:bg-[white] transition-colors"
            >
              ← Back
            </button>
            <button
              onClick={() => setOrderFlowStep('review')}
              className="h-9 px-6 flex items-center justify-center bg-[#171717] text-white text-[13px] font-semibold rounded-lg disabled:opacity-50 shadow-sm"
            >
              Review Order
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Review */}
      {orderFlowStep === 'review' && (
        <div className="flex flex-col flex-1 space-y-2 sm:space-y-3 py-2 min-h-0">
          <div className="flex-1 overflow-y-auto min-h-0 space-y-2 sm:space-y-3 px-1">
            <div className="p-4 bg-white border-2 border-[#171717]/5 rounded-2xl shadow-sm">
              <p className="text-[12px] font-bold text-[#171717] mb-3 uppercase tracking-[0.05em]">Order Summary</p>
              
              <div className="space-y-2 text-[12px]">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-[#171717] font-bold">Services:</span>
                  <span className="text-[#171717] font-semibold text-right max-w-[65%] leading-tight">{serviceNames.join(', ')}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-[#171717] font-bold">Volume:</span>
                  <span className="text-[#171717] font-semibold">
                    {workFileCount} {orderData.customFilesLink ? 'images (via link)' : 'uploads'}
                    {sourceLinkCount > 0 ? ` + ${sourceLinkCount} links` : ''}
                    {supportFileCount > 0 ? ` + ${supportFileCount} references` : ''}
                  </span>
                </div>
                {orderData.customFilesLink && (
                  <div className="flex justify-between py-2 border-b border-gray-100 flex-col">
                    <span className="text-[#171717] font-bold">Files Link:</span>
                    <span className="text-[var(--color-text-secondary)] font-semibold break-all text-left">
                      <a href={orderData.customFilesLink} target="_blank" rel="noopener noreferrer" className="hover:underline">
                        {orderData.customFilesLink}
                      </a>
                    </span>
                  </div>
                )}
                <div className="flex justify-between py-2">
                  <span className="text-[#171717] font-bold">Specs:</span>
                  <span className="text-[#171717] font-semibold">{orderData.outputFormat.toUpperCase()} • {orderData.resolutionDPI} DPI • {orderData.turnaround}h</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mt-auto pt-3 border-t border-[#f5f5f5]">
            <button
              onClick={() => setOrderFlowStep('specs')}
              className="h-9 px-5 flex items-center justify-center rounded-lg border border-[#e5e5e5] text-[13px] text-[#666] font-medium hover:bg-[white] transition-colors"
            >
              ← Back
            </button>
            <button
              onClick={() => {
                if (currentUser) {
                  handleSubmit();
                } else {
                  setOrderFlowStep('complete');
                }
              }}
              disabled={isSubmitting}
              className="h-9 px-6 flex items-center justify-center bg-[#171717] text-white text-[13px] font-bold rounded-lg disabled:opacity-50 shadow-lg shadow-black/10"
            >
              {isSubmitting ? 'Confirming...' : currentUser ? '✓ Confirm Order' : 'Next: Add Email →'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReframeCS;

