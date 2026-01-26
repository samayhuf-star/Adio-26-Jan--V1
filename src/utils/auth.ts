/**
 * Auth utilities - Nhost Authentication Implementation
 */

import { nhost } from '../lib/nhost';
import type { User as NhostUser } from '@nhost/nhost-js';

export interface User {
  id: string;
  email: string;
  username?: string;
  name?: string;
  full_name?: string;
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
  email_confirmed_at?: string | null;
}

// Initialize Nhost client
const nhostClient = nhost;

export async function signUpWithEmail(
  email: string,
  password: string,
  passwordConfirm?: string,
  name?: string
): Promise<{ data: User | null; error: { message: string } | null }> {
  try {
    // Sign up with Nhost Auth
    const { session, error: authError } = await nhostClient.auth.signUp({
      email: email.trim().toLowerCase(),
      password: password,
      options: {
        displayName: name || '',
        metadata: {
          full_name: name || '',
          name: name || '',
        },
        redirectTo: `${window.location.origin}/verify-email`,
      },
    });

    if (authError) {
      return { data: null, error: { message: authError.message } };
    }

    if (!session?.user) {
      return { data: null, error: { message: 'Failed to create user account' } };
    }

    // Create user profile using GraphQL
    try {
      const profileData = {
        id: session.user.id,
        email: session.user.email!,
        full_name: name || '',
        name: name || '',
        role: 'user',
        subscription_plan: 'free',
        subscription_status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Insert user profile via GraphQL
      const { error: profileError } = await nhostClient.graphql.request(`
        mutation InsertUser($user: users_insert_input!) {
          insert_users_one(object: $user, on_conflict: {constraint: users_pkey, update_columns: [updated_at]}) {
            id
            email
            full_name
            name
            role
            subscription_plan
            subscription_status
          }
        }
      `, { user: profileData });

      if (profileError) {
        console.warn('Failed to create user profile:', profileError);
        // Don't fail signup if profile creation fails
      }
    } catch (profileErr) {
      console.warn('Error creating user profile:', profileErr);
      // Continue even if profile creation fails
    }

    // Map Nhost user to our User interface
    const user: User = {
      id: session.user.id,
      email: session.user.email!,
      name: name || session.user.displayName || '',
      full_name: name || session.user.displayName || '',
      role: 'user',
      subscription_plan: 'free',
      subscription_status: 'active',
      email_confirmed_at: session.user.emailVerified ? new Date().toISOString() : null,
    };

    // Store user in localStorage for compatibility
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(user));
      if (session.accessToken) {
        localStorage.setItem('auth_token', session.accessToken);
      }
    }

    return { data: user, error: null };
  } catch (err: any) {
    console.error('Signup error:', err);
    return { data: null, error: { message: err.message || 'Failed to create account' } };
  }
}

export async function signInWithEmail(
  email: string,
  password: string
): Promise<{ data: { user: User; session: any } | null; error: { message: string } | null }> {
  try {
    const { session, error: authError } = await nhostClient.auth.signIn({
      email: email.trim().toLowerCase(),
      password: password,
    });

    if (authError) {
      return { data: null, error: { message: authError.message } };
    }

    if (!session?.user) {
      return { data: null, error: { message: 'Invalid credentials' } };
    }

    // Fetch user profile from database using GraphQL
    let userProfile: User | null = null;
    try {
      const { data: profileData, error: profileError } = await nhostClient.graphql.request(`
        query GetUserProfile($id: uuid!) {
          users_by_pk(id: $id) {
            id
            email
            name
            full_name
            role
            subscription_plan
            subscription_status
            google_ads_default_account
            company_name
            job_title
            industry
            company_size
            phone
            website
            country
            bio
            created_at
            updated_at
          }
        }
      `, { id: session.user.id });

      if (profileData?.users_by_pk && !profileError) {
        const profile = profileData.users_by_pk;
        userProfile = {
          id: profile.id,
          email: profile.email || session.user.email!,
          name: profile.name || profile.full_name || session.user.displayName || '',
          full_name: profile.full_name || profile.name || session.user.displayName || '',
          role: profile.role || 'user',
          subscription_plan: profile.subscription_plan || 'free',
          subscription_status: profile.subscription_status || 'active',
          google_ads_default_account: profile.google_ads_default_account,
          company_name: profile.company_name,
          job_title: profile.job_title,
          industry: profile.industry,
          company_size: profile.company_size,
          phone: profile.phone,
          website: profile.website,
          country: profile.country,
          bio: profile.bio,
          created: profile.created_at,
          updated: profile.updated_at,
          email_confirmed_at: session.user.emailVerified ? new Date().toISOString() : null,
        };
      }
    } catch (profileErr) {
      console.warn('Error fetching user profile:', profileErr);
    }

    // If no profile found, create a basic one
    if (!userProfile) {
      userProfile = {
        id: session.user.id,
        email: session.user.email!,
        name: session.user.displayName || '',
        full_name: session.user.displayName || '',
        role: 'user',
        subscription_plan: 'free',
        subscription_status: 'active',
        email_confirmed_at: session.user.emailVerified ? new Date().toISOString() : null,
      };
    }

    // Store user and session in localStorage for compatibility
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(userProfile));
      localStorage.setItem('auth_token', session.accessToken);
    }

    return {
      data: {
        user: userProfile,
        session: session,
      },
      error: null,
    };
  } catch (err: any) {
    console.error('Login error:', err);
    return { data: null, error: { message: err.message || 'Failed to sign in' } };
  }
}

