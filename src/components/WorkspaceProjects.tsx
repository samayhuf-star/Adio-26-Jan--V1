import { useState, useEffect } from 'react';
import { useAuthCompat } from '../utils/authCompat';
import { 
  FolderOpen, Plus, Edit2, Trash2, Zap, Key, MinusCircle, 
  Shuffle, BarChart3, Settings, X, Loader2,
  Palette, Check, TrendingUp, ArrowUpRight, Sparkles
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Badge } from './ui/badge';

interface WorkspaceProject {
  id: string;
  userId: string;
  workspaceId: string | null;
  name: string;
  description: string | null;
  color: string;
  icon: string;
  isArchived: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
  campaignCount: number;
  keywordCount: number;
  negativeCount: number;
  totalCount: number;
}

interface ProjectItem {
  id: string;
  projectId: string;
  itemType: string;
  itemId: string;
  itemName: string | null;
  itemMetadata: any;
  createdAt: string;
}

interface ProjectDetail extends WorkspaceProject {
  items: Record<string, ProjectItem[]>;
  counts: {
    campaigns: number;
    keywordLists: number;
    negativeKeywords: number;
    total: number;
  };
}

const PROJECT_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f97316',
  '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6'
];

const MODULE_CONFIG = {
  campaign: { 
    label: 'Campaigns', 
    icon: Zap, 
    gradient: 'from-orange-500 to-rose-500',
    bgColor: 'bg-orange-50',
    iconColor: 'text-orange-500',
    badge: 'Active',
    itemTypes: ['campaign']
  },
  'keyword-list': { 
    label: 'Keyword Lists', 
    icon: Key, 
    gradient: 'from-violet-500 to-purple-600',
    bgColor: 'bg-violet-50',
    iconColor: 'text-violet-500',
    badge: 'Active',
    itemTypes: ['keyword-list', 'keyword_list', 'keyword-planner', 'keyword-mixer', 'long-tail-keywords']
  },
  'negative-keywords': { 
    label: 'Negative Keywords', 
    icon: MinusCircle, 
    gradient: 'from-rose-500 to-pink-600',
    bgColor: 'bg-rose-50',
    iconColor: 'text-rose-500',
    badge: 'Active',
    itemTypes: ['negative-keywords', 'negative_keywords']
  },
  'keyword-mixer': { 
    label: 'Keyword Mixer', 
    icon: Shuffle, 
    gradient: 'from-cyan-500 to-blue-600',
    bgColor: 'bg-cyan-50',
    iconColor: 'text-cyan-500',
    badge: 'New',
    itemTypes: ['keyword-mixer']
  },
  analytics: { 
    label: 'Analytics', 
    icon: BarChart3, 
    gradient: 'from-emerald-500 to-teal-600',
    bgColor: 'bg-emerald-50',
    iconColor: 'text-emerald-500',
    badge: 'Soon',
    itemTypes: []
  },
  settings: { 
    label: 'Settings', 
    icon: Settings, 
    gradient: 'from-slate-500 to-slate-700',
    bgColor: 'bg-slate-50',
    iconColor: 'text-slate-500',
    badge: 'Active',
    itemTypes: []
  }
};

type FilterType = 'all' | 'campaign' | 'keyword-list' | 'negative-keywords';

