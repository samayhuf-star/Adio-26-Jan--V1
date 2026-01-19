import { Cloud, HardDrive, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

export type DataSource = 'live' | 'cached' | 'loading';

interface DataSourceIndicatorProps {
  source: DataSource;
  className?: string;
  showLabel?: boolean;
}

export function DataSourceIndicator({ 
  source, 
  className,
  showLabel = true 
}: DataSourceIndicatorProps) {
  const config = {
    live: {
      icon: Cloud,
      label: 'Live',
      bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
      textColor: 'text-emerald-700 dark:text-emerald-400',
      dotColor: 'bg-emerald-500',
      tooltip: 'Data synced from cloud'
    },
    cached: {
      icon: HardDrive,
      label: 'Cached',
      bgColor: 'bg-amber-100 dark:bg-amber-900/30',
      textColor: 'text-amber-700 dark:text-amber-400',
      dotColor: 'bg-amber-500',
      tooltip: 'Using local cached data'
    },
    loading: {
      icon: Loader2,
      label: 'Syncing',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      textColor: 'text-blue-700 dark:text-blue-400',
      dotColor: 'bg-blue-500',
      tooltip: 'Syncing data...'
    }
  };

  const { icon: Icon, label, bgColor, textColor, dotColor, tooltip } = config[source];

  return (
    <div 
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium',
        bgColor,
        textColor,
        className
      )}
      title={tooltip}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full', dotColor, source === 'loading' && 'animate-pulse')} />
      <Icon className={cn('w-3 h-3', source === 'loading' && 'animate-spin')} />
      {showLabel && <span>{label}</span>}
    </div>
  );
}
