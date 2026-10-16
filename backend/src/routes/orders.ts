import { Router, Request, Response } from 'express';
import { prisma } from '../database';
import { authenticate, requireAdmin } from '../middleware/auth';
import { createTenantFilter } from '../middleware/tenant';
import { emailService } from '../services/emailService';
import { broadcastOrderStatus } from './portalRoutes';
import { publishRealtime, realtimeSubscription } from '../services/realtimeService';
import { downloadFromDropbox } from '../services/dropboxService';

const router = Router();

// ── Admin SSE: real-time kanban updates ──────────────────────
export function broadcastKanbanUpdate() {
  publishRealtime('admin', 'kanban', 'kanban_update', { ts: Date.now() });
}

// Helper: resolve author name for activity log
async function resolveAuthorName(userId: string): Promise<string> {
  try {
    const u = await prisma.user.findUnique({ where: { id: userId }, select: { firstName: true, lastName: true, email: true } });
    if (!u) return 'Admin';
    return u.firstName && u.lastName ? `${u.firstName} ${u.lastName}` : (u.email || 'Admin');
  } catch { return 'Admin'; }
}

type OrderStatus = string;

const statuses: OrderStatus[] = ['new_review', 'awaiting_approval', 'in_progress', 'ready_qc', 'revision_needed', 'completed'];

// ─── State Machine: defines which status transitions are legal ───
const VALID_TRANSITIONS: Record<string, string[]> = {
  'new_review':         ['awaiting_approval', 'in_progress'],
  'awaiting_approval':  ['in_progress', 'new_review'],
  'in_progress':        ['ready_qc', 'revision_needed', 'completed'],
  'ready_qc':           ['completed', 'revision_needed'],
  'revision_needed':    ['in_progress', 'ready_qc', 'completed'],
  'completed':          ['revision_needed'],
};

// ─── Order Code: generate a candidate code synchronously ───
function generateUniqueOrderCode(): string {
  const suffix = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `RF-${suffix}`;
}

// ─────────────────────────────────────────────────────────────
// GET /api/orders/admin-stream
// SSE channel for real-time kanban invalidation (admin)
// Must be BEFORE /:id to avoid route conflict
// ─────────────────────────────────────────────────────────────
router.get('/admin-stream', (req: Request, _res, next) => {
  // EventSource can't send custom headers; promote ?token= into Authorization header
  if ((req.query as any).token && !req.headers.authorization) {
    req.headers.authorization = `Bearer ${(req.query as any).token}`;
  }
  return next();
}, authenticate, requireAdmin, (_req: Request, res: Response) => {
  return res.json(realtimeSubscription('admin', 'kanban'));
});

// ─────────────────────────────────────────────────────────────
// POST /api/orders
// Create a new order (Admin only)
// ─────────────────────────────────────────────────────────────

