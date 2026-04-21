import { useState, useEffect, useCallback } from 'react';
import {
  FileText, Edit, Trash2, Eye, Save, RefreshCw,
  CheckCircle, XCircle, Globe, EyeOff, Search, ChevronLeft,
  ExternalLink, Lock, Unlock
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { RichTextEditor } from './RichTextEditor';

interface Article {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  category: string | null;
  tags: string[];
  author: string | null;
  readTime: string | null;
  wordCount: number | null;
  metaTitle: string | null;
  metaDescription: string | null;
  published: boolean;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
}

interface EditForm {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string;
  metaTitle: string;
  metaDescription: string;
  published: boolean;
  featured: boolean;
}

interface BlogEditorProps {
  token: string;
}

export function BlogEditor({ token }: BlogEditorProps) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [form, setForm] = useState<EditForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [slugLocked, setSlugLocked] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const adminFetch = useCallback(async (url: string, options: RequestInit = {}) => {
    return fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'x-admin-token': token,
        ...(options.headers || {}),
      },
    });
  }, [token]);

  const loadArticles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminFetch('/api/superadmin/blog/articles');
      if (!res.ok) throw new Error(`Failed to load articles (${res.status})`);
      const data = await res.json();
      setArticles(data.articles || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [adminFetch]);

  useEffect(() => { loadArticles(); }, [loadArticles]);

  const openEdit = (article: Article) => {
    setEditingArticle(article);
    setForm({
      title: article.title,
      slug: article.slug,
      excerpt: article.excerpt || '',
      content: article.content,
      category: article.category || '',
      tags: (article.tags || []).join(', '),
      metaTitle: article.metaTitle || '',
      metaDescription: article.metaDescription || '',
      published: article.published,
      featured: article.featured,
    });
    setSlugLocked(true);
    setSaveError(null);
    setSaveSuccess(false);
  };

  const closeEdit = () => {
    setEditingArticle(null);
    setForm(null);
    setSaveError(null);
    setSaveSuccess(false);
  };

  const handleSave = async () => {
    if (!editingArticle || !form) return;
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    try {
      const payload = {
        ...form,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      };
      const res = await adminFetch(`/api/superadmin/blog/articles/${editingArticle.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Save failed (${res.status})`);
      }
      const data = await res.json();
      setSaveSuccess(true);
      setArticles(prev => prev.map(a => a.id === editingArticle.id ? { ...a, ...data.article } : a));
      setEditingArticle(prev => prev ? { ...prev, ...data.article } : prev);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    setDeleting(true);
    try {
      const res = await adminFetch(`/api/superadmin/blog/articles/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      setArticles(prev => prev.filter(a => a.id !== id));
      setDeleteConfirm(null);
      if (editingArticle?.id === id) closeEdit();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const filtered = articles.filter(a =>
    !search ||
    a.title.toLowerCase().includes(search.toLowerCase()) ||
    (a.category || '').toLowerCase().includes(search.toLowerCase()) ||
    (a.tags || []).some(t => t.toLowerCase().includes(search.toLowerCase()))
  );

  if (editingArticle && form) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={closeEdit} className="border-slate-600 text-slate-300 hover:bg-slate-700">
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Articles
          </Button>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-white truncate">{editingArticle.title}</h2>
            <p className="text-xs text-slate-400">/blog/{editingArticle.slug}</p>
          </div>
          <a
            href={`/blog/${editingArticle.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-400 hover:text-blue-400 transition-colors"
            title="View article"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">
            <div className="bg-slate-800 rounded-xl p-5 border border-slate-700 space-y-4">
              <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Content</h3>

              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Title</label>
                <Input
                  value={form.title}
                  onChange={e => setForm(f => f ? { ...f, title: e.target.value } : f)}
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="Article title"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1.5">
                  Slug
                  <span className="ml-1 text-yellow-500 text-xs">(changing breaks existing links)</span>
                </label>
                <div className="flex gap-2">
                  <Input
                    value={form.slug}
                    onChange={e => setForm(f => f ? { ...f, slug: e.target.value } : f)}
                    className="bg-slate-700 border-slate-600 text-white font-mono text-sm"
                    disabled={slugLocked}
                    placeholder="article-slug"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSlugLocked(l => !l)}
                    className="border-slate-600 text-slate-400 hover:bg-slate-700 shrink-0"
                    title={slugLocked ? 'Unlock slug to edit' : 'Lock slug'}
                  >
                    {slugLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                  </Button>
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Excerpt / Summary</label>
                <textarea
                  value={form.excerpt}
                  onChange={e => setForm(f => f ? { ...f, excerpt: e.target.value } : f)}
                  rows={3}
                  className="w-full bg-slate-700 border border-slate-600 text-white rounded-md px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-500"
                  placeholder="Brief description of the article..."
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Content</label>
                <RichTextEditor
                  content={form.content}
                  onChange={html => setForm(f => f ? { ...f, content: html } : f)}
                  placeholder="Start writing your article content here…"
                />
                <p className="text-xs text-slate-500 mt-1.5">Use the {'</>'} button to switch to raw HTML mode.</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-slate-800 rounded-xl p-5 border border-slate-700 space-y-4">
              <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Status</h3>

              <label className="flex items-center gap-3 cursor-pointer">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={form.published}
                    onChange={e => setForm(f => f ? { ...f, published: e.target.checked } : f)}
                    className="sr-only"
                  />
                  <div className={`w-10 h-6 rounded-full transition-colors ${form.published ? 'bg-green-500' : 'bg-slate-600'}`}>
                    <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${form.published ? 'translate-x-5' : 'translate-x-1'}`} />
                  </div>
                </div>
                <span className="text-sm text-slate-300">{form.published ? 'Published' : 'Draft'}</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={form.featured}
                    onChange={e => setForm(f => f ? { ...f, featured: e.target.checked } : f)}
                    className="sr-only"
                  />
                  <div className={`w-10 h-6 rounded-full transition-colors ${form.featured ? 'bg-purple-500' : 'bg-slate-600'}`}>
                    <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${form.featured ? 'translate-x-5' : 'translate-x-1'}`} />
                  </div>
                </div>
                <span className="text-sm text-slate-300">{form.featured ? 'Featured' : 'Not featured'}</span>
              </label>
            </div>

            <div className="bg-slate-800 rounded-xl p-5 border border-slate-700 space-y-4">
              <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">SEO & Metadata</h3>

              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Category</label>
                <Input
                  value={form.category}
                  onChange={e => setForm(f => f ? { ...f, category: e.target.value } : f)}
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="Google Ads"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Tags (comma-separated)</label>
                <Input
                  value={form.tags}
                  onChange={e => setForm(f => f ? { ...f, tags: e.target.value } : f)}
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="google ads, ppc, campaigns"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Meta Title</label>
                <Input
                  value={form.metaTitle}
                  onChange={e => setForm(f => f ? { ...f, metaTitle: e.target.value } : f)}
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="Page title for search engines"
                />
                <p className={`text-xs mt-1 ${form.metaTitle.length > 60 ? 'text-red-400' : 'text-slate-500'}`}>
                  {form.metaTitle.length}/60 chars
                </p>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Meta Description</label>
                <textarea
                  value={form.metaDescription}
                  onChange={e => setForm(f => f ? { ...f, metaDescription: e.target.value } : f)}
                  rows={3}
                  className="w-full bg-slate-700 border border-slate-600 text-white rounded-md px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-500"
                  placeholder="160 char description for search results..."
                />
                <p className={`text-xs mt-1 ${form.metaDescription.length > 160 ? 'text-red-400' : 'text-slate-500'}`}>
                  {form.metaDescription.length}/160 chars
                </p>
              </div>
            </div>

            <div className="space-y-2">
              {saveSuccess && (
                <div className="flex items-center gap-2 text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2 text-sm">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  Changes saved successfully
                </div>
              )}
              {saveError && (
                <div className="flex items-center gap-2 text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 text-sm">
                  <XCircle className="w-4 h-4 shrink-0" />
                  {saveError}
                </div>
              )}

              <Button
                onClick={handleSave}
                disabled={saving}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white"
              >
                {saving ? (
                  <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Saving…</>
                ) : (
                  <><Save className="w-4 h-4 mr-2" />Save Changes</>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={() => setDeleteConfirm(editingArticle.id)}
                className="w-full border-red-800 text-red-400 hover:bg-red-900/20"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Article
              </Button>
            </div>
          </div>
        </div>

        {deleteConfirm === editingArticle.id && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
              <h3 className="text-lg font-semibold text-white mb-2">Delete Article?</h3>
              <p className="text-slate-400 text-sm mb-6">
                This will permanently delete <strong className="text-white">"{editingArticle.title}"</strong>. This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 border-slate-600 text-slate-300"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handleDelete(editingArticle.id)}
                  disabled={deleting}
                  className="flex-1 bg-red-600 hover:bg-red-500 text-white"
                >
                  {deleting ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Delete'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-white">Blog Articles</h2>
          <p className="text-slate-400 text-sm mt-0.5">{articles.length} articles total</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search articles..."
              className="pl-9 bg-slate-800 border-slate-700 text-white w-56"
            />
          </div>
          <Button
            variant="outline"
            onClick={loadArticles}
            disabled={loading}
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-sm">
          <XCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400">
          <RefreshCw className="w-6 h-6 animate-spin mr-3" />
          Loading articles…
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-slate-500">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>{search ? 'No articles match your search.' : 'No articles yet.'}</p>
        </div>
      ) : (
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 text-slate-400 text-xs uppercase tracking-wide">
                <th className="text-left px-4 py-3">Title</th>
                <th className="text-left px-4 py-3 hidden md:table-cell">Category</th>
                <th className="text-left px-4 py-3 hidden lg:table-cell">Words</th>
                <th className="text-left px-4 py-3 hidden lg:table-cell">Published</th>
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {filtered.map(article => (
                <tr key={article.id} className="hover:bg-slate-700/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {article.published
                        ? <Globe className="w-3.5 h-3.5 text-green-400 shrink-0" />
                        : <EyeOff className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      }
                      <div className="min-w-0">
                        <p className="text-white font-medium truncate max-w-xs">{article.title}</p>
                        <p className="text-slate-500 text-xs truncate">/blog/{article.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    {article.category && (
                      <Badge variant="outline" className="border-slate-600 text-slate-400 text-xs">
                        {article.category}
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-slate-400">
                    {article.wordCount?.toLocaleString() || '—'}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-slate-400">
                    {article.createdAt ? new Date(article.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <a
                        href={`/blog/${article.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 text-slate-400 hover:text-blue-400 transition-colors rounded"
                        title="View article"
                      >
                        <Eye className="w-4 h-4" />
                      </a>
                      <button
                        onClick={() => openEdit(article)}
                        className="p-1.5 text-slate-400 hover:text-yellow-400 transition-colors rounded"
                        title="Edit article"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(article.id)}
                        className="p-1.5 text-slate-400 hover:text-red-400 transition-colors rounded"
                        title="Delete article"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {deleteConfirm !== null && deleteConfirm !== (editingArticle?.id) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
            <h3 className="text-lg font-semibold text-white mb-2">Delete Article?</h3>
            <p className="text-slate-400 text-sm mb-6">
              This will permanently delete <strong className="text-white">"{articles.find(a => a.id === deleteConfirm)?.title}"</strong>. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 border-slate-600 text-slate-300"
              >
                Cancel
              </Button>
              <Button
                onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
                disabled={deleting}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white"
              >
                {deleting ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
