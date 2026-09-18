import React, { useRef, useState, useEffect, useCallback } from 'react';
import { flushSync } from 'react-dom';
import { motion } from 'framer-motion';

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1680&h=2100&auto=format&fit=crop';

const getCloudinarySrcSet = (url: string): string | undefined => {
  if (!url || !url.includes('cloudinary.com')) return undefined;
  // Replace w_800 or any w_xxx with the desired width for responsive srcSet
  const base = url.replace(/w_\d+/, 'w_WIDTH');
  return [
    base.replace('w_WIDTH', 'w_300') + ' 300w',
    base.replace('w_WIDTH', 'w_600') + ' 600w',
    base.replace('w_WIDTH', 'w_800') + ' 800w',
  ].join(', ');
};

interface BeforeAfterCardProps {
  beforeImage?: string;
  afterImage?: string;
  caption?: string;
  className?: string;
  aspectRatio?: string;
  isActive?: boolean;
  disableEntryAnimation?: boolean;
  onAnimationComplete?: () => void;
  hideLabels?: boolean;
  hideHandle?: boolean;
  hideInteractionUI?: boolean;
  disableHoverInteraction?: boolean;
  sweepDuration?: number;
  returnDuration?: number;
  sequence?: { image: string; label: string }[];
  onSequenceChange?: (index: number) => void;
}

