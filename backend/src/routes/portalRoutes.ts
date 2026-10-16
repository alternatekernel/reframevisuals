import { Router } from 'express';
import multer from 'multer';
import { 
  portalLogin,
  portalRegister,
  portalGoogleAuth,
  portalLogout, 
  getPortalMe,
  updatePortalProfile,
  deletePortalProfile,
} from '../controllers/portal/portalAuthController';
import { 
  handlePortalChat,
  getConversations, 
  getConversationDetails,
  escalateChat
} from '../controllers/portal/portalChatController';
import { 
  getBillingProfile,
  getInvoices
} from '../controllers/portal/portalBillingController';
import * as portalAssetController from '../controllers/portal/portalAssetController';
import * as portalActivityController from '../controllers/portal/portalActivityController';
import { protectPortal, optionalPortalAuth, isGuestIdFormat } from '../middleware/portalMiddleware';
import { uploadLimiter, authLimiter, chatLimiter } from '../middleware/rateLimiter';
import { prisma } from '../database';
import { uploadToDropbox, cleanupDropboxFolder, purgeOldGuestFolders, getDropboxFolderLink, createDirectUploadLink, finalizeDirectUpload, uploadFolderFor } from '../services/dropboxService';
import { fireOrderNotifications, fireInquiryNotification, fireGuestChatNotification } from '../services/notificationService';
import { captureGuestEmail, ensureLead } from '../services/guestLeadService';
import { authenticate, requireAdmin } from '../middleware/auth';
import { safeError } from '../utils/errors';
import { sendFeedbackTelegramNotification } from '../services/telegramService';
import { sendFeedbackDiscordNotification } from '../services/discordService';
import { sendFeedbackSlackNotification, addSlackReaction, removeSlackReaction } from '../services/slackService';
import { emailService } from '../services/emailService';
import { markCustomerActive } from '../utils/presence';
import { handleFreeTrialSubmission } from '../controllers/portal/freeTrialController';
import { handlePilotBatchSubmission } from '../controllers/portal/pilotBatchController';
import { getConversationRealtimeState, setCustomerSeenState, setTypingState } from '../services/chatRealtimeState';
import { buildSeenStatusPatch, buildDeliveredStatusPatch } from '../services/messageStatusService';
import { broadcastChatEvent } from '../services/chatSseService';
import { publishRealtime, realtimeSubscription } from '../services/realtimeService';

const router = Router();

const asString = (value: unknown, max = 500) =>
  typeof value === 'string' ? value.trim().slice(0, max) : undefined;

const asStringArray = (value: unknown, maxItems = 20, maxLength = 80) =>
  Array.isArray(value)
    ? value
        .filter((item): item is string => typeof item === 'string')
        .map(item => item.trim().slice(0, maxLength))
        .filter(Boolean)
        .slice(0, maxItems)
    : [];

const asPositiveInt = (value: unknown, fallback = 0, max = 10000) => {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return fallback;
  return Math.min(Math.floor(n), max);
};

// Guest IDs arrive as an unsigned header, so they must match a guest-shaped
// format — a registered customer's cuid must never be accepted as one.
const isSafeGuestId = isGuestIdFormat;


/**
 * Order assets live in Dropbox and their stored `url` is a share link that does not
 * serve image bytes. Expose a same-origin proxy URL instead so thumbnails render.
 */
const withAssetPreviewUrls = <T extends { id: string; images?: any[] }>(order: T) => ({
  ...order,
  images: (order.images || []).map((image: any) => ({
    ...image,
    previewUrl: image.path || image.url
      ? `/api/portal/orders/${order.id}/assets/${image.id}/raw`
      : null,
  })),
});

const isSafeOrderCode = (value: unknown): value is string =>
  typeof value === 'string' && /^RF-[A-Z2-9]{6}$/.test(value);

const isValidSourceUrl = (value: string) => {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

// Escalation
router.post('/chat/escalate', optionalPortalAuth, escalateChat);

router.get('/chat/support-availability', optionalPortalAuth, async (_req: any, res) => {
  try {
    const [availableAgents, pendingTickets] = await Promise.all([
      prisma.user.count({
        where: {
          role: { in: ['admin', 'support'] },
        },
      }),
      prisma.supportTicket.count({
        where: {
          status: { in: ['open', 'pending'] },
        },
      }),
    ]);
    return res.json({
      success: true,
      data: { availableAgents, pendingTickets },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: safeError(error) });
  }
});



// Simple test route FIRST
router.get('/test', (_req, res) => {
  return res.json({ message: 'Router is working NOW' });
});

// Lead capture / Navigation contact form
router.post('/inquiry', async (req: any, res) => {
  try {
    const { email, metadata } = req.body;
    const rawGuestId = req.headers['x-guest-id'];
    const guestId = isSafeGuestId(rawGuestId) ? rawGuestId : undefined;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, message: 'Invalid email address' });
    }

    const enhancedMetadata = { ...metadata };

    // Identity linking + lead creation are shared with the in-chat capture path so
    // both produce the same Customer/Lead result. See services/guestLeadService.ts.
    if (guestId) {
      const captured = await captureGuestEmail(guestId, email, { source: 'inquiry' });
      if (captured.conversationId) {
        enhancedMetadata.conversationId = captured.conversationId;
      }
    } else {
      // No guest identity to link (contact page, pricing CTA, …) — still record the lead.
      ensureLead(email, { source: 'inquiry' })
        .catch(err => console.warn('[Inquiry] Failed to create lead:', err));
    }

    // Fire notifications (Email + Telegram)
    fireInquiryNotification(email, enhancedMetadata);

    return res.json({ 
      success: true, 
      message: 'Inquiry received. Notifications fired.' 
    });
  } catch (error: any) {
    console.error('[Inquiry] Error:', error.message);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Multer config — memory storage with strict MIME + size limits
const PORTAL_MAX_FILE_SIZE = parseInt(process.env.PORTAL_MAX_FILE_SIZE || String(50 * 1024 * 1024), 10); // 50MB default
const PORTAL_MAX_FILES = parseInt(process.env.PORTAL_MAX_FILES || '3', 10);

const uploadMiddleware = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_req: any, file: any, cb: any) => {
    const allowedMimes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'image/tiff',
      'image/vnd.adobe.photoshop', // PSD
      'image/x-canon-cr2',         // Canon RAW
      'image/x-nikon-nef',         // Nikon RAW
      'image/x-adobe-dng',         // Adobe DNG
      'image/x-raw',               // Generic RAW
      'application/pdf',
    ];

    if (!allowedMimes.includes(file.mimetype)) {
      return cb(new Error(`Invalid file type: ${file.mimetype}`), false);
    }

    cb(null, true);
  },
  limits: {
    fileSize: PORTAL_MAX_FILE_SIZE,
    files: PORTAL_MAX_FILES,
  },
});

