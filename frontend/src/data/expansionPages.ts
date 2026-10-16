export type ExpansionPage = {
  slug: string;
  path: string;
  title: string;
  description: string;
  h1: string;
  intro: string;
  bullets: string[];
  faq: Array<{ q: string; a: string }>;
  ctaLabel: string;
};

export const INDUSTRY_PAGES: ExpansionPage[] = [
  {
    slug: 'amazon-product-image-editing',
    path: '/amazon-product-image-editing',
    title: 'Amazon Listing Image Compliance & Editing Service | Reframe Visuals',
    description: 'Amazon listing image editing focused on white-background compliance, main-image QA, and conversion-safe retouching for large SKU catalogs.',
    h1: 'Amazon Listing Image Editing & Compliance',
    intro: 'Ship Amazon-compliant listings faster with production-grade cutouts, retouching, and QC.',
    bullets: ['Pure white background compliance', 'Batch consistency across variants', 'Fast turnaround for catalog updates'],
    faq: [
      { q: 'Do you follow Amazon image rules?', a: 'Yes. We deliver marketplace-ready assets aligned to common Amazon listing requirements and visual consistency standards.' },
      { q: 'Can you process large SKU batches?', a: 'Yes. We support high-volume workflows with SLA-backed delivery windows and revision handling.' },
    ],
    ctaLabel: 'Start Amazon-ready free trial',
  },
  {
    slug: 'shopify-product-photo-editing',
    path: '/shopify-product-photo-editing',
    title: 'Shopify Product Photo Editing Service | Reframe Visuals',
    description: 'Shopify product photo editing for stronger PDP conversion, variant consistency, and theme-ready visual systems. Starting at $0.39/image with 24h turnaround.',
    h1: 'Shopify Product Photo Editing Service',
    intro: 'Create conversion-ready Shopify product visuals with clean background removal, consistent style, and variant-ready exports tuned to your theme.',
    bullets: ['Theme-consistent visual output', 'Variant-ready exports for all SKUs', 'Turnaround tuned for Shopify launch cadence'],
    faq: [
      { q: 'Can you edit Shopify product images by collection or campaign?', a: 'Yes. We process Shopify images by collection, campaign, or launch window with consistent editing guidelines applied across all variants.' },
      { q: 'Do you support recurring Shopify catalog refreshes?', a: 'Yes. We support recurring edits for promotions, seasonal Shopify updates, and new product drops with SLA-backed turnaround.' },
    ],
    ctaLabel: 'Start Shopify free trial',
  },
  {
    slug: 'woocommerce-product-image-editing',
    path: '/woocommerce-product-image-editing',
    title: 'WooCommerce Catalog Image Editing Workflow | Reframe Visuals',
    description: 'WooCommerce product image editing built for catalog operations, consistent thumbnails, and scalable update cycles.',
    h1: 'WooCommerce Catalog Product Image Editing',
    intro: 'Keep WooCommerce catalogs visually consistent while moving quickly on new products and promotions.',
    bullets: ['Storefront-ready image sets', 'Consistent style across categories', 'Flexible batch processing'],
    faq: [
      { q: 'Can you match our existing product style?', a: 'Yes. We build to your brand guidelines and reference outputs to keep storefront consistency.' },
      { q: 'Do you support mixed service requests?', a: 'Yes. We combine clipping, retouching, and color corrections in one workflow.' },
    ],
    ctaLabel: 'Book WooCommerce workflow call',
  },
  {
    slug: 'fashion-photo-retouching-service',
    path: '/fashion-photo-retouching-service',
    title: 'Fashion Photo Retouching Service | Reframe Visuals',
    description: 'Fashion-focused photo retouching for apparel brands requiring texture-safe skin cleanup, color consistency, and fast campaign support.',
    h1: 'Fashion Photo Retouching Service',
    intro: 'Apparel retouching that preserves fabric texture, corrects color, and ships on your launch schedule.',
    bullets: ['Texture-preserving retouching', 'Color consistency across collections', 'Ghost mannequin and shape correction'],
    faq: [
      { q: 'Do you preserve fabric texture?', a: 'Yes. Our workflow prioritizes natural texture and realistic garment representation.' },
      { q: 'Can you support lookbook and PDP outputs together?', a: 'Yes. We adapt outputs for both commerce and campaign use cases.' },
    ],
    ctaLabel: 'Start fashion free trial',
  },
  {
    slug: 'jewelry-photo-retouching-service',
    path: '/jewelry-photo-retouching-service',
    title: 'Jewelry Photo Retouching Service | Reframe Visuals',
    description: 'Jewelry retouching service for sparkle control, dust cleanup, metal tone consistency, and premium marketplace presentation.',
    h1: 'Jewelry Photo Retouching Service',
    intro: 'Precision retouching for gemstones and metals with clean highlights and premium detail handling.',
    bullets: ['Dust and scratch cleanup', 'Metal and stone color balancing', 'High-detail zoom-ready output'],
    faq: [
      { q: 'Can you improve shine without fake-looking output?', a: 'Yes. We balance highlights to keep products premium while staying realistic.' },
      { q: 'Do you support macro-detail correction?', a: 'Yes. We handle micro-defects and fine-detail cleanup for close-up product views.' },
    ],
    ctaLabel: 'Get jewelry editing sample',
  },
  {
    slug: 'furniture-photo-editing-service',
    path: '/furniture-photo-editing-service',
    title: 'Furniture Photo Editing Service | Reframe Visuals',
    description: 'Furniture photo editing for perspective cleanup, color balancing, and catalog consistency across large product lines.',
    h1: 'Furniture Photo Editing Service',
    intro: 'Clean up perspective, replace backgrounds, and standardize shadows across large furniture SKU catalogs.',
    bullets: ['Perspective and alignment cleanup', 'Background replacement options', 'Batch editing for SKU-heavy catalogs'],
    faq: [
      { q: 'Can you keep dimensions visually accurate?', a: 'Yes. We preserve realistic proportions while improving presentation quality.' },
      { q: 'Do you support lifestyle and white background versions?', a: 'Yes. We can deliver multiple output variants per product.' },
    ],
    ctaLabel: 'Request furniture quote',
  },
];

