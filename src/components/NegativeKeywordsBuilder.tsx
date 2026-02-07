import React, { useState, useEffect, useMemo } from 'react';
import { useAuthCompat } from '../utils/authCompat';
import { Sparkles, Download, Globe, Type, ShieldAlert, Save, Filter, BarChart3, FileText, RefreshCw, Trash2, Clock, Zap, Brain, ChevronDown, ChevronUp, X, FolderOpen } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { historyService } from '../utils/historyService';
import { notifications } from '../utils/notifications';
import { KeywordFilters, KeywordFiltersState, DEFAULT_FILTERS } from './KeywordFilters';
import {
    NEGATIVE_KEYWORD_CATEGORIES,
    deduplicateKeywords,
    filterProfanity,
    addMisspellings,
    handleBrandNames,
    exportToCSV,
    getCategoryStats,
    type NegativeKeyword,
    type NegativeKeywordCategory
} from '../utils/negativeKeywordsGenerator';
import { exportNegativeKeywordsToCSV } from '../utils/googleAdsEditorCSVExporter';
import { generateSmartNegatives, getAllVerticals, estimateNegativeCount } from '../utils/negativeKeywordEngine';

interface GeneratedKeyword {
    id: number;
    keyword: string;
    reason: string;
    category: string;
    subcategory?: string;
    matchType?: 'exact' | 'phrase' | 'broad';
}

type NegativeFillPreset = {
    url: string;
    paths: string[];
    coreKeywords: string[];
    userGoal: 'leads' | 'calls' | 'signups' | 'branding' | 'ecommerce' | 'other';
    targetLocation?: string;
    competitorBrands?: string[];
    excludeCompetitors?: boolean;
    keywordCountRange?: [number, number];
};

const NEGATIVE_FILL_INFO_PRESETS: NegativeFillPreset[] = [
    {
        url: 'https://www.fleetguardian.io',
        paths: ['enterprise-demo', 'fleet-audit', 'solutions'],
        coreKeywords: [
            'enterprise fleet tracking',
            'gps telematics platform',
            'dot compliance software',
            'vehicle camera monitoring',
            'driver safety coaching'
        ],
        userGoal: 'leads',
        targetLocation: 'Dallas, TX',
        competitorBrands: ['Fleetio', 'Samsara', 'Verizon Connect'],
        excludeCompetitors: true,
        keywordCountRange: [850, 1100]
    },
    {
        url: 'https://www.horizonplasticsurgery.com',
        paths: ['consult', 'vip', 'sculptra', 'body-contouring'],
        coreKeywords: [
            'tummy tuck specialist',
            'mommy makeover surgeon',
            'body contouring center',
            'board certified plastic surgeon',
            'liposuction revisions'
        ],
        userGoal: 'calls',
        targetLocation: 'Miami, FL',
        competitorBrands: ['Athenique', 'Vivid Body MD'],
        excludeCompetitors: false,
        keywordCountRange: [900, 1050]
    },
    {
        url: 'https://www.atlascyberdefense.com',
        paths: ['zero-trust', 'mssp', 'threat-lab', 'demo'],
        coreKeywords: [
            'managed soc service',
            'zero trust deployment',
            'cloud incident response',
            'b2b cyber security experts',
            'threat hunting retainer'
        ],
        userGoal: 'leads',
        targetLocation: 'Austin, TX',
        competitorBrands: ['Expel', 'CrowdStrike', 'Arctic Wolf'],
        excludeCompetitors: true,
        keywordCountRange: [780, 1000]
    }
];

const pickNegativePreset = <T,>(list: T[]): T => list[Math.floor(Math.random() * list.length)];

const randomInt = (min: number, max: number) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

const joinKeywords = (keywords: string[]) => {
    if (keywords.length === 0) return '';
    return [...keywords].sort(() => Math.random() - 0.5).join(', ');
};

