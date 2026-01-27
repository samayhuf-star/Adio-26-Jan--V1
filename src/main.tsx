import { createRoot } from "react-dom/client";
import { Suspense } from "react";
import App from "./App.tsx";
import "./index.css";
import "./styles/themes.css";
import "./styles/dashboard-theme-modern.css";
import "./styles/userPreferences.css";
import { Toaster } from "./components/ui/sonner";
import { notifications } from "./utils/notifications";
import { toast } from "sonner";
import { ThemeProvider } from "./contexts/ThemeContext";
import { initializeUserPreferences } from "./utils/userPreferences";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { LoadingScreen } from "./components/LoadingScreen";
import { validateEnvironment } from "./utils/envCheck";
import { loggingService } from "./utils/loggingService";
import { initVersionCheck, handleChunkLoadError } from "./utils/versionCheck";
import { NhostProvider } from "./components/NhostProvider";

// Nhost migration complete - using Nhost for auth, database and storage

// Initialize notification service
notifications.setToastInstance(toast);

// Initialize global error handlers
if (typeof window !== 'undefined') {
  // Handle unhandled errors
  window.addEventListener('error', async (event) => {
    const errorMessage = String(event.error || event.message || '');
    
    // Check for chunk load errors first (stale cache after deployment)
    if (event.error && handleChunkLoadError(event.error)) {
      event.preventDefault();
      return;
    }
    
    // Also check the error message string for 404s on JS assets
    if (errorMessage.includes('404') && errorMessage.includes('.js')) {
      if (handleChunkLoadError(errorMessage)) {
        event.preventDefault();
        return;
      }
    }
    
    // Ignore browser extension errors but allow mobx-state-tree errors to show
    // so we can verify our fixes worked
    if (
      errorMessage.includes('setDetectedLibs') ||
      errorMessage.includes('installHook.js') ||
      errorMessage.includes('host-additional-hooks.js') ||
      (errorMessage.includes('service worker') && errorMessage.includes('extension'))
    ) {
      return;
    }

    // Handle real errors (including mobx-state-tree to verify fixes)
    if (event.error) {
      try {
        const { ErrorHandler } = await import('./utils/errorHandler');
        ErrorHandler.captureError(event.error, {
          component: 'Global',
          action: 'unhandled_error',
        }, 'high');
      } catch (e) {
        console.error('Failed to load error handler:', e);
      }
    }
  });

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', async (event) => {
    const errorMessage = String(event.reason || '');
    
    // Ignore browser extension errors and expected Nhost token refresh failures
    if (
      errorMessage.includes('sw.js') ||
      errorMessage.includes('mobx-state-tree') ||
      errorMessage.includes('setDetectedLibs') ||
      errorMessage.includes('installHook.js') ||
      errorMessage.includes('host-additional-hooks.js') ||
      errorMessage.includes('tabId not found') ||
      // Suppress expected 401 errors from Nhost token refresh (invalid/expired refresh tokens)
      (errorMessage.includes('nhost.run/v1/token') && errorMessage.includes('401')) ||
      (errorMessage.includes('nhost.run/v1/token') && errorMessage.includes('Unauthorized'))
    ) {
      event.preventDefault();
      return;
    }

    // Handle real promise rejections
    const error = event.reason instanceof Error 
      ? event.reason 
      : new Error(String(event.reason));
    
    // Check if it's a chunk load error (stale cache after deployment)
    // Also check the error message string directly for 404s
    if (handleChunkLoadError(error) || handleChunkLoadError(String(event.reason))) {
      event.preventDefault();
      return;
    }
    
    try {
      const { ErrorHandler } = await import('./utils/errorHandler');
      ErrorHandler.captureError(error, {
        component: 'Global',
        action: 'unhandled_rejection',
      }, 'high');
    } catch (e) {
      console.error('Failed to load error handler:', e);
    }
    
    event.preventDefault(); // Prevent default browser error handling
  });

  // Filter console errors (keep for debugging but don't show notifications)
  const originalConsoleError = console.error;
  console.error = (...args: any[]) => {
    const errorMessage = args.join(' ');
    if (
      errorMessage.includes('sw.js') ||
      errorMessage.includes('mobx-state-tree') ||
      errorMessage.includes('setDetectedLibs') ||
      errorMessage.includes('installHook.js') ||
      errorMessage.includes('host-additional-hooks.js') ||
      (errorMessage.includes('service worker') && errorMessage.includes('extension')) ||
      // Suppress expected 401 errors from Nhost token refresh (invalid/expired refresh tokens)
      (errorMessage.includes('nhost.run/v1/token') && errorMessage.includes('401')) ||
      (errorMessage.includes('nhost.run/v1/token') && errorMessage.includes('Unauthorized'))
    ) {
      return;
    }
    originalConsoleError.apply(console, args);
  };
}

// Initialize user preferences on app load
initializeUserPreferences();

// Initialize version checking for cache busting
initVersionCheck();

// Initialize logging service to start capturing logs
loggingService.logSystemEvent('Application starting', { timestamp: new Date().toISOString() });

// Check environment variables before rendering
const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found");
}

// Check environment configuration
if (!validateEnvironment()) {
  // Show configuration error instead of blank page
  rootElement.innerHTML = `
    <div style="padding: 40px; text-align: center; font-family: system-ui, sans-serif; min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #1e293b 0%, #4f46e5 50%, #7c3aed 100%); color: white;">
      <div style="max-width: 600px; padding: 32px; background: rgba(255, 255, 255, 0.1); border-radius: 16px; backdrop-filter: blur(10px);">
        <h1 style="font-size: 24px; margin-bottom: 16px; font-weight: 600;">Configuration Error</h1>
        <p style="margin-bottom: 24px; opacity: 0.9;">Missing required environment variables. Please check your deployment settings.</p>
        <p style="font-size: 14px; opacity: 0.8;">If you're deploying to Vercel, ensure all required environment variables are set in your project settings.</p>
      </div>
    </div>
  `;
} else {
  createRoot(rootElement).render(
    <ErrorBoundary>
      <NhostProvider>
        <ThemeProvider>
          <Suspense fallback={<LoadingScreen />}>
            <App />
          </Suspense>
          <Toaster position="top-right" richColors closeButton visibleToasts={1} />
        </ThemeProvider>
      </NhostProvider>
    </ErrorBoundary>
  );
}
