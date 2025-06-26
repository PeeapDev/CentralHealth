import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function GET(request: Request) {
  // Check if email service is configured
  const hasEmailConfig = !!(
    process.env.EMAIL_SERVER_HOST &&
    process.env.EMAIL_SERVER_PORT &&
    process.env.EMAIL_SERVER_USER &&
    process.env.EMAIL_SERVER_PASSWORD &&
    process.env.EMAIL_FROM
  );

  // Create a simpler response for the client
  return NextResponse.json({
    emailServiceConfigured: hasEmailConfig,
    config: {
      host: process.env.EMAIL_SERVER_HOST ? '[configured]' : '[missing]',
      port: process.env.EMAIL_SERVER_PORT ? '[configured]' : '[missing]',
      user: process.env.EMAIL_SERVER_USER ? '[configured]' : '[missing]',
      password: process.env.EMAIL_SERVER_PASSWORD ? '[configured]' : '[missing]',
      from: process.env.EMAIL_FROM ? '[configured]' : '[missing]',
    }
  });
}

// Verify email service functionality for real patient communications
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { recipientEmail } = body;
    
    if (!recipientEmail) {
      return NextResponse.json({ 
        success: false, 
        message: 'Please provide a valid patient email address' 
      }, { status: 400 });
    }

    // Check if email service is configured
    if (!process.env.EMAIL_SERVER_HOST ||
        !process.env.EMAIL_SERVER_PORT ||
        !process.env.EMAIL_SERVER_USER ||
        !process.env.EMAIL_SERVER_PASSWORD ||
        !process.env.EMAIL_FROM) {
      
      return NextResponse.json({ 
        success: false, 
        message: 'Email service not fully configured', 
        missingEnvVars: {
          host: !process.env.EMAIL_SERVER_HOST,
          port: !process.env.EMAIL_SERVER_PORT,
          user: !process.env.EMAIL_SERVER_USER,
          password: !process.env.EMAIL_SERVER_PASSWORD,
          from: !process.env.EMAIL_FROM,
        }
      }, { status: 400 });
    }
    
    // Create a test transport
    const transport = nodemailer.createTransport({
      host: process.env.EMAIL_SERVER_HOST,
      port: parseInt(process.env.EMAIL_SERVER_PORT),
      secure: process.env.EMAIL_SERVER_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD
      }
    });
    
    // Verify the transport is working
    await transport.verify();
    console.log('Email transport verification successful');
    
    // Send a verification email
    const info = await transport.sendMail({
      from: process.env.EMAIL_FROM,
      to: recipientEmail,
      subject: 'CentralHealth System - Email Service Verification',
      html: `
        <h2>CentralHealth System</h2>
        <p>This email confirms that the hospital email system is working properly.</p>
        <p>You have received this email as part of a verification of our email service.</p>
        <p>No action is required on your part.</p>
      `
    });
    
    return NextResponse.json({
      success: true,
      message: 'Verification email sent successfully',
      emailDetails: {
        messageId: info.messageId,
        to: recipientEmail
      }
    });
    
  } catch (error: any) {
    console.error('Email test failed:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to send verification email',
      error: error.message,
      stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined
    }, { status: 500 });
  }
}
