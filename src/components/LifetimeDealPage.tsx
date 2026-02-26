import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import {
  Zap, Check, Sparkles, Target, BarChart3,
  FileText, Globe, Layers, Shield, ArrowRight,
  TrendingUp, Star, CreditCard, Gift, Infinity,
  MousePointer, Clock, Award, Users, Lock,
  ChevronDown, ChevronUp, CheckCircle, X
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
    processCheckout(trimmed);
  };

  const features = [
    { icon: Target, title: 'Smart Campaign Builder', desc: '13 proven campaign structures including SKAG, STAG, Alpha-Beta, and SKAG Split' },
    { icon: Sparkles, title: 'AI Keyword Generation', desc: 'Generate hundreds of targeted keywords instantly with intent-based filtering' },
    { icon: FileText, title: 'Ad Creation (RSA, DKI, Call-Only)', desc: 'Policy-compliant ads with live preview and ad strength scoring' },
    { icon: Globe, title: 'Geo Targeting', desc: 'Target by country, state, city, or ZIP code with 15,000+ locations' },
    { icon: Layers, title: '70+ Campaign Presets', desc: 'Ready-made templates for legal, dental, HVAC, real estate, and more' },
    { icon: BarChart3, title: 'Google Ads Editor Export', desc: 'Export and import directly into Google Ads Editor in minutes' },
    { icon: TrendingUp, title: 'Keyword Mixer & Planner', desc: 'Combine, filter, and discover long-tail keyword opportunities' },
    { icon: Shield, title: 'Click Guard Fraud Protection', desc: 'Bot detection, IP blocking, and live traffic monitoring for your ads' },
    { icon: MousePointer, title: 'Campaign Assets', desc: 'Sitelinks, callouts, structured snippets, and call extensions' },
    { icon: Users, title: 'Up to 5 Team Seats', desc: 'Collaborate with your team on campaigns' },
  ];

  const comparisonRows = [
    { feature: 'Campaign structures', lifetime: '13 types', others: '2-3 types' },
    { feature: 'AI keyword generation', lifetime: 'Unlimited', others: 'Limited credits' },
    { feature: 'Ad types (RSA, DKI, Call-Only)', lifetime: 'All included', others: 'RSA only' },
    { feature: 'Campaign presets', lifetime: '70+', others: '5-10' },
    { feature: 'Click fraud protection', lifetime: 'Built-in', others: '$50+/mo extra' },
    { feature: 'Google Ads Editor export', lifetime: 'Included', others: 'Manual work' },
    { feature: 'Campaign assets/extensions', lifetime: 'Full support', others: 'Limited' },
    { feature: 'Team seats', lifetime: 'Up to 5', others: '1 seat' },
    { feature: 'Lifetime updates', lifetime: 'Forever', others: 'Version-locked' },
    { feature: 'Total cost (2 years)', lifetime: '$99 once', others: '$1,200 - $3,600+' },
  ];

  const faqs = [
    {
      q: 'What does "Lifetime" mean exactly?',
      a: 'You pay once and get access to all current and future features of Adiology forever. No monthly fees, no renewal charges, no hidden costs.'
    },
    {
      q: 'Is there a money-back guarantee?',
      a: 'Yes! We offer a 14-day money-back guarantee. If you\'re not satisfied for any reason, contact us for a full refund.'
    },
    {
      q: 'Will I get future updates?',
      a: 'Absolutely. All future features, improvements, and updates are included with your lifetime deal at no additional cost.'
    },
    {
      q: 'How many campaigns can I create?',
      a: 'Unlimited. There are no caps on the number of campaigns, keywords, or ads you can generate.'
    },
    {
      q: 'Can I use this for client work?',
      a: 'Yes. Many agency owners use Adiology to build campaigns for their clients. You can export and manage campaigns for multiple businesses.'
    },
    {
      q: 'What payment methods do you accept?',
      a: 'We accept all major credit and debit cards through Stripe, including Visa, Mastercard, American Express, and Discover.'
    },
  ];

  const testimonials = [
    { name: 'Sarah M.', role: 'Digital Marketing Manager', text: 'Cut our campaign setup time by 80%. What used to take days now takes minutes.', rating: 5 },
    { name: 'Mike R.', role: 'Agency Owner', text: 'The AI keyword generation is incredible. We generated over 500 targeted keywords in seconds.', rating: 5 },
    { name: 'Jennifer L.', role: 'Small Business Owner', text: 'Finally a tool that makes Google Ads accessible. The presets are a game-changer.', rating: 5 },
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
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Lifetime Deal - Adiology | $99 One-Time Payment" />
        <meta name="twitter:description" content="Get lifetime access to all Adiology features for just $99." />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Product",
          "name": "Adiology Lifetime Deal",
          "description": "Lifetime access to all Adiology Google Ads tools",
          "url": "https://adiology.io/lifetime-deal",
          "offers": {
            "@type": "Offer",
            "price": "99",
            "priceCurrency": "USD",
            "availability": "https://schema.org/InStock"
          },
          "brand": {
            "@type": "Organization",
            "name": "Adiology"
          }
        })}</script>
      </Helmet>
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">

        <nav className="border-b border-white/10 bg-slate-950/80 backdrop-blur-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => onNavigate?.('home')}
          >
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">A</span>
            </div>
            <span className="text-xl font-bold">Adiology</span>
          </div>
          <Button
            onClick={handleBuyNow}
            disabled={isLoading}
            className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold px-6"
          >
            {isLoading ? 'Loading...' : 'Get Lifetime Access — $99'}
          </Button>
        </div>
      </nav>

      {showSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-emerald-500/20 border-b border-emerald-500/30"
        >
          <div className="max-w-5xl mx-auto px-6 py-6 flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/30 flex items-center justify-center flex-shrink-0 mt-1">
              <CheckCircle className="w-7 h-7 text-emerald-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-emerald-300 mb-1">Payment Successful!</h3>
              <p className="text-emerald-200/80 text-sm leading-relaxed">
                {checkoutEmail ? (
                  <>Your Lifetime Access is confirmed for <strong className="text-emerald-300">{checkoutEmail}</strong>. To get started, set up your password below. We've also sent setup instructions to your email.</>
                ) : (
                  <>Your Lifetime Access is confirmed! To get started, set up your account below. Check your email for setup instructions.</>
                )}
              </p>
              <Button
                onClick={() => {
                  if (checkoutEmail) {
                    sessionStorage.setItem('lifetime_signup_email', checkoutEmail);
                  }
                  onNavigate?.('complete-signup');
                }}
                className="mt-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-6"
                size="sm"
              >
                Set Up Your Account <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
            <button
              onClick={() => setShowSuccess(false)}
              className="text-emerald-400/60 hover:text-emerald-300 transition-colors flex-shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      )}

      <section className="relative py-20 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-900/20 via-transparent to-transparent" />

        <div className="max-w-5xl mx-auto relative z-10 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <Badge className="mb-6 bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0 px-6 py-2 text-base">
              <Gift className="w-4 h-4 mr-2" />
              LIFETIME DEAL
            </Badge>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              Pay Once.
              <span className="block bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
                Use Forever.
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-300 mb-10 max-w-3xl mx-auto">
              Get lifetime access to Adiology's complete Google Ads campaign builder platform.
              No subscriptions. No renewals. One payment, forever.
            </p>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="max-w-xl mx-auto mb-12"
            >
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 rounded-2xl blur-lg opacity-60" />
                <div className="relative bg-slate-900 border border-white/10 rounded-2xl p-8">
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <Infinity className="w-6 h-6 text-emerald-400" />
                    <span className="text-sm font-semibold text-emerald-400 uppercase tracking-wider">Lifetime Access</span>
                  </div>
                  <div className="flex items-baseline justify-center gap-3 mb-2">
                    <span className="text-2xl text-gray-500 line-through">$149</span>
                    <span className="text-6xl font-bold text-white">$99</span>
                  </div>
                  <p className="text-gray-400 mb-6">One-time payment. No recurring fees.</p>

                  <Button
                    onClick={handleBuyNow}
                    disabled={isLoading}
                    size="lg"
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-lg py-6 rounded-xl shadow-lg shadow-emerald-500/25"
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Processing...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <CreditCard className="w-5 h-5" />
                        Get Lifetime Access Now
                        <ArrowRight className="w-5 h-5" />
                      </span>
                    )}
                  </Button>

                  <div className="flex items-center justify-center gap-6 mt-4 text-sm text-gray-400">
                    <span className="flex items-center gap-1"><Lock className="w-3.5 h-3.5" /> Secure checkout</span>
                    <span className="flex items-center gap-1"><Shield className="w-3.5 h-3.5" /> 14-day guarantee</span>
                  </div>
                </div>
              </div>
            </motion.div>

            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-400">
              <span className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> No monthly fees</span>
              <span className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Lifetime updates</span>
              <span className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> 14-day money-back</span>
              <span className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> All features included</span>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-20 px-6 bg-slate-900/50">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything You Need to Dominate Google Ads</h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">All features included. No upsells. No hidden tiers.</p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-5">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="bg-slate-800/60 border border-white/5 rounded-xl p-5 flex gap-4 hover:border-emerald-500/30 transition-colors"
              >
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-lg flex items-center justify-center">
                  <f.icon className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">{f.title}</h3>
                  <p className="text-sm text-gray-400">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How Adiology Compares</h2>
            <p className="text-lg text-gray-400">See why the lifetime deal is the smartest investment for your ad campaigns.</p>
          </motion.div>

          <div className="bg-slate-800/60 border border-white/10 rounded-2xl overflow-hidden">
            <div className="grid grid-cols-3 bg-slate-800 border-b border-white/10">
              <div className="p-4 text-sm font-medium text-gray-400">Feature</div>
              <div className="p-4 text-sm font-bold text-emerald-400 text-center bg-emerald-500/10 border-x border-emerald-500/20">Adiology Lifetime</div>
              <div className="p-4 text-sm font-medium text-gray-400 text-center">Other Tools</div>
            </div>
            {comparisonRows.map((row, i) => (
              <div key={i} className={`grid grid-cols-3 ${i % 2 === 0 ? 'bg-slate-800/30' : ''} border-b border-white/5 last:border-0`}>
                <div className="p-4 text-sm text-gray-300">{row.feature}</div>
                <div className="p-4 text-sm text-emerald-400 font-medium text-center bg-emerald-500/5 border-x border-emerald-500/10 flex items-center justify-center gap-1.5">
                  <Check className="w-4 h-4 flex-shrink-0" /> {row.lifetime}
                </div>
                <div className="p-4 text-sm text-gray-500 text-center">{row.others}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6 bg-slate-900/50">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Trusted by Marketers & Agencies</h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-slate-800/60 border border-white/5 rounded-xl p-6"
              >
                <div className="flex gap-1 mb-3">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-gray-300 mb-4 text-sm leading-relaxed">"{t.text}"</p>
                <div>
                  <div className="font-semibold text-white text-sm">{t.name}</div>
                  <div className="text-xs text-gray-500">{t.role}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Frequently Asked Questions</h2>
          </motion.div>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-slate-800/60 border border-white/5 rounded-xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left"
                >
                  <span className="font-medium text-white">{faq.q}</span>
                  {openFaq === i ? <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" /> : <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />}
                </button>
                {openFaq === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="px-5 pb-5"
                  >
                    <p className="text-gray-400 text-sm leading-relaxed">{faq.a}</p>
                  </motion.div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 rounded-2xl blur-lg opacity-40" />
              <div className="relative bg-slate-900 border border-white/10 rounded-2xl p-10">
                <Award className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
                <h2 className="text-3xl md:text-4xl font-bold mb-3">Lock In Your Lifetime Deal</h2>
                <p className="text-gray-400 mb-2">One payment. Unlimited access. Forever.</p>
                <div className="flex items-baseline justify-center gap-3 mb-6">
                  <span className="text-xl text-gray-500 line-through">$149</span>
                  <span className="text-5xl font-bold text-white">$99</span>
                </div>
                <Button
                  onClick={handleBuyNow}
                  disabled={isLoading}
                  size="lg"
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-lg px-12 py-6 rounded-xl shadow-lg shadow-emerald-500/25"
                >
                  {isLoading ? 'Processing...' : (
                    <span className="flex items-center gap-2">
                      <CreditCard className="w-5 h-5" />
                      Get Lifetime Access — $99
                    </span>
                  )}
                </Button>
                <p className="text-xs text-gray-500 mt-4">Secure checkout powered by Stripe. 14-day money-back guarantee.</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <footer className="border-t border-white/10 py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4 text-sm text-gray-500">
          <span>&copy; {new Date().getFullYear()} Adiology. All rights reserved.</span>
          <div className="flex gap-6">
            <button onClick={() => onNavigate?.('privacy-policy')} className="hover:text-gray-300 transition-colors">Privacy Policy</button>
            <button onClick={() => onNavigate?.('terms-of-service')} className="hover:text-gray-300 transition-colors">Terms of Service</button>
            <button onClick={() => onNavigate?.('refund-policy')} className="hover:text-gray-300 transition-colors">Refund Policy</button>
          </div>
        </div>
      </footer>

      {showEmailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl"
          >
            <h3 className="text-xl font-bold text-white mb-2">Almost there!</h3>
            <p className="text-gray-400 text-sm mb-5">Enter your email to proceed to secure checkout.</p>
            <form onSubmit={handleEmailSubmit}>
              <input
                type="email"
                placeholder={currentUser?.email || "your@email.com"}
                value={email}
                onChange={(e) => { setEmail(e.target.value); setEmailError(''); }}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent mb-3"
                autoFocus
              />
              {emailError && (
                <p className="text-red-400 text-sm mb-3">{emailError}</p>
              )}
              <div className="mb-3">
                <label className="text-gray-400 text-xs mb-1 block">Have a promo code?</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter promo code"
                    value={promoCode}
                    onChange={(e) => { setPromoCode(e.target.value); setPromoError(''); setPromoApplied(null); }}
                    className="flex-1 px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={handleApplyPromo}
                    disabled={promoLoading || !promoCode.trim()}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg border border-slate-600 disabled:opacity-50 transition-colors"
                  >
                    {promoLoading ? '...' : 'Apply'}
                  </button>
                </div>
                {promoError && <p className="text-red-400 text-xs mt-1">{promoError}</p>}
                {promoApplied?.valid && (
                  <p className="text-emerald-400 text-xs mt-1">
                    {promoApplied.discount} applied!{' '}
                    {promoApplied.newAmount !== undefined && (
                      <span>New price: ${(promoApplied.newAmount / 100).toFixed(2)}</span>
                    )}
                  </p>
                )}
              </div>
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold py-3 rounded-lg"
              >
                {isLoading ? 'Processing...' : promoApplied?.newAmount !== undefined ? `Continue to Checkout — $${(promoApplied.newAmount / 100).toFixed(2)}` : 'Continue to Checkout — $99'}
              </Button>
              <button
                type="button"
                onClick={() => { setShowEmailModal(false); setEmailError(''); }}
                className="w-full mt-3 text-gray-400 hover:text-white text-sm transition-colors"
              >
                Cancel
              </button>
            </form>
            <p className="text-xs text-gray-500 mt-4 text-center flex items-center justify-center gap-1">
              <Lock className="w-3 h-3" /> Secure checkout powered by Stripe
            </p>
          </motion.div>
        </div>
      )}
    </div>
    </>
  );
}
