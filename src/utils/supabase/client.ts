// Supabase removed - using PocketBase instead
// Stub for compatibility
type SupabaseClient = any;
function createClient(_url: string, _key: string, _options?: any): any {
  console.warn('Supabase client is deprecated. Use PocketBase instead.');
  return {
    auth: {
      getSession: () => Promise.resolve({ data: { session: null } }),
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
    },
  };
}
import { projectId, publicAnonKey } from './info';

// Check if Supabase credentials are available
const supabaseUrl = projectId ? `https://${projectId}.supabase.co` : '';
const supabaseKey = publicAnonKey || '';

// Flag to indicate if Supabase is properly configured
export const isSupabaseConfigured = !!(supabaseUrl && supabaseKey && projectId);

// Create Supabase client only if credentials are available
// If not configured, create a mock client that won't crash
let supabaseInstance: SupabaseClient | null = null;

if (isSupabaseConfigured) {
  try {
    supabaseInstance = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
      },
    });
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error);
  }
}

// Export a client that handles the unconfigured case gracefully
export const supabase = supabaseInstance || createMockClient();

// Create a mock Supabase client for when credentials are missing
function createMockClient(): any {
  const mockError = { message: 'Supabase not configured. Please check environment variables.' };
  
  return {
    auth: {
      getUser: async () => ({ data: { user: null }, error: mockError }),
      getSession: async () => ({ data: { session: null }, error: mockError }),
      signIn: async () => ({ data: null, error: mockError }),
      signUp: async () => ({ data: null, error: mockError }),
      signOut: async () => ({ error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signInWithPassword: async () => ({ data: null, error: mockError }),
      resetPasswordForEmail: async () => ({ error: mockError }),
      updateUser: async () => ({ error: mockError }),
    },
    from: () => ({
      select: () => ({ data: null, error: mockError, single: () => ({ data: null, error: mockError }) }),
      insert: () => ({ data: null, error: mockError }),
      update: () => ({ eq: () => ({ data: null, error: mockError }) }),
      upsert: () => ({ data: null, error: mockError, select: () => ({ single: () => ({ data: null, error: mockError }) }) }),
      delete: () => ({ eq: () => ({ data: null, error: mockError }) }),
    }),
  };
}

// Helper function to check if user is super admin
export async function isSuperAdmin(): Promise<boolean> {
  try {
    // Check for test admin mode first
    const testAdminMode = sessionStorage.getItem('test_admin_mode');
    const testAdminEmail = sessionStorage.getItem('test_admin_email');
    if (testAdminMode === 'true' || testAdminEmail === 'oadiology@gmail.com') {
      return true;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    // Check if it's the special admin email
    if (user.email === 'oadiology@gmail.com') {
      return true;
    }

    const { data, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (error || !data) return false;
    return data.role === 'superadmin';
  } catch (error) {
    console.error('Error checking super admin status:', error);
    return false;
  }
}

// Helper function to get current user
export async function getCurrentUser() {
  try {
    // Check for test admin mode first
    const testAdminMode = sessionStorage.getItem('test_admin_mode');
    const testAdminEmail = sessionStorage.getItem('test_admin_email');
    if (testAdminMode === 'true' && testAdminEmail) {
      return {
        id: 'test-admin-' + Date.now(),
        email: testAdminEmail,
        full_name: 'Admin User',
        role: 'superadmin',
        subscription_plan: 'enterprise',
        subscription_status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Handle special admin email
    if (user.email === 'oadiology@gmail.com') {
      return {
        id: user.id,
        email: user.email,
        full_name: 'Adiology Admin',
        role: 'superadmin',
        subscription_plan: 'enterprise',
        subscription_status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    }

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error fetching user:', error);
      return null;
    }

    return data;
  } catch (error: any) {
    // Only log if it's not a session missing error (expected when not logged in)
    if (error?.name !== 'AuthSessionMissingError' && !error?.message?.includes('session_missing')) {
      console.error('Error getting current user:', error);
    }
    return null;
  }
}

