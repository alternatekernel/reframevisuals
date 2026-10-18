// Drop-in replacement for EventSource backed by Supabase Realtime.
// The URL is the same "/stream" endpoint as before; it now returns { topic } after the usual
// auth checks, and we subscribe to that topic instead of holding an HTTP stream open.
import { createClient, type RealtimeChannel, type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;
const getClient = (): SupabaseClient | null => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  client ??= createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return client;
};

type Listener = (e: { data: string }) => void;

export class RealtimeSource {
  onopen: (() => void) | null = null;
  onerror: (() => void) | null = null;
  private listeners = new Map<string, Set<Listener>>();
  private channel: RealtimeChannel | null = null;
  private closed = false;

  constructor(url: string, init?: { withCredentials?: boolean }) {
    void this.connect(url, init);
  }

  addEventListener(type: string, cb: Listener) {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type)!.add(cb);
  }

  close() {
    this.closed = true;
    if (this.channel) void getClient()?.removeChannel(this.channel);
    this.channel = null;
  }

  private fail() {
    if (!this.closed) this.onerror?.();
  }

  private async connect(url: string, init?: { withCredentials?: boolean }) {
    const supabase = getClient();
    if (!supabase) return this.fail();
    try {
      const res = await fetch(url, { credentials: init?.withCredentials ? 'include' : 'same-origin' });
      if (!res.ok) return this.fail();
      const { topic } = await res.json();
      if (this.closed || !topic) return;
      this.channel = supabase
        .channel(topic)
        .on('broadcast', { event: '*' }, ({ event, payload }) => {
          const data = JSON.stringify(payload);
          this.listeners.get(event)?.forEach((cb) => cb({ data }));
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') this.onopen?.();
          else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') this.fail();
        });
    } catch {
      this.fail();
    }
  }
}
