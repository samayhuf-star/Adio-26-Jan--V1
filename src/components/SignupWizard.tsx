import React, { useState, useEffect, useCallback } from 'react';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe, Stripe as StripeType } from '@stripe/stripe-js';
import {
  Eye, EyeOff, ArrowLeft, Sparkle, Shield, Rocket, Search, ShieldCheck,
  MailOpen, Globe, Layers, CreditCard, Clock, CheckCircle, Loader2,
  AlertCircle, Tag, Check, ChevronDown, Mail, RefreshCw
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { signUpWithEmail, getSessionToken } from '../utils/auth';

interface SignupWizardProps {
  selectedPlan: {
    name: string;
    priceId: string;
    amount: number;
    isSubscription: boolean;
    period?: string;
  };
  onSuccess: () => void;
  onBackToHome: () => void;
  onBackToPricing: () => void;
  onLogin: () => void;
}

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: '16px',
      color: '#111827',
      fontFamily: 'Inter, system-ui, sans-serif',
      '::placeholder': { color: '#9ca3af' },
      iconColor: '#7c3aed',
    },
    invalid: {
      color: '#ef4444',
      iconColor: '#ef4444',
    },
  },
  hidePostalCode: true,
};

const features = [
  { icon: Rocket, label: 'AI Campaign Builder', color: 'from-violet-500 to-indigo-600' },
  { icon: Layers, label: '13 Campaign Structures', color: 'from-indigo-500 to-blue-600' },
  { icon: Search, label: 'Keyword Intelligence', color: 'from-blue-500 to-cyan-500' },
  { icon: ShieldCheck, label: 'Click Fraud Protection', color: 'from-amber-500 to-orange-600' },
  { icon: MailOpen, label: 'Proxy Mail', color: 'from-pink-500 to-rose-600' },
  { icon: Globe, label: 'Domain Monitor', color: 'from-purple-500 to-violet-600' },
];

function StepIndicator({ currentStep, isLifetimeDeal = false }: { currentStep: number; isLifetimeDeal?: boolean }) {
  const steps = isLifetimeDeal
    ? [
        { num: 1, label: 'Account' },
        { num: 2, label: 'Confirmation' },
      ]
    : [
        { num: 1, label: 'Account' },
        { num: 2, label: 'Payment' },
        { num: 3, label: 'Confirmation' },
      ];

  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map((step, i) => (
        <React.Fragment key={step.num}>
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                currentStep > step.num
                  ? 'bg-green-500 text-white'
                  : currentStep === step.num
                    ? 'bg-violet-600 text-white shadow-sm shadow-violet-200'
                    : 'bg-gray-200 text-gray-400'
              }`}
            >
              {currentStep > step.num ? <Check className="w-4 h-4" /> : step.num}
            </div>
            <span
              className={`text-sm font-medium hidden sm:inline ${
                currentStep >= step.num ? 'text-gray-900' : 'text-gray-400'
              }`}
            >
              {step.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className={`w-12 h-0.5 ${
                currentStep > step.num ? 'bg-green-500' : 'bg-gray-200'
              }`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

function LeftPanel({ onBackToHome }: { onBackToHome: () => void }) {
  return (
    <div className="hidden lg:flex lg:w-[45%] relative flex-col justify-between p-12 overflow-hidden bg-violet-600">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-purple-500 rounded-full blur-3xl animate-pulse opacity-30" />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-blue-500 rounded-full blur-3xl animate-pulse opacity-20" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10">
        <button onClick={onBackToHome} className="flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm mb-12">
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </button>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-violet-600">
            <Sparkle className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900">Adiology</span>
        </div>
      </div>

      <div className="relative z-10 flex-1 flex flex-col justify-center">
        <h1 className="text-4xl font-black text-white leading-tight mb-4">
          Ads made simple.<br />
          <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">Results made powerful.</span>
        </h1>
        <p className="text-lg mb-10 text-indigo-200/70">
          Launch Search Ads in minutes with AI-powered automation.
        </p>
        <div className="space-y-3">
          {features.map((f, i) => (
            <div key={i} className="flex items-center gap-3 group">
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${f.color} flex items-center justify-center shadow-lg shrink-0`}>
                <f.icon className="w-4 h-4 text-white" />
              </div>
              <span className="text-white/70 text-sm font-medium group-hover:text-white transition-colors">{f.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="relative z-10">
        <p className="text-white/30 text-xs">&copy; 2026 Adiology. All rights reserved.</p>
      </div>
    </div>
  );
}

