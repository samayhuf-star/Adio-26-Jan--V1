import React, { useState, useEffect } from 'react';
import { useAuth } from '../../utils/authCompat';
import { 
  FileText, Clock, Trash2, Download, Play, Pencil,
  RefreshCw, Search, Filter, ChevronDown, Sparkles, Zap,
  Globe, Calendar, MoreHorizontal
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { historyService } from '../utils/historyService';
import { notifications } from '../utils/notifications';
import { ProjectMultiSelect, ProjectBadges } from './ProjectMultiSelect';
import { LinkProjectDialog } from './LinkProjectDialog';

interface DraftCampaignsProps {
  onLoadCampaign: (data: any, mode: 'resume' | 'edit') => void;
}

interface Project {
  id: string;
  name: string;
  color: string;
}

interface CampaignItem {
  id: string;
  name: string;
  timestamp: string;
  lastModified?: string;
  status: 'draft' | 'completed' | 'in_progress';
  data: any;
  type: string;
  projects?: Project[];
}

export function DraftCampaigns({ onLoadCampaign }: DraftCampaignsProps) {
  const { getToken } = useAuthCompat();
  const [campaigns, setCampaigns] = useState<CampaignItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [builderFilter, setBuilderFilter] = useState<string>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [campaignToDelete, setCampaignToDelete] = useState<string | null>(null);

  useEffect(() => {
    loadCampaigns();
  }, []);

  const fetchCampaignProjects = async (campaignId: string): Promise<Project[]> => {
    try {
      const token = await getToken();
      const response = await fetch(`/api/item-projects/campaign/${campaignId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        return data.data || [];
      }
      return [];
    } catch (err) {
      console.error('Error fetching campaign projects:', err);
      return [];
    }
  };

  const updateCampaignProjects = (campaignId: string, projects: Project[]) => {
    setCampaigns(prev => prev.map(c => 
      c.id === campaignId ? { ...c, projects } : c
    ));
  };

  const loadCampaigns = async () => {
    setLoading(true);
    try {
      const allItems = await historyService.getAll();
      const campaignItems = allItems
        .filter(item => 
          item.type === 'campaign' || 
          item.type === 'campaign-preset' ||
          item.type === 'one-click-campaign'
        )
        .map(item => ({
          id: item.id,
          name: item.name || 'Untitled Campaign',
          timestamp: item.timestamp,
          lastModified: item.lastModified,
          status: (item.status || 'completed') as 'draft' | 'completed' | 'in_progress',
          data: item.data,
          type: item.type,
          projects: [] as Project[]
        }))
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      setCampaigns(campaignItems);
      
      for (const campaign of campaignItems.slice(0, 20)) {
        fetchCampaignProjects(campaign.id).then(projects => {
          if (projects.length > 0) {
            updateCampaignProjects(campaign.id, projects);
          }
        });
      }
    } catch (error) {
      console.error('Failed to load campaigns:', error);
      notifications.error('Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  const extractDomain = (campaign: CampaignItem): string => {
    try {
      // Check for URL in various locations (different builders use different property names)
      const url = campaign.data?.url || 
                  campaign.data?.websiteUrl || 
                  campaign.data?.website_url ||
                  campaign.data?.finalUrl ||
                  '';
      if (!url) return 'N/A';
      const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return campaign.data?.url || campaign.data?.website_url || 'N/A';
    }
  };

  const getBuilderType = (campaign: CampaignItem): '1-click' | 'builder-3' => {
    // Check type first
    if (campaign.type === 'one-click-campaign') return '1-click';
    // Check builderType field
    if (campaign.data?.builderType === '1-click') return '1-click';
    if (campaign.data?.builderType === 'one-click') return '1-click';
    // Check source field (one-click builder sets source)
    if (campaign.data?.source === 'one-click-builder') return '1-click';
    return 'builder-3';
  };

  const formatDateTime = (timestamp: string): { date: string; time: string } => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200">Draft</Badge>;
      case 'in_progress':
        return <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">In Progress</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200">Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleResume = (campaign: CampaignItem) => {
    onLoadCampaign(campaign.data, 'resume');
    notifications.success(`Resuming "${campaign.name}"`);
  };

  const handleEdit = (campaign: CampaignItem) => {
    onLoadCampaign(campaign.data, 'edit');
    notifications.success(`Editing "${campaign.name}"`);
  };

  const handleDelete = async () => {
    if (!campaignToDelete) return;
    
    try {
      await historyService.delete(campaignToDelete);
      setCampaigns(prev => prev.filter(c => c.id !== campaignToDelete));
      notifications.success('Campaign deleted successfully');
    } catch (error) {
      console.error('Failed to delete campaign:', error);
      notifications.error('Failed to delete campaign');
    } finally {
      setDeleteDialogOpen(false);
      setCampaignToDelete(null);
    }
  };

  const handleDownload = (campaign: CampaignItem) => {
    try {
      if (campaign.data?.csvData) {
        const blob = new Blob([campaign.data.csvData], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${campaign.name.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        notifications.success('CSV downloaded successfully');
      } else {
        notifications.warning('No CSV data available. Complete the campaign to generate CSV.');
      }
    } catch (error) {
      console.error('Failed to download CSV:', error);
      notifications.error('Failed to download CSV');
    }
  };

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      extractDomain(campaign).toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter;
    
    const builderType = getBuilderType(campaign);
    const matchesBuilder = builderFilter === 'all' || 
      (builderFilter === '1-click' && builderType === '1-click') ||
      (builderFilter === 'builder-3' && builderType === 'builder-3');
    
    return matchesSearch && matchesStatus && matchesBuilder;
  });

  const stats = {
    total: campaigns.length,
    draft: campaigns.filter(c => c.status === 'draft' || c.status === 'in_progress').length,
    completed: campaigns.filter(c => c.status === 'completed').length
  };

  return (
    <div className="p-6 space-y-6 bg-white min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-violet-600" />
            Draft Campaigns
          </h1>
          <p className="text-gray-500 mt-1">
            Resume incomplete campaigns or manage your completed builds
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={loadCampaigns}
          className="border-gray-300 hover:bg-gray-50 text-gray-700"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Shell View - Two Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: Campaign Stats */}
        <div className="bg-slate-900 rounded-xl border border-slate-700 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-800 border-b border-slate-700">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
            <span className="text-xs text-slate-400 ml-2 font-mono">campaign_stats.sh</span>
          </div>
          <div className="p-4 font-mono">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1 text-center">
                <div className="text-2xl font-bold text-violet-400">{stats.total}</div>
                <div className="text-xs text-slate-400">Total</div>
              </div>
              <div className="space-y-1 text-center">
                <div className="text-2xl font-bold text-amber-400">{stats.draft}</div>
                <div className="text-xs text-slate-400">Drafts</div>
              </div>
              <div className="space-y-1 text-center">
                <div className="text-2xl font-bold text-emerald-400">{stats.completed}</div>
                <div className="text-xs text-slate-400">Completed</div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Status Info */}
        <div className="bg-slate-900 rounded-xl border border-slate-700 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-800 border-b border-slate-700">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
            <span className="text-xs text-slate-400 ml-2 font-mono">status_info.sh</span>
          </div>
          <div className="p-4 font-mono space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-500">drafts:</span>
              <span className="text-amber-400">Resume anytime to finish building</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500">completed:</span>
              <span className="text-emerald-400">Ready for Google Ads Editor import</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500">export:</span>
              <span className="text-blue-400">Download CSV anytime</span>
            </div>
          </div>
        </div>
      </div>

      <Card className="bg-white border-gray-200 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by name or domain..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white border-gray-300 text-gray-900 placeholder:text-gray-400"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40 bg-white border-gray-300 text-gray-700">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={builderFilter} onValueChange={setBuilderFilter}>
              <SelectTrigger className="w-full sm:w-40 bg-white border-gray-300 text-gray-700">
                <SelectValue placeholder="Builder" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Builders</SelectItem>
                <SelectItem value="1-click">1 Click Builder</SelectItem>
                <SelectItem value="builder-3">Builder 3.0</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-6 h-6 animate-spin text-violet-600" />
              <span className="ml-2 text-gray-500">Loading campaigns...</span>
            </div>
          ) : filteredCampaigns.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No campaigns found</p>
              <p className="text-sm mt-1">Start building a campaign to see it here</p>
            </div>
          ) : (
            <div className="rounded-lg border border-gray-200 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 hover:bg-gray-50">
                    <TableHead className="w-12 text-gray-600 font-semibold">#</TableHead>
                    <TableHead className="text-gray-600 font-semibold">Campaign Name</TableHead>
                    <TableHead className="text-gray-600 font-semibold">Domain</TableHead>
                    <TableHead className="text-gray-600 font-semibold">Date & Time</TableHead>
                    <TableHead className="text-gray-600 font-semibold">Builder</TableHead>
                    <TableHead className="text-gray-600 font-semibold">Status</TableHead>
                    <TableHead className="text-gray-600 font-semibold">Projects</TableHead>
                    <TableHead className="text-right text-gray-600 font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCampaigns.map((campaign, index) => {
                    const { date, time } = formatDateTime(campaign.lastModified || campaign.timestamp);
                    const builderType = getBuilderType(campaign);
                    const isDraft = campaign.status === 'draft' || campaign.status === 'in_progress';
                    
                    return (
                      <TableRow 
                        key={campaign.id} 
                        className="border-gray-100 hover:bg-gray-50/50"
                      >
                        <TableCell className="text-gray-500 font-mono">
                          {index + 1}
                        </TableCell>
                        <TableCell className="font-medium text-gray-900 max-w-[200px] truncate">
                          {campaign.name}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Globe className="w-4 h-4 text-gray-400" />
                            <span className="truncate max-w-[150px]">{extractDomain(campaign)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <div className="text-sm">
                              <div>{date}</div>
                              <div className="text-xs text-gray-400">{time}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {builderType === '1-click' ? (
                            <Badge variant="outline" className="bg-purple-50 text-purple-600 border-purple-200">
                              <Zap className="w-3 h-3 mr-1" />
                              1 Click
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-violet-50 text-violet-600 border-violet-200">
                              <Sparkles className="w-3 h-3 mr-1" />
                              Builder 3.0
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(campaign.status)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <ProjectBadges projects={campaign.projects || []} />
                            <ProjectMultiSelect
                              itemType="campaign"
                              itemId={campaign.id}
                              assignedProjects={campaign.projects || []}
                              onSave={(projects) => updateCampaignProjects(campaign.id, projects)}
                            />
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {isDraft && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleResume(campaign)}
                                className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                title="Resume"
                              >
                                <Play className="w-4 h-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(campaign)}
                              className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              title="Edit"
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDownload(campaign)}
                              className="h-8 w-8 text-violet-600 hover:text-violet-700 hover:bg-violet-50"
                              title="Download CSV"
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                            <LinkProjectDialog
                              itemType="campaign"
                              itemId={campaign.id}
                              itemName={campaign.name}
                              itemMetadata={{
                                structure: campaign.data?.selectedStructure || campaign.data?.structure,
                                keywordCount: campaign.data?.selectedKeywords?.length || campaign.data?.keywords?.length || 0,
                                adCount: campaign.data?.ads?.length || 0,
                                targetCountry: campaign.data?.targetCountry,
                                builderType: getBuilderType(campaign)
                              }}
                              variant="icon"
                              triggerClassName="h-8 w-8"
                              onLinked={(projectId, projectName) => {
                                notifications.success(`Campaign "${campaign.name}" added to "${projectName}"`, {
                                  title: 'Added to Project'
                                });
                              }}
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setCampaignToDelete(campaign.id);
                                setDeleteDialogOpen(true);
                              }}
                              className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-white border-gray-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900">Delete Campaign</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-500">
              Are you sure you want to delete this campaign? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
