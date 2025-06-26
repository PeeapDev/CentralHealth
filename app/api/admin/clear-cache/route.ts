import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

// Clear server-side cache API endpoint for administrators
export async function POST(req: NextRequest) {
  try {
    // Security check - in production you should validate admin credentials
    // This is just a placeholder - add proper authentication middleware
    
    const results = {
      nextCache: false,
      sessionCache: false,
      items: [] as string[]
    };
    
    // Path to Next.js cache
    const nextCachePath = path.join(process.cwd(), '.next', 'cache');
    
    // Clear Next.js cache if exists
    if (fs.existsSync(nextCachePath)) {
      try {
        // We don't remove the entire .next directory as it would require rebuilding
        // Instead clear specific cache directories
        const cacheSubdirs = ['fetch-cache', 'data-cache', 'server-components'];
        
        for (const subdir of cacheSubdirs) {
          const subdirPath = path.join(nextCachePath, subdir);
          if (fs.existsSync(subdirPath)) {
            // Read and clear files instead of removing directory
            const files = fs.readdirSync(subdirPath);
            for (const file of files) {
              const filePath = path.join(subdirPath, file);
              if (!file.startsWith('.') && fs.statSync(filePath).isFile()) {
                fs.unlinkSync(filePath);
                results.items.push(`${subdir}/${file}`);
              }
            }
          }
        }
        
        results.nextCache = true;
      } catch (error) {
        console.error('Error clearing Next.js cache:', error);
      }
    }
    
    // Return success with details of what was cleared
    return NextResponse.json({
      success: true,
      message: 'Cache cleared successfully',
      results
    });
  } catch (error) {
    console.error('Error in clear-cache API:', error);
    return NextResponse.json(
      { error: 'Failed to clear cache' },
      { status: 500 }
    );
  }
}
