import React, { createContext, useContext, ReactNode } from 'react';
import { getCurrentAuthUser } from '../utils/auth';

interface ChatMessage {
  id: string;
  content: string;
  suggestions?: string[];
  actions?: Array<{
    label: string;
    action: string;
    url?: string;
  }>;
}

interface ChatContext {
  currentPage?: string;
  userAgent?: string;
  timestamp?: string;
}

interface AIChatContextType {
  sendMessage: (conversationId: string, message: string, context?: ChatContext) => Promise<ChatMessage>;
  createConversation: () => Promise<string>;
  getConversationHistory: (conversationId: string) => Promise<ChatMessage[]>;
  escalateToHuman: (conversationId: string, reason: string) => Promise<void>;
}

const AIChatContext = createContext<AIChatContextType | undefined>(undefined);

interface AIChatProviderProps {
  children: ReactNode;
}

export const AIChatProvider: React.FC<AIChatProviderProps> = ({ children }) => {
  
  const sendMessage = async (
    conversationId: string, 
    message: string, 
    context?: ChatContext
  ): Promise<ChatMessage> => {
    try {
      const user = await getCurrentAuthUser();
      
      const response = await fetch('/api/ai-chat/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId,
          message,
          context: {
            ...context,
            userId: user?.id,
            userEmail: user?.email,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to send message');
      }

      return data.data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  };

  const createConversation = async (): Promise<string> => {
    try {
      const user = await getCurrentAuthUser();
      
      const response = await fetch('/api/ai-chat/conversation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user?.id,
          userEmail: user?.email,
          startedAt: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to create conversation');
      }

      return data.data.conversationId;
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  };

  const getConversationHistory = async (conversationId: string): Promise<ChatMessage[]> => {
    try {
      const response = await fetch(`/api/ai-chat/conversation/${conversationId}/history`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to get conversation history');
      }

      return data.data;
    } catch (error) {
      console.error('Error getting conversation history:', error);
      throw error;
    }
  };

  const escalateToHuman = async (conversationId: string, reason: string): Promise<void> => {
    try {
      const user = await getCurrentAuthUser();
      
      const response = await fetch('/api/ai-chat/escalate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId,
          reason,
          userId: user?.id,
          userEmail: user?.email,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to escalate to human');
      }
    } catch (error) {
      console.error('Error escalating to human:', error);
      throw error;
    }
  };

  const value: AIChatContextType = {
    sendMessage,
    createConversation,
    getConversationHistory,
    escalateToHuman,
  };

  return (
    <AIChatContext.Provider value={value}>
      {children}
    </AIChatContext.Provider>
  );
};

export const useAIChat = (): AIChatContextType => {
  const context = useContext(AIChatContext);
  if (context === undefined) {
    throw new Error('useAIChat must be used within an AIChatProvider');
  }
  return context;
};