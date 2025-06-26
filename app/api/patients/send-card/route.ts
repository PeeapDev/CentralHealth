import { NextRequest, NextResponse } from 'next/server';
import { isValidMedicalID } from '../../../../utils/medical-id';

// Mock function to simulate connecting to an email service
// In production, replace this with a real email service like SendGrid, Mailgun, AWS SES, etc.
async function sendEmailWithAttachment(to: string, subject: string, htmlContent: string, attachmentData: string) {
  // In production, this would be an actual API call to an email service
  // For example, using SendGrid:
  // const msg = {
  //   to: to,
  //   from: 'noreply@sierraleonehealth.org',
  //   subject: subject,
  //   html: htmlContent,
  //   attachments: [
  //     {
  //       content: attachmentData.split('base64,')[1],
  //       filename: 'medical-card.pdf',
  //       type: 'application/pdf',
  //       disposition: 'attachment'
  //     }
  //   ]
  // };
  // await sgMail.send(msg);
  
  // For demo, we'll just log the email details
  console.log('SENDING EMAIL:');
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`HTML Content Length: ${htmlContent.length} characters`);
  console.log(`Attachment Data Length: ${attachmentData.length} characters`);
  
  // Check if email settings are configured in superadmin dashboard
  // In production, you would read this from the database or environment variables
  const emailSettingsConfigured = true;
  
  if (!emailSettingsConfigured) {
    throw new Error('Email settings not configured in superadmin dashboard');
  }
  
  // Simulate successful email sending
  return { success: true };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, medicalNumber, cardImage } = body;
    
    // Basic validation
    if (!email || !name || !medicalNumber || !cardImage) {
      return NextResponse.json({ 
        success: false, 
        error: 'Email, name, medical number, and card image are required' 
      }, { status: 400 });
    }
    
    // Validate medical ID format 
    if (!isValidMedicalID(medicalNumber)) {
      console.error(`Invalid medical ID format detected in card send request: ${medicalNumber}`);
      return NextResponse.json({
        success: false,
        error: 'Invalid medical ID format. Medical ID must contain both letters and numbers.'
      }, { status: 400 });
    }
    
    // Additional explicit check for all-letter medical IDs (safety net)
    if (/^[A-Za-z]+$/.test(medicalNumber)) {
      console.error(`All-letter medical ID rejected in card send request: ${medicalNumber}`);
      return NextResponse.json({
        success: false,
        error: 'Invalid medical ID format. Medical ID must contain both letters and numbers.'
      }, { status: 400 });
    }
    
    // Create HTML email content
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #1a56db; color: white; padding: 15px; text-align: center; }
          .content { padding: 20px; border: 1px solid #eaeaea; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Sierra Leone National Health Service</h1>
          </div>
          <div class="content">
            <h2>Welcome to our Healthcare System, ${name}!</h2>
            <p>Thank you for registering with the Sierra Leone National Health Service. Your registration has been completed successfully.</p>
            <p><strong>Your Medical Number is: ${medicalNumber}</strong></p>
            <p>Please keep this number for your records as you will need it for all future appointments and services.</p>
            <p>Your medical card is attached to this email. You can print it or save it to your mobile device to show when visiting our facilities.</p>
            <p>If you have any questions, please contact our support team.</p>
          </div>
          <div class="footer">
            <p>This is an automated message, please do not reply to this email.</p>
            <p>&copy; ${new Date().getFullYear()} Sierra Leone National Health Service</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    // Send email with attachment
    try {
      await sendEmailWithAttachment(
        email,
        'Your Sierra Leone NHS Medical Card',
        htmlContent,
        cardImage
      );
      
      return NextResponse.json({
        success: true,
        message: `Medical card sent to ${email}`
      });
    } catch (emailError: any) {
      console.error('Email sending error:', emailError);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to send email. ' + (emailError.message || 'Unknown error')
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('Send medical card error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to send medical card'
    }, { status: 500 });
  }
}
