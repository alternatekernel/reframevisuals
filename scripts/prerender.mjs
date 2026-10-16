import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Root workspace dir is parent of scripts
const ROOT_DIR = path.resolve(__dirname, '..');
const DIST_DIR = path.join(ROOT_DIR, 'frontend', 'dist');

// Strict mode: fail the build instead of silently skipping prerendering.
// Set PRERENDER_STRICT=1 in CI/Docker so a broken prerender can never ship
// an empty CSR shell to production unnoticed.
const STRICT = process.env.PRERENDER_STRICT === '1';

/**
 * Resolve the `playwright` package. The frontend workspace declares it as a
 * devDependency, but this script lives in <root>/scripts, so a plain
 * import('playwright') only looks in <root>/node_modules — which does not
 * exist in the Docker frontend-builder stage. Try frontend first, then root.
 */
function loadPlaywright() {
  const candidates = [
    path.join(ROOT_DIR, 'frontend', 'package.json'),
    path.join(ROOT_DIR, 'package.json'),
  ];
  for (const base of candidates) {
    try {
      const req = createRequire(base);
      return req('playwright');
    } catch {
      // try next location
    }
  }
  throw new Error("Cannot find package 'playwright' in frontend/ or root node_modules");
}

/**
 * Resolve a Chromium executable. Priority:
 * 1. PRERENDER_CHROMIUM_PATH env var (explicit override, e.g. Docker/CI)
 * 2. undefined — let Playwright use its own managed browser install
 * A later fallback scans common system Chromium locations if the managed
 * browser is missing (see runPrerender).
 */
const SYSTEM_CHROMIUM_PATHS = [
  '/usr/bin/chromium-browser', // Alpine `apk add chromium`
  '/usr/bin/chromium',         // Debian/Ubuntu
  '/usr/bin/google-chrome',    // Chrome
];

function resolveSystemChromium() {
  const envPath = process.env.PRERENDER_CHROMIUM_PATH;
  if (envPath && fs.existsSync(envPath)) return envPath;
  return SYSTEM_CHROMIUM_PATHS.find((p) => fs.existsSync(p));
}

console.log('Dist Dir:', DIST_DIR);

const PORT = 4567;

// 1. Start static server
const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, `http://localhost:${PORT}`);
  let pathname = parsedUrl.pathname;
  
  // Clean path
  let filePath = path.join(DIST_DIR, pathname);
  
  if (!filePath.startsWith(DIST_DIR)) {
    res.statusCode = 403;
    res.end('Forbidden');
    return;
  }

  // Check if file exists, if directory serve index.html, else fallback to root index.html
  fs.stat(filePath, (err, stats) => {
    if (!err && stats.isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }

    fs.access(filePath, fs.constants.F_OK, (accessErr) => {
      if (accessErr) {
        // Fallback to root index.html (SPA fallback)
        filePath = path.join(DIST_DIR, 'index.html');
      }

      const ext = path.extname(filePath);
      let contentType = 'text/html';
      if (ext === '.js') contentType = 'application/javascript';
      else if (ext === '.css') contentType = 'text/css';
      else if (ext === '.png') contentType = 'image/png';
      else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
      else if (ext === '.svg') contentType = 'image/svg+xml';
      else if (ext === '.json') contentType = 'application/json';

      res.writeHead(200, { 'Content-Type': contentType });
      const stream = fs.createReadStream(filePath);
      stream.on('error', () => {
        res.statusCode = 500;
        res.end('Error');
      });
      stream.pipe(res);
    });
  });
});

server.listen(PORT, async () => {
  console.log(`Prerender local server running at http://localhost:${PORT}`);
  
  try {
    await runPrerender();
  } catch (err) {
    const isMissingBrowser = err.message && (
      err.message.includes("Executable doesn't exist") || 
      err.message.includes("Cannot find package 'playwright'") ||
      err.message.includes("playwright install") ||
      err.message.includes("looks like Playwright Test or Playwright was just installed")
    );
    
    if (isMissingBrowser) {
      if (STRICT) {
        console.error('\n❌ [Prerender] PRERENDER_STRICT=1 and no Chromium is available. Failing the build so an unprerendered (empty-shell) bundle cannot ship.');
        console.error('Install a browser (npx playwright install chromium) or set PRERENDER_CHROMIUM_PATH to a system Chromium binary.\n');
        server.close();
        process.exit(1);
      }
      console.warn('\n⚠️  [Prerender Warning] Playwright browser binaries are not installed. Skipping prerendering stage.');
      console.warn('To enable local prerendering, run: npx playwright install chromium');
      console.warn('Or point PRERENDER_CHROMIUM_PATH at a system Chromium binary.\n');
      server.close();
      process.exit(0);
    }

    console.error('Prerender failed:', err);
    server.close();
    process.exit(1);
  } finally {
    server.close();
    process.exit(0);
  }
});

