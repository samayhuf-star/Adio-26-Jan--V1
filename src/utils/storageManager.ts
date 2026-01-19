const STORAGE_CONFIG = {
  maxStorageBytes: 4 * 1024 * 1024,
  warningThreshold: 0.8,
  maxItemAgeMs: 7 * 24 * 60 * 60 * 1000,
  essentialKeys: [
    'user_preferences',
    'theme',
    'sidebar_state',
  ],
  cacheKeys: [
    'analysis_cache',
    'saved_websites',
    'draft_campaigns',
    'url_analysis_',
    'campaign_builder_',
    'keyword_',
    'negative_keywords_',
    'form_data_',
    'autofill_',
    // NOTE: adiology-campaign-history is NOT included here - it's handled by trimHistoryStorage() 
    // to preserve recent user saves instead of deleting all history
  ],
};

interface StorageItem {
  key: string;
  size: number;
  timestamp?: number;
  isCache: boolean;
}

export function getStorageUsage(): { used: number; total: number; percentage: number } {
  let totalSize = 0;
  
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key);
        if (value) {
          totalSize += key.length + value.length;
        }
      }
    }
  } catch (error) {
    console.error('[StorageManager] Error calculating usage:', error);
  }
  
  const totalBytes = STORAGE_CONFIG.maxStorageBytes;
  return {
    used: totalSize * 2,
    total: totalBytes,
    percentage: (totalSize * 2) / totalBytes,
  };
}

export function getStorageItems(): StorageItem[] {
  const items: StorageItem[] = [];
  
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key);
        const size = value ? (key.length + value.length) * 2 : 0;
        const isCache = STORAGE_CONFIG.cacheKeys.some(cacheKey => key.includes(cacheKey));
        
        let timestamp: number | undefined;
        try {
          const parsed = JSON.parse(value || '{}');
          timestamp = parsed.timestamp || parsed.createdAt || parsed.updated_at;
        } catch {}
        
        items.push({ key, size, timestamp, isCache });
      }
    }
  } catch (error) {
    console.error('[StorageManager] Error getting items:', error);
  }
  
  return items.sort((a, b) => b.size - a.size);
}

export function clearCacheData(): number {
  let clearedBytes = 0;
  const keysToRemove: string[] = [];
  
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const isEssential = STORAGE_CONFIG.essentialKeys.some(k => key === k || key.startsWith(k));
        const isCache = STORAGE_CONFIG.cacheKeys.some(cacheKey => key.includes(cacheKey));
        
        if (!isEssential && isCache) {
          const value = localStorage.getItem(key);
          clearedBytes += (key.length + (value?.length || 0)) * 2;
          keysToRemove.push(key);
        }
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    console.log(`[StorageManager] Cleared ${keysToRemove.length} cache items (${(clearedBytes / 1024).toFixed(1)} KB)`);
  } catch (error) {
    console.error('[StorageManager] Error clearing cache:', error);
  }
  
  return clearedBytes;
}

export function clearOldData(maxAgeMs: number = STORAGE_CONFIG.maxItemAgeMs): number {
  let clearedBytes = 0;
  const now = Date.now();
  const keysToRemove: string[] = [];
  
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const isEssential = STORAGE_CONFIG.essentialKeys.some(k => key === k || key.startsWith(k));
        if (isEssential) continue;
        
        const value = localStorage.getItem(key);
        if (!value) continue;
        
        try {
          const parsed = JSON.parse(value);
          const timestamp = parsed.timestamp || parsed.createdAt || parsed.updated_at;
          
          if (timestamp && typeof timestamp === 'number' && (now - timestamp) > maxAgeMs) {
            clearedBytes += (key.length + value.length) * 2;
            keysToRemove.push(key);
          }
        } catch {}
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    if (keysToRemove.length > 0) {
      console.log(`[StorageManager] Cleared ${keysToRemove.length} old items (${(clearedBytes / 1024).toFixed(1)} KB)`);
    }
  } catch (error) {
    console.error('[StorageManager] Error clearing old data:', error);
  }
  
  return clearedBytes;
}

export function clearAllStorage(): void {
  try {
    const essentialData: Record<string, string> = {};
    
    STORAGE_CONFIG.essentialKeys.forEach(key => {
      const value = localStorage.getItem(key);
      if (value) essentialData[key] = value;
    });
    
    localStorage.clear();
    
    Object.entries(essentialData).forEach(([key, value]) => {
      localStorage.setItem(key, value);
    });
    
    console.log('[StorageManager] Cleared all non-essential storage');
  } catch (error) {
    console.error('[StorageManager] Error clearing storage:', error);
  }
}

export function safeSetItem(key: string, value: string): boolean {
  try {
    const itemSize = (key.length + value.length) * 2;
    const usage = getStorageUsage();
    
    if (usage.used + itemSize > usage.total * 0.95) {
      console.warn('[StorageManager] Storage near limit, clearing old data...');
      clearOldData();
      clearCacheData();
    }
    
    localStorage.setItem(key, value);
    return true;
  } catch (error: any) {
    if (error.name === 'QuotaExceededError' || error.code === 22) {
      console.warn('[StorageManager] Quota exceeded, clearing cache...');
      clearCacheData();
      clearOldData();
      
      try {
        localStorage.setItem(key, value);
        return true;
      } catch {
        console.error('[StorageManager] Still cannot save after cleanup');
        return false;
      }
    }
    console.error('[StorageManager] Error saving:', error);
    return false;
  }
}

