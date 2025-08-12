import type { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { GlassCard } from './glass-card';
import { HoverScale, TiltOnHover } from './motion-components';
import { cn } from '../../lib/utils';

interface EnhancedMetricCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: LucideIcon;
  gradient: {
    from: string;
    to: string;
  };
  change?: {
    value: string;
    type: 'positive' | 'negative' | 'neutral';
  };
  delay?: number;
}

export function EnhancedMetricCard({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  gradient,
  change,
  delay = 0
}: EnhancedMetricCardProps) {
  const formatValue = (val: string | number) => {
    if (typeof val === 'number') {
      return val.toLocaleString();
    }
    return val;
  };

  const changeColors = {
    positive: 'text-emerald-600 bg-emerald-50',
    negative: 'text-red-600 bg-red-50',
    neutral: 'text-gray-600 bg-gray-50'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.4,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
    >
      <TiltOnHover tiltAngle={4}>
        <HoverScale scale={1.02}>
          <GlassCard 
            variant="gradient-border" 
            className="relative overflow-hidden group transition-all duration-500 hover:shadow-2xl hover:shadow-emerald-500/10"
          >
            {/* Background gradient */}
            <div className={cn(
              "absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-500",
              `bg-gradient-to-br ${gradient.from} ${gradient.to}`
            )} />
            
            {/* Content */}
            <div className="relative p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-2 tracking-wide uppercase">
                    {title}
                  </p>
                  
                  {/* Animated counter */}
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ 
                      duration: 0.6,
                      delay: delay + 0.2,
                      ease: [0.25, 0.46, 0.45, 0.94]
                    }}
                  >
                    <p className="text-3xl font-bold text-gray-900 mb-1 tracking-tight leading-none">
                      {formatValue(value)}
                    </p>
                  </motion.div>
                  
                  <p className="text-sm text-gray-500 leading-relaxed">
                    {description}
                  </p>
                  
                  {/* Change indicator */}
                  {change && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ 
                        duration: 0.3,
                        delay: delay + 0.4
                      }}
                      className={cn(
                        "inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium mt-3",
                        changeColors[change.type]
                      )}
                    >
                      {change.value}
                    </motion.div>
                  )}
                </div>
                
                {/* Icon with gradient background */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{
                    duration: 0.6,
                    delay: delay + 0.1,
                    ease: [0.25, 0.46, 0.45, 0.94]
                  }}
                  className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ring-1 ring-white/50 group-hover:scale-110 transition-transform duration-300",
                    `bg-gradient-to-br ${gradient.from} ${gradient.to}`
                  )}
                >
                  <Icon className="h-7 w-7 text-white" />
                </motion.div>
              </div>
            </div>
            
            {/* Hover glow effect */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
              <div className={cn(
                "absolute inset-0 rounded-2xl blur-xl",
                `bg-gradient-to-br ${gradient.from} ${gradient.to} opacity-20`
              )} />
            </div>
          </GlassCard>
        </HoverScale>
      </TiltOnHover>
    </motion.div>
  );
}