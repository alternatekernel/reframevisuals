import { Router } from 'express';
import { prisma } from '../database';

const router = Router();

// ─────────────────────────────────────────────────────────────
// GET /api/metrics/hero
// Returns all hero metrics for dashboard overview
// ─────────────────────────────────────────────────────────────

export async function getHeroMetrics() {
  const now = new Date();
  try {
    // FIX #4: SLA health — use two targeted COUNT queries instead of loading all active order rows into memory.
    const [totalActive, overdueActive] = await Promise.all([
      prisma.order.count({
        where: { status: { in: ['new_review', 'awaiting_approval', 'in_progress', 'ready_qc', 'revision_needed'] } },
      }),
      prisma.order.count({
        where: {
          status: { in: ['new_review', 'awaiting_approval', 'in_progress', 'ready_qc', 'revision_needed'] },
          expectedCompletion: { lt: now, not: null },
        },
      }),
    ]);

    const slaHealth = totalActive > 0
      ? Math.round(((totalActive - overdueActive) / totalActive) * 100)
      : 100;

    // Capacity Utilization
    const editors = await prisma.editor.findMany({
      where: { status: { not: 'offline' } },
      select: {
        capacity: true,
        currentLoad: true,
      },
    });

    const totalCapacity = editors.reduce((sum, e) => sum + e.capacity, 0);
    const currentLoad = editors.reduce((sum, e) => sum + e.currentLoad, 0);
    const capacityUtilization = totalCapacity > 0
      ? Math.round((currentLoad / totalCapacity) * 100)
      : 0;

    const availableSlots = totalCapacity - currentLoad;

    // Active Orders breakdown — use grouped count, not individual findMany
    const activeBreakdown = await prisma.order.groupBy({
      by: ['status'],
      _count: { id: true },
      where: { status: { in: ['new_review', 'awaiting_approval', 'in_progress', 'ready_qc', 'revision_needed'] } },
    });
    const breakdownMap: Record<string, number> = {};
    for (const g of activeBreakdown) breakdownMap[g.status] = g._count.id;
    const newOrders = breakdownMap['new_review'] ?? 0;
    const inProgressOrders = breakdownMap['in_progress'] ?? 0;
    const readyQCOrders = breakdownMap['ready_qc'] ?? 0;

    // FIX #2: Weekly Revenue — push SUM aggregation to the database, zero row hydration.
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const prevWeekStart = new Date(startOfWeek);
    prevWeekStart.setDate(prevWeekStart.getDate() - 7);

    const [weeklyAgg, prevWeekAgg] = await Promise.all([
      prisma.order.aggregate({
        _sum: { totalPrice: true },
        where: { status: 'completed', completedAt: { gte: startOfWeek } },
      }),
      prisma.order.aggregate({
        _sum: { totalPrice: true },
        where: { status: 'completed', completedAt: { gte: prevWeekStart, lt: startOfWeek } },
      }),
    ]);

    const weeklyRevenue = Number(weeklyAgg._sum.totalPrice ?? 0);
    const prevWeekRevenue = Number(prevWeekAgg._sum.totalPrice ?? 0);
    const revenueTrend = prevWeekRevenue > 0
      ? Math.round(((weeklyRevenue - prevWeekRevenue) / prevWeekRevenue) * 100)
      : 0;

    return {
      slaHealth: {
        value: slaHealth,
        trend: slaHealth - 95,
        target: 95,
        status: slaHealth >= 98 ? 'good' : slaHealth >= 90 ? 'warning' : 'critical',
        timestamp: now.toISOString(),
      },
      capacityUtilization: {
        value: capacityUtilization,
        available: availableSlots,
        total: totalCapacity,
        trend: capacityUtilization - 70,
        timestamp: now.toISOString(),
      },
      activeOrders: {
        value: totalActive,
        breakdown: {
          new: newOrders,
          inProgress: inProgressOrders,
          readyQC: readyQCOrders,
        },
        trend: totalActive - 18,
        timestamp: now.toISOString(),
      },
      weeklyRevenue: {
        value: weeklyRevenue,
        currency: 'USD',
        trend: revenueTrend,
        timestamp: now.toISOString(),
      },
    };
  } catch (error) {
    console.error('Error fetching hero metrics:', error);
    throw error;
  }
}

router.get('/hero', async (_req, res) => {
  try {
    const metrics = await getHeroMetrics();
    return res.json(metrics);
  } catch (error: any) {
    return res.status(500).json({
      error: {
        code: 'METRICS_ERROR',
        message: error.message,
      },
    });
  }
});

export default router;
