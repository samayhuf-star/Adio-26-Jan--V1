// Local storage fallback for history when server is unavailable
import { emergencyCleanup, getStorageUsage } from './storageManager';

const STORAGE_KEY = 'adiology-campaign-history';
const MAX_HISTORY_ITEMS = 15;

// Get user-specific storage key
function getUserStorageKey(): string {
  // Try to get current user ID from localStorage (set by auth system)
  const currentUserId = localStorage.getItem('adiology-current-user-id');
  if (currentUserId) {
    return `${STORAGE_KEY}-${currentUserId}`;
  }
  return STORAGE_KEY;
}

// Set the current user ID for user-specific storage
export function setCurrentUserId(userId: string | null): void {
  const previousUserId = localStorage.getItem('adiology-current-user-id');
  
  if (userId) {
    localStorage.setItem('adiology-current-user-id', userId);
  } else {
    localStorage.removeItem('adiology-current-user-id');
  }
  
  // If user changed, clear the old shared storage to prevent data leakage
  if (previousUserId !== userId && previousUserId) {
    // Don't clear user-specific storage, just the old shared key if it exists
    const sharedData = localStorage.getItem(STORAGE_KEY);
    if (sharedData) {
      // Move shared data to the previous user's storage
      localStorage.setItem(`${STORAGE_KEY}-${previousUserId}`, sharedData);
      localStorage.removeItem(STORAGE_KEY);
    }
  }
}

// Clear all history for current user (useful for testing/cleanup)
export function clearUserHistory(): void {
  const key = getUserStorageKey();
  localStorage.removeItem(key);
}

export interface HistoryItem {
  id: string;
  type: string;
  name: string;
  data: any;
  timestamp: string;
  status?: 'draft' | 'completed'; // Add status field for drafts vs completed items
  lastModified?: string; // Track when draft was last modified
}

// Save to backend API (fallback for large campaigns)
async function saveToBackend(item: HistoryItem): Promise<string> {
  const response = await fetch('/api/campaigns/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      campaign_name: item.name,
      business_name: item.data?.businessName || item.name,
      website_url: item.data?.url || '',
      campaign_data: item.data,
      source: 'campaign-builder'
    })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to save to server');
  }
  
  const result = await response.json();
  console.log('✅ Saved to backend database:', result.id);
  return result.id;
}

