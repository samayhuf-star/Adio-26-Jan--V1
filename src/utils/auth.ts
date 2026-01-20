/**
 * Auth utilities - Stub implementation
 * Authentication will be handled by Nhost or another provider
 */

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

// Stub functions - to be replaced with Nhost implementation
export async function signUpWithEmail(
  email: string,
  password: string,
  passwordConfirm?: string,
  name?: string
): Promise<{ data: User | null; error: { message: string } | null }> {
  console.warn('Auth: signUpWithEmail not implemented. Please integrate Nhost authentication.');
  return { data: null, error: { message: 'Authentication not configured' } };
}

export async function signInWithEmail(
  email: string,
  password: string
): Promise<{ data: { user: User; session: any } | null; error: { message: string } | null }> {
  console.warn('Auth: signInWithEmail not implemented. Please integrate Nhost authentication.');
  return { data: null, error: { message: 'Authentication not configured' } };
}

export async function signOut(): Promise<{ error: { message: string } | null }> {
  console.warn('Auth: signOut not implemented.');
  return { error: null };
}

export function getSessionToken(): string | null {
  // Check localStorage for token
  if (typeof window !== 'undefined') {
    return localStorage.getItem('auth_token') || null;
  }
  return null;
}

export async function resetPassword(email: string): Promise<{ error: { message: string } | null }> {
  console.warn('Auth: resetPassword not implemented.');
  return { error: { message: 'Password reset not configured' } };
}

export async function updatePassword(
  newPassword: string,
  token?: string
): Promise<{ error: { message: string } | null }> {
  console.warn('Auth: updatePassword not implemented.');
  return { error: { message: 'Password update not configured' } };
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

export function isAuthenticated(): boolean {
  return getSessionToken() !== null && getCurrentUser() !== null;
}

export function clearProfileCache() {
  // No-op
}

export async function getCurrentAuthUser(): Promise<{ id: string; email: string } | null> {
  const user = getCurrentUser();
  if (!user) {
    return null;
  }
  return {
    id: user.id,
    email: user.email,
  };
}

export async function getCurrentUserProfile(): Promise<User | null> {
  return getCurrentUser();
}

export async function isAuthenticatedAsync(): Promise<boolean> {
  return isAuthenticated();
}

export async function getSession() {
  const token = getSessionToken();
  if (token) {
    return { access_token: token };
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
    role: 'user',
    subscription_plan: 'free',
    subscription_status: 'active',
  };
  
  if (typeof window !== 'undefined') {
    localStorage.setItem('user', JSON.stringify(user));
  }
  
  return user;
}

export async function resendVerificationEmail(_email: string) {
  return { error: null };
}

export function isSuperAdmin(): boolean {
  const user = getCurrentUser();
  return user?.role === 'superadmin' || user?.role === 'super_admin' || false;
}

// Legacy compatibility functions
export function setClerkUser(_user: any) {
  // No-op
}

export function setClerkAuth(_auth: any) {
  // No-op
}
