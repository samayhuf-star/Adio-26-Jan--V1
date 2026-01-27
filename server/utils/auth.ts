import { nhostAdmin } from '../nhostAdmin';

/**
 * Extract user ID from Authorization token
 */
export async function getUserIdFromToken(c: any): Promise<string | null> {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.warn('[Auth] No Bearer token found in Authorization header');
      return null;
    }

    const token = authHeader.substring(7);
    
    if (!token || token.length < 10) {
      console.warn('[Auth] Invalid token format');
      return null;
    }
    
    // Try to verify token with Nhost
    if (nhostAdmin.isConfigured()) {
      try {
        const subdomain = process.env.NHOST_SUBDOMAIN || process.env.NHOST_PROJECT_ID;
        const region = process.env.NHOST_REGION || 'eu-central-1';
        const authUrl = subdomain
          ? `https://${subdomain}.auth.${region}.nhost.run/v1`
          : '';
        
        if (!authUrl) {
          console.warn('[Auth] Nhost auth URL not configured');
          return null;
        }

        const response = await fetch(`${authUrl}/user`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          console.warn(`[Auth] Nhost /user endpoint returned ${response.status}: ${response.statusText}`);
          // Try to get error details
          try {
            const errorData = await response.text();
            console.warn(`[Auth] Error response:`, errorData.substring(0, 200));
          } catch (e) {
            // Ignore
          }
          return null;
        }

        const userData = await response.json();
        
        // Nhost returns user data in different formats
        const userId = userData.id || userData.user?.id || userData.sub;
        
        if (userId) {
          console.log(`[Auth] Successfully extracted userId: ${userId}`);
          return userId;
        } else {
          console.warn('[Auth] User ID not found in response:', JSON.stringify(userData).substring(0, 200));
        }
      } catch (error: any) {
        console.error('[Auth] Token verification error:', error.message || error);
        console.error('[Auth] Error stack:', error.stack);
      }
    } else {
      console.warn('[Auth] Nhost admin not configured');
    }

    return null;
  } catch (error: any) {
    console.error('[Auth] Error extracting userId from token:', error.message || error);
    console.error('[Auth] Error stack:', error.stack);
    return null;
  }
}
