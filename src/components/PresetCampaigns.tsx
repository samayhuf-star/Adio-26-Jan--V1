import React, { useState, useMemo } from 'react';
import { Search, Download, Eye, Package, Zap, TrendingUp, X, Clock, Target, ArrowLeft } from 'lucide-react';
import { presetCampaigns, PresetCampaign } from '../data/presetCampaigns';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { notifications } from '../utils/notifications';
import { generateCampaignStructure, StructureSettings, Ad } from '../utils/campaignStructureGenerator';
import { exportCampaignToGoogleAdsEditorCSV, validateCSVRows, campaignStructureToCSVRows } from '../utils/googleAdsEditorCSVExporter';
import { getStructureBadgeClasses, getStatusBadgeClasses } from '../utils/badgeTheme';

interface PresetCampaignsProps {
  onLoadPreset?: (presetData: any) => void;
}

type StructureFilter = 'all' | 'skag' | 'stag' | 'geo-segmented' | 'intent-based' | 'funnel-based';

function getAdGroupCount(preset: PresetCampaign): number {
  if (preset.adGroupCount) return preset.adGroupCount;
  
  switch (preset.structure) {
    case 'skag':
      return preset.keywords.length;
    case 'stag':
      return Math.min(Math.ceil(preset.keywords.length / 5), 20);
    case 'geo-segmented':
      return Math.ceil(preset.keywords.length / 4);
    case 'intent-based':
      return Math.ceil(preset.keywords.length / 8);
    case 'funnel-based':
      return 3;
    default:
      return Math.ceil(preset.keywords.length / 5);
  }
}

function mapStructureType(presetStructure: string): string {
  const structureMap: Record<string, string> = {
    'skag': 'skag',
    'stag': 'stag',
    'geo-segmented': 'geo',
    'intent-based': 'intent',
    'funnel-based': 'funnel'
  };
  return structureMap[presetStructure] || 'stag';
}

function convertPresetToStructureSettings(preset: PresetCampaign): StructureSettings {
  const ads: Ad[] = [{
    headline1: preset.adTemplate.headlines[0] || 'Professional Service',
    headline2: preset.adTemplate.headlines[1] || 'Expert Solutions',
    headline3: preset.adTemplate.headlines[2] || 'Call Now',
    headline4: preset.adTemplate.headlines[3] || '',
    headline5: preset.adTemplate.headlines[4] || '',
    headline6: preset.adTemplate.headlines[5] || '',
    headline7: preset.adTemplate.headlines[6] || '',
    headline8: preset.adTemplate.headlines[7] || '',
    headline9: preset.adTemplate.headlines[8] || '',
    headline10: preset.adTemplate.headlines[9] || '',
    headline11: preset.adTemplate.headlines[10] || '',
    headline12: preset.adTemplate.headlines[11] || '',
    headline13: preset.adTemplate.headlines[12] || '',
    headline14: preset.adTemplate.headlines[13] || '',
    headline15: preset.adTemplate.headlines[14] || '',
    description1: preset.adTemplate.descriptions[0] || 'Get professional service you can trust.',
    description2: preset.adTemplate.descriptions[1] || 'Contact us today for expert assistance.',
    description3: preset.adTemplate.descriptions[2] || '',
    description4: preset.adTemplate.descriptions[3] || '',
    final_url: 'https://www.example.com',
    path1: preset.vertical.toLowerCase().replace(/\s+/g, '-').substring(0, 15),
    path2: 'services',
    type: 'rsa'
  }];

  return {
    structureType: mapStructureType(preset.structure),
    campaignName: `${preset.name} Campaign`,
    keywords: preset.keywords,
    matchTypes: preset.matchTypes,
    url: 'https://www.example.com',
    negativeKeywords: preset.negativeKeywords,
    ads: ads,
    targetCountry: 'United States'
  };
}

function getIntentIcon(intent: string) {
  switch (intent.toLowerCase()) {
    case 'emergency':
      return <Zap className="w-3 h-3" />;
    case 'project':
      return <Target className="w-3 h-3" />;
    case 'recurring':
      return <Clock className="w-3 h-3" />;
    default:
      return <TrendingUp className="w-3 h-3" />;
  }
}


