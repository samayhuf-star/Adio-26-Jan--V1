import { useState, useEffect, useRef } from 'react';
import { X, Trash2, AlertCircle, CheckCircle2, Info, AlertTriangle, Bug, ChevronDown, ChevronUp, Minimize2, Download, Activity, RefreshCw } from 'lucide-react';
import { loggingService, LogEntry, LogLevel } from '../utils/loggingService';

interface LiveLogsProps {
  className?: string;
}

export function LiveLogs({ className = '' }: LiveLogsProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMinimized, setIsMinimized] = useState(() => {
    return localStorage.getItem('liveLogsHidden') === 'true';
  });
  const [filter, setFilter] = useState<LogLevel | 'all'>('all');
  const [autoScroll, setAutoScroll] = useState(true);
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());
  const logsEndRef = useRef<HTMLDivElement>(null);
  const logsContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLogs(loggingService.getLogs());

    const unsubscribe = loggingService.subscribe((log) => {
      if (log.id === 'clear') {
        setLogs([]);
      } else {
        setLogs(prev => {
          const newLogs = [...prev, log];
          return newLogs.slice(-500);
        });
      }
    });

    const handleShowLogs = () => {
      setIsMinimized(false);
      localStorage.removeItem('liveLogsHidden');
    };

    window.addEventListener('liveLogsShow', handleShowLogs);

    return () => {
      unsubscribe();
      window.removeEventListener('liveLogsShow', handleShowLogs);
    };
  }, []);

  useEffect(() => {
    if (autoScroll && !isMinimized && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll, isMinimized]);

  const filteredLogs = filter === 'all' 
    ? logs 
    : logs.filter(log => log.level === filter);

  const errorCount = logs.filter(log => log.level === 'error').length;
  const warningCount = logs.filter(log => log.level === 'warning').length;
  const successCount = logs.filter(log => log.level === 'success').length;

  const getLogIcon = (level: LogLevel) => {
    switch (level) {
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />;
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />;
      case 'info':
        return <Info className="w-4 h-4 text-blue-500 flex-shrink-0" />;
      case 'debug':
        return <Bug className="w-4 h-4 text-gray-400 flex-shrink-0" />;
      default:
        return <Info className="w-4 h-4 text-gray-400 flex-shrink-0" />;
    }
  };

  const getLevelBadgeStyle = (level: LogLevel) => {
    switch (level) {
      case 'error':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'warning':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'success':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'info':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'debug':
        return 'bg-gray-100 text-gray-600 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const getLogRowStyle = (level: LogLevel) => {
    switch (level) {
      case 'error':
        return 'bg-red-50 border-l-4 border-l-red-500 hover:bg-red-100';
      case 'warning':
        return 'bg-amber-50 border-l-4 border-l-amber-400 hover:bg-amber-100';
      case 'success':
        return 'bg-white border-l-4 border-l-emerald-400 hover:bg-emerald-50';
      case 'info':
        return 'bg-white border-l-4 border-l-blue-400 hover:bg-blue-50';
      case 'debug':
        return 'bg-gray-50 border-l-4 border-l-gray-300 hover:bg-gray-100';
      default:
        return 'bg-white border-l-4 border-l-gray-200 hover:bg-gray-50';
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }) + '.' + String(date.getMilliseconds()).padStart(3, '0');
  };

  const formatDetails = (details: any): string => {
    if (!details) return '';
    try {
      if (typeof details === 'string') return details;
      if (details.stack) return details.stack;
      return JSON.stringify(details, null, 2);
    } catch {
      return String(details);
    }
  };

  const handleClear = () => {
    loggingService.clearLogs();
    setLogs([]);
    setExpandedLogs(new Set());
  };

  const toggleLogExpansion = (logId: string) => {
    setExpandedLogs(prev => {
      const next = new Set(prev);
      if (next.has(logId)) {
        next.delete(logId);
      } else {
        next.add(logId);
      }
      return next;
    });
  };

  const handleExport = () => {
    const logsToExport = filter === 'all' ? logs : filteredLogs;
    
    let textContent = `System Logs Export\n`;
    textContent += `Generated: ${new Date().toISOString()}\n`;
    textContent += `Filter: ${filter === 'all' ? 'All Logs' : filter.toUpperCase()}\n`;
    textContent += `Total Logs: ${logsToExport.length}\n`;
    textContent += `\n${'='.repeat(80)}\n\n`;

    logsToExport.forEach((log, index) => {
      textContent += `[${index + 1}] ${log.level.toUpperCase()} - ${log.category}\n`;
      textContent += `Timestamp: ${new Date(log.timestamp).toISOString()}\n`;
      textContent += `Message: ${log.message}\n`;
      
      if (log.details) {
        textContent += `Details:\n${formatDetails(log.details)}\n`;
      }
      
      if (log.stack) {
        textContent += `Stack Trace:\n${log.stack}\n`;
      }
      
      textContent += `\n${'-'.repeat(80)}\n\n`;
    });

    const blob = new Blob([textContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `system-logs-${timestamp}-${filter === 'all' ? 'all' : filter}.txt`;
    
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Floating toggle button when minimized
  if (isMinimized) {
    return (
      <button
        onClick={() => {
          setIsMinimized(false);
          localStorage.removeItem('liveLogsHidden');
        }}
        className={`fixed bottom-6 right-6 bg-white border border-gray-200 shadow-lg rounded-full p-3 z-50 hover:shadow-xl transition-all duration-200 group ${className}`}
        title="Show System Logs"
      >
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-indigo-600" />
          {(errorCount > 0 || warningCount > 0) && (
            <div className="flex items-center gap-1">
              {errorCount > 0 && (
                <span className="px-1.5 py-0.5 bg-red-500 text-white rounded-full text-xs font-medium min-w-[20px] text-center">
                  {errorCount}
                </span>
              )}
              {warningCount > 0 && (
                <span className="px-1.5 py-0.5 bg-amber-500 text-white rounded-full text-xs font-medium min-w-[20px] text-center">
                  {warningCount}
                </span>
              )}
            </div>
          )}
        </div>
      </button>
    );
  }

  return (
    <div 
      className={`fixed bottom-6 right-6 bg-white border border-gray-200 shadow-2xl rounded-xl z-50 flex flex-col overflow-hidden ${className}`} 
      style={{ 
        width: '520px', 
        maxHeight: isExpanded ? '70vh' : '280px',
        minHeight: '200px'
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-slate-50 to-white border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-100 rounded-lg">
              <Activity className="w-4 h-4 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">System Logs</h3>
            </div>
          </div>
        </div>

        {/* Stats Badges */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilter(filter === 'error' ? 'all' : 'error')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              filter === 'error' 
                ? 'bg-red-500 text-white shadow-md' 
                : 'bg-red-100 text-red-700 hover:bg-red-200'
            }`}
            title="Filter errors"
          >
            {errorCount} errors
          </button>
          <button
            onClick={() => setFilter(filter === 'warning' ? 'all' : 'warning')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              filter === 'warning' 
                ? 'bg-amber-500 text-white shadow-md' 
                : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
            }`}
            title="Filter warnings"
          >
            {warningCount} warnings
          </button>
          <button
            onClick={() => setFilter(filter === 'success' ? 'all' : 'success')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              filter === 'success' 
                ? 'bg-emerald-500 text-white shadow-md' 
                : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
            }`}
            title="Filter success"
          >
            {successCount} success
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              filter === 'all' 
                ? 'bg-gray-700 text-white shadow-md' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            title="Show all"
          >
            {logs.length} total
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`p-1.5 rounded-lg transition-colors ${
              autoScroll 
                ? 'bg-indigo-100 text-indigo-600' 
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
            }`}
            title={autoScroll ? 'Auto-scroll on' : 'Auto-scroll off'}
          >
            <RefreshCw className={`w-4 h-4 ${autoScroll ? 'animate-spin' : ''}`} style={{ animationDuration: '3s' }} />
          </button>
          <button
            onClick={handleExport}
            className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            title="Export logs"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={handleClear}
            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Clear logs"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
          <button
            onClick={() => {
              setIsMinimized(true);
              localStorage.setItem('liveLogsHidden', 'true');
            }}
            className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Minimize"
          >
            <Minimize2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setIsMinimized(true);
              localStorage.setItem('liveLogsHidden', 'true');
            }}
            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Logs Container */}
      <div 
        ref={logsContainerRef}
        className="flex-1 overflow-y-auto bg-gray-50"
      >
        {filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <Activity className="w-12 h-12 text-gray-300 mb-3" />
            <p className="text-gray-500 text-sm">No logs to display</p>
            <p className="text-gray-400 text-xs mt-1">System activity will appear here</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className={`p-3 transition-colors cursor-pointer ${getLogRowStyle(log.level)}`}
                onClick={() => toggleLogExpansion(log.id)}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {getLogIcon(log.level)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-gray-400 font-mono text-xs">
                        {formatTimestamp(log.timestamp)}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-xs font-medium border ${getLevelBadgeStyle(log.level)}`}>
                        {log.category}
                      </span>
                      <span className={`text-xs font-bold uppercase ${
                        log.level === 'error' ? 'text-red-600' :
                        log.level === 'warning' ? 'text-amber-600' :
                        log.level === 'success' ? 'text-emerald-600' :
                        'text-blue-600'
                      }`}>
                        {log.level}
                      </span>
                    </div>
                    <p className={`text-sm break-words ${log.level === 'error' ? 'text-red-800 font-medium' : 'text-gray-700'}`}>
                      {log.message}
                    </p>
                    
                    {/* Expandable Details */}
                    {(log.details || log.stack) && (
                      <div className="mt-1">
                        <button 
                          className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleLogExpansion(log.id);
                          }}
                        >
                          {expandedLogs.has(log.id) ? (
                            <ChevronUp className="w-3 h-3" />
                          ) : (
                            <ChevronDown className="w-3 h-3" />
                          )}
                          Details
                        </button>
                        
                        {expandedLogs.has(log.id) && (
                          <div className="mt-2 space-y-2">
                            {log.details && (
                              <pre className="p-2 bg-white rounded border border-gray-200 text-xs overflow-x-auto max-h-32 overflow-y-auto text-gray-600 font-mono">
                                {formatDetails(log.details)}
                              </pre>
                            )}
                            {log.stack && (
                              <pre className="p-2 bg-red-50 rounded border border-red-200 text-xs overflow-x-auto max-h-32 overflow-y-auto text-red-700 font-mono">
                                {log.stack}
                              </pre>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        )}
      </div>
    </div>
  );
}
