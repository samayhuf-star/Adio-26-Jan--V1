/**
 * Saved Sites Service
 * Handles CRUD operations for saved sites with workspace isolation
 */

import { nhost } from '../lib/nhost';
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
  const context = await getCurrentWorkspaceContext();
  if (!context) {
    throw new Error('No workspace context available');
  }

  const { data, error } = await nhost.graphql.request(`
    query GetSavedSites($userId: uuid!, $workspaceId: uuid) {
      saved_sites(
        where: { 
          user_id: { _eq: $userId }
          workspace_id: { _eq: $workspaceId }
        }
        order_by: { updated_at: desc }
      ) {
        id
        user_id
        workspace_id
        template_id
        slug
        title
        html
        assets
        metadata
        status
        vercel
        created_at
        updated_at
      }
    }
  `, { userId: context.userId, workspaceId: context.workspaceId });

  if (error) throw error;
  return data?.saved_sites || [];
}

/**
 * Get a single saved site by ID with workspace validation
 */
export async function getSavedSite(id: string): Promise<SavedSite | null> {
  const context = await getCurrentWorkspaceContext();
  if (!context) {
    throw new Error('No workspace context available');
  }

  const { data, error } = await nhost.graphql.request(`
    query GetSavedSite($id: uuid!, $userId: uuid!) {
      saved_sites_by_pk(id: $id) {
        id
        user_id
        workspace_id
        template_id
        slug
        title
        html
        assets
        metadata
        status
        vercel
        created_at
        updated_at
      }
    }
  `, { id, userId: context.userId });

  if (error) {
    console.error('Error fetching saved site:', error);
    return null;
  }

  const site = data?.saved_sites_by_pk;
  if (!site || site.user_id !== context.userId) {
    return null;
  }

  // Validate workspace access if site has workspace_id
  if (site.workspace_id && site.workspace_id !== context.workspaceId) {
    logSecurityViolation('access_saved_site', site.workspace_id, context.userId, { siteId: id });
    return null;
  }

  return site;
}

/**
 * Get saved site by slug with workspace validation
 */
export async function getSavedSiteBySlug(slug: string): Promise<SavedSite | null> {
  const context = await getCurrentWorkspaceContext();
  if (!context) {
    throw new Error('No workspace context available');
  }

  const { data, error } = await nhost.graphql.request(`
    query GetSavedSiteBySlug($slug: String!, $userId: uuid!) {
      saved_sites(
        where: { 
          slug: { _eq: $slug }
          user_id: { _eq: $userId }
        }
        limit: 1
      ) {
        id
        user_id
        workspace_id
        template_id
        slug
        title
        html
        assets
        metadata
        status
        vercel
        created_at
        updated_at
      }
    }
  `, { slug, userId: context.userId });

  if (error) {
    console.error('Error fetching saved site by slug:', error);
    return null;
  }

  const site = data?.saved_sites?.[0];
  if (!site) {
    return null;
  }

  // Validate workspace access if site has workspace_id
  if (site.workspace_id && site.workspace_id !== context.workspaceId) {
    logSecurityViolation('access_saved_site_by_slug', site.workspace_id, context.userId, { slug });
    return null;
  }

  return site;
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

  const { data, error } = await nhost.graphql.request(`
    mutation CreateSavedSite($site: saved_sites_insert_input!) {
      insert_saved_sites_one(object: $site) {
        id
        user_id
        workspace_id
        template_id
        slug
        title
        html
        assets
        metadata
        status
        vercel
        created_at
        updated_at
      }
    }
  `, {
    site: {
      user_id: context.userId,
      workspace_id: context.workspaceId,
      template_id: templateId,
      slug,
      title,
      html,
      assets,
      metadata,
      status: 'draft',
    }
  });

  if (error) throw error;

  const site = data?.insert_saved_sites_one;
  if (!site) throw new Error('Failed to create saved site');

  // Log activity with workspace context
  await logActivity(site.id, 'edit', { templateId });

  return site;
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

  const { data, error } = await nhost.graphql.request(`
    mutation UpdateSavedSite($id: uuid!, $updates: saved_sites_set_input!) {
      update_saved_sites_by_pk(pk_columns: { id: $id }, _set: $updates) {
        id
        user_id
        workspace_id
        template_id
        slug
        title
        html
        assets
        metadata
        status
        vercel
        created_at
        updated_at
      }
    }
  `, { id, updates });

  if (error) throw error;

  const site = data?.update_saved_sites_by_pk;
  if (!site) throw new Error('Failed to update saved site');

  // Log activity if HTML was updated
  if (updates.html) {
    await logActivity(id, 'edit', {});
  }

  return site;
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

  const { error } = await nhost.graphql.request(`
    mutation DeleteSavedSite($id: uuid!) {
      delete_saved_sites_by_pk(id: $id) {
        id
      }
    }
  `, { id });

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

  const { data, error } = await nhost.graphql.request(`
    mutation DuplicateSavedSite($site: saved_sites_insert_input!) {
      insert_saved_sites_one(object: $site) {
        id
        user_id
        workspace_id
        template_id
        slug
        title
        html
        assets
        metadata
        status
        vercel
        created_at
        updated_at
      }
    }
  `, {
    site: {
      user_id: context.userId,
      workspace_id: context.workspaceId,
      template_id: original.template_id,
      slug: newSlug,
      title: newTitle,
      html: original.html,
      assets: original.assets,
      metadata: original.metadata,
      status: 'draft',
    }
  });

  if (error) throw error;

  const site = data?.insert_saved_sites_one;
  if (!site) throw new Error('Failed to duplicate saved site');

  // Log activity
  await logActivity(site.id, 'duplicate', { originalId: id });

  return site;
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

  await nhost.graphql.request(`
    mutation LogActivity($activity: activity_log_insert_input!) {
      insert_activity_log_one(object: $activity) {
        id
      }
    }
  `, {
    activity: {
      user_id: context.userId,
      workspace_id: context.workspaceId,
      saved_site_id: savedSiteId,
      action,
      metadata,
    }
  });
}

/**
 * Get activity log for user in current workspace
 */
export async function getActivityLog(limit: number = 50): Promise<ActivityLog[]> {
  const context = await getCurrentWorkspaceContext();
  if (!context) {
    throw new Error('No workspace context available');
  }

  const { data, error } = await nhost.graphql.request(`
    query GetActivityLog($userId: uuid!, $workspaceId: uuid, $limit: Int!) {
      activity_log(
        where: { 
          user_id: { _eq: $userId }
          workspace_id: { _eq: $workspaceId }
        }
        order_by: { created_at: desc }
        limit: $limit
      ) {
        id
        user_id
        workspace_id
        saved_site_id
        action
        metadata
        created_at
      }
    }
  `, { userId: context.userId, workspaceId: context.workspaceId, limit });

  if (error) throw error;
  return data?.activity_log || [];
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

  const { data, error } = await nhost.graphql.request(`
    query GetSavedSiteActivity($savedSiteId: uuid!, $userId: uuid!) {
      activity_log(
        where: { 
          saved_site_id: { _eq: $savedSiteId }
          user_id: { _eq: $userId }
        }
        order_by: { created_at: desc }
      ) {
        id
        user_id
        workspace_id
        saved_site_id
        action
        metadata
        created_at
      }
    }
  `, { savedSiteId, userId: context.userId });

  if (error) throw error;
  return data?.activity_log || [];
}

