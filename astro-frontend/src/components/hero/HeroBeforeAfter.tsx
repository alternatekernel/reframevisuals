import React from 'react';
import { motion } from 'framer-motion';

interface HeroBeforeAfterProps {
  beforeImage: string;
  afterImage: string;
  isActive: boolean;
  isHovered?: boolean;
  aspectRatio?: string;
  className?: string;
  /** Above-the-fold at initial load: skip lazy-loading so the image is fetched immediately. */
  eager?: boolean;
  /** Likely LCP candidate: eager + fetchpriority="high". */
  priority?: boolean;
}

/**
 * A high-performance, lightweight version of BeforeAfterCard
 * specifically optimized for the Hero section fanning effect.
 * Removes dragging logic, observers, and sequence state to minimize CPU overhead.
 */
// Cards render at ~148-273 CSS px wide; serve a 420px derivative for standard
// displays and 640px for high-DPI via srcset instead of a flat 640px q_auto:best.
// NOTE: keep these in sync with the LCP <link rel="preload"> in frontend/index.html.
const CARD_WIDTHS = [420, 640] as const;
const CARD_SIZES = '(min-width: 640px) 273px, 160px';

const getOptimizedUrl = (url: string, width: number) => {
  if (url.includes('upload/')) {
    return url.replace(
      /upload\/[^/]+\//,
      `upload/f_auto,q_auto,c_scale,w_${width}/`
    );
  }
  return url;
};

const getSrcSet = (url: string) =>
  url.includes('upload/')
    ? CARD_WIDTHS.map((w) => `${getOptimizedUrl(url, w)} ${w}w`).join(', ')
    : undefined;

const HeroBeforeAfter: React.FC<HeroBeforeAfterProps> = ({
  beforeImage,
  afterImage,
  isActive,
  isHovered = false,
  aspectRatio = 'aspect-[4/5]',
  className = '',
  eager = false,
  priority = false,
}) => {
  const [isHoverActive, setIsHoverActive] = React.useState(false);
  const prevHovered = React.useRef(isHovered);

  // Track if we are in a hover-driven transition state
  React.useEffect(() => {
    if (prevHovered.current !== isHovered) {
      setIsHoverActive(true);
      // Keep the fast transition active long enough for the 0.8s animation to finish
      const timer = setTimeout(() => setIsHoverActive(false), 900);
      prevHovered.current = isHovered;
      return () => clearTimeout(timer);
    }
  }, [isHovered]);

  // Reveal the "After" image only when active AND NOT hovered
  const isRevealed = isActive && !isHovered;
  
  // Use fast speed for hover-related movements, slow speed for automatic fanning
  const currentDuration = (isHovered || isHoverActive) ? 0.8 : 2.5;

  return (
    <div className={`relative overflow-hidden bg-gray-50/50 ${aspectRatio} ${className}`}>
      {/* After Image (Background) */}
      <img
        src={getOptimizedUrl(afterImage, CARD_WIDTHS[0])}
        srcSet={getSrcSet(afterImage)}
        sizes={CARD_SIZES}
        className="absolute inset-0 w-full h-full object-cover"
        alt="Ecommerce product photo after professional editing by Reframe Visuals"
        loading={priority || eager || isActive ? "eager" : "lazy"}
        fetchPriority={priority ? 'high' : undefined}
        decoding="async"
        draggable={false}
        onContextMenu={(e) => e.preventDefault()}
      />

      {/* Before Image (Overlay) */}
      <motion.div
        className="absolute inset-0 z-10"
        initial={{ clipPath: 'inset(0 0% 0 0)' }}
        animate={{ 
          clipPath: isRevealed ? 'inset(0 100% 0 0)' : 'inset(0 0% 0 0)',
          opacity: 1 
        }}
        transition={{ 
          duration: currentDuration, 
          ease: [0.4, 0, 0.2, 1],
          delay: (isHovered || isHoverActive) ? 0 : 0.2 
        }}
        style={{ willChange: 'clip-path' }}
      >
        <img
          src={getOptimizedUrl(beforeImage, CARD_WIDTHS[0])}
          srcSet={getSrcSet(beforeImage)}
          sizes={CARD_SIZES}
          className="absolute inset-0 w-full h-full object-cover"
          alt="Ecommerce product photo before editing - Reframe Visuals"
          loading={priority || eager || isActive ? "eager" : "lazy"}
          fetchPriority={priority ? 'high' : undefined}
          decoding="async"
          draggable={false}
          onContextMenu={(e) => e.preventDefault()}
        />
      </motion.div>

      {/* Subtle Divider Line */}
      <motion.div
        className="absolute inset-y-0 z-20 w-[1px] bg-white/40 pointer-events-none"
        initial={{ left: '100%' }}
        animate={{ left: isRevealed ? '0%' : '100%' }}
        transition={{ 
          duration: currentDuration, 
          ease: [0.4, 0, 0.2, 1], 
          delay: (isHovered || isHoverActive) ? 0 : 0.2 
        }}
        style={{ willChange: 'left' }}
      />
    </div>
  );
};

export default React.memo(HeroBeforeAfter);
