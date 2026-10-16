/**
 * Publish the "Support Images in Product Photography" blog post to a deployed
 * environment via the live admin API — no DB or container access required.
 *
 * What it does, in order:
 *   1. Authenticates (ADMIN_TOKEN, or ADMIN_EMAIL + ADMIN_PASSWORD).
 *   2. Uploads the cover banner to Cloudinary through POST /cms/media
 *      (server-side signed upload — you do NOT need Cloudinary secrets locally).
 *   3. Ensures the "Techniques" category exists.
 *   4. Removes any existing post occupying the new slug or the old slug
 *      (only when DELETE_OLD=true — see the slug/redirect note below).
 *   5. Creates the post as `published` and prints its public URL.
 *
 * Run (network access to the site + admin credentials required):
 *   PROD_API=https://reframevisuals.com/api \
 *   ADMIN_EMAIL=admin@reframevisuals.com ADMIN_PASSWORD=*** \
 *   COVER_IMAGE=./reframe-support-images-cover.jpg \
 *   npx tsx src/scripts/publish-support-images-post.ts
 *
 * Draft mode (creates the post as a draft to review in the admin panel, does NOT
 * publish and does NOT touch the old post):
 *   DRAFT=true PROD_API=... ADMIN_EMAIL=... ADMIN_PASSWORD=... \
 *   COVER_IMAGE=./reframe-support-images-cover.jpg \
 *   npx tsx src/scripts/publish-support-images-post.ts
 *
 * Slug / redirect note: the previous version of this article used the slug
 * `support-shot-compositing-for-product-images`. This script can DELETE that old
 * post (DELETE_OLD=true, the default) so only the new slug remains. A hard delete
 * removes the old URL — set up a 301 redirect from the old slug to the new one at
 * the edge/nginx layer if you want to preserve existing links and index entries.
 * Set DELETE_OLD=false to keep the old post live instead.
 */
import { readFileSync } from 'fs';
import { resolve } from 'path';

const API = process.env.PROD_API || 'https://reframevisuals.com/api';
const EMAIL = process.env.ADMIN_EMAIL;
const PASSWORD = process.env.ADMIN_PASSWORD;
const COVER_IMAGE = process.env.COVER_IMAGE || '';
const COVER_URL = process.env.COVER_URL || ''; // already-hosted Cloudinary URL (skips upload)
// DRAFT=true creates the post as a draft for review (no publish, old post left untouched).
const DRAFT = (process.env.DRAFT ?? 'false').toLowerCase() === 'true';
const DELETE_OLD = (process.env.DELETE_OLD ?? 'true').toLowerCase() !== 'false';

const NEW_SLUG = 'support-images-in-product-photography';
const OLD_SLUG = 'support-shot-compositing-for-product-images';

// Article body lives next to the SEO package in content/blog-drafts.
const CONTENT_PATH = resolve(__dirname, '../../../content/blog-drafts/support-images-in-product-photography.md');

const POST = {
  title: 'Support Images in Product Photography: How Multiple Shots Build One Final Image',
  slug: NEW_SLUG,
  excerpt:
    'How editors use support images to merge focus, exposure, shadow, and detail from multiple shots into one clean, accurate ecommerce product photo.',
  status: (DRAFT ? 'draft' : 'published') as 'draft' | 'published',
  featured: false,
  readTime: '7 min read',
  ctaType: 'quote' as const, // "Build Quote" CTA -> /quote-builder
  topic: 'support-image-compositing',
  canonicalSlug: NEW_SLUG,
  categorySlug: 'techniques',
  categoryName: 'Techniques',
  tags: [
    'Support Images',
    'Image Compositing',
    'Composite Photography',
    'Source Images',
    'Focus Stacking',
    'Product Photo Editing',
    'Retouching Workflow',
    'Inclip',
    'Ecommerce Photography',
  ],
};

async function jsonOrThrow(res: Response, label: string) {
  if (!res.ok) throw new Error(`${label} failed (${res.status}): ${(await res.text()).slice(0, 200)}`);
  return res.json() as Promise<any>;
}

