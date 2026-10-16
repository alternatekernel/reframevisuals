import { Router } from 'express';
import * as crypto from 'crypto';
import { prisma } from '../database';
import { attachPresenceToCustomer } from '../utils/presence';
import { authenticate } from '../middleware/auth';
import { createTenantFilter } from '../middleware/tenant';
import { emailService } from '../services/emailService';
import sanitizeHtml from 'sanitize-html';
import { getConversationRealtimeState, setSupportSeenState, setTypingState } from '../services/chatRealtimeState';
import { buildMessageCreateStatus, buildSeenStatusPatch, buildDeliveredStatusPatch } from '../services/messageStatusService';
import { sendSupportTicketSlackNotification, addSlackReaction, postSlackRaw, getSlackChannel } from '../services/slackService';
import { broadcastChatEvent } from '../services/chatSseService';
import { realtimeSubscription } from '../services/realtimeService';
import { cache } from '../services/cacheService';

const router = Router();

const SUPPORT_STAFF_ROLES = ['admin', 'manager', 'accountant', 'editor'];
const canManageSupport = (user: any) => SUPPORT_STAFF_ROLES.includes(user?.role);

// Sanitize HTML helper
const sanitize = (html: string) => sanitizeHtml(html, {
  allowedTags: ['b', 'i', 'em', 'strong', 'a', 'br', 'p', 'ul', 'ol', 'li'],
  allowedAttributes: {
    'a': ['href']
  }
});

const normalizeEmailAddress = (value: any): string => {
  const raw = typeof value === 'string'
    ? value
    : value?.email || value?.address || '';
  const match = String(raw).match(/<([^>]+)>/);
  return (match?.[1] || String(raw)).trim().toLowerCase();
};

const getHeader = (headers: any, name: string): string | undefined => {
  if (!headers) return undefined;
  const lower = name.toLowerCase();
  if (Array.isArray(headers)) {
    const found = headers.find((header) => String(header?.name || '').toLowerCase() === lower);
    return found?.value;
  }
  return headers[name] || headers[lower] || headers[name.toUpperCase()];
};

const stripReplyPrefix = (subject: string) => subject.replace(/^(re|fw|fwd):\s*/i, '').trim();

const createSupportMessageId = () => `<support-${Date.now()}-${crypto.randomBytes(6).toString('hex')}@reframevisuals.com>`;

const verifyResendWebhook = (req: any): boolean => {
  const secretEnv = process.env.RESEND_WEBHOOK_SECRET;
  if (!secretEnv) {
    if (process.env.NODE_ENV === 'production') {
      console.warn('[ResendWebhook] RESEND_WEBHOOK_SECRET is not configured in production. Webhook rejected with 401.');
      return false;
    }
    return true;
  }

  const secrets = secretEnv.split(',').map((s) => s.trim());

  return secrets.some((secret) => {
    // 1. Direct secret match (for custom forwarders, query params, or webhook relay services)
    const querySecret = req.query?.secret || req.query?.key;
    const headerSecret = req.get('x-webhook-secret') || req.get('x-api-key') || req.get('authorization')?.replace(/^Bearer\s+/i, '');
    if ((querySecret && querySecret === secret) || (headerSecret && headerSecret === secret)) {
      return true;
    }

    const body = req.rawBody || Buffer.from(JSON.stringify(req.body || {}));
    const directSignature = req.get('resend-signature') || req.get('x-resend-signature');

    if (directSignature) {
      const expected = crypto.createHmac('sha256', secret).update(body).digest('hex');
      try {
        return directSignature.length === expected.length && crypto.timingSafeEqual(Buffer.from(directSignature), Buffer.from(expected));
      } catch {
        return false;
      }
    }

    const svixId = req.get('svix-id');
    const svixTimestamp = req.get('svix-timestamp');
    const svixSignature = req.get('svix-signature');
    if (!svixId || !svixTimestamp || !svixSignature) return false;

    const secretBytes = secret.startsWith('whsec_')
      ? Buffer.from(secret.slice('whsec_'.length), 'base64')
      : Buffer.from(secret);
    const signedContent = Buffer.concat([
      Buffer.from(`${svixId}.${svixTimestamp}.`),
      Buffer.isBuffer(body) ? body : Buffer.from(body),
    ]);
    const expected = crypto.createHmac('sha256', secretBytes).update(signedContent).digest('base64');
    return svixSignature
      .split(' ')
      .some((signature: string) => {
        const value = signature.replace(/^v\d+,/, '').trim();
        try {
          return value.length === expected.length && crypto.timingSafeEqual(Buffer.from(value), Buffer.from(expected));
        } catch {
          return false;
        }
      });
  });
};

