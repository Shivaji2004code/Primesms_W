import { motion, type HTMLMotionProps } from 'framer-motion';
import { forwardRef } from 'react';

// Fade In Animation
export const FadeIn = forwardRef<
  HTMLDivElement,
  HTMLMotionProps<'div'> & {
    delay?: number;
    duration?: number;
  }
>(({ children, delay = 0, duration = 0.4, ...props }, ref) => (
  <motion.div
    ref={ref}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{
      duration,
      delay,
      ease: 'easeOut'
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
      ease: [0.25, 0.46, 0.45, 0.94],
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
      transition: { duration: 0.2 }
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
  // Check for reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  return (
    <motion.div
      ref={ref}
      whileHover={!prefersReducedMotion ? { 
        rotateX: tiltAngle,
        rotateY: tiltAngle / 2,
        scale: 1.02,
        transition: { duration: 0.3 }
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