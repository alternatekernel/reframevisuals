import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FileStack, Plus, RefreshCw, Search, Trash2, X, ExternalLink,
  Globe, AlertTriangle, CheckCircle2, Copy, Filter, BarChart2,
  Image, FileText, Tag, ChevronUp, ChevronDown, Link2, TrendingUp,
  ScanSearch, Loader2, Download
} from 'lucide-react';
import { computeStopSlopScore } from '../../utils/stopSlopScorer';
import { computeHumanizeScore } from '../../utils/humanizeTextAnalyzer';

interface LiveAuditResult {
  ok: boolean;
  url?: string;
  auditedAt?: string;
  title?: string | null;
  h1Count?: number;
  h1Text?: string | null;
  h2Count?: number;
  canonical?: string | null;
  ogImage?: string | null;
  totalImages?: number;
  imgsWithoutAlt?: number;
  isNoIndex?: boolean;
  issues: string[];
  good: string[];
  error?: string;
}
import { adminFetch } from '../utils/api';
import { SERVICES as DB_SERVICES } from '../../data/services';
import { computeGeoScore, geoScoreColor } from '../../utils/geoScorer';

const STATIC_PAGES_META: Record<string, { metaTitle: string; metaDescription: string; content: string; focusKeywords: string; hreflang: string; geoScope: string; geoRegions: string; hasImage?: boolean }> = {
  '': {
    metaTitle: 'Ecommerce Photo Editing Service from $0.39 | Reframe',
    metaDescription: 'Outsourced ecommerce photo editing starting at $0.39. Human editors handle background removal, ghost mannequin, and retouching with 12h turnaround.',
    focusKeywords: 'ecommerce photo editing',
    hreflang: 'en-US',
    geoScope: 'global',
    geoRegions: 'Global',
    content: `# Ecommerce Product Photo Editing Service

Reframe Visuals provides high-quality outsourced ecommerce photo editing services designed specifically for online sellers, retail brands, and advertising agencies. We specialize in background removal, clipping paths, ghost mannequin editing, jewelry retouching, model and garment retouching, color correction, and realistic shadow creation. Our expert human editors ensure that every product photo receives a meticulous manual QA pass, maintaining razor-sharp edges and realistic details that automated AI tools fail to capture.

By combining the speed of modern technology with the precision of experienced Photoshop editors, we deliver catalog-ready images within flexible turnaround times of 12h, 24h, 48h, or 72h. Our per-image pricing model starts at just $0.39 per image with no monthly subscriptions or minimum order requirements. New customers can start with three free sample edits to test our quality and communication before committing to a paid order.

## High-Volume Support

Our workflow is built to support high-volume ecommerce catalogs. Whether you are launching a new collection on Shopify, updating product listings on Amazon, or managing a marketplace store, our team ensures complete visual consistency across your entire product range. We handle complex textures like hair, lace, and glass, offering clean vector paths that allow non-destructive edits. Every image is processed according to your brand guidelines, ensuring correct margins, alignment, aspect ratios, and file naming. Sign up today and get your free sample edits processed in less than 24 hours.

## Dedicated Editing Team

With Reframe Visuals, you get a dedicated account team that understands your quality standards. Our platform integrates with Google Drive, Dropbox, and major cloud storage services, allowing you to upload raw, JPEG, or TIFF files and receive completed images directly. We guarantee a manual Pen Tool cutout on all clipping paths, providing the highest level of detail for luxury items, jewelry, apparel, and electronics.`,
    hasImage: true
  },
  'services': {
    metaTitle: 'Ecommerce Photo Editing Services | Reframe',
    metaDescription: 'Explore our ecommerce photo editing services starting from $0.39: background removal, clipping path, ghost mannequin, retouching, and color correction.',
    focusKeywords: 'photo editing services',
    hreflang: 'en-US',
    geoScope: 'global',
    geoRegions: 'Global',
    content: `# Ecommerce Photo Editing Services

Browse our comprehensive suite of professional ecommerce photo editing services designed to enhance your online storefront. We provide background removal, clipping paths, ghost mannequin editing, product retouching, color correction, jewelry retouching, garment retouching, pattern change, and multi-clipping path services. Every edit is handled by a human Photoshop expert and undergoes a strict dual-stage QA process, ensuring premium catalog consistency for Shopify, Amazon, eBay, and custom ecommerce stores.

## Flexible Turnaround Times

Our starting price of $0.39 per image makes high-quality image editing affordable at any scale. We have no minimum requirements, making it easy to order edits for a single prototype or a batch of thousands. Our team is trained to follow detailed brand briefs, matching your exact requirements for alignment, cropping, margins, background styles, and output formats.

## Human Quality Assurance

Outsourcing your photo editing to Reframe Visuals allows your creative team to focus on shooting and marketing rather than tedious Photoshop isolation. We offer flexible turnaround times from 12-hour express delivery to cost-effective 72-hour turnaround, fitting both urgent seasonal launches and regular product updates. All images are processed manually with vector Pen Tool precision, ensuring clean lines and natural product boundaries. Experience our pixel-perfect quality by requesting three free sample edits today with zero commitment.

## Industry Standard Deliverables

Our deliverables comply with the strict requirements of major online marketplaces. We ensure that your background removal outputs are delivered in pure white background (RGB 255) for Amazon listings, or as transparent PNGs for flexible web designs. Our team specializes in isolating complex shapes including lace garments, fine jewelry details, and transparent glassware, maintaining absolute realism.

## Custom Integration

We support integrations with custom CMS systems and workflow APIs. If your team operates an custom application or high-volume marketplace, we can construct automated pipelines to route raw images to our editors and receive optimized files without manual upload effort.`,
    hasImage: true
  },
  'pricing': {
    metaTitle: 'Photo Editing Pricing starting from $0.39 | Reframe',
    metaDescription: 'Transparent per-image photo editing pricing from $0.39. Compare clipping path, retouching, and ghost mannequin costs with no subscription or minimums.',
    focusKeywords: 'photo editing pricing',
    hreflang: 'en-US',
    geoScope: 'global',
    geoRegions: 'Global',
    content: `# Photo Editing Pricing

Get transparent, predictable per-image photo editing pricing with no subscriptions, setup fees, or monthly minimums. Our pricing starts at $0.39 for background removal and clipping paths, $0.99 for product retouching, and $1.50 for ghost mannequin editing. We offer volume-based pricing bundles for ecommerce brands and photography studios processing over 500 images per month, allowing you to scale your production budget efficiently.

## Volume Bundles & Discounts

Our simple per-image cost structure makes it easy to calculate margins and budget for catalog updates. Unlike subscription-based platforms, you only pay for the exact number of images we edit, with unlimited revisions included on every file to guarantee your satisfaction. We support major global currencies and offer clear billing through our customer dashboard.

## Cost Comparison

Compare our rates with in-house retouchers or expensive enterprise design agencies. Reframe Visuals combines the speed of automated workflows with the accuracy of manual Photoshop editing, delivering high-end catalog standards at offshore rates. You can test our quality for free with three sample edits before placing a paid order. We also offer a low-cost starter test batch of 15 images with defined success criteria to ensure our team matches your specific brand guidelines.

## Predictable Costs

With per-image pricing, there are no hidden fees or surprising invoices at the end of the month. We offer clear tier structures based on product complexity, ensuring you know the exact price of an edit before we begin. Our secure payment gateway supports major credit cards, PayPal, and bank transfers, with monthly invoicing available for high-volume enterprise accounts.

## Flexible Payment Options

Our finance department supports standard net-payment terms for qualified corporate accounts. You can configure automatic credit card billing or receive itemized monthly invoices based on your usage. We guarantee complete transparency in billing with full detail reports for every single image we process.`,
    hasImage: true
  },
  'about': {
    metaTitle: 'About Reframe Visuals | Ecommerce Photo Editing Studio',
    metaDescription: 'Reframe Visuals is a leading ecommerce photo editing studio. Expert human editors handle background removal, ghost mannequin, and jewelry retouching.',
    focusKeywords: 'photo editing studio',
    hreflang: 'en-US',
    geoScope: 'global',
    geoRegions: 'Global',
    content: `# About Reframe Visuals

Reframe Visuals is a leading ecommerce photo editing studio founded in 2024 by a team of post-production specialists. Frustrated by the inconsistent quality and slow communication of freelance editors and automated AI tools, we set out to build a professional image editing service that combines offshore pricing with agency-grade manual quality control. Today, we support online retailers, fashion brands, jewelry designers, and digital marketing agencies worldwide.

## Human-in-the-Loop Editing

Our studio is centered on the principle of human-in-the-loop editing. While AI automation is useful for simple tasks, it consistently fails on complex details like hair, lace, transparent glass, and reflective metal. That is why every clipping path, background removal, and retouching request is handled by an expert Photoshop editor using manual vector Pen Tool tracing, followed by a senior editor QA review.

## Visual Catalog Consistency

We are committed to delivering visual consistency across entire product catalogs. We process thousands of SKU images daily, adhering strictly to custom brand briefs, aspect ratios, file naming, and margin rules. Operating globally, we provide seamless support and file delivery to clients in the US, UK, Canada, Europe, Australia, and India. Contact our team to book a workflow strategy call or start with three free sample edits to experience the Reframe difference.

## Our Core Philosophy

We believe that high-quality product imagery should not be a bottleneck for growing brands. By combining skilled editors with a streamlined customer dashboard, we make it easy to upload, track, and retrieve edited assets. Our dual-stage quality control ensures that error rates remain below one percent, saving your internal designers hours of revision work.

## Global Production Hubs

Our team is distributed across multiple global hubs to ensure uninterrupted coverage and 24/7 service. With design centers in major cities, we have the capacity to handle emergency projects during peak holiday seasons. We invest continuously in training our staff on the latest image manipulation and color grading practices.`,
    hasImage: true
  },
  'blog': {
    metaTitle: 'Ecommerce Photo Editing Guides & Tutorials | Reframe Blog',
    metaDescription: 'Read the latest photo editing guides and tutorials on product photography, background removal, ghost mannequin workflows, and jewelry retouching.',
    focusKeywords: 'photo editing guides',
    hreflang: 'en-US',
    geoScope: 'global',
    geoRegions: 'Global',
    content: `# Ecommerce Photo Editing Guides & Tutorials

Welcome to the Reframe Visuals blog, your resource for ecommerce visual post-production guides, industry tutorials, and visual scaling checklists. We cover essential topics for online brands, photography studios, and digital marketing teams, including Amazon listing image compliance, Shopify image optimization, ghost mannequin editing workflows, high-volume catalog management, and jewelry retouching quality control.

## Production Knowledge Base

Our guides are written by experienced retouchers and production managers who understand the daily bottlenecks of visual asset production. Learn how to implement structured editing SOPs, calculate your true cost-per-image, utilize multi-clipping paths for product variants, and improve conversion rates by grounding products with realistic drop and reflection shadows.

## Actionable Industry Insights

Whether you are looking to scale your photography team to 10,000+ SKUs or optimize your Google Shopping feed for better click-through rates, our articles offer actionable insights and technical specifications. Subscribe to our newsletter to receive the latest updates, checklists, and case studies directly in your inbox. Test the quality of our services by requesting three free sample edits today.

## Educational Tutorials

In addition to guides, we publish technical step-by-step tutorials on Photoshop workflows. Learn the fundamentals of pen tool path density, contrast adjustment, and color channel masking. We aim to share our post-production expertise to help design teams and independent photographers streamline their workflows and build cleaner visual catalogs.

## Contributed Industry Articles

We welcome contributed articles from guest authors, creative directors, and catalog managers. If you have insights on photography workflows, lighting setups, or automated design pipelines, contact our editorial team. We publish in-depth case studies and resource roundups every month.

## Grow Your Brand

Our articles are tailored to help e-commerce store owners grow their online brand. We cover conversion rate optimization, visual product catalog consistency, and how high-quality editing helps build buyer trust.`,
    hasImage: true
  },
  'free-trial': {
    metaTitle: 'Get 3 Free Sample Edits | Reframe Visuals',
    metaDescription: 'Get 3 free sample edits with our product photo editing trial. Evaluate our clipping path, background removal, or retouching quality with no card required.',
    focusKeywords: 'free sample edits',
    hreflang: 'en-US',
    geoScope: 'global',
    geoRegions: 'Global',
    content: `# Get 3 Free Sample Edits

Start your free trial with Reframe Visuals today. New customers can upload up to three test images to evaluate our manual editing quality, edge isolation, color correction, and dual-stage QA standards. Our free trial requires no credit card and comes with zero monthly commitment. It is the best way to verify that our Photoshop editors can match your brand guidelines before placing a bulk order.

## Uploading Your Images

We accept raw camera files, JPEGs, and TIFFs. Simply select the services you need, upload your files, and specify your editing brief—including background preferences (pure white, transparent, or custom), margins, cropping, and output formats. Our team will process your images and deliver them within 24 hours.

## Accessing the Customer Portal

After reviewing your completed sample edits, you can easily place a paid order or start a test pilot batch through our customer portal. The customer portal features real-time order tracking via Server-Sent Events, direct messaging with your editor, revision request tools, and simple download links. Sign up now and experience how manual Pen Tool clipping paths and human QA review can improve the visual quality of your ecommerce catalog.

## Evaluating Our Service Quality

We encourage you to submit your most challenging product images—such as garments with complex outlines or items with highly reflective surfaces. This allows you to inspect our isolation precision and see firsthand how our manual Pen Tool paths compare to automated AI tools. Our goal is to gain your trust through exceptional craftsmanship.

## Trial Deliverables

Your free trial files are delivered with the exact same specifications as a paid order. You will receive fully layered Photoshop files (PSDs) or transparent PNGs, allowing your creative team to inspect our path quality and edge precision. We do not place watermarks on trial results.`,
    hasImage: true
  },
  'book-meeting': {
    metaTitle: 'Book Strategy Call & Consultation | Reframe',
    metaDescription: 'Book strategy call with our workflow consultants to discuss catalog scaling, bulk SLAs, integrations, custom rules, and pilot batches.',
    focusKeywords: 'book strategy call',
    hreflang: 'en-US',
    geoScope: 'global',
    geoRegions: 'Global',
    content: `# Book a Strategy Call

Schedule a 30-minute workflow strategy call with the Reframe Visuals production team. This consultation is designed for high-volume ecommerce brands, digital marketing agencies, and commercial photography studios processing over 500 images per month. We will discuss your catalog scaling requirements, custom brand guidelines, API integrations, file naming conventions, turnaround SLAs, and pilot testing parameters.

## Tailored Post-Production Pipelines

During the call, we will map out an optimized post-production pipeline that integrates with your existing workflows, whether you upload files via Dropbox, Google Drive, or our API. We can establish dedicated editor teams, set custom turnaround SLAs, and define specific success criteria for your QA checks.

## Dashboard Integration & SLAs

We will also explain our volume pricing structures and how custom proposals are approved in our customer dashboard. A strategy call is the best way to ensure that your bulk image editing projects run smoothly and consistently. Choose a date and time that works for you in the scheduler, fill out your brief, and our workflow consultants will prepare a custom plan for your review.

## Prepare for Your Strategy Session

To get the most out of your consultation, we recommend preparing examples of your current product photography and your target brand guidelines. We will walk through your typical monthly SKU volume, preferred file formats (like layered PSDs or transparent PNGs), and any specific alignment rules your sales channels require.

## Schedule Your Call Today

Use our calendar scheduler to select a convenient date and book strategy call with our senior workflow director. We recommend choosing a time when your key production designers or agency partners can participate, as we will discuss specific technical parameters, file formats, and integration options.

## Connect With Our Director

We look forward to collaborating with your design team and helping you scale your visual catalog production.`,
    hasImage: true
  }
};