router.post('/freetrial', uploadLimiter, uploadMiddleware.array('files', 3), handleFreeTrialSubmission);

// Pilot batch upload — separate multer instance (15 main + 10 support files)
const pilotBatchUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_req: any, file: any, cb: any) => {
    const allowedMimes = [
      'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/tiff',
      'image/vnd.adobe.photoshop', 'image/x-canon-cr2', 'image/x-nikon-nef',
      'image/x-adobe-dng', 'image/x-raw', 'application/pdf',
    ];
    if (!allowedMimes.includes(file.mimetype)) return cb(new Error(`Invalid file type: ${file.mimetype}`), false);
    cb(null, true);
  },
  limits: { fileSize: PORTAL_MAX_FILE_SIZE, files: 25 },
});
router.post('/pilot-batch', uploadLimiter, optionalPortalAuth, pilotBatchUpload.fields([
  { name: 'mainFiles', maxCount: 15 },
  { name: 'supportFiles', maxCount: 10 },
]), handlePilotBatchSubmission);

// Upload endpoint
// - No file size limit (PSD / TIFF / RAW files can be very large)
// - optionalPortalAuth gives us customer info for logged-in users
// - X-Project-Name header used to create a human-readable Dropbox subfolder
router.post('/upload', uploadLimiter, optionalPortalAuth, uploadMiddleware.single('file'), async (req: any, res) => {
  try {
    if (req.portalTokenExpired) {
      return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file provided' });
    }

    const rawGuestId = req.headers['x-guest-id'];
    const guestId = isSafeGuestId(rawGuestId) ? rawGuestId : undefined;
    let customerCode: string | undefined;
    const requestedOrderCode = req.headers['x-order-code'];
    const orderCode = isSafeOrderCode(requestedOrderCode) ? requestedOrderCode : undefined;

    if (req.customer?.id && !req.customer?.isGuest) {
      const customer = await prisma.customer.findUnique({
        where: { id: req.customer.id },
        select: { customerNumber: true }
      });
      if (customer?.customerNumber) customerCode = `CLT${String(customer.customerNumber).padStart(3, '0')}`;
    }

    if (!req.customer?.id && !guestId) {
      return res.status(401).json({ success: false, message: 'Valid identity required' });
    }

    const result = await uploadToDropbox(req.file.buffer, req.file.originalname, {
      guestId,
      customerCode,
      orderCode,
      uploadCategory: (req.headers['x-upload-category'] as 'original' | 'support' | undefined) || 'original',
    });

    if (!result.success) {
      console.error('[Upload] Dropbox error:', result.error);
      return res.status(500).json({ success: false, message: 'File upload failed. Please try again.' });
    }


    // Upload record is stored via Cloudinary/Dropbox. No local DB record needed.

    return res.json({
      success: true,
      data: {
        url:        result.url,
        path:       result.path,
        folderPath: result.folderPath, // returned so frontend can pass it for cleanup
        filename:   req.file.originalname,
        size:       req.file.size,
      },
    });
  } catch (error: any) {
    console.error('[Upload] Error:', error.message || 'Unknown error');
    return res.status(500).json({ success: false, message: safeError(error) });
  }
});

// ─── Direct-to-Dropbox uploads (large files bypass the serverless body limit) ──
// 1) /upload/init   → short-lived Dropbox upload link for this identity's folder
// 2) browser POSTs the raw file to that link
// 3) /upload/complete → verifies the path and returns the shared link (same shape as /upload)
async function resolveUploadIdentity(req: any, res: any) {
  if (req.portalTokenExpired) {
    res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
    return null;
  }
  const guestId = isSafeGuestId(req.headers['x-guest-id']) ? (req.headers['x-guest-id'] as string) : undefined;
  const orderCode = isSafeOrderCode(req.headers['x-order-code']) ? (req.headers['x-order-code'] as string) : undefined;
  let customerCode: string | undefined;
  if (req.customer?.id && !req.customer?.isGuest) {
    const customer = await prisma.customer.findUnique({ where: { id: req.customer.id }, select: { customerNumber: true } });
    if (customer?.customerNumber) customerCode = `CLT${String(customer.customerNumber).padStart(3, '0')}`;
  }
  if (!req.customer?.id && !guestId) {
    res.status(401).json({ success: false, message: 'Valid identity required' });
    return null;
  }
  const uploadCategory = (req.headers['x-upload-category'] === 'support' ? 'support' : 'original') as 'original' | 'support';
  return { guestId, customerCode, orderCode, uploadCategory };
}

router.post('/upload/init', uploadLimiter, optionalPortalAuth, async (req: any, res) => {
  try {
    const identity = await resolveUploadIdentity(req, res);
    if (!identity) return undefined;
    const { filename, size } = req.body || {};
    if (!filename || typeof filename !== 'string') {
      return res.status(400).json({ success: false, message: 'filename required' });
    }
    const maxBytes = Number(process.env.PORTAL_DIRECT_UPLOAD_MAX_BYTES || 2 * 1024 * 1024 * 1024);
    if (typeof size === 'number' && size > maxBytes) {
      return res.status(413).json({ success: false, message: 'File is too large.' });
    }
    const { uploadUrl, folderPath, path } = await createDirectUploadLink(filename, identity);
    return res.json({ success: true, data: { uploadUrl, folderPath, path } });
  } catch (error: any) {
    console.error('[Upload] init error:', error.message || 'Unknown error');
    return res.status(500).json({ success: false, message: 'File upload failed. Please try again.' });
  }
});

