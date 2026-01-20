// Nhost Admin Client - replaces Supabase
import { nhostAdmin } from './nhostAdmin';

type AdminClient = typeof nhostAdmin;

// AdminClientConfig removed - using Nhost config instead

interface AdminUser {
  id: string;
  email: string;
  role: string;
  full_name?: string;
}

interface AdminContext {
  user: AdminUser;
  adminClient: AdminClient;
}

class AdminAuthService {
  private adminClient: AdminClient;

  constructor() {
    this.adminClient = nhostAdmin;
    this.initializeClient();
  }

  private initializeClient(): void {
    if (this.adminClient.isConfigured()) {
      console.log('[Admin Auth] Nhost admin client initialized successfully');
    } else {
      console.warn('[Admin Auth] Nhost admin client not fully configured. Set NHOST_SUBDOMAIN and NHOST_ADMIN_SECRET.');
    }
  }

  /**
   * Get the admin client for Nhost GraphQL queries
   */
  getAdminClient(): AdminClient {
    return this.adminClient;
  }

  /**
   * Verify if a user has super admin privileges
   */
  async verifyAdminUser(email: string, token?: string): Promise<AdminUser | null> {
    if (!this.adminClient.isConfigured()) {
      console.warn('[Admin Auth] Nhost admin not configured. Using fallback verification.');
      // Fallback: check hardcoded admin emails
      if (email === 'oadiology@gmail.com' || email === 'd@d.com' || email === 'admin@admin.com') {
        return {
          id: 'admin-' + Date.now(),
          email: email,
          role: 'superadmin',
          full_name: 'Super Admin'
        };
      }
      return null;
    }

    try {
      const adminUser = await this.adminClient.verifyAdminUser(email);
      
      if (!adminUser) {
        console.warn(`[Admin Auth] User ${email} is not a super admin`);
        return null;
      }

      return {
        id: adminUser.id,
        email: adminUser.email,
        role: adminUser.role,
        full_name: 'Super Admin'
      };
    } catch (error) {
      console.error('[Admin Auth] Error in verifyAdminUser:', error);
      return null;
    }
  }

  /**
   * Verify admin privileges using Nhost auth token
   */
  async verifyAdminToken(token: string): Promise<AdminUser | null> {
    if (!this.adminClient.isConfigured()) {
      console.warn('[Admin Auth] Nhost admin not configured. Token verification will fail.');
      return null;
    }

    try {
      const adminUser = await this.adminClient.verifyAdminToken(token);
      
      if (!adminUser) {
        return null;
      }

      return {
        id: adminUser.id,
        email: adminUser.email,
        role: adminUser.role,
        full_name: 'Super Admin'
      };
    } catch (error) {
      console.error('[Admin Auth] Error verifying admin token:', error);
      return null;
    }
  }

  /**
   * Check if the service is properly configured
   */
  isConfigured(): boolean {
    return this.adminClient.isConfigured();
  }

  /**
   * Get configuration status for debugging
   */
  getConfigStatus() {
    return this.adminClient.getConfigStatus();
  }

  /**
   * Log an admin action to audit_logs table (using direct database query)
   */
  async logAdminAction(
    adminUserId: string,
    action: string,
    resourceType?: string,
    resourceId?: string,
    details?: any,
    level: 'info' | 'warning' | 'error' = 'info'
  ): Promise<void> {
    // Use direct database pool instead of Nhost for logging
    // This ensures logs are always written even if Nhost is not configured
    try {
      const { Pool } = await import('pg');
      const { getDatabaseUrl } = await import('./dbConfig');
      const pool = new Pool({ connectionString: getDatabaseUrl() });
      
      await pool.query(
        `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, level, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())
         ON CONFLICT DO NOTHING`,
        [adminUserId, action, resourceType || null, resourceId || null, details ? JSON.stringify(details) : null, level]
      );
      
      pool.end();
    } catch (error) {
      console.error('[Admin Auth] Failed to log admin action:', error);
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
    if (adminKey && (adminKey === process.env.ADMIN_SECRET_KEY || adminKey === process.env.NHOST_ADMIN_SECRET)) {
      adminUser = {
        id: 'admin-bypass',
        email: adminEmail || 'admin@system',
        role: 'superadmin',
        full_name: 'System Admin'
      };
    }
    // Check email-based auth (for development)
    else if (adminEmail && (adminEmail === 'd@d.com' || adminEmail === 'oadiology@gmail.com' || adminEmail === 'admin@admin.com')) {
      adminUser = await adminAuthService.verifyAdminUser(adminEmail);
    }
    // Check Bearer token (Nhost JWT)
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
export function getAdminClient(): AdminClient | null {
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
export type { AdminUser, AdminContext };