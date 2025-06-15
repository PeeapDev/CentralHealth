import { NextRequest, NextResponse } from 'next/server';
import { signToken, verifyToken } from '@/lib/auth/jwt';
import { prisma } from '@/lib/prisma';

/**
 * Mobile token refresh endpoint
 * Used by the Flutter mobile app to refresh access tokens
 * Returns new tokens in the response body
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { refreshToken } = body;

    // Basic validation
    if (!refreshToken) {
      return NextResponse.json({ 
        error: 'Refresh token is required' 
      }, { status: 400 });
    }
    
    // Verify the refresh token
    const payload = await verifyToken(refreshToken);
    if (!payload) {
      console.log('Invalid refresh token');
      return NextResponse.json({ error: 'Invalid or expired refresh token' }, { status: 401 });
    }
    
    // Find the user in the database
    const user = await prisma.user.findUnique({
      where: {
        id: payload.userId
      },
      include: {
        hospital: {
          select: {
            id: true,
            name: true,
            subdomain: true
          }
        }
      }
    });
    
    if (!user) {
      console.log(`User not found with id: ${payload.userId}`);
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }
    
    // Generate new tokens
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      // Ensure hospitalId is always a string as required by JWTPayload
      hospitalId: user.hospitalId || ''
    };
    
    // JWT expiration is configured in the JWT module with a default of 7d
    const newAccessToken = await signToken(tokenPayload);
    const newRefreshToken = await signToken(tokenPayload); // Using the same expiry time for simplicity
    
    console.log(`Generated new tokens for user: ${user.email}`);
    
    // Return the tokens in the response body
    return NextResponse.json({
      access_token: newAccessToken,
      refresh_token: newRefreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        hospital: user.hospital ? {
          id: user.hospital.id,
          name: user.hospital.name,
          subdomain: user.hospital.subdomain
        } : null
      }
    });
    
  } catch (error) {
    console.error('Error during token refresh:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
