import { motion } from 'framer-motion';
import { MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
}

export function LoadingSpinner({ size = 'md', className, text }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  return (
    <div className={cn('flex flex-col items-center justify-center', className)}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className={cn(
          'rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center',
          sizeClasses[size]
        )}
      >
        <MessageSquare className={cn(
          'text-white',
          size === 'sm' ? 'h-2 w-2' : size === 'md' ? 'h-4 w-4' : 'h-6 w-6'
        )} />
      </motion.div>
      {text && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-sm text-gray-600 dark:text-gray-300 mt-2"
        >
          {text}
        </motion.p>
      )}
    </div>
  );
}