import { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check, Shield, ArrowRight, Star, CreditCard, Lock,
  ChevronDown, ChevronUp, CheckCircle, X, Clock,
  Flame, Target, AlertTriangle, Users, Infinity, Sparkles,
  BarChart3, Globe, Search, Brain, Inbox, MapPin, Layers
} from 'lucide-react';
import { Button } from './ui/button';
import { LTDProductDemo } from './LTDProductDemo';
import { getCurrentUser } from '../utils/auth';

interface Props { onNavigate?: (page: string) => void; }

const TOTAL_SPOTS = 500;
const CLAIMED_SPOTS = 487;

const purchaseAlerts = [
  { name: 'Mike from Austin', time: '2m ago', action: 'just grabbed lifetime access' },
  { name: 'Sarah from NYC', time: '4m ago', action: 'just locked in their spot' },
  { name: 'James from London', time: '7m ago', action: 'upgraded to lifetime deal' },
  { name: 'Priya from Toronto', time: '11m ago', action: 'grabbed lifetime access' },
  { name: 'Carlos from Miami', time: '14m ago', action: 'just claimed their spot' },
  { name: 'Emma from Sydney', time: '18m ago', action: 'locked in lifetime access' },
];

export function LifetimeDealVariantC({ onNavigate }: Props) {
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
  const [alertIndex, setAlertIndex] = useState(0);
  const [showAlert, setShowAlert] = useState(true);
  const [spotsLeft, setSpotsLeft] = useState(TOTAL_SPOTS - CLAIMED_SPOTS);
  const alertRef = useRef(false);

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
      setCountdown(`${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`);
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const cycle = () => {
      setShowAlert(false);
      setTimeout(() => { setAlertIndex(prev => (prev + 1) % purchaseAlerts.length); setShowAlert(true); }, 400);
    };
    const interval = setInterval(cycle, 4500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => { setSpotsLeft(prev => Math.max(0, prev - 1)); }, 120000);
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
    fetch('/api/leads/capture', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: trimmed, source: 'lifetime_deal_c', page: window.location.pathname }) }).catch(() => {});
    processCheckout(trimmed);
  };

  const features = [
    { icon: Target, title: 'Campaign Builder 3.0', desc: '13 structures, 70+ presets. Build a complete campaign in minutes, not days.' },
    { icon: Shield, title: 'Click Guard (Live)', desc: 'Real-time bot detection and IP blocking. Stop wasting budget on fraudulent clicks.' },
    { icon: Search, title: 'Keyword Planner + Mixer', desc: 'Generate 1,600+ keywords with search volume, CPC data, and all match types.' },
    { icon: Globe, title: 'Domain Monitor', desc: 'SSL, DNS & expiry monitoring for unlimited domains. Never get caught offline.' },
    { icon: Brain, title: 'AI Ad Generator', desc: 'RSA, DKI & Call-Only ads with all 10+ extension types for maximum Ad Rank.' },
    { icon: Inbox, title: 'Proxy Mail', desc: 'Anonymous emails to study competitor campaigns without exposing your identity.' },
    { icon: MapPin, title: 'Geo Targeting', desc: '15,000+ cities and 30,000+ ZIP codes for hyper-precise local targeting.' },
    { icon: Layers, title: '70+ Campaign Presets', desc: 'Ready-made templates for legal, dental, HVAC, real estate + 60 more niches.' },
  ];

  const faqs = [
    { q: 'Why is this offer ending soon?', a: 'We\'re limiting lifetime deals to 500 spots total to maintain platform quality and ensure every user gets great support. Once all spots are claimed, we won\'t offer this pricing again.' },
    { q: 'What is "Lifetime" access?', a: 'You pay $99 once and have access to every current and future feature of Adiology — forever. No renewals, no price hikes, no expiration.' },
    { q: 'Is there a money-back guarantee?', a: '14-day no-questions-asked full refund. Email us anytime in the first 14 days and we\'ll refund 100% immediately.' },
    { q: 'Do I get future updates too?', a: 'Yes — every feature we ship in the future is included in your lifetime deal at no cost. We add new tools regularly.' },
    { q: 'Can I use this for client work?', a: 'Absolutely. No caps on clients, campaigns, or exports. Agency owners use Adiology to power their entire business.' },
    { q: 'What if I\'m not technical?', a: 'Adiology is built for marketers, not developers. The campaign builder is a step-by-step wizard — if you can fill out a form, you can build a campaign.' },
  ];

  const testimonials = [
    { initials: 'JT', name: 'Jason T.', role: 'Google Ads Freelancer', text: 'I saw the countdown and almost didn\'t buy. Bought it 11 minutes before it "ended." Two weeks later I\'m using it every day and it\'s the best $99 I\'ve ever spent on any tool.', rating: 5 },
    { initials: 'LB', name: 'Laura B.', role: 'Agency Owner, 20 clients', text: 'Cancelled ClickCease ($99/mo) and my keyword tool ($79/mo) same day. The platform does both better. I made back $99 in the first hour of using Click Guard.', rating: 5 },
    { initials: 'PK', name: 'Pradeep K.', role: 'PPC Manager', text: 'The Campaign Builder saved my team 3 days of work on our first campaign. That\'s $800+ in labor right there. I wish we\'d found this years ago.', rating: 5 },
  ];

  const pct = ((CLAIMED_SPOTS) / TOTAL_SPOTS) * 100;

  return (
    <>
      <Helmet>
        <title>{`Only ${spotsLeft} Spots Left — Adiology Lifetime Deal $99`}</title>
        <meta name="description" content={`Only ${spotsLeft} lifetime access spots remaining. Get Adiology's complete Google Ads platform — campaign builder, click fraud protection, keyword planner and more — for $99 one-time.`} />
        <link rel="canonical" href="https://adiology.io/lifetime-deal" />
      </Helmet>

      <div className="min-h-screen bg-[#0d0d0f] text-white" style={{ backgroundImage: 'radial-gradient(ellipse 80% 40% at 50% 0%, rgba(245,158,11,0.07) 0%, transparent 70%)' }}>

        {/* Nav */}
        <nav className="border-b border-white/10 bg-[#0d0d0f]/90 backdrop-blur-lg sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 cursor-pointer flex-shrink-0" onClick={() => onNavigate?.('home')}>
              <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center"><span className="text-white font-bold text-lg">A</span></div>
              <span className="text-lg font-bold hidden sm:block">Adiology</span>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              {countdown && (
                <div className="hidden sm:flex items-center gap-1.5 text-amber-400 text-sm font-mono font-bold">
                  <Clock className="w-3.5 h-3.5" />{countdown}
                </div>
              )}
              <Button onClick={handleBuyNow} disabled={isLoading} size="sm" className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black font-bold px-4 sm:px-6">
                {isLoading ? '...' : 'Claim Spot — $99'}
              </Button>
            </div>
          </div>
        </nav>

        {/* Urgency bar */}
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2.5">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6 text-center">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 animate-pulse" />
              <span className="text-amber-300 text-sm font-bold">{CLAIMED_SPOTS} of {TOTAL_SPOTS} spots claimed</span>
            </div>
            <div className="flex-1 max-w-48 h-2 bg-white/10 rounded-full overflow-hidden hidden sm:block">
              <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1.5, ease: 'easeOut' }} className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full" />
            </div>
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span className="text-red-300 text-sm font-semibold">Only <strong className="text-red-200">{spotsLeft}</strong> spots remaining</span>
            </div>
          </div>
        </div>

        {/* Success Banner */}
        {showSuccess && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="bg-green-500/10 border-b border-green-500/20">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 flex items-start gap-3">
              <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" />
              <div><h3 className="font-bold text-green-300">Spot secured!</h3><p className="text-green-400/80 text-sm">{checkoutEmail ? <>Lifetime access confirmed for <strong className="text-green-300">{checkoutEmail}</strong>. Check your email.</> : 'Lifetime access confirmed! Check your email.'}</p>
                <Button onClick={() => { if (checkoutEmail) sessionStorage.setItem('lifetime_signup_email', checkoutEmail); onNavigate?.('complete-signup'); }} className="mt-3 bg-green-500 hover:bg-green-600 text-white" size="sm">Set Up Your Account <ArrowRight className="w-4 h-4 ml-1.5" /></Button>
              </div>
              <button onClick={() => setShowSuccess(false)} className="ml-auto text-green-400/60 hover:text-green-300 p-1"><X className="w-5 h-5" /></button>
            </div>
          </motion.div>
        )}

        {/* ===== HERO ===== */}
        <section className="pt-10 sm:pt-16 pb-0 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">

              {/* Left: copy */}
              <motion.div initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
                {/* Live activity alert */}
                <AnimatePresence mode="wait">
                  {showAlert && (
                    <motion.div key={alertIndex} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }}
                      className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3.5 py-2 mb-5 text-sm"
                    >
                      <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
                      <span className="text-white/70"><span className="text-white font-semibold">{purchaseAlerts[alertIndex].name}</span> {purchaseAlerts[alertIndex].action}</span>
                      <span className="text-white/30 text-xs">{purchaseAlerts[alertIndex].time}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <h1 className="text-4xl sm:text-5xl lg:text-[3.4rem] font-extrabold leading-[1.08] tracking-tight mb-5">
                  <span className="text-white">The Complete</span><br />
                  <span className="text-white">Google Ads Platform.</span><br />
                  <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-red-400 bg-clip-text text-transparent">
                    Last Chance. $99 Once.
                  </span>
                </h1>

                <p className="text-base sm:text-lg text-white/60 mb-5 leading-relaxed max-w-lg">
                  Campaign builder, keyword planner, click fraud protection, domain monitoring, AI ad generator — 8 tools in one platform. We're closing early access at 500 spots. <strong className="text-amber-400">{spotsLeft} spots remain.</strong>
                </p>

                {/* Progress bar */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-6 max-w-md">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-wide">Early Adopter Spots</span>
                    <span className="text-xs text-white/40">{CLAIMED_SPOTS}/{TOTAL_SPOTS} claimed</span>
                  </div>
                  <div className="h-3 bg-white/10 rounded-full overflow-hidden mb-2">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1.5, ease: 'easeOut' }}
                      className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full relative overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
                    </motion.div>
                  </div>
                  <div className="flex justify-between text-xs text-white/30">
                    <span>0 spots</span>
                    <span className="text-amber-400 font-bold">{spotsLeft} remaining</span>
                    <span>500 total</span>
                  </div>
                </div>

                {/* Countdown */}
                {countdown && (
                  <div className="flex items-center gap-3 mb-5">
                    <Clock className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <span className="text-sm text-white/60">Deal also expires in: <span className="font-mono font-bold text-amber-400 text-base">{countdown}</span></span>
                  </div>
                )}

                {/* Tool checkmarks */}
                <div className="flex flex-wrap gap-2 mb-7">
                  {['Campaign Builder', 'Click Guard', 'Keyword Planner', 'Domain Monitor', 'AI Ads', 'Proxy Mail', 'Geo Targeting', '70+ Presets'].map(t => (
                    <span key={t} className="flex items-center gap-1.5 text-xs font-medium bg-white/5 border border-white/10 rounded-full px-3 py-1 text-white/60">
                      <Check className="w-3 h-3 text-amber-400" /> {t}
                    </span>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button onClick={handleBuyNow} disabled={isLoading}
                    className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black font-extrabold text-base sm:text-lg px-8 h-14 rounded-xl shadow-xl shadow-amber-500/25 hover:scale-[1.02] transition-all duration-200"
                  >
                    <Flame className="w-5 h-5 mr-2" />{isLoading ? 'Processing...' : 'Claim My Spot — $99'}
                  </Button>
                </div>
                <p className="text-xs text-white/30 mt-3 flex items-center gap-3">
                  <span className="flex items-center gap-1"><Lock className="w-3 h-3" /> Secure checkout</span>
                  <span>·</span>
                  <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> 14-day guarantee</span>
                  <span>·</span>
                  <span className="flex items-center gap-1"><Infinity className="w-3 h-3" /> Lifetime updates</span>
                </p>
              </motion.div>

              {/* Right: Product Demo */}
              <motion.div initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.15 }}>
                <LTDProductDemo theme="dark-amber" />
              </motion.div>
            </div>
          </div>
        </section>

        {/* Stats bar */}
        <section className="border-y border-white/5 py-8 px-4 sm:px-6 mt-12">
          <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            {[
              { value: '8', label: 'Powerful Tools' },
              { value: '13', label: 'Campaign Structures' },
              { value: '1,600+', label: 'Keywords/Build' },
              { value: '$1,700+', label: 'Saved vs Monthly Plans' },
            ].map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 6 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
                <div className="text-2xl sm:text-3xl font-extrabold text-amber-400 mb-0.5">{s.value}</div>
                <div className="text-xs sm:text-sm text-white/40">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Tools showcase */}
        <section className="py-16 sm:py-20 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
              <h2 className="text-2xl sm:text-4xl font-bold mb-3">8 Professional Tools. One Lifetime Deal.</h2>
              <p className="text-base text-white/50 max-w-xl mx-auto">Other platforms charge $50–200/mo for each of these. You get all 8 — forever — for $99.</p>
            </motion.div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {features.map((f, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
                  className="bg-white/5 border border-white/8 rounded-xl p-5 hover:border-amber-500/30 hover:bg-white/8 transition-all duration-200"
                >
                  <div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center mb-3"><f.icon className="w-5 h-5 text-amber-400" /></div>
                  <h3 className="font-semibold text-white text-sm mb-1">{f.title}</h3>
                  <p className="text-xs text-white/40 leading-relaxed">{f.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Feature: Campaign Builder Deep Dive */}
        <section className="py-16 sm:py-20 px-4 sm:px-6 border-y border-white/5">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
                <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-full text-xs font-bold mb-5">
                  <Target className="w-3.5 h-3.5" /> Campaign Builder 3.0
                </span>
                <h2 className="text-2xl sm:text-4xl font-bold mb-4">Build a Full Google Ads Campaign in Under 10 Minutes</h2>
                <p className="text-white/50 text-base mb-6 leading-relaxed">Our step-by-step wizard takes your website URL and builds a complete, Google Ads Editor–ready campaign. 13 proven structures. AI-generated keywords. Professional ad copy. All extensions included.</p>
                <div className="space-y-3">
                  {['7-step campaign wizard — no experience required', '13 structures including SKAG, Alpha-Beta, Intent-Based and more', '1,600+ keywords across all match types per campaign', 'RSA, DKI & Call-Only ads with all 10+ extension types', 'CSV export for Google Ads Editor — import in one click', '70+ ready-made presets for every industry niche'].map(item => (
                    <div key={item} className="flex items-start gap-3 text-sm text-white/70">
                      <CheckCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" /> {item}
                    </div>
                  ))}
                </div>
              </motion.div>
              <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
                <div className="bg-[#111318] rounded-2xl border border-white/10 overflow-hidden">
                  <div className="bg-gradient-to-r from-amber-600 to-orange-600 px-5 py-4">
                    <div className="flex gap-1.5 mb-3"><div className="w-3 h-3 rounded-full bg-white/20"/><div className="w-3 h-3 rounded-full bg-white/20"/><div className="w-3 h-3 rounded-full bg-white/20"/></div>
                    <h3 className="text-white font-bold">Campaign Builder 3.0</h3>
                    <p className="text-amber-200 text-xs">Step 2 of 7 — Choose structure</p>
                  </div>
                  <div className="p-4">
                    {[
                      { name: 'SKAG', desc: 'Single Keyword Ad Groups', active: true },
                      { name: 'Intent-Based', desc: 'Search intent clustering', active: false },
                      { name: 'Alpha-Beta', desc: 'Broad & exact split testing', active: false },
                      { name: 'Geo-Targeted', desc: '30K+ ZIP code locations', active: false },
                    ].map((s, i) => (
                      <motion.div key={s.name} initial={{ opacity: 0, y: 6 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }}
                        className={`flex items-center justify-between px-4 py-3 rounded-xl mb-2 last:mb-0 border ${s.active ? 'bg-amber-500/15 border-amber-500/40' : 'bg-white/5 border-white/5'}`}
                      >
                        <div>
                          <div className={`text-sm font-bold ${s.active ? 'text-amber-400' : 'text-white/70'}`}>{s.name}</div>
                          <div className="text-[10px] text-white/30">{s.desc}</div>
                        </div>
                        {s.active && <Check className="w-4 h-4 text-amber-400" />}
                      </motion.div>
                    ))}
                    <div className="mt-3 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-xs text-amber-300 flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 flex-shrink-0" /> AI generating 1,647 keywords + RSA, DKI & Call-Only ads...
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Pricing CTA */}
        <section className="py-16 sm:py-20 px-4 sm:px-6">
          <div className="max-w-lg mx-auto">
            <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <div className="relative">
                <div className="absolute -inset-[2px] bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 rounded-2xl blur opacity-40" />
                <div className="relative bg-[#111318] border border-white/10 rounded-2xl p-8 sm:p-10 overflow-hidden">
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-center mb-6">
                    <span className="text-sm text-red-300 font-semibold"><Flame className="w-4 h-4 inline mr-1.5" />{spotsLeft} of {TOTAL_SPOTS} spots remain — don't wait</span>
                    <div className="h-2 bg-white/5 rounded-full mt-2 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <div className="text-center mb-6">
                    <div className="flex items-baseline justify-center gap-3 mb-2">
                      <span className="text-xl text-white/30 line-through">$149</span>
                      <span className="text-6xl sm:text-7xl font-black text-white">$99</span>
                    </div>
                    <p className="text-white/40 text-sm mb-1">One-time payment. No recurring charges ever.</p>
                    <p className="text-amber-400 font-semibold text-sm">Saves $1,700+ vs paying for monthly tools</p>
                  </div>
                  <div className="space-y-2.5 mb-8">
                    {['Campaign Builder (13 structures, 70+ presets)', 'Click Guard click fraud protection', 'Keyword Planner + Mixer (1,600+/build)', 'Domain Monitor (unlimited domains)', 'AI Ad Generator (all ad types)', 'Proxy Mail for competitor research', 'Geo Targeting (15K+ cities)', 'Up to 5 team seats', 'All future updates — forever', '14-day money-back guarantee'].map((item, i) => (
                      <div key={i} className="flex items-center gap-3 text-sm text-white/70">
                        <CheckCircle className="w-4 h-4 text-amber-400 flex-shrink-0" /> {item}
                      </div>
                    ))}
                  </div>
                  <Button onClick={handleBuyNow} disabled={isLoading}
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black font-extrabold h-14 rounded-xl text-base shadow-xl shadow-amber-500/20 hover:scale-[1.01] transition-all"
                  >
                    {isLoading ? 'Processing...' : <span className="flex items-center gap-2 justify-center"><Flame className="w-5 h-5" /> Claim My Spot — $99</span>}
                  </Button>
                  <p className="text-xs text-white/25 mt-3 flex items-center justify-center gap-2"><Lock className="w-3 h-3" /> Secured by Stripe · <Shield className="w-3 h-3" /> 14-day refund · <Infinity className="w-3 h-3" /> Lifetime access</p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-16 sm:py-20 px-4 sm:px-6 border-y border-white/5">
          <div className="max-w-5xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
              <h2 className="text-2xl sm:text-4xl font-bold mb-3">People Who Grabbed Their Spot Are Loving It</h2>
              <div className="flex items-center justify-center gap-1">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 fill-amber-400" />)}</div>
            </motion.div>
            <div className="grid sm:grid-cols-3 gap-5">
              {testimonials.map((t, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                  className="bg-white/5 border border-white/8 rounded-xl p-5 flex flex-col gap-4"
                >
                  <div className="flex gap-0.5">{Array.from({ length: t.rating }).map((_, j) => <Star key={j} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />)}</div>
                  <p className="text-white/60 text-sm leading-relaxed flex-1">"{t.text}"</p>
                  <div className="flex items-center gap-3 pt-2 border-t border-white/5">
                    <div className="w-9 h-9 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 font-bold text-sm flex-shrink-0">{t.initials}</div>
                    <div><div className="font-semibold text-white text-sm">{t.name}</div><div className="text-xs text-white/30">{t.role}</div></div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 sm:py-20 px-4 sm:px-6">
          <div className="max-w-2xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-10">
              <h2 className="text-2xl sm:text-4xl font-bold mb-2">Questions? Answered.</h2>
            </motion.div>
            <div className="space-y-2">
              {faqs.map((faq, i) => (
                <motion.div key={i} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="bg-white/5 border border-white/8 rounded-xl overflow-hidden">
                  <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between p-4 sm:p-5 text-left gap-3 hover:bg-white/5 transition-colors">
                    <span className="font-medium text-white text-sm sm:text-base">{faq.q}</span>
                    {openFaq === i ? <ChevronUp className="w-4 h-4 text-white/40 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-white/40 flex-shrink-0" />}
                  </button>
                  {openFaq === i && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 sm:px-5 pb-4 sm:pb-5"><p className="text-white/50 text-sm leading-relaxed">{faq.a}</p></motion.div>}
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/10 py-6 px-4 sm:px-6 pb-24 sm:pb-6">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-white/30">
            <span>© {new Date().getFullYear()} Adiology. All rights reserved.</span>
            <div className="flex gap-4 sm:gap-6 flex-wrap justify-center">
              <button onClick={() => onNavigate?.('privacy-policy')} className="hover:text-white/60 transition-colors">Privacy Policy</button>
              <button onClick={() => onNavigate?.('terms-of-service')} className="hover:text-white/60 transition-colors">Terms of Service</button>
              <button onClick={() => onNavigate?.('refund-policy')} className="hover:text-white/60 transition-colors">Refund Policy</button>
            </div>
          </div>
        </footer>

        {/* Mobile sticky CTA */}
        <div className="fixed bottom-0 left-0 right-0 z-40 sm:hidden border-t border-white/10 bg-[#0d0d0f]/95 backdrop-blur-lg p-3 shadow-2xl">
          <Button onClick={handleBuyNow} disabled={isLoading} className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-black font-extrabold h-12 rounded-xl text-base">
            <Flame className="w-4 h-4 mr-2" />{isLoading ? 'Processing...' : `Only ${spotsLeft} Left — Claim Your Spot $99`}
          </Button>
          <p className="text-center text-xs text-white/30 mt-1.5"><Shield className="w-3 h-3 inline mr-1" />14-day money-back guarantee</p>
        </div>

        {/* Email Modal */}
        {showEmailModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div initial={{ opacity: 0, y: 30, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="bg-[#111318] border border-white/10 rounded-2xl p-5 sm:p-6 w-full max-w-md shadow-2xl">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-lg font-bold text-white">Secure your spot now!</h3>
                <button onClick={() => { setShowEmailModal(false); setEmailError(''); }} className="text-white/40 hover:text-white p-1"><X className="w-5 h-5" /></button>
              </div>
              <p className="text-white/50 text-sm mb-5">Enter your email to complete checkout and lock in your lifetime access.</p>
              <form onSubmit={handleEmailSubmit} className="space-y-3">
                <input type="email" placeholder={currentUser?.email || "your@email.com"} value={email} onChange={(e) => { setEmail(e.target.value); setEmailError(''); }}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm" autoFocus />
                {emailError && <p className="text-red-400 text-sm">{emailError}</p>}
                <div>
                  <label className="text-white/40 text-xs mb-1.5 block">Promo code (optional)</label>
                  <div className="flex gap-2">
                    <input type="text" placeholder="Enter promo code" value={promoCode} onChange={(e) => { setPromoCode(e.target.value); setPromoError(''); setPromoApplied(null); }}
                      className="flex-1 px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
                    <button type="button" onClick={handleApplyPromo} disabled={promoLoading || !promoCode.trim()} className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white text-sm rounded-lg border border-white/10 disabled:opacity-50 font-medium">{promoLoading ? '...' : 'Apply'}</button>
                  </div>
                  {promoError && <p className="text-red-400 text-xs mt-1">{promoError}</p>}
                  {promoApplied?.valid && <p className="text-amber-400 text-xs mt-1">{promoApplied.discount} applied!{promoApplied.newAmount !== undefined && <span> New price: ${(promoApplied.newAmount / 100).toFixed(2)}</span>}</p>}
                </div>
                <Button type="submit" disabled={isLoading} className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black font-extrabold h-11 rounded-lg text-sm">
                  {isLoading ? 'Processing...' : promoApplied?.newAmount !== undefined ? `Claim Spot — $${(promoApplied.newAmount / 100).toFixed(2)}` : 'Claim My Spot — $99'}
                </Button>
              </form>
              <p className="text-xs text-white/25 mt-4 text-center flex items-center justify-center gap-1"><Lock className="w-3 h-3" /> Secure checkout powered by Stripe</p>
            </motion.div>
          </div>
        )}
      </div>
    </>
  );
}
