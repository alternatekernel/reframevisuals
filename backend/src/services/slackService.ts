import { prisma } from '../database';

// ─────────────────────────────────────────────────────────────
// Unified Slack Bot
//
// Two channels only:
//   SLACK_CHANNEL_CUSTOMERS (C0BHMFAGQV6) — live chat + support tickets
//   SLACK_CHANNEL_OPS       (C0BGERF0W5R) — orders, payments, leads, logins, system
//
// The `customers` topic is two-way: admins reply in-thread and the reply
// is routed back to the customer by slackRoutes → sendAdminReplyToUser.
// ─────────────────────────────────────────────────────────────

export type SlackTopicKey = 'customers' | 'ops' | 'system';

const BASE_URL = process.env.BASE_URL || 'https://reframevisuals.com';
const SLACK_POST_URL = 'https://slack.com/api/chat.postMessage';

// ─────────────────────────────────────────────────────────────
// Config helpers
// ─────────────────────────────────────────────────────────────

function getBotToken(): string | undefined {
  return process.env.SLACK_BOT_TOKEN || undefined;
}

/**
 * Resolve the channel ID for a topic with fallback to SLACK_DEFAULT_CHANNEL.
 * Supports:
 * - customers: SLACK_CHANNEL_CUSTOMERS -> SLACK_DEFAULT_CHANNEL -> SLACK_CHANNEL -> SLACK_CHANNEL_OPS -> fallback
 * - ops/system: SLACK_CHANNEL_OPS -> SLACK_DEFAULT_CHANNEL -> SLACK_CHANNEL -> SLACK_CHANNEL_CUSTOMERS -> fallback
 */
export function getSlackChannel(topic: SlackTopicKey | string = 'customers'): string | undefined {
  const norm = String(topic || '').toLowerCase().trim();
  const defaultChannel = process.env.SLACK_DEFAULT_CHANNEL || process.env.SLACK_CHANNEL || process.env.SLACK_CHANNEL_ID;

  let channel: string | undefined;
  if (norm === 'customers') {
    channel = process.env.SLACK_CHANNEL_CUSTOMERS || defaultChannel || process.env.SLACK_CHANNEL_OPS || 'C0BHMFAGQV6';
  } else if (norm === 'ops' || norm === 'system') {
    channel = process.env.SLACK_CHANNEL_OPS || defaultChannel || process.env.SLACK_CHANNEL_CUSTOMERS || 'C0BGERF0W5R';
  } else {
    channel = defaultChannel || process.env.SLACK_CHANNEL_CUSTOMERS || process.env.SLACK_CHANNEL_OPS;
  }

  return channel ? channel.trim() : undefined;
}

export function isSlackConfigured(): boolean {
  return Boolean(getBotToken() && (getSlackChannel('customers') || getSlackChannel('ops')));
}

const channelIdCache = new Map<string, string>();

/**
 * Clean a channel string and resolve channel names (e.g. '#general' or 'customers')
 * to actual Slack channel IDs (e.g. 'C0123456789') via conversations.list when needed.
 */
export async function resolveSlackChannelId(channelOrName: string): Promise<string> {
  if (!channelOrName) return channelOrName;
  const raw = channelOrName.trim();

  // If it already looks like a Slack ID (C/D/G/U followed by alphanumeric), strip # and return
  const stripped = raw.replace(/^#/, '').trim();
  if (/^[CDGU][A-Z0-9]{8,14}$/i.test(stripped)) {
    return stripped.toUpperCase();
  }

  // Check memory cache
  const cached = channelIdCache.get(stripped.toLowerCase());
  if (cached) return cached;

  const token = getBotToken();
  if (!token) return stripped;

  try {
    const res = await fetch('https://slack.com/api/conversations.list?types=public_channel,private_channel&limit=200', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data: any = await res.json().catch(() => ({}));
    if (data.ok && Array.isArray(data.channels)) {
      for (const ch of data.channels) {
        if (ch.id && ch.name) {
          channelIdCache.set(ch.name.toLowerCase(), ch.id);
        }
      }
      const found = channelIdCache.get(stripped.toLowerCase());
      if (found) return found;
    }
  } catch (err) {
    console.warn('[Slack] Failed to resolve channel name via conversations.list:', err);
  }

  return stripped;
}

/**
 * Attempt to join a public Slack channel if not_in_channel error is encountered.
 */
async function tryJoinSlackChannel(token: string, channelId: string): Promise<boolean> {
  try {
    const res = await fetch('https://slack.com/api/conversations.join', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ channel: channelId }),
    });
    const data: any = await res.json().catch(() => ({}));
    if (data.ok) {
      console.log(`[Slack] Successfully joined channel ${channelId}`);
      return true;
    }
    console.warn(`[Slack] conversations.join for ${channelId} returned:`, data.error);
    return false;
  } catch (err) {
    console.error(`[Slack] Failed to join channel ${channelId}:`, err);
    return false;
  }
}

// ─────────────────────────────────────────────────────────────
// Formatting helpers
// ─────────────────────────────────────────────────────────────

