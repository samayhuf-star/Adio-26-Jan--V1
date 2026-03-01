import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import {
  ArrowLeft, ArrowRight, Search, Brain, Filter, Layers,
  TrendingUp, Target, Hash, BarChart3, Download, Sparkles,
  CheckCircle2, Globe, Zap
} from 'lucide-react';

interface KeywordPlannerPageProps {
  onGetStarted?: () => void;
  onBack?: () => void;
}

export default function KeywordPlannerPage({ onGetStarted, onBack }: KeywordPlannerPageProps) {
  return (
    <>
      <Helmet>
        <title>AI Keyword Planner - Discover High-Converting Keywords | Adiology</title>
        <meta name="description" content="Find the best keywords for your Google Ads campaigns with Adiology's AI-powered Keyword Planner. Get search volume data, intent classification, and export-ready keyword lists." />
        <link rel="canonical" href="https://adiology.io/features/keyword-planner" />
        <meta property="og:title" content="AI Keyword Planner - Discover High-Converting Keywords | Adiology" />
        <meta property="og:description" content="Find the best keywords for your Google Ads campaigns with Adiology's AI-powered Keyword Planner." />
        <meta property="og:url" content="https://adiology.io/features/keyword-planner" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="AI Keyword Planner - Discover High-Converting Keywords | Adiology" />
        <meta name="twitter:description" content="Find the best keywords for your Google Ads campaigns with Adiology's AI-powered Keyword Planner." />
        <meta name="twitter:image" content="https://adiology.io/og-image.png" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          "name": "Keyword Planner",
          "applicationCategory": "BusinessApplication",
          "operatingSystem": "Web",
          "url": "https://adiology.io/features/keyword-planner",
          "description": "Find the best keywords for your Google Ads campaigns with Adiology's AI-powered Keyword Planner. Get search volume data, intent classification, and export-ready keyword lists.",
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
        <FeaturesSection />
        <HowItWorksSection />
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

function HeroSection({ onGetStarted }: { onGetStarted?: () => void }) {
  return (
    <section className="relative py-24 px-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(99,102,241,0.15),transparent_50%)]" />
      <div className="max-w-5xl mx-auto text-center relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-violet-500/10 border border-violet-500/20 rounded-full mb-8">
            <Search className="w-4 h-4 text-violet-400" />
            <span className="text-sm text-violet-300">AI-Powered Keyword Research</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Discover High-Converting<br />
            <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">Keywords in Seconds</span>
          </h1>
          <p className="text-xl text-gray-300 mb-10 max-w-3xl mx-auto leading-relaxed">
            Our AI-powered Keyword Planner analyzes your business, competitors, and market trends to generate
            targeted keyword lists that drive qualified traffic and maximize your Google Ads ROI.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={onGetStarted} className="px-8 py-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl text-lg font-semibold hover:from-violet-500 hover:to-indigo-500 transition-all flex items-center gap-2 justify-center shadow-lg shadow-violet-500/25">
              Start Planning Keywords <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  const features = [
    { icon: Brain, title: 'AI-Powered Suggestions', description: 'OpenAI analyzes your business URL and generates relevant keyword ideas automatically.' },
    { icon: Filter, title: 'Match Type Control', description: 'Generate keywords in Broad, Phrase, Exact, and BMM match types with one click.' },
    { icon: TrendingUp, title: 'Search Volume Data', description: 'Get estimated search volumes and competition levels for every keyword.' },
    { icon: Target, title: 'Intent Classification', description: 'Keywords are categorized by user intent: informational, commercial, transactional.' },
    { icon: Hash, title: 'Negative Keywords', description: 'Automatically identify and exclude irrelevant terms to save your ad budget.' },
    { icon: Layers, title: 'Keyword Grouping', description: 'Smart clustering organizes keywords into themed ad groups for better Quality Scores.' },
    { icon: BarChart3, title: 'Competitor Analysis', description: 'Discover what keywords your competitors are bidding on and find gaps.' },
    { icon: Download, title: 'Export Ready', description: 'Download your keyword lists in Google Ads Editor CSV format for instant upload.' },
  ];

  return (
    <section className="py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything You Need for Keyword Research</h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">Professional-grade keyword tools powered by AI to help you find the perfect keywords for your campaigns.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className="p-6 bg-white/5 border border-white/10 rounded-2xl hover:border-violet-500/30 transition-all">
              <feature.icon className="w-10 h-10 text-violet-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-400 text-sm">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const steps = [
    { step: '01', title: 'Enter Your URL or Topic', description: 'Paste your website URL or describe your business. Our AI analyzes your content to understand your niche.' },
    { step: '02', title: 'AI Generates Keywords', description: 'OpenAI processes your input and generates hundreds of relevant keyword suggestions with match types.' },
    { step: '03', title: 'Refine & Organize', description: 'Filter by search volume, intent, and competition. Group keywords into logical ad groups.' },
    { step: '04', title: 'Export & Launch', description: 'Download your optimized keyword list in Google Ads Editor format and launch your campaign.' },
  ];

  return (
    <section className="py-20 px-6 bg-white/[0.02]">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
          <p className="text-gray-400 text-lg">From idea to optimized keyword list in 4 simple steps</p>
        </div>
        <div className="space-y-8">
          {steps.map((step, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }}
              className="flex gap-6 items-start p-6 bg-white/5 border border-white/10 rounded-2xl">
              <div className="w-14 h-14 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-lg">{step.step}</span>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-gray-400">{step.description}</p>
              </div>
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
      <div className="max-w-4xl mx-auto text-center">
        <Sparkles className="w-12 h-12 text-violet-400 mx-auto mb-6" />
        <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Find Your Perfect Keywords?</h2>
        <p className="text-gray-400 text-lg mb-8 max-w-2xl mx-auto">
          Join thousands of advertisers using Adiology to discover high-converting keywords and build winning Google Ads campaigns.
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