export function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.error('[StorageManager] Error reading:', error);
    return null;
  }
}

// Trim history items to keep only most recent ones
export function trimHistoryStorage(keepCount: number = 15): number {
  let clearedBytes = 0;
  
  try {
    // Find all history keys
    const historyKeys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.includes('adiology-campaign-history')) {
        historyKeys.push(key);
      }
    }
    
    for (const key of historyKeys) {
      const value = localStorage.getItem(key);
      if (!value) continue;
      
      try {
        const history = JSON.parse(value);
        if (!Array.isArray(history) || history.length <= keepCount) continue;
        
        const originalSize = value.length;
        
        // Sort by timestamp and keep most recent
        history.sort((a: any, b: any) => 
          new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime()
        );
        const trimmed = history.slice(0, keepCount);
        
        localStorage.setItem(key, JSON.stringify(trimmed));
        const newSize = JSON.stringify(trimmed).length;
        clearedBytes += (originalSize - newSize) * 2;
        console.log(`[StorageManager] Trimmed history ${key} from ${history.length} to ${trimmed.length} items`);
      } catch (parseError) {
        // If can't parse, just skip
      }
    }
  } catch (error) {
    console.error('[StorageManager] Error trimming history:', error);
  }
  
  return clearedBytes;
}

let storageManagerInitialized = false;

export function initStorageManager(): void {
  // Prevent multiple initializations
  if (storageManagerInitialized) return;
  storageManagerInitialized = true;
  
  try {
    const usage = getStorageUsage();
    console.log(`[StorageManager] Storage: ${(usage.used / 1024).toFixed(1)} KB / ${(usage.total / 1024).toFixed(0)} KB (${(usage.percentage * 100).toFixed(1)}%)`);
    
    // Always run cleanup first - prevent quota errors before they happen
    // Proactively clean if usage is above 60%
    if (usage.percentage > 0.6) {
      console.warn('[StorageManager] Storage above 60%, proactive cleanup...');
      trimHistoryStorage(10);
      clearCacheData();
      clearOldData();
    }
    
    if (usage.percentage > STORAGE_CONFIG.warningThreshold) {
      console.warn('[StorageManager] Storage above threshold, aggressive cleanup...');
      
      // Very aggressive cleanup
      trimHistoryStorage(5);
      clearCacheData();
      clearOldData();
      
      // If still over, clear more aggressively
      const newUsage = getStorageUsage();
      if (newUsage.percentage > 0.9) {
        console.warn('[StorageManager] Critical storage level, emergency cleanup...');
        emergencyCleanup();
      }
    }
  } catch (error) {
    console.error('[StorageManager] Init error, attempting emergency cleanup:', error);
    emergencyCleanup();
  }
}

// Emergency cleanup when storage is critically full
export function emergencyCleanup(): void {
  try {
    // Remove all campaign history except last 3 items per user
    const historyKeys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.includes('adiology-campaign-history')) {
        historyKeys.push(key);
      }
    }
    
    for (const key of historyKeys) {
      try {
        const value = localStorage.getItem(key);
        if (!value) continue;
        
        const history = JSON.parse(value);
        if (!Array.isArray(history)) {
          localStorage.removeItem(key);
          continue;
        }
        
        if (history.length > 3) {
          // Keep only 3 most recent
          history.sort((a: any, b: any) => 
            new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime()
          );
          const trimmed = history.slice(0, 3);
          localStorage.setItem(key, JSON.stringify(trimmed));
        }
      } catch {
        // If parsing fails, remove the key entirely
        localStorage.removeItem(key);
      }
    }
    
    // Remove large cache items
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key);
        // Remove items larger than 100KB
        if (value && value.length > 100000) {
          const isEssential = STORAGE_CONFIG.essentialKeys.some(k => key === k);
          if (!isEssential) {
            keysToRemove.push(key);
          }
        }
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    console.log(`[StorageManager] Emergency cleanup completed, removed ${keysToRemove.length} large items`);
  } catch (error) {
    console.error('[StorageManager] Emergency cleanup failed:', error);
  }
}

let storageCleanupRan = false;

export function clearStorageNow(): void {
  // Only run cleanup once per page load
  if (storageCleanupRan) return;
  storageCleanupRan = true;
  
  console.log('[StorageManager] Performing immediate storage cleanup...');
  
  // First trim history (keep recent items)
  trimHistoryStorage(10);
  
  // Then clear other cache items
  clearCacheData();
  clearOldData(24 * 60 * 60 * 1000);
  
  const usage = getStorageUsage();
  console.log(`[StorageManager] After cleanup: ${(usage.used / 1024).toFixed(1)} KB used`);
}
