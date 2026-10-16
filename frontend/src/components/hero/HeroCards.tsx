import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { motion, useSpring, useMotionValue, animate, PanInfo } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { SERVICES } from '../../data/services';
import HeroCard from './HeroCard';
import { cx, tokens } from '../../utils/theme';

const HERO_CONFIG = {
  GAP: 265,
  MAX_TILT: 4,
  CARD_WIDTH: 273,
  PRIORITY_IDS: [
    'jewelry-retouch', 'color-change', 'pattern-change',
    'ghost-mannequin', 'model-retouch', 'garment-retouch', 'manipulation'
  ]
};

// The carousel starts with card index 2 centered (progress initial value below).
// That card's images are above the fold and the page's LCP candidates, so they
// must not be lazy-loaded; its immediate neighbours are also visible at load.
const INITIAL_CENTER_INDEX = 2;

interface HeroCardsProps {
}

const HeroCards: React.FC<HeroCardsProps> = () => {
  const isDraggingRef = useRef(false);
  const [isDragging, setIsDragging] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);
  const isInViewRef = useRef(false);
  const hasUserScrolledRef = useRef(false);
  
  const progress = useMotionValue(INITIAL_CENTER_INDEX);
  const expansion = useMotionValue(1);
  const gap = useMotionValue(HERO_CONFIG.GAP);
  const cardWidth = useMotionValue(HERO_CONFIG.CARD_WIDTH);
  
  const smoothProgress = useSpring(progress, { stiffness: 150, damping: 25 });
  const smoothExpansion = useSpring(expansion, { stiffness: 80, damping: 20 });

  // Responsive dimensions handled efficiently
  useEffect(() => {
    const updateDimensions = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      let targetGap = 265;
      let targetWidth = 273;

      if (width < 390) {
        targetGap = 138;
        targetWidth = 148;
      } else if (width < 640) {
        targetGap = 150;
        targetWidth = 160;
      } else if (width < 1024) {
        targetGap = 190;
        targetWidth = 195;
      } else if (width < 1440) {
        targetGap = 210;
        targetWidth = 210;
      }

      // On short viewports (e.g. laptops with OS display scaling) the stage
      // height clamp bottoms out below the full card height, clipping the
      // captions. Cap the card width so the card (4:5 media + ~60px footer)
      // fits the stage; on tall viewports this resolves above the width tier
      // and changes nothing.
      if (width >= 640) {
        // Short viewports also reserve room for the fixed ReframeCS dock
        // (~80px band at the bottom), so the stage shrinks further there.
        // Must mirror the stage container's h-[clamp(...)] classes below.
        const short = height <= 860;
        const stageHeight = short
          ? Math.min(Math.max(height * 0.42, 280), 340)
          : width >= 1024
            ? Math.min(Math.max(height * 0.44, 330), 440)
            : Math.min(Math.max(height * 0.42, 300), 360);
        // Footer/padding is ~60px; the tilted side cards also ride up to
        // ~15px lower (y arc), so short viewports reserve that too to stay
        // clear of the fixed ReframeCS dock.
        const maxWidthForHeight = Math.floor((stageHeight - (short ? 75 : 60)) / 1.25);
        if (maxWidthForHeight < targetWidth) {
          targetGap = Math.round(targetGap * (maxWidthForHeight / targetWidth));
          targetWidth = maxWidthForHeight;
        }
      }

      animate(gap, targetGap, { duration: 0.3 });
      animate(cardWidth, targetWidth, { duration: 0.3 });
    };
    
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [gap, cardWidth]);

  // Handle scroll wheel events cleanly without React passive event warnings
  const containerRef = useRef<HTMLDivElement>(null);
  const isWheelingRef = useRef(false);
  const wheelStartRef = useRef(0);
  const lastDeltaRef = useRef(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    
    let wheelTimeout: NodeJS.Timeout;

    const handleWheel = (e: WheelEvent) => {
      // Determine if the scroll is primarily horizontal (trackpad swipe)
      const isHorizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY);
      
      // If it's a vertical scroll (standard mouse wheel), let the browser scroll the page normally!
      if (!isHorizontal) {
        return;
      }
      
      // Only prevent default for horizontal swipes to avoid browser "back" gestures
      e.preventDefault();
      
      const delta = e.deltaX;
      
      if (!isWheelingRef.current) {
        progress.stop(); // Instantly kill any active auto-scroll animations!
        isWheelingRef.current = true;
        wheelStartRef.current = progress.get();
        // Pause auto-scroll while interacting
        isDraggingRef.current = true;
      }
      
      // Multiplier for trackpad horizontal swipe
      const progressDelta = (delta * 0.006);
      lastDeltaRef.current = progressDelta;
      progress.set(progress.get() + progressDelta);

      if (wheelTimeout) clearTimeout(wheelTimeout);
      wheelTimeout = setTimeout(() => {
        isWheelingRef.current = false;
        isDraggingRef.current = false;
        
        const current = progress.get();
        let target = Math.round(current);
        
        // Smart snapping: Respect their final swipe direction.
        // If they start scrolling down, but instantly switch and swipe up, 
        // we use the direction of their LAST tick to snap, perfectly matching intent.
        const diff = current - wheelStartRef.current;
        const lastDirection = lastDeltaRef.current > 0 ? 1 : -1;
        
        if (Math.abs(diff) > 0.1 && Math.abs(diff) < 0.5) {
          target = lastDirection > 0 ? Math.ceil(current) : Math.floor(current);
        }

        animate(progress, target, { type: "spring", stiffness: 150, damping: 25 });
      }, 150);
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [progress]);

  const allCards = useMemo(() => {
    const prioritized = SERVICES.filter(s => HERO_CONFIG.PRIORITY_IDS.includes(s.id));
    const others = SERVICES.filter(s => !HERO_CONFIG.PRIORITY_IDS.includes(s.id) && s.beforeImage);
    return [...prioritized, ...others].slice(0, 10);
  }, []);

  const handleCardComplete = useCallback((idx: number) => {
    // Offscreen or hidden tab: stop the reveal->advance chain entirely. The
    // 3.2s in-view interval restarts motion when the carousel scrolls back in.
    if (!isInViewRef.current || document.hidden) return;
    if (isDraggingRef.current) return;
    const current = progress.get();
    const normalizedProgress = ((current % allCards.length) + allCards.length) % allCards.length;
    const dist = Math.abs(idx - normalizedProgress);
    const isAtCenter = dist < 0.1 || dist > (allCards.length - 0.1);

    if (isAtCenter) {
      setTimeout(() => {
        if (isDraggingRef.current || !isInViewRef.current || document.hidden) return;
        const target = Math.round(current + 1);
        animate(progress, target, { type: "spring", stiffness: 40, damping: 20 });
      }, 1000);
    }
  }, [allCards.length, progress]);

  const handlePanStart = () => {
    isDraggingRef.current = true;
    setIsDragging(true);
  };

  const handlePan = (_: any, info: PanInfo) => {
    const delta = -info.delta.x / gap.get();
    progress.set(progress.get() + delta);
  };

  const handlePanEnd = (_: any, info: PanInfo) => {
    isDraggingRef.current = false;
    setIsDragging(false);
    const velocity = -info.velocity.x / gap.get();
    const current = progress.get();
    const target = Math.round(current + velocity * 0.2);
    
    animate(progress, target, { type: "spring", stiffness: 100, damping: 20 });
  };

  useEffect(() => {
    const element = wrapperRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        isInViewRef.current = entry.isIntersecting;
        setIsInView(entry.isIntersecting);
      },
      { threshold: 0.35 }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const scrollDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 24) {
        hasUserScrolledRef.current = true;
      }

      // Freeze all carousel motion the instant scrolling begins
      if (!isDraggingRef.current) {
        progress.stop();
        isDraggingRef.current = true;
      }

      if (scrollDebounceRef.current) clearTimeout(scrollDebounceRef.current);
      scrollDebounceRef.current = setTimeout(() => {
        isDraggingRef.current = false;
      }, 200);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollDebounceRef.current) clearTimeout(scrollDebounceRef.current);
    };
  }, [progress]);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (prefersReducedMotion.matches || !isInView) return;

    const interval = window.setInterval(() => {
      if (isDraggingRef.current) return;
      const current = progress.get();
      animate(progress, Math.round(current + 1), { type: 'spring', stiffness: 90, damping: 18 });
    }, 3200);

    return () => window.clearInterval(interval);
  }, [isInView, progress]);

  return (
    <div ref={wrapperRef} className="flex flex-col items-center w-full pt-0 pb-0 overflow-visible select-none relative">
      <div className="relative flex h-[clamp(184px,30svh,230px)] w-full items-center justify-center sm:h-[clamp(300px,42svh,360px)] lg:h-[clamp(330px,44svh,440px)] sm:short:h-[clamp(280px,42svh,340px)]">
        {/* Gallery stage */}
        <div className="pointer-events-none absolute bottom-[3%] left-1/2 h-[18%] w-[74%] -translate-x-1/2 rounded-[50%] bg-black/[0.11] opacity-60 blur-[34px]" />
        <div className="pointer-events-none absolute bottom-[9%] left-1/2 h-px w-[58%] -translate-x-1/2 bg-gradient-to-r from-transparent via-black/[0.10] to-transparent" />
        
        {/* Navigation Arrows */}
        <div className="absolute inset-x-0 z-[150] flex justify-between px-1 pointer-events-none sm:px-4 lg:px-12">
          <button
            onClick={() => animate(progress, Math.round(progress.get() - 1), { type: "spring", stiffness: 200, damping: 25 })}
            className={cx('group pointer-events-auto flex min-h-11 min-w-11 items-center justify-center rounded-full bg-[var(--color-bg-secondary)]/95 p-2 backdrop-blur-md touch-manipulation sm:min-h-0 sm:min-w-0 sm:p-4', tokens.borderLight, tokens.motionLift)}
          >
            <ChevronLeft size={20} className="text-black/50 transition-colors group-hover:text-black/80 sm:h-6 sm:w-6" />
          </button>
          <button
            onClick={() => animate(progress, Math.round(progress.get() + 1), { type: "spring", stiffness: 200, damping: 25 })}
            className={cx('group pointer-events-auto flex min-h-11 min-w-11 items-center justify-center rounded-full bg-[var(--color-bg-secondary)]/95 p-2 backdrop-blur-md touch-manipulation sm:min-h-0 sm:min-w-0 sm:p-4', tokens.borderLight, tokens.motionLift)}
          >
            <ChevronRight size={20} className="text-black/50 transition-colors group-hover:text-black/80 sm:h-6 sm:w-6" />
          </button>
        </div>

        <motion.div 
          ref={containerRef}
          className="relative w-full h-full flex items-center justify-center z-[100]"
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
          onPanStart={handlePanStart}
          onPan={handlePan}
          onPanEnd={handlePanEnd}
        >
          {allCards.map((card, idx) => (
             <HeroCard 
                key={`${card.id}-${idx}`}
                card={card}
                index={idx}
                total={allCards.length}
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
