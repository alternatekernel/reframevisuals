import { motion } from 'framer-motion';

type DotBackgroundVariant = 'linear' | 'ellipse' | 'ellipse-light' | 'multi-layer';

interface DotBackgroundProps {
  variant?: DotBackgroundVariant;
  className?: string;
}

const DOT_STYLES: Record<DotBackgroundVariant, React.CSSProperties> = {
  linear: {
    backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.45) 1px, transparent 1px)',
    backgroundSize: '16px 16px',
    maskImage: 'linear-gradient(to bottom, transparent 0%, transparent 60%, black 100%)',
    WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, transparent 60%, black 100%)',
  },
  ellipse: {
    backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.45) 1px, transparent 1px)',
    backgroundSize: '16px 16px',
    maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 80%)',
    WebkitMaskImage: 'radial-gradient(ellipse at center, black 40%, transparent 80%)',
  },
  'ellipse-light': {
    backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.45) 1px, transparent 1px)',
    backgroundSize: '16px 16px',
    maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 75%)',
    WebkitMaskImage: 'radial-gradient(ellipse at center, black 40%, transparent 75%)',
  },
  'multi-layer': {
    backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.45) 1px, transparent 1px)',
    backgroundSize: '16px 16px',
    maskImage: 'radial-gradient(ellipse at center, black 0%, transparent 70%)',
    WebkitMaskImage: 'radial-gradient(ellipse at center, black 0%, transparent 70%)',
  },
};

export function DotBackground({ variant = 'ellipse', className = '' }: DotBackgroundProps) {
  const isMultiLayer = variant === 'multi-layer';

  if (isMultiLayer) {
    return (
      <div className={`absolute inset-0 overflow-hidden pointer-events-none z-0 ${className}`}>
        <motion.div
          style={{
            ...DOT_STYLES['multi-layer'],
            backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.15) 1px, transparent 1px)',
            backgroundSize: '12px 12px',
          }}
          className="absolute inset-0 opacity-100"
        />
        <motion.div
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.08) 1.5px, transparent 1.5px)',
            backgroundSize: '24px 24px',
            rotate: -2,
            maskImage: 'radial-gradient(circle at center, black 0%, transparent 75%)',
            WebkitMaskImage: 'radial-gradient(circle at center, black 0%, transparent 75%)',
          }}
          className="absolute inset-0 opacity-100"
        />
      </div>
    );
  }

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none z-0 ${className}`}>
      <div
        className="absolute inset-0 opacity-100"
        style={DOT_STYLES[variant]}
      />
    </div>
  );
}

export default DotBackground;