import React from 'react';
import { RouteProvider } from '../shims/react-router-dom';
import { Providers } from './Providers';

export type RoutedProps = { path?: string; params?: Record<string, string | undefined>; seed?: unknown };

// Wraps a copied page/section component as an Astro island with providers and route context.
export function routed<P extends object>(Component: React.ComponentType<P>) {
  const Island: React.FC<P & RoutedProps> = ({ path = '/', params = {}, seed, ...rest }) => (
    <Providers>
      <RouteProvider pathname={path} params={params} seed={seed}>
        <Component {...(rest as unknown as P)} />
      </RouteProvider>
    </Providers>
  );
  Island.displayName = `routed(${Component.displayName || Component.name || 'View'})`;
  return Island;
}
