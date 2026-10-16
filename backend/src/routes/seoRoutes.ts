import { Router, Request, Response } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { SEO_SERVICES } from '../data/seoServices';
import { ACTIVE_INSIGHT_SLUGS, INSIGHT_SUMMARIES } from '../data/insightSummaries';
import { INSIGHT_LASTMOD_BY_SLUG } from '../data/insightLastmod';
import { prisma } from '../database';

const router = Router();

// Simple in-memory conversion tracking (would use database in production)
const conversionTracking = {
  trials: new Map<string, number>(),
  leads: new Map<string, number>(),
  geoLeads: new Map<string, number>(),
  industryLeads: new Map<string, number>()
};

// Track trial conversions
router.post('/track-trial', (req: Request, res: Response) => {
  const { page, source, geo, industry } = req.body;
  
  if (!page) {
    return res.status(400).json({ error: 'Page parameter required' });
  }
  
  const key = `${page}-${source}`;
  conversionTracking.trials.set(key, (conversionTracking.trials.get(key) || 0) + 1);
  
  if (geo) conversionTracking.geoLeads.set(geo, (conversionTracking.geoLeads.get(geo) || 0) + 1);
  if (industry) conversionTracking.industryLeads.set(industry, (conversionTracking.industryLeads.get(industry) || 0) + 1);
  
  res.json({ success: true });
  return res;
});

// Sum tracked trial conversions whose key starts with the given page slug
const sumTrackedTrials = (pagePrefix: string) => {
  let total = 0;
  conversionTracking.trials.forEach((count, key) => {
    if (key.startsWith(pagePrefix)) total += count;
  });
  return total;
};
const sumTrackedGeoLeads = () => {
  let total = 0;
  conversionTracking.geoLeads.forEach((count) => { total += count; });
  return total;
};
const sumTrackedIndustryLeads = () => {
  let total = 0;
  conversionTracking.industryLeads.forEach((count) => { total += count; });
  return total;
};

// Get conversion data for reporting
export function getConversionData() {
  return {
    trials: Object.fromEntries(conversionTracking.trials),
    leads: Object.fromEntries(conversionTracking.leads),
    geoLeads: Object.fromEntries(conversionTracking.geoLeads),
    industryLeads: Object.fromEntries(conversionTracking.industryLeads)
  };
}

const getBaseUrl = () => {
  const explicitCanonical = (process.env.CANONICAL_BASE_URL || '').trim();
  const rawBase = explicitCanonical || process.env.FRONTEND_URL || 'https://reframevisuals.com';
  const normalized = rawBase.replace(/\/$/, '');
  return normalized.replace('://www.', '://');
};
const xmlEscape = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

const toIsoDate = (value: string) => {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toISOString().slice(0, 10);
};

type InsightEntry = { path: string; priority: string; lastmod?: string };

const ACTIVE_INSIGHT_SLUG_SET = new Set<string>(ACTIVE_INSIGHT_SLUGS);

const insightDataPathCandidates = [
  path.resolve(process.cwd(), 'frontend/src/data/insightsData.ts'),
  path.resolve(process.cwd(), '../frontend/src/data/insightsData.ts'),
];

const readInsightsDataFile = () => {
  for (const filePath of insightDataPathCandidates) {
    try {
      if (!fs.existsSync(filePath)) continue;
      return fs.readFileSync(filePath, 'utf-8');
    } catch {
      // best-effort only
    }
  }
  return '';
};

const loadInsightSummaries = async (): Promise<Array<{ title: string; slug: string; excerpt: string; date?: string; updatedAt?: string }>> => {
  const raw = readInsightsDataFile();

  const slugRegex = /slug:\s*['"]([^'"]+)['"]/g;
  const titleRegex = /title:\s*['"]([^'"]+)['"]/g;
  const excerptRegex = /excerpt:\s*['"]([^'"]+)['"]/g;

  const slugs = raw ? [...raw.matchAll(slugRegex)].map((m) => (m[1] || '').trim()) : [];
  const titles = raw ? [...raw.matchAll(titleRegex)].map((m) => (m[1] || '').trim()) : [];
  const excerpts = raw ? [...raw.matchAll(excerptRegex)].map((m) => (m[1] || '').trim()) : [];

  const count = Math.min(slugs.length, titles.length);
  const staticRows = [] as Array<{ title: string; slug: string; excerpt: string; date?: string; updatedAt?: string }>;

  for (let i = 0; i < count; i += 1) {
    const slug = slugs[i];
    const title = titles[i];
    const excerpt = excerpts[i] || '';
    if (!slug || !title) continue;
    staticRows.push({ slug, title, excerpt });
  }

  const activeStatic = staticRows.length ? staticRows.filter((item) => ACTIVE_INSIGHT_SLUG_SET.has(item.slug)) : INSIGHT_SUMMARIES;

  // Dynamic posts query
  let dbPosts: any[] = [];
  try {
    dbPosts = await prisma.post.findMany({
      where: { status: 'published' },
      select: { slug: true, title: true, excerpt: true, publishedAt: true, updatedAt: true }
    });
  } catch (err) {
    console.error('Failed to load dynamic blog posts from DB for sitemap/LLM:', err);
  }

  const postsMap = new Map<string, { title: string; slug: string; excerpt: string; date?: string; updatedAt?: string }>();

  // Add static ones
  activeStatic.forEach((item) => {
    postsMap.set(item.slug, {
      slug: item.slug,
      title: item.title,
      excerpt: item.excerpt || '',
      date: (item as any).date || '',
      updatedAt: INSIGHT_LASTMOD_BY_SLUG[item.slug] || (item as any).updatedAt || ''
    });
  });

  // Merge database ones
  dbPosts.forEach((item) => {
    postsMap.set(item.slug, {
      slug: item.slug,
      title: item.title,
      excerpt: item.excerpt || '',
      date: item.publishedAt ? item.publishedAt.toISOString() : new Date().toISOString(),
      updatedAt: item.updatedAt ? item.updatedAt.toISOString() : undefined
    });
  });

  return Array.from(postsMap.values());
};

const loadInsightPaths = async (): Promise<InsightEntry[]> => {
  const merged = await loadInsightSummaries();
  const paths = merged
    .map((item) => ({
      path: `/blog/${item.slug}`,
      priority: '0.68',
      lastmod: toIsoDate(item.updatedAt || item.date || '') || undefined,
    }))
    .filter((item) => item.path !== '/blog/');

  return Array.from(new Map(paths.map((item) => [item.path, item])).values());
};

