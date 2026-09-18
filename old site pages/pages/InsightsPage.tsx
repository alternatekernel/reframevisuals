import { useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useSearchParams } from 'react-router-dom';
import { BookOpen, Scissors, Palette, TrendingUp, Search, X } from 'lucide-react';
import { cx, layout, typography } from '../utils/theme';
import InsightsHero from '../sections/insights/InsightsHero';
import InsightsGrid from '../sections/insights/InsightsGrid';
import InsightsCTA from '../sections/insights/InsightsCTA';
import { useBlogPosts } from '../hooks/useBlogPosts';
import { getReadingHistory, searchPosts, sortPosts, topicLabel, type BlogSort } from '../utils/blog';
import { useContent } from '../context/ContentBase';

const CATEGORIES = [
  { id: 'all', label: 'All Posts', icon: BookOpen, color: '#0A0A0B' },
  { id: 'techniques', label: 'Techniques', icon: Scissors, color: '#111111' },
  { id: 'services', label: 'Services', icon: Palette, color: '#111111' },
  { id: 'industry', label: 'Industry', icon: TrendingUp, color: '#111111' },
];

const InsightsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentUser } = useContent();
  const q = searchParams.get('q') || '';
  const activeCategory = searchParams.get('category') || 'all';
  const activeTopic = searchParams.get('topic') || 'all';
  const activeSeries = searchParams.get('series') || 'all';
  const sort = (searchParams.get('sort') as BlogSort) || 'latest';

  const BLOG_POSTS = useBlogPosts();

  const topics = useMemo(() => {
    return ['all', ...Array.from(new Set(BLOG_POSTS.map((p) => p.topic))).sort()];
  }, [BLOG_POSTS]);

  const filteredByCategory = activeCategory === 'all'
    ? BLOG_POSTS
    : BLOG_POSTS.filter((p) => p.category === activeCategory);
  const filteredByTopic = activeTopic === 'all'
    ? filteredByCategory
    : filteredByCategory.filter((p) => p.topic === activeTopic);
  const filteredBySeries = activeSeries === 'all'
    ? filteredByTopic
    : filteredByTopic.filter((p) => p.seriesId === activeSeries);
  const searched = searchPosts(filteredBySeries, q);
  const gridPosts = sortPosts(searched, sort);

  const featuredPost = BLOG_POSTS.find((p) => p.featured);
  const readingHistory = getReadingHistory()
    .map((slug) => BLOG_POSTS.find((p) => p.slug === slug))
    .filter(Boolean)
    .slice(0, 3);

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (!value || value === 'all') next.delete(key);
    else next.set(key, value);
    if (key !== 'page') next.delete('page');
    // replace: typing in search shouldn't create a history entry per keystroke
    setSearchParams(next, { replace: true });
  };

  const hasActiveFilters = !!q || activeTopic !== 'all' || activeSeries !== 'all' || sort !== 'latest';
  const clearFilters = () => {
    const next = new URLSearchParams(searchParams);
    ['q', 'topic', 'series', 'sort'].forEach((k) => next.delete(k));
    setSearchParams(next, { replace: true });
  };

  const popularPosts = sortPosts(BLOG_POSTS, 'popular').slice(0, 4);
  const updatedPosts = sortPosts(BLOG_POSTS, 'updated').slice(0, 4);
  const canEditBlogs = currentUser?.email?.toLowerCase() === 'admin@reframevisuals.com';

  return (
    <div className="min-h-screen bg-surface">
      <Helmet>
        <title>Ecommerce Photo Editing Guides & Tutorials | Reframe Blog</title>
        <meta
          name="description" content="Read the latest photo editing guides and tutorials on product photography, background removal, ghost mannequin workflows, and jewelry retouching."
        />
        <link rel="canonical" href="https://reframevisuals.com/blog" />
        <meta property="og:title" content="Ecommerce Photo Editing Guides & Tutorials | Reframe Blog" />
        <meta property="og:description" content="Read the latest photo editing guides and tutorials on product photography, background removal, ghost mannequin workflows, and jewelry retouching." />
        <meta property="og:url" content="https://reframevisuals.com/blog" />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: 'Ecommerce Photo Editing Guides & Tutorials',
          description: 'Expert guides on clipping path, background removal, ghost mannequin, retouching, and color correction for ecommerce and Amazon sellers.',
          url: 'https://reframevisuals.com/blog',
          publisher: {
            '@type': 'Organization',
            name: 'Reframe Visuals',
            url: 'https://reframevisuals.com',
          },
        })}</script>
      </Helmet>
      <InsightsHero />

      {/* Search / topic / sort toolbar */}
      <section className="px-5 sm:px-6 py-4 sm:py-5 bg-white border-b border-black/5">
        <div className="max-w-5xl mx-auto space-y-3">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <div className="relative flex-1 max-w-md">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-black/30" />
              <input
                value={q}
                onChange={(e) => setParam('q', e.target.value)}
                placeholder="Search guides, techniques, topics…"
                className="w-full rounded-full border border-black/10 bg-white py-2.5 pl-10 pr-9 text-[14px] outline-none transition-colors focus:border-black/40"
              />
              {q && (
                <button
                  onClick={() => setParam('q', '')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-black/30 hover:text-black"
                  aria-label="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <select
              value={sort}
              onChange={(e) => setParam('sort', e.target.value)}
              className="rounded-full border border-black/10 bg-white px-4 py-2.5 text-[13px] font-semibold outline-none cursor-pointer focus:border-black/40"
              aria-label="Sort articles"
            >
              <option value="latest">Newest first</option>
              <option value="updated">Recently updated</option>
              <option value="popular">Editor's picks</option>
            </select>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-[12px] font-bold uppercase tracking-wider text-black/40 hover:text-black whitespace-nowrap"
              >
                Clear all
              </button>
            )}
          </div>

          {topics.length > 2 && (
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-0.5">
              {topics.map((t) => {
                const isActive = activeTopic === t;
                return (
                  <button
                    key={t}
                    onClick={() => setParam('topic', t)}
                    className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.08em] transition-all ${
                      isActive
                        ? 'border-black bg-black text-white'
                        : 'border-black/10 bg-white text-black/50 hover:border-black/25 hover:text-black'
                    }`}
                  >
                    {t === 'all' ? 'All topics' : topicLabel(t)}
                  </button>
                );
              })}
            </div>
          )}

          {hasActiveFilters && (
            <p className="text-[12px] text-black/40">
              {gridPosts.length} article{gridPosts.length !== 1 ? 's' : ''} match{gridPosts.length === 1 ? 'es' : ''} your filters
            </p>
          )}
        </div>
      </section>

      <InsightsGrid
        allPosts={BLOG_POSTS}
        gridPosts={gridPosts}
        featuredPost={hasActiveFilters ? undefined : featuredPost}
        activeCategory={activeCategory}
        categories={CATEGORIES}
        setActiveCategory={(id) => setParam('category', id)}
        canEditBlogs={canEditBlogs}
      />

      <section className="px-6 pt-16 sm:pt-20 pb-16 lg:pb-24">
        <div className={cx(layout.compactShell, 'grid grid-cols-1 gap-4 lg:grid-cols-3')}>
          <div className="rounded-xl border border-black/10 bg-white p-4">
            <h3 className="mb-3 text-[14px] font-bold">Editor's picks</h3>
            <div className="space-y-2">
              {popularPosts.map((post) => (
                <Link key={post.slug} to={`/blog/${post.slug}`} className="block text-[13px] text-black/70 hover:text-black">
                  {post.title}
                </Link>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-black/10 bg-white p-4">
            <h3 className="mb-3 text-[14px] font-bold">Recently updated</h3>
            <div className="space-y-2">
              {updatedPosts.map((post) => (
                <Link key={post.slug} to={`/blog/${post.slug}`} className="block text-[13px] text-black/70 hover:text-black">
                  {post.title}
                </Link>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-black/10 bg-white p-4">
            <h3 className="mb-3 text-[14px] font-bold">Continue reading</h3>
            {readingHistory.length === 0 ? (
              <p className="text-[13px] text-black/50">Your reading history appears here after opening articles.</p>
            ) : (
              <div className="space-y-2">
                {readingHistory.map((post: any) => (
                  <Link key={post.slug} to={`/blog/${post.slug}`} className="block text-[13px] text-black/70 hover:text-black">
                    {post.title}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <InsightsCTA />

      <section className="px-6 pb-10">
        <div className={cx(layout.compactShell)}>
          <h2 className="mb-4 text-[20px] font-semibold text-black">Browse All Guides</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {BLOG_POSTS.slice(0, 18).map((post) => (
              <Link
                key={post.slug}
                to={`/blog/${post.slug}`}
                className="rounded-lg border border-black/10 px-4 py-3 text-sm font-medium transition-colors hover:bg-black hover:text-white"
              >
                {post.title}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 pb-12">
        <div className={cx(layout.compactShell)}>
          <p className={cx(typography.vercelMono, 'text-center text-black/45')}>
            © 2026 Reframe Visuals &bull; Reframing the industry, one image at a time.
          </p>
        </div>
      </section>
    </div>
  );
};

export default InsightsPage;
