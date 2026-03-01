import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import {
  ArrowLeft, ArrowRight, FileText, Brain, Sparkles,
  Globe, Settings, Download, CheckCircle2, Zap
} from 'lucide-react';

interface BlogGeneratorPageProps {
  onGetStarted?: () => void;
  onBack?: () => void;
}

export default function BlogGeneratorPage({ onGetStarted, onBack }: BlogGeneratorPageProps) {
  return (
    <>
      <Helmet>
        <title>AI Blog Generator - SEO Content Creation | Adiology</title>
        <meta name="description" content="Generate SEO-optimized blog posts for your Google Ads landing pages with Adiology's AI Blog Generator. Create long-form content in minutes with configurable parameters." />
        <link rel="canonical" href="https://adiology.io/features/blog-generator" />
        <meta property="og:title" content="AI Blog Generator - SEO Content Creation | Adiology" />
        <meta property="og:description" content="Generate SEO-optimized blog posts for your Google Ads landing pages with AI." />
        <meta property="og:url" content="https://adiology.io/features/blog-generator" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="AI Blog Generator - SEO Content Creation | Adiology" />
        <meta name="twitter:description" content="Generate SEO-optimized blog posts for your Google Ads landing pages with AI." />
        <meta name="twitter:image" content="https://adiology.io/og-image.png" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          "name": "AI Blog Generator",
          "applicationCategory": "BusinessApplication",
          "operatingSystem": "Web",
          "url": "https://adiology.io/features/blog-generator",
          "description": "Generate SEO-optimized blog posts for your Google Ads landing pages with Adiology's AI Blog Generator. Create long-form content in minutes with configurable parameters.",
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
            <FileText className="w-4 h-4 text-violet-400" />
            <span className="text-sm text-violet-300">AI Blog Content Generator</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Generate SEO Blog Posts<br />
            <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">with AI in Minutes</span>
          </h1>
          <p className="text-xl text-gray-300 mb-10 max-w-3xl mx-auto leading-relaxed">
            Create long-form, SEO-optimized blog content for your Google Ads landing pages.
            Our AI Blog Generator produces high-quality articles tailored to your keywords and audience.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={onGetStarted} className="px-8 py-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl text-lg font-semibold hover:from-violet-500 hover:to-indigo-500 transition-all flex items-center gap-2 justify-center shadow-lg shadow-violet-500/25">
              Start Generating Content <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  const features = [
    { icon: Brain, title: 'AI-Powered Writing', description: 'OpenAI generates professional, human-like blog posts on any topic in your niche.' },
    { icon: Globe, title: 'SEO Optimized', description: 'Content is structured with proper headings, meta descriptions, and keyword density.' },
    { icon: Settings, title: 'Configurable Parameters', description: 'Control tone, length, target audience, and keyword focus for every article.' },
    { icon: Sparkles, title: 'Multiple Formats', description: 'Generate how-to guides, listicles, comparison posts, and in-depth reviews.' },
    { icon: Download, title: 'Easy Export', description: 'Copy generated content or download as formatted HTML ready for your CMS.' },
    { icon: Zap, title: 'Fast Generation', description: 'Get a complete 2000+ word blog post in under 2 minutes with AI assistance.' },
  ];

  return (
    <section className="py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Content That Converts</h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">Generate blog content designed to support your Google Ads campaigns and improve Quality Scores.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
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
    { step: '01', title: 'Choose Your Topic', description: 'Enter your target keyword, topic, or let AI suggest topics based on your website content.' },
    { step: '02', title: 'Configure Settings', description: 'Set your preferred tone, word count, target audience, and content structure.' },
    { step: '03', title: 'Generate & Publish', description: 'AI creates your blog post with proper formatting. Review, edit, and publish to your site.' },
  ];

  return (
    <section className="py-20 px-6 bg-white/[0.02]">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
          <p className="text-gray-400 text-lg">Create SEO content in 3 simple steps</p>
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
        <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Create Content That Converts?</h2>
        <p className="text-gray-400 text-lg mb-8 max-w-2xl mx-auto">
          Generate professional blog posts that support your Google Ads campaigns and drive organic traffic.
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