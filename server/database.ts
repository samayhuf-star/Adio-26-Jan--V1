/**
 * Database authentication stub - replaced PocketBase
 * Server-side authentication functions - to be replaced with Nhost
 */

export interface User {
  id: string;
  email: string;
  role?: string;
  [key: string]: any;
}

// Stub admin client (replaces PocketBase admin)
export const pbAdmin = {
  collection: (_name: string) => ({
    update: async (_id: string, _data: any) => ({ id: _id }),
    getOne: async (_id: string) => null,
    getList: async (_page?: number, _perPage?: number) => ({ items: [], totalItems: 0 }),
  }),
  authStore: {
    isValid: false,
    model: null,
  },
  admins: {
    authWithPassword: async (_email: string, _password: string) => {
      console.warn('Database: Admin auth not implemented. Please integrate Nhost authentication.');
      return { token: '', admin: null };
    },
  },
};

/**
 * Verify a user token - stub implementation
 * TODO: Replace with Nhost token verification
 * For now, this is a placeholder that will need proper token verification
 */
export async function verifyUserToken(
  token: string
): Promise<{ authorized: boolean; userId?: string; userEmail?: string; error?: string }> {
  // TODO: Implement proper token verification with Nhost
  // For now, return false - this will need to be replaced with actual Nhost token verification
  console.warn('Database: verifyUserToken not implemented. Please integrate Nhost authentication.');
  return { authorized: false, error: 'Authentication not configured' };
}

/**
 * Get user by ID - stub implementation
 * TODO: Replace with Nhost user lookup
 */
export async function getUserById(_userId: string): Promise<User | null> {
  console.warn('Database: getUserById not implemented.');
  return null;
}

/**
 * Update user profile - stub implementation
 * TODO: Replace with Nhost user update
 */
export async function updateUserProfile(
  _userId: string,
  _data: Partial<User>
): Promise<{ data: User | null; error: { message: string } | null }> {
  console.warn('Database: updateUserProfile not implemented.');
  return { data: null, error: { message: 'Not implemented' } };
}
