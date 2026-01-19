import { useState, useEffect } from 'react';
import { useAuthCompat } from "../utils/authCompat"';
import { FolderOpen, Plus, Check, Loader2, X } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './ui/popover';
import { notifications } from '../utils/notifications';

interface Project {
  id: string;
  name: string;
  color: string;
  icon?: string;
}

interface ProjectMultiSelectProps {
  itemType: 'campaign' | 'keyword-list';
  itemId: string;
  assignedProjects?: Project[];
  onSave?: (projects: Project[]) => void;
  className?: string;
  triggerClassName?: string;
}

export function ProjectMultiSelect({
  itemType,
  itemId,
  assignedProjects = [],
  onSave,
  className = '',
  triggerClassName = ''
}: ProjectMultiSelectProps) {
  const { getToken } = useAuthCompat();
  const [open, setOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      fetchProjects();
      setSelectedIds(new Set(assignedProjects.map(p => p.id)));
    }
  }, [open, assignedProjects]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = await getToken();
      const response = await fetch('/api/workspace-projects', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setProjects(data.data);
      } else {
        setError('Failed to load projects');
      }
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;
    try {
      setCreating(true);
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
        setSelectedIds(prev => new Set([...prev, newProject.id]));
        setNewProjectName('');
        notifications.success(`Project "${newProject.name}" created`);
      } else {
        notifications.error('Failed to create project');
      }
    } catch (err) {
      console.error('Error creating project:', err);
      notifications.error('Failed to create project');
    } finally {
      setCreating(false);
    }
  };

  const toggleProject = (projectId: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(projectId)) {
        newSet.delete(projectId);
      } else {
        newSet.add(projectId);
      }
      return newSet;
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const token = await getToken();
      
      const currentIds = new Set(assignedProjects.map(p => p.id));
      const toAdd = [...selectedIds].filter(id => !currentIds.has(id));
      const toRemove = [...currentIds].filter(id => !selectedIds.has(id));
      
      let hasErrors = false;

      for (const projectId of toAdd) {
        const response = await fetch(`/api/workspace-projects/${projectId}/items`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ itemType, itemId })
        });
        if (!response.ok) {
          hasErrors = true;
          console.error('Failed to add project:', projectId);
        }
      }

      for (const projectId of toRemove) {
        const response = await fetch(`/api/workspace-projects/${projectId}/items/${itemId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) {
          hasErrors = true;
          console.error('Failed to remove project:', projectId);
        }
      }

      if (hasErrors) {
        notifications.error('Some project changes failed to save');
      } else {
        const savedProjects = projects.filter(p => selectedIds.has(p.id));
        onSave?.(savedProjects);
        setOpen(false);
        notifications.success('Projects updated');
      }
    } catch (err) {
      console.error('Error saving projects:', err);
      notifications.error('Failed to save projects');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setSelectedIds(new Set(assignedProjects.map(p => p.id)));
    setNewProjectName('');
    setOpen(false);
  };

  const projectCount = assignedProjects.length;

  return (
    <div className={className}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={`gap-1.5 ${triggerClassName}`}
          >
            <FolderOpen className="w-4 h-4" />
            <span>Projects{projectCount > 0 ? ` (${projectCount})` : ''}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[320px] p-0" align="start">
          <div className="p-3 border-b bg-slate-50">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <FolderOpen className="w-4 h-4" />
              Add to Projects
            </div>
          </div>
          
          <div className="p-2 border-b">
            <div className="flex gap-2">
              <Input
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="Create new project..."
                className="h-8 text-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateProject();
                }}
              />
              <Button 
                size="sm" 
                onClick={handleCreateProject}
                disabled={creating || !newProjectName.trim()}
                className="h-8 px-3"
              >
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center p-6">
              <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
            </div>
          ) : error ? (
            <div className="p-4 text-center text-sm text-red-500">{error}</div>
          ) : (
            <div className="max-h-[200px] overflow-y-auto p-1">
              {projects.length === 0 ? (
                <div className="text-center py-4 text-sm text-slate-500">
                  No projects yet. Create one above.
                </div>
              ) : (
                projects.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => toggleProject(project.id)}
                    className="flex items-center gap-3 w-full px-3 py-2 text-sm rounded-md transition-colors hover:bg-slate-100"
                  >
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      selectedIds.has(project.id) 
                        ? 'bg-indigo-600 border-indigo-600' 
                        : 'border-slate-300 bg-white'
                    }`}>
                      {selectedIds.has(project.id) && (
                        <Check className="w-3 h-3 text-white" />
                      )}
                    </div>
                    <div 
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: project.color }}
                    />
                    <span className="flex-1 text-left truncate text-slate-700">{project.name}</span>
                  </button>
                ))
              )}
            </div>
          )}
          
          <div className="p-2 border-t bg-slate-50 flex gap-2 justify-end">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleCancel}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button 
              size="sm"
              onClick={handleSave}
              disabled={saving}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Save
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export function ProjectBadges({ projects }: { projects: Project[] }) {
  if (!projects || projects.length === 0) {
    return <span className="text-slate-400 text-sm">-</span>;
  }

  return (
    <div className="flex flex-wrap gap-1">
      {projects.slice(0, 3).map((project) => (
        <Badge
          key={project.id}
          variant="secondary"
          className="text-xs px-2 py-0.5 font-medium"
          style={{ 
            backgroundColor: `${project.color}20`,
            color: project.color,
            borderColor: project.color
          }}
        >
          {project.name}
        </Badge>
      ))}
      {projects.length > 3 && (
        <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600">
          +{projects.length - 3}
        </Badge>
      )}
    </div>
  );
}

export default ProjectMultiSelect;
