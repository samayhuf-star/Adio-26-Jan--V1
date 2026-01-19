// Supabase removed - using PocketBase instead
type SupabaseClient = any;
function createClient(_url: string, _key: string, _options?: any): any {
  return {
    auth: {
      getUser: async () => ({ data: { user: null }, error: null }),
    },
    from: () => ({
      select: () => ({ eq: () => ({ single: () => ({ data: null, error: null }) }) }),
      insert: () => Promise.resolve({ data: null, error: null }),
    }),
  };
}

interface AdminClientConfig {
  serviceRoleKey: string;
  projectUrl: string;
}

interface AdminUser {
  id: string;
  email: string;
  role: string;
  full_name?: string;
}

interface AdminContext {
  user: AdminUser;
  adminClient: SupabaseClient;
}

class AdminAuthService {
  private adminClient: SupabaseClient | null = null;
  private config: AdminClientConfig | null = null;

  constructor() {
    this.initializeClient();
  }

  private initializeClient(): void {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const projectUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    
    if (!serviceRoleKey) {
      console.error('SUPABASE_SERVICE_ROLE_KEY environment variable is required for admin operations');
      return;
    }

    if (!projectUrl) {
      console.error('SUPABASE_URL environment variable is required for admin operations');
      return;
    }

    this.config = { serviceRoleKey, projectUrl };
    
    try {
      this.adminClient = createClient(projectUrl, serviceRoleKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });
      console.log('Admin Supabase client initialized successfully');
    } catch (error) {
      console.error('Failed to initialize admin Supabase client:', error);
    }
  }

  /**
   * Get the admin client that bypasses RLS policies
   */
  getAdminClient(): SupabaseClient | null {
    return this.adminClient;
  }

  /**
   * Verify if a user has super admin privileges
   */
  async verifyAdminUser(email: string, token?: string): Promise<AdminUser | null> {
    if (!this.adminClient) {
      throw new Error('Admin client not initialized. Check SUPABASE_SERVICE_ROLE_KEY configuration.');
    }

    try {
      // Special case for hardcoded admin email
      if (email === 'oadiology@gmail.com' || email === 'd@d.com') {
        return {
          id: 'admin-' + Date.now(),
          email: email,
          role: 'superadmin',
          full_name: 'Super Admin'
        };
      }

      // Query users table directly with admin client (bypasses RLS)
      const { data: user, error } = await this.adminClient
        .from('users')
        .select('id, email, role, full_name')
        .eq('email', email)
        .eq('role', 'superadmin')
        .single();

      if (error) {
        console.error('Error verifying admin user:', error);
        return null;
      }

      if (!user) {
        console.warn(`User ${email} is not a super admin`);
        return null;
      }

      return user as AdminUser;
    } catch (error) {
      console.error('Error in verifyAdminUser:', error);
      return null;
    }
  }

  /**
   * Verify admin privileges using Supabase auth token
   */
  async verifyAdminToken(token: string): Promise<AdminUser | null> {
    if (!this.adminClient) {
      throw new Error('Admin client not initialized. Check SUPABASE_SERVICE_ROLE_KEY configuration.');
    }

    try {
      // Create a client with the user's token to verify it
      const userClient = createClient(
        this.config!.projectUrl,
        process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '',
        {
          global: {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        }
      );

      // Get user from token
      const { data: { user }, error: authError } = await userClient.auth.getUser(token);
      
      if (authError || !user) {
        console.error('Invalid auth token:', authError);
        return null;
      }

      // Now verify admin status using admin client
      return await this.verifyAdminUser(user.email || '');
    } catch (error) {
      console.error('Error verifying admin token:', error);
      return null;
    }
  }

  /**
   * Check if the service is properly configured
   */
  isConfigured(): boolean {
    return !!(this.adminClient && this.config);
  }

  /**
   * Get configuration status for debugging
   */
  getConfigStatus(): {
    configured: boolean;
    hasServiceRoleKey: boolean;
    hasProjectUrl: boolean;
    clientInitialized: boolean;
  } {
    return {
      configured: this.isConfigured(),
      hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      hasProjectUrl: !!(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL),
      clientInitialized: !!this.adminClient,
    };
  }

  /**
   * Log an admin action to audit_logs table
   */
  async logAdminAction(
    adminUserId: string,
    action: string,
    resourceType?: string,
    resourceId?: string,
    details?: any,
    level: 'info' | 'warning' | 'error' = 'info'
  ): Promise<void> {
    if (!this.adminClient) {
      console.error('Cannot log admin action: admin client not initialized');
      return;
    }

    try {
      await this.adminClient
        .from('audit_logs')
        .insert({
          admin_user_id: adminUserId,
          action,
          resource_type: resourceType,
          resource_id: resourceId,
          details,
          level,
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Failed to log admin action:', error);
    }
  }
}

// Singleton instance
const adminAuthService = new AdminAuthService();

/**
 * Middleware function for Hono to verify admin authentication
 */
export async function adminAuthMiddleware(c: any): Promise<AdminContext | Response> {
  try {
    // Check if admin service is configured
    if (!adminAuthService.isConfigured()) {
      const status = adminAuthService.getConfigStatus();
      console.error('Admin service not configured:', status);
      
      return c.json({
        success: false,
        error: 'Admin service not configured',
        code: 'CONFIG_ERROR',
        details: {
          message: 'Missing required environment variables',
          required: ['SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_URL'],
          status
        },
        timestamp: new Date().toISOString()
      }, 500);
    }

    // Get authentication headers
    const authHeader = c.req.header('Authorization');
    const adminEmail = c.req.header('X-Admin-Email');
    const adminKey = c.req.header('X-Admin-Key');

    let adminUser: AdminUser | null = null;

    // Check for admin bypass key (for development/testing)
    if (adminKey === process.env.ADMIN_SECRET_KEY && adminKey) {
      adminUser = {
        id: 'admin-bypass',
        email: adminEmail || 'admin@system',
        role: 'superadmin',
        full_name: 'System Admin'
      };
    }
    // Check email-based auth (for development)
    else if (adminEmail && (adminEmail === 'd@d.com' || adminEmail === 'oadiology@gmail.com')) {
      adminUser = await adminAuthService.verifyAdminUser(adminEmail);
    }
    // Check Bearer token
    else if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      adminUser = await adminAuthService.verifyAdminToken(token);
    }
    // Check email header as fallback
    else if (adminEmail) {
      adminUser = await adminAuthService.verifyAdminUser(adminEmail);
    }

    if (!adminUser) {
      return c.json({
        success: false,
        error: 'Unauthorized: Super admin access required',
        code: 'AUTH_ERROR',
        details: {
          message: 'Invalid or missing admin credentials',
          providedHeaders: {
            hasAuthHeader: !!authHeader,
            hasAdminEmail: !!adminEmail,
            hasAdminKey: !!adminKey
          }
        },
        timestamp: new Date().toISOString()
      }, 401);
    }

    // Return admin context
    return {
      user: adminUser,
      adminClient: adminAuthService.getAdminClient()!
    };

  } catch (error) {
    console.error('Admin auth middleware error:', error);
    return c.json({
      success: false,
      error: 'Authentication failed',
      code: 'AUTH_ERROR',
      details: {
        message: error instanceof Error ? error.message : 'Unknown authentication error'
      },
      timestamp: new Date().toISOString()
    }, 500);
  }
}

/**
 * Helper function to get admin client directly
 */
export function getAdminClient(): SupabaseClient | null {
  return adminAuthService.getAdminClient();
}

/**
 * Helper function to check admin service configuration
 */
export function getAdminServiceStatus() {
  return adminAuthService.getConfigStatus();
}

/**
 * Helper function to log admin actions
 */
export async function logAdminAction(
  adminUserId: string,
  action: string,
  resourceType?: string,
  resourceId?: string,
  details?: any,
  level: 'info' | 'warning' | 'error' = 'info'
): Promise<void> {
  return adminAuthService.logAdminAction(adminUserId, action, resourceType, resourceId, details, level);
}

export { adminAuthService, AdminAuthService };
export type { AdminUser, AdminContext, AdminClientConfig };