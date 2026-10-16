import React from 'react';
import { useParams, Link, Navigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Bookmark, BookmarkCheck, Copy, ExternalLink, Share2, Rss } from 'lucide-react';
import { useBlogFeed } from '../hooks/useBlogPosts';
import { SERVICES } from '../data/services';
import { absoluteCanonicalUrl } from '../utils/seo';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { NEWSLETTER_EMAIL } from '../constants/contact';
import {
  extractToc,
  getReaderPrefs,
  getSavedSlugs,
  inferCtaType,
  pushReadingHistory,
  readMinutesToNumber,
  setReaderPrefs,
  slugifyHeading,
  toggleSavedSlug,
  topicLabel,
  getTopicPastel,
  type ReaderPrefs,
} from '../utils/blog';

const fontSizeClass: Record<ReaderPrefs['fontSize'], string> = {
  s: 'text-[17px] sm:text-[18px]',
  m: 'text-[18px] sm:text-[21px]',
  l: 'text-[20px] sm:text-[23px]',
};

const lineHeightClass: Record<ReaderPrefs['lineHeight'], string> = {
  normal: 'leading-[1.75] sm:leading-[1.8]',
  relaxed: 'leading-[1.9] sm:leading-[2]',
};

const InsightDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { posts: BLOG_POSTS, loaded } = useBlogFeed();
  const post = BLOG_POSTS.find((p) => p.slug === slug);
  const [searchParams] = useSearchParams();
  const [prefs, setPrefs] = React.useState<ReaderPrefs>(() => getReaderPrefs());
  const [saved, setSaved] = React.useState<string[]>([]);
  const [progress, setProgress] = React.useState(0);
  const [activeHeading, setActiveHeading] = React.useState('');
  const [feedback, setFeedback] = React.useState<'yes' | 'no' | ''>('');
  const [feedbackNote, setFeedbackNote] = React.useState('');
  const [actionMessage, setActionMessage] = React.useState('');
  const [subEmail, setSubEmail] = React.useState('');
  const [subStatus, setSubStatus] = React.useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  const [subMessage, setSubMessage] = React.useState('');
  const [relatedFromApi, setRelatedFromApi] = React.useState<typeof BLOG_POSTS>([]);

  // Every hook below must run on every render, even while the post is loading
  // or missing — an early return above a hook crashes React the moment `post`
  // appears and the hook count changes between renders.
  const toc = React.useMemo(() => (post ? extractToc(post.content) : []), [post?.content]);

  React.useEffect(() => {
    if (!post) return;
    setSaved(getSavedSlugs());
    pushReadingHistory(post.slug);
  }, [post?.slug]);

  React.useEffect(() => {
    setReaderPrefs(prefs);
  }, [prefs]);

  React.useEffect(() => {
    const handleScroll = () => {
      const doc = document.documentElement;
      const total = doc.scrollHeight - window.innerHeight;
      const pct = total > 0 ? Math.min(100, Math.max(0, (window.scrollY / total) * 100)) : 0;
      setProgress(pct);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  React.useEffect(() => {
    if (!toc.length) return;
    const nodes = toc
      .map((item) => document.getElementById(item.id))
      .filter(Boolean) as HTMLElement[];
    if (!nodes.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveHeading((visible[0].target as HTMLElement).id);
      },
      { rootMargin: '-20% 0px -60% 0px', threshold: [0, 1] }
    );
    nodes.forEach((n) => observer.observe(n));
    return () => observer.disconnect();
  }, [post?.slug, toc.length]);

  React.useEffect(() => {
    if (!actionMessage) return;
    const timer = window.setTimeout(() => setActionMessage(''), 2200);
    return () => window.clearTimeout(timer);
  }, [actionMessage]);

  // Fetch API-driven related posts when the slug changes
  React.useEffect(() => {
    if (!slug) return;
    const API_BASE = import.meta.env.VITE_API_URL || '';
    fetch(`${API_BASE}/api/blog/posts/${slug}/related`)
      .then((r) => r.ok ? r.json() : { posts: [] })
      .then(({ posts }) => setRelatedFromApi(posts ?? []))
      .catch(() => {});
  }, [slug]);

  // Show subscription confirmation/unsubscribe toast from URL params
  React.useEffect(() => {
    const sub = searchParams.get('sub');
    if (!sub) return;
    const messages: Record<string, string> = {
      confirmed: 'Subscription confirmed! You\'ll receive future posts.',
      unsubscribed: 'You\'ve been unsubscribed.',
      invalid: 'That confirmation link is no longer valid.',
    };
    if (messages[sub]) setActionMessage(messages[sub]);
  }, []);

  // Custom JSON-LD from the CMS — validate before injecting so a typo can't break the page.
  const customSchema = React.useMemo(() => {
    if (!post?.schemaMarkup) return null;
    try {
      const parsed = JSON.parse(post.schemaMarkup);
      return parsed && typeof parsed === 'object' ? JSON.stringify(parsed) : null;
    } catch {
      return null;
    }
  }, [post?.schemaMarkup]);

  const faqItems = React.useMemo(() => {
    if (!post) return [] as Array<{ question: string; answer: string }>;
    const faqMatch = post.content.match(/##\s+FAQ\s*\n([\s\S]*)$/i);
    if (!faqMatch) return [];
    return Array.from(faqMatch[1].matchAll(/###\s+(.+)\n([\s\S]*?)(?=\n###\s+|$)/g)).map((match) => ({
      question: match[1].trim(),
      answer: match[2].replace(/\n+/g, ' ').trim(),
    })).filter((item) => item.question && item.answer);
  }, [post?.content]);

  if (!post) {
    // Wait for the CMS fetch before deciding the post doesn't exist —
    // otherwise every post published after the last deploy bounces to /blog.
    if (!loaded) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-secondary)]">
          <div className="text-[14px] font-semibold text-black/40 animate-pulse">Loading article…</div>
        </div>
      );
    }
    return <Navigate to="/blog" replace />;
  }

  const relatedByTopic = BLOG_POSTS.filter((p) => p.slug !== post.slug && p.topic === post.topic).slice(0, 3);
  const popularPosts = BLOG_POSTS.filter((p) => p.slug !== post.slug).sort((a, b) => (b.id % 9) - (a.id % 9)).slice(0, 3);
  const updatedPosts = BLOG_POSTS.filter((p) => p.slug !== post.slug).sort((a, b) => Date.parse(b.updatedAt || b.date) - Date.parse(a.updatedAt || a.date)).slice(0, 3);
  const fallbackNext = BLOG_POSTS.find((p) => p.slug !== post.slug);
  const nextPost = relatedByTopic[0] || fallbackNext;
  const canonical = absoluteCanonicalUrl(`/blog/${post.canonicalSlug || post.slug}`);
  const readMins = readMinutesToNumber(post.readTime);
  const ctaType = post.ctaType || inferCtaType(post);

  const remainingMinutes = Math.max(1, Math.round(readMins * (1 - progress / 100)));

  const currentSeries = post.seriesId
    ? BLOG_POSTS.filter((p) => p.seriesId === post.seriesId).sort((a, b) => (a.seriesOrder || 0) - (b.seriesOrder || 0))
    : [];
  const seriesIndex = currentSeries.findIndex((p) => p.slug === post.slug);
  const prevSeries = seriesIndex > 0 ? currentSeries[seriesIndex - 1] : null;
  const nextSeries = seriesIndex >= 0 && seriesIndex < currentSeries.length - 1 ? currentSeries[seriesIndex + 1] : null;

  const handleCopyLink = async (id: string) => {
    const url = `${window.location.origin}/blog/${post.slug}#${id}`;
    try {
      await navigator.clipboard.writeText(url);
      setActionMessage('Heading link copied.');
    } catch {
      setActionMessage('Could not copy link. Please copy manually from address bar.');
    }
  };

  const handleSave = () => {
    const next = toggleSavedSlug(post.slug);
    setSaved(next);
    setActionMessage(next.includes(post.slug) ? 'Article saved.' : 'Article removed from saved.');
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subEmail) return;
    setSubStatus('loading');
    try {
      const API_BASE = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${API_BASE}/api/blog/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: subEmail }),
      });
      const data = await res.json();
      setSubStatus('ok');
      setSubMessage(data.message || 'Check your inbox to confirm.');
    } catch {
      setSubStatus('error');
      setSubMessage('Something went wrong. Please try again.');
    }
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: post.title, url: shareUrl });
        setActionMessage('Share dialog opened.');
        return;
      }
      await navigator.clipboard.writeText(shareUrl);
      setActionMessage('Link copied to clipboard.');
    } catch {
      setActionMessage('Could not share automatically. Please copy the URL manually.');
    }
  };

  const ctaHref = ctaType === 'quote' ? '/quote-builder' : ctaType === 'trial' ? '/free-trial' : '/contact';
  const ctaLabel = ctaType === 'quote' ? 'Request Sample Pricing' : ctaType === 'trial' ? 'Start Free Trial' : 'Book a 15-min Audit';

  // Yoast-style fallback chain: custom meta from the CMS wins, sensible defaults otherwise.
  const seoTitle = post.metaTitle || `${post.title} | Reframe Visuals`;
  const seoDescription = post.metaDescription || post.excerpt;
  const seoKeywords = (post.focusKeywords || '').split(',').map((k) => k.trim()).filter(Boolean);
  const geoRegions = (post.geoRegions || '').split(',').map((r) => r.trim()).filter(Boolean);
  const hreflang = post.hreflang || 'en';

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': post.schemaType || 'BlogPosting',
    headline: post.title,
    description: seoDescription,
    ...(seoKeywords.length > 0 && { keywords: seoKeywords.join(', ') }),
    ...(geoRegions.length > 0 && {
      spatialCoverage: geoRegions.map((region) => ({ '@type': 'Place', name: region })),
    }),
    inLanguage: hreflang,
    datePublished: post.date,
    dateModified: post.updatedAt || post.date,
    author: {
      '@type': 'Organization',
      '@id': 'https://reframevisuals.com/#organization',
      name: 'Reframe Editorial Team',
      url: 'https://reframevisuals.com/blog',
    },
    publisher: {
      '@type': 'Organization',
      '@id': 'https://reframevisuals.com/#organization',
      name: 'Reframe Visuals',
      url: 'https://reframevisuals.com',
      logo: { '@type': 'ImageObject', url: 'https://reframevisuals.com/logo.svg', width: 300, height: 100 },
    },
    mainEntityOfPage: canonical,
    image: [post.image],
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: ['.article-summary', 'h1', 'h2'],
    },
  };
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: absoluteCanonicalUrl('/') },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: absoluteCanonicalUrl('/blog') },
      { '@type': 'ListItem', position: 3, name: post.title, item: canonical },
    ],
  };
  const faqJsonLd = faqItems.length
    ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqItems.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.answer,
          },
        })),
      }
    : null;

  return (
    <div className="min-h-screen bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] antialiased" style={{ fontFamily: "Inter, 'Helvetica Neue', Arial, sans-serif" }}>
      <Helmet>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDescription} />
        {seoKeywords.length > 0 && <meta name="keywords" content={seoKeywords.join(', ')} />}
        <meta name="robots" content="index,follow" />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={canonical} />
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDescription} />
        <meta property="og:image" content={post.image} />
        <meta property="og:locale" content={hreflang.replace('-', '_')} />
        {geoRegions.length > 0 && <meta name="geo.placename" content={geoRegions.join(', ')} />}
        <link rel="canonical" href={canonical} />
        <link rel="alternate" hrefLang={hreflang} href={canonical} />
        <link rel="alternate" hrefLang="x-default" href={canonical} />
        <script type="application/ld+json">{JSON.stringify(articleJsonLd)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbJsonLd)}</script>
        {faqJsonLd ? <script type="application/ld+json">{JSON.stringify(faqJsonLd)}</script> : null}
        {customSchema ? <script type="application/ld+json">{customSchema}</script> : null}
      </Helmet>

      <div className="fixed top-0 left-0 z-[260] h-1 bg-[var(--color-text-primary)]" style={{ width: `${progress}%` }} />

      <nav className="px-6 py-4 bg-white border-b border-black/[0.03] sticky top-0 z-[240]">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="text-[13px] font-black uppercase tracking-tighter hover:text-brand transition-colors">
              Reframe Visuals
            </Link>
            <a
              href="/api/blog/rss"
              title="Subscribe via RSS"
              className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-black/35 hover:text-orange-500 transition-colors"
            >
              <Rss size={13} />
              RSS
            </a>
          </div>
          <div className="hidden md:flex items-center gap-4">
            <span className="text-[12px] text-black/40">{remainingMinutes} min left</span>
            <button
              onClick={handleSave}
              className="inline-flex items-center gap-1 rounded-full border border-black/10 px-3 py-1.5 text-[12px] font-semibold hover:bg-black/5"
            >
              {saved.includes(post.slug) ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
              Save
            </button>
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1 rounded-full border border-black/10 px-3 py-1.5 text-[12px] font-semibold hover:bg-black/5"
            >
              <Share2 size={14} />
              Share
            </button>
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(window.location.href)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-full border border-black/10 px-3 py-1.5 text-[12px] font-semibold hover:bg-black/5 transition-colors"
            >
              𝕏
            </a>
            <a
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-full border border-black/10 px-3 py-1.5 text-[12px] font-semibold hover:bg-black/5 transition-colors"
            >
              in
            </a>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14 lg:py-20">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 items-start">
          <article className="flex-1 w-full max-w-[700px] min-w-0">
            <header className="mb-14">
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <Link to="/blog" className="text-[11px] uppercase font-bold tracking-wider text-black/40 hover:text-black">Blog</Link>
                <span className="text-black/20">•</span>
                <Link to={`/blog/topic/${post.topic}`} className={`inline-flex items-center px-2.5 py-1 rounded-full border text-[10px] sm:text-[11px] uppercase font-bold tracking-widest transition-all ${getTopicPastel(post.topic)}`}>
                  {topicLabel(post.topic)}
                </Link>
              </div>
              <h1 className="font-heading text-[30px] sm:text-[36px] md:text-[52px] font-black leading-[1.1] tracking-tight mb-6 text-black break-words">{post.title}</h1>
              <div className="flex flex-wrap items-center gap-3 text-[13px] sm:text-[14px] text-black/40 font-medium italic">
                <span>By Reframe Editorial Team</span>
                <span>·</span>
                <span>{post.date}</span>
                <span>·</span>
                <span>Updated {post.updatedAt || post.date}</span>
              </div>
            </header>

            <figure className="mb-10 overflow-hidden rounded-3xl border border-black/10 bg-white shadow-sm">
              <img src={post.image} alt={post.imageAlt || `${post.title} cover image`} className="w-full aspect-[16/10] object-cover" loading="eager" />
              {post.imageCaption && (
                <figcaption className="px-5 py-3 text-[13px] text-black/50">
                  {post.imageCaption}
                </figcaption>
              )}
            </figure>

            <div className="mb-8 rounded-2xl border border-black/10 bg-white p-4 flex flex-wrap gap-2 items-center">
              <span className="text-[12px] font-semibold text-black/60">Reading view</span>
              <div className="flex gap-2">
                {(['s', 'm', 'l'] as const).map((size) => (
                  <button
                    key={size}
                    onClick={() => setPrefs((p) => ({ ...p, fontSize: size }))}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${prefs.fontSize === size ? 'bg-black text-white border-black' : 'border-black/15 text-black/60'}`}
                  >
                    {size.toUpperCase()}
                  </button>
                ))}
                {(['normal', 'relaxed'] as const).map((height) => (
                  <button
                    key={height}
                    onClick={() => setPrefs((p) => ({ ...p, lineHeight: height }))}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${prefs.lineHeight === height ? 'bg-black text-white border-black' : 'border-black/15 text-black/60'}`}
                  >
                    {height}
                  </button>
                ))}
              </div>
            </div>

            <main className="prose prose-neutral max-w-none">
              <div className="mb-8 rounded-2xl border border-black/10 bg-[var(--color-bg-secondary)] p-5">
                <p className="text-[16px] text-black/70 mb-3">See this technique in our production workflow.</p>
                <Link to={ctaHref} className="inline-flex items-center gap-2 text-[14px] font-bold uppercase tracking-wider text-white bg-[var(--color-text-primary)] px-4 py-2 rounded-full">
                  {ctaLabel} <ExternalLink size={12} />
                </Link>
              </div>

              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  p: ({ node, ...props }) => (
                    <p className={`${fontSizeClass[prefs.fontSize]} ${lineHeightClass[prefs.lineHeight]} text-[#292929] mb-7 sm:mb-8 break-words`} style={{ fontFamily: "'Charter', 'Bitstream Charter', 'Sitka Text', Cambria, Georgia, serif" }} {...props} />
                  ),
                  h1: () => null,
                  h2: ({ node, ...props }) => {
                    const headingText = String(props.children ?? '');
                    const id = slugifyHeading(headingText);
                    return (
                      <h2 id={id} className="group font-heading text-[24px] sm:text-[30px] font-black mt-14 sm:mt-20 mb-5 sm:mb-6 text-black tracking-tight leading-tight border-t border-black/[0.03] pt-8 sm:pt-12 break-words">
                        <span>{props.children}</span>
                        <button onClick={() => handleCopyLink(id)} className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity align-middle" aria-label="Copy heading link">
                          <Copy size={14} />
                        </button>
                      </h2>
                    );
                  },
                  h3: ({ node, ...props }) => {
                    const headingText = String(props.children ?? '');
                    const id = slugifyHeading(headingText);
                    return (
                      <h3 id={id} className="group font-heading text-[20px] sm:text-[24px] font-black mt-10 sm:mt-12 mb-4 text-black tracking-tight break-words">
                        <span>{props.children}</span>
                        <button onClick={() => handleCopyLink(id)} className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity align-middle" aria-label="Copy heading link">
                          <Copy size={14} />
                        </button>
                      </h3>
                    );
                  },
                  ul: ({ node, ...props }) => <ul className="space-y-3 sm:space-y-4 my-8 sm:my-10 list-disc pl-6 sm:pl-8 text-[17px] sm:text-[20px] text-black/80" style={{ fontFamily: "'Charter', 'Bitstream Charter', 'Sitka Text', Cambria, Georgia, serif" }} {...props} />,
                  ol: ({ node, ...props }) => <ol className="space-y-3 sm:space-y-4 my-8 sm:my-10 list-decimal pl-6 sm:pl-8 text-[17px] sm:text-[20px] text-black/80" style={{ fontFamily: "'Charter', 'Bitstream Charter', 'Sitka Text', Cambria, Georgia, serif" }} {...props} />,
                  li: ({ node, ...props }) => <li className="pl-2" style={{ fontFamily: "'Charter', 'Bitstream Charter', 'Sitka Text', Cambria, Georgia, serif" }} {...props} />,
                  a: ({ node, ...props }) => <a className="text-brand border-b border-brand/30 hover:border-brand transition-all pb-0.5" {...props} />,
                  strong: ({ node, ...props }) => <strong className="font-bold text-black" {...props} />,
                  table: ({ node, ...props }) => (
                    <div className="overflow-x-auto my-12 border border-black/5 rounded-lg shadow-sm">
                      <table className="w-full text-left border-collapse min-w-[500px]" {...props} />
                    </div>
                  ),
                  thead: ({ node, ...props }) => <thead className="bg-black/[0.03] border-b-2 border-black/5" {...props} />,
                  th: ({ node, ...props }) => <th className="px-6 py-4 text-[11px] font-black uppercase tracking-[0.2em] text-black/40" {...props} />,
                  td: ({ node, ...props }) => <td className="px-6 py-5 text-[16px] text-black/70 border-b border-black/[0.02] leading-relaxed" style={{ fontFamily: "'Charter', 'Bitstream Charter', 'Sitka Text', Cambria, Georgia, serif" }} {...props} />,
                }}
              >
                {post.content}
              </ReactMarkdown>

              {/(table|checklist|protocol)/i.test(post.content) ? (
                <div className="mt-8 rounded-2xl border border-black/10 bg-white p-5">
                  <h4 className="font-heading text-[18px] font-bold mb-2">Download Resources</h4>
                  <p className="text-[16px] text-black/65 mb-3">Download-ready checklist and prep SOP for this workflow style.</p>
                  <div className="flex flex-wrap gap-2">
                    <button className="px-3 py-2 rounded-full border border-black/20 text-[14px] font-semibold hover:bg-[var(--color-text-primary)] hover:text-white transition-colors">Checklist PDF</button>
                    <button className="px-3 py-2 rounded-full border border-black/20 text-[14px] font-semibold hover:bg-[var(--color-text-primary)] hover:text-white transition-colors">Prep SOP</button>
                    <button className="px-3 py-2 rounded-full border border-black/20 text-[14px] font-semibold hover:bg-[var(--color-text-primary)] hover:text-white transition-colors">Shot list</button>
                  </div>
                </div>
              ) : null}

              <div className="mt-8 rounded-2xl border border-black/10 bg-[#f8f8f8] p-5">
                <p className="text-[16px] text-black/65 mb-3">Was this useful?</p>
                <div className="flex gap-2 mb-3">
                  <button onClick={() => setFeedback('yes')} className={`px-4 py-2 rounded-full text-[14px] font-semibold border transition-colors ${feedback === 'yes' ? 'bg-[var(--color-text-primary)] text-white border-[var(--color-text-primary)]' : 'border-black/15 hover:bg-black/5'}`}>Yes</button>
                  <button onClick={() => setFeedback('no')} className={`px-4 py-2 rounded-full text-[14px] font-semibold border transition-colors ${feedback === 'no' ? 'bg-[var(--color-text-primary)] text-white border-[var(--color-text-primary)]' : 'border-black/15 hover:bg-black/5'}`}>No</button>
                </div>
                <textarea value={feedbackNote} onChange={(e) => setFeedbackNote(e.target.value)} placeholder="Optional feedback" className="w-full min-h-20 rounded-lg border border-black/10 px-3 py-2 text-[16px] bg-white focus-visible:ring-2 focus-visible:ring-black/30 outline-none" />
              </div>

              <div className="mt-8 rounded-2xl border border-black/10 bg-white p-5">
                <h4 className="font-heading text-[18px] font-bold mb-2">Newsletter preferences</h4>
                <p className="text-[16px] text-black/60 mb-3">Get weekly updates on this topic and adjacent workflows.</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {[topicLabel(post.topic), 'Conversion', 'QA', 'Marketplace'].map((item) => (
                    <button key={item} className="px-3 py-1.5 rounded-full border border-black/15 text-[14px] font-semibold hover:bg-black/5 transition-colors">{item}</button>
                  ))}
                </div>
                {subStatus === 'ok' ? (
                  <p className="text-[15px] font-semibold text-green-700">{subMessage}</p>
                ) : (
                  <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="email"
                      placeholder="Email address"
                      value={subEmail}
                      onChange={(e) => setSubEmail(e.target.value)}
                      required
                      className="flex-1 min-h-12 rounded-full border border-black/10 px-4 text-[16px] focus-visible:ring-2 focus-visible:ring-black/30 outline-none"
                    />
                    <button
                      type="submit"
                      disabled={subStatus === 'loading'}
                      className="min-h-12 px-6 rounded-full bg-[var(--color-text-primary)] text-white text-[15px] font-bold uppercase tracking-wider hover:bg-black/90 transition-colors disabled:opacity-50"
                    >
                      {subStatus === 'loading' ? '…' : 'Subscribe'}
                    </button>
                  </form>
                )}
                {subStatus === 'error' && <p className="text-[13px] text-red-600 mt-1">{subMessage}</p>}
                <p className="mt-4 text-[14px] text-black/55">
                  Prefer direct email?{' '}
                  <a href={`mailto:${NEWSLETTER_EMAIL}`} className="underline text-black hover:text-[var(--color-text-primary)] transition-colors">
                    {NEWSLETTER_EMAIL}
                  </a>
                </p>
              </div>
            </main>
          </article>

          <aside className="hidden lg:block w-[320px] sticky top-24 space-y-8">
            <div className="rounded-2xl border border-black/10 bg-white p-4">
              <h5 className="font-heading text-[11px] font-black uppercase tracking-[0.2em] text-black/40 mb-3">On this page</h5>
              {toc.length === 0 ? (
                <p className="text-[14px] text-black/45">No section headings available.</p>
              ) : (
                <div className="space-y-2">
                  {toc.map((item) => (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      className={`block text-[14px] ${item.level === 3 ? 'pl-3' : ''} ${activeHeading === item.id ? 'text-[var(--color-text-primary)] font-semibold' : 'text-black/55 hover:text-[var(--color-text-primary)] transition-colors'}`}
                    >
                      {item.text}
                    </a>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-black/10 bg-white p-4">
              <h5 className="font-heading text-[11px] font-black uppercase tracking-[0.2em] text-black/40 mb-3">Related articles</h5>
              <div className="space-y-2">
                {(relatedFromApi.length ? relatedFromApi : relatedByTopic).slice(0, 4).map((item) => (
                  <Link key={item.slug} to={`/blog/${item.slug}`} className="block text-[13px] text-black/70 hover:text-black leading-snug">{item.title}</Link>
                ))}
              </div>
            </div>

            {(() => {
              const slugWords = post.slug.split('-');
              const relatedServices = SERVICES.filter((s) =>
                !s.hidden && (s.keywords || []).some((k) =>
                  slugWords.some((w) => w.length > 3 && k.toLowerCase().includes(w))
                )
              ).slice(0, 3);
              if (!relatedServices.length) return null;
              return (
                <div className="rounded-2xl border border-black/10 bg-white p-4">
                  <h5 className="font-heading text-[11px] font-black uppercase tracking-[0.2em] text-black/40 mb-3">Related Services</h5>
                  <div className="space-y-2">
                    {relatedServices.map((s) => (
                      <Link key={s.id} to={`/services/${s.id}`} className="block text-[13px] text-black/70 hover:text-black">{s.name}</Link>
                    ))}
                  </div>
                </div>
              );
            })()}

            <div className="rounded-2xl border border-black/10 bg-white p-4">
              <h5 className="font-heading text-[11px] font-black uppercase tracking-[0.2em] text-black/40 mb-3">Popular this week</h5>
              <div className="space-y-2">
                {popularPosts.map((item) => (
                  <Link key={item.slug} to={`/blog/${item.slug}`} className="block text-[13px] text-black/70 hover:text-black">{item.title}</Link>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-black/10 bg-white p-4">
              <h5 className="font-heading text-[11px] font-black uppercase tracking-[0.2em] text-black/40 mb-3">Recently updated</h5>
              <div className="space-y-2">
                {updatedPosts.map((item) => (
                  <Link key={item.slug} to={`/blog/${item.slug}`} className="block text-[13px] text-black/70 hover:text-black">{item.title}</Link>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>

      {actionMessage ? (
        <div className="fixed top-[76px] right-6 z-[280] rounded-lg border border-black/10 bg-white px-3 py-2 text-[12px] font-medium text-black shadow-md">
          {actionMessage}
        </div>
      ) : null}

      {currentSeries.length > 1 ? (
        <section className="px-6 pb-10">
          <div className="max-w-4xl mx-auto rounded-2xl border border-black/10 bg-white p-5">
            <p className="text-[11px] uppercase tracking-wider font-bold text-black/40 mb-2">Series</p>
            <h4 className="font-heading text-[18px] font-bold mb-3">{topicLabel(post.seriesId || 'workflow-series')}</h4>
            <div className="flex flex-wrap gap-2">
              {prevSeries ? <Link to={`/blog/${prevSeries.slug}`} className="px-3 py-1.5 rounded-full border border-black/20 text-[12px] font-semibold">← Previous part</Link> : null}
              {nextSeries ? <Link to={`/blog/${nextSeries.slug}`} className="px-3 py-1.5 rounded-full border border-black/20 text-[12px] font-semibold">Next part</Link> : null}
              <Link to={`/blog/series/${post.seriesId}`} className="px-3 py-1.5 rounded-full border border-black/20 text-[12px] font-semibold">View full series</Link>
            </div>
          </div>
        </section>
      ) : null}

      {progress > 60 && nextPost ? (
        <div className="fixed bottom-5 right-5 z-[260] max-w-sm rounded-2xl border border-black/15 bg-white/95 backdrop-blur p-4 shadow-xl">
          <p className="text-[11px] uppercase tracking-wider font-bold text-black/45 mb-2">Continue reading</p>
          <Link to={`/blog/${nextPost.slug}`} className="block text-[14px] font-semibold text-black hover:text-brand">
            {nextPost.title}
          </Link>
        </div>
      ) : null}
    </div>
  );
};

export default InsightDetailPage;
