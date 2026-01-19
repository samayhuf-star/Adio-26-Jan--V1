import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { ArrowRight, Zap, Layers, Sparkles, Check, Mail, MapPin, Phone, Twitter, Linkedin, Youtube, TrendingUp, Target, Shield, Smartphone, Users, Search, Calendar, Filter, Rocket } from 'lucide-react';

interface CreativeMinimalistHomepageProps {
  onGetStarted?: () => void;
  onLogin?: () => void;
  onSelectPlan?: (planName: string, priceId: string, amount: number, isSubscription: boolean) => void;
  onNavigateToPolicy?: (policy: string) => void;
  onNavigateToApp?: (tab: string) => void;
}

export default function CreativeMinimalistHomepage({ 
  onGetStarted, 
  onLogin, 
  onSelectPlan,
  onNavigateToPolicy,
  onNavigateToApp
}: CreativeMinimalistHomepageProps) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.8]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);


  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-purple-950 to-slate-950 text-white overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Navigation */}
      <Navigation onGetStarted={onGetStarted} onLogin={onLogin} />

      {/* Hero Section */}
      <section 
        ref={heroRef}
        className="relative min-h-screen flex items-center justify-center px-6 pt-16 pb-12"
      >
        {/* Floating Geometric Shapes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(6)].map((_, i) => {
            const randomX = typeof window !== 'undefined' ? Math.random() * window.innerWidth : Math.random() * 1000;
            const randomY = typeof window !== 'undefined' ? Math.random() * window.innerHeight : Math.random() * 800;
            return (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-white/30 rounded-full"
                initial={{ 
                  x: randomX,
                  y: randomY,
                  opacity: 0
                }}
                animate={{
                  y: [null, typeof window !== 'undefined' ? Math.random() * window.innerHeight : randomY + 200],
                  opacity: [0, 1, 0],
                  scale: [0, 1.5, 0]
                }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  repeat: Infinity,
                  delay: i * 0.5
                }}
              />
            );
          })}
        </div>

        <div className="max-w-7xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-8"
          >
            <motion.h1 
              className="text-5xl md:text-6xl lg:text-7xl font-black mb-6 leading-tight"
              style={{
                background: 'linear-gradient(135deg, #ffffff 0%, #a78bfa 50%, #3b82f6 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
              whileHover={{ 
                scale: 1.02,
                filter: 'brightness(1.2)'
              }}
            >
              Ads made simple.
              <br />
              <motion.span
                animate={{
                  backgroundPosition: ['0%', '100%', '0%'],
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: 'linear'
                }}
                style={{
                  background: 'linear-gradient(90deg, #a78bfa, #3b82f6, #ec4899, #a78bfa)',
                  backgroundSize: '200% 100%',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Results made powerful.
              </motion.span>
            </motion.h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed"
          >
            Launch campaigns 10× faster with automated keywords, ads & assets
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-wrap gap-6 justify-center"
          >
            <motion.button
              onClick={onGetStarted}
              className="group relative px-10 py-5 bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 rounded-2xl font-bold text-lg overflow-hidden"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600"
                animate={{
                  backgroundPosition: ['0%', '100%', '0%'],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: 'linear'
                }}
                style={{
                  backgroundSize: '200% 100%',
                }}
              />
              <span className="relative z-10 flex items-center gap-3">
                Start Your Journey
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </motion.button>

            <motion.button
              onClick={onGetStarted}
              className="px-10 py-5 bg-white/10 backdrop-blur-lg border-2 border-white/20 rounded-2xl font-semibold text-lg hover:bg-white/20 transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              See It In Action
            </motion.button>
          </motion.div>

          {/* 12 Campaign Structure Icons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mt-16"
          >
            <p className="text-gray-400 text-sm mb-6">Top 12 Search Ads Campaign Structure & lot more</p>
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-12 gap-4 max-w-4xl mx-auto">
              {[
                { name: 'SKAG', icon: Zap, gradient: 'from-yellow-400 to-orange-500' },
                { name: 'STAG', icon: TrendingUp, gradient: 'from-blue-400 to-indigo-500' },
                { name: 'Intent-Based', icon: Target, gradient: 'from-pink-400 to-rose-500' },
                { name: 'Alpha-Beta', icon: Layers, gradient: 'from-teal-400 to-cyan-500' },
                { name: 'Brand Split', icon: Shield, gradient: 'from-purple-400 to-violet-500' },
                { name: 'Geo-Targeted', icon: MapPin, gradient: 'from-green-400 to-emerald-500' },
                { name: 'Device-Specific', icon: Smartphone, gradient: 'from-red-400 to-pink-500' },
                { name: 'Audience-Based', icon: Users, gradient: 'from-indigo-400 to-blue-500' },
                { name: 'Long-Tail Master', icon: Search, gradient: 'from-amber-400 to-yellow-500' },
                { name: 'Seasonal Sprint', icon: Calendar, gradient: 'from-rose-400 to-red-500' },
                { name: 'Funnel-Based', icon: Filter, gradient: 'from-cyan-400 to-teal-500' },
                { name: 'Performance Max', icon: Rocket, gradient: 'from-orange-400 to-red-500' },
              ].map((structure, index) => (
                <motion.div
                  key={structure.name}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.7 + index * 0.05 }}
                  whileHover={{ scale: 1.15, y: -5 }}
                  className="group cursor-pointer"
                  title={structure.name}
                >
                  <div className={`w-12 h-12 mx-auto bg-gradient-to-br ${structure.gradient} rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all`}>
                    <structure.icon className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-xs text-gray-400 mt-2 text-center opacity-0 group-hover:opacity-100 transition-opacity truncate">
                    {structure.name}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Campaign Structures Section */}
      <CampaignStructuresSection onGetStarted={onGetStarted} />

      {/* Builder 2.0 Campaign Wizard Section */}
      <CampaignWizardSection onGetStarted={onGetStarted} />

      {/* Templates & Presets Section */}
      <TemplatesPresetsSection onGetStarted={onGetStarted} />

      {/* AI-Powered Ad Creation Section */}
      <AIAdCreationSection onGetStarted={onGetStarted} />

      {/* Social Proof Section */}
      <SocialProofSection />

      {/* Pricing Section */}
      <PricingSection onSelectPlan={onSelectPlan} />

      {/* Final CTA */}
      <FinalCTA onGetStarted={onGetStarted} />

      {/* Footer */}
      <Footer onNavigateToPolicy={onNavigateToPolicy} onNavigateToApp={onNavigateToApp} />
    </div>
  );
}

