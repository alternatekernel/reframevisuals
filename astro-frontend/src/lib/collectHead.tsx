import React from 'react';
import { renderToString } from 'react-dom/server';
import '../shims/storage';
import { Providers } from '../islands/Providers';
import { RouteProvider } from '../shims/react-router-dom';
import { HeadCollectorCtx, type HeadCollector } from '../shims/react-helmet-async';

const views = import.meta.glob('../views/*.tsx', { eager: true }) as Record<string, { default: React.ComponentType }>;

// Renders a view once at build time to read the <title>/<meta description> it sets via Helmet.
export function collectHead(view: string, path: string, params: Record<string, string | undefined> = {}, seed?: unknown): HeadCollector {
  const View = views[`../views/${view}.tsx`]?.default;
  const collector: HeadCollector = {};
  if (!View) return collector;
  try {
    renderToString(
      <HeadCollectorCtx.Provider value={collector}>
        <Providers>
          <RouteProvider pathname={path} params={params} seed={seed}>
            <View />
          </RouteProvider>
        </Providers>
      </HeadCollectorCtx.Provider>
    );
  } catch (e) {
    console.warn(`[collectHead] ${view} ${path}:`, (e as Error).message);
  }
  return collector;
}
