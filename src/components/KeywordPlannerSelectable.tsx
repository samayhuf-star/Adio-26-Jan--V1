import React, { useState, useEffect } from 'react';
import { Sparkles, Save, AlertCircle, CheckSquare, Square, ShieldCheck } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Slider } from './ui/slider';
import { api } from '../utils/api';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { generateComprehensiveNegativeKeywords } from '../utils/negativeKeywords';
import { historyService } from '../utils/historyService';
import { notifications } from '../utils/notifications';
import { DEFAULT_SEED_KEYWORDS } from '../utils/defaultExamples';

interface KeywordPlannerSelectableProps {
    initialData?: any;
    onKeywordsSelected?: (keywords: string[]) => void;
    selectedKeywords?: string[];
    onNegativeKeywordsChange?: (negativeKeywords: string) => void;
}

export const KeywordPlannerSelectable = ({ 
    initialData, 
    onKeywordsSelected,
    selectedKeywords: externalSelectedKeywords = [],
    onNegativeKeywordsChange
}: KeywordPlannerSelectableProps) => {
    const [seedKeywords, setSeedKeywords] = useState(DEFAULT_SEED_KEYWORDS);
    const [negativeKeywords, setNegativeKeywords] = useState('');
    const [negativeKeywordsCount, setNegativeKeywordsCount] = useState(750); // Slider value
    const [generatedKeywords, setGeneratedKeywords] = useState<string[]>([]);
    const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [apiStatus, setApiStatus] = useState<'unknown' | 'ok' | 'error'>('unknown');
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [showAllKeywords, setShowAllKeywords] = useState(false);
    const [keywordsToShow, setKeywordsToShow] = useState(3); // Show first 3 keywords initially
    
    // Match types - all selected by default
    const [matchTypes, setMatchTypes] = useState({
        broad: true,
        phrase: true,
        exact: true
    });

    useEffect(() => {
        if (initialData) {
            // Convert newline-separated to comma-separated for display in input field
            const seedKw = initialData.seedKeywords || '';
            const formattedSeedKw = seedKw.includes('\n') && !seedKw.includes(',')
                ? seedKw.split('\n').map((s: string) => s.trim()).filter(Boolean).join(', ')
                : seedKw;
            
            setSeedKeywords(formattedSeedKw);
            setNegativeKeywords(initialData.negativeKeywords || '');
            // Only set generated keywords if they exist in initialData
            if (initialData.generatedKeywords && initialData.generatedKeywords.length > 0) {
                // Convert keyword objects to strings if needed
                const keywordStrings = initialData.generatedKeywords.map((kw: any) => {
                    if (typeof kw === 'string') return kw;
                    return kw?.text || kw?.keyword || String(kw || '');
                });
                setGeneratedKeywords(keywordStrings);
            }
            setMatchTypes(initialData.matchTypes || { broad: true, phrase: true, exact: true });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Only run on mount, not when initialData changes

    // Sync external selected keywords
    useEffect(() => {
        if (externalSelectedKeywords.length > 0) {
            setSelectedKeywords(externalSelectedKeywords);
        }
    }, [externalSelectedKeywords]);

    // Notify parent when selection changes
    useEffect(() => {
        if (onKeywordsSelected) {
            onKeywordsSelected(selectedKeywords);
        }
    }, [selectedKeywords, onKeywordsSelected]);

    const handleGenerate = async (isAppend: boolean = false) => {
        console.log('🚀 handleGenerate called with isAppend:', isAppend);
        console.log('📝 seedKeywords:', seedKeywords);
        console.log('🚫 negativeKeywords length:', negativeKeywords.split('\n').filter(Boolean).length);
        console.log('🚫 negativeKeywords (first 100 chars):', negativeKeywords.substring(0, 100));
        
        if (!seedKeywords.trim()) {
            notifications.warning('Please enter seed keywords', {
                title: 'Seed Keywords Required'
            });
            return;
        }

        // Bug_44: Validate minimum character length for keywords
        const seedKeywordsArray = seedKeywords.split(',').map(k => k.trim()).filter(Boolean);
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

        // Bug_19: Validate that at least one match type is selected
        if (!matchTypes.broad && !matchTypes.phrase && !matchTypes.exact) {
            notifications.warning('Please select at least one match type (Broad, Phrase, or Exact)', {
                title: 'Match Type Required',
                description: 'You must select at least one match type checkbox before generating keywords.'
            });
            return;
        }

        setIsGenerating(true);
        console.log('✅ isGenerating set to true');

        try {
            console.log('Calling API with:', { seeds: seedKeywords, negatives: negativeKeywords });
            
            const response = await api.post('/generate-keywords', {
                seeds: seedKeywords,
                negatives: negativeKeywords
            }) as any;

            console.log('API Response:', response);
            console.log('Response type:', typeof response);
            console.log('Response.keywords:', response?.keywords);
            console.log('Is Array?', Array.isArray(response?.keywords));

            if (response.keywords && Array.isArray(response.keywords)) {
                console.log('✅ Valid response received with', response.keywords.length, 'keywords');
                
                // Extract keyword text, remove duplicates, and normalize
                const keywordTexts = response.keywords
                    .map((k: any) => {
                        const text = (k.text || k.keyword || k).toString().trim().toLowerCase();
                        return text;
                    })
                    .filter((text: string) => text.length >= 3 && text.length <= 50);
                
                // Remove duplicates
                const uniqueKeywords = Array.from(new Set(keywordTexts));
                console.log('Unique keywords after deduplication:', uniqueKeywords.length);
                console.log('Sample keywords:', uniqueKeywords.slice(0, 5));
                
                // Shuffle for variety
                const shuffled = [...uniqueKeywords].sort(() => Math.random() - 0.5);
                
                // Apply match type formatting
                const formattedKeywords: string[] = [];
                (shuffled as string[]).forEach((keyword: string) => {
                    if (matchTypes.broad) {
                        formattedKeywords.push(keyword);
                    }
                    if (matchTypes.phrase) {
                        formattedKeywords.push(`"${keyword}"`);
                    }
                    if (matchTypes.exact) {
                        formattedKeywords.push(`[${keyword}]`);
                    }
                });
                
                // Final shuffle to mix match types naturally
                const variedKeywords = [...formattedKeywords].sort(() => Math.random() - 0.5);

                if (isAppend) {
                    setGeneratedKeywords(prev => {
                        const newKeywords = [...prev, ...variedKeywords];
                        // Auto-select all keywords when generated
                        setSelectedKeywords(newKeywords);
                        return newKeywords;
                    });
                } else {
                    setGeneratedKeywords(variedKeywords);
                    // Auto-select all keywords when generated
                    setSelectedKeywords(variedKeywords);
                }
                // Reset keywords display to show summary
                setKeywordsToShow(3);
                setShowAllKeywords(false);
                setApiStatus('ok');
            } else {
                console.error('Invalid response format:', response);
                console.error('Response keys:', Object.keys(response));
                console.error('Full response:', JSON.stringify(response));
                notifications.error(`Invalid response from server. Response keys: ${Object.keys(response).join(', ')}. Check console for full details.`, {
                    title: 'API Error'
                });
                setApiStatus('error');
                setErrorMessage('Invalid response format from server');
            }
        } catch (error: any) {
            console.log('ℹ️ Backend unavailable or timeout - using local fallback generation');
            console.log('Error details:', error.message || error);
            
            // FALLBACK: Generate mock keywords locally when API is unavailable
            // Handle both comma-separated and newline-separated seed keywords
            let seeds = seedKeywords.includes(',') 
                ? seedKeywords.split(',').map(s => s.trim()).filter(Boolean)
                : seedKeywords.split('\n').map(s => s.trim()).filter(Boolean);
            
            // Auto-split long seeds (>40 chars) into meaningful keywords
            const processedSeeds: string[] = [];
            seeds.forEach(seed => {
                if (seed.length > 40) {
                    // Split by spaces and extract 2-3 word phrases
                    const words = seed.split(/[\s,;]+/).filter(w => w.length > 2);
                    
                    // Remove consecutive duplicates
                    const uniqueWords: string[] = [];
                    words.forEach(word => {
                        if (uniqueWords.length === 0 || uniqueWords[uniqueWords.length - 1].toLowerCase() !== word.toLowerCase()) {
                            uniqueWords.push(word);
                        }
                    });
                    
                    // Create 2-3 word phrases
                    for (let i = 0; i < uniqueWords.length; i++) {
                        if (i + 1 < uniqueWords.length) {
                            processedSeeds.push(`${uniqueWords[i]} ${uniqueWords[i + 1]}`);
                        }
                        if (i + 2 < uniqueWords.length) {
                            processedSeeds.push(`${uniqueWords[i]} ${uniqueWords[i + 1]} ${uniqueWords[i + 2]}`);
                        }
                    }
                } else {
                    processedSeeds.push(seed);
                }
            });
            
            seeds = [...new Set(processedSeeds)]; // Remove duplicates
            const negatives = negativeKeywords.split(/[,\n]/).map(n => n.trim().toLowerCase()).filter(Boolean);
            
            const mockKeywords: string[] = [];
            const seenKeywords = new Set<string>();
            
            // Professional keyword expansion patterns
            const prefixes = [
                'best', 'top', 'affordable', 'professional', 'expert', 'certified', 'licensed',
                'local', 'nearby', 'emergency', '24/7', 'same day', 'fast', 'reliable',
                'trusted', 'reviews', 'compare', 'find', 'get', 'buy', 'hire', 'contact', 'call'
            ];
            
            const suffixes = [
                'near me', 'online', 'service', 'services', 'company', 'experts', 'specialists',
                'phone number', 'customer service', 'support', 'help', 'assistance',
                'location', 'address', 'hours', 'quote', 'estimate', 'prices', 'cost',
                'reviews', 'ratings', 'deals', 'offers', 'discount', 'coupon'
            ];
            
            const intentModifiers = [
                'how to', 'what is', 'where to', 'when to', 'why choose',
                'get quote', 'book now', 'schedule', 'compare', 'find best',
                'top rated', 'best price', 'affordable', 'cheap', 'discount'
            ];
            
            const locationModifiers = [
                'near me', 'local', 'in my area', 'nearby', 'close to me',
                'same city', 'same state', 'same zip code'
            ];
            
            // Helper to check if keyword should be excluded
            const shouldExclude = (keyword: string): boolean => {
                const lowerKeyword = keyword.toLowerCase();
                return negatives.some(neg => lowerKeyword.includes(neg));
            };
            
            // Helper to add keyword if unique and not excluded
            const addKeyword = (keyword: string) => {
                const normalized = keyword.toLowerCase().trim();
                if (normalized.length >= 3 && normalized.length <= 50 && 
                    !seenKeywords.has(normalized) && !shouldExclude(keyword)) {
                    seenKeywords.add(normalized);
                    mockKeywords.push(keyword);
                }
            };
            
            seeds.forEach(seed => {
                const cleanSeed = seed.trim().toLowerCase();
                if (cleanSeed.length < 3) return;
                
                // 1. Add base seed
                addKeyword(seed);
                
                // 2. Add prefix + seed variations (limit to avoid too many)
                const selectedPrefixes = prefixes.slice(0, Math.min(8, prefixes.length))
                    .sort(() => Math.random() - 0.5);
                selectedPrefixes.forEach(prefix => {
                    addKeyword(`${prefix} ${seed}`);
                });
                
                // 3. Add seed + suffix variations
                const selectedSuffixes = suffixes.slice(0, Math.min(10, suffixes.length))
                    .sort(() => Math.random() - 0.5);
                selectedSuffixes.forEach(suffix => {
                    addKeyword(`${seed} ${suffix}`);
                });
                
                // 4. Add intent-based variations
                const selectedIntents = intentModifiers.slice(0, Math.min(5, intentModifiers.length))
                    .sort(() => Math.random() - 0.5);
                selectedIntents.forEach(intent => {
                    addKeyword(`${intent} ${seed}`);
                });
                
                // 5. Add location-based variations
                locationModifiers.forEach(location => {
                    addKeyword(`${seed} ${location}`);
                });
                
                // 6. Add question variations
                const questions = ['how to', 'what is', 'where is', 'when does', 'why'];
                questions.forEach(question => {
                    addKeyword(`${question} ${seed}`);
                });
                
                // 7. Create long-tail variations (3-4 words)
                if (cleanSeed.split(' ').length <= 2) {
                    const seedWords = cleanSeed.split(' ');
                    if (seedWords.length === 1) {
                        // Single word: add professional combinations
                        addKeyword(`professional ${seed} service`);
                        addKeyword(`best ${seed} near me`);
                        addKeyword(`affordable ${seed} company`);
                    } else if (seedWords.length === 2) {
                        // Two words: add third word
                        addKeyword(`${seedWords[0]} ${seedWords[1]} service`);
                        addKeyword(`best ${seedWords[0]} ${seedWords[1]}`);
                        addKeyword(`${seedWords[0]} ${seedWords[1]} near me`);
                    }
                }
            });
            
            // 8. Add cross-seed combinations (if multiple seeds)
            if (seeds.length > 1) {
                for (let i = 0; i < Math.min(seeds.length, 3); i++) {
                    for (let j = i + 1; j < Math.min(seeds.length, 3); j++) {
                        const combined = `${seeds[i]} and ${seeds[j]}`;
                        if (combined.length <= 50) {
                            addKeyword(combined);
                        }
                    }
                }
            }
            
            // Remove duplicates and shuffle for variety
            const uniqueKeywords = Array.from(new Set(mockKeywords.map(k => k.toLowerCase().trim())))
                .map(k => {
                    // Find original case version if available
                    const original = mockKeywords.find(mk => mk.toLowerCase().trim() === k);
                    return original || k;
                });
            
            // Shuffle for randomness
            const shuffled = [...uniqueKeywords].sort(() => Math.random() - 0.5);
            
            // Apply match type formatting
            const formattedKeywords: string[] = [];
            shuffled.forEach((keyword: string) => {
                if (matchTypes.broad) {
                    formattedKeywords.push(keyword);
                }
                if (matchTypes.phrase) {
                    formattedKeywords.push(`"${keyword}"`);
                }
                if (matchTypes.exact) {
                    formattedKeywords.push(`[${keyword}]`);
                }
            });
            
            // Final shuffle to mix match types naturally
            const finalShuffled = [...formattedKeywords].sort(() => Math.random() - 0.5);
            
            // Use all keywords (no artificial limiting) - let the natural generation determine count
            const variedKeywords = finalShuffled;
            
            if (isAppend) {
                setGeneratedKeywords(prev => {
                    const newKeywords = [...prev, ...variedKeywords];
                    // Auto-select all keywords when generated
                    setSelectedKeywords(newKeywords);
                    return newKeywords;
                });
            } else {
                setGeneratedKeywords(variedKeywords);
                // Auto-select all keywords when generated
                setSelectedKeywords(variedKeywords);
            }
            
            // Reset keywords display to show summary
            setKeywordsToShow(3);
            setShowAllKeywords(false);
            setApiStatus('error');
            console.log('Generated mock keywords:', formattedKeywords.length);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSelectAll = () => {
        if (selectedKeywords.length === generatedKeywords.length) {
            setSelectedKeywords([]);
        } else {
            setSelectedKeywords([...generatedKeywords]);
        }
    };

    const handleClearAllKeywords = () => {
        setGeneratedKeywords([]);
        setSelectedKeywords([]);
    };

    const handleRemoveDuplicateKeywords = () => {
        const uniqueKeywords = Array.from(new Set(generatedKeywords));
        setGeneratedKeywords(uniqueKeywords);
        // Also update selected keywords to remove duplicates
        const uniqueSelected = selectedKeywords.filter(k => uniqueKeywords.includes(k));
        setSelectedKeywords(uniqueSelected);
    };

    const toggleKeyword = (keyword: string) => {
        setSelectedKeywords(prev => {
            if (prev.includes(keyword)) {
                return prev.filter(k => k !== keyword);
            } else {
                return [...prev, keyword];
            }
        });
    };

    const handleSave = async () => {
        if (generatedKeywords.length === 0) return;
        
        // Bug_31: Validate that plan name is not empty or whitespace-only
        const planName = seedKeywords.trim();
        if (!planName || planName.length === 0) {
            notifications.warning('Please enter seed keywords before saving the plan', {
                title: 'Invalid Plan Name'
            });
            return;
        }
        
        setIsSaving(true);
        try {
            await historyService.save(
                'keyword-planner',
                `Plan: ${seedKeywords.substring(0, 30)}...`,
                { seedKeywords, negativeKeywords, generatedKeywords, matchTypes, selectedKeywords }
            );
            // Bug_43: Use toast notification instead of alert
            notifications.success('Keyword plan saved successfully!', {
                title: 'Saved',
                description: 'Your keyword plan has been saved.'
            });
        } catch (error) {
            console.error("Save failed", error);
            notifications.error('Failed to save. Please try again.', {
                title: 'Save Failed'
            });
        } finally {
            setIsSaving(false);
        }
    };

    const allSelected = generatedKeywords.length > 0 && selectedKeywords.length === generatedKeywords.length;

    return (
        <div className="p-8">
            <div className="mb-6">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                    AI Keyword Planner and Negative List Builder
                </h1>
                <p className="text-slate-500">
                    Generate comprehensive keyword lists using AI based on your seed keywords and negative filters
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Panel: Define Your Strategy */}
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-200/60 shadow-xl">
                    <h2 className="text-xl font-bold text-indigo-600 mb-6">
                        1. Define Your Strategy
                    </h2>

                    {/* Seed Keywords */}
                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Seed Keywords (3-5 Core Ideas, comma-separated)
                        </label>
                        <Input
                            placeholder="airline number, contact airline, delta phone number"
                            value={seedKeywords}
                            onChange={(e) => setSeedKeywords(e.target.value)}
                            className="bg-white border-slate-300"
                        />
                        <p className="text-xs text-slate-500 mt-1">
                            These are the primary topics the AI will build upon.
                        </p>
                    </div>

                    {/* Target Match Types */}
                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-slate-700 mb-3">
                            Target Match Types
                        </label>
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <input 
                                    type="checkbox"
                                    id="broad-planner" 
                                    checked={matchTypes.broad}
                                    onChange={(e) => {
                                        setMatchTypes(prev => ({...prev, broad: e.target.checked}));
                                    }}
                                    className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-teal-500 focus:ring-2 cursor-pointer"
                                />
                                <label htmlFor="broad-planner" className="text-sm text-slate-600 cursor-pointer select-none">
                                    Broad Match
                                </label>
                            </div>
                            <div className="flex items-center gap-2">
                                <input 
                                    type="checkbox"
                                    id="phrase-planner" 
                                    checked={matchTypes.phrase}
                                    onChange={(e) => {
                                        setMatchTypes(prev => ({...prev, phrase: e.target.checked}));
                                    }}
                                    className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-teal-500 focus:ring-2 cursor-pointer"
                                />
                                <label htmlFor="phrase-planner" className="text-sm text-slate-600 cursor-pointer select-none">
                                    Phrase Match "keyword"
                                </label>
                            </div>
                            <div className="flex items-center gap-2">
                                <input 
                                    type="checkbox"
                                    id="exact-planner" 
                                    checked={matchTypes.exact}
                                    onChange={(e) => {
                                        setMatchTypes(prev => ({...prev, exact: e.target.checked}));
                                    }}
                                    className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-teal-500 focus:ring-2 cursor-pointer"
                                />
                                <label htmlFor="exact-planner" className="text-sm text-slate-600 cursor-pointer select-none">
                                    Exact Match [keyword]
                                </label>
                            </div>
                        </div>
                        <p className="text-xs text-slate-500 mt-2">
                            Keywords will be generated to fit the characteristics of the selected match types.
                        </p>
                    </div>

                    {/* Negative Keywords */}
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-3">
                            <label className="block text-sm font-semibold text-slate-700">
                                Negative Keywords (One term/phrase per line)
                            </label>
                        </div>

                        {/* Slider for keyword count */}
                        <div className="mb-3">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs text-slate-600">Keywords to Generate:</span>
                                <span className="text-xs font-semibold text-indigo-600">{negativeKeywordsCount}</span>
                            </div>
                                <Slider
                                value={[negativeKeywordsCount]}
                                onValueChange={(value: number[]) => setNegativeKeywordsCount(value[0])}
                                min={100}
                                max={1000}
                                step={50}
                                className="w-full"
                            />
                            <div className="flex justify-between text-xs text-slate-400 mt-1">
                                <span>100</span>
                                <span>1000</span>
                            </div>
                        </div>

                        {/* Editable negative keywords box */}
                        <div className="bg-white border border-slate-300 rounded-lg overflow-hidden h-[280px]">
                            <Textarea
                                value={negativeKeywords}
                                onChange={(e) => {
                                    const newValue = e.target.value;
                                    setNegativeKeywords(newValue);
                                    if (onNegativeKeywordsChange) {
                                        onNegativeKeywordsChange(newValue);
                                    }
                                }}
                                placeholder="Enter negative keywords (one per line)&#10;e.g.&#10;cheap&#10;discount&#10;reviews&#10;job&#10;free"
                                className="w-full h-full border-0 font-mono text-xs resize-none p-3 focus:ring-2 focus:ring-teal-500 focus:ring-offset-0 bg-transparent"
                                style={{ minHeight: '280px', maxHeight: '280px', overflowY: 'auto' }}
                            />
                                                </div>
                        <div className="flex items-center justify-between mt-2">
                            <p className="text-xs text-slate-500">
                                The AI will strictly avoid generating keywords containing these terms. Edit directly or adjust the slider and click "Generate" for your desired quantity.
                            </p>
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                        const lines = negativeKeywords.split('\n').filter(k => k.trim());
                                        const uniqueLines = Array.from(new Set(lines.map(l => l.trim().toLowerCase())));
                                        const cleaned = uniqueLines.join('\n');
                                        setNegativeKeywords(cleaned);
                                        if (onNegativeKeywordsChange) {
                                            onNegativeKeywordsChange(cleaned);
                                        }
                                    }}
                                    className="h-7 text-xs"
                                >
                                    Remove Duplicates
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                        setNegativeKeywords('');
                                        if (onNegativeKeywordsChange) {
                                            onNegativeKeywordsChange('');
                                        }
                                    }}
                                    className="h-7 text-xs text-red-600 hover:text-red-700"
                                >
                                    Clear All
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-3">
                        <Button
                            onClick={() => {
                                console.log('🔘 Generate button clicked!');
                                console.log('🔘 isGenerating:', isGenerating);
                                console.log('🔘 seedKeywords.trim():', seedKeywords.trim());
                                console.log('🔘 Button disabled:', isGenerating || !seedKeywords.trim());
                                handleGenerate(false);
                            }}
                            disabled={isGenerating || !seedKeywords.trim()}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-6"
                        >
                            {isGenerating ? (
                                <>
                                    <Sparkles className="w-5 h-5 mr-2 animate-spin" />
                                    Generating Keywords...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-5 h-5 mr-2" />
                                    Generate 100-300 Keywords (Faster)
                                </>
                            )}
                        </Button>

                        {generatedKeywords.length > 0 && (
                            <Button
                                onClick={() => handleGenerate(true)}
                                disabled={isGenerating || !seedKeywords.trim()}
                                variant="outline"
                                className="w-full border-indigo-300 text-indigo-700 hover:bg-indigo-50 py-6"
                            >
                                Append More Keywords (Total: {generatedKeywords.length})
                            </Button>
                        )}
                    </div>
                </div>

                {/* Right Panel: Generated Keyword List with Selection */}
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-200/60 shadow-xl flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-indigo-600">
                            2. Generated Keyword List
                        </h2>
                        {generatedKeywords.length > 0 && (
                            <div className="flex gap-2">
                                <Button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    variant="outline"
                                    size="sm"
                                    className="gap-2"
                                >
                                    <Save className="w-4 h-4" />
                                    {isSaving ? 'Saving...' : 'Save'}
                                </Button>
                            </div>
                        )}
                    </div>

                    {generatedKeywords.length > 0 && (
                        <>
                            {/* Summary Card */}
                            <div className="mb-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-5 border border-indigo-200 shadow-sm">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-800 mb-1">
                                            Keywords Generated Successfully! ✨
                                        </h3>
                                        <p className="text-sm text-slate-600">
                                            {generatedKeywords.length} keywords ready • {selectedKeywords.length} selected
                                        </p>
                                    </div>
                                    <Button
                                        onClick={() => {
                                            if (!showAllKeywords) {
                                                setShowAllKeywords(true);
                                                setKeywordsToShow(generatedKeywords.length);
                                            } else {
                                                setShowAllKeywords(false);
                                                setKeywordsToShow(3);
                                            }
                                        }}
                                        variant="outline"
                                        size="sm"
                                        className="text-xs"
                                    >
                                        {showAllKeywords ? 'Show Summary' : `See All (${generatedKeywords.length})`}
                                    </Button>
                                </div>
                                
                                {/* Keyword Statistics */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                                    <div className="bg-white/80 rounded-lg p-3 border border-indigo-100">
                                        <div className="text-xs text-slate-500 mb-1">Total Keywords</div>
                                        <div className="text-xl font-bold text-indigo-600">{generatedKeywords.length}</div>
                                    </div>
                                    <div className="bg-white/80 rounded-lg p-3 border border-indigo-100">
                                        <div className="text-xs text-slate-500 mb-1">Selected</div>
                                        <div className="text-xl font-bold text-purple-600">{selectedKeywords.length}</div>
                                    </div>
                                    <div className="bg-white/80 rounded-lg p-3 border border-indigo-100">
                                        <div className="text-xs text-slate-500 mb-1">Broad Match</div>
                                        <div className="text-xl font-bold text-blue-600">
                                            {generatedKeywords.filter((k: string) => {
                                                return !k.startsWith('"') && !k.startsWith('[');
                                            }).length}
                                        </div>
                                    </div>
                                    <div className="bg-white/80 rounded-lg p-3 border border-indigo-100">
                                        <div className="text-xs text-slate-500 mb-1">Phrase/Exact</div>
                                        <div className="text-xl font-bold text-indigo-600">
                                            {generatedKeywords.filter((k: string) => {
                                                return k.startsWith('"') || k.startsWith('[');
                                            }).length}
                                        </div>
                                    </div>
                                </div>

                                {/* Structure Info */}
                                <div className="bg-white/90 rounded-lg p-4 border border-indigo-200">
                                    <div className="text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">Campaign Structure</div>
                                    <div className="flex flex-wrap gap-2">
                                        {matchTypes.broad && (
                                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                                                Broad Match
                                            </span>
                                        )}
                                        {matchTypes.phrase && (
                                            <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs font-medium">
                                                Phrase Match
                                            </span>
                                        )}
                                        {matchTypes.exact && (
                                            <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                                                Exact Match
                                            </span>
                                        )}
                                    </div>
                                    <div className="mt-3 text-xs text-slate-600">
                                        <div className="font-medium mb-1">Sample Keywords:</div>
                                        <div className="flex flex-wrap gap-1">
                                            {generatedKeywords.slice(0, 8).map((kw: string, idx: number) => {
                                                return (
                                                    <span key={idx} className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-xs font-mono">
                                                        {kw.length > 25 ? kw.substring(0, 25) + '...' : kw}
                                                    </span>
                                                );
                                            })}
                                            {generatedKeywords.length > 8 && (
                                                <span className="px-2 py-0.5 text-slate-500 text-xs">
                                                    +{generatedKeywords.length - 8} more
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-2 mt-4">
                                    <Button
                                        onClick={handleSelectAll}
                                        variant="outline"
                                        size="sm"
                                        className="flex-1 gap-2"
                                    >
                                        {allSelected ? (
                                            <>
                                                <Square className="w-4 h-4" />
                                                Deselect All
                                            </>
                                        ) : (
                                            <>
                                                <CheckSquare className="w-4 h-4" />
                                                Select All ({generatedKeywords.length})
                                            </>
                                        )}
                                    </Button>
                                    <Button
                                        onClick={handleRemoveDuplicateKeywords}
                                        variant="outline"
                                        size="sm"
                                        className="text-xs"
                                    >
                                        Remove Duplicates
                                    </Button>
                                    <Button
                                        onClick={handleClearAllKeywords}
                                        variant="outline"
                                        size="sm"
                                        className="text-xs text-red-600 hover:text-red-700"
                                    >
                                        Clear All
                                    </Button>
                                </div>
                            </div>

                            {selectedKeywords.length === 0 && (
                                <div className="mb-4 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg">
                                    <p className="text-sm text-amber-800 flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4" />
                                        Please select keywords to proceed to the next step
                                    </p>
                                </div>
                            )}
                        </>
                    )}

                    {generatedKeywords.length > 0 ? (
                        <div className="flex-1 bg-slate-50 rounded-xl border border-slate-200 p-4 overflow-y-auto max-h-[600px] flex flex-col">
                            <div className="space-y-1 flex-1">
                                {generatedKeywords.slice(0, keywordsToShow).map((keyword, idx) => {
                                    const isSelected = selectedKeywords.includes(keyword);
                                    return (
                                        <div
                                            key={idx}
                                            className={`px-3 py-2 rounded border cursor-pointer transition-all text-sm font-mono flex items-center gap-3 ${
                                                isSelected 
                                                    ? 'bg-indigo-50 border-indigo-300 hover:bg-indigo-100' 
                                                    : 'bg-white border-slate-200 hover:border-indigo-200 hover:bg-slate-50'
                                            }`}
                                        >
                                            <input 
                                                type="checkbox"
                                                id={`keyword-checkbox-${idx}`}
                                                checked={isSelected}
                                                onChange={(e) => {
                                                    if (e.target.checked !== isSelected) {
                                                        toggleKeyword(keyword);
                                                    }
                                                }}
                                                className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-teal-500 focus:ring-2 cursor-pointer"
                                            />
                                            <label 
                                                htmlFor={`keyword-checkbox-${idx}`}
                                                className={`flex-1 cursor-pointer select-none ${isSelected ? 'text-green-700 font-medium' : 'text-slate-700'}`}
                                            >
                                                {keyword}
                                            </label>
                                        </div>
                                    );
                                })}
                            </div>
                            
                            {/* Load More / See More Button */}
                            {keywordsToShow < generatedKeywords.length && (
                                <div className="mt-4 pt-4 border-t border-slate-200 flex justify-center">
                                    <Button
                                        onClick={() => {
                                            const newCount = Math.min(keywordsToShow + 20, generatedKeywords.length);
                                            setKeywordsToShow(newCount);
                                            if (newCount >= generatedKeywords.length) {
                                                setShowAllKeywords(true);
                                            }
                                        }}
                                        variant="outline"
                                        size="sm"
                                        className="text-xs"
                                    >
                                        Load More ({generatedKeywords.length - keywordsToShow} remaining)
                                    </Button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex-1 bg-slate-50 rounded-xl border border-slate-200 p-4 flex items-center justify-center">
                            <div className="text-center">
                                <Sparkles className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                                <p className="text-slate-500">
                                    Enter seed keywords and click "Generate" to create your keyword list
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};