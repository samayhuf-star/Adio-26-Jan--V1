import React, { useState } from 'react';
import { Search, Download, Edit, CheckCircle, Package, Sparkles, Zap, TrendingUp, X, Eye, Grid3x3, List } from 'lucide-react';
import { campaignPresets, CampaignPreset } from '../data/campaignPresets';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { notifications } from '../utils/notifications';
import { historyService } from '../utils/historyService';
import { exportCampaignToGoogleAdsEditorCSV, validateCSVRows, campaignStructureToCSVRows } from '../utils/googleAdsEditorCSVExporter';

interface CampaignPresetsProps {
  onLoadPreset: (presetData: any) => void;
}

const STRUCTURE_CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'SKAG', label: 'SKAG' },
  { id: 'STAG', label: 'STAG' },
  { id: 'GEO', label: 'GEO-Segmented' },
  { id: 'INTENT', label: 'Intent-Based' },
  { id: 'FUNNEL', label: 'Funnel-Based' },
];

export const CampaignPresets: React.FC<CampaignPresetsProps> = ({ onLoadPreset }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<CampaignPreset | null>(null);
  const [showReview, setShowReview] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredPresets = campaignPresets.filter(preset => {
    const matchesSearch = preset.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      preset.slug.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || 
      (preset.structure && preset.structure.toUpperCase().includes(selectedCategory.toUpperCase()));
    return matchesSearch && matchesCategory;
  });

  const handleSelectPreset = async (preset: CampaignPreset) => {
    setSelectedPreset(preset);
    setShowReview(true);
    
    // Auto-save preset to user's saved presets when viewed
    try {
      await historyService.save(
        'campaign-preset',
        preset.title,
        {
          presetId: preset.slug,
          presetData: preset,
          campaignName: preset.campaign_name,
          structure: preset.structure,
          keywords: preset.keywords,
          adGroups: preset.ad_groups,
          ads: preset.ads,
          negativeKeywords: preset.negative_keywords,
          finalUrl: preset.final_url,
          maxCpc: preset.max_cpc,
          dailyBudget: preset.daily_budget
        },
        'completed'
      );
      // Silent save - don't show notification to avoid interrupting user flow
    } catch (error) {
      console.error('Failed to auto-save preset:', error);
      // Continue anyway - user can still view the preset
    }
  };

  const handleLoadToBuilder = () => {
    if (!selectedPreset) return;

    // Bug_58, Bug_59, Bug_70: Transform preset data to match CampaignBuilder format with all required fields
    const keywordObjects = selectedPreset.keywords.map((kw, idx) => ({
      id: `preset-kw-${idx}`,
      text: kw,
      volume: 'High',
      cpc: `$${selectedPreset.max_cpc.toFixed(2)}`,
      type: 'Phrase',
      selected: true
    }));

    // Convert preset ads to generatedAds format (array of ad objects)
    const generatedAdsFromPreset = selectedPreset.ad_groups.map((group, groupIdx) => ({
      id: Date.now() + groupIdx,
      adGroup: group.name,
      type: 'rsa',
      headline1: selectedPreset.ads[0]?.headline1 || '',
      headline2: selectedPreset.ads[0]?.headline2 || '',
      headline3: selectedPreset.ads[0]?.headline3 || '',
      description1: selectedPreset.ads[0]?.description1 || '',
      description2: selectedPreset.ads[0]?.description2 || '',
      finalUrl: selectedPreset.final_url || '',
      path1: '',
      path2: ''
    }));

    // Create ad groups with keywords for review page
    const adGroupsWithKeywords = selectedPreset.ad_groups.map((group, groupIdx) => {
      // Get keywords for this ad group (distribute keywords across groups)
      const keywordsPerGroup = Math.ceil(selectedPreset.keywords.length / selectedPreset.ad_groups.length);
      const startIdx = groupIdx * keywordsPerGroup;
      const endIdx = Math.min(startIdx + keywordsPerGroup, selectedPreset.keywords.length);
      const groupKeywords = selectedPreset.keywords.slice(startIdx, endIdx);
      
      // Apply match type formatting (70% phrase, 20% exact, 10% broad)
      const formattedKeywords = groupKeywords.map((kw, idx) => {
        const cleanKw = kw.replace(/^\[|\]$|^"|"$/g, '').trim();
        const rand = (idx * 37) % 100;
        if (rand < 70) {
          return `"${cleanKw}"`; // Phrase match
        } else if (rand < 90) {
          return `[${cleanKw}]`; // Exact match
        } else {
          return cleanKw; // Broad match
        }
      });
      
      return {
        name: group.name,
        keywords: formattedKeywords
      };
    });

    const presetData = {
      name: selectedPreset.campaign_name,
      campaignName: selectedPreset.campaign_name,
      step: 5, // Navigate directly to review page (step 5)
      structure: selectedPreset.structure || 'SKAG',
      structureType: (selectedPreset.structure || 'SKAG').toLowerCase() as any,
      geo: 'ZIP', // Default geo strategy
      matchTypes: { broad: true, phrase: true, exact: true }, // All match types enabled
      url: selectedPreset.final_url || '', // Landing page URL
      seedKeywords: selectedPreset.keywords.join('\n'), // Seed keywords for display
      negativeKeywords: selectedPreset.negative_keywords.join('\n'), // Negative keywords
      keywords: keywordObjects, // Full keyword objects
      generatedKeywords: keywordObjects, // Generated keywords (same as keywords for presets)
      selectedKeywords: selectedPreset.keywords, // Selected keyword texts
      ads: {
        rsa: {
          headline1: selectedPreset.ads[0]?.headline1 || '',
          headline2: selectedPreset.ads[0]?.headline2 || '',
          headline3: selectedPreset.ads[0]?.headline3 || '',
          description1: selectedPreset.ads[0]?.description1 || '',
          description2: selectedPreset.ads[0]?.description2 || ''
        },
        dki: {
          headline1: '{Keyword:Service}',
          headline2: '',
          headline3: '',
          description1: '',
          description2: '',
          path1: '',
          path2: ''
        },
        call: {
          phone: '',
          businessName: '',
          headline1: '',
          headline2: '',
          description1: '',
          description2: ''
        }
      },
      generatedAds: generatedAdsFromPreset, // Convert ads to generatedAds array format
      enabledAdTypes: ['rsa'],
      adTypes: { rsa: true, dki: false, call: false },
      targetCountry: 'United States',
      targetType: 'ZIP',
      manualGeoInput: '',
      adGroups: selectedPreset.ad_groups.map(g => g.name),
      adGroupsWithKeywords: adGroupsWithKeywords, // Ad groups with formatted keywords for review
      maxCpc: selectedPreset.max_cpc,
      dailyBudget: selectedPreset.daily_budget
    };

    onLoadPreset(presetData);
  };

  const handleExportCSV = async (preset?: CampaignPreset) => {
    const exportPreset = preset || selectedPreset;
    if (!exportPreset) return;
    
    // Auto-save preset to user's saved presets when exported
    try {
      await historyService.save(
        'campaign-preset',
        exportPreset.title,
        {
          presetId: exportPreset.slug,
          presetData: exportPreset,
          campaignName: exportPreset.campaign_name,
          structure: exportPreset.structure,
          keywords: exportPreset.keywords,
          adGroups: exportPreset.ad_groups,
          ads: exportPreset.ads,
          negativeKeywords: exportPreset.negative_keywords,
          finalUrl: exportPreset.final_url,
          maxCpc: exportPreset.max_cpc,
          dailyBudget: exportPreset.daily_budget,
          exported: true,
          exportedAt: new Date().toISOString()
        },
        'completed'
      );
      // Silent save - don't show notification to avoid interrupting user flow
    } catch (error) {
      console.error('Failed to auto-save preset:', error);
      // Continue anyway - user can still export
    }

    try {
      // Convert preset to CampaignStructure format
      const { presetToCampaignStructure } = await import('../utils/csvGeneratorV3');
      const structure = presetToCampaignStructure(exportPreset);
      
      // Convert to CSV rows and validate
      const rows = campaignStructureToCSVRows(structure);
      const validation = validateCSVRows(rows);
      
      if (!validation.isValid) {
        const errorMessage = validation.errors.slice(0, 5).join('\n') + 
          (validation.errors.length > 5 ? `\n... and ${validation.errors.length - 5} more errors` : '');
        notifications.error(
          errorMessage,
          { 
            title: '❌ CSV Validation Failed',
            description: 'Please fix the errors above before exporting.',
            duration: 15000
          }
        );
        return;
      }
      
      // Show warnings if any
      if (validation.warnings.length > 0) {
        const warningMessage = validation.warnings.slice(0, 5).join('\n') + 
          (validation.warnings.length > 5 ? `\n... and ${validation.warnings.length - 5} more warnings` : '');
        notifications.warning(
          warningMessage,
          { 
            title: '⚠️  CSV Validation Warnings',
            description: 'Your campaign will export, but consider fixing these warnings.',
            duration: 10000
          }
        );
      }
      
      // Export using Google Ads Editor format
      const filename = `${exportPreset.slug}-google-ads-editor-${new Date().toISOString().split('T')[0]}.csv`;
      await exportCampaignToGoogleAdsEditorCSV(structure, filename);
      
      notifications.success(`Campaign exported successfully! File: ${filename}`, {
        title: 'Export Complete',
        description: 'Your CSV file has been downloaded successfully.'
      });
    } catch (error: any) {
      console.error('Export error:', error);
      notifications.error(
        error?.message || 'An unexpected error occurred during export',
        { 
          title: '❌ Export Failed',
          description: 'Please try again or contact support if the issue persists.'
        }
      );
    }
  };

  if (showReview && selectedPreset) {
    return (
      <div className="max-h-[90vh] overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 mb-1">Review Preset: {selectedPreset.title}</h1>
            <p className="text-sm text-slate-600">Review and customize your campaign before exporting</p>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setShowReview(false);
              setSelectedPreset(null);
            }}
          >
            Back to Presets
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Campaign Info */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-semibold mb-4">Campaign Details</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-600">Campaign Name</label>
                  <p className="text-slate-900 mt-1">{selectedPreset.campaign_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Ad Groups</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedPreset.ad_groups.map((group, idx) => (
                      <Badge key={idx} variant="secondary">{group.name}</Badge>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-600">Max CPC</label>
                    <p className="text-slate-900 mt-1">${selectedPreset.max_cpc.toFixed(2)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-600">Daily Budget</label>
                    <p className="text-slate-900 mt-1">${selectedPreset.daily_budget}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Ready to Launch - moved here below Campaign Details */}
            <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl shadow-lg p-6 text-white">
              <h3 className="text-base font-semibold mb-3">Ready to Launch</h3>
              <p className="text-sm text-indigo-100 mb-6">
                This preset is optimized for high-intent pay-per-call campaigns. Review the details and export when ready.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={handleLoadToBuilder}
                  className="flex-1 bg-white text-slate-800 hover:bg-gray-100 hover:text-slate-900"
                  size="lg"
                >
                  <Edit className="w-4 h-4 mr-2 text-slate-700" />
                  Edit in Campaign Builder
                </Button>
                <Button
                  onClick={() => handleExportCSV()}
                  variant="outline"
                  className="flex-1 border-white bg-white text-slate-800 hover:bg-gray-100 hover:text-slate-900"
                  size="lg"
                >
                  <Download className="w-4 h-4 mr-2 text-slate-700" />
                  Export CSV
                </Button>
              </div>
            </div>

            {/* Keywords */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-semibold mb-4">Keywords ({selectedPreset.keywords.length})</h2>
              <div className="flex flex-wrap gap-2 max-h-64 overflow-y-auto">
                {selectedPreset.keywords.map((keyword, idx) => (
                  <Badge key={idx} variant="outline">
                    {keyword}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Negative Keywords */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-semibold mb-4">Negative Keywords</h2>
              <div className="flex flex-wrap gap-2">
                {selectedPreset.negative_keywords.map((keyword, idx) => (
                  <Badge key={idx} variant="destructive">
                    -{keyword}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Ad Copy */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-semibold mb-4">Ad Copy</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-600">Headlines</label>
                  <div className="mt-2 space-y-2">
                    <p className="text-slate-900 font-medium">{selectedPreset.ads[0].headline1}</p>
                    <p className="text-slate-900 font-medium">{selectedPreset.ads[0].headline2}</p>
                    <p className="text-slate-900 font-medium">{selectedPreset.ads[0].headline3}</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Descriptions</label>
                  <div className="mt-2 space-y-2">
                    <p className="text-slate-600">{selectedPreset.ads[0].description1}</p>
                    <p className="text-slate-600">{selectedPreset.ads[0].description2}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Actions */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-base font-semibold mb-4 text-slate-800">Preset Stats</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Keywords:</span>
                  <span className="font-medium text-slate-800">{selectedPreset.keywords.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Ad Groups:</span>
                  <span className="font-medium text-slate-800">{selectedPreset.ad_groups.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Negative Keywords:</span>
                  <span className="font-medium text-slate-800">{selectedPreset.negative_keywords.length}</span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-slate-600">Match Distribution:</span>
                  <span className="font-medium text-slate-800 text-right">
                    {Math.round(selectedPreset.match_distribution.exact * 100)}% Exact,{' '}
                    {Math.round(selectedPreset.match_distribution.phrase * 100)}% Phrase,{' '}
                    {Math.round(selectedPreset.match_distribution.broad_mod * 100)}% Broad
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shrink-0">
            <Package className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold theme-gradient-text">Campaign Presets</h1>
            <p className="text-sm text-slate-600 mt-1">Plug-and-play Google Ads campaigns for high-intent home services</p>
          </div>
        </div>

        {/* Shell View - Two Boxes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Box 1: Stats */}
          <div className="bg-slate-900 rounded-xl border border-slate-700 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-800 border-b border-slate-700">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <span className="text-xs text-slate-400 ml-2 font-mono">preset_stats.sh</span>
            </div>
            <div className="p-4 font-mono">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1 text-center">
                  <div className="text-2xl font-bold text-violet-400">{campaignPresets.length}</div>
                  <div className="text-xs text-slate-400">Presets</div>
                </div>
                <div className="space-y-1 text-center">
                  <div className="text-2xl font-bold text-emerald-400">5</div>
                  <div className="text-xs text-slate-400">Structures</div>
                </div>
                <div className="space-y-1 text-center">
                  <div className="text-2xl font-bold text-amber-400">CSV</div>
                  <div className="text-xs text-slate-400">Export</div>
                </div>
              </div>
            </div>
          </div>

          {/* Box 2: Details */}
          <div className="bg-slate-900 rounded-xl border border-slate-700 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-800 border-b border-slate-700">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <span className="text-xs text-slate-400 ml-2 font-mono">preset_config.sh</span>
            </div>
            <div className="p-4 font-mono space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-500">industries:</span>
                <span className="text-cyan-400">Home Services, Medical, Legal, Auto</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-slate-500">keywords:</span>
                <span className="text-amber-400">410-710</span>
                <span className="text-slate-600 mx-1">|</span>
                <span className="text-slate-500">ads:</span>
                <span className="text-pink-400">RSA, Call-Only, DKI</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-500">extensions:</span>
                <span className="text-blue-400">Sitelinks, Callouts, Snippets</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-500">structures:</span>
                <span className="text-emerald-400">SKAG, STAG, Intent-Based, Alpha-Beta</span>
              </div>
            </div>
          </div>
        </div>

        {/* Search and View Toggle */}
        <div className="flex items-center gap-4 mb-4">
          <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none z-10" />
          <input
            type="text"
            placeholder="Search presets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-10 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              aria-label="Clear search"
            >
              <X className="w-5 h-5" />
            </button>
          )}
          </div>
          
          {/* View Mode Toggle */}
          <div className="flex items-center gap-2 bg-slate-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-all ${
                viewMode === 'grid' 
                  ? 'bg-white text-indigo-600 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
              title="Grid View"
            >
              <Grid3x3 className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-all ${
                viewMode === 'list' 
                  ? 'bg-white text-indigo-600 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
              title="List View"
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Category Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {STRUCTURE_CATEGORIES.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedCategory === category.id
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>
      </div>

      {/* Presets Grid/List - Simple flat display */}
      <div className={viewMode === 'grid' 
        ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4' 
        : 'space-y-3'
      }>
        {filteredPresets.map((preset) => {
          // List View Layout
          if (viewMode === 'list') {
            return (
          <div
            key={preset.slug}
                className="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-lg transition-all cursor-pointer group relative overflow-hidden"
            onClick={() => handleSelectPreset(preset)}
          >
                <div className="p-6">
                  <div className="flex items-start gap-6">
                    {/* Left: Title and Description */}
                    <div className="flex-1 pr-4 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <h3 className="text-xl font-bold text-slate-800 group-hover:text-indigo-600 transition-colors leading-tight flex-1 pr-16 break-words">
                          {preset.title}
                        </h3>
                      </div>
                      <p className="text-sm text-slate-500 mb-4 leading-tight break-words">{preset.campaign_name}</p>
                      
                      {/* Stats Row */}
                      <div className="flex items-center gap-6 mb-4">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Sparkles className="w-4 h-4" />
                  <span>{preset.keywords.length} keywords</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Zap className="w-4 h-4" />
                  <span>{preset.ad_groups.length} ad groups</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <CheckCircle className="w-4 h-4" />
                  <span>${preset.max_cpc.toFixed(2)} max CPC</span>
                </div>
              </div>

                      {/* Example Keywords - Display as normal text */}
                      <div className="space-y-1.5">
                        {preset.keywords.slice(0, 2).map((keyword, idx) => (
                          <p key={idx} className="text-sm text-slate-600 leading-tight">
                            {keyword}
                          </p>
                        ))}
                        {preset.keywords.length > 2 && (
                          <p className="text-xs text-slate-500 leading-tight">
                            +{preset.keywords.length - 2} more keywords
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 shrink-0 mt-6">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-slate-300 hover:bg-slate-50 whitespace-nowrap"
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          handleSelectPreset(preset);
                        }}
                        title="View campaign details"
                      >
                        <Eye className="w-4 h-4 mr-1.5" />
                        VIEW
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-indigo-300 text-indigo-600 hover:bg-indigo-50 whitespace-nowrap"
                        onClick={async (e: React.MouseEvent) => {
                          e.stopPropagation();
                          await historyService.save(
                            'campaign',
                            preset.title,
                            {
                              presetId: preset.slug,
                              presetData: preset,
                              campaignName: preset.campaign_name,
                              structure: preset.structure,
                              keywords: preset.keywords,
                              adGroups: preset.ad_groups,
                              ads: preset.ads,
                              negativeKeywords: preset.negative_keywords,
                              finalUrl: preset.final_url,
                              maxCpc: preset.max_cpc,
                              dailyBudget: preset.daily_budget,
                              fromPreset: true,
                              editable: true
                            },
                            'draft'
                          );
                          notifications.success(`"${preset.title}" saved to your campaigns for editing`, {
                            title: 'Saved to Campaigns'
                          });
                          setSelectedPreset(preset);
                          setShowReview(true);
                        }}
                        title="Edit and save to your campaigns"
                      >
                        <Edit className="w-4 h-4 mr-1.5" />
                        Edit
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          }
          
          // Grid View Layout - Simplified UI
          return (
          <div
            key={preset.slug}
            className="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-lg hover:border-indigo-200 transition-all cursor-pointer group relative overflow-hidden p-4 flex flex-col h-full"
            onClick={() => handleSelectPreset(preset)}
          >
            <div className="flex-1 flex flex-col">
              {/* Title Section */}
              <div className="mb-3">
                <h3 className="text-sm font-bold text-slate-800 group-hover:text-indigo-600 transition-colors leading-tight">
                  {preset.title}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">{preset.campaign_name}</p>
              </div>

              {/* Compact Stats Row */}
              <div className="flex items-center gap-3 mb-4 text-xs text-slate-600">
                <span className="flex items-center gap-1">
                  <span className="font-semibold text-indigo-600">{preset.keywords.length}</span> keywords
                </span>
                <span className="text-slate-300">|</span>
                <span className="flex items-center gap-1">
                  <span className="font-semibold text-indigo-600">{preset.ad_groups.length}</span> ad groups
                </span>
              </div>

              {/* Action Button */}
              <div className="mt-auto">
                <Button
                  size="sm"
                  className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-xs h-8"
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    handleSelectPreset(preset);
                  }}
                  title="View campaign details"
                >
                  <Eye className="w-3.5 h-3.5 mr-1" />
                  View Details
                </Button>
              </div>
            </div>
          </div>
          );
        })}
      </div>

      {filteredPresets.length === 0 && (
        <div className="text-center py-12">
          <p className="text-sm text-slate-500">No presets found matching "{searchQuery}"</p>
        </div>
      )}
    </div>
  );
};

