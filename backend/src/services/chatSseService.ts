// Chat events now go out through Supabase Realtime (see realtimeService). Kept as a thin
// wrapper so existing call sites don't change.
import { publishRealtime } from './realtimeService';

export function broadcastChatEvent(
  conversationId: string,
  eventType: string,
  data: Record<string, any>
): void {
  publishRealtime('chat', conversationId, eventType, data);
}
