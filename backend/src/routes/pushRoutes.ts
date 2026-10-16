import { Router } from 'express';
import { authenticate, requireStaff, type AuthRequest } from '../middleware/auth';
import prisma from '../database';

const router = Router();

router.post('/subscribe', authenticate, requireStaff, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    const { endpoint, keys } = req.body || {};
    const p256dh = keys?.p256dh;
    const auth = keys?.auth;

    if (!userId) return res.status(401).json({ success: false, message: 'Not authenticated' });
    if (!endpoint || !p256dh || !auth) {
      return res.status(400).json({ success: false, message: 'Invalid push subscription payload' });
    }

    await prisma.pushSubscription.upsert({
      where: {
        userId_endpoint: {
          userId,
          endpoint: String(endpoint),
        },
      },
      update: {
        p256dh: String(p256dh),
        auth: String(auth),
        userAgent: String(req.headers['user-agent'] || ''),
      },
      create: {
        userId,
        endpoint: String(endpoint),
        p256dh: String(p256dh),
        auth: String(auth),
        userAgent: String(req.headers['user-agent'] || ''),
      },
    });

    return res.json({ success: true, message: 'Push subscription saved' });
  } catch (err) {
    console.error('[push] subscribe failed', err);
    return res.status(500).json({ success: false, message: 'Failed to save push subscription' });
  }
});

export default router;
