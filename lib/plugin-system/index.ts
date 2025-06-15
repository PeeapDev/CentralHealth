/**
 * Plugin System
 * 
 * Main entry point for the hospital plugin system.
 * This file exports the core functionality needed to integrate plugins.
 */

// Export core modules
export * from './registry';
export * from './loader';
export * from './activation';
export * from './access-log';

// Re-export initialization function
import { initializePluginSystem } from './loader';
export { initializePluginSystem };

// Initialize plugin system at startup
if (typeof window === 'undefined') {
  // Only run on server side
  console.log('Server-side plugin system initialization');
  
  // Use dynamic import for server-side initialization
  // This avoids importing server-side code in client-side bundles
  import('./loader').then(({ initializePluginSystem }) => {
    // Don't immediately initialize in production to avoid startup delays
    // Production should initialize via API endpoint or startup script
    if (process.env.NODE_ENV !== 'production') {
      initializePluginSystem().catch(error => {
        console.error('Failed to initialize plugin system:', error);
      });
    }
  }).catch(error => {
    console.error('Failed to load plugin system:', error);
  });
}