export async function signOut(): Promise<{ error: { message: string } | null }> {
  try {
    const { error } = await nhostClient.auth.signOut();

    // Clear localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user');
      localStorage.removeItem('auth_token');
      sessionStorage.removeItem('test_admin_mode');
      sessionStorage.removeItem('test_admin_user');
    }

    if (error) {
      return { error: { message: error.message } };
    }

    return { error: null };
  } catch (err: any) {
    console.error('Signout error:', err);
    // Clear localStorage even if signout fails
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user');
      localStorage.removeItem('auth_token');
      sessionStorage.removeItem('test_admin_mode');
      sessionStorage.removeItem('test_admin_user');
    }
    return { error: { message: err.message || 'Failed to sign out' } };
  }
}

export async function getSessionToken(): Promise<string | null> {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const session = nhostClient.auth.getSession();
    
    if (session?.accessToken) {
      // Update localStorage for compatibility
      localStorage.setItem('auth_token', session.accessToken);
      return session.accessToken;
    }

    // Fallback to localStorage token
    return localStorage.getItem('auth_token');
  } catch (err) {
    console.error('Error getting session token:', err);
    return localStorage.getItem('auth_token');
  }
}

// Synchronous version for compatibility
export function getSessionTokenSync(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return localStorage.getItem('auth_token');
}

export async function resetPassword(email: string): Promise<{ error: { message: string } | null }> {
  try {
    const { error } = await nhostClient.auth.resetPassword({
      email: email.trim().toLowerCase(),
      options: {
        redirectTo: `${window.location.origin}/reset-password`,
      },
    });

    if (error) {
      return { error: { message: error.message } };
    }

    return { error: null };
  } catch (err: any) {
    console.error('Reset password error:', err);
    return { error: { message: err.message || 'Failed to send password reset email' } };
  }
}

export async function updatePassword(
  newPassword: string,
  token?: string
): Promise<{ error: { message: string } | null }> {
  try {
    // For Nhost, password updates are handled differently
    // If token is provided, it's a password reset flow
    if (token) {
      // This would typically be handled by Nhost's password reset flow
      // For now, we'll use the change password method
      const { error } = await nhostClient.auth.changePassword({
        newPassword: newPassword,
      });

      if (error) {
        return { error: { message: error.message } };
      }
    } else {
      // Regular password change for authenticated user
      const { error } = await nhostClient.auth.changePassword({
        newPassword: newPassword,
      });

      if (error) {
        return { error: { message: error.message } };
      }
    }

    return { error: null };
  } catch (err: any) {
    console.error('Update password error:', err);
    return { error: { message: err.message || 'Failed to update password' } };
  }
}

export function getCurrentUser(): User | null {
  if (typeof window !== 'undefined') {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
  }
  return null;
}

export async function getCurrentUserAsync(): Promise<User | null> {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const user = nhostClient.auth.getUser();

    if (!user) {
      return null;
    }

    // Try to get user profile from database using GraphQL
    try {
      const { data: profileData, error } = await nhostClient.graphql.request(`
        query GetUserProfile($id: uuid!) {
          users_by_pk(id: $id) {
            id
            email
            name
            full_name
            role
            subscription_plan
            subscription_status
            google_ads_default_account
            company_name
            job_title
            industry
            company_size
            phone
            website
            country
            bio
            created_at
            updated_at
          }
        }
      `, { id: user.id });

      if (profileData?.users_by_pk && !error) {
        const profile = profileData.users_by_pk;
        const userProfile: User = {
          id: profile.id,
          email: profile.email || user.email!,
          name: profile.name || profile.full_name || user.displayName || '',
          full_name: profile.full_name || profile.name || user.displayName || '',
          role: profile.role || 'user',
          subscription_plan: profile.subscription_plan || 'free',
          subscription_status: profile.subscription_status || 'active',
          google_ads_default_account: profile.google_ads_default_account,
          company_name: profile.company_name,
          job_title: profile.job_title,
          industry: profile.industry,
          company_size: profile.company_size,
          phone: profile.phone,
          website: profile.website,
          country: profile.country,
          bio: profile.bio,
          created: profile.created_at,
          updated: profile.updated_at,
          email_confirmed_at: user.emailVerified ? new Date().toISOString() : null,
        };
        
        // Update localStorage
        localStorage.setItem('user', JSON.stringify(userProfile));
        return userProfile;
      }
    } catch (profileErr) {
      console.warn('Error fetching user profile:', profileErr);
    }

    // Fallback to auth user metadata
    const userProfile: User = {
      id: user.id,
      email: user.email!,
      name: user.displayName || '',
      full_name: user.displayName || '',
      role: 'user',
      subscription_plan: 'free',
      subscription_status: 'active',
      email_confirmed_at: user.emailVerified ? new Date().toISOString() : null,
    };

    localStorage.setItem('user', JSON.stringify(userProfile));
    return userProfile;
  } catch (err) {
    console.error('Error getting current user:', err);
    return getCurrentUser(); // Fallback to localStorage
  }
}

