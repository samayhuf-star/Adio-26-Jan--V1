import React from 'react';
import { cn } from '../../lib/utils';

interface EnhancedCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'gradient';
  hover?: boolean;
  children: React.ReactNode;
}

export function EnhancedCard({ 
  className, 
  variant = 'default', 
  hover = true, 
  children, 
  ...props 
}: EnhancedCardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl p-6 shadow-lg border transition-all duration-300',
        {
          'bg-white border-gray-200': variant === 'default',
          'glass-card border-white/50': variant === 'glass',
          'bg-gradient-to-br from-white via-indigo-50/30 to-purple-50/30 border-white/50': variant === 'gradient',
        },
        hover && 'card-hover',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: React.ReactNode;
  gradient: string;
  delay?: number;
}

export function StatCard({ 
  title, 
  value, 
  change, 
  changeType = 'positive', 
  icon, 
  gradient,
  delay = 0 
}: StatCardProps) {
  return (
    <EnhancedCard 
      variant="glass" 
      className={`slide-in-up ${delay > 0 ? `float-delay-${Math.min(delay, 3)}` : ''}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-2">{title}</p>
          <p className="text-4xl font-bold text-gray-900 mb-3">{value}</p>
          {change && (
            <div className={cn(
              'flex items-center gap-2 text-sm',
              {
                'text-green-600': changeType === 'positive',
                'text-red-600': changeType === 'negative',
                'text-gray-600': changeType === 'neutral',
              }
            )}>
              <span>{change}</span>
            </div>
          )}
        </div>
        <div className={cn(
          'w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg float-animation',
          gradient
        )}>
          {icon}
        </div>
      </div>
    </EnhancedCard>
  );
}

interface ActionCardProps {
  title: string;
  description?: string;
  icon: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  gradient?: string;
}

export function ActionCard({ 
  title, 
  description, 
  icon, 
  onClick, 
  variant = 'outline',
  gradient = 'from-indigo-500 to-purple-500'
}: ActionCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'group glass-card rounded-2xl p-6 shadow-lg border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 text-left w-full',
        {
          'border-white/50 hover:border-indigo-300': variant === 'outline',
          'bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-transparent': variant === 'primary',
          'bg-gradient-to-r from-purple-600 to-pink-600 text-white border-transparent': variant === 'secondary',
        }
      )}
    >
      <div className="flex flex-col items-center space-y-4">
        <div className={cn(
          'w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300',
          variant === 'outline' ? `bg-gradient-to-br ${gradient}` : 'bg-white/20'
        )}>
          <div className={cn(
            'w-7 h-7',
            variant === 'outline' ? 'text-white' : 'text-white'
          )}>
            {icon}
          </div>
        </div>
        <div className="text-center">
          <h3 className={cn(
            'font-semibold mb-1',
            variant === 'outline' ? 'text-slate-700' : 'text-white'
          )}>
            {title}
          </h3>
          {description && (
            <p className={cn(
              'text-sm',
              variant === 'outline' ? 'text-slate-500' : 'text-white/80'
            )}>
              {description}
            </p>
          )}
        </div>
      </div>
    </button>
  );
}