import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load env BEFORE any other imports
const envPath = fs.existsSync(path.join(__dirname, '../.env.production')) 
  ? path.join(__dirname, '../.env.production')
  : path.join(__dirname, '../.env');
dotenv.config({ path: envPath });

// Force override DATABASE_URL if not set or if it looks wrong (development only)
const isProd = process.env.NODE_ENV === 'production';
let forcedDbUrl = process.env.DATABASE_URL;

if (!isProd && process.env.DATABASE_URL?.includes('prisma/prisma')) {
  forcedDbUrl = 'file:' + path.resolve(__dirname, './prisma/dev.db');
}

if (forcedDbUrl) {
  process.env.DATABASE_URL = forcedDbUrl;
}

if (process.env.NODE_ENV !== 'production') {
  console.log('--- DEV: DATABASE_URL configured:', !!process.env.DATABASE_URL);
}

// NOW import everything else
import express from 'express';
import compression from 'compression';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { errorHandler, notFound } from './middleware/errorHandler';
import { authenticate, requireStaff, requireFinanceStaff } from './middleware/auth';
import helmet from 'helmet';
import { authLimiter, apiLimiter } from './middleware/rateLimiter';
import aiRoutes from './routes/aiRoutes';
import { checkAndTriggerScheduledMeetings } from './services/slackService';
import { checkGoogleCalendarMeetings } from './services/calendarService';

// AI is handled via local rule-based engine + Telegram escalation. No Google API key required.

const app = express();
app.disable('x-powered-by');

// Compress all responses — reduces payload size ~3-5x for JSON and HTML
app.use(compression());

morgan.token('uid', (req: any) => req?.user?.id || 'anon');
app.use(morgan('{"ts":":date[iso]","ip":":remote-addr","method":":method","url":":url","status":":status","len":":res[content-length]","rt_ms":":response-time","uid":":uid"}'));

// Coolify runs the app behind Traefik. Trust one proxy hop so Express and
// express-rate-limit use the real client IP from X-Forwarded-For instead of
// treating proxied requests as a misconfiguration.
app.set('trust proxy', 1);

// Block common sensitive-file probes so they never fall through to SPA index.
const blockedProbePaths = new Set([
  '/.env',
  '/.git',
  '/.git/config',
  '/.svn',
  '/.htaccess',
  '/wp-admin',
  '/xmlrpc.php',
  '/server-status',
]);
app.use((req, res, next) => {
  const path = req.path.toLowerCase();
  if (blockedProbePaths.has(path) || path.startsWith('/.git/')) {
    return res.status(404).send('Not Found');
  }
  return next();
});

const PORT = process.env.PORT || 3001;
const canonicalHost = (process.env.CANONICAL_HOST || 'reframevisuals.com').toLowerCase();
const redirectWwwToApex = String(process.env.REDIRECT_WWW_TO_APEX || 'true').toLowerCase() !== 'false';

// In-memory LRU cache for public GET API responses (portal and auth-gated routes excluded)
const CACHE_TTL = 30000; // 30 seconds
const CACHE_MAX_SIZE = 500; // evict oldest entry once this is reached
const responseCache = new Map<string, { data: any; timestamp: number }>();

const cacheMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (req.method !== 'GET') return next();
  if (req.path.startsWith('/api/portal')) return next();
  if (req.headers.authorization) return next();

  const guestId = req.headers['x-guest-id'] || 'no-guest';
  const cacheKey = `${req.originalUrl || req.url}:${guestId}`;
  const cached = responseCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return res.json(cached.data);
  }

  const originalJson = res.json.bind(res);
  res.json = (data: any) => {
    if (responseCache.size >= CACHE_MAX_SIZE) {
      // Evict oldest entry (Map preserves insertion order)
      const oldestKey = responseCache.keys().next().value;
      if (oldestKey) responseCache.delete(oldestKey);
    }
    responseCache.set(cacheKey, { data, timestamp: Date.now() });
    return originalJson(data);
  };

  next();
};

// Legacy CMS routes
import authRoutes from './routes/authRoutes';
import sectionRoutes from './routes/sectionRoutes';
import themeRoutes from './routes/themeRoutes';
import quoteRoutes from './routes/quoteRoutes';

// New Production Dashboard routes
import metricsRoutes from './routes/metrics';
import alertsRoutes from './routes/alerts';
import ordersRoutes from './routes/orders';
import editorsRoutes from './routes/editors';
import quotationsRoutes from './routes/quotations';
import pricingRoutes from './routes/pricing';
import financeRoutes from './routes/finance';
import payoutsRoutes from './routes/payouts';
import tasksRoutes from './routes/tasks';
import supportRoutes from './routes/support';
import assetsRoutes from './routes/assets';
import imagesRoutes from './routes/images';
import businessRoutes from './routes/business';
import { outreachRouter, unsubscribeHandler } from './routes/outreachRoutes';
import { processDueEnrollments, checkReplies } from './services/outreachService';
import operationsRoutes from './routes/operations';
import searchRoutes from './routes/search';
import meetingRoutes from './routes/meetingRoutes';
import quoteBuilderRoutes from './routes/quoteBuilderRoutes';
import portalRoutes from './routes/portalRoutes';
import platformRoutes from './routes/platformRoutes';
import userManagementRoutes from './routes/userManagement';
import paymentRoutes from './routes/paymentRoutes';
import seoRoutes, { generateLlmsTxt, generateLlmsFullTxt, generateRobotsTxt, generateSitemapXml } from './routes/seoRoutes';
import { INSIGHT_SUMMARIES } from './data/insightSummaries';
import { SEO_SERVICES } from './data/seoServices';
import { generateSeoContent } from './utils/seoContentGenerator';
import shopifyRoutes from './routes/shopifyRoutes';
import telegramRoutes from './routes/telegramRoutes';
import slackRoutes from './routes/slackRoutes';
import pushRoutes from './routes/pushRoutes';
import mcpRoutes from './routes/mcpRoutes';
import { cmsAdminRouter, cmsPublicRouter, publishScheduledPosts } from './routes/cms';
import analyticsRoutes from './routes/analytics';
import visitorAnalyticsRoutes from './routes/visitorAnalytics';
import { renderRouteHtml } from './services/ssrRenderer';

// Security headers
const cspReportOnlyPolicy = [
  "default-src 'self'",
  "script-src 'self' blob: https://static.cloudflareinsights.com https://*.cloudflareinsights.com https://accounts.google.com https://*.reframevisuals.com",
  "script-src-elem 'self' blob: https://static.cloudflareinsights.com https://*.cloudflareinsights.com https://accounts.google.com https://*.reframevisuals.com",
  "style-src 'self' https://fonts.googleapis.com https://api.fontshare.com https://accounts.google.com",
  "font-src 'self' data: https://fonts.gstatic.com https://api.fontshare.com https://*.fontshare.com",
  "img-src 'self' data: https: blob: https://res.cloudinary.com",
  "media-src 'self' https://res.cloudinary.com",
  "connect-src 'self' blob: https://reframevisuals.com https://*.reframevisuals.com https://api.cloudinary.com https://static.cloudflareinsights.com https://*.cloudflareinsights.com https://accounts.google.com",
  "frame-src 'self' https://accounts.google.com",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
  "object-src 'none'",
  "script-src-attr 'none'",
  "upgrade-insecure-requests",
  "report-uri /api/security/csp-report",
].join(';');

app.use((_req, res, next) => {
  res.setHeader('Permissions-Policy', "camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=(), fullscreen=(self)");
  res.setHeader('Content-Security-Policy-Report-Only', cspReportOnlyPolicy);
  next();
});

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "blob:", "https://static.cloudflareinsights.com", "https://*.cloudflareinsights.com", "https://accounts.google.com", "https://*.reframevisuals.com"],
      scriptSrcElem: ["'self'", "blob:", "https://static.cloudflareinsights.com", "https://*.cloudflareinsights.com", "https://accounts.google.com", "https://*.reframevisuals.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://api.fontshare.com", "https://accounts.google.com"],
      fontSrc: ["'self'", "data:", "https://fonts.gstatic.com", "https://api.fontshare.com", "https://*.fontshare.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:", "https://res.cloudinary.com"],
      mediaSrc: ["'self'", "https://res.cloudinary.com"],
      connectSrc: [
        "'self'", 
        "blob:",
        "https://reframevisuals.com", 
        "https://*.reframevisuals.com",
        "https://api.cloudinary.com", 
        "https://static.cloudflareinsights.com",
        "https://*.cloudflareinsights.com",
        "https://accounts.google.com"
      ],
      frameSrc: ["'self'", "https://accounts.google.com"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  referrerPolicy: { policy: 'no-referrer' },
  strictTransportSecurity: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));

// CORS configuration - Strict Allowlist
const parseCsvOrigins = (csv: string | undefined): string[] =>
  (csv || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

const productionOrigins = [
  'https://reframevisuals.com',
  'https://www.reframevisuals.com',
  process.env.FRONTEND_URL,
  ...parseCsvOrigins(process.env.CORS_ALLOWED_ORIGINS),
].filter(Boolean) as string[];

const devOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
];

const allowedOrigins = (isProd ? productionOrigins : [...productionOrigins, ...devOrigins]).filter(Boolean) as string[];

