import { loadStripe, Stripe } from '@stripe/stripe-js';

let stripePromise: Promise<Stripe | null> | null = null;
let publishableKey: string | null = null;

async function fetchStripeConfig() {
  if (publishableKey) return publishableKey;
  try {
    const response = await fetch('/api/stripe/config');
    const data = await response.json();
    publishableKey = data.publishableKey;
    return publishableKey;
  } catch (error) {
    console.error('Failed to fetch Stripe config:', error);
    return import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || null;
  }
}

export const getStripe = async () => {
  if (!stripePromise) {
    const key = await fetchStripeConfig();
    if (key) {
      stripePromise = loadStripe(key);
    } else {
      return null;
    }
  }
  return stripePromise;
};

/**
 * Create a Stripe Checkout session for subscription
 */
export async function createCheckoutSession(priceId: string, planName: string, userId?: string, userEmail?: string) {
  try {
    let currentUserId = userId;
    let currentUserEmail = userEmail;
    
    if (!currentUserId || !currentUserEmail) {
      try {
        const { getCurrentAuthUser } = await import('./auth');
        const user = await getCurrentAuthUser();
        currentUserId = currentUserId || user?.id;
        currentUserEmail = currentUserEmail || user?.email;
      } catch (e) {
        console.warn('Could not get current user:', e);
      }
    }

    if (!currentUserEmail) {
      throw new Error('Please sign in to subscribe');
    }

    const response = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        priceId,
        planName,
        userId: currentUserId,
        email: currentUserEmail,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to create checkout session: ${response.statusText}`);
    }

    const { sessionId, url } = await response.json();
    
    if (url) {
      window.location.href = url;
      return;
    }
    
    if (!sessionId) {
      throw new Error('No session ID returned from server');
    }

    const stripe = await getStripe();
    
    if (!stripe) {
      throw new Error('Stripe failed to load');
    }

    const { error } = await (stripe as any).redirectToCheckout({ sessionId });
    
    if (error) {
      throw new Error(error.message || 'Failed to redirect to checkout');
    }
  } catch (error) {
    console.error('Error creating checkout session:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unexpected error occurred. Please try again or contact support.');
  }
}

/**
 * Create a Stripe Customer Portal session for managing subscription
 */
export async function createCustomerPortalSession() {
  try {
    let customerEmail = '';
    
    try {
      const { getCurrentAuthUser } = await import('./auth');
      const user = await getCurrentAuthUser();
      customerEmail = user?.email || '';
    } catch (e) {
      console.error('Error getting user email:', e);
    }

    if (!customerEmail) {
      throw new Error('Please sign in to manage your subscription');
    }

    const response = await fetch('/api/stripe/portal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: customerEmail,
        returnUrl: window.location.origin + '/billing',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to open billing portal');
    }

    const { url } = await response.json();
    
    if (!url) {
      throw new Error('Billing portal is not available. Please contact support.');
    }
    
    window.location.href = url;
  } catch (error) {
    console.error('Error creating portal session:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unexpected error occurred. Please try again or contact support.');
  }
}

/**
 * Fetch available products and prices from the server
 */
export async function fetchProducts() {
  try {
    const response = await fetch('/api/stripe/products');
    if (!response.ok) {
      throw new Error('Failed to fetch products');
    }
    const { products } = await response.json();
    return products;
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

/**
 * Get price ID for a plan by name and billing interval
 */
export async function getPriceIdForPlan(planName: string, interval: 'month' | 'year' = 'month'): Promise<string | null> {
  const products = await fetchProducts();
  const product = products.find((p: any) => 
    p.name.toLowerCase() === planName.toLowerCase()
  );
  
  if (!product) return null;
  
  // For one-time prices (like Lifetime), find price without recurring interval
  const price = product.prices.find((p: any) => {
    if (!p.active) return false;
    // If no recurring, this is a one-time price - match any interval request
    if (!p.recurring) return true;
    // Otherwise match the interval
    return p.recurring.interval === interval;
  });
  
  return price?.id || null;
}

