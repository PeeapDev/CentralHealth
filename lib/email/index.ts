import nodemailer from 'nodemailer';

// Email configuration - Using settings directly from environment variables
const getEmailConfig = () => {
  // We'll use nodemailer's test account for development if no valid credentials
  if (process.env.NODE_ENV === 'development' && (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD)) {
    console.log('No valid SMTP credentials found, using test account for development');
    return null; // Will trigger test account creation
  }
  
  console.log('SMTP Configuration:', {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER,
  });
  
  return {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '465'),
    secure: process.env.SMTP_SECURE === 'true', // SSL
    auth: {
      user: process.env.SMTP_USER || 'pay.peeap@gmail.com',
      pass: process.env.SMTP_PASSWORD // We'll handle fallback in createTransport
    },
    from: process.env.SMTP_FROM_EMAIL || 'pay.peeap@gmail.com'
  };
};

// Create transport using environment variables or test account for development
export const createTransport = async () => {
  const config = getEmailConfig();
  
  // If no valid config (development mode without credentials), create a test account
  if (!config) {
    try {
      console.log('Creating Ethereal test email account...');
      const testAccount = await nodemailer.createTestAccount();
      console.log('Test account created:', testAccount.user);
      return nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
    } catch (error) {
      console.error('Failed to create test account:', error);
      // Fall back to a simple transport that will log but not send
      return {
        sendMail: (options: any) => {
          console.log('MOCK EMAIL:', options);
          return Promise.resolve({ messageId: 'mock-' + Date.now() });
        }
      } as any;
    }
  }
  
  // Use real SMTP configuration
  console.log('Creating email transport with host:', config.host, 'port:', config.port);
  return nodemailer.createTransport(config);
};

interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: any[];
  from?: string;
}

/**
 * Send an email using the configured transport
 * @param options Email options including to, subject, text/html body
 * @returns Promise with the send result
 */
export const sendEmail = async (options: EmailOptions): Promise<EmailResult> => {
  try {
    console.log('Sending email to:', options.to);
    const transport = await createTransport();
    
    const config = getEmailConfig();
    const mailOptions = {
      from: options.from || (config?.from || 'Hospital Management System <pay.peeap@gmail.com>'),
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
      cc: options.cc,
      bcc: options.bcc,
      attachments: options.attachments
    };

    console.log('Sending email with options:', {
      to: mailOptions.to,
      subject: mailOptions.subject,
      from: mailOptions.from
    });

    const info = await transport.sendMail(mailOptions);
    console.log('Email sent successfully, ID:', info.messageId);
    
    // Log email preview URL for Ethereal test emails
    if (process.env.NODE_ENV === 'development') {
      const testMessageUrl = nodemailer.getTestMessageUrl(info);
      if (testMessageUrl) {
        console.log('Preview URL: ' + testMessageUrl);
      }
    }
    
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error('Error sending email:', error);
    
    // Special handling for Gmail authentication errors
    if (error.code === 'EAUTH' && error.response?.includes('BadCredentials')) {
      console.error(
        '🔒 Gmail authentication failed. This could be due to:',
        '\n1. Incorrect username/password',
        '\n2. Less secure app access is disabled',
        '\n3. You need to use an App Password instead',
        '\nTry creating an App Password: https://myaccount.google.com/apppasswords'
      );
      
      // For development, still provide a success response so testing can continue
      if (process.env.NODE_ENV === 'development') {
        console.log('💡 Development mode: Simulating successful email send despite authentication error');
        return { success: true, messageId: 'dev-mock-' + Date.now() };
      }
    }
    
    return { success: false, error };
  }
};

/**
 * Send a welcome email to a new hospital administrator
 * @param email Administrator's email
 * @param name Administrator's name
 * @param password Initial password
 * @param hospitalName Hospital name
 * @param loginUrl Login URL
 */