async function runPrerender() {
  const { chromium } = loadPlaywright();

  // Max pages to prerender (seed list + discovered links combined).
  // Prevents OOM kills in memory-constrained Docker build stages.
  const MAX_PAGES = parseInt(process.env.PRERENDER_MAX_PAGES || '80', 10);

  // Extra flags are required when running as root inside Docker build stages
  // (no user namespaces for the sandbox, tiny /dev/shm).
  const hardenedArgs = [
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--disable-extensions',
    '--disable-background-networking',
    '--disable-sync',
    '--disable-translate',
    '--metrics-recording-only',
    '--no-first-run',
    '--safebrowsing-disable-auto-update',
  ];

  let browser;
  const explicitPath = process.env.PRERENDER_CHROMIUM_PATH;
  if (explicitPath && !fs.existsSync(explicitPath)) {
    console.warn(`[Prerender] PRERENDER_CHROMIUM_PATH=${explicitPath} does not exist; scanning known system locations instead.`);
  }
  if (explicitPath && fs.existsSync(explicitPath)) {
    // Explicit override always wins (Docker/CI with a system Chromium).
    browser = await chromium.launch({
      headless: true,
      executablePath: explicitPath,
      args: hardenedArgs,
    });
  } else {
    try {
      // Default: Playwright's own managed browser install.
      browser = await chromium.launch({ headless: true });
    } catch (launchErr) {
      // Managed browser missing — fall back to a system Chromium if present.
      const systemChromium = resolveSystemChromium();
      if (!systemChromium) throw launchErr;
      console.warn(`[Prerender] Playwright-managed Chromium unavailable; falling back to system browser at ${systemChromium}`);
      browser = await chromium.launch({
        headless: true,
        executablePath: systemChromium,
        args: hardenedArgs,
      });
    }
  }
  // Set User-Agent to match our BOT_UA_PATTERN so the app instantly renders content and avoids loaders
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html; reframe-crawler)'
  });
  
  // Preserve the clean CSR shell (empty #root) before route captures
  // overwrite dist/index.html. The Express server uses this copy as the
  // template for runtime SSR of routes that have no prerendered file.
  const rootIndexPath = path.join(DIST_DIR, 'index.html');
  const csrShellPath = path.join(DIST_DIR, 'index.csr.html');
  try {
    const rootIndexHtml = fs.readFileSync(rootIndexPath, 'utf8');
    if (/<div id="root">\s*<\/div>/.test(rootIndexHtml)) {
      fs.writeFileSync(csrShellPath, rootIndexHtml, 'utf8');
      console.log(`Saved clean CSR shell to ${csrShellPath}`);
    } else {
      console.warn('dist/index.html already contains prerendered markup; keeping existing index.csr.html if present.');
    }
  } catch (copyErr) {
    console.warn('Could not save clean CSR shell:', copyErr.message);
  }

  const visited = new Set();
  let successCount = 0;
  const queue = [
    '/',
    '/services',
    '/pricing',
    '/portfolio',
    '/about',
    '/blog',
    '/contact',
    '/free-trial',
    '/book-meeting',
    '/ai-product-visuals',
    '/case-studies',
    '/turnaround-sla',
    '/quality-assurance-process',
    '/who-is-reframe-visuals',
    '/reframe-visuals-brand-facts',
    '/free-sample-edit',
    '/reframe-visuals-pricing',
    '/reframe-visuals-reviews',
    '/reframe-visuals-for-shopify-brands',
    '/reframe-visuals-for-amazon-sellers',
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
    // Service detail pages (explicit seeds — not relying on link discovery)
    '/services/background-removal',
    '/services/clipping-path',
    '/services/multi-clipping-path',
    '/services/color-correction',
    '/services/color-change',
    '/services/ghost-mannequin',
    '/services/shadow-creation',
    '/services/retouching',
    '/services/jewelry-retouch',
    '/services/garment-retouch',
    '/services/model-retouch',
    '/services/raster-to-vector',
    '/services/manipulation',
    '/services/pattern-change',
    '/services/ai-product-photography',
    // High-value service intent pages
    '/services/background-removal/best-for-ecommerce',
    '/services/background-removal/pricing-guide',
    '/services/clipping-path/best-for-ecommerce',
    '/services/clipping-path/pricing-guide',
    '/services/ghost-mannequin/best-for-ecommerce',
    '/services/ghost-mannequin/pricing-guide',
    '/services/jewelry-retouch/best-for-ecommerce',
    '/services/retouching/best-for-ecommerce',
    // Brand & services overview pages
    '/about-reframe-visuals',
    '/reframe-visuals-services',
    // Resource hub index
    '/resources',
    // Competitor comparison / alternative pages
    '/pixelz-alternative',
    '/clipping-path-india-alternative',
    '/cutoutwiz-alternative'
  ];

  while (queue.length > 0) {
    const rawRoute = queue.shift();
    // Normalize route: strip query strings and hashes, remove trailing slash
    const cleanRoute = rawRoute.split('?')[0].split('#')[0];
    const normalizedRoute = cleanRoute === '/' ? '/' : cleanRoute.replace(/\/$/, '');
    
    if (visited.has(normalizedRoute)) continue;
    if (visited.size >= MAX_PAGES) {
      console.log(`  [Prerender] MAX_PAGES (${MAX_PAGES}) reached — skipping remaining ${queue.length} queued routes`);
      break;
    }
    visited.add(normalizedRoute);
    
    console.log(`Prerendering route: ${normalizedRoute}`);
    
    // Create a fresh page context for each route to avoid memory buildup or state leaks
    const page = await context.newPage();
    
    try {
      // The 'load' event can hang past the timeout on asset-heavy pages
      // (external fonts/CDN images) even though React has fully rendered.
      // Tolerate that: keep the page and capture the hydrated DOM anyway.
      let loadTimedOut = false;
      try {
        await page.goto(`http://localhost:${PORT}${normalizedRoute}`, {
          waitUntil: 'load',
          timeout: 10000
        });
      } catch (gotoErr) {
        if (!/timeout/i.test(String(gotoErr.message))) throw gotoErr;
        loadTimedOut = true;
        console.warn(`  'load' event timed out for ${normalizedRoute}; capturing hydrated DOM anyway`);
      }

      // Wait for React to mount elements inside #root
      await page.waitForSelector('#root > *', { state: 'attached', timeout: 5000 }).catch(() => {});

      // Allow minor dynamic layouts/fonts to settle (longer when 'load' never
      // fired, so lazy-loaded sections have time to hydrate)
      await page.waitForTimeout(loadTimedOut ? 800 : 150);

      // Extract new links to crawl
      const links = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('a'))
          .map(a => a.getAttribute('href'))
          .filter(href => {
            if (!href) return false;
            // Only absolute local paths
            if (!href.startsWith('/')) return false;
            // Ignore hash links
            if (href.startsWith('/#')) return false;
            // Ignore system/admin/dashboard routes
            const ignoredPrefixes = [
              '/admin',
              '/dashboard',
              '/login',
              '/signup',
              '/reset-password',
              '/forgot-password',
              '/account',
              '/jobs'
            ];
            if (ignoredPrefixes.some(p => href.startsWith(p))) return false;
            // Ignore asset file extensions
            if (/\.(png|jpg|jpeg|gif|svg|pdf|zip|css|js)$/i.test(href)) return false;
            return true;
          });
      });
      
      for (const link of links) {
        // Strip queries/hashes for queueing
        const cleanLink = link.split('?')[0].split('#')[0];
        const normalizedLink = cleanLink === '/' ? '/' : cleanLink.replace(/\/$/, '');
        if (!visited.has(normalizedLink) && !queue.includes(normalizedLink)) {
          console.log(`  Discovered new link: ${normalizedLink}`);
          queue.push(normalizedLink);
        }
      }

      // Get fully rendered HTML content
      const htmlContent = await page.content();
      
      // Determine file write path
      let outFilePath;
      if (normalizedRoute === '/') {
        outFilePath = path.join(DIST_DIR, 'index.html');
      } else {
        const routeSubdir = path.join(DIST_DIR, normalizedRoute);
        // Ensure subdirectory exists
        if (!fs.existsSync(routeSubdir)) {
          fs.mkdirSync(routeSubdir, { recursive: true });
        }
        outFilePath = path.join(routeSubdir, 'index.html');
      }
      
      // Write rendered HTML
      fs.writeFileSync(outFilePath, htmlContent, 'utf8');
      successCount++;
      console.log(`  Saved to ${outFilePath}`);

    } catch (routeErr) {
      console.error(`  Error prerendering ${normalizedRoute}:`, routeErr.message);
    } finally {
      await page.close();
    }
  }

  console.log(`Prerendering completed. Crawled ${visited.size} pages, wrote ${successCount} HTML files.`);
  await browser.close();

  if (STRICT && successCount === 0) {
    throw new Error('PRERENDER_STRICT=1: prerender wrote zero pages — failing the build.');
  }
}
