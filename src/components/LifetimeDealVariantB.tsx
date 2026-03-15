import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import {
  Check, Shield, ArrowRight, Star, CreditCard, Lock,
  ChevronDown, ChevronUp, CheckCircle, X, Zap,
  TrendingDown, DollarSign, Target, Sparkles,
  BarChart3, FileText, Globe, Layers, MousePointer,
  Users, Infinity, Brain, Search, Inbox, MapPin
} from 'lucide-react';
import { Button } from './ui/button';
import { LTDProductDemo } from './LTDProductDemo';
import { getCurrentUser } from '../utils/auth';

interface Props { onNavigate?: (page: string) => void; }

export function LifetimeDealVariantB({ onNavigate }: Props) {
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
  const [monthlyWaste, setMonthlyWaste] = useState(149);

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
      if (response.ok && data.url) { window.location.href = data.url; }
      else { setEmailError(data.error || 'Something went wrong. Please try again.'); }
    } catch { setEmailError('Something went wrong. Please try again.'); }
    finally { setIsLoading(false); }
  };

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    setPromoLoading(true);
    setPromoError('');
    setPromoApplied(null);
    try {
      const response = await fetch('/api/stripe/validate-coupon', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: promoCode.trim() }) });
      const data = await response.json();
      if (!response.ok || !data.valid) { setPromoError(data.error || 'Invalid promo code'); return; }
      let discountLabel: string | undefined; let newAmount: number | undefined;
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
    fetch('/api/leads/capture', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: trimmed, source: 'lifetime_deal_b', page: window.location.pathname }) }).catch(() => {});
    processCheckout(trimmed);
  };

  const yearlyCost = monthlyWaste * 12;
  const savings2yr = monthlyWaste * 24 - 99;

  const monthlyCosts = [
    { tool: 'Campaign builder (WordStream, etc.)', cost: '$49–99/mo', icon: Target },
    { tool: 'Click fraud protection (ClickCease, etc.)', cost: '$59–149/mo', icon: Shield },
    { tool: 'Keyword research (Ahrefs, SEMrush, etc.)', cost: '$99–199/mo', icon: Search },
    { tool: 'Ad copy generators', cost: '$29–79/mo', icon: FileText },
    { tool: 'Domain monitoring tools', cost: '$19–49/mo', icon: Globe },
  ];

  const features = [
    { icon: Target, title: 'Campaign Builder 3.0', desc: '13 structures, 70+ industry presets. Build a complete campaign in minutes, not days.' },
    { icon: Shield, title: 'Click Guard', desc: 'Real-time bot detection and IP blocking. Stop wasting budget on fraudulent clicks.' },
    { icon: Search, title: 'Keyword Planner & Mixer', desc: '1,600+ keywords per build with search volume, CPC data, and all match types.' },
    { icon: Globe, title: 'Domain Monitor', desc: 'SSL, DNS, and expiry monitoring for unlimited domains. Never get caught offline.' },
    { icon: Brain, title: 'AI Ad Generator', desc: 'RSA, DKI & Call-Only ads with all 10+ extension types. Max Ad Rank from day one.' },
    { icon: Inbox, title: 'Proxy Mail', desc: 'Anonymous emails to study competitor campaigns without exposing your identity.' },
    { icon: MapPin, title: 'Geo Targeting', desc: '15,000+ locations and 30,000+ ZIP codes for precise geographic targeting.' },
    { icon: BarChart3, title: 'Google Ads Editor Export', desc: 'One-click CSV export for Google Ads Editor. Import-ready in minutes.' },
    { icon: Layers, title: '70+ Campaign Presets', desc: 'Ready-made templates for legal, dental, HVAC, real estate and 60+ more niches.' },
    { icon: Users, title: 'Up to 5 Team Seats', desc: 'Bring your whole team. Collaborate on campaigns together at no extra cost.' },
  ];

  const testimonials = [
    { initials: 'DK', name: 'David K.', role: 'PPC Agency, 12 clients', text: 'I was paying $340/mo across three tools. Now I pay $0/mo. The $99 paid for itself in the first week. I\'ve recommended it to every agency owner I know.', rating: 5, stat: 'Saves $4,000+/year' },
    { initials: 'AM', name: 'Amanda M.', role: 'In-house Marketing Manager', text: 'Cut campaign setup from 3 days to 2 hours. My boss thinks I hired someone new. I just bought Adiology.', rating: 5, stat: '80% faster setup' },
    { initials: 'RT', name: 'Ryan T.', role: 'Freelance Google Ads Specialist', text: 'The click fraud protection alone is worth $99. I was losing 30% of my client\'s budget to bots every single month. Stopped immediately after enabling Click Guard.', rating: 5, stat: '30% less wasted spend' },
  ];

  const faqs = [
    { q: 'What does "Lifetime" actually mean?', a: 'You pay $99 once and get access to all current and future features of Adiology forever. No monthly fees, no renewals, no price increases. Ever.' },
    { q: 'How does this replace multiple tools?', a: 'Adiology combines campaign builder, keyword planner, click fraud protection, domain monitoring, AI ad writer, proxy mail, and geo targeting in one platform. Most users cancel 2–4 separate subscriptions after switching.' },
    { q: 'Is there a money-back guarantee?', a: '14-day full refund, no questions asked. If you\'re not completely satisfied, email us and we\'ll process your refund within 24 hours.' },
    { q: 'Can I use this for client work?', a: 'Yes. No limits on clients or campaigns. Many agency owners use Adiology to serve 10–20 client accounts from a single login.' },
    { q: 'What happens when you add new features?', a: 'They\'re yours automatically. We ship new tools regularly — all lifetime deal holders get them at no extra cost, forever.' },
    { q: 'What payment methods do you accept?', a: 'All major credit and debit cards via Stripe: Visa, Mastercard, Amex, Discover. Fully encrypted and PCI-compliant.' },
  ];

  return (
    <>
      <Helmet>
        <title>Adiology Lifetime Deal — Stop Paying Monthly for Google Ads Tools</title>
        <meta name="description" content="Stop paying $99–300/mo for Google Ads tools. Get lifetime access to Adiology's complete 8-tool platform for a one-time $99. Campaign builder, click fraud protection, keyword planner and more." />
        <link rel="canonical" href="https://adiology.io/lifetime-deal" />
      </Helmet>

      <div className="min-h-screen bg-white text-slate-900">

        {/* Nav */}
        <nav className="border-b border-slate-200 bg-white/95 backdrop-blur-lg sticky top-0 z-50 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => onNavigate?.('home')}>
              <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center"><span className="text-white font-bold text-lg">A</span></div>
              <span className="text-lg font-bold text-slate-900 hidden sm:block">Adiology</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-500 hidden md:block">Replace 5+ tools for $99 once</span>
              <Button onClick={handleBuyNow} disabled={isLoading} className="bg-violet-600 hover:bg-violet-700 text-white font-bold px-5 shadow-md">
                Get Lifetime Access — $99
              </Button>
            </div>
          </div>
        </nav>

        {/* Success Banner */}
        {showSuccess && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="bg-green-50 border-b border-green-200">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 flex items-start gap-3">
              <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
              <div><h3 className="font-bold text-green-800">Payment confirmed!</h3><p className="text-green-700 text-sm">{checkoutEmail ? <>Lifetime access activated for <strong>{checkoutEmail}</strong>. Check your email.</> : 'Lifetime access activated! Check your email.'}</p>
                <Button onClick={() => { if (checkoutEmail) sessionStorage.setItem('lifetime_signup_email', checkoutEmail); onNavigate?.('complete-signup'); }} className="mt-3 bg-green-600 hover:bg-green-700 text-white" size="sm">Set Up Your Account <ArrowRight className="w-4 h-4 ml-1.5" /></Button>
              </div>
              <button onClick={() => setShowSuccess(false)} className="ml-auto text-green-400 hover:text-green-600 p-1"><X className="w-5 h-5" /></button>
            </div>
          </motion.div>
        )}

        {/* ===== HERO ===== */}
        <section className="bg-gradient-to-b from-slate-50 to-white pt-12 sm:pt-20 pb-0 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">

              {/* Left: copy */}
              <motion.div initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
                <div className="inline-flex items-center gap-2 bg-red-50 border border-red-200 rounded-full px-4 py-1.5 mb-5">
                  <TrendingDown className="w-4 h-4 text-red-500" />
                  <span className="text-sm font-semibold text-red-600">Stop throwing money at monthly subscriptions</span>
                </div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 leading-[1.08] tracking-tight mb-5">
                  You're Paying{' '}
                  <span className="relative inline-block text-red-500">
                    $100–400/mo
                    <span className="absolute -bottom-1 left-0 right-0 h-1.5 bg-red-200 rounded-full" />
                  </span>
                  {' '}for Tools<br className="hidden sm:block" />
                  You Could Own for{' '}
                  <span className="text-violet-600">$99 Forever.</span>
                </h1>
                <p className="text-lg text-slate-600 mb-6 leading-relaxed max-w-lg">
                  Adiology replaces your entire Google Ads toolstack — one platform, 8 tools, no monthly fees. Campaign builder, keyword planner, click fraud protection, domain monitoring, AI ad generator, and more.
                </p>

                {/* Interactive ROI Calc */}
                <div className="bg-white border-2 border-slate-200 rounded-2xl p-5 shadow-lg mb-6 max-w-md">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Your monthly tool spend</p>
                  <div className="flex items-center gap-4 mb-4">
                    <span className="text-2xl font-black text-slate-900 w-24">${monthlyWaste}/mo</span>
                    <input type="range" min={49} max={500} step={10} value={monthlyWaste} onChange={(e) => setMonthlyWaste(Number(e.target.value))}
                      className="flex-1 h-2 rounded-full accent-violet-600 cursor-pointer" />
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="bg-red-50 rounded-xl p-3 border border-red-100">
                      <div className="text-lg font-extrabold text-red-500">${yearlyCost.toLocaleString()}/yr</div>
                      <div className="text-[11px] text-red-400 font-medium">You're paying now</div>
                    </div>
                    <div className="flex items-center justify-center"><ArrowRight className="w-5 h-5 text-slate-300" /></div>
                    <div className="bg-green-50 rounded-xl p-3 border border-green-100">
                      <div className="text-lg font-extrabold text-green-600">$99</div>
                      <div className="text-[11px] text-green-500 font-medium">Once, forever</div>
                    </div>
                  </div>
                  <div className="mt-3 bg-violet-50 rounded-xl p-2.5 text-center border border-violet-100">
                    <span className="text-sm font-bold text-violet-700">You save <span className="text-lg">${savings2yr.toLocaleString()}</span> over 2 years</span>
                  </div>
                </div>

                <Button onClick={handleBuyNow} disabled={isLoading}
                  className="bg-violet-600 hover:bg-violet-700 text-white font-bold text-lg px-10 h-14 rounded-xl shadow-xl shadow-violet-200 hover:shadow-violet-300 hover:scale-[1.02] transition-all duration-200"
                >
                  <CreditCard className="w-5 h-5 mr-2" /> Get Lifetime Access — $99 <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <p className="text-sm text-slate-400 mt-3 flex items-center gap-3">
                  <span className="flex items-center gap-1"><Lock className="w-3.5 h-3.5" /> Secure checkout</span>
                  <span>·</span>
                  <span className="flex items-center gap-1"><Shield className="w-3.5 h-3.5" /> 14-day guarantee</span>
                </p>
              </motion.div>

              {/* Right: Product Demo */}
              <motion.div initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.15 }}>
                <LTDProductDemo theme="light" />
              </motion.div>
            </div>
          </div>
        </section>

        {/* What you're paying monthly */}
        <section className="py-14 sm:py-20 px-4 sm:px-6 bg-red-50 mt-12">
          <div className="max-w-3xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-10">
              <h2 className="text-2xl sm:text-4xl font-bold text-slate-900 mb-3">What You're Currently Paying For (Separately)</h2>
              <p className="text-slate-600 text-base">Adiology replaces all of these. One platform. One payment. No monthly bills.</p>
            </motion.div>
            <div className="space-y-3 mb-8">
              {monthlyCosts.map((item, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -12 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                  className="bg-white border border-red-100 rounded-xl p-4 flex items-center justify-between gap-4 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0"><item.icon className="w-4 h-4 text-red-500" /></div>
                    <span className="font-medium text-slate-800 text-sm">{item.tool}</span>
                  </div>
                  <span className="font-bold text-red-500 text-sm whitespace-nowrap">{item.cost}</span>
                </motion.div>
              ))}
            </div>
            <motion.div initial={{ opacity: 0, scale: 0.97 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
              className="bg-violet-600 rounded-2xl p-7 text-center text-white shadow-xl shadow-violet-200"
            >
              <DollarSign className="w-10 h-10 mx-auto mb-3 text-violet-200" />
              <h3 className="text-2xl font-extrabold mb-2">Replace all of it for $99 — once.</h3>
              <p className="text-violet-200 mb-5 text-sm">No monthly fees. No per-tool subscriptions. No more juggling accounts. One platform, everything included.</p>
              <Button onClick={handleBuyNow} disabled={isLoading} className="bg-white text-violet-700 hover:bg-violet-50 font-bold px-8 h-12 rounded-xl text-base shadow-lg">
                Get Lifetime Access Now <ArrowRight className="w-4 h-4 ml-2 inline" />
              </Button>
            </motion.div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-16 sm:py-20 px-4 sm:px-6 bg-white">
          <div className="max-w-5xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
              <span className="inline-block bg-violet-100 text-violet-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide mb-4">Everything included</span>
              <h2 className="text-2xl sm:text-4xl font-bold text-slate-900 mb-3">10 Tools. One Price. Zero Upsells.</h2>
              <p className="text-slate-500 text-base sm:text-lg max-w-xl mx-auto">Every feature listed below is included in your $99 lifetime deal. No paywalls inside the app.</p>
            </motion.div>
            <div className="grid sm:grid-cols-2 gap-4">
              {features.map((f, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.04 }}
                  className="flex gap-4 p-5 bg-slate-50 rounded-xl border border-slate-100 hover:border-violet-200 hover:bg-violet-50/30 transition-all duration-200"
                >
                  <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center flex-shrink-0"><f.icon className="w-5 h-5 text-violet-600" /></div>
                  <div><h3 className="font-semibold text-slate-900 mb-0.5">{f.title}</h3><p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p></div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Feature: Click Guard Deep Dive */}
        <section className="py-16 sm:py-20 px-4 sm:px-6 bg-slate-50">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
                <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-100 border border-red-200 text-red-600 rounded-full text-xs font-bold mb-5">
                  <Shield className="w-3.5 h-3.5" /> Click Guard — Worth $50–149/mo alone
                </span>
                <h2 className="text-2xl sm:text-4xl font-bold text-slate-900 mb-4">Your Budget is Being Stolen. Click Guard Stops It.</h2>
                <p className="text-slate-500 text-base mb-6 leading-relaxed">Industry studies show 15–30% of Google Ads clicks are fraudulent. Competitors click your ads to drain your budget. Bots inflate your costs. Click Guard detects and blocks them automatically.</p>
                <div className="space-y-3 mb-6">
                  {['40+ behavioral signals calculate a bot score for every click', 'Automatic IP & VPN blocking pushed to Google Ads exclusion lists', '4 threat levels: Clean, Suspicious, Flagged, Blocked', 'Live traffic dashboard refreshes every 10 seconds', 'Save 15–30% of your monthly ad spend immediately'].map(item => (
                    <div key={item} className="flex items-start gap-3 text-sm text-slate-600">
                      <CheckCircle className="w-4 h-4 text-violet-500 flex-shrink-0 mt-0.5" /> {item}
                    </div>
                  ))}
                </div>
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
                  <strong>ClickCease charges $59–149/month</strong> for click fraud protection alone. It's included in your $99 lifetime deal.
                </div>
              </motion.div>
              <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
                <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /><span className="text-sm font-semibold text-slate-800">Live Traffic Monitor</span></div>
                    <span className="text-xs text-slate-400 bg-white border border-slate-200 px-2 py-1 rounded-lg">Refreshing in 8s</span>
                  </div>
                  <div className="p-5">
                    <div className="flex gap-3 mb-4">
                      {[{ l: 'Blocked Today', v: '1,284', c: 'red' }, { l: 'Flagged', v: '347', c: 'amber' }, { l: 'Clean', v: '8,921', c: 'green' }].map(s => (
                        <div key={s.l} className={`flex-1 rounded-xl p-3 text-center border ${s.c === 'red' ? 'bg-red-50 border-red-100' : s.c === 'amber' ? 'bg-amber-50 border-amber-100' : 'bg-green-50 border-green-100'}`}>
                          <div className={`text-lg font-black ${s.c === 'red' ? 'text-red-600' : s.c === 'amber' ? 'text-amber-600' : 'text-green-600'}`}>{s.v}</div>
                          <div className="text-[10px] text-slate-400">{s.l}</div>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-2">
                      {[
                        { ip: '185.220.101.47', country: 'RU', clicks: 47, score: 94, status: 'Blocked' },
                        { ip: '45.83.64.12', country: 'CN', clicks: 31, score: 88, status: 'Blocked' },
                        { ip: '77.88.55.60', country: 'BR', clicks: 29, score: 76, status: 'Flagged' },
                        { ip: '103.21.244.0', country: 'DE', clicks: 12, score: 41, status: 'Allowed' },
                      ].map((row) => (
                        <div key={row.ip} className="grid grid-cols-5 items-center px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-100">
                          <div className="col-span-2"><div className="text-xs font-mono text-slate-700">{row.ip}</div><div className="text-[10px] text-slate-400">{row.country}</div></div>
                          <div className="text-center text-xs text-slate-600">{row.clicks}</div>
                          <div className="text-center"><span className={`text-xs font-bold ${row.score >= 75 ? 'text-red-600' : row.score >= 50 ? 'text-amber-600' : 'text-green-600'}`}>{row.score}</span></div>
                          <div className="text-right"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${row.status === 'Blocked' ? 'bg-red-100 text-red-700' : row.status === 'Flagged' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>{row.status}</span></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Pricing CTA */}
        <section className="py-16 sm:py-20 px-4 sm:px-6 bg-white">
          <div className="max-w-lg mx-auto">
            <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <div className="relative border-2 border-slate-200 rounded-3xl p-8 sm:p-10 shadow-xl overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-violet-500 via-indigo-500 to-purple-500" />
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-violet-600 text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wide shadow-lg">Best Value Deal</span>
                </div>
                <div className="mt-3 mb-6 text-center">
                  <div className="flex items-baseline justify-center gap-3 mb-2">
                    <span className="text-xl text-slate-400 line-through font-medium">$149</span>
                    <span className="text-7xl font-black text-slate-900">$99</span>
                  </div>
                  <p className="text-slate-500 mb-1">One-time payment. No recurring charges.</p>
                  <p className="text-violet-600 font-semibold text-sm">Save $1,700+ vs paying monthly for 2 years</p>
                </div>
                <div className="space-y-3 mb-8">
                  {['Campaign Builder with 13 structures', 'Click Guard fraud protection', 'Keyword Planner + Mixer (1,600+ keywords)', 'Domain Monitor (unlimited domains)', 'AI Ad Generator (RSA, DKI, Call-Only)', 'Proxy Mail for competitor research', '70+ industry campaign presets', 'Up to 5 team seats', 'All future updates, free forever', '14-day money-back guarantee'].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm text-slate-700">
                      <CheckCircle className="w-4.5 h-4.5 text-green-500 flex-shrink-0" /> {item}
                    </div>
                  ))}
                </div>
                <Button onClick={handleBuyNow} disabled={isLoading} className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold h-14 rounded-xl text-base shadow-lg shadow-violet-200 hover:scale-[1.02] transition-all">
                  {isLoading ? 'Processing...' : <span className="flex items-center gap-2 justify-center"><CreditCard className="w-5 h-5" /> Get Lifetime Access — $99</span>}
                </Button>
                <p className="text-xs text-slate-400 mt-3 flex items-center justify-center gap-2"><Lock className="w-3 h-3" /> Secured by Stripe · <Shield className="w-3 h-3" /> 14-day refund</p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-16 sm:py-20 px-4 sm:px-6 bg-slate-50">
          <div className="max-w-5xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
              <h2 className="text-2xl sm:text-4xl font-bold text-slate-900 mb-3">Real Results From Real Users</h2>
              <div className="flex items-center justify-center gap-1">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className="w-5 h-5 text-amber-400 fill-amber-400" />)}<span className="ml-2 text-slate-500 text-sm font-medium">Rated 5/5</span></div>
            </motion.div>
            <div className="grid sm:grid-cols-3 gap-5">
              {testimonials.map((t, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col gap-4">
                  <div className="inline-block bg-green-50 text-green-700 text-xs font-bold px-3 py-1 rounded-full">{t.stat}</div>
                  <div className="flex gap-0.5">{Array.from({ length: t.rating }).map((_, j) => <Star key={j} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />)}</div>
                  <p className="text-slate-700 text-sm leading-relaxed flex-1">"{t.text}"</p>
                  <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
                    <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-bold text-sm flex-shrink-0">{t.initials}</div>
                    <div><div className="font-semibold text-slate-900 text-sm">{t.name}</div><div className="text-xs text-slate-500">{t.role}</div></div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 sm:py-20 px-4 sm:px-6 bg-white">
          <div className="max-w-2xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-10">
              <h2 className="text-2xl sm:text-4xl font-bold text-slate-900 mb-2">Common Questions</h2>
            </motion.div>
            <div className="space-y-2">
              {faqs.map((faq, i) => (
                <motion.div key={i} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
                  <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between p-4 sm:p-5 text-left gap-3 hover:bg-slate-100 transition-colors">
                    <span className="font-medium text-slate-900 text-sm sm:text-base">{faq.q}</span>
                    {openFaq === i ? <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />}
                  </button>
                  {openFaq === i && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 sm:px-5 pb-4 sm:pb-5"><p className="text-slate-500 text-sm leading-relaxed">{faq.a}</p></motion.div>}
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-slate-200 py-6 px-4 sm:px-6 bg-white">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-slate-400">
            <span>© {new Date().getFullYear()} Adiology. All rights reserved.</span>
            <div className="flex gap-4 sm:gap-6 flex-wrap justify-center">
              <button onClick={() => onNavigate?.('privacy-policy')} className="hover:text-slate-600 transition-colors">Privacy Policy</button>
              <button onClick={() => onNavigate?.('terms-of-service')} className="hover:text-slate-600 transition-colors">Terms of Service</button>
              <button onClick={() => onNavigate?.('refund-policy')} className="hover:text-slate-600 transition-colors">Refund Policy</button>
            </div>
          </div>
        </footer>

        {/* Mobile CTA */}
        <div className="fixed bottom-0 left-0 right-0 z-40 sm:hidden border-t border-slate-200 bg-white/95 backdrop-blur-lg p-3 shadow-2xl">
          <Button onClick={handleBuyNow} disabled={isLoading} className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold h-12 rounded-xl text-base shadow-lg">
            <CreditCard className="w-4 h-4 mr-2" />{isLoading ? 'Processing...' : 'Get Lifetime Access — $99'}
          </Button>
          <p className="text-center text-xs text-slate-400 mt-1.5"><Shield className="w-3 h-3 inline mr-1" />14-day money-back guarantee</p>
        </div>

        {/* Email Modal */}
        {showEmailModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <motion.div initial={{ opacity: 0, y: 30, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-lg font-bold text-slate-900">Almost there!</h3>
                <button onClick={() => { setShowEmailModal(false); setEmailError(''); }} className="text-slate-400 hover:text-slate-600 p-1"><X className="w-5 h-5" /></button>
              </div>
              <p className="text-slate-500 text-sm mb-5">Enter your email to proceed to secure checkout.</p>
              <form onSubmit={handleEmailSubmit} className="space-y-3">
                <input type="email" placeholder={currentUser?.email || "your@email.com"} value={email} onChange={(e) => { setEmail(e.target.value); setEmailError(''); }}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm" autoFocus />
                {emailError && <p className="text-red-500 text-sm">{emailError}</p>}
                <div>
                  <label className="text-slate-500 text-xs mb-1.5 block">Promo code (optional)</label>
                  <div className="flex gap-2">
                    <input type="text" placeholder="Enter promo code" value={promoCode} onChange={(e) => { setPromoCode(e.target.value); setPromoError(''); setPromoApplied(null); }}
                      className="flex-1 px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                    <button type="button" onClick={handleApplyPromo} disabled={promoLoading || !promoCode.trim()} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm rounded-lg border border-slate-300 disabled:opacity-50 font-medium">{promoLoading ? '...' : 'Apply'}</button>
                  </div>
                  {promoError && <p className="text-red-500 text-xs mt-1">{promoError}</p>}
                  {promoApplied?.valid && <p className="text-green-600 text-xs mt-1">{promoApplied.discount} applied!{promoApplied.newAmount !== undefined && <span> New price: ${(promoApplied.newAmount / 100).toFixed(2)}</span>}</p>}
                </div>
                <Button type="submit" disabled={isLoading} className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold h-11 rounded-lg text-sm">
                  {isLoading ? 'Processing...' : promoApplied?.newAmount !== undefined ? `Continue to Checkout — $${(promoApplied.newAmount / 100).toFixed(2)}` : 'Continue to Checkout — $99'}
                </Button>
              </form>
              <p className="text-xs text-slate-400 mt-4 text-center flex items-center justify-center gap-1"><Lock className="w-3 h-3" /> Secure checkout powered by Stripe</p>
            </motion.div>
          </div>
        )}
      </div>
    </>
  );
}
