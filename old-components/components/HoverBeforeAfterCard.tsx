import React, { useRef, useState, useEffect, useCallback } from 'react';


const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1680&h=2100&auto=format&fit=crop';

interface HoverBeforeAfterCardProps {
  beforeImage?: string;
  afterImage?: string;
  className?: string;

}

const HoverBeforeAfterCard: React.FC<HoverBeforeAfterCardProps> = ({
  beforeImage = DEFAULT_IMAGE,
  afterImage = DEFAULT_IMAGE,
  className = '',

}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const beforeLayerRef = useRef<HTMLDivElement>(null);
  const dividerRef = useRef<HTMLDivElement>(null);




  const [isDragging, setIsDragging] = useState(false);
  const isDraggingRef = useRef(false);
  const animationCancelledRef = useRef(false);

  useEffect(() => {
    isDraggingRef.current = isDragging;
    if (isDragging) {
      animationCancelledRef.current = true;
    }
  }, [isDragging]);

  const updateSplit = useCallback((pos: number) => {
    if (beforeLayerRef.current) {
      beforeLayerRef.current.style.clipPath = `inset(0 ${100 - pos}% 0 0)`;
    }
    if (dividerRef.current) {
      dividerRef.current.style.left = `${pos}%`;
    }
  }, []);

  const getSplitFromEvent = useCallback((clientX: number) => {
    if (!containerRef.current) return 50;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    return (x / rect.width) * 100;
  }, []);

  const clamp = (val: number, min: number, max: number) => Math.min(Math.max(val, min), max);

  const handlePointerMove = useCallback((clientX: number) => {
    const pos = clamp(getSplitFromEvent(clientX), 2, 98);
    updateSplit(pos);
  }, [getSplitFromEvent, updateSplit]);

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
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [isDragging, handlePointerMove]);

  useEffect(() => {
    let startTime: number | null = null;
    let animationFrameId: number;
    let isCancelled = false;

    // Start from 100% (Before image fully visible)
    updateSplit(100);

    const sweepDuration = 2500;
    const returnDuration = 2000;
    const totalDuration = sweepDuration + returnDuration;

    const animate = (time: number) => {
      if (isCancelled || animationCancelledRef.current) return;
      if (startTime === null) startTime = time;
      
      const elapsed = time - startTime;

      if (elapsed >= totalDuration) {
        updateSplit(50);
        return;
      }

      let pos: number;

      if (elapsed < sweepDuration) {
        // Sweep out to 0%
        const progress = elapsed / sweepDuration;
        const eased = progress < 0.5
          ? 4 * progress * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;
        pos = 100 - (eased * 100);
      } else {
        // Return to 50%
        const progress = (elapsed - sweepDuration) / returnDuration;
        const eased = progress * progress * (3 - 2 * progress);
        pos = eased * 50;
      }

      updateSplit(pos);
      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      isCancelled = true;
      cancelAnimationFrame(animationFrameId);
    };
  }, [updateSplit]);

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    setIsDragging(true);
    handlePointerMove(e.clientX);
  };

  return (
    <div
      ref={containerRef}
      className={`bg-white aspect-[4/5] border border-black/5 relative overflow-hidden select-none ${isDragging ? 'cursor-col-resize' : 'cursor-pointer'} ${className}`}
      onPointerDown={handlePointerDown}
      itemScope
      itemType="https://schema.org/VisualArtwork"
    >
      <meta itemProp="name" content="Before and After Image Edit" />
      <meta itemProp="artMedium" content="Digital Photography" />
      <meta itemProp="image" content={afterImage} />
      {/* After image (full, always visible) */}
      <div className="absolute inset-0 pointer-events-none">
        <img
          src={afterImage}
          srcSet={`${afterImage} 600w, ${afterImage} 1000w`}
          sizes="(max-width: 768px) 600px, 1000px"
          className="w-full h-full object-cover"
          alt="Product photo after professional editing - Reframe Visuals"
          loading="lazy"
          decoding="async"
          draggable={false}
        />
      </div>

      {/* Before image (left side, clipped) */}
      <div
        ref={beforeLayerRef}
        className="absolute inset-0 pointer-events-none"
        style={{ 
          clipPath: 'inset(0 50% 0 0)', 
          willChange: 'clip-path'
        }}
      >
        <img
          src={beforeImage}
          srcSet={`${beforeImage} 600w, ${beforeImage} 1000w`}
          sizes="(max-width: 768px) 600px, 1000px"
          className="w-full h-full object-cover"
          alt="Product photo before editing - unretouched original - Reframe Visuals"
          loading="lazy"
          decoding="async"
          draggable={false}
        />
      </div>

      {/* Divider line & Handle */}
      <div
        ref={dividerRef}
        className="absolute inset-y-0 z-20 pointer-events-none flex flex-col items-center justify-center"
        style={{ 
          left: '50%', 
          transform: 'translateX(-50%)', 
          willChange: 'left'
        }}
      >
        <div className="absolute inset-y-0 w-[1px] bg-white/90" />
        
        {/* Handle */}
        <div className="relative z-30 flex flex-col items-center gap-1.5 shadow-sm">
          <div className={`w-7 h-7 rounded-full bg-brand flex items-center justify-center shadow-lg shadow-brand/30 transition-transform duration-200 ${isDragging ? 'scale-110' : 'scale-100'}`}>
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M7 4L3 10L7 16" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M13 4L17 10L13 16" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <div className="w-[1px] h-2 bg-brand/40" />
            <div className="w-[1px] h-2 bg-brand/40" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default HoverBeforeAfterCard;
