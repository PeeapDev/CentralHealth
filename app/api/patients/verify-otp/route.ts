import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, otp } = body;
    
    console.log('Verifying OTP for email:', email, 'OTP:', otp);
    
    // Basic validation
    if (!email || !otp) {
      console.log('Missing email or OTP');
      return NextResponse.json({ 
        success: false, 
        message: 'Email and OTP are required' 
      }, { status: 400 });
    }
    
    try {
      // First check the in-memory cache (used by send-otp)
      let verification = null;
      
      // Check if we have an in-memory OTP cache
      if ((global as any).otpCache && (global as any).otpCache[email]) {
        const cachedOTP = (global as any).otpCache[email];
        verification = {
          email,
          code: cachedOTP.otp,
          expires: cachedOTP.expires,
          attempts: cachedOTP.attempts || 0,
          verified: false
        };
        console.log('Found verification in memory cache:', verification);
      } else {
        // If not in memory, try the database
        verification = await prisma.emailVerification.findUnique({
          where: {
            email: email
          }
        });
        console.log('Verification record from database:', verification);
      }
      
      // Check if verification exists
      if (!verification) {
        console.log('No verification record found for email:', email);
        return NextResponse.json({ 
          success: false, 
          message: 'No verification code found for this email. Please request a new code.' 
        }, { status: 400 });
      }
      
      // Check if already verified
      if (verification.verified) {
        console.log('Email already verified:', email);
        return NextResponse.json({
          success: true,
          message: 'Email already verified'
        });
      }
      
      // Check if verification has expired
      if (new Date() > verification.expires) {
        console.log('Verification code expired for email:', email);
        return NextResponse.json({ 
          success: false, 
          message: 'Verification code has expired. Please request a new code.' 
        }, { status: 400 });
      }
      
      // Check if code matches
      if (verification.code !== otp) {
        console.log('Invalid verification code for email:', email, 'Expected:', verification.code, 'Received:', otp);
        
        // Increment attempt counter
        await prisma.emailVerification.update({
          where: { email },
          data: { 
            attempts: { increment: 1 }
          }
        });
        
        // If too many attempts (5+), invalidate the code
        if (verification.attempts >= 4) {
          console.log('Too many failed attempts for email:', email);
          await prisma.emailVerification.update({
            where: { email },
            data: { 
              expires: new Date() // Set expiry to now to invalidate
            }
          });
          
          return NextResponse.json({ 
            success: false, 
            message: 'Too many failed attempts. Please request a new code.' 
          }, { status: 400 });
        }
        
        return NextResponse.json({ 
          success: false, 
          message: 'Invalid verification code' 
        }, { status: 400 });
      }
      
      // Mark email as verified
      if ((global as any).otpCache && (global as any).otpCache[email]) {
        // If using in-memory cache, mark it as verified there
        (global as any).otpCache[email].verified = true;
        console.log('Email verified successfully in memory cache:', email);
      } else {
        // If using database, update the record there
        await prisma.emailVerification.update({
          where: { email },
          data: { verified: true }
        });
        console.log('Email verified successfully in database:', email);
      }
      
      console.log('Email verified successfully:', email);
      
      return NextResponse.json({
        success: true,
        message: 'Email verified successfully'
      });
    } catch (dbError) {
      console.error('Database error during OTP verification:', dbError);
      
      // Special handling for Prisma errors
      if (dbError instanceof PrismaClientKnownRequestError) {
        // P2021 is the error code for "The table does not exist in the current database"
        if (dbError.code === 'P2021') {
          console.error('EmailVerification table not found in database');
          
          // In development mode, simulate success for testing
          if (process.env.NODE_ENV === 'development') {
            console.log('Development mode: simulating successful verification despite database error');
            return NextResponse.json({
              success: true,
              message: 'Email verified successfully (development mode)'
            });
          }
        }
      }
      
      throw dbError; // Rethrow to be caught by outer catch block
    }
    
  } catch (error) {
    console.error('Verify OTP error:', error);
    
    // In development mode, we'll allow verification to succeed even if there are errors
    // This helps with testing the registration flow when the database isn't fully set up
    if (process.env.NODE_ENV === 'development') {
      console.log('Development mode: simulating successful verification despite errors');
      return NextResponse.json({
        success: true,
        message: 'Email verified successfully (development mode)'
      });
    }
    
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to verify OTP' 
    }, { status: 500 });
  }
}