router.post('/upload/complete', uploadLimiter, optionalPortalAuth, async (req: any, res) => {
  try {
    const identity = await resolveUploadIdentity(req, res);
    if (!identity) return undefined;
    const { path, filename, size } = req.body || {};
    const expectedFolder = uploadFolderFor(identity).toLowerCase() + '/';
    if (typeof path !== 'string' || !path.toLowerCase().startsWith(expectedFolder) || path.includes('..')) {
      return res.status(400).json({ success: false, message: 'Invalid upload path' });
    }
    let done;
    try {
      done = await finalizeDirectUpload(path);
    } catch {
      return res.status(400).json({ success: false, message: 'Upload not found. Please try again.' });
    }
    return res.json({
      success: true,
      data: { url: done.url, path: done.path, folderPath: uploadFolderFor(identity), filename, size },
    });
  } catch (error: any) {
    console.error('[Upload] complete error:', error.message || 'Unknown error');
    return res.status(500).json({ success: false, message: safeError(error) });
  }
});

// Debug route to test
router.get('/test-upload', (_req, res) => {
  return res.json({ message: 'Test route works!' });
});

// Auth routes
router.post('/auth/login', authLimiter, portalLogin);
router.post('/auth/register', authLimiter, portalRegister);
router.post('/auth/google', authLimiter, portalGoogleAuth);
router.post('/auth/logout', optionalPortalAuth, portalLogout);
router.get('/auth/me', optionalPortalAuth, getPortalMe);
router.get('/profile', optionalPortalAuth, getPortalMe);
router.put('/profile', optionalPortalAuth, updatePortalProfile);
router.delete('/profile', optionalPortalAuth, deletePortalProfile);

// ─── Helper: Generate Randomized Tracking ID ──────────────────────────────────
// Randomized IDs (RF-XXXX) prevent competitors from guessing project volume.
const generateOrderCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluded confusing chars like I, O, 0, 1
  let code = 'RF-';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// ─── Reserve an order code before uploading files ─────────────────────────────
router.post('/orders/reserve', uploadLimiter, async (_req: any, res) => {
  try {
    const orderCode = generateOrderCode();
    return res.json({ success: true, data: { orderCode } });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: safeError(error) });
  }
});

// Chat routes
router.get('/conversations', optionalPortalAuth, getConversations);
router.get('/conversations/:id', optionalPortalAuth, getConversationDetails);
router.get('/conversations/:id/realtime', optionalPortalAuth, async (req: any, res) => {
  try {
    const { id } = req.params;
    // optionalPortalAuth already resolved identity (verified token, or a
    // format-checked guest ID). Re-reading the raw header here would let a
    // caller pass another customer's ID and read their conversation.
    const customerId = req.customer?.id;
    if (!customerId) return res.status(401).json({ success: false, message: 'Identity required' });

    const conversation = await prisma.conversation.findFirst({
      where: { id, customerId }
    });
    if (!conversation) return res.status(404).json({ success: false, message: 'Conversation not found' });

    // Non-blocking status update: mark messages delivered without stalling the poll response
    prisma.message.updateMany({
      where: { conversationId: id, role: 'assistant', status: 'sent' },
      data: buildDeliveredStatusPatch(),
    }).catch(() => {});

    return res.json({ success: true, data: await getConversationRealtimeState(id) });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: safeError(error) });
  }
});
router.post('/conversations/:id/seen', optionalPortalAuth, async (req: any, res) => {
  try {
    const { id } = req.params;
    const { messageId } = req.body || {};
    // optionalPortalAuth already resolved identity (verified token, or a
    // format-checked guest ID). Re-reading the raw header here would let a
    // caller pass another customer's ID and read their conversation.
    const customerId = req.customer?.id;
    if (!customerId) return res.status(401).json({ success: false, message: 'Identity required' });
    if (!messageId || typeof messageId !== 'string') {
      return res.status(400).json({ success: false, message: 'messageId required' });
    }

    const conversation = await prisma.conversation.findFirst({
      where: { id, customerId }
    });
    if (!conversation) return res.status(404).json({ success: false, message: 'Conversation not found' });

    const [seenMessage] = await Promise.all([
      prisma.message.findFirst({ where: { id: messageId, conversationId: id, role: 'assistant' } }),
      prisma.message.updateMany({
        where: { id: messageId, conversationId: id, role: 'assistant' },
        data: buildSeenStatusPatch(),
      }),
    ]);

    // 👁️ reaction on admin's Slack message when customer reads it (only on the latest)
    if (seenMessage?.slackMessageTs) {
      const meta = (() => { try { return JSON.parse(seenMessage.metadata || '{}'); } catch { return {}; } })();
      if (meta.slackChannel) {
        // Remove 👁️ from previous admin message first
        const prevAdminMsg = await prisma.message.findFirst({
          where: { conversationId: id, role: 'assistant', slackMessageTs: { not: null }, id: { not: messageId } },
          orderBy: { createdAt: 'desc' },
        });
        if (prevAdminMsg?.slackMessageTs) {
          const prevMeta = (() => { try { return JSON.parse(prevAdminMsg.metadata || '{}'); } catch { return {}; } })();
          if (prevMeta.slackChannel) {
            removeSlackReaction(prevMeta.slackChannel, prevAdminMsg.slackMessageTs, 'eyes').catch(() => {});
          }
        }
        // Remove ✅ (delivered) and replace with 👁️ (seen) — like WhatsApp
        removeSlackReaction(meta.slackChannel, seenMessage.slackMessageTs, 'white_check_mark').catch(() => {});
        addSlackReaction(meta.slackChannel, seenMessage.slackMessageTs, 'eyes').catch(() => {});
      }
    }

    markCustomerActive(customerId);
    setCustomerSeenState(id, messageId);
    return res.json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: safeError(error) });
  }
});
router.post('/conversations/:id/typing', optionalPortalAuth, async (req: any, res) => {
  try {
    const { id } = req.params;
    const { isTyping } = req.body || {};
    // optionalPortalAuth already resolved identity (verified token, or a
    // format-checked guest ID). Re-reading the raw header here would let a
    // caller pass another customer's ID and read their conversation.
    const customerId = req.customer?.id;
    if (!customerId) return res.status(401).json({ success: false, message: 'Identity required' });

    const conversation = await prisma.conversation.findFirst({
      where: { id, customerId }
    });
    if (!conversation) return res.status(404).json({ success: false, message: 'Conversation not found' });

    markCustomerActive(customerId);
    setTypingState(id, 'customer', Boolean(isTyping));
    broadcastChatEvent(id, 'typing', { role: 'user', isTyping: Boolean(isTyping) });
    return res.json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: safeError(error) });
  }
});
router.post('/presence', optionalPortalAuth, async (req: any, res) => {
  try {
    const customerId = req.customer?.id;
    if (!customerId) return res.json({ success: true, active: false });
    const record = markCustomerActive(customerId, req.body?.path);
    return res.json({ success: true, active: true, lastActiveAt: record.lastActiveAt });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: safeError(error) });
  }
});
router.get('/health', (_req, res) => res.json({ 
  status: 'online', 
  timestamp: new Date().toISOString()
}));
router.get('/test', (_req, res) => {
  return res.json({ success: true, message: 'Portal routes working!' });
});

