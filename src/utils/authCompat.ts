/**
 * Compatibility layer for migrating from Clerk to PocketBase
 * Provides similar hooks/utilities to ease migration
 */

import { getSessionToken, getCurrentUserProfile } from './auth';

/**
 * Hook-like function that returns getToken (for components that used useAuth)
 */
export function useAuthCompat() {
  return {
    getToken: async () => {
      const token = await getSessionToken();
      return token || null;
    },
    isLoaded: true,
  };
}

/**
 * Hook-like function that returns user (for components that used useUser)
 */
export function useUserCompat() {
  return {
    user: null, // Will be set by component state
    isLoaded: true,
    isSignedIn: false, // Will be determined by component
  };
}
