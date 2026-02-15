import React, { useState } from 'react';
import { 
    Book, HelpCircle, Search, ChevronRight, ChevronDown,
    Zap, Target, FileText, Download, Settings,
    ArrowLeft, Globe, Mail, Shield, LayoutDashboard,
    Megaphone, FolderKanban, Users, BarChart3, Rocket,
    CheckCircle2, Lightbulb, MousePointerClick, Clock,
    Eye, Layers, PenTool, MapPin, FileDown, Bot,
    MessageSquare, ExternalLink, Star, BookOpen
} from 'lucide-react';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';

interface Article {
    id: string;
    title: string;
    description: string;
    content: ArticleSection[];
    tags: string[];
}

interface ArticleSection {
    heading?: string;
    body: string;
    type: 'text' | 'steps' | 'tip' | 'warning' | 'list';
}

interface DocCategory {
    id: string;
    title: string;
    description: string;
    icon: React.ElementType;
    color: string;
    bgColor: string;
    borderColor: string;
    articles: Article[];
}

const categories: DocCategory[] = [
    {
        id: 'getting-started',
        title: 'Getting Started',
        description: 'Set up your account and launch your first campaign',
        icon: Rocket,
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-50',
        borderColor: 'border-emerald-200',
        articles: [
            {
                id: 'welcome',
                title: 'Welcome to Adiology',
                description: 'Learn what Adiology offers and how it can transform your Google Ads workflow.',
                tags: ['overview', 'intro'],
                content: [
                    { type: 'text', body: 'Adiology is an all-in-one Google Ads campaign builder platform designed to automate and simplify the creation of professional advertising campaigns. Whether you are a solo marketer or an agency managing dozens of clients, Adiology gives you the tools to build, optimize, and export campaigns in minutes.' },
                    { type: 'list', heading: 'What You Can Do', body: 'Build complete Google Ads campaigns with a 7-step guided wizard\nGenerate 410-710 AI-powered keywords per campaign\nCreate RSA, DKI, and Call-Only ads with policy-compliant guardrails\nExport campaigns in full 183-column Google Ads Editor CSV format\nResearch competitor ads through Google Ads Transparency\nGenerate AI-powered blog content for your marketing\nMonitor domains for expiry, SSL, and DNS changes\nProtect your ads from click fraud with Click Guard\nUse disposable temp emails for testing and privacy' },
                    { type: 'tip', body: 'Start with the Campaign Builder to create your first campaign, then explore the other tools as you grow more comfortable with the platform.' }
                ]
            },
            {
                id: 'quick-start',
                title: 'Quick Start Guide',
                description: 'Get your first campaign up and running in under 10 minutes.',
                tags: ['quick-start', 'beginner', 'first campaign'],
                content: [
                    { type: 'text', body: 'Follow these steps to create and export your first Google Ads campaign. The entire process takes about 5-10 minutes.' },
                    { type: 'steps', heading: 'Create Your First Campaign', body: 'Sign in to your Adiology account using email or social login\nNavigate to Campaign Builder from the sidebar menu\nEnter your landing page URL - our AI will analyze your website automatically\nChoose a campaign structure (SKAG, STAG, Intent-Based, or Alpha-Beta)\nGenerate keywords - the system creates 410-710 targeted keywords for you\nCreate your ads using AI-generated headlines and descriptions\nSet your geo-targeting by selecting countries, states, cities, or ZIP codes\nReview your complete campaign and export as CSV for Google Ads Editor' },
                    { type: 'tip', body: 'If you are new to Google Ads, start with the STAG (Single Theme Ad Group) structure. It balances simplicity with strong performance.' }
                ]
            },
            {
                id: 'dashboard-overview',
                title: 'Dashboard Overview',
                description: 'Understand your dashboard and navigate the platform efficiently.',
                tags: ['dashboard', 'navigation', 'ui'],
                content: [
                    { type: 'text', body: 'Your dashboard is the central hub of Adiology. It displays key stats, quick access to all tools, and recent activity at a glance.' },
                    { type: 'list', heading: 'Dashboard Sections', body: 'Stats Cards: View your total campaigns, active keywords, ad groups, and more\nQuick Actions: One-click access to Campaign Builder, Blog Generator, and other tools\nRecent Campaigns: See your latest campaigns with status and quick actions\nCommunity Widget: Browse the latest community discussions and ask questions\nActivity Feed: Track your recent actions across the platform' },
                    { type: 'text', body: 'The sidebar navigation on the left gives you access to every feature. On mobile devices, the sidebar collapses into a hamburger menu for a clean, focused experience.' }
                ]
            }
        ]
    },
    {
        id: 'campaign-builder',
        title: 'Campaign Builder',
        description: 'Build complete Google Ads campaigns step by step',
        icon: Target,
        color: 'text-indigo-600',
        bgColor: 'bg-indigo-50',
        borderColor: 'border-indigo-200',
        articles: [
            {
                id: 'builder-overview',
                title: '7-Step Campaign Builder',
                description: 'Walk through the complete campaign creation wizard from URL input to CSV export.',
                tags: ['campaign', 'builder', 'wizard'],
                content: [
                    { type: 'text', body: 'The Campaign Builder guides you through 7 steps to create a complete, professional Google Ads campaign. Each step is designed to be intuitive, with AI assistance built in throughout the process.' },
                    { type: 'steps', heading: 'The 7 Steps', body: 'URL Input & AI Analysis: Enter your landing page URL and let our AI analyze your website, extracting business type, services, and marketing angles\nStructure Selection: Choose from SKAG, STAG, Intent-Based, or Alpha-Beta campaign structures based on your goals\nKeyword Generation: Generate 410-710 targeted keywords using AI, with match type selection (Broad, Phrase, Exact)\nAd Generation: Create Responsive Search Ads (RSA), Dynamic Keyword Insertion (DKI) ads, and Call-Only ads with AI-powered copy suggestions\nGeo-Targeting: Select your target locations by country, state, city, or ZIP code with preset metro area options\nReview & Validate: Review your complete campaign configuration, check for policy compliance, and validate all settings\nExport: Download as a 183-column Google Ads Editor CSV file' },
                    { type: 'tip', body: 'You can save your campaign as a draft at any step and return to it later from the Saved Campaigns section.' }
                ]
            },
            {
                id: 'campaign-structures',
                title: 'Campaign Structures Explained',
                description: 'Understand SKAG, STAG, Intent-Based, and Alpha-Beta structures and when to use each.',
                tags: ['skag', 'stag', 'intent', 'alpha-beta', 'structure'],
                content: [
                    { type: 'text', heading: 'SKAG (Single Keyword Ad Group)', body: 'Creates one ad group per keyword for maximum relevance and Quality Score. Best for highly targeted campaigns where each keyword deserves its own tailored ad copy. Produces more ad groups but offers the highest level of control.' },
                    { type: 'text', heading: 'STAG (Single Theme Ad Group)', body: 'Groups related keywords into themed ad groups. This approach balances management efficiency with ad relevance. Recommended for most campaigns, especially when managing multiple products or services.' },
                    { type: 'text', heading: 'Intent-Based Structure', body: 'Organizes keywords by user intent (informational, navigational, commercial, transactional). This structure aligns your ads with where the user is in their buying journey, improving conversion rates.' },
                    { type: 'text', heading: 'Alpha-Beta Structure', body: 'Uses an alpha campaign with exact match keywords for proven performers and a beta campaign with broad match for keyword discovery. This is an advanced strategy for ongoing optimization and keyword mining.' },
                    { type: 'tip', body: 'Not sure which to pick? STAG works great for most businesses. Use Intent-Based if you want to match ads to the customer journey. SKAG is best for advanced users who want maximum control.' }
                ]
            },
            {
                id: 'keyword-generation',
                title: 'Keyword Generation',
                description: 'Generate hundreds of targeted keywords with AI assistance.',
                tags: ['keywords', 'ai', 'generation', 'negative keywords'],
                content: [
                    { type: 'text', body: 'The keyword generation system uses AI to create 410-710 targeted keywords from your website analysis. Keywords are organized by match type and intent, giving you comprehensive coverage for your campaigns.' },
                    { type: 'steps', heading: 'How to Generate Keywords', body: 'After entering your URL, the AI analyzes your website content and extracts key themes\nSelect your preferred match types: Broad, Phrase, Exact, or all three\nClick Generate to create your keyword list\nReview the generated keywords and deselect any that are not relevant\nAdd negative keywords to filter out unwanted traffic\nUse the Append function to generate additional keywords if needed' },
                    { type: 'list', heading: 'Match Types Explained', body: 'Broad Match (keyword): Shows ads for related searches, synonyms, and variations. Widest reach.\nPhrase Match ("keyword"): Shows ads when the search includes the meaning of your keyword. Moderate reach.\nExact Match ([keyword]): Shows ads only for searches with the same meaning or intent. Most precise.' },
                    { type: 'tip', body: 'Use all three match types for comprehensive coverage. Add negative keywords generously to filter irrelevant traffic and improve your Quality Score.' }
                ]
            },
            {
                id: 'ad-creation',
                title: 'Creating Ads',
                description: 'Build RSA, DKI, and Call-Only ads with AI-powered copy suggestions.',
                tags: ['ads', 'rsa', 'dki', 'call-only', 'headlines', 'descriptions'],
                content: [
                    { type: 'text', body: 'Adiology supports three types of Google Search ads, each with AI-generated copy suggestions and built-in policy compliance checks.' },
                    { type: 'text', heading: 'Responsive Search Ads (RSA)', body: 'RSAs are the standard ad format. You provide multiple headlines (up to 15, 30 characters each) and descriptions (up to 4, 90 characters each). Google automatically tests different combinations to find the best performers. Our AI generates headline and description suggestions based on your website and keywords.' },
                    { type: 'text', heading: 'Dynamic Keyword Insertion (DKI)', body: 'DKI ads automatically insert the user\'s search query into your ad using the format {Keyword:Default Text}. For example, "Buy {Keyword:Running Shoes} Online" shows "Buy Nike Sneakers Online" when someone searches for "nike sneakers". Always provide sensible default text as a fallback.' },
                    { type: 'text', heading: 'Call-Only Ads', body: 'Call-Only ads appear on mobile devices and prompt users to call your business directly. They require a business name, phone number, 2 headlines, and 2 descriptions. Ideal for emergency services, local businesses, and appointment-based services.' },
                    { type: 'warning', body: 'Ad Guardrails: Adiology automatically checks your ads for Google policy compliance, character limits, uniqueness (using Levenshtein distance), and calculates ad strength. Fix any flagged issues before exporting.' }
                ]
            },
            {
                id: 'geo-targeting',
                title: 'Geo-Targeting',
                description: 'Target your ads to specific locations for better performance.',
                tags: ['geo', 'targeting', 'location', 'zip codes'],
                content: [
                    { type: 'text', body: 'Geo-targeting lets you show your ads only to people in specific locations. This is crucial for local businesses and regional campaigns.' },
                    { type: 'steps', heading: 'How to Set Up Geo-Targeting', body: 'In Step 5 of the Campaign Builder, select your target country\nChoose your targeting level: States, Cities, or ZIP Codes\nSelect specific locations from the dropdown or search for them\nUse preset ZIP code lists for major metropolitan areas if needed\nReview your selected locations before proceeding' },
                    { type: 'tip', body: 'For local businesses, target a 15-30 mile radius around your location. For e-commerce, you can target entire countries or regions.' }
                ]
            },
            {
                id: 'csv-export',
                title: 'Exporting & Importing Campaigns',
                description: 'Export your campaigns and import them into Google Ads.',
                tags: ['export', 'csv', 'import', 'google ads editor'],
                content: [
                    { type: 'text', body: 'Adiology exports campaigns in the full 183-column Google Ads Editor CSV format. This ensures complete compatibility with Google Ads, including all campaign settings, ad groups, keywords, ads, extensions, and targeting data.' },
                    { type: 'steps', heading: 'How to Export', body: 'Complete all 7 steps of the Campaign Builder\nClick "Export CSV" on the final review step\nYour campaign downloads as a CSV file automatically\nOpen Google Ads Editor or Google Ads web interface\nGo to Tools & Settings, then Bulk Actions, then Uploads\nSelect your exported CSV file and review the preview\nClick Apply to import your campaign' },
                    { type: 'warning', body: 'Always review the import preview carefully before applying. Start with campaigns set to "Paused" status so you can review everything in Google Ads before going live.' },
                    { type: 'tip', body: 'The exported CSV is fully compatible with Google Ads Editor. Simply import the file to get your entire campaign structure ready to go.' }
                ]
            }
        ]
    },
    {
        id: 'ads-search',
        title: 'Ads Search',
        description: 'Research competitor ads from Google Ads Transparency',
        icon: Eye,
        color: 'text-violet-600',
        bgColor: 'bg-violet-50',
        borderColor: 'border-violet-200',
        articles: [
            {
                id: 'ads-transparency',
                title: 'Competitor Ad Research',
                description: 'Use Google Ads Transparency Center data to research what competitors are running.',
                tags: ['competitor', 'research', 'ads transparency', 'spy'],
                content: [
                    { type: 'text', body: 'The Ads Search tool lets you research competitor advertisements from the Google Ads Transparency Center. See what ads your competitors are running, what messaging they use, and find inspiration for your own campaigns.' },
                    { type: 'steps', heading: 'How to Research Competitor Ads', body: 'Navigate to Ads Search from the sidebar\nEnter a competitor domain or brand name\nSubmit your search - the system queues an asynchronous scraping job\nResults are processed and displayed once the scrape completes\nBrowse competitor ad creatives, headlines, and descriptions\nUse insights to improve your own ad copy and strategy' },
                    { type: 'tip', body: 'Search for your top 3-5 competitors to understand the competitive landscape. Look for messaging patterns, unique selling points, and offers that appear frequently.' }
                ]
            }
        ]
    },
    {
        id: 'saved-campaigns',
        title: 'Saved Campaigns',
        description: 'Manage your campaign history and re-export campaigns',
        icon: FolderKanban,
        color: 'text-amber-600',
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-200',
        articles: [
            {
                id: 'campaign-history',
                title: 'Managing Saved Campaigns',
                description: 'View, edit, and re-export your campaign history.',
                tags: ['saved', 'history', 'campaigns', 'drafts'],
                content: [
                    { type: 'text', body: 'Every campaign you create is automatically saved to your campaign history. You can access, search, filter, and re-export any previous campaign at any time.' },
                    { type: 'list', heading: 'What You Can Do', body: 'View all your past campaigns with search and filter options\nRe-open a campaign to review its settings and data\nRe-export any campaign as a fresh CSV file\nDelete campaigns you no longer need' }
                ]
            }
        ]
    },
    {
        id: 'blog-generator',
        title: 'AI Blog Generator',
        description: 'Generate long-form marketing blog content with AI',
        icon: PenTool,
        color: 'text-pink-600',
        bgColor: 'bg-pink-50',
        borderColor: 'border-pink-200',
        articles: [
            {
                id: 'blog-overview',
                title: 'Generating Blog Posts',
                description: 'Create 2000+ word blog posts with AI in minutes.',
                tags: ['blog', 'ai', 'content', 'marketing'],
                content: [
                    { type: 'text', body: 'The AI Blog Generator creates comprehensive, long-form blog posts with 2000+ words and 5+ content sections. Each post includes case studies, actionable tips, image prompts, and optionally code snippets and statistics.' },
                    { type: 'steps', heading: 'How to Generate a Blog Post', body: 'Navigate to Blog Generator from the sidebar\nEnter your blog topic or keyword\nSelect your content type (how-to guide, listicle, case study, etc.)\nChoose the tone (professional, casual, authoritative, etc.)\nSet your target audience\nClick Generate and wait for the AI to create your content\nReview and edit the generated content as needed\nExport as HTML, copy to clipboard, or preview in markdown' },
                    { type: 'list', heading: 'What Each Blog Includes', body: '2000+ words of original content\n5+ structured content sections with headings\nReal-world case studies and examples\nActionable tips and takeaways\nImage prompts for visual content creation\nOptional code snippets (for technical topics)\nOptional statistics and data points' },
                    { type: 'tip', body: 'Be specific with your topic for better results. Instead of "marketing tips", try "Google Ads optimization strategies for e-commerce stores in 2026".' }
                ]
            }
        ]
    },
    {
        id: 'domain-monitoring',
        title: 'Domain Monitoring',
        description: 'Track domain expiry, SSL certificates, and DNS records',
        icon: Globe,
        color: 'text-cyan-600',
        bgColor: 'bg-cyan-50',
        borderColor: 'border-cyan-200',
        articles: [
            {
                id: 'domain-overview',
                title: 'Monitoring Your Domains',
                description: 'Keep track of domain registrations, SSL certificates, and DNS records.',
                tags: ['domain', 'ssl', 'dns', 'monitoring', 'whois'],
                content: [
                    { type: 'text', body: 'Domain Monitoring helps you keep track of your domain portfolio. Get alerts before domains expire, monitor SSL certificate validity, and track DNS record changes over time.' },
                    { type: 'list', heading: 'What You Can Monitor', body: 'Domain registration and expiry dates via real-time WHOIS lookups\nSSL certificate validity status and expiry alerts\nDNS records (A, AAAA, MX, TXT, NS, CNAME)\nChange detection with historical snapshots\nEmail alerts for expiring domains and certificates' },
                    { type: 'steps', heading: 'How to Add a Domain', body: 'Navigate to Domain Monitoring from the sidebar\nClick "Add Domain" and enter your domain name\nThe system performs WHOIS, SSL, and DNS lookups automatically\nView your domain details including registration, expiry, and nameservers\nSet up email alerts for upcoming expirations\nCheck back regularly or rely on email notifications' },
                    { type: 'tip', body: 'Add all your client domains to get proactive alerts. Expired domains can lose SEO authority and traffic, so monitoring is essential.' }
                ]
            }
        ]
    },
    {
        id: 'temp-mail',
        title: 'Proxy Mail',
        description: 'Anonymous email addresses for competitive research',
        icon: Mail,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200',
        articles: [
            {
                id: 'temp-mail-overview',
                title: 'Using Proxy Mail for Competitor Research',
                description: 'Generate anonymous proxy emails to research competitor campaigns invisibly.',
                tags: ['proxy mail', 'competitor research', 'email', 'anonymous', 'competitive intelligence'],
                content: [
                    { type: 'text', body: 'Proxy Mail lets you generate anonymous email addresses instantly. Use them to subscribe to competitor newsletters, study their email sequences, and research their marketing strategies without revealing your identity.' },
                    { type: 'list', heading: 'Features', body: 'Generate anonymous proxy email addresses instantly\nReal-time inbox with 10-second auto-refresh polling\nRead full email content with safe HTML rendering\nCopy email address to clipboard with one click\nGenerate new addresses for each competitor\nView email attachments\nTTL countdown timer showing when the address expires\nDispose of addresses when research is complete' },
                    { type: 'steps', heading: 'How to Use', body: 'Open Proxy Mail from the sidebar\nA random proxy email address is generated for you automatically\nCopy the address and subscribe to competitor newsletters or lead magnets\nIncoming competitor emails appear in your inbox within seconds\nClick any email to read its full content and study their strategy\nGenerate a new address when you need to research another competitor' }
                ]
            }
        ]
    },
    {
        id: 'click-guard',
        title: 'Click Guard',
        description: 'Click fraud protection and traffic analytics',
        icon: Shield,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        articles: [
            {
                id: 'click-guard-overview',
                title: 'Click Fraud Protection',
                description: 'Protect your ad spend from fraudulent clicks and bot traffic.',
                tags: ['click fraud', 'protection', 'bot', 'security', 'traffic'],
                content: [
                    { type: 'text', body: 'Click Guard protects your Google Ads campaigns from click fraud. It monitors your website traffic, detects bots and suspicious behavior, and automatically blocks high-threat IP addresses to save your ad budget.' },
                    { type: 'list', heading: 'How It Works', body: 'Add your domains and install a lightweight tracking script on your website\nThe script collects visitor data: browser, device, OS, mouse movements, click patterns\nVisitor fingerprinting identifies unique visitors across sessions\nBot detection engine scores each visit based on behavioral signals\nHeadless browser detection catches automated click bots\nIP geolocation and VPN/proxy detection flag suspicious traffic\nHigh-threat IPs are automatically blocked\nAll data is displayed in a real-time analytics dashboard' },
                    { type: 'text', heading: 'Threat Levels', body: 'Each visitor receives a threat score. Critical (70+): Very likely fraudulent, auto-blocked. High (50-69): Suspicious behavior, flagged for review. Medium (30-49): Some anomalies detected. Low (under 30): Normal traffic.' },
                    { type: 'steps', heading: 'Getting Started', body: 'Open Click Guard from the sidebar\nAdd your domain in the Domains tab\nCopy the tracking script snippet provided\nPaste the script into your website before the closing body tag\nThe domain verifies automatically when the first tracking ping arrives\nMonitor traffic in the Live Traffic and Analytics tabs\nManage blocked IPs and whitelists in the Protection tab' },
                    { type: 'steps', heading: 'How to Export and Block IPs in Google Ads', body: 'Go to the Protection tab in Click Guard\nClick "Download Blocked IPs (CSV)" to get the latest list of fraudulent IPs\nSign in to your Google Ads account\nNavigate to Settings > Campaign Settings\nSelect the campaign you want to protect\nClick "Additional settings" and find "IP exclusions"\nPaste the IPs from your CSV file or upload the list to block these users from seeing your ads' },
                    { type: 'tip', body: 'Install the tracking script on all pages where you run Google Ads traffic. The script is lightweight and does not affect page load speed. Update your IP exclusions in Google Ads weekly for maximum protection.' }
                ]
            }
        ]
    },
    {
        id: 'community',
        title: 'Community',
        description: 'Connect with other users in the community forum',
        icon: Users,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        articles: [
            {
                id: 'community-overview',
                title: 'Community Forum',
                description: 'Ask questions, share strategies, and learn from other marketers.',
                tags: ['community', 'forum', 'discussion', 'help'],
                content: [
                    { type: 'text', body: 'The Adiology Community is a forum where you can connect with other marketers, ask questions, share campaign strategies, and get help from experienced users.' },
                    { type: 'list', heading: 'Features', body: 'Browse discussion topics and categories\nSearch for specific topics or questions\nCreate new discussion posts with the "Ask Community" button\nAutomatic SSO login using your Adiology account\nCommunity widget on your dashboard showing the latest discussions\nCategory filtering to find relevant topics quickly' },
                    { type: 'tip', body: 'Before creating a new post, search to see if your question has already been answered. The community is active and most questions get responses quickly.' }
                ]
            }
        ]
    },
    {
        id: 'account',
        title: 'Account & Billing',
        description: 'Manage your account, subscription, and billing',
        icon: Settings,
        color: 'text-slate-600',
        bgColor: 'bg-slate-50',
        borderColor: 'border-slate-200',
        articles: [
            {
                id: 'account-settings',
                title: 'Account Settings',
                description: 'Manage your profile, preferences, and security settings.',
                tags: ['account', 'settings', 'profile', 'security'],
                content: [
                    { type: 'text', body: 'Your account is managed through Clerk authentication. You can sign in with email/password or social login (Google, etc.). Your account settings control your profile information, notification preferences, and security.' },
                    { type: 'list', heading: 'Account Features', body: 'Email/password or social login authentication\nProfile management with name and avatar\nCampaign history tied to your account\nSecure data encryption in transit\nRole-based access (Standard User, Paid User, Super Admin)\nNo data sharing with third parties' }
                ]
            },
            {
                id: 'subscription-plans',
                title: 'Subscription Plans',
                description: 'Compare pricing tiers and manage your subscription.',
                tags: ['pricing', 'subscription', 'plans', 'billing', 'stripe'],
                content: [
                    { type: 'text', body: 'Adiology offers three pricing tiers designed for different needs. All plans include a 7-day free trial and a 14-day money-back guarantee.' },
                    { type: 'text', heading: 'Starter Plan - $49/month', body: 'Perfect for individuals getting started. Includes 15 campaigns and access to core features. Currently offered at a 25% early adopter discount.' },
                    { type: 'text', heading: 'Professional Plan - $99/month (Most Popular)', body: 'Ideal for growing businesses. Includes 50 campaigns and all features. Currently offered at a 45% early adopter discount.' },
                    { type: 'text', heading: 'Agency Plan - $149/month', body: 'Built for agencies and power users. Unlimited campaigns with all features. Currently offered at a 65% early adopter discount.' },
                    { type: 'tip', body: 'Save 20% on any plan by choosing annual billing. All plans come with a 7-day free trial so you can try everything before committing.' }
                ]
            }
        ]
    }
];