export function WorkspaceProjects() {
  const { getToken } = useAuthCompat();
  const [projects, setProjects] = useState<WorkspaceProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingProject, setEditingProject] = useState<WorkspaceProject | null>(null);
  
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formColor, setFormColor] = useState('#6366f1');
  const [saving, setSaving] = useState(false);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = await getToken();
      if (!token) {
        setError('Authentication required. Please log in again.');
        return;
      }
      
      const response = await fetch('/api/workspace-projects', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      // Check if response is OK before parsing JSON
      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json().catch(() => ({}));
          setError(errorData.error || `Failed to load projects (${response.status})`);
        } else {
          // Server returned HTML (error page) instead of JSON
          setError(`Server error (${response.status}). Please try again or contact support.`);
        }
        return;
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        setError('Invalid response format from server. Please try again.');
        return;
      }
      
      const data = await response.json();
      if (data.success) {
        setProjects(data.data);
        if (data.data.length > 0 && !selectedProject) {
          fetchProjectDetail(data.data[0].id);
        }
      } else {
        setError(data.error || 'Failed to load projects');
      }
    } catch (err: any) {
      console.error('Error fetching projects:', err);
      if (err.message && err.message.includes('JSON')) {
        setError('Server returned invalid data. Please try again or contact support.');
      } else {
        setError(err.message || 'Network error. Please check your connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectDetail = async (projectId: string) => {
    try {
      setLoadingDetail(true);
      const token = await getToken();
      if (!token) return;
      
      const response = await fetch(`/api/workspace-projects/${projectId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json().catch(() => ({}));
          console.error('Error fetching project detail:', errorData.error || response.status);
        } else {
          console.error('Error fetching project detail: Server returned non-JSON response');
        }
        return;
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('Error fetching project detail: Invalid response format');
        return;
      }
      
      const data = await response.json();
      if (data.success) {
        setSelectedProject(data.data);
      }
    } catch (err: any) {
      console.error('Error fetching project detail:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleCreate = async () => {
    if (!formName.trim()) return;
    try {
      setSaving(true);
      const token = await getToken();
      const response = await fetch('/api/workspace-projects', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formName,
          description: formDescription,
          color: formColor
        })
      });
      const data = await response.json();
      if (data.success) {
        setShowCreateDialog(false);
        setFormName('');
        setFormDescription('');
        setFormColor('#6366f1');
        fetchProjects();
      }
    } catch (err: any) {
      console.error('Error creating project:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingProject || !formName.trim()) return;
    try {
      setSaving(true);
      const token = await getToken();
      const response = await fetch(`/api/workspace-projects/${editingProject.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formName,
          description: formDescription,
          color: formColor
        })
      });
      const data = await response.json();
      if (data.success) {
        setShowEditDialog(false);
        setEditingProject(null);
        fetchProjects();
        if (selectedProject?.id === editingProject.id) {
          fetchProjectDetail(editingProject.id);
        }
      }
    } catch (err: any) {
      console.error('Error updating project:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editingProject) return;
    try {
      setSaving(true);
      const token = await getToken();
      const response = await fetch(`/api/workspace-projects/${editingProject.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setShowDeleteDialog(false);
        setEditingProject(null);
        if (selectedProject?.id === editingProject.id) {
          setSelectedProject(null);
        }
        fetchProjects();
      }
    } catch (err: any) {
      console.error('Error deleting project:', err);
    } finally {
      setSaving(false);
    }
  };

  const openEditDialog = (project: WorkspaceProject) => {
    setEditingProject(project);
    setFormName(project.name);
    setFormDescription(project.description || '');
    setFormColor(project.color);
    setShowEditDialog(true);
  };

  const openDeleteDialog = (project: WorkspaceProject) => {
    setEditingProject(project);
    setShowDeleteDialog(true);
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 text-center max-w-md shadow-lg border border-slate-100">
          <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <X className="w-7 h-7 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-800 mb-2">Failed to load projects</h3>
          <p className="text-slate-600 mb-4">{error}</p>
          <Button onClick={fetchProjects} className="bg-indigo-600 hover:bg-indigo-700">Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">My Projects</h1>
            <p className="text-slate-500 text-sm">Organize campaigns, keywords, and settings by project</p>
          </div>
        </div>
      </div>

      {/* Stats Overview Cards - matching dashboard style */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 relative overflow-hidden">
          <div className="absolute top-3 right-3">
            <Badge className="bg-orange-100 text-orange-700 border-0">Total</Badge>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center">
              <FolderOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-3xl font-bold text-slate-800">{projects.length}</div>
              <div className="text-sm text-slate-500">Active Projects</div>
            </div>
          </div>
          <div className="mt-4 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-orange-400 to-rose-500 rounded-full" style={{ width: `${Math.min(projects.length * 20, 100)}%` }} />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 relative overflow-hidden">
          <div className="absolute top-3 right-3">
            <Badge className="bg-violet-100 text-violet-700 border-0">Linked</Badge>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-3xl font-bold text-slate-800">{projects.reduce((sum, p) => sum + p.campaignCount, 0)}</div>
              <div className="text-sm text-slate-500">Total Campaigns</div>
            </div>
          </div>
          <div className="mt-4 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-violet-500 to-purple-600 rounded-full" style={{ width: '60%' }} />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 relative overflow-hidden">
          <div className="absolute top-3 right-3">
            <Badge className="bg-teal-100 text-teal-700 border-0">Keywords</Badge>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-600 flex items-center justify-center">
              <Key className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-3xl font-bold text-slate-800">{projects.reduce((sum, p) => sum + p.keywordCount, 0)}</div>
              <div className="text-sm text-slate-500">Keyword Lists</div>
            </div>
          </div>
          <div className="mt-4 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-teal-400 to-cyan-600 rounded-full" style={{ width: '45%' }} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Projects Sidebar */}
        <div className="col-span-12 md:col-span-4 lg:col-span-3">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-slate-800">Projects</h2>
              <Button 
                size="sm"
                onClick={() => setShowCreateDialog(true)}
                className="bg-indigo-600 hover:bg-indigo-700 h-8"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-2">
              {projects.length === 0 ? (
                <div className="text-center py-8">
                  <FolderOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm text-slate-500">No projects yet</p>
                </div>
              ) : (
                projects.map((project) => (
                  <div
                    key={project.id}
                    className={`p-3 rounded-xl cursor-pointer transition-all group ${
                      selectedProject?.id === project.id 
                        ? 'bg-indigo-50 border-2 border-indigo-300' 
                        : 'bg-slate-50 hover:bg-slate-100 border-2 border-transparent'
                    }`}
                    onClick={() => fetchProjectDetail(project.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div 
                          className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${project.color}20` }}
                        >
                          <FolderOpen className="w-4 h-4" style={{ color: project.color }} />
                        </div>
                        <div>
                          <span className="font-medium text-slate-800 text-sm">{project.name}</span>
                          <p className="text-xs text-slate-500">
                            {project.totalCount} items
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => { e.stopPropagation(); openEditDialog(project); }}
                          className="p-1.5 hover:bg-white rounded-lg"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); openDeleteDialog(project); }}
                          className="p-1.5 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-500" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {projects.length > 0 && (
              <Button 
                variant="outline"
                onClick={() => setShowCreateDialog(true)}
                className="w-full mt-4 border-dashed border-slate-300 text-slate-600 hover:bg-slate-50"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Project
              </Button>
            )}
          </div>
        </div>

        {/* Project Detail */}
        <div className="col-span-12 md:col-span-8 lg:col-span-9">
          {loadingDetail ? (
            <div className="flex items-center justify-center h-96">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
          ) : selectedProject ? (
            <div className="space-y-6">
              {/* Project Header Card */}
              <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl p-6 text-white">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">{selectedProject.name}</h2>
                    <p className="text-white/80 mt-1">
                      {selectedProject.description || 'Organize all your Google Ads campaigns in one place'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="secondary" 
                      size="sm"
                      onClick={() => openEditDialog(selectedProject as any)}
                      className="bg-white/20 hover:bg-white/30 text-white border-0"
                    >
                      <Edit2 className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                  </div>
                </div>
                
                {/* Stats Row - Clickable Filters */}
                <div className="grid grid-cols-4 gap-4 mt-6">
                  <button
                    onClick={() => setActiveFilter(activeFilter === 'campaign' ? 'all' : 'campaign')}
                    className={`bg-white/10 backdrop-blur rounded-xl p-4 text-center cursor-pointer transition-all hover:bg-white/20 ${
                      activeFilter === 'campaign' ? 'ring-2 ring-white bg-white/25' : ''
                    }`}
                  >
                    <div className="text-3xl font-bold">{selectedProject.counts.campaigns}</div>
                    <div className="text-white/70 text-sm">Campaigns</div>
                  </button>
                  <button
                    onClick={() => setActiveFilter(activeFilter === 'keyword-list' ? 'all' : 'keyword-list')}
                    className={`bg-white/10 backdrop-blur rounded-xl p-4 text-center cursor-pointer transition-all hover:bg-white/20 ${
                      activeFilter === 'keyword-list' ? 'ring-2 ring-white bg-white/25' : ''
                    }`}
                  >
                    <div className="text-3xl font-bold">{selectedProject.counts.keywordLists}</div>
                    <div className="text-white/70 text-sm">Keyword Lists</div>
                  </button>
                  <button
                    onClick={() => setActiveFilter(activeFilter === 'negative-keywords' ? 'all' : 'negative-keywords')}
                    className={`bg-white/10 backdrop-blur rounded-xl p-4 text-center cursor-pointer transition-all hover:bg-white/20 ${
                      activeFilter === 'negative-keywords' ? 'ring-2 ring-white bg-white/25' : ''
                    }`}
                  >
                    <div className="text-3xl font-bold">{selectedProject.counts.negativeKeywords}</div>
                    <div className="text-white/70 text-sm">Negative Lists</div>
                  </button>
                  <button
                    onClick={() => setActiveFilter('all')}
                    className={`bg-white/10 backdrop-blur rounded-xl p-4 text-center cursor-pointer transition-all hover:bg-white/20 ${
                      activeFilter === 'all' ? 'ring-2 ring-white bg-white/25' : ''
                    }`}
                  >
                    <div className="text-3xl font-bold">{selectedProject.counts.total}</div>
                    <div className="text-white/70 text-sm">Total Items</div>
                  </button>
                </div>
              </div>

              {/* Connected Modules Grid */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-800">Connected Modules</h3>
                  {activeFilter !== 'all' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setActiveFilter('all')}
                      className="text-xs"
                    >
                      <X className="w-3 h-3 mr-1" />
                      Clear Filter
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(MODULE_CONFIG)
                    .filter(([key]) => {
                      if (activeFilter === 'all') return true;
                      return key === activeFilter;
                    })
                    .map(([key, config]) => {
                    const Icon = config.icon;
                    const count = config.itemTypes.reduce((sum, type) => 
                      sum + (selectedProject.items[type]?.length || 0), 0
                    );
                    return (
                      <div
                        key={key}
                        onClick={() => {
                          const filterableTypes: FilterType[] = ['campaign', 'keyword-list', 'negative-keywords'];
                          if (filterableTypes.includes(key as FilterType)) {
                            setActiveFilter(key as FilterType);
                          }
                        }}
                        className={`bg-white rounded-2xl p-5 shadow-sm border transition-all cursor-pointer group ${
                          activeFilter === key 
                            ? 'border-indigo-300 ring-2 ring-indigo-100' 
                            : 'border-slate-100 hover:shadow-md'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center`}>
                            <Icon className="w-6 h-6 text-white" />
                          </div>
                          <ArrowUpRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <h4 className="font-semibold text-slate-800">{config.label}</h4>
                        <p className="text-sm text-slate-500 mt-1">
                          {count > 0 ? `${count} linked` : config.badge === 'Soon' ? 'Coming soon' : 'No items yet'}
                        </p>
                        <Badge 
                          className={`mt-3 ${
                            config.badge === 'Active' ? 'bg-emerald-100 text-emerald-700 border-0' :
                            config.badge === 'New' ? 'bg-violet-100 text-violet-700 border-0' :
                            'bg-amber-100 text-amber-700 border-0'
                          }`}
                        >
                          {config.badge}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Campaigns List */}
              {(activeFilter === 'all' || activeFilter === 'campaign') && 
               selectedProject.items.campaign && selectedProject.items.campaign.length > 0 && (
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                  <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                      <Zap className="w-4 h-4 text-orange-500" />
                    </div>
                    Campaigns in This Project ({selectedProject.items.campaign.length})
                  </h3>
                  <div className="space-y-3">
                    {selectedProject.items.campaign.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center">
                            <Zap className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h4 className="font-medium text-slate-800">
                              {item.itemName || 'Unnamed Campaign'}
                            </h4>
                            <p className="text-xs text-slate-500">
                              Created {new Date(item.createdAt).toLocaleDateString()}
                              {item.itemMetadata?.adGroupCount && ` • ${item.itemMetadata.adGroupCount} ad groups`}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="border-slate-200">View</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Keyword Lists - combine all keyword-related item types */}
              {(() => {
                const keywordTypes = ['keyword-list', 'keyword_list', 'keyword-planner', 'keyword-mixer', 'long-tail-keywords'];
                const allKeywordItems = keywordTypes.flatMap(type => selectedProject.items[type] || []);
                if ((activeFilter === 'all' || activeFilter === 'keyword-list') && allKeywordItems.length > 0) {
                  return (
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                      <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
                          <Key className="w-4 h-4 text-violet-500" />
                        </div>
                        Keyword Lists in This Project ({allKeywordItems.length})
                      </h3>
                      <div className="space-y-3">
                        {allKeywordItems.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                                <Key className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <h4 className="font-medium text-slate-800">
                                  {item.itemName || 'Unnamed Keyword List'}
                                </h4>
                                <p className="text-xs text-slate-500">
                                  Created {new Date(item.createdAt).toLocaleDateString()}
                                  {item.itemMetadata?.keywordCount && ` • ${item.itemMetadata.keywordCount} keywords`}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" className="border-slate-200">View</Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

              {/* Negative Keywords - combine all negative-related item types */}
              {(() => {
                const negativeTypes = ['negative-keywords', 'negative_keywords'];
                const allNegativeItems = negativeTypes.flatMap(type => selectedProject.items[type] || []);
                if ((activeFilter === 'all' || activeFilter === 'negative-keywords') && allNegativeItems.length > 0) {
                  return (
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                      <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center">
                          <MinusCircle className="w-4 h-4 text-rose-500" />
                        </div>
                        Negative Keyword Lists in This Project ({allNegativeItems.length})
                      </h3>
                      <div className="space-y-3">
                        {allNegativeItems.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center">
                                <MinusCircle className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <h4 className="font-medium text-slate-800">
                                  {item.itemName || 'Unnamed Negative List'}
                                </h4>
                                <p className="text-xs text-slate-500">
                                  Created {new Date(item.createdAt).toLocaleDateString()}
                                  {item.itemMetadata?.keywordCount && ` • ${item.itemMetadata.keywordCount} negatives`}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" className="border-slate-200">View</Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

              {selectedProject.counts.total === 0 && (
                <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-slate-100">
                  <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <FolderOpen className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-800 mb-2">No items in this project</h3>
                  <p className="text-slate-500 mb-6 max-w-md mx-auto">
                    Start by creating a campaign or keyword list and assign it to this project for better organization.
                  </p>
                  <Button 
                    className="bg-indigo-600 hover:bg-indigo-700"
                    onClick={() => window.location.href = '/campaign-builder'}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Campaign
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-slate-100">
              <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <FolderOpen className="w-10 h-10 text-indigo-500" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-2">Create Your First Project</h3>
              <p className="text-slate-500 mb-6 max-w-md mx-auto">
                Projects help you organize campaigns, keywords, and settings. Start by creating your first project.
              </p>
              <Button 
                onClick={() => setShowCreateDialog(true)}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Project
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Project Name</label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g., E-Commerce Store"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Description (optional)</label>
              <Input
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="e.g., All campaigns for my online store"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <Palette className="w-4 h-4" />
                Color
              </label>
              <div className="flex gap-2 mt-2 flex-wrap">
                {PROJECT_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setFormColor(color)}
                    className={`w-8 h-8 rounded-full transition-all ${
                      formColor === color ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110' : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                  >
                    {formColor === color && (
                      <Check className="w-4 h-4 text-white mx-auto" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving || !formName.trim()} className="bg-indigo-600 hover:bg-indigo-700">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Create Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Project Name</label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g., E-Commerce Store"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Description (optional)</label>
              <Input
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="e.g., All campaigns for my online store"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <Palette className="w-4 h-4" />
                Color
              </label>
              <div className="flex gap-2 mt-2 flex-wrap">
                {PROJECT_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setFormColor(color)}
                    className={`w-8 h-8 rounded-full transition-all ${
                      formColor === color ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110' : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                  >
                    {formColor === color && (
                      <Check className="w-4 h-4 text-white mx-auto" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={saving || !formName.trim()} className="bg-indigo-600 hover:bg-indigo-700">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-slate-600">
              Are you sure you want to delete <strong>{editingProject?.name}</strong>? 
              This will unlink all campaigns and keywords from this project. This action cannot be undone.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
            <Button 
              onClick={handleDelete} 
              disabled={saving}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
              Delete Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default WorkspaceProjects;