export const GEO_PAGES: ExpansionPage[] = [
  { slug: 'us-photo-editing-service', path: '/us-photo-editing-service', title: 'US Ecommerce Photo Editing Service | Reframe Visuals', description: 'Photo editing service for US ecommerce teams needing reliable overnight turnaround and scalable QA workflows.', h1: 'US Ecommerce Photo Editing Service', intro: 'Built for US brands that need speed, quality control, and predictable output at scale.', bullets: ['Timezone-aligned communication', 'Launch-cycle friendly turnaround', 'Scalable quality control process'], faq: [{ q: 'Do you support US retail peaks?', a: 'Yes. We support peak-season surges and campaign-driven production cycles.' }, { q: 'Can we start with a pilot batch?', a: 'Yes. Most teams start with a controlled trial before scaling volume.' }], ctaLabel: 'Start US pilot batch' },
  { slug: 'uk-photo-editing-service', path: '/uk-photo-editing-service', title: 'UK Ecommerce Photo Editing Service | Reframe Visuals', description: 'UK-focused ecommerce photo editing for catalog consistency, rapid turnaround, and conversion-ready product presentation.', h1: 'UK Ecommerce Photo Editing Service', intro: 'Support UK ecommerce growth with reliable image production and consistent QA standards.', bullets: ['Retail-ready editing standards', 'Consistent output across categories', 'Flexible turnaround windows'], faq: [{ q: 'Can you follow UK marketplace image norms?', a: 'Yes. We align output for major UK ecommerce and marketplace requirements.' }, { q: 'Do you support recurring weekly volume?', a: 'Yes. We support recurring production cycles with SLA targets.' }], ctaLabel: 'Book UK onboarding call' },
  { slug: 'canada-photo-editing-service', path: '/canada-photo-editing-service', title: 'Canada Ecommerce Photo Editing Service | Reframe Visuals', description: 'Product photo editing for Canadian ecommerce teams needing fast, consistent, and scalable visual production support.', h1: 'Canada Ecommerce Photo Editing Service', intro: 'A reliable photo editing partner for Canadian brands scaling product catalogs.', bullets: ['Consistent cross-category quality', 'Fast turnaround for product launches', 'Support for multi-brand catalogs'], faq: [{ q: 'Do you handle bilingual packaging imagery?', a: 'Yes. We can preserve label clarity and packaging details for region-specific assets.' }, { q: 'Is there a minimum monthly volume?', a: 'No strict minimum. We support both pilot and scale stages.' }], ctaLabel: 'Start Canada free trial' },
  { slug: 'australia-photo-editing-service', path: '/australia-photo-editing-service', title: 'Australia Ecommerce Photo Editing Service | Reframe Visuals', description: 'Australia-focused ecommerce image editing with quality-first execution and turnaround plans for growing product catalogs.', h1: 'Australia Ecommerce Photo Editing Service', intro: 'Grow Australian ecommerce catalogs with predictable editing quality and efficient delivery cycles.', bullets: ['Campaign and catalog support', 'Consistent retouching standards', 'Fast turnaround options'], faq: [{ q: 'Can you support AU marketplace workflows?', a: 'Yes. We tailor outputs for marketplace and DTC catalog requirements.' }, { q: 'Do you support urgent launch timelines?', a: 'Yes. Rush handling is available for time-sensitive launches.' }], ctaLabel: 'Request AU quote' },
  { slug: 'uae-photo-editing-service', path: '/uae-photo-editing-service', title: 'UAE Ecommerce Photo Editing Service | Reframe Visuals', description: 'UAE ecommerce photo editing services for premium product presentation, quick turnarounds, and consistent QC.', h1: 'UAE Ecommerce Photo Editing Service', intro: 'Deliver premium visual quality for UAE ecommerce and luxury-focused product catalogs.', bullets: ['Premium retouching workflows', 'Consistent color and finish', 'Scalable delivery model'], faq: [{ q: 'Can you support luxury product retouching?', a: 'Yes. We handle detail-sensitive categories with premium visual standards.' }, { q: 'Do you manage high-volume SKU drops?', a: 'Yes. Our process is built for batch operations and launch windows.' }], ctaLabel: 'Start UAE pilot' },
  { slug: 'singapore-photo-editing-service', path: '/singapore-photo-editing-service', title: 'Singapore Ecommerce Photo Editing Service | Reframe Visuals', description: 'Singapore ecommerce image editing with fast delivery, high visual consistency, and production-ready output.', h1: 'Singapore Ecommerce Photo Editing Service', intro: 'Support Singapore ecommerce growth with reliable editing speed and quality assurance.', bullets: ['Consistent PDP image quality', 'Flexible SLA options', 'Workflow-ready batch handling'], faq: [{ q: 'Can you support omnichannel catalogs?', a: 'Yes. We deliver assets suitable for web, marketplace, and campaign channels.' }, { q: 'Do you offer a trial before scale?', a: 'Yes. We recommend a free trial or pilot batch before full rollout.' }], ctaLabel: 'Start Singapore trial' },
];

