import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef, useMemo } from 'react';
import { Job, ViewType, DashboardStats, Conversation, Message, OrderTemplate, BillingProfile } from '../types/dashboard';
import { portalApi } from '../services/portalApi';
import { useSharedChatController } from '../hooks/useSharedChatController';
import { getApiEndpoint } from '../lib/apiConfig';
import { RealtimeSource } from '../lib/realtimeSource';


interface DashboardContextType {
  billingProfile: BillingProfile | null;
  setBillingProfile: (profile: BillingProfile | null) => void;
  jobs: Job[];
  selectedJob: Job | null;
  setSelectedJob: (job: Job | null) => void;
  currentView: ViewType;
  setCurrentView: (view: ViewType) => void;
  conversations: Conversation[];
  activeConversation: Conversation | null;
  setActiveConversation: (conv: Conversation | null) => void;
  selectConversation: (conversationId: string) => Promise<void>;
  isChatBootstrapping: boolean;
  isConversationDetailLoading: boolean;
  conversationDetailError: string | null;
  stats: DashboardStats;
  isLoading: boolean;
  isSending: boolean;
  supportTyping: boolean;
  error: string | null;
  clearError: () => void;
  fetchConversations: () => Promise<void>;
  fetchJobs: () => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  createConversation: (title: string) => Promise<void>;
  templates: OrderTemplate[];
  saveTemplate: (template: Partial<OrderTemplate>) => void;
  deleteTemplate: (id: string) => void;
  isTemplateMode: boolean;
  setIsTemplateMode: (mode: boolean) => void;
  brandGuidelines: any;
  setBrandGuidelines: (guidelines: any) => void;
  approveJob: (jobId: string) => Promise<void>;
  requestRevision: (jobId: string, notes: string) => Promise<void>;
  rejectProposal: (jobId: string, notes: string) => Promise<void>;
  cancelJob: (jobId: string) => Promise<void>;
  fetchJobDetail: (jobId: string) => Promise<void>;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

function mapBackendStatus(status: string): any {
  switch (status) {
    case 'new':
    case 'new_review': return 'Submitted';
    case 'awaiting_approval': return 'Pending Approval';
    case 'in_progress': return 'In Progress';
    case 'revision_needed': return 'In Revision';
    case 'ready_qc': return 'In Review';
    case 'completed': return 'Complete';
    default: return 'Submitted';
  }
}

function computeProgress(status: string, images: any[]): number {
  if (status === 'completed') return 100;
  if (status === 'ready_qc') return 95;
  if (status === 'in_progress' && images.length > 0) {
    const done = images.filter((img: any) => ['completed', 'approved', 'delivered'].includes(String(img.status).toLowerCase())).length;
    return Math.round((done / images.length) * 80); // cap at 80% until QC passes
  }
  if (status === 'in_progress') return 50;
  if (status === 'revision_needed') return 40;
  return 0;
}

const withGuestAsset = (url?: string | null): string | undefined => {
  if (!url) return undefined;
  if (!url.startsWith('/api/portal/')) return url;
  const token = typeof window !== 'undefined' ? localStorage.getItem('portal_token') : null;
  if (token && token !== 'null') return url;
  // An <img> cannot send auth headers; a guest identifies through the query string.
  const guestId = typeof window !== 'undefined' ? localStorage.getItem('portal_guest_id') : null;
  return guestId ? `${url}?guestId=${encodeURIComponent(guestId)}` : url;
};

export const DashboardProvider = ({ children }: { children: ReactNode }) => {
  const { fetchConversationList: sharedFetchConversationList, fetchConversationDetails: sharedFetchConversationDetails, sendConversationMessage: sharedSendConversationMessage } = useSharedChatController();
  const [billingProfile, setBillingProfile] = useState<BillingProfile | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [currentView, setCurrentView] = useState<ViewType>('jobs');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isChatBootstrapping, setIsChatBootstrapping] = useState(false);
  const [isConversationDetailLoading, setIsConversationDetailLoading] = useState(false);
  const [conversationDetailError, setConversationDetailError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [supportTyping, setSupportTyping] = useState(false);
  const [isTemplateMode, setIsTemplateMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const errorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const jobPollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const jobStatusSnapshotRef = useRef<Record<string, string>>({});
  const sseRef = useRef<RealtimeSource | null>(null);
  const jobsLoadedRef = useRef(false);
  const [templates, setTemplates] = useState<OrderTemplate[]>(() => {
    const saved = localStorage.getItem('reframe_order_templates');
    return saved ? JSON.parse(saved) : [
      {
        id: 't1',
        name: 'E-commerce Essentials',
        services: ['background-removal', 'shadow-creation'],
        specs: { format: 'WebP', background: 'white', sizing: '2000x2000px', resizeWidth: '2000', resizeHeight: '2000' },
        instructions: 'Centering the product with 10% padding.',
        createdAt: new Date().toLocaleDateString()
      }
    ];
  });

  const [brandGuidelines, setBrandGuidelines] = useState({
    tone: 'Professional & Minimalist',
    style: 'High Contrast, Natural Shadows',
    preferredFormat: 'WebP',
    instructions: 'Always preserve skin texture. Neutral color balance preferred.'
  });

  const normalizeMessage = (msg: any, fallbackIdPrefix = 'msg'): Message | null => {
    if (!msg || typeof msg !== 'object') return null;
    const createdAt =
      typeof msg.createdAt === 'string' && msg.createdAt
        ? msg.createdAt
        : new Date().toISOString();
    return {
      id: msg.id || `${fallbackIdPrefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: typeof msg.content === 'string' ? msg.content : '',
      createdAt,
      metadata: typeof msg.metadata === 'string' ? msg.metadata : undefined,
    };
  };

  const getMessageKey = useCallback((msg: Message) => {
    const createdAt = msg.createdAt || '';
    return msg.id || `${msg.role}:${createdAt}:${msg.content}`;
  }, []);

  const mergeMessages = useCallback((current: Message[] = [], incomingRaw: any[] = []) => {
    const byKey = new Map<string, Message>();
    current.filter(Boolean).forEach((msg) => {
      byKey.set(getMessageKey(msg), msg);
    });

    incomingRaw.forEach((raw) => {
      const normalized = normalizeMessage(raw, 'srv');
      if (!normalized) return;

      // Reconcile optimistic user messages (temp_*) with server-confirmed ones.
      // Without this, dashboard can render duplicates: one optimistic + one persisted.
      if (normalized.role === 'user' && normalized.id && !normalized.id.startsWith('temp_')) {
        const normalizedTs = new Date(normalized.createdAt || 0).getTime();
        for (const [existingKey, existingMsg] of byKey.entries()) {
          if (!existingMsg?.id?.startsWith('temp_')) continue;
          if (existingMsg.role !== 'user') continue;
          if ((existingMsg.content || '').trim() !== (normalized.content || '').trim()) continue;
          const existingTs = new Date(existingMsg.createdAt || 0).getTime();
          const closeInTime = Number.isFinite(existingTs) && Number.isFinite(normalizedTs) && Math.abs(existingTs - normalizedTs) <= 120000;
          if (closeInTime) {
            byKey.delete(existingKey);
            break;
          }
        }
      }

      const key = getMessageKey(normalized);
      const existing = byKey.get(key);
      byKey.set(key, existing ? { ...existing, ...normalized } : normalized);
    });

    return Array.from(byKey.values()).sort((a, b) => {
      const aTime = new Date(a.createdAt || 0).getTime();
      const bTime = new Date(b.createdAt || 0).getTime();
      if (aTime !== bTime) return aTime - bTime;
      return a.id.localeCompare(b.id);
    });
  }, [getMessageKey]);

  const hasMessageListChanged = useCallback((a: Message[] = [], b: Message[] = []) => {
    if (a.length !== b.length) return true;
    for (let i = 0; i < a.length; i += 1) {
      const left = a[i];
      const right = b[i];
      if (!left || !right) return true;
      if (left.id !== right.id) return true;
      if (left.role !== right.role) return true;
      if (left.content !== right.content) return true;
      if (left.createdAt !== right.createdAt) return true;
    }
    return false;
  }, []);

  // Save templates to localStorage
  useEffect(() => {
    localStorage.setItem('reframe_order_templates', JSON.stringify(templates));
  }, [templates]);

  const saveTemplate = (data: Partial<OrderTemplate>) => {
    if (data.id) {
      setTemplates(prev => prev.map(t => t.id === data.id ? { ...t, ...data } as OrderTemplate : t));
    } else {
      const newTemplate: OrderTemplate = {
        ...data,
        id: `temp_${Date.now()}`,
        createdAt: new Date().toLocaleDateString()
      } as OrderTemplate;
      setTemplates(prev => [newTemplate, ...prev]);
    }
  };

  const deleteTemplate = (id: string) => {
    setTemplates(prev => prev.filter(t => t.id !== id));
  };

  // Auto-clear errors after 6 seconds
  const setAutoError = useCallback((msg: string) => {
    setError(msg);
    if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
    errorTimeoutRef.current = setTimeout(() => setError(null), 6000);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
    if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
  }, []);

  const fetchConversations = useCallback(async () => {
    setIsLoading(true);
    if (conversations.length === 0 && !activeConversation) {
      setIsChatBootstrapping(true);
    }
    try {
      const mapped = await sharedFetchConversationList();
      if (mapped) {
        setConversations(mapped);
        if (!activeConversation && mapped.length > 0) {
          const latest = mapped[0];
          // List rows carry only the most recent message as a preview. Storing that
          // as the active conversation made the thread render as a single message —
          // the full transcript has to come from the details endpoint.
          setActiveConversation({ ...latest, messages: undefined });
          setConversationDetailError(null);
        }
      }
    } catch (err: any) {
      setAutoError(err.response?.data?.message || 'Failed to fetch conversations');
    } finally {
      setIsLoading(false);
      setIsChatBootstrapping(false);
    }
  }, [setAutoError, activeConversation, conversations.length]);

  const fetchConversationDetails = useCallback(async (id: string, retryCount = 1) => {
    setIsConversationDetailLoading(true);
    setConversationDetailError(null);
    try {
      const details = await sharedFetchConversationDetails(id);
      if (details) setActiveConversation(details);
    } catch (err: any) {
      if (retryCount > 0) {
        return fetchConversationDetails(id, retryCount - 1);
      }
      const message = err.response?.data?.message || 'Failed to fetch conversation details';
      setConversationDetailError(message);
      setAutoError(message);
    } finally {
      setIsConversationDetailLoading(false);
    }
  }, [setAutoError]);

  const selectConversation = useCallback(async (conversationId: string) => {
    const candidate = conversations.find(c => c.id === conversationId) || null;
    // Drop the preview's single-message array so the UI shows a loading state
    // instead of a one-line transcript while the details request is in flight.
    if (candidate) setActiveConversation({ ...candidate, messages: undefined });
    await fetchConversationDetails(conversationId);
  }, [conversations, fetchConversationDetails]);

  const fetchJobs = useCallback(async () => {
    if (!jobsLoadedRef.current) setIsLoading(true);
    try {
      const response = await portalApi.getOrders();
      if (response.data.success) {
        jobsLoadedRef.current = true;
        const nextJobs = response.data.data.map((order: any) => ({
          id: order.id,
          name: order.title || order.code || 'Untitled Project',
          status: mapBackendStatus(order.status),
          rawStatus: order.status,
          imageCount: order.volume || 0,
          date: new Date(order.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
          createdAtRaw: order.createdAt,
          // The client's own brief — previously dropped here, so the project page
          // could never show what the customer asked for.
          description: order.description || '',
          expectedCompletion: order.expectedCompletion || null,
          deliveryLink: order.deliveryLink || null,
          deliveryNote: order.deliveryNote || null,
          services: order.serviceType ? order.serviceType.split(', ') : [],
          progress: computeProgress(order.status, order.images || []),
          images: (order.images || []).map((img: any) => ({
            id: img.id,
            name: img.filename || img.name || '',
            // previewUrl is a same-origin proxy; the stored Dropbox share link in
            // `url` does not serve image bytes and renders as a broken thumbnail.
            url: withGuestAsset(img.previewUrl) || img.url,
            beforeUrl: img.rawUrl || withGuestAsset(img.previewUrl) || img.url,
            afterUrl: img.editedUrl || withGuestAsset(img.previewUrl) || img.url,
            type: img.type,
          })),
          code: order.code,
          customFilesLink: order.customFilesLink,
          customFilesCount: order.customFilesCount,
          quotation: order.quotation,
          completedAt: order.completedAt,
          totalPrice: order.quotation?.totalPrice
            ? `$${Number(order.quotation.totalPrice).toFixed(2)}`
            : undefined,
          isPriority: order.priority === 'high',
        }));

        setJobs(nextJobs);

        nextJobs.forEach((job: Job) => {
          const previousStatus = jobStatusSnapshotRef.current[job.id];
          if (previousStatus && previousStatus !== job.status && job.status === 'Complete' && 'Notification' in window && Notification.permission === 'granted') {
            new Notification('Reframe asset delivery ready', {
              body: `${job.name} is finalized and ready to download.`
            });
          }
          jobStatusSnapshotRef.current[job.id] = job.status;
        });
      }
    } catch (err: any) {
      setAutoError(err.response?.data?.message || 'Failed to fetch jobs');
    } finally {
      setIsLoading(false);
    }
  }, [setAutoError]);

  const fetchJobDetail = useCallback(async (jobId: string) => {
    try {
      const response = await portalApi.getOrderDetails(jobId);
      if (response.data.success && response.data.data) {
        const order = response.data.data;
        const images = (order.images || []).map((img: any) => ({
          id: img.id,
          name: img.filename || img.name || '',
          // previewUrl is a same-origin proxy; the stored Dropbox share link in
          // `url` does not serve image bytes and renders as a broken thumbnail.
          url: withGuestAsset(img.previewUrl) || img.url,
          beforeUrl: img.rawUrl || withGuestAsset(img.previewUrl) || img.url,
          afterUrl: img.editedUrl || withGuestAsset(img.previewUrl) || img.url,
          type: img.type,
        }));
        setJobs(prev => prev.map(j => j.id === jobId ? { ...j, images } : j));
        setSelectedJob(prev => prev?.id === jobId ? { ...prev, images } : prev);
      }
    } catch {
      // silently fail — the list-level data is already shown
    }
  }, []);

  const fetchCompletedOrders = useCallback(async () => {
    try {
      const response = await portalApi.getOrders({ status: 'completed', limit: 50 });
      if (response.data.success) {
        const completed = response.data.data.map((order: any) => ({
          id: order.id,
          name: order.title || order.code || 'Untitled Project',
          status: mapBackendStatus(order.status),
          rawStatus: order.status,
          imageCount: order.volume || 0,
          date: new Date(order.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
          createdAtRaw: order.createdAt,
          // The client's own brief — previously dropped here, so the project page
          // could never show what the customer asked for.
          description: order.description || '',
          expectedCompletion: order.expectedCompletion || null,
          deliveryLink: order.deliveryLink || null,
          deliveryNote: order.deliveryNote || null,
          services: order.serviceType ? order.serviceType.split(', ') : [],
          progress: computeProgress(order.status, order.images || []),
          images: (order.images || []).map((img: any) => ({
            id: img.id,
            name: img.filename || img.name || '',
            // previewUrl is a same-origin proxy; the stored Dropbox share link in
            // `url` does not serve image bytes and renders as a broken thumbnail.
            url: withGuestAsset(img.previewUrl) || img.url,
            beforeUrl: img.rawUrl || withGuestAsset(img.previewUrl) || img.url,
            afterUrl: img.editedUrl || withGuestAsset(img.previewUrl) || img.url,
            type: img.type,
          })),
          code: order.code,
          customFilesLink: order.customFilesLink,
          customFilesCount: order.customFilesCount,
          quotation: order.quotation,
          completedAt: order.completedAt,
          totalPrice: order.quotation?.totalPrice
            ? `$${Number(order.quotation.totalPrice).toFixed(2)}`
            : undefined,
          isPriority: order.priority === 'high',
        }));
        // Merge completed orders into jobs (deduplicated by id)
        setJobs(prev => {
          const existingIds = new Set(prev.map(j => j.id));
          const newOnes = completed.filter((j: Job) => !existingIds.has(j.id));
          return [...prev, ...newOnes];
        });
      }
    } catch {
      // silently fail
    }
  }, []);

  const fetchBillingProfile = useCallback(async () => {
    try {
      const response = await portalApi.getBillingProfile();
      if (response.data.success && response.data.data) {
        setBillingProfile(response.data.data);
      }
    } catch (err: any) {
      console.warn('Failed to fetch billing profile, using mock/default data:', err);
    }
  }, []);

  useEffect(() => {
    // Prevent portal data fetching when in admin area
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
      return;
    }

    if (currentView === 'chat') {
      fetchConversations();
    } else if (currentView === 'jobs') {
      fetchJobs();
    } else if (currentView === 'orders') {
      fetchJobs();
      fetchCompletedOrders();
    } else if (currentView === 'billing') {
      fetchBillingProfile();
    }
  }, [currentView, fetchConversations, fetchJobs, fetchCompletedOrders, fetchBillingProfile]);

  // SSE connection for real-time order status push from admin actions
  useEffect(() => {
    if (typeof window === 'undefined' || window.location.pathname.startsWith('/admin')) return;
    const token = localStorage.getItem('portal_token');
    if (!token) return;

    const apiBase = (import.meta as any).env?.VITE_API_URL || '';
    const es = new RealtimeSource(`${apiBase}/api/portal/orders/stream?token=${encodeURIComponent(token)}`);
    sseRef.current = es;

    es.addEventListener('status_change', () => {
      fetchJobs();
    });

    es.onerror = () => {
      es.close();
      sseRef.current = null;
    };

    return () => {
      es.close();
      sseRef.current = null;
    };
  // fetchJobs is stable (useCallback with no deps that change frequently)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Real-time status engine for active delivery views. Uses light polling so job
  // progress and ready-to-download transitions appear without manual refresh.
  useEffect(() => {
    if (jobPollingRef.current) clearInterval(jobPollingRef.current);

    const shouldPollJobs = currentView === 'jobs' || currentView === 'orders';
    const hasActiveJobs = jobs.some(job => job.status === 'Submitted' || job.status === 'In Progress' || job.status === 'In Review' || job.status === 'Pending Approval');
    // SSE handles real-time; polling is a fallback for when SSE is unavailable
    if (!shouldPollJobs || !hasActiveJobs || sseRef.current) return;

    jobPollingRef.current = setInterval(() => {
      if (document.hidden) return;
      fetchJobs();
    }, 15000);

    return () => {
      if (jobPollingRef.current) clearInterval(jobPollingRef.current);
    };
  }, [currentView, fetchJobs, jobs]);

  useEffect(() => {
    if (activeConversation?.id && !activeConversation.messages) {
      fetchConversationDetails(activeConversation.id);
    }
  }, [activeConversation?.id, fetchConversationDetails]);

  // SSE connection for real-time chat updates, with a polling fallback.
  // The previous version built the URL as `${VITE_API_URL}/api/portal/chat/stream`
  // — VITE_API_URL already ends in `/api`, so every connection 404'd, and because
  // it closed on error with no fallback, admin replies never reached the customer
  // until a manual reload.
  useEffect(() => {
    if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
    if (sseRef.current) { sseRef.current.close(); sseRef.current = null; }
    if (!activeConversation?.id) return;

    const convId = activeConversation.id;
    let disposed = false;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let attempt = 0;

    const mergeMessage = (message: any) => {
      if (!message || message.role === 'user') return; // customer's own messages already in state
      setActiveConversation(prev => {
        if (!prev || prev.id !== convId) return prev;
        if ((prev.messages || []).some((m: any) => m.id === message.id)) return prev;
        return { ...prev, messages: [...(prev.messages || []), message] };
      });
    };

    // Fallback: if the stream cannot stay up, keep refreshing the transcript so a
    // broken connection degrades to slow delivery rather than no delivery.
    const startPolling = () => {
      if (disposed || pollingRef.current) return;
      pollingRef.current = setInterval(() => {
        sharedFetchConversationDetails(convId)
          .then(details => {
            if (disposed || !details) return;
            setActiveConversation(prev => (prev && prev.id === convId ? details : prev));
          })
          .catch(() => {});
      }, 5000);
    };

    const stopPolling = () => {
      if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
    };

    const connect = () => {
      if (disposed) return;
      const token = localStorage.getItem('portal_token') || '';
      const guestId = localStorage.getItem('portal_guest_id') || '';
      const url = new URL(getApiEndpoint('/portal/chat/stream'), window.location.origin);
      url.searchParams.set('conversationId', convId);
      if (token && token !== 'null') url.searchParams.set('token', token);
      // EventSource cannot set headers, so guests identify via the query string.
      else if (guestId) url.searchParams.set('guestId', guestId);

      const es = new RealtimeSource(url.toString(), { withCredentials: true });
      sseRef.current = es;

      es.onopen = () => {
        attempt = 0;
        stopPolling();
      };

      es.addEventListener('new_message', (e) => {
        try {
          mergeMessage(JSON.parse((e as MessageEvent).data).message);
        } catch { /* ignore */ }
      });

      es.addEventListener('typing', (e) => {
        try {
          const { role, isTyping } = JSON.parse((e as MessageEvent).data);
          if (role === 'support') setSupportTyping(Boolean(isTyping));
        } catch { /* ignore */ }
      });

      es.onerror = () => {
        es.close();
        if (sseRef.current === es) sseRef.current = null;
        if (disposed) return;
        startPolling();
        attempt += 1;
        const delay = Math.min(30000, 1000 * 2 ** Math.min(attempt, 5));
        reconnectTimer = setTimeout(connect, delay);
      };
    };

    connect();

    return () => {
      disposed = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      stopPolling();
      if (sseRef.current) { sseRef.current.close(); sseRef.current = null; }
    };
  }, [activeConversation?.id, sharedFetchConversationDetails]);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isSending) return;
    
    // Use dedicated sending state — does NOT block fetch operations
    setIsSending(true);
    
    // Optimistic update with temp ID
    const tempId = `temp_${Date.now()}`;
    const userMsg: Message = {
      id: tempId,
      role: 'user',
      content,
      createdAt: new Date().toISOString()
    };

    if (activeConversation) {
      setActiveConversation(prev => prev ? {
        ...prev,
        messages: [...(prev.messages || []), userMsg]
      } : null);
    }

    try {
      const sendData = await sharedSendConversationMessage({ content, conversationId: activeConversation?.id });
      if (sendData) {
        const { message: aiMessage, conversationId } = sendData;
        
        if (!activeConversation) {
          // New conversation created — fetch it directly without re-fetching the entire list first
          const newConv = await sharedFetchConversationDetails(conversationId);
          if (newConv) setActiveConversation(newConv);
          // Background refresh the sidebar list — no loading state
          sharedFetchConversationList().then(setConversations).catch(() => {/* silent */});
        } else {
          // Replace temp user message with server-confirmed one + AI response
          setActiveConversation(prev => {
            if (!prev) return null;
            const existingMessages = (prev.messages || []).filter((m) => m && m.id !== tempId);
            const normalizedAi = normalizeMessage(aiMessage, 'assistant');
            const finalMessages = mergeMessages(
              existingMessages,
              normalizedAi ? [userMsg, normalizedAi] : [userMsg]
            );
            return {
              ...prev,
              messages: finalMessages
            };
          });
        }
      }
    } catch (err: any) {
      setActiveConversation(prev => {
        if (!prev) return null;
        return {
          ...prev,
          messages: [
            ...(prev.messages || []),
            {
              id: `local_${Date.now()}`,
              role: 'assistant',
              content: "I'm having trouble syncing with the server right now, but I kept your message here. Please try again in a moment or use the Reframe CS widget for urgent help.",
              createdAt: new Date().toISOString(),
              metadata: JSON.stringify({ localOnly: true })
            }
          ]
        };
      });
      setAutoError(err.response?.data?.message || 'Message could not sync yet. Your draft stayed visible.');
    } finally {
      setIsSending(false);
    }
  }, [activeConversation, isSending, setAutoError, sharedFetchConversationDetails, sharedFetchConversationList, sharedSendConversationMessage]);

  const approveJob = useCallback(async (jobId: string) => {
    try {
      await portalApi.approveOrder(jobId);
      
      // Optimistic update
      setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: 'Complete' } : j));
      
      // If the current selected job is this one, update it too
      setSelectedJob(prev => prev?.id === jobId ? { ...prev, status: 'Complete' } : prev);
      
    } catch (err: any) {
      setAutoError('Failed to approve job');
    }
  }, [setAutoError]);

  const requestRevision = useCallback(async (jobId: string, notes: string) => {
    try {
      await portalApi.requestRevision(jobId, notes);
      setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: 'In Progress', rawStatus: 'revision_needed', progress: 40 } : j));
      setSelectedJob(prev => prev?.id === jobId ? { ...prev, status: 'In Progress', rawStatus: 'revision_needed', progress: 40 } : prev);
    } catch (err: any) {
      setAutoError(err.response?.data?.message || 'Failed to request revision');
      throw err;
    }
  }, [setAutoError]);

  const cancelJob = useCallback(async (jobId: string) => {
    try {
      await portalApi.cancelOrder(jobId);
      setJobs(prev => prev.filter(j => j.id !== jobId));
      setSelectedJob(prev => prev?.id === jobId ? null : prev);
    } catch (err: any) {
      setAutoError(err.response?.data?.message || 'Cannot cancel this order');
      throw err;
    }
  }, [setAutoError]);

  const rejectProposal = useCallback(async (jobId: string, notes: string) => {
    try {
      await portalApi.rejectProposal(jobId, notes);
      setJobs(prev => prev.map(j => j.id === jobId ? {
        ...j,
        status: mapBackendStatus('new_review'),
        quotation: j.quotation ? { ...j.quotation, status: 'rejected' } : null
      } : j));
      setSelectedJob(prev => prev?.id === jobId ? {
        ...prev,
        status: mapBackendStatus('new_review'),
        quotation: prev.quotation ? { ...prev.quotation, status: 'rejected' } : null
      } : prev);
    } catch (err: any) {
      setAutoError(err.response?.data?.message || 'Failed to decline proposal');
      throw err;
    }
  }, [setAutoError]);

  const createConversation = useCallback(async (title: string) => {
    try {
      const response = await portalApi.sendMessage(`Project: ${title}`, undefined);
      if (response.data.success) {
        const { conversationId } = response.data.data;
        const newConv = await portalApi.getConversationDetails(conversationId);
        if (newConv.data.success) {
          setActiveConversation(newConv.data.data);
        }
        // Background refresh sidebar
        fetchConversations();
      }
    } catch (err: any) {
      setAutoError(err.response?.data?.message || 'Failed to create conversation');
    }
  }, [fetchConversations, setAutoError]);

  const stats: DashboardStats = {
    total: jobs.length,
    active: jobs.filter(j => j.status === 'In Progress' || j.status === 'In Review' || j.status === 'Pending Approval' || j.status === 'Submitted').length,
    completed: jobs.filter(j => j.status === 'Complete').length,
    images: jobs.reduce((sum, j) => sum + j.imageCount, 0),
  };

  // M24 fix: memoize the entire context value to prevent unnecessary re-renders of all
  // consumers when unrelated state slices change (e.g. isSending won't re-render jobs list).
  const contextValue = useMemo(() => ({
    billingProfile,
    setBillingProfile,
    jobs,
    selectedJob,
    setSelectedJob,
    currentView,
    setCurrentView,
    conversations,
    activeConversation,
    setActiveConversation,
    selectConversation,
    stats,
    isLoading,
    isChatBootstrapping,
    isConversationDetailLoading,
    conversationDetailError,
    isSending,
    supportTyping,
    error,
    clearError,
    fetchConversations,
    fetchJobs,
    sendMessage,
    createConversation,
    templates,
    saveTemplate,
    deleteTemplate,
    isTemplateMode,
    setIsTemplateMode,
    brandGuidelines,
    setBrandGuidelines,
    approveJob,
    requestRevision,
    rejectProposal,
    cancelJob,
    fetchJobDetail,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [
    billingProfile, jobs, selectedJob, currentView, conversations, activeConversation,
    stats, isLoading, isChatBootstrapping, isConversationDetailLoading, conversationDetailError,
    isSending, supportTyping, error, templates, isTemplateMode, brandGuidelines,
    selectConversation, clearError, fetchConversations, fetchJobs, sendMessage, createConversation,
    saveTemplate, deleteTemplate, approveJob, requestRevision, rejectProposal, cancelJob,
    fetchJobDetail,
  ]);

  return (
    <DashboardContext.Provider value={contextValue}>
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within DashboardProvider');
  }
  return context;
};