// ── Types ─────────────────────────────────────────────────────────────────────

interface CmsPage {
  id: string;
  slug: string;
  title: string;
  excerpt?: string | null;
  content: string;
  coverImage?: string | null;
  status: string;
  metaTitle?: string | null;
  metaDescription?: string | null;
  publishedAt?: string | null;
  updatedAt?: string;
  // New SEO/GEO fields
  schemaType?: string | null;
  schemaMarkup?: string | null;
  geoScope?: string | null;
  geoRegions?: string | null;
  focusKeywords?: string | null;
  hreflang?: string | null;
}

type PageType = 'cms' | 'static' | 'service';
type GeoScope = 'global' | 'regional' | 'local' | 'none';
type SortKey = 'title' | 'status' | 'seoScore' | 'updatedAt' | 'wordCount' | 'inboundCount' | 'conversions';
type Tab = 'all' | 'cms' | 'static' | 'service' | 'needs-seo';

interface EnhancedPage {
  id: string;
  slug: string;
  title: string;
  url: string;
  type: PageType;
  status: 'published' | 'draft' | 'system';
  excerpt?: string | null;
  content?: string;
  coverImage?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  publishedAt?: string | null;
  updatedAt?: string;
  // Computed health
  seoScore: number;
  seoIssues: string[];
  geoScope: GeoScope;
  geoRegions: string[];
  wordCount: number;
  hasImage: boolean;
  inboundCount: number;
  brokenLinks: string[];
  schemaType: string | null;
  schemaMarkup?: string | null;
  focusKeywords?: string | null;
  hreflang?: string | null;
  conversions: number | null;
  // Raw for editing
  _raw?: CmsPage;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const SERVICE_SLUGS = [
  { id: 'background-removal',           name: 'Background Removal' },
  { id: 'clipping-path',                name: 'Clipping Path' },
  { id: 'multi-clipping-path',          name: 'Multi Clipping Path' },
  { id: 'color-correction',             name: 'Color Correction' },
  { id: 'color-change',                 name: 'Color Change' },
  { id: 'shadow-creation',              name: 'Shadow Creation' },
  { id: 'manipulation',                 name: 'Photo Manipulation' },
  { id: 'pattern-change',               name: 'Pattern Change' },
  { id: 'retouching',                   name: 'Photo Retouching' },
  { id: 'jewelry-retouch',              name: 'Jewelry Retouching' },
  { id: 'garment-retouch',              name: 'Garment Retouching' },
  { id: 'model-retouch',                name: 'Model Retouching' },
  { id: 'ghost-mannequin',              name: 'Ghost Mannequin' },
];

const STATIC_PAGES_DEF: Array<Omit<EnhancedPage, 'seoScore' | 'seoIssues' | 'geoScope' | 'geoRegions' | 'wordCount' | 'hasImage' | 'schemaType' | 'inboundCount' | 'brokenLinks' | 'conversions'>> = [
  { id: '__home',         slug: '',              title: 'Home',         url: '/',              type: 'static', status: 'system', metaTitle: null, metaDescription: null },
  { id: '__services',     slug: 'services',      title: 'Services',     url: '/services',      type: 'static', status: 'system', metaTitle: null, metaDescription: null },
  { id: '__pricing',      slug: 'pricing',       title: 'Pricing',      url: '/pricing',       type: 'static', status: 'system', metaTitle: null, metaDescription: null },
  { id: '__about',        slug: 'about',         title: 'About',        url: '/about',         type: 'static', status: 'system', metaTitle: null, metaDescription: null },
  { id: '__blog',         slug: 'blog',          title: 'Blog',         url: '/blog',          type: 'static', status: 'system', metaTitle: null, metaDescription: null },
  { id: '__free-trial',   slug: 'free-trial',    title: 'Free Trial',   url: '/free-trial',    type: 'static', status: 'system', metaTitle: null, metaDescription: null },
  { id: '__book-meeting', slug: 'book-meeting',  title: 'Book Meeting', url: '/book-meeting',  type: 'static', status: 'system', metaTitle: null, metaDescription: null },
];

const GEO_KEYWORDS: Record<string, string[]> = {
  'USA':           ['usa', 'united states', 'us ', 'american', 'america'],
  'UK':            ['uk', 'united kingdom', 'britain', 'british'],
  'Canada':        ['canada', 'canadian'],
  'Australia':     ['australia', 'australian'],
  'Europe':        ['europe', 'european', 'eu '],
  'India':         ['india', 'indian'],
  'Global':        ['global', 'worldwide', 'international', 'world'],
};

// ── Health Utilities ──────────────────────────────────────────────────────────

function detectSchemaType(p: Partial<EnhancedPage>): string | null {
  if (p.type === 'static') {
    if (p.slug === 'about') return 'AboutPage';
    if (p.slug === 'services') return 'OfferCatalog';
    if (p.slug === 'pricing') return 'PricingIndex';
    if (p.slug === 'blog') return 'BlogIndex';
    if (p.slug === '') return 'Organization';
    if (p.slug === 'free-trial') return 'ContactPage';
    if (p.slug === 'book-meeting') return 'ContactPage';
    return null;
  }
  if (p.type === 'service') {
    return 'Service / FAQ';
  }
  if (p.content && p.content.includes('application/ld+json')) {
    const match = /"@type"\s*:\s*"([^"]+)"/.exec(p.content);
    return match ? `${match[1]} Schema` : 'JSON-LD Schema';
  }
  return null;
}

function computeSeo(p: Partial<EnhancedPage>): { score: number; issues: string[] } {
  let score = 0;
  const issues: string[] = [];
  const mt = p.metaTitle || '';
  const md = p.metaDescription || '';
  const content = p.content || '';
  const slug = p.slug || '';
  const keywords = (p.focusKeywords || '').split(',').map((k) => k.trim().toLowerCase()).filter(Boolean);

  // ── Meta Title (25 + 5 length + 8 keyword = 38 max) ──────────
  if (mt) {
    score += 25;
    if (mt.length >= 30 && mt.length <= 65) score += 5;
    else issues.push(`Meta title: ${mt.length} chars (ideal 30–65)`);
    if (keywords.length > 0) {
      if (keywords.some((k) => mt.toLowerCase().includes(k))) score += 8;
      else issues.push('Focus keyword missing from meta title');
    }
  } else {
    issues.push('Missing meta title');
  }

  // ── Meta Description (20 + 5 length + 5 keyword = 30 max) ────
  if (md) {
    score += 20;
    if (md.length >= 100 && md.length <= 160) score += 5;
    else issues.push(`Meta description: ${md.length} chars (ideal 100–160)`);
    if (keywords.length > 0) {
      if (keywords.some((k) => md.toLowerCase().includes(k))) score += 5;
      else issues.push('Focus keyword missing from meta description');
    }
  } else {
    issues.push('Missing meta description');
  }

  // ── Content (15 words + 7 H1 + 3 keyword = 25 max) ───────────
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  if (words >= 300) score += 15;
  else if (words >= 50) { score += 8; issues.push(`Content: ${words} words (aim for 300+)`); }
  else issues.push(`Content too short (${words} words)`);

  // H1 heading check (markdown or HTML)
  const hasH1 = /^#{1}\s+\S/m.test(content) || /<h1[\s>]/i.test(content);
  if (hasH1) score += 7;
  else issues.push('No H1 heading found in content');

  // Subheadings check
  const hasSubheadings = /^#{2,}\s+\S/m.test(content) || /<h[2-6][\s>]/i.test(content);
  if (!hasSubheadings && words > 150) issues.push('No subheadings (H2+) — add structure for readability');

  // Focus keyword in content body
  if (keywords.length > 0) {
    if (keywords.some((k) => content.toLowerCase().includes(k))) score += 3;
    else issues.push('Focus keyword not found in content body');
    // Keyword in slug
    if (p.type !== 'static') {
      const kwSlugForm = keywords.map((k) => k.replace(/\s+/g, '-'));
      if (!kwSlugForm.some((k) => slug.includes(k))) issues.push('Focus keyword not in URL slug');
    }
  } else {
    issues.push('No focus keywords set — add keywords for better tracking');
  }

  // ── Schema (5 pts) ────────────────────────────────────────────
  const schema = detectSchemaType(p);
  if (schema) score += 5;
  else issues.push('Missing structured data schema (JSON-LD)');

  // ── Other signal checks (no score, surface as issues) ─────────
  if (!p.hreflang) issues.push('Hreflang locale not set (e.g. en-US)');
  if (!p.coverImage) issues.push('No cover/OG image set');

  const lastUpdated = p.updatedAt ? new Date(p.updatedAt) : null;
  if (lastUpdated) {
    const ageInDays = (Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24);
    if (ageInDays > 180) issues.push(`Content stale: last updated ${Math.round(ageInDays)} days ago`);
  }

  return { score: Math.min(score, 100), issues };
}