const isMailgunRequest = (req: any): boolean => {
  const b = req.body || {};
  return !!(b.timestamp && b.token && b.signature);
};

const verifyMailgunWebhook = (req: any): boolean => {
  const signingKey = process.env.MAILGUN_WEBHOOK_SIGNING_KEY;
  if (!signingKey) return process.env.NODE_ENV !== 'production';

  const { timestamp, token, signature } = req.body || {};
  if (!timestamp || !token || !signature) return false;

  const expected = crypto
    .createHmac('sha256', signingKey)
    .update(`${timestamp}${token}`)
    .digest('hex');
  try {
    return expected.length === signature.length && crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
};

// Parse Mailgun `message-headers` (JSON array of [name, value] pairs) into
// the same object shape that getHeader() already understands for objects.
const parseMailgunHeaders = (raw: string | undefined): Record<string, string> => {
  if (!raw) return {};
  try {
    const arr: [string, string][] = JSON.parse(raw);
    return Object.fromEntries(arr.map(([k, v]) => [k.toLowerCase(), v]));
  } catch {
    return {};
  }
};

// Pagination Helper
const getPagination = (query: any) => {
  const page = parseInt(query.page as string) || 1;
  const limit = parseInt(query.limit as string) || 20;
  const skip = (page - 1) * limit;
  return { skip, take: limit, page, limit };
};

// ─────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────
// POST /api/support/delivery-webhook
// Receive delivery events (delivered, bounced, opened, complained) from Resend and sync status.
// ─────────────────────────────────────────────────────────────
router.post('/delivery-webhook', async (req: any, res) => {
  try {
    if (!verifyResendWebhook(req)) {
      return res.status(401).json({ error: { code: 'INVALID_SIGNATURE', message: 'Invalid webhook signature' } });
    }

    const payload = req.body;
    const type = payload?.type; // e.g. "email.delivered", "email.opened", "email.bounced", "email.complained", "email.received"
    const data = payload?.data;

    // If Resend routed inbound email.received event to this webhook endpoint, handle it as an inbound email
    if (type === 'email.received') {
      return await handleInboundEmailPayload(req, res, data || payload, false);
    }

    if (!data) {
      return res.json({ success: true, message: 'No data payload' });
    }

    const messageId = data.message_id || data.email_id;
    if (!messageId) {
      return res.json({ success: true, message: 'No message_id to track' });
    }

    // 1. Resolve cached Slack message details for this message ID
    const cacheKey = `email:slack-ts:${messageId}`;
    const slackMsg = await cache.get<{ ts: string; channel: string }>(cacheKey);

    // 2. Resolve Support Ticket from DB to post message updates
    const ticket = await prisma.supportTicket.findFirst({
      where: {
        messages: {
          some: {
            smtpMessageId: messageId
          }
        }
      }
    });

    const channelId = slackMsg?.channel || (getSlackChannel('customers') || '');

    if (slackMsg && slackMsg.channel && slackMsg.ts) {
      // Add visual reactions
      if (type === 'email.delivered') {
        await addSlackReaction(slackMsg.channel, slackMsg.ts, 'white_check_mark').catch(() => {});
      } else if (type === 'email.opened') {
        await addSlackReaction(slackMsg.channel, slackMsg.ts, 'eyes').catch(() => {});
      } else if (type === 'email.bounced') {
        await addSlackReaction(slackMsg.channel, slackMsg.ts, 'warning').catch(() => {});
      } else if (type === 'email.complained') {
        await addSlackReaction(slackMsg.channel, slackMsg.ts, 'warning').catch(() => {});
      }
    }

    // 3. Post textual threads warnings for serious delivery errors
    if (ticket && ticket.slackThreadTs && channelId) {
      const recipient = Array.isArray(data.to) ? data.to.join(', ') : (data.to || 'customer');
      
      if (type === 'email.bounced') {
        const description = data.bounce?.description || 'Permanent bounce / invalid email address';
        await postSlackRaw(channelId, {
          text: `⚠️ *Delivery Failed:* The email to *${recipient}* bounced.\n*Reason:* ${description}`,
          threadTs: ticket.slackThreadTs
        }).catch(() => {});
      } else if (type === 'email.complained') {
        await postSlackRaw(channelId, {
          text: `🚨 *Spam Complaint:* The customer (*${recipient}*) marked your email reply as spam!`,
          threadTs: ticket.slackThreadTs
        }).catch(() => {});
      }
    }

    return res.json({ success: true });
  } catch (error: any) {
    console.error('[ResendDeliveryWebhook] Error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Core processor for inbound support emails from Resend or Mailgun.
 */
async function handleInboundEmailPayload(req: any, res: any, payload: any, isMailgun: boolean) {
  // Mailgun sends form fields with different names than Resend
  const mgHeaders = isMailgun ? parseMailgunHeaders(payload['message-headers']) : null;
  const fromEmail = normalizeEmailAddress(payload.from || payload.sender);
  const subject = String(payload.subject || 'No Subject').trim() || 'No Subject';
  const headers = mgHeaders || payload.headers || payload.email?.headers;
  const messageId = (isMailgun ? mgHeaders?.['message-id'] : undefined)
    || getHeader(headers, 'message-id') || payload['Message-Id'] || payload.messageId || payload.message_id || payload.id;
  const inReplyTo = (isMailgun ? mgHeaders?.['in-reply-to'] : undefined)
    || getHeader(headers, 'in-reply-to') || payload.inReplyTo || payload.in_reply_to;
  const references = (isMailgun ? mgHeaders?.['references'] : undefined)
    || getHeader(headers, 'references') || payload.references;

  let textBody = String(payload['body-plain'] || payload.text || payload.textBody || payload.email?.text || '').trim();
  let htmlBody = String(payload['body-html'] || payload.html || payload.htmlBody || payload.email?.html || '').trim();

  // If Resend email.received webhook metadata without body, fetch the full content from Resend Receiving API
  const resendEmailId = payload.email_id || (!isMailgun && payload.id ? payload.id : undefined);
  if (!textBody && !htmlBody && resendEmailId && process.env.RESEND_API_KEY) {
    try {
      const fetchRes = await fetch(`https://api.resend.com/emails/receiving/${resendEmailId}`, {
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` }
      });
      const emailDetails: any = await fetchRes.json().catch(() => ({}));
      if (emailDetails?.html || emailDetails?.text) {
        htmlBody = String(emailDetails.html || '').trim();
        textBody = String(emailDetails.text || '').trim();
      }
    } catch (err: any) {
      console.warn(`[ResendInbound] Failed to fetch email body for ${resendEmailId}:`, err?.message || err);
    }
  }

  const rawContent = textBody || htmlBody || '(No message body)';
  const content = sanitize(rawContent.replace(/\n/g, '<br/>'));

  if (!fromEmail || !fromEmail.includes('@')) {
    return res.status(400).json({ error: { code: 'INVALID_FROM', message: 'Webhook payload is missing a valid sender email' } });
  }

  if (messageId) {
    try {
      const existingMessage = await prisma.supportMessage.findFirst({ where: { smtpMessageId: messageId } });
      if (existingMessage) return res.status(200).json({ success: true, duplicate: true });
    } catch (dedupErr: any) {
      // P2002 unique constraint on concurrent retry — treat as duplicate
      if (dedupErr?.code === 'P2002') return res.status(200).json({ success: true, duplicate: true });
      throw dedupErr;
    }
  }

  let customer = await prisma.customer.findFirst({
    where: {
      OR: [
        { email: fromEmail },
        { contactEmail: fromEmail },
      ],
    },
  });

  if (!customer) {
    const tenantSeed = crypto.createHash('sha1').update(fromEmail).digest('hex').slice(0, 12);
    customer = await prisma.customer.create({
      data: {
        email: fromEmail,
        contactEmail: fromEmail,
        name: fromEmail.split('@')[0],
        isGuest: true,
        tenantId: `email-${tenantSeed}`,
      },
    });
  }

  let ticket: any = null;
  const referenceIds = [inReplyTo, ...(typeof references === 'string' ? references.split(/\s+/) : [])]
    .map((value) => String(value || '').trim())
    .filter(Boolean);

  if (referenceIds.length) {
    const referencedMessage = await prisma.supportMessage.findFirst({
      where: { smtpMessageId: { in: referenceIds } },
      include: { ticket: true },
    });
    ticket = referencedMessage?.ticket || null;
  }

  if (!ticket && referenceIds.length) {
    ticket = await prisma.supportTicket.findFirst({
      where: { threadId: { in: referenceIds } },
    });
  }

  if (!ticket) {
    const normalizedSubject = stripReplyPrefix(subject);
    ticket = await prisma.supportTicket.findFirst({
      where: {
        customerId: customer.id,
        status: { in: ['open', 'in_progress'] },
        subject: { contains: normalizedSubject || subject, mode: 'insensitive' },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  if (ticket) {
    const savedMessage = await prisma.supportMessage.create({
      data: {
        ticketId: ticket.id,
        content,
        senderId: customer.id,
        senderRole: 'customer',
        smtpMessageId: messageId || null,
      },
    });

    const updatedTicket = await prisma.supportTicket.update({
      where: { id: ticket.id },
      data: { status: 'open', updatedAt: new Date() },
      include: { customer: true },
    });

    sendSupportTicketSlackNotification(updatedTicket, savedMessage, false).then((slackRes) => {
      if (slackRes?.ok) {
        console.log(`[SlackSupportWebhook] Reply notification sent to Slack for ticket #${ticket.id}`);
      } else {
        console.warn(`[SlackSupportWebhook] Reply notification to Slack failed:`, slackRes?.error);
      }
    }).catch((err) =>
      console.error('[SlackSupportWebhook] Reply notification failed:', err.message || err)
    );

    return res.status(200).json({ success: true, ticketId: ticket.id, appended: true });
  }

  const createdTicket = await prisma.supportTicket.create({
    data: {
      tenantId: customer.tenantId,
      customerId: customer.id,
      subject,
      message: content,
      status: 'open',
      threadId: messageId || null,
      messages: {
        create: {
          senderId: customer.id,
          senderRole: 'customer',
          content,
          smtpMessageId: messageId || null,
        },
      },
    },
    include: {
      customer: true,
      messages: true,
    },
  });

  sendSupportTicketSlackNotification(createdTicket, createdTicket.messages[0], true).then((slackRes) => {
    if (slackRes?.ok) {
      console.log(`[SlackSupportWebhook] Ticket notification sent to Slack for ticket #${createdTicket.id}`);
    } else {
      console.warn(`[SlackSupportWebhook] Ticket notification to Slack failed:`, slackRes?.error);
    }
  }).catch((err) =>
    console.error('[SlackSupportWebhook] Ticket notification failed:', err.message || err)
  );

  return res.status(200).json({ success: true, ticketId: createdTicket.id, created: true });
}

// ─────────────────────────────────────────────────────────────
// POST /api/support/inbound-webhook
// Receive inbound support emails from Resend or Mailgun and sync them into Support Hub.
// ─────────────────────────────────────────────────────────────

router.post('/inbound-webhook', async (req: any, res) => {
  try {
    const isMailgun = isMailgunRequest(req);
    if (isMailgun) {
      if (!verifyMailgunWebhook(req)) {
        return res.status(401).json({ error: { code: 'INVALID_SIGNATURE', message: 'Invalid Mailgun webhook signature' } });
      }
    } else {
      if (!verifyResendWebhook(req)) {
        return res.status(401).json({ error: { code: 'INVALID_SIGNATURE', message: 'Invalid webhook signature' } });
      }
    }

    const payload = req.body?.data || req.body;
    return await handleInboundEmailPayload(req, res, payload, isMailgun);
  } catch (error: any) {
    console.error('[Resend Inbound Error]:', error.message || error);
    return res.status(500).json({ error: { code: 'INBOUND_EMAIL_ERROR', message: 'Failed to process inbound email' } });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/support/tickets
// Returns support tickets with threaded messages
// ─────────────────────────────────────────────────────────────

router.get('/tickets', authenticate, async (req: any, res) => {
  try {
    const { status, customerId, targetTenantId } = req.query;
    const { skip, take, page, limit } = getPagination(req.query);
    const user = req.user;

    // Determine if user is platform-level admin
    const isPlatform = canManageSupport(user);
    
    // Admin override: allow targetTenantId to view specific customer data
    let tenantId: string | null = null;
    if (isPlatform && targetTenantId) {
      tenantId = targetTenantId as string;
    } else if (!isPlatform) {
      tenantId = user?.tenantId || null;
    }

    // Create tenant filter
    const tenantFilter = createTenantFilter(tenantId, isPlatform);

    const where: any = {
      ...tenantFilter,
      // Hide legacy seed/demo tickets if they exist in any environment. A migration
      // also deletes them, but this keeps Support Hub honest before/without migrate.
      id: { notIn: ['ticket-1', 'ticket-2'] },
    };
    if (status && status !== 'all') where.status = status as string;
    
    // Authorization check for customers: they can only see their own tickets
    if (!isPlatform) {
      // Find the customer record for this user
      const customer = await prisma.customer.findFirst({
        where: { contactEmail: user.email }
      });
      if (customer) {
        where.customerId = customer.id;
      } else {
        // If no customer found for this user, they shouldn't see anything
        return res.json({ tickets: [], totalCount: 0, pagination: { total: 0, page, limit, pages: 0 } });
      }
    } else if (customerId) {
      where.customerId = customerId as string;
    }

    const [tickets, totalCount] = await Promise.all([
      prisma.supportTicket.findMany({
        where,
        include: {
          customer: {
            select: {
              name: true,
              companyName: true,
              email: true,
              contactEmail: true,
            },
          },
          messages: {
            orderBy: { createdAt: 'asc' },
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.supportTicket.count({ where })
    ]);

    return res.json({ 
      tickets, 
      totalCount,
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error: any) {
    return res.status(500).json({ error: { code: 'SUPPORT_ERROR', message: error.message } });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/support/tickets
// Create support ticket
// ─────────────────────────────────────────────────────────────

router.post('/tickets', authenticate, async (req: any, res) => {
  try {
    const { customerId, subject, message, assignedTo } = req.body;
    const user = req.user;
    const isPlatform = user?.role === 'admin' || user?.role === 'manager';

    // Authorization: Customers can only create tickets for themselves
    if (!isPlatform) {
      const customer = await prisma.customer.findFirst({
        where: { contactEmail: user.email }
      });
      if (!customer || customer.id !== customerId) {
        return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'You can only create tickets for your own account' } });
      }
    }
    
    const sanitizedMessage = sanitize(message);

    const ticket = await prisma.supportTicket.create({
      data: {
        tenantId: user.tenantId || 'reframe-primary',
        customerId,
        subject,
        message: sanitizedMessage,
        assignedTo,
        status: 'open',
        messages: {
          create: {
            senderId: customerId,
            senderRole: 'customer',
            content: sanitizedMessage
          }
        }
      },
      include: {
        customer: true,
        messages: true,
      }
    });

    sendSupportTicketSlackNotification(ticket, ticket.messages[0], true).catch((err) =>
      console.error('[SlackSupport] Portal ticket notification failed:', err.message || err)
    );

    return res.status(201).json({ ticket, message: 'Ticket created' });
  } catch (error: any) {
    return res.status(400).json({ error: { code: 'CREATE_TICKET_ERROR', message: error.message } });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/support/tickets/:id/reply
// Send reply to a ticket
// ─────────────────────────────────────────────────────────────

router.post('/tickets/:id/reply', authenticate, async (req: any, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const user = req.user;
    const isPlatform = user?.role === 'admin' || user?.role === 'manager';

    // Find ticket to check ownership
    const ticket = await prisma.supportTicket.findUnique({
      where: { id },
      include: {
        customer: true,
        messages: { orderBy: { createdAt: 'asc' } },
      }
    });

    if (!ticket) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Ticket not found' } });
    }

    // Authorization check
    if (!isPlatform && ticket.customer?.contactEmail !== user.email) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Unauthorized to reply to this ticket' } });
    }
    
    const sanitizedContent = sanitize(content);

    const reply = await prisma.supportMessage.create({
      data: {
        ticketId: id,
        content: sanitizedContent,
        senderId: isPlatform ? user.id : ticket.customerId,
        senderRole: isPlatform ? 'admin' : 'customer'
      }
    });
    
    // Update ticket status
    await prisma.supportTicket.update({
      where: { id },
      data: { 
        status: isPlatform ? 'in_progress' : 'open',
        updatedAt: new Date()
      }
    });

    // If sent by admin/staff, send an email to the customer
    if (isPlatform && ticket.customer?.contactEmail) {
      const generatedMsgId = createSupportMessageId();
      const lastMessage = ticket.messages[ticket.messages.length - 1];
      const references = [ticket.threadId, lastMessage?.smtpMessageId].filter(Boolean).join(' ') || undefined;
      const sent = await emailService.sendEmailWithHeaders(
        ticket.customer.contactEmail,
        `Re: ${ticket.subject}`,
        sanitizedContent.replace(/\n/g, '<br/>'),
        {
          messageId: generatedMsgId,
          inReplyTo: lastMessage?.smtpMessageId || ticket.threadId || undefined,
          references,
        }
      );

      if (sent) {
        await prisma.supportMessage.update({
          where: { id: reply.id },
          data: { smtpMessageId: generatedMsgId },
        });
        reply.smtpMessageId = generatedMsgId;
      } else {
        console.error('[Support Reply] Email failed to send');
      }
    } else if (!isPlatform) {
      // Customer replied from portal — surface in Slack support thread
      sendSupportTicketSlackNotification(ticket, reply, false).catch((err) =>
        console.error('[SlackSupport] Portal reply notification failed:', err?.message || err)
      );
    }
    
    return res.status(201).json({ reply, message: 'Reply sent' });
  } catch (error: any) {
    return res.status(400).json({ error: { code: 'REPLY_ERROR', message: error.message } });
  }
});

// ─────────────────────────────────────────────────────────────
// PATCH /api/support/tickets/:id
// Update ticket status or assignment
// ─────────────────────────────────────────────────────────────

router.patch('/tickets/:id', authenticate, async (req: any, res) => {
  try {
    const { id } = req.params;
    const { status, assignedTo } = req.body;
    const user = req.user;
    const isPlatform = user?.role === 'admin' || user?.role === 'manager';

    // Authorization: Only admins can update ticket status via this endpoint
    // Customers can close their own tickets, but let's restrict to admins for now 
    // or add logic for customers.
    if (!isPlatform) {
      // Find ticket
      const ticket = await prisma.supportTicket.findUnique({
        where: { id },
        include: { customer: true }
      });
      
      if (!ticket || ticket.customer?.contactEmail !== user.email) {
        return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Unauthorized' } });
      }

      // Customers can only close or resolve their own tickets
      if (status !== 'closed' && status !== 'resolved') {
        return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Customers can only close or resolve tickets' } });
      }
    }
    
    const ticket = await prisma.supportTicket.update({ 
      where: { id }, 
      data: { status, assignedTo } 
    });
    
    return res.json({ ticket, message: 'Ticket updated' });
  } catch (error: any) {
    return res.status(400).json({ error: { code: 'UPDATE_TICKET_ERROR', message: error.message } });
  }
});

// ─────────────────────────────────────────────────────────────
// SSE: Real-time chat stream per conversation (admin side)
// GET /support/chat/stream?conversationId=...&token=<admin_token>
// ─────────────────────────────────────────────────────────────

router.get('/chat/stream', (req: any, _res, next) => {
  if (req.query.token && !req.headers.authorization) {
    req.headers.authorization = `Bearer ${req.query.token}`;
  }
  return next();
}, authenticate, async (req: any, res) => {
  const user = req.user;
  if (!canManageSupport(user)) return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Admins only' } });

  const { conversationId } = req.query;
  if (!conversationId || typeof conversationId !== 'string') {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'conversationId required' } });
  }

  const conversation = await prisma.conversation.findUnique({ where: { id: conversationId } }).catch(() => null);
  if (!conversation) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Conversation not found' } });

  return res.json(realtimeSubscription('chat', conversationId));
});

// ─────────────────────────────────────────────────────────────
// Portal Conversations (Customer Chat)
// Admin can view all customer chats, with optional tenant filtering
// ─────────────────────────────────────────────────────────────

router.get('/conversations', authenticate, async (req: any, res) => {
  try {
    const { customerId, targetTenantId, search, status, customerType, active, pinned } = req.query;
    const { skip, take, page, limit } = getPagination(req.query);
    const user = req.user;

    // Determine if user is platform-level admin
    const isPlatform = canManageSupport(user);
    
    // Admin override: allow targetTenantId to view specific customer data
    let tenantId: string | null = null;
    if (isPlatform && targetTenantId) {
      tenantId = targetTenantId as string;
    } else if (!isPlatform) {
      tenantId = user?.tenantId || null;
    }

    // Create tenant filter
    const tenantFilter = createTenantFilter(tenantId, isPlatform);

    const where: any = { ...tenantFilter };
    
    if (customerId) where.customerId = customerId as string;
    if (status === 'archived') where.archivedAt = { not: null };
    else where.deletedAt = null;
    if (status !== 'archived') where.archivedAt = null;
    if (pinned === 'true') where.pinnedAt = { not: null };
    if (customerType === 'guest') where.customer = { isGuest: true };
    if (customerType === 'registered') where.customer = { isGuest: false };
    if (search && String(search).trim()) {
      const q = String(search).trim();
      where.OR = [
        { id: { contains: q, mode: 'insensitive' } },
        { title: { contains: q, mode: 'insensitive' } },
        { customerId: { contains: q, mode: 'insensitive' } },
        { customer: { name: { contains: q, mode: 'insensitive' } } },
        { customer: { email: { contains: q, mode: 'insensitive' } } },
        { customer: { companyName: { contains: q, mode: 'insensitive' } } },
        { customer: { contactEmail: { contains: q, mode: 'insensitive' } } },
        { messages: { some: { content: { contains: q, mode: 'insensitive' } } } },
      ];
    }

    const [conversations, totalCount] = await Promise.all([
      prisma.conversation.findMany({
        where,
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
              companyName: true,
              contactEmail: true,
              contactPhone: true,
              industry: true,
              tenantId: true,
              customerNumber: true,
              isGuest: true,
            },
          },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 8, // Recent-message cache for instant thread preview on selection
            select: {
              id: true,
              conversationId: true,
              role: true,
              content: true,
              metadata: true,
              createdAt: true,
              status: true,
              deliveredAt: true,
              seenAt: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take,
      }),
      prisma.conversation.count({ where })
    ]);

    let conversationsWithPresence = conversations.map((conversation) => ({
      ...conversation,
      customer: attachPresenceToCustomer(conversation.customer),
      messages: [...conversation.messages].reverse(),
    }));

    if (active === 'true') {
      conversationsWithPresence = conversationsWithPresence.filter((conversation) => (conversation.customer as any)?.activeStatus === 'active');
    }

    conversationsWithPresence.sort((a, b) => {
      const pinDiff = Number(Boolean(b.pinnedAt)) - Number(Boolean(a.pinnedAt));
      if (pinDiff) return pinDiff;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

    return res.json({ 
      conversations: conversationsWithPresence, 
      totalCount, 
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit)
      },
      tenantFiltered: !!tenantId 
    });
  } catch (error: any) {
    return res.status(500).json({ error: { code: 'CONVERSATIONS_ERROR', message: error.message } });
  }
});

router.get('/conversations/:id', authenticate, async (req: any, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    const isPlatform = canManageSupport(user);
    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            companyName: true,
            contactEmail: true,
            contactPhone: true,
            industry: true,
            customerNumber: true,
            isGuest: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            conversationId: true,
            role: true,
            content: true,
            metadata: true,
            createdAt: true,
            status: true,
            deliveredAt: true,
            seenAt: true,
          },
        },
      },
    });

    if (!conversation) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Conversation not found' } });
    }

    if (!isPlatform && conversation.customer?.email !== user?.email) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Unauthorized to view this conversation' } });
    }

    if (canManageSupport(user)) {
      await prisma.message.updateMany({
        where: { conversationId: id, role: 'user', status: 'sent' },
        data: buildDeliveredStatusPatch(),
      });
    }

    return res.json({
      conversation: { ...conversation, customer: attachPresenceToCustomer(conversation.customer) },
      realtime: await getConversationRealtimeState(id),
    });
  } catch (error: any) {
    return res.status(500).json({ error: { code: 'CONVERSATION_ERROR', message: error.message } });
  }
});

router.get('/conversations/:id/realtime', authenticate, async (req: any, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    if (!canManageSupport(user)) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Only support staff can view chat realtime state' } });
    }

    const conversation = await prisma.conversation.findUnique({ where: { id } });
    if (!conversation) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Conversation not found' } });
    }

    return res.json({ success: true, realtime: await getConversationRealtimeState(id) });
  } catch (error: any) {
    return res.status(500).json({ error: { code: 'REALTIME_ERROR', message: error.message } });
  }
});

