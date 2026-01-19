import React from 'react';
import { 
  Sparkles, 
  Target, 
  BarChart3, 
  Zap, 
  Users, 
  Globe,
  CheckCircle
} from 'lucide-react';

export const WelcomeStep: React.FC = () => {
  const features = [
    {
      icon: <Target className="w-6 h-6 text-indigo-600" />,
      title: 'Campaign Builder',
      description: 'Create powerful marketing campaigns with our intuitive drag-and-drop builder',
      benefit: 'Save 80% of your time'
    },
    {
      icon: <BarChart3 className="w-6 h-6 text-green-600" />,
      title: 'Analytics & Insights',
      description: 'Track performance and optimize your marketing efforts with real-time data',
      benefit: 'Increase ROI by 40%'
    },
    {
      icon: <Zap className="w-6 h-6 text-yellow-600" />,
      title: 'Automation Tools',
      description: 'Automate repetitive tasks and scale your marketing without extra effort',
      benefit: 'Scale 10x faster'
    },
    {
      icon: <Users className="w-6 h-6 text-purple-600" />,
      title: 'Team Collaboration',
      description: 'Work together with your team on marketing projects seamlessly',
      benefit: 'Better teamwork'
    },
    {
      icon: <Globe className="w-6 h-6 text-blue-600" />,
      title: 'Multi-Channel Reach',
      description: 'Reach your audience across Google, Facebook, Instagram, and more',
      benefit: 'Wider audience'
    },
    {
      icon: <CheckCircle className="w-6 h-6 text-emerald-600" />,
      title: 'Easy Integration',
      description: 'Connect with your existing tools and workflows in just a few clicks',
      benefit: 'No disruption'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center">
        <div className="w-20 h-20 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
          <Sparkles className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
          Welcome to the Future of Marketing
        </h2>
        <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
          Adiology is your all-in-one marketing automation platform. We'll help you create, 
          manage, and optimize campaigns that drive real results for your business.
        </p>
        
        {/* Quick Stats */}
        <div className="flex flex-wrap justify-center gap-6 mt-6 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>10,000+ active users</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>$50M+ in ad spend managed</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            <span>4.9/5 customer rating</span>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {features.map((feature, index) => (
          <div
            key={index}
            className="group p-4 sm:p-6 bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-100 hover:shadow-lg hover:border-indigo-200 transition-all duration-300 cursor-pointer"
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                {feature.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 text-sm sm:text-base">
                    {feature.title}
                  </h3>
                  <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full whitespace-nowrap">
                    {feature.benefit}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Getting Started */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 text-center border border-indigo-100">
        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
          Ready to Get Started?
        </h3>
        <p className="text-sm sm:text-base text-gray-600 mb-4">
          This quick setup will take less than 3 minutes and help us personalize your experience.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs sm:text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span>No credit card required</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span>Free 14-day trial</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span>Cancel anytime</span>
          </div>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="text-center">
        <p className="text-sm text-gray-500">
          ⏱️ Setup progress: <span className="font-medium text-indigo-600">Step 1 of 5</span>
        </p>
      </div>
    </div>
  );
};