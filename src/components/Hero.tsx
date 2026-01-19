import { motion } from 'framer-motion';
import { ArrowRight } from './Icons';

interface HeroProps {
  onGetStarted: () => void;
}

export function Hero({ onGetStarted }: HeroProps) {
  return (
    <section className="pt-24 sm:pt-28 md:pt-32 pb-16 sm:pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-blue-50/30 to-white w-full">
      <div className="max-w-7xl mx-auto w-full">
        <div className="max-w-4xl mx-auto text-center w-full">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-gray-900 mb-6"
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
            <button onClick={onGetStarted} className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:shadow-xl transition-all flex items-center gap-2 group">
              Get Started
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="px-8 py-3 bg-white text-gray-700 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all">
              Contact Sales
            </button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}