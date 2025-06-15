'use client'

import { useEffect } from 'react'
import { startNetworkMonitoring } from '@/lib/database/network-status'
import { initializeSyncService } from '@/lib/database/sync-service'
import { SyncStatusIndicator } from '../ui/sync-status-indicator'

interface SyncProviderProps {
  children: React.ReactNode
}

/**
 * SyncProvider component initializes offline syncing functionality
 * and makes sync status available throughout the app
 */
export function SyncProvider({ children }: SyncProviderProps) {
  // Initialize network monitoring and sync service
  useEffect(() => {
    // Check environment variables
    const syncInterval = parseInt(process.env.NEXT_PUBLIC_SYNC_CHECK_INTERVAL || '300000', 10)
    
    // Start network monitoring
    const cleanupMonitoring = startNetworkMonitoring(syncInterval)
    
    // Initialize sync service
    const cleanupSync = initializeSyncService(syncInterval)
    
    // Cleanup on unmount
    return () => {
      cleanupMonitoring?.()
      cleanupSync?.()
    }
  }, [])
  
  return (
    <>
      {children}
      <div className="fixed bottom-4 right-4 z-50">
        <SyncStatusIndicator />
      </div>
    </>
  )
}
