import { apiGet } from './serverApi';
import { mergeWithStatic } from '../hooks/useBlogPosts';
import type { BlogPost } from '../data/insightsData';
import { getCmsPosts } from './cms';
import { BLOG_POSTS } from '../data/insightsData';

export const CACHE_CONTROL = 's-maxage=300, stale-while-revalidate=3600';

// Server-side equivalent of the client's loadPosts(); null means "use bundled static posts".
export async function loadBlogSeed(): Promise<{ posts: BlogPost[] } | undefined> {
  const cmsPosts = await getCmsPosts();
  if (cmsPosts) return { posts: mergeWithStatic(cmsPosts) };
  const data = await apiGet<{ posts?: BlogPost[] }>('/blog/posts');
  return Array.isArray(data?.posts) && data!.posts!.length > 0 ? { posts: mergeWithStatic(data!.posts!) } : undefined;
}

// All blog posts for server-rendered sections (DB/EmDash posts merged over the bundled ones, bundled as fallback).
export async function loadBlogPosts(): Promise<BlogPost[]> {
  return (await loadBlogSeed())?.posts ?? BLOG_POSTS;
}