export const CASE_STUDIES = [
  'amazon-accessories-sku-cleanup','fashion-drop-48-hour-turnaround','jewelry-retouching-conversion-lift','furniture-catalog-standardization','marketplace-compliance-recovery','shopify-seasonal-launch-sprint','ghost-mannequin-scale-program','multi-brand-color-consistency'
].map((slug, i) => ({
  slug,
  path: `/case-studies/${slug}`,
  title: `Case Study: ${slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())} | Reframe Visuals`,
  h1: `Case Study: ${slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}`,
  description: 'Real ecommerce production workflow showing turnaround, quality controls, and measurable visual consistency outcomes.',
  outcome: i % 2 === 0 ? 'Reduced revision cycles by 34% while improving listing consistency.' : 'Cut production turnaround by 41% for launch-critical product batches.',
}));

export const INSIGHT_ARTICLES = [
  'amazon-image-compliance-checklist-2026',
  'shopify-product-photography-conversion-playbook',
  'ghost-mannequin-vs-flat-lay-when-to-use-each',
  'how-to-scale-photo-editing-for-10000-skus',
  'jewelry-retouching-quality-checklist',
  'ecommerce-image-sla-framework-for-growth-teams',
  'best-ecommerce-photo-editing-services-shopify-brands',
  'ghost-mannequin-editing-cost-guide',
  'background-removal-service-pricing-guide',
  'how-to-prepare-product-photos-for-amazon',
  'jewelry-retouching-checklist-for-ecommerce',
  'clipping-path-vs-background-removal',
  'in-house-vs-outsourced-product-photo-editing',
].map((slug) => ({
  slug,
  path: `/resources/${slug}`,
  title: `${slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())} | Reframe Visuals`,
  h1: slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
  description: 'Practical ecommerce image production guide from Reframe Visuals focused on quality, speed, and conversion outcomes.',
}));
