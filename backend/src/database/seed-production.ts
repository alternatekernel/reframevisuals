import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seed() {
  console.log('Starting production dashboard database seed (GSD Edition)...\n');

  // ─────────────────────────────────────────────────────────────
  // 1. CREATE ADMIN USER
  // ─────────────────────────────────────────────────────────────

  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@reframe.com';

  if (!adminPassword) {
    throw new Error('FATAL: ADMIN_PASSWORD is not defined');
  }

  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      firstName: 'Admin',
      lastName: 'User',
      email: adminEmail,
      passwordHash: hashedPassword,
      role: 'admin',
    },
  });
  void admin;

  console.log(`✓ Admin user configured (${adminEmail})`);

  // ─────────────────────────────────────────────────────────────
  // 2. CREATE CUSTOMERS
  // ─────────────────────────────────────────────────────────────

  const customers = await Promise.all([
    prisma.customer.upsert({
      where: { id: 'customer-1' },
      update: {},
      create: {
        id: 'customer-1',
        customerNumber: 1,
        companyName: 'Nike Retail Inc.',
        industry: 'Apparel & Footwear',
        tenantId: 'nike-prod-1',
        email: 'john@nike.com',
        contactEmail: 'john@nike.com',
        contactPhone: '+1-555-0101',
        tier: 'enterprise',
        monthlyVolume: 850,
        totalOrders: 124,
        totalSpent: 125000,
        revisionRate: 8.5,
        lastOrderDate: new Date(),
        status: 'active',
      },
    }),
    prisma.customer.upsert({
      where: { id: 'customer-2' },
      update: {},
      create: {
        id: 'customer-2',
        customerNumber: 2,
        companyName: 'Amazon Basics',
        industry: 'E-commerce',
        tenantId: 'amazon-prod-1',
        email: 'sarah@amazon.com',
        contactEmail: 'sarah@amazon.com',
        contactPhone: '+1-555-0102',
        tier: 'enterprise',
        monthlyVolume: 1200,
        totalOrders: 256,
        totalSpent: 280000,
        revisionRate: 5.2,
        lastOrderDate: new Date(),
        status: 'active',
      },
    }),
  ]);

  console.log(`✓ Created ${customers.length} customers (Sequential IDs enabled)`);

  // ─────────────────────────────────────────────────────────────
  // 3. CREATE EDITORS
  // ─────────────────────────────────────────────────────────────

  const editors = await Promise.all([
    prisma.editor.upsert({
      where: { id: 'editor-1' },
      update: {},
      create: {
        id: 'editor-1',
        firstName: 'Ravi',
        lastName: 'Kumar',
        email: 'ravi@reframe.com',
        status: 'online',
        lastActiveAt: new Date(),
        tier: 'senior',
        qualityScore: 94.2,
        capacity: 15,
        currentLoad: 12,
      },
    }),
    prisma.editor.upsert({
      where: { id: 'editor-2' },
      update: {},
      create: {
        id: 'editor-2',
        firstName: 'Priya',
        lastName: 'Sharma',
        email: 'priya@reframe.com',
        status: 'online',
        lastActiveAt: new Date(),
        tier: 'senior',
        qualityScore: 96.5,
        capacity: 15,
        currentLoad: 14,
      },
    }),
  ]);

  console.log(`✓ Created ${editors.length} editors`);

  // ─────────────────────────────────────────────────────────────
  // 4. CREATE EMPLOYEES (New Model)
  // ─────────────────────────────────────────────────────────────

  const employees = await Promise.all([
    prisma.employee.upsert({
      where: { email: 'amit@reframe.com' },
      update: {},
      create: {
        id: 'emp-1',
        firstName: 'Amit',
        lastName: 'Patel',
        email: 'amit@reframe.com',
        department: 'Engineering',
      },
    }),
    prisma.employee.upsert({
      where: { email: 'sneha@reframe.com' },
      update: {},
      create: {
        id: 'emp-2',
        firstName: 'Sneha',
        lastName: 'Reddy',
        email: 'sneha@reframe.com',
        department: 'Customer Success',
      },
    }),
  ]);

  console.log(`✓ Created ${employees.length} employees`);

  // ─────────────────────────────────────────────────────────────
  // 5. CREATE ORDERS
  // ─────────────────────────────────────────────────────────────

  const orders = await Promise.all([
    prisma.order.upsert({
      where: { id: 'order-1' },
      update: {},
      create: {
        id: 'order-1',
        tenantId: 'platform',
        code: 'JOB001',
        customerId: 'customer-1',
        title: 'Winter Collection',
        description: 'Product photography for winter apparel line',
        serviceType: 'premium',
        complexity: 'medium',
        priority: 'high',
        volume: 24,
        basePrice: 10.20,
        discountPercent: 10,
        totalPrice: 220.32,
        assignedEditorId: null,
        status: 'new_review',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        expectedCompletion: new Date(Date.now() + 6 * 60 * 60 * 1000),
      },
    }),
    prisma.order.upsert({
      where: { id: 'order-3' },
      update: {},
      create: {
        id: 'order-3',
        tenantId: 'platform',
        code: 'JOB002',
        customerId: 'customer-2',
        title: 'Home Essentials',
        description: 'Mixed product photography',
        serviceType: 'premium',
        complexity: 'high',
        priority: 'high',
        volume: 18,
        basePrice: 13.20,
        discountPercent: 10,
        totalPrice: 213.84,
        assignedEditorId: 'editor-2',
        status: 'in_progress',
        createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
        startedAt: new Date(Date.now() - 7 * 60 * 60 * 1000),
        expectedCompletion: new Date(Date.now() + 2 * 60 * 60 * 1000),
      },
    }),
  ]);

  console.log(`✓ Created ${orders.length} orders (JOBxxx format)`);

  // ─────────────────────────────────────────────────────────────
  // 6. CREATE IMAGES
  // ─────────────────────────────────────────────────────────────

  const images = await Promise.all([
    prisma.image.upsert({
      where: { id: 'image-1' },
      update: {},
      create: {
        id: 'image-1',
        orderId: 'order-3',
        url: 'https://placeholder.com/image1.jpg',
        filename: 'nike-shoe-001.jpg',
        status: 'in_progress',
        revisionCount: 0,
        completedBy: 'editor-2',
      },
    }),
  ]);

  console.log(`✓ Created ${images.length} images`);

  // ─────────────────────────────────────────────────────────────
  // 7. CREATE TASKS (New Model)
  // ─────────────────────────────────────────────────────────────

  const tasks = await Promise.all([
    prisma.task.create({
      data: {
        title: 'Complete HR Audit',
        description: 'Review all employee contracts and attendance logs',
        status: 'todo',
        priority: 'high',
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      }
    }),
    prisma.task.create({
      data: {
        title: 'Update Pricing Matrix',
        description: 'Revise Q2 pricing for Enterprise customers',
        status: 'in_progress',
        priority: 'medium',
        dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      }
    }),
  ]);

  console.log(`✓ Created ${tasks.length} tasks`);

  // ─────────────────────────────────────────────────────────────
  // 8. CREATE ALERTS
  // ─────────────────────────────────────────────────────────────

  const alerts = await Promise.all([
    prisma.alert.create({
      data: {
        severity: 'critical',
        title: 'SLA Breach Imminent',
        message: 'Order OD-2024-1203 is 30 mins from deadline',
        alertType: 'sla',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      }
    }),
  ]);

  console.log(`✓ Created ${alerts.length} alerts`);

  // ─────────────────────────────────────────────────────────────
  // SUMMARY
  // ─────────────────────────────────────────────────────────────

  console.log('\n✅ Seed completed successfully!\n');
}

seed()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
