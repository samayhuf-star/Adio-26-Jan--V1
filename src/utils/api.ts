import { projectId, publicAnonKey } from './supabase/info';
import { captureError } from './errorTracking';
import { loggingService } from './loggingService';

// Base URL for API calls
const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-6757d0ca`;

export const api = {
  // Health check to verify server availability
  async healthCheck() {
    try {
      loggingService.logProcessing('Health check started', { endpoint: '/health' });
      const response = await fetch(`${API_BASE}/health`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });
      const isHealthy = response.ok;
      loggingService.logSystemEvent('Health check completed', { status: response.status, healthy: isHealthy });
      return isHealthy;
    } catch (e) {
      loggingService.addLog('error', 'API', 'Health check failed', { error: e instanceof Error ? e.message : String(e) });
      captureError(e instanceof Error ? e : new Error('Health check failed'), {
        module: 'api',
        action: 'healthCheck',
      });
      return false;
    }
  },

  async post(endpoint: string, body: any) {
    // Check if projectId exists
    if (!projectId || projectId === 'undefined') {
      const error = new Error('Project ID not configured');
      loggingService.addLog('error', 'API', 'POST request failed: Project ID not configured', { endpoint });
      throw error;
    }

    try {
      // Only log transaction for non-404 endpoints to reduce noise
      if (!endpoint.includes('/history/') && !endpoint.includes('/generate-ads')) {
        loggingService.logTransaction('API', `POST ${endpoint}`, { 
          endpoint, 
          bodySize: JSON.stringify(body).length
        });
      }
      
      // Add timeout using AbortController
      // Use longer timeout for ad generation (60 seconds) vs default (30 seconds)
      const isAdGeneration = endpoint.includes('/generate-ads') || endpoint.includes('/generate');
      const timeoutMs = isAdGeneration ? 60000 : 30000;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      
      // Prepare headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`
      };
      
      let response;
      try {
        response = await fetch(`${API_BASE}${endpoint}`, {
          method: 'POST',
          headers,
          body: JSON.stringify(body),
          signal: controller.signal
        });
      } finally {
        clearTimeout(timeoutId);
      }

      if (!response.ok) {
        let errorMessage = 'Request failed';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          errorMessage += `: ${response.statusText}`;
        }
        
        // Suppress 404 warnings - these are expected when endpoints don't exist
        // Only log non-404 errors
        if (response.status !== 404) {
          loggingService.addLog('error', 'API', `POST ${endpoint} → ${response.status}`, { 
            endpoint, 
            status: response.status,
            statusText: response.statusText
          });
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      loggingService.logTransaction('API', `POST ${endpoint} succeeded`, { 
        endpoint, 
        status: response.status
      });
      return data;
    } catch (e) {
      // Silently fail for expected server unavailability (Make.com endpoints)
      // The calling code will handle fallback to localStorage
      if (e instanceof TypeError && e.message.includes('fetch')) {
        const networkError = new Error('Network error: Unable to reach server');
        // Suppress warning for expected network errors - fallback will handle it
        // loggingService.addLog('warning', 'API', `POST ${endpoint}: Network error`, { endpoint });
        throw networkError;
      }
      // Don't capture expected errors (404, network errors, timeouts, or generic request failures)
      // These are expected when the server is unavailable or slow
      const errorMessage = e instanceof Error ? e.message : String(e);
      const errorName = e instanceof Error ? e.name : '';
      const isExpectedError = 
        errorMessage.includes('404') ||
        errorMessage.includes('Network error') ||
        errorMessage.includes('Request failed') ||
        errorMessage.includes('fetch') ||
        errorMessage.includes('aborted') ||
        errorName === 'AbortError';
      
      if (!isExpectedError) {
        loggingService.addLog('error', 'API', `POST ${endpoint} error: ${errorMessage}`, { endpoint, error: errorMessage });
        captureError(e instanceof Error ? e : new Error(String(e)), {
          module: 'api',
          action: 'post',
          metadata: { endpoint },
        });
      }
      throw e;
    }
  },

  async get(endpoint: string) {
    // Check if projectId exists
    if (!projectId || projectId === 'undefined') {
      const error = new Error('Project ID not configured');
      loggingService.addLog('error', 'API', 'GET request failed: Project ID not configured', { endpoint });
      throw error;
    }

    try {
      // Only log transaction for non-404 endpoints to reduce noise
      if (!endpoint.includes('/history/') && !endpoint.includes('/generate-ads')) {
        loggingService.logTransaction('API', `GET ${endpoint}`, { endpoint });
      }

      // Prepare headers
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${publicAnonKey}`
      };

      const response = await fetch(`${API_BASE}${endpoint}`, {
        headers
      });

      if (!response.ok) {
        let errorMessage = 'Request failed';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          errorMessage += `: ${response.statusText}`;
        }
        
        // Suppress 404 warnings - these are expected when endpoints don't exist
        // Only log non-404 errors
        if (response.status !== 404) {
          loggingService.addLog('error', 'API', `GET ${endpoint} → ${response.status}`, { 
            endpoint, 
            status: response.status,
            statusText: response.statusText
          });
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      loggingService.logTransaction('API', `GET ${endpoint} succeeded`, { 
        endpoint, 
        status: response.status
      });
      return data;
    } catch (e) {
      // Silently fail for expected server unavailability (Make.com endpoints)
      // The calling code will handle fallback to localStorage
      if (e instanceof TypeError && e.message.includes('fetch')) {
        const networkError = new Error('Network error: Unable to reach server');
        // Suppress warning for expected network errors - fallback will handle it
        // loggingService.addLog('warning', 'API', `GET ${endpoint}: Network error`, { endpoint });
        throw networkError;
      }
      // Don't capture expected errors (404, network errors, timeouts, or generic request failures)
      // These are expected when the server is unavailable or slow
      const errorMessage = e instanceof Error ? e.message : String(e);
      const errorName = e instanceof Error ? e.name : '';
      const isExpectedError = 
        errorMessage.includes('404') ||
        errorMessage.includes('Network error') ||
        errorMessage.includes('Request failed') ||
        errorMessage.includes('fetch') ||
        errorMessage.includes('aborted') ||
        errorName === 'AbortError';
      
      if (!isExpectedError) {
        loggingService.addLog('error', 'API', `GET ${endpoint} error: ${errorMessage}`, { endpoint, error: errorMessage });
        captureError(e instanceof Error ? e : new Error(String(e)), {
          module: 'api',
          action: 'get',
          metadata: { endpoint },
        });
      }
      throw e;
    }
  }
};