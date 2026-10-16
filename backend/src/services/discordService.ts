const BASE_URL = process.env.BASE_URL || 'https://reframevisuals.com';

type DiscordTopic = 'urgent' | 'orders' | 'payments' | 'leads' | 'chat' | 'system';

const TOPIC_ENV: Record<DiscordTopic, string> = {
  urgent: 'DISCORD_URGENT_WEBHOOK',
  orders: 'DISCORD_ORDER_WEBHOOK',
  payments: 'DISCORD_PAYMENTS_WEBHOOK',
  leads: 'DISCORD_LEADS_WEBHOOK',
  chat: 'DISCORD_CHAT_WEBHOOK',
  system: 'DISCORD_SYSTEM_WEBHOOK',
};

function getDiscordWebhook(topic: DiscordTopic): string | undefined {
  return process.env[TOPIC_ENV[topic]] || process.env.DISCORD_WEBHOOK_URL || process.env.DISCORD_ORDER_WEBHOOK;
}

function truncate(value: unknown, max = 1000): string {
  const text = String(value ?? 'N/A');
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
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

async function postDiscord(topic: DiscordTopic, payload: any): Promise<void> {
  const webhookUrl = getDiscordWebhook(topic);
  if (!webhookUrl) return;

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      console.error(`[Discord] ${topic} webhook failed (${res.status}):`, await res.text());
    } else {
      console.log(`[Discord] ${topic} notification sent.`);
    }
  } catch (err) {
    console.error(`[Discord] Failed to send ${topic} notification:`, err);
  }
}

export async function sendOrderDiscordNotification(order: any): Promise<void> {
  const services = Array.isArray(order.services) ? order.services.join(', ') : order.services;
  const rush = isRushTurnaround(order.turnaround);
  const title = rush
    ? `RUSH | ${toNumber(order.volume)}img | ${toNumber(order.turnaround)}h`
    : `${toNumber(order.volume)}img | ${toNumber(order.turnaround)}h`;
  const customerOrderCount = order.customerOrderCount ?? order.orderCount ?? 'N/A';

  await postDiscord(rush ? 'urgent' : 'orders', {
    embeds: [{
      title,
      url: `${BASE_URL}/admin/orders/${order.orderId}`,
      description: `Services: ${truncate(services || 'N/A', 400)}`,
      color: rush ? 0xff3b30 : 0x3498db,
      fields: [
        { name: 'Client', value: `**${truncate(order.customerName, 200)}**\n${truncate(order.customerCode || order.customerEmail || 'N/A', 200)}`, inline: false },
        { name: 'Order ID', value: `\`${truncate(order.orderId, 200)}\``, inline: true },
        { name: 'Customer Order Count', value: `${truncate(customerOrderCount, 100)}`, inline: true },
        ...(order.dropboxLink ? [{ name: 'Files', value: `[View in Dropbox](${order.dropboxLink})`, inline: false }] : []),
      ],
      timestamp: new Date(order.createdAt || Date.now()).toISOString(),
    }],
  });
}

export async function sendPaymentDiscordNotification(orderId: string, amount: number, customerEmail: string): Promise<void> {
  await postDiscord('payments', {
    embeds: [{
      title: 'PAID',
      url: `${BASE_URL}/admin/orders/${orderId}`,
      color: 0x2ecc71,
      fields: [
        { name: 'Amount', value: `$${Number(amount || 0).toFixed(2)}`, inline: true },
        { name: 'Customer', value: truncate(customerEmail, 300), inline: true },
        { name: 'Order ID', value: `\`${truncate(orderId, 200)}\``, inline: false },
      ],
      timestamp: new Date().toISOString(),
    }],
  });
}

export async function sendInquiryDiscordNotification(email: string, metadata?: any): Promise<void> {
  await postDiscord('leads', {
    embeds: [{
      title: 'LEAD',
      color: 0xf59e0b,
      fields: [
        { name: 'Email', value: `\`${truncate(email, 300)}\``, inline: false },
        { name: 'Source', value: truncate(metadata?.source || metadata?.type || 'Portal Dashboard', 300), inline: true },
        ...(metadata?.name ? [{ name: 'Name', value: truncate(metadata.name, 300), inline: true }] : []),
        ...(metadata?.description ? [{ name: 'Brief', value: truncate(metadata.description, 1000), inline: false }] : []),
        ...(metadata?.conversationId ? [{ name: 'Linked Chat Ticket', value: `[Open Chat Ticket](${adminChatUrl(metadata.conversationId)})`, inline: false }] : []),
      ],
      timestamp: new Date().toISOString(),
    }],
  });
}

