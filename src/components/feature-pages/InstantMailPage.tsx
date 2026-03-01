import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import {
  ArrowLeft, ArrowRight, Mail, EyeOff, Zap,
  Shield, Lock, Eye, RefreshCw,
  Search, ShieldCheck, Trash2, MousePointerClick,
  Timer, FileText, Sparkles,
  CheckCircle2, ArrowDown, X, AlertTriangle, Target, Copy
} from 'lucide-react';

interface InstantMailPageProps {
  onGetStarted?: () => void;
  onBack?: () => void;
}

export default function InstantMailPage({ onGetStarted, onBack }: InstantMailPageProps) {
  return (
    <>
      <Helmet>
        <title>Proxy Mail - Anonymous Email for Competitive Intelligence | Adiology</title>
        <meta name="description" content="Generate anonymous email addresses for competitive intelligence research. Sign up for competitor newsletters and trials without revealing your identity." />
        <link rel="canonical" href="https://adiology.io/features/proxy-mail" />
        <meta property="og:title" content="Proxy Mail - Anonymous Email for Competitive Intelligence | Adiology" />
        <meta property="og:description" content="Generate anonymous email addresses for competitive intelligence research." />
        <meta property="og:url" content="https://adiology.io/features/proxy-mail" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Proxy Mail - Anonymous Email for Competitive Intelligence | Adiology" />
        <meta name="twitter:description" content="Generate anonymous email addresses for competitive intelligence research." />
        <meta name="twitter:image" content="https://adiology.io/og-image.png" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          "name": "Proxy Mail",
          "applicationCategory": "BusinessApplication",
          "operatingSystem": "Web",
          "url": "https://adiology.io/features/proxy-mail",
          "description": "Generate anonymous email addresses for competitive intelligence research. Sign up for competitor newsletters and trials without revealing your identity.",
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
        <OldWayNewWaySection />
        <CompetitiveIntelSection />
        <RiskMitigationSection />
        <KeyFeaturesSection />
        <HowItWorksSection />
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
  const checkpoints = [
    'Generate instant proxy addresses',
    'Track competitor email sequences',
    'Export to swipe file',
    'Zero spam in your real inbox',
    '100% anonymous research',
  ];

  return (
    <section className="relative pt-32 md:pt-40 pb-20 px-6">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-violet-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-violet-500/10 text-violet-400 rounded-full text-sm font-medium border border-violet-500/20">
              <EyeOff className="w-4 h-4" />
              Proxy Mail
            </span>
          </motion.div>

          <motion.h1
            className="text-4xl md:text-5xl lg:text-6xl font-black leading-tight mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <span className="text-white">Research Competitors</span>
            <br />
            <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
              Without Leaving a Trace
            </span>
          </motion.h1>

          <motion.p
            className="text-lg md:text-xl text-indigo-200/80 mb-10 max-w-2xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Subscribe to any competitor's newsletters, webinars, and lead magnets 
            using disposable proxy emails. Study their strategies. Stay invisible.
          </motion.p>

          <motion.div
            className="flex flex-wrap justify-center gap-4 mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <motion.button
              onClick={onGetStarted}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className="px-8 py-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-2xl font-semibold text-lg shadow-lg shadow-violet-900/30 hover:shadow-xl transition-all flex items-center gap-2"
            >
              Generate Proxy Email
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </motion.div>

          <motion.div
            className="flex flex-wrap justify-center gap-x-6 gap-y-3 max-w-xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            {checkpoints.map((item, i) => (
              <motion.div
                key={item}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.5 + i * 0.08 }}
                className="flex items-center gap-2 text-sm"
              >
                <CheckCircle2 className="w-4 h-4 text-violet-400 flex-shrink-0" />
                <span className="text-gray-300">{item}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function OldWayNewWaySection() {
  const oldWay = [
    { text: 'Create new Gmail account', time: '5 min' },
    { text: 'Verify phone number', time: '2 min' },
    { text: 'Set up inbox filters', time: '3 min' },
    { text: 'Subscribe to competitor', time: '1 min' },
    { text: 'Deal with spam forever', time: 'Ongoing' },
  ];

  const newWay = [
    { text: 'Click "Generate Proxy"', time: '1 second' },
    { text: 'Subscribe to competitor', time: '30 sec' },
    { text: 'Watch their emails arrive', time: 'Real-time' },
    { text: 'Dispose when done', time: '1 click' },
  ];

  return (
    <section className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-violet-500/10 text-violet-400 rounded-full text-sm font-medium mb-4 border border-violet-500/20">
            <Timer className="w-4 h-4" />
            100x Faster Research
          </span>
          <h2 className="text-3xl md:text-5xl font-black mb-4 text-white">
            Stop Creating Gmail Accounts
            <br />
            <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
              Just to Spy on Competitors
            </span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-red-500/5 rounded-2xl p-8 border border-red-500/20"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center">
                <X className="w-5 h-5 text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-red-400">The Old Way</h3>
            </div>
            <div className="space-y-4">
              {oldWay.map((step, i) => (
                <motion.div
                  key={step.text}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center justify-between gap-4 py-3 border-b border-red-500/10 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <X className="w-4 h-4 text-red-400/60 flex-shrink-0" />
                    <span className="text-gray-300">{step.text}</span>
                  </div>
                  <span className="text-red-400/80 text-sm font-mono whitespace-nowrap">{step.time}</span>
                </motion.div>
              ))}
            </div>
            <div className="mt-6 pt-4 border-t border-red-500/20">
              <p className="text-red-400/80 text-sm font-semibold">Total: ~11+ minutes per competitor</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-emerald-500/5 rounded-2xl p-8 border border-emerald-500/20"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                <Zap className="w-5 h-5 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-emerald-400">The Proxy Mail Way</h3>
            </div>
            <div className="space-y-4">
              {newWay.map((step, i) => (
                <motion.div
                  key={step.text}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center justify-between gap-4 py-3 border-b border-emerald-500/10 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span className="text-gray-300">{step.text}</span>
                  </div>
                  <span className="text-emerald-400/80 text-sm font-mono whitespace-nowrap">{step.time}</span>
                </motion.div>
              ))}
            </div>
            <div className="mt-6 pt-4 border-t border-emerald-500/20">
              <p className="text-emerald-400 text-sm font-semibold">Total: Under 2 minutes. Done.</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function CompetitiveIntelSection() {
  const steps = [
    {
      number: '01',
      title: 'Generate Proxy Email',
      description: 'Create an anonymous email address instantly. No personal data, no domain exposure.',
      detail: 'Instant',
      gradient: 'from-violet-600 to-indigo-600',
    },
    {
      number: '02',
      title: 'Subscribe to Competitor Lead Magnets',
      description: 'Sign up for their newsletters, download their ebooks, join their webinar lists.',
      detail: 'Stay invisible',
      gradient: 'from-indigo-600 to-blue-600',
    },
    {
      number: '03',
      title: 'Watch Their Nurture Sequence Unfold',
      description: 'See every email they send — welcome series, drip campaigns, promotional blasts.',
      detail: 'Real-time inbox',
      gradient: 'from-blue-600 to-cyan-600',
    },
    {
      number: '04',
      title: 'Study Their Strategy',
      description: 'Analyze subject lines, offer positioning, email frequency, CTA strategies, and copywriting patterns.',
      detail: 'Deep analysis',
      gradient: 'from-cyan-600 to-teal-600',
    },
    {
      number: '05',
      title: 'Adapt What Works',
      description: 'Take the best ideas and apply them to your own campaigns. Learn from the competition.',
      detail: 'Actionable intel',
      gradient: 'from-teal-600 to-emerald-600',
    },
    {
      number: '06',
      title: 'Dispose Proxy Email',
      description: 'Delete the address when you\'re done. No traces, no connections back to you.',
      detail: 'Zero footprint',
      gradient: 'from-emerald-600 to-green-600',
    },
  ];

  return (
    <section className="py-24 px-6 bg-white/[0.02]">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/10 text-indigo-400 rounded-full text-sm font-medium mb-4 border border-indigo-500/20">
            <Target className="w-4 h-4" />
            Competitive Intelligence
          </span>
          <h2 className="text-3xl md:text-5xl font-black mb-4 text-white">
            How Top Agencies Steal
            <br />
            <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
              Competitor Strategies Legally
            </span>
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Six steps to reverse-engineer any competitor's email marketing playbook.
          </p>
        </motion.div>

        <div className="space-y-4">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group bg-white/5 rounded-2xl p-6 border border-white/10 hover:border-violet-500/30 transition-all duration-300"
            >
              <div className="flex items-start gap-5">
                <div className={`w-12 h-12 bg-gradient-to-br ${step.gradient} rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg`}>
                  <span className="text-white font-black text-sm">{step.number}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <h3 className="text-lg font-bold text-white">{step.title}</h3>
                    <span className="px-2.5 py-0.5 bg-white/10 text-violet-300 text-xs font-medium rounded-full">
                      {step.detail}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 leading-relaxed">{step.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-10 text-lg text-violet-300 font-semibold italic"
        >
          They never know you were there.
        </motion.p>
      </div>
    </section>
  );
}

function RiskMitigationSection() {
  const risks = [
    {
      icon: Eye,
      title: 'They track your domain',
      description: 'Competitors know a rival is watching when you use your business email.',
    },
    {
      icon: Target,
      title: 'They retarget you with ads',
      description: 'Your email gets added to their audience lists, wasting your ad budget.',
    },
    {
      icon: Mail,
      title: 'They spam you forever',
      description: 'Your inbox gets polluted with their marketing emails indefinitely.',
    },
    {
      icon: AlertTriangle,
      title: 'They might block your domain',
      description: 'Some competitors actively block known competitor email domains.',
    },
  ];

  const benefits = [
    'Anonymous identity',
    'Zero retargeting',
    'Disposable when done',
    'No domain exposure',
  ];

  return (
    <section className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 rounded-full text-sm font-medium mb-6 border border-red-500/20">
              <AlertTriangle className="w-4 h-4" />
              Risk Alert
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
              Why You Should <span className="text-red-400">Never</span> Use Your
              <br />
              <span className="bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
                Real Email for Competitor Research
              </span>
            </h2>

            <div className="space-y-4 mt-8">
              {risks.map((risk, index) => (
                <motion.div
                  key={risk.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start gap-4 py-3"
                >
                  <div className="w-8 h-8 bg-red-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <X className="w-4 h-4 text-red-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">{risk.title}</h4>
                    <p className="text-sm text-gray-400">{risk.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="bg-gradient-to-br from-violet-500/10 to-indigo-500/10 rounded-2xl p-8 border border-violet-500/20">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <ShieldCheck className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Use Proxy Mail Instead</h3>
                  <p className="text-sm text-violet-300">Smart research = invisible research</p>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                {benefits.map((benefit, i) => (
                  <motion.div
                    key={benefit}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center gap-3 bg-white/5 rounded-xl px-5 py-3.5 border border-white/10"
                  >
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                    <span className="text-white font-medium">{benefit}</span>
                  </motion.div>
                ))}
              </div>

              <div className="bg-white/5 rounded-xl p-5 border border-white/10">
                <p className="text-violet-300 text-sm font-medium text-center italic">
                  "Your competitors are studying your emails right now.<br />
                  Shouldn't you be studying theirs?"
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function KeyFeaturesSection() {
  const features = [
    {
      icon: MousePointerClick,
      title: 'One-Click Proxy Generation',
      description: 'Generate anonymous email addresses instantly. No forms, no registration, no personal data required.',
      color: 'text-violet-400',
      bg: 'bg-violet-500/10',
      borderColor: 'border-violet-500/20',
    },
    {
      icon: RefreshCw,
      title: 'Real-Time Competitor Inbox',
      description: 'Watch competitor emails arrive in real-time with auto-refresh. View full content, HTML rendering, and attachments.',
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10',
      borderColor: 'border-indigo-500/20',
    },
    {
      icon: Timer,
      title: 'Auto-Expiring Addresses',
      description: 'Proxy addresses automatically expire when you\'re done. No cleanup needed — your research trail vanishes.',
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20',
    },
    {
      icon: Search,
      title: 'Multiple Competitor Tracking',
      description: 'Run multiple proxy addresses simultaneously. Research several competitors at once across different campaigns.',
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10',
      borderColor: 'border-cyan-500/20',
    },
    {
      icon: Copy,
      title: 'Copy & Export Emails',
      description: 'Save competitor emails, subject lines, and CTAs to build your own swipe file of proven marketing strategies.',
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      borderColor: 'border-amber-500/20',
    },
    {
      icon: Lock,
      title: 'Complete Anonymity',
      description: 'Your real identity, domain, and IP are never exposed. Competitors have zero way to trace research back to you.',
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20',
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
            <Sparkles className="w-4 h-4" />
            Key Features
          </span>
          <h2 className="text-3xl md:text-5xl font-black mb-4 text-white">
            Everything You Need for
            <br />
            <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
              Invisible Research
            </span>
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Powerful tools disguised as simplicity. Research competitors without them ever knowing.
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
              whileHover={{ y: -4, scale: 1.02 }}
              className="group bg-white/5 rounded-2xl p-6 border border-white/10 hover:border-violet-500/30 hover:shadow-xl hover:shadow-violet-900/20 transition-all duration-300"
            >
              <div className={`w-12 h-12 ${feature.bg} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform border ${feature.borderColor}`}>
                <feature.icon className={`w-6 h-6 ${feature.color}`} />
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

function HowItWorksSection() {
  const steps = [
    {
      step: '01',
      icon: MousePointerClick,
      title: 'Generate Proxy Address',
      description: 'Click once to create an anonymous proxy email. Your identity stays completely hidden from day one.',
      gradient: 'from-violet-600 to-indigo-600',
    },
    {
      step: '02',
      icon: Search,
      title: 'Subscribe & Research',
      description: 'Use your proxy email to subscribe to competitor newsletters, lead magnets, webinars, and gated content.',
      gradient: 'from-indigo-600 to-blue-600',
    },
    {
      step: '03',
      icon: Trash2,
      title: 'Dispose When Done',
      description: 'Delete the proxy address when your research is complete. All data is permanently erased. No traces left.',
      gradient: 'from-blue-600 to-cyan-600',
    },
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
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/10 text-indigo-400 rounded-full text-sm font-medium mb-4 border border-indigo-500/20">
            <Zap className="w-4 h-4" />
            How It Works
          </span>
          <h2 className="text-3xl md:text-5xl font-black mb-4 text-white">
            Three Steps to
            <br />
            <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
              Invisible Intelligence
            </span>
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            No setup, no configuration. Generate, research, dispose.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-600/30 via-indigo-600/30 to-blue-600/30 -translate-y-1/2 mx-16" />

          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15 }}
              className="relative"
            >
              <div className="bg-white/5 rounded-2xl p-8 border border-white/10 hover:border-violet-500/30 transition-all duration-300 text-center relative z-10">
                <div className={`w-16 h-16 bg-gradient-to-br ${step.gradient} rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg`}>
                  <step.icon className="w-8 h-8 text-white" />
                </div>
                <div className="text-xs font-bold text-violet-400 mb-2 tracking-widest uppercase">Step {step.step}</div>
                <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{step.description}</p>
              </div>
              {index < steps.length - 1 && (
                <div className="flex justify-center my-4 md:hidden">
                  <ArrowDown className="w-6 h-6 text-violet-500/40" />
                </div>
              )}
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
          className="text-center bg-gradient-to-br from-violet-500/10 to-indigo-500/10 rounded-3xl p-12 md:p-16 border border-violet-500/20"
        >
          <div className="w-16 h-16 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-violet-500/30">
            <EyeOff className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
            Start Researching Competitors
            <br />
            <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
              Without Leaving a Trace
            </span>
          </h2>
          <p className="text-lg text-gray-400 max-w-xl mx-auto mb-8 leading-relaxed">
            Generate your first proxy email in seconds. Subscribe to any competitor's marketing. 
            Study their playbook. Stay completely invisible.
          </p>
          <motion.button
            onClick={onGetStarted}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            className="px-8 py-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-2xl font-semibold text-lg shadow-lg shadow-violet-900/30 hover:shadow-xl transition-all inline-flex items-center gap-2"
          >
            Generate Proxy Email
            <ArrowRight className="w-5 h-5" />
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="py-12 px-6 border-t border-white/10">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-sm">A</span>
            </div>
            <span className="font-bold text-white">adiology</span>
          </div>
          <p className="text-sm text-gray-500">
            Proxy Mail — Anonymous email research for competitive intelligence.
          </p>
        </div>
      </div>
    </footer>
  );
}