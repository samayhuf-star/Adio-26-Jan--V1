import { useState, useEffect } from 'react';
import { AlertCircle, ChevronDown, Loader2, Eye, EyeOff, ArrowLeft } from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  priceId: string;
  amount: number;
  interval: 'month' | 'year' | 'once';
  description: string;
}

const PLAN_PRICE_IDS: Record<string, string> = {
  starter: 'price_1SzLblAYv17Z995VcDMCe9T5',
  professional: 'price_1SzLb1AYv17Z995VCc8X9AE6',
  agency: 'price_1SzLcjAYv17Z995VngBfarg7',
  lifetime: 'price_1T2uVCAYv17Z995V7g1xTSwN',
};

const FALLBACK_PLANS: Plan[] = [
  { id: 'starter', name: 'Starter', priceId: PLAN_PRICE_IDS.starter, amount: 4900, interval: 'month', description: '$49/mo — 25 campaigns, cancel anytime' },
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
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || 'Registration failed. Please try again.');
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
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors mb-8 text-sm"
        >
          <ArrowLeft size={16} />
          Back to home
        </button>

        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 mb-4">
            <span className="text-white font-bold text-xl">A</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Create your account</h1>
          <p className="text-slate-400 mt-1 text-sm">Start building better campaigns today</p>
        </div>

        {cancelledMessage && (
          <div className="mb-5 flex items-start gap-3 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
            <AlertCircle size={18} className="text-amber-400 mt-0.5 shrink-0" />
            <p className="text-amber-300 text-sm">Payment was cancelled. Please try again when you're ready.</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Plan</label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setPlanDropdownOpen(!planDropdownOpen)}
                className="w-full flex items-center justify-between bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white hover:border-indigo-500/50 transition-colors"
              >
                <div className="text-left">
                  <div className="font-medium">{selectedPlan?.name}</div>
                  <div className="text-xs text-slate-400">{selectedPlan ? formatPrice(selectedPlan) : ''}</div>
                </div>
                <ChevronDown size={16} className={`text-slate-400 transition-transform ${planDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {planDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-xl overflow-hidden z-50 shadow-xl">
                  {plans.map(plan => (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => { setSelectedPlanId(plan.id); setPlanDropdownOpen(false); }}
                      className={`w-full flex items-center justify-between px-4 py-3 hover:bg-slate-700 transition-colors text-left ${selectedPlanId === plan.id ? 'bg-indigo-600/20 text-indigo-300' : 'text-slate-200'}`}
                    >
                      <div>
                        <div className="font-medium text-sm">{plan.name}</div>
                        <div className="text-xs text-slate-400">{plan.description}</div>
                      </div>
                      {plan.interval === 'once' && (
                        <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30 ml-2 shrink-0">Best value</span>
                      )}
                      {plan.id === 'professional' && (
                        <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full border border-purple-500/30 ml-2 shrink-0">Most popular</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Jane Smith"
              required
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="jane@company.com"
              required
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Min. 8 characters"
                required
                minLength={8}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 pr-12 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 rounded-xl p-3">
              <AlertCircle size={16} className="text-red-400 mt-0.5 shrink-0" />
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-all"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Creating account...
              </>
            ) : (
              `Proceed to Payment — ${selectedPlan ? formatPrice(selectedPlan) : ''}`
            )}
          </button>

          <p className="text-center text-xs text-slate-500">
            By continuing, you agree to our{' '}
            <a href="/terms-of-service" className="text-slate-400 hover:text-slate-200 underline">Terms</a>
            {' '}and{' '}
            <a href="/privacy-policy" className="text-slate-400 hover:text-slate-200 underline">Privacy Policy</a>.
          </p>
        </form>

        <p className="text-center mt-6 text-slate-400 text-sm">
          Already have an account?{' '}
          <button onClick={onLogin} className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}
