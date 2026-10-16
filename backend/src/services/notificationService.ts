import { Resend } from 'resend';
// Telegram notifications disabled — import kept for easy re-enable
// import { sendOrderTelegramNotification, sendInquiryTelegramNotification, sendPaymentTelegramNotification, sendSignupTelegramNotification, sendLoginTelegramNotification } from './telegramService';
import {
  sendOrderDiscordNotification as sendOrderDiscordWebhookNotification,
  sendPaymentDiscordNotification,
  sendInquiryDiscordNotification,
  sendSignupDiscordNotification,
  sendLoginDiscordNotification,
} from './discordService';
import {
  sendOrderSlackNotification,
  sendPaymentSlackNotification,
  sendPaymentFailureSlackNotification,
  sendInquirySlackNotification,
  sendSignupSlackNotification,
  sendLoginSlackNotification,
} from './slackService';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface CustomerAuthNotificationPayload {
  id?: string;
  name?: string | null;
  email: string;
  customerCode?: string;
  customerNumber?: number | null;
  role?: string;
  source?: string;
  ip?: string;
  createdAt?: Date | string;
}

export interface SignupNotificationPayload {
  id?: string;
  name?: string | null;
  email: string;
  customerCode?: string;
  customerNumber?: number | null;
  source?: string;
  createdAt?: Date | string;
}

export interface OrderNotificationPayload {
  orderId: string;
  code: string;
  title: string;
  customerName: string;
  customerEmail: string;
  services: string;
  volume: number;
  turnaround: string;
  isRush: boolean;
  isGuest: boolean;
  createdAt: Date;
  dropboxLink?: string;
}

// ─────────────────────────────────────────────────────────────
// Resend Client
// ─────────────────────────────────────────────────────────────

const getResend = (): Resend | null => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('[Email] Provider is not configured. Email delivery disabled.');
    return null;
  }
  return new Resend(apiKey);
};

const FROM = process.env.EMAIL_FROM || 'Reframe Visuals <hello@reframevisuals.com>';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'hello@reframevisuals.com';
const BASE_URL = process.env.BASE_URL || 'https://reframevisuals.com';

// ─────────────────────────────────────────────────────────────
// Helper: Send Email via Resend
// ─────────────────────────────────────────────────────────────

async function sendEmail(subject: string, to: string, html: string): Promise<void> {
  const resend = getResend();

  if (!resend) {
    console.log('[Email] Skipped send because provider is unavailable.');
    return;
  }

  try {
    const { error } = await resend.emails.send({ from: FROM, to, subject, html });
    if (error) {
      console.error('[Notification] Resend error:', error);
    } else {
      console.log('[Notification] Email sent.');
    }
  } catch (err) {
    console.error('[Notification] Failed to send email:', err);
  }
}

// ─────────────────────────────────────────────────────────────
// Order Email
// ─────────────────────────────────────────────────────────────

