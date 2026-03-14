import { useState, useEffect } from 'react';
import { AlertCircle, ChevronDown, Loader2, Eye, EyeOff, ArrowLeft, RefreshCw, CheckCircle } from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  priceId: string;
  amount: number;
  interval: 'month' | 'year' | 'once';
  description: string;
}

const PLAN_PRICE_IDS: Record<string, string> = {
  starter: 'price_1T6SDuAYv17Z995Vind8Ze6S',
  professional: 'price_1T6SHkAYv17Z995VkD5WcTc7',
  agency: 'price_1T6SKQAYv17Z995VKvkd6lbN',
  lifetime: 'price_1T2uVCAYv17Z995V7g1xTSwN',
};

const FALLBACK_PLANS: Plan[] = [
  { id: 'starter', name: 'Starter', priceId: PLAN_PRICE_IDS.starter, amount: 2999, interval: 'month', description: '$29.99/mo — 10 campaigns, cancel anytime' },
  { id: 'professional', name: 'Professional', priceId: PLAN_PRICE_IDS.professional, amount: 9900, interval: 'month', description: '$99/mo — Unlimited campaigns, all features' },
  { id: 'agency', name: 'Agency', priceId: PLAN_PRICE_IDS.agency, amount: 14900, interval: 'month', description: '$149/mo — All features + dedicated support' },
  { id: 'lifetime', name: 'Lifetime', priceId: PLAN_PRICE_IDS.lifetime, amount: 9900, interval: 'once', description: '$99 one-time — Pay once, use forever' },
];

interface SignupPageProps {
  onLogin: () => void;
  onBack: () => void;
  cancelledMessage?: boolean;
}

