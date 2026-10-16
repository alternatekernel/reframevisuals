import crypto from 'crypto';
import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../database';
import { authenticate } from '../middleware/auth';
import { emailService } from '../services/emailService';

const router = Router();

const pick = (source: Record<string, any>, allowed: string[]): any => {
  const out: Record<string, any> = {};
  for (const key of allowed) {
    if (source[key] !== undefined) out[key] = source[key];
  }
  return out;
};

// Apply authentication to all business/admin routes
router.use(authenticate);

/**
 * Pagination Helper
 */
const getPagination = (query: any) => {
  const page = parseInt(query.page as string) || 1;
  const limit = parseInt(query.limit as string) || 20;
  const skip = (page - 1) * limit;
  return { skip, take: limit, page, limit };
};

// Attendance
router.get('/attendance', async (_req, res) => {
  const { skip, take, page, limit } = getPagination(_req.query);
  const [logs, total] = await Promise.all([
    prisma.attendanceLog.findMany({ 
      skip, 
      take, 
      orderBy: { createdAt: 'desc' } 
    }),
    prisma.attendanceLog.count()
  ]);
  return res.json({ logs, pagination: { total, page, limit, pages: Math.ceil(total / limit) } });
});

router.post('/attendance/clock-in', async (req, res) => {
  const { userId } = req.body;
  const log = await prisma.attendanceLog.create({ data: { userId, date: new Date().toISOString().split('T')[0] } });
  return res.json({ log });
});

// Payroll
router.get('/payroll', async (_req, res) => {
  const { skip, take, page, limit } = getPagination(_req.query);
  const [slips, total] = await Promise.all([
    prisma.paySlip.findMany({ 
      skip, 
      take, 
      orderBy: { createdAt: 'desc' } 
    }),
    prisma.paySlip.count()
  ]);
  return res.json({ slips, pagination: { total, page, limit, pages: Math.ceil(total / limit) } });
});

router.post('/payroll/generate', async (req, res) => {
  const { employeeId, employeeName, period, baseSalary, bonuses, deductions } = req.body;
  const netSalary = baseSalary + bonuses - deductions;
  const slip = await prisma.paySlip.create({ data: { employeeId, employeeName, period, baseSalary, bonuses, deductions, netSalary } });
  return res.json({ slip });
});

// Expenses
router.get('/expenses', async (_req, res) => {
  const { skip, take, page, limit } = getPagination(_req.query);
  const [expenses, total] = await Promise.all([
    prisma.expense.findMany({ 
      skip, 
      take, 
      orderBy: { createdAt: 'desc' } 
    }),
    prisma.expense.count()
  ]);
  return res.json({ expenses, pagination: { total, page, limit, pages: Math.ceil(total / limit) } });
});

router.post('/expenses', async (req, res) => {
  const data = pick(req.body, ['category', 'amount', 'date', 'description']);
  const expense = await prisma.expense.create({ data: data as any });
  return res.json({ expense });
});

// Coerce date-only strings ("2026-07-13" from <input type="date">) into Date
// objects — Prisma rejects bare date strings for DateTime fields.
const coerceLeadDates = (data: Record<string, any>) => {
  for (const key of ['nextFollowUpAt', 'lastContactedAt']) {
    if (data[key]) data[key] = new Date(data[key]);
  }
  return data;
};

// Leads
router.get('/leads', async (req: any, res) => {
  const { skip, take, page, limit } = getPagination(req.query);
  const { assignedToId, q, status } = req.query;
  const where: any = {};
  if (assignedToId === 'unassigned') where.assignedToId = null;
  else if (assignedToId) where.assignedToId = assignedToId as string;
  if (status) where.status = status as string;
  if (q) {
    where.OR = [
      { name: { contains: q as string, mode: 'insensitive' } },
      { email: { contains: q as string, mode: 'insensitive' } },
      { company: { contains: q as string, mode: 'insensitive' } },
    ];
  }

  const [leads, total] = await Promise.all([
    (prisma as any).lead.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        assignedTo: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        _count: { select: { activities: true } },
      },
    }),
    prisma.lead.count({ where }),
  ]);
  return res.json({ leads, pagination: { total, page, limit, pages: Math.ceil(total / limit) } });
});

router.post(
  '/leads',
  body('name').isString().trim().notEmpty(),
  body('email').isEmail(),
  async (req: any, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', details: errors.array() } });
    }

    const data = coerceLeadDates(pick(req.body, ['name', 'email', 'company', 'source', 'status', 'score', 'notes', 'assignedToId', 'nextFollowUpAt']));
    const lead = await (prisma as any).lead.create({
      data,
      include: {
        assignedTo: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        _count: { select: { activities: true } },
      },
    });
    return res.json({ lead });
});

