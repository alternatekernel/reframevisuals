import { useEffect, useRef, useState } from 'react';
import { useContent } from '../context/ContentBase';
import { isLikelyCrawler } from '../utils/crawler';
import { cx, layout, typography } from '../utils/theme';
import { motion, useInView } from 'framer-motion';
import { DotBackground } from '../components/ui/DotBackground';
import { ArrowRight } from 'lucide-react';

const SOURCE_URLS: Record<string, string> = {
  'Salsify 2025 Consumer Report': 'https://www.salsify.com/blog/images-and-videos-most-important-product-page-elements',
  'Baymard Institute UX Research': 'https://baymard.com/blog/home-and-hardware-ux-benchmark-2026',
  'NRF Happy Returns Report': 'https://nrf.com/media-center/press-releases/nrf-and-happy-returns-report-2024-retail-returns-total-890-billion',
};

const CARD_THEMES = [
  {
    hoverBorder: 'hover:border-zinc-300',
    hoverShadow: 'hover:shadow-[0_24px_50px_-12px_rgba(0,0,0,0.06)]',
    cardGlow: 'before:shadow-[0_28px_40px_-24px_rgba(0,0,0,0.08)]',
  },
  {
    hoverBorder: 'hover:border-zinc-300',
    hoverShadow: 'hover:shadow-[0_24px_50px_-12px_rgba(0,0,0,0.06)]',
    cardGlow: 'before:shadow-[0_28px_40px_-24px_rgba(0,0,0,0.08)]',
  },
  {
    hoverBorder: 'hover:border-zinc-300',
    hoverShadow: 'hover:shadow-[0_24px_50px_-12px_rgba(0,0,0,0.06)]',
    cardGlow: 'before:shadow-[0_28px_40px_-24px_rgba(0,0,0,0.08)]',
  }
];

const AnimatedNumber = ({ value }: { value: string }) => {
  const numValue = parseInt(value.replace(/[^0-9]/g, ''));
  const hasPercent = value.includes('%');
  const hasBillion = value.includes('B');
  // Initialize to the final value so server-rendered/prerendered HTML contains
  // the real number (crawlers never see "0%"). The count-up animation takes
  // over client-side once the number scrolls into view.
  const [count, setCount] = useState(numValue);
  const numberRef = useRef<HTMLSpanElement | null>(null);
  const isInView = useInView(numberRef, { once: true, margin: '-10% 0px' });

  useEffect(() => {
    if (!isInView) return;
    // Crawlers and the build-time prerenderer must capture the static final
    // value, not an animation frame.
    if (isLikelyCrawler()) return;

    const duration = 2000;
    const start = performance.now();
    let frameId = 0;

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(numValue * eased));

      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
      }
    };

    frameId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frameId);
  }, [isInView, numValue]);

  const displayValue = hasPercent 
    ? `${count}%`
    : hasBillion 
      ? `${(count / 1).toFixed(0)}B`
      : count.toString();
      
  return <span ref={numberRef}>{displayValue}</span>;
};

const Stats = () => {
  const { getSectionContent } = useContent();
  const content = getSectionContent('stats');
  const stats = (content.stats || []) as any[];
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const isInView = useInView(sectionRef, { once: false, margin: '-20% 0px' });

  const getSourceUrl = (source: string) => SOURCE_URLS[source] || '#';

  return (
    <section ref={sectionRef} id="stats" className={cx("pt-10 pb-12 sm:pt-12 sm:pb-14 lg:pt-16 lg:pb-20 bg-white text-center relative overflow-hidden scroll-mt-nav", layout.sectionGutter)}>
      <div className={cx(layout.contentShell, "relative z-10")}>
        {/* Reframe Conventional Header */}
        <h2
          className={cx(typography.displayLg, "text-[var(--color-text-primary)] mb-8 sm:mb-12 lg:mb-16")}
        >
          {content.heading || 'The research is clear.'} <br className="hidden lg:block" />
          <span className="text-black/40">{content.subheading || 'The best brands already act on it.'}</span>
        </h2>

        {/* Large Developer Floating Cards Grid */}
        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto z-10">
          <DotBackground variant="ellipse" className="absolute -inset-y-20 left-1/2 -translate-x-1/2 w-screen h-[calc(100%+160px)] opacity-[0.45] pointer-events-none" />
          {stats.map((stat: any, i: number) => {
            const theme = CARD_THEMES[i % CARD_THEMES.length];
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                className={cx(
                  "relative py-12 lg:py-16 px-6 lg:px-8 bg-white border border-zinc-200/80 shadow-[0_12px_32px_-12px_rgba(0,0,0,0.04)] rounded-3xl flex flex-col justify-between items-center transition-all duration-300 overflow-hidden group min-h-[320px] md:min-h-[360px] before:pointer-events-none before:absolute before:left-[10%] before:right-[10%] before:bottom-4 before:h-16 before:rounded-full before:bg-black/[0.02] before:blur-2xl before:transition-all before:duration-300 hover:-translate-y-1 hover:before:bottom-2",
                  theme.hoverBorder,
                  theme.hoverShadow,
                  theme.cardGlow
                )}
              >
                <a
                  href={getSourceUrl(stat.source)}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Open source article for ${stat.source}`}
                  className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 bg-white/95 text-zinc-400 opacity-0 shadow-[0_10px_24px_rgba(0,0,0,0.08)] transition-all duration-200 group-hover:opacity-100 group-hover:translate-y-0 translate-y-1 hover:border-zinc-900 hover:bg-zinc-900 hover:text-white"
                >
                  <ArrowRight size={16} className="transition-transform duration-300 group-hover:-rotate-45" />
                </a>

                {/* Step index */}
                <div className="font-mono text-[10px] sm:text-[11px] text-zinc-400 font-bold uppercase tracking-[0.25em] mb-4">
                  0{i + 1}
                </div>

                {/* Number/Metric */}
                <span className="block text-[48px] sm:text-[56px] lg:text-[64px] font-mono font-black tracking-tight text-zinc-900 leading-none">
                  <AnimatedNumber value={stat.value} />
                </span>

                {/* Description */}
                <p className="mt-4 text-[15px] sm:text-[16px] font-semibold text-zinc-500 leading-relaxed max-w-[260px] mx-auto mb-6 flex-grow">
                  {stat.label}
                </p>

                {/* Report source badge */}
                <div className="mt-auto pt-2">
                  <a
                    href={getSourceUrl(stat.source)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-[11px] font-mono font-bold tracking-[0.16em] text-black/35 hover:text-black/80 hover:underline underline-offset-4 decoration-black/20 transition-all duration-200 uppercase"
                  >
                    {stat.source}
                  </a>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Stats;
