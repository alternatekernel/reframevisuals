import { Router, Request, Response } from 'express';
import { prisma } from '../database';
import { authenticate } from '../middleware/auth';
import { createTenantFilter } from '../middleware/tenant';

const router = Router();

// Re-export types for backwards compatibility
type ServiceType = string;
type Complexity = string;

// ─────────────────────────────────────────────────────────────
// GET /api/quotations
// Returns list of quotations
// ─────────────────────────────────────────────────────────────

router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const { status, customer, sort = 'created', order = 'desc', page = '1', limit = '20', targetTenantId } = req.query;
    const user = (req as any).user;

    // Determine if user is platform-level staff
    const isPlatform = ['admin', 'manager', 'accountant', 'editor'].includes(user?.role);
    
    // Admin override: allow targetTenantId to view specific customer data
    let tenantId: string | null = null;
    if (isPlatform && targetTenantId) {
      tenantId = targetTenantId as string;
    } else if (!isPlatform) {
      tenantId = user?.tenantId || null;
    }

    // Create tenant filter
    const tenantFilter = createTenantFilter(tenantId, isPlatform);
    const where: any = { ...tenantFilter };
    
    if (status) where.status = status;
    if (customer) where.customerId = customer;

    const orderBy: any = {};
    if (sort === 'created') orderBy.createdAt = order;
    if (sort === 'expires') orderBy.expiresAt = order;
    if (sort === 'price') orderBy.totalPrice = order;

    const skip = (Number(page) - 1) * Number(limit);

    const [quotations, totalCount] = await Promise.all([
      prisma.quotation.findMany({
        where,
        orderBy,
        skip,
        take: Number(limit),
        include: {
          customer: {
            select: {
              id: true,
              companyName: true,
            },
          },
        },
      }),
      prisma.quotation.count({ where }),
    ]);

    return res.json({
      quotations: quotations.map((q) => ({
        id: q.id,
        code: q.code,
        customer: {
          id: q.customer.id,
          name: q.customer.companyName,
        },
        volume: q.volume,
        serviceType: q.serviceType,
        complexity: q.complexity,
        totalPrice: q.totalPrice ? Number(q.totalPrice) : 0,
        margin: q.marginPercent ? Number(q.marginPercent) : 0,
        status: q.status,
        createdAt: q.createdAt.toISOString(),
        expiresAt: q.expiresAt.toISOString(),
        sentAt: q.sentAt?.toISOString() || null,
        acceptedAt: q.acceptedAt?.toISOString() || null,
      })),
      totalCount,
    });
  } catch (error: any) {
    return res.status(500).json({
      error: {
        code: 'QUOTATIONS_ERROR',
        message: error.message,
      },
    });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/quotations
// Create a new quotation
// ─────────────────────────────────────────────────────────────

router.post('/', authenticate, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { customerId, volume, serviceType, complexity, deliveryDays } = req.body;
    const isPlatform = ['admin', 'manager', 'accountant', 'editor'].includes(user?.role);

    // Get pricing from tier
    const customer = await prisma.customer.findFirst({
      where: {
        id: customerId,
        ...(isPlatform ? {} : { tenantId: user?.tenantId }),
      },
    });

    if (!customer) {
      return res.status(404).json({
        error: {
          code: 'CUSTOMER_NOT_FOUND',
          message: 'Customer not found',
        },
      });
    }

    // Calculate pricing (simplified - would use pricing tiers)
    const basePrices: Record<ServiceType, Record<Complexity, number>> = {
      standard: { low: 8.5, medium: 10.2, high: 12.8 },
      premium: { low: 11.0, medium: 13.2, high: 15.8 },
      express: { low: 14.5, medium: 17.2, high: 20.5 },
    };

    const basePrice = basePrices[serviceType][complexity];
    const subtotal = volume * basePrice;

    // Apply volume discount
    let discountPercent = 0;
    if (volume >= 500) discountPercent = 25;
    else if (volume >= 100) discountPercent = 10;

    const discount = subtotal * (discountPercent / 100);
    const totalPrice = subtotal - discount;

    // Calculate margin (simplified)
    const editorPayout = volume * (basePrice * 0.48); // ~48% payout ratio
    const margin = ((totalPrice - editorPayout) / totalPrice) * 100;

    // Generate code
    const code = `QT-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    const quotation = await prisma.quotation.create({
      data: {
        tenantId: isPlatform ? customer.tenantId : user.tenantId,
        code,
        customerId,
        volume,
        serviceType: serviceType as ServiceType,
        complexity: complexity as Complexity,
        deliveryDays,
        basePrice: subtotal / volume,
        volumeDiscount: discountPercent,
        totalPrice,
        marginPercent: margin,
        expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
      },
      include: {
        customer: {
          select: {
            companyName: true,
          },
        },
      },
    });

    return res.status(201).json({
      id: quotation.id,
      code: quotation.code,
      customer: quotation.customer.companyName,
      volume: quotation.volume,
      serviceType: quotation.serviceType,
      totalPrice: Number(quotation.totalPrice),
      margin: Number(quotation.marginPercent),
      message: 'Quotation created successfully',
    });
  } catch (error: any) {
    return res.status(400).json({
      error: {
        code: 'CREATE_QUOTATION_ERROR',
        message: error.message,
      },
    });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/quotations/:id/convert-to-order
// Convert accepted quotation to order
// ─────────────────────────────────────────────────────────────

router.post('/:id/convert-to-order', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;
    const isPlatform = ['admin', 'manager', 'accountant', 'editor'].includes(user?.role);

    const quotation = await prisma.quotation.findFirst({
      where: {
        id,
        ...(isPlatform ? {} : { tenantId: user?.tenantId }),
      },
      include: {
        customer: true,
      },
    });

    if (!quotation) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Quotation not found',
        },
      });
    }

    if (quotation.status !== 'accepted') {
      return res.status(400).json({
        error: {
          code: 'INVALID_STATUS',
          message: 'Only accepted quotations can be converted to orders',
        },
      });
    }

    if (quotation.orderId) {
      return res.status(409).json({
        error: {
          code: 'ALREADY_CONVERTED',
          message: 'Quotation has already been converted to an order',
        },
      });
    }

    // Generate order code
    const orderCode = `OD-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    const order = await prisma.$transaction(async (tx) => {
      const existing = await tx.quotation.findFirst({
        where: {
          id,
          status: 'accepted',
          orderId: null,
          ...(isPlatform ? {} : { tenantId: user?.tenantId }),
        },
      });

      if (!existing) {
        throw new Error('Quotation is not available for conversion');
      }

      const createdOrder = await tx.order.create({
        data: {
          tenantId: quotation.tenantId,
          code: orderCode,
          customerId: quotation.customerId,
          title: `${quotation.customer.companyName || quotation.customer.name || 'Customer'} - ${quotation.serviceType} Order`,
          serviceType: quotation.serviceType,
          complexity: quotation.complexity,
          volume: quotation.volume,
          basePrice: quotation.basePrice,
          discountPercent: quotation.volumeDiscount || 0,
          totalPrice: quotation.totalPrice,
          status: 'new_review',
          expectedCompletion: new Date(Date.now() + (quotation.deliveryDays || 5) * 24 * 60 * 60 * 1000),
        },
      });

      await tx.quotation.update({
        where: { id },
        data: {
          orderId: createdOrder.id,
        },
      });

      return createdOrder;
    });

    return res.json({
      orderId: order.id,
      orderCode: order.code,
      message: 'Quotation converted to order successfully',
    });
  } catch (error: any) {
    return res.status(400).json({
      error: {
        code: 'CONVERT_ORDER_ERROR',
        message: error.message,
      },
    });
  }
});

export default router;
