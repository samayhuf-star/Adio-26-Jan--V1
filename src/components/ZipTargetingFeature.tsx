import { motion } from 'framer-motion';

export function ZipTargetingFeature() {
  return (
    <section className="py-20 px-6 bg-gradient-to-b from-blue-50/30 to-white">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left - Content */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-block px-4 py-2 bg-blue-100 text-blue-600 rounded-full text-sm mb-6">
              Perfect for Lead & Pay-Per-Call Networks
            </div>
            
            <h2 className="text-gray-900 mb-6">
              Launch <span className="text-blue-600">30,000 Zip Code</span> Campaigns in 30 Seconds
            </h2>
            
            <p className="text-gray-600 text-lg mb-8">
              Lead networks and pay-per-call networks always have targeting based on cities or zip codes. Now you can build campaigns for particular zips—whether it's 5,000, 10,000, or 30,000 zip codes. Our system makes it easy: click and launch zip-targeted ads and campaigns within 30 seconds.
            </p>

            <div className="space-y-4 mb-8">
              {[
                {
                  title: 'Instant Zip Targeting',
                  description: 'Select from 5K, 10K, or 30K zip codes with a single click'
                },
                {
                  title: 'Network-Ready Campaigns',
                  description: 'Pre-optimized for lead gen and pay-per-call networks'
                },
                {
                  title: 'City-Level Precision',
                  description: 'Target specific cities or blanket coverage across regions'
                },
                {
                  title: 'One-Click Launch',
                  description: 'Deploy massive geo-targeted campaigns in seconds'
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
              Try Zip Targeting Now
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </motion.div>

          {/* Right - Interactive Demo */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="bg-white rounded-3xl p-8 border-2 border-gray-200 shadow-xl">
              {/* Map Visualization */}
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl overflow-hidden mb-6">
                <div className="bg-white/50 border-b border-gray-200 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Zip Code Targeting</span>
                    <div className="flex gap-2 text-xs">
                      <span className="px-3 py-1 bg-blue-600 text-white rounded-full">30,000 Active</span>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  {/* Quick Select Buttons */}
                  <div className="grid grid-cols-3 gap-3 mb-6">
                    {[
                      { zips: '5,000', label: 'Top Markets' },
                      { zips: '10,000', label: 'Regional' },
                      { zips: '30,000', label: 'Full Coverage' }
                    ].map((preset, i) => (
                      <motion.button
                        key={preset.zips}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          i === 2 
                            ? 'bg-gradient-to-br from-blue-500 to-purple-600 border-transparent text-white' 
                            : 'bg-white border-gray-200 text-gray-600 hover:border-blue-300'
                        }`}
                      >
                        <div className={`text-2xl mb-1 ${i === 2 ? 'text-white' : 'text-gray-900'}`}>
                          {preset.zips}
                        </div>
                        <div className={`text-xs ${i === 2 ? 'text-blue-100' : 'text-gray-500'}`}>
                          {preset.label}
                        </div>
                      </motion.button>
                    ))}
                  </div>

                  {/* Map Preview */}
                  <div className="relative h-64 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl overflow-hidden mb-6">
                    {/* Simulated map with pins */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-6xl mb-2">🗺️</div>
                        <div className="text-gray-600 text-sm">USA Coverage Map</div>
                      </div>
                    </div>
                    
                    {/* Animated pins */}
                    {[...Array(12)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute w-2 h-2 bg-blue-500 rounded-full"
                        style={{
                          left: `${Math.random() * 90 + 5}%`,
                          top: `${Math.random() * 80 + 10}%`
                        }}
                        animate={{
                          scale: [1, 1.5, 1],
                          opacity: [0.5, 1, 0.5]
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          delay: i * 0.2
                        }}
                      />
                    ))}
                  </div>

                  {/* Stats Bar */}
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-3 bg-white rounded-lg">
                      <div className="text-2xl text-blue-600">30K</div>
                      <div className="text-xs text-gray-500">Zip Codes</div>
                    </div>
                    <div className="p-3 bg-white rounded-lg">
                      <div className="text-2xl text-purple-600">500</div>
                      <div className="text-xs text-gray-500">Cities</div>
                    </div>
                    <div className="p-3 bg-white rounded-lg">
                      <div className="text-2xl text-indigo-600">30s</div>
                      <div className="text-xs text-gray-500">Deploy Time</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Badge */}
              <motion.div
                className="absolute -top-4 -right-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-xl p-4 text-white"
                animate={{ rotate: [0, 5, 0, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                <div className="text-xs opacity-90">Launch Speed</div>
                <div className="text-2xl">⚡ 30s</div>
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Use Case Pills */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 flex flex-wrap gap-3 justify-center"
        >
          <span className="text-gray-500 text-sm">Perfect for:</span>
          {['Lead Generation', 'Pay-Per-Call Networks', 'Local Services', 'Insurance', 'Solar', 'Home Services'].map((useCase) => (
            <span key={useCase} className="px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-sm border border-blue-100">
              {useCase}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
