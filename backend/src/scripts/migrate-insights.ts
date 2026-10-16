/**
 * One-time, idempotent migration of the hardcoded blog (frontend insightsData.ts)
 * into the database (Post / PostCategory / PostTag).
 *
 * Run:  npx tsx src/scripts/migrate-insights.ts
 * Safe to re-run — posts are upserted on their legacyId.
 */
import { prisma } from '../database';
// The frontend data module. blog.ts only touches localStorage inside functions
// (not at import time), so importing this in Node is safe.
import { BLOG_POSTS } from '../../../frontend/src/data/insightsData';

const slugify = (text: string): string =>
  text.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');

const CATEGORY_NAMES: Record<string, string> = {
  techniques: 'Techniques',
  services: 'Services',
  industry: 'Industry',
};

async function main() {
  console.log(`Migrating ${BLOG_POSTS.length} blog posts into the database...`);

  // 1) Categories
  const categoryIdBySlug: Record<string, string> = {};
  for (const [slug, name] of Object.entries(CATEGORY_NAMES)) {
    const cat = await prisma.postCategory.upsert({
      where: { slug },
      update: { name },
      create: { name, slug },
    });
    categoryIdBySlug[slug] = cat.id;
  }
  console.log(`✔ Categories ready: ${Object.keys(categoryIdBySlug).join(', ')}`);

  // 2) Tags (collect unique across all posts)
  const tagIdByName: Record<string, string> = {};
  const allTagNames = new Set<string>();
  for (const post of BLOG_POSTS) (post.tags || []).forEach((t) => allTagNames.add(t));
  for (const name of allTagNames) {
    const slug = slugify(name);
    if (!slug) continue;
    const tag = await prisma.postTag.upsert({ where: { slug }, update: { name }, create: { name, slug } });
    tagIdByName[name] = tag.id;
  }
  console.log(`✔ Tags ready: ${allTagNames.size}`);

  // 3) Posts
  let created = 0;
  let updated = 0;
  for (const post of BLOG_POSTS) {
    const parsedDate = new Date(post.date);
    const publishedAt = Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
    const tagConnect = (post.tags || [])
      .map((t) => tagIdByName[t])
      .filter(Boolean)
      .map((id) => ({ id }));

    const baseData = {
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
      coverImage: post.image,
      status: 'published',
      featured: Boolean(post.featured),
      readTime: post.readTime,
      ctaType: post.ctaType ?? null,
      topic: post.topic ?? null,
      seriesId: post.seriesId ?? null,
      seriesOrder: post.seriesOrder ?? null,
      canonicalSlug: post.canonicalSlug ?? post.slug,
      publishedAt,
      categoryId: categoryIdBySlug[post.category] ?? null,
    };

    const existing = await prisma.post.findUnique({ where: { legacyId: post.id } });
    if (existing) {
      await prisma.post.update({
        where: { legacyId: post.id },
        data: { ...baseData, tags: { set: tagConnect } },
      });
      updated++;
    } else {
      await prisma.post.create({
        data: { ...baseData, legacyId: post.id, tags: { connect: tagConnect } },
      });
      created++;
    }
  }

  console.log(`✔ Posts migrated — created: ${created}, updated: ${updated}`);
  console.log('Done.');
}

main()
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
