import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * POST /api/patients/logout
 * Logs out a patient by clearing their authentication token cookie
 */
export async function POST() {
  try {
    // Clear the auth token cookie
    cookies().delete('token');
    
    // Return success response
    return NextResponse.json({ 
      success: true,
      message: 'Successfully logged out'
    });
  } catch (error) {
    console.error('Error during logout:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Logout failed'
    }, { status: 500 });
  }
}
