import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { LTDProductDemo } from './LTDProductDemo';
import {
  ArrowRight, Zap, Layers, Sparkles, Check, Mail,
  Twitter, Linkedin, Youtube, TrendingUp, Target, Shield, Smartphone,
  Users, Search, Calendar, Filter, Rocket, Globe, Hash, BarChart3,
  FileText, MousePointerClick, Eye, Lock, Clock, Brain, Cpu,
  ShieldCheck, Activity, MailOpen, Inbox, Star, MapPin,
  MessageSquare, Menu, X
} from 'lucide-react';

interface HomepageLightProps {
  onGetStarted?: () => void;
  onLogin?: () => void;
  onSelectPlan?: (planName: string, priceId: string, amount: number, isSubscription: boolean) => void;
  onNavigateToPolicy?: (policy: string) => void;
  onNavigateToApp?: (tab: string) => void;
  onNavigateToPage?: (page: string) => void;
}

export default function HomepageLight({
  onGetStarted,
  onLogin,
  onSelectPlan,
  onNavigateToPolicy,
  onNavigateToApp,
  onNavigateToPage,
}: HomepageLightProps) {
  return (
    <>
      <Helmet>
        <title>Adiology - AI-Powered Google Ads Campaign Builder & Management Platform</title>
        <meta name="description" content="Build, optimize, and manage Google Ads campaigns with AI-powered tools. Campaign builder, keyword planner, click fraud protection, ad research, and more. Start free." />
        <link rel="canonical" href="https://adiology.io/" />
        <meta property="og:title" content="Adiology - AI-Powered Google Ads Campaign Builder" />
        <meta property="og:description" content="Build, optimize, and manage Google Ads campaigns with AI. Campaign builder, keyword planner, click fraud protection, and more." />
        <meta property="og:url" content="https://adiology.io/" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Adiology" />
        <meta property="og:image" content="https://adiology.io/og-image.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Adiology - AI-Powered Google Ads Campaign Builder" />
        <meta name="twitter:description" content="Build, optimize, and manage Google Ads campaigns with AI-powered tools. Start free." />
        <meta name="twitter:image" content="https://adiology.io/og-image.png" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Organization",
              "@id": "https://adiology.io/#organization",
              "name": "Adiology",
              "url": "https://adiology.io",
              "logo": { "@type": "ImageObject", "url": "https://adiology.io/og-image.png" },
              "sameAs": ["https://twitter.com/adiology", "https://linkedin.com/company/adiology"]
            },
            {
              "@type": "WebSite",
              "@id": "https://adiology.io/#website",
              "url": "https://adiology.io",
              "name": "Adiology",
              "publisher": { "@id": "https://adiology.io/#organization" },
              "potentialAction": {
                "@type": "SearchAction",
                "target": "https://adiology.io/blog?q={search_term_string}",
                "query-input": "required name=search_term_string"
              }
            },
            {
              "@type": "SoftwareApplication",
              "@id": "https://adiology.io/#software",
              "name": "Adiology",
              "description": "AI-powered Google Ads campaign builder with keyword planner, click fraud protection, and campaign optimization tools.",
              "applicationCategory": "BusinessApplication",
              "operatingSystem": "Web",
              "url": "https://adiology.io",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD",
                "description": "Free plan available. Pro plans from $29/month."
              },
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.8",
                "reviewCount": "40"
              },
              "publisher": { "@id": "https://adiology.io/#organization" }
            }
          ]
        })}</script>
      </Helmet>
      <div id="main-content" className="min-h-screen bg-white text-gray-900 overflow-hidden">
        <LightNavigation onGetStarted={onGetStarted} onLogin={onLogin} onNavigateToPage={onNavigateToPage} />
        <LightHeroSection onGetStarted={onGetStarted} onNavigateToPage={onNavigateToPage} />
        <LightStatsBar />
        <LightPlatformFeaturesSection onGetStarted={onGetStarted} />
        <LightCampaignBuilderSection onGetStarted={onGetStarted} />
        <LightClickGuardFeatureSection onGetStarted={onGetStarted} />
        <LightDomainMonitoringFeatureSection onGetStarted={onGetStarted} />
        <LightSecurityToolsSection onGetStarted={onGetStarted} />
        <LightSocialProofSection />
        <LightPricingSection onSelectPlan={onSelectPlan} />
        <LightFinalCTA onGetStarted={onGetStarted} />
        <LightFooter onNavigateToPolicy={onNavigateToPolicy} onNavigateToApp={onNavigateToApp} onNavigateToPage={onNavigateToPage} />
      </div>
    </>
  );
}

function LightNavigation({ onGetStarted, onLogin, onNavigateToPage }: { onGetStarted?: () => void; onLogin?: () => void; onNavigateToPage?: (page: string) => void }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handler = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white/95 backdrop-blur-xl shadow-sm border-b border-gray-200' : 'bg-white border-b border-gray-100'}`}>
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-violet-600 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-base">A</span>
          </div>
          <span className="font-bold text-xl text-gray-900">adiology</span>
        </div>

        <div className="hidden md:flex items-center gap-8">
          {[
            { label: 'Campaign Builder', page: '/features/campaign-builder' },
            { label: 'Click Guard', page: '/features/click-guard' },
            { label: 'Proxy Mail', page: '/features/proxy-mail' },
            { label: 'Domain Monitor', page: '/features/domain-monitor' },
          ].map(nav => (
            <button
              key={nav.label}
              onClick={() => onNavigateToPage?.(nav.page)}
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              {nav.label}
            </button>
          ))}
          <button
            onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            Pricing
          </button>
        </div>

        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={onLogin}
            className="px-5 py-2.5 text-sm font-semibold rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 transition-all"
          >
            Sign In
          </button>
          <button
            onClick={onGetStarted}
            className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold shadow-sm transition-all hover:shadow-md"
          >
            Get Started Free
          </button>
        </div>

        <button className="md:hidden p-2 text-gray-700" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="md:hidden bg-white border-t border-gray-100 px-6 pb-6 space-y-3"
        >
          {[
            { label: 'Campaign Builder', page: '/features/campaign-builder' },
            { label: 'Click Guard', page: '/features/click-guard' },
            { label: 'Proxy Mail', page: '/features/proxy-mail' },
            { label: 'Domain Monitor', page: '/features/domain-monitor' },
          ].map(nav => (
            <button key={nav.label} onClick={() => { setMobileOpen(false); onNavigateToPage?.(nav.page); }} className="block text-sm font-medium py-2 text-gray-700">
              {nav.label}
            </button>
          ))}
          <button onClick={() => { setMobileOpen(false); document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }} className="block text-sm font-medium py-2 text-gray-700">Pricing</button>
          <button onClick={() => { setMobileOpen(false); onLogin?.(); }} className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors">Sign In</button>
          <button onClick={onGetStarted} className="w-full px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold transition-colors">Get Started Free</button>
        </motion.div>
      )}
    </nav>
  );
}

