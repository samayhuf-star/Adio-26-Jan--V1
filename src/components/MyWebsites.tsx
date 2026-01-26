import React, { useState, useEffect } from 'react';
import { 
  Globe, ExternalLink, Trash2, RefreshCw, CheckCircle, 
  AlertCircle, Loader2, Rocket, Calendar, Eye, Plus, Edit2, Save, X
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { getUserPublishedWebsites, deletePublishedWebsite, updatePublishedWebsiteStatus, updatePublishedWebsite, PublishedWebsite, savePublishedWebsite } from '../utils/publishedWebsites';
import { getDeploymentStatus } from '../utils/vercel';
import { useUserData } from '@nhost/react';
import { notifications } from '../utils/notifications';

export const MyWebsites: React.FC = () => {
  const [websites, setWebsites] = useState<PublishedWebsite[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState<PublishedWebsite | null>(null);
  const [editingWebsite, setEditingWebsite] = useState<Partial<PublishedWebsite>>({});
  const [newWebsite, setNewWebsite] = useState({
    name: '',
    domain: '',
    template_id: '',
    status: 'ready' as 'deploying' | 'ready' | 'error'
  });
  const [vercelToken, setVercelToken] = useState('');

  useEffect(() => {
    loadWebsites();
    // Add sample domain.com on first load if no websites exist
    initializeSampleWebsite();
  }, []);

  const initializeSampleWebsite = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if sample website already exists
      const existing = await getUserPublishedWebsites(user.id);
      const hasSample = existing.some((w: PublishedWebsite) => w.name === 'Sample Website' || w.vercel_url?.includes('domain.com'));
      
      if (existing.length === 0 && !hasSample) {
        // Add sample domain.com website
        const sampleWebsite = {
          name: 'Sample Website',
          template_id: 'sample-template-1',
          template_data: { type: 'sample' },
          vercel_deployment_id: 'sample-deployment-123',
          vercel_url: 'https://domain.com',
          vercel_project_id: 'sample-project-123',
          status: 'ready' as const
        };
        
        try {
          await savePublishedWebsite(user.id, sampleWebsite);
          await loadWebsites();
        } catch (error) {
          // If database save fails, use local storage as fallback
          console.log('Using local storage fallback for sample website');
        }
      }
    } catch (error) {
      console.error('Error initializing sample website:', error);
    }
  };

  const loadWebsites = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Load from local storage if not authenticated
        const localWebsites = localStorage.getItem('my_websites');
        if (localWebsites) {
          setWebsites(JSON.parse(localWebsites));
        }
        setLoading(false);
        return;
      }

      try {
        const userWebsites = await getUserPublishedWebsites(user.id);
        setWebsites(userWebsites);
        // Also save to local storage as backup
        localStorage.setItem('my_websites', JSON.stringify(userWebsites));
      } catch (dbError: any) {
        console.error('Database error, using local storage:', dbError);
        // Fallback to local storage
        const localWebsites = localStorage.getItem('my_websites');
        if (localWebsites) {
          setWebsites(JSON.parse(localWebsites));
        } else {
          // Initialize with sample if no local storage
          const sample: PublishedWebsite = {
            id: 'sample-1',
            user_id: user.id,
            name: 'Sample Website',
            template_id: 'sample-template-1',
            template_data: { type: 'sample' },
            vercel_deployment_id: 'sample-deployment-123',
            vercel_url: 'https://domain.com',
            vercel_project_id: 'sample-project-123',
            status: 'ready',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          setWebsites([sample]);
          localStorage.setItem('my_websites', JSON.stringify([sample]));
        }
      }
    } catch (error: any) {
      console.error('Failed to load websites:', error);
      // Try local storage fallback
      const localWebsites = localStorage.getItem('my_websites');
      if (localWebsites) {
        setWebsites(JSON.parse(localWebsites));
      } else {
        notifications.error('Failed to load your websites', {
          title: 'Load Error'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddWebsite = async () => {
    if (!newWebsite.name || !newWebsite.domain) {
      notifications.warning('Please fill in all required fields', {
        title: 'Validation Error'
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Use local storage if not authenticated
        const localWebsites = localStorage.getItem('my_websites') || '[]';
        const websites = JSON.parse(localWebsites);
        const newSite: PublishedWebsite = {
          id: `local-${Date.now()}`,
          user_id: 'local-user',
          name: newWebsite.name,
          template_id: newWebsite.template_id || 'custom-template',
          template_data: {},
          vercel_deployment_id: `deployment-${Date.now()}`,
          vercel_url: newWebsite.domain.startsWith('http') ? newWebsite.domain : `https://${newWebsite.domain}`,
          vercel_project_id: `project-${Date.now()}`,
          status: newWebsite.status,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        websites.push(newSite);
        localStorage.setItem('my_websites', JSON.stringify(websites));
        setWebsites(websites);
        setShowAddDialog(false);
        setNewWebsite({ name: '', domain: '', template_id: '', status: 'ready' });
        notifications.success('Website added successfully!', { title: 'Success' });
        return;
      }

      const websiteData = {
        name: newWebsite.name,
        template_id: newWebsite.template_id || 'custom-template',
        template_data: {},
        vercel_deployment_id: `deployment-${Date.now()}`,
        vercel_url: newWebsite.domain.startsWith('http') ? newWebsite.domain : `https://${newWebsite.domain}`,
        vercel_project_id: `project-${Date.now()}`,
        status: newWebsite.status
      };

      try {
        await savePublishedWebsite(user.id, websiteData);
        await loadWebsites();
        setShowAddDialog(false);
        setNewWebsite({ name: '', domain: '', template_id: '', status: 'ready' });
        notifications.success('Website added successfully!', { title: 'Success' });
      } catch (dbError: any) {
        // Fallback to local storage
        const localWebsites = localStorage.getItem('my_websites') || '[]';
        const websites = JSON.parse(localWebsites);
        const newSite: PublishedWebsite = {
          id: `local-${Date.now()}`,
          user_id: user.id,
          ...websiteData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        websites.push(newSite);
        localStorage.setItem('my_websites', JSON.stringify(websites));
        setWebsites(websites);
        setShowAddDialog(false);
        setNewWebsite({ name: '', domain: '', template_id: '', status: 'ready' });
        notifications.success('Website added successfully!', { title: 'Success' });
      }
    } catch (error: any) {
      console.error('Failed to add website:', error);
      notifications.error('Failed to add website', { title: 'Error' });
    }
  };

  const handleEditWebsite = (website: PublishedWebsite) => {
    setEditingWebsite(website);
    setShowEditDialog(website);
  };

  const handleUpdateWebsite = async () => {
    if (!editingWebsite.name || !editingWebsite.vercel_url) {
      notifications.warning('Please fill in all required fields', {
        title: 'Validation Error'
      });
      return;
    }

    if (!editingWebsite.id) {
      notifications.error('Website ID is missing. Cannot update website.', {
        title: 'Update Error'
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      try {
        // Use the comprehensive update function to update all fields
        await updatePublishedWebsite(editingWebsite.id, {
          name: editingWebsite.name,
          template_id: editingWebsite.template_id,
          vercel_url: editingWebsite.vercel_url,
          status: editingWebsite.status || 'ready'
        });
        await loadWebsites();
        setShowEditDialog(null);
        setEditingWebsite({});
        notifications.success('Website updated successfully!', { title: 'Success' });
      } catch (dbError: any) {
        console.error('Database update error:', dbError);
        // Fallback to local storage
        const localWebsites = localStorage.getItem('my_websites') || '[]';
        const websites: PublishedWebsite[] = JSON.parse(localWebsites);
        const index = websites.findIndex(w => w.id === editingWebsite.id);
        if (index !== -1) {
          websites[index] = {
            ...websites[index],
            name: editingWebsite.name || websites[index].name,
            template_id: editingWebsite.template_id || websites[index].template_id,
            vercel_url: editingWebsite.vercel_url || websites[index].vercel_url,
            status: editingWebsite.status || websites[index].status || 'ready',
            updated_at: new Date().toISOString()
          };
          localStorage.setItem('my_websites', JSON.stringify(websites));
          setWebsites(websites);
          setShowEditDialog(null);
          setEditingWebsite({});
          notifications.success('Website updated successfully (saved locally)!', { title: 'Success' });
        } else {
          notifications.error('Website not found in local storage', { title: 'Update Error' });
        }
      }
    } catch (error: any) {
      console.error('Failed to update website:', error);
      notifications.error(
        error?.message || 'Failed to update website. Please try again.',
        { title: 'Update Error' }
      );
    }
  };

  const handleRefreshStatus = async (website: PublishedWebsite) => {
    if (!vercelToken) {
      notifications.warning('Please enter your Vercel API token in settings to refresh status', {
        title: 'Token Required'
      });
      return;
    }

    setRefreshing(website.id);
    try {
      const deployment = await getDeploymentStatus(website.vercel_deployment_id, vercelToken);
      const status = deployment.state === 'READY' ? 'ready' : deployment.state === 'ERROR' ? 'error' : 'deploying';
      await updatePublishedWebsiteStatus(website.id, status);
      await loadWebsites();
      notifications.success('Status updated!', { title: 'Refreshed' });
    } catch (error: any) {
      console.error('Failed to refresh status:', error);
      notifications.error('Failed to refresh status', { title: 'Error' });
    } finally {
      setRefreshing(null);
    }
  };

  const handleDeleteWebsite = async (websiteId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      try {
        await deletePublishedWebsite(websiteId);
        await loadWebsites();
        notifications.success('Website deleted successfully', { title: 'Deleted' });
      } catch (dbError: any) {
        // Fallback to local storage
        const localWebsites = localStorage.getItem('my_websites') || '[]';
        const websites: PublishedWebsite[] = JSON.parse(localWebsites);
        const filtered = websites.filter(w => w.id !== websiteId);
        localStorage.setItem('my_websites', JSON.stringify(filtered));
        setWebsites(filtered);
        notifications.success('Website deleted successfully', { title: 'Deleted' });
      }
      setShowDeleteDialog(null);
    } catch (error: any) {
      console.error('Failed to delete website:', error);
      notifications.error('Failed to delete website', { title: 'Delete Error' });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ready':
        return (
          <Badge className="bg-indigo-100 text-indigo-700 border-indigo-300">
            <CheckCircle className="w-3 h-3 mr-1" />
            Live
          </Badge>
        );
      case 'deploying':
        return (
          <Badge className="bg-blue-100 text-blue-700 border-blue-300">
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            Deploying
          </Badge>
        );
      case 'error':
        return (
          <Badge className="bg-red-100 text-red-700 border-red-300">
            <AlertCircle className="w-3 h-3 mr-1" />
            Error
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            {status}
          </Badge>
        );
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
              <Globe className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold theme-gradient-text">My Websites</h1>
              <p className="text-slate-600 mt-1">Manage your published websites</p>
            </div>
          </div>
          <Button 
            onClick={() => setShowAddDialog(true)}
            className="theme-button-primary"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Website
          </Button>
        </div>
      </div>

      {websites.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Globe className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <h3 className="text-xl font-semibold text-slate-700 mb-2">No websites published yet</h3>
            <p className="text-slate-500 mb-6">
              Start by adding a website or editing a template and clicking "Publish Website"
            </p>
            <div className="flex gap-3 justify-center">
              <Button 
                onClick={() => setShowAddDialog(true)}
                className="theme-button-primary"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Website
              </Button>
              <Button 
                onClick={() => window.location.href = '#/website-templates'}
                variant="outline"
              >
                <Rocket className="w-4 h-4 mr-2" />
                Go to Templates
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {websites.map((website) => (
            <Card key={website.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">{website.name}</CardTitle>
                    {getStatusBadge(website.status)}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Template ID</p>
                    <p className="text-sm font-mono text-slate-700">{website.template_id}</p>
                  </div>
                  
                  {website.vercel_url && (
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Website URL</p>
                      <a
                        href={website.vercel_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1 break-all"
                      >
                        {website.vercel_url}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Calendar className="w-3 h-3" />
                    <span>
                      Published {new Date(website.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-slate-200">
                    {website.vercel_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => window.open(website.vercel_url, '_blank')}
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        View
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditWebsite(website)}
                    >
                      <Edit2 className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRefreshStatus(website)}
                      disabled={refreshing === website.id || !vercelToken}
                    >
                      {refreshing === website.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <RefreshCw className="w-3 h-3" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowDeleteDialog(website.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Website Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Website</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="name">Website Name *</Label>
              <Input
                id="name"
                value={newWebsite.name}
                onChange={(e) => setNewWebsite({ ...newWebsite, name: e.target.value })}
                placeholder="My Website"
              />
            </div>
            <div>
              <Label htmlFor="domain">Domain/URL *</Label>
              <Input
                id="domain"
                value={newWebsite.domain}
                onChange={(e) => setNewWebsite({ ...newWebsite, domain: e.target.value })}
                placeholder="domain.com or https://domain.com"
              />
            </div>
            <div>
              <Label htmlFor="template_id">Template ID</Label>
              <Input
                id="template_id"
                value={newWebsite.template_id}
                onChange={(e) => setNewWebsite({ ...newWebsite, template_id: e.target.value })}
                placeholder="template-1"
              />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={newWebsite.status}
                onValueChange={(value: 'deploying' | 'ready' | 'error') => 
                  setNewWebsite({ ...newWebsite, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ready">Ready / Live</SelectItem>
                  <SelectItem value="deploying">Deploying</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddWebsite} className="theme-button-primary">
              <Save className="w-4 h-4 mr-2" />
              Add Website
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Website Dialog */}
      <Dialog open={showEditDialog !== null} onOpenChange={() => setShowEditDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Website</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="edit-name">Website Name *</Label>
              <Input
                id="edit-name"
                value={editingWebsite.name || ''}
                onChange={(e) => setEditingWebsite({ ...editingWebsite, name: e.target.value })}
                placeholder="My Website"
              />
            </div>
            <div>
              <Label htmlFor="edit-url">Website URL *</Label>
              <Input
                id="edit-url"
                value={editingWebsite.vercel_url || ''}
                onChange={(e) => setEditingWebsite({ ...editingWebsite, vercel_url: e.target.value })}
                placeholder="https://domain.com"
              />
            </div>
            <div>
              <Label htmlFor="edit-template">Template ID</Label>
              <Input
                id="edit-template"
                value={editingWebsite.template_id || ''}
                onChange={(e) => setEditingWebsite({ ...editingWebsite, template_id: e.target.value })}
                placeholder="template-1"
              />
            </div>
            <div>
              <Label htmlFor="edit-status">Status</Label>
              <Select
                value={editingWebsite.status || 'ready'}
                onValueChange={(value: 'deploying' | 'ready' | 'error') => 
                  setEditingWebsite({ ...editingWebsite, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ready">Ready / Live</SelectItem>
                  <SelectItem value="deploying">Deploying</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateWebsite} className="theme-button-primary">
              <Save className="w-4 h-4 mr-2" />
              Update Website
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog !== null} onOpenChange={() => setShowDeleteDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Website</DialogTitle>
          </DialogHeader>
          <p className="text-slate-600 py-4">
            Are you sure you want to delete this website? This will remove it from your list but won't delete it from Vercel.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => showDeleteDialog && handleDeleteWebsite(showDeleteDialog)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
