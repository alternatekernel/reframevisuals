import { Router } from 'express';
import crypto from 'crypto';
import {
  isSlackConfigured,
  getSlackChannel,
  sendSlackTestNotification,
  sendSupportTicketSlackNotification,
  resolveConversationBySlackThread,
  SlackTopicKey,
  postSlackRaw,
  addSlackReaction,
  removeSlackReaction,
  broadcastMeetingCall,
} from '../services/slackService';
import { sendAdminReplyToUser } from '../services/telegramService';
import { authenticate, requireAdmin } from '../middleware/auth';
import { prisma } from '../database';
import { uploadToDropbox } from '../services/dropboxService';
import { emailService } from '../services/emailService';
import { generateSupportEmailDraft } from '../services/aiService';
import { cache } from '../services/cacheService';
import sanitizeHtml from 'sanitize-html';

const sanitize = (text: string) =>
  sanitizeHtml(text, { allowedTags: [], allowedAttributes: {} });

const router = Router();

/**
 * GET /api/slack/status
 * Admin-only health check for the unified Slack notification bot.
 */
router.get('/status', authenticate, requireAdmin, (_req, res) => {
  const defaultChannel = process.env.SLACK_DEFAULT_CHANNEL || process.env.SLACK_CHANNEL || process.env.SLACK_CHANNEL_ID;
  const customersChannel = getSlackChannel('customers');
  const opsChannel = getSlackChannel('ops');

  return res.json({
    success: true,
    data: {
      configured: isSlackConfigured(),
      botTokenConfigured: Boolean(process.env.SLACK_BOT_TOKEN),
      signingSecretConfigured: Boolean(process.env.SLACK_SIGNING_SECRET),
      defaultChannelConfigured: Boolean(defaultChannel || process.env.SLACK_CHANNEL_CUSTOMERS || process.env.SLACK_CHANNEL_OPS),
      customersChannelConfigured: Boolean(process.env.SLACK_CHANNEL_CUSTOMERS || defaultChannel),
      opsChannelConfigured: Boolean(process.env.SLACK_CHANNEL_OPS || defaultChannel),
      customersChannel,
      opsChannel,
      channels: {
        customers: Boolean(customersChannel),
        ops: Boolean(opsChannel),
      },
    },
  });
});

/**
 * POST /api/slack/test
 * Admin-only endpoint to send a test notification to a topic's channel.
 */
router.post('/test', authenticate, requireAdmin, async (req: any, res) => {
  try {
    const rawTopic = req.body?.topic || 'ops';
    const topic = (rawTopic === 'system' ? 'ops' : rawTopic) as SlackTopicKey;
    await sendSlackTestNotification(req.user?.email, topic);
    const resolvedChannel = getSlackChannel(topic);
    return res.json({ success: true, message: `Slack test notification sent to channel (${resolvedChannel || 'default'}).` });
  } catch (err: any) {
    console.error('[SlackTest] Failed:', err.message || err);
    return res.status(500).json({ success: false, message: err.message || 'Slack test failed.' });
  }
});

/**
 * POST /api/slack/test-email
 * Admin-only endpoint to send a mock inbound-email notification to the customers channel.
 * Useful for verifying the email→Slack pipeline without waiting for a real inbound email.
 */
router.post('/test-email', authenticate, requireAdmin, async (req: any, res) => {
  try {
    const mockTicket = {
      id: 'test-000000',
      subject: req.body?.subject || 'Sample inbound email test',
      slackThreadTs: null,
      customer: {
        name: req.body?.name || 'Test Customer',
        email: req.body?.email || 'customer@example.com',
      },
    };
    const mockMessage = {
      content: req.body?.body || 'Hi there,\n\nThis is a <b>sample inbound email</b> sent to verify the Slack notification pipeline.\n\nCheers,\nTest Customer',
    };
    const result = await sendSupportTicketSlackNotification(mockTicket, mockMessage, true);
    if (!result?.ok) {
      return res.status(400).json({
        success: false,
        message: `Slack test email failed: ${result?.error || 'Unknown error'}. Check SLACK_BOT_TOKEN and channel permissions.`,
        error: result?.error,
        channel: result?.channel || getSlackChannel('customers'),
      });
    }
    return res.json({
      success: true,
      message: `Test email notification sent to Slack channel (${result.channel || getSlackChannel('customers')}).`,
      ts: result.ts,
      channel: result.channel,
    });
  } catch (err: any) {
    console.error('[SlackTestEmail] Failed:', err.message || err);
    return res.status(500).json({ success: false, message: err.message || 'Test email notification failed.' });
  }
});

