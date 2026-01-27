import { nhostAdmin } from '../nhostAdmin';

/**
 * Extract user ID from Authorization token
 */
export async function getUserIdFromToken(c: any): Promise<string | null> {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    
    // Try to verify token with Nhost
    if (nhostAdmin.isConfigured()) {
      try {
        const authUrl = process.env.NHOST_SUBDOMAIN || process.env.NHOST_PROJECT_ID
          ? `https://${process.env.NHOST_SUBDOMAIN || process.env.NHOST_PROJECT_ID}.auth.${process.env.NHOST_REGION || 'eu-central-1'}.nhost.run/v1`
          : '';
        
        if (authUrl) {
          const response = await fetch(`${authUrl}/user`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          if (response.ok) {
            const userData = await response.json();
            const userId = userData.id || userData.user?.id;
            if (userId) {
              return userId;
            }
          }
        }
      } catch (error) {
        console.error('Token verification error:', error);
      }
    }

    return null;
  } catch (error) {
    console.error('Error extracting userId from token:', error);
    return null;
  }
}
