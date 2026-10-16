import React from 'react';
import { cx } from '../../utils/theme';

interface FrameProps {
  children: React.ReactNode;
  className?: string;
  light?: boolean;
  extended?: boolean;
  stretchAmount?: string;
  showVertical?: boolean;
  size?: 'sm' | 'md' | 'lg';
  noPadding?: boolean;
  hideCrosshairs?: boolean;
}

const Crosshair = ({ className = "", size = 12, style = {} }: { className?: string; size?: number; style?: React.CSSProperties }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 244 244" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={style}
  >
    <path 
      d="M20 122H224M122 20V224" 
      stroke="currentColor" 
      strokeWidth="36" 
      strokeLinecap="round"
    />
  </svg>
);

const Frame: React.FC<FrameProps> = ({ 
  children, 
  className = "", 
  light = false,
  extended = false,
  stretchAmount = "100px",
  showVertical = true,
  size = 'md',
  noPadding = false,
  hideCrosshairs = false
}) => {
  // Thick, black crosses from brand color
  const crossColorClass = light ? "text-white/65" : "text-[#0A0A0B]/30";
  // Very thin, subtle connecting lines
  const lineColorClass = light ? "bg-white/28" : "bg-black/10";

  // Map size to pixel values for the crosshairs
  const crossSize = {
    sm: 10,
    md: 16,
    lg: 24
  }[size];

  // Perfect offset to center the thick crosshair on the corner
  const offset = {
    sm: -5,
    md: -8,
    lg: -12
  }[size];

  return (
    <div className={cx("relative mx-auto", !noPadding && "p-2", className.includes('w-') ? '' : 'w-fit', className)}>
      {/* Container for the frame structure */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={extended ? { left: `-${stretchAmount}`, right: `-${stretchAmount}` } : {}}
      >
        {/* Horizontal Lines */}
        <div className={cx("absolute top-0 left-0 right-0 h-[1px]", lineColorClass)} />
        <div className={cx("absolute bottom-0 left-0 right-0 h-[1px]", lineColorClass)} />

        {/* Vertical Lines */}
        {showVertical && (
          <>
            <div className={cx("absolute top-0 bottom-0 left-0 w-[1px]", lineColorClass)} />
            <div className={cx("absolute top-0 bottom-0 right-0 w-[1px]", lineColorClass)} />
          </>
        )}

        {/* Thick Corner Crosshairs */}
        {!hideCrosshairs && (
          <>
            <Crosshair size={crossSize} className={cx("absolute", crossColorClass)} style={{ top: offset, left: offset }} />
            <Crosshair size={crossSize} className={cx("absolute", crossColorClass)} style={{ top: offset, right: offset }} />
            <Crosshair size={crossSize} className={cx("absolute", crossColorClass)} style={{ bottom: offset, left: offset }} />
            <Crosshair size={crossSize} className={cx("absolute", crossColorClass)} style={{ bottom: offset, right: offset }} />
          </>
        )}
      </div>
      
      {/* Content */}
      <div className="relative z-10 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
};

export default Frame;
