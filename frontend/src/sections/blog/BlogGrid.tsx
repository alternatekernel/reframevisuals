import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cx } from '../../utils/theme';
import { getTopicPastel, topicLabel } from '../../utils/blog';
import { useState, useMemo } from 'react';

interface BlogGridProps {
  allPosts: any[];
  gridPosts: any[];
  featuredPost?: any;
  activeCategory: string;
  categories: any[];
  setActiveCategory: (id: string) => void;
  canEditBlogs?: boolean;
}

const BlogGrid: React.FC<BlogGridProps> = ({
  allPosts,
  gridPosts,
  featuredPost,
  activeCategory,
  categories,
  setActiveCategory,
  canEditBlogs = false
}) => {
  const INITIAL_VISIBLE = 8;
  const [visibleCounts, setVisibleCounts] = useState<Record<string, number>>({});

  const handleLoadMore = (key: string) => {
    setVisibleCounts((prev) => ({
      ...prev,
      [key]: (prev[key] || INITIAL_VISIBLE) + 8,
    }));
  };

  // Map category slug → label for badge display on cards
  const categoryLabelMap = useMemo(() => {
    const map: Record<string, string> = {};
    categories.forEach((c) => { map[c.id] = c.label; });
    return map;
  }, [categories]);

  const getOptimizedUrl = (url: string, width = 400) => {
    if (!url) return url;
    if (url.includes('unsplash.com')) {
      return url.replace('w=800', `w=${width}`);
    }
    // Cloudinary resizes on the fly via URL transforms — thumbnails shouldn't
    // download the full-size original. Skip URLs that already carry transforms.
    if (url.includes('res.cloudinary.com') && url.includes('/upload/')) {
      const firstSegment = (url.split('/upload/')[1] || '').split('/')[0];
      const hasTransform = /(^|,)[a-z]{1,3}_/.test(firstSegment);
      if (!hasTransform) return url.replace('/upload/', `/upload/f_auto,q_auto,w_${width}/`);
    }
    return url;
  };

  const showFeaturedHero = !!featuredPost && activeCategory === 'all';

  const totalPosts = allPosts.length;

  return (
    <div className="bg-[var(--color-bg-secondary)]">
      <section className="px-5 sm:px-6 border-b border-black/[0.12] sticky top-[64px] sm:top-[72px] bg-white/90 backdrop-blur-xl z-20">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-4 sm:gap-10 overflow-x-auto no-scrollbar py-2.5 sm:py-4">
            {categories.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={cx(
                    'whitespace-nowrap text-[10px] sm:text-[11px] font-black uppercase tracking-[0.1em] sm:tracking-[0.15em] transition-all pb-1 border-b-2',
                    isActive ? 'text-black border-black' : 'text-black/25 border-transparent hover:text-black/50'
                  )}
                >
                  {cat.label}
                  {cat.id === 'all' ? ` (${totalPosts})` : ''}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-5 sm:px-6 py-6 sm:py-10 lg:py-12">
        <div className="max-w-5xl mx-auto space-y-12 sm:space-y-24">
          {/* Featured post hero — the post pinned as Featured in the admin editor */}
          {showFeaturedHero && (
            <motion.article
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="group relative"
            >
              <Link
                to={`/blog/${featuredPost.slug}`}
                className="flex flex-col md:flex-row gap-6 md:gap-10 items-stretch rounded-3xl border border-black/[0.18] bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="md:w-[46%] shrink-0">
                  <div className="h-full min-h-[220px] md:min-h-[300px] overflow-hidden bg-black/5">
                    <img
                      src={getOptimizedUrl(featuredPost.image, 800)}
                      alt={featuredPost.imageAlt || `${featuredPost.title} - Reframe Visuals Blog`}
                      loading="eager"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                </div>
                <div className="flex-1 p-6 md:py-10 md:pr-10 md:pl-0 flex flex-col justify-center gap-4">
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest flex-wrap">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-black text-white">Featured</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full border ${getTopicPastel(featuredPost.topic)}`}>
                      {topicLabel(featuredPost.topic)}
                    </span>
                    <span className="text-black/30">{featuredPost.date} · {featuredPost.readTime}</span>
                  </div>
                  <h2 className="font-heading text-[26px] sm:text-[32px] lg:text-[38px] font-black leading-[1.08] tracking-tight group-hover:text-black/70 transition-colors">
                    {featuredPost.title}
                  </h2>
                  <p className="text-[16px] text-black/60 leading-7 line-clamp-3">{featuredPost.excerpt}</p>
                </div>
              </Link>
              {canEditBlogs && (
                <Link
                  to="/admin/blog"
                  className="absolute top-3 right-3 z-10 rounded-md border border-black/15 bg-white/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-black/70 hover:border-black/40 hover:text-black"
                >
                  Edit
                </Link>
              )}
            </motion.article>
          )}

          {(() => {
            // Flat list for "all" — no category section headers, just badges on cards
            const postsToShow = activeCategory === 'all'
              ? gridPosts.filter((p) => !(showFeaturedHero && p.slug === featuredPost?.slug))
              : gridPosts.filter((p) => p.category === activeCategory && !(showFeaturedHero && p.slug === featuredPost?.slug));

            if (postsToShow.length === 0) return null;

            const viewKey = activeCategory;
            const visibleCount = visibleCounts[viewKey] || INITIAL_VISIBLE;
            const hasMore = postsToShow.length > visibleCount;

            const renderCard = (post: any) => (
              <motion.article
                key={post.id}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, margin: '-20px' }}
                transition={{ duration: 0.3 }}
                className="group relative will-change-transform"
              >
                {canEditBlogs && (
                  <Link
                    to="/admin/blog"
                    className="absolute top-0 right-0 z-10 rounded-md border border-black/15 bg-white/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-black/60 hover:border-black/40 hover:text-black"
                  >
                    Edit
                  </Link>
                )}
                <Link to={`/blog/${post.slug}`} className="flex flex-col sm:flex-row gap-3 sm:gap-6 items-start">
                  <div className="flex-1 space-y-2.5 sm:space-y-3">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-black/30 uppercase tracking-[0.08em] sm:tracking-widest flex-wrap">
                      {post.category && categoryLabelMap[post.category] && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-black/5 border border-black/[0.18] text-black/50">
                          {categoryLabelMap[post.category]}
                        </span>
                      )}
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full border ${getTopicPastel(post.topic)}`}>
                        {topicLabel(post.topic)}
                      </span>
                      <span>{post.date}</span>
                      <span>·</span>
                      <span>{post.readTime}</span>
                    </div>
                    <h3 className="font-heading line-clamp-3 text-[22px] leading-[1.12] tracking-[-0.015em] sm:line-clamp-2 sm:text-[18px] lg:text-[20px] font-black sm:leading-snug group-hover:text-black/60 transition-colors">
                      {post.title}
                    </h3>
                    <p className="text-[16px] text-black/60 leading-7 line-clamp-3 not-italic">
                      {post.excerpt}
                    </p>
                  </div>
                  <div className="shrink-0 w-full sm:w-24 md:w-28">
                    <div className="aspect-[16/10] sm:aspect-[4/5] rounded-2xl overflow-hidden bg-black/5 shadow-[0_0_0_1px_rgba(0,0,0,0.08)]">
                      <img
                        src={getOptimizedUrl(post.image)}
                        alt={post.imageAlt || `${post.title} - Reframe Visuals Insights`}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    </div>
                  </div>
                </Link>
              </motion.article>
            );

            return (
              <div className="space-y-6 sm:space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 sm:gap-y-10">
                  {postsToShow.slice(0, visibleCount).map(renderCard)}
                </div>
                {hasMore && (
                  <div className="pt-5 sm:pt-8 flex justify-center">
                    <button
                      onClick={() => handleLoadMore(viewKey)}
                      className="group flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 rounded-full border border-black/[0.18] hover:border-black/30 hover:bg-black/5 transition-all"
                    >
                      <span className="text-[11px] sm:text-[12px] font-black uppercase tracking-[0.08em] sm:tracking-widest">Load More Articles</span>
                      <div className="w-5 h-5 rounded-full bg-black/5 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all">
                        <TrendingUp size={12} className="rotate-90" />
                      </div>
                    </button>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      </section>
    </div>
  );
};

export default React.memo(BlogGrid);
