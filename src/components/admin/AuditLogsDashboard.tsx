import { useState, useEffect } from 'react';
import { 
  Shield, RefreshCw, Search, Filter, Clock, User, 
  Edit, Trash2, Ban, CreditCard, Tag, LogIn, 
  AlertTriangle, Info, ChevronLeft, ChevronRight
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';

interface AuditLog {
  id: string;
  admin_user_id: string;
  action: string;
  resource_type: string;
  resource_id: string | null;
  old_values: any;
  new_values: any;
  details: any;
  level: string;
  created_at: string;
}

interface AuditLogsDashboardProps {
  token: string;
}

const actionIcons: Record<string, any> = {
  admin_login: LogIn,
  user_updated: Edit,
  user_blocked: Ban,
  user_unblocked: Ban,
  user_deleted: Trash2,
  subscription_updated: CreditCard,
  subscription_canceled: CreditCard,
  subscription_reactivated: CreditCard,
  subscription_deleted: Trash2,
  promo_code_created: Tag,
  promo_code_deactivated: Tag,
};

const actionLabels: Record<string, string> = {
  admin_login: 'Admin Login',
  user_updated: 'User Updated',
  user_blocked: 'User Blocked',
  user_unblocked: 'User Unblocked',
  user_deleted: 'User Deleted',
  subscription_updated: 'Subscription Updated',
  subscription_canceled: 'Subscription Canceled',
  subscription_reactivated: 'Subscription Reactivated',
  subscription_deleted: 'Subscription Deleted',
  promo_code_created: 'Promo Code Created',
  promo_code_deactivated: 'Promo Code Deactivated',
};

const levelColors: Record<string, string> = {
  info: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  warning: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  error: 'bg-red-500/20 text-red-400 border-red-500/30',
};

export function AuditLogsDashboard({ token }: AuditLogsDashboardProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [resourceFilter, setResourceFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchLogs = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '30' });
      if (searchTerm) params.set('action', searchTerm);
      if (resourceFilter) params.set('resource', resourceFilter);
      if (levelFilter) params.set('level', levelFilter);

      const res = await fetch(`/api/superadmin/audit-logs?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
        setLastRefresh(new Date());
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, [page, resourceFilter, levelFilter]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchLogs(true);
    }, 10000);
    return () => clearInterval(interval);
  }, [page, searchTerm, resourceFilter, levelFilter]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + 
      ' ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const formatTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Shield className="w-6 h-6 text-amber-400" />
            Audit Logs
          </h3>
          <p className="text-sm text-slate-400 mt-1">
            {total} total actions recorded
            <span className="ml-2 inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-400 text-xs">Live</span>
            </span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500">
            Updated {lastRefresh.toLocaleTimeString()}
          </span>
          <Button
            onClick={() => fetchLogs()}
            disabled={loading}
            variant="outline"
            size="sm"
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchLogs()}
            placeholder="Search by action..."
            className="pl-10 bg-slate-700/50 border-slate-600 text-white"
          />
        </div>
        <select
          value={resourceFilter}
          onChange={(e) => { setResourceFilter(e.target.value); setPage(1); }}
          className="bg-slate-700/50 border border-slate-600 rounded-md px-3 py-2 text-sm text-white"
        >
          <option value="">All Resources</option>
          <option value="user">Users</option>
          <option value="subscription">Subscriptions</option>
          <option value="promo_code">Promo Codes</option>
          <option value="session">Sessions</option>
        </select>
        <select
          value={levelFilter}
          onChange={(e) => { setLevelFilter(e.target.value); setPage(1); }}
          className="bg-slate-700/50 border border-slate-600 rounded-md px-3 py-2 text-sm text-white"
        >
          <option value="">All Levels</option>
          <option value="info">Info</option>
          <option value="warning">Warning</option>
          <option value="error">Error</option>
        </select>
      </div>

      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-6 h-6 text-slate-400 animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Shield className="w-12 h-12 mb-3 opacity-50" />
            <p className="text-lg font-medium">No audit logs found</p>
            <p className="text-sm">Actions will appear here as they are performed</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-700/50">
            {logs.map((log) => {
              const IconComponent = actionIcons[log.action] || Info;
              const isExpanded = expandedLog === log.id;
              return (
                <div
                  key={log.id}
                  className="px-5 py-4 hover:bg-slate-700/20 transition-colors cursor-pointer"
                  onClick={() => setExpandedLog(isExpanded ? null : log.id)}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      log.level === 'warning' ? 'bg-orange-500/20' : log.level === 'error' ? 'bg-red-500/20' : 'bg-blue-500/20'
                    }`}>
                      <IconComponent className={`w-4 h-4 ${
                        log.level === 'warning' ? 'text-orange-400' : log.level === 'error' ? 'text-red-400' : 'text-blue-400'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-white">
                          {actionLabels[log.action] || log.action}
                        </span>
                        <Badge className={levelColors[log.level] || levelColors.info}>
                          {log.level}
                        </Badge>
                        {log.resource_id && (
                          <span className="text-xs text-slate-500 font-mono truncate max-w-[200px]">
                            {log.resource_id}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {log.admin_user_id || 'system'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTimeAgo(log.created_at)}
                        </span>
                        <span>{formatDate(log.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-3 ml-13 pl-13 space-y-2">
                      {log.new_values && (
                        <div className="bg-slate-900/50 rounded-lg p-3">
                          <p className="text-xs font-medium text-slate-400 mb-1">Changes</p>
                          <pre className="text-xs text-emerald-400 whitespace-pre-wrap">
                            {JSON.stringify(log.new_values, null, 2)}
                          </pre>
                        </div>
                      )}
                      {log.old_values && (
                        <div className="bg-slate-900/50 rounded-lg p-3">
                          <p className="text-xs font-medium text-slate-400 mb-1">Previous Values</p>
                          <pre className="text-xs text-orange-400 whitespace-pre-wrap">
                            {JSON.stringify(log.old_values, null, 2)}
                          </pre>
                        </div>
                      )}
                      {log.details && (
                        <div className="bg-slate-900/50 rounded-lg p-3">
                          <p className="text-xs font-medium text-slate-400 mb-1">Details</p>
                          <pre className="text-xs text-slate-300 whitespace-pre-wrap">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-400">
            Page {page} of {totalPages} ({total} total)
          </p>
          <div className="flex gap-2">
            <Button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              variant="outline"
              size="sm"
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              variant="outline"
              size="sm"
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}