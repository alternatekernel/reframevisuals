import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import {
  FileText, Plus, RefreshCw, Search, Star, Tag, FolderTree, Trash2, X,
  ExternalLink, Image as ImageIcon, Link2, Code, Bold, Italic, Eye, Settings,
  ChevronRight, Copy, Check, ArrowLeft, Loader2, TrendingUp, Sparkles, AlertTriangle, CheckCircle2,
  Undo, Redo, Strikethrough, ListOrdered, List, Underline as UnderlineIcon, ScanSearch, Globe, Download
} from 'lucide-react';
import { adminFetch, API_BASE_URL } from '../utils/api';
import { useAuthProfile } from '../hooks/useAdminData';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import UnderlineExtension from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import TurndownService from 'turndown';
import { marked } from 'marked';
import { computeGeoScore, geoScoreColor } from '../../utils/geoScorer';
import { computeStopSlopScore } from '../../utils/stopSlopScorer';
import { computeHumanizeScore } from '../../utils/humanizeTextAnalyzer';

const turndownService = new TurndownService({
  headingStyle: 'atx',
  hr: '---',
  codeBlockStyle: 'fenced'
});

// Keep <u> tag for underline formatting
turndownService.addRule('underline', {
  filter: ['u'],
  replacement: (content) => `<u>${content}</u>`
});

// ── Types ─────────────────────────────────────────────────────────────────────

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  _count?: { posts: number };
}

interface TagItem {
  id: string;
  name: string;
  slug: string;
  _count?: { posts: number };
}

interface LiveAuditResult {
  ok: boolean;
  url?: string;
  auditedAt?: string;
  title?: string | null;
  h1Count?: number;
  h1Text?: string | null;
  h2Count?: number;
  canonical?: string | null;
  ogImage?: string | null;
  totalImages?: number;
  imgsWithoutAlt?: number;
  isNoIndex?: boolean;
  issues: string[];
  good: string[];
  error?: string;
}

interface MediaAsset {
  id: string;
  url: string;
  publicId: string;
  altText?: string | null;
  caption?: string | null;
  format?: string | null;
  width?: number | null;
  height?: number | null;
  bytes?: number | null;
}

interface Post {
  id: string;
  slug: string;
  title: string;
  excerpt?: string | null;
  content: string;
  coverImage?: string | null;
  status: string;
  featured: boolean;
  readTime?: string | null;
  ctaType?: string | null;
  topic?: string | null;
  categoryId?: string | null;
  category?: Category | null;
  tags?: TagItem[];
  publishedAt?: string | null;
  updatedAt?: string;
  // SEO & Geo
  metaTitle?: string | null;
  metaDescription?: string | null;
  focusKeywords?: string | null;
  geoScope?: string | null;
  geoRegions?: string | null;
  hreflang?: string | null;
  schemaType?: string | null;
  schemaMarkup?: string | null;
}

type Tab = 'posts' | 'categories' | 'tags';
type PreviewMode = 'write' | 'split' | 'preview';

const badgeForStatus = (status: string) => {
  if (status === 'published') return 'an-badge-green';
  if (status === 'scheduled') return 'an-badge-blue';
  if (status === 'archived') return 'an-badge-orange text-orange-700 bg-orange-50 border-orange-200';
  return 'an-badge-gray';
};

const emptyDraft = (): Partial<Post> & { tagsText?: string } => ({
  title: '', slug: '', excerpt: '', content: '', coverImage: '', status: 'draft',
  featured: false, readTime: '', ctaType: '', categoryId: '', tagsText: '',
  metaTitle: '', metaDescription: '', focusKeywords: '',
  geoScope: 'global', geoRegions: '', hreflang: 'en', schemaType: 'BlogPosting', schemaMarkup: '',
});

// ── SEO Score ────────────────────────────────────────────────────────────────

interface SeoScore {
  score: number;
  label: string;
  color: string;
  issues: string[];
  good: string[];
}

