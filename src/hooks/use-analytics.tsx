import { useEffect, useRef } from 'react';
import { trackPageView } from '../lib/analytics';

export const useAnalytics = (location: string) => {
  const prevLocationRef = useRef<string>(location);
  
  useEffect(() => {
    if (location !== prevLocationRef.current) {
      trackPageView(location);
      prevLocationRef.current = location;
    }
  }, [location]);
};