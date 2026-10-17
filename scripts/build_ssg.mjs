import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.resolve(__dirname, '..');
const DIST_DIR = path.join(ROOT_DIR, 'frontend', 'dist');
const SSR_BUNDLE_PATH = path.join(ROOT_DIR, 'frontend', 'dist-ssr', 'entry-server.js');
const INDEX_HTML_PATH = path.join(DIST_DIR, 'index.html');
const CSR_SHELL_PATH = path.join(DIST_DIR, 'index.csr.html');

console.log('🚀 Starting Static Site Generation (SSG)...');
console.log('Dist directory:', DIST_DIR);

if (!fs.existsSync(INDEX_HTML_PATH)) {
  console.error('❌ dist/index.html not found! Run "vite build" first.');
  process.exit(1);
}

if (!fs.existsSync(SSR_BUNDLE_PATH)) {
  console.error('❌ dist-ssr/entry-server.js not found! Run "vite build --ssr" first.');
  process.exit(1);
}

// 1. Read base HTML template and save a clean CSR copy
const baseTemplate = fs.readFileSync(INDEX_HTML_PATH, 'utf8');
if (!fs.existsSync(CSR_SHELL_PATH)) {
  fs.writeFileSync(CSR_SHELL_PATH, baseTemplate, 'utf8');
  console.log(`✅ Saved clean CSR shell to: ${CSR_SHELL_PATH}`);
}

// 2. Load the SSR renderer module
const ssrModule = await import(`file://${SSR_BUNDLE_PATH.replace(/\\/g, '/')}`);
const render = ssrModule.render;
if (typeof render !== 'function') {
  console.error('❌ SSR bundle does not export a render function.');
  process.exit(1);
}

// 3. Compile the complete list of public routes
const CORE_ROUTES = [
  '/',
  '/services',
  '/pricing',
  '/about',
  '/portfolio',
  '/testimonials',
  '/contact',
  '/free-trial',
  '/start',
  '/pilot-batch',
  '/book-meeting',
  '/quote-builder',
  '/ai-product-visuals',
  '/case-studies',
  '/resources',
  '/quality-assurance-process',
  '/turnaround-sla',
  '/who-is-reframe-visuals',
  '/reframe-visuals-brand-facts',
  '/free-sample-edit',
  '/reframe-visuals-pricing',
  '/reframe-visuals-reviews',
  '/reframe-visuals-for-shopify-brands',
  '/reframe-visuals-for-amazon-sellers',
  '/about-reframe-visuals',
  '/reframe-visuals-services',
  '/order/dedicated',
  '/pixelz-alternative',
  '/clipping-path-india-alternative',
  '/cutoutwiz-alternative',
  '/privacy',
  '/terms',
  '/cookies',
  '/security',
  '/how-it-works',
  '/platform',
  '/design-system',
];

const EXPANSION_ROUTES = [
  '/amazon-product-image-editing',
  '/shopify-product-photo-editing',
  '/woocommerce-product-image-editing',
  '/fashion-photo-retouching-service',
  '/jewelry-photo-retouching-service',
  '/furniture-photo-editing-service',
  '/us-photo-editing-service',
  '/uk-photo-editing-service',
  '/canada-photo-editing-service',
  '/australia-photo-editing-service',
  '/uae-photo-editing-service',
  '/singapore-photo-editing-service',
];

const SERVICE_SLUGS = [
  'background-removal',
  'clipping-path',
  'multi-clipping-path',
  'color-correction',
  'color-change',
  'ghost-mannequin',
  'shadow-creation',
  'retouching',
  'jewelry-retouch',
  'garment-retouch',
  'model-retouch',
  'raster-to-vector',
  'manipulation',
  'pattern-change',
  'ai-product-photography',
];

const SERVICE_ROUTES = [
  ...SERVICE_SLUGS.map((slug) => `/services/${slug}`),
  '/services/background-removal/best-for-ecommerce',
  '/services/background-removal/pricing-guide',
  '/services/clipping-path/best-for-ecommerce',
  '/services/clipping-path/pricing-guide',
  '/services/ghost-mannequin/best-for-ecommerce',
  '/services/ghost-mannequin/pricing-guide',
  '/services/jewelry-retouch/best-for-ecommerce',
  '/services/retouching/best-for-ecommerce',
];

