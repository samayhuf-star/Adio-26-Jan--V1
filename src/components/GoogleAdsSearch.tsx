import { useState, useEffect } from 'react';
import { Search, Clock, CheckCircle, AlertCircle, RefreshCw, Plus, FolderOpen, Trash2, Eye, Link2, Globe, MapPin, Calendar, Image as ImageIcon, ExternalLink } from 'lucide-react';
import { TerminalCard, TerminalLine } from './ui/terminal-card';

interface GoogleAdsSearchProps {
  user: any;
}

interface SearchRequest {
  id: number;
  keywords: string[];
  name: string | null;
  status: string;
  created_at: string;
  processed_at: string | null;
  result_count: number;
}

interface AdData {
  success: boolean;
  advertiserId: string;
  creativeId: string;
  firstShown: string | null;
  lastShown: string | null;
  format: string;
  url: string;
  creativeRegions: { regionCode: string; regionName: string }[];
  regionStats: any[];
  variations: {
    destinationUrl: string;
    headline: string;
    description: string;
    allText?: string;
    imageUrl?: string;
  }[];
}

export function GoogleAdsSearch({ user }: GoogleAdsSearchProps) {
  const [activeTab, setActiveTab] = useState<'new' | 'url' | 'saved'>('url');
  const [searchName, setSearchName] = useState('');
  const [keywords, setKeywords] = useState<string[]>(['']);
  const [dateRange, setDateRange] = useState('30');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [searchStatus, setSearchStatus] = useState<'idle' | 'pending' | 'processing' | 'completed' | 'failed'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [requestId, setRequestId] = useState<number | null>(null);
  const [previousRequests, setPreviousRequests] = useState<SearchRequest[]>([]);
  const [adUrl, setAdUrl] = useState('');
  const [adData, setAdData] = useState<AdData | null>(null);

  useEffect(() => {
    fetchPreviousRequests();
  }, []);

  const fetchPreviousRequests = async () => {
    try {
      const response = await fetch('/api/google-ads/requests');
      const data = await response.json();
      setPreviousRequests(data.requests || []);
    } catch (err) {
      console.error('Failed to fetch previous requests:', err);
    }
  };

  const addKeyword = () => {
    if (keywords.length < 5) {
      setKeywords([...keywords, '']);
    }
  };

  const removeKeyword = (index: number) => {
    if (keywords.length > 1) {
      setKeywords(keywords.filter((_, i) => i !== index));
    }
  };

  const updateKeyword = (index: number, value: string) => {
    const updated = [...keywords];
    updated[index] = value;
    setKeywords(updated);
  };

  const searchKeywords = async () => {
    const validKeywords = keywords.filter(k => k.trim().length > 0);
    if (validKeywords.length === 0) {
      setError('Please enter at least one keyword');
      return;
    }

    setLoading(true);
    setError('');
    setResults([]);
    setSearchStatus('processing');
    setStatusMessage('Searching for ads via RapidAPI...');

    try {
      // Use RapidAPI for instant results
      const response = await fetch('/api/google-ads/search-advertiser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: validKeywords.join(' ')
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.error || 'Failed to search ads');
        setSearchStatus('failed');
        return;
      }

      // Transform RapidAPI results to our format
      const transformedResults = (data.data?.ads || []).map((ad: any) => ({
        advertiser: ad.advertiserName || ad.advertiserId || 'Unknown Advertiser',
        headline: ad.headline || ad.title || '',
        description: ad.description || ad.bodyText || '',
        destination_url: ad.destinationUrl || ad.landingPage || '',
        platform: 'Google Ads',
        ad_format: ad.format || 'Text',
        region: ad.regions?.join(', ') || 'Multiple Regions',
        imageUrl: ad.imageUrl || null,
        firstShown: ad.firstShown,
        lastShown: ad.lastShown
      }));

      setResults(transformedResults);
      setSearchStatus('completed');
      setStatusMessage(`Found ${transformedResults.length} ads`);

    } catch (err: any) {
      setError(err.message || 'Failed to search ads');
      setSearchStatus('failed');
    } finally {
      setLoading(false);
    }
  };

  const checkRequestStatus = async (id: number) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/google-ads/search/${id}`);
      const data = await response.json();

      setSearchStatus(data.status || 'pending');
      setStatusMessage(data.errorMessage || '');
      setRequestId(id);

      if (data.status === 'completed' && data.results) {
        setResults(data.results);
        setKeywords(data.keywords || ['']);
        setActiveTab('new');
      } else if (data.status === 'failed') {
        setError(data.errorMessage || 'Search failed');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to check status');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = () => {
    switch (searchStatus) {
      case 'pending':
        return <Clock className="w-6 h-6 text-yellow-500" />;
      case 'processing':
        return <RefreshCw className="w-6 h-6 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'failed':
        return <AlertCircle className="w-6 h-6 text-red-500" />;
      default:
        return null;
    }
  };

  const fetchAdByUrl = async () => {
    if (!adUrl.trim()) {
      setError('Please enter a Google Ads Transparency URL');
      return;
    }

    if (!adUrl.includes('adstransparency.google.com')) {
      setError('Please enter a valid Google Ads Transparency Center URL');
      return;
    }

    setLoading(true);
    setError('');
    setAdData(null);

    try {
      const response = await fetch('/api/google-ads/fetch-ad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adUrl: adUrl.trim() }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.error || 'Failed to fetch ad data');
        return;
      }

      setAdData(data.data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch ad data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <Search className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Google Ads Search</h2>
            <p className="text-sm text-gray-600">Research competitor ads from Google Ads Transparency Center</p>
          </div>
        </div>
      </div>

      {/* Terminal-Style Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TerminalCard title="Search Statistics" showDots={true} variant="compact">
          <div className="space-y-1.5">
            <TerminalLine prefix="$" label="keywords:" value={`${keywords.filter(k => k.trim()).length}/5`} valueColor="cyan" />
            <TerminalLine prefix="$" label="results:" value={`${results.length}`} valueColor="green" />
            <TerminalLine prefix="$" label="saved_searches:" value={`${previousRequests.length}`} valueColor="yellow" />
            <TerminalLine prefix="$" label="active_tab:" value={activeTab.toUpperCase()} valueColor="purple" />
          </div>
        </TerminalCard>

        <TerminalCard title="Request Status" showDots={true} variant="compact">
          <div className="space-y-1.5">
            <TerminalLine prefix=">" label="status:" value={searchStatus.toUpperCase()} valueColor={searchStatus === 'completed' ? 'green' : searchStatus === 'failed' ? 'yellow' : searchStatus === 'processing' ? 'cyan' : 'slate'} />
            <TerminalLine prefix=">" label="ad_data:" value={adData ? 'LOADED' : 'NONE'} valueColor={adData ? 'green' : 'slate'} />
            <TerminalLine prefix=">" label="date_range:" value={`${dateRange} DAYS`} valueColor="cyan" />
            <TerminalLine prefix=">" label="api:" value={loading ? 'FETCHING...' : 'READY'} valueColor={loading ? 'yellow' : 'green'} />
          </div>
        </TerminalCard>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('url')}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 font-medium transition-colors ${
              activeTab === 'url'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Link2 className="w-4 h-4" />
            URL Lookup
          </button>
          <button
            onClick={() => setActiveTab('new')}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 font-medium transition-colors ${
              activeTab === 'new'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Plus className="w-4 h-4" />
            Keyword Search
          </button>
          <button
            onClick={() => setActiveTab('saved')}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 font-medium transition-colors ${
              activeTab === 'saved'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <FolderOpen className="w-4 h-4" />
            History
            {previousRequests.length > 0 && (
              <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-600">
                {previousRequests.length}
              </span>
            )}
          </button>
        </div>

        {/* URL Lookup Tab */}
        {activeTab === 'url' && (
          <div className="p-6">
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Google Ads Transparency URL</label>
              <input
                type="text"
                value={adUrl}
                onChange={(e) => setAdUrl(e.target.value)}
                placeholder="https://adstransparency.google.com/advertiser/AR.../creative/CR..."
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Paste a URL from Google Ads Transparency Center</p>
            </div>

            <button
              onClick={fetchAdByUrl}
              disabled={loading}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Fetching Ad Data...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Fetch Ad Details
                </>
              )}
            </button>

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-800 mb-2">How to use URL Lookup</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>1. Visit <a href="https://adstransparency.google.com" target="_blank" rel="noopener noreferrer" className="underline">adstransparency.google.com</a></li>
                <li>2. Search for an advertiser or browse ads</li>
                <li>3. Click on any ad to view its details</li>
                <li>4. Copy the URL from your browser and paste it above</li>
                <li>5. Get instant access to headlines, descriptions, regions, and more!</li>
              </ul>
            </div>
          </div>
        )}

        {/* New Search Tab */}
        {activeTab === 'new' && (
          <div className="p-6">
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Search Keywords</label>
              <p className="text-xs text-gray-500 mb-3">Enter keywords to find competitor ads (e.g., "plumber near me", "best coffee shop")</p>
              
              <div className="space-y-3">
                {keywords.map((keyword, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <input
                      type="text"
                      value={keyword}
                      onChange={(e) => updateKeyword(index, e.target.value)}
                      placeholder={`Keyword ${index + 1}`}
                      className="flex-1 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      onKeyDown={(e) => e.key === 'Enter' && searchKeywords()}
                    />
                    {keywords.length > 1 && (
                      <button
                        onClick={() => removeKeyword(index)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}

                {keywords.length < 5 && (
                  <button
                    onClick={addKeyword}
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Add another keyword
                  </button>
                )}
              </div>
            </div>

            <button
              onClick={searchKeywords}
              disabled={loading}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Search Competitor Ads
                </>
              )}
            </button>

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* Info Box */}
            <div className="mt-6 bg-indigo-50 border border-indigo-200 rounded-lg p-4">
              <h4 className="font-medium text-green-800 mb-2">Instant Results via RapidAPI</h4>
              <ul className="text-sm text-indigo-700 space-y-1">
                <li>• Enter keywords to search for competitor ads</li>
                <li>• Get instant results from Google Ads Transparency Center</li>
                <li>• View headlines, descriptions, and landing pages</li>
                <li>• See which regions ads are targeting</li>
                <li>• Research competitor ad strategies in real-time</li>
              </ul>
            </div>
          </div>
        )}

        {/* Saved Searches Tab */}
        {activeTab === 'saved' && (
          <div className="p-6">
            <h3 className="font-semibold mb-4">Your Saved Searches</h3>
            
            {previousRequests.length === 0 ? (
              <div className="text-center py-12">
                <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No saved searches yet</p>
                <p className="text-sm text-gray-400 mt-1">Your search history will appear here</p>
                <button
                  onClick={() => setActiveTab('new')}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Start a New Search
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {previousRequests.map((req) => (
                  <div
                    key={req.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 border border-gray-200"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{req.name || req.keywords.join(', ')}</p>
                      {req.name && (
                        <p className="text-sm text-gray-600 mt-0.5">{req.keywords.join(', ')}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(req.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                        req.status === 'completed' ? 'bg-indigo-100 text-indigo-700' :
                        req.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        req.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {req.status === 'completed' ? 'Completed' :
                         req.status === 'pending' ? 'Pending' :
                         req.status === 'processing' ? 'Processing' : 'Failed'}
                      </span>
                      {req.status === 'completed' && (
                        <span className="text-sm text-gray-600">{req.result_count} results</span>
                      )}
                      <button
                        onClick={() => checkRequestStatus(req.id)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="View Results"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Status Message - Shows when search is pending/processing */}
      {activeTab === 'new' && searchStatus !== 'idle' && searchStatus !== 'completed' && (
        <div className={`p-6 rounded-lg border ${
          searchStatus === 'pending' ? 'bg-yellow-50 border-yellow-200' :
          searchStatus === 'processing' ? 'bg-blue-50 border-blue-200' :
          'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-start gap-4">
            {getStatusIcon()}
            <div>
              <h3 className={`font-semibold ${
                searchStatus === 'pending' ? 'text-yellow-800' :
                searchStatus === 'processing' ? 'text-blue-800' :
                'text-red-800'
              }`}>
                {searchStatus === 'pending' && 'Search Request Queued'}
                {searchStatus === 'processing' && 'Processing Your Search'}
                {searchStatus === 'failed' && 'Search Failed'}
              </h3>
              <p className={`mt-1 text-sm ${
                searchStatus === 'pending' ? 'text-yellow-700' :
                searchStatus === 'processing' ? 'text-blue-700' :
                'text-red-700'
              }`}>
                {statusMessage || (
                  searchStatus === 'pending' 
                    ? 'Your search is queued for processing. Check back in about 1 hour for results.'
                    : searchStatus === 'processing'
                    ? 'Your search is currently being processed. Results will be available shortly.'
                    : 'There was an error processing your search.'
                )}
              </p>
              {requestId && searchStatus !== 'failed' && (
                <button
                  onClick={() => checkRequestStatus(requestId)}
                  className="mt-3 px-4 py-2 bg-white border rounded-lg text-sm hover:bg-gray-50 flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Check Status
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Ad Data from URL Lookup */}
      {adData && (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="p-6 border-b bg-gradient-to-r from-green-50 to-blue-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Ad Details Retrieved</h3>
                  <p className="text-sm text-gray-600">Data from Google Ads Transparency Center</p>
                </div>
              </div>
              <a 
                href={adData.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 flex items-center gap-1"
              >
                <ExternalLink className="w-4 h-4" />
                View Original
              </a>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Ad Info Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Format</p>
                <p className="font-semibold text-gray-900 capitalize">{adData.format || 'Text'}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Advertiser ID</p>
                <p className="font-mono text-sm text-gray-900">{adData.advertiserId}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Creative ID</p>
                <p className="font-mono text-sm text-gray-900">{adData.creativeId}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Last Shown</p>
                <p className="text-sm text-gray-900">
                  {adData.lastShown ? new Date(adData.lastShown).toLocaleDateString() : 'Unknown'}
                </p>
              </div>
            </div>

            {/* Regions */}
            {adData.creativeRegions && adData.creativeRegions.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-blue-600" />
                  Target Regions
                </h4>
                <div className="flex flex-wrap gap-2">
                  {adData.creativeRegions.map((region, idx) => (
                    <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">
                      {region.regionName}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Ad Variations */}
            {adData.variations && adData.variations.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3">
                  Ad Variations ({adData.variations.length})
                </h4>
                <div className="space-y-4">
                  {adData.variations.map((variation, idx) => (
                    <div key={idx} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-start gap-4">
                        {variation.imageUrl && (
                          <div className="flex-shrink-0">
                            <img 
                              src={variation.imageUrl} 
                              alt="Ad preview" 
                              className="w-24 h-24 object-cover rounded border"
                              onError={(e) => (e.currentTarget.style.display = 'none')}
                            />
                          </div>
                        )}
                        <div className="flex-1 space-y-2">
                          {variation.headline && (
                            <div>
                              <p className="text-xs text-gray-500 mb-0.5">Headline</p>
                              <p className="font-semibold text-blue-600">{variation.headline}</p>
                            </div>
                          )}
                          {variation.description && (
                            <div>
                              <p className="text-xs text-gray-500 mb-0.5">Description</p>
                              <p className="text-sm text-gray-700">{variation.description}</p>
                            </div>
                          )}
                          {variation.destinationUrl && (
                            <div>
                              <p className="text-xs text-gray-500 mb-0.5">Landing URL</p>
                              <a 
                                href={`https://${variation.destinationUrl}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:underline break-all"
                              >
                                {variation.destinationUrl}
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Results - Ads by Advertiser */}
      {results.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Competitor Ads ({results.length})</h3>
            <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-full flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              Live Data from Google Ads Transparency
            </span>
          </div>

          {/* Group ads by advertiser */}
          {Object.entries(
            results.reduce((acc: { [key: string]: any[] }, result) => {
              const advertiser = result.advertiser || 'Unknown Advertiser';
              if (!acc[advertiser]) acc[advertiser] = [];
              acc[advertiser].push(result);
              return acc;
            }, {})
          ).map(([advertiser, ads]) => (
            <div key={advertiser} className="bg-white rounded-lg shadow-sm border p-6">
              <div className="mb-4 pb-4 border-b">
                <h4 className="text-lg font-semibold text-gray-900">{advertiser}</h4>
                <p className="text-sm text-gray-600">{ads.length} ad{ads.length > 1 ? 's' : ''}</p>
              </div>

              <div className="space-y-4">
                {ads.map((ad, idx) => (
                  <div key={idx} className="p-4 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors border border-gray-200">
                    <div className="grid gap-3">
                      {ad.headline && (
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Headline</p>
                          <p className="text-base font-medium text-gray-900">{ad.headline}</p>
                        </div>
                      )}
                      {ad.description && (
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Description</p>
                          <p className="text-sm text-gray-700">{ad.description}</p>
                        </div>
                      )}
                      {ad.destination_url && (
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Landing URL</p>
                          <a href={ad.destination_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 hover:underline text-sm break-all">
                            {ad.destination_url}
                          </a>
                        </div>
                      )}
                      <div className="flex gap-4 mt-2">
                        {ad.platform && (
                          <span className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded">
                            {ad.platform}
                          </span>
                        )}
                        {ad.ad_format && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                            {ad.ad_format}
                          </span>
                        )}
                        {ad.region && (
                          <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded">
                            {ad.region}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
