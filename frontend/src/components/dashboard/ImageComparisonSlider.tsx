import { useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ScanSearch, SplitSquareHorizontal } from 'lucide-react';

interface ImageComparisonSliderProps {
  beforeUrl?: string;
  afterUrl?: string;
  label?: string;
}

const fallbackBefore = 'linear-gradient(135deg, #f4f4f5 0%, #e4e4e7 100%)';
const fallbackAfter = 'linear-gradient(135deg, #171717 0%, #52525b 100%)';

const ImageComparisonSlider = ({ beforeUrl, afterUrl, label = 'Asset preview' }: ImageComparisonSliderProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(50);
  const [loupe, setLoupe] = useState({ active: false, x: 50, y: 50 });

  const hasImages = Boolean(beforeUrl || afterUrl);
  const beforeStyle = useMemo(() => beforeUrl
    ? { backgroundImage: `url(${beforeUrl})` }
    : { background: fallbackBefore }, [beforeUrl]);
  const afterStyle = useMemo(() => afterUrl
    ? { backgroundImage: `url(${afterUrl})` }
    : { background: fallbackAfter }, [afterUrl]);

  const updatePointer = (clientX: number, clientY?: number) => {
    const bounds = containerRef.current?.getBoundingClientRect();
    if (!bounds) return;
    const x = Math.min(100, Math.max(0, ((clientX - bounds.left) / bounds.width) * 100));
    setPosition(x);

    if (clientY !== undefined) {
      const y = Math.min(100, Math.max(0, ((clientY - bounds.top) / bounds.height) * 100));
      setLoupe(current => ({ ...current, x, y }));
    }
  };

  return (
    <div className="space-y-3">
      <div
        ref={containerRef}
        className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-black/10 bg-[#f5f5f5] select-none"
        onPointerMove={(event) => updatePointer(event.clientX, event.clientY)}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          updatePointer(event.clientX, event.clientY);
        }}
        onMouseEnter={() => setLoupe(current => ({ ...current, active: true }))}
        onMouseLeave={() => setLoupe(current => ({ ...current, active: false }))}
        role="img"
        aria-label={`${label} before and after comparison`}
      >
        <div className="absolute inset-0 bg-cover bg-center" style={beforeStyle} />
        {!beforeUrl && (
          <div className="absolute inset-0 flex items-center justify-center text-[12px] font-bold uppercase tracking-[0.24em] text-black/25">
            Before
          </div>
        )}

        <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}>
          <div className="absolute inset-0 bg-cover bg-center" style={afterStyle} />
          {!afterUrl && (
            <div className="absolute inset-0 flex items-center justify-center text-[12px] font-bold uppercase tracking-[0.24em] text-white/60">
              After
            </div>
          )}
        </div>

        <motion.div
          className="absolute top-0 bottom-0 w-[2px] bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.18)]"
          animate={{ left: `${position}%` }}
          transition={{ type: 'spring', stiffness: 260, damping: 32 }}
        >
          <div className="absolute left-1/2 top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[#171717] shadow-xl ring-1 ring-black/10">
            <SplitSquareHorizontal size={18} />
          </div>
        </motion.div>

        {loupe.active && (
          <div
            className="pointer-events-none absolute hidden h-28 w-28 rounded-full border-2 border-white shadow-2xl ring-1 ring-black/15 md:block"
            style={{
              left: `calc(${loupe.x}% - 56px)`,
              top: `calc(${loupe.y}% - 56px)`,
              backgroundImage: afterUrl ? `url(${afterUrl})` : undefined,
              backgroundColor: afterUrl ? undefined : '#27272a',
              backgroundSize: afterUrl ? '220%' : undefined,
              backgroundPosition: `${loupe.x}% ${loupe.y}%`,
            }}
          />
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-[12px] text-[#666666]">
        <span className="font-medium text-[#171717]">A/B inspection slider</span>
        <span className="flex items-center gap-1.5">
          <ScanSearch size={14} />
          {hasImages ? 'Hover to inspect fine detail' : 'Preview placeholders until assets are delivered'}
        </span>
      </div>
    </div>
  );
};

export default ImageComparisonSlider;
