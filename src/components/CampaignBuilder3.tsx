import React, { useState, useEffect } from 'react';
import { useAuthCompat } from '../utils/authCompat';
import { 
  ArrowRight, ArrowLeft, Check, Globe, Link2, Sparkles, Brain, 
  Hash, MapPin, FileText, Download, AlertCircle, CheckCircle2,
  Loader2, Search, Filter, X, Plus, Edit3, Trash2, Save,
  Target, Zap, Layers, TrendingUp, Building, ShoppingBag,
  Phone, Mail, Calendar, Clock, Eye, FileSpreadsheet, Copy,
  MessageSquare, Gift, Image as ImageIcon, DollarSign, MapPin as MapPinIcon,
  Star, RefreshCw, Smartphone, Megaphone, FolderOpen,
  Type, ChevronUp, ChevronDown, ChevronRight, MousePointerClick, Briefcase, Info
} from 'lucide-react';
import JSZip from 'jszip';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { notifications } from '../utils/notifications';
import { extractLandingPageContent, type LandingPageExtractionResult } from '../utils/campaignIntelligence/landingPageExtractor';
import { mapGoalToIntent } from '../utils/campaignIntelligence/intentClassifier';
import { type IntentResult, IntentId } from '../utils/campaignIntelligence/schemas';
import { generateCampaignStructure, type StructureSettings } from '../utils/campaignStructureGenerator';
import { generateKeywords as generateKeywordsUtil } from '../utils/keywordGenerator';
import {
  generateUniversalRSA,
  generateUniversalDKI,
  generateUniversalCallAd,
  type UniversalAdInput,
  type UniversalRSA,
  type UniversalDKIAd,
  type UniversalCallAd
} from '../utils/universalAdGenerator';
import { exportCampaignToCSVV3, validateCSVBeforeExport } from '../utils/csvGeneratorV3';
import { exportCampaignToGoogleAdsEditorCSV, campaignStructureToCSVRows, GOOGLE_ADS_EDITOR_HEADERS } from '../utils/googleAdsEditorCSVExporter';
import { validateAndFixAds, formatValidationReport } from '../utils/adValidationUtils';
import { validateRSA, validateDKISyntax, validateCallOnlyAd } from '../utils/googleAdsRules';
import Papa from 'papaparse';
import { historyService } from '../utils/historyService';
import { generateCSVWithBackend } from '../utils/csvExportBackend';
import { convertBuilderDataToEditorFormat, downloadGoogleAdsEditorCSV } from '../utils/googleAdsEditorCSV';
import type { CampaignStructure } from '../utils/campaignStructureGenerator';
import { api } from '../utils/api';
import { analysisService } from '../utils/analysisService';
import { 
  generateURL, 
  generateCampaignName, 
  generateNegativeKeywords,
  generateLocationInput 
} from '../utils/autoFill';
import { getKeywordMetrics, type KeywordMetrics } from '../utils/keywordPlannerApi';
import { GEO_PRESETS, US_STATES_ALL, US_CITIES_TOP_500, US_ZIP_CODES_EXTENDED, getGeoPresetsForCountry } from '../data/locationPresets';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { generateDKIAdWithAI } from '../utils/dkiAdGeneratorAI';
import { CampaignFlowDiagram } from './CampaignFlowDiagram';
import { TerminalCard, TerminalLine } from './ui/terminal-card';
import { ApiStatusIndicator } from './ApiStatusIndicator';

// Campaign Structure Types (14 structures)
const CAMPAIGN_STRUCTURES = [
  { id: 'skag', name: 'SKAG', description: 'Single Keyword Ad Group', icon: Target },
  { id: 'stag', name: 'STAG', description: 'Single Theme Ad Group', icon: Layers },
  { id: 'mix', name: 'Mix', description: 'Hybrid Structure', icon: TrendingUp },
  { id: 'stag_plus', name: 'STAG+', description: 'Smart Grouping with ML', icon: Brain },
  { id: 'intent', name: 'Intent-Based', description: 'Group by Intent', icon: Target },
  { id: 'alpha_beta', name: 'Alpha-Beta', description: 'Winners & Discovery', icon: Zap },
  { id: 'match_type', name: 'Match-Type Split', description: 'Separate by Match Type', icon: Filter },
  { id: 'geo', name: 'GEO-Segmented', description: 'One Campaign per Geo', icon: MapPin },
  { id: 'funnel', name: 'Funnel-Based', description: 'TOF/MOF/BOF', icon: TrendingUp },
  { id: 'brand_split', name: 'Brand Split', description: 'Brand vs Non-Brand', icon: Building },
  { id: 'competitor', name: 'Competitor', description: 'Competitor Campaigns', icon: Target },
  { id: 'ngram', name: 'N-Gram Clusters', description: 'Smart Clustering', icon: Brain },
  { id: 'long_tail', name: 'Long-Tail Master', description: '4+ Word Low-Competition Keywords', icon: Search },
  { id: 'seasonal', name: 'Seasonal Sprint', description: 'Time-Based Campaigns', icon: Calendar },
];

// Match Types
const MATCH_TYPES = [
  { id: 'broad', label: 'Broad Match', example: 'keyword' },
  { id: 'phrase', label: 'Phrase Match', example: '"keyword"' },
  { id: 'exact', label: 'Exact Match', example: '[keyword]' },
];

// Keyword Types for filtering
const KEYWORD_TYPES = [
  { id: 'broad', label: 'Broad Match' },
  { id: 'phrase', label: 'Phrase Match' },
  { id: 'exact', label: 'Exact Match' },
  { id: 'negative', label: 'Negative Keywords' },
];

// Default negative keywords (15-20 keywords as specified)
const DEFAULT_NEGATIVE_KEYWORDS = [
  'cheap',
  'discount',
  'cost',
  'reviews',
  'job',
  'apply',
  'information',
  'company',
  'free',
  'best',
  'providers',
  'office',
  'headquater',
  'brand',
];

// Location Presets - Top locations
const LOCATION_PRESETS = {
  countries: [
    'United States', 'Canada', 'United Kingdom', 'Australia', 'Germany', 'France',
    'Italy', 'Spain', 'Netherlands', 'Belgium', 'Switzerland', 'Sweden', 'Norway',
    'Denmark', 'Finland', 'Poland', 'Austria', 'Ireland', 'Portugal', 'Greece'
  ],
  states: [
    'California', 'Texas', 'New York', 'Florida', 'Illinois', 'Pennsylvania',
    'Ohio', 'Georgia', 'North Carolina', 'Michigan', 'New Jersey', 'Virginia',
    'Washington', 'Arizona', 'Massachusetts', 'Tennessee', 'Indiana', 'Missouri',
    'Maryland', 'Wisconsin', 'Colorado', 'Minnesota', 'South Carolina', 'Alabama',
    'Louisiana', 'Kentucky', 'Oregon', 'Oklahoma', 'Connecticut', 'Utah'
  ],
  cities: [
    'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia',
    'San Antonio', 'San Diego', 'Dallas', 'San Jose', 'Austin', 'Jacksonville',
    'Fort Worth', 'Columbus', 'Charlotte', 'San Francisco', 'Indianapolis', 'Seattle',
    'Denver', 'Washington', 'Boston', 'El Paso', 'Nashville', 'Detroit', 'Oklahoma City',
    'Portland', 'Las Vegas', 'Memphis', 'Louisville', 'Baltimore', 'Milwaukee', 'Albuquerque',
    'Tucson', 'Fresno', 'Sacramento', 'Kansas City', 'Mesa', 'Atlanta', 'Omaha', 'Raleigh',
    'Miami', 'Long Beach', 'Virginia Beach', 'Oakland', 'Minneapolis', 'Tulsa', 'Tampa',
    'Arlington', 'New Orleans', 'Wichita', 'Cleveland'
  ],
  zipCodes: (() => {
    // Top 5000 most common US ZIP codes (major metropolitan areas)
    const majorMetros = [
      // NYC area
      ...Array.from({ length: 200 }, (_, i) => String(10001 + i).padStart(5, '0')),
      // LA area
      ...Array.from({ length: 300 }, (_, i) => String(90001 + i).padStart(5, '0')),
      // Chicago area
      ...Array.from({ length: 250 }, (_, i) => String(60601 + i).padStart(5, '0')),
      // Houston area
      ...Array.from({ length: 200 }, (_, i) => String(77001 + i).padStart(5, '0')),
      // Phoenix area
      ...Array.from({ length: 150 }, (_, i) => String(85001 + i).padStart(5, '0')),
      // Philadelphia area
      ...Array.from({ length: 200 }, (_, i) => String(19101 + i).padStart(5, '0')),
      // San Antonio
      ...Array.from({ length: 100 }, (_, i) => String(78201 + i).padStart(5, '0')),
      // San Diego
      ...Array.from({ length: 150 }, (_, i) => String(92101 + i).padStart(5, '0')),
      // Dallas
      ...Array.from({ length: 150 }, (_, i) => String(75201 + i).padStart(5, '0')),
      // San Jose
      ...Array.from({ length: 100 }, (_, i) => String(95101 + i).padStart(5, '0')),
      // Austin
      ...Array.from({ length: 100 }, (_, i) => String(78701 + i).padStart(5, '0')),
      // Jacksonville
      ...Array.from({ length: 100 }, (_, i) => String(32201 + i).padStart(5, '0')),
      // Fort Worth
      ...Array.from({ length: 100 }, (_, i) => String(76101 + i).padStart(5, '0')),
      // Columbus
      ...Array.from({ length: 100 }, (_, i) => String(43201 + i).padStart(5, '0')),
      // Charlotte
      ...Array.from({ length: 100 }, (_, i) => String(28201 + i).padStart(5, '0')),
      // San Francisco
      ...Array.from({ length: 100 }, (_, i) => String(94101 + i).padStart(5, '0')),
      // Indianapolis
      ...Array.from({ length: 100 }, (_, i) => String(46201 + i).padStart(5, '0')),
      // Seattle
      ...Array.from({ length: 100 }, (_, i) => String(98101 + i).padStart(5, '0')),
      // Denver
      ...Array.from({ length: 100 }, (_, i) => String(80201 + i).padStart(5, '0')),
      // Washington DC
      ...Array.from({ length: 100 }, (_, i) => String(20001 + i).padStart(5, '0')),
      // Boston
      ...Array.from({ length: 100 }, (_, i) => String(2101 + i).padStart(5, '0')),
      // El Paso
      ...Array.from({ length: 50 }, (_, i) => String(79901 + i).padStart(5, '0')),
      // Nashville
      ...Array.from({ length: 50 }, (_, i) => String(37201 + i).padStart(5, '0')),
      // Detroit
      ...Array.from({ length: 100 }, (_, i) => String(48201 + i).padStart(5, '0')),
      // Oklahoma City
      ...Array.from({ length: 50 }, (_, i) => String(73101 + i).padStart(5, '0')),
      // Portland
      ...Array.from({ length: 50 }, (_, i) => String(97201 + i).padStart(5, '0')),
      // Las Vegas
      ...Array.from({ length: 100 }, (_, i) => String(89101 + i).padStart(5, '0')),
      // Memphis
      ...Array.from({ length: 50 }, (_, i) => String(38101 + i).padStart(5, '0')),
      // Louisville
      ...Array.from({ length: 50 }, (_, i) => String(40201 + i).padStart(5, '0')),
      // Baltimore
      ...Array.from({ length: 100 }, (_, i) => String(21201 + i).padStart(5, '0')),
      // Milwaukee
      ...Array.from({ length: 50 }, (_, i) => String(53201 + i).padStart(5, '0')),
      // Albuquerque
      ...Array.from({ length: 50 }, (_, i) => String(87101 + i).padStart(5, '0')),
      // Tucson
      ...Array.from({ length: 50 }, (_, i) => String(85701 + i).padStart(5, '0')),
      // Fresno
      ...Array.from({ length: 50 }, (_, i) => String(93701 + i).padStart(5, '0')),
      // Sacramento
      ...Array.from({ length: 50 }, (_, i) => String(95814 + i).padStart(5, '0')),
      // Kansas City
      ...Array.from({ length: 50 }, (_, i) => String(64101 + i).padStart(5, '0')),
      // Mesa
      ...Array.from({ length: 50 }, (_, i) => String(85201 + i).padStart(5, '0')),
      // Atlanta
      ...Array.from({ length: 100 }, (_, i) => String(30301 + i).padStart(5, '0')),
      // Omaha
      ...Array.from({ length: 50 }, (_, i) => String(68101 + i).padStart(5, '0')),
      // Raleigh
      ...Array.from({ length: 50 }, (_, i) => String(27601 + i).padStart(5, '0')),
      // Miami
      ...Array.from({ length: 100 }, (_, i) => String(33101 + i).padStart(5, '0')),
      // Long Beach
      ...Array.from({ length: 50 }, (_, i) => String(90801 + i).padStart(5, '0')),
      // Virginia Beach
      ...Array.from({ length: 50 }, (_, i) => String(23451 + i).padStart(5, '0')),
      // Oakland
      ...Array.from({ length: 50 }, (_, i) => String(94601 + i).padStart(5, '0')),
      // Minneapolis
      ...Array.from({ length: 50 }, (_, i) => String(55401 + i).padStart(5, '0')),
      // Tulsa
      ...Array.from({ length: 50 }, (_, i) => String(74101 + i).padStart(5, '0')),
      // Tampa
      ...Array.from({ length: 50 }, (_, i) => String(33601 + i).padStart(5, '0')),
      // Arlington
      ...Array.from({ length: 50 }, (_, i) => String(76001 + i).padStart(5, '0')),
      // New Orleans
      ...Array.from({ length: 50 }, (_, i) => String(70112 + i).padStart(5, '0')),
      // Wichita
      ...Array.from({ length: 50 }, (_, i) => String(67201 + i).padStart(5, '0')),
      // Cleveland
      ...Array.from({ length: 100 }, (_, i) => String(44101 + i).padStart(5, '0')),
    ];
    // Remove duplicates and limit to 5000
    return [...new Set(majorMetros)].slice(0, 5000);
  })(),
};

interface AdGroup {
  id: string;
  name: string;
  keywords: string[];
  negativeKeywords?: string[];
}

interface CampaignData {
  url: string;
  campaignName: string;
  intent: IntentResult | null;
  vertical: string | null;
  cta: string | null;
  selectedStructure: string | null;
  structureRankings: { id: string; score: number }[];
  seedKeywords: string[];
  negativeKeywords: string[];
  generatedKeywords: any[];
  selectedKeywords: any[];
  keywordTypes: { [key: string]: boolean };
  ads: any[];
  adTypes: string[];
  extensions: any[];
  adGroups: AdGroup[];
  selectedAdGroup: string | null;
  targetCountry: string;
  locations: {
    countries: string[];
    states: string[];
    cities: string[];
    zipCodes: string[];
  };
  csvData: any;
  csvErrors: any[];
  startDate?: string;
  endDate?: string;
  selectedGeoCountries?: string[];
}

interface CampaignBuilder3Props {
  initialData?: any;
}