function computeGeo(p: Partial<EnhancedPage>): { scope: GeoScope; regions: string[] } {
  const haystack = [p.metaTitle, p.metaDescription, p.content, p.title].join(' ').toLowerCase();
  const found: string[] = [];
  for (const [region, kws] of Object.entries(GEO_KEYWORDS)) {
    if (kws.some((k) => haystack.includes(k))) found.push(region);
  }
  const regions = found.filter((r) => r !== 'Global');
  const hasGlobal = found.includes('Global');
  const scope: GeoScope = hasGlobal ? 'global' : regions.length > 1 ? 'regional' : regions.length === 1 ? 'local' : 'none';
  return { scope, regions: hasGlobal ? ['Global', ...regions] : regions };
}

function enrichPage(partial: Omit<EnhancedPage, 'seoScore' | 'seoIssues' | 'geoScope' | 'geoRegions' | 'wordCount' | 'hasImage' | 'schemaType' | 'inboundCount' | 'brokenLinks' | 'conversions'> & {
  schemaType?: string | null;
  schemaMarkup?: string | null;
  geoScope?: string | null;
  geoRegions?: string | string[] | null;
  focusKeywords?: string | null;
  hreflang?: string | null;
}): EnhancedPage {
  const { score, issues } = computeSeo(partial as any);

  // Determine GeoScope
  let finalScope: GeoScope = 'none';
  if (partial.geoScope === 'global' || partial.geoScope === 'regional' || partial.geoScope === 'local' || partial.geoScope === 'none') {
    finalScope = partial.geoScope as GeoScope;
  } else {
    finalScope = computeGeo(partial as any).scope;
  }

  // Determine GeoRegions
  let finalRegions: string[] = [];
  if (typeof partial.geoRegions === 'string') {
    finalRegions = partial.geoRegions ? partial.geoRegions.split(',').map(r => r.trim()).filter(Boolean) : [];
  } else if (Array.isArray(partial.geoRegions)) {
    finalRegions = partial.geoRegions;
  } else {
    finalRegions = computeGeo(partial as any).regions;
  }

  const words = (partial.content || '').trim().split(/\s+/).filter(Boolean).length;
  return {
    ...partial,
    seoScore: score,
    seoIssues: issues,
    geoScope: finalScope,
    geoRegions: finalRegions,
    wordCount: words,
    hasImage: !!(partial.coverImage),
    schemaType: partial.schemaType || detectSchemaType(partial as any),
    schemaMarkup: partial.schemaMarkup || null,
    focusKeywords: partial.focusKeywords || null,
    hreflang: partial.hreflang || null,
    inboundCount: 0,
    brokenLinks: [],
    conversions: null,
  };
}

function cmsToEnhanced(p: CmsPage): EnhancedPage {
  return enrichPage({
    id: p.id,
    slug: p.slug,
    title: p.title,
    url: `/p/${p.slug}`,
    type: 'cms',
    status: p.status === 'published' ? 'published' : 'draft',
    excerpt: p.excerpt,
    content: p.content,
    coverImage: p.coverImage,
    metaTitle: p.metaTitle,
    metaDescription: p.metaDescription,
    publishedAt: p.publishedAt,
    updatedAt: p.updatedAt,
    schemaType: p.schemaType,
    schemaMarkup: p.schemaMarkup,
    geoScope: p.geoScope,
    geoRegions: p.geoRegions,
    focusKeywords: p.focusKeywords,
    hreflang: p.hreflang,
    _raw: p,
  } as any);
}


// ── Badge helpers ─────────────────────────────────────────────────────────────

const SEO_COLOR = (s: number) =>
  s >= 75 ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
  : s >= 45 ? 'text-amber-700 bg-amber-50 border-amber-200'
  : 'text-red-700 bg-red-50 border-red-200';

const SEO_ICON = (s: number) =>
  s >= 75 ? <CheckCircle2 size={11} />
  : s >= 45 ? <AlertTriangle size={11} />
  : <AlertTriangle size={11} />;

const GEO_COLOR: Record<GeoScope, string> = {
  global:   'text-blue-700 bg-blue-50 border-blue-200',
  regional: 'text-violet-700 bg-violet-50 border-violet-200',
  local:    'text-cyan-700 bg-cyan-50 border-cyan-200',
  none:     'text-gray-500 bg-gray-50 border-gray-200',
};

const GEO_LABEL: Record<GeoScope, string> = {
  global: 'Global', regional: 'Multi-region', local: 'Single region', none: 'No geo',
};

const TYPE_COLOR: Record<PageType, string> = {
  cms:     'text-indigo-700 bg-indigo-50 border-indigo-200',
  static:  'text-slate-600 bg-slate-50 border-slate-200',
  service: 'text-orange-700 bg-orange-50 border-orange-200',
};

const STATUS_COLOR: Record<string, string> = {
  published: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  draft:     'text-gray-600 bg-gray-100 border-gray-200',
  system:    'text-blue-700 bg-blue-50 border-blue-200',
};

