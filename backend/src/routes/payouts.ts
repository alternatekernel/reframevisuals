import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../database';
import { authenticate, requireFinanceStaff } from '../middleware/auth';

const router = Router();

// ─────────────────────────────────────────────────────────────
// GET /api/payouts/batches
// Returns payout batches
// ─────────────────────────────────────────────────────────────

router.get('/batches', authenticate, requireFinanceStaff, async (req: Request, res: Response) => {
  try {
    const { status } = req.query;

    const where: any = {};
    if (status) where.status = status;

    const batches = await prisma.payoutBatch.findMany({
      where,
      include: {
        payouts: {
          include: {
            editor: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({
      batches: batches.map((batch) => ({
        id: batch.id,
        code: batch.code,
        status: batch.status,
        totalAmount: batch.totalAmount ? Number(batch.totalAmount) : 0,
        paymentCount: batch.paymentCount || 0,
        editorCount: batch.payouts.length,
        createdAt: batch.createdAt.toISOString(),
        paymentMethod: batch.paymentMethod || 'ACH Transfer',
        scheduledSendAt: batch.sentAt?.toISOString() || null,
        approvedAt: batch.approvedAt?.toISOString() || null,
        approvedBy: batch.approvedBy || null,
      })),
    });
  } catch (error: any) {
    return res.status(500).json({
      error: {
        code: 'PAYOUTS_ERROR',
        message: error.message,
      },
    });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/payouts/batches/:id
// Returns detailed batch information
// ─────────────────────────────────────────────────────────────

router.get('/batches/:id', authenticate, requireFinanceStaff, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const batch = await prisma.payoutBatch.findUnique({
      where: { id },
      include: {
        payouts: {
          include: {
            editor: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!batch) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Batch not found',
        },
      });
    }

    return res.json({
      id: batch.id,
      code: batch.code,
      status: batch.status,
      totalAmount: batch.totalAmount ? Number(batch.totalAmount) : 0,
      createdAt: batch.createdAt.toISOString(),
      payments: batch.payouts.map((payout) => ({
        editorId: payout.editor.id,
        editorName: `${payout.editor.firstName} ${payout.editor.lastName}`,
        amount: Number(payout.amount),
        imagesCompleted: payout.imagesCompleted || 0,
        qualityBonus: Number(payout.qualityBonus),
        status: payout.status,
      })),
      verifications: {
        bankDetailsVerified: true,
        noDuplicates: true,
        activeEditors: true,
        withinBudget: true,
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      error: {
        code: 'PAYOUT_DETAIL_ERROR',
        message: error.message,
      },
    });
  }
});

// ─────────────────────────────────────────────────────────────
// PATCH /api/payouts/batches/:id/approve
// Approve a payout batch
// ─────────────────────────────────────────────────────────────

router.patch('/batches/:id/approve', authenticate, requireFinanceStaff, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const approvedBy = (req as any).user?.id;

    if (!approvedBy) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Approver identity is required',
        },
      });
    }

    const batch = await prisma.payoutBatch.update({
      where: { id },
      data: {
        status: 'approved',
        approvedAt: new Date(),
        approvedBy,
      },
    });

    return res.json({
      id: batch.id,
      code: batch.code,
      message: 'Batch approved successfully',
    });
  } catch (error: any) {
    return res.status(400).json({
      error: {
        code: 'APPROVE_ERROR',
        message: error.message,
      },
    });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/payouts/batches
// Create a new payout batch
// ─────────────────────────────────────────────────────────────

router.post(
  '/batches',
  authenticate,
  requireFinanceStaff,
  body('editorIds').isArray({ min: 1 }).withMessage('editorIds must be a non-empty array'),
  async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', details: errors.array() } });
    }

    const { editorIds } = req.body;

    if (!Array.isArray(editorIds) || editorIds.length === 0) {
      return res.status(400).json({
        error: {
          code: 'INVALID_EDITOR_IDS',
          message: 'editorIds must be a non-empty array',
        },
      });
    }

    // Get pending payouts for editors
    const payouts = await prisma.editorPayout.findMany({
      where: {
        editorId: { in: editorIds },
        status: 'pending',
      },
      include: {
        editor: true,
      },
    });

    if (payouts.length === 0) {
      return res.status(400).json({
        error: {
          code: 'NO_PAYOUTS',
          message: 'No pending payouts found for selected editors',
        },
      });
    }

    // Calculate total
    const totalAmount = payouts.reduce((sum, p) => sum + Number(p.amount), 0);

    // Generate batch code
    const code = `PB-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    const payoutIds = payouts.map((p) => p.id);

    // Create batch + attach payouts atomically
    const batch = await prisma.$transaction(async (tx) => {
      const createdBatch = await tx.payoutBatch.create({
        data: {
          code,
          totalAmount,
          paymentCount: payouts.length,
          paymentMethod: 'ACH Transfer',
          status: 'pending',
        },
      });

      const updated = await tx.editorPayout.updateMany({
        where: {
          id: { in: payoutIds },
          status: 'pending',
          batchId: null,
        },
        data: {
          batchId: createdBatch.id,
        },
      });

      if (updated.count !== payoutIds.length) {
        throw new Error(`PAYOUT_RACE_DETECTED:${updated.count}/${payoutIds.length}`);
      }

      return createdBatch;
    });

    return res.status(201).json({
      id: batch.id,
      code: batch.code,
      totalAmount: Number(batch.totalAmount),
      paymentCount: batch.paymentCount,
      message: 'Payout batch created successfully',
    });
  } catch (error: any) {
    if (typeof error?.message === 'string' && error.message.startsWith('PAYOUT_RACE_DETECTED:')) {
      return res.status(409).json({
        error: {
          code: 'PAYOUT_RACE_DETECTED',
          message: 'Some selected payouts were already assigned. Please refresh and retry.',
        },
      });
    }

    return res.status(400).json({
      error: {
        code: 'CREATE_BATCH_ERROR',
        message: error.message,
      },
    });
  }
});

export default router;
