interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface PendingRequest<T> {
  promise: Promise<T>;
  timestamp: number;
}

class ApiCache {
  private cache = new Map<string, CacheEntry<any>>();
  private pendingRequests = new Map<string, PendingRequest<any>>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data as T;
  }

  set<T>(key: string, data: T, ttl?: number): void {
    const now = Date.now();
    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + (ttl || this.defaultTTL),
    });
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }
    return true;
  }

  isStale(key: string, maxAge: number): boolean {
    const entry = this.cache.get(key);
    if (!entry) return true;
    return Date.now() - entry.timestamp > maxAge;
  }

  invalidate(key: string): void {
    this.cache.delete(key);
    this.pendingRequests.delete(key);
  }

  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
    for (const key of this.pendingRequests.keys()) {
      if (regex.test(key)) {
        this.pendingRequests.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
    this.pendingRequests.clear();
  }

  async dedupe<T>(
    key: string,
    fetcher: () => Promise<T>,
    options?: { ttl?: number; staleWhileRevalidate?: boolean; staleTime?: number }
  ): Promise<T> {
    const { ttl, staleWhileRevalidate = false, staleTime = 60000 } = options || {};

    const cached = this.get<T>(key);
    
    if (staleWhileRevalidate && cached !== null) {
      if (this.isStale(key, staleTime)) {
        this.revalidateInBackground(key, fetcher, ttl);
      }
      return cached;
    }

    if (cached !== null) {
      return cached;
    }

    const pending = this.pendingRequests.get(key);
    if (pending && Date.now() - pending.timestamp < 30000) {
      return pending.promise;
    }

    const promise = fetcher().then((data) => {
      this.set(key, data, ttl);
      this.pendingRequests.delete(key);
      return data;
    }).catch((error) => {
      this.pendingRequests.delete(key);
      throw error;
    });

    this.pendingRequests.set(key, { promise, timestamp: Date.now() });
    return promise;
  }

  private async revalidateInBackground<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl?: number
  ): Promise<void> {
    if (this.pendingRequests.has(key)) {
      return;
    }

    const promise = fetcher().then((data) => {
      this.set(key, data, ttl);
      this.pendingRequests.delete(key);
      return data;
    }).catch((error) => {
      this.pendingRequests.delete(key);
      console.warn(`Background revalidation failed for ${key}:`, error);
    });

    this.pendingRequests.set(key, { promise: promise as Promise<T>, timestamp: Date.now() });
  }

  getStats(): { cacheSize: number; pendingRequests: number } {
    return {
      cacheSize: this.cache.size,
      pendingRequests: this.pendingRequests.size,
    };
  }
}

export const apiCache = new ApiCache();

export function createCacheKey(...parts: (string | number | undefined | null)[]): string {
  return parts.filter(p => p != null).join(':');
}