/** Strip HTML tags and decode common entities for plain-text Slack display. */
function stripHtml(html: unknown): string {
  return String(html ?? '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function findQuoteStart(text: string): number {
  return text.search(
    /^(On .{5,120}\n?.*wrote:\s*$|[-_]{3,}[\s\S]*?(?:Original|Forwarded) Message|From:\s.+\nSent:\s|>{1})/im
  );
}

/**
 * Remove quoted email history so only the new message is shown.
 */
function stripEmailQuotes(text: string): string {
  if (!text) return text;
  const cutAt = findQuoteStart(text);
  const clean = cutAt > 0 ? text.slice(0, cutAt) : text;
  return clean.replace(/\n{3,}/g, '\n\n').trim();
}

/**
 * Return the quoted email history portion (everything stripped by stripEmailQuotes).
 */
function extractEmailQuote(text: string): string {
  if (!text) return '';
  const cutAt = findQuoteStart(text);
  if (cutAt <= 0) return '';
  return text.slice(cutAt).replace(/\n{3,}/g, '\n\n').trim();
}

/** Escape the three characters Slack mrkdwn treats specially. */
function esc(value: unknown): string {
  return String(value ?? 'N/A')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** Truncate a pre-formatted mrkdwn string (links, code spans). Never escapes. */
function truncate(value: unknown, max = 1800): string {
  const text = String(value ?? 'N/A');
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

/** Escape + truncate raw user-provided text (names, messages, emails). */
function escTrunc(value: unknown, max = 1800): string {
  return truncate(esc(value), max);
}

function link(url: string, label: string): string {
  return `<${url}|${esc(label)}>`;
}

function adminChatUrl(conversationId: string): string {
  return `${BASE_URL}/admin/chats/${encodeURIComponent(conversationId)}`;
}

function toNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function isRushTurnaround(turnaround: unknown): boolean {
  const hours = toNumber(turnaround);
  return hours > 0 && hours < 24;
}

interface SlackField {
  label: string;
  value: string;
}

/**
 * Build a Block Kit message from a simple title/fields description so every
 * notification looks consistent (the Slack analogue of a Discord embed).
 */
function buildBlocks(opts: {
  title: string;
  titleUrl?: string;
  description?: string;
  fields?: SlackField[];
  footer?: string;
}): any[] {
  const blocks: any[] = [
    { type: 'header', text: { type: 'plain_text', text: opts.title.slice(0, 150), emoji: true } },
  ];

  const introParts: string[] = [];
  if (opts.titleUrl) introParts.push(link(opts.titleUrl, 'Open in admin ↗'));
  if (opts.description) introParts.push(truncate(opts.description, 2900));
  if (introParts.length) {
    blocks.push({ type: 'section', text: { type: 'mrkdwn', text: introParts.join('\n') } });
  }

  const fields = (opts.fields || []).filter((f) => f && f.value);
  // Slack allows a maximum of 10 fields per section.
  for (let i = 0; i < fields.length; i += 10) {
    blocks.push({
      type: 'section',
      fields: fields.slice(i, i + 10).map((f) => ({
        type: 'mrkdwn',
        text: `*${esc(f.label)}*\n${truncate(f.value)}`,
      })),
    });
  }

  if (opts.footer) {
    blocks.push({ type: 'context', elements: [{ type: 'mrkdwn', text: truncate(opts.footer, 300) }] });
  }

  return blocks;
}

// ─────────────────────────────────────────────────────────────
// Core sender
// ─────────────────────────────────────────────────────────────

export interface SlackPostResult {
  ok: boolean;
  ts?: string;
  channel?: string;
  error?: string;
}

/**
 * Post a message via the unified bot. Returns null when Slack is not
 * configured (matching the no-op behavior of the other providers).
 */
export async function postSlack(
  topic: SlackTopicKey,
  opts: { text: string; blocks?: any[]; threadTs?: string; replyBroadcast?: boolean }
): Promise<SlackPostResult | null> {
  const token = getBotToken();
  const rawChannel = getSlackChannel(topic);
  if (!token || !rawChannel) {
    console.warn(`[Slack] Cannot post to "${topic}": missing token or channel.`);
    return null;
  }

  const channel = await resolveSlackChannelId(rawChannel);

  try {
    const payload: any = {
      channel,
      text: opts.text,
      ...(opts.blocks ? { blocks: opts.blocks } : {}),
      ...(opts.threadTs ? { thread_ts: opts.threadTs } : {}),
      ...(opts.replyBroadcast ? { reply_broadcast: true } : {}),
      unfurl_links: false,
      unfurl_media: false,
    };

    let res = await fetch(SLACK_POST_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    let data: any = await res.json().catch(() => ({}));

    // Auto-join if bot is not in the channel (public channels)
    if (!data.ok && data.error === 'not_in_channel') {
      const joined = await tryJoinSlackChannel(token, channel);
      if (joined) {
        res = await fetch(SLACK_POST_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
        data = await res.json().catch(() => ({}));
      }
    }

    // If thread was not found (e.g. stale thread or channel migrated), retry as new channel message
    if (!data.ok && data.error === 'thread_not_found' && payload.thread_ts) {
      console.warn(`[Slack] Thread ${payload.thread_ts} not found in ${channel}. Retrying as top-level message.`);
      delete payload.thread_ts;
      delete payload.reply_broadcast;
      res = await fetch(SLACK_POST_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      data = await res.json().catch(() => ({}));
    }

    if (!data.ok) {
      console.error(`[Slack] ${topic} postMessage failed:`, data.error || res.status, `(channel: ${channel})`);
      return { ok: false, error: data.error || `http_${res.status}`, channel };
    }
    console.log(`[Slack] ${topic} notification sent to ${channel}.`);
    return { ok: true, ts: data.ts, channel: data.channel || channel };
  } catch (err: any) {
    console.error(`[Slack] Failed to send ${topic} notification:`, err?.message || err);
    return null;
  }
}

/**
 * Post directly to a known channel ID, bypassing topic resolution.
 * Use this when you already know which channel to reply into (e.g. event.channel).
 */
export async function postSlackRaw(
  channelId: string,
  opts: { text: string; blocks?: any[]; threadTs?: string }
): Promise<SlackPostResult | null> {
  const token = getBotToken();
  if (!token || !channelId) return null;

  const channel = await resolveSlackChannelId(channelId);

  try {
    const payload: any = {
      channel,
      text: opts.text,
      ...(opts.blocks ? { blocks: opts.blocks } : {}),
      ...(opts.threadTs ? { thread_ts: opts.threadTs } : {}),
      unfurl_links: false,
      unfurl_media: false,
    };

    let res = await fetch(SLACK_POST_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    let data: any = await res.json().catch(() => ({}));

    if (!data.ok && data.error === 'not_in_channel') {
      const joined = await tryJoinSlackChannel(token, channel);
      if (joined) {
        res = await fetch(SLACK_POST_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
        data = await res.json().catch(() => ({}));
      }
    }

    if (!data.ok && data.error === 'thread_not_found' && payload.thread_ts) {
      console.warn(`[Slack] Thread ${payload.thread_ts} not found in ${channel}. Retrying as top-level message.`);
      delete payload.thread_ts;
      res = await fetch(SLACK_POST_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      data = await res.json().catch(() => ({}));
    }

    if (!data.ok) {
      console.error(`[Slack] postSlackRaw to ${channel} failed:`, data.error || res.status);
      return { ok: false, error: data.error || `http_${res.status}`, channel };
    }
    return { ok: true, ts: data.ts, channel: data.channel || channel };
  } catch (err: any) {
    console.error(`[Slack] postSlackRaw to ${channel} failed:`, err?.message || err);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────
// Order Notification
// ─────────────────────────────────────────────────────────────

export async function sendOrderSlackNotification(order: any): Promise<void> {
  const services = Array.isArray(order.services) ? order.services.join(', ') : order.services;
  const rush = isRushTurnaround(order.turnaround);
  const title = rush
    ? `⚡ RUSH | ${toNumber(order.volume)}img | ${toNumber(order.turnaround)}h`
    : `Order | ${toNumber(order.volume)}img | ${toNumber(order.turnaround)}h`;
  const customerOrderCount = order.customerOrderCount ?? order.orderCount ?? 'N/A';

  await postSlack('ops', {
    text: title,
    blocks: buildBlocks({
      title,
      titleUrl: `${BASE_URL}/admin/orders/${order.orderId}`,
      description: `*Services:* ${escTrunc(services || 'N/A', 400)}`,
      fields: [
        { label: 'Client', value: `${escTrunc(order.customerName || 'N/A')}\n${escTrunc(order.customerCode || order.customerEmail || 'N/A')}` },
        { label: 'Order ID', value: `\`${order.orderId || 'N/A'}\`` },
        { label: 'Customer Order Count', value: String(customerOrderCount) },
        ...(order.dropboxLink ? [{ label: 'Files', value: link(order.dropboxLink, 'View in Dropbox') }] : []),
      ],
      footer: new Date(order.createdAt || Date.now()).toISOString(),
    }),
  });
}

// ─────────────────────────────────────────────────────────────
// Payment Notification
// ─────────────────────────────────────────────────────────────

export async function sendPaymentSlackNotification(orderId: string, amount: number, customerEmail: string): Promise<void> {
  await postSlack('ops', {
    text: `PAID $${Number(amount || 0).toFixed(2)}`,
    blocks: buildBlocks({
      title: `💰 PAID | $${Number(amount || 0).toFixed(2)}`,
      titleUrl: `${BASE_URL}/admin/orders/${orderId}`,
      fields: [
        { label: 'Amount', value: `$${Number(amount || 0).toFixed(2)}` },
        { label: 'Customer', value: esc(customerEmail) },
        { label: 'Order ID', value: `\`${orderId}\`` },
      ],
      footer: new Date().toISOString(),
    }),
  });
}

export async function sendPaymentFailureSlackNotification(orderId: string, amount: number, customerEmail: string): Promise<void> {
  await postSlack('ops', {
    text: `Payment failed / expired for ${customerEmail}`,
    blocks: buildBlocks({
      title: '❌ Payment Failed / Expired',
      titleUrl: `${BASE_URL}/admin/orders/${orderId}`,
      fields: [
        { label: 'Amount', value: `$${Number(amount || 0).toFixed(2)}` },
        { label: 'Customer', value: esc(customerEmail) },
        { label: 'Order ID', value: `\`${orderId}\`` },
        { label: 'Status', value: 'Failed / Expired' },
      ],
      footer: new Date().toISOString(),
    }),
  });
}

// ─────────────────────────────────────────────────────────────
// Inquiry / Lead Notification
// ─────────────────────────────────────────────────────────────

export async function sendInquirySlackNotification(email: string, metadata?: any): Promise<void> {
  await postSlack('ops', {
    text: `New lead: ${email}`,
    blocks: buildBlocks({
      title: '📥 LEAD',
      fields: [
        { label: 'Email', value: `\`${esc(email)}\`` },
        { label: 'Source', value: esc(metadata?.source || metadata?.type || 'Portal Dashboard') },
        ...(metadata?.name ? [{ label: 'Name', value: esc(metadata.name) }] : []),
        ...(metadata?.description ? [{ label: 'Brief', value: escTrunc(metadata.description) }] : []),
        ...(metadata?.conversationId ? [{ label: 'Linked Chat Ticket', value: link(adminChatUrl(metadata.conversationId), 'Open Chat Ticket') }] : []),
      ],
      footer: new Date().toISOString(),
    }),
  });
}

// ─────────────────────────────────────────────────────────────
// Signup Notification
// ─────────────────────────────────────────────────────────────

export async function sendSignupSlackNotification(customer: {
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
}): Promise<void> {
  const customerCode = customer.customerCode || (customer.customerNumber ? `CLT${String(customer.customerNumber).padStart(3, '0')}` : 'N/A');
  const vpn = customer.vpnDetected ? `Detected${customer.vpnProvider ? ` (${customer.vpnProvider})` : ''}` : 'Not Detected';

  await postSlack('ops', {
    text: `New signup: ${customer.email}`,
    blocks: buildBlocks({
      title: '🎉 SIGNUP',
      titleUrl: `${BASE_URL}/admin/customers${customer.id ? `/${customer.id}` : ''}`,
      fields: [
        { label: 'Client', value: `${escTrunc(customer.name || 'Unnamed')}\n${esc(customerCode)}` },
        { label: 'Email', value: esc(customer.email) },
        { label: 'Location', value: escTrunc(customer.location || 'N/A') },
        { label: 'IP Address', value: `\`${esc(customer.ip || 'N/A')}\`` },
        { label: 'VPN/Proxy', value: esc(vpn) },
        { label: 'Source', value: esc(customer.source || 'Customer portal signup') },
      ],
      footer: new Date(customer.createdAt || Date.now()).toISOString(),
    }),
  });
}

// ─────────────────────────────────────────────────────────────
// Login Notification
// ─────────────────────────────────────────────────────────────

export async function sendLoginSlackNotification(customer: {
  id?: string;
  name?: string | null;
  email: string;
  customerCode?: string;
  role?: string;
  source?: string;
  ip?: string;
  createdAt?: Date | string;
}): Promise<void> {
  await postSlack('ops', {
    text: `Login: ${customer.email}`,
    blocks: buildBlocks({
      title: '🔐 LOGIN',
      titleUrl: `${BASE_URL}/admin/customers${customer.id ? `/${customer.id}` : ''}`,
      fields: [
        { label: 'Customer', value: `${escTrunc(customer.name || 'Unnamed')}\n${esc(customer.email)}` },
        ...(customer.customerCode ? [{ label: 'Customer Code', value: `\`${esc(customer.customerCode)}\`` }] : []),
        ...(customer.role ? [{ label: 'Role', value: esc(customer.role) }] : []),
        { label: 'Source', value: esc(customer.source || 'Login') },
        ...(customer.ip ? [{ label: 'IP', value: `\`${esc(customer.ip)}\`` }] : []),
      ],
      footer: new Date(customer.createdAt || Date.now()).toISOString(),
    }),
  });
}

// ─────────────────────────────────────────────────────────────
// Feedback Notification
// ─────────────────────────────────────────────────────────────

export async function sendFeedbackSlackNotification(feedback: {
  type: string;
  subject: string;
  message: string;
  email: string;
  url?: string;
  screenResolution?: string;
}): Promise<void> {
  await postSlack('ops', {
    text: `Feedback: ${feedback.subject}`,
    blocks: buildBlocks({
      title: `📝 FEEDBACK | ${String(feedback.type || 'other').toUpperCase()}`,
      fields: [
        { label: 'Subject', value: escTrunc(feedback.subject) },
        { label: 'Email', value: esc(feedback.email) },
        ...(feedback.url ? [{ label: 'Page URL', value: `\`${esc(feedback.url)}\`` }] : []),
        ...(feedback.screenResolution ? [{ label: 'Resolution', value: `\`${esc(feedback.screenResolution)}\`` }] : []),
        { label: 'Message', value: escTrunc(feedback.message) },
      ],
      footer: new Date().toISOString(),
    }),
  });
}

// ─────────────────────────────────────────────────────────────
// Two-way Live Chat
// ─────────────────────────────────────────────────────────────

/**
 * Forward a customer chat message to the Slack chat channel. Threads by
 * customer for members and by conversation for guests, mirroring the
 * Telegram behavior. Stores the anchor ts so admin thread replies can be
 * routed back to the right conversation.
 */
export async function forwardUserToSlack(
  conversationId: string,
  userMessage: string,
  customerCode?: string,
  geoInfo?: { ip: string; location: string; network: string },
  attachments?: Array<{ url: string; filename: string; type?: string }>
): Promise<void> {
  if (!isSlackConfigured() || !getSlackChannel('customers')) return;

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: { customer: true },
  });
  if (!conversation) return;

  const customer = conversation.customer as any;
  const isGuest = customer.isGuest;
  const existingThreadTs = isGuest ? conversation.slackThreadTs : customer.slackThreadTs;

  const clientLabel = customerCode || `CLT${String(customer.customerNumber || '???').padStart(3, '0')}`;
  const isNewThread = !existingThreadTs;

  let result;
  if (isNewThread) {
    const customerEmail = customer.email && !customer.email.includes('@reframe.internal')
      ? customer.email
      : null;
    const fields: SlackField[] = [
      { label: 'Type', value: isGuest ? 'Guest' : `Member (${esc(clientLabel)})` },
      { label: 'Name', value: escTrunc(customer.name || 'Unknown') },
      ...(customerEmail ? [{ label: 'Email', value: esc(customerEmail) }] : []),
      { label: 'Guest ID', value: `\`${esc(customer.id)}\`` },
      { label: 'Message', value: escTrunc(userMessage) },
      { label: 'Location', value: escTrunc(geoInfo?.location || 'Unknown') },
      { label: 'Network', value: escTrunc(geoInfo?.network || 'Unknown') },
      ...(geoInfo?.ip ? [{ label: 'IP', value: `\`${esc(geoInfo.ip)}\`` }] : []),
      { label: 'Chat Ticket', value: link(adminChatUrl(conversationId), 'Open Chat Ticket') },
    ];

    result = await postSlack('customers', {
      text: `${isGuest ? 'Guest' : 'Chat'} — ${customer.name || 'Guest'}: ${userMessage}`.slice(0, 250),
      blocks: buildBlocks({
        title: isGuest ? '👤 GUEST' : '💬 CHAT',
        fields,
        footer: `Reply in this thread to respond to the customer • ${new Date().toISOString()}`,
      }),
    });
  } else {
    // Append simple thread reply for follow-up messages
    const hasFiles = attachments && attachments.length > 0;
    const fileBlocks: any[] = hasFiles ? attachments!.map(a => {
      const isImage = a.type?.startsWith('image/') || /\.(png|jpe?g|gif|webp|tiff?)$/i.test(a.filename);
      if (isImage) {
        return { type: 'image', image_url: a.url, alt_text: esc(a.filename) };
      }
      return { type: 'section', text: { type: 'mrkdwn', text: `📎 <${a.url}|${esc(a.filename)}>` } };
    }) : [];

    result = await postSlack('customers', {
      text: `*${escTrunc(customer.name || 'Guest')}:* ${userMessage}`,
      blocks: [
        { type: 'section', text: { type: 'mrkdwn', text: `*${escTrunc(customer.name || 'Guest')}:* ${escTrunc(userMessage)}` } },
        ...fileBlocks,
      ],
      threadTs: existingThreadTs,
      replyBroadcast: true,
    });
  }

  if (!result?.ok || !result.ts) return;

  // Track the per-message ts for parity with Telegram.
  await prisma.message.updateMany({
    where: { conversationId, role: 'user', content: userMessage },
    data: { slackMessageTs: result.ts },
  });

  // Persist the thread anchor on first message.
  if (isNewThread) {
    if (isGuest) {
      await prisma.conversation.update({ where: { id: conversationId }, data: { slackThreadTs: result.ts } });
    } else {
      await prisma.customer.update({ where: { id: customer.id }, data: { slackThreadTs: result.ts } });
    }
  }
}

/** Alert via a Slack call card when a customer is left waiting. */
export async function sendUnattendedChatSlackAlert(conversationId: string, waitSeconds: number = 45): Promise<void> {
  const token = getBotToken();
  const channel = getSlackChannel('customers');
  if (!token || !channel) return;

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: { customer: true },
  });
  if (!conversation) return;

  const customer = conversation.customer as any;
  const customerName = customer?.name || 'Guest';
  const threadTs = customer?.isGuest ? conversation.slackThreadTs : customer?.slackThreadTs;

  // Deep link into the Slack thread so "Join" opens the reply thread directly
  const joinUrl = threadTs && channel
    ? `https://slack.com/archives/${channel}/p${threadTs.replace('.', '')}`
    : adminChatUrl(conversationId);

  // Create a Slack call object — the join URL opens the admin chat ticket
  let callId: string | undefined;
  try {
    const callRes = await fetch('https://slack.com/api/calls.add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        external_unique_id: `reframe-waiting-${conversationId}-${Date.now()}`,
        join_url: joinUrl,
        title: 'Stand by',
        date_start: Math.floor(Date.now() / 1000),
      }),
    });
    const callData: any = await callRes.json().catch(() => ({}));
    if (callData.ok) {
      callId = callData.call?.id;
    } else {
      console.error('[Slack] calls.add failed:', callData.error);
    }
  } catch (err) {
    console.error('[Slack] calls.add failed:', err);
  }

  if (callId) {
    // Post the call card directly to the channel (not the thread) for maximum visibility
    try {
      await fetch(SLACK_POST_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          channel,
          text: `${customerName} is waiting for support (${waitSeconds}s)`,
          blocks: [{ type: 'call', call_id: callId }],
          unfurl_links: false,
        }),
      });
    } catch (err) {
      console.error('[Slack] call card postMessage failed:', err);
    }
  } else {
    // Fallback to regular message if calls.add failed
    const threadTs = customer?.isGuest ? conversation.slackThreadTs : customer?.slackThreadTs;
    await postSlack('customers', {
      text: `Customer waiting ${waitSeconds}s`,
      blocks: buildBlocks({
        title: `⏰ CUSTOMER WAITING ${waitSeconds}s`,
        fields: [
          { label: 'Client', value: escTrunc(customerName) },
          { label: 'Ticket', value: link(joinUrl, 'Open Chat Ticket') },
        ],
        footer: 'No admin reply has been sent after the latest customer message.',
      }),
      threadTs: threadTs || undefined,
    });
  }
}

/**
 * Resolve a Slack thread ts (from an admin reply event) to the conversation
 * it belongs to. Checks conversation anchors first, then customer anchors.
 */
export async function resolveConversationBySlackThread(threadTs: string): Promise<string | null> {
  const conversation = await prisma.conversation.findFirst({ where: { slackThreadTs: threadTs } });
  if (conversation) return conversation.id;

  const customer = await prisma.customer.findFirst({
    where: { slackThreadTs: threadTs },
    include: { conversations: { orderBy: { createdAt: 'desc' }, take: 1 } },
  });
  if (customer && customer.conversations.length > 0) return customer.conversations[0].id;

  return null;
}

/**
 * Remove a reaction emoji from a Slack message.
 * Silently ignores `no_reaction` (already removed) and `message_not_found`.
 */
export async function removeSlackReaction(channel: string, ts: string, emoji: string): Promise<void> {
  const token = getBotToken();
  if (!token || !channel || !ts) return;

  try {
    const res = await fetch('https://slack.com/api/reactions.remove', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ channel, name: emoji, timestamp: ts }),
    });
    const data: any = await res.json().catch(() => ({}));
    if (!data.ok && data.error !== 'no_reaction' && data.error !== 'message_not_found') {
      console.error(`[Slack] reactions.remove ${emoji} failed:`, data.error);
    }
  } catch (err) {
    console.error(`[Slack] reactions.remove ${emoji} failed:`, err);
  }
}

