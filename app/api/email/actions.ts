'use server';

import nodemailer from 'nodemailer';
import { format } from 'date-fns';

// Define interfaces here to avoid import issues with client/server modules
export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: any;
}

interface WelcomeEmailData {
  email: string;
  firstName: string;
  lastName: string;
  gender?: string;
  medicalId: string;
  healthAddress: string;
}

// Fetch SMTP settings from the admin panel API
async function fetchAdminSMTPSettings() {
  try {
    // Try to fetch from your admin settings API
    const response = await fetch('http://localhost:3002/api/settings/smtp', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store', // Prevent caching
    });
    
    if (!response.ok) {
      throw new Error(`Admin API returned ${response.status}`);
    }
    
    const settings = await response.json();
    console.log('Successfully fetched SMTP settings from admin panel');
    
    if (!settings.host || !settings.port || !settings.username || !settings.password || !settings.fromEmail) {
      console.error('Incomplete SMTP settings from admin panel');
      return null;
    }
    
    // Gmail specific handling - Gmail requires secure:true for port 465
    const isGmail = settings.host.includes('gmail.com');
    const port = parseInt(settings.port);
    const isSSL = settings.encryption === 'ssl' || settings.encryption === 'SSL';

    // For Gmail on port 465, always use secure:true
    const secure = isGmail && port === 465 ? true : isSSL;
    
    return {
      host: settings.host,
      port: port,
      secure: secure,
      auth: {
        user: settings.username,
        pass: settings.password
      },
      from: settings.fromEmail
    };
  } catch (error) {
    console.error('Failed to fetch admin SMTP settings:', error);
    return null;
  }
}

// Create a transport for sending email
async function createEmailTransport() {
  const config = await fetchAdminSMTPSettings();
  
  if (!config) {
    console.error('No valid SMTP configuration available');
    return null;
  }
  
  // Create nodemailer transport with the config
  try {
    const transport = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.auth.user,
        pass: config.auth.pass
      },
      // Add better timeout settings and TLS options
      connectionTimeout: 10000, // 10 seconds
      greetingTimeout: 10000,
      socketTimeout: 15000,
      tls: {
        rejectUnauthorized: false
      }
    });

    return { transport, config };
  } catch (error) {
    console.error('Failed to create email transport:', error);
    return null;
  }
}

export async function sendWelcomeEmail(data: WelcomeEmailData): Promise<EmailResult> {
  try {
    const transportData = await createEmailTransport();
    if (!transportData) {
      return { success: false, error: 'No email transport available - check SMTP settings in admin panel' };
    }
    
    const { transport, config } = transportData;
    
    // Format data for the email template
    const hospitalName = "Sierra Leone National Health Service";
    const fullName = `${data.firstName} ${data.lastName}`;
    const title = data.gender === "female" ? "Ms." : data.gender === "male" ? "Mr." : "";
    const greeting = title ? `Dear ${title}` : "Dear";
    const greetingMessage = `${greeting} ${data.lastName}`;
    
    // Send the email
    const info = await transport.sendMail({
      from: `${hospitalName} <${config.from}>`,
      to: data.email,
      subject: `Welcome to ${hospitalName}`,
      text: `
        ${greetingMessage},
        
        Thank you for registering with ${hospitalName}. Your registration is complete.
        
        Here is a summary of your details:
        - Full Name: ${fullName}
        - Medical ID: ${data.medicalId}
        - Health Address: ${data.healthAddress}
        
        Please keep your Medical ID safe as you will need it for all future interactions with our hospital.
        
        If you have any questions or need assistance, please contact our support team.
        
        Regards,
        ${hospitalName} Team
      `,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 0;">
          <div style="display: flex; padding: 10px; align-items: center; background-color: #f8f9fa; border-bottom: 1px solid #dee2e6;">
            <div style="width: 30px; height: 30px; border-radius: 50%; background-color: #6c757d; display: flex; align-items: center; justify-content: center; margin-right: 10px;">
              <span style="color: white; font-size: 14px;">SL</span>
            </div>
            <div>
              <div style="font-weight: bold;">${hospitalName}</div>
              <div style="font-size: 12px; color: #6c757d;">Registration Complete</div>
            </div>
          </div>
          
          <div style="padding: 20px;">
            <h2 style="color: #0d6efd; text-align: center; margin-top: 20px; margin-bottom: 20px;">${hospitalName}</h2>
            
            <p>${greetingMessage},</p>
            
            <p>Thank you for registering with the ${hospitalName}. Your registration is now complete.</p>
            
            <div style="background-color: #f8f9fa; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <p style="font-weight: bold; margin-bottom: 10px;">Your Medical Number</p>
              <div style="background-color: white; padding: 10px; font-size: 20px; font-weight: bold;">${data.medicalId}</div>
            </div>
            
            <div style="background-color: #f8f9fa; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <h3 style="margin-top: 0; margin-bottom: 10px; font-size: 16px;">Your Registration Details</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;"><strong>Full Name:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;">${fullName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;"><strong>Health Address:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;">${data.healthAddress}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;"><strong>Email Address:</strong></td>
                  <td style="padding: 8px 0;">${data.email}</td>
                </tr>
              </table>
            </div>
            
            <p>Please keep your Medical ID safe as you will need it for all future interactions with our hospital.</p>
            
            <p style="color: #6c757d; font-size: 14px;">If you have any questions or need assistance, please contact our support team.</p>
            
            <p>Regards,<br>${hospitalName}</p>
          </div>
        </div>
      `
    });
    
    // Log successful email delivery
    console.log('Patient welcome email sent successfully:', info.messageId);
    
    return {
      success: true,
      messageId: info.messageId
    };
  } catch (error) {
    console.error("Patient welcome email sending failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
