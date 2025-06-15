import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import nodemailer from 'nodemailer';

const VERIFICATION_EXPIRY_MINUTES = 10;

// Generate a random OTP code
function generateOTP(length = 6) {
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += Math.floor(Math.random() * 10);
  }
  return otp;
}

// POST endpoint to send verification code
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;
    
    // Basic validation
    if (!email) {
      return NextResponse.json({ 
        success: false, 
        error: 'Email address is required' 
      }, { status: 400 });
    }
    
    // Generate a 6-digit OTP
    const otp = generateOTP(6);
    const expiryTime = new Date();
    expiryTime.setMinutes(expiryTime.getMinutes() + VERIFICATION_EXPIRY_MINUTES);
    
    // Store the OTP in the verification codes object (in-memory storage for simplicity)
    // In a production app, you would use a database
    const verificationCodes = global as any;
    if (!verificationCodes.otpCodes) {
      verificationCodes.otpCodes = {};
    }
    
    verificationCodes.otpCodes[email] = {
      code: otp,
      expires: expiryTime
    };
    
    console.log(`Storing verification code for ${email}:`, verificationCodes.otpCodes[email]);
    
    // Email configuration
    const emailConfig = {
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER || 'your-email@gmail.com',
        pass: process.env.EMAIL_PASSWORD || 'your-app-specific-password'
      }
    };
    
    // For testing/demo purposes, we can log the OTP instead of actually sending it
    console.log(`DEMO MODE: Verification code for ${email} is ${otp}`);
    
    // In a real app, we would send the email
    // Uncomment this in production
    /*
    const transporter = nodemailer.createTransport(emailConfig);
    const emailResult = await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'Central Health <no-reply@centralhealth.org>',
      to: email,
      subject: 'Verify your email address',
      text: `Your verification code is: ${otp}. It will expire in ${VERIFICATION_EXPIRY_MINUTES} minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #4a6cf7;">Verify Your Email Address</h2>
          <p>Thank you for registering with Central Health. To complete your registration, please use the verification code below:</p>
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 4px; text-align: center; font-size: 24px; letter-spacing: 5px; font-weight: bold; margin: 20px 0;">
            ${otp}
          </div>
          <p>This code will expire in ${VERIFICATION_EXPIRY_MINUTES} minutes.</p>
          <p>If you didn't request this verification, please ignore this email.</p>
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #666;">
            <p>Central Health - Your Health, Our Priority</p>
          </div>
        </div>
      `
    });
    console.log('Email sent:', emailResult);
    */
    
    // Return success with the verification code in development (remove in production)
    return NextResponse.json({
      success: true,
      message: 'Verification code sent to email address',
      expiresIn: VERIFICATION_EXPIRY_MINUTES * 60, // in seconds
      code: otp // Remove this in production
    });
    
  } catch (error) {
    console.error('Error sending verification email:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to send verification email' 
    }, { status: 500 });
  }
}

// PUT endpoint to verify the OTP
export async function PUT(request: NextRequest) {
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
    
    // Verify against stored OTP from our new cache implementation
    const otpCache = (global as any).otpCache || {};
    const storedData = otpCache[email];
    
    console.log(`Verifying code for ${email}:`, { 
      provided: otp, 
      stored: storedData?.otp,
      expires: storedData?.expires
    });
    
    if (!storedData) {
      return NextResponse.json({
        success: false,
        error: 'No verification code found for this email. Please request a new one.'
      }, { status: 400 });
    }
    
    // Check if code is expired
    if (new Date() > new Date(storedData.expires)) {
      return NextResponse.json({
        success: false,
        error: 'Verification code has expired. Please request a new one.'
      }, { status: 400 });
    }
    
    // Check if code matches
    if (storedData.otp !== otp) {
      // Increment attempt counter
      storedData.attempts++;
      
      // If too many attempts, invalidate the code
      if (storedData.attempts >= 3) {
        delete (global as any).otpCache[email];
        return NextResponse.json({
          success: false,
          error: 'Too many failed attempts. Please request a new code.'
        }, { status: 400 });
      }
      
      return NextResponse.json({
        success: false,
        error: 'Invalid verification code'
      }, { status: 400 });
    }
    
    // Code is valid - mark as verified
    delete (global as any).otpCache[email]; // Clean up after successful verification
    
    return NextResponse.json({
      success: true,
      message: 'Email address verified successfully'
    });
    
  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to verify email address'
    }, { status: 500 });
  }
}