const RESOURCE_ROUTES = [
  '/resources/amazon-image-compliance-checklist-2026',
  '/resources/shopify-product-photography-conversion-playbook',
  '/resources/ghost-mannequin-vs-flat-lay-when-to-use-each',
  '/resources/how-to-scale-photo-editing-for-10000-skus',
  '/resources/jewelry-retouching-quality-checklist',
  '/resources/ecommerce-image-sla-framework-for-growth-teams',
  '/resources/best-ecommerce-photo-editing-services-shopify-brands',
  '/resources/ghost-mannequin-editing-cost-guide',
  '/resources/background-removal-service-pricing-guide',
  '/resources/how-to-prepare-product-photos-for-amazon',
  '/resources/jewelry-retouching-checklist-for-ecommerce',
  '/resources/clipping-path-vs-background-removal',
  '/resources/in-house-vs-outsourced-product-photo-editing',
];

const CASE_STUDY_ROUTES = [
  '/case-studies/amazon-accessories-sku-cleanup',
  '/case-studies/fashion-drop-48-hour-turnaround',
  '/case-studies/jewelry-retouching-conversion-lift',
  '/case-studies/furniture-catalog-standardization',
  '/case-studies/marketplace-compliance-recovery',
  '/case-studies/shopify-seasonal-launch-sprint',
  '/case-studies/ghost-mannequin-scale-program',
  '/case-studies/multi-brand-color-consistency',
];

// Extract blog slugs from insightsData.ts
const insightsDataPath = path.join(ROOT_DIR, 'frontend', 'src', 'data', 'insightsData.ts');
let blogSlugs = [];
if (fs.existsSync(insightsDataPath)) {
  const content = fs.readFileSync(insightsDataPath, 'utf8');
  const matches = [...content.matchAll(/slug:\s*'([^']+)'/g)].map((m) => m[1]);
  blogSlugs = [...new Set(matches)];
}

const BLOG_ROUTES = ['/blog', ...blogSlugs.map((slug) => `/blog/${slug}`)];

const ALL_ROUTES = [
  ...new Set([
    ...CORE_ROUTES,
    ...EXPANSION_ROUTES,
    ...SERVICE_ROUTES,
    ...RESOURCE_ROUTES,
    ...CASE_STUDY_ROUTES,
    ...BLOG_ROUTES,
  ]),
];

console.log(`📋 Total routes queued for pre-rendering: ${ALL_ROUTES.length}`);

