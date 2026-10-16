import { Router } from 'express';
import {
  sendAdminReplyToUser,
  sendTelegramTestNotification,
  isTelegramConfigured,
  getTelegramTopicStatus,
  isTelegramTopicAllowedForReplies,
  TelegramTopicKey,
} from '../services/telegramService';
import { prisma } from '../database';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

/**
 * GET /api/telegram/status
 * Admin-only health check for the Telegram notification integration.
 */
router.get('/status', authenticate, requireAdmin, (_req, res) => {
  return res.json({
    success: true,
    data: {
      configured: isTelegramConfigured(),
      webhookSecretConfigured: Boolean(process.env.TELEGRAM_WEBHOOK_SECRET),
      adminChatConfigured: Boolean(process.env.TELEGRAM_ADMIN_CHAT_ID),
      botTokenConfigured: Boolean(process.env.TELEGRAM_BOT_TOKEN),
      topics: getTelegramTopicStatus(),
    },
  });
});

/**
 * POST /api/telegram/test
 * Admin-only endpoint to send a test notification to the configured admin chat.
 */
router.post('/test', authenticate, requireAdmin, async (req: any, res) => {
  try {
    const topic = (req.body?.topic || 'system') as TelegramTopicKey;
    await sendTelegramTestNotification(req.user?.email, topic);
    return res.json({ success: true, message: 'Telegram test notification sent.' });
  } catch (err: any) {
    console.error('[TelegramTest] Failed:', err.message || err);
    return res.status(500).json({ success: false, message: err.message || 'Telegram test failed.' });
  }
});

/**
 * POST /api/telegram/webhook
 * Receives updates from Telegram (messages, replies, etc.)
 */
router.post('/webhook', async (req, res) => {
  // Verify Telegram Secret Token if configured
  const secretToken = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (secretToken && req.headers['x-telegram-bot-api-secret-token'] !== secretToken) {
    console.warn('[TelegramWebhook] Unauthorized webhook attempt.');
    return res.sendStatus(403);
  }

  const { message } = req.body;

  // 1. Basic validation: must be a reply in the admin group
  if (!message || !message.reply_to_message || !message.text) {
    return res.sendStatus(200); // Always return 200 to Telegram
  }

  const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
  if (adminChatId && String(message.chat?.id) !== adminChatId) {
    console.warn(`[TelegramWebhook] Ignored message from unauthorized chat: ${message.chat?.id}`);
    return res.sendStatus(200);
  }

  if (!isTelegramTopicAllowedForReplies(message.message_thread_id)) {
    console.warn(`[TelegramWebhook] Ignored reply from non-chat topic: ${message.message_thread_id || 'none'}`);
    return res.sendStatus(200);
  }

  const replyToId = String(message.reply_to_message.message_id);
  const adminReplyText = message.text;

  try {
    // 2. Find the original message we are replying to. 
    // We look for a message in the DB that has this telegramMessageId.
    const originalMessage = await prisma.message.findFirst({
      where: { telegramMessageId: replyToId },
      include: { conversation: true }
    });

    if (originalMessage) {
      // Save the admin reply back to our DB (this also sets isEscalated: true)
      await sendAdminReplyToUser(originalMessage.conversationId, adminReplyText);
      console.log(`[TelegramWebhook] Forwarded reply for conv ${originalMessage.conversationId}`);
    } else {
      // Maybe it was a reply to the initial "New Chat" alert?
      const conversation = await prisma.conversation.findFirst({
        where: { telegramThreadId: replyToId }
      });

      if (conversation) {
        await sendAdminReplyToUser(conversation.id, adminReplyText);
        console.log(`[TelegramWebhook] Forwarded reply (thread anchor) for conv ${conversation.id}`);
      } else {
        // 3. Last check: Was it a reply to a CUSTOMER master thread?
        const customer = await prisma.customer.findFirst({
          where: { telegramThreadId: replyToId },
          include: { conversations: { orderBy: { createdAt: 'desc' }, take: 1 } }
        });

        if (customer && customer.conversations.length > 0) {
          const latestConvId = customer.conversations[0].id;
          await sendAdminReplyToUser(latestConvId, adminReplyText);
          console.log(`[TelegramWebhook] Forwarded reply (customer anchor) for conv ${latestConvId}`);
        } else {
          console.warn(`[TelegramWebhook] Received reply to unknown message ID: ${replyToId}`);
        }
      }
    }
  } catch (err) {
    console.error('[TelegramWebhook] Error processing webhook:', err);
  }

  return res.sendStatus(200);
});

export default router;
