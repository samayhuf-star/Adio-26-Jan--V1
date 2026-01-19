/**
 * Production Logger
 * Centralized logging for production environment
 */

import { getCurrentAuthUser } from './auth';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, any>;
  userId?: string;
  sessionId?: string;
}

class ProductionLogger {
  private isProduction = !import.meta.env.DEV;
  private sessionId = this.generateSessionId();

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async getUserId(): Promise<string | undefined> {
    try {
      const user = await getCurrentAuthUser();
      return user?.id || user?.email;
    } catch (e) {
      // Ignore errors
      return undefined;
    }
  }

  private async createLogEntry(
    level: LogLevel,
    message: string,
    context?: Record<string, any>
  ): Promise<LogEntry> {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      userId: await this.getUserId(),
      sessionId: this.sessionId,
    };
  }

  private async log(entry: LogEntry) {
    // In production, send to logging service
    if (this.isProduction) {
      // TODO: Send to your logging service (e.g., Sentry, LogRocket, etc.)
      // Example:
      // fetch('/api/logs', {
      //   method: 'POST',
      //   body: JSON.stringify(entry),
      // }).catch(() => {});
    }

    // Always log to console in development
    if (!this.isProduction) {
      const { level, message, context } = entry;
      const logMethod = level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log';
      console[logMethod](`[${level.toUpperCase()}]`, message, context || '');
    }
  }

  async info(message: string, context?: Record<string, any>) {
    const entry = await this.createLogEntry('info', message, context);
    await this.log(entry);
  }

  async warn(message: string, context?: Record<string, any>) {
    const entry = await this.createLogEntry('warn', message, context);
    await this.log(entry);
  }

  async error(message: string, error?: Error | unknown, context?: Record<string, any>) {
    const errorContext = {
      ...context,
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name,
      } : error,
    };
    const entry = await this.createLogEntry('error', message, errorContext);
    await this.log(entry);
  }

  async debug(message: string, context?: Record<string, any>) {
    if (!this.isProduction) {
      const entry = await this.createLogEntry('debug', message, context);
      await this.log(entry);
    }
  }

  // Track user actions
  async trackAction(action: string, properties?: Record<string, any>) {
    await this.info(`User action: ${action}`, {
      action,
      ...properties,
    });
  }

  // Track feature usage
  async trackFeature(feature: string, properties?: Record<string, any>) {
    await this.info(`Feature used: ${feature}`, {
      feature,
      ...properties,
    });
  }

  // Track errors with context
  async trackError(error: Error | unknown, context?: Record<string, any>) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    await this.error(message, error, context);
  }
}

export const productionLogger = new ProductionLogger();

