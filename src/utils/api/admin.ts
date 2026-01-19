import { projectId } from '../supabase/info';
import { supabase } from '../supabase/client';

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-6757d0ca`;

// Get auth token for API calls
async function getAuthToken(): Promise<string | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
}

// Helper to make authenticated requests
async function authenticatedFetch(endpoint: string, options: RequestInit = {}) {
  const token = await getAuthToken();
  
  if (!token) {
    throw new Error('Not authenticated. Please log in.');
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  // Handle non-JSON responses
  const responseText = await response.text();
  let errorData;
  
  try {
    errorData = JSON.parse(responseText);
  } catch (e) {
    // Not JSON - might be HTML error page
    if (!response.ok) {
      throw new Error(`Request failed: ${response.status} ${response.statusText}`);
    }
  }

  if (!response.ok) {
    const errorMessage = errorData?.error || errorData?.message || `Request failed: ${response.status} ${response.statusText}`;
    
    // Check for specific error types
    if (response.status === 401) {
      throw new Error(errorMessage || 'Unauthorized. Please check your credentials and try again.');
    } else if (response.status === 403) {
      throw new Error(errorMessage || 'Access denied. Superadmin role required.');
    } else if (response.status === 404) {
      throw new Error(errorMessage || 'Endpoint not found. Please ensure the Edge Function is deployed.');
    } else if (response.status === 500) {
      throw new Error(errorMessage || 'Server error. Please check backend logs.');
    }
    
    throw new Error(errorMessage);
  }

  // Parse response if it's JSON
  try {
    return JSON.parse(responseText);
  } catch (e) {
    return responseText;
  }
}

// Super Admin API functions
export const adminApi = {
  // Users
  async getUsers(params?: { search?: string; page?: number; limit?: number }) {
    try {
      const queryParams = new URLSearchParams();
      if (params?.search) queryParams.append('search', params.search);
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());

      return await authenticatedFetch(`/admin/users?${queryParams}`);
    } catch (error) {
      // Fallback: Note that admin functions require server-side implementation
      console.log('API unavailable - admin functions require backend implementation');
      // Return empty result since admin functions can't be called client-side
      return {
        users: [],
        pagination: { total: 0, totalPages: 0 },
      };
    }
  },

  async getUserById(id: string) {
    return authenticatedFetch(`/admin/users/${id}`);
  },

  async updateUser(id: string, data: any) {
    try {
      return await authenticatedFetch(`/admin/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    } catch (error) {
      // Fallback: Admin functions require server-side implementation
      console.error('Admin API unavailable - updateUser requires backend');
      throw new Error('Admin functions require backend implementation');
    }
  },

  async deleteUser(id: string) {
    try {
      // Try API first, fallback to direct Supabase
      return await authenticatedFetch(`/admin/users/${id}`, {
        method: 'DELETE',
      });
    } catch (error) {
      // Fallback: Admin functions require server-side implementation
      console.error('Admin API unavailable - deleteUser requires backend');
      throw new Error('Admin functions require backend implementation');
    }
  },

  async createUser(data: { email: string; password: string; full_name?: string; subscription_plan?: string }) {
    try {
      console.log('Creating user via edge function:', data.email);
      const result = await authenticatedFetch('/admin/users', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      console.log('User created successfully:', result);
      return result;
    } catch (error: any) {
      console.error('Error creating user:', error);
      const errorMessage = error?.message || 'Failed to create user. Please check your connection and try again.';
      throw new Error(errorMessage);
    }
  },

  async resetPassword(userId: string) {
    try {
      return await authenticatedFetch(`/admin/users/${userId}/reset-password`, {
        method: 'POST',
      });
    } catch (error) {
      // Fallback: Admin functions require server-side implementation
      console.error('Admin API unavailable - resetPassword requires backend');
      throw new Error('Admin functions require backend implementation');
    }
  },

  // Overview
  async getOverview() {
    try {
      return await authenticatedFetch('/admin/overview');
    } catch (error) {
      // Fallback: Return default values since admin functions require backend
      console.log('API unavailable - returning default overview stats');
      return {
        totalUsers: 0,
        activeSubscriptions: 0,
        recentSignups: 0,
        systemHealth: 'unknown',
      };
    }
  },

  // Audit Logs
  async getAuditLogs(params?: { page?: number; limit?: number; action?: string; userId?: string }) {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.action) queryParams.append('action', params.action);
      if (params?.userId) queryParams.append('userId', params.userId);

      return await authenticatedFetch(`/admin/audit-logs?${queryParams}`);
    } catch (error) {
      // Fallback: Return empty logs
      console.log('API unavailable, returning empty audit logs');
      return { logs: [], pagination: { total: 0, totalPages: 0 } };
    }
  },

  // Billing Stats
  async getBillingStats() {
    return authenticatedFetch('/admin/billing/stats');
  },

  // Usage Metrics
  async getUsageMetrics(params?: { metricType?: string; period?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.metricType) queryParams.append('metricType', params.metricType);
    if (params?.period) queryParams.append('period', params.period);

    return authenticatedFetch(`/admin/usage?${queryParams}`);
  },

  // System Health
  async getSystemHealth() {
    return authenticatedFetch('/admin/health');
  },

  // Feature Flags
  async getFeatureFlags() {
    return authenticatedFetch('/admin/feature-flags');
  },

  async createFeatureFlag(data: any) {
    return authenticatedFetch('/admin/feature-flags', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateFeatureFlag(id: string, data: any) {
    return authenticatedFetch(`/admin/feature-flags/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Support Tickets
  async getSupportTickets(params?: { page?: number; limit?: number; status?: string; priority?: string }) {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.status) queryParams.append('status', params.status);
      if (params?.priority) queryParams.append('priority', params.priority);

      return await authenticatedFetch(`/admin/support/tickets?${queryParams}`);
    } catch (error) {
      console.error('Error fetching support tickets:', error);
      return { tickets: [], pagination: { total: 0, totalPages: 0 } };
    }
  },

  async updateSupportTicket(id: string, data: any) {
    return authenticatedFetch(`/admin/support/tickets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Announcements
  async getAnnouncements() {
    try {
      return await authenticatedFetch('/admin/announcements');
    } catch (error) {
      console.error('Error fetching announcements:', error);
      return { announcements: [] };
    }
  },

  async createAnnouncement(data: any) {
    return authenticatedFetch('/admin/announcements', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateAnnouncement(id: string, data: any) {
    return authenticatedFetch(`/admin/announcements/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteAnnouncement(id: string) {
    return authenticatedFetch(`/admin/announcements/${id}`, {
      method: 'DELETE',
    });
  },

  // Email Templates
  async getEmailTemplates() {
    try {
      return await authenticatedFetch('/admin/email-templates');
    } catch (error) {
      console.error('Error fetching email templates:', error);
      return { templates: [] };
    }
  },

  async createEmailTemplate(data: any) {
    return authenticatedFetch('/admin/email-templates', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateEmailTemplate(id: string, data: any) {
    return authenticatedFetch(`/admin/email-templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Configuration
  async getConfig(category?: string) {
    try {
      const queryParams = new URLSearchParams();
      if (category) queryParams.append('category', category);

      return await authenticatedFetch(`/admin/config?${queryParams}`);
    } catch (error) {
      console.error('Error fetching config:', error);
      return { settings: [] };
    }
  },

  async updateConfig(key: string, data: any) {
    return authenticatedFetch(`/admin/config/${key}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Pricing Plans
  async getPricingPlans() {
    try {
      return await authenticatedFetch('/admin/pricing-plans');
    } catch (error) {
      console.error('Error fetching pricing plans:', error);
      return { plans: [] };
    }
  },

  async updatePricingPlan(id: string, data: any) {
    return authenticatedFetch(`/admin/pricing-plans/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
};