const faqItems = [
    {
        question: 'How do I create my first campaign?',
        answer: 'Go to Campaign Builder from the sidebar. Enter your website URL and the AI will analyze your business. Then follow the 7-step wizard: choose a structure, generate keywords, create ads, set targeting, review, and export. The whole process takes about 5-10 minutes.',
        category: 'Getting Started'
    },
    {
        question: 'What campaign structures are available?',
        answer: 'Adiology offers four structures: SKAG (Single Keyword Ad Group) for maximum keyword-level control, STAG (Single Theme Ad Group) for balanced management, Intent-Based for aligning ads with the buying journey, and Alpha-Beta for advanced keyword mining. STAG is recommended for most users.',
        category: 'Campaign Builder'
    },
    {
        question: 'How many keywords does the system generate?',
        answer: 'The AI generates 410-710 keywords per campaign based on your website analysis. Keywords are created in all selected match types (Broad, Phrase, Exact). You can review and deselect irrelevant keywords before exporting.',
        category: 'Campaign Builder'
    },
    {
        question: 'What ad formats are supported?',
        answer: 'Adiology supports Responsive Search Ads (RSA) with up to 15 headlines and 4 descriptions, Dynamic Keyword Insertion (DKI) ads that automatically insert search queries, and Call-Only ads for mobile phone call campaigns. All ads are checked for Google policy compliance.',
        category: 'Campaign Builder'
    },
    {
        question: 'How do I export my campaign?',
        answer: 'After completing all 7 steps, click "Export CSV" on the review page. The file downloads in the 183-column Google Ads Editor format, ready to import into Google Ads Editor.',
        category: 'Exporting'
    },
    {
        question: 'How do I use Click Guard with Google Ads?',
        answer: 'First, add your domain to Click Guard and install the tracking script on your site. Once traffic starts flowing, Click Guard will identify fraudulent IPs. Download these IPs from the Protection tab and add them to the "IP exclusions" section in your Google Ads campaign settings.',
        category: 'Click Guard'
    },
    {
        question: 'How do I download and upload blocked IPs?',
        answer: 'In Click Guard > Protection, click the "Download CSV" button to get the list of high-threat IPs. In Google Ads, go to Campaign Settings > Additional Settings > IP Exclusions, and paste or upload the IP addresses from your CSV file.',
        category: 'Click Guard'
    },
    {
        question: 'Where do I find IP Exclusions in Google Ads?',
        answer: 'Log in to Google Ads, select a campaign, go to "Settings", click "Additional settings" at the bottom, and you will see "IP exclusions". This is where you paste the fraudulent IPs identified by Click Guard.',
        category: 'Click Guard'
    },
    {
        question: 'What is Click Guard?',
        answer: 'Click Guard is a click fraud protection system. It monitors your website traffic, detects bots and suspicious clicks using behavioral analysis, and automatically blocks fraudulent IP addresses. This helps protect your ad budget from invalid clicks.',
        category: 'Click Guard'
    },
    {
        question: 'How does the AI Blog Generator work?',
        answer: 'Enter a topic, select content type and tone, and the AI generates a 2000+ word blog post with 5+ sections, case studies, tips, and image prompts. You can export the content as HTML, preview in markdown, or copy to clipboard.',
        category: 'Blog Generator'
    },
    {
        question: 'What does Domain Monitoring track?',
        answer: 'Domain Monitoring tracks domain registration and expiry dates (via WHOIS), SSL certificate validity, and DNS records (A, AAAA, MX, TXT, NS, CNAME). It detects changes over time and can send email alerts before domains or certificates expire.',
        category: 'Domain Monitoring'
    },
    {
        question: 'What is Proxy Mail used for?',
        answer: 'Proxy Mail generates anonymous email addresses for competitive research. Use it to subscribe to competitor newsletters, study their email campaigns, and research marketing strategies without revealing your identity. Addresses auto-expire when you are done.',
        category: 'Proxy Mail'
    },
    {
        question: 'What subscription plans are available?',
        answer: 'There are three plans: Starter ($49/month, 15 campaigns), Professional ($99/month, 50 campaigns, most popular), and Agency ($149/month, unlimited). All plans include a 7-day free trial and 14-day money-back guarantee. Save 20% with annual billing.',
        category: 'Account & Billing'
    },
    {
        question: 'Is my data secure?',
        answer: 'Yes. All data is encrypted in transit, stored securely, and never shared with third parties. Authentication is handled by Clerk with industry-standard security. You can delete your data at any time from your account settings.',
        category: 'Account & Billing'
    },
    {
        question: 'How do I join the Community?',
        answer: 'Navigate to Community from the sidebar. You are automatically signed in using your Adiology account. Browse topics, search for answers, or click "Ask Community" to create a new discussion post.',
        category: 'Community'
    }
];

