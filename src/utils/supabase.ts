// Supabase removed - using PocketBase instead
type SupabaseClient = any;
function createClient(_url: string, _key: string): any {
  return { auth: {}, from: () => ({}) };
}
import { projectId, publicAnonKey } from './supabase/info';
import { isSupabaseConfigured, supabase as clientSupabase } from './supabase/client';

// Re-export the configured client from supabase/client.ts
// This ensures consistent handling of missing credentials across the app
export const supabase = clientSupabase;

// Export the configuration flag
export { isSupabaseConfigured };

// Auth helper functions
export const authHelpers = {
  /**
   * Sign up a new user
   */
  async signUp(email: string, password: string, fullName?: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName || '',
        },
        emailRedirectTo: `https://adiology.io/verify-email`,
      },
    });

    if (error) {
      throw error;
    }

    return data;
  },

  /**
   * Sign in an existing user
   */
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    return data;
  },

  /**
   * Sign out the current user
   */
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
  },

  /**
   * Get the current user
   */
  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      throw error;
    }
    return user;
  },

  /**
   * Get the current session
   */
  async getSession() {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      throw error;
    }
    return session;
  },

  /**
   * Verify email with token
   */
  async verifyEmail(token: string, email: string) {
    // For Supabase, email verification is handled via the confirmation link
    // This function can be used to check if email is verified
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      throw error;
    }

    if (user && user.email === email) {
      // Check if email is verified
      if (user.email_confirmed_at) {
        return { verified: true, user };
      }
    }

    return { verified: false, user: null };
  },

  /**
   * Reset password
   */
  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `https://adiology.io/reset-password`,
    });

    if (error) {
      throw error;
    }
  },

  /**
   * Update password
   */
  async updatePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      throw error;
    }
  },

  /**
   * Listen to auth state changes
   */
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });
  },
};

// User profile helper functions
export const userHelpers = {
  /**
   * Get user profile from database
   */
  async getUserProfile(userId: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      throw error;
    }

    return data;
  },

  /**
   * Create or update user profile in database
   */
  async upsertUserProfile(userId: string, profile: {
    email: string;
    full_name?: string;
    subscription_plan?: string;
    subscription_status?: string;
  }) {
    const { data, error } = await supabase
      .from('users')
      .upsert({
        id: userId,
        email: profile.email,
        full_name: profile.full_name || null,
        subscription_plan: profile.subscription_plan || 'free',
        subscription_status: profile.subscription_status || 'active',
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'id',
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  },

  /**
   * Update user subscription
   */
  async updateUserSubscription(userId: string, subscription: {
    plan: string;
    status: string;
    stripe_subscription_id?: string;
    stripe_customer_id?: string;
    current_period_end?: string;
  }) {
    // Update user table
    const { error: userError } = await supabase
      .from('users')
      .update({
        subscription_plan: subscription.plan,
        subscription_status: subscription.status,
        subscription_id: subscription.stripe_subscription_id || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (userError) {
      throw userError;
    }

    // Update or create subscription record
    if (subscription.stripe_subscription_id) {
      const { error: subError } = await supabase
        .from('subscriptions')
        .upsert({
          user_id: userId,
          plan: subscription.plan,
          status: subscription.status,
          stripe_subscription_id: subscription.stripe_subscription_id,
          stripe_customer_id: subscription.stripe_customer_id || null,
          current_period_end: subscription.current_period_end ? new Date(subscription.current_period_end).toISOString() : null,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'stripe_subscription_id',
        });

      if (subError) {
        throw subError;
      }
    }

    return { success: true };
  },
};

