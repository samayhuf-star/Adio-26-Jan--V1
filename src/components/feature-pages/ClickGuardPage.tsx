import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import {
  ArrowLeft, ArrowRight, Shield, Bot, Users, Globe, Fingerprint,
  RefreshCw, Code, Activity, Search, Ban, BarChart3, MapPin,
  Brain, FileText, Lock, Zap, Eye, Clock, TrendingUp,
  ShieldCheck, AlertTriangle, Cpu, ChevronRight, DollarSign,
  MousePointerClick, Server
} from 'lucide-react';

interface ClickGuardPageProps {
  onGetStarted?: () => void;
  onBack?: () => void;
}

export default function ClickGuardPage({ onGetStarted, onBack }: ClickGuardPageProps) {
  return (
    <>
      <Helmet>
        <title>Click Guard - Google Ads Click Fraud Protection | Adiology</title>
        <meta name="description" content="Protect your Google Ads budget from click fraud with Adiology's Click Guard. Bot detection, IP blocking, real-time traffic monitoring, and analytics dashboard." />
        <link rel="canonical" href="https://adiology.io/features/click-guard" />
        <meta property="og:title" content="Click Guard - Google Ads Click Fraud Protection | Adiology" />
        <meta property="og:description" content="Protect your Google Ads budget from click fraud with bot detection and IP blocking." />
        <meta property="og:url" content="https://adiology.io/features/click-guard" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Click Guard - Google Ads Click Fraud Protection | Adiology" />
        <meta name="twitter:description" content="Protect your Google Ads budget from click fraud with bot detection and IP blocking." />
        <meta name="twitter:image" content="https://adiology.io/og-image.png" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          "name": "Click Fraud Protection",
          "applicationCategory": "BusinessApplication",
          "operatingSystem": "Web",
          "url": "https://adiology.io/features/click-guard",
          "description": "Protect your Google Ads budget from click fraud with Adiology's Click Guard. Bot detection, IP blocking, real-time traffic monitoring, and analytics dashboard.",
          "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD"
          },
          "publisher": {
            "@type": "Organization",
            "name": "Adiology",
            "url": "https://adiology.io"
          }
        })}</script>
      </Helmet>
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-purple-950 to-slate-950 text-white overflow-hidden">
        <Navigation onGetStarted={onGetStarted} onBack={onBack} />
        <HeroSection onGetStarted={onGetStarted} />
        <ThreatDetectionSection />
        <HowItWorksSection />
        <DashboardFeaturesSection />
        <ProtectionStatsSection onGetStarted={onGetStarted} />
        <CTASection onGetStarted={onGetStarted} />
        <Footer />
      </div>
    </>
  );
}

function Navigation({ onGetStarted, onBack }: { onGetStarted?: () => void; onBack?: () => void }) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-xl border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/20">
                <span className="text-white font-black text-xl">A</span>
              </div>
              <span className="font-bold text-xl text-white">adiology</span>
            </div>
            <button
              onClick={onBack}
              className="hidden sm:flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors ml-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </button>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="sm:hidden flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <motion.button
              onClick={onGetStarted}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl text-sm font-semibold shadow-lg shadow-violet-500/20 hover:shadow-xl transition-all"
            >
              Get Started Free
            </motion.button>
          </div>
        </div>
      </div>
    </nav>
  );
}

