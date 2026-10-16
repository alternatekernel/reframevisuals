import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// --- DATA DEFINITIONS ---

const SERVICES = [
  { id: 'background-removal', name: 'Background Removal', price: 0.39, description: 'Clean extraction of your product from any background.' },
  { id: 'shadow-creation', name: 'Shadow Creation', price: 0.35, description: 'Add natural depth and realism to product photos.' },
  { id: 'clipping-path', name: 'Clipping Path', price: 0.39, description: 'Precision vector paths for clean cutouts.' },
  { id: 'multi-clipping-path', name: 'Multi-Clipping Path', price: 0.90, description: 'Multiple paths for complex multi-part products.' },
  { id: 'retouching', name: 'Retouching', price: 0.55, description: 'Professional retouching for your images.' },
  { id: 'model-retouch', name: 'Model Retouch', price: 1.20, description: 'Professional model and portrait retouching.' },
  { id: 'garment-retouch', name: 'Garment Retouch', price: 0.55, description: 'Perfect your apparel product photography.' },
  { id: 'jewelry-retouch', name: 'Jewelry Retouch', price: 0.80, description: 'Specialized retouching for jewelry and accessories.' },
  { id: 'ghost-mannequin', name: 'Ghost Mannequin', price: 0.85, description: 'Create hollow 3D apparel presentations.' },
  { id: 'color-change', name: 'Color Change', price: 0.30, description: 'Change product colors without reshooting.' },
  { id: 'color-correction', name: 'Color Correction', price: 0.35, description: 'Accurate color matching across your entire catalog.' },
  { id: 'pattern-change', name: 'Pattern Change', price: 1.25, description: 'Swap fabric patterns and textures seamlessly.' },
  { id: 'manipulation', name: 'Image Manipulation', price: 3.99, description: 'Creative compositing and image manipulation.' },
];

const BUNDLES = [
  { id: 'marketplace-ready', name: 'Marketplace Ready', price: 0.49, description: 'Everything you need for marketplace listings', savings: 'Save ~15%', services: ['Background Removal', 'Shadow Creation', 'Color Correction'] },
  { id: 'ghost-mannequin-complete', name: 'Ghost Mannequin Complete', price: 1.54, description: 'Complete apparel presentation package', savings: 'Save ~11%', services: ['Ghost Mannequin', 'Garment Retouch', 'Color Correction', 'Background Removal'] },
  { id: 'jewelry-essentials', name: 'Jewelry Essentials', price: 1.54, description: 'Professional jewelry product photography', savings: 'Save ~12%', services: ['Background Removal', 'Jewelry Retouch', 'Shadow Creation'] },
];