/**
 * Add a reaction emoji to a Slack message.
 * Silently ignores `already_reacted` since that is not an error.
 */
export async function addSlackReaction(channel: string, ts: string, emoji: string): Promise<void> {
  const token = getBotToken();
  if (!token || !channel || !ts) return;

  try {
    const res = await fetch('https://slack.com/api/reactions.add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ channel, name: emoji, timestamp: ts }),
    });
    const data: any = await res.json().catch(() => ({}));
    if (!data.ok && data.error !== 'already_reacted') {
      console.error(`[Slack] reactions.add ${emoji} failed:`, data.error);
    }
  } catch (err) {
    console.error(`[Slack] reactions.add ${emoji} failed:`, err);
  }
}

// ─────────────────────────────────────────────────────────────
// Test Notification
// ─────────────────────────────────────────────────────────────

export async function sendSlackTestNotification(triggeredBy?: string, topic: SlackTopicKey | string = 'ops'): Promise<void> {
  const normTopic = (topic === 'system' ? 'ops' : topic) as SlackTopicKey;
  if (!isSlackConfigured()) {
    throw new Error('Slack is not configured. Missing SLACK_BOT_TOKEN or a channel.');
  }
  const channel = getSlackChannel(normTopic);
  if (!channel) {
    throw new Error(`No Slack channel configured for topic "${normTopic}". Please set SLACK_DEFAULT_CHANNEL or SLACK_CHANNEL_${normTopic.toUpperCase()} in your environment variables.`);
  }

  const result = await postSlack(normTopic, {
    text: 'Slack notifications test',
    blocks: buildBlocks({
      title: '✅ SLACK NOTIFICATIONS TEST',
      fields: [
        { label: 'Status', value: 'Connected' },
        { label: 'Topic', value: normTopic },
        { label: 'Target Channel', value: `\`${channel}\`` },
        { label: 'Source', value: 'Reframe Visuals platform' },
        ...(triggeredBy ? [{ label: 'User', value: triggeredBy }] : []),
      ],
      footer: new Date().toISOString(),
    }),
  });

  if (!result?.ok) {
    throw new Error(`Slack test failed: ${result?.error || 'unknown error'} (channel: ${channel})`);
  }
}

