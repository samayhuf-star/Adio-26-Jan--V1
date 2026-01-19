import React, { useState, useEffect } from 'react';
import { useAuthCompat } from '../utils/authCompat';
import { Sparkles, Copy, Save, AlertCircle, Download, Trash2, FileDown, ArrowRight, Lightbulb, Plus, Link, TrendingUp, DollarSign, BarChart3, RefreshCw, Globe, Target, Zap, Building, Phone, Mail, MapPin, FileText, CheckCircle2, FolderOpen } from 'lucide-react';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { TerminalCard, TerminalLine } from './ui/terminal-card';
import { generateKeywords as generateKeywordsFromGoogleAds } from '../utils/api/googleAds';
import { getKeywordIdeas, getKeywordMetrics, KeywordMetrics } from '../utils/keywordPlannerApi';
import { historyService } from '../utils/historyService';
// Removed Supabase info import - using PocketBase instead
import { copyToClipboard } from '../utils/clipboard';
import { notifications } from '../utils/notifications';
import { DEFAULT_SEED_KEYWORDS, DEFAULT_NEGATIVE_KEYWORDS as DEFAULT_NEG_KW } from '../utils/defaultExamples';
import { generateSeedKeywordSuggestions } from '../utils/seedKeywordSuggestions';
import { extractLandingPageContent } from '../utils/campaignIntelligence/landingPageExtractor';
import { generateTemplateKeywords, serviceTermsByIndustry } from '../utils/templateKeywordGenerator';
import { mapGoalToIntent } from '../utils/campaignIntelligence/intentClassifier';
import { KeywordFilters, KeywordFiltersState, DEFAULT_FILTERS, getDifficultyBadge, formatSearchVolume, formatCPC } from './KeywordFilters';
import { TerminalProgressConsole, KEYWORD_PLANNER_MESSAGES } from './TerminalProgressConsole';
import { TerminalResultsConsole, ResultStat } from './TerminalResultsConsole';
import { ProjectTagSelector } from './ProjectTagSelector';

// Inline vertical detection (same logic as Campaign Builder)
function detectVertical(url: string, pageText: string): string {
    const combined = (url + ' ' + pageText).toLowerCase();
    
    // Check service industries FIRST with broad patterns
    const serviceIndustries: [string, string[]][] = [
        ['travel', ['travel', 'flight', 'flights', 'airline', 'airfare', 'booking', 'hotel', 'vacation', 'trip', 'destination', 'cruise', 'resort', 'ticket', 'tickets', 'onetravel', 'cheapoair', 'expedia', 'kayak', 'priceline', 'orbitz', 'travelocity']],
        ['plumbing', ['plumber', 'plumbing', 'drain', 'pipe', 'water heater', 'leak', 'sewer']],
        ['hvac', ['hvac', 'heating', 'cooling', 'air conditioning', 'furnace', 'ac repair']],
        ['electrical', ['electrician', 'electrical', 'wiring', 'circuit', 'outlet']],
        ['roofing', ['roofing', 'roof repair', 'shingle', 'gutter']],
        ['legal', ['attorney', 'lawyer', 'law firm', 'legal']],
        ['medical', ['doctor', 'physician', 'healthcare', 'clinic', 'hospital', 'medical']],
        ['dental', ['dentist', 'dental', 'orthodont']],
        ['automotive', ['auto repair', 'mechanic', 'car repair', 'tire']],
        ['restaurant', ['restaurant', 'dining', 'catering', 'menu']],
        ['real_estate', ['real estate', 'realtor', 'property', 'homes for sale']],
        ['fitness', ['gym', 'fitness', 'personal trainer', 'workout']],
        ['beauty', ['salon', 'spa', 'beauty', 'hair', 'nail']],
        ['cleaning', ['cleaning', 'maid', 'janitorial', 'housekeeping']],
        ['landscaping', ['landscaping', 'lawn care', 'garden', 'tree service']],
        ['pest_control', ['pest control', 'exterminator', 'termite', 'rodent']],
        ['moving', ['moving', 'movers', 'relocation', 'packing']],
        ['photography', ['photographer', 'photography', 'photo studio']],
        ['ecommerce', ['shop', 'store', 'ecommerce', 'buy online']]
    ];
    
    for (const [vertical, patterns] of serviceIndustries) {
        if (patterns.some(p => combined.includes(p))) {
            return vertical;
        }
    }
    
    // Marketing/Advertising - require SPECIFIC multi-word patterns (checked AFTER service industries)
    const marketingPatterns = [
        'google ads', 'adwords', 'ppc', 'campaign builder', 'ad campaign',
        'keyword planner', 'ads automation', 'advertising platform', 'ad management',
        'seo agency', 'digital marketing agency', 'media buying', 'campaign management'
    ];
    if (marketingPatterns.some(p => combined.includes(p))) {
        return 'marketing';
    }
    
    // Software/SaaS - require SPECIFIC tech terms (checked AFTER service industries)
    const softwarePatterns = [
        'saas', 'software as a service', 'cloud software', 'b2b software',
        'api integration', 'enterprise software', 'automation software',
        'workflow automation', 'crm software', 'erp system'
    ];
    if (softwarePatterns.some(p => combined.includes(p))) {
        return 'software';
    }
    
    return 'general';
}

// Inline CTA detection
function detectCTA(pageText: string): string {
    const text = pageText.toLowerCase();
    if (/call\s*(us|now|today)/i.test(text) || /phone/i.test(text)) return 'Call';
    if (/book\s*(now|online|appointment)/i.test(text)) return 'Book';
    if (/schedule/i.test(text)) return 'Schedule';
    if (/get\s*(quote|estimate|started)/i.test(text)) return 'Get Quote';
    if (/contact\s*(us)?/i.test(text)) return 'Contact';
    if (/buy|purchase|order/i.test(text)) return 'Buy Now';
    if (/sign\s*up|register/i.test(text)) return 'Sign Up';
    if (/learn\s*more/i.test(text)) return 'Learn More';
    return 'Contact';
}

interface UrlAnalysisResult {
    domain: string;
    title: string | null;
    metaDescription: string | null;
    h1: string | null;
    services: string[];
    phones: string[];
    emails: string[];
    addresses: string[];
    vertical: string;
    cta: string;
    intent: {
        id: string;
        label: string;
        confidence: number;
    };
    suggestedKeywords: string[];
}

interface SavedList {
    id: string;
    name: string;
    seedKeywords: string;
    negativeKeywords: string;
    generatedKeywords: string[];
    matchTypes: { broad: boolean; phrase: boolean; exact: boolean };
    createdAt: string;
}

// Default negative keywords list
const DEFAULT_NEGATIVE_KEYWORDS = [
    'cheap',
    'discount',
    'reviews',
    'job',
    'headquater',
    'apply',
    'free',
    'best',
    'company',
    'information',
    'when',
    'why',
    'where',
    'how',
    'career',
    'hiring',
    'scam',
    'feedback'
].join('\n');

type KeywordPlannerFillPreset = {
    seeds: string[];
    negatives: string[];
    matchTypes?: {
        broad: boolean;
        phrase: boolean;
        exact: boolean;
    };
};