export async function generateSitemapXml() {
  const baseUrl = getBaseUrl();

  const staticPages = [
    { path: '', priority: '1.0' },
    { path: '/services', priority: '0.9' },
    { path: '/pricing', priority: '0.8' },
    { path: '/about', priority: '0.7' },
    { path: '/portfolio', priority: '0.75' },
    { path: '/blog', priority: '0.7' },
    { path: '/free-trial', priority: '0.8' },
    { path: '/book-meeting', priority: '0.8' },
    { path: '/quote-builder', priority: '0.8' },
    { path: '/contact', priority: '0.7' },
    { path: '/case-studies', priority: '0.78' },
    { path: '/resources', priority: '0.72' },
    { path: '/pixelz-alternative', priority: '0.82' },
    { path: '/clipping-path-india-alternative', priority: '0.82' },
    { path: '/cutoutwiz-alternative', priority: '0.82' },
    { path: '/quality-assurance-process', priority: '0.72' },
    { path: '/turnaround-sla', priority: '0.72' },
    { path: '/who-is-reframe-visuals', priority: '0.82' },
    { path: '/reframe-visuals-brand-facts', priority: '0.82' },
    { path: '/free-sample-edit', priority: '0.82' },
    { path: '/reframe-visuals-services', priority: '0.82' },
    { path: '/reframe-visuals-pricing', priority: '0.78' },
    { path: '/reframe-visuals-reviews', priority: '0.72' },
    { path: '/reframe-visuals-for-amazon-sellers', priority: '0.76' },

    { path: '/amazon-product-image-editing', priority: '0.76' },
    { path: '/woocommerce-product-image-editing', priority: '0.76' },
    { path: '/fashion-photo-retouching-service', priority: '0.76' },
    { path: '/jewelry-photo-retouching-service', priority: '0.76' },
    { path: '/furniture-photo-editing-service', priority: '0.76' },

    { path: '/us-photo-editing-service', priority: '0.74' },
    { path: '/uk-photo-editing-service', priority: '0.74' },
    { path: '/canada-photo-editing-service', priority: '0.74' },
    { path: '/australia-photo-editing-service', priority: '0.74' },
    { path: '/uae-photo-editing-service', priority: '0.74' },
    { path: '/singapore-photo-editing-service', priority: '0.74' },

    { path: '/resources/amazon-image-compliance-checklist-2026', priority: '0.66' },
    { path: '/resources/ghost-mannequin-vs-flat-lay-when-to-use-each', priority: '0.66' },
    { path: '/resources/how-to-scale-photo-editing-for-10000-skus', priority: '0.66' },
    { path: '/resources/jewelry-retouching-quality-checklist', priority: '0.66' },
    { path: '/resources/ecommerce-image-sla-framework-for-growth-teams', priority: '0.66' },
    { path: '/resources/ghost-mannequin-editing-cost-guide', priority: '0.68' },
    { path: '/resources/background-removal-service-pricing-guide', priority: '0.68' },
    { path: '/resources/how-to-prepare-product-photos-for-amazon', priority: '0.68' },
    { path: '/resources/jewelry-retouching-checklist-for-ecommerce', priority: '0.68' },
    { path: '/resources/clipping-path-vs-background-removal', priority: '0.68' },
    { path: '/resources/in-house-vs-outsourced-product-photo-editing', priority: '0.68' },

    // Case-study detail pages (/case-studies/<slug>) are intentionally NOT
    // listed: they carry noindex until each one has real client content.
  ];

  const servicePages = SEO_SERVICES.map(service => ({
    path: `/services/${service.id}`,
    priority: '0.85',
  }));
  const serviceIntentPages = SEO_SERVICES.flatMap(service => ([
    { path: `/services/${service.id}/best-for-ecommerce`, priority: '0.75' },
    { path: `/services/${service.id}/pricing-guide`, priority: '0.75' },
    { path: `/services/${service.id}/turnaround-quality`, priority: '0.75' },
  ]));
  const comparisonPages = [
    { path: '/compare/in-house-vs-outsourcing', priority: '0.7' },
    { path: '/compare/clipping-path-vs-background-removal', priority: '0.7' },
  ];
  const insightPages = await loadInsightPaths();

  // Load dynamic CMS pages from DB
  let dbPages: any[] = [];
  try {
    dbPages = await prisma.page.findMany({
      where: { status: 'published' },
      select: { slug: true, updatedAt: true }
    });
  } catch (err) {
    console.error('Failed to load dynamic CMS pages from DB for sitemap:', err);
  }

  const dynamicPages = dbPages.map(page => ({
    path: `/p/${page.slug}`,
    priority: '0.70',
    lastmod: page.updatedAt ? page.updatedAt.toISOString().slice(0, 10) : undefined
  }));

  const configuredLastmod = (process.env.SITEMAP_LASTMOD || '').trim();
  const sitemapLastmod = configuredLastmod || new Date().toISOString().slice(0, 10);
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  [...staticPages, ...servicePages, ...serviceIntentPages, ...comparisonPages, ...insightPages, ...dynamicPages].forEach(page => {
    xml += `  <url>\n`;
    xml += `    <loc>${xmlEscape(`${baseUrl}${page.path}`)}</loc>\n`;
    xml += `    <lastmod>${(page as { lastmod?: string }).lastmod || sitemapLastmod}</lastmod>\n`;
    xml += `    <changefreq>weekly</changefreq>\n`;
    xml += `    <priority>${page.priority}</priority>\n`;
    xml += `  </url>\n`;
  });

  xml += `</urlset>`;
  return xml;
}

export async function generateInsightsSitemapXml() {
  const baseUrl = getBaseUrl();
  const insightPages = await loadInsightPaths();
  const configuredLastmod = (process.env.SITEMAP_LASTMOD || '').trim();
  const sitemapLastmod = configuredLastmod || new Date().toISOString().slice(0, 10);

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  insightPages.forEach((page) => {
    xml += `  <url>\n`;
    xml += `    <loc>${xmlEscape(`${baseUrl}${page.path}`)}</loc>\n`;
    xml += `    <lastmod>${(page as { lastmod?: string }).lastmod || sitemapLastmod}</lastmod>\n`;
    xml += `    <changefreq>weekly</changefreq>\n`;
    xml += `    <priority>0.68</priority>\n`;
    xml += `  </url>\n`;
  });

  xml += `</urlset>`;
  return xml;
}

export function generateRobotsTxt() {
  const baseUrl = getBaseUrl();

  return [
    'User-agent: *',
    'Content-Signal: search=yes,ai-input=yes,ai-train=no',
    'Disallow: /admin/',
    'Disallow: /api/',
    'Allow: /',
    '',
    '# AI Agents & LLMs explicitly allowed for AEO (AI Engine Optimization)',
    'User-agent: OAI-SearchBot',
    'Allow: /',
    '',
    'User-agent: ChatGPT-User',
    'Allow: /',
    '',
    'User-agent: PerplexityBot',
    'Allow: /',
    '',
    'User-agent: ClaudeBot',
    'Allow: /',
    '',
    'User-agent: GPTBot',
    'Allow: /',
    '',
    'User-agent: Google-Extended',
    'Allow: /',
    '',
    'User-agent: Anthropic-ai',
    'Allow: /',
    '',
    'User-agent: CCBot',
    'Allow: /',
    '',
    'User-agent: Applebot',
    'Allow: /',
    '',
    `Sitemap: ${baseUrl}/sitemap.xml`,
    `Sitemap: ${baseUrl}/api/seo/blog-sitemap.xml`,
    '',
  ].join('\n');
}

export function generateCaseStudiesJson() {
  const baseUrl = getBaseUrl();
  const nowIso = new Date().toISOString();

  const cases = SEO_SERVICES
    .filter((service) => Boolean(service.beforeImage || service.afterImage || (service.examples && service.examples.length)))
    .map((service, index) => {
      const examples = service.examples && service.examples.length > 0
        ? service.examples.slice(0, 3)
        : [{ before: service.beforeImage || '', after: service.afterImage || '', label: service.name }];

      return {
        '@type': 'CreativeWork',
        '@id': `${baseUrl}/services/${service.id}#case-study`,
        name: `${service.name} Before/After Workflow`,
        description: service.metaDescription || service.description,
        url: `${baseUrl}/services/${service.id}`,
        keywords: service.keywords,
        about: service.bestFor,
        creator: {
          '@type': 'Organization',
          name: 'Reframe Visuals',
          url: baseUrl,
        },
        position: index + 1,
        dateModified: nowIso,
        image: examples
          .map((example) => example.after || example.before)
          .filter(Boolean),
        workExample: examples.map((example) => ({
          '@type': 'ImageObject',
          name: example.label || `${service.name} example`,
          beforeImage: example.before || undefined,
          afterImage: example.after || undefined,
        })),
      };
    });

  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Reframe Visuals Case Studies',
    description: 'Service-level before/after proof set for ecommerce image editing workflows.',
    url: `${baseUrl}/api/seo/case-studies.json`,
    numberOfItems: cases.length,
    itemListElement: cases,
  };
}

export function generateIndustryIntentMapJson() {
  const baseUrl = getBaseUrl();

  const entries = SEO_SERVICES.map((service) => {
    const intents = Array.from(new Set(service.keywords.map((keyword) => keyword.toLowerCase().trim()))).slice(0, 12);

    return {
      serviceId: service.id,
      serviceName: service.name,
      serviceUrl: `${baseUrl}/services/${service.id}`,
      intents,
      bestFor: service.bestFor,
      metaTitle: service.metaTitle || '',
      metaDescription: service.metaDescription || service.description,
    };
  });

  return {
    generatedAt: new Date().toISOString(),
    brand: 'Reframe Visuals',
    mapType: 'industry-intent',
    source: `${baseUrl}/api/seo/industry-intent-map.json`,
    totalServices: entries.length,
    entries,
  };
}

