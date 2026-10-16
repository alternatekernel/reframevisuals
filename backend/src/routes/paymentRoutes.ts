import { Router, Request, Response } from 'express';
import express from 'express';
import { prisma } from '../database';
import { authenticate } from '../middleware/auth';
import { stripeService } from '../services/stripeService';
import { firePaymentNotifications, firePaymentFailureNotifications } from '../services/notificationService';
import { cache } from '../services/cacheService';

// In-memory cache fallback for webhook idempotency
const processedEventsMemorySet = new Set<string>();

async function isWebhookProcessed(eventId: string): Promise<boolean> {
  const cacheKey = `stripe:event:${eventId}`;
  try {
    if (cache.isEnabled()) {
      const cached = await cache.get<boolean>(cacheKey);
      if (cached) return true;
    }
  } catch (err) {
    console.warn('[Cache] Redis error in isWebhookProcessed:', err);
  }
  return processedEventsMemorySet.has(eventId);
}

async function markWebhookProcessed(eventId: string): Promise<void> {
  const cacheKey = `stripe:event:${eventId}`;
  try {
    if (cache.isEnabled()) {
      await cache.set(cacheKey, true, 86400); // 24 hours TTL
    }
  } catch (err) {
    console.warn('[Cache] Redis error in markWebhookProcessed:', err);
  }
  processedEventsMemorySet.add(eventId);

  // Prevent memory growth in local fallback
  if (processedEventsMemorySet.size > 5000) {
    const arr = Array.from(processedEventsMemorySet);
    processedEventsMemorySet.clear();
    arr.slice(2500).forEach(id => processedEventsMemorySet.add(id));
  }
}

const router = Router();

/**
 * POST /api/payments/create-checkout
 * Create a Stripe checkout session for an order
 */
router.post('/create-checkout', authenticate, async (req: Request, res: Response) => {
  try {
    const { orderId } = req.body;
    const userId = (req as any).user.id;

    if (!orderId) {
      return res.status(400).json({ success: false, error: 'Order ID is required' });
    }

    // Fetch order and verify ownership
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { customer: true }
    });

    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    if (order.customerId !== userId && (req as any).user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    const session = await stripeService.createCheckoutSession(order, order.customer.email);

    return res.json({
      success: true,
      url: session.url,
      sessionId: session.id,
    });
  } catch (error: any) {
    console.error('Payment Session Error:', error);
    return res.status(500).json({ success: false, error: 'Failed to create payment session' });
  }
});

/**
 * POST /api/payments/webhook
 * Stripe Webhook endpoint
 * FIX: Uses express.raw() to preserve raw body bytes required for Stripe signature verification.
 * This route MUST be registered with express.raw() before the global express.json() parser.
 * Mount this in index.ts BEFORE app.use(express.json()).
 */
router.post('/webhook', express.raw({ type: 'application/json' }), async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'];

  try {
    const result = await stripeService.handleWebhook(sig as string, req.body) as any;
    const eventId = result.eventId;

    if (eventId) {
      const alreadyProcessed = await isWebhookProcessed(eventId);
      if (alreadyProcessed) {
        console.log(`ℹ️ Duplicate Stripe webhook event ignored: ${eventId}`);
        return res.json({ received: true });
      }
    }
    
    if (result.type === 'payment_success') {
      // Update order in database
      const updatedOrder = await prisma.order.update({
        where: { id: result.orderId },
        data: {
          paymentStatus: 'paid',
          stripePaymentId: result.sessionId
        },
        include: { customer: true }
      });

      // Fire Payment Notifications to hello@reframevisuals.com
      firePaymentNotifications(
        updatedOrder.id,
        updatedOrder.totalPrice ? Number(updatedOrder.totalPrice) : 0,
        updatedOrder.customer?.email || 'N/A'
      );

      console.log(`✅ Order ${result.orderId} marked as PAID`);
    } else if (result.type === 'payment_failed') {
      // Update order in database
      const updatedOrder = await prisma.order.update({
        where: { id: result.orderId },
        data: {
          paymentStatus: 'failed',
          stripePaymentId: result.sessionId
        },
        include: { customer: true }
      });

      // Fire failure notifications to admin
      firePaymentFailureNotifications(
        updatedOrder.id,
        updatedOrder.totalPrice ? Number(updatedOrder.totalPrice) : 0,
        updatedOrder.customer?.email || 'N/A'
      );

      // Create admin dashboard alert
      await prisma.alert.create({
        data: {
          severity: 'high',
          title: '❌ Payment Failed / Expired',
          message: `Payment for Order ${updatedOrder.code} has failed or expired.`,
          alertType: 'payment',
          actionLabel: 'View Order',
          actionLink: `/admin/orders/${updatedOrder.id}`,
          expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000)
        }
      });

      console.log(`❌ Order ${result.orderId} marked as payment FAILED`);
    }

    if (eventId) {
      await markWebhookProcessed(eventId);
    }

    return res.json({ received: true });
  } catch (err: any) {
    console.error('[Stripe Webhook] Error:', err.message);
    return res.status(400).json({ success: false, error: 'Webhook processing failed' });
  }
});

export default router;
