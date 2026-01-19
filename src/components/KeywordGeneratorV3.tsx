import React, { useState, useEffect } from 'react';
import { Sparkles, Copy, Save, Download, FolderOpen, Trash2, Shuffle, MinusCircle, Lightbulb } from 'lucide-react';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Label } from './ui/label';
import { KeywordPlanner } from './KeywordPlanner';
import { KeywordMixer } from './KeywordMixer';
import { NegativeKeywordsBuilder } from './NegativeKeywordsBuilder';
import { historyService } from '../utils/historyService';
import { notifications } from '../utils/notifications';
import { DEFAULT_NEGATIVE_KEYWORDS as DEFAULT_NEG_KW } from '../utils/defaultExamples';
import { ApiStatusIndicator } from './ApiStatusIndicator';

// Fill Info Presets for testing
type FillInfoPreset = {
    planner: {
        seedKeywords: string;
        negativeKeywords: string;
        matchTypes: { broad: boolean; phrase: boolean; exact: boolean };
    };
    mixer: {
        listA: string;
        listB: string;
        listC: string;
        matchTypes: { broad: boolean; phrase: boolean; exact: boolean };
    };
    negatives: {
        url: string;
        coreKeywords: string;
        userGoal: string;
        targetLocation: string;
        competitorBrands: string;
        excludeCompetitors: boolean;
        keywordCount: number;
    };
};

const FILL_INFO_PRESETS: FillInfoPreset[] = [
    {
        planner: {
            seedKeywords: 'airline cancellation help, flight credit assistance, speak to airline agent, 24/7 airline hotline, upgrade my flight',
            negativeKeywords: 'jobs\nsalary\ncomplaint\ncheap\ndiy\nreview\nreddit\nwiki\nmap',
            matchTypes: { broad: true, phrase: true, exact: true }
        },
        mixer: {
            listA: 'plumber\nplumbing\ndrain cleaning\npipe repair',
            listB: 'near me\nlocal\nemergency\n24 hour',
            listC: 'repair\ninstallation\nreplacement\nservice',
            matchTypes: { broad: true, phrase: true, exact: true }
        },
        negatives: {
            url: 'https://www.fleetguardian.io',
            coreKeywords: 'enterprise fleet tracking, gps telematics platform, dot compliance software',
            userGoal: 'leads',
            targetLocation: 'Dallas, TX',
            competitorBrands: 'Fleetio, Samsara, Verizon Connect',
            excludeCompetitors: true,
            keywordCount: 1000
        }
    },
    {
        planner: {
            seedKeywords: 'emergency plumber, water heater repair, slab leak detection, licensed plumbing company, same day plumber',
            negativeKeywords: 'training\ncourse\nmanual\nparts\nsupplies\njob\nfree\ndiscount\nreview',
            matchTypes: { broad: true, phrase: false, exact: true }
        },
        mixer: {
            listA: 'b2b saas\nsecurity platform\nzero trust',
            listB: 'enterprise\nmanaged service\ncloud',
            listC: 'compliance\naudit\nmonitoring',
            matchTypes: { broad: false, phrase: true, exact: true }
        },
        negatives: {
            url: 'https://www.horizonplasticsurgery.com',
            coreKeywords: 'tummy tuck specialist, mommy makeover surgeon, body contouring center',
            userGoal: 'calls',
            targetLocation: 'Miami, FL',
            competitorBrands: 'Athenique, Vivid Body MD',
            excludeCompetitors: false,
            keywordCount: 950
        }
    },
    {
        planner: {
            seedKeywords: 'b2b saas security, zero trust platform, managed soc service, cloud compliance audit, endpoint hardening',
            negativeKeywords: 'open source\ngithub\ntemplate\ninternship\ncareer\ncheap\nfree download\nwikipedia',
            matchTypes: { broad: false, phrase: true, exact: true }
        },
        mixer: {
            listA: 'delta\nunited\nsouthwest\namerican',
            listB: 'phone number\ncustomer service\ncontact\nsupport',
            listC: '24/7\nemergency\nhelp\nassistance',
            matchTypes: { broad: true, phrase: true, exact: false }
        },
        negatives: {
            url: 'https://www.atlascyberdefense.com',
            coreKeywords: 'managed soc service, zero trust deployment, cloud incident response',
            userGoal: 'leads',
            targetLocation: 'Austin, TX',
            competitorBrands: 'Expel, CrowdStrike, Arctic Wolf',
            excludeCompetitors: true,
            keywordCount: 900
        }
    }
];

