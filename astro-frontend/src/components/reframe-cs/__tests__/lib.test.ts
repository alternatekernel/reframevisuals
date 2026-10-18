import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  cacheMessages, formatFileSize, isHumanMessage, isImageAttachment, isImageFile, normalizeServerMessages,
  orderStatusTone, readJson, renderKey, sameThread, serverKey, syncIdentityCache,
} from '../lib';
import { STORAGE } from '../constants';
import type { ChatMessage } from '../types';

class MemoryStorage {
  store = new Map<string, string>();
  throwOnSet = false;
  getItem(key: string) { return this.store.has(key) ? this.store.get(key)! : null; }
  setItem(key: string, value: string) {
    if (this.throwOnSet) throw new Error('QuotaExceededError');
    this.store.set(key, String(value));
  }
  removeItem(key: string) { this.store.delete(key); }
  clear() { this.store.clear(); }
  key(index: number) { return [...this.store.keys()][index] ?? null; }
  get length() { return this.store.size; }
}

let storage: MemoryStorage;
beforeEach(() => {
  storage = new MemoryStorage();
  vi.stubGlobal('localStorage', storage);
});

const team = (extra: Partial<ChatMessage> = {}): ChatMessage => ({
  role: 'assistant', content: 'hi', metadata: { isHuman: true }, ...extra,
});

describe('serverKey / renderKey', () => {
  it('prefers the server id, stringified', () => {
    expect(serverKey({ id: 42, role: 'assistant', content: '' })).toBe('42');
    expect(serverKey({ id: 'abc', role: 'assistant', content: '' })).toBe('abc');
  });
  it('falls back to createdAt, then empty for local-only messages', () => {
    expect(serverKey({ role: 'assistant', content: '', createdAt: '2026-01-01T00:00:00Z' })).toBe('2026-01-01T00:00:00Z');
    expect(serverKey({ role: 'assistant', content: '' })).toBe('');
    expect(serverKey(undefined)).toBe('');
  });
  it('id 0 is still a real id', () => {
    expect(serverKey({ id: 0, role: 'user', content: '' })).toBe('0');
  });
  it('render key is stable for client messages and independent of index', () => {
    const local: ChatMessage = { clientId: 'local_1', role: 'user', content: 'x' };
    expect(renderKey(local, 0)).toBe(renderKey(local, 7));
    expect(renderKey({ id: 5, role: 'user', content: '' }, 3)).toBe('s_5');
    expect(renderKey({ role: 'user', content: '' }, 3)).toBe('i_3');
  });
});

describe('isHumanMessage', () => {
  it.each(['admin-dashboard', 'telegram', 'slack'])('treats source %s as human', source => {
    expect(isHumanMessage({ role: 'assistant', content: '', metadata: { source } })).toBe(true);
  });
  it('reads string-encoded metadata', () => {
    expect(isHumanMessage({ role: 'assistant', content: '', metadata: JSON.stringify({ isHuman: true }) })).toBe(true);
  });
  it('never treats user messages or AI replies as human', () => {
    expect(isHumanMessage({ role: 'user', content: '', metadata: { isHuman: true } })).toBe(false);
    expect(isHumanMessage({ role: 'assistant', content: '', metadata: { source: 'ai' } })).toBe(false);
    expect(isHumanMessage(undefined)).toBe(false);
  });
  it('does not throw on malformed metadata', () => {
    expect(isHumanMessage({ role: 'assistant', content: '', metadata: '{not json' })).toBe(false);
  });
});

describe('normalizeServerMessages', () => {
  it('lifts suggestedActions and requestContact out of metadata', () => {
    const [message] = normalizeServerMessages([{
      id: 1, role: 'assistant', content: 'x',
      metadata: JSON.stringify({ suggestedActions: [{ text: 'Go' }], requestContact: true }),
    }]);
    expect(message.suggestedActions).toEqual([{ text: 'Go' }]);
    expect(message.requestContact).toBe(true);
  });
  it('handles missing input', () => {
    expect(normalizeServerMessages(undefined as any)).toEqual([]);
  });
});

describe('sameThread', () => {
  const a: ChatMessage[] = [{ id: 1, role: 'user', content: 'a' }, team({ id: 2 })];
  it('matches structurally equal threads', () => {
    expect(sameThread(a, a.map(m => ({ ...m })))).toBe(true);
  });
  it('detects length, id, role and content changes', () => {
    expect(sameThread(a, a.slice(1))).toBe(false);
    expect(sameThread(a, [a[0], { ...a[1], id: 3 }])).toBe(false);
    expect(sameThread(a, [a[0], { ...a[1], content: 'edited' }])).toBe(false);
    expect(sameThread(a, [{ ...a[0], role: 'assistant' }, a[1]])).toBe(false);
  });
});

