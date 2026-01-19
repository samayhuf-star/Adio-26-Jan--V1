import pb, { pb as pocketbaseClient } from './client';

export interface User {
  id: string;
  email: string;
  username?: string;
  name?: string;
  avatar?: string;
  role?: string;
  subscription_plan?: string;
  subscription_status?: string;
  google_ads_default_account?: string | null;
  company_name?: string;
  job_title?: string;
  industry?: string;
  company_size?: string;
  phone?: string;
  website?: string;
  country?: string;
  bio?: string;
  created?: string;
  updated?: string;
}

/**
 * Sign up with email and password
 */
export async function signUpWithEmail(
  email: string,
  password: string,
  passwordConfirm: string,
  name?: string
): Promise<{ data: User | null; error: { message: string } | null }> {
  let createdRecord: any = null;
  
  try {
    const data = {
      email,
      password,
      passwordConfirm,
      name: name || email.split('@')[0],
      emailVisibility: true,
    };

    // Create user record first
    createdRecord = await pocketbaseClient.collection('users').create(data);
    
    // Attempt to automatically sign in after signup
    // If signin fails, we still return success since the user was created
    try {
      await signInWithEmail(email, password);
    } catch (signInError: any) {
      // Log the signin failure but don't fail the entire operation
      // The user was successfully created and can sign in manually
      console.warn('Auto-signin after signup failed, but user was created:', signInError.message);
      // Continue to return success with the created user
    }

    return {
      data: createdRecord as unknown as User,
      error: null,
    };
  } catch (error: any) {
    // Check if the error is due to user already existing
    const errorMessage = error.message || 'Failed to sign up';
    const isDuplicateError = errorMessage.includes('already exists') || 
                            errorMessage.includes('duplicate') ||
                            errorMessage.includes('unique constraint');
    
    // If user already exists and we have a created record, return success
    // This handles race conditions where signup was retried
    if (isDuplicateError && createdRecord) {
      console.warn('User already exists, but record was created:', errorMessage);
      return {
        data: createdRecord as unknown as User,
        error: null,
      };
    }
    
    return {
      data: null,
      error: { message: errorMessage },
    };
  }
}

/**
 * Sign in with email and password
 */
export async function signInWithEmail(
  email: string,
  password: string
): Promise<{ data: User | null; error: { message: string } | null }> {
  try {
    const authData = await pocketbaseClient.collection('users').authWithPassword(email, password);
    
    return {
      data: authData.record as unknown as User,
      error: null,
    };
  } catch (error: any) {
    return {
      data: null,
      error: { message: error.message || 'Invalid email or password' },
    };
  }
}

/**
 * Sign out current user
 */
export async function signOut(): Promise<void> {
  pocketbaseClient.authStore.clear();
  localStorage.removeItem('pocketbase_auth');
}

/**
 * Get current authenticated user
 */
export function getCurrentUser(): User | null {
  if (!pocketbaseClient.authStore.isValid) {
    return null;
  }
  return pocketbaseClient.authStore.model as unknown as User;
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return pocketbaseClient.authStore.isValid;
}

/**
 * Get current session token
 */
export function getSessionToken(): string | null {
  return pocketbaseClient.authStore.token || null;
}

/**
 * Reset password - request password reset email
 */
export async function resetPassword(email: string): Promise<{ error: { message: string } | null }> {
  try {
    await pocketbaseClient.collection('users').requestPasswordReset(email);
    return { error: null };
  } catch (error: any) {
    return { error: { message: error.message || 'Failed to send password reset email' } };
  }
}

/**
 * Update password after reset
 */
export async function updatePassword(
  token: string,
  password: string,
  passwordConfirm: string
): Promise<{ error: { message: string } | null }> {
  try {
    await pocketbaseClient.collection('users').confirmPasswordReset(token, password, passwordConfirm);
    return { error: null };
  } catch (error: any) {
    return { error: { message: error.message || 'Failed to update password' } };
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(userId: string, data: Partial<User>): Promise<{ data: User | null; error: { message: string } | null }> {
  try {
    const record = await pocketbaseClient.collection('users').update(userId, data);
    return {
      data: record as unknown as User,
      error: null,
    };
  } catch (error: any) {
    return {
      data: null,
      error: { message: error.message || 'Failed to update profile' },
    };
  }
}

/**
 * Get user profile from database
 */
export async function getUserProfile(userId: string): Promise<User | null> {
  try {
    const record = await pocketbaseClient.collection('users').getOne(userId);
    return record as unknown as User;
  } catch (error: any) {
    console.error('Failed to get user profile:', error);
    return null;
  }
}

/**
 * Check if user is super admin
 */
export function isSuperAdmin(): boolean {
  const user = getCurrentUser();
  if (!user) return false;

  const superAdminEmails = [
    'oadiology@gmail.com',
    'obed@adiology.io',
    'admin@adiology.io',
    'samayhuf@gmail.com',
  ];

  return superAdminEmails.includes(user.email.toLowerCase()) || user.role === 'superadmin';
}

/**
 * Refresh auth token
 */
export async function refreshAuth(): Promise<void> {
  try {
    await pocketbaseClient.collection('users').authRefresh();
  } catch (error) {
    console.error('Failed to refresh auth:', error);
    pocketbaseClient.authStore.clear();
  }
}
