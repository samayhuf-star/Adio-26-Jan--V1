/**
 * Compatibility layer for migrating from Clerk to PocketBase
 * Provides similar hooks/utilities to ease migration
 */

import React, { useState, useEffect } from 'react';
import { getSessionToken, getCurrentUserProfile, getCurrentUser, isAuthenticated } from './auth';

/**
 * Hook-like function that returns getToken (for components that used useAuth)
 */
export function useAuthCompat() {
  const [isSignedIn, setIsSignedIn] = useState(isAuthenticated());

  useEffect(() => {
    // Update isSignedIn when auth state changes
    setIsSignedIn(isAuthenticated());
  }, []);

  return {
    getToken: async () => {
      const token = await getSessionToken();
      return token || null;
    },
    isLoaded: true,
    isSignedIn,
  };
}

/**
 * Hook-like function that returns user (for components that used useUser)
 */
export function useUserCompat() {
  const [user, setUser] = useState<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = getCurrentUser();
        if (currentUser) {
          const profile = await getCurrentUserProfile();
          setUser(profile);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Failed to load user:', error);
        setUser(null);
      } finally {
        setIsLoaded(true);
      }
    };

    loadUser();
  }, []);

  return {
    user,
    isLoaded,
    isSignedIn: !!user,
  };
}

/**
 * Alias for useAuthCompat - provides Clerk-like useAuth hook
 */
export function useAuth() {
  const authCompat = useAuthCompat();
  return {
    getToken: authCompat.getToken,
    isSignedIn: authCompat.isSignedIn || isAuthenticated(),
    isLoaded: authCompat.isLoaded,
  };
}

/**
 * Alias for useUserCompat - provides Clerk-like useUser hook
 */
export function useUser() {
  return useUserCompat();
}

/**
 * Hook for organization data (stub for now)
 */
export function useOrganization() {
  const [organization, setOrganization] = useState<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadOrganization = async () => {
      try {
        const token = await getSessionToken();
        if (!token) {
          setIsLoaded(true);
          return;
        }

        const response = await fetch('/api/organizations/my', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setOrganization(data.data);
          }
        }
      } catch (error) {
        console.error('Failed to load organization:', error);
      } finally {
        setIsLoaded(true);
      }
    };

    loadOrganization();
  }, []);

  return {
    organization,
    isLoaded,
  };
}

/**
 * Stub for useClerk hook (not used in PocketBase migration)
 */
export function useClerk() {
  return {
    user: null,
    isLoaded: true,
  };
}

/**
 * Stub SignIn component - redirects to Auth component
 * Note: This is a compatibility stub. The app uses the Auth component instead.
 */
export const SignIn: React.FC<any> = (props: any) => {
  // This is a stub component for Clerk compatibility
  // The actual sign-in is handled by the Auth component
  // If this component is rendered, it means ClerkAuth is being used (legacy)
  return (
    <div style={{ display: 'none' }}>
      {/* Stub component - not used in PocketBase migration */}
    </div>
  );
};

/**
 * Stub SignUp component - redirects to Auth component
 * Note: This is a compatibility stub. The app uses the Auth component instead.
 */
export const SignUp: React.FC<any> = (props: any) => {
  // This is a stub component for Clerk compatibility
  // The actual sign-up is handled by the Auth component
  // If this component is rendered, it means ClerkAuth is being used (legacy)
  return (
    <div style={{ display: 'none' }}>
      {/* Stub component - not used in PocketBase migration */}
    </div>
  );
};