/**
 * Verify the Slack request signature (v0 scheme) using the raw request body
 * captured by the global express.json verify hook.
 */
function verifySlackSignature(req: any): boolean {
  const signingSecret = process.env.SLACK_SIGNING_SECRET;
  // If no signing secret is configured we cannot verify — reject to be safe.
  if (!signingSecret) {
    console.warn('[SlackWebhook] SLACK_SIGNING_SECRET not set; rejecting event.');
    return false;
  }

  const timestamp = req.headers['x-slack-request-timestamp'];
  const signature = req.headers['x-slack-signature'];
  if (!timestamp || !signature) {
    console.warn('[SlackSig] Missing timestamp or signature header.');
    return false;
  }

  // Reject requests older than 5 minutes (replay protection).
  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(age) || age > 60 * 5) {
    console.warn(`[SlackSig] Request too old (age=${Math.round(age)}s). Rejecting.`);
    return false;
  }

  const rawBody: Buffer | undefined = req.rawBody;
  const body = rawBody ? rawBody.toString('utf8') : JSON.stringify(req.body);
  if (!rawBody) console.warn('[SlackSig] rawBody missing — falling back to re-serialised JSON; signature may fail.');
  const basestring = `v0:${timestamp}:${body}`;
  const expected = `v0=${crypto.createHmac('sha256', signingSecret).update(basestring).digest('hex')}`;

  try {
    const a = Buffer.from(expected);
    const b = Buffer.from(String(signature));
    const ok = a.length === b.length && crypto.timingSafeEqual(a, b);
    if (!ok) console.warn('[SlackSig] Signature mismatch. Check SLACK_SIGNING_SECRET matches your Slack app.');
    return ok;
  } catch {
    console.warn('[SlackSig] timingSafeEqual threw — buffer length mismatch?');
    return false;
  }
}

/**
 * Download a Slack file (auth-gated) and re-upload to Dropbox so the customer
 * can access it without a Slack session.
 */
async function downloadSlackFileToDropbox(
  file: any
): Promise<{ url: string; filename: string; type: string } | null> {
  const token = process.env.SLACK_BOT_TOKEN;
  if (!token) return null;
  try {
    const downloadUrl = file.url_private_download || file.url_private;
    if (!downloadUrl) return null;
    const res = await fetch(downloadUrl, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return null;
    const buffer = Buffer.from(await res.arrayBuffer());
    const result = await uploadToDropbox(buffer, file.name || 'attachment', { uploadCategory: 'support' });
    if (!result.success || !result.url) return null;
    return { url: result.url, filename: file.name || 'attachment', type: file.mimetype || '' };
  } catch (err) {
    console.error('[SlackWebhook] File re-upload failed:', err);
    return null;
  }
}

async function handleBotMention(event: any): Promise<void> {
  if (!event.text) return;

  const cleanText = event.text.replace(/<@[A-Z0-9]+>/g, '').trim().toLowerCase();

  // Command 1: start meeting [title]
  if (cleanText.includes('start meeting')) {
    const match = cleanText.match(/start meeting\s+(.+)/i);
    const title = match ? match[1].trim() : 'General Team Meeting';
    
    await broadcastMeetingCall(event.channel, 'Slack Admin', title);
    
    await postSlackRaw(event.channel, {
      text: `📞 *Starting meeting... DMs sent to all human members.*`,
      threadTs: event.ts
    });
    return;
  }

  // Command 2: schedule meeting [in X minutes / at YYYY-MM-DD HH:MM] [title]
  if (cleanText.includes('schedule meeting')) {
    let targetTime: Date | null = null;
    let title = 'Scheduled Team Meeting';

    // Try relative parsing: "in 15 minutes", "in 1 hour"
    const relativeMatch = cleanText.match(/schedule meeting\s+(?:for\s+)?in\s+(\d+)\s*(minute|min|hour|hr|day)s?/i);
    if (relativeMatch) {
      const amount = parseInt(relativeMatch[1]);
      const unit = relativeMatch[2].toLowerCase();
      const now = new Date();
      if (unit.startsWith('min')) {
        targetTime = new Date(now.getTime() + amount * 60 * 1000);
      } else if (unit.startsWith('hour') || unit.startsWith('hr')) {
        targetTime = new Date(now.getTime() + amount * 60 * 60 * 1000);
      } else if (unit.startsWith('day')) {
        targetTime = new Date(now.getTime() + amount * 24 * 60 * 60 * 1000);
      }

      const titleMatch = cleanText.match(/schedule meeting\s+(?:for\s+)?in\s+\d+\s*\w+s?\s+(?:titled\s+|for\s+)?(.+)/i);
      if (titleMatch) {
        title = titleMatch[1].trim();
      }
    }

    // Try absolute parsing: "at 2026-07-13 14:00"
    if (!targetTime) {
      const absoluteMatch = cleanText.match(/schedule meeting\s+(?:for\s+)?at\s+(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2})/i);
      if (absoluteMatch) {
        targetTime = new Date(absoluteMatch[1]);

        const titleMatch = cleanText.match(/schedule meeting\s+(?:for\s+)?at\s+\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}\s+(?:titled\s+|for\s+)?(.+)/i);
        if (titleMatch) {
          title = titleMatch[1].trim();
        }
      }
    }

    if (!targetTime) {
      await postSlackRaw(event.channel, {
        text: `❌ *Invalid schedule format.* Please use:\n* \`@clerk schedule meeting in 15 minutes [title]\`\n* \`@clerk schedule meeting at YYYY-MM-DD HH:MM [title]\``,
        threadTs: event.ts
      });
      return;
    }

    await prisma.scheduledMeeting.create({
      data: {
        title,
        time: targetTime,
        channelId: event.channel,
      }
    });

    await postSlackRaw(event.channel, {
      text: `🗓️ *Meeting Scheduled successfully!*\n*Title:* ${title}\n*Time:* ${targetTime.toLocaleString()}`,
      threadTs: event.ts
    });
    return;
  }

  // Help fallback
  await postSlackRaw(event.channel, {
    text: `👋 Hello! I can help you trigger team video calls. Try saying:\n* \`@clerk start meeting [Meeting Name]\`\n* \`@clerk schedule meeting in 30 minutes [Meeting Name]\`\n* \`@clerk schedule meeting at YYYY-MM-DD HH:MM [Meeting Name]\``,
    threadTs: event.ts
  });
}

