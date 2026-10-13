import React, { useState, useCallback } from 'react';
import { motion, useTransform, useMotionValueEvent, AnimatePresence, useSpring } from 'framer-motion';
import { Package, Info } from 'lucide-react';
import HeroBeforeAfter from './HeroBeforeAfter';
import type { HeroService } from '../../data/heroServices';

interface HeroCardProps {
  card: HeroService;
  index: number;
  total: number;
  progress: any;
  isDragging: boolean;
  paused?: boolean;
  expansion: any;
  gap: any;
  cardWidth: any;
  eager?: boolean;
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
  onAnimationComplete,
}) => {
  const offsetTransformer = useCallback(
    (p: number) => {
      const diff = index - p;
      return ((diff + total / 2) % total + total) % total - total / 2;
    },
    [index, total]
  );

  const offset = useTransform(progress, offsetTransformer);
  const [isActive, setIsActive] = useState(() => Math.abs(offset.get()) < 0.02);

  useMotionValueEvent(offset, 'change', (latest: number) => {
    const current = Math.abs(latest) < 0.02;
    setIsActive((prev) => (prev === current ? prev : current));
  });

  const x = useTransform([offset, expansion, gap] as any, ([o, e, g]: any) => o * g * e);
  const y = useTransform(offset, (o: number) => Math.abs(o) * 15);
  const rotate = useTransform(
    [offset, expansion] as any,
    ([o, e]: any) => (isDragging ? 0 : o * 4 * e)
  );
  const opacity = useTransform(expansion, [0, 0.2, 1], [0, 1, 1]);
  const zIndex = useTransform(offset, (o: number) => Math.round(100 - Math.abs(o) * 10));
  const marginLeft = useTransform(cardWidth, (cw: number) => -(cw + 23) / 2);

  const [isHovered, setIsHovered] = useState(false);
  const iconOpacity = useTransform(offset, [-0.5, 0, 0.5], [0, 1, 0]);
  const hoverOp = useSpring(isHovered ? 1 : 0, { stiffness: 300, damping: 30 });
  const finalIconOpacity = useTransform([iconOpacity, hoverOp] as any, ([io, ho]: any[]) =>
    Math.max(io, ho)
  );

  React.useEffect(() => {
    if (paused) return;
    if (isActive && !isHovered) {
      const timer = setTimeout(() => {
        onAnimationComplete(index);
      }, 2700);
      return () => clearTimeout(timer);
    }
  }, [isActive, isHovered, index, onAnimationComplete, paused]);

  return (
    <motion.div
      style={{ x, y, rotate, opacity, zIndex, position: 'absolute', left: '50%', marginLeft }}
      className="flex flex-col items-center pointer-events-none group will-change-transform transform-gpu"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative pointer-events-auto">
        <div
          className={[
            'relative overflow-hidden p-[4px] transition-[transform,box-shadow,border-color] duration-300 transform group-hover:-translate-y-1',
            'rounded-[20px] border bg-[#FDFDFC]',
            'before:pointer-events-none before:absolute before:inset-[1px] before:z-30 before:ring-1 before:ring-inset before:ring-black/[0.025]',
            isActive
              ? 'border-black/[0.20] shadow-[0_20px_50px_-34px_rgba(0,0,0,0.48)]'
              : 'border-black/[0.14] shadow-[0_18px_44px_-36px_rgba(0,0,0,0.42)]',
            'hover:border-black/[0.24] hover:shadow-[0_2px_2px_rgba(0,0,0,0.05),0_12px_24px_rgba(0,0,0,0.12),0_34px_68px_rgba(0,0,0,0.17)]',
          ].join(' ')}
        >
          <div className="flex flex-col">
            {/* Media area */}
            <motion.div
              className="relative flex items-center justify-center overflow-hidden rounded-[16px]"
              style={{ width: cardWidth, aspectRatio: '4/5' } as any}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.2 }}
                  className="w-full h-full"
                >
                  <HeroBeforeAfter
                    beforeImage={card.beforeImage}
                    afterImage={card.afterImage}
                    isActive={isActive}
                    isHovered={isHovered}
                    eager={eager}
                    priority={priority}
                    className="w-full h-full"
                  />
                </motion.div>
              </AnimatePresence>
            </motion.div>

            {/* Footer */}
            <div className="relative z-20 mt-1 flex items-center justify-between px-3 pb-2 pt-2 bg-[#FDFDFC]">
              {/* Package icon */}
              <div className="relative group/tooltip">
                <motion.div
                  style={{ opacity: finalIconOpacity }}
                  className="p-2 -m-2 cursor-pointer text-black/40 hover:text-black transition-colors duration-300"
                >
                  <Package size={14} />
                </motion.div>
                <div className="absolute bottom-full left-0 z-50 mb-2 whitespace-nowrap rounded-md bg-black px-3 py-1.5 text-[12px] font-medium text-white opacity-0 transition-opacity pointer-events-none group-hover/tooltip:opacity-100 shadow-lg">
                  Order Now
                </div>
              </div>

              {/* Service name */}
              <div className="flex-1 text-center py-2">
                <a
                  href={`/services/${card.id}`}
                  className="font-heading font-normal text-[16px] tracking-tight text-black/70 group-hover:text-black transition-colors leading-none whitespace-nowrap cursor-pointer"
                  style={{ fontSize: 'clamp(13.5px, 1.4vw, 16px)' }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {card.name}
                </a>
              </div>

              {/* Info icon */}
              <div className="relative group/tooltip">
                <motion.div
                  style={{ opacity: finalIconOpacity }}
                  className="p-2 -m-2 cursor-pointer text-black/40 hover:text-black transition-colors duration-300"
                >
                  <Info size={14} />
                </motion.div>
                <div className="absolute bottom-full right-0 z-50 mb-2 w-64 rounded-xl border border-white/10 bg-black px-4 py-3 text-[13px] font-normal text-white opacity-0 transition-opacity pointer-events-none group-hover/tooltip:opacity-100 shadow-lg">
                  <p className="leading-relaxed">{card.description}</p>
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