async function main() {
  console.log('--- Database Seeding (Master Manifest) ---');


  // 1. Create Default Admin User
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    throw new Error('FATAL: ADMIN_PASSWORD is not defined');
  }
  const hashedPassword = await bcrypt.hash(adminPassword, 10);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@reframe.com' },
    update: {},
    create: {
      email: 'admin@reframe.com',
      passwordHash: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin'
    }
  });

  // 2. Seed Sections (Web Content)
  await prisma.section.upsert({
    where: { sectionId_userId: { sectionId: 'services', userId: adminUser.id } },
    update: { content: JSON.stringify({ items: SERVICES }) },
    create: { sectionId: 'services', label: 'Our Services', content: JSON.stringify({ items: SERVICES }), userId: adminUser.id }
  });

  await prisma.section.upsert({
    where: { sectionId_userId: { sectionId: 'pricing', userId: adminUser.id } },
    update: { content: JSON.stringify({ bundles: BUNDLES }) },
    create: { sectionId: 'pricing', label: 'Pricing Plans', content: JSON.stringify({ bundles: BUNDLES }), userId: adminUser.id }
  });

  // 3. Seed Platform Pages (Navigation & AI Knowledge)
  const pages = [
    { title: 'Home', path: '/', description: 'Main landing page', section: 'Main', icon: 'Home', requiresAuth: false, isAdmin: false },
    { title: 'Services', path: '/services', description: 'Full listing of all 19 services', section: 'Main', icon: 'Layers', requiresAuth: false, isAdmin: false },
    { title: 'Pricing', path: '/pricing', description: 'Pricing matrix and bundles', section: 'Main', icon: 'DollarSign', requiresAuth: false, isAdmin: false },
    { title: 'Dashboard', path: '/dashboard', description: 'User central hub', section: 'Main', icon: 'LayoutDashboard', requiresAuth: true, isAdmin: false },
    { title: 'Order History', path: '/orders', description: 'View all past jobs', section: 'Business', icon: 'History', requiresAuth: true, isAdmin: false },
    { title: 'Billing', path: '/billing', description: 'Manage subscriptions', section: 'Business', icon: 'CreditCard', requiresAuth: true, isAdmin: false },
    { title: 'Support Hub', path: '/support', description: 'Get help and chat', section: 'Platform', icon: 'LifeBuoy', requiresAuth: true, isAdmin: false },
    // Admin Pages
    { title: 'Production', path: '/admin/production', description: 'Kanban view for editors', section: 'Main', icon: 'Factory', requiresAuth: true, isAdmin: true },
    { title: 'Customers', path: '/admin/customers', description: 'CRM and Lead management', section: 'Main', icon: 'Users', requiresAuth: true, isAdmin: true },
    { title: 'Finance', path: '/admin/finance', description: 'P&L and Invoices', section: 'Business', icon: 'TrendingUp', requiresAuth: true, isAdmin: true },
    { title: 'Platform Settings', path: '/admin/settings', description: 'Global configuration', section: 'Platform', icon: 'Settings', requiresAuth: true, isAdmin: true },
  ];

  for (const page of pages) {
    await prisma.platformPage.upsert({
      where: { path: page.path },
      update: page,
      create: { 
        ...page, 
        howToAccess: '[]', 
        keyActions: '[]', 
        relatedPages: '[]' 
      }
    });
  }

  // 4. Seed Policies (Rules for AI)
  const policies = [
    { 
      key: 'PRICING_MATRIX', 
      label: 'Pricing Matrix', 
      content: JSON.stringify({
        "Background Removal": {
          "tiers": { "S": "Simple", "M": "Medium", "A": "Advanced", "C": "Complex" },
          "prices": {
            "S": { "12h": 0.51, "24h": 0.39, "48h": 0.35, "72h": 0.33, "7d": 0.31 },
            "M": { "12h": 1.01, "24h": 0.78, "48h": 0.70, "72h": 0.66, "7d": 0.62 },
            "A": { "12h": 1.62, "24h": 1.25, "48h": 1.12, "72h": 1.06, "7d": 1.00 },
            "C": { "12h": 3.24, "24h": 2.50, "48h": 2.25, "72h": 2.12, "7d": 2.00 }
          }
        },
        "Clipping Path": {
          "tiers": { "S": "Simple", "M": "Medium", "A": "Advanced", "C": "Complex", "SC": "Super Complex" },
          "prices": {
            "S": { "12h": 0.51, "24h": 0.39, "48h": 0.35, "72h": 0.33, "7d": 0.31 },
            "M": { "12h": 0.66, "24h": 0.51, "48h": 0.46, "72h": 0.43, "7d": 0.41 },
            "A": { "12h": 1.22, "24h": 0.99, "48h": 0.89, "72h": 0.84, "7d": 0.79 },
            "C": { "12h": 1.71, "24h": 1.90, "48h": 1.71, "72h": 1.62, "7d": 1.52 },
            "SC": { "12h": 3.84, "24h": 2.99, "48h": 2.69, "72h": 2.54, "7d": 2.39 }
          }
        },
        "Multi-Clipping Path": {
          "tiers": { "S": "Simple", "M": "Medium", "A": "Advanced", "C": "Complex", "SC": "Super Complex" },
          "prices": {
            "S": { "12h": 1.17, "24h": 0.90, "48h": 0.81, "72h": 0.77, "7d": 0.72 },
            "M": { "12h": 2.16, "24h": 1.67, "48h": 1.50, "72h": 1.42, "7d": 1.33 },
            "A": { "12h": 2.93, "24h": 2.25, "48h": 2.03, "72h": 1.91, "7d": 1.80 },
            "C": { "12h": 4.98, "24h": 3.83, "48h": 3.45, "72h": 3.26, "7d": 3.06 },
            "SC": { "12h": 6.73, "24h": 5.18, "48h": 4.66, "72h": 4.40, "7d": 4.14 }
          }
        },
        "Color Correction": {
          "tiers": { "Single": "Single", "Multiple": "Multiple" },
          "prices": {
            "Single": { "12h": 0.46, "24h": 0.35, "48h": 0.32, "72h": 0.30, "7d": 0.28 },
            "Multiple": { "12h": 1.04, "24h": 0.80, "48h": 0.72, "72h": 0.68, "7d": 0.64 }
          }
        },
        "Color Change": {
          "tiers": { "Single": "Single", "Multiple": "Multiple" },
          "prices": {
            "Single": { "12h": 0.39, "24h": 0.30, "48h": 0.27, "72h": 0.26, "7d": 0.24 },
            "Multiple": { "12h": 0.91, "24h": 0.70, "48h": 0.63, "72h": 0.60, "7d": 0.56 }
          }
        },
        "Pattern Change": {
          "tiers": { "Single": "Single", "Multicolor": "Multicolor", "Multiple": "Multiple" },
          "prices": {
            "Single": { "12h": 1.63, "24h": 1.25, "48h": 1.13, "72h": 1.06, "7d": 1.00 },
            "Multicolor": { "12h": 0.50, "24h": 0.50, "48h": 0.50, "72h": 0.50, "7d": 0.50 },
            "Multiple": { "12h": 3.64, "24h": 2.80, "48h": 2.52, "72h": 2.38, "7d": 2.24 }
          }
        },
        "Shadow Creation": {
          "tiers": { "S": "Simple", "M": "Medium", "C": "Complex" },
          "prices": {
            "S": { "12h": 0.46, "24h": 0.35, "48h": 0.32, "72h": 0.30, "7d": 0.28 },
            "M": { "12h": 0.77, "24h": 0.59, "48h": 0.53, "72h": 0.50, "7d": 0.47 },
            "C": { "12h": 1.29, "24h": 0.99, "48h": 0.89, "72h": 0.84, "7d": 0.79 }
          }
        },
        "Manipulation": {
          "tiers": { "S": "Simple", "C": "Complex" },
          "prices": {
            "S": { "12h": 5.19, "24h": 3.99, "48h": 3.59, "72h": 3.39, "7d": 3.19 },
            "C": { "12h": 11.69, "24h": 8.99, "48h": 8.09, "72h": 7.64, "7d": 7.19 }
          }
        },
        "Retouching": {
          "tiers": { "Basic": "Basic", "Advanced": "Advanced", "High-end/Editorial": "High-end/Editorial" },
          "prices": {
            "Basic": { "12h": 0.72, "24h": 0.55, "48h": 0.50, "72h": 0.47, "7d": 0.44 },
            "Advanced": { "12h": 2.59, "24h": 1.99, "48h": 1.79, "72h": 1.69, "7d": 1.59 },
            "High-end/Editorial": { "12h": 5.20, "24h": 4.00, "48h": 3.60, "72h": 3.40, "7d": 3.20 }
          }
        },
        "Jewelry Retouch": {
          "tiers": { "Basic": "Basic", "Advanced": "Advanced", "High-end/Editorial": "High-end/Editorial" },
          "prices": {
            "Basic": { "12h": 1.04, "24h": 0.80, "48h": 0.72, "72h": 0.68, "7d": 0.64 },
            "Advanced": { "12h": 2.59, "24h": 1.99, "48h": 1.79, "72h": 1.69, "7d": 1.59 },
            "High-end/Editorial": { "12h": 6.50, "24h": 5.00, "48h": 4.50, "72h": 4.25, "7d": 4.00 }
          }
        },
        "Garment Retouch": {
          "tiers": { "S": "Simple", "M": "Medium", "C": "Complex" },
          "prices": {
            "S": { "12h": 0.72, "24h": 0.55, "48h": 0.50, "72h": 0.47, "7d": 0.44 },
            "M": { "12h": 1.29, "24h": 0.99, "48h": 0.89, "72h": 0.84, "7d": 0.79 },
            "C": { "12h": 2.59, "24h": 1.99, "48h": 1.79, "72h": 1.69, "7d": 1.59 }
          }
        },
        "Model Retouch": {
          "tiers": { "S": "Simple", "M": "Medium", "C": "Complex" },
          "prices": {
            "S": { "12h": 1.56, "24h": 1.20, "48h": 1.08, "72h": 1.02, "7d": 0.96 },
            "M": { "12h": 2.86, "24h": 2.20, "48h": 1.98, "72h": 1.87, "7d": 1.76 },
            "C": { "12h": 4.67, "24h": 3.59, "48h": 3.23, "72h": 3.05, "7d": 2.87 }
          }
        },
        "Ghost Mannequin": {
          "tiers": { "S": "Simple", "M": "Medium", "C": "Complex" },
          "prices": {
            "S": { "12h": 1.11, "24h": 0.85, "48h": 0.77, "72h": 0.72, "7d": 0.68 },
            "M": { "12h": 2.46, "24h": 1.89, "48h": 1.70, "72h": 1.61, "7d": 1.51 },
            "C": { "12h": 5.19, "24h": 3.99, "48h": 3.59, "72h": 3.39, "7d": 3.19 }
          }
        }
      })
    },
    { key: 'SERVICE_SPECS', label: 'Service Specifications', content: JSON.stringify(
        SERVICES.reduce((acc: any, s) => {
          acc[s.id] = { name: s.name, description: s.description, basePrice: s.price };
          return acc;
        }, {})
      )
    },
    { key: 'REVISION_POLICY', label: 'Revision Policy', content: JSON.stringify({
        freeCount: 1,
        resolvedWithin: 'Turnaround Window',
        method: 'Annotation tool'
      })
    },
    { key: 'FILE_SPECS', label: 'File Specifications', content: JSON.stringify({
        accepted: ['JPG', 'PNG', 'TIFF', 'PSD'],
        maxSize: '50MB',
        maxBatch: 100
      })
    },
    { key: 'PLATFORM_NAVIGATION', label: 'Platform Navigation Map', content: JSON.stringify({
        routes: [
          { intent: "Pricing & Costs", keywords: ["price", "cost", "pricing"], path: "/pricing" },
          { intent: "Exploring Services", keywords: ["service", "all", "list", "browse"], path: "/services" },
          { intent: "Quotes & Consultations", keywords: ["quote", "estimate", "book", "meeting", "call", "schedule"], path: "/book-meeting" },
          { intent: "Free Trials", keywords: ["free", "trial"], path: "/free-trial" },
          { intent: "Placing a New Order", keywords: ["order", "job", "new edit", "place"], path: "/jobs/new/upload" },
          { intent: "Managing Active Jobs", keywords: ["dashboard", "jobs"], path: "/dashboard" },
          { intent: "Authentication - Signup", keywords: ["sign up", "register", "create account"], path: "/signup" },
          { intent: "Authentication - Login", keywords: ["log in", "login", "sign in"], path: "/login" },
          { intent: "Support & FAQs", keywords: ["faq", "question", "insight"], path: "/blog" },
          { intent: "Company Info", keywords: ["about"], path: "/about" },
          { intent: "Account Settings", keywords: [], path: "/account" },
          { intent: "Home", keywords: [], path: "/" }
        ]
      })
    }
  ];

  for (const policy of policies) {
    await prisma.platformPolicy.upsert({
      where: { key: policy.key },
      update: { content: policy.content, label: policy.label },
      create: { ...policy }
    });
  }

  // 4.5 Seed User Flows (Platform Knowledge)
  const userFlows = [
    { flowId: 'pre-sales-faq', name: 'Pre-Sales & FAQ Chat Flow', steps: JSON.stringify(['Customer Inquiry', 'AI Response', 'Navigation Prompt']), entryPoints: JSON.stringify(['Homepage', 'Pricing Page', 'Services Page']) },
    { flowId: 'automated-order-taking', name: 'Automated Order-Taking & Instant Quote Flow', steps: JSON.stringify(['Intake', 'Complexity & Volume', 'Turnaround', 'Instant Quote', 'Handoff']), entryPoints: JSON.stringify(['Chat', 'Services Page']) },
    { flowId: 'free-trial-onboarding', name: 'The "Free Trial" Onboarding Flow', steps: JSON.stringify(['Initiation', 'Submission', 'Fulfillment']), entryPoints: JSON.stringify(['Homepage', 'Pricing Page']) },
    { flowId: 'self-serve-dashboard', name: 'Self-Serve Dashboard Order Flow', steps: JSON.stringify(['Upload', 'Select Services', 'Review', 'Submit']), entryPoints: JSON.stringify(['Dashboard']) },
    { flowId: 'enterprise-custom-quote', name: 'Enterprise & Custom Quote Flow', steps: JSON.stringify(['Request', 'Admin Review', 'Delivery & Conversion']), entryPoints: JSON.stringify(['Contact Page', 'Pricing Page']) },
    { flowId: 'post-delivery-revision', name: 'Post-Delivery & Revision Flow', steps: JSON.stringify(['Review First', 'Approval & Payment', 'Revisions']), entryPoints: JSON.stringify(['Gallery', 'Email Link']) },
    { flowId: 'support-human-escalation', name: 'Support & Human Escalation Flow', steps: JSON.stringify(['AI Escalation', 'Support Ticketing', 'Admin Resolution']), entryPoints: JSON.stringify(['Chat', 'Dashboard']) },
    { flowId: 'technical-consultation', name: 'Technical Consultation Flow (Book a Meeting)', steps: JSON.stringify(['Initiation', 'Intake', 'Scheduling & Walkthrough']), entryPoints: JSON.stringify(['Chat', 'Meeting CTA']) },
    { flowId: 'legal-security-handoff', name: 'Legal & Security Handoff Flow (NDAs & DPAs)', steps: JSON.stringify(['Initiation', 'Execution', 'Clearance']), entryPoints: JSON.stringify(['Admin Panel', 'Secure Portal']) },
    { flowId: 'system-integration-automation', name: 'System Integration & Automation Flow', steps: JSON.stringify(['Workspace Connection', 'E-commerce Sync', 'API & Webhooks']), entryPoints: JSON.stringify(['Dashboard Settings', 'Developer Portal']) },
    { flowId: 'custom-brand-blueprint', name: 'Custom Brand Blueprint Flow (Style Guides)', steps: JSON.stringify(['Setup', 'Execution']), entryPoints: JSON.stringify(['Brand Guidelines Section']) },
    { flowId: 'one-click-reorder', name: '1-Click Reorder & Asset Retrieval Flow', steps: JSON.stringify(['Order History', 'Reorder', 'Asset Library']), entryPoints: JSON.stringify(['Dashboard']) },
    { flowId: 'partnership-referral', name: 'Partnership & Referral Flow', steps: JSON.stringify(['Affiliate / White-Label', 'Tracking', 'Payouts']), entryPoints: JSON.stringify(['Partner Portal']) },
    { flowId: 'quality-nps-feedback', name: 'Quality & NPS Feedback Flow', steps: JSON.stringify(['NPS Prompt', 'Categorization']), entryPoints: JSON.stringify(['Post-Job Modal', 'Email']) },
    { flowId: 'billing-invoicing', name: 'Billing & Invoicing Flow', steps: JSON.stringify(['Invoice Generation', 'Payment']), entryPoints: JSON.stringify(['Billing Dashboard', 'Email']) },
    { flowId: 'intent-wayfinding', name: 'Intent-Based Navigation & Wayfinding Flow', steps: JSON.stringify(['Customer Inquiry', 'AI Routing', 'Resolution']), entryPoints: JSON.stringify(['Chat']) },
    { flowId: 'system-degradation-fallback', name: 'System Degradation & Fallback Flow', steps: JSON.stringify(['Customer Request', 'System Issue', 'Fallback Response']), entryPoints: JSON.stringify(['Chat']) },
    { flowId: 'watchlist-vip-engagement', name: 'Watchlist & VIP Engagement Flow', steps: JSON.stringify(['Customer Activity', 'System Alert', 'Admin Action']), entryPoints: JSON.stringify(['Chat', 'Dashboard']) },
    { flowId: 'outbound-marketing-reactivation', name: 'Outbound Marketing & Reactivation Flow', steps: JSON.stringify(['Initiation', 'Customer Reply', 'Conversion']), entryPoints: JSON.stringify(['Email', 'SMS', 'Chat']) },
    { flowId: 'sla-breach-escalation', name: 'SLA Breach & Priority Escalation Flow', steps: JSON.stringify(['System Trigger', 'Customer Inquiry', 'Priority Response']), entryPoints: JSON.stringify(['Chat', 'Kanban Board']) },
    { flowId: 'internal-team-production', name: 'Internal Team & Production Chat Flow', steps: JSON.stringify(['Editor to Admin', 'QC to Editor']), entryPoints: JSON.stringify(['Internal Hub', 'Kanban Board']) }
  ];

  for (const flow of userFlows) {
    await prisma.userFlow.upsert({
      where: { flowId: flow.flowId },
      update: flow,
      create: flow
    });
  }

  // 6. Seed Sample Customers
  const customer1 = await prisma.customer.upsert({
    where: { email: 'contact@urbangear.com' },
    update: {},
    create: {
      name: 'John Urban',
      email: 'contact@urbangear.com',
      companyName: 'Urban Gear',
      contactEmail: 'contact@urbangear.com',
      status: 'active',
      tenantId: 'ug-123'
    }
  });

  const customer2 = await prisma.customer.upsert({
    where: { email: 'info@luxjewel.com' },
    update: {},
    create: {
      name: 'Sarah Lux',
      email: 'info@luxjewel.com',
      companyName: 'LuxJewel',
      contactEmail: 'info@luxjewel.com',
      status: 'active',
      tenantId: 'lj-456'
    }
  });

  // 7. Seed Sample Editors
  const editor1 = await prisma.editor.upsert({
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
      qualityScore: 98.5
    }
  });

  await prisma.editor.upsert({
    where: { email: 'sam@reframe.com' },
    update: {},
    create: {
      firstName: 'Sam',
      lastName: 'Retoucher',
      email: 'sam@reframe.com',
      status: 'online',
      tier: 'mid',
      capacity: 40,
      currentLoad: 25,
      qualityScore: 92.0
    }
  });

  // 8. Seed Sample Orders
  await prisma.order.upsert({
    where: { code: 'ORD-2845' },
    update: {},
    create: {
      code: 'ORD-2845',
      tenantId: 'reframe-primary',
      customerId: customer1.id,
      title: 'Spring Collection Retouch',
      status: 'new_review',
      priority: 'high',
      volume: 40,
      totalPrice: 120.00,
      expectedCompletion: new Date(Date.now() + 4 * 60 * 60 * 1000),
      createdAt: new Date()
    }
  });

  await prisma.order.upsert({
    where: { code: 'ORD-2842' },
    update: {},
    create: {
      code: 'ORD-2842',
      tenantId: 'reframe-primary',
      customerId: customer1.id,
      title: 'Hoodie Ghost Mannequin',
      status: 'in_progress',
      priority: 'medium',
      volume: 30,
      totalPrice: 90.00,
      assignedEditorId: editor1.id,
      expectedCompletion: new Date(Date.now() + 2 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      startedAt: new Date(Date.now() - 23 * 60 * 60 * 1000)
    }
  });

  await prisma.order.upsert({
    where: { code: 'ORD-2839' },
    update: {},
    create: {
      code: 'ORD-2839',
      tenantId: 'reframe-primary',
      customerId: customer2.id,
      title: 'High-End Jewelry Set',
      status: 'ready_qc',
      priority: 'urgent',
      volume: 50,
      totalPrice: 250.00,
      expectedCompletion: new Date(Date.now() - 1 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
      submittedQCAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
    }
  });

  // 9. Seed Sample Alerts
  await prisma.alert.createMany({
    data: [
      {
        title: 'SLA Breach Warning',
        message: 'Order ORD-2839 is 1 hour overdue for QC.',
        severity: 'high',
        alertType: 'warning',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      },
      {
        title: 'New Order Received',
        message: 'Urban Gear submitted a new batch of 40 images.',
        severity: 'medium',
        alertType: 'info',
        createdAt: new Date(Date.now() - 30 * 60 * 1000),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    ]
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