router.post('/chat', optionalPortalAuth, chatLimiter, handlePortalChat);

// Inline contact-capture card in the chat widget. Mirrors the typed-email path in
// portalChatController so both leave the same Customer, Lead and transcript.
router.post('/chat/capture-email', optionalPortalAuth, chatLimiter, async (req: any, res) => {
  try {
    const { conversationId, email } = req.body || {};

    // Identity comes from optionalPortalAuth only — never the raw x-guest-id header,
    // which is unsigned and could name any customer.
    const customerId = req.customer?.id;
    if (!customerId) {
      return res.status(401).json({ success: false, message: 'Identity required' });
    }

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ success: false, message: 'Invalid email address' });
    }
    if (!conversationId || typeof conversationId !== 'string') {
      return res.status(400).json({ success: false, message: 'conversationId required' });
    }

    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [{ customerId }, { guestId: customerId }],
      },
      include: { messages: { orderBy: { createdAt: 'asc' }, take: 1 } },
    });

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    const firstMessage = conversation.messages[0]?.content?.slice(0, 300);
    await captureGuestEmail(customerId, email, { source: 'chat', conversationId, firstMessage });
    fireGuestChatNotification(conversationId, email, { firstMessage });

    // Same acknowledgement the typed-email path produces, so the transcript matches.
    const savedBotMessage = await prisma.message.create({
      data: {
        conversationId,
        role: 'assistant',
        content:
          "Got it — your email has been saved. 🙏 Our team will follow up with you there if needed. Please stay patient while a human agent reviews your message.",
        status: 'sent',
        metadata: JSON.stringify({ suggestedActions: [], requestContact: false }),
      },
    });

    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    broadcastChatEvent(conversationId, 'new_message', { message: savedBotMessage });

    return res.json({ success: true, data: { message: savedBotMessage } });
  } catch (error: any) {
    console.error('[CaptureEmail] Error:', error?.message || error);
    return res.status(500).json({ success: false, message: safeError(error) });
  }
});

router.post('/chat/escalate', optionalPortalAuth, escalateChat);
router.delete('/conversations/:id', optionalPortalAuth, async (req: any, res) => {
  try {
    const { id } = req.params;
    const customerId = req.customer?.id;
    if (!customerId) {
      return res.status(401).json({ success: false, message: 'Identity required' });
    }

    // Check ownership against the resolved identity only.
    const conversation = await prisma.conversation.findFirst({
      where: {
        id,
        OR: [
          { customerId },
          { guestId: customerId },
        ],
      },
    });

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    await prisma.conversation.delete({ where: { id } });
    return res.json({ success: true, message: 'Conversation deleted' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: safeError(error) });
  }
});

// Pagination Helper
const getPagination = (query: any) => {
  const page = parseInt(query.page as string) || 1;
  const limit = parseInt(query.limit as string) || 20;
  const skip = (page - 1) * limit;
  return { skip, take: limit, page, limit };
};

const getEffectivePortalCustomerId = async (req: any, createGuest = false): Promise<string | undefined> => {
  if (req.customer?.id && !req.customer?.isGuest) return req.customer.id;

  const rawGuestId = req.headers['x-guest-id'];
  const guestId = isSafeGuestId(rawGuestId) ? rawGuestId : undefined;
  if (!guestId) return undefined;

  let guest = await prisma.customer.findFirst({
    where: { email: `guest-${guestId}@reframe.ai` },
    select: { id: true }
  });

  if (!guest && createGuest) {
    guest = await prisma.customer.upsert({
      where: { email: `guest-${guestId}@reframe.ai` },
      update: {},
      create: {
        tenantId: `guest_${guestId}`,
        email: `guest-${guestId}@reframe.ai`,
        name: 'Guest User',
        status: 'active',
        isGuest: true
      },
      select: { id: true }
    });
  }

  return guest?.id;
};

// Customer orders - tenant isolated
router.get('/orders', optionalPortalAuth, async (req: any, res) => {
  try {
    const customerId = await getEffectivePortalCustomerId(req);
    const { skip, take, page, limit } = getPagination(req.query);
    if (!customerId) {
      return res.status(401).json({ success: false, message: 'Customer not found' });
    }

    // Optional status filter (e.g. ?status=completed for order history tab)
    const statusFilter = req.query.status as string | undefined;
    const where = { customerId, ...(statusFilter ? { status: statusFilter } : {}) };

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: {
          images: { select: { id: true, url: true, path: true, rawUrl: true, editedUrl: true, filename: true, status: true, type: true } },
          assignedEditor: { select: { firstName: true, lastName: true } },
          quotation: true
        }
      }),
      prisma.order.count({ where })
    ]);

    return res.json({
      success: true,
      data: orders.map(withAssetPreviewUrls),
      pagination: { total, page, limit, pages: Math.ceil(total / limit) }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: safeError(error) });
  }
});

