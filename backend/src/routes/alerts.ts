import { Router, Request, Response } from 'express';
import { prisma } from '../database';

const router = Router();

// ─────────────────────────────────────────────────────────────
// GET /api/alerts
// Returns active alerts
// ─────────────────────────────────────────────────────────────

router.get('/', async (req: Request, res: Response) => {
  try {
    const { limit = 10, severity, dismissed } = req.query;

    const where: any = {
      expiresAt: { gte: new Date() },
    };

    if (severity) {
      where.severity = severity;
    }

    if (dismissed === 'false') {
      where.isDismissed = false;
    }

    const alerts = await prisma.alert.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: Number(limit),
    });

    const totalCount = await prisma.alert.count({ where });
    const unreadCount = await prisma.alert.count({
      where: { ...where, isDismissed: false },
    });

    return res.json({
      alerts: alerts.map((alert) => ({
        id: alert.id,
        severity: alert.severity,
        title: alert.title,
        message: alert.message,
        action: alert.actionLabel,
        actionLink: alert.actionLink,
        isDismissed: alert.isDismissed,
        createdAt: alert.createdAt.toISOString(),
        expiresAt: alert.expiresAt.toISOString(),
      })),
      totalCount,
      unreadCount,
    });
  } catch (error: any) {
    return res.status(500).json({
      error: {
        code: 'ALERTS_ERROR',
        message: error.message,
      },
    });
  }
});

// ─────────────────────────────────────────────────────────────
// PATCH /api/alerts/:id/dismiss
// Dismiss an alert
// ─────────────────────────────────────────────────────────────

router.patch('/:id/dismiss', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { dismissedBy } = req.body;

    const alert = await prisma.alert.update({
      where: { id },
      data: {
        isDismissed: true,
        dismissedBy: dismissedBy || null,
        dismissedAt: new Date(),
      },
    });

    return res.json({
      id: alert.id,
      message: 'Alert dismissed successfully',
    });
  } catch (error: any) {
    return res.status(400).json({
      error: {
        code: 'DISMISS_ERROR',
        message: error.message,
      },
    });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/alerts
// Create a new alert (internal use or webhook triggers)
// ─────────────────────────────────────────────────────────────

router.post('/', async (req: Request, res: Response) => {
  try {
    const { severity, title, message, alertType, actionLink, actionLabel, expiresAt } = req.body;

    const alert = await prisma.alert.create({
      data: {
        severity: severity as string,
        title,
        message,
        alertType,
        actionLink,
        actionLabel,
        expiresAt: expiresAt ? new Date(expiresAt) : new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    return res.status(201).json({
      id: alert.id,
      message: 'Alert created successfully',
    });
  } catch (error: any) {
    return res.status(400).json({
      error: {
        code: 'CREATE_ALERT_ERROR',
        message: error.message,
      },
    });
  }
});

export default router;
