// Serverless-safe realtime: the server publishes over Supabase Realtime's HTTP broadcast API
// (no long-lived connections). Browsers subscribe to an unguessable, HMAC-derived topic that
// is only handed out by the authenticated /stream endpoints.
import crypto from 'crypto';
import { waitUntil } from '@vercel/functions';

export type RealtimeKind = 'chat' | 'orders' | 'admin';

const SUPABASE_URL = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

function topicSecret(): string {
  return process.env.REALTIME_TOPIC_SECRET || process.env.JWT_SECRET || '';
}

export function realtimeTopic(kind: RealtimeKind, id: string): string {
  const digest = crypto.createHmac('sha256', topicSecret()).update(`${kind}:${id}`).digest('hex').slice(0, 32);
  return `${kind}-${digest}`;
}

export function publishRealtime(kind: RealtimeKind, id: string, event: string, payload: Record<string, any>): void {
  if (!SUPABASE_URL || !SERVICE_KEY || !topicSecret()) return;
  const task = fetch(`${SUPABASE_URL}/realtime/v1/api/broadcast`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
    body: JSON.stringify({ messages: [{ topic: realtimeTopic(kind, id), event, payload, private: false }] }),
  }).catch((err) => console.error('[Realtime] publish failed:', err?.message || err));
  try { waitUntil(task); } catch { /* not on Vercel */ }
}

/** Body returned by the /stream endpoints that used to hold an SSE connection open. */
export function realtimeSubscription(kind: RealtimeKind, id: string) {
  return { success: true, topic: realtimeTopic(kind, id) };
}