const buildUrlWithPath = (baseUrl: string, slug: string) => {
    const sanitized = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    if (!slug) return sanitized;
    return `${sanitized}/${slug}`;
};

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
    'DIY / Self-Help': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
    'Budget / Price Sensitive': { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
    'Job / Career Seekers': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    'Competitor Searches': { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
    'Educational / Academic': { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
    'Information Seekers': { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
    'Negative Outcomes / Complaints': { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
    'Unqualified Leads': { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' },
    'Wrong Location': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
    'Intent Mismatch': { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
    'Low Value': { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
    'Irrelevant Product': { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
    'Competitor': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
    'Location Irrelevant': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    'Service Mismatch': { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
    'Job/DIY': { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200' },
    'Support/Help': { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
    'Educational': { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
    'Price Comparison': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
    'Other': { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' },
};

const INTENT_TO_NEGATIVE_CATEGORY_MAP: Record<string, string> = {
    'DIY / Self-Help': 'Job/DIY',
    'Budget / Price Sensitive': 'Low-Value',
    'Job / Career Seekers': 'Job/DIY',
    'Competitor Searches': 'Competitor',
    'Educational / Academic': 'Educational',
    'Information Seekers': 'Intent-Mismatch',
    'Negative Outcomes / Complaints': 'Other',
    'Unqualified Leads': 'Other',
    'Wrong Location': 'Location-Irrelevant',
};

function resolveNegativeCategoryKey(categoryName: string): string {
    if (categoryName in NEGATIVE_KEYWORD_CATEGORIES) return categoryName;
    
    const mappedKey = INTENT_TO_NEGATIVE_CATEGORY_MAP[categoryName];
    if (mappedKey) return mappedKey;
    
    const foundKey = Object.keys(NEGATIVE_KEYWORD_CATEGORIES).find(key => {
        const label = NEGATIVE_KEYWORD_CATEGORIES[key as NegativeKeywordCategory].label;
        return label === categoryName || label.trim().toLowerCase() === categoryName.trim().toLowerCase();
    });
    if (foundKey) return foundKey;
    
    return 'Other';
}

export const NegativeKeywordsBuilder = ({ initialData }: { initialData?: any }) => {
    const { getToken } = useAuthCompat();
    const [url, setUrl] = useState('');
    const [urlError, setUrlError] = useState('');
    const [coreKeywords, setCoreKeywords] = useState('');
    const [userGoal, setUserGoal] = useState('');
    const [targetLocation, setTargetLocation] = useState('');
    const [competitorBrands, setCompetitorBrands] = useState('');
    const [excludeCompetitors, setExcludeCompetitors] = useState(false);
    const [keywordCount, setKeywordCount] = useState(1000);
    const [generationMode, setGenerationMode] = useState<'smart' | 'ai'>('smart');
    const [selectedVertical, setSelectedVertical] = useState('');
    
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedKeywords, setGeneratedKeywords] = useState<GeneratedKeyword[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('builder');
    const [filters, setFilters] = useState<KeywordFiltersState>(DEFAULT_FILTERS);
    const [savedItems, setSavedItems] = useState<any[]>([]);
    
    const [selectedCategories, setSelectedCategories] = useState<Set<NegativeKeywordCategory>>(new Set());
    const [exportFormat, setExportFormat] = useState<'exact' | 'phrase' | 'broad' | 'all'>('all');
    const [showStats, setShowStats] = useState(true);
    const [mobileInputExpanded, setMobileInputExpanded] = useState(true);

    const handleFillInfo = () => {
        const preset = pickNegativePreset(NEGATIVE_FILL_INFO_PRESETS);
        if (!preset) return;

        const slug = pickNegativePreset(preset.paths) || '';
        setUrl(buildUrlWithPath(preset.url, slug));
        setCoreKeywords(joinKeywords(preset.coreKeywords));
        setUserGoal(preset.userGoal);
        setTargetLocation(preset.targetLocation || '');
        setCompetitorBrands((preset.competitorBrands || []).join(', '));
        setExcludeCompetitors(Boolean(preset.excludeCompetitors));

        if (preset.keywordCountRange) {
            setKeywordCount(randomInt(preset.keywordCountRange[0], preset.keywordCountRange[1]));
        } else {
            setKeywordCount(1000);
        }
        setUrlError('');
    };

    useEffect(() => {
        const savedFormData = localStorage.getItem('negative-keywords-form-data');
        if (savedFormData) {
            try {
                const data = JSON.parse(savedFormData);
                setUrl(data.url || '');
                setCoreKeywords(data.coreKeywords || '');
                setUserGoal(data.userGoal || '');
                setTargetLocation(data.targetLocation || '');
                setCompetitorBrands(data.competitorBrands || '');
                setExcludeCompetitors(data.excludeCompetitors || false);
                setKeywordCount(data.keywordCount || 1000);
            } catch (e) {
                console.error('Failed to load saved form data:', e);
            }
        }
        
        if (initialData) {
            setUrl(initialData.url || '');
            setCoreKeywords(initialData.coreKeywords || '');
            setUserGoal(initialData.userGoal || '');
            setGeneratedKeywords(initialData.generatedKeywords || []);
        }
    }, [initialData]);

    useEffect(() => {
        try {
            const formData = {
                url,
                coreKeywords,
                userGoal,
                targetLocation,
                competitorBrands,
                excludeCompetitors,
                keywordCount
            };
            localStorage.setItem('negative-keywords-form-data', JSON.stringify(formData));
        } catch (error) {
            console.warn('Could not save form data to localStorage:', error);
        }
    }, [url, coreKeywords, userGoal, targetLocation, competitorBrands, excludeCompetitors, keywordCount]);

    const validateUrl = (urlValue: string): boolean => {
        if (!urlValue.trim()) {
            setUrlError('URL is required');
            return false;
        }
        
        try {
            const urlObj = new URL(urlValue);
            if (!['http:', 'https:'].includes(urlObj.protocol)) {
                setUrlError('URL must start with http:// or https://');
                return false;
            }
            setUrlError('');
            return true;
        } catch (e) {
            setUrlError('Please enter a valid URL (e.g., https://example.com)');
            return false;
        }
    };

    const handleSave = async () => {
        if (generatedKeywords.length === 0) return;
        setIsSaving(true);
        const itemName = `Negatives: ${coreKeywords.substring(0, 20)}...`;
        try {
            await historyService.save(
                'negative-keywords',
                itemName,
                { url, coreKeywords, userGoal, generatedKeywords }
            );
            
            notifications.success('Negative keywords saved successfully!', { title: 'Saved', description: 'Your negative keywords have been saved.' });
            await loadSavedItems();
        } catch (error) {
            console.error("Save failed", error);
            notifications.error('Failed to save. Please try again.', {
                title: 'Save Failed'
            });
        } finally {
            setIsSaving(false);
        }
    };

    const loadSavedItems = async () => {
        try {
            const items = await historyService.getByType('negative-keywords');
            items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            setSavedItems(items);
        } catch (error) {
            console.error("Load saved items failed", error);
        }
    };

    const handleLoadSavedItem = async (itemId: string) => {
        try {
            const allItems = await historyService.getAll();
            const item = allItems.find(i => i.id === itemId);
            if (item && item.data) {
                setUrl(item.data.url || '');
                setCoreKeywords(item.data.coreKeywords || '');
                setUserGoal(item.data.userGoal || '');
                setGeneratedKeywords(item.data.generatedKeywords || []);
                setActiveTab('builder');
                notifications.success('Saved item loaded successfully!', {
                    title: 'Loaded'
                });
            }
        } catch (error) {
            console.error("Load failed", error);
            notifications.error('Failed to load item. Please try again.', {
                title: 'Load Failed'
            });
        }
    };

    const handleDeleteSavedItem = async (itemId: string) => {
        if (!confirm('Are you sure you want to delete this item?')) return;
        
        try {
            await historyService.deleteHistory(itemId);
            await loadSavedItems();
            notifications.success('Item deleted successfully!', {
                title: 'Deleted'
            });
        } catch (error) {
            console.error("Delete failed", error);
            notifications.error('Failed to delete item. Please try again.', {
                title: 'Delete Failed'
            });
        }
    };

    useEffect(() => {
        loadSavedItems();
    }, []);

    const handleGenerate = async () => {
        if (!validateUrl(url)) {
            return;
        }
        
        if (!url.trim() || !coreKeywords.trim() || !userGoal) {
            notifications.warning('Please fill in all required fields including the URL', {
                title: 'Missing Fields'
            });
            return;
        }
        
        setIsGenerating(true);
        setGeneratedKeywords([]);
        setMobileInputExpanded(false);

        try {
            console.log('Attempting AI negative keyword generation via backend...');
            
            const response = await fetch('/api/ai/generate-negative-keywords', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url,
                    coreKeywords,
                    userGoal,
                    count: keywordCount,
                    excludeCompetitors,
                    competitorBrands: (competitorBrands || '').split(',').map(b => b.trim()).filter(Boolean),
                    targetLocation: targetLocation || undefined
                })
            });

            const data = await response.json();
            
            if (data.keywords && Array.isArray(data.keywords)) {
                console.log('AI generation successful:', data.keywords.length, 'keywords');
                
                let negativeKeywords: NegativeKeyword[] = data.keywords.map((item: any) => ({
                    keyword: (item.keyword || '').trim(),
                    category: (item.category || 'Other') as NegativeKeywordCategory,
                    subcategory: item.subcategory,
                    reason: item.reason || 'AI suggested',
                    matchType: (item.matchType || 'exact') as 'exact' | 'phrase' | 'broad'
                }));

                negativeKeywords = deduplicateKeywords(negativeKeywords);
                negativeKeywords = filterProfanity(negativeKeywords);
                
                if (excludeCompetitors && competitorBrands && competitorBrands.trim()) {
                    const brands = competitorBrands.split(',').map(b => b.trim()).filter(Boolean);
                    negativeKeywords = handleBrandNames(negativeKeywords, brands);
                }

                negativeKeywords = addMisspellings(negativeKeywords);

                const formattedKeywords: GeneratedKeyword[] = negativeKeywords.map((item, index) => {
                    let formattedKeyword: string;
                    switch (item.matchType) {
                        case 'phrase':
                            formattedKeyword = `"${item.keyword}"`;
                            break;
                        case 'broad':
                            formattedKeyword = item.keyword;
                            break;
                        case 'exact':
                        default:
                            formattedKeyword = `[${item.keyword}]`;
                            break;
                    }
                    return {
                        id: index + 1,
                        keyword: formattedKeyword,
                        reason: item.reason,
                        category: NEGATIVE_KEYWORD_CATEGORIES[item.category]?.label || item.category,
                        subcategory: item.subcategory,
                        matchType: item.matchType
                    };
                });

                setGeneratedKeywords(formattedKeywords);
                notifications.success(`Generated ${formattedKeywords.length} contextual negative keywords`, {
                    title: 'AI Generation Complete'
                });
            } else {
                throw new Error(data.error || 'Invalid response format');
            }
        } catch (error) {
            console.error('AI generation error:', error);
            notifications.error('Failed to generate keywords. Please check your connection and try again.', {
                title: 'Generation Failed'
            });
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSmartGenerate = () => {
        if (!coreKeywords.trim()) {
            notifications.warning('Please enter core keywords', {
                title: 'Missing Keywords'
            });
            return;
        }

        setIsGenerating(true);
        setGeneratedKeywords([]);
        setMobileInputExpanded(false);

        try {
            const keywordsList = coreKeywords.split(/[\n,]+/).map(k => k.trim()).filter(Boolean);
            const competitors = competitorBrands.split(',').map(c => c.trim()).filter(Boolean);

            const result = generateSmartNegatives({
                coreKeywords: keywordsList,
                vertical: selectedVertical || undefined,
                competitors: competitors.length > 0 ? competitors : undefined
            });

            const formattedKeywords: GeneratedKeyword[] = result.negatives.map((neg, index) => {
                let formattedKeyword: string;
                switch (neg.matchType) {
                    case 'phrase':
                        formattedKeyword = `"${neg.keyword}"`;
                        break;
                    case 'broad':
                        formattedKeyword = neg.keyword;
                        break;
                    case 'exact':
                    default:
                        formattedKeyword = `[${neg.keyword}]`;
                        break;
                }
                return {
                    id: index + 1,
                    keyword: formattedKeyword,
                    reason: neg.source,
                    category: neg.category,
                    subcategory: undefined,
                    matchType: neg.matchType
                };
            });

            setGeneratedKeywords(formattedKeywords);
            
            const categoryBreakdown = Object.entries(result.stats.byCategory)
                .map(([cat, count]) => `${cat}: ${count}`)
                .slice(0, 5)
                .join(', ');

            notifications.success(`Generated ${result.stats.totalCount} smart negatives instantly`, {
                title: 'Smart Generation Complete',
                description: categoryBreakdown
            });
        } catch (error) {
            console.error('Smart generation error:', error);
            notifications.error('Failed to generate smart negatives', {
                title: 'Generation Failed'
            });
        } finally {
            setIsGenerating(false);
        }
    };

    const filteredKeywords = useMemo(() => {
        if (selectedCategories.size === 0) return generatedKeywords;
        
        return generatedKeywords.filter(kw => {
            const resolvedKey = resolveNegativeCategoryKey(kw.category);
            return selectedCategories.has(resolvedKey as NegativeKeywordCategory);
        });
    }, [generatedKeywords, selectedCategories]);

    const categoryStats = useMemo(() => {
        if (generatedKeywords.length === 0) return {};
        
        const stats: Record<string, number> = {};
        generatedKeywords.forEach(kw => {
            stats[kw.category] = (stats[kw.category] || 0) + 1;
        });
        return stats;
    }, [generatedKeywords]);

    const displayKeywords = useMemo(() => {
        if (exportFormat === 'all') return filteredKeywords;
        
        return filteredKeywords.map(kw => {
            const cleanKeyword = kw.keyword.replace(/[\[\]"]/g, '');
            let formattedKeyword: string;
            let displayMatchType: 'exact' | 'phrase' | 'broad';
            
            switch (exportFormat) {
                case 'phrase':
                    formattedKeyword = `"${cleanKeyword}"`;
                    displayMatchType = 'phrase';
                    break;
                case 'broad':
                    formattedKeyword = cleanKeyword;
                    displayMatchType = 'broad';
                    break;
                case 'exact':
                default:
                    formattedKeyword = `[${cleanKeyword}]`;
                    displayMatchType = 'exact';
                    break;
            }
            
            return {
                ...kw,
                keyword: formattedKeyword,
                matchType: displayMatchType
            };
        });
    }, [filteredKeywords, exportFormat]);

    const handleDownload = async (format: 'standard' | 'google-ads-editor' = 'standard') => {
        if (filteredKeywords.length === 0) {
            notifications.warning('No keywords to export', {
                title: 'No Keywords'
            });
            return;
        }

        const negativeKeywords: NegativeKeyword[] = filteredKeywords.map(kw => {
            const cleanKeyword = kw.keyword.replace(/[\[\]"]/g, '');
            const resolvedKey = resolveNegativeCategoryKey(kw.category);
            
            return {
                keyword: cleanKeyword,
                category: resolvedKey as NegativeKeywordCategory || 'Other',
                subcategory: kw.subcategory,
                reason: kw.reason,
                matchType: kw.matchType || 'exact'
            };
        });

        let filename: string;

        try {
            if (format === 'google-ads-editor') {
                filename = `negative_keywords_google_ads_editor_${new Date().toISOString().split('T')[0]}.csv`;
                
                const validation = exportNegativeKeywordsToCSV(
                    negativeKeywords,
                    'Negative Keywords Campaign',
                    'All Ad Groups',
                    filename
                );
                
                if (validation.warnings && validation.warnings.length > 0) {
                    const warningMessage = validation.warnings.slice(0, 5).join('\n') + 
                      (validation.warnings.length > 5 ? `\n... and ${validation.warnings.length - 5} more warnings` : '');
                    notifications.warning(
                        warningMessage,
                        { 
                            title: 'CSV Validation Warnings',
                            description: 'Your campaign will export, but consider fixing these warnings.',
                            duration: 10000
                        }
                    );
                } else {
                    notifications.success('Negative keywords exported successfully!', {
                        title: 'Export Complete',
                        description: `Exported ${negativeKeywords.length} negative keyword(s) to CSV.`
                    });
                }
            } else {
                let csvContent: string;
                csvContent = exportToCSV(negativeKeywords, exportFormat);
                filename = `negative_keywords_${exportFormat}_${new Date().toISOString().split('T')[0]}.csv`;
                
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement("a");
                if (link.download !== undefined) {
                    const url = URL.createObjectURL(blob);
                    link.setAttribute("href", url);
                    link.setAttribute("download", filename);
                    link.style.visibility = 'hidden';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                }
                
                notifications.success('Negative keywords exported successfully!', {
                    title: 'Export Complete',
                    description: `Exported ${negativeKeywords.length} negative keyword(s) to CSV.`
                });
            }
        } catch (error) {
            console.error('Export error:', error);
            notifications.error(
                'Failed to export keywords. Please try again.',
                { 
                    title: 'Export Failed',
                    description: 'Please try again or contact support if the issue persists.'
                }
            );
        }
    };

    const topCategories = useMemo(() => {
        const entries = Object.entries(categoryStats);
        entries.sort((a, b) => b[1] - a[1]);
        return entries.slice(0, 5);
    }, [categoryStats]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* Compact Header with Filters */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200">
                            <ShieldAlert className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg sm:text-xl font-bold text-slate-900">Negative Keywords</h1>
                            <p className="text-xs text-slate-500 hidden sm:block">Protect your ad spend with AI-powered negatives</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <KeywordFilters filters={filters} onFiltersChange={setFilters} compact={true} />
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleFillInfo}
                            className="gap-1.5 text-xs bg-white hover:bg-indigo-50 border-indigo-200 text-indigo-600"
                        >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Fill Sample</span>
                        </Button>
                    </div>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                    <TabsList className="bg-white/80 backdrop-blur border border-slate-200 p-1 rounded-xl shadow-sm">
                        <TabsTrigger value="builder" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white">
                            Negative Keywords Builder
                        </TabsTrigger>
                        <TabsTrigger value="history" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white">
                            Saved List
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="builder" className="space-y-4 mt-4">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                            {/* Left Panel: Inputs */}
                            <div className="lg:col-span-4 space-y-4">
                                {/* Mobile Collapse Toggle */}
                                <button
                                    className="w-full lg:hidden flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 shadow-sm"
                                    onClick={() => setMobileInputExpanded(!mobileInputExpanded)}
                                >
                                    <span className="font-medium text-slate-700 flex items-center gap-2">
                                        <Globe className="w-4 h-4 text-indigo-500" />
                                        Configuration
                                    </span>
                                    {mobileInputExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                </button>

                                <div className={`space-y-4 ${mobileInputExpanded ? 'block' : 'hidden lg:block'}`}>
                                    {/* URL Input Card */}
                                    <Card className="border-slate-200/60 bg-white/80 backdrop-blur-sm shadow-sm overflow-hidden">
                                        <CardContent className="p-4 space-y-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                                                    <Globe className="h-4 w-4 text-indigo-500" />
                                                    Target URL <span className="text-red-500">*</span>
                                                </label>
                                                <Input 
                                                    placeholder="https://example.com/landing-page" 
                                                    value={url}
                                                    onChange={(e) => {
                                                        setUrl(e.target.value);
                                                        if (urlError) validateUrl(e.target.value);
                                                    }}
                                                    onBlur={(e) => validateUrl(e.target.value)}
                                                    className={`bg-white text-sm ${urlError ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 focus:ring-indigo-500'}`}
                                                />
                                                {urlError && (
                                                    <p className="text-xs text-red-500 flex items-center gap-1">
                                                        <X className="w-3 h-3" /> {urlError}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                                                    <Type className="h-4 w-4 text-indigo-500" />
                                                    Core Keywords <span className="text-red-500">*</span>
                                                </label>
                                                <Textarea 
                                                    placeholder="gps telematics platform, fleet tracking, dot compliance..." 
                                                    value={coreKeywords}
                                                    onChange={(e) => setCoreKeywords(e.target.value)}
                                                    className="bg-white min-h-[80px] text-sm border-slate-200 focus:ring-indigo-500 resize-none"
                                                />
                                                <p className="text-xs text-slate-400">Enter the main keywords you are targeting</p>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Generation Mode Card */}
                                    <Card className="border-slate-200/60 bg-white/80 backdrop-blur-sm shadow-sm overflow-hidden">
                                        <CardContent className="p-4 space-y-3">
                                            <label className="text-sm font-medium text-slate-700">Generation Mode</label>
                                            <div className="grid grid-cols-2 gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setGenerationMode('smart')}
                                                    className={`relative p-3 rounded-xl border-2 transition-all text-left ${
                                                        generationMode === 'smart'
                                                            ? 'border-violet-500 bg-violet-50 ring-2 ring-violet-200'
                                                            : 'border-slate-200 hover:border-slate-300 bg-white'
                                                    }`}
                                                >
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${
                                                        generationMode === 'smart' ? 'bg-violet-500' : 'bg-slate-100'
                                                    }`}>
                                                        <Zap className={`h-4 w-4 ${generationMode === 'smart' ? 'text-white' : 'text-slate-500'}`} />
                                                    </div>
                                                    <div className={`text-sm font-semibold ${generationMode === 'smart' ? 'text-violet-700' : 'text-slate-700'}`}>
                                                        Smart Engine
                                                    </div>
                                                    <div className={`text-xs ${generationMode === 'smart' ? 'text-violet-500' : 'text-slate-400'}`}>
                                                        Instant · 1,000+ negatives
                                                    </div>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setGenerationMode('ai')}
                                                    className={`relative p-3 rounded-xl border-2 transition-all text-left ${
                                                        generationMode === 'ai'
                                                            ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200'
                                                            : 'border-slate-200 hover:border-slate-300 bg-white'
                                                    }`}
                                                >
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${
                                                        generationMode === 'ai' ? 'bg-indigo-500' : 'bg-slate-100'
                                                    }`}>
                                                        <Brain className={`h-4 w-4 ${generationMode === 'ai' ? 'text-white' : 'text-slate-500'}`} />
                                                    </div>
                                                    <div className={`text-sm font-semibold ${generationMode === 'ai' ? 'text-indigo-700' : 'text-slate-700'}`}>
                                                        AI Contextual
                                                    </div>
                                                    <div className={`text-xs ${generationMode === 'ai' ? 'text-indigo-500' : 'text-slate-400'}`}>
                                                        ~10s · URL analysis
                                                    </div>
                                                </button>
                                            </div>

                                            {generationMode === 'smart' && (
                                                <div className="space-y-2 pt-2">
                                                    <label className="text-sm font-medium text-slate-600 flex items-center gap-2">
                                                        <Filter className="h-3.5 w-3.5 text-slate-400" />
                                                        Business Vertical
                                                    </label>
                                                    <Select value={selectedVertical || 'general'} onValueChange={(val: string) => setSelectedVertical(val === 'general' ? '' : val)}>
                                                        <SelectTrigger className="bg-white text-sm">
                                                            <SelectValue placeholder="Select vertical..." />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="general">General (All Industries)</SelectItem>
                                                            {getAllVerticals().map(v => (
                                                                <SelectItem key={v.key} value={v.key}>{v.name}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    {coreKeywords.trim() && (
                                                        <p className="text-xs text-violet-600 bg-violet-50 px-2 py-1 rounded-md">
                                                            Est. {estimateNegativeCount(
                                                                coreKeywords.split(/[\n,]+/).filter(k => k.trim()).length,
                                                                selectedVertical || undefined
                                                            ).average.toLocaleString()} negatives
                                                        </p>
                                                    )}
                                                </div>
                                            )}

                                            {generationMode === 'ai' && (
                                                <div className="space-y-2 pt-2">
                                                    <label className="text-sm font-medium text-slate-600">
                                                        User Goal <span className="text-red-500">*</span>
                                                    </label>
                                                    <Select value={userGoal} onValueChange={setUserGoal}>
                                                        <SelectTrigger className="bg-white text-sm">
                                                            <SelectValue placeholder="Select goal..." />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="leads">Leads (High-Intent)</SelectItem>
                                                            <SelectItem value="calls">Calls / Appointments</SelectItem>
                                                            <SelectItem value="signups">Signups / Trials</SelectItem>
                                                            <SelectItem value="branding">Branding / Awareness</SelectItem>
                                                            <SelectItem value="ecommerce">E-commerce</SelectItem>
                                                            <SelectItem value="other">Other</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            )}

                                            {/* Generate Button */}
                                            <Button 
                                                className={`w-full mt-2 shadow-lg transition-all ${
                                                    generationMode === 'smart' 
                                                        ? 'bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-violet-200' 
                                                        : 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 shadow-indigo-200'
                                                }`}
                                                size="lg"
                                                onClick={generationMode === 'smart' ? handleSmartGenerate : handleGenerate}
                                                disabled={isGenerating || !coreKeywords || (generationMode === 'ai' && (!url || !userGoal))}
                                            >
                                                {isGenerating ? (
                                                    <>
                                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                                                        Generating...
                                                    </>
                                                ) : (
                                                    <>
                                                        {generationMode === 'smart' ? <Zap className="h-4 w-4 mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                                                        Generate {generationMode === 'smart' ? 'Smart' : 'AI'} Negatives
                                                    </>
                                                )}
                                            </Button>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>

                            {/* Right Panel: Results */}
                            <div className="lg:col-span-8">
                                <Card className="border-slate-200/60 bg-white/80 backdrop-blur-sm shadow-sm overflow-hidden">
                                    {/* Results Header */}
                                    <CardHeader className="border-b border-slate-100 bg-white/50 py-3 px-4">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                            <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
                                                Generated Keywords
                                                {generatedKeywords.length > 0 && (
                                                    <Badge className="bg-gradient-to-r from-violet-500 to-indigo-500 text-white border-0 font-semibold">
                                                        {generatedKeywords.length.toLocaleString()}
                                                    </Badge>
                                                )}
                                            </CardTitle>
                                            {generatedKeywords.length > 0 && (
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <Button 
                                                        variant="ghost" 
                                                        size="sm"
                                                        onClick={() => setShowStats(!showStats)}
                                                        className="gap-1.5 text-xs h-8"
                                                    >
                                                        <BarChart3 className="h-3.5 w-3.5" />
                                                        <span className="hidden sm:inline">Stats</span>
                                                    </Button>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="sm"
                                                        onClick={handleSave}
                                                        disabled={isSaving}
                                                        className="gap-1.5 text-xs h-8"
                                                    >
                                                        <Save className="h-3.5 w-3.5" />
                                                        <span className="hidden sm:inline">{isSaving ? 'Saving...' : 'Save'}</span>
                                                    </Button>
                                                    <Select value={exportFormat} onValueChange={(v: any) => setExportFormat(v)}>
                                                        <SelectTrigger className="w-24 h-8 text-xs">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="all">All Formats</SelectItem>
                                                            <SelectItem value="exact">Exact</SelectItem>
                                                            <SelectItem value="phrase">Phrase</SelectItem>
                                                            <SelectItem value="broad">Broad</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <Button 
                                                        variant="outline" 
                                                        size="sm"
                                                        onClick={() => handleDownload('standard')} 
                                                        className="gap-1.5 text-xs h-8"
                                                    >
                                                        <Download className="h-3.5 w-3.5" />
                                                        <span className="hidden sm:inline">CSV</span>
                                                    </Button>
                                                    <Button 
                                                        size="sm"
                                                        onClick={() => handleDownload('google-ads-editor')} 
                                                        className="gap-1.5 text-xs h-8 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white border-0"
                                                    >
                                                        <FileText className="h-3.5 w-3.5" />
                                                        <span className="hidden sm:inline">Google Ads</span>
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </CardHeader>
                                    
                                    {/* Stats Section */}
                                    {generatedKeywords.length > 0 && showStats && (
                                        <div className="px-4 py-3 bg-gradient-to-r from-slate-50 to-indigo-50/30 border-b border-slate-100">
                                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                                                {/* Total Count - Highlighted */}
                                                <div className="col-span-2 sm:col-span-1 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl p-3 text-white shadow-lg shadow-indigo-200">
                                                    <div className="text-xs font-medium text-white/80">Total Negatives</div>
                                                    <div className="text-2xl font-bold">{generatedKeywords.length.toLocaleString()}</div>
                                                </div>
                                                
                                                {/* Top Categories */}
                                                {topCategories.map(([category, count]) => {
                                                    const colors = CATEGORY_COLORS[category] || { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' };
                                                    return (
                                                        <div 
                                                            key={category} 
                                                            className={`${colors.bg} rounded-xl p-3 border ${colors.border}`}
                                                        >
                                                            <div className={`text-xs font-medium ${colors.text} opacity-70 truncate`}>{category}</div>
                                                            <div className={`text-xl font-bold ${colors.text}`}>{count}</div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    <CardContent className="p-0">
                                        {displayKeywords.length > 0 ? (
                                            <div className="max-h-[500px] overflow-auto">
                                                {/* Mobile Card View */}
                                                <div className="sm:hidden divide-y divide-slate-100">
                                                    {displayKeywords.slice(0, 50).map((item) => {
                                                        const colors = CATEGORY_COLORS[item.category] || { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200' };
                                                        return (
                                                            <div key={item.id} className="p-3 hover:bg-slate-50/50">
                                                                <div className="flex items-start justify-between gap-2">
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="font-mono text-sm font-medium text-slate-800 truncate">
                                                                            {item.keyword}
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex flex-col items-end gap-1 shrink-0">
                                                                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-indigo-50 text-indigo-600 border-indigo-200">
                                                                            {item.matchType || 'Phrase'}
                                                                        </Badge>
                                                                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${colors.bg} ${colors.text}`}>
                                                                            {item.category.split(' ')[0]}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                    {displayKeywords.length > 50 && (
                                                        <div className="p-3 text-center text-xs text-slate-500">
                                                            Showing 50 of {displayKeywords.length} keywords. Export to see all.
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Desktop Table View */}
                                                <Table className="hidden sm:table">
                                                    <TableHeader className="bg-slate-50/80 sticky top-0 z-10">
                                                        <TableRow>
                                                            <TableHead className="w-[15%] text-xs font-semibold text-slate-600">Match Type</TableHead>
                                                            <TableHead className="w-[55%] text-xs font-semibold text-slate-600">Keyword</TableHead>
                                                            <TableHead className="w-[20%] text-xs font-semibold text-slate-600">Category</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {displayKeywords.map((item) => {
                                                            const colors = CATEGORY_COLORS[item.category] || { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200' };
                                                            return (
                                                                <TableRow key={item.id} className="hover:bg-indigo-50/30 transition-colors">
                                                                    <TableCell>
                                                                        <Badge variant="outline" className="text-xs bg-indigo-50 text-indigo-700 border-indigo-200">
                                                                            {(item.matchType || 'Phrase').charAt(0).toUpperCase() + (item.matchType || 'phrase').slice(1)}
                                                                        </Badge>
                                                                    </TableCell>
                                                                    <TableCell className="text-slate-600 text-sm">
                                                                        <span className="font-mono text-indigo-600">{item.keyword}</span>
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        <span className={`inline-flex px-2 py-1 rounded-md text-xs font-medium ${colors.bg} ${colors.text} ${colors.border} border`}>
                                                                            {item.category}
                                                                        </span>
                                                                    </TableCell>
                                                                </TableRow>
                                                            );
                                                        })}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        ) : generatedKeywords.length > 0 ? (
                                            <div className="flex flex-col items-center justify-center p-12 text-center">
                                                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                                                    <Filter className="h-8 w-8 text-slate-400" />
                                                </div>
                                                <h3 className="text-lg font-semibold text-slate-800">No Keywords Match Filters</h3>
                                                <p className="text-slate-500 max-w-md mt-2 text-sm">
                                                    Try adjusting your category filters to see more results.
                                                </p>
                                                <Button variant="outline" onClick={() => setSelectedCategories(new Set())} className="mt-4">
                                                    Clear All Filters
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center p-12 text-center min-h-[400px]">
                                                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center mb-4">
                                                    <Sparkles className="h-10 w-10 text-indigo-400" />
                                                </div>
                                                <h3 className="text-lg font-semibold text-slate-800">Ready to Generate</h3>
                                                <p className="text-slate-500 max-w-md mt-2 text-sm">
                                                    Fill in your target URL and core keywords. Our AI will analyze your website to generate comprehensive negative keywords.
                                                </p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="history">
                        <Card className="border-slate-200/60 bg-white/80 backdrop-blur-sm shadow-sm">
                            <CardHeader className="border-b border-slate-100">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <FolderOpen className="h-5 w-5 text-indigo-500" />
                                    Saved Negative Keyword Lists
                                </CardTitle>
                                <CardDescription className="text-sm">
                                    View, load, or delete your saved negative keyword lists
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-4">
                                {savedItems.length > 0 ? (
                                    <div className="space-y-3">
                                        {savedItems.map(item => (
                                            <div
                                                key={item.id}
                                                className="p-4 bg-white rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all"
                                            >
                                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                                                    <div className="space-y-1 flex-1 min-w-0">
                                                        <div className="font-semibold text-slate-800 truncate">{item.name}</div>
                                                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                                                            <span className="flex items-center gap-1">
                                                                <Clock className="w-3 h-3" />
                                                                {new Date(item.timestamp).toLocaleDateString()}
                                                            </span>
                                                            {item.data?.generatedKeywords && (
                                                                <Badge variant="outline" className="text-xs">
                                                                    {item.data.generatedKeywords.length} keywords
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            onClick={() => handleLoadSavedItem(item.id)}
                                                            variant="outline"
                                                            size="sm"
                                                            className="gap-1.5 text-xs"
                                                        >
                                                            <FolderOpen className="w-3.5 h-3.5" />
                                                            Load
                                                        </Button>
                                                        <Button
                                                            onClick={() => handleDeleteSavedItem(item.id)}
                                                            variant="outline"
                                                            size="sm"
                                                            className="gap-1.5 text-xs text-red-600 border-red-200 hover:bg-red-50"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                            Delete
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-16 text-center">
                                        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                                            <FolderOpen className="w-8 h-8 text-slate-400" />
                                        </div>
                                        <p className="text-slate-500 text-sm">
                                            No saved negative keyword lists found.<br />
                                            Save your generated keywords to see them here.
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
};
