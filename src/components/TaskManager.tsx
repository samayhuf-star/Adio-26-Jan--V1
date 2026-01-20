import { useState, useEffect, useCallback } from 'react';
import { useAuthCompat } from '../utils/authCompat';
import {
  Plus, Check, Trash2, Edit2, FolderOpen, Calendar, Star, GripVertical,
  ChevronDown, ChevronRight, MoreHorizontal, Search, Filter, X, Inbox,
  CheckCircle2, Circle, Clock, AlertCircle, Menu, ChevronLeft, LayoutGrid, List, AlertTriangle
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from './ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog';
import { Textarea } from './ui/textarea';

interface Task {
  id: string;
  title: string;
  description: string;
  projectId: string | null;
  isToday: boolean;
  isCompleted: boolean;
  priority: 'low' | 'medium' | 'high';
  dueDate: string | null;
  order: number;
  createdAt: string;
  completedAt: string | null;
}

interface Project {
  id: string;
  name: string;
  color: string;
  order: number;
  createdAt: string;
}

const PROJECT_COLORS = [
  '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899',
  '#f43f5e', '#ef4444', '#f97316', '#eab308', '#84cc16',
  '#22c55e', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6'
];

export function TaskManager() {
  const { getToken } = useAuthCompat();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'today' | 'done' | 'allProjects'>('all');
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set(['inbox']));
  
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  
  const [newTask, setNewTask] = useState({ title: '', description: '', projectId: null as string | null, priority: 'medium' as 'low' | 'medium' | 'high', dueDate: '' });
  const [newProject, setNewProject] = useState({ name: '', color: PROJECT_COLORS[0] });
  
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [deleteConfirmStep, setDeleteConfirmStep] = useState<1 | 2>(1);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;

      const [tasksRes, projectsRes] = await Promise.all([
        fetch('/api/tasks', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/projects', { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (tasksRes.ok) {
        const tasksData = await tasksRes.json();
        const normalizedTasks = (tasksData.data || []).map((t: any) => ({
          ...t,
          id: String(t.id),
          projectId: t.projectId ? String(t.projectId) : null
        }));
        setTasks(normalizedTasks);
      }
      if (projectsRes.ok) {
        const projectsData = await projectsRes.json();
        const normalizedProjects = (projectsData.data || []).map((p: any) => ({
          ...p,
          id: String(p.id)
        }));
        setProjects(normalizedProjects);
      }
    } catch (error) {
      console.error('Failed to fetch tasks/projects:', error);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const [taskError, setTaskError] = useState<string | null>(null);
  const [savingTask, setSavingTask] = useState(false);

  const saveTask = async () => {
    try {
      setSavingTask(true);
      setTaskError(null);
      
      const token = await getToken();
      if (!token) {
        setTaskError('Authentication required. Please sign in again.');
        setSavingTask(false);
        return;
      }

      const url = editingTask ? `/api/tasks/${editingTask.id}` : '/api/tasks';
      const method = editingTask ? 'PUT' : 'POST';

      const taskData = {
        title: newTask.title,
        description: newTask.description,
        projectId: newTask.projectId ? parseInt(newTask.projectId, 10) : null,
        priority: newTask.priority,
        dueDate: newTask.dueDate || null,
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(taskData)
      });

      if (response.ok) {
        await fetchData();
        setIsTaskDialogOpen(false);
        setEditingTask(null);
        setNewTask({ title: '', description: '', projectId: null, priority: 'medium', dueDate: '' });
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        setTaskError(errorData.error || `Failed to save task (${response.status})`);
        console.error('Failed to save task:', response.status, errorData);
      }
    } catch (error: any) {
      setTaskError(error.message || 'Network error. Please try again.');
      console.error('Failed to save task:', error);
    } finally {
      setSavingTask(false);
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      const token = await getToken();
      if (!token) return;

      await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      setTasks(tasks.filter(t => t.id !== taskId));
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const toggleTaskComplete = async (task: Task) => {
    try {
      const token = await getToken();
      if (!token) return;

      await fetch(`/api/tasks/${task.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          isCompleted: !task.isCompleted,
          completedAt: !task.isCompleted ? new Date().toISOString() : null
        })
      });

      setTasks(tasks.map(t => 
        t.id === task.id 
          ? { ...t, isCompleted: !t.isCompleted, completedAt: !t.isCompleted ? new Date().toISOString() : null }
          : t
      ));
    } catch (error) {
      console.error('Failed to toggle task:', error);
    }
  };

  const toggleTaskToday = async (task: Task) => {
    try {
      const token = await getToken();
      if (!token) return;

      await fetch(`/api/tasks/${task.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ isToday: !task.isToday })
      });

      setTasks(tasks.map(t => 
        t.id === task.id ? { ...t, isToday: !t.isToday } : t
      ));
    } catch (error) {
      console.error('Failed to toggle today:', error);
    }
  };

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const saveProject = async () => {
    try {
      setSaving(true);
      setError(null);
      
      const token = await getToken();
      if (!token) {
        setError('Authentication required. Please sign in again.');
        setSaving(false);
        return;
      }

      const url = editingProject ? `/api/projects/${editingProject.id}` : '/api/projects';
      const method = editingProject ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newProject)
      });

      if (response.ok) {
        await fetchData();
        setIsProjectDialogOpen(false);
        setEditingProject(null);
        setNewProject({ name: '', color: PROJECT_COLORS[0] });
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        setError(errorData.error || `Failed to save project (${response.status})`);
        console.error('Failed to save project:', response.status, errorData);
      }
    } catch (error: any) {
      setError(error.message || 'Network error. Please try again.');
      console.error('Failed to save project:', error);
    } finally {
      setSaving(false);
    }
  };

  const openDeleteConfirmation = (project: Project) => {
    setProjectToDelete(project);
    setDeleteConfirmStep(1);
    setDeleteConfirmName('');
    setIsDeleteConfirmOpen(true);
  };

  const confirmDeleteProject = async () => {
    if (!projectToDelete) return;
    
    try {
      const token = await getToken();
      if (!token) return;

      await fetch(`/api/projects/${projectToDelete.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      setProjects(projects.filter(p => p.id !== projectToDelete.id));
      setTasks(tasks.map(t => t.projectId === projectToDelete.id ? { ...t, projectId: null } : t));
      if (selectedProject === projectToDelete.id) setSelectedProject(null);
      
      setIsDeleteConfirmOpen(false);
      setProjectToDelete(null);
      setDeleteConfirmStep(1);
      setDeleteConfirmName('');
    } catch (error) {
      console.error('Failed to delete project:', error);
    }
  };

  const deleteProject = async (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      openDeleteConfirmation(project);
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (activeFilter === 'today' && !task.isToday) return false;
    if (activeFilter === 'done' && !task.isCompleted) return false;
    if (activeFilter === 'all' && task.isCompleted) return false;
    if (selectedProject && task.projectId !== selectedProject) return false;
    if (selectedProject === null && activeFilter === 'all' && task.projectId !== null) {
      const showInbox = expandedProjects.has('inbox');
      if (!showInbox) return false;
    }
    return true;
  });

  const inboxTasks = tasks.filter(t => !t.projectId && !t.isCompleted);
  const todayTasks = tasks.filter(t => t.isToday && !t.isCompleted);
  const doneTasks = tasks.filter(t => t.isCompleted);

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetTaskId: string) => {
    e.preventDefault();
    if (!draggedTaskId || draggedTaskId === targetTaskId) return;

    const draggedIndex = tasks.findIndex(t => t.id === draggedTaskId);
    const targetIndex = tasks.findIndex(t => t.id === targetTaskId);
    
    const newTasks = [...tasks];
    const [removed] = newTasks.splice(draggedIndex, 1);
    newTasks.splice(targetIndex, 0, removed);
    
    setTasks(newTasks);
    setDraggedTaskId(null);
  };

  const openEditTask = (task: Task) => {
    setEditingTask(task);
    setNewTask({
      title: task.title,
      description: task.description,
      projectId: task.projectId,
      priority: task.priority,
      dueDate: task.dueDate || ''
    });
    setIsTaskDialogOpen(true);
  };

  const openEditProject = (project: Project) => {
    setEditingProject(project);
    setNewProject({ name: project.name, color: project.color });
    setIsProjectDialogOpen(true);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-green-500';
      default: return 'text-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const handleSidebarItemClick = (callback: () => void) => {
    callback();
    setIsMobileSidebarOpen(false);
  };

  return (
    <div className="h-full flex bg-gray-50 relative">
      {/* Mobile Overlay */}
      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/30 z-40 md:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar - Hidden on mobile, shown as overlay when toggled */}
      <div className={`
        fixed md:relative inset-y-0 left-0 z-50
        w-72 md:w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm
        transform transition-transform duration-300 ease-in-out
        ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Projects</h2>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsMobileSidebarOpen(false)}
            className="md:hidden h-8 w-8 p-0 text-gray-500 hover:text-gray-900"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2">
          {/* Quick Filters */}
          <div className="space-y-1 mb-4">
            <button
              onClick={() => handleSidebarItemClick(() => { setActiveFilter('allProjects'); setSelectedProject(null); })}
              className={`w-full flex items-center gap-3 px-3 py-3 md:py-2 rounded-lg transition-colors ${
                activeFilter === 'allProjects'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100 active:bg-gray-200'
              }`}
            >
              <FolderOpen className="w-5 h-5 md:w-4 md:h-4" />
              <span className="text-base md:text-sm">All Projects</span>
              {projects.length > 0 && (
                <Badge variant="secondary" className="ml-auto bg-gray-200 text-gray-700">{projects.length}</Badge>
              )}
            </button>
            
            <button
              onClick={() => handleSidebarItemClick(() => { setActiveFilter('all'); setSelectedProject(null); })}
              className={`w-full flex items-center gap-3 px-3 py-3 md:py-2 rounded-lg transition-colors ${
                activeFilter === 'all' && !selectedProject
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100 active:bg-gray-200'
              }`}
            >
              <Inbox className="w-5 h-5 md:w-4 md:h-4" />
              <span className="text-base md:text-sm">Inbox</span>
              {inboxTasks.length > 0 && (
                <Badge variant="secondary" className="ml-auto bg-gray-200 text-gray-700">{inboxTasks.length}</Badge>
              )}
            </button>
            
            <button
              onClick={() => handleSidebarItemClick(() => { setActiveFilter('today'); setSelectedProject(null); })}
              className={`w-full flex items-center gap-3 px-3 py-3 md:py-2 rounded-lg transition-colors ${
                activeFilter === 'today'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100 active:bg-gray-200'
              }`}
            >
              <Star className="w-5 h-5 md:w-4 md:h-4" />
              <span className="text-base md:text-sm">Today</span>
              {todayTasks.length > 0 && (
                <Badge variant="secondary" className="ml-auto bg-gray-200 text-gray-700">{todayTasks.length}</Badge>
              )}
            </button>
            
            <button
              onClick={() => handleSidebarItemClick(() => { setActiveFilter('done'); setSelectedProject(null); })}
              className={`w-full flex items-center gap-3 px-3 py-3 md:py-2 rounded-lg transition-colors ${
                activeFilter === 'done'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100 active:bg-gray-200'
              }`}
            >
              <CheckCircle2 className="w-5 h-5 md:w-4 md:h-4" />
              <span className="text-base md:text-sm">Done</span>
              {doneTasks.length > 0 && (
                <Badge variant="secondary" className="ml-auto bg-gray-200 text-gray-700">{doneTasks.length}</Badge>
              )}
            </button>
          </div>
          
          {/* Projects List */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center justify-between px-3 mb-2">
              <span className="text-sm font-medium text-gray-500">Projects</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => { setIsProjectDialogOpen(true); setIsMobileSidebarOpen(false); }}
                className="h-8 w-8 md:h-6 md:w-6 p-0 text-gray-500 hover:text-gray-900"
              >
                <Plus className="w-5 h-5 md:w-4 md:h-4" />
              </Button>
            </div>
            
            <div className="space-y-1">
              {projects.map(project => {
                const projectTasks = tasks.filter(t => t.projectId === project.id && !t.isCompleted);
                return (
                  <div key={project.id} className="group">
                    <button
                      onClick={() => handleSidebarItemClick(() => {
                        setSelectedProject(project.id);
                        setActiveFilter('all');
                      })}
                      className={`w-full flex items-center gap-3 px-3 py-3 md:py-2 rounded-lg transition-colors ${
                        selectedProject === project.id
                          ? 'bg-indigo-600 text-white'
                          : 'text-gray-700 hover:bg-gray-100 active:bg-gray-200'
                      }`}
                    >
                      <div
                        className="w-4 h-4 md:w-3 md:h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: project.color }}
                      />
                      <span className="flex-1 text-left truncate text-base md:text-sm">{project.name}</span>
                      {projectTasks.length > 0 && (
                        <Badge variant="secondary" className="text-xs">{projectTasks.length}</Badge>
                      )}
                      <div className="flex items-center gap-0.5 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e: React.MouseEvent) => { e.stopPropagation(); openEditProject(project); setIsMobileSidebarOpen(false); }}
                          className="h-7 w-7 md:h-6 md:w-6 p-0 text-gray-400 hover:text-indigo-600"
                          title="Edit Project"
                        >
                          <Edit2 className="w-4 h-4 md:w-3.5 md:h-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e: React.MouseEvent) => { e.stopPropagation(); deleteProject(project.id); }}
                          className="h-7 w-7 md:h-6 md:w-6 p-0 text-gray-400 hover:text-red-600"
                          title="Delete Project"
                        >
                          <Trash2 className="w-4 h-4 md:w-3.5 md:h-3.5" />
                        </Button>
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden w-full">
        <div className={`flex-1 flex flex-col overflow-hidden w-full mx-auto ${viewMode === 'kanban' && !selectedProject && activeFilter === 'all' ? 'max-w-full px-4' : 'max-w-3xl'}`}>
        {/* Header */}
        <div className="p-3 md:p-4 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between mb-3 md:mb-4 gap-2">
            {/* Mobile Menu Button */}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsMobileSidebarOpen(true)}
              className="md:hidden h-10 w-10 p-0 text-gray-500 hover:text-gray-900 flex-shrink-0"
            >
              <Menu className="w-6 h-6" />
            </Button>
            
            <h1 className="text-lg md:text-2xl font-bold text-gray-900 flex-1 truncate">
              {activeFilter === 'allProjects' ? 'All Projects' :
               activeFilter === 'today' ? 'Today' : 
               activeFilter === 'done' ? 'Completed' :
               selectedProject ? projects.find(p => p.id === selectedProject)?.name : 'Inbox'}
            </h1>
            
            {/* View Mode Toggle - only show on Inbox */}
            {!selectedProject && activeFilter === 'all' && (
              <div className="hidden sm:flex items-center border border-gray-300 rounded-lg overflow-hidden">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setViewMode('list')}
                  className={`h-9 px-3 rounded-none ${viewMode === 'list' ? 'bg-indigo-100 text-indigo-600' : 'text-gray-500'}`}
                >
                  <List className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setViewMode('kanban')}
                  className={`h-9 px-3 rounded-none ${viewMode === 'kanban' ? 'bg-indigo-100 text-indigo-600' : 'text-gray-500'}`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </Button>
              </div>
            )}
            
            {activeFilter === 'allProjects' ? (
              <Button
                onClick={() => {
                  setEditingProject(null);
                  setNewProject({ name: '', color: PROJECT_COLORS[0] });
                  setIsProjectDialogOpen(true);
                }}
                className="bg-indigo-600 hover:bg-indigo-700 h-10 px-3 md:px-4 flex-shrink-0"
                size="sm"
              >
                <Plus className="w-5 h-5 md:w-4 md:h-4" />
                <span className="hidden sm:inline ml-2">Add Project</span>
              </Button>
            ) : (
              <Button
                onClick={() => {
                  setNewTask({ ...newTask, projectId: selectedProject });
                  setEditingTask(null);
                  setIsTaskDialogOpen(true);
                }}
                className="bg-indigo-600 hover:bg-indigo-700 h-10 px-3 md:px-4 flex-shrink-0"
                size="sm"
              >
                <Plus className="w-5 h-5 md:w-4 md:h-4" />
                <span className="hidden sm:inline ml-2">Add Task</span>
              </Button>
            )}
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={activeFilter === 'allProjects' ? "Search projects..." : "Search tasks..."}
              className="pl-9 bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400 h-10"
            />
          </div>
        </div>
        
        {/* All Projects View */}
        {activeFilter === 'allProjects' ? (
          <div className="flex-1 overflow-y-auto p-3 md:p-4 bg-gray-50">
            {projects.filter(p => !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                <FolderOpen className="w-12 h-12 mb-4 text-gray-300" />
                <p className="text-lg font-medium">{projects.length === 0 ? 'No projects yet' : 'No matching projects'}</p>
                <p className="text-sm mt-1">{projects.length === 0 ? 'Create your first project to get started' : 'Try a different search term'}</p>
                {projects.length === 0 && (
                  <Button
                    onClick={() => {
                      setEditingProject(null);
                      setNewProject({ name: '', color: PROJECT_COLORS[0] });
                      setIsProjectDialogOpen(true);
                    }}
                    className="mt-4 bg-indigo-600 hover:bg-indigo-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Project
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 justify-items-start">
                {projects
                  .filter(p => !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(project => {
                    const projectTasks = tasks.filter(t => t.projectId === project.id);
                    const completedTasks = projectTasks.filter(t => t.isCompleted);
                    const pendingTasks = projectTasks.filter(t => !t.isCompleted);
                    return (
                      <div 
                        key={project.id}
                        className="bg-white rounded-xl border border-gray-200 p-4 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group"
                        onClick={() => {
                          setSelectedProject(project.id);
                          setActiveFilter('all');
                        }}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-4 h-4 rounded-full flex-shrink-0"
                              style={{ backgroundColor: project.color }}
                            />
                            <h3 className="font-semibold text-gray-900 truncate">{project.name}</h3>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e: React.MouseEvent) => { e.stopPropagation(); openEditProject(project); }}
                              className="h-8 w-8 p-0 text-gray-400 hover:text-indigo-600"
                              title="Edit Project"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e: React.MouseEvent) => { e.stopPropagation(); deleteProject(project.id); }}
                              className="h-8 w-8 p-0 text-gray-400 hover:text-red-600"
                              title="Delete Project"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Circle className="w-3 h-3" />
                            <span>{pendingTasks.length} pending</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-green-500" />
                            <span>{completedTasks.length} done</span>
                          </div>
                        </div>
                        {projectTasks.length > 0 && (
                          <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-green-500 rounded-full transition-all"
                              style={{ width: `${(completedTasks.length / projectTasks.length) * 100}%` }}
                            />
                          </div>
                        )}
                        <p className="text-xs text-gray-400 mt-3">
                          Created {new Date(project.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        ) : (
        
        /* Task List or Kanban View */
        <div className={`flex-1 overflow-y-auto p-3 md:p-4 bg-gray-50 ${viewMode === 'kanban' && !selectedProject && activeFilter === 'all' ? 'overflow-x-auto' : ''}`}>
          {/* Kanban View */}
          {viewMode === 'kanban' && !selectedProject && activeFilter === 'all' ? (
            <div className="flex gap-4 h-full min-w-max pb-4">
              {/* Inbox Column */}
              <div className="w-72 flex-shrink-0 bg-white rounded-lg border border-gray-200 flex flex-col max-h-full">
                <div className="p-3 border-b border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Inbox className="w-4 h-4 text-gray-500" />
                    <span className="font-medium text-gray-900">Inbox</span>
                    <Badge variant="secondary" className="bg-gray-100 text-gray-600">{inboxTasks.length}</Badge>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setNewTask({ ...newTask, projectId: null });
                      setEditingTask(null);
                      setIsTaskDialogOpen(true);
                    }}
                    className="h-7 w-7 p-0 text-gray-500 hover:text-gray-900"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                  {inboxTasks.filter(t => !searchQuery || t.title.toLowerCase().includes(searchQuery.toLowerCase())).map(task => (
                    <div
                      key={task.id}
                      onClick={() => openEditTask(task)}
                      className="p-3 bg-gray-50 rounded-lg border border-gray-100 hover:border-gray-300 hover:shadow-sm cursor-pointer transition-all"
                    >
                      <div className="flex items-start gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleTaskComplete(task); }}
                          className="mt-0.5 flex-shrink-0"
                        >
                          <Circle className={`w-4 h-4 ${getPriorityColor(task.priority)}`} />
                        </button>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium text-gray-900 line-clamp-2">{task.title}</span>
                          {task.dueDate && (
                            <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                              <Calendar className="w-3 h-3" />
                              {new Date(task.dueDate).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                        {task.isToday && <Star className="w-3 h-3 text-yellow-500 fill-yellow-500 flex-shrink-0" />}
                      </div>
                    </div>
                  ))}
                  {inboxTasks.filter(t => !searchQuery || t.title.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                    <div className="text-center text-gray-400 text-sm py-8">No tasks</div>
                  )}
                </div>
              </div>
              
              {/* Project Columns */}
              {projects.map(project => {
                const projectTasks = tasks.filter(t => t.projectId === project.id && !t.isCompleted);
                const filteredProjectTasks = projectTasks.filter(t => !searchQuery || t.title.toLowerCase().includes(searchQuery.toLowerCase()));
                return (
                  <div key={project.id} className="w-72 flex-shrink-0 bg-white rounded-lg border border-gray-200 flex flex-col max-h-full">
                    <div className="p-3 border-b border-gray-200 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: project.color }} />
                        <span className="font-medium text-gray-900 truncate max-w-[120px]">{project.name}</span>
                        <Badge variant="secondary" className="bg-gray-100 text-gray-600">{projectTasks.length}</Badge>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setNewTask({ ...newTask, projectId: project.id });
                            setEditingTask(null);
                            setIsTaskDialogOpen(true);
                          }}
                          className="h-7 w-7 p-0 text-gray-500 hover:text-gray-900"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-gray-500 hover:text-gray-900">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditProject(project)}>
                              <Edit2 className="w-4 h-4 mr-2" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-500" onClick={() => deleteProject(project.id)}>
                              <Trash2 className="w-4 h-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-2">
                      {filteredProjectTasks.map(task => (
                        <div
                          key={task.id}
                          onClick={() => openEditTask(task)}
                          className="p-3 bg-gray-50 rounded-lg border border-gray-100 hover:border-gray-300 hover:shadow-sm cursor-pointer transition-all"
                        >
                          <div className="flex items-start gap-2">
                            <button
                              onClick={(e) => { e.stopPropagation(); toggleTaskComplete(task); }}
                              className="mt-0.5 flex-shrink-0"
                            >
                              <Circle className={`w-4 h-4 ${getPriorityColor(task.priority)}`} />
                            </button>
                            <div className="flex-1 min-w-0">
                              <span className="text-sm font-medium text-gray-900 line-clamp-2">{task.title}</span>
                              {task.dueDate && (
                                <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                                  <Calendar className="w-3 h-3" />
                                  {new Date(task.dueDate).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                            {task.isToday && <Star className="w-3 h-3 text-yellow-500 fill-yellow-500 flex-shrink-0" />}
                          </div>
                        </div>
                      ))}
                      {filteredProjectTasks.length === 0 && (
                        <div className="text-center text-gray-400 text-sm py-8">No tasks</div>
                      )}
                    </div>
                  </div>
                );
              })}
              
              {/* Add Project Column */}
              <div 
                className="w-72 flex-shrink-0 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-colors"
                onClick={() => setIsProjectDialogOpen(true)}
              >
                <div className="text-center text-gray-500">
                  <Plus className="w-8 h-8 mx-auto mb-2" />
                  <span className="text-sm font-medium">Add Project</span>
                </div>
              </div>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 px-4">
              <CheckCircle2 className="w-12 h-12 md:w-16 md:h-16 mb-4 opacity-50" />
              <p className="text-base md:text-lg">No tasks here</p>
              <p className="text-sm text-center">Add a task to get started</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTasks.map(task => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={e => handleDragStart(e, task.id)}
                  onDragOver={handleDragOver}
                  onDrop={e => handleDrop(e, task.id)}
                  className={`group flex flex-col md:flex-row md:items-start gap-2 md:gap-3 p-3 md:p-4 rounded-lg bg-white border border-gray-200 hover:border-gray-300 hover:shadow-sm active:bg-gray-50 transition-all ${
                    draggedTaskId === task.id ? 'opacity-50' : ''
                  }`}
                >
                  {/* Task Main Content Row */}
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <GripVertical className="hidden md:block w-4 h-4 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity mt-1 flex-shrink-0" />
                    
                    <button
                      onClick={() => toggleTaskComplete(task)}
                      className="mt-0.5 flex-shrink-0 touch-manipulation"
                    >
                      {task.isCompleted ? (
                        <CheckCircle2 className="w-6 h-6 md:w-5 md:h-5 text-green-500" />
                      ) : (
                        <Circle className={`w-6 h-6 md:w-5 md:h-5 ${getPriorityColor(task.priority)}`} />
                      )}
                    </button>
                    
                    <div className="flex-1 min-w-0" onClick={() => openEditTask(task)}>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`font-medium text-sm md:text-base ${task.isCompleted ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                          {task.title}
                        </span>
                        {task.isToday && !task.isCompleted && (
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                        )}
                      </div>
                      {task.description && (
                        <p className="text-xs md:text-sm text-gray-500 mt-1 line-clamp-2">{task.description}</p>
                      )}
                      <div className="flex items-center gap-2 md:gap-3 mt-2 flex-wrap">
                        {task.projectId && (
                          <div className="flex items-center gap-1">
                            <div
                              className="w-2 h-2 rounded-full flex-shrink-0"
                              style={{ backgroundColor: projects.find(p => p.id === task.projectId)?.color }}
                            />
                            <span className="text-xs text-gray-500 truncate max-w-[100px]">
                              {projects.find(p => p.id === task.projectId)?.name}
                            </span>
                          </div>
                        )}
                        {task.dueDate && (
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Calendar className="w-3 h-3 flex-shrink-0" />
                            <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Action Buttons - Always visible on mobile, hover on desktop */}
                  <div className="flex items-center gap-1 justify-end md:opacity-0 md:group-hover:opacity-100 transition-opacity pl-9 md:pl-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => toggleTaskToday(task)}
                      className={`h-9 w-9 md:h-8 md:w-8 p-0 ${task.isToday ? 'text-yellow-500' : 'text-gray-400'} touch-manipulation`}
                    >
                      <Star className={`w-5 h-5 md:w-4 md:h-4 ${task.isToday ? 'fill-yellow-500' : ''}`} />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openEditTask(task)}
                      className="h-9 w-9 md:h-8 md:w-8 p-0 text-gray-400 hover:text-gray-900 touch-manipulation"
                    >
                      <Edit2 className="w-5 h-5 md:w-4 md:h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteTask(task.id)}
                      className="h-9 w-9 md:h-8 md:w-8 p-0 text-gray-400 hover:text-red-500 touch-manipulation"
                    >
                      <Trash2 className="w-5 h-5 md:w-4 md:h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        )}
        </div>
      </div>
      
      {/* Task Dialog */}
      <Dialog open={isTaskDialogOpen} onOpenChange={(open: boolean) => {
        setIsTaskDialogOpen(open);
        if (!open) setTaskError(null);
      }}>
        <DialogContent className="bg-white border-gray-200 text-gray-900 w-[95vw] max-w-md mx-auto rounded-xl max-h-[90vh] overflow-y-auto shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-lg text-gray-900">{editingTask ? 'Edit Task' : 'New Task'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {taskError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {taskError}
              </div>
            )}
            <div>
              <label className="text-sm text-gray-600 block mb-1">Title</label>
              <Input
                value={newTask.title}
                onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                placeholder="Task title"
                className="bg-white border-gray-300 text-gray-900 h-11"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600 block mb-1">Description</label>
              <Textarea
                value={newTask.description}
                onChange={e => setNewTask({ ...newTask, description: e.target.value })}
                placeholder="Add details..."
                className="bg-white border-gray-300 text-gray-900 resize-none min-h-[80px]"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="text-sm text-gray-600 block mb-1">Project</label>
                <select
                  value={newTask.projectId || ''}
                  onChange={e => setNewTask({ ...newTask, projectId: e.target.value || null })}
                  className="w-full h-11 px-3 rounded-md bg-white border border-gray-300 text-gray-900 text-base"
                >
                  <option value="">Inbox</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-600 block mb-1">Priority</label>
                <select
                  value={newTask.priority}
                  onChange={e => setNewTask({ ...newTask, priority: e.target.value as 'low' | 'medium' | 'high' })}
                  className="w-full h-11 px-3 rounded-md bg-white border border-gray-300 text-gray-900 text-base"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-600 block mb-1">Due Date</label>
              <Input
                type="date"
                value={newTask.dueDate}
                onChange={e => setNewTask({ ...newTask, dueDate: e.target.value })}
                className="bg-white border-gray-300 text-gray-900 h-11"
              />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 mt-4">
            <Button 
              variant="outline" 
              onClick={() => setIsTaskDialogOpen(false)}
              className="w-full sm:w-auto order-2 sm:order-1 h-11 border-gray-300 text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </Button>
            <Button 
              onClick={saveTask} 
              disabled={!newTask.title.trim() || savingTask}
              className="w-full sm:w-auto order-1 sm:order-2 h-11 bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {savingTask ? 'Saving...' : (editingTask ? 'Save' : 'Create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Project Dialog */}
      <Dialog open={isProjectDialogOpen} onOpenChange={(open: boolean) => {
        setIsProjectDialogOpen(open);
        if (!open) setError(null);
      }}>
        <DialogContent className="bg-white border-gray-200 text-gray-900 w-[95vw] max-w-md mx-auto rounded-xl max-h-[90vh] overflow-y-auto shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-lg text-gray-900">{editingProject ? 'Edit Project' : 'New Project'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {error}
              </div>
            )}
            <div>
              <label className="text-sm text-gray-600 block mb-1">Name</label>
              <Input
                value={newProject.name}
                onChange={e => setNewProject({ ...newProject, name: e.target.value })}
                placeholder="Project name"
                className="bg-white border-gray-300 text-gray-900 h-11"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600 block mb-2">Color</label>
              <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
                {PROJECT_COLORS.map(color => (
                  <button
                    key={color}
                    onClick={() => setNewProject({ ...newProject, color })}
                    className={`w-10 h-10 sm:w-8 sm:h-8 rounded-full transition-transform touch-manipulation ${
                      newProject.color === color ? 'scale-110 ring-2 ring-indigo-500 ring-offset-2 ring-offset-white' : ''
                    }`}
                    style={{ backgroundColor: color }}
                    type="button"
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 mt-4">
            <Button 
              variant="outline" 
              onClick={() => setIsProjectDialogOpen(false)} 
              disabled={saving}
              className="w-full sm:w-auto order-2 sm:order-1 h-11 border-gray-300 text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </Button>
            <Button 
              onClick={saveProject} 
              disabled={!newProject.name.trim() || saving}
              className="w-full sm:w-auto order-1 sm:order-2 h-11 bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {saving ? 'Saving...' : (editingProject ? 'Save' : 'Create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={(open: boolean) => {
        if (!open) {
          setIsDeleteConfirmOpen(false);
          setProjectToDelete(null);
          setDeleteConfirmStep(1);
          setDeleteConfirmName('');
        }
      }}>
        <DialogContent className="bg-white border-gray-200 text-gray-900 w-[95vw] max-w-md mx-auto rounded-xl shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-lg text-gray-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Delete Project
            </DialogTitle>
          </DialogHeader>
          
          {deleteConfirmStep === 1 ? (
            <div className="space-y-4">
              <p className="text-gray-600">
                Are you sure you want to delete <span className="font-semibold text-gray-900">"{projectToDelete?.name}"</span>?
              </p>
              <p className="text-sm text-gray-500">
                All tasks in this project will be moved to Inbox. This action cannot be undone.
              </p>
              <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 mt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setIsDeleteConfirmOpen(false)}
                  className="w-full sm:w-auto order-2 sm:order-1 h-11 border-gray-300 text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={() => setDeleteConfirmStep(2)}
                  className="w-full sm:w-auto order-1 sm:order-2 h-11 bg-red-600 hover:bg-red-700 text-white"
                >
                  Continue
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-gray-600">
                To confirm deletion, type the project name below:
              </p>
              <div className="p-3 bg-gray-100 rounded-lg">
                <code className="text-sm font-mono text-gray-800">{projectToDelete?.name}</code>
              </div>
              <Input
                value={deleteConfirmName}
                onChange={e => setDeleteConfirmName(e.target.value)}
                placeholder="Type project name to confirm"
                className="bg-white border-gray-300 text-gray-900 h-11"
              />
              <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 mt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setDeleteConfirmStep(1)}
                  className="w-full sm:w-auto order-2 sm:order-1 h-11 border-gray-300 text-gray-700 hover:bg-gray-100"
                >
                  Back
                </Button>
                <Button 
                  onClick={confirmDeleteProject}
                  disabled={deleteConfirmName !== projectToDelete?.name}
                  className="w-full sm:w-auto order-1 sm:order-2 h-11 bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
                >
                  Delete Project
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default TaskManager;
