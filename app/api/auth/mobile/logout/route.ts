import { NextRequest, NextResponse } from 'next/server';

/**
 * Mobile-optimized logout endpoint
 * Used by the Flutter mobile app to logout users
 */
export async function POST(request: NextRequest) {
  try {
    // For mobile clients, there's no need to clear cookies as tokens are stored in the app
    // We just confirm the logout was successful
    
    console.log('Mobile client logout');
    
    return NextResponse.json({
      success: true,
      message: 'Successfully logged out'
    });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ 
      error: 'Logout failed' 
    }, { status: 500 });
  }
}
