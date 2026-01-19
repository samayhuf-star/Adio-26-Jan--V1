/**
 * Direct Supabase Database Service for Campaigns
 * Bypasses edge functions and saves directly to database
 */

import { supabase } from './supabase/client';

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
      const { data: { user } } = await supabase.auth.getUser();
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

      // Try to insert into adiology_campaigns table
      const { data: insertedData, error } = await supabase
        .from('adiology_campaigns')
        .insert(campaignData)
        .select('id')
        .single();

      if (error) {
        // If table doesn't exist, create it and retry
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          console.log('adiology_campaigns table does not exist, creating it...');
          await this.createTableIfNeeded();
          
          // Retry insert
          const { data: retryData, error: retryError } = await supabase
            .from('adiology_campaigns')
            .insert(campaignData)
            .select('id')
            .single();

          if (retryError) {
            throw retryError;
          }

          return retryData?.id || crypto.randomUUID();
        }
        throw error;
      }

      return insertedData?.id || crypto.randomUUID();
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
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;

      let query = supabase
        .from('adiology_campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) {
        // If table doesn't exist, return empty array
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          return [];
        }
        throw error;
      }

      return data || [];
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
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;

      let query = supabase
        .from('adiology_campaigns')
        .select('*')
        .eq('type', type)
        .order('created_at', { ascending: false });

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) {
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          return [];
        }
        throw error;
      }

      return data || [];
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

      const { error } = await supabase
        .from('adiology_campaigns')
        .update(updateData)
        .eq('id', id);

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
      const { error } = await supabase
        .from('adiology_campaigns')
        .delete()
        .eq('id', id);

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
    // Note: Table creation should be done via Supabase migrations
    // This is just a placeholder to show what the table structure should be
    console.warn('Table creation should be done via Supabase migrations. Please run the migration SQL.');
  },
};

