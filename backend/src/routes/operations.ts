import { Router } from 'express';
import { prisma } from '../database';

const router = Router();

// ─────────────────────────────────────────────────────────────
// QC DASHBOARD
// ─────────────────────────────────────────────────────────────

router.get('/qc/dashboard', async (_req, res) => {
  try {
    // 1. Get metrics from real data
    const batchesPending = await prisma.order.count({ where: { status: 'ready_qc' } });
    const batchesInReview = 0; // In-review logic could be added to OrderStatus if needed
    const batchesApproved = await prisma.order.count({ where: { status: 'completed' } });
    const batchesRevisionRequested = await prisma.order.count({ where: { status: 'revision_needed' } });

    // Calculate pass rate from images
    const totalQCReviewed = await prisma.image.count({
      where: { qcReviewedAt: { not: null } }
    });
    const totalPassed = await prisma.image.count({
      where: { qcPassed: true }
    });
    const firstPassRate = totalQCReviewed > 0 ? Math.round((totalPassed / totalQCReviewed) * 100) : 0;
    const rejectionRate = totalQCReviewed > 0 ? 100 - firstPassRate : 0;

    // 2. Get pending batches (orders in ready_qc status)
    const pendingOrders = await prisma.order.findMany({
      where: { status: 'ready_qc' },
      include: { customer: true },
      orderBy: { submittedQCAt: 'asc' }
    });

    const pendingBatches = pendingOrders.map(order => ({
      id: order.id,
      orderCode: order.code,
      customer: order.customer.companyName,
      totalImages: order.volume,
      submittedAt: order.submittedQCAt || order.createdAt,
      priority: order.priority
    }));

    // 3. Mock rejection reasons for now (until we have a table or tags)
    const rejectionReasons = [
      { reason: 'Background not pure white', count: 12 },
      { reason: 'Shadow too harsh', count: 8 },
      { reason: 'Color correction needed', count: 6 },
    ];

    return res.json({
      metrics: {
        batchesPending,
        batchesInReview,
        batchesApproved,
        batchesRevisionRequested,
        avgQCTime: '1.5h',
        firstPassRate,
        rejectionRate,
      },
      pendingBatches,
      rejectionReasons
    });
  } catch (error: any) {
    return res.status(500).json({ error: { code: 'QC_DASHBOARD_ERROR', message: error.message } });
  }
});

router.get('/qc/batches/:id/images', async (req, res) => {
  try {
    const { id } = req.params;
    const images = await prisma.image.findMany({
      where: { orderId: id },
      include: {
        completedByEditor: true
      }
    });

    return res.json({
      images: images.map(img => ({
        id: img.id,
        filename: img.filename,
        rawUrl: img.rawUrl || `https://placehold.co/400x300?text=Raw+${img.filename}`,
        editedUrl: img.editedUrl || `https://placehold.co/400x300?text=Edited+${img.filename}`,
        status: img.status,
        qcPassed: img.qcPassed,
        qcNotes: img.qcNotes,
        editorName: img.completedByEditor ? `${img.completedByEditor.firstName} ${img.completedByEditor.lastName}` : 'N/A'
      }))
    });
  } catch (error: any) {
    return res.status(500).json({ error: { code: 'QC_IMAGES_ERROR', message: error.message } });
  }
});

router.post('/qc/batches/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    // Update order status to completed
    await prisma.order.update({
      where: { id },
      data: {
        status: 'completed',
        completedAt: new Date()
      }
    });
    // Update all images in this order to qcPassed: true
    await prisma.image.updateMany({
      where: { orderId: id },
      data: {
        status: 'completed',
        qcPassed: true,
        qcReviewedAt: new Date()
      }
    });
    return res.json({ message: 'Batch approved', batchId: id });
  } catch (error: any) {
    return res.status(500).json({ error: { code: 'QC_APPROVE_ERROR', message: error.message } });
  }
});

router.post('/qc/batches/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    // Update order status to revision_needed
    await prisma.order.update({
      where: { id },
      data: {
        status: 'revision_needed',
        notes: notes || 'Revision requested by QC'
      }
    });
    return res.json({ message: 'Batch rejected for revision', batchId: id });
  } catch (error: any) {
    return res.status(500).json({ error: { code: 'QC_REJECT_ERROR', message: error.message } });
  }
});

// ─────────────────────────────────────────────────────────────
// TEAM DIRECTORY
// ─────────────────────────────────────────────────────────────

router.get('/team/directory', async (_req, res) => {
  try {
    const employees = await prisma.employee.findMany({
      orderBy: { lastName: 'asc' }
    });

    const departments = await prisma.employee.groupBy({
      by: ['department'],
      _count: {
        _all: true
      }
    });

    return res.json({
      employees,
      departments: departments.map(d => ({
        id: d.department.toLowerCase(),
        name: d.department,
        employeeCount: d._count._all
      }))
    });
  } catch (error: any) {
    return res.status(500).json({ error: { code: 'TEAM_DIRECTORY_ERROR', message: error.message } });
  }
});

router.get('/team/employees/:id', async (req, res) => {
  try {
    const employee = await prisma.employee.findUnique({
      where: { id: req.params.id },
      include: {
        paySlips: true,
        expenses: true
      }
    });
    if (!employee) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Employee not found' } });
    }
    return res.json({ employee });
  } catch (error: any) {
    return res.status(500).json({ error: { code: 'EMPLOYEE_DETAIL_ERROR', message: error.message } });
  }
});

