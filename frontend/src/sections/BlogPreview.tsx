import { motion } from 'framer-motion';
import { cx, typography } from '../utils/theme';
import { ArrowRight, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useBlogPosts } from '../hooks/useBlogPosts';

const BlogPreview = () => {
  const navigate = useNavigate();
  const blogPosts = useBlogPosts();

  // Newest first, featured posts leading — new posts published from the admin
  // CMS appear here automatically (previously this was a hardcoded slug list).
  const RECENT_POSTS = [...blogPosts]
    .sort((a, b) => {
      if (a.featured !== b.featured) return a.featured ? -1 : 1;
      return (Date.parse(b.updatedAt || b.date) || 0) - (Date.parse(a.updatedAt || a.date) || 0);
    })
    .slice(0, 3)
    .map(post => ({
      category: post.category ? post.category.charAt(0).toUpperCase() + post.category.slice(1) : 'General',
      title: post.title,
      readTime: post.readTime,
      slug: post.slug,
    }));

  if (RECENT_POSTS.length === 0) return null;

  const featuredPost = RECENT_POSTS[0];
  const secondaryPosts = RECENT_POSTS.slice(1);

  return (
    <section className="relative overflow-hidden bg-[#0b0b10] pt-12 pb-12 sm:pt-14 sm:pb-14 lg:pt-20 lg:pb-20 text-white">
      <div className="pointer-events-none absolute left-1/2 top-[-220px] h-[440px] w-[820px] -translate-x-1/2 rounded-full bg-white/[0.03] blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-10%] left-[14%] h-56 w-56 rounded-full bg-white/5 blur-3xl" />
      <div className="pointer-events-none absolute right-[10%] top-[18%] h-52 w-52 rounded-full bg-white/5 blur-3xl" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/[0.06]" />

      <div className="relative z-10 mx-auto max-w-[1240px] px-5 sm:px-6 lg:px-10">
        <div className="mb-8 grid gap-6 lg:mb-10 lg:grid-cols-[0.95fr_auto] lg:items-end">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[12px] font-bold text-white/65"
            >
              <BookOpen size={14} />
              Reframe Blog
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.08 }}
              className={cx(typography.displayXl, "text-white")}
            >
              Knowledge from the <span className="text-white/40">editing floor.</span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.14 }}
              className="mt-5 max-w-2xl text-[16px] font-medium leading-relaxed text-white/60 lg:text-[18px]"
            >
              Retouching technique, marketplace prep, and catalog ops. From editors who do this work.
            </motion.p>
          </div>

          <motion.button
            initial={{ opacity: 0, x: 18 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.18 }}
            onClick={() => navigate('/blog')}
            className="inline-flex min-h-[52px] w-full sm:w-max items-center justify-center rounded-full border border-white/10 bg-white px-6 text-[15px] font-bold text-[var(--color-text-primary)] transition-all hover:bg-white/90 active:scale-95"
          >
            View all blog posts
          </motion.button>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
          <motion.article
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            onClick={() => navigate(`/blog/${featuredPost.slug}`)}
            className="group relative flex flex-col justify-between min-h-[320px] cursor-pointer overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.04] p-6 transition-all hover:border-white/18 hover:bg-white/[0.06] sm:p-8 lg:p-10 shadow-[0_24px_60px_-42px_rgba(0,0,0,0.55)]"
          >
            <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/12 to-transparent" />
            <div className="flex flex-grow flex-col justify-between gap-12 sm:gap-16">
              <div>
                <p className="mb-5 text-[12px] font-semibold uppercase tracking-widest text-white/40">{featuredPost.category}</p>
                <h3 className={cx(typography.displayMd, "max-w-2xl text-white")}>
                  {featuredPost.title}
                </h3>
              </div>

              <div className="flex items-center justify-between border-t border-white/10 pt-5">
                <span className="text-[14px] font-bold text-white/40">{featuredPost.readTime}</span>
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[var(--color-text-primary)] transition-transform group-hover:-rotate-45">
                  <ArrowRight size={16} />
                </span>
              </div>
            </div>
          </motion.article>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            {secondaryPosts.map((post, i) => (
              <motion.article
                key={post.slug}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ delay: 0.08 + i * 0.06 }}
                onClick={() => navigate(`/blog/${post.slug}`)}
                className="group cursor-pointer rounded-[28px] border border-white/10 bg-white/[0.04] p-5 transition-all hover:-translate-y-0.5 hover:border-white/18 hover:bg-white/[0.06] sm:p-6 shadow-[0_20px_50px_-40px_rgba(0,0,0,0.55)] flex flex-col justify-between"
              >
                <div>
                  <p className="mb-4 text-[12px] font-semibold uppercase tracking-widest text-white/35">{post.category}</p>
                  <h3 className="line-clamp-3 text-[19px] sm:text-[21px] font-semibold leading-tight tracking-[-0.025em] text-white/90">{post.title}</h3>
                </div>
                <div className="mt-7 flex items-center justify-between border-t border-white/10 pt-4">
                  <span className="text-[12px] font-bold text-white/35">{post.readTime}</span>
                  <ArrowRight size={16} className="text-white/45 transition-transform duration-300 group-hover:-rotate-45" />
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default BlogPreview;
