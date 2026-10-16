import { Router } from 'express';
import multer from 'multer';
import { prisma } from '../database';
import { AuthRequest } from '../middleware/auth';
import { uploadImage, deleteImage } from '../services/cloudinaryService';
import {
  subscribeEmail,
  confirmSubscription,
  unsubscribeByToken,
  broadcastPost,
} from '../services/newsletterService';

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

const getPagination = (query: any) => {
  const page = parseInt(query.page as string) || 1;
  const limit = parseInt(query.limit as string) || 50;
  const skip = (page - 1) * limit;
  return { skip, take: limit, page, limit };
};

const slugify = (text: string): string =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

// Stable positive integer id for the frontend BlogPost shape when there's no legacyId.
const stableNumericId = (cuid: string): number => {
  let hash = 0;
  for (let i = 0; i < cuid.length; i++) {
    hash = (hash * 31 + cuid.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % 1_000_000 + 1000;
};

const formatDate = (date: Date): string =>
  date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

// Map a DB Post (with category + tags) to the public BlogPost shape the site consumes.
const mapPostToBlog = (post: any) => ({
  id: post.legacyId ?? stableNumericId(post.id),
  slug: post.slug,
  category: post.category?.slug || 'techniques',
  title: post.title,
  excerpt: post.excerpt || '',
  content: post.content,
  image: post.coverImage || '',
  readTime: post.readTime || '6 min read',
  date: formatDate(post.publishedAt || post.createdAt),
  featured: post.featured,
  tags: (post.tags || []).map((t: any) => t.name),
  topic: post.topic || '',
  seriesId: post.seriesId || undefined,
  seriesOrder: post.seriesOrder ?? undefined,
  updatedAt: formatDate(post.updatedAt || post.createdAt),
  canonicalSlug: post.canonicalSlug || post.slug,
  ctaType: post.ctaType || undefined,
  // SEO & Geo — consumed by the live page <head> (meta tags, JSON-LD, hreflang)
  metaTitle: post.metaTitle || undefined,
  metaDescription: post.metaDescription || undefined,
  focusKeywords: post.focusKeywords || undefined,
  geoScope: post.geoScope || undefined,
  geoRegions: post.geoRegions || undefined,
  hreflang: post.hreflang || undefined,
  schemaType: post.schemaType || undefined,
  schemaMarkup: post.schemaMarkup || undefined,
});

// ─────────────────────────────────────────────────────────────
// Auto-derive excerpt and reading time (WordPress/Ghost pattern)
// ─────────────────────────────────────────────────────────────

function autoExcerpt(content: string, maxLen = 160): string {
  return content
    .replace(/!\[.*?\]\(.*?\)/g, '')   // strip images
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // strip link syntax
    .replace(/#{1,6}\s+/g, '')
    .replace(/[*_`~>|]/g, '')
    .replace(/\n+/g, ' ')
    .trim()
    .slice(0, maxLen)
    .trimEnd()
    .replace(/[,;:\-]$/, '');
}

function autoReadTime(content: string): string {
  const words = content.trim().split(/\s+/).length;
  const minutes = Math.max(1, Math.ceil(words / 265));
  return `${minutes} min read`;
}

// Fire-and-forget IndexNow ping when posts go live or published content changes.
// Mirrors RankMath's built-in IndexNow behavior: notify search engines on
// publish and on updates to published posts, without blocking the response.
const pingPostUrls = (slugs: string[]) => {
  if (!slugs.length) return;
  const urls = [...slugs.map((s) => `/blog/${s}`), '/blog'];
  import('../utils/indexNow')
    .then(({ pingIndexNow }) => pingIndexNow(urls))
    .catch((err) => console.warn('[CMS] IndexNow ping skipped:', err?.message || err));
};

/**
 * Publish scheduled posts whose publish time has arrived.
 * Called every minute from the index.ts background interval — without this,
 * the "scheduled" status in the editor would never actually go live.
 */
export const publishScheduledPosts = async () => {
  const due = await prisma.post.findMany({
    where: { status: 'scheduled', publishedAt: { not: null, lte: new Date() } },
    select: { id: true, slug: true, title: true, excerpt: true, coverImage: true, readTime: true, content: true },
  });
  if (due.length === 0) return;
  await prisma.post.updateMany({
    where: { id: { in: due.map((p) => p.id) } },
    data: { status: 'published' },
  });
  pingPostUrls(due.map((p) => p.slug));
  // Send newsletter for each newly published post
  for (const post of due) {
    broadcastPost({
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt || autoExcerpt(post.content),
      image: post.coverImage,
      readTime: post.readTime || autoReadTime(post.content),
    }).catch((err) => console.error('[Newsletter] Broadcast error:', err?.message || err));
  }
  console.log(`[CMS] Auto-published ${due.length} scheduled post(s): ${due.map((p) => p.slug).join(', ')}`);
};

// Resolve an array of tag names into connect targets, creating missing tags.
const connectTags = async (tagNames: string[] = []) => {
  const tags = [];
  for (const name of tagNames) {
    const slug = slugify(name);
    if (!slug) continue;
    const tag = await prisma.postTag.upsert({
      where: { slug },
      update: {},
      create: { name, slug },
    });
    tags.push({ id: tag.id });
  }
  return tags;
};

const POST_INCLUDE = { category: true, tags: true, author: { select: { id: true, firstName: true, lastName: true } } };

// ═════════════════════════════════════════════════════════════
// ADMIN ROUTER  (mounted at /api/cms behind authenticate + requireStaff)
// ═════════════════════════════════════════════════════════════

const adminRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
});

// ---- Posts ----

adminRouter.get('/posts', async (req, res) => {
  const { skip, take, page, limit } = getPagination(req.query);
  const { status, categoryId, q } = req.query as any;

  const where: any = {};
  if (status) where.status = status;
  if (categoryId) where.categoryId = categoryId;
  if (q) {
    where.OR = [
      { title: { contains: q, mode: 'insensitive' } },
      { slug: { contains: q, mode: 'insensitive' } },
      { excerpt: { contains: q, mode: 'insensitive' } },
    ];
  }

  const [posts, total] = await Promise.all([
    prisma.post.findMany({ where, include: POST_INCLUDE, skip, take, orderBy: { createdAt: 'desc' } }),
    prisma.post.count({ where }),
  ]);

  return res.json({ posts, pagination: { total, page, limit, pages: Math.ceil(total / limit) } });
});

adminRouter.get('/posts/:id', async (req, res) => {
  const post = await prisma.post.findUnique({ where: { id: req.params.id }, include: POST_INCLUDE });
  if (!post) return res.status(404).json({ message: 'Post not found' });
  return res.json({ post });
});

adminRouter.post('/posts', async (req: AuthRequest, res) => {
  const b = req.body || {};
  if (!b.title) return res.status(400).json({ message: 'Title is required' });

  const slug = b.slug ? slugify(b.slug) : slugify(b.title);
  const existing = await prisma.post.findUnique({ where: { slug } });
  if (existing) return res.status(409).json({ message: `A post with slug "${slug}" already exists` });

  const tags = await connectTags(b.tags);
  const publishedAt = b.status === 'published' ? new Date() : b.publishedAt ? new Date(b.publishedAt) : null;
  const isPublishing = b.status === 'published';
  const content = b.content ?? '';
  const excerpt = b.excerpt || (isPublishing ? autoExcerpt(content) : null);
  const readTime = b.readTime || (isPublishing ? autoReadTime(content) : null);

  const post = await prisma.post.create({
    data: {
      slug,
      title: b.title,
      excerpt,
      content,
      coverImage: b.coverImage ?? null,
      status: b.status ?? 'draft',
      featured: Boolean(b.featured),
      readTime,
      ctaType: b.ctaType ?? null,
      topic: b.topic ?? null,
      seriesId: b.seriesId ?? null,
      seriesOrder: b.seriesOrder ?? null,
      canonicalSlug: b.canonicalSlug ?? slug,
      publishedAt,
      authorId: req.user?.id ?? null,
      categoryId: b.categoryId ?? null,
      tags: { connect: tags },
      // Derive metaTitle from title when publishing if the editor left it blank.
      metaTitle: b.metaTitle || (b.status === 'published' ? String(b.title).slice(0, 100) : null),
      metaDescription: b.metaDescription || null,
      focusKeywords: b.focusKeywords || null,
      geoScope: b.geoScope || 'global',
      geoRegions: b.geoRegions || null,
      hreflang: b.hreflang || 'en',
      schemaType: b.schemaType || 'BlogPosting',
      schemaMarkup: b.schemaMarkup || null,
    },
    include: POST_INCLUDE,
  });

  if (post.status === 'published') {
    pingPostUrls([post.slug]);
    broadcastPost({ slug: post.slug, title: post.title, excerpt: post.excerpt, image: post.coverImage, readTime: post.readTime })
      .catch((err) => console.error('[Newsletter] Broadcast error:', err?.message || err));
  }

  return res.status(201).json({ post });
});

adminRouter.patch('/posts/bulk', async (req, res) => {
  try {
    const { ids, data } = req.body || {};
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'ids array required' });
    }
    const updateData: any = {};
    if (data?.status !== undefined) {
      updateData.status = data.status;
      if (data.status === 'published') {
        updateData.publishedAt = new Date();
      }
    }
    if (data?.categoryId !== undefined) {
      updateData.categoryId = data.categoryId || null;
    }
    await prisma.post.updateMany({
      where: { id: { in: ids } },
      data: updateData,
    });
    if (updateData.status === 'published') {
      const published = await prisma.post.findMany({ where: { id: { in: ids } }, select: { slug: true } });
      pingPostUrls(published.map((p) => p.slug));
    }
    return res.json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
});

adminRouter.patch('/posts/:id', async (req, res) => {
  const b = req.body || {};
  const current = await prisma.post.findUnique({ where: { id: req.params.id } });
  if (!current) return res.status(404).json({ message: 'Post not found' });

  const data: any = {};
  if (b.title !== undefined) data.title = b.title;
  if (b.slug !== undefined) data.slug = slugify(b.slug);
  if (b.excerpt !== undefined) data.excerpt = b.excerpt;
  if (b.content !== undefined) data.content = b.content;
  if (b.coverImage !== undefined) data.coverImage = b.coverImage;
  if (b.featured !== undefined) data.featured = Boolean(b.featured);
  if (b.readTime !== undefined) data.readTime = b.readTime || null;
  if (b.ctaType !== undefined) data.ctaType = b.ctaType;
  if (b.topic !== undefined) data.topic = b.topic;
  if (b.seriesId !== undefined) data.seriesId = b.seriesId;
  if (b.seriesOrder !== undefined) data.seriesOrder = b.seriesOrder;
  if (b.canonicalSlug !== undefined) data.canonicalSlug = b.canonicalSlug;
  if (b.categoryId !== undefined) data.categoryId = b.categoryId || null;

  if (b.status !== undefined) {
    data.status = b.status;
    const isFirstPublish = b.status === 'published' && !current.publishedAt;
    // Stamp publishedAt the first time a post is published.
    if (isFirstPublish) data.publishedAt = new Date();
    // Auto-derive metaTitle from title when first publishing if neither DB nor payload has one.
    if (b.status === 'published' && !current.metaTitle && !b.metaTitle) {
      data.metaTitle = (b.title || current.title).slice(0, 100);
    }
    // Auto-fill excerpt and readTime on first publish if not already set.
    if (isFirstPublish) {
      const effectiveContent = b.content || current.content || '';
      if (!b.excerpt && !current.excerpt) data.excerpt = autoExcerpt(effectiveContent);
      if (!b.readTime && !current.readTime) data.readTime = autoReadTime(effectiveContent);
    }
  }
  if (b.publishedAt !== undefined) data.publishedAt = b.publishedAt ? new Date(b.publishedAt) : null;

  if (b.tags !== undefined) {
    const tags = await connectTags(b.tags);
    data.tags = { set: tags };
  }
  if (b.metaTitle !== undefined) data.metaTitle = b.metaTitle || null;
  if (b.metaDescription !== undefined) data.metaDescription = b.metaDescription || null;
  if (b.focusKeywords !== undefined) data.focusKeywords = b.focusKeywords || null;
  if (b.geoScope !== undefined) data.geoScope = b.geoScope || 'global';
  if (b.geoRegions !== undefined) data.geoRegions = b.geoRegions || null;
  if (b.hreflang !== undefined) data.hreflang = b.hreflang || 'en';
  if (b.schemaType !== undefined) data.schemaType = b.schemaType || 'BlogPosting';
  if (b.schemaMarkup !== undefined) data.schemaMarkup = b.schemaMarkup || null;

  try {
    const post = await prisma.post.update({ where: { id: req.params.id }, data, include: POST_INCLUDE });
    // Ping when a post transitions to published, or when a live post is edited
    // (content/SEO updates should reach search engines too).
    if (post.status === 'published') {
      pingPostUrls([post.slug]);
      // Send newsletter only on first publish (when we just stamped publishedAt).
      if (data.publishedAt) {
        broadcastPost({ slug: post.slug, title: post.title, excerpt: post.excerpt, image: post.coverImage, readTime: post.readTime })
          .catch((err) => console.error('[Newsletter] Broadcast error:', err?.message || err));
      }
    }
    return res.json({ post });
  } catch (err: any) {
    if (err?.code === 'P2002') return res.status(409).json({ message: 'Slug already in use' });
    throw err;
  }
});

adminRouter.delete('/posts/:id', async (req, res) => {
  await prisma.post.delete({ where: { id: req.params.id } });
  return res.json({ success: true });
});

adminRouter.post('/posts/bulk-delete', async (req, res) => {
  try {
    const { ids } = req.body || {};
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'ids array required' });
    }
    await prisma.post.deleteMany({
      where: { id: { in: ids } },
    });
    return res.json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
});


// ---- Categories ----

adminRouter.get('/categories', async (_req, res) => {
  const categories = await prisma.postCategory.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { posts: true } } },
  });
  return res.json({ categories });
});

adminRouter.post('/categories', async (req, res) => {
  const { name, description, parentId } = req.body || {};
  if (!name) return res.status(400).json({ message: 'Name is required' });
  const slug = slugify(name);
  try {
    const category = await prisma.postCategory.create({ data: { name, slug, description: description ?? null, parentId: parentId ?? null } });
    return res.status(201).json({ category });
  } catch (err: any) {
    if (err?.code === 'P2002') return res.status(409).json({ message: 'Category slug already exists' });
    throw err;
  }
});

adminRouter.patch('/categories/:id', async (req, res) => {
  const { name, description, parentId } = req.body || {};
  const data: any = {};
  if (name !== undefined) { data.name = name; data.slug = slugify(name); }
  if (description !== undefined) data.description = description;
  if (parentId !== undefined) data.parentId = parentId || null;
  const category = await prisma.postCategory.update({ where: { id: req.params.id }, data });
  return res.json({ category });
});

adminRouter.delete('/categories/:id', async (req, res) => {
  // Detach posts from this category, then delete it.
  await prisma.post.updateMany({ where: { categoryId: req.params.id }, data: { categoryId: null } });
  await prisma.postCategory.delete({ where: { id: req.params.id } });
  return res.json({ success: true });
});

// ---- Tags ----

adminRouter.get('/tags', async (_req, res) => {
  const tags = await prisma.postTag.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { posts: true } } },
  });
  return res.json({ tags });
});

adminRouter.post('/tags', async (req, res) => {
  const { name } = req.body || {};
  if (!name) return res.status(400).json({ message: 'Name is required' });
  const slug = slugify(name);
  try {
    const tag = await prisma.postTag.create({ data: { name, slug } });
    return res.status(201).json({ tag });
  } catch (err: any) {
    if (err?.code === 'P2002') return res.status(409).json({ message: 'Tag already exists' });
    throw err;
  }
});

adminRouter.delete('/tags/:id', async (req, res) => {
  await prisma.postTag.delete({ where: { id: req.params.id } });
  return res.json({ success: true });
});

// ---- Media Library ----

adminRouter.get('/media', async (req, res) => {
  const { skip, take, page, limit } = getPagination(req.query);
  const [media, total, allPages, allPosts, allSections] = await Promise.all([
    prisma.media.findMany({ skip, take, orderBy: { createdAt: 'desc' } }),
    prisma.media.count(),
    prisma.page.findMany({ select: { id: true, title: true, slug: true, content: true, coverImage: true, excerpt: true } }),
    prisma.post.findMany({ select: { id: true, title: true, slug: true, content: true, coverImage: true, excerpt: true } }),
    prisma.section.findMany({ select: { id: true, label: true, sectionId: true, content: true } }),
  ]);

  const mediaWithUsage = media.map((m) => {
    const usedIn: Array<{ type: 'page' | 'post' | 'section'; name: string; url: string }> = [];

    // Check Pages
    allPages.forEach((p) => {
      const isUsed = 
        (p.coverImage === m.url) ||
        (p.content && p.content.includes(m.url)) ||
        (p.excerpt && p.excerpt.includes(m.url));
      if (isUsed) {
        usedIn.push({ type: 'page', name: p.title, url: `/p/${p.slug}` });
      }
    });

    // Check Posts (Blog)
    allPosts.forEach((post) => {
      const isUsed = 
        (post.coverImage === m.url) ||
        (post.content && post.content.includes(m.url)) ||
        (post.excerpt && post.excerpt.includes(m.url));
      if (isUsed) {
        usedIn.push({ type: 'post', name: post.title, url: `/blog/${post.slug}` });
      }
    });

    // Check Sections
    allSections.forEach((sec) => {
      if (sec.content && sec.content.includes(m.url)) {
        usedIn.push({ type: 'section', name: sec.label, url: `/admin/style-guide` }); // style guide or layout
      }
    });

    return {
      ...m,
      usedIn,
    };
  });

  return res.json({ media: mediaWithUsage, pagination: { total, page, limit, pages: Math.ceil(total / limit) } });
});

adminRouter.post('/media', upload.single('file'), async (req: AuthRequest, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

  const result = await uploadImage(req.file.buffer, req.file.mimetype);
  if (!result.success || !result.publicId || !result.url) {
    return res.status(502).json({ message: result.error || 'Upload failed' });
  }

  const media = await prisma.media.create({
    data: {
      publicId: result.publicId,
      url: result.url,
      format: result.format ?? null,
      width: result.width ?? null,
      height: result.height ?? null,
      bytes: result.bytes ?? null,
      altText: (req.body?.altText as string) ?? null,
      caption: (req.body?.caption as string) ?? null,
      uploadedById: req.user?.id ?? null,
    },
  });

  return res.status(201).json({ media });
});

adminRouter.patch('/media/:id', async (req, res) => {
  const b = req.body || {};
  const current = await prisma.media.findUnique({ where: { id: req.params.id } });
  if (!current) return res.status(404).json({ message: 'Media not found' });

  const data: any = {};
  if (b.altText !== undefined) data.altText = b.altText;
  if (b.caption !== undefined) data.caption = b.caption;
  if (b.url !== undefined) data.url = b.url;
  if (b.publicId !== undefined) data.publicId = b.publicId;
  if (b.format !== undefined) data.format = b.format;
  if (b.width !== undefined) data.width = b.width ? parseInt(b.width, 10) : null;
  if (b.height !== undefined) data.height = b.height ? parseInt(b.height, 10) : null;
  if (b.bytes !== undefined) data.bytes = b.bytes ? parseInt(b.bytes, 10) : null;

  const oldUrl = current.url;
  const newUrl = b.url;

  try {
    const updatedMedia = await prisma.$transaction(async (tx) => {
      const media = await tx.media.update({ where: { id: req.params.id }, data });

      // If URL has changed, replace all references across pages, posts, and sections
      if (newUrl && oldUrl && newUrl !== oldUrl) {
        // 1. Pages
        const pages = await tx.page.findMany({
          where: {
            OR: [
              { coverImage: oldUrl },
              { content: { contains: oldUrl } },
              { excerpt: { contains: oldUrl } },
            ],
          },
        });

        for (const p of pages) {
          const updateData: any = {};
          if (p.coverImage === oldUrl) {
            updateData.coverImage = newUrl;
          }
          if (p.content && p.content.includes(oldUrl)) {
            updateData.content = p.content.split(oldUrl).join(newUrl);
          }
          if (p.excerpt && p.excerpt.includes(oldUrl)) {
            updateData.excerpt = p.excerpt.split(oldUrl).join(newUrl);
          }
          await tx.page.update({ where: { id: p.id }, data: updateData });
        }

        // 2. Posts
        const posts = await tx.post.findMany({
          where: {
            OR: [
              { coverImage: oldUrl },
              { content: { contains: oldUrl } },
              { excerpt: { contains: oldUrl } },
            ],
          },
        });

        for (const p of posts) {
          const updateData: any = {};
          if (p.coverImage === oldUrl) {
            updateData.coverImage = newUrl;
          }
          if (p.content && p.content.includes(oldUrl)) {
            updateData.content = p.content.split(oldUrl).join(newUrl);
          }
          if (p.excerpt && p.excerpt.includes(oldUrl)) {
            updateData.excerpt = p.excerpt.split(oldUrl).join(newUrl);
          }
          await tx.post.update({ where: { id: p.id }, data: updateData });
        }

        // 3. Sections
        const sections = await tx.section.findMany({
          where: {
            content: { contains: oldUrl },
          },
        });

        for (const s of sections) {
          await tx.section.update({
            where: { id: s.id },
            data: {
              content: s.content.split(oldUrl).join(newUrl),
            },
          });
        }
      }

      return media;
    });

    return res.json({ media: updatedMedia });
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Failed to update media' });
  }
});

adminRouter.delete('/media/:id', async (req, res) => {
  const media = await prisma.media.findUnique({ where: { id: req.params.id } });
  if (!media) return res.status(404).json({ message: 'Media not found' });
  await deleteImage(media.publicId); // best-effort remote delete
  await prisma.media.delete({ where: { id: req.params.id } });
  return res.json({ success: true });
});

// ---- Pages (static content) ----

adminRouter.get('/pages', async (req, res) => {
  const { skip, take, page, limit } = getPagination(req.query);
  const [pages, total] = await Promise.all([
    prisma.page.findMany({ skip, take, orderBy: { updatedAt: 'desc' } }),
    prisma.page.count(),
  ]);
  return res.json({ pages, pagination: { total, page, limit, pages: Math.ceil(total / limit) } });
});

adminRouter.get('/pages/:id', async (req, res) => {
  const page = await prisma.page.findUnique({ where: { id: req.params.id } });
  if (!page) return res.status(404).json({ message: 'Page not found' });
  return res.json({ page });
});

adminRouter.post('/pages', async (req: AuthRequest, res) => {
  const b = req.body || {};
  if (!b.title) return res.status(400).json({ message: 'Title is required' });
  const slug = b.slug ? slugify(b.slug) : slugify(b.title);
  const existing = await prisma.page.findUnique({ where: { slug } });
  if (existing) return res.status(409).json({ message: `A page with slug "${slug}" already exists` });

  const page = await prisma.page.create({
    data: {
      slug,
      title: b.title,
      excerpt: b.excerpt ?? null,
      content: b.content ?? '',
      coverImage: b.coverImage ?? null,
      status: b.status ?? 'draft',
      metaTitle: b.metaTitle ?? null,
      metaDescription: b.metaDescription ?? null,
      schemaType: b.schemaType ?? null,
      schemaMarkup: b.schemaMarkup ?? null,
      geoScope: b.geoScope ?? null,
      geoRegions: b.geoRegions ?? null,
      focusKeywords: b.focusKeywords ?? null,
      hreflang: b.hreflang ?? null,
      publishedAt: b.status === 'published' ? new Date() : null,
      authorId: req.user?.id ?? null,
    },
  });
  return res.status(201).json({ page });
});

adminRouter.patch('/pages/bulk', async (req, res) => {
  try {
    const { ids, data } = req.body || {};
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'ids array required' });
    }
    const updateData: any = {};
    if (data?.status !== undefined) {
      updateData.status = data.status;
      if (data.status === 'published') {
        updateData.publishedAt = new Date();
      }
    }
    await prisma.page.updateMany({
      where: { id: { in: ids } },
      data: updateData,
    });
    return res.json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
});

adminRouter.patch('/pages/:id', async (req, res) => {
  const b = req.body || {};
  const current = await prisma.page.findUnique({ where: { id: req.params.id } });
  if (!current) return res.status(404).json({ message: 'Page not found' });

  const data: any = {};
  if (b.title !== undefined) data.title = b.title;
  if (b.slug !== undefined) data.slug = slugify(b.slug);
  if (b.excerpt !== undefined) data.excerpt = b.excerpt;
  if (b.content !== undefined) data.content = b.content;
  if (b.coverImage !== undefined) data.coverImage = b.coverImage;
  if (b.metaTitle !== undefined) data.metaTitle = b.metaTitle;
  if (b.metaDescription !== undefined) data.metaDescription = b.metaDescription;
  if (b.schemaType !== undefined) data.schemaType = b.schemaType;
  if (b.schemaMarkup !== undefined) data.schemaMarkup = b.schemaMarkup;
  if (b.geoScope !== undefined) data.geoScope = b.geoScope;
  if (b.geoRegions !== undefined) data.geoRegions = b.geoRegions;
  if (b.focusKeywords !== undefined) data.focusKeywords = b.focusKeywords;
  if (b.hreflang !== undefined) data.hreflang = b.hreflang;
  if (b.status !== undefined) {
    data.status = b.status;
    if (b.status === 'published' && !current.publishedAt) data.publishedAt = new Date();
  }

  try {
    const page = await prisma.page.update({ where: { id: req.params.id }, data });
    return res.json({ page });
  } catch (err: any) {
    if (err?.code === 'P2002') return res.status(409).json({ message: 'Slug already in use' });
    throw err;
  }
});

adminRouter.delete('/pages/:id', async (req, res) => {
  await prisma.page.delete({ where: { id: req.params.id } });
  return res.json({ success: true });
});

adminRouter.post('/pages/bulk-delete', async (req, res) => {
  try {
    const { ids } = req.body || {};
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'ids array required' });
    }
    await prisma.page.deleteMany({
      where: { id: { in: ids } },
    });
    return res.json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
});


// ---- Settings (permalinks, etc.) ----

adminRouter.get('/settings', async (_req, res) => {
  const rows = await prisma.siteSetting.findMany();
  const settings: Record<string, string> = {};
  rows.forEach((r) => { settings[r.key] = r.value; });
  return res.json({ settings });
});

adminRouter.put('/settings', async (req, res) => {
  const entries = Object.entries(req.body || {}) as [string, string][];
  for (const [key, value] of entries) {
    await prisma.siteSetting.upsert({
      where: { key },
      update: { value: String(value) },
      create: { key, value: String(value) },
    });
  }
  const rows = await prisma.siteSetting.findMany();
  const settings: Record<string, string> = {};
  rows.forEach((r) => { settings[r.key] = r.value; });
  return res.json({ settings });
});

// ═════════════════════════════════════════════════════════════
// PUBLIC ROUTER  (mounted at /api/blog, no auth) — feeds the site
// ═════════════════════════════════════════════════════════════

const publicRouter = Router();

publicRouter.get('/posts', async (_req, res) => {
  const posts = await prisma.post.findMany({
    where: { status: 'published' },
    include: POST_INCLUDE,
    orderBy: { publishedAt: 'desc' },
  });
  return res.json({ posts: posts.map(mapPostToBlog) });
});

publicRouter.get('/posts/:slug', async (req, res) => {
  const post = await prisma.post.findFirst({
    where: { slug: req.params.slug, status: { in: ['published', 'archived'] } },
    include: POST_INCLUDE,
  });
  if (!post) return res.status(404).json({ message: 'Post not found' });
  return res.json({ post: mapPostToBlog(post) });
});

// ─── RSS Feed ─────────────────────────────────────────────────────────────────

publicRouter.get('/rss', async (_req, res) => {
  const posts = await prisma.post.findMany({
    where: { status: 'published' },
    include: { tags: true },
    orderBy: { publishedAt: 'desc' },
    take: 30,
  });

  const BASE = process.env.BASE_URL || 'https://reframevisuals.com';

  const escXml = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const items = posts.map((p) => {
    const link = `${BASE}/blog/${p.slug}`;
    const pubDate = new Date(p.publishedAt || p.createdAt).toUTCString();
    const description = escXml(p.excerpt || p.metaDescription || '');
    const cats = p.tags.map((t) => `<category>${escXml(t.name)}</category>`).join('');
    return `<item>
      <title>${escXml(p.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${description}</description>
      ${p.coverImage ? `<enclosure url="${escXml(p.coverImage)}" type="image/jpeg"/>` : ''}
      ${cats}
    </item>`;
  }).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:atom="http://www.w3.org/2005/Atom"
  xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>Reframe Visuals Blog</title>
    <link>${BASE}/blog</link>
    <description>Product photo editing insights for e-commerce brands</description>
    <language>en</language>
    <atom:link href="${BASE}/api/blog/rss" rel="self" type="application/rss+xml"/>
    <image>
      <url>${BASE}/logo.svg</url>
      <title>Reframe Visuals Blog</title>
      <link>${BASE}/blog</link>
    </image>
    ${items}
  </channel>
</rss>`;

  res.set('Content-Type', 'application/rss+xml; charset=utf-8');
  res.set('Cache-Control', 'public, max-age=900'); // 15-min CDN cache
  res.send(xml);
});

// ─── Newsletter subscribe ─────────────────────────────────────────────────────

publicRouter.post('/subscribe', async (req, res) => {
  const { email } = req.body || {};
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ message: 'A valid email address is required.' });
  }
  try {
    const result = await subscribeEmail(email.toLowerCase().trim());
    if (result === 'confirmed') {
      return res.json({ status: 'already_subscribed', message: 'You are already subscribed.' });
    }
    return res.json({ status: 'pending', message: 'Check your inbox to confirm your subscription.' });
  } catch (err) {
    console.error('[Subscribe]', err);
    return res.status(500).json({ message: 'Subscription failed. Please try again.' });
  }
});

// ─── Newsletter confirm ───────────────────────────────────────────────────────

publicRouter.get('/confirm', async (req, res) => {
  const token = String(req.query.token || '');
  if (!token) return res.redirect('/blog?sub=invalid');
  const ok = await confirmSubscription(token).catch(() => false);
  res.redirect(ok ? '/blog?sub=confirmed' : '/blog?sub=invalid');
});

// ─── Newsletter unsubscribe ───────────────────────────────────────────────────

publicRouter.get('/unsubscribe', async (req, res) => {
  const token = String(req.query.token || '');
  if (!token) return res.redirect('/blog?sub=unsubscribed');
  await unsubscribeByToken(token).catch(() => null);
  res.redirect('/blog?sub=unsubscribed');
});

// ─── Related posts ────────────────────────────────────────────────────────────

publicRouter.get('/posts/:slug/related', async (req, res) => {
  const post = await prisma.post.findFirst({
    where: { slug: req.params.slug, status: 'published' },
    include: { tags: true },
  });
  if (!post) return res.json({ posts: [] });

  const tagIds = post.tags.map((t) => t.id);

  const related = await prisma.post.findMany({
    where: {
      status: 'published',
      slug: { not: post.slug },
      OR: [
        ...(tagIds.length ? [{ tags: { some: { id: { in: tagIds } } } }] : []),
        ...(post.topic ? [{ topic: post.topic }] : []),
      ],
    },
    include: POST_INCLUDE,
    orderBy: { publishedAt: 'desc' },
    take: 4,
  });

  return res.json({ posts: related.map(mapPostToBlog) });
});

// Public static pages
publicRouter.get('/pages/:slug', async (req, res) => {
  const page = await prisma.page.findFirst({ where: { slug: req.params.slug, status: 'published' } });
  if (!page) return res.status(404).json({ message: 'Page not found' });
  return res.json({ page });
});

// Public site settings (e.g. permalink structure)
publicRouter.get('/settings', async (_req, res) => {
  const rows = await prisma.siteSetting.findMany();
  const settings: Record<string, string> = {};
  rows.forEach((r) => { settings[r.key] = r.value; });
  return res.json({ settings });
});

export { adminRouter as cmsAdminRouter, publicRouter as cmsPublicRouter };
