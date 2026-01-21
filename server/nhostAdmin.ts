/**
 * Nhost Admin Client
 * Uses Nhost admin secret to make GraphQL queries with admin privileges
 */

interface NhostConfig {
  subdomain?: string;
  region?: string;
  adminSecret: string;
}

class NhostAdminClient {
  private baseUrl: string;
  private authUrl: string;
  private adminSecret: string;

  constructor() {
    const subdomain = process.env.NHOST_SUBDOMAIN || process.env.NHOST_PROJECT_ID;
    const region = process.env.NHOST_REGION || 'eu-central-1';
    const adminSecret = process.env.NHOST_ADMIN_SECRET || process.env.ADMIN_SECRET_KEY || '';

    if (!subdomain) {
      console.warn('[Nhost Admin] NHOST_SUBDOMAIN or NHOST_PROJECT_ID not set');
    }

    if (!adminSecret) {
      console.warn('[Nhost Admin] NHOST_ADMIN_SECRET or ADMIN_SECRET_KEY not set');
    }

    // Nhost GraphQL endpoint: https://{subdomain}.graphql.{region}.nhost.run/v1
    // Auth endpoint: https://{subdomain}.auth.{region}.nhost.run/v1
    this.baseUrl = subdomain 
      ? `https://${subdomain}.graphql.${region}.nhost.run/v1`
      : '';
    this.authUrl = subdomain
      ? `https://${subdomain}.auth.${region}.nhost.run/v1`
      : '';
    this.adminSecret = adminSecret;
  }

  /**
   * Check if Nhost admin is configured
   */
  isConfigured(): boolean {
    return !!(this.baseUrl && this.adminSecret);
  }

  /**
   * Execute a GraphQL query with admin privileges
   */
  async query<T = any>(query: string, variables?: Record<string, any>): Promise<{ data?: T; errors?: any[] }> {
    if (!this.isConfigured()) {
      throw new Error('Nhost admin not configured. Set NHOST_SUBDOMAIN and NHOST_ADMIN_SECRET.');
    }

    try {
      const response = await fetch(`${this.baseUrl}/graphql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-hasura-admin-secret': this.adminSecret,
        },
        body: JSON.stringify({
          query,
          variables: variables || {},
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Nhost GraphQL error: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      
      if (result.errors && result.errors.length > 0) {
        console.error('[Nhost Admin] GraphQL errors:', result.errors);
        return { errors: result.errors };
      }

      return { data: result.data };
    } catch (error: any) {
      console.error('[Nhost Admin] Query error:', error.message);
      throw error;
    }
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<any | null> {
    const query = `
      query GetUserByEmail($email: String!) {
        users(where: { email: { _eq: $email } }, limit: 1) {
          id
          email
          displayName
          metadata
        }
      }
    `;

    const result = await this.query(query, { email });
    
    if (result.errors) {
      return null;
    }

    return result.data?.users?.[0] || null;
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<any | null> {
    const query = `
      query GetUserById($id: uuid!) {
        users_by_pk(id: $id) {
          id
          email
          displayName
          metadata
        }
      }
    `;

    const result = await this.query(query, { id: userId });
    
    if (result.errors) {
      return null;
    }

    return result.data?.users_by_pk || null;
  }

  /**
   * Verify admin user by email
   */
  async verifyAdminUser(email: string): Promise<{ id: string; email: string; role: string } | null> {
    // Hardcoded super admin emails
    if (email === 'oadiology@gmail.com' || email === 'd@d.com' || email === 'admin@admin.com') {
      return {
        id: 'admin-' + Date.now(),
        email: email,
        role: 'superadmin',
      };
    }

    // Try to get user from Nhost
    const user = await this.getUserByEmail(email);
    
    if (!user) {
      return null;
    }

    // Check if user has superadmin role in metadata
    const role = user.metadata?.role || user.metadata?.user_role;
    
    if (role === 'superadmin' || role === 'super_admin') {
      return {
        id: user.id,
        email: user.email,
        role: 'superadmin',
      };
    }

    return null;
  }

  /**
   * Verify admin token (JWT from Nhost)
   */
  async verifyAdminToken(token: string): Promise<{ id: string; email: string; role: string } | null> {
    if (!this.isConfigured()) {
      return null;
    }

    try {
      // Verify token with Nhost auth endpoint
      const response = await fetch(`${this.authUrl}/user`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        return null;
      }

      const userData = await response.json();
      const email = userData.email || userData.user?.email;

      if (!email) {
        return null;
      }

      // Verify admin status
      return await this.verifyAdminUser(email);
    } catch (error) {
      console.error('[Nhost Admin] Token verification error:', error);
      return null;
    }
  }

  /**
   * Query users table (admin access)
   */
  async getUsers(limit: number = 50, offset: number = 0): Promise<any[]> {
    const query = `
      query GetUsers($limit: Int!, $offset: Int!) {
        users(limit: $limit, offset: $offset, order_by: { createdAt: desc }) {
          id
          email
          displayName
          metadata
          createdAt
        }
      }
    `;

    const result = await this.query(query, { limit, offset });
    
    if (result.errors) {
      return [];
    }

    return result.data?.users || [];
  }

  /**
   * Get admin service status
   */
  getConfigStatus() {
    return {
      configured: this.isConfigured(),
      hasSubdomain: !!process.env.NHOST_SUBDOMAIN || !!process.env.NHOST_PROJECT_ID,
      hasAdminSecret: !!this.adminSecret,
      subdomain: process.env.NHOST_SUBDOMAIN || process.env.NHOST_PROJECT_ID || 'not set',
      region: process.env.NHOST_REGION || 'eu-central-1',
      graphqlUrl: this.baseUrl || 'not configured',
      authUrl: this.authUrl || 'not configured',
    };
  }
}

// Singleton instance
export const nhostAdmin = new NhostAdminClient();
