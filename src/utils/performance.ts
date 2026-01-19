// Performance optimization utilities

// Debounce function with cleanup
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate = false
): T & { cancel: () => void } {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  let result: ReturnType<T>;

  const debounced = function (this: any, ...args: Parameters<T>) {
    const callNow = immediate && !timeout;
    
    if (timeout) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(() => {
      timeout = null;
      if (!immediate) {
        result = func.apply(this, args);
      }
    }, wait);
    
    if (callNow) {
      result = func.apply(this, args);
    }
    
    return result;
  } as T & { cancel: () => void };

  debounced.cancel = () => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
  };

  return debounced;
}

// Throttle function with cleanup
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): T & { cancel: () => void } {
  let inThrottle: boolean = false;
  let lastResult: ReturnType<T>;
  let timeout: NodeJS.Timeout | null = null;

  const throttled = function (this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      lastResult = func.apply(this, args);
      inThrottle = true;
      timeout = setTimeout(() => {
        inThrottle = false;
        timeout = null;
      }, limit);
    }
    return lastResult;
  } as T & { cancel: () => void };

  throttled.cancel = () => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
    inThrottle = false;
  };

  return throttled;
}

// Optimized array operations
export const arrayUtils = {
  // Single-pass filter and map
  filterMap<T, U>(
    array: T[],
    predicate: (item: T, index: number) => boolean,
    mapper: (item: T, index: number) => U
  ): U[] {
    const result: U[] = [];
    for (let i = 0; i < array.length; i++) {
      const item = array[i];
      if (predicate(item, i)) {
        result.push(mapper(item, i));
      }
    }
    return result;
  },

  // Single-pass reduce with multiple operations
  multiReduce<T, R extends Record<string, any>>(
    array: T[],
    reducers: {
      [K in keyof R]: (acc: R[K], item: T, index: number) => R[K];
    },
    initialValues: R
  ): R {
    const result = { ...initialValues };
    for (let i = 0; i < array.length; i++) {
      const item = array[i];
      for (const key in reducers) {
        result[key] = reducers[key](result[key], item, i);
      }
    }
    return result;
  },

  // Efficient deduplication
  dedupe<T>(array: T[], keyFn?: (item: T) => any): T[] {
    if (!keyFn) {
      return [...new Set(array)];
    }
    
    const seen = new Set();
    return array.filter(item => {
      const key = keyFn(item);
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  },

  // Chunking for large arrays
  chunk<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  },

  // Efficient sorting with multiple criteria
  multiSort<T>(
    array: T[],
    comparers: Array<(a: T, b: T) => number>
  ): T[] {
    return [...array].sort((a, b) => {
      for (const comparer of comparers) {
        const result = comparer(a, b);
        if (result !== 0) return result;
      }
      return 0;
    });
  }
};

// Memory-efficient data processing
export const dataUtils = {
  // Process large datasets in batches
  async processBatches<T, R>(
    data: T[],
    processor: (batch: T[]) => Promise<R[]> | R[],
    batchSize = 100,
    onProgress?: (processed: number, total: number) => void
  ): Promise<R[]> {
    const results: R[] = [];
    const batches = arrayUtils.chunk(data, batchSize);
    
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      const batchResults = await processor(batch);
      results.push(...batchResults);
      
      if (onProgress) {
        onProgress((i + 1) * batchSize, data.length);
      }
      
      // Allow other tasks to run
      await new Promise(resolve => setTimeout(resolve, 0));
    }
    
    return results;
  },

  // Lazy evaluation for large datasets
  createLazyIterator<T>(data: T[]) {
    let index = 0;
    
    return {
      next(): { value: T | undefined; done: boolean } {
        if (index >= data.length) {
          return { value: undefined, done: true };
        }
        return { value: data[index++], done: false };
      },
      
      hasNext(): boolean {
        return index < data.length;
      },
      
      reset(): void {
        index = 0;
      },
      
      skip(count: number): void {
        index = Math.min(index + count, data.length);
      },
      
      take(count: number): T[] {
        const result: T[] = [];
        for (let i = 0; i < count && index < data.length; i++) {
          result.push(data[index++]);
        }
        return result;
      }
    };
  }
};

// Performance monitoring utilities
export const performanceUtils = {
  // Measure function execution time
  measure<T extends (...args: any[]) => any>(
    name: string,
    func: T
  ): T {
    return ((...args: Parameters<T>) => {
      const start = performance.now();
      const result = func(...args);
      const end = performance.now();
      console.log(`${name} took ${end - start} milliseconds`);
      return result;
    }) as T;
  },

  // Measure async function execution time
  measureAsync<T extends (...args: any[]) => Promise<any>>(
    name: string,
    func: T
  ): T {
    return (async (...args: Parameters<T>) => {
      const start = performance.now();
      const result = await func(...args);
      const end = performance.now();
      console.log(`${name} took ${end - start} milliseconds`);
      return result;
    }) as T;
  },

  // Memory usage tracking
  getMemoryUsage(): {
    used: number;
    total: number;
    percentage: number;
  } | null {
    if ('memory' in performance) {
      const {memory} = performance as any;
      return {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        percentage: (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100
      };
    }
    return null;
  },

  // FPS monitoring
  createFPSMonitor(callback: (fps: number) => void) {
    let frames = 0;
    let lastTime = performance.now();
    let animationId: number;

    const tick = () => {
      frames++;
      const currentTime = performance.now();
      
      if (currentTime >= lastTime + 1000) {
        const fps = Math.round((frames * 1000) / (currentTime - lastTime));
        callback(fps);
        frames = 0;
        lastTime = currentTime;
      }
      
      animationId = requestAnimationFrame(tick);
    };

    animationId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }
};

// Memoization utilities
export const memoUtils = {
  // Simple memoization
  memoize<T extends (...args: any[]) => any>(
    func: T,
    keyGenerator?: (...args: Parameters<T>) => string
  ): T & { cache: Map<string, ReturnType<T>>; clear: () => void } {
    const cache = new Map<string, ReturnType<T>>();
    
    const memoized = ((...args: Parameters<T>) => {
      const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);
      
      if (cache.has(key)) {
        return cache.get(key)!;
      }
      
      const result = func(...args);
      cache.set(key, result);
      return result;
    }) as T & { cache: Map<string, ReturnType<T>>; clear: () => void };

    memoized.cache = cache;
    memoized.clear = () => cache.clear();

    return memoized;
  },

  // LRU cache implementation
  createLRUCache<K, V>(maxSize: number) {
    const cache = new Map<K, V>();

    return {
      get(key: K): V | undefined {
        if (cache.has(key)) {
          const value = cache.get(key)!;
          // Move to end (most recently used)
          cache.delete(key);
          cache.set(key, value);
          return value;
        }
        return undefined;
      },

      set(key: K, value: V): void {
        if (cache.has(key)) {
          cache.delete(key);
        } else if (cache.size >= maxSize) {
          // Remove least recently used (first item)
          const firstKey = cache.keys().next().value;
          cache.delete(firstKey);
        }
        cache.set(key, value);
      },

      has(key: K): boolean {
        return cache.has(key);
      },

      delete(key: K): boolean {
        return cache.delete(key);
      },

      clear(): void {
        cache.clear();
      },

      get size(): number {
        return cache.size;
      }
    };
  }
};
