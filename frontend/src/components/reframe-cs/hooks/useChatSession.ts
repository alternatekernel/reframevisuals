import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { getApiEndpoint } from '../../../lib/apiConfig';
import { uploadFetch } from '../../../lib/directUpload';
import { getLocalCsResponse } from '../../../utils/localCsResponses';
import { resolveSlashCommand } from '../../../utils/chatSmart';
import { useSharedChatController } from '../../../hooks/useSharedChatController';
import { usePageVisibility } from '../../../hooks/usePageVisibility';
import { CONVERSATION_EVENT, POLL_MS, STORAGE, greetingMessage } from '../constants';
import {
  authHeaders, cacheMessages, clearChatCache, createId, isHumanMessage, isImageFile,
  normalizeServerMessages, parseMetadata, playChime, readJson, sameThread, serverKey, syncIdentityCache,
} from '../lib';
import type { ChatAttachment, ChatMessage, ConversationPreview } from '../types';

interface Options {
  guestId: string;
  identity: string | null;
  isGuest: boolean;
  /** Widget is open on the chat tab — new replies are being read as they land. */
  isOpenOnChat: boolean;
  /** Only the floating launcher owns sounds and unread badges. */
  notify: boolean;
}

interface NewChatOptions {
  intro?: string;
  suggestedActions?: ChatMessage['suggestedActions'];
}

type Baselines = Record<string, string>;

const readBaselines = (): Baselines => {
  const value = readJson<unknown>(STORAGE.adminBaseline, {});
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Baselines) : {};
};

const writeBaseline = (conversationId: string, key: string) => {
  const next = { ...readBaselines(), [conversationId]: key };
  localStorage.setItem(STORAGE.adminBaseline, JSON.stringify(next));
};

const firstLine = (text: string) => (text || '').split('\n')[0].slice(0, 90);

