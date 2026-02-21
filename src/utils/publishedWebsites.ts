import { getSessionTokenSync } from './auth';

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

async function apiRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
  const token = getSessionTokenSync();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`/api/published-websites${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(errorData.error || `Request failed with status ${response.status}`);
  }

  return response.json();
}

export async function getUserPublishedWebsites(userId: string): Promise<PublishedWebsite[]> {
  try {
    const data = await apiRequest(`?userId=${userId}`);
    return data?.published_websites || [];
  } catch (error) {
    console.error('Error in getUserPublishedWebsites:', error);
    throw error;
  }
}

export async function savePublishedWebsite(
  userId: string,
  website: PublishedWebsiteInput
): Promise<PublishedWebsite> {
  try {
    const data = await apiRequest('', {
      method: 'POST',
      body: JSON.stringify({
        user_id: userId,
        name: website.name,
        template_id: website.template_id,
        template_data: website.template_data,
        vercel_deployment_id: website.vercel_deployment_id,
        vercel_url: website.vercel_url,
        vercel_project_id: website.vercel_project_id,
        status: website.status,
      }),
    });

    return data.published_website;
  } catch (error) {
    console.error('Error in savePublishedWebsite:', error);
    throw error;
  }
}

export async function updatePublishedWebsite(
  id: string,
  updates: Partial<PublishedWebsiteInput>
): Promise<PublishedWebsite> {
  try {
    const data = await apiRequest(`/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        ...updates,
        updated_at: new Date().toISOString(),
      }),
    });

    return data.published_website;
  } catch (error) {
    console.error('Error in updatePublishedWebsite:', error);
    throw error;
  }
}

export async function updatePublishedWebsiteStatus(
  id: string,
  status: 'deploying' | 'ready' | 'error'
): Promise<PublishedWebsite> {
  return updatePublishedWebsite(id, { status });
}

export async function deletePublishedWebsite(id: string): Promise<void> {
  try {
    await apiRequest(`/${id}`, {
      method: 'DELETE',
    });
  } catch (error) {
    console.error('Error in deletePublishedWebsite:', error);
    throw error;
  }
}
