import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import {
  Zap, Check, Sparkles, Target, BarChart3,
  FileText, Globe, Layers, Shield, ArrowRight,
  TrendingUp, Star, CreditCard, Gift, Infinity,
  MousePointer, Clock, Users, Lock,
  ChevronDown, ChevronUp, CheckCircle, X, Flame,
  Rocket, BadgeCheck, Search, MapPin, Brain, Inbox
} from 'lucide-react';
import { Button } from './ui/button';
import { LTDProductDemo } from './LTDProductDemo';
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
  const [countdown, setCountdown] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'true') {
      const storedEmail = sessionStorage.getItem('lifetime_checkout_email') || '';
      setCheckoutEmail(storedEmail);
      setShowSuccess(true);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);
      const diff = midnight.getTime() - now.getTime();
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setCountdown(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
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
    } catch {
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
      if (!response.ok || !data.valid) { setPromoError(data.error || 'Invalid promo code'); return; }
      let discountLabel: string | undefined;
      let newAmount: number | undefined;
      if (data.discount?.type === 'percent') { discountLabel = `${data.discount.value}% off`; newAmount = Math.round(9900 * (1 - data.discount.value / 100)); }
      else if (data.discount?.type === 'amount') { discountLabel = `$${data.discount.value} off`; newAmount = Math.max(0, 9900 - data.discount.value * 100); }
      setPromoApplied({ valid: true, discount: discountLabel, newAmount });
    } catch { setPromoError('Failed to validate promo code'); }
    finally { setPromoLoading(false); }
  };

  const handleBuyNow = () => { setShowEmailModal(true); setEmailError(''); };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) { setEmailError('Please enter a valid email address.'); return; }
    fetch('/api/leads/capture', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: trimmed, source: 'lifetime_deal', page: window.location.pathname }) }).catch(() => {});
    processCheckout(trimmed);
  };

  const tools = [
    { icon: Target, label: 'Campaign Builder', desc: '13 structures, 70+ presets', color: 'emerald' },
    { icon: Shield, label: 'Click Guard', desc: 'Real-time fraud blocking', color: 'teal' },
    { icon: Search, label: 'Keyword Planner', desc: '1,600+ keywords per build', color: 'cyan' },
    { icon: Globe, label: 'Domain Monitor', desc: 'SSL, DNS & expiry alerts', color: 'emerald' },
    { icon: Brain, label: 'AI Ad Generator', desc: 'RSA, DKI & Call-Only ads', color: 'teal' },
    { icon: Inbox, label: 'Proxy Mail', desc: 'Anonymous competitor research', color: 'cyan' },
    { icon: MapPin, label: 'Geo Targeting', desc: '15,000+ locations', color: 'emerald' },
    { icon: BarChart3, label: 'Ads Editor Export', desc: 'One-click CSV export', color: 'teal' },
  ];

  const comparisonRows = [
    { feature: 'Campaign structures', lifetime: '13 types', others: '2–3 types' },
    { feature: 'Keywords per build', lifetime: '1,600+', others: '100–200' },
    { feature: 'AI keyword generation', lifetime: 'Unlimited', others: 'Limited credits' },
    { feature: 'Ad types', lifetime: 'RSA, DKI, Call-Only', others: 'RSA only' },
    { feature: 'Campaign presets', lifetime: '70+', others: '5–10' },
    { feature: 'Click fraud protection', lifetime: 'Built-in', others: '$50+/mo extra' },
    { feature: 'Google Ads Editor export', lifetime: '✓ Included', others: 'Manual work' },
    { feature: 'Domain monitoring', lifetime: 'Unlimited domains', others: 'Not included' },
    { feature: 'Team seats', lifetime: 'Up to 5', others: '1 seat' },
    { feature: 'Future updates', lifetime: 'Forever free', others: 'Version-locked' },
    { feature: 'Total cost (2 years)', lifetime: '$99 once', others: '$1,200–$3,600+' },
  ];

  const faqs = [
    { q: 'What does "Lifetime" mean exactly?', a: 'You pay once — $99 — and get access to all current and future features of Adiology forever. No monthly fees, no renewals, no hidden costs.' },
    { q: 'Is there a money-back guarantee?', a: "Yes. We offer a 14-day full money-back guarantee. If you're not satisfied for any reason, contact us for an immediate full refund." },
    { q: 'Will I get future updates?', a: 'Absolutely. All future features, tools, and improvements are included with your lifetime deal at no additional cost — forever.' },
    { q: 'How many campaigns can I create?', a: 'Unlimited. There are no caps on the number of campaigns, keywords, or ads you can generate.' },
    { q: 'Can I use this for client work?', a: 'Yes. Many agency owners use Adiology to build campaigns for their clients. You can export campaigns for unlimited businesses.' },
    { q: 'What payment methods do you accept?', a: 'All major credit and debit cards through Stripe: Visa, Mastercard, American Express, and Discover.' },
  ];

  const testimonials = [
    { initials: 'SM', name: 'Sarah M.', role: 'Digital Marketing Manager', text: 'Cut our campaign setup time by 80%. What used to take 3 days now takes 2 hours. The keyword planner alone is worth 10x the price.', rating: 5, color: 'from-emerald-500 to-teal-500' },
    { initials: 'MR', name: 'Mike R.', role: 'Agency Owner, 15 clients', text: 'I cancelled $280/mo in separate tool subscriptions the week I bought this. Best purchase decision of the year.', rating: 5, color: 'from-teal-500 to-cyan-500' },
    { initials: 'JL', name: 'Jennifer L.', role: 'Small Business Owner', text: 'Click Guard stopped a competitor from draining my budget. Caught 1,200+ fraudulent clicks in the first week.', rating: 5, color: 'from-cyan-500 to-emerald-500' },
  ];

  return (
    <>
      <Helmet>
        <title>Lifetime Deal - Adiology | Complete Google Ads Platform — $99 Once</title>
        <meta name="description" content="Get lifetime access to the complete Adiology Google Ads platform for a one-time $99. Campaign builder, keyword planner, click fraud protection, domain monitoring and more." />
        <link rel="canonical" href="https://adiology.io/lifetime-deal" />
        <script type="application/ld+json">{JSON.stringify({ "@context": "https://schema.org", "@type": "Product", "name": "Adiology Lifetime Deal", "description": "Lifetime access to all Adiology Google Ads tools", "url": "https://adiology.io/lifetime-deal", "offers": { "@type": "Offer", "price": "99", "priceCurrency": "USD", "availability": "https://schema.org/InStock" }, "brand": { "@type": "Organization", "name": "Adiology" } })}</script>
        <script type="text/javascript">{`window._tfa = window._tfa || []; window._tfa.push({notify: 'event', name: 'page_view', id: 2006301}); !function (t, f, a, x) { if (!document.getElementById(x)) { t.async = 1; t.src = a; t.id = x; f.parentNode.insertBefore(t, f); } }(document.createElement('script'), document.getElementsByTagName('script')[0], '//cdn.taboola.com/libtrc/unip/2006301/tfa.js', 'tb_tfa_script');`}</script>
      </Helmet>

      <div className="min-h-screen bg-slate-950 text-white">

        {/* Sticky Nav */}
        <nav className="border-b border-white/10 bg-slate-950/90 backdrop-blur-lg sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 cursor-pointer flex-shrink-0" onClick={() => onNavigate?.('home')}>
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-lg">A</span>
              </div>
              <span className="text-lg font-bold hidden sm:block">Adiology</span>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="text-xs sm:text-sm text-emerald-400 font-medium hidden sm:block whitespace-nowrap">
                <Flame className="w-3.5 h-3.5 inline mr-1" /> Limited Offer
              </span>
              <Button onClick={handleBuyNow} disabled={isLoading} size="sm"
                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold px-4 sm:px-6 text-xs sm:text-sm"
              >
                {isLoading ? '...' : 'Get Lifetime Access — $99'}
              </Button>
            </div>
          </div>
        </nav>

        {/* Success Banner */}
        {showSuccess && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="bg-emerald-500/20 border-b border-emerald-500/30">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 flex items-start gap-3">
              <CheckCircle className="w-6 h-6 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-lg font-bold text-emerald-300 mb-1">Payment Successful!</h3>
                <p className="text-emerald-200/80 text-sm">{checkoutEmail ? <>Lifetime Access confirmed for <strong className="text-emerald-300">{checkoutEmail}</strong>. Check your email for setup instructions.</> : 'Lifetime Access confirmed! Check your email.'}</p>
                <Button onClick={() => { if (checkoutEmail) sessionStorage.setItem('lifetime_signup_email', checkoutEmail); onNavigate?.('complete-signup'); }} className="mt-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-5" size="sm">
                  Set Up Your Account <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </div>
              <button onClick={() => setShowSuccess(false)} className="text-emerald-400/60 hover:text-emerald-300 p-1 flex-shrink-0"><X className="w-5 h-5" /></button>
            </div>
          </motion.div>
        )}

        {/* ===== HERO ===== */}
        <section className="relative pt-12 sm:pt-20 pb-0 px-4 sm:px-6 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(16,185,129,0.12),transparent)]" />

          <div className="max-w-7xl mx-auto relative z-10">
            <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">

              {/* Left: copy */}
              <motion.div initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
                <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-4 py-1.5 mb-5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-sm font-semibold text-emerald-400 uppercase tracking-wider">Lifetime Deal — Limited Time</span>
                </div>
                {countdown && (
                  <div className="flex items-center gap-2 mb-4">
                    <Clock className="w-4 h-4 text-amber-400" />
                    <span className="text-sm font-mono font-bold text-amber-400">Offer ends in {countdown}</span>
                  </div>
                )}
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-5 leading-[1.08] tracking-tight">
                  The Complete<br />
                  Google Ads Platform —<br />
                  <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
                    One Payment, Forever.
                  </span>
                </h1>
                <p className="text-base sm:text-lg text-slate-300 mb-6 leading-relaxed max-w-lg">
                  Campaign builder, keyword planner, click fraud protection, domain monitoring, AI ad generator — everything in one platform. Pay $99 once and never pay again.
                </p>

                {/* Tool pills */}
                <div className="flex flex-wrap gap-2 mb-8">
                  {['Campaign Builder', 'Click Guard', 'Keyword Planner', 'Domain Monitor', 'AI Ads', 'Proxy Mail', 'Geo Targeting'].map(t => (
                    <span key={t} className="flex items-center gap-1.5 text-xs font-medium bg-white/5 border border-white/10 rounded-full px-3 py-1 text-slate-300">
                      <Check className="w-3 h-3 text-emerald-400" /> {t}
                    </span>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                  <Button onClick={handleBuyNow} disabled={isLoading}
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-base h-13 px-8 rounded-xl shadow-xl shadow-emerald-500/20 hover:scale-[1.02] transition-all"
                  >
                    <CreditCard className="w-5 h-5 mr-2" />
                    {isLoading ? 'Processing...' : 'Get Lifetime Access — $99'}
                  </Button>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><Lock className="w-3 h-3" /> Secure checkout</span>
                  <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> 14-day guarantee</span>
                  <span className="flex items-center gap-1"><Infinity className="w-3 h-3" /> Lifetime updates</span>
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" /> Up to 5 seats</span>
                </div>
              </motion.div>

              {/* Right: Product Demo */}
              <motion.div initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.15 }}>
                <LTDProductDemo theme="dark-emerald" />
              </motion.div>
            </div>
          </div>
        </section>

        {/* Stats Bar */}
        <section className="border-y border-white/5 bg-slate-900/40 py-8 px-4 sm:px-6 mt-12">
          <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            {[
              { value: '8', label: 'Tools in One Platform' },
              { value: '13', label: 'Campaign Structures' },
              { value: '1,600+', label: 'Keywords per Build' },
              { value: '$1,700+', label: 'Saved vs Monthly Plans' },
            ].map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 6 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
                <div className="text-2xl sm:text-3xl font-extrabold text-white mb-0.5">{s.value}</div>
                <div className="text-xs sm:text-sm text-slate-400">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* What's Inside */}
        <section className="py-16 sm:py-20 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
              <h2 className="text-2xl sm:text-4xl font-bold mb-3">8 Tools. One Price. Zero Monthly Fees.</h2>
              <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto">Everything you need to build, protect, and scale Google Ads campaigns — all included in your lifetime deal.</p>
            </motion.div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {tools.map((t, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
                  className="bg-slate-900 border border-white/5 rounded-xl p-5 hover:border-emerald-500/30 hover:bg-slate-800/60 transition-all duration-200"
                >
                  <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center mb-3">
                    <t.icon className="w-5 h-5 text-emerald-400" />
                  </div>
                  <h3 className="font-semibold text-white text-sm mb-1">{t.label}</h3>
                  <p className="text-xs text-slate-400">{t.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Feature Showcase: Campaign Builder */}
        <section className="py-16 sm:py-20 px-4 sm:px-6 bg-slate-900/40">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
                <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-xs font-bold mb-5">
                  <Target className="w-3.5 h-3.5" /> Campaign Builder 3.0
                </span>
                <h2 className="text-2xl sm:text-4xl font-bold mb-4">Build Complete Google Ads Campaigns in Minutes</h2>
                <p className="text-slate-400 text-base mb-6 leading-relaxed">Our 7-step wizard analyzes your website, generates 1,600+ keywords across all match types, writes RSA and DKI ads, adds all 10+ extension types, and exports a Google Ads Editor–ready CSV file.</p>
                <div className="space-y-3 mb-6">
                  {['13 campaign structures including SKAG, STAG, Alpha-Beta, Geo-Targeted', '1,600+ keywords with broad, phrase & exact match types', 'RSA, DKI and Call-Only ads with live preview & strength scoring', '70+ ready-made presets for legal, dental, HVAC, real estate & more', '30,000+ ZIP code geo-targeting built in'].map(item => (
                    <div key={item} className="flex items-start gap-3 text-sm text-slate-300">
                      <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      {item}
                    </div>
                  ))}
                </div>
              </motion.div>
              <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
                <div className="bg-slate-900 rounded-2xl border border-white/10 overflow-hidden">
                  <div className="bg-emerald-600 px-5 py-4">
                    <div className="flex items-center gap-1.5 mb-2"><div className="w-3 h-3 rounded-full bg-white/30"/><div className="w-3 h-3 rounded-full bg-white/30"/><div className="w-3 h-3 rounded-full bg-white/30"/></div>
                    <h3 className="text-white font-bold">Campaign Builder 3.0</h3>
                    <p className="text-emerald-200 text-xs">13 proven structures · 70+ industry presets</p>
                  </div>
                  <div className="p-4 grid grid-cols-2 gap-2">
                    {[
                      { name: 'SKAG', desc: 'Single Keyword Ad Groups', icon: Zap, active: true },
                      { name: 'Intent-Based', desc: 'Search intent clustering', icon: Target },
                      { name: 'Alpha-Beta', desc: 'Broad & exact split testing', icon: Layers },
                      { name: 'Geo-Targeted', desc: '30K+ ZIP code locations', icon: MapPin },
                      { name: 'Long-Tail Master', desc: 'Low-competition keywords', icon: Search },
                      { name: 'Performance Max', desc: 'AI-optimized reach', icon: Rocket },
                    ].map((s, i) => (
                      <motion.div key={s.name} initial={{ opacity: 0, y: 6 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}
                        className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${s.active ? 'bg-emerald-500/15 border-emerald-500/40' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                      >
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${s.active ? 'bg-emerald-500/30' : 'bg-white/10'}`}>
                          <s.icon className={`w-3.5 h-3.5 ${s.active ? 'text-emerald-400' : 'text-white/50'}`} />
                        </div>
                        <div className="min-w-0">
                          <div className={`text-xs font-bold truncate ${s.active ? 'text-emerald-400' : 'text-white/70'}`}>{s.name}</div>
                          <div className="text-[10px] text-white/30 truncate">{s.desc}</div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  <div className="px-4 pb-4">
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-xs text-emerald-300 flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 flex-shrink-0" />
                      AI generating <strong>1,647 keywords</strong> + ads for your SKAG campaign...
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Feature Showcase: Click Guard */}
        <section className="py-16 sm:py-20 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="order-2 lg:order-1">
                <div className="bg-slate-900 rounded-2xl border border-white/10 overflow-hidden">
                  <div className="px-5 py-3 border-b border-white/10 flex items-center justify-between bg-slate-800/60">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                      <span className="text-sm font-semibold">Live Traffic Monitor</span>
                    </div>
                    <span className="text-xs text-slate-500 bg-white/5 px-2 py-1 rounded-lg">Refreshing in 8s</span>
                  </div>
                  <div className="p-4">
                    <div className="flex gap-2 mb-4">
                      {[{ l: 'Blocked', v: '1,284', c: 'red' }, { l: 'Flagged', v: '347', c: 'amber' }, { l: 'Clean', v: '8,921', c: 'green' }].map(s => (
                        <div key={s.l} className={`flex-1 rounded-xl p-2.5 text-center border ${s.c === 'red' ? 'bg-red-500/10 border-red-500/20' : s.c === 'amber' ? 'bg-amber-500/10 border-amber-500/20' : 'bg-green-500/10 border-green-500/20'}`}>
                          <div className={`text-sm font-black ${s.c === 'red' ? 'text-red-400' : s.c === 'amber' ? 'text-amber-400' : 'text-green-400'}`}>{s.v}</div>
                          <div className="text-[10px] text-slate-500">{s.l}</div>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-2">
                      {[
                        { ip: '185.220.101.47', country: 'RU', clicks: 47, score: 94, status: 'Blocked' },
                        { ip: '45.83.64.12', country: 'CN', clicks: 31, score: 88, status: 'Blocked' },
                        { ip: '77.88.55.60', country: 'BR', clicks: 29, score: 76, status: 'Flagged' },
                        { ip: '103.21.244.0', country: 'DE', clicks: 12, score: 41, status: 'Allowed' },
                      ].map((row, i) => (
                        <motion.div key={row.ip} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                          className="grid grid-cols-5 items-center px-3 py-2.5 rounded-lg bg-white/5 border border-white/5"
                        >
                          <div className="col-span-2"><div className="text-[10px] font-mono text-white/80">{row.ip}</div><div className="text-[9px] text-white/30">{row.country}</div></div>
                          <div className="text-center text-[10px] text-white/60">{row.clicks}</div>
                          <div className="text-center text-[10px] font-bold" style={{ color: row.score >= 75 ? '#f87171' : row.score >= 50 ? '#fbbf24' : '#34d399' }}>{row.score}</div>
                          <div className="text-right"><span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${row.status === 'Blocked' ? 'bg-red-500/20 text-red-400' : row.status === 'Flagged' ? 'bg-amber-500/20 text-amber-400' : 'bg-green-500/20 text-green-400'}`}>{row.status}</span></div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
              <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="order-1 lg:order-2">
                <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-full text-xs font-bold mb-5">
                  <Shield className="w-3.5 h-3.5" /> Click Guard — Live
                </span>
                <h2 className="text-2xl sm:text-4xl font-bold mb-4">Stop Click Fraud from Draining Your Budget</h2>
                <p className="text-slate-400 text-base mb-6 leading-relaxed">Industry studies show 15–30% of Google Ads clicks are fraudulent. Click Guard monitors every click in real time and automatically blocks bots, VPNs, and competitor IPs before they spend your budget.</p>
                <div className="space-y-3 mb-6">
                  {['40+ behavioral signals for bot score calculation', 'Automatic IP & VPN blocking via Google Ads exclusions', 'Live traffic monitoring with 10-second refresh rate', '4 threat levels: Clean, Suspicious, Flagged, Blocked'].map(item => (
                    <div key={item} className="flex items-start gap-3 text-sm text-slate-300">
                      <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" /> {item}
                    </div>
                  ))}
                </div>
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-sm text-red-300">
                  <strong className="text-red-400">Most tools charge $50–149/mo</strong> for click fraud protection separately. With your lifetime deal, it's built in — forever.
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Comparison */}
        <section className="py-16 sm:py-20 px-4 sm:px-6 bg-slate-900/40">
          <div className="max-w-3xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
              <h2 className="text-2xl sm:text-4xl font-bold mb-3">See How It Compares</h2>
              <p className="text-slate-400">8 tools combined, for less than the cost of 1 monthly subscription.</p>
            </motion.div>
            <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
              <div className="min-w-[480px] sm:min-w-0 bg-slate-900 border border-white/10 rounded-2xl overflow-hidden">
                <div className="grid grid-cols-3 bg-slate-800/80">
                  <div className="p-3 sm:p-4 text-xs sm:text-sm font-medium text-slate-400">Feature</div>
                  <div className="p-3 sm:p-4 text-xs sm:text-sm font-bold text-emerald-400 text-center bg-emerald-500/10 border-x border-emerald-500/20"><BadgeCheck className="w-3.5 h-3.5 inline mr-1" />Adiology Lifetime</div>
                  <div className="p-3 sm:p-4 text-xs sm:text-sm font-medium text-slate-400 text-center">Other Tools</div>
                </div>
                {comparisonRows.map((row, i) => (
                  <div key={i} className={`grid grid-cols-3 border-b border-white/5 last:border-0 ${i % 2 === 0 ? 'bg-slate-800/20' : ''}`}>
                    <div className="p-3 sm:p-4 text-xs sm:text-sm text-slate-300">{row.feature}</div>
                    <div className="p-3 sm:p-4 text-xs sm:text-sm text-emerald-400 font-medium text-center bg-emerald-500/5 border-x border-emerald-500/10">{row.lifetime}</div>
                    <div className="p-3 sm:p-4 text-xs sm:text-sm text-slate-500 text-center">{row.others}</div>
                  </div>
                ))}
              </div>
            </div>
            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="mt-6 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-center">
              <p className="text-sm sm:text-base text-emerald-300 font-medium">💰 At $99 once vs ~$150/mo for alternatives — you break even in <strong className="text-white">under 1 month</strong> and save <strong className="text-white">$1,700+</strong> over 2 years.</p>
            </motion.div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-16 sm:py-20 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
              <h2 className="text-2xl sm:text-4xl font-bold mb-3">Trusted by Marketers & Agencies</h2>
              <div className="flex items-center justify-center gap-1 mt-2">
                {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 fill-amber-400" />)}
                <span className="ml-2 text-sm text-slate-400">Rated 5/5</span>
              </div>
            </motion.div>
            <div className="grid sm:grid-cols-3 gap-5">
              {testimonials.map((t, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                  className="bg-slate-900 border border-white/5 rounded-xl p-5 flex flex-col gap-4"
                >
                  <div className="flex gap-0.5">{Array.from({ length: t.rating }).map((_, j) => <Star key={j} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />)}</div>
                  <p className="text-slate-300 text-sm leading-relaxed flex-1">"{t.text}"</p>
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${t.color} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>{t.initials}</div>
                    <div><div className="font-semibold text-white text-sm">{t.name}</div><div className="text-xs text-slate-500">{t.role}</div></div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 sm:py-20 px-4 sm:px-6 bg-slate-900/40">
          <div className="max-w-2xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-10">
              <h2 className="text-2xl sm:text-4xl font-bold mb-2">Frequently Asked Questions</h2>
            </motion.div>
            <div className="space-y-2">
              {faqs.map((faq, i) => (
                <motion.div key={i} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="bg-slate-900 border border-white/5 rounded-xl overflow-hidden">
                  <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between p-4 sm:p-5 text-left gap-3 hover:bg-slate-800/50 transition-colors">
                    <span className="font-medium text-white text-sm sm:text-base">{faq.q}</span>
                    {openFaq === i ? <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />}
                  </button>
                  {openFaq === i && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 sm:px-5 pb-4 sm:pb-5"><p className="text-slate-400 text-sm leading-relaxed">{faq.a}</p></motion.div>}
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-16 sm:py-20 px-4 sm:px-6 pb-28 sm:pb-20">
          <div className="max-w-2xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <div className="relative">
                <div className="absolute -inset-[2px] bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 rounded-2xl blur opacity-50" />
                <div className="relative bg-slate-900 border border-white/10 rounded-2xl p-8 sm:p-10 text-center">
                  <Rocket className="w-10 h-10 text-emerald-400 mx-auto mb-4" />
                  <h2 className="text-2xl sm:text-4xl font-extrabold mb-2">Lock In Your Lifetime Deal</h2>
                  <p className="text-slate-400 mb-6 text-sm sm:text-base">8 tools. One payment. Lifetime access. No monthly fees ever.</p>
                  <div className="flex items-baseline justify-center gap-3 mb-6">
                    <span className="text-xl text-slate-500 line-through">$149</span>
                    <span className="text-5xl sm:text-6xl font-black text-white">$99</span>
                  </div>
                  <Button onClick={handleBuyNow} disabled={isLoading}
                    className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-base sm:text-lg px-10 h-12 sm:h-14 rounded-xl shadow-xl shadow-emerald-500/30"
                  >
                    {isLoading ? 'Processing...' : <span className="flex items-center gap-2"><CreditCard className="w-5 h-5" />Get Lifetime Access — $99</span>}
                  </Button>
                  <p className="text-xs text-slate-500 mt-4 flex items-center justify-center gap-1.5"><Lock className="w-3 h-3" /> Secure checkout by Stripe · 14-day money-back guarantee</p>
                  <div className="mt-6 pt-6 border-t border-white/5 grid grid-cols-3 gap-2 text-center">
                    {[{ icon: Shield, label: '14-Day Guarantee' }, { icon: Infinity, label: 'Lifetime Updates' }, { icon: Users, label: 'Up to 5 Seats' }].map((item, i) => (
                      <div key={i} className="flex flex-col items-center gap-1.5"><item.icon className="w-5 h-5 text-emerald-400" /><span className="text-xs text-slate-400">{item.label}</span></div>
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

        {/* Mobile CTA */}
        <div className="fixed bottom-0 left-0 right-0 z-40 sm:hidden border-t border-white/10 bg-slate-950/95 backdrop-blur-lg p-3">
          <Button onClick={handleBuyNow} disabled={isLoading} className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold h-12 rounded-xl text-base shadow-lg">
            {isLoading ? 'Processing...' : <span className="flex items-center gap-2"><CreditCard className="w-5 h-5" />Get Lifetime Access — $99</span>}
          </Button>
          <p className="text-center text-xs text-slate-500 mt-1.5 flex items-center justify-center gap-1"><Shield className="w-3 h-3" /> 14-day money-back guarantee</p>
        </div>

        {/* Email Modal */}
        {showEmailModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <motion.div initial={{ opacity: 0, y: 30, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="bg-slate-800 border border-slate-700 rounded-2xl p-5 sm:p-6 w-full max-w-md shadow-2xl">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-lg font-bold text-white">Almost there!</h3>
                <button onClick={() => { setShowEmailModal(false); setEmailError(''); }} className="text-slate-400 hover:text-white p-1"><X className="w-5 h-5" /></button>
              </div>
              <p className="text-slate-400 text-sm mb-5">Enter your email to proceed to secure checkout.</p>
              <form onSubmit={handleEmailSubmit} className="space-y-3">
                <input type="email" placeholder={currentUser?.email || "your@email.com"} value={email} onChange={(e) => { setEmail(e.target.value); setEmailError(''); }}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm" autoFocus />
                {emailError && <p className="text-red-400 text-sm">{emailError}</p>}
                <div>
                  <label className="text-slate-400 text-xs mb-1.5 block">Promo code (optional)</label>
                  <div className="flex gap-2">
                    <input type="text" placeholder="Enter promo code" value={promoCode} onChange={(e) => { setPromoCode(e.target.value); setPromoError(''); setPromoApplied(null); }}
                      className="flex-1 px-3 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                    <button type="button" onClick={handleApplyPromo} disabled={promoLoading || !promoCode.trim()} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg border border-slate-600 disabled:opacity-50 font-medium">{promoLoading ? '...' : 'Apply'}</button>
                  </div>
                  {promoError && <p className="text-red-400 text-xs mt-1">{promoError}</p>}
                  {promoApplied?.valid && <p className="text-emerald-400 text-xs mt-1">{promoApplied.discount} applied!{promoApplied.newAmount !== undefined && <span> New price: ${(promoApplied.newAmount / 100).toFixed(2)}</span>}</p>}
                </div>
                <Button type="submit" disabled={isLoading} className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold h-11 rounded-lg text-sm">
                  {isLoading ? 'Processing...' : promoApplied?.newAmount !== undefined ? `Continue to Checkout — $${(promoApplied.newAmount / 100).toFixed(2)}` : 'Continue to Checkout — $99'}
                </Button>
              </form>
              <p className="text-xs text-slate-500 mt-4 text-center flex items-center justify-center gap-1"><Lock className="w-3 h-3" /> Secure checkout powered by Stripe</p>
            </motion.div>
          </div>
        )}
      </div>
    </>
  );
}
