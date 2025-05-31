import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, otp } = body;
    
    // Basic validation
    if (!phone || !otp) {
      return NextResponse.json({ 
        success: false, 
        error: 'Phone number and verification code are required' 
      }, { status: 400 });
    }
    
    // For demo purposes, we'll accept code 123456
    // In a production environment, you would validate against a stored OTP in a database
    if (otp === "123456") {
      return NextResponse.json({
        success: true,
        message: 'Phone number verified successfully'
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Invalid verification code'
      }, { status: 400 });
    }
    
  } catch (error) {
    console.error('Phone verification error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to verify phone number'
    }, { status: 500 });
  }
}
