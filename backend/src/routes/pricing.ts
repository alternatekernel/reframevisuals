import { Router, Request, Response } from 'express';
import { prisma } from '../database';

const router = Router();

// ─────────────────────────────────────────────────────────────
// GET /api/pricing/customer-tiers
// Returns customer pricing matrix
// ─────────────────────────────────────────────────────────────

router.get('/customer-tiers', async (_req: Request, res: Response) => {
  try {
    const tiers = await prisma.pricingTier.findMany({
      where: { tierType: 'customer' },
      orderBy: { tierLevel: 'asc' },
    });

    return res.json({
      tiers: tiers.map((tier) => {
        const config = JSON.parse(tier.pricingConfig);
        return {
          id: tier.id,
          name: tier.tierName,
          minVolume: tier.minVolume || 0,
          maxVolume: tier.maxVolume || null,
          discount: config.volumeDiscount || 0,
          prices: config.prices || {},
        };
      }),
    });
  } catch (error: any) {
    return res.status(500).json({
      error: {
        code: 'PRICING_ERROR',
        message: error.message,
      },
    });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/pricing/editor-tiers
// Returns editor payout matrix
// ─────────────────────────────────────────────────────────────

router.get('/editor-tiers', async (_req: Request, res: Response) => {
  try {
    const tiers = await prisma.pricingTier.findMany({
      where: { tierType: 'editor' },
      orderBy: { tierLevel: 'asc' },
    });

    return res.json({
      tiers: tiers.map((tier) => {
        const config = JSON.parse(tier.pricingConfig);
        return {
          id: tier.id,
          name: tier.tierName,
          qualification: config.qualification || '',
          payouts: config.payouts || {},
          bonuses: config.bonuses || [],
        };
      }),
    });
  } catch (error: any) {
    return res.status(500).json({
      error: {
        code: 'PRICING_ERROR',
        message: error.message,
      },
    });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/pricing/margin-guard
// Returns live margin metrics
// ─────────────────────────────────────────────────────────────

router.get('/margin-guard', async (_req: Request, res: Response) => {
  try {
    // Get recent quotations
    const recentQuotes = await prisma.quotation.findMany({
      where: { status: { in: ['sent', 'accepted'] } },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        customer: {
          select: {
            companyName: true,
          },
        },
      },
    });

    // Calculate average metrics
    const totalRevenue = recentQuotes.reduce((sum, q) => sum + (q.totalPrice ? Number(q.totalPrice) : 0), 0);
    const avgMargin =
      recentQuotes.reduce((sum, q) => sum + (q.marginPercent ? Number(q.marginPercent) : 0), 0) /
      recentQuotes.length;

    // Calculate take-vs-give ratio (simplified)
    const avgCustomerPrice = totalRevenue / recentQuotes.length;
    const avgEditorPayout = avgCustomerPrice * 0.48; // ~48% payout
    const takeVsGiveRatio = avgCustomerPrice / avgEditorPayout;

    return res.json({
      metrics: [
        {
          metric: 'Take vs. Give Ratio',
          current: `${takeVsGiveRatio.toFixed(1)}:1`,
          target: '2.5:1',
          status: takeVsGiveRatio >= 2.5 ? 'good' : takeVsGiveRatio >= 2.0 ? 'warning' : 'critical',
          trend: 'stable',
        },
        {
          metric: 'Gross Margin %',
          current: Math.round(avgMargin),
          target: 60,
          status: avgMargin >= 60 ? 'good' : avgMargin >= 50 ? 'warning' : 'critical',
          trend: 'stable',
        },
        {
          metric: 'Net Margin %',
          current: Math.round(avgMargin * 0.65), // Simplified
          target: 35,
          status: 'on_track',
          trend: 'stable',
        },
      ],
      recentQuotes: recentQuotes.map((q) => ({
        code: q.code,
        customer: q.customer.companyName,
        price: q.totalPrice ? Number(q.totalPrice) : 0,
        payout: q.totalPrice ? Number(q.totalPrice) * 0.48 : 0,
        margin: q.marginPercent ? Number(q.marginPercent) : 0,
      })),
    });
  } catch (error: any) {
    return res.status(500).json({
      error: {
        code: 'MARGIN_ERROR',
        message: error.message,
      },
    });
  }
});

// ─────────────────────────────────────────────────────────────
// PATCH /api/pricing/customer-tiers/:id
// Update customer tier pricing
// ─────────────────────────────────────────────────────────────

router.patch('/customer-tiers/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, minVolume, maxVolume, discount, prices } = req.body;

    const pricingConfig = {
      prices,
      volumeDiscount: discount,
    };

    const tier = await prisma.pricingTier.update({
      where: { id },
      data: {
        tierName: name,
        minVolume,
        maxVolume,
        pricingConfig: JSON.stringify(pricingConfig),
      },
    });

    return res.json({
      id: tier.id,
      message: 'Pricing tier updated successfully',
    });
  } catch (error: any) {
    return res.status(400).json({
      error: {
        code: 'UPDATE_PRICING_ERROR',
        message: error.message,
      },
    });
  }
});

export default router;