app.use(cors((req, callback) => {
  const requestPath = req.path || '';

  const options = {
    origin: (origin: string | undefined, cb: (err: Error | null, allow?: boolean) => void) => {
      // Allow health checks without Origin (Coolify/Docker health probe)
      if (!origin && requestPath === '/api/health') {
        return cb(null, true);
      }

      if (!origin) {
        // Allow same-origin browser navigations and non-CORS server requests without Origin.
        // Keep strict origin checks for requests that DO send Origin.
        return cb(null, true);
      }

      const isAllowedOrigin = allowedOrigins.includes(origin);
      const isLocalhost = origin.startsWith('http://localhost:');

      if (isAllowedOrigin || isLocalhost) {
        cb(null, true);
      } else {
        console.warn(`[CORS] Blocked request from: ${origin}`);
        cb(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Guest-ID'],
  };

  callback(null, options);
}));

// General rate limiting
app.use('/api', apiLimiter);

// Body parser middleware
app.use(express.json({
  limit: '10mb',
  verify: (req: any, _res, buf) => {
    req.rawBody = Buffer.from(buf);
  },
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const cspReports: Array<{ ts: string; violatedDirective: string; blockedUri: string; documentUri: string }> = [];

app.post('/api/security/csp-report', (req, res) => {
  const bodies = Array.isArray(req.body) ? req.body : [req.body];

  for (const body of bodies) {
    const cspPayload = body?.['csp-report'] || body?.body || body || {};
    const violatedDirective = cspPayload['violated-directive'] || cspPayload.violatedDirective || cspPayload.effectiveDirective || 'unknown';
    const blockedUri = cspPayload['blocked-uri'] || cspPayload.blockedUri || cspPayload.blockedURL || 'unknown';
    const documentUri = cspPayload['document-uri'] || cspPayload.documentUri || cspPayload.url || 'unknown';

    cspReports.push({ ts: new Date().toISOString(), violatedDirective, blockedUri, documentUri });
    if (cspReports.length > 200) cspReports.shift();
    console.warn('[CSP-REPORT]', { violatedDirective, blockedUri, documentUri });
  }

  res.status(204).end();
});

app.get('/api/security/csp-reports', (_req, res) => {
  res.json({ count: cspReports.length, reports: cspReports.slice(-50) });
});
app.use(cookieParser());

// Static files for uploads
// Static files for uploads are now served via authenticated routes in /api/files

// Apply cache middleware
app.use(cacheMiddleware);

// Canonical host redirect for SEO consistency.
// Redirect any non-canonical public host to the canonical domain.
app.use((req, res, next) => {
  const hostHeader = String(req.headers.host || '');
  const host = hostHeader.split(':')[0].toLowerCase();
  if (!host) return next();

  const isLocalHost = host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0';
  const isIpHost = /^\d{1,3}(?:\.\d{1,3}){3}$/.test(host);
  if (isLocalHost || isIpHost) return next();

  // Vercel preview/production *.vercel.app hosts serve the site directly.
  if (host.endsWith('.vercel.app')) return next();

  if (host === canonicalHost) return next();

  if (redirectWwwToApex && host === `www.${canonicalHost}`) {
    const destination = `https://${canonicalHost}${req.originalUrl || '/'}`;
    return res.redirect(301, destination);
  }

  const destination = `https://${canonicalHost}${req.originalUrl || '/'}`;
  return res.redirect(301, destination);
});

// ─────────────────────────────────────────────────────────────
// LEGACY CMS ROUTES (kept for backward compatibility)
// ─────────────────────────────────────────────────────────────

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/sections', sectionRoutes);
app.use('/api/theme', themeRoutes);
app.use('/api/quotes', quoteRoutes);
app.use('/api/ai', aiRoutes);

// ─────────────────────────────────────────────────────────────
// NEW PRODUCTION DASHBOARD ROUTES
// ─────────────────────────────────────────────────────────────

// Hero Metrics & Analytics
app.use('/api/metrics', authenticate, requireStaff, metricsRoutes);

// Alerts & Notifications
app.use('/api/alerts', authenticate, requireStaff, alertsRoutes);

// Production Orders & Kanban
// The realtime topic endpoint is fetched with ?token= (no custom headers); promote it before auth.
app.use('/api/orders/admin-stream', (req, _res, next) => {
  const token = req.query.token;
  if (typeof token === 'string' && !req.headers.authorization) req.headers.authorization = `Bearer ${token}`;
  next();
});
app.use('/api/kanban', authenticate, requireStaff, ordersRoutes);
app.use('/api/orders', authenticate, requireStaff, ordersRoutes);

// Editors Management
app.use('/api/editors', authenticate, requireStaff, editorsRoutes);

// Quotations
app.use('/api/quotations', authenticate, requireStaff, quotationsRoutes);

// Pricing Matrix
app.use('/api/pricing', authenticate, requireStaff, pricingRoutes);

// Finance Dashboard
app.use('/api/finance', authenticate, requireFinanceStaff, financeRoutes);

// Payouts Management
app.use('/api/payouts', authenticate, requireFinanceStaff, payoutsRoutes);

// Task Manager
app.use('/api/tasks', authenticate, requireStaff, tasksRoutes);

// Customer Support
app.use('/api/support', supportRoutes);

// Assets & Images
app.use('/api/assets', authenticate, requireStaff, assetsRoutes);
app.use('/api/images', authenticate, requireStaff, imagesRoutes);

// Business Operations (Attendance, Payroll, Leads, Partners, etc.)
app.use('/api/business', authenticate, requireStaff, businessRoutes);

// Outreach sequences — public unsubscribe first (no auth), then the staff API
app.get('/api/outreach/unsubscribe/:id', unsubscribeHandler);
app.use('/api/outreach', authenticate, requireStaff, outreachRouter);

// Operations (QC, Team, NDA, Style Guide, Watchlist, NPS, Referrals, Tours)
app.use('/api/operations', authenticate, requireStaff, operationsRoutes);

// Global Search
app.use('/api/search', authenticate, requireStaff, searchRoutes);

// Meeting Requests
app.use('/api/meeting', authenticate, requireStaff, meetingRoutes);

// Quote Builder
app.use('/api/quote', authenticate, requireStaff, quoteBuilderRoutes);

// Customer Portal
app.use('/api/portal', portalRoutes);
app.use('/api/platform', platformRoutes);
app.use('/api/users', userManagementRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/seo', seoRoutes);
app.use('/api/shopify', authenticate, shopifyRoutes);
app.use('/api/telegram', telegramRoutes);
app.use('/api/slack', slackRoutes);
app.use('/api/push', pushRoutes);
app.use('/api/mcp', apiLimiter, mcpRoutes);

// CMS: admin authoring (staff-only) + public blog reads (open)
app.use('/api/cms', authenticate, requireStaff, cmsAdminRouter);
app.use('/api/blog', cmsPublicRouter);

// Platform Analytics (staff-only)
app.use('/api/analytics', authenticate, requireStaff, analyticsRoutes);

// Visitor Analytics — Umami proxy (staff-only, API key never reaches browser)
app.use('/api/visitor-analytics', authenticate, requireStaff, visitorAnalyticsRoutes);

// Public SEO files must be served before the SPA fallback so crawlers do not receive index.html.
app.get('/sitemap.xml', async (_req, res) => {
  try {
    res.header('Content-Type', 'application/xml; charset=utf-8');
    return res.send(await generateSitemapXml());
  } catch (err) {
    return res.status(500).send('Internal Server Error');
  }
});
app.get('/robots.txt', (_req, res) => {
  res.header('Content-Type', 'text/plain; charset=utf-8');
  return res.send(generateRobotsTxt());
});
app.get('/llms.txt', async (_req, res) => {
  try {
    res.header('Content-Type', 'text/plain; charset=utf-8');
    return res.send(await generateLlmsTxt());
  } catch (err) {
    return res.status(500).send('Internal Server Error');
  }
});
app.get('/llms-full.txt', async (_req, res) => {
  try {
    res.header('Content-Type', 'text/plain; charset=utf-8');
    return res.send(await generateLlmsFullTxt());
  } catch (err) {
    return res.status(500).send('Internal Server Error');
  }
});
app.get('/e98f70ffefc446b5bad6e9da8da4e631.txt', (_req, res) => {
  res.header('Content-Type', 'text/plain; charset=utf-8');
  return res.send('e98f70ffefc446b5bad6e9da8da4e631');
});

app.get('/sitemap_index.xml', (_req, res) => {
  // This project uses a single sitemap endpoint.
  return res.redirect(301, '/sitemap.xml');
});

// FIX: Removed duplicate ghost route that was creating an unintended CORS bypass surface

// ─────────────────────────────────────────────────────────────
// HEALTH CHECK & LEGACY ENDPOINTS
// ─────────────────────────────────────────────────────────────

app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    message: 'Production Dashboard API is running',
    timestamp: new Date().toISOString(),
    endpoints: {
      metrics: '/api/metrics/hero',
      alerts: '/api/alerts',
      kanban: '/api/kanban',
      editors: '/api/editors',
      quotations: '/api/quotations',
      pricing: '/api/pricing/customer-tiers',
      finance: '/api/finance/dashboard',
      payouts: '/api/payouts/batches',
    },
  });
});

// ─────────────────────────────────────────────────────────────
// FRONTEND SERVING (Production only)
// In development, Vite serves the frontend on port 5173.
// ─────────────────────────────────────────────────────────────

// Serve frontend SPA when a build exists, regardless of NODE_ENV.
// This avoids deep-link 404s in environments where NODE_ENV may be misconfigured.
const possiblePaths = [
  path.join(__dirname, '../../frontend/dist'),        // Default Vite output in monorepo
  path.join(__dirname, '../../frontend/public_html'), // Alternative path
  path.join(__dirname, '../../dist'),                 // Fallback if copied to root
  path.join(__dirname, '../public_html'),             // Relative to dist in some setups
];

const frontendPath = possiblePaths.find((p) => {
  try {
    return fs.existsSync(path.join(p, 'index.html'));
  } catch {
    return false;
  }
});

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const replaceTag = (html: string, regex: RegExp, replacement: string): string => {
  return regex.test(html) ? html.replace(regex, replacement) : html;
};

const DEFAULT_OG_IMAGE = 'https://res.cloudinary.com/dnmj4altq/image/upload/v1781548471/reframe-visuals-your-editing-partner_xzvgbl.png';

const BLOG_SEO_ASSETS: Record<string, { ogImage?: string; faq?: Array<{ question: string; answer: string }> }> = {
  'ghost-mannequin-fit-and-conversion': {
    ogImage: 'https://res.cloudinary.com/dnmj4altq/image/upload/f_auto,q_auto,w_1200/v1782560934/reframe/lingerie-bodysuit-navy-lace-ghost-mannequin-bd.jpg',
    faq: [
      {
        question: 'What is ghost mannequin editing?',
        answer: 'Ghost mannequin editing is a post-production method that removes the mannequin or dress form from apparel photos and rebuilds hidden garment areas, usually with inner neck, back, or detail images. The result is a clean hollow-body product image that shows shape and structure without the mannequin.',
      },
      {
        question: 'What photos are needed for ghost mannequin editing?',
        answer: 'Most products need a front mannequin image and an inner neck or label image. Jackets, hoodies, dresses, blazers, and structured apparel may also need back, sleeve, cuff, hood, hem, or lining photos so the editor can rebuild hidden areas accurately.',
      },
      {
        question: 'Why does ghost mannequin editing help ecommerce apparel images?',
        answer: 'It helps shoppers understand collar shape, sleeve fall, body width, fabric behavior, and product structure before they read the size chart. That clarity can reduce doubt and make the product page feel more trustworthy.',
      },
      {
        question: 'When should brands use ghost mannequin editing instead of flat lay or model photography?',
        answer: 'Use ghost mannequin editing when the product needs a clean catalog image with more shape than flat lay and less distraction than model photography. It works well for shirts, jackets, hoodies, dresses, sportswear, sweaters, kidswear, uniforms, and structured apparel.',
      },
      {
        question: 'What makes a ghost mannequin edit look natural?',
        answer: 'A natural edit needs matching source photos, careful neck joint compositing, believable shadows, balanced shoulders, clean edges, preserved fabric texture, and consistent crop across the product set. The edit should improve clarity without making the garment look fake.',
      },
    ],
  },
};

const injectSeoMeta = (
  html: string,
  opts: {
    title: string;
    description: string;
    canonical: string;
    h1?: string;
    ogType?: 'website' | 'article';
    ogImage?: string;
    structuredData?: Record<string, unknown> | Array<Record<string, unknown>>;
    seoContent?: string;
  }
): string => {
  const title = escapeHtml(opts.title);
  const description = escapeHtml(opts.description);
  const canonical = escapeHtml(opts.canonical);
  const ogImage = escapeHtml(opts.ogImage || DEFAULT_OG_IMAGE);
  const ogType = opts.ogType || 'website';
  const hreflangBlock = [
    `<link rel="alternate" hreflang="en" href="${canonical}" />`,
    `<link rel="alternate" hreflang="x-default" href="${canonical}" />`,
  ].join('\n  ');

  // Head-tag surgery is limited to the <head> section and uses tag-safe
  // patterns ([^>]* cannot cross a tag boundary). The previous
  // `[\s\S]*?"\s*\/>` patterns assumed the self-closing tags of the Vite
  // template; on browser-serialized prerendered HTML (no "/>") they could
  // swallow everything up to the next "/>", deleting chunks of the head.
  // Removing every existing occurrence before inserting exactly one copy also
  // fixes the historical duplicate title/canonical quirk.
  const headCloseIdx = html.indexOf('</head>');
  if (headCloseIdx === -1) return html;

  let head = html.slice(0, headCloseIdx);
  const afterHead = html.slice(headCloseIdx); // starts with '</head>'

  const removePatterns: RegExp[] = [
    /<title[^>]*>[\s\S]*?<\/title>/gi,
    /<meta\s[^>]*name="description"[^>]*>/gi,
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
  for (const pattern of removePatterns) {
    head = head.replace(pattern, '');
  }

  const headInserts = [
    `<title>${title}</title>`,
    `<meta name="description" content="${description}" />`,
    `<link rel="canonical" href="${canonical}" />`,
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${description}" />`,
    `<meta property="og:type" content="${ogType}" />`,
    `<meta property="og:url" content="${canonical}" />`,
    `<meta property="og:image" content="${ogImage}" />`,
    `<meta name="twitter:title" content="${title}" />`,
    `<meta name="twitter:description" content="${description}" />`,
    `<meta name="twitter:image" content="${ogImage}" />`,
    hreflangBlock,
  ].join('\n  ');

  let out = `${head}  ${headInserts}\n${afterHead}`;

  if (opts.h1) {
    const h1 = escapeHtml(opts.h1);
    out = replaceTag(out, /<h1>Reframe Visuals<\/h1>/i, `<h1>${h1}</h1>`);
  }

  if (opts.structuredData) {
    const blocks = (Array.isArray(opts.structuredData) ? opts.structuredData : [opts.structuredData])
      .filter(Boolean)
      .map((item) => `<script type="application/ld+json">${JSON.stringify(item)}</script>`)
      .join('\n  ');
    if (blocks) out = out.replace('</head>', `  ${blocks}\n  </head>`);
  }

  if (opts.seoContent) {
    const noscriptRegex = /<noscript>[\s\S]*?<\/noscript>/i;
    const replacementNoscript = `<noscript>
      <div style="padding: 40px; font-family: system-ui, -apple-system, sans-serif; max-width: 800px; margin: 0 auto; line-height: 1.6; color: #171717;">
        ${opts.seoContent}
      </div>
    </noscript>`;
    out = replaceTag(out, noscriptRegex, replacementNoscript);
  }

  return out;
};

const stripAllJsonLdScripts = (html: string): string =>
  html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, '');
const stripJsonLdTypes = (html: string, blockedTypes: string[]): string =>
  html.replace(/<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/gi, (full, payload) => {
    try {
      const parsed = JSON.parse(payload);
      const arr = Array.isArray(parsed) ? parsed : [parsed];
      const hasBlocked = arr.some((item) => item && typeof item === 'object' && blockedTypes.includes(String((item as Record<string, unknown>)['@type'] || '')));
      return hasBlocked ? '' : full;
    } catch {
      return full;
    }
  });

const makeBreadcrumbSchema = (pathname: string): Record<string, unknown> | undefined => {
  if (pathname === '/blog') {
    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://reframevisuals.com/' },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://reframevisuals.com/blog' },
      ],
    };
  }

  if (pathname.startsWith('/blog/')) {
    const slug = pathname.split('/').filter(Boolean)[1] || '';
    const name = slug
      .split('-')
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://reframevisuals.com/' },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://reframevisuals.com/blog' },
        { '@type': 'ListItem', position: 3, name: name || 'Article', item: `https://reframevisuals.com${pathname}` },
      ],
    };
  }

  if (pathname === '/services') {
    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://reframevisuals.com/' },
        { '@type': 'ListItem', position: 2, name: 'Services', item: 'https://reframevisuals.com/services' },
      ],
    };
  }

  if (pathname === '/portfolio') {
    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://reframevisuals.com/' },
        { '@type': 'ListItem', position: 2, name: 'Portfolio', item: 'https://reframevisuals.com/portfolio' },
      ],
    };
  }

  if (!pathname.startsWith('/services/')) return undefined;
  const segments = pathname.split('/').filter(Boolean);
  const itemListElement: Array<Record<string, unknown>> = [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://reframevisuals.com/' },
    { '@type': 'ListItem', position: 2, name: 'Services', item: 'https://reframevisuals.com/services' },
  ];
  let acc = '';
  for (let i = 1; i < segments.length; i++) {
    acc += `/${segments[i]}`;
    const name = segments[i]
      .split('-')
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
    itemListElement.push({
      '@type': 'ListItem',
      position: i + 2,
      name,
      item: `https://reframevisuals.com/services${acc}`,
    });
  }
  return { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement };
};

