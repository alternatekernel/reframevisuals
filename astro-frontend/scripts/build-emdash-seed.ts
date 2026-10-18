// Builds seed/emdash.json (collections + the code-managed blog posts) for `npx emdash seed`.
// Production-only posts/pages are merged in afterwards by scripts/export-prod-content.mjs.
import { writeFileSync } from 'node:fs';
import { BLOG_POSTS } from '../src/data/insightsData';

const str = (slug: string, label: string, extra: object = {}) => ({ slug, label, type: 'string', ...extra });
const txt = (slug: string, label: string, extra: object = {}) => ({ slug, label, type: 'text', ...extra });

const postFields = [
  str('title', 'Title', { required: true }),
  txt('excerpt', 'Excerpt'),
  txt('content', 'Content (Markdown)', { required: true }),
  str('cover_image_url', 'Cover image URL'),
  str('image_alt', 'Cover image alt text'),
  str('image_caption', 'Cover image caption'),
  str('category', 'Category'),
  str('read_time', 'Read time'),
  { slug: 'published_date', label: 'Published date', type: 'datetime' },
  { slug: 'featured', label: 'Featured', type: 'boolean' },
  str('topic', 'Topic'),
  { slug: 'tags', label: 'Tags', type: 'json' },
  str('series_id', 'Series ID'),
  { slug: 'series_order', label: 'Series order', type: 'integer' },
  str('cta_type', 'CTA type'),
  str('canonical_slug', 'Canonical slug'),
  str('meta_title', 'SEO title'),
  txt('meta_description', 'SEO description'),
  str('focus_keywords', 'Focus keywords'),
  str('geo_scope', 'Geo scope'),
  str('geo_regions', 'Geo regions'),
  str('schema_type', 'Schema type'),
];

const toIso = (d?: string) => (d && !Number.isNaN(Date.parse(d)) ? new Date(d).toISOString() : undefined);

const seed = {
  version: '1',
  meta: { name: 'Reframe Visuals', description: 'Blog posts, CMS pages and site sections' },
  collections: [
    { slug: 'posts', label: 'Blog posts', labelSingular: 'Blog post', supports: ['drafts', 'revisions', 'preview', 'scheduling', 'search', 'seo'], urlPattern: '/blog/{slug}', fields: postFields },
    {
      slug: 'pages', label: 'Pages', labelSingular: 'Page', supports: ['drafts', 'revisions', 'preview', 'seo'], urlPattern: '/p/{slug}',
      fields: [str('title', 'Title', { required: true }), txt('excerpt', 'Excerpt'), txt('content', 'Content (Markdown)', { required: true }), str('cover_image_url', 'Cover image URL'), str('meta_title', 'SEO title'), txt('meta_description', 'SEO description')],
    },
    {
      slug: 'site_sections', label: 'Site sections', labelSingular: 'Site section', supports: ['drafts', 'revisions'], routable: false,
      fields: [str('title', 'Title', { required: true }), { slug: 'content', label: 'Section content (JSON)', type: 'json' }],
    },
  ],
  content: {
    posts: BLOG_POSTS.map((p: any) => ({
      id: `post:${p.slug}`,
      slug: p.slug,
      status: 'published',
      data: {
        title: p.title, excerpt: p.excerpt, content: p.content, cover_image_url: p.image, image_alt: p.imageAlt, image_caption: p.imageCaption,
        category: p.category, read_time: p.readTime, published_date: toIso(p.date), featured: !!p.featured, topic: p.topic, tags: p.tags ?? [],
        series_id: p.seriesId, series_order: p.seriesOrder, cta_type: p.ctaType, canonical_slug: p.canonicalSlug,
        meta_title: p.metaTitle, meta_description: p.metaDescription, focus_keywords: p.focusKeywords, geo_scope: p.geoScope, geo_regions: p.geoRegions, schema_type: p.schemaType,
      },
    })),
  },
};

writeFileSync('seed/emdash.json', JSON.stringify(seed, null, 2));
console.log(`seed/emdash.json: ${BLOG_POSTS.length} posts`);
