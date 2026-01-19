import React, { useState, useEffect } from 'react';
import { getSessionToken } from '../utils/auth';
import { FolderOpen, Trash2, Download, Clock, Search, RotateCcw, Filter, FileText } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { historyService } from '../utils/historyService';
import { notifications } from '../utils/notifications';
import { ProjectMultiSelect, ProjectBadges } from './ProjectMultiSelect';

interface Project {
  id: string;
  name: string;
  color: string;
}

interface HistoryItem {
  id: string;
  name: string;
  type: string;
  data: any;
  timestamp: string;
  status?: string;
  projects?: Project[];
}

export const KeywordSavedLists = () => {
  const getToken = async () => {
    const session = await getSessionToken();
    return session || null;
  };
  const [activeTab, setActiveTab] = useState<'planner' | 'mixer' | 'negative'>('planner');
  const [plannerHistory, setPlannerHistory] = useState<HistoryItem[]>([]);
  const [mixerHistory, setMixerHistory] = useState<HistoryItem[]>([]);
  const [negativeHistory, setNegativeHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadHistory();
  }, []);

  const fetchItemProjects = async (itemId: string): Promise<Project[]> => {
    try {
      const token = await getToken();
      const response = await fetch(`/api/item-projects/keyword-list/${itemId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        return data.data || [];
      }
      return [];
    } catch (err) {
      console.error('Error fetching item projects:', err);
      return [];
    }
  };

  const updateItemProjects = (itemId: string, projects: Project[], type: string) => {
    const updateFn = (items: HistoryItem[]) => 
      items.map(item => item.id === itemId ? { ...item, projects } : item);
    
    if (type === 'keyword-planner') {
      setPlannerHistory(updateFn);
    } else if (type === 'keyword-mixer') {
      setMixerHistory(updateFn);
    } else if (type === 'negative-keywords') {
      setNegativeHistory(updateFn);
    }
  };

  const loadProjectsForItems = (items: HistoryItem[], type: string) => {
    for (const item of items.slice(0, 20)) {
      fetchItemProjects(item.id).then(projects => {
        if (projects.length > 0) {
          updateItemProjects(item.id, projects, type);
        }
      });
    }
  };

  const loadHistory = async () => {
    try {
      setLoading(true);
      const allHistory = await historyService.getAll();
      
      // Filter by type
      const planner = allHistory.filter((item: any) => item.type === 'keyword-planner').map((item: any) => ({ ...item, projects: [] as Project[] }));
      const mixer = allHistory.filter((item: any) => item.type === 'keyword-mixer').map((item: any) => ({ ...item, projects: [] as Project[] }));
      const negative = allHistory.filter((item: any) => item.type === 'negative-keywords').map((item: any) => ({ ...item, projects: [] as Project[] }));
      
      // Sort by timestamp (newest first)
      const sortByDate = (a: any, b: any) => 
        new Date(b.timestamp || b.createdAt || 0).getTime() - new Date(a.timestamp || a.createdAt || 0).getTime();
      
      const sortedPlanner = planner.sort(sortByDate);
      const sortedMixer = mixer.sort(sortByDate);
      const sortedNegative = negative.sort(sortByDate);
      
      setPlannerHistory(sortedPlanner);
      setMixerHistory(sortedMixer);
      setNegativeHistory(sortedNegative);
      
      loadProjectsForItems(sortedPlanner, 'keyword-planner');
      loadProjectsForItems(sortedMixer, 'keyword-mixer');
      loadProjectsForItems(sortedNegative, 'negative-keywords');
    } catch (error) {
      console.error('Failed to load history:', error);
      notifications.error('Failed to load saved lists', {
        title: 'Error',
        description: 'Could not load your saved keyword lists.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, type: string) => {
    if (!confirm('Are you sure you want to delete this saved list?')) return;
    
    try {
      await historyService.delete(id);
      await loadHistory();
      notifications.success('Saved list deleted', {
        title: 'Deleted'
      });
    } catch (error) {
      console.error('Failed to delete:', error);
      notifications.error('Failed to delete saved list', {
        title: 'Error'
      });
    }
  };

  const handleLoad = (item: HistoryItem) => {
    // Emit custom event that App.tsx can listen to
    window.dispatchEvent(new CustomEvent('loadHistoryItem', {
      detail: { type: item.type, data: item.data }
    }));
    notifications.success('Loading saved list...', {
      title: 'Loading',
      description: 'The saved list will be loaded in the respective tool.'
    });
  };

  const handleExport = (item: HistoryItem) => {
    try {
      let content = '';
      
      if (item.type === 'keyword-planner') {
        const keywords = item.data?.generatedKeywords || [];
        content = keywords.join('\n');
      } else if (item.type === 'keyword-mixer') {
        const keywords = item.data?.mixedKeywords || [];
        content = keywords.join('\n');
      } else if (item.type === 'negative-keywords') {
        const keywords = item.data?.generatedKeywords || item.data?.keywords || [];
        content = keywords.map((k: any) => typeof k === 'string' ? k : k.keyword || k.text || '').join('\n');
      }
      
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${item.name.replace(/[^a-z0-9]/gi, '_')}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      notifications.success('Exported successfully', {
        title: 'Exported',
        description: 'Your keywords have been exported to a text file.'
      });
    } catch (error) {
      console.error('Export failed:', error);
      notifications.error('Failed to export', {
        title: 'Error'
      });
    }
  };

  const getCurrentHistory = () => {
    switch (activeTab) {
      case 'planner':
        return plannerHistory;
      case 'mixer':
        return mixerHistory;
      case 'negative':
        return negativeHistory;
      default:
        return [];
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'keyword-planner':
        return <Search className="w-5 h-5 text-green-500" />;
      case 'keyword-mixer':
        return <RotateCcw className="w-5 h-5 text-orange-500" />;
      case 'negative-keywords':
        return <Filter className="w-5 h-5 text-red-500" />;
      default:
        return <FileText className="w-5 h-5 text-slate-500" />;
    }
  };

  const filteredHistory = getCurrentHistory().filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    JSON.stringify(item.data).toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Saved Lists</h1>
          <p className="text-xs text-slate-500">View and manage your saved keyword lists</p>
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
            <span className="text-xs text-slate-400 ml-2 font-mono">saved_stats.sh</span>
          </div>
          <div className="p-4 font-mono">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1 text-center">
                <div className="text-2xl font-bold text-violet-400">{plannerHistory.length}</div>
                <div className="text-xs text-slate-400">Planner</div>
              </div>
              <div className="space-y-1 text-center">
                <div className="text-2xl font-bold text-emerald-400">{mixerHistory.length}</div>
                <div className="text-xs text-slate-400">Mixer</div>
              </div>
              <div className="space-y-1 text-center">
                <div className="text-2xl font-bold text-amber-400">{negativeHistory.length}</div>
                <div className="text-xs text-slate-400">Negative</div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Info */}
        <div className="bg-slate-900 rounded-xl border border-slate-700 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-800 border-b border-slate-700">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
            <span className="text-xs text-slate-400 ml-2 font-mono">saved_info.sh</span>
          </div>
          <div className="p-4 font-mono space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-500">total:</span>
              <span className="text-cyan-400">{plannerHistory.length + mixerHistory.length + negativeHistory.length} lists</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500">storage:</span>
              <span className="text-emerald-400">PocketBase Cloud</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500">actions:</span>
              <span className="text-blue-400">Export, Delete, View</span>
            </div>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(value: string) => setActiveTab(value as 'planner' | 'mixer' | 'negative')} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="planner" className="flex items-center gap-2">
            <Search className="w-4 h-4" />
            Keyword Planner
          </TabsTrigger>
          <TabsTrigger value="mixer" className="flex items-center gap-2">
            <RotateCcw className="w-4 h-4" />
            Keyword Mixer
          </TabsTrigger>
          <TabsTrigger value="negative" className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Negative Keywords
          </TabsTrigger>
        </TabsList>

        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 z-10" />
            <Input
              type="text"
              placeholder="Search saved lists..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11"
            />
          </div>
        </div>

        <TabsContent value="planner" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5 text-green-500" />
                Keyword Planner Saved Lists
              </CardTitle>
              <CardDescription>
                {plannerHistory.length} saved list{plannerHistory.length !== 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                  <p className="mt-4 text-slate-500">Loading saved lists...</p>
                </div>
              ) : filteredHistory.length === 0 ? (
                <div className="text-center py-12">
                  <FolderOpen className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                  <h3 className="text-xl font-semibold text-slate-700 mb-2">No Saved Lists</h3>
                  <p className="text-slate-500">
                    {searchQuery ? 'No lists match your search.' : 'Save keyword plans from the Keyword Planner to see them here.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredHistory.map((item) => {
                    const keywords = item.data?.generatedKeywords || [];
                    const date = new Date(item.timestamp || Date.now());
                    return (
                      <div
                        key={item.id}
                        className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              {getTypeIcon(item.type)}
                              <h3 className="font-semibold text-slate-900">{item.name}</h3>
                              <Badge variant="outline" className="text-xs">
                                {keywords.length} keywords
                              </Badge>
                            </div>
                            <p className="text-sm text-slate-500 mb-2">
                              Created: {date.toLocaleDateString()} at {date.toLocaleTimeString()}
                            </p>
                            <div className="flex items-center gap-2 mb-2">
                              <ProjectBadges projects={item.projects || []} />
                            </div>
                            {keywords.length > 0 && (
                              <p className="text-xs text-slate-400 line-clamp-2">
                                {keywords.slice(0, 5).join(', ')}
                                {keywords.length > 5 ? '...' : ''}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <ProjectMultiSelect
                              itemType="keyword-list"
                              itemId={item.id}
                              assignedProjects={item.projects || []}
                              onSave={(projects) => updateItemProjects(item.id, projects, item.type)}
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleLoad(item)}
                              className="text-indigo-600 hover:text-indigo-700"
                            >
                              Load
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleExport(item)}
                              className="text-indigo-600 hover:text-indigo-700"
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(item.id, item.type)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mixer" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-orange-500" />
                Keyword Mixer Saved Lists
              </CardTitle>
              <CardDescription>
                {mixerHistory.length} saved list{mixerHistory.length !== 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                  <p className="mt-4 text-slate-500">Loading saved lists...</p>
                </div>
              ) : filteredHistory.length === 0 ? (
                <div className="text-center py-12">
                  <FolderOpen className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                  <h3 className="text-xl font-semibold text-slate-700 mb-2">No Saved Lists</h3>
                  <p className="text-slate-500">
                    {searchQuery ? 'No lists match your search.' : 'Save mixed keywords from the Keyword Mixer to see them here.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredHistory.map((item) => {
                    const keywords = item.data?.mixedKeywords || [];
                    const date = new Date(item.timestamp || Date.now());
                    return (
                      <div
                        key={item.id}
                        className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              {getTypeIcon(item.type)}
                              <h3 className="font-semibold text-slate-900">{item.name}</h3>
                              <Badge variant="outline" className="text-xs">
                                {keywords.length} keywords
                              </Badge>
                            </div>
                            <p className="text-sm text-slate-500 mb-2">
                              Created: {date.toLocaleDateString()} at {date.toLocaleTimeString()}
                            </p>
                            <div className="flex items-center gap-2 mb-2">
                              <ProjectBadges projects={item.projects || []} />
                            </div>
                            {keywords.length > 0 && (
                              <p className="text-xs text-slate-400 line-clamp-2">
                                {keywords.slice(0, 5).join(', ')}
                                {keywords.length > 5 ? '...' : ''}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <ProjectMultiSelect
                              itemType="keyword-list"
                              itemId={item.id}
                              assignedProjects={item.projects || []}
                              onSave={(projects) => updateItemProjects(item.id, projects, item.type)}
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleLoad(item)}
                              className="text-indigo-600 hover:text-indigo-700"
                            >
                              Load
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleExport(item)}
                              className="text-indigo-600 hover:text-indigo-700"
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(item.id, item.type)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="negative" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-red-500" />
                Negative Keywords Saved Lists
              </CardTitle>
              <CardDescription>
                {negativeHistory.length} saved list{negativeHistory.length !== 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                  <p className="mt-4 text-slate-500">Loading saved lists...</p>
                </div>
              ) : filteredHistory.length === 0 ? (
                <div className="text-center py-12">
                  <FolderOpen className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                  <h3 className="text-xl font-semibold text-slate-700 mb-2">No Saved Lists</h3>
                  <p className="text-slate-500">
                    {searchQuery ? 'No lists match your search.' : 'Save negative keywords from the Negative Keywords Builder to see them here.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredHistory.map((item) => {
                    const keywords = item.data?.generatedKeywords || item.data?.keywords || [];
                    const keywordList = keywords.map((k: any) => typeof k === 'string' ? k : k.keyword || k.text || '').filter(Boolean);
                    const date = new Date(item.timestamp || Date.now());
                    return (
                      <div
                        key={item.id}
                        className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              {getTypeIcon(item.type)}
                              <h3 className="font-semibold text-slate-900">{item.name}</h3>
                              <Badge variant="outline" className="text-xs">
                                {keywordList.length} keywords
                              </Badge>
                            </div>
                            <p className="text-sm text-slate-500 mb-2">
                              Created: {date.toLocaleDateString()} at {date.toLocaleTimeString()}
                            </p>
                            <div className="flex items-center gap-2 mb-2">
                              <ProjectBadges projects={item.projects || []} />
                            </div>
                            {keywordList.length > 0 && (
                              <p className="text-xs text-slate-400 line-clamp-2">
                                {keywordList.slice(0, 5).join(', ')}
                                {keywordList.length > 5 ? '...' : ''}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <ProjectMultiSelect
                              itemType="keyword-list"
                              itemId={item.id}
                              assignedProjects={item.projects || []}
                              onSave={(projects) => updateItemProjects(item.id, projects, item.type)}
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleLoad(item)}
                              className="text-indigo-600 hover:text-indigo-700"
                            >
                              Load
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleExport(item)}
                              className="text-indigo-600 hover:text-indigo-700"
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(item.id, item.type)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