export const CampaignBuilder3: React.FC<CampaignBuilder3Props> = ({ initialData }) => {
  const { getToken } = useAuthCompat();
  const generateDefaultCampaignName = () => {
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    return `Campaign-Search-${dateStr} ${timeStr}`;
  };

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [campaignSaved, setCampaignSaved] = useState(false);
  const [showAnalysisResults, setShowAnalysisResults] = useState(false);
  const [locationSearchTerm, setLocationSearchTerm] = useState({ countries: '', states: '', cities: '', zipCodes: '' });
  const [editingAdId, setEditingAdId] = useState<string | null>(null);
  const [editingCampaignName, setEditingCampaignName] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [seedKeywordsText, setSeedKeywordsText] = useState('');
  const [keywordDataSource, setKeywordDataSource] = useState<'google_ads_api' | 'fallback' | 'estimated' | 'local'>('local');
  const [googleAdsCustomerId, setGoogleAdsCustomerId] = useState<string | null>(null);
  const [comprehensiveAnalysis, setComprehensiveAnalysis] = useState<any>(null);
  const [analysisExpanded, setAnalysisExpanded] = useState<{ [key: string]: boolean }>({});
  const [analysisLogs, setAnalysisLogs] = useState<{ timestamp: string; message: string; type: 'info' | 'success' | 'step' | 'data' | 'ai' }[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const analysisLogsRef = React.useRef<HTMLDivElement>(null);
  const [showCallAdDialog, setShowCallAdDialog] = useState(false);
  const [callAdPhone, setCallAdPhone] = useState('');
  const [callAdBusinessName, setCallAdBusinessName] = useState('');
  const [showFlowDiagram, setShowFlowDiagram] = useState(false);
  const [selectedStructureForDiagram, setSelectedStructureForDiagram] = useState<{ id: string; name: string } | null>(null);
  const [userManuallySelectedStructure, setUserManuallySelectedStructure] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedProjectName, setSelectedProjectName] = useState<string | null>(null);
  const [campaignData, setCampaignData] = useState<CampaignData>({
    url: '',
    campaignName: generateDefaultCampaignName(),
    intent: null,
    vertical: null,
    cta: null,
    selectedStructure: null,
    structureRankings: [],
    seedKeywords: [],
    negativeKeywords: [...DEFAULT_NEGATIVE_KEYWORDS], // Initialize with default negative keywords
    generatedKeywords: [],
    selectedKeywords: [],
    keywordTypes: { broad: true, phrase: true, exact: true, negative: true }, // Show negative keywords by default
    ads: [],
    adTypes: ['rsa', 'dki'],
    extensions: [],
    adGroups: [],
    selectedAdGroup: 'ALL_AD_GROUPS',
    targetCountry: 'United States',
    locations: { countries: [], states: [], cities: [], zipCodes: [] },
    csvData: null,
    csvErrors: [],
    selectedGeoCountries: [],
  });

  // Scroll to top when step changes
  useEffect(() => {
    // Use setTimeout to ensure scroll happens after render completes
    const timer = setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }, 50);
    return () => clearTimeout(timer);
  }, [currentStep]);

  // Handle initial data from Keyword Planner or saved campaigns
  useEffect(() => {
    if (!initialData) return;

    try {
      // Handle saved campaign data (from CampaignHistoryView)
      if (initialData.campaignName || initialData.url || initialData.ads || initialData.adGroups) {
        console.log('Loading saved campaign data:', initialData);
        
        // Safely extract and validate data
        const safeData = {
          url: initialData.url || '',
          campaignName: initialData.campaignName || '',
          intent: initialData.intent || null,
          vertical: initialData.vertical || null,
          cta: initialData.cta || null,
          selectedStructure: initialData.selectedStructure || initialData.structureType || null,
          structureRankings: initialData.structureRankings || [],
          seedKeywords: Array.isArray(initialData.seedKeywords) 
            ? initialData.seedKeywords 
            : (typeof initialData.seedKeywords === 'string' 
                ? initialData.seedKeywords.split(',').map((s: string) => s.trim()).filter(Boolean)
                : []),
          negativeKeywords: Array.isArray(initialData.negativeKeywords)
            ? initialData.negativeKeywords
            : (typeof initialData.negativeKeywords === 'string'
                ? initialData.negativeKeywords.split('\n').map((s: string) => s.trim()).filter(Boolean)
                : [...DEFAULT_NEGATIVE_KEYWORDS]),
          generatedKeywords: Array.isArray(initialData.generatedKeywords) ? initialData.generatedKeywords : [],
          selectedKeywords: Array.isArray(initialData.selectedKeywords) ? initialData.selectedKeywords : [],
          ads: Array.isArray(initialData.ads) ? initialData.ads : [],
          adGroups: Array.isArray(initialData.adGroups) ? initialData.adGroups : [],
          locations: initialData.locations && typeof initialData.locations === 'object'
            ? {
                countries: Array.isArray(initialData.locations.countries) ? initialData.locations.countries : [],
                states: Array.isArray(initialData.locations.states) ? initialData.locations.states : [],
                cities: Array.isArray(initialData.locations.cities) ? initialData.locations.cities : [],
                zipCodes: Array.isArray(initialData.locations.zipCodes) ? initialData.locations.zipCodes : [],
              }
            : { countries: [], states: [], cities: [], zipCodes: [] },
          csvData: initialData.csvData || null,
        };

        // Determine which step to show based on data availability
        let targetStep = 1;
        if (safeData.url && safeData.selectedStructure) {
          targetStep = 2;
        }
        if (safeData.selectedKeywords && safeData.selectedKeywords.length > 0) {
          targetStep = 3;
        }
        if (safeData.ads && safeData.ads.length > 0) {
          targetStep = 4;
        }

        setCampaignData(prev => ({
          ...prev,
          ...safeData,
          // Ensure negative keywords always include defaults
          negativeKeywords: [...new Set([...DEFAULT_NEGATIVE_KEYWORDS, ...safeData.negativeKeywords])],
        }));

        setCurrentStep(targetStep);

        notifications.success('Campaign loaded successfully', {
          title: 'Campaign Restored',
          description: `Loaded campaign: ${safeData.campaignName || 'Unnamed Campaign'}`
        });
        return;
      }

      // Handle Keyword Planner data (legacy support)
      if (initialData.selectedKeywords && Array.isArray(initialData.selectedKeywords) && initialData.selectedKeywords.length > 0) {
        // Process keywords from Keyword Planner
        const keywords = initialData.selectedKeywords.map((kw: any) => {
          try {
            // Handle both string and object formats
            const kwText = typeof kw === 'string' ? kw : (kw?.text || kw?.keyword || String(kw || ''));
            // Clean keyword text (remove match type formatting for storage)
            let cleanKw = kwText.trim();
            if (cleanKw.startsWith('[') && cleanKw.endsWith(']')) {
              cleanKw = cleanKw.slice(1, -1);
            } else if (cleanKw.startsWith('"') && cleanKw.endsWith('"')) {
              cleanKw = cleanKw.slice(1, -1);
            }
            return {
              text: cleanKw,
              formatted: kwText, // Keep original format
              matchType: kwText.startsWith('[') ? 'exact' : kwText.startsWith('"') ? 'phrase' : 'broad'
            };
          } catch (err) {
            console.warn('Error processing keyword:', kw, err);
            return null;
          }
        }).filter(Boolean);

        // Extract seed keywords from the first few keywords if not provided
        const seedKws = initialData.seedKeywords 
          ? (typeof initialData.seedKeywords === 'string' 
              ? initialData.seedKeywords.split(',').map((s: string) => s.trim()).filter(Boolean)
              : Array.isArray(initialData.seedKeywords) ? initialData.seedKeywords : [])
          : keywords.slice(0, 5).map((k: any) => k.text);

        // Determine structure: use 'SKAG' as default for Keyword Planner imports, or from initialData
        const campaignStructure = initialData.structure 
          ? (typeof initialData.structure === 'string' ? initialData.structure.toLowerCase() : 'skag')
          : 'skag';

        setCampaignData(prev => ({
          ...prev,
          selectedKeywords: keywords,
          generatedKeywords: keywords,
          seedKeywords: seedKws,
          negativeKeywords: initialData.negativeKeywords 
            ? (typeof initialData.negativeKeywords === 'string' 
                ? initialData.negativeKeywords.split('\n').map((s: string) => s.trim()).filter(Boolean)
                : Array.isArray(initialData.negativeKeywords) ? initialData.negativeKeywords : [])
            : prev.negativeKeywords,
          // Set a default URL if not provided (required for campaign)
          url: prev.url || 'https://example.com',
          // Set the campaign structure (SKAG by default from Keyword Planner)
          selectedStructure: campaignStructure,
          // Generate campaign name from seed keywords if not set
          campaignName: prev.campaignName || (seedKws.length > 0 
            ? `${seedKws[0].replace(/[^a-z0-9]/gi, ' ').trim()} Campaign`
            : 'Campaign')
        }));
        
        // Sync the text state
        setSeedKeywordsText(seedKws.join('\n'));

        // Skip to step 3 (Ads Generation) since keywords are already provided
        setCurrentStep(3);
        
        notifications.success('Keywords loaded from Keyword Planner', {
          title: 'Keywords Ready',
          description: `${keywords.length} keywords loaded. Proceeding to ads generation.`
        });
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
      notifications.error('Failed to load campaign data', {
        title: 'Load Error',
        description: error instanceof Error ? error.message : 'Unknown error occurred. Please try again.'
      });
    }
  }, [initialData]);

  // Fetch Google Ads customer ID on mount (for Keyword Planner API)
  useEffect(() => {
    const fetchGoogleAdsAccount = async () => {
      try {
        const response = await fetch('/api/google-ads/accounts');
        if (response.ok) {
          const data = await response.json();
          if (data.accounts && data.accounts.length > 0) {
            // Use the first account as default
            setGoogleAdsCustomerId(data.accounts[0]);
          }
        }
      } catch (error) {
        console.log('Google Ads accounts not available, will use fallback data');
      }
    };
    fetchGoogleAdsAccount();
  }, []);

  // Generate smart campaign name from URL domain when user hasn't specified one
  useEffect(() => {
    if (!campaignData.campaignName && campaignData.url && campaignData.url.trim()) {
      try {
        const domain = extractDomain(campaignData.url);
        const now = new Date();
        const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const domainName = domain.split('.')[0].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        setCampaignData(prev => ({
          ...prev,
          campaignName: `${domainName} - Search Campaign ${dateStr}`
        }));
      } catch {
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
        const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '').substring(0, 4);
        setCampaignData(prev => ({
          ...prev,
          campaignName: `Search-${dateStr}-${timeStr}`
        }));
      }
    }
  }, [campaignData.url]);

  // Auto-save campaign progress when step changes or key data updates
  useEffect(() => {
    // Don't save if on step 1 with no data, or if already on success step
    if (currentStep === 1 && !campaignData.url) return;
    if (currentStep === 7) return; // Don't auto-save after completion
    
    // Debounce auto-save to avoid too many saves
    const saveTimeout = setTimeout(async () => {
      try {
        await historyService.save('campaign', campaignData.campaignName || 'Untitled Campaign', {
          name: campaignData.campaignName,
          url: campaignData.url,
          structure: campaignData.selectedStructure || 'stag',
          keywords: campaignData.selectedKeywords,
          ads: campaignData.ads,
          locations: campaignData.locations,
          intent: campaignData.intent,
          vertical: campaignData.vertical,
          cta: campaignData.cta,
          negativeKeywords: campaignData.negativeKeywords,
          adGroups: campaignData.adGroups,
          seedKeywords: campaignData.seedKeywords,
          generatedKeywords: campaignData.generatedKeywords,
          structureRankings: campaignData.structureRankings,
          targetCountry: campaignData.targetCountry,
          selectedGeoCountries: campaignData.selectedGeoCountries,
          currentStep: currentStep,
          lastSavedAt: new Date().toISOString(),
        }, 'draft');
        console.log('📝 Campaign auto-saved at step', currentStep);
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }, 2000); // 2 second debounce
    
    return () => clearTimeout(saveTimeout);
  }, [currentStep, campaignData.url, campaignData.selectedStructure, campaignData.selectedKeywords.length, campaignData.ads.length, campaignData.adGroups.length]);


  // Helper function to safely extract domain from URL
  const extractDomain = (url: string): string => {
    if (!url || typeof url !== 'string') return 'example.com';
    try {
      // Add protocol if missing
      let fullUrl = url;
      if (!url.match(/^https?:\/\//)) {
        fullUrl = 'https://' + url;
      }
      const urlObj = new URL(fullUrl);
      return urlObj.hostname.replace(/^www\./, '');
    } catch {
      return url.split('/')[0].replace(/^https?:\/\//, '').replace(/^www\./, '') || 'example.com';
    }
  };

  // Helper function to format URL with protocol
  const formatUrl = (url: string): string => {
    if (!url) return '';
    if (!url.match(/^https?:\/\//)) {
      return 'https://' + url;
    }
    return url;
  };

  // Helper function to add analysis log entries
  const addAnalysisLog = (message: string, type: 'info' | 'success' | 'step' | 'data' | 'ai' = 'info') => {
    const timestamp = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    setAnalysisLogs(prev => [...prev, { timestamp, message, type }]);
    // Auto-scroll to bottom
    setTimeout(() => {
      if (analysisLogsRef.current) {
        analysisLogsRef.current.scrollTop = analysisLogsRef.current.scrollHeight;
      }
    }, 50);
  };

  // Step 1: URL Input & AI Analysis
  const handleUrlSubmit = async () => {
    if (!campaignData.url || !campaignData.url.trim()) {
      notifications.error('Please enter a valid URL', { title: 'URL Required' });
      return;
    }

    setLoading(true);
    setIsAnalyzing(true);
    setAnalysisLogs([]);
    setComprehensiveAnalysis(null);
    
    try {
      // Format URL properly
      const formattedUrl = formatUrl(campaignData.url.trim());
      
      addAnalysisLog(`Starting comprehensive analysis for: ${formattedUrl}`, 'step');
      addAnalysisLog('Initializing browser...', 'info');
      
      // Try comprehensive server-side analysis first
      let comprehensiveData: any = null;
      try {
        addAnalysisLog('Connecting to target website...', 'info');
        
        const response = await fetch('/api/analyze-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: formattedUrl, extractionDepth: 'comprehensive' })
        });
        
        if (response.ok) {
          comprehensiveData = await response.json();
          if (comprehensiveData.success) {
            setComprehensiveAnalysis(comprehensiveData);
            
            // Log extracted data
            const data = comprehensiveData.data;
            addAnalysisLog('Page loaded successfully', 'success');
            addAnalysisLog('Extracting DOM elements...', 'step');
            
            if (data.seoSignals?.title) {
              addAnalysisLog(`Title: "${data.seoSignals.title}"`, 'data');
            }
            if (data.headings?.length > 0) {
              addAnalysisLog(`Found ${data.headings.length} headings`, 'data');
              const h1 = data.headings.find((h: any) => h.level === 'h1');
              if (h1) addAnalysisLog(`H1: "${h1.text}"`, 'data');
            }
            if (data.ctaElements?.length > 0) {
              addAnalysisLog(`Found ${data.ctaElements.length} call-to-action elements`, 'data');
            }
            if (data.forms?.length > 0) {
              addAnalysisLog(`Found ${data.forms.length} forms`, 'data');
            }
            if (data.services?.length > 0) {
              addAnalysisLog(`Detected ${data.services.length} services/products`, 'data');
            }
            if (data.contactInfo?.phones?.length > 0) {
              addAnalysisLog(`Found ${data.contactInfo.phones.length} phone numbers`, 'data');
            }
            if (data.contactInfo?.emails?.length > 0) {
              addAnalysisLog(`Found ${data.contactInfo.emails.length} email addresses`, 'data');
            }
            if (data.seoSignals?.wordCount) {
              addAnalysisLog(`Page content: ${data.seoSignals.wordCount} words`, 'data');
            }
            
            // AI insights
            if (comprehensiveData.aiInsights) {
              addAnalysisLog('Running AI analysis...', 'step');
              const ai = comprehensiveData.aiInsights;
              if (ai.businessType) addAnalysisLog(`Business Type: ${ai.businessType}`, 'ai');
              if (ai.primaryIntent) addAnalysisLog(`Primary Intent: ${ai.primaryIntent}`, 'ai');
              if (ai.targetAudience) addAnalysisLog(`Target Audience: ${ai.targetAudience}`, 'ai');
              if (ai.uniqueValueProposition) addAnalysisLog(`Value Proposition: ${ai.uniqueValueProposition}`, 'ai');
              if (ai.suggestedKeywords?.length > 0) {
                addAnalysisLog(`Suggested Keywords: ${ai.suggestedKeywords.join(', ')}`, 'ai');
              }
            }
          }
        }
      } catch (serverError) {
        addAnalysisLog('Server analysis unavailable, using fallback...', 'info');
        console.warn('Server-side analysis failed, using client-side fallback:', serverError);
      }
      
      addAnalysisLog('Processing extracted data...', 'step');
      
      // Build landing data from comprehensive analysis or fallback to client extraction
      let landingData: LandingPageExtractionResult;
      if (comprehensiveData?.success && comprehensiveData.data) {
        const data = comprehensiveData.data;
        landingData = {
          domain: extractDomain(formattedUrl),
          title: data.seoSignals?.title || null,
          h1: data.headings?.find((h: any) => h.level === 'h1')?.text || null,
          metaDescription: data.seoSignals?.metaDescription || null,
          services: data.services || [],
          phones: data.contactInfo?.phones || [],
          emails: data.contactInfo?.emails || [],
          hours: null,
          addresses: data.contactInfo?.addresses || [],
          schemas: { org: data.schemas?.[0] || undefined },
          page_text_tokens: data.mainContent?.split(' ').slice(0, 100) || [],
          extractionMethod: 'crawl',
          extractedAt: new Date().toISOString(),
        };
        addAnalysisLog('Landing page data structured', 'success');
      } else {
        // Fallback to client-side extraction
        addAnalysisLog('Using client-side extraction...', 'info');
        try {
          landingData = await extractLandingPageContent(formattedUrl);
          addAnalysisLog('Client extraction complete', 'success');
        } catch (extractError: any) {
          console.warn('Landing page extraction failed, using fallback:', extractError);
          landingData = {
            domain: extractDomain(formattedUrl),
            title: null,
            h1: null,
            metaDescription: null,
            services: [],
            phones: [],
            emails: [],
            hours: null,
            addresses: [],
            schemas: {},
            page_text_tokens: [],
            extractionMethod: 'fallback',
            extractedAt: new Date().toISOString(),
          };
          addAnalysisLog('Using minimal fallback data', 'info');
        }
      }
      
      addAnalysisLog('Detecting campaign intent...', 'step');
      
      // Use AI insights if available, otherwise detect manually
      let intentResult: IntentResult;
      let vertical: string | null;
      let cta: string | null;
      let seedKeywords: string[];
      
      // Helper function to ensure all seed keywords have at least 2 words
      const filterValidSeedKeywords = (keywords: string[]): string[] => {
        return keywords
          .map(k => k.trim())
          .filter(k => k.length > 0 && k.split(/\s+/).length >= 2);
      };

      if (comprehensiveData?.aiInsights) {
        const ai = comprehensiveData.aiInsights;
        const detectedIntentId = ai.primaryIntent?.toLowerCase()?.includes('call') ? IntentId.CALL 
            : ai.primaryIntent?.toLowerCase()?.includes('lead') ? IntentId.LEAD
            : ai.primaryIntent?.toLowerCase()?.includes('purchase') ? IntentId.PURCHASE
            : IntentId.TRAFFIC;
        intentResult = {
          intentId: detectedIntentId,
          intentLabel: ai.primaryIntent || 'Traffic',
          confidence: 0.9,
          recommendedDevice: 'any',
          primaryKPIs: ['clicks', 'impressions'],
          suggestedAdTypes: ['RSA']
        };
        vertical = ai.businessType || detectVertical(landingData);
        cta = ai.conversionGoal || detectCTA(landingData, vertical ?? undefined);
        const rawKeywords = ai.suggestedKeywords?.slice(0, 5) || await generateSeedKeywords(landingData, intentResult);
        seedKeywords = filterValidSeedKeywords(rawKeywords);
        
        addAnalysisLog(`Intent detected: ${intentResult.intentLabel}`, 'success');
        addAnalysisLog(`Vertical: ${vertical}`, 'success');
        addAnalysisLog(`CTA: ${cta}`, 'success');
      } else {
        // Fallback to manual detection
        addAnalysisLog('Using rule-based detection...', 'info');
        intentResult = mapGoalToIntent(
          (landingData?.title || landingData?.h1 || '').trim(),
          { ...landingData, url: formattedUrl, tokens: landingData.page_text_tokens || [] } as any,
          landingData?.phones?.[0] || ''
        );
        vertical = detectVertical(landingData);
        cta = detectCTA(landingData, vertical);
        const rawKeywords = await generateSeedKeywords(landingData, intentResult);
        seedKeywords = filterValidSeedKeywords(rawKeywords);
        
        addAnalysisLog(`Intent detected: ${intentResult.intentLabel}`, 'success');
        addAnalysisLog(`Vertical: ${vertical}`, 'success');
        addAnalysisLog(`CTA: ${cta}`, 'success');
      }
      
      addAnalysisLog('Generating seed keywords...', 'step');
      addAnalysisLog(`Generated ${seedKeywords.length} seed keywords (2+ words each)`, 'success');

      setCampaignData(prev => ({
        ...prev,
        intent: intentResult,
        vertical,
        cta,
        seedKeywords,
      }));
      
      setSeedKeywordsText(seedKeywords.join('\n'));

      // Auto-select best campaign structures (only if user hasn't manually selected one during this session)
      addAnalysisLog('Ranking campaign structures...', 'step');
      // Note: userManuallySelectedStructure is reset when starting a new campaign/analysis
      const rankings = rankCampaignStructures(intentResult, vertical ?? 'general');
      setCampaignData(prev => ({
        ...prev,
        structureRankings: rankings,
        // Only auto-select if user hasn't manually chosen a structure
        selectedStructure: userManuallySelectedStructure ? prev.selectedStructure : (rankings[0]?.id || 'skag'),
      }));
      const topStructure = CAMPAIGN_STRUCTURES.find(s => s.id === rankings[0]?.id);
      addAnalysisLog(`Recommended structure: ${topStructure?.name || 'SKAG'}${userManuallySelectedStructure ? ' (keeping your selection)' : ''}`, 'success');

      // Save analysis to database (non-blocking)
      addAnalysisLog('Saving analysis to cache...', 'step');
      try {
        analysisService.saveAnalysis({
          url: formattedUrl,
          domain: extractDomain(formattedUrl),
          intent: intentResult,
          vertical: vertical || 'Unknown',
          cta: cta || 'Unknown',
          seedKeywords: seedKeywords,
          contentSummary: comprehensiveData?.aiInsights?.uniqueValueProposition || `Website analyzed: ${formattedUrl}`,
          detectedServices: landingData?.services || [],
          detectedCTAs: comprehensiveData?.data?.ctaElements?.map((c: any) => c.text) || [],
        });
        addAnalysisLog('Analysis cached successfully', 'success');
      } catch (saveError) {
        console.warn('Failed to cache analysis (localStorage may be full):', saveError);
        addAnalysisLog('Cache unavailable, continuing...', 'info');
      }

      setShowAnalysisResults(true);
      addAnalysisLog('Analysis complete! Ready to proceed.', 'success');
      
      notifications.success('URL analyzed successfully', {
        title: 'Comprehensive Analysis Complete',
        description: `Detected: ${intentResult.intentLabel} intent, ${vertical} vertical`
      });

    } catch (error) {
      console.error('URL analysis error:', error);
      addAnalysisLog(`Error: ${error instanceof Error ? error.message : 'Analysis failed'}`, 'info');
      notifications.error('Failed to analyze URL', {
        title: 'Analysis Error',
        description: 'Please check the URL and try again'
      });
    } finally {
      setLoading(false);
      setIsAnalyzing(false);
    }
  };

  // Helper to filter keywords based on structure type
  const filterKeywordsByStructure = (keywords: any[], structureId: string) => {
    if (structureId === 'long_tail') {
      // Long-Tail: Only 4+ word keywords
      return keywords.filter(kw => {
        const text = (kw.text || kw.keyword || '').replace(/^\[|\]$|^"|"$/g, '').trim();
        return text.split(/\s+/).filter(Boolean).length >= 4;
      });
    }
    // Other structures don't filter keywords in the UI
    return keywords;
  };

  // Step 2: Campaign Structure Selection
  const handleStructureSelect = (structureId: string) => {
    setUserManuallySelectedStructure(true);
    setCampaignData(prev => {
      // Filter selectedKeywords based on new structure
      const filteredSelected = filterKeywordsByStructure(prev.selectedKeywords, structureId);
      return { 
        ...prev, 
        selectedStructure: structureId,
        selectedKeywords: filteredSelected
      };
    });
  };

  const handleNextFromStructure = () => {
    if (!campaignData.selectedStructure) {
      notifications.error('Please select a campaign structure', { title: 'Structure Required' });
      return;
    }
    
    // Validate structure-specific requirements
    if (campaignData.selectedStructure === 'geo' && (!campaignData.selectedGeoCountries || campaignData.selectedGeoCountries.filter(c => c).length === 0)) {
      notifications.error('Please select at least one country for GEO-Segmented campaigns', { title: 'Countries Required' });
      return;
    }
    
    if (campaignData.selectedStructure === 'seasonal' && (!campaignData.startDate || !campaignData.endDate)) {
      notifications.error('Please set start and end dates for Seasonal campaigns', { title: 'Dates Required' });
      return;
    }
    
    setCurrentStep(3);
  };

  // Step 3: Keywords Generation
  const handleGenerateKeywords = async () => {
    if (campaignData.seedKeywords.length === 0) {
      notifications.error('Please provide seed keywords', { title: 'Seed Keywords Required' });
      return;
    }

    setLoading(true);
    try {
      // Use local autocomplete-based keyword generator directly
      // This ensures we always use the new autocomplete patterns
      console.log('Using autocomplete-based keyword generator');
      console.log('Seed keywords:', campaignData.seedKeywords);
      console.log('Negative keywords:', campaignData.negativeKeywords);
      
      const seedKeywordsString = campaignData.seedKeywords.join('\n');
      const negativeKeywordsString = campaignData.negativeKeywords.join('\n');
      
      console.log('Calling generateKeywordsUtil with:', {
        seedKeywords: seedKeywordsString,
        negativeKeywords: negativeKeywordsString,
        maxKeywords: 710,
        minKeywords: 410
      });
      
      const localKeywords = generateKeywordsUtil({
        seedKeywords: seedKeywordsString,
        negativeKeywords: negativeKeywordsString,
        vertical: campaignData.vertical || 'Services',
        intentResult: campaignData.intent,
        maxKeywords: 710,
        minKeywords: 410,
      });

      console.log('Generated keywords from utility:', localKeywords.length, localKeywords.slice(0, 10));

      if (!localKeywords || localKeywords.length === 0) {
        throw new Error('Keyword generator returned no keywords. Please check your seed keywords.');
      }

      // If we got very few keywords, something went wrong - generate more variations
      if (localKeywords.length < 50) {
        console.warn('Keyword generator returned only', localKeywords.length, 'keywords. Generating additional variations...');
        
        // Generate additional variations manually
        const additionalKeywords: any[] = [];
        // Ensure seeds are properly split by comma if they contain commas
        const seedList = campaignData.seedKeywords
          .flatMap(s => s.split(/[,]+/).map(k => k.trim()))
          .filter(s => s.length >= 2);
        const negativeList = campaignData.negativeKeywords.map(n => n.trim().toLowerCase()).filter(Boolean);
        
        seedList.forEach((seed, seedIdx) => {
          const cleanSeed = seed.trim().toLowerCase();
          if (negativeList.some(neg => cleanSeed.includes(neg))) return;
          
          // Generate many variations per seed
          const variations = [
            `${cleanSeed} near me`,
            `best ${cleanSeed}`,
            `top ${cleanSeed}`,
            `cheap ${cleanSeed}`,
            `24/7 ${cleanSeed}`,
            `emergency ${cleanSeed}`,
            `${cleanSeed} cost`,
            `${cleanSeed} price`,
            `${cleanSeed} services`,
            `${cleanSeed} company`,
            `professional ${cleanSeed}`,
            `licensed ${cleanSeed}`,
            `same day ${cleanSeed}`,
            `${cleanSeed} repair`,
            `${cleanSeed} replacement`,
            `how to ${cleanSeed}`,
            `what is ${cleanSeed}`,
            `where to ${cleanSeed}`,
            `best ${cleanSeed} near me`,
            `top ${cleanSeed} near me`,
            `24/7 ${cleanSeed} near me`,
            `emergency ${cleanSeed} near me`,
            `${cleanSeed} services near me`,
            `${cleanSeed} cost near me`,
            `${cleanSeed} price near me`,
            `best ${cleanSeed} cost`,
            `top ${cleanSeed} services`,
            `same day ${cleanSeed} repair`,
            `${cleanSeed} repair cost`,
            `${cleanSeed} replacement cost`,
          ];
          
          variations.forEach((variation, varIdx) => {
            if (additionalKeywords.length >= 500) return;
            if (negativeList.some(neg => variation.includes(neg))) return;
            if (localKeywords.some(k => k.text.toLowerCase() === variation.toLowerCase())) return;
            if (additionalKeywords.some(k => k.text.toLowerCase() === variation.toLowerCase())) return;
            
            additionalKeywords.push({
              id: `kw-manual-${seedIdx}-${varIdx}`,
              text: variation,
              volume: 'Medium',
              cpc: '$2.50',
              type: 'Generated',
              matchType: 'BROAD'
            });
          });
        });
        
        console.log('Generated', additionalKeywords.length, 'additional keyword variations');
        localKeywords.push(...additionalKeywords);
      }

      const generated = localKeywords.map((kw, index) => ({
          id: kw.id || `kw-${Date.now()}-${index}`,
          text: kw.text,
          keyword: kw.text,
        matchType: (kw.matchType || 'BROAD').toLowerCase(),
          volume: kw.volume || 'Medium',
          cpc: kw.cpc || '$2.50',
          type: kw.type || 'Generated',
        }));

      console.log('Mapped keywords:', generated.length);

      // Generate 410-710 keywords (random range as specified)
      const targetCount = Math.floor(Math.random() * 300) + 410;
      const finalKeywords = generated.slice(0, Math.min(generated.length, targetCount));
      
      console.log('Final keywords before filtering:', finalKeywords.length);

      // Filter out keywords that match negative keywords
      const negativeList = campaignData.negativeKeywords.map(n => n.trim().toLowerCase()).filter(Boolean);
      console.log('Negative keywords list:', negativeList);
      
      const filteredByNegatives = finalKeywords.filter((kw: any) => {
        const keywordText = (kw.text || kw.keyword || '').toLowerCase();
        const shouldExclude = negativeList.some(neg => keywordText.includes(neg));
        return !shouldExclude;
      });
      
      console.log('Keywords after negative filtering:', filteredByNegatives.length);

      // Apply match types based on selected keyword types
      const formattedKeywords: any[] = [];
      filteredByNegatives.forEach((kw: any) => {
        // Extract base text (remove match type formatting if present)
        let baseText = kw.text || kw.keyword || '';
        baseText = baseText.replace(/^["\[\]]|["\[\]]$/g, '').trim();
        
        // Skip if base text contains negative keywords
        const baseTextLower = baseText.toLowerCase();
        if (negativeList.some(neg => baseTextLower.includes(neg))) {
          return; // Skip this keyword
        }
        
        if (campaignData.keywordTypes.broad) {
          formattedKeywords.push({
            ...kw,
            id: `${kw.id}-broad`,
            text: baseText,
            keyword: baseText,
            matchType: 'broad',
          });
        }
        
        if (campaignData.keywordTypes.phrase) {
          formattedKeywords.push({
            ...kw,
            id: `${kw.id}-phrase`,
            text: `"${baseText}"`,
            keyword: `"${baseText}"`,
            matchType: 'phrase',
          });
        }
        
        if (campaignData.keywordTypes.exact) {
          formattedKeywords.push({
            ...kw,
            id: `${kw.id}-exact`,
            text: `[${baseText}]`,
            keyword: `[${baseText}]`,
            matchType: 'exact',
          });
        }
      });

      // Shuffle for variety
      const shuffled = [...formattedKeywords].sort(() => Math.random() - 0.5);
      
      console.log('Final formatted keywords count:', shuffled.length);
      console.log('Sample keywords:', shuffled.slice(0, 10).map(k => k.text));

      if (shuffled.length === 0) {
        throw new Error('No keywords were generated after formatting. Please check your seed keywords and match type selections.');
      }

      // Helper function to generate estimated metrics based on keyword characteristics
      const generateEstimatedMetrics = (keywordText: string) => {
        const text = keywordText.toLowerCase();
        const wordCount = text.split(/\s+/).length;
        
        // Base values with some randomization for variety
        let baseVolume = 1000;
        let baseCpc = 2.50;
        let competition: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM';
        
        // High-intent keywords get higher CPC and lower volume
        const highIntentTerms = ['near me', 'emergency', 'urgent', 'best', 'top', 'professional', 'licensed', 'certified', 'affordable', 'cheap', 'free quote', 'same day'];
        const commercialTerms = ['cost', 'price', 'pricing', 'quote', 'estimate', 'rates', 'fees', 'how much'];
        const serviceTerms = ['service', 'services', 'repair', 'installation', 'maintenance', 'contractor', 'company', 'specialist'];
        
        if (highIntentTerms.some(term => text.includes(term))) {
          baseVolume = 800 + Math.floor(Math.random() * 400);
          baseCpc = 4.50 + Math.random() * 3;
          competition = 'HIGH';
        } else if (commercialTerms.some(term => text.includes(term))) {
          baseVolume = 1500 + Math.floor(Math.random() * 1000);
          baseCpc = 3.00 + Math.random() * 2;
          competition = 'MEDIUM';
        } else if (serviceTerms.some(term => text.includes(term))) {
          baseVolume = 2000 + Math.floor(Math.random() * 2000);
          baseCpc = 2.00 + Math.random() * 1.5;
          competition = 'MEDIUM';
        } else {
          baseVolume = 500 + Math.floor(Math.random() * 1500);
          baseCpc = 1.50 + Math.random() * 2;
          competition = Math.random() > 0.5 ? 'LOW' : 'MEDIUM';
        }
        
        // Long-tail keywords (more words) typically have lower volume but higher intent
        if (wordCount >= 4) {
          baseVolume = Math.floor(baseVolume * 0.4);
          baseCpc = baseCpc * 1.2;
        } else if (wordCount === 3) {
          baseVolume = Math.floor(baseVolume * 0.7);
        }
        
        return {
          volume: baseVolume,
          avgMonthlySearches: baseVolume,
          cpc: Math.round(baseCpc * 100) / 100,
          avgCpc: Math.round(baseCpc * 100) / 100,
          competition,
          competitionIndex: competition === 'HIGH' ? 80 : competition === 'MEDIUM' ? 50 : 20,
          lowBid: Math.round((baseCpc * 0.6) * 100) / 100,
          highBid: Math.round((baseCpc * 1.4) * 100) / 100,
        };
      };

      // Fetch metrics from Google Ads Keyword Planner API
      let enrichedKeywords = shuffled;
      let dataSource: 'google_ads_api' | 'fallback' | 'estimated' | 'local' = 'estimated';
      
      try {
        // Get unique base keywords for API call (without match type formatting)
        const uniqueBaseKeywords = [...new Set(shuffled.map(kw => {
          const text = kw.text || kw.keyword || '';
          return text.replace(/^["\[\]]|["\[\]]$/g, '').trim().toLowerCase();
        }))].slice(0, 100); // Increased API limit
        
        console.log('[Keyword Planner] Fetching metrics for', uniqueBaseKeywords.length, 'unique keywords');
        
        const metricsResponse = await getKeywordMetrics({
          keywords: uniqueBaseKeywords,
          targetCountry: campaignData.targetCountry === 'United States' ? 'US' : 'US',
          customerId: googleAdsCustomerId || undefined,
        });
        
        // Create a map of keyword -> metrics from API
        const metricsMap = new Map<string, KeywordMetrics>();
        if (metricsResponse.success && metricsResponse.keywords.length > 0) {
          dataSource = metricsResponse.source;
          metricsResponse.keywords.forEach(m => {
            metricsMap.set(m.keyword.toLowerCase(), m);
          });
        }
        
        // Enrich keywords with API metrics or fallback to estimated
        enrichedKeywords = shuffled.map(kw => {
          const baseText = (kw.text || kw.keyword || '').replace(/^["\[\]]|["\[\]]$/g, '').trim().toLowerCase();
          const apiMetrics = metricsMap.get(baseText);
          
          // Use API metrics if available, otherwise generate estimated metrics
          if (apiMetrics && apiMetrics.avgMonthlySearches !== null) {
            return {
              ...kw,
              volume: apiMetrics.avgMonthlySearches,
              avgMonthlySearches: apiMetrics.avgMonthlySearches,
              cpc: apiMetrics.avgCpc,
              avgCpc: apiMetrics.avgCpc,
              competition: apiMetrics.competition,
              competitionIndex: apiMetrics.competitionIndex,
              lowBid: apiMetrics.lowTopOfPageBid,
              highBid: apiMetrics.highTopOfPageBid,
            };
          } else {
            // Generate estimated metrics for keywords without API data
            const estimated = generateEstimatedMetrics(baseText);
            return {
              ...kw,
              ...estimated,
            };
          }
        });
        
        console.log('[Keyword Planner] Enriched keywords with', dataSource, 'data + estimated fallbacks');
      } catch (apiError) {
        console.warn('[Keyword Planner] Could not fetch metrics, using estimated data:', apiError);
        dataSource = 'estimated';
        
        // Apply estimated metrics to all keywords
        enrichedKeywords = shuffled.map(kw => {
          const baseText = (kw.text || kw.keyword || '').replace(/^["\[\]]|["\[\]]$/g, '').trim().toLowerCase();
          const estimated = generateEstimatedMetrics(baseText);
          return {
            ...kw,
            ...estimated,
          };
        });
      }
      
      setKeywordDataSource(dataSource);

      // Apply structure-specific filtering for keyword selection
      // All generated keywords are stored, but only structure-appropriate ones are selected
      const currentStructure = campaignData.selectedStructure || 'skag';
      const structureFilteredKeywords = filterKeywordsByStructure(enrichedKeywords, currentStructure);
      
      // Generate ad groups based on campaign structure with filtered keywords
      const adGroups = generateAdGroupsFromKeywords(structureFilteredKeywords, currentStructure);

      setCampaignData(prev => ({
        ...prev,
        generatedKeywords: enrichedKeywords, // Store all generated keywords
        selectedKeywords: structureFilteredKeywords, // Only auto-select structure-appropriate keywords
        adGroups: adGroups,
      }));
      
      // Auto-save draft
      await autoSaveDraft();

      const sourceLabel = dataSource === 'google_ads_api' ? 'Google Ads API' : (dataSource === 'fallback' || dataSource === 'estimated') ? 'estimated data' : 'local patterns';
      notifications.success(`Generated ${enrichedKeywords.length} keywords`, {
        title: 'Keywords Generated',
        description: `Generated ${enrichedKeywords.length} keywords with metrics from ${sourceLabel}`
      });

      // Scroll to generated keywords section
      setTimeout(() => {
        const keywordSection = document.querySelector('[data-keywords-section]');
        if (keywordSection) {
          keywordSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 300);
    } catch (error) {
      console.error('Keyword generation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      // Fallback: Use seed keywords as manual keywords
      if (campaignData.seedKeywords.length > 0) {
        const seedKeywordsAsKeywords = createKeywordsFromSeeds(campaignData.seedKeywords);
        const fallbackStructure = campaignData.selectedStructure || 'skag';
        const filteredSeedKeywords = filterKeywordsByStructure(seedKeywordsAsKeywords, fallbackStructure);
        
        setCampaignData(prev => ({
          ...prev,
          generatedKeywords: seedKeywordsAsKeywords,
          selectedKeywords: filteredSeedKeywords.length > 0 ? filteredSeedKeywords : seedKeywordsAsKeywords,
        }));

        notifications.warning('Using seed keywords as manual keywords', {
          title: 'Generation Failed',
          description: `Keyword generation failed. Using ${seedKeywordsAsKeywords.length} seed keywords instead. You can proceed to the next step.`
        });
      } else {
        notifications.error('Failed to generate keywords', {
          title: 'Generation Error',
          description: errorMessage
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Helper function to create keywords from seed keywords
  const createKeywordsFromSeeds = (seeds: string[]): any[] => {
    const keywords: any[] = [];
    const timestamp = Date.now();

    seeds.forEach((seed, seedIndex) => {
      const baseText = seed.trim();
      if (!baseText || baseText.length < 3) return;

      // Apply match types based on selected keyword types
      if (campaignData.keywordTypes.broad) {
        keywords.push({
          id: `seed-${timestamp}-${seedIndex}-broad`,
          text: baseText,
          keyword: baseText,
          matchType: 'broad',
          volume: 'Medium',
          cpc: '$2.50',
          type: 'Seed Keyword',
        });
      }
      
      if (campaignData.keywordTypes.phrase) {
        keywords.push({
          id: `seed-${timestamp}-${seedIndex}-phrase`,
          text: `"${baseText}"`,
          keyword: `"${baseText}"`,
          matchType: 'phrase',
          volume: 'Medium',
          cpc: '$2.50',
          type: 'Seed Keyword',
        });
      }
      
      if (campaignData.keywordTypes.exact) {
        keywords.push({
          id: `seed-${timestamp}-${seedIndex}-exact`,
          text: `[${baseText}]`,
          keyword: `[${baseText}]`,
          matchType: 'exact',
          volume: 'Medium',
          cpc: '$2.50',
          type: 'Seed Keyword',
        });
      }
    });

    return keywords;
  };

  const handleKeywordTypeToggle = (type: string) => {
    setCampaignData(prev => ({
      ...prev,
      keywordTypes: {
        ...prev.keywordTypes,
        [type]: !prev.keywordTypes[type],
      }
    }));
  };

  // Filter keywords based on selected types, negative keywords, and structure type
  const negativeList = campaignData.negativeKeywords.map(n => n.trim().toLowerCase()).filter(Boolean);
  
  // Structure-specific keyword filter helper
  const getWordCount = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;
  
  const filteredKeywords = campaignData.generatedKeywords.filter(kw => {
    // Filter by match type
    if (kw.matchType === 'broad' && !campaignData.keywordTypes.broad) return false;
    if (kw.matchType === 'phrase' && !campaignData.keywordTypes.phrase) return false;
    if (kw.matchType === 'exact' && !campaignData.keywordTypes.exact) return false;
    if (kw.isNegative && !campaignData.keywordTypes.negative) return false;
    
    // Filter out keywords containing negative keywords
    const keywordText = (kw.text || kw.keyword || '').toLowerCase();
    const rawKeywordText = keywordText.replace(/^\[|\]$|^"|"$/g, '').trim();
    if (negativeList.some(neg => rawKeywordText.includes(neg))) return false;
    
    // Structure-specific filtering
    const structure = campaignData.selectedStructure;
    if (structure === 'long_tail') {
      // Long-Tail: Only show keywords with 4+ words
      if (getWordCount(rawKeywordText) < 4) return false;
    }
    
    return true;
  });

  // Auto-fill functions for each step
  const handleAutoFillStep1 = () => {
    const randomUrl = generateURL();
    const randomName = generateCampaignName();
    setCampaignData(prev => ({
      ...prev,
      url: randomUrl,
      campaignName: randomName,
    }));
    notifications.success('Step 1 auto-filled', { title: 'Auto Fill Complete' });
  };

  const handleAutoFillStep2 = () => {
    const randomStructure = CAMPAIGN_STRUCTURES[Math.floor(Math.random() * CAMPAIGN_STRUCTURES.length)];
    setCampaignData(prev => ({
      ...prev,
      selectedStructure: randomStructure.id,
    }));
    notifications.success('Step 2 auto-filled', { title: 'Auto Fill Complete' });
  };

  const handleAutoFillStep3 = () => {
    // Generate relevant keywords based on detected data
    let seedKeywords: string[] = [];
    
    // Try to use detected intent/vertical to generate relevant keywords
    if (campaignData.vertical && campaignData.vertical !== 'General') {
      const verticalExamples: { [key: string]: string[] } = {
        'E-commerce': ['buy online', 'shop now', 'best deals', 'order now'],
        'Services': ['near me', 'services', 'professional', 'call now'],
        'Healthcare': ['healthcare', 'treatment', 'appointment', 'doctors near me'],
        'Legal': ['attorney', 'legal help', 'consultation', 'law firm'],
        'Real Estate': ['homes for sale', 'property', 'real estate', 'listings'],
      };
      seedKeywords = verticalExamples[campaignData.vertical] || [];
    }
    
    // If still empty, fall back to intent-based keywords
    if (seedKeywords.length === 0 && campaignData.intent) {
      const intentId = campaignData.intent.intentId;
      if (intentId === IntentId.CALL) {
        seedKeywords = ['near me', 'phone', 'call', 'contact'];
      } else if (intentId === IntentId.LEAD) {
        seedKeywords = ['quote', 'estimate', 'contact', 'information'];
      } else if (intentId === IntentId.PURCHASE) {
        seedKeywords = ['buy', 'shop', 'order', 'price'];
      } else {
        seedKeywords = ['service', 'help', 'information', 'provider'];
      }
    }
    
    // Last resort: use generic examples
    if (seedKeywords.length === 0) {
      seedKeywords = ['service', 'help', 'information', 'provider'];
    }
    
    setCampaignData(prev => ({
      ...prev,
      seedKeywords: seedKeywords.slice(0, 4),
      negativeKeywords: DEFAULT_NEGATIVE_KEYWORDS,
    }));
    notifications.success('Step 3 auto-filled', { title: 'Auto Fill Complete' });
  };

  // Fill Info button handler - adds 3-4 keywords each time
  const handleFillInfoKeywords = () => {
    // Pool of diverse keywords to choose from
    const keywordPool = [
      'plumber near me', 'emergency plumbing', 'drain cleaning', 'water heater repair',
      'airline number', 'contact airline', 'delta phone', 'united customer service',
      'electrician', 'hvac repair', 'roofing services', 'landscaping',
      'locksmith', 'appliance repair', 'handyman', 'carpet cleaning',
      'pest control', 'tree service', 'window cleaning', 'moving company',
      'auto repair', 'dentist', 'lawyer', 'accountant',
      'web design', 'seo services', 'marketing agency', 'it support'
    ];
    
    // Randomly select 3-4 keywords
    const count = Math.floor(Math.random() * 2) + 3; // 3 or 4
    const shuffled = [...keywordPool].sort(() => 0.5 - Math.random());
    const newKeywords = shuffled.slice(0, count);
    
    // Add to existing keywords (avoid duplicates)
    setCampaignData(prev => {
      const existing = prev.seedKeywords || [];
      const combined = [...existing, ...newKeywords];
      // Remove duplicates
      const unique = Array.from(new Set(combined.map(k => k.toLowerCase().trim())))
        .map(lower => {
          // Find original case from combined array
          return combined.find(k => k.toLowerCase().trim() === lower) || lower;
        });
      
      return {
        ...prev,
        seedKeywords: unique
      };
    });
    
    notifications.success(`Added ${count} keywords`, {
      title: 'Keywords Added',
      description: `Added: ${newKeywords.join(', ')}`
    });
  };

  const handleAutoFillStep5 = () => {
    const randomCountry = LOCATION_PRESETS.countries[Math.floor(Math.random() * LOCATION_PRESETS.countries.length)];
    const randomCities = LOCATION_PRESETS.cities.slice(0, Math.floor(Math.random() * 20) + 5);
    const randomZips = LOCATION_PRESETS.zipCodes.slice(0, Math.floor(Math.random() * 50) + 10);
    
    setCampaignData(prev => ({
      ...prev,
      targetCountry: randomCountry,
      locations: {
        ...prev.locations,
        cities: randomCities,
        zipCodes: randomZips,
      },
    }));
    notifications.success('Step 5 auto-filled', { title: 'Auto Fill Complete' });
  };

  // Auto-save draft functionality
  const autoSaveDraft = async () => {
    try {
      if (campaignData.campaignName || campaignData.url) {
        // Map step number to step name for display
        const stepNames = ['', 'Setup', 'Structure', 'Keywords', 'Ads', 'Locations', 'Extensions', 'Validate', 'Export'];
        const stepName = stepNames[currentStep] || 'Setup';
        
        await historyService.save('campaign', campaignData.campaignName || 'Draft Campaign', {
          name: campaignData.campaignName || 'Draft Campaign',
          url: campaignData.url,
          structure: campaignData.selectedStructure || 'skag',
          keywords: campaignData.selectedKeywords,
          ads: campaignData.ads,
          locations: campaignData.locations,
          intent: campaignData.intent,
          vertical: campaignData.vertical,
          cta: campaignData.cta,
          negativeKeywords: campaignData.negativeKeywords,
          adGroups: campaignData.adGroups,
          step: currentStep,
          stepName: stepName,
          createdAt: new Date().toISOString(),
        }, 'draft');
      }
    } catch (error) {
      // Only log unexpected errors - "Item not found" is now handled gracefully
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (!errorMessage.includes('Item not found') && !errorMessage.includes('not found')) {
        console.error('Auto-save failed:', error);
      }
      // Don't show error to user for auto-save failures
    }
  };

  // Generate ad groups based on campaign structure
  const generateAdGroupsFromKeywords = (keywords: any[], structureType: string): AdGroup[] => {
    const groups: AdGroup[] = [];
    
    if (structureType === 'skag') {
      // SKAG: One ad group per keyword - no limit, each keyword gets its own ad group
      keywords.forEach((kw, idx) => {
        const baseText = (kw.text || kw.keyword || '').replace(/^["\[\]]|["\[\]]$/g, '').trim();
        groups.push({
          id: `ag-${idx + 1}`,
          name: baseText.substring(0, 50) || `Ad Group ${idx + 1}`,
          keywords: [kw], // Keep full keyword object with matchType
        });
      });
    } else if (structureType === 'stag') {
      // STAG: Group by theme (first word)
      const themeGroups: { [key: string]: any[] } = {};
      keywords.forEach(kw => {
        const baseText = (kw.text || kw.keyword || '').replace(/^["\[\]]|["\[\]]$/g, '').trim();
        const firstWord = baseText.split(' ')[0]?.toLowerCase() || 'general';
        if (!themeGroups[firstWord]) {
          themeGroups[firstWord] = [];
        }
        // Keep full keyword object to preserve matchType
        if (!themeGroups[firstWord].find((k: any) => (k.text || k.keyword) === (kw.text || kw.keyword))) {
          themeGroups[firstWord].push(kw);
        }
      });
      
      Object.entries(themeGroups).slice(0, 10).forEach(([theme, kwList], idx) => {
        groups.push({
          id: `ag-${idx + 1}`,
          name: `Ad Group ${idx + 1} - ${theme.charAt(0).toUpperCase() + theme.slice(1)}`,
          keywords: kwList.slice(0, 20), // Keep full keyword objects
        });
      });
    } else {
      // Default: Create 5-10 ad groups
      const groupSize = Math.ceil(keywords.length / 8);
      for (let i = 0; i < 8 && i * groupSize < keywords.length; i++) {
        const groupKeywords = keywords.slice(i * groupSize, (i + 1) * groupSize)
          .filter(Boolean);
        if (groupKeywords.length > 0) {
          groups.push({
            id: `ag-${i + 1}`,
            name: `Ad Group ${i + 1}`,
            keywords: groupKeywords, // Keep full keyword objects with matchType
          });
        }
      }
    }
    
    return groups;
  };

  // Step 4: Ads Generation - Generate 3 ads (RSA, DKI, Call)
  const handleGenerateAds = async () => {
    if (campaignData.selectedKeywords.length === 0) {
      notifications.error('Please select keywords first', { title: 'Keywords Required' });
      return;
    }

    setLoading(true);
    try {
      const keywordTexts = campaignData.selectedKeywords.map(k => k.text || k.keyword || k).slice(0, 10);
      const ads: any[] = [];

      // Extract business name from campaign name or URL
      let businessName = campaignData.campaignName || 'Your Business';
      if (businessName.length > 25) {
        businessName = businessName.split(' ')[0] || businessName.substring(0, 25);
      }
      
      // Extract domain name from URL for better business name
      if (campaignData.url) {
        try {
          const urlObj = new URL(campaignData.url.startsWith('http') ? campaignData.url : `https://${campaignData.url}`);
          const hostname = urlObj.hostname.replace('www.', '');
          const domainName = hostname.split('.')[0];
          if (domainName && domainName.length > 2 && domainName.length <= 25) {
            businessName = domainName.charAt(0).toUpperCase() + domainName.slice(1);
          }
        } catch (e) {
          // If URL parsing fails, use campaign name
        }
      }
      
      // Determine industry from keywords if vertical is not set
      let industry = campaignData.vertical || 'general';
      if (industry === 'general' && keywordTexts.length > 0) {
        const firstKeyword = keywordTexts[0].toLowerCase();
        if (firstKeyword.includes('plumb') || firstKeyword.includes('plumber')) industry = 'plumbing';
        else if (firstKeyword.includes('electric') || firstKeyword.includes('electrician')) industry = 'electrical';
        else if (firstKeyword.includes('hvac') || firstKeyword.includes('heating') || firstKeyword.includes('cooling')) industry = 'hvac';
        else if (firstKeyword.includes('roof') || firstKeyword.includes('roofing')) industry = 'roofing';
        else if (firstKeyword.includes('airline') || firstKeyword.includes('flight')) industry = 'travel';
        else if (firstKeyword.includes('lawyer') || firstKeyword.includes('legal')) industry = 'legal';
        else if (firstKeyword.includes('dentist') || firstKeyword.includes('dental')) industry = 'dental';
        else if (firstKeyword.includes('doctor') || firstKeyword.includes('medical')) industry = 'medical';
        else if (firstKeyword.includes('restaurant') || firstKeyword.includes('food')) industry = 'food';
        else if (firstKeyword.includes('hotel') || firstKeyword.includes('travel')) industry = 'travel';
        else {
          industry = firstKeyword.split(' ')[0] || 'general';
        }
      }

      // Universal Ad Generator - 4-Pillar Bucket System with Enhanced Google Ads Compliance
      // Generate RSA, DKI, and Call ads using the new architecture with validation
      const adTypesToGenerate = ['rsa', 'dki', 'call'];
      
      // Build Universal Ad Input
      const universalInput: UniversalAdInput = {
        industry: industry,
        keywords: keywordTexts,
        uniqueValueProposition: campaignData.cta || 'quality service and expert solutions',
        audiencePainPoint: 'finding reliable service',
        businessName: businessName,
        location: campaignData.locations?.cities?.[0] || campaignData.locations?.states?.[0] || undefined,
        baseUrl: campaignData.url || undefined,
        phoneNumber: '(555) 123-4567',
      };
      
      for (const adType of adTypesToGenerate) {
        try {
          if (adType === 'rsa') {
            // Generate RSA using 4-Pillar System with Google Ads compliance
            const rsa = generateUniversalRSA(universalInput);
            
            // Validate the generated RSA
            const validation = validateRSA(rsa.headlines, rsa.descriptions, rsa.displayPath);
            if (!validation.valid) {
              console.warn('RSA validation issues:', validation.headlineErrors, validation.descriptionErrors);
            }
            
            ads.push({
              id: `ad-${Date.now()}-${Math.random()}`,
              type: 'rsa',
              adType: 'RSA',
              headlines: rsa.headlines || [],
              descriptions: rsa.descriptions || [],
              displayPath: rsa.displayPath || [],
              finalUrl: rsa.finalUrl || campaignData.url || '',
              selected: false,
              extensions: [],
              pillarBreakdown: rsa.pillarBreakdown,
              adStrength: validation.adStrength,
              validationWarnings: validation.warnings,
            });
          } else if (adType === 'dki') {
            // Generate DKI ad with enhanced validation
            const dki = generateUniversalDKI(universalInput);
            
            // Validate DKI syntax in generated headlines and descriptions
            const dkiValidation = {
              headline1: validateDKISyntax(dki.headline1 || ''),
              headline2: validateDKISyntax(dki.headline2 || ''),
              headline3: validateDKISyntax(dki.headline3 || ''),
              description1: validateDKISyntax(dki.description1 || ''),
              description2: validateDKISyntax(dki.description2 || ''),
            };
            
            const hasValidationErrors = Object.values(dkiValidation).some(v => !v.valid);
            if (hasValidationErrors) {
              console.warn('DKI validation issues:', dkiValidation);
            }
            
            ads.push({
              id: `ad-${Date.now()}-${Math.random()}`,
              type: 'dki',
              adType: 'DKI',
              headline1: dki.headline1 || '',
              headline2: dki.headline2 || '',
              headline3: dki.headline3 || '',
              description1: dki.description1 || '',
              description2: dki.description2 || '',
              displayPath: dki.displayPath || [],
              finalUrl: dki.finalUrl || campaignData.url || '',
              selected: false,
              extensions: [],
              dkiValidation: dkiValidation,
            });
          } else if (adType === 'call') {
            // Generate Call-Only ad with enhanced validation
            const call = generateUniversalCallAd(universalInput);
            
            // Validate Call-Only ad
            const callValidation = validateCallOnlyAd({
              headlines: [call.headline1 || '', call.headline2 || ''],
              descriptions: [call.description1 || '', call.description2 || ''],
              businessName: call.businessName || businessName,
              phoneNumber: call.phoneNumber || '',
              verificationUrl: call.verificationUrl || campaignData.url || '',
            });
            
            if (!callValidation.valid) {
              console.warn('Call-Only ad validation issues:', callValidation.errors);
            }
            
            ads.push({
              id: `ad-${Date.now()}-${Math.random()}`,
              type: 'call',
              adType: 'CallOnly',
              headline1: call.headline1 || '',
              headline2: call.headline2 || '',
              description1: call.description1 || '',
              description2: call.description2 || '',
              phoneNumber: call.phoneNumber || '',
              businessName: call.businessName || businessName,
              finalUrl: call.verificationUrl || campaignData.url || '',
              selected: false,
              extensions: [],
              callValidation: callValidation,
            });
          }
        } catch (adError) {
          console.error(`Error generating ${adType} ad:`, adError);
          // Continue with other ad types
        }
      }
      
      setCampaignData(prev => ({
        ...prev,
        ads: ads,
        adTypes: adTypesToGenerate, // Update ad types to match generated ads
      }));

      notifications.success(`Generated ${ads.length} ads successfully`, {
        title: 'Ads Generated',
        description: 'RSA, DKI, and Call ads have been created for all ad groups.'
      });
      
      // Auto-save draft
      await autoSaveDraft();
    } catch (error) {
      console.error('Ad generation error:', error);
      notifications.error('Failed to generate ads', {
        title: 'Generation Error',
        description: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setLoading(false);
    }
  };

  // Helper function to extract business name from URL
  const extractBusinessNameFromURL = () => {
    let businessName = campaignData.campaignName || 'Your Business';
    if (businessName.length > 25) {
      businessName = businessName.split(' ')[0] || businessName.substring(0, 25);
    }
    if (campaignData.url) {
      try {
        const urlObj = new URL(campaignData.url.startsWith('http') ? campaignData.url : `https://${campaignData.url}`);
        const hostname = urlObj.hostname.replace('www.', '');
        const domainName = hostname.split('.')[0];
        if (domainName && domainName.length > 2 && domainName.length <= 25) {
          businessName = domainName.charAt(0).toUpperCase() + domainName.slice(1);
        }
      } catch (e) {}
    }
    return businessName;
  };

  // Add a single ad of specified type (only if under 3 ads total)
  const handleAddNewAd = async (adType: 'rsa' | 'dki' | 'call') => {
    // Check if we already have 3 ads
    if (campaignData.ads.length >= 3) {
      notifications.warning('Maximum 3 ads allowed per ad group', {
        title: 'Limit Reached',
        description: 'You can only have 3 ads. Please delete an existing ad to add a new one.'
      });
      return;
    }

    // Check if this ad type already exists
    const existingAdType = campaignData.ads.find(ad => 
      (ad.type === adType) || 
      (adType === 'rsa' && ad.adType === 'RSA') ||
      (adType === 'dki' && ad.adType === 'DKI') ||
      (adType === 'call' && (ad.adType === 'CallOnly' || ad.type === 'call'))
    );

    if (existingAdType) {
      notifications.info(`A ${adType.toUpperCase()} ad already exists. Maximum 3 ads allowed.`, {
        title: 'Ad Type Exists'
      });
      return;
    }

    if (campaignData.selectedKeywords.length === 0) {
      notifications.error('Please select keywords first', { title: 'Keywords Required' });
      return;
    }

    // For Call Only ads, show dialog to prompt for phone and business name
    if (adType === 'call') {
      const defaultBusinessName = extractBusinessNameFromURL();
      setCallAdBusinessName(defaultBusinessName);
      setCallAdPhone('');
      setShowCallAdDialog(true);
      return;
    }

    setLoading(true);
    try {
      const keywordTexts = campaignData.selectedKeywords.map(k => k.text || k.keyword || k).slice(0, 10);
      const businessName = extractBusinessNameFromURL();
      
      // Determine industry from keywords if vertical is not set
      let industry = campaignData.vertical || 'general';
      if (industry === 'general' && keywordTexts.length > 0) {
        const firstKeyword = keywordTexts[0].toLowerCase();
        if (firstKeyword.includes('plumb') || firstKeyword.includes('plumber')) industry = 'plumbing';
        else if (firstKeyword.includes('electric') || firstKeyword.includes('electrician')) industry = 'electrical';
        else if (firstKeyword.includes('hvac') || firstKeyword.includes('heating') || firstKeyword.includes('cooling')) industry = 'hvac';
        else if (firstKeyword.includes('roof') || firstKeyword.includes('roofing')) industry = 'roofing';
        else if (firstKeyword.includes('airline') || firstKeyword.includes('flight')) industry = 'travel';
        else if (firstKeyword.includes('lawyer') || firstKeyword.includes('legal')) industry = 'legal';
        else if (firstKeyword.includes('dentist') || firstKeyword.includes('dental')) industry = 'dental';
        else if (firstKeyword.includes('doctor') || firstKeyword.includes('medical')) industry = 'medical';
        else if (firstKeyword.includes('restaurant') || firstKeyword.includes('food')) industry = 'food';
        else if (firstKeyword.includes('hotel') || firstKeyword.includes('travel')) industry = 'travel';
        else {
          industry = firstKeyword.split(' ')[0] || 'general';
        }
      }
      
      let newAd: any = null;
      
      // Build Universal Ad Input
      const universalInput: UniversalAdInput = {
        industry: industry,
        keywords: keywordTexts,
        uniqueValueProposition: campaignData.cta || 'quality service and expert solutions',
        audiencePainPoint: 'finding reliable service',
        businessName: businessName,
        location: campaignData.locations?.cities?.[0] || campaignData.locations?.states?.[0] || undefined,
        baseUrl: campaignData.url || undefined,
        phoneNumber: '(555) 123-4567',
      };
      
      if (adType === 'rsa') {
        // Generate RSA using 4-Pillar System
        const rsa = generateUniversalRSA(universalInput);
        newAd = {
          id: `ad-${Date.now()}-${Math.random()}`,
          type: 'rsa',
          adType: 'RSA',
          headlines: rsa.headlines || [],
          descriptions: rsa.descriptions || [],
          displayPath: rsa.displayPath || [],
          finalUrl: rsa.finalUrl || campaignData.url || '',
          selected: false,
          extensions: [],
          pillarBreakdown: rsa.pillarBreakdown,
        };
      } else if (adType === 'dki') {
        // Use AI-powered DKI generation
        notifications.info('Generating AI-powered DKI ad...', { title: 'AI Generation' });
        const dkiResult = await generateDKIAdWithAI({
          keywords: keywordTexts,
          industry: industry,
          businessName: businessName,
          url: campaignData.url || undefined,
          location: campaignData.locations?.cities?.[0] || campaignData.locations?.states?.[0] || undefined,
        });
        
        const industryPath = industry.toLowerCase().slice(0, 15);
        newAd = {
          id: `ad-${Date.now()}-${Math.random()}`,
          type: 'dki',
          adType: 'DKI',
          headline1: dkiResult.headline1 || '',
          headline2: dkiResult.headline2 || '',
          headline3: dkiResult.headline3 || '',
          description1: dkiResult.description1 || '',
          description2: dkiResult.description2 || '',
          displayPath: [industryPath, 'services'].slice(0, 2),
          finalUrl: campaignData.url || '',
          selected: false,
          extensions: [],
        };
      }

      if (newAd) {
        setCampaignData(prev => ({
          ...prev,
          ads: [...prev.ads, newAd],
        }));

        notifications.success(`${adType.toUpperCase()} ad added successfully`, {
          title: 'Ad Added',
          description: `${campaignData.ads.length + 1} / 3 ads created`
        });
        
        await autoSaveDraft();
      } else {
        throw new Error(`Failed to generate ${adType} ad`);
      }
    } catch (error) {
      console.error(`Error generating ${adType} ad:`, error);
      notifications.error(`Failed to generate ${adType.toUpperCase()} ad`, {
        title: 'Generation Error',
        description: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle Call Only ad creation after dialog submission
  const handleCreateCallAd = async () => {
    setShowCallAdDialog(false);
    setLoading(true);
    
    try {
      const keywordTexts = campaignData.selectedKeywords.map(k => k.text || k.keyword || k).slice(0, 10);
      const businessName = callAdBusinessName || extractBusinessNameFromURL();
      const phoneNumber = callAdPhone || '(555) 123-4567';
      
      let industry = campaignData.vertical || 'general';
      if (industry === 'general' && keywordTexts.length > 0) {
        const firstKeyword = keywordTexts[0].toLowerCase();
        if (firstKeyword.includes('plumb') || firstKeyword.includes('plumber')) industry = 'plumbing';
        else if (firstKeyword.includes('electric') || firstKeyword.includes('electrician')) industry = 'electrical';
        else if (firstKeyword.includes('hvac') || firstKeyword.includes('heating') || firstKeyword.includes('cooling')) industry = 'hvac';
        else {
          industry = firstKeyword.split(' ')[0] || 'general';
        }
      }
      
      // Build Universal Ad Input for Call-Only Ad
      const universalInput: UniversalAdInput = {
        industry: industry,
        keywords: keywordTexts,
        uniqueValueProposition: campaignData.cta || 'quality service and expert solutions',
        audiencePainPoint: 'finding reliable service',
        businessName: businessName,
        location: campaignData.locations?.cities?.[0] || campaignData.locations?.states?.[0] || undefined,
        baseUrl: campaignData.url || undefined,
        phoneNumber: phoneNumber,
      };

      // Generate Call-Only ad using Universal Generator
      const call = generateUniversalCallAd(universalInput);
      
      const newAd = {
        id: `ad-${Date.now()}-${Math.random()}`,
        type: 'call',
        adType: 'CallOnly',
        headline1: call.headline1 || '',
        headline2: call.headline2 || '',
        description1: call.description1 || '',
        description2: call.description2 || '',
        phoneNumber: phoneNumber,
        businessName: businessName.substring(0, 25),
        finalUrl: call.verificationUrl || campaignData.url || '',
        selected: false,
        extensions: [],
      };

      setCampaignData(prev => ({
        ...prev,
        ads: [...prev.ads, newAd],
      }));

      notifications.success('Call Only ad added successfully', {
        title: 'Ad Added',
        description: `Phone: ${phoneNumber} | Business: ${businessName}`
      });
      
      await autoSaveDraft();
    } catch (error) {
      console.error('Error generating Call Only ad:', error);
      notifications.error('Failed to generate Call Only ad', {
        title: 'Generation Error',
        description: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setLoading(false);
      setCallAdPhone('');
      setCallAdBusinessName('');
    }
  };

  const handleEditAd = (adId: string) => {
    // Toggle edit mode - if already editing this ad, cancel edit
    if (editingAdId === adId) {
      setEditingAdId(null);
    } else {
      setEditingAdId(adId);
    }
  };

  const updateAdField = (adId: string, field: string, value: any) => {
    // Apply Google Ads character limits
    let processedValue = value;
    if (field.startsWith('headline')) {
      // Headlines: max 30 characters
      if (typeof value === 'string' && value.length > 30) {
        processedValue = value.substring(0, 30);
        notifications.warning(`Headline truncated to 30 characters (Google Ads limit)`, {
          title: 'Character Limit',
          description: 'Headlines must be 30 characters or less.',
          duration: 3000
        });
      }
    } else if (field.startsWith('description')) {
      // Descriptions: max 90 characters
      if (typeof value === 'string' && value.length > 90) {
        processedValue = value.substring(0, 90);
        notifications.warning(`Description truncated to 90 characters (Google Ads limit)`, {
          title: 'Character Limit',
          description: 'Descriptions must be 90 characters or less.',
          duration: 3000
        });
      }
    } else if (field === 'path1' || field === 'path2' || (field === 'displayPath' && Array.isArray(value))) {
      // Paths: max 15 characters
      if (field === 'displayPath' && Array.isArray(value)) {
        processedValue = value.map((path: string) => 
          typeof path === 'string' && path.length > 15 ? path.substring(0, 15) : path
        );
      } else if (typeof value === 'string' && value.length > 15) {
        processedValue = value.substring(0, 15);
        notifications.warning(`Path truncated to 15 characters (Google Ads limit)`, {
          title: 'Character Limit',
          description: 'Display URL paths must be 15 characters or less.',
          duration: 3000
        });
      }
    } else if (field === 'headlines' && Array.isArray(value)) {
      // RSA headlines array: each headline max 30 characters
      processedValue = value.map((h: string) => 
        typeof h === 'string' && h.length > 30 ? h.substring(0, 30) : h
      );
    } else if (field === 'descriptions' && Array.isArray(value)) {
      // RSA descriptions array: each description max 90 characters
      processedValue = value.map((d: string) => 
        typeof d === 'string' && d.length > 90 ? d.substring(0, 90) : d
      );
    }
    
    setCampaignData(prev => ({
      ...prev,
      ads: prev.ads.map(ad => 
        ad.id === adId ? { ...ad, [field]: processedValue } : ad
      )
    }));
  };

  const handleSaveAd = (adId: string) => {
    const ad = campaignData.ads.find(a => a.id === adId);
    if (!ad) {
      notifications.error('Ad not found', {
        title: 'Error',
        description: 'The ad you are trying to save could not be found.',
      });
      return;
    }

    // Validate required fields and Google Ads character limits
    const errors: string[] = [];
    
    if (ad.type === 'rsa' || ad.adType === 'RSA') {
      // RSA validation
      if (ad.headlines && Array.isArray(ad.headlines)) {
        ad.headlines.forEach((headline: string, idx: number) => {
          if (headline && headline.length > 30) {
            errors.push(`Headline ${idx + 1} exceeds 30 characters (${headline.length}/30)`);
          }
        });
      }
      if (ad.descriptions && Array.isArray(ad.descriptions)) {
        ad.descriptions.forEach((desc: string, idx: number) => {
          if (desc && desc.length > 90) {
            errors.push(`Description ${idx + 1} exceeds 90 characters (${desc.length}/90)`);
          }
        });
      }
    } else if (ad.type === 'dki' || ad.adType === 'DKI') {
      // DKI validation
      if (!ad.headline1 || ad.headline1.trim() === '') {
        errors.push('Headline 1 is required');
      } else if (ad.headline1.length > 30) {
        errors.push(`Headline 1 exceeds 30 characters (${ad.headline1.length}/30)`);
      }
      if (!ad.headline2 || ad.headline2.trim() === '') {
        errors.push('Headline 2 is required');
      } else if (ad.headline2.length > 30) {
        errors.push(`Headline 2 exceeds 30 characters (${ad.headline2.length}/30)`);
      }
      if (ad.headline3 && ad.headline3.length > 30) {
        errors.push(`Headline 3 exceeds 30 characters (${ad.headline3.length}/30)`);
      }
      if (!ad.description1 || ad.description1.trim() === '') {
        errors.push('Description 1 is required');
      } else if (ad.description1.length > 90) {
        errors.push(`Description 1 exceeds 90 characters (${ad.description1.length}/90)`);
      }
      if (ad.description2 && ad.description2.length > 90) {
        errors.push(`Description 2 exceeds 90 characters (${ad.description2.length}/90)`);
      }
    } else if (ad.type === 'call' || ad.adType === 'CallOnly') {
      // Call-Only validation
      if (!ad.headline1 || ad.headline1.trim() === '') {
        errors.push('Headline 1 is required');
      } else if (ad.headline1.length > 30) {
        errors.push(`Headline 1 exceeds 30 characters (${ad.headline1.length}/30)`);
      }
      if (!ad.headline2 || ad.headline2.trim() === '') {
        errors.push('Headline 2 is required');
      } else if (ad.headline2.length > 30) {
        errors.push(`Headline 2 exceeds 30 characters (${ad.headline2.length}/30)`);
      }
      if (!ad.description1 || ad.description1.trim() === '') {
        errors.push('Description 1 is required');
      } else if (ad.description1.length > 90) {
        errors.push(`Description 1 exceeds 90 characters (${ad.description1.length}/90)`);
      }
      if (!ad.description2 || ad.description2.trim() === '') {
        errors.push('Description 2 is required');
      } else if (ad.description2.length > 90) {
        errors.push(`Description 2 exceeds 90 characters (${ad.description2.length}/90)`);
      }
      if (!ad.phoneNumber || ad.phoneNumber.trim() === '') {
        errors.push('Phone number is required');
      }
      if (!ad.businessName || ad.businessName.trim() === '') {
        errors.push('Business name is required');
      }
    }

    if (errors.length > 0) {
      notifications.error(`Please fix the following errors:\n\n${errors.join('\n')}`, {
        title: 'Validation Error',
        description: 'All fields must comply with Google Ads character limits.',
        priority: 'high',
      });
      return;
    }

    setEditingAdId(null);
    notifications.success('Changes saved successfully', {
      title: 'Ad Updated',
      description: 'Your ad changes have been saved.',
    });
  };

  const handleCancelEdit = () => {
    setEditingAdId(null);
  };

  const handleDuplicateAd = (adId: string) => {
    const adToDuplicate = campaignData.ads.find(ad => ad.id === adId);
    if (!adToDuplicate) {
      notifications.error('Ad not found', { title: 'Error' });
      return;
    }

    if (campaignData.ads.length >= 3) {
      notifications.warning('Maximum 3 ads allowed', { title: 'Limit Reached' });
      return;
    }

    const duplicatedAd = {
      ...adToDuplicate,
      id: `ad-${Date.now()}-${Math.random()}`,
      extensions: adToDuplicate.extensions ? [...adToDuplicate.extensions] : [],
    };

    setCampaignData(prev => ({
      ...prev,
      ads: [...prev.ads, duplicatedAd],
    }));

    notifications.success('Ad duplicated', { title: 'Duplicated' });
  };

  const handleDeleteAd = (adId: string) => {
    setCampaignData(prev => ({
      ...prev,
      ads: prev.ads.filter(ad => ad.id !== adId),
    }));
    notifications.success('Ad deleted', { title: 'Deleted' });
  };

  const handleToggleAdSelection = (adId: string) => {
    setCampaignData(prev => ({
      ...prev,
      ads: prev.ads.map(ad => 
        ad.id === adId ? { ...ad, selected: !ad.selected } : ad
      ),
    }));
  };

  const handleAddExtension = async (adId: string, extensionType: string) => {
    try {
      setLoading(true);
      
      // Import extension generator
      const { generateExtensionsWithAI } = await import('../utils/extensionGeneratorAI');
      
      // Generate AI-based extension
      const extensionData = await generateExtensionsWithAI({
        url: campaignData.url || '',
        keywords: campaignData.seedKeywords || [],
        vertical: campaignData.vertical || 'General',
        intent: campaignData.intent?.intentLabel || undefined,
        cta: campaignData.cta || undefined,
        businessName: campaignData.campaignName || 'Business',
        ads: campaignData.ads,
      }, extensionType);
      
      setCampaignData(prev => ({
        ...prev,
        ads: prev.ads.map(ad => {
          if (ad.id === adId) {
            const currentExtensions = Array.isArray(ad.extensions) ? ad.extensions : [];
            const extensionExists = currentExtensions.some((ext: any) => ext.type === extensionType);
            if (extensionExists) {
              return ad;
            }
            
            const newExtension: any = {
              id: `ext-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              type: extensionType,
              extensionType: extensionType,
              label: extensionType.charAt(0).toUpperCase() + extensionType.slice(1).replace(/([A-Z])/g, ' $1'),
            };
            
            // Apply AI-generated data
            if (extensionType === 'snippet' && extensionData.header) {
              newExtension.header = extensionData.header;
              newExtension.values = extensionData.values || [];
              newExtension.text = `${newExtension.header}: ${newExtension.values.join(', ')}`;
            } else if (extensionType === 'callout' && extensionData.callouts) {
              newExtension.callouts = extensionData.callouts;
              newExtension.text = newExtension.callouts.join(', ');
            } else if (extensionType === 'sitelink' && extensionData.sitelinks) {
              newExtension.sitelinks = extensionData.sitelinks.map((sl: any) => ({
                text: sl.text || sl.linkText || 'Link',
                description: sl.description || '',
                url: campaignData.url || ''
              }));
              newExtension.text = newExtension.sitelinks.map((sl: any) => sl.text).join(', ');
            } else if (extensionType === 'call' && extensionData.phone) {
              newExtension.phone = extensionData.phone;
              newExtension.phoneNumber = extensionData.phone;
              newExtension.countryCode = 'US';
              newExtension.text = newExtension.phone;
            } else if (extensionType === 'message' && extensionData.message) {
              newExtension.message = extensionData.message;
              newExtension.text = newExtension.message;
            } else if (extensionType === 'promotion' && extensionData.promotionText) {
              newExtension.promotionText = extensionData.promotionText;
              newExtension.text = newExtension.promotionText;
            } else {
              newExtension.text = extensionData.text || 'Extension';
            }
            
            return {
              ...ad,
              extensions: [...currentExtensions, newExtension],
            };
          }
          return ad;
        }),
      }));
      
      notifications.success('AI-generated extension added', { title: 'Extension Added' });
    } catch (error) {
      console.error('Error adding extension:', error);
      notifications.error('Failed to generate extension', { title: 'Extension Error' });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveExtension = (adId: string, extensionId: string) => {
    setCampaignData(prev => ({
        ...prev,
        ads: prev.ads.map(ad => {
          if (ad.id === adId) {
            return {
              ...ad,
            extensions: (ad.extensions || []).filter((ext: any) => ext.id !== extensionId),
            };
          }
          return ad;
        }),
    }));
    notifications.success('Extension removed', { title: 'Removed' });
  };

  const handleAddExtensionToAllAds = (extensionType: string) => {
    if (campaignData.ads.length === 0) {
      notifications.warning('Please create at least one ad before adding extensions', {
        title: 'No Ads Found'
      });
      return;
    }

    setCampaignData(prev => {
      const updatedAds = prev.ads.map((ad, index) => {
        // Ensure extensions array exists
        const currentExtensions = Array.isArray(ad.extensions) ? ad.extensions : [];
        
        // Check if this extension type already exists for this ad
        const extensionExists = currentExtensions.some((ext: any) => ext.type === extensionType);
        if (extensionExists) {
          // Extension already exists, don't add duplicate
          return ad;
        }
        
        // Create unique extension ID
        const extensionId = `ext-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Create extension with proper structure based on type
        const newExtension: any = {
          id: extensionId,
          type: extensionType,
          extensionType: extensionType,
          label: extensionType.charAt(0).toUpperCase() + extensionType.slice(1).replace(/([A-Z])/g, ' $1'),
        };
        
        // Add type-specific default values
        switch (extensionType) {
          case 'snippet':
            newExtension.header = 'Types';
            newExtension.values = ['Service 1', 'Service 2', 'Service 3'];
            newExtension.text = `Types: ${newExtension.values.join(', ')}`;
            break;
          case 'callout':
            newExtension.callouts = ['24/7 Support', 'Free Consultation', 'Expert Service'];
            newExtension.text = newExtension.callouts.join(', ');
            break;
          case 'sitelink':
            newExtension.sitelinks = [
              { text: 'Contact Us', description: 'Get in touch', url: campaignData.url || '' },
              { text: 'Services', description: 'Our services', url: campaignData.url || '' }
            ];
            newExtension.text = newExtension.sitelinks.map((sl: any) => sl.text).join(', ');
            break;
          case 'call':
            newExtension.phone = '(555) 123-4567';
            newExtension.phoneNumber = '(555) 123-4567';
            newExtension.countryCode = 'US';
            newExtension.text = newExtension.phone;
            break;
          case 'price':
            newExtension.priceQualifier = 'From';
            newExtension.price = '$99';
            newExtension.currency = 'USD';
            newExtension.unit = 'per service';
            newExtension.text = `${newExtension.priceQualifier} ${newExtension.price} ${newExtension.unit}`;
            break;
          default:
            newExtension.text = newExtension.label;
        }
        
        return {
          ...ad,
          extensions: [...currentExtensions, newExtension],
        };
      });
      
        return {
        ...prev,
        ads: updatedAds,
      };
    });

    // Get extension label for notification
    const extensionLabel = extensionType.charAt(0).toUpperCase() + extensionType.slice(1).replace(/([A-Z])/g, ' $1');
    notifications.success(`Added ${extensionLabel} extension to all ${campaignData.ads.length} ad(s)`, {
      title: 'Extension Added'
    });
  };


  // Step 6: CSV Generation & Validation - Using Master 183-Column Format
  const handleGenerateCSV = async () => {
    setLoading(true);
    try {
      const campaignNameValue = campaignData.campaignName || 'Campaign 1';
      
      // Import the new V5 Master CSV exporter with all 183 columns
      const { generateMasterCSV, convertToV5Format } = await import('../utils/googleAdsEditorCSVExporterV5');
      
      // Collect all extensions from ads - properly handle nested structures
      const sitelinks: any[] = [];
      const callouts: any[] = [];
      const snippets: any[] = [];
      const seenSitelinks = new Set<string>();
      const seenCallouts = new Set<string>();
      const seenSnippets = new Set<string>();
      
      (campaignData.ads || []).forEach((ad: any) => {
        if (ad.extensions && Array.isArray(ad.extensions)) {
          ad.extensions.forEach((ext: any) => {
            if (ext.type === 'sitelink') {
              // Handle nested sitelinks array structure from ADD ALL button
              if (ext.sitelinks && Array.isArray(ext.sitelinks)) {
                ext.sitelinks.forEach((sl: any) => {
                  const slText = sl.text || sl.linkText || '';
                  if (slText && !seenSitelinks.has(slText)) {
                    seenSitelinks.add(slText);
                    sitelinks.push({
                      text: slText,
                      description1: sl.description || sl.description1 || '',
                      description2: sl.description2 || '',
                      finalUrl: sl.url || sl.finalUrl || campaignData.url || '',
                      status: 'Enabled'
                    });
                  }
                });
              } else {
                // Handle flat structure
                const slText = ext.text || ext.linkText || '';
                if (slText && !seenSitelinks.has(slText)) {
                  seenSitelinks.add(slText);
                  sitelinks.push({
                    text: slText,
                    description1: ext.description1 || ext.descriptionLine1 || '',
                    description2: ext.description2 || ext.descriptionLine2 || '',
                    finalUrl: ext.finalUrl || ext.url || campaignData.url || '',
                    status: 'Enabled'
                  });
                }
              }
            } else if (ext.type === 'callout') {
              // Handle nested callouts array structure from ADD ALL button
              if (ext.callouts && Array.isArray(ext.callouts)) {
                ext.callouts.forEach((calloutText: string) => {
                  if (calloutText && !seenCallouts.has(calloutText)) {
                    seenCallouts.add(calloutText);
                    callouts.push({
                      text: calloutText,
                      status: 'Enabled'
                    });
                  }
                });
              } else if (ext.text && !seenCallouts.has(ext.text)) {
                // Handle flat structure
                seenCallouts.add(ext.text);
                callouts.push({
                  text: ext.text,
                  status: 'Enabled'
                });
              }
            } else if (ext.type === 'snippet') {
              // Handle snippet with header and values
              const snippetKey = `${ext.header || ''}:${Array.isArray(ext.values) ? ext.values.join(',') : ext.values || ''}`;
              if (!seenSnippets.has(snippetKey)) {
                seenSnippets.add(snippetKey);
                snippets.push({
                  header: ext.header || 'Types',
                  values: Array.isArray(ext.values) ? ext.values.join(', ') : (ext.values || ''),
                  status: 'Enabled'
                });
              }
            }
          });
        }
      });
      
      // Add default extensions if none found to ensure CSV always has extensions
      if (sitelinks.length === 0) {
        sitelinks.push(
          {
            text: 'Contact Us',
            description1: 'Get in touch today',
            description2: 'Free consultation',
            finalUrl: campaignData.url || '',
            status: 'Enabled'
          },
          {
            text: 'Our Services',
            description1: 'View all services',
            description2: 'Professional solutions',
            finalUrl: campaignData.url || '',
            status: 'Enabled'
          }
        );
      }
      
      if (callouts.length === 0) {
        callouts.push(
          { text: '24/7 Support', status: 'Enabled' },
          { text: 'Free Consultation', status: 'Enabled' },
          { text: 'Expert Service', status: 'Enabled' }
        );
      }
      
      if (snippets.length === 0) {
        snippets.push({
          header: 'Services',
          values: 'Professional Service, Expert Solutions, Quality Work',
          status: 'Enabled'
        });
      }
      
      console.log('📦 Extensions collected for CSV:', { 
        sitelinks: sitelinks.length, 
        callouts: callouts.length, 
        snippets: snippets.length 
      });
      
      // Build the V5 campaign data structure with all 183 columns
      const v5CampaignData: any = {
        campaignName: campaignNameValue,
        dailyBudget: 100,
        campaignType: 'Search',
        bidStrategy: 'Maximize Conversions',
        networks: 'Google search',
        startDate: campaignData.startDate || '',
        endDate: campaignData.endDate || '',
        status: 'Enabled',
        url: campaignData.url || '',
        adGroups: (campaignData.adGroups || []).map((group: any) => ({
          name: group.name || 'Ad Group',
          maxCpc: 2.00,
          status: 'Enabled',
          keywords: (group.keywords || []).map((kw: any) => {
            const kwText = typeof kw === 'string' ? kw : (kw.text || kw.keyword || '');
            let matchType: 'Broad' | 'Phrase' | 'Exact' = 'Broad';
            if (typeof kw === 'object' && kw.matchType) {
              matchType = kw.matchType;
            } else if (typeof kw === 'string') {
              if (kw.startsWith('[') && kw.endsWith(']')) matchType = 'Exact';
              else if (kw.startsWith('"') && kw.endsWith('"')) matchType = 'Phrase';
            }
            return {
              text: kwText.replace(/^\[|\]$|^"|"$/g, ''),
              matchType,
              status: 'Enabled',
              finalUrl: campaignData.url || ''
            };
          }),
          ads: []
        })),
        negativeKeywords: campaignData.negativeKeywords || [],
        locations: {
          countries: campaignData.locations?.countries || [],
          states: campaignData.locations?.states || [],
          cities: campaignData.locations?.cities || [],
          zipCodes: campaignData.locations?.zipCodes || [],
          countryCode: campaignData.targetCountry === 'United States' ? 'US' : 
                       campaignData.targetCountry === 'Canada' ? 'CA' :
                       campaignData.targetCountry === 'United Kingdom' ? 'GB' :
                       campaignData.targetCountry === 'Australia' ? 'AU' : 'US'
        },
        sitelinks: sitelinks.slice(0, 4),
        callouts: callouts.slice(0, 4),
        snippets: snippets.slice(0, 2)
      };
      
      // Add ads to ALL ad groups - each ad group should have the same ads
      // This ensures every ad group has RSAs for proper campaign structure
      const adsToDistribute = (campaignData.ads || []).map((ad: any) => {
        // Handle both structures: headlines array OR headline1/headline2/etc properties
        let headlines: string[] = [];
        if (ad.headlines && Array.isArray(ad.headlines)) {
          // RSA ads with headlines array
          headlines = ad.headlines.map((h: any) => typeof h === 'string' ? h : (h.text || '')).filter((h: string) => h);
        } else {
          // DKI/Call ads with headline1, headline2, etc.
          headlines = [
            ad.headline1 || '',
            ad.headline2 || '',
            ad.headline3 || '',
            ad.headline4 || '',
            ad.headline5 || '',
            ad.headline6 || '',
            ad.headline7 || '',
            ad.headline8 || '',
            ad.headline9 || '',
            ad.headline10 || '',
            ad.headline11 || '',
            ad.headline12 || '',
            ad.headline13 || '',
            ad.headline14 || '',
            ad.headline15 || ''
          ].filter((h: string) => h);
        }
        
        // Handle both structures: descriptions array OR description1/description2/etc properties
        let descriptions: string[] = [];
        if (ad.descriptions && Array.isArray(ad.descriptions)) {
          descriptions = ad.descriptions.map((d: any) => typeof d === 'string' ? d : (d.text || '')).filter((d: string) => d);
        } else {
          descriptions = [
            ad.description1 || '',
            ad.description2 || '',
            ad.description3 || '',
            ad.description4 || ''
          ].filter((d: string) => d);
        }
        
        return {
          type: ad.type === 'call_only' ? 'CallOnly' : 
                ad.type === 'dki' ? 'DKI' : 'RSA',
          headlines,
          descriptions,
          finalUrl: ad.finalUrl || campaignData.url || '',
          path1: ad.path1 || '',
          path2: ad.path2 || '',
          status: 'Enabled'
        };
      });
      
      // Distribute ads to ALL ad groups
      v5CampaignData.adGroups.forEach((group: any) => {
        group.ads = [...adsToDistribute];
      });
      
      // Legacy code kept for backwards compatibility - adds any ads with specific ad group assignments
      (campaignData.ads || []).forEach((ad: any) => {
        const adGroupName = ad.adGroup || '';
        if (!adGroupName) return; // Skip if no specific ad group assigned
        
        let targetGroup = v5CampaignData.adGroups.find((ag: any) => ag.name === adGroupName);
        
        if (!targetGroup) return; // Skip if ad group not found
        
        // Check if this ad is already added (avoid duplicates)
        const adKey = `${ad.headline1}::${ad.headline2}::${ad.description1}`;
        const existingAd = targetGroup.ads.find((existing: any) => 
          `${existing.headlines[0]}::${existing.headlines[1]}::${existing.descriptions[0]}` === adKey
        );
        
        if (existingAd) return; // Already added
        
        // Handle both structures for legacy code
        let legacyHeadlines: string[] = [];
        if (ad.headlines && Array.isArray(ad.headlines)) {
          legacyHeadlines = ad.headlines.map((h: any) => typeof h === 'string' ? h : (h.text || '')).filter((h: string) => h);
        } else {
          legacyHeadlines = [ad.headline1, ad.headline2, ad.headline3, ad.headline4, ad.headline5].filter((h: string) => h);
        }
        
        let legacyDescriptions: string[] = [];
        if (ad.descriptions && Array.isArray(ad.descriptions)) {
          legacyDescriptions = ad.descriptions.map((d: any) => typeof d === 'string' ? d : (d.text || '')).filter((d: string) => d);
        } else {
          legacyDescriptions = [ad.description1, ad.description2].filter((d: string) => d);
        }
        
        targetGroup.ads.push({
            type: ad.type === 'call_only' ? 'CallOnly' : 
                  ad.type === 'dki' ? 'DKI' : 'RSA',
            headlines: legacyHeadlines,
            descriptions: legacyDescriptions,
            path1: ad.path1 || '',
            path2: ad.path2 || '',
            finalUrl: ad.finalUrl || campaignData.url || '',
            phoneNumber: ad.phoneNumber || '',
            verificationUrl: ad.verificationUrl || '',
            businessName: ad.businessName || ''
          });
      });
      
      // If no specific locations, add the target country
      if (!v5CampaignData.locations?.countries?.length && 
          !v5CampaignData.locations?.states?.length && 
          !v5CampaignData.locations?.cities?.length && 
          !v5CampaignData.locations?.zipCodes?.length) {
        v5CampaignData.locations = {
          ...v5CampaignData.locations,
          countries: [campaignData.targetCountry || 'United States']
        };
      }
      
      // Generate the master CSV with all 183 columns
      const csvContent = generateMasterCSV(v5CampaignData);
      
      // Store CSV data in state (already includes BOM)
      setCampaignData(prev => ({
        ...prev,
        csvData: csvContent,
        csvErrors: [],
      }));
      
      notifications.success('Master CSV generated with 183 columns!', {
        title: 'CSV Ready',
        description: `Your campaign "${campaignNameValue}" is ready for Google Ads Editor import.`
      });
    } catch (error) {
      console.error('CSV generation error:', error);
      notifications.error('Failed to generate CSV', {
        title: 'Generation Error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculate export statistics from actual CSV data to match what will be imported
  const getExportStatistics = () => {
    if (!campaignData.csvData) return null;
    
    try {
      // Parse the CSV to count actual rows by type
      const csvText = campaignData.csvData.replace(/^\uFEFF/, ''); // Remove BOM
      const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });
      const rows = parsed.data as Record<string, string>[];
      const totalRows = rows.length || 0;
      
      // Count entities from actual CSV data (matches what Google Ads Editor will import)
      let campaigns = 0;
      let adGroupsSet = new Set<string>();
      let keywords = 0;
      let negativeKeywords = 0;
      let ads = 0;
      let locations = 0;
      
      rows.forEach(row => {
        const adGroupName = row['Ad Group'] || '';
        const keyword = row['Keyword'] || '';
        const negativeKw = row['Keyword (Negative)'] || '';
        const adType = row['Ad Type'] || '';
        const locationType = row['Location Type'] || '';
        const headline1 = row['Headline 1'] || '';
        
        // Count campaigns (rows with budget and no ad group)
        if (row['Campaign Daily Budget'] && !adGroupName) {
          campaigns++;
        }
        
        // Count unique ad groups (rows with ad group name but no keyword/ad)
        if (adGroupName && !keyword && !negativeKw && !adType && !locationType) {
          adGroupsSet.add(adGroupName);
        }
        
        // Count keywords
        if (keyword) {
          keywords++;
        }
        
        // Count negative keywords
        if (negativeKw) {
          negativeKeywords++;
        }
        
        // Count ads (rows with Ad Type and headlines)
        if (adType && headline1) {
          ads++;
        }
        
        // Count locations
        if (locationType) {
          locations++;
        }
      });
      
      // Count extensions from campaignData.ads (stored as ad.extensions arrays)
      let extensions = 0;
      (campaignData.ads || []).forEach((ad: any) => {
        if (ad.extensions && Array.isArray(ad.extensions)) {
          extensions += ad.extensions.length;
        }
      });
      
      const stats = {
        campaigns: Math.max(campaigns, 1),
        adGroups: adGroupsSet.size || campaignData.adGroups.length,
        keywords: keywords,
        negativeKeywords: negativeKeywords,
        ads: ads,
        extensions: extensions,
        locations: locations || 1,
        totalRows: totalRows,
      };
      
      return stats;
    } catch (error) {
      console.error('Error calculating export statistics:', error);
      return null;
    }
  };

  const handleDownloadCSV = async () => {
    // If CSV not generated yet, generate it first
    if (!campaignData.csvData) {
      await handleGenerateCSV();
      // Wait a moment for state to update, then show dialog
      setTimeout(() => {
        setShowExportDialog(true);
      }, 100);
      return;
    }
    
    // Show export brief dialog
    setShowExportDialog(true);
  };

  const confirmDownloadCSV = async () => {
    if (!campaignData.csvData) {
      notifications.error('No CSV data available. Please generate the campaign first.', { title: 'Export Error' });
      setShowExportDialog(false);
      return;
    }
    
    try {
    const baseFilename = (campaignData.campaignName || 'campaign').replace(/[^a-z0-9]/gi, '_');
    const dateStr = new Date().toISOString().split('T')[0];
    
    const selectedCountries = (campaignData.selectedGeoCountries || []).filter(c => c);
    const isGeoMultiCountry = campaignData.selectedStructure === 'geo' && selectedCountries.length > 1;
    
    const generateCountrySpecificCSV = (csvData: string, country: string, originalCampaignName: string): string => {
      const parsed = Papa.parse(csvData, { header: true });
      const rows = parsed.data as Record<string, string>[];
      const newCampaignName = `${originalCampaignName} - ${country}`;
      
      const filteredRows = rows.filter(row => row['Row Type'] !== 'Location');
      
      const processedRows = filteredRows.map(row => {
        const newRow = { ...row };
        if (newRow['Campaign'] === originalCampaignName) {
          newRow['Campaign'] = newCampaignName;
        }
        return newRow;
      });
      
      const campaignRowIndex = processedRows.findIndex(row => row['Row Type'] === 'Campaign');
      if (campaignRowIndex !== -1) {
        const locationRow: Record<string, string> = {};
        Object.keys(processedRows[0] || {}).forEach(key => locationRow[key] = '');
        locationRow['Row Type'] = 'Location';
        locationRow['Action'] = 'Add';
        locationRow['Campaign'] = newCampaignName;
        locationRow['Location'] = country;
        processedRows.splice(campaignRowIndex + 1, 0, locationRow);
      }
      
      return Papa.unparse(processedRows);
    };
    
    if (isGeoMultiCountry) {
      const zip = new JSZip();
      
      for (const country of selectedCountries) {
        const countrySlug = country.replace(/[^a-z0-9]/gi, '_');
        const csvContent = generateCountrySpecificCSV(campaignData.csvData, country, campaignData.campaignName || 'Campaign');
        const filename = `${baseFilename}_${countrySlug}_google_ads_editor_${dateStr}.csv`;
        zip.file(filename, csvContent);
      }
      
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${baseFilename}_multi_country_${dateStr}.zip`;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else if (campaignData.selectedStructure === 'geo' && selectedCountries.length === 1) {
      const csvContent = generateCountrySpecificCSV(campaignData.csvData, selectedCountries[0], campaignData.campaignName || 'Campaign');
      const filename = `${baseFilename}_google_ads_editor_${dateStr}.csv`;
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      const filename = `${baseFilename}_google_ads_editor_${dateStr}.csv`;
      const blob = new Blob([campaignData.csvData], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
    
    setShowExportDialog(false);
    
    notifications.success('CSV downloaded successfully!', { title: 'Export Complete' });
    
    setTimeout(() => {
      const event = new CustomEvent('navigate', { detail: { tab: 'dashboard' } });
      window.dispatchEvent(event);
      if (window.location.hash) {
        window.location.hash = '#dashboard';
      }
    }, 1000);
    } catch (error) {
      console.error('Download error:', error);
      notifications.error('Failed to download CSV. Please try again.', { title: 'Download Error' });
      setShowExportDialog(false);
    }
  };

  const handleSaveCampaign = async () => {
    setLoading(true);
    try {
      // Generate CSV first
      await handleGenerateCSV();

      await historyService.save('campaign', campaignData.campaignName, {
        name: campaignData.campaignName,
        url: campaignData.url,
        structure: campaignData.selectedStructure || 'stag',
        keywords: campaignData.selectedKeywords,
        ads: campaignData.ads,
        locations: campaignData.locations,
        intent: campaignData.intent,
        vertical: campaignData.vertical,
        cta: campaignData.cta,
        negativeKeywords: campaignData.negativeKeywords,
        adGroups: campaignData.adGroups,
        csvData: campaignData.csvData,
        createdAt: new Date().toISOString(),
      }, 'completed');

      setCampaignSaved(true);
      setCurrentStep(7); // Show success screen
      
      notifications.success('Campaign saved!', { title: 'Success' });
    } catch (error) {
      console.error('Save error:', error);
      notifications.error('Failed to save campaign', {
        title: 'Save Error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Render functions for each step
  const renderStep1 = () => (
    <div className="max-w-4xl mx-auto px-3 py-4 sm:p-6">
      {/* Step Navigation */}
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={handleBackStep}
          disabled={true}
          className="text-2xl font-semibold italic bg-gradient-to-r from-slate-300 to-slate-400 bg-clip-text text-transparent cursor-not-allowed opacity-50"
        >
          Back
        </button>
        <button
          onClick={handleNextStep}
          disabled={loading}
          className="text-2xl font-semibold italic bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50"
        >
          Next
        </button>
      </div>

      {/* Shell View - Campaign Builder Info */}
      <Card className="mb-6 border-slate-700 bg-slate-900 shadow-xl">
        <CardHeader className="pb-2 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
            </div>
            <span className="text-slate-400 text-sm font-mono">Campaign Builder 3.0</span>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="font-mono text-sm space-y-2">
            <div className="flex items-start gap-3">
              <span className="text-slate-500 text-xs shrink-0">[{new Date().toLocaleTimeString()}]</span>
              <span className="text-cyan-400">
                <span className="text-cyan-500 mr-1">{'>'}</span>
                Initializing Campaign Builder...
              </span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-slate-500 text-xs shrink-0">[{new Date().toLocaleTimeString()}]</span>
              <span className="text-green-400">
                <span className="text-green-500 mr-1">✓</span>
                14 Campaign Structures Available
              </span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-slate-500 text-xs shrink-0">[{new Date().toLocaleTimeString()}]</span>
              <span className="text-yellow-300">
                <span className="text-yellow-500 mr-1">•</span>
                Supported: SKAG, STAG, Intent-Based, Alpha-Beta, Funnel, GEO-Segmented & more
              </span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-slate-500 text-xs shrink-0">[{new Date().toLocaleTimeString()}]</span>
              <span className="text-indigo-400">
                <span className="text-indigo-500 mr-1">★</span>
                AI-Powered Analysis Ready
              </span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-slate-500 text-xs shrink-0">[{new Date().toLocaleTimeString()}]</span>
              <span className="text-slate-400">
                <span className="text-slate-500 mr-1">→</span>
                Enter your website URL below to begin analysis
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Simple 2-row form: Campaign Name + URL */}
      <div className="space-y-4 mb-6">
        <div className="flex items-center gap-2">
          <Input
            id="campaignName"
            type="text"
            placeholder="Campaign Name"
            value={campaignData.campaignName}
            onChange={(e) => setCampaignData(prev => ({ ...prev, campaignName: e.target.value }))}
            disabled={!editingCampaignName}
            className={`flex-1 ${!editingCampaignName ? 'bg-slate-100 text-slate-500' : ''}`}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setEditingCampaignName(!editingCampaignName)}
            className={`shrink-0 ${editingCampaignName ? 'border-indigo-500 text-indigo-600' : 'text-slate-500'}`}
            title={editingCampaignName ? 'Done editing' : 'Edit campaign name'}
          >
            {editingCampaignName ? <Check className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
          </Button>
        </div>
        <div className="flex gap-2">
          <Input
            id="websiteUrl"
            type="url"
            placeholder="https://www.example.com"
            value={campaignData.url}
            onChange={(e) => setCampaignData(prev => ({ ...prev, url: e.target.value }))}
            className="flex-1"
          />
          <Button onClick={handleUrlSubmit} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
            Analyze
          </Button>
        </div>
      </div>

      {/* Live Analysis Logs - Terminal Style */}
      {(isAnalyzing || analysisLogs.length > 0) && (
        <Card className="mb-6 border-slate-700 bg-slate-900 shadow-xl">
          <CardHeader className="pb-2 border-b border-slate-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                </div>
                <span className="text-slate-400 text-sm font-mono">Website Analysis Console</span>
              </div>
              {isAnalyzing && (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-green-400 animate-spin" />
                  <span className="text-green-400 text-xs font-mono">Analyzing...</span>
                </div>
              )}
              {!isAnalyzing && analysisLogs.length > 0 && (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  <span className="text-green-400 text-xs font-mono">Complete</span>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div 
              ref={analysisLogsRef}
              className="font-mono text-sm max-h-80 overflow-y-auto p-4 space-y-1"
              style={{ scrollBehavior: 'smooth' }}
            >
              {analysisLogs.map((log, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <span className="text-slate-500 text-xs shrink-0">[{log.timestamp}]</span>
                  <span className={`
                    ${log.type === 'step' ? 'text-cyan-400 font-semibold' : ''}
                    ${log.type === 'success' ? 'text-green-400' : ''}
                    ${log.type === 'data' ? 'text-yellow-300' : ''}
                    ${log.type === 'ai' ? 'text-indigo-400' : ''}
                    ${log.type === 'info' ? 'text-slate-400' : ''}
                  `}>
                    {log.type === 'step' && <span className="text-cyan-500 mr-1">{'>'}</span>}
                    {log.type === 'success' && <span className="text-green-500 mr-1">✓</span>}
                    {log.type === 'data' && <span className="text-yellow-500 mr-1">•</span>}
                    {log.type === 'ai' && <span className="text-indigo-500 mr-1">★</span>}
                    {log.type === 'info' && <span className="text-slate-500 mr-1">→</span>}
                    {log.message}
                  </span>
                </div>
              ))}
              {isAnalyzing && (
                <div className="flex items-center gap-2 text-green-400">
                  <span className="animate-pulse">_</span>
                </div>
              )}
            </div>
            
            {/* Next Button - Shows after complete */}
            {!isAnalyzing && campaignData.intent && (
              <div className="border-t border-slate-700 p-4 bg-slate-800/50">
                <Button 
                  onClick={() => setCurrentStep(2)}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold"
                >
                  Next: Select Campaign Structure →
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

    </div>
  );

  const renderStep2 = () => (
    <div className="max-w-6xl mx-auto px-3 py-4 sm:p-6">
      {/* Step Navigation */}
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={handleBackStep}
          className="text-2xl font-semibold italic bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent hover:from-indigo-500 hover:to-purple-500"
        >
          Back
        </button>
        <button
          onClick={handleNextStep}
          disabled={loading}
          className="text-2xl font-semibold italic bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50"
        >
          Next
        </button>
      </div>

      <div className="mb-8">
        <h3 className="text-lg font-semibold text-slate-800 mb-2">Select Campaign Structure</h3>
        <p className="text-slate-600">AI has ranked the best structures for your vertical. Choose the one that fits your needs.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-12">
        {CAMPAIGN_STRUCTURES.map((structure, idx) => {
          const ranking = campaignData.structureRankings.findIndex(r => r.id === structure.id);
          const isRecommended = ranking === 0 || ranking === 1 || ranking === 2;
          const rankLabel = ranking === 0 ? 'Best' : ranking === 1 ? '2nd' : ranking === 2 ? '3rd' : null;
          const isSelected = campaignData.selectedStructure === structure.id;
          const Icon = structure.icon;

          return (
            <div key={structure.id} className="relative group">
              <Card
                className={`cursor-pointer transition-all duration-200 p-3 h-full border-2 ${
                  isSelected
                    ? 'ring-2 ring-indigo-500 bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-300 shadow-lg'
                    : 'hover:shadow-lg hover:border-indigo-300 hover:bg-slate-50 border-slate-200'
                }`}
                onClick={() => handleStructureSelect(structure.id)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-indigo-100' : 'bg-slate-100 group-hover:bg-indigo-100'} transition-colors`}>
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-indigo-600' : 'text-slate-600 group-hover:text-indigo-600'} transition-colors`} />
                  </div>
                  {isRecommended && rankLabel && (
                    <Badge 
                      variant={ranking === 0 ? 'default' : 'secondary'} 
                      className={`text-[10px] px-1.5 py-0.5 h-5 ${ranking === 0 ? 'bg-gradient-to-r from-indigo-600 to-purple-600' : ''}`}
                    >
                      {rankLabel}
                    </Badge>
                  )}
                </div>
                <h4 className="text-sm font-bold text-slate-800 mb-1">{structure.name}</h4>
                <p className="text-xs text-slate-500 leading-relaxed">{structure.description}</p>
                {isSelected && (
                  <div className="flex items-center gap-1.5 text-indigo-600 mt-2 pt-2 border-t border-indigo-200">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span className="text-xs font-semibold">Selected</span>
                  </div>
                )}
              </Card>
            </div>
          );
        })}
      </div>

      {/* Structure-specific inputs - shown immediately after selection */}
      {campaignData.selectedStructure === 'seasonal' && (
        <Card className="mb-6 border-orange-200 bg-orange-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-orange-600" />
              <CardTitle className="text-lg">Seasonal Campaign Dates</CardTitle>
            </div>
            <CardDescription>Set the start and end dates for your seasonal/promotional campaign</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-semibold mb-2 block">Start Date</Label>
                <Input
                  type="date"
                  value={campaignData.startDate || ''}
                  onChange={(e) => setCampaignData(prev => ({ ...prev, startDate: e.target.value }))}
                  className="bg-white"
                />
              </div>
              <div>
                <Label className="text-sm font-semibold mb-2 block">End Date</Label>
                <Input
                  type="date"
                  value={campaignData.endDate || ''}
                  onChange={(e) => setCampaignData(prev => ({ ...prev, endDate: e.target.value }))}
                  className="bg-white"
                />
              </div>
            </div>
            <p className="text-sm text-orange-700 mt-3">
              These dates will be included in your CSV export for Google Ads scheduling.
            </p>
          </CardContent>
        </Card>
      )}

      {campaignData.selectedStructure === 'geo' && (
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-600" />
              <CardTitle className="text-lg">GEO-Segmented Countries</CardTitle>
            </div>
            <CardDescription>Select up to 3 countries - a separate CSV will be generated for each country</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(campaignData.selectedGeoCountries || []).map((country, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Select
                    value={country}
                    onValueChange={(value: string) => {
                      const updated = [...(campaignData.selectedGeoCountries || [])];
                      updated[index] = value;
                      setCampaignData(prev => ({ ...prev, selectedGeoCountries: updated }));
                    }}
                  >
                    <SelectTrigger className="bg-white flex-1">
                      <SelectValue placeholder="Select a country" />
                    </SelectTrigger>
                    <SelectContent>
                      {LOCATION_PRESETS.countries.map((c) => (
                        <SelectItem 
                          key={c} 
                          value={c}
                          disabled={(campaignData.selectedGeoCountries || []).includes(c) && c !== country}
                        >
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-500 hover:text-red-700 hover:bg-red-100"
                    onClick={() => {
                      const updated = (campaignData.selectedGeoCountries || []).filter((_, i) => i !== index);
                      setCampaignData(prev => ({ ...prev, selectedGeoCountries: updated }));
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              
              {(campaignData.selectedGeoCountries || []).length < 3 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-dashed border-blue-300 text-blue-600 hover:bg-blue-100"
                  onClick={() => {
                    const current = campaignData.selectedGeoCountries || [];
                    if (current.length < 3) {
                      setCampaignData(prev => ({ 
                        ...prev, 
                        selectedGeoCountries: [...current, ''] 
                      }));
                    }
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Country {(campaignData.selectedGeoCountries || []).length > 0 ? `(${3 - (campaignData.selectedGeoCountries || []).length} remaining)` : ''}
                </Button>
              )}
              
              {(campaignData.selectedGeoCountries || []).length > 0 && (
                <p className="text-sm text-blue-700 mt-3">
                  {(campaignData.selectedGeoCountries || []).filter(c => c).length} CSV file(s) will be generated, one for each country selected.
                  {(campaignData.selectedGeoCountries || []).filter(c => c).length > 1 && ' Download will be a ZIP file.'}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Inline Structure Details - shown after inputs */}
      {campaignData.selectedStructure && (() => {
        const selectedStruct = CAMPAIGN_STRUCTURES.find(s => s.id === campaignData.selectedStructure);
        const ranking = campaignData.structureRankings.findIndex(r => r.id === campaignData.selectedStructure);
        const isBest = ranking === 0;
        const Icon = selectedStruct?.icon || Target;
        
        const structureDetails: { [key: string]: { hierarchy: { name: string; desc: string; color: string }[]; benefits: string[]; bestFor: string } } = {
          skag: {
            hierarchy: [
              { name: 'Ad Group 1', desc: '→ keyword 1', color: 'border-indigo-200 bg-indigo-50' },
              { name: 'Ad Group 2', desc: '→ keyword 2', color: 'border-indigo-200 bg-indigo-50' },
              { name: 'Ad Group 3', desc: '→ keyword 3', color: 'border-indigo-200 bg-indigo-50' },
              { name: 'Ad Group 4', desc: '→ keyword 4', color: 'border-indigo-200 bg-indigo-50' },
            ],
            benefits: ['Maximum control & relevance', 'Highest Quality Score potential', 'Easy to optimize per keyword', 'Best for high-value keywords'],
            bestFor: 'High-value keywords, maximum control, best performance'
          },
          stag: {
            hierarchy: [
              { name: 'Theme Group 1', desc: '5-10 related keywords', color: 'border-blue-200 bg-blue-50' },
              { name: 'Theme Group 2', desc: '5-10 related keywords', color: 'border-blue-200 bg-blue-50' },
              { name: 'Theme Group 3', desc: '5-10 related keywords', color: 'border-blue-200 bg-blue-50' },
            ],
            benefits: ['Organized by themes', 'Easier to manage at scale', 'Better ad relevance', 'Good balance of control'],
            bestFor: 'Medium to large keyword sets, themed campaigns'
          },
          intent: {
            hierarchy: [
              { name: 'Informational Intent', desc: '"what is", "how to", "guide"', color: 'border-indigo-200 bg-indigo-50' },
              { name: 'Commercial Intent', desc: '"best", "review", "compare"', color: 'border-blue-200 bg-blue-50' },
              { name: 'Transactional Intent', desc: '"buy", "price", "deal"', color: 'border-indigo-200 bg-indigo-50' },
            ],
            benefits: ['Intent-aligned messaging', 'Better conversion rates', 'Targeted ad copy', 'Improved relevance'],
            bestFor: 'Different messaging per search intent'
          },
          funnel: {
            hierarchy: [
              { name: 'Top of Funnel (Awareness)', desc: 'General keywords, educational content', color: 'border-cyan-200 bg-cyan-50' },
              { name: 'Middle of Funnel (Consideration)', desc: 'Comparison keywords, features', color: 'border-blue-200 bg-blue-50' },
              { name: 'Bottom of Funnel (Decision)', desc: 'Buy keywords, pricing, deals', color: 'border-indigo-200 bg-indigo-50' },
            ],
            benefits: ['Funnel-aligned messaging', 'Different goals per stage', 'Better conversion tracking', 'Optimized for each stage'],
            bestFor: 'Full funnel strategy, different messaging per stage'
          },
          alpha_beta: {
            hierarchy: [
              { name: 'Alpha Campaign', desc: 'Proven winners, exact match', color: 'border-indigo-200 bg-indigo-50' },
              { name: 'Beta Campaign', desc: 'Discovery, broad match', color: 'border-amber-200 bg-amber-50' },
            ],
            benefits: ['Test new keywords safely', 'Protect top performers', 'Systematic optimization', 'Clear budget allocation'],
            bestFor: 'Continuous optimization, testing new keywords'
          },
          match_type: {
            hierarchy: [
              { name: 'Broad Match Campaign', desc: 'Maximum reach, discovery', color: 'border-amber-200 bg-amber-50' },
              { name: 'Phrase Match Campaign', desc: 'Balanced reach & control', color: 'border-blue-200 bg-blue-50' },
              { name: 'Exact Match Campaign', desc: 'Maximum control & relevance', color: 'border-indigo-200 bg-indigo-50' },
            ],
            benefits: ['Clear match type control', 'Easy budget allocation', 'Performance comparison', 'Bid optimization per type'],
            bestFor: 'Match type testing, budget control per match type'
          },
          geo: {
            hierarchy: [
              { name: 'Location 1 Campaign', desc: 'City/Region specific', color: 'border-blue-200 bg-blue-50' },
              { name: 'Location 2 Campaign', desc: 'City/Region specific', color: 'border-blue-200 bg-blue-50' },
              { name: 'Location 3 Campaign', desc: 'City/Region specific', color: 'border-blue-200 bg-blue-50' },
            ],
            benefits: ['Location-specific messaging', 'Geo bid adjustments', 'Local relevance', 'Market-specific budgets'],
            bestFor: 'Multi-location businesses, local services'
          },
          brand_split: {
            hierarchy: [
              { name: 'Brand Terms', desc: 'Your brand keywords', color: 'border-indigo-200 bg-indigo-50' },
              { name: 'Non-Brand Terms', desc: 'Generic product/service keywords', color: 'border-slate-200 bg-slate-50' },
            ],
            benefits: ['Protect brand terms', 'Clear performance analysis', 'Budget allocation control', 'Competitor defense'],
            bestFor: 'Established brands, brand protection'
          },
          competitor: {
            hierarchy: [
              { name: 'Competitor A Keywords', desc: 'Direct competitor terms', color: 'border-red-200 bg-red-50' },
              { name: 'Competitor B Keywords', desc: 'Direct competitor terms', color: 'border-red-200 bg-red-50' },
              { name: 'Generic Comparison', desc: '"alternatives to", "vs"', color: 'border-amber-200 bg-amber-50' },
            ],
            benefits: ['Capture competitor traffic', 'Comparison positioning', 'Market share growth', 'Competitive messaging'],
            bestFor: 'Competitive markets, market share capture'
          },
          ngram: {
            hierarchy: [
              { name: 'Pattern Cluster 1', desc: 'Keywords with shared n-grams', color: 'border-violet-200 bg-violet-50' },
              { name: 'Pattern Cluster 2', desc: 'Keywords with shared n-grams', color: 'border-violet-200 bg-violet-50' },
              { name: 'Pattern Cluster 3', desc: 'Keywords with shared n-grams', color: 'border-violet-200 bg-violet-50' },
            ],
            benefits: ['Pattern-based grouping', 'Automated organization', 'Discover hidden themes', 'Smart clustering'],
            bestFor: 'Large keyword sets, automated organization'
          },
          long_tail: {
            hierarchy: [
              { name: 'Long-Tail Group 1', desc: '4+ word specific keywords', color: 'border-indigo-200 bg-indigo-50' },
              { name: 'Long-Tail Group 2', desc: '4+ word specific keywords', color: 'border-indigo-200 bg-indigo-50' },
              { name: 'Long-Tail Group 3', desc: '4+ word specific keywords', color: 'border-indigo-200 bg-indigo-50' },
            ],
            benefits: ['Lower competition', 'Higher conversion rates', 'More specific intent', 'Cost-effective clicks'],
            bestFor: 'Budget-conscious campaigns, specific intent targeting'
          },
          seasonal: {
            hierarchy: [
              { name: 'Pre-Season', desc: 'Build awareness early', color: 'border-cyan-200 bg-cyan-50' },
              { name: 'Peak Season', desc: 'Maximum push, high bids', color: 'border-orange-200 bg-orange-50' },
              { name: 'Post-Season', desc: 'Clearance, follow-up', color: 'border-slate-200 bg-slate-50' },
            ],
            benefits: ['Time-optimized messaging', 'Seasonal bid adjustments', 'Planned campaign phases', 'Event-aligned copy'],
            bestFor: 'Seasonal products, holidays, events'
          },
          mix: {
            hierarchy: [
              { name: 'SKAG for Top Performers', desc: 'Single keyword precision', color: 'border-indigo-200 bg-indigo-50' },
              { name: 'STAG for Volume', desc: 'Themed grouping', color: 'border-blue-200 bg-blue-50' },
            ],
            benefits: ['Best of both approaches', 'Flexible structure', 'Optimized by performance', 'Scalable'],
            bestFor: 'Mixed keyword values, flexible optimization'
          },
          stag_plus: {
            hierarchy: [
              { name: 'ML Cluster 1', desc: 'AI-grouped similar keywords', color: 'border-indigo-200 bg-indigo-50' },
              { name: 'ML Cluster 2', desc: 'AI-grouped similar keywords', color: 'border-indigo-200 bg-indigo-50' },
              { name: 'ML Cluster 3', desc: 'AI-grouped similar keywords', color: 'border-indigo-200 bg-indigo-50' },
            ],
            benefits: ['AI-powered grouping', 'Semantic similarity', 'Automatic optimization', 'Smart scaling'],
            bestFor: 'Large campaigns, automated optimization'
          },
        };
        
        const details = structureDetails[campaignData.selectedStructure] || structureDetails['skag'];
        
        return (
          <div className="mb-6 rounded-xl overflow-hidden shadow-lg border border-slate-700">
            {/* Terminal Header */}
            <div className="bg-slate-800 px-4 py-2 flex items-center justify-between border-b border-slate-700">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
              </div>
              <span className="text-slate-400 text-xs font-mono">structure-info.sh</span>
              <div className="w-16"></div>
            </div>
            
            {/* Terminal Body */}
            <div className="bg-slate-900 p-4 font-mono text-xs">
              {/* Header with name */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-emerald-400 font-semibold">[{selectedStruct?.name}]</span>
                {isBest && <span className="text-yellow-400">*RECOMMENDED*</span>}
              </div>
              
              {/* Description */}
              <div className="text-slate-400 mb-3">&gt; {selectedStruct?.description}</div>
              
              {/* Hierarchy - Compact inline */}
              <div className="mb-2">
                <span className="text-cyan-400">hierarchy:</span>
                <span className="text-slate-300 ml-2">
                  {details.hierarchy.map((item, idx) => (
                    <span key={idx}>
                      <span className="text-purple-400">{item.name}</span>
                      {idx < details.hierarchy.length - 1 && <span className="text-slate-500"> → </span>}
                    </span>
                  ))}
                </span>
              </div>
              
              {/* Benefits - Single line */}
              <div className="mb-2">
                <span className="text-cyan-400">benefits:</span>
                <span className="text-emerald-400 ml-2">
                  {details.benefits.map((b, i) => (
                    <span key={i}>&#10003; {b}{i < details.benefits.length - 1 ? ' | ' : ''}</span>
                  ))}
                </span>
              </div>
              
              {/* Best for */}
              <div>
                <span className="text-pink-400">best_for:</span>
                <span className="text-slate-300 ml-2">{details.bestFor}</span>
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );

  const renderStep3 = () => (
    <div className="max-w-6xl mx-auto px-3 py-4 sm:p-6">
      {/* Step Navigation */}
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={handleBackStep}
          className="text-xl sm:text-2xl font-semibold italic bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent hover:from-indigo-500 hover:to-purple-500"
        >
          Back
        </button>
        <button
          onClick={handleNextStep}
          disabled={loading}
          className="text-xl sm:text-2xl font-semibold italic bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50"
        >
          Next
        </button>
      </div>

      <div className="mb-8">
        <h3 className="text-lg font-semibold text-slate-800 mb-2">Keywords Planner</h3>
        <p className="text-slate-600">Generate 410-710 keywords based on your seed keywords and campaign structure</p>
      </div>

      {/* Terminal-Style Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <TerminalCard title="Keyword Statistics" showDots={true} variant="compact">
          <div className="space-y-1.5">
            <TerminalLine prefix="$" label="seed_keywords:" value={`${seedKeywordsText.split(/[\n,]+/).filter(k => k.trim().length > 0 && k.trim().split(/\s+/).length >= 2).length}`} valueColor="cyan" />
            <TerminalLine prefix="$" label="generated:" value={`${campaignData.selectedKeywords.length}`} valueColor="green" />
            <TerminalLine prefix="$" label="negative:" value={`${campaignData.negativeKeywords.length}`} valueColor="yellow" />
            <TerminalLine prefix="$" label="match_types:" value="[BROAD, PHRASE, EXACT]" valueColor="cyan" />
          </div>
        </TerminalCard>

        <TerminalCard title="Generation Status" showDots={true} variant="compact">
          <div className="space-y-1.5">
            <TerminalLine prefix=">" label="structure:" value={CAMPAIGN_STRUCTURES.find(s => s.id === campaignData.selectedStructure)?.name || 'SKAG'} valueColor="cyan" />
            <TerminalLine prefix=">" label="ad_groups:" value={`${campaignData.adGroups.length}`} valueColor="green" />
            <TerminalLine prefix=">" label="status:" value={loading ? 'GENERATING...' : campaignData.selectedKeywords.length > 0 ? 'READY' : 'PENDING'} valueColor={loading ? 'yellow' : campaignData.selectedKeywords.length > 0 ? 'green' : 'slate'} />
            <TerminalLine prefix=">" label="target_range:" value="410-710 keywords" valueColor="cyan" />
          </div>
        </TerminalCard>
      </div>

      <Card className="mb-6">
            <CardHeader>
              <CardTitle>Seed Keywords</CardTitle>
              <CardDescription>AI-suggested seed keywords from your URL analysis - edit as needed (minimum 2 words per keyword)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Textarea
                  placeholder="Enter seed keywords with at least 2 words each (one per line)&#10;Example:&#10;digital marketing&#10;seo services&#10;web design agency"
                  value={seedKeywordsText}
                  onChange={(e) => setSeedKeywordsText(e.target.value)}
                  onBlur={() => {
                    const keywords = seedKeywordsText
                      .split(/[\n,]+/)
                      .map(k => k.trim())
                      .filter(k => k.length > 0 && k.split(/\s+/).length >= 2);
                    setCampaignData(prev => ({ ...prev, seedKeywords: keywords }));
                  }}
                  rows={6}
                  className="font-mono text-sm"
                />
                {(() => {
                  const allKeywords = seedKeywordsText.split(/[\n,]+/).map(k => k.trim()).filter(k => k.length > 0);
                  const validKeywords = allKeywords.filter(k => k.split(/\s+/).length >= 2);
                  const singleWordKeywords = allKeywords.filter(k => k.split(/\s+/).length === 1);
                  return (
                    <>
                      {singleWordKeywords.length > 0 && (
                        <p className="text-xs text-amber-600 flex items-center gap-1">
                          <span className="inline-block w-4 h-4 rounded-full bg-amber-100 text-amber-600 text-center leading-4 font-bold">!</span>
                          Single-word keywords will be ignored: {singleWordKeywords.slice(0, 3).map(k => `"${k}"`).join(', ')}{singleWordKeywords.length > 3 ? ` (+${singleWordKeywords.length - 3} more)` : ''}
                        </p>
                      )}
                      <p className="text-xs text-slate-500">
                        💡 Press <kbd className="px-2 py-1 bg-slate-100 rounded">Enter</kbd> to go to next line. {validKeywords.length} valid keywords (2+ words) will be used to generate 410-710 variations.
                      </p>
                    </>
                  );
                })()}
              </div>
          <Button 
                onClick={() => {
                  const keywords = seedKeywordsText
                    .split(/[\n,]+/)
                    .map(k => k.trim())
                    .filter(k => k.length > 0 && k.split(/\s+/).length >= 2);
                  if (keywords.length === 0) {
                    notifications.error('Please enter at least one seed keyword with 2 or more words', { 
                      title: 'Invalid Seed Keywords',
                      description: 'Single-word keywords are not allowed. Example: "digital marketing" instead of "marketing"'
                    });
                    return;
                  }
                  setCampaignData(prev => ({ ...prev, seedKeywords: keywords }));
                  setTimeout(() => handleGenerateKeywords(), 50);
                }} 
                disabled={loading || seedKeywordsText.split(/[\n,]+/).filter(k => k.trim().length > 0 && k.trim().split(/\s+/).length >= 2).length === 0} 
                className="mt-6 w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold shadow-lg"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                Generate Keywords
              </Button>
            </CardContent>
          </Card>

      <Card className="mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Negative Keywords ({campaignData.negativeKeywords.length})</CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="space-y-3">
                {/* Compact Negative Keywords Display */}
                <div className="flex flex-wrap gap-1.5">
                  {campaignData.negativeKeywords.map((neg, idx) => {
                    const isDefault = DEFAULT_NEGATIVE_KEYWORDS.includes(neg);
                    return (
                      <span
                        key={idx}
                        className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-xs font-medium transition-all ${
                          isDefault
                            ? 'bg-red-100 text-red-700'
                            : 'bg-orange-100 text-orange-700 cursor-pointer hover:bg-orange-200'
                        }`}
                        onClick={() => {
                          if (!isDefault) {
                            const updated = campaignData.negativeKeywords.filter((_, i) => i !== idx);
                            setCampaignData(prev => ({ ...prev, negativeKeywords: updated }));
                          }
                        }}
                        title={isDefault ? "Default" : "Click to remove"}
                      >
                        {neg}
                        {!isDefault && <X className="w-3 h-3" />}
                      </span>
                    );
                  })}
                </div>

                {/* Compact Add Custom */}
                <div className="flex gap-2 items-start">
                  <Input
                    placeholder="Add negative keyword..."
                    className="text-sm h-8"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const value = (e.target as HTMLInputElement).value.trim();
                        if (value && !campaignData.negativeKeywords.includes(value)) {
                          setCampaignData(prev => ({
                            ...prev,
                            negativeKeywords: [...prev.negativeKeywords, value]
                          }));
                          (e.target as HTMLInputElement).value = '';
                        }
                      }
                    }}
                  />
                  <span className="text-xs text-slate-400 whitespace-nowrap mt-2">Press Enter to add</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {campaignData.generatedKeywords.length > 0 && (
        <>
          <Card className="mb-6">
              <CardHeader>
                <CardTitle>Keyword Type Filters</CardTitle>
                <CardDescription>Toggle keyword types to filter the list</CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
              <div className="flex flex-wrap gap-3 sm:gap-4">
                  {KEYWORD_TYPES.map(type => (
                    <div key={type.id} className="flex items-center gap-2">
                      <Checkbox
                        id={type.id}
                        checked={campaignData.keywordTypes[type.id] || false}
                        onCheckedChange={() => handleKeywordTypeToggle(type.id)}
                      />
                      <Label htmlFor={type.id} className="text-sm whitespace-nowrap">{type.label}</Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

          <Card className="mb-6" data-keywords-section>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <span className="text-base sm:text-lg">Generated Keywords & Negative Keywords ({campaignData.selectedKeywords.length} selected / {filteredKeywords.length} total)</span>
                  <div className="flex items-center gap-2 text-xs font-normal">
                    <span className="text-slate-500">Data Source:</span>
                    <Badge variant="outline" className={`text-xs ${
                      keywordDataSource === 'google_ads_api' 
                        ? 'bg-indigo-50 text-indigo-700 border-indigo-200' 
                        : (keywordDataSource === 'fallback' || keywordDataSource === 'estimated')
                          ? 'bg-yellow-50 text-yellow-700 border-yellow-200' 
                          : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}>
                      {keywordDataSource === 'google_ads_api' 
                        ? 'Google Ads API' 
                        : (keywordDataSource === 'fallback' || keywordDataSource === 'estimated')
                          ? 'Estimated Data' 
                          : 'Local Patterns'}
                    </Badge>
                  </div>
                </CardTitle>
                <CardDescription>Keywords with search volume, CPC, and competition metrics. Click checkboxes to select/unselect keywords.</CardDescription>
              </CardHeader>
            <CardContent className="p-4 sm:p-6">
              {/* Select All / Deselect All Controls */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-4 p-3 bg-slate-50 rounded-lg border">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCampaignData(prev => ({
                      ...prev,
                      selectedKeywords: [...filteredKeywords]
                    }));
                  }}
                  className="text-xs"
                >
                  <Check className="w-3 h-3 mr-1" />
                  Select All ({filteredKeywords.length})
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCampaignData(prev => ({
                      ...prev,
                      selectedKeywords: []
                    }));
                  }}
                  className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <X className="w-3 h-3 mr-1" />
                  Deselect All
                </Button>
                <span className="text-xs text-slate-500 sm:ml-auto w-full sm:w-auto mt-2 sm:mt-0">
                  {campaignData.selectedKeywords.length} of {filteredKeywords.length} keywords selected
                </span>
              </div>

              {/* Column Headers */}
              <div className="hidden md:grid grid-cols-12 gap-2 p-2 mb-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-t border">
                <div className="col-span-1 text-center">Select</div>
                <div className="col-span-4">Keyword</div>
                <div className="col-span-1 text-center">Type</div>
                <div className="col-span-2 text-center">Volume</div>
                <div className="col-span-2 text-center">CPC</div>
                <div className="col-span-2 text-center">Competition</div>
              </div>
              <ScrollArea className="h-96">
                <div className="space-y-1">
                    {filteredKeywords.length === 0 && campaignData.negativeKeywords.length === 0 ? (
                      <div className="text-center py-8 text-slate-500">
                        <p>No keywords match your filters.</p>
                        <p className="text-xs mt-2">Try adjusting keyword type filters or negative keywords.</p>
                      </div>
                    ) : (
                      <>
                        {/* Generated Keywords with Metrics */}
                        {filteredKeywords.map((kw, idx) => {
                          const keywordText = typeof kw === 'string' ? kw : (kw?.text || kw?.keyword || String(kw || ''));
                          const keywordId = kw?.id || `kw-${idx}`;
                          const volume = kw?.volume ?? kw?.avgMonthlySearches;
                          const cpc = kw?.cpc ?? kw?.avgCpc;
                          const competition = kw?.competition;
                          const isSelected = campaignData.selectedKeywords.some(
                            sk => (sk?.id || sk?.text || sk?.keyword || sk) === (kw?.id || kw?.text || kw?.keyword || kw)
                          );
                          
                          const formatVolume = (v: number | string | null | undefined) => {
                            if (v === null || v === undefined || v === '') return '-';
                            const num = typeof v === 'string' ? parseFloat(v) : v;
                            if (isNaN(num)) return '-';
                            if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
                            if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
                            return num.toString();
                          };
                          
                          const formatCpc = (c: number | string | null | undefined) => {
                            if (c === null || c === undefined || c === '') return '-';
                            const num = typeof c === 'string' ? parseFloat(c) : c;
                            if (isNaN(num)) return '-';
                            return '$' + num.toFixed(2);
                          };
                          
                          const getCompetitionStyle = (comp: string | null | undefined) => {
                            switch (comp) {
                              case 'LOW': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
                              case 'MEDIUM': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
                              case 'HIGH': return 'bg-red-50 text-red-700 border-red-200';
                              default: return 'bg-slate-50 text-slate-500 border-slate-200';
                            }
                          };

                          const toggleKeywordSelection = () => {
                            setCampaignData(prev => {
                              if (isSelected) {
                                return {
                                  ...prev,
                                  selectedKeywords: prev.selectedKeywords.filter(
                                    sk => (sk?.id || sk?.text || sk?.keyword || sk) !== (kw?.id || kw?.text || kw?.keyword || kw)
                                  )
                                };
                              } else {
                                return {
                                  ...prev,
                                  selectedKeywords: [...prev.selectedKeywords, kw]
                                };
                              }
                            });
                          };
                          
                          return (
                            <div 
                              key={keywordId} 
                              className={`grid grid-cols-12 gap-2 items-center p-2 border rounded transition-colors cursor-pointer ${
                                isSelected 
                                  ? 'bg-indigo-50 border-indigo-200 hover:bg-indigo-100' 
                                  : 'bg-white hover:bg-slate-50 border-slate-200 opacity-60'
                              }`}
                              onClick={toggleKeywordSelection}
                            >
                              <div className="col-span-2 md:col-span-1 flex justify-center">
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={toggleKeywordSelection}
                                  onClick={(e: React.MouseEvent) => e.stopPropagation()}
                                  className="data-[state=checked]:bg-indigo-600"
                                />
                              </div>
                              <div className="col-span-10 md:col-span-4">
                                <span className={`text-sm font-medium ${isSelected ? 'text-slate-800' : 'text-slate-500'}`}>{keywordText}</span>
                              </div>
                              <div className="col-span-4 md:col-span-1 flex justify-center">
                                {kw?.matchType && (
                                  <Badge variant="outline" className="text-xs capitalize">{kw.matchType}</Badge>
                                )}
                              </div>
                              <div className="col-span-2 md:col-span-2 text-center">
                                <span className="text-sm font-semibold text-blue-700">{formatVolume(volume)}</span>
                                <span className="text-xs text-slate-400 block md:hidden">vol</span>
                              </div>
                              <div className="col-span-3 md:col-span-2 text-center">
                                <span className="text-sm font-medium text-indigo-700">{formatCpc(cpc)}</span>
                                <span className="text-xs text-slate-400 block md:hidden">cpc</span>
                              </div>
                              <div className="col-span-3 md:col-span-2 flex justify-center">
                                <Badge variant="outline" className={`text-xs ${getCompetitionStyle(competition)}`}>
                                  {competition || 'N/A'}
                                </Badge>
                              </div>
                            </div>
                          );
                        })}
                        
                        {/* Negative Keywords Section */}
                        {campaignData.negativeKeywords.length > 0 && (
                          <div className="mt-4 pt-4 border-t">
                            <p className="text-xs font-semibold text-red-700 mb-2">Negative Keywords (Excluded)</p>
                            <div className="space-y-1">
                              {campaignData.negativeKeywords.map((neg, idx) => (
                                <div key={`neg-${idx}`} className="flex items-center justify-between p-2 border rounded bg-red-50 hover:bg-red-100 border-red-200">
                                  <span className="text-sm text-red-700">{neg}</span>
                                  <X className="w-4 h-4 text-red-600" />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
        </>
      )}

    </div>
  );

  const renderStep4 = () => {
    const allAdGroups = ['ALL_AD_GROUPS', ...campaignData.adGroups.map(ag => ag.name)];
    const displayAds = campaignData.ads.length > 0 ? campaignData.ads : [];
    const extensionTypes = [
      { id: 'snippet', label: 'SNIPPET EXTENSION', icon: FileText },
      { id: 'callout', label: 'CALLOUT EXTENSION', icon: MessageSquare },
      { id: 'sitelink', label: 'SITELINK EXTENSION', icon: Link2 },
      { id: 'call', label: 'CALL EXTENSION', icon: Phone },
      { id: 'price', label: 'PRICE EXTENSION', icon: DollarSign },
      { id: 'app', label: 'APP EXTENSION', icon: Smartphone },
      { id: 'location', label: 'LOCATION EXTENSION', icon: MapPinIcon },
      { id: 'message', label: 'MESSAGE EXTENSION', icon: MessageSquare },
      { id: 'leadform', label: 'LEAD FORM EXTENSION', icon: FileText },
      { id: 'promotion', label: 'PROMOTION EXTENSION', icon: Gift },
      { id: 'image', label: 'IMAGE EXTENSION', icon: ImageIcon },
    ];

    return (
      <div className="max-w-7xl mx-auto px-3 py-4 sm:p-6">
        {/* Step Navigation */}
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={handleBackStep}
            className="text-xl sm:text-2xl font-semibold italic bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent hover:from-indigo-500 hover:to-purple-500"
          >
            Back
          </button>
          <button
            onClick={handleNextStep}
            disabled={loading}
            className="text-xl sm:text-2xl font-semibold italic bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50"
          >
            Next
          </button>
        </div>

        <div className="mb-6 sm:mb-8">
          <h3 className="text-lg font-semibold text-slate-800 mb-2">Ads & Extensions</h3>
        </div>

        {/* Terminal-Style Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <TerminalCard title="Ad Statistics" showDots={true} variant="compact">
            <div className="space-y-1.5">
              <TerminalLine prefix="$" label="ads_created:" value={`${campaignData.ads.length}/3`} valueColor={campaignData.ads.length > 0 ? 'green' : 'slate'} />
              <TerminalLine prefix="$" label="ad_types:" value={campaignData.ads.map(ad => ad.type?.toUpperCase() || ad.adType || 'RSA').join(', ') || 'NONE'} valueColor="cyan" />
              <TerminalLine prefix="$" label="extensions:" value={`${campaignData.ads.reduce((total, ad) => total + (ad.extensions?.length || 0), 0)}`} valueColor="yellow" />
              <TerminalLine prefix="$" label="ad_groups:" value={`${campaignData.adGroups.length}`} valueColor="cyan" />
            </div>
          </TerminalCard>

          <TerminalCard title="Campaign Context" showDots={true} variant="compact">
            <div className="space-y-1.5">
              <TerminalLine prefix=">" label="landing_page:" value={campaignData.url ? 'SET' : 'NOT_SET'} valueColor={campaignData.url ? 'green' : 'yellow'} />
              <TerminalLine prefix=">" label="keywords:" value={`${campaignData.selectedKeywords.length}`} valueColor="cyan" />
              <TerminalLine prefix=">" label="structure:" value={CAMPAIGN_STRUCTURES.find(s => s.id === campaignData.selectedStructure)?.name || 'SKAG'} valueColor="cyan" />
              <TerminalLine prefix=">" label="status:" value={loading ? 'GENERATING...' : campaignData.ads.length >= 3 ? 'COMPLETE' : 'IN_PROGRESS'} valueColor={loading ? 'yellow' : campaignData.ads.length >= 3 ? 'green' : 'cyan'} />
            </div>
          </TerminalCard>
        </div>

        {/* Create Ads & Extensions - Compact Inline */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="pt-2 space-y-1">
                <div className="flex items-center flex-wrap gap-1.5">
                  <span className="text-xs font-semibold text-blue-800 whitespace-nowrap">Create Ads (Max 3):</span>
                  <Button 
                    size="sm"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 disabled:cursor-not-allowed text-xs px-2 py-0.5 h-6"
                    onClick={() => handleAddNewAd('rsa')}
                    disabled={loading || campaignData.ads.length >= 3 || campaignData.ads.some(ad => ad.type === 'rsa' || ad.adType === 'RSA')}
                  >
                    <Plus className="mr-1 w-3 h-3" /> RSA
                  </Button>
                  <Button 
                    size="sm"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 disabled:cursor-not-allowed text-xs px-2 py-0.5 h-6"
                    onClick={() => handleAddNewAd('dki')}
                    disabled={loading || campaignData.ads.length >= 3 || campaignData.ads.some(ad => ad.type === 'dki' || ad.adType === 'DKI')}
                  >
                    <Plus className="mr-1 w-3 h-3" /> DKI
                  </Button>
                  <Button 
                    size="sm"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 disabled:cursor-not-allowed text-xs px-2 py-0.5 h-6"
                    onClick={() => handleAddNewAd('call')}
                    disabled={loading || campaignData.ads.length >= 3 || campaignData.ads.some(ad => ad.type === 'call' || ad.adType === 'CallOnly')}
                  >
                    <Plus className="mr-1 w-3 h-3" /> CALL
                  </Button>
                </div>
                
                <div className="flex items-center flex-wrap gap-1">
                  <span className="text-xs font-semibold text-purple-800 whitespace-nowrap">Extensions:</span>
                  {extensionTypes.map(ext => {
                    const Icon = ext.icon;
                    const shortLabel = ext.label.replace(' EXTENSION', '');
                    return (
                      <Button
                        key={ext.id}
                        variant="outline"
                        size="sm"
                        className="border-purple-200 hover:bg-purple-50 text-xs px-1.5 py-0.5 h-6"
                        onClick={() => handleAddExtensionToAllAds(ext.id)}
                      >
                        <Plus className="mr-0.5 w-2.5 h-2.5" />
                        <Icon className="mr-0.5 w-2.5 h-2.5" />
                        {shortLabel}
                      </Button>
                    );
                  })}
                </div>
            </div>
          </CardContent>
        </Card>

        {/* Ad Group Selector and Ads Display */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Ad Group Selector Only */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardContent className="p-4">
                <Label className="text-sm font-semibold mb-2 block">Ad Group</Label>
                <Select 
                  value={campaignData.selectedAdGroup || 'ALL_AD_GROUPS'} 
                  onValueChange={(value: string) => setCampaignData(prev => ({ ...prev, selectedAdGroup: value }))}
                >
                  <SelectTrigger className="w-full bg-slate-50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {allAdGroups.map(group => (
                      <SelectItem key={group} value={group}>
                        {group === 'ALL_AD_GROUPS' ? 'ALL AD GROUPS' : group}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-500 mt-2">
                  Ads: {displayAds.length} / 3
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Right Content - Ads Display */}
          <div className="lg:col-span-3 space-y-4">
            {displayAds.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Sparkles className="w-12 h-12 mx-auto text-slate-400 mb-4" />
                  <h3 className="text-lg font-semibold text-slate-700 mb-2">No Ads Created Yet</h3>
                  <p className="text-slate-500 mb-4">Click on an ad type button above to create an ad (Maximum 3 ads allowed)</p>
                </CardContent>
              </Card>
            ) : (
              displayAds.map((ad) => (
                <Card key={ad.id} className="border-2 overflow-hidden">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-4">
                      <Badge variant="outline" className="text-xs w-fit">
                        {ad.type?.toUpperCase() || ad.adType || 'RSA'}
                      </Badge>
                        <div className="flex flex-wrap gap-1 sm:gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEditAd(ad.id)} className="text-indigo-600 hover:text-indigo-700 px-2 sm:px-3">
                          <Edit3 className="w-4 h-4 sm:mr-1" />
                          <span className="hidden sm:inline">EDIT</span>
                          </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDuplicateAd(ad.id)} className="text-indigo-600 hover:text-indigo-700 px-2 sm:px-3">
                          <Copy className="w-4 h-4 sm:mr-1" />
                          <span className="hidden sm:inline">DUPLICATE</span>
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteAd(ad.id)} className="text-indigo-600 hover:text-indigo-700 px-2 sm:px-3">
                          <Trash2 className="w-4 h-4 sm:mr-1" />
                          <span className="hidden sm:inline">DELETE</span>
                          </Button>
                        </div>
                      </div>
                      
                      {/* RSA Ad Display */}
                      {ad.type === 'rsa' && ad.headlines && (
                      <div className="space-y-3">
                          <div>
                          <Label className="text-xs text-slate-500 mb-2 block">Headlines / Paths</Label>
                          <div className="flex flex-wrap gap-2">
                              {ad.headlines.slice(0, 5).map((h: string, i: number) => (
                              <span key={i} className="text-sm text-slate-700">{h}</span>
                              ))}
                            {ad.displayPath && ad.displayPath.length > 0 && (
                              <span className="text-sm text-slate-500">| {ad.displayPath.join(' | ')}</span>
                              )}
                            </div>
                          </div>
                        <div>
                          <Label className="text-xs text-slate-500 mb-1 block">Display URL</Label>
                          <p className="text-xs text-blue-600 break-all">{ad.finalUrl || campaignData.url}</p>
                          </div>
                          {ad.descriptions && ad.descriptions.length > 0 && (
                            <div>
                            <Label className="text-xs text-slate-500 mb-1 block">Descriptions</Label>
                            {ad.descriptions.slice(0, 2).map((desc: string, i: number) => (
                              <p key={i} className="text-sm text-slate-600 mb-1">{desc}</p>
                            ))}
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* DKI Ad Display */}
                      {(ad.type === 'dki' || ad.adType === 'DKI') && (
                      <div className="space-y-3">
                          {ad.headline1 && <p className="font-semibold text-sm">{ad.headline1}</p>}
                          {ad.headline2 && <p className="font-semibold text-sm">{ad.headline2}</p>}
                        {ad.headline3 && <p className="font-semibold text-sm">{ad.headline3}</p>}
                          {ad.description1 && <p className="text-sm text-slate-600">{ad.description1}</p>}
                        {ad.description2 && <p className="text-sm text-slate-600">{ad.description2}</p>}
                          {ad.finalUrl && (
                            <p className="text-xs text-blue-600">{ad.finalUrl}</p>
                          )}
                        </div>
                      )}
                      
                      {/* Call-Only Ad Display */}
                      {(ad.type === 'call' || ad.adType === 'CallOnly') && (
                      <div className="space-y-3">
                          {ad.headline1 && <p className="font-semibold text-sm">{ad.headline1}</p>}
                        {ad.headline2 && <p className="font-semibold text-sm">{ad.headline2}</p>}
                          {ad.phoneNumber && (
                            <div className="flex items-center gap-2">
                            <Phone className="w-5 h-5 text-indigo-600" />
                            <span className="text-lg font-medium">{ad.phoneNumber}</span>
                            </div>
                          )}
                          {ad.description1 && <p className="text-sm text-slate-600">{ad.description1}</p>}
                        {ad.description2 && <p className="text-sm text-slate-600">{ad.description2}</p>}
                        </div>
                      )}
                      
                    {/* Extensions Display */}
                        {ad.extensions && ad.extensions.length > 0 && (
                      <div className="mt-4 pt-4 border-t">
                        <Label className="text-xs text-slate-500 mb-2 block">Extensions</Label>
                        <div className="space-y-2">
                            {ad.extensions.map((ext: any) => {
                              // Get extension display text based on type
                              let displayText = ext.text || ext.label || ext.type;
                              
                              if (ext.type === 'snippet' && ext.header && ext.values) {
                                displayText = `${ext.header}: ${ext.values.join(', ')}`;
                              } else if (ext.type === 'callout' && ext.callouts && Array.isArray(ext.callouts)) {
                                displayText = ext.callouts.join(', ');
                              } else if (ext.type === 'sitelink' && ext.sitelinks && Array.isArray(ext.sitelinks)) {
                                displayText = ext.sitelinks.map((sl: any) => sl.text || sl.linkText || 'Sitelink').join(', ');
                              } else if (ext.type === 'call' && (ext.phone || ext.phoneNumber)) {
                                displayText = ext.phone || ext.phoneNumber;
                              } else if (ext.type === 'price' && ext.price) {
                                displayText = `${ext.priceQualifier || 'From'} ${ext.price} ${ext.unit || ''}`.trim();
                              }
                              
                              return (
                                <div key={ext.id} className="flex items-start justify-between p-2 sm:p-3 bg-slate-50 rounded border border-slate-200 gap-2">
                                  <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
                                    {ext.type === 'snippet' && <FileText className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />}
                                    {ext.type === 'callout' && <MessageSquare className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />}
                                    {ext.type === 'sitelink' && <Link2 className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />}
                                    {ext.type === 'call' && <Phone className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />}
                                    {ext.type === 'price' && <DollarSign className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />}
                                    {ext.type === 'app' && <Smartphone className="w-4 h-4 text-cyan-600 flex-shrink-0 mt-0.5" />}
                                    {ext.type === 'location' && <MapPinIcon className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />}
                                    {ext.type === 'message' && <MessageSquare className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />}
                                    {ext.type === 'leadform' && <FileText className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />}
                                    {ext.type === 'promotion' && <Gift className="w-4 h-4 text-pink-600 flex-shrink-0 mt-0.5" />}
                                    {ext.type === 'image' && <ImageIcon className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />}
                                    <div className="flex-1 min-w-0">
                                      <span className="text-xs text-slate-500 uppercase font-semibold block mb-1">
                                        {ext.label || ext.type.charAt(0).toUpperCase() + ext.type.slice(1).replace(/([A-Z])/g, ' $1')}
                                      </span>
                                      <span className="text-xs sm:text-sm text-slate-700 font-medium block break-words">
                                        {displayText}
                                </span>
                                    </div>
                          </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveExtension(ad.id, ext.id)}
                                    className="text-red-600 hover:text-red-700 flex-shrink-0 p-1 h-auto"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                      </div>
                              );
                            })}
              </div>
                      </div>
                    )}

                    {/* Edit Form - shown when editing */}
                    {editingAdId === ad.id && (
                      <div className="mt-6 pt-6 border-t border-slate-200 space-y-4">
                        {/* RSA Edit Form */}
                        {(ad.type === 'rsa' || ad.adType === 'RSA') && (
                          <>
                            <div className="space-y-4">
                              <div>
                                <Label className="text-xs font-semibold text-slate-700 mb-2 block">Headlines (max 30 chars each)</Label>
                                <div className="space-y-2">
                                  {(ad.headlines || []).slice(0, 15).map((headline: string, idx: number) => (
                                    <div key={idx}>
                                      <div className="flex items-center justify-between mb-1">
                                        <Label className="text-xs text-slate-600">Headline {idx + 1}</Label>
                                        <span className={`text-xs ${(headline?.length || 0) > 30 ? 'text-red-600 font-semibold' : (headline?.length || 0) > 25 ? 'text-amber-600' : 'text-slate-500'}`}>
                                          {(headline?.length || 0)}/30
                                        </span>
                                      </div>
                                      <Input
                                        value={headline || ''}
                                        onChange={(e) => {
                                          const newHeadlines = [...(ad.headlines || [])];
                                          newHeadlines[idx] = e.target.value;
                                          updateAdField(ad.id, 'headlines', newHeadlines);
                                        }}
                                        className={`${(headline?.length || 0) > 30 ? 'border-red-500 focus:border-red-500' : ''}`}
                                        maxLength={30}
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <Label className="text-xs font-semibold text-slate-700 mb-2 block">Descriptions (max 90 chars each)</Label>
                                <div className="space-y-2">
                                  {(ad.descriptions || []).slice(0, 4).map((desc: string, idx: number) => (
                                    <div key={idx}>
                                      <div className="flex items-center justify-between mb-1">
                                        <Label className="text-xs text-slate-600">Description {idx + 1}</Label>
                                        <span className={`text-xs ${(desc?.length || 0) > 90 ? 'text-red-600 font-semibold' : (desc?.length || 0) > 80 ? 'text-amber-600' : 'text-slate-500'}`}>
                                          {(desc?.length || 0)}/90
                                        </span>
                                      </div>
                                      <Textarea
                                        value={desc || ''}
                                        onChange={(e) => {
                                          const newDescriptions = [...(ad.descriptions || [])];
                                          newDescriptions[idx] = e.target.value;
                                          updateAdField(ad.id, 'descriptions', newDescriptions);
                                        }}
                                        className={`${(desc?.length || 0) > 90 ? 'border-red-500 focus:border-red-500' : ''}`}
                                        rows={2}
                                        maxLength={90}
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <Label className="text-xs font-semibold text-slate-700 mb-2 block">Final URL</Label>
                                <Input
                                  value={ad.finalUrl || ''}
                                  onChange={(e) => updateAdField(ad.id, 'finalUrl', e.target.value)}
                                  placeholder="https://www.example.com"
                                />
                              </div>
                            </div>
                          </>
                        )}

                        {/* DKI Edit Form */}
                        {(ad.type === 'dki' || ad.adType === 'DKI') && (
                          <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <Label className="text-xs font-semibold text-slate-700">Headline 1 *</Label>
                                  <span className={`text-xs ${(ad.headline1?.length || 0) > 30 ? 'text-red-600 font-semibold' : (ad.headline1?.length || 0) > 25 ? 'text-amber-600' : 'text-slate-500'}`}>
                                    {(ad.headline1?.length || 0)}/30
                                  </span>
                                </div>
                                <Input
                                  value={ad.headline1 || ''}
                                  onChange={(e) => updateAdField(ad.id, 'headline1', e.target.value)}
                                  className={`${(ad.headline1?.length || 0) > 30 ? 'border-red-500 focus:border-red-500' : ''}`}
                                  placeholder="Enter headline 1"
                                  maxLength={30}
                                />
                              </div>
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <Label className="text-xs font-semibold text-slate-700">Headline 2 *</Label>
                                  <span className={`text-xs ${(ad.headline2?.length || 0) > 30 ? 'text-red-600 font-semibold' : (ad.headline2?.length || 0) > 25 ? 'text-amber-600' : 'text-slate-500'}`}>
                                    {(ad.headline2?.length || 0)}/30
                                  </span>
                                </div>
                                <Input
                                  value={ad.headline2 || ''}
                                  onChange={(e) => updateAdField(ad.id, 'headline2', e.target.value)}
                                  className={`${(ad.headline2?.length || 0) > 30 ? 'border-red-500 focus:border-red-500' : ''}`}
                                  placeholder="Enter headline 2"
                                  maxLength={30}
                                />
                              </div>
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <Label className="text-xs font-semibold text-slate-700">Headline 3</Label>
                                  <span className={`text-xs ${(ad.headline3?.length || 0) > 30 ? 'text-red-600 font-semibold' : (ad.headline3?.length || 0) > 25 ? 'text-amber-600' : 'text-slate-500'}`}>
                                    {(ad.headline3?.length || 0)}/30
                                  </span>
                                </div>
                                <Input
                                  value={ad.headline3 || ''}
                                  onChange={(e) => updateAdField(ad.id, 'headline3', e.target.value)}
                                  className={`${(ad.headline3?.length || 0) > 30 ? 'border-red-500 focus:border-red-500' : ''}`}
                                  placeholder="Enter headline 3"
                                  maxLength={30}
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <Label className="text-xs font-semibold text-slate-700">Description 1 *</Label>
                                  <span className={`text-xs ${(ad.description1?.length || 0) > 90 ? 'text-red-600 font-semibold' : (ad.description1?.length || 0) > 80 ? 'text-amber-600' : 'text-slate-500'}`}>
                                    {(ad.description1?.length || 0)}/90
                                  </span>
                                </div>
                                <Textarea
                                  value={ad.description1 || ''}
                                  onChange={(e) => updateAdField(ad.id, 'description1', e.target.value)}
                                  className={`${(ad.description1?.length || 0) > 90 ? 'border-red-500 focus:border-red-500' : ''}`}
                                  placeholder="Enter description 1"
                                  rows={2}
                                  maxLength={90}
                                />
                              </div>
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <Label className="text-xs font-semibold text-slate-700">Description 2</Label>
                                  <span className={`text-xs ${(ad.description2?.length || 0) > 90 ? 'text-red-600 font-semibold' : (ad.description2?.length || 0) > 80 ? 'text-amber-600' : 'text-slate-500'}`}>
                                    {(ad.description2?.length || 0)}/90
                                  </span>
                                </div>
                                <Textarea
                                  value={ad.description2 || ''}
                                  onChange={(e) => updateAdField(ad.id, 'description2', e.target.value)}
                                  className={`${(ad.description2?.length || 0) > 90 ? 'border-red-500 focus:border-red-500' : ''}`}
                                  placeholder="Enter description 2"
                                  rows={2}
                                  maxLength={90}
                                />
                              </div>
                            </div>
                            <div>
                              <Label className="text-xs font-semibold text-slate-700">Final URL *</Label>
                              <Input
                                value={ad.finalUrl || ''}
                                onChange={(e) => updateAdField(ad.id, 'finalUrl', e.target.value)}
                                placeholder="https://www.example.com"
                              />
                            </div>
                          </>
                        )}

                        {/* Call-Only Edit Form */}
                        {(ad.type === 'call' || ad.adType === 'CallOnly') && (
                          <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <Label className="text-xs font-semibold text-slate-700">Headline 1 *</Label>
                                  <span className={`text-xs ${(ad.headline1?.length || 0) > 30 ? 'text-red-600 font-semibold' : (ad.headline1?.length || 0) > 25 ? 'text-amber-600' : 'text-slate-500'}`}>
                                    {(ad.headline1?.length || 0)}/30
                                  </span>
                                </div>
                                <Input
                                  value={ad.headline1 || ''}
                                  onChange={(e) => updateAdField(ad.id, 'headline1', e.target.value)}
                                  className={`${(ad.headline1?.length || 0) > 30 ? 'border-red-500 focus:border-red-500' : ''}`}
                                  placeholder="Enter headline 1"
                                  maxLength={30}
                                />
                              </div>
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <Label className="text-xs font-semibold text-slate-700">Headline 2 *</Label>
                                  <span className={`text-xs ${(ad.headline2?.length || 0) > 30 ? 'text-red-600 font-semibold' : (ad.headline2?.length || 0) > 25 ? 'text-amber-600' : 'text-slate-500'}`}>
                                    {(ad.headline2?.length || 0)}/30
                                  </span>
                                </div>
                                <Input
                                  value={ad.headline2 || ''}
                                  onChange={(e) => updateAdField(ad.id, 'headline2', e.target.value)}
                                  className={`${(ad.headline2?.length || 0) > 30 ? 'border-red-500 focus:border-red-500' : ''}`}
                                  placeholder="Enter headline 2"
                                  maxLength={30}
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <Label className="text-xs font-semibold text-slate-700">Description 1 *</Label>
                                  <span className={`text-xs ${(ad.description1?.length || 0) > 90 ? 'text-red-600 font-semibold' : (ad.description1?.length || 0) > 80 ? 'text-amber-600' : 'text-slate-500'}`}>
                                    {(ad.description1?.length || 0)}/90
                                  </span>
                                </div>
                                <Textarea
                                  value={ad.description1 || ''}
                                  onChange={(e) => updateAdField(ad.id, 'description1', e.target.value)}
                                  className={`${(ad.description1?.length || 0) > 90 ? 'border-red-500 focus:border-red-500' : ''}`}
                                  placeholder="Enter description 1"
                                  rows={2}
                                  maxLength={90}
                                />
                              </div>
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <Label className="text-xs font-semibold text-slate-700">Description 2 *</Label>
                                  <span className={`text-xs ${(ad.description2?.length || 0) > 90 ? 'text-red-600 font-semibold' : (ad.description2?.length || 0) > 80 ? 'text-amber-600' : 'text-slate-500'}`}>
                                    {(ad.description2?.length || 0)}/90
                                  </span>
                                </div>
                                <Textarea
                                  value={ad.description2 || ''}
                                  onChange={(e) => updateAdField(ad.id, 'description2', e.target.value)}
                                  className={`${(ad.description2?.length || 0) > 90 ? 'border-red-500 focus:border-red-500' : ''}`}
                                  placeholder="Enter description 2"
                                  rows={2}
                                  maxLength={90}
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <Label className="text-xs font-semibold text-slate-700">Phone Number *</Label>
                                <Input
                                  value={ad.phoneNumber || ''}
                                  onChange={(e) => updateAdField(ad.id, 'phoneNumber', e.target.value)}
                                  placeholder="(555) 123-4567"
                                />
                              </div>
                              <div>
                                <Label className="text-xs font-semibold text-slate-700">Business Name *</Label>
                                <Input
                                  value={ad.businessName || ''}
                                  onChange={(e) => updateAdField(ad.id, 'businessName', e.target.value)}
                                  placeholder="Your Business"
                                />
                              </div>
                            </div>
                          </>
                        )}

                        <div className="flex gap-2 pt-4 border-t border-slate-300">
                          <Button
                            onClick={() => handleSaveAd(ad.id)}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                            size="sm"
                          >
                            <Save className="w-4 h-4 mr-2" />
                            Save Changes
                          </Button>
                          <Button
                            onClick={handleCancelEdit}
                            variant="outline"
                            className="flex-1"
                            size="sm"
                          >
                            Cancel
                          </Button>
              </div>
                      </div>
                    )}
          </CardContent>
        </Card>
              ))
      )}
          </div>
        </div>

    </div>
  );
  };

  const renderStep5 = () => {
    const handlePresetSelect = (type: 'cities' | 'states' | 'zips', preset: string) => {
      let items: string[] = [];
      let requestedCount = 0;
      const countryPresets = getGeoPresetsForCountry(campaignData.targetCountry);
      
      if (type === 'cities') {
        if (preset === 'top50') { items = countryPresets.cities.top50; requestedCount = 50; }
        else if (preset === 'top250') { items = countryPresets.cities.top250; requestedCount = 250; }
        else if (preset === 'top500') { items = countryPresets.cities.top500; requestedCount = 500; }
        setCampaignData(prev => ({ 
          ...prev, 
          locations: { ...prev.locations, cities: items, states: [], zipCodes: [] }
        }));
      } else if (type === 'states') {
        if (preset === 'top10') { items = countryPresets.states.top10; requestedCount = 10; }
        else if (preset === 'top25') { items = countryPresets.states.top25; requestedCount = 25; }
        else if (preset === 'top50') { items = countryPresets.states.top50; requestedCount = 50; }
        setCampaignData(prev => ({ 
          ...prev, 
          locations: { ...prev.locations, states: items, cities: [], zipCodes: [] }
        }));
      } else if (type === 'zips') {
        if (preset === 'top1000') { items = countryPresets.zips.top1000; requestedCount = 1000; }
        else if (preset === 'top5000') { items = countryPresets.zips.top5000; requestedCount = 5000; }
        else if (preset === 'top15000') { items = countryPresets.zips.top15000; requestedCount = 15000; }
        else if (preset === 'top25000') { items = countryPresets.zips.top25000; requestedCount = 25000; }
        setCampaignData(prev => ({ 
          ...prev, 
          locations: { ...prev.locations, zipCodes: items, cities: [], states: [] }
        }));
      }
      autoSaveDraft();
      
      const typeLabel = type === 'zips' ? 'ZIP codes' : type;
      if (items.length < requestedCount) {
        notifications.info(`${campaignData.targetCountry} only has ${items.length.toLocaleString()} ${typeLabel} available (max)`, { 
          title: 'Geo Targeting Updated',
          description: `Selected all ${items.length.toLocaleString()} available ${typeLabel}`
        });
      } else {
        notifications.success(`Selected ${items.length.toLocaleString()} ${typeLabel}`, { title: 'Geo Targeting Updated' });
      }
    };

    const clearLocations = () => {
      setCampaignData(prev => ({ 
        ...prev, 
        locations: { countries: [], states: [], cities: [], zipCodes: [] }
      }));
      notifications.info('Locations cleared - will target entire country');
    };

    const getCurrentSelection = () => {
      const { cities, states, zipCodes } = campaignData.locations;
      if (cities.length > 0) return { type: 'Cities', count: cities.length, icon: Building };
      if (states.length > 0) return { type: 'States', count: states.length, icon: MapPin };
      if (zipCodes.length > 0) return { type: 'ZIP Codes', count: zipCodes.length, icon: Hash };
      return null;
    };

    const currentSelection = getCurrentSelection();

    return (
      <div className="max-w-5xl mx-auto px-3 py-4 sm:p-6">
        {/* Step Navigation */}
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={handleBackStep}
            className="text-xl sm:text-2xl font-semibold italic bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent hover:from-indigo-500 hover:to-purple-500"
          >
            Back
          </button>
          <button
            onClick={handleNextStep}
            disabled={loading}
            className="text-xl sm:text-2xl font-semibold italic bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50"
          >
            Next
          </button>
        </div>

        {/* Header with gradient */}
        <div className="mb-6 sm:mb-8 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 shadow-lg shadow-indigo-200/50 mb-4">
            <MapPin className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">
            Geo Targeting
          </h2>
          <p className="text-slate-600 max-w-xl mx-auto">
            Define where your ads will appear. Target specific locations or reach your entire country.
          </p>
        </div>

        {/* Info Banner */}
        <div className="mb-6 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <Info className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-sm text-slate-700">
              <p className="font-medium text-indigo-900 mb-1">How Geo Targeting Works</p>
              <ul className="space-y-1 text-slate-600">
                <li><span className="text-indigo-600 font-medium">Nationwide by default:</span> Your ads will show across the entire selected country.</li>
                <li><span className="text-indigo-600 font-medium">Change country:</span> Use the dropdown on the left to select a different country.</li>
                <li><span className="text-indigo-600 font-medium">Target specific areas:</span> Click <span className="font-semibold">Cities</span>, <span className="font-semibold">States</span>, or <span className="font-semibold">ZIP Codes</span> on the right to narrow your targeting.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Two-column layout on larger screens */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Country & Summary */}
          <div className="space-y-6">
            {/* Target Country Card */}
            <div className="rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 p-1 shadow-xl">
              <div className="bg-slate-900 rounded-lg p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                  </div>
                  <span className="text-slate-400 text-sm font-medium">Target Country</span>
                </div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
                    <Globe className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <Select 
                      value={campaignData.targetCountry} 
                      onValueChange={(value: string) => {
                        setCampaignData(prev => ({ ...prev, targetCountry: value }));
                        autoSaveDraft();
                      }}
                    >
                      <SelectTrigger className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        {LOCATION_PRESETS.countries.map(country => (
                          <SelectItem key={country} value={country} className="text-white hover:bg-slate-700">{country}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <p className="text-slate-500 text-xs">
                  Base country for your campaign targeting
                </p>
              </div>
            </div>

            {/* Live Summary Card */}
            <div className="rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 p-1 shadow-xl">
              <div className="bg-slate-900 rounded-lg p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                  </div>
                  <span className="text-slate-400 text-sm font-medium">Targeting Summary</span>
                  {currentSelection && (
                    <Badge className="ml-auto bg-indigo-500/20 text-green-400 border-green-500/30">
                      <Check className="w-3 h-3 mr-1" />
                      Active
                    </Badge>
                  )}
                </div>
                
                <div className="space-y-3 font-mono text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">[geo]</span>
                    <span className="text-green-400">Country:</span>
                    <span className="text-white">{campaignData.targetCountry}</span>
                  </div>
                  
                  {currentSelection ? (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500">[geo]</span>
                        <span className="text-yellow-400">&gt;</span>
                        <span className="text-white">{currentSelection.type}:</span>
                        <span className="text-cyan-400">{currentSelection.count.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500">[geo]</span>
                        <span className="text-green-400">✓</span>
                        <span className="text-slate-300">Targeting configured</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500">[geo]</span>
                      <span className="text-cyan-400">→</span>
                      <span className="text-slate-300">Nationwide coverage</span>
                    </div>
                  )}
                </div>
                
                {currentSelection && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={clearLocations}
                    className="mt-4 text-red-400 hover:text-red-300 hover:bg-red-500/10 w-full"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Clear All Locations
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Location Tabs */}
          <div className="lg:col-span-2">
            <Card className="border-2 border-slate-200 shadow-xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-slate-50 via-indigo-50/30 to-purple-50/30 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg">
                      <Target className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Location Targeting</CardTitle>
                      <CardDescription className="text-xs">
                        Choose cities, states, or ZIP codes within {campaignData.targetCountry}
                      </CardDescription>
                    </div>
                  </div>
                  {currentSelection && (
                    <Badge className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-0 shadow-lg">
                      {currentSelection.count.toLocaleString()} {currentSelection.type}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <Tabs defaultValue="cities" className="w-full">
                  <TabsList className="grid w-full grid-cols-3 mb-6 bg-slate-100 p-1 rounded-xl">
                    <TabsTrigger value="cities" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-md">
                      <Building className="w-4 h-4" />
                      <span className="hidden sm:inline">Cities</span>
                    </TabsTrigger>
                    <TabsTrigger value="states" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-md">
                      <MapPinIcon className="w-4 h-4" />
                      <span className="hidden sm:inline">States</span>
                    </TabsTrigger>
                    <TabsTrigger value="zips" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-md">
                      <Hash className="w-4 h-4" />
                      <span className="hidden sm:inline">ZIP Codes</span>
                    </TabsTrigger>
                  </TabsList>

                  {/* Nationwide Default Message */}
                  {!currentSelection && (
                    <div className="mb-6 p-4 bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-50 border-2 border-amber-300 rounded-xl shadow-md">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                          <Globe className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="text-amber-900 font-bold text-base mb-1">
                            Nationwide is Currently Selected
                          </p>
                          <p className="text-amber-700 text-sm">
                            Your ads will show across all of <span className="font-semibold">{campaignData.targetCountry}</span>. 
                            To target specific locations, click on <span className="font-bold text-indigo-700">Cities</span>, <span className="font-bold text-indigo-700">States</span>, or <span className="font-bold text-indigo-700">ZIP Codes</span> above and select a preset.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Cities Tab */}
                  <TabsContent value="cities" className="space-y-5">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-amber-500" />
                        <Label className="text-sm font-semibold text-slate-700">Quick Presets</Label>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { label: 'Top 50', value: 'top50', count: 50 },
                          { label: 'Top 250', value: 'top250', count: 250 },
                          { label: 'Top 500', value: 'top500', count: 500 },
                        ].map(preset => (
                          <Button
                            key={preset.value}
                            variant={campaignData.locations.cities.length === preset.count ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePresetSelect('cities', preset.value)}
                            className={campaignData.locations.cities.length === preset.count 
                              ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-600 hover:to-purple-700 border-0 shadow-lg" 
                              : "hover:border-indigo-300 hover:bg-indigo-50"}
                          >
                            <Building className="w-3 h-3 mr-1.5" />
                            {preset.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                    
                    {campaignData.locations.cities.length > 0 && (
                      <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200">
                        <div className="flex items-center gap-2 mb-3">
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-semibold text-green-800">
                            {campaignData.locations.cities.length} cities selected
                          </span>
                        </div>
                        <ScrollArea className="h-20">
                          <div className="flex flex-wrap gap-1.5">
                            {campaignData.locations.cities.slice(0, 15).map((city, idx) => (
                              <Badge key={idx} className="bg-white text-slate-700 border border-slate-200 text-xs">{city}</Badge>
                            ))}
                            {campaignData.locations.cities.length > 15 && (
                              <Badge className="bg-slate-100 text-slate-600 text-xs">
                                +{campaignData.locations.cities.length - 15} more
                              </Badge>
                            )}
                          </div>
                        </ScrollArea>
                      </div>
                    )}
                  </TabsContent>

                  {/* States Tab */}
                  <TabsContent value="states" className="space-y-5">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-amber-500" />
                        <Label className="text-sm font-semibold text-slate-700">Quick Presets</Label>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { label: 'Top 10', value: 'top10', count: 10 },
                          { label: 'Top 25', value: 'top25', count: 25 },
                          { label: 'All 50', value: 'top50', count: 50 },
                        ].map(preset => (
                          <Button
                            key={preset.value}
                            variant={campaignData.locations.states.length === preset.count ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePresetSelect('states', preset.value)}
                            className={campaignData.locations.states.length === preset.count 
                              ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-600 hover:to-purple-700 border-0 shadow-lg" 
                              : "hover:border-indigo-300 hover:bg-indigo-50"}
                          >
                            <MapPinIcon className="w-3 h-3 mr-1.5" />
                            {preset.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                    
                    {campaignData.locations.states.length > 0 && (
                      <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200">
                        <div className="flex items-center gap-2 mb-3">
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-semibold text-green-800">
                            {campaignData.locations.states.length} states selected
                          </span>
                        </div>
                        <ScrollArea className="h-20">
                          <div className="flex flex-wrap gap-1.5">
                            {campaignData.locations.states.map((state, idx) => (
                              <Badge key={idx} className="bg-white text-slate-700 border border-slate-200 text-xs">{state}</Badge>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>
                    )}
                  </TabsContent>

                  {/* ZIP Codes Tab */}
                  <TabsContent value="zips" className="space-y-5">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-amber-500" />
                        <Label className="text-sm font-semibold text-slate-700">Quick Presets</Label>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {[
                          { label: '1K ZIPs', value: 'top1000', count: 1000 },
                          { label: '5K ZIPs', value: 'top5000', count: 5000 },
                          { label: '15K ZIPs', value: 'top15000', count: 15000 },
                        ].map(preset => (
                          <Button
                            key={preset.value}
                            variant={campaignData.locations.zipCodes.length === preset.count ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePresetSelect('zips', preset.value)}
                            className={campaignData.locations.zipCodes.length === preset.count 
                              ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-600 hover:to-purple-700 border-0 shadow-lg" 
                              : "hover:border-indigo-300 hover:bg-indigo-50"}
                          >
                            <Hash className="w-3 h-3 mr-1.5" />
                            {preset.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                    
                    {campaignData.locations.zipCodes.length > 0 && (
                      <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200">
                        <div className="flex items-center gap-2 mb-3">
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-semibold text-green-800">
                            {campaignData.locations.zipCodes.length.toLocaleString()} ZIP codes selected
                          </span>
                        </div>
                        <ScrollArea className="h-20">
                          <div className="flex flex-wrap gap-1.5">
                            {campaignData.locations.zipCodes.slice(0, 20).map((zip, idx) => (
                              <Badge key={idx} className="bg-white text-slate-700 border border-slate-200 text-xs font-mono">{zip}</Badge>
                            ))}
                            {campaignData.locations.zipCodes.length > 20 && (
                              <Badge className="bg-slate-100 text-slate-600 text-xs">
                                +{(campaignData.locations.zipCodes.length - 20).toLocaleString()} more
                              </Badge>
                            )}
                          </div>
                        </ScrollArea>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>

      </div>
    );
  };

  // Helper function to get location count and type
  const getLocationCountAndType = () => {
    const { cities, zipCodes, states, countries } = campaignData.locations;
    
    if (cities.length > 0) {
      return { count: cities.length, type: 'Cities' };
    } else if (zipCodes.length > 0) {
      return { count: zipCodes.length, type: 'ZIP Codes' };
    } else if (states.length > 0) {
      return { count: states.length, type: 'States' };
    } else if (countries.length > 0) {
      return { count: countries.length, type: 'Countries' };
    } else {
      // Whole country targeting
      return { count: 1, type: 'Country' };
    }
  };

  const renderStep8 = () => {
    const locationInfo = getLocationCountAndType();
    const structureName = CAMPAIGN_STRUCTURES.find(s => s.id === campaignData.selectedStructure)?.name || 'SKAG';
    const targetLocationText = locationInfo.count === 1 && locationInfo.type === 'Country'
      ? `${campaignData.targetCountry} (Nationwide)`
      : `${campaignData.targetCountry} (${locationInfo.type})`;

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 via-indigo-100/60 to-purple-100/70 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 shadow-lg shadow-green-200/50 mb-4 animate-in fade-in zoom-in duration-500">
              <CheckCircle2 className="w-8 h-8 text-white" />
          </div>
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2 animate-in fade-in slide-in-from-bottom-4 duration-700">
              Campaign Created Successfully!
            </h1>
            <p className="text-sm text-slate-600 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-6 duration-900">
              Your campaign is ready to export and implement in Google Ads Editor
            </p>
        </div>

          {/* Metrics Cards - Redesigned */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
            {/* 1. Campaigns */}
            <Card className="text-center border-2 border-indigo-100 bg-gradient-to-br from-white to-indigo-50/50 shadow-md hover:shadow-xl transition-all duration-300 hover:scale-105">
              <CardContent className="p-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center mx-auto mb-2 shadow-lg">
                  <Megaphone className="w-4 h-4 text-white" />
                </div>
                <div className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-0.5">1</div>
                <div className="text-xs font-medium text-slate-700">Campaign</div>
              </CardContent>
            </Card>
            {/* 2. Ad Groups */}
            <Card className="text-center border-2 border-blue-100 bg-gradient-to-br from-white to-blue-50/50 shadow-md hover:shadow-xl transition-all duration-300 hover:scale-105">
              <CardContent className="p-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center mx-auto mb-2 shadow-lg">
                  <Layers className="w-4 h-4 text-white" />
                </div>
                <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-0.5">{campaignData.adGroups.length}</div>
                <div className="text-xs font-medium text-slate-700">Ad Groups</div>
              </CardContent>
            </Card>
            {/* 3. Ads */}
            <Card className="text-center border-2 border-orange-100 bg-gradient-to-br from-white to-orange-50/50 shadow-md hover:shadow-xl transition-all duration-300 hover:scale-105">
              <CardContent className="p-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center mx-auto mb-2 shadow-lg">
                  <FileText className="w-4 h-4 text-white" />
                </div>
                <div className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent mb-0.5">{campaignData.ads.length * Math.max(1, campaignData.adGroups.length)}</div>
                <div className="text-xs font-medium text-slate-700">Ads</div>
              </CardContent>
            </Card>
            {/* 4. Keywords */}
            <Card className="text-center border-2 border-purple-100 bg-gradient-to-br from-white to-purple-50/50 shadow-md hover:shadow-xl transition-all duration-300 hover:scale-105">
              <CardContent className="p-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-2 shadow-lg">
                  <Hash className="w-4 h-4 text-white" />
                </div>
                <div className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-0.5">{campaignData.selectedKeywords.length}</div>
                <div className="text-xs font-medium text-slate-700">Keywords</div>
              </CardContent>
            </Card>
            {/* 5. Locations */}
            <Card className="text-center border-2 border-green-100 bg-gradient-to-br from-white to-green-50/50 shadow-md hover:shadow-xl transition-all duration-300 hover:scale-105">
              <CardContent className="p-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mx-auto mb-2 shadow-lg">
                  <MapPin className="w-4 h-4 text-white" />
                </div>
                <div className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-0.5">{locationInfo.count}</div>
                <div className="text-xs font-medium text-slate-700">Locations</div>
              </CardContent>
            </Card>
            {/* 6. Assets */}
            <Card className="text-center border-2 border-indigo-100 bg-gradient-to-br from-white to-indigo-50/50 shadow-md hover:shadow-xl transition-all duration-300 hover:scale-105">
              <CardContent className="p-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-500 flex items-center justify-center mx-auto mb-2 shadow-lg">
                  <Link2 className="w-4 h-4 text-white" />
                </div>
                <div className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-0.5">
                  {campaignData.ads.reduce((total, ad) => total + (ad.extensions?.length || 0), 0)}
                </div>
                <div className="text-xs font-medium text-slate-700">Assets</div>
              </CardContent>
            </Card>
          </div>

          {/* Campaign Summary - Shell View */}
          <div className="mb-6 rounded-xl overflow-hidden shadow-2xl border border-slate-700">
            {/* Terminal Header */}
            <div className="bg-slate-800 px-4 py-3 flex items-center justify-between border-b border-slate-700">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <span className="text-slate-400 text-xs font-mono">campaign-export.sh</span>
              <div className="w-16"></div>
            </div>
            
            {/* Terminal Body */}
            <div className="bg-slate-900 p-5 font-mono text-sm space-y-3">
              {/* Header */}
              <div className="text-emerald-400 font-semibold text-base mb-4">
                [CAMPAIGN BUILD COMPLETE]
              </div>
              
              {/* Campaign Details */}
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <span className="text-emerald-400">&#10003;</span>
                  <span className="text-slate-400">[{new Date().toLocaleTimeString('en-US', { hour12: false })}]</span>
                  <span className="text-slate-300">Campaign Name:</span>
                  <span className="text-cyan-400 font-semibold">{campaignData.campaignName}</span>
                </div>
                
                <div className="flex items-start gap-2">
                  <span className="text-emerald-400">&#10003;</span>
                  <span className="text-slate-400">[{new Date().toLocaleTimeString('en-US', { hour12: false })}]</span>
                  <span className="text-slate-300">Structure:</span>
                  <span className="text-purple-400 font-semibold">{structureName}</span>
                </div>
                
                <div className="flex items-start gap-2">
                  <span className="text-emerald-400">&#10003;</span>
                  <span className="text-slate-400">[{new Date().toLocaleTimeString('en-US', { hour12: false })}]</span>
                  <span className="text-slate-300">Target Location:</span>
                  <span className="text-orange-400 font-semibold">{targetLocationText}</span>
                </div>
                
                <div className="flex items-start gap-2">
                  <span className="text-emerald-400">&#10003;</span>
                  <span className="text-slate-400">[{new Date().toLocaleTimeString('en-US', { hour12: false })}]</span>
                  <span className="text-slate-300">Ad Groups Generated:</span>
                  <span className="text-yellow-400 font-semibold">{campaignData.adGroups.length}</span>
                </div>
                
                <div className="flex items-start gap-2">
                  <span className="text-emerald-400">&#10003;</span>
                  <span className="text-slate-400">[{new Date().toLocaleTimeString('en-US', { hour12: false })}]</span>
                  <span className="text-slate-300">Keywords Selected:</span>
                  <span className="text-pink-400 font-semibold">{campaignData.selectedKeywords.length}</span>
                </div>
                
                <div className="flex items-start gap-2">
                  <span className="text-emerald-400">&#10003;</span>
                  <span className="text-slate-400">[{new Date().toLocaleTimeString('en-US', { hour12: false })}]</span>
                  <span className="text-slate-300">Ads Created:</span>
                  <span className="text-blue-400 font-semibold">{campaignData.ads.length}</span>
                </div>
                
                <div className="flex items-start gap-2">
                  <span className="text-emerald-400">&#10003;</span>
                  <span className="text-slate-400">[{new Date().toLocaleTimeString('en-US', { hour12: false })}]</span>
                  <span className="text-slate-300">Locations Targeted:</span>
                  <span className="text-teal-400 font-semibold">{locationInfo.count}</span>
                </div>
              </div>
              
              {/* Divider */}
              <div className="border-t border-slate-700 my-4"></div>
              
              {/* Status Message */}
              <div className="flex items-center gap-2">
                <span className="text-emerald-400 animate-pulse">&#9679;</span>
                <span className="text-emerald-400 font-semibold">All validation checks passed</span>
              </div>
              
              <div className="text-slate-500 text-xs mt-2">
                &gt; Ready for export to Google Ads Editor. Click download to generate CSV file.
              </div>
              
              {/* Cities info if selected */}
              {campaignData.locations.cities.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-700">
                  <div className="flex items-start gap-2 flex-wrap">
                    <span className="text-emerald-400">&#10003;</span>
                    <span className="text-slate-400">[cities]</span>
                    <span className="text-slate-300">
                      {campaignData.locations.cities.slice(0, 5).join(', ')}
                      {campaignData.locations.cities.length > 5 && (
                        <span className="text-slate-500"> +{campaignData.locations.cities.length - 5} more</span>
                      )}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Primary Action Section */}
          <div className="mb-6">
          <Button
            onClick={handleDownloadCSV}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-purple-700 text-white shadow-lg shadow-green-200/50 h-14 text-lg font-semibold"
          >
            <Download className="w-5 h-5 mr-2" />
            Download CSV for Google Ads Editor
          </Button>
          </div>


          {/* Secondary Actions */}
          <div className="flex flex-wrap gap-3 justify-center">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(5)}
              className="border-slate-300 hover:bg-slate-50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Review
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              // Reset and start new campaign
              window.location.reload();
            }}
              className="border-slate-300 hover:bg-slate-50"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Another Campaign
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              // Dispatch custom event for App.tsx to handle
              const event = new CustomEvent('navigate', { detail: { tab: 'dashboard' } });
              window.dispatchEvent(event);
              
              // Fallback: Update URL hash
              if (window.location.hash !== '#dashboard') {
                window.location.hash = '#dashboard';
              }
              
              // Additional fallback: Try direct navigation after a short delay
              setTimeout(() => {
                const event2 = new CustomEvent('navigate', { detail: { tab: 'dashboard' } });
                window.dispatchEvent(event2);
              }, 100);
            }}
              className="border-slate-300 hover:bg-slate-50"
          >
            Go to Dashboard
          </Button>
          </div>
        </div>
      </div>
    );
  };

  const renderStep7 = () => (
    <div className="max-w-6xl mx-auto px-3 py-4 sm:p-6">
      <div className="mb-6 sm:mb-8 flex items-center justify-end">
        <div className="text-xs sm:text-sm text-slate-500 mr-4">CSV generation step - no inputs to fill</div>
      </div>
      <div className="mb-6 sm:mb-8">
        <h3 className="text-lg font-semibold text-slate-800 mb-2">CSV Generation</h3>
        <p className="text-sm sm:text-base text-slate-600">Generate your campaign CSV for Google Ads Editor</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>CSV Headers</CardTitle>
          <CardDescription>Brief overview of CSV structure</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {['Campaign', 'Ad Group', 'Row Type', 'Final URL', 'Headline 1', 'Description 1', 'Status'].map(header => (
              <Badge key={header} variant="outline">{header}</Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Generate CSV</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={handleGenerateCSV} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <FileSpreadsheet className="w-4 h-4 mr-2" />}
            Generate CSV
          </Button>
        </CardContent>
      </Card>

      {campaignData.csvData && (
        <Card className="border-indigo-200 bg-indigo-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            <CardTitle className="text-indigo-600">CSV Ready</CardTitle>
            </div>
            <CardDescription>Your CSV is ready for export</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button onClick={handleSaveCampaign} className="w-full" size="lg">
                <Star className="w-5 h-5 mr-2" />
              Save Campaign & Go to Dashboard
            </Button>
              <Button 
                variant="outline" 
                onClick={handleDownloadCSV}
                className="w-full"
              >
                <Download className="w-4 h-4 mr-2" />
                Download CSV
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  );

  // Progress bar
  const steps = [
    { id: 1, label: 'URL Input' },
    { id: 2, label: 'Structure' },
    { id: 3, label: 'Keywords' },
    { id: 4, label: 'Ads & Extensions' },
    { id: 5, label: 'Geo Target' },
    { id: 6, label: 'Success' },
  ];

  // Reset campaign function
  const handleResetCampaign = () => {
    if (!confirm('Are you sure you want to reset the campaign? All progress will be lost.')) {
      return;
    }
    
    setEditingCampaignName(false);
    setUserManuallySelectedStructure(false);
    setCampaignData({
      url: '',
      campaignName: generateDefaultCampaignName(),
      intent: null,
      vertical: null,
      cta: null,
      selectedStructure: 'skag',
      structureRankings: [],
      seedKeywords: [],
      negativeKeywords: [...DEFAULT_NEGATIVE_KEYWORDS],
      generatedKeywords: [],
      selectedKeywords: [],
      keywordTypes: { broad: true, phrase: true, exact: true, negative: true },
      ads: [],
      adTypes: ['rsa', 'dki'],
      extensions: [],
      adGroups: [],
      selectedAdGroup: 'ALL_AD_GROUPS',
      targetCountry: 'United States',
      locations: { countries: [], states: [], cities: [], zipCodes: [] },
      csvData: null,
      csvErrors: [],
    });
    setCurrentStep(1);
    setCampaignSaved(false);
    
    notifications.success('Campaign reset successfully', {
      title: 'Reset Complete',
      description: 'You can now start creating a new campaign from scratch.'
    });
  };

  // Navigation handler for Next button
  const handleNextStep = () => {
    if (currentStep === 1) handleUrlSubmit();
    else if (currentStep === 2) handleNextFromStructure();
    else if (currentStep === 3) {
      // Validation: Check if seed keywords are entered
      if (campaignData.seedKeywords.length === 0) {
        notifications.error('Please enter seed keywords before proceeding', { 
          title: 'Seed Keywords Required',
          description: 'Add at least one seed keyword to generate keyword variations.'
        });
        return;
      }
      
      // Validation: Check if keywords have been generated
      if (campaignData.generatedKeywords.length === 0) {
        notifications.error('Please click "Generate Keywords" before proceeding', { 
          title: 'Keywords Not Generated',
          description: 'You must generate keywords using the Generate Keywords button before moving to the next step.'
        });
        return;
      }
      
      // Validation: Check if keywords are selected
      if (campaignData.selectedKeywords.length === 0) {
        notifications.error('Please select at least one keyword before proceeding', { 
          title: 'No Keywords Selected',
          description: 'You must have at least one keyword selected. Use "Select All" to quickly select all generated keywords.'
        });
        return;
      }
      
      // Ensure SKAG structure is set when coming from keywords to ads wizard
      setCampaignData(prev => ({
        ...prev,
        selectedStructure: prev.selectedStructure || 'skag',
      }));
      setCurrentStep(4);
    }
    else if (currentStep === 4) {
      if (campaignData.ads.length === 0) {
        notifications.warning('Please generate ads first', { title: 'Ads Required' });
        return;
      }
      setCurrentStep(5);
    }
    else if (currentStep === 5) {
      handleSaveCampaign();
      setCurrentStep(6);
    }
    else if (currentStep === 6) {
      // Success screen - no action needed
    }
  };

  // Navigation handler for Back button
  const handleBackStep = () => {
    setCurrentStep(prev => Math.max(1, prev - 1));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-indigo-100/60 to-purple-100/70">
      {/* Navigation & Progress - Normal Theme */}
      <div className="bg-white/90 backdrop-blur-sm sticky top-0 z-20 border-b border-slate-200 shadow-sm">
        <div className="px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            {/* Back Button */}
            <button
              onClick={handleBackStep}
              disabled={currentStep === 1}
              className="flex items-center gap-1 sm:gap-2 text-slate-600 hover:text-indigo-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-xs sm:text-sm font-medium hidden sm:inline">Back</span>
            </button>
            
            {/* Progress Steps */}
            <div className="flex items-center gap-0.5 sm:gap-1 overflow-x-auto scrollbar-hide">
              {steps.map((step, idx) => (
                <React.Fragment key={step.id}>
                  <div className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm flex-shrink-0 ${
                    currentStep === step.id
                      ? 'bg-indigo-100 text-indigo-700 font-semibold'
                      : currentStep > step.id
                      ? 'bg-green-100 text-green-700'
                      : 'text-slate-400'
                  }`}>
                    {currentStep > step.id ? (
                      <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    ) : (
                      <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-current/10 flex items-center justify-center text-[10px] sm:text-xs font-medium">
                        {step.id}
                      </span>
                    )}
                    <span className="whitespace-nowrap hidden md:inline">{step.label}</span>
                  </div>
                  {idx < steps.length - 1 && (
                    <ChevronRight className={`w-3 h-3 sm:w-4 sm:h-4 mx-0.5 flex-shrink-0 ${
                      currentStep > step.id ? 'text-green-400' : 'text-slate-300'
                    }`} />
                  )}
                </React.Fragment>
              ))}
            </div>
            
            {/* API Status & Next/Reset Buttons */}
            <div className="flex items-center gap-1 sm:gap-3 flex-shrink-0">
              <ApiStatusIndicator className="hidden sm:flex" showLabel={true} />
              <ApiStatusIndicator className="flex sm:hidden" showLabel={false} />
              <button
                onClick={handleResetCampaign}
                className="text-xs sm:text-sm text-slate-500 hover:text-red-500 transition-colors flex items-center gap-1 p-1"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="hidden sm:inline">Reset</span>
              </button>
              <button
                onClick={handleNextStep}
                disabled={loading || currentStep === 6}
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg text-xs sm:text-sm font-medium hover:from-indigo-500 hover:to-purple-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span>{currentStep === 5 ? 'Finish' : currentStep === 6 ? 'Done' : 'Next'}</span>
                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="py-8">
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}
        {currentStep === 5 && renderStep5()}
        {currentStep >= 6 && renderStep8()}
      </div>

        
        {/* Call Only Ad Dialog */}
        <Dialog open={showCallAdDialog} onOpenChange={setShowCallAdDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Phone className="w-5 h-5 text-indigo-600" />
                Call Only Ad Details
              </DialogTitle>
              <DialogDescription>
                Enter the business phone number and name for your call-only ad.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="call-phone">Phone Number *</Label>
                <Input
                  id="call-phone"
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={callAdPhone}
                  onChange={(e) => setCallAdPhone(e.target.value)}
                />
                <p className="text-xs text-slate-500">
                  Enter the phone number customers will call. Premium rate numbers are not allowed.
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="call-business">Business Name (max 25 chars)</Label>
                <Input
                  id="call-business"
                  type="text"
                  placeholder="Your Business Name"
                  maxLength={25}
                  value={callAdBusinessName}
                  onChange={(e) => setCallAdBusinessName(e.target.value)}
                />
                <p className="text-xs text-slate-500">
                  {callAdBusinessName.length}/25 characters
                </p>
              </div>
            </div>
            
            <DialogFooter className="flex gap-2">
              <Button variant="outline" onClick={() => {
                setShowCallAdDialog(false);
                setCallAdPhone('');
                setCallAdBusinessName('');
              }}>
                Cancel
              </Button>
              <Button 
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-medium border-0"
                onClick={() => {
                  setCallAdPhone('');
                  handleCreateCallAd();
                }}
              >
                <Zap className="w-4 h-4 mr-2" />
                Skip (Use Defaults)
              </Button>
              <Button 
                onClick={handleCreateCallAd}
                disabled={!callAdPhone.trim()}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-purple-700"
              >
                <Phone className="w-4 h-4 mr-2" />
                Create Ad
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Export Dialog */}
        <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Export Campaign CSV</DialogTitle>
              <DialogDescription>
                Review your campaign export details before downloading
              </DialogDescription>
            </DialogHeader>
            
            {getExportStatistics() && (() => {
              const stats = getExportStatistics()!;
              
              return (
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-indigo-600">{stats.campaigns}</div>
                    <div className="text-sm text-slate-600">Campaigns</div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-indigo-600">{stats.adGroups}</div>
                    <div className="text-sm text-slate-600">Ad Groups</div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-indigo-600">{stats.keywords}</div>
                    <div className="text-sm text-slate-600">Keywords</div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-indigo-600">{stats.ads}</div>
                    <div className="text-sm text-slate-600">Ads</div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-indigo-600">{stats.negativeKeywords}</div>
                    <div className="text-sm text-slate-600">Negative Keywords</div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-indigo-600">{stats.extensions}</div>
                    <div className="text-sm text-slate-600">Extensions</div>
                  </div>
                  <div className="p-4 border rounded-lg col-span-2">
                    <div className="text-2xl font-bold text-indigo-600">{stats.locations}</div>
                    <div className="text-sm text-slate-600">Locations (Countries, States, Cities, Zip Codes)</div>
                  </div>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <div className="text-sm text-slate-600">Total CSV Rows</div>
                  <div className="text-xl font-semibold text-slate-800">{stats.totalRows}</div>
                </div>
              </div>
              );
            })()}
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowExportDialog(false)}>
                Cancel
              </Button>
              <Button onClick={confirmDownloadCSV} className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-purple-700">
                <Download className="w-4 h-4 mr-2" />
                Download CSV
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Campaign Structure Flow Diagram - Hidden per user request */}
        {/* {selectedStructureForDiagram && (
          <CampaignFlowDiagram
            open={showFlowDiagram}
            onOpenChange={setShowFlowDiagram}
            structureName={selectedStructureForDiagram.name}
            structureId={selectedStructureForDiagram.id}
          />
        )} */}
    </div>
  );
};

// Helper functions
function detectVertical(landingData: LandingPageExtractionResult): string {
  const text = (landingData.title || '') + ' ' + (landingData.h1 || '') + ' ' + landingData.page_text_tokens.join(' ');
  const lowerText = text.toLowerCase();
  const domain = (landingData.domain || '').toLowerCase();

  // Travel & Tourism
  if (lowerText.includes('flight') || lowerText.includes('hotel') || lowerText.includes('booking') || 
      lowerText.includes('travel') || lowerText.includes('airline') || lowerText.includes('resort') ||
      lowerText.includes('vacation') || lowerText.includes('destination') || domain.includes('flight') || 
      domain.includes('hotel') || domain.includes('travel')) {
    return 'Travel';
  }

  // E-commerce / Shopping
  if (lowerText.includes('product') || lowerText.includes('shop') || lowerText.includes('buy') || 
      lowerText.includes('cart') || lowerText.includes('store') || lowerText.includes('ecommerce') ||
      lowerText.includes('checkout') || lowerText.includes('order') || lowerText.includes('shipping') ||
      domain.includes('shop') || domain.includes('store') || domain.includes('amazon') || domain.includes('ebay')) {
    return 'E-commerce';
  }

  // Healthcare
  if (lowerText.includes('health') || lowerText.includes('medical') || lowerText.includes('doctor') ||
      lowerText.includes('hospital') || lowerText.includes('clinic') || lowerText.includes('pharmacy') ||
      domain.includes('health') || domain.includes('medical')) {
    return 'Healthcare';
  }

  // Legal
  if (lowerText.includes('law') || lowerText.includes('legal') || lowerText.includes('attorney') ||
      lowerText.includes('lawyer') || lowerText.includes('court') || domain.includes('law')) {
    return 'Legal';
  }

  // Real Estate
  if (lowerText.includes('real estate') || lowerText.includes('property') || lowerText.includes('home') ||
      lowerText.includes('apartment') || lowerText.includes('house') || lowerText.includes('rent') ||
      domain.includes('real-estate') || domain.includes('property')) {
    return 'Real Estate';
  }

  // Finance
  if (lowerText.includes('bank') || lowerText.includes('financial') || lowerText.includes('loan') ||
      lowerText.includes('investment') || lowerText.includes('insurance') || domain.includes('finance') ||
      domain.includes('bank')) {
    return 'Finance';
  }

  // Education
  if (lowerText.includes('school') || lowerText.includes('university') || lowerText.includes('course') ||
      lowerText.includes('training') || lowerText.includes('education') || domain.includes('education')) {
    return 'Education';
  }

  // Services
  if (lowerText.includes('service') || lowerText.includes('consulting') || lowerText.includes('agency') ||
      lowerText.includes('repair') || lowerText.includes('maintenance')) {
    return 'Services';
  }

  return 'General';
}

function detectCTA(landingData: LandingPageExtractionResult, vertical?: string): string {
  const text = (landingData.title || '') + ' ' + (landingData.h1 || '') + ' ' + landingData.page_text_tokens.join(' ');
  const lowerText = text.toLowerCase();

  // For Travel vertical, "Book" is the primary CTA
  if (vertical === 'Travel') {
    // Travel sites typically have booking functionality
    if (lowerText.includes('book') || lowerText.includes('reserve') || lowerText.includes('booking') ||
        lowerText.includes('reservation') || lowerText.includes('schedule') || lowerText.includes('search flight') ||
        lowerText.includes('search hotel') || lowerText.includes('find flight') || lowerText.includes('find hotel')) {
      return 'Book';
    }
    // Default for travel is Book
    return 'Book';
  }

  // Booking/Reservation specific
  if (lowerText.includes('book') || lowerText.includes('reserve') || lowerText.includes('booking') ||
      lowerText.includes('reservation') || lowerText.includes('schedule')) {
    return 'Book';
  }

  // Call-based
  if (lowerText.includes('call') || lowerText.includes('phone') || landingData.phones?.length > 0) {
    return 'Call';
  }

  // Contact/Lead
  if (lowerText.includes('contact') || lowerText.includes('form') || lowerText.includes('quote') ||
      lowerText.includes('inquiry') || lowerText.includes('request')) {
    return 'Contact/Lead';
  }

  // Purchase/Buy
  if (lowerText.includes('buy') || lowerText.includes('purchase') || lowerText.includes('order') ||
      lowerText.includes('checkout') || lowerText.includes('add to cart')) {
    return 'Purchase';
  }

  // Download
  if (lowerText.includes('download') || lowerText.includes('get started')) {
    return 'Download';
  }

  // Search/Browse
  if (lowerText.includes('search') || lowerText.includes('explore') || lowerText.includes('browse')) {
    return 'Search';
  }

  return 'Visit';
}

async function generateSeedKeywords(
  landingData: LandingPageExtractionResult,
  intent: IntentResult
): Promise<string[]> {
  try {
    // Build context from landing page data
    const context = [
      landingData.title || '',
      landingData.h1 || '',
      landingData.metaDescription || '',
      landingData.services.join(', ') || '',
      landingData.page_text_tokens?.slice(0, 50).join(' ') || ''
    ].filter(Boolean).join(' ');

    // Call server endpoint for AI seed keyword generation
    const response = await fetch('/api/ai/generate-seed-keywords', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        context,
        vertical: intent.intentLabel || 'General',
        services: landingData.services.slice(0, 5),
        pageText: landingData.page_text_tokens?.slice(0, 30).join(' ') || '',
        maxKeywords: 5
      })
    });

    const data = await response.json();
    
    if (data.keywords && Array.isArray(data.keywords) && data.keywords.length > 0) {
      console.log('✅ AI generated seed keywords:', data.keywords);
      return data.keywords.slice(0, 5);
    }
  } catch (error) {
    console.warn('AI seed keyword generation failed, using fallback:', error);
  }

  // Fallback: Generate keywords from landing page content if AI fails
  // IMPORTANT: All seed keywords must have at least 2 words
  const keywords: string[] = [];
  const domain = landingData.domain?.replace(/^www\./, '').split('.')[0] || '';
  
  const mainTerms = [
    landingData.title,
    landingData.h1,
    ...landingData.services.slice(0, 3),
  ].filter(Boolean);

  // Extract meaningful keywords from terms - only if they have 2+ words
  mainTerms.forEach(term => {
    if (term && keywords.length < 5) {
      const cleanTerm = term.toLowerCase().trim();
      // Only add if it has at least 2 words
      if (cleanTerm.length >= 3 && cleanTerm.length <= 50 && cleanTerm.split(/\s+/).length >= 2) {
        keywords.push(cleanTerm);
      }
    }
  });

  // Add intent-based keywords (always 2+ words)
  const baseTerm = mainTerms[0]?.toLowerCase()?.split(/\s+/)[0] || domain;
  if (baseTerm && keywords.length < 5) {
    if (intent.intentId === IntentId.CALL) {
      keywords.push(`${baseTerm} phone number`);
      keywords.push(`${baseTerm} contact`);
    } else if (intent.intentId === IntentId.LEAD) {
      keywords.push(`${baseTerm} quote`);
      keywords.push(`${baseTerm} pricing`);
    } else {
      keywords.push(`${baseTerm} near me`);
      keywords.push(`${baseTerm} services`);
    }
  }

  // Add domain-based fallback if still not enough (always 2+ words)
  if (keywords.length < 4 && domain) {
    keywords.push(`${domain} services`);
    keywords.push(`${domain} company`);
    keywords.push(`${domain} near me`);
  }

  // Filter to ensure all keywords have at least 2 words
  return keywords
    .filter(k => k.trim().split(/\s+/).length >= 2)
    .slice(0, 5);
}

function rankCampaignStructures(intent: IntentResult, vertical: string): { id: string; score: number }[] {
  // AI-based ranking logic - enhanced for different verticals
  const scores: { [key: string]: number } = {};

  // Initialize all structures with base score
  CAMPAIGN_STRUCTURES.forEach(struct => {
    scores[struct.id] = 1; // Everyone starts at 1
  });

  // ===== VERTICAL-SPECIFIC SCORING =====
  
  if (vertical === 'Travel') {
    // Travel/Booking sites benefit from funnel, intent-based, and seasonal
    scores['funnel'] += 5;        // TOF/MOF/BOF for awareness → consideration → booking
    scores['intent'] += 4;         // Search intent matters (flights vs hotels)
    scores['seasonal'] += 4;       // Seasonal variations (holidays, summer)
    scores['stag'] += 3;           // Theme grouping (destinations)
    scores['alpha_beta'] += 2;     // A/B testing for offers
  } 
  else if (vertical === 'E-commerce') {
    // E-commerce needs brand split and funnel
    scores['funnel'] += 5;         // Awareness → Consideration → Purchase
    scores['brand_split'] += 4;    // Brand vs product keywords
    scores['mix'] += 3;            // Mixed approach
    scores['seasonal'] += 3;       // Holiday campaigns
  } 
  else if (vertical === 'Healthcare') {
    // Healthcare is local and intent-driven
    scores['geo'] += 5;            // Local doctors/hospitals matter
    scores['intent'] += 4;         // Specific health issues/services
    scores['skag'] += 3;           // Single keyword groups work well
    scores['stag'] += 3;           // Theme-based (symptoms/services)
  } 
  else if (vertical === 'Real Estate') {
    // Real estate is heavily location-based
    scores['geo'] += 5;            // Location is everything
    scores['intent'] += 4;         // Buy vs rent intent
    scores['brand_split'] += 3;    // Brand vs properties
    scores['stag'] += 3;           // Theme by property type
  } 
  else if (vertical === 'Legal') {
    // Legal is service + expertise + location
    scores['geo'] += 4;            // Local laws matter
    scores['intent'] += 4;         // Type of legal service
    scores['skag'] += 3;           // Specific legal terms
    scores['stag'] += 3;           // Service types
  } 
  else if (vertical === 'Finance') {
    // Finance benefits from intent and funnel
    scores['funnel'] += 4;         // Awareness → Research → Apply
    scores['intent'] += 4;         // Loan type, product type
    scores['brand_split'] += 3;    // Brand vs product offers
  } 
  else if (vertical === 'Education') {
    // Education is funnel + seasonal
    scores['funnel'] += 4;         // Awareness → Consideration → Enrollment
    scores['seasonal'] += 4;       // Enrollment cycles
    scores['intent'] += 3;         // Degree/course type
    scores['stag'] += 3;           // Program themes
  } 
  else if (vertical === 'Services') {
    // Generic services benefit from geo + intent
    scores['geo'] += 4;            // Local services
    scores['intent'] += 4;         // Type of service
    scores['skag'] += 3;           // Specific services
    scores['stag'] += 3;           // Service categories
  }

  // ===== INTENT-SPECIFIC SCORING (applied after vertical) =====
  
  if (intent.intentId === IntentId.CALL) {
    // Phone-based CTAs
    scores['geo'] += 2;            // Local calls matter
    scores['skag'] += 2;           // Specific keyword calls
    scores['match_type'] += 1;     // Match type variations help
  } 
  else if (intent.intentId === IntentId.LEAD) {
    // Form/quote submissions
    scores['funnel'] += 2;         // Lead funnel
    scores['stag'] += 2;           // Theme grouping
    scores['intent'] += 2;         // Intent variations
  } 
  else if (intent.intentId === IntentId.PURCHASE) {
    // E-commerce purchase intent
    scores['funnel'] += 2;         // Shopping funnel
    scores['brand_split'] += 2;    // Brand keywords matter
  }

  // ===== EDGE CASE: Prevent zero-score structures =====
  // Ensure top structures have clear differentiation
  const sortedScores = Object.entries(scores)
    .map(([id, score]) => ({ id, score }))
    .sort((a, b) => b.score - a.score);

  // If top structures are too close, add small tiebreaker
  if (sortedScores.length > 1 && sortedScores[0].score === sortedScores[1].score) {
    // Add small bonus to first one for consistency
    const topId = sortedScores[0].id;
    sortedScores[0].score += 0.5;
  }

  return sortedScores;
}

function detectIsProduct(url: string, intent: IntentResult | null): boolean {
  // Simple detection - can be enhanced
  const lowerUrl = url.toLowerCase();
  return lowerUrl.includes('shop') || lowerUrl.includes('product') || lowerUrl.includes('buy') || 
         (intent?.intentId === IntentId.PURCHASE);
}