router.patch('/leads/:id', async (req: any, res) => {
  const { id } = req.params;
  const prevLead = await prisma.lead.findUnique({ where: { id } });
  const data = coerceLeadDates(pick(req.body, ['name', 'email', 'company', 'source', 'status', 'score', 'notes', 'assignedToId', 'nextFollowUpAt', 'lastContactedAt']));
  const lead = await (prisma as any).lead.update({
    where: { id },
    data,
    include: {
      assignedTo: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      _count: { select: { activities: true } },
    },
  });

  // Auto-log status changes
  if (prevLead && data.status && data.status !== (prevLead as any).status && req.user?.id) {
    await (prisma as any).leadActivity.create({
      data: {
        leadId: id,
        userId: req.user.id,
        type: 'status_change',
        content: `Status changed from "${prevLead.status}" to "${data.status}"`,
      },
    }).catch(() => {});
  }

  return res.json({ lead });
});

router.delete('/leads/:id', async (_req, res) => {
  const { id } = _req.params;
  await prisma.lead.delete({ where: { id } });
  return res.json({ success: true });
});

// Lead activities
router.get('/leads/:id/activities', async (req, res) => {
  const { id } = req.params;
  const activities = await (prisma as any).leadActivity.findMany({
    where: { leadId: id },
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } },
  });
  return res.json({ activities });
});

router.post('/leads/:id/activities', async (req: any, res) => {
  const { id } = req.params;
  const { type, content, metadata } = req.body;
  if (!type || !content) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'type and content are required' } });

  const activity = await (prisma as any).leadActivity.create({
    data: {
      leadId: id,
      userId: req.user.id,
      type,
      content,
      metadata: metadata ? JSON.stringify(metadata) : undefined,
    },
    include: { user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } },
  });

  // Update lastContactedAt on the lead
  await (prisma as any).lead.update({ where: { id }, data: { lastContactedAt: new Date() } }).catch(() => {});

  return res.json({ activity });
});

router.post('/leads/:id/email', async (req: any, res) => {
  const { id } = req.params;
  const { subject, body: emailBody } = req.body;
  if (!subject || !emailBody) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'subject and body are required' } });

  const lead = await prisma.lead.findUnique({ where: { id } });
  if (!lead) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Lead not found' } });

  // Outreach goes through the Google mailbox (plain text, no tracking) for
  // deliverability — not the transactional SMTP/Resend relay.
  const sent = await emailService.sendOutreachEmail(lead.email, subject, String(emailBody));
  if (!sent) return res.status(502).json({ error: { code: 'EMAIL_SEND_FAILED', message: 'Failed to send email' } });

  const activity = await (prisma as any).leadActivity.create({
    data: {
      leadId: id,
      userId: req.user.id,
      type: 'email',
      content: emailBody,
      metadata: JSON.stringify({ subject }),
    },
    include: { user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } },
  });

  await (prisma as any).lead.update({ where: { id }, data: { lastContactedAt: new Date() } }).catch(() => {});

  return res.json({ success: true, activity });
});

// Campaigns
router.get('/campaigns', async (_req, res) => {
  const { skip, take, page, limit } = getPagination(_req.query);
  const [campaigns, total] = await Promise.all([
    prisma.campaign.findMany({ 
      skip, 
      take, 
      orderBy: { createdAt: 'desc' } 
    }),
    prisma.campaign.count()
  ]);
  return res.json({ campaigns, pagination: { total, page, limit, pages: Math.ceil(total / limit) } });
});

router.post('/campaigns', async (req, res) => {
  const data = pick(req.body, ['name', 'budget', 'startDate', 'endDate', 'channel', 'status']);
  const campaign = await prisma.campaign.create({ data: data as any });
  return res.json({ campaign });
});

router.patch('/campaigns/:id', async (req, res) => {
  const { id } = req.params;
  const data = pick(req.body, ['name', 'budget', 'startDate', 'endDate', 'channel', 'status']);
  const campaign = await prisma.campaign.update({ where: { id }, data: data as any });
  return res.json({ campaign });
});

// Partners
router.get('/partners', async (_req, res) => {
  const { skip, take, page, limit } = getPagination(_req.query);
  const [partners, total] = await Promise.all([
    prisma.partner.findMany({ 
      skip, 
      take, 
      orderBy: { createdAt: 'desc' } 
    }),
    prisma.partner.count()
  ]);
  return res.json({ partners, pagination: { total, page, limit, pages: Math.ceil(total / limit) } });
});

router.post('/partners', async (req, res) => {
  const data = pick(req.body, ['name', 'email', 'company', 'phone', 'status']);
  const partner = await prisma.partner.create({ data: data as any });
  return res.json({ partner });
});

