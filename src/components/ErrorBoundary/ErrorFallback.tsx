import React from 'react';
import { AlertTriangle, RefreshCw, Home, Bug, Copy } from 'lucide-react';
import { ErrorFallbackProps } from './ErrorBoundary';

export const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  errorInfo,
  resetError,
  eventId,
}) => {
  const [showDetails, setShowDetails] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const copyErrorDetails = async () => {
    const errorDetails = {
      eventId,
      message: error?.message,
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
    };

    try {
      await navigator.clipboard.writeText(JSON.stringify(errorDetails, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy error details:', err);
    }
  };

  const goHome = () => {
    window.location.href = '/';
  };

  const reloadPage = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-[400px] flex items-center justify-center p-6 bg-gradient-to-br from-red-50 to-orange-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg border border-red-200 p-6">
        <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full">
          <AlertTriangle className="w-8 h-8 text-red-600" />
        </div>
        
        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Oops! Something went wrong
          </h2>
          <p className="text-gray-600 text-sm">
            We encountered an unexpected error. Don't worry, your data is safe.
          </p>
          {eventId && (
            <p className="text-xs text-gray-500 mt-2 font-mono">
              Error ID: {eventId}
            </p>
          )}
        </div>

        <div className="space-y-3 mb-6">
          <button
            onClick={resetError}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
          
          <button
            onClick={reloadPage}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Reload Page
          </button>
          
          <button
            onClick={goHome}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          >
            <Home className="w-4 h-4" />
            Go Home
          </button>
        </div>

        <div className="border-t pt-4">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            <Bug className="w-4 h-4" />
            {showDetails ? 'Hide' : 'Show'} Error Details
          </button>
          
          {showDetails && (
            <div className="mt-3 p-3 bg-gray-50 rounded-md text-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-700">Error Details:</span>
                <button
                  onClick={copyErrorDetails}
                  className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded transition-colors"
                >
                  <Copy className="w-3 h-3" />
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              
              <div className="space-y-2 text-gray-600 font-mono">
                {error?.message && (
                  <div>
                    <strong>Message:</strong>
                    <div className="bg-white p-2 rounded border mt-1 break-all">
                      {error.message}
                    </div>
                  </div>
                )}
                
                {error?.stack && (
                  <div>
                    <strong>Stack Trace:</strong>
                    <div className="bg-white p-2 rounded border mt-1 max-h-32 overflow-y-auto text-xs">
                      <pre className="whitespace-pre-wrap break-all">
                        {error.stack}
                      </pre>
                    </div>
                  </div>
                )}
                
                {errorInfo?.componentStack && (
                  <div>
                    <strong>Component Stack:</strong>
                    <div className="bg-white p-2 rounded border mt-1 max-h-32 overflow-y-auto text-xs">
                      <pre className="whitespace-pre-wrap">
                        {errorInfo.componentStack}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            If this problem persists, please contact support with the Error ID above.
          </p>
        </div>
      </div>
    </div>
  );
};

// Minimal fallback for critical errors
export const MinimalErrorFallback: React.FC<ErrorFallbackProps> = ({ resetError }) => (
  <div className="min-h-[200px] flex items-center justify-center p-4 bg-red-50 border border-red-200 rounded-lg">
    <div className="text-center">
      <AlertTriangle className="w-8 h-8 text-red-600 mx-auto mb-2" />
      <h3 className="text-lg font-medium text-red-800 mb-2">Something went wrong</h3>
      <button
        onClick={resetError}
        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
      >
        Try Again
      </button>
    </div>
  </div>
);

// Form-specific error fallback
export const FormErrorFallback: React.FC<ErrorFallbackProps> = ({ error, resetError }) => (
  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
    <div className="flex items-start gap-3">
      <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
      <div className="flex-1">
        <h4 className="text-sm font-medium text-yellow-800 mb-1">
          Form Error
        </h4>
        <p className="text-sm text-yellow-700 mb-3">
          There was an error processing your form. Your data has been preserved.
        </p>
        <button
          onClick={resetError}
          className="text-sm bg-yellow-600 text-white px-3 py-1 rounded hover:bg-yellow-700 transition-colors"
        >
          Reset Form
        </button>
      </div>
    </div>
  </div>
);

// Data processing error fallback
export const DataErrorFallback: React.FC<ErrorFallbackProps> = ({ error, resetError }) => (
  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
    <div className="flex items-start gap-3">
      <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5" />
      <div className="flex-1">
        <h4 className="text-sm font-medium text-blue-800 mb-1">
          Data Processing Error
        </h4>
        <p className="text-sm text-blue-700 mb-3">
          We couldn't process your data. Please try again or use a different format.
        </p>
        <button
          onClick={resetError}
          className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  </div>
);
