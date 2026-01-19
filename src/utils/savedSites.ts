/**
 * Saved Sites Service
 * Handles CRUD operations for saved sites with workspace isolation
 */

import { supabase } from './supabase';
import { createWorkspaceQuery, getCurrentWorkspaceContext, logSecurityViolation } from './workspace-api';

export interface SavedSite {
  id: string;
  user_id: string;
  workspace_id?: string; // Added for workspace isolation
  template_id: string | null;
  slug: string;
  title: string;
  html: string;
  assets: Array<{ path: string; content: string; encoding?: string }>;
  metadata: {
    theme?: string;
    accent?: string;
    [key: string]: any;
  };
  status: 'draft' | 'published';
  vercel: {
    projectId?: string;
    deploymentId?: string;
    url?: string;
  };
  created_at: string;
  updated_at: string;
}

export interface ActivityLog {
  id: string;
  user_id: string;
  workspace_id?: string; // Added for workspace isolation
  saved_site_id: string | null;
  action: 'edit' | 'download' | 'publish' | 'duplicate' | 'delete' | 'domain_connect';
  metadata: Record<string, any>;
  created_at: string;
}

/**
 * Get all saved sites for current user in current workspace
 */
export async function getSavedSites(): Promise<SavedSite[]> {
  const workspaceQuery = await createWorkspaceQuery('saved_sites');
  if (!workspaceQuery) {
    throw new Error('No workspace context available');
  }

  const { data, error } = await workspaceQuery
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Get a single saved site by ID with workspace validation
 */
export async function getSavedSite(id: string): Promise<SavedSite | null> {
  const context = await getCurrentWorkspaceContext();
  if (!context) {
    throw new Error('No workspace context available');
  }

  const { data, error } = await supabase
    .from('saved_sites')
    .select('*')
    .eq('id', id)
    .eq('user_id', context.userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }

  // Validate workspace access if site has workspace_id
  if (data.workspace_id && data.workspace_id !== context.workspaceId) {
    logSecurityViolation('access_saved_site', data.workspace_id, context.userId, { siteId: id });
    return null;
  }

  return data;
}

/**
 * Get saved site by slug with workspace validation
 */
export async function getSavedSiteBySlug(slug: string): Promise<SavedSite | null> {
  const context = await getCurrentWorkspaceContext();
  if (!context) {
    throw new Error('No workspace context available');
  }

  const { data, error } = await supabase
    .from('saved_sites')
    .select('*')
    .eq('slug', slug)
    .eq('user_id', context.userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  // Validate workspace access if site has workspace_id
  if (data.workspace_id && data.workspace_id !== context.workspaceId) {
    logSecurityViolation('access_saved_site_by_slug', data.workspace_id, context.userId, { slug });
    return null;
  }

  return data;
}

/**
 * Create a new saved site from template with workspace context
 */
export async function createSavedSiteFromTemplate(
  templateId: string,
  slug: string,
  title: string,
  html: string,
  assets: Array<{ path: string; content: string; encoding?: string }> = [],
  metadata: Record<string, any> = {}
): Promise<SavedSite> {
  const context = await getCurrentWorkspaceContext();
  if (!context) {
    throw new Error('No workspace context available');
  }

  const { data, error } = await supabase
    .from('saved_sites')
    .insert({
      user_id: context.userId,
      workspace_id: context.workspaceId, // Add workspace context
      template_id: templateId,
      slug,
      title,
      html,
      assets,
      metadata,
      status: 'draft',
    })
    .select()
    .single();

  if (error) throw error;

  // Log activity with workspace context
  await logActivity(data.id, 'edit', { templateId });

  return data;
}

/**
 * Update saved site with workspace validation
 */
export async function updateSavedSite(
  id: string,
  updates: Partial<Pick<SavedSite, 'title' | 'html' | 'assets' | 'metadata' | 'status' | 'vercel' | 'slug'>>
): Promise<SavedSite> {
  const context = await getCurrentWorkspaceContext();
  if (!context) {
    throw new Error('No workspace context available');
  }

  // First verify the site belongs to current workspace
  const existingSite = await getSavedSite(id);
  if (!existingSite) {
    throw new Error('Saved site not found or access denied');
  }

  const { data, error } = await supabase
    .from('saved_sites')
    .update(updates)
    .eq('id', id)
    .eq('user_id', context.userId)
    .select()
    .single();

  if (error) throw error;

  // Log activity if HTML was updated
  if (updates.html) {
    await logActivity(id, 'edit', {});
  }

  return data;
}

/**
 * Delete saved site with workspace validation
 */
export async function deleteSavedSite(id: string): Promise<void> {
  const context = await getCurrentWorkspaceContext();
  if (!context) {
    throw new Error('No workspace context available');
  }

  // First verify the site belongs to current workspace
  const existingSite = await getSavedSite(id);
  if (!existingSite) {
    throw new Error('Saved site not found or access denied');
  }

  const { error } = await supabase
    .from('saved_sites')
    .delete()
    .eq('id', id)
    .eq('user_id', context.userId);

  if (error) throw error;

  // Log activity
  await logActivity(id, 'delete', {});
}

/**
 * Duplicate saved site with workspace context
 */
export async function duplicateSavedSite(id: string, newSlug: string, newTitle: string): Promise<SavedSite> {
  const original = await getSavedSite(id);
  if (!original) throw new Error('Saved site not found or access denied');

  const context = await getCurrentWorkspaceContext();
  if (!context) {
    throw new Error('No workspace context available');
  }

  const { data, error } = await supabase
    .from('saved_sites')
    .insert({
      user_id: context.userId,
      workspace_id: context.workspaceId, // Add workspace context
      template_id: original.template_id,
      slug: newSlug,
      title: newTitle,
      html: original.html,
      assets: original.assets,
      metadata: original.metadata,
      status: 'draft',
    })
    .select()
    .single();

  if (error) throw error;

  // Log activity
  await logActivity(data.id, 'duplicate', { originalId: id });

  return data;
}

/**
 * Log activity with workspace context
 */
export async function logActivity(
  savedSiteId: string | null,
  action: ActivityLog['action'],
  metadata: Record<string, any> = {}
): Promise<void> {
  const context = await getCurrentWorkspaceContext();
  if (!context) return; // Silently fail if not authenticated

  await supabase.from('activity_log').insert({
    user_id: context.userId,
    workspace_id: context.workspaceId, // Add workspace context
    saved_site_id: savedSiteId,
    action,
    metadata,
  });
}

/**
 * Get activity log for user in current workspace
 */
export async function getActivityLog(limit: number = 50): Promise<ActivityLog[]> {
  const workspaceQuery = await createWorkspaceQuery('activity_log');
  if (!workspaceQuery) {
    throw new Error('No workspace context available');
  }

  const { data, error } = await workspaceQuery
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

/**
 * Get activity log for a specific saved site with workspace validation
 */
export async function getSavedSiteActivity(savedSiteId: string): Promise<ActivityLog[]> {
  const context = await getCurrentWorkspaceContext();
  if (!context) {
    throw new Error('No workspace context available');
  }

  // First verify the site belongs to current workspace
  const site = await getSavedSite(savedSiteId);
  if (!site) {
    throw new Error('Saved site not found or access denied');
  }

  const { data, error } = await supabase
    .from('activity_log')
    .select('*')
    .eq('saved_site_id', savedSiteId)
    .eq('user_id', context.userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