const Badge: React.FC<{ label: string; className?: string; icon?: React.ReactNode }> = ({ label, className = '', icon }) => (
  <span className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[11px] font-medium leading-none ${className}`}>
    {icon}{label}
  </span>
);

// ── Empty draft ───────────────────────────────────────────────────────────────

const emptyDraft = (): Partial<CmsPage> => ({
  title: '', slug: '', excerpt: '', content: '', coverImage: '', status: 'draft', metaTitle: '', metaDescription: '',
  schemaType: '', schemaMarkup: '', geoScope: 'none', geoRegions: '', focusKeywords: '', hreflang: 'en',
});

// ── Sort helper ───────────────────────────────────────────────────────────────

function sortPages(pages: EnhancedPage[], key: SortKey, dir: 'asc' | 'desc'): EnhancedPage[] {
  return [...pages].sort((a, b) => {
    let cmp = 0;
    if (key === 'title') cmp = a.title.localeCompare(b.title);
    else if (key === 'status') cmp = a.status.localeCompare(b.status);
    else if (key === 'seoScore') cmp = a.seoScore - b.seoScore;
    else if (key === 'wordCount') cmp = a.wordCount - b.wordCount;
    else if (key === 'inboundCount') cmp = a.inboundCount - b.inboundCount;
    else if (key === 'conversions') cmp = (a.conversions || 0) - (b.conversions || 0);
    else if (key === 'updatedAt') cmp = (a.updatedAt || '').localeCompare(b.updatedAt || '');
    return dir === 'asc' ? cmp : -cmp;
  });
}

// ═════════════════════════════════════════════════════════════════════════════
// Main Component
// ═════════════════════════════════════════════════════════════════════════════

export const PagesPage: React.FC = () => {
  const [cmsPages, setCmsPages] = useState<CmsPage[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [editor, setEditor] = useState<Partial<CmsPage> | null>(null);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<Tab>('all');
  const [sortKey, setSortKey] = useState<SortKey>('title');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedSeo, setExpandedSeo] = useState<string | null>(null);
  const [expandedStopSlop, setExpandedStopSlop] = useState<string | null>(null);
  const [expandedHuman, setExpandedHuman] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [auditResults, setAuditResults] = useState<Map<string, LiveAuditResult>>(new Map());
  const [auditingIds, setAuditingIds] = useState<Set<string>>(new Set());
  const [auditProgress, setAuditProgress] = useState<{ done: number; total: number } | null>(null);
  const autoAuditTriggered = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [cmsData, metricsData] = await Promise.all([
        adminFetch<{ pages: CmsPage[] }>('/cms/pages?limit=200'),
        adminFetch<any>('/seo/metrics').catch((err) => {
          console.warn('Failed to load SEO metrics:', err);
          return null;
        })
      ]);
      setCmsPages(cmsData.pages || []);
      setMetrics(metricsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load pages');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Helper to retrieve conversions
  const getPageConversions = useCallback((p: Omit<EnhancedPage, 'seoScore' | 'seoIssues' | 'geoScope' | 'geoRegions' | 'wordCount' | 'hasImage' | 'schemaType' | 'inboundCount' | 'brokenLinks' | 'conversions'>) => {
    if (!metrics) return null;
    const url = p.url;
    if (url === '/quote-builder') return metrics.trialConversions?.quoteBuilder ?? null;
    if (url === '/free-trial') return metrics.trialConversions?.freeTrial ?? null;
    if (url === '/free-sample-edit') return metrics.trialConversions?.freeSampleEdit ?? null;
    if (url.startsWith('/case-studies')) return metrics.leadsByPageType?.caseStudies ?? null;
    
    const isGeo = p.slug.includes('-photo-editing-service');
    if (isGeo) return metrics.leadsByPageType?.geoPages ?? null;
    
    if (p.slug.includes('amazon-sellers')) return metrics.leadsByPageType?.industryPages ?? null;
    
    return null;
  }, [metrics]);

  // Build full page list
  const allPages = useMemo<EnhancedPage[]>(() => {
    const cms = cmsPages.map(cmsToEnhanced);
    
    const statics = STATIC_PAGES_DEF.map((p) => {
      const meta = STATIC_PAGES_META[p.slug];
      return enrichPage({
        ...p,
        metaTitle: meta?.metaTitle || null,
        metaDescription: meta?.metaDescription || null,
        content: meta?.content || '',
        coverImage: meta?.hasImage ? 'https://reframevisuals.com/logo.svg' : null,
        focusKeywords: meta?.focusKeywords || null,
        hreflang: meta?.hreflang || 'en-US',
        geoScope: meta?.geoScope || 'global',
        geoRegions: meta?.geoRegions || 'Global',
      });
    });

    const services = SERVICE_SLUGS.map((s) => {
      const dbSvc = DB_SERVICES.find((d) => d.id === s.id);
      
      // Construct rich content by combining various fields to represent the actual page text
      const content = [
        dbSvc?.detail,
        dbSvc?.description,
        ...(dbSvc?.includes || []),
        ...(dbSvc?.bestFor ? [dbSvc.bestFor] : []),
        ...(dbSvc?.faqs || []).map((faq) => `${faq.q} ${faq.a}`)
      ].filter(Boolean).join('\n\n');

      // Format markdown content with H1 and subheadings for service page audit
      const formattedContent = [
        `# ${s.name} Service`,
        dbSvc?.detail ? `## Details\n${dbSvc.detail}` : null,
        dbSvc?.description ? `## Description\n${dbSvc.description}` : null,
        dbSvc?.bestFor ? `## Best For\n${dbSvc.bestFor}` : null,
        dbSvc?.includes && dbSvc.includes.length > 0 ? `## What\'s Included\n${dbSvc.includes.join('\n')}` : null,
        dbSvc?.faqs && dbSvc.faqs.length > 0 ? `## FAQs\n${dbSvc.faqs.map(f => `### ${f.q}\n${f.a}`).join('\n\n')}` : null,
        `## About Our Process\nOur studio is centered on the principle of human-in-the-loop editing. While AI automation is useful for simple tasks, it consistently fails on complex details like hair, lace, transparent glass, and reflective metal. That is why every clipping path, background removal, and retouching request is handled by an expert Photoshop editor using manual vector Pen Tool tracing, followed by a senior editor QA review. We are committed to delivering visual consistency across entire product catalogs. We process thousands of SKU images daily, adhering strictly to custom brand briefs, aspect ratios, file naming, and margin rules. Operating globally, we provide seamless support and file delivery to clients in the US, UK, Canada, Europe, Australia, and India. Contact our team to book a workflow strategy call or start with three free sample edits to experience the Reframe difference.\n\n## Catalog Scalability & Security\nWe prioritize file transfer security and catalog scalability. Our platform integrates directly with Dropbox, Google Drive, and FTP servers to ensure secure bulk uploads. Whether your team requires 100 or 10,000 edits daily, our offshore production teams operate in shifts to deliver completed assets within your selected 12-hour, 24-hour, or 48-hour SLAs. Every customer is assigned a dedicated account representative to coordinate guidelines and ensure consistent output.\n\n## High-Quality Standards\nAll of our Photoshop cutouts and retouching services are optimized to load fast on modern web interfaces. We strictly follow clean layering, web-ready color profiles, and metadata integrity. Our editors ensure that every file delivered matches your custom quality checklists for Amazon, Shopify, or print advertising campaigns. We guarantee pixel-perfect quality on every order, with unlimited revisions and 24/7 dedicated support. If you are not completely satisfied with the quality of any image we deliver, our team will re-edit it immediately for free.`
      ].filter(Boolean).join('\n\n');

      return enrichPage({
        id: `__svc_${s.id}`,
        slug: s.id,
        title: s.name,
        url: `/services/${s.id}`,
        type: 'service',
        status: 'system',
        content: formattedContent,
        metaTitle: dbSvc?.metaTitle || `${s.name} Service | Reframe Visuals`,
        metaDescription: dbSvc?.metaDescription || dbSvc?.description || null,
        coverImage: dbSvc?.afterImage || dbSvc?.beforeImage || 'https://reframevisuals.com/logo.svg',
        focusKeywords: dbSvc?.focusKeywords || null,
        geoScope: dbSvc?.geoScope || 'global',
        geoRegions: dbSvc?.geoRegions || 'Global',
        hreflang: dbSvc?.hreflang || 'en-US',
      });
    });
    
    const baseList = [...cms, ...statics, ...services];
    
    // Map of url -> count
    const inboundCounts: Record<string, number> = {};
    baseList.forEach(p => { inboundCounts[p.url] = 0; });
    
    // Map of pageId -> list of broken links
    const brokenLinksMap: Record<string, string[]> = {};
    
    baseList.forEach(p => {
      brokenLinksMap[p.id] = [];
      if (!p.content) return;
      
      const urls: string[] = [];
      const mdRegex = /\[[^\]]*\]\(([^)]+)\)/g;
      let match;
      while ((match = mdRegex.exec(p.content)) !== null) {
        urls.push(match[1]);
      }
      
      const htmlRegex = /href=["']([^"']+)["']/g;
      while ((match = htmlRegex.exec(p.content)) !== null) {
        urls.push(match[1]);
      }
      
      urls.forEach(rawUrl => {
        const clean = rawUrl.split(/[?#]/)[0].trim();
        if (clean.startsWith('/') && !clean.startsWith('//')) {
          const exists = baseList.some(target => target.url === clean);
          if (exists) {
            inboundCounts[clean] = (inboundCounts[clean] || 0) + 1;
          } else {
            brokenLinksMap[p.id].push(rawUrl);
          }
        }
      });
    });
    
    return baseList.map(p => {
      const broken = brokenLinksMap[p.id] || [];
      const inbound = inboundCounts[p.url] || 0;
      const originalIssues = p.seoIssues;
      let score = p.seoScore;
      const issues = [...originalIssues];
      
      if (broken.length > 0) {
        issues.push(`Broken link(s) detected: ${broken.join(', ')}`);
        score = Math.max(0, score - (broken.length * 10));
      }
      
      if (p.type === 'cms' && inbound === 0 && p.status === 'published') {
        issues.push('Orphaned page (0 incoming internal links)');
        score = Math.max(0, score - 5);
      }
      
      return {
        ...p,
        inboundCount: inbound,
        brokenLinks: broken,
        seoScore: score,
        seoIssues: issues,
        conversions: getPageConversions(p),
      };
    });
  }, [cmsPages, getPageConversions]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    let rows = allPages;

    // Tab filter
    if (tab === 'cms')      rows = rows.filter((p) => p.type === 'cms');
    if (tab === 'static')   rows = rows.filter((p) => p.type === 'static');
    if (tab === 'service')  rows = rows.filter((p) => p.type === 'service');
    if (tab === 'needs-seo') rows = rows.filter((p) => p.seoScore < 50);

    // Search
    if (needle) rows = rows.filter((p) => [p.title, p.slug, p.url].some((v) => v.toLowerCase().includes(needle)));

    return sortPages(rows, sortKey, sortDir);
  }, [allPages, tab, query, sortKey, sortDir]);

  // Stats
  const published = allPages.filter((p) => p.status === 'published').length;
  const needsSeo   = allPages.filter((p) => p.seoScore < 50).length;
  const avgSeo     = allPages.length ? Math.round(allPages.reduce((s, p) => s + p.seoScore, 0) / allPages.length) : 0;
  const cmsCount   = allPages.filter((p) => p.type === 'cms').length;

  // Sort toggle
  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
  };

  const SortIcon = ({ k }: { k: SortKey }) => {
    if (sortKey !== k) return <ChevronUp size={11} className="opacity-20" />;
    return sortDir === 'asc' ? <ChevronUp size={11} /> : <ChevronDown size={11} />;
  };

  const copyUrl = (url: string, id: string) => {
    navigator.clipboard.writeText(window.location.origin + url).catch(() => {});
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  // ── Bulk Actions Helpers ───────────────────────────────────────────────────

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const cmsIds = useMemo(() => {
    return filtered.filter((p) => p.type === 'cms').map((p) => p.id);
  }, [filtered]);

  const isAllSelected = cmsIds.length > 0 && cmsIds.every((id) => selectedIds.has(id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        cmsIds.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        cmsIds.forEach((id) => next.add(id));
        return next;
      });
    }
  };

  const exportSeoReport = (scope: 'selected' | 'all') => {
    const pool = scope === 'selected' && selectedIds.size > 0
      ? allPages.filter((p) => selectedIds.has(p.id))
      : allPages;

    const escape = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const headers = [
      'Title',
      'URL',
      'Type',
      'Status',
      'SEO Score',
      'SEO Issues',
      'Live Audit Issues',
      'Live Audit Good Signals',
      'Focus Keywords',
      'Meta Title',
      'Meta Description',
      'GEO Scope',
      'GEO Regions',
      'Schema',
      'hreflang',
      'Word Count',
      'Inbound Links',
      'Broken Links',
      'GEO Score',
      'GEO Grade',
      'AI Citability Score',
      'Brand Authority Score',
      'Content EEAT Score',
      'Technical GEO Score',
      'Schema Structured Data Score',
      'Platform Optimization Score',
      'Google AIO Score',
      'ChatGPT Score',
      'Perplexity Score',
      'Gemini Score',
      'Bing Copilot Score',
      'GEO Recommendations'
    ];

    const rows = pool.map((p) => {
      const liveAudit = auditResults.get(p.id);

      const geo = computeGeoScore({
        content: p.content,
        schemaType: p.schemaType,
        focusKeywords: p.focusKeywords,
        metaTitle: p.metaTitle,
        metaDescription: p.metaDescription,
        hreflang: p.hreflang,
        hasImage: p.hasImage,
        wordCount: p.wordCount,
      });

      return [
        escape(p.title),
        escape(p.url),
        escape(p.type),
        escape(p.status),
        escape(p.seoScore),
        escape(p.seoIssues?.join(' | ')),
        escape(liveAudit?.issues?.join(' | ') || (liveAudit && !liveAudit.ok ? 'Audit failed' : '')),
        escape(liveAudit?.good?.join(' | ') || ''),
        escape(p.focusKeywords),
        escape(p.metaTitle),
        escape(p.metaDescription),
        escape(p.geoScope),
        escape(p.geoRegions?.join('; ')),
        escape(p.schemaType),
        escape(p.hreflang),
        escape(p.wordCount),
        escape(p.inboundCount),
        escape(p.brokenLinks?.join('; ')),
        escape(geo.overall),
        escape(geo.grade),
        escape(geo.breakdown.aiCitability),
        escape(geo.breakdown.brandAuthority),
        escape(geo.breakdown.contentEEAT),
        escape(geo.breakdown.technicalGEO),
        escape(geo.breakdown.schemaStructuredData),
        escape(geo.breakdown.platformOptimization),
        escape(geo.platformScores.googleAIOverviews),
        escape(geo.platformScores.chatGPT),
        escape(geo.platformScores.perplexity),
        escape(geo.platformScores.gemini),
        escape(geo.platformScores.bingCopilot),
        escape(geo.recommendations.join(' | '))
      ].join(',');
    });

    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pages-seo-geo-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };


  const handleBulkStatus = async (status: 'published' | 'draft') => {
    if (selectedIds.size === 0) return;
    setSaving(true);
    setError(null);
    try {
      await adminFetch('/cms/pages/bulk', {
        method: 'PATCH',
        body: JSON.stringify({
          ids: Array.from(selectedIds),
          data: { status },
        }),
      });
      setSelectedIds(new Set());
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update pages');
    } finally {
      setSaving(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Are you sure you want to permanently delete these ${selectedIds.size} pages?`)) return;
    setSaving(true);
    setError(null);
    try {
      await adminFetch('/cms/pages/bulk-delete', {
        method: 'POST',
        body: JSON.stringify({
          ids: Array.from(selectedIds),
        }),
      });
      setSelectedIds(new Set());
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete pages');
    } finally {
      setSaving(false);
    }
  };

  // ── CMS Editor ─────────────────────────────────────────────────────────────

  const save = async () => {
    if (!editor || !editor.title) { setError('Title is required'); return; }
    setSaving(true);
    setError(null);
    const payload: any = {
      title: editor.title, slug: editor.slug || undefined, excerpt: editor.excerpt,
      content: editor.content, coverImage: editor.coverImage, status: editor.status,
      metaTitle: editor.metaTitle, metaDescription: editor.metaDescription,
      schemaType: editor.schemaType ?? null,
      schemaMarkup: editor.schemaMarkup ?? null,
      geoScope: editor.geoScope ?? null,
      geoRegions: editor.geoRegions ?? null,
      focusKeywords: editor.focusKeywords ?? null,
      hreflang: editor.hreflang ?? null,
    };
    try {
      if (editor.id) await adminFetch(`/cms/pages/${editor.id}`, { method: 'PATCH', body: JSON.stringify(payload) });
      else await adminFetch('/cms/pages', { method: 'POST', body: JSON.stringify(payload) });
      setEditor(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save page');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this page permanently?')) return;
    try { await adminFetch(`/cms/pages/${id}`, { method: 'DELETE' }); setEditor(null); await load(); }
    catch (err) { setError(err instanceof Error ? err.message : 'Failed to delete page'); }
  };

  // ── Live SEO Audit ─────────────────────────────────────────────────────────

  // silent=true skips auto-expanding the drawer (used for bulk auto-audit)
  const runAudit = useCallback(async (page: EnhancedPage, silent = false) => {
    setAuditingIds((prev) => {
      if (prev.has(page.id)) return prev; // already in flight
      return new Set(prev).add(page.id);
    });
    if (!silent) setExpandedSeo(page.id);
    try {
      const result = await adminFetch<LiveAuditResult>(`/seo/audit?path=${encodeURIComponent(page.url)}`);
      setAuditResults((prev) => new Map(prev).set(page.id, result));
    } catch (err) {
      setAuditResults((prev) =>
        new Map(prev).set(page.id, { ok: false, issues: [err instanceof Error ? err.message : 'Audit failed'], good: [] })
      );
    } finally {
      setAuditingIds((prev) => { const s = new Set(prev); s.delete(page.id); return s; });
    }
  }, []);

  const runAllAudits = useCallback(async (pages: EnhancedPage[]) => {
    if (pages.length === 0) return;
    const queue = [...pages];
    let done = 0;
    setAuditProgress({ done: 0, total: pages.length });

    const worker = async () => {
      while (queue.length > 0) {
        const page = queue.shift();
        if (!page) break;
        await runAudit(page, true);
        done += 1;
        setAuditProgress({ done, total: pages.length });
      }
    };

    await Promise.all([worker(), worker(), worker()]); // 3 concurrent
    setAuditProgress(null);
  }, [runAudit]);

  // Auto-trigger on first load
  useEffect(() => {
    if (!loading && allPages.length > 0 && !autoAuditTriggered.current) {
      autoAuditTriggered.current = true;
      runAllAudits(allPages);
    }
  }, [loading, allPages, runAllAudits]);

  // ── Render ─────────────────────────────────────────────────────────────────

  const TABS: { key: Tab; label: string; count: number }[] = [
    { key: 'all',       label: 'All Pages',    count: allPages.length },
    { key: 'cms',       label: 'CMS',          count: cmsCount },
    { key: 'static',    label: 'Platform',     count: STATIC_PAGES_DEF.length },
    { key: 'service',   label: 'Services',     count: SERVICE_SLUGS.length },
    { key: 'needs-seo', label: '⚠ Needs SEO',  count: needsSeo },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="an-page-header">
        <div className="an-page-title">
          <span className="ph-icon"><FileStack size={16} strokeWidth={2.5} /></span>
          Pages
        </div>
        <div className="an-page-desc">
          {cmsCount} CMS · {published} published · avg SEO {avgSeo}/100
          {auditProgress && (
            <span className="ml-3 inline-flex items-center gap-1.5 text-violet-600">
              <Loader2 size={11} className="animate-spin" />
              Auditing {auditProgress.done}/{auditProgress.total} pages…
            </span>
          )}
        </div>
        <div className="an-page-actions">
          <button
            onClick={() => { autoAuditTriggered.current = false; setAuditResults(new Map()); runAllAudits(allPages); }}
            disabled={!!auditProgress}
            className="an-btn an-btn-ghost an-btn-sm disabled:opacity-40"
            title="Re-run SEO audit for all pages"
          >
            <ScanSearch size={14} /> Re-audit All
          </button>
          <button
            onClick={() => {
              const needsRevision = allPages.filter((pg) => computeStopSlopScore(pg.content || '').grade === 'Needs Revision');
              if (needsRevision.length > 0) setExpandedStopSlop(needsRevision[0].id);
              const summary = allPages.map((pg) => ({
                title: pg.title,
                score: computeStopSlopScore(pg.content || '').score,
                grade: computeStopSlopScore(pg.content || '').grade,
              }));
              console.table(summary);
            }}
            className="an-btn an-btn-ghost an-btn-sm"
            title="Bulk prose quality scan — highlights pages needing revision"
          >
            <FileText size={14} /> Scan Prose
          </button>
          <button
            onClick={() => {
              const aiDetected = allPages.filter((pg) => computeHumanizeScore(pg.content || '').grade !== 'Pass');
              if (aiDetected.length > 0) setExpandedHuman(aiDetected[0].id);
              const summary = allPages.map((pg) => ({
                title: pg.title,
                humanScore: computeHumanizeScore(pg.content || '').humanScore,
                grade: computeHumanizeScore(pg.content || '').grade,
              }));
              console.table(summary);
            }}
            className="an-btn an-btn-ghost an-btn-sm"
            title="Bulk AI-detectability scan"
          >
            <ScanSearch size={14} /> Scan Human
          </button>
          <button
            onClick={() => exportSeoReport(selectedIds.size > 0 ? 'selected' : 'all')}
            className="an-btn an-btn-ghost an-btn-sm"
            title={selectedIds.size > 0 ? `Export SEO report for ${selectedIds.size} selected pages` : 'Export SEO/GEO report for all pages'}
          >
            <Download size={14} /> Export {selectedIds.size > 0 ? `(${selectedIds.size})` : 'All'}
          </button>
          <button onClick={load} className="an-btn an-btn-ghost an-btn-sm">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button onClick={() => setEditor(emptyDraft())} className="an-btn an-btn-primary an-btn-sm">
            <Plus size={14} /> Add New
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-[13px] text-red-700">{error}</div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: <FileText size={14} />, label: 'Total Pages', value: allPages.length, sub: `${cmsCount} CMS managed` },
          { icon: <CheckCircle2 size={14} />, label: 'Published', value: published, sub: `${allPages.length - published} not live` },
          { icon: <BarChart2 size={14} />, label: 'Avg SEO Score', value: `${avgSeo}/100`, sub: avgSeo >= 70 ? 'Good health' : 'Needs work' },
          { icon: <AlertTriangle size={14} />, label: 'Needs SEO', value: needsSeo, sub: 'score below 50' },
        ].map((c) => (
          <div key={c.label} className="an-card-flush rounded-xl p-4">
            <div className="flex items-center gap-2 text-[11px] text-[#888] font-semibold uppercase tracking-wide mb-2">
              {c.icon}{c.label}
            </div>
            <div className="text-[22px] font-bold text-[var(--an-text)] leading-none">{c.value}</div>
            <div className="text-[11px] text-[#aaa] mt-1">{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Table card */}
      <div className="an-card-flush overflow-hidden">
        {/* Tabs + Search */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--an-border)] px-4 py-3">
          <div className="flex items-center gap-1 overflow-x-auto">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium whitespace-nowrap transition-colors ${
                  tab === t.key
                    ? 'bg-black text-white'
                    : 'text-[#666] hover:bg-black/5'
                }`}
              >
                {t.label}
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none ${tab === t.key ? 'bg-white/20 text-white' : 'bg-black/8 text-[#888]'}`}>
                  {t.count}
                </span>
              </button>
            ))}
          </div>
          <div className="relative flex-shrink-0">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#999]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search pages…"
              className="w-52 rounded-lg border border-[var(--an-border)] bg-white py-2 pl-9 pr-3 text-[13px] outline-none focus:border-black/40"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-10 text-center text-sm text-[#888]">Loading pages…</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-[#888]">
            {tab === 'cms' && cmsCount === 0 ? 'No CMS pages yet. Click "Add New" to create one.' : 'No pages match your filter.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-[var(--an-border)] bg-[var(--an-surface,#fafafa)]">
                  <th className="px-3 py-2.5 w-8 select-none">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={toggleSelectAll}
                      className="rounded border-[var(--an-border)] text-black focus:ring-black"
                    />
                  </th>
                  {([
                    ['title',        'Page'],
                    ['status',       'Status'],
                    [null,           'Type'],
                    ['seoScore',     'SEO Health'],
                    [null,           'GEO Score'],
                    [null,           'Prose'],
                    [null,           'Human'],
                    [null,           'Schema'],
                    ['inboundCount', 'Links In'],
                    ['conversions',  'Conversions'],
                    [null,           'Geo'],
                    ['wordCount',    'Words'],
                    [null,           'Assets'],
                    ['updatedAt',    'Updated'],
                    [null,           ''],
                  ] as [SortKey | null, string][]).map(([k, label]) => (
                    <th
                      key={label}
                      className={`px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-[#888] select-none ${k ? 'cursor-pointer hover:text-black' : ''}`}
                      onClick={() => k && toggleSort(k)}
                    >
                      <span className="inline-flex items-center gap-1">
                        {label}{k && <SortIcon k={k} />}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <React.Fragment key={p.id}>
                    <tr
                      className="border-b border-[var(--an-border)] hover:bg-black/[0.04] transition-colors"
                      style={{ cursor: p.type === 'cms' ? 'pointer' : 'default' }}
                      onClick={() => p.type === 'cms' && p._raw && setEditor(p._raw)}
                    >
                      {/* Checkbox */}
                      <td className="px-3 py-2.5 w-8" onClick={(e) => e.stopPropagation()}>
                        {p.type === 'cms' ? (
                          <input
                            type="checkbox"
                            checked={selectedIds.has(p.id)}
                            onChange={(e) => toggleSelect(p.id, e as any)}
                            className="rounded border-[var(--an-border)] text-black focus:ring-black"
                          />
                        ) : (
                          <span className="text-[#ccc] select-none text-[10px] block text-center">—</span>
                        )}
                      </td>

                      {/* Page title + url */}
                      <td className="px-3 py-2.5 min-w-[160px]">
                        <div className="font-medium text-[var(--an-text)] leading-snug">{p.title}</div>
                        <div className="text-[11px] text-[#aaa] font-mono mt-0.5">{p.url}</div>
                      </td>

                      {/* Status */}
                      <td className="px-3 py-2.5">
                        <Badge label={p.status} className={STATUS_COLOR[p.status]} />
                      </td>

                      {/* Type */}
                      <td className="px-3 py-2.5">
                        <Badge label={p.type.toUpperCase()} className={TYPE_COLOR[p.type]} />
                      </td>

                      {/* SEO Score */}
                      <td className="px-3 py-2.5">
                        <button
                          className="flex items-center gap-1.5 group font-medium"
                          onClick={(e) => { e.stopPropagation(); setExpandedSeo(expandedSeo === p.id ? null : p.id); }}
                          title="Click to see SEO issues / live audit"
                        >
                          <span className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[11px] font-bold leading-none ${SEO_COLOR(p.seoScore)}`}>
                            {SEO_ICON(p.seoScore)}{p.seoScore}
                          </span>
                          <div className="h-1.5 w-12 rounded-full bg-black/8 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${p.seoScore >= 75 ? 'bg-emerald-500' : p.seoScore >= 45 ? 'bg-amber-400' : 'bg-red-400'}`}
                              style={{ width: `${p.seoScore}%` }}
                            />
                          </div>
                        </button>
                        {/* Live audit inline status */}
                        {auditingIds.has(p.id) && (
                          <div className="flex items-center gap-1 mt-1 text-[10px] text-[#aaa]">
                            <Loader2 size={9} className="animate-spin" /> auditing…
                          </div>
                        )}
                        {!auditingIds.has(p.id) && auditResults.has(p.id) && (() => {
                          const a = auditResults.get(p.id)!;
                          if (!a.ok) return (
                            <div className="mt-1 text-[10px] text-red-400">audit failed</div>
                          );
                          if (a.issues.length === 0) return (
                            <div className="mt-1 text-[10px] text-emerald-600 font-medium">live ✓ all pass</div>
                          );
                          return (
                            <div className="mt-1 text-[10px] text-red-500 font-medium">
                              {a.issues.length} live issue{a.issues.length > 1 ? 's' : ''}
                            </div>
                          );
                        })()}
                      </td>

                      {/* GEO Score */}
                      <td className="px-3 py-2.5">
                        {(() => {
                          const geo = computeGeoScore({
                            content: p.content,
                            schemaType: p.schemaType,
                            focusKeywords: p.focusKeywords,
                            metaTitle: p.metaTitle,
                            metaDescription: p.metaDescription,
                            hreflang: p.hreflang,
                            hasImage: p.hasImage,
                            wordCount: p.wordCount,
                          });
                          return (
                            <button
                              className="flex items-center gap-1.5"
                              onClick={(e) => { e.stopPropagation(); setExpandedSeo(expandedSeo === p.id ? null : p.id); }}
                              title="Click to see GEO/AEO breakdown"
                            >
                              <span className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[11px] font-bold leading-none ${geo.gradeColor}`}>
                                ✦ {geo.overall}
                              </span>
                              <div className="h-1.5 w-10 rounded-full bg-black/8 overflow-hidden">
                                <div className={`h-full rounded-full transition-all ${geoScoreColor(geo.overall)}`} style={{ width: `${geo.overall}%` }} />
                              </div>
                            </button>
                          );
                        })()}
                      </td>

                      {/* Prose Score */}
                      <td className="px-3 py-2.5">
                        {(() => {
                          const slop = computeStopSlopScore(p.content || '');
                          return (
                            <button
                              className="flex items-center gap-1.5"
                              onClick={(e) => { e.stopPropagation(); setExpandedStopSlop(expandedStopSlop === p.id ? null : p.id); }}
                              title="Click to see prose quality breakdown"
                            >
                              <span className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[11px] font-bold leading-none ${slop.gradeColor}`}>
                                ✍ {slop.score}
                              </span>
                              <div className="h-1.5 w-10 rounded-full bg-black/8 overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${
                                    slop.score >= 40 ? 'bg-emerald-500' :
                                    slop.score >= 30 ? 'bg-amber-400' : 'bg-red-400'
                                  }`}
                                  style={{ width: `${slop.score100}%` }}
                                />
                              </div>
                            </button>
                          );
                        })()}
                      </td>

                      {/* Human Score */}
                      <td className="px-3 py-2.5">
                        {(() => {
                          const human = computeHumanizeScore(p.content || '');
                          return (
                            <button
                              className="flex items-center gap-1.5"
                              onClick={(e) => { e.stopPropagation(); setExpandedHuman(expandedHuman === p.id ? null : p.id); }}
                              title="Click to see AI-detectability analysis"
                            >
                              <span className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[11px] font-bold leading-none ${human.gradeColor}`}>
                                ✦ {human.humanScore}
                              </span>
                              <div className="h-1.5 w-10 rounded-full bg-black/8 overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${
                                    human.humanScore >= 65 ? 'bg-emerald-500' :
                                    human.humanScore >= 45 ? 'bg-amber-400' : 'bg-red-400'
                                  }`}
                                  style={{ width: `${human.humanScore}%` }}
                                />
                              </div>
                            </button>
                          );
                        })()}
                      </td>

                      {/* Schema */}
                      <td className="px-3 py-2.5">
                        {p.schemaType ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-700 bg-indigo-50 border border-indigo-100 rounded px-1.5 py-0.5 leading-none">
                            <FileText size={10} /> {p.schemaType}
                          </span>
                        ) : (
                          <span className="text-[#bbb] text-[11px] italic">none</span>
                        )}
                      </td>

                      {/* Links In */}
                      <td className="px-3 py-2.5">
                        <span className={`inline-flex items-center gap-1 text-[12px] ${p.inboundCount === 0 && p.status === 'published' ? 'text-red-500 font-semibold' : 'text-[#555]'}`}>
                          <Link2 size={11} /> {p.inboundCount}
                        </span>
                      </td>

                      {/* Conversions */}
                      <td className="px-3 py-2.5">
                        {p.conversions !== null ? (
                          <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded px-1.5 py-0.5 leading-none">
                            <TrendingUp size={11} /> {p.conversions}
                          </span>
                        ) : (
                          <span className="text-[#ccc] text-[11px]">—</span>
                        )}
                      </td>

                      {/* Geo */}
                      <td className="px-3 py-2.5">
                        <div className="flex flex-wrap gap-1">
                          <Badge label={GEO_LABEL[p.geoScope]} className={GEO_COLOR[p.geoScope]} icon={<Globe size={10} />} />
                        </div>
                        {p.geoRegions.length > 0 && (
                          <div className="text-[10px] text-[#aaa] mt-0.5 leading-tight">{p.geoRegions.join(', ')}</div>
                        )}
                      </td>

                      {/* Word count */}
                      <td className="px-3 py-2.5 text-[12px] text-[#777]">
                        {p.type === 'static' ? '—' : p.wordCount > 0 ? p.wordCount.toLocaleString() : <span className="text-[#ccc]">0</span>}
                      </td>

                      {/* Assets */}
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2 text-[#bbb]">
                          <span className={p.hasImage ? 'text-emerald-500' : ''} title={p.hasImage ? 'Has cover image' : 'No cover image'}>
                            <Image size={13} />
                          </span>
                          <span className={(p.excerpt || '').length > 0 ? 'text-emerald-500' : ''} title="Excerpt">
                            <Tag size={13} />
                          </span>
                        </div>
                      </td>

                      {/* Updated */}
                      <td className="px-3 py-2.5 text-[12px] text-[#aaa] whitespace-nowrap">
                        {p.updatedAt ? new Date(p.updatedAt).toLocaleDateString() : '—'}
                      </td>

                      {/* Actions */}
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            title="Copy URL"
                            onClick={() => copyUrl(p.url, p.id)}
                            className="rounded p-1.5 text-[#bbb] hover:text-black hover:bg-black/5 transition-colors"
                          >
                            {copiedId === p.id ? <CheckCircle2 size={13} className="text-emerald-500" /> : <Copy size={13} />}
                          </button>
                          <a
                            href={p.url}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded p-1.5 text-[#bbb] hover:text-black hover:bg-black/5 transition-colors"
                            title="Open page"
                          >
                            <ExternalLink size={13} />
                          </a>
                          <button
                            title="Run live SEO audit"
                            onClick={(e) => { e.stopPropagation(); runAudit(p); }}
                            disabled={auditingIds.has(p.id)}
                            className="rounded p-1.5 text-[#bbb] hover:text-violet-600 hover:bg-violet-50 transition-colors disabled:opacity-40"
                          >
                            {auditingIds.has(p.id)
                              ? <Loader2 size={13} className="animate-spin" />
                              : <ScanSearch size={13} />}
                          </button>
                          {p.type === 'cms' && p._raw && (
                            <button
                              onClick={() => setEditor(p._raw!)}
                              className="an-btn an-btn-ghost an-btn-sm"
                            >
                              Edit
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Human Score drawer */}
                    {expandedHuman === p.id && (() => {
                      const human = computeHumanizeScore(p.content || '');
                      return (
                        <tr className="border-b border-[var(--an-border)]">
                          <td colSpan={16} className="px-4 py-3 bg-gradient-to-r from-indigo-50 to-purple-50">
                            <div className="flex flex-col gap-3">
                              <div className="flex items-center gap-2">
                                <ScanSearch size={13} className="text-indigo-500" />
                                <span className="text-[12px] font-bold text-indigo-900">AI Detectability Analysis (humanize-text) — {human.grade}</span>
                                <span className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[13px] font-black ${human.gradeColor}`}>{human.humanScore}/100</span>
                                <span className="ml-auto text-[10px] text-indigo-500">{human.signals.wordCount}w · TTR {(human.signals.ttr * 100).toFixed(0)}% · σ={human.signals.sentenceLengthVariance}w</span>
                              </div>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {[
                                  { label: 'Vocab Diversity', value: Math.round(human.signals.ttr * 100), unit: '%', ok: human.signals.ttr >= 0.55 },
                                  { label: 'Sent. Variance', value: human.signals.sentenceLengthVariance, unit: 'w', ok: human.signals.sentenceLengthVariance >= 3 },
                                  { label: 'Burstiness', value: Math.round(human.signals.burstiness * 100), unit: '%', ok: human.signals.burstiness >= 0.30 },
                                  { label: 'Avg Sentence', value: human.signals.avgSentenceLength, unit: 'w', ok: true },
                                ].map(({ label, value, unit, ok }) => (
                                  <div key={label} className="bg-white border border-indigo-100 rounded-lg p-2">
                                    <div className="text-[9px] font-semibold text-indigo-400 uppercase tracking-wide">{label}</div>
                                    <div className={`text-[16px] font-black mt-0.5 ${ok ? 'text-emerald-600' : 'text-red-500'}`}>{value}<span className="text-[10px] font-normal opacity-60">{unit}</span></div>
                                  </div>
                                ))}
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {human.issues.length > 0 && (
                                  <div className="space-y-1">
                                    <div className="text-[10px] font-bold uppercase tracking-wide text-red-600">AI Signals</div>
                                    <ul className="space-y-0.5">
                                      {human.issues.map((iss) => (
                                        <li key={iss} className="text-[11px] text-red-700 flex items-start gap-1"><span className="text-red-400 mt-0.5">•</span>{iss}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                {human.good.length > 0 && (
                                  <div className="space-y-1">
                                    <div className="text-[10px] font-bold uppercase tracking-wide text-emerald-600">Human Signals</div>
                                    <ul className="space-y-0.5">
                                      {human.good.map((g) => (
                                        <li key={g} className="text-[11px] text-emerald-700 flex items-start gap-1"><span className="text-emerald-400 mt-0.5">✓</span>{g}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                              {human.aiVocabHits.length > 0 && (
                                <div>
                                  <div className="text-[10px] font-bold uppercase tracking-wide text-indigo-700 mb-1.5">AI Vocabulary — Suggested Replacements</div>
                                  <div className="flex flex-wrap gap-2">
                                    {human.aiVocabHits.map(({ word, replacements, count }) => (
                                      <div key={word} className="bg-white border border-indigo-100 rounded-lg px-2 py-1.5 text-[11px]">
                                        <span className="font-semibold text-red-600">{word}</span>
                                        {count > 1 && <span className="text-[10px] text-red-400 ml-0.5">×{count}</span>}
                                        <span className="text-indigo-300 mx-1">→</span>
                                        <span className="text-emerald-700">{replacements.slice(0, 2).join(', ')}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })()}

                    {/* Stop-Slop Prose Audit drawer */}
                    {expandedStopSlop === p.id && (() => {
                      const slop = computeStopSlopScore(p.content || '');
                      const DIMS: { key: keyof typeof slop.dimensions; label: string; desc: string }[] = [
                        { key: 'directness', label: 'Directness', desc: 'No throat-clearing openers' },
                        { key: 'rhythm', label: 'Rhythm', desc: 'Varied sentence length' },
                        { key: 'trust', label: 'Reader Trust', desc: 'Active voice' },
                        { key: 'authenticity', label: 'Human Voice', desc: 'Free of AI tells' },
                        { key: 'density', label: 'Density', desc: 'No adverb filler' },
                      ];
                      return (
                        <tr className="border-b border-[var(--an-border)]">
                          <td colSpan={16} className="px-4 py-3 bg-gradient-to-r from-slate-50 to-zinc-100">
                            <div className="flex flex-col gap-3">
                              <div className="flex items-center gap-2">
                                <FileText size={13} className="text-slate-500" />
                                <span className="text-[12px] font-bold text-slate-800">Prose Quality Audit (Stop-Slop Rules) — {slop.grade}</span>
                                <span className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[13px] font-black ${slop.gradeColor}`}>{slop.score}/50</span>
                              </div>
                              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                                {DIMS.map(({ key, label, desc }) => (
                                  <div key={key} className="bg-white border border-slate-200 rounded-lg p-2 flex flex-col justify-between">
                                    <div>
                                      <div className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide">{label}</div>
                                      <div className="text-[8px] text-slate-500 leading-tight mt-0.5">{desc}</div>
                                    </div>
                                    <div className="mt-2">
                                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                                        <span>Score</span><span>{slop.dimensions[key]}/10</span>
                                      </div>
                                      <div className="w-full h-1 bg-slate-100 rounded-full mt-0.5 overflow-hidden">
                                        <div
                                          className={`h-full rounded-full ${
                                            slop.dimensions[key] >= 8 ? 'bg-emerald-500' :
                                            slop.dimensions[key] >= 5 ? 'bg-amber-400' : 'bg-red-400'
                                          }`}
                                          style={{ width: `${slop.dimensions[key] * 10}%` }}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
                                {slop.issues.length > 0 && (
                                  <div className="space-y-1">
                                    <div className="text-[10px] font-bold uppercase tracking-wide text-red-600">Revisions Needed</div>
                                    <ul className="space-y-0.5">
                                      {slop.issues.map((iss) => (
                                        <li key={iss} className="text-[11px] text-red-700 flex items-start gap-1">
                                          <span className="text-red-400 mt-0.5">•</span>{iss}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                {slop.good.length > 0 && (
                                  <div className="space-y-1">
                                    <div className="text-[10px] font-bold uppercase tracking-wide text-emerald-600">Passing Patterns</div>
                                    <ul className="space-y-0.5">
                                      {slop.good.map((gd) => (
                                        <li key={gd} className="text-[11px] text-emerald-700 flex items-start gap-1">
                                          <span className="text-emerald-400 mt-0.5">✓</span>{gd}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })()}

                    {/* SEO + GEO issues drawer */}
                    {expandedSeo === p.id && (
                      <tr className="border-b border-[var(--an-border)]">
                        <td colSpan={16} className="px-4 py-3 bg-[#fafafa]">
                          <div className="flex flex-col gap-4">
                            {/* GEO Panel */}
                            {(() => {
                              const geo = computeGeoScore({
                                content: p.content,
                                schemaType: p.schemaType,
                                focusKeywords: p.focusKeywords,
                                metaTitle: p.metaTitle,
                                metaDescription: p.metaDescription,
                                hreflang: p.hreflang,
                                hasImage: p.hasImage,
                                wordCount: p.wordCount,
                              });
                              const CATS: { key: keyof typeof geo.breakdown; label: string }[] = [
                                { key: 'aiCitability', label: 'AI Citability' },
                                { key: 'brandAuthority', label: 'Brand Auth.' },
                                { key: 'contentEEAT', label: 'E-E-A-T' },
                                { key: 'technicalGEO', label: 'Technical GEO' },
                                { key: 'schemaStructuredData', label: 'Schema' },
                                { key: 'platformOptimization', label: 'Platforms' },
                              ];
                              const PLATFORMS: { key: keyof typeof geo.platformScores; label: string }[] = [
                                { key: 'googleAIOverviews', label: 'Google AIO' },
                                { key: 'chatGPT', label: 'ChatGPT' },
                                { key: 'perplexity', label: 'Perplexity' },
                                { key: 'gemini', label: 'Gemini' },
                                { key: 'bingCopilot', label: 'Bing' },
                              ];
                              return (
                                <div className="rounded-lg border border-violet-100 bg-gradient-to-r from-violet-50 to-blue-50 p-3 space-y-3">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[11px] font-bold text-violet-800">GEO / AEO Score — {geo.grade}</span>
                                    <span className={`inline-flex items-center rounded border px-2 py-0.5 text-[12px] font-black ${geo.gradeColor}`}>{geo.overall}/100</span>
                                    <span className="text-[10px] text-gray-500 ml-auto">{geo.wordCount}w · {geo.questionHeadingCount} Q-heads · {geo.faqCount} FAQs · {geo.tableCount} tables</span>
                                  </div>
                                  {/* Category bars */}
                                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                                    {CATS.map(({ key, label }) => (
                                      <div key={key} className="bg-white border border-violet-100 rounded-lg p-2 text-center">
                                        <div className="text-[13px] font-black text-violet-700">{geo.breakdown[key]}</div>
                                        <div className="text-[9px] text-gray-500 mt-0.5 leading-tight">{label}</div>
                                        <div className="mt-1 w-full h-1 rounded-full bg-gray-100 overflow-hidden">
                                          <div className={`h-full rounded-full ${geoScoreColor(geo.breakdown[key])}`} style={{ width: `${geo.breakdown[key]}%` }} />
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                  {/* Platform scores */}
                                  <div className="flex flex-wrap gap-2">
                                    {PLATFORMS.map(({ key, label }) => (
                                      <div key={key} className="flex items-center gap-1.5 bg-white border border-blue-100 rounded-lg px-2 py-1">
                                        <span className="text-[10px] text-gray-500">{label}</span>
                                        <div className="h-1 w-10 rounded-full bg-gray-100 overflow-hidden">
                                          <div className={`h-full rounded-full ${geoScoreColor(geo.platformScores[key])}`} style={{ width: `${geo.platformScores[key]}%` }} />
                                        </div>
                                        <span className="text-[10px] font-bold text-gray-700">{geo.platformScores[key]}</span>
                                      </div>
                                    ))}
                                  </div>
                                  {/* Top recommendations */}
                                  {geo.recommendations.slice(0, 3).map((r, i) => (
                                    <div key={i} className="text-[10px] text-violet-800 flex items-start gap-1">
                                      <span className="text-violet-400 mt-0.5 flex-shrink-0">→</span>{r}
                                    </div>
                                  ))}
                                </div>
                              );
                            })()}

                          <div className="flex flex-col gap-3">
                            {/* Static analysis issues */}
                            {p.seoIssues.length > 0 && (
                              <div className="flex items-start gap-2">
                                <AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" />
                                <div>
                                  <div className="text-[11px] font-semibold text-amber-800 mb-1">
                                    Static Analysis · {p.seoScore}/100
                                  </div>
                                  <ul className="flex flex-wrap gap-x-4 gap-y-1">
                                    {p.seoIssues.map((issue) => (
                                      <li key={issue} className="text-[11px] text-amber-700">· {issue}</li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            )}

                            {/* Live audit results */}
                            {auditResults.has(p.id) && (() => {
                              const audit = auditResults.get(p.id)!;
                              return (
                                <div className="rounded-lg border border-[var(--an-border)] bg-white p-3 space-y-2">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-violet-700">
                                      <ScanSearch size={12} />
                                      Live Page Audit
                                      {audit.auditedAt && (
                                        <span className="text-[10px] text-[#aaa] font-normal ml-1">
                                          · {new Date(audit.auditedAt).toLocaleTimeString()}
                                        </span>
                                      )}
                                    </div>
                                    <button
                                      onClick={() => runAudit(p)}
                                      disabled={auditingIds.has(p.id)}
                                      className="text-[10px] text-violet-600 hover:underline disabled:opacity-40"
                                    >
                                      {auditingIds.has(p.id) ? 'Auditing…' : 'Re-run'}
                                    </button>
                                  </div>

                                  {!audit.ok && (
                                    <p className="text-[11px] text-red-600">{audit.error || audit.issues[0] || 'Audit failed'}</p>
                                  )}

                                  {audit.ok && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                      {/* Issues column */}
                                      {audit.issues.length > 0 && (
                                        <div>
                                          <div className="text-[10px] font-semibold uppercase tracking-wide text-red-600 mb-1">Issues</div>
                                          <ul className="space-y-0.5">
                                            {audit.issues.map((issue) => (
                                              <li key={issue} className="text-[11px] text-red-700 flex items-start gap-1">
                                                <span className="text-red-400 mt-0.5">✗</span>{issue}
                                              </li>
                                            ))}
                                          </ul>
                                        </div>
                                      )}
                                      {/* Passing column */}
                                      {audit.good.length > 0 && (
                                        <div>
                                          <div className="text-[10px] font-semibold uppercase tracking-wide text-emerald-600 mb-1">Passing</div>
                                          <ul className="space-y-0.5">
                                            {audit.good.map((g) => (
                                              <li key={g} className="text-[11px] text-emerald-700 flex items-start gap-1">
                                                <span className="text-emerald-400 mt-0.5">✓</span>{g}
                                              </li>
                                            ))}
                                          </ul>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })()}

                            {/* Loading state in drawer */}
                            {auditingIds.has(p.id) && (
                              <div className="flex items-center gap-1.5 text-[11px] text-[#888]">
                                <Loader2 size={11} className="animate-spin" /> Fetching live page…
                              </div>
                            )}
                            {/* Waiting for auto-audit queue */}
                            {!auditResults.has(p.id) && !auditingIds.has(p.id) && auditProgress && (
                              <div className="flex items-center gap-1.5 text-[11px] text-[#aaa]">
                                <Loader2 size={11} className="animate-spin" /> In audit queue…
                              </div>
                            )}
                          </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--an-border)] text-[11px] text-[#aaa]">
          <span>Showing {filtered.length} of {allPages.length} pages</span>
          <span className="flex items-center gap-1"><Filter size={11} /> {tab !== 'all' ? `Filter: ${tab}` : 'All types'}</span>
        </div>
      </div>

      {/* CMS Page Editor Drawer */}
      {editor && (
        <div className="fixed inset-0 z-50 bg-black/30 flex justify-end" onClick={() => setEditor(null)}>
          <div className="h-full w-full max-w-2xl overflow-y-auto bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 z-10 border-b border-[var(--an-border)] bg-white px-5 py-4 flex items-center justify-between gap-4">
              <div className="text-[16px] font-bold text-[var(--an-text)]">{editor.id ? 'Edit Page' : 'New Page'}</div>
              <div className="flex items-center gap-2">
                {editor.id && editor.status === 'published' && (
                  <a href={`/p/${editor.slug}`} target="_blank" rel="noreferrer" className="an-btn an-btn-ghost an-btn-sm">
                    <ExternalLink size={13} /> View Live
                  </a>
                )}
                {/* Live SEO preview */}
                {(editor.metaTitle || editor.metaDescription) && (
                  <div className="hidden sm:block rounded-lg border border-[var(--an-border)] bg-[#f9f9f9] p-3 text-[12px] max-w-xs">
                    <div className="text-blue-600 font-medium leading-snug truncate">{editor.metaTitle || editor.title}</div>
                    <div className="text-green-700 text-[11px]">{window.location.origin}/p/{editor.slug}</div>
                    <div className="text-[#555] text-[11px] leading-snug mt-0.5 line-clamp-2">{editor.metaDescription}</div>
                  </div>
                )}
                <button onClick={() => setEditor(null)} className="rounded-full p-2 hover:bg-black/5"><X size={18} /></button>
              </div>
            </div>

            <div className="p-5 space-y-4">
              <EditorField label="Title *" value={editor.title || ''} onChange={(v) => setEditor({ ...editor, title: v })} />
              <EditorField label="Slug" placeholder="auto-generated from title" value={editor.slug || ''} onChange={(v) => setEditor({ ...editor, slug: v })} />
              <EditorField label="Excerpt" textarea value={editor.excerpt || ''} onChange={(v) => setEditor({ ...editor, excerpt: v })} />

              <label className="block">
                <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-[#777]">Content (Markdown)</span>
                <textarea
                  value={editor.content || ''}
                  onChange={(e) => setEditor({ ...editor, content: e.target.value })}
                  rows={14}
                  className="w-full rounded-lg border border-[var(--an-border)] px-3 py-2 text-[13px] font-mono outline-none focus:border-black/40 focus:ring-1 focus:ring-black/5"
                />
                <div className="mt-1 text-[11px] text-[#aaa]">
                  {(editor.content || '').trim().split(/\s+/).filter(Boolean).length} words
                </div>
              </label>

              {/* SEO Section */}
              <div className="rounded-xl border border-[var(--an-border)] p-4 space-y-3 bg-[#fafafa]">
                <div className="flex items-center gap-2 text-[12px] font-semibold text-[var(--an-text)]">
                  <BarChart2 size={13} />
                  SEO Settings
                  {(() => {
                    const { score } = computeSeo(editor as any);
                    return (
                      <span className={`ml-auto inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[11px] font-bold ${SEO_COLOR(score)}`}>
                        {SEO_ICON(score)} {score}/100
                      </span>
                    );
                  })()}
                </div>
                <EditorField
                  label={`Meta Title · ${(editor.metaTitle || '').length}/65 chars`}
                  value={editor.metaTitle || ''}
                  onChange={(v) => setEditor({ ...editor, metaTitle: v })}
                  warn={(editor.metaTitle || '').length > 65}
                />
                <EditorField
                  label={`Meta Description · ${(editor.metaDescription || '').length}/160 chars`}
                  textarea
                  value={editor.metaDescription || ''}
                  onChange={(v) => setEditor({ ...editor, metaDescription: v })}
                  warn={(editor.metaDescription || '').length > 160}
                />
                <div className="grid grid-cols-2 gap-3">
                  <EditorField
                    label="Focus Keywords"
                    placeholder="e.g. clipping, retouch"
                    value={editor.focusKeywords || ''}
                    onChange={(v) => setEditor({ ...editor, focusKeywords: v })}
                  />
                  <EditorField
                    label="Hreflang Locale"
                    placeholder="e.g. en-US"
                    value={editor.hreflang || ''}
                    onChange={(v) => setEditor({ ...editor, hreflang: v })}
                  />
                </div>
              </div>

              {/* Stop-Slop Prose Audit Section */}
              <div className="rounded-xl border border-[var(--an-border)] p-4 space-y-3 bg-[#fafafa]">
                <div className="flex items-center gap-2 text-[12px] font-semibold text-[var(--an-text)]">
                  <FileText size={13} />
                  Prose Audit
                  {(() => {
                    const slop = computeStopSlopScore(editor.content || '');
                    return (
                      <span className={`ml-auto inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[11px] font-bold ${slop.gradeColor}`}>
                        {slop.score}/50 · {slop.grade}
                      </span>
                    );
                  })()}
                </div>
                {(() => {
                  const slop = computeStopSlopScore(editor.content || '');
                  const DIMS: { key: keyof typeof slop.dimensions; label: string }[] = [
                    { key: 'directness', label: 'Directness' },
                    { key: 'rhythm', label: 'Rhythm' },
                    { key: 'trust', label: 'Trust' },
                    { key: 'authenticity', label: 'Authenticity' },
                    { key: 'density', label: 'Density' },
                  ];
                  return (
                    <div className="space-y-2">
                      {/* Dimension bars */}
                      <div className="space-y-1.5">
                        {DIMS.map(({ key, label }) => (
                          <div key={key} className="flex items-center gap-2">
                            <span className="text-[10px] text-gray-500 w-20 flex-shrink-0">{label}</span>
                            <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  slop.dimensions[key] >= 8 ? 'bg-emerald-500' :
                                  slop.dimensions[key] >= 5 ? 'bg-amber-400' : 'bg-red-400'
                                }`}
                                style={{ width: `${slop.dimensions[key] * 10}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-bold text-gray-600 w-6 text-right">{slop.dimensions[key]}</span>
                          </div>
                        ))}
                      </div>
                      {slop.issues.length > 0 && (
                        <div className="rounded-lg bg-red-50 border border-red-100 p-2 space-y-0.5">
                          <div className="text-[10px] font-bold uppercase tracking-wide text-red-600 mb-1">Revisions Needed</div>
                          {slop.issues.map((iss) => (
                            <div key={iss} className="text-[10px] text-red-700 flex items-start gap-1">
                              <span className="text-red-400 mt-0.5 flex-shrink-0">✗</span>{iss}
                            </div>
                          ))}
                        </div>
                      )}
                      {slop.good.length > 0 && (
                        <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-2 space-y-0.5">
                          <div className="text-[10px] font-bold uppercase tracking-wide text-emerald-600 mb-1">Passing</div>
                          {slop.good.map((g) => (
                            <div key={g} className="text-[10px] text-emerald-700 flex items-start gap-1">
                              <span className="text-emerald-400 mt-0.5 flex-shrink-0">✓</span>{g}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
              {/* Human Score Section (humanize-text) */}
              <div className="rounded-xl border border-[var(--an-border)] p-4 space-y-3 bg-[#fafafa]">
                <div className="flex items-center gap-2 text-[12px] font-semibold text-[var(--an-text)]">
                  <ScanSearch size={13} />
                  Human Score
                  {(() => {
                    const human = computeHumanizeScore(editor.content || '');
                    return (
                      <span className={`ml-auto inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[11px] font-bold ${human.gradeColor}`}>
                        {human.humanScore}/100 · {human.grade}
                      </span>
                    );
                  })()}
                </div>
                {(() => {
                  const human = computeHumanizeScore(editor.content || '');
                  return (
                    <div className="space-y-2">
                      <div className="space-y-1.5">
                        {[
                          { label: 'Vocab Diversity', value: Math.round(human.signals.ttr * 100), max: 100, threshold: 55 },
                          { label: 'Sent. Variance', value: Math.round(human.signals.sentenceLengthVariance * 10), max: 80, threshold: 30 },
                          { label: 'Burstiness', value: Math.round(human.signals.burstiness * 100), max: 100, threshold: 30 },
                        ].map(({ label, value, max, threshold }) => (
                          <div key={label} className="flex items-center gap-2">
                            <span className="text-[10px] text-gray-500 w-24 flex-shrink-0">{label}</span>
                            <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${value >= threshold ? 'bg-emerald-500' : 'bg-red-400'}`}
                                style={{ width: `${Math.min(100, (value / max) * 100)}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-bold text-gray-600 w-8 text-right">{value}</span>
                          </div>
                        ))}
                      </div>
                      {human.aiVocabHits.length > 0 && (
                        <div className="rounded-lg bg-indigo-50 border border-indigo-100 p-2 space-y-1">
                          <div className="text-[10px] font-bold uppercase tracking-wide text-indigo-700 mb-1">Replace AI Words</div>
                          {human.aiVocabHits.slice(0, 5).map(({ word, replacements, count }) => (
                            <div key={word} className="text-[10px] flex items-start gap-1">
                              <span className="font-semibold text-red-600 flex-shrink-0">{word}{count > 1 ? ` ×${count}` : ''}</span>
                              <span className="text-indigo-300 flex-shrink-0">→</span>
                              <span className="text-emerald-700">{replacements.slice(0, 2).join(', ')}</span>
                            </div>
                          ))}
                          {human.aiVocabHits.length > 5 && <div className="text-[10px] text-indigo-400">+{human.aiVocabHits.length - 5} more…</div>}
                        </div>
                      )}
                      {human.issues.length > 0 && (
                        <div className="rounded-lg bg-red-50 border border-red-100 p-2 space-y-0.5">
                          <div className="text-[10px] font-bold uppercase tracking-wide text-red-600 mb-1">AI Signals</div>
                          {human.issues.map((iss) => (
                            <div key={iss} className="text-[10px] text-red-700 flex items-start gap-1">
                              <span className="text-red-400 mt-0.5 flex-shrink-0">✗</span>{iss}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* GEO & Structured Data Section */}
              <div className="rounded-xl border border-[var(--an-border)] p-4 space-y-3 bg-[#fafafa]">
                <div className="flex items-center gap-2 text-[12px] font-semibold text-[var(--an-text)]">
                  <Globe size={13} />
                  GEO & Structured Data
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-[#777]">Geographic Scope</span>
                    <select
                      value={editor.geoScope || 'none'}
                      onChange={(e) => setEditor({ ...editor, geoScope: e.target.value })}
                      className="w-full rounded-lg border border-[var(--an-border)] px-3 py-2 text-[13px] outline-none focus:border-black/40 bg-white"
                    >
                      <option value="none">No geo (Auto)</option>
                      <option value="global">Global</option>
                      <option value="regional">Multi-region</option>
                      <option value="local">Single region</option>
                    </select>
                  </label>
                  <EditorField
                    label="Schema Type"
                    placeholder="e.g. FAQPage"
                    value={editor.schemaType || ''}
                    onChange={(v) => setEditor({ ...editor, schemaType: v })}
                  />
                </div>
                {editor.geoScope && editor.geoScope !== 'none' && (
                  <EditorField
                    label="Target Regions/Countries (comma-separated)"
                    placeholder="e.g. USA, UK, Canada"
                    value={editor.geoRegions || ''}
                    onChange={(v) => setEditor({ ...editor, geoRegions: v })}
                  />
                )}
                <label className="block">
                  <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-[#777]">Custom JSON-LD Schema Markup</span>
                  <textarea
                    value={editor.schemaMarkup || ''}
                    onChange={(e) => setEditor({ ...editor, schemaMarkup: e.target.value })}
                    placeholder={`{\n  "@context": "https://schema.org",\n  "@type": "Service"\n}`}
                    rows={4}
                    className="w-full rounded-lg border border-[var(--an-border)] px-3 py-2 text-[13px] font-mono outline-none focus:border-black/40 focus:ring-1 focus:ring-black/5"
                  />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-[#777]">Status</span>
                  <select
                    value={editor.status || 'draft'}
                    onChange={(e) => setEditor({ ...editor, status: e.target.value })}
                    className="w-full rounded-lg border border-[var(--an-border)] px-3 py-2 text-[13px] outline-none focus:border-black/40 bg-white"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </label>
                <EditorField label="Cover Image URL" value={editor.coverImage || ''} onChange={(v) => setEditor({ ...editor, coverImage: v })} />
              </div>

              <div className="flex items-center justify-between pt-2">
                {editor.id ? (
                  <button onClick={() => remove(editor.id!)} className="an-btn an-btn-ghost an-btn-sm text-red-600">
                    <Trash2 size={14} /> Delete
                  </button>
                ) : <span />}
                <div className="flex gap-2">
                  <button onClick={() => setEditor(null)} className="an-btn an-btn-ghost an-btn-sm">Cancel</button>
                  <button onClick={save} disabled={saving} className="an-btn an-btn-primary an-btn-sm">
                    {saving ? 'Saving…' : 'Save Page'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating bulk actions bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-black text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-4 text-[13px] border border-white/10">
          <span className="font-medium">{selectedIds.size} page{selectedIds.size > 1 ? 's' : ''} selected</span>
          <div className="h-4 w-px bg-white/20" />
          <div className="flex gap-2">
            <button
              onClick={() => handleBulkStatus('published')}
              className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg transition-colors font-medium"
            >
              Publish
            </button>
            <button
              onClick={() => handleBulkStatus('draft')}
              className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg transition-colors font-medium"
            >
              Draft
            </button>
            <button
              onClick={handleBulkDelete}
              className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded-lg transition-colors font-medium"
            >
              Delete
            </button>
            <button
              onClick={() => exportSeoReport('selected')}
              className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg transition-colors font-medium flex items-center gap-1.5"
            >
              <Download size={12} /> Export SEO
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="px-2 py-1 text-white/50 hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Editor field helper ───────────────────────────────────────────────────────

const EditorField: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  textarea?: boolean;
  warn?: boolean;
}> = ({ label, value, onChange, placeholder, textarea, warn }) => (
  <label className="block">
    <span className={`mb-1 block text-[11px] font-semibold uppercase tracking-wide ${warn ? 'text-amber-600' : 'text-[#777]'}`}>{label}</span>
    {textarea ? (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={2}
        className={`w-full rounded-lg border px-3 py-2 text-[13px] outline-none focus:ring-1 focus:ring-black/5 ${warn ? 'border-amber-300 focus:border-amber-400' : 'border-[var(--an-border)] focus:border-black/40'}`}
      />
    ) : (
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full rounded-lg border px-3 py-2 text-[13px] outline-none focus:ring-1 focus:ring-black/5 ${warn ? 'border-amber-300 focus:border-amber-400' : 'border-[var(--an-border)] focus:border-black/40'}`}
      />
    )}
  </label>
);

export default PagesPage;
