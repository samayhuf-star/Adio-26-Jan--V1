import React, { useState, useEffect, useRef } from 'react';
import { AlertTriangle, AlertCircle, Trash2, Download, Copy, CheckCircle2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';

interface LogEntry {
  id: string;
  type: 'warning' | 'error';
  message: string;
  timestamp: Date;
  stack?: string;
  source?: string;
}

export const LogsPanel = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (!isPaused && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, isPaused]);

  useEffect(() => {
    // Store original console methods
    const originalWarn = console.warn;
    const originalError = console.error;

    // Override console.warn
    console.warn = (...args: any[]) => {
      // Call original warn
      originalWarn.apply(console, args);

      if (!isPaused) {
        const message = args
          .map(arg => {
            if (typeof arg === 'object') {
              try {
                return JSON.stringify(arg, null, 2);
              } catch {
                return String(arg);
              }
            }
            return String(arg);
          })
          .join(' ');

        const newLog: LogEntry = {
          id: `${Date.now()}-${Math.random()}`,
          type: 'warning',
          message,
          timestamp: new Date(),
        };

        setLogs(prev => [...prev, newLog].slice(-1000)); // Keep last 1000 logs
      }
    };

    // Override console.error
    console.error = (...args: any[]) => {
      // Call original error
      originalError.apply(console, args);

      if (!isPaused) {
        const message = args
          .map(arg => {
            if (typeof arg === 'object') {
              try {
                return JSON.stringify(arg, null, 2);
              } catch {
                return String(arg);
              }
            }
            return String(arg);
          })
          .join(' ');

        // Try to extract stack trace
        let stack: string | undefined;
        if (args[0] instanceof Error) {
          stack = args[0].stack;
        }

        const newLog: LogEntry = {
          id: `${Date.now()}-${Math.random()}`,
          type: 'error',
          message,
          timestamp: new Date(),
          stack,
        };

        setLogs(prev => [...prev, newLog].slice(-1000)); // Keep last 1000 logs
      }
    };

    // Capture unhandled errors
    const handleError = (event: ErrorEvent) => {
      if (!isPaused) {
        const newLog: LogEntry = {
          id: `${Date.now()}-${Math.random()}`,
          type: 'error',
          message: event.message || 'Unhandled error',
          timestamp: new Date(),
          stack: event.error?.stack,
          source: event.filename ? `${event.filename}:${event.lineno}:${event.colno}` : undefined,
        };
        setLogs(prev => [...prev, newLog].slice(-1000));
      }
    };

    // Capture unhandled promise rejections
    const handleRejection = (event: PromiseRejectionEvent) => {
      if (!isPaused) {
        const message = event.reason?.message || String(event.reason) || 'Unhandled promise rejection';
        const stack = event.reason?.stack;
        
        const newLog: LogEntry = {
          id: `${Date.now()}-${Math.random()}`,
          type: 'error',
          message,
          timestamp: new Date(),
          stack,
        };
        setLogs(prev => [...prev, newLog].slice(-1000));
      }
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);

    // Cleanup
    return () => {
      console.warn = originalWarn;
      console.error = originalError;
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, [isPaused]);

  const clearLogs = () => {
    setLogs([]);
  };

  const exportLogs = () => {
    const logText = logs
      .map(log => {
        const time = log.timestamp.toLocaleTimeString();
        const date = log.timestamp.toLocaleDateString();
        const header = `[${date} ${time}] ${log.type.toUpperCase()}`;
        const content = log.message;
        const stack = log.stack ? `\nStack: ${log.stack}` : '';
        const source = log.source ? `\nSource: ${log.source}` : '';
        return `${header}\n${content}${stack}${source}\n${'='.repeat(80)}\n`;
      })
      .join('\n');

    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `console-logs-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyLogs = async () => {
    const logText = logs
      .map(log => {
        const time = log.timestamp.toLocaleTimeString();
        const date = log.timestamp.toLocaleDateString();
        const header = `[${date} ${time}] ${log.type.toUpperCase()}`;
        const content = log.message;
        const stack = log.stack ? `\nStack: ${log.stack}` : '';
        const source = log.source ? `\nSource: ${log.source}` : '';
        return `${header}\n${content}${stack}${source}`;
      })
      .join('\n\n');

    try {
      await navigator.clipboard.writeText(logText);
      // You could show a toast notification here
    } catch (err) {
      console.error('Failed to copy logs:', err);
    }
  };

  const warningCount = logs.filter(log => log.type === 'warning').length;
  const errorCount = logs.filter(log => log.type === 'error').length;

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Console Logs</h1>
          <p className="text-slate-500 mt-1">Live monitoring of warnings and errors</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Stats */}
          <div className="flex items-center gap-4 px-4 py-2 bg-slate-50 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-600" />
              <span className="text-sm font-semibold text-slate-700">{warningCount}</span>
              <span className="text-xs text-slate-500">Warnings</span>
            </div>
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span className="text-sm font-semibold text-slate-700">{errorCount}</span>
              <span className="text-xs text-slate-500">Errors</span>
            </div>
          </div>

          {/* Actions */}
          <Button
            variant={isPaused ? "default" : "outline"}
            onClick={() => setIsPaused(!isPaused)}
            className={isPaused ? "bg-green-600 hover:bg-green-700 text-white" : ""}
          >
            {isPaused ? (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Resumed
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4 mr-2" />
                Paused
              </>
            )}
          </Button>
          <Button variant="outline" onClick={copyLogs}>
            <Copy className="w-4 h-4 mr-2" />
            Copy
          </Button>
          <Button variant="outline" onClick={exportLogs}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" onClick={clearLogs}>
            <Trash2 className="w-4 h-4 mr-2" />
            Clear
          </Button>
        </div>
      </div>

      {/* Logs Display */}
      <Card className="border-slate-200 shadow-lg">
        <CardHeader className="border-b border-slate-200 bg-slate-50">
          <CardTitle className="text-lg font-semibold text-slate-700">
            Live Logs ({logs.length} total)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-280px)]" ref={scrollAreaRef}>
            <div className="p-4 space-y-2">
              {logs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                  <AlertCircle className="w-16 h-16 mb-4 opacity-50" />
                  <p className="text-lg font-medium">No logs captured yet</p>
                  <p className="text-sm mt-2">Warnings and errors will appear here in real-time</p>
                </div>
              ) : (
                logs.map((log) => (
                  <div
                    key={log.id}
                    className={`p-4 rounded-lg border-l-4 ${
                      log.type === 'error'
                        ? 'bg-red-50 border-red-500 hover:bg-red-100'
                        : 'bg-yellow-50 border-yellow-500 hover:bg-yellow-100'
                    } transition-colors`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          {log.type === 'error' ? (
                            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                          ) : (
                            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                          )}
                          <Badge
                            variant="outline"
                            className={
                              log.type === 'error'
                                ? 'border-red-600 text-red-700 bg-red-100'
                                : 'border-yellow-600 text-yellow-700 bg-yellow-100'
                            }
                          >
                            {log.type.toUpperCase()}
                          </Badge>
                          <span className="text-xs text-slate-500 font-mono">
                            {formatTimestamp(log.timestamp)}
                          </span>
                        </div>
                        <div className="text-sm text-slate-800 font-mono whitespace-pre-wrap break-words">
                          {log.message}
                        </div>
                        {log.stack && (
                          <div className="mt-2 pt-2 border-t border-slate-300">
                            <div className="text-xs text-slate-600 font-semibold mb-1">Stack Trace:</div>
                            <div className="text-xs text-slate-700 font-mono whitespace-pre-wrap break-words bg-slate-100 p-2 rounded">
                              {log.stack}
                            </div>
                          </div>
                        )}
                        {log.source && (
                          <div className="mt-2 text-xs text-slate-500 font-mono">
                            Source: {log.source}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={logsEndRef} />
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

