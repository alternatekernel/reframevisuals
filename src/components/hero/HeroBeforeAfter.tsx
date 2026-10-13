import React from 'react';
import { motion } from 'framer-motion';

interface HeroBeforeAfterProps {
  beforeImage: string;
  afterImage: string;
  isActive: boolean;
  isHovered?: boolean;
  className?: string;
  eager?: boolean;
  priority?: boolean;
}

const CARD_WIDTHS = [420, 640] as const;
const CARD_SIZES = '(min-width: 640px) 273px, 160px';

const getOptimizedUrl = (url: string, width: number) => {
  if (url.includes('upload/')) {
    return url.replace(/upload\/[^/]+\//, `upload/f_auto,q_auto,c_scale,w_${width}/`);
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
  className = '',
  eager = false,
  priority = false,
}) => {
  const [isHoverActive, setIsHoverActive] = React.useState(false);
  const prevHovered = React.useRef(isHovered);

  React.useEffect(() => {
    if (prevHovered.current !== isHovered) {
      setIsHoverActive(true);
      const timer = setTimeout(() => setIsHoverActive(false), 900);
      prevHovered.current = isHovered;
      return () => clearTimeout(timer);
    }
  }, [isHovered]);

  const isRevealed = isActive && !isHovered;
  const currentDuration = isHovered || isHoverActive ? 0.8 : 2.5;

  return (
    <div className={`relative overflow-hidden bg-gray-50/50 aspect-[4/5] ${className}`}>
      {/* After image (background) */}
      <img
        src={getOptimizedUrl(afterImage, CARD_WIDTHS[0])}
        srcSet={getSrcSet(afterImage)}
        sizes={CARD_SIZES}
        className="absolute inset-0 w-full h-full object-cover"
        alt="Ecommerce product photo after professional editing by Reframe Visuals"
        loading={priority || eager || isActive ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : undefined}
        decoding="async"
        draggable={false}
        onContextMenu={(e) => e.preventDefault()}
      />

      {/* Before image (clip-path overlay) */}
      <motion.div
        className="absolute inset-0 z-10"
        initial={{ clipPath: 'inset(0 0% 0 0)' }}
        animate={{ clipPath: isRevealed ? 'inset(0 100% 0 0)' : 'inset(0 0% 0 0)' }}
        transition={{
          duration: currentDuration,
          ease: [0.4, 0, 0.2, 1],
          delay: isHovered || isHoverActive ? 0 : 0.2,
        }}
        style={{ willChange: 'clip-path' }}
      >
        <img
          src={getOptimizedUrl(beforeImage, CARD_WIDTHS[0])}
          srcSet={getSrcSet(beforeImage)}
          sizes={CARD_SIZES}
          className="absolute inset-0 w-full h-full object-cover"
          alt="Ecommerce product photo before editing - Reframe Visuals"
          loading={priority || eager || isActive ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : undefined}
          decoding="async"
          draggable={false}
          onContextMenu={(e) => e.preventDefault()}
        />
      </motion.div>

      {/* Divider line */}
      <motion.div
        className="absolute inset-y-0 z-20 w-[1px] bg-white/40 pointer-events-none"
        initial={{ left: '100%' }}
        animate={{ left: isRevealed ? '0%' : '100%' }}
        transition={{
          duration: currentDuration,
          ease: [0.4, 0, 0.2, 1],
          delay: isHovered || isHoverActive ? 0 : 0.2,
        }}
        style={{ willChange: 'left' }}
      />
    </div>
  );
};

export default React.memo(HeroBeforeAfter);
