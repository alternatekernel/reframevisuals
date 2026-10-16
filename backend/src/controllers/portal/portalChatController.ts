import { Request as _Request, Response } from 'express';
import { prisma } from '../../database';
// Telegram notifications disabled — import kept for easy re-enable
// import { forwardUserToTelegram, sendUnattendedChatTelegramAlert } from '../../services/telegramService';
import { getGeoLocation } from '../../services/telegramService';
import { forwardUserToSlack, removeSlackReaction } from '../../services/slackService';
import { sendChatEscalationEmail, fireGuestChatNotification } from '../../services/notificationService';
import { captureGuestEmail, isPlaceholderEmail } from '../../services/guestLeadService';
import { broadcastChatEvent } from '../../services/chatSseService';
import { safeError } from '../../utils/errors';
import { isGuestIdFormat } from '../../middleware/portalMiddleware';
import { markCustomerActive } from '../../utils/presence';

// optionalPortalAuth resolves identity from a verified token or a format-checked
// guest ID. Reading the raw x-guest-id header here as a fallback would let a caller
// pass a registered customer's ID and read their conversations.
const getRequestCustomerId = (req: any) => req.customer?.id || null;

const UNATTENDED_CHAT_ALERT_MS = 45 * 1000;

const parseMetadata = (metadata?: string | null): Record<string, any> => {
  if (!metadata) return {};
  try {
    return JSON.parse(metadata);
  } catch {
    return {};
  }
};

const isHumanAdminMessage = (message: any) => {
  if (!message || message.role !== 'assistant') return false;
  const metadata = parseMetadata(message.metadata);
  return metadata.isHuman === true || metadata.source === 'admin-dashboard' || metadata.source === 'telegram' || metadata.source === 'slack';
};

const scheduleUnattendedChatAlert = (conversationId: string, userMessageId: string) => {
  const timer = setTimeout(async () => {
    try {
      const userMessage = await prisma.message.findUnique({ where: { id: userMessageId } });
      if (!userMessage) return;

      const existingMetadata = parseMetadata(userMessage.metadata);
      if (existingMetadata.unattendedAlertSentAt) return;

      const humanReply = await prisma.message.findFirst({
        where: {
          conversationId,
          role: 'assistant',
          createdAt: { gt: userMessage.createdAt },
          OR: [
            { metadata: { contains: '"isHuman":true' } },
            { metadata: { contains: '"source":"admin-dashboard"' } },
            { metadata: { contains: '"source":"telegram"' } },
          ],
        },
        orderBy: { createdAt: 'asc' },
      });

      if (humanReply && isHumanAdminMessage(humanReply)) return;

      // await sendUnattendedChatTelegramAlert(conversationId, Math.round(UNATTENDED_CHAT_ALERT_MS / 1000));
      await prisma.message.update({
        where: { id: userMessageId },
        data: {
          metadata: JSON.stringify({
            ...existingMetadata,
            unattendedAlertSentAt: new Date().toISOString(),
          }),
        },
      });
    } catch (error: any) {
      console.error('[PortalChat] Unattended alert check failed:', error?.message || error);
    }
  }, UNATTENDED_CHAT_ALERT_MS);

  if (typeof (timer as any).unref === 'function') {
    (timer as any).unref();
  }
};

