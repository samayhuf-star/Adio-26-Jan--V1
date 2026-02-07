/**
 * Auth utilities - Custom Authentication Implementation
 */

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

const API_BASE = '/api/account';

async function apiRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
  const token = getSessionTokenSync();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch {
      errorData = { success: false, error: `Request failed: ${response.statusText}` };
    }
    if (!errorData.success && errorData.success !== undefined) {
      return errorData;
    }
    return { success: false, error: errorData.error || errorData.message || `Request failed with status ${response.status}` };
  }

  return response.json();
}

export async function signUpWithEmail(
  email: string,
  password: string,
  passwordConfirm?: string,
  name?: string
): Promise<{ data: User | null; error: { message: string } | null; needsEmailVerification?: boolean; message?: string }> {
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
    }

    const result = await apiRequest('/register', {
      method: 'POST',
      body: JSON.stringify({ email: email.trim().toLowerCase(), password, name: name || '' }),
    });

    if (!result.success) {
      return { data: null, error: { message: result.error || 'Registration failed' } };
    }

    if (result.needsEmailVerification) {
      return {
        data: null,
        error: null,
        needsEmailVerification: true,
        message: result.message || 'Please check your email to verify your account',
      };
    }

    return { data: null, error: null };
  } catch (err: any) {
    console.error('Signup error:', err);
    return { data: null, error: { message: err.message || 'Failed to create account' } };
  }
}

export async function signInWithEmail(
  email: string,
  password: string
): Promise<{ data: { user: User; session: any } | null; error: { message: string } | null; needsEmailVerification?: boolean }> {
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
    }

    const result = await apiRequest('/login', {
      method: 'POST',
      body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
    });

    if (!result.success) {
      if (result.needsEmailVerification) {
        return { data: null, error: { message: result.error }, needsEmailVerification: true };
      }
      return { data: null, error: { message: result.error || 'Invalid email or password' } };
    }

    const user: User = {
      id: result.user.id,
      email: result.user.email,
      name: result.user.full_name || '',
      full_name: result.user.full_name || '',
      avatar: result.user.avatar_url,
      role: result.user.role || 'user',
      subscription_plan: result.user.subscription_plan || 'free',
      subscription_status: result.user.subscription_status || 'active',
      email_confirmed_at: new Date().toISOString(),
      created: result.user.created_at,
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('auth_token', result.token);
    }

    return {
      data: {
        user,
        session: { accessToken: result.token },
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
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user');
      localStorage.removeItem('auth_token');
      sessionStorage.removeItem('test_admin_mode');
      sessionStorage.removeItem('test_admin_user');
    }
    return { error: null };
  } catch (err: any) {
    console.error('Signout error:', err);
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
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
}

export function getSessionTokenSync(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
}

export async function resetPassword(email: string): Promise<{ error: { message: string } | null }> {
  try {
    const result = await apiRequest('/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: email.trim().toLowerCase() }),
    });

    if (result && result.success === false) {
      return { error: { message: result.error || 'Failed to send password reset email' } };
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
    if (token) {
      const result = await apiRequest('/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, password: newPassword }),
      });

      if (!result.success) {
        return { error: { message: result.error || 'Failed to reset password' } };
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
  if (typeof window === 'undefined') return null;

  const token = getSessionTokenSync();
  if (!token) return getCurrentUser();

  try {
    const result = await apiRequest('/me');

    if (result.success && result.user) {
      const user: User = {
        id: result.user.id,
        email: result.user.email,
        name: result.user.full_name || '',
        full_name: result.user.full_name || '',
        avatar: result.user.avatar_url,
        role: result.user.role || 'user',
        subscription_plan: result.user.subscription_plan || 'free',
        subscription_status: result.user.subscription_status || 'active',
        email_confirmed_at: result.user.email_verified ? new Date().toISOString() : null,
        created: result.user.created_at,
        updated: result.user.updated_at,
      };

      localStorage.setItem('user', JSON.stringify(user));
      return user;
    }
  } catch (err) {
    console.warn('Error fetching user profile:', err);
  }

  return getCurrentUser();
}

export function isAuthenticated(): boolean {
  const token = getSessionTokenSync();
  const user = getCurrentUser();
  return token !== null && user !== null;
}

export async function isAuthenticatedAsync(): Promise<boolean> {
  return isAuthenticated();
}

export function clearProfileCache() {
  // No-op
}

export async function getCurrentAuthUser(): Promise<{ id: string; email: string } | null> {
  const user = getCurrentUser();
  if (user) {
    return { id: user.id, email: user.email };
  }
  return null;
}

export async function getCurrentUserProfile(): Promise<User | null> {
  return getCurrentUserAsync();
}

export async function getSession() {
  const token = getSessionTokenSync();
  if (token) {
    return { accessToken: token };
  }
  return null;
}

export async function createUserProfile(
  userId: string,
  email: string,
  fullName: string
): Promise<User> {
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

export async function resendVerificationEmail(email: string) {
  try {
    const result = await apiRequest('/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email: email.trim().toLowerCase() }),
    });

    if (!result.success) {
      return { error: { message: result.error || 'Failed to resend verification email' } };
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

export function setLegacyUser(_user: any) {
}

export function setLegacyAuth(_auth: any) {
}
