import { STORAGE, MAX_CACHED_MESSAGES } from './constants';
import type { ChatAttachment, ChatMessage, SuggestedAction } from './types';

export const createId = (prefix = 'id') => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return `${prefix}_${crypto.randomUUID()}`;
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
};

export const readJson = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

export const hasPortalToken = () => {
  const token = localStorage.getItem(STORAGE.portalToken);
  return Boolean(token && token !== 'null');
};

export const authHeaders = (guestId: string, json = false): Record<string, string> => {
  const headers: Record<string, string> = { 'X-Guest-ID': guestId };
  if (json) headers['Content-Type'] = 'application/json';
  const token = localStorage.getItem(STORAGE.portalToken);
  if (token && token !== 'null') headers.Authorization = `Bearer ${token}`;
  return headers;
};

export const parseMetadata = (message?: Pick<ChatMessage, 'metadata'>): Record<string, any> => {
  if (!message?.metadata) return {};
  try {
    return typeof message.metadata === 'string' ? JSON.parse(message.metadata) : message.metadata;
  } catch {
    return {};
  }
};

export const getAttachments = (message: ChatMessage): ChatAttachment[] => {
  const list = message.attachments || parseMetadata(message).attachments;
  return Array.isArray(list) ? list.filter((item: ChatAttachment) => item?.url) : [];
};

export const getOrderCard = (message: ChatMessage) => parseMetadata(message).orderCard || null;

export const isHumanMessage = (message?: ChatMessage) => {
  if (!message || message.role !== 'assistant') return false;
  const meta = parseMetadata(message);
  return meta.isHuman === true || ['admin-dashboard', 'telegram', 'slack'].includes(meta.source);
};

/** Stable identity for a server message; '' for messages that only exist locally. */
export const serverKey = (message?: ChatMessage) => {
  if (!message) return '';
  if (message.id != null && !String(message.id).startsWith('local_')) return String(message.id);
  return message.createdAt || '';
};

export const renderKey = (message: ChatMessage, index: number) =>
  message.clientId || (message.id != null ? `s_${message.id}` : `i_${index}`);

export const messageTime = (message?: ChatMessage) =>
  message?.createdAt || message?.timestamp || message?.updatedAt || '';

export const normalizeActions = (actions?: Array<string | SuggestedAction>): SuggestedAction[] =>
  (actions || []).map(action => (typeof action === 'string' ? { text: action } : action));

export const normalizeServerMessages = (raw: any[]): ChatMessage[] =>
  (raw || []).map(message => {
    const meta = parseMetadata(message);
    return {
      ...message,
      suggestedActions: meta.suggestedActions || message.suggestedActions || [],
      requestContact: meta.requestContact === true,
    };
  });

/** Cheap structural comparison so identical polls don't re-render the thread. */
export const sameThread = (a: ChatMessage[], b: ChatMessage[]) => {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i].id !== b[i].id || a[i].role !== b[i].role || a[i].content !== b[i].content) return false;
  }
  return true;
};

export const cacheMessages = (messages: ChatMessage[]) => {
  const durable = messages.filter(message => !message.pending && !message.failed);
  const capped = durable.length > MAX_CACHED_MESSAGES ? durable.slice(-MAX_CACHED_MESSAGES) : durable;
  try {
    localStorage.setItem(STORAGE.messages, JSON.stringify(capped));
  } catch {
    // Quota errors only cost us the offline cache.
  }
};

export const clearChatCache = () => {
  const convId = localStorage.getItem(STORAGE.conversationId);
  localStorage.removeItem(STORAGE.messages);
  localStorage.removeItem(STORAGE.adminBaseline);
  localStorage.removeItem(STORAGE.contactCaptured);
  localStorage.removeItem(STORAGE.conversationId);
  localStorage.removeItem('reframe_chat_draft:new');
  if (convId) localStorage.removeItem(`reframe_chat_draft:${convId}`);
};

/**
 * The transcript cache belongs to one identity. When the browser switches identity
 * without an explicit logout (token expiry, cleared cookie), the cache is dropped so the
 * next visitor never sees the previous customer's messages. Returns true if it cleared.
 */
export const syncIdentityCache = (identity: string | null) => {
  if (!identity) return false;
  const previous = localStorage.getItem(STORAGE.identity);
  if (previous === identity) return false;
  if (previous) clearChatCache();
  localStorage.setItem(STORAGE.identity, identity);
  return Boolean(previous);
};

export const formatFileSize = (size?: number) => {
  if (!size) return '';
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

export const formatClock = (iso: string) =>
  iso ? new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

export const orderStatusTone = (status?: string) => {
  const normalized = String(status || 'new').toLowerCase();
  if (['completed', 'delivered', 'done'].includes(normalized)) return 'bg-emerald-100 text-emerald-700 border-emerald-200';
  if (['review', 'in_review', 'quality_check'].includes(normalized)) return 'bg-amber-100 text-amber-700 border-amber-200';
  if (['processing', 'in_progress', 'working'].includes(normalized)) return 'bg-blue-100 text-blue-700 border-blue-200';
  return 'bg-zinc-100 text-zinc-700 border-zinc-200';
};

export const isImageAttachment = (attachment: ChatAttachment) =>
  attachment.type?.startsWith('image/') || /\.(png|jpe?g|gif|webp|tiff?)$/i.test(attachment.filename);

export const isImageFile = (file: File) =>
  file.type.startsWith('image/') || /\.(jpe?g|png|gif|webp|tiff?|psd|bmp)$/i.test(file.name);

export const playChime = () => {
  try {
    const Ctor = window.AudioContext || (window as any).webkitAudioContext;
    if (!Ctor) return;
    const ctx = new Ctor();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.setValueAtTime(660, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.22);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.24);
    window.setTimeout(() => ctx.close().catch(() => {}), 300);
  } catch {
    // Browsers block audio until the first user gesture.
  }
};
