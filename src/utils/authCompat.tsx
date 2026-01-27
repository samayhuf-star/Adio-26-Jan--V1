/**
 * Compatibility layer for authentication
 * Provides hooks/utilities for Nhost authentication
 */

import React, { useState, useEffect } from 'react';
import { useAuthenticationStatus, useUserData, useAccessToken } from '@nhost/react';

/**
 * Hook-like function that returns getToken (for components that used useAuth)
 */
export function useAuthCompat() {
  const { isAuthenticated } = useAuthenticationStatus();
  const accessToken = useAccessToken();

  return {
    getToken: async () => {
      return accessToken || null;
    },
    isLoaded: true,
    isSignedIn: isAuthenticated,
  };
}

/**
 * Hook-like function that returns user (for components that used useUser)
 */
export function useUserCompat() {
  const user = useUserData();
  const { isAuthenticated, isLoading } = useAuthenticationStatus();

  return {
    user,
    isLoaded: !isLoading,
    isSignedIn: isAuthenticated,
  };
}

/**
 * Alias for useAuthCompat - provides useAuth hook
 */
export function useAuth() {
  const authCompat = useAuthCompat();
  return {
    getToken: authCompat.getToken,
    isSignedIn: authCompat.isSignedIn,
    isLoaded: authCompat.isLoaded,
  };
}

/**
 * Alias for useUserCompat - provides useUser hook
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
  const accessToken = useAccessToken();

  useEffect(() => {
    const loadOrganization = async () => {
      try {
        if (!accessToken) {
          setIsLoaded(true);
          return;
        }

        const response = await fetch('/api/organizations/my', {
          headers: { 'Authorization': `Bearer ${accessToken}` }
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
  }, [accessToken]);

  return {
    organization,
    isLoaded,
  };
}

/**
 * Stub for useClerk hook (legacy compatibility)
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
  // This is a stub component for compatibility
  // The actual sign-in is handled by the Auth component
  return (
    <div style={{ display: 'none' }}>
      {/* Stub component - not used */}
    </div>
  );
};

/**
 * Stub SignUp component - redirects to Auth component
 * Note: This is a compatibility stub. The app uses the Auth component instead.
 */
export const SignUp: React.FC<any> = (props: any) => {
  // This is a stub component for compatibility
  // The actual sign-up is handled by the Auth component
  return (
    <div style={{ display: 'none' }}>
      {/* Stub component - not used */}
    </div>
  );
};
