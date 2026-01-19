/**
 * Error Fallback Component
 * Displays user-friendly error messages with recovery options
 */

import React from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

interface ErrorFallbackProps {
  error: Error | null;
  errorInfo?: React.ErrorInfo | null;
  resetError?: () => void;
  eventId?: string | null;
  showDetails?: boolean;
}

export function ErrorFallback({
  error,
  errorInfo,
  resetError,
  eventId,
  showDetails = process.env.NODE_ENV === 'development',
}: ErrorFallbackProps) {
  const handleReload = () => {
    window.location.reload();
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  const handleReset = () => {
    if (resetError) {
      resetError();
    } else {
      handleReload();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-full bg-red-100">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <CardTitle className="text-2xl">Something went wrong</CardTitle>
              <CardDescription>
                We're sorry, but an unexpected error occurred
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error Details</AlertTitle>
            <AlertDescription>
              {error?.message || 'An unexpected error occurred'}
            </AlertDescription>
          </Alert>

          {showDetails && error && (
            <div className="space-y-2">
              <details className="border rounded-lg p-4 bg-slate-50">
                <summary className="cursor-pointer font-medium text-sm text-slate-700 mb-2">
                  Technical Details (for debugging)
                </summary>
                <div className="mt-2 space-y-2">
                  <div>
                    <p className="text-xs font-mono text-red-800 break-all">
                      {error.message}
                    </p>
                  </div>
                  {error.stack && (
                    <div>
                      <p className="text-xs font-semibold text-slate-600 mb-1">Stack Trace:</p>
                      <pre className="text-xs text-slate-600 overflow-auto max-h-48 bg-white p-2 rounded border">
                        {error.stack}
                      </pre>
                    </div>
                  )}
                  {errorInfo?.componentStack && (
                    <div>
                      <p className="text-xs font-semibold text-slate-600 mb-1">Component Stack:</p>
                      <pre className="text-xs text-slate-600 overflow-auto max-h-32 bg-white p-2 rounded border">
                        {errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                  {eventId && (
                    <div>
                      <p className="text-xs text-slate-500">
                        Error ID: <code className="bg-slate-200 px-1 rounded">{eventId}</code>
                      </p>
                    </div>
                  )}
                </div>
              </details>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button onClick={handleReset} className="flex-1">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            <Button onClick={handleGoHome} variant="outline" className="flex-1">
              <Home className="h-4 w-4 mr-2" />
              Go Home
            </Button>
            {showDetails && (
              <Button
                onClick={() => {
                  const errorReport = {
                    error: error?.message,
                    stack: error?.stack,
                    componentStack: errorInfo?.componentStack,
                    eventId,
                    timestamp: new Date().toISOString(),
                  };
                  console.log('Error Report:', errorReport);
                  navigator.clipboard.writeText(JSON.stringify(errorReport, null, 2));
                  alert('Error details copied to clipboard');
                }}
                variant="outline"
                className="flex-1"
              >
                <Bug className="h-4 w-4 mr-2" />
                Copy Details
              </Button>
            )}
          </div>

          <div className="text-center text-sm text-slate-500 pt-4 border-t">
            <p>
              If this problem persists, please contact support with the error ID above.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

