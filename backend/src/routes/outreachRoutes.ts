import { Router, Request, Response } from 'express';
import { prisma } from '../database';
import { AuthRequest } from '../middleware/auth';
import { computeNextSendAt } from '../services/outreachService';

// ── Admin router (mounted behind authenticate + requireStaff) ────

const router = Router();

// List sequences with steps and enrollment stats
router.get('/sequences', async (_req: Request, res: Response) => {
  const [sequences, grouped] = await Promise.all([
    prisma.outreachSequence.findMany({
      include: { steps: { orderBy: { stepOrder: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.outreachEnrollment.groupBy({ by: ['sequenceId', 'status'], _count: { _all: true } }),
  ]);
  const stats: Record<string, Record<string, number>> = {};
  grouped.forEach((g) => {
    stats[g.sequenceId] = stats[g.sequenceId] || {};
    stats[g.sequenceId][g.status] = g._count._all;
  });
  return res.json({ sequences: sequences.map((s) => ({ ...s, stats: stats[s.id] || {} })) });
});

const validateSteps = (steps: any): string | null => {
  if (!Array.isArray(steps) || steps.length === 0) return 'At least one step is required';
  for (const s of steps) {
    if (!s.subject?.trim() || !s.body?.trim()) return 'Every step needs a subject and body';
    if (s.delayDays !== undefined && (isNaN(Number(s.delayDays)) || Number(s.delayDays) < 0)) return 'delayDays must be >= 0';
  }
  return null;
};

router.post('/sequences', async (req: Request, res: Response) => {
  const { name, steps, active } = req.body || {};
  if (!name?.trim()) return res.status(400).json({ message: 'Name is required' });
  const stepError = validateSteps(steps);
  if (stepError) return res.status(400).json({ message: stepError });

  const sequence = await prisma.outreachSequence.create({
    data: {
      name: name.trim(),
      active: active !== false,
      steps: {
        create: steps.map((s: any, i: number) => ({
          stepOrder: i,
          delayDays: Number(s.delayDays) || 0,
          subject: s.subject.trim(),
          body: s.body.trim(),
        })),
      },
    },
    include: { steps: { orderBy: { stepOrder: 'asc' } } },
  });
  return res.status(201).json({ sequence });
});

router.patch('/sequences/:id', async (req: Request, res: Response) => {
  const { name, active, steps } = req.body || {};
  const existing = await prisma.outreachSequence.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ message: 'Sequence not found' });

  if (steps !== undefined) {
    const stepError = validateSteps(steps);
    if (stepError) return res.status(400).json({ message: stepError });
    // Replace steps wholesale — in-flight enrollments continue at their currentStep index
    await prisma.outreachStep.deleteMany({ where: { sequenceId: req.params.id } });
    await prisma.outreachStep.createMany({
      data: steps.map((s: any, i: number) => ({
        sequenceId: req.params.id,
        stepOrder: i,
        delayDays: Number(s.delayDays) || 0,
        subject: s.subject.trim(),
        body: s.body.trim(),
      })),
    });
  }

  const sequence = await prisma.outreachSequence.update({
    where: { id: req.params.id },
    data: {
      ...(name !== undefined && { name: String(name).trim() }),
      ...(active !== undefined && { active: Boolean(active) }),
    },
    include: { steps: { orderBy: { stepOrder: 'asc' } } },
  });
  return res.json({ sequence });
});

router.delete('/sequences/:id', async (req: Request, res: Response) => {
  await prisma.outreachSequence.delete({ where: { id: req.params.id } });
  return res.json({ success: true });
});

// Enroll leads into a sequence
router.post('/sequences/:id/enroll', async (req: AuthRequest, res: Response) => {
  const { leadIds } = req.body || {};
  if (!Array.isArray(leadIds) || leadIds.length === 0) {
    return res.status(400).json({ message: 'leadIds array required' });
  }
  const sequence = await prisma.outreachSequence.findUnique({
    where: { id: req.params.id },
    include: { steps: { orderBy: { stepOrder: 'asc' } } },
  });
  if (!sequence) return res.status(404).json({ message: 'Sequence not found' });
  if (!sequence.active) return res.status(400).json({ message: 'Sequence is paused — activate it before enrolling leads' });
  if (sequence.steps.length === 0) return res.status(400).json({ message: 'Sequence has no steps' });

  const leads = await prisma.lead.findMany({ where: { id: { in: leadIds } } });
  const results = { enrolled: 0, skippedUnsubscribed: 0, skippedExisting: 0 };

  for (const lead of leads) {
    if (lead.unsubscribed) {
      results.skippedUnsubscribed += 1;
      continue;
    }
    try {
      await prisma.outreachEnrollment.create({
        data: {
          sequenceId: sequence.id,
          leadId: lead.id,
          enrolledById: req.user?.id ?? null,
          nextSendAt: computeNextSendAt(sequence.steps[0].delayDays),
        },
      });
      results.enrolled += 1;
    } catch (err: any) {
      if (err?.code === 'P2002') results.skippedExisting += 1;
      else throw err;
    }
  }
  return res.json(results);
});

// Enrollments for a lead (drawer view)
router.get('/enrollments', async (req: Request, res: Response) => {
  const { leadId } = req.query as any;
  if (!leadId) return res.status(400).json({ message: 'leadId query param required' });
  const enrollments = await prisma.outreachEnrollment.findMany({
    where: { leadId },
    include: { sequence: { include: { _count: { select: { steps: true } } } } },
    orderBy: { createdAt: 'desc' },
  });
  return res.json({ enrollments });
});

router.post('/enrollments/:id/stop', async (req: Request, res: Response) => {
  const enrollment = await prisma.outreachEnrollment.findUnique({ where: { id: req.params.id } });
  if (!enrollment) return res.status(404).json({ message: 'Enrollment not found' });
  const updated = await prisma.outreachEnrollment.update({
    where: { id: req.params.id },
    data: { status: 'stopped', nextSendAt: null },
  });
  return res.json({ enrollment: updated });
});

// ── Public unsubscribe (registered WITHOUT auth, before the admin mount) ──

export const unsubscribeHandler = async (req: Request, res: Response) => {
  const enrollment = await prisma.outreachEnrollment.findUnique({
    where: { id: req.params.id },
  }).catch(() => null);

  if (!enrollment) {
    return res.status(404).type('html').send('<p style="font-family:sans-serif">Link not found or already used.</p>');
  }

  await prisma.lead.update({ where: { id: enrollment.leadId }, data: { unsubscribed: true } }).catch(() => {});
  await prisma.outreachEnrollment.updateMany({
    where: { leadId: enrollment.leadId, status: 'active' },
    data: { status: 'unsubscribed', nextSendAt: null },
  });

  return res.type('html').send(`<!doctype html>
<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Unsubscribed</title></head>
<body style="font-family:-apple-system,sans-serif;display:flex;align-items:center;justify-content:center;min-height:90vh;margin:0;background:#fafafa">
  <div style="text-align:center;padding:40px;background:#fff;border:1px solid #eee;border-radius:16px;max-width:400px">
    <div style="font-size:32px;margin-bottom:12px">✓</div>
    <h1 style="font-size:18px;margin:0 0 8px">You're unsubscribed</h1>
    <p style="font-size:14px;color:#666;margin:0">You won't receive any more emails from us.</p>
  </div>
</body></html>`);
};

export { router as outreachRouter };