const KEYWORD_PLANNER_FILL_INFO: KeywordPlannerFillPreset[] = [
    {
        seeds: [
            'airline cancellation help',
            'flight credit assistance',
            'speak to airline agent',
            '24/7 airline hotline',
            'upgrade my flight'
        ],
        negatives: ['jobs', 'salary', 'complaint', 'cheap', 'diy', 'review', 'reddit', 'wiki', 'map'],
        matchTypes: { broad: true, phrase: true, exact: true }
    },
    {
        seeds: [
            'emergency plumber',
            'water heater repair',
            'slab leak detection',
            'licensed plumbing company',
            'same day plumber'
        ],
        negatives: ['training', 'course', 'manual', 'parts', 'supplies', 'job', 'free', 'discount', 'review'],
        matchTypes: { broad: true, phrase: false, exact: true }
    },
    {
        seeds: [
            'b2b saas security',
            'zero trust platform',
            'managed soc service',
            'cloud compliance audit',
            'endpoint hardening'
        ],
        negatives: ['open source', 'github', 'template', 'internship', 'career', 'cheap', 'free download', 'wikipedia'],
        matchTypes: { broad: false, phrase: true, exact: true }
    }
];

const pickRandomPreset = <T,>(items: T[]): T => {
    return items[Math.floor(Math.random() * items.length)];
};

const formatSeeds = (seeds: string[]) => {
    if (seeds.length === 0) return '';
    const shuffled = [...seeds].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(5, shuffled.length)).join(', ');
};

const formatNegatives = (negatives: string[]) => {
    if (negatives.length === 0) return '';
    const shuffled = [...negatives].sort(() => Math.random() - 0.5);
    const count = Math.min(15, shuffled.length);
    return shuffled.slice(0, count).join('\n');
};

function normalizeListInput(value: string): string[] {
    if (!value) {
        return [];
    }
    return value
        .split(/[\n\r,]+/)
        .map(entry => entry.trim())
        .filter(Boolean);
}

interface EnrichedKeyword {
    text: string;
    matchType: 'broad' | 'phrase' | 'exact';
    metrics?: KeywordMetrics;
}

