import { Router } from 'express';
import { prisma } from '../database';

const router = Router();

function monthLabel(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

function monthBounds(year: number, month: number): { start: Date; end: Date } {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

router.get('/overview', async (_req, res) => {
  try {
    const now = new Date();

    // ── BLOG ──────────────────────────────────────────────────────────────
    const allPosts = await prisma.post.findMany({
      select: {
        status: true,
        featured: true,
        readTime: true,
        publishedAt: true,
        metaTitle: true,
        metaDescription: true,
        focusKeywords: true,
        geoScope: true,
        hreflang: true,
        schemaType: true,
        category: { select: { name: true } },
      },
    });

    const blogTotal        = allPosts.length;
    const blogPublished    = allPosts.filter(p => p.status === 'published').length;
    const blogDraft        = allPosts.filter(p => p.status === 'draft').length;
    const blogScheduled    = allPosts.filter(p => p.status === 'scheduled').length;
    const blogFeatured     = allPosts.filter(p => p.featured).length;
    const blogWithMetaDesc = allPosts.filter(p => p.metaDescription?.trim()).length;
    const blogWithMetaTitle = allPosts.filter(p => p.metaTitle?.trim()).length;
    const blogWithFocusKw  = allPosts.filter(p => p.focusKeywords?.trim()).length;

    // By category
    const catMap = new Map<string, number>();
    for (const p of allPosts) {
      const cat = p.category?.name || 'Uncategorized';
      catMap.set(cat, (catMap.get(cat) || 0) + 1);
    }
    const byCategory = Array.from(catMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // Posts published per month — last 12 months
    const byMonth: { month: string; count: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const { start, end } = monthBounds(d.getFullYear(), d.getMonth());
      const count = allPosts.filter(
        p => p.publishedAt && p.publishedAt >= start && p.publishedAt <= end,
      ).length;
      byMonth.push({ month: monthLabel(d), count });
    }

    // Geo scope breakdown (published only)
    const published = allPosts.filter(p => p.status === 'published');
    const geoMap = new Map<string, number>();
    for (const p of published) {
      const scope = p.geoScope?.trim() || 'not set';
      geoMap.set(scope, (geoMap.get(scope) || 0) + 1);
    }
    const geoScopeBreakdown = Array.from(geoMap.entries())
      .map(([scope, count]) => ({ scope, count }))
      .sort((a, b) => b.count - a.count);

    // Schema type breakdown
    const schemaMap = new Map<string, number>();
    for (const p of published) {
      const t = p.schemaType?.trim() || 'not set';
      schemaMap.set(t, (schemaMap.get(t) || 0) + 1);
    }
    const schemaTypeBreakdown = Array.from(schemaMap.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);

    // Hreflang breakdown
    const hreflangMap = new Map<string, number>();
    for (const p of published) {
      const h = p.hreflang?.trim() || 'not set';
      hreflangMap.set(h, (hreflangMap.get(h) || 0) + 1);
    }
    const hreflangBreakdown = Array.from(hreflangMap.entries())
      .map(([lang, count]) => ({ lang, count }))
      .sort((a, b) => b.count - a.count);

    // Average read time
    const readTimes = allPosts
      .map(p => parseInt(p.readTime ?? '0') || 0)
      .filter(n => n > 0);
    const avgReadTime = readTimes.length
      ? Math.round(readTimes.reduce((a, b) => a + b, 0) / readTimes.length)
      : 0;

    // ── PAGES ─────────────────────────────────────────────────────────────
    const allPages = await prisma.page.findMany({
      select: {
        status: true,
        metaTitle: true,
        metaDescription: true,
        focusKeywords: true,
        geoScope: true,
        hreflang: true,
      },
    });

    const pagesTotal          = allPages.length;
    const pagesPublished      = allPages.filter(p => p.status === 'published').length;
    const pagesDraft          = allPages.filter(p => p.status === 'draft').length;
    const pagesWithMetaDesc   = allPages.filter(p => p.metaDescription?.trim()).length;
    const pagesWithFocusKw    = allPages.filter(p => p.focusKeywords?.trim()).length;
    const pagesWithMetaTitle  = allPages.filter(p => p.metaTitle?.trim()).length;

    const pageGeoMap = new Map<string, number>();
    for (const p of allPages) {
      const scope = p.geoScope?.trim() || 'not set';
      pageGeoMap.set(scope, (pageGeoMap.get(scope) || 0) + 1);
    }
    const pageGeoBreakdown = Array.from(pageGeoMap.entries())
      .map(([scope, count]) => ({ scope, count }))
      .sort((a, b) => b.count - a.count);

    // ── NEWSLETTER ────────────────────────────────────────────────────────
    const allSubs = await prisma.newsletterSubscriber.findMany({
      select: { confirmed: true, createdAt: true },
    });

    const subsTotal     = allSubs.length;
    const subsConfirmed = allSubs.filter(s => s.confirmed).length;
    const subsPending   = subsTotal - subsConfirmed;

    // Growth per month — last 6 months
    const subsByMonth: { month: string; total: number; confirmed: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const { start, end } = monthBounds(d.getFullYear(), d.getMonth());
      const monthly = allSubs.filter(s => s.createdAt >= start && s.createdAt <= end);
      subsByMonth.push({
        month: monthLabel(d),
        total: monthly.length,
        confirmed: monthly.filter(s => s.confirmed).length,
      });
    }

    // ── MEDIA ─────────────────────────────────────────────────────────────
    const mediaCount = await prisma.media.count();

    // ── TAGS / CATEGORIES ─────────────────────────────────────────────────
    const categories = await prisma.postCategory.findMany({
      select: { name: true, _count: { select: { posts: true } } },
    });
    const tags = await prisma.postTag.findMany({
      select: { name: true, _count: { select: { posts: true } } },
      orderBy: { posts: { _count: 'desc' } },
      take: 12,
    });

    res.json({
      blog: {
        total: blogTotal,
        published: blogPublished,
        draft: blogDraft,
        scheduled: blogScheduled,
        featured: blogFeatured,
        withMetaDescription: blogWithMetaDesc,
        withMetaTitle: blogWithMetaTitle,
        withFocusKeywords: blogWithFocusKw,
        byCategory,
        byMonth,
        geoScopeBreakdown,
        schemaTypeBreakdown,
        hreflangBreakdown,
        avgReadTime,
      },
      pages: {
        total: pagesTotal,
        published: pagesPublished,
        draft: pagesDraft,
        withMetaDescription: pagesWithMetaDesc,
        withMetaTitle: pagesWithMetaTitle,
        withFocusKeywords: pagesWithFocusKw,
        geoBreakdown: pageGeoBreakdown,
      },
      newsletter: {
        total: subsTotal,
        confirmed: subsConfirmed,
        pending: subsPending,
        byMonth: subsByMonth,
      },
      media: {
        total: mediaCount,
      },
      content: {
        categories: categories.map(c => ({ name: c.name, count: c._count.posts })),
        topTags: tags.map(t => ({ name: t.name, count: t._count.posts })),
        totalTags: await prisma.postTag.count(),
      },
    });
  } catch (err) {
    console.error('[analytics/overview]', err);
    res.status(500).json({ error: 'Failed to load analytics' });
  }
});

export default router;