describe('syncIdentityCache', () => {
  const seedChat = () => {
    storage.setItem(STORAGE.conversationId, 'conv-1');
    storage.setItem(STORAGE.messages, '[]');
    storage.setItem(STORAGE.adminBaseline, '{}');
    storage.setItem(STORAGE.contactCaptured, '1');
    storage.setItem('reframe_chat_draft:new', 'x');
    storage.setItem('reframe_chat_draft:conv-1', 'y');
  };

  it('null identity (session still resolving) is a no-op', () => {
    seedChat();
    expect(syncIdentityCache(null)).toBe(false);
    expect(storage.getItem(STORAGE.conversationId)).toBe('conv-1');
  });
  it('first identity is recorded without clearing anything', () => {
    seedChat();
    expect(syncIdentityCache('guest-a')).toBe(false);
    expect(storage.getItem(STORAGE.identity)).toBe('guest-a');
    expect(storage.getItem(STORAGE.messages)).toBe('[]');
  });
  it('same identity keeps the cache', () => {
    storage.setItem(STORAGE.identity, 'guest-a');
    seedChat();
    expect(syncIdentityCache('guest-a')).toBe(false);
    expect(storage.getItem(STORAGE.conversationId)).toBe('conv-1');
  });
  it('a different identity clears every chat key', () => {
    storage.setItem(STORAGE.identity, 'guest-a');
    seedChat();
    expect(syncIdentityCache('user-1')).toBe(true);
    for (const key of [STORAGE.conversationId, STORAGE.messages, STORAGE.adminBaseline, STORAGE.contactCaptured, 'reframe_chat_draft:new', 'reframe_chat_draft:conv-1']) {
      expect(storage.getItem(key), key).toBeNull();
    }
    expect(storage.getItem(STORAGE.identity)).toBe('user-1');
  });
});

describe('cacheMessages', () => {
  it('drops pending and failed messages', () => {
    cacheMessages([
      { id: 1, role: 'user', content: 'kept' },
      { clientId: 'p', role: 'assistant', content: 'pending', pending: true },
      { clientId: 'f', role: 'user', content: 'failed', failed: true },
    ]);
    const saved = JSON.parse(storage.getItem(STORAGE.messages)!);
    expect(saved.map((m: ChatMessage) => m.content)).toEqual(['kept']);
  });
  it('keeps only the newest 150', () => {
    const many = Array.from({ length: 200 }, (_, i) => ({ id: i, role: 'user' as const, content: String(i) }));
    cacheMessages(many);
    const saved = JSON.parse(storage.getItem(STORAGE.messages)!);
    expect(saved).toHaveLength(150);
    expect(saved[0].content).toBe('50');
    expect(saved[149].content).toBe('199');
  });
  it('survives storage quota errors', () => {
    storage.throwOnSet = true;
    expect(() => cacheMessages([{ id: 1, role: 'user', content: 'x' }])).not.toThrow();
  });
});

describe('readJson', () => {
  it('returns the fallback for missing or corrupt values', () => {
    expect(readJson('missing', 'fb')).toBe('fb');
    storage.setItem('bad', '{oops');
    expect(readJson('bad', [])).toEqual([]);
  });
  it('parses legacy plain-number baselines without throwing', () => {
    storage.setItem(STORAGE.adminBaseline, '123');
    expect(readJson(STORAGE.adminBaseline, {})).toBe(123);
  });
});

describe('formatting helpers', () => {
  it('formats file sizes', () => {
    expect(formatFileSize(undefined)).toBe('');
    expect(formatFileSize(0)).toBe('');
    expect(formatFileSize(2048)).toBe('2 KB');
    expect(formatFileSize(5 * 1024 * 1024)).toBe('5.0 MB');
  });
  it('detects images by mime type or extension', () => {
    expect(isImageAttachment({ url: 'u', filename: 'a.PNG' })).toBe(true);
    expect(isImageAttachment({ url: 'u', filename: 'a.pdf', type: 'image/jpeg' })).toBe(true);
    expect(isImageAttachment({ url: 'u', filename: 'brief.pdf' })).toBe(false);
    expect(isImageFile({ name: 'shot.psd', type: '' } as File)).toBe(true);
    expect(isImageFile({ name: 'notes.txt', type: 'text/plain' } as File)).toBe(false);
  });
  it('maps order statuses to tones, case-insensitively', () => {
    expect(orderStatusTone('DELIVERED')).toContain('emerald');
    expect(orderStatusTone('in_review')).toContain('amber');
    expect(orderStatusTone('processing')).toContain('blue');
    expect(orderStatusTone(undefined)).toContain('zinc');
  });
});
