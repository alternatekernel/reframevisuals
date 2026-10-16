import './ssr/shims';
import { PassThrough } from 'node:stream';
import { renderToPipeableStream } from 'react-dom/server';
import {
  createStaticHandler,
  createStaticRouter,
  StaticRouterProvider,
} from 'react-router-dom';
import { routes } from './App';
import { helmetContext } from './ssr/helmetContext';

export interface SsrHelmet {
  title: string;
  meta: string;
  link: string;
  script: string;
  style: string;
}

export interface SsrRenderResult {
  /** Server-rendered markup for the #root container. */
  appHtml: string;
  /** Head tags collected by react-helmet-async (stringified), if any. */
  helmet: SsrHelmet | null;
  /**
   * Title text rendered by the route. react-helmet-async v3 with React 19
   * renders <title> inline instead of populating the server context, so we
   * extract it from the markup defensively.
   */
  title: string | null;
  /** Status code resolved by the router (e.g. 404 for unknown routes). */
  status: number;
  /** Set instead of appHtml when the route resolved to a redirect. */
  redirect?: string;
}

/**
 * react-helmet-async v3 + React 19 renders head tags (title/meta/link) inline
 * where the <Helmet> component sits instead of filling the server context.
 * Strip head-level tags out of the body markup so they cannot conflict with
 * the head tags the Express server owns via injectSeoMeta (single source of
 * truth). JSON-LD <script> blocks are left in place — they are valid in body.
 */
const stripHeadLevelTags = (html: string): { html: string; title: string | null } => {
  let title: string | null = null;
  let out = html.replace(/<title[^>]*>([\s\S]*?)<\/title>/gi, (_match, text: string) => {
    if (title === null) title = text;
    return '';
  });
  out = out.replace(
    /<meta\s[^>]*(?:name|property)="(?:description|robots|googlebot|keywords|author|og:[^"]*|twitter:[^"]*|article:[^"]*)"[^>]*\/?>/gi,
    ''
  );
  out = out.replace(/<link\s[^>]*rel="(?:canonical|alternate|amphtml)"[^>]*\/?>/gi, '');
  return { html: out, title };
};

const handler = createStaticHandler(routes);

const ORIGIN = 'https://reframevisuals.com';

/**
 * Render a route to HTML on the server.
 *
 * Uses renderToPipeableStream + onAllReady so React.lazy route chunks are
 * resolved before the HTML is captured (renderToString would emit Suspense
 * fallbacks instead of page content).
 */
export async function render(
  url: string,
  { timeoutMs = 10000 }: { timeoutMs?: number } = {}
): Promise<SsrRenderResult> {
  const request = new Request(
    url.startsWith('http') ? url : `${ORIGIN}${url.startsWith('/') ? url : `/${url}`}`
  );

  const context = await handler.query(request);

  if (context instanceof Response) {
    const location = context.headers.get('Location') || undefined;
    return { appHtml: '', helmet: null, title: null, status: context.status, redirect: location };
  }

  const router = createStaticRouter(handler.dataRoutes, context);

  // Reset shared helmet context between renders.
  delete helmetContext.helmet;

  const appHtml = await new Promise<string>((resolve, reject) => {
    let settled = false;
    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      fn();
    };

    const { pipe, abort } = renderToPipeableStream(
      // hydrate={false}: no route loaders are used, so skip the inline
      // __staticRouterHydrationData script (site CSP disallows inline JS).
      <StaticRouterProvider router={router} context={context} hydrate={false} />,
      {
        // We buffer until onAllReady, so progressive outlining of large
        // Suspense content (hidden segments revealed by inline $RC scripts)
        // is useless here — and the site CSP blocks those inline scripts.
        // A huge chunk size keeps every boundary's content inline.
        progressiveChunkSize: 64 * 1024 * 1024,
        onAllReady() {
          const body = new PassThrough();
          let html = '';
          body.on('data', (chunk: Buffer) => {
            html += chunk.toString('utf8');
          });
          body.on('end', () => finish(() => resolve(html)));
          body.on('error', (err: Error) => finish(() => reject(err)));
          pipe(body);
        },
        onShellError(err) {
          finish(() => reject(err instanceof Error ? err : new Error(String(err))));
        },
        onError(err) {
          // Non-shell errors render Suspense fallbacks; log but keep going.
          console.error('[SSR] recoverable render error:', err);
        },
      }
    );

    const timer = setTimeout(() => {
      abort(new Error(`SSR render timed out after ${timeoutMs}ms`));
      finish(() => reject(new Error(`SSR render timed out after ${timeoutMs}ms`)));
    }, timeoutMs);
  });

  const h = helmetContext.helmet;
  const helmet: SsrHelmet | null = h
    ? {
        title: h.title.toString(),
        meta: h.meta.toString(),
        link: h.link.toString(),
        script: h.script.toString(),
        style: h.style.toString(),
      }
    : null;

  const { html: cleanedHtml, title } = stripHeadLevelTags(appHtml);

  return { appHtml: cleanedHtml, helmet, title, status: context.statusCode || 200 };
}
