import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from './Icons';

interface NavigationProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

export function Navigation({ onGetStarted, onLogin }: NavigationProps) {
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
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100 w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 w-full">
        <div className="flex items-center justify-between w-full">
          {/* Logo */}
          <motion.div 
            className="flex items-center gap-2"
            whileHover={{ scale: 1.02 }}
          >
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white">A</span>
            </div>
            <span className="text-gray-900">adiology</span>
          </motion.div>

          {/* Desktop Navigation */}
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
            <button onClick={onLogin} className="px-5 py-2 text-gray-600 hover:text-gray-900 transition-colors text-sm">
              Sign In
            </button>
            <button onClick={onGetStarted} className="px-5 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg text-sm hover:shadow-lg transition-shadow">
              Get Started
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden text-gray-900"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
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
              <button onClick={onLogin} className="block w-full text-left py-2 text-gray-600 hover:text-gray-900 transition-colors">
                Sign In
              </button>
              <button onClick={onGetStarted} className="w-full mt-4 px-5 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg text-sm">
                Get Started
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
}