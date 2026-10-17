import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useContent } from '../context/ContentBase';
import { Link } from 'react-router-dom';
import { motion, useTransform, AnimatePresence, useScroll } from 'framer-motion';
import { MaskedRevealText } from '../components/ui/masked-reveal-text';
import { cx, layout, tokens, typography } from '../utils/theme';
import HeroCards from '../components/hero/HeroCards';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { Button } from '../components/ui/button';
import { ArrowRight, Check } from 'lucide-react';
import { cldAvatar } from '../utils/cloudinary';

const MOBILE_TRUST_POINTS = ['Hand-traced edges', 'Manual QA review', 'No subscription'];

// Small 72px face-cropped derivatives (displayed at 24-28px) instead of the
// raw 1024px uploads — shares the same CDN derivative as the testimonial marquee.
const HERO_AVATARS = [
  'https://res.cloudinary.com/dnmj4altq/image/upload/v1781723564/reframeimages/testimonials/surreal_founder_portrait.jpg',
  'https://res.cloudinary.com/dnmj4altq/image/upload/v1781723566/reframeimages/testimonials/todd_carli_portrait.jpg',
  'https://res.cloudinary.com/dnmj4altq/image/upload/v1781723550/reframeimages/testimonials/jamie_puppack_portrait.jpg',
  'https://res.cloudinary.com/dnmj4altq/image/upload/v1781723555/reframeimages/testimonials/nigel_fashion_portrait.jpg',
  'https://res.cloudinary.com/dnmj4altq/image/upload/v1781971885/reframe/testimonials/nikola_filic_portrait.jpg',
].map(cldAvatar);

const HERO_PROOF_POINTS = [
  'Hand-traced Pen Tool edges',
  '3 free sample edits',
  'No subscription needed',
  'Manual QA on every image',
];