// SEO Meta Dictionary
const SEO_META = {
  '/': {
    title: 'Ecommerce Photo Editing from $0.39/Image | Reframe Visuals',
    description: 'Outsourced ecommerce photo editing from $0.39/image. Manual Pen Tool clipping, ghost mannequin, and retouching with 12h turnaround. Try 3 images free.',
  },
  '/services': {
    title: 'Services for Ecommerce Brands | Reframe Visuals',
    description: 'Explore ecommerce photo editing services built for consistent visual quality, faster launches, and stronger conversion performance across product catalogs.',
  },
  '/pricing': {
    title: 'Pricing for Ecommerce Brands | Reframe Visuals',
    description: 'View transparent pricing for ecommerce image editing with predictable quality, quick turnaround options, and scalable support for growing SKU volume.',
  },
  '/about': {
    title: 'About Reframe Visuals | E-commerce Photo Editing Team',
    description: 'Meet the Reframe Visuals team helping e-commerce brands ship high-converting product imagery with consistent quality, transparent process, and fast turnaround.',
  },
  '/portfolio': {
    title: 'Portfolio & Testimonials | Reframe Visuals',
    description: 'Explore before-and-after ecommerce photo edits and client feedback across background removal, clipping path, retouching, and color services.',
  },
  '/testimonials': {
    title: 'Client Reviews & Testimonials | Reframe Visuals',
    description: 'Read reviews and testimonials from ecommerce brands, Amazon sellers, and agencies working with Reframe Visuals.',
  },
  '/contact': {
    title: 'Contact Reframe Visuals | Start Your Editing Workflow',
    description: 'Contact Reframe Visuals to discuss image editing requirements, turnaround times, and quality standards for your brand.',
  },
  '/free-trial': {
    title: '3 Free Sample Edits for Ecommerce Product Photos | Reframe Visuals',
    description: 'Upload up to 3 product photos and review free sample edits before ordering. Built for Amazon, apparel, jewelry, agencies, and catalog teams.',
  },
  '/pilot-batch': {
    title: 'Test Batch Review | Reframe Visuals',
    description: 'Submit a paid test batch for service-specific review, output-format preferences, and complexity-based pricing confirmation.',
  },
  '/book-meeting': {
    title: 'Book Meeting for Ecommerce Brands | Reframe Visuals',
    description: 'Book a meeting to plan your ecommerce image workflow, service mix, QA standards, and turnaround requirements with the Reframe Visuals team.',
  },
  '/quote-builder': {
    title: 'Quote Builder for Ecommerce Brands | Reframe Visuals',
    description: 'Build a custom ecommerce photo editing quote by volume, complexity, and turnaround target to get a production-ready estimate for your team.',
  },
  '/case-studies': {
    title: 'Ecommerce Photo Editing Case Studies | Reframe Visuals',
    description: 'Explore real ecommerce image editing case studies with measurable outcomes in turnaround, quality consistency, and production scale.',
  },
  '/resources': {
    title: 'Ecommerce Photo Editing Resources & Guides | Reframe Visuals',
    description: 'Explore practical ecommerce image editing resources, checklists, pricing guides, and production workflows from Reframe Visuals.',
  },
  '/quality-assurance-process': {
    title: 'Quality Assurance Process for Ecommerce Image Editing | Reframe Visuals',
    description: 'Understand the quality assurance process Reframe Visuals uses to maintain consistent ecommerce image editing output at scale.',
  },
  '/turnaround-sla': {
    title: 'Turnaround SLA for Ecommerce Image Editing | Reframe Visuals',
    description: 'Review standard and rush turnaround SLA options for ecommerce product image editing workflows, including priority queues and delivery expectations.',
  },
  '/who-is-reframe-visuals': {
    title: 'Who Is Reframe Visuals? | Ecommerce Photo Editing Studio',
    description: 'Reframe Visuals is a product photo editing and creative operations studio for ecommerce brands, Amazon sellers, agencies, and photographers.',
  },
  '/reframe-visuals-brand-facts': {
    title: 'Reframe Visuals Brand Facts | Official Entity Profile',
    description: 'Official Reframe Visuals entity facts: ecommerce photo editing studio, services, audiences, free sample edits, and contact details.',
  },
  '/free-sample-edit': {
    title: 'Free Sample Edit for Product Photos | Reframe Visuals',
    description: 'New Reframe Visuals customers can request 3 free sample product photo edits to review quality before placing a paid order.',
  },
  '/reframe-visuals-pricing': {
    title: 'Reframe Visuals Pricing | Transparent Rates from $0.39/Image',
    description: 'Detailed service pricing, volume discounts, turnaround options, and billing terms for Reframe Visuals ecommerce editing.',
  },
  '/reframe-visuals-reviews': {
    title: 'Verified Client Reviews | Reframe Visuals',
    description: 'Read authentic client reviews and case outcomes from apparel brands, jewelry sellers, and ecommerce retailers working with Reframe Visuals.',
  },
  '/reframe-visuals-for-shopify-brands': {
    title: 'Photo Editing for Shopify Brands | Reframe Visuals',
    description: 'High-converting product image editing tailored for Shopify stores, theme requirements, variant swatches, and fast collection launches.',
  },
  '/reframe-visuals-for-amazon-sellers': {
    title: 'Photo Editing for Amazon Sellers | Reframe Visuals',
    description: 'Amazon-compliant product photo editing: pure white RGB 255 background, 85%+ frame fill, high-res zoom dimensions, and secondary infographic assets.',
  },
  '/amazon-product-image-editing': {
    title: 'Amazon Product Image Editing | Reframe Visuals',
    description: 'Amazon Product Image Editing for ecommerce brands focused on listing compliance, high-resolution zoom standards, and higher CTR.',
  },
  '/shopify-product-photo-editing': {
    title: 'Shopify Product Photo Editing Service | Reframe Visuals',
    description: 'Shopify product photo editing for stronger PDP conversion, variant consistency, and theme-ready visual systems. Starting at $0.39/image.',
  },
  '/woocommerce-product-image-editing': {
    title: 'WooCommerce Product Image Editing | Reframe Visuals',
    description: 'WooCommerce Product Image Editing for ecommerce stores focused on fast catalog processing, consistent aspect ratios, and clean presentation.',
  },
  '/fashion-photo-retouching-service': {
    title: 'Fashion Photo Retouching Service | Reframe Visuals',
    description: 'Fashion and apparel photo retouching: ghost mannequin, fabric smoothing, model cleanup, and lookbook perfection with 12h-24h turnaround.',
  },
  '/jewelry-photo-retouching-service': {
    title: 'Jewelry Photo Retouching Service | Reframe Visuals',
    description: 'Specialized jewelry photo retouching: focus stacking, gemstone fire restoration, metal polish, scratch/dust removal, and 500% macro inspection.',
  },
  '/furniture-photo-editing-service': {
    title: 'Furniture Photo Editing Service | Reframe Visuals',
    description: 'Furniture photo editing for perspective alignment, clean background isolation, cast shadow creation, and bulk catalog standardization.',
  },
  '/us-photo-editing-service': {
    title: 'US Ecommerce Photo Editing Service | Reframe Visuals',
    description: 'Photo editing services for US ecommerce teams needing fast turnaround, consistent quality control, and scalable production support.',
  },
  '/uk-photo-editing-service': {
    title: 'UK Ecommerce Photo Editing Service | Reframe Visuals',
    description: 'UK-focused ecommerce image editing with consistent quality control, fast turnaround options, and dependable catalog production.',
  },
  '/canada-photo-editing-service': {
    title: 'Canada Ecommerce Photo Editing Service | Reframe Visuals',
    description: 'Scalable ecommerce photo editing support for Canadian brands, with category-specific workflows, QA checks, and dependable bulk turnaround.',
  },
  '/australia-photo-editing-service': {
    title: 'Australia Ecommerce Photo Editing Service | Reframe Visuals',
    description: 'Australia-focused ecommerce image editing with quality-first workflows, launch-ready turnaround options, and seasonal catalog support.',
  },
  '/uae-photo-editing-service': {
    title: 'UAE Ecommerce Photo Editing Service | Reframe Visuals',
    description: 'Premium ecommerce photo editing support for UAE brands needing high visual quality, predictable delivery windows, and catalog consistency.',
  },
  '/singapore-photo-editing-service': {
    title: 'Singapore Ecommerce Photo Editing Service | Reframe Visuals',
    description: 'Singapore ecommerce photo editing with fast delivery windows, consistent quality standards, and scalable production support.',
  },
  '/pixelz-alternative': {
    title: 'Pixelz Alternative | Human-Reviewed Ecommerce Photo Editing',
    description: 'Looking for a Pixelz alternative? Reframe Visuals offers manual Pen Tool editing, 12h turnaround, dual-stage QA, and 3 free sample edits.',
  },
  '/clipping-path-india-alternative': {
    title: 'Clipping Path India Alternative | Reframe Visuals',
    description: 'Compare Reframe Visuals with Clipping Path India for manual Photoshop editing, strict QA review, fast turnaround, and transparent pricing.',
  },
  '/cutoutwiz-alternative': {
    title: 'CutoutWiz Alternative | Reframe Visuals',
    description: 'Compare Reframe Visuals with CutoutWiz for ecommerce photo editing, manual QA, clipping path, retouching, and scalable catalog production.',
  },
  '/blog': {
    title: 'Ecommerce Photo Editing Blog & Practical Guides | Reframe Visuals',
    description: 'Read practical guides on ecommerce product photography, retouching quality, marketplace compliance, and conversion-focused visual strategy.',
  },
};

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function resolveRouteSeo(route) {
  if (SEO_META[route]) return SEO_META[route];

  if (route.startsWith('/services/')) {
    const parts = route.replace('/services/', '').split('/').filter(Boolean);
    const slug = parts[0];
    const intent = parts[1];
    const name = slug
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');

    if (intent === 'best-for-ecommerce') {
      return {
        title: `${name} Best for Ecommerce | Reframe Visuals`,
        description: `Learn why our ${name.toLowerCase()} service is best for ecommerce brands seeking speed, precision, and conversion-ready quality.`,
      };
    }
    if (intent === 'pricing-guide') {
      return {
        title: `${name} Pricing Guide | Reframe Visuals`,
        description: `Comprehensive pricing guide for ${name.toLowerCase()}: complexity tiers, turnaround options, and volume discount structures.`,
      };
    }
    return {
      title: `${name} Service from $0.39/Image | Reframe Visuals`,
      description: `Professional manual ${name.toLowerCase()} service with 12h turnaround, 2-stage QA review, and 3 free sample edits for online brands.`,
    };
  }

  if (route.startsWith('/resources/')) {
    const slug = route.replace('/resources/', '').split('/')[0];
    const name = slug
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
    return {
      title: `${name} | Reframe Visuals`,
      description: `Read our comprehensive guide and practical checklist on ${name.toLowerCase()} for ecommerce product photography operations.`,
    };
  }

  if (route.startsWith('/case-studies/')) {
    const slug = route.replace('/case-studies/', '').split('/')[0];
    const name = slug
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
    return {
      title: `Case Study: ${name} | Reframe Visuals`,
      description: `Explore how Reframe Visuals solved high-volume photo editing challenges for ${name.toLowerCase()} with measurable quality and speed.`,
    };
  }

  if (route.startsWith('/blog/')) {
    const slug = route.replace('/blog/', '').split('/')[0];
    const name = slug
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
    return {
      title: `${name} | Reframe Visuals Blog`,
      description: `Read ${name} and discover practical techniques, workflows, and standards for ecommerce product photography and retouching.`,
    };
  }

  const cleanName = route
    .replace(/^\//, '')
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
  return {
    title: `${cleanName} | Reframe Visuals`,
    description: 'Professional ecommerce photo editing services from $0.39/image with 12-hour turnaround and 3 free sample edits.',
  };
}

function injectSeoIntoHtml(html, { route, title, description, appHtml, is404 = false }) {
  const canonicalUrl = `https://reframevisuals.com${route === '/' ? '/' : route}`;
  const defaultOgImage =
    'https://res.cloudinary.com/dnmj4altq/image/upload/v1781548471/reframe-visuals-your-editing-partner_xzvgbl.png';

  // 1. Inject server-rendered app markup into #root
  let output = html.replace(
    /<div id="root">\s*<\/div>/,
    () => `<div id="root" data-ssr="true">${appHtml}</div>`
  );

  // 2. Remove the loading app-shell if present (no white flash or loader needed on pre-rendered HTML)
  output = output.replace(/<div id="app-shell"[\s\S]*?<\/div>\s*<\/div>/i, '');

  // 3. Head clean-up: remove existing title, meta description, robots, canonical, OG, and Twitter tags
  const headCloseIdx = output.indexOf('</head>');
  if (headCloseIdx === -1) return output;

  let head = output.slice(0, headCloseIdx);
  const rest = output.slice(headCloseIdx);

  const stripTags = [
    /<title[^>]*>[\s\S]*?<\/title>/gi,
    /<meta\s[^>]*name="description"[^>]*>/gi,
    /<meta\s[^>]*name="robots"[^>]*>/gi,
    /<link\s[^>]*rel="canonical"[^>]*>/gi,
    /<meta\s[^>]*property="og:title"[^>]*>/gi,
    /<meta\s[^>]*property="og:description"[^>]*>/gi,
    /<meta\s[^>]*property="og:type"[^>]*>/gi,
    /<meta\s[^>]*property="og:url"[^>]*>/gi,
    /<meta\s[^>]*property="og:image"[^>]*>/gi,
    /<meta\s[^>]*name="twitter:title"[^>]*>/gi,
    /<meta\s[^>]*name="twitter:description"[^>]*>/gi,
    /<meta\s[^>]*name="twitter:image"[^>]*>/gi,
    /<link\s[^>]*hreflang="[^"]*"[^>]*>/gi,
  ];

  for (const rx of stripTags) {
    head = head.replace(rx, '');
  }

  const safeTitle = escapeHtml(title);
  const safeDesc = escapeHtml(description);
  const ogType = route.startsWith('/blog/') ? 'article' : 'website';
  const robotsTag = is404
    ? '<meta name="robots" content="noindex, follow" />'
    : '<meta name="robots" content="index, follow" />';
  const canonicalTag = is404
    ? ''
    : `<link rel="canonical" href="${canonicalUrl}" data-rh="true" />`;

  const newHeadTags = `
    <title>${safeTitle}</title>
    <meta name="description" content="${safeDesc}" />
    ${robotsTag}
    ${canonicalTag}
    <meta property="og:title" content="${safeTitle}" />
    <meta property="og:description" content="${safeDesc}" />
    <meta property="og:type" content="${ogType}" />
    <meta property="og:url" content="${canonicalUrl}" />
    <meta property="og:image" content="${defaultOgImage}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${safeTitle}" />
    <meta name="twitter:description" content="${safeDesc}" />
    <meta name="twitter:image" content="${defaultOgImage}" />
    <link rel="alternate" hreflang="en" href="${canonicalUrl}" />
    <link rel="alternate" hreflang="x-default" href="${canonicalUrl}" />
  `;

  return `${head}${newHeadTags}\n${rest}`;
}

