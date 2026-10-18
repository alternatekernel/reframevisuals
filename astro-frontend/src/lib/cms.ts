import type { BlogPost } from '../data/insightsData';
import { listEntries, getEntry } from './cms-emdash';

export interface CmsPage {
  slug: string;
  title: string;
  excerpt?: string | null;
  content: string;
  coverImage?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
}

// EmDash is opt-in per environment: with no EMDASH_DATABASE_URL every helper returns null and callers
// fall back to the existing REST API / bundled data, so builds without CMS credentials keep working.
export const cmsEnabled = (): boolean => Boolean(process.env.EMDASH_DATABASE_URL);

const num = (v: unknown) => (typeof v === 'number' ? v : v == null || v === '' ? undefined : Number(v));
const iso = (v: unknown) => (v ? String(v).slice(0, 10) : '');

function entryToPost(entry: any, index: number): BlogPost {
  const d = entry.data ?? entry;
  return {
    id: index + 1,
    slug: entry.slug ?? d.slug,
    category: d.category ?? 'industry',
    title: d.title,
    excerpt: d.excerpt ?? '',
    content: d.content ?? '',
    image: d.cover_image_url ?? '',
    imageAlt: d.image_alt ?? undefined,
    imageCaption: d.image_caption ?? undefined,
    readTime: d.read_time ?? '',
    date: iso(d.published_date ?? entry.publishedAt ?? entry.published_at),
    featured: Boolean(d.featured),
    tags: Array.isArray(d.tags) ? d.tags : [],
    topic: d.topic ?? '',
    seriesId: d.series_id ?? undefined,
    seriesOrder: num(d.series_order),
    updatedAt: iso(entry.updatedAt ?? entry.updated_at) || undefined,
    canonicalSlug: d.canonical_slug ?? undefined,
    ctaType: d.cta_type ?? undefined,
    metaTitle: d.meta_title ?? undefined,
    metaDescription: d.meta_description ?? undefined,
    focusKeywords: d.focus_keywords ?? undefined,
    geoScope: d.geo_scope ?? undefined,
    geoRegions: d.geo_regions ?? undefined,
    schemaType: d.schema_type ?? undefined,
  } as BlogPost;
}

export async function getCmsPosts(): Promise<BlogPost[] | null> {
  if (!cmsEnabled()) return null;
  try {
    const { entries, error } = await listEntries('posts');
    if (error || !entries?.length) return null;
    return entries.map(entryToPost);
  } catch (e) {
    console.warn('[cms] posts unavailable, falling back:', (e as Error).message);
    return null;
  }
}

// undefined = CMS not used (caller falls back); null = CMS has no such page.
export async function getCmsPage(slug: string): Promise<CmsPage | null | undefined> {
  if (!cmsEnabled()) return undefined;
  try {
    const { entry, error } = await getEntry('pages', slug);
    if (error) return undefined;
    if (!entry) return null;
    const d = (entry as any).data ?? entry;
    return {
      slug,
      title: d.title,
      excerpt: d.excerpt ?? null,
      content: d.content ?? '',
      coverImage: d.cover_image_url ?? null,
      metaTitle: d.meta_title ?? null,
      metaDescription: d.meta_description ?? null,
    };
  } catch (e) {
    console.warn('[cms] page unavailable, falling back:', (e as Error).message);
    return undefined;
  }
}
