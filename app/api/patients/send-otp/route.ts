import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  let type = 'unknown';
  
  try {
    const body = await request.json();
    type = body.type || 'unknown';
    const value = body.value;
    
    // Basic validation
    if (!type || !value) {
      return NextResponse.json({ 
        success: false, 
        error: 'Type and value are required' 
      }, { status: 400 });
    }
    
    if (type !== 'phone' && type !== 'email') {
      return NextResponse.json({ 
        success: false, 
        error: 'Type must be either "phone" or "email"' 
      }, { status: 400 });
    }
    
    // For demo purposes, we'll simulate sending an OTP
    // In production, you would generate a random OTP, store it in the database with an expiration time,
    // and send it via SMS or email
    
    // Simulate a random OTP (in demo, we'll always use 123456)
    const otp = "123456";
    
    // Simulate sending the OTP
    if (type === 'phone') {
      // In production, you would use an SMS service like Twilio, Africa's Talking, etc.
      console.log(`Sending OTP ${otp} to phone: ${value}`);
    } else {
      // In production, you would use an email service like SendGrid, Mailgun, etc.
      console.log(`Sending OTP ${otp} to email: ${value}`);
    }
    
    return NextResponse.json({
      success: true,
      message: `Verification code sent to your ${type}`,
      // In production, don't send back the OTP in the response
      demo_otp: process.env.NODE_ENV === 'development' ? otp : undefined
    });
    
  } catch (error) {
    console.error('Send OTP error:', error);
    return NextResponse.json({ 
      success: false, 
      error: `Failed to send verification code to ${type}`
    }, { status: 500 });
  }
}
