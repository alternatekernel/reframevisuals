import { Telegraf } from 'telegraf';
import { prisma } from '../database';
import axios from 'axios';
import { sendChatDiscordNotification } from './discordService';
import { forwardUserToSlack, sendUnattendedChatSlackAlert } from './slackService';
import { broadcastChatEvent } from './chatSseService';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID;
const BASE_URL = process.env.BASE_URL || 'https://reframevisuals.com';

const bot = BOT_TOKEN ? new Telegraf(BOT_TOKEN) : null;

const DIVIDER = '────────────────────';

function adminChatUrl(conversationId: string): string {
  return `${BASE_URL}/admin/chats/${encodeURIComponent(conversationId)}`;
}

export type TelegramTopicKey = 'urgent' | 'orders' | 'payments' | 'leads' | 'chat' | 'system';

const TOPIC_ENV: Record<TelegramTopicKey, string> = {
  urgent: 'TELEGRAM_TOPIC_URGENT_ID',
  orders: 'TELEGRAM_TOPIC_ORDERS_ID',
  payments: 'TELEGRAM_TOPIC_PAYMENTS_ID',
  leads: 'TELEGRAM_TOPIC_LEADS_ID',
  chat: 'TELEGRAM_TOPIC_CHAT_ID',
  system: 'TELEGRAM_TOPIC_SYSTEM_ID',
};

