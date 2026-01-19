import { motion } from 'framer-motion';
import { useState } from 'react';

export function CampaignStructuresFeature() {
  const [selectedStructure, setSelectedStructure] = useState(0);

  const structures = [
    {
      name: 'SKAG',
      badge: 'Single Keyword Ad Groups',
      description: 'Ultra-focused targeting with one keyword per ad group for maximum relevance and Quality Score.',
      icon: '🎯',
    },
    {
      name: 'STAG+',
      badge: 'Single Theme Ad Groups',
      description: 'Grouped keywords by theme for efficient management while maintaining high relevance.',
      icon: '📊',
    },
    {
      name: 'Alpha-Beta',
      badge: 'Testing Framework',
      description: 'Split testing structure for continuous optimization and performance improvement.',
      icon: '🔬',
    },
    {
      name: 'Intent-Based',
      badge: 'User Intent Targeting',
      description: 'Campaigns structured around user search intent for maximum conversion rates.',
      icon: '🧠',
    },
    {
      name: 'Smart Cluster',
      badge: 'AI-Powered Grouping',
      description: 'Machine learning-based keyword clustering for optimal performance.',
      icon: '🤖',
    },
    {
      name: 'Funnel-Based',
      badge: 'Journey Optimization',
      description: 'Structured campaigns aligned with customer journey stages.',
      icon: '🎢',
    },
    {
      name: 'Geo-Precision',
      badge: 'Location-First Structure',
      description: 'Geographic targeting optimized for local and regional dominance.',
      icon: '📍',
    },
    {
      name: 'Competitor Conquest',
      badge: 'Brand Bidding Strategy',
      description: 'Strategic campaigns targeting competitor keywords and brand terms.',
      icon: '⚔️',
    },
    {
      name: 'Long-Tail Master',
      badge: 'Low Competition Focus',
      description: 'Dominate niche markets with highly specific long-tail keyword structures.',
      icon: '🎣',
    },
    {
      name: 'RLSA Pro',
      badge: 'Remarketing Lists',
      description: 'Advanced remarketing campaigns for search audience targeting.',
      icon: '🔄',
    },
    {
      name: 'Seasonal Sprint',
      badge: 'Time-Based Campaigns',
      description: 'Optimized structures for seasonal and time-sensitive promotions.',
      icon: '⏰',
    },
    {
      name: 'High-Intent DSA',
      badge: 'Dynamic Search Ads',
      description: 'Automated campaign structure for capturing high-intent traffic at scale.',
      icon: '⚡',
    }
  ];

  return (
    <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-purple-50/30 to-white w-full">
      <div className="max-w-7xl mx-auto w-full">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left - Content */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-block px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-600 rounded-full text-sm mb-6">
              12 Secret Campaign Structures
            </div>
            
            <h2 className="text-gray-900 mb-6">
              Choose from <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">12 Highly Optimized</span> Campaign Structures
            </h2>
            
            <p className="text-gray-600 text-lg mb-8">
              Highly optimized campaign structures never revealed before. Select from 12 battle-tested frameworks used by top advertisers to dominate search results and achieve maximum ROI. Each structure is precision-engineered for specific goals and industries.
            </p>

            <div className="space-y-4 mb-8">
              {[
                {
                  title: '12 Proven Frameworks',
                  description: 'Comprehensive library of secret campaign structures'
                },
                {
                  title: 'Maximum Quality Score',
                  description: 'Optimized for highest ad relevance and CTR'
                },
                {
                  title: 'Easy Scalability',
                  description: 'Grow from local to national campaigns effortlessly'
                },
                {
                  title: 'Instant Deployment',
                  description: 'Launch complete structures in under 30 seconds'
                }
              ].map((item, index) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="flex gap-3"
                >
                  <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <polyline points="20 6 9 17 4 12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-gray-900 mb-1">{item.title}</div>
                    <div className="text-gray-600 text-sm">{item.description}</div>
                  </div>
                </motion.div>
              ))}
            </div>

            <button className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:shadow-xl transition-all flex items-center gap-2 group">
              Explore All 12 Structures
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </motion.div>

          {/* Right - Structure Selection */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="bg-white rounded-3xl p-8 border-2 border-gray-200 shadow-xl">
              {/* Structure Grid - Scrollable */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-gray-900">Select Structure</h3>
                  <span className="px-3 py-1 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-full text-xs">
                    12 Available
                  </span>
                </div>
                
                <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                  {structures.map((structure, index) => (
                    <motion.button
                      key={structure.name}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedStructure(index)}
                      className={`p-3 rounded-xl border-2 transition-all text-center ${
                        selectedStructure === index
                          ? 'bg-gradient-to-br from-blue-500 to-purple-600 border-transparent text-white'
                          : 'bg-white border-gray-200 text-gray-600 hover:border-blue-300'
                      }`}
                    >
                      <div className="text-2xl mb-1">{structure.icon}</div>
                      <div className={`text-xs ${selectedStructure === index ? 'text-white' : 'text-gray-900'}`}>
                        {structure.name}
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Structure Details */}
              <motion.div
                key={selectedStructure}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="text-4xl">{structures[selectedStructure].icon}</div>
                  <div>
                    <h3 className="text-gray-900 text-xl">{structures[selectedStructure].name}</h3>
                    <p className="text-sm text-gray-600">{structures[selectedStructure].badge}</p>
                  </div>
                </div>

                <p className="text-gray-600 mb-6">
                  {structures[selectedStructure].description}
                </p>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white p-3 rounded-lg text-center">
                    <div className="text-xl text-blue-600">10+</div>
                    <div className="text-xs text-gray-500">Quality Score</div>
                  </div>
                  <div className="bg-white p-3 rounded-lg text-center">
                    <div className="text-xl text-purple-600">30s</div>
                    <div className="text-xs text-gray-500">Setup Time</div>
                  </div>
                  <div className="bg-white p-3 rounded-lg text-center">
                    <div className="text-xl text-indigo-600">✓</div>
                    <div className="text-xs text-gray-500">Ready</div>
                  </div>
                </div>
              </motion.div>

              {/* Floating Badge */}
              <motion.div
                className="absolute -top-4 -right-4 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl shadow-xl p-4 text-white"
                animate={{ rotate: [0, 5, 0, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                <div className="text-xs opacity-90">Secret</div>
                <div className="text-2xl">🔥 12</div>
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Structure Pills */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 flex flex-wrap gap-3 justify-center"
        >
          <span className="text-gray-500 text-sm">All 12 Structures:</span>
          {structures.map((structure) => (
            <span key={structure.name} className="px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 text-purple-600 rounded-full text-sm border border-purple-100">
              {structure.icon} {structure.name}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}