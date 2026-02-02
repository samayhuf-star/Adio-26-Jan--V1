/**
 * Environment Variable Check Utility
 * 
 * Validates that all required environment variables are present.
 * Shows a configuration error if any are missing.
 * 
 * Note: The app uses hardcoded values in info.tsx as fallback,
 * so this check is mainly for validation purposes.
 */

import { validateEnvironment as validateEnv, getEnvVarSafe } from './envValidation';

export function checkRequiredEnvVars(): { valid: boolean; missing: string[] } {
  const validation = validateEnv();
  
  if (validation.missing.length > 0) {
    console.error('❌ Missing required environment variables:', validation.missing);
  } else if (validation.warnings.length > 0) {
    console.warn('⚠️ Missing optional environment variables:', validation.warnings);
  } else {
    if (import.meta.env.DEV) {
      console.log('✅ Environment variables loaded');
    }
  }
  
  return { valid: validation.valid, missing: validation.missing };
}

/**
 * Check if we're in a valid environment
 */
export function validateEnvironment(): boolean {
  const validation = validateEnv();
  
  if (!validation.valid) {
    console.error('❌ Environment validation failed. Missing:', validation.missing);
    return false;
  }
  
  // Only show optional env warnings in dev (suppress in production to avoid console noise)
  if (validation.warnings.length > 0 && import.meta.env.DEV) {
    console.warn('⚠️ Optional environment variables not set:', validation.warnings);
  }
  
  return true;
}

