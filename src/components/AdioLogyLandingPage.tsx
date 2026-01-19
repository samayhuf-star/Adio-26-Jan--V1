import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

interface AdioLogyLandingPageProps {
  onGetStarted?: () => void;
  onLogin?: () => void;
}

export default function AdioLogyLandingPage({ onGetStarted, onLogin }: AdioLogyLandingPageProps) {
  const handleNavigateToPolicy = (policy: string) => {
    // Navigate to policy page or open modal
    console.log('Navigate to policy:', policy);
  };

  return (
    <div className="min-h-screen bg-white">
      <Navigation onGetStarted={onGetStarted} onLogin={onLogin} />
      <Hero onGetStarted={onGetStarted} />
      <Features />
      <Pricing />
      <CTASection onGetStarted={onGetStarted} />
      <Footer onNavigateToPolicy={handleNavigateToPolicy} />
    </div>
  );
}

// Navigation Component
function Navigation({ onGetStarted, onLogin }: { onGetStarted?: () => void; onLogin?: () => void }) {
  const [isOpen, setIsOpen] = useState(false);

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
            <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors text-sm">Features</a>
            <a href="#pricing" className="text-gray-600 hover:text-gray-900 transition-colors text-sm">Pricing</a>
            <button onClick={onLogin} className="px-5 py-2 text-gray-600 hover:text-gray-900 transition-colors text-sm">Sign In</button>
            <button onClick={onGetStarted} className="px-5 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg text-sm hover:shadow-lg transition-shadow">Get Started</button>
          </div>

          <button className="md:hidden text-gray-900" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? '✕' : '☰'}
          </button>
        </div>

        <AnimatePresence>
          {isOpen && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="md:hidden mt-4 pb-4 space-y-2">
              <a href="#features" className="block py-2 text-gray-600 hover:text-gray-900">Features</a>
              <a href="#pricing" className="block py-2 text-gray-600 hover:text-gray-900">Pricing</a>
              <button onClick={onLogin} className="block w-full text-left py-2 text-gray-600 hover:text-gray-900">Sign In</button>
              <button onClick={onGetStarted} className="w-full mt-4 px-5 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg text-sm">Get Started</button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
}