function Step1CreateAccount({
  onNext,
  onLogin,
  onBackToHome,
  prefillEmail,
  isLifetimeDeal,
  onLifetimeComplete,
}: {
  onNext: (email: string, name: string) => void;
  onLogin: () => void;
  onBackToHome: () => void;
  prefillEmail?: string;
  isLifetimeDeal?: boolean;
  onLifetimeComplete?: () => void;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState(prefillEmail || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [verifiedEmail, setVerifiedEmail] = useState('');
  const [verifiedName, setVerifiedName] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [checkingVerification, setCheckingVerification] = useState(false);

  useEffect(() => {
    if (!pendingVerification) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/account/verification-status?email=${encodeURIComponent(verifiedEmail)}`);
        const data = await res.json();
        if (data.verified) {
          clearInterval(interval);
          onNext(verifiedEmail, verifiedName);
        }
      } catch {}
    }, 3000);
    return () => clearInterval(interval);
  }, [pendingVerification, verifiedEmail, verifiedName, onNext]);

  const handleManualCheck = async () => {
    setCheckingVerification(true);
    setError('');
    try {
      const res = await fetch(`/api/account/verification-status?email=${encodeURIComponent(verifiedEmail)}`);
      const data = await res.json();
      if (data.verified) {
        onNext(verifiedEmail, verifiedName);
      } else {
        setError("Your email hasn't been verified yet. Please click the link in your email.");
      }
    } catch {
      setError('Could not check verification status. Please try again.');
    } finally {
      setCheckingVerification(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    setResendMessage('');
    setError('');
    try {
      const res = await fetch('/api/account/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: verifiedEmail }),
      });
      const data = await res.json();
      if (data.success) {
        setResendMessage('Verification email resent! Check your inbox.');
      } else {
        setError(data.error || 'Failed to resend verification email.');
      }
    } catch {
      setError('Failed to resend verification email.');
    } finally {
      setResendLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!agreedToTerms) {
      setError('You must agree to the Terms of Service and Privacy Policy');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);
    try {
      const result = await signUpWithEmail(email, password, confirmPassword, name, isLifetimeDeal);

      if (result.error) {
        throw new Error(result.error.message || 'Signup failed');
      }

      if (result.skipPayment && onLifetimeComplete) {
        onLifetimeComplete();
        return;
      }

      if (result.needsEmailVerification) {
        setVerifiedEmail(email.trim().toLowerCase());
        setVerifiedName(name.trim());
        setPendingVerification(true);
        return;
      }

      onNext(email.trim().toLowerCase(), name.trim());
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (pendingVerification) {
    return (
      <div>
        <div className="lg:hidden mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-violet-500 to-indigo-600">
              <Sparkle className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">Adiology</span>
          </div>
        </div>

        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-violet-100 border border-violet-200 flex items-center justify-center mx-auto mb-5">
            <Mail className="w-8 h-8 text-violet-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Check your inbox</h2>
          <p className="text-gray-500 text-sm">
            We sent a verification link to
          </p>
          <p className="text-violet-600 font-semibold mt-1">{verifiedEmail}</p>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 mb-6 text-sm text-gray-600 space-y-2">
          <p>1. Open the email from Adiology in your inbox.</p>
          <p>2. Click the <span className="text-violet-600 font-medium">"Verify Email Address"</span> button.</p>
          <p>3. Come back here — you'll be moved forward automatically.</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {resendMessage && (
          <div className="flex items-center gap-2 text-green-600 text-sm bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
            <CheckCircle className="w-4 h-4 flex-shrink-0 text-green-600" />
            {resendMessage}
          </div>
        )}

        <div className="space-y-3">
          <Button
            onClick={handleManualCheck}
            disabled={checkingVerification}
            className="w-full text-white h-12 text-base font-semibold rounded-xl bg-amber-500 hover:bg-amber-600"
          >
            {checkingVerification ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                Checking...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <CheckCircle className="w-5 h-5" />
                I've verified my email — Continue
              </span>
            )}
          </Button>

          <button
            type="button"
            onClick={handleResend}
            disabled={resendLoading}
            className="w-full flex items-center justify-center gap-2 text-gray-500 hover:text-gray-700 text-sm transition-colors py-2"
          >
            {resendLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Resend verification email
          </button>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Didn't receive it? Check your spam folder or try a different email address.{' '}
          <button
            type="button"
            onClick={() => { setPendingVerification(false); setError(''); setResendMessage(''); }}
            className="text-violet-600 hover:text-violet-700 underline"
          >
            Go back
          </button>
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="lg:hidden mb-8">
        <button onClick={onBackToHome} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors text-sm mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-violet-600">
            <Sparkle className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900">Adiology</span>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">
          {isLifetimeDeal ? 'Complete your account setup' : 'Create your account'}
        </h2>
        <p className="text-gray-500 text-sm">
          {isLifetimeDeal ? 'Your Lifetime Access is confirmed — just set a password to get started' : 'Start building winning campaigns today'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="space-y-2">
          <label className="text-gray-700 font-medium text-sm">Full Name</label>
          <Input
            type="text"
            placeholder="John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-12 bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 rounded-xl focus:border-violet-500 focus:ring-violet-500/20"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-gray-700 font-medium text-sm">Email</label>
          <Input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-12 bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 rounded-xl focus:border-violet-500 focus:ring-violet-500/20"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-gray-700 font-medium text-sm">Password</label>
          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 rounded-xl pr-12 focus:border-violet-500 focus:ring-violet-500/20"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 p-1"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-gray-700 font-medium text-sm">Confirm Password</label>
          <div className="relative">
            <Input
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="h-12 bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 rounded-xl pr-12 focus:border-violet-500 focus:ring-violet-500/20"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 p-1"
            >
              {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={agreedToTerms}
            onChange={(e) => setAgreedToTerms(e.target.checked)}
            className="mt-1 rounded border-gray-300 bg-white text-violet-600 focus:ring-violet-500/20"
          />
          <span className="text-sm text-gray-500">
            I agree to the{' '}
            <a href="/terms" target="_blank" className="text-violet-600 hover:text-violet-700 underline">Terms of Service</a>
            {' '}and{' '}
            <a href="/privacy" target="_blank" className="text-violet-600 hover:text-violet-700 underline">Privacy Policy</a>
          </span>
        </label>

        <Button
          type="submit"
          className="w-full text-white h-12 text-base font-semibold rounded-xl shadow-sm transition-all bg-amber-500 hover:bg-amber-600"
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              {isLifetimeDeal ? 'Setting up account...' : 'Creating account...'}
            </span>
          ) : (
            isLifetimeDeal ? 'Complete Account Setup' : 'Continue to Payment'
          )}
        </Button>
      </form>

      <div className="text-center text-sm text-gray-400 mt-6">
        Already have an account?{' '}
        <button onClick={onLogin} className="text-violet-600 hover:text-violet-700 font-medium">
          Sign in
        </button>
      </div>
    </div>
  );
}

const PLAN_OPTIONS = [
  { name: 'Starter', priceId: 'price_1T6SDuAYv17Z995Vind8Ze6S', amount: 2999, period: 'month', isSubscription: true },
  { name: 'Professional', priceId: 'price_1T6SHkAYv17Z995VkD5WcTc7', amount: 9900, period: 'month', isSubscription: true },
  { name: 'Agency', priceId: 'price_1T6SKQAYv17Z995VKvkd6lbN', amount: 14900, period: 'month', isSubscription: true },
];

function Step2PaymentForm({
  selectedPlan,
  userEmail,
  userName,
  onNext,
  onBack,
  onPlanChange,
}: {
  selectedPlan: SignupWizardProps['selectedPlan'];
  userEmail: string;
  userName: string;
  onNext: () => void;
  onBack: () => void;
  onPlanChange: (plan: SignupWizardProps['selectedPlan']) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [cardComplete, setCardComplete] = useState(false);
  const [billingName, setBillingName] = useState(userName || '');
  const [zip, setZip] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState<{ valid: boolean; discount?: string; discountAmount?: number; newAmount?: number } | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [planDropdownOpen, setPlanDropdownOpen] = useState(false);

  const formatPrice = (amountInCents: number) => {
    return `$${(amountInCents / 100).toFixed(2)}`;
  };

  const displayAmount = couponApplied?.newAmount != null ? couponApplied.newAmount : selectedPlan.amount;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;

    setCouponLoading(true);
    setCouponError('');
    setCouponApplied(null);

    try {
      const response = await fetch('/api/stripe/validate-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode.trim() }),
      });

      const data = await response.json();

      if (!response.ok || !data.valid) {
        setCouponError(data.error || 'Invalid coupon code');
        return;
      }

      let discountLabel: string | undefined;
      let newAmount: number | undefined;

      if (data.discount && typeof data.discount === 'object') {
        if (data.discount.type === 'percent') {
          discountLabel = `${data.discount.value}%`;
          newAmount = Math.round(selectedPlan.amount * (1 - data.discount.value / 100));
        } else if (data.discount.type === 'amount') {
          discountLabel = formatPrice(data.discount.value * 100);
          newAmount = selectedPlan.amount - data.discount.value * 100;
        }
      } else if (data.percentOff) {
        discountLabel = `${data.percentOff}%`;
        newAmount = Math.round(selectedPlan.amount * (1 - data.percentOff / 100));
      } else if (data.amountOff) {
        discountLabel = formatPrice(data.amountOff);
        newAmount = selectedPlan.amount - data.amountOff;
      }

      setCouponApplied({
        valid: true,
        discount: discountLabel,
        discountAmount: data.discountAmount,
        newAmount: data.newAmount ?? newAmount,
      });
    } catch {
      setCouponError('Failed to validate coupon');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    if (!billingName.trim()) {
      setError('Please enter the billing name');
      return;
    }

    if (!zip.trim()) {
      setError('Please enter your billing ZIP code');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      const { error: pmError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
        billing_details: {
          email: userEmail,
          name: billingName,
          address: {
            postal_code: zip || undefined,
          },
        },
      });

      if (pmError) {
        throw new Error(pmError.message || 'Failed to process card');
      }

      if (!paymentMethod) {
        throw new Error('No payment method created');
      }

      const token = await getSessionToken();

      const response = await fetch('/api/stripe/create-trial', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          email: userEmail,
          planName: selectedPlan.name,
          paymentMethodId: paymentMethod.id,
          ...(couponApplied?.valid && couponCode.trim() ? { couponCode: couponCode.trim() } : {}),
        }),
      });

      let data: any;
      try {
        data = await response.json();
      } catch {
        throw new Error('Server returned an invalid response. Please try again.');
      }

      if (!response.ok) {
        throw new Error(data?.error || `Request failed (${response.status}). Please try again.`);
      }

      if (!data.success) {
        throw new Error(data?.error || 'Failed to start trial. Please try again.');
      }

      onNext();
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const ctaText = selectedPlan.isSubscription ? 'Start 7-Day Free Trial' : 'Complete Purchase';

  return (
    <div>
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Payment Details</h2>
        <p className="text-gray-500 text-sm">Add your payment method to get started</p>
      </div>

      <div className="relative mb-6">
        <button
          type="button"
          onClick={() => setPlanDropdownOpen(!planDropdownOpen)}
          className="w-full bg-violet-50 border border-violet-200 rounded-xl p-4 text-left hover:border-violet-400 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-violet-600 rounded-xl flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-gray-900 font-semibold">{selectedPlan.name} Plan</span>
                <p className="text-xs text-gray-500 capitalize">{selectedPlan.period || 'Monthly'} Billing</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                {couponApplied?.valid && couponApplied.newAmount != null ? (
                  <>
                    <span className="text-gray-400 line-through text-sm mr-2">{formatPrice(selectedPlan.amount)}</span>
                    <span className="text-violet-600 font-bold text-lg">{formatPrice(couponApplied.newAmount)}</span>
                  </>
                ) : (
                  <span className="text-violet-600 font-bold text-lg">{formatPrice(selectedPlan.amount)}</span>
                )}
                {selectedPlan.isSubscription && (
                  <p className="text-xs text-gray-500">/{selectedPlan.period || 'month'}</p>
                )}
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${planDropdownOpen ? 'rotate-180' : ''}`} />
            </div>
          </div>
        </button>

        {planDropdownOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xl z-20">
            {PLAN_OPTIONS.map((plan) => {
              const isSelected = plan.name.toLowerCase() === selectedPlan.name.toLowerCase();
              return (
                <button
                  key={plan.name}
                  type="button"
                  onClick={() => {
                    onPlanChange({ name: plan.name, priceId: plan.priceId, amount: plan.amount, isSubscription: plan.isSubscription, period: plan.period });
                    setCouponApplied(null);
                    setCouponCode('');
                    setCouponError('');
                    setPlanDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 transition-colors ${
                    isSelected
                      ? 'bg-violet-50 text-violet-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      isSelected ? 'border-violet-600 bg-violet-600' : 'border-gray-300'
                    }`}>
                      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <span className="font-medium">{plan.name}</span>
                  </div>
                  <span className={`font-semibold ${isSelected ? 'text-violet-600' : 'text-gray-500'}`}>
                    {formatPrice(plan.amount)}<span className="text-xs font-normal">/{plan.period}</span>
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {selectedPlan.isSubscription && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-3 mb-6">
          <Clock className="w-5 h-5 text-green-600 flex-shrink-0" />
          <div>
            <p className="text-sm text-green-700 font-medium">7-day free trial — no charge today</p>
            <p className="text-xs text-gray-600">Your card is saved but won't be charged until the trial ends.</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Billing Name</label>
            <input
              type="text"
              value={billingName}
              onChange={(e) => setBillingName(e.target.value)}
              placeholder="Full name on card"
              className="w-full bg-white border border-gray-300 rounded-lg p-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-violet-500 transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Card Details</label>
            <div className="bg-white border border-gray-300 rounded-lg p-4 focus-within:border-violet-500 transition-colors">
              <CardElement
                options={CARD_ELEMENT_OPTIONS}
                onChange={(e) => {
                  setCardComplete(e.complete);
                  if (e.error) {
                    setError(e.error.message);
                  } else {
                    setError('');
                  }
                }}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Billing ZIP Code</label>
            <input
              type="text"
              value={zip}
              onChange={(e) => setZip(e.target.value)}
              placeholder="ZIP / Postal code"
              className="w-full bg-white border border-gray-300 rounded-lg p-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-violet-500 transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Coupon Code (optional)</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => {
                  setCouponCode(e.target.value);
                  if (couponApplied) {
                    setCouponApplied(null);
                  }
                  setCouponError('');
                }}
                placeholder="Enter coupon code"
                className="flex-1 bg-white border border-gray-300 rounded-lg p-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-violet-500 transition-colors"
              />
              <Button
                type="button"
                onClick={handleApplyCoupon}
                disabled={couponLoading || !couponCode.trim()}
                className="px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 rounded-lg disabled:opacity-50"
              >
                {couponLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                  <span className="flex items-center gap-1.5">
                    <Tag className="w-4 h-4" />
                    Apply
                  </span>
                )}
              </Button>
            </div>
            {couponApplied?.valid && (
              <div className="flex items-center gap-2 mt-2 text-green-600 text-sm">
                <CheckCircle className="w-4 h-4" />
                Coupon applied! {couponApplied.discount && `(${couponApplied.discount} off)`}
              </div>
            )}
            {couponError && (
              <div className="flex items-center gap-2 mt-2 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                {couponError}
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-400 text-sm mb-4 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <Button
          type="submit"
          disabled={!stripe || !cardComplete || isProcessing}
          className="w-full bg-amber-500 hover:bg-amber-600 text-white py-3 text-base font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              Processing...
            </span>
          ) : (
            ctaText
          )}
        </Button>
      </form>

      <div className="flex items-center gap-2 justify-center mt-6 text-xs text-gray-400">
        <Shield className="w-3.5 h-3.5" />
        <span>Secured by Stripe. Your card information is encrypted.</span>
      </div>
    </div>
  );
}

function Step3Confirmation({
  selectedPlan,
  userEmail,
  userName,
  onSuccess,
}: {
  selectedPlan: SignupWizardProps['selectedPlan'];
  userEmail: string;
  userName: string;
  onSuccess: () => void;
}) {
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    fetch('/api/stripe/send-welcome-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: userEmail, name: userName, planName: selectedPlan.name }),
    }).catch(() => {});
  }, [userEmail, userName, selectedPlan.name]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onSuccess();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onSuccess]);

  const formatPrice = (amountInCents: number) => {
    return `$${(amountInCents / 100).toFixed(2)}`;
  };

  return (
    <div className="text-center">
      <div className="flex justify-center mb-6">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-900/30 animate-bounce">
          <CheckCircle className="w-10 h-10 text-white" />
        </div>
      </div>

      <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Adiology!</h2>
      <p className="text-gray-500 text-lg mb-8">
        Your account is ready. {selectedPlan.isSubscription ? 'Your 7-day free trial has started.' : 'Your purchase is complete.'}
      </p>

      <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-8 text-left">
        <h3 className="text-gray-900 font-semibold mb-3">Plan Summary</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Plan</span>
            <span className="text-gray-900 font-medium">{selectedPlan.name}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Price</span>
            <span className="text-gray-900 font-medium">
              {formatPrice(selectedPlan.amount)}
              {selectedPlan.isSubscription && `/${selectedPlan.period || 'month'}`}
            </span>
          </div>
          {selectedPlan.isSubscription && (
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Trial</span>
              <span className="text-green-600 font-medium">7 days free</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Account</span>
            <span className="text-gray-900 font-medium">{userEmail}</span>
          </div>
        </div>
      </div>

      <Button
        onClick={onSuccess}
        className="w-full bg-amber-500 hover:bg-amber-600 text-white py-3 text-base font-semibold rounded-xl"
      >
        Go to Dashboard
      </Button>

      <p className="text-gray-400 text-sm mt-4">
        Redirecting in {countdown} second{countdown !== 1 ? 's' : ''}...
      </p>
    </div>
  );
}

function WizardContent({
  selectedPlan: initialPlan,
  onSuccess,
  onBackToHome,
  onBackToPricing,
  onLogin,
}: SignupWizardProps) {
  const storedUser = (() => {
    try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; }
  })();
  const storedToken = localStorage.getItem('auth_token');
  const alreadyHasAccount = !!(storedToken && storedUser?.email);

  const [currentStep, setCurrentStep] = useState(alreadyHasAccount ? 2 : 1);
  const [userEmail, setUserEmail] = useState(alreadyHasAccount ? (storedUser?.email || '') : '');
  const [userName, setUserName] = useState(alreadyHasAccount ? (storedUser?.full_name || storedUser?.name || '') : '');
  const [activePlan, setActivePlan] = useState(initialPlan);

  const isLifetimeDeal = (initialPlan as any).isLifetimeDeal === true;
  const prefillEmail = (initialPlan as any).prefillEmail || '';

  const handleStep1Complete = useCallback((email: string, name: string) => {
    setUserEmail(email);
    setUserName(name);
    if (isLifetimeDeal) {
      sessionStorage.removeItem('lifetime_checkout_email');
      sessionStorage.removeItem('lifetime_signup_email');
      sessionStorage.removeItem('selectedPlan');
      setCurrentStep(2);
    } else {
      setCurrentStep(2);
    }
  }, [isLifetimeDeal]);

  const handleStep2Complete = useCallback(() => {
    setCurrentStep(3);
  }, []);

  const handleLifetimeComplete = useCallback(() => {
    sessionStorage.removeItem('lifetime_checkout_email');
    sessionStorage.removeItem('lifetime_signup_email');
    sessionStorage.removeItem('selectedPlan');
    setCurrentStep(2);
  }, []);

  const stableOnSuccess = useCallback(() => {
    onSuccess();
  }, [onSuccess]);

  const showConfirmation = isLifetimeDeal ? currentStep === 2 : currentStep === 3;
  const lifetimePlanForConfirmation = {
    name: 'Lifetime',
    priceId: '',
    amount: 9900,
    isSubscription: false,
    period: 'lifetime',
  };

  return (
    <div className="min-h-screen flex">
      <LeftPanel onBackToHome={onBackToHome} />

      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 bg-white">
        <div className="w-full max-w-md">
          <StepIndicator currentStep={currentStep} isLifetimeDeal={isLifetimeDeal} />

          {currentStep === 1 && (
            <Step1CreateAccount
              onNext={handleStep1Complete}
              onLogin={onLogin}
              onBackToHome={onBackToHome}
              prefillEmail={prefillEmail}
              isLifetimeDeal={isLifetimeDeal}
              onLifetimeComplete={handleLifetimeComplete}
            />
          )}

          {currentStep === 2 && !isLifetimeDeal && (
            <Step2PaymentForm
              selectedPlan={activePlan}
              userEmail={userEmail}
              userName={userName}
              onNext={handleStep2Complete}
              onBack={() => setCurrentStep(1)}
              onPlanChange={setActivePlan}
            />
          )}

          {showConfirmation && (
            <Step3Confirmation
              selectedPlan={isLifetimeDeal ? lifetimePlanForConfirmation : activePlan}
              userEmail={userEmail || prefillEmail}
              userName={userName}
              onSuccess={stableOnSuccess}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export function SignupWizard(props: SignupWizardProps) {
  const [stripePromise, setStripePromise] = useState<Promise<StripeType | null> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      try {
        const response = await fetch('/api/stripe/config');
        const data = await response.json();
        if (data.publishableKey) {
          setStripePromise(loadStripe(data.publishableKey));
        }
      } catch (err) {
        console.error('Failed to load Stripe:', err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-violet-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!stripePromise) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-4" />
          <p className="text-gray-500">Payment system is currently unavailable. Please try again later.</p>
          <Button onClick={props.onBackToPricing} variant="outline" className="mt-4">Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      <WizardContent {...props} />
    </Elements>
  );
}