export function isAuthenticated(): boolean {
  const token = getSessionTokenSync();
  const user = getCurrentUser();
  return token !== null && user !== null;
}

export async function isAuthenticatedAsync(): Promise<boolean> {
  try {
    const session = nhostClient.auth.getSession();
    return session !== null && session.accessToken !== null;
  } catch (err) {
    return isAuthenticated(); // Fallback to sync check
  }
}

export function clearProfileCache() {
  // No-op
}

export async function getCurrentAuthUser(): Promise<{ id: string; email: string } | null> {
  try {
    const user = nhostClient.auth.getUser();
    
    if (!user) {
      // Fallback to localStorage
      const localUser = getCurrentUser();
      if (localUser) {
        return {
          id: localUser.id,
          email: localUser.email,
        };
      }
      return null;
    }

    return {
      id: user.id,
      email: user.email!,
    };
  } catch (err) {
    console.error('Error getting auth user:', err);
    const user = getCurrentUser();
    if (user) {
      return {
        id: user.id,
        email: user.email,
      };
    }
    return null;
  }
}

export async function getCurrentUserProfile(): Promise<User | null> {
  return getCurrentUserAsync();
}


export async function getSession() {
  try {
    const session = nhostClient.auth.getSession();
    
    if (session?.accessToken) {
      // Update localStorage for compatibility
      localStorage.setItem('auth_token', session.accessToken);
      return session;
    }

    // Fallback to localStorage
    const token = getSessionTokenSync();
    if (token) {
      return { accessToken: token };
    }
    return null;
  } catch (err) {
    console.error('Error getting session:', err);
    const token = getSessionTokenSync();
    if (token) {
      return { accessToken: token };
    }
    return null;
  }
}

export async function createUserProfile(
  userId: string,
  email: string,
  fullName: string
): Promise<User> {
  try {
    const profileData = {
      id: userId,
      email: email,
      full_name: fullName,
      name: fullName,
      role: 'user',
      subscription_plan: 'free',
      subscription_status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Try to insert or update user profile using GraphQL
    const { data: profile, error } = await nhostClient.graphql.request(`
      mutation UpsertUser($user: users_insert_input!) {
        insert_users_one(object: $user, on_conflict: {constraint: users_pkey, update_columns: [updated_at, full_name, name]}) {
          id
          email
          full_name
          name
          role
          subscription_plan
          subscription_status
        }
      }
    `, { user: profileData });

    const user: User = {
      id: userId,
      email,
      name: fullName,
      full_name: fullName,
      role: 'user',
      subscription_plan: 'free',
      subscription_status: 'active',
      ...profile?.insert_users_one,
    };

    // Store in localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(user));
    }

    if (error) {
      console.warn('Error creating/updating user profile:', error);
    }

    return user;
  } catch (err) {
    console.error('Error creating user profile:', err);
    // Return basic user even if database update fails
    const user: User = {
      id: userId,
      email,
      name: fullName,
      full_name: fullName,
      role: 'user',
      subscription_plan: 'free',
      subscription_status: 'active',
    };
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(user));
    }
    
    return user;
  }
}

export async function resendVerificationEmail(email: string) {
  try {
    const { error } = await nhostClient.auth.sendVerificationEmail({
      email: email.trim().toLowerCase(),
      options: {
        redirectTo: `${window.location.origin}/verify-email`,
      },
    });

    if (error) {
      return { error: { message: error.message } };
    }

    return { error: null };
  } catch (err: any) {
    console.error('Resend verification email error:', err);
    return { error: { message: err.message || 'Failed to resend verification email' } };
  }
}

export function isSuperAdmin(): boolean {
  const user = getCurrentUser();
  return user?.role === 'superadmin' || user?.role === 'super_admin' || false;
}

// Initialize auth state on load
if (typeof window !== 'undefined') {
  try {
    // Listen for auth state changes
    nhostClient.auth.onAuthStateChanged((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        // Update localStorage when user signs in
        getCurrentUserAsync().catch(console.error);
      } else if (event === 'SIGNED_OUT') {
        // Clear localStorage when user signs out
        localStorage.removeItem('user');
        localStorage.removeItem('auth_token');
      } else if (event === 'TOKEN_CHANGED' && session) {
        // Update token on refresh
        localStorage.setItem('auth_token', session.accessToken);
      }
    });
  } catch (err) {
    console.warn('Failed to initialize auth state listener:', err);
  }
}

// Legacy compatibility functions
export function setNhostUser(_user: any) {
  // No-op
}

export function setNhostAuth(_auth: any) {
  // No-op
}
