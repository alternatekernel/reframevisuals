import { useEffect, useState } from 'react';
import { BLOG_POSTS, type BlogPost } from '../data/insightsData';

// Module-level cache so we fetch the DB-backed posts once per page load.
let cache: BlogPost[] | null = null;
// Single in-flight request shared by all components mounting at the same time.
let inflight: Promise<BlogPost[]> | null = null;
// True once the DB fetch has resolved (success or failure) — consumers use
// this to distinguish "post not published" from "posts still loading".
let settled = false;

// Some published posts are intentionally code-managed because their SEO package,
// cover asset, and schema are reviewed in Git before release. Keep these static
// versions authoritative even when the CMS database still has an older draft.
const STATIC_PRIORITY_SLUGS = new Set(['ghost-mannequin-fit-and-conversion', 'support-images-in-product-photography']);

const API_BASE = import.meta.env.VITE_API_URL
  || (typeof window !== 'undefined' ? `${window.location.origin}/api` : '/api');

const loadPosts = (): Promise<BlogPost[]> => {
  if (cache) return Promise.resolve(cache);
  if (!inflight) {
    inflight = fetch(`${API_BASE}/blog/posts`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
      .then((data) => {
        if (Array.isArray(data?.posts) && data.posts.length > 0) {
          const staticPriorityPosts = new Map(
            BLOG_POSTS.filter((post) => STATIC_PRIORITY_SLUGS.has(post.slug)).map((post) => [post.slug, post])
          );
          const mergedPosts = (data.posts as BlogPost[]).map((post) => staticPriorityPosts.get(post.slug) || post);
          BLOG_POSTS.forEach((post) => {
            if (STATIC_PRIORITY_SLUGS.has(post.slug) && !mergedPosts.some((item) => item.slug === post.slug)) {
              mergedPosts.push(post);
            }
          });
          cache = mergedPosts;
        }
        return cache || BLOG_POSTS;
      })
      .catch(() => BLOG_POSTS) // keep the static fallback — the blog is never empty
      .finally(() => { settled = true; });
  }
  return inflight;
};

/**
 * Blog posts plus a `loaded` flag that turns true once the database fetch has
 * settled. Pages that redirect on "post not found" MUST wait for `loaded` —
 * otherwise posts that exist only in the CMS (anything published after the
 * last code deploy) look missing during the first render and get bounced.
 */
export function useBlogFeed(): { posts: BlogPost[]; loaded: boolean } {
  const [state, setState] = useState<{ posts: BlogPost[]; loaded: boolean }>(() => ({
    posts: cache || BLOG_POSTS,
    loaded: settled,
  }));

  useEffect(() => {
    if (state.loaded && cache) return;
    let active = true;
    loadPosts().then((posts) => {
      if (active) setState({ posts, loaded: true });
    });
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return state;
}

/**
 * Returns the blog posts for the public site.
 *
 * Starts with the bundled static posts (so first paint, SEO, and local dev with
 * no backend all work unchanged), then transparently swaps in the database-backed
 * posts from `/api/blog/posts` once they load. If the request fails or returns
 * nothing, the static posts remain — there is no window where the blog is empty.
 */
export function useBlogPosts(): BlogPost[] {
  return useBlogFeed().posts;
}
