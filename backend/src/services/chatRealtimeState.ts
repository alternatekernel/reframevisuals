// Typing / seen state persisted in Postgres so it survives across serverless instances.
import { prisma } from '../database';

type TypingRole = 'customer' | 'support';
const TYPING_TTL_MS = 8000;

const upsert = (conversationId: string, role: TypingRole, data: { typingAt?: Date | null; seenMessageId?: string; seenAt?: Date }) =>
  prisma.chatPresence.upsert({
    where: { conversationId_role: { conversationId, role } },
    create: { conversationId, role, ...data },
    update: data,
  }).catch((err) => console.error('[ChatPresence] write failed:', err?.message || err));

export const setTypingState = (conversationId: string, role: TypingRole, isTyping: boolean) =>
  upsert(conversationId, role, { typingAt: isTyping ? new Date() : null });

export const setCustomerSeenState = (conversationId: string, messageId: string) =>
  upsert(conversationId, 'customer', { seenMessageId: messageId, seenAt: new Date() });

export const setSupportSeenState = (conversationId: string, messageId: string) =>
  upsert(conversationId, 'support', { seenMessageId: messageId, seenAt: new Date() });

export const getConversationRealtimeState = async (conversationId: string) => {
  const rows = await prisma.chatPresence.findMany({ where: { conversationId } }).catch(() => []);
  const byRole = (role: TypingRole) => rows.find((r) => r.role === role);
  const typing = (role: TypingRole) => {
    const at = byRole(role)?.typingAt;
    return Boolean(at && Date.now() - at.getTime() <= TYPING_TTL_MS);
  };
  const seen = (role: TypingRole) => {
    const r = byRole(role);
    return r?.seenMessageId && r.seenAt ? { messageId: r.seenMessageId, seenAt: r.seenAt.getTime() } : null;
  };
  return {
    customerTyping: typing('customer'),
    supportTyping: typing('support'),
    customerSeen: seen('customer'),
    supportSeen: seen('support'),
  };
};
