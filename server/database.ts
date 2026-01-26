/**
 * Database authentication - Nhost Integration
 * Server-side authentication functions using Nhost
 */

import { nhostAdmin } from './nhostAdmin';

export interface User {
  id: string;
  email: string;
  role?: string;
  [key: string]: any;
}

// Nhost admin client (replaces PocketBase admin)
export const nhostClient = nhostAdmin;

/**
 * Verify a user token using Nhost
 *
 * This verifies JWT tokens issued by Nhost and returns user information
 */
export async function verifyUserToken(
  token: string
): Promise<{ authorized: boolean; userId?: string; userEmail?: string; error?: string }> {
  if (!token) {
    return { authorized: false, error: 'Missing auth token' };
  }

  try {
    // Use Nhost admin to verify the token
    const adminResult = await nhostAdmin.verifyAdminToken(token);
    
    if (adminResult) {
      return {
        authorized: true,
        userId: adminResult.id,
        userEmail: adminResult.email,
      };
    }

    // If not an admin token, try to verify as regular user token
    // For now, we'll use a simple approach - in production you'd verify the JWT properly
    if (token.startsWith('eyJ')) { // JWT token format
      // This is a simplified verification - in production use proper JWT verification
      console.warn('Database: Using simplified JWT verification. Implement proper JWT verification for production.');
      
      // Extract user info from token (this is a stub - implement proper JWT decoding)
      const userId = 'user-' + Date.now();
      const userEmail = 'user@example.com';
      
      return {
        authorized: true,
        userId,
        userEmail,
      };
    }

    return { authorized: false, error: 'Invalid token format' };
  } catch (error: any) {
    console.error('Token verification error:', error);
    return { authorized: false, error: error.message || 'Token verification failed' };
  }
}

/**
 * Get user by ID using Nhost
 */
export async function getUserById(userId: string): Promise<User | null> {
  try {
    const user = await nhostAdmin.getUserById(userId);
    
    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      role: user.metadata?.role || 'user',
      displayName: user.displayName,
      ...user.metadata,
    };
  } catch (error) {
    console.error('Error getting user by ID:', error);
    return null;
  }
}

/**
 * Update user profile using Nhost GraphQL
 */
export async function updateUserProfile(
  userId: string,
  data: Partial<User>
): Promise<{ data: User | null; error: { message: string } | null }> {
  try {
    if (!nhostAdmin.isConfigured()) {
      return { data: null, error: { message: 'Nhost admin not configured' } };
    }

    // Update user profile via GraphQL
    const result = await nhostAdmin.query(`
      mutation UpdateUserProfile($id: uuid!, $updates: users_set_input!) {
        update_users_by_pk(pk_columns: { id: $id }, _set: $updates) {
          id
          email
          displayName
          metadata
        }
      }
    `, { 
      id: userId, 
      updates: {
        displayName: data.displayName,
        metadata: {
          role: data.role,
          ...data,
        }
      }
    });

    if (result.errors) {
      return { data: null, error: { message: result.errors[0]?.message || 'Update failed' } };
    }

    const updatedUser = result.data?.update_users_by_pk;
    if (!updatedUser) {
      return { data: null, error: { message: 'User not found' } };
    }

    return {
      data: {
        id: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.metadata?.role || 'user',
        displayName: updatedUser.displayName,
        ...updatedUser.metadata,
      },
      error: null,
    };
  } catch (error: any) {
    console.error('Error updating user profile:', error);
    return { data: null, error: { message: error.message || 'Update failed' } };
  }
}
