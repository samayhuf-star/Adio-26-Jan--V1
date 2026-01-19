import { motion } from 'framer-motion';
import { useState } from 'react';

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
  {
    icon: '🎨',
    title: '30+ Website Templates',
    description: 'Edit and go live in 30 seconds'
  },
  {
    icon: '🚀',
    title: '30+ Preset Google Campaigns',
    description: 'Ready for all verticals'
  },
  {
    icon: '👁️',
    title: 'Live Ad Preview',
    description: 'See preview while adding 10+ extension types'
  },
  {
    icon: '📍',
    title: 'Zip & City Targeting',
    description: 'Target up to 30,000 zips in one go'
  }
];

export function Features() {
  const [hoveredStructure, setHoveredStructure] = useState<number | null>(null);

  return (
    <section id="features" className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white via-blue-50/30 to-white w-full">
      <div className="max-w-7xl mx-auto w-full">
        {/* Top Heading */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-gray-900 max-w-5xl mx-auto">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              Launch Complete Google Ads Infrastructure in Minutes — Not Weeks.
            </span>
          </h2>
        </motion.div>

        {/* 12 Campaign Structures Grid */}
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
                <div className={`
                  bg-white rounded-2xl p-6 border-2 border-gray-200
                  hover:border-transparent hover:shadow-2xl transition-all duration-300
                  ${hoveredStructure === index ? 'ring-4 ring-blue-100' : ''}
                `}>
                  {/* Icon */}
                  <div className={`
                    w-16 h-16 mx-auto mb-4 rounded-xl 
                    bg-gradient-to-br ${structure.color}
                    flex items-center justify-center
                    shadow-lg group-hover:shadow-xl transition-shadow
                  `}>
                    <span className="text-3xl">{structure.icon}</span>
                  </div>
                  
                  {/* Name */}
                  <h3 className="text-center text-gray-900 text-sm mb-1">
                    {structure.name}
                  </h3>
                  
                  {/* Badge */}
                  <div className={`
                    text-center text-xs text-transparent bg-clip-text 
                    bg-gradient-to-r ${structure.color}
                  `}>
                    Structure #{index + 1}
                  </div>

                  {/* Hover Effect - Checkmark */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ 
                      opacity: hoveredStructure === index ? 1 : 0,
                      scale: hoveredStructure === index ? 1 : 0
                    }}
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

        {/* Workflow Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8"
        >
          <h2 className="text-gray-900 max-w-6xl mx-auto leading-relaxed">
            Select Prebuilt Structures → Select Prebuilt Campaigns → Readymade Website templates → Launch Ads like Guru's.
          </h2>
        </motion.div>

        {/* Fire Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-full shadow-lg">
            <span className="text-xl">🔥</span>
            <span>All 12 Structures Available Instantly</span>
            <span className="text-xl">🔥</span>
          </div>
        </motion.div>

        {/* Divider */}
        <div className="relative my-16">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t-2 border-gray-200"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="px-6 py-2 bg-white text-gray-500 text-sm">
              Plus More Powerful Features
            </span>
          </div>
        </div>

        {/* Other Features - One Line */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
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
              {/* Icon */}
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mb-4 shadow-md group-hover:shadow-lg transition-shadow">
                <span className="text-2xl">{feature.icon}</span>
              </div>
              
              {/* Content */}
              <h3 className="text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600 text-sm">
                {feature.description}
              </p>

              {/* Arrow indicator on hover */}
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                className="mt-4 flex items-center gap-2 text-blue-600 text-sm opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <span>Learn more</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </motion.div>
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <button className="px-10 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:shadow-2xl transition-all flex items-center gap-3 mx-auto group">
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