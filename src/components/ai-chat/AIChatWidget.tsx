import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageCircle, 
  X, 
  Send, 
  Bot, 
  User, 
  Minimize2, 
  Maximize2,
  RotateCcw,
  ThumbsUp,
  ThumbsDown,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { useAIChat } from '../../contexts/AIChatContext';
import { useNotification } from '../../contexts/NotificationContext';
import { EnhancedCard } from '../ui/enhanced-card';
import { EnhancedButton, FloatingActionButton } from '../ui/enhanced-button';

interface Message {
  id: string;
  type: 'user' | 'bot' | 'system';
  content: string;
  timestamp: Date;
  isTyping?: boolean;
  suggestions?: string[];
  actions?: Array<{
    label: string;
    action: string;
    url?: string;
  }>;
  feedback?: 'positive' | 'negative' | null;
}

export const AIChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { sendMessage, getConversationHistory, createConversation } = useAIChat();
  const { success, error } = useNotification();

  useEffect(() => {
    if (isOpen && !conversationId) {
      initializeConversation();
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, isMinimized]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const initializeConversation = async () => {
    try {
      const newConversationId = await createConversation();
      setConversationId(newConversationId);
      
      // Add welcome message
      const welcomeMessage: Message = {
        id: 'welcome',
        type: 'bot',
        content: "👋 Hi! I'm your AI assistant for Adiology. I can help you with:\n\n• Campaign creation and optimization\n• Keyword research and planning\n• Platform navigation\n• Account settings\n• Billing questions\n• Technical support\n\nWhat can I help you with today?",
        timestamp: new Date(),
        suggestions: [
          "How do I create a campaign?",
          "Help with keyword research",
          "Billing questions",
          "Technical support"
        ]
      };
      
      setMessages([welcomeMessage]);
    } catch (err) {
      console.error('Error initializing conversation:', err);
      error('Failed to start chat', 'Please try again');
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading || !conversationId) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // Add typing indicator
    const typingMessage: Message = {
      id: 'typing',
      type: 'bot',
      content: '',
      timestamp: new Date(),
      isTyping: true
    };
    setMessages(prev => [...prev, typingMessage]);

    try {
      const response = await sendMessage(conversationId, userMessage.content, {
        currentPage: window.location.pathname,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString()
      });

      // Remove typing indicator and add bot response
      setMessages(prev => {
        const filtered = prev.filter(m => m.id !== 'typing');
        const botMessage: Message = {
          id: response.id || Date.now().toString(),
          type: 'bot',
          content: response.content,
          timestamp: new Date(),
          suggestions: response.suggestions,
          actions: response.actions
        };
        return [...filtered, botMessage];
      });

    } catch (err) {
      console.error('Error sending message:', err);
      setMessages(prev => prev.filter(m => m.id !== 'typing'));
      
      const errorMessage: Message = {
        id: 'error-' + Date.now(),
        type: 'system',
        content: "I'm sorry, I'm having trouble responding right now. Please try again or contact our support team at support@adiology.io",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
    setTimeout(() => handleSendMessage(), 100);
  };

  const handleActionClick = (action: { label: string; action: string; url?: string }) => {
    if (action.url) {
      window.open(action.url, '_blank');
    } else {
      // Handle internal actions
      switch (action.action) {
        case 'create_campaign':
          window.location.hash = '#campaign-builder';
          setIsOpen(false);
          break;
        case 'keyword_planner':
          window.location.hash = '#keyword-planner';
          setIsOpen(false);
          break;
        case 'billing':
          window.location.hash = '#billing';
          setIsOpen(false);
          break;
        case 'support':
          window.location.hash = '#support-help';
          setIsOpen(false);
          break;
        default:
          console.log('Unknown action:', action.action);
      }
    }
  };

  const handleFeedback = async (messageId: string, feedback: 'positive' | 'negative') => {
    setMessages(prev => 
      prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, feedback }
          : msg
      )
    );

    try {
      // Send feedback to backend
      await fetch('/api/ai-chat/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId,
          conversationId,
          feedback,
          timestamp: new Date().toISOString()
        })
      });

      if (feedback === 'positive') {
        success('Thanks for your feedback!');
      } else {
        success('Thanks for your feedback. We\'ll work to improve our responses.');
      }
    } catch (err) {
      console.error('Error sending feedback:', err);
    }
  };

  const resetConversation = () => {
    setMessages([]);
    setConversationId(null);
    initializeConversation();
  };

  const renderMessage = (message: Message) => {
    if (message.isTyping) {
      return (
        <div className="flex items-start gap-3 mb-4">
          <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0 shimmer-effect">
            <Bot className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="bg-gray-100/80 backdrop-blur-sm rounded-lg px-4 py-2">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div key={message.id} className={`flex items-start gap-3 mb-4 ${message.type === 'user' ? 'flex-row-reverse' : ''}`}>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
          message.type === 'user' 
            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 shimmer-effect' 
            : message.type === 'system'
            ? 'bg-yellow-100'
            : 'bg-indigo-100 shimmer-effect'
        }`}>
          {message.type === 'user' ? (
            <User className="w-4 h-4 text-white" />
          ) : message.type === 'system' ? (
            <ExternalLink className="w-4 h-4 text-yellow-600" />
          ) : (
            <Bot className="w-4 h-4 text-indigo-600" />
          )}
        </div>
        
        <div className={`max-w-xs lg:max-w-md ${message.type === 'user' ? 'text-right' : ''}`}>
          <div className={`rounded-lg px-4 py-2 ${
            message.type === 'user' 
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white' 
              : message.type === 'system'
              ? 'bg-yellow-50/80 backdrop-blur-sm text-yellow-800 border border-yellow-200/50'
              : 'bg-gray-100/80 backdrop-blur-sm text-gray-900'
          }`}>
            <p className="whitespace-pre-wrap text-sm">{message.content}</p>
          </div>
          
          {/* Suggestions */}
          {message.suggestions && message.suggestions.length > 0 && (
            <div className="mt-2 space-y-1">
              {message.suggestions.map((suggestion, index) => (
                <EnhancedButton
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="block w-full text-left text-xs bg-white/80 backdrop-blur-sm border-white/20 hover:bg-white/90"
                >
                  {suggestion}
                </EnhancedButton>
              ))}
            </div>
          )}
          
          {/* Actions */}
          {message.actions && message.actions.length > 0 && (
            <div className="mt-2 space-y-1">
              {message.actions.map((action, index) => (
                <EnhancedButton
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleActionClick(action)}
                  className="flex items-center gap-2 text-xs bg-indigo-50/80 backdrop-blur-sm text-indigo-700 border-indigo-200/50 hover:bg-indigo-100/80"
                >
                  {action.url && <ExternalLink className="w-3 h-3" />}
                  {action.label}
                </EnhancedButton>
              ))}
            </div>
          )}
          
          {/* Feedback buttons for bot messages */}
          {message.type === 'bot' && !message.isTyping && message.id !== 'welcome' && (
            <div className="flex items-center gap-2 mt-2">
              <EnhancedButton
                variant="ghost"
                size="sm"
                onClick={() => handleFeedback(message.id, 'positive')}
                className={`p-1 rounded transition-colors ${
                  message.feedback === 'positive' 
                    ? 'bg-green-100 text-green-600' 
                    : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                }`}
              >
                <ThumbsUp className="w-3 h-3" />
              </EnhancedButton>
              <EnhancedButton
                variant="ghost"
                size="sm"
                onClick={() => handleFeedback(message.id, 'negative')}
                className={`p-1 rounded transition-colors ${
                  message.feedback === 'negative' 
                    ? 'bg-red-100 text-red-600' 
                    : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                }`}
              >
                <ThumbsDown className="w-3 h-3" />
              </EnhancedButton>
            </div>
          )}
          
          <p className="text-xs text-gray-500 mt-1">
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>
    );
  };

  if (!isOpen) {
    return (
      <FloatingActionButton
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-6 z-50 w-14 h-14 bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 float-animation border-4 border-white"
        aria-label="Open AI Chat"
        icon={<MessageCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />}
      >
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shimmer-effect">
          <Bot className="w-3 h-3 text-white" />
        </div>
      </FloatingActionButton>
    );
  }

  return (
    <EnhancedCard className={`fixed bottom-24 right-6 z-50 glass-card shadow-2xl transition-all duration-300 ${
      isMinimized ? 'w-80 h-16' : 'w-96 h-[600px]'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-t-lg">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center shimmer-effect">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">AI Assistant</h3>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-400 rounded-full pulse-animation"></div>
              <span className="text-xs opacity-90">Online</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <EnhancedButton
            variant="ghost"
            size="sm"
            onClick={resetConversation}
            className="p-1 hover:bg-white/20 rounded text-white hover:text-white"
            title="Reset conversation"
          >
            <RotateCcw className="w-4 h-4" />
          </EnhancedButton>
          <EnhancedButton
            variant="ghost"
            size="sm"
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 hover:bg-white/20 rounded text-white hover:text-white"
          >
            {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </EnhancedButton>
          <EnhancedButton
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
            className="p-1 hover:bg-white/20 rounded text-white hover:text-white"
          >
            <X className="w-4 h-4" />
          </EnhancedButton>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 h-[480px] bg-white/30 backdrop-blur-sm">
            {messages.map(renderMessage)}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-white/10 bg-white/50 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask me anything about Adiology..."
                disabled={isLoading}
                className="flex-1 bg-white/70 backdrop-blur-sm border-white/20"
              />
              <EnhancedButton
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading}
                size="sm"
                className="px-3"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </EnhancedButton>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              AI responses may not always be accurate. For critical issues, contact support.
            </p>
          </div>
        </>
      )}
    </EnhancedCard>
  );
};