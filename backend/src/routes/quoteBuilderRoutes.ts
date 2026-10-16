import { Router, Request, Response } from 'express';
import { prisma } from '../database';
import { authenticate } from '../middleware/auth';
import { emailService } from '../services/emailService';

const router = Router();

// ─────────────────────────────────────────────────────────────
// PRICING DATA (Match src/data/pricingMatrix.ts)
// ─────────────────────────────────────────────────────────────

const TURNAROUND_MULTIPLIERS: Record<string, number> = {
  '12h': 1.3,
  '24h': 1.0,
  '48h': 0.9,
  '72h': 0.85,
  '7d': 0.8,
};

const VOLUME_DISCOUNTS: { minQuantity: number; discount: number }[] = [
  { minQuantity: 500, discount: 0.20 },
  { minQuantity: 200, discount: 0.15 },
  { minQuantity: 100, discount: 0.10 },
  { minQuantity: 50, discount: 0.05 },
];

// Sample pricing data (in production, fetch from database or pricingMatrix)
const PRICING_DATA: Record<string, Record<string, number>> = {
  'background-removal': { S: 0.39, M: 0.78, A: 1.25, C: 2.50 },
  'clipping-path': { S: 0.39, M: 0.51, A: 0.99, C: 1.90, SC: 2.99 },
  'multi-clipping-path': { S: 0.90, M: 1.67, A: 2.25, C: 3.83, SC: 5.18 },
  'color-correction': { Single: 0.35, Multiple: 0.80 },
  'color-change': { Single: 0.30, Multiple: 0.70 },
  'retouching': { Basic: 0.55, Advanced: 1.99, High: 4.00 },
  'jewelry-retouch': { Basic: 0.80, Advanced: 1.99, High: 5.00 },
  'ghost-mannequin': { S: 0.85, M: 1.89, C: 3.99 },
  'model-retouch': { S: 1.20, M: 2.20, C: 3.59 },
  'garment-retouch': { S: 0.55, M: 0.99, C: 1.99 },

  'manipulation': { S: 3.99, C: 8.99 },
  'raster-to-vector': { S: 4.99, M: 14.99, C: 24.99 },
  'sketch-to-reality': { S: 3.50, C: 6.50 },
  'pattern-change': { Single: 1.25, Multicolor: 0.50, Multiple: 2.80 },
  'shadow-creation': { S: 0.35, M: 0.59, C: 0.99 },
};

// ─────────────────────────────────────────────────────────────
// PUBLIC ROUTES
// ─────────────────────────────────────────────────────────────

/**
 * POST /api/quote/calculate
 * Calculate price based on services, turnaround, and quantity
 */
router.post('/calculate', async (req: Request, res: Response) => {
  try {
    const { services, turnaround, quantity } = req.body;

    // Validation
    if (!services || !Array.isArray(services) || services.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Services array is required',
      });
    }

    if (!turnaround || !TURNAROUND_MULTIPLIERS[turnaround]) {
      return res.status(400).json({
        success: false,
        error: 'Valid turnaround is required (12h, 24h, 48h, 72h, 7d)',
      });
    }

    if (!quantity || quantity < 1) {
      return res.status(400).json({
        success: false,
        error: 'Quantity must be at least 1',
      });
    }

    // Calculate base price
    let basePrice = 0;
    const serviceBreakdown = services.map((svc: any) => {
      const servicePricing = PRICING_DATA[svc.serviceId];
      if (!servicePricing) {
        return { ...svc, price: 0, error: 'Service not found' };
      }

      const unitPrice = servicePricing[svc.complexity] || 0;
      const totalPrice = unitPrice * quantity;
      basePrice += totalPrice;

      return {
        serviceId: svc.serviceId,
        serviceName: svc.serviceName,
        complexity: svc.complexity,
        unitPrice,
        totalPrice,
      };
    });

    // Apply turnaround multiplier
    const turnaroundMultiplier = TURNAROUND_MULTIPLIERS[turnaround];
    const priceAfterTurnaround = basePrice * turnaroundMultiplier;

    // Apply volume discount
    let volumeDiscount = 0;
    for (const tier of VOLUME_DISCOUNTS) {
      if (quantity >= tier.minQuantity) {
        volumeDiscount = tier.discount;
        break;
      }
    }

    const finalPrice = priceAfterTurnaround * (1 - volumeDiscount);
    const discountAmount = priceAfterTurnaround - finalPrice;

    return res.json({
      success: true,
      data: {
        breakdown: {
          services: serviceBreakdown,
          subtotal: basePrice,
          turnaround,
          turnaroundMultiplier,
          priceAfterTurnaround,
          volumeDiscount,
          discountAmount,
          total: finalPrice,
        },
        summary: {
          quantity,
          serviceCount: services.length,
          estimatedPricePerImage: finalPrice / quantity,
        },
      },
    });
  } catch (error: any) {
    console.error('Error calculating quote:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to calculate quote',
    });
  }
});

