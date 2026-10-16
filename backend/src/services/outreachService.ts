import { ImapFlow } from 'imapflow';
import { prisma } from '../database';
import { emailService } from './emailService';

/**
 * In-house outreach sequence engine.
 *
 * Sends multi-step follow-up emails through the Google outreach mailbox
 * (see emailService.sendOutreachEmail) with the guardrails that keep a
 * Google mailbox healthy for cold email:
 *   - hard daily send cap (default 30/day, OUTREACH_DAILY_CAP)
 *   - sends only inside a weekday window (default 08–18 server time)
 *   - randomized tick skips + minute-level jitter so sends never look scheduled
 *   - IMAP stop-on-reply: a reply from the lead halts their sequence
 *   - one-click unsubscribe link on every email
 */

const DAILY_CAP = parseInt(process.env.OUTREACH_DAILY_CAP || '30');
const SEND_START_HOUR = parseInt(process.env.OUTREACH_SEND_START_HOUR || '8');
const SEND_END_HOUR = parseInt(process.env.OUTREACH_SEND_END_HOUR || '18');
const BASE_URL = process.env.PUBLIC_BASE_URL || 'https://reframevisuals.com';
const IMAP_UID_SETTING = 'outreach_imap_last_uid';

const renderTemplate = (tpl: string, lead: { name?: string | null; company?: string | null; email?: string | null }) =>
  tpl
    .replace(/\{\{\s*firstName\s*\}\}/gi, (lead.name || '').trim().split(/\s+/)[0] || 'there')
    .replace(/\{\{\s*name\s*\}\}/gi, lead.name || 'there')
    .replace(/\{\{\s*company\s*\}\}/gi, lead.company || 'your store')
    .replace(/\{\{\s*email\s*\}\}/gi, lead.email || '');

const jitterMs = (maxMinutes: number) => Math.floor(Math.random() * maxMinutes * 60_000);

/** delayDays from now plus up to 2h of jitter so follow-ups never land at the exact same minute. */
export const computeNextSendAt = (delayDays: number) =>
  new Date(Date.now() + delayDays * 86_400_000 + jitterMs(delayDays === 0 ? 30 : 120));

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

// ── Sending tick ─────────────────────────────────────────────────

let sendBusy = false;

export async function processDueEnrollments(): Promise<void> {
  if (sendBusy) return;
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay();
  if (hour < SEND_START_HOUR || hour >= SEND_END_HOUR || day === 0 || day === 6) return;
  // Randomly skip ~1/3 of ticks so the send cadence is irregular
  if (Math.random() < 0.35) return;

  sendBusy = true;
  try {
    const sentToday = await prisma.outreachEnrollment.count({ where: { lastSentAt: { gte: startOfToday() } } });
    if (sentToday >= DAILY_CAP) return;

    const enrollment = await prisma.outreachEnrollment.findFirst({
      where: { status: 'active', nextSendAt: { lte: now } },
      include: {
        sequence: { include: { steps: { orderBy: { stepOrder: 'asc' } } } },
        lead: true,
      },
      orderBy: { nextSendAt: 'asc' },
    });
    if (!enrollment) return;

    const { sequence, lead } = enrollment;

    if (lead.unsubscribed) {
      await prisma.outreachEnrollment.update({ where: { id: enrollment.id }, data: { status: 'unsubscribed', nextSendAt: null } });
      return;
    }
    if (!sequence.active) {
      await prisma.outreachEnrollment.update({ where: { id: enrollment.id }, data: { status: 'stopped', nextSendAt: null } });
      return;
    }
    const step = sequence.steps[enrollment.currentStep];
    if (!step) {
      await prisma.outreachEnrollment.update({ where: { id: enrollment.id }, data: { status: 'completed', nextSendAt: null } });
      return;
    }

    const subject = renderTemplate(step.subject, lead);
    const body =
      renderTemplate(step.body, lead) +
      `\n\n—\nDon't want to hear from me again? One click and I won't email you: ${BASE_URL}/api/outreach/unsubscribe/${enrollment.id}`;

    const sent = await emailService.sendOutreachEmail(lead.email, subject, body);
    if (!sent) {
      // Transient failure — retry this step in 2 hours instead of burning it
      await prisma.outreachEnrollment.update({
        where: { id: enrollment.id },
        data: { nextSendAt: new Date(Date.now() + 2 * 3_600_000) },
      });
      return;
    }

    const nextStep = sequence.steps[enrollment.currentStep + 1];
    await prisma.outreachEnrollment.update({
      where: { id: enrollment.id },
      data: {
        currentStep: enrollment.currentStep + 1,
        lastSentAt: new Date(),
        nextSendAt: nextStep ? computeNextSendAt(nextStep.delayDays) : null,
        status: nextStep ? 'active' : 'completed',
      },
    });
    await prisma.lead.update({ where: { id: lead.id }, data: { lastContactedAt: new Date() } }).catch(() => {});
    if (enrollment.enrolledById) {
      await prisma.leadActivity
        .create({
          data: {
            leadId: lead.id,
            userId: enrollment.enrolledById,
            type: 'email',
            content: body.split('\n\n—\n')[0],
            metadata: JSON.stringify({ subject, sequence: sequence.name, step: enrollment.currentStep + 1 }),
          },
        })
        .catch(() => {});
    }
    console.log(`[Outreach] Sent step ${enrollment.currentStep + 1}/${sequence.steps.length} of "${sequence.name}" (${sentToday + 1}/${DAILY_CAP} today)`);
  } finally {
    sendBusy = false;
  }
}

