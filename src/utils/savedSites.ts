import { getSessionTokenSync } from './auth';
import { getCurrentWorkspaceContext, logSecurityViolation } from './workspace-api';

export interface SavedSite {
  id: string;
  user_id: string;
  workspace_id?: string;
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
  workspace_id?: string;
  saved_site_id: string | null;
  action: 'edit' | 'download' | 'publish' | 'duplicate' | 'delete' | 'domain_connect';
  metadata: Record<string, any>;
  created_at: string;
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

  const response = await fetch(`/api/saved-sites${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(errorData.error || `Request failed with status ${response.status}`);
  }

  return response.json();
}

export async function getSavedSites(): Promise<SavedSite[]> {
  const context = await getCurrentWorkspaceContext();
  if (!context) {
    throw new Error('No workspace context available');
  }

  const params = new URLSearchParams({
    userId: context.userId,
    ...(context.workspaceId ? { workspaceId: context.workspaceId } : {}),
  });

  const data = await apiRequest(`?${params.toString()}`);
  return data?.saved_sites || [];
}

export async function getSavedSite(id: string): Promise<SavedSite | null> {
  const context = await getCurrentWorkspaceContext();
  if (!context) {
    throw new Error('No workspace context available');
  }

  try {
    const data = await apiRequest(`/${id}`);
    const site = data?.saved_site;
    if (!site || site.user_id !== context.userId) {
      return null;
    }

    if (site.workspace_id && site.workspace_id !== context.workspaceId) {
      logSecurityViolation('access_saved_site', site.workspace_id, context.userId, { siteId: id });
      return null;
    }

    return site;
  } catch (error) {
    console.error('Error fetching saved site:', error);
    return null;
  }
}

export async function getSavedSiteBySlug(slug: string): Promise<SavedSite | null> {
  const context = await getCurrentWorkspaceContext();
  if (!context) {
    throw new Error('No workspace context available');
  }

  try {
    const params = new URLSearchParams({ slug, userId: context.userId });
    const data = await apiRequest(`/by-slug?${params.toString()}`);
    const site = data?.saved_site;
    if (!site) {
      return null;
    }

    if (site.workspace_id && site.workspace_id !== context.workspaceId) {
      logSecurityViolation('access_saved_site_by_slug', site.workspace_id, context.userId, { slug });
      return null;
    }

    return site;
  } catch (error) {
    console.error('Error fetching saved site by slug:', error);
    return null;
  }
}

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

  const data = await apiRequest('', {
    method: 'POST',
    body: JSON.stringify({
      user_id: context.userId,
      workspace_id: context.workspaceId,
      template_id: templateId,
      slug,
      title,
      html,
      assets,
      metadata,
      status: 'draft',
    }),
  });

  const site = data?.saved_site;
  if (!site) throw new Error('Failed to create saved site');

  await logActivity(site.id, 'edit', { templateId });

  return site;
}

export async function updateSavedSite(
  id: string,
  updates: Partial<Pick<SavedSite, 'title' | 'html' | 'assets' | 'metadata' | 'status' | 'vercel' | 'slug'>>
): Promise<SavedSite> {
  const context = await getCurrentWorkspaceContext();
  if (!context) {
    throw new Error('No workspace context available');
  }

  const existingSite = await getSavedSite(id);
  if (!existingSite) {
    throw new Error('Saved site not found or access denied');
  }

  const data = await apiRequest(`/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });

  const site = data?.saved_site;
  if (!site) throw new Error('Failed to update saved site');

  if (updates.html) {
    await logActivity(id, 'edit', {});
  }

  return site;
}

export async function deleteSavedSite(id: string): Promise<void> {
  const context = await getCurrentWorkspaceContext();
  if (!context) {
    throw new Error('No workspace context available');
  }

  const existingSite = await getSavedSite(id);
  if (!existingSite) {
    throw new Error('Saved site not found or access denied');
  }

  await apiRequest(`/${id}`, {
    method: 'DELETE',
  });

  await logActivity(id, 'delete', {});
}

export async function duplicateSavedSite(id: string, newSlug: string, newTitle: string): Promise<SavedSite> {
  const original = await getSavedSite(id);
  if (!original) throw new Error('Saved site not found or access denied');

  const context = await getCurrentWorkspaceContext();
  if (!context) {
    throw new Error('No workspace context available');
  }

  const data = await apiRequest('', {
    method: 'POST',
    body: JSON.stringify({
      user_id: context.userId,
      workspace_id: context.workspaceId,
      template_id: original.template_id,
      slug: newSlug,
      title: newTitle,
      html: original.html,
      assets: original.assets,
      metadata: original.metadata,
      status: 'draft',
    }),
  });

  const site = data?.saved_site;
  if (!site) throw new Error('Failed to duplicate saved site');

  await logActivity(site.id, 'duplicate', { originalId: id });

  return site;
}

export async function logActivity(
  savedSiteId: string | null,
  action: ActivityLog['action'],
  metadata: Record<string, any> = {}
): Promise<void> {
  const context = await getCurrentWorkspaceContext();
  if (!context) return;

  try {
    await apiRequest('/activity', {
      method: 'POST',
      body: JSON.stringify({
        user_id: context.userId,
        workspace_id: context.workspaceId,
        saved_site_id: savedSiteId,
        action,
        metadata,
      }),
    });
  } catch (error) {
    console.error('Error logging activity:', error);
  }
}

export async function getActivityLog(limit: number = 50): Promise<ActivityLog[]> {
  const context = await getCurrentWorkspaceContext();
  if (!context) {
    throw new Error('No workspace context available');
  }

  const params = new URLSearchParams({
    userId: context.userId,
    ...(context.workspaceId ? { workspaceId: context.workspaceId } : {}),
    limit: limit.toString(),
  });

  const data = await apiRequest(`/activity?${params.toString()}`);
  return data?.activity_log || [];
}

export async function getSavedSiteActivity(savedSiteId: string): Promise<ActivityLog[]> {
  const context = await getCurrentWorkspaceContext();
  if (!context) {
    throw new Error('No workspace context available');
  }

  const site = await getSavedSite(savedSiteId);
  if (!site) {
    throw new Error('Saved site not found or access denied');
  }

  const params = new URLSearchParams({
    savedSiteId,
    userId: context.userId,
  });

  const data = await apiRequest(`/activity?${params.toString()}`);
  return data?.activity_log || [];
}
