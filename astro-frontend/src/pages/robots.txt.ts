import type { APIRoute } from 'astro';

export const prerender = true;

const PROD = `User-agent: *
Allow: /

# Block authenticated/private areas
Disallow: /dashboard/
Disallow: /admin/
Disallow: /account/
Disallow: /jobs/

# Block auth flows (no indexing value)
Disallow: /login
Disallow: /signup
Disallow: /forgot-password
Disallow: /reset-password

# Block prototype/internal files
Disallow: /chat-prototype-demo.html
`;

export const GET: APIRoute = ({ site }) => {
  const noindex = import.meta.env.PUBLIC_NOINDEX !== 'false';
  const base = (site ?? new URL('https://reframevisuals.com')).origin;
  const body = noindex ? 'User-agent: *\nDisallow: /\n' : `${PROD}\nSitemap: ${base}/sitemap.xml\n`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