router.post('/', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { 
      customerId, 
      title, 
      serviceType, 
      volume, 
      priority, 
      status, 
      basePrice, 
      totalPrice, 
      expectedCompletion 
    } = req.body;

    // Get the customer's tenantId if not provided
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: { tenantId: true }
    });

    if (!customer) {
      return res.status(404).json({ error: { message: 'Customer not found' } });
    }

    let order;
    let attempts = 0;
    while (attempts < 5) {
      const code = generateUniqueOrderCode();
      try {
        order = await prisma.order.create({
          data: {
            code,
            title,
            serviceType: serviceType || 'standard',
            volume: volume || 1,
            priority: priority || 'medium',
            status: status || 'new_review',
            basePrice: basePrice ? Number(basePrice) : 0,
            totalPrice: totalPrice ? Number(totalPrice) : 0,
            expectedCompletion: expectedCompletion ? new Date(expectedCompletion) : null,
            customerId,
            tenantId: customer.tenantId,
          },
        });
        break;
      } catch (error: any) {
        if (error.code === 'P2002' && (error.message?.includes('code') || error.meta?.target?.includes('code'))) {
          attempts++;
          if (attempts >= 5) {
            throw new Error('Failed to generate a unique order code after 5 attempts due to database collisions');
          }
          continue;
        }
        throw error;
      }
    }

    return res.status(201).json(order);
  } catch (error: any) {
    return res.status(500).json({
      error: {
        code: 'CREATE_ORDER_ERROR',
        message: error.message,
      },
    });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/kanban
// Returns orders grouped by status (Kanban columns)
// ─────────────────────────────────────────────────────────────

router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const { customer, serviceType, priority, editor, dateRange, targetTenantId, archived } = req.query;
    const user = (req as any).user;

    // Determine if user is platform-level admin/staff
    const isPlatform = ['admin', 'manager', 'accountant', 'editor'].includes(user?.role);
    
    // For admins, allow targetTenantId override to view specific customer data
    // For non-admins, use their JWT tenantId
    let tenantId: string | null = null;
    if (isPlatform && targetTenantId) {
      tenantId = targetTenantId as string;
    } else if (!isPlatform) {
      tenantId = user?.tenantId || null;
    }

    // Create tenant filter
    const tenantFilter = createTenantFilter(tenantId, isPlatform);
    
    const where: any = { ...tenantFilter };

    // Filter archived unless explicitly requested
    if (archived === 'true') {
      where.archivedAt = { not: null };
    } else {
      where.archivedAt = null;
    }

    if (customer) where.customerId = customer;
    if (serviceType) where.serviceType = serviceType;
    if (priority) where.priority = priority;
    if (editor) where.assignedEditorId = editor;

    if (dateRange === 'today') {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      where.createdAt = { gte: startOfDay };
    } else if (dateRange === 'week') {
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      where.createdAt = { gte: startOfWeek };
    }

    // FIX #1: Replaced 10 sequential N+1 queries with 2 parallel queries.
    // groupBy gets all column counts in one shot; findMany gets all cards in one shot.
    // Results are then partitioned in-memory, reducing DB round-trips from 10 to 2.
    const [allOrders, columnCounts] = await Promise.all([
      prisma.order.findMany({
        where,
        take: 250, // safety cap — Kanban is not a full data export
        include: {
          customer: {
            select: {
              companyName: true,
              name: true,
              email: true,
              contactEmail: true,
              isGuest: true,
            },
          },
          assignedEditor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          images: {
            take: 1,
            select: {
              id: true,
              status: true,
              url: true,
            },
          },
        },
        orderBy: [{ columnPosition: 'asc' }, { expectedCompletion: 'asc' }, { createdAt: 'desc' }],
      }),
      prisma.order.groupBy({
        by: ['status'],
        _count: { id: true },
        where,
      }),
    ]);

    // Build a count map from groupBy result
    const countMap: Record<string, number> = {};
    for (const group of columnCounts) {
      countMap[group.status] = group._count.id;
    }

    // Partition orders into Kanban columns in-memory
    const kanban: any = {};
    for (const status of statuses) {
      const statusOrders = allOrders.filter(o => o.status === status || (status === 'new_review' && o.status === 'new'));
      const columnId = status === 'in_progress' ? 'inProgress' : status === 'ready_qc' ? 'readyQC' : status;
      kanban[columnId] = {
        id: status,
        title: getColumnTitle(status),
        count: (countMap[status] ?? 0) + (status === 'new_review' ? (countMap['new'] ?? 0) : 0),
        cards: statusOrders.map((order) => ({
          id: order.id,
          code: order.code,
          title: order.title,
          volume: order.volume,
          serviceType: order.serviceType,
          priority: order.priority,
          createdAt: order.createdAt.toISOString(),
          customer: order.customer?.companyName || order.customer?.name || order.customer?.email || 'Guest',
          customerEmail: order.customer?.contactEmail || order.customer?.email || '',
          isGuest: order.customer?.isGuest || false,
          thumbnail: order.images[0]?.url || null,
          assignedEditorId: order.assignedEditorId || null,
          assignedEditor: order.assignedEditor
            ? `${order.assignedEditor.firstName} ${order.assignedEditor.lastName}`
            : null,
          expectedCompletion: order.expectedCompletion?.toISOString() || null,
          columnPosition: order.columnPosition,
        })),
      };
    }

    return res.json(kanban);
  } catch (error: any) {
    return res.status(500).json({
      error: {
        code: 'KANBAN_ERROR',
        message: error.message,
      },
    });
  }
});

function getColumnTitle(status: OrderStatus): string {
  const titles: Record<string, string> = {
    new: 'Pending',
    new_review: 'New Review',
    awaiting_approval: 'Awaiting Approval',
    in_progress: 'Editing',
    ready_qc: 'QA',
    revision_needed: 'Revision',
    completed: 'Delivered',
  };
  return titles[status] || status;
}

