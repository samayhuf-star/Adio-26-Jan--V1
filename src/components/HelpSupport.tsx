import React, { useState, useEffect, useRef } from 'react';
import { 
    Book, HelpCircle, MessageSquare, Search, ChevronRight, ChevronDown,
    Zap, BarChart3, CheckCircle2, AlertCircle, Target, FileText, Upload, Download, Settings, Image, X, Camera
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Badge } from './ui/badge';
import { supabase } from '../utils/supabase';


const documentationSections = [
    {
        id: 'getting-started',
        title: 'Getting Started',
        icon: Zap,
        articles: [
            {
                title: 'Welcome to Google Ads Dashboard',
                content: `Our platform helps you create professional Google Ads campaigns in minutes. This dashboard provides a comprehensive suite of tools including a 5-step Campaign Builder, Keyword Planner with AI-powered suggestions, CSV Export for bulk imports, and an Ad Creation interface supporting RSA (Responsive Search Ads), DKI (Dynamic Keyword Insertion), and Call-Only ads.`
            },
            {
                title: 'Quick Start Guide',
                content: `1. Navigate to "Builder 2.0" from the main menu
2. Choose your campaign structure (SKAG, STAG, or Mix)
3. Use the Keyword Planner to generate 100-1000 keywords
4. Select keywords for your campaign
5. Create ads using our templates
6. Configure geo-targeting
7. Review and export your campaign as CSV`
            },
            {
                title: 'System Requirements',
                content: `- Modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection for AI-powered features
- Screen resolution: 1280x720 or higher recommended
- JavaScript enabled`
            }
        ]
    },
    {
        id: 'campaign-builder',
        title: 'Builder 2.0',
        icon: Target,
        articles: [
            {
                title: '5-Step Campaign Builder Overview',
                content: `Builder 2.0 guides you through creating professional Google Ads campaigns in 5 simple steps:

**Step 1: Setup**
Configure your campaign structure (SKAG/STAG/Mix), geo segmentation, match types, and landing page URL.

**Step 2: Keywords**
Generate and select keywords using our AI-powered Keyword Planner. Select from 100-1000 generated keywords with checkbox selection.

**Step 3: Ads & Extensions**
Create Responsive Search Ads, DKI Ads, and Call-Only Ads with AI-generated text suggestions.

**Step 4: Geo Targeting**
Select target countries, states, cities, or ZIP codes for your campaign.

**Step 5: Review & Export**
Review your complete campaign configuration and export as CSV for Google Ads import.`
            },
            {
                title: 'Campaign Structures Explained',
                content: `**SKAG (Single Keyword Ad Group)**
Creates one ad group per keyword for maximum relevance and Quality Score. Best for highly targeted campaigns with specific keywords.

**STAG (Single Theme Ad Group)**
Groups related keywords into themed ad groups. Balances management efficiency with relevance.

**Mix (Hybrid Structure)**
Combines SKAG and STAG approaches based on keyword performance and search volume. Recommended for most campaigns.`
            },
            {
                title: 'Match Types Guide',
                content: `**Broad Match**
Keyword shows ads for searches that include misspellings, synonyms, related searches, and other variations. Format: keyword

**Phrase Match**
Ads show for searches that include the meaning of your keyword. Format: "keyword"

**Exact Match**
Ads show only for searches that have the same meaning or intent as the keyword. Format: [keyword]

**Best Practice**: Use all three match types for comprehensive coverage, with negative keywords to filter irrelevant traffic.`
            }
        ]
    },
    {
        id: 'keyword-planner',
        title: 'Keyword Planner',
        icon: Search,
        articles: [
            {
                title: 'Using the Keyword Planner',
                content: `The Keyword Planner uses AI (Google Gemini) to generate comprehensive keyword lists:

**How to Use:**
1. Enter 3-5 seed keywords (comma-separated)
2. Select target match types (Broad, Phrase, Exact)
3. Add negative keywords (one per line)
4. Click "Generate 100-300 Keywords"
5. Select keywords using checkboxes
6. Click "Continue to Ads" to proceed

**Features:**
- AI-powered keyword expansion
- Fallback generation when offline
- 100-300 keywords per generation
- Append mode for additional keywords
- Negative keyword filtering`
            },
            {
                title: 'Negative Keyword Strategy',
                content: `Negative keywords prevent your ads from showing for irrelevant searches:

**Best Practices:**
- Use the "Generate 500-1000" button for comprehensive coverage
- Include job-related terms: job, career, hiring, apply
- Filter informational queries: how to, what is, reviews
- Exclude competitor brands
- Block price-focused terms: cheap, discount, free
- Remove geographic terms if not relevant: near me, location

**Common Categories:**
- Jobs/Careers: job, career, hiring, apply, salary
- Information: how to, guide, tutorial, tips
- Reviews: review, rating, feedback, complaint
- Competitors: [competitor names]
- Price: cheap, free, discount, sale`
            },
            {
                title: 'Keyword Selection Tips',
                content: `**Selecting High-Quality Keywords:**
- Choose keywords with commercial intent
- Include brand terms for better conversion
- Select long-tail keywords for specific targeting
- Balance broad and specific terms
- Use "Select All" for quick selection
- Review and deselect irrelevant keywords

**Red Flags:**
- Overly generic keywords (high competition)
- Keywords containing negative intent
- Terms too far from your offering
- Extremely low search volume terms`
            }
        ]
    },
    {
        id: 'ad-creation',
        title: 'Ad Creation',
        icon: FileText,
        articles: [
            {
                title: 'Responsive Search Ads (RSA)',
                content: `RSAs automatically test different combinations of headlines and descriptions:

**Best Practices:**
- Create 8-15 unique headlines
- Write 2-4 descriptions
- Include keywords in headlines
- Add your unique value proposition
- Use calls-to-action (CTA)
- Pin important headlines to specific positions

**Character Limits:**
- Headlines: 30 characters each
- Descriptions: 90 characters each
- Display URL paths: 15 characters each

**Tips:**
- Use our AI text generator for suggestions
- Vary message angles across headlines
- Include price/offers when relevant
- Test emotional vs. rational appeals`
            },
            {
                title: 'Dynamic Keyword Insertion (DKI)',
                content: `DKI automatically inserts the user's search query into your ad:

**Format:** {Keyword:Default Text}

**Example:**
Headline: "Buy {Keyword:Running Shoes} Online"
If user searches "nike sneakers", ad shows: "Buy Nike Sneakers Online"
If keyword doesn't fit, shows: "Buy Running Shoes Online"

**Best Practices:**
- Always provide default text
- Ensure default text fits character limits
- Use title case for {Keyword:}
- Test with multiple keyword variations
- Review for grammatical sense

**When to Use:**
- Large keyword lists
- Product-specific campaigns
- E-commerce campaigns
- Location-based services`
            },
            {
                title: 'Call-Only Ads',
                content: `Call-Only ads show only on mobile devices and prompt users to call:

**Required Elements:**
- Business name
- Phone number
- 2 headlines (30 characters each)
- 2 descriptions (90 characters each)

**Best Practices:**
- Use "Call Now" or "Call Today" in headlines
- Mention 24/7 availability if applicable
- Highlight emergency services
- Include location if relevant
- Test different phone numbers
- Track calls with Google forwarding numbers

**Ideal For:**
- Emergency services
- Local services
- High-value consultations
- Appointment-based businesses
- Time-sensitive offers`
            }
        ]
    },
    {
        id: 'exporting',
        title: 'Exporting & Importing',
        icon: Download,
        articles: [
            {
                title: 'Exporting Campaigns',
                content: `**Export Options:**
1. **CSV Export**: Standard Google Ads import format
2. **Save Draft**: Save to history for later editing
3. **Copy to Clipboard**: Quick copy for spreadsheets

**CSV Export Process:**
1. Complete all campaign builder steps
2. Click "Export CSV" in Step 5
3. Choose file location
4. File downloads automatically

**What's Included:**
- All campaign settings
- Ad groups with keywords
- Ads with extensions
- Geo-targeting settings
- Negative keywords
- Match type formatting`
            },
            {
                title: 'Importing to Google Ads',
                content: `**Import Process:**
1. Log into Google Ads
2. Click Tools & Settings → Bulk Actions → Uploads
3. Select "Upload CSV file"
4. Choose your exported file
5. Review preview
6. Click "Apply"

**Tips:**
- Review preview carefully before applying
- Start with paused campaigns for testing
- Check budget settings after import
- Verify tracking parameters
- Test on small campaign first

**Common Import Issues:**
- Character encoding (use UTF-8)
- Missing required fields
- Invalid URL formats
- Duplicate keywords
- Budget not set`
            }
        ]
    },
    {
        id: 'ai-features',
        title: 'AI-Powered Features',
        icon: Zap,
        articles: [
            {
                title: 'AI Text Generation',
                content: `Our platform uses Google Gemini AI for intelligent text generation:

**Features:**
- Keyword expansion from seed keywords
- Ad headline suggestions
- Description copywriting
- Negative keyword recommendations
- Landing page analysis

**Fallback System:**
When AI is unavailable, the system automatically falls back to:
- Local keyword generation algorithms
- Template-based ad copy
- Pre-defined negative keyword lists
- No interruption to your workflow

**Network Messages:**
You may see "ℹ️ Backend unavailable - using local fallback generation" - this is normal and indicates the fallback system is working.`
            },
            {
                title: 'AI Best Practices',
                content: `**Getting Better AI Results:**
- Provide specific seed keywords
- Add industry context when possible
- Use negative keywords to refine
- Review and edit AI suggestions
- Combine AI suggestions with your expertise

**Limitations:**
- AI doesn't know your brand voice (review & edit)
- May generate generic terms (refine with negatives)
- Needs clear input (garbage in, garbage out)
- Best used as starting point, not final copy`
            }
        ]
    },
    {
        id: 'account',
        title: 'Account & Settings',
        icon: Settings,
        articles: [
            {
                title: 'Managing Your Account',
                content: `**Account Features:**
- Campaign history
- Saved drafts
- Export history
- User preferences

**Accessing History:**
1. Click "History" in navigation
2. View all saved campaigns
3. Load campaign to continue editing
4. Delete old campaigns

**Privacy & Data:**
- Campaigns saved to your account only
- Data encrypted in transit
- No sharing with third parties
- Delete data anytime`
            }
        ]
    }
];

