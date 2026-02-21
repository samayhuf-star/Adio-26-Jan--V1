import React, { useState, useEffect } from 'react';
import { getCurrentUser, getSessionTokenSync, isAuthenticated as checkIsAuthenticated } from './auth';

export function useAuthCompat() {
  return {
    getToken: async () => {
      return getSessionTokenSync();
    },
    isLoaded: true,
    isSignedIn: checkIsAuthenticated(),
  };
}

export function useUserCompat() {
  const user = getCurrentUser();

  return {
    user,
    isLoaded: true,
    isSignedIn: checkIsAuthenticated(),
  };
}

export function useAuth() {
  const authCompat = useAuthCompat();
  return {
    getToken: authCompat.getToken,
    isSignedIn: authCompat.isSignedIn,
    isLoaded: authCompat.isLoaded,
  };
}

export function useUser() {
  return useUserCompat();
}

export function useOrganization() {
  const [organization, setOrganization] = useState<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadOrganization = async () => {
      try {
        const token = getSessionTokenSync();
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

export function useClerk() {
  return {
    user: null,
    isLoaded: true,
  };
}

export const SignIn: React.FC<any> = (props: any) => {
  return (
    <div style={{ display: 'none' }}>
    </div>
  );
};

export const SignUp: React.FC<any> = (props: any) => {
  return (
    <div style={{ display: 'none' }}>
    </div>
  );
};