async function sendOrderEmailNotification(order: OrderNotificationPayload): Promise<void> {
  const subject = `${order.isRush ? '⚡ RUSH: ' : ''}Order ${order.code} Received`;

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; border: 1px solid #eee; padding: 20px; border-radius: 12px;">
      <h2 style="margin-top: 0; color: #111;">${order.isRush ? '⚡ Rush ' : ''}Order ${order.code}</h2>
      
      <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
        <h3 style="margin: 0 0 10px 0; font-size: 14px; text-transform: uppercase; color: #666; letter-spacing: 1px;">Customer</h3>
        <p style="margin: 5px 0; font-size: 18px; font-weight: bold; color: #000;">${order.customerName}</p>
        <p style="margin: 0; color: #444;">${order.customerEmail}</p>
      </div>

      <div style="padding: 0 15px; border-left: 4px solid #000; margin-bottom: 20px;">
        <h3 style="margin: 0 0 10px 0; font-size: 14px; text-transform: uppercase; color: #666; letter-spacing: 1px;">Project Details</h3>
        <p style="margin: 5px 0; font-size: 16px;"><strong>Title:</strong> ${order.title}</p>
        <p style="margin: 5px 0;"><strong>Volume:</strong> ${order.volume} images</p>
        <p style="margin: 5px 0;"><strong>Turnaround:</strong> ${order.turnaround}h</p>
        <p style="margin: 5px 0;"><strong>Services:</strong> ${order.services}</p>
        ${order.dropboxLink ? `<p style="margin: 5px 0;"><strong>Files:</strong> <a href="${order.dropboxLink}">View in Dropbox</a></p>` : ''}
      </div>

      <p style="font-size: 12px; color: #888;">Received at: ${order.createdAt.toLocaleString()}</p>
      <br/>
      <a href="${BASE_URL}/admin/orders/${order.orderId}" style="display: inline-block; background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Open in Production Hub</a>
    </div>
  `;

  await sendEmail(subject, ADMIN_EMAIL, html);
}

async function sendCustomerOrderConfirmationEmail(order: OrderNotificationPayload): Promise<void> {
  const subject = `Your Reframe Visuals Order Confirmation — ${order.code}`;

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; border: 1px solid #eee; padding: 20px; border-radius: 12px; color: #171717;">
      <h2 style="margin-top: 0; color: #171717;">Order Confirmed</h2>
      <p style="font-size: 15px; color: #666; line-height: 1.6;">
        Hi ${order.customerName || 'there'},
      </p>
      <p style="font-size: 15px; color: #666; line-height: 1.6;">
        Thank you for your order! We have successfully received project <strong>${order.title}</strong> (Order Code: <strong>${order.code}</strong>). 
        Our editors are reviewing your assets.
      </p>

      <div style="background: #fafafa; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #eee;">
        <h3 style="margin: 0 0 10px 0; font-size: 12px; text-transform: uppercase; color: #999; letter-spacing: 1px;">Project Details</h3>
        <p style="margin: 5px 0; font-size: 14px;"><strong>Volume:</strong> ${order.volume} images</p>
        <p style="margin: 5px 0; font-size: 14px;"><strong>Services:</strong> ${order.services}</p>
        <p style="margin: 5px 0; font-size: 14px;"><strong>Speed / Turnaround:</strong> ${order.turnaround}h Delivery</p>
      </div>

      <p style="font-size: 15px; color: #666; line-height: 1.6;">
        You can track the progress of your order, download final retouched assets, and request revisions directly in your Customer Dashboard.
      </p>

      <div style="margin-top: 25px;">
        <a href="${BASE_URL}/dashboard" style="display: inline-block; background: #171717; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px;">Open Dashboard</a>
      </div>

      <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;" />
      <p style="font-size: 12px; color: #999; line-height: 1.6;">
        Reframe Visuals Support Team<br/>
        If you have any questions, reply directly to this email or chat with us on the platform.
      </p>
    </div>
  `;

  await sendEmail(subject, order.customerEmail, html);
}

// ─────────────────────────────────────────────────────────────
// Payment Email
// ─────────────────────────────────────────────────────────────

async function sendPaymentEmailNotification(orderId: string, amount: number, customerEmail: string): Promise<void> {
  const adminHtml = `
    <div style="font-family: sans-serif; max-width: 600px; border: 1px solid #eee; padding: 20px; border-radius: 12px;">
      <h2 style="margin-top: 0; color: #2e7d32;">✅ Payment Confirmed</h2>
      <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
        <p style="margin: 5px 0;"><strong>Amount:</strong> $${amount}</p>
        <p style="margin: 5px 0;"><strong>Customer:</strong> ${customerEmail}</p>
        <p style="margin: 5px 0;"><strong>Order ID:</strong> <code>${orderId}</code></p>
      </div>
      <br/>
      <a href="${BASE_URL}/admin/orders/${orderId}" style="display: inline-block; background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Manage Order</a>
    </div>
  `;
  await sendEmail(`💰 Payment Received: $${amount}`, ADMIN_EMAIL, adminHtml);

  const customerHtml = `
    <div style="font-family: sans-serif; max-width: 600px; border: 1px solid #eee; padding: 20px; border-radius: 12px;">
      <h2 style="margin-top: 0; color: #2e7d32;">✅ Payment Received — Thank You!</h2>
      <p style="color: #444;">We've successfully received your payment. Your project is now queued for production.</p>
      <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
        <p style="margin: 5px 0;"><strong>Amount Paid:</strong> $${amount}</p>
        <p style="margin: 5px 0;"><strong>Order ID:</strong> <code>${orderId.substring(0, 8).toUpperCase()}</code></p>
      </div>
      <p style="color: #444;">You'll receive another email when your assets are ready for review. In the meantime, you can track your order from your dashboard.</p>
      <br/>
      <a href="${BASE_URL}/portal/orders" style="display: inline-block; background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">View My Orders</a>
      <p style="margin-top: 24px; font-size: 12px; color: #888;">Questions? Reply to this email or visit <a href="${BASE_URL}/contact">reframevisuals.com/contact</a>.</p>
    </div>
  `;
  await sendEmail('✅ Payment Confirmed — Reframe Visuals', customerEmail, customerHtml);
}