function LightHeroSection({ onGetStarted, onNavigateToPage }: { onGetStarted?: () => void; onNavigateToPage?: (page: string) => void }) {
  const [cycleIdx, setCycleIdx] = useState(0);
  const cycleWords = ['campaigns', 'keywords', 'conversions'];

  useEffect(() => {
    const t = setInterval(() => setCycleIdx(i => (i + 1) % cycleWords.length), 2500);
    return () => clearInterval(t);
  }, []);

  const heroFeatures = [
    { icon: Rocket, title: 'Campaign Builder', desc: '13 structures, 1,600+ keywords', iconBg: 'bg-violet-100', iconColor: 'text-violet-600' },
    { icon: ShieldCheck, title: 'Click Guard', desc: 'Block bots, VPNs & fraud', iconBg: 'bg-rose-100', iconColor: 'text-rose-600' },
    { icon: Search, title: 'Keyword Suite', desc: 'Planner, Mixer, Long Tail', iconBg: 'bg-indigo-100', iconColor: 'text-indigo-600' },
    { icon: Globe, title: 'Domain Monitor', desc: 'SSL, DNS & expiry alerts', iconBg: 'bg-blue-100', iconColor: 'text-blue-600' },
    { icon: MailOpen, title: 'Proxy Mail', desc: 'Anonymous competitor intel', iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600' },
    { icon: Layers, title: '8 Tools in One', desc: 'Single platform, zero bloat', iconBg: 'bg-amber-100', iconColor: 'text-amber-600' },
  ];

  return (
    <section className="relative bg-white pt-28 md:pt-32 pb-20 px-6 overflow-hidden">
      {/* Layered gradient backgrounds */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 80% 60% at 10% 50%, rgba(139,92,246,0.07) 0%, transparent 55%)' }} />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 60% 50% at 90% 20%, rgba(99,102,241,0.06) 0%, transparent 55%)' }} />
        {/* Subtle dot grid */}
        <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: 'radial-gradient(circle, #6d28d9 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">

          {/* ── LEFT ── */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="flex-1 text-center lg:text-left max-w-xl mx-auto lg:mx-0"
          >
            {/* Animated badge */}
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-6 border"
              style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.1) 0%, rgba(99,102,241,0.1) 100%)', borderColor: 'rgba(139,92,246,0.25)', color: '#7c3aed' }}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500" />
              </span>
              AI-Powered Google Ads Platform
            </motion.div>

            {/* Headline with cycling word */}
            <h1 className="text-4xl md:text-5xl lg:text-[3.15rem] xl:text-6xl font-black leading-[1.1] mb-4 text-gray-900">
              Build better{' '}
              <span className="relative inline-block">
                <motion.span
                  key={cycleIdx}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.35 }}
                  className="text-violet-600"
                >
                  {cycleWords[cycleIdx]}
                </motion.span>
              </span>
              .
              <br className="hidden lg:block" />
              <span className="text-gray-900">Faster. With AI.</span>
            </h1>

            <p className="text-lg text-gray-500 mb-8 leading-relaxed">
              Campaign builder, keyword planner, click fraud protection, domain monitoring — 8 powerful Google Ads tools in one platform. Launch, protect and scale.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-3 mb-4">
              <motion.button
                onClick={onGetStarted}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="px-8 py-4 text-white rounded-2xl font-bold text-base shadow-lg transition-all flex items-center gap-2"
                style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)', boxShadow: '0 4px 24px rgba(245,158,11,0.35)' }}
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5" />
              </motion.button>
              <button
                onClick={() => onNavigateToPage?.('/demo')}
                className="px-8 py-4 border-2 border-gray-200 text-gray-700 rounded-2xl font-semibold text-base hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 transition-all"
              >
                See It In Action
              </button>
            </div>

            {/* Trust micro-copy */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs text-gray-400 mb-9">
              <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-green-500" />No credit card</span>
              <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-green-500" />7-day free trial</span>
              <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-green-500" />Cancel anytime</span>
            </div>

            {/* Feature pill grid */}
            <div className="grid grid-cols-2 gap-2">
              {heroFeatures.map((feature, i) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 + i * 0.06, duration: 0.4 }}
                  className="flex items-center gap-2.5 bg-white/80 backdrop-blur-sm border border-gray-100 rounded-xl p-2.5 shadow-sm hover:border-violet-200 hover:shadow-md transition-all"
                >
                  <div className={`shrink-0 w-7 h-7 rounded-lg ${feature.iconBg} flex items-center justify-center`}>
                    <feature.icon className={`w-3.5 h-3.5 ${feature.iconColor}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-gray-900 text-[11px] leading-tight">{feature.title}</p>
                    <p className="text-[10px] text-gray-400 leading-snug">{feature.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* ── RIGHT: Product Demo ── */}
          <motion.div
            initial={{ opacity: 0, x: 30, y: 8 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
            className="flex-1 w-full max-w-2xl mx-auto lg:mx-0"
          >
            <div className="relative">
              {/* Glow layers */}
              <div className="absolute -inset-6 rounded-3xl blur-3xl opacity-30 pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, rgba(139,92,246,0.5) 0%, rgba(99,102,241,0.3) 50%, transparent 80%)' }} />
              <div className="absolute -inset-2 rounded-2xl blur-xl opacity-20 pointer-events-none" style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)' }} />

              {/* Live notification badge */}
              <motion.div
                initial={{ opacity: 0, y: 10, x: -10 }}
                animate={{ opacity: 1, y: 0, x: 0 }}
                transition={{ delay: 1.2, duration: 0.5 }}
                className="absolute -top-4 -left-3 z-20 flex items-center gap-2 bg-white rounded-full px-3 py-1.5 shadow-lg border border-gray-100 text-xs font-semibold text-gray-700"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                </span>
                127 campaigns built today
              </motion.div>

              {/* Saved badge */}
              <motion.div
                initial={{ opacity: 0, y: 10, x: 10 }}
                animate={{ opacity: 1, y: 0, x: 0 }}
                transition={{ delay: 1.5, duration: 0.5 }}
                className="absolute -bottom-3 -right-2 z-20 flex items-center gap-1.5 bg-white rounded-full px-3 py-1.5 shadow-lg border border-gray-100 text-xs font-semibold text-gray-700"
              >
                <span className="text-amber-500">✦</span>
                $2,400 saved in fraud
              </motion.div>

              <div className="relative rounded-2xl overflow-hidden">
                <LTDProductDemo theme="light" />
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}

function LightStatsBar() {
  const stats = [
    { value: '13', label: 'Campaign Structures', icon: Layers, color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-100' },
    { value: '1,600+', label: 'Keywords per Build', icon: Search, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100' },
    { value: '10+', label: 'Ad Extension Types', icon: Sparkles, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
    { value: '30K', label: 'ZIP Code Targeting', icon: MapPin, color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-100' },
  ];

  return (
    <section className="py-8 px-6 bg-white border-y border-gray-100">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className={`flex items-center gap-4 p-4 rounded-2xl border ${stat.border} ${stat.bg}`}
            >
              <div className={`w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0 border ${stat.border}`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <div className={`text-2xl font-black ${stat.color} leading-none`}>{stat.value}</div>
                <div className="text-xs text-gray-500 font-medium mt-0.5">{stat.label}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function LightPlatformFeaturesSection({ onGetStarted }: { onGetStarted?: () => void }) {
  return (
    <section id="features" className="py-24 px-6 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-violet-100 text-violet-700 rounded-full text-sm font-semibold mb-4 border border-violet-200">
            <Layers className="w-4 h-4" />
            Complete Platform
          </span>
          <h2 className="text-3xl md:text-5xl font-black mb-4 text-gray-900">
            Everything You Need to
            <br />
            <span className="text-violet-600">Win at Google Ads</span>
          </h2>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto">
            One platform. Eight powerful tools. Campaign creation to click fraud protection.
          </p>
        </motion.div>

        {/* Bento grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">

          {/* BIG: Campaign Builder */}
          <motion.div
            initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            whileHover={{ y: -4 }}
            className="lg:col-span-2 relative overflow-hidden rounded-3xl border border-violet-200 bg-white shadow-sm hover:shadow-lg transition-all p-8"
          >
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-20 pointer-events-none" style={{ background: 'radial-gradient(circle, #8b5cf6, transparent)' }} />
            <div className="flex items-start justify-between mb-6">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' }}>
                <Target className="w-7 h-7 text-white" />
              </div>
              <span className="px-3 py-1 bg-violet-100 text-violet-700 text-xs font-bold rounded-full border border-violet-200">13 Structures</span>
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2">Campaign Builder 3.0</h3>
            <p className="text-gray-500 text-sm leading-relaxed mb-6 max-w-lg">Build complete Google Ads campaigns in minutes. 7-step wizard, 1,600+ keywords, RSA/DKI/Call-Only ads with all extensions, CSV export for Google Ads Editor.</p>
            <div className="flex flex-wrap gap-2">
              {['SKAG', 'STAG', 'Intent-Based', 'Geo-Targeted', 'Brand Split', '+8 more'].map(t => (
                <span key={t} className="px-2.5 py-1 bg-violet-50 text-violet-700 rounded-lg text-xs font-medium border border-violet-100">{t}</span>
              ))}
            </div>
          </motion.div>

          {/* Click Guard */}
          <motion.div
            initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.05 }}
            whileHover={{ y: -4 }}
            className="relative overflow-hidden rounded-3xl border border-rose-200 bg-white shadow-sm hover:shadow-lg transition-all p-8"
          >
            <div className="absolute bottom-0 right-0 w-48 h-48 rounded-full blur-3xl opacity-15 pointer-events-none" style={{ background: 'radial-gradient(circle, #f43f5e, transparent)' }} />
            <div className="flex items-center justify-between mb-6">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #f43f5e, #e11d48)' }}>
                <ShieldCheck className="w-7 h-7 text-white" />
              </div>
              <span className="flex items-center gap-1.5 px-2.5 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />Live
              </span>
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2">Click Guard</h3>
            <p className="text-gray-500 text-sm leading-relaxed">Real-time click fraud detection. Bot scoring, IP blocking, VPN detection — 40+ behavioral signals.</p>
          </motion.div>

          {/* Keyword Suite */}
          <motion.div
            initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
            whileHover={{ y: -4 }}
            className="relative overflow-hidden rounded-3xl border border-indigo-200 bg-white shadow-sm hover:shadow-lg transition-all p-8"
          >
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6" style={{ background: 'linear-gradient(135deg, #6366f1, #4338ca)' }}>
              <Hash className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2">Keyword Suite</h3>
            <p className="text-gray-500 text-sm leading-relaxed mb-4">Planner, Mixer, Long Tail & Negative keyword tools. Generate 1,600+ keywords with match types, CPC and competition data.</p>
            <div className="flex flex-wrap gap-1.5">
              {['Planner', 'Mixer', 'Long Tail', 'Negatives'].map(t => (
                <span key={t} className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-md text-xs font-medium">{t}</span>
              ))}
            </div>
          </motion.div>

          {/* Domain Monitor */}
          <motion.div
            initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.15 }}
            whileHover={{ y: -4 }}
            className="relative overflow-hidden rounded-3xl border border-blue-200 bg-white shadow-sm hover:shadow-lg transition-all p-8"
          >
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6" style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' }}>
              <Globe className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2">Domain Monitor</h3>
            <p className="text-gray-500 text-sm leading-relaxed">Track domain expiry, SSL certificates & DNS records. Automated alerts before anything expires.</p>
          </motion.div>

          {/* AI Ad Generator + Proxy Mail side by side as a wide card */}
          <motion.div
            initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}
            className="grid grid-cols-2 gap-5"
          >
            <motion.div whileHover={{ y: -4 }} className="relative overflow-hidden rounded-3xl border border-emerald-200 bg-white shadow-sm hover:shadow-lg transition-all p-6">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'linear-gradient(135deg, #10b981, #047857)' }}>
                <Brain className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-base font-black text-gray-900 mb-1">AI Ads</h3>
              <p className="text-gray-500 text-xs leading-relaxed">RSA, DKI & Call-Only ads with all 10+ extension types.</p>
            </motion.div>
            <motion.div whileHover={{ y: -4 }} className="relative overflow-hidden rounded-3xl border border-amber-200 bg-white shadow-sm hover:shadow-lg transition-all p-6">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                <MailOpen className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-base font-black text-gray-900 mb-1">Proxy Mail</h3>
              <p className="text-gray-500 text-xs leading-relaxed">Anonymous emails for competitor research.</p>
            </motion.div>
          </motion.div>

        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="text-center mt-10"
        >
          <motion.button
            onClick={onGetStarted}
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            className="px-8 py-4 text-white rounded-2xl font-bold shadow-lg flex items-center gap-2 mx-auto transition-all"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #f97316)', boxShadow: '0 4px 20px rgba(245,158,11,0.35)' }}
          >
            Explore All Features
            <ArrowRight className="w-5 h-5" />
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}

function LightCampaignBuilderSection({ onGetStarted }: { onGetStarted?: () => void }) {
  const structures = [
    { name: 'SKAG', desc: 'Single Keyword Ad Groups', icon: Zap, color: 'text-violet-600 bg-violet-50 border-violet-200' },
    { name: 'STAG', desc: 'Single Theme Ad Groups', icon: TrendingUp, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
    { name: 'Intent-Based', desc: 'Search intent clustering', icon: Target, color: 'text-blue-600 bg-blue-50 border-blue-200' },
    { name: 'Alpha-Beta', desc: 'Broad & exact split testing', icon: Layers, color: 'text-violet-600 bg-violet-50 border-violet-200' },
    { name: 'Geo-Targeted', desc: 'Location-based campaigns', icon: MapPin, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
    { name: 'Funnel-Based', desc: 'Awareness to conversion', icon: Filter, color: 'text-blue-600 bg-blue-50 border-blue-200' },
    { name: 'Brand Split', desc: 'Brand vs non-brand terms', icon: Sparkles, color: 'text-violet-600 bg-violet-50 border-violet-200' },
    { name: 'Device-Specific', desc: 'Mobile, desktop, tablet', icon: Smartphone, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
    { name: 'Audience-Based', desc: 'Demographic targeting', icon: Users, color: 'text-blue-600 bg-blue-50 border-blue-200' },
    { name: 'Long-Tail Master', desc: 'Low-competition keywords', icon: Search, color: 'text-violet-600 bg-violet-50 border-violet-200' },
    { name: 'Seasonal Sprint', desc: 'Time-sensitive campaigns', icon: Clock, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
    { name: 'Performance Max', desc: 'Google AI-optimized', icon: Rocket, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  ];

  return (
    <section id="campaign-builder" className="py-24 px-6 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-violet-100 text-violet-700 rounded-full text-sm font-medium mb-6 border border-violet-200">
              <Rocket className="w-4 h-4" />
              Campaign Builder 3.0
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">
              13 Campaign Structures
              <br />
              <span className="text-violet-600">for Every Strategy</span>
            </h2>
            <p className="text-gray-500 text-lg mb-8 leading-relaxed">
              Choose the perfect structure for your business. Our wizard analyzes your website,
              generates 1,600+ keywords, creates ads with all extensions, and exports a
              Google Ads Editor-ready CSV.
            </p>

            <div className="space-y-3 mb-8">
              {[
                'AI-powered website analysis & keyword generation',
                '1,600+ keywords with all match types',
                'RSA, DKI & Call-Only ads with 10+ extensions',
                'CSV export for Google Ads Editor',
                '30K+ ZIP code geo-targeting',
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-violet-600" />
                  </div>
                  <span className="text-gray-600 text-sm">{item}</span>
                </div>
              ))}
            </div>

            <motion.button
              onClick={onGetStarted}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="px-8 py-4 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-semibold shadow-sm flex items-center gap-2 transition-all"
            >
              Try Campaign Builder
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="bg-white rounded-3xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="bg-violet-600 p-6">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-3 h-3 rounded-full bg-white/30" />
                  <div className="w-3 h-3 rounded-full bg-white/30" />
                  <div className="w-3 h-3 rounded-full bg-white/30" />
                </div>
                <h3 className="text-white text-xl font-bold mt-3">Campaign Structures</h3>
                <p className="text-violet-200 text-sm">12 proven strategies to choose from</p>
              </div>
              <div className="p-5 grid grid-cols-2 gap-2.5">
                {structures.map((s, i) => {
                  const parts = s.color.split(' ');
                  return (
                    <motion.div
                      key={s.name}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.05 + i * 0.04 }}
                      whileHover={{ scale: 1.02 }}
                      className={`flex items-center gap-2.5 p-2.5 rounded-xl border ${parts[1]} ${parts[2]} hover:shadow-sm transition-all cursor-pointer`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${parts[1]}`}>
                        <s.icon className={`w-4 h-4 ${parts[0]}`} />
                      </div>
                      <div className="min-w-0">
                        <div className={`text-xs font-bold ${parts[0]}`}>{s.name}</div>
                        <div className="text-[10px] text-gray-500 truncate">{s.desc}</div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function LightClickGuardFeatureSection({ onGetStarted }: { onGetStarted?: () => void }) {
  const trafficRows = [
    { ip: '185.220.101.47', country: 'RU', clicks: 47, score: 94, status: 'Blocked' },
    { ip: '45.83.64.12', country: 'CN', clicks: 31, score: 88, status: 'Blocked' },
    { ip: '103.21.244.0', country: 'DE', clicks: 12, score: 41, status: 'Allowed' },
    { ip: '198.51.100.22', country: 'US', clicks: 3, score: 9, status: 'Allowed' },
    { ip: '77.88.55.60', country: 'BR', clicks: 29, score: 76, status: 'Flagged' },
  ];

  return (
    <section className="py-24 px-6 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-violet-100 text-violet-700 rounded-full text-sm font-medium mb-6 border border-violet-200">
              <MousePointerClick className="w-4 h-4" />
              Click Guard
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">
              Stop Click Fraud
              <br />
              <span className="text-violet-600">Before It Drains Your Budget</span>
            </h2>
            <p className="text-gray-500 text-lg mb-8 leading-relaxed">
              Real-time click fraud detection blocks bots, VPNs, and malicious IPs the moment they hit your ads — automatically, with zero manual work.
            </p>
            <div className="space-y-3 mb-8">
              {[
                'Bot score analysis across 40+ behavioral signals',
                'Automatic IP & VPN blocking via Google Ads exclusions',
                'Live traffic monitoring with 10-second refresh',
                '4 threat levels: Clean, Suspicious, Flagged, Blocked',
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-violet-600" />
                  </div>
                  <span className="text-gray-600 text-sm">{item}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-6 mb-8 p-4 bg-gray-50 rounded-2xl border border-gray-200">
              <div className="text-center">
                <div className="text-2xl font-black text-violet-600">40+</div>
                <div className="text-xs text-gray-500">Bot Signals</div>
              </div>
              <div className="w-px h-10 bg-gray-200" />
              <div className="text-center">
                <div className="text-2xl font-black text-violet-600">10s</div>
                <div className="text-xs text-gray-500">Refresh Rate</div>
              </div>
              <div className="w-px h-10 bg-gray-200" />
              <div className="text-center">
                <div className="text-2xl font-black text-violet-600">100%</div>
                <div className="text-xs text-gray-500">Auto-blocked</div>
              </div>
            </div>
            <motion.button
              onClick={onGetStarted}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="px-8 py-4 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-semibold shadow-sm flex items-center gap-2 transition-all"
            >
              Block Click Fraud Now
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="bg-white rounded-3xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-sm font-semibold text-gray-800">Live Traffic Monitor</span>
                </div>
                <span className="text-xs text-gray-400 bg-white border border-gray-200 px-2 py-1 rounded-lg">Refreshing in 8s</span>
              </div>
              <div className="p-5">
                <div className="flex gap-3 mb-4">
                  {[
                    { label: 'Blocked Today', value: '1,284', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100' },
                    { label: 'Flagged', value: '347', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
                    { label: 'Clean', value: '8,921', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100' },
                  ].map(stat => (
                    <div key={stat.label} className={`flex-1 rounded-xl p-3 ${stat.bg} border ${stat.border}`}>
                      <div className={`text-lg font-black ${stat.color}`}>{stat.value}</div>
                      <div className="text-[10px] text-gray-500">{stat.label}</div>
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  <div className="grid grid-cols-5 text-[10px] font-semibold text-gray-400 uppercase tracking-wide px-3 pb-1">
                    <span className="col-span-2">IP Address</span>
                    <span className="text-center">Clicks</span>
                    <span className="text-center">Bot Score</span>
                    <span className="text-right">Status</span>
                  </div>
                  {trafficRows.map((row) => (
                    <div key={row.ip} className="grid grid-cols-5 items-center px-3 py-2.5 rounded-xl bg-gray-50 hover:bg-violet-50 transition-colors border border-gray-100">
                      <div className="col-span-2">
                        <div className="text-xs font-mono text-gray-800">{row.ip}</div>
                        <div className="text-[10px] text-gray-400">{row.country}</div>
                      </div>
                      <div className="text-center text-xs font-semibold text-gray-700">{row.clicks}</div>
                      <div className="text-center">
                        <span className={`text-xs font-bold ${row.score >= 75 ? 'text-red-600' : row.score >= 50 ? 'text-amber-600' : 'text-green-600'}`}>
                          {row.score}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          row.status === 'Blocked' ? 'bg-red-100 text-red-700' :
                          row.status === 'Flagged' ? 'bg-amber-100 text-amber-700' :
                          'bg-green-100 text-green-700'
                        }`}>{row.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function LightDomainMonitoringFeatureSection({ onGetStarted }: { onGetStarted?: () => void }) {
  const domains = [
    { name: 'mystore.com', ssl: 'Valid', sslDays: 82, expiry: '210 days', dns: 'OK', status: 'Healthy' },
    { name: 'clientsite.io', ssl: 'Expiring', sslDays: 12, expiry: '44 days', dns: 'OK', status: 'Warning' },
    { name: 'agencysite.co', ssl: 'Valid', sslDays: 165, expiry: '310 days', dns: 'OK', status: 'Healthy' },
    { name: 'promopage.net', ssl: 'Expired', sslDays: 0, expiry: '6 days', dns: 'Alert', status: 'Critical' },
  ];

  return (
    <section className="py-24 px-6 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="order-2 lg:order-1"
          >
            <div className="bg-white rounded-3xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Globe className="w-4 h-4 text-indigo-600" />
                  <span className="text-sm font-semibold text-gray-800">Domain Health Dashboard</span>
                </div>
                <span className="text-xs text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-1 rounded-lg font-medium">4 Domains</span>
              </div>
              <div className="p-5 space-y-3">
                {domains.map((domain) => (
                  <div key={domain.name} className="rounded-2xl border border-gray-100 p-4 bg-gray-50 hover:bg-white hover:border-indigo-200 transition-all">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          domain.status === 'Healthy' ? 'bg-green-500' :
                          domain.status === 'Warning' ? 'bg-amber-500' : 'bg-red-500'
                        }`} />
                        <span className="text-sm font-semibold text-gray-800">{domain.name}</span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        domain.status === 'Healthy' ? 'bg-green-100 text-green-700' :
                        domain.status === 'Warning' ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-700'
                      }`}>{domain.status}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="text-center p-2 bg-white rounded-xl border border-gray-100">
                        <div className={`text-xs font-bold ${
                          domain.ssl === 'Valid' ? 'text-green-600' :
                          domain.ssl === 'Expiring' ? 'text-amber-600' : 'text-red-600'
                        }`}>{domain.ssl}</div>
                        <div className="text-[9px] text-gray-400">SSL {domain.sslDays > 0 ? `${domain.sslDays}d` : 'Exp.'}</div>
                      </div>
                      <div className="text-center p-2 bg-white rounded-xl border border-gray-100">
                        <div className="text-xs font-bold text-indigo-600">{domain.expiry}</div>
                        <div className="text-[9px] text-gray-400">Domain Exp.</div>
                      </div>
                      <div className="text-center p-2 bg-white rounded-xl border border-gray-100">
                        <div className={`text-xs font-bold ${domain.dns === 'OK' ? 'text-green-600' : 'text-red-600'}`}>{domain.dns}</div>
                        <div className="text-[9px] text-gray-400">DNS</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="order-1 lg:order-2"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium mb-6 border border-indigo-200">
              <Globe className="w-4 h-4" />
              Domain Monitoring
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">
              Never Miss an Expiry,
              <br />
              <span className="text-indigo-600">SSL Lapse, or DNS Issue</span>
            </h2>
            <p className="text-gray-500 text-lg mb-8 leading-relaxed">
              Track all your domains, clients' sites, and competitors in one dashboard. Get alerted before SSL certificates expire or domains go offline.
            </p>
            <div className="space-y-3 mb-8">
              {[
                'WHOIS lookups — domain age, registrar & expiry date',
                'SSL certificate monitoring with days-remaining countdown',
                'DNS record viewer — A, MX, CNAME, TXT records',
                'Automated expiry alerts before domains lapse',
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-indigo-600" />
                  </div>
                  <span className="text-gray-600 text-sm">{item}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-6 mb-8 p-4 bg-white rounded-2xl border border-gray-200">
              <div className="text-center">
                <div className="text-2xl font-black text-indigo-600">Unlimited</div>
                <div className="text-xs text-gray-500">Domains</div>
              </div>
              <div className="w-px h-10 bg-gray-200" />
              <div className="text-center">
                <div className="text-2xl font-black text-indigo-600">3</div>
                <div className="text-xs text-gray-500">Check Types</div>
              </div>
              <div className="w-px h-10 bg-gray-200" />
              <div className="text-center">
                <div className="text-2xl font-black text-indigo-600">24/7</div>
                <div className="text-xs text-gray-500">Monitoring</div>
              </div>
            </div>
            <motion.button
              onClick={onGetStarted}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="px-8 py-4 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-semibold shadow-sm flex items-center gap-2 transition-all"
            >
              Monitor Your Domains
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function LightSecurityToolsSection({ onGetStarted }: { onGetStarted?: () => void }) {
  const tools = [
    {
      icon: MousePointerClick,
      title: 'Click Guard',
      badge: 'Live',
      desc: 'Real-time click fraud detection and prevention for your ad campaigns.',
      features: ['Live Traffic Monitor', 'Bot Detection Engine', 'Traffic Analytics', 'IP & VPN Blocking'],
      stats: [{ v: '40+', l: 'Bot Signals' }, { v: '4', l: 'Threat Levels' }, { v: '10s', l: 'Refresh' }],
      gradient: 'from-rose-500 to-pink-600',
      glow: 'rgba(244,63,94,0.3)',
      iconItems: [Activity, ShieldCheck, BarChart3, Lock],
    },
    {
      icon: Globe,
      title: 'Domain Monitor',
      badge: null,
      desc: 'Track domain expiry, SSL certificates & DNS records with automated alerts.',
      features: ['WHOIS Lookups', 'SSL Certificate Monitoring', 'DNS Record Viewer', 'Expiry Alerts'],
      stats: [{ v: '∞', l: 'Domains' }, { v: '3', l: 'Check Types' }, { v: '24/7', l: 'Monitoring' }],
      gradient: 'from-blue-500 to-indigo-600',
      glow: 'rgba(59,130,246,0.3)',
      iconItems: [Eye, Lock, Globe, Clock],
    },
    {
      icon: Inbox,
      title: 'Proxy Mail',
      badge: null,
      desc: 'Anonymous emails for competitor research. Stay invisible, gather intelligence.',
      features: ['Real-time Inbox', 'Competitor Email Tracking', 'Auto-expiring Addresses', '100% Anonymous'],
      stats: [{ v: '∞', l: 'Inboxes' }, { v: '0', l: 'Trace Back' }, { v: 'Auto', l: 'Expiry' }],
      gradient: 'from-amber-500 to-orange-600',
      glow: 'rgba(245,158,11,0.3)',
      iconItems: [Inbox, Eye, Clock, Mail],
    },
  ];

  return (
    <section id="security" className="py-24 px-6 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0f0a1e 0%, #1a0f2e 40%, #0d1a2e 100%)' }}>
      {/* Background glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-10 pointer-events-none" style={{ background: 'radial-gradient(circle, #8b5cf6, transparent)' }} />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl opacity-10 pointer-events-none" style={{ background: 'radial-gradient(circle, #6366f1, transparent)' }} />

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-4 border" style={{ background: 'rgba(139,92,246,0.15)', borderColor: 'rgba(139,92,246,0.3)', color: '#c4b5fd' }}>
            <Shield className="w-4 h-4" />
            Protection & Intelligence
          </span>
          <h2 className="text-3xl md:text-5xl font-black mb-4 text-white">
            Protect Your Campaigns,
            <br />
            <span style={{ background: 'linear-gradient(135deg, #c4b5fd, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Monitor Every Asset</span>
          </h2>
          <p className="text-white/50 text-lg max-w-2xl mx-auto">
            Real-time fraud detection, domain health monitoring, and anonymous competitor research — all in one platform.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {tools.map((tool, i) => (
            <motion.div
              key={tool.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -6 }}
              className="relative rounded-3xl p-8 border transition-all overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)' }}
            >
              {/* Glow */}
              <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full blur-3xl opacity-20 pointer-events-none" style={{ background: `radial-gradient(circle, ${tool.glow}, transparent)` }} />

              <div className="flex items-center justify-between mb-6">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br ${tool.gradient}`}>
                  <tool.icon className="w-7 h-7 text-white" />
                </div>
                {tool.badge && (
                  <span className="flex items-center gap-1.5 px-2.5 py-1 bg-green-500/20 text-green-400 text-xs font-bold rounded-full border border-green-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />Live
                  </span>
                )}
              </div>

              <h3 className="text-xl font-black text-white mb-2">{tool.title}</h3>
              <p className="text-white/50 text-sm leading-relaxed mb-5">{tool.desc}</p>

              <div className="space-y-2.5 mb-6">
                {tool.features.map((f, fi) => {
                  const Icon = tool.iconItems[fi];
                  return (
                    <div key={f} className="flex items-center gap-2.5">
                      <Icon className="w-3.5 h-3.5 text-white/40 shrink-0" />
                      <span className="text-sm text-white/70">{f}</span>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center gap-4 pt-5 border-t" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                {tool.stats.map(s => (
                  <div key={s.l} className="text-center">
                    <div className="text-lg font-black text-white">{s.v}</div>
                    <div className="text-[10px] text-white/40">{s.l}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="text-center mt-12"
        >
          <motion.button
            onClick={onGetStarted}
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            className="px-8 py-4 text-white rounded-2xl font-bold shadow-lg flex items-center gap-2 mx-auto transition-all"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #f97316)', boxShadow: '0 4px 24px rgba(245,158,11,0.4)' }}
          >
            Protect Your Campaigns
            <ArrowRight className="w-5 h-5" />
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}

function LightSocialProofSection() {
  const [counters, setCounters] = useState({ campaigns: 0, keywords: 0, savings: 0 });

  useEffect(() => {
    const targets = { campaigns: 50000, keywords: 2000000, savings: 95 };
    const steps = 60;
    const duration = 2000;
    const interval = setInterval(() => {
      setCounters(prev => ({
        campaigns: Math.min(prev.campaigns + Math.ceil(targets.campaigns / steps), targets.campaigns),
        keywords: Math.min(prev.keywords + Math.ceil(targets.keywords / steps), targets.keywords),
        savings: Math.min(prev.savings + targets.savings / steps, targets.savings),
      }));
    }, duration / steps);
    return () => clearInterval(interval);
  }, []);

  const testimonials = [
    { quote: "Cut our campaign setup time from weeks to minutes. The keyword tools alone saved us hundreds of hours.", author: "Sarah Chen", role: "Marketing Director", company: "TechCorp", rating: 5, initials: 'SC', color: 'from-violet-500 to-indigo-600' },
    { quote: "Click Guard caught fraudulent clicks we never knew about. We're saving 30% on ad spend now.", author: "Michael Rodriguez", role: "PPC Manager", company: "Growth Agency", rating: 5, initials: 'MR', color: 'from-rose-500 to-pink-600' },
    { quote: "13 campaign structures, 1,600+ keywords per build, all extensions included. This is the real deal.", author: "Emily Johnson", role: "Founder", company: "LocalBiz Pro", rating: 5, initials: 'EJ', color: 'from-amber-500 to-orange-600' },
  ];

  const stats = [
    { value: counters.campaigns.toLocaleString(), label: 'Campaigns Built', suffix: '+', icon: Rocket, color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-100' },
    { value: counters.keywords.toLocaleString(), label: 'Keywords Generated', suffix: '+', icon: Search, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100' },
    { value: Math.round(counters.savings).toString(), label: 'Time Saved vs Manual', suffix: '%', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
  ];

  return (
    <section className="py-24 px-6 bg-white">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <div className="flex items-center justify-center gap-1 mb-3">
            {[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />)}
            <span className="ml-2 text-sm font-semibold text-gray-600">5.0 from 200+ reviews</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-4">
            Trusted by <span className="text-violet-600">Marketers Worldwide</span>
          </h2>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">Join thousands of PPC pros, agencies, and freelancers building smarter campaigns.</p>
        </motion.div>

        {/* Stats row */}
        <div className="grid md:grid-cols-3 gap-5 mb-14">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`flex items-center gap-5 p-6 rounded-3xl border ${stat.border} ${stat.bg}`}
            >
              <div className={`w-14 h-14 rounded-2xl bg-white shadow-sm border ${stat.border} flex items-center justify-center shrink-0`}>
                <stat.icon className={`w-7 h-7 ${stat.color}`} />
              </div>
              <div>
                <div className={`text-3xl font-black ${stat.color} leading-none`}>{stat.value}{stat.suffix}</div>
                <div className="text-sm text-gray-500 font-medium mt-1">{stat.label}</div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Testimonials */}
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -4 }}
              className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm hover:shadow-lg hover:border-violet-200 transition-all"
            >
              <div className="flex gap-1 mb-5">
                {[...Array(t.rating)].map((_, j) => (
                  <Star key={j} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                ))}
              </div>
              <p className="text-gray-700 mb-7 leading-relaxed text-sm font-medium">"{t.quote}"</p>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm bg-gradient-to-br ${t.color} shrink-0`}>
                  {t.initials}
                </div>
                <div>
                  <div className="text-gray-900 font-bold text-sm">{t.author}</div>
                  <div className="text-gray-400 text-xs">{t.role} · {t.company}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function LightPricingSection({ onSelectPlan }: { onSelectPlan?: (planName: string, priceId: string, amount: number, isSubscription: boolean) => void }) {
  const [isAnnual, setIsAnnual] = useState(false);

  const starterFeatures = ['10 campaigns per month', 'Campaign Builder 3.0', 'Keyword Planner', 'Keyword Mixer', '10+ ad extension types', 'CSV export to Google Ads Editor', 'Domain Monitor (5 Domains)', 'Click Guard (1 Domain)', 'Community Forum', 'Email support'];
  const proFeatures = ['50 campaigns per month', 'Campaign Builder 3.0', 'Keyword Planner', 'Keyword Mixer', 'Long Tail Generator', 'Negative Keywords', '10+ ad extension types', 'CSV export to Google Ads Editor', 'Click Guard', 'Domain Monitor', 'Proxy Mail', 'Community Forum', 'Email support'];
  const agencyFeatures = ['Unlimited campaigns', 'Campaign Builder 3.0', 'Keyword Planner', 'Keyword Mixer', 'Long Tail Generator', 'Negative Keywords', '10+ ad extension types', 'CSV export to Google Ads Editor', 'Click Guard – unlimited domains', 'Domain Monitor', 'Proxy Mail', 'Email Forwarding', 'Preset Campaigns', 'Community Forum', 'Email support', 'Dedicated account manager'];

  const plans = isAnnual ? [
    { name: 'Starter', price: '$23.99', originalPrice: '$29.99', period: '/mo billed annually', features: starterFeatures, popular: false, priceId: 'price_1T6SDuAYv17Z995Vind8Ze6S', amount: 28788 },
    { name: 'Professional', price: '$79', originalPrice: '$99', period: '/mo billed annually', features: proFeatures, popular: true, priceId: 'price_1T6SHkAYv17Z995VkD5WcTc7', amount: 94800 },
    { name: 'Agency', price: '$119', originalPrice: '$149', period: '/mo billed annually', features: agencyFeatures, popular: false, priceId: 'price_1T6SKQAYv17Z995VKvkd6lbN', amount: 142800 },
  ] : [
    { name: 'Starter', price: '$29.99', originalPrice: null, period: '/month', features: starterFeatures, popular: false, priceId: 'price_1T6SDuAYv17Z995Vind8Ze6S', amount: 2999 },
    { name: 'Professional', price: '$99', originalPrice: null, period: '/month', features: proFeatures, popular: true, priceId: 'price_1T6SHkAYv17Z995VkD5WcTc7', amount: 9900 },
    { name: 'Agency', price: '$149', originalPrice: null, period: '/month', features: agencyFeatures, popular: false, priceId: 'price_1T6SKQAYv17Z995VKvkd6lbN', amount: 14900 },
  ];

  return (
    <section id="pricing" className="py-24 px-6 bg-white">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-violet-100 text-violet-700 rounded-full text-sm font-medium mb-4 border border-violet-200">
            <Zap className="w-4 h-4" />
            Simple Pricing
          </span>
          <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-4">
            Choose Your <span className="text-violet-600">Plan</span>
          </h2>
          <p className="text-gray-500 text-lg max-w-xl mx-auto mb-8">
            Start with a 7-day free trial. Upgrade or cancel anytime.
          </p>

          <div className="flex items-center justify-center gap-4 mb-8">
            <span className={`text-sm font-medium ${!isAnnual ? 'text-gray-900' : 'text-gray-400'}`}>Monthly</span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className={`relative w-14 h-7 rounded-full transition-colors ${isAnnual ? 'bg-violet-600' : 'bg-gray-300'}`}
            >
              <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${isAnnual ? 'translate-x-7' : 'translate-x-0.5'}`} />
            </button>
            <span className={`text-sm font-medium ${isAnnual ? 'text-gray-900' : 'text-gray-400'}`}>
              Annual <span className="text-green-600 text-xs font-bold ml-1">Save 20%</span>
            </span>
          </div>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -6 }}
              className={`relative rounded-3xl p-8 border-2 transition-all ${
                plan.popular
                  ? 'border-violet-400 shadow-2xl shadow-violet-100'
                  : 'bg-white border-gray-200 hover:border-violet-200 hover:shadow-md shadow-sm'
              }`}
              style={plan.popular ? { background: 'linear-gradient(145deg, #fefeff 0%, #f5f3ff 100%)' } : {}}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-5 py-1.5 text-white text-xs font-black rounded-full shadow-lg whitespace-nowrap" style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}>
                  ✦ Most Popular
                </div>
              )}

              <div className="mb-4">
                <h3 className={`text-xl font-black mb-0.5 ${plan.popular ? 'text-violet-700' : 'text-gray-900'}`}>{plan.name}</h3>
                {plan.popular && <p className="text-xs text-violet-500 font-medium">Best for growing teams</p>}
              </div>

              <div className="flex items-baseline gap-1 mb-1">
                <span className={`text-4xl font-black ${plan.popular ? 'text-violet-700' : 'text-gray-900'}`}>{plan.price}</span>
                <span className="text-gray-400 text-sm">{plan.period}</span>
              </div>
              {plan.originalPrice && (
                <div className="text-sm text-gray-400 line-through mb-4">{plan.originalPrice}/mo</div>
              )}
              {!plan.originalPrice && <div className="mb-4" />}

              <button
                onClick={() => onSelectPlan?.(plan.name, plan.priceId, plan.amount, true)}
                className={`w-full py-3.5 rounded-xl font-bold text-sm mb-6 transition-all ${
                  plan.popular ? 'text-white' : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
                style={plan.popular ? { background: 'linear-gradient(135deg, #f59e0b, #f97316)', boxShadow: '0 4px 16px rgba(245,158,11,0.4)' } : {}}
              >
                Start Free Trial
              </button>

              <ul className="space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5">
                    <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${plan.popular ? 'text-violet-500' : 'text-violet-400'}`} />
                    <span className="text-sm text-gray-600">{feature}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-10 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-400"
        >
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-500" />
            <span>7-day free trial</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-500" />
            <span>14-day money-back guarantee</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-500" />
            <span>Cancel anytime</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function LightFinalCTA({ onGetStarted }: { onGetStarted?: () => void }) {
  return (
    <section className="py-24 px-6 bg-gray-50">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative rounded-3xl p-12 md:p-20 text-center overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #1e1040 0%, #2d1b69 40%, #1a0d3d 100%)' }}
        >
          {/* Decorative glows */}
          <div className="absolute top-0 left-1/4 w-80 h-80 rounded-full blur-3xl opacity-20 pointer-events-none" style={{ background: 'radial-gradient(circle, #8b5cf6, transparent)' }} />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full blur-3xl opacity-20 pointer-events-none" style={{ background: 'radial-gradient(circle, #6366f1, transparent)' }} />
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl opacity-15 pointer-events-none" style={{ background: 'radial-gradient(circle, #f59e0b, transparent)' }} />

          {/* Dot grid overlay */}
          <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

          <div className="relative z-10">
            {/* Stars */}
            <div className="flex items-center justify-center gap-1 mb-6">
              {[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />)}
              <span className="ml-2 text-white/60 text-sm font-medium">Loved by 5,000+ marketers</span>
            </div>

            <h2 className="text-3xl md:text-5xl font-black mb-6 text-white leading-tight">
              Ready to Build Better
              <br />
              <span style={{ background: 'linear-gradient(135deg, #fbbf24, #f97316)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Google Ads Campaigns?</span>
            </h2>
            <p className="text-lg text-white/60 mb-10 max-w-2xl mx-auto leading-relaxed">
              Join thousands of PPC pros, agencies, and freelancers using Adiology to build campaigns faster, protect their clicks, and maximize ROI.
            </p>

            {/* Outcome pills */}
            <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
              {['Campaign in minutes', '1,600+ keywords/build', 'Click fraud blocked', 'All domains monitored'].map(pill => (
                <span key={pill} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-white/80 border border-white/15" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <Check className="w-3 h-3 text-green-400" />{pill}
                </span>
              ))}
            </div>

            <motion.button
              onClick={onGetStarted}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-12 py-5 text-white rounded-2xl font-black text-lg shadow-2xl transition-all inline-flex items-center gap-3"
              style={{ background: 'linear-gradient(135deg, #f59e0b, #f97316)', boxShadow: '0 8px 40px rgba(245,158,11,0.5)' }}
            >
              Get Started Free
              <ArrowRight className="w-5 h-5" />
            </motion.button>

            <div className="mt-7 flex flex-wrap items-center justify-center gap-6 text-white/40 text-sm">
              <div className="flex items-center gap-2"><Check className="w-4 h-4 text-white/50" />No credit card required</div>
              <div className="flex items-center gap-2"><Check className="w-4 h-4 text-white/50" />7-day free trial</div>
              <div className="flex items-center gap-2"><Check className="w-4 h-4 text-white/50" />14-day money back</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function LightFooter({ onNavigateToPolicy, onNavigateToApp, onNavigateToPage }: { onNavigateToPolicy?: (policy: string) => void; onNavigateToApp?: (tab: string) => void; onNavigateToPage?: (page: string) => void }) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-400 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-12">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-violet-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">A</span>
              </div>
              <span className="text-xl font-bold text-white">adiology</span>
            </div>
            <p className="text-gray-500 mb-6 max-w-xs text-sm leading-relaxed">
              The all-in-one platform for building, managing, and protecting Google Ads campaigns at scale.
            </p>
            <div className="space-y-3 text-sm">
              <a href="mailto:support@adiology.io" className="flex items-center gap-3 hover:text-white transition-colors">
                <Mail className="w-4 h-4" />
                support@adiology.io
              </a>
            </div>
            <div className="flex gap-3 mt-6">
              {[Twitter, Linkedin, Youtube].map((Icon, i) => (
                <a key={i} href="#" className="w-9 h-9 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 hover:text-white transition-all">
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4 text-sm">Product</h4>
            <ul className="space-y-3 text-sm">
              {[
                { label: 'Campaign Builder', page: '/features/campaign-builder' },
                { label: 'Keyword Planner', page: '/features/campaign-builder' },
                { label: 'Keyword Mixer', page: '/features/campaign-builder' },
                { label: 'Negative Keywords', page: '/features/campaign-builder' },
                { label: 'Long Tail Generator', page: '/features/campaign-builder' },
              ].map(link => (
                <li key={link.label}>
                  <a href={link.page} onClick={(e) => { e.preventDefault(); onNavigateToPage?.(link.page); }} className="hover:text-white transition-colors">{link.label}</a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4 text-sm">More</h4>
            <ul className="space-y-3 text-sm">
              {[
                { label: 'Click Guard', page: '/features/click-guard' },
                { label: 'Domain Monitor', page: '/features/domain-monitor' },
                { label: 'Proxy Mail', page: '/features/proxy-mail' },
                { label: 'Preset Campaigns', page: '/features/campaign-builder' },
              ].map(link => (
                <li key={link.label}>
                  <a href={link.page} onClick={(e) => { e.preventDefault(); onNavigateToPage?.(link.page); }} className="hover:text-white transition-colors">{link.label}</a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4 text-sm">Legal</h4>
            <ul className="space-y-3 text-sm">
              {[
                { label: 'Privacy Policy', action: 'privacy' },
                { label: 'Terms of Service', action: 'terms' },
                { label: 'Refund Policy', action: 'refund' },
              ].map(link => (
                <li key={link.label}>
                  <button onClick={() => onNavigateToPolicy?.(link.action)} className="hover:text-white transition-colors">{link.label}</button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4 text-sm">Support</h4>
            <ul className="space-y-3 text-sm">
              {[
                { label: 'Help Center', page: '/help' },
                { label: 'Community', page: '/community' },
                { label: 'Contact Us', page: '/contact' },
                { label: 'Blog', page: '/blog' },
              ].map(link => (
                <li key={link.label}>
                  <a href={link.page} onClick={(e) => { e.preventDefault(); onNavigateToPage?.(link.page); }} className="hover:text-white transition-colors">{link.label}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-600">© {currentYear} Adiology. All rights reserved.</p>
          <p className="text-sm text-gray-600">Built for Google Ads professionals.</p>
        </div>
      </div>
    </footer>
  );
}
