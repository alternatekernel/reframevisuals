/**
 * Populate a deployed environment's blog with the legacy insightsData posts by
 * calling the live admin API (no DB/container access needed). Idempotent: posts
 * whose slug already exists are skipped.
 *
 * Run:
 *   PROD_API=https://reframevisuals.com/api \
 *   ADMIN_EMAIL=admin@reframevisuals.com ADMIN_PASSWORD=*** \
 *   npx tsx src/scripts/push-insights-to-api.ts
 */
import { BLOG_POSTS } from '../../../frontend/src/data/insightsData';

const API = process.env.PROD_API || 'https://reframevisuals.com/api';
const EMAIL = process.env.ADMIN_EMAIL;
const PASSWORD = process.env.ADMIN_PASSWORD;

const CATEGORY_NAMES: Record<string, string> = {
  techniques: 'Techniques',
  services: 'Services',
  industry: 'Industry',
};

async function main() {
  // Auth: prefer a pre-minted ADMIN_TOKEN, otherwise log in with email/password.
  let token = process.env.ADMIN_TOKEN || '';
  if (!token) {
    if (!EMAIL || !PASSWORD) throw new Error('Provide ADMIN_TOKEN, or ADMIN_EMAIL + ADMIN_PASSWORD');
    const loginRes = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
    });
    if (!loginRes.ok) throw new Error(`Login failed (${loginRes.status})`);
    const loginJson: any = await loginRes.json();
    token = loginJson?.data?.token || loginJson?.token;
    if (!token) throw new Error('No token in login response');
    console.log('✔ Logged in');
  } else {
    console.log('✔ Using provided ADMIN_TOKEN');
  }
  const auth = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  // 2) Categories (create missing, map slug -> id)
  const catRes = await fetch(`${API}/cms/categories`, { headers: auth });
  const catJson: any = await catRes.json();
  const catIdBySlug: Record<string, string> = {};
  (catJson.categories || []).forEach((c: any) => { catIdBySlug[c.slug] = c.id; });

  for (const [slug, name] of Object.entries(CATEGORY_NAMES)) {
    if (catIdBySlug[slug]) continue;
    const r = await fetch(`${API}/cms/categories`, { method: 'POST', headers: auth, body: JSON.stringify({ name }) });
    if (r.ok) { const j: any = await r.json(); catIdBySlug[j.category.slug] = j.category.id; }
  }
  console.log(`✔ Categories ready: ${Object.keys(catIdBySlug).join(', ')}`);

  // 3) Existing post slugs (for idempotency)
  const postsRes = await fetch(`${API}/cms/posts?limit=500`, { headers: auth });
  const postsJson: any = await postsRes.json();
  const existing = new Set<string>((postsJson.posts || []).map((p: any) => p.slug));

  // 4) Push posts
  let created = 0, skipped = 0, failed = 0;
  for (const post of BLOG_POSTS) {
    if (existing.has(post.slug)) { skipped++; continue; }
    const payload = {
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      coverImage: post.image,
      status: 'published',
      featured: Boolean(post.featured),
      readTime: post.readTime,
      ctaType: post.ctaType ?? null,
      topic: post.topic ?? null,
      categoryId: catIdBySlug[post.category] ?? null,
      tags: post.tags || [],
    };
    const r = await fetch(`${API}/cms/posts`, { method: 'POST', headers: auth, body: JSON.stringify(payload) });
    if (r.ok) { created++; console.log(`  + ${post.slug}`); }
    else { failed++; console.log(`  ! ${post.slug} (${r.status}): ${(await r.text()).slice(0, 120)}`); }
  }

  console.log(`\nDone — created: ${created}, skipped (existing): ${skipped}, failed: ${failed}`);
}

main().catch((err) => { console.error('Failed:', err.message); process.exit(1); });
