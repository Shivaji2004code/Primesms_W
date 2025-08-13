import { motion, type HTMLMotionProps, useReducedMotion } from 'framer-motion';
import { forwardRef } from 'react';

// Motion tokens for consistent feel
export const motionTimings = {
  durationFast: 0.2,
  durationBase: 0.4,
  durationSlow: 0.6,
  easeStandard: [0.22, 1, 0.36, 1] as [number, number, number, number]
};

// Fade In Animation
export const FadeIn = forwardRef<
  HTMLDivElement,
  HTMLMotionProps<'div'> & {
    delay?: number;
    duration?: number;
  }
>(({ children, delay = 0, duration = motionTimings.durationBase, ...props }, ref) => (
  <motion.div
    ref={ref}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{
      duration,
      delay,
      ease: motionTimings.easeStandard
    }}
    {...props}
  >
    {children}
  </motion.div>
));

FadeIn.displayName = 'FadeIn';

// Slide Up Animation
export const SlideUp = forwardRef<
  HTMLDivElement,
  HTMLMotionProps<'div'> & {
    delay?: number;
    staggerChildren?: number;
  }
>(({ children, delay = 0, staggerChildren, ...props }, ref) => (
  <motion.div
    ref={ref}
    initial={{ opacity: 0, y: 40 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{
      duration: 0.45,
      delay,
      ease: motionTimings.easeStandard,
      staggerChildren
    }}
    {...props}
  >
    {children}
  </motion.div>
));

SlideUp.displayName = 'SlideUp';

// Hover Scale Animation
export const HoverScale = forwardRef<
  HTMLDivElement,
  HTMLMotionProps<'div'> & {
    scale?: number;
  }
>(({ children, scale = 1.02, ...props }, ref) => (
  <motion.div
    ref={ref}
    whileHover={{ 
      scale,
      transition: { duration: motionTimings.durationFast }
    }}
    whileTap={{ scale: 0.98 }}
    {...props}
  >
    {children}
  </motion.div>
));

HoverScale.displayName = 'HoverScale';

// Tilt on Hover (with reduced motion check)
export const TiltOnHover = forwardRef<
  HTMLDivElement,
  HTMLMotionProps<'div'> & {
    tiltAngle?: number;
  }
>(({ children, tiltAngle = 6, ...props }, ref) => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      ref={ref}
      whileHover={!prefersReducedMotion ? { 
        rotateX: tiltAngle,
        rotateY: tiltAngle / 2,
        scale: 1.02,
        transition: { duration: motionTimings.durationBase }
      } : undefined}
      style={!prefersReducedMotion ? {
        transformStyle: 'preserve-3d',
        perspective: '1000px'
      } : undefined}
      {...props}
    >
      {children}
    </motion.div>
  );
});

TiltOnHover.displayName = 'TiltOnHover';

// Stagger Container
export const StaggerContainer = forwardRef<
  HTMLDivElement,
  HTMLMotionProps<'div'> & {
    staggerDelay?: number;
  }
>(({ children, staggerDelay = 0.1, ...props }, ref) => (
  <motion.div
    ref={ref}
    initial="hidden"
    animate="visible"
    variants={{
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: staggerDelay
        }
      }
    }}
    {...props}
  >
    {children}
  </motion.div>
));

StaggerContainer.displayName = 'StaggerContainer';

// Soft hover lift with subtle shadow for cards
export const SoftHoverCard = forwardRef<
  HTMLDivElement,
  HTMLMotionProps<'div'>
>(({ children, ...props }, ref) => (
  <motion.div
    ref={ref}
    whileHover={{ y: -2, boxShadow: '0 8px 24px rgba(0,0,0,0.06)' }}
    transition={{ duration: motionTimings.durationFast, ease: motionTimings.easeStandard }}
    {...props}
  >
    {children}
  </motion.div>
));

SoftHoverCard.displayName = 'SoftHoverCard';