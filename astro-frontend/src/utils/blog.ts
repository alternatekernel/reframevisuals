import type { BlogPost } from '../data/insightsData';

export type BlogSort = 'latest' | 'popular' | 'updated';
export type BlogCtaType = 'audit' | 'trial' | 'quote';

const SAVED_KEY = 'reframe_blog_saved';
const HISTORY_KEY = 'reframe_blog_history';
const PREFS_KEY = 'reframe_blog_reader_prefs';

export interface ReaderPrefs {
  fontSize: 's' | 'm' | 'l';
  lineHeight: 'normal' | 'relaxed';
}

export interface TocItem {
  id: string;
  text: string;
  level: 2 | 3;
}

export const defaultReaderPrefs: ReaderPrefs = {
  fontSize: 'm',
  lineHeight: 'normal',
};

export const slugToTopic = (slug: string): string => {
  if (slug.includes('color') || slug.includes('delta') || slug.includes('white-balance')) return 'color-science';
  if (slug.includes('ghost') || slug.includes('mannequin') || slug.includes('apparel')) return 'ghost-mannequin';
  if (slug.includes('shadow') || slug.includes('light') || slug.includes('lighting')) return 'lighting';
  if (slug.includes('retouch') || slug.includes('skin') || slug.includes('jewelry')) return 'retouching';
  if (slug.includes('clip') || slug.includes('background') || slug.includes('edge')) return 'clipping-and-qa';
  return 'ecommerce-workflows';
};

export const topicLabel = (topic: string): string =>
  topic
    .split('-')
    .map((t) => t.charAt(0).toUpperCase() + t.slice(1))
    .join(' ');

export const getTopicPastel = (topic: string): string => {
  return 'border-black/[0.18] bg-white text-black/70 shadow-sm';
};

export const deriveTags = (post: BlogPost): string[] => {
  const tags = new Set<string>();
  tags.add(topicLabel(post.topic));
  if (post.category === 'techniques') tags.add('Workflow');
  if (post.category === 'services') tags.add('Service Deep Dive');
  if (post.category === 'industry') tags.add('Industry');
  if (/amazon|shopify|marketplace/i.test(post.content)) tags.add('Marketplace');
  if (/qa|quality|checklist|protocol/i.test(post.content)) tags.add('QA');
  if (/conversion|returns|ctr|lift/i.test(post.content)) tags.add('Conversion');
  return [...tags];
};

export const deriveSeries = (post: BlogPost): { seriesId?: string; seriesOrder?: number } => {
  const title = post.title.toLowerCase();
  if (title.includes('delta-e') || title.includes('color')) {
    return { seriesId: 'color-accuracy-protocol', seriesOrder: post.id };
  }
  if (title.includes('ghost mannequin') || title.includes('apparel')) {
    return { seriesId: 'apparel-conversion-workflows', seriesOrder: post.id };
  }
  if (title.includes('shadow') || title.includes('lighting')) {
    return { seriesId: 'light-and-depth-workflows', seriesOrder: post.id };
  }
  return {};
};

export const readMinutesToNumber = (readTime: string): number => {
  const match = readTime.match(/\d+/);
  return match ? Number(match[0]) : 6;
};

export const parseDisplayDate = (date: string): number => {
  const ts = Date.parse(date);
  return Number.isNaN(ts) ? 0 : ts;
};

export const sortPosts = (posts: BlogPost[], sort: BlogSort): BlogPost[] => {
  const next = [...posts];
  if (sort === 'popular') {
    return next.sort((a, b) => (b.id % 9) - (a.id % 9));
  }
  if (sort === 'updated') {
    return next.sort((a, b) => parseDisplayDate(b.updatedAt || b.date) - parseDisplayDate(a.updatedAt || a.date));
  }
  return next.sort((a, b) => parseDisplayDate(b.date) - parseDisplayDate(a.date));
};

export const searchPosts = (posts: BlogPost[], q: string): BlogPost[] => {
  const needle = q.trim().toLowerCase();
  if (!needle) return posts;
  return posts.filter((p) =>
    [p.title, p.excerpt, p.topic, ...(p.tags || [])].some((v) => v.toLowerCase().includes(needle))
  );
};

export const extractToc = (content: string): TocItem[] => {
  const lines = content.split('\n');
  const items: TocItem[] = [];
  for (const line of lines) {
    if (line.startsWith('### ')) {
      const text = line.replace(/^###\s+/, '').trim();
      items.push({ id: slugifyHeading(text), text, level: 3 });
    } else if (line.startsWith('## ')) {
      const text = line.replace(/^##\s+/, '').trim();
      items.push({ id: slugifyHeading(text), text, level: 2 });
    }
  }
  return items;
};

export const slugifyHeading = (text: string): string =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');

const safeParse = <T,>(raw: string | null, fallback: T): T => {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const readStorage = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const writeStorage = (key: string, value: string): void => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore write errors (private mode / blocked storage)
  }
};

export const getSavedSlugs = (): string[] => safeParse<string[]>(readStorage(SAVED_KEY), []);

export const toggleSavedSlug = (slug: string): string[] => {
  const current = new Set(getSavedSlugs());
  if (current.has(slug)) current.delete(slug);
  else current.add(slug);
  const next = [...current];
  writeStorage(SAVED_KEY, JSON.stringify(next));
  return next;
};

export const pushReadingHistory = (slug: string): string[] => {
  const current = getReadingHistory().filter((s) => s !== slug);
  const next = [slug, ...current].slice(0, 8);
  writeStorage(HISTORY_KEY, JSON.stringify(next));
  return next;
};

export const getReadingHistory = (): string[] => safeParse<string[]>(readStorage(HISTORY_KEY), []);

export const getReaderPrefs = (): ReaderPrefs =>
  safeParse<ReaderPrefs>(readStorage(PREFS_KEY), defaultReaderPrefs);

export const setReaderPrefs = (prefs: ReaderPrefs): void => {
  writeStorage(PREFS_KEY, JSON.stringify(prefs));
};

export const inferCtaType = (post: BlogPost): BlogCtaType => {
  if (post.topic.includes('workflow') || post.topic.includes('qa')) return 'quote';
  if (post.topic.includes('lighting') || post.topic.includes('retouching')) return 'trial';
  return 'audit';
};
