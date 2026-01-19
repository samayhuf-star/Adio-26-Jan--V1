/**
 * Production-Ready Notification Service
 * Provides centralized notification management with different types and priorities
 */

export type NotificationType = 'success' | 'error' | 'warning' | 'info' | 'loading';
export type NotificationPriority = 'low' | 'medium' | 'high' | 'critical';

export interface NotificationOptions {
  title?: string;
  description?: string;
  duration?: number;
  priority?: NotificationPriority;
  persistent?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
  id?: string;
}

interface NotificationRecord {
  id: string;
  type: NotificationType;
  message: string;
  options: NotificationOptions;
  timestamp: Date;
  dismissed: boolean;
}

class NotificationService {
  private toast: any = null;
  private initialized: boolean = false;
  private pendingNotifications: Array<{ type: NotificationType; message: string; options: NotificationOptions }> = [];
  private notificationHistory: NotificationRecord[] = [];
  private maxHistorySize: number = 100;

  setToastInstance(toastInstance: any) {
    this.toast = toastInstance;
    this.initialized = true;
    
    // Process any pending notifications
    this.processPendingNotifications();
  }

  isInitialized(): boolean {
    return this.initialized && this.toast !== null;
  }

  private processPendingNotifications() {
    if (!this.isInitialized()) return;
    
    while (this.pendingNotifications.length > 0) {
      const notification = this.pendingNotifications.shift();
      if (notification) {
        this.showNotification(notification.type, notification.message, notification.options);
      }
    }
  }

  private generateId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private addToHistory(id: string, type: NotificationType, message: string, options: NotificationOptions) {
    const record: NotificationRecord = {
      id,
      type,
      message,
      options,
      timestamp: new Date(),
      dismissed: false,
    };

    this.notificationHistory.unshift(record);
    
    // Trim history if too large
    if (this.notificationHistory.length > this.maxHistorySize) {
      this.notificationHistory = this.notificationHistory.slice(0, this.maxHistorySize);
    }
  }

  private showNotification(
    type: NotificationType,
    message: string,
    options: NotificationOptions = {}
  ): string | undefined {
    const notificationId = options.id || this.generateId();

    // If not initialized, queue the notification
    if (!this.isInitialized()) {
      this.pendingNotifications.push({ type, message, options });
      console.log(`[${type.toUpperCase()}] (queued) ${message}`);
      return notificationId;
    }

    const { 
      title, 
      description, 
      duration = 4000, 
      priority = 'medium', 
      persistent = false,
      action 
    } = options;

    // Calculate duration based on priority
    let finalDuration = duration;
    if (persistent) {
      finalDuration = Infinity;
    } else if (priority === 'critical') {
      finalDuration = 10000;
    } else if (priority === 'high') {
      finalDuration = 6000;
    }

    const config: any = {
      id: notificationId,
      duration: finalDuration,
      description: description || (title ? message : undefined),
    };

    if (action) {
      config.action = {
        label: action.label,
        onClick: action.onClick,
      };
    }

    // Add to history
    this.addToHistory(notificationId, type, message, options);

    try {
      switch (type) {
        case 'success':
          this.toast.success(title || message, config);
          break;
        case 'error':
          this.toast.error(title || message, config);
          break;
        case 'warning':
          this.toast.warning(title || message, config);
          break;
        case 'info':
          this.toast.info(title || message, config);
          break;
        case 'loading':
          return this.toast.loading(title || message, config);
        default:
          this.toast(title || message, config);
      }
    } catch (error) {
      console.error('Failed to show notification:', error);
      console.log(`[${type.toUpperCase()}] ${title || message}: ${description || message}`);
    }

    return notificationId;
  }

  success(message: string, options?: NotificationOptions): string | undefined {
    return this.showNotification('success', message, options);
  }

  error(message: string, options?: NotificationOptions): string | undefined {
    return this.showNotification('error', message, { ...options, priority: options?.priority || 'high' });
  }

  warning(message: string, options?: NotificationOptions): string | undefined {
    return this.showNotification('warning', message, options);
  }

  info(message: string, options?: NotificationOptions): string | undefined {
    return this.showNotification('info', message, options);
  }

  loading(message: string, options?: NotificationOptions): string | undefined {
    return this.showNotification('loading', message, options);
  }

  /**
   * Update an existing toast (useful for loading -> success/error transitions)
   */
  update(toastId: string, type: NotificationType, message: string, options?: NotificationOptions) {
    if (!this.isInitialized()) return;

    const config: any = {
      id: toastId,
      duration: options?.duration || 4000,
      description: options?.description,
    };

    try {
      switch (type) {
        case 'success':
          this.toast.success(message, config);
          break;
        case 'error':
          this.toast.error(message, config);
          break;
        case 'warning':
          this.toast.warning(message, config);
          break;
        case 'info':
          this.toast.info(message, config);
          break;
        default:
          this.toast(message, config);
      }
    } catch (error) {
      console.error('Failed to update notification:', error);
    }
  }

  /**
   * Promise-based notification for async operations
   */
  promise<T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
    },
    options?: NotificationOptions
  ): Promise<T> {
    if (!this.isInitialized()) {
      console.log(`[LOADING] ${messages.loading}`);
      return promise.then(
        (data) => {
          const successMsg = typeof messages.success === 'function' ? messages.success(data) : messages.success;
          console.log(`[SUCCESS] ${successMsg}`);
          return data;
        },
        (error) => {
          const errorMsg = typeof messages.error === 'function' ? messages.error(error) : messages.error;
          console.error(`[ERROR] ${errorMsg}`);
          throw error;
        }
      );
    }

    return this.toast.promise(promise, {
      loading: messages.loading,
      success: messages.success,
      error: messages.error,
      ...options,
    });
  }

  /**
   * Dismiss a specific notification or all notifications
   */
  dismiss(toastId?: number | string | 'all') {
    if (!this.isInitialized() || !this.toast?.dismiss) {
      return;
    }

    try {
      if (toastId === 'all' || toastId === undefined) {
        this.toast.dismiss();
      } else {
        this.toast.dismiss(toastId);
      }

      // Mark as dismissed in history
      if (toastId && toastId !== 'all') {
        const record = this.notificationHistory.find(n => n.id === toastId);
        if (record) {
          record.dismissed = true;
        }
      }
    } catch (error) {
      console.error('Failed to dismiss notification:', error);
    }
  }

  /**
   * Get notification history (for debugging or admin views)
   */
  getHistory(): NotificationRecord[] {
    return [...this.notificationHistory];
  }

  /**
   * Clear notification history
   */
  clearHistory() {
    this.notificationHistory = [];
  }

  /**
   * Custom notification with full control
   */
  custom(content: React.ReactNode, options?: NotificationOptions): string | undefined {
    if (!this.isInitialized()) return;

    const notificationId = options?.id || this.generateId();
    
    try {
      this.toast.custom(content, {
        id: notificationId,
        duration: options?.duration || 4000,
      });
    } catch (error) {
      console.error('Failed to show custom notification:', error);
    }

    return notificationId;
  }
}

// Singleton instance
export const notifications = new NotificationService();

// Re-export for convenience
export default notifications;
