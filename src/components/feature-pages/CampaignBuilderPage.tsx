import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import {
  ArrowLeft, ArrowRight, Globe, Zap, Layers, Search,
  Brain, FileText, MapPin, Sparkles, Settings, Download,
  Type, PhoneCall, Ban, FileSpreadsheet, CheckCircle2
} from 'lucide-react';

interface CampaignBuilderPageProps {
  onGetStarted?: () => void;
  onBack?: () => void;
}

export default function CampaignBuilderPage({ onGetStarted, onBack }: CampaignBuilderPageProps) {
  return (
    <>
      <Helmet>
        <title>Google Ads Campaign Builder - AI-Powered Campaign Creation | Adiology</title>
        <meta name="description" content="Build Google Ads campaigns in minutes with 13 campaign structures including SKAG, STAG, Alpha-Beta, and Intent-Based. AI-powered ad generation with CSV export for Google Ads Editor." />
        <link rel="canonical" href="https://adiology.io/features/campaign-builder" />
        <meta property="og:title" content="Google Ads Campaign Builder - AI-Powered Campaign Creation | Adiology" />
        <meta property="og:description" content="Build Google Ads campaigns in minutes with 13 campaign structures including SKAG, STAG, Alpha-Beta." />
        <meta property="og:url" content="https://adiology.io/features/campaign-builder" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Google Ads Campaign Builder - AI-Powered Campaign Creation | Adiology" />
        <meta name="twitter:description" content="Build Google Ads campaigns in minutes with 13 campaign structures including SKAG, STAG, Alpha-Beta." />
        <meta name="twitter:image" content="https://adiology.io/og-image.png" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          "name": "Google Ads Campaign Builder",
          "applicationCategory": "BusinessApplication",
          "operatingSystem": "Web",
          "url": "https://adiology.io/features/campaign-builder",
          "description": "Build Google Ads campaigns in minutes with 13 campaign structures including SKAG, STAG, Alpha-Beta, and Intent-Based. AI-powered ad generation with CSV export for Google Ads Editor.",
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
        <HowItWorksSection />
        <CampaignStructuresSection />
        <KeyFeaturesSection />
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
              className="px-6 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl text-sm font-semibold shadow-lg shadow-violet-500/25 hover:shadow-xl hover:shadow-violet-500/40 transition-all"
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
  const stats = [
    { value: '410-710', label: 'Keywords Generated' },
    { value: '12', label: 'Campaign Structures' },
    { value: '183-Col', label: 'CSV Export' },
    { value: '25K+', label: 'ZIP Codes' },
  ];

  return (
    <section className="relative pt-20 md:pt-32 pb-20 px-6">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="max-w-5xl mx-auto relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-violet-500/10 text-violet-400 rounded-full text-sm font-medium mb-8 border border-violet-500/20"
        >
          <Zap className="w-4 h-4" />
          Campaign Builder 3.0
        </motion.div>

        <motion.h1
          className="text-4xl md:text-5xl lg:text-6xl font-black leading-tight mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <span className="text-white">Build Google Ads Campaigns</span>
          <br />
          <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
            in Minutes, Not Hours
          </span>
        </motion.h1>

        <motion.p
          className="text-lg md:text-xl text-indigo-200/80 mb-10 max-w-3xl mx-auto leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          Enter your website URL and let AI analyze your business, generate hundreds of targeted keywords,
          create compelling ads with all extensions, and export a Google Ads Editor-ready CSV — all in a
          simple 7-step wizard.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-16"
        >
          <motion.button
            onClick={onGetStarted}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-10 py-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-2xl font-semibold text-lg shadow-lg shadow-violet-500/30 hover:shadow-xl hover:shadow-violet-500/50 transition-all inline-flex items-center gap-3"
          >
            Start Building Now
            <ArrowRight className="w-5 h-5" />
          </motion.button>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 + i * 0.1 }}
              className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm"
            >
              <div className="text-2xl md:text-3xl font-black bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
                {stat.value}
              </div>
              <div className="text-xs md:text-sm text-gray-400 font-medium mt-1">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const steps = [
    { number: 1, title: 'Enter URL', description: 'Paste your website URL and let our system fetch your business information automatically.', icon: Globe },
    { number: 2, title: 'AI Analysis', description: 'Our AI analyzes your website content, services, and target audience to understand your business.', icon: Brain },
    { number: 3, title: 'Choose Structure', description: 'Select from 12 proven campaign structures like SKAG, STAG, Intent-Based, or Alpha-Beta.', icon: Layers },
    { number: 4, title: 'Generate Keywords', description: 'AI generates 410-710 targeted keywords with broad, phrase, and exact match types.', icon: Search },
    { number: 5, title: 'Create Ads', description: 'Get RSA, DKI, and Call-Only ads with all 10+ extension types automatically created.', icon: FileText },
    { number: 6, title: 'Set Targeting', description: 'Configure location targeting with 25K+ ZIP codes, radius targeting, and geo-bid adjustments.', icon: MapPin },
    { number: 7, title: 'Export CSV', description: 'Download a 183-column Google Ads Editor-compatible CSV ready for immediate import.', icon: Download },
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
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/10 text-indigo-400 rounded-full text-sm font-medium mb-4 border border-indigo-500/20">
            <Settings className="w-4 h-4" />
            How It Works
          </span>
          <h2 className="text-3xl md:text-5xl font-black mb-4 text-white">
            From URL to Campaign
            <br />
            <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
              in 7 Simple Steps
            </span>
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Our wizard guides you through every step of building a complete, professional Google Ads campaign.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              whileHover={{ y: -6 }}
              className={`group relative bg-white/5 rounded-2xl p-6 border border-white/10 hover:border-violet-500/30 transition-all duration-300 ${i === 6 ? 'sm:col-span-2 lg:col-span-1' : ''}`}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-lg">
                  {step.number}
                </div>
                <step.icon className="w-5 h-5 text-violet-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CampaignStructuresSection() {
  const structures = [
    { name: 'SKAG', description: 'Ultra-focused targeting with one keyword per ad group for maximum relevance and Quality Score.' },
    { name: 'STAG+', description: 'Grouped keywords by theme for efficient management while maintaining high relevance.' },
    { name: 'Alpha-Beta', description: 'Split testing structure for continuous optimization and performance improvement.' },
    { name: 'Intent-Based', description: 'Campaigns structured around user search intent for maximum conversion rates.' },
    { name: 'Smart Cluster', description: 'AI-powered keyword clustering for optimal ad group performance.' },
    { name: 'Funnel-Based', description: 'Structured campaigns aligned with customer journey stages.' },
    { name: 'Geo-Precision', description: 'Geographic targeting optimized for local and regional dominance.' },
    { name: 'Competitor Conquest', description: 'Strategic campaigns targeting competitor keywords and brand terms.' },
    { name: 'Long-Tail Master', description: 'Dominate niche markets with highly specific long-tail keyword structures.' },
    { name: 'RLSA Pro', description: 'Advanced remarketing campaigns for search audience targeting.' },
    { name: 'Seasonal Sprint', description: 'Optimized structures for seasonal and time-sensitive promotions.' },
    { name: 'High-Intent DSA', description: 'Dynamic Search Ads structure for capturing high-intent traffic at scale.' },
  ];

  return (
    <section className="py-24 px-6 bg-white/[0.02]">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-violet-500/10 text-violet-400 rounded-full text-sm font-medium mb-4 border border-violet-500/20">
            <Layers className="w-4 h-4" />
            13 Campaign Structures
          </span>
          <h2 className="text-3xl md:text-5xl font-black mb-4 text-white">
            Choose Your
            <br />
            <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
              Campaign Strategy
            </span>
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Select from battle-tested campaign structures used by top Google Ads professionals worldwide.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
          {structures.map((structure, i) => (
            <motion.div
              key={structure.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ y: -4 }}
              className="group bg-white/5 rounded-xl p-5 border border-white/10 hover:border-violet-500/30 transition-all duration-300"
            >
              <h3 className="text-base font-bold text-white mb-1">{structure.name}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{structure.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function KeyFeaturesSection() {
  const features = [
    {
      icon: Brain,
      title: 'AI Keyword Generation',
      description: 'Generate 410-710 highly targeted keywords from your website content using advanced AI analysis.',
      gradient: 'from-violet-500 to-indigo-600',
    },
    {
      icon: Sparkles,
      title: '10+ Ad Extension Types',
      description: 'Sitelinks, callouts, structured snippets, call extensions, location, price, promotion, and more.',
      gradient: 'from-indigo-500 to-blue-600',
    },
    {
      icon: FileText,
      title: 'Responsive Search Ads',
      description: 'AI-generated RSAs with up to 15 headlines and 4 descriptions optimized for your business.',
      gradient: 'from-blue-500 to-cyan-600',
    },
    {
      icon: Type,
      title: 'Dynamic Keyword Insertion',
      description: 'Automatically insert searched keywords into your ad copy for higher relevance and click-through rates.',
      gradient: 'from-cyan-500 to-teal-600',
    },
    {
      icon: PhoneCall,
      title: 'Call-Only Ads',
      description: 'Drive phone calls directly from search results with optimized call-only ad campaigns.',
      gradient: 'from-teal-500 to-emerald-600',
    },
    {
      icon: Ban,
      title: 'Negative Keyword Suggestions',
      description: 'AI-powered negative keyword recommendations to prevent wasted spend on irrelevant searches.',
      gradient: 'from-amber-500 to-orange-600',
    },
    {
      icon: MapPin,
      title: 'Location Targeting',
      description: 'Target by state, city, or ZIP code with 25K+ US ZIP codes and radius targeting support.',
      gradient: 'from-orange-500 to-red-600',
    },
    {
      icon: FileSpreadsheet,
      title: 'Google Ads Editor CSV',
      description: '183-column CSV export fully compatible with Google Ads Editor for instant campaign import.',
      gradient: 'from-pink-500 to-rose-600',
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
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/10 text-indigo-400 rounded-full text-sm font-medium mb-4 border border-indigo-500/20">
            <CheckCircle2 className="w-4 h-4" />
            Key Features
          </span>
          <h2 className="text-3xl md:text-5xl font-black mb-4 text-white">
            Everything You Need for
            <br />
            <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
              Professional Campaigns
            </span>
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Every tool and feature a PPC professional needs, powered by AI and built for speed.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              whileHover={{ y: -6 }}
              className="group bg-white/5 rounded-2xl p-6 border border-white/10 hover:border-violet-500/30 hover:shadow-xl hover:shadow-violet-900/20 transition-all duration-300"
            >
              <div className={`w-12 h-12 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
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
          className="relative bg-gradient-to-br from-violet-600/20 to-indigo-600/20 rounded-3xl p-12 md:p-16 text-center border border-violet-500/20 overflow-hidden"
        >
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl" />
          </div>

          <div className="relative z-10">
            <motion.h2
              className="text-3xl md:text-4xl lg:text-5xl font-black text-white mb-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              Ready to Build Your
              <br />
              <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
                First Campaign?
              </span>
            </motion.h2>

            <motion.p
              className="text-lg text-indigo-200/80 mb-10 max-w-xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              Join marketers who build better Google Ads campaigns with Adiology.
              Start for free today.
            </motion.p>

            <motion.button
              onClick={onGetStarted}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-10 py-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-2xl font-semibold text-lg shadow-lg shadow-violet-500/30 hover:shadow-xl hover:shadow-violet-500/50 transition-all inline-flex items-center gap-3"
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
        <p className="text-sm text-gray-500">© 2026 Adiology. All rights reserved.</p>
      </div>
    </footer>
  );
}
