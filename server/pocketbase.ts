import PocketBase from 'pocketbase';

const POCKETBASE_URL = process.env.POCKETBASE_URL || 'http://127.0.0.1:8090';

// Create PocketBase admin client for server-side operations
// This uses admin credentials for server-to-server operations
export const pbAdmin = new PocketBase(POCKETBASE_URL);

// Initialize admin auth if credentials are provided
if (process.env.POCKETBASE_ADMIN_EMAIL && process.env.POCKETBASE_ADMIN_PASSWORD) {
  pbAdmin.admins.authWithPassword(
    process.env.POCKETBASE_ADMIN_EMAIL,
    process.env.POCKETBASE_ADMIN_PASSWORD
  ).catch((error) => {
    console.error('Failed to authenticate PocketBase admin:', error);
  });
}

/**
 * Verify a user token from PocketBase
 */
export async function verifyUserToken(token: string): Promise<{ authorized: boolean; userId?: string; userEmail?: string; error?: string }> {
  try {
    // Create a temporary client with the user's token
    const pb = new PocketBase(POCKETBASE_URL);
    pb.authStore.save(token, null);
    
    // Verify token by trying to get the current user
    const authData = pb.authStore;
    if (!authData.isValid) {
      return { authorized: false, error: 'Invalid token' };
    }
    
    // Get user record
    const user = authData.model;
    if (!user) {
      return { authorized: false, error: 'User not found' };
    }
    
    return {
      authorized: true,
      userId: user.id,
      userEmail: user.email,
    };
  } catch (error: any) {
    return {
      authorized: false,
      error: error.message || 'Token verification failed',
    };
  }
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string): Promise<any> {
  try {
    const user = await pbAdmin.collection('users').getOne(userId);
    return user;
  } catch (error) {
    console.error('Failed to get user:', error);
    return null;
  }
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string): Promise<any> {
  try {
    const users = await pbAdmin.collection('users').getList(1, 1, {
      filter: `email = "${email}"`,
    });
    return users.items[0] || null;
  } catch (error) {
    console.error('Failed to get user by email:', error);
    return null;
  }
}

/**
 * Create or update user
 */
export async function createOrUpdateUser(data: {
  email: string;
  name?: string;
  role?: string;
  subscription_plan?: string;
  subscription_status?: string;
}): Promise<any> {
  try {
    // Check if user exists
    const existing = await getUserByEmail(data.email);
    
    if (existing) {
      // Update existing user
      return await pbAdmin.collection('users').update(existing.id, data);
    } else {
      // Create new user (without password - user must set via auth)
      return await pbAdmin.collection('users').create(data);
    }
  } catch (error) {
    console.error('Failed to create/update user:', error);
    throw error;
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(userId: string, data: Partial<{
  name?: string;
  email?: string;
  role?: string;
  subscription_plan?: string;
  subscription_status?: string;
  google_ads_default_account?: string;
  company_name?: string;
  job_title?: string;
  industry?: string;
  company_size?: string;
  phone?: string;
  website?: string;
  country?: string;
  bio?: string;
}>): Promise<{ data: any | null; error: { message: string } | null }> {
  try {
    const record = await pbAdmin.collection('users').update(userId, data);
    return {
      data: record,
      error: null,
    };
  } catch (error: any) {
    return {
      data: null,
      error: { message: error.message || 'Failed to update profile' },
    };
  }
}