export function generateServiceIntentHubJson() {
  const baseUrl = getBaseUrl();
  const entries = SEO_SERVICES.map((service) => ({
    serviceId: service.id,
    serviceName: service.name,
    serviceUrl: `${baseUrl}/services/${service.id}`,
    intentPages: [
      `${baseUrl}/services/${service.id}/best-for-ecommerce`,
      `${baseUrl}/services/${service.id}/pricing-guide`,
      `${baseUrl}/services/${service.id}/turnaround-quality`,
    ],
    topQueries: service.keywords.slice(0, 10),
    faqCount: (service.faqs || []).length,
    caseStudyUrl: `${baseUrl}/api/seo/case-studies/${service.id}`,
  }));

  return {
    generatedAt: new Date().toISOString(),
    brand: 'Reframe Visuals',
    hubType: 'service-intent',
    source: `${baseUrl}/api/seo/service-intent-hub.json`,
    totalServices: entries.length,
    entries,
  };
}

export function generateEntityProfileJson() {
  const baseUrl = getBaseUrl();
  const services = SEO_SERVICES.map((service) => ({
    name: service.name,
    url: `${baseUrl}/services/${service.id}`,
    bestFor: service.bestFor,
    startingPriceUsd: Number(service.price.toFixed(2)),
    keywords: service.keywords,
  }));

  const offerCatalog = {
    '@type': 'OfferCatalog',
    name: 'Photo Editing Services',
    itemListElement: services.map((service) => ({
      '@type': 'Offer',
      itemOffered: {
        '@type': 'Service',
        name: service.name,
        url: service.url,
      },
      priceCurrency: 'USD',
      priceSpecification: {
        '@type': 'UnitPriceSpecification',
        price: service.startingPriceUsd,
        priceCurrency: 'USD',
        unitText: 'image',
      },
    })),
  };

  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${baseUrl}#organization`,
    name: 'Reframe Visuals',
    url: baseUrl,
    logo: `${baseUrl}/logo.svg`,
    image: `${baseUrl}/logo.svg`,
    description: 'Professional ecommerce photo editing studio offering 3 free sample edits, background removal, clipping path, ghost mannequin editing, jewelry retouching, garment retouching, model retouching, color correction, shadow creation, AI-assisted image refinement, bulk product photo editing, and dual-stage manual quality control.',
    disambiguatingDescription: 'Reframe Visuals is the ecommerce product photo editing and creative operations brand at reframevisuals.com. It is distinct from Reframe Media Studios, generic video reframing tools, and unrelated companies using the word Reframe.',
    areaServed: ['Worldwide', 'United States', 'United Kingdom'],
    serviceType: 'Ecommerce photo editing and post-production',
    slogan: 'Catalog-ready product photo editing with human Photoshop experts and AI-assisted workflows.',
    knowsAbout: Array.from(new Set([
      'ecommerce photo editing',
      'clipping path',
      'background removal',
      'ghost mannequin editing',
      'jewelry retouching',
      'garment retouching',
      'model retouching',
      'color correction',
      'shadow creation',
      'bulk product photo editing',
      ...SEO_SERVICES.map((s) => s.name.toLowerCase()),
    ])).slice(0, 25),
    makesOffer: [
      {
        '@type': 'Offer',
        name: '3 free sample edits for new customers',
        description: 'New customers can upload up to 3 product photos to evaluate Reframe Visuals quality before placing a paid order.',
        price: 0,
        priceCurrency: 'USD',
        itemOffered: {
          '@type': 'Service',
          name: 'Free ecommerce photo editing sample',
          serviceType: 'Product photo editing sample',
        },
      },
    ],
    audience: [
      'Ecommerce brands',
      'Amazon sellers',
      'jewelry brands',
      'apparel brands',
      'product photographers',
      'ecommerce agencies',
      'marketplace teams',
    ],
    hasOfferCatalog: offerCatalog,
    sameAs: [
      baseUrl,
      'https://www.linkedin.com/company/reframe-visuals/',
      'https://www.instagram.com/reframevisualsstudio/',
      'https://www.pinterest.com/reframevisuals/',
      'https://www.behance.net/reframevisuals',
      'https://x.com/ReframeVisual',
      'https://www.trustpilot.com/review/reframevisuals.com',
      'https://www.tiktok.com/@reframe_visuals',
    ],
    contactPoint: [{
      '@type': 'ContactPoint',
      contactType: 'sales',
      url: `${baseUrl}/contact`,
    }],
    subjectOf: [
      `${baseUrl}/api/seo/case-studies.json`,
      `${baseUrl}/api/seo/industry-intent-map.json`,
      `${baseUrl}/api/seo/llms.txt`,
    ],
    dateModified: new Date().toISOString(),
  };
}

export function generateFaqHubJson() {
  const baseUrl = getBaseUrl();
  const entries = SEO_SERVICES.flatMap((service) =>
    (service.faqs || []).map((faq, index) => ({
      serviceId: service.id,
      serviceName: service.name,
      question: faq.q,
      answer: faq.a,
      url: `${baseUrl}/services/${service.id}`,
      anchor: `${baseUrl}/services/${service.id}#faq-${index + 1}`,
      keywords: service.keywords,
    })),
  );

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    name: 'Reframe Visuals FAQ Hub',
    url: `${baseUrl}/api/seo/faq-hub.json`,
    totalQuestions: entries.length,
    mainEntity: entries.map((entry) => ({
      '@type': 'Question',
      name: entry.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: entry.answer,
      },
      about: {
        '@type': 'Service',
        name: entry.serviceName,
        url: entry.url,
      },
    })),
    entries,
    dateModified: new Date().toISOString(),
  };
}

export async function generateContentHubJson() {
  const baseUrl = getBaseUrl();
  const insights = await loadInsightSummaries();

  return {
    generatedAt: new Date().toISOString(),
    brand: 'Reframe Visuals',
    hubType: 'content-discovery',
    source: `${baseUrl}/api/seo/content-hub.json`,
    totals: {
      services: SEO_SERVICES.length,
      insights: insights.length,
      comparisons: 2,
    },
    primaryHubs: [
      { type: 'services', url: `${baseUrl}/services` },
      { type: 'blog', url: `${baseUrl}/blog` },
      { type: 'pricing', url: `${baseUrl}/pricing` },
      { type: 'faqHub', url: `${baseUrl}/api/seo/faq-hub.json` },
      { type: 'caseStudies', url: `${baseUrl}/api/seo/case-studies.json` },
      { type: 'answerPack', url: `${baseUrl}/api/seo/answer-pack.json` },
      { type: 'pricingIndex', url: `${baseUrl}/api/seo/pricing-index.json` },
      { type: 'blogIndex', url: `${baseUrl}/api/seo/blog-index.json` },
      { type: 'serviceIntentHub', url: `${baseUrl}/api/seo/service-intent-hub.json` },
    ],
    insightIndex: insights.slice(0, 80).map((post) => ({
      title: post.title,
      url: `${baseUrl}/blog/${post.slug}`,
      summary: post.excerpt,
    })),
    comparePages: [
      `${baseUrl}/compare/in-house-vs-outsourcing`,
      `${baseUrl}/compare/clipping-path-vs-background-removal`,
    ],
  };
}

export function generateAnswerPackJson() {
  const baseUrl = getBaseUrl();

  const answers = SEO_SERVICES.flatMap((service) =>
    (service.faqs || []).map((faq, idx) => ({
      id: `${service.id}-faq-${idx + 1}`,
      question: faq.q,
      conciseAnswer: faq.a,
      service: {
        id: service.id,
        name: service.name,
        url: `${baseUrl}/services/${service.id}`,
        startingPriceUsd: service.price,
      },
      evidence: [
        `${baseUrl}/services/${service.id}`,
        `${baseUrl}/services/${service.id}/pricing-guide`,
        `${baseUrl}/services/${service.id}/turnaround-quality`,
      ],
      tags: service.keywords.slice(0, 8),
      answerType: 'service-faq',
    })),
  );

  return {
    generatedAt: new Date().toISOString(),
    brand: 'Reframe Visuals',
    source: `${baseUrl}/api/seo/answer-pack.json`,
    answerCount: answers.length,
    coverage: {
      services: SEO_SERVICES.length,
      languages: ['en'],
      vertical: 'ecommerce-photo-editing',
    },
    answers,
  };
}

