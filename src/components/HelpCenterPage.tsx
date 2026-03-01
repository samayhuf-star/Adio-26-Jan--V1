import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, Search, BookOpen, Zap, Target, Settings, Shield, CreditCard, MessageSquare, ChevronRight, ChevronDown, Mail, ExternalLink, HelpCircle, Rocket, BarChart3, Users, CheckCircle2, Lightbulb, AlertTriangle } from 'lucide-react';

interface HelpCenterPageProps {
  onBack: () => void;
}

interface FAQItem {
  question: string;
  answer: string;
}

interface ArticleSection {
  type: 'text' | 'steps' | 'tip' | 'warning' | 'list';
  heading?: string;
  body: string;
}

interface HelpArticle {
  title: string;
  description: string;
  content: ArticleSection[];
}

interface HelpCategory {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  articles: HelpArticle[];
}

export const HelpCenterPage: React.FC<HelpCenterPageProps> = ({ onBack }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<HelpArticle | null>(null);

  const categories: HelpCategory[] = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      description: 'Set up your account and launch your first campaign',
      icon: <Rocket className="w-6 h-6" />,
      articles: [
        {
          title: 'Creating Your Account',
          description: 'Step-by-step guide to setting up your Adiology account',
          content: [
            { type: 'text', body: 'Getting started with Adiology is quick and easy. You can create an account using your email address or sign up with your Google, GitHub, or other social login provider through Clerk authentication.' },
            { type: 'steps', heading: 'How to Create Your Account', body: 'Visit adiology.io and click the "Get Started" or "Sign Up" button\nChoose your preferred sign-up method: email/password or social login (Google, GitHub)\nIf using email, enter your email address and create a strong password\nVerify your email address by clicking the confirmation link sent to your inbox\nComplete your profile by adding your name and business details\nYou are now ready to start building campaigns' },
            { type: 'tip', body: 'Using social login (Google or GitHub) is the fastest way to get started — no email verification needed.' }
          ]
        },
        {
          title: 'Your First Campaign',
          description: 'Learn how to create and launch your first Google Ads campaign',
          content: [
            { type: 'text', body: 'Creating your first Google Ads campaign with Adiology takes about 5-10 minutes. The 7-step Campaign Builder guides you through the entire process, from entering your website URL to downloading a ready-to-import CSV file.' },
            { type: 'steps', heading: 'Create Your First Campaign', body: 'Navigate to Campaign Builder from the sidebar menu\nEnter your landing page URL — our AI will analyze your website automatically\nChoose a campaign structure (SKAG, STAG, Intent-Based, or Alpha-Beta)\nGenerate keywords — the system creates 410-710 targeted keywords for you\nCreate your ads using AI-generated headlines and descriptions\nSet your geo-targeting by selecting countries, states, cities, or ZIP codes\nReview your complete campaign and export as CSV for Google Ads Editor' },
            { type: 'tip', body: 'If you are new to Google Ads, start with the STAG (Single Theme Ad Group) structure. It balances simplicity with strong performance.' }
          ]
        },
        {
          title: 'Dashboard Overview',
          description: 'Understanding the main dashboard and its features',
          content: [
            { type: 'text', body: 'Your dashboard is the central hub of Adiology. It displays key stats, quick access to all tools, and recent activity at a glance.' },
            { type: 'list', heading: 'Dashboard Sections', body: 'Stats Cards: View your total campaigns, active keywords, ad groups, and more\nQuick Actions: One-click access to Campaign Builder, Blog Generator, and other tools\nRecent Campaigns: See your latest campaigns with status and quick actions\nActivity Feed: Track your recent actions across the platform' },
            { type: 'text', body: 'The sidebar navigation on the left gives you access to every feature. On mobile devices, the sidebar collapses into a hamburger menu for a clean, focused experience.' }
          ]
        },
        {
          title: 'Account Settings',
          description: 'Configure your profile, notifications, and preferences',
          content: [
            { type: 'text', body: 'Account Settings let you customize your Adiology experience. You can update your profile information, manage notification preferences, and configure default settings for campaign creation.' },
            { type: 'list', heading: 'Available Settings', body: 'Profile: Update your name, email, and avatar\nNotifications: Choose which alerts and updates you want to receive\nDefaults: Set default campaign structure, match types, and geo-targeting preferences\nAPI Keys: Manage API access for programmatic campaign creation\nSecurity: Update your password and enable two-factor authentication' },
            { type: 'tip', body: 'Set your default campaign preferences once and save time on every new campaign you create.' }
          ]
        },
      ]
    },
    {
      id: 'campaigns',
      title: 'Campaign Builder',
      description: 'Create, manage, and optimize your campaigns',
      icon: <Target className="w-6 h-6" />,
      articles: [
        {
          title: 'Campaign Structure',
          description: 'Understanding campaigns, ad groups, and keywords',
          content: [
            { type: 'text', body: 'A Google Ads campaign has a hierarchical structure: Campaign > Ad Groups > Keywords & Ads. Understanding this structure is key to building effective campaigns.' },
            { type: 'text', heading: 'Campaign Level', body: 'The campaign is the top-level container. It defines your budget, bidding strategy, and targeting settings. All ad groups within a campaign share these settings.' },
            { type: 'text', heading: 'Ad Group Level', body: 'Ad groups organize your keywords and ads around specific themes. Each ad group should focus on a tightly related set of keywords, with ads that match those keywords closely.' },
            { type: 'text', heading: 'Keywords & Ads', body: 'Keywords trigger your ads to show when users search for related terms. Each ad group contains keywords (in various match types) and ads (RSA, DKI, or Call-Only) that are displayed to searchers.' },
            { type: 'tip', body: 'Adiology supports 15 campaign structures including SKAG, STAG, Alpha-Beta, Match-Type, Intent-Based, and more. Each organizes keywords into ad groups differently for specific strategies.' }
          ]
        },
        {
          title: 'One-Click Campaigns',
          description: 'Generate complete campaigns with AI in one click',
          content: [
            { type: 'text', body: 'The One-Click Campaign feature uses AI to analyze your website and automatically generate a complete campaign, including keywords, ads, and targeting — all from a single URL input.' },
            { type: 'steps', heading: 'How to Use One-Click Campaigns', body: 'Enter your landing page URL in the Campaign Builder\nClick the AI analysis button to let our system analyze your website\nThe AI extracts your business type, services, and key selling points\nA complete campaign is generated with keywords, ad copy, and structure\nReview the generated campaign and make any adjustments\nExport the final campaign as a Google Ads Editor CSV' },
            { type: 'tip', body: 'One-Click Campaigns work best with well-structured landing pages that clearly describe your products or services.' }
          ]
        },
        {
          title: 'Campaign Templates',
          description: 'Use pre-built templates for different industries',
          content: [
            { type: 'text', body: 'Campaign Templates provide pre-configured campaign setups for common industries and business types. Templates include suggested keywords, ad copy, and structure settings tailored to specific verticals.' },
            { type: 'list', heading: 'Available Template Categories', body: 'E-commerce & Retail: Product-focused campaigns with shopping keywords\nLocal Services: Location-based campaigns for plumbers, electricians, lawyers, etc.\nSaaS & Technology: Feature and benefit-focused campaigns for software products\nHealthcare: HIPAA-compliant campaign structures for medical practices\nReal Estate: Property and location-focused campaigns\nEducation: Course and program-focused campaigns' },
            { type: 'tip', body: 'Templates are a great starting point. You can always customize the generated keywords and ads to match your specific business needs.' }
          ]
        },
        {
          title: 'Exporting Campaigns',
          description: 'Export your campaigns to Google Ads Editor format',
          content: [
            { type: 'text', body: 'Adiology exports campaigns in the full 183-column Google Ads Editor CSV format. This ensures complete compatibility with Google Ads, including all campaign settings, ad groups, keywords, ads, extensions, and targeting data.' },
            { type: 'steps', heading: 'How to Export', body: 'Complete all 7 steps of the Campaign Builder\nClick "Export CSV" on the final review step\nYour campaign downloads as a CSV file automatically\nOpen Google Ads Editor or the Google Ads web interface\nGo to Tools & Settings > Bulk Actions > Uploads\nSelect your exported CSV file and review the preview\nClick Apply to import your campaign' },
            { type: 'warning', body: 'Always review the import preview carefully before applying. Start with campaigns set to "Paused" status so you can review everything in Google Ads before going live.' }
          ]
        },
      ]
    },
    {
      id: 'keywords',
      title: 'Keyword Tools',
      description: 'Find, mix, and manage your keywords',
      icon: <Zap className="w-6 h-6" />,
      articles: [
        {
          title: 'Keyword Planner',
          description: 'Research and discover high-performing keywords',
          content: [
            { type: 'text', body: 'The Keyword Planner helps you research and discover high-performing keywords for your Google Ads campaigns. It provides search volume estimates, competition data, and keyword suggestions based on your business or topic.' },
            { type: 'steps', heading: 'How to Use the Keyword Planner', body: 'Navigate to Keyword Planner from the sidebar\nEnter a seed keyword, phrase, or your website URL\nThe system generates related keyword suggestions\nView estimated search volume, competition, and CPC for each keyword\nSelect the keywords you want to use in your campaigns\nExport your selected keywords or add them directly to a campaign' },
            { type: 'tip', body: 'Start with broad seed keywords and then refine your list based on relevance, search volume, and competition level.' }
          ]
        },
        {
          title: 'Keyword Mixer',
          description: 'Combine keyword lists to create comprehensive targeting',
          content: [
            { type: 'text', body: 'The Keyword Mixer lets you combine multiple keyword lists to create comprehensive targeting combinations. Enter words in multiple columns and the mixer generates all possible combinations.' },
            { type: 'steps', heading: 'How to Use the Keyword Mixer', body: 'Navigate to Keyword Mixer from the sidebar\nEnter your first set of keywords (e.g., services: "plumber", "plumbing")\nEnter your second set (e.g., modifiers: "near me", "emergency", "affordable")\nOptionally add a third set (e.g., locations: "NYC", "Brooklyn")\nClick Mix to generate all combinations\nReview the generated combinations and select the ones you want\nCopy or export the final keyword list' },
            { type: 'tip', body: 'Use 2-3 columns with 5-10 words each for the best results. Too many words per column can create an overwhelming number of combinations.' }
          ]
        },
        {
          title: 'Negative Keywords',
          description: 'Build negative keyword lists to improve campaign performance',
          content: [
            { type: 'text', body: 'Negative keywords prevent your ads from showing for irrelevant searches, saving your budget and improving click-through rates. A well-built negative keyword list is essential for campaign performance.' },
            { type: 'list', heading: 'Common Negative Keyword Categories', body: 'Free/Cheap: free, cheap, discount, coupon (if you sell premium services)\nJobs/Career: jobs, careers, hiring, salary (if you are not recruiting)\nDIY/How-to: how to, DIY, tutorial (if you sell done-for-you services)\nCompetitors: Competitor brand names (unless running competitor campaigns)\nIrrelevant locations: City or country names outside your service area' },
            { type: 'tip', body: 'Review your search terms report in Google Ads regularly and add irrelevant searches as negative keywords. Adiology generates an initial negative keyword list during campaign creation.' }
          ]
        },
        {
          title: 'Long-Tail Keywords',
          description: 'Generate long-tail keyword variations for better targeting',
          content: [
            { type: 'text', body: 'Long-tail keywords are longer, more specific keyword phrases that typically have lower search volume but higher conversion rates. They are easier to rank for and attract more qualified traffic.' },
            { type: 'steps', heading: 'How to Generate Long-Tail Keywords', body: 'Navigate to Long-Tail Generator from the sidebar\nEnter your base keyword or phrase\nThe system generates long-tail variations using AI\nFilter results by word count, estimated volume, or relevance\nSelect the keywords you want to use\nExport or add them to your campaign' },
            { type: 'tip', body: 'Long-tail keywords with 3-5 words tend to perform best. They are specific enough to attract qualified leads but broad enough to generate meaningful traffic.' }
          ]
        },
      ]
    },
    {
      id: 'analytics',
      title: 'Analytics & Reporting',
      description: 'Track performance and gain insights',
      icon: <BarChart3 className="w-6 h-6" />,
      articles: [
        {
          title: 'Dashboard Metrics',
          description: 'Understanding your key performance indicators',
          content: [
            { type: 'text', body: 'The Adiology dashboard displays key metrics about your campaign building activity. These metrics help you track your productivity and campaign quality over time.' },
            { type: 'list', heading: 'Key Metrics Explained', body: 'Total Campaigns: The number of campaigns you have created across all time\nActive Keywords: Total keywords generated across all your campaigns\nAd Groups Created: The number of ad groups generated across campaigns\nExports: How many times you have downloaded campaign CSV files' },
            { type: 'tip', body: 'Check your dashboard regularly to track your campaign building activity and identify areas for optimization.' }
          ]
        },
        {
          title: 'Campaign Performance',
          description: 'Analyzing campaign results and optimizations',
          content: [
            { type: 'text', body: 'While Adiology focuses on campaign creation and export, understanding how to analyze performance in Google Ads is crucial for ongoing optimization.' },
            { type: 'list', heading: 'Key Performance Metrics in Google Ads', body: 'Click-Through Rate (CTR): The percentage of people who click your ad after seeing it. Aim for 2-5% in Search.\nConversion Rate: The percentage of clicks that result in a desired action (purchase, sign-up, call).\nCost Per Click (CPC): The average amount you pay for each click on your ad.\nQuality Score: Google\'s rating of your keywords on a 1-10 scale based on expected CTR, ad relevance, and landing page experience.\nReturn on Ad Spend (ROAS): Revenue generated per dollar spent on ads.' },
            { type: 'tip', body: 'After importing your Adiology campaign into Google Ads, let it run for at least 2-4 weeks before making major changes. This gives Google enough data to optimize delivery.' }
          ]
        },
        {
          title: 'Keyword Analytics',
          description: 'Track keyword performance and trends',
          content: [
            { type: 'text', body: 'Keyword analytics help you understand which keywords drive the most valuable traffic to your website. Monitoring keyword performance allows you to optimize bids, pause underperformers, and expand on winners.' },
            { type: 'list', heading: 'What to Track', body: 'Impressions: How often your ads show for each keyword\nClicks: How many times users clicked on your ad for each keyword\nCTR: Click-through rate shows keyword relevance to searchers\nAverage CPC: The cost you pay per click for each keyword\nConversions: Desired actions completed from each keyword\nSearch Terms: Actual queries that triggered your keywords' },
            { type: 'tip', body: 'Use the Search Terms report in Google Ads to discover new keyword opportunities and add irrelevant queries as negative keywords.' }
          ]
        },
        {
          title: 'Export Reports',
          description: 'Generate and export performance reports',
          content: [
            { type: 'text', body: 'Adiology lets you export your campaign data for analysis and record-keeping. You can also use Google Ads built-in reporting to generate detailed performance reports.' },
            { type: 'steps', heading: 'Exporting from Adiology', body: 'Navigate to your Saved Campaigns\nSelect the campaign you want to export\nClick the Export button to download the campaign data\nThe CSV file includes all campaign settings, ad groups, keywords, and ads\nUse the CSV file for your records or re-import into Google Ads' },
            { type: 'tip', body: 'Keep exported campaign files organized by date and client name for easy reference. This is especially important for agencies managing multiple accounts.' }
          ]
        },
      ]
    },
    {
      id: 'billing',
      title: 'Billing & Plans',
      description: 'Manage your subscription and payments',
      icon: <CreditCard className="w-6 h-6" />,
      articles: [
        {
          title: 'Subscription Plans',
          description: 'Compare features across different pricing tiers',
          content: [
            { type: 'text', body: 'Adiology offers four pricing tiers to fit different needs, from individual marketers to agencies managing multiple clients.' },
            { type: 'list', heading: 'Available Plans', body: 'Starter ($49/month): Essential campaign building tools, up to 10 campaigns per month, basic keyword generation\nProfessional ($99/month): Unlimited campaigns, advanced AI features, priority support, all keyword tools\nAgency ($149/month): Everything in Professional plus white-label exports, bulk campaign management, dedicated support\nLifetime ($99 one-time): Full access to all features with a single payment, no recurring charges' },
            { type: 'tip', body: 'All paid plans include a 7-day free trial and a 14-day money-back guarantee. The Lifetime plan is the best value for long-term users.' }
          ]
        },
        {
          title: 'Payment Methods',
          description: 'Add, update, or remove payment methods',
          content: [
            { type: 'text', body: 'Adiology uses Stripe for secure payment processing. You can pay with any major credit or debit card.' },
            { type: 'list', heading: 'Accepted Payment Methods', body: 'Visa credit and debit cards\nMastercard credit and debit cards\nAmerican Express\nDiscover\nAll transactions are encrypted with industry-standard SSL/TLS security' },
            { type: 'steps', heading: 'How to Update Your Payment Method', body: 'Go to your Account Settings or Billing section\nClick on Payment Methods\nAdd a new card or update your existing card details\nYour next billing cycle will use the updated payment method' }
          ]
        },
        {
          title: 'Invoices & Receipts',
          description: 'Access your billing history and download invoices',
          content: [
            { type: 'text', body: 'All your payment history is available in the Billing section of your account. You can view past transactions and download invoices for your records.' },
            { type: 'steps', heading: 'How to Access Invoices', body: 'Navigate to Account Settings > Billing\nView your payment history with dates and amounts\nClick on any transaction to view the full invoice details\nDownload invoices as PDF for your accounting records' },
            { type: 'tip', body: 'Invoices are generated automatically after each payment. If you need a custom invoice format for your business, contact our support team.' }
          ]
        },
        {
          title: 'Cancellation & Refunds',
          description: 'Understanding our cancellation and refund policies',
          content: [
            { type: 'text', body: 'You can cancel your subscription at any time. Your access continues until the end of your current billing period.' },
            { type: 'list', heading: 'Cancellation Details', body: 'Cancel anytime from your Account Settings > Billing section\nAccess continues until the end of your current billing period\nNo cancellation fees or penalties\nYour campaign data is preserved even after cancellation\nYou can reactivate your subscription at any time' },
            { type: 'text', heading: 'Refund Policy', body: 'We offer a 14-day money-back guarantee on all plans. If you are not satisfied within the first 14 days, contact support@adiology.io for a full refund. For more details, visit our Refund Policy page.' }
          ]
        },
      ]
    },
    {
      id: 'security',
      title: 'Security & Privacy',
      description: 'Keep your account and data safe',
      icon: <Shield className="w-6 h-6" />,
      articles: [
        {
          title: 'Account Security',
          description: 'Best practices for keeping your account secure',
          content: [
            { type: 'text', body: 'Keeping your Adiology account secure is important, especially if you manage campaigns for clients. Follow these best practices to protect your account.' },
            { type: 'list', heading: 'Security Best Practices', body: 'Use a strong, unique password with at least 12 characters\nEnable two-factor authentication (2FA) for an extra layer of security\nNever share your login credentials with others\nSign out of your account when using shared or public computers\nReview your account activity regularly for any suspicious actions\nKeep your email address up to date to receive security notifications' },
            { type: 'warning', body: 'If you suspect unauthorized access to your account, change your password immediately and contact support@adiology.io.' }
          ]
        },
        {
          title: 'Two-Factor Authentication',
          description: 'Enable 2FA for additional account protection',
          content: [
            { type: 'text', body: 'Two-factor authentication adds an extra layer of security by requiring a second verification step when you sign in, in addition to your password.' },
            { type: 'steps', heading: 'How to Enable 2FA', body: 'Go to Account Settings > Security\nClick Enable Two-Factor Authentication\nScan the QR code with your authenticator app (Google Authenticator, Authy, etc.)\nEnter the 6-digit verification code from your authenticator app\nSave your backup codes in a safe place\n2FA is now active for your account' },
            { type: 'warning', body: 'Save your backup codes in a safe location. If you lose access to your authenticator app, you will need these codes to sign in.' }
          ]
        },
        {
          title: 'Data Privacy',
          description: 'How we handle and protect your data',
          content: [
            { type: 'text', body: 'At Adiology, we take data privacy seriously. Your campaign data, personal information, and usage history are protected with industry-standard security measures.' },
            { type: 'list', heading: 'Our Data Practices', body: 'All data is encrypted in transit using TLS 1.3 and at rest using AES-256 encryption\nWe never sell your personal data to third parties\nCampaign data is stored securely and only accessible to you\nWe use Clerk for authentication, providing enterprise-grade security\nDatabase backups are performed regularly to prevent data loss\nYou can request data export or deletion at any time under GDPR' },
            { type: 'tip', body: 'Review our full Privacy Policy for detailed information about how we collect, use, and protect your data.' }
          ]
        },
        {
          title: 'GDPR Compliance',
          description: 'Your rights under GDPR and data protection regulations',
          content: [
            { type: 'text', body: 'Adiology is fully compliant with the General Data Protection Regulation (GDPR). We respect your data rights and provide tools for you to manage your personal information.' },
            { type: 'list', heading: 'Your GDPR Rights', body: 'Right to Access: Request a copy of all personal data we hold about you\nRight to Rectification: Correct any inaccurate personal data\nRight to Erasure: Request deletion of your personal data\nRight to Portability: Receive your data in a machine-readable format\nRight to Object: Object to processing of your personal data\nRight to Restrict Processing: Limit how we use your data' },
            { type: 'text', body: 'To exercise any of these rights, contact our Data Protection team at support@adiology.io. We will respond to your request within 30 days.' }
          ]
        },
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
      answer: 'You can reach our support team via email at support@adiology.io, by phone at +1 304-305-1702, or through the in-app support chat. We typically respond within 24 hours on business days.'
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

  const handleBack = () => {
    if (selectedArticle) {
      setSelectedArticle(null);
    } else if (selectedCategory) {
      setSelectedCategory(null);
    } else {
      onBack();
    }
  };

  const renderSection = (section: ArticleSection, idx: number) => {
    switch (section.type) {
      case 'steps':
        return (
          <div key={idx} className="mb-6">
            {section.heading && (
              <h3 className="text-lg font-semibold text-gray-900 mb-3">{section.heading}</h3>
            )}
            <ol className="space-y-3">
              {section.body.split('\n').map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-semibold mt-0.5">
                    {i + 1}
                  </span>
                  <span className="text-gray-700 leading-relaxed pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        );
      case 'list':
        return (
          <div key={idx} className="mb-6">
            {section.heading && (
              <h3 className="text-lg font-semibold text-gray-900 mb-3">{section.heading}</h3>
            )}
            <ul className="space-y-2">
              {section.body.split('\n').map((item, i) => (
                <li key={i} className="flex gap-3 text-gray-700">
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        );
      case 'tip':
        return (
          <div key={idx} className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
            <Lightbulb className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-blue-800 text-sm leading-relaxed">{section.body}</p>
          </div>
        );
      case 'warning':
        return (
          <div key={idx} className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-amber-800 text-sm leading-relaxed">{section.body}</p>
          </div>
        );
      default:
        return (
          <div key={idx} className="mb-6">
            {section.heading && (
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{section.heading}</h3>
            )}
            <p className="text-gray-700 leading-relaxed">{section.body}</p>
          </div>
        );
    }
  };

  return (
    <>
      <Helmet>
        <title>Help Center - Adiology | Guides, FAQs & Documentation</title>
        <meta name="description" content="Find answers to common questions about Adiology. Browse guides, tutorials, and FAQs about Google Ads campaign building, keyword planning, and more." />
        <link rel="canonical" href="https://adiology.io/help-center" />
        <meta property="og:title" content="Help Center - Adiology" />
        <meta property="og:description" content="Find answers to common questions about Adiology and Google Ads campaign building." />
        <meta property="og:url" content="https://adiology.io/help-center" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://adiology.io/og-image.png" />
        <meta name="twitter:image" content="https://adiology.io/og-image.png" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Help Center - Adiology" />
        <meta name="twitter:description" content="Find answers to common questions about Adiology." />
      </Helmet>
      <div className="min-h-screen bg-gray-50">
        <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 text-white">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {selectedArticle ? `Back to ${activeCategory?.title || 'Category'}` : selectedCategory ? 'Back to all categories' : 'Back to Home'}
          </button>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Help Center</h1>
          <p className="text-xl text-white/80 max-w-2xl mb-8">
            Find answers, learn best practices, and get the most out of Adiology.
          </p>
          {!selectedArticle && (
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
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {selectedArticle && activeCategory ? (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-8 py-6 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white">
                    {activeCategory.icon}
                  </div>
                  <span className="text-sm font-medium text-gray-500">{activeCategory.title}</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">{selectedArticle.title}</h2>
                <p className="text-gray-600 mt-1">{selectedArticle.description}</p>
              </div>
              <div className="px-8 py-8">
                {selectedArticle.content.map((section, idx) => renderSection(section, idx))}
              </div>
            </div>

            <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Other articles in {activeCategory.title}</h3>
              <div className="space-y-3">
                {activeCategory.articles
                  .filter(a => a.title !== selectedArticle.title)
                  .map((article, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedArticle(article)}
                      className="w-full bg-white rounded-xl border border-gray-200 p-4 hover:border-indigo-300 hover:shadow-md transition-all text-left group flex items-center justify-between"
                    >
                      <span className="text-gray-700 group-hover:text-indigo-600 transition-colors font-medium">{article.title}</span>
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-600" />
                    </button>
                  ))}
              </div>
            </div>
          </div>
        ) : activeCategory ? (
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
                <button
                  key={index}
                  onClick={() => setSelectedArticle(article)}
                  className="w-full bg-white rounded-xl p-6 border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer text-left group"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors mb-2">{article.title}</h3>
                      <p className="text-gray-600">{article.description}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 mt-1 flex-shrink-0 transition-colors" />
                  </div>
                </button>
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
                  href="mailto:support@adiology.io"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white text-indigo-600 rounded-xl font-medium hover:bg-gray-100 transition-colors"
                >
                  <MessageSquare className="w-5 h-5" />
                  Contact Support
                </a>
                <a
                  href="mailto:support@adiology.io"
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
    </>
  );
};
