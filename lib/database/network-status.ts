/**
 * Network status utility to check connectivity and handle online/offline transitions
 */

import { EventEmitter } from 'events'

// Create a global event emitter for network status changes
export const networkEvents = new EventEmitter()

// Track current online status
let _isOnline = true

// Helper to check if we're in a browser environment
const isBrowser = typeof window !== 'undefined'

/**
 * Check if the application is currently online
 * This uses multiple strategies based on environment:
 * - In browser: Uses navigator.onLine and active endpoint checks
 * - In Node/Electron: Uses custom endpoint checks
 */
export const isOnline = async (): Promise<boolean> => {
  // For server-side or non-browser environments (like Electron background process)
  if (!isBrowser) {
    try {
      // Try to fetch a reliable endpoint
      const response = await fetch(process.env.HEARTBEAT_URL || 'https://www.google.com', {
        method: 'HEAD',
        timeout: 5000,
      })
      return response.ok
    } catch (error) {
      return false
    }
  }
  
  // For browser environments
  // First check the navigator.onLine property (fast but not always reliable)
  if (!navigator.onLine) {
    return false
  }
  
  // For more reliable check, try to fetch a small resource
  try {
    // Try to fetch from our own API first
    const fetchPromise = fetch('/api/health-check', { 
      method: 'HEAD',
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' }
    })
    
    // Set a timeout to prevent long waits
    const timeoutPromise = new Promise<Response>((_, reject) => {
      setTimeout(() => reject(new Error('Timeout')), 3000)
    })
    
    // Race the fetch against the timeout
    await Promise.race([fetchPromise, timeoutPromise])
    return true
  } catch (error) {
    // If our own API fails, try a public service as fallback
    try {
      const response = await fetch('https://www.google.com/generate_204', {
        method: 'HEAD',
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      })
      return response.ok
    } catch {
      return false
    }
  }
}

/**
 * Start monitoring network connectivity with periodic checks
 * @param intervalMs How often to check connectivity (default: 30 seconds)
 */
export const startNetworkMonitoring = (intervalMs = 30000) => {
  if (!isBrowser) return // Only run in browser environment

  // Initial check
  isOnline().then(online => {
    if (_isOnline !== online) {
      _isOnline = online
      networkEvents.emit('statusChange', online)
    }
  })
  
  // Listen to browser online/offline events
  window.addEventListener('online', () => checkAndEmitChange())
  window.addEventListener('offline', () => checkAndEmitChange())
  
  // Set up periodic checking
  const interval = setInterval(checkAndEmitChange, intervalMs)
  
  // Helper to check status and emit events on change
  async function checkAndEmitChange() {
    const online = await isOnline()
    if (_isOnline !== online) {
      _isOnline = online
      networkEvents.emit('statusChange', online)
      
      // Also dispatch a custom event for components to listen to
      if (isBrowser) {
        window.dispatchEvent(new CustomEvent('networkStatusChange', { 
          detail: { online } 
        }))
      }
      
      // Log the change
      console.log(`Network status changed: ${online ? 'ONLINE' : 'OFFLINE'}`)
    }
  }
  
  // Cleanup function
  return () => {
    clearInterval(interval)
    if (isBrowser) {
      window.removeEventListener('online', checkAndEmitChange)
      window.removeEventListener('offline', checkAndEmitChange)
    }
  }
}