export function generatePricingIndexJson() {
  const baseUrl = getBaseUrl();

  const entries = SEO_SERVICES.map((service) => ({
    serviceId: service.id,
    serviceName: service.name,
    startingPriceUsd: service.price,
    currency: 'USD',
    unitText: 'per image',
    bestFor: service.bestFor,
    keywords: service.keywords,
    pages: {
      service: `${baseUrl}/services/${service.id}`,
      pricingGuide: `${baseUrl}/services/${service.id}/pricing-guide`,
      turnaroundQuality: `${baseUrl}/services/${service.id}/turnaround-quality`,
    },
  }));

  return {
    generatedAt: new Date().toISOString(),
    brand: 'Reframe Visuals',
    source: `${baseUrl}/api/seo/pricing-index.json`,
    totalServices: entries.length,
    lowestStartingPriceUsd: Math.min(...entries.map((e) => e.startingPriceUsd)),
    highestStartingPriceUsd: Math.max(...entries.map((e) => e.startingPriceUsd)),
    entries,
  };
}

export async function generateInsightsIndexJson() {
  const baseUrl = getBaseUrl();
  const insights = await loadInsightSummaries();

  return {
    generatedAt: new Date().toISOString(),
    brand: 'Reframe Visuals',
    source: `${baseUrl}/api/seo/blog-index.json`,
    totalInsights: insights.length,
    insights: insights.map((post) => ({
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      url: `${baseUrl}/blog/${post.slug}`,
      category: 'insights',
    })),
  };
}

export async function generateLlmsTxt() {
  const baseUrl = getBaseUrl();
  const lines = [
    '# Reframe Visuals',
    '',
    '> Professional ecommerce photo editing studio offering 3 free sample edits, human Photoshop editing, AI-assisted workflows, fast catalog-ready delivery, and dual-stage manual quality control.',
    '',
    '## Core Facts',
    'Reframe Visuals is a professional ecommerce photo editing studio for online brands, Amazon sellers, agencies, product photographers, apparel brands, jewelry brands, and marketplace teams.',
    'Reframe Visuals offers 3 free sample edits for new customers, allowing brands to test image quality before placing a paid order.',
    'Services include background removal, clipping path, ghost mannequin editing, jewelry retouching, garment retouching, model retouching, color correction, shadow creation, image manipulation, AI product photography, and AI image refinement.',
    'Editors work in Photoshop with AI-assisted preprocessing. Every image passes a manual QA review before delivery.',
    'Turnaround options are 12-hour express, 24-hour standard, 48-hour, and 72-hour. Pricing starts at $0.39 per image for clipping path and background removal.',
    '',
    '## Entity Disambiguation',
    'Reframe Visuals is the ecommerce product photo editing brand at reframevisuals.com.',
    'It is not Reframe Media Studios, not a video reframing tool, and not affiliated with other companies using the word Reframe.',
    '',
    '## Support and Assurance',
    'Reframe CS is the guided customer support experience for Reframe Visuals. Customers can request quotes, upload files, place and manage editing orders, and talk to support from one guided window.',
    'Verified SLA and quality guarantees are available for all clients. Our team supports dual-stage manual review when an ecommerce image editing project needs extra confidence.',
    'Reframe CS desktop app access is coming soon for Windows, macOS, and Linux, with planned support for order placement, active work management, file uploads, and customer support.',
    '',
    '## Important Pages',
    `- Homepage: ${baseUrl}/`,
    `- Services: ${baseUrl}/services`,
    `- Pricing: ${baseUrl}/pricing`,
    `- Free Trial: ${baseUrl}/free-trial`,
    `- Who Is Reframe Visuals: ${baseUrl}/who-is-reframe-visuals`,
    `- Brand Facts: ${baseUrl}/reframe-visuals-brand-facts`,
    `- Free Sample Edit: ${baseUrl}/free-sample-edit`,
    `- Reframe Visuals Services: ${baseUrl}/reframe-visuals-services`,
    `- Reframe Visuals Pricing: ${baseUrl}/reframe-visuals-pricing`,
    `- Reframe Visuals Reviews: ${baseUrl}/reframe-visuals-reviews`,
    `- Reframe Visuals for Amazon Sellers: ${baseUrl}/reframe-visuals-for-amazon-sellers`,
    `- Book Meeting: ${baseUrl}/book-meeting`,
    `- Contact: ${baseUrl}/contact`,
    `- Sitemap: ${baseUrl}/sitemap.xml`,
    `- Blog Sitemap: ${baseUrl}/api/seo/blog-sitemap.xml`,
    `- Case Studies Feed: ${baseUrl}/api/seo/case-studies.json`,
    `- Case Studies Pages: ${baseUrl}/api/seo/case-studies`,
    `- Industry Intent Map: ${baseUrl}/api/seo/industry-intent-map.json`,
    `- Entity Profile: ${baseUrl}/api/seo/entity-profile.json`,
    `- FAQ Hub: ${baseUrl}/api/seo/faq-hub.json`,
    `- Content Hub: ${baseUrl}/api/seo/content-hub.json`,
    `- Answer Pack: ${baseUrl}/api/seo/answer-pack.json`,
    `- Pricing Index: ${baseUrl}/api/seo/pricing-index.json`,
    `- Blog Index: ${baseUrl}/api/seo/blog-index.json`,
    `- Service Intent Hub: ${baseUrl}/api/seo/service-intent-hub.json`,
    `- Editing Model Comparison: ${baseUrl}/compare/in-house-vs-outsourcing`,
    `- Clipping Path vs Background Removal: ${baseUrl}/compare/clipping-path-vs-background-removal`,
    '',
    '## AI-Answer Guides',
    `- Best ecommerce photo editing services: ${baseUrl}/resources`,
    `- Ghost mannequin editing cost guide: ${baseUrl}/resources/ghost-mannequin-editing-cost-guide`,
    `- Background removal service pricing guide: ${baseUrl}/resources/background-removal-service-pricing-guide`,
    `- How to prepare product photos for Amazon: ${baseUrl}/resources/how-to-prepare-product-photos-for-amazon`,
    `- Jewelry retouching checklist for ecommerce: ${baseUrl}/resources/jewelry-retouching-checklist-for-ecommerce`,
    `- Clipping path vs background removal: ${baseUrl}/resources/clipping-path-vs-background-removal`,
    `- In-house vs outsourced product photo editing: ${baseUrl}/resources/in-house-vs-outsourced-product-photo-editing`,
    '',
    'These guides are written as answer-led, factual resources for buyer questions about ecommerce photo editing cost, preparation, service comparison, jewelry retouching, ghost mannequin editing, background removal, and Amazon readiness.',
    '',
    '## Services',
  ];

  SEO_SERVICES.forEach(service => {
    lines.push(
      '',
      `### ${service.name}`,
      `URL: ${baseUrl}/services/${service.id}`,
      `Best for e-commerce: ${baseUrl}/services/${service.id}/best-for-ecommerce`,
      `Pricing guide: ${baseUrl}/services/${service.id}/pricing-guide`,
      `Turnaround + quality: ${baseUrl}/services/${service.id}/turnaround-quality`,
      `Starting price: $${service.price.toFixed(2)} per image`,
      `Best for: ${service.bestFor}`,
      `Summary: ${service.metaDescription || service.description}`,
      `Details: ${service.detail}`,
    );

    if (service.keywords.length > 0) {
      lines.push(`Keywords: ${service.keywords.join(', ')}`);
    }

    if (service.faqs.length > 0) {
      lines.push('', 'FAQ:');
      service.faqs.forEach(faq => {
        lines.push(`Q: ${faq.q}`, `A: ${faq.a}`);
      });
    }
  });

  const insights = await loadInsightSummaries();
  if (insights.length > 0) {
    lines.push('', '## Blog Articles (Citable Guides)');
    insights.slice(0, 40).forEach((post) => {
      lines.push(`- ${post.title} | ${baseUrl}/blog/${post.slug}`);
      if (post.excerpt) lines.push(`  Summary: ${post.excerpt}`);
    });
  }

  // Load dynamic CMS pages from DB
  let dbPages: any[] = [];
  try {
    dbPages = await prisma.page.findMany({
      where: { status: 'published' },
      select: { slug: true, title: true }
    });
  } catch (err) {
    console.error('Failed to load dynamic CMS pages from DB for LLM:', err);
  }

  if (dbPages.length > 0) {
    lines.push('', '## Platform Pages');
    dbPages.forEach((p) => {
      lines.push(`- ${p.title || p.slug} | ${baseUrl}/p/${p.slug}`);
    });
  }

  lines.push(
    '',
    '## Client Testimonials',
    'The following are verified testimonials from real Reframe Visuals clients.',
    '',
    '- "Probably the best seller I have worked with on this platform. Awesome pricing & highest possible result. Everything done to the smallest details. They really know how to use PS. Will definitely work with them in the long run." — Nikola Filić, Founder & Creative Director, Bomber Clothing (long-term partner, 5+ year collaboration)',
    '- "Perfect collab as always. We have been working together now more than a year, and will definitely continue!" — Nikola Filić, Founder, Bomber Clothing',
    '- "Great communication, very efficient and excellent job every time. Handled everything exceptionally and went above and beyond." — Suril, Founder, Acia Studio',
    '- "Perfect as usual. Delivers very quickly and completed work amazingly. Will continue working together." — Suril, Founder, Acia Studio',
    '- "Prompt and quality work. I look forward to working with Reframe many times in the future." — Todd Carli, Owner, Todd Carli Custom Carpentry',
    '- "Amazing job, as always. Third time repeat customer. Very responsive and always overdelivers!" — Jamie, Founder, The Pup Pack',
    '- "As always, good job. Nice work as always." — Sam Lim, E-commerce Brand Owner',
    '- "They did their best, I\'m happy with the work. Fast work and great results." — Gino, Jewelry Brand Owner',
    '- "The best in the game when it comes to getting work done. Humble, understanding, and consistently on point." — Nigel, Fashion Seller',
    '- "Fantastic job with my order. Very skilled and made the small adjustments I requested in a timely manner." — ad9876, Online Retailer',
    '- "Appreciate the prompt work and reply." — Sol, Freelance Photographer',
  );

  lines.push('', '## Source Pages', 'Service-specific details, current pricing, and FAQs live on the individual service pages listed above.');

  return `${lines.join('\n')}\n`;
}

