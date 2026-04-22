import { useState, useEffect, useRef } from 'react';
import {
  Globe, Zap, Github, Trash2, RefreshCw, CheckCircle, XCircle,
  Clock, Download, Eye, AlertCircle, ChevronDown, X, Plus
} from 'lucide-react';
import { Button } from '../ui/button';

const token = () => sessionStorage.getItem('superadmin_token') || '';
const authHeaders = () => ({ 'Authorization': `Bearer ${token()}`, 'Content-Type': 'application/json' });

interface SeoPage {
  id: number;
  niche: string;
  slug: string;
  title: string;
  metaDescription: string | null;
  htmlContent: string | null;
  status: string;
  githubPath: string | null;
  githubRepo: string | null;
  publishedAt: string | null;
  createdAt: string;
}

interface GithubRepo {
  name: string;
  private: boolean;
  url: string;
  updatedAt: string;
}

const PREDEFINED_NICHES = [
  'e-commerce', 'saas', 'real-estate', 'legal-services', 'healthcare',
  'fitness-gyms', 'restaurants', 'automotive', 'travel-tourism',
  'financial-services', 'education', 'home-services', 'beauty-salons',
  'insurance', 'recruitment', 'software-agencies', 'dentists',
  'plumbers', 'roofing', 'accounting', 'wedding-photography',
  'interior-design', 'pet-services', 'cleaning-services', 'moving-companies',
];

