import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MessageCircle, X, Send, Loader2, Bot, User, Zap, ArrowRight, RefreshCw, Phone, ChevronDown } from 'lucide-react';
import { getCurrentUser } from '../utils/auth';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

interface ChatWidgetProps {
  defaultOpen?: boolean;
}

const QUICK_REPLIES = [
  'How does the free trial work?',
  'What are the pricing plans?',
  'How do I connect my Google Ads?',
  'What is click fraud protection?',
];

const WELCOME_MESSAGE: Message = {
  id: 'welcome',
  role: 'assistant',
  content: "Hi! I'm Aria, your Adiology assistant 👋 How can I help you today? I can answer questions about campaigns, pricing, account setup, and more.",
  createdAt: new Date().toISOString(),
};

function getOrCreateSessionId(): string {
  const key = 'adiology_chat_session';
  let id = localStorage.getItem(key);
  if (!id) {
    id = 'sess_' + Math.random().toString(36).slice(2) + '_' + Date.now();
    localStorage.setItem(key, id);
  }
  return id;
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function ChatWidget({ defaultOpen = false }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(true);
  const [liveAgentPending, setLiveAgentPending] = useState(false);
  const [liveAgentRequested, setLiveAgentRequested] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const sessionIdRef = useRef<string>('');

  useEffect(() => {
    sessionIdRef.current = getOrCreateSessionId();
  }, []);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Load history when chat opens
  useEffect(() => {
    if (isOpen && !hasLoaded && sessionIdRef.current) {
      loadHistory();
      setHasLoaded(true);
      setUnreadCount(0);
    }
  }, [isOpen, hasLoaded]);

  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const loadHistory = async () => {
    try {
      const res = await fetch(`/api/chat/history/${sessionIdRef.current}`);
      const data = await res.json();
      if (data.success && data.messages && data.messages.length > 0) {
        setMessages(data.messages);
        setShowQuickReplies(false);
      }
    } catch {}
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: Message = {
      id: 'user_' + Date.now(),
      role: 'user',
      content: text.trim(),
      createdAt: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);
    setShowQuickReplies(false);

    // Detect live agent keywords
    const liveAgentKeywords = ['live agent', 'human', 'real person', 'support team', 'talk to someone', 'speak with', 'connect me', 'live support'];
    const wantsLive = liveAgentKeywords.some(k => text.toLowerCase().includes(k));

    if (wantsLive && !liveAgentRequested) {
      setLiveAgentPending(true);
    }

    try {
      const currentUser = getCurrentUser();
      const res = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionIdRef.current,
          message: text.trim(),
          userEmail: currentUser?.email || null,
          userName: currentUser?.name || currentUser?.full_name || null,
          pageUrl: window.location.pathname,
        }),
      });

      const data = await res.json();
      if (data.success) {
        const assistantMsg: Message = {
          id: 'ai_' + Date.now(),
          role: 'assistant',
          content: data.response,
          createdAt: new Date().toISOString(),
        };
        setMessages(prev => [...prev, assistantMsg]);

        if (!isOpen) {
          setUnreadCount(prev => prev + 1);
        }
      }
    } catch {
      setMessages(prev => [...prev, {
        id: 'err_' + Date.now(),
        role: 'assistant',
        content: "I'm having a brief technical issue. Please try again or email support@adiology.io.",
        createdAt: new Date().toISOString(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const requestLiveAgent = async () => {
    setLiveAgentPending(false);
    setLiveAgentRequested(true);
    setIsLoading(true);

    try {
      const currentUser = getCurrentUser();
      await fetch('/api/chat/live-agent-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionIdRef.current,
          userEmail: currentUser?.email || null,
          userName: currentUser?.name || currentUser?.full_name || null,
        }),
      });

      setMessages(prev => [...prev, {
        id: 'live_' + Date.now(),
        role: 'assistant',
        content: "✅ Our support team has been notified and will reach out to you shortly! You can also email us directly at support@adiology.io. We typically respond within a few hours.",
        createdAt: new Date().toISOString(),
      }]);
    } catch {
      setMessages(prev => [...prev, {
        id: 'live_err_' + Date.now(),
        role: 'assistant',
        content: "I've noted your request. Please email support@adiology.io for immediate assistance.",
        createdAt: new Date().toISOString(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputValue);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  return (
    <>
      {/* Chat Window */}
      {isOpen && (
        <div className={`fixed bottom-20 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-96 shadow-2xl rounded-2xl overflow-hidden flex flex-col transition-all duration-300 ${
          isMinimized ? 'h-14' : 'h-[520px] max-h-[80vh]'
        }`}
          style={{ border: '1px solid #e5e7eb', background: 'white' }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 flex-shrink-0">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm leading-tight">Aria — Adiology Support</p>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <p className="text-violet-200 text-xs">AI-powered · Always available</p>
              </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                title={isMinimized ? 'Expand' : 'Minimize'}
              >
                <ChevronDown className={`w-4 h-4 text-white transition-transform ${isMinimized ? 'rotate-180' : ''}`} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    {msg.role === 'assistant' && (
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                    )}
                    {msg.role === 'user' && (
                      <div className="w-7 h-7 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <User className="w-4 h-4 text-gray-600" />
                      </div>
                    )}
                    <div className={`max-w-[75%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
                      <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-violet-600 text-white rounded-tr-sm'
                          : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-tl-sm'
                      }`}>
                        {msg.content}
                      </div>
                      <span className="text-[10px] text-gray-400 px-1">{formatTime(msg.createdAt)}</span>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex gap-2">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-white border border-gray-100 shadow-sm rounded-2xl rounded-tl-sm px-4 py-3">
                      <div className="flex gap-1 items-center">
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}

                {/* Live agent prompt */}
                {liveAgentPending && !liveAgentRequested && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mx-1">
                    <p className="text-amber-800 text-sm font-medium mb-2">🙋 Connect with live support?</p>
                    <p className="text-amber-700 text-xs mb-3">Our team will be notified immediately via Telegram and will reach out to you.</p>
                    <div className="flex gap-2">
                      <button
                        onClick={requestLiveAgent}
                        className="flex-1 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        Yes, notify my team
                      </button>
                      <button
                        onClick={() => setLiveAgentPending(false)}
                        className="flex-1 bg-white hover:bg-gray-50 text-gray-600 text-xs font-medium py-2 px-3 rounded-lg border border-gray-200 transition-colors"
                      >
                        No thanks
                      </button>
                    </div>
                  </div>
                )}

                {/* Quick replies */}
                {showQuickReplies && messages.length <= 2 && !isLoading && (
                  <div className="pt-1">
                    <p className="text-xs text-gray-400 mb-2 ml-9">Quick questions:</p>
                    <div className="space-y-1.5 ml-9">
                      {QUICK_REPLIES.map((reply) => (
                        <button
                          key={reply}
                          onClick={() => sendMessage(reply)}
                          className="flex items-center gap-2 w-full text-left text-xs font-medium text-violet-600 bg-violet-50 hover:bg-violet-100 border border-violet-200 px-3 py-2 rounded-xl transition-colors"
                        >
                          <Zap className="w-3 h-3 flex-shrink-0" />
                          {reply}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input area */}
              <div className="border-t border-gray-100 bg-white px-3 py-3 flex-shrink-0">
                <form onSubmit={handleSubmit} className="flex gap-2 items-center">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask anything..."
                    className="flex-1 text-sm px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-colors placeholder:text-gray-400"
                    disabled={isLoading}
                    autoComplete="off"
                  />
                  <button
                    type="submit"
                    disabled={!inputValue.trim() || isLoading}
                    className="w-9 h-9 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:bg-gray-200 disabled:cursor-not-allowed text-white flex items-center justify-center transition-all flex-shrink-0"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                </form>
                <p className="text-center text-[10px] text-gray-400 mt-2">Powered by Adiology AI · <a href="mailto:support@adiology.io" className="text-violet-500 hover:underline">support@adiology.io</a></p>
              </div>
            </>
          )}
        </div>
      )}

      {/* Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className={`z-[9999] flex items-center justify-center shadow-xl transition-all duration-300 hover:scale-105 ${
          isOpen
            ? 'bg-gray-800 hover:bg-gray-700'
            : 'bg-gradient-to-br from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500'
        }`}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '24px',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
        }}
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <MessageCircle className="w-6 h-6 text-white" />
        )}
        {unreadCount > 0 && !isOpen && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>
    </>
  );
}
