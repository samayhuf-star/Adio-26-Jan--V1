import { useState, useEffect, useRef } from 'react';
import { X, Trash2, AlertCircle, CheckCircle2, Info, AlertTriangle, Bug, ChevronDown, ChevronUp, Minimize2, Maximize2, Download } from 'lucide-react';
import { loggingService, LogEntry, LogLevel } from '../utils/loggingService';

interface LiveLogsProps {
  className?: string;
}

export function LiveLogs({ className = '' }: LiveLogsProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMinimized, setIsMinimized] = useState(() => {
    // Check if user previously hid logs
    return localStorage.getItem('liveLogsHidden') === 'true';
  });
  const [filter, setFilter] = useState<LogLevel | 'all'>('all');
  const [autoScroll, setAutoScroll] = useState(true);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const logsContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initial load
    setLogs(loggingService.getLogs());

    // Subscribe to new logs
    const unsubscribe = loggingService.subscribe((log) => {
      if (log.id === 'clear') {
        setLogs([]);
      } else {
        setLogs(prev => {
          const newLogs = [...prev, log];
          // Keep only last 500 logs in state
          return newLogs.slice(-500);
        });
      }
    });

    // Listen for show logs event
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

  // Auto-scroll to bottom when new logs arrive
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
  const infoCount = logs.filter(log => log.level === 'info').length;

  const getLogIcon = (level: LogLevel) => {
    switch (level) {
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'info':
        return <Info className="w-4 h-4 text-blue-500" />;
      case 'debug':
        return <Bug className="w-4 h-4 text-gray-500" />;
      default:
        return <Info className="w-4 h-4 text-gray-500" />;
    }
  };

  const getLogColor = (level: LogLevel) => {
    switch (level) {
      case 'error':
        return 'bg-red-50 border-red-200 text-red-900';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-900';
      case 'success':
        return 'bg-green-50 border-green-200 text-green-900';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-900';
      case 'debug':
        return 'bg-gray-50 border-gray-200 text-gray-700';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-700';
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
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
  };

  const handleFilterClick = (level: LogLevel | 'all') => {
    setFilter(level);
  };

  const handleExport = () => {
    const logsToExport = filter === 'all' ? logs : filteredLogs;
    
    // Format logs as text
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

    // Create blob and download
    const blob = new Blob([textContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    // Generate filename with current timestamp
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, -5); // Format: YYYY-MM-DDTHH-MM-SS
    const filename = `system-logs-${timestamp}-${filter === 'all' ? 'all' : filter}.txt`;
    
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // Log the export action
    loggingService.logSystemEvent('Logs exported', { 
      filename, 
      count: logsToExport.length,
      filter 
    });
  };

  if (isMinimized) {
    return (
      <div className={`fixed bottom-4 right-4 bg-white border border-gray-200 shadow-lg rounded-lg z-50 ${className}`}>
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMinimized(false)}
              className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              <Maximize2 className="w-4 h-4" />
              <span className="text-xs">Logs</span>
            </button>
            {errorCount > 0 && (
              <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-medium">
                {errorCount}
              </span>
            )}
            {warningCount > 0 && (
              <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs font-medium">
                {warningCount}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed bottom-4 right-4 bg-white border border-gray-200 shadow-2xl rounded-lg z-50 flex flex-col ${className}`} style={{ width: '500px', maxHeight: isExpanded ? '60vh' : '250px' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-200 rounded-t-lg flex-shrink-0">
        <div className="flex items-center gap-3 flex-shrink-0 min-w-0">
          <div className="flex items-center gap-2">
            <Bug className="w-5 h-5 text-indigo-600" />
            <h3 className="font-semibold text-gray-900">System Logs</h3>
          </div>
          
          {/* Minimize button */}
          <button
            onClick={() => {
              setIsMinimized(true);
              localStorage.setItem('liveLogsHidden', 'true');
            }}
            className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors"
            title="Minimize logs panel"
          >
            <Minimize2 className="w-4 h-4" />
          </button>

          {/* Download button */}
          <button
            onClick={handleExport}
            className="p-1.5 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-100 rounded transition-colors"
            title="Download logs to file"
          >
            <Download className="w-4 h-4" />
          </button>
          
          {/* Stats - Clickable for filtering */}
          <div className="flex items-center gap-2 text-xs ml-2">
            {errorCount > 0 && (
              <button
                onClick={() => handleFilterClick('error')}
                className={`px-2 py-1 rounded font-medium transition-all ${
                  filter === 'error' 
                    ? 'bg-red-500 text-white shadow-md' 
                    : 'bg-red-100 text-red-700 hover:bg-red-200 cursor-pointer'
                }`}
                title="Click to filter errors"
              >
                {errorCount} errors
              </button>
            )}
            {warningCount > 0 && (
              <button
                onClick={() => handleFilterClick('warning')}
                className={`px-2 py-1 rounded font-medium transition-all ${
                  filter === 'warning' 
                    ? 'bg-yellow-500 text-white shadow-md' 
                    : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 cursor-pointer'
                }`}
                title="Click to filter warnings"
              >
                {warningCount} warnings
              </button>
            )}
            {successCount > 0 && (
              <button
                onClick={() => handleFilterClick('success')}
                className={`px-2 py-1 rounded font-medium transition-all ${
                  filter === 'success' 
                    ? 'bg-green-500 text-white shadow-md' 
                    : 'bg-green-100 text-green-700 hover:bg-green-200 cursor-pointer'
                }`}
                title="Click to filter success logs"
              >
                {successCount} success
              </button>
            )}
            <button
              onClick={() => handleFilterClick('all')}
              className={`px-2 py-1 rounded font-medium transition-all ${
                filter === 'all' 
                  ? 'bg-indigo-500 text-white shadow-md' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 cursor-pointer'
              }`}
              title="Click to show all logs"
            >
              {logs.length} total
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
          {/* Filter */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as LogLevel | 'all')}
            className="text-xs px-2 py-1 border border-gray-300 rounded bg-white text-gray-700"
          >
            <option value="all">All</option>
            <option value="error">Errors</option>
            <option value="warning">Warnings</option>
            <option value="success">Success</option>
            <option value="info">Info</option>
            <option value="debug">Debug</option>
          </select>

          {/* Quick filter to errors button - only show if there are errors */}
          {errorCount > 0 && (
            <button
              onClick={() => {
                setFilter('error');
                // Scroll to first error after a brief delay
                setTimeout(() => {
                  const firstError = logsContainerRef.current?.querySelector('[data-log-level="error"]');
                  if (firstError) {
                    firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }
                }, 100);
              }}
              className={`px-2 py-1 text-xs rounded font-medium transition-colors flex items-center gap-1 ${
                filter === 'error'
                  ? 'bg-red-500 text-white shadow-md'
                  : 'bg-red-100 text-red-700 hover:bg-red-200'
              }`}
              title="Show only errors"
            >
              <AlertCircle className="w-3 h-3" />
              Errors
            </button>
          )}

          {/* Auto-scroll toggle */}
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`px-2 py-1 text-xs rounded ${
              autoScroll 
                ? 'bg-indigo-100 text-indigo-700' 
                : 'bg-gray-100 text-gray-600'
            }`}
            title={autoScroll ? 'Auto-scroll enabled' : 'Auto-scroll disabled'}
          >
            Auto
          </button>

          {/* Clear */}
          <button
            onClick={handleClear}
            className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
            title="Clear logs"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          {/* Expand/Collapse */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>

          {/* Minimize */}
          <button
            onClick={() => setIsMinimized(true)}
            className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
            title="Minimize"
          >
            <Minimize2 className="w-4 h-4" />
          </button>

          {/* Close (hide completely) */}
          <button
            onClick={() => {
              setIsMinimized(true);
              // Store preference to hide logs
              localStorage.setItem('liveLogsHidden', 'true');
              // Dispatch event so other components can show logs again if needed
              window.dispatchEvent(new CustomEvent('liveLogsHidden'));
            }}
            className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Logs Container */}
      <div 
        ref={logsContainerRef}
        className="flex-1 overflow-y-auto bg-gray-900 text-green-400 font-mono text-xs rounded-b-lg"
        style={{ 
          fontFamily: 'Monaco, Menlo, "Courier New", monospace',
          fontSize: '11px',
          lineHeight: '1.5'
        }}
      >
        {filteredLogs.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            No logs to display
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                data-log-level={log.level}
                className={`p-2 rounded border-l-2 ${getLogColor(log.level)} hover:bg-opacity-80 transition-colors ${
                  log.level === 'error' ? 'ring-1 ring-red-300' : ''
                }`}
              >
                <div className="flex items-start gap-2">
                  <div className="mt-0.5 shrink-0">
                    {getLogIcon(log.level)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-gray-500 font-mono text-xs">
                        {formatTimestamp(log.timestamp)}
                      </span>
                      <span className="px-1.5 py-0.5 bg-gray-200 text-gray-700 rounded text-xs font-medium">
                        {log.category}
                      </span>
                      <span className={`font-semibold ${
                        log.level === 'error' ? 'text-red-700' :
                        log.level === 'warning' ? 'text-yellow-700' :
                        log.level === 'success' ? 'text-green-700' :
                        'text-blue-700'
                      }`}>
                        {log.level.toUpperCase()}
                      </span>
                    </div>
                    <div className="mt-1 break-words">
                      <span className={log.level === 'error' ? 'text-red-900 font-semibold' : 'text-gray-900'}>
                        {log.message}
                      </span>
                    </div>
                    {log.details && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-xs text-gray-600 hover:text-gray-900">
                          Details
                        </summary>
                        <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-x-auto max-h-32 overflow-y-auto">
                          {formatDetails(log.details)}
                        </pre>
                      </details>
                    )}
                    {log.stack && (
                      <details className="mt-1">
                        <summary className="cursor-pointer text-xs text-red-600 hover:text-red-800">
                          Stack Trace
                        </summary>
                        <pre className="mt-1 p-2 bg-red-50 rounded text-xs overflow-x-auto max-h-32 overflow-y-auto text-red-900">
                          {log.stack}
                        </pre>
                      </details>
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