router.post('/conversations/:id/typing', authenticate, async (req: any, res) => {
  try {
    const { id } = req.params;
    const { isTyping } = req.body || {};
    const user = req.user;
    if (!canManageSupport(user)) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Only support staff can set typing state' } });
    }

    const conversation = await prisma.conversation.findUnique({ where: { id } });
    if (!conversation) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Conversation not found' } });
    }

    setTypingState(id, 'support', Boolean(isTyping));
    broadcastChatEvent(id, 'typing', { role: 'support', isTyping: Boolean(isTyping) });
    return res.json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ error: { code: 'TYPING_ERROR', message: error.message } });
  }
});

router.post('/conversations/:id/seen', authenticate, async (req: any, res) => {
  try {
    const { id } = req.params;
    const { messageId } = req.body || {};
    const user = req.user;
    if (!canManageSupport(user)) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Only support staff can set seen state' } });
    }
    if (!messageId || typeof messageId !== 'string') {
      return res.status(400).json({ error: { code: 'INVALID_MESSAGE', message: 'messageId is required' } });
    }

    const conversation = await prisma.conversation.findUnique({ where: { id } });
    if (!conversation) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Conversation not found' } });
    }

    await prisma.message.updateMany({
      where: { id: messageId, conversationId: id, role: 'user' },
      data: buildSeenStatusPatch(),
    });

    setSupportSeenState(id, messageId);
    broadcastChatEvent(id, 'seen', { role: 'support', messageId });
    return res.json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ error: { code: 'SEEN_ERROR', message: error.message } });
  }
});

