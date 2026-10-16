import { Router, Response } from 'express';
import { prisma } from '../database';
import { authenticate, requireFinanceStaff } from '../middleware/auth';
import { createTenantFilter } from '../middleware/tenant';

const router = Router();

// ─────────────────────────────────────────────────────────────
// INVOICES
// ─────────────────────────────────────────────────────────────

router.get('/invoices', authenticate, requireFinanceStaff, async (_req: any, res: Response) => {
  try {
    const { targetTenantId } = (_req as any).query;
    const user = (_req as any).user;

    // Determine if user is platform-level admin
    const isPlatform = user?.role === 'admin' || user?.role === 'manager' || user?.role === 'accountant';
    
    // Admin override: allow targetTenantId to view specific customer data
    let tenantId: string | null = null;
    if (isPlatform && targetTenantId) {
      tenantId = targetTenantId as string;
    } else if (!isPlatform) {
      tenantId = user?.tenantId || null;
    }

    // Create tenant filter
    const tenantFilter = createTenantFilter(tenantId, isPlatform);

    const invoices = await prisma.invoice.findMany({
      where: (Object.keys(tenantFilter).length > 0 ? tenantFilter : {}) as any,
      include: { customer: true },
      orderBy: { createdAt: 'desc' }
    });

    const totalOutstanding = await prisma.invoice.aggregate({
      where: { ...tenantFilter, status: 'pending' },
      _sum: { amount: true }
    });

    const overdue = await prisma.invoice.aggregate({
      where: { ...tenantFilter, status: 'overdue' },
      _sum: { amount: true }
    });

    const paidThisMonth = await prisma.invoice.aggregate({
      where: {
        ...tenantFilter,
        status: 'paid',
        paidAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        }
      },
      _sum: { amount: true }
    });

    return res.json({
      invoices: invoices.map(inv => ({
        id: inv.id,
        code: inv.id.substring(0, 8).toUpperCase(),
        customer: inv.customer?.companyName || 'Unknown',
        amount: inv.amount,
        status: inv.status,
        issued: inv.createdAt.toISOString().split('T')[0],
        due: inv.dueDate.toISOString().split('T')[0],
        paid: inv.paidAt ? inv.paidAt.toISOString().split('T')[0] : null
      })),
      metrics: {
        totalOutstanding: totalOutstanding._sum.amount || 0,
        overdue: overdue._sum.amount || 0,
        paidThisMonth: paidThisMonth._sum.amount || 0,
        avgPaymentTime: '8 days'
      }
    });
  } catch (error: any) {
    return res.status(500).json({ error: { code: 'INVOICES_ERROR', message: error.message } });
  }
});

// ─────────────────────────────────────────────────────────────
// FINANCE DASHBOARD (P&L)
// ─────────────────────────────────────────────────────────────

router.get('/dashboard', authenticate, requireFinanceStaff, async (_req, res) => {
  try {
    // Simplified P&L for dashboard
    const revenue = await prisma.invoice.aggregate({
      where: { status: 'paid' },
      _sum: { amount: true }
    });

    const cogs = await prisma.editorPayout.aggregate({
      where: { status: 'completed' },
      _sum: { amount: true }
    });

    const revenueAmount = revenue._sum.amount ? Number(revenue._sum.amount) : 0;
    const cogsAmount = cogs._sum.amount ? Number(cogs._sum.amount) : 0;
    const grossMargin = revenueAmount - cogsAmount;
    const grossMarginPercent = revenueAmount ? Math.round((grossMargin / revenueAmount) * 100) : 0;

    return res.json({
      metrics: {
        revenue: revenueAmount,
        cogs: cogsAmount,
        grossMargin,
        grossMarginPercent,
        netProfit: grossMargin * 0.8, // Simplified tax/opex
        burnRate: 4500
      },
      trends: [
        { month: 'Oct', revenue: 12000, profit: 4500 },
        { month: 'Nov', revenue: 13500, profit: 5200 },
        { month: 'Dec', revenue: 11800, profit: 4100 },
        { month: 'Jan', revenue: 14200, profit: 6100 },
        { month: 'Feb', revenue: 15600, profit: 7200 },
        { month: 'Mar', revenue: 17800, profit: 8500 },
      ]
    });
  } catch (error: any) {
    return res.status(500).json({ error: { code: 'FINANCE_DASHBOARD_ERROR', message: error.message } });
  }
});

export default router;
