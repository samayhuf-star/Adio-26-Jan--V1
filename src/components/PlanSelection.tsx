import React, { useState, useEffect } from 'react';
import { Check, ArrowLeft, Sparkle, Crown, Zap, Rocket, Loader2 } from 'lucide-react';

// Dynamic import wrapper for framer-motion to avoid build-time resolution issues
const MotionDiv = ({ children, ...props }: any) => {
  const [Motion, setMotion] = useState<any>(null);
  
  useEffect(() => {
    import('framer-motion').then(({ motion }) => {
      setMotion(() => motion.div);
    });
  }, []);
  
  if (!Motion) {
    return <div {...props}>{children}</div>;
  }
  
  return <Motion {...props}>{children}</Motion>;
};
import { Button } from './ui/button';

// API calls use Vite proxy (relative URLs forward to backend on port 3001)

interface StripePrice {
  id: string;
  unit_amount: number;
  currency: string;
  recurring: { interval: string } | null;
}

interface StripeProduct {
  id: string;
  name: string;
  description: string;
  prices: StripePrice[];
}

interface PlanData {
  name: string;
  displayName: string;
  price: string;
  period: string;
  priceId: string;
  amount: number;
  isSubscription: boolean;
  features: string[];
  icon: any;
  color: string;
  borderColor: string;
  buttonStyle: string;
  popular: boolean;
  savings?: string;
}

const planConfig: Record<string, Omit<PlanData, 'price' | 'priceId' | 'amount'>> = {
  'Basic Monthly': {
    name: 'Basic Monthly',
    displayName: 'Basic',
    period: 'per month',
    isSubscription: true,
    features: [
      '25 Campaigns/month',
      '2 Team Members',
      'Dashboard & 1-Click Builder',
      'Builder 3.0 & Preset Campaigns',
      'Full Draft/Custom Campaigns',
      'Keyword Planner & Mixer',
      'Email Support (24-48h)',
      '7-day free trial'
    ],
    icon: Rocket,
    color: 'from-blue-500 to-cyan-500',
    borderColor: 'border-blue-200',
    buttonStyle: 'bg-gray-900 text-white hover:bg-gray-800',
    popular: false
  },
  'Pro Monthly': {
    name: 'Pro Monthly',
    displayName: 'Pro',
    period: 'per month',
    isSubscription: true,
    features: [
      'Unlimited Campaigns',
      '5 Team Members',
      'All Builder Features',
      'Full Draft/Custom Campaigns',
      'All Keyword Tools',
      'Priority Support Queue',
      '24/7 Priority Support',
      '7-day free trial'
    ],
    icon: Zap,
    color: 'from-purple-500 to-pink-500',
    borderColor: 'border-purple-300',
    buttonStyle: 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-xl',
    popular: true
  },
  'Lifetime': {
    name: 'Lifetime',
    displayName: 'Lifetime',
    period: 'one-time',
    isSubscription: false,
    features: [
      'Unlimited Campaigns Forever',
      'Unlimited Team Members',
      'All Professional Features',
      'Dedicated Account Manager',
      'Priority Support (1h+)',
      'CSV Export & Live Ad Preview',
      'Early Access to New Features',
      '7-day free trial'
    ],
    icon: Crown,
    color: 'from-amber-500 to-orange-500',
    borderColor: 'border-amber-200',
    buttonStyle: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:shadow-xl',
    popular: false
  }
};

const planOrder = ['Basic Monthly', 'Pro Monthly', 'Lifetime'];

interface PlanSelectionProps {
  onSelectPlan: (planName: string, priceId: string, amount: number, isSubscription: boolean) => void;
  onBack?: () => void;
  userName?: string;
}

