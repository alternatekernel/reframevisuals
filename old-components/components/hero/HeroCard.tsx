import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useTransform, useMotionValueEvent, AnimatePresence, useSpring } from 'framer-motion';
import { Package, Info } from 'lucide-react';
import { cx, tokens } from '../../utils/theme';
import HeroBeforeAfter from './HeroBeforeAfter';

interface HeroCardProps {
  card: any;
  index: number;
  total: number;
  progress: any;
  isDragging: boolean;
  paused?: boolean;
  expansion: any;
  gap: any;
  cardWidth: any;
  /** Card is visible above the fold at initial load — load its images eagerly. */
  eager?: boolean;
  /** Initially-centered card — its images are the LCP candidates (fetchpriority=high). */
  priority?: boolean;
  onAnimationComplete: (index: number) => void;
}

const HeroCard: React.FC<HeroCardProps> = ({
  card,
  index,
  total,
  progress,
  isDragging,
  paused = false,
  expansion,
  gap,
  cardWidth,
  eager = false,
  priority = false,
  onAnimationComplete
}) => {
  const navigate = useNavigate();
  
  const offsetTransformer = useCallback((p: number) => {
    const diff = index - p;
    return ((diff + total / 2) % total + total) % total - total / 2;
  }, [index, total]);

  const offset = useTransform(progress, offsetTransformer);
  
  const [isActive, setIsActive] = useState(() => Math.abs(offset.get()) < 0.02);

  useMotionValueEvent(offset, "change", (latest: number) => {
    // Tighter threshold so the React render happens exactly when the card settles, preventing scroll lag
    const current = Math.abs(latest) < 0.02;
    setIsActive(prev => (prev === current ? prev : current));
  });

  const xTransformer = useCallback(([o, e, g]: any) => o * g * e, []);
  const x = useTransform([offset, expansion, gap], xTransformer);

  // Add physical Y arc so the "coming up" motion is native to the spring, not a layout side-effect
  const yTransformer = useCallback((o: number) => Math.abs(o) * 15, []);
  const y = useTransform(offset, yTransformer);

  const rotateTransformer = useCallback(([o, e]: any) => (isDragging ? 0 : o * 4 * e), [isDragging]);
  const rotate = useTransform([offset, expansion], rotateTransformer);

  const opacity = useTransform(expansion, [0, 0.2, 1], [0, 1, 1]);
  
  const zIndexTransformer = useCallback((o: number) => Math.round(100 - Math.abs(o) * 10), []);
  const zIndex = useTransform(offset, zIndexTransformer);

  const Icon = card.icon;

  const marginLeftTransformer = useCallback((cw: number) => -(cw + 23) / 2, []);
  const marginLeft = useTransform(cardWidth, marginLeftTransformer);

  const [isHovered, setIsHovered] = useState(false);
  const [variantIndex, setVariantIndex] = useState(0);

  // High-performance icon opacity mapped directly to scroll, bypassing React
  const iconOpacity = useTransform(offset, [-0.5, 0, 0.5], [0, 1, 0]);
  const hoverOp = useSpring(isHovered ? 1 : 0, { stiffness: 300, damping: 30 });
  const finalIconOpacity = useTransform([iconOpacity, hoverOp], ([io, ho]: any[]) => Math.max(io, ho));

  // Cycle variants for multi-variant services when active and not hovered
  React.useEffect(() => {
    if (paused) return;
    if (isActive && !isHovered && card.examples && card.examples.length > 1) {
      const interval = setInterval(() => {
        setVariantIndex(prev => (prev + 1) % card.examples!.length);
      }, 6000); // Slow 6s cycle for premium feel
      return () => clearInterval(interval);
    }
  }, [isActive, isHovered, card.examples, paused]);

  // Trigger auto-scroll by notifying parent when the before/after reveal completes
  React.useEffect(() => {
    if (paused) return;
    if (isActive && !isHovered) {
      // 2.7s is the exact duration + delay of the HeroBeforeAfter reveal animation
      const timer = setTimeout(() => {
        onAnimationComplete(index);
      }, 2700);
      return () => clearTimeout(timer);
    }
  }, [isActive, isHovered, index, onAnimationComplete, paused]);

  const currentVariant = card.examples?.[variantIndex] || { 
    before: card.beforeImage, 
    after: card.afterImage 
  };

  return (
    <motion.div
      style={{ 
        x, 
        y,
        rotate, 
        opacity, 
        zIndex, 
        position: 'absolute', 
        left: '50%', 
        marginLeft
      }}
      className="flex flex-col items-center pointer-events-none group will-change-transform transform-gpu"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative pointer-events-auto">
        <div className={cx(
          "relative overflow-hidden p-[4px] transition-[transform,box-shadow,border-color] duration-300 transform group-hover:-translate-y-1",
          tokens.heroCarouselCardSurface,
          "before:pointer-events-none before:absolute before:inset-[1px] before:z-30 before:ring-1 before:ring-inset before:ring-black/[0.025]",
          isActive
            ? "border-black/[0.20] shadow-[0_20px_50px_-34px_rgba(0,0,0,0.48)]"
            : "border-black/[0.14] shadow-[0_18px_44px_-36px_rgba(0,0,0,0.42)]",
          "hover:border-black/[0.24] hover:shadow-[0_2px_2px_rgba(0,0,0,0.05),0_12px_24px_rgba(0,0,0,0.12),0_34px_68px_rgba(0,0,0,0.17)]"
        )}>
          <div className="flex flex-col">
            <motion.div 
              className={cx('relative flex items-center justify-center overflow-hidden', tokens.heroCarouselCardMedia)}
              style={{ width: cardWidth, aspectRatio: '4/5' }}
            >
              <AnimatePresence mode="wait">
                {currentVariant.after ? (
                  <motion.div
                    key={`${card.id}-${variantIndex}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.2 }}
                    className="w-full h-full"
                  >
                    <HeroBeforeAfter
                      beforeImage={currentVariant.before!}
                      afterImage={currentVariant.after!}
                      isActive={isActive}
                      isHovered={isHovered}
                      eager={eager && variantIndex === 0}
                      priority={priority && variantIndex === 0}
                      className="w-full h-full"
                    />
                  </motion.div>
                ) : (
                  <motion.div 
                    key="fallback"
                    className="flex flex-col items-center gap-4 text-black/10 select-none pointer-events-none"
                  >
                    <Icon size={64} strokeWidth={1} />
                    <p className="font-heading text-[10px] uppercase tracking-widest font-normal opacity-40">Blueprint Mode</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
            
            <div className={cx('relative z-20 mt-1 flex items-center justify-between px-3 pb-2 pt-2', tokens.heroCarouselCardFooter)}>
              {/* Actions & Tooltips */}
              <div className="relative group/tooltip">
                <motion.div
                  style={{ opacity: finalIconOpacity }}
                  className="p-2 -m-2 cursor-pointer text-black/40 hover:text-black transition-colors duration-300"
                  onClick={(e: any) => {
                    e.stopPropagation();
                    navigate('/dashboard?view=new-project');
                  }}
                >
                  <Package size={14} />
                </motion.div>
                <div className={cx('absolute bottom-full left-0 z-50 mb-2 whitespace-nowrap rounded-md bg-[var(--color-text-primary)] px-3 py-1.5 text-[12px] font-medium text-white opacity-0 transition-opacity pointer-events-none group-hover/tooltip:opacity-100', tokens.shadowStandard)}>
                  Order Now
                </div>
              </div>

              <div
                className="flex-1 text-center py-2 cursor-pointer"
                onClick={(e: any) => {
                  e.stopPropagation();
                  navigate(`/services/${card.id}`);
                }}
              >
                <p className="font-heading font-normal text-[16px] sm:short:text-[13.5px] tracking-tight text-black/70 group-hover:text-black transition-colors leading-none whitespace-nowrap">
                  {card.name}
                </p>
              </div>

              <div className="relative group/tooltip">
                <motion.div
                  style={{ opacity: finalIconOpacity }}
                  className="p-2 -m-2 cursor-pointer text-black/40 hover:text-black transition-colors duration-300"
                  onClick={(e: any) => {
                    e.stopPropagation();
                    navigate(`/services/${card.id}`);
                  }}
                >
                  <Info size={14} />
                </motion.div>
                <div className={cx('absolute bottom-full right-0 z-50 mb-2 w-64 rounded-xl border border-white/10 bg-[var(--color-text-primary)] px-4 py-3 text-[13px] font-normal text-white opacity-0 transition-opacity pointer-events-none group-hover/tooltip:opacity-100', tokens.shadowStandard)}>
                  <p className="leading-relaxed">{card.description || "Professional service details."}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default React.memo(HeroCard);
