import React, { useState, useEffect } from 'react';
import { loadStripe, StripeElementsOptions } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { 
  CreditCard, Lock, CheckCircle2, AlertCircle, ArrowLeft, 
  Sparkle, Shield, Loader2, Check
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { Label } from './ui/label';
import { getStripe } from '../utils/stripe';
import { notifications } from '../utils/notifications';
import { getCurrentAuthUser } from '../utils/auth';

interface PaymentPageProps {
  planName: string;
  priceId: string;
  amount: number;
  isSubscription: boolean;
  onBack: () => void;
  onSuccess: (planName: string, amount: number, isSubscription: boolean) => void;
}

interface PlanDetails {
  name: string;
  price: string;
  priceId: string;
  isSubscription: boolean;
  amount: number;
  features: string[];
}

const PLAN_DETAILS: Record<string, PlanDetails> = {
  'Basic': {
    name: 'Basic',
    price: '$69.99',
    priceId: 'price_basic_monthly',
    isSubscription: true,
    amount: 6999,
    features: [
      '10 Active Campaigns',
      '5 Draft Campaigns',
      '50 Campaign Exports/Month',
      '500 Keyword Credits/Month',
      '10 Landing Page Templates',
      '2 User Seats',
      'Email Support'
    ]
  },
  'Basic (Yearly)': {
    name: 'Basic (Yearly)',
    price: '$671.90',
    priceId: 'price_basic_yearly',
    isSubscription: true,
    amount: 67190,
    features: [
      '10 Active Campaigns',
      '5 Draft Campaigns',
      '50 Campaign Exports/Month',
      '500 Keyword Credits/Month',
      '10 Landing Page Templates',
      '2 User Seats',
      'Email Support'
    ]
  },
  'Pro': {
    name: 'Pro',
    price: '$129.99',
    priceId: 'price_pro_monthly',
    isSubscription: true,
    amount: 12999,
    features: [
      '50 Active Campaigns',
      'Unlimited Draft Campaigns',
      'Unlimited Campaign Exports',
      '2,500 Keyword Credits/Month',
      '50+ Landing Page Templates',
      '5 User Seats',
      'Email Support'
    ]
  },
  'Pro (Yearly)': {
    name: 'Pro (Yearly)',
    price: '$1,247.90',
    priceId: 'price_pro_yearly',
    isSubscription: true,
    amount: 124790,
    features: [
      '50 Active Campaigns',
      'Unlimited Draft Campaigns',
      'Unlimited Campaign Exports',
      '2,500 Keyword Credits/Month',
      '50+ Landing Page Templates',
      '5 User Seats',
      'Email Support'
    ]
  },
  'Lifetime': {
    name: 'Lifetime',
    price: '$99.99',
    priceId: 'price_lifetime',
    isSubscription: false,
    amount: 9999,
    features: [
      '5 Active Campaigns',
      '3 Draft Campaigns',
      '25 Campaign Exports/Month',
      '250 Keyword Credits/Month',
      '5 Landing Page Templates',
      '1 User Seat',
      'Email Support'
    ]
  }
};

// Payment Form Component
const PaymentForm: React.FC<{
  plan: PlanDetails;
  onSuccess: (planName: string, amount: number, isSubscription: boolean) => void;
  onBack: () => void;
}> = ({ plan, onSuccess, onBack }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cardComplete, setCardComplete] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentAttemptId, setPaymentAttemptId] = useState<string | null>(null);

  useEffect(() => {
    // Check if there's a pending payment attempt (prevent duplicate charges on refresh)
    const pendingPayment = sessionStorage.getItem('pending_payment');
    if (pendingPayment) {
      const paymentData = JSON.parse(pendingPayment);
      const timeElapsed = Date.now() - paymentData.timestamp;
      
      // If payment attempt is older than 5 minutes, clear it
      if (timeElapsed > 5 * 60 * 1000) {
        sessionStorage.removeItem('pending_payment');
      } else {
        // Show warning about pending payment
        setError('A payment attempt was in progress. Please wait a moment before trying again.');
        setIsProcessing(false);
        // Clear after showing warning
        setTimeout(() => {
          sessionStorage.removeItem('pending_payment');
          setError(null);
        }, 5000);
        return;
      }
    }

    // Create payment intent on mount
    createPaymentIntent();

    // Handle page refresh/unload
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isProcessing) {
        // Store payment attempt info
        sessionStorage.setItem('pending_payment', JSON.stringify({
          timestamp: Date.now(),
          planName: plan.name,
        }));
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isProcessing, plan.name]);

  const createPaymentIntent = async () => {
    try {
      // Get current user ID from Supabase
      const { getCurrentAuthUser } = await import('../utils/auth');
      const user = await getCurrentAuthUser();
      const userId = user?.id;

      // Call backend API to create payment intent
      const { api } = await import('../utils/api');
      const data = await api.post('/stripe/create-payment-intent', {
        priceId: plan.priceId,
        planName: plan.name,
        amount: plan.amount,
        isSubscription: plan.isSubscription,
        userId: userId,
      });

      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
      } else {
        // Fallback: Use Stripe Checkout instead
        console.log('Payment Intent API not available, will use Checkout');
      }
    } catch (err) {
      // Fallback: Use Stripe Checkout instead
      console.log('Payment Intent API not available, will use Checkout:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      setError('Stripe has not loaded yet. Please wait...');
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setError('Card element not found');
      return;
    }

    if (!cardComplete) {
      setError('Please complete the card details');
      return;
    }

    setIsProcessing(true);
    setError(null);

    // Store payment attempt to prevent duplicate charges on refresh
    const attemptId = `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setPaymentAttemptId(attemptId);
    sessionStorage.setItem('pending_payment', JSON.stringify({
      id: attemptId,
      timestamp: Date.now(),
      planName: plan.name,
    }));

    try {
      // Get user email from Supabase
      let userEmail: string | undefined;
      try {
        const user = await getCurrentAuthUser();
        userEmail = user?.email;
      } catch (e) {
        console.error('Error getting user email:', e);
      }

      // If we have clientSecret, use PaymentIntent (supports 3D Secure)
      if (clientSecret) {
        const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: cardElement,
            billing_details: {
              email: userEmail,
            },
          },
        });

        if (confirmError) {
          // Clear pending payment attempt
          sessionStorage.removeItem('pending_payment');
          
          // Handle specific error types
          let errorMessage = confirmError.message || 'Payment failed';
          
          // Check for declined card (4000 0000 0000 0002)
          if (confirmError.type === 'card_error' || confirmError.code === 'card_declined') {
            errorMessage = 'Your card was declined. Please check your card details or use a different payment method.';
          } else if (confirmError.code === 'insufficient_funds') {
            errorMessage = 'Insufficient funds. Please use a different payment method.';
          } else if (confirmError.code === 'expired_card') {
            errorMessage = 'Your card has expired. Please use a different payment method.';
          } else if (confirmError.code === 'incorrect_cvc') {
            errorMessage = 'Your card\'s security code is incorrect. Please check and try again.';
          } else if (confirmError.code === 'processing_error') {
            errorMessage = 'An error occurred while processing your payment. Please try again.';
          }
          
          setError(errorMessage);
          setIsProcessing(false);
          
          // Show notification
          notifications.error('Payment Failed', {
            title: 'Payment Declined',
            description: errorMessage,
          });
          
          return;
        }

        if (paymentIntent?.status === 'succeeded') {
          // Clear pending payment attempt
          sessionStorage.removeItem('pending_payment');
          
          // Payment succeeded
          handlePaymentSuccess();
          return;
        }

        if (paymentIntent?.status === 'requires_action') {
          // 3D Secure authentication required
          const { error: actionError } = await stripe.handleCardAction(clientSecret);
          
          if (actionError) {
            // Clear pending payment attempt
            sessionStorage.removeItem('pending_payment');
            
            setError(actionError.message || '3D Secure authentication failed');
            setIsProcessing(false);
            return;
          }

          // Retry payment after 3D Secure
          const { error: retryError, paymentIntent: retryPaymentIntent } = await stripe.confirmCardPayment(clientSecret);
          
          if (retryError) {
            // Clear pending payment attempt
            sessionStorage.removeItem('pending_payment');
            
            setError(retryError.message || 'Payment failed after authentication');
            setIsProcessing(false);
            return;
          }

          if (retryPaymentIntent?.status === 'succeeded') {
            // Clear pending payment attempt
            sessionStorage.removeItem('pending_payment');
            
            handlePaymentSuccess();
            return;
          }
        }
      } else {
        // Fallback: Use Stripe Checkout
        // Get current user ID from Supabase
        const { getCurrentAuthUser } = await import('../utils/auth');
        const user = await getCurrentAuthUser();
        const userId = user?.id;

        // Create checkout session via backend API
        const { api } = await import('../utils/api');
        const { sessionId } = await api.post('/stripe/create-checkout-session', {
          priceId: plan.priceId,
          planName: plan.name,
          userId: userId,
        });

        const { error: redirectError } = await (stripe as any).redirectToCheckout({ sessionId });

        if (redirectError) {
          setError(redirectError.message || 'Failed to redirect to checkout');
          setIsProcessing(false);
        }
        // Redirect will happen, so we don't need to handle success here
        return;
      }
    } catch (err) {
      // Clear pending payment attempt
      sessionStorage.removeItem('pending_payment');
      
      console.error('Payment error:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.';
      setError(errorMessage);
      setIsProcessing(false);
      
      // Show notification
      notifications.error('Payment Error', {
        title: 'Payment Failed',
        description: errorMessage,
      });
    }
  };

  const handlePaymentSuccess = async () => {
    // Update user subscription status in database via Supabase
    // Note: The webhook will also update this, but we update here for immediate UI feedback
    try {
      const { getCurrentAuthUser } = await import('../utils/auth');
      const { userHelpers } = await import('../utils/supabase');
      const user = await getCurrentAuthUser();
      
      if (user) {
        // Map plan name to subscription plan format
        const planMap: Record<string, string> = {
          'Lifetime Limited': 'lifetime_limited',
          'Lifetime Unlimited': 'lifetime_unlimited',
          'Monthly Limited': 'monthly_limited',
          'Monthly Unlimited': 'monthly_unlimited',
        };

        await userHelpers.updateUserSubscription(user.id, {
          plan: planMap[plan.name] || plan.name.toLowerCase().replace(/\s+/g, '_'),
          status: 'active',
        });
      }
    } catch (e) {
      console.error('Error updating subscription:', e);
      // Continue even if update fails - webhook will handle it
    }

    notifications.success('Payment successful!', {
      title: 'Payment Complete',
      description: `You've successfully subscribed to ${plan.name}. Redirecting...`,
    });

    setIsProcessing(false);
    
    // Redirect to success page
    setTimeout(() => {
      onSuccess(plan.name, plan.amount, plan.isSubscription);
    }, 1500);
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#1e293b',
        '::placeholder': {
          color: '#94a3b8',
        },
        fontFamily: 'system-ui, sans-serif',
      },
      invalid: {
        color: '#ef4444',
        iconColor: '#ef4444',
      },
    },
    hidePostalCode: false,
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Plan Summary */}
      <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-slate-700">Plan</span>
          <span className="text-sm font-semibold text-slate-900">{plan.name}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-slate-700">Amount</span>
          <span className="text-lg font-bold text-indigo-600">{plan.price}{plan.isSubscription ? '/month' : ''}</span>
        </div>
      </div>

      {/* Card Element */}
      <div className="space-y-2">
        <Label className="text-slate-900 font-semibold flex items-center gap-2">
          <CreditCard className="w-4 h-4" />
          Card Details
        </Label>
        <div className="p-4 border border-slate-300 rounded-lg bg-white">
          <CardElement
            options={cardElementOptions}
            onChange={(e) => {
              setCardComplete(e.complete);
              if (e.error) {
                setError(e.error.message);
              } else {
                setError(null);
              }
            }}
          />
        </div>
        <p className="text-xs text-slate-500 flex items-center gap-1">
          <Lock className="w-3 h-3" />
          Your payment is secured by Stripe
        </p>
      </div>

      {/* Test Card Info */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-xs font-semibold text-blue-900 mb-2">Test Cards (Stripe Test Mode):</p>
        <div className="text-xs text-blue-700 space-y-1 font-mono">
          <div>✅ Success: 4242 4242 4242 4242</div>
          <div>❌ Decline: 4000 0000 0000 0002</div>
          <div>🔐 3D Secure: 4000 0025 0000 3155</div>
          <div className="mt-2 text-blue-600">Expiry: Any future date (e.g., 12/34) • CVC: Any 3 digits</div>
        </div>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={!stripe || !cardComplete || isProcessing}
        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white h-12 text-lg font-semibold"
      >
        {isProcessing ? (
          <span className="flex items-center">
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Processing Payment...
          </span>
        ) : (
          <span className="flex items-center justify-center">
            <Lock className="w-4 h-4 mr-2" />
            Pay {plan.price}
            {plan.isSubscription && ' / month'}
          </span>
        )}
      </Button>

      <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
        <Shield className="w-4 h-4" />
        Secured by Stripe • 256-bit SSL encryption
      </div>
    </form>
  );
};

