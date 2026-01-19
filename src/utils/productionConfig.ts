/**
 * Production Configuration
 * Centralized configuration for production environment
 */

export const productionConfig = {
  // Feature flags
  features: {
    signupEnabled: true,
    paymentsEnabled: true,
    keywordGenerationEnabled: true,
    aiEnabled: true,
  },

  // API Configuration
  api: {
    // Timeout for API calls (ms)
    timeout: 30000,
    // Retry attempts
    retryAttempts: 3,
    // Retry delay (ms)
    retryDelay: 1000,
  },

  // Error Handling
  errorHandling: {
    // Show detailed errors in development
    showDetailedErrors: import.meta.env.DEV,
    // Log errors to console in development
    logToConsole: import.meta.env.DEV,
    // Send errors to tracking service in production
    trackErrors: !import.meta.env.DEV,
  },

  // User Limits (can be overridden by subscription plan)
  limits: {
    free: {
      campaignsPerMonth: 3,
      keywordsPerGeneration: 50,
      csvExportsPerDay: 5,
    },
    lifetimeLimited: {
      campaignsPerMonth: 15,
      keywordsPerGeneration: 500,
      csvExportsPerDay: 100,
    },
    lifetimeUnlimited: {
      campaignsPerMonth: -1, // Unlimited
      keywordsPerGeneration: 1000,
      csvExportsPerDay: -1, // Unlimited
    },
    monthlyLimited: {
      campaignsPerMonth: 25,
      keywordsPerGeneration: 500,
      csvExportsPerDay: 100,
    },
    monthlyUnlimited: {
      campaignsPerMonth: -1, // Unlimited
      keywordsPerGeneration: 1000,
      csvExportsPerDay: -1, // Unlimited
    },
  },

  // Notification Settings
  notifications: {
    // Show success notifications
    showSuccess: true,
    // Show error notifications
    showErrors: true,
    // Show info notifications
    showInfo: true,
    // Auto-dismiss delay (ms)
    autoDismissDelay: 5000,
  },

  // Analytics (if configured)
  analytics: {
    enabled: false,
    // Add your analytics tracking ID here
    trackingId: import.meta.env.VITE_ANALYTICS_ID || '',
  },
};

/**
 * Check if feature is enabled
 */
export function isFeatureEnabled(feature: keyof typeof productionConfig.features): boolean {
  return productionConfig.features[feature];
}

/**
 * Get user limits based on plan
 */
export function getUserLimits(plan: string) {
  const planKey = plan.toLowerCase().replace(/\s+/g, '') as keyof typeof productionConfig.limits;
  return productionConfig.limits[planKey] || productionConfig.limits.free;
}

/**
 * Check if user has reached limit
 */
export function checkLimit(
  plan: string,
  limitType: 'campaignsPerMonth' | 'keywordsPerGeneration' | 'csvExportsPerDay',
  currentUsage: number
): { allowed: boolean; limit: number; remaining: number } {
  const limits = getUserLimits(plan);
  const limit = limits[limitType];

  // Unlimited
  if (limit === -1) {
    return { allowed: true, limit: -1, remaining: -1 };
  }

  const remaining = Math.max(0, limit - currentUsage);
  return {
    allowed: remaining > 0,
    limit,
    remaining,
  };
}

