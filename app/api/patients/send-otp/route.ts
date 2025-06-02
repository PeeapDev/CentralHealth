import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email/index'; // Keep for fallback
import { prisma } from '@/lib/prisma';
import nodemailer from 'nodemailer';
import fs from 'fs/promises';
import path from 'path';

// Path to SMTP settings file
const SMTP_SETTINGS_FILE = path.join(process.cwd(), 'smtp-settings.json');

// Get SMTP settings from file
async function getSmtpSettings() {
  try {
    // Check if the settings file exists
    const data = await fs.readFile(SMTP_SETTINGS_FILE, 'utf8');
    const smtpConfig = JSON.parse(data);
    
    if (!smtpConfig.enabled) {
      throw new Error('SMTP is disabled in system settings');
    }
    
    return smtpConfig;
  } catch (error) {
    console.error('Failed to load SMTP settings from file:', error);
    return null;
  }
}

// Create nodemailer transporter using settings file
async function createFileBasedTransporter() {
  try {
    const settings = await getSmtpSettings();
    
    if (!settings) {
      console.log('No valid SMTP settings found in file, falling back to env vars');
      return null;
    }
    
    console.log('Using SMTP settings from file:', { 
      host: settings.host,
      port: settings.port,
      secure: settings.encryption === 'ssl',
      user: settings.username
    });
    
    return nodemailer.createTransport({
      host: settings.host,
      port: parseInt(settings.port),
      secure: settings.encryption === 'ssl',
      auth: {
        user: settings.username,
        pass: settings.password,
      },
      tls: {
        // Do not fail on invalid certs
        rejectUnauthorized: false,
      },
    });
  } catch (error) {
    console.error('Error creating transporter:', error);
    return null;
  }
}

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
    
    // Generate a random 5-digit OTP
    const otp = Math.floor(10000 + Math.random() * 90000).toString();
    
    // Store the OTP in the database with expiration time (15 minutes)
    const expiryTime = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now
    
    if (type === 'phone') {
      // In production, you would use an SMS service like Twilio, Africa's Talking, etc.
      console.log(`Sending OTP ${otp} to phone: ${value}`);
      // For now, we'll just log it
    } else {
      // Send real email using the SMTP functionality
      const subject = 'Central Health - Email Verification Code';
      
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #10b981; padding: 20px; text-align: center; color: white;">
            <h1 style="margin: 0;">Email Verification</h1>
          </div>
          <div style="padding: 20px; border: 1px solid #e5e7eb; border-top: none;">
            <p>Hello,</p>
            <p>Thank you for registering with Central Health. To verify your email address, please use the following verification code:</p>
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0; text-align: center;">
              <p style="font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 0;">${otp}</p>
            </div>
            <p>This code will expire in 15 minutes.</p>
            <p>If you did not request this verification, please ignore this email.</p>
            <p>Best regards,<br>Central Health Team</p>
          </div>
          <div style="background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280;">
            <p>&copy; ${new Date().getFullYear()} Central Health. All rights reserved.</p>
          </div>
        </div>
      `;

      const text = `
        Central Health - Email Verification Code
        
        Hello,
        
        Thank you for registering with Central Health. To verify your email address, please use the following verification code:
        
        ${otp}
        
        This code will expire in 15 minutes.
        
        If you did not request this verification, please ignore this email.
        
        Best regards,
        Central Health Team
      `;

      console.log(`Attempting to send email to: ${value} with OTP: ${otp}`);
      
      try {
        // Try to use the file-based SMTP settings first (the one that works for hospital emails)
        const fileTransporter = await createFileBasedTransporter();
        let emailSent = false;
        
        if (fileTransporter) {
          try {
            // Get settings for from address
            const settings = await getSmtpSettings();
            const fromEmail = settings?.fromEmail || 'no-reply@centralhealth.com';
            const fromName = settings?.fromName || 'Central Health';
            
            console.log(`Sending OTP email using file-based SMTP config to ${value}`);
            const info = await fileTransporter.sendMail({
              from: `"${fromName}" <${fromEmail}>`,
              to: value,
              subject,
              text,
              html
            });
            
            console.log('Email sent successfully with file-based config, ID:', info.messageId);
            emailSent = true;
          } catch (smtpError) {
            console.error('Error sending email with file-based config:', smtpError);
            // We'll try the fallback method next
          }
        }
        
        // If file-based method failed, try the environment variable method as fallback
        if (!emailSent) {
          console.log('Falling back to environment variable based email config');
          const emailResult = await sendEmail({ to: value, subject, html, text });
          console.log('Fallback email send result:', emailResult);
          
          if (!emailResult.success) {
            console.error('Failed to send email with fallback method:', emailResult.error);
            
            // In development mode, we'll simulate success even if email sending fails
            if (process.env.NODE_ENV === 'development') {
              console.log('Development mode: simulating successful email despite errors');
            } else {
              return NextResponse.json({ 
                success: false, 
                error: 'Failed to send email verification code', 
                details: emailResult.error 
              }, { status: 500 });
            }
          }
        }
      } catch (error) {
        console.error('Exception while sending email:', error);
        
        // In development mode, continue despite errors
        if (process.env.NODE_ENV !== 'development') {
          return NextResponse.json({ 
            success: false, 
            error: 'Exception occurred while sending email verification code', 
            details: error 
          }, { status: 500 });
        }
      }
    }
    
    // Store the OTP in the database for verification later
    try {
      if (type === 'email') {
        // Use the existing EmailVerification model for email OTPs
        await prisma.emailVerification.upsert({
          where: {
            email: value
          },
          update: {
            code: otp,
            expires: expiryTime,
            verified: false,
            attempts: 0 // Reset attempts on resend
          },
          create: {
            email: value,
            code: otp,
            expires: expiryTime,
            verified: false,
            attempts: 0
          }
        });
      } else {
        // For phone verification, we'd need a different approach
        // Currently just simulating for phone
        console.log(`Stored OTP ${otp} for phone: ${value} (expires: ${expiryTime})`);
      }
    } catch (error) {
      console.error('Error storing OTP:', error);
      // Continue anyway - we'll handle this in verification
    }
    
    return NextResponse.json({
      success: true,
      message: `Verification code sent to your ${type}`,
      // In production, don't send back the OTP in the response
      // In development mode only, send back the OTP for testing
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