// Create new order from portal
router.post('/orders', uploadLimiter, optionalPortalAuth, async (req: any, res) => {
  try {
    if (req.portalTokenExpired) {
      return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
    }

    const {
      images: orderImages
    } = req.body || {};

    const title = asString(req.body?.title, 120) || 'New Project';
    const description = asString(req.body?.description, 4000);
    const services = asStringArray(req.body?.services);
    const customFilesLink = asString(req.body?.customFilesLink, 2048);
    const customFilesCount = asPositiveInt(req.body?.customFilesCount, 0);
    const outputFormat = asString(req.body?.outputFormat, 40);
    // Client-requested delivery date. Ignore anything unparseable or in the past
    // rather than storing a deadline that is already missed.
    const requestedDeadline = asString(req.body?.expectedCompletion, 40);
    const parsedDeadline = requestedDeadline ? new Date(requestedDeadline) : null;
    const expectedCompletion = parsedDeadline && !Number.isNaN(parsedDeadline.getTime())
      && parsedDeadline.getTime() > Date.now() - 24 * 60 * 60 * 1000
      ? parsedDeadline
      : null;
    const background = asString(req.body?.background, 80);
    const cropRatio = asString(req.body?.cropRatio, 40);
    const resizeWidth = asString(req.body?.resizeWidth, 20);
    const resizeHeight = asString(req.body?.resizeHeight, 20);
    const turnaround = asString(req.body?.turnaround, 20);
    const colorProfile = asString(req.body?.colorProfile, 40);
    const resolutionDPI = asString(req.body?.resolutionDPI, 20);
    const layering = asString(req.body?.layering, 40);
    const namingPattern = asString(req.body?.namingPattern, 120);
    const marginPercent = asString(req.body?.marginPercent, 20);
    const deliveryVector = asString(req.body?.deliveryVector, 40);

    // Get customer or create guest
    let customerId = await getEffectivePortalCustomerId(req, true);

    if (!customerId) {
      return res.status(401).json({ success: false, message: 'Customer not found' });
    }

    // Require a real email for guest orders
    const capturedEmail = asString(req.body?.email, 254);
    const isAuthenticatedCustomer = !!(req.customer?.id && !req.customer?.isGuest);
    if (!isAuthenticatedCustomer && (!capturedEmail || !capturedEmail.includes('@'))) {
      return res.status(400).json({ success: false, message: 'A valid email address is required to place an order.' });
    }

    const idempotencyKey = asString(req.headers['x-idempotency-key'], 128) || null;
    if (idempotencyKey && customerId) {
      const existingOrder = await prisma.order.findFirst({
        where: { idempotencyKey, customerId },
        select: { id: true, code: true }
      });
      if (existingOrder) {
        return res.json({ success: true, data: { orderId: existingOrder.id, code: existingOrder.code } });
      }
    }

    const mappedImages = Array.isArray(orderImages)
      ? orderImages
          .map((img: any) => {
            const rawType = asString(img?.type, 30);
            const type = rawType === 'support' ? 'support' : rawType === 'source_link' ? 'source_link' : 'work';
            return {
              path: asString(img?.path, 1000),
              url: asString(img?.url, 1000),
              filename: asString(img?.filename, 255) || (type === 'source_link' ? 'external-file-link' : 'uploaded-file'),
              type,
            };
          })
          .filter((img: any) => img.url && (img.path || (img.type === 'source_link' && isValidSourceUrl(img.url))))
      : [];

    if (Array.isArray(orderImages) && orderImages.length > 0 && mappedImages.length !== orderImages.length) {
      return res.status(400).json({ success: false, message: 'Invalid uploaded file reference' });
    }

    const validImageInputs = mappedImages.slice(0, PORTAL_MAX_FILES);

    const uploadInputs = validImageInputs.filter((img: any) => img.type !== 'source_link');
    const sourceLinkInputs = validImageInputs.filter((img: any) => img.type === 'source_link');

    const verifiedImages = [
      ...uploadInputs,
      ...sourceLinkInputs,
    ];

    if (validImageInputs.length > 0 && verifiedImages.length !== validImageInputs.length) {
      return res.status(400).json({ success: false, message: 'Uploaded file reference could not be verified' });
    }

    const volume = customFilesLink
      ? (customFilesCount || 0)
      : verifiedImages.filter((img: any) => img.type === 'work' || img.type === 'source_link').length;

    // Use a well-formed reserved code from frontend or generate a fallback
    const requestedCode = req.headers['x-order-code'];

    // Get the tenantId from the actual customer record (guest or registered)
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: { tenantId: true }
    });

    // Create the order with retry-on-conflict
    let order;
    let code = '';
    let attempts = 0;
    while (attempts < 5) {
      code = isSafeOrderCode(requestedCode) && attempts === 0 
        ? requestedCode 
        : generateOrderCode();

      try {
        order = await prisma.order.create({
          data: {
            tenantId: customer?.tenantId || 'reframe_guest',
            code,
            customerId,
            title: title || 'New Project',
            description,
            serviceType: services && services.length > 0 ? services.join(', ') : 'standard',
            volume: volume || 0,
            status: 'new_review',
            priority: turnaround === '12' ? 'high' : 'medium',
            rush: turnaround === '12',
            outputFormat,
            background,
            cropRatio,
            resizeWidth,
            resizeHeight,
            turnaround,
            colorProfile,
            resolutionDPI,
            layering,
            namingPattern,
            marginPercent,
            deliveryVector,
            customFilesLink,
            customFilesCount,
            expectedCompletion,
            idempotencyKey,
            images: verifiedImages.length > 0 ? {
              create: verifiedImages.map((img: any) => ({
                url: img.url,
                path: img.path,
                filename: img.filename,
                type: img.type
              }))
            } : undefined
          }
        });
        break;
      } catch (error: any) {
        if (error.code === 'P2002') {
          if (error.message?.includes('code') || error.meta?.target?.includes('code')) {
            attempts++;
            if (attempts >= 5) {
              throw new Error('Failed to generate a unique order code after 5 attempts due to database collisions');
            }
            continue;
          }
          if (error.message?.includes('idempotencyKey') || error.meta?.target?.includes('idempotencyKey')) {
            const existingOrder = await prisma.order.findFirst({
              where: { idempotencyKey, customerId },
              select: { id: true, code: true }
            });
            if (existingOrder) {
              return res.json({ success: true, data: { orderId: existingOrder.id, code: existingOrder.code } });
            }
          }
        }
        throw error;
      }
    }

    // ── Fire-and-forget admin alert (non-blocking) ─────────────────
    const isRush = turnaround === '12';
    const alertsToCreate: Promise<any>[] = [
      prisma.alert.create({
        data: {
          severity: 'medium',
          title: 'New Order Received',
          message: `Project "${title || 'New Project'}" has been submitted (Code: ${code}). Volume: ${volume || 0} images.`,
          alertType: 'order',
          actionLabel: 'View Order',
          actionLink: `/admin/orders/${order.id}`,
          expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48h
        },
      }),
    ];

    // Extra high-priority alert for rush orders
    if (isRush) {
      alertsToCreate.push(
        prisma.alert.create({
          data: {
            severity: 'high',
            title: '⚡ Rush Order Alert',
            message: `Rush order "${title || 'New Project'}" (Code: ${code}) requires 12-hour turnaround. Immediate assignment needed.`,
            alertType: 'order_rush',
            actionLabel: 'Assign Editor',
            actionLink: `/admin/orders/${order.id}`,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
          },
        })
      );
    }

    // Run alert creation in background — don't block the client response
    Promise.all(alertsToCreate).catch((alertErr) =>
      console.error('[OrderAlert] Failed to create admin alert:', alertErr)
    );

    // ── Save guest email to customer record ──────────────────────────
    if (capturedEmail && capturedEmail.includes('@')) {
      const orderCustomer = await prisma.customer.findUnique({
        where: { id: customerId },
        select: { isGuest: true, contactEmail: true }
      });
      if (orderCustomer?.isGuest && !orderCustomer.contactEmail) {
        prisma.customer.update({
          where: { id: customerId },
          data: { contactEmail: capturedEmail }
        }).catch((updateErr) =>
          console.error('[Order] Failed to update guest email:', updateErr)
        );
      }
    }

    // ── Fire email + Discord notifications (fire-and-forget) ────────
    (async () => {
      try {
        const customer = await prisma.customer.findUnique({
          where: { id: customerId },
          select: { name: true, companyName: true, contactEmail: true, email: true, isGuest: true }
        });
        fireOrderNotifications({
          orderId: order.id,
          code: order.code,
          title: order.title,
          customerName: customer?.companyName || customer?.name || 'Unknown',
          customerEmail: customer?.contactEmail || customer?.email || 'N/A',
          services: order.serviceType,
          volume: order.volume,
          turnaround: turnaround || '48',
          isRush: turnaround === '12',
          isGuest: customer?.isGuest ?? true,
          createdAt: order.createdAt,
          dropboxLink: order.customFilesLink || await getDropboxFolderLink(verifiedImages[0]?.path?.split('/').slice(0, -1).join('/') || 'unassigned'),
        });
      } catch (notifErr) {
        console.error('[Notification] Failed to prepare notification payload:', notifErr);
      }
    })();

    return res.json({ success: true, data: { orderId: order.id, code: order.code } });
  } catch (error: any) {
    console.error('[Order] Error:', error.message || 'Unknown error');
    return res.status(500).json({ success: false, message: safeError(error) });
  }
});

