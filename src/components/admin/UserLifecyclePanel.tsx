import { useState, useEffect } from 'react';
import {
  X, User, Mail, CreditCard, Shield, Clock, LogIn,
  CheckCircle, XCircle, AlertTriangle, ArrowLeft,
  DollarSign, Calendar, Activity, Eye, MousePointer,
  UserPlus, Lock, Unlock, Edit, Trash2, RefreshCw,
  ChevronDown, ChevronUp, Send
} from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

interface UserLifecyclePanelProps {
  userId: string;
  token: string;
  onClose: () => void;
}

interface TimelineEvent {
  id: string;
  type: string;
  title: string;
  description?: string;
  timestamp: string;
  source: 'event' | 'email' | 'audit' | 'payment' | 'subscription';
  metadata?: any;
}

const EVENT_CONFIG: Record<string, { icon: any; color: string; bgColor: string }> = {
  signup: { icon: UserPlus, color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
  login: { icon: LogIn, color: 'text-cyan-400', bgColor: 'bg-cyan-500/20' },
  email_verification_sent: { icon: Send, color: 'text-purple-400', bgColor: 'bg-purple-500/20' },
  email_verified: { icon: CheckCircle, color: 'text-green-400', bgColor: 'bg-green-500/20' },
  email_sent: { icon: Mail, color: 'text-purple-400', bgColor: 'bg-purple-500/20' },
  email_opened: { icon: Eye, color: 'text-purple-300', bgColor: 'bg-purple-500/20' },
  email_clicked: { icon: MousePointer, color: 'text-purple-200', bgColor: 'bg-purple-500/20' },
  email_bounced: { icon: XCircle, color: 'text-red-400', bgColor: 'bg-red-500/20' },
  payment_succeeded: { icon: DollarSign, color: 'text-emerald-400', bgColor: 'bg-emerald-500/20' },
  payment_failed: { icon: XCircle, color: 'text-red-400', bgColor: 'bg-red-500/20' },
  subscription_created: { icon: CreditCard, color: 'text-orange-400', bgColor: 'bg-orange-500/20' },
  subscription_canceled: { icon: XCircle, color: 'text-red-400', bgColor: 'bg-red-500/20' },
  subscription_upgraded: { icon: Activity, color: 'text-amber-400', bgColor: 'bg-amber-500/20' },
  subscription_reactivated: { icon: RefreshCw, color: 'text-green-400', bgColor: 'bg-green-500/20' },
  trial_started: { icon: Clock, color: 'text-cyan-400', bgColor: 'bg-cyan-500/20' },
  checkout_completed: { icon: CheckCircle, color: 'text-green-400', bgColor: 'bg-green-500/20' },
  card_validated: { icon: CreditCard, color: 'text-green-400', bgColor: 'bg-green-500/20' },
  password_reset_requested: { icon: Lock, color: 'text-yellow-400', bgColor: 'bg-yellow-500/20' },
  password_reset_completed: { icon: Lock, color: 'text-green-400', bgColor: 'bg-green-500/20' },
  password_changed: { icon: Lock, color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
  profile_updated: { icon: Edit, color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
  blocked: { icon: Shield, color: 'text-red-400', bgColor: 'bg-red-500/20' },
  unblocked: { icon: Unlock, color: 'text-green-400', bgColor: 'bg-green-500/20' },
  deleted: { icon: Trash2, color: 'text-red-400', bgColor: 'bg-red-500/20' },
  admin_edit: { icon: Edit, color: 'text-amber-400', bgColor: 'bg-amber-500/20' },
  error: { icon: AlertTriangle, color: 'text-red-400', bgColor: 'bg-red-500/20' },
};

const DEFAULT_EVENT = { icon: Activity, color: 'text-slate-400', bgColor: 'bg-slate-500/20' };

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return 'Never';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function timeSince(dateStr: string | null | undefined): string {
  if (!dateStr) return 'N/A';
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export function UserLifecyclePanel({ userId, token, onClose }: UserLifecyclePanelProps) {
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchLifecycle();
  }, [userId]);

  const fetchLifecycle = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/superadmin/users/${userId}/lifecycle`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setUserData(data);
      buildTimeline(data);
    } catch (error) {
      console.error('Failed to fetch user lifecycle:', error);
    } finally {
      setLoading(false);
    }
  };

  const buildTimeline = (data: any) => {
    const events: TimelineEvent[] = [];

    (data.events || []).forEach((e: any) => {
      events.push({
        id: `evt-${e.id}`,
        type: e.eventType,
        title: e.title,
        description: e.description,
        timestamp: e.createdAt,
        source: 'event',
        metadata: e.metadata,
      });
    });

    (data.emailLogs || []).forEach((e: any) => {
      if (!data.events?.some((ev: any) => ev.eventType === 'email_sent' && ev.metadata?.subject === e.subject)) {
        events.push({
          id: `email-${e.id}`,
          type: 'email_sent',
          title: `Email: ${e.subject}`,
          description: `Status: ${e.status}${e.opens > 0 ? `, Opened ${e.opens}x` : ''}${e.clicks > 0 ? `, Clicked ${e.clicks}x` : ''}`,
          timestamp: e.sentAt,
          source: 'email',
          metadata: { templateId: e.templateId, status: e.status, opens: e.opens, clicks: e.clicks, error: e.error },
        });
      }
    });

    (data.auditLogs || []).forEach((e: any) => {
      events.push({
        id: `audit-${e.id}`,
        type: e.action?.includes('block') ? (e.action === 'user_blocked' ? 'blocked' : 'unblocked') : 'admin_edit',
        title: `Admin: ${(e.action || '').replace(/_/g, ' ')}`,
        description: e.details ? JSON.stringify(e.details) : undefined,
        timestamp: e.createdAt,
        source: 'audit',
        metadata: { oldValues: e.oldValues, newValues: e.newValues },
      });
    });

    (data.payments || []).forEach((e: any) => {
      if (!data.events?.some((ev: any) => ev.eventType?.startsWith('payment_') && 
        Math.abs(new Date(ev.createdAt).getTime() - new Date(e.createdAt).getTime()) < 60000)) {
        events.push({
          id: `pay-${e.id}`,
          type: e.status === 'succeeded' ? 'payment_succeeded' : 'payment_failed',
          title: `Payment ${e.status}: $${((e.amountCents || 0) / 100).toFixed(2)}`,
          description: e.description,
          timestamp: e.paidAt || e.createdAt,
          source: 'payment',
          metadata: { amountCents: e.amountCents, currency: e.currency, receiptUrl: e.receiptUrl },
        });
      }
    });

    events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    setTimeline(events);
  };

  const toggleExpand = (id: string) => {
    setExpandedEvents(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
        <div className="bg-slate-900 rounded-2xl p-8 flex items-center gap-3">
          <RefreshCw className="w-5 h-5 text-indigo-400 animate-spin" />
          <span className="text-slate-300">Loading user lifecycle...</span>
        </div>
      </div>
    );
  }

  if (!userData?.user) {
    return (
      <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
        <div className="bg-slate-900 rounded-2xl p-8 text-center">
          <p className="text-slate-400 mb-4">User not found</p>
          <Button onClick={onClose} variant="outline">Close</Button>
        </div>
      </div>
    );
  }

  const user = userData.user;
  const totalPaid = (userData.payments || []).reduce((sum: number, p: any) => 
    p.status === 'succeeded' ? sum + (p.amountCents || 0) : sum, 0);
  const emailCount = (userData.emailLogs || []).length;
  const accountAge = Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="fixed inset-0 bg-black/60 z-50 overflow-y-auto">
      <div className="min-h-screen flex items-start justify-center p-4 pt-8">
        <div className="w-full max-w-4xl bg-slate-900 rounded-2xl border border-slate-700/50 shadow-2xl">
          <div className="sticky top-0 z-10 bg-slate-900 rounded-t-2xl border-b border-slate-700/50 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-800 transition-colors">
                  <ArrowLeft className="w-5 h-5 text-slate-400" />
                </button>
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                  {(user.fullName || user.email || '?')[0].toUpperCase()}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">{user.fullName || 'No Name'}</h2>
                  <p className="text-sm text-slate-400">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={user.isBlocked ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}>
                  {user.isBlocked ? 'Blocked' : 'Active'}
                </Badge>
                <Badge className="bg-indigo-500/20 text-indigo-400">
                  {user.subscriptionPlan || 'Free'}
                </Badge>
                <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-800 transition-colors ml-2">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-6 py-4">
            <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/30">
              <div className="text-xs text-slate-500 mb-1">Account Age</div>
              <div className="text-lg font-semibold text-white">{accountAge}d</div>
              <div className="text-xs text-slate-500">{formatDate(user.createdAt)}</div>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/30">
              <div className="text-xs text-slate-500 mb-1">Total Paid</div>
              <div className="text-lg font-semibold text-emerald-400">${(totalPaid / 100).toFixed(2)}</div>
              <div className="text-xs text-slate-500">{userData.payments?.length || 0} payments</div>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/30">
              <div className="text-xs text-slate-500 mb-1">Emails Sent</div>
              <div className="text-lg font-semibold text-purple-400">{emailCount}</div>
              <div className="text-xs text-slate-500">to this user</div>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/30">
              <div className="text-xs text-slate-500 mb-1">Last Login</div>
              <div className="text-lg font-semibold text-cyan-400">{user.lastSignIn ? timeSince(user.lastSignIn) : 'Never'}</div>
              <div className="text-xs text-slate-500">{formatDate(user.lastSignIn)}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-6 pb-4">
            <div className="flex items-center gap-2 text-xs">
              <span className={`w-2 h-2 rounded-full ${user.emailVerified ? 'bg-green-400' : 'bg-red-400'}`} />
              <span className="text-slate-400">Email {user.emailVerified ? 'Verified' : 'Not Verified'}</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className={`w-2 h-2 rounded-full ${user.cardValidated ? 'bg-green-400' : 'bg-red-400'}`} />
              <span className="text-slate-400">Card {user.cardValidated ? 'Validated' : 'Not Validated'}</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500">Role:</span>
              <span className="text-slate-300">{user.role}</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500">Status:</span>
              <span className="text-slate-300">{user.subscriptionStatus || 'inactive'}</span>
            </div>
          </div>

          <div className="px-6 pb-6">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-semibold text-white">User Journey Timeline</h3>
              <Badge className="bg-slate-700 text-slate-300 text-xs">{timeline.length} events</Badge>
            </div>

            {timeline.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No lifecycle events recorded yet</p>
                <p className="text-xs mt-1">Events will appear here as the user interacts with the platform</p>
              </div>
            ) : (
              <div className="relative">
                <div className="absolute left-5 top-0 bottom-0 w-px bg-slate-700/50" />
                <div className="space-y-1">
                  {timeline.map((event) => {
                    const config = EVENT_CONFIG[event.type] || DEFAULT_EVENT;
                    const Icon = config.icon;
                    const isExpanded = expandedEvents.has(event.id);
                    const hasMetadata = event.metadata && Object.keys(event.metadata).length > 0;

                    return (
                      <div
                        key={event.id}
                        className="relative flex items-start gap-3 pl-1 py-2 group cursor-pointer hover:bg-slate-800/30 rounded-lg px-2 transition-colors"
                        onClick={() => hasMetadata && toggleExpand(event.id)}
                      >
                        <div className={`relative z-10 w-8 h-8 rounded-full ${config.bgColor} flex items-center justify-center flex-shrink-0`}>
                          <Icon className={`w-4 h-4 ${config.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium text-slate-200">{event.title}</span>
                            <Badge className="bg-slate-700/50 text-slate-500 text-[10px] px-1.5 py-0">{event.source}</Badge>
                            {hasMetadata && (
                              isExpanded ? <ChevronUp className="w-3 h-3 text-slate-500" /> : <ChevronDown className="w-3 h-3 text-slate-500" />
                            )}
                          </div>
                          {event.description && (
                            <p className="text-xs text-slate-500 mt-0.5 truncate">{event.description}</p>
                          )}
                          <p className="text-[11px] text-slate-600 mt-0.5">{formatDateTime(event.timestamp)}</p>
                          {isExpanded && hasMetadata && (
                            <div className="mt-2 p-2 bg-slate-800/50 rounded-lg border border-slate-700/30">
                              <pre className="text-[11px] text-slate-400 whitespace-pre-wrap overflow-x-auto">
                                {JSON.stringify(event.metadata, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