const pickRandomPreset = <T,>(items: T[]): T => {
    return items[Math.floor(Math.random() * items.length)];
};

export const KeywordGeneratorV3 = ({ initialData }: { initialData?: any }) => {
    const [activeMainTab, setActiveMainTab] = useState<'planner' | 'negatives' | 'mixer'>('planner');
    const [fillInfoKey, setFillInfoKey] = useState(0); // Force re-render of child components

    // State for each tab's data
    const [plannerData, setPlannerData] = useState<any>(null);
    const [mixerData, setMixerData] = useState<any>(null);
    const [negativesData, setNegativesData] = useState<any>(null);

    useEffect(() => {
        if (initialData) {
            // Load initial data into appropriate tab
            if (initialData.type === 'planner') {
                setPlannerData(initialData.data);
                setActiveMainTab('planner');
            } else if (initialData.type === 'mixer') {
                setMixerData(initialData.data);
                setActiveMainTab('mixer');
            } else if (initialData.type === 'negatives') {
                setNegativesData(initialData.data);
                setActiveMainTab('negatives');
            } else {
                // If no type specified, assume it's the data directly
                setPlannerData(initialData);
            }
        }
    }, [initialData]);

    const handleFillInfo = () => {
        const preset = pickRandomPreset(FILL_INFO_PRESETS);
        
        // Set data for each component
        setPlannerData({
            seedKeywords: preset.planner.seedKeywords,
            negativeKeywords: preset.planner.negativeKeywords,
            matchTypes: preset.planner.matchTypes,
            generatedKeywords: []
        });

        setMixerData({
            listA: preset.mixer.listA,
            listB: preset.mixer.listB,
            listC: preset.mixer.listC,
            matchTypes: preset.mixer.matchTypes,
            mixedKeywords: []
        });

        setNegativesData({
            url: preset.negatives.url,
            coreKeywords: preset.negatives.coreKeywords,
            userGoal: preset.negatives.userGoal,
            targetLocation: preset.negatives.targetLocation,
            competitorBrands: preset.negatives.competitorBrands,
            excludeCompetitors: preset.negatives.excludeCompetitors,
            keywordCount: preset.negatives.keywordCount,
            generatedKeywords: []
        });

        // Force re-render by updating key
        setFillInfoKey(prev => prev + 1);
        
        notifications.success('Random test data filled!', {
            title: 'Fill Info',
            description: 'All tabs have been populated with random test data for testing.'
        });
    };

    return (
        <div className="p-4 max-w-7xl mx-auto">
            <div className="mb-4 flex items-start justify-between">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                            Keyword Generator v3.0
                        </h1>
                        <ApiStatusIndicator />
                    </div>
                    <p className="text-sm text-slate-500">
                        Comprehensive keyword generation with Planner, Negatives, and Mixer all in one place
                    </p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleFillInfo}
                    className="shrink-0 text-xs"
                >
                    <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                    Fill Info
                </Button>
            </div>

            <Tabs value={activeMainTab} onValueChange={(value: string) => setActiveMainTab(value as typeof activeMainTab)} className="mb-4">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="planner" className="flex items-center gap-2">
                        <Lightbulb className="w-4 h-4" />
                        Planner
                    </TabsTrigger>
                    <TabsTrigger value="negatives" className="flex items-center gap-2">
                        <MinusCircle className="w-4 h-4" />
                        Negatives
                    </TabsTrigger>
                    <TabsTrigger value="mixer" className="flex items-center gap-2">
                        <Shuffle className="w-4 h-4" />
                        Mixer
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="planner" className="mt-4">
                    <KeywordPlanner 
                        key={`planner-${fillInfoKey}`}
                        initialData={plannerData !== null ? plannerData : (activeMainTab === 'planner' && initialData ? initialData : undefined)} 
                    />
                </TabsContent>

                <TabsContent value="negatives" className="mt-4">
                    <NegativeKeywordsBuilder 
                        key={`negatives-${fillInfoKey}`}
                        initialData={negativesData !== null ? negativesData : (activeMainTab === 'negatives' && initialData ? initialData : undefined)} 
                    />
                </TabsContent>

                <TabsContent value="mixer" className="mt-4">
                    <KeywordMixer 
                        key={`mixer-${fillInfoKey}`}
                        initialData={mixerData !== null ? mixerData : (activeMainTab === 'mixer' && initialData ? initialData : undefined)} 
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
};