// 4. Run pre-rendering loop
let successCount = 0;
const startTime = Date.now();

for (const route of ALL_ROUTES) {
  try {
    const renderResult = await render(route, { timeoutMs: 15000 });
    const seo = resolveRouteSeo(route);
    const finalTitle = renderResult.title || seo.title;
    const finalDesc = renderResult.description || seo.description;

    const pageHtml = injectSeoIntoHtml(baseTemplate, {
      route,
      title: finalTitle,
      description: finalDesc,
      appHtml: renderResult.appHtml || '',
    });

    let targetFile;
    if (route === '/') {
      targetFile = path.join(DIST_DIR, 'index.html');
    } else {
      const cleanSubdir = route.replace(/^\//, '');
      const targetDir = path.join(DIST_DIR, cleanSubdir);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      targetFile = path.join(targetDir, 'index.html');
    }

    fs.writeFileSync(targetFile, pageHtml, 'utf8');
    successCount++;
  } catch (err) {
    console.warn(`⚠️  Failed to pre-render route "${route}":`, err.message);
  }
}

// 5. Generate static 404.html
try {
  const notFoundResult = await render('/404-not-found-page', { timeoutMs: 15000 });
  const notFoundSeo = {
    title: '404 Page Not Found | Reframe Visuals',
    description: 'The page you requested could not be found. Return to Reframe Visuals homepage.',
  };
  const notFoundHtml = injectSeoIntoHtml(baseTemplate, {
    route: '/404',
    title: notFoundSeo.title,
    description: notFoundSeo.description,
    appHtml: notFoundResult.appHtml || '',
    is404: true,
  });

  const target404 = path.join(DIST_DIR, '404.html');
  fs.writeFileSync(target404, notFoundHtml, 'utf8');
  console.log(`✅ Generated static 404 page: ${target404}`);
} catch (err) {
  console.warn('⚠️  Could not generate 404.html:', err.message);
}

const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
console.log(`\n🎉 SSG Completed: Successfully generated ${successCount} static HTML pages in ${elapsed}s!`);