// Hero Section
function Hero({ onGetStarted }: { onGetStarted?: () => void }) {
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
            Why guess campaigns when you can <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">copy what actually works?</span>
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
            <button onClick={onGetStarted} className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:shadow-xl transition-all flex items-center gap-2 group font-semibold">
              Get Started
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <button className="px-8 py-3 bg-white text-gray-700 rounded-xl border-2 border-gray-200 hover:border-gray-300 hover:shadow-md transition-all font-semibold">
              Contact Sales
            </button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// Features Section
function Features() {
  const features = [
    { icon: '🎯', title: '12 Campaign Structures', description: 'Choose from battle-tested frameworks' },
    { icon: '🎨', title: '30+ Website Templates', description: 'Edit and go live in 30 seconds' },
    { icon: '🚀', title: '30+ Preset Campaigns', description: 'Ready for all verticals' },
    { icon: '🤖', title: 'AI Ad Builder', description: 'Automatically creates high-quality ads' },
  ];

  return (
    <section id="features" className="py-20 px-6 bg-gradient-to-b from-white via-blue-50/30 to-white">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              Launch Complete Google Ads Infrastructure in Minutes
            </span>
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              className="bg-white rounded-2xl p-6 border-2 border-gray-200 hover:border-blue-300 hover:shadow-xl transition-all group"
            >
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mb-4 shadow-md group-hover:shadow-lg transition-shadow">
                <span className="text-2xl">{feature.icon}</span>
              </div>
              <h3 className="text-gray-900 font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-600 text-sm">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// Pricing Section
function Pricing() {
  const plans = [
    { name: 'Basic', price: '$69.99', period: 'per month', features: ['25 campaigns/month', 'AI keyword generation', 'All structures'] },
    { name: 'Pro', price: '$129.99', period: 'per month', features: ['Unlimited campaigns', 'AI keyword generation', 'All structures'], popular: true },
    { name: 'Lifetime', price: '$99.99', period: 'one-time', features: ['Unlimited forever', 'AI keyword generation', 'All structures'] },
  ];

  return (
    <section id="pricing" className="py-20 px-6 bg-gradient-to-b from-white via-purple-50/30 to-white">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Choose Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">Perfect Plan</span>
          </h2>
          <p className="text-gray-600 text-lg">No hidden fees • Cancel anytime</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`bg-white rounded-2xl p-6 border-2 border-gray-200 ${plan.popular ? 'border-purple-300 shadow-2xl scale-105' : 'hover:shadow-xl'} transition-all`}
            >
              {plan.popular && (
                <div className="text-center mb-4">
                  <span className="px-4 py-1 bg-gradient-to-r from-purple-500 to-purple-700 text-white rounded-full text-xs font-medium">Most Popular</span>
                </div>
              )}
              <h3 className="text-gray-900 text-xl font-bold mb-2 text-center">{plan.name}</h3>
              <div className="text-center mb-2">
                <span className="text-gray-900 text-3xl font-bold">{plan.price}</span>
              </div>
              <div className="text-gray-500 text-sm text-center mb-6">{plan.period}</div>
              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-gray-600 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              <button className={`w-full py-3 rounded-xl transition-all font-semibold ${plan.popular ? 'bg-gradient-to-r from-purple-500 to-purple-700 text-white hover:shadow-xl' : 'bg-white text-gray-900 border-2 border-gray-200 hover:border-gray-300'}`}>
                Get Started
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// CTA Section
function CTASection({ onGetStarted }: { onGetStarted?: () => void }) {
  return (
    <section className="py-20 px-6 bg-white">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl p-12 text-center text-white relative overflow-hidden"
        >
          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to get started?</h2>
            <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
              Everything is preset, automated, and optimized. Launch campaigns faster than ever before.
            </p>
            <button
              onClick={onGetStarted}
              className="px-8 py-4 bg-white text-blue-600 rounded-xl hover:shadow-2xl transition-all flex items-center gap-2 group font-semibold mx-auto"
            >
              <span>Start Free Trial</span>
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// Footer
export function Footer({ onNavigateToPolicy }: { onNavigateToPolicy: (policy: string) => void }) {
  return (
    <footer className="py-16 px-6 bg-slate-900 text-gray-100">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-8">
          {/* Product */}
          <div>
            <h4 className="font-semibold text-white mb-4">Product</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-400 hover:text-white transition">Features</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition">Pricing</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition">Campaign Builder</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition">Keyword Planner</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition">Ad Generator</a></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-semibold text-white mb-4">Resources</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-400 hover:text-white transition">Documentation</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition">API Reference</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition">Blog</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition">Help Center</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition">Tutorials</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-white mb-4">Legal</h4>
            <ul className="space-y-2">
              <li><button onClick={() => onNavigateToPolicy('privacy')} className="text-gray-400 hover:text-white transition text-left">Privacy Policy</button></li>
              <li><button onClick={() => onNavigateToPolicy('terms')} className="text-gray-400 hover:text-white transition text-left">Terms of Service</button></li>
              <li><button onClick={() => onNavigateToPolicy('cookie')} className="text-gray-400 hover:text-white transition text-left">Cookie Policy</button></li>
              <li><button onClick={() => onNavigateToPolicy('gdpr')} className="text-gray-400 hover:text-white transition text-left">GDPR Compliance</button></li>
              <li><button onClick={() => onNavigateToPolicy('refund')} className="text-gray-400 hover:text-white transition text-left">Refund Policy</button></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold text-white mb-4">Company</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-400 hover:text-white transition">About Us</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition">Contact</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition">Careers</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition">Partners</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">A</span>
            </div>
            <span className="text-white font-semibold">adiology</span>
          </div>
          <div className="text-gray-400 text-sm">© 2025 Adiology. All rights reserved.</div>
        </div>
      </div>
    </footer>
  );
}

