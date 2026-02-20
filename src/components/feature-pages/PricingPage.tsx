import { motion } from 'framer-motion';
import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  ArrowLeft, ArrowRight, Check, Sparkles, Zap, Shield,
  Star, Crown, Rocket, Users
} from 'lucide-react';

interface PricingPageProps {
  onGetStarted?: () => void;
  onBack?: () => void;
  onSelectPlan?: (planName: string, priceId: string, amount: number, isSubscription: boolean) => void;
}

export default function PricingPage({ onGetStarted, onBack, onSelectPlan }: PricingPageProps) {
  return (
    <>
      <Helmet>
        <title>Pricing - Affordable Google Ads Campaign Builder Plans | Adiology</title>
        <meta name="description" content="Choose from Starter, Professional, Agency, or Lifetime plans. All plans include a 7-day free trial and 14-day money-back guarantee. Start building better Google Ads campaigns today." />
        <link rel="canonical" href="https://adiology.io/pricing" />
        <meta property="og:title" content="Pricing - Affordable Google Ads Campaign Builder Plans | Adiology" />
        <meta property="og:description" content="Choose from Starter, Professional, Agency, or Lifetime plans. All plans include a 7-day free trial." />
        <meta property="og:url" content="https://adiology.io/pricing" />
        <meta property="og:type" content="website" />
      </Helmet>
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-purple-950 to-slate-950 text-white overflow-hidden">
        <Navigation onGetStarted={onGetStarted} onBack={onBack} />
        <HeroSection />
        <PlansSection onSelectPlan={onSelectPlan} onGetStarted={onGetStarted} />
        <FAQSection />
        <CTASection onGetStarted={onGetStarted} />
        <Footer />
      </div>
    </>
  );
}

function Navigation({ onGetStarted, onBack }: { onGetStarted?: () => void; onBack?: () => void }) {
  return (
    <nav className="sticky top-0 z-50 bg-slate-950/95 backdrop-blur-xl border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-black text-xl">A</span>
              </div>
              <span className="font-bold text-xl text-white">adiology</span>
            </div>
            <button onClick={onBack} className="text-sm text-gray-400 hover:text-white flex items-center gap-1 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          </div>
          <button onClick={onGetStarted} className="px-5 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-lg text-sm font-medium hover:from-violet-500 hover:to-indigo-500 transition-all">
            Get Started Free
          </button>
        </div>
      </div>
    </nav>
  );
}

function HeroSection() {
  return (
    <section className="relative py-20 px-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(99,102,241,0.15),transparent_50%)]" />
      <div className="max-w-4xl mx-auto text-center relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Simple, Transparent<br />
            <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">Pricing</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Choose the plan that fits your needs. All plans include a 7-day free trial and 14-day money-back guarantee.
          </p>
        </motion.div>
      </div>
    </section>
  );
}

