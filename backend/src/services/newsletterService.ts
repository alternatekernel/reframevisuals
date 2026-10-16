import { Resend } from 'resend';
import { prisma } from '../database';

const FROM = process.env.EMAIL_FROM || 'Reframe Visuals <hello@reframevisuals.com>';
const BASE_URL = process.env.BASE_URL || 'https://reframevisuals.com';

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

// ─── Subscribe (double opt-in) ────────────────────────────────────────────────

export async function subscribeEmail(email: string): Promise<'new' | 'pending' | 'confirmed'> {
  const existing = await prisma.newsletterSubscriber.findUnique({ where: { email } });
  if (existing?.confirmed) return 'confirmed';

  const sub = existing ?? await prisma.newsletterSubscriber.create({
    data: { email }
  });

  const confirmUrl = `${BASE_URL}/api/blog/confirm?token=${sub.token}`;
  const resend = getResend();
  if (resend) {
    await resend.emails.send({
      from: FROM,
      to: email,
      subject: 'Confirm your Reframe Visuals subscription',
      html: confirmEmailHtml(confirmUrl),
    }).catch((err) => console.error('[Newsletter] Confirm email failed:', err));
  }

  return existing ? 'pending' : 'new';
}

// ─── Confirm ─────────────────────────────────────────────────────────────────

export async function confirmSubscription(token: string): Promise<boolean> {
  const sub = await prisma.newsletterSubscriber.findUnique({ where: { token } });
  if (!sub || sub.confirmed) return !!sub;
  await prisma.newsletterSubscriber.update({
    where: { id: sub.id },
    data: { confirmed: true, token: '' },
  });
  return true;
}

// ─── Unsubscribe ──────────────────────────────────────────────────────────────

export async function unsubscribeByToken(unsubToken: string): Promise<boolean> {
  const sub = await prisma.newsletterSubscriber.findUnique({ where: { unsubToken } });
  if (!sub) return false;
  await prisma.newsletterSubscriber.delete({ where: { id: sub.id } });
  return true;
}

// ─── Broadcast on publish ─────────────────────────────────────────────────────

export async function broadcastPost(post: {
  slug: string;
  title: string;
  excerpt?: string | null;
  image?: string | null;
  readTime?: string | null;
}): Promise<void> {
  const resend = getResend();
  if (!resend) return;

  const subscribers = await prisma.newsletterSubscriber.findMany({
    where: { confirmed: true },
    select: { email: true, unsubToken: true },
  });
  if (!subscribers.length) return;

  const postUrl = `${BASE_URL}/blog/${post.slug}`;

  // Resend batch API: up to 100 per call
  const BATCH = 100;
  for (let i = 0; i < subscribers.length; i += BATCH) {
    const chunk = subscribers.slice(i, i + BATCH);
    const messages = chunk.map(({ email, unsubToken }) => ({
      from: FROM,
      to: email,
      subject: `New post: ${post.title}`,
      html: broadcastEmailHtml({ post: { ...post, url: postUrl }, unsubToken }),
    }));

    await resend.batch.send(messages).catch((err) =>
      console.error('[Newsletter] Batch send error:', err)
    );
  }

  console.log(`[Newsletter] Broadcast sent for "${post.title}" to ${subscribers.length} subscriber(s).`);
}

// ─── Email templates ──────────────────────────────────────────────────────────

function confirmEmailHtml(confirmUrl: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Inter,'Helvetica Neue',Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px">
    <tr><td>
      <table width="560" cellpadding="0" cellspacing="0" style="margin:0 auto;background:#fff;border-radius:16px;border:1px solid #e5e5e5;overflow:hidden">
        <tr><td style="padding:40px 40px 0">
          <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:.15em;text-transform:uppercase;color:#999">Reframe Visuals</p>
          <h1 style="margin:0 0 20px;font-size:26px;font-weight:800;color:#111;letter-spacing:-.03em;line-height:1.2">Confirm your subscription</h1>
          <p style="margin:0 0 32px;font-size:16px;color:#555;line-height:1.6">
            Click the button below to start receiving our product photo editing insights — practical techniques from real post-production work.
          </p>
          <a href="${confirmUrl}" style="display:inline-block;padding:14px 32px;background:#111;color:#fff;font-size:15px;font-weight:700;text-decoration:none;border-radius:100px;letter-spacing:-.01em">Confirm subscription</a>
        </td></tr>
        <tr><td style="padding:32px 40px">
          <p style="margin:0;font-size:13px;color:#999;line-height:1.6">
            If you didn't sign up, you can ignore this email — nothing will happen.
            <br>Or copy this link: ${confirmUrl}
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function broadcastEmailHtml(opts: {
  post: { title: string; excerpt?: string | null; image?: string | null; readTime?: string | null; url: string };
  unsubToken: string;
}): string {
  const { post, unsubToken } = opts;
  const unsubUrl = `${BASE_URL}/api/blog/unsubscribe?token=${unsubToken}`;
  const excerpt = post.excerpt ?? 'Read the latest from Reframe Visuals.';

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Inter,'Helvetica Neue',Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px">
    <tr><td>
      <table width="560" cellpadding="0" cellspacing="0" style="margin:0 auto;background:#fff;border-radius:16px;border:1px solid #e5e5e5;overflow:hidden">
        ${post.image ? `<tr><td><img src="${post.image}" alt="${post.title}" width="560" style="display:block;width:100%;max-height:280px;object-fit:cover"></td></tr>` : ''}
        <tr><td style="padding:36px 40px 0">
          <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:.15em;text-transform:uppercase;color:#999">New post${post.readTime ? ` · ${post.readTime} read` : ''}</p>
          <h1 style="margin:0 0 16px;font-size:26px;font-weight:800;color:#111;letter-spacing:-.03em;line-height:1.2">${post.title}</h1>
          <p style="margin:0 0 32px;font-size:16px;color:#555;line-height:1.6">${excerpt}</p>
          <a href="${post.url}" style="display:inline-block;padding:14px 32px;background:#111;color:#fff;font-size:15px;font-weight:700;text-decoration:none;border-radius:100px;letter-spacing:-.01em">Read article →</a>
        </td></tr>
        <tr><td style="padding:32px 40px">
          <hr style="border:none;border-top:1px solid #f0f0f0;margin-bottom:24px">
          <p style="margin:0;font-size:12px;color:#aaa;line-height:1.7">
            You're receiving this because you subscribed at reframevisuals.com.
            <br><a href="${unsubUrl}" style="color:#aaa">Unsubscribe</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
