import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';

/**
 * Mobile-optimized token verification endpoint
 * Used by the Flutter mobile app to verify JWT tokens
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    // Verify JWT token
    const payload = await verifyToken(token);
    
    if (!payload) {
      return NextResponse.json({ valid: false, error: 'Invalid token' }, { status: 401 });
    }

    // Return success with user information
    return NextResponse.json({
      valid: true,
      user: {
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
        hospitalId: payload.hospitalId
      }
    });
  } catch (error) {
    console.error('Token verification error:', error);
    return NextResponse.json({ 
      valid: false, 
      error: 'Token verification failed' 
    }, { status: 401 });
  }
}
