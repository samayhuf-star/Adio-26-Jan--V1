import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { 
  Mail, Search, RefreshCw, ChevronLeft, ChevronRight,
  CheckCircle, XCircle, Clock, Eye, MousePointer, AlertTriangle
} from 'lucide-react';
import { useAuth } from '../utils/authCompat';

interface EmailLog {
  id: string;
  recipient: string;
  subject: string;
  template_id: string | null;
  sequence_id: string | null;
  status: string;
  message_id: string | null;
  opens: number;
  clicks: number;
  sent_at: string;
  opened_at: string | null;
  clicked_at: string | null;
  bounced_at: string | null;
  error: string | null;
}

interface EmailStats {
  total: number;
  sent: number;
  failed: number;
  opened: number;
  clicked: number;
}

export function EmailLogs() {
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState<EmailStats>({ total: 0, sent: 0, failed: 0, opened: 0, clicked: 0 });
  const { getToken } = useAuthCompat();
  const perPage = 20;

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const params = new URLSearchParams({
        page: page.toString(),
        limit: perPage.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter !== 'all' && { status: statusFilter })
      });
      
      const response = await fetch(`/api/admin/email/logs?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs || []);
        setTotalPages(Math.ceil((data.total || 0) / perPage));
        setStats(data.stats || { total: 0, sent: 0, failed: 0, opened: 0, clicked: 0 });
      }
    } catch (error) {
      console.error('Failed to fetch email logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, statusFilter]);

  const handleSearch = () => {
    setPage(1);
    fetchLogs();
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge className="bg-green-100 text-green-700"><CheckCircle className="h-3 w-3 mr-1" />Sent</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-700"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>;
      case 'bounced':
        return <Badge className="bg-orange-100 text-orange-700"><AlertTriangle className="h-3 w-3 mr-1" />Bounced</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-700"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Email Logs</h2>
          <p className="text-gray-500">Track all outgoing emails with delivery status and engagement metrics</p>
        </div>
        <Button onClick={fetchLogs} variant="outline" className="flex items-center gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-500">Total Emails</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.sent}</div>
            <div className="text-sm text-gray-500">Sent</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
            <div className="text-sm text-gray-500">Failed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.opened}</div>
            <div className="text-sm text-gray-500 flex items-center justify-center gap-1">
              <Eye className="h-3 w-3" /> Opened
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.clicked}</div>
            <div className="text-sm text-gray-500 flex items-center justify-center gap-1">
              <MousePointer className="h-3 w-3" /> Clicked
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by email or subject..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10"
                />
              </div>
              <Button onClick={handleSearch} variant="secondary">Search</Button>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Status:</span>
              <select 
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="border rounded-md px-3 py-2 text-sm"
              >
                <option value="all">All</option>
                <option value="sent">Sent</option>
                <option value="failed">Failed</option>
                <option value="bounced">Bounced</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Mail className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No email logs found</p>
              <p className="text-sm">Emails will appear here once sent from the platform</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Recipient</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Subject</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Sent At</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-500">Opens</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-500">Clicks</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Template</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="font-medium">{log.recipient}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="max-w-xs truncate" title={log.subject}>
                          {log.subject}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {getStatusBadge(log.status)}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500">
                        {formatDate(log.sent_at)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Eye className="h-3 w-3 text-gray-400" />
                          <span>{log.opens || 0}</span>
                        </div>
                        {log.opened_at && (
                          <div className="text-xs text-gray-400">{formatDate(log.opened_at)}</div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <MousePointer className="h-3 w-3 text-gray-400" />
                          <span>{log.clicks || 0}</span>
                        </div>
                        {log.clicked_at && (
                          <div className="text-xs text-gray-400">{formatDate(log.clicked_at)}</div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {log.template_id ? (
                          <Badge variant="outline" className="text-xs">{log.template_id}</Badge>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <div className="text-sm text-gray-500">
                Page {page} of {totalPages}
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  disabled={page === totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default EmailLogs;
