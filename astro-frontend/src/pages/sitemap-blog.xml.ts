import type { APIRoute } from 'astro';
import { loadBlogSeed, CACHE_CONTROL } from '../lib/blogSeed';
import { BLOG_POSTS } from '../data/insightsData';

export const prerender = false;

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export const GET: APIRoute = async ({ site }) => {
  const base = (site ?? new URL('https://reframevisuals.com')).origin;
  const posts = (await loadBlogSeed())?.posts ?? BLOG_POSTS;
  const urls = [`${base}/blog`, ...posts.map((p) => `${base}/blog/${p.slug}`)];
  const lastmods = new Map(posts.map((p) => [`${base}/blog/${p.slug}`, p.updatedAt || p.date]));
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map((u) => {
    const lm = lastmods.get(u);
    const iso = lm && !Number.isNaN(Date.parse(lm)) ? new Date(lm).toISOString().slice(0, 10) : null;
    return `  <url><loc>${esc(u)}</loc>${iso ? `<lastmod>${iso}</lastmod>` : ''}</url>`;
  })
  .join('\n')}
</urlset>
`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': CACHE_CONTROL } });
};
