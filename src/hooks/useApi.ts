/**
 * API Hook with Error Handling and Caching
 * 
 * Provides a safe way to fetch data with proper error handling,
 * loading states, caching, and request deduplication.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { apiCache, createCacheKey } from '../utils/apiCache';

interface UseApiOptions {
  ttl?: number;
  staleWhileRevalidate?: boolean;
  staleTime?: number;
  enabled?: boolean;
}

interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
const DEFAULT_STALE_TIME = 60 * 1000; // 1 minute

export function useApi<T>(url: string | null, options?: UseApiOptions): UseApiResult<T> {
  const { 
    ttl = DEFAULT_TTL, 
    staleWhileRevalidate = true, 
    staleTime = DEFAULT_STALE_TIME,
    enabled = true 
  } = options || {};

  const getCacheKey = useCallback(() => url ? createCacheKey('api', url) : null, [url]);

  const [data, setData] = useState<T | null>(() => {
    const cacheKey = getCacheKey();
    if (!cacheKey) return null;
    return apiCache.get<T>(cacheKey);
  });
  
  const [loading, setLoading] = useState(() => {
    const cacheKey = getCacheKey();
    return !cacheKey || !apiCache.has(cacheKey);
  });
  const [error, setError] = useState<string | null>(null);
  const hasFetched = useRef(false);
  const currentUrl = useRef(url);

  const fetchData = useCallback(async (forceRefresh = false) => {
    if (!url || !enabled) {
      setLoading(false);
      return;
    }

    const cacheKey = createCacheKey('api', url);
    const cached = apiCache.get<T>(cacheKey);
    const hasCache = cached !== null;
    const isStale = apiCache.isStale(cacheKey, staleTime);

    if (hasCache && !forceRefresh) {
      setData(cached);
      if (!isStale) {
        setLoading(false);
        return;
      }
    }

    try {
      if (!hasCache) {
        setLoading(true);
      }
      setError(null);
      
      const fetcher = async () => {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return response.json();
      };

      const result = await apiCache.dedupe<T>(
        cacheKey,
        fetcher,
        { ttl, staleWhileRevalidate, staleTime }
      );
      
      setData(result);
      
    } catch (err) {
      console.error('API Error:', err);
      if (!hasCache) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      }
    } finally {
      setLoading(false);
    }
  }, [url, enabled, ttl, staleWhileRevalidate, staleTime]);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    if (currentUrl.current !== url) {
      currentUrl.current = url;
      hasFetched.current = false;
      const cacheKey = url ? createCacheKey('api', url) : null;
      const cached = cacheKey ? apiCache.get<T>(cacheKey) : null;
      if (cached) {
        setData(cached);
      } else {
        setData(null);
      }
    }

    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchData();
    }
  }, [enabled, fetchData, url]);

  const refetch = useCallback(() => {
    hasFetched.current = true;
    return fetchData(true);
  }, [fetchData]);

  return { data, loading, error, refetch };
}