export function ProgrammaticSEOEngine() {
  const [pages, setPages] = useState<SeoPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [nicheInput, setNicheInput] = useState('');
  const [repoInput, setRepoInput] = useState('');
  const [githubRepos, setGithubRepos] = useState<GithubRepo[]>([]);
  const [showRepoDropdown, setShowRepoDropdown] = useState(false);
  const [reposLoading, setReposLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState('');
  const [generateProgress, setGenerateProgress] = useState<{ done: number; total: number; current: string } | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadPages = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/seo-pages/list', { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setPages(data.pages || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadGithubRepos = async () => {
    setReposLoading(true);
    try {
      const res = await fetch('/api/seo-pages/github-repos', { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setGithubRepos(data.repos || []);
      }
    } finally {
      setReposLoading(false);
    }
  };

  useEffect(() => {
    loadPages();
    loadGithubRepos();
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowRepoDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleGenerate = async () => {
    const lines = nicheInput.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) { showToast('Enter at least one niche', 'error'); return; }
    if (lines.length > 50) { showToast('Maximum 50 niches per batch', 'error'); return; }

    setGenerating(true);
    setGenerateProgress({ done: 0, total: lines.length, current: lines[0] });

    // Process in batches of 5 to show progress
    const batchSize = 5;
    let done = 0;
    for (let i = 0; i < lines.length; i += batchSize) {
      const batch = lines.slice(i, i + batchSize);
      setGenerateProgress({ done, total: lines.length, current: batch[0] });
      try {
        const res = await fetch('/api/seo-pages/generate', {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({ niches: batch }),
        });
        const data = await res.json();
        done += batch.length;
        setGenerateProgress({ done, total: lines.length, current: lines[Math.min(i + batchSize, lines.length - 1)] });
        if (!res.ok) { showToast(data.error || 'Generation failed', 'error'); break; }
      } catch (e: any) {
        showToast(e.message || 'Generation failed', 'error');
        break;
      }
    }

    setGenerating(false);
    setGenerateProgress(null);
    setNicheInput('');
    await loadPages();
    showToast(`Generated pages successfully!`);
  };

  const handlePublish = async () => {
    if (!repoInput.trim()) { showToast('Enter a GitHub repository (owner/repo)', 'error'); return; }
    const toPublish = selectedIds.size > 0
      ? Array.from(selectedIds)
      : pages.filter(p => p.status === 'generated').map(p => p.id);

    if (toPublish.length === 0) { showToast('No pages to publish', 'error'); return; }

    setPublishing(true);
    try {
      const res = await fetch('/api/seo-pages/publish-github', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ pageIds: toPublish, repo: repoInput.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        const failed = data.failed > 0 ? ` (${data.failed} failed: GitHub push failed)` : '';
        showToast(`Published ${data.published} pages to GitHub${failed}.`, data.failed > 0 ? 'error' : 'success');
        await loadPages();
        setSelectedIds(new Set());
      } else {
        showToast(data.error || 'Publish failed', 'error');
      }
    } catch (e: any) {
      showToast(e.message || 'Publish failed', 'error');
    } finally {
      setPublishing(false);
    }
  };

  const handleDelete = async () => {
    if (selectedIds.size === 0) { showToast('Select pages to delete', 'error'); return; }
    if (!confirm(`Delete ${selectedIds.size} page(s)?`)) return;
    try {
      const res = await fetch('/api/seo-pages/delete', {
        method: 'DELETE',
        headers: authHeaders(),
        body: JSON.stringify({ pageIds: Array.from(selectedIds) }),
      });
      if (res.ok) {
        showToast(`Deleted ${selectedIds.size} page(s)`);
        setSelectedIds(new Set());
        await loadPages();
      }
    } catch (e: any) {
      showToast(e.message, 'error');
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filtered.map(p => p.id)));
  };

  const openPreview = async (page: SeoPage) => {
    setPreviewTitle(page.title);
    setPreviewHtml(page.htmlContent || '<p>No content</p>');
  };

  const filtered = pages.filter(p => statusFilter === 'all' || p.status === statusFilter);

  const stats = {
    total: pages.length,
    published: pages.filter(p => p.status === 'published').length,
    ready: pages.filter(p => p.status === 'generated').length,
  };

  const statusBadge = (status: string) => {
    if (status === 'published') return <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-emerald-900/40 text-emerald-400 border border-emerald-700/30"><CheckCircle className="w-3 h-3" /> Published</span>;
    if (status === 'generated') return <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-yellow-900/40 text-yellow-400 border border-yellow-700/30"><Clock className="w-3 h-3" /> Ready</span>;
    return <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-red-900/40 text-red-400 border border-red-700/30"><XCircle className="w-3 h-3" /> {status}</span>;
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 text-sm font-medium transition-all ${toast.type === 'success' ? 'bg-emerald-900 border border-emerald-700 text-emerald-200' : 'bg-red-900 border border-red-700 text-red-200'}`}>
          {toast.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Globe className="w-5 h-5 text-blue-400" />
            Programmatic SEO Engine
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">Bulk-generate high-intent landing pages that rank on Google with zero competition.</p>
        </div>
        <button onClick={handleGenerate} disabled={generating || !nicheInput.trim()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors">
          {generating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Generate Pages
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Pages', value: stats.total, color: 'text-white' },
          { label: 'Published', value: stats.published, color: 'text-emerald-400' },
          { label: 'Ready to Publish', value: stats.ready, color: 'text-yellow-400' },
        ].map(stat => (
          <div key={stat.label} className="bg-slate-800/60 border border-slate-700/40 rounded-xl p-4 text-center">
            <div className={`text-3xl font-black ${stat.color}`}>{stat.value}</div>
            <div className="text-xs text-slate-500 mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* GitHub Repo + Publish Row */}
      <div className="bg-slate-800/60 border border-slate-700/40 rounded-xl p-4 flex items-center gap-3 flex-wrap">
        <Github className="w-5 h-5 text-slate-400 shrink-0" />
        <div className="relative flex-1 min-w-52" ref={dropdownRef}>
          <input
            type="text"
            value={repoInput}
            onChange={e => setRepoInput(e.target.value)}
            onFocus={() => setShowRepoDropdown(true)}
            placeholder="owner/repo-name (e.g. samayhuf/Adio-28-Jan--V1)"
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
          {showRepoDropdown && githubRepos.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-10 max-h-48 overflow-y-auto">
              {reposLoading ? (
                <div className="p-3 text-slate-400 text-sm flex items-center gap-2"><RefreshCw className="w-3 h-3 animate-spin" /> Loading repos...</div>
              ) : (
                githubRepos.map(repo => (
                  <button key={repo.name} onClick={() => { setRepoInput(repo.name); setShowRepoDropdown(false); }}
                    className="w-full text-left px-3 py-2 text-sm text-slate-200 hover:bg-slate-700 flex items-center justify-between">
                    <span>{repo.name}</span>
                    {repo.private && <span className="text-xs text-slate-500 bg-slate-700 px-1.5 py-0.5 rounded">private</span>}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
        <Button onClick={handlePublish} disabled={publishing || !repoInput.trim()}
          className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white border border-slate-600 text-sm"
          variant="outline">
          {publishing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Github className="w-4 h-4" />}
          Publish {selectedIds.size > 0 ? `${selectedIds.size} Selected` : 'All'} to GitHub
        </Button>
      </div>

      {/* Niche Input */}
      <div className="bg-slate-800/60 border border-slate-700/40 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-white">Niches to Generate (one per line)</label>
          <span className="text-xs text-slate-500">{nicheInput.split('\n').filter(l => l.trim()).length} / 50</span>
        </div>
        <textarea
          value={nicheInput}
          onChange={e => setNicheInput(e.target.value)}
          rows={5}
          placeholder={`e-commerce\nsaas\nreal-estate\nhealthcare\nlegal-services`}
          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-y"
        />
        <div className="flex flex-wrap gap-1.5">
          <span className="text-xs text-slate-500 self-center">Quick add:</span>
          {PREDEFINED_NICHES.slice(0, 12).map(n => (
            <button key={n} onClick={() => setNicheInput(prev => prev ? `${prev}\n${n}` : n)}
              className="text-xs px-2 py-0.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-full transition-colors border border-slate-600">
              + {n}
            </button>
          ))}
        </div>
      </div>

      {/* Generation Progress */}
      {generateProgress && (
        <div className="bg-blue-900/20 border border-blue-700/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />
            <span className="text-sm text-blue-300 font-medium">
              Generating pages… {generateProgress.done}/{generateProgress.total}
            </span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2">
            <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${(generateProgress.done / generateProgress.total) * 100}%` }} />
          </div>
          <p className="text-xs text-slate-400 mt-1.5">Working on: <span className="text-blue-300">{generateProgress.current}</span></p>
        </div>
      )}

      {/* Pages Table */}
      <div className="bg-slate-800/60 border border-slate-700/40 rounded-xl overflow-hidden">
        {/* Table Header Actions */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/40 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="text-xs bg-slate-700 border border-slate-600 rounded-lg px-2 py-1.5 text-slate-300 focus:outline-none"
            >
              <option value="all">All ({pages.length})</option>
              <option value="generated">Ready ({stats.ready})</option>
              <option value="published">Published ({stats.published})</option>
            </select>
            {selectedIds.size > 0 && (
              <span className="text-xs text-slate-400">{selectedIds.size} selected</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {selectedIds.size > 0 && (
              <button onClick={handleDelete}
                className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 bg-red-900/20 hover:bg-red-900/30 px-3 py-1.5 rounded-lg transition-colors border border-red-700/30">
                <Trash2 className="w-3.5 h-3.5" /> Delete Selected
              </button>
            )}
            <button onClick={loadPages} disabled={loading}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white bg-slate-700 px-3 py-1.5 rounded-lg transition-colors">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <RefreshCw className="w-6 h-6 text-blue-400 animate-spin mr-3" />
            <span className="text-slate-400">Loading pages…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Globe className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">No pages yet. Enter niches above and click Generate Pages.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-900/50 border-b border-slate-700/40 text-slate-400">
                  <th className="px-4 py-3 text-left w-8">
                    <input type="checkbox"
                      checked={selectedIds.size === filtered.length && filtered.length > 0}
                      onChange={toggleSelectAll}
                      className="accent-blue-500 w-3.5 h-3.5" />
                  </th>
                  <th className="px-4 py-3 text-left font-medium">Page</th>
                  <th className="px-4 py-3 text-left font-medium">Niche / Slug</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Created</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {filtered.map(page => (
                  <tr key={page.id} className={`hover:bg-slate-700/20 transition-colors ${selectedIds.has(page.id) ? 'bg-blue-900/10' : ''}`}>
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={selectedIds.has(page.id)} onChange={() => toggleSelect(page.id)}
                        className="accent-blue-500 w-3.5 h-3.5" />
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <p className="text-slate-200 font-medium truncate">{page.title}</p>
                      {page.metaDescription && (
                        <p className="text-slate-500 truncate mt-0.5">{page.metaDescription}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-blue-400 font-medium">/{page.slug}</div>
                      <div className="text-slate-500 capitalize">{page.niche.replace(/-/g, ' ')}</div>
                    </td>
                    <td className="px-4 py-3">{statusBadge(page.status)}</td>
                    <td className="px-4 py-3 text-right text-slate-500">
                      {new Date(page.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => openPreview(page)}
                        className="text-slate-400 hover:text-blue-400 transition-colors p-1.5 rounded hover:bg-slate-700"
                        title="Preview">
                        <Eye className="w-4 h-4" />
                      </button>
                      {page.githubRepo && (
                        <a href={`https://${page.githubRepo.split('/')[0]}.github.io/${page.githubRepo.split('/')[1]}/${page.slug}.html`}
                          target="_blank" rel="noopener noreferrer"
                          className="text-slate-400 hover:text-emerald-400 transition-colors p-1.5 rounded hover:bg-slate-700 inline-flex"
                          title="View on GitHub Pages">
                          <Github className="w-4 h-4" />
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {previewHtml && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => setPreviewHtml(null)}>
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2"><Eye className="w-4 h-4 text-blue-400" /> {previewTitle}</h3>
              <button onClick={() => setPreviewHtml(null)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-hidden rounded-b-2xl">
              <iframe
                srcDoc={previewHtml}
                className="w-full h-full min-h-[60vh]"
                sandbox="allow-same-origin"
                title="Page Preview"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
