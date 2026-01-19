import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Check, Mail, Phone, MapPin, Send } from 'lucide-react';

// ============================================
// ICONS
// ============================================
function MenuIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" x2="20" y1="12" y2="12" />
      <line x1="4" x2="20" y1="6" y2="6" />
      <line x1="4" x2="20" y1="18" y2="18" />
    </svg>
  );
}

function XIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

function ArrowRight({ size = 24, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

// ============================================
// NAVIGATION
// ============================================
interface NavigationProps {
  onGetStarted?: () => void;
  onLogin?: () => void;
}

function Navigation({ onGetStarted, onLogin }: NavigationProps) {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { name: 'Features', href: '#features' },
    { name: 'Pricing', href: '#pricing' }
  ];

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setIsOpen(false);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <motion.div className="flex items-center gap-2" whileHover={{ scale: 1.02 }}>
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">A</span>
            </div>
            <span className="text-gray-900 font-semibold">adiology</span>
          </motion.div>

          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <a
                key={item.name}
                href={item.href}
                onClick={(e) => scrollToSection(e, item.href)}
                className="text-gray-600 hover:text-gray-900 transition-colors text-sm"
              >
                {item.name}
              </a>
            ))}
            <button 
              onClick={onLogin}
              className="px-5 py-2 text-gray-600 hover:text-gray-900 transition-colors text-sm"
            >
              Sign In
            </button>
            <button 
              onClick={onGetStarted}
              className="px-5 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg text-sm hover:shadow-lg transition-shadow"
            >
              Get Started
            </button>
          </div>

          <button className="md:hidden text-gray-900" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <XIcon size={24} /> : <MenuIcon size={24} />}
          </button>
        </div>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden mt-4 pb-4"
            >
              {navItems.map((item, index) => (
                <motion.a
                  key={item.name}
                  href={item.href}
                  onClick={(e) => scrollToSection(e, item.href)}
                  className="block py-2 text-gray-600 hover:text-gray-900 transition-colors"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  {item.name}
                </motion.a>
              ))}
              <button 
                onClick={onLogin}
                className="block w-full text-left py-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                Sign In
              </button>
              <button 
                onClick={onGetStarted}
                className="w-full mt-4 px-5 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg text-sm"
              >
                Get Started
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
}

// ============================================
// HERO
// ============================================
interface HeroProps {
  onGetStarted?: () => void;
}

