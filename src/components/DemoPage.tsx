import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, ArrowRight, Zap, Target, Shield, Brain, BarChart3, Globe } from 'lucide-react';
import { useEffect } from 'react';

interface DemoPageProps {
  onGetStarted?: () => void;
  onBack?: () => void;
}

export default function DemoPage({ onGetStarted, onBack }: DemoPageProps) {
  return (
    <>
      <Helmet>
        <title>See Adiology in Action - Interactive Demo | Adiology</title>
        <meta name="description" content="Watch Adiology in action. See how to build Google Ads campaigns, generate keywords, and protect your clicks with our interactive demo walkthrough." />
        <link rel="canonical" href="https://adiology.io/demo" />
        <meta property="og:title" content="See Adiology in Action - Interactive Demo | Adiology" />
        <meta property="og:description" content="Watch Adiology in action. See how to build Google Ads campaigns, generate keywords, and protect your clicks." />
        <meta property="og:url" content="https://adiology.io/demo" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://adiology.io/og-image.png" />
        <meta name="twitter:image" content="https://adiology.io/og-image.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="See Adiology in Action - Interactive Demo | Adiology" />
        <meta name="twitter:description" content="Watch Adiology in action. See how to build Google Ads campaigns, generate keywords, and protect your clicks." />
      </Helmet>
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-purple-950 to-slate-950 text-white overflow-hidden">
        <Navigation onGetStarted={onGetStarted} onBack={onBack} />
        <DemoSection />
        <AboutSection />
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
            <div className="flex items-center gap-3 cursor-pointer" onClick={onBack}>
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

function DemoSection() {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://app.guideflow.com/assets/opt.js';
    script.setAttribute('data-iframe-id', '6kw7vz7s1p');
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <section className="relative pt-16 md:pt-24 pb-16 px-6">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <h1 className="text-3xl md:text-5xl font-bold mb-4">
            See Adiology{' '}
            <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
              in Action
            </span>
          </h1>
          <p className="text-lg text-indigo-200/80 max-w-2xl mx-auto">
            Watch how Adiology helps you build Google Ads campaigns faster, smarter, and more efficiently. Follow along with our interactive walkthrough below.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-violet-500/10"
        >
          <div style={{ position: 'relative', paddingBottom: 'calc(52.33550979407333% + 47px)', height: 0 }}>
            <iframe
              id="6kw7vz7s1p"
              src="https://app.guideflow.com/embed/6kw7vz7s1p"
              width="100%"
              height="100%"
              style={{ overflow: 'hidden', position: 'absolute', border: 'none' }}
              scrolling="no"
              allow="clipboard-read; clipboard-write"
              allowFullScreen
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function AboutSection() {
  const features = [
    {
      icon: Target,
      title: 'Campaign Builder',
      description: 'Build complete Google Ads campaigns with 15 proven structures including SKAG, STAG, Alpha-Beta, and Intent-Based. Generate hundreds of keywords and ads in minutes.',
    },
    {
      icon: Brain,
      title: 'AI-Powered Generation',
      description: 'Our AI analyzes your website and business to generate relevant keywords, compelling ad copy, and smart targeting recommendations automatically.',
    },
    {
      icon: Shield,
      title: 'Click Fraud Protection',
      description: 'Protect your ad spend with real-time click fraud detection. Block bots, VPN abuse, and repetitive clicks before they drain your budget.',
    },
    {
      icon: Zap,
      title: 'Keyword Planning Suite',
      description: 'Complete keyword tools including a planner, mixer, negative keywords builder, and long-tail keyword generator to cover every angle of your market.',
    },
    {
      icon: Globe,
      title: 'Domain Monitoring',
      description: 'Track domain expiry, SSL certificates, and DNS records with automated email alerts so you never miss a renewal.',
    },
    {
      icon: BarChart3,
      title: 'Google Ads Editor Export',
      description: 'Export campaigns in Google Ads Editor CSV format with 183 columns for seamless import. No manual formatting required.',
    },
  ];

  return (
    <section className="py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Everything You Need to{' '}
            <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
              Win with Google Ads
            </span>
          </h2>
          <p className="text-lg text-indigo-200/70 max-w-2xl mx-auto">
            Adiology brings together campaign building, keyword research, fraud protection, and monitoring tools into one platform built for marketers who want results.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-violet-400/30 transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600/20 to-indigo-600/20 flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-violet-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
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
    <section className="py-20 px-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center p-12 rounded-3xl bg-gradient-to-br from-violet-600/10 to-indigo-600/10 border border-violet-500/20"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Build Better{' '}
            <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
              Google Ads Campaigns?
            </span>
          </h2>
          <p className="text-lg text-indigo-200/80 mb-8 max-w-xl mx-auto">
            Join thousands of marketers using Adiology to build campaigns faster, protect their clicks, and maximize ROI.
          </p>
          <motion.button
            onClick={onGetStarted}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-10 py-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-2xl font-semibold text-lg shadow-lg shadow-violet-500/30 hover:shadow-xl hover:shadow-violet-500/50 transition-all inline-flex items-center gap-3"
          >
            Get Started Free
            <ArrowRight className="w-5 h-5" />
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="py-8 px-6 border-t border-white/10">
      <div className="max-w-7xl mx-auto text-center">
        <p className="text-sm text-gray-500">&copy; 2026 Adiology. All rights reserved.</p>
      </div>
    </footer>
  );
}
