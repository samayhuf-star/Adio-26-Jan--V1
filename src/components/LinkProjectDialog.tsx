import { useState, useEffect } from 'react';
import { useAuth } from '../../utils/authCompat';
import { FolderOpen, Plus, Check, Loader2, X, Link } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { notifications } from '../utils/notifications';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';

interface Project {
  id: string;
  name: string;
  color: string;
  icon: string;
}

interface LinkProjectDialogProps {
  itemType: string;
  itemId: string;
  itemName: string;
  itemMetadata?: Record<string, any>;
  currentProjectId?: string | null;
  currentProjectName?: string | null;
  onLinked?: (projectId: string, projectName: string) => void;
  triggerClassName?: string;
  variant?: 'button' | 'link' | 'icon';
}

export function LinkProjectDialog({
  itemType,
  itemId,
  itemName,
  itemMetadata,
  currentProjectId,
  currentProjectName,
  onLinked,
  triggerClassName = '',
  variant = 'button'
}: LinkProjectDialogProps) {
  const { getToken } = useAuthCompat();
  const [open, setOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateInput, setShowCreateInput] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [saving, setSaving] = useState(false);
  const [linking, setLinking] = useState<string | null>(null);
  const [linkedProjectId, setLinkedProjectId] = useState<string | null>(currentProjectId || null);
  const [linkedProjectName, setLinkedProjectName] = useState<string | null>(currentProjectName || null);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const response = await fetch('/api/workspace-projects', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
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

  const linkToProject = async (projectId: string) => {
    try {
      setLinking(projectId);
      const token = await getToken();
      const response = await fetch(`/api/workspace-projects/${projectId}/items`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          itemType: itemType,
          itemId: itemId,
          itemName: itemName,
          ...(itemMetadata && { itemMetadata })
        })
      });
      const data = await response.json();
      if (data.success) {
        const project = projects.find(p => p.id === projectId);
        if (project) {
          setLinkedProjectId(projectId);
          setLinkedProjectName(project.name);
          onLinked?.(projectId, project.name);
        }
        setOpen(false);
      } else {
        console.error('Error linking to project:', data.error);
        notifications.error(data.error || 'Failed to add to project');
      }
    } catch (err: any) {
      console.error('Error linking to project:', err);
      notifications.error(err.message || 'Failed to add to project');
    } finally {
      setLinking(null);
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
        setNewProjectName('');
        setShowCreateInput(false);
        await linkToProject(newProject.id);
      }
    } catch (err) {
      console.error('Error creating project:', err);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchProjects();
    }
  }, [open]);

  const TriggerButton = () => {
    if (linkedProjectId && linkedProjectName) {
      return (
        <Button
          variant="outline"
          size="sm"
          className={`gap-2 ${triggerClassName}`}
        >
          <div 
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: projects.find(p => p.id === linkedProjectId)?.color || '#6366f1' }}
          />
          <span className="text-slate-700">{linkedProjectName}</span>
        </Button>
      );
    }

    if (variant === 'icon') {
      return (
        <Button
          variant="ghost"
          size="sm"
          className={`gap-1 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 ${triggerClassName}`}
        >
          <Link className="w-4 h-4" />
        </Button>
      );
    }

    if (variant === 'link') {
      return (
        <button className={`text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1 ${triggerClassName}`}>
          <Link className="w-3.5 h-3.5" />
          Link Project...
        </button>
      );
    }

    return (
      <Button
        variant="outline"
        size="sm"
        className={`gap-2 text-indigo-600 border-indigo-200 hover:bg-indigo-50 hover:border-indigo-300 ${triggerClassName}`}
      >
        <Link className="w-4 h-4" />
        Link Project...
      </Button>
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <TriggerButton />
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-indigo-600" />
            Link to Project
          </DialogTitle>
          <DialogDescription>
            Choose a project to organize this {itemType.replace(/_/g, ' ')}.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            </div>
          ) : (
            <div className="space-y-2">
              {projects.length === 0 && !showCreateInput ? (
                <div className="text-center py-6 text-sm text-slate-500">
                  <FolderOpen className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                  No projects yet. Create your first one below.
                </div>
              ) : (
                <div className="max-h-[250px] overflow-y-auto space-y-1">
                  {projects.map((project) => (
                    <button
                      key={project.id}
                      onClick={() => linkToProject(project.id)}
                      disabled={linking !== null}
                      className={`flex items-center gap-3 w-full px-3 py-2.5 text-sm rounded-lg transition-colors ${
                        linkedProjectId === project.id
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          : 'hover:bg-slate-100 text-slate-700 border border-transparent'
                      }`}
                    >
                      <div 
                        className="w-4 h-4 rounded-full shrink-0"
                        style={{ backgroundColor: project.color }}
                      />
                      <span className="flex-1 text-left truncate font-medium">{project.name}</span>
                      {linking === project.id ? (
                        <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                      ) : linkedProjectId === project.id ? (
                        <Check className="w-4 h-4 text-indigo-600" />
                      ) : null}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="mt-4 pt-4 border-t">
            {showCreateInput ? (
              <div className="flex gap-2">
                <Input
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="New project name..."
                  className="h-9"
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
                  className="h-9 bg-indigo-600 hover:bg-indigo-700"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create'}
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={() => {
                    setShowCreateInput(false);
                    setNewProjectName('');
                  }}
                  className="h-9 px-2"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCreateInput(true)}
                className="w-full justify-center text-indigo-600 border-indigo-200 hover:bg-indigo-50"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create New Project
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default LinkProjectDialog;
