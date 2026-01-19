import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
  persistent?: boolean;
  showProgress?: boolean;
  canRetry?: boolean;
  onRetry?: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
  metadata?: {
    component?: string;
    errorReported?: boolean;
    supportLink?: string;
  };
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => string;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  // Enhanced convenience methods
  success: (title: string, options?: string | Partial<Notification>) => string;
  error: (title: string, options?: string | Partial<Notification>) => string;
  warning: (title: string, options?: string | Partial<Notification>) => string;
  info: (title: string, options?: string | Partial<Notification>) => string;
  // Contextual error method
  contextualError: (
    title: string,
    context: string,
    error?: any,
    action?: string
  ) => string;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [timeouts, setTimeouts] = useState<{ [id: string]: NodeJS.Timeout }>({});

  const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newNotification: Notification = {
      id,
      duration: 5000, // Default 5 seconds
      showProgress: true,
      ...notification,
    };

    setNotifications(prev => [...prev, newNotification]);

    // Auto-remove after duration (unless persistent)
    if (!newNotification.persistent && newNotification.duration && newNotification.duration > 0) {
      const timeoutId = setTimeout(() => {
        removeNotification(id);
      }, newNotification.duration);
      
      setTimeouts(prev => ({ ...prev, [id]: timeoutId }));
    }

    return id;
  }, []);

  const removeNotification = useCallback((id: string) => {
    // Clear timeout if it exists
    setTimeouts(prev => {
      if (prev[id]) {
        clearTimeout(prev[id]);
        const { [id]: removed, ...rest } = prev;
        return rest;
      }
      return prev;
    });
    
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    // Clear all timeouts
    setTimeouts(prev => {
      Object.values(prev).forEach(timeout => clearTimeout(timeout));
      return {};
    });
    
    setNotifications([]);
  }, []);

  // Enhanced convenience methods with flexible options
  const success = useCallback((title: string, options?: string | Partial<Notification>) => {
    const opts = typeof options === 'string' ? { message: options } : options || {};
    return addNotification({ type: 'success', title, ...opts });
  }, [addNotification]);

  const error = useCallback((title: string, options?: string | Partial<Notification>) => {
    const opts = typeof options === 'string' ? { message: options } : options || {};
    return addNotification({ 
      type: 'error', 
      title, 
      duration: 8000, // Errors stay longer
      metadata: { errorReported: true },
      ...opts 
    });
  }, [addNotification]);

  const warning = useCallback((title: string, options?: string | Partial<Notification>) => {
    const opts = typeof options === 'string' ? { message: options } : options || {};
    return addNotification({ type: 'warning', title, ...opts });
  }, [addNotification]);

  const info = useCallback((title: string, options?: string | Partial<Notification>) => {
    const opts = typeof options === 'string' ? { message: options } : options || {};
    return addNotification({ type: 'info', title, ...opts });
  }, [addNotification]);

  // Contextual error method that uses enhanced error handling
  const contextualError = useCallback((
    title: string,
    context: string,
    error?: any,
    action?: string
  ) => {
    // This would integrate with the enhanced error handler
    const errorDetails = error ? {
      message: error.message || 'An unexpected error occurred',
      canRetry: !['401', '403', '404'].includes(String(error.status)),
      metadata: {
        component: context,
        errorReported: true,
        supportLink: 'mailto:support@adiology.io'
      }
    } : {};

    return addNotification({
      type: 'error',
      title,
      duration: 10000,
      ...errorDetails
    });
  }, [addNotification]);

  const value: NotificationContextType = {
    notifications,
    addNotification,
    removeNotification,
    clearAll,
    success,
    error,
    warning,
    info,
    contextualError,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationContainer />
    </NotificationContext.Provider>
  );
};

const NotificationContainer: React.FC = () => {
  const { notifications, removeNotification } = useNotification();

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {notifications.map((notification) => (
        <NotificationToast
          key={notification.id}
          notification={notification}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  );
};

interface NotificationToastProps {
  notification: Notification;
  onClose: () => void;
}

const NotificationToast: React.FC<NotificationToastProps> = ({ notification, onClose }) => {
  const [progress, setProgress] = React.useState(100);

  React.useEffect(() => {
    if (!notification.persistent && notification.duration && notification.showProgress) {
      const interval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev - (100 / (notification.duration! / 100));
          if (newProgress <= 0) {
            clearInterval(interval);
            return 0;
          }
          return newProgress;
        });
      }, 100);

      return () => clearInterval(interval);
    }
  }, [notification.duration, notification.persistent, notification.showProgress]);

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-500" />;
      default:
        return <Info className="w-5 h-5 text-gray-500" />;
    }
  };

  const getBorderColor = () => {
    switch (notification.type) {
      case 'success':
        return 'border-l-green-500';
      case 'error':
        return 'border-l-red-500';
      case 'warning':
        return 'border-l-yellow-500';
      case 'info':
        return 'border-l-blue-500';
      default:
        return 'border-l-gray-500';
    }
  };

  const getBgColor = () => {
    switch (notification.type) {
      case 'success':
        return 'bg-green-50';
      case 'error':
        return 'bg-red-50';
      case 'warning':
        return 'bg-yellow-50';
      case 'info':
        return 'bg-blue-50';
      default:
        return 'bg-gray-50';
    }
  };

  return (
    <div
      className={`
        relative overflow-hidden rounded-lg border-l-4 bg-white shadow-lg transition-all duration-300 ease-in-out
        ${getBorderColor()} ${getBgColor()}
        animate-in slide-in-from-right-full
      `}
    >
      {/* Progress bar */}
      {notification.showProgress && !notification.persistent && (
        <div className="absolute bottom-0 left-0 h-1 bg-gray-200">
          <div
            className={`h-full transition-all duration-100 ease-linear ${
              notification.type === 'success' ? 'bg-green-500' :
              notification.type === 'error' ? 'bg-red-500' :
              notification.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {getIcon()}
          </div>
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium text-gray-900">
              {notification.title}
            </p>
            {notification.message && (
              <p className="mt-1 text-sm text-gray-600">
                {notification.message}
              </p>
            )}
            
            {/* Error metadata */}
            {notification.metadata?.errorReported && (
              <p className="mt-1 text-xs text-gray-500">
                ✓ Error reported automatically
              </p>
            )}

            {/* Action buttons */}
            <div className="mt-2 flex gap-2">
              {notification.canRetry && notification.onRetry && (
                <button
                  onClick={notification.onRetry}
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-500"
                >
                  Try Again
                </button>
              )}
              
              {notification.metadata?.supportLink && (
                <a
                  href={notification.metadata.supportLink}
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-500"
                >
                  Get Help
                </a>
              )}
              
              {notification.action && (
                <button
                  onClick={notification.action.onClick}
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-500"
                >
                  {notification.action.label}
                </button>
              )}
            </div>
          </div>
          <div className="ml-4 flex-shrink-0">
            <button
              onClick={onClose}
              className="inline-flex rounded-md text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};