// ─────────────────────────────────────────────────────────────
// GET /api/orders/:id
// Returns detailed order information
// ─────────────────────────────────────────────────────────────

router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            customerNumber: true,
            companyName: true,
            contactEmail: true,
            contactPhone: true,
            tier: true,
          },
        },
        assignedEditor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            tier: true,
          },
        },
        images: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!order) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Order not found',
        },
      });
    }

    // Calculate margin (simplified)
    const margin = order.totalPrice && order.basePrice
      ? Math.round(((Number(order.totalPrice) - Number(order.basePrice)) / Number(order.totalPrice)) * 100)
      : 0;

    return res.json({
      id: order.id,
      code: order.code,
      customer: {
        id: order.customer.id,
        name: order.customer.companyName || order.customer.name,
        contact: order.customer.contactEmail || order.customer.email,
        // The drawer showed only a company name, leaving an editor with no way to
        // reach the client from the order they are working on.
        email: order.customer.email,
        phone: order.customer.contactPhone,
        code: order.customer.customerNumber
          ? `CLT${String(order.customer.customerNumber).padStart(3, '0')}`
          : null,
        tier: order.customer.tier,
      },
      title: order.title,
      // The client's brief. It was stored on the order but never returned, so the
      // production drawer always looked like the client had written nothing.
      description: order.description,
      turnaround: order.turnaround,
      deliveryVector: order.deliveryVector,
      specs: {
        outputFormat: order.outputFormat,
        background: order.background,
        colorProfile: order.colorProfile,
        resolutionDPI: order.resolutionDPI,
        cropRatio: order.cropRatio,
        resizeWidth: order.resizeWidth,
        resizeHeight: order.resizeHeight,
        layering: order.layering,
        namingPattern: order.namingPattern,
        marginPercent: order.marginPercent,
      },
      volume: order.volume,
      customFilesLink: order.customFilesLink,
      customFilesCount: order.customFilesCount,
      deliveryLink: order.deliveryLink,
      deliveryNote: order.deliveryNote,
      serviceType: order.serviceType,
      complexity: order.complexity,
      priority: order.priority,
      status: order.status,
      assignedEditor: order.assignedEditor
        ? {
            id: order.assignedEditor.id,
            name: `${order.assignedEditor.firstName} ${order.assignedEditor.lastName}`,
            tier: order.assignedEditor.tier,
          }
        : null,
      pricing: {
        basePrice: order.basePrice ? Number(order.basePrice) : 0,
        volumeDiscount: Number(order.discountPercent),
        totalPrice: order.totalPrice ? Number(order.totalPrice) : 0,
        margin,
      },
      timeline: {
        createdAt: order.createdAt.toISOString(),
        startedAt: order.startedAt?.toISOString() || null,
        expectedCompletion: order.expectedCompletion?.toISOString() || null,
        submittedQCAt: order.submittedQCAt?.toISOString() || null,
        completedAt: order.completedAt?.toISOString() || null,
      },
      images: order.images.map((img) => ({
        id: img.id,
        filename: img.filename,
        status: img.status,
        url: img.url,
        // Stored Dropbox share links do not serve image bytes, so admin previews
        // rendered broken. Point at the same-origin proxy instead.
        previewUrl: `/api/orders/${order.id}/assets/${img.id}/raw`,
        rawUrl: img.rawUrl || null,
        revisionCount: img.revisionCount,
      })),
    });
  } catch (error: any) {
    return res.status(500).json({
      error: {
        code: 'ORDER_DETAIL_ERROR',
        message: error.message,
      },
    });
  }
});

// ─────────────────────────────────────────────────────────────
// PATCH /api/orders/:id
// Update order status or assignment
// ─────────────────────────────────────────────────────────────

