/**
 * API route for triggering manual synchronization
 */

import { NextRequest, NextResponse } from 'next/server'
import { synchronize } from '@/lib/database/sync-service'
import { verifyAuth } from '@/lib/auth'
import { isOnline } from '@/lib/database/network-status'

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request)
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Check online status
    const online = await isOnline()
    if (!online) {
      return NextResponse.json({ 
        success: false, 
        error: 'Device is offline' 
      }, { status: 503 })
    }
    
    // Trigger sync process
    const success = await synchronize()
    
    if (success) {
      return NextResponse.json({ 
        success: true, 
        message: 'Synchronization started successfully' 
      })
    } else {
      return NextResponse.json({ 
        success: false, 
        error: 'Sync is already in progress or failed to start' 
      }, { status: 409 })
    }
  } catch (error) {
    console.error('Error triggering sync:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to trigger synchronization' 
    }, { status: 500 })
  }
}