export async function sendSignupDiscordNotification(customer: {
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

  await postDiscord('leads', {
    embeds: [{
      title: 'SIGNUP',
      url: `${BASE_URL}/admin/customers${customer.id ? `/${customer.id}` : ''}`,
      color: 0x5865f2,
      fields: [
        { name: 'Client', value: `**${truncate(customer.name || 'Unnamed', 300)}**\n${truncate(customerCode, 120)}`, inline: false },
        { name: 'Email', value: truncate(customer.email, 300), inline: false },
        { name: 'Location', value: truncate(customer.location || 'N/A', 300), inline: true },
        { name: 'IP Address', value: `\`${truncate(customer.ip || 'N/A', 120)}\``, inline: true },
        { name: 'VPN/Proxy', value: customer.vpnDetected ? truncate(`Detected${customer.vpnProvider ? ` (${customer.vpnProvider})` : ''}`, 200) : 'Not Detected', inline: true },
        { name: 'Source', value: truncate(customer.source || 'Customer portal signup', 300), inline: true },
      ],
      timestamp: new Date(customer.createdAt || Date.now()).toISOString(),
    }],
  });
}

export async function sendLoginDiscordNotification(customer: {
  id?: string;
  name?: string | null;
  email: string;
  customerCode?: string;
  role?: string;
  source?: string;
  ip?: string;
  createdAt?: Date | string;
}): Promise<void> {
  await postDiscord('system', {
    embeds: [{
      title: 'LOGIN',
      url: `${BASE_URL}/admin/customers${customer.id ? `/${customer.id}` : ''}`,
      color: 0x22c55e,
      fields: [
        { name: 'Customer', value: `**${truncate(customer.name || 'Unnamed', 300)}**\n${truncate(customer.email, 300)}`, inline: false },
        ...(customer.customerCode ? [{ name: 'Customer Code', value: `\`${truncate(customer.customerCode, 120)}\``, inline: true }] : []),
        ...(customer.role ? [{ name: 'Role', value: truncate(customer.role, 120), inline: true }] : []),
        { name: 'Source', value: truncate(customer.source || 'Login', 300), inline: true },
        ...(customer.ip ? [{ name: 'IP', value: `\`${truncate(customer.ip, 120)}\``, inline: true }] : []),
      ],
      timestamp: new Date(customer.createdAt || Date.now()).toISOString(),
    }],
  });
}

export async function sendChatDiscordNotification(input: {
  conversationId: string;
  userMessage: string;
  customerName?: string | null;
  customerCode?: string;
  isGuest?: boolean;
  geoInfo?: { ip: string; location: string; network: string };
}): Promise<void> {
  await postDiscord('chat', {
    embeds: [{
      title: input.isGuest ? 'GUEST' : 'CHAT',
      url: adminChatUrl(input.conversationId),
      color: input.isGuest ? 0x95a5a6 : 0x00a8ff,
      fields: [
        { name: 'Customer', value: `${truncate(input.customerName || 'Guest', 250)}\n${truncate(input.customerCode || 'Guest', 120)}`, inline: true },
        { name: 'Location', value: truncate(input.geoInfo?.location || 'Unknown', 300), inline: true },
        { name: 'Network', value: truncate(input.geoInfo?.network || 'Unknown', 300), inline: false },
        { name: 'Message', value: truncate(input.userMessage, 1000), inline: false },
        { name: 'Chat Ticket', value: `[Open Chat Ticket](${adminChatUrl(input.conversationId)})`, inline: false },
        { name: 'Conversation ID', value: `\`${truncate(input.conversationId, 200)}\``, inline: false },
      ],
      timestamp: new Date().toISOString(),
    }],
  });
}

export async function sendFeedbackDiscordNotification(feedback: {
  type: string;
  subject: string;
  message: string;
  email: string;
  url?: string;
  screenResolution?: string;
}): Promise<void> {
  await postDiscord('system', {
    embeds: [{
      title: `FEEDBACK | ${truncate(String(feedback.type || 'other').toUpperCase(), 50)}`,
      color: 0x9b59b6,
      fields: [
        { name: 'Subject', value: truncate(feedback.subject, 300), inline: false },
        { name: 'Email', value: truncate(feedback.email, 300), inline: true },
        ...(feedback.url ? [{ name: 'Page URL', value: `\`${truncate(feedback.url, 500)}\``, inline: true }] : []),
        ...(feedback.screenResolution ? [{ name: 'Resolution', value: `\`${truncate(feedback.screenResolution, 100)}\``, inline: true }] : []),
        { name: 'Message', value: truncate(feedback.message, 1000), inline: false },
      ],
      timestamp: new Date().toISOString(),
    }],
  });
}
