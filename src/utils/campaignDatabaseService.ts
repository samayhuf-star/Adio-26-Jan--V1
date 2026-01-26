/**
 * Direct Nhost Database Service for Campaigns
 * Uses GraphQL to save campaigns to database
 */

import { nhost } from '../lib/nhost';

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

/**
 * Save campaign directly to Supabase database
 * Uses 'adiology_campaigns' table
 */
export const campaignDatabaseService = {
  /**
   * Save a campaign to database
   */
  async save(type: string, name: string, data: any, status: 'draft' | 'completed' = 'completed'): Promise<string> {
    try {
      // Get current user if available
      const user = nhost.auth.getUser();
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

      // Insert into adiology_campaigns table using GraphQL
      const { data: insertedData, error } = await nhost.graphql.request(`
        mutation InsertCampaign($campaign: adiology_campaigns_insert_input!) {
          insert_adiology_campaigns_one(object: $campaign) {
            id
          }
        }
      `, { campaign: campaignData });

      if (error) {
        console.error('Database save error:', error);
        // Return a UUID anyway so the frontend can continue
        return crypto.randomUUID();
      }

      return insertedData?.insert_adiology_campaigns_one?.id || crypto.randomUUID();
    } catch (error: any) {
      console.error('Database save error:', error);
      // Return a UUID anyway so the frontend can continue
      return crypto.randomUUID();
    }
  },

  /**
   * Get all campaigns for current user
   */
  async getAll(): Promise<CampaignDatabaseItem[]> {
    try {
      const user = nhost.auth.getUser();
      const userId = user?.id;

      const { data, error } = await nhost.graphql.request(`
        query GetAllCampaigns($userId: uuid) {
          adiology_campaigns(
            where: { user_id: { _eq: $userId } }
            order_by: { created_at: desc }
          ) {
            id
            user_id
            type
            name
            data
            status
            created_at
            updated_at
          }
        }
      `, { userId });

      if (error) {
        console.error('Database getAll error:', error);
        return [];
      }

      return data?.adiology_campaigns || [];
    } catch (error: any) {
      console.error('Database getAll error:', error);
      return [];
    }
  },

  /**
   * Get campaigns by type
   */
  async getByType(type: string): Promise<CampaignDatabaseItem[]> {
    try {
      const user = nhost.auth.getUser();
      const userId = user?.id;

      const { data, error } = await nhost.graphql.request(`
        query GetCampaignsByType($type: String!, $userId: uuid) {
          adiology_campaigns(
            where: { 
              type: { _eq: $type }
              user_id: { _eq: $userId }
            }
            order_by: { created_at: desc }
          ) {
            id
            user_id
            type
            name
            data
            status
            created_at
            updated_at
          }
        }
      `, { type, userId });

      if (error) {
        console.error('Database getByType error:', error);
        return [];
      }

      return data?.adiology_campaigns || [];
    } catch (error: any) {
      console.error('Database getByType error:', error);
      return [];
    }
  },

  /**
   * Update a campaign
   */
  async update(id: string, data: any, name?: string): Promise<void> {
    try {
      const updateData: any = {
        data,
        updated_at: new Date().toISOString(),
      };

      if (name) {
        updateData.name = name;
      }

      const { error } = await nhost.graphql.request(`
        mutation UpdateCampaign($id: uuid!, $updates: adiology_campaigns_set_input!) {
          update_adiology_campaigns_by_pk(pk_columns: { id: $id }, _set: $updates) {
            id
          }
        }
      `, { id, updates: updateData });

      if (error) {
        throw error;
      }
    } catch (error: any) {
      console.error('Database update error:', error);
      throw error;
    }
  },

  /**
   * Delete a campaign
   */
  async delete(id: string): Promise<void> {
    try {
      const { error } = await nhost.graphql.request(`
        mutation DeleteCampaign($id: uuid!) {
          delete_adiology_campaigns_by_pk(id: $id) {
            id
          }
        }
      `, { id });

      if (error) {
        throw error;
      }
    } catch (error: any) {
      console.error('Database delete error:', error);
      throw error;
    }
  },

  /**
   * Create the adiology_campaigns table if it doesn't exist
   * This is a client-side helper - actual table creation should be done via migrations
   */
  async createTableIfNeeded(): Promise<void> {
    // Note: Table creation should be done via Nhost migrations
    // This is just a placeholder to show what the table structure should be
    console.warn('Table creation should be done via Nhost migrations. Please run the migration SQL.');
  },
};

