/**
 * Sync Status Indicator
 * 
 * Displays the current network and sync status with appropriate visuals.
 * This component shows:
 * - Online/offline status
 * - Pending changes count
 * - Sync progress
 * - Last sync time
 */

'use client'

import { useState, useEffect } from 'react'
import { WifiOff, Wifi, RotateCw, Check, AlertCircle, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SyncStatusProps {
  className?: string
  showDetails?: boolean
}

export function SyncStatusIndicator({ className, showDetails = false }: SyncStatusProps) {
  // State for network and sync status
  const [isOnline, setIsOnline] = useState(true)
  const [syncStatus, setSyncStatus] = useState({
    pendingChanges: 0,
    syncInProgress: false,
    lastSuccessfulSync: null as Date | null,
    hasErrors: false
  })
  
  // Periodically check network and sync status
  useEffect(() => {
    // Function to check online status
    const checkNetworkStatus = async () => {
      // Quick client-side check
      const online = navigator.onLine
      
      if (online !== isOnline) {
        setIsOnline(online)
      }
      
      // More reliable check through API
      try {
        const response = await fetch('/api/health-check', { 
          method: 'HEAD',
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' }
        })
        
        if (response.ok !== isOnline) {
          setIsOnline(response.ok)
        }
      } catch {
        if (isOnline) {
          setIsOnline(false)
        }
      }
    }
    
    // Function to get sync status
    const getSyncStatus = async () => {
      try {
        const response = await fetch('/api/sync/status')
        if (response.ok) {
          const data = await response.json()
          setSyncStatus({
            pendingChanges: data.pendingChanges || 0,
            syncInProgress: data.syncInProgress || false,
            lastSuccessfulSync: data.lastSuccessfulSync ? new Date(data.lastSuccessfulSync) : null,
            hasErrors: data.syncErrors > 0
          })
        }
      } catch {
        // If we can't reach the API, assume we're offline
        if (isOnline) setIsOnline(false)
      }
    }
    
    // Initial check
    checkNetworkStatus()
    getSyncStatus()
    
    // Listen for network status events
    const handleNetworkChange = () => {
      setIsOnline(navigator.onLine)
    }
    
    window.addEventListener('online', handleNetworkChange)
    window.addEventListener('offline', handleNetworkChange)
    
    // Listen for custom sync events
    window.addEventListener('networkStatusChange', (e: any) => {
      setIsOnline(e.detail?.online ?? navigator.onLine)
    })
    
    // Set up polling interval
    const networkInterval = setInterval(checkNetworkStatus, 60000) // every minute
    const syncInterval = setInterval(getSyncStatus, 30000) // every 30 seconds
    
    // Cleanup
    return () => {
      window.removeEventListener('online', handleNetworkChange)
      window.removeEventListener('offline', handleNetworkChange)
      clearInterval(networkInterval)
      clearInterval(syncInterval)
    }
  }, [isOnline])
  
  // Format last sync time
  const formatLastSync = () => {
    if (!syncStatus.lastSuccessfulSync) return 'Never'
    
    // If it's today, show time, otherwise show date
    const now = new Date()
    const today = now.toDateString()
    const syncDate = syncStatus.lastSuccessfulSync.toDateString()
    
    if (today === syncDate) {
      return `Today at ${syncStatus.lastSuccessfulSync.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    } else {
      return syncStatus.lastSuccessfulSync.toLocaleDateString()
    }
  }
  
  // Trigger manual sync
  const handleSyncNow = async () => {
    if (!isOnline || syncStatus.syncInProgress) return
    
    try {
      await fetch('/api/sync/trigger', { method: 'POST' })
      // We'll let the polling update the status
    } catch (error) {
      console.error('Failed to trigger sync:', error)
    }
  }
  
  // Decide what icon to show
  const getIcon = () => {
    if (!isOnline) {
      return <WifiOff size={16} className="text-amber-500" />
    }
    
    if (syncStatus.syncInProgress) {
      return <RotateCw size={16} className="animate-spin text-blue-500" />
    }
    
    if (syncStatus.pendingChanges > 0) {
      return <Clock size={16} className="text-amber-500" />
    }
    
    if (syncStatus.hasErrors) {
      return <AlertCircle size={16} className="text-red-500" />
    }
    
    return <Check size={16} className="text-green-500" />
  }
  
  // Simple version (just icon)
  if (!showDetails) {
    return (
      <div className={cn("flex items-center gap-1", className)} title={isOnline ? 'Online' : 'Offline'}>
        {getIcon()}
        <span className="text-xs font-medium">
          {!isOnline 
            ? 'Offline' 
            : syncStatus.syncInProgress 
              ? 'Syncing...' 
              : syncStatus.pendingChanges > 0 
                ? `${syncStatus.pendingChanges} pending` 
                : 'Synced'}
        </span>
      </div>
    )
  }
  
  // Detailed version with more information and sync button
  return (
    <div className={cn("rounded-md border p-3", className)}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {isOnline ? (
            <Wifi size={18} className="text-green-500" />
          ) : (
            <WifiOff size={18} className="text-amber-500" />
          )}
          <h3 className="font-medium">{isOnline ? 'Online' : 'Offline'}</h3>
        </div>
        
        <button
          onClick={handleSyncNow}
          disabled={!isOnline || syncStatus.syncInProgress}
          className={cn(
            "rounded-md px-2 py-1 text-xs font-medium",
            isOnline && !syncStatus.syncInProgress 
              ? "bg-blue-100 text-blue-700 hover:bg-blue-200" 
              : "bg-gray-100 text-gray-400 cursor-not-allowed"
          )}
        >
          {syncStatus.syncInProgress ? (
            <span className="flex items-center gap-1">
              <RotateCw size={12} className="animate-spin" />
              Syncing...
            </span>
          ) : (
            'Sync Now'
          )}
        </button>
      </div>
      
      <div className="text-xs text-gray-500 space-y-1">
        <div className="flex justify-between">
          <span>Pending changes:</span>
          <span className={syncStatus.pendingChanges > 0 ? "text-amber-600 font-medium" : ""}>
            {syncStatus.pendingChanges}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Last synced:</span>
          <span>{formatLastSync()}</span>
        </div>
        {syncStatus.hasErrors && (
          <div className="text-red-500 flex items-center gap-1 mt-1">
            <AlertCircle size={12} />
            <span>Sync errors detected</span>
          </div>
        )}
      </div>
    </div>
  )
}
