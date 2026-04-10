import { useState, useEffect, useCallback } from 'react';
import { 
  FileText, Play, RefreshCw, Download, Trash2, 
  AlertCircle, CheckCircle, Clock, XCircle, 
  RotateCcw, ChevronDown, ChevronUp, Zap
} from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

interface Job {
  id: number;
  keyword: string;
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'skipped';
  articleSlug: string | null;
  errorMsg: string | null;
  wordCount: number | null;
  category: string | null;
  batchId: string | null;
  createdAt: string | null;
  completedAt: string | null;
}

interface QueueSummary {
  queued?: number;
  processing?: number;
  completed?: number;
  failed?: number;
  skipped?: number;
}

interface BulkBlogGeneratorProps {
  token: string;
}

const STATUS_CONFIG = {
  queued: { label: 'Queued', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: Clock },
  processing: { label: 'Processing', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: RefreshCw },
  completed: { label: 'Done', color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: CheckCircle },
  failed: { label: 'Failed', color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: XCircle },
  skipped: { label: 'Skipped', color: 'bg-slate-500/20 text-slate-400 border-slate-500/30', icon: AlertCircle },
};

export function BulkBlogGenerator({ token }: BulkBlogGeneratorProps) {
  const [keywords, setKeywords] = useState('');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [summary, setSummary] = useState<QueueSummary>({});
  const [loading, setLoading] = useState(false);
  const [queueLoading, setQueueLoading] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ queued: number; skipped: number; batchId: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showInstructions, setShowInstructions] = useState(true);
  const [clearLoading, setClearLoading] = useState(false);

  const adminFetch = useCallback(async (url: string, options: RequestInit = {}) => {
    return fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...(options.headers || {}),
      },
    });
  }, [token]);

  const fetchQueue = useCallback(async () => {
    setQueueLoading(true);
    try {
      const res = await adminFetch('/api/superadmin/blog/bulk-queue');
      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs || []);
        setSummary(data.summary || {});
      }
    } catch (err) {
      console.error('Failed to fetch queue:', err);
    } finally {
      setQueueLoading(false);
    }
  }, [adminFetch]);

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 8000);
    return () => clearInterval(interval);
  }, [fetchQueue]);

  const handleSubmit = async () => {
    setError(null);
    setSubmitResult(null);
    const lines = keywords.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) {
      setError('Please enter at least one keyword.');
      return;
    }
    if (lines.length > 500) {
      setError('Maximum 500 keywords per batch.');
      return;
    }
    setLoading(true);
    try {
      const res = await adminFetch('/api/superadmin/blog/bulk-generate', {
        method: 'POST',
        body: JSON.stringify({ keywords: lines }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to queue articles');
        return;
      }
      setSubmitResult(data);
      setKeywords('');
      await fetchQueue();
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleRetrySelected = async () => {
    if (selectedIds.size === 0) return;
    try {
      await adminFetch('/api/superadmin/blog/bulk-retry', {
        method: 'POST',
        body: JSON.stringify({ jobIds: Array.from(selectedIds) }),
      });
      setSelectedIds(new Set());
      await fetchQueue();
    } catch (err) {
      console.error('Retry failed:', err);
    }
  };

  const handleRetryAll = async () => {
    const failedIds = jobs.filter(j => j.status === 'failed').map(j => j.id);
    if (failedIds.length === 0) return;
    try {
      await adminFetch('/api/superadmin/blog/bulk-retry', {
        method: 'POST',
        body: JSON.stringify({ jobIds: failedIds }),
      });
      await fetchQueue();
    } catch (err) {
      console.error('Retry all failed:', err);
    }
  };

  const handleClear = async (statuses: string[]) => {
    setClearLoading(true);
    try {
      await adminFetch('/api/superadmin/blog/bulk-clear', {
        method: 'DELETE',
        body: JSON.stringify({ status: statuses }),
      });
      await fetchQueue();
    } catch (err) {
      console.error('Clear failed:', err);
    } finally {
      setClearLoading(false);
    }
  };

  const handleExportCsv = () => {
    const url = '/api/superadmin/blog/bulk-export-csv';
    const a = document.createElement('a');
    a.href = url;
    a.setAttribute('data-auth', token);
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.blob())
      .then(blob => {
        const objUrl = URL.createObjectURL(blob);
        a.href = objUrl;
        a.download = 'bulk-articles.csv';
        a.click();
        URL.revokeObjectURL(objUrl);
      });
  };

  const toggleSelect = (id: number) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const filteredJobs = statusFilter === 'all' ? jobs : jobs.filter(j => j.status === statusFilter);

  const total = Object.values(summary).reduce((a, b) => a + b, 0);
  const progressPct = total > 0 ? Math.round(((summary.completed || 0) / total) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Bulk Article Generator</h2>
            <p className="text-sm text-slate-400">Auto-generate & publish SEO-optimized articles at scale</p>
          </div>
        </div>
        <Button
          onClick={fetchQueue}
          variant="outline"
          size="sm"
          disabled={queueLoading}
          className="border-slate-600 text-slate-300 hover:bg-slate-700"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${queueLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {(['queued', 'processing', 'completed', 'failed', 'skipped'] as const).map(status => {
          const cfg = STATUS_CONFIG[status];
          const Icon = cfg.icon;
          return (
            <button
              key={status}
              onClick={() => setStatusFilter(statusFilter === status ? 'all' : status)}
              className={`p-4 rounded-xl border text-left transition-all ${
                statusFilter === status
                  ? 'bg-slate-700/80 border-slate-500'
                  : 'bg-slate-800/50 border-slate-700/50 hover:border-slate-500'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon className="w-4 h-4 text-slate-400" />
                <span className="text-xs text-slate-400 uppercase tracking-wide">{cfg.label}</span>
              </div>
              <p className="text-2xl font-bold text-white">{summary[status] || 0}</p>
            </button>
          );
        })}
      </div>

      {/* Progress Bar */}
      {total > 0 && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-300">Overall Progress</span>
            <span className="text-sm font-semibold text-white">{summary.completed || 0} / {total} articles</span>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 mt-1">{progressPct}% complete</p>
        </div>
      )}

      {/* Instructions Toggle */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
        <button
          className="w-full p-4 flex items-center justify-between text-left"
          onClick={() => setShowInstructions(!showInstructions)}
        >
          <span className="text-sm font-medium text-slate-300">How to generate articles</span>
          {showInstructions ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>
        {showInstructions && (
          <div className="px-4 pb-4 space-y-2 text-sm text-slate-400">
            <p>1. Enter one keyword per line below (e.g. "how to reduce google ads cpc")</p>
            <p>2. Each keyword becomes a ~1,200-word published blog article</p>
            <p>3. Articles are auto-categorized, tagged, and added to the sitemap</p>
            <p>4. The system processes up to 3 articles at once — larger batches take time</p>
            <p>5. After generation, export a CSV of article URLs for Google Ads targeting</p>
            <p className="text-yellow-400">Max 500 keywords per batch. Each article costs ~$0.02–0.05 in AI tokens.</p>
          </div>
        )}
      </div>

      {/* Keyword Input */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <FileText className="w-4 h-4 text-purple-400" />
          Enter Keywords (one per line)
        </h3>
        <textarea
          value={keywords}
          onChange={e => setKeywords(e.target.value)}
          placeholder="how to reduce google ads cost per click&#10;google ads quality score optimization&#10;best bidding strategies for google ads&#10;..."
          rows={10}
          className="w-full bg-slate-900/70 border border-slate-600 rounded-lg px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 resize-y font-mono"
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {keywords.split('\n').filter(l => l.trim()).length} keywords entered
          </span>
          <Button
            onClick={handleSubmit}
            disabled={loading || !keywords.trim()}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Queuing...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Start Generation
              </>
            )}
          </Button>
        </div>

        {submitResult && (
          <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
            <p className="text-green-400 text-sm font-medium">
              Queued {submitResult.queued} articles successfully
              {submitResult.skipped > 0 && ` (${submitResult.skipped} skipped — already exist)`}
            </p>
            <p className="text-xs text-slate-400 mt-1">Batch ID: {submitResult.batchId}</p>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}
      </div>

      {/* Queue Management */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-700/50 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-white">Generation Queue</h3>
          <div className="flex flex-wrap items-center gap-2">
            {/* Filter buttons */}
            {(['all', 'queued', 'processing', 'completed', 'failed', 'skipped'] as const).map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  statusFilter === s
                    ? 'bg-slate-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                {s === 'all' ? 'All' : STATUS_CONFIG[s as keyof typeof STATUS_CONFIG].label}
              </button>
            ))}
            <div className="w-px h-4 bg-slate-600" />
            {selectedIds.size > 0 && (
              <Button
                size="sm"
                onClick={handleRetrySelected}
                className="bg-blue-600 text-white hover:bg-blue-700 text-xs h-7 px-3"
              >
                <RotateCcw className="w-3 h-3 mr-1" />
                Retry {selectedIds.size} selected
              </Button>
            )}
            {(summary.failed || 0) > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleRetryAll}
                className="border-red-500/50 text-red-400 hover:bg-red-500/10 text-xs h-7 px-3"
              >
                <RotateCcw className="w-3 h-3 mr-1" />
                Retry All Failed
              </Button>
            )}
            {(summary.completed || 0) > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleExportCsv}
                className="border-green-500/50 text-green-400 hover:bg-green-500/10 text-xs h-7 px-3"
              >
                <Download className="w-3 h-3 mr-1" />
                Export CSV
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleClear(['completed', 'skipped'])}
              disabled={clearLoading}
              className="border-slate-600 text-slate-400 hover:bg-slate-700 text-xs h-7 px-3"
            >
              <Trash2 className="w-3 h-3 mr-1" />
              Clear Done
            </Button>
          </div>
        </div>

        {filteredJobs.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">
              {statusFilter === 'all' ? 'No articles in queue. Add keywords above to start.' : `No ${statusFilter} jobs.`}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-700/50 max-h-[600px] overflow-y-auto">
            {filteredJobs.map(job => {
              const cfg = STATUS_CONFIG[job.status];
              const Icon = cfg.icon;
              const isSelected = selectedIds.has(job.id);
              return (
                <div
                  key={job.id}
                  className={`flex items-center gap-3 px-4 py-3 hover:bg-slate-700/20 transition-colors ${
                    isSelected ? 'bg-slate-700/30' : ''
                  }`}
                >
                  {(job.status === 'failed' || job.status === 'skipped') && (
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(job.id)}
                      className="w-4 h-4 rounded border-slate-500 bg-slate-700 text-purple-500 cursor-pointer"
                    />
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm text-white font-medium truncate">{job.keyword}</span>
                      {job.category && (
                        <span className="text-xs text-slate-500 bg-slate-700/50 px-2 py-0.5 rounded-full">{job.category}</span>
                      )}
                    </div>
                    {job.articleSlug && (
                      <a
                        href={`/blog/${job.articleSlug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-purple-400 hover:text-purple-300 truncate block"
                      >
                        /blog/{job.articleSlug}
                      </a>
                    )}
                    {job.errorMsg && (
                      <p className="text-xs text-red-400 mt-0.5 truncate">{job.errorMsg}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {job.wordCount && (
                      <span className="text-xs text-slate-500">{job.wordCount.toLocaleString()}w</span>
                    )}
                    <Badge className={`${cfg.color} text-xs flex items-center gap-1`}>
                      <Icon className={`w-3 h-3 ${job.status === 'processing' ? 'animate-spin' : ''}`} />
                      {cfg.label}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Tips */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-800/30 border border-slate-700/30 rounded-xl p-4">
          <h4 className="text-sm font-semibold text-white mb-2">Best Keywords</h4>
          <p className="text-xs text-slate-400">Target long-tail keywords like "how to lower google ads cpc for e-commerce" — easier to rank and more specific intent.</p>
        </div>
        <div className="bg-slate-800/30 border border-slate-700/30 rounded-xl p-4">
          <h4 className="text-sm font-semibold text-white mb-2">Google Ads Strategy</h4>
          <p className="text-xs text-slate-400">After articles rank (4–8 weeks), run Google Ads to drive immediate traffic to top-performing articles to accelerate conversions.</p>
        </div>
        <div className="bg-slate-800/30 border border-slate-700/30 rounded-xl p-4">
          <h4 className="text-sm font-semibold text-white mb-2">Export & Promote</h4>
          <p className="text-xs text-slate-400">Download the CSV of article URLs once articles are published. Upload to Google Ads as URL-based targets for content campaigns.</p>
        </div>
      </div>
    </div>
  );
}
