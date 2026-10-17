import type { Page, Request, Route } from '@playwright/test';

export interface FakeMessage {
  id: number | string;
  role: 'user' | 'assistant';
  content: string;
  metadata?: Record<string, unknown> | string | null;
  createdAt: string;
}

export interface FakeConversation {
  id: string;
  title?: string;
  updatedAt: string;
  messages: FakeMessage[];
}

export interface FakeUser {
  id: string;
  name: string;
  email: string;
  role?: string;
}

/** Endpoint names used for fault injection and call inspection. */
export type Endpoint =
  | 'me' | 'conversations' | 'conversation' | 'realtime' | 'seen' | 'typing' | 'delete'
  | 'chat' | 'escalate' | 'capture-email' | 'upload' | 'presence' | 'orders' | 'reserve' | 'other';

export interface Fault {
  status?: number;
  /** Abort the request at the network level. */
  abort?: boolean;
  delayMs?: number;
  /** Respond with this JSON body instead of the normal one. */
  body?: unknown;
  /** Apply to the next N calls only (default: until cleared). */
  times?: number;
}

export interface Call {
  endpoint: Endpoint;
  method: string;
  path: string;
  body: any;
  at: number;
}

type ChatReply = (input: { content: string; conversation: FakeConversation; attachments?: unknown[] }) => Record<string, unknown>;

const iso = (offsetMs = 0) => new Date(Date.now() + offsetMs).toISOString();

const classify = (method: string, path: string): Endpoint => {
  if (path === '/portal/auth/me') return 'me';
  if (path === '/portal/conversations') return 'conversations';
  if (/^\/portal\/conversations\/[^/]+\/realtime$/.test(path)) return 'realtime';
  if (/^\/portal\/conversations\/[^/]+\/seen$/.test(path)) return 'seen';
  if (/^\/portal\/conversations\/[^/]+\/typing$/.test(path)) return 'typing';
  if (/^\/portal\/conversations\/[^/]+$/.test(path)) return method === 'DELETE' ? 'delete' : 'conversation';
  if (path === '/portal/chat') return 'chat';
  if (path === '/portal/chat/escalate') return 'escalate';
  if (path === '/portal/chat/capture-email') return 'capture-email';
  if (path.startsWith('/portal/upload')) return 'upload';
  if (path === '/portal/presence') return 'presence';
  if (path === '/portal/orders/reserve') return 'reserve';
  if (path === '/portal/orders') return 'orders';
  return 'other';
};

/**
 * Stateful stand-in for the portal API. Every request under /api is answered here,
 * so tests never depend on the real backend and can inject failures precisely.
 */
export class FakeBackend {
  conversations = new Map<string, FakeConversation>();
  calls: Call[] = [];
  faults = new Map<Endpoint, Fault>();
  user: FakeUser | null = null;
  orders: any[] = [];
  supportTyping = false;
  seenMessageId = '';
  private nextId = 1000;
  private nextConversation = 1;
  private uploadFailures = new Set<string>();

  /** Default AI behaviour: echo-style reply with one suggested action. */
  chatReply: ChatReply = ({ content }) => ({
    message: { id: this.id(), role: 'assistant', content: `Answer to: ${content}`, createdAt: iso() },
    aiData: { suggestedActions: [{ text: 'Thanks' }] },
  });

  constructor(private page: Page) {}

  async install() {
    await this.page.route(url => url.pathname.startsWith('/api/'), route => this.handle(route));
  }

  id() {
    return this.nextId++;
  }

  seedConversation(id: string, messages: Array<Partial<FakeMessage> & Pick<FakeMessage, 'role' | 'content'>>, title?: string) {
    const base = Date.now() - messages.length * 60_000;
    const conversation: FakeConversation = {
      id,
      title: title ?? `Conversation ${id}`,
      updatedAt: iso(),
      messages: messages.map((message, index) => ({
        id: message.id ?? this.id(),
        createdAt: message.createdAt ?? new Date(base + index * 60_000).toISOString(),
        metadata: message.metadata ?? null,
        role: message.role,
        content: message.content,
      })),
    };
    this.conversations.set(id, conversation);
    return conversation;
  }