// ── Stop-on-reply (IMAP) ─────────────────────────────────────────

let imapBusy = false;

export async function checkReplies(): Promise<void> {
  const user = process.env.GOOGLE_OUTREACH_EMAIL;
  const pass = process.env.GOOGLE_OUTREACH_APP_PASSWORD;
  if (!user || !pass || imapBusy) return;

  // Skip entirely when nothing is in flight — no reason to poll the mailbox
  const activeCount = await prisma.outreachEnrollment.count({ where: { status: 'active' } });
  if (activeCount === 0) return;

  imapBusy = true;
  const client = new ImapFlow({
    host: 'imap.gmail.com',
    port: 993,
    secure: true,
    auth: { user, pass },
    logger: false,
  });
  try {
    await client.connect();
    const lock = await client.getMailboxLock('INBOX');
    try {
      const uidNext = (client.mailbox && typeof client.mailbox === 'object' ? (client.mailbox as any).uidNext : undefined) as number | undefined;
      if (!uidNext) return;

      const setting = await prisma.siteSetting.findUnique({ where: { key: IMAP_UID_SETTING } });
      if (!setting) {
        // First run: baseline at the current mailbox state, only future mail is processed
        await prisma.siteSetting.create({ data: { key: IMAP_UID_SETTING, value: String(uidNext) } });
        return;
      }
      const lastUid = parseInt(setting.value) || uidNext;
      if (uidNext <= lastUid) return;

      for await (const msg of client.fetch(`${lastUid}:*`, { envelope: true, uid: true }, { uid: true })) {
        if (msg.uid < lastUid) continue; // Gmail returns the last message for x:* ranges even when uid < x
        const fromAddr = msg.envelope?.from?.[0]?.address?.toLowerCase();
        if (!fromAddr || fromAddr === user.toLowerCase()) continue;
        await handleInboundReply(fromAddr, msg.envelope?.subject || '');
      }
      await prisma.siteSetting.update({ where: { key: IMAP_UID_SETTING }, data: { value: String(uidNext) } });
    } finally {
      lock.release();
    }
  } catch (err: any) {
    console.warn('[Outreach] IMAP reply check failed:', err?.message || err);
  } finally {
    await client.logout().catch(() => {});
    imapBusy = false;
  }
}

async function handleInboundReply(fromAddr: string, subject: string): Promise<void> {
  const lead = await prisma.lead.findFirst({ where: { email: fromAddr } });
  if (!lead) return;

  const active = await prisma.outreachEnrollment.findMany({ where: { leadId: lead.id, status: 'active' } });
  if (active.length === 0) return;

  await prisma.outreachEnrollment.updateMany({
    where: { leadId: lead.id, status: 'active' },
    data: { status: 'replied', nextSendAt: null },
  });
  await prisma.lead.update({
    where: { id: lead.id },
    data: {
      lastContactedAt: new Date(),
      ...(lead.status === 'new' ? { status: 'contacted' } : {}),
    },
  });
  const actorId = active[0].enrolledById;
  if (actorId) {
    await prisma.leadActivity
      .create({
        data: {
          leadId: lead.id,
          userId: actorId,
          type: 'email',
          content: `Lead replied to outreach${subject ? ` — "${subject}"` : ''}. Sequence stopped automatically.`,
        },
      })
      .catch(() => {});
  }
  console.log('[Outreach] Reply detected — sequence stopped for lead');
}
