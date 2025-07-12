import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getAuth } from '@/lib/auth';

/**
 * Authentication middleware for API routes
 * Ensures consistent authentication handling across all API routes
 * Following CentralHealth System rules for secure authentication
 */
export async function withAuth(
  req: NextRequest,
  handler: (req: NextRequest, session: any) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    // Get authentication from request
    const authResult = await getAuth(req);
    
    if (!authResult.authenticated || !authResult.user) {
      // Return 401 Unauthorized if not authenticated
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Call the handler with the authenticated session
    return await handler(req, authResult.user);
  } catch (error) {
    console.error('Authentication error:', error);
    
    // Return 500 Internal Server Error for unexpected errors
    return NextResponse.json(
      { error: 'Internal server error during authentication' },
      { status: 500 }
    );
  }
}