// Must be BEFORE /orders/:id to avoid route conflict
router.get('/orders/stream', (req: any, _res, next) => {
  if (req.query.token && !req.headers.authorization) {
    req.headers.authorization = `Bearer ${req.query.token}`;
  }
  return next();
}, optionalPortalAuth, async (req: any, res) => {
  const customerId = await getEffectivePortalCustomerId(req).catch(() => null);
  if (!customerId) return res.status(401).json({ success: false, message: 'Identity required' });

  return res.json(realtimeSubscription('orders', customerId));
});

router.get('/orders/:id', optionalPortalAuth, async (req: any, res) => {
  try {
    const { id } = req.params;
    const customerId = await getEffectivePortalCustomerId(req);

    const order = await prisma.order.findFirst({
      where: { id, customerId },
      include: {
        images: true,
        assignedEditor: { select: { firstName: true, lastName: true } },
        quotation: true
      }
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    return res.json({ success: true, data: withAssetPreviewUrls(order) });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: safeError(error) });
  }
});

// Activity and Bulk download
router.get('/activity', optionalPortalAuth, portalActivityController.getRecentActivity);
router.get('/orders/:id/download', optionalPortalAuth, portalAssetController.downloadJobAssets);
router.get('/orders/:id/assets/:imageId/raw', (req: any, _res, next) => {
  // <img> cannot set headers; a guest identifies through the query string. The
  // format check is the same one optionalPortalAuth applies to the header.
  if (!req.headers['x-guest-id'] && isSafeGuestId(req.query.guestId)) {
    req.headers['x-guest-id'] = req.query.guestId;
  }
  return next();
}, optionalPortalAuth, portalAssetController.streamJobAsset);

// Approve order
router.post('/orders/:id/approve', optionalPortalAuth, async (req: any, res) => {
  try {
    const { id } = req.params;
    const customerId = req.customer?.id;

    if (!customerId) {
      return res.status(401).json({ success: false, message: 'Identity required' });
    }

    const order = await prisma.order.findFirst({
      where: { id, customerId },
      include: { quotation: true }
    });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Enforce quote expiration at approval
    if (order.quotation && order.quotation.expiresAt) {
      const isExpired = new Date(order.quotation.expiresAt).getTime() < Date.now();
      if (isExpired) {
        return res.status(400).json({
          success: false,
          message: 'This quote has expired. Please contact support or request a new proposal.'
        });
      }
    }

    const [updatedOrder] = await prisma.$transaction([
      // Stamp startedAt here too — approval is when work actually begins, and the
      // admin timeline showed "Not set" for orders that were already underway.
      prisma.order.update({
        where: { id },
        data: { status: 'in_progress', startedAt: order.startedAt || new Date() },
      }),
      prisma.quotation.updateMany({
        where: { orderId: id, status: 'sent' },
        data: { status: 'accepted', acceptedAt: new Date() }
      })
    ]);

    await prisma.activity.create({
      data: {
        tenantId: order.tenantId,
        customerId,
        orderId: order.id,
        type: 'status_change',
        message: `Order ${order.code} proposal approved by customer. Status updated to in_progress.`
      }
    });

    return res.json({ success: true, data: updatedOrder });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: safeError(error) });
  }
});

