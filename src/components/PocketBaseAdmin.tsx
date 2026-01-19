import { useEffect, useRef } from 'react';

/**
 * PocketBase Admin Panel Component
 * 
 * This component embeds PocketBase's built-in admin UI in an iframe.
 * The admin UI is proxied through the server at /admin/_/
 * 
 * Login Credentials:
 * - Email: Check your .env file for POCKETBASE_ADMIN_EMAIL
 * - Password: Check your .env file for POCKETBASE_ADMIN_PASSWORD
 * 
 * If credentials are not set, you'll need to:
 * 1. Access PocketBase directly at your POCKETBASE_URL
 * 2. Create the first admin account (first-time setup)
 * 3. Set POCKETBASE_ADMIN_EMAIL and POCKETBASE_ADMIN_PASSWORD in your .env file
 */
export function PocketBaseAdmin() {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    // Focus the iframe when component mounts
    if (iframeRef.current) {
      iframeRef.current.focus();
    }
  }, []);

  return (
    <div className="w-full h-screen flex flex-col">
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              PocketBase Admin Panel
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Manage your PocketBase database, collections, and users
            </p>
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            <a
              href="/admin/_/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Open in new tab
            </a>
          </div>
        </div>
      </div>
      <div className="flex-1 relative">
        <iframe
          ref={iframeRef}
          src="/admin/_/"
          className="w-full h-full border-0"
          title="PocketBase Admin Panel"
          allow="clipboard-read; clipboard-write"
        />
      </div>
    </div>
  );
}

export default PocketBaseAdmin;
