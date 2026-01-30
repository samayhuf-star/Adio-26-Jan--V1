import { localStorageHistory, HistoryItem } from './localStorageHistory';

/**
 * History service
 * Provides a consistent API for saving and retrieving keyword plans, mixer results, etc.
 * Uses backend API for database storage, falls back to localStorage when unavailable
 */

export type DataSourceType = 'live' | 'cached' | 'loading';

type DataSourceListener = (source: DataSourceType) => void;

let currentDataSource: DataSourceType = 'loading';
const dataSourceListeners: Set<DataSourceListener> = new Set();

export function getDataSource(): DataSourceType {
  return currentDataSource;
}

export function subscribeToDataSource(listener: DataSourceListener): () => void {
  dataSourceListeners.add(listener);
  listener(currentDataSource);
  return () => dataSourceListeners.delete(listener);
}

function setDataSource(source: DataSourceType) {
  if (currentDataSource !== source) {
    currentDataSource = source;
    dataSourceListeners.forEach(listener => listener(source));
  }
}

const MAX_RETRIES = 2;
const RETRY_DELAY = 1000; // 1 second

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry(
  url: string, 
  options: RequestInit, 
  retries = MAX_RETRIES
): Promise<Response> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, options);
      
      // NEVER retry on 429 rate limit - return immediately to prevent loops
      if (response.status === 429) {
        return response;
      }
      
      // Retry on 5xx server errors only
      if (response.status >= 500 && attempt < retries) {
        await sleep(RETRY_DELAY * (attempt + 1));
        continue;
      }
      
      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Retry on network errors only (not 429)
      if (attempt < retries) {
        await sleep(RETRY_DELAY * (attempt + 1));
        continue;
      }
    }
  }
  
  throw lastError || new Error('Request failed after retries');
}

let nhostGetToken: (() => Promise<string | null>) | null = null;

export function setNhostGetToken(getToken: () => Promise<string | null>) {
  nhostGetToken = getToken;
}

async function getAuthToken(): Promise<string | null> {
  try {
    if (nhostGetToken) {
      return await nhostGetToken();
    }
    return null;
  } catch {
    return null;
  }
}

export const historyService = {
  /**
   * Save a history item
   * Uses backend API when available, falls back to localStorage
   */
  async save(type: string, name: string, data: any, status: 'draft' | 'completed' = 'completed'): Promise<string> {
    try {
      const token = await getAuthToken();
      
      if (token) {
        const response = await fetchWithRetry('/api/campaign-history', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ type, name, data, status })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          console.warn('Failed to save to database:', errorData);
          throw new Error(errorData.error || 'Failed to save');
        }

        const result = await response.json();
        console.log('Saved to database:', result.data?.id);
        setDataSource('live');
        return result.data?.id || crypto.randomUUID();
      } else {
        throw new Error('No auth token available');
      }
    } catch (error) {
      console.log('Falling back to localStorage storage');
      setDataSource('cached');
      await localStorageHistory.save(type, name, data, status);
      const items = localStorageHistory.getAll();
      const savedItem = items[items.length - 1];
      console.log('Saved to localStorage:', savedItem?.id);
      return savedItem?.id || crypto.randomUUID();
    }
  },

  /**
   * Update an existing item (for drafts)
   */
  async update(id: string, data: any, name?: string): Promise<void> {
    try {
      const token = await getAuthToken();
      
      if (token) {
        const updatePayload: any = { data };
        if (name) {
          updatePayload.name = name;
        }
        
        const response = await fetchWithRetry(`/api/campaign-history/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(updatePayload)
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          console.warn('Failed to update in database:', errorData);
          throw new Error(errorData.error || 'Failed to update');
        }

        console.log('Updated in database:', id);
        return;
      } else {
        throw new Error('No auth token available');
      }
    } catch (error) {
      console.log('Falling back to localStorage update');
      await localStorageHistory.update(id, data, name);
    }
  },

  /**
   * Mark a draft as completed
   */
  async markAsCompleted(id: string): Promise<void> {
    try {
      const token = await getAuthToken();
      
      if (token) {
        const response = await fetchWithRetry(`/api/campaign-history/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ status: 'completed' })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          console.warn('Failed to mark as completed in database:', errorData);
          throw new Error(errorData.error || 'Failed to update status');
        }

        console.log('Marked as completed in database:', id);
        return;
      } else {
        throw new Error('No auth token available');
      }
    } catch (error) {
      console.log('Falling back to localStorage completion');
      await localStorageHistory.markAsCompleted(id);
    }
  },

  /**
   * Get all history items for current user
   * Uses backend API when available, falls back to localStorage
   */
  async getAll(): Promise<HistoryItem[]> {
    setDataSource('loading');
    try {
      const token = await getAuthToken();
      
      if (token) {
        const response = await fetchWithRetry('/api/campaign-history', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        // Handle rate limiting - fall back to localStorage without logging as error
        if (response.status === 429) {
          console.log('Rate limited, using localStorage');
          setDataSource('cached');
          return localStorageHistory.getAll();
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          console.warn('Failed to load from database:', errorData);
          throw new Error(errorData.error || 'Failed to load');
        }

        const result = await response.json();
        
        // Transform database records to HistoryItem format
        const items: HistoryItem[] = (result.data || []).map((record: any) => ({
          id: record.id,
          type: record.type || 'campaign',
          name: record.name || 'Unnamed',
          data: typeof record.data === 'string' ? JSON.parse(record.data) : (record.data || {}),
          timestamp: record.created_at,
          status: record.status || 'completed',
          lastModified: record.updated_at,
        }));

        console.log(`Loaded ${items.length} items from database for current user`);
        setDataSource('live');
        
        // Return only user's campaigns from database - don't merge localStorage
        // localStorage is only used as fallback when not authenticated
        return items;
      } else {
        throw new Error('No auth token available');
      }
    } catch (error) {
      console.log('Falling back to localStorage retrieval');
      setDataSource('cached');
      try {
        const localItems = localStorageHistory.getAll();
        return localItems.map((item: any) => ({
          id: item.id || crypto.randomUUID(),
          type: item.type || 'unknown',
          name: item.name || 'Unnamed',
          data: item.data || {},
          timestamp: item.timestamp || new Date().toISOString(),
          status: item.status || 'completed',
          lastModified: item.lastModified,
        }));
      } catch (localError) {
        console.error('Failed to load from localStorage:', localError);
        return [];
      }
    }
  },

  /**
   * Get history (alias for getAll that returns the expected format)
   */
  async getHistory(): Promise<{ history: HistoryItem[] }> {
    const items = await this.getAll();
    return { history: items };
  },

  /**
   * Delete a history item
   */
  async delete(id: string): Promise<void> {
    try {
      const token = await getAuthToken();
      
      if (token) {
        const response = await fetchWithRetry(`/api/campaign-history/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          console.warn('Failed to delete from database:', errorData);
          throw new Error(errorData.error || 'Failed to delete');
        }

        console.log('Deleted from database:', id);
        return;
      } else {
        throw new Error('No auth token available');
      }
    } catch (error) {
      console.log('Falling back to localStorage deletion');
      await localStorageHistory.delete(id);
    }
  },

  /**
   * Delete history (alias for delete)
   */
  async deleteHistory(id: string): Promise<void> {
    return this.delete(id);
  },

  /**
   * Get items by type for current user
   */
  async getByType(type: string): Promise<HistoryItem[]> {
    const items = await this.getAll();
    return items.filter(item => item.type === type);
  }
};