export const KeywordPlanner = ({ initialData }: { initialData?: any }) => {
    const { getToken } = useAuthCompat();
    const [seedKeywords, setSeedKeywords] = useState('');
    const [urlInput, setUrlInput] = useState('');
    const [suggestedKeywords, setSuggestedKeywords] = useState<string[]>([]);
    const [negativeKeywords, setNegativeKeywords] = useState(DEFAULT_NEGATIVE_KEYWORDS);
    const [generatedKeywords, setGeneratedKeywords] = useState<string[]>([]);
    const [enrichedKeywords, setEnrichedKeywords] = useState<EnrichedKeyword[]>([]);
    const [keywordMetricsMap, setKeywordMetricsMap] = useState<Map<string, KeywordMetrics>>(new Map());
    const [isGenerating, setIsGenerating] = useState(false);
    const [isGeneratingSeedFromUrl, setIsGeneratingSeedFromUrl] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [apiStatus, setApiStatus] = useState<'unknown' | 'ok' | 'error'>('unknown');
    const [dataSource, setDataSource] = useState<'google_ads_api' | 'fallback' | 'local'>('local');
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [listName, setListName] = useState('');
    const [savedLists, setSavedLists] = useState<SavedList[]>([]);
    const [activeTab, setActiveTab] = useState('planner');
    const [googleAdsCustomerId, setGoogleAdsCustomerId] = useState<string | null>(null);
    const [showMetrics, setShowMetrics] = useState(true);
    const [urlAnalysis, setUrlAnalysis] = useState<UrlAnalysisResult | null>(null);
    const [analysisLogs, setAnalysisLogs] = useState<string[]>([]);
    
    // Match types - all selected by default
    const [matchTypes, setMatchTypes] = useState({
        broad: true,
        phrase: true,
        exact: true
    });
    
    // Country and Device filters - default to USA and Mobile
    const [filters, setFilters] = useState<KeywordFiltersState>(DEFAULT_FILTERS);
    
    // Terminal console state
    const [showTerminalConsole, setShowTerminalConsole] = useState(false);
    const [terminalComplete, setTerminalComplete] = useState(false);
    const [showResultsConsole, setShowResultsConsole] = useState(false);

    // Fetch Google Ads customer ID on mount
    useEffect(() => {
        const fetchGoogleAdsAccount = async () => {
            try {
                const response = await fetch('/api/google-ads/accounts');
                if (response.ok) {
                    const data = await response.json();
                    if (data.accounts && data.accounts.length > 0) {
                        setGoogleAdsCustomerId(data.accounts[0]);
                    }
                }
            } catch (error) {
                console.log('Google Ads accounts not available');
            }
        };
        fetchGoogleAdsAccount();
    }, []);

    const handleFillInfo = () => {
        const preset = pickRandomPreset(KEYWORD_PLANNER_FILL_INFO);
        if (!preset) return;

        setSeedKeywords(formatSeeds(preset.seeds));
        setNegativeKeywords(formatNegatives(preset.negatives));
        setMatchTypes(preset.matchTypes || { broad: true, phrase: true, exact: true });
    };

    const applySuggestedKeyword = (keyword: string) => {
        const current = seedKeywords.trim();
        const newKeywords = current ? `${current}, ${keyword}` : keyword;
        setSeedKeywords(newKeywords);
        notifications.success(`Added "${keyword}" to seed keywords`, {
            title: 'Keyword Added'
        });
    };

    useEffect(() => {
        if (initialData) {
            const seeds = initialData.seedKeywords;
            if (Array.isArray(seeds)) {
                setSeedKeywords(seeds.join(', '));
            } else if (typeof seeds === 'string') {
                setSeedKeywords(seeds);
            } else {
                setSeedKeywords('');
            }
            const negatives = initialData.negativeKeywords;
            if (Array.isArray(negatives)) {
                setNegativeKeywords(negatives.join('\n'));
            } else if (typeof negatives === 'string') {
                setNegativeKeywords(negatives);
            } else {
                setNegativeKeywords(DEFAULT_NEGATIVE_KEYWORDS);
            }
            setGeneratedKeywords(initialData.generatedKeywords || []);
            setMatchTypes(initialData.matchTypes || { broad: true, phrase: true, exact: true });

            // Auto-generate seed keyword suggestions if no seeds provided
            if (!seeds || (Array.isArray(seeds) && seeds.length === 0) || (typeof seeds === 'string' && !seeds.trim())) {
                const suggestions = generateSeedKeywordSuggestions(
                    initialData.urlAnalysis,
                    initialData.intent,
                    initialData.campaignStructure,
                    initialData.url
                );
                setSuggestedKeywords(suggestions);
                
                if (suggestions.length > 0) {
                    notifications.success(`${suggestions.length} keyword suggestions generated from your URL!`, {
                        title: 'Keywords Ready',
                        description: 'Click any suggestion to add it to your seed keywords'
                    });
                }
            }
        }
    }, [initialData]);

    // Generate seed keywords from URL using full Web Analyzer (same as Campaign Builder)
    const handleGenerateSeedsFromUrl = async () => {
        if (!urlInput.trim()) {
            notifications.warning('Please enter a URL', { title: 'URL Required' });
            return;
        }

        setIsGeneratingSeedFromUrl(true);
        setUrlAnalysis(null);
        setAnalysisLogs([]);
        
        const addLog = (message: string) => {
            setAnalysisLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
        };

        try {
            let url = urlInput.trim();
            // Add https:// if missing
            if (!url.startsWith('http://') && !url.startsWith('https://')) {
                url = 'https://' + url;
            }
            addLog(`🔍 Starting analysis of: ${url}`);
            
            // Step 1: Extract landing page content using server-side API (comprehensive extraction)
            addLog('📄 Fetching landing page content via server...');
            let pageData: any = null;
            
            try {
                // Use the server-side comprehensive page analyzer
                const apiResponse = await fetch('/api/analyze-url', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url, extractionDepth: 'comprehensive' })
                });
                
                if (apiResponse.ok) {
                    const apiData = await apiResponse.json();
                    pageData = {
                        domain: new URL(url).hostname.replace('www.', ''),
                        title: apiData.seoSignals?.title || null,
                        h1: apiData.headings?.find((h: any) => h.level === 'h1')?.text || null,
                        metaDescription: apiData.seoSignals?.metaDescription || null,
                        services: apiData.services || [],
                        phones: apiData.contactInfo?.phones || [],
                        emails: apiData.contactInfo?.emails || [],
                        addresses: apiData.contactInfo?.addresses || [],
                        page_text_tokens: apiData.mainContent?.split(' ').slice(0, 100) || [],
                        ctaElements: apiData.ctaElements || [],
                        navigation: apiData.navigation || [],
                        aiInsights: apiData.aiInsights || null
                    };
                    addLog(`✅ Server extraction successful`);
                }
            } catch (serverErr) {
                addLog(`⚠️ Server extraction failed, trying client-side...`);
            }
            
            // Fallback to client-side extraction if server fails
            if (!pageData || !pageData.title) {
                pageData = await extractLandingPageContent(url, { timeout: 15000 });
            }
            
            addLog(`✅ Page extracted: ${pageData.title || pageData.domain}`);
            
            // Step 2: Detect vertical/industry
            addLog('🏢 Detecting business vertical...');
            const pageText = [
                pageData.title || '',
                pageData.h1 || '',
                pageData.metaDescription || '',
                ...(pageData.services || []),
                ...(pageData.page_text_tokens || [])
            ].join(' ');
            const vertical = detectVertical(url, pageText);
            addLog(`✅ Vertical detected: ${vertical}`);
            
            // Step 3: Detect CTA
            addLog('🎯 Detecting call-to-action...');
            const cta = detectCTA(pageText);
            addLog(`✅ CTA detected: ${cta}`);
            
            // Step 4: Classify intent
            addLog('💡 Classifying user intent...');
            const landingExtraction = {
                domain: pageData.domain || '',
                url: url,
                title: pageData.title,
                tokens: pageData.page_text_tokens || [],
                phones: pageData.phones || [],
                services: pageData.services || [],
                emails: pageData.emails || [],
                addresses: pageData.addresses || []
            };
            const intentResult = mapGoalToIntent(
                `Get more customers for ${vertical} business`,
                landingExtraction as any,
                pageData.phones?.[0]
            );
            addLog(`✅ Intent: ${intentResult.intentId} (${Math.round(intentResult.confidence * 100)}% confidence)`);
            
            // Step 5: Generate keywords
            addLog('🔑 Generating seed keywords...');
            
            // Use vertical-specific primary service for better keyword generation
            let primaryService = pageData.services?.[0] || vertical || pageData.domain?.split('.')[0] || 'service';
            let specificServices = pageData.services?.slice(0, 5) || [];
            
            // For specific verticals, use more relevant terms
            if (vertical === 'travel') {
                primaryService = 'cheap flights';
                specificServices = [
                    'cheap flights',
                    'flight deals',
                    'airline tickets',
                    'hotel booking',
                    'vacation packages',
                    'last minute flights',
                    'discount airfare',
                    'travel deals',
                    'book flights online',
                    'cheap airline tickets'
                ];
            } else if (vertical === 'marketing') {
                primaryService = 'google ads';
                specificServices = [
                    'google ads management',
                    'ppc campaign',
                    'ad campaign builder',
                    'keyword planner',
                    'campaign automation',
                    ...(pageData.services || []).slice(0, 3)
                ];
            } else if (vertical === 'software') {
                primaryService = pageData.title?.toLowerCase().includes('campaign') ? 'campaign software' : 'software platform';
                specificServices = [
                    'marketing software',
                    'automation platform',
                    'campaign management tool',
                    'business software',
                    ...(pageData.services || []).slice(0, 3)
                ];
            }
            
            const generatedKws = generateTemplateKeywords({
                businessUrl: url,
                primaryService,
                specificServices,
                location: 'near me'
            });
            
            // Collect keywords - add vertical-specific keywords
            const verticalKeywords: string[] = [];
            if (vertical === 'travel') {
                verticalKeywords.push(
                    'cheap flights',
                    'flight deals',
                    'airline tickets',
                    'hotel booking',
                    'vacation packages',
                    'last minute flights',
                    'book flights online',
                    'cheap airfare',
                    'travel deals',
                    'discount flights'
                );
            } else if (vertical === 'marketing') {
                verticalKeywords.push(
                    'google ads campaign builder',
                    'ppc management tool',
                    'ad campaign software',
                    'keyword research tool',
                    'google ads automation'
                );
            } else if (vertical === 'software') {
                verticalKeywords.push(
                    'campaign management software',
                    'marketing automation platform',
                    'ad optimization tool'
                );
            }
            
            const suggestedKws = [
                ...verticalKeywords,
                ...generatedKws.map(k => k.keyword),
                ...(pageData.services || []).slice(0, 10),
                primaryService,
                `${primaryService} near me`,
                `best ${primaryService}`,
                `${primaryService} services`,
                `affordable ${primaryService}`,
                `professional ${primaryService}`
            ].filter((v, i, a) => a.indexOf(v) === i).slice(0, 20);
            
            addLog(`✅ Generated ${suggestedKws.length} keyword suggestions`);
            
            // Store analysis results
            const analysis: UrlAnalysisResult = {
                domain: pageData.domain || url,
                title: pageData.title || null,
                metaDescription: pageData.metaDescription || null,
                h1: pageData.h1 || null,
                services: pageData.services || [],
                phones: pageData.phones || [],
                emails: pageData.emails || [],
                addresses: pageData.addresses || [],
                vertical,
                cta,
                intent: {
                    id: intentResult.intentId,
                    label: intentResult.intentLabel || intentResult.intentId,
                    confidence: intentResult.confidence
                },
                suggestedKeywords: suggestedKws
            };
            
            setUrlAnalysis(analysis);
            
            // Auto-populate seed keywords
            const topSeeds = suggestedKws.slice(0, 5);
            const currentSeeds = seedKeywords.trim();
            const newSeeds = currentSeeds 
                ? `${currentSeeds}, ${topSeeds.join(', ')}` 
                : topSeeds.join(', ');
            setSeedKeywords(newSeeds);
            setSuggestedKeywords(suggestedKws);
            
            addLog('✅ Analysis complete!');
            
            notifications.success(`Extracted ${suggestedKws.length} keywords from ${pageData.domain}`, {
                title: 'URL Analysis Complete',
                description: `Vertical: ${vertical} | Intent: ${intentResult.intentId}`
            });
            
        } catch (error) {
            console.error('URL analysis error:', error);
            addLog(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            notifications.error('Failed to analyze URL. Try adding seed keywords manually.', { title: 'Analysis Failed' });
        } finally {
            setIsGeneratingSeedFromUrl(false);
        }
    };

    const handleGenerate = async (isAppend: boolean = false) => {
        const seedKeywordsStr = typeof seedKeywords === 'string' ? seedKeywords : '';
        if (!seedKeywordsStr.trim()) {
            notifications.warning('Please enter seed keywords', {
                title: 'Seed Keywords Required'
            });
            return;
        }

        const seedKeywordsArray = seedKeywordsStr.split(',').map(k => k.trim()).filter(Boolean);
        const MIN_KEYWORD_LENGTH = 3;
        const invalidKeywords = seedKeywordsArray.filter(k => k.length < MIN_KEYWORD_LENGTH);
        
        if (invalidKeywords.length > 0) {
            notifications.error(
                `Each keyword must be at least ${MIN_KEYWORD_LENGTH} characters long. Please check: ${invalidKeywords.slice(0, 3).join(', ')}${invalidKeywords.length > 3 ? '...' : ''}`,
                { 
                    title: 'Invalid Keywords',
                    description: `Keywords must be at least ${MIN_KEYWORD_LENGTH} characters long.`
                }
            );
            return;
        }

        const normalizedNegativeKeywords = normalizeListInput(negativeKeywords);

        setIsGenerating(true);
        setShowTerminalConsole(true);
        setTerminalComplete(false);

        try {
            console.log('[Keyword Planner] Calling API with:', { seeds: seedKeywordsArray });
            
            // Use the new Keyword Planner API for ideas and metrics
            const ideasResponse = await getKeywordIdeas({
                seedKeywords: seedKeywordsArray,
                targetCountry: 'US',
                customerId: googleAdsCustomerId || undefined,
            });

            console.log('[Keyword Planner] Ideas Response:', ideasResponse);

            if (ideasResponse.success && ideasResponse.keywords.length > 0) {
                setDataSource(ideasResponse.source as any);
                
                // Filter out negative keywords
                const filteredKeywords = ideasResponse.keywords.filter(k => 
                    !normalizedNegativeKeywords.some(neg => 
                        k.keyword.toLowerCase().includes(neg.toLowerCase())
                    )
                );

                // Build metrics map
                const metricsMap = new Map<string, KeywordMetrics>();
                filteredKeywords.forEach(k => {
                    metricsMap.set(k.keyword.toLowerCase(), k);
                });
                setKeywordMetricsMap(metricsMap);

                // Apply match type formatting and create enriched keywords
                const formattedKeywords: string[] = [];
                const enriched: EnrichedKeyword[] = [];
                
                filteredKeywords.forEach((kw) => {
                    if (matchTypes.broad) {
                        formattedKeywords.push(kw.keyword);
                        enriched.push({ text: kw.keyword, matchType: 'broad', metrics: kw });
                    }
                    if (matchTypes.phrase) {
                        formattedKeywords.push(`"${kw.keyword}"`);
                        enriched.push({ text: `"${kw.keyword}"`, matchType: 'phrase', metrics: kw });
                    }
                    if (matchTypes.exact) {
                        formattedKeywords.push(`[${kw.keyword}]`);
                        enriched.push({ text: `[${kw.keyword}]`, matchType: 'exact', metrics: kw });
                    }
                });

                if (isAppend) {
                    setGeneratedKeywords(prev => [...prev, ...formattedKeywords]);
                    setEnrichedKeywords(prev => [...prev, ...enriched]);
                } else {
                    setGeneratedKeywords(formattedKeywords);
                    setEnrichedKeywords(enriched);
                }
                setApiStatus('ok');

                const sourceLabel = ideasResponse.source === 'google_ads_api' ? 'Google Ads API' : 'Estimated Data';
                notifications.success(`Generated ${formattedKeywords.length} keywords with metrics`, {
                    title: 'Keywords Generated',
                    description: `Source: ${sourceLabel}`
                });
            } else {
                // Fallback to old method
                throw new Error('No keywords returned from API');
            }
        } catch (error: any) {
            console.log('[Keyword Planner] API unavailable - using local fallback');
            setDataSource('local');
            
            // FALLBACK: Generate 150-200 quality keywords locally
            const seeds = seedKeywords.split(',').map(s => s.trim()).filter(Boolean);
            const negatives = normalizedNegativeKeywords.map(n => n.toLowerCase());
            
            const mockKeywords: string[] = [];
            
            const preModifiers = [
                'best', 'top', 'professional', 'reliable', 'trusted', 'local',
                'affordable', 'certified', 'licensed', '24/7', 'emergency', 'same day',
                'quality', 'experienced', 'expert', 'rated', 'recommended', 'nearby',
                'fast', 'quick', 'urgent', 'premier', 'leading', 'premium'
            ];
            
            const postModifiers = [
                'near me', 'services', 'company', 'companies', 'contractor',
                'specialist', 'expert', 'repair', 'cost', 'prices', 'quote',
                'in my area', 'nearby', 'local', 'professionals', 'providers',
                'solutions', 'options', 'assistance', 'help', 'support', 'consultation'
            ];
            
            const combinedModifiers = [
                'best {seed} near me',
                'top rated {seed} services',
                'professional {seed} company',
                'affordable {seed} near me',
                'local {seed} services',
                '24/7 {seed} services',
                'emergency {seed} near me',
                'trusted {seed} company',
                'certified {seed} professionals',
                'licensed {seed} contractor'
            ];
            
            const questionTemplates = [
                'how much does {seed} cost',
                '{seed} pricing guide',
                'where to get {seed}',
                '{seed} options near me',
                'compare {seed} prices',
                'find {seed} near me',
                'get {seed} quote',
                '{seed} estimates',
                'hire {seed} professional',
                'book {seed} service'
            ];
            
            seeds.forEach(seed => {
                if (seed.split(' ').length >= 2 && !negatives.some(neg => seed.toLowerCase().includes(neg))) {
                    mockKeywords.push(seed);
                }
                
                preModifiers.forEach(modifier => {
                    const combined = `${modifier} ${seed}`;
                    if (!negatives.some(neg => combined.toLowerCase().includes(neg))) {
                        mockKeywords.push(combined);
                    }
                });
                
                postModifiers.forEach(modifier => {
                    const combined = `${seed} ${modifier}`;
                    if (!negatives.some(neg => combined.toLowerCase().includes(neg))) {
                        mockKeywords.push(combined);
                    }
                });
                
                combinedModifiers.forEach(template => {
                    const combined = template.replace('{seed}', seed);
                    if (!negatives.some(neg => combined.toLowerCase().includes(neg))) {
                        mockKeywords.push(combined);
                    }
                });
                
                questionTemplates.forEach(template => {
                    const combined = template.replace('{seed}', seed);
                    if (!negatives.some(neg => combined.toLowerCase().includes(neg))) {
                        mockKeywords.push(combined);
                    }
                });
            });
            
            // Deduplicate keywords and cap at 150-200 base keywords
            const uniqueKeywords = [...new Set(mockKeywords)].slice(0, 200);
            
            const formattedKeywords: string[] = [];
            const enriched: EnrichedKeyword[] = [];
            
            uniqueKeywords.forEach((keyword: string) => {
                // Generate mock metrics for local fallback
                const mockMetrics = {
                    keyword,
                    avgMonthlySearches: Math.floor(Math.random() * 5000) + 500,
                    competition: ['LOW', 'MEDIUM', 'HIGH'][Math.floor(Math.random() * 3)] as 'LOW' | 'MEDIUM' | 'HIGH',
                    competitionIndex: Math.floor(Math.random() * 100),
                    lowTopOfPageBid: Math.round((0.5 + Math.random() * 2) * 100) / 100,
                    highTopOfPageBid: Math.round((1.5 + Math.random() * 3) * 100) / 100,
                    avgCpc: Math.round((0.8 + Math.random() * 2.5) * 100) / 100,
                };

                if (matchTypes.broad) {
                    formattedKeywords.push(keyword);
                    enriched.push({ text: keyword, matchType: 'broad', metrics: mockMetrics });
                }
                if (matchTypes.phrase) {
                    formattedKeywords.push(`"${keyword}"`);
                    enriched.push({ text: `"${keyword}"`, matchType: 'phrase', metrics: mockMetrics });
                }
                if (matchTypes.exact) {
                    formattedKeywords.push(`[${keyword}]`);
                    enriched.push({ text: `[${keyword}]`, matchType: 'exact', metrics: mockMetrics });
                }
            });
            
            if (isAppend) {
                setGeneratedKeywords(prev => [...prev, ...formattedKeywords]);
                setEnrichedKeywords(prev => [...prev, ...enriched]);
            } else {
                setGeneratedKeywords(formattedKeywords);
                setEnrichedKeywords(enriched);
            }
            
            setApiStatus('error');
            notifications.success(`Generated ${formattedKeywords.length} keywords`);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCopyAll = async () => {
        const text = generatedKeywords.join('\n');
        const success = await copyToClipboard(text);
        if (success) {
            notifications.success('Keywords copied to clipboard!', {
                title: 'Copied'
            });
        } else {
            notifications.warning('Please manually copy the text from the visible text area.', {
                title: 'Copy Failed'
            });
        }
    };

    const handleSave = async () => {
        if (generatedKeywords.length === 0) return;
        setIsSaving(true);
        const itemName = `Plan: ${seedKeywords.substring(0, 30)}...`;
        try {
            await historyService.save(
                'keyword-planner',
                itemName,
                { seedKeywords, negativeKeywords, generatedKeywords, matchTypes }
            );
            
            notifications.success('Keyword plan saved!', { title: 'Saved Successfully' });
            // Refresh the saved lists to show the newly saved item
            await handleLoadSavedLists();
        } catch (error) {
            console.error("Save failed", error);
            notifications.error('Failed to save. Please try again.', {
                title: 'Save Failed'
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleOpenSaveDialog = () => {
        setShowSaveDialog(true);
    };

    const handleCloseSaveDialog = () => {
        setShowSaveDialog(false);
    };

    const handleSaveWithCustomName = async () => {
        if (generatedKeywords.length === 0) return;
        
        // Bug_42: Validate that listName is not empty or whitespace-only
        const trimmedName = listName.trim();
        if (!trimmedName || trimmedName.length === 0) {
            notifications.warning('Please enter a plan name', {
                title: 'Plan Name Required',
                description: 'The plan name cannot be empty.'
            });
            return;
        }
        
        setIsSaving(true);
        try {
            await historyService.save(
                'keyword-planner',
                trimmedName || `Plan: ${seedKeywords.substring(0, 30)}...`,
                { seedKeywords, negativeKeywords, generatedKeywords, matchTypes }
            );
            // Bug_43: Use toast notification instead of alert
            notifications.success('Keyword plan saved successfully!', {
                title: 'Saved',
                description: 'Your keyword plan has been saved.'
            });
            setListName('');
            setShowSaveDialog(false);
            // Refresh the saved lists to show the newly saved item
            await handleLoadSavedLists();
        } catch (error) {
            console.error("Save failed", error);
            notifications.error('Failed to save. Please try again.', {
                title: 'Save Failed'
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleLoadSavedList = async (listId: string) => {
        try {
            // Load from localStorage using historyService
            const allItems = await historyService.getAll();
            const item = allItems.find(i => i.id === listId);
            if (item && item.data) {
                setSeedKeywords(item.data.seedKeywords || '');
                setNegativeKeywords(item.data.negativeKeywords || '');
                setGeneratedKeywords(item.data.generatedKeywords || []);
                setMatchTypes(item.data.matchTypes || { broad: true, phrase: true, exact: true });
                setActiveTab('planner');
            }
        } catch (error) {
            console.error("Load failed", error);
            notifications.error('Failed to load list. Please try again.', {
                title: 'Load Failed'
            });
        }
    };

    const handleDeleteSavedList = async (listId: string) => {
        if (!confirm('Are you sure you want to delete this list?')) return;
        
        try {
            await historyService.delete(listId);
            setSavedLists(prev => prev.filter(list => list.id !== listId));
            notifications.success('List deleted successfully!', {
                title: 'Deleted'
            });
        } catch (error) {
            console.error("Delete failed", error);
            notifications.error('Failed to delete list. Please try again.', {
                title: 'Delete Failed'
            });
        }
    };

    const handleDownloadKeywords = () => {
        const csvContent = generatedKeywords.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'keywords.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleLoadSavedLists = async () => {
        try {
            const items = await historyService.getByType('keyword-planner');
            const formattedLists: SavedList[] = items.map(item => ({
                id: item.id,
                name: item.name,
                seedKeywords: item.data.seedKeywords || '',
                negativeKeywords: item.data.negativeKeywords || '',
                generatedKeywords: item.data.generatedKeywords || [],
                matchTypes: item.data.matchTypes || { broad: true, phrase: true, exact: true },
                createdAt: item.timestamp
            }));
            setSavedLists(formattedLists);
        } catch (error) {
            console.error("Load all failed", error);
        }
    };

    useEffect(() => {
        handleLoadSavedLists();
    }, []);

    return (
        <div className="min-h-screen bg-white p-6">
            {/* Terminal Progress Console */}
            <TerminalProgressConsole
                title="Keyword Planner Console"
                messages={KEYWORD_PLANNER_MESSAGES}
                isVisible={showTerminalConsole}
                onComplete={() => setTerminalComplete(true)}
                nextButtonText="Next: View Generated Keywords"
                onNextClick={() => {
                    setShowTerminalConsole(false);
                    setIsGenerating(false);
                    setShowResultsConsole(true);
                }}
                minDuration={4500}
            />

            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-slate-800">Keyword Planner</h1>
                        <p className="text-xs text-slate-500">Generate comprehensive keyword lists powered by AI and Google Ads data</p>
                    </div>
                </div>

                {/* Shell View - Two Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {/* Card 1: Stats */}
                    <div className="bg-slate-900 rounded-xl border border-slate-700 overflow-hidden">
                        <div className="flex items-center gap-2 px-4 py-2 bg-slate-800 border-b border-slate-700">
                            <div className="flex gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            </div>
                            <span className="text-xs text-slate-400 ml-2 font-mono">planner_stats.sh</span>
                        </div>
                        <div className="p-4 font-mono">
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-1 text-center">
                                    <div className="text-2xl font-bold text-violet-400">{generatedKeywords.length}</div>
                                    <div className="text-xs text-slate-400">Generated</div>
                                </div>
                                <div className="space-y-1 text-center">
                                    <div className="text-2xl font-bold text-emerald-400">{apiStatus === 'ok' ? 'LIVE' : 'LOCAL'}</div>
                                    <div className="text-xs text-slate-400">Source</div>
                                </div>
                                <div className="space-y-1 text-center">
                                    <div className="text-2xl font-bold text-amber-400">{savedLists.length}</div>
                                    <div className="text-xs text-slate-400">Saved</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Card 2: Config */}
                    <div className="bg-slate-900 rounded-xl border border-slate-700 overflow-hidden">
                        <div className="flex items-center gap-2 px-4 py-2 bg-slate-800 border-b border-slate-700">
                            <div className="flex gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            </div>
                            <span className="text-xs text-slate-400 ml-2 font-mono">planner_config.sh</span>
                        </div>
                        <div className="p-4 font-mono space-y-2 text-xs">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-slate-500">seeds:</span>
                                <span className="text-cyan-400">{seedKeywords.split(',').filter(s => s.trim()).length}</span>
                                <span className="text-slate-600 mx-1">|</span>
                                <span className="text-slate-500">negatives:</span>
                                <span className="text-pink-400">{negativeKeywords.split('\n').filter(s => s.trim()).length}</span>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-slate-500">match:</span>
                                <span className="text-slate-300">[{matchTypes.broad ? 'B' : '-'}{matchTypes.phrase ? 'P' : '-'}{matchTypes.exact ? 'E' : '-'}]</span>
                                <span className="text-slate-600 mx-1">|</span>
                                <span className="text-slate-500">metrics:</span>
                                <span className={showMetrics ? 'text-green-400' : 'text-slate-500'}>{showMetrics ? 'ON' : 'OFF'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-slate-500">country:</span>
                                <span className="text-blue-400">{filters.country}</span>
                                <span className="text-slate-600 mx-1">|</span>
                                <span className="text-slate-500">device:</span>
                                <span className="text-orange-400">{filters.device}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList className="bg-gray-100 border border-gray-200 p-1 rounded-xl">
                        <TabsTrigger 
                            value="planner" 
                            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-violet-500/20 rounded-lg px-6 py-2.5 text-gray-600 transition-all duration-300"
                        >
                            <Sparkles className="w-4 h-4 mr-2" />
                            Keyword Planner
                        </TabsTrigger>
                        <TabsTrigger 
                            value="saved"
                            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-violet-500/20 rounded-lg px-6 py-2.5 text-gray-600 transition-all duration-300"
                        >
                            <FolderOpen className="w-4 h-4 mr-2" />
                            Saved Lists
                        </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="planner" className="mt-0">
                        <div className="max-w-4xl mx-auto space-y-6">
                            {/* Configuration Panel */}
                            <div className="relative group">
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-500 to-purple-500 rounded-2xl blur opacity-10 group-hover:opacity-20 transition duration-500"></div>
                                <div className="relative bg-white rounded-2xl p-6 border border-gray-200 shadow-lg">
                                    {/* Panel Header */}
                                    <div className="flex items-start justify-between mb-6">
                                        <div>
                                            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-violet-500 animate-pulse"></div>
                                                Configuration
                                            </h2>
                                            <p className="text-sm text-gray-500 mt-1">
                                                Set up your keyword generation parameters
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-5">
                                        {/* Seed Keywords */}
                                        <div className="space-y-3">
                                            <Label htmlFor="seedKeywords" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                                <span className="w-1.5 h-1.5 rounded-full bg-violet-500"></span>
                                                Seed Keywords
                                            </Label>
                                            <Input
                                                id="seedKeywords"
                                                placeholder="airline number, contact airline, delta phone..."
                                                value={seedKeywords}
                                                onChange={(e) => setSeedKeywords(e.target.value)}
                                                className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-violet-500 focus:ring-violet-500/20 rounded-lg"
                                            />
                                            <p className="text-xs text-gray-500">
                                                Enter 3-5 core keywords, comma-separated
                                            </p>
                                        </div>

                                        {/* Match Types */}
                                        <div className="space-y-3">
                                            <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                                <span className="w-1.5 h-1.5 rounded-full bg-violet-500"></span>
                                                Match Types
                                            </Label>
                                            <div className="grid grid-cols-3 gap-3">
                                                <div 
                                                    onClick={() => setMatchTypes(prev => ({...prev, broad: !prev.broad}))}
                                                    className={`cursor-pointer p-3 rounded-xl border transition-all duration-300 ${
                                                        matchTypes.broad 
                                                            ? 'bg-amber-50 border-amber-400 shadow-lg shadow-amber-500/10' 
                                                            : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                                                    }`}
                                                >
                                                    <div className="flex items-center justify-between mb-1">
                                                        <Checkbox 
                                                            id="broad-planner" 
                                                            checked={matchTypes.broad}
                                                            onClick={(e: React.MouseEvent) => e.stopPropagation()}
                                                            onCheckedChange={(c: boolean | 'indeterminate') => setMatchTypes(prev => ({...prev, broad: c === true}))}
                                                            className="border-amber-400 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
                                                        />
                                                    </div>
                                                    <span className={`text-xs font-medium ${matchTypes.broad ? 'text-amber-700' : 'text-gray-500'}`}>
                                                        Broad
                                                    </span>
                                                </div>
                                                <div 
                                                    onClick={() => setMatchTypes(prev => ({...prev, phrase: !prev.phrase}))}
                                                    className={`cursor-pointer p-3 rounded-xl border transition-all duration-300 ${
                                                        matchTypes.phrase 
                                                            ? 'bg-blue-50 border-blue-400 shadow-lg shadow-blue-500/10' 
                                                            : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                                                    }`}
                                                >
                                                    <div className="flex items-center justify-between mb-1">
                                                        <Checkbox 
                                                            id="phrase-planner" 
                                                            checked={matchTypes.phrase}
                                                            onClick={(e: React.MouseEvent) => e.stopPropagation()}
                                                            onCheckedChange={(c: boolean | 'indeterminate') => setMatchTypes(prev => ({...prev, phrase: c === true}))}
                                                            className="border-blue-400 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                                                        />
                                                    </div>
                                                    <span className={`text-xs font-medium ${matchTypes.phrase ? 'text-blue-700' : 'text-gray-500'}`}>
                                                        "Phrase"
                                                    </span>
                                                </div>
                                                <div 
                                                    onClick={() => setMatchTypes(prev => ({...prev, exact: !prev.exact}))}
                                                    className={`cursor-pointer p-3 rounded-xl border transition-all duration-300 ${
                                                        matchTypes.exact 
                                                            ? 'bg-indigo-50 border-indigo-400 shadow-lg shadow-indigo-500/10' 
                                                            : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                                                    }`}
                                                >
                                                    <div className="flex items-center justify-between mb-1">
                                                        <Checkbox 
                                                            id="exact-planner" 
                                                            checked={matchTypes.exact}
                                                            onClick={(e: React.MouseEvent) => e.stopPropagation()}
                                                            onCheckedChange={(c: boolean | 'indeterminate') => setMatchTypes(prev => ({...prev, exact: c === true}))}
                                                            className="border-indigo-400 data-[state=checked]:bg-indigo-500 data-[state=checked]:border-indigo-500"
                                                        />
                                                    </div>
                                                    <span className={`text-xs font-medium ${matchTypes.exact ? 'text-indigo-700' : 'text-gray-500'}`}>
                                                        [Exact]
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Negative Keywords */}
                                        <div className="space-y-3">
                                            <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                                <AlertCircle className="w-3.5 h-3.5 text-gray-500" />
                                                Negative Keywords
                                            </Label>
                                            <Textarea
                                                placeholder="cheap, discount, reviews, job, free..."
                                                value={negativeKeywords}
                                                onChange={(e) => setNegativeKeywords(e.target.value)}
                                                className="min-h-[100px] bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-violet-500 focus:ring-violet-500/20 rounded-lg text-sm resize-none"
                                            />
                                            <p className="text-xs text-gray-500">
                                                One per line or comma-separated. These terms will be excluded.
                                            </p>
                                        </div>

                                    </div>

                                    {/* Filters + Generate Button */}
                                    <div className="mt-6 pt-6 border-t border-gray-200 space-y-3">
                                        <div className="flex items-center gap-3 mb-3">
                                            <KeywordFilters filters={filters} onFiltersChange={setFilters} compact={true} />
                                        </div>
                                        <Button
                                            onClick={() => handleGenerate(false)}
                                            disabled={isGenerating || !(typeof seedKeywords === 'string' && seedKeywords.trim())}
                                            className="w-full h-12 bg-gradient-to-r from-violet-600 via-purple-600 to-violet-600 hover:from-violet-500 hover:via-purple-500 hover:to-violet-500 text-white font-semibold rounded-xl shadow-lg shadow-violet-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 text-sm"
                                        >
                                            {isGenerating ? (
                                                <>
                                                    <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                                                    Generating Keywords...
                                                </>
                                            ) : (
                                                <>
                                                    <Sparkles className="w-5 h-5 mr-2" />
                                                    Generate Keywords
                                                </>
                                            )}
                                        </Button>
                                        {generatedKeywords.length > 0 && (
                                            <Button
                                                onClick={() => handleGenerate(true)}
                                                disabled={isGenerating || !(typeof seedKeywords === 'string' && seedKeywords.trim())}
                                                variant="outline"
                                                className="w-full h-10 bg-white border-gray-300 text-gray-700 hover:bg-violet-50 hover:text-violet-700 hover:border-violet-400 rounded-xl transition-all duration-300 text-sm"
                                            >
                                                <Plus className="w-4 h-4 mr-2" />
                                                Append More ({generatedKeywords.length} total)
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Results Panel */}
                            <div className="relative group">
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-500 to-purple-500 rounded-2xl blur opacity-10 group-hover:opacity-20 transition duration-500"></div>
                                <div className="relative bg-white rounded-2xl p-6 border border-gray-200 shadow-lg h-full flex flex-col">
                                    {/* Terminal Results Console */}
                                    {showResultsConsole && generatedKeywords.length > 0 && (
                                        <div className="mb-6">
                                            <TerminalResultsConsole
                                                title="Keyword Planner Export Console"
                                                isVisible={showResultsConsole}
                                                stats={[
                                                    { label: 'Keywords Generated', value: generatedKeywords.length, color: 'green' },
                                                    { label: 'Seed Keywords', value: seedKeywords.split(',').filter(s => s.trim()).length, color: 'cyan' },
                                                    { label: 'Match Types', value: `${matchTypes.broad ? 'Broad' : ''}${matchTypes.phrase ? ' Phrase' : ''}${matchTypes.exact ? ' Exact' : ''}`.trim() || 'None', color: 'yellow' },
                                                    { label: 'Data Source', value: dataSource === 'google_ads_api' ? 'Google Ads API' : dataSource === 'fallback' ? 'Estimated' : 'Local', color: 'purple' },
                                                    { label: 'Country', value: filters.country, color: 'cyan' },
                                                ]}
                                                onDownloadCSV={handleDownloadKeywords}
                                                onSave={handleSave}
                                                onCopy={handleCopyAll}
                                                onAppendMore={() => handleGenerate(true)}
                                                onGenerateAnother={() => {
                                                    setShowResultsConsole(false);
                                                    setGeneratedKeywords([]);
                                                    setEnrichedKeywords([]);
                                                }}
                                                showDownload={true}
                                                showSave={true}
                                                showCopy={true}
                                                showAppendMore={true}
                                                downloadButtonText="Download CSV for Google Ads"
                                                saveButtonText="Save to Saved Lists"
                                                copyButtonText="Copy Keywords"
                                                appendMoreButtonText={`Append More (${generatedKeywords.length} total)`}
                                                isSaving={isSaving}
                                            />
                                        </div>
                                    )}

                                    {/* Panel Header */}
                                    <div className="mb-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-3">
                                                <div className="w-2 h-2 rounded-full bg-violet-500 animate-pulse"></div>
                                                Keywords
                                                {generatedKeywords.length > 0 && (
                                                    <span className="px-2.5 py-1 text-xs font-bold bg-gradient-to-r from-violet-600 to-purple-600 rounded-full text-white shadow-lg shadow-violet-500/20">
                                                        {generatedKeywords.length}
                                                    </span>
                                                )}
                                            </h2>
                                            {generatedKeywords.length > 0 && (
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setShowMetrics(!showMetrics)}
                                                        className="h-8 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                                                    >
                                                        <BarChart3 className="w-3.5 h-3.5 mr-1.5" />
                                                        {showMetrics ? 'Hide' : 'Show'}
                                                    </Button>
                                                    <Badge className={`text-xs px-2.5 py-1 rounded-full font-medium border-0 ${
                                                        dataSource === 'google_ads_api' 
                                                            ? 'bg-indigo-100 text-indigo-700' 
                                                            : dataSource === 'fallback' 
                                                                ? 'bg-amber-100 text-amber-700' 
                                                                : 'bg-gray-100 text-gray-600'
                                                    }`}>
                                                        {dataSource === 'google_ads_api' 
                                                            ? 'Google Ads API' 
                                                            : dataSource === 'fallback' 
                                                                ? 'Estimated' 
                                                                : 'Local Data'}
                                                    </Badge>
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-500">
                                            {showMetrics && enrichedKeywords.some(k => k.metrics) 
                                                ? 'Keywords with volume, CPC, and competition metrics' 
                                                : 'Your generated keywords will appear here'}
                                        </p>
                                    </div>

                                    <div className="flex-1 overflow-hidden flex flex-col">
                                        {generatedKeywords.length === 0 ? (
                                            <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
                                                <div className="relative mb-6">
                                                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center shadow-lg">
                                                        <Sparkles className="w-10 h-10 text-gray-400" />
                                                    </div>
                                                    <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-r from-violet-600 to-purple-600 flex items-center justify-center shadow-lg">
                                                        <Plus className="w-3 h-3 text-white" />
                                                    </div>
                                                </div>
                                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                                    Ready to Generate
                                                </h3>
                                                <p className="text-sm text-gray-500 max-w-xs">
                                                    Configure your seed keywords and click Generate to create a comprehensive keyword list
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col h-full">
                                                {/* Action Buttons */}
                                                <div className="flex gap-2 flex-wrap mb-4">
                                                    <Button
                                                        onClick={handleOpenSaveDialog}
                                                        disabled={isSaving || generatedKeywords.length === 0}
                                                        size="sm"
                                                        className="h-9 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white border-0 shadow-lg shadow-violet-500/20 text-xs font-medium rounded-lg"
                                                    >
                                                        <Save className="w-3.5 h-3.5 mr-1.5" />
                                                        {isSaving ? 'Saving...' : 'Save'}
                                                    </Button>
                                                    <Button
                                                        onClick={handleCopyAll}
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-9 bg-white border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-gray-900 hover:border-gray-400 text-xs rounded-lg"
                                                    >
                                                        <Copy className="w-3.5 h-3.5 mr-1.5" />
                                                        Copy
                                                    </Button>
                                                    <Button
                                                        onClick={handleDownloadKeywords}
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-9 bg-white border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-gray-900 hover:border-gray-400 text-xs rounded-lg"
                                                    >
                                                        <Download className="w-3.5 h-3.5 mr-1.5" />
                                                        Export
                                                    </Button>
                                                </div>

                                                {/* Keywords Table */}
                                                <div className="flex-1 overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
                                                    {showMetrics && enrichedKeywords.some(k => k.metrics) && (
                                                        <div className="hidden sm:grid grid-cols-12 gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 bg-gray-100 border-b border-gray-200 text-xs font-semibold text-gray-600 sticky top-0">
                                                            <div className="col-span-6 sm:col-span-5">Keyword</div>
                                                            <div className="col-span-3 sm:col-span-2 text-center">Volume</div>
                                                            <div className="hidden sm:block col-span-2 text-center">CPC</div>
                                                            <div className="col-span-3 text-center">Competition</div>
                                                        </div>
                                                    )}
                                                    <div className="max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                                                        {(showMetrics && enrichedKeywords.length > 0 ? enrichedKeywords : generatedKeywords.map((k: any) => {
                                                            // Handle both string keywords and object keywords
                                                            if (typeof k === 'string') return { text: k };
                                                            if (k && typeof k === 'object' && 'text' in k) return { text: String(k.text) };
                                                            return { text: String(k || '') };
                                                        })).map((item, idx) => {
                                                            const kw = typeof item === 'string' ? { text: item } : item;
                                                            const metrics = (kw as EnrichedKeyword).metrics;
                                                            
                                                            return showMetrics && metrics ? (
                                                                <div
                                                                    key={idx}
                                                                    className="grid grid-cols-1 sm:grid-cols-12 gap-1 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 border-b border-gray-200 hover:bg-gray-100 transition-colors duration-200 text-sm bg-white"
                                                                >
                                                                    <div className="sm:col-span-5 font-mono text-gray-800 break-words sm:truncate" title={kw.text}>
                                                                        {kw.text}
                                                                    </div>
                                                                    <div className="flex sm:hidden gap-4 text-xs mt-1">
                                                                        <span className="text-gray-500">Vol: <span className="text-gray-700 font-medium">{metrics.avgMonthlySearches ? (metrics.avgMonthlySearches >= 1000 ? `${(metrics.avgMonthlySearches / 1000).toFixed(1)}K` : metrics.avgMonthlySearches.toLocaleString()) : '-'}</span></span>
                                                                        <span className="text-gray-500">CPC: <span className="text-gray-700 font-medium">{metrics.avgCpc ? `$${metrics.avgCpc.toFixed(2)}` : '-'}</span></span>
                                                                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${metrics.competition === 'HIGH' ? 'bg-rose-100 text-rose-700' : metrics.competition === 'MEDIUM' ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'}`}>{metrics.competition || 'Low'}</span>
                                                                    </div>
                                                                    <div className="hidden sm:flex col-span-2 text-center items-center justify-center gap-1.5">
                                                                        <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
                                                                        <span className="text-gray-700 font-medium">
                                                                            {metrics.avgMonthlySearches 
                                                                                ? metrics.avgMonthlySearches >= 1000 
                                                                                    ? `${(metrics.avgMonthlySearches / 1000).toFixed(1)}K`
                                                                                    : metrics.avgMonthlySearches.toLocaleString()
                                                                                : '-'}
                                                                        </span>
                                                                    </div>
                                                                    <div className="hidden sm:flex col-span-2 text-center items-center justify-center gap-1.5">
                                                                        <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                                                                        <span className="text-gray-700 font-medium">
                                                                            {metrics.avgCpc ? `$${metrics.avgCpc.toFixed(2)}` : '-'}
                                                                        </span>
                                                                    </div>
                                                                    <div className="hidden sm:block col-span-3 text-center">
                                                                        <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${
                                                                            metrics.competition === 'HIGH' 
                                                                                ? 'bg-rose-100 text-rose-700' 
                                                                                : metrics.competition === 'MEDIUM' 
                                                                                    ? 'bg-amber-100 text-amber-700' 
                                                                                    : 'bg-indigo-100 text-indigo-700'
                                                                        }`}>
                                                                            {metrics.competition || 'Low'}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div
                                                                    key={idx}
                                                                    className="px-3 sm:px-4 py-2 sm:py-3 border-b border-gray-200 hover:bg-gray-100 transition-colors duration-200 text-sm text-gray-800 font-mono bg-white break-words"
                                                                >
                                                                    {kw.text}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TabsContent>
                    
                    <TabsContent value="saved" className="mt-0">
                        <div className="relative group">
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-500 to-purple-500 rounded-2xl blur opacity-10 group-hover:opacity-20 transition duration-500"></div>
                            <div className="relative bg-white rounded-2xl p-6 border border-gray-200 shadow-lg">
                                <div className="mb-6">
                                    <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-violet-500 animate-pulse"></div>
                                        Saved Keyword Lists
                                        {savedLists.length > 0 && (
                                            <span className="px-2.5 py-1 text-xs font-bold bg-gradient-to-r from-violet-600 to-purple-600 rounded-full text-white">
                                                {savedLists.length}
                                            </span>
                                        )}
                                    </h2>
                                </div>
                                {savedLists.length > 0 ? (
                                    <div className="grid gap-4">
                                        {savedLists.map(list => (
                                            <div
                                                key={list.id}
                                                className="p-4 rounded-xl bg-gray-50 border border-gray-200 hover:border-violet-300 hover:bg-violet-50/50 transition-all duration-300"
                                            >
                                                <div className="flex justify-between items-center">
                                                    <div className="space-y-1">
                                                        <span className="text-base font-semibold text-gray-900">{list.name}</span>
                                                        <p className="text-xs text-gray-500">
                                                            Created {new Date(list.createdAt).toLocaleDateString()}
                                                        </p>
                                                        <div className="mt-2">
                                                            <ProjectTagSelector
                                                                itemType="keyword-planner"
                                                                itemId={list.id}
                                                                itemName={list.name}
                                                                size="sm"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            onClick={() => handleLoadSavedList(list.id)}
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-9 bg-white border-gray-300 text-gray-700 hover:bg-violet-50 hover:text-violet-700 hover:border-violet-400 rounded-lg text-xs"
                                                        >
                                                            <FolderOpen className="w-3.5 h-3.5 mr-1.5" />
                                                            Load
                                                        </Button>
                                                        <Button
                                                            onClick={() => handleDeleteSavedList(list.id)}
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-9 bg-rose-50 border-rose-300 text-rose-700 hover:bg-rose-100 hover:border-rose-400 rounded-lg text-xs"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                                                            Delete
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-16 text-center">
                                        <div className="relative mb-6">
                                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center shadow-lg">
                                                <FolderOpen className="w-10 h-10 text-gray-400" />
                                            </div>
                                        </div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                            No Saved Lists
                                        </h3>
                                        <p className="text-sm text-gray-500 max-w-xs">
                                            Generate keywords and save them for future use
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>

                {/* Save Dialog */}
                <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
                    <DialogContent className="bg-white border-gray-200 shadow-2xl rounded-2xl sm:max-w-[440px]">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-semibold text-gray-900 flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-gradient-to-br from-violet-600 to-purple-600">
                                    <Save className="w-4 h-4 text-white" />
                                </div>
                                Save Keyword Plan
                            </DialogTitle>
                            <DialogDescription className="text-gray-500">
                                Give your keyword plan a name to save it for later
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-sm font-medium text-gray-700">Plan Name</Label>
                                <Input
                                    id="name"
                                    placeholder="My Keyword Plan"
                                    value={listName}
                                    onChange={(e) => setListName(e.target.value)}
                                    className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-violet-500 focus:ring-violet-500/20 rounded-lg"
                                />
                            </div>
                        </div>
                        <DialogFooter className="gap-2">
                            <Button
                                onClick={handleCloseSaveDialog}
                                variant="outline"
                                className="bg-white border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-lg"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSaveWithCustomName}
                                disabled={isSaving}
                                className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white border-0 shadow-lg shadow-violet-500/20 rounded-lg"
                            >
                                {isSaving ? (
                                    <>
                                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4 mr-2" />
                                        Save Plan
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
};