function HeroSection({ onGetStarted }: { onGetStarted?: () => void }) {
  const statBadges = [
    { icon: Zap, label: 'Real-time Detection' },
    { icon: Bot, label: 'Bot & VPN Blocking' },
    { icon: Ban, label: 'IP Blacklisting' },
    { icon: DollarSign, label: 'Save up to 25% on Ad Spend' },
  ];

  return (
    <section className="relative pt-32 md:pt-40 pb-20 px-6">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 rounded-full text-sm font-medium mb-6 border border-red-500/20"
          >
            <ShieldCheck className="w-4 h-4" />
            Click Guard Protection
          </motion.div>

          <motion.h1
            className="text-4xl md:text-5xl lg:text-6xl font-black leading-tight mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <span className="text-white">Protect Your Ad Budget</span>
            <br />
            <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
              from Click Fraud
            </span>
          </motion.h1>

          <motion.p
            className="text-lg md:text-xl text-indigo-200/80 mb-10 max-w-2xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Real-time protection against bots, competitors, and invalid clicks.
            Stop wasting money on fraudulent traffic and maximize your Google Ads ROI.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mb-12"
          >
            <motion.button
              onClick={onGetStarted}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="px-8 py-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-2xl font-semibold text-lg shadow-lg shadow-violet-900/30 hover:shadow-xl transition-all flex items-center gap-2 mx-auto"
            >
              Start Protecting Your Ads
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto">
            {statBadges.map((badge, i) => (
              <motion.div
                key={badge.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.4 + i * 0.08 }}
                className="flex items-center gap-2.5 px-4 py-3 bg-white/5 rounded-xl border border-white/10 hover:border-violet-500/30 transition-all"
              >
                <badge.icon className="w-5 h-5 text-violet-400 flex-shrink-0" />
                <span className="text-sm text-gray-300 font-medium">{badge.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ThreatDetectionSection() {
  const threats = [
    {
      icon: Bot,
      title: 'Bot Traffic',
      description: 'Detect and block automated bots that click your ads repeatedly, draining your budget with zero conversion potential.',
      gradient: 'from-red-500 to-rose-600',
      bg: 'bg-red-500/10',
    },
    {
      icon: Users,
      title: 'Competitor Clicks',
      description: 'Identify competitors who repeatedly click your ads to exhaust your daily budget and push you out of the auction.',
      gradient: 'from-orange-500 to-amber-600',
      bg: 'bg-orange-500/10',
    },
    {
      icon: Globe,
      title: 'VPN/Proxy Users',
      description: 'Detect clicks from VPN and proxy services commonly used to mask fraudulent activity and bypass geo-restrictions.',
      gradient: 'from-blue-500 to-cyan-600',
      bg: 'bg-blue-500/10',
    },
    {
      icon: MousePointerClick,
      title: 'Click Farms',
      description: 'Identify patterns from organized click farms that generate thousands of fake clicks from coordinated networks.',
      gradient: 'from-purple-500 to-violet-600',
      bg: 'bg-purple-500/10',
    },
    {
      icon: Fingerprint,
      title: 'Suspicious Patterns',
      description: 'Advanced behavioral analysis detects abnormal click patterns, timing anomalies, and device fingerprint mismatches.',
      gradient: 'from-emerald-500 to-green-600',
      bg: 'bg-emerald-500/10',
    },
    {
      icon: RefreshCw,
      title: 'Repeated Clicks',
      description: 'Track and block IPs that generate excessive repeat clicks on the same ads within short time windows.',
      gradient: 'from-pink-500 to-rose-600',
      bg: 'bg-pink-500/10',
    },
  ];

  return (
    <section className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 rounded-full text-sm font-medium mb-4 border border-red-500/20">
            <AlertTriangle className="w-4 h-4" />
            Threat Detection
          </span>
          <h2 className="text-3xl md:text-5xl font-black mb-4 text-white">
            6 Types of Fraud
            <br />
            <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
              We Detect & Block
            </span>
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Our multi-layered detection engine identifies every type of click fraud targeting your campaigns.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {threats.map((threat, index) => (
            <motion.div
              key={threat.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08 }}
              whileHover={{ y: -6 }}
              className="group bg-white/5 rounded-2xl p-6 border border-white/10 hover:border-violet-500/30 hover:shadow-xl hover:shadow-violet-900/20 transition-all duration-300"
            >
              <div className={`w-14 h-14 ${threat.bg} rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                <threat.icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{threat.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{threat.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const steps = [
    {
      step: '01',
      icon: Code,
      title: 'Install Tracking Code',
      description: 'Add our lightweight JavaScript snippet to your landing pages. Takes less than 2 minutes to set up with any website builder.',
      gradient: 'from-violet-600 to-indigo-600',
    },
    {
      step: '02',
      icon: Eye,
      title: 'Monitor Traffic',
      description: 'Our system begins monitoring every click in real-time, analyzing visitor behavior, device fingerprints, and network data.',
      gradient: 'from-indigo-600 to-blue-600',
    },
    {
      step: '03',
      icon: Search,
      title: 'Detect Fraud',
      description: 'Machine learning algorithms analyze click patterns, identify anomalies, and flag suspicious activity across all your campaigns.',
      gradient: 'from-blue-600 to-cyan-600',
    },
    {
      step: '04',
      icon: Ban,
      title: 'Auto-Block IPs',
      description: 'Fraudulent IPs are automatically blocked in your system, preventing them from accessing your landing pages and wasting your ad budget.',
      gradient: 'from-cyan-600 to-emerald-600',
    },
  ];

  return (
    <section className="py-24 px-6 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-950/30 to-transparent" />
      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/10 text-indigo-400 rounded-full text-sm font-medium mb-4 border border-indigo-500/20">
            <Cpu className="w-4 h-4" />
            How It Works
          </span>
          <h2 className="text-3xl md:text-5xl font-black mb-4 text-white">
            Protection in
            <br />
            <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
              4 Simple Steps
            </span>
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Get up and running in minutes. Our automated system handles the rest.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="relative group"
            >
              <div className="bg-white/5 rounded-2xl p-6 border border-white/10 hover:border-violet-500/30 transition-all duration-300 h-full">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${step.gradient} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform`}>
                  <step.icon className="w-6 h-6 text-white" />
                </div>
                <div className="text-xs font-bold text-violet-400 mb-2 tracking-wider">{step.step}</div>
                <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{step.description}</p>
              </div>
              {index < steps.length - 1 && (
                <div className="hidden lg:flex absolute top-1/2 -right-3 transform -translate-y-1/2 z-10">
                  <ChevronRight className="w-6 h-6 text-violet-500/40" />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function DashboardFeaturesSection() {
  const features = [
    {
      icon: Activity,
      title: 'Live Traffic Monitoring',
      description: 'Watch clicks arrive in real-time with detailed visitor information, device data, and threat scoring for every single click.',
      gradient: 'from-violet-500 to-indigo-500',
      bg: 'bg-violet-500/10',
    },
    {
      icon: Server,
      title: 'IP Analytics',
      description: 'Deep-dive into IP address data with reputation scoring, historical click patterns, and automated threat classification.',
      gradient: 'from-blue-500 to-cyan-500',
      bg: 'bg-blue-500/10',
    },
    {
      icon: MapPin,
      title: 'Geographic Analysis',
      description: 'View click origins by country and region with detailed breakdowns. Identify suspicious geographic clusters and region-based fraud patterns.',
      gradient: 'from-emerald-500 to-green-500',
      bg: 'bg-emerald-500/10',
    },
    {
      icon: Brain,
      title: 'Behavioral Scoring',
      description: 'AI-powered scoring system rates every visitor based on mouse movements, scroll behavior, time on page, and conversion signals.',
      gradient: 'from-purple-500 to-pink-500',
      bg: 'bg-purple-500/10',
    },
    {
      icon: Lock,
      title: 'Automated Blocking Rules',
      description: 'Set custom rules to automatically block IPs based on click frequency, geographic origin, device type, and threat score thresholds.',
      gradient: 'from-amber-500 to-orange-500',
      bg: 'bg-amber-500/10',
    },
    {
      icon: FileText,
      title: 'Detailed Reports & Exports',
      description: 'Generate comprehensive fraud reports with exportable data. Track blocked clicks, savings estimates, and protection metrics over time.',
      gradient: 'from-pink-500 to-rose-500',
      bg: 'bg-pink-500/10',
    },
  ];

  return (
    <section className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-violet-500/10 text-violet-400 rounded-full text-sm font-medium mb-4 border border-violet-500/20">
            <BarChart3 className="w-4 h-4" />
            Dashboard Features
          </span>
          <h2 className="text-3xl md:text-5xl font-black mb-4 text-white">
            Powerful Analytics
            <br />
            <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
              at Your Fingertips
            </span>
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Everything you need to monitor, analyze, and protect your ad campaigns from fraudulent clicks.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08 }}
              whileHover={{ y: -6 }}
              className="group bg-white/5 rounded-2xl p-6 border border-white/10 hover:border-violet-500/30 hover:shadow-xl hover:shadow-violet-900/20 transition-all duration-300"
            >
              <div className={`w-14 h-14 ${feature.bg} rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                <feature.icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProtectionStatsSection({ onGetStarted }: { onGetStarted?: () => void }) {
  const stats = [
    { value: '25%', label: 'Average Ad Spend Saved', icon: DollarSign },
    { value: 'Real-time', label: 'Detection Speed', icon: Clock },
    { value: 'Multi-layer', label: 'Fraud Scoring', icon: ShieldCheck },
    { value: '24/7', label: 'Always-On Protection', icon: Shield },
  ];

  const benefits = [
    'Block fraudulent clicks before they cost you money',
    'Automatically block bad IPs from your landing pages',
    'Reduce wasted ad spend by up to 25%',
    'Get detailed reports on every blocked threat',
    'Protect unlimited domains and campaigns',
    'No impact on legitimate visitor experience',
  ];

  return (
    <section className="py-24 px-6 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-950/20 to-transparent" />
      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-400 rounded-full text-sm font-medium mb-4 border border-emerald-500/20">
            <TrendingUp className="w-4 h-4" />
            Protection Benefits
          </span>
          <h2 className="text-3xl md:text-5xl font-black mb-4 text-white">
            Maximize Your ROI
            <br />
            <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
              with Click Guard
            </span>
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Block fraudulent clicks before they cost you money. Every dollar saved goes directly to reaching real customers.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-white/5 rounded-2xl p-6 border border-white/10 text-center hover:border-violet-500/30 transition-all"
            >
              <div className="w-12 h-12 bg-violet-500/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <stat.icon className="w-6 h-6 text-violet-400" />
              </div>
              <div className="text-3xl font-black text-white mb-1">{stat.value}</div>
              <div className="text-sm text-gray-400">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid lg:grid-cols-2 gap-12 items-center"
        >
          <div>
            <h3 className="text-2xl md:text-3xl font-black text-white mb-6">
              Every Click Counts.
              <br />
              <span className="text-violet-400">Make Sure They're Real.</span>
            </h3>
            <div className="space-y-4">
              {benefits.map((benefit) => (
                <div key={benefit} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-violet-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-violet-400" />
                  </div>
                  <span className="text-gray-300">{benefit}</span>
                </div>
              ))}
            </div>
            <motion.button
              onClick={onGetStarted}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="mt-8 px-8 py-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-2xl font-semibold shadow-lg shadow-violet-900/30 flex items-center gap-2"
            >
              Start Protecting Now
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </div>

          <div className="bg-white/5 rounded-3xl p-8 border border-white/10">
            <h4 className="text-lg font-bold text-white mb-6">Estimated Monthly Savings</h4>
            <div className="space-y-5">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Monthly Ad Spend</span>
                <span className="text-white font-bold">$5,000</span>
              </div>
              <div className="w-full h-px bg-white/10" />
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Avg. Fraud Rate</span>
                <span className="text-red-400 font-bold">~14%</span>
              </div>
              <div className="w-full h-px bg-white/10" />
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Wasted on Fraud</span>
                <span className="text-red-400 font-bold">$700/mo</span>
              </div>
              <div className="w-full h-px bg-white/10" />
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Click Guard Blocks</span>
                <span className="text-emerald-400 font-bold">~95% of fraud</span>
              </div>
              <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: '95%' }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.5, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-r from-violet-600 to-indigo-600 rounded-full"
                />
              </div>
              <div className="bg-emerald-500/10 rounded-xl p-4 border border-emerald-500/20">
                <div className="flex justify-between items-center">
                  <span className="text-emerald-400 font-semibold">Your Monthly Savings</span>
                  <span className="text-2xl font-black text-emerald-400">$665</span>
                </div>
                <p className="text-xs text-emerald-400/60 mt-1">That's $7,980 saved per year</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function CTASection({ onGetStarted }: { onGetStarted?: () => void }) {
  return (
    <section className="py-24 px-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-gradient-to-br from-violet-600/20 to-indigo-600/20 rounded-3xl p-10 md:p-16 border border-violet-500/20 text-center relative overflow-hidden"
        >
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl" />
          </div>
          <div className="relative z-10">
            <div className="w-16 h-16 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-violet-500/30">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
              Stop Wasting Money
              <br />
              on Fake Clicks
            </h2>
            <p className="text-lg text-indigo-200/80 mb-8 max-w-xl mx-auto">
              Join thousands of advertisers who protect their Google Ads budget with Click Guard.
              Start your free trial today — no credit card required.
            </p>
            <motion.button
              onClick={onGetStarted}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-10 py-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-2xl font-semibold text-lg shadow-xl shadow-violet-900/40 hover:shadow-2xl transition-all flex items-center gap-2 mx-auto"
            >
              Get Started Free
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="py-8 px-6 border-t border-white/10">
      <div className="max-w-7xl mx-auto text-center">
        <p className="text-gray-500 text-sm">© 2026 Adiology. All rights reserved.</p>
      </div>
    </footer>
  );
}