export const handlePortalChat = async (req: any, res: Response) => {
  try {
    // Sanitized logging for production auditing
    console.log('[PortalChat] Processing request...');
  const { conversationId, content, guestId, attachments } = req.body;
  const safeAttachments = Array.isArray(attachments) ? attachments.slice(0, 8).map((item: any) => ({
    url: String(item.url || ''),
    filename: String(item.filename || item.name || 'Attachment').slice(0, 180),
    size: Number(item.size || 0),
    type: String(item.type || item.mimetype || '').slice(0, 120),
    path: item.path ? String(item.path).slice(0, 500) : undefined,
    folderPath: item.folderPath ? String(item.folderPath).slice(0, 500) : undefined,
  })).filter((item: any) => item.url) : [];
    // 1. Stabilize Identity
    // When a real authenticated customer is present, always use their account ID —
    // ignore any guestId that the client may still be sending from localStorage.
    const isAuthenticatedCustomer = req.customer && !req.customer.isGuest;
    // A guestId in the request body is unsigned client input — only honour it when
    // it is guest-shaped, otherwise a caller could post as any customer ID.
    const bodyGuestId = isGuestIdFormat(guestId) ? guestId : null;
    let effectiveGuestId = isAuthenticatedCustomer ? req.customer.id : (bodyGuestId || req.customer?.id);
    
    // If no ID is provided, we use a fallback, but we should prioritize a stable session ID if we had one
    if (!effectiveGuestId) {
      effectiveGuestId = `guest-temp-${Date.now()}`;
    }
    let customerId = effectiveGuestId;

    // 1. Sync Customer/Guest Identity — ensure a DB record exists
    // Always ensure a customer record exists for this guest ID
    let customerRecord: any = req.customer || null;
    
    if (effectiveGuestId) {
      try {
        // Check if this guest already has a Customer record
        let guest = await prisma.customer.findUnique({ where: { id: effectiveGuestId } });
        
        if (!guest) {
          // Create a new guest customer with a unique email
          const guestEmail = `guest_${effectiveGuestId.replace(/[^a-zA-Z0-9]/g, '')}@reframe.internal`;
          guest = await prisma.customer.create({
            data: {
              id: effectiveGuestId,
              email: guestEmail,
              name: 'Guest User',
              isGuest: true,
              tenantId: effectiveGuestId // Use unique ID instead of static 'reframe_guest'
            }
          });
        }
        customerId = guest.id;
        customerRecord = guest;
      } catch (syncError: any) {
        console.error("[PortalChat] Guest sync failed:", syncError.message);
        // Last resort: try to find by id again (race condition safe)
        const existing = await prisma.customer.findUnique({ where: { id: effectiveGuestId } }).catch(() => null);
        customerId = existing?.id || null;
        customerRecord = existing;
      }
    }

    if (!customerId) {
      return res.status(401).json({ success: false, message: 'Identity required' });
    }

    let tenantId = req.customer?.tenantId || customerId;
    const isGuestUser = !req.customer || req.customer.isGuest === true;

    let conversation: any;

    // 3. Manage Conversation
    try {
      conversation = await prisma.conversation.findUnique({
        where: { id: conversationId || 'non-existent' },
        include: { messages: { orderBy: { createdAt: 'asc' } } }
      });
      
      const isNewSession = !conversation || conversation.messages.length === 0;

      if (!conversation) {
        conversation = await prisma.conversation.create({
          data: { 
            tenantId, 
            customerId, 
            title: content ? content.substring(0, 50) : "New Conversation" 
          },
          include: { messages: true }
        });
      }

      const savedUserMessage = await prisma.message.create({
        data: {
          conversationId: conversation.id,
          role: 'user',
          content: content || (safeAttachments.length ? `[Attached ${safeAttachments.length} file(s)]` : ""),
          status: 'sent',
          metadata: safeAttachments.length ? JSON.stringify({ attachments: safeAttachments, source: 'customer-widget' }) : undefined,
        }
      });

      conversation = await prisma.conversation.update({
        where: { id: conversation.id },
        data: {
          updatedAt: new Date(),
          title: conversation.title || (content ? content.substring(0, 50) : "New Conversation"),
        },
        include: { messages: { orderBy: { createdAt: 'asc' } } }
      });

      // Sending a message is the strongest liveness signal there is. Presence used to
      // be driven only by the widget's periodic ping, so the admin list showed a
      // customer as Inactive / "Last active unknown" mid-conversation.
      markCustomerActive(customerId);

      scheduleUnattendedChatAlert(conversation.id, savedUserMessage.id);

      // Push the new user message to admin SSE subscribers immediately
      broadcastChatEvent(conversation.id, 'new_message', { message: savedUserMessage });

      // Remove ✅/👀 from the previous admin message — customer has replied, reactions are stale
      prisma.message.findFirst({
        where: { conversationId: conversation.id, role: 'assistant', slackMessageTs: { not: null } },
        orderBy: { createdAt: 'desc' },
      }).then(prevAdmin => {
        if (!prevAdmin?.slackMessageTs) return;
        const meta = (() => { try { return JSON.parse(prevAdmin.metadata || '{}'); } catch { return {}; } })();
        if (!meta.slackChannel) return;
        removeSlackReaction(meta.slackChannel, prevAdmin.slackMessageTs, 'white_check_mark').catch(() => {});
        removeSlackReaction(meta.slackChannel, prevAdmin.slackMessageTs, 'eyes').catch(() => {});
      }).catch(() => {});

      // 4. Slack Notifications — forward every user message
      // Telegram is disabled; Slack forwarding runs directly here.
      const isFirstMessage = isNewSession || (conversation.messages.length === 0);
      const clientLabel = req.customer?.customerNumber
        ? `CLT${String(req.customer.customerNumber).padStart(3, '0')}`
        : 'GUEST';
      const userIp = (req.headers['x-forwarded-for'] as string || req.ip || '0.0.0.0').split(',')[0].trim();

      const msgAttachments = safeAttachments.length ? safeAttachments : undefined;
      if (isFirstMessage) {
        // Non-blocking background dispatch: do NOT await external ipapi.co lookup in chat response path
        getGeoLocation(userIp)
          .then((geo) => forwardUserToSlack(conversation.id, content || '', clientLabel, { ip: userIp, ...geo }, msgAttachments))
          .catch((err) => {
            console.error('[Slack] Geolocation lookup failed:', err?.message || err);
            return forwardUserToSlack(conversation.id, content || '', clientLabel, { ip: userIp }, msgAttachments);
          })
          .catch((err) => console.error('[Slack] New session forward failed:', err?.message || err));
      } else {
        forwardUserToSlack(conversation.id, content || '', clientLabel, undefined, msgAttachments)
          .catch(err => console.error('[Slack] Follow-up forward failed:', err?.message || err));
      }

      // 5. If conversation is escalated, keep notifying Telegram/admin but do
      // not generate any local/AI response. Once a human takes over, Reframe CS
      // must stay silent so it does not interrupt the customer-admin thread.

      if (conversation.isEscalated) {
        return res.json({
          success: true,
          data: {
            message: null,
            aiData: { awaitingHuman: true, escalated: true },
            conversationId: conversation.id,
            escalated: true,
            awaitingHuman: true
          }
        });
      }

      /* Human-delay fallback kept for reference, but normal escalated chats now
         return a local customer response immediately above.
        
        // 5-Minute Safety Fallback Check
        // If it's been > 5 minutes since the user's first un-replied message, send an apology.
        const lastHumanMessage = await prisma.message.findFirst({
          where: { 
            conversationId: conversation.id, 
            role: 'assistant',
            metadata: { contains: '"isHuman":true' }
          },
          orderBy: { createdAt: 'desc' }
        });

        const firstUnrepliedUserMsg = await prisma.message.findFirst({
          where: {
            conversationId: conversation.id,
            role: 'user',
            createdAt: { gt: lastHumanMessage?.createdAt || new Date(0) }
          },
          orderBy: { createdAt: 'asc' }
        });

        const now = new Date();
        const fiveMinsAgo = new Date(now.getTime() - 5 * 60 * 1000);

        if (firstUnrepliedUserMsg && firstUnrepliedUserMsg.createdAt < fiveMinsAgo) {
          const apologyContent = "I'm sorry for the delay! Our production team is currently in a high-volume window. We've received your message and an admin will be with you shortly. In the meantime, would you like to [book a meeting](/book-meeting) or should we email you?";
          
          const savedApology = await prisma.message.create({
            data: {
              conversationId: conversation.id,
              role: 'assistant',
              content: apologyContent,
              status: 'sent',
              metadata: JSON.stringify({ isFallback: true, suggestedActions: [{text: "Book a Meeting", url: "/book-meeting"}] })
            }
          });

          return res.json({ 
            success: true, 
            data: { 
              message: savedApology,
              aiData: { suggestedActions: [{text: "Book a Meeting", url: "/book-meeting"}] },
              escalated: true 
            } 
          });
        }

      */

      // ── Static Response Logic ──
      // First message → greeting. Subsequent messages → patience reminder.
      // Guests without a real email also get prompted to share it.
      // If the guest's message contains an email address, capture it silently and acknowledge.

      if (!customerRecord) {
        customerRecord = await prisma.customer.findUnique({ where: { id: customerId } });
      }
      const hasRealEmail = !isPlaceholderEmail(customerRecord?.email);

      // Email capture: if guest sends their email, store it and confirm receipt.
      // This used to only touch customer.email — no Lead row and no notification, so
      // an address typed into chat never reached the team. captureGuestEmail does both.
      let emailCapturedNow = false;
      if (isGuestUser && !hasRealEmail && content) {
        const emailMatch = content.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
        if (emailMatch) {
          const captured = emailMatch[0];
          await captureGuestEmail(customerId, captured, {
            source: 'chat',
            conversationId: conversation.id,
            firstMessage: content.slice(0, 300),
          }).catch(err => console.error('[PortalChat] Email capture failed:', err));
          emailCapturedNow = true;
          fireGuestChatNotification(conversation.id, captured, { firstMessage: content.slice(0, 300) });
          console.log(`[PortalChat] Guest email captured: ${captured}`);
        }
      }

      // A guest can send one message and close the tab. Alert the team immediately even
      // with no contact info, so nobody finds out only by opening the site later.
      if (isFirstMessage && isGuestUser && !emailCapturedNow) {
        fireGuestChatNotification(
          conversation.id,
          hasRealEmail ? customerRecord!.email : null,
          { firstMessage: (content || '').slice(0, 300) }
        );
      }

      let botContent: string;
      let botActions: { text: string; url?: string }[] = [];
      // Drives the inline contact-capture card in the widget. Named `requestContact`
      // rather than `requestEmail` so a push-permission option can join the same card.
      let requestContact = false;

      // A guest who sends one message and leaves must see the ask in the FIRST reply —
      // checking isFirstMessage before the no-email case meant it only ever landed on
      // message #2, which those visitors never read.
      const needsContact = isGuestUser && !hasRealEmail;

      if (emailCapturedNow) {
        botContent =
          "Got it — your email has been saved. 🙏 Our team will follow up with you there if needed. Please stay patient while a human agent reviews your message.";
      } else if (isFirstMessage && needsContact) {
        botContent =
          "Hi! Thanks for reaching out to Reframe Visuals.\n\nA human agent will be with you shortly — please stay patient. 🙏\n\nSo we can pick this up with you if you close the tab, could you leave your email? We use it only to reply to this conversation — no marketing.";
        botActions = [
          { text: "Browse Services", url: "/services" },
          { text: "View Pricing", url: "/pricing" },
        ];
        requestContact = true;
      } else if (isFirstMessage) {
        botContent =
          "Hi! Thanks for reaching out to Reframe Visuals.\n\nA human agent will be with you shortly — please stay patient. 🙏";
        botActions = [
          { text: "Browse Services", url: "/services" },
          { text: "View Pricing", url: "/pricing" },
        ];
      } else if (needsContact) {
        botContent =
          "Our team has received your message and will respond shortly — please stay patient. 🙏\n\nCould you drop your email here? That way we won't lose this conversation if you close the tab.";
        requestContact = true;
      } else {
        botContent =
          "Our team has received your message and will respond shortly — please stay patient. 🙏";
      }

      const savedBotMessage = await prisma.message.create({
        data: {
          conversationId: conversation.id,
          role: 'assistant',
          content: botContent,
          status: 'sent',
          metadata: JSON.stringify({ suggestedActions: botActions, requestContact }),
        },
      });

      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { updatedAt: new Date() },
      });

      return res.json({
        success: true,
        data: {
          message: savedBotMessage,
          aiData: { suggestedActions: botActions },
          conversationId: conversation.id,
        },
      });

    } catch (convError: any) {
      console.error("[PortalChat] Critical Conversation Error:", convError.message);
      return res.json({
        success: true,
        data: {
          message: {
            id: `local-${Date.now()}`,
            role: 'assistant',
            content: "Our team has been notified — please stay patient, someone will be with you shortly. 🙏",
            createdAt: new Date().toISOString(),
            metadata: JSON.stringify({ suggestedActions: [] }),
          },
          aiData: { suggestedActions: [] },
        },
      });
    }
    
  } catch (fatalError: any) {
    console.error('Portal Chat Fatal Error:', fatalError.message);
    return res.status(500).json({ success: false, message: safeError(fatalError) });
  }
};