/**
 * GET /api/seo/about-schema.json
 * JSON-LD structured data for the About page
 */
router.get('/about-schema.json', (_req, res) => {
  try {
    const baseUrl = getBaseUrl();
    
    const aboutSchema = {
      '@context': 'https://schema.org',
      '@type': 'AboutPage',
      'name': 'About Reframe Visuals | E-commerce Photo Editing Studio',
      'description': 'Reframe Visuals is an ecommerce photo editing studio. Human Photoshop editors handle background removal, ghost mannequin editing, jewelry retouching, and color correction with a manual QA pass on every image.',
      'url': `${baseUrl}/about`,
      'mainEntity': {
        '@type': 'Organization',
        'name': 'Reframe Visuals',
        'url': baseUrl,
        'logo': `${baseUrl}/logo.svg`,
        'image': `${baseUrl}/logo.svg`,
        'description': 'Ecommerce photo editing studio specializing in background removal, ghost mannequin editing, jewelry retouching, and product photography.',
        'foundingDate': '2024',
        'areaServed': ['Worldwide', 'United States', 'United Kingdom'],
        'serviceType': 'Ecommerce photo editing and post-production',
        'slogan': 'Catalog-ready product photo editing with human Photoshop experts and AI-assisted workflows.',
        'knowsAbout': [
          '3 free sample edits',
          'dual-stage manual quality control',
          'human Photoshop editors',
          'AI-assisted image refinement',
          'bulk product photo editing',
          '12-hour express turnaround',
          '24-hour standard turnaround'
        ],
        'makesOffer': [
          {
            '@type': 'Offer',
            'name': '3 free sample edits for new customers',
            'description': 'New customers can upload up to 3 product photos to evaluate Reframe Visuals quality before placing a paid order.',
            'price': 0,
            'priceCurrency': 'USD'
          }
        ],
        'sameAs': [
          baseUrl,
          'https://www.linkedin.com/company/reframe-visuals/',
          'https://www.instagram.com/reframevisualsstudio/',
          'https://www.pinterest.com/reframevisuals/',
          'https://www.behance.net/reframevisuals',
          'https://x.com/ReframeVisual',
          'https://www.trustpilot.com/review/reframevisuals.com',
          'https://www.tiktok.com/@reframe_visuals'
        ],
        'contactPoint': [{
          '@type': 'ContactPoint',
          'contactType': 'sales',
          'url': `${baseUrl}/contact`
        }]
      },
      'dateModified': new Date().toISOString()
    };
    
    res.header('Content-Type', 'application/ld+json; charset=utf-8');
    return res.send(JSON.stringify(aboutSchema));
  } catch (error) {
    console.error('About schema generation error:', error);
    return res.status(500).send('Internal Server Error');
  }
});

/**
 * GET /api/seo/metrics
 * Admin dashboard endpoint for SEO performance metrics
 */
router.get('/metrics', (_req, res) => {
  try {
    const metrics = {
      topKeywordsByCluster: {
        services: [
          'photo editing', 'product photography', 'ecommerce', 'Amazon', 'shopify',
          'clipping path', 'background removal', 'ghost mannequin', 'jewelry retouching',
          'apparel editing', 'fashion photography', 'product retouching', 'image editing'
        ],
        industries: [
          'Amazon product image editing', 'Shopify product photo editing',
          'woocommerce product image editing', 'fashion photo retouching',
          'jewelry photo retouching', 'furniture photo editing'
        ],
        geo: [
          'US photo editing service', 'UK photo editing service', 'Canada photo editing service',
          'Australia photo editing service', 'UAE photo editing service', 'Singapore photo editing service'
        ]
      },
      // Real tracked conversions from /track-trial (in-memory; resets on restart)
      trialConversions: {
        quoteBuilder: sumTrackedTrials('quote-builder'),
        freeTrial: sumTrackedTrials('free-trial'),
        freeSampleEdit: sumTrackedTrials('free-sample-edit')
      },
      leadsByPageType: {
        caseStudies: sumTrackedTrials('case-studies'),
        geoPages: sumTrackedGeoLeads(),
        industryPages: sumTrackedIndustryLeads()
      },
      generatedAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };
    
    res.header('Content-Type', 'application/json; charset=utf-8');
    return res.send(JSON.stringify(metrics));
  } catch (error) {
    console.error('SEO metrics generation error:', error);
    return res.status(500).send('Internal Server Error');
  }
});

