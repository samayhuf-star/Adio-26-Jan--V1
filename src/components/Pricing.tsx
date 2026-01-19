import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, X, Sparkles, Star, Crown, Clock, Users, Zap, Shield, Calendar, ChevronDown, ChevronUp } from 'lucide-react';

interface PricingPlan {
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  icon: any;
  color: string;
  gradientFrom: string;
  gradientTo: string;
  popular: boolean;
  earlyBirdDiscount: number;
  tagline: string;
  limits: {
    campaigns: string;
    teamMembers: string;
  };
  features: {
    name: string;
    basic: boolean | string;
    pro: boolean | string;
    lifetime: boolean | string;
  }[];
}

const featureList = [
  { name: 'Campaigns/month', basic: '25', pro: '∞', lifetime: '∞' },
  { name: 'Team members', basic: '2', pro: '5', lifetime: '∞' },
  { name: 'Dashboard', basic: true, pro: true, lifetime: true },
  { name: '1-Click Builder', basic: true, pro: true, lifetime: true },
  { name: 'Builder 3.0', basic: true, pro: true, lifetime: true },
  { name: 'Preset Campaigns', basic: true, pro: true, lifetime: true },
  { name: 'Draft/Custom Campaigns', basic: 'Full', pro: 'Full', lifetime: 'Full' },
  { name: 'Keyword Planner', basic: true, pro: true, lifetime: true },
  { name: 'Keyword Mixer', basic: true, pro: true, lifetime: true },
  { name: 'Negative Keywords', basic: true, pro: true, lifetime: true },
  { name: 'Long-Tail Keywords', basic: true, pro: true, lifetime: true },
  { name: 'Email Support', basic: true, pro: true, lifetime: true },
  { name: 'Support Response Time', basic: '24-48h', pro: '12h', lifetime: '1h Priority' },
  { name: 'Priority Queue', basic: false, pro: true, lifetime: true },
];

const comingSoonFeatures = [
  { name: 'CSV Export', basic: true, pro: true, lifetime: true },
  { name: 'Live Ad Preview', basic: true, pro: true, lifetime: true },
  { name: 'Analytics', basic: 'Q2', pro: true, lifetime: true },
  { name: 'Landing Page Builder', basic: 'Q2', pro: 'Q2', lifetime: 'Q2' },
  { name: 'Call Tracking', basic: 'Q2', pro: 'Q2', lifetime: 'Q2' },
  { name: 'API Access', basic: false, pro: 'Q2', lifetime: 'Q2' },
];

const plans: PricingPlan[] = [
  {
    name: 'Basic',
    monthlyPrice: 69.99,
    yearlyPrice: 671.90,
    icon: Zap,
    color: 'blue',
    gradientFrom: 'from-blue-500',
    gradientTo: 'to-cyan-500',
    popular: false,
    earlyBirdDiscount: 0,
    tagline: 'Perfect for solo marketers',
    limits: { campaigns: '25', teamMembers: '2' },
    features: []
  },
  {
    name: 'Pro',
    monthlyPrice: 129.99,
    yearlyPrice: 1247.90,
    icon: Star,
    color: 'purple',
    gradientFrom: 'from-purple-500',
    gradientTo: 'to-pink-500',
    popular: true,
    earlyBirdDiscount: 0,
    tagline: 'Most popular for growing teams',
    limits: { campaigns: '∞', teamMembers: '5' },
    features: []
  },
  {
    name: 'Lifetime',
    monthlyPrice: 49.99,
    yearlyPrice: 49.99,
    icon: Crown,
    color: 'amber',
    gradientFrom: 'from-amber-500',
    gradientTo: 'to-orange-500',
    popular: false,
    earlyBirdDiscount: 0,
    tagline: 'One-time payment, forever access',
    limits: { campaigns: '∞', teamMembers: '∞' },
    features: []
  }
];

interface PricingProps {
  onSelectPlan?: (planName: string, priceId: string, amount: number, isSubscription: boolean) => void;
}

