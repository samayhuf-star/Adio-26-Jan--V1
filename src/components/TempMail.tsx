import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail, Copy, RefreshCw, Trash2, Plus, ChevronLeft,
  Clock, Paperclip, Check, AlertCircle, Inbox, Shield,
  Eye, Loader2, MailOpen, Timer, Shuffle, X, History, Search,
  Home
} from 'lucide-react';

const API_BASE = '/api/tempmail';

interface TempEmail {
  email: string;
  ttl: number;
}

interface MessageSummary {
  id: string;
  from: string;
  subject: string;
  created_at: string;
}

interface MessageDetail {
  id: string;
  from: string;
  to: string;
  subject: string;
  body_text: string;
  body_html: string;
  created_at: string;
  attachments: { id: string; name: string; size: number }[];
}

interface HistoryEntry {
  email: string;
  createdAt: number;
  ttl: number;
}

const HISTORY_KEY = 'tempmail_history';
const LAST_EMAIL_KEY = 'tempmail_last_email';
const MAX_HISTORY = 50;

function saveLastEmail(email: string, ttl: number, createdAt: number) {
  localStorage.setItem(LAST_EMAIL_KEY, JSON.stringify({ email, ttl, createdAt }));
}

function clearLastEmail() {
  localStorage.removeItem(LAST_EMAIL_KEY);
}

function loadLastEmail(): { email: string; ttl: number; createdAt: number } | null {
  try {
    const raw = localStorage.getItem(LAST_EMAIL_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    const elapsed = Math.floor((Date.now() - data.createdAt) / 1000);
    const remaining = Math.max(0, data.ttl - elapsed);
    if (remaining <= 0) {
      clearLastEmail();
      return null;
    }
    return data;
  } catch {
    clearLastEmail();
    return null;
  }
}

function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveHistory(entries: HistoryEntry[]) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(entries.slice(0, MAX_HISTORY)));
}

function addToHistory(email: string, ttl: number, isNew = true): HistoryEntry[] {
  const entries = loadHistory();
  const exists = entries.findIndex(e => e.email === email);
  if (exists >= 0) {
    if (isNew) {
      entries[exists].createdAt = Date.now();
      entries[exists].ttl = ttl;
    }
    const [existing] = entries.splice(exists, 1);
    entries.unshift(existing);
  } else {
    entries.unshift({ email, createdAt: Date.now(), ttl });
  }
  const trimmed = entries.slice(0, MAX_HISTORY);
  saveHistory(trimmed);
  return trimmed;
}

function removeFromHistory(email: string): HistoryEntry[] {
  const entries = loadHistory().filter(e => e.email !== email);
  saveHistory(entries);
  return entries;
}

function formatHistoryDate(ts: number): string {
  const date = new Date(ts);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const entryDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const dayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  const monthNames = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
  const dateStr = `${dayNames[date.getDay()]}, ${monthNames[date.getMonth()]}/${String(date.getDate()).padStart(2, '0')}/${date.getFullYear()}`;

  if (entryDay.getTime() === today.getTime()) return `TODAY - ${dateStr}`;
  if (entryDay.getTime() === yesterday.getTime()) return `YESTERDAY - ${dateStr}`;
  return dateStr;
}

function formatHistoryTime(ts: number): string {
  const date = new Date(ts);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function groupByDate(entries: HistoryEntry[]): { label: string; items: HistoryEntry[] }[] {
  const groups: Map<string, HistoryEntry[]> = new Map();
  for (const entry of entries) {
    const label = formatHistoryDate(entry.createdAt);
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label)!.push(entry);
  }
  return Array.from(groups.entries()).map(([label, items]) => ({ label, items }));
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

function extractSenderName(from: string): string {
  const match = from.match(/"?([^"<]+)"?\s*</);
  if (match) return match[1].trim();
  return from.split('@')[0];
}

function extractSenderEmail(from: string): string {
  const match = from.match(/<([^>]+)>/);
  if (match) return match[1];
  return from;
}