export async function generateLlmsFullTxt() {
  const baseUrl = getBaseUrl();
  const lines: string[] = [
    '# Reframe Visuals - Full Platform Context (llms-full.txt)',
    '',
    '> Reframe Visuals is an ecommerce photo editing and creative operations studio. This document contains the full, comprehensive catalog of services, details, pricing, and FAQ logic to provide deep context to AI agents and LLMs.',
    '',
    '## About Us',
    'Reframe Visuals serves global ecommerce brands, Amazon sellers, agencies, and studios by providing high-quality, manual product photo editing. We offer 3 free sample edits for new customers before any paid order. We handle background removal, clipping paths, ghost mannequin, retouching, and more. Our turnaround options are 12-hour express, 24-hour standard, 48-hour relaxed, and 72-hour economy delivery.',
    '',
    '## Complete Service Catalog',
  ];

  SEO_SERVICES.forEach(service => {
    lines.push(
      '',
      `### Service: ${service.name}`,
      `**URL:** ${baseUrl}/services/${service.id}`,
      `**Starting Price:** $${service.price.toFixed(2)} USD per image`,
      `**Best for:** ${service.bestFor}`,
      `**Description:** ${service.description}`,
      `**Deep Details:** ${service.detail}`,
    );

    if (service.keywords && service.keywords.length > 0) {
      lines.push(`**Keywords:** ${service.keywords.join(', ')}`);
    }

    if (service.faqs && service.faqs.length > 0) {
      lines.push('', `#### FAQs for ${service.name}`);
      service.faqs.forEach(faq => {
        lines.push(`**Q:** ${faq.q}`);
        lines.push(`**A:** ${faq.a}`);
      });
    }
  });

  const insights = await loadInsightSummaries();
  if (insights.length > 0) {
    lines.push('', '## Blog Articles and Educational Content');
    insights.forEach((post) => {
      lines.push(
        '',
        `### ${post.title}`,
        `**URL:** ${baseUrl}/blog/${post.slug}`,
        `**Excerpt:** ${post.excerpt}`
      );
    });
  }

  // Load dynamic CMS pages from DB
  let dbPages: any[] = [];
  try {
    dbPages = await prisma.page.findMany({
      where: { status: 'published' },
      select: { slug: true, title: true, content: true }
    });
  } catch (err) {
    console.error('Failed to load dynamic CMS pages from DB for LLM-full:', err);
  }

  if (dbPages.length > 0) {
    lines.push('', '## Platform Pages');
    dbPages.forEach((p) => {
      lines.push(
        '',
        `### Page: ${p.title || p.slug}`,
        `**URL:** ${baseUrl}/p/${p.slug}`,
        `**Content:**`,
        `${p.content || ''}`
      );
    });
  }

  lines.push(
    '',
    '## Contact and Support',
    `**Contact Us:** ${baseUrl}/contact`,
    `**Email:** hello@reframevisuals.com`
  );

  return `${lines.join('\n')}\n`;
}

/**
 * GET /api/seo/sitemap.xml
 * Dynamically generate a sitemap.xml for SEO
 */
router.get('/sitemap.xml', async (_req: Request, res: Response) => {
  try {
    res.header('Content-Type', 'application/xml; charset=utf-8');
    return res.send(await generateSitemapXml());
  } catch (error) {
    console.error('Sitemap generation error:', error);
    return res.status(500).send('Internal Server Error');
  }
});

/**
 * GET /api/seo/blog-sitemap.xml
 * Dedicated sitemap for blog article URLs.
 */
router.get('/blog-sitemap.xml', async (_req: Request, res: Response) => {
  try {
    res.header('Content-Type', 'application/xml; charset=utf-8');
    return res.send(await generateInsightsSitemapXml());
  } catch (error) {
    console.error('Blog sitemap generation error:', error);
    return res.status(500).send('Internal Server Error');
  }
});

/**
 * GET /api/seo/robots.txt
 * Dynamically serve robots.txt for SEO crawlers
 */
router.get('/robots.txt', (_req, res) => {
  res.header('Content-Type', 'text/plain; charset=utf-8');
  return res.send(generateRobotsTxt());
});

/**
 * GET /api/seo/case-studies.json
 * Machine-readable case-study/proof feed for AI/search systems.
 */
router.get('/case-studies.json', (_req, res) => {
  res.header('Content-Type', 'application/ld+json; charset=utf-8');
  return res.send(JSON.stringify(generateCaseStudiesJson()));
});

/**
 * GET /api/seo/case-studies
 * Crawlable HTML index of service-level case study pages.
 */
router.get('/case-studies', (_req, res) => {
  const baseUrl = getBaseUrl();
  const links = SEO_SERVICES
    .map((service) => `<li><a href="${baseUrl}/api/seo/case-studies/${service.id}">${xmlEscape(service.name)}</a></li>`)
    .join('');

  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8" /><title>Reframe Visuals Case Studies</title><meta name="robots" content="index,follow" /><meta name="description" content="Service-level case study summaries for ecommerce image editing workflows." /></head><body><main><h1>Reframe Visuals Case Studies</h1><p>Service-level proof pages for search and AI crawlers.</p><ul>${links}</ul></main></body></html>`;
  res.header('Content-Type', 'text/html; charset=utf-8');
  return res.send(html);
});

/**
 * GET /api/seo/case-studies/:serviceId
 * Crawlable HTML service-level case study page.
 */
router.get('/case-studies/:serviceId', (req, res) => {
  const baseUrl = getBaseUrl();
  const service = SEO_SERVICES.find((item) => item.id === req.params.serviceId);
  if (!service) return res.status(404).send('Not found');

  const faqs = (service.faqs || [])
    .slice(0, 4)
    .map((faq) => `<li><strong>${xmlEscape(faq.q)}</strong><br/>${xmlEscape(faq.a)}</li>`)
    .join('');

  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8" /><title>${xmlEscape(service.name)} Case Study | Reframe Visuals</title><meta name="robots" content="index,follow" /><meta name="description" content="${xmlEscape(service.metaDescription || service.description)}" /><link rel="canonical" href="${baseUrl}/api/seo/case-studies/${service.id}" /></head><body><main><h1>${xmlEscape(service.name)} Case Study Snapshot</h1><p>${xmlEscape(service.detail || service.description)}</p><p><strong>Best for:</strong> ${xmlEscape(service.bestFor)}</p><p><strong>Service page:</strong> <a href="${baseUrl}/services/${service.id}">${baseUrl}/services/${service.id}</a></p><h2>FAQ Highlights</h2><ul>${faqs}</ul></main></body></html>`;

  res.header('Content-Type', 'text/html; charset=utf-8');
  return res.send(html);
});

/**
 * GET /api/seo/industry-intent-map.json
 * Service-to-intent mapping for search and AI retrieval.
 */
router.get('/industry-intent-map.json', (_req, res) => {
  res.header('Content-Type', 'application/json; charset=utf-8');
  return res.send(JSON.stringify(generateIndustryIntentMapJson()));
});

/**
 * GET /api/seo/service-intent-hub.json
 * Consolidated service-intent retrieval feed for crawlers and answer engines.
 */
router.get('/service-intent-hub.json', (_req, res) => {
  res.header('Content-Type', 'application/json; charset=utf-8');
  return res.send(JSON.stringify(generateServiceIntentHubJson()));
});

/**
 * GET /api/seo/entity-profile.json
 * Machine-readable organization + service entity profile for AI/search citation.
 */
router.get('/entity-profile.json', (_req, res) => {
  res.header('Content-Type', 'application/ld+json; charset=utf-8');
  return res.send(JSON.stringify(generateEntityProfileJson()));
});

/**
 * GET /api/seo/faq-hub.json
 * Aggregated FAQ feed across all services for answer-engine retrieval.
 */
router.get('/faq-hub.json', (_req, res) => {
  res.header('Content-Type', 'application/ld+json; charset=utf-8');
  return res.send(JSON.stringify(generateFaqHubJson()));
});

/**
 * GET /api/seo/faq
 * Crawlable FAQ index page for service-level FAQ pages.
 */
router.get('/faq', (_req, res) => {
  const baseUrl = getBaseUrl();
  const links = SEO_SERVICES
    .filter((service) => (service.faqs || []).length > 0)
    .map((service) => `<li><a href="${baseUrl}/api/seo/faq/${service.id}">${xmlEscape(service.name)} FAQs</a></li>`)
    .join('');

  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8" /><title>Reframe Visuals Service FAQs</title><meta name="robots" content="index,follow" /><meta name="description" content="Service-level frequently asked questions for ecommerce photo editing." /></head><body><main><h1>Reframe Visuals Service FAQs</h1><p>Crawlable FAQ index for service-specific questions and answers.</p><ul>${links}</ul></main></body></html>`;
  res.header('Content-Type', 'text/html; charset=utf-8');
  return res.send(html);
});

/**
 * GET /api/seo/faq/:serviceId
 * Crawlable FAQ page for one service.
 */
