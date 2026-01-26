/**
 * Production Environment Variable Validation
 * Ensures all required environment variables are set before the app starts
 */

interface EnvConfig {
  required: string[];
  optional: string[];
  defaults: Record<string, string>;
}

const envConfig: EnvConfig = {
  required: [
    // Add critical environment variables here
    // 'DATABASE_URL', // Uncomment if database URL is required
  ],
  optional: [
    'VITE_NHOST_SUBDOMAIN',
    'VITE_NHOST_REGION',
    'STRIPE_SECRET_KEY',
    'STRIPE_PUBLISHABLE_KEY',
  ],
  defaults: {
    NODE_ENV: 'development',
    PORT: '3001',
    VITE_API_URL: 'http://localhost:3001',
  },
};

export function validateEnvironment(): {
  valid: boolean;
  missing: string[];
  warnings: string[];
} {
  const missing: string[] = [];
  const warnings: string[] = [];

  // Check required variables
  for (const key of envConfig.required) {
    const value = getEnvVar(key);
    if (!value || value === 'undefined' || value === '') {
      missing.push(key);
    }
  }

  // Check optional variables and warn if missing in production
  if (import.meta.env.PROD) {
    for (const key of envConfig.optional) {
      const value = getEnvVar(key);
      if (!value || value === 'undefined' || value === '') {
        warnings.push(key);
      }
    }
  }

  return {
    valid: missing.length === 0,
    missing,
    warnings,
  };
}

function getEnvVar(key: string): string {
  // Check Vite env first (for browser/build)
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    const viteValue = import.meta.env[key];
    if (viteValue && viteValue !== 'undefined') return viteValue;
  }
  // Check Node.js process.env (for SSR/server)
  if (typeof process !== 'undefined' && process.env) {
    const nodeValue = process.env[key];
    if (nodeValue && nodeValue !== 'undefined') return nodeValue;
  }
  // Check defaults
  return envConfig.defaults[key] || '';
}

export function getEnvVarSafe(key: string, defaultValue: string = ''): string {
  const value = getEnvVar(key);
  return value || defaultValue;
}

export function requireEnvVar(key: string): string {
  const value = getEnvVar(key);
  if (!value || value === 'undefined' || value === '') {
    throw new Error(`Required environment variable ${key} is not set`);
  }
  return value;
}
