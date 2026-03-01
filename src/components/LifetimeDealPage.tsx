import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import {
  Zap, Check, Sparkles, Target, BarChart3,
  FileText, Globe, Layers, Shield, ArrowRight,
  TrendingUp, Star, CreditCard, Gift, Infinity,
  MousePointer, Clock, Award, Users, Lock,
  ChevronDown, ChevronUp, CheckCircle, X, Flame,
  Rocket, BadgeCheck, Bolt
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { getCurrentUser } from '../utils/auth';

interface LifetimeDealPageProps {
  onNavigate?: (page: string) => void;
}

export function LifetimeDealPage({ onNavigate }: LifetimeDealPageProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const currentUser = getCurrentUser();
  const [email, setEmail] = useState(currentUser?.email || '');
  const [emailError, setEmailError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoApplied, setPromoApplied] = useState<{ valid: boolean; discount?: string; newAmount?: number } | null>(null);
  const [promoError, setPromoError] = useState('');
  const [checkoutEmail, setCheckoutEmail] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'true') {
      const storedEmail = sessionStorage.getItem('lifetime_checkout_email') || '';
      setCheckoutEmail(storedEmail);
      setShowSuccess(true);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const processCheckout = async (userEmail: string) => {
    setIsLoading(true);
    setEmailError('');
    try {
      sessionStorage.setItem('lifetime_checkout_email', userEmail.trim().toLowerCase());
      const response = await fetch('/api/stripe/lifetime-deal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail,
          successUrl: `${window.location.origin}/lifetime-deal?success=true`,
          cancelUrl: `${window.location.origin}/lifetime-deal`,
          ...(promoApplied?.valid && promoCode.trim() ? { promoCode: promoCode.trim() } : {}),
        }),
      });
      const data = await response.json();
      if (response.ok && data.url) {
        window.location.href = data.url;
      } else {
        setEmailError(data.error || 'Something went wrong. Please try again.');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      setEmailError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    setPromoLoading(true);
    setPromoError('');
    setPromoApplied(null);
    try {
      const response = await fetch('/api/stripe/validate-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: promoCode.trim() }),
      });
      const data = await response.json();
      if (!response.ok || !data.valid) {
        setPromoError(data.error || 'Invalid promo code');
        return;
      }
      let discountLabel: string | undefined;
      let newAmount: number | undefined;
      if (data.discount?.type === 'percent') {
        discountLabel = `${data.discount.value}% off`;
        newAmount = Math.round(9900 * (1 - data.discount.value / 100));
      } else if (data.discount?.type === 'amount') {
        discountLabel = `$${data.discount.value} off`;
        newAmount = Math.max(0, 9900 - data.discount.value * 100);
      }
      setPromoApplied({ valid: true, discount: discountLabel, newAmount });
    } catch {
      setPromoError('Failed to validate promo code');
    } finally {
      setPromoLoading(false);
    }
  };

  const handleBuyNow = () => {
    setShowEmailModal(true);
    setEmailError('');
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setEmailError('Please enter a valid email address.');
      return;
    }
    fetch('/api/leads/capture', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: trimmed,
        source: 'lifetime_deal',
        page: window.location.pathname,
        referrer: document.referrer,
      }),
    }).catch(() => {});
    processCheckout(trimmed);
  };

  const features = [
    { icon: Target, title: 'Smart Campaign Builder', desc: '13 proven structures: SKAG, STAG, Alpha-Beta, and more' },
    { icon: Sparkles, title: 'AI Keyword Generation', desc: 'Generate hundreds of targeted keywords instantly' },
    { icon: FileText, title: 'RSA, DKI & Call-Only Ads', desc: 'Policy-compliant ads with live preview & strength scoring' },
    { icon: Globe, title: 'Geo Targeting', desc: 'Target by country, state, city or ZIP — 15,000+ locations' },
    { icon: Layers, title: '70+ Campaign Presets', desc: 'Ready templates for legal, dental, HVAC, real estate & more' },
    { icon: BarChart3, title: 'Google Ads Editor Export', desc: 'Export & import directly into Google Ads Editor in minutes' },
    { icon: TrendingUp, title: 'Keyword Mixer & Planner', desc: 'Discover and filter long-tail keyword opportunities' },
    { icon: Shield, title: 'Click Guard Protection', desc: 'Bot detection, IP blocking & live traffic monitoring' },
    { icon: MousePointer, title: 'Campaign Extensions', desc: 'Sitelinks, callouts, snippets, and call extensions' },
    { icon: Users, title: 'Up to 5 Team Seats', desc: 'Collaborate with your team on campaigns together' },
  ];

  const comparisonRows = [
    { feature: 'Campaign structures', lifetime: '13 types', others: '2–3 types' },
    { feature: 'AI keyword generation', lifetime: 'Unlimited', others: 'Limited credits' },
    { feature: 'Ad types', lifetime: 'RSA, DKI, Call-Only', others: 'RSA only' },
    { feature: 'Campaign presets', lifetime: '70+', others: '5–10' },
    { feature: 'Click fraud protection', lifetime: 'Built-in', others: '$50+/mo extra' },
    { feature: 'Google Ads Editor export', lifetime: '✓ Included', others: 'Manual work' },
    { feature: 'Campaign extensions', lifetime: 'Full support', others: 'Limited' },
    { feature: 'Team seats', lifetime: 'Up to 5', others: '1 seat' },
    { feature: 'Future updates', lifetime: 'Forever free', others: 'Version-locked' },
    { feature: 'Total cost (2 years)', lifetime: '$99 once', others: '$1,200–$3,600+' },
  ];

  const faqs = [
    { q: 'What does "Lifetime" mean exactly?', a: 'You pay once and get access to all current and future features of Adiology forever. No monthly fees, no renewal charges, no hidden costs.' },
    { q: 'Is there a money-back guarantee?', a: "Yes! We offer a 14-day money-back guarantee. If you're not satisfied for any reason, contact us for a full refund." },
    { q: 'Will I get future updates?', a: 'Absolutely. All future features, improvements, and updates are included with your lifetime deal at no additional cost.' },
    { q: 'How many campaigns can I create?', a: 'Unlimited. There are no caps on the number of campaigns, keywords, or ads you can generate.' },
    { q: 'Can I use this for client work?', a: 'Yes. Many agency owners use Adiology to build campaigns for their clients. You can export and manage campaigns for multiple businesses.' },
    { q: 'What payment methods do you accept?', a: 'We accept all major credit and debit cards through Stripe, including Visa, Mastercard, American Express, and Discover.' },
  ];

  const testimonials = [
    { initials: 'SM', name: 'Sarah M.', role: 'Digital Marketing Manager', text: 'Cut our campaign setup time by 80%. What used to take days now takes minutes.', rating: 5, color: 'from-purple-500 to-indigo-500' },
    { initials: 'MR', name: 'Mike R.', role: 'Agency Owner', text: 'The AI keyword generation is incredible. Generated 500+ targeted keywords in seconds.', rating: 5, color: 'from-emerald-500 to-teal-500' },
    { initials: 'JL', name: 'Jennifer L.', role: 'Small Business Owner', text: 'Finally a tool that makes Google Ads accessible. The presets are a game-changer.', rating: 5, color: 'from-orange-500 to-rose-500' },
  ];

  const stats = [
    { value: '500+', label: 'Marketers & Agencies' },
    { value: '13', label: 'Campaign Structures' },
    { value: '70+', label: 'Ready-Made Presets' },
    { value: '$1,700+', label: 'Saved vs Monthly Plans' },
  ];

  return (
    <>
      <Helmet>
        <title>Lifetime Deal - Adiology | One-Time Payment, Lifetime Access</title>
        <meta name="description" content="Get lifetime access to Adiology for a one-time payment of $99. All features included: campaign builder, keyword planner, click guard, AI blog generator, and more." />
        <link rel="canonical" href="https://adiology.io/lifetime-deal" />
        <meta property="og:title" content="Lifetime Deal - Adiology | $99 One-Time Payment" />
        <meta property="og:description" content="Get lifetime access to all Adiology features for just $99. Campaign builder, keyword planner, click guard, and more." />
        <meta property="og:url" content="https://adiology.io/lifetime-deal" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://adiology.io/og-image.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Lifetime Deal - Adiology | $99 One-Time Payment" />
        <meta name="twitter:description" content="Get lifetime access to all Adiology features for just $99." />
        <meta name="twitter:image" content="https://adiology.io/og-image.png" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Product",
          "name": "Adiology Lifetime Deal",
          "description": "Lifetime access to all Adiology Google Ads tools",
          "url": "https://adiology.io/lifetime-deal",
          "offers": { "@type": "Offer", "price": "99", "priceCurrency": "USD", "availability": "https://schema.org/InStock" },
          "brand": { "@type": "Organization", "name": "Adiology" }
        })}</script>
      </Helmet>

      <div className="min-h-screen bg-slate-950 text-white">

        {/* Sticky Nav */}
        <nav className="border-b border-white/10 bg-slate-950/90 backdrop-blur-lg sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 cursor-pointer flex-shrink-0" onClick={() => onNavigate?.('home')}>
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-lg">A</span>
              </div>
              <span className="text-lg font-bold hidden sm:block">Adiology</span>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="text-xs sm:text-sm text-emerald-400 font-medium hidden xs:block whitespace-nowrap">
                <Flame className="w-3.5 h-3.5 inline mr-1" />
                Limited Offer
              </span>
              <Button
                onClick={handleBuyNow}
                disabled={isLoading}
                size="sm"
                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold px-3 sm:px-5 text-xs sm:text-sm whitespace-nowrap"
              >
                {isLoading ? '...' : <><span className="hidden sm:inline">Get Lifetime Access — </span>$99</>}
              </Button>
            </div>
          </div>
        </nav>

        {/* Success Banner */}
        {showSuccess && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="bg-emerald-500/20 border-b border-emerald-500/30">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                <CheckCircle className="w-6 h-6 text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-emerald-300 mb-1">Payment Successful!</h3>
                <p className="text-emerald-200/80 text-sm leading-relaxed">
                  {checkoutEmail ? <>Your Lifetime Access is confirmed for <strong className="text-emerald-300">{checkoutEmail}</strong>. Check your email for setup instructions.</> : <>Your Lifetime Access is confirmed! Check your email for setup instructions.</>}
                </p>
                <Button onClick={() => { if (checkoutEmail) sessionStorage.setItem('lifetime_signup_email', checkoutEmail); onNavigate?.('complete-signup'); }} className="mt-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-5" size="sm">
                  Set Up Your Account <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </div>
              <button onClick={() => setShowSuccess(false)} className="text-emerald-400/60 hover:text-emerald-300 transition-colors flex-shrink-0 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}

        {/* Hero Section */}
        <section className="relative pt-16 pb-12 px-4 sm:px-6 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(16,185,129,0.15),transparent)]" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-4xl mx-auto relative z-10 text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>

              {/* Urgency Badge */}
              <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-4 py-1.5 mb-6">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
                <span className="text-sm font-semibold text-emerald-400 uppercase tracking-wider">Limited Time — Lifetime Deal</span>
              </div>

              <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold mb-5 leading-[1.1] tracking-tight">
                Pay Once.{' '}
                <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
                  Use Forever.
                </span>
              </h1>

              <p className="text-base sm:text-xl text-slate-300 mb-10 max-w-2xl mx-auto leading-relaxed">
                The complete Google Ads campaign builder — no subscriptions, no renewals.
                <span className="text-white font-medium"> One payment, lifetime access.</span>
              </p>

              {/* Price Card */}
              <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="max-w-sm mx-auto mb-10">
                <div className="relative">
                  <div className="absolute -inset-[2px] bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 rounded-2xl blur-sm opacity-70" />
                  <div className="relative bg-slate-900 rounded-2xl p-6 sm:p-8">
                    {/* Best Value Tag */}
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wide shadow-lg">
                        Best Value
                      </span>
                    </div>

                    <div className="flex items-center justify-center gap-2 mb-3 mt-1">
                      <Infinity className="w-5 h-5 text-emerald-400" />
                      <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Lifetime Access</span>
                    </div>

                    <div className="flex items-baseline justify-center gap-3 mb-1">
                      <span className="text-xl text-slate-500 line-through font-medium">$149</span>
                      <span className="text-6xl sm:text-7xl font-black text-white">$99</span>
                    </div>
                    <p className="text-slate-400 text-sm mb-1">One-time payment. No recurring fees.</p>
                    <p className="text-emerald-400 text-sm font-semibold mb-5">Save $1,700+ vs. monthly plans</p>

                    <Button
                      onClick={handleBuyNow}
                      disabled={isLoading}
                      className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-base h-12 rounded-xl shadow-lg shadow-emerald-500/30 transition-all duration-200 hover:shadow-emerald-500/50 hover:scale-[1.02]"
                    >
                      {isLoading ? (
                        <span className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Processing...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <CreditCard className="w-5 h-5" />
                          Get Lifetime Access Now
                          <ArrowRight className="w-4 h-4" />
                        </span>
                      )}
                    </Button>

                    <div className="flex items-center justify-center gap-4 mt-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><Lock className="w-3 h-3" /> Secure checkout</span>
                      <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> 14-day guarantee</span>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Trust Pills */}
              <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-slate-400">
                {['No monthly fees', 'Lifetime updates', '14-day money-back', 'All features included'].map((t) => (
                  <span key={t} className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    {t}
                  </span>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Stats Bar */}
        <section className="border-y border-white/5 bg-slate-900/40 py-8 px-4 sm:px-6">
          <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            {stats.map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
                <div className="text-2xl sm:text-3xl font-extrabold text-white mb-0.5">{s.value}</div>
                <div className="text-xs sm:text-sm text-slate-400">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 sm:py-20 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
              <h2 className="text-2xl sm:text-4xl font-bold mb-3">Everything You Need. Nothing You Don't.</h2>
              <p className="text-base sm:text-lg text-slate-400 max-w-xl mx-auto">All features included. No upsells. No hidden tiers.</p>
            </motion.div>

            <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
              {features.map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.04 }}
                  className="group bg-slate-900 border border-white/5 rounded-xl p-4 sm:p-5 flex gap-4 hover:border-emerald-500/40 hover:bg-slate-800/80 transition-all duration-200"
                >
                  <div className="flex-shrink-0 w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                    <f.icon className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-white text-sm sm:text-base mb-0.5">{f.title}</h3>
                    <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">{f.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Comparison Section */}
        <section className="py-16 sm:py-20 px-4 sm:px-6 bg-slate-900/40">
          <div className="max-w-3xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
              <h2 className="text-2xl sm:text-4xl font-bold mb-3">See How It Compares</h2>
              <p className="text-base sm:text-lg text-slate-400">The smartest investment for your Google Ads workflow.</p>
            </motion.div>

            {/* Mobile-scrollable comparison table */}
            <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
              <div className="min-w-[480px] sm:min-w-0 bg-slate-900 border border-white/10 rounded-2xl overflow-hidden">
                <div className="grid grid-cols-3 bg-slate-800/80">
                  <div className="p-3 sm:p-4 text-xs sm:text-sm font-medium text-slate-400">Feature</div>
                  <div className="p-3 sm:p-4 text-xs sm:text-sm font-bold text-emerald-400 text-center bg-emerald-500/10 border-x border-emerald-500/20">
                    <span className="flex items-center justify-center gap-1">
                      <BadgeCheck className="w-3.5 h-3.5" />
                      Adiology Lifetime
                    </span>
                  </div>
                  <div className="p-3 sm:p-4 text-xs sm:text-sm font-medium text-slate-400 text-center">Other Tools</div>
                </div>
                {comparisonRows.map((row, i) => (
                  <div key={i} className={`grid grid-cols-3 border-b border-white/5 last:border-0 ${i % 2 === 0 ? 'bg-slate-800/20' : ''}`}>
                    <div className="p-3 sm:p-4 text-xs sm:text-sm text-slate-300">{row.feature}</div>
                    <div className="p-3 sm:p-4 text-xs sm:text-sm text-emerald-400 font-medium text-center bg-emerald-500/5 border-x border-emerald-500/10">
                      {row.lifetime}
                    </div>
                    <div className="p-3 sm:p-4 text-xs sm:text-sm text-slate-500 text-center">{row.others}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Savings callout */}
            <motion.div initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mt-6 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-center">
              <p className="text-sm sm:text-base text-emerald-300 font-medium">
                💰 At $99 once vs. ~$150/mo for alternatives — you break even in <strong className="text-white">under 1 month</strong> and save <strong className="text-white">$1,700+</strong> over 2 years.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-16 sm:py-20 px-4 sm:px-6">
          <div className="max-w-4xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
              <h2 className="text-2xl sm:text-4xl font-bold mb-2">Trusted by Marketers & Agencies</h2>
              <div className="flex items-center justify-center gap-1 mt-3">
                {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 fill-amber-400" />)}
                <span className="ml-2 text-sm text-slate-400">Rated 5/5 by users</span>
              </div>
            </motion.div>

            <div className="grid sm:grid-cols-3 gap-4 sm:gap-5">
              {testimonials.map((t, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-slate-900 border border-white/5 rounded-xl p-5 flex flex-col gap-4"
                >
                  <div className="flex gap-0.5">
                    {Array.from({ length: t.rating }).map((_, j) => <Star key={j} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />)}
                  </div>
                  <p className="text-slate-300 text-sm leading-relaxed flex-1">"{t.text}"</p>
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${t.color} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                      {t.initials}
                    </div>
                    <div>
                      <div className="font-semibold text-white text-sm">{t.name}</div>
                      <div className="text-xs text-slate-500">{t.role}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 sm:py-20 px-4 sm:px-6 bg-slate-900/40">
          <div className="max-w-2xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-10">
              <h2 className="text-2xl sm:text-4xl font-bold mb-2">Frequently Asked Questions</h2>
              <p className="text-slate-400 text-sm sm:text-base">Everything you need to know before you buy.</p>
            </motion.div>

            <div className="space-y-2">
              {faqs.map((faq, i) => (
                <motion.div key={i} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }} className="bg-slate-900 border border-white/5 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between p-4 sm:p-5 text-left gap-3 hover:bg-slate-800/50 transition-colors"
                  >
                    <span className="font-medium text-white text-sm sm:text-base">{faq.q}</span>
                    {openFaq === i
                      ? <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      : <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />}
                  </button>
                  {openFaq === i && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 sm:px-5 pb-4 sm:pb-5">
                      <p className="text-slate-400 text-sm leading-relaxed">{faq.a}</p>
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-16 sm:py-20 px-4 sm:px-6 pb-28 sm:pb-20">
          <div className="max-w-2xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <div className="relative">
                <div className="absolute -inset-[2px] bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 rounded-2xl blur opacity-50" />
                <div className="relative bg-slate-900 border border-white/10 rounded-2xl p-8 sm:p-10 text-center">
                  <div className="w-14 h-14 bg-emerald-500/15 rounded-2xl flex items-center justify-center mx-auto mb-5">
                    <Rocket className="w-7 h-7 text-emerald-400" />
                  </div>
                  <h2 className="text-2xl sm:text-4xl font-extrabold mb-2">Lock In Your Lifetime Deal</h2>
                  <p className="text-slate-400 mb-5 text-sm sm:text-base">One payment. Unlimited access. Forever.</p>

                  <div className="flex items-baseline justify-center gap-3 mb-6">
                    <span className="text-lg sm:text-xl text-slate-500 line-through">$149</span>
                    <span className="text-5xl sm:text-6xl font-black text-white">$99</span>
                  </div>

                  <Button
                    onClick={handleBuyNow}
                    disabled={isLoading}
                    className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-base sm:text-lg px-10 h-12 sm:h-14 rounded-xl shadow-xl shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-[1.02] transition-all duration-200"
                  >
                    {isLoading ? 'Processing...' : (
                      <span className="flex items-center gap-2">
                        <CreditCard className="w-5 h-5" />
                        Get Lifetime Access — $99
                      </span>
                    )}
                  </Button>

                  <p className="text-xs text-slate-500 mt-4 flex items-center justify-center gap-1.5">
                    <Lock className="w-3 h-3" />
                    Secure checkout by Stripe · 14-day money-back guarantee
                  </p>

                  <div className="mt-6 pt-6 border-t border-white/5 grid grid-cols-3 gap-2 text-center">
                    {[
                      { icon: Shield, label: '14-Day Guarantee' },
                      { icon: Infinity, label: 'Lifetime Updates' },
                      { icon: Users, label: 'Up to 5 Seats' },
                    ].map((item, i) => (
                      <div key={i} className="flex flex-col items-center gap-1.5">
                        <item.icon className="w-5 h-5 text-emerald-400" />
                        <span className="text-xs text-slate-400">{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/10 py-6 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-slate-500">
            <span>© {new Date().getFullYear()} Adiology. All rights reserved.</span>
            <div className="flex gap-4 sm:gap-6 flex-wrap justify-center">
              <button onClick={() => onNavigate?.('privacy-policy')} className="hover:text-slate-300 transition-colors">Privacy Policy</button>
              <button onClick={() => onNavigate?.('terms-of-service')} className="hover:text-slate-300 transition-colors">Terms of Service</button>
              <button onClick={() => onNavigate?.('refund-policy')} className="hover:text-slate-300 transition-colors">Refund Policy</button>
            </div>
          </div>
        </footer>

        {/* Sticky Mobile CTA Bar */}
        <div className="fixed bottom-0 left-0 right-0 z-40 sm:hidden border-t border-white/10 bg-slate-950/95 backdrop-blur-lg p-3 safe-area-pb">
          <Button
            onClick={handleBuyNow}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold h-12 rounded-xl text-base shadow-lg shadow-emerald-500/25"
          >
            {isLoading ? 'Processing...' : (
              <span className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Get Lifetime Access — $99
              </span>
            )}
          </Button>
          <p className="text-center text-xs text-slate-500 mt-1.5 flex items-center justify-center gap-1">
            <Shield className="w-3 h-3" /> 14-day money-back guarantee
          </p>
        </div>

        {/* Email Modal */}
        {showEmailModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className="bg-slate-800 border border-slate-700 rounded-2xl p-5 sm:p-6 w-full max-w-md shadow-2xl"
            >
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-lg font-bold text-white">Almost there!</h3>
                <button onClick={() => { setShowEmailModal(false); setEmailError(''); }} className="text-slate-400 hover:text-white transition-colors p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-slate-400 text-sm mb-5">Enter your email to proceed to secure checkout.</p>

              <form onSubmit={handleEmailSubmit} className="space-y-3">
                <input
                  type="email"
                  placeholder={currentUser?.email || "your@email.com"}
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setEmailError(''); }}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                  autoFocus
                />
                {emailError && <p className="text-red-400 text-sm">{emailError}</p>}

                <div>
                  <label className="text-slate-400 text-xs mb-1.5 block">Promo code (optional)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter promo code"
                      value={promoCode}
                      onChange={(e) => { setPromoCode(e.target.value); setPromoError(''); setPromoApplied(null); }}
                      className="flex-1 px-3 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={handleApplyPromo}
                      disabled={promoLoading || !promoCode.trim()}
                      className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg border border-slate-600 disabled:opacity-50 transition-colors font-medium"
                    >
                      {promoLoading ? '...' : 'Apply'}
                    </button>
                  </div>
                  {promoError && <p className="text-red-400 text-xs mt-1">{promoError}</p>}
                  {promoApplied?.valid && (
                    <p className="text-emerald-400 text-xs mt-1">
                      {promoApplied.discount} applied!{promoApplied.newAmount !== undefined && <span> New price: ${(promoApplied.newAmount / 100).toFixed(2)}</span>}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold h-11 rounded-lg text-sm"
                >
                  {isLoading ? 'Processing...' : promoApplied?.newAmount !== undefined
                    ? `Continue to Checkout — $${(promoApplied.newAmount / 100).toFixed(2)}`
                    : 'Continue to Checkout — $99'}
                </Button>
              </form>

              <p className="text-xs text-slate-500 mt-4 text-center flex items-center justify-center gap-1">
                <Lock className="w-3 h-3" /> Secure checkout powered by Stripe
              </p>
            </motion.div>
          </div>
        )}
      </div>
    </>
  );
}
