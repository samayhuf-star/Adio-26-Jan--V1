import { useState, useEffect } from 'react';
import { 
  MessageCircle, RefreshCw, Send, Power, PowerOff,
  Phone, Clock, CheckCircle, XCircle, AlertTriangle
} from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

interface WhatsAppStatus {
  configured: boolean;
  enabled: boolean;
  lastReportTime: string | null;
  recipientNumber: string;
  intervalMinutes: number;
}

interface WhatsAppConfigPanelProps {
  token: string;
}

export function WhatsAppConfigPanel({ token }: WhatsAppConfigPanelProps) {
  const [status, setStatus] = useState<WhatsAppStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/superadmin/whatsapp-status', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch (err) {
      console.error('Failed to load WhatsApp status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStatus(); }, []);

  const toggleReporting = async () => {
    if (!status) return;
    setActionLoading('toggle');
    try {
      const res = await fetch('/api/superadmin/whatsapp-toggle', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !status.enabled }),
      });
      if (res.ok) {
        const data = await res.json();
        setStatus({ ...status, enabled: data.enabled });
        setMessage({ type: 'success', text: `Hourly reporting ${data.enabled ? 'enabled' : 'disabled'}` });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to toggle reporting' });
    } finally {
      setActionLoading('');
    }
  };

  const sendTest = async () => {
    setActionLoading('test');
    try {
      const res = await fetch('/api/superadmin/whatsapp-test', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setMessage({ type: data.success ? 'success' : 'error', text: data.success ? 'Test message sent to WhatsApp!' : 'Failed to send test message. Check API credentials.' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to send test message' });
    } finally {
      setActionLoading('');
    }
  };

  const sendReport = async () => {
    setActionLoading('report');
    try {
      const res = await fetch('/api/superadmin/whatsapp-send-report', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'System report sent to WhatsApp!' });
        fetchStatus();
      } else {
        setMessage({ type: 'error', text: 'Failed to send report. Check API credentials.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to send report' });
    } finally {
      setActionLoading('');
    }
  };

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <MessageCircle className="w-6 h-6 text-green-400" />
            WhatsApp Reporting
          </h3>
          <p className="text-sm text-slate-400 mt-1">Hourly system reports sent to your WhatsApp</p>
        </div>
        <Button
          onClick={fetchStatus}
          disabled={loading}
          variant="outline"
          size="sm"
          className="border-slate-600 text-slate-300 hover:bg-slate-700"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {message && (
        <div className={`p-4 rounded-lg flex items-center gap-3 ${message.type === 'success' ? 'bg-green-500/20 border border-green-500/30' : 'bg-red-500/20 border border-red-500/30'}`}>
          {message.type === 'success' ? <CheckCircle className="w-5 h-5 text-green-400" /> : <XCircle className="w-5 h-5 text-red-400" />}
          <p className={`text-sm ${message.type === 'success' ? 'text-green-300' : 'text-red-300'}`}>{message.text}</p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="w-6 h-6 text-slate-400 animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${status?.configured ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                  <MessageCircle className={`w-5 h-5 ${status?.configured ? 'text-green-400' : 'text-red-400'}`} />
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider">API Status</p>
                  <Badge className={status?.configured ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}>
                    {status?.configured ? 'Configured' : 'Not Configured'}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${status?.enabled ? 'bg-green-500/20' : 'bg-orange-500/20'}`}>
                  {status?.enabled ? <Power className="w-5 h-5 text-green-400" /> : <PowerOff className="w-5 h-5 text-orange-400" />}
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider">Reporting</p>
                  <Badge className={status?.enabled ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-orange-500/20 text-orange-400 border-orange-500/30'}>
                    {status?.enabled ? 'Active' : 'Paused'}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider">Last Report</p>
                  <p className="text-sm font-medium text-white">{formatDate(status?.lastReportTime || null)}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
            <h4 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Phone className="w-4 h-4 text-green-400" />
              Configuration
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between p-3 bg-slate-700/30 rounded-lg">
                <span className="text-slate-400">Recipient Number</span>
                <span className="text-white font-mono">{status?.recipientNumber}</span>
              </div>
              <div className="flex justify-between p-3 bg-slate-700/30 rounded-lg">
                <span className="text-slate-400">Report Interval</span>
                <span className="text-white">Every {status?.intervalMinutes} minutes</span>
              </div>
            </div>

            {!status?.configured && (
              <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-300">WhatsApp API Not Configured</p>
                    <p className="text-xs text-amber-200/70 mt-1">
                      To enable WhatsApp reporting, add these environment variables:
                    </p>
                    <ul className="text-xs text-amber-200/70 mt-2 space-y-1 list-disc pl-4">
                      <li><code className="bg-amber-500/20 px-1 rounded">WHATSAPP_PHONE_NUMBER_ID</code> - Your Meta Business phone number ID</li>
                      <li><code className="bg-amber-500/20 px-1 rounded">WHATSAPP_ACCESS_TOKEN</code> - Your permanent system user access token</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
            <h4 className="text-sm font-semibold text-white mb-4">Actions</h4>
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={toggleReporting}
                disabled={!!actionLoading || !status?.configured}
                variant="outline"
                className={status?.enabled 
                  ? 'border-orange-500/50 text-orange-400 hover:bg-orange-500/20' 
                  : 'border-green-500/50 text-green-400 hover:bg-green-500/20'
                }
              >
                {status?.enabled ? <PowerOff className="w-4 h-4 mr-2" /> : <Power className="w-4 h-4 mr-2" />}
                {actionLoading === 'toggle' ? 'Updating...' : status?.enabled ? 'Pause Reporting' : 'Enable Reporting'}
              </Button>
              <Button
                onClick={sendTest}
                disabled={!!actionLoading || !status?.configured}
                variant="outline"
                className="border-blue-500/50 text-blue-400 hover:bg-blue-500/20"
              >
                <Send className="w-4 h-4 mr-2" />
                {actionLoading === 'test' ? 'Sending...' : 'Send Test Message'}
              </Button>
              <Button
                onClick={sendReport}
                disabled={!!actionLoading || !status?.configured}
                variant="outline"
                className="border-purple-500/50 text-purple-400 hover:bg-purple-500/20"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                {actionLoading === 'report' ? 'Sending...' : 'Send Report Now'}
              </Button>
            </div>
          </div>

          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
            <h4 className="text-sm font-semibold text-white mb-3">Report Format Preview</h4>
            <pre className="text-xs text-slate-300 bg-slate-900/50 p-4 rounded-lg whitespace-pre-wrap font-mono leading-relaxed">
{`📊 ADIOLOGY SYSTEM REPORT
🕐 2:00 PM | 17 Feb 2026
━━━━━━━━━━━━━━━━━━━━

👥 USERS
• Total: 156
• New Today: 3
• Blocked: 2

💳 SUBSCRIPTIONS
• Active: 45
• Trialing: 12
• Canceled: 8

💰 REVENUE
• MRR: $4,851
• Today's Payments: $198.00

📧 EMAILS
• Sent Today: 24
• Total Sent: 1,456

🤖 AI USAGE (Today)
• Requests: 89
• Tokens: 125,400
• Cost: $0.1254

🖥️ SYSTEM
• Memory: 256 MB
• Uptime: 72.5 hrs
• DB Size: 45 MB

━━━━━━━━━━━━━━━━━━━━
✅ All systems operational`}
            </pre>
          </div>
        </>
      )}
    </div>
  );
}