function computeSeo(post: Partial<Post> & { tagsText?: string }): SeoScore {
  const issues: string[] = [];
  const good: string[] = [];
  let score = 0;

  const title = post.title || '';
  const metaTitle = post.metaTitle || '';
  const metaDesc = post.metaDescription || '';
  const content = post.content || '';
  const slug = post.slug || '';
  const keywords = (post.focusKeywords || '').split(',').map((k) => k.trim().toLowerCase()).filter(Boolean);
  const primaryKw = keywords[0] || '';

  // Meta title: 25pts present, +5pts optimal length, +8pts keyword
  if (metaTitle) {
    score += 25;
    good.push('Meta title set');
    if (metaTitle.length >= 40 && metaTitle.length <= 65) { score += 5; good.push('Meta title optimal length'); }
    else issues.push('Meta title: aim for 40–65 characters');
    if (primaryKw && metaTitle.toLowerCase().includes(primaryKw)) { score += 8; good.push('Focus keyword in meta title'); }
    else if (primaryKw) issues.push('Focus keyword missing from meta title');
  } else {
    issues.push('No meta title set');
  }

  // Meta description: 20pts present, +5pts optimal length, +5pts keyword
  if (metaDesc) {
    score += 20;
    good.push('Meta description set');
    if (metaDesc.length >= 120 && metaDesc.length <= 160) { score += 5; good.push('Meta description optimal length'); }
    else issues.push('Meta description: aim for 120–160 characters');
    if (primaryKw && metaDesc.toLowerCase().includes(primaryKw)) { score += 5; good.push('Focus keyword in meta description'); }
    else if (primaryKw) issues.push('Focus keyword missing from meta description');
  } else {
    issues.push('No meta description set');
  }

  // Content length
  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  if (wordCount >= 300) { score += 15; good.push(`Content length good (${wordCount} words)`); }
  else if (wordCount >= 50) { score += 8; issues.push('Content is short — aim for 300+ words'); }
  else { issues.push('Content too short for SEO (under 50 words)'); }

  // H1 (markdown # or html)
  const hasH1 = /^#\s/m.test(content) || /<h1[\s>]/i.test(content);
  if (hasH1) { score += 7; good.push('H1 heading found in content'); }
  else issues.push('No H1 heading in content — use # at the top');

  // Focus keyword in content
  if (primaryKw && content.toLowerCase().includes(primaryKw)) { score += 3; good.push('Focus keyword appears in content'); }
  else if (primaryKw) issues.push('Focus keyword not found in content body');

  // Schema type
  if (post.schemaType) { score += 5; good.push(`Schema type set (${post.schemaType})`); }
  else issues.push('No schema type selected');

  // Cover image
  if (!post.coverImage) issues.push('No cover image — important for social sharing');

  // Keyword in slug
  if (primaryKw && slug && !slug.includes(primaryKw.replace(/\s+/g, '-'))) {
    issues.push('Focus keyword not in URL slug');
  }

  // Geo
  if (!post.geoScope || post.geoScope === 'none') issues.push('Geo scope not set');

  // hreflang
  if (!post.hreflang) issues.push('hreflang locale not set');

  // Subheadings
  const h2Count = (content.match(/^##\s/gm) || []).length;
  if (h2Count < 2) issues.push('Add at least 2 subheadings (##) to aid readability');

  score = Math.min(100, score);

  let label: string;
  let color: string;
  if (score >= 80) { label = 'Good'; color = 'text-emerald-600 bg-emerald-50 border-emerald-200'; }
  else if (score >= 50) { label = 'OK'; color = 'text-amber-600 bg-amber-50 border-amber-200'; }
  else { label = 'Needs Work'; color = 'text-red-600 bg-red-50 border-red-200'; }

  return { score, label, color, issues, good };
}

// ── Markdown Parser (marked, MIT) ────────────────────────────────────────────
// Replaces the old regex parser, which could not round-trip lists,
// strikethrough, or underline back into the Tiptap editor.

marked.setOptions({ gfm: true, breaks: true });

function parseMarkdown(md: string): string {
  if (!md) return '';
  return marked.parse(md, { async: false }) as string;
}

// ═════════════════════════════════════════════════════════════════════════════
// Main Component
// ═════════════════════════════════════════════════════════════════════════════

export const BlogPostsPage: React.FC = () => {
  const { data: profile } = useAuthProfile();
  const [tab, setTab] = useState<Tab>('posts');
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<TagItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft' | 'archived'>('all');
  const [error, setError] = useState<string | null>(null);

  // Editor states
  const [editor, setEditor] = useState<(Partial<Post> & { tagsText?: string }) | null>(null);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState<PreviewMode>('split');
  const [showSidebar, setShowSidebar] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedGeo, setExpandedGeo] = useState<string | null>(null);
  const [liveGeoResults, setLiveGeoResults] = useState<Map<string, any>>(new Map());
  const [geoAuditingIds, setGeoAuditingIds] = useState<Set<string>>(new Set());
  const [expandedStopSlop, setExpandedStopSlop] = useState<string | null>(null);
  const [expandedHuman, setExpandedHuman] = useState<string | null>(null);

  // Media selector modal states
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [mediaModalTarget, setMediaModalTarget] = useState<'cover' | 'content' | null>(null);

  // Categories / Tags addition states
  const [newCategory, setNewCategory] = useState('');
  const [newTag, setNewTag] = useState('');
  const [inlineCategory, setInlineCategory] = useState('');
  const [showAddCategoryInline, setShowAddCategoryInline] = useState(false);

  // Auto-save notification
  const [hasAutosave, setHasAutosave] = useState(false);

  // Dashboard selections
  const [selectedPostIds, setSelectedPostIds] = useState<Set<string>>(new Set());

  const [activePostId, setActivePostId] = useState<string | null>(null);

  // Live audit state
  const [auditResults, setAuditResults] = useState<Map<string, LiveAuditResult>>(new Map());
  const [auditingIds, setAuditingIds] = useState<Set<string>>(new Set());
  const [auditProgress, setAuditProgress] = useState<{ done: number; total: number } | null>(null);
  const [expandedSeo, setExpandedSeo] = useState<string | null>(null);
  const autoAuditTriggered = useRef(false);

  // Initialize TipTap Editor
  const tiptapEditor = useEditor({
    extensions: [
      StarterKit,
      UnderlineExtension,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'preview-link'
        }
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'preview-img'
        }
      })
    ],
    content: '',
    onUpdate: ({ editor: editInst }) => {
      const html = editInst.getHTML();
      const markdown = turndownService.turndown(html);
      setEditor((prev) => prev ? { ...prev, content: markdown } : null);
    }
  });

  // Sync state into TipTap Editor
  useEffect(() => {
    if (!editor || !tiptapEditor) return;
    
    const currentId = editor.id || 'new-post';
    
    if (currentId !== activePostId) {
      setActivePostId(currentId);
      const htmlContent = parseMarkdown(editor.content || '');
      tiptapEditor.commands.setContent(htmlContent);
      return;
    }

    if (!tiptapEditor.isFocused) {
      const currentMarkdown = turndownService.turndown(tiptapEditor.getHTML());
      if (currentMarkdown !== (editor.content || '')) {
        const htmlContent = parseMarkdown(editor.content || '');
        tiptapEditor.commands.setContent(htmlContent);
      }
    }
  }, [editor, tiptapEditor, activePostId]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [p, c, t] = await Promise.all([
        adminFetch<{ posts: Post[] }>('/cms/posts?limit=200'),
        adminFetch<{ categories: Category[] }>('/cms/categories'),
        adminFetch<{ tags: TagItem[] }>('/cms/tags'),
      ]);
      setPosts(p.posts || []);
      setCategories(c.categories || []);
      setTags(t.tags || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load content');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── Live SEO Audit ────────────────────────────────────────────────────────
  const runAudit = useCallback(async (post: Post, silent = false) => {
    if (!post.slug) return;
    setAuditingIds((prev) => {
      if (prev.has(post.id)) return prev;
      return new Set(prev).add(post.id);
    });
    if (!silent) setExpandedSeo(post.id);
    try {
      const result = await adminFetch<LiveAuditResult>(`/seo/audit?path=${encodeURIComponent('/blog/' + post.slug)}`);
      setAuditResults((prev) => new Map(prev).set(post.id, result));
    } catch (err) {
      setAuditResults((prev) =>
        new Map(prev).set(post.id, { ok: false, issues: [err instanceof Error ? err.message : 'Audit failed'], good: [] })
      );
    } finally {
      setAuditingIds((prev) => { const s = new Set(prev); s.delete(post.id); return s; });
    }
  }, []);

  const runAllAudits = useCallback(async (postsToAudit: Post[]) => {
    const published = postsToAudit.filter((p) => p.status === 'published');
    if (published.length === 0) return;
    const queue = [...published];
    let done = 0;
    setAuditProgress({ done: 0, total: published.length });
    const worker = async () => {
      while (queue.length > 0) {
        const post = queue.shift();
        if (!post) break;
        await runAudit(post, true);
        done += 1;
        setAuditProgress((prev) => prev ? { ...prev, done } : null);
      }
    };
    await Promise.all([worker(), worker(), worker()]);
    setAuditProgress(null);
  }, [runAudit]);

  // Auto-trigger audit for all published posts on first load
  useEffect(() => {
    if (!loading && posts.length > 0 && !autoAuditTriggered.current) {
      autoAuditTriggered.current = true;
      runAllAudits(posts);
    }
  }, [loading, posts, runAllAudits]);

  // Handle local auto-save caching
  useEffect(() => {
    if (editor && editor.title) {
      localStorage.setItem(`reframe_blog_draft_${editor.id || 'new'}`, JSON.stringify(editor));
    }
  }, [editor]);

  // Check auto-save on load
  const checkAutosave = (post: Partial<Post> | null) => {
    if (!post) return;
    const cacheKey = `reframe_blog_draft_${post.id || 'new'}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      // If cached content or title is different, offer restore
      if (parsed.content !== post.content || parsed.title !== post.title) {
        setHasAutosave(true);
      }
    }
  };

  const restoreAutosave = () => {
    if (!editor) return;
    const cacheKey = `reframe_blog_draft_${editor.id || 'new'}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      setEditor(parsed);
      setHasAutosave(false);
    }
  };

  const dismissAutosave = () => {
    if (!editor) return;
    localStorage.removeItem(`reframe_blog_draft_${editor.id || 'new'}`);
    setHasAutosave(false);
  };

  const filteredPosts = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return posts.filter((post) => {
      if (statusFilter !== 'all' && post.status !== statusFilter) return false;
      if (!needle) return true;
      return [post.title, post.slug, post.excerpt, post.category?.name]
        .some((v) => String(v || '').toLowerCase().includes(needle));
    });
  }, [posts, query, statusFilter]);

  const counts = useMemo(() => ({
    all: posts.length,
    published: posts.filter((p) => p.status === 'published').length,
    draft: posts.filter((p) => p.status === 'draft').length,
    archived: posts.filter((p) => p.status === 'archived').length,
  }), [posts]);

  // ---- Post actions ----
  const openNew = () => {
    const draft = emptyDraft();
    setEditor(draft);
    setHasAutosave(false);
    checkAutosave(draft);
  };

  const openEdit = (post: Post) => {
    const editState = {
      ...post,
      categoryId: post.categoryId || '',
      tagsText: (post.tags || []).map((t) => t.name).join(', '),
      metaTitle: post.metaTitle || '',
      metaDescription: post.metaDescription || '',
      focusKeywords: post.focusKeywords || '',
      geoScope: post.geoScope || 'global',
      geoRegions: post.geoRegions || '',
      hreflang: post.hreflang || 'en',
      schemaType: post.schemaType || 'BlogPosting',
      schemaMarkup: post.schemaMarkup || '',
    };
    setEditor(editState);
    setHasAutosave(false);
    checkAutosave(editState);
  };

  const savePost = async () => {
    if (!editor || !editor.title) { setError('Title is required'); return; }
    if (editor.status === 'scheduled' && !editor.publishedAt) {
      setError('Pick a "Go live at" date — a scheduled post without one will never publish.');
      return;
    }
    if (
      (editor.status === 'published' || editor.status === 'scheduled') &&
      !editor.metaDescription?.trim()
    ) {
      const ok = window.confirm(
        'No meta description is set.\n\nWithout one, search engines will pick random text from the post — hurting click-through rates.\n\nPublish anyway?'
      );
      if (!ok) return;
    }
    setSaving(true);
    setError(null);
    const payload: any = {
      title: editor.title,
      slug: editor.slug || undefined,
      excerpt: editor.excerpt,
      content: editor.content,
      coverImage: editor.coverImage,
      status: editor.status,
      featured: editor.featured,
      readTime: editor.readTime,
      ctaType: editor.ctaType || null,
      categoryId: editor.categoryId || null,
      tags: (editor.tagsText || '').split(',').map((s) => s.trim()).filter(Boolean),
      publishedAt: editor.status === 'scheduled' && editor.publishedAt
        ? new Date(editor.publishedAt).toISOString()
        : undefined,
      metaTitle: editor.metaTitle || null,
      metaDescription: editor.metaDescription || null,
      focusKeywords: editor.focusKeywords || null,
      geoScope: editor.geoScope || null,
      geoRegions: editor.geoRegions || null,
      hreflang: editor.hreflang || null,
      schemaType: editor.schemaType || null,
      schemaMarkup: editor.schemaMarkup || null,
    };
    try {
      if (editor.id) {
        await adminFetch(`/cms/posts/${editor.id}`, { method: 'PATCH', body: JSON.stringify(payload) });
        localStorage.removeItem(`reframe_blog_draft_${editor.id}`);
      } else {
        await adminFetch('/cms/posts', { method: 'POST', body: JSON.stringify(payload) });
        localStorage.removeItem('reframe_blog_draft_new');
      }
      setEditor(null);
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save post');
    } finally {
      setSaving(false);
    }
  };

  const deletePost = async (id: string) => {
    if (!confirm('Delete this post permanently?')) return;
    try {
      await adminFetch(`/cms/posts/${id}`, { method: 'DELETE' });
      localStorage.removeItem(`reframe_blog_draft_${id}`);
      setEditor(null);
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete post');
    }
  };

  // ---- Bulk actions ----
  const handleBulkStatus = async (status: 'published' | 'draft' | 'archived') => {
    if (selectedPostIds.size === 0) return;
    setSaving(true);
    setError(null);
    try {
      await adminFetch('/cms/posts/bulk', {
        method: 'PATCH',
        body: JSON.stringify({
          ids: Array.from(selectedPostIds),
          data: { status },
        }),
      });
      setSelectedPostIds(new Set());
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update posts');
    } finally {
      setSaving(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedPostIds.size === 0) return;
    if (!confirm(`Are you sure you want to permanently delete these ${selectedPostIds.size} posts?`)) return;
    setSaving(true);
    setError(null);
    try {
      await adminFetch('/cms/posts/bulk-delete', {
        method: 'POST',
        body: JSON.stringify({
          ids: Array.from(selectedPostIds),
        }),
      });
      setSelectedPostIds(new Set());
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete posts');
    } finally {
      setSaving(false);
    }
  };

  const toggleSelectPost = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedPostIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAllPosts = () => {
    const visibleIds = filteredPosts.map((p) => p.id);
    const isAllSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedPostIds.has(id));
    if (isAllSelected) {
      setSelectedPostIds((prev) => {
        const next = new Set(prev);
        visibleIds.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      setSelectedPostIds((prev) => {
        const next = new Set(prev);
        visibleIds.forEach((id) => next.add(id));
        return next;
      });
    }
  };

  // ---- Export SEO/GEO issues CSV ----
  const exportSeoReport = (scope: 'selected' | 'all') => {
    const pool = scope === 'selected' && selectedPostIds.size > 0
      ? posts.filter((p) => selectedPostIds.has(p.id))
      : posts;

    const escape = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const headers = [
      'Title',
      'Slug',
      'Status',
      'SEO Score',
      'SEO Label',
      'SEO Issues',
      'SEO Good Signals',
      'Live Audit Issues',
      'Live Audit Good Signals',
      'Focus Keywords',
      'Meta Title',
      'Meta Description',
      'GEO Scope',
      'GEO Regions',
      'Schema',
      'hreflang',
      'Word Count',
      'GEO Score',
      'GEO Grade',
      'AI Citability Score',
      'Brand Authority Score',
      'Content EEAT Score',
      'Technical GEO Score',
      'Schema Structured Data Score',
      'Platform Optimization Score',
      'Google AIO Score',
      'ChatGPT Score',
      'Perplexity Score',
      'Gemini Score',
      'Bing Copilot Score',
      'GEO Recommendations',
      'Live GEO Warnings'
    ];

    const rows = pool.map((p) => {
      const seo = computeSeo(p);
      const liveAudit = auditResults.get(p.id);
      const liveGeo = liveGeoResults.get(p.id);

      const geo = computeGeoScore({
        content: p.content,
        schemaType: p.schemaType,
        focusKeywords: p.focusKeywords,
        metaTitle: p.metaTitle,
        metaDescription: p.metaDescription,
        hreflang: p.hreflang,
        hasImage: !!p.coverImage,
        ...(liveGeo ? liveGeo : {}),
      });

      return [
        escape(p.title),
        escape(p.slug),
        escape(p.status),
        escape(seo.score),
        escape(seo.label),
        escape(seo.issues.join(' | ')),
        escape(seo.good.join(' | ')),
        escape(liveAudit?.issues?.join(' | ') || (liveAudit && !liveAudit.ok ? 'Audit failed' : '')),
        escape(liveAudit?.good?.join(' | ') || ''),
        escape(p.focusKeywords),
        escape(p.metaTitle),
        escape(p.metaDescription),
        escape(p.geoScope),
        escape(p.geoRegions),
        escape(p.schemaType),
        escape(p.hreflang),
        escape(geo.wordCount),
        escape(geo.overall),
        escape(geo.grade),
        escape(geo.breakdown.aiCitability),
        escape(geo.breakdown.brandAuthority),
        escape(geo.breakdown.contentEEAT),
        escape(geo.breakdown.technicalGEO),
        escape(geo.breakdown.schemaStructuredData),
        escape(geo.breakdown.platformOptimization),
        escape(geo.platformScores.googleAIOverviews),
        escape(geo.platformScores.chatGPT),
        escape(geo.platformScores.perplexity),
        escape(geo.platformScores.gemini),
        escape(geo.platformScores.bingCopilot),
        escape(geo.recommendations.join(' | ')),
        escape(liveGeo?.warnings?.join(' | ') || '')
      ].join(',');
    });

    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `blog-seo-geo-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };


  // ---- Inline Category Add ----
  const handleAddCategoryInline = async () => {
    if (!inlineCategory.trim()) return;
    try {
      const data = await adminFetch<{ category: Category }>('/cms/categories', {
        method: 'POST',
        body: JSON.stringify({ name: inlineCategory.trim() })
      });
      if (data.category) {
        setCategories((prev) => [...prev, data.category]);
        setEditor((prev) => prev ? { ...prev, categoryId: data.category.id } : null);
        setInlineCategory('');
        setShowAddCategoryInline(false);
      }
    } catch (err) {
      console.error('Failed to create category inline:', err);
    }
  };

  // Note: Rich text is managed directly via TipTap and Turndown

  const handleMediaSelect = (url: string) => {
    if (mediaModalTarget === 'cover') {
      setEditor((prev) => prev ? { ...prev, coverImage: url } : null);
    } else if (mediaModalTarget === 'content') {
      if (tiptapEditor) {
        tiptapEditor.chain().focus().setImage({ src: url }).run();
      }
    }
    setShowMediaModal(false);
    setMediaModalTarget(null);
  };

  // ---- Categories / Tags management ----
  const addCategory = async () => {
    if (!newCategory.trim()) return;
    try {
      await adminFetch('/cms/categories', { method: 'POST', body: JSON.stringify({ name: newCategory.trim() }) });
      setNewCategory('');
      await loadAll();
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to add category'); }
  };
  const deleteCategory = async (id: string) => {
    if (!confirm('Delete this category? Posts will be uncategorized.')) return;
    try { await adminFetch(`/cms/categories/${id}`, { method: 'DELETE' }); await loadAll(); }
    catch (err) { setError(err instanceof Error ? err.message : 'Failed to delete category'); }
  };
  const addTag = async () => {
    if (!newTag.trim()) return;
    try {
      await adminFetch('/cms/tags', { method: 'POST', body: JSON.stringify({ name: newTag.trim() }) });
      setNewTag('');
      await loadAll();
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to add tag'); }
  };
  const deleteTag = async (id: string) => {
    if (!confirm('Delete this tag?')) return;
    try { await adminFetch(`/cms/tags/${id}`, { method: 'DELETE' }); await loadAll(); }
    catch (err) { setError(err instanceof Error ? err.message : 'Failed to delete tag'); }
  };

  const copyUrl = (slug: string, id: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/blog/${slug}`).catch(() => {});
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  // Word & read time calculations
  const wordCount = useMemo(() => {
    if (!editor || !editor.content) return 0;
    return editor.content.trim().split(/\s+/).filter(Boolean).length;
  }, [editor]);

  const TABS: { key: Tab; label: string; count: number }[] = [
    { key: 'posts',       label: 'Posts',      count: posts.length },
    { key: 'categories',  label: 'Categories', count: categories.length },
    { key: 'tags',        label: 'Tags',       count: tags.length },
  ];

  if (editor) {
    const matchedCategory = categories.find((c) => c.id === editor.categoryId);
    const parsedHtml = parseMarkdown(editor.content || '');

    return (
      <div className="fixed inset-0 z-50 bg-[#fafafa] flex flex-col font-sans h-screen w-screen overflow-hidden text-gray-800">
        {/* CSS styles injection for real blog preview */}
        <style dangerouslySetInnerHTML={{ __html: `
          .prose-preview h1 { font-size: 2.25rem; font-weight: 800; line-height: 1.2; margin-top: 1.5rem; margin-bottom: 1rem; color: #111; font-family: Georgia, serif; }
          .prose-preview h2 { font-size: 1.75rem; font-weight: 700; line-height: 1.3; margin-top: 2.25rem; margin-bottom: 0.8rem; color: #222; font-family: Georgia, serif; border-bottom: 1px solid #f1f1f1; padding-bottom: 0.3rem; }
          .prose-preview h3 { font-size: 1.35rem; font-weight: 600; line-height: 1.4; margin-top: 1.75rem; margin-bottom: 0.6rem; color: #333; }
          .prose-preview p { font-size: 1.05rem; line-height: 1.8; margin-bottom: 1.5rem; color: #333; font-family: Georgia, serif; }
          .prose-preview strong { font-weight: 700; color: #000; }
          .prose-preview em { font-style: italic; }
          .prose-preview ul, .prose-preview ol { margin: 0 0 1.5rem 0; padding-left: 1.6rem; font-family: Georgia, serif; }
          .prose-preview li { font-size: 1.05rem; line-height: 1.8; color: #333; margin-bottom: 0.35rem; }
          .prose-preview ul li { list-style: disc; }
          .prose-preview ol li { list-style: decimal; }
          .prose-preview blockquote { border-left: 4px solid #000; padding-left: 1.25rem; font-style: italic; color: #555; margin: 1.75rem 0; font-family: Georgia, serif; font-size: 1.15rem; }
          .prose-preview blockquote p { margin-bottom: 0.5rem; }
          .prose-preview img { max-width: 100%; max-height: 480px; border-radius: 8px; margin: 2rem auto; display: block; box-shadow: 0 10px 30px rgba(0,0,0,0.06); }
          .prose-preview a { color: #2563eb; text-decoration: underline; text-underline-offset: 3px; }
          .prose-preview a:hover { color: #1d4ed8; }
          .prose-preview code { background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 0.9em; color: #e06c75; }
          .prose-preview pre { background: #1e1e1e; padding: 1.25rem; border-radius: 8px; overflow-x: auto; font-family: monospace; font-size: 0.9em; margin: 1.75rem 0; color: #abb2bf; }
          .prose-preview pre code { background: transparent; padding: 0; color: inherit; }
          .prose-preview hr { border: none; border-top: 1px solid #eee; margin: 2rem 0; }
          .prose-preview table { border-collapse: collapse; margin: 1.5rem 0; width: 100%; font-size: 0.95rem; }
          .prose-preview th, .prose-preview td { border: 1px solid #e5e7eb; padding: 8px 12px; text-align: left; }
          .prose-preview th { background: #f9fafb; font-weight: 600; }
          .prose-preview del, .prose-preview s { text-decoration: line-through; color: #888; }
          .prose-preview u { text-decoration: underline; }
        `}} />

        {/* Editor Header */}
        <div className="h-14 border-b border-gray-200 bg-white px-4 flex items-center justify-between gap-4 flex-shrink-0 z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (confirm('Discard changes and return to list?')) setEditor(null);
              }}
              className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-black transition-colors"
              title="Back to Dashboard"
            >
              <ArrowLeft size={16} />
            </button>
            <span className="font-bold text-[14px] text-gray-850 truncate max-w-xs sm:max-w-md">
              {editor.title || 'Untitled Post'}
            </span>
            {editor.status === 'draft' && <span className="text-[10px] uppercase font-bold bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">Draft</span>}
            {editor.status === 'published' && <span className="text-[10px] uppercase font-bold bg-emerald-50 px-1.5 py-0.5 rounded text-emerald-700">Live</span>}
          </div>

          {/* Tab Mode Controls */}
          <div className="flex items-center bg-gray-100 p-0.5 rounded-lg text-[12px] font-semibold text-gray-600">
            <button
              onClick={() => setPreviewMode('write')}
              className={`px-3 py-1 rounded-md transition-colors ${previewMode === 'write' ? 'bg-white shadow text-black' : 'hover:text-black'}`}
            >
              Write
            </button>
            <button
              onClick={() => setPreviewMode('split')}
              className={`px-3 py-1 rounded-md transition-colors ${previewMode === 'split' ? 'bg-white shadow text-black' : 'hover:text-black'}`}
            >
              Split
            </button>
            <button
              onClick={() => setPreviewMode('preview')}
              className={`px-3 py-1 rounded-md transition-colors ${previewMode === 'preview' ? 'bg-white shadow text-black' : 'hover:text-black'}`}
            >
              Preview
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSidebar((s) => !s)}
              className={`p-1.5 rounded-lg transition-colors border ${showSidebar ? 'bg-gray-100 border-gray-200 text-black' : 'bg-white border-transparent text-gray-400 hover:text-black hover:bg-gray-50'}`}
              title="Toggle Sidebar Settings"
            >
              <Settings size={16} />
            </button>
            <button
              onClick={savePost}
              disabled={saving}
              className="an-btn an-btn-primary an-btn-sm inline-flex items-center gap-1.5 h-8 px-3"
            >
              {saving ? <Loader2 size={13} className="animate-spin" /> : null}
              {saving ? 'Saving…' : 'Save Post'}
            </button>
          </div>
        </div>

        {/* Autosave Recovery Banner */}
        {hasAutosave && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center justify-between text-[12px]">
            <span className="flex items-center gap-2 text-amber-800 font-medium">
              <AlertTriangle size={14} className="text-amber-500" />
              An autosaved backup of this post exists in your browser.
            </span>
            <div className="flex gap-2">
              <button onClick={restoreAutosave} className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded font-medium transition-colors">
                Restore
              </button>
              <button onClick={dismissAutosave} className="px-2.5 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded font-medium transition-colors">
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Workspace Container */}
        <div className="flex-1 flex overflow-hidden">
          {/* Main edit/write space */}
          <div className="flex-1 flex overflow-hidden">
            {/* WRITE PANEL */}
            {(previewMode === 'write' || previewMode === 'split') && (
              <div className="flex-1 flex flex-col overflow-hidden bg-[#f8f9fa] border-r border-gray-200">
                {/* Editor formatting toolbar */}
                <div className="sticky top-0 z-10 h-11 border-b border-gray-200 bg-white px-4 flex items-center gap-1.5 flex-shrink-0 select-none overflow-x-auto shadow-sm">
                  {/* Undo / Redo */}
                  <button
                    onClick={() => tiptapEditor?.chain().focus().undo().run()}
                    disabled={!tiptapEditor?.can().undo()}
                    className="p-1.5 hover:bg-gray-100 rounded text-gray-500 hover:text-black disabled:opacity-30 transition-colors"
                    title="Undo"
                  >
                    <Undo size={14} />
                  </button>
                  <button
                    onClick={() => tiptapEditor?.chain().focus().redo().run()}
                    disabled={!tiptapEditor?.can().redo()}
                    className="p-1.5 hover:bg-gray-100 rounded text-gray-500 hover:text-black disabled:opacity-30 transition-colors"
                    title="Redo"
                  >
                    <Redo size={14} />
                  </button>

                  <div className="w-px h-5 bg-gray-200 mx-1" />

                  {/* Heading selector */}
                  <select
                    value={
                      tiptapEditor?.isActive('heading', { level: 1 }) ? 'h1' :
                      tiptapEditor?.isActive('heading', { level: 2 }) ? 'h2' :
                      tiptapEditor?.isActive('heading', { level: 3 }) ? 'h3' : 'paragraph'
                    }
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === 'h1') tiptapEditor?.chain().focus().toggleHeading({ level: 1 }).run();
                      else if (val === 'h2') tiptapEditor?.chain().focus().toggleHeading({ level: 2 }).run();
                      else if (val === 'h3') tiptapEditor?.chain().focus().toggleHeading({ level: 3 }).run();
                      else tiptapEditor?.chain().focus().setParagraph().run();
                    }}
                    className="text-[12px] font-medium text-gray-650 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded px-2 py-1 outline-none cursor-pointer"
                  >
                    <option value="paragraph">Normal Text</option>
                    <option value="h1">Heading 1</option>
                    <option value="h2">Heading 2</option>
                    <option value="h3">Heading 3</option>
                  </select>

                  <div className="w-px h-5 bg-gray-200 mx-1" />

                  {/* Formatting styles */}
                  <button
                    onClick={() => tiptapEditor?.chain().focus().toggleBold().run()}
                    className={`p-1.5 rounded transition-colors ${tiptapEditor?.isActive('bold') ? 'bg-black text-white' : 'hover:bg-gray-100 text-gray-500 hover:text-black'}`}
                    title="Bold"
                  >
                    <Bold size={14} />
                  </button>
                  <button
                    onClick={() => tiptapEditor?.chain().focus().toggleItalic().run()}
                    className={`p-1.5 rounded transition-colors ${tiptapEditor?.isActive('italic') ? 'bg-black text-white' : 'hover:bg-gray-100 text-gray-500 hover:text-black'}`}
                    title="Italic"
                  >
                    <Italic size={14} />
                  </button>
                  <button
                    onClick={() => tiptapEditor?.chain().focus().toggleUnderline().run()}
                    className={`p-1.5 rounded transition-colors ${tiptapEditor?.isActive('underline') ? 'bg-black text-white' : 'hover:bg-gray-100 text-gray-500 hover:text-black'}`}
                    title="Underline"
                  >
                    <UnderlineIcon size={14} />
                  </button>
                  <button
                    onClick={() => tiptapEditor?.chain().focus().toggleStrike().run()}
                    className={`p-1.5 rounded transition-colors ${tiptapEditor?.isActive('strike') ? 'bg-black text-white' : 'hover:bg-gray-100 text-gray-500 hover:text-black'}`}
                    title="Strikethrough"
                  >
                    <Strikethrough size={14} />
                  </button>

                  <div className="w-px h-5 bg-gray-200 mx-1" />

                  {/* Lists */}
                  <button
                    onClick={() => tiptapEditor?.chain().focus().toggleBulletList().run()}
                    className={`p-1.5 rounded transition-colors ${tiptapEditor?.isActive('bulletList') ? 'bg-black text-white' : 'hover:bg-gray-100 text-gray-500 hover:text-black'}`}
                    title="Bulleted List"
                  >
                    <List size={14} />
                  </button>
                  <button
                    onClick={() => tiptapEditor?.chain().focus().toggleOrderedList().run()}
                    className={`p-1.5 rounded transition-colors ${tiptapEditor?.isActive('orderedList') ? 'bg-black text-white' : 'hover:bg-gray-100 text-gray-500 hover:text-black'}`}
                    title="Numbered List"
                  >
                    <ListOrdered size={14} />
                  </button>

                  <div className="w-px h-5 bg-gray-200 mx-1" />

                  {/* Blockquote & Code */}
                  <button
                    onClick={() => tiptapEditor?.chain().focus().toggleBlockquote().run()}
                    className={`p-1.5 rounded transition-colors ${tiptapEditor?.isActive('blockquote') ? 'bg-black text-white' : 'hover:bg-gray-100 text-gray-500 hover:text-black'}`}
                    title="Blockquote"
                  >
                    <FileText size={14} />
                  </button>
                  <button
                    onClick={() => tiptapEditor?.chain().focus().toggleCodeBlock().run()}
                    className={`p-1.5 rounded transition-colors ${tiptapEditor?.isActive('codeBlock') ? 'bg-black text-white' : 'hover:bg-gray-100 text-gray-500 hover:text-black'}`}
                    title="Code Block"
                  >
                    <Code size={14} />
                  </button>

                  <div className="w-px h-5 bg-gray-200 mx-1" />

                  {/* Links & Images */}
                  <button
                    onClick={() => {
                      const previousUrl = tiptapEditor?.getAttributes('link').href;
                      const url = window.prompt('Enter Link URL:', previousUrl);
                      if (url === null) return;
                      if (url === '') {
                        tiptapEditor?.chain().focus().extendMarkRange('link').unsetLink().run();
                        return;
                      }
                      tiptapEditor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
                    }}
                    className={`p-1.5 rounded transition-colors ${tiptapEditor?.isActive('link') ? 'bg-black text-white' : 'hover:bg-gray-100 text-gray-500 hover:text-black'}`}
                    title="Insert Link"
                  >
                    <Link2 size={14} />
                  </button>
                  <button
                    onClick={() => {
                      setMediaModalTarget('content');
                      setShowMediaModal(true);
                    }}
                    className="p-1.5 hover:bg-gray-100 rounded text-gray-500 hover:text-black inline-flex items-center gap-1 text-[11px] font-semibold transition-colors"
                    title="Insert Image from Library"
                  >
                    <ImageIcon size={14} /> Add Media
                  </button>
                </div>

                {/* Write workspace */}
                <div className="flex-1 overflow-y-auto bg-white flex justify-center admin-scroll-hidden admin-scroll-container">
                  <div className="w-full max-w-[780px] px-16 py-12 flex flex-col">
                    {/* Expandable Title Textarea */}
                    <textarea
                      value={editor.title || ''}
                      onChange={(e) => setEditor({ ...editor, title: e.target.value })}
                      placeholder="Enter post title here…"
                      rows={1}
                      className="w-full resize-none border-b border-gray-200 font-serif text-[32px] font-extrabold text-black outline-none placeholder:text-gray-400 py-3 mb-6 focus:border-gray-300 transition-colors"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') e.preventDefault();
                      }}
                    />

                    {/* TipTap Rich Text Editor Content */}
                    {tiptapEditor && <EditorContent editor={tiptapEditor} className="flex-1 flex flex-col" />}
                  </div>
                </div>

                {/* Editor footer metrics */}
                <div className="h-7 border-t border-gray-200 bg-white px-4 flex items-center justify-between text-[10px] text-[#aaa] select-none flex-shrink-0">
                  <span>Editor</span>
                  <span>{wordCount} words · {editor.content?.length || 0} characters</span>
                </div>
              </div>
            )}

            {/* LIVE PREVIEW PANEL */}
            {(previewMode === 'split' || previewMode === 'preview') && (
              <div className="flex-1 overflow-y-auto bg-white px-10 py-8 scroll-smooth">
                {/* Simulated Blog Template Wrapper */}
                <div className="max-w-xl mx-auto prose-preview">
                  {/* Topic / Category header */}
                  {matchedCategory && (
                    <span className="text-[11px] uppercase tracking-widest font-extrabold text-indigo-600 block mb-3">
                      {matchedCategory.name}
                    </span>
                  )}

                  {/* Live Rendered Title */}
                  <h1 className="text-[34px] font-serif font-extrabold text-black leading-tight mb-4">
                    {editor.title || 'Untitled Post'}
                  </h1>

                  {/* Date & Metadata */}
                  <div className="flex items-center gap-2 text-[12px] text-gray-400 mb-8 pb-4 border-b border-gray-100">
                    <span>By {profile?.firstName ? `${profile.firstName} ${profile.lastName || ''}`.trim() : 'Reframe Visuals'}</span>
                    <span>•</span>
                    <span>{new Date().toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                    <span>•</span>
                    <span className="bg-gray-100 px-1.5 py-0.5 rounded font-semibold text-gray-600">{editor.readTime || '6 min read'}</span>
                  </div>

                  {/* Featured Cover Banner */}
                  {editor.coverImage ? (
                    <img
                      src={editor.coverImage}
                      alt={`${editor.title || 'Blog post'} - Reframe Visuals Blog`}
                      className="w-full h-64 object-cover rounded-xl shadow-md mb-8 border border-gray-100"
                    />
                  ) : (
                    <div className="w-full h-32 bg-gray-50 border border-dashed border-gray-200 rounded-xl flex items-center justify-center text-[12px] text-gray-400 font-medium mb-8">
                      No cover image set
                    </div>
                  )}

                  {/* Excerpt panel */}
                  {editor.excerpt && (
                    <div className="bg-gray-50 border-l-2 border-gray-300 px-4 py-3 text-[14px] leading-relaxed text-gray-650 italic rounded-r-lg mb-8">
                      {editor.excerpt}
                    </div>
                  )}

                  {/* Parsed content body */}
                  {editor.content?.trim() ? (
                    <div dangerouslySetInnerHTML={{ __html: parsedHtml }} />
                  ) : (
                    <div className="text-gray-300 italic text-[14px]">Start typing in the writing pane to view contents here…</div>
                  )}

                  {/* CTA Banner Preview */}
                  {editor.ctaType && (
                    <div className="mt-12 bg-black text-white p-6 rounded-2xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div>
                        <div className="text-[10px] tracking-wider uppercase font-bold text-indigo-400 block mb-1">Reframe Visuals Partner Program</div>
                        <h4 className="text-[16px] font-bold font-serif">Ready to transform your brand content visuals?</h4>
                        <p className="text-[12px] text-gray-400 mt-1 mb-0 leading-normal">Outsource catalog-ready photo editing to human Photoshop experts.</p>
                      </div>
                      <button className="flex-shrink-0 bg-white hover:bg-gray-100 text-black px-4 py-2 rounded-xl text-[12px] font-bold transition-all shadow-md">
                        {editor.ctaType === 'audit' ? 'Get Visual Audit' : editor.ctaType === 'trial' ? 'Get 3 Free Edits' : 'Build Quote'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* SETTINGS SIDEBAR */}
          {showSidebar && (
            <div className="w-80 border-l border-gray-200 bg-[#f9fafb] overflow-y-auto flex-shrink-0 flex flex-col justify-between select-none">
              <div className="p-4 space-y-5 text-[12px]">
                {/* Title */}
                <div className="font-bold text-[11px] uppercase tracking-wider text-gray-400 border-b border-gray-200 pb-2 mb-3">
                  Post Settings
                </div>

                {/* Status & Visibility */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-700">Status & Actions</h4>
                  <div className="bg-white border border-gray-200 rounded-xl p-3 space-y-3">
                    <label className="block">
                      <span className="text-[11px] text-gray-500 mb-1 block">Publish Status</span>
                      <select
                        value={editor.status || 'draft'}
                        onChange={(e) => setEditor({ ...editor, status: e.target.value })}
                        className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-[13px] outline-none bg-white focus:border-black/35"
                      >
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                        <option value="scheduled">Scheduled</option>
                        <option value="archived">Archived</option>
                      </select>
                    </label>

                    {editor.status === 'scheduled' && (
                      <label className="block">
                        <span className="text-[11px] text-gray-500 mb-1 block">Go live at *</span>
                        <input
                          type="datetime-local"
                          value={editor.publishedAt ? editor.publishedAt.slice(0, 16) : ''}
                          onChange={(e) => setEditor({ ...editor, publishedAt: e.target.value })}
                          className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-[13px] outline-none focus:border-black/35"
                        />
                        <span className="text-[10px] text-gray-400 mt-1 block">
                          Publishes automatically at this time and pings search engines.
                        </span>
                      </label>
                    )}

                    <label className="flex items-center gap-2 text-gray-700 cursor-pointer pt-1">
                      <input
                        type="checkbox"
                        checked={!!editor.featured}
                        onChange={(e) => setEditor({ ...editor, featured: e.target.checked })}
                        className="rounded border-gray-300 text-black focus:ring-black"
                      />
                      <span>Pin as Featured Post</span>
                    </label>
                  </div>
                </div>

                {/* Permalink / URL structure */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-700">Permalink URL</h4>
                  <div className="bg-white border border-gray-200 rounded-xl p-3 space-y-2">
                    <label className="block">
                      <span className="text-[11px] text-gray-500 mb-1 block">Custom Slug URL</span>
                      <input
                        value={editor.slug || ''}
                        onChange={(e) => setEditor({ ...editor, slug: e.target.value })}
                        placeholder="slug-path-name"
                        className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-[13px] outline-none focus:border-black/35"
                      />
                    </label>
                    {editor.slug && (
                      <div className="pt-1.5 flex items-center justify-between text-[11px] text-gray-400">
                        <span className="truncate max-w-[180px]">/blog/{editor.slug}</span>
                        <button
                          onClick={() => copyUrl(editor.slug!, 'sidebar')}
                          className="text-[#bbb] hover:text-black transition-colors"
                          title="Copy Link"
                        >
                          {copiedId === 'sidebar' ? <CheckCircle2 size={13} className="text-emerald-500" /> : <Copy size={13} />}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Categories & Tags */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-700">Categorization & Tags</h4>
                  <div className="bg-white border border-gray-200 rounded-xl p-3 space-y-3">
                    <div>
                      <span className="text-[11px] text-gray-500 mb-1 block">Category</span>
                      <div className="flex gap-1.5">
                        <select
                          value={editor.categoryId || ''}
                          onChange={(e) => setEditor({ ...editor, categoryId: e.target.value })}
                          className="flex-1 rounded-lg border border-gray-200 px-2 py-1.5 text-[13px] outline-none bg-white focus:border-black/35"
                        >
                          <option value="">Uncategorized</option>
                          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <button
                          onClick={() => setShowAddCategoryInline((a) => !a)}
                          className={`px-2 border border-gray-200 rounded-lg text-gray-500 hover:text-black hover:bg-gray-50 ${showAddCategoryInline ? 'bg-gray-100 text-black border-gray-300' : ''}`}
                          title="Create Category Inline"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {showAddCategoryInline && (
                      <div className="flex gap-1.5 border border-gray-100 p-2 rounded-lg bg-gray-50/50">
                        <input
                          value={inlineCategory}
                          onChange={(e) => setInlineCategory(e.target.value)}
                          placeholder="Category name…"
                          className="flex-1 rounded-lg border border-gray-200 bg-white px-2 py-1 text-[11px] outline-none"
                          onKeyDown={(e) => e.key === 'Enter' && handleAddCategoryInline()}
                        />
                        <button
                          onClick={handleAddCategoryInline}
                          className="bg-black hover:bg-gray-800 text-white rounded-lg px-2.5 py-1 text-[11px] font-semibold"
                        >
                          Add
                        </button>
                      </div>
                    )}

                    <label className="block">
                      <span className="text-[11px] text-gray-500 mb-1 block">Tags (comma separated)</span>
                      <textarea
                        value={editor.tagsText || ''}
                        onChange={(e) => setEditor({ ...editor, tagsText: e.target.value })}
                        placeholder="marketing, tutorials, tech"
                        rows={2}
                        className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-[13px] outline-none focus:border-black/35"
                      />
                    </label>
                  </div>
                </div>

                {/* Featured / Cover Image */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-700">Cover Banner Image</h4>
                  <div className="bg-white border border-gray-200 rounded-xl p-3 space-y-2">
                    {editor.coverImage ? (
                      <div className="space-y-2">
                        <img
                          src={editor.coverImage}
                          alt={`${editor.title || 'Blog post'} - Reframe Visuals Blog`}
                          className="w-full h-28 object-cover rounded-lg border border-gray-100"
                        />
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => {
                              setMediaModalTarget('cover');
                              setShowMediaModal(true);
                            }}
                            className="text-[11px] font-semibold text-gray-500 hover:text-black transition-colors"
                          >
                            Replace
                          </button>
                          <button
                            onClick={() => setEditor({ ...editor, coverImage: '' })}
                            className="text-[11px] font-semibold text-red-600 hover:text-red-700 transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => {
                          setMediaModalTarget('cover');
                          setShowMediaModal(true);
                        }}
                        className="w-full h-24 bg-gray-50 hover:bg-gray-100 border border-dashed border-gray-200 hover:border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 cursor-pointer transition-all gap-1.5"
                      >
                        <ImageIcon size={18} />
                        <span className="text-[11px] font-semibold">Set Featured Image</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Metrics detail fields */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-700">Content Statistics</h4>
                  <div className="bg-white border border-gray-200 rounded-xl p-3 space-y-2.5">
                    <label className="block">
                      <span className="text-[11px] text-gray-500 mb-1 block">Read Time override</span>
                      <input
                        value={editor.readTime || ''}
                        onChange={(e) => setEditor({ ...editor, readTime: e.target.value })}
                        placeholder="e.g. 5 min read"
                        className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-[13px] outline-none focus:border-black/35"
                      />
                    </label>

                    <label className="block">
                      <span className="text-[11px] text-gray-500 mb-1 block">Call to Action Type</span>
                      <select
                        value={editor.ctaType || ''}
                        onChange={(e) => setEditor({ ...editor, ctaType: e.target.value })}
                        className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-[13px] outline-none bg-white focus:border-black/35"
                      >
                        <option value="">None</option>
                        <option value="audit">Visual Audit Button</option>
                        <option value="trial">3 Free Edits Button</option>
                        <option value="quote">Build Quote Button</option>
                      </select>
                    </label>
                  </div>
                </div>

                {/* SEO Panel */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-700 flex items-center gap-1.5">
                    <TrendingUp size={13} className="text-gray-400" />
                    SEO & Geo
                  </h4>

                  {/* Live SEO score */}
                  {(() => {
                    const seo = computeSeo(editor);
                    return (
                      <div className={`border rounded-xl p-3 space-y-2 ${seo.color}`}>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold uppercase tracking-wide">{seo.label}</span>
                          <span className="text-[20px] font-black leading-none">{seo.score}<span className="text-[11px] font-normal opacity-60">/100</span></span>
                        </div>
                        <div className="w-full bg-black/10 rounded-full h-1.5">
                          <div
                            className="h-1.5 rounded-full bg-current transition-all"
                            style={{ width: `${seo.score}%` }}
                          />
                        </div>
                        {seo.issues.length > 0 && (
                          <ul className="space-y-1 mt-1">
                            {seo.issues.map((issue, i) => (
                              <li key={i} className="text-[10px] flex items-start gap-1 opacity-90">
                                <span className="mt-0.5 flex-shrink-0">✗</span>{issue}
                              </li>
                            ))}
                          </ul>
                        )}
                        {seo.good.slice(0, 3).map((g, i) => (
                          <div key={i} className="text-[10px] flex items-start gap-1 opacity-80">
                            <span className="mt-0.5 flex-shrink-0">✓</span>{g}
                          </div>
                        ))}
                      </div>
                    );
                  })()}

                  <div className="bg-white border border-gray-200 rounded-xl p-3 space-y-2.5">
                    <label className="block">
                      <span className="text-[11px] text-gray-500 mb-1 block">Focus Keywords <span className="text-gray-300">(comma separated)</span></span>
                      <input
                        value={editor.focusKeywords || ''}
                        onChange={(e) => setEditor({ ...editor, focusKeywords: e.target.value })}
                        placeholder="photo editing, product photography"
                        className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-[13px] outline-none focus:border-black/35"
                      />
                    </label>

                    <label className="block">
                      <span className="text-[11px] text-gray-500 mb-1 block">Meta Title <span className="text-gray-300">({(editor.metaTitle || '').length}/65)</span></span>
                      <input
                        value={editor.metaTitle || ''}
                        onChange={(e) => setEditor({ ...editor, metaTitle: e.target.value })}
                        placeholder="SEO page title…"
                        maxLength={100}
                        className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-[13px] outline-none focus:border-black/35"
                      />
                    </label>

                    <label className="block">
                      <span className="text-[11px] text-gray-500 mb-1 block">Meta Description <span className="text-gray-300">({(editor.metaDescription || '').length}/160)</span></span>
                      <textarea
                        value={editor.metaDescription || ''}
                        onChange={(e) => setEditor({ ...editor, metaDescription: e.target.value })}
                        placeholder="Search engine snippet (120–160 chars)"
                        rows={3}
                        maxLength={200}
                        className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-[13px] outline-none focus:border-black/35"
                      />
                    </label>

                    <label className="block">
                      <span className="text-[11px] text-gray-500 mb-1 block">Schema Type</span>
                      <select
                        value={editor.schemaType || 'BlogPosting'}
                        onChange={(e) => setEditor({ ...editor, schemaType: e.target.value })}
                        className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-[13px] outline-none bg-white focus:border-black/35"
                      >
                        <option value="BlogPosting">BlogPosting</option>
                        <option value="Article">Article</option>
                        <option value="HowTo">HowTo</option>
                        <option value="FAQPage">FAQPage</option>
                        <option value="NewsArticle">NewsArticle</option>
                        <option value="TechArticle">TechArticle</option>
                      </select>
                    </label>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-xl p-3 space-y-2.5">
                    <div className="text-[11px] font-semibold text-gray-600 mb-1 flex items-center gap-1.5">
                      <Globe size={11} className="text-gray-400" /> Geo Targeting
                    </div>
                    <label className="block">
                      <span className="text-[11px] text-gray-500 mb-1 block">Geo Scope</span>
                      <select
                        value={editor.geoScope || 'global'}
                        onChange={(e) => setEditor({ ...editor, geoScope: e.target.value })}
                        className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-[13px] outline-none bg-white focus:border-black/35"
                      >
                        <option value="global">Global</option>
                        <option value="regional">Regional</option>
                        <option value="local">Local</option>
                        <option value="none">None</option>
                      </select>
                    </label>

                    <label className="block">
                      <span className="text-[11px] text-gray-500 mb-1 block">Target Regions <span className="text-gray-300">(comma separated)</span></span>
                      <input
                        value={editor.geoRegions || ''}
                        onChange={(e) => setEditor({ ...editor, geoRegions: e.target.value })}
                        placeholder="US, UK, CA, AU"
                        className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-[13px] outline-none focus:border-black/35"
                      />
                    </label>

                    <label className="block">
                      <span className="text-[11px] text-gray-500 mb-1 block">hreflang Locale</span>
                      <input
                        value={editor.hreflang || ''}
                        onChange={(e) => setEditor({ ...editor, hreflang: e.target.value })}
                        placeholder="e.g. en, en-US, es"
                        className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-[13px] outline-none focus:border-black/35"
                      />
                    </label>
                  </div>

                  {/* ── GEO / AEO Score Panel ── */}
                  {(() => {
                    const geo = computeGeoScore({
                      content: editor.content,
                      schemaType: editor.schemaType,
                      focusKeywords: editor.focusKeywords,
                      metaTitle: editor.metaTitle,
                      metaDescription: editor.metaDescription,
                      hreflang: editor.hreflang,
                      hasImage: !!editor.coverImage,
                    });
                    const CATS: { key: keyof typeof geo.breakdown; label: string }[] = [
                      { key: 'aiCitability', label: 'AI Citability' },
                      { key: 'brandAuthority', label: 'Brand Auth.' },
                      { key: 'contentEEAT', label: 'E-E-A-T' },
                      { key: 'technicalGEO', label: 'Technical' },
                      { key: 'schemaStructuredData', label: 'Schema' },
                      { key: 'platformOptimization', label: 'Platforms' },
                    ];
                    const PLATFORMS: { key: keyof typeof geo.platformScores; label: string }[] = [
                      { key: 'googleAIOverviews', label: 'Google AIO' },
                      { key: 'chatGPT', label: 'ChatGPT' },
                      { key: 'perplexity', label: 'Perplexity' },
                      { key: 'gemini', label: 'Gemini' },
                      { key: 'bingCopilot', label: 'Bing' },
                    ];
                    return (
                      <div className="space-y-2">
                        <h4 className="font-semibold text-gray-700 flex items-center gap-1.5">
                          <Sparkles size={13} className="text-violet-500" />
                          GEO / AEO
                        </h4>

                        {/* Overall score card */}
                        <div className={`border rounded-xl p-3 space-y-2 ${geo.gradeColor}`}>
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold uppercase tracking-wide">{geo.grade}</span>
                            <span className="text-[20px] font-black leading-none">{geo.overall}<span className="text-[11px] font-normal opacity-60">/100</span></span>
                          </div>
                          <div className="w-full bg-black/10 rounded-full h-1.5">
                            <div className="h-1.5 rounded-full bg-current transition-all" style={{ width: `${geo.overall}%` }} />
                          </div>
                          <div className="text-[10px] opacity-75">{geo.wordCount} words · {geo.questionHeadingCount} Q-headings · {geo.faqCount} FAQs · {geo.tableCount} tables</div>
                        </div>

                        {/* Category breakdown */}
                        <div className="bg-white border border-gray-200 rounded-xl p-3 space-y-1.5">
                          <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Category Breakdown</div>
                          {CATS.map(({ key, label }) => (
                            <div key={key} className="flex items-center gap-2">
                              <span className="text-[10px] text-gray-500 w-20 flex-shrink-0">{label}</span>
                              <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                                <div className={`h-full rounded-full transition-all ${geoScoreColor(geo.breakdown[key])}`} style={{ width: `${geo.breakdown[key]}%` }} />
                              </div>
                              <span className="text-[10px] font-bold text-gray-600 w-6 text-right">{geo.breakdown[key]}</span>
                            </div>
                          ))}
                        </div>

                        {/* Platform sub-scores */}
                        <div className="bg-white border border-gray-200 rounded-xl p-3 space-y-1.5">
                          <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">AI Platform Scores</div>
                          {PLATFORMS.map(({ key, label }) => (
                            <div key={key} className="flex items-center gap-2">
                              <span className="text-[10px] text-gray-500 w-20 flex-shrink-0">{label}</span>
                              <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                                <div className={`h-full rounded-full transition-all ${geoScoreColor(geo.platformScores[key])}`} style={{ width: `${geo.platformScores[key]}%` }} />
                              </div>
                              <span className="text-[10px] font-bold text-gray-600 w-6 text-right">{geo.platformScores[key]}</span>
                            </div>
                          ))}
                        </div>

                        {/* Top recommendations */}
                        {geo.recommendations.length > 0 && (
                          <div className="bg-violet-50 border border-violet-100 rounded-xl p-3 space-y-1.5">
                            <div className="text-[10px] font-semibold text-violet-700 uppercase tracking-wide mb-1">Top Actions</div>
                            {geo.recommendations.slice(0, 3).map((r, i) => (
                              <div key={i} className="text-[10px] text-violet-800 flex items-start gap-1">
                                <span className="text-violet-400 mt-0.5 flex-shrink-0">→</span>{r}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Stop-Slop Prose Audit sidebar card */}
                  {(() => {
                    const slop = computeStopSlopScore(editor.content || '');
                    const DIMS: { key: keyof typeof slop.dimensions; label: string }[] = [
                      { key: 'directness', label: 'Directness' },
                      { key: 'rhythm', label: 'Rhythm' },
                      { key: 'trust', label: 'Trust' },
                      { key: 'authenticity', label: 'Authenticity' },
                      { key: 'density', label: 'Density' },
                    ];
                    return (
                      <div className="space-y-2">
                        <h4 className="font-semibold text-gray-700 flex items-center gap-1.5">
                          <FileText size={13} className="text-slate-400" />
                          Prose Audit
                        </h4>

                        {/* Overall score card */}
                        <div className={`border rounded-xl p-3 space-y-2 ${slop.gradeColor}`}>
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold uppercase tracking-wide">{slop.grade}</span>
                            <span className="text-[20px] font-black leading-none">{slop.score}<span className="text-[11px] font-normal opacity-60">/50</span></span>
                          </div>
                          <div className="w-full bg-black/10 rounded-full h-1.5">
                            <div
                              className="h-1.5 rounded-full bg-current transition-all"
                              style={{ width: `${slop.score100}%` }}
                            />
                          </div>
                        </div>

                        {/* Dimension bars */}
                        <div className="bg-white border border-gray-200 rounded-xl p-3 space-y-1.5">
                          <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Dimensions</div>
                          {DIMS.map(({ key, label }) => (
                            <div key={key} className="flex items-center gap-2">
                              <span className="text-[10px] text-gray-500 w-20 flex-shrink-0">{label}</span>
                              <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${
                                    slop.dimensions[key] >= 8 ? 'bg-emerald-500' :
                                    slop.dimensions[key] >= 5 ? 'bg-amber-400' : 'bg-red-400'
                                  }`}
                                  style={{ width: `${slop.dimensions[key] * 10}%` }}
                                />
                              </div>
                              <span className="text-[10px] font-bold text-gray-600 w-6 text-right">{slop.dimensions[key]}</span>
                            </div>
                          ))}
                        </div>

                        {/* Issues */}
                        {slop.issues.length > 0 && (
                          <div className="bg-red-50 border border-red-100 rounded-xl p-3 space-y-1">
                            <div className="text-[10px] font-bold uppercase tracking-wide text-red-600 mb-1">Revisions Needed</div>
                            {slop.issues.map((iss) => (
                              <div key={iss} className="text-[10px] text-red-700 flex items-start gap-1">
                                <span className="text-red-400 mt-0.5 flex-shrink-0">✗</span>{iss}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Good signals */}
                        {slop.good.length > 0 && (
                          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 space-y-1">
                            <div className="text-[10px] font-bold uppercase tracking-wide text-emerald-600 mb-1">Passing</div>
                            {slop.good.map((g) => (
                              <div key={g} className="text-[10px] text-emerald-700 flex items-start gap-1">
                                <span className="text-emerald-400 mt-0.5 flex-shrink-0">✓</span>{g}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Human Score sidebar card (humanize-text) */}
                  {(() => {
                    const human = computeHumanizeScore(editor.content || '');
                    return (
                      <div className="space-y-2">
                        <h4 className="font-semibold text-gray-700 flex items-center gap-1.5">
                          <Sparkles size={13} className="text-indigo-400" />
                          Human Score
                        </h4>
                        {/* Overall score card */}
                        <div className={`border rounded-xl p-3 space-y-2 ${human.gradeColor}`}>
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold uppercase tracking-wide">{human.grade}</span>
                            <span className="text-[20px] font-black leading-none">{human.humanScore}<span className="text-[11px] font-normal opacity-60">/100</span></span>
                          </div>
                          <div className="w-full bg-black/10 rounded-full h-1.5">
                            <div className="h-1.5 rounded-full bg-current transition-all" style={{ width: `${human.humanScore}%` }} />
                          </div>
                        </div>
                        {/* Signal bars */}
                        <div className="bg-white border border-gray-200 rounded-xl p-3 space-y-1.5">
                          <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Detection Signals</div>
                          {[
                            { label: 'Vocab Diversity', value: Math.round(human.signals.ttr * 100), max: 100, threshold: 55 },
                            { label: 'Sent. Variance', value: Math.round(human.signals.sentenceLengthVariance * 10), max: 80, threshold: 30 },
                            { label: 'Burstiness', value: Math.round(human.signals.burstiness * 100), max: 100, threshold: 30 },
                          ].map(({ label, value, max, threshold }) => (
                            <div key={label} className="flex items-center gap-2">
                              <span className="text-[10px] text-gray-500 w-24 flex-shrink-0">{label}</span>
                              <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${value >= threshold ? 'bg-emerald-500' : 'bg-red-400'}`}
                                  style={{ width: `${Math.min(100, (value / max) * 100)}%` }}
                                />
                              </div>
                              <span className="text-[10px] font-bold text-gray-600 w-8 text-right">{value}</span>
                            </div>
                          ))}
                        </div>
                        {/* AI Vocab hits */}
                        {human.aiVocabHits.length > 0 && (
                          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 space-y-1.5">
                            <div className="text-[10px] font-bold uppercase tracking-wide text-indigo-700 mb-1">Replace AI Words</div>
                            {human.aiVocabHits.slice(0, 5).map(({ word, replacements, count }) => (
                              <div key={word} className="text-[10px] flex items-start gap-1">
                                <span className="font-semibold text-red-600 flex-shrink-0">{word}{count > 1 ? ` ×${count}` : ''}</span>
                                <span className="text-indigo-300 flex-shrink-0">→</span>
                                <span className="text-emerald-700">{replacements.slice(0, 2).join(', ')}</span>
                              </div>
                            ))}
                            {human.aiVocabHits.length > 5 && (
                              <div className="text-[10px] text-indigo-400">+{human.aiVocabHits.length - 5} more…</div>
                            )}
                          </div>
                        )}
                        {/* Issues */}
                        {human.issues.length > 0 && (
                          <div className="bg-red-50 border border-red-100 rounded-xl p-3 space-y-0.5">
                            <div className="text-[10px] font-bold uppercase tracking-wide text-red-600 mb-1">AI Signals</div>
                            {human.issues.map((iss) => (
                              <div key={iss} className="text-[10px] text-red-700 flex items-start gap-1">
                                <span className="text-red-400 mt-0.5 flex-shrink-0">✗</span>{iss}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Live audit results in editor */}
                  {editor.id && (auditResults.has(editor.id) || auditingIds.has(editor.id)) && (
                    <div className="bg-white border border-gray-200 rounded-xl p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-violet-700">
                          <ScanSearch size={12} />
                          Live Page Audit
                          {auditResults.has(editor.id) && auditResults.get(editor.id)!.auditedAt && (
                            <span className="text-[10px] text-gray-400 font-normal">
                              · {new Date(auditResults.get(editor.id)!.auditedAt!).toLocaleTimeString()}
                            </span>
                          )}
                        </div>
                        {editor.status === 'published' && (
                          <button
                            onClick={() => runAudit(editor as Post)}
                            disabled={auditingIds.has(editor.id!)}
                            className="text-[10px] text-violet-600 hover:underline disabled:opacity-40"
                          >
                            {auditingIds.has(editor.id!) ? 'Auditing…' : 'Re-run'}
                          </button>
                        )}
                      </div>
                      {auditingIds.has(editor.id) ? (
                        <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                          <Loader2 size={10} className="animate-spin" /> Fetching live page…
                        </div>
                      ) : auditResults.has(editor.id) && (() => {
                        const audit = auditResults.get(editor.id!)!;
                        if (!audit.ok) return (
                          <p className="text-[10px] text-red-600">{audit.error || 'Audit failed'}</p>
                        );
                        return (
                          <div className="space-y-1">
                            {audit.issues.map((issue) => (
                              <div key={issue} className="text-[10px] text-red-700 flex items-start gap-1">
                                <span className="text-red-400 mt-0.5 flex-shrink-0">✗</span>{issue}
                              </div>
                            ))}
                            {audit.good.slice(0, 5).map((g) => (
                              <div key={g} className="text-[10px] text-emerald-700 flex items-start gap-1">
                                <span className="text-emerald-400 mt-0.5 flex-shrink-0">✓</span>{g}
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* Trigger audit button for published posts not yet audited */}
                  {editor.id && editor.status === 'published' && !auditResults.has(editor.id) && !auditingIds.has(editor.id) && (
                    <button
                      onClick={() => runAudit(editor as Post)}
                      className="w-full flex items-center justify-center gap-1.5 py-2 border border-violet-200 hover:border-violet-300 text-violet-600 hover:bg-violet-50 rounded-lg text-[11px] font-semibold transition-all"
                    >
                      <ScanSearch size={12} /> Audit Live Page
                    </button>
                  )}
                </div>
              </div>

              {/* Sidebar footer delete button */}
              {editor.id && (
                <div className="p-4 border-t border-gray-200 bg-white">
                  <button
                    onClick={() => deletePost(editor.id!)}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 border border-red-200 hover:border-red-300 text-red-600 hover:bg-red-50 rounded-lg text-[11px] font-semibold transition-all"
                  >
                    <Trash2 size={13} /> Delete Post
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* MediaSelectorModal integration */}
        {showMediaModal && (
          <MediaSelectorModal
            onClose={() => {
              setShowMediaModal(false);
              setMediaModalTarget(null);
            }}
            onSelect={handleMediaSelect}
          />
        )}
      </div>
    );
  }

  // ---- RENDER DASHBOARD MODE ----
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="an-page-header">
        <div className="an-page-title">
          <span className="ph-icon"><FileText size={16} strokeWidth={2.5} /></span>
          Blog
        </div>
        <div className="an-page-desc">
          {counts.all} posts · {counts.published} published · {categories.length} categories · {tags.length} tags
          {auditProgress && (
            <span className="ml-3 inline-flex items-center gap-1.5 text-violet-600">
              <Loader2 size={11} className="animate-spin" />
              Auditing {auditProgress.done}/{auditProgress.total} posts…
            </span>
          )}
        </div>
        <div className="an-page-actions">
          <button
            onClick={() => { autoAuditTriggered.current = false; setAuditResults(new Map()); runAllAudits(posts); }}
            disabled={!!auditProgress}
            className="an-btn an-btn-ghost an-btn-sm disabled:opacity-40"
            title="Re-run live SEO audit for all published posts"
          >
            <ScanSearch size={14} /> Re-audit All
          </button>
          <button
            onClick={() => {
              const needsRevision = posts.filter((p) => computeStopSlopScore(p.content || '').grade === 'Needs Revision');
              if (needsRevision.length > 0) {
                setExpandedStopSlop(needsRevision[0].id);
              }
              const summary = posts.map((p) => ({
                title: p.title,
                score: computeStopSlopScore(p.content || '').score,
                grade: computeStopSlopScore(p.content || '').grade,
              }));
              console.table(summary);
            }}
            className="an-btn an-btn-ghost an-btn-sm"
            title="Bulk prose quality scan — highlights posts needing revision"
          >
            <FileText size={14} /> Scan Prose
          </button>
          <button
            onClick={() => exportSeoReport(selectedPostIds.size > 0 ? 'selected' : 'all')}
            className="an-btn an-btn-ghost an-btn-sm"
            title={selectedPostIds.size > 0 ? `Export SEO report for ${selectedPostIds.size} selected posts` : 'Export SEO/GEO report for all posts'}
          >
            <Download size={14} /> Export {selectedPostIds.size > 0 ? `(${selectedPostIds.size})` : 'All'}
          </button>
          <button onClick={loadAll} className="an-btn an-btn-ghost an-btn-sm">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          {tab === 'posts' && (
            <button onClick={openNew} className="an-btn an-btn-primary an-btn-sm">
              <Plus size={14} /> Add New
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-[13px] text-red-700">{error}</div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-[var(--an-border)] select-none">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-[13px] font-semibold border-b-2 -mb-px transition-colors ${tab === t.key ? 'border-black text-[var(--an-text)]' : 'border-transparent text-[var(--an-text2)] hover:text-[var(--an-text)]'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab contents: Posts */}
      {tab === 'posts' && (
        <div className="an-card-flush overflow-hidden">
          {/* Filters + Search */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--an-border)] px-4 py-3 select-none">
            <div className="flex items-center gap-1">
              {([['all', 'All', counts.all], ['published', 'Published', counts.published], ['draft', 'Drafts', counts.draft], ['archived', 'Archived', counts.archived]] as const).map(([key, label, count]) => (
                <button
                  key={key}
                  onClick={() => setStatusFilter(key)}
                  className={`rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors ${statusFilter === key ? 'bg-black text-white' : 'text-[var(--an-text2)] hover:bg-black/5'}`}
                >
                  {label} <span className={`ml-1 text-[11px] ${statusFilter === key ? 'text-white/60' : 'text-[#aaa]'}`}>{count}</span>
                </button>
              ))}
            </div>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#999]" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search posts…"
                className="w-52 rounded-lg border border-[var(--an-border)] bg-white py-2 pl-9 pr-3 text-[13px] outline-none focus:border-black/40"
              />
            </div>
          </div>

          {loading ? (
            <div className="p-10 text-center text-sm text-[#888]">Loading posts…</div>
          ) : filteredPosts.length === 0 ? (
            <div className="p-10 text-center text-sm text-[#888]">No posts found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-[var(--an-border)] bg-[var(--an-surface,#fafafa)]">
                    <th className="px-3 py-2.5 w-8 select-none">
                      <input
                        type="checkbox"
                        checked={filteredPosts.length > 0 && filteredPosts.every(p => selectedPostIds.has(p.id))}
                        onChange={toggleSelectAllPosts}
                        className="rounded border-[var(--an-border)] text-black focus:ring-black"
                      />
                    </th>
                    <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-[#888]">Post</th>
                    <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-[#888]">Category</th>
                    <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-[#888]">Status</th>
                    <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-[#888]">SEO</th>
                    <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-[#888]">GEO</th>
                    <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-[#888]">Prose</th>
                    <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-[#888]">Human</th>
                    <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-[#888]">Published</th>
                    <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-[#888]"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPosts.map((post) => (
                    <React.Fragment key={post.id}>
                    <tr
                      style={{ cursor: 'pointer' }}
                      onClick={() => openEdit(post)}
                      className="border-b border-[var(--an-border)] hover:bg-black/[0.02] transition-colors"
                    >
                      {/* Checkbox */}
                      <td className="px-3 py-2.5 w-8" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedPostIds.has(post.id)}
                          onChange={(e) => toggleSelectPost(post.id, e as any)}
                          className="rounded border-[var(--an-border)] text-black focus:ring-black"
                        />
                      </td>

                      {/* Title & Slug */}
                      <td className="px-3 py-2.5 min-w-[200px]">
                        <div className="font-medium text-[var(--an-text)] leading-snug flex items-center gap-1.5">
                          {post.featured && <Star size={12} className="text-amber-500 fill-amber-500 flex-shrink-0" />}
                          {post.title}
                        </div>
                        <div className="text-[11px] text-[#aaa] font-mono mt-0.5">/blog/{post.slug}</div>
                      </td>

                      {/* Category */}
                      <td className="px-3 py-2.5 text-gray-600">
                        {post.category?.name ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-700 bg-slate-50 border border-slate-100 rounded px-1.5 py-0.5 leading-none">
                            {post.category.name}
                          </span>
                        ) : (
                          <span className="text-[#ccc] italic">uncategorized</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-3 py-2.5">
                        <span className={`an-badge ${badgeForStatus(post.status)}`}>{post.status}</span>
                      </td>

                      {/* SEO Score */}
                      <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                        {(() => {
                          const seo = computeSeo(post as any);
                          return (
                            <button
                              className="flex items-center gap-1.5 text-left"
                              onClick={() => setExpandedSeo(expandedSeo === post.id ? null : post.id)}
                              title="Click to see SEO details / live audit"
                            >
                              <span className={`inline-flex items-center gap-1 text-[11px] font-semibold border rounded px-1.5 py-0.5 leading-none ${seo.color}`}>
                                <TrendingUp size={11} />
                                {seo.score}
                              </span>
                              <div className="h-1.5 w-10 rounded-full bg-black/8 overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${seo.score >= 80 ? 'bg-emerald-500' : seo.score >= 50 ? 'bg-amber-400' : 'bg-red-400'}`}
                                  style={{ width: `${seo.score}%` }}
                                />
                              </div>
                            </button>
                          );
                        })()}
                        {auditingIds.has(post.id) && (
                          <div className="flex items-center gap-1 mt-1 text-[10px] text-[#aaa]">
                            <Loader2 size={9} className="animate-spin" /> auditing…
                          </div>
                        )}
                        {!auditingIds.has(post.id) && auditResults.has(post.id) && (() => {
                          const a = auditResults.get(post.id)!;
                          if (!a.ok) return <div className="mt-1 text-[10px] text-red-400">audit failed</div>;
                          if (a.issues.length === 0) return <div className="mt-1 text-[10px] text-emerald-600 font-medium">live ✓ all pass</div>;
                          return <div className="mt-1 text-[10px] text-red-500 font-medium">{a.issues.length} live issue{a.issues.length > 1 ? 's' : ''}</div>;
                        })()}
                      </td>

                      {/* GEO Score */}
                      <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                        {(() => {
                          const geo = computeGeoScore({
                            content: post.content,
                            schemaType: post.schemaType,
                            focusKeywords: post.focusKeywords,
                            metaTitle: post.metaTitle,
                            metaDescription: post.metaDescription,
                            hreflang: post.hreflang,
                            hasImage: !!post.coverImage,
                          });
                          return (
                            <button
                              className="flex items-center gap-1.5 text-left"
                              onClick={() => setExpandedGeo(expandedGeo === post.id ? null : post.id)}
                              title="Click to see GEO/AEO breakdown"
                            >
                              <span className={`inline-flex items-center gap-1 text-[11px] font-semibold border rounded px-1.5 py-0.5 leading-none ${geo.gradeColor}`}>
                                <Sparkles size={10} />
                                {geo.overall}
                              </span>
                              <div className="h-1.5 w-10 rounded-full bg-black/8 overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${geoScoreColor(geo.overall)}`}
                                  style={{ width: `${geo.overall}%` }}
                                />
                              </div>
                            </button>
                          );
                        })()}
                        {geoAuditingIds.has(post.id) && (
                          <div className="flex items-center gap-1 mt-1 text-[10px] text-[#aaa]">
                            <Loader2 size={9} className="animate-spin" /> auditing…
                          </div>
                        )}
                        {!geoAuditingIds.has(post.id) && liveGeoResults.has(post.id) && (() => {
                          const r = liveGeoResults.get(post.id)!;
                          if (!r.ok) return <div className="mt-1 text-[10px] text-red-400">audit failed</div>;
                          if (!r.warnings || r.warnings.length === 0) return <div className="mt-1 text-[10px] text-emerald-600 font-medium">live ✓</div>;
                          return <div className="mt-1 text-[10px] text-amber-600 font-medium">{r.warnings.length} warn</div>;
                        })()}
                      </td>

                      {/* Prose Score (Stop-Slop) */}
                      <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                        {(() => {
                          const slop = computeStopSlopScore(post.content);
                          return (
                            <button
                              className="flex items-center gap-1.5 text-left"
                              onClick={() => setExpandedStopSlop(expandedStopSlop === post.id ? null : post.id)}
                              title="Click to see Prose slop audit details"
                            >
                              <span className={`inline-flex items-center gap-1 text-[11px] font-semibold border rounded px-1.5 py-0.5 leading-none ${slop.gradeColor}`}>
                                <FileText size={10} />
                                {slop.score}
                              </span>
                              <div className="h-1.5 w-10 rounded-full bg-black/8 overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${slop.score >= 35 ? 'bg-emerald-500' : 'bg-red-500'}`}
                                  style={{ width: `${(slop.score / 50) * 100}%` }}
                                />
                              </div>
                            </button>
                          );
                        })()}
                      </td>

                      {/* Human Score (humanize-text) */}
                      <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                        {(() => {
                          const human = computeHumanizeScore(post.content || '');
                          return (
                            <button
                              className="flex items-center gap-1.5 text-left"
                              onClick={() => setExpandedHuman(expandedHuman === post.id ? null : post.id)}
                              title="Click to see AI-detectability analysis"
                            >
                              <span className={`inline-flex items-center gap-1 text-[11px] font-semibold border rounded px-1.5 py-0.5 leading-none ${human.gradeColor}`}>
                                <Sparkles size={10} />
                                {human.humanScore}
                              </span>
                              <div className="h-1.5 w-10 rounded-full bg-black/8 overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    human.humanScore >= 65 ? 'bg-emerald-500' :
                                    human.humanScore >= 45 ? 'bg-amber-400' : 'bg-red-500'
                                  }`}
                                  style={{ width: `${human.humanScore}%` }}
                                />
                              </div>
                            </button>
                          );
                        })()}
                      </td>

                      {/* Published */}
                      <td className="px-3 py-2.5 text-gray-500 whitespace-nowrap">
                        {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : '—'}
                      </td>

                      {/* Actions */}
                      <td className="px-3 py-2.5">
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            title="Copy URL"
                            onClick={() => copyUrl(post.slug, post.id)}
                            className="rounded p-1.5 text-[#bbb] hover:text-black hover:bg-black/5 transition-colors"
                          >
                            {copiedId === post.id ? <CheckCircle2 size={13} className="text-emerald-500" /> : <Copy size={13} />}
                          </button>
                          <a
                            href={`/blog/${post.slug}`}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded p-1.5 text-[#bbb] hover:text-black hover:bg-black/5 transition-colors"
                            title="Open live post"
                          >
                            <ExternalLink size={13} />
                          </a>
                          <button
                            title={post.status === 'published' ? 'Run live SEO audit' : 'Only published posts can be audited'}
                            onClick={() => runAudit(post)}
                            disabled={auditingIds.has(post.id) || post.status !== 'published'}
                            className="rounded p-1.5 text-[#bbb] hover:text-violet-600 hover:bg-violet-50 transition-colors disabled:opacity-30"
                          >
                            {auditingIds.has(post.id) ? <Loader2 size={13} className="animate-spin" /> : <ScanSearch size={13} />}
                          </button>
                          <button
                            onClick={() => openEdit(post)}
                            className="an-btn an-btn-ghost an-btn-sm"
                          >
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expandable GEO drawer */}
                    {expandedGeo === post.id && (() => {
                      const geo = computeGeoScore({
                        content: post.content,
                        schemaType: post.schemaType,
                        focusKeywords: post.focusKeywords,
                        metaTitle: post.metaTitle,
                        metaDescription: post.metaDescription,
                        hreflang: post.hreflang,
                        hasImage: !!post.coverImage,
                        ...(liveGeoResults.has(post.id) ? liveGeoResults.get(post.id) : {}),
                      });
                      const CATS: { key: keyof typeof geo.breakdown; label: string }[] = [
                        { key: 'aiCitability', label: 'AI Citability' },
                        { key: 'brandAuthority', label: 'Brand Authority' },
                        { key: 'contentEEAT', label: 'E-E-A-T' },
                        { key: 'technicalGEO', label: 'Technical GEO' },
                        { key: 'schemaStructuredData', label: 'Schema' },
                        { key: 'platformOptimization', label: 'Platforms' },
                      ];
                      const PLATFORMS: { key: keyof typeof geo.platformScores; label: string }[] = [
                        { key: 'googleAIOverviews', label: 'Google AIO' },
                        { key: 'chatGPT', label: 'ChatGPT' },
                        { key: 'perplexity', label: 'Perplexity' },
                        { key: 'gemini', label: 'Gemini' },
                        { key: 'bingCopilot', label: 'Bing' },
                      ];
                      return (
                        <tr className="border-b border-[var(--an-border)]">
                        <td colSpan={10} className="px-4 py-3 bg-gradient-to-r from-violet-50 to-blue-50">
                            <div className="flex flex-col gap-3">
                              {/* Header row */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Sparkles size={13} className="text-violet-500" />
                                  <span className="text-[12px] font-bold text-violet-800">GEO / AEO Score — {geo.grade}</span>
                                  <span className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[13px] font-black ${geo.gradeColor}`}>{geo.overall}/100</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  {post.status === 'published' && (
                                    <button
                                      onClick={async () => {
                                        setGeoAuditingIds((s) => new Set(s).add(post.id));
                                        try {
                                          const res = await fetch('/api/seo/geo-analyze', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ url: `${window.location.origin}/blog/${post.slug}` }),
                                          });
                                          const data = await res.json();
                                          setLiveGeoResults((m) => { const n = new Map(m); n.set(post.id, data); return n; });
                                        } catch { /* ignore */ } finally {
                                          setGeoAuditingIds((s) => { const n = new Set(s); n.delete(post.id); return n; });
                                        }
                                      }}
                                      disabled={geoAuditingIds.has(post.id)}
                                      className="text-[10px] font-semibold text-violet-600 border border-violet-200 hover:bg-violet-100 rounded px-2 py-0.5 transition-colors disabled:opacity-40"
                                    >
                                      {geoAuditingIds.has(post.id) ? <Loader2 size={10} className="animate-spin inline mr-1" /> : null}
                                      Live GEO Audit
                                    </button>
                                  )}
                                </div>
                              </div>

                              {/* Category breakdown */}
                              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                                {CATS.map(({ key, label }) => (
                                  <div key={key} className="bg-white border border-violet-100 rounded-lg p-2 text-center">
                                    <div className="text-[14px] font-black text-violet-700">{geo.breakdown[key]}</div>
                                    <div className="text-[9px] text-gray-500 mt-0.5 leading-tight">{label}</div>
                                    <div className="mt-1 w-full h-1 rounded-full bg-gray-100 overflow-hidden">
                                      <div className={`h-full rounded-full ${geoScoreColor(geo.breakdown[key])}`} style={{ width: `${geo.breakdown[key]}%` }} />
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {/* Platform scores */}
                              <div className="flex flex-wrap gap-2">
                                {PLATFORMS.map(({ key, label }) => (
                                  <div key={key} className="flex items-center gap-1.5 bg-white border border-blue-100 rounded-lg px-2 py-1">
                                    <span className="text-[10px] text-gray-500">{label}</span>
                                    <div className="h-1 w-12 rounded-full bg-gray-100 overflow-hidden">
                                      <div className={`h-full rounded-full ${geoScoreColor(geo.platformScores[key])}`} style={{ width: `${geo.platformScores[key]}%` }} />
                                    </div>
                                    <span className="text-[10px] font-bold text-gray-700">{geo.platformScores[key]}</span>
                                  </div>
                                ))}
                              </div>

                              {/* Live audit signals (if ran) */}
                              {liveGeoResults.has(post.id) && liveGeoResults.get(post.id)?.ok && liveGeoResults.get(post.id)?.warnings?.length > 0 && (
                                <div className="flex flex-wrap gap-x-4 gap-y-1">
                                  {liveGeoResults.get(post.id)!.warnings.map((w: string) => (
                                    <span key={w} className="text-[10px] text-amber-700">⚠ {w}</span>
                                  ))}
                                </div>
                              )}

                              {/* Top recommendations */}
                              {geo.recommendations.slice(0, 4).map((r, i) => (
                                <div key={i} className="text-[10px] text-violet-800 flex items-start gap-1">
                                  <span className="text-violet-400 mt-0.5 flex-shrink-0">→</span>{r}
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      );
                    })()}

                    {/* Expandable Human Score drawer */}
                    {expandedHuman === post.id && (() => {
                      const human = computeHumanizeScore(post.content || '');
                      return (
                        <tr className="border-b border-[var(--an-border)]">
                          <td colSpan={10} className="px-4 py-3 bg-gradient-to-r from-indigo-50 to-purple-50">
                            <div className="flex flex-col gap-3">
                              {/* Header */}
                              <div className="flex items-center gap-2">
                                <Sparkles size={13} className="text-indigo-500" />
                                <span className="text-[12px] font-bold text-indigo-900">AI Detectability Analysis (humanize-text) — {human.grade}</span>
                                <span className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[13px] font-black ${human.gradeColor}`}>{human.humanScore}/100</span>
                                <span className="ml-auto text-[10px] text-indigo-500">{human.signals.wordCount} words · avg sent {human.signals.avgSentenceLength}w · TTR {(human.signals.ttr * 100).toFixed(0)}% · σ={human.signals.sentenceLengthVariance}w</span>
                              </div>
                              {/* Signals bar row */}
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {[
                                  { label: 'Vocab Diversity (TTR)', value: Math.round(human.signals.ttr * 100), unit: '%', threshold: 55 },
                                  { label: 'Sentence Variance (σ)', value: human.signals.sentenceLengthVariance, unit: 'w', threshold: 3 },
                                  { label: 'Burstiness', value: Math.round(human.signals.burstiness * 100), unit: '%', threshold: 30 },
                                  { label: 'Avg Sentence', value: human.signals.avgSentenceLength, unit: 'w', threshold: null },
                                ].map(({ label, value, unit, threshold }) => (
                                  <div key={label} className="bg-white border border-indigo-100 rounded-lg p-2">
                                    <div className="text-[9px] font-semibold text-indigo-400 uppercase tracking-wide">{label}</div>
                                    <div className={`text-[18px] font-black mt-0.5 ${
                                      threshold === null ? 'text-indigo-700' :
                                      value >= threshold ? 'text-emerald-600' : 'text-red-500'
                                    }`}>{value}<span className="text-[11px] font-normal opacity-60">{unit}</span></div>
                                  </div>
                                ))}
                              </div>
                              {/* Issues and good */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {human.issues.length > 0 && (
                                  <div className="space-y-1">
                                    <div className="text-[10px] font-bold uppercase tracking-wide text-red-600">AI Signals Detected</div>
                                    <ul className="space-y-0.5">
                                      {human.issues.map((iss) => (
                                        <li key={iss} className="text-[11px] text-red-700 flex items-start gap-1">
                                          <span className="text-red-400 mt-0.5">•</span>{iss}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                {human.good.length > 0 && (
                                  <div className="space-y-1">
                                    <div className="text-[10px] font-bold uppercase tracking-wide text-emerald-600">Human Signals</div>
                                    <ul className="space-y-0.5">
                                      {human.good.map((g) => (
                                        <li key={g} className="text-[11px] text-emerald-700 flex items-start gap-1">
                                          <span className="text-emerald-400 mt-0.5">✓</span>{g}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                              {/* AI Vocab replacement table */}
                              {human.aiVocabHits.length > 0 && (
                                <div>
                                  <div className="text-[10px] font-bold uppercase tracking-wide text-indigo-700 mb-1.5">AI Vocabulary — Suggested Replacements</div>
                                  <div className="flex flex-wrap gap-2">
                                    {human.aiVocabHits.map(({ word, replacements, count }) => (
                                      <div key={word} className="bg-white border border-indigo-100 rounded-lg px-2 py-1.5 text-[11px]">
                                        <span className="font-semibold text-red-600">{word}</span>
                                        {count > 1 && <span className="text-[10px] text-red-400 ml-0.5">×{count}</span>}
                                        <span className="text-indigo-300 mx-1">→</span>
                                        <span className="text-emerald-700">{replacements.slice(0, 2).join(', ')}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })()}

                    {/* Expandable Stop-Slop Prose Audit drawer */}
                    {expandedStopSlop === post.id && (() => {
                      const slop = computeStopSlopScore(post.content);
                      const DIMS: { key: keyof typeof slop.dimensions; label: string; desc: string }[] = [
                        { key: 'directness', label: 'Directness', desc: 'No throat-clearing openers or announcements' },
                        { key: 'rhythm', label: 'Rhythm', desc: 'Varied sentence length, no monotonous meters' },
                        { key: 'trust', label: 'Reader Trust', desc: 'Active voice, no passive constructs' },
                        { key: 'authenticity', label: 'Human Voice', desc: 'Free of AI tells ("delve", "tapestry")' },
                        { key: 'density', label: 'Density', desc: 'Dense and direct, no adverb filler' },
                      ];
                      return (
                        <tr className="border-b border-[var(--an-border)]">
                          <td colSpan={10} className="px-4 py-3 bg-gradient-to-r from-slate-50 to-zinc-100">
                            <div className="flex flex-col gap-3">
                              {/* Header row */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <FileText size={13} className="text-slate-500" />
                                  <span className="text-[12px] font-bold text-slate-800">Prose Quality Audit (Stop-Slop Rules) — {slop.grade}</span>
                                  <span className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[13px] font-black ${slop.gradeColor}`}>{slop.score}/50</span>
                                </div>
                              </div>

                              {/* Dimensions grid */}
                              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                                {DIMS.map(({ key, label, desc }) => (
                                  <div key={key} className="bg-white border border-slate-200 rounded-lg p-2 flex flex-col justify-between">
                                    <div>
                                      <div className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide">{label}</div>
                                      <div className="text-[8px] text-slate-500 leading-tight mt-0.5">{desc}</div>
                                    </div>
                                    <div className="mt-2">
                                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                                        <span>Score</span>
                                        <span>{slop.dimensions[key]}/10</span>
                                      </div>
                                      <div className="w-full h-1 bg-slate-100 rounded-full mt-0.5 overflow-hidden">
                                        <div
                                          className={`h-full rounded-full ${slop.dimensions[key] >= 8 ? 'bg-emerald-500' : slop.dimensions[key] >= 5 ? 'bg-amber-400' : 'bg-red-400'}`}
                                          style={{ width: `${slop.dimensions[key] * 10}%` }}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {/* Detections list */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
                                {/* Issues column */}
                                {slop.issues.length > 0 && (
                                  <div className="space-y-1">
                                    <div className="text-[10px] font-bold uppercase tracking-wide text-red-600">Revisions Needed</div>
                                    <ul className="space-y-0.5">
                                      {slop.issues.map((iss) => (
                                        <li key={iss} className="text-[11px] text-red-700 flex items-start gap-1">
                                          <span className="text-red-400 mt-0.5">•</span>{iss}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {/* Good signals column */}
                                {slop.good.length > 0 && (
                                  <div className="space-y-1">
                                    <div className="text-[10px] font-bold uppercase tracking-wide text-emerald-600">Passing Patterns</div>
                                    <ul className="space-y-0.5">
                                      {slop.good.map((gd) => (
                                        <li key={gd} className="text-[11px] text-emerald-700 flex items-start gap-1">
                                          <span className="text-emerald-400 mt-0.5">✓</span>{gd}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })()}

                    {/* Expandable SEO + Live Audit drawer */}
                    {expandedSeo === post.id && (
                      <tr className="border-b border-[var(--an-border)]">
                        <td colSpan={10} className="px-4 py-3 bg-[#fafafa]">
                          <div className="flex flex-col gap-3">
                            {/* Static SEO analysis */}
                            {(() => {
                              const seo = computeSeo(post as any);
                              return seo.issues.length > 0 ? (
                                <div className="flex items-start gap-2">
                                  <AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" />
                                  <div>
                                    <div className="text-[11px] font-semibold text-amber-800 mb-1">Static Analysis · {seo.score}/100</div>
                                    <ul className="flex flex-wrap gap-x-4 gap-y-1">
                                      {seo.issues.map((issue) => (
                                        <li key={issue} className="text-[11px] text-amber-700">· {issue}</li>
                                      ))}
                                    </ul>
                                    {seo.good.length > 0 && (
                                      <ul className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                                        {seo.good.map((g) => (
                                          <li key={g} className="text-[11px] text-emerald-700">✓ {g}</li>
                                        ))}
                                      </ul>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 text-[11px] text-emerald-700">
                                  <CheckCircle2 size={13} className="text-emerald-500" />
                                  Static analysis: {seo.score}/100 — no issues
                                </div>
                              );
                            })()}

                            {/* Live audit results */}
                            {auditResults.has(post.id) && (() => {
                              const audit = auditResults.get(post.id)!;
                              return (
                                <div className="rounded-lg border border-[var(--an-border)] bg-white p-3 space-y-2">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-violet-700">
                                      <ScanSearch size={12} />
                                      Live Page Audit
                                      {audit.auditedAt && (
                                        <span className="text-[10px] text-[#aaa] font-normal ml-1">
                                          · {new Date(audit.auditedAt).toLocaleTimeString()}
                                        </span>
                                      )}
                                    </div>
                                    <button
                                      onClick={() => runAudit(post)}
                                      disabled={auditingIds.has(post.id)}
                                      className="text-[10px] text-violet-600 hover:underline disabled:opacity-40"
                                    >
                                      {auditingIds.has(post.id) ? 'Auditing…' : 'Re-run'}
                                    </button>
                                  </div>
                                  {!audit.ok ? (
                                    <p className="text-[11px] text-red-600">{audit.error || audit.issues[0] || 'Audit failed — post may not be published yet'}</p>
                                  ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                      {audit.issues.length > 0 && (
                                        <div>
                                          <div className="text-[10px] font-semibold uppercase tracking-wide text-red-600 mb-1">Issues</div>
                                          <ul className="space-y-0.5">
                                            {audit.issues.map((issue) => (
                                              <li key={issue} className="text-[11px] text-red-700 flex items-start gap-1">
                                                <span className="text-red-400 mt-0.5">✗</span>{issue}
                                              </li>
                                            ))}
                                          </ul>
                                        </div>
                                      )}
                                      {audit.good.length > 0 && (
                                        <div>
                                          <div className="text-[10px] font-semibold uppercase tracking-wide text-emerald-600 mb-1">Passing</div>
                                          <ul className="space-y-0.5">
                                            {audit.good.map((g) => (
                                              <li key={g} className="text-[11px] text-emerald-700 flex items-start gap-1">
                                                <span className="text-emerald-400 mt-0.5">✓</span>{g}
                                              </li>
                                            ))}
                                          </ul>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })()}

                            {/* Auditing in-progress state */}
                            {auditingIds.has(post.id) && (
                              <div className="flex items-center gap-1.5 text-[11px] text-[#888]">
                                <Loader2 size={11} className="animate-spin" /> Fetching live page…
                              </div>
                            )}

                            {/* Not yet audited */}
                            {!auditResults.has(post.id) && !auditingIds.has(post.id) && post.status === 'published' && (
                              <div className="text-[11px] text-[#aaa]">
                                {auditProgress ? (
                                  <span className="flex items-center gap-1.5"><Loader2 size={10} className="animate-spin" /> In audit queue…</span>
                                ) : (
                                  <button onClick={() => runAudit(post)} className="text-violet-600 hover:underline">
                                    Click to run live audit
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab contents: Categories */}
      {tab === 'categories' && (
        <div className="an-card p-4 space-y-4">
          <div className="flex items-center gap-2">
            <FolderTree size={15} className="text-[var(--an-text2)]" />
            <input
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addCategory()}
              placeholder="New category name…"
              className="flex-1 rounded-lg border border-[var(--an-border)] px-3 py-2 text-[13px] outline-none focus:border-black/40"
            />
            <button onClick={addCategory} className="an-btn an-btn-primary an-btn-sm">
              <Plus size={14} /> Add Category
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-[var(--an-border)] bg-[var(--an-surface,#fafafa)]">
                  <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-[#888]">Name</th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-[#888]">Slug</th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-[#888]">Posts Count</th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-[#888]"></th>
                </tr>
              </thead>
              <tbody>
                {categories.map((c) => (
                  <tr key={c.id} className="border-b border-[var(--an-border)] hover:bg-black/[0.01]">
                    <td className="px-3 py-2.5 font-medium">{c.name}</td>
                    <td className="px-3 py-2.5 text-gray-500 font-mono">/blog/category/{c.slug}</td>
                    <td className="px-3 py-2.5 text-gray-500">{c._count?.posts ?? 0} posts</td>
                    <td className="px-3 py-2.5 text-right">
                      <button
                        className="rounded p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        onClick={() => deleteCategory(c.id)}
                        title="Delete category"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
                {categories.length === 0 && (
                  <tr><td colSpan={4} className="text-center text-sm text-[#888] py-6">No categories yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab contents: Tags */}
      {tab === 'tags' && (
        <div className="an-card p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Tag size={15} className="text-[var(--an-text2)]" />
            <input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addTag()}
              placeholder="New tag name…"
              className="flex-1 rounded-lg border border-[var(--an-border)] px-3 py-2 text-[13px] outline-none focus:border-black/40"
            />
            <button onClick={addTag} className="an-btn an-btn-primary an-btn-sm">
              <Plus size={14} /> Add Tag
            </button>
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            {tags.map((t) => (
              <span
                key={t.id}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--an-border)] bg-white px-3 py-1.5 text-[12px] font-medium text-gray-700 shadow-sm"
              >
                {t.name}
                <span className="bg-gray-100 text-gray-500 rounded-full px-1.5 py-0.5 text-[10px] font-bold">
                  {t._count?.posts ?? 0}
                </span>
                <button
                  onClick={() => deleteTag(t.id)}
                  className="text-gray-400 hover:text-red-600 transition-colors"
                  title="Delete Tag"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
            {tags.length === 0 && <div className="text-sm text-[#888] p-4">No tags yet.</div>}
          </div>
        </div>
      )}

      {/* Floating Dashboard bulk actions bar */}
      {selectedPostIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-black text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-4 text-[13px] border border-white/10">
          <span className="font-medium">{selectedPostIds.size} post{selectedPostIds.size > 1 ? 's' : ''} selected</span>
          <div className="h-4 w-px bg-white/20" />
          <div className="flex gap-2">
            <button
              onClick={() => handleBulkStatus('published')}
              className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg transition-colors font-medium"
            >
              Publish
            </button>
            <button
              onClick={() => handleBulkStatus('draft')}
              className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg transition-colors font-medium"
            >
              Draft
            </button>
            <button
              onClick={() => handleBulkStatus('archived')}
              className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg transition-colors font-medium"
            >
              Archive
            </button>
            <button
              onClick={handleBulkDelete}
              className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded-lg transition-colors font-medium"
            >
              Delete
            </button>
            <button
              onClick={() => exportSeoReport('selected')}
              className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg transition-colors font-medium flex items-center gap-1.5"
            >
              <Download size={12} /> Export SEO
            </button>
            <button
              onClick={() => setSelectedPostIds(new Set())}
              className="px-2 py-1 text-white/50 hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Media Selector Library Modal Component ───────────────────────────────────

interface MediaSelectorModalProps {
  onClose: () => void;
  onSelect: (url: string) => void;
}

const MediaSelectorModal: React.FC<MediaSelectorModalProps> = ({ onClose, onSelect }) => {
  const [mediaList, setMediaList] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'library' | 'upload'>('library');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchMedia = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminFetch<{ media: MediaAsset[] }>('/cms/media');
      setMediaList(data.media || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch media assets');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'library') fetchMedia();
  }, [activeTab, fetchMedia]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('altText', file.name.split('.')[0]);

    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${API_BASE_URL}/cms/media`, {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || 'Upload failed');
      }

      const data = await response.json();
      if (data.media?.url) {
        setMediaList((prev) => [data.media, ...prev]);
        onSelect(data.media.url);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const filteredMedia = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return mediaList;
    return mediaList.filter((m) =>
      [m.altText, m.caption, m.url].some((v) => String(v || '').toLowerCase().includes(needle))
    );
  }, [mediaList, search]);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl h-[80vh] flex flex-col shadow-2xl overflow-hidden border border-gray-100 animate-fade-in" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="border-b border-gray-200 px-5 py-4 flex items-center justify-between flex-shrink-0">
          <h2 className="text-[16px] font-bold text-gray-800">Media Selector</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-black">
            <X size={18} />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="border-b border-gray-100 px-5 flex items-center justify-between flex-shrink-0 bg-gray-50/50">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('library')}
              className={`px-4 py-2.5 text-[12px] font-semibold border-b-2 -mb-px transition-colors ${activeTab === 'library' ? 'border-black text-black' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
            >
              Media Library
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              className={`px-4 py-2.5 text-[12px] font-semibold border-b-2 -mb-px transition-colors ${activeTab === 'upload' ? 'border-black text-black' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
            >
              Upload Files
            </button>
          </div>

          {activeTab === 'library' && (
            <div className="relative py-1.5">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search assets…"
                className="rounded-lg border border-gray-200 bg-white py-1 pl-8 pr-2.5 text-[11px] outline-none w-48 focus:border-black/35"
              />
            </div>
          )}
        </div>

        {/* Modal content body */}
        <div className="flex-1 overflow-y-auto p-5 min-h-0 bg-white">
          {error && (
            <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-[12px] text-red-700">{error}</div>
          )}

          {activeTab === 'library' ? (
            loading ? (
              <div className="h-full flex items-center justify-center text-gray-400 text-[13px] gap-2">
                <Loader2 size={16} className="animate-spin" /> Loading library…
              </div>
            ) : filteredMedia.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 text-[13px] gap-2 p-10">
                <ImageIcon size={24} className="opacity-50" />
                No assets found. Try uploading some files!
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {filteredMedia.map((media) => (
                  <div
                    onClick={() => onSelect(media.url)}
                    className="aspect-square bg-gray-50 border border-gray-100 hover:border-black rounded-lg overflow-hidden cursor-pointer transition-all shadow-sm group relative"
                    title={media.altText || 'Select Asset'}
                    key={media.id}
                  >
                    <img src={media.url} alt={media.altText || ''} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                    {media.format && (
                      <span className="absolute bottom-1 right-1 bg-black/60 text-[9px] font-bold text-white px-1 py-0.5 rounded leading-none uppercase">
                        {media.format}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-8">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*"
                className="hidden"
              />
              <div
                onClick={() => !uploading && fileInputRef.current?.click()}
                className={`w-full max-w-md border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all gap-3 ${uploading ? 'bg-gray-50 border-gray-200' : 'bg-gray-50/50 hover:bg-gray-50 border-gray-300 hover:border-black'}`}
              >
                {uploading ? (
                  <>
                    <Loader2 size={32} className="animate-spin text-black" />
                    <div>
                      <div className="font-bold text-[14px] text-gray-800">Uploading File…</div>
                      <div className="text-[11px] text-gray-400 mt-1">Transmitting image payload to secure Cloudinary servers</div>
                    </div>
                  </>
                ) : (
                  <>
                    <ImageIcon size={32} className="text-gray-400" />
                    <div>
                      <div className="font-bold text-[14px] text-gray-800">Select files to upload</div>
                      <div className="text-[11px] text-gray-400 mt-1">Supports PNG, JPG, GIF, WebP (up to 10MB)</div>
                    </div>
                    <button className="an-btn an-btn-primary an-btn-sm h-8 mt-2 px-4">Choose File</button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BlogPostsPage;
