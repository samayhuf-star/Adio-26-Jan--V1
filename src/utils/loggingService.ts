/**
 * Live Logging Service
 * Captures system events, API calls, console logs, and errors
 */

export type LogLevel = 'info' | 'success' | 'warning' | 'error' | 'debug';

export interface LogEntry {
  id: string;
  timestamp: number;
  level: LogLevel;
  category: string;
  message: string;
  details?: any;
  stack?: string;
}

type LogListener = (log: LogEntry) => void;

class LoggingService {
  private logs: LogEntry[] = [];
  private listeners: Set<LogListener> = new Set();
  private maxLogs = 500; // Keep last 500 logs
  private originalConsole: {
    log: typeof console.log;
    error: typeof console.error;
    warn: typeof console.warn;
    info: typeof console.info;
    debug: typeof console.debug;
  };

  constructor() {
    // Store original console methods
    this.originalConsole = {
      log: console.log.bind(console),
      error: console.error.bind(console),
      warn: console.warn.bind(console),
      info: console.info.bind(console),
      debug: console.debug.bind(console),
    };

    this.interceptConsole();
    this.interceptFetch();
    this.interceptErrors();
  }

  /**
   * Intercept console methods
   */
  private interceptConsole() {
    console.log = (...args: any[]) => {
      this.addLog('info', 'Console', this.formatMessage(args), { args });
      this.originalConsole.log(...args);
    };

    console.error = (...args: any[]) => {
      const message = this.formatMessage(args);
      const error = args.find(arg => arg instanceof Error);
      this.addLog('error', 'Console', message, { 
        args,
        stack: error?.stack 
      });
      this.originalConsole.error(...args);
    };

    console.warn = (...args: any[]) => {
      this.addLog('warning', 'Console', this.formatMessage(args), { args });
      this.originalConsole.warn(...args);
    };

    console.info = (...args: any[]) => {
      this.addLog('info', 'Console', this.formatMessage(args), { args });
      this.originalConsole.info(...args);
    };

    console.debug = (...args: any[]) => {
      this.addLog('debug', 'Console', this.formatMessage(args), { args });
      this.originalConsole.debug(...args);
    };
  }

  /**
   * Intercept fetch API calls
   */
  private interceptFetch() {
    const originalFetch = window.fetch;
    window.fetch = async (...args: Parameters<typeof fetch>) => {
      const [url, options] = args;
      const method = options?.method || 'GET';
      const startTime = Date.now();

      try {
        const response = await originalFetch(...args);
        const duration = Date.now() - startTime;
        const status = response.status;

        // Clone response to read body without consuming it
        const clonedResponse = response.clone();
        let responseData: any = null;
        
        try {
          const contentType = response.headers.get('content-type');
          if (contentType?.includes('application/json')) {
            responseData = await clonedResponse.json();
          } else {
            responseData = await clonedResponse.text();
          }
        } catch (e) {
          // Ignore body parsing errors
        }

        // Determine log level - 404s are warnings (expected fallbacks), other 4xx/5xx are errors
        const urlString = String(url);
        const isSupabaseRest = urlString.includes('/rest/v1/');
        const isExpected404 = status === 404 && (
          urlString.includes('/history/') || 
          urlString.includes('/published_websites') ||
          urlString.includes('/rest/v1/') ||
          urlString.includes('/functions/v1/')
        );
        
        let level: LogLevel;
        if (isExpected404) {
          level = 'warning'; // Expected when endpoints/tables don't exist
        } else if (status === 404) {
          level = 'warning'; // Other 404s are also warnings
        } else if (status >= 500) {
          level = 'error'; // Server errors
        } else if (status >= 400) {
          level = 'error'; // Client errors (except 404)
        } else if (status >= 300) {
          level = 'warning'; // Redirects
        } else {
          level = 'success';
        }
        
        const category = 'API';
        const message = isExpected404
          ? `${method} ${url} → ${status} (${duration}ms) - Expected fallback`
          : `${method} ${url} → ${status} (${duration}ms)`;

        this.addLog(level, category, message, {
          method,
          url: String(url),
          status,
          duration,
          requestBody: options?.body,
          responseData: responseData && typeof responseData === 'object' 
            ? JSON.stringify(responseData).substring(0, 200) 
            : String(responseData).substring(0, 200),
          isExpected: status === 404,
        });

        return response;
      } catch (error) {
        const duration = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        this.addLog('error', 'API', `${method} ${url} → Failed: ${errorMessage} (${duration}ms)`, {
          method,
          url: String(url),
          error: errorMessage,
          duration,
          requestBody: options?.body,
          stack: error instanceof Error ? error.stack : undefined,
        });

        throw error;
      }
    };
  }

  /**
   * Intercept global errors
   */
  private interceptErrors() {
    // Unhandled errors
    window.addEventListener('error', (event) => {
      this.addLog('error', 'System', event.message, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
      });
    });

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      const reason = event.reason;
      const message = reason instanceof Error ? reason.message : String(reason);
      
      // Filter out known browser extension errors
      if (
        message.includes('sw.js') ||
        message.includes('mobx-state-tree') ||
        message.includes('setDetectedLibs') ||
        (message.includes('service worker') && message.includes('extension'))
      ) {
        return; // Skip these
      }

      this.addLog('error', 'Promise', `Unhandled rejection: ${message}`, {
        reason: reason instanceof Error ? reason.message : String(reason),
        stack: reason instanceof Error ? reason.stack : undefined,
      });
    });
  }

  /**
   * Format console message arguments
   */
  private formatMessage(args: any[]): string {
    return args
      .map(arg => {
        if (arg instanceof Error) {
          return arg.message;
        }
        if (typeof arg === 'object') {
          try {
            return JSON.stringify(arg);
          } catch {
            return String(arg);
          }
        }
        return String(arg);
      })
      .join(' ');
  }

  /**
   * Add a log entry
   */
  addLog(level: LogLevel, category: string, message: string, details?: any) {
    const log: LogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      level,
      category,
      message,
      details,
      stack: details?.stack,
    };

    this.logs.push(log);

    // Keep only last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Notify listeners
    this.listeners.forEach(listener => listener(log));
  }

  /**
   * Log API transaction
   */
  logTransaction(type: string, action: string, data?: any) {
    this.addLog('info', 'Transaction', `${type}: ${action}`, data);
  }

  /**
   * Log system event
   */
  logSystemEvent(event: string, data?: any) {
    this.addLog('info', 'System', event, data);
  }

  /**
   * Log processing step
   */
  logProcessing(step: string, data?: any) {
    this.addLog('info', 'Processing', step, data);
  }

  /**
   * Subscribe to log events
   */
  subscribe(listener: LogListener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Get all logs
   */
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * Get logs filtered by level
   */
  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  /**
   * Clear all logs
   */
  clearLogs() {
    this.logs = [];
    // Notify listeners of clear
    this.listeners.forEach(listener => {
      listener({
        id: 'clear',
        timestamp: Date.now(),
        level: 'info',
        category: 'System',
        message: 'Logs cleared',
      });
    });
  }

  /**
   * Get error count
   */
  getErrorCount(): number {
    return this.logs.filter(log => log.level === 'error').length;
  }

  /**
   * Get warning count
   */
  getWarningCount(): number {
    return this.logs.filter(log => log.level === 'warning').length;
  }
}

// Export singleton instance
export const loggingService = new LoggingService();

