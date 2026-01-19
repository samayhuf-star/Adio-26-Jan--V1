import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Zap, Check, Clock, Users, Sparkles, Target, BarChart3, 
  FileText, Globe, Rocket, Shield, Award, ArrowRight,
  TrendingUp, Layers, MousePointer, ChevronRight, Star,
  Timer, AlertCircle, Gift, CreditCard
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

interface PromoLandingPageProps {
  onStartTrial: () => void;
  onNavigate?: (page: 'privacy-policy' | 'terms-of-service' | 'cookie-policy' | 'gdpr-compliance' | 'refund-policy' | 'blog') => void;
}

export function PromoLandingPage({ onStartTrial, onNavigate }: PromoLandingPageProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 6,
    hours: 23,
    minutes: 59,
    seconds: 59
  });
  const [slotsLeft, setSlotsLeft] = useState(5);
  const [totalSlots, setTotalSlots] = useState(50);
  const [offerActive, setOfferActive] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch promo status from API
  useEffect(() => {
    const fetchPromoStatus = async () => {
      try {
        const response = await fetch('/api/promo/status');
        if (response.ok) {
          const data = await response.json();
          setSlotsLeft(data.slotsRemaining);
          setTotalSlots(data.totalSlots);
          setOfferActive(data.offerActive);
        }
      } catch (error) {
        console.warn('Could not fetch promo status:', error);
      }
    };
    
    fetchPromoStatus();
    // Poll every 30 seconds
    const pollInterval = setInterval(fetchPromoStatus, 30000);
    return () => clearInterval(pollInterval);
  }, []);

  useEffect(() => {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 7);
    
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = endDate.getTime() - now;
      
      if (distance > 0) {
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000)
        });
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  const handleStartTrial = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/promo/trial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.checkoutUrl) {
          window.location.href = data.checkoutUrl;
        }
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to start trial. Please try again.');
      }
    } catch (error) {
      console.error('Trial start error:', error);
      alert('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    {
      icon: Target,
      title: 'Smart Campaign Builder',
      description: 'AI-powered campaign creation with 14 proven structures including SKAG, STAG, and Alpha-Beta'
    },
    {
      icon: Sparkles,
      title: 'AI Keyword Generation',
      description: 'Generate 500+ targeted keywords instantly with intent-based filtering and negative keyword suggestions'
    },
    {
      icon: FileText,
      title: 'Dynamic Ad Creation',
      description: 'Create RSA, DKI, and Call-Only ads with live preview and Google Ads policy compliance'
    },
    {
      icon: Globe,
      title: 'Geo Targeting',
      description: 'Target by country, state, city, or ZIP code with 15,000+ locations supported'
    },
    {
      icon: Layers,
      title: '70+ Campaign Presets',
      description: 'Ready-made templates for every vertical: legal, dental, HVAC, real estate, and more'
    },
    {
      icon: BarChart3,
      title: 'Google Ads Export',
      description: 'Export campaigns directly to Google Ads Editor format - import and go live in minutes'
    },
    {
      icon: TrendingUp,
      title: 'Keyword Mixer & Planner',
      description: 'Combine keywords, filter by intent, and discover long-tail opportunities'
    }
  ];

  const testimonials = [
    {
      name: 'Sarah M.',
      role: 'Digital Marketing Manager',
      content: 'Cut our campaign setup time by 80%. What used to take days now takes minutes.',
      rating: 5
    },
    {
      name: 'Mike R.',
      role: 'Agency Owner',
      content: 'The AI keyword generation is incredible. We generated over 500 targeted keywords in seconds.',
      rating: 5
    },
    {
      name: 'Jennifer L.',
      role: 'Small Business Owner',
      content: 'Finally a tool that makes Google Ads accessible. The presets are a game-changer.',
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Urgency Banner */}
      <div className="bg-gradient-to-r from-red-600 via-orange-500 to-red-600 py-3 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-center gap-4 text-white text-center">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 animate-pulse" />
            <span className="font-bold">LIMITED TIME OFFER</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Only</span>
            <span className="bg-white/20 px-3 py-1 rounded-full font-bold">{slotsLeft} of 50 slots left</span>
          </div>
          <div className="flex items-center gap-2">
            <Timer className="w-4 h-4" />
            <span>Expires in {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s</span>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative py-20 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900/30 via-transparent to-transparent" />
        
        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            {/* Special Offer Badge */}
            <Badge className="mb-6 bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 px-6 py-2 text-lg">
              <Gift className="w-5 h-5 mr-2" />
              SPECIAL LAUNCH OFFER - 90% OFF
            </Badge>

            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              Build Google Ads Campaigns
              <span className="block bg-gradient-to-r from-purple-400 via-pink-400 to-amber-400 bg-clip-text text-transparent">
                10x Faster with AI
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
              The complete platform for creating, managing, and optimizing 
              Google Ads campaigns. From keywords to ads to landing pages - all in one place.
            </p>

            {/* Trial Offer Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="max-w-3xl mx-auto mb-12"
            >
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 rounded-2xl blur-lg opacity-75 animate-pulse" />
                <div className="relative bg-slate-900 border border-white/10 rounded-2xl p-8">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="text-left">
                      <div className="flex items-baseline gap-3 mb-2">
                        <span className="text-5xl font-bold text-white">$5</span>
                        <span className="text-gray-400 line-through text-xl">$99.99</span>
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Save 95%</Badge>
                      </div>
                      <p className="text-gray-300 text-lg mb-2">
                        <strong>5-Day Full Access Trial</strong>
                      </p>
                      <ul className="text-gray-400 text-sm space-y-1">
                        <li className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-green-400" />
                          All premium features unlocked
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-green-400" />
                          Cancel anytime within 5 days for full refund
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-green-400" />
                          Auto-converts to Lifetime Plan ($94.99 after $5 credit)
                        </li>
                      </ul>
                    </div>
                    <Button
                      onClick={handleStartTrial}
                      disabled={isLoading}
                      size="lg"
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-10 py-6 text-xl font-bold rounded-xl shadow-2xl shadow-purple-500/30 transition-all hover:scale-105"
                    >
                      {isLoading ? (
                        <span className="flex items-center gap-2">
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Processing...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          Start $5 Trial
                          <ArrowRight className="w-6 h-6" />
                        </span>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* WIN-WIN HIGHLIGHT SECTION */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="max-w-4xl mx-auto mb-12"
            >
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500 rounded-2xl blur opacity-50" />
                <div className="relative bg-gradient-to-br from-amber-950/80 to-orange-950/80 border-2 border-amber-500/50 rounded-2xl p-8">
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <Gift className="w-8 h-8 text-amber-400" />
                    <h3 className="text-2xl md:text-3xl font-bold text-amber-300">A WIN-WIN Deal For You</h3>
                    <Gift className="w-8 h-8 text-amber-400" />
                  </div>
                  
                  <div className="text-center mb-6">
                    <p className="text-lg md:text-xl text-white mb-4">
                      <strong>Pay just $5 to test the ENTIRE platform</strong> - explore every feature, 
                      build campaigns, generate keywords, create ads. Take it for a full spin!
                    </p>
                  </div>

                  <div className="bg-black/30 rounded-xl p-6 mb-6">
                    <h4 className="text-xl font-bold text-white mb-4 text-center">What You Get Forever with Lifetime Plan:</h4>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                      {[
                        '10 Campaigns per month',
                        '50 Campaign Presets',
                        '50 Templates',
                        'Access for 2 Users',
                        '1-Click Campaign Builder',
                        'Campaign Builder Wizard',
                        '10+ Google Ads Assets',
                        'Campaign History',
                        'Keywords Planner',
                        'Keyword Mixer',
                        'Negative Keywords Tool',
                        'Long Tail Keywords',
                        'Website Templates & Builder',
                        'AI Ad Creation',
                        'CSV Export (Google Ads Ready)',
                        'Save Lists Individually',
                        'All Future Updates',
                        'Priority Support'
                      ].map((feature, i) => (
                        <div key={i} className="flex items-center gap-2 text-gray-200">
                          <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="text-center">
                    <p className="text-amber-200/80 text-sm mb-2">
                      If you love it (and you will), after 5 days it automatically converts to our Lifetime Plan at 
                      <span className="font-semibold text-white"> $99.99</span> - but we credit your $5 trial!
                      <span className="text-green-400 font-medium"> You only pay $94.99 for LIFETIME access.</span>
                    </p>
                    <p className="text-amber-200 text-base mt-3">
                      <strong>One payment. Own it forever.</strong> No monthly fees, no renewals, no surprises.
                    </p>
                    <p className="text-gray-400 text-sm mt-1">
                      Not satisfied? Cancel within 5 days and get your $5 back. Zero risk.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center justify-center gap-8 text-gray-400">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-400" />
                <span>Secure Payment</span>
              </div>
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-400" />
                <span>Powered by Stripe</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400" />
                <span>30-Day Money Back</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Countdown Timer Section */}
      <section className="py-12 px-6 bg-gradient-to-r from-purple-900/30 to-pink-900/30 border-y border-white/10">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-2xl font-bold text-white mb-6">Offer Expires In:</h3>
          <div className="flex justify-center gap-4">
            {[
              { value: timeLeft.days, label: 'Days' },
              { value: timeLeft.hours, label: 'Hours' },
              { value: timeLeft.minutes, label: 'Minutes' },
              { value: timeLeft.seconds, label: 'Seconds' }
            ].map((item, i) => (
              <div key={i} className="bg-slate-800 border border-white/10 rounded-xl p-4 min-w-[80px]">
                <div className="text-4xl font-bold text-white">{String(item.value).padStart(2, '0')}</div>
                <div className="text-gray-400 text-sm">{item.label}</div>
              </div>
            ))}
          </div>
          <div className="mt-6 flex items-center justify-center gap-2 text-amber-400">
            <Users className="w-5 h-5" />
            <span className="font-semibold">{slotsLeft} slots remaining out of 50</span>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-purple-500/20 text-purple-300 border-purple-500/30">
              Everything You Need
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Powerful Features, <span className="text-purple-400">Zero Complexity</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Everything you need to create, launch, and optimize Google Ads campaigns - all included in your trial.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-slate-800/50 border border-white/10 rounded-xl p-6 hover:border-purple-500/50 transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-400 text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6 bg-slate-900/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">How the Trial Works</h2>
            <p className="text-xl text-gray-400">Simple, transparent, no surprises</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                title: 'Pay $5 Today',
                description: 'Get instant access to all premium features. Full platform unlocked immediately.'
              },
              {
                step: '2',
                title: 'Explore for 5 Days',
                description: 'Build campaigns, generate keywords, create ads. Use everything with no restrictions.'
              },
              {
                step: '3',
                title: 'Keep Forever or Cancel',
                description: 'Love it? Your $5 is credited to the Lifetime Plan ($99.99 - $5 = $94.99). Own it forever! Not for you? Cancel for a full refund.'
              }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className="relative"
              >
                <div className="bg-slate-800 border border-white/10 rounded-xl p-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-gray-400">{item.description}</p>
                </div>
                {i < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                    <ChevronRight className="w-8 h-8 text-purple-500" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Loved by Marketers</h2>
            <p className="text-xl text-gray-400">Join thousands of happy customers</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-slate-800/50 border border-white/10 rounded-xl p-6"
              >
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, j) => (
                    <Star key={j} className="w-5 h-5 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-gray-300 mb-4">"{testimonial.content}"</p>
                <div>
                  <div className="font-bold text-white">{testimonial.name}</div>
                  <div className="text-gray-500 text-sm">{testimonial.role}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-6 bg-gradient-to-r from-purple-900/50 to-pink-900/50">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <Badge className="mb-6 bg-red-500/20 text-red-300 border-red-500/30 px-4 py-2">
              <AlertCircle className="w-4 h-4 mr-2" />
              Only {slotsLeft} spots left at this price
            </Badge>

            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Don't Miss This Limited Offer
            </h2>

            <p className="text-xl text-gray-300 mb-8">
              Start building better Google Ads campaigns today. 
              Risk-free with our 5-day trial and full refund guarantee.
            </p>

            <Button
              onClick={handleStartTrial}
              disabled={isLoading}
              size="lg"
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white px-12 py-6 text-xl font-bold rounded-xl shadow-2xl shadow-amber-500/30 transition-all hover:scale-105"
            >
              {isLoading ? 'Processing...' : 'Start Your $5 Trial Now'}
              <Rocket className="w-6 h-6 ml-2" />
            </Button>

            <p className="mt-6 text-gray-400 text-sm">
              Secure checkout powered by Stripe. Cancel anytime within 5 days for a full refund.
            </p>
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">Frequently Asked Questions</h2>
          
          <div className="space-y-6">
            {[
              {
                q: 'What happens after the 5-day trial?',
                a: 'If you love the platform, your $5 trial fee is automatically credited toward the Lifetime Plan. You\'ll be charged only $94.99 ($99.99 - $5 credit) for permanent, lifetime access. No monthly fees ever!'
              },
              {
                q: 'Can I really cancel anytime?',
                a: 'Absolutely! Cancel within the 5-day trial period for a full $5 refund. No questions asked, no hidden fees. You can cancel directly from your account settings.'
              },
              {
                q: 'What\'s included in the Lifetime Plan?',
                a: 'Everything! 10 campaigns/month, 50 presets, 50 templates, 2 users, all campaign builders, keywords tools, AI ad creation, CSV export, website builder, and ALL future updates. Own it forever with one payment.'
              },
              {
                q: 'Why is this offer limited to 50 slots?',
                a: 'We want to ensure every trial user gets personalized support and a great experience. By limiting slots, we can provide better onboarding and assistance during your trial.'
              },
              {
                q: 'Is this really a one-time payment?',
                a: 'Yes! The Lifetime Plan is a single payment of $99.99 (only $94.99 with your trial credit). You own the software forever with no recurring charges. Plus, you get all future updates included.'
              }
            ].map((faq, i) => (
              <div key={i} className="bg-slate-800/50 border border-white/10 rounded-xl p-6">
                <h3 className="text-lg font-bold text-white mb-2">{faq.q}</h3>
                <p className="text-gray-400">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMPREHENSIVE FEATURE SHOWCASE */}
      <section className="py-20 px-6 bg-gradient-to-b from-slate-900 to-slate-950">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-purple-500/20 text-purple-300 border-purple-500/30">
              Complete Platform Tour
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Everything You Need to <span className="text-purple-400">Dominate Google Ads</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Explore every feature of Adiology. From campaign creation to keyword research, 
              ad generation to website building - see exactly what you're getting.
            </p>
          </div>

          {/* PILLAR 1: CAMPAIGN BUILDERS */}
          <div className="mb-20">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Rocket className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-3xl font-bold text-white">Campaign Builders</h3>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              {/* 1-Click Campaign */}
              <div className="bg-slate-800/50 border border-white/10 rounded-2xl p-6 hover:border-purple-500/50 transition-all">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <MousePointer className="w-5 h-5 text-purple-400" />
                  </div>
                  <h4 className="text-xl font-bold text-white">1-Click Campaign Builder</h4>
                </div>
                <p className="text-gray-400 mb-4">
                  The fastest way to create a complete Google Ads campaign. Just enter your website URL and let our AI 
                  analyze your business, generate keywords, create ads, and structure your campaign - all in one click.
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2 text-gray-300">
                    <Check className="w-4 h-4 text-green-400" /> AI-powered website analysis
                  </li>
                  <li className="flex items-center gap-2 text-gray-300">
                    <Check className="w-4 h-4 text-green-400" /> Automatic keyword generation (500+ keywords)
                  </li>
                  <li className="flex items-center gap-2 text-gray-300">
                    <Check className="w-4 h-4 text-green-400" /> Smart campaign structure selection
                  </li>
                  <li className="flex items-center gap-2 text-gray-300">
                    <Check className="w-4 h-4 text-green-400" /> Instant CSV export for Google Ads Editor
                  </li>
                </ul>
              </div>

              {/* Campaign Builder 3.0 */}
              <div className="bg-slate-800/50 border border-white/10 rounded-2xl p-6 hover:border-purple-500/50 transition-all">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-pink-500/20 flex items-center justify-center">
                    <Layers className="w-5 h-5 text-pink-400" />
                  </div>
                  <h4 className="text-xl font-bold text-white">Campaign Builder 3.0 (7-Step Wizard)</h4>
                </div>
                <p className="text-gray-400 mb-4">
                  Our most powerful campaign builder. A guided 7-step wizard that walks you through every aspect 
                  of campaign creation with full control and customization.
                </p>
                <div className="bg-slate-900/50 rounded-lg p-3 mb-4">
                  <p className="text-xs text-gray-500 mb-2">The 7 Steps:</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <span className="text-purple-300">1. URL Analysis</span>
                    <span className="text-purple-300">2. Structure Selection</span>
                    <span className="text-purple-300">3. Keywords</span>
                    <span className="text-purple-300">4. Ads & Extensions</span>
                    <span className="text-purple-300">5. Geo Targeting</span>
                    <span className="text-purple-300">6. CSV Generation</span>
                    <span className="text-purple-300">7. Success & Export</span>
                  </div>
                </div>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2 text-gray-300">
                    <Check className="w-4 h-4 text-green-400" /> 14 campaign structures (SKAG, STAG, Alpha-Beta, etc.)
                  </li>
                  <li className="flex items-center gap-2 text-gray-300">
                    <Check className="w-4 h-4 text-green-400" /> Real-time ad preview with policy compliance
                  </li>
                  <li className="flex items-center gap-2 text-gray-300">
                    <Check className="w-4 h-4 text-green-400" /> 15,000+ geo-targeting locations
                  </li>
                </ul>
              </div>
            </div>

            {/* Campaign Structures */}
            <div className="mt-8 bg-slate-800/30 border border-white/10 rounded-2xl p-6">
              <h4 className="text-lg font-bold text-white mb-4">14 Proven Campaign Structures</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                {['SKAG', 'STAG', 'Alpha-Beta', 'Intent-Based', 'Hybrid', 'Location-Based', 'Service-Based', 
                  'Product-Based', 'Brand vs Non-Brand', 'Funnel-Based', 'Match Type', 'Theme-Based', 
                  'Competitor', 'Seasonal'].map((structure, i) => (
                  <div key={i} className="bg-slate-900/50 rounded-lg px-3 py-2 text-center">
                    <span className="text-sm text-gray-300">{structure}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* PILLAR 2: KEYWORD TOOLS */}
          <div className="mb-20">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <Target className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-3xl font-bold text-white">Keyword Tools</h3>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Keywords Planner */}
              <div className="bg-slate-800/50 border border-white/10 rounded-xl p-5">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center mb-4">
                  <BarChart3 className="w-5 h-5 text-blue-400" />
                </div>
                <h4 className="text-lg font-bold text-white mb-2">Keywords Planner</h4>
                <p className="text-gray-400 text-sm mb-3">
                  Generate hundreds of targeted keywords based on your seed terms. Filter by intent, 
                  match type, and relevance.
                </p>
                <ul className="space-y-1 text-xs text-gray-400">
                  <li>- AI-powered suggestions</li>
                  <li>- Intent classification</li>
                  <li>- Bulk generation</li>
                  <li>- Export to campaigns</li>
                </ul>
              </div>

              {/* Keyword Mixer */}
              <div className="bg-slate-800/50 border border-white/10 rounded-xl p-5">
                <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center mb-4">
                  <Sparkles className="w-5 h-5 text-cyan-400" />
                </div>
                <h4 className="text-lg font-bold text-white mb-2">Keyword Mixer</h4>
                <p className="text-gray-400 text-sm mb-3">
                  Combine multiple keyword lists to create comprehensive targeting. 
                  Mix modifiers, locations, and services.
                </p>
                <ul className="space-y-1 text-xs text-gray-400">
                  <li>- Multi-list combination</li>
                  <li>- Modifier templates</li>
                  <li>- Location insertion</li>
                  <li>- Instant preview</li>
                </ul>
              </div>

              {/* Negative Keywords */}
              <div className="bg-slate-800/50 border border-white/10 rounded-xl p-5">
                <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center mb-4">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                </div>
                <h4 className="text-lg font-bold text-white mb-2">Negative Keywords</h4>
                <p className="text-gray-400 text-sm mb-3">
                  Protect your budget by excluding irrelevant searches. 
                  AI-suggested negatives based on your industry.
                </p>
                <ul className="space-y-1 text-xs text-gray-400">
                  <li>- Industry templates</li>
                  <li>- AI suggestions</li>
                  <li>- Bulk import/export</li>
                  <li>- Campaign integration</li>
                </ul>
              </div>

              {/* Long Tail Keywords */}
              <div className="bg-slate-800/50 border border-white/10 rounded-xl p-5">
                <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center mb-4">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                </div>
                <h4 className="text-lg font-bold text-white mb-2">Long Tail Keywords</h4>
                <p className="text-gray-400 text-sm mb-3">
                  Discover high-intent, low-competition long tail opportunities 
                  that drive quality conversions.
                </p>
                <ul className="space-y-1 text-xs text-gray-400">
                  <li>- Question keywords</li>
                  <li>- Intent-focused</li>
                  <li>- Competition analysis</li>
                  <li>- Conversion potential</li>
                </ul>
              </div>
            </div>
          </div>

          {/* PILLAR 3: AD CREATION & EXTENSIONS */}
          <div className="mb-20">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-3xl font-bold text-white">AI Ad Creation & Extensions</h3>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* AI Ad Generator */}
              <div className="bg-slate-800/50 border border-white/10 rounded-2xl p-6">
                <h4 className="text-xl font-bold text-white mb-4">AI-Powered Ad Generator</h4>
                <p className="text-gray-400 mb-4">
                  Create compelling RSA (Responsive Search Ads), DKI (Dynamic Keyword Insertion) ads, 
                  and Call-Only ads with our AI engine. Fully compliant with Google Ads policies.
                </p>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-slate-900/50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-amber-400">15</div>
                    <div className="text-xs text-gray-400">Headlines</div>
                  </div>
                  <div className="bg-slate-900/50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-amber-400">4</div>
                    <div className="text-xs text-gray-400">Descriptions</div>
                  </div>
                  <div className="bg-slate-900/50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-amber-400">100%</div>
                    <div className="text-xs text-gray-400">Compliant</div>
                  </div>
                </div>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2 text-gray-300">
                    <Check className="w-4 h-4 text-green-400" /> Real-time character count validation
                  </li>
                  <li className="flex items-center gap-2 text-gray-300">
                    <Check className="w-4 h-4 text-green-400" /> Ad strength scoring
                  </li>
                  <li className="flex items-center gap-2 text-gray-300">
                    <Check className="w-4 h-4 text-green-400" /> Live preview as you type
                  </li>
                </ul>
              </div>

              {/* Ad Extensions */}
              <div className="bg-slate-800/50 border border-white/10 rounded-2xl p-6">
                <h4 className="text-xl font-bold text-white mb-4">10+ Ad Extensions</h4>
                <p className="text-gray-400 mb-4">
                  Maximize your ad real estate with comprehensive extensions. 
                  Pre-built templates for every extension type.
                </p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {['Sitelinks', 'Callouts', 'Structured Snippets', 'Call Extensions', 
                    'Location Extensions', 'Price Extensions', 'Promotion Extensions', 
                    'App Extensions', 'Lead Form Extensions', 'Image Assets'].map((ext, i) => (
                    <div key={i} className="flex items-center gap-2 text-gray-300">
                      <Check className="w-3 h-3 text-green-400" />
                      <span>{ext}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* PILLAR 4: WEBSITE BUILDER */}
          <div className="mb-20">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center">
                <Globe className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-3xl font-bold text-white">Website Builder & Templates</h3>
            </div>

            <div className="bg-slate-800/50 border border-white/10 rounded-2xl p-6 mb-6">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-xl font-bold text-white mb-4">Drag-and-Drop Website Editor</h4>
                  <p className="text-gray-400 mb-4">
                    Create stunning landing pages that convert. Our sections-based editor lets you 
                    build professional websites without any coding knowledge.
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2 text-gray-300">
                      <Check className="w-4 h-4 text-green-400" /> 13+ pre-built section types
                    </li>
                    <li className="flex items-center gap-2 text-gray-300">
                      <Check className="w-4 h-4 text-green-400" /> Mobile-responsive designs
                    </li>
                    <li className="flex items-center gap-2 text-gray-300">
                      <Check className="w-4 h-4 text-green-400" /> Custom colors and branding
                    </li>
                    <li className="flex items-center gap-2 text-gray-300">
                      <Check className="w-4 h-4 text-green-400" /> One-click publishing
                    </li>
                    <li className="flex items-center gap-2 text-gray-300">
                      <Check className="w-4 h-4 text-green-400" /> HTML export available
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white mb-3">Section Types Available:</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {['Hero', 'Features', 'Services', 'Testimonials', 'Team', 'FAQ', 
                      'Pricing', 'Gallery', 'Blog', 'Partners', 'CTA', 'Contact', 'About'].map((section, i) => (
                      <div key={i} className="bg-slate-900/50 rounded px-3 py-2 text-gray-300 text-center">
                        {section}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 50+ Templates */}
            <div className="bg-gradient-to-r from-green-900/30 to-teal-900/30 border border-green-500/30 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Award className="w-8 h-8 text-green-400" />
                <h4 className="text-xl font-bold text-white">50+ Ready-Made Templates</h4>
              </div>
              <p className="text-gray-300 mb-4">
                Professional templates for every industry. Just pick one, customize, and publish!
              </p>
              <div className="flex flex-wrap gap-2">
                {['Legal', 'Dental', 'HVAC', 'Plumbing', 'Real Estate', 'Medical', 'Automotive', 
                  'Restaurant', 'Fitness', 'E-commerce', 'SaaS', 'Agency', 'Consulting', 'Photography'].map((industry, i) => (
                  <Badge key={i} className="bg-green-500/20 text-green-300 border-green-500/30">
                    {industry}
                  </Badge>
                ))}
                <Badge className="bg-white/10 text-white border-white/20">+36 more</Badge>
              </div>
            </div>
          </div>

          {/* PILLAR 5: CAMPAIGN MANAGEMENT */}
          <div className="mb-20">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-3xl font-bold text-white">Campaign Management & Export</h3>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {/* Campaign History */}
              <div className="bg-slate-800/50 border border-white/10 rounded-xl p-5">
                <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center mb-4">
                  <Clock className="w-5 h-5 text-indigo-400" />
                </div>
                <h4 className="text-lg font-bold text-white mb-2">Campaign History</h4>
                <p className="text-gray-400 text-sm">
                  All your campaigns saved and organized. Search, filter, and access any 
                  campaign you've ever created. Grid and list views available.
                </p>
              </div>

              {/* Google Ads Integration */}
              <div className="bg-slate-800/50 border border-white/10 rounded-xl p-5">
                <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center mb-4">
                  <TrendingUp className="w-5 h-5 text-violet-400" />
                </div>
                <h4 className="text-lg font-bold text-white mb-2">Google Ads Integration</h4>
                <p className="text-gray-400 text-sm">
                  Connect your Google Ads account and push campaigns directly. 
                  OAuth integration with one-click campaign deployment.
                </p>
              </div>

              {/* CSV Export */}
              <div className="bg-slate-800/50 border border-white/10 rounded-xl p-5">
                <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center mb-4">
                  <FileText className="w-5 h-5 text-purple-400" />
                </div>
                <h4 className="text-lg font-bold text-white mb-2">Google Ads Editor CSV</h4>
                <p className="text-gray-400 text-sm">
                  Export in the exact format Google Ads Editor expects. 
                  183-column master format for immediate import.
                </p>
              </div>
            </div>
          </div>

          {/* PILLAR 6: GEO TARGETING & PRESETS */}
          <div className="mb-20">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center">
                <Globe className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-3xl font-bold text-white">Geo Targeting & Campaign Presets</h3>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Geo Targeting */}
              <div className="bg-slate-800/50 border border-white/10 rounded-2xl p-6">
                <h4 className="text-xl font-bold text-white mb-4">15,000+ Locations</h4>
                <p className="text-gray-400 mb-4">
                  Target your ads with precision. From countries to cities, states to ZIP codes - 
                  reach exactly the audience you want.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-900/50 rounded-lg p-3">
                    <div className="text-2xl font-bold text-rose-400">195+</div>
                    <div className="text-xs text-gray-400">Countries</div>
                  </div>
                  <div className="bg-slate-900/50 rounded-lg p-3">
                    <div className="text-2xl font-bold text-rose-400">50</div>
                    <div className="text-xs text-gray-400">US States</div>
                  </div>
                  <div className="bg-slate-900/50 rounded-lg p-3">
                    <div className="text-2xl font-bold text-rose-400">10K+</div>
                    <div className="text-xs text-gray-400">Cities</div>
                  </div>
                  <div className="bg-slate-900/50 rounded-lg p-3">
                    <div className="text-2xl font-bold text-rose-400">40K+</div>
                    <div className="text-xs text-gray-400">ZIP Codes</div>
                  </div>
                </div>
              </div>

              {/* 50+ Campaign Presets */}
              <div className="bg-slate-800/50 border border-white/10 rounded-2xl p-6">
                <h4 className="text-xl font-bold text-white mb-4">50+ Campaign Presets</h4>
                <p className="text-gray-400 mb-4">
                  Industry-specific campaign templates with pre-configured keywords, 
                  ad copy, and targeting. Just customize and launch.
                </p>
                <div className="flex flex-wrap gap-2">
                  {['Personal Injury Lawyer', 'Dentist', 'HVAC Repair', 'Plumber', 'Roofer', 
                    'Real Estate Agent', 'Car Dealership', 'Moving Company', 'Landscaping'].map((preset, i) => (
                    <span key={i} className="text-xs bg-rose-500/20 text-rose-300 px-2 py-1 rounded">
                      {preset}
                    </span>
                  ))}
                  <span className="text-xs bg-white/10 text-white px-2 py-1 rounded">+41 more</span>
                </div>
              </div>
            </div>
          </div>

          {/* PILLAR 7: BLOG & RESOURCES */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500 to-blue-500 flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-3xl font-bold text-white">Blog & Learning Resources</h3>
            </div>

            <div className="bg-gradient-to-r from-sky-900/30 to-blue-900/30 border border-sky-500/30 rounded-2xl p-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-xl font-bold text-white mb-4">Stay Updated with Our Blog</h4>
                  <p className="text-gray-300 mb-4">
                    Access tutorials, industry insights, Google Ads best practices, and platform updates. 
                    Learn how to get the most out of Adiology and stay ahead of the competition.
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2 text-gray-300">
                      <Check className="w-4 h-4 text-sky-400" /> Google Ads tutorials & guides
                    </li>
                    <li className="flex items-center gap-2 text-gray-300">
                      <Check className="w-4 h-4 text-sky-400" /> Industry-specific strategies
                    </li>
                    <li className="flex items-center gap-2 text-gray-300">
                      <Check className="w-4 h-4 text-sky-400" /> Platform tips & tricks
                    </li>
                    <li className="flex items-center gap-2 text-gray-300">
                      <Check className="w-4 h-4 text-sky-400" /> Case studies & success stories
                    </li>
                  </ul>
                </div>
                <div className="flex items-center justify-center">
                  <div className="bg-slate-800/80 rounded-xl p-6 text-center">
                    <div className="text-5xl font-bold text-sky-400 mb-2">50+</div>
                    <div className="text-gray-400">Articles & Tutorials</div>
                    <p className="text-sm text-gray-500 mt-2">New content added weekly</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Summary CTA */}
          <div className="text-center py-8 border-t border-white/10">
            <p className="text-xl text-gray-300 mb-4">
              All these features included in the <span className="text-green-400 font-bold">Lifetime Plan</span> for just <span className="text-white font-bold">$69.99</span>
            </p>
            <Button
              onClick={handleStartTrial}
              disabled={isLoading}
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-10 py-5 text-lg font-bold rounded-xl shadow-xl transition-all hover:scale-105"
            >
              Start $5 Trial Now
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* LIFETIME OFFER - BOTTOM OF PAGE - LAST CHANCE */}
      <section className="py-16 px-6 bg-gradient-to-b from-slate-900 via-green-950/30 to-slate-900">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            {/* Glowing container */}
            <div className="relative">
              <div className="absolute -inset-3 bg-gradient-to-r from-green-500 via-emerald-400 to-green-500 rounded-3xl blur-xl opacity-60 animate-pulse" />
              <div className="absolute -inset-1 bg-gradient-to-r from-green-400 to-emerald-400 rounded-2xl opacity-80" />
              
              <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl overflow-hidden border-2 border-green-400/50">
                {/* Top Banner */}
                <div className="bg-gradient-to-r from-green-600 via-emerald-500 to-green-600 py-4 px-6">
                  <div className="flex items-center justify-center gap-3 text-white">
                    <Zap className="w-7 h-7 animate-pulse" />
                    <span className="text-2xl md:text-3xl font-bold tracking-wide">LIFETIME PLAN - SPECIAL OFFER</span>
                    <Zap className="w-7 h-7 animate-pulse" />
                  </div>
                </div>

                <div className="p-8 md:p-12">
                  <div className="text-center mb-8">
                    <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
                      Skip the Trial & Get <span className="text-green-400">20% OFF</span> Today!
                    </h3>
                    <p className="text-xl text-gray-300">
                      Ready to commit? Buy the Lifetime Plan now and save instantly.
                    </p>
                  </div>

                  {/* Price Display */}
                  <div className="flex flex-col items-center justify-center mb-8">
                    <div className="flex items-baseline gap-4 mb-2">
                      <span className="text-7xl md:text-8xl font-bold text-white">$69.99</span>
                      <div className="flex flex-col">
                        <span className="text-gray-400 line-through text-3xl">$99.99</span>
                        <Badge className="bg-green-500 text-white border-0 text-lg px-4 py-1 mt-1">Save 30%</Badge>
                      </div>
                    </div>
                    <p className="text-green-300 text-xl font-medium mt-2">
                      One-time payment. Own it forever. All future updates included.
                    </p>
                  </div>

                  {/* CTA Button */}
                  <div className="flex flex-col items-center gap-4 mb-8">
                    <Button
                      onClick={async () => {
                        setIsLoading(true);
                        try {
                          const response = await fetch('/api/promo/lifetime-direct', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({})
                          });
                          if (response.ok) {
                            const data = await response.json();
                            if (data.checkoutUrl) {
                              window.location.href = data.checkoutUrl;
                            }
                          } else {
                            const error = await response.json();
                            alert(error.message || 'Failed to process. Please try again.');
                          }
                        } catch (error) {
                          alert('Something went wrong. Please try again.');
                        } finally {
                          setIsLoading(false);
                        }
                      }}
                      disabled={isLoading}
                      size="lg"
                      className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white px-16 py-8 text-2xl font-bold rounded-2xl shadow-2xl shadow-green-500/50 transition-all hover:scale-105"
                    >
                      {isLoading ? 'Processing...' : 'Buy Lifetime Plan - $69.99'}
                      <Rocket className="w-7 h-7 ml-3" />
                    </Button>
                    <div className="flex items-center gap-6 text-gray-400 text-sm">
                      <span className="flex items-center gap-1"><Shield className="w-4 h-4 text-green-400" /> Secure Payment</span>
                      <span className="flex items-center gap-1"><CreditCard className="w-4 h-4 text-blue-400" /> Powered by Stripe</span>
                    </div>
                  </div>

                  {/* Warning Box */}
                  <div className="bg-red-950/60 border-2 border-red-500/50 rounded-xl p-5 text-center">
                    <div className="flex items-center justify-center gap-2 text-red-400 mb-2">
                      <AlertCircle className="w-6 h-6" />
                      <span className="text-lg font-bold">LAST CHANCE - This Offer Won't Be Shown Again!</span>
                    </div>
                    <p className="text-red-300">
                      If you leave this page without purchasing, you'll only see the regular <strong>$99.99</strong> price. 
                      This 20% discount is exclusive to this page. Decide now!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/10 bg-slate-950">
        <div className="max-w-6xl mx-auto">
          {/* Footer Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            {/* Company */}
            <div>
              <h4 className="text-white font-bold mb-4">Company</h4>
              <ul className="space-y-2">
                <li>
                  <a href="https://adiology.io" className="text-gray-400 hover:text-purple-400 transition-colors text-sm">
                    About Us
                  </a>
                </li>
                <li>
                  <a href="mailto:support@adiology.io" className="text-gray-400 hover:text-purple-400 transition-colors text-sm">
                    Contact
                  </a>
                </li>
                <li>
                  <a href="mailto:careers@adiology.io" className="text-gray-400 hover:text-purple-400 transition-colors text-sm">
                    Careers
                  </a>
                </li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="text-white font-bold mb-4">Resources</h4>
              <ul className="space-y-2">
                <li>
                  <button 
                    onClick={() => onNavigate?.('blog')}
                    className="text-gray-400 hover:text-purple-400 transition-colors text-sm text-left"
                  >
                    Blog
                  </button>
                </li>
                <li>
                  <a href="https://adiology.io/docs" className="text-gray-400 hover:text-purple-400 transition-colors text-sm">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="https://adiology.io/help" className="text-gray-400 hover:text-purple-400 transition-colors text-sm">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="https://adiology.io/tutorials" className="text-gray-400 hover:text-purple-400 transition-colors text-sm">
                    Tutorials
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-white font-bold mb-4">Legal</h4>
              <ul className="space-y-2">
                <li>
                  <button 
                    onClick={() => onNavigate?.('privacy-policy')}
                    className="text-gray-400 hover:text-purple-400 transition-colors text-sm text-left"
                  >
                    Privacy Policy
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => onNavigate?.('terms-of-service')}
                    className="text-gray-400 hover:text-purple-400 transition-colors text-sm text-left"
                  >
                    Terms of Service
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => onNavigate?.('cookie-policy')}
                    className="text-gray-400 hover:text-purple-400 transition-colors text-sm text-left"
                  >
                    Cookie Policy
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => onNavigate?.('gdpr-compliance')}
                    className="text-gray-400 hover:text-purple-400 transition-colors text-sm text-left"
                  >
                    GDPR Compliance
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => onNavigate?.('refund-policy')}
                    className="text-gray-400 hover:text-purple-400 transition-colors text-sm text-left"
                  >
                    Refund Policy
                  </button>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-white font-bold mb-4">Get in Touch</h4>
              <ul className="space-y-2">
                <li>
                  <a href="mailto:support@adiology.io" className="text-gray-400 hover:text-purple-400 transition-colors text-sm">
                    support@adiology.io
                  </a>
                </li>
                <li>
                  <a href="mailto:sales@adiology.io" className="text-gray-400 hover:text-purple-400 transition-colors text-sm">
                    sales@adiology.io
                  </a>
                </li>
              </ul>
              <div className="mt-4">
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                  Online Support
                </Badge>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-white/10 pt-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              {/* Copyright */}
              <p className="text-gray-500 text-sm">
                &copy; {new Date().getFullYear()} Adiology. All rights reserved.
              </p>

              {/* Quick Legal Links */}
              <div className="flex items-center gap-4 text-sm">
                <button 
                  onClick={() => onNavigate?.('privacy-policy')}
                  className="text-gray-500 hover:text-purple-400 transition-colors"
                >
                  Privacy
                </button>
                <span className="text-gray-700">|</span>
                <button 
                  onClick={() => onNavigate?.('terms-of-service')}
                  className="text-gray-500 hover:text-purple-400 transition-colors"
                >
                  Terms
                </button>
                <span className="text-gray-700">|</span>
                <button 
                  onClick={() => onNavigate?.('cookie-policy')}
                  className="text-gray-500 hover:text-purple-400 transition-colors"
                >
                  Cookies
                </button>
              </div>

              {/* Payment Badges */}
              <div className="flex items-center gap-3 text-gray-500">
                <Shield className="w-4 h-4" />
                <span className="text-xs">Secure Payments</span>
                <CreditCard className="w-4 h-4" />
                <span className="text-xs">Stripe</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
