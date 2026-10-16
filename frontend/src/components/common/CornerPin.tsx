import React from 'react';

interface CornerPinProps {
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  className?: string;
}

const CornerPin: React.FC<CornerPinProps> = ({ position, className = '' }) => {
  const positionClasses = {
    'top-left': 'top-12 left-12',
    'top-right': 'top-12 right-12',
    'bottom-left': 'bottom-12 left-12',
    'bottom-right': 'bottom-12 right-12',
  };

  return (
    <div className={`absolute ${positionClasses[position]} w-8 h-8 ${className}`}>
      {/* Outer shadow */}
      <div className="absolute inset-0 rounded-full bg-black/20 blur-xl" />
      {/* Ring base */}
      <div className="absolute inset-0.5 rounded-full bg-gradient-to-br from-white via-gray-100 to-gray-200 shadow-[inset_0_1px_3px_rgba(0,0,0,0.15)]" />
      {/* Inner ring */}
      <div className="absolute inset-1.5 rounded-full border border-black/10" />
      {/* Center hole */}
      <div className="absolute inset-3 rounded-full bg-gradient-to-b from-black/40 to-black/60 shadow-inner" />
      {/* Top shine highlight */}
      <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-3 h-1.5 bg-gradient-to-b from-white/80 to-transparent rounded-full blur-[1px]" />
      {/* Side highlight */}
      <div className={`absolute top-2 ${position.includes('right') ? 'right-1.5' : 'left-1.5'} w-1 h-2 bg-white/50 rounded-full blur-[0.5px]`} />
    </div>
  );
};

export default React.memo(CornerPin);