router.patch('/conversations/:id/state', authenticate, async (req: any, res) => {
  try {
    const { id } = req.params;
    const { action, tags } = req.body || {};
    const user = req.user;
    if (!canManageSupport(user)) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Only support staff can update chat state' } });
    }

    const data: any = {};
    if (action === 'archive') data.archivedAt = new Date();
    if (action === 'unarchive') data.archivedAt = null;
    if (action === 'pin') data.pinnedAt = new Date();
    if (action === 'unpin') data.pinnedAt = null;
    if (action === 'read') data.adminReadAt = new Date();
    if (action === 'unread') data.adminReadAt = null;
    if (action === 'delete') data.deletedAt = new Date();
    if (Array.isArray(tags)) data.tags = JSON.stringify(tags.slice(0, 10));

    if (!Object.keys(data).length) {
      return res.status(400).json({ error: { code: 'INVALID_ACTION', message: 'Unsupported chat state action' } });
    }

    const conversation = await prisma.conversation.update({ where: { id }, data });
    return res.json({ success: true, conversation });
  } catch (error: any) {
    return res.status(400).json({ error: { code: 'STATE_UPDATE_ERROR', message: error.message } });
  }
});

router.post('/conversations/:id/reply', authenticate, async (req: any, res) => {
  try {
    const { id } = req.params;
    const { content, attachments, metadata } = req.body;
    const user = req.user;
    const isPlatform = canManageSupport(user);

    const safeAttachments = Array.isArray(attachments) ? attachments.slice(0, 8).map((item: any) => ({
      url: String(item.url || ''),
      filename: sanitize(String(item.filename || item.name || 'Attachment')),
      size: Number(item.size || 0),
      type: String(item.type || item.mimetype || ''),
      path: item.path ? String(item.path).slice(0, 500) : undefined,
      folderPath: item.folderPath ? String(item.folderPath).slice(0, 500) : undefined,
    })).filter((item: any) => item.url) : [];

    if ((!content || !String(content).trim()) && safeAttachments.length === 0) {
      return res.status(400).json({ error: { code: 'EMPTY_REPLY', message: 'Reply content is required' } });
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: { customer: true }
    });

    if (!conversation) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Conversation not found' } });
    }

    if (!isPlatform && conversation.customer?.email !== user?.email) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Unauthorized to reply to this conversation' } });
    }

    const sanitizedContent = sanitize(String(content || '').trim());

    const message = await prisma.message.create({
      data: {
        conversationId: id,
        role: isPlatform ? 'assistant' : 'user',
        content: sanitizedContent,
        ...buildMessageCreateStatus(),
        metadata: JSON.stringify({
          isHuman: isPlatform,
          source: isPlatform ? 'admin-dashboard' : 'customer-dashboard',
          adminId: isPlatform ? user?.id : undefined,
          attachments: safeAttachments,
          ...(metadata && typeof metadata === 'object' ? metadata : {}),
        })
      },
    });

    await prisma.conversation.update({
      where: { id },
      data: {
        updatedAt: new Date(),
        isEscalated: isPlatform ? true : conversation.isEscalated,
      },
    });

    broadcastChatEvent(id, 'new_message', { message });

    return res.status(201).json({ message, success: true });
  } catch (error: any) {
    return res.status(400).json({ error: { code: 'REPLY_ERROR', message: error.message } });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/support/emails
// Send an outbound support email from the admin dashboard
// ─────────────────────────────────────────────────────────────

router.post('/emails', authenticate, async (req: any, res) => {
  try {
    const user = req.user;
    const isPlatform = user?.role === 'admin' || user?.role === 'manager';
    if (!isPlatform) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Only admins can send support emails' } });
    }

    const { to, subject, body } = req.body;
    if (!to || !subject || !body) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'To, subject, and body are required' } });
    }

    const recipientEmail = normalizeEmailAddress(to);
    if (!recipientEmail || !recipientEmail.includes('@')) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'A valid recipient email is required' } });
    }

    const sanitizedBody = sanitize(String(body));
    const generatedMsgId = createSupportMessageId();
    const sent = await emailService.sendEmailWithHeaders(
      recipientEmail,
      subject,
      sanitizedBody.replace(/\n/g, '<br/>'),
      { messageId: generatedMsgId }
    );
    if (!sent) {
      return res.status(502).json({ error: { code: 'EMAIL_SEND_FAILED', message: 'Email service failed to send this message' } });
    }

    // Keep outbound Support Hub emails backed by real database records. If the
    // recipient is new, create a guest customer instead of showing a sent email
    // that disappears from the hub.
    let customer = await prisma.customer.findFirst({
      where: {
        OR: [
          { email: recipientEmail },
          { contactEmail: recipientEmail }
        ]
      }
    });

    if (!customer) {
      const tenantSeed = crypto.createHash('sha1').update(recipientEmail).digest('hex').slice(0, 12);
      customer = await prisma.customer.create({
        data: {
          email: recipientEmail,
          contactEmail: recipientEmail,
          name: recipientEmail.split('@')[0],
          isGuest: true,
          tenantId: `email-${tenantSeed}`,
        },
      });
    }

    const ticket = await prisma.supportTicket.create({
      data: {
        tenantId: customer.tenantId || 'reframe-primary',
        customerId: customer.id,
        subject,
        message: sanitizedBody,
        status: 'closed',
        threadId: generatedMsgId,
        messages: {
          create: {
            senderId: user.id,
            senderRole: 'admin',
            content: sanitizedBody,
            smtpMessageId: generatedMsgId,
          }
        }
      }
    });

    return res.status(201).json({ success: true, ticket, message: 'Email sent' });
  } catch (error: any) {
    return res.status(500).json({ error: { code: 'SEND_EMAIL_ERROR', message: error.message } });
  }
});

export default router;
