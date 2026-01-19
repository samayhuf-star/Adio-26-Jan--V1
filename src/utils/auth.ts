/**
 * Auth utilities for PocketBase authentication
 * This module provides helper functions for authentication with PocketBase
 */

import {
  signUpWithEmail as pbSignUp,
  signInWithEmail as pbSignIn,
  signOut as pbSignOut,
  getCurrentUser as pbGetCurrentUser,
  isAuthenticated as pbIsAuthenticated,
  getSessionToken as pbGetSessionToken,
  resetPassword as pbResetPassword,
  updatePassword as pbUpdatePassword,
  updateUserProfile as pbUpdateUserProfile,
  getUserProfile as pbGetUserProfile,
  isSuperAdmin as pbIsSuperAdmin,
  type User,
} from './pocketbase/auth';

// Re-export PocketBase auth functions
export const signUpWithEmail = pbSignUp;
export const signInWithEmail = pbSignIn;
export const signOut = pbSignOut;
export const resetPassword = pbResetPassword;
export const updatePassword = pbUpdatePassword;
export const isSuperAdmin = pbIsSuperAdmin;
export const getSessionToken = pbGetSessionToken;

export function clearProfileCache() {
  // PocketBase handles caching internally
}

export async function getCurrentAuthUser(): Promise<{ id: string; email: string } | null> {
  const user = pbGetCurrentUser();
  if (!user) {
    return null;
  }
  return {
    id: user.id,
    email: user.email,
  };
}

export async function getCurrentUserProfile(): Promise<User | null> {
  const user = pbGetCurrentUser();
  if (!user) {
    return null;
  }
  
  // Try to get full profile from database
  try {
    const fullProfile = await pbGetUserProfile(user.id);
    if (fullProfile) {
      return fullProfile;
    }
  } catch (error) {
    console.error('Failed to fetch full user profile:', error);
  }
  
  // Return basic profile from auth store
  return {
    id: user.id,
    email: user.email,
    name: user.name || user.email.split('@')[0],
    username: user.username,
    avatar: user.avatar,
    role: user.role || 'user',
    subscription_plan: user.subscription_plan || 'free',
    subscription_status: user.subscription_status || 'active',
    google_ads_default_account: user.google_ads_default_account || null,
    company_name: user.company_name,
    job_title: user.job_title,
    industry: user.industry,
    company_size: user.company_size,
    phone: user.phone,
    website: user.website,
    country: user.country,
    bio: user.bio,
    created: user.created,
    updated: user.updated,
  };
}

export async function isAuthenticated(): Promise<boolean> {
  return pbIsAuthenticated();
}

export async function getSession() {
  const token = getSessionToken();
    if (token) {
      return { access_token: token };
    }
    return null;
}

export async function createUserProfile(userId: string, email: string, fullName: string): Promise<User> {
  const result = await pbUpdateUserProfile(userId, {
    name: fullName,
    email,
  });
  
  if (result.error) {
    throw new Error(result.error.message);
}

  return result.data!;
}

export async function resendVerificationEmail(_email: string) {
  // PocketBase handles email verification automatically on signup
  return { error: null };
}

// Legacy Clerk compatibility functions (for gradual migration)
export function setClerkUser(_user: any) {
  // No-op for PocketBase
}

export function setClerkAuth(_auth: any) {
  // No-op for PocketBase
}