// ─────────────────────────────────────────────────────────────
// Chat Escalation Email
// ─────────────────────────────────────────────────────────────

export async function sendChatEscalationEmail(
  conversationId: string,
  customerName: string,
  customerEmail: string,
  transcript: string
): Promise<void> {
  const subject = `🔔 Support Escalation: ${customerName}`;

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; border: 1px solid #eee; padding: 20px; border-radius: 12px;">
      <h2 style="margin-top: 0; color: #d32f2f;">🚨 Support Escalation Required</h2>
      <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
        <p style="margin: 5px 0;"><strong>Customer:</strong> ${customerName}</p>
        <p style="margin: 5px 0;"><strong>Email:</strong> ${customerEmail}</p>
        <p style="margin: 5px 0;"><strong>Session ID:</strong> <code>${conversationId}</code></p>
      </div>
      <h3 style="font-size: 14px; text-transform: uppercase; color: #666; letter-spacing: 1px;">Chat History</h3>
      <div style="background: #fff; border: 1px solid #ddd; padding: 15px; border-radius: 8px; font-family: monospace; white-space: pre-wrap; font-size: 13px;">${transcript}</div>
      <br/>
      <a href="${BASE_URL}/admin/chats/${encodeURIComponent(conversationId)}" style="display: inline-block; background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Open Chat Ticket</a>
    </div>
  `;

  await sendEmail(subject, ADMIN_EMAIL, html);
}

// ─────────────────────────────────────────────────────────────
// Inquiry Email
// ─────────────────────────────────────────────────────────────

async function sendInquiryEmailNotification(email: string, metadata?: any): Promise<void> {
  const subject = `📥 New Lead: ${email}${metadata?.type ? ` (${metadata.type})` : ''}`;

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; border: 1px solid #eee; padding: 20px; border-radius: 12px;">
      <h2 style="margin-top: 0; color: #111;">New Lead Capture</h2>
      <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
        <p style="margin: 5px 0;"><strong>Email:</strong> ${email}</p>
        <p style="margin: 5px 0;"><strong>Source:</strong> ${metadata?.type || 'Navigation Popover'}</p>
        ${metadata?.name ? `<p style="margin: 5px 0;"><strong>Name:</strong> ${metadata.name}</p>` : ''}
        ${metadata?.description ? `<p style="margin: 5px 0;"><strong>Description:</strong> ${metadata.description}</p>` : ''}
      </div>
      <p style="font-size: 14px; color: #444;">This user requested attention via the ${metadata?.type || 'contact'} form.</p>
    </div>
  `;

  await sendEmail(subject, ADMIN_EMAIL, html);
}

// ─────────────────────────────────────────────────────────────
// Public Exports — Fire & Forget
// ─────────────────────────────────────────────────────────────

export function fireOrderNotifications(order: OrderNotificationPayload): void {
  Promise.all([
    sendOrderEmailNotification(order),
    sendCustomerOrderConfirmationEmail(order),
    sendOrderDiscordWebhookNotification(order),
    // sendOrderTelegramNotification(order),
    sendOrderSlackNotification(order),
  ]).catch((err) => {
    console.error('[Notification] Unexpected notification error:', err);
  });
}

export function firePaymentNotifications(orderId: string, amount: number, customerEmail: string): void {
  Promise.all([
    sendPaymentEmailNotification(orderId, amount, customerEmail),
    // sendPaymentTelegramNotification(orderId, amount, customerEmail),
    sendPaymentDiscordNotification(orderId, amount, customerEmail),
    sendPaymentSlackNotification(orderId, amount, customerEmail),
  ]).catch((err) => {
    console.error('[Notification] Payment notification error:', err);
  });
}

