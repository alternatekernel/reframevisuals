import { ReactNode, CSSProperties, useRef } from 'react';
import { motion, useInView, Transition } from 'framer-motion';

export type ScrollRevealVariant = 'fade-slide' | 'spring-scale' | 'fade' | 'slide-left';

interface ScrollRevealProps {
  children: ReactNode;
  variant?: ScrollRevealVariant;
  delay?: number;
  duration?: number;
  threshold?: number;
  className?: string;
  style?: CSSProperties;
  /** y-offset to animate from in px */
  y?: number;
}

const ScrollReveal = ({
  children,
  variant = 'fade-slide',
  delay = 0,
  duration,
  threshold = 0.08,
  className,
  style,
  y,
}: ScrollRevealProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: threshold });

  const getMotionConfig = (): {
    hidden: any;
    visible: any;
    transition: Transition;
  } => {
    switch (variant) {
      case 'spring-scale':
        return {
          hidden: { opacity: 0, scale: 0.97, y: y ?? 30 },
          visible: { opacity: 1, scale: 1, y: 0 },
          transition: {
            type: 'spring',
            stiffness: 90,
            damping: 15,
            mass: 0.95,
            delay,
          },
        };
      case 'slide-left':
        return {
          hidden: { opacity: 0, x: -36 },
          visible: { opacity: 1, x: 0 },
          transition: {
            duration: duration ?? 0.6,
            ease: [0.16, 1, 0.3, 1],
            delay,
          },
        };
      case 'fade':
        return {
          hidden: { opacity: 0 },
          visible: { opacity: 1 },
          transition: {
            duration: duration ?? 0.5,
            ease: [0.16, 1, 0.3, 1],
            delay,
          },
        };
      case 'fade-slide':
      default:
        return {
          hidden: { opacity: 0, y: y ?? 35 },
          visible: { opacity: 1, y: 0 },
          transition: {
            duration: duration ?? 0.65,
            ease: [0.16, 1, 0.3, 1],
            delay,
          },
        };
    }
  };

  const { hidden, visible, transition } = getMotionConfig();

  return (
    <motion.div
      ref={ref}
      initial={false}
      animate={isInView ? visible : hidden}
      transition={transition}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  );
};

export default ScrollReveal;