router.patch('/:id', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, assignedEditorId, priority, expectedCompletion, adminNotes, revisionNotes, title, deliveryLink, deliveryNote } = req.body;
    const actor = (req as any).user;

    // ── Fetch current order for state machine + activity diff ──
    const current = await prisma.order.findUnique({
      where: { id },
      select: { status: true, assignedEditorId: true, priority: true, tenantId: true, customerId: true, code: true },
    });
    if (!current) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Order not found' } });
    }

    // ── State Machine Guard ──
    if (status) {
      const allowed = VALID_TRANSITIONS[current.status] ?? [];
      if (!allowed.includes(status)) {
        return res.status(400).json({
          error: {
            code: 'INVALID_STATUS_TRANSITION',
            message: `Cannot move order from '${current.status}' to '${status}'. Allowed: [${allowed.join(', ') || 'none'}]`,
          },
        });
      }
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (assignedEditorId !== undefined) updateData.assignedEditorId = assignedEditorId || null;
    if (priority) updateData.priority = priority;
    if (expectedCompletion) updateData.expectedCompletion = new Date(expectedCompletion);
    if (adminNotes !== undefined) updateData.adminNotes = adminNotes;
    if (revisionNotes !== undefined) updateData.revisionNotes = revisionNotes;
    if (title !== undefined) updateData.title = title;
    // Delivery handoff — how the finished work reaches the client.
    if (deliveryLink !== undefined) updateData.deliveryLink = deliveryLink ? String(deliveryLink).slice(0, 2048) : null;
    if (deliveryNote !== undefined) updateData.deliveryNote = deliveryNote ? String(deliveryNote).slice(0, 5000) : null;

    // Set timestamps on status transitions
    if (status === 'in_progress' && !updateData.startedAt) updateData.startedAt = new Date();
    if (status === 'ready_qc' && !updateData.submittedQCAt) updateData.submittedQCAt = new Date();
    if (status === 'completed' && !updateData.completedAt) updateData.completedAt = new Date();

    const order = await prisma.order.update({
      where: { id },
      data: updateData,
      include: { customer: { select: { id: true, email: true, contactEmail: true, name: true } } },
    });

    // ── Activity logging ──
    const authorName = await resolveAuthorName(actor?.id);
    const activityRecords: any[] = [];
    if (status && status !== current.status) {
      activityRecords.push({
        tenantId: current.tenantId,
        customerId: current.customerId,
        orderId: id,
        type: 'status_change',
        message: `Status changed from "${current.status.replace(/_/g, ' ')}" to "${status.replace(/_/g, ' ')}"`,
        authorId: actor?.id || null,
        authorName,
      });
    }
    if (assignedEditorId !== undefined && assignedEditorId !== current.assignedEditorId) {
      let editorName = 'Unassigned';
      if (assignedEditorId) {
        const ed = await prisma.user.findUnique({ where: { id: assignedEditorId }, select: { firstName: true, lastName: true } });
        if (ed) editorName = `${ed.firstName} ${ed.lastName}`;
      }
      activityRecords.push({
        tenantId: current.tenantId,
        customerId: current.customerId,
        orderId: id,
        type: 'assignment',
        message: assignedEditorId ? `Assigned to ${editorName}` : 'Unassigned editor',
        authorId: actor?.id || null,
        authorName,
      });
    }
    if (activityRecords.length > 0) {
      await prisma.activity.createMany({ data: activityRecords });
    }

    // Push real-time status update to any connected customer portal sessions
    if (status && (order as any).customer?.id) {
      broadcastOrderStatus((order as any).customer.id, {
        type: 'status_change',
        orderId: order.id,
        orderCode: order.code,
        status: order.status,
      });
    }

    // Broadcast to admin kanban SSE clients
    broadcastKanbanUpdate();

    // Notify customer when assets are ready for review
    if (status === 'ready_qc') {
      const targetEmail = (order as any).customer?.contactEmail || (order as any).customer?.email;
      if (targetEmail) {
        emailService.sendEmail(
          targetEmail,
          `[Reframe Visuals] Your assets are ready for review — ${order.code}`,
          `<h3>Your edited assets are ready</h3><p>Project <strong>${order.code}</strong> has completed production and is waiting for your approval in the Reframe Visuals portal.</p><p>Log in to inspect each asset, approve the delivery, or request revisions.</p><a href="${process.env.BASE_URL}/dashboard" style="display:inline-block;background:#000;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:600;">Review Assets</a><p style="margin-top:16px;font-size:12px;color:#666;">You have 14 days from delivery to request a free revision.</p>`
        ).catch(err => console.error('[Notification] ready_qc email failed:', err));
      }
    }

    return res.json({
      id: order.id,
      code: order.code,
      status: order.status,
      message: 'Order updated successfully',
    });
  } catch (error: any) {
    return res.status(400).json({
      error: {
        code: 'UPDATE_ORDER_ERROR',
        message: error.message,
      },
    });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/orders/:id/activities
// ─────────────────────────────────────────────────────────────
router.get('/:id/activities', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const activities = await prisma.activity.findMany({
      where: { orderId: id },
      orderBy: { createdAt: 'asc' },
    });
    return res.json({ success: true, data: activities });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/orders/:id/activities
// Add a comment
// ─────────────────────────────────────────────────────────────
router.post('/:id/activities', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    if (!message?.trim()) return res.status(400).json({ success: false, message: 'Message required' });
    const actor = (req as any).user;
    const order = await prisma.order.findUnique({ where: { id }, select: { tenantId: true, customerId: true } });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    const authorName = await resolveAuthorName(actor?.id);
    const activity = await prisma.activity.create({
      data: {
        tenantId: order.tenantId,
        customerId: order.customerId,
        orderId: id,
        type: 'comment',
        message: message.trim(),
        authorId: actor?.id || null,
        authorName,
      },
    });
    return res.json({ success: true, data: activity });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// ─────────────────────────────────────────────────────────────
// PATCH /api/orders/:id/position
// Update card position within a column
// ─────────────────────────────────────────────────────────────
router.patch('/:id/position', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { position } = req.body;
    if (position === undefined || isNaN(Number(position))) {
      return res.status(400).json({ success: false, message: 'position (number) required' });
    }
    await prisma.order.update({ where: { id }, data: { columnPosition: Number(position) } });
    broadcastKanbanUpdate();
    return res.json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/orders/:id/archive  &  POST /api/orders/:id/unarchive
// ─────────────────────────────────────────────────────────────
router.post('/:id/archive', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const actor = (req as any).user;
    const order = await prisma.order.findUnique({ where: { id }, select: { tenantId: true, customerId: true } });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    await prisma.order.update({ where: { id }, data: { archivedAt: new Date() } });
    const authorName = await resolveAuthorName(actor?.id);
    await prisma.activity.create({
      data: { tenantId: order.tenantId, customerId: order.customerId, orderId: id, type: 'archive', message: 'Order archived', authorId: actor?.id || null, authorName },
    });
    broadcastKanbanUpdate();
    return res.json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/:id/unarchive', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const actor = (req as any).user;
    const order = await prisma.order.findUnique({ where: { id }, select: { tenantId: true, customerId: true } });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    await prisma.order.update({ where: { id }, data: { archivedAt: null } });
    const authorName = await resolveAuthorName(actor?.id);
    await prisma.activity.create({
      data: { tenantId: order.tenantId, customerId: order.customerId, orderId: id, type: 'archive', message: 'Order unarchived', authorId: actor?.id || null, authorName },
    });
    broadcastKanbanUpdate();
    return res.json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/:id/proposal', authenticate, requireAdmin, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { basePricePerImage, addons, totalPrice, adminNotes, slaMultiplier } = req.body;

  try {
    const existingOrder = await prisma.order.findUnique({ where: { id }, include: { customer: true } });
    if (!existingOrder) return res.status(404).json({ success: false, message: 'Order target does not exist' });

    const [quotation] = await prisma.$transaction([
      prisma.quotation.upsert({
        where: { orderId: id },
        update: {
          basePrice: Number(basePricePerImage || 0),
          totalPrice: Number(totalPrice || 0),
          marginPercent: Number(slaMultiplier || 1),
          status: 'sent',
          sentAt: new Date(),
          expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
        },
        create: {
          tenantId: existingOrder.tenantId,
          code: `QT-${existingOrder.code}`,
          customerId: existingOrder.customerId,
          orderId: id,
          volume: existingOrder.volume,
          serviceType: existingOrder.serviceType,
          complexity: existingOrder.complexity,
          basePrice: Number(basePricePerImage || 0),
          totalPrice: Number(totalPrice || 0),
          marginPercent: Number(slaMultiplier || 1),
          status: 'sent',
          sentAt: new Date(),
          expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
        }
      }),
      prisma.order.update({
        where: { id },
        data: {
          status: 'awaiting_approval',
          basePrice: Number(basePricePerImage || 0),
          totalPrice: Number(totalPrice || 0),
          // `description` is the client's own brief and is shown back to them.
          // Admin commentary belongs in adminNotes, not appended to their words.
          adminNotes: adminNotes
            ? `${existingOrder.adminNotes ? `${existingOrder.adminNotes}\n\n` : ''}${adminNotes}`
            : existingOrder.adminNotes,
          notes: JSON.stringify({ addons: Array.isArray(addons) ? addons : [] })
        }
      })
    ]);

    await prisma.activity.create({
      data: {
        tenantId: existingOrder.tenantId,
        customerId: existingOrder.customerId,
        orderId: existingOrder.id,
        type: 'status_change',
        message: `Pricing proposal dispatched to customer for order ${existingOrder.code}. Proposed Total: $${Number(totalPrice || 0).toFixed(2)}`
      }
    });

    const targetEmail = existingOrder.customer?.contactEmail || existingOrder.customer?.email;
    if (targetEmail) {
      const BASE_URL = process.env.BASE_URL || 'https://reframevisuals.com';
      const proposalHtml = `
        <div style="font-family: sans-serif; max-width: 600px; border: 1px solid #eee; padding: 20px; border-radius: 12px;">
          <h2 style="margin-top: 0; color: #111;">📋 Pricing Proposal Ready</h2>
          <p style="color: #444;">We've reviewed your project and prepared a custom pricing proposal for you.</p>
          <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <p style="margin: 5px 0;"><strong>Project:</strong> ${existingOrder.code}</p>
            <p style="margin: 5px 0;"><strong>Proposed Total:</strong> $${Number(totalPrice || 0).toFixed(2)}</p>
          </div>
          <p style="color: #444;">Log in to your dashboard to review the full breakdown and approve or discuss the proposal.</p>
          <br/>
          <a href="${BASE_URL}/portal/orders" style="display: inline-block; background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Review Proposal</a>
          <p style="margin-top: 24px; font-size: 12px; color: #888;">Questions? Reply to this email and we'll get back to you shortly.</p>
        </div>
      `;
      emailService.sendEmail(targetEmail, `[Reframe Visuals] New Pricing Proposal - Project ${existingOrder.code}`, proposalHtml).catch((err) =>
        console.error('[Notification] Failed to send email proposal notify:', err)
      );
    }

    return res.json({ success: true, data: { quotationId: quotation.id, totalPrice: Number(totalPrice || 0) } });
  } catch (error: any) {
    console.error('Failed to submit pricing proposal:', error);
    return res.status(500).json({ success: false, message: 'Failed to process proposal: ' + error.message });
  }
});

// Streams a single order asset from Dropbox for admin previews. <img> cannot send an
// Authorization header, so the admin JWT may be passed as ?token= — the same pattern
// the admin SSE endpoints already use.
router.get('/:id/assets/:imageId/raw', (req: any, _res, next) => {
  if (req.query.token && !req.headers.authorization) {
    req.headers.authorization = `Bearer ${req.query.token}`;
  }
  return next();
}, authenticate, async (req: Request, res: Response) => {
  try {
    const { id, imageId } = req.params;
    const image = await prisma.image.findFirst({
      where: { id: imageId, orderId: id },
      select: { path: true, filename: true },
    });

    if (!image?.path) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Asset not found' } });
    }

    const extension = (image.filename || image.path).toLowerCase().split('.').pop() || '';
    const mime: Record<string, string> = {
      jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp',
      gif: 'image/gif', tif: 'image/tiff', tiff: 'image/tiff', bmp: 'image/bmp', heic: 'image/heic',
    };
    res.setHeader('Content-Type', mime[extension] || 'application/octet-stream');
    res.setHeader('Cache-Control', 'private, max-age=3600');

    const stream = await downloadFromDropbox(image.path);
    stream.on('error', () => { if (!res.headersSent) res.status(502).end(); else res.end(); });
    stream.pipe(res);
    return res;
  } catch (error: any) {
    console.error('[AdminAsset] Stream failed:', error?.message || error);
    if (!res.headersSent) {
      return res.status(502).json({ error: { code: 'ASSET_ERROR', message: 'Asset unavailable' } });
    }
    res.end();
    return res;
  }
});

export default router;
