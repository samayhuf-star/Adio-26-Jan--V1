/**
 * Auth utilities - Supabase Authentication Implementation
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

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

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.SUPABASE_ANON_KEY;

let supabaseClient: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Supabase URL and Anon Key must be provided via environment variables');
      throw new Error('Supabase configuration missing');
    }
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
  return supabaseClient;
}

// Export supabase client for other files that import it
export const supabase = typeof window !== 'undefined' ? getSupabaseClient() : null;

export async function signUpWithEmail(
  email: string,
  password: string,
  passwordConfirm?: string,
  name?: string
): Promise<{ data: User | null; error: { message: string } | null }> {
  try {
    const client = getSupabaseClient();
    
    // Sign up with Supabase Auth
    const { data: authData, error: authError } = await client.auth.signUp({
      email: email.trim().toLowerCase(),
      password: password,
      options: {
        data: {
          full_name: name || '',
          name: name || '',
        },
        emailRedirectTo: `${window.location.origin}/verify-email`,
      },
    });

    if (authError) {
      return { data: null, error: { message: authError.message } };
    }

    if (!authData.user) {
      return { data: null, error: { message: 'Failed to create user account' } };
    }

    // Create user profile in database
    try {
      const profileData = {
        id: authData.user.id,
        email: authData.user.email!,
        full_name: name || '',
        name: name || '',
        role: 'user',
        subscription_plan: 'free',
        subscription_status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { error: profileError } = await client
        .from('users')
        .insert([profileData])
        .select()
        .single();

      if (profileError && !profileError.message.includes('duplicate') && !profileError.message.includes('already exists')) {
        console.warn('Failed to create user profile:', profileError);
        // Don't fail signup if profile creation fails - profile might already exist
      }
    } catch (profileErr) {
      console.warn('Error creating user profile:', profileErr);
      // Continue even if profile creation fails
    }

    // Map Supabase user to our User interface
    const user: User = {
      id: authData.user.id,
      email: authData.user.email!,
      name: name || '',
      full_name: name || '',
      role: 'user',
      subscription_plan: 'free',
      subscription_status: 'active',
      email_confirmed_at: authData.user.email_confirmed_at,
    };

    // Store user in localStorage for compatibility
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(user));
      if (authData.session?.access_token) {
        localStorage.setItem('auth_token', authData.session.access_token);
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
    const client = getSupabaseClient();
    
    const { data: authData, error: authError } = await client.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password: password,
    });

    if (authError) {
      return { data: null, error: { message: authError.message } };
    }

    if (!authData.user || !authData.session) {
      return { data: null, error: { message: 'Invalid credentials' } };
    }

    // Fetch user profile from database
    let userProfile: User | null = null;
    try {
      const { data: profile, error: profileError } = await client
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (profile && !profileError) {
        userProfile = {
          id: profile.id,
          email: profile.email || authData.user.email!,
          name: profile.name || profile.full_name || '',
          full_name: profile.full_name || profile.name || '',
          role: profile.role || 'user',
          subscription_plan: profile.subscription_plan || 'free',
          subscription_status: profile.subscription_status || 'active',
          ...profile,
        };
      }
    } catch (profileErr) {
      console.warn('Error fetching user profile:', profileErr);
    }

    // If no profile found, create a basic one
    if (!userProfile) {
      userProfile = {
        id: authData.user.id,
        email: authData.user.email!,
        name: authData.user.user_metadata?.full_name || authData.user.user_metadata?.name || '',
        full_name: authData.user.user_metadata?.full_name || authData.user.user_metadata?.name || '',
        role: 'user',
        subscription_plan: 'free',
        subscription_status: 'active',
        email_confirmed_at: authData.user.email_confirmed_at,
      };
    }

    // Store user and session in localStorage for compatibility
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(userProfile));
      localStorage.setItem('auth_token', authData.session.access_token);
    }

    return {
      data: {
        user: userProfile,
        session: authData.session,
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
    const client = getSupabaseClient();
    const { error } = await client.auth.signOut();

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
    const client = getSupabaseClient();
    const { data: { session } } = await client.auth.getSession();
    
    if (session?.access_token) {
      // Update localStorage for compatibility
      localStorage.setItem('auth_token', session.access_token);
      return session.access_token;
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
    const client = getSupabaseClient();
    const { error } = await client.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${window.location.origin}/reset-password`,
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
    const client = getSupabaseClient();
    
    // If token is provided, it's a password reset token
    if (token) {
      const { error } = await client.auth.verifyOtp({
        token_hash: token,
        type: 'recovery',
      });

      if (error) {
        return { error: { message: error.message } };
      }
    }

    // Update password
    const { error } = await client.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      return { error: { message: error.message } };
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
    const client = getSupabaseClient();
    const { data: { user: authUser } } = await client.auth.getUser();

    if (!authUser) {
      return null;
    }

    // Try to get user profile from database
    try {
      const { data: profile, error } = await client
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (profile && !error) {
        const user: User = {
          id: profile.id,
          email: profile.email || authUser.email!,
          name: profile.name || profile.full_name || '',
          full_name: profile.full_name || profile.name || '',
          role: profile.role || 'user',
          subscription_plan: profile.subscription_plan || 'free',
          subscription_status: profile.subscription_status || 'active',
          ...profile,
        };
        
        // Update localStorage
        localStorage.setItem('user', JSON.stringify(user));
        return user;
      }
    } catch (profileErr) {
      console.warn('Error fetching user profile:', profileErr);
    }

    // Fallback to auth user metadata
    const user: User = {
      id: authUser.id,
      email: authUser.email!,
      name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || '',
      full_name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || '',
      role: 'user',
      subscription_plan: 'free',
      subscription_status: 'active',
      email_confirmed_at: authUser.email_confirmed_at,
    };

    localStorage.setItem('user', JSON.stringify(user));
    return user;
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
    const client = getSupabaseClient();
    const { data: { session } } = await client.auth.getSession();
    return session !== null;
  } catch (err) {
    return isAuthenticated(); // Fallback to sync check
  }
}

export function clearProfileCache() {
  // No-op
}

export async function getCurrentAuthUser(): Promise<{ id: string; email: string } | null> {
  try {
    const client = getSupabaseClient();
    const { data: { user: authUser } } = await client.auth.getUser();
    
    if (!authUser) {
      // Fallback to localStorage
  const user = getCurrentUser();
      if (user) {
        return {
          id: user.id,
          email: user.email,
        };
      }
    return null;
  }

    return {
      id: authUser.id,
      email: authUser.email!,
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
    const client = getSupabaseClient();
    const { data: { session } } = await client.auth.getSession();
    
    if (session) {
      // Update localStorage for compatibility
      localStorage.setItem('auth_token', session.access_token);
      return session;
    }

    // Fallback to localStorage
    const token = getSessionTokenSync();
    if (token) {
      return { access_token: token };
    }
    return null;
  } catch (err) {
    console.error('Error getting session:', err);
    const token = getSessionTokenSync();
  if (token) {
    return { access_token: token };
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
    const client = getSupabaseClient();
    
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

    // Try to insert or update user profile
    const { data: profile, error } = await client
      .from('users')
      .upsert(profileData, { onConflict: 'id' })
      .select()
      .single();

    const user: User = {
      id: userId,
      email,
      name: fullName,
      full_name: fullName,
      role: 'user',
      subscription_plan: 'free',
      subscription_status: 'active',
      ...profile,
    };

    // Store in localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(user));
    }

    if (error && !error.message.includes('duplicate') && !error.message.includes('already exists')) {
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
    const client = getSupabaseClient();
    const { error } = await client.auth.resend({
      type: 'signup',
      email: email.trim().toLowerCase(),
      options: {
        emailRedirectTo: `${window.location.origin}/verify-email`,
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
    getSupabaseClient().auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        // Update localStorage when user signs in
        getCurrentUserAsync().catch(console.error);
      } else if (event === 'SIGNED_OUT') {
        // Clear localStorage when user signs out
        localStorage.removeItem('user');
        localStorage.removeItem('auth_token');
      } else if (event === 'TOKEN_REFRESHED' && session) {
        // Update token on refresh
        localStorage.setItem('auth_token', session.access_token);
      }
    });
  } catch (err) {
    console.warn('Failed to initialize auth state listener:', err);
  }
}

// Legacy compatibility functions
export function setClerkUser(_user: any) {
  // No-op
}

export function setClerkAuth(_auth: any) {
  // No-op
}