const SEO_META_BY_PATH: Record<string, { title: string; description: string }> = {
  '/': {
    title: 'Ecommerce Product Photo Editing for Catalog-Ready Images | Reframe Visuals',
    description: 'Get 3 free sample edits from Reframe Visuals. Human Photoshop editors and AI-assisted workflows for Amazon, apparel, jewelry, agencies, and ecommerce catalogs.',
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
  '/contact': {
    title: 'Contact Reframe Visuals | Start Your Editing Workflow',
    description: 'Contact Reframe Visuals to discuss image editing requirements, turnaround times, and quality standards for your brand.',
  },
  '/contact-us': {
    title: 'Contact Reframe Visuals | Start Your Editing Workflow',
    description: 'Reach out to Reframe Visuals for custom quotes, onboarding help, and support for high-volume product image editing.',
  },
  '/free-trial': {
    title: '3 Free Sample Edits for Ecommerce Product Photos | Reframe Visuals',
    description: 'Upload up to 3 product photos and review free sample edits before ordering. Built for Amazon, apparel, jewelry, agencies, and catalog teams.',
  },
  '/pilot-batch': {
    title: 'Test Batch Review | Reframe Visuals',
    description: 'Submit a paid test batch for service-specific review, output-format preferences, and complexity-based pricing confirmation.',
  },
  '/order/dedicated': {
    title: 'Dedicated Order Page | Reframe Visuals',
    description: 'Start a dedicated photo editing order with Reframe Visuals. Upload assets, set requirements, and submit a focused project brief from the same order flow.',
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
  '/quality-assurance-process': {
    title: 'Quality Assurance Process for Ecommerce Image Editing | Reframe Visuals',
    description: 'Understand the quality assurance process Reframe Visuals uses to maintain consistent ecommerce image editing output at scale.',
  },
  '/turnaround-sla': {
    title: 'Turnaround SLA for Ecommerce Image Editing | Reframe Visuals',
    description: 'Review standard and rush turnaround SLA options for ecommerce product image editing workflows, including priority queues, quality checkpoints, and delivery expectations.',
  },
  '/who-is-reframe-visuals': {
    title: 'Who Is Reframe Visuals? | Ecommerce Photo Editing Studio',
    description: 'Reframe Visuals is a product photo editing and creative operations company for ecommerce brands, Amazon sellers, agencies, and studios.',
  },
  '/reframe-visuals-brand-facts': {
    title: 'Reframe Visuals Brand Facts | Official Entity Profile',
    description: 'Official Reframe Visuals entity facts: ecommerce photo editing studio, services, audiences, free sample edits, contact details, and disambiguation.',
  },
  '/free-sample-edit': {
    title: 'Free Sample Edit for Product Photos | Reframe Visuals',
    description: 'New Reframe Visuals customers can request 3 free sample product photo edits to review quality before placing a paid order.',
  },
  '/resources': {
    title: 'Ecommerce Photo Editing Resources | Reframe Visuals',
    description: 'Explore practical ecommerce image editing resources, checklists, pricing guides, and production workflows from Reframe Visuals.',
  },
  '/pixelz-alternative': {
    title: 'Pixelz Alternative | Human-Reviewed Ecommerce Photo Editing',
    description: 'Looking for a Pixelz alternative? Reframe Visuals offers manual Pen Tool editing, 12h turnaround, dual-stage QA, and 3 free sample edits.',
  },
  '/clipping-path-india-alternative': {
    title: 'Clipping Path India Alternative | Reframe Visuals',
    description: 'Compare Reframe Visuals with clipping path India providers for manual Photoshop editing, QA review, fast turnaround, and ecommerce-ready results.',
  },
  '/cutoutwiz-alternative': {
    title: 'CutoutWiz Alternative | Reframe Visuals',
    description: 'Compare Reframe Visuals with CutoutWiz for ecommerce photo editing, manual QA, clipping path, retouching, and scalable catalog production.',
  },
  '/amazon-product-image-editing': {
    title: 'Amazon Product Image Editing | Reframe Visuals',
    description: 'Amazon Product Image Editing for ecommerce brands focused on consistent visual quality, faster launches, and better conversion performance.',
  },
  '/shopify-product-photo-editing': {
    title: 'Shopify Product Photo Editing Service | Reframe Visuals',
    description: 'Shopify product photo editing for stronger PDP conversion, variant consistency, and theme-ready visual systems. Starting at $0.39/image with 24h turnaround.',
  },
  '/woocommerce-product-image-editing': {
    title: 'Woocommerce Product Image Editing | Reframe Visuals',
    description: 'Woocommerce Product Image Editing for ecommerce brands focused on consistent visual quality, faster launches, and better conversion performance.',
  },
  '/fashion-photo-retouching-service': {
    title: 'Fashion Photo Retouching Service | Reframe Visuals',
    description: 'Fashion Photo Retouching Service for ecommerce brands focused on consistent visual quality, faster launches, and better conversion performance.',
  },
  '/jewelry-photo-retouching-service': {
    title: 'Jewelry Photo Retouching Service | Reframe Visuals',
    description: 'Jewelry Photo Retouching Service for ecommerce brands focused on consistent visual quality, faster launches, and better conversion performance.',
  },
  '/furniture-photo-editing-service': {
    title: 'Furniture Photo Editing Service | Reframe Visuals',
    description: 'Furniture Photo Editing Service for ecommerce brands focused on consistent visual quality, faster launches, and better conversion performance.',
  },
  '/us-photo-editing-service': {
    title: 'US Ecommerce Photo Editing Service | Reframe Visuals',
    description: 'Photo editing services for US ecommerce teams needing fast turnaround, consistent quality control, and scalable production support for growing catalogs.',
  },
  '/uk-photo-editing-service': {
    title: 'UK Ecommerce Photo Editing Service | Reframe Visuals',
    description: 'UK-focused ecommerce image editing with consistent quality control, fast turnaround options, and reliable production support for growth-stage catalogs.',
  },
  '/canada-photo-editing-service': {
    title: 'Canada Ecommerce Photo Editing Service | Reframe Visuals',
    description: 'Scalable ecommerce photo editing support for Canadian brands, with category-specific workflows, quality assurance checks, and dependable bulk turnaround.',
  },
  '/australia-photo-editing-service': {
    title: 'Australia Ecommerce Photo Editing Service | Reframe Visuals',
    description: 'Australia-focused ecommerce image editing with quality-first workflows, launch-ready turnaround options, and dependable support for seasonal catalog peaks.',
  },
  '/uae-photo-editing-service': {
    title: 'UAE Ecommerce Photo Editing Service | Reframe Visuals',
    description: 'Premium ecommerce photo editing support for UAE brands needing high visual quality, predictable delivery windows, and conversion-focused catalog consistency.',
  },
  '/singapore-photo-editing-service': {
    title: 'Singapore Ecommerce Photo Editing Service | Reframe Visuals',
    description: 'Singapore ecommerce photo editing with fast delivery windows, consistent quality standards, and scalable production support for multi-channel sellers.',
  },
  '/ai-product-visuals': {
    title: 'AI Product Visuals for Ecommerce | Reframe Visuals',
    description: 'Generate PDP images, fashion photoshoots, lifestyle scenes, UGC-style ads, product videos, and catalog visuals from existing product assets with human-reviewed AI production.',
  },
  '/resources/amazon-image-compliance-checklist-2026': {
    title: 'Amazon Image Compliance Checklist 2026 | Reframe Visuals',
    description: 'A practical checklist to keep Amazon product images compliant while improving visual consistency and conversion readiness.',
  },
  '/resources/shopify-product-photography-conversion-playbook': {
    title: 'Ecommerce Product Photography Conversion Playbook | Reframe Visuals',
    description: 'A conversion-focused ecommerce product photography and post-production playbook with practical setup steps, visual standards, and rollout workflows for online brands.',
  },
  '/resources/ghost-mannequin-vs-flat-lay-when-to-use-each': {
    title: 'Ghost Mannequin vs Flat Lay: When to Use Each | Reframe Visuals',
    description: 'Compare ghost mannequin and flat lay approaches for ecommerce apparel imagery, with decision criteria, production implications, and conversion trade-offs.',
  },
  '/resources/how-to-scale-photo-editing-for-10000-skus': {
    title: 'How to Scale Photo Editing for 10,000 SKUs | Reframe Visuals',
    description: 'Framework for scaling ecommerce photo editing operations across large SKU catalogs without quality drift, including workflow design, QA checkpoints, and team handoffs.',
  },
  '/resources/jewelry-retouching-quality-checklist': {
    title: 'Jewelry Retouching Quality Checklist | Reframe Visuals',
    description: 'A practical quality checklist for jewelry retouching workflows focused on detail clarity, consistency standards, and trust-building visual accuracy.',
  },
  '/resources/ecommerce-image-sla-framework-for-growth-teams': {
    title: 'Ecommerce Image SLA Framework for Growth Teams | Reframe Visuals',
    description: 'Build an SLA framework for ecommerce image production to improve predictability, turnaround speed, and launch readiness across teams and seasonal demand spikes.',
  },
  '/blog': {
    title: 'E-commerce Photo Editing Blog & Guides | Reframe Visuals',
    description: 'Read practical guides on e-commerce product photography, retouching quality, marketplace compliance, and conversion-focused image strategy for growing brands.',
  },
};

const toTitleCase = (raw: string): string =>
  raw
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const titleToH1 = (title: string): string => {
  const clean = title.replace(/\s*\|\s*Reframe Visuals(?:\s+Insights)?\s*$/i, '').trim();
  return clean || 'Reframe Visuals';
};

const normalizeText = (value: string): string =>
  value
    .replace(/\\+/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const clampAtWord = (value: string, max: number): string => {
  const clean = normalizeText(value);
  if (clean.length <= max) return clean;
  const truncated = clean.slice(0, max + 1);
  const lastSpace = truncated.lastIndexOf(' ');
  return `${(lastSpace > 20 ? truncated.slice(0, lastSpace) : clean.slice(0, max)).trim()}…`;
};

const normalizeSeoTitle = (value: string): string => clampAtWord(value, 64);

const normalizeSeoDescription = (value: string, fallback: string): string => {
  const base = normalizeText(value || '');
  const usable = base.length >= 60 ? base : normalizeText(fallback);
  return clampAtWord(usable, 165);
};

const resolvePageSeo = (pathname: string): { title: string; description: string } => {
  const normalized = pathname === '' ? '/' : pathname;
  if (SEO_META_BY_PATH[normalized]) return SEO_META_BY_PATH[normalized];

  if (normalized.startsWith('/services/')) {
    const parts = normalized.replace('/services/', '').split('/').filter(Boolean);
    const serviceSlug = parts[0] || 'service';
    const intentSlug = parts[1] || '';
    const serviceName = toTitleCase(serviceSlug);
    const service = SEO_SERVICES.find((item) => item.id === serviceSlug);

    if (intentSlug === 'best-for-ecommerce') {
      return {
        title: `${serviceName} Best for Ecommerce | Reframe Visuals`,
        description: `${serviceName} service best for ecommerce teams needing consistent product visuals, scalable QA, and conversion-ready delivery workflows.`,
      };
    }

    if (intentSlug === 'pricing-guide') {
      return {
        title: `${serviceName} Pricing Guide (US/UK/AU/EU) | Reframe Visuals`,
        description: `Practical ${serviceName.toLowerCase()} pricing guide for ecommerce teams: scope drivers, turnaround tradeoffs, and ways to optimize cost at scale.`,
      };
    }

    if (intentSlug === 'turnaround-quality') {
      return {
        title: `${serviceName} Turnaround and Quality | Reframe Visuals`,
        description: `${serviceName} turnaround and quality benchmarks for ecommerce operations teams balancing speed, accuracy, and listing consistency.`,
      };
    }

    return {
      title: service?.metaTitle || `${serviceName} Service | Reframe Visuals`,
      description: service?.metaDescription || `${serviceName} photo editing service for e-commerce brands. Improve consistency, speed, and conversion-ready visual quality with Reframe Visuals.`,
    };
  }

  if (normalized.startsWith('/blog/')) {
    return {
      title: 'Reframe Visuals Blog',
      description: 'Read practical guides on product visuals, editing workflows, and conversion-focused image strategy.',
    };
  }

  if (normalized.startsWith('/case-studies/')) {
    const slug = normalized.replace('/case-studies/', '').split('/').filter(Boolean)[0] || 'case-study';
    const name = toTitleCase(slug);
    const caseStudyDescriptions: Record<string, string> = {
      'amazon-accessories-sku-cleanup': 'Case study: Amazon accessories SKU cleanup that improved catalog consistency, reduced rejects, and accelerated listing-ready image delivery at scale.',
      'fashion-drop-48-hour-turnaround': 'Case study: 48-hour fashion drop production pipeline delivering high-volume retouching with on-time launch support and consistent visual output.',
      'jewelry-retouching-conversion-lift': 'Case study: precision jewelry retouching workflow that enhanced metal and gemstone detail while supporting stronger conversion performance.',
      'furniture-catalog-standardization': 'Case study: furniture catalog standardization across large SKU sets with consistent color, shadow, and framing for cleaner shopping experiences.',
      'marketplace-compliance-recovery': 'Case study: marketplace compliance recovery program that fixed image policy issues and restored approved, publish-ready product listings.',
      'shopify-seasonal-launch-sprint': 'Case study: seasonal launch sprint with rapid image processing, coordinated QA, and dependable turnaround for campaign deadlines.',
      'ghost-mannequin-scale-program': 'Case study: ghost mannequin scale program for apparel brands, improving fit presentation consistency and high-throughput production reliability.',
      'multi-brand-color-consistency': 'Case study: multi-brand color consistency initiative using calibrated editing workflows to unify product appearance across channels and campaigns.',
    };

    return {
      title: `Case Study: ${name} | Reframe Visuals`,
      description: caseStudyDescriptions[slug] || 'Real ecommerce image production case study with measurable outcomes in quality consistency, turnaround, and workflow efficiency.',
    };
  }

  if (normalized.startsWith('/resources/')) {
    const slug = normalized.replace('/resources/', '').split('/').filter(Boolean)[0] || 'resource';
    const name = toTitleCase(slug);
    return {
      title: `${name} | Reframe Visuals`,
      description: 'Practical ecommerce image production resource from Reframe Visuals focused on quality, speed, and conversion outcomes.',
    };
  }

  return {
    title: 'Reframe Visuals | Professional Photo Editing Services for E-commerce',
    description: 'Professional image editing services for e-commerce teams needing speed, consistency, and conversion-focused product visuals.',
  };
};

if (frontendPath) {
  console.log(`[SPA] Serving frontend from: ${frontendPath}`);
  app.use(
    express.static(frontendPath, {
      index: false,
      // Don't 301 /route -> /route/ when a prerendered directory exists;
      // the SPA fallback below serves the right HTML for the clean URL.
      redirect: false,
      setHeaders: (res, filePath) => {
        if (filePath.includes(`${path.sep}assets${path.sep}`)) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
          return;
        }
        if (filePath.endsWith('index.html')) {
          res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
        }
      },
    })
  );

  const indexPath = path.join(frontendPath, 'index.html');

  // ── HTML resolution: prerendered static cache → per-request SSR → CSR shell ──
  //
  // 1) Build-time prerendered files (dist/<route>/index.html, written by
  //    scripts/prerender.mjs) are the fast static cache with fully hydrated
  //    page content.
  // 2) Routes without a prerendered file are server-side rendered per request
  //    with the Vite SSR bundle (frontend/dist-ssr) — see services/ssrRenderer.
  // 3) If SSR is unavailable or fails, the plain SPA shell is served so the
  //    site never 500s because of rendering.
  // In every case injectSeoMeta below remains the single source of truth for
  // head tags (title/description/canonical/OG/JSON-LD).

  const readPrerenderedHtml = async (pathname: string): Promise<string | null> => {
    const normalized = pathname.replace(/\/+$/, '') || '/';
    // '/' is dist/index.html itself (already prerendered at build time).
    if (normalized === '/') return null;
    const candidate = path.normalize(path.join(frontendPath, normalized, 'index.html'));
    if (!candidate.startsWith(frontendPath + path.sep)) return null;
    try {
      return await fs.promises.readFile(candidate, 'utf8');
    } catch {
      return null;
    }
  };

  // Clean CSR shell (empty #root) used as the SSR injection template. After
  // prerendering, dist/index.html contains the captured homepage markup, so
  // the prerenderer saves the pristine shell as index.csr.html.
  let ssrTemplateCache: string | null = null;
  const getSsrTemplate = async (): Promise<string | null> => {
    if (ssrTemplateCache) return ssrTemplateCache;
    const candidates = [path.join(frontendPath, 'index.csr.html'), indexPath];
    for (const candidate of candidates) {
      try {
        const content = await fs.promises.readFile(candidate, 'utf8');
        if (/<div id="root">\s*<\/div>/.test(content)) {
          ssrTemplateCache = content;
          return content;
        }
      } catch {
        // try next candidate
      }
    }
    return null;
  };

  const resolveBaseHtml = async (pathname: string, shellHtml: string): Promise<string> => {
    const prerendered = await readPrerenderedHtml(pathname);
    if (prerendered) return prerendered;

    const template = await getSsrTemplate();
    if (template) {
      const ssrHtml = await renderRouteHtml(pathname, template);
      if (ssrHtml) return ssrHtml;
    }

    return shellHtml;
  };

  app.get('/insights', (_req, res) => {
    return res.redirect(301, '/blog');
  });

  app.get('/insights/:slug', (req, res) => {
    const slug = String(req.params.slug || '').trim();
    return res.redirect(301, `/blog/${slug}`);
  });

  // Brand alias routes to consolidate navigational intent variants.
  app.get(['/reframe', '/reframe-visuals', '/reframevisuals'], (_req, res) => {
    return res.redirect(301, '/');
  });

  // Legacy/typo service slugs: consolidate to canonical route.
  const SERVICE_SLUG_REDIRECTS: Record<string, string> = {
    '/services/model-retouching': '/services/model-retouch',
    '/services/jewelry-retouching': '/services/jewelry-retouch',
    '/services/brand-alignment': '/services/retouching',
    '/services/enterprise': '/services/ai-product-photography',
    '/services/image-editing': '/services/retouching',
    '/services/product-editing': '/services/retouching',
  };

  app.get(Object.keys(SERVICE_SLUG_REDIRECTS), (req, res) => {
    const destination = SERVICE_SLUG_REDIRECTS[req.path];
    if (!destination) return res.status(404).end();
    return res.redirect(301, destination);
  });

  // Renamed blog slugs: preserve existing links and index entries after a rename.
  const BLOG_SLUG_REDIRECTS: Record<string, string> = {
    '/blog/support-shot-compositing-for-product-images': '/blog/support-images-in-product-photography',
  };

  app.get(Object.keys(BLOG_SLUG_REDIRECTS), (req, res) => {
    const destination = BLOG_SLUG_REDIRECTS[req.path];
    if (!destination) return res.status(404).end();
    return res.redirect(301, destination);
  });

  app.get('/blog', async (_req, res, next) => {
    try {
      const shell = await fs.promises.readFile(indexPath, 'utf8');
      const html = await resolveBaseHtml('/blog', shell);
      const blogHtml = stripJsonLdTypes(html, ['Service', 'FAQPage', 'ItemList']);
      const rendered = injectSeoMeta(blogHtml, {
        title: normalizeSeoTitle('Ecommerce Photo Editing Blog | Reframe Visuals'),
        description: normalizeSeoDescription(
          'Read practical guides on e-commerce product photography, retouching quality, marketplace compliance, and conversion-focused image strategy for growing brands.',
          'Read practical guides on e-commerce product photography, retouching quality, marketplace compliance, and conversion-focused image strategy for growing brands.'
        ),
        canonical: 'https://reframevisuals.com/blog',
        h1: 'Blog',
        ogType: 'website',
        structuredData: makeBreadcrumbSchema('/blog'),
        seoContent: generateSeoContent('/blog'),
      });
      res.type('html').send(rendered);
    } catch (err) {
      next(err);
    }
  });

  app.get('/blog/:slug', async (req, res, next) => {
    try {
      const slug = String(req.params.slug || '').trim().toLowerCase();
      const shell = await fs.promises.readFile(indexPath, 'utf8');
      const html = await resolveBaseHtml(`/blog/${slug}`, shell);
      const summary = INSIGHT_SUMMARIES.find((item) => item.slug.toLowerCase() === slug);
      const fallbackTitle = slug
        .split('-')
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ') || 'Blog Article';

      const effectiveTitle = summary?.title || fallbackTitle;
      const canonical = `https://reframevisuals.com/blog/${summary?.slug || slug}`;
      const blogSeoAsset = BLOG_SEO_ASSETS[summary?.slug || slug];
      const description = normalizeSeoDescription(
        summary?.excerpt || '',
        `Read ${effectiveTitle} and learn practical ecommerce photo editing workflows, quality controls, and conversion-focused visual strategy from Reframe Visuals.`
      );
      const pageTitle = normalizeSeoTitle(`${effectiveTitle} | Reframe Visuals Blog`);
      const blogPostingSchema = {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: effectiveTitle,
        description,
        url: canonical,
        mainEntityOfPage: canonical,
        publisher: {
          '@type': 'Organization',
          name: 'Reframe Visuals',
          logo: {
            '@type': 'ImageObject',
            url: 'https://reframevisuals.com/logo.svg',
          },
        },
      };
      const structuredData = [
        blogPostingSchema,
        makeBreadcrumbSchema(`/blog/${summary?.slug || slug}`),
        blogSeoAsset?.faq?.length
          ? {
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: blogSeoAsset.faq.map((item) => ({
                '@type': 'Question',
                name: item.question,
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: item.answer,
                },
              })),
            }
          : undefined,
      ].filter(Boolean) as Array<Record<string, unknown>>;

      const blogHtml = stripJsonLdTypes(html, ['Service', 'FAQPage', 'ItemList']);
      const rendered = injectSeoMeta(blogHtml, {
        title: pageTitle,
        description,
        canonical,
        h1: effectiveTitle,
        ogType: 'article',
        ogImage: blogSeoAsset?.ogImage,
        structuredData,
        seoContent: generateSeoContent(`/blog/${summary?.slug || slug}`),
      });
      return res.type('html').send(rendered);
    } catch (err) {
      return next(err);
    }
  });

  const PUBLIC_ROUTE_PREFIXES = ['/services/', '/blog/', '/case-studies/', '/resources/', '/compare/'];
  const PUBLIC_EXACT_ROUTES = new Set([
    '/', '/services', '/pricing', '/about', '/portfolio', '/contact', '/contact-us', '/privacy', '/terms', '/cookies', '/security', '/free-trial', '/pilot-batch', '/book-meeting', '/quote-builder', '/case-studies', '/resources', '/quality-assurance-process', '/turnaround-sla',
    '/about-reframe-visuals', '/reframe-visuals-services', '/ai-product-visuals', '/order', '/order/new', '/order/dedicated',
    '/who-is-reframe-visuals', '/reframe-visuals-brand-facts', '/free-sample-edit', '/reframe-visuals-pricing', '/reframe-visuals-reviews',
    '/reframe-visuals-for-shopify-brands', '/reframe-visuals-for-amazon-sellers', '/usa-uk-collaboration-assurance',
    '/pixelz-alternative', '/clipping-path-india-alternative', '/cutoutwiz-alternative',
    '/amazon-product-image-editing', '/shopify-product-photo-editing', '/woocommerce-product-image-editing', '/fashion-photo-retouching-service', '/jewelry-photo-retouching-service', '/furniture-photo-editing-service',
    '/us-photo-editing-service', '/uk-photo-editing-service', '/canada-photo-editing-service', '/australia-photo-editing-service', '/uae-photo-editing-service', '/singapore-photo-editing-service',
    '/blog',
  ]);
  const NOINDEX_ROUTES = ['/admin', '/login', '/signup', '/dashboard', '/portal'];

  // Handle SPA routing - must be AFTER all API routes
  app.get('*', async (req, res, next) => {
    if (req.path.startsWith('/api')) return next();

    // Normalize trailing slashes so /about/ resolves like /about.
    const pathname = (req.path || '/').replace(/\/+$/, '') || '/';
    const isPublic = PUBLIC_EXACT_ROUTES.has(pathname) || PUBLIC_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix));
    const isNoindex = NOINDEX_ROUTES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

    try {
      const shellHtml = await fs.promises.readFile(indexPath, 'utf8');

      // Prevent stale document HTML from referencing removed hashed bundles after deploys.
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');

      if (!isPublic && !isNoindex) {
        // Routes not in the allowlist but with a build-time prerendered file
        // (e.g. /how-it-works, /platform) are real public pages crawled from
        // site links — serve them as-is, exactly like nginx try_files does.
        const prerendered = await readPrerenderedHtml(pathname);
        if (prerendered) {
          return res.type('html').send(prerendered);
        }

        res.status(404);
        res.setHeader('X-Robots-Tag', 'noindex, nofollow');
        const rendered404 = injectSeoMeta(shellHtml, {
          title: '404 Not Found | Reframe Visuals',
          description: 'The page you requested could not be found.',
          canonical: 'https://reframevisuals.com/404',
          h1: 'Page Not Found',
          ogType: 'website',
        });
        return res.type('html').send(rendered404);
      }

      if (isNoindex) {
        res.setHeader('X-Robots-Tag', 'noindex, nofollow');
      }

      // Case-study detail pages share templated placeholder copy — keep them
      // out of the index (but crawlable) until each has real client content.
      // The hub (/case-studies) stays indexable. Mirrors the Helmet
      // noindex meta baked into the prerendered files nginx serves directly.
      if (pathname.startsWith('/case-studies/')) {
        res.setHeader('X-Robots-Tag', 'noindex, follow');
      }

      // Public routes: prerendered static file → per-request SSR → CSR shell.
      // Noindex routes (admin/dashboard/auth) keep the plain shell — they are
      // user-specific and not worth server rendering.
      const html = isPublic ? await resolveBaseHtml(pathname, shellHtml) : shellHtml;

      const canonical = `https://reframevisuals.com${pathname === '/' ? '/' : pathname}`;
      let seo = resolvePageSeo(pathname);
      let blogOgImage: string | undefined;
      // Blog posts get their real title/description from the CMS so crawlers
      // see the admin-authored meta in the server-rendered HTML, not a generic
      // fallback that only client-side JS would replace.
      const blogSlugMatch = /^\/blog\/([^/]+)\/?$/.exec(pathname);
      if (blogSlugMatch) {
        try {
          const { prisma } = await import('./database');
          const post = await prisma.post.findFirst({
            where: { slug: blogSlugMatch[1], status: 'published' },
            select: { title: true, excerpt: true, metaTitle: true, metaDescription: true, coverImage: true },
          });
          if (post) {
            seo = {
              title: post.metaTitle || `${post.title} | Reframe Visuals`,
              description: post.metaDescription || post.excerpt || seo.description,
            };
            blogOgImage = post.coverImage || undefined;
          }
        } catch { /* DB unavailable — keep the generic fallback */ }
      }
      let structuredData: Array<Record<string, unknown>> = [];
      const breadcrumbSchema = makeBreadcrumbSchema(pathname);
      if (breadcrumbSchema) {
        structuredData.push(breadcrumbSchema);
      }

      if (pathname === '/') {
        structuredData.push(
          {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: 'What is Reframe Visuals?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Reframe Visuals is an ecommerce photo editing studio for online brands, Amazon sellers, agencies, product photographers, apparel brands, jewelry brands, and marketplace teams.',
                },
              },
              {
                '@type': 'Question',
                name: 'What services does Reframe Visuals provide?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Reframe Visuals provides manual Pen Tool clipping path, background removal, ghost mannequin editing, jewelry retouching, garment retouching, model retouching, color correction, shadow creation, pattern change, image manipulation, AI product photography, and AI-assisted image refinement.',
                },
              },
              {
                '@type': 'Question',
                name: 'How much does Reframe Visuals cost?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Clipping path and background removal start at $0.39 per image. Pricing varies by service complexity and selected turnaround.',
                },
              },
              {
                '@type': 'Question',
                name: 'Do you offer 12-hour turnaround?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Yes. Reframe Visuals offers 12-hour express, 24-hour standard, 48-hour relaxed, and 72-hour economy turnaround options.',
                },
              },
              {
                '@type': 'Question',
                name: 'Can I try Reframe Visuals before paying?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Yes. You can send 3 images for free sample edits and review the quality before placing a paid order.',
                },
              },
              {
                '@type': 'Question',
                name: 'Does Reframe Visuals use AI?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Reframe Visuals uses AI-assisted workflows to speed up production while human Photoshop editors review images by hand for quality control.',
                },
              },
              {
                '@type': 'Question',
                name: 'Is Reframe Visuals a video reframing tool?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'No. Reframe Visuals is an ecommerce photo editing service business, not an AI video reframing software tool.',
                },
              },
              {
                '@type': 'Question',
                name: 'Is customer support available 24/7?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Yes. Reframe Visuals provides 24/7 client support via email, with options for dedicated account managers and custom quality control SLAs for volume projects.',
                },
              },
            ],
          },
          {
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: 'Reframe Visuals',
            alternateName: ['Reframe', 'ReframeVisuals', 'Reframe Visuals', 'reframe visuals', 'reframevisuals.com'],
            url: 'https://reframevisuals.com',
            logo: { '@type': 'ImageObject', url: 'https://reframevisuals.com/logo.svg', width: 300, height: 100 },
            email: 'hello@reframevisuals.com',
            description: 'Reframe Visuals is an ecommerce photo editing and creative operations studio providing manual Pen Tool clipping path, background removal, ghost mannequin editing, retouching, color correction, AI product photography, and AI-assisted image refinement for online brands and marketplace sellers.',
            disambiguatingDescription: 'Reframe Visuals is the ecommerce photo editing and creative operations brand at reframevisuals.com, not Reframe Media Studios or a generic video reframing tool.',
            areaServed: 'Worldwide',
            sameAs: [
              'https://www.linkedin.com/company/reframe-visuals/',
              'https://www.instagram.com/reframevisualsstudio/',
              'https://www.pinterest.com/reframevisuals/',
              'https://www.behance.net/reframevisuals',
              'https://x.com/ReframeVisual',
              'https://www.trustpilot.com/review/reframevisuals.com',
              'https://www.tiktok.com/@reframe_visuals',
            ],
            contactPoint: {
              '@type': 'ContactPoint',
              contactType: 'customer support',
              email: 'hello@reframevisuals.com',
              availableLanguage: 'English',
              areaServed: 'Worldwide',
            },
            knowsAbout: [
              'Ecommerce photo editing',
              'Manual Pen Tool clipping path',
              'Background removal',
              'Ghost mannequin editing',
              'Jewelry retouching',
              'Garment retouching',
              'Model retouching',
              'Color correction',
              'Shadow creation',
              'Pattern change',
              'AI product photography',
              'AI-assisted image refinement',
              'AI-ready image editing workflow',
            ],
          },
          {
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'Reframe Visuals',
            url: 'https://reframevisuals.com',
            description: 'Professional ecommerce photo editing from $0.39/image, including clipping path, background removal, ghost mannequin, retouching, color correction, AI-assisted workflows, and AI-ready workflow support.',
            potentialAction: {
              '@type': 'SearchAction',
              target: 'https://reframevisuals.com/blog?q={search_term_string}',
              'query-input': 'required name=search_term_string',
            },
          },
          {
            '@context': 'https://schema.org',
            '@type': 'Service',
            name: 'Ecommerce Photo Editing',
            serviceType: 'Ecommerce photo editing and post-production',
            description: 'Manual and AI-assisted ecommerce image editing services with human Photoshop editor review, free sample edits, and flexible 12h, 24h, 48h, or 72h turnaround options.',
            provider: {
              '@type': 'Organization',
              name: 'Reframe Visuals',
              url: 'https://reframevisuals.com',
            },
            areaServed: 'Worldwide',
            termsOfService: 'https://reframevisuals.com/pricing',
            offers: {
              '@type': 'AggregateOffer',
              priceCurrency: 'USD',
              lowPrice: '0.39',
              offerCount: '9',
              availability: 'https://schema.org/InStock',
            },
            hasOfferCatalog: {
              '@type': 'OfferCatalog',
              name: 'Photo Editing Services',
              itemListElement: [
                {
                  '@type': 'Offer',
                  itemOffered: { '@type': 'Service', name: 'Background Removal' },
                  price: '0.39',
                  priceCurrency: 'USD',
                  priceSpecification: { '@type': 'UnitPriceSpecification', price: '0.39', priceCurrency: 'USD', unitText: 'per image' },
                },
                {
                  '@type': 'Offer',
                  itemOffered: { '@type': 'Service', name: 'Clipping Path' },
                  price: '0.39',
                  priceCurrency: 'USD',
                  priceSpecification: { '@type': 'UnitPriceSpecification', price: '0.39', priceCurrency: 'USD', unitText: 'per image' },
                },
                {
                  '@type': 'Offer',
                  itemOffered: { '@type': 'Service', name: 'Ghost Mannequin Editing' },
                  priceCurrency: 'USD',
                  priceSpecification: { '@type': 'UnitPriceSpecification', priceCurrency: 'USD', unitText: 'per image' },
                },
                {
                  '@type': 'Offer',
                  itemOffered: { '@type': 'Service', name: 'Photo Retouching' },
                  priceCurrency: 'USD',
                  priceSpecification: { '@type': 'UnitPriceSpecification', priceCurrency: 'USD', unitText: 'per image' },
                },
              ],
            },
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: '5',
              bestRating: '5',
              worstRating: '1',
              reviewCount: '14',
            },
          },
          {
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            name: 'Client Reviews — Reframe Visuals',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                item: {
                  '@type': 'Review',
                  reviewBody: 'Probably the best seller I have worked with on this platform. Awesome pricing & highest possible result. Everything done to the smallest details. They really know how to use PS. Will definitely work with them in the long run.',
                  reviewRating: { '@type': 'Rating', ratingValue: '5', bestRating: '5' },
                  author: { '@type': 'Person', name: 'Nikola Filić', jobTitle: 'Founder & Creative Director', worksFor: { '@type': 'Organization', name: 'Bomber Clothing', url: 'https://bomberclothing.com' } },
                  itemReviewed: { '@type': 'Service', name: 'Ecommerce Photo Editing', provider: { '@type': 'Organization', name: 'Reframe Visuals', url: 'https://reframevisuals.com' } },
                },
              },
              {
                '@type': 'ListItem',
                position: 2,
                item: {
                  '@type': 'Review',
                  reviewBody: 'Great communication, very efficient and excellent job every time. Handled everything exceptionally and went above and beyond.',
                  reviewRating: { '@type': 'Rating', ratingValue: '5', bestRating: '5' },
                  author: { '@type': 'Person', name: 'Suril', jobTitle: 'Founder', worksFor: { '@type': 'Organization', name: 'Acia Studio' } },
                  itemReviewed: { '@type': 'Service', name: 'Ecommerce Photo Editing', provider: { '@type': 'Organization', name: 'Reframe Visuals', url: 'https://reframevisuals.com' } },
                },
              },
              {
                '@type': 'ListItem',
                position: 3,
                item: {
                  '@type': 'Review',
                  reviewBody: 'Amazing job, as always. Third time repeat customer. Very responsive and always overdelivers!',
                  reviewRating: { '@type': 'Rating', ratingValue: '5', bestRating: '5' },
                  author: { '@type': 'Person', name: 'Jamie', jobTitle: 'Founder', worksFor: { '@type': 'Organization', name: 'The Pup Pack' } },
                  itemReviewed: { '@type': 'Service', name: 'Ecommerce Photo Editing', provider: { '@type': 'Organization', name: 'Reframe Visuals', url: 'https://reframevisuals.com' } },
                },
              },
              {
                '@type': 'ListItem',
                position: 4,
                item: {
                  '@type': 'Review',
                  reviewBody: 'Prompt and quality work. I look forward to working with Reframe many times in the future.',
                  reviewRating: { '@type': 'Rating', ratingValue: '5', bestRating: '5' },
                  author: { '@type': 'Person', name: 'Todd Carli', jobTitle: 'Owner', worksFor: { '@type': 'Organization', name: 'Todd Carli Custom Carpentry' } },
                  itemReviewed: { '@type': 'Service', name: 'Ecommerce Photo Editing', provider: { '@type': 'Organization', name: 'Reframe Visuals', url: 'https://reframevisuals.com' } },
                },
              },
              {
                '@type': 'ListItem',
                position: 5,
                item: {
                  '@type': 'Review',
                  reviewBody: 'The best in the game when it comes to getting work done. Humble, understanding, and consistently on point.',
                  reviewRating: { '@type': 'Rating', ratingValue: '5', bestRating: '5' },
                  author: { '@type': 'Person', name: 'Nigel', jobTitle: 'Fashion Seller' },
                  itemReviewed: { '@type': 'Service', name: 'Ecommerce Photo Editing', provider: { '@type': 'Organization', name: 'Reframe Visuals', url: 'https://reframevisuals.com' } },
                },
              },
            ],
          }
        );
      } else if (pathname === '/services') {
        structuredData.push(
          {
            '@context': 'https://schema.org',
            '@type': 'Organization',
            '@id': 'https://reframevisuals.com/#organization',
            name: 'Reframe Visuals',
            url: 'https://reframevisuals.com',
            logo: { '@type': 'ImageObject', url: 'https://reframevisuals.com/logo.svg', width: 300, height: 100 },
          },
          {
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            name: 'Photo Editing Services',
            description: 'Professional image editing services for e-commerce product photography',
            itemListElement: SEO_SERVICES.map((s, idx) => ({
              '@type': 'ListItem',
              position: idx + 1,
              item: {
                '@type': 'Service',
                name: s.name,
                description: s.description,
                image: s.beforeImage || DEFAULT_OG_IMAGE,
                brand: {
                  '@type': 'Brand',
                  name: 'Reframe Visuals'
                },
                offers: {
                  '@type': 'Offer',
                  price: s.price.toString(),
                  priceCurrency: 'USD',
                  availability: 'https://schema.org/InStock'
                }
              }
            }))
          }
        );
      } else if (pathname.startsWith('/services/')) {
        const slug = pathname.replace('/services/', '').split('/').filter(Boolean)[0] || '';
        const service = SEO_SERVICES.find(item => item.id === slug);
        if (service) {
          structuredData.push(
            {
              '@context': 'https://schema.org',
              '@type': 'Service',
              name: service.name,
              description: service.description,
              provider: {
                '@type': 'Organization',
                '@id': 'https://reframevisuals.com/#organization',
                name: 'Reframe Visuals',
                url: 'https://reframevisuals.com',
                logo: { '@type': 'ImageObject', url: 'https://reframevisuals.com/logo.svg', width: 300, height: 100 },
              },
              offers: {
                '@type': 'Offer',
                price: service.price.toString(),
                priceCurrency: 'USD',
                availability: 'https://schema.org/InStock'
              }
            }
          );

          if (service.faqs && service.faqs.length > 0) {
            structuredData.push({
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: service.faqs.map(faq => ({
                '@type': 'Question',
                name: faq.q,
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: faq.a
                }
              }))
            });
          }
        }
      } else if (pathname === '/portfolio') {
        structuredData.push(
          {
            '@context': 'https://schema.org',
            '@type': 'ImageGallery',
            name: 'Photo Editing Before & After Portfolio',
            description: 'Before and after examples of ecommerce photo editing including clipping path, background removal, ghost mannequin, retouching, and jewelry editing.',
            url: 'https://reframevisuals.com/portfolio',
            publisher: {
              '@type': 'Organization',
              '@id': 'https://reframevisuals.com/#organization',
              name: 'Reframe Visuals',
              url: 'https://reframevisuals.com',
              logo: { '@type': 'ImageObject', url: 'https://reframevisuals.com/logo.svg', width: 300, height: 100 },
            }
          }
        );
      }

      const baseHtml = (pathname === '/' || pathname === '/services' || pathname.startsWith('/services/') || pathname === '/portfolio' || pathname === '/order/dedicated')
        ? stripAllJsonLdScripts(html)
        : html;
      const rendered = injectSeoMeta(baseHtml, {
        title: normalizeSeoTitle(seo.title),
        description: normalizeSeoDescription(
          seo.description,
          'Professional image editing services for e-commerce teams needing speed, consistency, and conversion-focused product visuals.'
        ),
        canonical,
        h1: pathname === '/' ? 'Reframe Visuals — Professional Photo Editing Services for E-commerce' : titleToH1(seo.title),
        ogType: pathname.startsWith('/blog/') ? 'article' : 'website',
        ogImage: blogOgImage,
        structuredData: structuredData.length ? structuredData : undefined,
        seoContent: generateSeoContent(pathname),
      });
      return res.type('html').send(rendered);
    } catch (err) {
      return next(err);
    }
  });
} else if (!isProd) {
  // Dev fallback when no frontend build is present
  app.get('/', (_req, res) => {
    res.json({ message: 'Reframe API - Development Mode', status: 'ok', docs: '/api/health' });
  });
}