// Main Payment Page Component
export const PaymentPage: React.FC<PaymentPageProps> = ({
  planName,
  priceId,
  amount,
  isSubscription,
  onBack,
  onSuccess,
}) => {
  const [stripePromise, setStripePromise] = useState<Promise<any> | null>(null);
  
  // Use passed priceId and amount directly (from dynamic API fetch)
  // Fall back to PLAN_DETAILS only for features display
  const planDetails = PLAN_DETAILS[planName];
  const plan: PlanDetails = {
    name: planName,
    price: `$${(amount / 100).toFixed(2)}`,
    priceId: priceId, // Use the real priceId passed from PlanSelection
    isSubscription,
    amount,
    features: planDetails?.features || [
      'Full campaign access',
      'Email support',
      'All core features'
    ]
  };

  useEffect(() => {
    // Load Stripe
    const stripe = getStripe();
    setStripePromise(stripe);
  }, []);

  const elementsOptions: StripeElementsOptions = {
    mode: plan.isSubscription ? 'subscription' : 'payment',
    amount: Math.round(amount * 100), // Convert to cents
    currency: 'usd',
    appearance: {
      theme: 'stripe',
    },
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-800 via-indigo-800 to-purple-800 p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 w-full max-w-2xl">
        <Card className="border border-slate-200 shadow-2xl bg-white backdrop-blur-xl">
          <CardHeader className="space-y-1 pb-4">
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  // Clear any pending payment attempts
                  sessionStorage.removeItem('pending_payment');
                  onBack();
                }}
                className="text-slate-700 hover:text-indigo-600 font-medium"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Pricing
              </Button>
            </div>
            <div className="flex flex-col items-center justify-center mb-4">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg mb-3">
                <CreditCard className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Adiology</h2>
            </div>
            <CardTitle className="text-xl font-bold text-center text-slate-900">
              Complete Your Payment
            </CardTitle>
            <CardDescription className="text-center text-slate-600">
              Secure payment powered by Stripe
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stripePromise ? (
              <Elements stripe={stripePromise} options={elementsOptions}>
                <PaymentForm plan={plan} onSuccess={onSuccess} onBack={onBack} />
              </Elements>
            ) : (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

