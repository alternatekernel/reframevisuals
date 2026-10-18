import type { HelmetServerState } from 'react-helmet-async';

/**
 * Shared helmet context passed to <HelmetProvider> in App.tsx.
 *
 * During server-side rendering (entry-server.tsx) react-helmet-async fills
 * `helmet` with the collected head tags for the rendered route. On the client
 * the object is simply unused storage — HelmetProvider still applies tags to
 * the real document head.
 */
export const helmetContext: { helmet?: HelmetServerState } = {};