const Hero = () => {
  const { getSectionContent } = useContent();
  const heroContent = getSectionContent('hero');
  const { scrollY } = useScroll();
  const scrollOpacity = useTransform(scrollY, [200, 800], [1, 0]);
  
  const headlines = useMemo(() => [
    {
      line1: "Ecommerce photo editing",
      line2: "that actually matches your brief.",
      tag: "Human editors. 12h turnaround. No subscription.",
    },
    {
      line1: "Hair, lace, and glass break AI tools.",
      line2: "Human editors trace them by hand.",
      tag: "Manual Pen Tool tracing on every clipping path.",
    },
    {
      line1: "Pen Tool precision",
      line2: "from $0.39 an image.",
      tag: "Try the quality with 3 free sample edits first.",
    },
    {
      line1: "Upload a full catalog.",
      line2: "Get it back in 12-72 hours.",
      tag: "No minimum order. Pay per image.",
    },
  ], []);

  const [headlineIndex, setHeadlineIndex] = useState(0);

  // Only one of the two layout trees (mobile / desktop) is ever visible, but
  // both used to stay mounted, so phones ran the full card carousel (springs,
  // intervals, image fetches) behind display:none. Prune the hidden tree after
  // hydration; the first client render keeps both so prerendered HTML matches.
  const isDesktop = useMediaQuery('(min-width: 640px)', true);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  // Pause offscreen work: headline rotation re-renders the whole hero every
  // 9s, which is wasted (and competes with scrolling) once the user has
  // scrolled past the section or switched tabs.
  const sectionRef = useRef<HTMLElement>(null);
  const [heroInView, setHeroInView] = useState(true);
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setHeroInView(entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!heroInView) return;
    const timer = setInterval(() => {
      if (document.hidden) return;
      setHeadlineIndex((prev) => (prev + 1) % headlines.length);
    }, 9000);
    return () => clearInterval(timer);
  }, [headlines.length, heroInView]);

  // Computed once at mount — stable across re-renders (headlineIndex rotations, etc.)
  const shouldAnimate = useRef(
    typeof window !== 'undefined' &&
    typeof sessionStorage !== 'undefined' &&
    !sessionStorage.getItem('reframe_hero_intro_seen') &&
    typeof window.matchMedia === 'function' &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ).current;

  useEffect(() => {
    if (shouldAnimate) sessionStorage.setItem('reframe_hero_intro_seen', '1');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const d = (ms: number) => (shouldAnimate ? ms / 1000 : 0);

  return (
    <section
      ref={sectionRef}
      data-section="hero"
      className="relative flex w-full flex-col justify-start overflow-hidden pb-0 pt-0 bg-white sm:bg-transparent sm:pb-[clamp(2.5rem,3.7vw,4.3rem)] sm:pt-[clamp(0.55rem,0.95vw,0.8rem)] lg:min-h-[min(92svh,900px)] lg:pt-[clamp(0.45rem,0.75vw,0.8rem)] 2xl:pb-[clamp(1.8rem,2.35vw,2.7rem)]"
    >
      
      {/* Layered technical grid */}
      <motion.div
        style={{ opacity: scrollOpacity }}
        className="pointer-events-none absolute inset-0 z-0 bg-[var(--color-bg-secondary)] hidden sm:block will-change-[opacity]"
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2, delay: 0.8, ease: "easeOut" }}
          className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(to right, rgba(23,23,23,0.055) 1px, transparent 1px), linear-gradient(to bottom, rgba(23,23,23,0.055) 1px, transparent 1px)`,
            backgroundSize: '80px 80px',
            backgroundPosition: '-1px -1px',
            maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.34) 18%, rgba(0,0,0,0.12) 38%, rgba(0,0,0,0.78) 58%, black 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.34) 18%, rgba(0,0,0,0.12) 38%, rgba(0,0,0,0.78) 58%, black 100%)'
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(to right, rgba(23,23,23,0.075) 1px, transparent 1px), linear-gradient(to bottom, rgba(23,23,23,0.075) 1px, transparent 1px)`,
            backgroundSize: '320px 320px',
            backgroundPosition: '-1px -1px',
            maskImage: 'linear-gradient(to bottom, transparent 8%, rgba(0,0,0,0.18) 30%, rgba(0,0,0,0.7) 62%, black 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 8%, rgba(0,0,0,0.18) 30%, rgba(0,0,0,0.7) 62%, black 100%)'
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M40 35.5V44.5M35.5 40H44.5' stroke='rgba(23,23,23,0.24)' stroke-width='1'/%3E%3Ccircle cx='40' cy='40' r='1.25' fill='%23fdfdfc' stroke='rgba(23,23,23,0.18)'/%3E%3C/svg%3E")`,
            backgroundSize: '80px 80px',
            backgroundPosition: '-40px -40px',
            maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, transparent 34%, rgba(0,0,0,0.72) 58%, black 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, transparent 34%, rgba(0,0,0,0.72) 58%, black 100%)'
          }}
        />
        <div className="absolute inset-x-[12%] top-[10%] h-[34%] rounded-[50%] bg-white/90 blur-[72px]" />
        <div className="absolute inset-x-[8%] bottom-[-8%] h-[42%] rounded-[50%] bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.88)_0%,rgba(255,255,255,0.45)_50%,transparent_76%)]" />
      </motion.div>

      {(!hydrated || !isDesktop) && (
      <div className="relative z-10 flex w-full flex-col justify-between px-4 min-h-[82dvh] pb-6 pt-1 sm:hidden">
        <div className="flex flex-col justify-start gap-5 sm:gap-7 w-full mt-1">
          <motion.div
            className="mx-auto flex w-full max-w-[410px] flex-col items-center gap-5 sm:gap-7 px-7 py-7 sm:py-9 text-center rounded-[32px] border border-black/[0.16] animate-card-bg shadow-[0_24px_60px_-34px_rgba(15,23,42,0.18)] relative overflow-hidden"
            initial={shouldAnimate ? { opacity: 0, y: 16 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.0, 0, 0.2, 1], delay: d(60) }}
          >
            {/* Decorative blurs — hidden on mobile to reduce paint cost */}
            <div className="pointer-events-none absolute -top-10 -right-10 h-36 w-36 rounded-full bg-white/55 blur-2xl hidden sm:block" />
            <div className="pointer-events-none absolute -bottom-12 -left-8 h-36 w-36 rounded-full bg-black/[0.05] blur-2xl hidden sm:block" />

            <div className="space-y-4 relative z-10">
              <motion.h2
                className="text-center text-balance text-[24px] font-bold leading-[1.2] tracking-[-0.03em] text-black/90"
                initial={shouldAnimate ? { opacity: 0, y: 12 } : false}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: [0.0, 0, 0.2, 1], delay: d(160) }}
              >
                Better edges than AI tools. Lower price than enterprise studios.{' '}
                <span className="text-black/35 font-medium">From $0.39/image.</span>
              </motion.h2>
              <motion.p
                className="mx-auto max-w-[340px] text-[16px] leading-relaxed text-black/75"
                initial={shouldAnimate ? { opacity: 0, y: 8 } : false}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: [0.0, 0, 0.2, 1], delay: d(240) }}
              >
                Human QA, cleaner edges, and per-image pricing with no subscription.
              </motion.p>
            </div>

            <motion.div
              className="flex flex-col w-full gap-3.5 mt-4 relative z-10"
              initial={shouldAnimate ? { opacity: 0, y: 6 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, ease: [0.0, 0, 0.2, 1], delay: d(340) }}
            >
              <Link
                to="/free-trial?type=pilot"
                className="group inline-flex min-h-[52px] items-center justify-center gap-2.5 whitespace-nowrap rounded-full bg-black py-2 pl-7 pr-2 text-[16px] font-bold text-white shadow-[0_8px_24px_rgba(0,0,0,0.10)] transition-all hover:bg-black active:scale-95 touch-manipulation"
              >
                <span>Get 3 Free Sample Edits</span>
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/90 text-black">
                  <ArrowRight size={18} className="transition-transform duration-300 group-hover:-rotate-45" />
                </span>
              </Link>
              <Link
                to="/pricing"
                className="inline-flex min-h-[52px] items-center justify-center whitespace-nowrap rounded-full border border-black/[0.18] bg-white px-7 text-[16px] font-bold text-black transition-all hover:bg-black/[0.05] active:scale-95 touch-manipulation shadow-sm"
              >
                See pricing
              </Link>
            </motion.div>
          </motion.div>

          {/* Clean list of key value propositions below the main card */}
          <div className="w-full max-w-[360px] mx-auto flex flex-col gap-5 mt-1 text-left px-2">
            {[
              {
                title: 'Human Photoshop editors',
                desc: 'Every image traced and reviewed by hand before it ships.',
              },
              {
                title: 'AI-assisted workflow',
                desc: 'AI handles routine steps. Editors check and correct every image.',
              },
              {
                title: 'Flexible turnaround',
                desc: '12h, 24h, 48h, or 72h. Choose what fits your deadline.',
              },
            ].map((pt, i) => (
              <motion.div
                key={pt.title}
                initial={shouldAnimate ? { opacity: 0, x: -8 } : false}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.35, ease: 'easeOut', delay: d(460 + i * 80) }}
                className="flex items-start gap-3.5"
              >
                <Check size={18} className="text-black/60 mt-0.5 shrink-0" strokeWidth={3} />
                <div className="flex flex-col min-w-0">
                  <h4 className="text-[15.5px] font-bold text-black/90 leading-tight tracking-tight">{pt.title}</h4>
                  <p className="text-[13.5px] text-black/65 leading-relaxed mt-1">{pt.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Mobile social proof bar */}
        <motion.div
          className="flex items-center justify-center mt-2 shrink-0"
          initial={shouldAnimate ? { opacity: 0, y: 6 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: 'easeOut', delay: d(700) }}
        >
          <div className="inline-flex items-center gap-2.5 rounded-full border border-black/[0.16] bg-white/90 px-3 py-1.5 shadow-[0_2px_10px_rgba(0,0,0,0.12)] backdrop-blur-sm">
            <div className="flex -space-x-2">
              {HERO_AVATARS.slice(0, 4).map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt="Reframe Visuals customer"
                  aria-hidden="true"
                  width={24}
                  height={24}
                  className="h-6 w-6 rounded-full border-2 border-white object-cover"
                  style={{ zIndex: 4 - i }}
                />
              ))}
            </div>
            <span className="text-[11.5px] font-medium text-black/65">
              <span className="font-bold text-black/90">50k+</span> images hand-edited
            </span>
          </div>
        </motion.div>

        <motion.div
          className="mt-3 flex items-center justify-center shrink-0"
          initial={shouldAnimate ? { opacity: 0 } : false}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.22, ease: 'easeOut', delay: d(720) }}
        >
          <div className="inline-flex items-center gap-1.5 rounded-full border border-black/[0.20] bg-[var(--color-bg-secondary)]/90 px-2.5 py-1 text-[10px] font-semibold text-black/75 shadow-[inset_0_1px_0_rgba(255,255,255,0.94),0_1px_2px_rgba(0,0,0,0.09)] backdrop-blur-sm">
            <span className="tracking-[0.16em] uppercase">Swipe to explore</span>
            <motion.span
              aria-hidden="true"
              className="text-black/50 inline-block"
              animate={heroInView ? { y: [0, 3, 0] } : { y: 0 }}
              transition={heroInView ? { duration: 1.2, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.2 }}
            >↓</motion.span>
          </div>
        </motion.div>
      </div>
      )}

      {(!hydrated || isDesktop) && (
      <div className={cx(layout.compactShell, "relative z-10 hidden w-full flex-col items-center justify-center px-4 sm:flex sm:px-6 lg:px-12")}>
        {/* Solid background mask to hide grid lines behind the text block */}
        <div 
          className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[140vw] h-[62%] pointer-events-none z-[-1]"
          style={{
            background: 'radial-gradient(ellipse at center, #fdfdfc 50%, rgba(253, 253, 252, 0.8) 70%, transparent 85%)'
          }}
        />
        <div className="mx-auto flex w-full max-w-[1180px] flex-col items-center justify-center gap-[clamp(0.45rem,0.75vw,0.7rem)] sm:short:gap-1 text-center">
          
          {/* Animated Headline */}
          <div className="flex min-h-[clamp(4.6rem,5.9vw,5.75rem)] sm:short:min-h-0 items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={headlineIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, ease: "linear" }}
                className="flex flex-col items-center gap-2"
              >
                <motion.div
                  className="flex items-center gap-3 mt-2"
                  initial={shouldAnimate && headlineIndex === 0 ? { opacity: 0, y: 10 } : false}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.32, ease: [0.0, 0, 0.2, 1], delay: d(80) }}
                >
                  <span className="font-heading font-medium uppercase tracking-[0.18em] text-[11px] lg:text-[12px] text-black/70">
                    {headlines[headlineIndex].tag}
                  </span>
                </motion.div>
                <h1 className={cx(typography.heading, "max-w-[1160px] text-center text-balance text-[26px] sm:text-[34px] md:text-[44px] lg:text-[54px] xl:text-[60px] sm:short:text-[40px] font-bold leading-[1.06] tracking-[-0.06em] text-black/[0.92]")}>
                  <motion.span
                    className="block"
                    initial={shouldAnimate && headlineIndex === 0 ? { opacity: 0, y: 14 } : false}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.38, ease: [0.0, 0, 0.2, 1], delay: d(180) }}
                  >
                    {headlines[headlineIndex].line1}
                  </motion.span>
                  <motion.span
                    className="block"
                    initial={shouldAnimate && headlineIndex === 0 ? { opacity: 0, y: 14 } : false}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.38, ease: [0.0, 0, 0.2, 1], delay: d(260) }}
                  >
                    {headlines[headlineIndex].line2}
                  </motion.span>
                </h1>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Subtitle */}
          <div
            className="flex max-w-[min(92vw,940px)] flex-col items-center gap-[clamp(0.45rem,0.75vw,0.65rem)] sm:short:gap-1"
          >
            <MaskedRevealText
              text={heroContent.subtitle || 'Hair, lace, and glass break every automated tool. Our editors trace each edge by hand. Try 3 images free, no minimum order.'}
              fontSize="clamp(13px, 1.4vw, 15px)"
              color="rgba(0,0,0,0.72)"
              staggerDelay={shouldAnimate ? 0.025 : 0}
              delay={shouldAnimate ? 0.15 : 0}
              initial={shouldAnimate ? "hidden" : false}
              animate="visible"
              className="px-1 leading-[1.65] sm:px-4 sm:leading-[1.75] sm:short:leading-[1.5]"
            />

            <motion.div
              className="hidden items-center justify-center gap-2.5 sm:flex"
              initial={shouldAnimate ? { opacity: 0, y: 8 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: [0.0, 0, 0.2, 1], delay: d(560) }}
            >
              <Button asChild size="compact" className="min-h-11 sm:short:min-h-10 text-[13px] font-bold active:scale-95">
                <Link to="/free-trial">Get 3 Free Sample Edits</Link>
              </Button>
              <Button asChild variant="secondary" size="compact" className="min-h-11 sm:short:min-h-10 bg-[var(--color-bg-secondary)] text-[13px] font-bold active:scale-95">
                <Link to="/services">View Editing Services</Link>
              </Button>
            </motion.div>



            <div className="grid w-full max-w-[350px] grid-cols-3 gap-1.5 sm:hidden">
              {MOBILE_TRUST_POINTS.map((point) => (
                <div key={point} className="flex min-h-10 items-center justify-center rounded-2xl border border-black/[0.16] bg-white/80 px-2 text-[10px] font-bold leading-tight text-black/55 shadow-sm">
                  {point}
                </div>
              ))}
            </div>
          </div>

          {/* Hero Cards Carousel */}
          <motion.div
            className="relative w-full mt-2.5 sm:mt-3 md:mt-4 lg:mt-5 sm:short:mt-1"
            initial={shouldAnimate ? { opacity: 0, y: 20 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 28, delay: d(700) }}
          >
            <div
              className="absolute inset-0 top-[50%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140vw] h-[80%] opacity-15 blur-[40px] pointer-events-none z-[-1]"
              style={{ background: 'radial-gradient(ellipse at center, #000000 0%, #1a1a1a 40%, transparent 70%)' }}
            />
            <HeroCards />
          </motion.div>

          {/* Social proof bar */}
          <motion.div
            className="flex items-center justify-center mt-10 sm:short:hidden"
            initial={shouldAnimate ? { opacity: 0, y: 8 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut', delay: d(900) }}
          >
            <div className="inline-flex items-center gap-3 rounded-full border border-black/[0.16] bg-white/90 px-3.5 py-2 shadow-[0_2px_14px_rgba(0,0,0,0.12)] backdrop-blur-sm">
              <div className="flex -space-x-2.5">
                {HERO_AVATARS.map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt="Reframe Visuals customer"
                    aria-hidden="true"
                    width={28}
                    height={28}
                    className="h-7 w-7 rounded-full border-2 border-white object-cover"
                    style={{ zIndex: HERO_AVATARS.length - i }}
                  />
                ))}
              </div>
              <span className="text-[12.5px] font-medium text-black/65 pr-0.5">
                <span className="font-bold text-black/90">50k+</span> images hand-edited
              </span>
            </div>
          </motion.div>
        </div>
      </div>
      )}
    </section>
  );
};

export default React.memo(Hero);