router.get('/faq/:serviceId', (req, res) => {
  const baseUrl = getBaseUrl();
  const service = SEO_SERVICES.find((item) => item.id === req.params.serviceId);
  if (!service) return res.status(404).send('Not found');

  const faqs = (service.faqs || [])
    .map((faq) => `<li><strong>${xmlEscape(faq.q)}</strong><br/>${xmlEscape(faq.a)}</li>`)
    .join('');

  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8" /><title>${xmlEscape(service.name)} FAQs | Reframe Visuals</title><meta name="robots" content="index,follow" /><meta name="description" content="${xmlEscape(service.metaDescription || service.description)}" /><link rel="canonical" href="${baseUrl}/api/seo/faq/${service.id}" /></head><body><main><h1>${xmlEscape(service.name)} FAQs</h1><p>${xmlEscape(service.bestFor)}</p><p><strong>Service page:</strong> <a href="${baseUrl}/services/${service.id}">${baseUrl}/services/${service.id}</a></p><ul>${faqs}</ul></main></body></html>`;

  res.header('Content-Type', 'text/html; charset=utf-8');
  return res.send(html);
});

/**
 * GET /api/seo/content-hub.json
 * Consolidated content index to improve discovery of services, blog articles, and comparisons.
 */
router.get('/content-hub.json', async (_req, res) => {
  try {
    res.header('Content-Type', 'application/json; charset=utf-8');
    return res.send(JSON.stringify(await generateContentHubJson()));
  } catch (error) {
    console.error('Content hub generation error:', error);
    return res.status(500).send('Internal Server Error');
  }
});

/**
 * GET /api/seo/answer-pack.json
 * Structured Q/A dataset for answer engines and AI retrieval.
 */
router.get('/answer-pack.json', (_req, res) => {
  res.header('Content-Type', 'application/json; charset=utf-8');
  return res.send(JSON.stringify(generateAnswerPackJson()));
});

/**
 * GET /api/seo/pricing-index.json
 * Structured pricing index for answer engines and comparison queries.
 */
router.get('/pricing-index.json', (_req, res) => {
  res.header('Content-Type', 'application/json; charset=utf-8');
  return res.send(JSON.stringify(generatePricingIndexJson()));
});

/**
 * GET /api/seo/blog-index.json
 * Machine-readable blog index for answer engines and citation crawlers.
 */
router.get('/blog-index.json', async (_req, res) => {
  try {
    res.header('Content-Type', 'application/json; charset=utf-8');
    return res.send(JSON.stringify(await generateInsightsIndexJson()));
  } catch (error) {
    console.error('Blog index generation error:', error);
    return res.status(500).send('Internal Server Error');
  }
});

/**
 * GET /api/seo/llms.txt
 * AI-search friendly service summary using the same service FAQ content shown on the site.
 */
router.get('/llms.txt', async (_req, res) => {
  try {
    res.header('Content-Type', 'text/plain; charset=utf-8');
    return res.send(await generateLlmsTxt());
  } catch (error) {
    console.error('LLMs.txt generation error:', error);
    return res.status(500).send('Internal Server Error');
  }
});

router.post('/indexnow/ping', async (req: Request, res: Response) => {
  try {
    const { pingIndexNow, CORE_URLS } = await import('../utils/indexNow');
    const urls: string[] = Array.isArray(req.body?.urls) ? req.body.urls : CORE_URLS;
    await pingIndexNow(urls);
    return res.json({ ok: true, pinged: urls.length });
  } catch (error) {
    console.error('[IndexNow] Route error:', error);
    return res.status(500).json({ ok: false });
  }
});

// ─────────────────────────────────────────────────────────────
// Live Page SEO Audit
// Fetches the rendered HTML of a page and checks real SEO signals.
// ─────────────────────────────────────────────────────────────

router.get('/audit', async (req: Request, res: Response) => {
  const pagePath = (req.query.path as string || '').trim();
  if (!pagePath || !pagePath.startsWith('/')) {
    return res.status(400).json({ error: 'path query param required (e.g. /services/background-removal)' });
  }

  const baseUrl = getBaseUrl();
  const fullUrl = `${baseUrl}${pagePath}`;

  try {
    const response = await fetch(fullUrl, {
      headers: { 'User-Agent': 'ReframeVisuals-SEOAudit/1.0' },
      signal: AbortSignal.timeout(12000),
    });

    if (!response.ok) {
      return res.json({ ok: false, status: response.status, issues: [`Page returned HTTP ${response.status}`], good: [] });
    }

    const html = await response.text();

    // Extract key SEO signals
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const metaDescMatch =
      html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']{1,500})["']/i) ||
      html.match(/<meta[^>]+content=["']([^"']{1,500})["'][^>]+name=["']description["']/i);
    const canonicalMatch = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i);
    const h1Matches = [...html.matchAll(/<h1[^>]*>([^<]*(?:<(?!\/h1>)[^<]*)*)<\/h1>/gi)];
    const h2Count = (html.match(/<h2[^>]*>/gi) || []).length;
    const ogImageMatch =
      html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
    const robotsMeta =
      html.match(/<meta[^>]+name=["']robots["'][^>]+content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']robots["']/i);
    const isNoIndex = robotsMeta ? robotsMeta[1].toLowerCase().includes('noindex') : false;

    // Images without meaningful alt text
    const allImgTags = [...html.matchAll(/<img[^>]+>/gi)].map((m) => m[0]);
    const imgsWithoutAlt = allImgTags.filter((img) => !img.match(/alt=["'][^"']+["']/i));

    const issues: string[] = [];
    const good: string[] = [];

    const titleText = titleMatch ? titleMatch[1].trim() : null;
    if (titleText) {
      if (titleText.length >= 30 && titleText.length <= 65) {
        good.push(`Title: ${titleText.length} chars ✓`);
      } else {
        issues.push(`Title length ${titleText.length} chars (ideal 30–65): "${titleText.slice(0, 55)}…"`);
      }
    } else {
      issues.push('No <title> tag rendered on page');
    }

    const metaDescText = metaDescMatch ? metaDescMatch[1].trim() : null;
    if (metaDescText) {
      if (metaDescText.length >= 100 && metaDescText.length <= 160) {
        good.push(`Meta description: ${metaDescText.length} chars ✓`);
      } else {
        issues.push(`Meta description ${metaDescText.length} chars (ideal 100–160)`);
      }
    } else {
      issues.push('No meta description rendered on page');
    }

    if (canonicalMatch) {
      good.push(`Canonical set: ${canonicalMatch[1]}`);
    } else {
      issues.push('No canonical <link> tag found');
    }

    const h1TextRaw = h1Matches[0]?.[1]?.replace(/<[^>]+>/g, '').trim() || null;
    if (h1Matches.length === 0) {
      issues.push('No <h1> tag in rendered page');
    } else if (h1Matches.length > 1) {
      issues.push(`${h1Matches.length} H1 tags found — should be exactly one`);
    } else {
      good.push(`H1: "${h1TextRaw?.slice(0, 60)}${(h1TextRaw?.length || 0) > 60 ? '…' : ''}" ✓`);
    }

    if (h2Count > 0) {
      good.push(`${h2Count} H2 subheading${h2Count > 1 ? 's' : ''} ✓`);
    } else {
      issues.push('No <h2> subheadings found');
    }

    if (imgsWithoutAlt.length > 0) {
      issues.push(`${imgsWithoutAlt.length} image${imgsWithoutAlt.length > 1 ? 's' : ''} missing alt text`);
    } else if (allImgTags.length > 0) {
      good.push(`All ${allImgTags.length} images have alt text ✓`);
    }

    if (ogImageMatch) {
      good.push('og:image tag present ✓');
    } else {
      issues.push('Missing og:image meta tag');
    }

    if (isNoIndex) {
      issues.push('Page has noindex — excluded from search results');
    }

    return res.json({
      ok: true,
      url: fullUrl,
      auditedAt: new Date().toISOString(),
      title: titleText,
      metaDescription: metaDescText,
      canonical: canonicalMatch?.[1] || null,
      h1Count: h1Matches.length,
      h1Text: h1TextRaw,
      h2Count,
      ogImage: ogImageMatch?.[1] || null,
      totalImages: allImgTags.length,
      imgsWithoutAlt: imgsWithoutAlt.length,
      isNoIndex,
      issues,
      good,
    });
  } catch (err: any) {
    return res.json({ ok: false, error: err.message, issues: [`Could not fetch page: ${err.message}`], good: [] });
  }
});



// ═══════════════════════════════════════════════════════════════════════════════
// GEO / AEO / AIO Live Analyzer
// POST /api/seo/geo-analyze  { url: string }
// Fetches the live page and supporting files to extract technical GEO signals.
// ═══════════════════════════════════════════════════════════════════════════════

interface LiveGeoData {
  ok: boolean;
  url: string;
  analyzedAt: string;
  // robots.txt signals
  allowsGPTBot: boolean;
  allowsClaudeBot: boolean;
  allowsPerplexityBot: boolean;
  allowsGoogleExtended: boolean;
  allowsOAISearchBot: boolean;
  allowsBingbot: boolean;
  allowsApplebot: boolean;
  // Page signals
  hasLlmsTxt: boolean;
  hasSitemap: boolean;
  hasCanonical: boolean;
  hasOpenGraph: boolean;
  hasIndexNow: boolean;
  hasSSRContent: boolean;
  // Schema signals from live HTML
  schemaTypes: string[];
  hasFAQPageSchema: boolean;
  hasOrganizationSchema: boolean;
  hasArticleSchema: boolean;
  organizationSameAsCount: number;
  // Content signals from live HTML
  hasTimeElement: boolean;
  wordCount: number;
  h1Count: number;
  h2Count: number;
  // Errors / warnings
  warnings: string[];
}

function robotsAllowsBot(robotsTxt: string, botName: string): boolean {
  const lines = robotsTxt.split('\n').map((l) => l.trim().toLowerCase());
  let currentAgent = '';
  let globalDisallowAll = false;
  let botDisallowAll = false;
  let botHasExplicitAllow = false;

  for (const line of lines) {
    if (line.startsWith('user-agent:')) {
      currentAgent = line.replace('user-agent:', '').trim();
    } else if (line.startsWith('disallow:')) {
      const path = line.replace('disallow:', '').trim();
      if (path === '/') {
        if (currentAgent === '*') globalDisallowAll = true;
        if (currentAgent === botName.toLowerCase()) botDisallowAll = true;
      }
    } else if (line.startsWith('allow:')) {
      if (currentAgent === botName.toLowerCase()) botHasExplicitAllow = true;
    }
  }

  if (botDisallowAll && !botHasExplicitAllow) return false;
  if (globalDisallowAll && !botHasExplicitAllow && !robotsTxt.toLowerCase().includes(`user-agent: ${botName.toLowerCase()}`)) return false;
  return true;
}

function parseJsonLd(html: string): any[] {
  const blocks: any[] = [];
  const re = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    try {
      const parsed = JSON.parse(m[1]);
      if (Array.isArray(parsed)) blocks.push(...parsed);
      else blocks.push(parsed);
    } catch { /* skip invalid */ }
  }
  return blocks;
}