export const useChatSession = ({ guestId, identity, isGuest, isOpenOnChat, notify }: Options) => {
  const { fetchConversationList, fetchConversationDetails, sendConversationMessage } = useSharedChatController();
  const pageVisible = usePageVisibility();
  const isViewing = isOpenOnChat && pageVisible;

  const [initial] = useState(() => {
    syncIdentityCache(identity);
    return {
      conversationId: localStorage.getItem(STORAGE.conversationId),
      messages: readJson<ChatMessage[] | null>(STORAGE.messages, null),
      contactCaptured: localStorage.getItem(STORAGE.contactCaptured) === '1',
    };
  });

  const [conversationId, setConversationIdState] = useState<string | null>(initial.conversationId);
  const [messages, setMessages] = useState<ChatMessage[]>(
    initial.messages?.length ? initial.messages : [greetingMessage()],
  );
  const [conversations, setConversations] = useState<ConversationPreview[]>([]);
  const [conversationsLoading, setConversationsLoading] = useState(false);
  const [threadLoading, setThreadLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isSupportTyping, setIsSupportTyping] = useState(false);
  const [supportSeenId, setSupportSeenId] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadFromKey, setUnreadFromKey] = useState('');
  const [latestPreview, setLatestPreview] = useState('');
  const [contactCaptured, setContactCaptured] = useState(initial.contactCaptured);

  const [instanceId] = useState(() => createId('cs'));
  const conversationIdRef = useRef(conversationId);
  const sendingRef = useRef(false);
  const viewingRef = useRef(isViewing);
  const notifyRef = useRef(notify);
  const lastSeenPostedRef = useRef('');
  const lastTypingSentRef = useRef(0);
  const typingTimerRef = useRef<number | null>(null);
  const loadTokenRef = useRef(0);

  useLayoutEffect(() => {
    viewingRef.current = isViewing;
    notifyRef.current = notify;
  }, [isViewing, notify]);

  const adoptConversation = useCallback((id: string | null, broadcast = true) => {
    conversationIdRef.current = id;
    setConversationIdState(id);
    if (id) localStorage.setItem(STORAGE.conversationId, id);
    else localStorage.removeItem(STORAGE.conversationId);
    if (broadcast) {
      window.dispatchEvent(new CustomEvent(CONVERSATION_EVENT, { detail: { id, source: instanceId } }));
    }
  }, [instanceId]);

  const resetUnread = useCallback(() => {
    setUnreadCount(0);
    setUnreadFromKey('');
    setLatestPreview('');
  }, []);

  const resetSession = useCallback((options?: NewChatOptions) => {
    loadTokenRef.current += 1;
    lastSeenPostedRef.current = '';
    setMessages([greetingMessage(options?.intro, options?.suggestedActions)]);
    setIsSupportTyping(false);
    setSupportSeenId('');
    setThreadLoading(false);
    resetUnread();
  }, [resetUnread]);

  const refreshConversations = useCallback(async () => {
    setConversationsLoading(true);
    try {
      setConversations((await fetchConversationList()) || []);
    } catch {
      // List is a convenience; the open thread keeps working without it.
    } finally {
      setConversationsLoading(false);
    }
  }, [fetchConversationList]);

  /** Records the newest support reply; returns the replies that arrived since the last baseline. */
  const trackSupportReplies = useCallback((convId: string, thread: ChatMessage[]) => {
    const replies = thread.filter(isHumanMessage);
    const latest = replies[replies.length - 1];
    const latestKey = serverKey(latest);
    if (!latestKey) return [];

    const baseline = readBaselines()[convId];
    if (baseline === latestKey) return [];
    writeBaseline(convId, latestKey);
    if (!baseline) return [];

    const baselineIndex = replies.findIndex(reply => serverKey(reply) === baseline);
    return baselineIndex >= 0 ? replies.slice(baselineIndex + 1) : [latest];
  }, []);

  const postSeen = useCallback((convId: string, thread: ChatMessage[]) => {
    const latest = [...thread].reverse().find(isHumanMessage);
    if (!latest?.id || lastSeenPostedRef.current === String(latest.id)) return;
    lastSeenPostedRef.current = String(latest.id);
    fetch(getApiEndpoint(`/portal/conversations/${convId}/seen`), {
      method: 'POST',
      headers: authHeaders(guestId, true),
      body: JSON.stringify({ messageId: latest.id }),
    }).catch(() => {});
  }, [guestId]);

  const syncThread = useCallback(async (convId: string) => {
    try {
      const headers = authHeaders(guestId);
      const [detailsRes, realtimeRes] = await Promise.all([
        fetch(getApiEndpoint(`/portal/conversations/${convId}`), { headers }),
        fetch(getApiEndpoint(`/portal/conversations/${convId}/realtime`), { headers }),
      ]);
      const [details, realtime] = await Promise.all([
        detailsRes.json().catch(() => null),
        realtimeRes.json().catch(() => null),
      ]);
      if (conversationIdRef.current !== convId) return;

      if (realtime?.success) {
        setIsSupportTyping(Boolean(realtime.data?.supportTyping));
        setSupportSeenId(String(realtime.data?.supportSeen?.messageId || ''));
      }
      if (!details?.success || !Array.isArray(details.data?.messages)) return;
      // A send in flight owns the tail of the thread; the next poll will reconcile it.
      if (sendingRef.current) return;

      const thread = normalizeServerMessages(details.data.messages);
      const fresh = trackSupportReplies(convId, thread);
      if (fresh.length) {
        if (!viewingRef.current) {
          setUnreadCount(count => count + fresh.length);
          setUnreadFromKey(current => current || serverKey(fresh[0]));
          setLatestPreview(firstLine(fresh[fresh.length - 1].content));
          if (notifyRef.current) playChime();
        }
      }

      setMessages(prev => {
        const failed = prev.filter(message => message.failed);
        const next = failed.length ? [...thread, ...failed] : thread;
        return sameThread(prev, next) ? prev : next;
      });

      if (viewingRef.current) postSeen(convId, thread);
    } catch {
      // Polling is best-effort; the next tick retries.
    }
  }, [guestId, postSeen, trackSupportReplies]);

  const loadConversation = useCallback(async (id: string) => {
    if (id === conversationIdRef.current && !threadLoading) return;
    const token = ++loadTokenRef.current;
    adoptConversation(id);
    resetUnread();
    lastSeenPostedRef.current = '';
    setIsSupportTyping(false);
    setSupportSeenId('');
    setThreadLoading(true);
    try {
      const details = await fetchConversationDetails(id);
      if (token !== loadTokenRef.current) return;
      const thread = normalizeServerMessages(details?.messages || []);
      trackSupportReplies(id, thread);
      setMessages(thread.length ? thread : [greetingMessage()]);
    } catch {
      if (token === loadTokenRef.current) {
        setMessages([{ clientId: createId('local'), role: 'assistant', content: "Couldn't load this conversation. Try again in a moment." }]);
      }
    } finally {
      if (token === loadTokenRef.current) setThreadLoading(false);
    }
  }, [adoptConversation, fetchConversationDetails, resetUnread, threadLoading, trackSupportReplies]);

  const startNewChat = useCallback((options?: NewChatOptions) => {
    adoptConversation(null);
    resetSession(options);
  }, [adoptConversation, resetSession]);

  const sendTyping = useCallback((convId: string, isTyping: boolean) => {
    fetch(getApiEndpoint(`/portal/conversations/${convId}/typing`), {
      method: 'POST',
      headers: authHeaders(guestId, true),
      body: JSON.stringify({ isTyping }),
    }).catch(() => {});
  }, [guestId]);

  const stopTyping = useCallback((convId?: string | null) => {
    if (typingTimerRef.current) window.clearTimeout(typingTimerRef.current);
    typingTimerRef.current = null;
    if (convId && lastTypingSentRef.current) sendTyping(convId, false);
    lastTypingSentRef.current = 0;
  }, [sendTyping]);

  /** Throttled: at most one "typing" ping every 2s, and a "stopped" ping after 2.5s idle. */
  const notifyTyping = useCallback((text: string) => {
    const convId = conversationIdRef.current;
    if (!convId) return;
    if (!text.trim()) {
      stopTyping(convId);
      return;
    }
    const now = Date.now();
    if (now - lastTypingSentRef.current > 2000) {
      lastTypingSentRef.current = now;
      sendTyping(convId, true);
    }
    if (typingTimerRef.current) window.clearTimeout(typingTimerRef.current);
    typingTimerRef.current = window.setTimeout(() => stopTyping(convId), 2500);
  }, [sendTyping, stopTyping]);

  const sendMessage = useCallback(async (
    rawText: string,
    attachments: ChatAttachment[] = [],
    retryOf?: string,
  ): Promise<boolean> => {
    if (sendingRef.current) return false;
    const slash = resolveSlashCommand(rawText);
    const content = (slash ? slash.message : rawText).trim();
    if (!content && attachments.length === 0) return false;

    sendingRef.current = true;
    setIsSending(true);

    const now = new Date().toISOString();
    const userClientId = createId('local');
    const replyClientId = `${userClientId}_reply`;
    const preflight = getLocalCsResponse(content);
    const userMessage: ChatMessage = {
      clientId: userClientId,
      role: 'user',
      content: content || `[Attached ${attachments.length} file(s)]`,
      attachments: attachments.length ? attachments : undefined,
      createdAt: now,
    };
    const placeholder: ChatMessage = {
      clientId: replyClientId,
      role: 'assistant',
      content: preflight.content,
      suggestedActions: preflight.suggestedActions,
      pending: true,
      createdAt: now,
    };

    setMessages(prev => [
      ...prev.filter(message => message.clientId !== retryOf && message.clientId !== `${retryOf}_reply`),
      userMessage,
      placeholder,
    ]);

    const replaceReply = (next: ChatMessage | null) => setMessages(prev => (
      next
        ? prev.map(message => (message.clientId === replyClientId ? next : message))
        : prev.filter(message => message.clientId !== replyClientId)
    ));

    try {
      const sentFrom = conversationIdRef.current;
      const data: any = await sendConversationMessage({
        content,
        conversationId: sentFrom || undefined,
        attachments,
        guestId: isGuest ? guestId : undefined,
      });
      if (!data) throw new Error('Chat request failed');

      const convId = data.conversationId || sentFrom;
      stopTyping(convId);
      if (data.conversationId && data.conversationId !== sentFrom) {
        adoptConversation(data.conversationId);
        refreshConversations();
      }

      if (data.awaitingHuman || data.aiData?.awaitingHuman) {
        replaceReply(null);
        sendingRef.current = false;
        if (convId) await syncThread(convId);
        return true;
      }

      const response = data.message || data;
      const reply = response?.content || data.content || '';
      if (!reply) throw new Error('Chat endpoint returned no customer-facing response');
      const meta = parseMetadata(response);

      replaceReply({
        id: response.id,
        clientId: replyClientId,
        role: 'assistant',
        content: reply,
        metadata: response.metadata,
        requestContact: meta.requestContact === true,
        suggestedActions: data.aiData?.suggestedActions || response.suggestedActions || meta.suggestedActions || [],
        createdAt: response.createdAt || new Date().toISOString(),
      });

      if (data.aiData?.intentAnalysis?.needHumanHandoff) {
        window.setTimeout(() => {
          setMessages(prev => [...prev, {
            clientId: createId('local'),
            role: 'assistant',
            content: 'This looks like something our team should handle. Want me to loop in a human?',
            isHandoff: true,
            createdAt: new Date().toISOString(),
          }]);
        }, 800);
      }
      return true;
    } catch {
      // Keep the instant local answer so the visitor isn't left empty-handed, and let them retry.
      setMessages(prev => prev.map(message => {
        if (message.clientId === userClientId) return { ...message, failed: true };
        if (message.clientId === replyClientId) return { ...message, pending: false };
        return message;
      }));
      return true;
    } finally {
      sendingRef.current = false;
      setIsSending(false);
    }
  }, [adoptConversation, guestId, isGuest, refreshConversations, sendConversationMessage, stopTyping, syncThread]);

  const retryMessage = useCallback((message: ChatMessage) => {
    if (!message.clientId) return;
    sendMessage(message.content, message.attachments || [], message.clientId);
  }, [sendMessage]);

  const uploadToChat = useCallback(async (files: File[]) => {
    if (!files.length) return;
    const placeholderId = createId('upload');
    setMessages(prev => [...prev, {
      clientId: placeholderId,
      role: 'assistant',
      content: `Uploading ${files.length} file${files.length === 1 ? '' : 's'}…`,
      pending: true,
    }]);

    const uploaded: ChatAttachment[] = [];
    for (const file of files) {
      try {
        const body = new FormData();
        body.append('file', file);
        const response = await uploadFetch(getApiEndpoint('/portal/upload'), {
          method: 'POST',
          headers: { ...authHeaders(guestId), 'X-Upload-Category': isImageFile(file) ? 'original' : 'support' },
          body,
        });
        const result = await response.json();
        if (result?.success && result.data?.url) {
          uploaded.push({
            url: result.data.url,
            filename: result.data.filename || file.name,
            size: result.data.size || file.size,
            type: file.type,
            path: result.data.path,
            folderPath: result.data.folderPath,
          });
        }
      } catch {
        // Reported below once every file has been tried.
      }
    }

    setMessages(prev => prev.filter(message => message.clientId !== placeholderId));
    if (!uploaded.length) {
      setMessages(prev => [...prev, {
        clientId: createId('local'),
        role: 'assistant',
        content: 'Upload failed. Check your connection and try again.',
      }]);
      return;
    }
    const allImages = files.every(isImageFile);
    const missed = files.length - uploaded.length;
    const label = allImages ? `Uploaded ${uploaded.length} image(s)` : `Attached ${uploaded.length} file(s)`;
    await sendMessage(missed ? `${label} — ${missed} failed to upload` : label, uploaded);
  }, [guestId, sendMessage]);

  const requestHuman = useCallback(async () => {
    const convId = conversationIdRef.current;
    if (!convId) return false;
    try {
      const response = await fetch(getApiEndpoint('/portal/chat/escalate'), {
        method: 'POST',
        headers: authHeaders(guestId, true),
        body: JSON.stringify({ conversationId: convId }),
      });
      const result = await response.json();
      if (!result?.success) return false;
      setMessages(prev => [
        ...prev.map(message => (message.isHandoff ? { ...message, isHandoff: false } : message)),
        {
          clientId: createId('local'),
          role: 'assistant',
          content: "I've notified the team. Keep typing — they'll see your messages here.",
          createdAt: new Date().toISOString(),
        },
      ]);
      refreshConversations();
      return true;
    } catch {
      return false;
    }
  }, [guestId, refreshConversations]);

  const deleteConversation = useCallback(async (id: string) => {
    try {
      const response = await fetch(getApiEndpoint(`/portal/conversations/${id}`), {
        method: 'DELETE',
        headers: authHeaders(guestId),
        credentials: 'include',
      });
      const result = await response.json();
      if (!result?.success) return false;
      setConversations(prev => prev.filter(conversation => conversation.id !== id));
      if (conversationIdRef.current === id) startNewChat();
      return true;
    } catch {
      return false;
    }
  }, [guestId, startNewChat]);

  const markContactCaptured = useCallback(() => {
    localStorage.setItem(STORAGE.contactCaptured, '1');
    setContactCaptured(true);
  }, []);

  // Identity flipped underneath us (session expired, different account): drop the old thread.
  useEffect(() => {
    if (!syncIdentityCache(identity)) return;
    adoptConversation(null, false);
    resetSession();
    setConversations([]);
    setContactCaptured(false);
  }, [identity, adoptConversation, resetSession]);

  // Another widget instance on the page (e.g. the embedded showcase) switched conversation.
  useEffect(() => {
    const onConversation = (event: Event) => {
      const detail = (event as CustomEvent<{ id: string | null; source: string }>).detail;
      if (!detail || detail.source === instanceId || detail.id === conversationIdRef.current) return;
      adoptConversation(detail.id, false);
      if (detail.id) syncThread(detail.id);
      else resetSession();
    };
    window.addEventListener(CONVERSATION_EVENT, onConversation);
    return () => window.removeEventListener(CONVERSATION_EVENT, onConversation);
  }, [adoptConversation, instanceId, resetSession, syncThread]);

  useEffect(() => {
    const onLogout = () => {
      clearChatCache();
      adoptConversation(null, false);
      resetSession();
      setConversations([]);
      setContactCaptured(false);
    };
    window.addEventListener('portal-logout', onLogout);
    return () => window.removeEventListener('portal-logout', onLogout);
  }, [adoptConversation, resetSession]);

  useEffect(() => {
    if (!conversationId) return;
    syncThread(conversationId);
    const interval = !pageVisible ? POLL_MS.hidden : isViewing ? POLL_MS.viewing : POLL_MS.background;
    const timer = window.setInterval(() => syncThread(conversationId), interval);
    return () => window.clearInterval(timer);
  }, [conversationId, isViewing, pageVisible, syncThread]);

  useEffect(() => {
    if (!isViewing) return;
    setUnreadCount(0);
    setLatestPreview('');
    if (conversationIdRef.current) postSeen(conversationIdRef.current, messages);
    // Leave the "Unread" divider up long enough to be noticed, then retire it.
    const timer = window.setTimeout(() => setUnreadFromKey(''), 8000);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isViewing]);

  useEffect(() => { cacheMessages(messages); }, [messages]);

  useEffect(() => () => {
    if (typingTimerRef.current) window.clearTimeout(typingTimerRef.current);
  }, []);

  return {
    conversationId,
    messages,
    conversations,
    conversationsLoading,
    threadLoading,
    isSending,
    isSupportTyping,
    supportSeenId,
    unreadCount,
    unreadFromKey,
    latestPreview,
    contactCaptured,
    markContactCaptured,
    refreshConversations,
    loadConversation,
    startNewChat,
    sendMessage,
    retryMessage,
    uploadToChat,
    requestHuman,
    deleteConversation,
    notifyTyping,
  };
};

export type ChatSession = ReturnType<typeof useChatSession>;