// Customers - with tenant filtering and pagination
router.get('/customers', async (_req, res) => {
  const { tenantId } = _req.query as any;
  const { skip, take, page, limit } = getPagination(_req.query);
  
  const where: any = {};
  if (tenantId) {
    where.tenantId = tenantId as string;
  }
  
  const [customers, total] = await Promise.all([
    prisma.customer.findMany({ 
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        // Optimized: only take recent orders/quotes for list view
        orders: { take: 5, orderBy: { createdAt: 'desc' } },
        quotations: { take: 5, orderBy: { createdAt: 'desc' } },
      }
    }),
    prisma.customer.count({ where })
  ]);

  return res.json({ 
    customers, 
    total, // This total is for backwards compatibility if needed
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    },
    tenantFiltered: !!tenantId 
  });
});

router.get('/customers/:id', async (req, res) => {
  const { id } = req.params;
  const [customer, sessions] = await Promise.all([
    prisma.customer.findUnique({
      where: { id },
      include: {
        orders: { orderBy: { createdAt: 'desc' }, take: 20 },
        quotations: { orderBy: { createdAt: 'desc' }, take: 20 },
        invoices: { orderBy: { createdAt: 'desc' }, take: 20 },
      },
    }),
    prisma.activity.findMany({
      where: { customerId: id, type: 'session' },
      orderBy: { createdAt: 'desc' },
      take: 30,
      select: { id: true, message: true, createdAt: true },
    }),
  ]);
  if (!customer) return res.status(404).json({ error: 'Customer not found' });
  return res.json({ customer, sessions });
});

router.patch('/customers/:id', async (req, res) => {
  const { id } = req.params;
  const { tenantId, ...updateData } = req.body;
  const customer = await prisma.customer.update({ where: { id }, data: updateData });
  return res.json({ customer });
});

router.delete('/customers/:id', async (req, res) => {
  const { id } = req.params;
  await prisma.customer.delete({ where: { id } });
  return res.json({ success: true });
});

// Send a password reset email to a customer's portal account
router.post('/customers/:id/reset-password', async (req, res) => {
  const { id } = req.params;
  try {
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: { user: { select: { id: true, email: true, firstName: true } } },
    });
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });
    if (!customer.user) return res.status(400).json({ success: false, message: 'This customer has no portal account' });

    const rawNonce = crypto.randomBytes(32).toString('hex');
    const hashedNonce = crypto.createHash('sha256').update(rawNonce).digest('hex');
    await prisma.user.update({ where: { id: customer.user.id }, data: { resetTokenNonce: hashedNonce } });

    const resetToken = jwt.sign(
      { id: customer.user.id, action: 'reset_password', nonce: rawNonce },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );
    const resetUrl = `${process.env.BASE_URL}/reset-password?token=${resetToken}`;

    await emailService.sendEmail(
      customer.email,
      'Reset your Reframe Visuals password',
      `<h3>Password reset</h3><p>Use the link below to set a new password for your Reframe Visuals account.</p><a href="${resetUrl}" style="background:#000;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;">Reset Password</a><p style="margin-top:16px;font-size:12px;color:#666;">This link expires in 24 hours.</p>`
    );

    return res.json({ success: true, message: 'Password reset email sent' });
  } catch {
    return res.status(500).json({ success: false, message: 'Failed to send reset email' });
  }
});

// Set a temporary password for a customer and return it to the admin
router.post('/customers/:id/temp-password', async (req, res) => {
  const { id } = req.params;
  try {
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: { user: { select: { id: true } } },
    });
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });
    if (!customer.user) return res.status(400).json({ success: false, message: 'This customer has no portal account' });

    const pool = ['coral', 'maple', 'swift', 'amber', 'cloud', 'pixel', 'storm', 'ridge', 'cedar', 'flint'];
    const rand = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
    const digits = String(Math.floor(Math.random() * 90) + 10);
    const tempPassword = `${rand(pool)}-${rand(pool)}-${digits}`;

    const hashedPassword = await bcrypt.hash(tempPassword, 12);
    await prisma.user.update({
      where: { id: customer.user.id },
      data: { passwordHash: hashedPassword, resetTokenNonce: null },
    });

    return res.json({ success: true, data: { tempPassword } });
  } catch {
    return res.status(500).json({ success: false, message: 'Failed to set temporary password' });
  }
});

// Contracts
router.get('/contracts', async (_req, res) => {
  const { skip, take, page, limit } = getPagination(_req.query);
  const [contracts, total] = await Promise.all([
    prisma.contract.findMany({ 
      skip, 
      take, 
      orderBy: { createdAt: 'desc' } 
    }),
    prisma.contract.count()
  ]);
  return res.json({ contracts, pagination: { total, page, limit, pages: Math.ceil(total / limit) } });
});