function PlansSection({ onSelectPlan, onGetStarted }: { onSelectPlan?: (planName: string, priceId: string, amount: number, isSubscription: boolean) => void; onGetStarted?: () => void }) {
  const plans = [
    {
      name: 'Starter',
      price: '$29',
      period: '/month',
      icon: Zap,
      description: 'Perfect for freelancers and small businesses getting started with Google Ads.',
      features: [
        '5 campaigns per month',
        'Basic keyword research',
        'Standard ad generation',
        'CSV export',
        'Email support',
      ],
      popular: false,
    },
    {
      name: 'Professional',
      price: '$99',
      period: '/month',
      icon: Rocket,
      description: 'For growing businesses that need advanced campaign tools and AI features.',
      features: [
        'Unlimited campaigns',
        'AI-powered keyword planner',
        'Advanced ad generation (RSA, DKI)',
        'Click Guard protection',
        'Competitor ad search',
        'AI blog generator',
        'Priority support',
      ],
      popular: true,
    },
    {
      name: 'Agency',
      price: '$249',
      period: '/month',
      icon: Users,
      description: 'For agencies managing multiple client accounts at scale.',
      features: [
        'Everything in Professional',
        'Multi-client management',
        'White-label reports',
        'API access',
        'Dedicated account manager',
        'Custom campaign structures',
        'Team collaboration',
      ],
      popular: false,
    },
    {
      name: 'Lifetime',
      price: '$149',
      period: 'one-time',
      icon: Crown,
      description: 'Pay once, use forever. Best value for committed advertisers.',
      features: [
        'Everything in Professional',
        'Lifetime access',
        'All future updates',
        'Priority support forever',
        'No recurring fees',
      ],
      popular: false,
      highlight: true,
    },
  ];

  return (
    <section className="py-16 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className={`relative p-6 rounded-2xl border transition-all ${
                plan.popular
                  ? 'bg-gradient-to-b from-violet-900/40 to-indigo-900/40 border-violet-500/50 shadow-lg shadow-violet-500/10'
                  : plan.highlight
                    ? 'bg-gradient-to-b from-amber-900/20 to-orange-900/20 border-amber-500/30'
                    : 'bg-white/5 border-white/10 hover:border-white/20'
              }`}>
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-violet-600 text-white text-xs font-medium rounded-full">
                  Most Popular
                </div>
              )}
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-amber-600 text-white text-xs font-medium rounded-full">
                  Best Value
                </div>
              )}
              <plan.icon className={`w-8 h-8 mb-4 ${plan.popular ? 'text-violet-400' : plan.highlight ? 'text-amber-400' : 'text-gray-400'}`} />
              <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
              <div className="flex items-baseline gap-1 mb-3">
                <span className="text-3xl font-bold">{plan.price}</span>
                <span className="text-gray-400 text-sm">{plan.period}</span>
              </div>
              <p className="text-gray-400 text-sm mb-6">{plan.description}</p>
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={onGetStarted}
                className={`w-full py-3 rounded-xl text-sm font-semibold transition-all ${
                  plan.popular
                    ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}>
                Get Started
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const faqs = [
    { q: 'Can I try before I buy?', a: 'Yes! All plans include a 7-day free trial. No credit card required to start exploring.' },
    { q: 'What happens after the free trial?', a: 'After 7 days, you can choose a plan that fits your needs. Your data and campaigns are preserved.' },
    { q: 'Can I cancel anytime?', a: 'Absolutely. Monthly plans can be cancelled at any time with no penalties. We also offer a 14-day money-back guarantee.' },
    { q: 'What is the Lifetime plan?', a: 'The Lifetime plan is a one-time payment of $149 that gives you permanent access to all Professional features, including future updates.' },
    { q: 'Do you offer team or agency pricing?', a: 'Yes, our Agency plan supports multiple team members and client accounts. Contact us for custom enterprise pricing.' },
  ];

  return (
    <section className="py-20 px-6 bg-white/[0.02]">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
        </div>
        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div key={i} className="border border-white/10 rounded-xl overflow-hidden">
              <button onClick={() => setOpenIndex(openIndex === i ? null : i)} className="w-full p-5 text-left flex justify-between items-center hover:bg-white/5 transition-colors">
                <span className="font-medium">{faq.q}</span>
                <span className={`transition-transform ${openIndex === i ? 'rotate-45' : ''}`}>+</span>
              </button>
              {openIndex === i && (
                <div className="px-5 pb-5 text-gray-400">{faq.a}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection({ onGetStarted }: { onGetStarted?: () => void }) {
  return (
    <section className="py-24 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <Shield className="w-12 h-12 text-violet-400 mx-auto mb-6" />
        <h2 className="text-3xl md:text-4xl font-bold mb-4">Start Building Better Campaigns Today</h2>
        <p className="text-gray-400 text-lg mb-8 max-w-2xl mx-auto">
          Join thousands of advertisers who trust Adiology for their Google Ads campaigns. 14-day money-back guarantee.
        </p>
        <button onClick={onGetStarted} className="px-8 py-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl text-lg font-semibold hover:from-violet-500 hover:to-indigo-500 transition-all shadow-lg shadow-violet-500/25">
          Get Started Free
        </button>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="py-8 px-6 border-t border-white/10">
      <div className="max-w-6xl mx-auto text-center text-gray-500 text-sm">
        &copy; {new Date().getFullYear()} Adiology. All rights reserved.
      </div>
    </footer>
  );
}