/**
 * seed-orders.ts
 * Creates test orders covering every status in the production workflow
 * so customer-facing order management can be verified end-to-end.
 *
 * Run: npx ts-node -e "require('./src/database/seed-orders.ts')"
 *   or: npx tsx src/database/seed-orders.ts
 *
 * Safe to run multiple times — uses upsert on order codes.
 * Does NOT wipe existing data.
 *
 * Test customer login: testcustomer@reframevisuals.com / Test1234!
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ─── Helpers ──────────────────────────────────────────────────────────────────

const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);
const hoursAgo = (n: number) => new Date(Date.now() - n * 60 * 60 * 1000);
const hoursFromNow = (n: number) => new Date(Date.now() + n * 60 * 60 * 1000);
const daysFromNow = (n: number) => new Date(Date.now() + n * 24 * 60 * 60 * 1000);

// Placeholder image URLs (public placeholder service — no Dropbox needed for testing)
const placeholder = (w: number, h: number, label: string) =>
  `https://placehold.co/${w}x${h}/eeeeee/999999?text=${encodeURIComponent(label)}`;

async function main() {
  console.log('\n🌱  Seeding test orders...\n');

  // ─── 1. Test Customer + Portal User ─────────────────────────────────────────
  // This is the account you'll use to log in at /dashboard and see orders.

  const customer = await prisma.customer.upsert({
    where: { email: 'testcustomer@reframevisuals.com' },
    update: {},
    create: {
      name: 'Alex Test',
      email: 'testcustomer@reframevisuals.com',
      companyName: 'Test Brand Co.',
      contactEmail: 'testcustomer@reframevisuals.com',
      tenantId: 'test-brand-co-seed',
      status: 'active',
      isGuest: false,
      customerNumber: 999,
    },
  });

  // Portal login requires a User row linked to the customer
  const passwordHash = await bcrypt.hash('Test1234!', 10);
  await prisma.user.upsert({
    where: { email: 'testcustomer@reframevisuals.com' },
    update: {},
    create: {
      firstName: 'Alex',
      lastName: 'Test',
      email: 'testcustomer@reframevisuals.com',
      passwordHash,
      role: 'customer',
      customerId: customer.id,
    },
  });

  console.log('✅  Test customer: testcustomer@reframevisuals.com / Test1234!');

  // ─── 2. Get or create an editor for assignment ───────────────────────────────

  const editor = await prisma.editor.upsert({
    where: { email: 'alex@reframe.com' },
    update: {},
    create: {
      firstName: 'Alex',
      lastName: 'Editor',
      email: 'alex@reframe.com',
      status: 'online',
      tier: 'senior',
      capacity: 50,
      currentLoad: 12,
      qualityScore: 98.5,
    },
  });

  // ─── 3. Orders — one per workflow status ─────────────────────────────────────

  // ── 3a. new_review — just submitted, awaiting admin review ───────────────────
  const orderNewReview = await prisma.order.upsert({
    where: { code: 'RF-SEED01' },
    update: {},
    create: {
      code: 'RF-SEED01',
      tenantId: customer.tenantId,
      customerId: customer.id,
      title: 'Spring Lookbook — Background Removal',
      description: 'E-commerce backgrounds need to be pure white. Output WebP 2000x2000px.',
      serviceType: 'background-removal',
      complexity: 'medium',
      priority: 'medium',
      volume: 24,
      photoCount: 24,
      status: 'new_review',
      basePrice: 0.39,
      totalPrice: 9.36,
      expectedCompletion: daysFromNow(2),
      createdAt: hoursAgo(3),
      customFilesLink: 'https://www.dropbox.com/sh/example/seed01',
      customFilesCount: 24,
    },
  });

  await prisma.image.createMany({
    skipDuplicates: true,
    data: Array.from({ length: 5 }, (_, i) => ({
      orderId: orderNewReview.id,
      url: placeholder(800, 800, `Product ${i + 1}`),
      filename: `product_${String(i + 1).padStart(2, '0')}.jpg`,
      status: 'pending',
      type: 'work',
    })),
  });

  console.log('✅  RF-SEED01  new_review     (24 images, just submitted)');

  // ── 3b. awaiting_approval — pricing proposal sent, customer must approve ──────
  const orderAwaiting = await prisma.order.upsert({
    where: { code: 'RF-SEED02' },
    update: {},
    create: {
      code: 'RF-SEED02',
      tenantId: customer.tenantId,
      customerId: customer.id,
      title: 'Jewelry Collection — High-End Retouch',
      description: 'Full high-end retouch: skin, metal, stone. Deliver TIFF + web JPG.',
      serviceType: 'jewelry-retouch',
      complexity: 'advanced',
      priority: 'high',
      volume: 12,
      photoCount: 12,
      status: 'awaiting_approval',
      basePrice: 0.80,
      totalPrice: 96.00,
      expectedCompletion: daysFromNow(3),
      createdAt: daysAgo(2),
      adminNotes: 'Quoted at $8/image for high-end tier — client has approved complexity verbally.',
    },
  });

  // Attach a sent quotation so the customer portal can show "Approve / Decline"
  await prisma.quotation.upsert({
    where: { code: 'QT-RF-SEED02' },
    update: {},
    create: {
      code: 'QT-RF-SEED02',
      tenantId: customer.tenantId,
      customerId: customer.id,
      orderId: orderAwaiting.id,
      volume: 12,
      serviceType: 'jewelry-retouch',
      complexity: 'advanced',
      basePrice: 8.00,
      totalPrice: 96.00,
      marginPercent: 1.0,
      status: 'sent',
      sentAt: daysAgo(1),
      expiresAt: daysFromNow(13),
    },
  });

  await prisma.image.createMany({
    skipDuplicates: true,
    data: Array.from({ length: 4 }, (_, i) => ({
      orderId: orderAwaiting.id,
      url: placeholder(800, 800, `Jewel ${i + 1}`),
      filename: `jewel_${String(i + 1).padStart(2, '0')}.jpg`,
      status: 'pending',
      type: 'work',
    })),
  });

  console.log('✅  RF-SEED02  awaiting_approval  (12 images, proposal sent $96)');

  // ── 3c. in_progress — editor assigned, actively being retouched ──────────────
  const orderInProgress = await prisma.order.upsert({
    where: { code: 'RF-SEED03' },
    update: {},
    create: {
      code: 'RF-SEED03',
      tenantId: customer.tenantId,
      customerId: customer.id,
      title: 'Ghost Mannequin — Hoodie Range',
      description: 'Front + back + neck insert for each hoodie. Output on white.',
      serviceType: 'ghost-mannequin',
      complexity: 'medium',
      priority: 'high',
      volume: 18,
      photoCount: 18,
      status: 'in_progress',
      assignedEditorId: editor.id,
      basePrice: 0.85,
      totalPrice: 15.30,
      expectedCompletion: hoursFromNow(8),
      createdAt: daysAgo(1),
      startedAt: hoursAgo(10),
      customFilesLink: 'https://www.dropbox.com/sh/example/seed03',
      customFilesCount: 54,
      adminNotes: 'Alex: start with the black colourway first — client needs those for paid ads tomorrow.',
    },
  });

  await prisma.image.createMany({
    skipDuplicates: true,
    data: [
      ...Array.from({ length: 8 }, (_, i) => ({
        orderId: orderInProgress.id,
        url: placeholder(800, 1000, `Hoodie ${i + 1}`),
        filename: `hoodie_${String(i + 1).padStart(2, '0')}.jpg`,
        status: 'completed',
        type: 'work',
        completedBy: editor.id,
      })),
      ...Array.from({ length: 10 }, (_, i) => ({
        orderId: orderInProgress.id,
        url: placeholder(800, 1000, `Hoodie ${i + 9}`),
        filename: `hoodie_${String(i + 9).padStart(2, '0')}.jpg`,
        status: 'in_progress',
        type: 'work',
      })),
    ],
  });

  console.log('✅  RF-SEED03  in_progress     (18 images, 8 done / 10 in edit)');

  // ── 3d. ready_qc — editing done, waiting for customer to review & approve ─────
  const orderReadyQC = await prisma.order.upsert({
    where: { code: 'RF-SEED04' },
    update: {},
    create: {
      code: 'RF-SEED04',
      tenantId: customer.tenantId,
      customerId: customer.id,
      title: 'Summer Catalogue — Clipping Path',
      description: 'Precision paths on all items, export as transparent PNG.',
      serviceType: 'clipping-path',
      complexity: 'simple',
      priority: 'medium',
      volume: 30,
      photoCount: 30,
      status: 'ready_qc',
      assignedEditorId: editor.id,
      basePrice: 0.39,
      totalPrice: 11.70,
      expectedCompletion: hoursFromNow(2),
      createdAt: daysAgo(3),
      startedAt: daysAgo(2),
      submittedQCAt: hoursAgo(1),
    },
  });

  await prisma.image.createMany({
    skipDuplicates: true,
    data: Array.from({ length: 6 }, (_, i) => ({
      orderId: orderReadyQC.id,
      url: placeholder(800, 800, `Item ${i + 1}`),
      filename: `item_${String(i + 1).padStart(2, '0')}.jpg`,
      status: 'completed',
      type: 'work',
      completedBy: editor.id,
    })),
  });

  console.log('✅  RF-SEED04  ready_qc        (30 images, awaiting customer approval)');

  // ── 3e. revision_needed — customer requested changes ─────────────────────────
  const orderRevision = await prisma.order.upsert({
    where: { code: 'RF-SEED05' },
    update: {},
    create: {
      code: 'RF-SEED05',
      tenantId: customer.tenantId,
      customerId: customer.id,
      title: 'Footwear Range — Shadow Creation',
      description: 'Natural drop shadow under each shoe. Dark background variants also needed.',
      serviceType: 'shadow-creation',
      complexity: 'medium',
      priority: 'medium',
      volume: 16,
      photoCount: 16,
      status: 'revision_needed',
      assignedEditorId: editor.id,
      basePrice: 0.35,
      totalPrice: 5.60,
      expectedCompletion: hoursFromNow(6),
      createdAt: daysAgo(4),
      startedAt: daysAgo(3),
      submittedQCAt: daysAgo(1),
      revisionNotes: 'Shadows are too harsh on images 3, 7, 11. Need softer falloff — see annotation. Also image 14 shadow is missing entirely.',
    },
  });

  await prisma.image.createMany({
    skipDuplicates: true,
    data: [
      ...Array.from({ length: 13 }, (_, i) => ({
        orderId: orderRevision.id,
        url: placeholder(800, 600, `Shoe ${i + 1}`),
        filename: `shoe_${String(i + 1).padStart(2, '0')}.jpg`,
        status: 'completed',
        type: 'work',
        completedBy: editor.id,
      })),
      // The 3 problem images
      ...Array.from({ length: 3 }, (_, i) => ({
        orderId: orderRevision.id,
        url: placeholder(800, 600, `Shoe ${i + 14} ⚠`),
        filename: `shoe_${String(i + 14).padStart(2, '0')}.jpg`,
        status: 'revision_needed',
        type: 'work',
        revisionCount: 1,
      })),
    ],
  });

  console.log('✅  RF-SEED05  revision_needed (16 images, 3 flagged for revision)');

  // ── 3f. completed — fully delivered, downloadable ────────────────────────────
  const orderCompleted = await prisma.order.upsert({
    where: { code: 'RF-SEED06' },
    update: {},
    create: {
      code: 'RF-SEED06',
      tenantId: customer.tenantId,
      customerId: customer.id,
      title: 'Winter Collection — Color Correction',
      description: 'Neutral color balance across full winter batch. Match reference file.',
      serviceType: 'color-correction',
      complexity: 'simple',
      priority: 'low',
      volume: 50,
      photoCount: 50,
      status: 'completed',
      assignedEditorId: editor.id,
      basePrice: 0.35,
      totalPrice: 17.50,
      expectedCompletion: daysAgo(1),
      createdAt: daysAgo(7),
      startedAt: daysAgo(6),
      submittedQCAt: daysAgo(2),
      completedAt: daysAgo(1),
      customFilesLink: 'https://www.dropbox.com/sh/example/seed06-delivered',
      customFilesCount: 50,
    },
  });

  await prisma.image.createMany({
    skipDuplicates: true,
    data: Array.from({ length: 8 }, (_, i) => ({
      orderId: orderCompleted.id,
      url: placeholder(800, 800, `Delivered ${i + 1}`),
      filename: `winter_${String(i + 1).padStart(2, '0')}.jpg`,
      status: 'completed',
      type: 'work',
      completedBy: editor.id,
    })),
  });

  console.log('✅  RF-SEED06  completed       (50 images, delivered 1 day ago)');

  // ── 3g. A second completed order (older) — for order history view ─────────────
  await prisma.order.upsert({
    where: { code: 'RF-SEED07' },
    update: {},
    create: {
      code: 'RF-SEED07',
      tenantId: customer.tenantId,
      customerId: customer.id,
      title: 'Free Trial — Product Retouch',
      description: 'Free sample batch — 3 images.',
      serviceType: 'free_trial',
      complexity: 'simple',
      priority: 'low',
      volume: 3,
      photoCount: 3,
      status: 'completed',
      basePrice: 0,
      totalPrice: 0,
      expectedCompletion: daysAgo(14),
      createdAt: daysAgo(16),
      startedAt: daysAgo(15),
      completedAt: daysAgo(14),
    },
  });

  console.log('✅  RF-SEED07  completed       (free trial, 3 images, 16 days ago)');

  // ─── Summary ─────────────────────────────────────────────────────────────────

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Seed complete — 7 orders across all statuses
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Customer portal login
    URL:      /login  (or /dashboard)
    Email:    testcustomer@reframevisuals.com
    Password: Test1234!

  Orders seeded:
    RF-SEED01  new_review         Spring Lookbook
    RF-SEED02  awaiting_approval  Jewelry Collection (proposal $96)
    RF-SEED03  in_progress        Ghost Mannequin Hoodies
    RF-SEED04  ready_qc           Summer Clipping Path
    RF-SEED05  revision_needed    Footwear Shadows
    RF-SEED06  completed          Winter Color Correction
    RF-SEED07  completed          Free Trial (old)

  Admin kanban: /admin/production
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