function getAvatarColor(name: string): string {
  const colors = [
    'from-violet-500 to-purple-600',
    'from-blue-500 to-indigo-600',
    'from-emerald-500 to-teal-600',
    'from-orange-500 to-red-600',
    'from-pink-500 to-rose-600',
    'from-cyan-500 to-blue-600',
    'from-amber-500 to-orange-600',
    'from-fuchsia-500 to-purple-600',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function formatTTL(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

export default function TempMail() {
  const [email, setEmail] = useState<TempEmail | null>(null);
  const [messages, setMessages] = useState<MessageSummary[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<MessageDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [ttlRemaining, setTtlRemaining] = useState<number>(0);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [historyEntries, setHistoryEntries] = useState<HistoryEntry[]>([]);
  const [historySearch, setHistorySearch] = useState('');
  const [selectedHistoryItems, setSelectedHistoryItems] = useState<Set<string>>(new Set());
  const autoRefreshRef = useRef<NodeJS.Timeout | null>(null);
  const ttlIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const emailCreatedAt = useRef<number>(0);

  const createEmail = useCallback(async () => {
    setCreating(true);
    setError(null);
    setSelectedMessage(null);
    setMessages([]);
    try {
      const res = await fetch(`${API_BASE}/emails`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to create email');
      const data = await res.json();
      setEmail(data);
      setTtlRemaining(data.ttl || 600);
      emailCreatedAt.current = Date.now();
      saveLastEmail(data.email, data.ttl || 600, Date.now());
      const updated = addToHistory(data.email, data.ttl || 600);
      setHistoryEntries(updated);
    } catch (err: any) {
      setError(err.message || 'Failed to create temporary email');
    } finally {
      setCreating(false);
    }
  }, []);

  const switchToEmail = useCallback(async (entry: HistoryEntry) => {
    const elapsed = Math.floor((Date.now() - entry.createdAt) / 1000);
    const remaining = Math.max(0, entry.ttl - elapsed);

    if (remaining <= 0) {
      const updated = removeFromHistory(entry.email);
      setHistoryEntries(updated);
      setError('This email has expired and is no longer available.');
      return;
    }

    setEmail({ email: entry.email, ttl: entry.ttl });
    setTtlRemaining(remaining);
    emailCreatedAt.current = entry.createdAt;
    saveLastEmail(entry.email, entry.ttl, entry.createdAt);
    setMessages([]);
    setSelectedMessage(null);
    setShowHistory(false);
    setHistorySearch('');
    setSelectedHistoryItems(new Set());

    try {
      const res = await fetch(`${API_BASE}/emails/${encodeURIComponent(entry.email)}/messages`);
      if (!res.ok) {
        const updated = removeFromHistory(entry.email);
        setHistoryEntries(updated);
        setEmail(null);
        setError('This email is no longer available on the server.');
        return;
      }
      const data = await res.json();
      setMessages(data.messages || []);
    } catch {
      setMessages([]);
    }
  }, []);

  const deleteHistoryItems = useCallback((emails: string[]) => {
    let entries = loadHistory();
    for (const em of emails) {
      entries = entries.filter(e => e.email !== em);
    }
    saveHistory(entries);
    setHistoryEntries(entries);
    setSelectedHistoryItems(new Set());
  }, []);

  const openHistory = useCallback(() => {
    setHistoryEntries(loadHistory());
    setHistorySearch('');
    setSelectedHistoryItems(new Set());
    setShowHistory(true);
  }, []);

  const fetchMessages = useCallback(async (showRefresh = true) => {
    if (!email?.email) return;
    if (showRefresh) setRefreshing(true);
    try {
      const res = await fetch(`${API_BASE}/emails/${encodeURIComponent(email.email)}/messages`);
      if (!res.ok) throw new Error('Failed to fetch messages');
      const data = await res.json();
      setMessages(data.messages || []);
    } catch (err: any) {
      if (showRefresh) setError(err.message);
    } finally {
      if (showRefresh) setRefreshing(false);
    }
  }, [email?.email]);

  const fetchMessageDetail = useCallback(async (id: string) => {
    setLoadingMessage(true);
    try {
      const res = await fetch(`${API_BASE}/messages/${id}`);
      if (!res.ok) throw new Error('Failed to fetch message');
      const data = await res.json();
      setSelectedMessage(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingMessage(false);
    }
  }, []);

  const deleteEmail = useCallback(async () => {
    if (!email?.email) return;
    try {
      await fetch(`${API_BASE}/emails/${encodeURIComponent(email.email)}`, { method: 'DELETE' });
      const updated = removeFromHistory(email.email);
      setHistoryEntries(updated);
      clearLastEmail();
      setEmail(null);
      setMessages([]);
      setSelectedMessage(null);
      setDeleteConfirm(false);
    } catch (err: any) {
      setError(err.message);
    }
  }, [email?.email]);

  const deleteMessage = useCallback(async (id: string) => {
    try {
      await fetch(`${API_BASE}/messages/${id}`, { method: 'DELETE' });
      setMessages(prev => prev.filter(m => m.id !== id));
      if (selectedMessage?.id === id) setSelectedMessage(null);
    } catch (err: any) {
      setError(err.message);
    }
  }, [selectedMessage?.id]);

  const copyEmail = useCallback(() => {
    if (!email?.email) return;
    navigator.clipboard.writeText(email.email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [email?.email]);

  useEffect(() => {
    if (autoRefresh && email?.email) {
      autoRefreshRef.current = setInterval(() => {
        fetchMessages(false);
      }, 10000);
    }
    return () => {
      if (autoRefreshRef.current) clearInterval(autoRefreshRef.current);
    };
  }, [autoRefresh, email?.email, fetchMessages]);

  useEffect(() => {
    if (email?.ttl && emailCreatedAt.current) {
      ttlIntervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - emailCreatedAt.current) / 1000);
        const remaining = Math.max(0, (email.ttl || 600) - elapsed);
        setTtlRemaining(remaining);
        if (remaining <= 0) {
          const updated = removeFromHistory(email.email);
          setHistoryEntries(updated);
          clearLastEmail();
          setEmail(null);
          setMessages([]);
          setSelectedMessage(null);
        }
      }, 1000);
    }
    return () => {
      if (ttlIntervalRef.current) clearInterval(ttlIntervalRef.current);
    };
  }, [email?.ttl, email?.email]);

  useEffect(() => {
    setHistoryEntries(loadHistory());
    const lastEmail = loadLastEmail();
    if (lastEmail) {
      const elapsed = Math.floor((Date.now() - lastEmail.createdAt) / 1000);
      const remaining = Math.max(0, lastEmail.ttl - elapsed);
      if (remaining > 0) {
        setEmail({ email: lastEmail.email, ttl: lastEmail.ttl });
        setTtlRemaining(remaining);
        emailCreatedAt.current = lastEmail.createdAt;
      }
    }
  }, []);

  const goHome = useCallback(() => {
    clearLastEmail();
    setEmail(null);
    setMessages([]);
    setSelectedMessage(null);
    setShowHistory(false);
  }, []);

  useEffect(() => {
    if (email?.email) fetchMessages();
  }, [email?.email]);

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 min-h-screen">
      {/* Header */}
      <div className="px-4 sm:px-6 lg:px-8 pt-6 pb-4">
        <div className="flex items-center gap-3 mb-1">
          {email && (
            <motion.button
              onClick={goHome}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center shadow-sm hover:shadow-md hover:border-indigo-200 transition-all"
              title="Back to Temp Mail Home"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </motion.button>
          )}
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-200">
            <Mail className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Temp Mail</h1>
            <p className="text-sm text-gray-500">Disposable email for privacy & testing</p>
          </div>
        </div>
      </div>

      {/* Error Toast */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mx-4 sm:mx-6 lg:mx-8 mb-4"
          >
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700 flex-1">{error}</p>
              <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 px-4 sm:px-6 lg:px-8 pb-6">
        {!email ? (
          /* No Email - Welcome State */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-16"
          >
            <div className="relative mb-8">
              <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-indigo-300/50">
                <Mail className="w-14 h-14 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg">
                <Shield className="w-4 h-4 text-white" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3 text-center">
              Disposable Email in Seconds
            </h2>
            <p className="text-gray-500 text-center max-w-md mb-8 leading-relaxed">
              Generate a temporary email address instantly. Perfect for testing sign-ups,
              verifying services, or keeping your real inbox clean.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10 max-w-lg w-full">
              {[
                { icon: Shield, label: 'Privacy First', desc: 'No personal data needed' },
                { icon: Timer, label: 'Auto-Expiry', desc: 'Emails self-destruct' },
                { icon: Inbox, label: 'Real Inbox', desc: 'Receive actual emails' },
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.1 }}
                  className="bg-white rounded-xl border border-gray-100 p-4 text-center shadow-sm"
                >
                  <feature.icon className="w-5 h-5 text-indigo-500 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-gray-800">{feature.label}</p>
                  <p className="text-xs text-gray-500">{feature.desc}</p>
                </motion.div>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <motion.button
                onClick={createEmail}
                disabled={creating}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-semibold text-lg shadow-xl shadow-indigo-300/40 hover:shadow-2xl hover:shadow-indigo-300/50 transition-all disabled:opacity-60 flex items-center gap-3"
              >
                {creating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    Generate Email Address
                  </>
                )}
              </motion.button>
              <motion.button
                onClick={openHistory}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-6 py-4 bg-white border-2 border-gray-200 text-gray-700 rounded-2xl font-semibold text-lg hover:border-indigo-300 hover:text-indigo-600 transition-all flex items-center gap-3"
              >
                <History className="w-5 h-5" />
                History
              </motion.button>
            </div>
          </motion.div>
        ) : (
          /* Email Active State */
          <div className="space-y-4">
            {/* Email Address Card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-lg shadow-gray-100/50 overflow-hidden"
            >
              <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 p-5">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                      <Mail className="w-5 h-5 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-white/70 text-xs font-medium uppercase tracking-wider mb-0.5">Your Temporary Email</p>
                      <p className="text-white text-lg font-mono font-bold truncate">{email.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-lg px-3 py-1.5">
                      <Timer className="w-3.5 h-3.5 text-white/80" />
                      <span className="text-white/90 text-sm font-medium">{formatTTL(ttlRemaining)}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="px-5 py-3 flex flex-wrap items-center gap-2 bg-gray-50/50 border-t border-gray-100">
                <button
                  onClick={copyEmail}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-lg hover:bg-indigo-50 text-gray-600 hover:text-indigo-700 transition-all"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
                <div className="w-px h-5 bg-gray-200" />
                <button
                  onClick={createEmail}
                  disabled={creating}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-lg hover:bg-indigo-50 text-gray-600 hover:text-indigo-700 transition-all disabled:opacity-50"
                >
                  <Shuffle className="w-4 h-4" />
                  New Address
                </button>
                <div className="w-px h-5 bg-gray-200" />
                <button
                  onClick={() => fetchMessages()}
                  disabled={refreshing}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-lg hover:bg-indigo-50 text-gray-600 hover:text-indigo-700 transition-all disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
                <div className="w-px h-5 bg-gray-200" />
                <button
                  onClick={() => setDeleteConfirm(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-lg hover:bg-red-50 text-gray-600 hover:text-red-600 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
                <div className="w-px h-5 bg-gray-200" />
                <button
                  onClick={openHistory}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-lg hover:bg-indigo-50 text-gray-600 hover:text-indigo-700 transition-all"
                >
                  <History className="w-4 h-4" />
                  History
                </button>
                <div className="flex-1" />
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-xs text-gray-500">Auto-refresh</span>
                  <button
                    onClick={() => setAutoRefresh(!autoRefresh)}
                    className={`relative w-9 h-5 rounded-full transition-colors ${autoRefresh ? 'bg-indigo-500' : 'bg-gray-300'}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${autoRefresh ? 'translate-x-4' : ''}`} />
                  </button>
                </label>
              </div>
            </motion.div>

            {/* Delete Confirmation */}
            <AnimatePresence>
              {deleteConfirm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 flex items-center gap-4">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    <p className="text-sm text-red-700 flex-1">Delete this email and all messages? This cannot be undone.</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setDeleteConfirm(false)}
                        className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-white rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={deleteEmail}
                        className="px-3 py-1.5 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Messages Area */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 min-h-[500px]">
              {/* Message List */}
              <div className={`${selectedMessage ? 'hidden lg:block' : ''} lg:col-span-2`}>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-lg shadow-gray-100/50 h-full flex flex-col">
                  <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Inbox className="w-4 h-4 text-indigo-500" />
                      <h3 className="font-semibold text-gray-800">Inbox</h3>
                      {messages.length > 0 && (
                        <span className="bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full px-2 py-0.5">
                          {messages.length}
                        </span>
                      )}
                    </div>
                    {refreshing && <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />}
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    {messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-16 px-4">
                        <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mb-4">
                          <Inbox className="w-8 h-8 text-indigo-300" />
                        </div>
                        <p className="text-gray-500 text-sm font-medium mb-1">No messages yet</p>
                        <p className="text-gray-400 text-xs text-center">
                          Use this email on any website and messages will appear here
                        </p>
                        {autoRefresh && (
                          <div className="flex items-center gap-1.5 mt-4 text-xs text-indigo-400">
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                            Checking for new mail...
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-50">
                        {messages.map((msg, i) => (
                          <motion.button
                            key={msg.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            onClick={() => fetchMessageDetail(msg.id)}
                            className={`w-full text-left px-5 py-4 hover:bg-indigo-50/50 transition-all group ${
                              selectedMessage?.id === msg.id ? 'bg-indigo-50 border-l-2 border-indigo-500' : ''
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${getAvatarColor(extractSenderName(msg.from))} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                                <span className="text-white text-sm font-bold">
                                  {extractSenderName(msg.from).charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-2 mb-0.5">
                                  <p className="text-sm font-semibold text-gray-800 truncate">
                                    {extractSenderName(msg.from)}
                                  </p>
                                  <span className="text-xs text-gray-400 flex-shrink-0 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {timeAgo(msg.created_at)}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-700 truncate font-medium">{msg.subject || '(No subject)'}</p>
                              </div>
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Message Detail */}
              <div className={`${!selectedMessage && !loadingMessage ? 'hidden lg:block' : ''} lg:col-span-3`}>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-lg shadow-gray-100/50 h-full flex flex-col">
                  {loadingMessage ? (
                    <div className="flex-1 flex items-center justify-center">
                      <div className="text-center">
                        <Loader2 className="w-8 h-8 animate-spin text-indigo-400 mx-auto mb-3" />
                        <p className="text-sm text-gray-500">Loading message...</p>
                      </div>
                    </div>
                  ) : selectedMessage ? (
                    <>
                      <div className="px-5 py-4 border-b border-gray-100">
                        <div className="flex items-center gap-2 mb-3">
                          <button
                            onClick={() => setSelectedMessage(null)}
                            className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
                          >
                            <ChevronLeft className="w-5 h-5" />
                          </button>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-gray-900 text-lg truncate">{selectedMessage.subject || '(No subject)'}</h3>
                          </div>
                          <button
                            onClick={() => deleteMessage(selectedMessage.id)}
                            className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                            title="Delete message"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getAvatarColor(extractSenderName(selectedMessage.from))} flex items-center justify-center shadow-sm`}>
                            <span className="text-white font-bold">
                              {extractSenderName(selectedMessage.from).charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-gray-800">{extractSenderName(selectedMessage.from)}</p>
                            <p className="text-xs text-gray-500 truncate">{extractSenderEmail(selectedMessage.from)}</p>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-gray-400">
                            <Clock className="w-3.5 h-3.5" />
                            {new Date(selectedMessage.created_at).toLocaleString()}
                          </div>
                        </div>
                        {selectedMessage.attachments && selectedMessage.attachments.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {selectedMessage.attachments.map((att) => (
                              <div
                                key={att.id}
                                className="flex items-center gap-1.5 bg-gray-50 rounded-lg px-3 py-1.5 text-xs text-gray-600 border border-gray-200"
                              >
                                <Paperclip className="w-3 h-3" />
                                <span className="truncate max-w-[150px]">{att.name}</span>
                                <span className="text-gray-400">({Math.round(att.size / 1024)}KB)</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 overflow-y-auto">
                        {selectedMessage.body_html ? (
                          <div className="p-5">
                            <iframe
                              srcDoc={`<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:14px;line-height:1.6;color:#374151;margin:0;padding:0;}a{color:#4f46e5;}img{max-width:100%;height:auto;}</style></head><body>${selectedMessage.body_html}</body></html>`}
                              className="w-full border-0 min-h-[400px] rounded-lg"
                              sandbox="allow-same-origin"
                              title="Email content"
                              onLoad={(e) => {
                                const iframe = e.target as HTMLIFrameElement;
                                if (iframe.contentDocument) {
                                  iframe.style.height = iframe.contentDocument.body.scrollHeight + 40 + 'px';
                                }
                              }}
                            />
                          </div>
                        ) : (
                          <div className="p-5">
                            <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans leading-relaxed">
                              {selectedMessage.body_text || 'No content'}
                            </pre>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center py-16 px-4">
                      <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center mb-4">
                        <MailOpen className="w-10 h-10 text-indigo-300" />
                      </div>
                      <p className="text-gray-500 font-medium mb-1">Select a message</p>
                      <p className="text-gray-400 text-sm text-center">Click on any message in the inbox to read it here</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Email History Modal */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowHistory(false);
                setHistorySearch('');
                setSelectedHistoryItems(new Set());
              }
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden"
            >
              <div className="px-6 pt-6 pb-4 flex items-center justify-between border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-900">Emails history</h2>
                <button
                  onClick={() => {
                    setShowHistory(false);
                    setHistorySearch('');
                    setSelectedHistoryItems(new Set());
                  }}
                  className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="px-6 py-3">
                <label className="text-sm text-gray-500 mb-1.5 block">Search in history</label>
                <div className="relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    placeholder="Type email to search..."
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all"
                  />
                </div>
              </div>

              {selectedHistoryItems.size > 0 && (
                <div className="px-6 py-2 flex items-center justify-between bg-indigo-50 border-y border-indigo-100">
                  <span className="text-sm text-indigo-700 font-medium">{selectedHistoryItems.size} selected</span>
                  <button
                    onClick={() => deleteHistoryItems(Array.from(selectedHistoryItems))}
                    className="flex items-center gap-1.5 text-sm text-red-600 hover:text-red-700 font-medium transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Remove selected
                  </button>
                </div>
              )}

              <div className="flex-1 overflow-y-auto px-6 pb-4">
                {(() => {
                  const filtered = historyEntries.filter(e =>
                    historySearch ? e.email.toLowerCase().includes(historySearch.toLowerCase()) : true
                  );
                  const groups = groupByDate(filtered);

                  if (filtered.length === 0) {
                    return (
                      <div className="flex flex-col items-center justify-center py-12">
                        <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mb-3">
                          <History className="w-7 h-7 text-gray-300" />
                        </div>
                        <p className="text-gray-500 text-sm font-medium">
                          {historySearch ? 'No emails match your search' : 'No email history yet'}
                        </p>
                        <p className="text-gray-400 text-xs mt-1">
                          {historySearch ? 'Try a different search term' : 'Generated emails will appear here'}
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-1">
                      {groups.map(group => (
                        <div key={group.label}>
                          <div className="bg-gray-50 rounded-lg px-3 py-2 mt-2 mb-1">
                            <span className="text-xs font-semibold text-gray-500 tracking-wide">{group.label}</span>
                          </div>
                          {group.items.map(entry => {
                            const isCurrent = email?.email === entry.email;
                            const isExpired = Date.now() - entry.createdAt > (entry.ttl || 600) * 1000;
                            const isSelected = selectedHistoryItems.has(entry.email);

                            return (
                              <div
                                key={entry.email + entry.createdAt}
                                className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all group ${
                                  isCurrent ? 'bg-indigo-50/50' : 'hover:bg-gray-50'
                                }`}
                              >
                                <button
                                  onClick={() => {
                                    setSelectedHistoryItems(prev => {
                                      const next = new Set(prev);
                                      if (next.has(entry.email)) next.delete(entry.email);
                                      else next.add(entry.email);
                                      return next;
                                    });
                                  }}
                                  className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                                    isSelected
                                      ? 'bg-indigo-500 border-indigo-500'
                                      : 'border-gray-300 hover:border-indigo-400'
                                  }`}
                                >
                                  {isSelected && <Check className="w-3 h-3 text-white" />}
                                </button>

                                <span className="text-xs text-gray-400 font-medium w-16 flex-shrink-0">
                                  {formatHistoryTime(entry.createdAt)}
                                </span>

                                <span className="text-sm text-gray-800 font-mono truncate flex-1 min-w-0">
                                  {entry.email}
                                </span>

                                <div className="flex items-center gap-2 flex-shrink-0">
                                  {isCurrent ? (
                                    <span className="text-xs text-indigo-500 font-medium px-2 py-0.5 bg-indigo-100 rounded-full">
                                      current
                                    </span>
                                  ) : !isExpired ? (
                                    <span className="text-xs text-emerald-600 font-medium px-2 py-0.5 bg-emerald-50 rounded-full">
                                      active
                                    </span>
                                  ) : null}
                                  {!isCurrent && (
                                    <button
                                      onClick={() => switchToEmail(entry)}
                                      className="text-xs font-medium px-3 py-1 rounded-lg bg-orange-100 text-orange-700 hover:bg-orange-200 transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                      use this email
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>

              <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/50 text-center">
                <p className="text-sm text-gray-500">
                  History size: <span className="font-semibold text-gray-700">{historyEntries.length}/{MAX_HISTORY}</span>
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
