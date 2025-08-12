import { forwardRef } from 'react';
import { cn } from '../../lib/utils';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'gradient-border' | 'subtle';
}

const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    const variants = {
      default: 'bg-white/80 backdrop-blur-sm border border-gray-200/50 shadow-lg',
      glass: 'bg-white/60 backdrop-blur-md border border-white/20 shadow-xl',
      'gradient-border': 'bg-white relative before:absolute before:inset-0 before:rounded-2xl before:p-[1px] before:bg-gradient-to-r before:from-emerald-500/20 before:to-teal-500/20 before:mask-composite:subtract before:[mask:linear-gradient(#fff_0_0)_content-box,linear-gradient(#fff_0_0)] shadow-lg',
      subtle: 'bg-gray-50/80 backdrop-blur-sm border border-gray-100/50 shadow-sm'
    };

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-2xl',
          variants[variant],
          className
        )}
        {...props}
      />
    );
  }
);

GlassCard.displayName = 'GlassCard';

export { GlassCard };