/**
 * POST /api/quote/submit
 * Submit a quote request
 */
router.post('/submit', async (req: Request, res: Response) => {
  try {
    const {
      name,
      email,
      company,
      phone,
      services,
      turnaround,
      quantity,
      basePrice,
      volumeDiscount,
      turnaroundMultiplier,
      estimatedPrice,
    } = req.body;

    // Validation
    if (!name || !email || !company) {
      return res.status(400).json({
        success: false,
        error: 'Name, email, and company are required',
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format',
      });
    }

    if (!services || !Array.isArray(services) || services.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Services are required',
      });
    }

    if (!turnaround || !quantity || !estimatedPrice) {
      return res.status(400).json({
        success: false,
        error: 'Turnaround, quantity, and estimated price are required',
      });
    }

    // Create quote request
    const quoteRequest = await prisma.quoteRequest.create({
      data: {
        name,
        email,
        company,
        phone: phone || null,
        services: JSON.stringify(services),
        turnaround,
        quantity,
        basePrice,
        volumeDiscount,
        turnaroundMultiplier,
        estimatedPrice,
        status: 'pending',
      },
    });

    // Send email notification to admin
    await emailService.sendQuoteNotificationEmail(quoteRequest).catch(err => {
      console.error('Failed to send admin notification for quote:', err);
    });

    return res.status(201).json({
      success: true,
      data: quoteRequest,
      message: 'Quote request submitted successfully',
    });
  } catch (error: any) {
    console.error('Error submitting quote request:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to submit quote request',
    });
  }
});

// ─────────────────────────────────────────────────────────────
// ADMIN ROUTES
// ─────────────────────────────────────────────────────────────

/**
 * GET /api/quote/requests
 * Get all quote requests with pagination and filtering
 */
router.get('/requests', authenticate, async (req: Request, res: Response) => {
  try {
    const { page = '1', limit = '20', status, search } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
        { company: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const total = await prisma.quoteRequest.count({ where });

    const requests = await prisma.quoteRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limitNum,
    });

    return res.json({
      success: true,
      data: requests,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    console.error('Error fetching quote requests:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch quote requests',
    });
  }
});

/**
 * GET /api/quote/requests/:id
 * Get a single quote request by ID
 */
router.get('/requests/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const request = await prisma.quoteRequest.findUnique({
      where: { id },
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        error: 'Quote request not found',
      });
    }

    return res.json({
      success: true,
      data: request,
    });
  } catch (error: any) {
    console.error('Error fetching quote request:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch quote request',
    });
  }
});

/**
 * PATCH /api/quote/requests/:id
 * Update a quote request
 */
router.patch('/requests/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    const updateData: any = {};
    if (status !== undefined) updateData.status = status;
    if (adminNotes !== undefined) updateData.adminNotes = adminNotes;

    const request = await prisma.quoteRequest.update({
      where: { id },
      data: updateData,
    });

    return res.json({
      success: true,
      data: request,
      message: 'Quote request updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating quote request:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update quote request',
    });
  }
});

/**
 * DELETE /api/quote/requests/:id
 * Delete a quote request
 */
router.delete('/requests/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.quoteRequest.delete({
      where: { id },
    });

    return res.json({
      success: true,
      message: 'Quote request deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting quote request:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete quote request',
    });
  }
});

/**
 * GET /api/quote/stats
 * Get quote request statistics
 */
router.get('/stats', authenticate, async (_req: Request, res: Response) => {
  try {
    const [total, pending, reviewed, contacted, converted, lost] = await Promise.all([
      prisma.quoteRequest.count(),
      prisma.quoteRequest.count({ where: { status: 'pending' } }),
      prisma.quoteRequest.count({ where: { status: 'reviewed' } }),
      prisma.quoteRequest.count({ where: { status: 'contacted' } }),
      prisma.quoteRequest.count({ where: { status: 'converted' } }),
      prisma.quoteRequest.count({ where: { status: 'lost' } }),
    ]);

    const totalValue = await prisma.quoteRequest.aggregate({
      _sum: { estimatedPrice: true },
    });

    return res.json({
      success: true,
      data: {
        total,
        byStatus: {
          pending,
          reviewed,
          contacted,
          converted,
          lost,
        },
        totalEstimatedValue: totalValue._sum.estimatedPrice || 0,
      },
    });
  } catch (error: any) {
    console.error('Error fetching quote stats:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch quote stats',
    });
  }
});

export default router;
