/**
 * Saved Sites Component
 * Displays user's saved sites with actions: Edit, Duplicate, Download, Publish, Connect Domain, Remove
 */

import React, { useState, useEffect } from 'react';
import {
  Edit, Download, Trash2, Copy, Rocket, Globe, ExternalLink,
  Eye, MoreVertical, Loader2, CheckCircle, Clock, AlertCircle
} from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { notifications } from '../utils/notifications';
import {
  getSavedSites,
  getSavedSite,
  deleteSavedSite,
  duplicateSavedSite,
  SavedSite,
} from '../utils/savedSites';
import { generateSlug, generateDuplicateName } from '../utils/slugify';
import {
  createSiteZip,
  downloadSiteZip,
  generatePolicyHTML,
} from '../utils/siteDownload';
import { logActivity } from '../utils/savedSites';

export const SavedSites: React.FC = () => {
  const [savedSites, setSavedSites] = useState<SavedSite[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [duplicatingSite, setDuplicatingSite] = useState<SavedSite | null>(null);
  const [newSlug, setNewSlug] = useState('');
  const [newTitle, setNewTitle] = useState('');

  useEffect(() => {
    loadSavedSites();
  }, []);

  const loadSavedSites = async () => {
    try {
      setLoading(true);
      const sites = await getSavedSites();
      setSavedSites(sites);
    } catch (error: any) {
      console.error('Failed to load saved sites:', error);
      notifications.error(error.message || 'Failed to load saved sites');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (site: SavedSite) => {
    // Navigate to editor with site ID
    window.location.href = `/app/templates/editor/${site.id}`;
  };

  const handlePreview = (site: SavedSite) => {
    // Open preview in new window
    const blob = new Blob([site.html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  const handleDownload = async (site: SavedSite) => {
    try {
      // Generate policy HTML
      const policies = {
        privacy: site.metadata?.policies?.privacy
          ? generatePolicyHTML(
              'privacy',
              site.metadata.policies.privacy,
              site.title,
              { email: site.metadata.contact?.email, phone: site.metadata.contact?.phone },
              site.metadata.accent || '#16a34a',
              site.metadata.accentAlt || '#059669'
            )
          : undefined,
        terms: site.metadata?.policies?.terms
          ? generatePolicyHTML(
              'terms',
              site.metadata.policies.terms,
              site.title,
              { email: site.metadata.contact?.email, phone: site.metadata.contact?.phone },
              site.metadata.accent || '#16a34a',
              site.metadata.accentAlt || '#059669'
            )
          : undefined,
      };

      // Create ZIP
      const zipBlob = await createSiteZip(site.html, site.assets || [], policies);
      downloadSiteZip(zipBlob, `${site.slug}.zip`);

      // Log activity
      await logActivity(site.id, 'download', {});

      notifications.success('Site downloaded successfully!', { title: 'Downloaded' });
    } catch (error: any) {
      console.error('Failed to download site:', error);
      notifications.error(error.message || 'Failed to download site');
    }
  };

  const handlePublish = async (site: SavedSite) => {
    try {
      // Call backend API to publish
      const response = await fetch('/api/publish-site', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ savedSiteId: site.id }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to publish site');
      }

      const result = await response.json();

      // Update local state
      await loadSavedSites();

      notifications.success(
        `Site published! Visit: ${result.url}`,
        {
          title: 'Published!',
          duration: 10000,
        }
      );
    } catch (error: any) {
      console.error('Failed to publish site:', error);
      notifications.error(error.message || 'Failed to publish site');
    }
  };

  const handleDuplicate = async () => {
    if (!duplicatingSite || !newSlug.trim() || !newTitle.trim()) {
      notifications.error('Please enter both slug and title');
      return;
    }

    try {
      await duplicateSavedSite(duplicatingSite.id, newSlug.trim(), newTitle.trim());
      await loadSavedSites();
      setShowDuplicateDialog(false);
      setDuplicatingSite(null);
      setNewSlug('');
      setNewTitle('');
      notifications.success('Site duplicated successfully!');
    } catch (error: any) {
      console.error('Failed to duplicate site:', error);
      notifications.error(error.message || 'Failed to duplicate site');
    }
  };

  const handleDelete = async (site: SavedSite) => {
    if (!confirm(`Are you sure you want to delete "${site.title}"?`)) return;

    try {
      await deleteSavedSite(site.id);
      await loadSavedSites();
      notifications.success('Site deleted');
    } catch (error: any) {
      console.error('Failed to delete site:', error);
      notifications.error(error.message || 'Failed to delete site');
    }
  };

  const handleConnectDomain = (site: SavedSite) => {
    // Show notification that domain connection is coming soon
    notifications.info('Domain connection feature coming soon! For now, your site is available at the published URL.', {
      title: 'Connect Domain',
      description: 'Custom domain support will be available in a future update.'
    });
  };

  // Group sites by status
  const draftSites = savedSites.filter(s => s.status === 'draft');
  const publishedSites = savedSites.filter(s => s.status === 'published');

  const renderSiteCard = (site: SavedSite) => (
    <Card key={site.id} className="p-6 hover:shadow-lg transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-slate-800 mb-1">{site.title}</h3>
          <p className="text-sm text-slate-500 mb-2">/{site.slug}</p>
          <div className="flex gap-2 mb-2">
            <Badge variant={site.status === 'published' ? 'default' : 'secondary'}>
              {site.status === 'published' ? (
                <>
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Published
                </>
              ) : (
                <>
                  <Clock className="w-3 h-3 mr-1" />
                  Draft
                </>
              )}
            </Badge>
            {site.vercel?.url && (
              <Badge variant="outline">
                <Globe className="w-3 h-3 mr-1" />
                Live
              </Badge>
            )}
          </div>
          <p className="text-xs text-slate-400">
            Updated: {new Date(site.updated_at).toLocaleDateString()}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handlePreview(site)}>
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleEdit(site)}>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleDownload(site)}>
              <Download className="w-4 h-4 mr-2" />
              Download
            </DropdownMenuItem>
            {site.status === 'draft' && (
              <DropdownMenuItem onClick={() => handlePublish(site)}>
                <Rocket className="w-4 h-4 mr-2" />
                Publish
              </DropdownMenuItem>
            )}
            {site.status === 'published' && site.vercel?.url && (
              <DropdownMenuItem onClick={() => handleConnectDomain(site)}>
                <Globe className="w-4 h-4 mr-2" />
                Connect Domain
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => {
              const existingTitles = savedSites.map(s => s.title);
              const newName = generateDuplicateName(site.title, existingTitles);
              setDuplicatingSite(site);
              setNewSlug(generateSlug(newName));
              setNewTitle(newName);
              setShowDuplicateDialog(true);
            }}>
              <Copy className="w-4 h-4 mr-2" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleDelete(site)}
              className="text-red-600"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {site.vercel?.url && (
        <div className="mt-4 pt-4 border-t">
          <a
            href={site.vercel.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-indigo-600 hover:underline flex items-center gap-1"
          >
            <ExternalLink className="w-3 h-3" />
            {site.vercel.url}
          </a>
        </div>
      )}
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
          Saved Sites
        </h1>
        <p className="text-slate-600">
          Manage your customized website templates
        </p>
      </div>

      <Tabs defaultValue="all" className="space-y-6">
        <TabsList>
          <TabsTrigger value="all">All ({savedSites.length})</TabsTrigger>
          <TabsTrigger value="draft">Drafts ({draftSites.length})</TabsTrigger>
          <TabsTrigger value="published">Published ({publishedSites.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          {savedSites.length === 0 ? (
            <Card className="p-12 text-center">
              <p className="text-slate-500">No saved sites yet. Create one by editing a template.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedSites.map(renderSiteCard)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="draft">
          {draftSites.length === 0 ? (
            <Card className="p-12 text-center">
              <p className="text-slate-500">No draft sites.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {draftSites.map(renderSiteCard)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="published">
          {publishedSites.length === 0 ? (
            <Card className="p-12 text-center">
              <p className="text-slate-500">No published sites.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {publishedSites.map(renderSiteCard)}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Duplicate Dialog */}
      <Dialog open={showDuplicateDialog} onOpenChange={setShowDuplicateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Duplicate Site</DialogTitle>
            <DialogDescription>
              Create a copy of "{duplicatingSite?.title}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="new-slug">Slug</Label>
              <Input
                id="new-slug"
                value={newSlug}
                onChange={(e) => setNewSlug(e.target.value)}
                placeholder="site-slug"
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="new-title">Title</Label>
              <Input
                id="new-title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Site Title"
                className="mt-2"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowDuplicateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleDuplicate}>
              Duplicate
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

