/**
 * API route for getting the current sync status
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSyncStatus, countPendingChanges } from '@/lib/database/sync-service'
import { isOnline } from '@/lib/database/network-status'
import { verifyAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request)
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Get current online status
    const online = await isOnline()
    
    // Get current sync stats and update pending count
    const syncStatus = getSyncStatus()
    const pendingCount = await countPendingChanges()
    
    return NextResponse.json({
      ...syncStatus,
      online,
      pendingChanges: pendingCount,
      serverTime: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error getting sync status:', error)
    return NextResponse.json({ error: 'Failed to get sync status' }, { status: 500 })
  }
}