export const HelpSupport = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeView, setActiveView] = useState<'home' | 'category' | 'article' | 'faq'>('home');
    const [selectedCategory, setSelectedCategory] = useState<DocCategory | null>(null);
    const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
    const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

    const handleCategoryClick = (category: DocCategory) => {
        setSelectedCategory(category);
        setActiveView('category');
        setSearchQuery('');
    };

    const handleArticleClick = (article: Article, category?: DocCategory) => {
        setSelectedArticle(article);
        if (category) setSelectedCategory(category);
        setActiveView('article');
    };

    const handleBack = () => {
        if (activeView === 'article') {
            setActiveView('category');
            setSelectedArticle(null);
        } else {
            setActiveView('home');
            setSelectedCategory(null);
            setSelectedArticle(null);
        }
    };

    const allArticles = categories.flatMap(cat =>
        cat.articles.map(a => ({ ...a, categoryId: cat.id, categoryTitle: cat.title, categoryIcon: cat.icon, categoryColor: cat.color }))
    );

    const searchResults = searchQuery.trim()
        ? [
            ...allArticles.filter(a =>
                a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                a.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                a.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
            ),
            ...faqItems.filter(f =>
                f.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                f.answer.toLowerCase().includes(searchQuery.toLowerCase())
            ).map((f, i) => ({ ...f, id: `faq-${i}`, title: f.question, description: f.answer, tags: [f.category], categoryTitle: 'FAQ', categoryColor: 'text-purple-600', isFaq: true }))
          ]
        : [];

    const renderSection = (section: ArticleSection, idx: number) => {
        switch (section.type) {
            case 'steps':
                return (
                    <div key={idx} className="mb-8">
                        {section.heading && (
                            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                                <div className="w-1.5 h-6 bg-indigo-500 rounded-full" />
                                {section.heading}
                            </h3>
                        )}
                        <div className="space-y-3">
                            {section.body.split('\n').map((step, i) => (
                                <div key={i} className="flex items-start gap-4 group">
                                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5 group-hover:bg-indigo-200 transition-colors">
                                        {i + 1}
                                    </div>
                                    <p className="text-slate-700 leading-relaxed pt-1">{step}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 'list':
                return (
                    <div key={idx} className="mb-8">
                        {section.heading && (
                            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                                <div className="w-1.5 h-6 bg-indigo-500 rounded-full" />
                                {section.heading}
                            </h3>
                        )}
                        <div className="space-y-2.5">
                            {section.body.split('\n').map((item, i) => (
                                <div key={i} className="flex items-start gap-3 pl-1">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                                    <p className="text-slate-700 leading-relaxed">{item}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 'tip':
                return (
                    <div key={idx} className="mb-8 bg-emerald-50 border border-emerald-200 rounded-xl p-5 flex items-start gap-3">
                        <Lightbulb className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                        <div>
                            <span className="text-sm font-semibold text-emerald-700 block mb-1">Pro Tip</span>
                            <p className="text-emerald-800 text-sm leading-relaxed">{section.body}</p>
                        </div>
                    </div>
                );
            case 'warning':
                return (
                    <div key={idx} className="mb-8 bg-amber-50 border border-amber-200 rounded-xl p-5 flex items-start gap-3">
                        <Shield className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                        <div>
                            <span className="text-sm font-semibold text-amber-700 block mb-1">Important</span>
                            <p className="text-amber-800 text-sm leading-relaxed">{section.body}</p>
                        </div>
                    </div>
                );
            default:
                return (
                    <div key={idx} className="mb-6">
                        {section.heading && (
                            <h3 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
                                <div className="w-1.5 h-6 bg-indigo-500 rounded-full" />
                                {section.heading}
                            </h3>
                        )}
                        <p className="text-slate-700 leading-relaxed">{section.body}</p>
                    </div>
                );
        }
    };

    if (activeView === 'article' && selectedArticle && selectedCategory) {
        const CategoryIcon = selectedCategory.icon;
        return (
            <div className="max-w-4xl mx-auto">
                <button
                    onClick={handleBack}
                    className="flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600 mb-6 transition-colors group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Back to {selectedCategory.title}
                </button>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className={`px-8 py-6 ${selectedCategory.bgColor} border-b ${selectedCategory.borderColor}`}>
                        <div className="flex items-center gap-3 mb-3">
                            <div className={`w-10 h-10 rounded-xl ${selectedCategory.bgColor} border ${selectedCategory.borderColor} flex items-center justify-center`}>
                                <CategoryIcon className={`w-5 h-5 ${selectedCategory.color}`} />
                            </div>
                            <Badge variant="outline" className={`${selectedCategory.borderColor} ${selectedCategory.color} text-xs font-medium`}>
                                {selectedCategory.title}
                            </Badge>
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900">{selectedArticle.title}</h1>
                        <p className="text-slate-600 mt-1">{selectedArticle.description}</p>
                    </div>

                    <div className="p-8">
                        {selectedArticle.content.map((section, idx) => renderSection(section, idx))}
                    </div>
                </div>

                <div className="mt-6 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <BookOpen className="w-5 h-5 text-indigo-600" />
                        <h3 className="font-semibold text-slate-800">More in {selectedCategory.title}</h3>
                    </div>
                    <div className="grid gap-2">
                        {selectedCategory.articles
                            .filter(a => a.id !== selectedArticle.id)
                            .map(article => (
                                <button
                                    key={article.id}
                                    onClick={() => handleArticleClick(article)}
                                    className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors text-left group"
                                >
                                    <span className="text-slate-700 group-hover:text-indigo-600 transition-colors">{article.title}</span>
                                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
                                </button>
                            ))
                        }
                    </div>
                </div>
            </div>
        );
    }

    if (activeView === 'category' && selectedCategory) {
        const CategoryIcon = selectedCategory.icon;
        return (
            <div className="max-w-4xl mx-auto">
                <button
                    onClick={handleBack}
                    className="flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600 mb-6 transition-colors group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Back to Documentation
                </button>

                <div className={`${selectedCategory.bgColor} rounded-2xl border ${selectedCategory.borderColor} p-8 mb-8`}>
                    <div className="flex items-center gap-4 mb-3">
                        <div className={`w-14 h-14 rounded-2xl bg-white/80 border ${selectedCategory.borderColor} flex items-center justify-center shadow-sm`}>
                            <CategoryIcon className={`w-7 h-7 ${selectedCategory.color}`} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">{selectedCategory.title}</h1>
                            <p className="text-slate-600">{selectedCategory.description}</p>
                        </div>
                    </div>
                    <Badge variant="outline" className="text-xs text-slate-500 border-slate-300">
                        {selectedCategory.articles.length} {selectedCategory.articles.length === 1 ? 'article' : 'articles'}
                    </Badge>
                </div>

                <div className="space-y-3">
                    {selectedCategory.articles.map((article) => (
                        <button
                            key={article.id}
                            onClick={() => handleArticleClick(article)}
                            className="w-full bg-white rounded-xl border border-slate-200 p-5 hover:border-indigo-300 hover:shadow-md transition-all text-left group"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors mb-1">
                                        {article.title}
                                    </h3>
                                    <p className="text-sm text-slate-500 line-clamp-2">{article.description}</p>
                                    <div className="flex gap-1.5 mt-3">
                                        {article.tags.slice(0, 3).map(tag => (
                                            <Badge key={tag} variant="outline" className="text-[10px] text-slate-400 border-slate-200 px-2 py-0">
                                                {tag}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 mt-1 flex-shrink-0 ml-4" />
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    if (activeView === 'faq') {
        return (
            <div className="max-w-4xl mx-auto">
                <button
                    onClick={() => setActiveView('home')}
                    className="flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600 mb-6 transition-colors group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Back to Documentation
                </button>

                <div className="bg-purple-50 rounded-2xl border border-purple-200 p-8 mb-8">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="w-14 h-14 rounded-2xl bg-white/80 border border-purple-200 flex items-center justify-center shadow-sm">
                            <HelpCircle className="w-7 h-7 text-purple-600" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">Frequently Asked Questions</h1>
                            <p className="text-slate-600">Quick answers to common questions about the platform</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    {faqItems.map((item, idx) => (
                        <div key={idx} className="bg-white rounded-xl border border-slate-200 overflow-hidden transition-all hover:border-slate-300">
                            <button
                                onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                                className="w-full p-5 flex items-center justify-between text-left"
                                aria-expanded={expandedFaq === idx}
                            >
                                <div className="flex items-start gap-3 flex-1 min-w-0">
                                    <HelpCircle className="w-5 h-5 text-purple-500 mt-0.5 flex-shrink-0" />
                                    <span className="font-medium text-slate-800">{item.question}</span>
                                </div>
                                <ChevronDown className={`w-5 h-5 text-slate-400 flex-shrink-0 ml-4 transition-transform duration-200 ${expandedFaq === idx ? 'rotate-180' : ''}`} />
                            </button>
                            {expandedFaq === idx && (
                                <div className="px-5 pb-5 pt-0">
                                    <div className="pl-8 border-l-2 border-purple-200 ml-2.5">
                                        <p className="text-slate-600 leading-relaxed text-sm">{item.answer}</p>
                                        <Badge variant="outline" className="mt-3 text-[10px] text-purple-500 border-purple-200 px-2 py-0">
                                            {item.category}
                                        </Badge>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto">
            <div className="mb-10">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                        <Book className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Documentation</h1>
                        <p className="text-slate-500">Everything you need to master Adiology</p>
                    </div>
                </div>

                <div className="relative max-w-xl mt-6">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input
                        aria-label="Search documentation"
                        placeholder="Search guides, features, and FAQs..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-12 h-12 bg-white border-slate-200 shadow-sm text-base rounded-xl focus:border-indigo-300 focus:ring-indigo-200"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            aria-label="Clear search"
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                            <span className="text-lg">&times;</span>
                        </button>
                    )}
                </div>
            </div>

            {searchQuery.trim() ? (
                <div>
                    <p className="text-sm text-slate-500 mb-4">
                        {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for "{searchQuery}"
                    </p>
                    {searchResults.length > 0 ? (
                        <div className="space-y-3">
                            {searchResults.map((result: any, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => {
                                        if (result.isFaq) {
                                            setActiveView('faq');
                                            setSearchQuery('');
                                        } else {
                                            const cat = categories.find(c => c.id === result.categoryId);
                                            if (cat) {
                                                const article = cat.articles.find(a => a.id === result.id);
                                                if (article) {
                                                    handleArticleClick(article, cat);
                                                    setSearchQuery('');
                                                }
                                            }
                                        }
                                    }}
                                    className="w-full bg-white rounded-xl border border-slate-200 p-5 hover:border-indigo-300 hover:shadow-md transition-all text-left group"
                                >
                                    <div className="flex items-center gap-2 mb-1">
                                        <Badge variant="outline" className={`text-[10px] px-2 py-0 ${result.categoryColor || 'text-slate-500'}`}>
                                            {result.categoryTitle}
                                        </Badge>
                                    </div>
                                    <h3 className="font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors">
                                        {result.title}
                                    </h3>
                                    <p className="text-sm text-slate-500 mt-1 line-clamp-2">{result.description}</p>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                            <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                            <p className="text-slate-500 mb-1">No results found for "{searchQuery}"</p>
                            <p className="text-sm text-slate-400">Try different keywords or browse the categories below</p>
                        </div>
                    )}
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                        {categories.map((category) => {
                            const Icon = category.icon;
                            return (
                                <button
                                    key={category.id}
                                    onClick={() => handleCategoryClick(category)}
                                    className={`${category.bgColor} rounded-xl border ${category.borderColor} p-5 hover:shadow-md transition-all text-left group`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={`w-10 h-10 rounded-xl bg-white/80 border ${category.borderColor} flex items-center justify-center flex-shrink-0 group-hover:shadow-sm transition-shadow`}>
                                            <Icon className={`w-5 h-5 ${category.color}`} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-slate-800 group-hover:text-slate-900 transition-colors mb-0.5">
                                                {category.title}
                                            </h3>
                                            <p className="text-xs text-slate-500 line-clamp-2">{category.description}</p>
                                            <span className="text-xs text-slate-400 mt-2 inline-flex items-center gap-1">
                                                {category.articles.length} {category.articles.length === 1 ? 'article' : 'articles'}
                                                <ChevronRight className="w-3 h-3" />
                                            </span>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-8">
                        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center">
                                    <HelpCircle className="w-5 h-5 text-purple-600" />
                                </div>
                                <div>
                                    <h2 className="font-semibold text-slate-800">Frequently Asked Questions</h2>
                                    <p className="text-xs text-slate-400">{faqItems.length} common questions answered</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setActiveView('faq')}
                                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1 transition-colors"
                            >
                                View all
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {faqItems.slice(0, 5).map((item, idx) => (
                                <div key={idx} className="overflow-hidden">
                                    <button
                                        onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                                        className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-slate-50/50 transition-colors"
                                        aria-expanded={expandedFaq === idx}
                                    >
                                        <span className="font-medium text-sm text-slate-700 pr-4">{item.question}</span>
                                        <ChevronDown className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform duration-200 ${expandedFaq === idx ? 'rotate-180' : ''}`} />
                                    </button>
                                    {expandedFaq === idx && (
                                        <div className="px-6 pb-4 pt-0">
                                            <p className="text-sm text-slate-500 leading-relaxed">{item.answer}</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-200 p-8 text-center">
                        <MessageSquare className="w-10 h-10 text-indigo-500 mx-auto mb-3" />
                        <h3 className="text-lg font-semibold text-slate-800 mb-1">Still have questions?</h3>
                        <p className="text-sm text-slate-500 mb-4">Our support team is here to help. Create a ticket and we will get back to you quickly.</p>
                        <Badge variant="outline" className="text-xs text-indigo-500 border-indigo-200">
                            Visit the Support tab to create a ticket
                        </Badge>
                    </div>
                </>
            )}
        </div>
    );
};
