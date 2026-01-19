import { useState, useEffect, useCallback } from 'react';
import { Cloud, AlertTriangle, XCircle, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

export type ApiStatus = 'online' | 'slow' | 'offline' | 'checking';

interface ApiStatusIndicatorProps {
  className?: string;
  showLabel?: boolean;
  checkInterval?: number;
  apiEndpoint?: string;
}

export function ApiStatusIndicator({ 
  className,
  showLabel = true,
  checkInterval = 30000,
  apiEndpoint = '/api/health'
}: ApiStatusIndicatorProps) {
  const [status, setStatus] = useState<ApiStatus>('checking');
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [responseTime, setResponseTime] = useState<number | null>(null);

  const checkApiHealth = useCallback(async () => {
    const startTime = Date.now();
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(apiEndpoint, {
        method: 'GET',
        signal: controller.signal,
        headers: { 'Cache-Control': 'no-cache' }
      });
      
      clearTimeout(timeoutId);
      const elapsed = Date.now() - startTime;
      setResponseTime(elapsed);
      setLastChecked(new Date());
      
      if (response.ok) {
        if (elapsed > 3000) {
          setStatus('slow');
        } else {
          setStatus('online');
        }
      } else {
        setStatus('offline');
      }
    } catch (error) {
      setResponseTime(null);
      setLastChecked(new Date());
      setStatus('offline');
    }
  }, [apiEndpoint]);

  useEffect(() => {
    checkApiHealth();
    const interval = setInterval(checkApiHealth, checkInterval);
    return () => clearInterval(interval);
  }, [checkApiHealth, checkInterval]);

  const config = {
    online: {
      icon: Cloud,
      label: 'API Online',
      bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
      textColor: 'text-emerald-700 dark:text-emerald-400',
      dotColor: 'bg-emerald-500',
      tooltip: `API responding normally${responseTime ? ` (${responseTime}ms)` : ''}`
    },
    slow: {
      icon: AlertTriangle,
      label: 'API Slow',
      bgColor: 'bg-amber-100 dark:bg-amber-900/30',
      textColor: 'text-amber-700 dark:text-amber-400',
      dotColor: 'bg-amber-500',
      tooltip: `API responding slowly${responseTime ? ` (${responseTime}ms)` : ''}`
    },
    offline: {
      icon: XCircle,
      label: 'API Offline',
      bgColor: 'bg-red-100 dark:bg-red-900/30',
      textColor: 'text-red-700 dark:text-red-400',
      dotColor: 'bg-red-500',
      tooltip: 'API is not responding - using cached data if available'
    },
    checking: {
      icon: Loader2,
      label: 'Checking...',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      textColor: 'text-blue-700 dark:text-blue-400',
      dotColor: 'bg-blue-500',
      tooltip: 'Checking API status...'
    }
  };

  const { icon: Icon, label, bgColor, textColor, dotColor, tooltip } = config[status];

  return (
    <div 
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium cursor-pointer',
        bgColor,
        textColor,
        className
      )}
      title={tooltip}
      onClick={checkApiHealth}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full', dotColor, status === 'checking' && 'animate-pulse')} />
      <Icon className={cn('w-3 h-3', status === 'checking' && 'animate-spin')} />
      {showLabel && <span>{label}</span>}
    </div>
  );
}
