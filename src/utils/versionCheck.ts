/**
 * Version Check Utility
 * Detects when app has been redeployed and handles stale cache issues
 */

const APP_VERSION_KEY = 'app_version';
const VERSION_CHECK_INTERVAL = 5 * 60 * 1000; // Check every 5 minutes
const VERSION_CHECK_INITIALIZED_KEY = 'app_version_initialized';

// Generate a unique build ID based on build time - use a stable fallback
const BUILD_VERSION = import.meta.env.VITE_BUILD_TIME || 'dev-build-v1';

/**
 * Initialize version checking
 * This helps detect when the app has been redeployed
 */
export function initVersionCheck() {
  if (typeof window === 'undefined') return;

  // Prevent multiple initializations in the same page load
  if ((window as any).__versionCheckInitialized) return;
  (window as any).__versionCheckInitialized = true;

  const storedVersion = localStorage.getItem(APP_VERSION_KEY);
  
  // First visit or version match - store current version
  if (!storedVersion) {
    localStorage.setItem(APP_VERSION_KEY, BUILD_VERSION);
    return;
  }

  // Version mismatch detected - app was redeployed
  // Only trigger once per session to prevent repeated cache clearing
  const sessionKey = `version_cleared_${BUILD_VERSION}`;
  const alreadyCleared = sessionStorage.getItem(sessionKey);
  
  if (storedVersion !== BUILD_VERSION && !alreadyCleared) {
    console.log('[VersionCheck] New version detected, updating...');
    localStorage.setItem(APP_VERSION_KEY, BUILD_VERSION);
    sessionStorage.setItem(sessionKey, 'true');
    // Clear any stale caches - only once
    clearStaleCache();
  } else if (storedVersion !== BUILD_VERSION) {
    // Update stored version but don't clear cache again
    localStorage.setItem(APP_VERSION_KEY, BUILD_VERSION);
  }

  // Start periodic version checks (for long-running sessions)
  startPeriodicVersionCheck();
}

/**
 * Clear stale caches to prevent chunk load errors
 */
async function clearStaleCache() {
  if ('caches' in window) {
    try {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
      console.log('[VersionCheck] Cleared browser caches');
    } catch (e) {
      console.warn('[VersionCheck] Failed to clear caches:', e);
    }
  }
}

/**
 * Periodically check for new versions during long sessions
 */
function startPeriodicVersionCheck() {
  setInterval(async () => {
    try {
      // Try to fetch a timestamp file to check for new deployments
      const response = await fetch('/version.json?t=' + Date.now(), {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      });
      
      if (response.ok) {
        const data = await response.json();
        const storedVersion = localStorage.getItem(APP_VERSION_KEY);
        
        if (data.version && data.version !== storedVersion) {
          console.log('[VersionCheck] New deployment detected');
          showUpdateNotification();
        }
      }
    } catch (e) {
      // Silently fail - version file may not exist
    }
  }, VERSION_CHECK_INTERVAL);
}

/**
 * Show a non-intrusive notification about available update
 */
function showUpdateNotification() {
  // Create a subtle update banner
  const banner = document.createElement('div');
  banner.id = 'version-update-banner';
  banner.innerHTML = `
    <div style="
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: linear-gradient(135deg, #4f46e5, #7c3aed);
      color: white;
      padding: 16px 24px;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.2);
      z-index: 10000;
      font-family: system-ui, sans-serif;
      display: flex;
      align-items: center;
      gap: 12px;
      animation: slideIn 0.3s ease-out;
    ">
      <span style="font-size: 14px;">A new version is available</span>
      <button onclick="window.location.reload()" style="
        background: white;
        color: #4f46e5;
        border: none;
        padding: 8px 16px;
        border-radius: 6px;
        font-weight: 600;
        cursor: pointer;
        font-size: 13px;
      ">Refresh</button>
      <button onclick="this.parentElement.parentElement.remove()" style="
        background: transparent;
        color: white;
        border: none;
        padding: 4px;
        cursor: pointer;
        opacity: 0.7;
        font-size: 18px;
      ">&times;</button>
    </div>
  `;
  
  // Add animation styles
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from { transform: translateX(100px); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `;
  document.head.appendChild(style);
  
  // Remove existing banner if any
  const existing = document.getElementById('version-update-banner');
  if (existing) existing.remove();
  
  document.body.appendChild(banner);
}

/**
 * Handle chunk load errors by forcing a reload
 */
export function handleChunkLoadError(error: Error | string): boolean {
  const errorMessage = typeof error === 'string' ? error : (error.message || '');
  const errorName = typeof error === 'string' ? '' : (error.name || '');
  
  const isChunkError = 
    errorMessage.includes('Failed to fetch dynamically imported module') ||
    errorMessage.includes('Loading chunk') ||
    errorMessage.includes('ChunkLoadError') ||
    errorMessage.includes('ERR_ABORTED 404') ||
    errorMessage.includes('net::ERR_ABORTED') ||
    errorMessage.includes('Failed to fetch') ||
    errorName === 'ChunkLoadError' ||
    errorName === 'TypeError';

  if (isChunkError) {
    // Check if it's specifically a 404 for a JS asset (likely stale cache)
    const is404ForAsset = errorMessage.includes('404') && 
                         (errorMessage.includes('.js') || errorMessage.includes('assets/'));
    
    if (is404ForAsset || errorMessage.includes('dynamically imported module')) {
      console.log('[VersionCheck] Chunk load error detected (likely stale cache), reloading...');
      // Clear caches and reload
      clearStaleCache().then(() => {
        // Force reload bypassing cache
        window.location.reload();
      });
      return true;
    }
  }
  
  return false;
}
