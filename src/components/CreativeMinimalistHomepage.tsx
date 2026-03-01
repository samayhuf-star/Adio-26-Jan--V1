import { Helmet } from 'react-helmet-async';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { 
  ArrowRight, Zap, Layers, Sparkles, Check, Mail, MapPin, Phone, 
  Twitter, Linkedin, Youtube, TrendingUp, Target, Shield, Smartphone, 
  Users, Search, Calendar, Filter, Rocket, Globe, Hash, BarChart3, 
  FileText, MousePointerClick, Eye, Lock, Clock, Brain, Cpu, 
  ShieldCheck, Activity, MailOpen, Inbox, ChevronRight, Star,
  MessageSquare, BookOpen, Headphones, Menu, X
} from 'lucide-react';

interface CreativeMinimalistHomepageProps {
  onGetStarted?: () => void;
  onLogin?: () => void;
  onSelectPlan?: (planName: string, priceId: string, amount: number, isSubscription: boolean) => void;
  onNavigateToPolicy?: (policy: string) => void;
  onNavigateToApp?: (tab: string) => void;
  onNavigateToPage?: (page: string) => void;
}

export default function CreativeMinimalistHomepage({ 
  onGetStarted, 
  onLogin, 
  onSelectPlan,
  onNavigateToPolicy,
  onNavigateToApp,
  onNavigateToPage
}: CreativeMinimalistHomepageProps) {
  return (
    <>
      <Helmet>
        <title>Google Ads Campaign Builder — Build Campaigns in 2 Min | Adiology</title>
        <meta name="description" content="Build Google Ads campaigns in 2 minutes, not 30. SKAG, STAG, Alpha-Beta & 9 more structures. AI-powered keyword gen + click fraud protection. Free plan available." />
        <link rel="canonical" href="https://adiology.io/" />
        <meta property="og:title" content="Google Ads Campaign Builder — Build Campaigns in 2 Min | Adiology" />
        <meta property="og:description" content="Build Google Ads campaigns in 2 minutes, not 30. 12 campaign structures. AI-powered keyword gen + click fraud protection." />
        <meta property="og:url" content="https://adiology.io/" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Adiology" />
        <meta property="og:image" content="https://adiology.io/og-image.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Google Ads Campaign Builder — Build Campaigns in 2 Min | Adiology" />
        <meta name="twitter:description" content="Build Google Ads campaigns in 2 minutes, not 30. 12 campaign structures. AI-powered." />
        <meta name="twitter:image" content="https://adiology.io/og-image.png" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          "name": "Adiology",
          "url": "https://adiology.io",
          "applicationCategory": "BusinessApplication",
          "operatingSystem": "Web",
          "description": "AI-Powered Google Ads Campaign Builder — build campaigns in 2 minutes with 12 campaign structures",
          "offers": [
            {"@type": "Offer", "name": "Free", "price": "0", "priceCurrency": "USD"},
            {"@type": "Offer", "name": "Solo", "price": "29", "priceCurrency": "USD"},
            {"@type": "Offer", "name": "Growth", "price": "79", "priceCurrency": "USD"},
            {"@type": "Offer", "name": "Scale", "price": "199", "priceCurrency": "USD"},
            {"@type": "Offer", "name": "Lifetime Deal", "price": "99", "priceCurrency": "USD"}
          ],
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.8",
            "ratingCount": "50"
          }
        })}</script>
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "Adiology",
          "url": "https://adiology.io",
          "logo": "https://adiology.io/og-image.png",
          "description": "AI-Powered Google Ads Campaign Builder & Management Platform"
        })}</script>
      </Helmet>
      <div id="main-content" className="min-h-screen bg-gradient-to-b from-slate-950 via-purple-950 to-slate-950 text-white overflow-hidden">
        <Navigation onGetStarted={onGetStarted} onLogin={onLogin} onNavigateToPage={onNavigateToPage} />
        <HeroSection onGetStarted={onGetStarted} onNavigateToPage={onNavigateToPage} />
        <LifetimeDealBanner onNavigateToPage={onNavigateToPage} />
        <PlatformFeaturesSection onGetStarted={onGetStarted} />
        <CampaignBuilderSection onGetStarted={onGetStarted} />
        <KeywordSuiteSection onGetStarted={onGetStarted} />
        <SecurityToolsSection onGetStarted={onGetStarted} />
        <AIFeaturesSection onGetStarted={onGetStarted} />
        <SocialProofSection />
        <PricingSection onSelectPlan={onSelectPlan} />
        <FinalCTA onGetStarted={onGetStarted} />
        <Footer onNavigateToPolicy={onNavigateToPolicy} onNavigateToApp={onNavigateToApp} onNavigateToPage={onNavigateToPage} />
      </div>
    </>
  );
}

