import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useServicesContext } from '../../context/ServicesContext';
import BeforeAfterCard from '../../components/BeforeAfterCard';
import { cx, tokens } from '../../utils/theme';

export interface GridImage {
  id: string;
  before: string;
  after: string;
  alt: string;
}

// Performance Helper: Cloudinary Dynamic Sizing
const getOptimizedUrl = (url: string, width = 800) => {
  return url.replace('f_auto,q_auto,w_1200', `f_auto,q_auto:best,fl_progressive:steep,dpr_auto,c_scale,w_${width}`);
};

const ImageGridSection = ({ images }: { images: GridImage[] }) => {
  const navigate = useNavigate();
  const { getStartingPrice, services } = useServicesContext();
  const [activeMobileIndex, setActiveMobileIndex] = useState(0);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  const mobileSummaryById = useMemo(() => {
    const toShortSummary = (text: string) => {
      const normalized = text.replace(/\s+/g, ' ').trim();
      if (!normalized) return '';
      const firstSentence = normalized.split('. ')[0]?.trim() || normalized;
      if (firstSentence.length <= 62) return firstSentence.replace(/\.$/, '');
      return `${firstSentence.slice(0, 59).trimEnd()}...`;
    };

    return Object.fromEntries(
      (services || []).map((service: any) => [service.id, toShortSummary(service.description || service.detail || '')])
    ) as Record<string, string>;
  }, [services]);

  useEffect(() => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return;

    const isMobile = () => window.matchMedia('(max-width: 639px)').matches;
    let observer: IntersectionObserver | null = null;

    const setupObserver = () => {
      if (!isMobile()) {
        observer?.disconnect();
        observer = null;
        return;
      }

      observer?.disconnect();
      observer = new IntersectionObserver(
        (entries) => {
          let bestIndex = -1;
          let bestRatio = 0;

          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const index = Number((entry.target as HTMLElement).dataset.mobileCardIndex);
            if (!Number.isFinite(index)) return;
            if (entry.intersectionRatio > bestRatio) {
              bestRatio = entry.intersectionRatio;
              bestIndex = index;
            }
          });

          if (bestIndex >= 0) setActiveMobileIndex(bestIndex);
        },
        {
          threshold: [0.35, 0.55, 0.75],
          rootMargin: '-20% 0px -20% 0px',
        }
      );

      cardRefs.current.forEach((el) => {
        if (el) observer?.observe(el);
      });
    };

    setupObserver();
    window.addEventListener('resize', setupObserver);

    return () => {
      window.removeEventListener('resize', setupObserver);
      observer?.disconnect();
    };
  }, [images.length]);

  return (
    <section id="image-grid" data-section="image-grid" className="pt-10 pb-4 lg:pt-16 lg:pb-6 bg-white overflow-hidden relative">
      <div className="flex flex-col w-full items-center justify-center gap-6 lg:gap-10">
        {/* Services Title */}
        <div className="text-center px-6">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-black/30 sm:hidden">
            Real before / after proof
          </p>
          <motion.h2
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="font-heading text-[34px] md:text-[48px] lg:text-[62px] font-semibold tracking-[-0.04em] leading-[1.08] text-[var(--color-text-primary)] mb-3 sm:mb-5"
          >
            See the edit. <br />
            <span className="text-black/40 sm:hidden">Then order it.</span>
            <span className="hidden sm:inline text-black/45">Everything human handled.</span>
          </motion.h2>
          <p className="mx-auto mb-5 max-w-[330px] text-[16px] font-medium leading-relaxed text-black/55 sm:hidden">
            Compare real edits, choose the service, and start your order in seconds.
          </p>

          {/* Turnaround Pills */}
          <div className="w-full mt-6 sm:mt-10 px-4">
            <div className="grid grid-cols-2 gap-2 max-w-[320px] mx-auto sm:flex sm:flex-wrap sm:justify-center sm:max-w-none">
              {[
                { time: '12h', label: 'Express' },
                { time: '24h', label: 'Standard' },
                { time: '48h', label: 'Relaxed' },
                { time: '72h', label: 'Economy' },
              ].map(({ time, label }) => (
                <div
                  key={label}
                  className={`flex items-center justify-center gap-1.5 sm:gap-2 rounded-full border px-3 sm:px-4 py-1.5 sm:py-2 cursor-default w-full sm:w-auto ${
                    label === 'Standard'
                      ? 'border-[var(--color-text-primary)] bg-[var(--color-text-primary)] text-white'
                      : 'border-black/[0.18] bg-white text-[var(--color-text-primary)]'
                  }`}
                >
                  <span className="text-[14px] font-bold">{time}</span>
                  <span className={`text-[12px] font-medium ${label === 'Standard' ? 'text-white/65' : 'text-black/45'}`}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-8 w-full max-w-[1600px] px-5 sm:px-6 lg:px-12">
          {images.map((img, i) => (
            <motion.div
              key={i}
              ref={(el) => {
                cardRefs.current[i] = el;
              }}
              data-mobile-card-index={i}
              onClick={() => navigate(`/services/${img.id}`)}
              initial={{ opacity: 0, scale: 0.98, y: 30 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: i * 0.05 }}
              className="group relative overflow-hidden rounded-[24px] border border-black/[0.16] bg-white shadow-[0_14px_40px_rgba(0,0,0,0.11)] cursor-pointer touch-manipulation [content-visibility:auto] [contain-intrinsic-size:520px] sm:aspect-[4/5] sm:rounded-none sm:border-0 sm:bg-[var(--color-bg-secondary)] sm:shadow-none"
            >
              <div className="relative aspect-[4/5] overflow-hidden bg-[var(--color-bg-secondary)] sm:hidden">
                <BeforeAfterCard
                  beforeImage={getOptimizedUrl(img.before, 640)}
                  afterImage={getOptimizedUrl(img.after, 640)}
                  aspectRatio="aspect-[4/5]"
                  isActive={activeMobileIndex === i}
                  disableEntryAnimation
                  hideLabels
                  hideHandle
                  hideInteractionUI
                  disableHoverInteraction
                  sweepDuration={1800}
                  returnDuration={1200}
                  className="h-full"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
              </div>

              <div className="relative hidden aspect-[4/5] overflow-hidden bg-[var(--color-bg-secondary)] sm:absolute sm:inset-0 sm:block sm:aspect-auto">
              {/* Before Image */}
              <img
                src={getOptimizedUrl(img.before, 640)}
                srcSet={`${getOptimizedUrl(img.before, 360)} 360w, ${getOptimizedUrl(img.before, 640)} 640w, ${getOptimizedUrl(img.before, 960)} 960w`}
                sizes="(max-width: 640px) calc((100vw - 40px) / 2), (max-width: 1024px) 50vw, 33vw"
                alt={`${img.alt} product photo editing before - Reframe Visuals`}
                loading="lazy"
                decoding="async"
                className="absolute inset-y-0 left-0 block w-1/2 h-full object-cover object-left transition-opacity duration-300 ease-in-out sm:inset-0 sm:w-full sm:object-center sm:opacity-0 sm:group-hover:opacity-100"
              />

              {/* After Image */}
              <img
                src={getOptimizedUrl(img.after, 640)}
                srcSet={`${getOptimizedUrl(img.after, 360)} 360w, ${getOptimizedUrl(img.after, 640)} 640w, ${getOptimizedUrl(img.after, 960)} 960w`}
                sizes="(max-width: 640px) calc((100vw - 40px) / 2), (max-width: 1024px) 50vw, 33vw"
                alt={`${img.alt} product photo editing after - Reframe Visuals`}
                loading={i === 0 ? "eager" : "lazy"}
                decoding="async"
                className="absolute inset-y-0 right-0 w-1/2 h-full object-cover object-right transition-opacity duration-300 ease-in-out sm:inset-0 sm:w-full sm:object-center sm:group-hover:opacity-0"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
              </div>

              {/* Combined Info & Order Bar - Flush at bottom edge with fade-in transition */}
              <div className="absolute bottom-0 inset-x-0 hidden overflow-hidden sm:block">
                <div 
                  className="opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-between bg-white/95 backdrop-blur-sm border-t border-black/[0.18] p-4 text-[var(--color-text-primary)] shadow-[0_-16px_40px_rgba(0,0,0,0.10)]"
                >
                  {/* Left Side: Service Info */}
                  <div className="flex flex-col items-start gap-1 min-w-0 pr-4">
                    <span className="text-[12px] font-bold uppercase tracking-wider text-black/55 whitespace-nowrap leading-none">
                      Before applying:
                    </span>
                    <span className="text-[17px] font-black text-[var(--color-text-primary)] truncate leading-tight max-w-[130px] md:max-w-[170px] pb-0.5">
                      {img.alt}
                    </span>
                  </div>

                  {/* Divider */}
                  <div className="w-[2px] h-10 bg-black/10 self-center mx-2" />

                  {/* Right Side: Interactive Action */}
                  <div 
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/order?serviceId=${img.id}`);
                    }}
                    className="group inline-flex min-h-[48px] items-center justify-center gap-2.5 whitespace-nowrap rounded-full bg-[var(--color-text-primary)] py-1.5 pl-6 pr-1.5 text-[16px] font-bold text-white shadow-[0_8px_24px_rgba(0,0,0,0.10)] transition-all hover:bg-black active:scale-95 cursor-pointer shrink-0"
                  >
                    <span className="font-black leading-none">
                      from ${getStartingPrice(img.id, 0.39).toFixed(2)}
                    </span>
                    <div className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/90 text-black">
                      <ArrowRight size={16} className="transition-transform duration-300 group-hover:-rotate-45" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col px-3 pt-3 pb-3 gap-1.5 sm:hidden">
                <div className="flex items-center justify-between gap-3">
                  <p className="truncate text-[16px] font-bold tracking-tight text-black/90">{img.alt}</p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/order?serviceId=${img.id}`);
                    }}
                    className="flex min-h-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-text-primary)] px-3.5 text-[13px] font-bold text-white shadow-md touch-manipulation"
                  >
                    from ${getStartingPrice(img.id, 0.39).toFixed(2)}
                  </button>
                </div>
                <p className="text-[13.5px] font-medium text-black/55 line-clamp-1">
                  {mobileSummaryById[img.id] || 'Before to after preview'}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
          className="mb-8 sm:mb-10 flex flex-col items-center"
        >
          <Link 
            to="/services" 
            className="group inline-flex items-center justify-center gap-1.5 text-base sm:text-[18px] font-bold text-[var(--color-text-primary)] transition-all"
          >
            <span className="relative">
              Explore all services
              <span className={tokens.interactiveUnderline} />
            </span>
            <ArrowRight size={16} className="text-black/40 transition-all duration-300 group-hover:-rotate-45 group-hover:text-black/70 shrink-0" />
          </Link>

          {/* Other Services Links */}
          <div className="flex flex-wrap justify-center items-center gap-x-3 gap-y-2.5 text-[13px] max-w-3xl mx-auto px-4 mt-6 lg:mt-10 text-black/40">
            {services
              .filter((s: any) => !['retouching', 'pattern-change', 'jewelry-retouch', 'color-correction', 'ghost-mannequin', 'background-removal'].includes(s.id))
              .map((service: any) => (
                <Link
                  key={service.id}
                  to={`/services/${service.id}`}
                  className="px-3.5 py-1.5 text-[13px] font-semibold text-black/55 bg-black/[0.05] hover:bg-black/[0.07] hover:text-[var(--color-text-primary)] rounded-full transition-all duration-200"
                >
                  {service.name}
                </Link>
              ))}
          </div>

          {/* Custom Quote/Inquiry Pill */}
          <div className="mt-5 sm:mt-6 flex justify-center w-full">
            <Link
              to="/contact"
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-[13px] font-semibold text-black/70 bg-white border border-black/[0.18] hover:border-black/20 hover:bg-black hover:text-white rounded-full transition-all duration-200 shadow-sm active:scale-95 group"
            >
              <span>Need anything custom? Let&apos;s give it a try</span>
              <ArrowRight size={13} className="text-black/40 group-hover:text-white/80 transition-all duration-300 group-hover:-rotate-45" />
            </Link>
          </div>
        </motion.div>

      </div>

    </section>
  );
};

export default ImageGridSection;
