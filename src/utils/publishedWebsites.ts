import { supabase } from "./auth"/client';

export interface PublishedWebsite {
  id: string;
  user_id: string;
  name: string;
  template_id: string;
  template_data: Record<string, any>;
  vercel_deployment_id: string;
  vercel_url: string;
  vercel_project_id: string;
  status: 'deploying' | 'ready' | 'error';
  created_at: string;
  updated_at: string;
}

export interface PublishedWebsiteInput {
  name: string;
  template_id: string;
  template_data: Record<string, any>;
  vercel_deployment_id: string;
  vercel_url: string;
  vercel_project_id: string;
  status: 'deploying' | 'ready' | 'error';
}

/**
 * Get all published websites for a user
 */
export async function getUserPublishedWebsites(userId: string): Promise<PublishedWebsite[]> {
  try {
    const { data, error } = await supabase
      .from('published_websites')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching published websites:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getUserPublishedWebsites:', error);
    throw error;
  }
}

/**
 * Save a new published website
 */
export async function savePublishedWebsite(
  userId: string,
  website: PublishedWebsiteInput
): Promise<PublishedWebsite> {
  try {
    const { data, error } = await supabase
      .from('published_websites')
      .insert({
        user_id: userId,
        name: website.name,
        template_id: website.template_id,
        template_data: website.template_data,
        vercel_deployment_id: website.vercel_deployment_id,
        vercel_url: website.vercel_url,
        vercel_project_id: website.vercel_project_id,
        status: website.status,
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving published website:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in savePublishedWebsite:', error);
    throw error;
  }
}

/**
 * Update a published website
 */
export async function updatePublishedWebsite(
  id: string,
  updates: Partial<PublishedWebsiteInput>
): Promise<PublishedWebsite> {
  try {
    const { data, error } = await supabase
      .from('published_websites')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating published website:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in updatePublishedWebsite:', error);
    throw error;
  }
}

/**
 * Update only the status of a published website
 */
export async function updatePublishedWebsiteStatus(
  id: string,
  status: 'deploying' | 'ready' | 'error'
): Promise<PublishedWebsite> {
  return updatePublishedWebsite(id, { status });
}

/**
 * Delete a published website
 */
export async function deletePublishedWebsite(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('published_websites')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting published website:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in deletePublishedWebsite:', error);
    throw error;
  }
}