const faqItems = [
    {
        question: "How do I create my first campaign?",
        answer: "Click 'Campaign Builder' in the navigation menu, then follow the 5-step wizard. Start by selecting your campaign structure (SKAG, STAG, or Mix), then generate keywords, create ads, set geo-targeting, and finally review and export your campaign."
    },
    {
        question: "What are SKAG, STAG, and Mix structures?",
        answer: "SKAG (Single Keyword Ad Group) creates one ad group per keyword for maximum relevance. STAG (Single Theme Ad Group) groups related keywords together. Mix combines both approaches based on your keywords. For most campaigns, we recommend Mix structure."
    },
    {
        question: "How does the AI keyword generation work?",
        answer: "We use Google's Gemini AI to expand your seed keywords into 100-300 relevant variations. Enter 3-5 core keywords, and the AI generates related terms, questions, locations, and modifiers. If AI is unavailable, we use a local fallback algorithm so you're never blocked."
    },
    {
        question: "Can I generate negative keywords automatically?",
        answer: "Yes! In the Keyword Planner, click the 'Generate 500-1000' button next to the Negative Keywords field. This generates a comprehensive list of 500-1000 common negative keywords covering jobs, reviews, informational queries, and more."
    },
    {
        question: "What's the difference between Broad, Phrase, and Exact match?",
        answer: "Broad match (keyword) shows ads for related searches including synonyms. Phrase match (\"keyword\") shows ads for searches containing the keyword phrase. Exact match ([keyword]) shows ads only for that specific keyword or close variants. Use all three with negative keywords for best results."
    },
    {
        question: "How do I select keywords for my campaign?",
        answer: "After generating keywords in Step 2, click on individual keywords to select them, or use 'Select All' to choose all generated keywords. Selected keywords are highlighted in indigo. You must select at least one keyword to proceed to the next step."
    },
    {
        question: "What are Responsive Search Ads (RSA)?",
        answer: "RSAs allow you to provide multiple headlines and descriptions. Google automatically tests different combinations to find the best performing ads. You can create up to 15 headlines and 4 descriptions, and Google will show the most effective combinations to each user."
    },
    {
        question: "How does Dynamic Keyword Insertion (DKI) work?",
        answer: "DKI inserts the user's search query into your ad using the format {Keyword:Default Text}. For example, if your ad says 'Buy {Keyword:Shoes} Online' and someone searches 'running sneakers', the ad shows 'Buy Running Sneakers Online'. Always provide default text in case the query doesn't fit."
    },
    {
        question: "When should I use Call-Only ads?",
        answer: "Use Call-Only ads for mobile-only campaigns where phone calls are your primary goal. They're ideal for emergency services, local businesses, appointment-based services, and high-value consultations. The ad only shows a phone number and prompts users to call directly."
    },
    {
        question: "How do I export my campaign to Google Ads?",
        answer: "Complete all 5 steps in the Campaign Builder, then click 'Export CSV' in Step 5 (Review). The campaign downloads as a CSV file. In Google Ads, go to Tools & Settings → Bulk Actions → Uploads, select your CSV file, review the preview, and click Apply."
    },
    {
        question: "Can I save my campaign and continue later?",
        answer: "Yes! Click 'Save Draft' in Step 5 to save your campaign to history. Access it anytime from the History menu to continue editing or export again."
    },
    {
        question: "What do I do if I see 'Backend unavailable' messages?",
        answer: "This is normal! It means the AI service is temporarily unavailable, and the system is using local fallback generation. Your workflow continues uninterrupted with slightly different keyword suggestions. The quality is still excellent for most use cases."
    },
    {
        question: "How many keywords should I generate?",
        answer: "Start with 100-300 keywords for most campaigns. You can click 'Append More Keywords' to generate additional keywords if needed. Too many keywords can make campaign management difficult, so focus on quality over quantity."
    },
    {
        question: "Can I edit keywords after generation?",
        answer: "Generated keywords cannot be edited individually in the tool. Instead, export your campaign CSV and edit keywords in Excel/Google Sheets before importing to Google Ads. Alternatively, regenerate keywords with different seeds and negative keywords."
    },
    {
        question: "What character limits apply to ads?",
        answer: "RSA Headlines: 30 characters each (up to 15). RSA Descriptions: 90 characters each (up to 4). Display URL paths: 15 characters each. Call-Only ads have the same limits. The platform automatically validates these limits."
    },
    {
        question: "How do I export my campaign to CSV?",
        answer: "Use the CSV Export tool from the main menu. After building your campaign, you can export it directly to Google Ads Editor format. The export includes all campaign settings, ad groups, keywords, ads, and targeting information."
    },
    {
        question: "Can I target specific locations?",
        answer: "Yes! In Step 4 (Geo Targeting), select your target country and choose targeting by states, cities, or ZIP codes. You can enter specific locations manually or use preset ZIP code lists for major metros."
    },
    {
        question: "What file formats are supported for export?",
        answer: "We export in CSV (Comma-Separated Values) format, which is the standard format for Google Ads bulk uploads. The CSV is UTF-8 encoded and follows Google Ads' import specifications."
    },
    {
        question: "Is my campaign data secure?",
        answer: "Yes! All data is encrypted in transit and stored securely in your account only. We never share your campaign data with third parties. You can delete your campaigns from history at any time."
    },
    {
        question: "How does the AI integration work?",
        answer: "The platform handles all AI integrations behind the scenes. All AI-powered features like keyword generation and ad creation work automatically without requiring any API keys from users."
    }
];

