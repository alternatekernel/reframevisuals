import { prisma } from '../database';

// Guests are created with a synthetic address so the Customer row can exist before we
// know who they are. Anything at this domain means "we still have no way to reach them".
const PLACEHOLDER_EMAIL_DOMAIN = '@reframe.internal';

export const isPlaceholderEmail = (email?: string | null): boolean =>
  !email || email.includes(PLACEHOLDER_EMAIL_DOMAIN);

export const buildPlaceholderEmail = (guestId: string): string =>
  `guest_${guestId.replace(/[^a-zA-Z0-9]/g, '')}${PLACEHOLDER_EMAIL_DOMAIN}`;

export interface CaptureGuestEmailResult {
  /** Latest conversation for this guest, used to deep-link the notification. */
  conversationId?: string;
  /** False when a Lead already existed for this address. */
  leadCreated: boolean;
}

/**
 * Attach a real email address to a guest identity and make it actionable.
 *
 * Previously this lived inline in POST /inquiry, so an email typed into the chat
 * updated the Customer row and nothing else — no Lead, no notification. Both entry
 * points now share this, so the two paths produce identical results.
 */
export async function captureGuestEmail(
  guestId: string,
  email: string,
  metadata: { source?: string; conversationId?: string; firstMessage?: string } = {}
): Promise<CaptureGuestEmailResult> {
  const result: CaptureGuestEmailResult = { leadCreated: false };

  try {
    const existingGuest = await prisma.customer.findUnique({ where: { id: guestId } });

    if (!existingGuest) {
      await prisma.customer.create({
        data: {
          id: guestId,
          email: buildPlaceholderEmail(guestId),
          name: 'Guest User',
          isGuest: true,
          tenantId: guestId,
        },
      });
    }

    // Overwrite the placeholder with the address they actually gave us.
    await prisma.customer.update({ where: { id: guestId }, data: { email } });

    const conversationId =
      metadata.conversationId ||
      (
        await prisma.conversation.findFirst({
          where: { customerId: guestId },
          orderBy: { updatedAt: 'desc' },
        })
      )?.id;

    if (conversationId) result.conversationId = conversationId;
  } catch (err) {
    console.warn('[GuestLead] Identity sync failed:', err);
  }

  await ensureLead(email, {
    source: metadata.source || 'chat',
    conversationId: result.conversationId,
    firstMessage: metadata.firstMessage,
  }).then((created) => {
    result.leadCreated = created;
  });

  return result;
}

/**
 * Create a Lead for this address unless one already exists. Deduped by address so a
 * returning visitor never spawns a second lead. Returns whether a row was created.
 */
export async function ensureLead(
  email: string,
  options: { source?: string; conversationId?: string; firstMessage?: string } = {}
): Promise<boolean> {
  try {
    const existingLead = await prisma.lead.findFirst({ where: { email } });
    if (existingLead) return false;

    const noteParts = [
      options.conversationId ? `Conversation: ${options.conversationId}` : null,
      options.firstMessage ? `First message: ${options.firstMessage}` : null,
    ].filter(Boolean);

    await prisma.lead.create({
      data: {
        name: email.split('@')[0],
        email,
        source: options.source || 'chat',
        status: 'new',
        score: 0,
        notes: noteParts.length ? noteParts.join('\n') : null,
      },
    });
    return true;
  } catch (err) {
    console.warn('[GuestLead] Failed to create lead:', err);
    return false;
  }
}
