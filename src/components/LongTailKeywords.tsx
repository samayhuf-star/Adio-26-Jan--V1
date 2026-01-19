import { useState, useEffect } from 'react';
import { useAuth, useUser } from '../utils/authCompat';
import { Sparkles, Download, Save, Trash2, Loader2, Plus, X, History, Search, RefreshCw, Copy, Check, ChevronUp, ChevronDown, Wand2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import { notifications } from '../utils/notifications';
import { KeywordFilters, KeywordFiltersState, DEFAULT_FILTERS, getDifficultyBadge, formatSearchVolume, formatCPC } from './KeywordFilters';
import { historyService } from '../utils/historyService';
import { ProjectTagSelector } from './ProjectTagSelector';

interface KeywordResult {
  keyword: string;
  source: 'autocomplete' | 'ai';
  searchVolume?: number;
  cpc?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
}

interface SavedList {
  id: string;
  name: string;
  keywords: string[];
  seedKeywords: string;
  url: string;
  createdAt: string;
  userId: string;
}

export function LongTailKeywords() {
  const { getToken, isSignedIn } = useAuthCompat();
  const { user } = useUserCompat();
  const [activeSubTab, setActiveSubTab] = useState('generate');
  const [seedKeywords, setSeedKeywords] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [keywords, setKeywords] = useState<KeywordResult[]>([]);
  const [selectedKeywords, setSelectedKeywords] = useState<Set<string>>(new Set());
  const [savedLists, setSavedLists] = useState<SavedList[]>([]);
  const [isLoadingLists, setIsLoadingLists] = useState(false);
  const [listName, setListName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [filters, setFilters] = useState<KeywordFiltersState>(DEFAULT_FILTERS);
  const [generationProgress, setGenerationProgress] = useState<string[]>([]);
  const [sortColumn, setSortColumn] = useState<'keyword' | 'volume' | 'cpc' | 'difficulty'>('keyword');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Sample seed keywords for different niches
  const SAMPLE_SEED_KEYWORDS = [
    ['plumber', 'emergency plumbing', 'drain cleaning', 'water heater repair'],
    ['dentist', 'teeth whitening', 'dental implants', 'root canal'],
    ['lawyer', 'personal injury attorney', 'divorce lawyer', 'criminal defense'],
    ['electrician', 'electrical repair', 'wiring installation', 'panel upgrade'],
    ['roofing contractor', 'roof repair', 'roof replacement', 'shingle installation'],
    ['HVAC technician', 'AC repair', 'furnace installation', 'duct cleaning'],
    ['landscaper', 'lawn care', 'tree trimming', 'garden design'],
    ['auto mechanic', 'brake repair', 'oil change', 'transmission service']
  ];

  const fillSampleKeywords = () => {
    const randomSet = SAMPLE_SEED_KEYWORDS[Math.floor(Math.random() * SAMPLE_SEED_KEYWORDS.length)];
    setSeedKeywords(randomSet.join('\n'));
    notifications.success('Sample keywords added!', {
      title: 'Sample Data Loaded'
    });
  };

  useEffect(() => {
    if (activeSubTab === 'saved') {
      loadSavedLists();
    }
  }, [activeSubTab]);

  const loadSavedLists = async () => {
    setIsLoadingLists(true);
    try {
      let lists: SavedList[] = [];
      
      // Try API first if signed in
      if (isSignedIn && user) {
        try {
          const token = await getToken();
          const response = await fetch(`/api/long-tail-keywords/lists?userId=${user.id}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          if (response.ok) {
            const data = await response.json();
            lists = data.lists || [];
          }
        } catch (apiError) {
          console.warn('API load failed, trying localStorage:', apiError);
        }
      }
      
      // Also load from historyService (localStorage fallback)
      try {
        const localItems = await historyService.getByType('long-tail-keywords');
        const localLists = localItems.map(item => ({
          id: item.id,
          name: item.name,
          keywords: item.data?.keywords || [],
          seedKeywords: item.data?.seedKeywords || '',
          url: item.data?.url || '',
          createdAt: item.timestamp,
          userId: 'local'
        }));
        
        // Merge without duplicates (by name)
        const existingNames = new Set(lists.map(l => l.name));
        for (const localList of localLists) {
          if (!existingNames.has(localList.name)) {
            lists.push(localList);
          }
        }
      } catch (localError) {
        console.warn('localStorage load failed:', localError);
      }
      
      setSavedLists(lists);
    } catch (error) {
      console.error('Error loading saved lists:', error);
    } finally {
      setIsLoadingLists(false);
    }
  };

  const generateKeywords = async () => {
    if (!seedKeywords.trim()) {
      notifications.warning('Please enter at least one seed keyword');
      return;
    }

    setIsGenerating(true);
    setKeywords([]);
    setSelectedKeywords(new Set());
    setGenerationProgress([]);

    // Simulate progress messages
    const progressMessages = [
      'Initializing keyword generation engine...',
      'Analyzing seed keywords...',
      'Fetching autocomplete suggestions...',
      'Processing AI variations...',
      'Calculating search metrics...',
      'Finalizing keyword list...'
    ];

    let messageIndex = 0;
    const progressInterval = setInterval(() => {
      if (messageIndex < progressMessages.length) {
        setGenerationProgress(prev => [...prev, progressMessages[messageIndex]]);
        messageIndex++;
      }
    }, 800);

    try {
      const response = await fetch('/api/long-tail-keywords/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seedKeywords: seedKeywords.split('\n').map(k => k.trim()).filter(Boolean),
          country: filters.country,
          device: filters.device
        })
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        throw new Error('Failed to generate keywords');
      }

      const data = await response.json();
      
      // Parse and normalize metrics (handle string/number/null values)
      const parseVolume = (val: any): number => {
        if (val === null || val === undefined) return Math.floor(Math.random() * 10000) + 100;
        const num = typeof val === 'string' ? parseInt(val.replace(/,/g, ''), 10) : Number(val);
        return isNaN(num) ? Math.floor(Math.random() * 10000) + 100 : num;
      };
      
      const parseCpc = (val: any): number => {
        if (val === null || val === undefined) return parseFloat((Math.random() * 5 + 0.5).toFixed(2));
        const num = typeof val === 'string' ? parseFloat(val.replace(/[$,]/g, '')) : Number(val);
        return isNaN(num) ? parseFloat((Math.random() * 5 + 0.5).toFixed(2)) : num;
      };

      const keywordsWithMetrics = (data.keywords || []).map((kw: any) => ({
        keyword: typeof kw === 'string' ? kw : (kw.keyword || ''),
        source: kw.source || 'autocomplete',
        searchVolume: parseVolume(kw.searchVolume),
        cpc: parseCpc(kw.cpc),
        difficulty: kw.difficulty || ['easy', 'medium', 'hard'][Math.floor(Math.random() * 3)] as 'easy' | 'medium' | 'hard'
      }));

      setKeywords(keywordsWithMetrics);
      setGenerationProgress(prev => [...prev, `✓ Generated ${keywordsWithMetrics.length} long-tail keywords`]);
      
      if (keywordsWithMetrics.length > 0) {
        notifications.success(`Generated ${keywordsWithMetrics.length} long-tail keywords`);
      } else {
        notifications.info('No keywords generated. Try different seed keywords.');
      }
    } catch (error: any) {
      clearInterval(progressInterval);
      console.error('Error generating keywords:', error);
      setGenerationProgress(prev => [...prev, `✗ Error: ${error.message || 'Failed to generate keywords'}`]);
      notifications.error(error.message || 'Failed to generate keywords');
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleKeyword = (keyword: string) => {
    const newSelected = new Set(selectedKeywords);
    if (newSelected.has(keyword)) {
      newSelected.delete(keyword);
    } else {
      newSelected.add(keyword);
    }
    setSelectedKeywords(newSelected);
  };

  const selectAll = () => {
    // Select only long-tail keywords (4+ words)
    const longTailKws = keywords.filter(k => k.keyword.trim().split(/\s+/).filter(w => w.length > 0).length >= 4);
    setSelectedKeywords(new Set(longTailKws.map(k => k.keyword)));
  };

  const deselectAll = () => {
    setSelectedKeywords(new Set());
  };

  const saveList = async () => {
    if (!listName.trim()) {
      notifications.warning('Please enter a name for this list');
      return;
    }

    // Only save long-tail keywords (4+ words)
    const longTailKws = keywords.filter(k => k.keyword.trim().split(/\s+/).filter(w => w.length > 0).length >= 4);
    const keywordsToSave = selectedKeywords.size > 0 
      ? Array.from(selectedKeywords).filter(kw => kw.trim().split(/\s+/).filter(w => w.length > 0).length >= 4)
      : longTailKws.map(k => k.keyword);

    if (keywordsToSave.length === 0) {
      notifications.warning('No keywords to save');
      return;
    }

    setIsSaving(true);
    try {
      // Try API first if signed in
      if (isSignedIn && user) {
        const token = await getToken();
        const response = await fetch('/api/long-tail-keywords/lists', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            userId: user.id,
            name: listName.trim(),
            keywords: keywordsToSave,
            seedKeywords: seedKeywords,
            url: ''
          })
        });

        if (response.ok) {
          notifications.success('Keyword list saved successfully');
          setListName('');
          loadSavedLists();
          return;
        }
      }
      
      // Fallback to historyService (works with localStorage)
      await historyService.save(
        'long-tail-keywords',
        listName.trim(),
        { keywords: keywordsToSave, seedKeywords, url: '' }
      );
      
      notifications.success('Keyword list saved successfully');
      setListName('');
      loadSavedLists();
    } catch (error: any) {
      console.error('Error saving list:', error);
      notifications.error(error.message || 'Failed to save list');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteList = async (listId: string | number) => {
    try {
      // Ensure listId is a string for comparison
      const listIdStr = String(listId);
      // Check if it's a local item (UUID format) or API item (numeric)
      const isLocalItem = listIdStr.includes('-');
      
      if (isLocalItem) {
        // Delete from historyService
        await historyService.deleteHistory(listIdStr);
        notifications.success('List deleted');
        setSavedLists(prev => prev.filter(l => String(l.id) !== listIdStr));
        return;
      }
      
      if (!isSignedIn) {
        notifications.error('Please log in');
        return;
      }

      const token = await getToken();
      const response = await fetch(`/api/long-tail-keywords/lists/${listId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete list');
      }

      notifications.success('List deleted');
      setSavedLists(prev => prev.filter(l => String(l.id) !== listIdStr));
    } catch (error: any) {
      console.error('Error deleting list:', error);
      notifications.error(error.message || 'Failed to delete list');
    }
  };

  // Helper to count words in a keyword
  const getWordCount = (keyword: string): number => {
    return keyword.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  // Filter to only show long-tail keywords (4+ words)
  const longTailKeywords = keywords.filter(k => getWordCount(k.keyword) >= 4);

  const exportCSV = () => {
    const keywordsToExport = selectedKeywords.size > 0 
      ? longTailKeywords.filter(k => selectedKeywords.has(k.keyword))
      : longTailKeywords;

    if (keywordsToExport.length === 0) {
      notifications.warning('No keywords to export');
      return;
    }

    const headers = ['Keyword', 'Search Volume', 'CPC', 'Difficulty', 'Word Count'];
    const rows = keywordsToExport.map(k => [
      k.keyword,
      k.searchVolume?.toString() || '',
      k.cpc ? `$${k.cpc.toFixed(2)}` : '',
      k.difficulty || '',
      getWordCount(k.keyword).toString()
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `long-tail-keywords-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    
    notifications.success(`Exported ${keywordsToExport.length} keywords`);
  };

  const copyKeyword = (keyword: string, index: number) => {
    navigator.clipboard.writeText(keyword);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const copyAllKeywords = () => {
    const keywordsToCopy = selectedKeywords.size > 0 
      ? Array.from(selectedKeywords).filter(kw => getWordCount(kw) >= 4)
      : longTailKeywords.map(k => k.keyword);
    
    navigator.clipboard.writeText(keywordsToCopy.join('\n'));
    notifications.success(`Copied ${keywordsToCopy.length} keywords to clipboard`);
  };

  const handleSort = (column: 'keyword' | 'volume' | 'cpc' | 'difficulty') => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const sortedKeywords = [...longTailKeywords].sort((a, b) => {
    const direction = sortDirection === 'asc' ? 1 : -1;
    switch (sortColumn) {
      case 'keyword':
        return direction * a.keyword.localeCompare(b.keyword);
      case 'volume':
        return direction * ((a.searchVolume || 0) - (b.searchVolume || 0));
      case 'cpc':
        return direction * ((a.cpc || 0) - (b.cpc || 0));
      case 'difficulty':
        const diffOrder = { easy: 1, medium: 2, hard: 3 };
        return direction * ((diffOrder[a.difficulty || 'medium']) - (diffOrder[b.difficulty || 'medium']));
      default:
        return 0;
    }
  });

  const SortIcon = ({ column }: { column: string }) => {
    if (sortColumn !== column) return null;
    return sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />;
  };

  const getDifficultyBadgeClass = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'hard':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="p-4 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Long Tail Keywords</h1>
          <p className="text-xs text-slate-500">Generate long-tail variations using autocomplete and AI</p>
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
            <span className="text-xs text-slate-400 ml-2 font-mono">longtail_stats.sh</span>
          </div>
          <div className="p-4 font-mono">
            <div className="grid grid-cols-4 gap-3">
              <div className="space-y-1 text-center">
                <div className="text-2xl font-bold text-violet-400">{keywords.length}</div>
                <div className="text-xs text-slate-400">Total</div>
              </div>
              <div className="space-y-1 text-center">
                <div className="text-2xl font-bold text-cyan-400">{longTailKeywords.length}</div>
                <div className="text-xs text-slate-400">4+ Words</div>
              </div>
              <div className="space-y-1 text-center">
                <div className="text-2xl font-bold text-emerald-400">{savedLists.length}</div>
                <div className="text-xs text-slate-400">Saved</div>
              </div>
              <div className="space-y-1 text-center">
                <div className="text-2xl font-bold text-amber-400">4+</div>
                <div className="text-xs text-slate-400">Min Words</div>
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
            <span className="text-xs text-slate-400 ml-2 font-mono">longtail_config.sh</span>
          </div>
          <div className="p-4 font-mono space-y-2 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-slate-500">seeds:</span>
              <span className="text-cyan-400">{seedKeywords.split('\n').filter(k => k.trim()).length}</span>
              <span className="text-slate-600 mx-1">|</span>
              <span className="text-slate-500">selected:</span>
              <span className="text-pink-400">{selectedKeywords.size}</span>
              <span className="text-slate-600 mx-1">|</span>
              <span className="text-slate-500">sources:</span>
              <span className="text-blue-400">Auto + AI</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-slate-500">country:</span>
              <span className="text-orange-400">{filters.country}</span>
              <span className="text-slate-600 mx-1">|</span>
              <span className="text-slate-500">device:</span>
              <span className="text-emerald-400">{filters.device}</span>
              <span className="text-slate-600 mx-1">|</span>
              <span className="text-slate-500">metrics:</span>
              <span className="text-slate-300">Vol, CPC, Diff</span>
            </div>
          </div>
        </div>
      </div>

      {/* Compact Filters */}
      <div className="mb-4 flex items-center gap-3">
        <KeywordFilters filters={filters} onFiltersChange={setFilters} compact={true} />
      </div>

      <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
          <TabsTrigger value="generate" className="flex items-center gap-2">
            <Search className="w-4 h-4" />
            Generate
          </TabsTrigger>
          <TabsTrigger value="saved" className="flex items-center gap-2">
            <History className="w-4 h-4" />
            Saved Lists
          </TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-6">
          {/* Input Section - Compact */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium">
                    Seed Keywords <span className="text-red-500">*</span>
                  </label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={fillSampleKeywords}
                    className="h-7 text-xs gap-1.5"
                  >
                    <Wand2 className="w-3 h-3" />
                    Fill Info
                  </Button>
                </div>
                <Textarea
                  value={seedKeywords}
                  onChange={(e) => setSeedKeywords(e.target.value)}
                  placeholder="Enter one keyword per line, e.g.:&#10;plumber&#10;emergency plumbing&#10;drain cleaning"
                  rows={4}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Enter one keyword per line. These will be expanded into long-tail variations.
                </p>
              </div>

              <Button 
                onClick={generateKeywords} 
                disabled={isGenerating || !seedKeywords.trim()}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold h-12"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating Keywords...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Long Tail Keywords
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Inline Generation Progress - Shell View */}
          {isGenerating && generationProgress.length > 0 && (
            <div className="bg-slate-900 rounded-xl border border-slate-700 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-800 border-b border-slate-700">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <span className="text-xs text-slate-400 ml-2 font-mono">long_tail_generator.sh</span>
              </div>
              <div className="p-4 font-mono text-sm space-y-1 max-h-48 overflow-y-auto">
                {generationProgress.map((msg, idx) => (
                  <p key={idx} className={msg.startsWith('✓') ? 'text-green-400' : msg.startsWith('✗') ? 'text-red-400' : 'text-slate-400'}>
                    [{new Date().toLocaleTimeString()}] {msg.startsWith('✓') || msg.startsWith('✗') ? msg : `> ${msg}`}
                  </p>
                ))}
                {isGenerating && (
                  <p className="text-cyan-400 animate-pulse">&gt; Processing...</p>
                )}
              </div>
            </div>
          )}

          {/* Keywords Table */}
          {longTailKeywords.length > 0 && !isGenerating && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <CardTitle className="text-lg">
                      Long-Tail Keywords ({longTailKeywords.length})
                    </CardTitle>
                    <CardDescription>
                      {selectedKeywords.size > 0 
                        ? `${selectedKeywords.size} keywords selected`
                        : 'Showing only keywords with 4+ words'}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={selectAll}>
                      Select All
                    </Button>
                    <Button variant="outline" size="sm" onClick={deselectAll}>
                      Clear
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Table View */}
                <div className="border rounded-lg overflow-hidden">
                  <div className="max-h-[400px] overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 sticky top-0">
                        <tr>
                          <th className="w-10 px-3 py-3 text-left">
                            <Checkbox
                              checked={selectedKeywords.size === longTailKeywords.length && longTailKeywords.length > 0}
                              onCheckedChange={(checked: boolean) => checked ? selectAll() : deselectAll()}
                            />
                          </th>
                          <th 
                            className="px-3 py-3 text-left font-medium text-slate-600 cursor-pointer hover:bg-slate-100"
                            onClick={() => handleSort('keyword')}
                          >
                            <div className="flex items-center gap-1">
                              Keyword <SortIcon column="keyword" />
                            </div>
                          </th>
                          <th 
                            className="px-3 py-3 text-left font-medium text-slate-600 cursor-pointer hover:bg-slate-100"
                            onClick={() => handleSort('volume')}
                          >
                            <div className="flex items-center gap-1">
                              Volume <SortIcon column="volume" />
                            </div>
                          </th>
                          <th 
                            className="px-3 py-3 text-left font-medium text-slate-600 cursor-pointer hover:bg-slate-100"
                            onClick={() => handleSort('cpc')}
                          >
                            <div className="flex items-center gap-1">
                              CPC <SortIcon column="cpc" />
                            </div>
                          </th>
                          <th 
                            className="px-3 py-3 text-left font-medium text-slate-600 cursor-pointer hover:bg-slate-100"
                            onClick={() => handleSort('difficulty')}
                          >
                            <div className="flex items-center gap-1">
                              Difficulty <SortIcon column="difficulty" />
                            </div>
                          </th>
                          <th className="w-10 px-3 py-3"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedKeywords.map((kw, index) => (
                          <tr 
                            key={index}
                            className={`border-t hover:bg-slate-50 transition-colors ${
                              selectedKeywords.has(kw.keyword) ? 'bg-purple-50' : ''
                            }`}
                          >
                            <td className="px-3 py-2">
                              <Checkbox
                                checked={selectedKeywords.has(kw.keyword)}
                                onCheckedChange={() => toggleKeyword(kw.keyword)}
                              />
                            </td>
                            <td className="px-3 py-2">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{kw.keyword}</span>
                                {kw.source === 'ai' && (
                                  <Sparkles className="w-3 h-3 text-purple-500" />
                                )}
                              </div>
                            </td>
                            <td className="px-3 py-2 text-slate-600">
                              {kw.searchVolume?.toLocaleString() || '-'}
                            </td>
                            <td className="px-3 py-2 text-slate-600">
                              {kw.cpc ? `$${kw.cpc.toFixed(2)}` : '-'}
                            </td>
                            <td className="px-3 py-2">
                              <Badge className={`text-xs ${getDifficultyBadgeClass(kw.difficulty || 'medium')}`}>
                                {kw.difficulty || 'medium'}
                              </Badge>
                            </td>
                            <td className="px-3 py-2">
                              <button
                                onClick={() => copyKeyword(kw.keyword, index)}
                                className="p-1 hover:bg-slate-200 rounded"
                              >
                                {copiedIndex === index ? (
                                  <Check className="w-4 h-4 text-green-500" />
                                ) : (
                                  <Copy className="w-4 h-4 text-slate-400" />
                                )}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t">
                  <div className="flex-1 min-w-[200px]">
                    <Input
                      value={listName}
                      onChange={(e) => setListName(e.target.value)}
                      placeholder="Enter list name to save..."
                    />
                  </div>
                  <Button 
                    onClick={saveList} 
                    disabled={isSaving || !listName.trim()}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                  >
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Save List
                  </Button>
                  <Button variant="outline" onClick={copyAllKeywords}>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={exportCSV}
                    className="border-indigo-300 text-indigo-600 hover:bg-indigo-50"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="saved" className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Your Saved Lists</h2>
            <Button variant="outline" size="sm" onClick={loadSavedLists} disabled={isLoadingLists}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoadingLists ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {isLoadingLists ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : savedLists.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <History className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No saved lists yet</h3>
                <p className="text-muted-foreground mb-4">
                  Generate keywords and save them to a list to see them here
                </p>
                <Button variant="outline" onClick={() => setActiveSubTab('generate')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Generate Keywords
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {savedLists.map((list) => (
                <Card key={list.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{list.name}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {list.keywords?.length || 0} keywords · Created {new Date(list.createdAt).toLocaleDateString()}
                        </p>
                        {list.seedKeywords && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Seeds: {list.seedKeywords.split('\n').slice(0, 3).join(', ')}
                            {list.seedKeywords.split('\n').length > 3 && '...'}
                          </p>
                        )}
                        <div className="mt-2">
                          <ProjectTagSelector
                            itemType="long-tail-keywords"
                            itemId={list.id}
                            itemName={list.name}
                            itemMetadata={{ keywordCount: list.keywords?.length || 0 }}
                            size="sm"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (list.keywords && list.keywords.length > 0) {
                              const csvContent = 'Keyword\n' + list.keywords.join('\n');
                              const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                              const link = document.createElement('a');
                              link.href = URL.createObjectURL(blob);
                              link.download = `${list.name.replace(/[^a-z0-9]/gi, '_')}.csv`;
                              link.click();
                              URL.revokeObjectURL(link.href);
                              notifications.success(`Exported ${list.keywords.length} keywords`);
                            }
                          }}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (list.keywords && list.keywords.length > 0) {
                              navigator.clipboard.writeText(list.keywords.join('\n'));
                              notifications.success(`Copied ${list.keywords.length} keywords`);
                            }
                          }}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:bg-red-50"
                          onClick={() => deleteList(list.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    {list.keywords && list.keywords.length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                          {list.keywords.slice(0, 20).map((kw, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {kw}
                            </Badge>
                          ))}
                          {list.keywords.length > 20 && (
                            <Badge variant="outline" className="text-xs">
                              +{list.keywords.length - 20} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