export const getConversations = async (req: any, res: Response) => {
  try {
    const customerId = getRequestCustomerId(req);
    if (!customerId) return res.json({ success: true, data: [] });


    const conversations = await prisma.conversation.findMany({
      where: { customerId },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
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
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    return res.json({ success: true, data: conversations });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: safeError(error) });
  }
};

export const getConversationDetails = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const customerId = getRequestCustomerId(req);

    if (!customerId) {
      return res.status(401).json({ success: false, message: 'Identity required' });
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: {
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
          }
        }
      }
    });

    if (!conversation || conversation.customerId !== customerId) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    return res.json({ success: true, data: conversation });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: safeError(error) });
  }
};

export const escalateChat = async (req: any, res: Response) => {
  try {
    const { conversationId } = req.body;
    const customerId = req.customer?.id;

    if (!customerId) return res.status(401).json({ success: false, message: 'Identity required' });

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { messages: true, customer: true }
    });

    if (!conversation) return res.status(404).json({ success: false, message: 'Conversation not found' });

    // Create Support Ticket
    const ticket = await prisma.supportTicket.create({
      data: {
        tenantId: conversation.tenantId,
        customerId: conversation.customerId,
        subject: `AI Escalation: ${conversation.customer.customerNumber ? 'CLT' + String(conversation.customer.customerNumber).padStart(3, '0') : 'Guest User'}`,
        message: `User requested human assistance during AI session. Conv ID: ${conversationId}`,
        priority: 'high',
        status: 'open',
        messages: {
          create: {
            senderId: conversation.customerId,
            senderRole: 'customer',
            content: `User requested human assistance during AI session. Conv ID: ${conversationId}`
          }
        }
      }
    });

    // Update conversation state
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { isEscalated: true }
    });

    // Send Email Transcript to hello@reframevisuals.com
    const transcript = conversation.messages
      .map(m => `${m.role.toUpperCase()}: ${m.content}`)
      .join('\n');
    
    sendChatEscalationEmail(
      conversationId,
      conversation.customer.name,
      conversation.customer.email,
      transcript
    ).catch(err => console.error('[Escalation] Email failed:', err));

    // Forward to Telegram — disabled
    // const lastUserMsg = conversation.messages.filter(m => m.role === 'user').pop();
    // await forwardUserToTelegram(conversationId, lastUserMsg?.content || "Human requested.", conversation.customer.customerNumber ? `CLT${String(conversation.customer.customerNumber).padStart(3, '0')}` : undefined);

    return res.json({ success: true, data: { ticketId: ticket.id } });

  } catch (error: any) {
    console.error('Escalation Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to escalate' });
  }
};
