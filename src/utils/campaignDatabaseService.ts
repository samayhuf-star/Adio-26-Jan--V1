import { getCurrentUser, getSessionTokenSync } from './auth';

export interface CampaignDatabaseItem {
  id?: string;
  user_id?: string;
  type: string;
  name: string;
  data: any;
  status: 'draft' | 'completed';
  created_at?: string;
  updated_at?: string;
}

async function apiRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
  const token = getSessionTokenSync();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`/api/campaigns${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(errorData.error || `Request failed with status ${response.status}`);
  }

  return response.json();
}

export const campaignDatabaseService = {
  async save(type: string, name: string, data: any, status: 'draft' | 'completed' = 'completed'): Promise<string> {
    try {
      const user = getCurrentUser();
      const userId = user?.id || null;

      const campaignData: CampaignDatabaseItem = {
        type,
        name,
        data,
        status,
        user_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const result = await apiRequest('', {
        method: 'POST',
        body: JSON.stringify(campaignData),
      });

      return result?.id || crypto.randomUUID();
    } catch (error: any) {
      console.error('Database save error:', error);
      return crypto.randomUUID();
    }
  },

  async getAll(): Promise<CampaignDatabaseItem[]> {
    try {
      const user = getCurrentUser();
      const userId = user?.id;

      const data = await apiRequest(`?userId=${userId}`);
      return data?.campaigns || [];
    } catch (error: any) {
      console.error('Database getAll error:', error);
      return [];
    }
  },

  async getByType(type: string): Promise<CampaignDatabaseItem[]> {
    try {
      const user = getCurrentUser();
      const userId = user?.id;

      const data = await apiRequest(`?userId=${userId}&type=${type}`);
      return data?.campaigns || [];
    } catch (error: any) {
      console.error('Database getByType error:', error);
      return [];
    }
  },

  async update(id: string, data: any, name?: string): Promise<void> {
    try {
      const updateData: any = {
        data,
        updated_at: new Date().toISOString(),
      };

      if (name) {
        updateData.name = name;
      }

      await apiRequest(`/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });
    } catch (error: any) {
      console.error('Database update error:', error);
      throw error;
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await apiRequest(`/${id}`, {
        method: 'DELETE',
      });
    } catch (error: any) {
      console.error('Database delete error:', error);
      throw error;
    }
  },

  async createTableIfNeeded(): Promise<void> {
    console.warn('Table creation should be done via migrations. Please run the migration SQL.');
  },
};
