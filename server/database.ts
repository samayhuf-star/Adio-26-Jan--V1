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
 * Verify a user token - DEVELOPMENT STUB
 *
 * This is a temporary implementation so that auth-protected routes
 * (Projects, Teams, etc.) work without a real auth provider.
 *
 * IMPORTANT: This treats ANY non-empty token as a valid user.
 * Do NOT rely on this for production security.
 */
export async function verifyUserToken(
  token: string
): Promise<{ authorized: boolean; userId?: string; userEmail?: string; error?: string }> {
  if (!token) {
    return { authorized: false, error: 'Missing auth token' };
  }

  // Dev-mode: trust any token and derive a synthetic user from it
  console.warn('Database: using development stub for verifyUserToken - all non-empty tokens are treated as valid.');

  const userId = token;
  const userEmail = `${token}@local.dev`;

  return {
    authorized: true,
    userId,
    userEmail,
  };
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
