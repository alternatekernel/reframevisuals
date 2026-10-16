import { Router, Request, Response } from 'express';
import { prisma } from '../database';

const router = Router();

// ─────────────────────────────────────────────────────────────
// GET /api/editors
// Returns list of all editors with real-time status
// ─────────────────────────────────────────────────────────────

router.get('/', async (req: Request, res: Response) => {
  try {
    const { status, tier, sort = 'name', order = 'asc' } = req.query;

    const where: any = {};
    if (status) where.status = status;
    if (tier) where.tier = tier;

    const orderBy: any = {};
    if (sort === 'name') orderBy.lastName = order;
    if (sort === 'quality') orderBy.qualityScore = order === 'desc' ? 'desc' : 'asc';
    if (sort === 'utilization') orderBy.currentLoad = order === 'desc' ? 'desc' : 'asc';

    const editors = await prisma.editor.findMany({
      where,
      orderBy,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        tier: true,
        status: true,
        lastActiveAt: true,
        capacity: true,
        currentLoad: true,
        qualityScore: true,
      },
    });

    const onlineCount = editors.filter((e) => e.status === 'online').length;

    return res.json({
      editors: editors.map((editor) => ({
        id: editor.id,
        name: `${editor.firstName} ${editor.lastName}`,
        tier: editor.tier,
        status: editor.status,
        lastActiveAt: editor.lastActiveAt?.toISOString() || null,
        metrics: {
          currentLoad: editor.currentLoad,
          capacity: editor.capacity,
          avgTAT: '4h 22m', // Would be calculated from order history
          qualityScore: Number(editor.qualityScore),
          qualityTrend: Number(editor.qualityScore) >= 95 ? 'up' : Number(editor.qualityScore) >= 90 ? 'stable' : 'down',
          utilization: Math.round((editor.currentLoad / editor.capacity) * 100),
          firstPassQCRate: Number(editor.qualityScore),
        },
      })),
      totalCount: editors.length,
      onlineCount,
    });
  } catch (error: any) {
    return res.status(500).json({
      error: {
        code: 'EDITORS_ERROR',
        message: error.message,
      },
    });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/editors/:id/performance
// Returns detailed performance metrics for an editor
// ─────────────────────────────────────────────────────────────

router.get('/:id/performance', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { period = 'week' } = req.query;

    const editor = await prisma.editor.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        tier: true,
        qualityScore: true,
        capacity: true,
        currentLoad: true,
      },
    });

    if (!editor) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Editor not found',
        },
      });
    }

    // Calculate date range
    const startDate = new Date();
    if (period === 'week') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === 'month') {
      startDate.setDate(startDate.getDate() - 30);
    }

    // Get completed images in period
    const completedImages = await prisma.image.count({
      where: {
        completedBy: id,
        status: 'completed',
        createdAt: { gte: startDate },
      },
    });

    // Get average TAT (simplified)
    const completedOrders = await prisma.order.findMany({
      where: {
        assignedEditorId: id,
        status: 'completed',
        completedAt: { gte: startDate },
      },
      select: {
        startedAt: true,
        completedAt: true,
      },
    });

    const avgTAT =
      completedOrders.length > 0
        ? completedOrders.reduce((acc, order) => {
            if (order.startedAt && order.completedAt) {
              const diff = new Date(order.completedAt).getTime() - new Date(order.startedAt).getTime();
              return acc + diff;
            }
            return acc;
          }, 0) / completedOrders.length
        : 0;

    const avgTATHours = avgTAT ? Math.round(avgTAT / (1000 * 60 * 60)) : 0;
    const avgTATString = `${Math.floor(avgTATHours / 60)}h ${avgTATHours % 60}m`;

    return res.json({
      editorId: id,
      name: `${editor.firstName} ${editor.lastName}`,
      period,
      metrics: {
        imagesCompleted: completedImages,
        avgTAT: avgTATString,
        qualityScore: Number(editor.qualityScore),
        firstPassQCRate: Number(editor.qualityScore),
        revisionCount: 0, // Would be calculated from revision_needed images
        earnings: 0, // Would be calculated from payouts
      },
      history: [], // Would include daily breakdown
    });
  } catch (error: any) {
    return res.status(500).json({
      error: {
        code: 'EDITOR_PERFORMANCE_ERROR',
        message: error.message,
      },
    });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/editors/:id
// Returns a single editor profile
// ─────────────────────────────────────────────────────────────

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const editor = await prisma.editor.findUnique({
      where: { id: req.params.id },
    });

    if (!editor) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Editor not found' },
      });
    }

    return res.json({
      id: editor.id,
      firstName: editor.firstName,
      lastName: editor.lastName,
      name: `${editor.firstName} ${editor.lastName}`,
      email: editor.email,
      tier: editor.tier,
      status: editor.status,
      capacity: editor.capacity,
      currentLoad: editor.currentLoad,
      qualityScore: Number(editor.qualityScore),
      lastActiveAt: editor.lastActiveAt.toISOString(),
      createdAt: editor.createdAt.toISOString(),
      updatedAt: editor.updatedAt.toISOString(),
    });
  } catch (error: any) {
    return res.status(500).json({ error: { code: 'EDITOR_ERROR', message: error.message } });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/editors
// Create an editor profile
// ─────────────────────────────────────────────────────────────

router.post('/', async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, name, email, tier, status, capacity, currentLoad, qualityScore } = req.body;
    const derivedFirstName = firstName || String(name || '').trim().split(' ')[0];
    const derivedLastName = lastName || String(name || '').trim().split(' ').slice(1).join(' ') || 'Editor';

    if (!derivedFirstName || !email) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Editor name and email are required' },
      });
    }

    const editor = await prisma.editor.create({
      data: {
        firstName: derivedFirstName,
        lastName: derivedLastName,
        email,
        tier: tier || 'junior',
        status: status || 'offline',
        capacity: Number(capacity ?? 20),
        currentLoad: Number(currentLoad ?? 0),
        qualityScore: Number(qualityScore ?? 100),
      },
    });

    return res.status(201).json({ editor, message: 'Editor created' });
  } catch (error: any) {
    return res.status(400).json({ error: { code: 'CREATE_EDITOR_ERROR', message: error.message } });
  }
});