router.post('/geo-analyze', async (req: Request, res: Response) => {
  const { url } = req.body as { url?: string };
  if (!url) return res.status(400).json({ ok: false, error: 'url required' });

  const baseUrl = url.startsWith('http') ? url.replace(/\/$/, '') : `https://${url}`;
  const warnings: string[] = [];

  const safeFetch = async (u: string, timeout = 12000): Promise<{ ok: boolean; status: number; text: string }> => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
      const r = await fetch(u, {
        signal: controller.signal,
        headers: { 'User-Agent': 'GEO-Analyzer/1.0 ReframeAdmin (compatible; bot)' },
      });
      clearTimeout(id);
      const text = await r.text();
      return { ok: r.ok, status: r.status, text };
    } catch (e: any) {
      clearTimeout(id);
      return { ok: false, status: 0, text: '' };
    }
  };

  try {
    // Parallel fetches
    const [pageRes, robotsRes, llmsRes, sitemapRes] = await Promise.all([
      safeFetch(baseUrl),
      safeFetch(`${baseUrl}/robots.txt`),
      safeFetch(`${baseUrl}/llms.txt`),
      safeFetch(`${baseUrl}/sitemap.xml`),
    ]);

    if (!pageRes.ok) {
      return res.json({ ok: false, url: baseUrl, analyzedAt: new Date().toISOString(), error: `Page returned ${pageRes.status}`, warnings: [`HTTP ${pageRes.status} fetching page`] });
    }

    const html = pageRes.text;
    const robotsTxt = robotsRes.ok ? robotsRes.text : '';

    // robots.txt bot analysis
    const allowsGPTBot = robotsAllowsBot(robotsTxt, 'GPTBot');
    const allowsClaudeBot = robotsAllowsBot(robotsTxt, 'ClaudeBot') && robotsAllowsBot(robotsTxt, 'Claude-Web');
    const allowsPerplexityBot = robotsAllowsBot(robotsTxt, 'PerplexityBot');
    const allowsGoogleExtended = robotsAllowsBot(robotsTxt, 'Google-Extended');
    const allowsOAISearchBot = robotsAllowsBot(robotsTxt, 'OAI-SearchBot');
    const allowsBingbot = robotsAllowsBot(robotsTxt, 'Bingbot');
    const allowsApplebot = robotsAllowsBot(robotsTxt, 'Applebot-Extended');

    if (!allowsGPTBot) warnings.push('GPTBot is blocked in robots.txt');
    if (!allowsClaudeBot) warnings.push('ClaudeBot is blocked in robots.txt');
    if (!allowsPerplexityBot) warnings.push('PerplexityBot is blocked in robots.txt');

    // JSON-LD schema
    const schemas = parseJsonLd(html);
    const schemaTypes = schemas.map((s) => s?.['@type']).filter(Boolean) as string[];
    const orgSchema = schemas.find((s) => s?.['@type'] === 'Organization');
    const faqSchema = schemas.find((s) => s?.['@type'] === 'FAQPage');
    const articleSchema = schemas.find((s) => ['Article', 'BlogPosting', 'NewsArticle', 'TechArticle'].includes(s?.['@type']));
    const orgSameAs = orgSchema?.sameAs;
    const organizationSameAsCount = Array.isArray(orgSameAs) ? orgSameAs.length : (orgSameAs ? 1 : 0);

    // HTML signals
    const hasCanonical = /<link[^>]*rel=["']canonical["']/i.test(html);
    const hasOpenGraph = /<meta[^>]*property=["']og:title["']/i.test(html) && /<meta[^>]*property=["']og:description["']/i.test(html);
    const hasTimeElement = /<time[^>]*datetime/i.test(html);

    // SSR content check (strip scripts, check remaining text length)
    const textContent = html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const hasSSRContent = textContent.length > 500;

    // Word count from server-rendered text
    const wordCount = textContent.split(' ').filter((w) => w.length > 2).length;

    // Heading counts
    const h1Count = (html.match(/<h1[\s>]/gi) || []).length;
    const h2Count = (html.match(/<h2[\s>]/gi) || []).length;

    // IndexNow check (look for key reference in robots.txt)
    let hasIndexNow = false;
    const indexNowKeyMatch = robotsTxt.match(/IndexNow-Key:\s*([a-f0-9-]+)/i);
    if (indexNowKeyMatch) {
      const keyRes = await safeFetch(`${baseUrl}/${indexNowKeyMatch[1]}.txt`);
      hasIndexNow = keyRes.ok;
    }

    const result: LiveGeoData = {
      ok: true,
      url: baseUrl,
      analyzedAt: new Date().toISOString(),
      allowsGPTBot,
      allowsClaudeBot,
      allowsPerplexityBot,
      allowsGoogleExtended,
      allowsOAISearchBot,
      allowsBingbot,
      allowsApplebot,
      hasLlmsTxt: llmsRes.ok && llmsRes.text.length > 10,
      hasSitemap: sitemapRes.ok,
      hasCanonical,
      hasOpenGraph,
      hasIndexNow,
      hasSSRContent,
      schemaTypes,
      hasFAQPageSchema: !!faqSchema,
      hasOrganizationSchema: !!orgSchema,
      hasArticleSchema: !!articleSchema,
      organizationSameAsCount,
      hasTimeElement,
      wordCount,
      h1Count,
      h2Count,
      warnings,
    };

    return res.json(result);
  } catch (err: any) {
    return res.json({ ok: false, url: baseUrl, analyzedAt: new Date().toISOString(), error: err.message, warnings: [err.message] });
  }
});

export default router;