// Reject proposal
router.post('/orders/:id/reject-proposal', optionalPortalAuth, async (req: any, res) => {
  try {
    const { id } = req.params;
    const customerId = req.customer?.id;
    const notes = String(req.body?.notes || '').trim();

    if (!customerId) {
      return res.status(401).json({ success: false, message: 'Identity required' });
    }

    const order = await prisma.order.findFirst({
      where: { id, customerId },
      include: { customer: true }
    });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.status !== 'awaiting_approval') {
      return res.status(400).json({
        success: false,
        message: `Only orders awaiting approval can have their proposals rejected. Current status is "${order.status}".`
      });
    }

    const [updatedOrder] = await prisma.$transaction([
      prisma.order.update({ where: { id }, data: { status: 'new_review' } }),
      prisma.quotation.updateMany({
        where: { orderId: id, status: 'sent' },
        data: { status: 'rejected' }
      })
    ]);

    await prisma.activity.create({
      data: {
        tenantId: order.tenantId,
        customerId,
        orderId: order.id,
        type: 'status_change',
        message: `Order ${order.code} proposal declined by customer. Notes: ${notes || 'None'}`
      }
    });

    fireInquiryNotification(order.customer.email, {
      type: 'Proposal Declined',
      name: order.customer.name,
      description: `Order ${order.code} proposal declined. Notes: ${notes || 'No notes provided.'}`,
      orderId: order.id,
      code: order.code,
    });

    return res.json({ success: true, data: updatedOrder });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: safeError(error) });
  }
});

// Request order revision
router.post('/orders/:id/revision', optionalPortalAuth, async (req: any, res) => {
  try {
    const { id } = req.params;
    const customerId = req.customer?.id;
    const notes = String(req.body?.notes || '').trim();

    if (!customerId) {
      return res.status(401).json({ success: false, message: 'Identity required' });
    }

    if (notes.length < 10) {
      return res.status(400).json({ success: false, message: 'Please add a short note describing what needs to change.' });
    }

    const order = await prisma.order.findFirst({
      where: { id, customerId },
      include: { customer: true }
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Only allow revisions if the order is ready_qc or completed
    if (order.status !== 'ready_qc' && order.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: `Revisions can only be requested on orders that are delivered or completed. Current status is "${order.status}".`
      });
    }

    // Time-gated: only allow revisions on completed orders within 14 days of completion
    if (order.status === 'completed') {
      if (!order.completedAt) {
        return res.status(400).json({
          success: false,
          message: 'This completed order does not have a recorded completion date.'
        });
      }
      const fourteenDaysInMs = 14 * 24 * 60 * 60 * 1000;
      const isPastLimit = Date.now() - new Date(order.completedAt).getTime() > fourteenDaysInMs;
      if (isPastLimit) {
        return res.status(400).json({
          success: false,
          message: 'Revisions are only allowed within 14 days of order completion. Please contact support.'
        });
      }
    }

    const revisionNote = `[Customer revision requested ${new Date().toISOString()}]\n${notes}`;
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        status: 'revision_needed',
        notes: order.notes ? `${order.notes}\n\n${revisionNote}` : revisionNote
      }
    });

    await prisma.activity.create({
      data: {
        tenantId: order.tenantId,
        customerId,
        orderId: order.id,
        type: 'revision_request',
        message: `Revision requested for ${order.code}: ${notes.slice(0, 180)}`
      }
    });

    fireInquiryNotification(order.customer.email, {
      type: 'Revision Request',
      name: order.customer.name,
      description: `Order ${order.code}: ${notes}`,
      orderId: order.id,
      code: order.code,
    });

    return res.json({ success: true, data: updatedOrder });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: safeError(error) });
  }
});

// Customer quotations - tenant isolated
router.get('/quotes', protectPortal, async (req: any, res) => {
  try {
    const customerId = req.customer?.id;
    const { skip, take, page, limit } = getPagination(req.query);
    if (!customerId) {
      return res.status(401).json({ success: false, message: 'Customer not found' });
    }

    const [quotations, total] = await Promise.all([
      prisma.quotation.findMany({
        where: { customerId },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.quotation.count({ where: { customerId } })
    ]);

    return res.json({ 
      success: true, 
      data: quotations,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: safeError(error) });
  }
});

router.get('/quotes/:id', protectPortal, async (req: any, res) => {
  try {
    const { id } = req.params;
    const customerId = req.customer?.id;

    const quotation = await prisma.quotation.findFirst({
      where: { id, customerId },
    });

    if (!quotation) {
      return res.status(404).json({ success: false, message: 'Quote not found' });
    }

    return res.json({ success: true, data: quotation });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: safeError(error) });
  }
});

// Billing routes
router.get('/billing/profile', protectPortal, getBillingProfile);
router.get('/billing/invoices', protectPortal, getInvoices);

// Customer invoices - tenant isolated
router.get('/invoices', protectPortal, async (req: any, res) => {
  try {
    const customerId = req.customer?.id;
    const { skip, take, page, limit } = getPagination(req.query);
    if (!customerId) {
      return res.status(401).json({ success: false, message: 'Customer not found' });
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where: { customerId },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.invoice.count({ where: { customerId } })
    ]);

    return res.json({ 
      success: true, 
      data: invoices,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: safeError(error) });
  }
});


// ─── Admin: Purge old guest Dropbox folders ───────────────────────────────────
// Deletes /guests/guest-[id] folders where ALL sub-folders are older than N days.
// Run manually or hook into a weekly cron.
router.post('/admin/purge-guests', authenticate, requireAdmin, async (req: any, res) => {
  try {
    const olderThanDays = parseInt(req.body?.olderThanDays) || 7;
    const result = await purgeOldGuestFolders(olderThanDays);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: safeError(error) });
  }
});