export function Pricing({ onSelectPlan }: PricingProps) {
  const [isYearly, setIsYearly] = useState(false);
  const [showRoadmap, setShowRoadmap] = useState(false);

  const getPrice = (plan: PricingPlan) => {
    return isYearly ? plan.yearlyPrice : plan.monthlyPrice;
  };

  const getOriginalPrice = (plan: PricingPlan) => {
    const price = getPrice(plan);
    return Math.round(price / (1 - plan.earlyBirdDiscount / 100));
  };

  const getPriceId = (planName: string) => {
    const priceIds: Record<string, { monthly: string; yearly: string; oneTime?: string }> = {
      'Basic': { monthly: 'price_1Sf7Z2AYv17Z995VOMSBG7GX', yearly: 'price_1Sf7Z2AYv17Z995VKDFZ119S' },
      'Pro': { monthly: 'price_1Sf7Z3AYv17Z995Vp8o2xgAN', yearly: 'price_1Sf7Z4AYv17Z995VKY5BkfdB' },
      'Lifetime': { monthly: 'price_1Sf7Z5AYv17Z995V7ROFNbzI', yearly: 'price_1Sf7Z5AYv17Z995V7ROFNbzI', oneTime: 'price_1Sf7Z5AYv17Z995V7ROFNbzI' },
    };
    if (planName === 'Lifetime') {
      return priceIds[planName]?.oneTime;
    }
    return isYearly ? priceIds[planName]?.yearly : priceIds[planName]?.monthly;
  };

  const handleSelectPlan = (plan: PricingPlan) => {
    if (onSelectPlan) {
      const priceId = getPriceId(plan.name);
      const amount = getPrice(plan) * 100;
      onSelectPlan(plan.name, priceId || '', amount, true);
    }
  };

  const renderFeatureValue = (value: boolean | string) => {
    if (value === true) {
      return <Check className="w-5 h-5 text-green-500" />;
    }
    if (value === false) {
      return <X className="w-5 h-5 text-red-400" />;
    }
    if (value === 'Q1/Q2') {
      return <span className="text-xs font-medium text-gray-400">TBA*</span>;
    }
    return <span className="text-sm font-medium text-gray-700">{value}</span>;
  };

  return (
    <section id="pricing" className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 via-white to-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 rounded-full text-purple-700 text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            Early Adopter Pricing - Limited to First 100 Users
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Simple, Transparent <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">Pricing</span>
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto mb-8">
            Start with a 7-day free trial. All plans include a 14-day money-back guarantee.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <span className={`text-sm font-medium ${!isYearly ? 'text-gray-900' : 'text-gray-500'}`}>Monthly</span>
            <button
              onClick={() => setIsYearly(!isYearly)}
              className={`relative w-14 h-7 rounded-full transition-colors ${isYearly ? 'bg-purple-600' : 'bg-gray-300'}`}
            >
              <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${isYearly ? 'translate-x-8' : 'translate-x-1'}`} />
            </button>
            <span className={`text-sm font-medium ${isYearly ? 'text-gray-900' : 'text-gray-500'}`}>
              Yearly <span className="text-green-600 font-semibold">(-20%)</span>
            </span>
          </div>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 mb-12">
          {plans.map((plan, index) => {
            const Icon = plan.icon;
            return (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`relative bg-white rounded-2xl border-2 ${plan.popular ? 'border-purple-500 shadow-2xl scale-[1.02]' : 'border-gray-200 shadow-lg'} overflow-hidden`}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-center py-2 text-sm font-semibold">
                    Most Popular
                  </div>
                )}

                <div className={`p-6 ${plan.popular ? 'pt-12' : ''}`}>
                  {/* Plan Icon & Name */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${plan.gradientFrom} ${plan.gradientTo} flex items-center justify-center`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                      <p className="text-sm text-gray-500">{plan.tagline}</p>
                    </div>
                  </div>

                  {/* Early Bird Discount */}
                  <div className="mb-4">
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                      <Sparkles className="w-3 h-3" />
                      {plan.earlyBirdDiscount}% off - Early Adopter
                    </span>
                  </div>

                  {/* Price */}
                  <div className="mb-6">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold text-gray-900">${getPrice(plan)}</span>
                      <span className="text-gray-500">/{isYearly ? 'year' : 'month'}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-gray-400 line-through text-sm">${getOriginalPrice(plan)}/{isYearly ? 'year' : 'month'}</span>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 gap-3 mb-6 p-4 bg-gray-50 rounded-xl">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">{plan.limits.campaigns}</div>
                      <div className="text-xs text-gray-500">Campaigns/mo</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">{plan.limits.teamMembers}</div>
                      <div className="text-xs text-gray-500">Team Members</div>
                    </div>
                  </div>

                  {/* CTA Button */}
                  <button
                    onClick={() => handleSelectPlan(plan)}
                    className={`w-full py-3 px-6 rounded-xl font-semibold transition-all ${
                      plan.popular
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-lg hover:scale-[1.02]'
                        : 'bg-gray-900 text-white hover:bg-gray-800'
                    }`}
                  >
                    Start 7-Day Free Trial
                  </button>

                  <p className="text-center text-xs text-gray-500 mt-3">
                    No credit card required • Cancel anytime
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Feature Comparison Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden mb-12"
        >
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-xl font-bold text-gray-900">Feature Comparison</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left py-4 px-6 font-medium text-gray-600">Feature</th>
                  <th className="text-center py-4 px-6 font-medium text-gray-600">Basic</th>
                  <th className="text-center py-4 px-6 font-medium text-purple-600 bg-purple-50">Pro</th>
                  <th className="text-center py-4 px-6 font-medium text-gray-600">Lifetime</th>
                </tr>
              </thead>
              <tbody>
                {featureList.map((feature, index) => (
                  <tr key={feature.name} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="py-3 px-6 text-gray-700">{feature.name}</td>
                    <td className="py-3 px-6 text-center">{renderFeatureValue(feature.basic)}</td>
                    <td className="py-3 px-6 text-center bg-purple-50/50">{renderFeatureValue(feature.pro)}</td>
                    <td className="py-3 px-6 text-center">{renderFeatureValue(feature.lifetime)}</td>
                  </tr>
                ))}
                <tr className="bg-gray-100">
                  <td colSpan={4} className="py-3 px-6 font-medium text-gray-600">Coming Soon</td>
                </tr>
                {comingSoonFeatures.map((feature, index) => (
                  <tr key={feature.name} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="py-3 px-6 text-gray-700">{feature.name}</td>
                    <td className="py-3 px-6 text-center">{renderFeatureValue(feature.basic)}</td>
                    <td className="py-3 px-6 text-center bg-purple-50/50">{renderFeatureValue(feature.pro)}</td>
                    <td className="py-3 px-6 text-center">{renderFeatureValue(feature.lifetime)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <p className="text-sm text-gray-500 text-center">
              * TBA = "Coming in Q1/Q2" - Features marked with TBA will be rolled out progressively
            </p>
          </div>
        </motion.div>

        {/* Roadmap Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <button
            onClick={() => setShowRoadmap(!showRoadmap)}
            className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200 hover:border-purple-300 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-purple-600" />
              <span className="font-medium text-gray-900">View Feature Roadmap (Q1-Q3 2026)</span>
            </div>
            {showRoadmap ? <ChevronUp className="w-5 h-5 text-gray-600" /> : <ChevronDown className="w-5 h-5 text-gray-600" />}
          </button>

          {showRoadmap && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-4 bg-white rounded-xl border border-gray-200 p-6"
            >
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    Q1 2026 (Jan-Mar)
                  </h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> CSV Export Enhancement</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Live Ad Preview</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Basic Analytics Dashboard</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Team Collaboration v2</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    Q2 2026 (Apr-Jun)
                  </h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center gap-2"><Clock className="w-4 h-4 text-blue-500" /> Landing Page Builder</li>
                    <li className="flex items-center gap-2"><Clock className="w-4 h-4 text-blue-500" /> Advanced Analytics</li>
                    <li className="flex items-center gap-2"><Clock className="w-4 h-4 text-blue-500" /> A/B Testing Module</li>
                    <li className="flex items-center gap-2"><Clock className="w-4 h-4 text-blue-500" /> Competitor Analysis</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-purple-500" />
                    Q3 2026 (Jul-Sep)
                  </h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center gap-2"><Clock className="w-4 h-4 text-purple-500" /> Call Tracking Integration</li>
                    <li className="flex items-center gap-2"><Clock className="w-4 h-4 text-purple-500" /> API Access (Agency)</li>
                    <li className="flex items-center gap-2"><Clock className="w-4 h-4 text-purple-500" /> White-label Options</li>
                    <li className="flex items-center gap-2"><Clock className="w-4 h-4 text-purple-500" /> Custom Integrations</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Trust Badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          <div className="flex items-center justify-center gap-2 p-4 bg-white rounded-xl border border-gray-200">
            <Clock className="w-5 h-5 text-blue-500" />
            <span className="text-sm text-gray-700">7-Day Free Trial</span>
          </div>
          <div className="flex items-center justify-center gap-2 p-4 bg-white rounded-xl border border-gray-200">
            <Shield className="w-5 h-5 text-green-500" />
            <span className="text-sm text-gray-700">14-Day Money Back</span>
          </div>
          <div className="flex items-center justify-center gap-2 p-4 bg-white rounded-xl border border-gray-200">
            <Users className="w-5 h-5 text-purple-500" />
            <span className="text-sm text-gray-700">First 100 Discount</span>
          </div>
          <div className="flex items-center justify-center gap-2 p-4 bg-white rounded-xl border border-gray-200">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <span className="text-sm text-gray-700">25-65% Early Bird</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
