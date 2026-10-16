import path from 'path';
import fs from 'fs';

/**
 * Server-side rendering bridge.
 *
 * Loads the self-contained Vite SSR bundle (frontend/dist-ssr/entry-server.js,
 * ESM) and renders routes to HTML per request. Used by the SPA fallback in
 * index.ts as the dynamic middle layer between build-time prerendered files
 * (fast static cache) and the plain client-side-rendered shell (last resort).
 *
 * All head tags (title/meta/canonical/JSON-LD) remain owned by injectSeoMeta
 * in index.ts — the SSR bundle strips head-level tags from its markup so
 * there is a single source of truth and no duplicate tags.
 */

interface SsrRenderResult {
  appHtml: string;
  title: string | null;
  status: number;
  redirect?: string;
}

type SsrModule = {
  render: (url: string, opts?: { timeoutMs?: number }) => Promise<SsrRenderResult>;
};

// TypeScript compiles `import()` to `require()` under module=commonjs; the
// SSR bundle is ESM, so keep a real dynamic import via the Function trick.
// eslint-disable-next-line @typescript-eslint/no-implied-eval
const dynamicImport = new Function('specifier', 'return import(specifier)') as (
  specifier: string
) => Promise<SsrModule>;

const SSR_BUNDLE_CANDIDATES = [
  // compiled: backend/dist/services/ssrRenderer.js -> <root>/frontend/dist-ssr
  path.join(__dirname, '../../../frontend/dist-ssr/entry-server.js'),
  // safety net if this file is ever moved next to index.ts's compiled output
  path.join(__dirname, '../../frontend/dist-ssr/entry-server.js'),
];

let ssrModulePromise: Promise<SsrModule | null> | null = null;

const loadSsrModule = (): Promise<SsrModule | null> => {
  if (!ssrModulePromise) {
    ssrModulePromise = (async () => {
      const bundlePath = SSR_BUNDLE_CANDIDATES.find((candidate) => {
        try {
          return fs.existsSync(candidate);
        } catch {
          return false;
        }
      });

      if (!bundlePath) {
        console.warn('[SSR] entry-server bundle not found; falling back to static HTML only.');
        return null;
      }

      try {
        const mod = await dynamicImport(new URL(`file://${bundlePath}`).href);
        if (typeof mod.render !== 'function') {
          console.error('[SSR] bundle loaded but has no render() export.');
          return null;
        }
        console.log(`[SSR] Renderer loaded from: ${bundlePath}`);
        return mod;
      } catch (err) {
        console.error('[SSR] Failed to load SSR bundle:', err);
        return null;
      }
    })();
  }
  return ssrModulePromise;
};

// Small in-memory cache: rendering is CPU-bound, and public pages rarely
// change within a minute. Keyed by pathname.
const SSR_CACHE_TTL = 60_000;
const SSR_CACHE_MAX = 200;
const ssrCache = new Map<string, { html: string; timestamp: number }>();

const injectAppHtml = (template: string, appHtml: string): string | null => {
  const rootRegex = /<div id="root">\s*<\/div>/;
  if (!rootRegex.test(template)) return null;
  // data-ssr="true" tells entry-client (main.tsx) to hydrate this markup
  // instead of re-rendering from scratch.
  return template.replace(rootRegex, `<div id="root" data-ssr="true">${appHtml}</div>`);
};

/**
 * Render `pathname` with the SSR bundle and inject the markup into the SPA
 * template. Returns null when SSR is unavailable, redirected, or produced no
 * markup — callers fall back to the static template. Never throws.
 */
export const renderRouteHtml = async (pathname: string, template: string): Promise<string | null> => {
  try {
    const cached = ssrCache.get(pathname);
    if (cached && Date.now() - cached.timestamp < SSR_CACHE_TTL) {
      return cached.html;
    }

    const mod = await loadSsrModule();
    if (!mod) return null;

    const result = await mod.render(pathname);
    if (!result || result.redirect || !result.appHtml || !result.appHtml.trim()) {
      return null;
    }

    const html = injectAppHtml(template, result.appHtml);
    if (!html) {
      console.warn('[SSR] Could not locate <div id="root"></div> in template; skipping SSR injection.');
      return null;
    }

    if (ssrCache.size >= SSR_CACHE_MAX) {
      const oldestKey = ssrCache.keys().next().value;
      if (oldestKey) ssrCache.delete(oldestKey);
    }
    ssrCache.set(pathname, { html, timestamp: Date.now() });

    return html;
  } catch (err) {
    console.error(`[SSR] Render failed for ${pathname}; serving static fallback.`, err);
    return null;
  }
};
