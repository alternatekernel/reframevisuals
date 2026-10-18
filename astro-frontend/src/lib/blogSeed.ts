import { apiGet } from './serverApi';
import { mergeWithStatic } from '../hooks/useBlogPosts';
import type { BlogPost } from '../data/insightsData';

export const CACHE_CONTROL = 's-maxage=300, stale-while-revalidate=3600';

// Server-side equivalent of the client's loadPosts(); null means "use bundled static posts".
export async function loadBlogSeed(): Promise<{ posts: BlogPost[] } | undefined> {
  const data = await apiGet<{ posts?: BlogPost[] }>('/blog/posts');
  return Array.isArray(data?.posts) && data!.posts!.length > 0 ? { posts: mergeWithStatic(data!.posts!) } : undefined;
}
