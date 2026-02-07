import React, { useState, useEffect } from 'react';
import { Check, Zap, Star, Crown, Loader2 } from 'lucide-react';
import { useUserCompat, useAuthCompat } from '../utils/authCompat';
import { notifications } from '../utils/notifications';

interface Price {
  id: string;
  unit_amount: number;
  currency: string;
  recurring: { interval: string } | null;
  metadata: any;
}

interface Product {
  id: string;
  name: string;
  description: string;
  metadata: any;
  prices: Price[];
}

interface BillingPageProps {
  onBack?: () => void;
}

const PLAN_ICONS: Record<string, React.ReactNode> = {
  starter: <Zap className="w-6 h-6 text-blue-500" />,
  pro: <Star className="w-6 h-6 text-purple-500" />,
  enterprise: <Crown className="w-6 h-6 text-amber-500" />,
};

const PLAN_COLORS: Record<string, string> = {
  starter: 'border-blue-200 hover:border-blue-400',
  pro: 'border-purple-200 hover:border-purple-400 ring-2 ring-purple-100',
  enterprise: 'border-amber-200 hover:border-amber-400',
};

const PLAN_FEATURES: Record<string, string[]> = {
  starter: [
    '10 campaigns per month',
    '1,000 keywords',
    'Basic keyword generation',
    'CSV export',
    'Email support',
  ],
  pro: [
    'Unlimited campaigns',
    'Unlimited keywords',
    'AI-powered keyword suggestions',
    'Ad extensions generation',
    'Priority support',
  ],
  enterprise: [
    'Everything in Pro',
    'White-label options',
    'API access',
    'Custom integrations',
    'Dedicated account manager',
    'SLA guarantee',
  ],
};

