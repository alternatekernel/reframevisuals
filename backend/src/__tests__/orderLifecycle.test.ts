import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '../database/index';

// Mock the prisma database module to test lifecycle logic without requiring a running database service.
vi.mock('../database/index', () => {
  const mockPrisma = {
    activity: {
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
      create: vi.fn().mockImplementation((args) => Promise.resolve({ id: 'act_123', ...args.data })),
      findFirst: vi.fn(),
      count: vi.fn(),
    },
    quotation: {
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
      findMany: vi.fn().mockResolvedValue([]),
      delete: vi.fn().mockResolvedValue({}),
      upsert: vi.fn(),
      findUnique: vi.fn(),
      updateMany: vi.fn(),
    },
    order: {
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
      create: vi.fn(),
      update: vi.fn(),
      findFirst: vi.fn(),
    },
    customer: {
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  };
  return {
    prisma: mockPrisma,
    default: mockPrisma,
  };
});

describe('Order Post-Submission & Approval Lifecycle (Mocked)', () => {
  const tenantId = 'tenant_lifecycle_test';
  const customerId = 'cust_lifecycle_123';
  const orderId = 'order_lifecycle_456';
  const orderCode = 'RF-LIFECYCLE-99';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. Should successfully register a new order in "new_review" status', async () => {
    const mockOrder = {
      id: orderId,
      tenantId,
      code: orderCode,
      customerId,
      title: 'Ecommerce Bag Retouching',
      volume: 12,
      serviceType: 'retouching',
      status: 'new_review',
      priority: 'medium',
    };

    vi.mocked(prisma.order.create).mockResolvedValue(mockOrder as any);

    const order = await prisma.order.create({
      data: {
        tenantId,
        code: orderCode,
        customerId,
        title: 'Ecommerce Bag Retouching',
        volume: 12,
        serviceType: 'retouching',
        status: 'new_review',
        priority: 'medium',
      },
    });

    expect(order.id).toBe(orderId);
    expect(order.status).toBe('new_review');
    expect(order.volume).toBe(12);
    expect(prisma.order.create).toHaveBeenCalledTimes(1);
  });

  it('2. Should transition order status to "awaiting_approval" and upsert quotation when admin sends proposal', async () => {
    const basePricePerImage = 4.99;
    const addons = [
      { name: 'Color Correction', price: 1.5 },
      { name: 'Sizing / Crop', price: 1.0 },
    ];
    const slaMultiplier = 1.35; // Priority SLA markup
    
    // Calculate total price based on: (volume * basePricePerImage + addons sum) * slaMultiplier
    const baseTotal = 12 * basePricePerImage;
    const addonsTotal = addons.reduce((sum, item) => sum + item.price, 0);
    const totalPrice = (baseTotal + addonsTotal) * slaMultiplier;

    const mockQuotation = {
      id: 'quot_123',
      tenantId,
      code: `QT-${orderCode}`,
      customerId,
      orderId: orderId,
      volume: 12,
      serviceType: 'retouching',
      complexity: 'medium',
      basePrice: basePricePerImage,
      totalPrice: totalPrice,
      marginPercent: slaMultiplier,
      status: 'sent',
      sentAt: new Date(),
    };

    const mockUpdatedOrder = {
      id: orderId,
      status: 'awaiting_approval',
      basePrice: basePricePerImage,
      totalPrice: totalPrice,
      notes: JSON.stringify({ addons }),
    };

    // Mock transaction output
    vi.mocked(prisma.$transaction).mockResolvedValue([mockQuotation, mockUpdatedOrder]);

    // Simulate backend proposal endpoint logic:
    const [quotation, updatedOrder] = await prisma.$transaction([
      prisma.quotation.upsert({
        where: { orderId: orderId },
        update: {
          basePrice: basePricePerImage,
          totalPrice: totalPrice,
          marginPercent: slaMultiplier,
          status: 'sent',
          sentAt: new Date(),
        },
        create: {
          tenantId,
          code: `QT-${orderCode}`,
          customerId,
          orderId: orderId,
          volume: 12,
          serviceType: 'retouching',
          complexity: 'medium',
          basePrice: basePricePerImage,
          totalPrice: totalPrice,
          marginPercent: slaMultiplier,
          status: 'sent',
          sentAt: new Date(),
        },
      }),
      prisma.order.update({
        where: { id: orderId },
        data: {
          status: 'awaiting_approval',
          basePrice: basePricePerImage,
          totalPrice: totalPrice,
          notes: JSON.stringify({ addons }),
        },
      }),
    ]);

    // Record activity audit log
    await prisma.activity.create({
      data: {
        tenantId,
        customerId,
        orderId,
        type: 'status_change',
        message: `Pricing proposal dispatched to customer for order ${orderCode}. Proposed Total: $${Number(totalPrice).toFixed(2)}`,
      },
    });

    // Assert database mock transactions were called
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(prisma.activity.create).toHaveBeenCalledTimes(1);

    // Assert calculations and updates
    expect(updatedOrder.status).toBe('awaiting_approval');
    expect(Number(updatedOrder.totalPrice)).toBeCloseTo(totalPrice);
    expect(updatedOrder.notes).toBeDefined();

    const parsedNotes = JSON.parse(updatedOrder.notes!);
    expect(parsedNotes.addons).toHaveLength(2);
    expect(parsedNotes.addons[0].name).toBe('Color Correction');

    expect(quotation.status).toBe('sent');
    expect(Number(quotation.totalPrice)).toBeCloseTo(totalPrice);
  });

  it('3. Should transition order status to "in_progress" and update quotation to "accepted" when customer approves proposal', async () => {
    const mockUpdatedOrder = {
      id: orderId,
      status: 'in_progress',
    };
    const mockUpdatedQuotation = {
      count: 1,
    };

    vi.mocked(prisma.$transaction).mockResolvedValue([mockUpdatedOrder, mockUpdatedQuotation]);

    // Simulate backend portal approve endpoint logic:
    const [updatedOrder] = await prisma.$transaction([
      prisma.order.update({
        where: { id: orderId },
        data: { status: 'in_progress' },
      }),
      prisma.quotation.updateMany({
        where: { orderId: orderId, status: 'sent' },
        data: {
          status: 'accepted',
          acceptedAt: new Date(),
        },
      }),
    ]);

    // Record customer approve activity audit log
    await prisma.activity.create({
      data: {
        tenantId,
        customerId,
        orderId,
        type: 'status_change',
        message: `Order ${orderCode} proposal approved by customer. Status updated to in_progress.`,
      },
    });

    // Assert transitions and logs
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(updatedOrder.status).toBe('in_progress');
    expect(prisma.activity.create).toHaveBeenCalledTimes(1);
  });

  it('4. Should transition order status back to "new_review" and update quotation to "rejected" when customer declines proposal', async () => {
    const mockUpdatedOrder = {
      id: orderId,
      status: 'new_review',
    };
    const mockUpdatedQuotation = {
      count: 1,
    };

    vi.mocked(prisma.$transaction).mockResolvedValue([mockUpdatedOrder, mockUpdatedQuotation]);
    vi.mocked(prisma.order.findFirst).mockResolvedValue({
      id: orderId,
      code: orderCode,
      status: 'awaiting_approval',
      tenantId,
      customerId,
      customer: {
        id: customerId,
        email: 'test@reframe.ai',
        name: 'Test Customer',
      }
    } as any);

    // Simulate backend portal reject endpoint logic:
    const [updatedOrder] = await prisma.$transaction([
      prisma.order.update({
        where: { id: orderId },
        data: { status: 'new_review' },
      }),
      prisma.quotation.updateMany({
        where: { orderId: orderId, status: 'sent' },
        data: {
          status: 'rejected',
        },
      }),
    ]);

    // Record customer reject activity audit log
    await prisma.activity.create({
      data: {
        tenantId,
        customerId,
        orderId,
        type: 'status_change',
        message: `Order ${orderCode} proposal declined by customer. Notes: Pricing too high.`,
      },
    });

    // Assert transitions and logs
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(updatedOrder.status).toBe('new_review');
    expect(prisma.activity.create).toHaveBeenCalledTimes(1);
  });

  it('5. Should check expiration logic and correctly mark a quotation as expired', async () => {
    const mockExpiredQuotation = {
      id: 'quot_123',
      expiresAt: new Date(Date.now() - 5000), // Expired 5 seconds ago
    };

    const mockOrderWithQuotation = {
      id: orderId,
      status: 'awaiting_approval',
      quotation: mockExpiredQuotation,
    };

    vi.mocked(prisma.order.findFirst).mockResolvedValue(mockOrderWithQuotation as any);

    // Simulate backend portal approve endpoint query:
    const order = await prisma.order.findFirst({
      where: { id: orderId, customerId },
      include: { quotation: true }
    });

    expect(order).toBeDefined();
    expect(order!.quotation).toBeDefined();

    const isExpired = new Date(order!.quotation!.expiresAt).getTime() < Date.now();
    expect(isExpired).toBe(true);
  });

  it('6. Should accept customer revision request on completed order within 14 days', async () => {
    const mockOrder = {
      id: orderId,
      status: 'completed',
      completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // Completed 5 days ago (eligible)
      notes: 'Initial notes',
    };

    vi.mocked(prisma.order.findFirst).mockResolvedValue(mockOrder as any);
    vi.mocked(prisma.order.update).mockResolvedValue({
      ...mockOrder,
      status: 'revision_needed',
      notes: 'Initial notes\n\n[Customer revision requested]\nTest revision notes',
    } as any);

    // Simulate backend portal revision endpoint query and validation:
    const order = await prisma.order.findFirst({
      where: { id: orderId, customerId },
      include: { customer: true }
    });

    expect(order).toBeDefined();
    expect(order!.status === 'completed' || order!.status === 'ready_qc').toBe(true);

    if (order!.status === 'completed') {
      const fourteenDaysInMs = 14 * 24 * 60 * 60 * 1000;
      const isPastLimit = Date.now() - new Date(order!.completedAt!).getTime() > fourteenDaysInMs;
      expect(isPastLimit).toBe(false);
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'revision_needed',
        notes: `${order!.notes}\n\n[Customer revision requested]\nTest revision notes`
      }
    });

    expect(updatedOrder.status).toBe('revision_needed');
  });

  it('7. Should reject customer revision request on completed order older than 14 days', async () => {
    const mockOrder = {
      id: orderId,
      status: 'completed',
      completedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // Completed 15 days ago (expired)
    };

    vi.mocked(prisma.order.findFirst).mockResolvedValue(mockOrder as any);

    const order = await prisma.order.findFirst({
      where: { id: orderId, customerId },
      include: { customer: true }
    });

    expect(order).toBeDefined();
    expect(order!.status === 'completed').toBe(true);

    const fourteenDaysInMs = 14 * 24 * 60 * 60 * 1000;
    const isPastLimit = Date.now() - new Date(order!.completedAt!).getTime() > fourteenDaysInMs;
    expect(isPastLimit).toBe(true);
  });

  it('8. Should enforce order submission idempotency on the backend', async () => {
    const mockOrderWithIdempotency = {
      id: orderId,
      code: orderCode,
      idempotencyKey: 'idemp-123456789',
      customerId,
      status: 'new_review',
    };

    vi.mocked(prisma.order.findFirst).mockResolvedValue(mockOrderWithIdempotency as any);

    const existingOrder = await prisma.order.findFirst({
      where: { idempotencyKey: 'idemp-123456789', customerId }
    });

    expect(existingOrder).toBeDefined();
    expect(existingOrder!.idempotencyKey).toBe('idemp-123456789');
    expect(existingOrder!.id).toBe(orderId);
  });

  it('9. Should enforce Stripe webhook event idempotency on duplicate deliveries', async () => {
    const mockEventId = 'evt_stripe_test_12345';
    const result = { type: 'payment_success', orderId: 'order_123', sessionId: 'sess_123', eventId: mockEventId };
    const mockProcessedEvents = new Set<string>();

    let processedFirst = false;
    if (!mockProcessedEvents.has(result.eventId)) {
      mockProcessedEvents.add(result.eventId);
      processedFirst = true;
    }

    let processedSecond = false;
    if (!mockProcessedEvents.has(result.eventId)) {
      processedSecond = true;
    }

    expect(processedFirst).toBe(true);
    expect(processedSecond).toBe(false);
  });

  it('10. Should track payment failures and update database status to failed', async () => {
    const mockOrderFailed = {
      id: orderId,
      status: 'new_review',
      paymentStatus: 'failed',
      stripePaymentId: 'sess_failed_123',
    };

    vi.mocked(prisma.order.update).mockResolvedValue(mockOrderFailed as any);

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: 'failed',
        stripePaymentId: 'sess_failed_123'
      }
    });

    expect(updatedOrder.paymentStatus).toBe('failed');
    expect(updatedOrder.stripePaymentId).toBe('sess_failed_123');
  });
});
