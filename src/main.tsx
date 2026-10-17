import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { installGlobalErrorHandlers } from './lib/error-reporter'
import { openLocalDB } from './lib/local-db'
import { initSyncEngine } from './lib/sync-engine'
import { logger } from './utils/logger';

// Install global error handlers (catches unhandled errors + promise rejections)
installGlobalErrorHandlers()

// Initialize local database and sync engine
openLocalDB().then(() => {
  logger.log('[main] Local DB initialized');
  initSyncEngine();
}).catch((err) => {
  logger.error('[main] Failed to initialize local DB:', err);
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// ─── Service Worker Registration ────────────────────────────────────
// Stale-while-revalidate for static assets, network-first for API calls,
// offline fallback page for navigation.
if ('serviceWorker' in navigator) {
  // Only register in production (Vite dev server handles its own HMR)
  if (import.meta.env.PROD) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js', { scope: '/' })
        .then((registration) => {
          logger.log('[SW] Registered successfully, scope:', registration.scope);

          // Check for updates every 30 minutes
          setInterval(() => {
            registration.update();
          }, 30 * 60 * 1000);

          // Handle updates: activate new SW immediately
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (!newWorker) return;

            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New version available — activate it
                logger.log('[SW] New version available, activating...');
                newWorker.postMessage('SKIP_WAITING');
              }
            });
          });
        })
        .catch((error) => {
          logger.error('[SW] Registration failed:', error);
        });

      // Log when new SW takes control without force-reloading the active page
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        logger.log('[SW] Controller changed — new service worker active');
      });
    });
  } else {
    // Development: unregister any lingering SWs to avoid stale caches
    navigator.serviceWorker.getRegistrations().then(registrations => {
      registrations.forEach(reg => reg.unregister());
    });
    if ('caches' in window) {
      caches.keys().then(keys => keys.forEach(key => caches.delete(key)));
    }
  }
}
