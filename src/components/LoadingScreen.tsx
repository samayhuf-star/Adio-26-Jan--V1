/**
 * Loading Screen Component
 * 
 * Shows a loading spinner while the app is initializing.
 * Used as a fallback for Suspense boundaries and initial load.
 */

export function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-800 via-indigo-800 to-purple-800">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-white text-lg">Loading Adiology...</p>
      </div>
    </div>
  );
}

