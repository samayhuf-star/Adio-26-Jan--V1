import React, { useState, useEffect } from 'react';
import { 
    History, Clock, ArrowRight, Trash2, RotateCcw, FileText, 
    Search, Filter, Calendar, AlertCircle, ChevronDown, ChevronUp,
    Globe, Tag, Hash, Sparkles, Eye, Copy, Download, ExternalLink, FileSpreadsheet
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ScrollArea } from './ui/scroll-area';
import { historyService } from '../utils/historyService';
import { notifications } from '../utils/notifications';
import { projectId, publicAnonKey } from '../utils/supabase/info';

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-6757d0ca`;

interface HistoryItem {
    id: string;
    type: string;
    name: string;
    timestamp: string;
    data: any;
    status?: 'draft' | 'completed';
    lastModified?: string;
}

interface HistoryPanelProps {
    onLoadItem: (type: string, data: any) => void;
}

export const HistoryPanel = ({ onLoadItem }: HistoryPanelProps) => {
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');
    const [activeTab, setActiveTab] = useState('all');
    const [error, setError] = useState<string | null>(null);
    const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            setError(null);
            setLoading(true);
            try {
                const data = await historyService.getHistory();
                if (data.history) {
                    setHistory(data.history);
                }
            } catch (apiError) {
                console.log('ℹ️ Loading history from local storage (API unavailable)');
                const localHistory = await historyService.getAll();
                localHistory.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
                setHistory(localHistory);
            }
        } catch (error) {
            console.error("Failed to load history", error);
            setError(error instanceof Error ? error.message : "Failed to load history");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this item?')) return;
        
        try {
            await historyService.deleteHistory(id);
            const deletedItem = history.find(item => item.id === id);
            setHistory(history.filter(item => item.id !== id));
            
            notifications.success('History item deleted successfully', {
                title: 'Deleted',
                description: deletedItem ? `"${deletedItem.name}" has been removed.` : 'Item has been removed.'
            });
        } catch (error) {
            console.error("Failed to delete", error);
            notifications.error('Failed to delete history item', {
                title: 'Error',
                description: error instanceof Error ? error.message : 'An error occurred while deleting.'
            });
        }
    };

    const toggleExpand = (id: string) => {
        setExpandedItems(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        notifications.success('Copied to clipboard!', { title: 'Copied' });
    };

    const handleDownloadCSV = async (jobId: string, campaignName: string) => {
        try {
            notifications.info('Checking CSV status...', {
                title: 'Downloading CSV',
                description: 'Please wait while we retrieve your CSV file.',
                duration: 5000
            });

            const response = await fetch(`${API_BASE}/export-csv/${jobId}`, {
                headers: {
                    'Authorization': `Bearer ${publicAnonKey}`
                }
            });

            if (response.status === 404) {
                notifications.warning('CSV is still being processed. Please check again in a moment.', {
                    title: 'Processing',
                    description: 'Your CSV export is still in progress. Try again in a minute.',
                    duration: 10000
                });
                return;
            }

            const contentType = response.headers.get('content-type') || '';
            
            if (contentType.includes('text/csv')) {
                // CSV is ready - download it
                const blob = await response.blob();
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                
                const contentDisposition = response.headers.get('content-disposition');
                let filename = `${campaignName.replace(/[^a-z0-9]/gi, '_')}_export.csv`;
                if (contentDisposition) {
                    const filenameMatch = contentDisposition.match(/filename="?(.+?)"?$/);
                    if (filenameMatch) {
                        filename = filenameMatch[1];
                    }
                }
                
                link.download = filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);

                notifications.success('CSV downloaded successfully!', {
                    title: 'Download Complete',
                    description: `Your CSV file "${filename}" has been downloaded.`
                });
            } else {
                // Check status
                const data = await response.json();
                if (data.status === 'processing') {
                    notifications.warning('CSV is still being processed. Please check again in a moment.', {
                        title: 'Processing',
                        description: 'Your CSV export is still in progress. Try again in a minute.',
                        duration: 10000
                    });
                } else if (data.status === 'failed') {
                    notifications.error('CSV export failed', {
                        title: 'Export Failed',
                        description: data.error || 'An error occurred during CSV generation.',
                        duration: 10000
                    });
                }
            }
        } catch (error) {
            console.error('CSV download error:', error);
            notifications.error('Failed to download CSV', {
                title: 'Download Error',
                description: error instanceof Error ? error.message : 'An error occurred while downloading the CSV.',
                duration: 10000
            });
        }
    };

    const filteredHistory = history.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(filter.toLowerCase()) ||
            JSON.stringify(item.data).toLowerCase().includes(filter.toLowerCase());
        const matchesTab = activeTab === 'all' || item.type === activeTab;
        return matchesSearch && matchesTab;
    });

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'campaign': return <FileText className="w-5 h-5 text-blue-500" />;
            case 'keyword-planner': return <Search className="w-5 h-5 text-green-500" />;
            case 'keyword-mixer': return <RotateCcw className="w-5 h-5 text-orange-500" />;
            case 'negative-keywords': return <Filter className="w-5 h-5 text-red-500" />;
            case 'campaign-preset': return <Sparkles className="w-5 h-5 text-purple-500" />;
            case 'website-template': return <Globe className="w-5 h-5 text-indigo-500" />;
            default: return <History className="w-5 h-5 text-slate-500" />;
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'campaign': return 'Campaign';
            case 'keyword-planner': return 'Keyword Plan';
            case 'keyword-mixer': return 'Mixed Keywords';
            case 'negative-keywords': return 'Negative List';
            case 'campaign-preset': return 'Campaign Preset';
            case 'website-template': return 'Website Template';
            default: return 'Item';
        }
    };

    const renderDataPreview = (item: HistoryItem) => {
        const { data, type } = item;
        const isExpanded = expandedItems.has(item.id);

        if (!data) return <p className="text-sm text-slate-400">No data available</p>;

        switch (type) {
            case 'keyword-planner':
                return (
                    <div className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-600">Seed Keywords</label>
                                <div className="p-2 bg-slate-50 rounded border border-slate-200">
                                    <p className="text-sm text-slate-800 break-words">
                                        {data.seedKeywords || 'N/A'}
                                    </p>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-600">Generated Keywords</label>
                                <div className="p-2 bg-slate-50 rounded border border-slate-200">
                                    <p className="text-sm text-slate-800">
                                        {data.generatedKeywords?.length || 0} keywords
                                    </p>
                                </div>
                            </div>
                        </div>
                        {data.negativeKeywords && (
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-600">Negative Keywords</label>
                                <div className="p-2 bg-slate-50 rounded border border-slate-200 max-h-32 overflow-y-auto">
                                    <p className="text-xs text-slate-700 font-mono whitespace-pre-wrap break-words">
                                        {typeof data.negativeKeywords === 'string' 
                                            ? data.negativeKeywords 
                                            : data.negativeKeywords.join('\n')}
                                    </p>
                                </div>
                            </div>
                        )}
                        {data.matchTypes && (
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-600">Match Types</label>
                                <div className="flex gap-2 flex-wrap">
                                    {data.matchTypes.broad && <Badge variant="outline" className="text-xs">Broad</Badge>}
                                    {data.matchTypes.phrase && <Badge variant="outline" className="text-xs">Phrase</Badge>}
                                    {data.matchTypes.exact && <Badge variant="outline" className="text-xs">Exact</Badge>}
                                </div>
                            </div>
                        )}
                        {isExpanded && data.generatedKeywords && data.generatedKeywords.length > 0 && (
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-600">All Generated Keywords</label>
                                <ScrollArea className="h-48 p-2 bg-slate-50 rounded border border-slate-200">
                                    <div className="space-y-1">
                                        {data.generatedKeywords.slice(0, 100).map((kw: string, idx: number) => (
                                            <div key={idx} className="text-xs text-slate-700 font-mono py-1">
                                                {kw}
                                            </div>
                                        ))}
                                        {data.generatedKeywords.length > 100 && (
                                            <p className="text-xs text-slate-500 pt-2">
                                                ... and {data.generatedKeywords.length - 100} more
                                            </p>
                                        )}
                                    </div>
                                </ScrollArea>
                            </div>
                        )}
                    </div>
                );

            case 'keyword-mixer':
                return (
                    <div className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {data.listA && (
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-600">List A</label>
                                    <div className="p-2 bg-slate-50 rounded border border-slate-200 max-h-24 overflow-y-auto">
                                        <p className="text-xs text-slate-700 font-mono whitespace-pre-wrap break-words">
                                            {typeof data.listA === 'string' ? data.listA : data.listA.join('\n')}
                                        </p>
                                    </div>
                                </div>
                            )}
                            {data.listB && (
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-600">List B</label>
                                    <div className="p-2 bg-slate-50 rounded border border-slate-200 max-h-24 overflow-y-auto">
                                        <p className="text-xs text-slate-700 font-mono whitespace-pre-wrap break-words">
                                            {typeof data.listB === 'string' ? data.listB : data.listB.join('\n')}
                                        </p>
                                    </div>
                                </div>
                            )}
                            {data.listC && (
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-600">List C</label>
                                    <div className="p-2 bg-slate-50 rounded border border-slate-200 max-h-24 overflow-y-auto">
                                        <p className="text-xs text-slate-700 font-mono whitespace-pre-wrap break-words">
                                            {typeof data.listC === 'string' ? data.listC : data.listC.join('\n')}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-600">Mixed Keywords</label>
                                <div className="p-2 bg-slate-50 rounded border border-slate-200">
                                    <p className="text-sm text-slate-800">
                                        {data.mixedKeywords?.length || 0} combinations
                                    </p>
                                </div>
                            </div>
                            {data.matchTypes && (
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-600">Match Types</label>
                                    <div className="flex gap-2 flex-wrap">
                                        {data.matchTypes.broad && <Badge variant="outline" className="text-xs">Broad</Badge>}
                                        {data.matchTypes.phrase && <Badge variant="outline" className="text-xs">Phrase</Badge>}
                                        {data.matchTypes.exact && <Badge variant="outline" className="text-xs">Exact</Badge>}
                                    </div>
                                </div>
                            )}
                        </div>
                        {isExpanded && data.mixedKeywords && data.mixedKeywords.length > 0 && (
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-600">All Mixed Keywords</label>
                                <ScrollArea className="h-48 p-2 bg-slate-50 rounded border border-slate-200">
                                    <div className="space-y-1">
                                        {data.mixedKeywords.slice(0, 100).map((kw: string, idx: number) => (
                                            <div key={idx} className="text-xs text-slate-700 font-mono py-1">
                                                {kw}
                                            </div>
                                        ))}
                                        {data.mixedKeywords.length > 100 && (
                                            <p className="text-xs text-slate-500 pt-2">
                                                ... and {data.mixedKeywords.length - 100} more
                                            </p>
                                        )}
                                    </div>
                                </ScrollArea>
                            </div>
                        )}
                    </div>
                );

            case 'negative-keywords':
                return (
                    <div className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {data.url && (
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-600">Target URL</label>
                                    <div className="p-2 bg-slate-50 rounded border border-slate-200">
                                        <p className="text-sm text-slate-800 break-all">{data.url}</p>
                                    </div>
                                </div>
                            )}
                            {data.coreKeywords && (
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-600">Core Keywords</label>
                                    <div className="p-2 bg-slate-50 rounded border border-slate-200">
                                        <p className="text-sm text-slate-800 break-words">{data.coreKeywords}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                        {data.userGoal && (
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-600">User Goal</label>
                                <div className="p-2 bg-slate-50 rounded border border-slate-200">
                                    <p className="text-sm text-slate-800">{data.userGoal}</p>
                                </div>
                            </div>
                        )}
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-600">Generated Negative Keywords</label>
                            <div className="p-2 bg-slate-50 rounded border border-slate-200">
                                <p className="text-sm text-slate-800">
                                    {data.generatedKeywords?.length || 0} negative keywords
                                </p>
                            </div>
                        </div>
                        {isExpanded && data.generatedKeywords && data.generatedKeywords.length > 0 && (
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-600">All Negative Keywords</label>
                                <ScrollArea className="h-48 p-2 bg-slate-50 rounded border border-slate-200">
                                    <div className="space-y-1">
                                        {data.generatedKeywords.slice(0, 100).map((kw: any, idx: number) => (
                                            <div key={idx} className="text-xs text-slate-700 font-mono py-1">
                                                {typeof kw === 'string' ? kw : kw.keyword || kw.text || JSON.stringify(kw)}
                                            </div>
                                        ))}
                                        {data.generatedKeywords.length > 100 && (
                                            <p className="text-xs text-slate-500 pt-2">
                                                ... and {data.generatedKeywords.length - 100} more
                                            </p>
                                        )}
                                    </div>
                                </ScrollArea>
                            </div>
                        )}
                    </div>
                );

            case 'campaign':
            case 'campaign-preset':
                return (
                    <div className="space-y-3">
                        {data.campaignName && (
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-600">Campaign Name</label>
                                <div className="p-2 bg-slate-50 rounded border border-slate-200">
                                    <p className="text-sm text-slate-800">{data.campaignName}</p>
                                </div>
                            </div>
                        )}
                        {isExpanded && (
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-600">Full Campaign Data</label>
                                <ScrollArea className="h-64 p-3 bg-slate-50 rounded border border-slate-200">
                                    <pre className="text-xs text-slate-700 font-mono whitespace-pre-wrap break-words">
                                        {JSON.stringify(data, null, 2)}
                                    </pre>
                                </ScrollArea>
                            </div>
                        )}
                    </div>
                );

            case 'website-template':
                return (
                    <div className="space-y-3">
                        {data.name && (
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-600">Template Name</label>
                                <div className="p-2 bg-slate-50 rounded border border-slate-200">
                                    <p className="text-sm text-slate-800">{data.name}</p>
                                </div>
                            </div>
                        )}
                        {isExpanded && (
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-600">Template Data</label>
                                <ScrollArea className="h-64 p-3 bg-slate-50 rounded border border-slate-200">
                                    <pre className="text-xs text-slate-700 font-mono whitespace-pre-wrap break-words">
                                        {JSON.stringify(data, null, 2)}
                                    </pre>
                                </ScrollArea>
                            </div>
                        )}
                    </div>
                );

            default:
                return (
                    <div className="space-y-2">
                        {isExpanded ? (
                            <ScrollArea className="h-48 p-3 bg-slate-50 rounded border border-slate-200">
                                <pre className="text-xs text-slate-700 font-mono whitespace-pre-wrap break-words">
                                    {JSON.stringify(data, null, 2)}
                                </pre>
                            </ScrollArea>
                        ) : (
                            <p className="text-sm text-slate-500">Click to expand and view data</p>
                        )}
                    </div>
                );
        }
    };

    return (
        <div className="p-4 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6 space-y-2">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    Activity History
                </h1>
                <p className="text-slate-600 text-sm">View, restore, or manage your past campaigns and keyword lists with full data details.</p>
            </div>

            {/* Filters and Search */}
            <Card className="border-slate-200 bg-white shadow-lg mb-6">
                <CardContent className="p-4">
                    <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
                        {/* Tabs */}
                        <Tabs defaultValue="all" className="flex-1" onValueChange={setActiveTab}>
                            <TabsList className="grid w-full grid-cols-6 bg-slate-100 h-10">
                                <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
                                <TabsTrigger value="campaign" className="text-xs">Campaigns</TabsTrigger>
                                <TabsTrigger value="keyword-planner" className="text-xs">Planning</TabsTrigger>
                                <TabsTrigger value="keyword-mixer" className="text-xs">Mixer</TabsTrigger>
                                <TabsTrigger value="negative-keywords" className="text-xs">Negatives</TabsTrigger>
                                <TabsTrigger value="website-template" className="text-xs">Templates</TabsTrigger>
                            </TabsList>
                        </Tabs>
                        
                        {/* Search */}
                        <div className="relative w-full lg:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
                            <Input 
                                placeholder="Search history..." 
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                                className="pl-10 bg-white border-slate-200 h-10"
                            />
                        </div>
                    </div>
                    {/* Results Counter */}
                    {!loading && (
                        <div className="mt-4 pt-4 border-t border-slate-200">
                            <p className="text-sm text-slate-600">
                                <span className="font-semibold text-slate-800">{filteredHistory.length}</span> {filteredHistory.length === 1 ? 'result' : 'results'} found
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* History List */}
            <Card className="border-slate-200 bg-white shadow-lg">
                <CardContent className="p-4">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
                            <p className="text-slate-500">Loading history...</p>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center py-20 text-red-500">
                            <AlertCircle className="w-12 h-12 mb-4 opacity-50" />
                            <p className="font-semibold mb-2">Failed to load history</p>
                            <p className="text-sm text-slate-500">{error}</p>
                            <Button 
                                onClick={fetchHistory} 
                                className="mt-4 bg-indigo-600 hover:bg-indigo-700"
                            >
                                Try Again
                            </Button>
                        </div>
                    ) : filteredHistory.length > 0 ? (
                        <div className="space-y-4">
                            {filteredHistory.map((item) => (
                                <Card 
                                    key={item.id} 
                                    className="border-slate-200 hover:border-indigo-300 transition-all"
                                >
                                    <CardContent className="p-4">
                                        {/* Header */}
                                        <div className="flex items-start justify-between mb-4 gap-4">
                                            <div className="flex items-start gap-3 flex-1 min-w-0">
                                                <div className="p-2 bg-slate-100 rounded-lg flex-shrink-0">
                                                    {getTypeIcon(item.type)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                        <h3 className="font-semibold text-slate-900 text-base truncate max-w-[400px]" title={item.name}>
                                                            {item.name}
                                                        </h3>
                                                        <div className="flex items-center gap-2 flex-shrink-0">
                                                            {item.status === 'draft' && (
                                                                <Badge className="bg-amber-100 text-amber-700 border-amber-300 text-xs whitespace-nowrap">
                                                                    Draft
                                                                </Badge>
                                                            )}
                                                            <Badge variant="secondary" className="text-xs whitespace-nowrap">
                                                                {getTypeLabel(item.type)}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3 text-xs text-slate-500">
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="w-3 h-3" />
                                                            {new Date(item.timestamp).toLocaleDateString()} {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                        {item.lastModified && item.status === 'draft' && (
                                                            <span className="text-amber-600">
                                                                Modified: {new Date(item.lastModified).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm"
                                                    onClick={() => toggleExpand(item.id)}
                                                    className="text-slate-400 hover:text-slate-600"
                                                >
                                                    {expandedItems.has(item.id) ? (
                                                        <ChevronUp className="w-4 h-4" />
                                                    ) : (
                                                        <ChevronDown className="w-4 h-4" />
                                                    )}
                                                </Button>
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm"
                                                    onClick={() => handleDelete(item.id)}
                                                    className="text-slate-400 hover:text-red-600 hover:bg-red-50"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                                {item.type === 'campaign' && item.data?.csvExportJobId && (
                                                    <Button 
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleDownloadCSV(item.data.csvExportJobId, item.name)}
                                                        className="whitespace-nowrap border-indigo-300 text-indigo-700 hover:bg-indigo-50"
                                                    >
                                                        <FileSpreadsheet className="w-4 h-4 mr-2" />
                                                        Download CSV
                                                    </Button>
                                                )}
                                                <Button 
                                                    size="sm"
                                                    onClick={() => onLoadItem(item.type, item.data)}
                                                    className="bg-indigo-600 text-white hover:bg-indigo-700 whitespace-nowrap"
                                                >
                                                    Restore <ArrowRight className="w-4 h-4 ml-2" />
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Data Preview */}
                                        <div className="mt-4 pt-4 border-t border-slate-200">
                                            {renderDataPreview(item)}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                                <History className="w-10 h-10 text-slate-300" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-700 mb-2">No history found</h3>
                            <p className="text-sm text-slate-500 text-center max-w-sm">
                                {filter ? `No items match "${filter}"` : 'Your activity history will appear here once you create campaigns or keyword lists.'}
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};