// Navigation Component
function Navigation({ onGetStarted, onLogin }: { onGetStarted?: () => void; onLogin?: () => void }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-slate-950/80 backdrop-blur-xl border-b border-white/10' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <motion.div 
            className="flex items-center gap-3"
            whileHover={{ scale: 1.05 }}
          >
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-black text-xl">A</span>
            </div>
            <span className="text-white font-bold text-xl">adiology</span>
          </motion.div>

          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-gray-300 hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="text-gray-300 hover:text-white transition-colors">Pricing</a>
            <button onClick={onLogin} className="text-gray-300 hover:text-white transition-colors">Sign In</button>
            <motion.button
              onClick={onGetStarted}
              className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg font-semibold"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Get Started
            </motion.button>
          </div>

          <button 
            className="md:hidden text-white"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? '✕' : '☰'}
          </button>
        </div>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden mt-4 pb-4 space-y-3"
            >
              <a href="#features" className="block text-gray-300 hover:text-white">Features</a>
              <a href="#pricing" className="block text-gray-300 hover:text-white">Pricing</a>
              <button onClick={onLogin} className="block w-full text-left text-gray-300 hover:text-white">Sign In</button>
              <button onClick={onGetStarted} className="w-full px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg font-semibold">
                Get Started
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
}

// Campaign Structures Section
function CampaignStructuresSection({ onGetStarted }: { onGetStarted?: () => void }) {
  const structures = [
    { name: 'SKAG', number: 1, gradient: 'from-red-400 to-pink-500', icon: '🎯' },
    { name: 'STAG+', number: 2, gradient: 'from-blue-400 to-indigo-500', icon: '📊' },
    { name: 'Alpha-Beta', number: 3, gradient: 'from-teal-400 to-cyan-500', icon: '⚔️' },
    { name: 'Intent-Based', number: 4, gradient: 'from-pink-400 to-rose-500', icon: '🧠' },
    { name: 'Smart Cluster', number: 5, gradient: 'from-green-400 to-emerald-500', icon: '🔮' },
    { name: 'Funnel-Based', number: 6, gradient: 'from-yellow-400 to-orange-500', icon: '🚀' },
    { name: 'Geo-Precision', number: 7, gradient: 'from-red-500 to-orange-500', icon: '📍' },
    { name: 'Competitor Conquest', number: 8, gradient: 'from-blue-500 to-purple-500', icon: '⚔️' },
    { name: 'Long-Tail Master', number: 9, gradient: 'from-green-500 to-teal-500', icon: '🏔️' },
    { name: 'RLSA Pro', number: 10, gradient: 'from-purple-400 to-pink-500', icon: '👁️' },
    { name: 'Seasonal Sprint', number: 11, gradient: 'from-pink-400 to-purple-500', icon: '⏰' },
    { name: 'High-Intent DSA', number: 12, gradient: 'from-yellow-400 to-amber-500', icon: '⚡' },
  ];

  const powerFeatures = [
    { icon: '🌐', title: '30+ Website Templates', description: 'Edit and go live in 30 seconds', gradient: 'from-orange-400 to-red-500' },
    { icon: '📋', title: '30+ Preset Google Campaigns', description: 'Ready for all verticals', gradient: 'from-pink-400 to-purple-500' },
    { icon: '👁️', title: 'Live Ad Preview', description: 'See preview while adding 10+ extension types', gradient: 'from-blue-400 to-indigo-500' },
    { icon: '📍', title: 'Zip & City Targeting', description: 'Target up to 30,000 zips in one go', gradient: 'from-purple-400 to-pink-500' },
  ];

  return (
    <section className="relative py-24 px-6 bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-black mb-6">
            <span className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 bg-clip-text text-transparent">
              Launch Complete Google Ads Infrastructure in Minutes — Not Weeks.
            </span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-12">
          {structures.map((structure, index) => (
            <motion.div
              key={structure.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.05, y: -5 }}
              className="bg-white rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all cursor-pointer border border-gray-100"
            >
              <div className={`w-14 h-14 mx-auto mb-3 bg-gradient-to-br ${structure.gradient} rounded-xl flex items-center justify-center shadow-md`}>
                <span className="text-2xl">{structure.icon}</span>
              </div>
              <h3 className="text-sm font-bold text-gray-900 text-center mb-1">{structure.name}</h3>
              <p className={`text-xs text-center font-medium bg-gradient-to-r ${structure.gradient} bg-clip-text text-transparent`}>
                Structure #{structure.number}
              </p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8"
        >
          <p className="text-gray-600 text-lg mb-6">
            Select Prebuilt Structures → Select Prebuilt Campaigns → Readymade Website templates → Launch Ads like Guru's.
          </p>
          <motion.button
            onClick={onGetStarted}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-4 bg-gradient-to-r from-orange-400 via-pink-500 to-purple-500 text-white rounded-full font-semibold shadow-lg hover:shadow-xl transition-all"
          >
            🔥 All 12 Structures Available Instantly 🔥
          </motion.button>
        </motion.div>

        <div className="mt-20">
          <div className="flex items-center justify-center mb-10">
            <div className="h-px bg-gray-200 flex-1 max-w-xs" />
            <span className="px-6 text-gray-500 text-sm font-medium">Plus More Powerful Features</span>
            <div className="h-px bg-gray-200 flex-1 max-w-xs" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {powerFeatures.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.03 }}
                className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all border border-gray-100"
              >
                <div className={`w-14 h-14 mb-4 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center shadow-md`}>
                  <span className="text-2xl">{feature.icon}</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-500 text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <motion.button
              onClick={onGetStarted}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full font-semibold shadow-lg hover:shadow-xl transition-all flex items-center gap-2 mx-auto"
            >
              Explore All Features
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// Builder 2.0 Campaign Wizard Section
function CampaignWizardSection({ onGetStarted }: { onGetStarted?: () => void }) {
  const [activeTab, setActiveTab] = useState<'zips' | 'cities'>('zips');
  
  const features = [
    { title: 'Smart Zip Targeting', description: 'Target 30,000 zip codes or 500 cities with precision instantly' },
    { title: 'Live Campaign Preview', description: 'See your campaign exactly as it will appear before going live' },
    { title: '30-Second Launch', description: 'From start to live in just 30 seconds with no complex setup' },
    { title: 'Complete Preset Library', description: 'Every aspect has a preset: keywords, audiences, bids, schedules' },
  ];

  const tags = ['Quick Launches', 'Geo-Targeted Campaigns', 'Multi-City Campaigns', 'Preset Campaigns', 'A/B Testing', 'Rapid Deployment'];

  return (
    <section className="relative py-24 px-6 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <span className="inline-block px-4 py-2 bg-orange-100 text-orange-600 rounded-full text-sm font-medium mb-6">
              Builder 2.0 Campaign Wizard
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              See Everything Live and Go Live in <span className="text-orange-500">30 Seconds</span>
            </h2>
            <p className="text-gray-600 mb-8 text-lg">
              Builder 2.0 makes campaign creation effortless. With zip targeting of 30,000 zips or 500 cities, live previews, and complete presets for everything, launching campaigns has never been faster.
            </p>
            
            <div className="space-y-4 mb-8">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start gap-3"
                >
                  <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{feature.title}</h4>
                    <p className="text-gray-500 text-sm">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.button
              onClick={onGetStarted}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
            >
              Try Campaign Wizard
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </motion.div>

          {/* Right Card */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            {/* Time to Launch Badge */}
            <div className="absolute -top-4 -right-4 z-20 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-3 rounded-xl shadow-lg">
              <div className="text-xs opacity-80">Time to Launch</div>
              <div className="text-2xl font-bold flex items-center gap-1">
                <Zap className="w-5 h-5" /> 30s
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
              {/* Card Header */}
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-white">
                <div className="text-sm opacity-80">Campaign Wizard</div>
                <h3 className="text-2xl font-bold">Launch Your Campaign</h3>
              </div>

              <div className="p-6">
                {/* Geographic Targeting */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">📍</span>
                    <span className="text-gray-700 font-medium">Geographic Targeting</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setActiveTab('zips')}
                      className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                        activeTab === 'zips'
                          ? 'bg-orange-50 text-orange-600 border-2 border-orange-200'
                          : 'bg-gray-50 text-gray-500 border-2 border-transparent'
                      }`}
                    >
                      30,000 Zip Codes
                    </button>
                    <button
                      onClick={() => setActiveTab('cities')}
                      className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                        activeTab === 'cities'
                          ? 'bg-orange-50 text-orange-600 border-2 border-orange-200'
                          : 'bg-gray-50 text-gray-500 border-2 border-transparent'
                      }`}
                    >
                      500 Cities
                    </button>
                  </div>
                </div>

                {/* Template Preview */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">📋</span>
                    <span className="text-gray-700 font-medium">Template</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-16 bg-orange-100 rounded-lg" />
                    ))}
                  </div>
                </div>

                {/* Preview Button */}
                <button className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2">
                  Preview & Go Live
                  <ArrowRight className="w-5 h-5" />
                </button>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mt-6">
                  <div className="text-center p-3 bg-gray-50 rounded-xl">
                    <div className="text-2xl font-bold text-gray-900">30K</div>
                    <div className="text-xs text-gray-500">Zip Codes</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-xl">
                    <div className="text-2xl font-bold text-gray-900">500</div>
                    <div className="text-xs text-gray-500">Cities</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-xl">
                    <div className="text-2xl font-bold text-gray-900">30s</div>
                    <div className="text-xs text-gray-500">Launch Time</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Bottom Tags */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 flex flex-wrap items-center justify-center gap-3"
        >
          <span className="text-gray-500 text-sm">Perfect for:</span>
          {tags.map((tag) => (
            <span key={tag} className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm text-gray-600 hover:border-orange-300 hover:text-orange-600 transition-colors cursor-default">
              {tag}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// Templates & Presets Section
function TemplatesPresetsSection({ onGetStarted }: { onGetStarted?: () => void }) {
  const [activeTab, setActiveTab] = useState<'templates' | 'presets'>('templates');
  
  const features = [
    { title: 'Instant Deployment', description: '30+ professional templates ready to go live in seconds' },
    { title: 'Industry-Optimized Campaigns', description: '30+ pre-configured Google Ad campaigns for all verticals' },
    { title: 'Zero Coding Required', description: 'Edit text and images—launch without technical knowledge' },
    { title: 'Complete Workflow', description: 'Website + campaigns working together from day one' },
  ];

  const featureBadges = [
    { icon: '📱', label: 'Mobile Optimized' },
    { icon: '🔍', label: 'SEO Ready' },
    { icon: '📈', label: 'High Converting' },
    { icon: '⚡', label: 'Instant Deploy' },
    { icon: '🚀', label: 'Fast Loading' },
  ];

  const industries = ['Plumber', 'Electrician', 'Law Firm', 'Pest Control', 'Lawn Care', 'Flight', 'HVAC', 'Roofing', 'Dentist', 'Real Estate'];

  return (
    <section className="relative py-24 px-6 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <span className="inline-block px-4 py-2 bg-indigo-100 text-indigo-600 rounded-full text-sm font-medium mb-6">
              Ready to Launch in 30 Seconds
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              <span className="text-teal-500">30+ Templates</span> & <span className="text-teal-500">30+ Presets</span>
            </h2>
            <p className="text-gray-600 mb-8 text-lg">
              Professional, conversion-optimized landing page templates paired with pre-configured Google Ad campaigns for every industry. Simply edit text, images, and launch—no coding, no hassle. From electricians to law firms, we've got you covered.
            </p>
            
            <div className="space-y-4 mb-8">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start gap-3"
                >
                  <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{feature.title}</h4>
                    <p className="text-gray-500 text-sm">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.button
              onClick={onGetStarted}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
            >
              Explore Templates & Presets
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </motion.div>

          {/* Right Card */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            {/* Combined Badge */}
            <div className="absolute -top-4 -right-4 z-20 bg-gradient-to-r from-purple-500 to-pink-600 text-white px-4 py-3 rounded-xl shadow-lg">
              <div className="text-xs opacity-80">Combined</div>
              <div className="text-2xl font-bold flex items-center gap-1">
                <Sparkles className="w-5 h-5" /> 60+
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
              {/* Tabs */}
              <div className="flex">
                <button
                  onClick={() => setActiveTab('templates')}
                  className={`flex-1 py-4 px-6 font-medium flex items-center justify-center gap-2 transition-all ${
                    activeTab === 'templates'
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
                      : 'bg-gray-50 text-gray-500'
                  }`}
                >
                  <span>📄</span> 30+ Templates
                </button>
                <button
                  onClick={() => setActiveTab('presets')}
                  className={`flex-1 py-4 px-6 font-medium flex items-center justify-center gap-2 transition-all ${
                    activeTab === 'presets'
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
                      : 'bg-gray-50 text-gray-500'
                  }`}
                >
                  <span>🚀</span> 30+ Presets
                </button>
              </div>

              <div className="p-6">
                {/* Template Preview Grid */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-pink-100 rounded-lg flex items-center justify-center">
                      <span>📋</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="h-24 bg-gradient-to-b from-yellow-100 to-yellow-50 rounded-lg" />
                    <div className="h-24 bg-gradient-to-b from-pink-100 to-pink-50 rounded-lg" />
                    <div className="h-24 bg-gradient-to-b from-purple-100 to-purple-50 rounded-lg" />
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-3 bg-purple-50 rounded-xl">
                    <div className="text-2xl font-bold text-purple-600">30+</div>
                    <div className="text-xs text-gray-500">Templates</div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-xl">
                    <div className="text-2xl font-bold text-purple-600">100%</div>
                    <div className="text-xs text-gray-500">Mobile Ready</div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-xl">
                    <div className="text-2xl font-bold text-purple-600">30s</div>
                    <div className="text-xs text-gray-500">Go Live</div>
                  </div>
                </div>

                {/* Feature Badges */}
                <div className="grid grid-cols-2 gap-3">
                  {featureBadges.map((badge) => (
                    <div key={badge.label} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                      <span>{badge.icon}</span>
                      <span className="text-sm text-gray-700">{badge.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Bottom Tags */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 flex flex-wrap items-center justify-center gap-3"
        >
          <span className="text-gray-500 text-sm">Available for:</span>
          {industries.map((industry) => (
            <span key={industry} className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm text-gray-600 hover:border-indigo-300 hover:text-indigo-600 transition-colors cursor-default">
              {industry}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// AI-Powered Ad Creation Section
function AIAdCreationSection({ onGetStarted }: { onGetStarted?: () => void }) {
  const features = [
    { title: 'Maximum Ad Rank', description: 'AI optimizes every element for the highest Quality Score' },
    { title: 'Beat Competitors', description: 'Advanced analysis ensures you outperform competition' },
    { title: 'All Extension Types', description: 'Automatically creates all relevant Google extensions' },
    { title: 'Instant Generation', description: 'Complete ad sets generated in seconds, not hours' },
  ];

  const extensions = [
    { name: 'Sitelink Extensions', icon: '🔗' },
    { name: 'Callout Extensions', icon: '📢' },
    { name: 'Structured Snippets', icon: '📋' },
    { name: 'Call Extensions', icon: '📞' },
    { name: 'Location Extensions', icon: '📍' },
    { name: 'Price Extensions', icon: '💰' },
    { name: 'App Extensions', icon: '📱' },
    { name: 'Promotion Extensions', icon: '🎁' },
    { name: 'Image Extensions', icon: '🖼️' },
    { name: 'Lead Form Extensions', icon: '📝' },
  ];

  const industries = ['E-commerce', 'SaaS', 'B2B', 'Local Business', 'Lead Generation', 'App Install'];

  return (
    <section className="relative py-24 px-6 bg-gradient-to-b from-purple-50 to-white">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <span className="inline-block px-4 py-2 bg-purple-100 text-purple-600 rounded-full text-sm font-medium mb-6">
              AI-Powered Ad Creation
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              AI Builds Your <span className="text-purple-600">High-Quality Ads</span> & Extensions
            </h2>
            <p className="text-gray-600 mb-8 text-lg">
              Our AI automatically creates super high-quality ads and all Google extensions to maximize your Ad Rank and beat your competitors from day one with Adiology.
            </p>
            
            <div className="space-y-4 mb-8">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start gap-3"
                >
                  <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{feature.title}</h4>
                    <p className="text-gray-500 text-sm">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.button
              onClick={onGetStarted}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-gradient-to-r from-purple-500 to-purple-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
            >
              Let AI Build Your Ads
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </motion.div>

          {/* Right Card */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            {/* Coverage Badge */}
            <div className="absolute -top-4 -right-4 z-20 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-3 rounded-xl shadow-lg">
              <div className="text-xs opacity-80">Coverage</div>
              <div className="text-2xl font-bold flex items-center gap-1">
                <Check className="w-5 h-5" /> 100%
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
              {/* Card Header */}
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                    <span className="text-2xl">🧩</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Complete Extension Coverage</h3>
                    <p className="text-gray-500 text-sm">All 10 extension types included</p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                {/* Extensions Grid */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {extensions.map((ext) => (
                    <div key={ext.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <span>{ext.icon}</span>
                        <span className="text-sm text-gray-700">{ext.name}</span>
                      </div>
                      <Check className="w-4 h-4 text-green-500" />
                    </div>
                  ))}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-purple-50 rounded-xl">
                    <div className="text-2xl font-bold text-purple-600">10/10</div>
                    <div className="text-xs text-gray-500">Quality Score</div>
                  </div>
                  <div className="text-center p-3 bg-indigo-50 rounded-xl">
                    <div className="text-2xl font-bold text-indigo-600">+340%</div>
                    <div className="text-xs text-gray-500">CTR Boost</div>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded-xl">
                    <div className="text-2xl font-bold text-orange-600">&lt;10s</div>
                    <div className="text-xs text-gray-500">Generation</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Bottom Tags */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 flex flex-wrap items-center justify-center gap-3"
        >
          <span className="text-gray-500 text-sm">Perfect for:</span>
          {industries.map((industry) => (
            <span key={industry} className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm text-gray-600 hover:border-purple-300 hover:text-purple-600 transition-colors cursor-default">
              {industry}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// Social Proof Section
function SocialProofSection() {
  const [counters, setCounters] = useState({ users: 0, campaigns: 0, savings: 0 });

  useEffect(() => {
    const targets = { users: 10000, campaigns: 50000, savings: 95 };
    const duration = 2000;
    const steps = 60;
    const increment = duration / steps;

    const interval = setInterval(() => {
      setCounters(prev => ({
        users: Math.min(prev.users + Math.ceil(targets.users / steps), targets.users),
        campaigns: Math.min(prev.campaigns + Math.ceil(targets.campaigns / steps), targets.campaigns),
        savings: Math.min(prev.savings + targets.savings / steps, targets.savings),
      }));
    }, increment);

    return () => clearInterval(interval);
  }, []);

  const testimonials = [
    {
      quote: "Cut our campaign setup time from weeks to minutes. This is a game-changer.",
      author: "Sarah Chen",
      role: "Marketing Director",
      company: "TechCorp"
    },
    {
      quote: "The AI ad builder alone is worth 10x the price. Incredible quality.",
      author: "Michael Rodriguez",
      role: "PPC Manager",
      company: "Growth Agency"
    },
    {
      quote: "Finally, a tool that understands how campaigns actually work.",
      author: "Emily Johnson",
      role: "Founder",
      company: "StartupXYZ"
    }
  ];

  return (
    <section className="relative py-32 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <h2 className="text-4xl md:text-5xl font-black mb-6 text-white">
            Trusted by <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Industry Leaders</span>
          </h2>
        </motion.div>

        {/* Animated Counters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {[
            { value: counters.users, label: 'Happy Users', suffix: '+' },
            { value: counters.campaigns, label: 'Campaigns Launched', suffix: '+' },
            { value: counters.savings, label: 'Time Saved', suffix: '%' },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 text-center"
            >
              <motion.div
                className="text-5xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-4"
                key={stat.value}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
              >
                {stat.value.toLocaleString()}{stat.suffix}
              </motion.div>
              <div className="text-gray-300 text-lg">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Testimonials */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 hover:border-white/30 transition-all"
            >
              <div className="text-yellow-400 mb-4">★★★★★</div>
              <p className="text-gray-300 mb-6 leading-relaxed">"{testimonial.quote}"</p>
              <div>
                <div className="text-white font-semibold">{testimonial.author}</div>
                <div className="text-gray-400 text-sm">{testimonial.role}, {testimonial.company}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Pricing Section
function PricingSection({ onSelectPlan }: { onSelectPlan?: (planName: string, priceId: string, amount: number, isSubscription: boolean) => void }) {
  const [isAnnual, setIsAnnual] = useState(false);
  
  const getPricingPlans = () => {
    if (isAnnual) {
      return [
        {
          name: 'Basic',
          price: '$55.99',
          originalPrice: '$69.99',
          period: 'per month, billed annually',
          icon: '🚀',
          gradient: 'from-blue-400 to-blue-600',
          features: [
            '25 campaigns per month',
            '2 team members',
            '70+ campaign presets for all verticals',
            'Geo targeting: cities, states, 15,000+ zip codes',
            'Keywords mixer & planner',
            'Live ad preview (RSA, DKI, Call-Only)',
            '10+ Google Ads assets & extensions',
            'CSV export to Google Ads',
            'Email support'
          ],
          popular: false,
          priceId: 'price_basic_annual',
          amount: 67188,
          isSubscription: true
        },
        {
          name: 'Pro',
          price: '$103.99',
          originalPrice: '$129.99',
          period: 'per month, billed annually',
          icon: '⚡',
          gradient: 'from-purple-500 to-purple-700',
          features: [
            'Unlimited campaigns',
            '5 team members',
            '70+ campaign presets for all verticals',
            'Geo targeting: cities, states, 15,000+ zip codes',
            'Keywords mixer & planner',
            'Live ad preview (RSA, DKI, Call-Only)',
            '10+ Google Ads assets & extensions',
            'CSV export to Google Ads',
            '24/7 priority support'
          ],
          popular: true,
          priceId: 'price_pro_annual',
          amount: 124788,
          isSubscription: true
        },
        {
          name: 'Lifetime',
          price: '$49.99',
          period: 'one-time payment',
          icon: '👑',
          gradient: 'from-pink-500 to-purple-600',
          features: [
            '10 campaigns per month',
            '1 team member',
            '20+ campaign presets for all verticals',
            'Geo targeting: Countries',
            'Keywords mixer & planner',
            'Live ad preview (RSA, DKI, Call-Only)',
            '10+ Google Ads assets & extensions',
            'CSV export to Google Ads',
            'Email support',
            'Chat support'
          ],
          popular: false,
          priceId: 'price_lifetime',
          amount: 4999,
          isSubscription: false
        }
      ];
    }
    
    return [
      {
        name: 'Basic',
        price: '$69.99',
        period: 'per month',
        icon: '🚀',
        gradient: 'from-blue-400 to-blue-600',
        features: [
          '25 campaigns per month',
          '2 team members',
          '70+ campaign presets for all verticals',
          'Geo targeting: cities, states, 15,000+ zip codes',
          'Keywords mixer & planner',
          'Live ad preview (RSA, DKI, Call-Only)',
          '10+ Google Ads assets & extensions',
          'CSV export to Google Ads',
          'Email support'
        ],
        popular: false,
        priceId: 'price_basic_monthly',
        amount: 6999,
        isSubscription: true
      },
      {
        name: 'Pro',
        price: '$129.99',
        period: 'per month',
        icon: '⚡',
        gradient: 'from-purple-500 to-purple-700',
        features: [
          'Unlimited campaigns',
          '5 team members',
          '70+ campaign presets for all verticals',
          'Geo targeting: cities, states, 15,000+ zip codes',
          'Keywords mixer & planner',
          'Live ad preview (RSA, DKI, Call-Only)',
          '10+ Google Ads assets & extensions',
          'CSV export to Google Ads',
          '24/7 priority support'
        ],
        popular: true,
        priceId: 'price_pro_monthly',
        amount: 12999,
        isSubscription: true
      },
      {
        name: 'Lifetime',
        price: '$49.99',
        period: 'one-time payment',
        icon: '👑',
        gradient: 'from-pink-500 to-purple-600',
        features: [
          '10 campaigns per month',
          '1 team member',
          '20+ campaign presets for all verticals',
          'Geo targeting: Countries',
          'Keywords mixer & planner',
          'Live ad preview (RSA, DKI, Call-Only)',
          '10+ Google Ads assets & extensions',
          'CSV export to Google Ads',
          'Email support',
          'Chat support'
        ],
        popular: false,
        priceId: 'price_lifetime',
        amount: 4999,
        isSubscription: false
      }
    ];
  };

  const pricingPlans = getPricingPlans();

  return (
    <section id="pricing" className="relative py-32 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mb-6">
            <span className="text-white">Choose Your </span>
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
              Perfect Plan
            </span>
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            No hidden fees. Cancel anytime. 14-day money back guarantee.
          </p>
        </motion.div>

        {/* Monthly/Annual Toggle */}
        <div className="flex items-center justify-center gap-4 mb-12">
          <span className={`text-lg font-medium ${!isAnnual ? 'text-white' : 'text-gray-400'}`}>Monthly</span>
          <button
            onClick={() => setIsAnnual(!isAnnual)}
            className={`relative w-16 h-8 rounded-full transition-colors ${isAnnual ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-gray-600'}`}
          >
            <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg transition-transform ${isAnnual ? 'translate-x-9' : 'translate-x-1'}`} />
          </button>
          <span className={`text-lg font-medium ${isAnnual ? 'text-white' : 'text-gray-400'}`}>Annually</span>
          {isAnnual && (
            <span className="px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-sm font-bold rounded-full">
              Save 20%
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {pricingPlans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`relative group ${plan.popular ? 'lg:-mt-4 lg:mb-4' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                  <div className="px-4 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full text-xs font-semibold shadow-lg">
                    Most Popular
                  </div>
                </div>
              )}
              
              <div className={`
                h-full bg-white/5 backdrop-blur-xl border rounded-3xl p-8 
                ${plan.popular ? 'border-purple-500/50 shadow-2xl shadow-purple-500/20' : 'border-white/10'}
                hover:border-white/30 transition-all
              `}>
                <div className={`w-full h-20 bg-gradient-to-r ${plan.gradient} rounded-2xl flex items-center justify-center mb-6 shadow-lg`}>
                  <span className="text-4xl">{plan.icon}</span>
                </div>

                <h3 className="text-2xl font-bold text-white text-center mb-2">{plan.name}</h3>
                
                <div className="text-center mb-1">
                  {'originalPrice' in plan && plan.originalPrice && (
                    <span className="text-lg text-gray-500 line-through mr-2">{plan.originalPrice}</span>
                  )}
                  <span className="text-4xl font-black text-white">{plan.price}</span>
                </div>
                <div className="text-gray-400 text-sm text-center mb-6">{plan.period}</div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${plan.gradient} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                        <Check className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-gray-300 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <motion.button
                  onClick={() => onSelectPlan?.(plan.name, plan.priceId, plan.amount, plan.isSubscription)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`
                    w-full py-4 rounded-xl font-semibold transition-all
                    ${plan.popular 
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg hover:shadow-xl' 
                      : 'bg-white/10 text-white border border-white/20 hover:bg-white/20'}
                  `}
                >
                  Get Started
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Final CTA Section
function FinalCTA({ onGetStarted }: { onGetStarted?: () => void }) {
  return (
    <section className="relative py-32 px-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative bg-gradient-to-br from-purple-600 via-blue-600 to-pink-600 rounded-3xl p-12 md:p-16 text-center overflow-hidden"
        >
          {/* Animated Background */}
          <div className="absolute inset-0 opacity-20">
            <motion.div
              className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full blur-3xl"
              animate={{
                x: [0, 100, 0],
                y: [0, 100, 0],
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                ease: 'linear'
              }}
            />
            <motion.div
              className="absolute bottom-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl"
              animate={{
                x: [0, -100, 0],
                y: [0, -100, 0],
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                ease: 'linear',
                delay: 5
              }}
            />
          </div>

          <div className="relative z-10">
            <motion.h2
              className="text-4xl md:text-5xl lg:text-6xl font-black mb-6 text-white"
              initial={{ scale: 0.9 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
            >
              Ready to Transform
              <br />
              Your Campaigns?
            </motion.h2>
            <motion.p
              className="text-xl text-white/90 mb-10 max-w-2xl mx-auto"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              Join thousands of marketers who've already made the switch. Start your journey today—no credit card required.
            </motion.p>
            <motion.button
              onClick={onGetStarted}
              className="group relative px-12 py-6 bg-white text-purple-600 rounded-2xl font-black text-xl overflow-hidden"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.span
                className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 opacity-0 group-hover:opacity-100 transition-opacity"
              />
              <span className="relative z-10 flex items-center gap-3">
                Start Your Journey Now
                <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
              </span>
            </motion.button>
            <motion.div
              className="mt-8 flex items-center justify-center gap-6 text-white/80 text-sm"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
            >
              <div className="flex items-center gap-2">
                <span>✓</span>
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <span>✓</span>
                <span>Setup in minutes</span>
              </div>
              <div className="flex items-center gap-2">
                <span>✓</span>
                <span>14-day money back</span>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// Footer Component
function Footer({ onNavigateToPolicy, onNavigateToApp }: { onNavigateToPolicy?: (policy: string) => void; onNavigateToApp?: (tab: string) => void }) {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    product: [
      { label: 'Features', href: '#features', type: 'scroll' as const },
      { label: 'Pricing', href: '#pricing', type: 'scroll' as const },
      { label: 'Campaign Builder', tab: 'one-click-builder', type: 'app' as const },
      { label: 'Keyword Planner', tab: 'keyword-planner', type: 'app' as const },
      { label: 'Ad Generator', tab: 'one-click-builder', type: 'app' as const },
    ],
    resources: [
      { label: 'Documentation', tab: 'support-help', type: 'app' as const },
      { label: 'Help Center', tab: 'support-help', type: 'app' as const },
      { label: 'Blog', tab: 'blog', type: 'app' as const },
      { label: 'API Reference', href: 'https://docs.adiology.io/api', type: 'external' as const },
      { label: 'Tutorials', tab: 'support-help', type: 'app' as const },
    ],
    legal: [
      { label: 'Privacy Policy', action: 'privacy' as const },
      { label: 'Terms of Service', action: 'terms' as const },
      { label: 'Cookie Policy', action: 'cookie' as const },
      { label: 'GDPR Compliance', action: 'gdpr' as const },
      { label: 'Refund Policy', action: 'refund' as const },
    ],
    company: [
      { label: 'About Us', href: '#features', type: 'scroll' as const },
      { label: 'Contact', href: 'mailto:support@adiology.io', type: 'external' as const },
      { label: 'Careers', href: 'mailto:careers@adiology.io', type: 'external' as const },
      { label: 'Partners', href: 'mailto:partners@adiology.io', type: 'external' as const },
    ],
  };

  return (
    <footer className="relative bg-slate-950 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-12">
          {/* Brand & Contact */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">A</span>
              </div>
              <span className="text-xl font-bold text-white">adiology</span>
            </div>
            <p className="text-gray-400 mb-6 max-w-xs">
              The all-in-one platform for building, managing, and optimizing Google Ads campaigns at scale.
            </p>
            <div className="space-y-3">
              <a href="mailto:support@adiology.io" className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors">
                <Mail className="w-5 h-5" />
                <span>support@adiology.io</span>
              </a>
              <div className="flex items-center gap-3 text-gray-400">
                <MapPin className="w-5 h-5" />
                <span>San Francisco, CA</span>
              </div>
            </div>
            {/* Social Links */}
            <div className="flex gap-4 mt-6">
              <a href="#" className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center text-gray-400 hover:bg-white/10 hover:text-white transition-all">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center text-gray-400 hover:bg-white/10 hover:text-white transition-all">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center text-gray-400 hover:bg-white/10 hover:text-white transition-all">
                <Youtube className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Product</h4>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.label}>
                  {link.type === 'app' ? (
                    <button 
                      onClick={() => onNavigateToApp?.(link.tab!)}
                      className="text-gray-400 hover:text-white transition-colors text-sm text-left"
                    >
                      {link.label}
                    </button>
                  ) : (
                    <a href={link.href} className="text-gray-400 hover:text-white transition-colors text-sm">
                      {link.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Resources</h4>
            <ul className="space-y-3">
              {footerLinks.resources.map((link) => (
                <li key={link.label}>
                  {link.type === 'app' ? (
                    <button 
                      onClick={() => onNavigateToApp?.(link.tab!)}
                      className="text-gray-400 hover:text-white transition-colors text-sm text-left"
                    >
                      {link.label}
                    </button>
                  ) : (
                    <a 
                      href={link.href} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-white transition-colors text-sm"
                    >
                      {link.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Legal</h4>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <button 
                    onClick={() => onNavigateToPolicy?.(link.action)} 
                    className="text-gray-400 hover:text-white transition-colors text-sm text-left"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Company</h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  {link.type === 'external' ? (
                    <a 
                      href={link.href} 
                      target={link.href?.startsWith('mailto:') ? undefined : '_blank'}
                      rel={link.href?.startsWith('mailto:') ? undefined : 'noopener noreferrer'}
                      className="text-gray-400 hover:text-white transition-colors text-sm"
                    >
                      {link.label}
                    </a>
                  ) : (
                    <a href={link.href} className="text-gray-400 hover:text-white transition-colors text-sm">
                      {link.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 pt-8 border-t border-white/10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 text-sm">
              &copy; {currentYear} Adiology. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <button onClick={() => onNavigateToPolicy?.('privacy')} className="hover:text-white transition-colors">Privacy</button>
              <button onClick={() => onNavigateToPolicy?.('terms')} className="hover:text-white transition-colors">Terms</button>
              <button onClick={() => onNavigateToPolicy?.('cookie')} className="hover:text-white transition-colors">Cookies</button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

