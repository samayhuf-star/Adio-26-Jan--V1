import React, { useState } from 'react';
import { ArrowLeft, Search, BookOpen, Zap, Target, Settings, Shield, CreditCard, MessageSquare, ChevronRight, ChevronDown, Mail, ExternalLink, HelpCircle, Rocket, BarChart3, Users } from 'lucide-react';

interface HelpCenterPageProps {
  onBack: () => void;
}

interface FAQItem {
  question: string;
  answer: string;
}

interface HelpCategory {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  articles: { title: string; description: string }[];
}

export const HelpCenterPage: React.FC<HelpCenterPageProps> = ({ onBack }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories: HelpCategory[] = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      description: 'Set up your account and launch your first campaign',
      icon: <Rocket className="w-6 h-6" />,
      articles: [
        { title: 'Creating Your Account', description: 'Step-by-step guide to setting up your Adiology account' },
        { title: 'Your First Campaign', description: 'Learn how to create and launch your first Google Ads campaign' },
        { title: 'Dashboard Overview', description: 'Understanding the main dashboard and its features' },
        { title: 'Account Settings', description: 'Configure your profile, notifications, and preferences' },
      ]
    },
    {
      id: 'campaigns',
      title: 'Campaign Builder',
      description: 'Create, manage, and optimize your campaigns',
      icon: <Target className="w-6 h-6" />,
      articles: [
        { title: 'Campaign Structure', description: 'Understanding campaigns, ad groups, and keywords' },
        { title: 'One-Click Campaigns', description: 'Generate complete campaigns with AI in one click' },
        { title: 'Campaign Templates', description: 'Use pre-built templates for different industries' },
        { title: 'Exporting Campaigns', description: 'Export your campaigns to Google Ads Editor format' },
      ]
    },
    {
      id: 'keywords',
      title: 'Keyword Tools',
      description: 'Find, mix, and manage your keywords',
      icon: <Zap className="w-6 h-6" />,
      articles: [
        { title: 'Keyword Planner', description: 'Research and discover high-performing keywords' },
        { title: 'Keyword Mixer', description: 'Combine keyword lists to create comprehensive targeting' },
        { title: 'Negative Keywords', description: 'Build negative keyword lists to improve campaign performance' },
        { title: 'Long-Tail Keywords', description: 'Generate long-tail keyword variations for better targeting' },
      ]
    },
    {
      id: 'analytics',
      title: 'Analytics & Reporting',
      description: 'Track performance and gain insights',
      icon: <BarChart3 className="w-6 h-6" />,
      articles: [
        { title: 'Dashboard Metrics', description: 'Understanding your key performance indicators' },
        { title: 'Campaign Performance', description: 'Analyzing campaign results and optimizations' },
        { title: 'Keyword Analytics', description: 'Track keyword performance and trends' },
        { title: 'Export Reports', description: 'Generate and export performance reports' },
      ]
    },
    {
      id: 'billing',
      title: 'Billing & Plans',
      description: 'Manage your subscription and payments',
      icon: <CreditCard className="w-6 h-6" />,
      articles: [
        { title: 'Subscription Plans', description: 'Compare features across different pricing tiers' },
        { title: 'Payment Methods', description: 'Add, update, or remove payment methods' },
        { title: 'Invoices & Receipts', description: 'Access your billing history and download invoices' },
        { title: 'Cancellation & Refunds', description: 'Understanding our cancellation and refund policies' },
      ]
    },
    {
      id: 'security',
      title: 'Security & Privacy',
      description: 'Keep your account and data safe',
      icon: <Shield className="w-6 h-6" />,
      articles: [
        { title: 'Account Security', description: 'Best practices for keeping your account secure' },
        { title: 'Two-Factor Authentication', description: 'Enable 2FA for additional account protection' },
        { title: 'Data Privacy', description: 'How we handle and protect your data' },
        { title: 'GDPR Compliance', description: 'Your rights under GDPR and data protection regulations' },
      ]
    },
  ];

  const faqs: FAQItem[] = [
    {
      question: 'How do I get started with Adiology?',
      answer: 'Simply create an account, choose a plan, and start building your first campaign. Our one-click campaign builder makes it easy to get started in minutes. You can also use pre-built templates for your industry.'
    },
    {
      question: 'Can I export campaigns to Google Ads?',
      answer: 'Yes! Adiology allows you to export your campaigns in Google Ads Editor format. You can download the file and import it directly into Google Ads Editor or your Google Ads account.'
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit and debit cards (Visa, Mastercard, American Express) through our secure payment processor, Stripe. All transactions are encrypted and secure.'
    },
    {
      question: 'How does the AI keyword generator work?',
      answer: 'Our AI-powered keyword generator uses advanced natural language processing to analyze your business, industry, and target audience. It then generates relevant keyword suggestions with search volume and competition data.'
    },
    {
      question: 'Can I cancel my subscription at any time?',
      answer: 'Yes, you can cancel your subscription at any time. Your access will continue until the end of your current billing period. We also offer a refund policy for recent purchases - check our Refund Policy page for details.'
    },
    {
      question: 'Do you offer a free trial?',
      answer: 'We offer a free plan with limited features so you can try out the platform. Upgrade to a paid plan anytime to unlock all features including AI campaign generation, unlimited keywords, and more.'
    },
    {
      question: 'How do I contact support?',
      answer: 'You can reach our support team via email at support@adiology.online, by phone at +1 304-305-1702, or through the in-app support chat. We typically respond within 24 hours on business days.'
    },
    {
      question: 'Is my data secure?',
      answer: 'Absolutely. We use industry-standard encryption, secure servers, and follow best practices for data protection. We are GDPR compliant and never share your data with third parties without your consent.'
    },
  ];

  const filteredCategories = searchQuery
    ? categories.filter(cat =>
        cat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cat.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cat.articles.some(a =>
          a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.description.toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
    : categories;

  const filteredFaqs = searchQuery
    ? faqs.filter(faq =>
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : faqs;

  const activeCategory = selectedCategory ? categories.find(c => c.id === selectedCategory) : null;

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
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Help Center</h1>
          <p className="text-xl text-white/80 max-w-2xl mb-8">
            Find answers, learn best practices, and get the most out of Adiology.
          </p>
          <div className="max-w-2xl relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for help articles, guides, and FAQs..."
              className="w-full pl-12 pr-4 py-4 rounded-xl text-gray-900 bg-white border-0 focus:ring-2 focus:ring-indigo-300 focus:outline-none text-lg"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {activeCategory ? (
          <div>
            <button
              onClick={() => setSelectedCategory(null)}
              className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 mb-6 font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to all categories
            </button>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white">
                {activeCategory.icon}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{activeCategory.title}</h2>
                <p className="text-gray-600">{activeCategory.description}</p>
              </div>
            </div>
            <div className="space-y-4">
              {activeCategory.articles.map((article, index) => (
                <div
                  key={index}
                  className="bg-white rounded-xl p-6 border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{article.title}</h3>
                      <p className="text-gray-600">{article.description}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Browse by Category</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
              {filteredCategories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-indigo-300 hover:shadow-lg transition-all text-left group"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform">
                    {category.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{category.title}</h3>
                  <p className="text-gray-600 text-sm mb-3">{category.description}</p>
                  <span className="text-indigo-600 text-sm font-medium flex items-center gap-1">
                    {category.articles.length} articles
                    <ChevronRight className="w-4 h-4" />
                  </span>
                </button>
              ))}
            </div>

            <div className="mb-16">
              <h2 className="text-2xl font-bold text-gray-900 mb-8">Frequently Asked Questions</h2>
              <div className="space-y-3 max-w-4xl">
                {filteredFaqs.map((faq, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-xl border border-gray-200 overflow-hidden"
                  >
                    <button
                      onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                      className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                    >
                      <span className="font-medium text-gray-900 pr-4">{faq.question}</span>
                      {expandedFaq === index ? (
                        <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-500 flex-shrink-0" />
                      )}
                    </button>
                    {expandedFaq === index && (
                      <div className="px-6 pb-4 text-gray-600 border-t border-gray-100 pt-3">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 md:p-12 text-white text-center">
              <HelpCircle className="w-12 h-12 mx-auto mb-4 opacity-80" />
              <h2 className="text-2xl font-bold mb-3">Still Need Help?</h2>
              <p className="text-white/80 max-w-xl mx-auto mb-6">
                Can't find what you're looking for? Our support team is ready to assist you.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="/contact"
                  onClick={(e) => {
                    e.preventDefault();
                    window.history.pushState({}, '', '/contact');
                    window.dispatchEvent(new PopStateEvent('popstate'));
                  }}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white text-indigo-600 rounded-xl font-medium hover:bg-gray-100 transition-colors"
                >
                  <MessageSquare className="w-5 h-5" />
                  Contact Support
                </a>
                <a
                  href="mailto:support@adiology.online"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 text-white rounded-xl font-medium hover:bg-white/20 transition-colors border border-white/20"
                >
                  <Mail className="w-5 h-5" />
                  Email Us
                </a>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
