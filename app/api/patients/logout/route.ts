import { NextResponse } from 'next/server';

/**
 * POST /api/patients/logout
 * Logs out a patient by clearing their authentication token cookies
 */
export async function POST() {
  try {
    // Create response with cookies cleared
    const response = NextResponse.json({ 
      success: true,
      message: 'Successfully logged out',
      redirectUrl: '/' // Redirect to landing page
    });
    
    // Clear all auth cookies by setting expired date
    response.cookies.set('token', '', { 
      expires: new Date(0),
      path: '/' 
    });
    
    response.cookies.set('patient_session', '', { 
      expires: new Date(0),
      path: '/' 
    });
    
    return response;
  } catch (error) {
    console.error('Error during logout:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Logout failed'
    }, { status: 500 });
  }
}
