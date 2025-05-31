import nodemailer from 'nodemailer';

// Configure the email transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
  port: parseInt(process.env.SMTP_PORT || '2525'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASSWORD || '',
  },
});

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
  attachments?: Array<{
    filename: string;
    content?: Buffer;
    path?: string;
    contentType?: string;
  }>;
}

/**
 * Send an email using the configured SMTP server
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    const { to, subject, html, from, attachments } = options;
    
    const mailOptions = {
      from: from || `Sierra Leone Health Service <${process.env.SMTP_FROM_EMAIL || 'noreply@mohs.gov.sl'}>`,
      to,
      subject,
      html,
      attachments,
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
}

/**
 * Generate a welcome email for new patients
 */
export function generatePatientWelcomeEmail(patient: {
  firstName: string;
  lastName: string;
  medicalNumber: string;
  email: string;
}): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Welcome to Sierra Leone Health Service</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
        }
        .header {
          background-color: #0052cc;
          padding: 20px;
          text-align: center;
          color: white;
        }
        .logo {
          max-width: 100px;
          margin-bottom: 15px;
        }
        .content {
          padding: 20px;
          background-color: #f9f9f9;
        }
        .footer {
          padding: 15px;
          text-align: center;
          font-size: 12px;
          background-color: #f1f1f1;
          color: #666;
        }
        .button {
          display: inline-block;
          background-color: #0052cc;
          color: white;
          padding: 12px 20px;
          text-decoration: none;
          border-radius: 4px;
          margin: 20px 0;
          font-weight: bold;
        }
        .card-preview {
          background-color: #f1f1f1;
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 15px;
          margin: 20px 0;
        }
        .benefits {
          background-color: #e6f7ff;
          border-left: 4px solid #0052cc;
          padding: 15px;
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <img src="https://mohs.gov.sl/wp-content/uploads/2021/08/MOHS-Logo.png" alt="Ministry of Health and Sanitation" class="logo">
        <h1>Welcome to Sierra Leone Health Service</h1>
      </div>
      
      <div class="content">
        <p>Dear ${patient.firstName} ${patient.lastName},</p>
        
        <p>Thank you for registering with the Sierra Leone Health Service. Your registration has been successfully processed, and we are pleased to welcome you to our healthcare system.</p>
        
        <p><strong>Your Medical Number:</strong> ${patient.medicalNumber}</p>
        
        <p>Your Health ID Card has been issued and is available in your patient dashboard. This digital card serves as your official identification within the Sierra Leone Health Service network.</p>
        
        <div class="card-preview">
          <p><strong>Your Health ID Card Information</strong></p>
          <p>Name: ${patient.firstName} ${patient.lastName}</p>
          <p>Medical Number: ${patient.medicalNumber}</p>
          <p>Website: https://mohs.gov.sl/</p>
        </div>
        
        <div class="benefits">
          <h3>Benefits of Your Health ID Card:</h3>
          <ul>
            <li>Quick access to healthcare services across Sierra Leone</li>
            <li>Streamlined appointment scheduling</li>
            <li>Centralized medical records accessible by authorized healthcare providers</li>
            <li>Reduced wait times at healthcare facilities</li>
            <li>Access to special health programs and initiatives</li>
          </ul>
        </div>
        
        <p>To access your dashboard and view your Health ID Card, please click the button below:</p>
        
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/patient/dashboard" class="button">Access Your Dashboard</a>
        
        <p>If you have any questions or need assistance, please do not hesitate to contact our support team at <a href="mailto:support@mohs.gov.sl">support@mohs.gov.sl</a>.</p>
        
        <p>We wish you good health and look forward to serving you.</p>
        
        <p>Sincerely,<br>Sierra Leone Health Service Team</p>
      </div>
      
      <div class="footer">
        <p>Ministry of Health and Sanitation, Sierra Leone</p>
        <p>Website: <a href="https://mohs.gov.sl/">https://mohs.gov.sl/</a></p>
        <p>&copy; ${new Date().getFullYear()} Sierra Leone Health Service. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;
}