router.post('/team', async (req, res) => {
  try {
    const { firstName, lastName, name, email, department } = req.body;
    const derivedFirstName = firstName || String(name || '').trim().split(' ')[0];
    const derivedLastName = lastName || String(name || '').trim().split(' ').slice(1).join(' ') || 'Team';

    if (!derivedFirstName || !email || !department) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Name, email, and department are required' },
      });
    }

    const employee = await prisma.employee.create({
      data: {
        firstName: derivedFirstName,
        lastName: derivedLastName,
        email,
        department,
      },
    });
    return res.status(201).json({ employee, message: 'Team member created' });
  } catch (error: any) {
    return res.status(400).json({ error: { code: 'CREATE_EMPLOYEE_ERROR', message: error.message } });
  }
});

router.put('/team/:id', async (req, res) => {
  try {
    const { firstName, lastName, name, email, department } = req.body;
    const data: any = {};

    if (name && !firstName && !lastName) {
      const parts = String(name).trim().split(' ');
      data.firstName = parts[0];
      data.lastName = parts.slice(1).join(' ') || 'Team';
    }
    if (firstName !== undefined) data.firstName = firstName;
    if (lastName !== undefined) data.lastName = lastName;
    if (email !== undefined) data.email = email;
    if (department !== undefined) data.department = department;

    const employee = await prisma.employee.update({ where: { id: req.params.id }, data });
    return res.json({ employee, message: 'Team member updated' });
  } catch (error: any) {
    return res.status(400).json({ error: { code: 'UPDATE_EMPLOYEE_ERROR', message: error.message } });
  }
});

// ─────────────────────────────────────────────────────────────
// NDA MANAGEMENT
// ─────────────────────────────────────────────────────────────

router.get('/nda/contracts', async (_req, res) => {
  try {
    const contracts = await prisma.contract.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return res.json({ contracts });
  } catch (error: any) {
    return res.status(500).json({ error: { code: 'CONTRACTS_ERROR', message: error.message } });
  }
});

router.post('/nda/contracts', async (req, res) => {
  try {
    const { title, type, status } = req.body || {};
    const contract = await prisma.contract.create({
      data: { title, type, status }
    });
    return res.status(201).json({ contract, message: 'Contract created' });
  } catch (error: any) {
    return res.status(400).json({ error: { code: 'CREATE_CONTRACT_ERROR', message: error.message } });
  }
});

// ─────────────────────────────────────────────────────────────
// STYLE GUIDE DOCS
// ─────────────────────────────────────────────────────────────

router.get('/styleguide', async (_req, res) => {
  try {
    const guides = await prisma.knowledgeArticle.findMany({
      where: { category: 'style-guide' },
      orderBy: { updatedAt: 'desc' }
    });
    return res.json({ guides });
  } catch (error: any) {
    return res.status(500).json({ error: { code: 'STYLEGUIDE_ERROR', message: error.message } });
  }
});

router.put('/styleguide', async (req, res) => {
  try {
    const { id, title = 'Style Guide', content = '', tags, published = true } = req.body;
    const guide = id
      ? await prisma.knowledgeArticle.update({
          where: { id },
          data: { title, content, tags, published, category: 'style-guide' },
        })
      : await prisma.knowledgeArticle.create({
          data: { title, content, tags, published, category: 'style-guide' },
        });

    return res.json({ guide, message: 'Style guide saved' });
  } catch (error: any) {
    return res.status(400).json({ error: { code: 'SAVE_STYLEGUIDE_ERROR', message: error.message } });
  }
});

// ─────────────────────────────────────────────────────────────
// WATCHLIST / OBSERVATIONS
// ─────────────────────────────────────────────────────────────

router.get('/watchlist', async (_req, res) => {
  try {
    const entries = await prisma.lead.findMany({
      where: { score: { gte: 50 } }, // High potential leads as watchlist
      orderBy: { createdAt: 'desc' }
    });
    return res.json({ entries });
  } catch (error: any) {
    return res.status(500).json({ error: { code: 'WATCHLIST_ERROR', message: error.message } });
  }
});

// ─────────────────────────────────────────────────────────────
// NPS TRACKING
// ─────────────────────────────────────────────────────────────

router.get('/nps', async (_req, res) => {
  try {
    const responses = await prisma.npsResponse.findMany({
      orderBy: { createdAt: 'desc' }
    });

    const promoters = await prisma.npsResponse.count({ where: { score: { gte: 9 } } });
    const detractors = await prisma.npsResponse.count({ where: { score: { lte: 6 } } });
    const total = await prisma.npsResponse.count();

    const score = total > 0 ? Math.round(((promoters - detractors) / total) * 100) : 0;

    return res.json({
      metrics: {
        score,
        promoters,
        detractors,
        total,
      },
      recentResponses: responses
    });
  } catch (error: any) {
    return res.status(500).json({ error: { code: 'NPS_ERROR', message: error.message } });
  }
});

// ─────────────────────────────────────────────────────────────
// REFERRAL ENGINE
// ─────────────────────────────────────────────────────────────

router.get('/referrals', async (_req, res) => {
  try {
    const referrals = await prisma.referral.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return res.json({ referrals });
  } catch (error: any) {
    return res.status(500).json({ error: { code: 'REFERRALS_ERROR', message: error.message } });
  }
});

export default router;