export const BillingPage: React.FC<BillingPageProps> = ({ onBack }) => {
  const { user, isLoaded: isUserLoaded } = useUserCompat();
  const { getToken } = useAuthCompat();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [currentPlan, setCurrentPlan] = useState<string>('free');
  
  // Get email from user object (works with new auth system)
  const userEmail = user?.email || user?.primaryEmailAddress?.emailAddress || '';

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    if (isUserLoaded && userEmail) {
      loadCurrentSubscription();
    }
  }, [isUserLoaded, userEmail]);

  const loadProducts = async () => {
    try {
      const response = await fetch('/api/stripe/products');
      const data = await response.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error('Error loading products:', error);
      notifications.error('Failed to load pricing plans');
    } finally {
      setLoading(false);
    }
  };

  const loadCurrentSubscription = async () => {
    if (!userEmail) return;
    try {
      const token = await getToken();
      // Use auth token - email is optional in URL now
      const url = token 
        ? `/api/stripe/subscription` 
        : `/api/stripe/subscription/${encodeURIComponent(userEmail)}`;
      const response = await fetch(url, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const data = await response.json();
      setCurrentPlan(data.plan || 'free');
    } catch (error) {
      console.error('Error loading subscription:', error);
    }
  };

  const handleCheckout = async (priceId: string) => {
    if (!userEmail) {
      notifications.error('Please sign in to subscribe');
      return;
    }

    setCheckoutLoading(priceId);
    try {
      const token = await getToken();
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({
          priceId,
          email: userEmail,
          userId: user?.id,
        }),
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'Failed to create checkout session');
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      notifications.error(error.message || 'Failed to start checkout');
    } finally {
      setCheckoutLoading(null);
    }
  };

  const handleManageBilling = async () => {
    if (!userEmail) {
      notifications.error('Please sign in first');
      return;
    }

    try {
      const token = await getToken();
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({ email: userEmail }),
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'Failed to open billing portal');
      }
    } catch (error: any) {
      console.error('Portal error:', error);
      notifications.error(error.message || 'Failed to open billing portal');
    }
  };

  const getPrice = (product: Product): Price | undefined => {
    return product.prices.find(p => 
      p.recurring?.interval === (billingPeriod === 'monthly' ? 'month' : 'year')
    );
  };

  const formatPrice = (amount: number, currency: string): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 0,
    }).format(amount / 100);
  };

  const getTier = (product: Product): string => {
    return product.metadata?.tier || product.name.toLowerCase().split(' ').pop() || 'starter';
  };

  if (loading || !isUserLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const sortedProducts = [...products].sort((a, b) => {
    const tierOrder = { starter: 1, pro: 2, enterprise: 3 };
    return (tierOrder[getTier(a) as keyof typeof tierOrder] || 99) - 
           (tierOrder[getTier(b) as keyof typeof tierOrder] || 99);
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {onBack && (
          <button
            onClick={onBack}
            className="mb-6 text-gray-600 hover:text-gray-900 flex items-center gap-2"
          >
            Back
          </button>
        )}

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Choose the plan that's right for your business
          </p>

          <div className="inline-flex items-center gap-3 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                billingPeriod === 'monthly'
                  ? 'bg-white shadow text-gray-900'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod('yearly')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                billingPeriod === 'yearly'
                  ? 'bg-white shadow text-gray-900'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Yearly
              <span className="ml-2 text-xs text-indigo-600 font-semibold">Save 17%</span>
            </button>
          </div>
        </div>

        {currentPlan !== 'free' && (
          <div className="mb-8 p-4 bg-indigo-50 border border-indigo-200 rounded-lg text-center">
            <p className="text-green-800">
              You're currently on the <span className="font-semibold capitalize">{currentPlan}</span> plan.
              <button
                onClick={handleManageBilling}
                className="ml-2 text-indigo-600 underline hover:text-indigo-700"
              >
                Manage billing
              </button>
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white rounded-2xl border-2 border-gray-200 p-8 hover:border-gray-400 transition">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <Check className="w-5 h-5 text-gray-500" />
              </div>
              <h3 className="text-xl font-bold">Free</h3>
            </div>
            <div className="mb-6">
              <span className="text-4xl font-bold">$0</span>
              <span className="text-gray-500">/month</span>
            </div>
            <p className="text-gray-600 mb-6">
              Get started with basic campaign building features.
            </p>
            <ul className="space-y-3 mb-8">
              {['3 campaigns per month', '100 keywords', 'Basic CSV export', 'Community support'].map((feature, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                  <Check className="w-4 h-4 text-green-500" />
                  {feature}
                </li>
              ))}
            </ul>
            <button
              disabled={currentPlan === 'free'}
              className={`w-full py-3 rounded-lg font-medium ${
                currentPlan === 'free'
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {currentPlan === 'free' ? 'Current Plan' : 'Downgrade'}
            </button>
          </div>

          {sortedProducts.map((product) => {
            const tier = getTier(product);
            const price = getPrice(product);
            const isCurrentPlan = currentPlan === tier;
            const isPro = tier === 'pro';

            return (
              <div
                key={product.id}
                className={`bg-white rounded-2xl border-2 p-8 transition relative ${PLAN_COLORS[tier] || 'border-gray-200'}`}
              >
                {isPro && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    Most Popular
                  </div>
                )}
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    tier === 'starter' ? 'bg-blue-100' :
                    tier === 'pro' ? 'bg-purple-100' : 'bg-amber-100'
                  }`}>
                    {PLAN_ICONS[tier]}
                  </div>
                  <h3 className="text-xl font-bold">{product.name.replace('Adiology ', '')}</h3>
                </div>
                <div className="mb-6">
                  {price ? (
                    <>
                      <span className="text-4xl font-bold">
                        {formatPrice(price.unit_amount, price.currency)}
                      </span>
                      <span className="text-gray-500">
                        /{billingPeriod === 'monthly' ? 'mo' : 'yr'}
                      </span>
                    </>
                  ) : (
                    <span className="text-2xl font-bold">Contact us</span>
                  )}
                </div>
                <p className="text-gray-600 mb-6 text-sm">
                  {product.description}
                </p>
                <ul className="space-y-3 mb-8">
                  {(PLAN_FEATURES[tier] || []).map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                      <Check className={`w-4 h-4 ${
                        tier === 'starter' ? 'text-blue-500' :
                        tier === 'pro' ? 'text-purple-500' : 'text-amber-500'
                      }`} />
                      {feature}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => price && handleCheckout(price.id)}
                  disabled={isCurrentPlan || checkoutLoading === price?.id}
                  className={`w-full py-3 rounded-lg font-medium transition ${
                    isCurrentPlan
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : tier === 'pro'
                        ? 'bg-purple-600 text-white hover:bg-purple-700'
                        : tier === 'enterprise'
                          ? 'bg-amber-600 text-white hover:bg-amber-700'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {checkoutLoading === price?.id ? (
                    <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                  ) : isCurrentPlan ? (
                    'Current Plan'
                  ) : (
                    'Get Started'
                  )}
                </button>
              </div>
            );
          })}
        </div>

        <div className="mt-16 text-center">
          <p className="text-gray-500 text-sm">
            All plans include 14-day free trial. Cancel anytime. Need a custom plan?{' '}
            <a href="mailto:support@adiology.io" className="text-indigo-600 hover:underline">
              Contact sales
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};
