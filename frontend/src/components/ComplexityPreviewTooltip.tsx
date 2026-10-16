import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';

interface ComplexityInfo {
  label: string;
  description: string;
  image: string;
}

const COMPLEXITY_MAP: Record<string, ComplexityInfo> = {
  S: {
    label: 'Small',
    description: 'Simple product, clean edges, single object on plain background',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=400&auto=format&fit=crop',
  },
  M: {
    label: 'Medium',
    description: 'Multiple objects or moderately complex edges and contours',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=400&auto=format&fit=crop',
  },
  A: {
    label: 'Advanced',
    description: 'Complex edges, multiple components, intricate product details',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=400&auto=format&fit=crop',
  },
  C: {
    label: 'Complex',
    description: 'Fine details, multiple parts, metallic reflections, intricate edges',
    image: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?q=80&w=400&auto=format&fit=crop',
  },
  SC: {
    label: 'Super Complex',
    description: 'Hair, fur, transparency, fabric flow, maximum detail extraction',
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=400&auto=format&fit=crop',
  },
  Single: {
    label: 'Single Color',
    description: 'One color zone to change on a simple object',
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=400&auto=format&fit=crop',
  },
  Multiple: {
    label: 'Multiple Colors',
    description: 'Several color zones or components to recolor simultaneously',
    image: 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?q=80&w=400&auto=format&fit=crop',
  },
  Multicolor: {
    label: 'Multicolor Pattern',
    description: 'Pattern, textile, or print swap on fabric or surface',
    image: 'https://images.unsplash.com/photo-1558171813-4c088753af8f?q=80&w=400&auto=format&fit=crop',
  },
  Basic: {
    label: 'Basic',
    description: 'Quick cleanup · blemish removal, skin smoothing, minor corrections',
    image: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=400&auto=format&fit=crop',
  },
  Advanced: {
    label: 'Advanced',
    description: 'Detailed skin retouching, lighting refinement, body contouring',
    image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=400&auto=format&fit=crop',
  },
  'High-end/Editorial': {
    label: 'High-end Editorial',
    description: 'Publication-grade retouching for magazines, campaigns, and luxury brands',
    image: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=400&auto=format&fit=crop',
  },
};

interface ComplexityPreviewTooltipProps {
  complexity: string;
  isVisible: boolean;
  position: { x: number; y: number } | null;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

const ComplexityPreviewTooltip: React.FC<ComplexityPreviewTooltipProps> = ({
  complexity,
  isVisible,
  position,
  onMouseEnter,
  onMouseLeave,
}) => {
  const info = COMPLEXITY_MAP[complexity];
  if (!info || !position) return null;

  const cardWidth = 240;
  const clampedLeft = Math.max(
    16,
    Math.min(position.x - cardWidth / 2, window.innerWidth - cardWidth - 16)
  );

  return createPortal(
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 6, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 6, scale: 0.96 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          style={{
            position: 'fixed',
            top: position.y + 8,
            left: clampedLeft,
            width: cardWidth,
            zIndex: 9999,
          }}
        >
          <div className="bg-white rounded-xl border border-black/[0.06] shadow-[0_20px_60px_-12px_rgba(0,0,0,0.15)] overflow-hidden">
            {/* Example image */}
            <div className="relative h-[160px] overflow-hidden bg-gray-100">
              <img
                src={info.image}
                alt={`${complexity} complexity - preview example image - Reframe Visuals`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              <div className="absolute bottom-3 left-3">
                <span className="text-caption font-black text-white/90 px-2 py-0.5 rounded bg-black/30 backdrop-blur-sm tracking-wider">
                  {complexity}
                </span>
              </div>
            </div>

            {/* Info */}
            <div className="p-3 space-y-1">
              <h4 className="text-body-sm font-heading font-black text-black leading-tight">
                {info.label}
              </h4>
              <p className="text-caption text-black/50 leading-relaxed">
                {info.description}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default ComplexityPreviewTooltip;
