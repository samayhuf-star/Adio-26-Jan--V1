/**
 * Production-Ready Logger
 * Replaces console statements with production-safe logging
 */

const isDevelopment = import.meta.env.DEV;
const isProduction = import.meta.env.PROD;

interface LogContext {
  [key: string]: any;
}

class Logger {
  private sessionId: string;
  private userId?: string;

  constructor() {
    this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  setUserId(userId: string) {
    this.userId = userId;
  }

  private createLogEntry(
    level: 'log' | 'info' | 'warn' | 'error' | 'debug',
    message: string,
    ...args: any[]
  ) {
    return {
      level,
      message,
      args: args.length > 0 ? args : undefined,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      userId: this.userId,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
    };
  }

  private async sendToBackend(entry: ReturnType<typeof this.createLogEntry>) {
    // Only send errors and warnings in production
    if (isProduction && (entry.level === 'error' || entry.level === 'warn')) {
      try {
        // Send to backend logging endpoint if available
        await fetch('/api/logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(entry),
        }).catch(() => {
          // Silently fail if logging endpoint is not available
        });
      } catch (e) {
        // Ignore logging errors
      }
    }
  }

  log(message: string, ...args: any[]) {
    const entry = this.createLogEntry('log', message, ...args);
    if (isDevelopment) {
      console.log(`[LOG]`, message, ...args);
    }
    this.sendToBackend(entry);
  }

  info(message: string, ...args: any[]) {
    const entry = this.createLogEntry('info', message, ...args);
    if (isDevelopment) {
      console.info(`[INFO]`, message, ...args);
    }
    this.sendToBackend(entry);
  }

  warn(message: string, ...args: any[]) {
    const entry = this.createLogEntry('warn', message, ...args);
    // Always show warnings
    console.warn(`[WARN]`, message, ...args);
    this.sendToBackend(entry);
  }

  error(message: string, ...args: any[]) {
    const entry = this.createLogEntry('error', message, ...args);
    // Always show errors
    console.error(`[ERROR]`, message, ...args);
    this.sendToBackend(entry);
  }

  debug(message: string, ...args: any[]) {
    const entry = this.createLogEntry('debug', message, ...args);
    // Only in development
    if (isDevelopment) {
      console.debug(`[DEBUG]`, message, ...args);
    }
  }
}

// Export singleton instance
export const logger = new Logger();

// Export convenience functions
export const log = logger.log.bind(logger);
export const info = logger.info.bind(logger);
export const warn = logger.warn.bind(logger);
export const error = logger.error.bind(logger);
export const debug = logger.debug.bind(logger);