router.post('/contracts', async (req, res) => {
  const data = pick(req.body, ['title', 'partyName', 'status', 'signedAt', 'expiresAt']);
  const contract = await prisma.contract.create({ data: data as any });
  return res.json({ contract });
});

// Knowledge Base
router.get('/knowledge', async (_req, res) => {
  const { skip, take, page, limit } = getPagination(_req.query);
  const [articles, total] = await Promise.all([
    prisma.knowledgeArticle.findMany({ 
      where: { published: true }, 
      skip, 
      take, 
      orderBy: { createdAt: 'desc' } 
    }),
    prisma.knowledgeArticle.count({ where: { published: true } })
  ]);
  return res.json({ articles, pagination: { total, page, limit, pages: Math.ceil(total / limit) } });
});

router.post('/knowledge', async (req, res) => {
  const data = pick(req.body, ['title', 'content', 'category', 'tags', 'published']);
  const article = await prisma.knowledgeArticle.create({ data: data as any });
  return res.json({ article });
});

// Chatbot Config
router.get('/chatbot', async (_req, res) => {
  const config = await prisma.chatbotConfig.findMany();
  return res.json({ config });
});

router.put('/chatbot/:tenantId', async (req, res) => {
  const { tenantId } = req.params;
  const { name, welcomeMessage, isEnabled, primaryColor } = req.body;
  const config = await prisma.chatbotConfig.upsert({ 
    where: { tenantId }, 
    update: { name, welcomeMessage, isEnabled, primaryColor }, 
    create: { tenantId, name, welcomeMessage, isEnabled, primaryColor } 
  });
  return res.json({ config });
});

// NPS
router.get('/nps', async (_req, res) => {
  const { skip, take, page, limit } = getPagination(_req.query);
  const [responses, total] = await Promise.all([
    prisma.npsResponse.findMany({ 
      skip, 
      take, 
      orderBy: { createdAt: 'desc' } 
    }),
    prisma.npsResponse.count()
  ]);
  return res.json({ responses, pagination: { total, page, limit, pages: Math.ceil(total / limit) } });
});

router.post('/nps', async (req, res) => {
  const { customerId, score, feedback } = req.body;
  const response = await prisma.npsResponse.create({ data: { customerId, score, comment: feedback } });
  return res.json({ response });
});

// Referrals
router.get('/referrals', async (_req, res) => {
  const { skip, take, page, limit } = getPagination(_req.query);
  const [referrals, total] = await Promise.all([
    prisma.referral.findMany({ 
      skip, 
      take, 
      orderBy: { createdAt: 'desc' } 
    }),
    prisma.referral.count()
  ]);
  return res.json({ referrals, pagination: { total, page, limit, pages: Math.ceil(total / limit) } });
});

router.post('/referrals', async (req, res) => {
  const data = pick(req.body, ['referrerName', 'referrerEmail', 'referredName', 'referredEmail', 'status']);
  const referral = await prisma.referral.create({ data: data as any });
  return res.json({ referral });
});

// Audit Log — Activity feed across all orders and customers
router.get('/activity', async (req, res) => {
  const { skip, take, page, limit } = getPagination(req.query);
  const { type, customerId, orderId, q } = req.query as Record<string, string>;

  const where: any = {};
  if (type) where.type = type;
  if (customerId) where.customerId = customerId;
  if (orderId) where.orderId = orderId;
  if (q) where.message = { contains: q.toLowerCase(), mode: 'insensitive' };

  const [logs, total] = await Promise.all([
    prisma.activity.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.activity.count({ where }),
  ]);

  const customerIds = [...new Set(logs.map(log => log.customerId).filter(Boolean))] as string[];
  const orderIds = [...new Set(logs.map(log => log.orderId).filter(Boolean))] as string[];
  const [customers, orders] = await Promise.all([
    customerIds.length
      ? prisma.customer.findMany({
          where: { id: { in: customerIds } },
          select: { id: true, name: true, companyName: true, email: true },
        })
      : Promise.resolve([]),
    orderIds.length
      ? prisma.order.findMany({
          where: { id: { in: orderIds } },
          select: { id: true, code: true },
        })
      : Promise.resolve([]),
  ]);

  const customersById = new Map(customers.map(customer => [customer.id, customer]));
  const ordersById = new Map(orders.map(order => [order.id, order]));
  const enrichedLogs = logs.map(log => ({
    ...log,
    customer: log.customerId ? customersById.get(log.customerId) || null : null,
    order: log.orderId ? ordersById.get(log.orderId) || null : null,
  }));

  return res.json({ logs: enrichedLogs, pagination: { total, page, limit, pages: Math.ceil(total / limit) } });
});

export default router;
