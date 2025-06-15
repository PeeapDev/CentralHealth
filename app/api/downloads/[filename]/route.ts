import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs'
import { downloadDataForOfflineUse } from '@/lib/database/sync-service'
import { isOnline } from '@/lib/database/network-status'

/**
 * Simple authorization verification function
 * This handles checking authentication tokens for API routes
 */
async function verifyAuth(request: NextRequest): Promise<{ success: boolean; user?: { id: string; role?: string } }> {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { success: false }
    }
    
    // For demonstration purposes only - not actual auth
    const userId = request.nextUrl.searchParams.get('userId') || 'demo-user-id'
    const role = request.nextUrl.searchParams.get('role') || 'doctor'
    
    return {
      success: true,
      user: { id: userId, role }
    }
  } catch (error) {
    console.error('Auth verification error:', error)
    return { success: false }
  }
}

// Define CDN configuration (can be moved to environment variables)
const CDN_ENABLED = process.env.USE_CDN === 'true'
const CDN_BASE_URL = process.env.CDN_BASE_URL || 'https://cdn.medicore.example.com'

// Map of content types based on file extensions
const contentTypeMap: Record<string, string> = {
  '.exe': 'application/octet-stream',
  '.dmg': 'application/x-apple-diskimage',
  '.deb': 'application/vnd.debian.binary-package',
  '.zip': 'application/zip',
  '.json': 'application/json',
  '.sql': 'application/sql',
  '.db': 'application/octet-stream',
}

/**
 * GET handler for file downloads
 * Handles both installer downloads and data downloads
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    // Get the filename from the route params
    const { filename } = params
    const fileExtension = path.extname(filename)

    // Check if this is an app installer or data download
    const isAppInstaller = ['.exe', '.dmg', '.deb'].includes(fileExtension)
    
    // Authentication check for data downloads
    if (!isAppInstaller) {
      const authResult = await verifyAuth(request)
      if (!authResult.success) {
        return NextResponse.json(
          { error: 'Authentication required for data downloads' },
          { status: 401 }
        )
      }
    }

    // If using CDN for installer files, redirect
    if (isAppInstaller && CDN_ENABLED) {
      const cdnUrl = `${CDN_BASE_URL}/downloads/${filename}`
      return NextResponse.redirect(cdnUrl, { status: 302 })
    }
    
    // For app installers, serve the file directly
    if (isAppInstaller) {
      const filePath = path.join(process.cwd(), 'public', 'downloads', filename)
      
      // Check if file exists
      try {
        await fs.promises.access(filePath, fs.constants.F_OK)
      } catch (e) {
        return NextResponse.json(
          { error: `File not found: ${filename}` },
          { status: 404 }
        )
      }
      
      // Get file stats for headers
      const stats = await fs.promises.stat(filePath)
      
      // Read the file
      const fileBuffer = await fs.promises.readFile(filePath)
      
      // Return file with appropriate headers
      return new NextResponse(fileBuffer, {
        status: 200,
        headers: {
          'Content-Type': contentTypeMap[fileExtension] || 'application/octet-stream',
          'Content-Length': stats.size.toString(),
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Last-Modified': stats.mtime.toUTCString(),
          'Cache-Control': 'public, max-age=604800', // Cache for 1 week
        },
      })
    } else {
      // For data downloads, connect to sync service
      const online = await isOnline()
      
      if (!online) {
        return NextResponse.json(
          { error: 'Cannot download data while offline' },
          { status: 503 }
        )
      }
      
      // Extract user information from auth result for selective data download
      const authResult = await verifyAuth(request)
      const userId = authResult.user?.id || ''
      const role = authResult.user?.role
      
      if (!userId) {
        return NextResponse.json(
          { error: 'User ID required for data download' },
          { status: 400 }
        )
      }
      
      // Start the data download process
      const downloadType = request.nextUrl.searchParams.get('type') || 'full'
      const includeHistory = request.nextUrl.searchParams.get('history') === 'true'
      const targetPath = request.nextUrl.searchParams.get('path')
      
      // Call sync service to prepare data download
      const downloadResult = await downloadDataForOfflineUse({
        userId,
        userRole: role,
        downloadType,
        includeHistory,
        targetPath: targetPath || undefined,
      })
      
      // Check if downloadResult contains a file path to serve
      if (downloadResult.success && downloadResult.filePath) {
        try {
          const stats = await fs.promises.stat(downloadResult.filePath)
          const fileBuffer = await fs.promises.readFile(downloadResult.filePath)
          
          return new NextResponse(fileBuffer, {
            status: 200,
            headers: {
              'Content-Type': contentTypeMap['.db'] || 'application/octet-stream',
              'Content-Length': stats.size.toString(),
              'Content-Disposition': `attachment; filename="offline-data-${downloadType}-${new Date().toISOString().split('T')[0]}.db"`,
            },
          })
        } catch (error) {
          console.error('File read error:', error)
          return NextResponse.json(
            { error: 'Failed to read generated file', details: (error instanceof Error) ? error.message : 'Unknown error' },
            { status: 500 }
          )
        }
      }
      
      // If no immediate file, return job status
      return NextResponse.json(
        { 
          success: downloadResult.success,
          message: downloadResult.error || 'Data download initiated',
          downloadType,
          jobId: downloadResult.jobId,
          estimatedSize: downloadResult.estimatedSize,
          estimatedTimeSeconds: downloadResult.estimatedTimeSeconds || 0,
          status: 'processing',
        },
        { status: downloadResult.success ? 202 : 500 } // 202 Accepted if processing, 500 if error
      )
    }
  } catch (error) {
    console.error('Download error:', error)
    return NextResponse.json(
      { error: 'Download failed', details: (error instanceof Error) ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * OPTIONS handler for CORS preflight requests
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  })
}

/**
 * HEAD handler to check if a file is available
 */
export async function HEAD(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const { filename } = params
    const isAppInstaller = ['.exe', '.dmg', '.deb'].includes(path.extname(filename))
    
    if (!isAppInstaller) {
      // For data files, check online status and auth
      const online = await isOnline()
      if (!online) {
        return new NextResponse(null, { status: 503 })
      }
      
      const authResult = await verifyAuth(request)
      if (!authResult.success) {
        return new NextResponse(null, { status: 401 })
      }
    }
    
    // For installer files, just check if they exist
    if (isAppInstaller) {
      if (CDN_ENABLED) {
        // If using CDN, assume file exists
        return new NextResponse(null, { status: 200 })
      }
      
      const filePath = path.join(process.cwd(), 'public', 'downloads', filename)
      try {
        await fs.promises.access(filePath, fs.constants.F_OK)
        return new NextResponse(null, { status: 200 })
      } catch (e) {
        return new NextResponse(null, { status: 404 })
      }
    }
    
    return new NextResponse(null, { status: 200 })
  } catch (error) {
    return new NextResponse(null, { status: 500 })
  }
}
