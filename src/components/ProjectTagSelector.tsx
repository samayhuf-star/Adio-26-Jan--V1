import { useState, useEffect, useRef } from 'react';
import { useAuthCompat } from "../utils/authCompat"';
import { Tag, Plus, Check, X, Search, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './ui/popover';
import { toast } from 'sonner';

interface Project {
  id: string;
  name: string;
  color: string;
}

interface ProjectTagSelectorProps {
  itemType: string;
  itemId: string;
  itemName: string;
  itemMetadata?: Record<string, any>;
  linkedProjects?: { id: string; name: string; color: string }[];
  onProjectsChange?: (projects: { id: string; name: string; color: string }[]) => void;
  size?: 'sm' | 'md';
}

const PROJECT_COLORS = [
  '#8B5CF6', '#EC4899', '#10B981', '#F59E0B', '#3B82F6',
  '#6366F1', '#14B8A6', '#F97316', '#EF4444', '#84CC16'
];

export function ProjectTagSelector({
  itemType,
  itemId,
  itemName,
  itemMetadata,
  linkedProjects = [],
  onProjectsChange,
  size = 'md'
}: ProjectTagSelectorProps) {
  const { getToken } = useAuthCompat();
  const [open, setOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<Project[]>(linkedProjects);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [creating, setCreating] = useState(false);
  const [linking, setLinking] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [linkError, setLinkError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasFetched = useRef(false);

  // Fetch linked projects for this item on mount
  useEffect(() => {
    if (!hasFetched.current && itemId) {
      hasFetched.current = true;
      fetchLinkedProjects();
    }
  }, [itemId]);

  useEffect(() => {
    if (linkedProjects.length > 0) {
      setSelectedProjects(linkedProjects);
    }
  }, [linkedProjects]);

  useEffect(() => {
    if (open) {
      fetchProjects();
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const fetchLinkedProjects = async () => {
    try {
      setInitialLoading(true);
      const token = await getToken();
      if (!token) return;
      
      const response = await fetch(`/api/item-projects/${encodeURIComponent(itemType)}/${encodeURIComponent(itemId)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) return;
      
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        setSelectedProjects(data.data);
      }
    } catch (err) {
      console.error('Error fetching linked projects:', err);
    } finally {
      setInitialLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setFetchError(null);
      const token = await getToken();
      if (!token) {
        setFetchError('Authentication required');
        return;
      }
      
      const response = await fetch('/api/workspace-projects', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json().catch(() => ({}));
          setFetchError(errorData.error || `Failed to load projects (${response.status})`);
        } else {
          setFetchError(`Server error (${response.status}). Please try again.`);
        }
        return;
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        setFetchError('Invalid response format from server. Please try again.');
        return;
      }
      
      const data = await response.json();
      if (data.success) {
        setProjects(data.data);
        setFetchError(null);
      } else {
        setFetchError(data.error || 'Failed to load projects');
      }
    } catch (err) {
      console.error('Error fetching projects:', err);
      setFetchError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const retryToggle = (project: Project) => {
    setLinkError(null);
    setFetchError(null);
    toggleProject(project);
  };

  const toggleProject = async (project: Project) => {
    if (fetchError || linkError) return; // Prevent clicks during error state
    
    const isSelected = selectedProjects.some(p => p.id === project.id);
    
    try {
      setLinking(project.id);
      setLinkError(null);
      const token = await getToken();
      
      if (!token) {
        setLinkError('Authentication required');
        toast.error('Please sign in to manage projects');
        return;
      }
      
      if (isSelected) {
        const deleteUrl = `/api/workspace-projects/${project.id}/items/${encodeURIComponent(itemId)}${itemType ? `?itemType=${encodeURIComponent(itemType)}` : ''}`;
        const response = await fetch(deleteUrl, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMsg = errorData.error || 'Failed to remove project';
          setLinkError(errorMsg);
          toast.error(errorMsg, {
            action: {
              label: 'Retry',
              onClick: () => retryToggle(project)
            }
          });
          return;
        }
        
        const data = await response.json();
        if (data.success) {
          const updated = selectedProjects.filter(p => p.id !== project.id);
          setSelectedProjects(updated);
          onProjectsChange?.(updated);
          toast.success(`Removed from ${project.name}`);
        } else {
          setLinkError(data.error || 'Failed to remove project');
          toast.error(data.error || 'Failed to remove project');
        }
      } else {
        const response = await fetch(`/api/workspace-projects/${project.id}/items`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            itemType,
            itemId,
            itemName,
            ...(itemMetadata && { itemMetadata })
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMsg = errorData.error || 'Failed to add project';
          setLinkError(errorMsg);
          toast.error(errorMsg, {
            action: {
              label: 'Retry',
              onClick: () => retryToggle(project)
            }
          });
          return;
        }
        
        const data = await response.json();
        if (data.success) {
          const updated = [...selectedProjects, project];
          setSelectedProjects(updated);
          onProjectsChange?.(updated);
          toast.success(`Added to ${project.name}`);
        } else {
          setLinkError(data.error || 'Failed to add project');
          toast.error(data.error || 'Failed to add project');
        }
      }
    } catch (err) {
      console.error('Error toggling project:', err);
      const errorMsg = 'Network error. Please try again.';
      setLinkError(errorMsg);
      toast.error(errorMsg, {
        action: {
          label: 'Retry',
          onClick: () => retryToggle(project)
        }
      });
    } finally {
      setLinking(null);
    }
  };

  const createAndLink = async () => {
    if (!searchQuery.trim()) return;
    if (fetchError || linkError) return;
    
    try {
      setCreating(true);
      setLinkError(null);
      const token = await getToken();
      
      if (!token) {
        toast.error('Please sign in to create projects');
        return;
      }
      
      const randomColor = PROJECT_COLORS[Math.floor(Math.random() * PROJECT_COLORS.length)];
      
      const createResponse = await fetch('/api/workspace-projects', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          name: searchQuery.trim(),
          color: randomColor
        })
      });
      
      if (!createResponse.ok) {
        const errorData = await createResponse.json().catch(() => ({}));
        toast.error(errorData.error || 'Failed to create project');
        return;
      }
      
      const createData = await createResponse.json();
      
      if (createData.success) {
        const newProject = createData.data;
        setProjects(prev => [...prev, newProject]);
        
        const linkResponse = await fetch(`/api/workspace-projects/${newProject.id}/items`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            itemType,
            itemId,
            itemName,
            ...(itemMetadata && { itemMetadata })
          })
        });
        
        if (!linkResponse.ok) {
          const errorData = await linkResponse.json().catch(() => ({}));
          toast.error(errorData.error || 'Project created but failed to link');
          return;
        }
        
        const linkData = await linkResponse.json();
        
        if (linkData.success) {
          const updated = [...selectedProjects, newProject];
          setSelectedProjects(updated);
          onProjectsChange?.(updated);
          toast.success(`Created and added to ${newProject.name}`);
        }
        
        setSearchQuery('');
      } else {
        toast.error(createData.error || 'Failed to create project');
      }
    } catch (err) {
      console.error('Error creating project:', err);
      toast.error('Network error. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const removeProject = async (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    await toggleProject(project);
  };

  const handleRetry = () => {
    setFetchError(null);
    setLinkError(null);
    fetchProjects();
  };

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const showCreateOption = searchQuery.trim() && 
    !filteredProjects.some(p => p.name.toLowerCase() === searchQuery.toLowerCase().trim());

  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';
  const tagSize = size === 'sm' ? 'text-xs px-1.5 py-0.5' : 'text-sm px-2 py-0.5';
  
  const hasError = fetchError || linkError;
  const isDisabled = loading || !!hasError;

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {selectedProjects.map(project => (
        <span
          key={project.id}
          className={`inline-flex items-center gap-1 rounded-full border ${tagSize}`}
          style={{ 
            backgroundColor: `${project.color}15`,
            borderColor: `${project.color}40`,
            color: project.color
          }}
        >
          <span 
            className="w-2 h-2 rounded-full" 
            style={{ backgroundColor: project.color }}
          />
          <span className="font-medium">{project.name}</span>
          <button
            onClick={(e) => removeProject(e, project)}
            disabled={linking === project.id}
            className="ml-0.5 hover:opacity-70 transition-opacity disabled:opacity-50"
          >
            {linking === project.id ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <X className="w-3 h-3" />
            )}
          </button>
        </span>
      ))}
      
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
            }}
            className={`${size === 'sm' ? 'h-6 px-1.5' : 'h-7 px-2'} text-slate-500 hover:text-slate-700 hover:bg-slate-100`}
          >
            <Tag className={iconSize} />
            {selectedProjects.length === 0 && (
              <span className={`ml-1 ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>+ Add project</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-2" align="start">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              ref={inputRef}
              placeholder="Search or create..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && showCreateOption && !isDisabled) {
                  createAndLink();
                }
              }}
              disabled={isDisabled}
              className="pl-8 h-9"
            />
          </div>
          
          <div className="mt-2 max-h-48 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
              </div>
            ) : fetchError ? (
              <div className="flex flex-col items-center justify-center py-4 px-2 text-center">
                <AlertCircle className="w-6 h-6 text-red-400 mb-2" />
                <p className="text-sm text-red-600 mb-2">{fetchError}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRetry}
                  className="text-xs"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Retry
                </Button>
              </div>
            ) : (
              <>
                {linkError && (
                  <div className="flex items-center gap-2 px-2 py-1.5 mb-2 bg-red-50 border border-red-200 rounded-md">
                    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                    <p className="text-xs text-red-600 flex-1">{linkError}</p>
                    <button
                      onClick={() => setLinkError(null)}
                      className="text-red-400 hover:text-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
                
                {showCreateOption && (
                  <button
                    onClick={createAndLink}
                    disabled={creating || !!linkError}
                    className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-left hover:bg-slate-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {creating ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4 text-indigo-500" />
                    )}
                    <span>
                      + Add "<span className="font-medium">{searchQuery}</span>" to projects
                    </span>
                  </button>
                )}
                
                {filteredProjects.length === 0 && !showCreateOption ? (
                  <p className="text-sm text-slate-500 text-center py-3">
                    Type to add a new project
                  </p>
                ) : (
                  filteredProjects.map(project => {
                    const isSelected = selectedProjects.some(p => p.id === project.id);
                    const isLinking = linking === project.id;
                    const isItemDisabled = isLinking || !!linkError;
                    
                    return (
                      <button
                        key={project.id}
                        onClick={() => toggleProject(project)}
                        disabled={isItemDisabled}
                        className="w-full flex items-center justify-between px-2 py-1.5 text-sm text-left hover:bg-slate-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <div className="flex items-center gap-2">
                          <span 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: project.color }}
                          />
                          <span>{project.name}</span>
                        </div>
                        {isLinking ? (
                          <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                        ) : isSelected ? (
                          <Check className="w-4 h-4 text-indigo-500" />
                        ) : null}
                      </button>
                    );
                  })
                )}
              </>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