// ─────────────────────────────────────────────────────────────
// PUT /api/editors/:id
// Update an editor profile
// ─────────────────────────────────────────────────────────────

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { name, firstName, lastName, email, tier, status, capacity, currentLoad, qualityScore } = req.body;
    const data: any = {};

    if (name && !firstName && !lastName) {
      const parts = String(name).trim().split(' ');
      data.firstName = parts[0];
      data.lastName = parts.slice(1).join(' ') || 'Editor';
    }
    if (firstName !== undefined) data.firstName = firstName;
    if (lastName !== undefined) data.lastName = lastName;
    if (email !== undefined) data.email = email;
    if (tier !== undefined) data.tier = tier;
    if (status !== undefined) data.status = status;
    if (capacity !== undefined) data.capacity = Number(capacity);
    if (currentLoad !== undefined) data.currentLoad = Number(currentLoad);
    if (qualityScore !== undefined) data.qualityScore = Number(qualityScore);

    const editor = await prisma.editor.update({ where: { id: req.params.id }, data });
    return res.json({ editor, message: 'Editor updated' });
  } catch (error: any) {
    return res.status(400).json({ error: { code: 'UPDATE_EDITOR_ERROR', message: error.message } });
  }
});

// ─────────────────────────────────────────────────────────────
// DELETE /api/editors/:id
// Delete an editor profile
// ─────────────────────────────────────────────────────────────

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await prisma.editor.delete({ where: { id: req.params.id } });
    return res.json({ success: true, message: 'Editor deleted' });
  } catch (error: any) {
    return res.status(400).json({ error: { code: 'DELETE_EDITOR_ERROR', message: error.message } });
  }
});

export default router;
