import React from 'react';
import { ArrowLeft, Users, MessageSquare, TrendingUp, Award, BookOpen, Lightbulb, ExternalLink, Star, Heart, Zap } from 'lucide-react';

interface CommunityPageProps {
  onBack: () => void;
}

export const CommunityPage: React.FC<CommunityPageProps> = ({ onBack }) => {
  const communityFeatures = [
    {
      icon: <MessageSquare className="w-6 h-6" />,
      title: 'Discussion Forums',
      description: 'Ask questions, share insights, and connect with fellow advertisers in our active discussion forums.',
      stats: '2,500+ topics'
    },
    {
      icon: <Lightbulb className="w-6 h-6" />,
      title: 'Best Practices',
      description: 'Learn proven strategies and tips from experienced marketers and Google Ads experts.',
      stats: '500+ guides'
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: 'Campaign Showcases',
      description: 'See real campaign examples and results shared by community members.',
      stats: '1,200+ showcases'
    },
    {
      icon: <Award className="w-6 h-6" />,
      title: 'Expert Q&A',
      description: 'Get answers from certified Google Ads professionals and Adiology team members.',
      stats: '100+ experts'
    },
  ];

  const popularTopics = [
    { title: 'Getting Started with Google Ads', replies: 234, views: 5600 },
    { title: 'Best Keywords for E-commerce', replies: 189, views: 4200 },
    { title: 'Optimizing Campaign Budget', replies: 156, views: 3800 },
    { title: 'AI Campaign Builder Tips & Tricks', replies: 142, views: 3500 },
    { title: 'Negative Keywords Strategy Guide', replies: 128, views: 3100 },
    { title: 'How to Reduce Cost Per Click', replies: 115, views: 2900 },
  ];

  const communityStats = [
    { label: 'Active Members', value: '12,000+', icon: <Users className="w-5 h-5" /> },
    { label: 'Discussions', value: '25,000+', icon: <MessageSquare className="w-5 h-5" /> },
    { label: 'Solutions Shared', value: '8,500+', icon: <Lightbulb className="w-5 h-5" /> },
    { label: 'Expert Contributors', value: '350+', icon: <Star className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 text-white">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </button>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Community</h1>
          <p className="text-xl text-white/80 max-w-2xl mb-8">
            Join thousands of advertisers sharing knowledge, strategies, and success stories.
          </p>
          <a
            href="https://community.adiology.io/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-indigo-600 rounded-xl font-semibold hover:bg-gray-100 transition-colors"
          >
            <ExternalLink className="w-5 h-5" />
            Visit Community Forum
          </a>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {communityStats.map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl p-5 border border-gray-200 text-center">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center mx-auto mb-3 text-indigo-600">
                {stat.icon}
              </div>
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-gray-500 text-sm">{stat.label}</div>
            </div>
          ))}
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-8">What You'll Find</h2>
        <div className="grid md:grid-cols-2 gap-6 mb-16">
          {communityFeatures.map((feature) => (
            <a
              key={feature.title}
              href="https://community.adiology.io/"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-indigo-300 hover:shadow-lg transition-all block"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white flex-shrink-0">
                  {feature.icon}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600 text-sm mb-2">{feature.description}</p>
                  <span className="text-indigo-600 text-sm font-medium">{feature.stats}</span>
                </div>
              </div>
            </a>
          ))}
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-8">Popular Discussions</h2>
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-16">
          {popularTopics.map((topic, index) => (
            <a
              key={index}
              href="https://community.adiology.io/"
              target="_blank"
              rel="noopener noreferrer"
              className={`p-5 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer ${
                index !== popularTopics.length - 1 ? 'border-b border-gray-100' : ''
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{topic.title}</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                    <span>{topic.replies} replies</span>
                    <span>{topic.views.toLocaleString()} views</span>
                  </div>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-gray-400" />
            </a>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-8 border border-indigo-100">
            <Heart className="w-10 h-10 text-indigo-600 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-3">Community Guidelines</h3>
            <p className="text-gray-600 mb-4">
              Our community thrives on respect, helpfulness, and shared learning. We ask all members to:
            </p>
            <ul className="space-y-2 text-gray-700 text-sm">
              <li className="flex items-start gap-2">
                <Zap className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
                <span>Be respectful and constructive in discussions</span>
              </li>
              <li className="flex items-start gap-2">
                <Zap className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
                <span>Share knowledge and help fellow members</span>
              </li>
              <li className="flex items-start gap-2">
                <Zap className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
                <span>Keep content relevant to advertising and marketing</span>
              </li>
              <li className="flex items-start gap-2">
                <Zap className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
                <span>Report spam or inappropriate content</span>
              </li>
            </ul>
          </div>

          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white">
            <BookOpen className="w-10 h-10 mb-4 opacity-80" />
            <h3 className="text-xl font-bold mb-3">Become a Contributor</h3>
            <p className="text-white/80 mb-4">
              Share your expertise with the community and earn recognition as an Adiology Expert.
            </p>
            <ul className="space-y-2 text-white/80 text-sm mb-6">
              <li className="flex items-start gap-2">
                <Star className="w-4 h-4 text-yellow-300 mt-0.5 flex-shrink-0" />
                <span>Get featured on our Expert Contributors page</span>
              </li>
              <li className="flex items-start gap-2">
                <Star className="w-4 h-4 text-yellow-300 mt-0.5 flex-shrink-0" />
                <span>Earn badges and recognition for your contributions</span>
              </li>
              <li className="flex items-start gap-2">
                <Star className="w-4 h-4 text-yellow-300 mt-0.5 flex-shrink-0" />
                <span>Access exclusive expert-only resources</span>
              </li>
            </ul>
            <a
              href="https://community.adiology.io/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-indigo-600 rounded-xl font-medium hover:bg-gray-100 transition-colors text-sm"
            >
              <ExternalLink className="w-4 h-4" />
              Join the Community
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
