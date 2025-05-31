import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, otp } = body;
    
    // Basic validation
    if (!email || !otp) {
      return NextResponse.json({ 
        success: false, 
        error: 'Email address and verification code are required' 
      }, { status: 400 });
    }
    
    // For demo purposes, we'll accept code 123456
    // In a production environment, you would validate against a stored OTP in a database
    if (otp === "123456") {
      return NextResponse.json({
        success: true,
        message: 'Email address verified successfully'
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Invalid verification code'
      }, { status: 400 });
    }
    
  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to verify email address'
    }, { status: 500 });
  }
}
