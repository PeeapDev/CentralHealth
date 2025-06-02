import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import nodemailer from 'nodemailer';

// Email verification code expiry time (10 minutes)
const VERIFICATION_EXPIRY_MINUTES = 10;

// Generate a random OTP code
function generateOTP(length = 6) {
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += Math.floor(Math.random() * 10);
  }
  return otp;
}

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
    
    // Check if email is already registered
    const existingPatient = await prisma.patient.findFirst({
      where: { email },
    });
    
    if (existingPatient) {
      return NextResponse.json({ 
        success: false, 
        error: 'Email address is already registered' 
      }, { status: 400 });
    }
    
    // Generate a 6-digit OTP
    const otp = generateOTP(6);
    const expiryTime = new Date();
    expiryTime.setMinutes(expiryTime.getMinutes() + VERIFICATION_EXPIRY_MINUTES);
    
    // Store the OTP in a temporary verification table
    // We'll use prisma's upsert to update if the email already has a pending verification
    await prisma.emailVerification.upsert({
      where: { email },
      update: {
        code: otp,
        expires: expiryTime,
        attempts: 0
      },
      create: {
        email,
        code: otp,
        expires: expiryTime,
        attempts: 0
      }
    });
    
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
    
    // Send verification email
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
    
    // Return success without exposing the actual OTP in the response
    return NextResponse.json({
      success: true,
      message: 'Verification code sent to email address',
      expiresIn: VERIFICATION_EXPIRY_MINUTES * 60 // in seconds
    });
    
  } catch (error) {
    console.error('Error sending verification email:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to send verification email' 
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