export const PlanSelection: React.FC<PlanSelectionProps> = ({ 
  onSelectPlan, 
  onBack,
  userName 
}) => {
  const [plans, setPlans] = useState<PlanData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPrices();
  }, []);

  const fetchPrices = async () => {
    try {
      setLoading(true);
      // Use relative URL - Vite proxy forwards /api to backend
      const response = await fetch('/api/stripe/products');
      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.status}`);
      }
      const data = await response.json();
      const products: StripeProduct[] = data.products || [];
      
      const loadedPlans: PlanData[] = [];
      
      for (const productName of planOrder) {
        const config = planConfig[productName];
        if (!config) continue;
        
        const product = products.find(p => p.name === productName);
        if (product && product.prices && product.prices.length > 0) {
          const price = product.prices[0];
          loadedPlans.push({
            ...config,
            price: `$${(price.unit_amount / 100).toFixed(2)}`,
            priceId: price.id,
            amount: price.unit_amount
          });
        }
      }
      
      if (loadedPlans.length === 0) {
        // Fallback to default plans if Stripe products not available
        const fallbackPlans: PlanData[] = [
          {
            ...planConfig['Basic Monthly'],
            price: '$69.99',
            priceId: 'price_1Sf7Z2AYv17Z995VOMSBG7GX',
            amount: 6999
          },
          {
            ...planConfig['Pro Monthly'],
            price: '$129.99',
            priceId: 'price_1Sf7Z3AYv17Z995Vp8o2xgAN',
            amount: 12999
          },
          {
            ...planConfig['Lifetime'],
            price: '$49.99',
            priceId: 'price_1Sf7Z5AYv17Z995V7ROFNbzI',
            amount: 4999
          }
        ];
        setPlans(fallbackPlans);
        console.warn('Using fallback pricing plans - Stripe products not configured');
      } else {
        setPlans(loadedPlans);
      }
    } catch (err) {
      console.error('Error fetching prices:', err);
      setError('Failed to load pricing plans. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-800 via-indigo-800 to-purple-800 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-white animate-spin mx-auto mb-4" />
          <p className="text-white text-lg">Loading plans...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-800 via-indigo-800 to-purple-800 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-lg mb-4">{error}</p>
          <Button onClick={fetchPrices} className="bg-white text-gray-900">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-indigo-800 to-purple-800 p-4 md:p-8">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto">
        {onBack && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="text-white/80 hover:text-white hover:bg-white/10 mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        )}

        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
              <Sparkle className="w-8 h-8 text-white" />
            </div>
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
            {userName ? `Welcome, ${userName}!` : 'Welcome to Adiology!'}
          </h1>
          <p className="text-xl text-indigo-200 mb-2">
            Choose your plan to get started
          </p>
          <p className="text-sm text-indigo-300/80">
            All plans include 14-day money back guarantee
          </p>
        </MotionDiv>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {plans.map((plan, index) => {
            const Icon = plan.icon;
            return (
              <MotionDiv
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative"
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                    <div className="px-4 py-1 bg-gradient-to-r from-purple-500 to-purple-700 text-white rounded-full text-xs shadow-lg font-semibold">
                      Most Popular
                    </div>
                  </div>
                )}

                <div className={`
                  bg-white rounded-2xl p-6 border-2 ${plan.borderColor}
                  ${plan.popular ? 'shadow-2xl scale-105 ring-4 ring-purple-300/50' : 'shadow-lg hover:shadow-xl'}
                  transition-all duration-300 h-full flex flex-col
                `}>
                  <div className={`w-full h-20 bg-gradient-to-r ${plan.color} rounded-xl flex items-center justify-center mb-6 shadow-md`}>
                    <Icon className="w-10 h-10 text-white" />
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
                    {plan.displayName}
                  </h3>

                  <div className="text-center mb-2">
                    <span className="text-gray-900 text-3xl font-bold">{plan.price}</span>
                  </div>
                  <div className="text-gray-500 text-sm text-center mb-6">
                    {plan.period}
                  </div>

                  <div className="space-y-3 mb-6 flex-grow">
                    {plan.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${plan.color} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                          <Check className="w-3 h-3 text-white" strokeWidth={3} />
                        </div>
                        <span className="text-gray-700 text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <Button
                    onClick={() => onSelectPlan(plan.displayName, plan.priceId, plan.amount, plan.isSubscription)}
                    className={`w-full py-3 rounded-xl transition-all font-semibold ${plan.buttonStyle}`}
                  >
                    Select {plan.displayName}
                  </Button>
                </div>
              </MotionDiv>
            );
          })}
        </div>

        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-wrap items-center justify-center gap-8 text-sm text-indigo-200"
        >
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
              <Check className="w-3 h-3 text-white" strokeWidth={3} />
            </div>
            <span>14-day money back</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <span>Secure payments</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span>Cancel anytime</span>
          </div>
        </MotionDiv>
      </div>
    </div>
  );
};