/**
 * Process a Slack event asynchronously (after the request has been ack'd).
 * Routes admin thread replies in the chat channel back to the customer.
 */
async function handleSlackEvent(body: any): Promise<void> {
  if (body.type !== 'event_callback' || !body.event) return;
  const event = body.event;

  console.log(`[SlackEvent] type=${event.type} subtype=${event.subtype || 'none'} channel=${event.channel} thread_ts=${event.thread_ts || 'none'} bot_id=${event.bot_id || 'none'}`);

  // Handle bot mentions (app_mention or messages containing bot user ID)
  const isAppMention = event.type === 'app_mention';
  const isMessageWithBotMention = event.type === 'message' && event.text && event.text.includes(`<@${body.authorizations?.[0]?.user_id || ''}>`);

  if (isAppMention || isMessageWithBotMention) {
    if (event.bot_id) return;
    await handleBotMention(event);
    return;
  }

  // Only handle plain user messages that are threaded replies.
  if (event.type !== 'message') { console.log('[SlackEvent] Ignoring: not a message event.'); return; }
  if (event.bot_id) { console.log('[SlackEvent] Ignoring: bot message.'); return; }
  if (event.subtype && event.subtype !== 'file_share') { console.log(`[SlackEvent] Ignoring: subtype=${event.subtype}`); return; }
  if (!event.thread_ts || event.thread_ts === event.ts) { console.log('[SlackEvent] Ignoring: not a thread reply (top-level message).'); return; }
  if (!event.text && !(event.files?.length)) { console.log('[SlackEvent] Ignoring: no text or files.'); return; }

  // Verify the event channel is one of our configured channels.
  const configuredChannels = new Set(
    (['customers', 'ops'] as SlackTopicKey[])
      .map(t => getSlackChannel(t))
      .filter(Boolean)
  );

  console.log(`[SlackEvent] Configured channels: ${[...configuredChannels].join(', ')}`);

  if (event.channel && !configuredChannels.has(event.channel)) {
    console.warn(`[SlackEvent] Ignoring: channel ${event.channel} is not a configured channel.`);
    return;
  }

  // Download any attached files so we can forward them to the customer
  const slackFileAttachments = event.files?.length
    ? (await Promise.all((event.files as any[]).map(downloadSlackFileToDropbox))).filter(Boolean) as Array<{ url: string; filename: string; type: string }>
    : [];

  const conversationId = await resolveConversationBySlackThread(event.thread_ts);
  if (conversationId) {
    // Remove ✅ and 👁️ from the previous admin message before saving the new one
    const prevAdminMsg = await prisma.message.findFirst({
      where: { conversationId, role: 'assistant', slackMessageTs: { not: null } },
      orderBy: { createdAt: 'desc' },
    });
    if (prevAdminMsg?.slackMessageTs) {
      const prevMeta = (() => { try { return JSON.parse(prevAdminMsg.metadata || '{}'); } catch { return {}; } })();
      if (prevMeta.slackChannel) {
        await Promise.all([
          removeSlackReaction(prevMeta.slackChannel, prevAdminMsg.slackMessageTs, 'white_check_mark'),
          removeSlackReaction(prevMeta.slackChannel, prevAdminMsg.slackMessageTs, 'eyes'),
        ]);
      }
    }

    // Pass slackMessageTs + slackChannel at creation time so they're set before SSE fires
    await sendAdminReplyToUser(
      conversationId,
      event.text || '',
      'slack',
      slackFileAttachments.length ? slackFileAttachments : undefined,
      { slackMessageTs: event.ts, slackChannel: event.channel }
    );

    // ✅ reaction on the admin's own message = delivered to customer
    await addSlackReaction(event.channel, event.ts, 'white_check_mark');
    console.log(`[SlackWebhook] Forwarded reply for conv ${conversationId}`);
    return;
  }

  // Check if this thread TS belongs to a SupportTicket
  console.log(`[SlackEvent] Looking up support ticket for thread_ts=${event.thread_ts}`);
  const ticket = await prisma.supportTicket.findFirst({
    where: { slackThreadTs: event.thread_ts },
    include: {
      customer: true,
      messages: { orderBy: { createdAt: 'asc' } },
    },
  });

  if (ticket) {
    console.log(`[SlackEvent] Found ticket id=${ticket.id} subject="${ticket.subject}" customer=${ticket.customer?.email}`);
    const toEmail = ticket.customer?.contactEmail || ticket.customer?.email;
    if (!toEmail) {
      console.warn(`[SlackWebhook] No contact email for ticket customer on thread ${event.thread_ts}`);
      return;
    }
    console.log(`[SlackEvent] Will send email reply to ${toEmail}`);

    const cleanText = (event.text || '').trim();

    // SCENARIO 1: Approve and send current draft
    if (cleanText.toLowerCase() === '/send') {
      const activeDraft = ticket.slackDraft;
      if (!activeDraft) {
        await postSlackRaw(event.channel, {
          text: `⚠️ *No active draft found.* Write \`ai: <notes>\` to generate a draft first.`,
          threadTs: event.thread_ts,
        });
        return;
      }

      // Save reply message in database
      const reply = await prisma.supportMessage.create({
        data: {
          ticketId: ticket.id,
          content: activeDraft,
          senderId: 'slack-admin',
          senderRole: 'admin',
        },
      });

      // Update ticket status and clear draft
      await prisma.supportTicket.update({
        where: { id: ticket.id },
        data: { status: 'in_progress', updatedAt: new Date(), slackDraft: null },
      });

      // Format and send email reply
      const generatedMsgId = `<support-${Date.now()}-${crypto.randomBytes(6).toString('hex')}@reframevisuals.com>`;
      const lastMessage = ticket.messages[ticket.messages.length - 1];
      const references = [ticket.threadId, lastMessage?.smtpMessageId].filter(Boolean).join(' ') || undefined;

      const sent = await emailService.sendEmailWithHeaders(
        toEmail,
        `Re: ${ticket.subject}`,
        sanitize(activeDraft).replace(/\n/g, '<br/>'),
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
        await cache.set(`email:slack-ts:${generatedMsgId}`, { ts: event.ts, channel: event.channel }, 60 * 60 * 24 * 7);
        await addSlackReaction(event.channel, event.ts, 'white_check_mark');
        console.log(`[SlackWebhook] Sent email reply to ${toEmail} for ticket ${ticket.id}`);
      } else {
        await addSlackReaction(event.channel, event.ts, 'x');
        console.error(`[SlackWebhook] Failed to send email reply for ticket ${ticket.id}`);
      }
      return;
    }

    // SCENARIO 2: AI Draft Generation or Refinement
    if (cleanText.toLowerCase().startsWith('ai:') || cleanText.toLowerCase().startsWith('draft:')) {
      const prefix = cleanText.toLowerCase().startsWith('ai:') ? 'ai:' : 'draft:';
      const notes = cleanText.substring(prefix.length).trim();

      if (!notes) {
        await postSlackRaw(event.channel, {
          text: `⚠️ Please provide some rough notes or instructions after the prefix (e.g. \`ai: tell them we received their files\`).`,
          threadTs: event.thread_ts,
        });
        return;
      }

      try {
        // Send a temporary "thinking" status update so user knows the bot is working
        await postSlackRaw(event.channel, {
          text: `✍️ _Drafting email response..._`,
          threadTs: event.thread_ts,
        });

        const generatedDraft = await generateSupportEmailDraft(
          ticket,
          ticket.messages,
          notes,
          ticket.slackDraft
        );

        // Update database with the new draft
        await prisma.supportTicket.update({
          where: { id: ticket.id },
          data: { slackDraft: generatedDraft },
        });

        // Post generated draft
        await postSlackRaw(event.channel, {
          text: `🤖 *AI Draft Generated:*\n\n${generatedDraft}\n\n_To send this email, reply with \`/send\`. To refine it further, reply with \`ai: <instruction>\`._`,
          threadTs: event.thread_ts,
        });
      } catch (err: any) {
        console.error('[SlackWebhook] AI drafting failed:', err.message || err);
        await postSlackRaw(event.channel, {
          text: `❌ *AI Drafting Failed:* ${err.message || 'unknown error'}. You can still reply directly by typing a raw message.`,
          threadTs: event.thread_ts,
        });
      }
      return;
    }

    // SCENARIO 3: Direct Raw Reply (Default)
    const replyContent = cleanText || (slackFileAttachments.length ? `Sent ${slackFileAttachments.length} file(s)` : '');

    // 1. Save reply message in database
    const reply = await prisma.supportMessage.create({
      data: {
        ticketId: ticket.id,
        content: replyContent,
        senderId: 'slack-admin',
        senderRole: 'admin',
      },
    });

    // Update ticket status
    await prisma.supportTicket.update({
      where: { id: ticket.id },
      data: { status: 'in_progress', updatedAt: new Date() },
    });

    // 2. Format and send email reply (include file links if any)
    const generatedMsgId = `<support-${Date.now()}-${crypto.randomBytes(6).toString('hex')}@reframevisuals.com>`;
    const lastMessage = ticket.messages[ticket.messages.length - 1];
    const references = [ticket.threadId, lastMessage?.smtpMessageId].filter(Boolean).join(' ') || undefined;

    const fileLinksHtml = slackFileAttachments.length
      ? '<br/><br/>' + slackFileAttachments.map(a => `📎 <a href="${a.url}">${a.filename}</a>`).join('<br/>')
      : '';
    const emailBody = sanitize(cleanText).replace(/\n/g, '<br/>') + fileLinksHtml;

    const sent = await emailService.sendEmailWithHeaders(
      toEmail,
      `Re: ${ticket.subject}`,
      emailBody,
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
      await cache.set(`email:slack-ts:${generatedMsgId}`, { ts: event.ts, channel: event.channel }, 60 * 60 * 24 * 7);
      await addSlackReaction(event.channel, event.ts, 'white_check_mark');
      console.log(`[SlackWebhook] Sent raw email reply to ${toEmail} for ticket ${ticket.id}`);
    } else {
      await addSlackReaction(event.channel, event.ts, 'x');
      console.error(`[SlackWebhook] Failed to send raw email reply for ticket ${ticket.id}`);
    }
    return;
  }

  console.warn(`[SlackWebhook] No conversation or support ticket matched thread_ts=${event.thread_ts}. The ticket's slackThreadTs may not have been saved — check the DB.`);
}

/**
 * POST /api/slack/events
 * Slack Events API endpoint. Handles the URL-verification challenge and
 * routes admin thread replies in the chat channel back to the customer.
 */
router.post('/events', (req, res) => {
  const body = req.body || {};

  // URL verification handshake (sent when configuring the Request URL).
  // Answered before signature verification so the endpoint can be verified at
  // app-creation time, before SLACK_SIGNING_SECRET is deployed. The challenge
  // only echoes a random string Slack sent, so this leaks nothing; all real
  // events below still require a valid signature.
  if (body.type === 'url_verification') {
    return res.json({ challenge: body.challenge });
  }

  if (!verifySlackSignature(req)) {
    console.warn('[SlackWebhook] Signature verification failed.');
    return res.sendStatus(403);
  }

  // Acknowledge immediately (Slack retries if not answered within 3s), then process.
  void handleSlackEvent(body).catch((err) => console.error('[SlackWebhook] Error processing event:', err));
  return res.sendStatus(200);
});

export default router;