export function SignupPage({ onLogin, onBack, cancelledMessage }: SignupPageProps) {
  const [plans, setPlans] = useState<Plan[]>(FALLBACK_PLANS);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('professional');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [planDropdownOpen, setPlanDropdownOpen] = useState(false);

  useEffect(() => {
    fetch('/api/stripe/products')
      .then(r => r.json())
      .then(data => {
        if (!data.products || !Array.isArray(data.products)) return;
        const enriched = FALLBACK_PLANS.map(p => ({ ...p }));
        const knownPriceIds = Object.values(PLAN_PRICE_IDS);
        for (const product of data.products) {
          if (!product.active) continue;
          const productName = (product.name || '').toLowerCase().trim();
          let planId: string | null = null;
          if (productName === 'starter') planId = 'starter';
          else if (productName === 'professional') planId = 'professional';
          else if (productName === 'agency') planId = 'agency';
          else if (productName === 'lifetime') planId = 'lifetime';
          if (!planId) continue;
          const isLifetime = planId === 'lifetime';
          const prices = product.prices || [];
          const knownMatch = prices.find((pr: any) => pr.active && knownPriceIds.includes(pr.id));
          const fallbackMatch = prices.find((pr: any) => {
            if (!pr.active) return false;
            return isLifetime ? !pr.recurring : pr.recurring?.interval === 'month';
          });
          const match = knownMatch || fallbackMatch;
          if (match) {
            const idx = enriched.findIndex(p => p.id === planId);
            if (idx >= 0) enriched[idx].priceId = match.id;
          }
        }
        setPlans(enriched);
      })
      .catch(() => {});
  }, []);

  const selectedPlan = plans.find(p => p.id === selectedPlanId) || plans[0];

  const formatPrice = (plan: Plan) => {
    const dollars = (plan.amount / 100).toFixed(0);
    if (plan.interval === 'once') return `$${dollars} one-time`;
    if (plan.interval === 'year') return `$${dollars}/yr`;
    return `$${dollars}/mo`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) { setError('Please enter your full name.'); return; }
    if (!email.trim()) { setError('Please enter your email address.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError('Please enter a valid email address.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (!selectedPlan) { setError('Please select a plan.'); return; }

    setLoading(true);

    fetch('/api/leads/capture', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        source: 'signup',
        page: window.location.pathname,
        referrer: document.referrer,
        metadata: { plan: selectedPlan?.id },
      }),
    }).catch(() => {});

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const res = await fetch('/api/account/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
          name: name.trim(),
          plan: selectedPlan.id,
          priceId: selectedPlan.priceId || undefined,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const data = await res.json();

      if (!data.success) {
        const msg = data.error || '';
        if (msg.toLowerCase().includes('already') || msg.toLowerCase().includes('exists')) {
          setError('An account with this email already exists. Try signing in instead.');
        } else if (msg.toLowerCase().includes('password')) {
          setError('Password is too weak. Use at least 8 characters with a mix of letters and numbers.');
        } else {
          setError(msg || 'Registration failed. Please try again.');
        }
        setRetryCount(c => c + 1);
        return;
      }

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }

      if (data.token) {
        localStorage.setItem('auth_token', data.token);
        if (data.user) localStorage.setItem('user', JSON.stringify(data.user));
        window.location.href = '/';
        return;
      }

      setError('Unexpected response. Please try again.');
      setRetryCount(c => c + 1);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setError('Request timed out. Please check your connection and try again.');
      } else if (!navigator.onLine) {
        setError('You appear to be offline. Please check your connection and try again.');
      } else {
        setError('Something went wrong. Please try again in a moment.');
      }
      setRetryCount(c => c + 1);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors mb-8 text-sm"
        >
          <ArrowLeft size={16} />
          Back to home
        </button>

        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-violet-600 mb-4">
            <span className="text-white font-bold text-xl">A</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
          <p className="text-gray-500 mt-1 text-sm">Start building better campaigns today</p>
        </div>

        {cancelledMessage && (
          <div className="mb-5 flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
            <AlertCircle size={18} className="text-amber-500 mt-0.5 shrink-0" />
            <p className="text-amber-700 text-sm">Payment was cancelled. Please try again when you're ready.</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-2xl p-8 space-y-5 shadow-sm">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Plan</label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setPlanDropdownOpen(!planDropdownOpen)}
                className="w-full flex items-center justify-between bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 hover:border-violet-400 transition-colors"
              >
                <div className="text-left">
                  <div className="font-medium">{selectedPlan?.name}</div>
                  <div className="text-xs text-gray-500">{selectedPlan ? formatPrice(selectedPlan) : ''}</div>
                </div>
                <ChevronDown size={16} className={`text-gray-400 transition-transform ${planDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {planDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl overflow-hidden z-50 shadow-xl">
                  {plans.map(plan => (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => { setSelectedPlanId(plan.id); setPlanDropdownOpen(false); }}
                      className={`w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors text-left ${selectedPlanId === plan.id ? 'bg-violet-50 text-violet-700' : 'text-gray-800'}`}
                    >
                      <div>
                        <div className="font-medium text-sm">{plan.name}</div>
                        <div className="text-xs text-gray-500">{plan.description}</div>
                      </div>
                      {plan.interval === 'once' && (
                        <span className="text-xs bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full border border-emerald-200 ml-2 shrink-0">Best value</span>
                      )}
                      {plan.id === 'professional' && (
                        <span className="text-xs bg-violet-50 text-violet-600 px-2 py-0.5 rounded-full border border-violet-200 ml-2 shrink-0">Most popular</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Jane Smith"
              required
              className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-violet-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="jane@company.com"
              required
              className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-violet-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Min. 8 characters"
                required
                minLength={8}
                className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 pr-12 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-violet-500 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 space-y-2">
              <div className="flex items-start gap-2">
                <AlertCircle size={16} className="text-red-500 mt-0.5 shrink-0" />
                <p className="text-red-600 text-sm">{error}</p>
              </div>
              {error.toLowerCase().includes('already exists') && (
                <button
                  type="button"
                  onClick={onLogin}
                  className="w-full mt-1 py-2 px-4 bg-white border border-red-200 text-red-600 text-sm font-medium rounded-lg hover:bg-red-50 transition-colors"
                >
                  Sign in to existing account →
                </button>
              )}
              {retryCount >= 2 && !error.toLowerCase().includes('already exists') && (
                <p className="text-xs text-red-500">Still having trouble? <a href="mailto:support@adiology.io" className="underline">Contact support</a></p>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 disabled:opacity-60 text-white font-semibold py-3.5 rounded-xl transition-all shadow-sm text-base"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Creating account…
              </>
            ) : retryCount > 0 ? (
              <>
                <RefreshCw size={18} />
                Try Again — {selectedPlan ? formatPrice(selectedPlan) : ''}
              </>
            ) : (
              `Continue to Payment — ${selectedPlan ? formatPrice(selectedPlan) : ''}`
            )}
          </button>

          <div className="flex items-center justify-center gap-4 text-xs text-gray-400">
            <span className="flex items-center gap-1"><CheckCircle size={12} className="text-green-500" /> Secure checkout</span>
            <span className="flex items-center gap-1"><CheckCircle size={12} className="text-green-500" /> Cancel anytime</span>
            <span className="flex items-center gap-1"><CheckCircle size={12} className="text-green-500" /> 30-day refund</span>
          </div>

          <p className="text-center text-xs text-gray-400">
            By continuing, you agree to our{' '}
            <a href="/terms-of-service" className="text-gray-600 hover:text-gray-900 underline">Terms</a>
            {' '}and{' '}
            <a href="/privacy-policy" className="text-gray-600 hover:text-gray-900 underline">Privacy Policy</a>.
          </p>
        </form>

        <p className="text-center mt-6 text-gray-500 text-sm">
          Already have an account?{' '}
          <button onClick={onLogin} className="text-violet-600 hover:text-violet-700 font-medium transition-colors">
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}
