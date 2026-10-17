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
      where: { ...tenantFilter, status: { in: ['pending', 'unpaid'] } },
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
        code: inv.invoiceNumber || inv.id.substring(0, 8).toUpperCase(),
        customer: inv.billToCompany || inv.billToName || inv.customer?.companyName || inv.customer?.name || 'Unknown',
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
// INVOICE CRUD
// ─────────────────────────────────────────────────────────────

const INVOICE_SEQ_START = 89;
const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

const serializeInvoice = (inv: any) => ({
  id: inv.id,
  invoiceNumber: inv.invoiceNumber,
  issueDate: inv.issueDate.toISOString(),
  dueDate: inv.dueDate.toISOString(),
  paidAt: inv.paidAt ? inv.paidAt.toISOString() : null,
  status: inv.status,
  currency: inv.currency,
  subtotal: Number(inv.subtotal),
  taxRate: Number(inv.taxRate),
  taxAmount: Number(inv.taxAmount),
  amount: Number(inv.amount),
  notes: inv.notes,
  paymentReference: inv.paymentReference || inv.stripePaymentId || null,
  customerId: inv.customerId,
  billTo: {
    name: inv.billToName,
    company: inv.billToCompany,
    address: inv.billToAddress,
    email: inv.billToEmail
  },
  items: (inv.items || []).map((it: any) => ({
    id: it.id,
    description: it.description,
    note: it.note,
    quantity: Number(it.quantity),
    unitPrice: Number(it.unitPrice),
    amount: Number(it.amount)
  }))
});

const nextInvoiceNumber = async (): Promise<string> => {
  const year = new Date().getFullYear();
  const prefix = `RFV-${year}-`;
  const existing = await prisma.invoice.findMany({
    where: { invoiceNumber: { startsWith: prefix } },
    select: { invoiceNumber: true }
  });
  const max = existing.reduce((m, r) => {
    const n = parseInt((r.invoiceNumber || '').slice(prefix.length), 10);
    return Number.isFinite(n) && n > m ? n : m;
  }, INVOICE_SEQ_START - 1);
  return `${prefix}${String(max + 1).padStart(3, '0')}`;
};

interface ParsedInvoice {
  data: any;
  items: any[];
}

const parseInvoiceBody = (body: any): ParsedInvoice | string => {
  const items = Array.isArray(body?.items) ? body.items : [];
  if (!body?.customerId) return 'customerId is required';
  if (items.length === 0) return 'At least one line item is required';

  const parsedItems: any[] = [];
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    const quantity = Number(it.quantity);
    const unitPrice = Number(it.unitPrice);
    if (!String(it.description || '').trim()) return `Item ${i + 1}: description is required`;
    if (!(quantity > 0) || !(unitPrice >= 0)) return `Item ${i + 1}: invalid quantity or price`;
    parsedItems.push({
      description: String(it.description).trim(),
      note: it.note ? String(it.note).trim() : null,
      quantity,
      unitPrice,
      amount: round2(quantity * unitPrice),
      sortOrder: i
    });
  }

  const issueDate = body.issueDate ? new Date(body.issueDate) : new Date();
  const dueDate = body.dueDate ? new Date(body.dueDate) : null;
  if (isNaN(issueDate.getTime()) || !dueDate || isNaN(dueDate.getTime())) return 'Valid issueDate and dueDate are required';

  const taxRate = Number(body.taxRate || 0);
  if (!(taxRate >= 0 && taxRate < 1)) return 'taxRate must be a fraction between 0 and 1';

  const subtotal = round2(parsedItems.reduce((s, it) => s + it.amount, 0));
  const taxAmount = round2(subtotal * taxRate);

  return {
    items: parsedItems,
    data: {
      customerId: String(body.customerId),
      issueDate,
      dueDate,
      currency: body.currency ? String(body.currency).toUpperCase() : 'USD',
      subtotal,
      taxRate,
      taxAmount,
      amount: round2(subtotal + taxAmount),
      notes: body.notes ? String(body.notes) : null,
      billToName: body.billTo?.name || null,
      billToCompany: body.billTo?.company || null,
      billToAddress: body.billTo?.address || null,
      billToEmail: body.billTo?.email || null
    }
  };
};