export const sendWelcomeEmail = async (
  email: string,
  name: string,
  password: string,
  hospitalName: string,
  loginUrl: string
) => {
  const subject = `Welcome to ${hospitalName} on MediCore Hospital System`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #2563eb; padding: 20px; text-align: center; color: white;">
        <h1 style="margin: 0;">Welcome to MediCore</h1>
      </div>
      <div style="padding: 20px; border: 1px solid #e5e7eb; border-top: none;">
        <p>Hello ${name},</p>
        <p>Your administrator account for <strong>${hospitalName}</strong> has been created.</p>
        <p>You can log in using the following credentials:</p>
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Password:</strong> ${password}</p>
          <p><small>Please change your password after your first login.</small></p>
        </div>
        <p><a href="${loginUrl}" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Login to your account</a></p>
        <p>If you have any questions or need assistance, please contact the system administrator.</p>
        <p>Best regards,<br>MediCore Hospital System</p>
      </div>
      <div style="background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280;">
        <p>&copy; ${new Date().getFullYear()} MediCore Hospital System. All rights reserved.</p>
      </div>
    </div>
  `;

  const text = `
    Welcome to MediCore Hospital System
    
    Hello ${name},
    
    Your administrator account for ${hospitalName} has been created.
    
    You can log in using the following credentials:
    Email: ${email}
    Password: ${password}
    
    Please change your password after your first login.
    
    Login URL: ${loginUrl}
    
    If you have any questions or need assistance, please contact the system administrator.
    
    Best regards,
    MediCore Hospital System
  `;

  return sendEmail({ to: email, subject, html, text });
};

/**
 * Send a password reset email
 */
export const sendPasswordResetEmail = async (
  email: string,
  name: string,
  resetToken: string,
  resetUrl: string
) => {
  const subject = 'MediCore Hospital System - Password Reset';
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #2563eb; padding: 20px; text-align: center; color: white;">
        <h1 style="margin: 0;">Password Reset</h1>
      </div>
      <div style="padding: 20px; border: 1px solid #e5e7eb; border-top: none;">
        <p>Hello ${name},</p>
        <p>We received a request to reset your password.</p>
        <p>Please click the button below to reset your password:</p>
        <p style="text-align: center;">
          <a href="${resetUrl}?token=${resetToken}" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
        </p>
        <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
        <p>This link will expire in 60 minutes.</p>
        <p>Best regards,<br>MediCore Hospital System</p>
      </div>
      <div style="background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280;">
        <p>&copy; ${new Date().getFullYear()} MediCore Hospital System. All rights reserved.</p>
      </div>
    </div>
  `;

  const text = `
    MediCore Hospital System - Password Reset
    
    Hello ${name},
    
    We received a request to reset your password.
    
    Please visit the following URL to reset your password:
    ${resetUrl}?token=${resetToken}
    
    If you didn't request a password reset, please ignore this email or contact support if you have concerns.
    
    This link will expire in 60 minutes.
    
    Best regards,
    MediCore Hospital System
  `;

  return sendEmail({ to: email, subject, html, text });
};

/**
 * Check if SMTP is properly configured
 * @returns Promise<boolean> True if SMTP is configured, false otherwise
 */
export const isSmtpConfigured = async (): Promise<boolean> => {
  // Check if required SMTP environment variables are set
  const required = ['EMAIL_HOST', 'EMAIL_PORT', 'EMAIL_USER', 'EMAIL_PASSWORD'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.log(`SMTP not fully configured. Missing: ${missing.join(', ')}`);
    return false;
  }
  
  try {
    // Try to create a transport to validate configuration
    const transport = await createTransport();
    const verification = await transport.verify();
    return verification;
  } catch (error) {
    console.error('SMTP configuration verification failed:', error);
    return false;
  }
};

/**
 * Send admin credentials to a newly created hospital admin
 */
interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: any;
}

export const sendAdminCredentials = async (options: {
  hospitalName: string;
  adminEmail: string;
  adminName?: string;
  adminPassword: string;
  hospitalSubdomain: string;
  baseUrl?: string;
}): Promise<EmailResult> => {
  const {
    hospitalName,
    adminEmail,
    adminName = 'Hospital Administrator',
    adminPassword,
    hospitalSubdomain,
    baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  } = options;
  
  // Construct the login URL for the hospital subdomain
  const loginUrl = `${baseUrl}/${hospitalSubdomain}/auth/login`;
  
  return sendWelcomeEmail(
    adminEmail,
    adminName,
    adminPassword,
    hospitalName,
    loginUrl
  );
};
