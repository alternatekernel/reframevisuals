import type { APIRoute } from 'astro';
import { SERVICES } from '../data/services';
import { isExcludedService } from '../lib/serviceData';

// The CMS-driven pages are server-rendered, so @astrojs/sitemap (which only sees prerendered routes) cannot list them.
export const prerender = true;

export const GET: APIRoute = ({ site }) => {
  const base = (site ?? new URL('https://reframevisuals.com')).origin;
  const urls = [`${base}/`, `${base}/services`, `${base}/pricing`, ...SERVICES.filter((s: any) => !isExcludedService(s)).map((s: any) => `${base}/services/${s.id}`)];
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${u}</loc></url>`).join('\n')}
</urlset>
`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
