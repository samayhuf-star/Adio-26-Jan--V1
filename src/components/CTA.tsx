import { motion } from 'framer-motion';
import { ArrowRight, Check } from './Icons';

const benefits = [
  'No credit card required',
  'Full access to all features',
  'Cancel anytime',
  'Dedicated support team'
];

export function CTA() {
  return (
    <section className="py-32 px-6 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0">
        <motion.div
          className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 10, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl"
          animate={{
            scale: [1.3, 1, 1.3],
            opacity: [0.5, 0.3, 0.5],
          }}
          transition={{ duration: 10, repeat: Infinity }}
        />
      </div>

      <div className="max-w-5xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-12 md:p-16 text-center"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h2 className="text-white mb-6">
              Ready to{' '}
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Transform
              </span>{' '}
              Your Advertising?
            </h2>
            <p className="text-slate-300 text-lg mb-8 max-w-2xl mx-auto">
              Join thousands of brands that have already discovered the power of data-driven advertising. Start your free trial today.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8"
          >
            <motion.button
              className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full text-white flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Start Your Free Trial
              <ArrowRight size={20} />
            </motion.button>
            <motion.button
              className="px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-white"
              whileHover={{ scale: 1.05, backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
              whileTap={{ scale: 0.95 }}
            >
              Schedule a Demo
            </motion.button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-3xl mx-auto"
          >
            {benefits.map((benefit, index) => (
              <div
                key={benefit}
                className="flex items-center justify-center gap-2 text-slate-300"
              >
                <div className="w-5 h-5 bg-indigo-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <Check size={14} className="text-green-400" />
                </div>
                <span className="text-sm">{benefit}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-16 text-center"
        >
          <div className="flex items-center justify-center gap-8 mb-8 flex-wrap">
            <a href="#" className="text-slate-400 hover:text-white transition-colors">About</a>
            <a href="#" className="text-slate-400 hover:text-white transition-colors">Features</a>
            <a href="#" className="text-slate-400 hover:text-white transition-colors">Pricing</a>
            <a href="#" className="text-slate-400 hover:text-white transition-colors">Blog</a>
            <a href="#" className="text-slate-400 hover:text-white transition-colors">Contact</a>
            <a href="#" className="text-slate-400 hover:text-white transition-colors">Privacy</a>
            <a href="#" className="text-slate-400 hover:text-white transition-colors">Terms</a>
          </div>
          <div className="text-slate-500">
            © 2025 Adiology. All rights reserved.
          </div>
        </motion.div>
      </div>
    </section>
  );
}