import { useState, useEffect } from 'react';
import { useAuth } from '../../utils/authCompat';
import { FolderOpen, Plus, Check, ChevronDown, Loader2, X } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './ui/popover';

interface Project {
  id: string;
  name: string;
  color: string;
  icon: string;
}

interface ProjectSelectProps {
  value: string | null;
  onChange: (projectId: string | null, projectName?: string) => void;
  onLinkItem?: (projectId: string) => Promise<void>;
  itemType?: string;
  itemId?: string;
  itemName?: string;
  className?: string;
  placeholder?: string;
}

export function ProjectSelect({
  value,
  onChange,
  onLinkItem,
  itemType,
  itemId,
  itemName,
  className = '',
  placeholder = 'Select project...'
}: ProjectSelectProps) {
  const { getToken } = useAuthCompat();
  const [open, setOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showCreateInput, setShowCreateInput] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [saving, setSaving] = useState(false);

  const selectedProject = projects.find(p => p.id === value);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      if (!token) return;
      
      const response = await fetch('/api/workspace-projects', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          await response.json().catch(() => ({}));
        }
        console.error('Failed to fetch projects:', response.status);
        return;
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('Invalid response format from server');
        return;
      }
      
      const data = await response.json();
      if (data.success) {
        setProjects(data.data);
      }
    } catch (err) {
      console.error('Error fetching projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;
    try {
      setSaving(true);
      const token = await getToken();
      const response = await fetch('/api/workspace-projects', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: newProjectName })
      });
      const data = await response.json();
      if (data.success) {
        const newProject = data.data;
        setProjects(prev => [...prev, newProject]);
        onChange(newProject.id, newProject.name);
        setNewProjectName('');
        setShowCreateInput(false);
        
        if (onLinkItem && itemType && itemId) {
          await onLinkItem(newProject.id);
        }
      }
    } catch (err) {
      console.error('Error creating project:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleSelect = async (projectId: string | null) => {
    const project = projects.find(p => p.id === projectId);
    onChange(projectId, project?.name);
    setOpen(false);
    
    if (projectId && onLinkItem && itemType && itemId) {
      await onLinkItem(projectId);
    }
  };

  useEffect(() => {
    if (open) {
      fetchProjects();
    }
  }, [open]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={`w-full justify-between ${className}`}
        >
          <div className="flex items-center gap-2">
            {selectedProject ? (
              <>
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: selectedProject.color }}
                />
                <span>{selectedProject.name}</span>
              </>
            ) : (
              <>
                <FolderOpen className="w-4 h-4 text-slate-400" />
                <span className="text-slate-500">{placeholder}</span>
              </>
            )}
          </div>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <div className="p-2 border-b">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-700 px-2 py-1">
            <FolderOpen className="w-4 h-4" />
            Projects
          </div>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center p-4">
            <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
          </div>
        ) : (
          <div className="max-h-[250px] overflow-y-auto p-1">
            {value && (
              <button
                onClick={() => handleSelect(null)}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-md"
              >
                <X className="w-4 h-4" />
                Clear selection
              </button>
            )}
            
            {projects.length === 0 && !showCreateInput && (
              <div className="text-center py-4 text-sm text-slate-500">
                No projects yet. Create one below.
              </div>
            )}
            
            {projects.map((project) => (
              <button
                key={project.id}
                onClick={() => handleSelect(project.id)}
                className={`flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md transition-colors ${
                  value === project.id 
                    ? 'bg-indigo-50 text-indigo-700' 
                    : 'hover:bg-slate-100 text-slate-700'
                }`}
              >
                <div 
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: project.color }}
                />
                <span className="flex-1 text-left truncate">{project.name}</span>
                {value === project.id && (
                  <Check className="w-4 h-4 text-indigo-600" />
                )}
              </button>
            ))}
          </div>
        )}
        
        <div className="p-2 border-t">
          {showCreateInput ? (
            <div className="flex gap-2">
              <Input
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="Project name..."
                className="h-8 text-sm"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateProject();
                  if (e.key === 'Escape') {
                    setShowCreateInput(false);
                    setNewProjectName('');
                  }
                }}
              />
              <Button 
                size="sm" 
                onClick={handleCreateProject}
                disabled={saving || !newProjectName.trim()}
                className="h-8"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add'}
              </Button>
              <Button 
                size="sm" 
                variant="ghost"
                onClick={() => {
                  setShowCreateInput(false);
                  setNewProjectName('');
                }}
                className="h-8 px-2"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCreateInput(true)}
              className="w-full justify-start text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create new project
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default ProjectSelect;