// ─── Admin: Cancel order + cleanup Dropbox assets ─────────────────────────────
// Deletes all Dropbox files linked to the order, then removes the order from DB.
router.delete('/orders/:id/cancel', protectPortal, async (req: any, res) => {
  try {
    const { id } = req.params;
    const customerId = req.customer?.id;

    const order = await prisma.order.findFirst({
      where: { id, customerId },
      include: { images: true },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Only allow cancellation before work begins
    if (!['new_review', 'awaiting_approval'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel an order with status "${order.status}". Contact support.`,
      });
    }

    // Delete each uploaded file from Dropbox (fire-and-forget, don't block response)
    const dropboxCleanups = order.images
      .filter((img: any) => img.path)
      .map((img: any) => cleanupDropboxFolder(img.path));

    Promise.allSettled(dropboxCleanups).then((results) => {
      const failed = results.filter((r) => r.status === 'rejected');
      if (failed.length) {
        console.warn(`[Dropbox] ${failed.length} file(s) could not be deleted for order ${id}`);
      }
    });

    // Remove order and dependent records safely in a transaction
    const imageIds = order.images.map((img: any) => img.id);

    await prisma.$transaction(async (tx) => {
      if (imageIds.length > 0) {
        await tx.annotation.deleteMany({ where: { imageId: { in: imageIds } } });
        await tx.imageVersion.deleteMany({ where: { imageId: { in: imageIds } } });
      }

      // Detach optional references before deleting the order row
      await tx.conversation.updateMany({ where: { orderId: id }, data: { orderId: null } });
      await tx.quotation.updateMany({ where: { orderId: id }, data: { orderId: null } });

      if (imageIds.length > 0) {
        await tx.image.deleteMany({ where: { id: { in: imageIds } } });
      }

      await tx.order.delete({ where: { id } });
    });

    return res.json({ success: true, message: 'Order cancelled and assets queued for removal.' });
  } catch (error: any) {
    console.error('[PortalRoute] Error:', error.message || 'Unknown error');
    return res.status(500).json({ success: false, message: safeError(error) });
  }
});

// ─────────────────────────────────────────────────────────────
// SSE: Real-time chat stream per conversation (customer side)
// GET /portal/chat/stream?conversationId=...&token=<portal_token>
// ─────────────────────────────────────────────────────────────

router.get('/chat/stream', (req: any, _res, next) => {
  if (req.query.token && !req.headers.authorization) {
    req.headers.authorization = `Bearer ${req.query.token}`;
  }
  // EventSource cannot set request headers, so a guest identifies through the query
  // string. Promote it to the header optionalPortalAuth reads — it applies the same
  // format check there, so this is no weaker than the header path.
  if (!req.headers['x-guest-id'] && isSafeGuestId(req.query.guestId)) {
    req.headers['x-guest-id'] = req.query.guestId;
  }
  return next();
}, optionalPortalAuth, async (req: any, res) => {
  const { conversationId } = req.query;
  if (!conversationId || typeof conversationId !== 'string') {
    return res.status(400).json({ success: false, message: 'conversationId required' });
  }

  const customerId = req.customer?.id;
  if (!customerId) return res.status(401).json({ success: false, message: 'Identity required' });

  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, customerId },
  }).catch(() => null);
  if (!conversation) return res.status(403).json({ success: false, message: 'Conversation not found' });

  return res.json(realtimeSubscription('chat', conversationId));
});

// ─────────────────────────────────────────────────────────────
// SSE: Real-time order status stream per customer
// GET /portal/orders/stream?token=<portal_token>
// ─────────────────────────────────────────────────────────────

export function broadcastOrderStatus(customerId: string, payload: { type: string; [key: string]: any }) {
  publishRealtime('orders', customerId, payload.type, payload);
}

export default router;


router.post('/feedback', optionalPortalAuth, async (req: any, res) => {
  try {
    const { type, subject, message, email, url, screenResolution } = req.body || {};
    const fromAuthUser = Boolean(req.customer && !req.customer?.isGuest);
    const resolvedEmail = String((fromAuthUser ? (email || req.customer?.email) : email) || '').trim().toLowerCase();

    if (!resolvedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resolvedEmail)) {
      return res.status(400).json({ success: false, message: 'Valid email is required.' });
    }
    if (!message || String(message).trim().length < 5) {
      return res.status(400).json({ success: false, message: 'Message is required.' });
    }

    const payload = {
      type: String(type || 'suggestion').slice(0, 40),
      subject: String(subject || 'General Platform Feedback').slice(0, 180),
      message: String(message).slice(0, 4000),
      email: resolvedEmail,
      url: String(url || req.originalUrl || 'N/A').slice(0, 500),
      screenResolution: String(screenResolution || 'N/A').slice(0, 80),
    };

    Promise.allSettled([
      emailService.sendEmail(
        process.env.ADMIN_NOTIFY_EMAIL || process.env.ADMIN_EMAIL || 'hello@reframevisuals.com',
        `[FEEDBACK] ${payload.subject} (${payload.type.toUpperCase()})`,
        `<div style="font-family:sans-serif;max-width:620px;padding:20px;border:1px solid #eaeaea;border-radius:10px">
          <h3 style="margin-top:0">New Platform Feedback</h3>
          <p><b>Type:</b> ${payload.type}</p>
          <p><b>Sender:</b> <a href="mailto:${payload.email}">${payload.email}</a></p>
          <p><b>URL:</b> <code>${payload.url}</code></p>
          <p><b>Resolution:</b> ${payload.screenResolution}</p>
          <hr/>
          <p style="white-space:pre-wrap">${payload.message}</p>
        </div>`
      ),
      sendFeedbackTelegramNotification(payload),
      sendFeedbackDiscordNotification(payload),
      sendFeedbackSlackNotification(payload),
    ]).catch((err) => console.error('[Feedback Dispatch] background error', err));

    return res.status(200).json({ success: true, message: 'Feedback routed successfully.' });
  } catch (error: any) {
    console.error('[Feedback] route failure', error);
    return res.status(500).json({ success: false, message: safeError(error) });
  }
});