function escapeMarkdown(text: unknown): string {
  return String(text ?? '').replace(/([_*\[`])/g, '\\$1');
}

export function isTelegramConfigured(): boolean {
  return Boolean(bot && ADMIN_CHAT_ID);
}

export function getTelegramTopicId(topic: TelegramTopicKey): number | undefined {
  const raw = process.env[TOPIC_ENV[topic]];
  if (!raw) return undefined;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function getTelegramTopicStatus() {
  return Object.fromEntries(
    (Object.keys(TOPIC_ENV) as TelegramTopicKey[]).map((topic) => [topic, Boolean(getTelegramTopicId(topic))])
  ) as Record<TelegramTopicKey, boolean>;
}

export function isTelegramTopicAllowedForReplies(messageThreadId?: number): boolean {
  const chatTopicId = getTelegramTopicId('chat');
  const urgentTopicId = getTelegramTopicId('urgent');

  // Backwards compatible: if no topic IDs are configured yet, accept replies from the admin group.
  if (!chatTopicId && !urgentTopicId) return true;

  return Boolean(
    messageThreadId &&
    (messageThreadId === chatTopicId || messageThreadId === urgentTopicId)
  );
}

async function sendAdminTelegramMessage(message: string, topic: TelegramTopicKey): Promise<void> {
  if (!bot || !ADMIN_CHAT_ID) return;
  const messageThreadId = getTelegramTopicId(topic);
  await bot.telegram.sendMessage(ADMIN_CHAT_ID, message, {
    parse_mode: 'Markdown',
    link_preview_options: { is_disabled: true },
    ...(messageThreadId ? { message_thread_id: messageThreadId } : {}),
  });
}

/**
 * Fetches detailed location and network data for a given IP address.
 */
export async function getGeoLocation(ip: string): Promise<{ location: string; network: string }> {
  if (!ip || ip === '::1' || ip === '127.0.0.1') {
    return { location: 'Localhost', network: 'Local Network' };
  }
  
  try {
    // Using ipapi.co — free tier, HTTPS-native, no API key required for <1000 req/day (M8 fix)
    const res = await axios.get(`https://ipapi.co/${ip}/json/`, { timeout: 5000 });
    
    if (res.data && !res.data.error) {
      const city = res.data.city || '';
      const region = res.data.region || '';
      const country = res.data.country_name || '';
      const location = [city, region, country].filter(Boolean).join(', ') || 'Unknown Location';
      
      const org = res.data.org || res.data.asn || 'Unknown ISP';
      return { location, network: org };
    }
    return { location: 'Unknown Location', network: 'Unknown Network' };
  } catch {
    return { location: 'Lookup Failed', network: 'Error' };
  }
}

// ─────────────────────────────────────────────────────────────
// Order Notification
// ─────────────────────────────────────────────────────────────

export async function sendOrderTelegramNotification(order: any) {
  if (!bot || !ADMIN_CHAT_ID) return;

  const services = Array.isArray(order.services)
    ? order.services.join(', ')
    : order.services;
  const turnaround = Number(order.turnaround) || 0;
  const volume = Number(order.volume) || 0;
  const isRush = turnaround > 0 && turnaround < 24;
  const title = isRush
    ? `RUSH | ${volume}img | ${turnaround}h`
    : `${volume}img | ${turnaround}h`;
  const customerOrderCount = order.customerOrderCount ?? order.orderCount ?? 'N/A';

  const message = [
    `# [${escapeMarkdown(title)}](${BASE_URL}/admin/orders/${order.orderId})`,
    `Services: ${escapeMarkdown(services || 'N/A')}`,
    ``,
    `Client: ${escapeMarkdown(order.customerName || 'N/A')} (${escapeMarkdown(order.customerCode || 'N/A')})`,
    `Order ID: \`${escapeMarkdown(order.orderId || 'N/A')}\``,
    `Customer Order Count: ${escapeMarkdown(customerOrderCount)}`,
    `Timestamp: ${escapeMarkdown(new Date(order.createdAt || Date.now()).toISOString())}`,
  ].join('\n');

  try {
    await sendAdminTelegramMessage(message, isRush ? 'urgent' : 'orders');
    console.log(`[Telegram] Order alert sent for ${order.orderId}`);
  } catch (err) {
    console.error('[Telegram] Failed to send order alert:', err);
  }
}

// ─────────────────────────────────────────────────────────────
// Inquiry Notification
// ─────────────────────────────────────────────────────────────

export async function sendInquiryTelegramNotification(email: string, metadata?: any) {
  if (!bot || !ADMIN_CHAT_ID) return;

  const type = metadata?.type || 'General Inquiry';
  const name = metadata?.name ? `Name: ${escapeMarkdown(metadata.name)}` : '';
  const desc = metadata?.description ? `Brief: ${escapeMarkdown(metadata.description)}` : '';
  const chatLink = metadata?.conversationId ? `Linked Ticket: ${adminChatUrl(metadata.conversationId)}` : '';

  const message = [
    `# LEAD`,
    `Email: ${escapeMarkdown(email)}`,
    name,
    `Source: ${escapeMarkdown(metadata?.source || type || 'Portal Dashboard')}`,
    desc,
    chatLink,
    metadata?.conversationId ? `Conversation ID: \`${escapeMarkdown(metadata.conversationId)}\`` : '',
    `Timestamp: ${escapeMarkdown(new Date().toISOString())}`,
  ].filter(Boolean).join('\n');

  try {
    await sendAdminTelegramMessage(message, 'leads');
    console.log(`[Telegram] Professional Inquiry alert sent for ${email}`);
  } catch (err) {
    console.error('[Telegram] Failed to send inquiry alert:', err);
  }
}

// ─────────────────────────────────────────────────────────────
// Payment Notification
// ─────────────────────────────────────────────────────────────

export async function sendPaymentTelegramNotification(orderId: string, amount: number, customerEmail: string) {
  if (!bot || !ADMIN_CHAT_ID) return;

  const message = [
    `# PAID`,
    `Client: ${escapeMarkdown(customerEmail || 'N/A')}`,
    `Amount: USD ${Number(amount || 0).toFixed(2)}`,
    `Order ID: \`${escapeMarkdown(orderId)}\``,
    `Order Link: ${BASE_URL}/admin/orders/${orderId}`,
    `Timestamp: ${escapeMarkdown(new Date().toISOString())}`,
  ].join('\n');

  try {
    await sendAdminTelegramMessage(message, 'payments');
    console.log(`[Telegram] Payment alert sent for order ${orderId}`);
  } catch (err) {
    console.error('[Telegram] Failed to send payment alert:', err);
  }
}

// ─────────────────────────────────────────────────────────────
// Customer Signup Notification
// ─────────────────────────────────────────────────────────────

export async function sendSignupTelegramNotification(customer: {
  id?: string;
  name?: string | null;
  email: string;
  customerCode?: string;
  customerNumber?: number | null;
  source?: string;
  location?: string;
  ip?: string;
  vpnDetected?: boolean;
  vpnProvider?: string;
  createdAt?: Date | string;
}) {
  if (!bot || !ADMIN_CHAT_ID) return;

  const customerCode = customer.customerCode || (customer.customerNumber ? `CLT${String(customer.customerNumber).padStart(3, '0')}` : 'N/A');
  const vpn = customer.vpnDetected ? `Detected${customer.vpnProvider ? ` (${customer.vpnProvider})` : ''}` : 'Not Detected';
  const message = [
    `# SIGNUP`,
    `Client: ${escapeMarkdown(customer.name || 'Unnamed')} (${escapeMarkdown(customerCode)})`,
    `Email: ${escapeMarkdown(customer.email)}`,
    `Location: ${escapeMarkdown(customer.location || 'N/A')}`,
    `IP Address: \`${escapeMarkdown(customer.ip || 'N/A')}\``,
    `VPN/Proxy: ${escapeMarkdown(vpn)}`,
    `Source: ${escapeMarkdown(customer.source || 'Customer portal signup')}`,
    `Profile: ${BASE_URL}/admin/customers${customer.id ? `/${customer.id}` : ''}`,
    `Customer ID: \`${escapeMarkdown(customer.id || 'N/A')}\``,
    `Timestamp: ${escapeMarkdown(new Date(customer.createdAt || Date.now()).toISOString())}`,
  ].join('\n');

  try {
    await sendAdminTelegramMessage(message, 'leads');
    console.log(`[Telegram] Signup alert sent for ${customer.email}`);
  } catch (err) {
    console.error('[Telegram] Failed to send signup alert:', err);
  }
}

// ─────────────────────────────────────────────────────────────
// Customer Login Notification
// ─────────────────────────────────────────────────────────────

export async function sendLoginTelegramNotification(customer: {
  id?: string;
  name?: string | null;
  email: string;
  customerCode?: string;
  role?: string;
  source?: string;
  ip?: string;
  createdAt?: Date | string;
}) {
  if (!bot || !ADMIN_CHAT_ID) return;

  const message = [
    `# LOGIN`,
    `Client: ${escapeMarkdown(customer.name || 'Unnamed')}`,
    `Email: ${escapeMarkdown(customer.email)}`,
    customer.customerCode ? `Code: \`${escapeMarkdown(customer.customerCode)}\`` : '',
    customer.role ? `Role: ${escapeMarkdown(customer.role)}` : '',
    `Source: ${escapeMarkdown(customer.source || 'Login')}`,
    customer.ip ? `IP Address: \`${escapeMarkdown(customer.ip)}\`` : '',
    `Profile: ${BASE_URL}/admin/customers${customer.id ? `/${customer.id}` : ''}`,
    `Timestamp: ${escapeMarkdown(new Date(customer.createdAt || Date.now()).toISOString())}`,
  ].filter(Boolean).join('\n');

  try {
    await sendAdminTelegramMessage(message, 'system');
    console.log(`[Telegram] Login alert sent for ${customer.email}`);
  } catch (err) {
    console.error('[Telegram] Failed to send login alert:', err);
  }
}

// ─────────────────────────────────────────────────────────────
// Platform Test Notification
// ─────────────────────────────────────────────────────────────

export async function sendTelegramTestNotification(triggeredBy?: string, topic: TelegramTopicKey = 'system') {
  if (!bot || !ADMIN_CHAT_ID) {
    throw new Error('Telegram is not configured. Missing TELEGRAM_BOT_TOKEN or TELEGRAM_ADMIN_CHAT_ID.');
  }

  const message = [
    `*TELEGRAM NOTIFICATIONS TEST*`,
    DIVIDER,
    `Status : Connected`,
    `Topic  : ${topic}`,
    `Source : Reframe Visual platform`,
    triggeredBy ? `User   : ${escapeMarkdown(triggeredBy)}` : '',
    `Time   : ${new Date().toISOString()}`,
  ].filter(Boolean).join('\n');

  await sendAdminTelegramMessage(message, topic);
}

// ─────────────────────────────────────────────────────────────
// Unattended Chat Alert
// ─────────────────────────────────────────────────────────────

export async function sendUnattendedChatTelegramAlert(conversationId: string, waitSeconds: number = 45) {
  // Slack fan-out is independent of Telegram configuration.
  sendUnattendedChatSlackAlert(conversationId, waitSeconds)
    .catch((err) => console.error('[Slack] Unattended chat alert failed:', err?.message || err));

  if (!bot || !ADMIN_CHAT_ID) return;

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: { customer: true }
  });

  if (!conversation) return;

  const customer = conversation.customer as any;
  const customerLabel = customer?.customerNumber
    ? `CLT${String(customer.customerNumber).padStart(3, '0')}`
    : (customer?.isGuest ? 'GUEST' : 'CUSTOMER');

  const message = [
    `*CUSTOMER WAITING ${waitSeconds}s*`,
    DIVIDER,
    `Client : ${escapeMarkdown(customer?.name || 'Guest')}`,
    `Label  : ${escapeMarkdown(customerLabel)}`,
    `Ticket : [Open Chat Ticket](${adminChatUrl(conversationId)})`,
    DIVIDER,
    `_No admin reply has been sent after the latest customer message._`,
  ].join('\n');

  await sendAdminTelegramMessage(message, 'chat');
}

// ─────────────────────────────────────────────────────────────
// User Message → Telegram
// ─────────────────────────────────────────────────────────────

export async function forwardUserToTelegram(
  conversationId: string,
  userMessage: string,
  customerCode?: string,
  geoInfo?: { ip: string; location: string; network: string }
) {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: { customer: true }
  });

  if (!conversation) {
    console.warn(`[Telegram] Conversation not found for ${conversationId}`);
    return;
  }

  const customer = conversation.customer as any;
  const isGuest = customer.isGuest;
  
  // Decide which thread to use: Customer-level for members, Conversation-level for guests
  const existingThreadId = isGuest ? conversation.telegramThreadId : customer.telegramThreadId;

  const clientLabel = customerCode ||
    `CLT${String(customer.customerNumber || '???').padStart(3, '0')}`;

  const isNewThread = !existingThreadId;

  let message: string;

  if (isNewThread) {
    // First message in the thread — include full header
    message = [
      `# ${isGuest ? 'GUEST' : 'CHAT'}`,
      `Client: ${escapeMarkdown(customer.name || 'Guest')} (${escapeMarkdown(clientLabel)})`,
      `Message: ${escapeMarkdown(userMessage)}`,
      `Location: ${escapeMarkdown(geoInfo?.location || 'Unknown')}`,
      `Network: ${escapeMarkdown(geoInfo?.network || 'Unknown')}`,
      `Ticket: ${adminChatUrl(conversationId)}`,
      `Conversation ID: \`${escapeMarkdown(conversationId)}\``,
      `Timestamp: ${escapeMarkdown(new Date().toISOString())}`,
    ].join('\n');
  } else {
    // Follow-up message — keep it concise
    message = [
      `# ${isGuest ? 'GUEST' : 'CHAT'}`,
      `Client: ${escapeMarkdown(customer.name || 'Guest')} (${escapeMarkdown(clientLabel)})`,
      `Message: ${escapeMarkdown(userMessage)}`,
      `Ticket: ${adminChatUrl(conversationId)}`,
      `Conversation ID: \`${escapeMarkdown(conversationId)}\``,
      `Timestamp: ${escapeMarkdown(new Date().toISOString())}`,
    ].join('\n');
  }

  try {
    sendChatDiscordNotification({
      conversationId,
      userMessage,
      customerName: customer.name,
      customerCode: clientLabel,
      isGuest,
      geoInfo,
    }).catch((err) => console.error('[Discord] Chat notification failed:', err?.message || err));

    forwardUserToSlack(conversationId, userMessage, clientLabel, geoInfo)
      .catch((err) => console.error('[Slack] Chat notification failed:', err?.message || err));

    if (!bot || !ADMIN_CHAT_ID) {
      console.warn('[Telegram] Chat notification skipped: missing TELEGRAM_BOT_TOKEN or TELEGRAM_ADMIN_CHAT_ID.');
      return;
    }

    const chatTopicId = getTelegramTopicId('chat');
    const messageOptions: any = {
      parse_mode: 'Markdown',
      ...(chatTopicId ? { message_thread_id: chatTopicId } : {}),
    };

    if (existingThreadId) {
      messageOptions.reply_parameters = {
        message_id: parseInt(existingThreadId)
      };
    }

    const sentMsg = await bot.telegram.sendMessage(
      ADMIN_CHAT_ID,
      message,
      messageOptions
    );

    console.log(`[Telegram] Chat alert sent for conversation ${conversationId}`);

    // Store message ID for reply matching
    await prisma.message.updateMany({
      where: { conversationId, role: 'user', content: userMessage },
      data: { telegramMessageId: String(sentMsg.message_id) }
    });

    // Save the thread ID if this is the first message
    if (isNewThread) {
      if (isGuest) {
        await prisma.conversation.update({
          where: { id: conversationId },
          data: { telegramThreadId: String(sentMsg.message_id) }
        });
      } else {
        await prisma.customer.update({
          where: { id: customer.id },
          data: { telegramThreadId: String(sentMsg.message_id) }
        });
      }
    }
  } catch (err) {
    console.error('[Telegram] Failed to forward user message:', err);
  }
}

