import React, { useRef, useState, useEffect, useCallback } from 'react';
import { motion, useSpring, useMotionValue, animate, type PanInfo } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { HERO_SERVICES } from '../../data/heroServices';
import HeroCard from './HeroCard';

const GAP = 265;
const CARD_WIDTH = 273;
const INITIAL_CENTER_INDEX = 2;

const HeroCards: React.FC = () => {
  const isDraggingRef = useRef(false);
  const [isDragging, setIsDragging] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  // Hero is above the fold — treat as in-view from the start so auto-advance
  // begins immediately on hydration without waiting for the observer to fire.
  const [isInView, setIsInView] = useState(true);
  const isInViewRef = useRef(true);

  const progress = useMotionValue(INITIAL_CENTER_INDEX);
  const expansion = useMotionValue(1);
  const gap = useMotionValue(GAP);
  const cardWidth = useMotionValue(CARD_WIDTH);

  const smoothProgress = useSpring(progress, { stiffness: 150, damping: 25 });
  const smoothExpansion = useSpring(expansion, { stiffness: 80, damping: 20 });

  // Responsive dimensions
  useEffect(() => {
    const updateDimensions = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      let tGap = 265;
      let tWidth = 273;

      if (w < 390) { tGap = 138; tWidth = 148; }
      else if (w < 640) { tGap = 150; tWidth = 160; }
      else if (w < 1024) { tGap = 190; tWidth = 195; }
      else if (w < 1440) { tGap = 210; tWidth = 210; }

      if (w >= 640) {
        const short = h <= 860;
        const stageH = short
          ? Math.min(Math.max(h * 0.42, 280), 340)
          : w >= 1024
            ? Math.min(Math.max(h * 0.44, 330), 440)
            : Math.min(Math.max(h * 0.42, 300), 360);
        const maxW = Math.floor((stageH - (short ? 75 : 60)) / 1.25);
        if (maxW < tWidth) {
          tGap = Math.round(tGap * (maxW / tWidth));
          tWidth = maxW;
        }
      }

      animate(gap, tGap, { duration: 0.3 });
      animate(cardWidth, tWidth, { duration: 0.3 });
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [gap, cardWidth]);

  // Horizontal trackpad scroll
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let wheelTimeout: ReturnType<typeof setTimeout>;

    const handleWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      e.preventDefault();
      if (!isDraggingRef.current) {
        progress.stop();
        isDraggingRef.current = true;
      }
      progress.set(progress.get() + e.deltaX * 0.006);
      clearTimeout(wheelTimeout);
      wheelTimeout = setTimeout(() => {
        isDraggingRef.current = false;
        const cur = progress.get();
        animate(progress, Math.round(cur), { type: 'spring', stiffness: 150, damping: 25 });
      }, 150);
    };
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [progress]);

  const handleCardComplete = useCallback(
    (idx: number) => {
      if (!isInViewRef.current || document.hidden || isDraggingRef.current) return;
      const cur = progress.get();
      const norm = ((cur % HERO_SERVICES.length) + HERO_SERVICES.length) % HERO_SERVICES.length;
      const dist = Math.abs(idx - norm);
      const isCenter = dist < 0.1 || dist > HERO_SERVICES.length - 0.1;
      if (isCenter) {
        setTimeout(() => {
          if (isDraggingRef.current || !isInViewRef.current || document.hidden) return;
          animate(progress, Math.round(cur + 1), { type: 'spring', stiffness: 40, damping: 20 });
        }, 1000);
      }
    },
    [progress]
  );

  const handlePanStart = () => { isDraggingRef.current = true; setIsDragging(true); };
  const handlePan = (_: any, info: PanInfo) => {
    progress.set(progress.get() + (-info.delta.x / gap.get()));
  };
  const handlePanEnd = (_: any, info: PanInfo) => {
    isDraggingRef.current = false;
    setIsDragging(false);
    const velocity = -info.velocity.x / gap.get();
    animate(progress, Math.round(progress.get() + velocity * 0.2), {
      type: 'spring', stiffness: 100, damping: 20,
    });
  };

  // IntersectionObserver for pausing when offscreen
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { isInViewRef.current = entry.isIntersecting; setIsInView(entry.isIntersecting); },
      { threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Freeze on page scroll
  useEffect(() => {
    let debounce: ReturnType<typeof setTimeout>;
    const onScroll = () => {
      if (!isDraggingRef.current) { progress.stop(); isDraggingRef.current = true; }
      clearTimeout(debounce);
      debounce = setTimeout(() => { isDraggingRef.current = false; }, 200);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [progress]);

  // Auto-advance interval
  useEffect(() => {
    if (!isInView) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const interval = window.setInterval(() => {
      if (isDraggingRef.current) return;
      animate(progress, Math.round(progress.get() + 1), { type: 'spring', stiffness: 90, damping: 18 });
    }, 3200);
    return () => clearInterval(interval);
  }, [isInView, progress]);

  const cards = HERO_SERVICES;

  return (
    <div ref={wrapperRef} className="flex flex-col items-center w-full overflow-visible select-none relative">
      <div className="relative flex h-[clamp(184px,30svh,230px)] w-full items-center justify-center sm:h-[clamp(300px,42svh,360px)] lg:h-[clamp(330px,44svh,440px)]">
        {/* Shadow */}
        <div className="pointer-events-none absolute bottom-[3%] left-1/2 h-[18%] w-[74%] -translate-x-1/2 rounded-[50%] bg-black/[0.11] opacity-60 blur-[34px]" />
        <div className="pointer-events-none absolute bottom-[9%] left-1/2 h-px w-[58%] -translate-x-1/2 bg-gradient-to-r from-transparent via-black/[0.10] to-transparent" />

        {/* Navigation arrows */}
        <div className="absolute inset-x-0 z-[150] flex justify-between px-1 pointer-events-none sm:px-4 lg:px-12">
          <button
            onClick={() => {
              // Snap from current spring position so rapid clicks don't stack
              const cur = smoothProgress.get();
              progress.set(cur);
              animate(progress, Math.round(cur) - 1, { type: 'spring', stiffness: 200, damping: 25 });
            }}
            className="group pointer-events-auto flex min-h-11 min-w-11 items-center justify-center rounded-full border border-black/[0.08] bg-[#FAFAF9]/95 p-2 backdrop-blur-md touch-manipulation transition-transform hover:-translate-y-0.5 sm:min-h-0 sm:min-w-0 sm:p-4"
            aria-label="Previous card"
          >
            <ChevronLeft size={20} className="text-black/50 transition-colors group-hover:text-black/80 sm:h-6 sm:w-6" />
          </button>
          <button
            onClick={() => {
              const cur = smoothProgress.get();
              progress.set(cur);
              animate(progress, Math.round(cur) + 1, { type: 'spring', stiffness: 200, damping: 25 });
            }}
            className="group pointer-events-auto flex min-h-11 min-w-11 items-center justify-center rounded-full border border-black/[0.08] bg-[#FAFAF9]/95 p-2 backdrop-blur-md touch-manipulation transition-transform hover:-translate-y-0.5 sm:min-h-0 sm:min-w-0 sm:p-4"
            aria-label="Next card"
          >
            <ChevronRight size={20} className="text-black/50 transition-colors group-hover:text-black/80 sm:h-6 sm:w-6" />
          </button>
        </div>

        {/* Card stage */}
        <motion.div
          ref={containerRef}
          className="relative w-full h-full flex items-center justify-center z-[100]"
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
          onPanStart={handlePanStart}
          onPan={handlePan}
          onPanEnd={handlePanEnd}
        >
          {cards.map((card, idx) => (
            <HeroCard
              key={card.id}
              card={card}
              index={idx}
              total={cards.length}
              progress={smoothProgress}
              isDragging={isDragging}
              paused={!isInView}
              expansion={smoothExpansion}
              gap={gap}
              cardWidth={cardWidth}
              eager={Math.abs(idx - INITIAL_CENTER_INDEX) <= 1}
              priority={idx === INITIAL_CENTER_INDEX}
              onAnimationComplete={handleCardComplete}
            />
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default HeroCards;
