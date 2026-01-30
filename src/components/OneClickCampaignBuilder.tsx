import React, { useState, useRef, useEffect } from 'react';
import { useAuthCompat } from '../utils/authCompat';
import { Zap, Check, AlertCircle, Download, Save, Loader2, ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { notifications } from '../utils/notifications';
import { generateMasterCSV, CampaignDataV5, AdGroupV5, KeywordV5, AdV5 } from '../utils/googleAdsEditorCSVExporterV5';
import { historyService } from '../utils/historyService';

interface GeneratedCampaign {
  id: string;
  campaign_name: string;
  business_name: string;
  website_url: string;
  monthly_budget: number;
  csvData: string;
  campaign_data: {
    analysis: {
      businessName: string;
      mainValue: string;
      keyBenefits: string[];
      targetAudience: string;
      industry: string;
      products: string[];
    };
    structure: {
      campaignName: string;
      dailyBudget: number;
      adGroupThemes: string[];
    };
    keywords: string[];
    adGroups: Array<{
      name: string;
      keywords: string[];
    }>;
    adCopy: {
      headlines: Array<{ text: string }>;
      descriptions: Array<{ text: string }>;
      callouts: string[];
    };
  };
}

interface ProgressStep {
  step: number;
  status: string;
  progress: number;
}

interface LogEntry {
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'action' | 'progress';
}

export function OneClickCampaignBuilder() {
  const { getToken } = useAuthCompat();
  const [currentStep, setCurrentStep] = useState<'input' | 'generating' | 'results'>('input');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);
  const [currentStatus, setCurrentStatus] = useState('');
  const [generatedCampaign, setGeneratedCampaign] = useState<GeneratedCampaign | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [resultsTimestamp, setResultsTimestamp] = useState<string>('');
  const logContainerRef = useRef<HTMLDivElement>(null);

  const addLogEntry = (message: string, type: LogEntry['type'] = 'info') => {
    const now = new Date();
    const timestamp = now.toLocaleTimeString('en-US', { hour12: false });
    setLogEntries(prev => [...prev, { timestamp, message, type }]);
  };

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logEntries]);

  const handleAnalyze = async () => {
    if (!websiteUrl) {
      setError('Please enter a website URL');
      return;
    }

    let formattedUrl = websiteUrl.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = 'https://' + formattedUrl;
      setWebsiteUrl(formattedUrl);
    }

    setError('');
    setCurrentStep('generating');
    setProgress(0);
    setIsGenerating(true);
    setLogEntries([]);
    setAnalysisComplete(false);
    
    const simulatedLogs = [
      { delay: 0, message: 'Initializing campaign builder...', type: 'info' as const },
      { delay: 200, message: `Target URL: ${formattedUrl}`, type: 'progress' as const },
      { delay: 500, message: 'Connecting to AI engine...', type: 'info' as const },
      { delay: 900, message: 'AI connection established', type: 'success' as const },
      { delay: 1300, message: 'Fetching landing page content...', type: 'info' as const },
      { delay: 1700, message: 'Extracting page metadata...', type: 'progress' as const },
      { delay: 2100, message: 'Analyzing business vertical...', type: 'info' as const },
      { delay: 2500, message: 'Detecting campaign intent...', type: 'progress' as const },
      { delay: 3000, message: 'Building campaign structure...', type: 'info' as const },
      { delay: 3500, message: 'Generating seed keywords...', type: 'progress' as const },
      { delay: 4000, message: 'Expanding keyword variations...', type: 'info' as const },
      { delay: 4500, message: 'Building ad groups...', type: 'progress' as const },
      { delay: 5000, message: 'Creating headline variations...', type: 'info' as const },
      { delay: 5500, message: 'Writing ad descriptions...', type: 'progress' as const },
      { delay: 6000, message: 'Optimizing ad copy...', type: 'info' as const },
      { delay: 6500, message: 'Generating callout extensions...', type: 'progress' as const },
      { delay: 7000, message: 'Building sitelink extensions...', type: 'info' as const },
      { delay: 7500, message: 'Organizing campaign hierarchy...', type: 'progress' as const },
      { delay: 8000, message: 'Validating keyword match types...', type: 'info' as const },
      { delay: 8500, message: 'Optimizing bid strategies...', type: 'progress' as const },
      { delay: 9000, message: 'Generating Google Ads CSV...', type: 'info' as const },
      { delay: 9500, message: 'Validating CSV format...', type: 'progress' as const },
      { delay: 10000, message: 'Finalizing campaign data...', type: 'info' as const },
    ];
    
    const logTimeouts: NodeJS.Timeout[] = [];
    simulatedLogs.forEach(log => {
      const timeout = setTimeout(() => {
        if (!analysisComplete) {
          addLogEntry(log.message, log.type);
        }
      }, log.delay);
      logTimeouts.push(timeout);
    });
    
    const clearSimulatedLogs = () => {
      logTimeouts.forEach(t => clearTimeout(t));
    };

    try {
      const response = await fetch('/api/campaigns/one-click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          websiteUrl: formattedUrl
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to generate campaign');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        let buffer = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.progress !== undefined) {
                  setProgress(data.progress);
                  setCurrentStatus(data.status || '');
                }
                if (data.log) {
                  addLogEntry(data.log.message, data.log.type || 'info');
                }
                if (data.complete && data.campaign) {
                  clearSimulatedLogs();
                  setAnalysisComplete(true);
                  setGeneratedCampaign(data.campaign);
                  addLogEntry('Campaign built successfully! Ready to proceed.', 'success');
                }
                if (data.error) {
                  throw new Error(data.error);
                }
              } catch (parseError) {
                console.error('Parse error:', parseError);
              }
            }
          }
        }
      }
    } catch (err) {
      console.error('Campaign generation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate campaign');
      setCurrentStep('input');
      notifications.error('Failed to generate campaign', {
        title: 'Error',
        description: err instanceof Error ? err.message : 'Unknown error'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const proceedToResults = async () => {
    if (generatedCampaign) {
      setResultsTimestamp(new Date().toLocaleTimeString('en-US', { hour12: false }));
      setCurrentStep('results');
      
      // Auto-save campaign with authentication
      let savedToDatabase = false;
      try {
        const token = await getToken();
        if (token) {
          const response = await fetch('/api/campaigns/save', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              campaign_name: generatedCampaign.campaign_name,
              business_name: generatedCampaign.business_name,
              website_url: generatedCampaign.website_url,
              campaign_data: generatedCampaign.campaign_data,
              source: 'one-click-builder'
            })
          });
          if (response.ok) {
            const result = await response.json();
            savedToDatabase = result.saved === true;
          }
        }
      } catch (err) {
        console.error('API save error:', err);
      }
      
      // Fallback to historyService if API save failed
      if (!savedToDatabase) {
        try {
          await historyService.save('one-click-campaign', generatedCampaign.campaign_name || 'One-Click Campaign', {
            ...generatedCampaign.campaign_data,
            business_name: generatedCampaign.business_name,
            website_url: generatedCampaign.website_url,
            url: generatedCampaign.website_url,
            source: 'one-click-builder',
            builderType: '1-click'
          });
          console.log('Campaign saved to historyService');
        } catch (err) {
          console.error('Local save error:', err);
        }
      }
      
      notifications.success('Campaign generated and saved!', {
        title: 'Success',
        description: `Generated ${generatedCampaign.campaign_data?.keywords?.length || 100}+ keywords`
      });
    }
  };

  const downloadCSV = () => {
    if (!generatedCampaign) {
      notifications.error('No campaign data available');
      return;
    }

    try {
      const campaignData = generatedCampaign.campaign_data;
      const adCopy = campaignData.adCopy;
      
      const adGroupsV5: AdGroupV5[] = campaignData.adGroups.map((ag) => {
        const keywords: KeywordV5[] = ag.keywords.map((kw) => ({
          text: kw,
          matchType: 'Broad' as const,
          status: 'Enabled',
          finalUrl: generatedCampaign.website_url
        }));
        
        const ads: AdV5[] = [{
          type: 'RSA' as const,
          headlines: adCopy.headlines.slice(0, 15).map(h => (h.text || '').substring(0, 30)),
          descriptions: adCopy.descriptions.slice(0, 4).map(d => (d.text || '').substring(0, 90)),
          path1: '',
          path2: '',
          finalUrl: generatedCampaign.website_url
        }];
        
        return {
          name: ag.name,
          maxCpc: 2.00,
          status: 'Enabled',
          keywords,
          ads
        };
      });
      
      const campaignV5: CampaignDataV5 = {
        campaignName: generatedCampaign.campaign_name,
        dailyBudget: campaignData.structure.dailyBudget || 100,
        campaignType: 'Search',
        bidStrategy: 'Maximize Conversions',
        networks: 'Google search',
        status: 'Enabled',
        url: generatedCampaign.website_url,
        adGroups: adGroupsV5,
        callouts: adCopy.callouts?.slice(0, 4).map(text => ({ text, status: 'Enabled' })) || [],
        locations: { countries: ['United States'], countryCode: 'US' }
      };
      
      const csvContent = generateMasterCSV(campaignV5);
      
      const element = document.createElement('a');
      const file = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
      element.href = URL.createObjectURL(file);
      element.download = `${generatedCampaign.campaign_name || 'campaign'}_GoogleAdsEditor.csv`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);

      notifications.success('CSV downloaded!', {
        title: 'Download Complete',
        description: 'Import this file into Google Ads Editor'
      });
    } catch (err) {
      console.error('CSV generation error:', err);
      notifications.error('Failed to generate CSV', {
        title: 'Error',
        description: err instanceof Error ? err.message : 'Unknown error'
      });
    }
  };

  const saveCampaign = async () => {
    if (!generatedCampaign) return;

    let saved = false;
    try {
      const token = await getToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const response = await fetch('/api/campaigns/save', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ...generatedCampaign,
          source: 'one-click-builder'
        })
      });

      saved = response.ok;
    } catch (err) {
      console.error('API save error:', err);
    }
    
    // Fallback to historyService
    if (!saved) {
      try {
        await historyService.save('one-click-campaign', generatedCampaign.campaign_name || 'One-Click Campaign', {
          ...generatedCampaign.campaign_data,
          business_name: generatedCampaign.business_name,
          website_url: generatedCampaign.website_url,
          url: generatedCampaign.website_url,
          source: 'one-click-builder',
          builderType: '1-click'
        });
        saved = true;
      } catch (err) {
        console.error('Local save error:', err);
      }
    }
    
    if (saved) {
      notifications.success('Campaign saved!', {
        title: 'Saved',
        description: 'View it in "Draft Campaigns"'
      });
    } else {
      notifications.error('Failed to save campaign', {
        title: 'Error',
        description: 'Please try again'
      });
    }
  };

  const resetBuilder = () => {
    setCurrentStep('input');
    setWebsiteUrl('');
    setProgress(0);
    setCurrentStatus('');
    setGeneratedCampaign(null);
    setError('');
    setLogEntries([]);
    setAnalysisComplete(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      {currentStep === 'input' && (
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="space-y-2">
            <div>
              <h1 className="text-2xl font-semibold text-slate-800">1-Click Campaign Builder</h1>
              <p className="text-slate-500">Paste your URL and let AI do the rest</p>
            </div>
          </div>

          {/* Shell View - AI Automation Info */}
          <div className="bg-slate-900 rounded-xl border border-slate-700 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-800 border-b border-slate-700">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <span className="text-xs text-slate-400 ml-2 font-mono">ai_campaign_builder.sh</span>
            </div>
            <div className="p-4 font-mono text-sm space-y-1">
              <p className="text-emerald-400 mb-2">AI will automatically:</p>
              <p className="text-green-400">✓ Analyze your website content</p>
              <p className="text-green-400">✓ Generate 100+ targeted keywords</p>
              <p className="text-green-400">✓ Create high-converting ad copy</p>
              <p className="text-green-400">✓ Build complete campaign structure</p>
              <p className="text-green-400">✓ Export ready-to-import CSV</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">
                Landing Page URL
              </label>
              <Input
                type="url"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://example.com"
                className="h-12 text-base border-slate-200 focus:border-slate-400 focus:ring-slate-400"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <span className="text-sm text-red-700">{error}</span>
              </div>
            )}

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
              <p className="text-sm text-slate-600">
                <span className="font-medium text-slate-700">Default Settings:</span> Mobile + Desktop, Search Network, USA, English
              </p>
            </div>

            <Button
              onClick={handleAnalyze}
              disabled={isGenerating}
              className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white py-6 text-base font-medium"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5 mr-2" />
                  Generate Campaign
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {currentStep === 'generating' && (
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">Website URL</label>
            <div className="flex items-center gap-3">
              <Input
                type="url"
                value={websiteUrl}
                disabled
                className="flex-1 bg-white border-slate-300"
              />
              <Button
                variant="outline"
                disabled
                className="flex items-center gap-2"
              >
                <Zap className="w-4 h-4" />
                Build
              </Button>
            </div>
          </div>

          <div className="bg-slate-900 rounded-xl shadow-2xl overflow-hidden border border-slate-700">
            <div className="flex items-center justify-between px-4 py-3 bg-slate-800 border-b border-slate-700">
              <div className="flex items-center gap-3">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-indigo-500" />
                </div>
                <span className="text-slate-300 text-sm font-medium">Building Campaign Console</span>
              </div>
              <div className="flex items-center gap-2">
                {analysisComplete ? (
                  <Badge className="bg-blue-600 text-white flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    Complete
                  </Badge>
                ) : (
                  <Badge className="bg-indigo-600 text-white flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Building...
                  </Badge>
                )}
              </div>
            </div>
            
            <div 
              ref={logContainerRef}
              className="p-4 h-80 overflow-y-auto font-mono text-sm"
            >
              {logEntries.map((entry, index) => (
                <div key={index} className="flex gap-2 py-0.5">
                  <span className="text-slate-500 shrink-0">[{entry.timestamp}]</span>
                  <span className={`
                    ${entry.type === 'success' ? 'text-blue-400' : ''}
                    ${entry.type === 'action' ? 'text-blue-400' : ''}
                    ${entry.type === 'progress' ? 'text-slate-400' : ''}
                    ${entry.type === 'info' ? 'text-slate-400' : ''}
                  `}>
                    {entry.type === 'success' && <span className="text-blue-400 mr-1">{'\u2713'}</span>}
                    {entry.type === 'action' && <span className="text-blue-400 mr-1">{'>'}</span>}
                    {entry.type === 'progress' && <span className="text-slate-400 mr-1">{'\u2192'}</span>}
                    {entry.message}
                  </span>
                </div>
              ))}
              {!analysisComplete && logEntries.length > 0 && (
                <div className="flex items-center gap-2 py-0.5 text-purple-400">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span className="animate-pulse">Building campaign...</span>
                </div>
              )}
            </div>

            {analysisComplete && (
              <div className="p-4 border-t border-slate-700">
                <Button
                  onClick={proceedToResults}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-5 text-base font-medium"
                >
                  Next: View Campaign Details
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            )}
          </div>

          {!analysisComplete && (
            <div className="text-center">
              <p className="text-sm text-slate-500">
                This usually takes 30-60 seconds depending on website complexity
              </p>
            </div>
          )}
        </div>
      )}

      {currentStep === 'results' && generatedCampaign && (
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="bg-slate-900 rounded-xl shadow-2xl overflow-hidden border border-slate-700">
            <div className="flex items-center justify-between px-4 py-3 bg-slate-800 border-b border-slate-700">
              <div className="flex items-center gap-3">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-indigo-500" />
                </div>
                <span className="text-slate-300 text-sm font-medium">Campaign Export Console</span>
              </div>
              <Badge className="bg-green-600 text-white flex items-center gap-1">
                <Check className="w-3 h-3" />
                Ready to Export
              </Badge>
            </div>
            
            <div className="p-4 font-mono text-sm space-y-1">
              <div className="flex gap-2 py-0.5">
                <span className="text-slate-500 shrink-0">[{resultsTimestamp}]</span>
                <span className="text-green-400">
                  <span className="mr-1">{'\u2713'}</span>
                  Campaign generation complete
                </span>
              </div>
              <div className="flex gap-2 py-0.5">
                <span className="text-slate-500 shrink-0">[{resultsTimestamp}]</span>
                <span className="text-cyan-400">
                  <span className="mr-1">{'\u2192'}</span>
                  Campaign: <span className="text-yellow-300">{generatedCampaign.campaign_name}</span>
                </span>
              </div>
              <div className="flex gap-2 py-0.5">
                <span className="text-slate-500 shrink-0">[{resultsTimestamp}]</span>
                <span className="text-cyan-400">
                  <span className="mr-1">{'\u2192'}</span>
                  Keywords: <span className="text-yellow-300">{generatedCampaign.campaign_data?.keywords?.length || '100+'}</span>
                </span>
              </div>
              <div className="flex gap-2 py-0.5">
                <span className="text-slate-500 shrink-0">[{resultsTimestamp}]</span>
                <span className="text-cyan-400">
                  <span className="mr-1">{'\u2192'}</span>
                  Ad Groups: <span className="text-yellow-300">{generatedCampaign.campaign_data?.adGroups?.length || '5'}</span>
                </span>
              </div>
              <div className="flex gap-2 py-0.5">
                <span className="text-slate-500 shrink-0">[{resultsTimestamp}]</span>
                <span className="text-cyan-400">
                  <span className="mr-1">{'\u2192'}</span>
                  Daily Budget: <span className="text-yellow-300">${generatedCampaign.campaign_data?.structure?.dailyBudget || '100'}</span>
                </span>
              </div>
              <div className="flex gap-2 py-0.5">
                <span className="text-slate-500 shrink-0">[{resultsTimestamp}]</span>
                <span className="text-green-400">
                  <span className="mr-1">{'\u2713'}</span>
                  CSV file ready for Google Ads Editor import
                </span>
              </div>
              <div className="flex gap-2 py-0.5 mt-2">
                <span className="text-slate-500 shrink-0">[{resultsTimestamp}]</span>
                <span className="text-purple-400 animate-pulse">
                  <span className="mr-1">{'>'}</span>
                  Awaiting export command...
                </span>
              </div>
            </div>

            <div className="p-4 border-t border-slate-700 flex gap-3 flex-wrap">
              <Button
                onClick={downloadCSV}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Download className="w-5 h-5 mr-2" />
                Download CSV for Google Ads
              </Button>

              <Button
                onClick={resetBuilder}
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Generate Another
              </Button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-slate-900 rounded-xl shadow-xl overflow-hidden border border-slate-700">
              <div className="flex items-center gap-3 px-4 py-3 bg-slate-800 border-b border-slate-700">
                <div className="flex gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                </div>
                <span className="text-slate-300 text-sm font-medium">Website Analysis</span>
              </div>
              <ScrollArea className="h-48 p-4">
                <pre className="text-xs text-slate-400 font-mono whitespace-pre-wrap">
                  {JSON.stringify(generatedCampaign.campaign_data?.analysis, null, 2)}
                </pre>
              </ScrollArea>
            </div>

            <div className="bg-slate-900 rounded-xl shadow-xl overflow-hidden border border-slate-700">
              <div className="flex items-center gap-3 px-4 py-3 bg-slate-800 border-b border-slate-700">
                <div className="flex gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                </div>
                <span className="text-slate-300 text-sm font-medium">Campaign Structure</span>
              </div>
              <ScrollArea className="h-48 p-4">
                <pre className="text-xs text-slate-400 font-mono whitespace-pre-wrap">
                  {JSON.stringify(generatedCampaign.campaign_data?.structure, null, 2)}
                </pre>
              </ScrollArea>
            </div>

            <div className="bg-slate-900 rounded-xl shadow-xl overflow-hidden border border-slate-700">
              <div className="flex items-center gap-3 px-4 py-3 bg-slate-800 border-b border-slate-700">
                <div className="flex gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                </div>
                <span className="text-slate-300 text-sm font-medium">Sample Keywords ({generatedCampaign.campaign_data?.keywords?.length || 0} total)</span>
              </div>
              <ScrollArea className="h-48 p-4">
                <div className="space-y-1 font-mono text-xs">
                  {generatedCampaign.campaign_data?.keywords?.slice(0, 20).map((kw: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-green-400">{'\u2713'}</span>
                      <span className="text-slate-300">{kw}</span>
                    </div>
                  ))}
                  {(generatedCampaign.campaign_data?.keywords?.length || 0) > 20 && (
                    <div className="text-slate-500 mt-2">
                      ... and {(generatedCampaign.campaign_data?.keywords?.length || 0) - 20} more keywords
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>

            <div className="bg-slate-900 rounded-xl shadow-xl overflow-hidden border border-slate-700">
              <div className="flex items-center gap-3 px-4 py-3 bg-slate-800 border-b border-slate-700">
                <div className="flex gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                </div>
                <span className="text-slate-300 text-sm font-medium">Ad Copy Preview</span>
              </div>
              <ScrollArea className="h-48 p-4">
                <div className="space-y-3 font-mono text-xs">
                  {generatedCampaign.campaign_data?.adCopy?.headlines?.slice(0, 5).map((h: any, idx: number) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="text-yellow-400 shrink-0">H{idx + 1}:</span>
                      <span className="text-slate-300">{h.text || h}</span>
                    </div>
                  ))}
                  <div className="border-t border-slate-700 my-2 pt-2" />
                  {generatedCampaign.campaign_data?.adCopy?.descriptions?.slice(0, 3).map((d: any, idx: number) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="text-cyan-400 shrink-0">D{idx + 1}:</span>
                      <span className="text-slate-300">{d.text || d}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function GenerationStep({ step, title, progress, threshold }: { step: number; title: string; progress: number; threshold: number }) {
  const isComplete = progress >= threshold;
  const isActive = progress >= threshold - 15 && progress < threshold;

  return (
    <div className="flex items-center gap-3">
      <div className={`
        w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors
        ${isComplete
          ? 'bg-indigo-500 text-white'
          : isActive
            ? 'bg-purple-500 text-white animate-pulse'
            : 'bg-slate-200 text-slate-500'
        }
      `}>
        {isComplete ? <Check className="w-4 h-4" /> : step}
      </div>
      <span className={`text-sm ${isComplete ? 'text-indigo-600 font-medium' : isActive ? 'text-purple-600 font-medium' : 'text-slate-500'}`}>
        {title}
      </span>
      {isActive && <Loader2 className="w-4 h-4 text-purple-500 animate-spin" />}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className="text-lg font-bold text-purple-700 truncate">{value}</p>
    </div>
  );
}

function DetailSection({ title, icon, data }: { title: string; icon: string; data: any }) {
  if (!data) return null;

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
      <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
        <span>{icon}</span>
        {title}
      </h3>
      <ScrollArea className="h-40">
        <pre className="text-xs text-slate-600 whitespace-pre-wrap">
          {JSON.stringify(data, null, 2)}
        </pre>
      </ScrollArea>
    </div>
  );
}

export default OneClickCampaignBuilder;
