import Stripe from 'stripe';

/**
 * Service for handling Stripe payments, checkouts, and webhooks
 */
class StripeService {
  private stripe: any = null;
  private isMock: boolean = true;

  constructor() {
    this.init();
  }

  private init() {
    const apiKey = process.env.STRIPE_SECRET_KEY;
    if (apiKey) {
      this.stripe = new Stripe(apiKey, {
        apiVersion: '2024-11-20.acacia' as any, // Using a stable version
      });
      this.isMock = false;
      console.log('✅ Stripe Service initialized');
    } else {
      console.warn('[Stripe] Provider is not configured. Running in mock mode.');
    }
  }

  /**
   * Create a checkout session for an order
   */
  async createCheckoutSession(order: any, customerEmail: string) {
    if (this.isMock || !this.stripe) {
      return {
        id: `mock_session_${Date.now()}`,
        url: `${process.env.FRONTEND_URL}/portal/orders/${order.id}?payment=mock_success`,
      };
    }

    try {
      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        customer_email: customerEmail,
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `Reframe Order #${order.id.substring(0, 8)}`,
                description: `${order.volume} images for ${order.serviceType || 'editing'}`,
              },
              unit_amount: Math.round(order.totalPrice * 100), // Stripe uses cents
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${process.env.FRONTEND_URL}/portal/orders/${order.id}?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL}/portal/orders/${order.id}?payment=cancelled`,
        metadata: {
          orderId: order.id,
        },
      });

      return { id: session.id, url: session.url };
    } catch (error) {
      console.error('❌ Stripe Checkout Session Error:', error);
      throw error;
    }
  }

  /**
   * Handle Stripe Webhooks
   */
  async handleWebhook(signature: string, payload: Buffer) {
    if (this.isMock || !this.stripe) {
      console.log('📧 Mock Webhook received:', payload.toString());
      let eventId = `mock_evt_${Date.now()}`;
      let orderId: string | undefined;
      let sessionId: string | undefined;
      let mockType = 'payment_success';
      try {
        const bodyObj = JSON.parse(payload.toString());
        eventId = bodyObj.id || eventId;
        orderId = bodyObj.data?.object?.metadata?.orderId;
        sessionId = bodyObj.data?.object?.id;
        if (bodyObj.type === 'payment_failed' || bodyObj.type?.includes('failed') || bodyObj.type?.includes('expired')) {
          mockType = 'payment_failed';
        }
      } catch {
        // ignore
      }

      if (orderId && sessionId) {
        return { type: mockType, orderId, sessionId, eventId };
      }
      return { received: true, eventId };
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new Error('Missing STRIPE_WEBHOOK_SECRET');
    }

    try {
      const event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
      const eventId = event.id;
      
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as any;
          const orderId = session.metadata?.orderId;
          if (orderId) {
            return { type: 'payment_success', orderId, sessionId: session.id, eventId };
          }
          break;
        }
        case 'checkout.session.expired': {
          const session = event.data.object as any;
          const orderId = session.metadata?.orderId;
          if (orderId) {
            return { type: 'payment_failed', orderId, sessionId: session.id, eventId };
          }
          break;
        }
        case 'payment_intent.payment_failed': {
          const intent = event.data.object as any;
          const orderId = intent.metadata?.orderId;
          if (orderId) {
            return { type: 'payment_failed', orderId, sessionId: intent.id, eventId };
          }
          break;
        }
        case 'invoice.payment_failed': {
          const invoice = event.data.object as any;
          const orderId = invoice.metadata?.orderId;
          if (orderId) {
            return { type: 'payment_failed', orderId, sessionId: invoice.id, eventId };
          }
          break;
        }
        default:
          console.log(`Unhandled event type ${event.type}`);
      }

      return { received: true, eventId };
    } catch (err: any) {
      console.error(`❌ Webhook Error: ${err.message}`);
      throw err;
    }
  }
}

export const stripeService = new StripeService();