export const HelpSupport = () => {
    const [activeTab, setActiveTab] = useState('documentation');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedArticle, setSelectedArticle] = useState<any>(null);
    const [showArticleDialog, setShowArticleDialog] = useState(false);
    const [viewMode, setViewMode] = useState<'list' | 'article'>('list');
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [articleImages, setArticleImages] = useState<Record<string, Array<{id: string, imageData: string, imageOrder: number}>>>({});
    const [uploadingImage, setUploadingImage] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const SUPER_ADMIN_EMAIL = 'samayhuf@gmail.com';
    const MAX_IMAGES_PER_ARTICLE = 5;

    useEffect(() => {
        const loadUserAndImages = async () => {
            const { getCurrentUser } = await import('../utils/pocketbase/auth');
            const user = getCurrentUser();
            setUserEmail(user?.email || null);
            
            try {
                const response = await fetch('/api/docs/all-images');
                if (response.ok) {
                    const result = await response.json();
                    setArticleImages(result.data?.images || {});
                }
            } catch (error) {
                console.error('Failed to load doc images:', error);
            }
        };
        loadUserAndImages();
    }, []);

    const getArticleKey = () => {
        if (!selectedArticle) return '';
        return `${selectedArticle.sectionTitle}-${selectedArticle.title}`.replace(/\s+/g, '-').toLowerCase();
    };

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !selectedArticle) return;

        const articleKey = getArticleKey();
        const currentImages = articleImages[articleKey] || [];
        
        if (currentImages.length >= MAX_IMAGES_PER_ARTICLE) {
            alert(`Maximum ${MAX_IMAGES_PER_ARTICLE} images per article reached`);
            return;
        }

        setUploadingImage(true);
        const reader = new FileReader();
        reader.onload = async (e) => {
            const base64 = e.target?.result as string;
            
            try {
                const response = await fetch('/api/docs/images', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        articleKey,
                        imageData: base64,
                        imageOrder: currentImages.length
                    })
                });
                
                if (response.ok) {
                    const result = await response.json();
                    const newImage = { id: result.data.id, imageData: base64, imageOrder: currentImages.length };
                    setArticleImages(prev => ({
                        ...prev,
                        [articleKey]: [...(prev[articleKey] || []), newImage]
                    }));
                } else {
                    const error = await response.json();
                    alert(error.error || 'Failed to upload image');
                }
            } catch (error) {
                console.error('Upload failed:', error);
                alert('Failed to upload image');
            } finally {
                setUploadingImage(false);
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            }
        };
        reader.readAsDataURL(file);
    };

    const handleRemoveImage = async (imageId: string) => {
        if (!selectedArticle) return;
        
        try {
            const response = await fetch(`/api/docs/images/${imageId}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                const articleKey = getArticleKey();
                setArticleImages(prev => ({
                    ...prev,
                    [articleKey]: (prev[articleKey] || []).filter(img => img.id !== imageId)
                }));
            }
        } catch (error) {
            console.error('Delete failed:', error);
        }
    };

    const getArticleImages = (): Array<{id: string, imageData: string, imageOrder: number}> => {
        if (!selectedArticle) return [];
        const articleKey = getArticleKey();
        return articleImages[articleKey] || [];
    };

    const canUploadImages = userEmail === SUPER_ADMIN_EMAIL;

    const handleSearchFilter = (item: any) => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            item.title?.toLowerCase().includes(query) ||
            item.content?.toLowerCase().includes(query) ||
            item.question?.toLowerCase().includes(query) ||
            item.answer?.toLowerCase().includes(query)
        );
    };

    const filteredDocs = documentationSections.map(section => ({
        ...section,
        articles: section.articles.filter(handleSearchFilter)
    })).filter(section => section.articles.length > 0);

    const filteredFAQs = faqItems.filter(handleSearchFilter);

    // If viewing an article, show full detailed view
    if (viewMode === 'article' && selectedArticle) {
        const SectionIcon = selectedArticle.sectionIcon || Book;
        
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
                <div className="max-w-5xl mx-auto">
                    {/* Back Button */}
                    <Button
                        variant="ghost"
                        onClick={() => setViewMode('list')}
                        className="mb-6 gap-2 hover:bg-indigo-50"
                    >
                        <ChevronDown className="w-4 h-4 rotate-90" />
                        Back to Documentation
                    </Button>

                    {/* Article Header */}
                    <Card className="mb-6 border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50">
                        <CardHeader>
                            <div className="flex items-center gap-3 text-indigo-600 mb-2">
                                <SectionIcon className="w-5 h-5" />
                                <span className="text-sm font-semibold uppercase tracking-wide">
                                    {selectedArticle.sectionTitle}
                                </span>
                            </div>
                            <CardTitle className="text-3xl mb-2">{selectedArticle.title}</CardTitle>
                            <CardDescription className="text-base">
                                Complete guide with step-by-step instructions
                            </CardDescription>
                        </CardHeader>
                    </Card>

                    {/* Article Content */}
                    <Card className="border-slate-200 shadow-xl">
                        <CardContent className="p-8">
                            <div className="prose prose-slate prose-lg max-w-none">
                                <div className="whitespace-pre-wrap text-slate-700 leading-relaxed space-y-4">
                                    {selectedArticle.content.split('\n\n').map((paragraph: string, idx: number) => (
                                        <div key={idx} className="mb-4">
                                            {paragraph.startsWith('**') ? (
                                                <h3 className="text-lg font-normal text-slate-700 mb-3 flex items-center gap-2">
                                                    <div className="w-1.5 h-6 bg-indigo-500 rounded-full"></div>
                                                    {paragraph.replace(/\*\*/g, '')}
                                                </h3>
                                            ) : paragraph.includes('**') ? (
                                                <p className="text-slate-700 leading-relaxed">
                                                    {paragraph.split('**').map((part, i) => 
                                                        i % 2 === 0 ? part : <span key={i} className="text-slate-700 font-normal">{part}</span>
                                                    )}
                                                </p>
                                            ) : paragraph.startsWith('-') || paragraph.match(/^\d\./) ? (
                                                <ul className="space-y-2 ml-4">
                                                    {paragraph.split('\n').filter(line => line.trim()).map((line, i) => (
                                                        <li key={i} className="flex items-start gap-3 text-slate-700">
                                                            <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                                                            <span>{line.replace(/^[-\d.]\s*/, '')}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <p className="text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-200">
                                                    {paragraph}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {/* Visual Example Section */}
                                <div className="mt-8 p-8 bg-gradient-to-br from-slate-100 to-blue-100 rounded-xl border-2 border-indigo-200">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-indigo-600 rounded-lg p-2">
                                                <AlertCircle className="w-5 h-5 text-white" />
                                            </div>
                                            <h4 className="font-normal text-slate-700 text-base">Visual Example</h4>
                                        </div>
                                        {canUploadImages && getArticleImages().length < MAX_IMAGES_PER_ARTICLE && (
                                            <div className="flex items-center gap-2">
                                                <input
                                                    ref={fileInputRef}
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleImageUpload}
                                                    className="hidden"
                                                />
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => fileInputRef.current?.click()}
                                                    disabled={uploadingImage}
                                                    className="gap-2 bg-white hover:bg-indigo-50 border-indigo-300"
                                                >
                                                    <Camera className="w-4 h-4" />
                                                    {uploadingImage ? 'Uploading...' : `Add Image (${getArticleImages().length}/${MAX_IMAGES_PER_ARTICLE})`}
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                    <div className="bg-white rounded-lg border-2 border-slate-300 p-6 mb-4">
                                        {getArticleImages().length > 0 ? (
                                            <div className="space-y-4">
                                                {getArticleImages().map((img, idx) => (
                                                    <div key={img.id} className="relative rounded-lg overflow-hidden group">
                                                        <img 
                                                            src={img.imageData} 
                                                            alt={`Visual guide ${idx + 1} for ${selectedArticle.title}`}
                                                            className="w-full h-auto rounded-lg"
                                                        />
                                                        {canUploadImages && (
                                                            <button
                                                                onClick={() => handleRemoveImage(img.id)}
                                                                className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                        {getArticleImages().length > 1 && (
                                                            <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                                                                {idx + 1} / {getArticleImages().length}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                                {canUploadImages && getArticleImages().length < MAX_IMAGES_PER_ARTICLE && (
                                                    <p className="text-xs text-slate-500 text-center">
                                                        {getArticleImages().length} of {MAX_IMAGES_PER_ARTICLE} images uploaded
                                                    </p>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="aspect-video bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg flex items-center justify-center border border-slate-200">
                                                <div className="text-center">
                                                    <BarChart3 className="w-16 h-16 text-indigo-400 mx-auto mb-3" />
                                                    <p className="text-slate-500 font-medium">Screenshot Placeholder</p>
                                                    <p className="text-xs text-slate-400 mt-1">Visual guide for {selectedArticle.title}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-sm text-slate-600 leading-relaxed">
                                        📸 <span className="font-normal">Pro Tip:</span> Follow the steps above while looking at your dashboard. 
                                        The interface is intuitive and guides you through each action.
                                    </p>
                                </div>

                                {/* Quick Tips Box */}
                                <div className="mt-8 p-6 bg-indigo-50 rounded-xl border-2 border-indigo-200">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Zap className="w-5 h-5 text-indigo-600" />
                                        <h4 className="font-normal text-emerald-800">Quick Tips</h4>
                                    </div>
                                    <ul className="space-y-2 text-sm text-emerald-800">
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                            Take your time to explore each feature as you go
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                            Use the search bar if you need to find specific tools quickly
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                            Check the FAQ section if you have additional questions
                                        </li>
                                    </ul>
                                </div>

                                {/* Related Articles */}
                                <div className="mt-8 p-6 bg-blue-50 rounded-xl border-2 border-blue-200">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Book className="w-5 h-5 text-blue-600" />
                                        <h4 className="font-normal text-blue-800">Related Documentation</h4>
                                    </div>
                                    <p className="text-sm text-blue-700 mb-3">
                                        Continue learning with these related topics:
                                    </p>
                                    <div className="grid gap-2">
                                        <Button
                                            variant="outline"
                                            className="justify-start text-left hover:bg-blue-100 border-blue-300"
                                            onClick={() => setViewMode('list')}
                                        >
                                            <ChevronRight className="w-4 h-4 mr-2" />
                                            View All Documentation
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="justify-start text-left hover:bg-blue-100 border-blue-300"
                                            onClick={() => { setViewMode('list'); setActiveTab('faq'); }}
                                        >
                                            <HelpCircle className="w-4 h-4 mr-2" />
                                            Browse FAQ
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Bottom Actions */}
                    <div className="mt-6 flex justify-between items-center">
                        <Button
                            variant="outline"
                            onClick={() => setViewMode('list')}
                            className="gap-2"
                        >
                            <ChevronDown className="w-4 h-4 rotate-90" />
                            Back to Documentation
                        </Button>
                        <Button
                            onClick={() => { setViewMode('list'); setActiveTab('support'); }}
                            className="bg-indigo-600 hover:bg-indigo-700 gap-2"
                        >
                            <MessageSquare className="w-4 h-4" />
                            Still Need Help?
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                        Help & Support Center
                    </h1>
                    <p className="text-slate-600">
                        Everything you need to master the Google Ads Dashboard
                    </p>
                </div>

                {/* Search Bar */}
                <div className="mb-8">
                    <div className="relative max-w-2xl">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 z-10" />
                        <Input
                            placeholder="Search documentation, FAQs, or get help..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-12 pr-4 py-6 text-lg bg-white border-slate-300 shadow-lg"
                        />
                    </div>
                </div>

                {/* Main Content */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList className="grid w-full max-w-md grid-cols-2 h-12">
                        <TabsTrigger value="documentation" className="flex items-center gap-2">
                            <Book className="w-4 h-4" />
                            Documentation
                        </TabsTrigger>
                        <TabsTrigger value="faq" className="flex items-center gap-2">
                            <HelpCircle className="w-4 h-4" />
                            FAQ
                        </TabsTrigger>
                    </TabsList>

                    {/* Documentation Tab */}
                    <TabsContent value="documentation" className="space-y-6">
                        {filteredDocs.length === 0 && searchQuery && (
                            <Card>
                                <CardContent className="py-12 text-center">
                                    <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                                    <p className="text-slate-600">No documentation found for "{searchQuery}"</p>
                                </CardContent>
                            </Card>
                        )}
                        
                        {filteredDocs.map((section) => (
                            <Card key={section.id} className="border-slate-200 shadow-lg">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-3 text-2xl">
                                        <section.icon className="w-6 h-6 text-indigo-600" />
                                        {section.title}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid gap-4">
                                        {section.articles.map((article, idx) => (
                                            <div
                                                key={idx}
                                                onClick={() => {
                                                    setSelectedArticle({ ...article, sectionTitle: section.title, sectionIcon: section.icon });
                                                    setViewMode('article');
                                                }}
                                                className="p-4 border border-slate-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50/50 cursor-pointer transition-all group"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <h3 className="font-normal text-slate-700 group-hover:text-indigo-600">
                                                        {article.title}
                                                    </h3>
                                                    <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-600" />
                                                </div>
                                                <p className="text-sm text-slate-600 mt-1 line-clamp-2">
                                                    {article.content.substring(0, 150)}...
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </TabsContent>

                    {/* FAQ Tab */}
                    <TabsContent value="faq">
                        <Card className="border-slate-200 shadow-lg">
                            <CardHeader>
                                <CardTitle className="text-2xl">Frequently Asked Questions</CardTitle>
                                <CardDescription>
                                    Quick answers to common questions about the platform
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {filteredFAQs.length === 0 && searchQuery ? (
                                    <div className="py-12 text-center">
                                        <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                                        <p className="text-slate-600">No FAQs found for "{searchQuery}"</p>
                                    </div>
                                ) : (
                                    <Accordion type="single" collapsible className="w-full">
                                        {filteredFAQs.map((item, idx) => (
                                            <AccordionItem key={idx} value={`faq-${idx}`}>
                                                <AccordionTrigger className="text-left hover:text-indigo-600">
                                                    {item.question}
                                                </AccordionTrigger>
                                                <AccordionContent className="text-slate-600 whitespace-pre-wrap">
                                                    {item.answer}
                                                </AccordionContent>
                                            </AccordionItem>
                                        ))}
                                    </Accordion>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                </Tabs>
            </div>
        </div>
    );
};
