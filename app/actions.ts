'use server';

import { sendVerificationEmail, sendPatientWelcomeEmail } from "@/lib/email/index";

/**
 * Server action to send verification OTP email
 * This isolates the nodemailer functionality to the server
 */
export async function sendOTPEmail(email: string, otp: string, firstName: string, lastName: string, gender: string, medicalId?: string) {
  console.log(`✉️ Server Action: Sending OTP ${otp} to ${email} for ${firstName} ${lastName}`);
  
  try {
    // For debugging - mark the start time
    const startTime = Date.now();
    console.log(`📧 [${new Date().toISOString()}] Starting email send process to ${email}`);
    
    // This starts the email sending process in a more reliable way
    // We'll await just long enough to catch immediate errors
    const emailPromise = sendVerificationEmail({
      email,
      otp,
      firstName,
      lastName,
      gender,
      medicalId,
      hospitalName: "Sierra Leone National Health Service"
    });
    
    // Set a timeout to wait just a short while for the email to send
    // This gives us a chance to catch immediate failures without blocking the UI too long
    const timeoutPromise = new Promise<{success: boolean, messageId: string}>(resolve => setTimeout(() => {
      console.log(`⏱️ Email timeout reached after ${Date.now() - startTime}ms - continuing with UI flow`);
      resolve({ success: true, messageId: 'timeout' });
    }, 1000)); // 1 second timeout
    
    // Race the promises so we either get the quick email result or the timeout
    const result = await Promise.race([emailPromise, timeoutPromise]);
    
    if (result.messageId === 'timeout') {
      // If we timed out, log that the email is still being sent in background
      console.log(`📧 Email to ${email} is still sending in background...`);
      
      // Continue the email sending in the background without awaiting
      emailPromise.then(finalResult => {
        console.log(`✅ Background email finally sent after ${Date.now() - startTime}ms:`, finalResult);
      }).catch(error => {
        console.error(`❌ Background email failed after ${Date.now() - startTime}ms:`, error);
      });
    } else {
      // Email sent quickly enough
      console.log(`✅ Email sent successfully in ${Date.now() - startTime}ms:`, result);
    }
    
    // Return immediately with the OTP so the UI isn't blocked
    // Email will continue sending in the background if it hasn't completed
    return { 
      success: true, 
      messageId: result.messageId || 'pending', 
      otp, 
      message: 'OTP code displayed while email is being sent' 
    };
  } catch (error) {
    console.error("❌ Email preparation failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      otp
    };
  }
}

/**
 * Server action to send welcome email with patient registration summary
 */
export async function sendWelcomeRegistrationEmail(patientData: any) {
  const { email, firstName, lastName, gender, medicalId, birthDate } = patientData;
  
  console.log(`Server Action: Sending welcome email to ${email} for ${firstName} ${lastName}`);
  
  try {
    // Send welcome email with patient details and medical ID
    const result = await sendPatientWelcomeEmail({
      email,
      firstName,
      lastName,
      gender,
      medicalId,
      birthDate,
      hospitalName: "Sierra Leone National Health Service"
    });
    
    console.log('Welcome email sent successfully from server action:', result);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error("Welcome email sending failed from server action:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