// ─────────────────────────────────────────────────────────────
// Admin Telegram Reply → DB (called by webhook)
// ─────────────────────────────────────────────────────────────

export async function sendAdminReplyToUser(
  conversationId: string,
  text: string,
  source: string = 'telegram',
  attachments?: Array<{ url: string; filename: string; type?: string }>,
  slackMeta?: { slackMessageTs: string; slackChannel: string }
): Promise<any | null> {
  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId }
    });
    if (!conversation) return null;

    const meta: Record<string, any> = { isHuman: true, source };
    if (attachments && attachments.length > 0) meta.attachments = attachments;
    if (slackMeta?.slackChannel) meta.slackChannel = slackMeta.slackChannel;

    const savedMessage = await prisma.message.create({
      data: {
        conversationId,
        role: 'assistant',
        content: text || (attachments?.length ? `Sent ${attachments.length} file(s)` : ''),
        status: 'sent',
        metadata: JSON.stringify(meta),
        ...(slackMeta?.slackMessageTs ? { slackMessageTs: slackMeta.slackMessageTs } : {}),
      }
    });

    // Silence AI — mark conversation as escalated
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { isEscalated: true }
    });

    // Push the admin reply to any active SSE subscribers (customer chat widget)
    broadcastChatEvent(conversationId, 'new_message', { message: savedMessage });

    console.log(`[Telegram] Admin reply saved for conversation ${conversationId}`);
    return savedMessage;
  } catch (err) {
    console.error('[Telegram] Failed to save admin reply:', err);
    return null;
  }
}

export default bot;


export async function sendFeedbackTelegramNotification(feedback: {
  type: string;
  subject: string;
  message: string;
  email: string;
  url?: string;
}) {
  if (!bot || !ADMIN_CHAT_ID) return;

  const message = [
    `# FEEDBACK`,
    `Type: ${escapeMarkdown(String(feedback.type || 'other').toUpperCase())}`,
    `Subject: ${escapeMarkdown(feedback.subject)}`,
    `Sender: ${escapeMarkdown(feedback.email)}`,
    feedback.url ? `Page URL: \`${escapeMarkdown(feedback.url)}\`` : '',
    `Message: ${escapeMarkdown(feedback.message)}`,
    `Timestamp: ${escapeMarkdown(new Date().toISOString())}`,
  ].filter(Boolean).join('\n');

  await sendAdminTelegramMessage(message, 'system');
}