function Hero({ onGetStarted }: HeroProps) {
  return (
    <section className="pt-32 pb-20 px-6 bg-gradient-to-b from-blue-50/30 to-white">
      <div className="max-w-7xl mx-auto">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6"
          >
            Why guess campaigns when you can <span className="text-blue-600">copy what actually works?</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-gray-600 text-lg mb-10 max-w-3xl mx-auto"
          >
            Elevate your Ad campaigns with Adiology's advanced campaign management platform. Build, launch, and optimize campaigns faster than you ever imagined.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-wrap gap-4 justify-center"
          >
            <button 
              onClick={onGetStarted}
              className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:shadow-xl transition-all flex items-center gap-2 group"
            >
              Get Started
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button 
              onClick={onGetStarted}
              className="px-8 py-3 bg-white text-gray-700 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all"
            >
              Contact Sales
            </button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ============================================
// FEATURES
// ============================================
interface FeaturesProps {
  onGetStarted?: () => void;
}

const campaignStructures = [
  { name: 'SKAG', icon: '🎯', color: 'from-blue-400 to-blue-600' },
  { name: 'STAG+', icon: '📊', color: 'from-purple-400 to-purple-600' },
  { name: 'Alpha-Beta', icon: '🔬', color: 'from-indigo-400 to-indigo-600' },
  { name: 'Intent-Based', icon: '🧠', color: 'from-pink-400 to-pink-600' },
  { name: 'Smart Cluster', icon: '🤖', color: 'from-cyan-400 to-cyan-600' },
  { name: 'Funnel-Based', icon: '🎢', color: 'from-violet-400 to-violet-600' },
  { name: 'Geo-Precision', icon: '📍', color: 'from-red-400 to-red-600' },
  { name: 'Competitor Conquest', icon: '⚔️', color: 'from-orange-400 to-orange-600' },
  { name: 'Long-Tail Master', icon: '🎣', color: 'from-teal-400 to-teal-600' },
  { name: 'RLSA Pro', icon: '🔄', color: 'from-emerald-400 to-emerald-600' },
  { name: 'Seasonal Sprint', icon: '⏰', color: 'from-amber-400 to-amber-600' },
  { name: 'High-Intent DSA', icon: '⚡', color: 'from-yellow-400 to-yellow-600' }
];

const otherFeatures = [
  { icon: '🎨', title: '30+ Website Templates', description: 'Edit and go live in 30 seconds' },
  { icon: '🚀', title: '30+ Preset Google Campaigns', description: 'Ready for all verticals' },
  { icon: '👁', title: 'Live Ad Preview', description: 'See preview while adding 10+ extension types' },
  { icon: '📍', title: 'Zip & City Targeting', description: 'Target up to 30,000 zips in one go' }
];

function Features({ onGetStarted }: FeaturesProps) {
  const [hoveredStructure, setHoveredStructure] = useState<number | null>(null);

  return (
    <section id="features" className="py-20 px-6 bg-gradient-to-b from-white via-blue-50/30 to-white">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 max-w-5xl mx-auto">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              Launch Complete Google Ads Infrastructure in Minutes — Not Weeks.
            </span>
          </h2>
        </motion.div>

        <div className="mb-12">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-8">
            {campaignStructures.map((structure, index) => (
              <motion.div
                key={structure.name}
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.05, y: -5 }}
                onHoverStart={() => setHoveredStructure(index)}
                onHoverEnd={() => setHoveredStructure(null)}
                className="relative group cursor-pointer"
              >
                <div className={`bg-white rounded-2xl p-6 border-2 border-gray-200 hover:border-transparent hover:shadow-2xl transition-all duration-300 ${hoveredStructure === index ? 'ring-4 ring-blue-100' : ''}`}>
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-to-br ${structure.color} flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow`}>
                    <span className="text-3xl">{structure.icon}</span>
                  </div>
                  <h3 className="text-center text-gray-900 text-sm font-semibold mb-1">{structure.name}</h3>
                  <div className={`text-center text-xs text-transparent bg-clip-text bg-gradient-to-r ${structure.color} font-medium`}>
                    Structure #{index + 1}
                  </div>
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: hoveredStructure === index ? 1 : 0, scale: hoveredStructure === index ? 1 : 0 }}
                    className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg"
                  >
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <polyline points="20 6 9 17 4 12" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-8">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 max-w-6xl mx-auto leading-relaxed">
            Select Prebuilt Structures → Select Prebuilt Campaigns → Readymade Website templates → Launch Ads like Guru's.
          </h2>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-full shadow-lg font-semibold">
            <span className="text-xl">🔥</span>
            <span>All 12 Structures Available Instantly</span>
            <span className="text-xl">🔥</span>
          </div>
        </motion.div>

        <div className="relative my-16">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t-2 border-gray-200"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="px-6 py-2 bg-white text-gray-500 text-sm">Plus More Powerful Features</span>
          </div>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {otherFeatures.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              className="bg-white rounded-xl p-6 border-2 border-gray-200 hover:border-blue-300 hover:shadow-xl transition-all group"
            >
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mb-4 shadow-md group-hover:shadow-lg transition-shadow">
                <span className="text-2xl">{feature.icon}</span>
              </div>
              <h3 className="text-gray-900 font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-600 text-sm">{feature.description}</p>
              <motion.div className="mt-4 flex items-center gap-2 text-blue-600 text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                <span>Learn more</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </motion.div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mt-12">
          <button 
            onClick={onGetStarted}
            className="px-10 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:shadow-2xl transition-all flex items-center gap-3 mx-auto group font-semibold"
          >
            <span>Explore All Features</span>
            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </motion.div>
      </div>
    </section>
  );
}

// ============================================
// CAMPAIGN STRUCTURES FEATURE
// ============================================
interface CampaignStructuresFeatureProps {
  onGetStarted?: () => void;
}

function CampaignStructuresFeature({ onGetStarted }: CampaignStructuresFeatureProps) {
  const [selectedStructure, setSelectedStructure] = useState(0);

  const structures = [
    { name: 'SKAG', badge: 'Single Keyword Ad Groups', description: 'Ultra-focused targeting with one keyword per ad group for maximum relevance and Quality Score.', icon: '🎯' },
    { name: 'STAG+', badge: 'Single Theme Ad Groups', description: 'Grouped keywords by theme for efficient management while maintaining high relevance.', icon: '📊' },
    { name: 'Alpha-Beta', badge: 'Testing Framework', description: 'Split testing structure for continuous optimization and performance improvement.', icon: '🔬' },
    { name: 'Intent-Based', badge: 'User Intent Targeting', description: 'Campaigns structured around user search intent for maximum conversion rates.', icon: '🧠' },
    { name: 'Smart Cluster', badge: 'AI-Powered Grouping', description: 'Machine learning-based keyword clustering for optimal performance.', icon: '🤖' },
    { name: 'Funnel-Based', badge: 'Journey Optimization', description: 'Structured campaigns aligned with customer journey stages.', icon: '🎢' },
    { name: 'Geo-Precision', badge: 'Location-First Structure', description: 'Geographic targeting optimized for local and regional dominance.', icon: '📍' },
    { name: 'Competitor Conquest', badge: 'Brand Bidding Strategy', description: 'Strategic campaigns targeting competitor keywords and brand terms.', icon: '⚔️' },
    { name: 'Long-Tail Master', badge: 'Low Competition Focus', description: 'Dominate niche markets with highly specific long-tail keyword structures.', icon: '🎣' },
    { name: 'RLSA Pro', badge: 'Remarketing Lists', description: 'Advanced remarketing campaigns for search audience targeting.', icon: '🔄' },
    { name: 'Seasonal Sprint', badge: 'Time-Based Campaigns', description: 'Optimized structures for seasonal and time-sensitive promotions.', icon: '⏰' },
    { name: 'High-Intent DSA', badge: 'Dynamic Search Ads', description: 'Automated campaign structure for capturing high-intent traffic at scale.', icon: '⚡' }
  ];

  return (
    <section className="py-20 px-6 bg-gradient-to-b from-purple-50/30 to-white">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <div className="inline-block px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-600 rounded-full text-sm font-medium mb-6">
              12 Secret Campaign Structures
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Choose from <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">12 Highly Optimized</span> Campaign Structures
            </h2>
            <p className="text-gray-600 text-lg mb-8">
              Highly optimized campaign structures never revealed before. Select from 12 battle-tested frameworks used by top advertisers to dominate search results and achieve maximum ROI.
            </p>
            <div className="space-y-4 mb-8">
              {[
                { title: '12 Proven Frameworks', description: 'Comprehensive library of secret campaign structures' },
                { title: 'Maximum Quality Score', description: 'Optimized for highest ad relevance and CTR' },
                { title: 'Easy Scalability', description: 'Grow from local to national campaigns effortlessly' },
                { title: 'Instant Deployment', description: 'Launch complete structures in under 30 seconds' }
              ].map((item, index) => (
                <motion.div key={item.title} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }} className="flex gap-3">
                  <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <polyline points="20 6 9 17 4 12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-gray-900 font-medium mb-1">{item.title}</div>
                    <div className="text-gray-600 text-sm">{item.description}</div>
                  </div>
                </motion.div>
              ))}
            </div>
            <button 
              onClick={onGetStarted}
              className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:shadow-xl transition-all flex items-center gap-2 group font-semibold"
            >
              Explore All 12 Structures
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="relative">
            <div className="bg-white rounded-3xl p-8 border-2 border-gray-200 shadow-xl">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-gray-900 font-semibold">Select Structure</h3>
                  <span className="px-3 py-1 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-full text-xs font-medium">12 Available</span>
                </div>
                <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-2">
                  {structures.map((structure, index) => (
                    <motion.button
                      key={structure.name}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedStructure(index)}
                      className={`p-3 rounded-xl border-2 transition-all text-center ${selectedStructure === index ? 'bg-gradient-to-br from-blue-500 to-purple-600 border-transparent text-white' : 'bg-white border-gray-200 text-gray-600 hover:border-blue-300'}`}
                    >
                      <div className="text-2xl mb-1">{structure.icon}</div>
                      <div className={`text-xs font-medium ${selectedStructure === index ? 'text-white' : 'text-gray-900'}`}>{structure.name}</div>
                    </motion.button>
                  ))}
                </div>
              </div>

              <motion.div key={selectedStructure} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="text-4xl">{structures[selectedStructure].icon}</div>
                  <div>
                    <h3 className="text-gray-900 text-xl font-bold">{structures[selectedStructure].name}</h3>
                    <p className="text-sm text-gray-600">{structures[selectedStructure].badge}</p>
                  </div>
                </div>
                <p className="text-gray-600 mb-6">{structures[selectedStructure].description}</p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white p-3 rounded-lg text-center">
                    <div className="text-xl font-bold text-blue-600">10+</div>
                    <div className="text-xs text-gray-500">Quality Score</div>
                  </div>
                  <div className="bg-white p-3 rounded-lg text-center">
                    <div className="text-xl font-bold text-purple-600">30s</div>
                    <div className="text-xs text-gray-500">Setup Time</div>
                  </div>
                  <div className="bg-white p-3 rounded-lg text-center">
                    <div className="text-xl font-bold text-indigo-600">✓</div>
                    <div className="text-xs text-gray-500">Ready</div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="absolute -top-4 -right-4 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl shadow-xl p-4 text-white"
                animate={{ rotate: [0, 5, 0, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                <div className="text-xs opacity-90">Secret</div>
                <div className="text-2xl font-bold">🔥 12</div>
              </motion.div>
            </div>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mt-12 flex flex-wrap gap-3 justify-center">
          <span className="text-gray-500 text-sm">All 12 Structures:</span>
          {structures.map((structure) => (
            <span key={structure.name} className="px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 text-purple-600 rounded-full text-sm border border-purple-100 font-medium">
              {structure.icon} {structure.name}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ============================================
// AI AD BUILDER FEATURE
// ============================================
interface AIAdBuilderFeatureProps {
  onGetStarted?: () => void;
}

function AIAdBuilderFeature({ onGetStarted }: AIAdBuilderFeatureProps) {
  const extensions = [
    { name: 'Sitelink Extensions', icon: '🔗' },
    { name: 'Callout Extensions', icon: '💬' },
    { name: 'Structured Snippets', icon: '📋' },
    { name: 'Call Extensions', icon: '📞' },
    { name: 'Location Extensions', icon: '📍' },
    { name: 'Price Extensions', icon: '💰' },
    { name: 'App Extensions', icon: '📱' },
    { name: 'Promotion Extensions', icon: '🎁' },
    { name: 'Image Extensions', icon: '🖼️' },
    { name: 'Lead Form Extensions', icon: '📝' }
  ];

  return (
    <section className="py-20 px-6 bg-gradient-to-b from-white to-blue-50/30">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <div className="inline-block px-4 py-2 bg-gradient-to-r from-purple-100 to-blue-100 text-purple-600 rounded-full text-sm font-medium mb-6">
              AI-Powered Ad Creation
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              AI Builds Your <span className="text-purple-600">High-Quality Ads</span> & Extensions
            </h2>
            <p className="text-gray-600 text-lg mb-8">
              Our AI automatically creates super high-quality ads and all Google extensions to maximize your Ad Rank and beat your competitors from day one.
            </p>
            <div className="space-y-4 mb-8">
              {[
                { title: 'Maximum Ad Rank', description: 'AI optimizes every element for the highest Quality Score' },
                { title: 'Beat Competitors', description: 'Advanced analysis ensures you outperform competition' },
                { title: 'All Extension Types', description: 'Automatically creates all relevant Google extensions' },
                { title: 'Instant Generation', description: 'Complete ad sets generated in seconds, not hours' }
              ].map((item, index) => (
                <motion.div key={item.title} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }} className="flex gap-3">
                  <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <polyline points="20 6 9 17 4 12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-gray-900 font-medium mb-1">{item.title}</div>
                    <div className="text-gray-600 text-sm">{item.description}</div>
                  </div>
                </motion.div>
              ))}
            </div>
            <button 
              onClick={onGetStarted}
              className="px-8 py-4 bg-gradient-to-r from-purple-500 to-blue-600 text-white rounded-xl hover:shadow-xl transition-all flex items-center gap-2 group font-semibold"
            >
              Let AI Build Your Ads
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="relative">
            <div className="bg-white rounded-3xl p-8 border-2 border-gray-200 shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">🤖</span>
                </div>
                <div>
                  <h3 className="text-gray-900 font-semibold">Complete Extension Coverage</h3>
                  <p className="text-gray-500 text-sm">All 10 extension types included</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6">
                {extensions.map((extension, index) => (
                  <motion.div
                    key={extension.name}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05 }}
                    className="p-3 bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl border border-purple-100 hover:border-purple-300 hover:shadow-md transition-all group cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                        <span className="text-lg">{extension.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-gray-900 text-xs font-medium truncate">{extension.name}</div>
                      </div>
                      <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <polyline points="20 6 9 17 4 12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-4 text-center pt-6 border-t border-gray-200">
                <div className="p-3 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">10/10</div>
                  <div className="text-xs text-gray-500">Quality Score</div>
                </div>
                <div className="p-3 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">+340%</div>
                  <div className="text-xs text-gray-500">CTR Boost</div>
                </div>
                <div className="p-3 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-indigo-600">{'<10s'}</div>
                  <div className="text-xs text-gray-500">Generation</div>
                </div>
              </div>

              <motion.div className="absolute -top-4 -right-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-xl p-4 text-white" animate={{ rotate: [0, 5, 0, -5, 0] }} transition={{ duration: 4, repeat: Infinity }}>
                <div className="text-xs opacity-90">Coverage</div>
                <div className="text-2xl font-bold">✅ 100%</div>
              </motion.div>
            </div>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mt-12 flex flex-wrap gap-3 justify-center">
          <span className="text-gray-500 text-sm">Perfect for:</span>
          {['E-commerce', 'SaaS', 'B2B', 'Local Business', 'Lead Generation', 'App Install'].map((useCase) => (
            <span key={useCase} className="px-4 py-2 bg-purple-50 text-purple-600 rounded-full text-sm border border-purple-100 font-medium">
              {useCase}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ============================================
// BUILDER SECTION
// ============================================
interface BuilderSectionProps {
  onGetStarted?: () => void;
}

function BuilderSection({ onGetStarted }: BuilderSectionProps) {
  return (
    <section className="py-20 px-6 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <div className="inline-block px-4 py-2 bg-orange-100 text-orange-600 rounded-full text-sm font-medium mb-6">
              Builder 2.0 Campaign Wizard
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              See Everything Live and Go Live in <span className="text-orange-600">30 Seconds</span>
            </h2>
            <p className="text-gray-600 text-lg mb-8">
              Builder 2.0 makes campaign creation effortless. With zip targeting of 30,000 zips or 500 cities, live previews, and complete presets for everything, launching campaigns has never been faster.
            </p>
            <div className="space-y-4 mb-8">
              {[
                { title: 'Smart Zip Targeting', description: 'Target 30,000 zip codes or 500 cities with precision instantly' },
                { title: 'Live Campaign Preview', description: 'See your campaign exactly as it will appear before going live' },
                { title: '30-Second Launch', description: 'From start to live in just 30 seconds with no complex setup' },
                { title: 'Complete Preset Library', description: 'Every aspect has a preset: keywords, audiences, bids, schedules' }
              ].map((item, index) => (
                <motion.div key={item.title} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }} className="flex gap-3">
                  <div className="w-6 h-6 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <polyline points="20 6 9 17 4 12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-gray-900 font-medium mb-1">{item.title}</div>
                    <div className="text-gray-600 text-sm">{item.description}</div>
                  </div>
                </motion.div>
              ))}
            </div>
            <button 
              onClick={onGetStarted}
              className="px-8 py-4 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl hover:shadow-xl transition-all flex items-center gap-2 group font-semibold"
            >
              Try Campaign Wizard
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="relative">
            <div className="bg-white rounded-3xl p-6 border-2 border-gray-200 shadow-xl">
              <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
                <div className="bg-gradient-to-r from-orange-500 to-red-600 p-6 text-white">
                  <div className="text-sm opacity-90 mb-2">Campaign Wizard</div>
                  <div className="text-2xl font-bold mb-4">Launch Your Campaign</div>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4].map((step) => (
                      <div key={step} className={`h-1 flex-1 rounded ${step <= 2 ? 'bg-white' : 'bg-white/30'}`} />
                    ))}
                  </div>
                </div>

                <div className="p-6 space-y-6 bg-white">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-lg">🎯</span>
                      <span className="text-gray-900 font-medium">Geographic Targeting</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-orange-50 border-2 border-orange-500 rounded-lg">
                        <div className="text-sm text-orange-600 font-medium">30,000 Zip Codes</div>
                      </div>
                      <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                        <div className="text-sm text-gray-600">500 Cities</div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-lg">🎨</span>
                      <span className="text-gray-900 font-medium">Template</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className={`aspect-video ${i === 1 ? 'bg-orange-100 border-2 border-orange-500' : 'bg-gray-100 border border-gray-200'} rounded-lg`} />
                      ))}
                    </div>
                  </div>

                  <button className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2 group font-semibold">
                    <span>Preview & Go Live</span>
                    <motion.span animate={{ x: [0, 4, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>→</motion.span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 text-center mt-6">
                <div className="p-3 bg-gradient-to-br from-orange-50 to-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">30K</div>
                  <div className="text-xs text-gray-500">Zip Codes</div>
                </div>
                <div className="p-3 bg-gradient-to-br from-orange-50 to-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">500</div>
                  <div className="text-xs text-gray-500">Cities</div>
                </div>
                <div className="p-3 bg-gradient-to-br from-orange-50 to-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">30s</div>
                  <div className="text-xs text-gray-500">Launch Time</div>
                </div>
              </div>
            </div>

            <motion.div className="absolute -top-4 -right-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-xl p-4 text-white" animate={{ rotate: [0, 5, 0, -5, 0] }} transition={{ duration: 4, repeat: Infinity }}>
              <div className="text-xs opacity-90">Time to Launch</div>
              <div className="text-2xl font-bold">⚡ 30s</div>
            </motion.div>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mt-12 flex flex-wrap gap-3 justify-center">
          <span className="text-gray-500 text-sm">Perfect for:</span>
          {['Quick Launches', 'Geo-Targeted Campaigns', 'Multi-City Campaigns', 'Preset Campaigns', 'A/B Testing', 'Rapid Deployment'].map((useCase) => (
            <span key={useCase} className="px-4 py-2 bg-orange-50 text-orange-600 rounded-full text-sm border border-orange-100 font-medium">
              {useCase}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ============================================
// PRICING
// ============================================
interface PricingProps {
  onSelectPlan?: (planName: string, priceId: string, amount: number, isSubscription: boolean) => void;
}

const pricingPlans = [
  {
    name: 'Basic',
    price: '$69.99',
    period: 'per month',
    icon: '🚀',
    color: 'from-blue-400 to-blue-600',
    borderColor: 'border-blue-200',
    features: ['25 campaigns/month', 'AI keyword generation', 'All campaign structures', 'CSV export', 'Email support'],
    buttonStyle: 'bg-white text-gray-900 border-2 border-gray-200 hover:border-gray-300',
    popular: false,
    priceId: 'price_1Sf7Z2AYv17Z995VOMSBG7GX'
  },
  {
    name: 'Pro',
    price: '$129.99',
    period: 'per month',
    icon: '⚡',
    color: 'from-purple-500 to-purple-700',
    borderColor: 'border-purple-300',
    features: ['Unlimited campaigns', 'AI keyword generation', 'All campaign structures', 'CSV export', '24/7 priority support'],
    buttonStyle: 'bg-gradient-to-r from-purple-500 to-purple-700 text-white hover:shadow-xl',
    popular: true,
    priceId: 'price_1Sf7Z3AYv17Z995Vp8o2xgAN'
  },
  {
    name: 'Lifetime',
    price: '$49.99',
    period: 'one-time',
    icon: '👑',
    color: 'from-amber-400 to-orange-600',
    borderColor: 'border-amber-200',
    features: ['Unlimited campaigns forever', 'AI keyword generation', 'All campaign structures', 'CSV export', 'Priority support'],
    buttonStyle: 'bg-white text-gray-900 border-2 border-gray-200 hover:border-gray-300',
    popular: false,
    priceId: 'price_1Sf7Z5AYv17Z995V7ROFNbzI'
  }
];

function Pricing({ onSelectPlan }: PricingProps) {
  const handlePlanClick = (plan: typeof pricingPlans[0]) => {
    if (onSelectPlan) {
      const amount = parseFloat(plan.price.replace('$', '').replace(',', ''));
      const isSubscription = plan.period.includes('month');
      
      onSelectPlan(plan.name, plan.priceId || '', amount, isSubscription);
    }
  };

  return (
    <section id="pricing" className="py-24 px-6 bg-gradient-to-b from-white via-purple-50/30 to-white">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-4">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Choose Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">Perfect Plan</span>
          </h2>
          <p className="text-gray-600 text-lg mb-8">No hidden fees • Cancel anytime • 14-day money back guarantee</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 mb-8 max-w-4xl mx-auto">
          {pricingPlans.map((plan, index) => (
            <motion.div key={plan.name} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }} className="relative">
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                  <div className="px-4 py-1 bg-gradient-to-r from-purple-500 to-purple-700 text-white rounded-full text-xs shadow-lg font-medium">Most Popular</div>
                </div>
              )}

              <div className={`bg-white rounded-2xl p-6 border-2 ${plan.borderColor} ${plan.popular ? 'shadow-2xl scale-105 ring-4 ring-purple-100' : 'shadow-lg hover:shadow-xl'} transition-all duration-300 h-full flex flex-col`}>
                <div className={`w-full h-20 bg-gradient-to-r ${plan.color} rounded-xl flex items-center justify-center mb-6 shadow-md`}>
                  <span className="text-4xl">{plan.icon}</span>
                </div>

                <h3 className="text-gray-900 text-center mb-2 text-xl font-bold">{plan.name}</h3>

                <div className="text-center mb-2">
                  <span className="text-gray-900 text-3xl font-bold">{plan.price}</span>
                </div>
                <div className="text-gray-500 text-sm text-center mb-6">{plan.period}</div>

                <div className="space-y-3 mb-6 flex-grow">
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${plan.color} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                        <Check className="w-4 h-4 text-white" strokeWidth={3} />
                      </div>
                      <span className="text-gray-700 text-sm">{feature}</span>
                    </div>
                  ))}
                </div>

                <button 
                  onClick={() => handlePlanClick(plan)}
                  className={`w-full py-3 rounded-xl transition-all font-semibold ${plan.buttonStyle}`}
                >
                  Get Started
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="flex flex-wrap items-center justify-center gap-8 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
              <Check className="w-4 h-4 text-white" strokeWidth={3} />
            </div>
            <span>14-day money back</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <span>Secure payments</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <span>10k+ happy users</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ============================================
// CONTACT US
// ============================================
function ContactUs() {
  const [formData, setFormData] = useState({ name: '', email: '', company: '', phone: '', subject: '', message: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    alert('Thank you for contacting us! We will get back to you soon.');
    setFormData({ name: '', email: '', company: '', phone: '', subject: '', message: '' });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const contactInfo = [
    { icon: <Mail className="w-6 h-6" />, title: 'Email Us', content: 'support@adiology.online', link: 'mailto:support@adiology.online', color: 'from-blue-400 to-blue-600' },
    { icon: <Phone className="w-6 h-6" />, title: 'Call Us', content: '+1 304-305-1702', link: 'tel:+13043051702', color: 'from-purple-400 to-purple-600' },
    { icon: <MapPin className="w-6 h-6" />, title: 'Visit Us', content: 'San Francisco, CA', link: '#', color: 'from-pink-400 to-pink-600' }
  ];

  return (
    <section id="contact" className="py-24 px-6 bg-gradient-to-b from-white via-blue-50/30 to-white">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Get in <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Touch</span>
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.</p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            {contactInfo.map((info, index) => (
              <motion.a
                key={info.title}
                href={info.link}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02, y: -5 }}
                className="block bg-white rounded-2xl p-6 border-2 border-gray-200 hover:border-blue-300 hover:shadow-xl transition-all group"
              >
                <div className={`w-14 h-14 bg-gradient-to-br ${info.color} rounded-xl flex items-center justify-center mb-4 text-white shadow-md group-hover:shadow-lg transition-shadow`}>
                  {info.icon}
                </div>
                <h3 className="text-gray-900 font-semibold mb-2">{info.title}</h3>
                <p className="text-gray-600">{info.content}</p>
              </motion.a>
            ))}

            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }} className="bg-white rounded-2xl p-6 border-2 border-gray-200">
              <h3 className="text-gray-900 font-semibold mb-4">Follow Us</h3>
              <div className="flex gap-3">
                {['T', 'L', 'F', 'I'].map((social) => (
                  <a key={social} href="#" className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white hover:shadow-lg transition-all hover:scale-110 font-semibold">
                    {social}
                  </a>
                ))}
              </div>
            </motion.div>
          </div>

          <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="lg:col-span-2 bg-white rounded-2xl p-8 border-2 border-gray-200 shadow-xl">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-gray-900 mb-2 text-sm font-medium">Full Name *</label>
                  <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors" placeholder="John Doe" />
                </div>
                <div>
                  <label htmlFor="email" className="block text-gray-900 mb-2 text-sm font-medium">Email Address *</label>
                  <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors" placeholder="john@company.com" />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="company" className="block text-gray-900 mb-2 text-sm font-medium">Company Name</label>
                  <input type="text" id="company" name="company" value={formData.company} onChange={handleChange} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors" placeholder="Your Company" />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-gray-900 mb-2 text-sm font-medium">Phone Number</label>
                  <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleChange} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors" placeholder="+1 (555) 123-4567" />
                </div>
              </div>

              <div>
                <label htmlFor="subject" className="block text-gray-900 mb-2 text-sm font-medium">Subject *</label>
                <select id="subject" name="subject" value={formData.subject} onChange={handleChange} required className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors bg-white">
                  <option value="">Select a subject</option>
                  <option value="general">General Inquiry</option>
                  <option value="sales">Sales Question</option>
                  <option value="support">Technical Support</option>
                  <option value="partnership">Partnership Opportunity</option>
                  <option value="feedback">Feedback</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="message" className="block text-gray-900 mb-2 text-sm font-medium">Message *</label>
                <textarea id="message" name="message" value={formData.message} onChange={handleChange} required rows={6} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors resize-none" placeholder="Tell us about your project or questions..." />
              </div>

              <motion.button type="submit" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:shadow-2xl transition-all flex items-center justify-center gap-2 group font-semibold">
                <span>Send Message</span>
                <Send className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </motion.button>

              <p className="text-gray-500 text-sm text-center">We respect your privacy. Your information will never be shared with third parties.</p>
            </form>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mt-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-8 text-center text-white">
          <div className="max-w-3xl mx-auto">
            <h3 className="text-white text-xl font-bold mb-3">⚡ Quick Response Time</h3>
            <p className="text-blue-100">Our team typically responds within 24 hours during business days. For urgent matters, please call us directly.</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ============================================
// CTA SECTION
// ============================================
interface CTASectionProps {
  onGetStarted?: () => void;
}

function CTASection({ onGetStarted }: CTASectionProps) {
  return (
    <section className="py-20 px-6 bg-white">
      <div className="max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl p-12 text-center text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl" />
          </div>

          <div className="relative z-10">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
              <h2 className="text-white text-3xl md:text-4xl font-bold mb-4">This tool will make you lazy 😊</h2>
              <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">Everything is preset, automated, and optimized. Launch campaigns faster than ever before with our Builder 2.0 platform.</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.4 }} className="flex flex-wrap gap-4 justify-center">
              <button 
                onClick={onGetStarted}
                className="px-8 py-4 bg-white text-blue-600 rounded-xl hover:shadow-2xl transition-all flex items-center gap-2 group font-semibold"
              >
                <span>Start Free Trial</span>
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <button 
                onClick={() => {
                  const contactSection = document.querySelector('#contact');
                  if (contactSection) {
                    contactSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  } else if (onGetStarted) {
                    onGetStarted();
                  }
                }}
                className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white rounded-xl border-2 border-white/30 hover:bg-white/20 transition-all font-semibold"
              >
                Schedule Demo
              </button>
            </motion.div>

            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.6 }} className="mt-8 flex items-center justify-center gap-6 text-sm text-blue-100">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Setup in minutes</span>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ============================================
// FOOTER
// ============================================
function Footer() {
  const footerLinks = {
    Product: ['Features', 'Templates', 'Pricing', 'Integrations', 'API'],
    Solutions: ['E-commerce', 'SaaS', 'Agencies', 'Enterprise', 'Small Business'],
    Resources: ['Documentation', 'Help Center', 'Blog', 'Community', 'Webinars'],
    Company: ['About', 'Careers', 'Contact', 'Partners', 'Press']
  };

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, link: string) => {
    if (link === 'Contact') {
      e.preventDefault();
      document.querySelector('#contact')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (link === 'Features') {
      e.preventDefault();
      document.querySelector('#features')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (link === 'Pricing') {
      e.preventDefault();
      document.querySelector('#pricing')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <footer className="py-16 px-6 bg-gray-50 border-t border-gray-200">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-5 gap-8 mb-12">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">A</span>
              </div>
              <span className="text-gray-900 font-semibold">adiology</span>
            </div>
            <p className="text-gray-600 text-sm">The leading campaign management platform trusted by advertisers worldwide.</p>
          </div>

          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-gray-900 font-semibold mb-4">{category}</h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link}>
                    <a href="#" onClick={(e) => handleLinkClick(e, link)} className="text-gray-600 hover:text-gray-900 text-sm transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-8 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-gray-600 text-sm">© 2025 Adiology. All rights reserved.</div>
          <div className="flex gap-6 text-sm">
            <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">Privacy Policy</a>
            <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">Terms of Service</a>
            <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ============================================
// MAIN EXPORT
// ============================================
interface HomePageCompleteProps {
  onGetStarted?: () => void;
  onLogin?: () => void;
  onSelectPlan?: (planName: string, priceId: string, amount: number, isSubscription: boolean) => void;
}

export default function HomePageComplete({ onGetStarted, onLogin, onSelectPlan }: HomePageCompleteProps) {
  // Debug: Verify this component is loading
  if (typeof window !== 'undefined' && !(window as any).__homepagecomplete_logged) {
    console.log('✅ HomePageComplete component loaded (NEW HOMEPAGE)');
    (window as any).__homepagecomplete_logged = true;
  }
  
  return (
    <div className="min-h-screen bg-white">
      <Navigation onGetStarted={onGetStarted} onLogin={onLogin} />
      <Hero onGetStarted={onGetStarted} />
      <Features onGetStarted={onGetStarted} />
      <CampaignStructuresFeature onGetStarted={onGetStarted} />
      <AIAdBuilderFeature onGetStarted={onGetStarted} />
      <BuilderSection onGetStarted={onGetStarted} />
      <Pricing onSelectPlan={onSelectPlan} />
      <ContactUs />
      <CTASection onGetStarted={onGetStarted} />
      <Footer />
    </div>
  );
}
