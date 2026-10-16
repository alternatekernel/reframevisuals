/**
 * One-off script: populate missing SEO/GEO fields for all blog posts.
 * Run with:  npx tsx src/scripts/seed-blog-seo-defaults.ts
 *
 * Skips posts where the field is already set — safe to run multiple times.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const posts = await prisma.post.findMany({
    select: {
      id: true,
      slug: true,
      title: true,
      excerpt: true,
      metaTitle: true,
      metaDescription: true,
      schemaType: true,
      geoScope: true,
      hreflang: true,
    },
  });

  console.log(`Found ${posts.length} blog posts.`);
  let updated = 0;

  for (const post of posts) {
    const patch: Record<string, string> = {};

    if (!post.metaTitle) {
      patch.metaTitle = `${post.title} | Reframe Visuals`;
    }
    if (!post.metaDescription && post.excerpt) {
      // Trim to 160 chars max
      patch.metaDescription = post.excerpt.length > 160
        ? post.excerpt.slice(0, 157) + '…'
        : post.excerpt;
    }
    if (!post.schemaType) {
      patch.schemaType = 'BlogPosting';
    }
    if (!post.geoScope) {
      patch.geoScope = 'global';
    }
    if (!post.hreflang) {
      patch.hreflang = 'en';
    }

    if (Object.keys(patch).length > 0) {
      await prisma.post.update({ where: { id: post.id }, data: patch });
      console.log(`  ✓ ${post.slug} — set: ${Object.keys(patch).join(', ')}`);
      updated++;
    } else {
      console.log(`  · ${post.slug} — already complete, skipped`);
    }
  }

  console.log(`\nDone. Updated ${updated}/${posts.length} posts.`);
}

main()
  .catch((err) => { console.error(err); process.exit(1); })
  .finally(() => prisma.$disconnect());