async function main() {
  const content = readFileSync(CONTENT_PATH, 'utf8');

  // 1) Auth
  let token = process.env.ADMIN_TOKEN || '';
  if (!token) {
    if (!EMAIL || !PASSWORD) throw new Error('Provide ADMIN_TOKEN, or ADMIN_EMAIL + ADMIN_PASSWORD');
    const loginJson = await jsonOrThrow(
      await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
      }),
      'Login'
    );
    token = loginJson?.data?.token || loginJson?.token;
    if (!token) throw new Error('No token in login response');
    console.log('✔ Logged in');
  } else {
    console.log('✔ Using provided ADMIN_TOKEN');
  }
  const authJson = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  const authOnly = { Authorization: `Bearer ${token}` };

  // 2) Resolve the cover image. Prefer a pre-uploaded Cloudinary URL (COVER_URL);
  //    otherwise upload a local file via the server-side signed /cms/media endpoint.
  let coverImage: string | undefined;
  if (COVER_URL) {
    coverImage = COVER_URL;
    console.log(`✔ Using provided cover URL: ${coverImage}`);
  } else if (COVER_IMAGE) {
    const buf = readFileSync(resolve(COVER_IMAGE));
    const ext = COVER_IMAGE.split('.').pop()?.toLowerCase() || 'jpg';
    const mime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
    const form = new FormData();
    form.append('file', new Blob([buf], { type: mime }), COVER_IMAGE.split('/').pop() || `cover.${ext}`);
    form.append('altText', 'Four support shots of a grey polo and cargo trousers combined into one final ecommerce product image.');
    form.append('caption', 'Four support shots, each perfecting one area, composited into a single clean final product image.');
    const mediaJson = await jsonOrThrow(
      await fetch(`${API}/cms/media`, { method: 'POST', headers: authOnly, body: form }),
      'Cover upload'
    );
    coverImage = mediaJson?.media?.url;
    console.log(`✔ Cover uploaded: ${coverImage}`);
  } else {
    console.warn('⚠ COVER_IMAGE not set — creating the post without a cover image. Re-run with COVER_IMAGE to attach it, or set it in the CMS.');
  }

  // 3) Ensure the Techniques category.
  const catJson = await jsonOrThrow(await fetch(`${API}/cms/categories`, { headers: authJson }), 'List categories');
  let categoryId = (catJson.categories || []).find((c: any) => c.slug === POST.categorySlug)?.id;
  if (!categoryId) {
    const created = await jsonOrThrow(
      await fetch(`${API}/cms/categories`, { method: 'POST', headers: authJson, body: JSON.stringify({ name: POST.categoryName }) }),
      'Create category'
    );
    categoryId = created.category.id;
  }
  console.log(`✔ Category ready: ${POST.categorySlug} (${categoryId})`);

  // 4) Clear conflicting slugs. Always free the new slug so re-runs are idempotent.
  //    In draft mode the old post is left untouched (you review before anything is removed).
  const listJson = await jsonOrThrow(await fetch(`${API}/cms/posts?limit=500`, { headers: authJson }), 'List posts');
  const slugsToClear = !DRAFT && DELETE_OLD ? [NEW_SLUG, OLD_SLUG] : [NEW_SLUG];
  for (const p of listJson.posts || []) {
    if (slugsToClear.includes(p.slug)) {
      await jsonOrThrow(await fetch(`${API}/cms/posts/${p.id}`, { method: 'DELETE', headers: authJson }), `Delete ${p.slug}`);
      console.log(`✔ Deleted existing post: ${p.slug} (${p.id})`);
    }
  }

  // 5) Create the post.
  const payload = {
    title: POST.title,
    slug: POST.slug,
    excerpt: POST.excerpt,
    content,
    coverImage: coverImage ?? null,
    status: POST.status,
    featured: POST.featured,
    readTime: POST.readTime,
    ctaType: POST.ctaType,
    topic: POST.topic,
    canonicalSlug: POST.canonicalSlug,
    categoryId,
    tags: POST.tags,
  };
  const createdJson = await jsonOrThrow(
    await fetch(`${API}/cms/posts`, { method: 'POST', headers: authJson, body: JSON.stringify(payload) }),
    'Create post'
  );

  const publicBase = API.replace(/\/api\/?$/, '');
  if (DRAFT) {
    console.log(`\n📝 Saved as DRAFT: ${createdJson.post?.title}`);
    console.log(`   Review it in the admin panel: ${publicBase}/admin  ->  Blog Posts  ->  status "Draft"`);
    console.log(`   Post id: ${createdJson.post?.id}`);
    console.log(`   The old post (${OLD_SLUG}) was left untouched. Delete it and flip this one to Published when you're happy.`);
  } else {
    console.log(`\n✅ Published: ${createdJson.post?.title}`);
    console.log(`   Review URL: ${publicBase}/blog/${POST.slug}`);
    if (DELETE_OLD) {
      console.log(`   Note: the old slug 301-redirects to the new one (handled in backend/src/index.ts).`);
    }
  }
}

main().catch((err) => {
  console.error('Failed:', err.message);
  process.exit(1);
});
