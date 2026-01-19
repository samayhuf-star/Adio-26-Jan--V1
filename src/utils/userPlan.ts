/**
 * User Plan Utility
 * Centralized functions to check user plan status and access rights
 */

import { getCurrentUserProfile } from './auth';

/**
 * Check if user has a paid plan
 */
export async function isPaidUser(): Promise<boolean> {
  try {
    const userProfile = await getCurrentUserProfile();
    if (!userProfile) return false;
      
    const plan = userProfile.subscription_plan || 'free';
    return plan !== 'free' && plan !== null && plan !== undefined;
  } catch (e) {
    console.error('Error checking user plan:', e);
    return false;
  }
}

/**
 * Get user's current plan name
 */
export async function getUserPlan(): Promise<string> {
  try {
    const userProfile = await getCurrentUserProfile();
    if (!userProfile) return 'Free';
    
    const plan = userProfile.subscription_plan || 'free';
    
    // Map database plan to display format
    const planMap: Record<string, string> = {
      'free': 'Free',
      'starter': 'Starter',
      'starter_monthly': 'Starter',
      'starter_yearly': 'Starter (Yearly)',
      'professional': 'Professional',
      'professional_monthly': 'Professional',
      'professional_yearly': 'Professional (Yearly)',
      'agency': 'Agency',
      'agency_monthly': 'Agency',
      'agency_yearly': 'Agency (Yearly)',
      'enterprise': 'Agency',
      'lifetime_limited': 'Starter',
      'lifetime_unlimited': 'Agency',
      'monthly_limited': 'Starter',
      'monthly_unlimited': 'Professional',
    };
      
    return planMap[plan] || plan.charAt(0).toUpperCase() + plan.slice(1);
  } catch (e) {
    console.error('Error getting user plan:', e);
    return 'Free';
  }
}

/**
 * Check if user has access to a feature
 * For now, all paid users have access to all features
 */
export async function hasFeatureAccess(feature: string): Promise<boolean> {
  // All paid users have access to all features
  if (await isPaidUser()) {
    return true;
  }
  
  // Free users have limited access
  // Add specific feature restrictions here if needed
  return true; // For now, free users also have access (no paywalls)
}

