// Adds production-only content (posts/pages that exist in the live database, not in code) to seed/emdash.json.
// Run where the production API is reachable:  node scripts/export-prod-content.mjs [--pages slug1,slug2]
import { readFileSync, writeFileSync } from 'node:fs';

const API = process.env.API_BASE || 'https://reframevisuals.com/api';
const seed = JSON.parse(readFileSync('seed/emdash.json', 'utf8'));
const iso = (d) => (d && !Number.isNaN(Date.parse(d)) ? new Date(d).toISOString() : undefined);
const get = async (p) => {
  const r = await fetch(`${API}${p}`);
  if (!r.ok) throw new Error(`${p}: ${r.status}`);
  return r.json();
};

const have = new Set(seed.content.posts.map((p) => p.slug));
const { posts = [] } = await get('/blog/posts');
let added = 0;
for (const p of posts) {
  if (have.has(p.slug)) continue;
  seed.content.posts.push({
    id: `post:${p.slug}`, slug: p.slug, status: 'published',
    data: {
      title: p.title, excerpt: p.excerpt, content: p.content, cover_image_url: p.image || p.coverImage, image_alt: p.imageAlt, image_caption: p.imageCaption,
      category: p.category, read_time: p.readTime, published_date: iso(p.date || p.publishedAt), featured: !!p.featured, topic: p.topic, tags: p.tags ?? [],
      series_id: p.seriesId, series_order: p.seriesOrder, cta_type: p.ctaType, canonical_slug: p.canonicalSlug,
      meta_title: p.metaTitle, meta_description: p.metaDescription, focus_keywords: p.focusKeywords, geo_scope: p.geoScope, geo_regions: p.geoRegions, schema_type: p.schemaType,
    },
  });
  added++;
}

const slugs = (process.argv.find((a) => a.startsWith('--pages=')) || '').replace('--pages=', '') || (process.argv.includes('--pages') ? process.argv[process.argv.indexOf('--pages') + 1] : '');
seed.content.pages ??= [];
for (const slug of slugs.split(',').filter(Boolean)) {
  const { page } = await get(`/blog/pages/${slug}`);
  if (!page) continue;
  seed.content.pages.push({ id: `page:${slug}`, slug, status: 'published', data: { title: page.title, excerpt: page.excerpt, content: page.content, cover_image_url: page.coverImage, meta_title: page.metaTitle, meta_description: page.metaDescription } });
}

writeFileSync('seed/emdash.json', JSON.stringify(seed, null, 2));
console.log(`added ${added} production-only posts, ${seed.content.pages.length} pages`);
