import React from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';

import HoverBeforeAfterCard from './HoverBeforeAfterCard';
import { getStartingPrice } from '../utils/pricing';
import { Service } from '../data/services';



interface ServiceHoverCardProps {
  service: Service | null;
  position: { x: number; y: number } | null;
  isVisible: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

const ServiceHoverCard: React.FC<ServiceHoverCardProps> = ({
  service,
  position,
  isVisible,
  onMouseEnter,
  onMouseLeave,
}) => {
  if (!service || !position) return null;

  const Icon = service.icon;
  const cardWidth = 280;
  const startingPrice = getStartingPrice(service.id) || service.price;

  // Clamp horizontally so card doesn't overflow viewport
  const clampedLeft = Math.max(
    16,
    Math.min(position.x - cardWidth / 2, window.innerWidth - cardWidth - 16)
  );

  return createPortal(
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.95 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
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
          <Link to={`/services/${service.id}`} className="block">
            <div className="bg-white rounded-[24px] border-[0.5px] border-black/10 p-1 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.2)] overflow-hidden">
              {/* Image area - Explicit 4:5 Aspect Ratio */}
              <div className="relative aspect-[4/5] overflow-hidden rounded-[20px] bg-gray-50/50 flex items-center justify-center">
                {service.afterImage ? (
                  <HoverBeforeAfterCard 
                    key={service.id}
                    beforeImage={service.beforeImage} 
                    afterImage={service.afterImage} 
                    className="w-full h-full"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-4 text-brand/20 select-none">
                    {Icon && <Icon size={48} strokeWidth={1} />}
                    <p className="font-heading text-[10px] uppercase tracking-widest font-black opacity-40">Blueprint Mode</p>
                  </div>
                )}
              </div>

              {/* Info area */}
              <div className="p-4 text-center space-y-2">
                <h3 className="font-heading font-normal text-[16px] tracking-tight text-black leading-none">
                  {service.name}
                </h3>

                <div className="flex items-center justify-center gap-3">
                  <span className="text-[11px] font-medium text-black/40 tracking-wide">
                    Starting at ${startingPrice.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </Link>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default ServiceHoverCard;
