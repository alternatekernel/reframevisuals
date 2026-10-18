// Shared response helpers for server-rendered (non-prerendered) pages.
export const EDGE_CACHE = 's-maxage=300, stale-while-revalidate=3600';
export function cacheEdge(Astro: { response: { headers: Headers } }) {
  Astro.response.headers.set('Cache-Control', EDGE_CACHE);
}
