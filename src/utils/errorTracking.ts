/**
 * Error Tracking Utility
 * 
 * This module provides centralized error tracking functionality.
 * Currently uses console logging, but can be extended to integrate
 * with Sentry, LogRocket, or other error tracking services.
 */

import { productionLogger } from './productionLogger';

interface ErrorContext {
  userId?: string;
  module?: string;
  action?: string;
  metadata?: Record<string, any>;
}

class ErrorTracker {
  private initialized = false;
  private sentryDsn: string | null = null;

  /**
   * Initialize error tracking
   */
  init() {
    if (this.initialized) return;

    // Check for Sentry DSN
    this.sentryDsn = import.meta.env.VITE_SENTRY_DSN || null;

    // Set up global error handlers
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        this.captureError(event.error || new Error(event.message), {
          module: 'global',
          metadata: {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
          },
        });
      });

      window.addEventListener('unhandledrejection', (event) => {
        this.captureError(
          event.reason instanceof Error
            ? event.reason
            : new Error(String(event.reason)),
          {
            module: 'promise',
            metadata: {
              reason: event.reason,
            },
          }
        );
      });
    }

    this.initialized = true;
    console.log('✅ Error tracking initialized');
  }

  /**
   * Capture an error
   */
  captureError(error: Error | string, context?: ErrorContext) {
    const errorObj = typeof error === 'string' ? new Error(error) : error;
    const timestamp = new Date().toISOString();

    // Filter out expected/benign errors that shouldn't be logged
    const errorMessage = errorObj.message?.toLowerCase() || '';
    const isExpectedError = 
      (errorMessage.includes('request failed') && context?.module === 'api') ||
      errorMessage.includes('network error') ||
      errorMessage.includes('fetch') ||
      errorMessage.includes('schema cache') ||
      errorMessage.includes('could not find the table') ||
      errorMessage.includes('does not exist') ||
      (context?.module === 'api' && (errorMessage.includes('404') || errorMessage.includes('failed')));

    // Only log unexpected errors
    if (!isExpectedError) {
      console.error('🚨 Error Captured:', {
        message: errorObj.message,
        stack: errorObj.stack,
        context,
        timestamp,
      });
    }

    // Use production logger (if available)
    try {
      if (typeof productionLogger !== 'undefined' && productionLogger.trackError) {
        productionLogger.trackError(errorObj, context);
      }
    } catch (e) {
      // Production logger not available, continue without it
      console.warn('Production logger not available:', e);
    }

    // TODO: Integrate with Sentry
    // if (this.sentryDsn) {
    //   Sentry.captureException(errorObj, {
    //     tags: {
    //       module: context?.module || 'unknown',
    //       action: context?.action || 'unknown',
    //     },
    //     user: context?.userId ? { id: context.userId } : undefined,
    //     extra: context?.metadata,
    //   });
    // }

    // TODO: Send to backend logging service
    // this.sendToBackend({
    //   error: errorObj.message,
    //   stack: errorObj.stack,
    //   context,
    //   timestamp,
    // });
  }

  /**
   * Capture a warning
   */
  captureWarning(message: string, context?: ErrorContext) {
    const timestamp = new Date().toISOString();

    console.warn('⚠️ Warning:', {
      message,
      context,
      timestamp,
    });

    // TODO: Integrate with Sentry
    // if (this.sentryDsn) {
    //   Sentry.captureMessage(message, {
    //     level: 'warning',
    //     tags: {
    //       module: context?.module || 'unknown',
    //     },
    //   });
    // }
  }

  /**
   * Capture an info message
   */
  captureInfo(message: string, context?: ErrorContext) {
    const timestamp = new Date().toISOString();

    console.info('ℹ️ Info:', {
      message,
      context,
      timestamp,
    });
  }

  /**
   * Set user context for error tracking
   */
  setUser(userId: string, email?: string) {
    // TODO: Set Sentry user context
    // if (this.sentryDsn) {
    //   Sentry.setUser({
    //     id: userId,
    //     email,
    //   });
    // }
  }

  /**
   * Clear user context
   */
  clearUser() {
    // TODO: Clear Sentry user context
    // if (this.sentryDsn) {
    //   Sentry.setUser(null);
    // }
  }
}

// Singleton instance
export const errorTracker = new ErrorTracker();

// Initialize on import
if (typeof window !== 'undefined') {
  errorTracker.init();
}

// Helper functions for easy usage
export const captureError = (error: Error | string, context?: ErrorContext) => {
  errorTracker.captureError(error, context);
};

export const captureWarning = (message: string, context?: ErrorContext) => {
  errorTracker.captureWarning(message, context);
};

export const captureInfo = (message: string, context?: ErrorContext) => {
  errorTracker.captureInfo(message, context);
};