const BeforeAfterCard: React.FC<BeforeAfterCardProps> = ({
  beforeImage = DEFAULT_IMAGE,
  afterImage = DEFAULT_IMAGE,
  caption,
  className = '',
  aspectRatio = 'aspect-square',
  isActive = false,
  disableEntryAnimation = false,
  onAnimationComplete,
  hideLabels = false,
  hideHandle = false,
  hideInteractionUI = false,
  disableHoverInteraction = false,
  sweepDuration = 3000,
  returnDuration = 2000,
  sequence,
  onSequenceChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const beforeLayerRef = useRef<HTMLDivElement>(null);
  const dividerRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);

  const [isHovering, setIsHovering] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [animLabel, setAnimLabel] = useState<string>('AFTER');
  const [isAnimationComplete, setIsAnimationComplete] = useState(false);
  const [seqIndex, setSeqIndex] = useState(0);
  const rafRef = useRef<number>(0);
  const isHoveringRef = useRef(false);
  const isDraggingRef = useRef(false);
  const hasAnimatedRef = useRef(false);
  const animStartTimeRef = useRef(0);
  const seqIndexRef = useRef(0);
  const onSequenceChangeRef = useRef(onSequenceChange);

  useEffect(() => {
    onSequenceChangeRef.current = onSequenceChange;
  }, [onSequenceChange]);

  // Sync seqIndex state with ref for RAF
  useEffect(() => {
    seqIndexRef.current = seqIndex;
  }, [seqIndex]);

  const clamp = (val: number, min: number, max: number) => Math.min(Math.max(val, min), max);

  const updateSplit = useCallback((pos: number) => {
    if (beforeLayerRef.current) {
      beforeLayerRef.current.style.clipPath = `inset(0 ${100 - pos}% 0 0)`;
    }
    if (dividerRef.current) {
      dividerRef.current.style.left = `${pos}%`;
    }
    if (handleRef.current) {
      handleRef.current.style.left = `${pos}%`;
    }
  }, []);

  const getSplitFromEvent = useCallback((clientX: number) => {
    if (!containerRef.current) return 50;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    return (x / rect.width) * 100;
  }, []);

  const moveRafRef = useRef<number>(0);
  const handlePointerMove = useCallback((clientX: number) => {
    if (moveRafRef.current) cancelAnimationFrame(moveRafRef.current);
    
    moveRafRef.current = requestAnimationFrame(() => {
      const pos = clamp(getSplitFromEvent(clientX), 2, 98);
      updateSplit(pos);
      setAnimLabel(pos > 50 ? 'BEFORE' : 'AFTER');
    });
  }, [getSplitFromEvent, updateSplit]);

  useEffect(() => {
    isHoveringRef.current = isHovering;
    isDraggingRef.current = isDragging;
  }, [isHovering, isDragging]);

  useEffect(() => {
    if (!isActive) {
      hasAnimatedRef.current = false;
      setIsAnimationComplete(false);
      setAnimLabel('AFTER');
    }
  }, [isActive]);

  useEffect(() => {
    // When images or sequence change, allow the animation to play again
    if (isActive) {
      hasAnimatedRef.current = false;
      setIsAnimationComplete(false);
      setSeqIndex(0);
    }
  }, [beforeImage, afterImage, isActive, sequence]);

  useEffect(() => {
    if (!isDragging) return;

    const onPointerMove = (e: PointerEvent) => {
      e.preventDefault();
      handlePointerMove(e.clientX);
    };
    const onPointerUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    return () => {
      if (moveRafRef.current) cancelAnimationFrame(moveRafRef.current);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [isDragging, handlePointerMove]);

  useEffect(() => {
    if (!isActive) return;
    if (hasAnimatedRef.current) return;

    hasAnimatedRef.current = true;
    animStartTimeRef.current = performance.now();

    updateSplit(100);
    setAnimLabel('AFTER');

    const delay = 0;
    const totalDuration = delay + sweepDuration + returnDuration;

    const animate = () => {
      if (isHoveringRef.current || isDraggingRef.current) {
        rafRef.current = requestAnimationFrame(animate);
        return;
      }

      const elapsed = performance.now() - animStartTimeRef.current;

      if (elapsed >= totalDuration) {
        updateSplit(50);
        setAnimLabel('AFTER');
        setIsAnimationComplete(true);
        if (onAnimationComplete) onAnimationComplete();
        return;
      }

      if (elapsed < delay) {
        rafRef.current = requestAnimationFrame(animate);
        return;
      }

      const animElapsed = elapsed - delay;
      let pos: number;

      if (sequence && sequence.length > 1) {
        // Continuous Sequence Mode
        const isFinalReturn = seqIndexRef.current === sequence.length - 1;

        if (!isFinalReturn) {
          // Full sweep mode (100 -> 0)
          if (animElapsed >= sweepDuration) {
             let nextIndex = 0;
             flushSync(() => {
               nextIndex = seqIndexRef.current + 1;
               setSeqIndex(nextIndex);
             });
             if (onSequenceChangeRef.current) onSequenceChangeRef.current(nextIndex);
             
             animStartTimeRef.current = performance.now() + delay;
             
             if (nextIndex === sequence.length - 1) {
               updateSplit(0);
               setAnimLabel(sequence[sequence.length - 1].label);
             } else {
               updateSplit(100);
               setAnimLabel(sequence[nextIndex].label);
             }
             rafRef.current = requestAnimationFrame(animate);
             return;
          }

          const progress = animElapsed / sweepDuration;
          const eased = progress < 0.5
            ? 4 * progress * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 3) / 2;
          pos = 100 - (eased * 100);
          updateSplit(pos);

          const currentLabel = pos > 50 
             ? sequence[seqIndexRef.current].label 
             : sequence[seqIndexRef.current + 1].label;
          setAnimLabel(currentLabel);
          
        } else {
          // Final Return mode (0 -> 50)
          if (animElapsed >= returnDuration) {
            updateSplit(50);
            setAnimLabel(sequence[sequence.length - 1].label);
            setIsAnimationComplete(true);
            if (onAnimationComplete) onAnimationComplete();
            return;
          }

          const progress = animElapsed / returnDuration;
          const eased = progress * progress * (3 - 2 * progress);
          pos = eased * 50;
          
          updateSplit(pos);
          setAnimLabel(pos > 50 ? sequence[0].label : sequence[sequence.length - 1].label);
        }
      } else {
        // Normal Mode
        if (animElapsed < sweepDuration) {
          const progress = animElapsed / sweepDuration;
          const eased = progress < 0.5
            ? 4 * progress * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 3) / 2;
          pos = 100 - (eased * 100);
        } else {
          const progress = (animElapsed - sweepDuration) / returnDuration;
          const eased = progress * progress * (3 - 2 * progress);
          pos = eased * 50;
        }

        updateSplit(pos);
        setAnimLabel(pos > 50 ? 'BEFORE' : 'AFTER');
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [isActive, updateSplit, beforeImage, afterImage, sequence]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (disableHoverInteraction) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    handlePointerMove(e.clientX);
  };

  const isFinalReturn = sequence && seqIndex === sequence.length - 1;
  const currentOverlayImage = sequence 
    ? (isFinalReturn ? sequence[0].image : sequence[seqIndex].image) 
    : beforeImage;
  const currentBgImage = sequence 
    ? (isFinalReturn ? sequence[sequence.length - 1].image : sequence[(seqIndex + 1) % sequence.length].image) 
    : afterImage;

  const content = (
    <div
      ref={containerRef}
      className={`bg-white ${aspectRatio} border border-black/5 relative overflow-hidden select-none ${isHovering || isDragging ? 'cursor-col-resize' : ''}`}
      style={{ touchAction: 'pan-y' }}
      onPointerDown={handlePointerDown}
      onPointerEnter={() => !disableHoverInteraction && setIsHovering(true)}
      onPointerLeave={() => !disableHoverInteraction && setIsHovering(false)}
      itemScope
      itemType="https://schema.org/VisualArtwork"
    >
      <meta itemProp="name" content={caption || 'Before and After Image Edit'} />
      <meta itemProp="artMedium" content="Digital Photography" />
      <meta itemProp="image" content={currentBgImage || undefined} />
      {/* After image (full, always visible, acts as background) */}
      <div className="absolute inset-0">
        <img
          src={currentBgImage || undefined}
          srcSet={getCloudinarySrcSet(currentBgImage || '')}
          sizes="(max-width: 768px) 300px, (max-width: 1200px) 600px, 800px"
          className="w-full h-full object-cover"
          alt={caption ? `After professional product photo editing - ${caption} | Reframe Visuals` : 'After professional ecommerce product photo editing | Reframe Visuals'}
          loading="lazy"
          decoding="async"
          draggable={false}
          onContextMenu={(e) => e.preventDefault()}
        />
      </div>

      {/* Before image (left side, clipped, acts as overlay) */}
      <div
        ref={beforeLayerRef}
        className="absolute inset-0 transition-opacity duration-500"
        style={{ 
          clipPath: 'inset(0 50% 0 0)', 
          willChange: 'clip-path',
          opacity: (isActive || isAnimationComplete || (!hideInteractionUI && (isHovering || isDragging))) ? 1 : 0
        }}
      >
        <img
          src={currentOverlayImage || undefined}
          srcSet={getCloudinarySrcSet(currentOverlayImage || '')}
          sizes="(max-width: 768px) 300px, (max-width: 1200px) 600px, 800px"
          className="w-full h-full object-cover"
          alt={caption ? `Before product photo editing - ${caption} | Reframe Visuals` : 'Before ecommerce product photo editing | Reframe Visuals'}
          loading="lazy"
          decoding="async"
          draggable={false}
          onContextMenu={(e) => e.preventDefault()}
        />
      </div>

      {/* Divider line */}
      <div
        ref={dividerRef}
        className="absolute inset-y-0 z-20 pointer-events-none transition-opacity duration-500"
        style={{ 
          left: '50%', 
          transform: 'translateX(-50%)', 
          willChange: 'left',
          opacity: (isActive || isAnimationComplete || (!hideInteractionUI && (isHovering || isDragging))) ? 1 : 0
        }}
      >
        <div className="w-[1px] h-full bg-white/90" />
      </div>

      {/* Drag handle */}
      {!hideHandle && (
        <div
          ref={handleRef}
          className="absolute z-30 pointer-events-none"
          style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)', willChange: 'left' }}
        >
          <motion.div
            className="flex flex-col items-center gap-1.5"
            animate={{
              opacity: isHovering || isDragging || isAnimationComplete ? 1 : 0,
              scale: isHovering || isDragging || isAnimationComplete ? 1 : 0.9,
            }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
          >
            <div className="w-7 h-7 rounded-full bg-brand flex items-center justify-center shadow-lg shadow-brand/30">
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7 4L3 10L7 16" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M13 4L17 10L13 16" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <div className="w-[1px] h-2 bg-brand/40" />
              <div className="w-[1px] h-2 bg-brand/40" />
            </div>
          </motion.div>
        </div>
      )}

      {/* State label */}
      {!hideLabels && (
        <div className={`absolute bottom-5 right-5 z-10 transition-opacity duration-500 ${(isActive || isAnimationComplete || (!hideInteractionUI && (isHovering || isDragging))) ? 'opacity-100' : 'opacity-0'}`}>
            <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-white border border-black/10 shadow-sm">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-500 ${animLabel === 'BEFORE' ? 'bg-brand' : 'bg-black'}`}>
                <svg width="21" height="21" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {animLabel === 'BEFORE' ? (
                    <path d="M9 8L15 12L9 16V8Z" fill="white"/>
                  ) : (
                    <path d="M7 12L10 15L17 8" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  )}
                </svg>
              </div>
              <span className="text-[10px] font-bold tracking-[0.2em] text-black w-14 text-center">{animLabel}</span>
            </div>
        </div>
      )}

      {/* Caption pill */}
      {caption && (
        <div className="absolute bottom-6 left-6 right-6 z-10">
          <div className="px-4 py-2 lg:px-5 lg:py-2.5 rounded-full bg-white border border-black/5 shadow-md">
            <p className="text-[12px] font-black text-black tracking-[0.2em]">{caption}</p>
          </div>
        </div>
      )}
    </div>
  );

  if (disableEntryAnimation) return <div className={`relative ${className}`}>{content}</div>;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className={`relative ${className}`}
    >
      {content}
    </motion.div>
  );
};

export default BeforeAfterCard;
