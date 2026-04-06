import React, { useState, useEffect } from 'react';
import { MessageCircle, Bot, User, RefreshCw, X, Send, Phone, CheckCircle, XCircle, Settings, Bell, AlertTriangle, Eye } from 'lucide-react';

interface Conversation {
  id: string;
  session_id: string;
  user_email: string | null;
  user_name: string | null;
  status: string;
  page_url: string | null;
  message_count: string;
  last_message: string | null;
  created_at: string;
  updated_at: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

interface Stats {
  total: string;
  open_count: string;
  live_requested_count: string;
  closed_count: string;
  today_count: string;
  total_messages: string;
}

interface TelegramStatus {
  configured: boolean;
  hasToken: boolean;
  hasChatId: boolean;
  chatId: string | null;
}

interface ChatbotDashboardProps {
  token: string;
}

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function statusBadge(status: string) {
  const map: Record<string, { label: string; color: string }> = {
    open: { label: 'Open', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
    live_requested: { label: '🔴 Live Requested', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
    live_active: { label: '🟡 Live Active', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
    closed: { label: 'Closed', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
  };
  const s = map[status] || { label: status, color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${s.color}`}>{s.label}</span>
  );
}

export function ChatbotDashboard({ token }: ChatbotDashboardProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [telegramStatus, setTelegramStatus] = useState<TelegramStatus | null>(null);
  const [selectedConv, setSelectedConv] = useState<string | null>(null);
  const [selectedMessages, setSelectedMessages] = useState<Message[]>([]);
  const [selectedConvData, setSelectedConvData] = useState<Conversation | null>(null);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingConv, setLoadingConv] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'conversations' | 'settings'>('conversations');
  const [telegramTestLoading, setTelegramTestLoading] = useState(false);
  const [telegramTestResult, setTelegramTestResult] = useState<string | null>(null);
  const [telegramUpdates, setTelegramUpdates] = useState<any[]>([]);
  const [fetchingUpdates, setFetchingUpdates] = useState(false);
  const [settings, setSettings] = useState({
    botName: 'Aria',
    welcomeMessage: "Hi! I'm Aria, your Adiology assistant 👋 How can I help you today?",
    telegramNotifications: true,
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);

  const authHeaders = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, convsRes, telegramRes] = await Promise.all([
        fetch('/api/chat/admin/stats', { headers: authHeaders }),
        fetch(`/api/chat/admin/conversations?status=${filterStatus}`, { headers: authHeaders }),
        fetch('/api/chat/admin/telegram-status', { headers: authHeaders }),
      ]);
      const [statsData, convsData, telegramData] = await Promise.all([
        statsRes.json(), convsRes.json(), telegramRes.json(),
      ]);
      if (statsData.success) setStats(statsData.stats);
      if (convsData.success) setConversations(convsData.conversations);
      if (telegramData.success) setTelegramStatus(telegramData);
    } catch (e) {
      console.error('Chatbot dashboard fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [filterStatus]);

  const loadConversation = async (id: string) => {
    setSelectedConv(id);
    setLoadingConv(true);
    try {
      const res = await fetch(`/api/chat/admin/conversation/${id}`, { headers: authHeaders });
      const data = await res.json();
      if (data.success) {
        setSelectedMessages(data.messages);
        setSelectedConvData(data.conversation);
      }
    } catch {}
    setLoadingConv(false);
  };

  const sendReply = async () => {
    if (!replyText.trim() || !selectedConv) return;
    try {
      await fetch(`/api/chat/admin/reply/${selectedConv}`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ message: replyText.trim() }),
      });
      setReplyText('');
      await loadConversation(selectedConv);
      fetchData();
    } catch {}
  };

  const closeConversation = async (id: string) => {
    await fetch(`/api/chat/admin/close/${id}`, { method: 'POST', headers: authHeaders });
    setSelectedConv(null);
    fetchData();
  };

  const testTelegram = async () => {
    setTelegramTestLoading(true);
    setTelegramTestResult(null);
    try {
      const res = await fetch('/api/chat/admin/telegram-test', { method: 'POST', headers: authHeaders });
      const data = await res.json();
      setTelegramTestResult(data.success ? '✅ ' + data.message : '❌ ' + (data.error || 'Failed'));
    } catch {
      setTelegramTestResult('❌ Network error');
    } finally {
      setTelegramTestLoading(false);
    }
  };

  const fetchTelegramUpdates = async () => {
    setFetchingUpdates(true);
    try {
      const res = await fetch('/api/chat/admin/telegram-get-updates', { headers: authHeaders });
      const data = await res.json();
      if (data.success) setTelegramUpdates(data.updates);
    } catch {}
    setFetchingUpdates(false);
  };

  const saveSettings = async () => {
    setSavingSettings(true);
    try {
      await fetch('/api/chat/admin/settings', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(settings),
      });
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 3000);
    } catch {}
    setSavingSettings(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <RefreshCw className="w-6 h-6 animate-spin mr-3" />
        Loading chatbot data...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Chat Support Manager</h2>
            <p className="text-slate-400 text-sm">Manage conversations, configure Aria bot, and Telegram notifications</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchData()}
            className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 rounded-lg text-sm transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </div>

      {/* Telegram Alert */}
      {telegramStatus && !telegramStatus.configured && (
        <div className="flex items-start gap-3 bg-amber-950/50 border border-amber-700/50 rounded-xl p-4">
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-amber-300 font-semibold text-sm">Telegram notifications not configured</p>
            <p className="text-amber-400/80 text-xs mt-0.5">
              Set <code className="bg-amber-900/50 px-1 rounded">TELEGRAM_BOT_TOKEN</code> and{' '}
              <code className="bg-amber-900/50 px-1 rounded">TELEGRAM_ADMIN_CHAT_ID</code> environment variables to receive chat notifications.
              {!telegramStatus.hasToken && ' Missing: TELEGRAM_BOT_TOKEN.'}
              {!telegramStatus.hasChatId && ' Missing: TELEGRAM_ADMIN_CHAT_ID.'}
            </p>
          </div>
        </div>
      )}

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'Total Chats', value: stats.total, color: 'from-violet-600 to-indigo-600' },
            { label: 'Today', value: stats.today_count, color: 'from-blue-600 to-cyan-600' },
            { label: 'Open', value: stats.open_count, color: 'from-emerald-600 to-green-600' },
            { label: 'Live Requested', value: stats.live_requested_count, color: 'from-red-600 to-rose-600' },
            { label: 'Closed', value: stats.closed_count, color: 'from-slate-600 to-gray-600' },
            { label: 'Messages', value: stats.total_messages, color: 'from-purple-600 to-violet-600' },
          ].map(s => (
            <div key={s.label} className="bg-slate-800 rounded-xl p-3 border border-slate-700">
              <p className="text-xs text-slate-400 mb-1">{s.label}</p>
              <p className={`text-2xl font-bold bg-gradient-to-r ${s.color} bg-clip-text text-transparent`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2">
        {[
          { id: 'conversations', label: 'Conversations', icon: MessageCircle },
          { id: 'settings', label: 'Bot Settings', icon: Settings },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-violet-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'conversations' && (
        <div className="flex gap-4 h-[600px]">
          {/* Conversation list */}
          <div className="w-80 flex-shrink-0 bg-slate-800 rounded-xl border border-slate-700 flex flex-col overflow-hidden">
            <div className="p-3 border-b border-slate-700">
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="w-full bg-slate-700 text-slate-300 text-sm rounded-lg px-3 py-2 border border-slate-600 focus:outline-none focus:border-violet-500"
              >
                <option value="all">All conversations</option>
                <option value="open">Open</option>
                <option value="live_requested">Live Requested</option>
                <option value="live_active">Live Active</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            <div className="flex-1 overflow-y-auto">
              {conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-500">
                  <MessageCircle className="w-10 h-10 mb-3 opacity-30" />
                  <p className="text-sm">No conversations yet</p>
                </div>
              ) : (
                conversations.map(conv => (
                  <button
                    key={conv.id}
                    onClick={() => loadConversation(conv.id)}
                    className={`w-full text-left p-3 border-b border-slate-700/50 hover:bg-slate-700/50 transition-colors ${
                      selectedConv === conv.id ? 'bg-slate-700' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-sm font-medium text-white truncate">
                        {conv.user_email || conv.user_name || 'Anonymous'}
                      </p>
                      <span className="text-[10px] text-slate-500 flex-shrink-0">{timeAgo(conv.updated_at)}</span>
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      {statusBadge(conv.status)}
                      <span className="text-[10px] text-slate-500">{conv.message_count} msgs</span>
                    </div>
                    {conv.last_message && (
                      <p className="text-xs text-slate-400 truncate">{conv.last_message}</p>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Conversation detail */}
          <div className="flex-1 bg-slate-800 rounded-xl border border-slate-700 flex flex-col overflow-hidden">
            {!selectedConv ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-500">
                <Eye className="w-12 h-12 mb-3 opacity-30" />
                <p className="text-sm">Select a conversation to view</p>
              </div>
            ) : loadingConv ? (
              <div className="flex items-center justify-center h-full text-slate-400">
                <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading...
              </div>
            ) : (
              <>
                {/* Conversation header */}
                <div className="p-3 border-b border-slate-700 flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium text-sm">
                      {selectedConvData?.user_email || selectedConvData?.user_name || 'Anonymous visitor'}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {selectedConvData && statusBadge(selectedConvData.status)}
                      {selectedConvData?.page_url && (
                        <span className="text-[10px] text-slate-500 truncate max-w-40">{selectedConvData.page_url}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => selectedConv && closeConversation(selectedConv)}
                      className="flex items-center gap-1.5 bg-slate-600 hover:bg-slate-500 text-slate-300 px-2 py-1 rounded-lg text-xs transition-colors"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Close
                    </button>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {selectedMessages.map(msg => (
                    <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        msg.role === 'assistant' ? 'bg-violet-600' : 'bg-slate-600'
                      }`}>
                        {msg.role === 'assistant' ? <Bot className="w-4 h-4 text-white" /> : <User className="w-4 h-4 text-white" />}
                      </div>
                      <div className={`max-w-[70%] flex flex-col gap-0.5 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                        <div className={`px-3 py-2 rounded-xl text-sm leading-relaxed ${
                          msg.role === 'user'
                            ? 'bg-violet-600/30 text-violet-100 border border-violet-600/30'
                            : 'bg-slate-700 text-slate-200 border border-slate-600'
                        }`}>
                          {msg.content}
                        </div>
                        <span className="text-[10px] text-slate-500 px-1">
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Admin reply */}
                <div className="border-t border-slate-700 p-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && sendReply()}
                      placeholder="Type admin reply..."
                      className="flex-1 bg-slate-700 text-slate-200 placeholder:text-slate-500 text-sm px-3 py-2 rounded-lg border border-slate-600 focus:outline-none focus:border-violet-500"
                    />
                    <button
                      onClick={sendReply}
                      disabled={!replyText.trim()}
                      className="bg-violet-600 hover:bg-violet-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white px-3 py-2 rounded-lg transition-colors"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Telegram Setup */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-blue-400" />
              <h3 className="text-white font-semibold">Telegram Notifications</h3>
              {telegramStatus?.configured && (
                <span className="px-2 py-0.5 text-xs font-semibold bg-green-500/20 text-green-400 border border-green-500/30 rounded-full">✓ Configured</span>
              )}
            </div>

            <div className="space-y-3">
              <div className="bg-slate-750 rounded-lg p-3 border border-slate-600 space-y-2">
                <p className="text-slate-300 text-sm font-medium">Setup Instructions:</p>
                <ol className="text-slate-400 text-xs space-y-1 list-decimal list-inside">
                  <li>Create a bot via <a href="https://t.me/BotFather" target="_blank" rel="noopener" className="text-blue-400 hover:underline">@BotFather</a> on Telegram</li>
                  <li>Copy the bot token and set it as <code className="bg-slate-700 px-1 rounded">TELEGRAM_BOT_TOKEN</code></li>
                  <li>Message your new bot from your Telegram account (<strong>@dsamay</strong>)</li>
                  <li>Click "Find My Chat ID" below</li>
                  <li>Set the chat ID as <code className="bg-slate-700 px-1 rounded">TELEGRAM_ADMIN_CHAT_ID</code></li>
                </ol>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2 bg-slate-700 rounded-lg px-3 py-2 border border-slate-600">
                  {telegramStatus?.hasToken ? (
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  )}
                  <span className="text-xs text-slate-300">Bot Token</span>
                </div>
                <div className="flex items-center gap-2 bg-slate-700 rounded-lg px-3 py-2 border border-slate-600">
                  {telegramStatus?.hasChatId ? (
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  )}
                  <span className="text-xs text-slate-300">
                    Chat ID {telegramStatus?.chatId && <span className="text-slate-500">({telegramStatus.chatId})</span>}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={fetchTelegramUpdates}
                  disabled={fetchingUpdates || !telegramStatus?.hasToken}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white text-sm font-medium py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {fetchingUpdates ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Phone className="w-4 h-4" />}
                  Find My Chat ID
                </button>
                <button
                  onClick={testTelegram}
                  disabled={telegramTestLoading || !telegramStatus?.configured}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white text-sm font-medium py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {telegramTestLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />}
                  Send Test
                </button>
              </div>

              {telegramUpdates.length > 0 && (
                <div className="bg-slate-700 rounded-lg p-3 border border-slate-600">
                  <p className="text-slate-300 text-xs font-medium mb-2">Recent messages to your bot:</p>
                  <div className="space-y-1.5">
                    {telegramUpdates.slice(0, 5).map((u, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <code className="bg-green-900/50 text-green-300 px-2 py-0.5 rounded font-mono">{u.chatId}</code>
                        <span className="text-slate-400">@{u.username || u.firstName}</span>
                        <span className="text-slate-500 truncate">{u.text}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-slate-500 text-xs mt-2">Copy the chat ID and set it as <code className="bg-slate-600 px-1 rounded">TELEGRAM_ADMIN_CHAT_ID</code> in your environment variables.</p>
                </div>
              )}

              {telegramTestResult && (
                <p className="text-sm text-slate-300 bg-slate-700 rounded-lg p-2 border border-slate-600">
                  {telegramTestResult}
                </p>
              )}
            </div>
          </div>

          {/* Bot Configuration */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-violet-400" />
              <h3 className="text-white font-semibold">Bot Configuration</h3>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-slate-400 text-xs font-medium mb-1">Bot Name</label>
                <input
                  type="text"
                  value={settings.botName}
                  onChange={e => setSettings(s => ({ ...s, botName: e.target.value }))}
                  className="w-full bg-slate-700 text-slate-200 text-sm px-3 py-2 rounded-lg border border-slate-600 focus:outline-none focus:border-violet-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-xs font-medium mb-1">Welcome Message</label>
                <textarea
                  value={settings.welcomeMessage}
                  onChange={e => setSettings(s => ({ ...s, welcomeMessage: e.target.value }))}
                  rows={3}
                  className="w-full bg-slate-700 text-slate-200 text-sm px-3 py-2 rounded-lg border border-slate-600 focus:outline-none focus:border-violet-500 resize-none"
                />
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.telegramNotifications}
                    onChange={e => setSettings(s => ({ ...s, telegramNotifications: e.target.checked }))}
                    className="w-4 h-4 rounded accent-violet-600"
                  />
                  <span className="text-slate-300 text-sm">Enable Telegram notifications</span>
                </label>
              </div>
              <button
                onClick={saveSettings}
                disabled={savingSettings}
                className="w-full bg-violet-600 hover:bg-violet-700 disabled:bg-slate-600 text-white text-sm font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {savingSettings ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
                {settingsSaved ? '✓ Saved!' : 'Save Settings'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
