import Stripe from 'stripe';
import { getDatabaseUrl } from './dbConfig';

let connectionSettings: any;

async function getCredentials(): Promise<{ publishableKey: string; secretKey: string } | null> {
  // First, try standard Stripe environment variables (production-ready)
  const standardSecretKey = process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY_LIVE || process.env.STRIPE_SECRET_KEY_TEST;
  const standardPublishableKey = process.env.STRIPE_PUBLISHABLE_KEY || process.env.STRIPE_PUBLISHABLE_KEY_LIVE || process.env.STRIPE_PUBLISHABLE_KEY_TEST;
  
  if (standardSecretKey && standardPublishableKey) {
    console.log('Using Stripe keys from environment variables');
    return {
      publishableKey: standardPublishableKey,
      secretKey: standardSecretKey,
    };
  }

  // Fallback to Replit connectors (if available)
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? 'repl ' + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
      ? 'depl ' + process.env.WEB_REPL_RENEWAL
      : null;

  if (!hostname || !xReplitToken) {
    console.log('Stripe: No credentials found (env vars or Replit connectors not available). Stripe features disabled.');
    return null;
  }

  const connectorName = 'stripe';
  const isProduction = process.env.REPLIT_DEPLOYMENT === '1';
  
  // Try production first, then fall back to development
  const environmentsToTry = isProduction ? ['production', 'development'] : ['development', 'production'];
  
  for (const targetEnvironment of environmentsToTry) {
    try {
      const url = new URL(`https://${hostname}/api/v2/connection`);
      url.searchParams.set('include_secrets', 'true');
      url.searchParams.set('connector_names', connectorName);
      url.searchParams.set('environment', targetEnvironment);

      const response = await fetch(url.toString(), {
        headers: {
          'Accept': 'application/json',
          'X_REPLIT_TOKEN': xReplitToken
        }
      });

      const data = await response.json();
      
      connectionSettings = data.items?.[0];

      if (connectionSettings?.settings?.publishable && connectionSettings?.settings?.secret) {
        console.log(`Using Stripe ${targetEnvironment} connection from Replit connectors`);
        return {
          publishableKey: connectionSettings.settings.publishable,
          secretKey: connectionSettings.settings.secret,
        };
      }
    } catch (err) {
      console.log(`Stripe: Failed to fetch ${targetEnvironment} credentials from Replit connectors`);
    }
  }

  console.log('Stripe: No valid connection found. Stripe features will be disabled.');
  return null;
}

export async function getUncachableStripeClient(): Promise<Stripe | null> {
  const credentials = await getCredentials();
  if (!credentials) return null;

  return new Stripe(credentials.secretKey, {
    apiVersion: '2025-08-27.basil' as any,
  });
}

export async function getStripePublishableKey(): Promise<string | null> {
  const credentials = await getCredentials();
  return credentials?.publishableKey ?? null;
}

export async function getStripeSecretKey(): Promise<string | null> {
  const credentials = await getCredentials();
  return credentials?.secretKey ?? null;
}

let stripeSync: any = null;

export async function getStripeSync(): Promise<any | null> {
  if (!stripeSync) {
    const secretKey = await getStripeSecretKey();
    if (!secretKey) {
      console.log('Stripe: Cannot initialize StripeSync without credentials');
      return null;
    }

    const { StripeSync } = await import('stripe-replit-sync');
    stripeSync = new StripeSync({
      poolConfig: {
        connectionString: getDatabaseUrl(),
        max: 2,
      },
      stripeSecretKey: secretKey,
    });
  }
  return stripeSync;
}