// Scheduled jobs for serverless hosts (no long-lived process / setInterval).
// Hit every minute by Supabase pg_cron (or any scheduler) with the CRON_SECRET bearer token.
app.get('/api/cron/tick', async (req, res) => {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.authorization !== `Bearer ${secret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const jobs: Array<[string, () => Promise<unknown>]> = [
    ['slack-meetings', checkAndTriggerScheduledMeetings],
    ['gcal-meetings', checkGoogleCalendarMeetings],
    ['cms-publish', publishScheduledPosts],
    ['outreach-send', processDueEnrollments],
    ['outreach-replies', checkReplies],
  ];
  const results = await Promise.allSettled(jobs.map(([, fn]) => fn()));
  return res.json({
    ok: true,
    results: jobs.map(([name], i) => ({ name, status: results[i].status })),
  });
});

// Error handling
app.use(notFound);
app.use(errorHandler);

// Start server
if (!process.env.VERCEL) app.listen(Number(PORT), '0.0.0.0', () => {
  // Start background scheduled meetings checker (every 60 seconds)
  setInterval(() => {
    checkAndTriggerScheduledMeetings().catch((err) => console.error('[SlackScheduler] Error:', err));
    checkGoogleCalendarMeetings().catch((err) => console.error('[GCalScheduler] Error:', err));
    publishScheduledPosts().catch((err) => console.error('[CMS] Scheduled publish error:', err?.message || err));
  }, 60000);

  // Outreach sequence engine: send due steps + stop-on-reply (every 3 minutes)
  setInterval(() => {
    processDueEnrollments().catch((err) => console.error('[Outreach] Send tick error:', err?.message || err));
    checkReplies().catch((err) => console.error('[Outreach] Reply check error:', err?.message || err));
  }, 180000);

  console.log(`
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║   🚀 Reframe Production Dashboard Server                       ║
║                                                                ║
║   Server running on: http://localhost:${PORT}                   ║
║   Environment: ${process.env.NODE_ENV || 'development'}                                 ║
║   Cache TTL: ${CACHE_TTL / 1000}s                                       ║
║                                                                ║
║   ─── NEW PRODUCTION API ENDPOINTS ───                         ║
║                                                                ║
║   Metrics & Analytics:                                         ║
║   - GET    /api/metrics/hero          (Dashboard KPIs)         ║
║                                                                ║
║   Alerts:                                                      ║
║   - GET    /api/alerts                (Active alerts)          ║
║   - PATCH  /api/alerts/:id/dismiss   (Dismiss alert)           ║
║   - POST   /api/alerts               (Create alert)            ║
║                                                                ║
║   Production Orders:                                           ║
║   - GET    /api/kanban                (Kanban board)           ║
║   - GET    /api/orders/:id            (Order details)          ║
║   - PATCH  /api/orders/:id            (Update order)           ║
║                                                                ║
║   Editors:                                                     ║
║   - GET    /api/editors               (Editors list)           ║
║   - GET    /api/editors/:id/performance (Performance metrics)  ║
║                                                                ║
║   Quotations:                                                  ║
║   - GET    /api/quotations            (Quote list)             ║
║   - POST   /api/quotations            (Create quote)           ║
║   - POST   /api/quotations/:id/convert-to-order                ║
║                                                                ║
║   Pricing:                                                     ║
║   - GET    /api/pricing/customer-tiers  (Customer rates)       ║
║   - GET    /api/pricing/editor-tiers    (Editor payouts)       ║
║   - GET    /api/pricing/margin-guard    (Margin health)        ║
║   - PATCH  /api/pricing/customer-tiers/:id                     ║
║                                                                ║
║   Finance:                                                     ║
║   - GET    /api/finance/dashboard      (P&L overview)          ║
║   - GET    /api/finance/invoices       (Invoices list)         ║
║                                                                ║
║   Payouts:                                                     ║
║   - GET    /api/payouts/batches        (Batch list)            ║
║   - GET    /api/payouts/batches/:id    (Batch details)         ║
║   - PATCH  /api/payouts/batches/:id/approve                    ║
║   - POST   /api/payouts/batches        (Create batch)          ║
║                                                                ║
║   ─── LEGACY CMS ROUTES ───                                    ║
║   - /api/auth, /api/sections, /api/theme, /api/files           ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
  `);
});

export default app;