export function firePaymentFailureNotifications(orderId: string, amount: number, customerEmail: string): void {
  const subject = `❌ Payment Failed: Order #${orderId.substring(0, 8)}`;
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; border: 1px solid #eee; padding: 20px; border-radius: 12px;">
      <h2 style="margin-top: 0; color: #d32f2f;">❌ Payment Failed or Expired</h2>
      <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
        <p style="margin: 5px 0;"><strong>Order ID:</strong> <code>${orderId}</code></p>
        <p style="margin: 5px 0;"><strong>Customer Email:</strong> ${customerEmail}</p>
        <p style="margin: 5px 0;"><strong>Amount:</strong> $${amount}</p>
        <p style="margin: 5px 0;"><strong>Status:</strong> Failed / Expired</p>
      </div>
      <br/>
      <a href="${BASE_URL}/admin/orders/${orderId}" style="display: inline-block; background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">View Order Details</a>
    </div>
  `;
  sendEmail(subject, ADMIN_EMAIL, html).catch((err) => {
    console.error('[Notification] Payment failure email error:', err);
  });
  sendPaymentFailureSlackNotification(orderId, amount, customerEmail).catch((err) => {
    console.error('[Notification] Payment failure Slack error:', err);
  });
}

export function fireInquiryNotification(email: string, metadata?: any): void {
  Promise.all([
    sendInquiryEmailNotification(email, metadata),
    // sendInquiryTelegramNotification(email, metadata),
    sendInquiryDiscordNotification(email, metadata),
    sendInquirySlackNotification(email, metadata),
  ]).catch((err) => {
    console.error('[Notification] Inquiry notification error:', err);
  });
}

export function fireSignupNotifications(customer: SignupNotificationPayload): void {
  Promise.all([
    // sendSignupTelegramNotification(customer),
    sendSignupDiscordNotification(customer),
    sendSignupSlackNotification(customer),
  ]).catch((err) => {
    console.error('[Notification] Signup notification error:', err);
  });
}

export function fireLoginNotifications(customer: CustomerAuthNotificationPayload): void {
  Promise.all([
    // sendLoginTelegramNotification(customer),
    sendLoginDiscordNotification(customer),
    sendLoginSlackNotification(customer),
  ]).catch((err) => {
    console.error('[Notification] Login notification error:', err);
  });
}

// ─────────────────────────────────────────────────────────────
// Guest Chat Notification
// ─────────────────────────────────────────────────────────────

// A guest can open a chat and leave without ever giving an email. The team used to
// find out only by opening the site, and had no way to reach the visitor back. This
// fires on the first guest message regardless of whether contact info exists, and
// again once an email is captured.
async function sendGuestChatEmailNotification(
  conversationId: string,
  email: string | null,
  metadata?: any
): Promise<void> {
  const hasEmail = Boolean(email);
  const subject = hasEmail
    ? `📥 Guest chat — ${email}`
    : '🔔 Guest chat — no contact info';

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; border: 1px solid #eee; padding: 20px; border-radius: 12px;">
      <h2 style="margin-top: 0; color: ${hasEmail ? '#111' : '#d32f2f'};">${hasEmail ? 'Guest Chat — Contact Captured' : 'Guest Chat — No Contact Info'}</h2>
      <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
        <p style="margin: 5px 0;"><strong>Email:</strong> ${hasEmail ? email : '<em>not provided — reply in the chat before they leave</em>'}</p>
        <p style="margin: 5px 0;"><strong>Session ID:</strong> <code>${conversationId}</code></p>
        ${metadata?.firstMessage ? `<p style="margin: 5px 0;"><strong>First message:</strong> ${metadata.firstMessage}</p>` : ''}
      </div>
      <a href="${BASE_URL}/admin/chats/${encodeURIComponent(conversationId)}" style="display: inline-block; background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Open Chat Ticket</a>
    </div>
  `;

  await sendEmail(subject, ADMIN_EMAIL, html);
}

export function fireGuestChatNotification(
  conversationId: string,
  email: string | null,
  metadata?: any
): void {
  // The Discord/Slack lead senders already render `metadata.conversationId` as a chat
  // ticket link, so they are reused as-is with a placeholder in the email slot.
  const enriched = { ...metadata, conversationId, source: metadata?.source || 'Guest chat' };
  const displayEmail = email || '— no contact info —';

  Promise.all([
    sendGuestChatEmailNotification(conversationId, email, metadata),
    sendInquiryDiscordNotification(displayEmail, enriched),
    sendInquirySlackNotification(displayEmail, enriched),
  ]).catch((err) => {
    console.error('[Notification] Guest chat notification error:', err);
  });
}