/**
 * Send a notification to Slack for a new support ticket or customer reply.
 */
export async function sendSupportTicketSlackNotification(
  ticket: any,
  message: any,
  isNew: boolean
): Promise<SlackPostResult> {
  const topic: SlackTopicKey = 'customers';
  if (!isSlackConfigured()) {
    console.warn('[SlackSupport] Slack is not configured (missing bot token or channel).');
    return { ok: false, error: 'slack_not_configured' };
  }
  const channel = getSlackChannel(topic);
  if (!channel) {
    console.warn('[SlackSupport] No Slack channel resolved for support tickets.');
    return { ok: false, error: 'no_channel_configured' };
  }

  const existingThreadTs = ticket?.slackThreadTs;
  const rawMsg = typeof message === 'string' ? message : (message?.content || message?.text || '');
  const plainContent = stripHtml(rawMsg);

  let result: SlackPostResult | null = null;

  if (isNew || !existingThreadTs) {
    const isMock = !ticket?.id || String(ticket.id).startsWith('test-');
    const ticketIdSuffix = !isMock ? `#${String(ticket.id).slice(-6).toUpperCase()}` : (ticket?.id ? `(${ticket.id})` : '');
    const clientName = ticket?.customer?.name || 'Customer';
    const clientEmail = ticket?.customer?.email || 'N/A';
    const subject = ticket?.subject || 'Support Request';
    const messagePreview = truncate(stripEmailQuotes(plainContent) || '(No message body)', 600);

    result = await postSlack(topic, {
      text: `${clientName} — ${subject}`.slice(0, 250),
      blocks: [
        {
          type: 'header',
          text: { type: 'plain_text', text: `📬 SUPPORT TICKET ${ticketIdSuffix}`.trim().slice(0, 150), emoji: true },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*${esc(clientName)}* — ${esc(clientEmail)}\n*Subject:* ${esc(subject)}`,
          },
          accessory: {
            type: 'button',
            text: { type: 'plain_text', text: 'Open Support Hub', emoji: true },
            url: `${BASE_URL}/admin/support`,
            action_id: 'open_support_hub',
          },
        },
        { type: 'divider' },
        {
          type: 'section',
          text: { type: 'mrkdwn', text: messagePreview },
        },
        {
          type: 'context',
          elements: [{ type: 'mrkdwn', text: `Reply to this thread to email the customer • ${new Date(ticket?.createdAt || Date.now()).toISOString()}` }],
        },
      ],
    });

    if (result?.ok && result.ts) {
      if (ticket?.id && !isMock) {
        try {
          await prisma.supportTicket.update({
            where: { id: ticket.id },
            data: { slackThreadTs: result.ts },
          });
        } catch (dbErr: any) {
          console.error('[SlackSupport] Failed to persist thread ts to DB:', dbErr?.message || dbErr);
        }
      }

      // Post the quoted conversation history as a collapsed thread reply for context
      const quoteHistory = extractEmailQuote(plainContent);
      if (quoteHistory) {
        await postSlack(topic, {
          text: 'Previous conversation',
          blocks: [
            {
              type: 'section',
              text: { type: 'mrkdwn', text: `*Previous conversation:*\n${truncate(quoteHistory, 2800)}` },
            },
          ],
          threadTs: result.ts,
        });
      }
    }
  } else {
    // Append threaded reply — replyBroadcast surfaces it in the main channel too
    const clientName = ticket?.customer?.name || 'Customer';
    const isMock = !ticket?.id || String(ticket.id).startsWith('test-');
    const ticketIdSuffix = !isMock ? `#${String(ticket.id).slice(-6).toUpperCase()}` : '';
    const replyPreview = truncate(stripEmailQuotes(plainContent) || '(Empty reply)', 600);
    result = await postSlack(topic, {
      text: `${clientName}: ${replyPreview}`.slice(0, 250),
      blocks: [
        {
          type: 'section',
          text: { type: 'mrkdwn', text: `*${esc(clientName)}* ${ticketIdSuffix}\n${replyPreview}` },
        },
        {
          type: 'context',
          elements: [{ type: 'mrkdwn', text: new Date().toISOString() }],
        },
      ],
      threadTs: existingThreadTs,
      replyBroadcast: true,
    });
  }

  if (!result?.ok) {
    console.error('[SlackSupport] Support ticket notification failed:', result?.error || 'unknown');
    return result || { ok: false, error: 'post_failed' };
  }

  return result;
}

/**
 * Retrieve human user IDs from a specific channel
 */
export async function getChannelHumanMembers(channelId: string): Promise<string[]> {
  const token = getBotToken();
  if (!token) return [];

  try {
    // 1. Fetch all users to filter out bots
    const usersRes = await fetch('https://slack.com/api/users.list', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const usersData: any = await usersRes.json().catch(() => ({}));
    if (!usersData.ok) {
      console.error('[Slack] users.list failed:', usersData.error);
      return [];
    }

    const botUserIds = new Set<string>();
    const usersList: any[] = usersData.members || [];
    for (const u of usersList) {
      if (u.is_bot || u.deleted || u.id === 'USLACKBOT') {
        botUserIds.add(u.id);
      }
    }

    // 2. Fetch channel members
    const membersRes = await fetch(`https://slack.com/api/conversations.members?channel=${channelId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const membersData: any = await membersRes.json().catch(() => ({}));
    if (!membersData.ok) {
      console.error('[Slack] conversations.members failed:', membersData.error);
      return [];
    }

    const members: string[] = membersData.members || [];
    return members.filter(userId => !botUserIds.has(userId));
  } catch (err) {
    console.error('[Slack] Error fetching human members:', err);
    return [];
  }
}

/**
 * Send meeting invitation DMs to all human members in a channel
 */
export async function broadcastMeetingCall(
  channelId: string,
  initiatorName: string,
  meetingTitle: string = 'General Team Meeting'
): Promise<void> {
  const meetingUrl = process.env.SLACK_MEETING_URL || 'https://meet.google.com/tfg-tfdx-ryu';
  const humanMembers = await getChannelHumanMembers(channelId);

  if (humanMembers.length === 0) {
    console.log('[Slack] No human members to broadcast call to.');
    return;
  }

  console.log(`[Slack] Broadcasting meeting call to ${humanMembers.length} human members.`);

  const blocks = [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `📞 *Incoming Call from ${initiatorName}*\n\nYou are invited to join the *${meetingUrl.includes('google') ? 'Google Meet' : 'video call'}*:\n*${meetingTitle}*`,
      },
    },
    {
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: '🟢 Accept & Join Call',
            emoji: true,
          },
          value: 'accept_meeting',
          url: meetingUrl,
          style: 'primary',
        },
      ],
    },
  ];

  await Promise.all(
    humanMembers.map(async (userId) => {
      try {
        await postSlackRaw(userId, {
          text: `📞 Incoming Meeting Invitation from ${initiatorName}: ${meetingUrl}`,
          blocks,
        });
      } catch (err) {
        console.error(`[Slack] Failed to send meeting invitation DM to user ${userId}:`, err);
      }
    })
  );
}

/**
 * Check untriggered scheduled meetings and run due ones
 */
export async function checkAndTriggerScheduledMeetings(): Promise<void> {
  try {
    const now = new Date();
    const dueMeetings = await prisma.scheduledMeeting.findMany({
      where: {
        triggered: false,
        time: {
          lte: now,
        },
      },
    });

    if (dueMeetings.length === 0) return;

    for (const m of dueMeetings) {
      console.log(`[SlackScheduler] Triggering scheduled meeting: ${m.title} (ID: ${m.id})`);
      // Update database trigger status
      await prisma.scheduledMeeting.update({
        where: { id: m.id },
        data: { triggered: true },
      });

      // Broadcast meeting invitation DMs
      await broadcastMeetingCall(m.channelId, 'Scheduled Bot Reminder', m.title);
    }
  } catch (err) {
    console.error('[SlackScheduler] Error checking scheduled meetings:', err);
  }
}

/**
 * Retrieve a map of Email -> Slack User ID for all human users in the workspace
 */
export async function getSlackUserEmailMap(): Promise<Map<string, string>> {
  const token = getBotToken();
  if (!token) return new Map();

  try {
    const res = await fetch('https://slack.com/api/users.list', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const data: any = await res.json().catch(() => ({}));
    if (!data.ok) {
      console.error('[Slack] users.list failed:', data.error);
      return new Map();
    }

    const emailMap = new Map<string, string>();
    const members: any[] = data.members || [];
    for (const u of members) {
      if (u.is_bot || u.deleted || u.id === 'USLACKBOT') continue;
      const email = u.profile?.email;
      if (email) {
        emailMap.set(email.toLowerCase().trim(), u.id);
      }
    }
    return emailMap;
  } catch (err) {
    console.error('[Slack] Failed to build email map:', err);
    return new Map();
  }
}

/**
 * Send meeting invitation DMs to a specific list of Slack User IDs
 */
export async function broadcastMeetingCallToUsers(
  userIds: string[],
  initiatorName: string,
  meetingTitle: string,
  meetingUrl: string
): Promise<void> {
  if (userIds.length === 0) return;

  const blocks = [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `📞 *Incoming Call from ${initiatorName}*\n\nYou are invited to join the *${meetingUrl.includes('google') ? 'Google Meet' : 'video call'}*:\n*${meetingTitle}*`,
      },
    },
    {
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: '🟢 Accept & Join Call',
            emoji: true,
          },
          value: 'accept_meeting',
          url: meetingUrl,
          style: 'primary',
        },
      ],
    },
  ];

  await Promise.all(
    userIds.map(async (userId) => {
      try {
        await postSlackRaw(userId, {
          text: `📞 Incoming Meeting Invitation from ${initiatorName}: ${meetingUrl}`,
          blocks,
        });
      } catch (err) {
        console.error(`[Slack] Failed to send DM invitation to user ${userId}:`, err);
      }
    })
  );
}