function LifetimeDealBanner({ onNavigateToPage }: { onNavigateToPage?: (page: string) => void }) {
  const [timeLeft, setTimeLeft] = useState({ days: 3, hours: 14, minutes: 27, seconds: 42 });

  useEffect(() => {
    const stored = sessionStorage.getItem('lifetime_deal_end');
    let endTime: number;
    if (stored) {
      endTime = parseInt(stored);
    } else {
      endTime = Date.now() + 3 * 24 * 60 * 60 * 1000 + 14 * 60 * 60 * 1000;
      sessionStorage.setItem('lifetime_deal_end', endTime.toString());
    }

    const tick = () => {
      const diff = Math.max(0, endTime - Date.now());
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative px-4 sm:px-6 py-8 max-w-5xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        onClick={() => onNavigateToPage?.('/lifetime-deal')}
        className="relative cursor-pointer group overflow-hidden rounded-2xl border border-amber-500/30 hover:border-amber-400/60 transition-all duration-500"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-amber-950/80 via-orange-950/60 to-purple-950/80" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(251,191,36,0.15),transparent_60%)]" />
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-amber-400/20 to-transparent rounded-bl-full" />

        <div className="absolute top-3 left-3 z-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-500/90 text-white text-xs font-bold rounded-full uppercase tracking-wider animate-pulse">
            <Zap className="w-3 h-3" />
            Limited Time
          </span>
        </div>

        <div className="relative z-10 px-6 pt-12 pb-6 sm:px-8 sm:pt-10 sm:pb-8 flex flex-col sm:flex-row items-center gap-6">
          <div className="flex-1 text-center sm:text-left">
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
              Lifetime Access — <span className="text-amber-400">Just $99</span>
            </h3>
            <p className="text-white/60 text-sm mb-4 max-w-md">
              One payment. All features. Forever. No monthly fees, no limits. Lock in your lifetime deal before it's gone.
            </p>

            <div className="flex items-center justify-center sm:justify-start gap-3 mb-4">
              {[
                { val: timeLeft.days, label: 'Days' },
                { val: timeLeft.hours, label: 'Hrs' },
                { val: timeLeft.minutes, label: 'Min' },
                { val: timeLeft.seconds, label: 'Sec' },
              ].map((t) => (
                <div key={t.label} className="text-center">
                  <div className="w-12 h-12 rounded-lg bg-white/10 backdrop-blur-sm border border-white/10 flex items-center justify-center text-lg font-bold text-amber-400 tabular-nums">
                    {String(t.val).padStart(2, '0')}
                  </div>
                  <span className="text-[10px] text-white/40 mt-1 block uppercase">{t.label}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-4 text-xs text-white/50 justify-center sm:justify-start">
              <span className="flex items-center gap-1"><Check className="w-3 h-3 text-green-400" /> All 15 Structures</span>
              <span className="flex items-center gap-1"><Check className="w-3 h-3 text-green-400" /> Unlimited Campaigns</span>
              <span className="flex items-center gap-1"><Check className="w-3 h-3 text-green-400" /> Priority Support</span>
            </div>
          </div>

          <div className="flex-shrink-0">
            <div className="relative">
              <div className="text-center mb-2">
                <span className="text-white/40 text-sm line-through">$588/year</span>
              </div>
              <div className="w-28 h-28 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex flex-col items-center justify-center shadow-lg shadow-amber-500/30 group-hover:shadow-amber-500/50 group-hover:scale-105 transition-all duration-300">
                <span className="text-black/60 text-xs font-semibold">ONLY</span>
                <span className="text-black text-3xl font-black leading-none">$99</span>
                <span className="text-black/60 text-[10px] font-semibold">ONE TIME</span>
              </div>
              <div className="text-center mt-2">
                <span className="inline-flex items-center gap-1 text-amber-400 text-xs font-semibold group-hover:gap-2 transition-all">
                  Claim Now <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function Navigation({ onGetStarted, onLogin, onNavigateToPage }: { onGetStarted?: () => void; onLogin?: () => void; onNavigateToPage?: (page: string) => void }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled ? 'bg-slate-950/95 backdrop-blur-xl shadow-sm border-b border-white/10' : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-200">
              <span className="text-white font-black text-xl">A</span>
            </div>
            <span className={`font-bold text-xl transition-colors duration-300 ${isScrolled ? 'text-white' : 'text-white'}`}>adiology</span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <button onClick={() => onNavigateToPage?.('/features/campaign-builder')} className={`text-sm font-medium transition-colors ${isScrolled ? 'text-gray-300 hover:text-violet-400' : 'text-indigo-200 hover:text-white'}`}>Campaign Builder</button>
            <button onClick={() => onNavigateToPage?.('/features/click-guard')} className={`text-sm font-medium transition-colors ${isScrolled ? 'text-gray-300 hover:text-violet-400' : 'text-indigo-200 hover:text-white'}`}>Click Guard</button>
            <button onClick={() => onNavigateToPage?.('/features/proxy-mail')} className={`text-sm font-medium transition-colors ${isScrolled ? 'text-gray-300 hover:text-violet-400' : 'text-indigo-200 hover:text-white'}`}>Proxy Mail</button>
            <button onClick={() => onNavigateToPage?.('/features/domain-monitor')} className={`text-sm font-medium transition-colors ${isScrolled ? 'text-gray-300 hover:text-violet-400' : 'text-indigo-200 hover:text-white'}`}>Domain Monitor</button>
            <button onClick={() => onNavigateToPage?.('/pricing')} className={`text-sm font-medium transition-colors ${isScrolled ? 'text-gray-300 hover:text-violet-400' : 'text-indigo-200 hover:text-white'}`}>Pricing</button>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={onLogin}
              className={`px-5 py-2.5 text-sm font-semibold rounded-xl border transition-all hover:scale-105 ${isScrolled ? 'border-white/20 text-white hover:bg-white/10' : 'border-indigo-400/40 text-indigo-200 hover:bg-white/10'}`}
            >
              Sign In
            </button>
            <button 
              onClick={onGetStarted}
              className="px-6 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl text-sm font-semibold shadow-lg shadow-violet-200/50 hover:shadow-xl hover:shadow-violet-300/50 transition-all hover:scale-105"
            >
              Get Started Free
            </button>
          </div>

          <button className={`md:hidden p-2 ${isScrolled ? 'text-white' : 'text-white'}`} onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {mobileOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }} 
            animate={{ opacity: 1, height: 'auto' }}
            className={`md:hidden mt-4 pb-4 space-y-3 ${isScrolled ? 'bg-slate-950/95 backdrop-blur-xl rounded-xl p-4 -mx-2' : 'bg-indigo-950/80 backdrop-blur-xl rounded-xl p-4 -mx-2'}`}
          >
            <button onClick={() => { setMobileOpen(false); onNavigateToPage?.('/features/campaign-builder'); }} className={`block text-sm font-medium py-2 ${isScrolled ? 'text-gray-300' : 'text-indigo-200'}`}>Campaign Builder</button>
            <button onClick={() => { setMobileOpen(false); onNavigateToPage?.('/features/click-guard'); }} className={`block text-sm font-medium py-2 ${isScrolled ? 'text-gray-300' : 'text-indigo-200'}`}>Click Guard</button>
            <button onClick={() => { setMobileOpen(false); onNavigateToPage?.('/features/proxy-mail'); }} className={`block text-sm font-medium py-2 ${isScrolled ? 'text-gray-300' : 'text-indigo-200'}`}>Proxy Mail</button>
            <button onClick={() => { setMobileOpen(false); onNavigateToPage?.('/features/domain-monitor'); }} className={`block text-sm font-medium py-2 ${isScrolled ? 'text-gray-300' : 'text-indigo-200'}`}>Domain Monitor</button>
            <button onClick={() => { setMobileOpen(false); onNavigateToPage?.('/pricing'); }} className={`block text-sm font-medium py-2 ${isScrolled ? 'text-gray-300' : 'text-indigo-200'}`}>Pricing</button>
            <button onClick={() => { setMobileOpen(false); onLogin?.(); }} className="w-full px-6 py-3 border border-white/20 text-white rounded-xl text-sm font-semibold hover:bg-white/10 transition-colors">
              Sign In
            </button>
            <button onClick={onGetStarted} className="w-full px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl text-sm font-semibold">
              Get Started Free
            </button>
          </motion.div>
        )}
      </div>
    </nav>
  );
}

function HeroSection({ onGetStarted, onNavigateToPage }: { onGetStarted?: () => void; onNavigateToPage?: (page: string) => void }) {
  const heroFeatures = [
    {
      icon: Rocket,
      title: 'Campaign Builder',
      desc: 'Campaigns + extensions + 25K ZIPs',
      gradient: 'from-violet-500 to-indigo-600',
      iconColor: 'text-violet-400',
    },
    {
      icon: Layers,
      title: '13 Campaigns Structures',
      desc: 'Pro-built, plug & play',
      gradient: 'from-indigo-500 to-blue-600',
      iconColor: 'text-indigo-400',
    },
    {
      icon: Search,
      title: 'Keyword Intelligence',
      desc: 'Planner, Mixer, Negatives & Long Tail',
      gradient: 'from-blue-500 to-cyan-500',
      iconColor: 'text-blue-400',
    },
    {
      icon: ShieldCheck,
      title: 'Click Guard',
      desc: 'Block fraud, bots & VPNs',
      gradient: 'from-amber-500 to-orange-600',
      iconColor: 'text-amber-400',
    },
    {
      icon: MailOpen,
      title: 'Proxy Mail',
      desc: 'Anonymous competitor research',
      gradient: 'from-pink-500 to-rose-600',
      iconColor: 'text-pink-400',
    },
    {
      icon: Globe,
      title: 'Domain Monitor',
      desc: 'Track domains, SSL & DNS',
      gradient: 'from-purple-500 to-violet-600',
      iconColor: 'text-purple-400',
    },
  ];

  return (
    <section className="relative overflow-hidden">
      <div className="relative pt-32 md:pt-40 pb-12 px-6">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        <div className="max-w-7xl mx-auto w-full relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <motion.h1
              className="text-4xl md:text-5xl lg:text-6xl font-black leading-tight mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <span className="text-white">Search Ads Intelligence</span>
              <br />
              <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
                What the Top 1% Know That You Don't !
              </span>
            </motion.h1>

            <motion.p
              className="text-lg md:text-xl text-indigo-200/80 mb-10 max-w-2xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Launch faster. Research deeper. Protect smarter. Monitor everything. 
              Win consistently — all inside Adiology.
            </motion.p>

            <motion.div
              className="flex flex-wrap justify-center gap-4 mb-10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <motion.button
                onClick={() => onNavigateToPage?.('/demo')}
                className="px-8 py-4 bg-white/10 border-2 border-white/20 text-white rounded-2xl font-semibold text-lg hover:bg-white/15 hover:border-violet-400/40 backdrop-blur-sm transition-all"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
              >
                See It In Action
              </motion.button>
            </motion.div>

            <motion.div
              className="flex flex-wrap justify-center items-center gap-4 mb-10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <a href="https://microlaunch.net/p/adiology?utm_source=badge-winner-microlaunch&utm_medium=badge" target="_blank" rel="noopener noreferrer">
                <img src="https://wild-dust-0517.microlaunch.workers.dev/microlaunch-challenger-badges/ml_challenger_v5.svg" alt="Microlaunch Challenger Badge" width="200" height="63" style={{ width: '200px', height: '63px' }} />
              </a>
              <a href="https://microlaunch.net/p/adiology?utm_source=badge-winner-microlaunch&utm_medium=badge" target="_blank" rel="noopener noreferrer">
                <img src="https://wild-dust-0517.microlaunch.workers.dev/badges/potd/ml_potd_badge_v4.svg" alt="Microlaunch Product of the Day Badge" width="200" height="63" style={{ width: '200px', height: '63px' }} />
              </a>
            </motion.div>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 max-w-3xl mx-auto mt-10">
              {heroFeatures.map((feature, i) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.4 + i * 0.06 }}
                  whileHover={{ y: -4, scale: 1.03 }}
                  className="group relative rounded-xl p-3 border border-white/10 hover:border-white/20 transition-all duration-300 cursor-default overflow-hidden"
                  style={{ background: 'rgba(255,255,255,0.05)' }}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-[0.08] group-hover:opacity-[0.15] transition-opacity duration-300`} />
                  <div className="relative flex items-center gap-2.5">
                    <div className={`shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br ${feature.gradient} flex items-center justify-center shadow-lg`}>
                      <feature.icon className="w-4 h-4 text-white" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-white text-[13px] leading-tight">
                        {feature.title}
                      </h3>
                      <p className="text-[10px] text-gray-400 leading-snug mt-0.5">
                        {feature.desc}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TrustedBySection() {
  const stats = [
    { value: '12', label: 'Campaign Structures' },
    { value: '1,600+', label: 'Keywords per Build' },
    { value: '10+', label: 'Ad Extension Types' },
    { value: '30K', label: 'ZIP Code Targeting' },
  ];

  return (
    <section className="py-12 px-6 border-y border-white/5">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center"
            >
              <div className="text-3xl md:text-4xl font-black text-violet-400 mb-1">{stat.value}</div>
              <div className="text-sm text-gray-400 font-medium">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PlatformFeaturesSection({ onGetStarted }: { onGetStarted?: () => void }) {
  const features = [
    {
      icon: Target,
      title: 'Campaign Builder 3.0',
      description: 'Build complete Google Ads campaigns with our 7-step wizard. Choose from 12 structures including SKAG, STAG, Intent-Based, and Geo-Targeted.',
      gradient: 'from-violet-500 to-indigo-500',
      bg: 'bg-violet-500/10',
    },
    {
      icon: Hash,
      title: 'Keyword Research Suite',
      description: 'Planner, Mixer, Long Tail & Negative keyword tools. Generate 1,600+ keywords with match types, CPC data, and competition metrics.',
      gradient: 'from-blue-500 to-cyan-500',
      bg: 'bg-blue-500/10',
    },
    {
      icon: ShieldCheck,
      title: 'Click Guard Protection',
      badge: 'Live',
      description: 'Detect and block click fraud in real-time. Bot detection, IP blocking, VPN detection, and detailed traffic analytics for every domain.',
      gradient: 'from-red-500 to-rose-500',
      bg: 'bg-red-500/10',
    },
    {
      icon: Globe,
      title: 'Domain Monitor',
      description: 'Track domain expiry dates, SSL certificates, and DNS records. Get alerts before your domains expire so you never lose a property.',
      gradient: 'from-green-500 to-emerald-500',
      bg: 'bg-green-500/10',
    },
    {
      icon: Brain,
      title: 'AI Ad Generator',
      description: 'AI creates high-quality RSA, DKI, and Call-Only ads with all 10+ extension types. Maximize your Ad Rank from day one.',
      gradient: 'from-purple-500 to-pink-500',
      bg: 'bg-purple-500/10',
    },
    {
      icon: MailOpen,
      title: 'Proxy Mail',
      description: 'Anonymous email generator for competitive research. Subscribe to competitors, study their campaigns, stay invisible.',
      gradient: 'from-amber-500 to-orange-500',
      bg: 'bg-amber-500/10',
    },
    {
      icon: FileText,
      title: 'Preset Campaigns',
      description: 'Ready-made campaign templates for every industry. Launch optimized campaigns for plumbers, lawyers, dentists & more.',
      gradient: 'from-orange-500 to-red-500',
      bg: 'bg-orange-500/10',
    },
    {
      icon: MessageSquare,
      title: 'Community & Support',
      description: 'Community forum for discussions, plus a support ticket system for direct help from our team.',
      gradient: 'from-indigo-500 to-blue-500',
      bg: 'bg-indigo-500/10',
    },
  ];

  return (
    <section id="features" className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-violet-500/10 text-violet-400 rounded-full text-sm font-medium mb-4 border border-violet-500/20">
            <Layers className="w-4 h-4" />
            Complete Platform
          </span>
          <h2 className="text-3xl md:text-5xl font-black mb-4 text-white">
            Everything You Need to
            <br />
            <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
              Dominate Google Ads
            </span>
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            From campaign creation to click fraud protection, all in one platform.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ y: -6 }}
              className="group bg-white/5 rounded-2xl p-6 border border-white/10 hover:border-violet-500/30 hover:shadow-xl hover:shadow-violet-900/20 transition-all duration-300 cursor-pointer"
            >
              <div className={`w-14 h-14 ${feature.bg} rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                <feature.icon className="w-7 h-7 text-violet-600" />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-bold text-white">{feature.title}</h3>
                {(feature as any).badge && (
                  <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 text-[9px] font-bold rounded-full uppercase tracking-wide">{(feature as any).badge}</span>
                )}
              </div>
              <p className="text-sm text-gray-400 leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <motion.button
            onClick={onGetStarted}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-2xl font-semibold shadow-lg shadow-violet-900/30 hover:shadow-xl transition-all flex items-center gap-2 mx-auto"
          >
            Explore All Features
            <ArrowRight className="w-5 h-5" />
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}

function CampaignBuilderSection({ onGetStarted }: { onGetStarted?: () => void }) {
  const structures = [
    { name: 'SKAG', desc: 'Single Keyword Ad Groups', icon: Zap, color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' },
    { name: 'STAG', desc: 'Single Theme Ad Groups', icon: TrendingUp, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
    { name: 'Intent-Based', desc: 'Search intent clustering', icon: Target, color: 'text-pink-400 bg-pink-500/10 border-pink-500/20' },
    { name: 'Alpha-Beta', desc: 'Broad & exact split testing', icon: Layers, color: 'text-teal-400 bg-teal-500/10 border-teal-500/20' },
    { name: 'Geo-Targeted', desc: 'Location-based campaigns', icon: MapPin, color: 'text-green-400 bg-green-500/10 border-green-500/20' },
    { name: 'Funnel-Based', desc: 'Awareness to conversion', icon: Filter, color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' },
    { name: 'Brand Split', desc: 'Brand vs non-brand terms', icon: Sparkles, color: 'text-violet-400 bg-violet-500/10 border-violet-500/20' },
    { name: 'Device-Specific', desc: 'Mobile, desktop, tablet', icon: Smartphone, color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' },
    { name: 'Audience-Based', desc: 'Demographic targeting', icon: Users, color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
    { name: 'Long-Tail Master', desc: 'Low-competition keywords', icon: Search, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
    { name: 'Seasonal Sprint', desc: 'Time-sensitive campaigns', icon: Clock, color: 'text-red-400 bg-red-500/10 border-red-500/20' },
    { name: 'Performance Max', desc: 'Google AI-optimized', icon: Rocket, color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
  ];

  return (
    <section id="campaign-builder" className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/10 text-indigo-400 rounded-full text-sm font-medium mb-6 border border-indigo-500/20">
              <Rocket className="w-4 h-4" />
              Campaign Builder 3.0
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
              13 Campaign Structures
              <br />
              <span className="text-indigo-400">for Every Strategy</span>
            </h2>
            <p className="text-gray-400 text-lg mb-8 leading-relaxed">
              Choose the perfect structure for your business. Our wizard analyzes your website, 
              generates 1,600+ keywords, creates ads with all extensions, and exports a 
              Google Ads Editor-ready CSV.
            </p>

            <div className="space-y-4 mb-8">
              {['AI-powered website analysis & keyword generation', '1,600+ keywords with all match types', 'RSA, DKI & Call-Only ads with 10+ extensions', 'CSV export for Google Ads Editor', '30K+ ZIP code geo-targeting'].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-indigo-400" />
                  </div>
                  <span className="text-gray-300 text-sm">{item}</span>
                </div>
              ))}
            </div>

            <motion.button
              onClick={onGetStarted}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-2xl font-semibold shadow-lg shadow-indigo-900/30 flex items-center gap-2"
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
            <div className="bg-white/5 rounded-3xl shadow-2xl shadow-indigo-900/20 border border-white/10 overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-6">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-3 h-3 rounded-full bg-white/30" />
                  <div className="w-3 h-3 rounded-full bg-white/30" />
                  <div className="w-3 h-3 rounded-full bg-white/30" />
                </div>
                <h3 className="text-white text-xl font-bold mt-3">Campaign Structures</h3>
                <p className="text-indigo-200 text-sm">12 proven strategies to choose from</p>
              </div>
              <div className="p-5 grid grid-cols-2 gap-3">
                {structures.map((s, i) => (
                  <motion.div
                    key={s.name}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.05 + i * 0.04 }}
                    whileHover={{ scale: 1.03 }}
                    className={`flex items-center gap-3 p-3 rounded-xl border ${s.color.split(' ')[1]} ${s.color.split(' ')[2]} hover:shadow-md transition-all cursor-pointer`}
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${s.color.split(' ')[1]}`}>
                      <s.icon className={`w-4.5 h-4.5 ${s.color.split(' ')[0]}`} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-semibold text-white text-sm leading-tight">{s.name}</h4>
                      <p className="text-[11px] text-gray-400 leading-tight truncate">{s.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function KeywordSuiteSection({ onGetStarted }: { onGetStarted?: () => void }) {
  const tools = [
    { 
      icon: Search, 
      title: 'Keyword Planner', 
      desc: 'Generate hundreds of keywords with volume, CPC, and competition data for any niche.',
      color: 'bg-blue-500',
      stat: '500+',
      statLabel: 'Keywords/search'
    },
    { 
      icon: Sparkles, 
      title: 'Keyword Mixer', 
      desc: 'Combine root keywords with modifiers to create thousands of targeted long-tail variations.',
      color: 'bg-purple-500',
      stat: '10K+',
      statLabel: 'Combinations'
    },
    { 
      icon: Filter, 
      title: 'Negative Keywords', 
      desc: 'AI-powered negative keyword engine to eliminate wasted spend and improve campaign ROI.',
      color: 'bg-red-500',
      stat: '200+',
      statLabel: 'Negatives/gen'
    },
    { 
      icon: TrendingUp, 
      title: 'Long Tail Generator', 
      desc: 'Discover low-competition, high-intent long-tail keywords that convert better.',
      color: 'bg-green-500',
      stat: '800+',
      statLabel: 'Long tails/gen'
    },
  ];

  return (
    <section className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="order-2 lg:order-1"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {tools.map((tool, i) => (
                <motion.div
                  key={tool.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ y: -4 }}
                  className="bg-white/5 rounded-2xl p-5 border border-white/10 hover:shadow-lg transition-all"
                >
                  <div className={`w-10 h-10 ${tool.color} rounded-xl flex items-center justify-center mb-4`}>
                    <tool.icon className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="font-bold text-white mb-1">{tool.title}</h4>
                  <p className="text-xs text-gray-400 mb-3 leading-relaxed">{tool.desc}</p>
                  <div className="flex items-center gap-2 pt-3 border-t border-white/10">
                    <span className="text-lg font-bold text-white">{tool.stat}</span>
                    <span className="text-xs text-gray-500">{tool.statLabel}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="order-1 lg:order-2"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 text-blue-400 rounded-full text-sm font-medium mb-6 border border-blue-500/20">
              <Hash className="w-4 h-4" />
              Keyword Research Suite
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
              4 Powerful Keyword Tools,
              <br />
              <span className="text-blue-400">One Platform</span>
            </h2>
            <p className="text-gray-400 text-lg mb-8 leading-relaxed">
              Generate, mix, filter, and optimize keywords for any industry. 
              Our suite covers everything from initial research to negative keyword cleanup.
            </p>

            <div className="space-y-4 mb-8">
              {['All match types: Broad, Phrase & Exact', 'CPC, volume & competition data', 'Export to CSV or use in Campaign Builder', 'Works with all 12 campaign structures'].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-blue-400" />
                  </div>
                  <span className="text-gray-300 text-sm">{item}</span>
                </div>
              ))}
            </div>

            <motion.button
              onClick={onGetStarted}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-2xl font-semibold shadow-lg shadow-blue-900/30 flex items-center gap-2"
            >
              Start Keyword Research
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function SecurityToolsSection({ onGetStarted }: { onGetStarted?: () => void }) {
  return (
    <section id="security" className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-rose-500/10 text-rose-400 rounded-full text-sm font-medium mb-4 border border-rose-500/20">
            <Shield className="w-4 h-4" />
            Protection & Monitoring
          </span>
          <h2 className="text-3xl md:text-5xl font-black mb-4 text-white">
            Protect Your Campaigns,
            <br />
            <span className="bg-gradient-to-r from-rose-600 to-red-600 bg-clip-text text-transparent">
              Monitor Your Assets
            </span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{ y: -6 }}
            className="bg-white/5 rounded-3xl p-8 border border-white/10 shadow-sm hover:shadow-xl transition-all"
          >
            <div className="w-14 h-14 bg-red-500/10 rounded-2xl flex items-center justify-center mb-5">
              <MousePointerClick className="w-7 h-7 text-red-500" />
            </div>
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-xl font-bold text-white">Click Guard</h3>
              <span className="px-2 py-0.5 bg-green-500/10 text-green-400 text-[10px] font-bold rounded-full uppercase tracking-wide">Live</span>
            </div>
            <p className="text-gray-400 text-sm mb-5">Real-time click fraud detection and prevention for your ad campaigns.</p>
            <div className="space-y-3 mb-5">
              {[
                { icon: Activity, label: 'Live Traffic Monitor' },
                { icon: ShieldCheck, label: 'Bot Detection Engine' },
                { icon: BarChart3, label: 'Traffic Analytics' },
                { icon: Lock, label: 'IP & VPN Blocking' },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2.5">
                  <item.icon className="w-4 h-4 text-red-500" />
                  <span className="text-sm text-gray-300">{item.label}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-3 pt-4 border-t border-white/10">
              <div className="text-center">
                <div className="text-lg font-bold text-red-500">40+</div>
                <div className="text-[10px] text-gray-500">Bot Score</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-red-500">4</div>
                <div className="text-[10px] text-gray-500">Threat Levels</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-red-500">10s</div>
                <div className="text-[10px] text-gray-500">Refresh</div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            whileHover={{ y: -6 }}
            className="bg-white/5 rounded-3xl p-8 border border-white/10 shadow-sm hover:shadow-xl transition-all"
          >
            <div className="w-14 h-14 bg-green-500/10 rounded-2xl flex items-center justify-center mb-5">
              <Globe className="w-7 h-7 text-green-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Domain Monitor</h3>
            <p className="text-gray-400 text-sm mb-5">Track domain expiry, SSL certificates & DNS records with automated alerts.</p>
            <div className="space-y-3 mb-5">
              {[
                { icon: Eye, label: 'WHOIS Lookups' },
                { icon: Lock, label: 'SSL Certificate Check' },
                { icon: Globe, label: 'DNS Record Viewing' },
                { icon: Clock, label: 'Expiry Alerts' },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2.5">
                  <item.icon className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-gray-300">{item.label}</span>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 pt-4 border-t border-white/10">
              {['WHOIS', 'SSL', 'DNS', 'Alerts'].map(tag => (
                <span key={tag} className="px-3 py-1 bg-green-500/10 text-green-400 rounded-full text-xs font-medium">{tag}</span>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            whileHover={{ y: -6 }}
            className="bg-white/5 rounded-3xl p-8 border border-white/10 shadow-sm hover:shadow-xl transition-all"
          >
            <div className="w-14 h-14 bg-amber-500/10 rounded-2xl flex items-center justify-center mb-5">
              <Inbox className="w-7 h-7 text-amber-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Proxy Mail</h3>
            <p className="text-gray-400 text-sm mb-5">Anonymous emails for spying on competitor campaigns and marketing strategies.</p>
            <div className="space-y-3 mb-5">
              {[
                { icon: Inbox, label: 'Real-time Inbox' },
                { icon: Eye, label: 'Track Competitor Emails' },
                { icon: Clock, label: 'Auto-expiring Addresses' },
                { icon: Mail, label: '100% Anonymous' },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2.5">
                  <item.icon className="w-4 h-4 text-amber-500" />
                  <span className="text-sm text-gray-300">{item.label}</span>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 pt-4 border-t border-white/10">
              {['Auto-refresh', 'Read Emails', 'Attachments', 'Expiry Timer'].map(tag => (
                <span key={tag} className="px-3 py-1 bg-amber-500/10 text-amber-400 rounded-full text-xs font-medium">{tag}</span>
              ))}
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <motion.button
            onClick={onGetStarted}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="px-8 py-4 bg-gradient-to-r from-rose-600 to-red-600 text-white rounded-2xl font-semibold shadow-lg shadow-rose-900/30 flex items-center gap-2 mx-auto"
          >
            Protect Your Campaigns
            <ArrowRight className="w-5 h-5" />
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}

function AIFeaturesSection({ onGetStarted }: { onGetStarted?: () => void }) {
  const extensions = [
    { name: 'Sitelinks', icon: '🔗' },
    { name: 'Callouts', icon: '📢' },
    { name: 'Structured Snippets', icon: '📋' },
    { name: 'Call Extensions', icon: '📞' },
    { name: 'Price Extensions', icon: '💰' },
    { name: 'Promotion Extensions', icon: '🎁' },
    { name: 'Image Assets', icon: '🖼' },
    { name: 'Lead Forms', icon: '📝' },
    { name: 'Location Extensions', icon: '📍' },
    { name: 'App Extensions', icon: '📱' },
  ];

  return (
    <section id="ai" className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 text-purple-400 rounded-full text-sm font-medium mb-6 border border-purple-500/20">
              <Cpu className="w-4 h-4" />
              AI-Powered
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
              AI Creates Perfect Ads
              <br />
              <span className="text-purple-400">With All Extensions</span>
            </h2>
            <p className="text-gray-400 text-lg mb-8 leading-relaxed">
              Our AI generates high-quality RSA, DKI, and Call-Only ads optimized for maximum 
              Ad Rank. Every ad includes all 10+ Google extension types automatically.
            </p>

            <div className="space-y-4 mb-8">
              {[
                'Responsive Search Ads with 15 headlines & 4 descriptions',
                'Dynamic Keyword Insertion ads for exact-match relevance',
                'Call-Only ads for mobile-first lead generation',
                'Preset campaign templates for every industry',
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-purple-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-purple-400" />
                  </div>
                  <span className="text-gray-300 text-sm">{item}</span>
                </div>
              ))}
            </div>

            <motion.button
              onClick={onGetStarted}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-violet-600 text-white rounded-2xl font-semibold shadow-lg shadow-purple-900/30 flex items-center gap-2"
            >
              Let AI Build Your Ads
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="bg-white/5 rounded-3xl shadow-2xl shadow-purple-900/20 border border-purple-500/20 overflow-hidden">
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center">
                    <Brain className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">Complete Extension Coverage</h3>
                    <p className="text-gray-400 text-sm">All 10+ extension types included automatically</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {extensions.map((ext) => (
                    <div key={ext.name} className="flex items-center justify-between p-3 bg-white/5 rounded-xl hover:bg-purple-500/10 transition-colors">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{ext.icon}</span>
                        <span className="text-sm text-gray-300 font-medium">{ext.name}</span>
                      </div>
                      <Check className="w-4 h-4 text-green-500" />
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-3 bg-purple-500/10 rounded-xl">
                    <div className="text-xl font-bold text-purple-400">15</div>
                    <div className="text-xs text-gray-400">Headlines</div>
                  </div>
                  <div className="text-center p-3 bg-indigo-500/10 rounded-xl">
                    <div className="text-xl font-bold text-indigo-400">4</div>
                    <div className="text-xs text-gray-400">Descriptions</div>
                  </div>
                  <div className="text-center p-3 bg-violet-500/10 rounded-xl">
                    <div className="text-xl font-bold text-violet-400">&lt;10s</div>
                    <div className="text-xs text-gray-400">Generation</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function SocialProofSection() {
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
    {
      quote: "Cut our campaign setup time from weeks to minutes. The keyword tools alone saved us hundreds of hours.",
      author: "Sarah Chen",
      role: "Marketing Director",
      company: "TechCorp",
      rating: 5
    },
    {
      quote: "Click Guard caught fraudulent clicks we never knew about. We're saving 30% on ad spend now.",
      author: "Michael Rodriguez",
      role: "PPC Manager",
      company: "Growth Agency",
      rating: 5
    },
    {
      quote: "12 campaign structures, 1,600+ keywords per build, all extensions included. This is the real deal.",
      author: "Emily Johnson",
      role: "Founder",
      company: "LocalBiz Pro",
      rating: 5
    }
  ];

  return (
    <section className="py-24 px-6 bg-gradient-to-b from-violet-950 via-indigo-950 to-slate-950 text-white">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-black mb-4">
            Trusted by <span className="bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">Marketers Worldwide</span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {[
            { value: counters.campaigns.toLocaleString(), label: 'Campaigns Built', suffix: '+' },
            { value: counters.keywords.toLocaleString(), label: 'Keywords Generated', suffix: '+' },
            { value: Math.round(counters.savings), label: 'Time Saved', suffix: '%' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center p-8 bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10"
            >
              <div className="text-4xl md:text-5xl font-black bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent mb-2">
                {stat.value}{stat.suffix}
              </div>
              <div className="text-gray-400">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8 hover:border-violet-500/30 transition-all"
            >
              <div className="flex gap-1 mb-4">
                {[...Array(t.rating)].map((_, j) => (
                  <Star key={j} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                ))}
              </div>
              <p className="text-gray-300 mb-6 leading-relaxed">"{t.quote}"</p>
              <div>
                <div className="text-white font-semibold">{t.author}</div>
                <div className="text-gray-500 text-sm">{t.role}, {t.company}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PricingSection({ onSelectPlan }: { onSelectPlan?: (planName: string, priceId: string, amount: number, isSubscription: boolean) => void }) {
  const [isAnnual, setIsAnnual] = useState(false);

  const starterFeatures = [
    '15 campaigns per month',
    'Campaign Builder 3.0',
    'Keyword Planner',
    'Keyword Mixer',
    '10+ ad extension types',
    'CSV export to Google Ads Editor',
    'Community Forum',
    'Email support',
  ];

  const proFeatures = [
    '50 campaigns per month',
    'Campaign Builder 3.0',
    'Keyword Planner',
    'Keyword Mixer',
    'Long Tail Generator',
    'Negative Keywords',
    '10+ ad extension types',
    'CSV export to Google Ads Editor',
    'Click Guard',
    'Domain Monitor',
    'Proxy Mail',
    'Community Forum',
    'Email support',
  ];

  const agencyFeatures = [
    'Unlimited campaigns',
    'Campaign Builder 3.0',
    'Keyword Planner',
    'Keyword Mixer',
    'Long Tail Generator',
    'Negative Keywords',
    '10+ ad extension types',
    'CSV export to Google Ads Editor',
    'Click Guard – unlimited domains',
    'Domain Monitor',
    'Proxy Mail',
    'Email Forwarding',
    'Preset Campaigns',
    'Community Forum',
    'Email support',
    'Dedicated account manager',
  ];

  const plans = isAnnual ? [
    {
      name: 'Starter',
      price: '$39',
      originalPrice: '$49',
      period: '/mo billed annually',
      features: starterFeatures,
      gradient: 'from-blue-500 to-indigo-500',
      priceId: 'price_starter_annual',
      amount: 46800,
    },
    {
      name: 'Professional',
      price: '$79',
      originalPrice: '$99',
      period: '/mo billed annually',
      popular: true,
      features: proFeatures,
      gradient: 'from-violet-600 to-purple-600',
      priceId: 'price_pro_annual',
      amount: 94800,
    },
    {
      name: 'Agency',
      price: '$119',
      originalPrice: '$149',
      period: '/mo billed annually',
      features: agencyFeatures,
      gradient: 'from-pink-500 to-rose-500',
      priceId: 'price_agency_annual',
      amount: 142800,
    },
  ] : [
    {
      name: 'Starter',
      price: '$49',
      period: '/month',
      features: starterFeatures,
      gradient: 'from-blue-500 to-indigo-500',
      priceId: 'price_starter_monthly',
      amount: 4900,
    },
    {
      name: 'Professional',
      price: '$99',
      period: '/month',
      popular: true,
      features: proFeatures,
      gradient: 'from-violet-600 to-purple-600',
      priceId: 'price_pro_monthly',
      amount: 9900,
    },
    {
      name: 'Agency',
      price: '$149',
      period: '/month',
      features: agencyFeatures,
      gradient: 'from-pink-500 to-rose-500',
      priceId: 'price_agency_monthly',
      amount: 14900,
    },
  ];

  return (
    <section id="pricing" className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-violet-500/10 text-violet-400 rounded-full text-sm font-medium mb-4 border border-violet-500/20">
            <Zap className="w-4 h-4" />
            Simple Pricing
          </span>
          <h2 className="text-3xl md:text-5xl font-black mb-4 text-white">
            Choose Your <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">Plan</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-xl mx-auto mb-8">
            Start with a 7-day free trial. Upgrade or cancel anytime.
          </p>

          <div className="flex items-center justify-center gap-4 mb-8">
            <span className={`text-sm font-medium ${!isAnnual ? 'text-white' : 'text-gray-500'}`}>Monthly</span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className={`relative w-14 h-7 rounded-full transition-colors ${isAnnual ? 'bg-violet-600' : 'bg-gray-600'}`}
            >
              <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${isAnnual ? 'translate-x-7' : 'translate-x-0.5'}`} />
            </button>
            <span className={`text-sm font-medium ${isAnnual ? 'text-white' : 'text-gray-500'}`}>
              Annual <span className="text-green-600 text-xs font-bold ml-1">Save 20%</span>
            </span>
          </div>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan, i) => {
            const isLifetime = 'isLifetime' in plan && plan.isLifetime;
            const isLimited = 'limitedTime' in plan && plan.limitedTime;
            return (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -6 }}
              className={`relative bg-white/5 rounded-3xl p-8 border-2 transition-all ${
                plan.popular 
                  ? 'border-violet-500 shadow-xl shadow-violet-900/30' 
                  : isLifetime
                    ? 'border-emerald-500 shadow-xl shadow-emerald-900/30'
                    : 'border-white/10 shadow-sm hover:shadow-lg hover:border-violet-500/30'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-bold rounded-full">
                  Most Popular
                </div>
              )}
              {isLimited && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold rounded-full whitespace-nowrap">
                  Limited Time Offer
                </div>
              )}

              <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-4xl font-black text-white">{plan.price}</span>
                <span className="text-gray-400 text-sm">{plan.period}</span>
              </div>
              {'originalPrice' in plan && plan.originalPrice && (
                <div className="text-sm text-gray-500 line-through mb-4">{plan.originalPrice}/mo</div>
              )}
              {isLifetime && (
                <div className="text-sm text-emerald-400 font-medium mb-4">No recurring fees ever</div>
              )}
              {!('originalPrice' in plan) && !isLifetime && <div className="mb-4" />}

              <button
                onClick={() => onSelectPlan?.(plan.name, plan.priceId, plan.amount, !isLifetime)}
                className={`w-full py-3 rounded-xl font-semibold text-sm mb-6 transition-all ${
                  isLifetime
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-900/30 hover:shadow-xl'
                    : plan.popular
                      ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-900/30 hover:shadow-xl'
                      : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {isLifetime ? 'Get Lifetime Access' : 'Start Free Trial'}
              </button>

              <ul className="space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5">
                    <Check className={`w-4 h-4 ${isLifetime ? 'text-emerald-500' : 'text-violet-500'} mt-0.5 flex-shrink-0`} />
                    <span className="text-sm text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-10 flex items-center justify-center gap-6 text-sm text-gray-400"
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

function FinalCTA({ onGetStarted }: { onGetStarted?: () => void }) {
  return (
    <section className="py-24 px-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-700 rounded-3xl p-12 md:p-16 text-center overflow-hidden"
        >
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl" />
          </div>

          <div className="relative z-10">
            <h2 className="text-3xl md:text-5xl font-black mb-6 text-white">
              Ready to Build Better
              <br />
              Google Ads Campaigns?
            </h2>
            <p className="text-lg text-white/80 mb-10 max-w-2xl mx-auto">
              Join thousands of marketers using Adiology to build campaigns faster, 
              protect their clicks, and maximize ROI.
            </p>
            <motion.button
              onClick={onGetStarted}
              className="px-10 py-5 bg-white text-violet-600 rounded-2xl font-bold text-lg hover:shadow-xl transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="flex items-center gap-3">
                Get Started Free
                <ArrowRight className="w-5 h-5" />
              </span>
            </motion.button>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-white/70 text-sm">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4" />
                <span>7-day free trial</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4" />
                <span>14-day money back</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Footer({ onNavigateToPolicy, onNavigateToApp, onNavigateToPage }: { onNavigateToPolicy?: (policy: string) => void; onNavigateToApp?: (tab: string) => void; onNavigateToPage?: (page: string) => void }) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-950 text-gray-400 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-12">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl flex items-center justify-center">
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
                <a key={i} href="#" className="w-9 h-9 bg-white/5 rounded-lg flex items-center justify-center hover:bg-white/10 hover:text-white transition-all">
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
                  <a href={link.page} onClick={(e) => { e.preventDefault(); onNavigateToPage?.(link.page); }} className="hover:text-white transition-colors">
                    {link.label}
                  </a>
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
                  <a href={link.page} onClick={(e) => { e.preventDefault(); onNavigateToPage?.(link.page); }} className="hover:text-white transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4 text-sm">Legal</h4>
            <ul className="space-y-3 text-sm">
              {[
                { label: 'Privacy Policy', action: 'privacy', href: '/privacy-policy' },
                { label: 'Terms of Service', action: 'terms', href: '/terms-of-service' },
                { label: 'Cookie Policy', action: 'cookie', href: '/cookie-policy' },
                { label: 'GDPR Compliance', action: 'gdpr', href: '/gdpr-compliance' },
                { label: 'Refund Policy', action: 'refund', href: '/refund-policy' },
              ].map(link => (
                <li key={link.label}>
                  <a href={link.href} onClick={(e) => { e.preventDefault(); onNavigateToPolicy?.(link.action); }} className="hover:text-white transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4 text-sm">Company</h4>
            <ul className="space-y-3 text-sm">
              <li><a href="/contact" onClick={(e) => { e.preventDefault(); onNavigateToPage?.('/contact'); }} className="hover:text-white transition-colors">Contact</a></li>
              <li><a href="/help-center" onClick={(e) => { e.preventDefault(); onNavigateToPage?.('/help-center'); }} className="hover:text-white transition-colors">Help Center</a></li>
              <li><a href="/community" onClick={(e) => { e.preventDefault(); onNavigateToPage?.('/community'); }} className="hover:text-white transition-colors">Community</a></li>
              <li><a href="/blog" onClick={(e) => { e.preventDefault(); onNavigateToPage?.('/blog'); }} className="hover:text-white transition-colors">Blog</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-600 text-sm">
              &copy; {currentYear} Adiology. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-sm text-gray-600">
              <a href="/privacy-policy" onClick={(e) => { e.preventDefault(); onNavigateToPolicy?.('privacy'); }} className="hover:text-white transition-colors">Privacy</a>
              <a href="/terms-of-service" onClick={(e) => { e.preventDefault(); onNavigateToPolicy?.('terms'); }} className="hover:text-white transition-colors">Terms</a>
              <a href="/cookie-policy" onClick={(e) => { e.preventDefault(); onNavigateToPolicy?.('cookie'); }} className="hover:text-white transition-colors">Cookies</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
