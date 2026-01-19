import { motion } from 'framer-motion';

export function WebsiteToLiveFeature() {
  return (
    <section className="py-20 px-6 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left - Content */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-block px-4 py-2 bg-purple-100 text-purple-600 rounded-full text-sm mb-6">
              Complete End-to-End Solution
            </div>
            
            <h2 className="text-gray-900 mb-6">
              From Template to Live Ads in <span className="text-purple-600">Under 60 Seconds</span>
            </h2>
            
            <p className="text-gray-600 text-lg mb-8">
              Pick a website template, host it anywhere, then launch AI-optimized campaigns with Google or Microsoft Ads. The complete workflow, automated from start to finish.
            </p>

            <div className="space-y-4 mb-8">
              {[
                {
                  title: '30+ Website Templates',
                  description: 'Professional, conversion-optimized landing pages ready to deploy'
                },
                {
                  title: 'Flexible Hosting Options',
                  description: 'Download & host anywhere or use our one-click hosting solution'
                },
                {
                  title: 'AI Campaign Builder',
                  description: 'Automatically generate optimized campaigns with high Quality Score'
                },
                {
                  title: 'Instant Platform Connection',
                  description: 'Connect to Google Ads or Microsoft Ads and go live immediately'
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
                  <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
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

            <button className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl hover:shadow-xl transition-all flex items-center gap-2 group">
              Start Building Now
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </motion.div>

          {/* Right - 3-Step Process */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="bg-white rounded-3xl p-8 border-2 border-gray-200 shadow-xl">
              <h3 className="text-gray-900 text-center mb-6">3-Step Workflow</h3>
              
              <div className="space-y-4">
                {[
                  {
                    step: '1',
                    icon: '🎨',
                    title: 'Pick & Host Website',
                    description: 'Choose template, customize, and deploy',
                    time: '15 seconds',
                    color: 'from-blue-500 to-cyan-600'
                  },
                  {
                    step: '2',
                    icon: '🚀',
                    title: 'Build Campaign',
                    description: 'AI-optimized ads and extensions',
                    time: '30 seconds',
                    color: 'from-purple-500 to-pink-600'
                  },
                  {
                    step: '3',
                    icon: '✨',
                    title: 'Go Live',
                    description: 'Connect platform and launch',
                    time: '15 seconds',
                    color: 'from-green-500 to-emerald-600'
                  }
                ].map((step, index) => (
                  <motion.div
                    key={step.step}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.15 }}
                    className="relative bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 border-2 border-gray-200 hover:border-purple-300 transition-all"
                  >
                    <div className="flex items-start gap-4">
                      {/* Step Number */}
                      <div className={`w-12 h-12 bg-gradient-to-br ${step.color} rounded-xl flex items-center justify-center text-white shadow-md flex-shrink-0`}>
                        <span className="text-xl">{step.step}</span>
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="text-gray-900 mb-1">{step.title}</h4>
                            <p className="text-gray-600 text-sm">{step.description}</p>
                          </div>
                          <span className="text-3xl ml-2">{step.icon}</span>
                        </div>
                        
                        {/* Time Badge */}
                        <div className="inline-block px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs border border-indigo-200 mt-2">
                          ⚡ {step.time}
                        </div>
                      </div>
                    </div>

                    {/* Arrow connector */}
                    {index < 2 && (
                      <motion.div
                        className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 z-10"
                        animate={{ y: [0, 3, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: index * 0.3 }}
                      >
                        <svg className="w-6 h-6 text-purple-500" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M7 10l5 5 5-5z" />
                        </svg>
                      </motion.div>
                    )}
                  </motion.div>
                ))}

                {/* Total Time */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5 }}
                  className="p-6 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl text-white text-center"
                >
                  <div className="text-4xl mb-2">🎉</div>
                  <div className="text-xl mb-1">Live & Running!</div>
                  <div className="text-green-100 text-sm">Total Time: ~60 seconds</div>
                </motion.div>
              </div>
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
          {['Electrician', 'Plumber', 'Law Firm', 'Pest Control', 'HVAC', 'Lawn Care', 'Roofing', 'Dental'].map((useCase) => (
            <span key={useCase} className="px-4 py-2 bg-purple-50 text-purple-600 rounded-full text-sm border border-purple-100">
              {useCase}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