  teamReply(conversationId: string, content: string, extra: Partial<FakeMessage> = {}) {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) throw new Error(`No conversation ${conversationId}`);
    const message: FakeMessage = {
      id: this.id(),
      role: 'assistant',
      content,
      metadata: { isHuman: true, source: 'admin-dashboard' },
      createdAt: iso(),
      ...extra,
    };
    conversation.messages.push(message);
    conversation.updatedAt = message.createdAt;
    return message;
  }

  fault(endpoint: Endpoint, fault: Fault | null) {
    if (fault) this.faults.set(endpoint, fault);
    else this.faults.delete(endpoint);
  }

  failUploadOf(filename: string) {
    this.uploadFailures.add(filename);
  }

  callsTo(endpoint: Endpoint) {
    return this.calls.filter(call => call.endpoint === endpoint);
  }

  resetCalls() {
    this.calls = [];
  }

  private async handle(route: Route) {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace(/^.*?\/api/, '');
    const method = request.method();
    const endpoint = classify(method, path);
    const body = this.parseBody(request);
    this.calls.push({ endpoint, method, path, body, at: Date.now() });

    const fault = this.faults.get(endpoint);
    if (fault) {
      if (fault.times !== undefined) {
        fault.times -= 1;
        if (fault.times <= 0) this.faults.delete(endpoint);
      }
      if (fault.delayMs) await new Promise(resolve => setTimeout(resolve, fault.delayMs));
      if (fault.abort) return route.abort('failed').catch(() => {});
      if (fault.status || fault.body !== undefined) {
        return this.json(route, fault.body ?? { success: false, message: 'Injected failure' }, fault.status ?? 200);
      }
    }

    try {
      return await this.respond(route, endpoint, method, path, body, request);
    } catch {
      // The page navigated away before we answered.
    }
  }

  private parseBody(request: Request) {
    const raw = request.postData();
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  }

  private json(route: Route, body: unknown, status = 200) {
    return route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) }).catch(() => {});
  }

  private async respond(route: Route, endpoint: Endpoint, method: string, path: string, body: any, request: Request) {
    const conversationId = path.split('/')[3];
    const conversation = conversationId ? this.conversations.get(conversationId) : undefined;

    switch (endpoint) {
      case 'me':
        return this.user
          ? this.json(route, { success: true, data: { ...this.user, isGuest: false } })
          : this.json(route, { success: false }, 401);

      case 'conversations':
        return this.json(route, {
          success: true,
          data: [...this.conversations.values()].map(c => ({
            id: c.id, title: c.title, updatedAt: c.updatedAt, messages: c.messages.slice(-1),
          })),
        });

      case 'conversation':
        return conversation
          ? this.json(route, { success: true, data: { id: conversation.id, messages: conversation.messages } })
          : this.json(route, { success: false, message: 'Not found' }, 404);

      case 'realtime':
        return this.json(route, {
          success: true,
          data: { supportTyping: this.supportTyping, supportSeen: { messageId: this.seenMessageId } },
        });

      case 'seen':
      case 'typing':
      case 'presence':
        return this.json(route, { success: true });

      case 'delete':
        if (!conversation) return this.json(route, { success: false }, 404);
        this.conversations.delete(conversation.id);
        return this.json(route, { success: true });

      case 'chat': {
        const target = (body?.conversationId && this.conversations.get(body.conversationId))
          || this.seedConversation(`conv-${this.nextConversation++}`, [], 'New conversation');
        const userMessage: FakeMessage = {
          id: this.id(), role: 'user', content: body?.content ?? '', createdAt: iso(),
          metadata: body?.attachments?.length ? { attachments: body.attachments } : null,
        };
        target.messages.push(userMessage);
        const reply = this.chatReply({ content: userMessage.content, conversation: target, attachments: body?.attachments });
        const message = (reply as any).message;
        if (message?.content) {
          const suggestedActions = (reply as any).aiData?.suggestedActions;
          const metadata = message.metadata ?? (suggestedActions?.length ? JSON.stringify({ suggestedActions }) : null);
          target.messages.push({ ...message, metadata });
        }
        target.updatedAt = iso();
        return this.json(route, { success: true, data: { conversationId: target.id, ...reply } });
      }

      case 'escalate':
        return this.json(route, { success: true });

      case 'capture-email':
        return this.json(route, { success: true });

      case 'upload': {
        // Multi-step upload via uploadFetch: /init → PUT to fake CDN → /complete
        if (path.endsWith('/upload/init')) {
          const filename = body?.filename || 'file.bin';
          if (this.uploadFailures.has(filename)) return this.json(route, { success: false, message: 'Upload rejected' }, 500);
          return this.json(route, {
            success: true,
            data: { uploadUrl: `/api/portal/upload/cdn-put?file=${encodeURIComponent(filename)}`, path: `uploads/${filename}` },
          });
        }
        if (path.endsWith('/upload/cdn-put') || method === 'PUT') {
          return route.fulfill({ status: 200, body: '' }).catch(() => {});
        }
        if (path.endsWith('/upload/complete')) {
          const filename = body?.filename || 'file.bin';
          return this.json(route, {
            success: true,
            data: { url: `https://cdn.test/${encodeURIComponent(filename)}`, filename, size: body?.size ?? 2048, path: body?.path ?? `uploads/${filename}` },
          });
        }
        // Legacy direct upload path (kept for backward compatibility)
        const raw = request.postDataBuffer()?.toString('latin1') || '';
        const filename = /filename="([^"]+)"/.exec(raw)?.[1] || 'file.bin';
        if (this.uploadFailures.has(filename)) return this.json(route, { success: false, message: 'Upload rejected' }, 500);
        return this.json(route, {
          success: true,
          data: { url: `https://cdn.test/${encodeURIComponent(filename)}`, filename, size: 2048, path: `uploads/${filename}` },
        });
      }

      case 'reserve':
        return this.json(route, { success: true, data: { orderCode: 'RV-TEST-1' } });

      case 'orders':
        if (method === 'POST') return this.json(route, { success: true, data: { id: 'order-1', code: 'RV-TEST-1' } });
        return this.json(route, { success: true, data: this.orders });

      default:
        return this.json(route, { success: false, message: 'Not mocked' }, 404);
    }
  }
}