router.get('/invoice-customers', async (_req, res) => {
  try {
    const customers = await prisma.customer.findMany({
      where: { isGuest: false },
      select: { id: true, name: true, companyName: true, email: true, contactEmail: true, country: true },
      orderBy: { createdAt: 'desc' },
      take: 500
    });
    return res.json({ customers });
  } catch (error: any) {
    return res.status(500).json({ error: { code: 'INVOICE_CUSTOMERS_ERROR', message: error.message } });
  }
});

router.get('/invoices/next-number', async (_req, res) => {
  try {
    return res.json({ invoiceNumber: await nextInvoiceNumber() });
  } catch (error: any) {
    return res.status(500).json({ error: { code: 'INVOICE_NUMBER_ERROR', message: error.message } });
  }
});

router.get('/invoices/:id', async (req, res) => {
  try {
    const inv = await prisma.invoice.findUnique({
      where: { id: req.params.id },
      include: { items: { orderBy: { sortOrder: 'asc' } } }
    });
    if (!inv) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Invoice not found' } });
    return res.json({ invoice: serializeInvoice(inv) });
  } catch (error: any) {
    return res.status(500).json({ error: { code: 'INVOICE_ERROR', message: error.message } });
  }
});

router.post('/invoices', async (req, res) => {
  const parsed = parseInvoiceBody(req.body);
  if (typeof parsed === 'string') {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: parsed } });
  }
  try {
    const customer = await prisma.customer.findUnique({ where: { id: parsed.data.customerId }, select: { id: true } });
    if (!customer) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Customer not found' } });

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const inv = await prisma.invoice.create({
          data: {
            ...parsed.data,
            invoiceNumber: await nextInvoiceNumber(),
            status: 'unpaid',
            items: { create: parsed.items }
          },
          include: { items: { orderBy: { sortOrder: 'asc' } } }
        });
        return res.status(201).json({ invoice: serializeInvoice(inv) });
      } catch (e: any) {
        if (e.code !== 'P2002' || attempt === 2) throw e;
      }
    }
    return res.status(500).json({ error: { code: 'INVOICE_NUMBER_ERROR', message: 'Could not allocate invoice number' } });
  } catch (error: any) {
    return res.status(500).json({ error: { code: 'INVOICE_CREATE_ERROR', message: error.message } });
  }
});

router.put('/invoices/:id', async (req, res) => {
  const parsed = parseInvoiceBody(req.body);
  if (typeof parsed === 'string') {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: parsed } });
  }
  try {
    const existing = await prisma.invoice.findUnique({ where: { id: req.params.id }, select: { id: true, status: true } });
    if (!existing) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Invoice not found' } });
    if (existing.status === 'paid') {
      return res.status(409).json({ error: { code: 'INVOICE_LOCKED', message: 'Paid invoices cannot be edited' } });
    }

    const inv = await prisma.$transaction(async (tx) => {
      await tx.invoiceItem.deleteMany({ where: { invoiceId: req.params.id } });
      return tx.invoice.update({
        where: { id: req.params.id },
        data: { ...parsed.data, items: { create: parsed.items } },
        include: { items: { orderBy: { sortOrder: 'asc' } } }
      });
    });
    return res.json({ invoice: serializeInvoice(inv) });
  } catch (error: any) {
    return res.status(500).json({ error: { code: 'INVOICE_UPDATE_ERROR', message: error.message } });
  }
});

router.post('/invoices/:id/mark-paid', async (req, res) => {
  try {
    const existing = await prisma.invoice.findUnique({ where: { id: req.params.id }, select: { id: true, status: true } });
    if (!existing) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Invoice not found' } });
    if (existing.status === 'paid') {
      return res.status(409).json({ error: { code: 'ALREADY_PAID', message: 'Invoice is already paid' } });
    }

    const paidAt = req.body?.paidAt ? new Date(req.body.paidAt) : new Date();
    if (isNaN(paidAt.getTime())) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid paidAt' } });
    }

    const inv = await prisma.invoice.update({
      where: { id: req.params.id },
      data: {
        status: 'paid',
        paidAt,
        paymentReference: req.body?.paymentReference ? String(req.body.paymentReference) : undefined
      },
      include: { items: { orderBy: { sortOrder: 'asc' } } }
    });
    return res.json({ invoice: serializeInvoice(inv) });
  } catch (error: any) {
    return res.status(500).json({ error: { code: 'INVOICE_PAID_ERROR', message: error.message } });
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