export const localStorageHistory = {
  // Cleanup old items to make room for new saves
  cleanupOldItems(keepCount: number = 20): number {
    try {
      const history = this.getAll();
      if (history.length <= keepCount) return 0;
      
      // Sort by timestamp (oldest first) and remove oldest items
      history.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      const itemsToRemove = history.length - keepCount;
      const newHistory = history.slice(itemsToRemove);
      
      const storageKey = getUserStorageKey();
      localStorage.setItem(storageKey, JSON.stringify(newHistory));
      console.log(`[LocalStorageHistory] Cleaned up ${itemsToRemove} old items`);
      return itemsToRemove;
    } catch (error) {
      console.error('[LocalStorageHistory] Cleanup failed:', error);
      return 0;
    }
  },

  // Save an item to local storage with backend fallback
  async save(type: string, name: string, data: any, status: 'draft' | 'completed' = 'completed'): Promise<void> {
    const newItem: HistoryItem = {
      id: crypto.randomUUID(),
      type,
      name,
      data,
      timestamp: new Date().toISOString(),
      status,
      lastModified: new Date().toISOString()
    };
    
    // Check storage usage before saving
    try {
      const usage = getStorageUsage();
      if (usage.percentage > 0.7) {
        console.warn('[LocalStorageHistory] Storage usage high, cleaning up before save...');
        this.cleanupOldItems(10);
        emergencyCleanup();
      }
    } catch (e) {
      console.warn('[LocalStorageHistory] Could not check storage usage:', e);
    }
    
    // Proactively cleanup if we have many items
    const currentHistory = this.getAll();
    if (currentHistory.length > MAX_HISTORY_ITEMS) {
      this.cleanupOldItems(MAX_HISTORY_ITEMS - 5);
    }
    
    try {
      const history = this.getAll();
      history.push(newItem);
      const storageKey = getUserStorageKey();
      localStorage.setItem(storageKey, JSON.stringify(history));
      console.log(`✅ Saved to local storage as ${status}:`, newItem.id);
    } catch (error: any) {
      // Check if it's a quota exceeded error
      if (error?.name === 'QuotaExceededError' || 
          error?.code === 22 || 
          (error?.message && error.message.includes('quota'))) {
        console.warn('localStorage quota exceeded, attempting emergency cleanup...');
        
        // Emergency cleanup first
        emergencyCleanup();
        
        // Aggressive cleanup - keep only 5 most recent items
        this.cleanupOldItems(5);
        
        // Retry localStorage save after cleanup
        try {
          const history = this.getAll();
          history.push(newItem);
          const storageKey = getUserStorageKey();
          localStorage.setItem(storageKey, JSON.stringify(history));
          console.log(`✅ Saved to local storage after cleanup as ${status}:`, newItem.id);
          return;
        } catch (retryError) {
          console.warn('localStorage save still failing after cleanup, trying backend...');
        }
        
        // Try to save to backend as last resort
        try {
          await saveToBackend(newItem);
          
          // Save a reference in localStorage (without the large data)
          const history = this.getAll();
          const reference: HistoryItem = {
            ...newItem,
            data: { 
              savedToServer: true, 
              url: data?.url,
              structure: data?.structure,
              keywordCount: data?.keywords?.length || data?.selectedKeywords?.length || 0,
              adCount: data?.ads?.length || 0
            }
          };
          history.push(reference);
          try {
            const storageKey = getUserStorageKey();
            localStorage.setItem(storageKey, JSON.stringify(history));
          } catch {
            // If still fails, just continue - data is saved on server
          }
          return;
        } catch (backendError) {
          console.error('Backend save also failed:', backendError);
          throw backendError;
        }
      }
      
      console.error('Failed to save to localStorage:', error);
      throw error;
    }
  },

  // Update an existing item (for draft updates)
  // If item doesn't exist, creates a new one (upsert behavior)
  async update(id: string, data: any, name?: string): Promise<void> {
    try {
      const history = this.getAll();
      const itemIndex = history.findIndex(item => item.id === id);
      
      if (itemIndex >= 0) {
        // Update existing item
        history[itemIndex].data = data;
        history[itemIndex].lastModified = new Date().toISOString();
        if (name) {
          history[itemIndex].name = name;
        }
        const storageKey = getUserStorageKey();
        localStorage.setItem(storageKey, JSON.stringify(history));
        console.log('✅ Updated in local storage:', id);
      } else {
        // Item not found - create new item instead (upsert behavior)
        // This handles cases where localStorage was cleared or item was deleted
        const newItem: HistoryItem = {
          id,
          type: 'campaign', // Default type, can be inferred from data if needed
          name: name || 'Draft',
          data,
          timestamp: new Date().toISOString(),
          status: 'draft',
          lastModified: new Date().toISOString()
        };
        
        history.push(newItem);
        const storageKey = getUserStorageKey();
        localStorage.setItem(storageKey, JSON.stringify(history));
        console.log('✅ Created new item in local storage (item not found for update):', id);
      }
    } catch (error) {
      // Only log unexpected errors, not "item not found" since we handle it above
      if (error instanceof Error && !error.message.includes('Item not found')) {
        console.error('Failed to update in localStorage:', error);
      }
      // Don't throw - gracefully handle the error
    }
  },

  // Mark a draft as completed
  async markAsCompleted(id: string): Promise<void> {
    try {
      const history = this.getAll();
      const itemIndex = history.findIndex(item => item.id === id);
      
      if (itemIndex >= 0) {
        history[itemIndex].status = 'completed';
        history[itemIndex].lastModified = new Date().toISOString();
        const storageKey = getUserStorageKey();
        localStorage.setItem(storageKey, JSON.stringify(history));
        console.log('✅ Marked as completed in local storage:', id);
      }
    } catch (error) {
      console.error('Failed to mark as completed in localStorage:', error);
      throw error;
    }
  },

  // Get all history items
  getAll(): HistoryItem[] {
    try {
      const storageKey = getUserStorageKey();
      const data = localStorage.getItem(storageKey);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to read from localStorage:', error);
      return [];
    }
  },

  // Delete an item by ID
  async delete(id: string): Promise<void> {
    try {
      const history = this.getAll();
      const filtered = history.filter(item => item.id !== id);
      const storageKey = getUserStorageKey();
      localStorage.setItem(storageKey, JSON.stringify(filtered));
      console.log('✅ Deleted from local storage:', id);
    } catch (error) {
      console.error('Failed to delete from localStorage:', error);
      throw error;
    }
  },

  // Get items by type
  getByType(type: string): HistoryItem[] {
    return this.getAll().filter(item => item.type === type);
  },

  // Clear all history
  clear(): void {
    const storageKey = getUserStorageKey();
    localStorage.removeItem(storageKey);
  }
};