export const PresetCampaigns: React.FC<PresetCampaignsProps> = ({ onLoadPreset }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [structureFilter, setStructureFilter] = useState<StructureFilter>('all');
  const [selectedPreset, setSelectedPreset] = useState<PresetCampaign | null>(null);
  const [showDetailView, setShowDetailView] = useState(false);
  const [isExporting, setIsExporting] = useState<string | null>(null);

  const filteredPresets = useMemo(() => {
    return presetCampaigns.filter(preset => {
      const matchesSearch = preset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        preset.vertical.toLowerCase().includes(searchQuery.toLowerCase()) ||
        preset.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStructure = structureFilter === 'all' || preset.structure === structureFilter;
      
      return matchesSearch && matchesStructure;
    });
  }, [searchQuery, structureFilter]);

  const handleExportCSV = async (preset: PresetCampaign, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    
    setIsExporting(preset.id);
    
    try {
      const settings = convertPresetToStructureSettings(preset);
      const structure = generateCampaignStructure(preset.keywords, settings);
      
      const rows = campaignStructureToCSVRows(structure);
      const validation = validateCSVRows(rows);
      
      if (!validation.isValid) {
        const errorMessage = validation.errors.slice(0, 3).join('\n');
        notifications.error(errorMessage, {
          title: 'CSV Validation Failed',
          duration: 8000
        });
        return;
      }
      
      if (validation.warnings.length > 0) {
        notifications.warning(`${validation.warnings.length} warnings found`, {
          title: 'CSV Validation Warnings',
          duration: 5000
        });
      }
      
      const filename = `${preset.id}-google-ads-${new Date().toISOString().split('T')[0]}.csv`;
      await exportCampaignToGoogleAdsEditorCSV(structure, filename);
      
      notifications.success(`${preset.name} campaign exported successfully!`, {
        title: 'Export Complete'
      });
    } catch (error: any) {
      console.error('Export error:', error);
      notifications.error(error?.message || 'An unexpected error occurred during export', {
        title: 'Export Failed'
      });
    } finally {
      setIsExporting(null);
    }
  };

  const handlePreview = (preset: PresetCampaign, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setSelectedPreset(preset);
    setShowDetailView(true);
  };

  const handleBackToList = () => {
    setShowDetailView(false);
    setSelectedPreset(null);
  };

  const handleLoadPreset = (preset: PresetCampaign) => {
    if (onLoadPreset) {
      const settings = convertPresetToStructureSettings(preset);
      onLoadPreset({
        ...settings,
        presetId: preset.id,
        presetName: preset.name
      });
    }
  };

  if (showDetailView && selectedPreset) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
        <div className="mb-6">
          <button
            onClick={handleBackToList}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Presets</span>
          </button>
          
          <div className="flex items-center gap-3 mb-3">
            <Badge
              className={`text-xs font-semibold ${getStructureBadgeClasses(selectedPreset.structure)}`}
              variant="outline"
            >
              {selectedPreset.structureLabel}
            </Badge>
            <Badge
              className={`text-xs ${getStatusBadgeClasses(selectedPreset.targetIntent)}`}
              variant="outline"
            >
              <span className="flex items-center gap-1">
                {getIntentIcon(selectedPreset.targetIntent)}
                {selectedPreset.targetIntent}
              </span>
            </Badge>
            <span className="text-sm text-indigo-600 font-medium">
              {selectedPreset.estimatedCPC} CPC
            </span>
          </div>
          
          <h1 className="text-2xl font-bold text-slate-900 mb-2">{selectedPreset.name}</h1>
          <p className="text-slate-600">{selectedPreset.description}</p>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Keywords ({selectedPreset.keywords.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {selectedPreset.keywords.map((keyword, idx) => (
                <Badge key={idx} variant="outline" className="text-sm bg-slate-50 px-3 py-1">
                  {keyword}
                </Badge>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Headlines ({selectedPreset.adTemplate.headlines.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {selectedPreset.adTemplate.headlines.map((headline, idx) => (
                <div
                  key={idx}
                  className="text-sm p-3 bg-indigo-50 rounded-lg text-teal-800 border border-teal-100"
                >
                  {idx + 1}. {headline}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <Target className="w-4 h-4" />
              Descriptions ({selectedPreset.adTemplate.descriptions.length})
            </h3>
            <div className="space-y-3">
              {selectedPreset.adTemplate.descriptions.map((desc, idx) => (
                <div
                  key={idx}
                  className="text-sm p-4 bg-indigo-50 rounded-lg text-emerald-800 border border-emerald-100"
                >
                  {idx + 1}. {desc}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <X className="w-4 h-4" />
              Negative Keywords ({selectedPreset.negativeKeywords.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {selectedPreset.negativeKeywords.map((keyword, idx) => (
                <Badge
                  key={idx}
                  variant="outline"
                  className="text-sm bg-red-50 text-red-600 border-red-200 px-3 py-1"
                >
                  -{keyword}
                </Badge>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">Match Types</h3>
            <div className="flex items-center gap-3">
              {selectedPreset.matchTypes.broad && (
                <Badge variant="secondary" className="px-4 py-1">Broad</Badge>
              )}
              {selectedPreset.matchTypes.phrase && (
                <Badge variant="secondary" className="px-4 py-1">Phrase</Badge>
              )}
              {selectedPreset.matchTypes.exact && (
                <Badge variant="secondary" className="px-4 py-1">Exact</Badge>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 mt-8 pt-6 border-t border-slate-200">
          <Button
            variant="outline"
            onClick={handleBackToList}
            className="px-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Presets
          </Button>
          <div className="flex items-center gap-3">
            {onLoadPreset && (
              <Button
                variant="outline"
                onClick={() => {
                  handleLoadPreset(selectedPreset);
                  handleBackToList();
                }}
                className="px-6"
              >
                Load to Builder
              </Button>
            )}
            <Button
              className={`px-6 ${
                selectedPreset.structure === 'skag'
                  ? 'bg-[#0891B2] hover:bg-[#0E7490]'
                  : 'bg-[#7C3AED] hover:bg-[#6D28D9]'
              } text-white`}
              onClick={() => handleExportCSV(selectedPreset)}
              disabled={isExporting === selectedPreset.id}
            >
              {isExporting === selectedPreset.id ? (
                <span>Exporting...</span>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Download CSV
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shrink-0">
            <Package className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Home Service Campaign Presets
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Ready-to-use Google Ads campaigns for 20 home service verticals
            </p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none z-10" />
            <input
              type="text"
              placeholder="Search by vertical name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-10 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
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

          {/* Structure Filter Buttons */}
          <div className="flex flex-wrap items-center gap-2 bg-slate-100 rounded-xl p-1">
            <button
              onClick={() => setStructureFilter('all')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                structureFilter === 'all'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStructureFilter('skag')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                structureFilter === 'skag'
                  ? 'bg-[#0891B2] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              SKAG
            </button>
            <button
              onClick={() => setStructureFilter('stag')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                structureFilter === 'stag'
                  ? 'bg-[#7C3AED] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              STAG
            </button>
            <button
              onClick={() => setStructureFilter('geo-segmented')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                structureFilter === 'geo-segmented'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              GEO-Segmented
            </button>
            <button
              onClick={() => setStructureFilter('intent-based')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                structureFilter === 'intent-based'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Intent-Based
            </button>
            <button
              onClick={() => setStructureFilter('funnel-based')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                structureFilter === 'funnel-based'
                  ? 'bg-pink-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Funnel-Based
            </button>
          </div>
        </div>
      </div>

      {/* Results Count */}
      {searchQuery && (
        <p className="text-sm text-slate-500 mb-4">
          Found {filteredPresets.length} preset{filteredPresets.length !== 1 ? 's' : ''} matching "{searchQuery}"
        </p>
      )}

      {/* Presets Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredPresets.map((preset) => (
          <Card
            key={preset.id}
            className={`group relative overflow-hidden transition-all hover:shadow-lg cursor-pointer border-2 ${
              preset.structure === 'skag'
                ? 'hover:border-[#0891B2]'
                : 'hover:border-[#7C3AED]'
            }`}
            onClick={() => handlePreview(preset)}
          >
            {/* Gradient accent bar */}
            <div
              className={`absolute top-0 left-0 right-0 h-1 ${
                preset.structure === 'skag'
                  ? 'bg-[#0891B2]'
                  : 'bg-[#7C3AED]'
              }`}
            />

            <CardHeader className="pb-2 pt-4">
              {/* Badges Row */}
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <Badge
                  className={`text-xs font-semibold ${getStructureBadgeClasses(preset.structure)}`}
                  variant="outline"
                >
                  {preset.structureLabel}
                </Badge>
                <Badge
                  className={`text-xs ${getStatusBadgeClasses(preset.targetIntent)}`}
                  variant="outline"
                >
                  <span className="flex items-center gap-1">
                    {getIntentIcon(preset.targetIntent)}
                    {preset.targetIntent}
                  </span>
                </Badge>
              </div>

              <CardTitle className="text-lg font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                {preset.name}
              </CardTitle>
              <CardDescription className="text-sm text-slate-500 line-clamp-2 mt-1">
                {preset.description}
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-0 pb-4">
              {/* Stats */}
              <div className="flex items-center gap-3 text-sm text-slate-600 mb-4">
                <span className="flex items-center gap-1">
                  <TrendingUp className="w-4 h-4 text-indigo-500" />
                  <span className="font-semibold text-indigo-600">{preset.keywords.length}</span> keywords
                </span>
                <span className="text-slate-300">|</span>
                <span className="flex items-center gap-1">
                  <span className="font-semibold text-purple-600">{getAdGroupCount(preset)}</span> ad groups
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={(e: React.MouseEvent) => handlePreview(preset, e)}
                >
                  <Eye className="w-4 h-4 mr-1" />
                  Preview
                </Button>
                <Button
                  size="sm"
                  className={`flex-1 ${
                    preset.structure === 'skag'
                      ? 'bg-[#0891B2] hover:bg-[#0E7490]'
                      : 'bg-[#7C3AED] hover:bg-[#6D28D9]'
                  } text-white`}
                  onClick={(e: React.MouseEvent) => handleExportCSV(preset, e)}
                  disabled={isExporting === preset.id}
                >
                  {isExporting === preset.id ? (
                    <span className="flex items-center gap-1">
                      <span className="animate-spin">...</span>
                    </span>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-1" />
                      CSV
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredPresets.length === 0 && (
        <div className="text-center py-12">
          <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-600 mb-2">No presets found</h3>
          <p className="text-slate-500">Try adjusting your search or filter criteria</p>
        </div>
      )}

    </div>
  );
};

export default PresetCampaigns;
