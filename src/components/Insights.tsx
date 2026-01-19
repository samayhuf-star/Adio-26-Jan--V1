import { motion } from 'framer-motion';
import { ArrowUpRight, Clock, User } from './Icons';

const insights = [
  {
    category: 'Industry Trends',
    title: 'The Future of Programmatic Advertising in 2025',
    excerpt: 'Discover how AI and machine learning are reshaping the programmatic landscape and what it means for advertisers.',
    author: 'Sarah Chen',
    date: '5 min read',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80'
  },
  {
    category: 'Case Study',
    title: 'How Brand X Achieved 300% ROI in 90 Days',
    excerpt: 'A deep dive into the strategies and tactics that led to unprecedented growth for one of our enterprise clients.',
    author: 'Michael Rodriguez',
    date: '8 min read',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80'
  },
  {
    category: 'Best Practices',
    title: 'Mastering Multi-Channel Attribution',
    excerpt: 'Learn how to accurately attribute conversions across multiple touchpoints and optimize your marketing mix.',
    author: 'Emily Parker',
    date: '6 min read',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80'
  }
];

export function Insights() {
  return (
    <section className="py-32 px-6 relative">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex flex-col md:flex-row items-start md:items-center justify-between mb-16"
        >
          <div>
            <div className="inline-block px-4 py-2 bg-purple-500/20 border border-purple-500/30 rounded-full mb-6">
              <span className="text-purple-300">Latest Insights</span>
            </div>
            <h2 className="text-white mb-4">
              Stay Ahead of the{' '}
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Curve
              </span>
            </h2>
            <p className="text-slate-300 text-lg max-w-2xl">
              Expert insights, industry trends, and actionable strategies from our team of advertising specialists.
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="mt-6 md:mt-0 px-6 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-white flex items-center gap-2 hover:bg-white/20 transition-colors"
          >
            View All Articles
            <ArrowUpRight size={18} />
          </motion.button>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {insights.map((insight, index) => (
            <motion.article
              key={insight.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ y: -8 }}
              className="group cursor-pointer"
            >
              <div className="bg-slate-800/30 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-all">
                <div className="relative h-48 overflow-hidden bg-slate-700">
                  <img
                    src={insight.image}
                    alt={insight.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute top-4 left-4 px-3 py-1 bg-purple-500/90 backdrop-blur-sm rounded-full">
                    <span className="text-white text-sm">{insight.category}</span>
                  </div>
                </div>

                <div className="p-6">
                  <h3 className="text-white mb-3 group-hover:text-purple-400 transition-colors">
                    {insight.title}
                  </h3>
                  <p className="text-slate-400 mb-6">{insight.excerpt}</p>

                  <div className="flex items-center justify-between text-sm text-slate-500">
                    <div className="flex items-center gap-2">
                      <User size={16} />
                      <span>{insight.author}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={16} />
                      <span>{insight.date}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}