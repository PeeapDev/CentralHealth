import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

// Import patient data utilities for consistent contact handling using ES Module syntax
import { parseContactJson, createPatientContact } from '@/lib/patient-data-utils';

// API endpoint to handle password reset
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { medicalNumber, token, newPassword, resetId } = body;

    console.log('Password reset request received:', { medicalNumber, resetId, tokenProvided: !!token });

    // Validate inputs
    if (!resetId || !token || !newPassword) {
      return NextResponse.json(
        { success: false, message: 'Reset ID, token, and new password are required' },
        { status: 400 }
      );
    }
    
    // Validate password strength
    if (newPassword.length < 8) {
      return NextResponse.json(
        { success: false, message: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Find the password reset record using type assertion for Prisma client
    // Using type assertion since passwordReset may not be directly defined in the Prisma type
    const passwordReset = await (prisma as any).passwordReset.findUnique({
      where: {
        id: resetId
      },
      include: {
        patient: {
          select: {
            id: true,
            mrn: true,
            name: true,
            contact: true
          }
        }
      }
    });

    // If reset record not found or patient not found
    if (!passwordReset || !passwordReset.patient) {
      console.log('Password reset record or patient not found');
      return NextResponse.json(
        { success: false, message: 'Invalid reset request' },
        { status: 400 }
      );
    }

    // Get patient from the relationship
    const patient = passwordReset.patient;
    
    // Validate token, expiration, and usage
    const now = new Date();
    const isExpired = passwordReset.expiresAt < now;
    const isAlreadyUsed = !!passwordReset.usedAt;
    const isValidToken = passwordReset.token === token;
    
    if (!isValidToken || isExpired || isAlreadyUsed) {
      console.log('Invalid, expired, or already used reset token');
      return NextResponse.json(
        { success: false, message: 'Invalid or expired reset link' },
        { status: 400 }
      );
    }

    // Hash the new password securely using bcrypt to maintain consistency
    // with the login system's password verification
    const salt = await bcrypt.genSalt(10);
    // Hash password using bcrypt - this automatically includes the salt in the hash
    const passwordHash = await bcrypt.hash(newPassword, salt);
    
    // Log success without revealing the password (just for debugging)
    console.log('Password hashed successfully using bcrypt');
    
    // Extract current patient contact data using standardized utility
    // This ensures consistent handling of patient contact data across the system
    console.log('Processing patient contact information for password update');
    let contactData = {};
    try {
      contactData = parseContactJson(patient.contact);
      console.log('Successfully parsed contact data using patient-data-utils');
    } catch (e) {
      console.error('Failed to parse contact data:', e);
      // Initialize an empty object if parsing fails
      contactData = {};
    }
    
    // Password will be added directly using createPatientContact
    // in the update operation below
    
    // Mark the token as used by setting usedAt
    // Using type assertion for Prisma client
    await (prisma as any).passwordReset.update({
      where: { id: resetId },
      data: {
        usedAt: new Date()
      }
    });
    
    // Update patient's password using standardized contact format
    // This ensures the password is stored consistently with other contact info
    // Generate a request ID for logging purposes
    const requestId = uuidv4().substring(0, 8);
    
    // Create updated contact with new password
    const updatedContact = createPatientContact({
      ...contactData,
      password: passwordHash
    });

    try {
      // Update the patient record with the new password
      await prisma.patient.update({
        where: { id: patient.id },
        data: {
          contact: JSON.stringify(updatedContact) // Store as JSON string for Prisma
        }
      });
      
      console.log(`[${requestId}] Patient password updated successfully for MRN: ${patient.mrn}`);
    } catch (updateError) {
      console.error(`[${requestId}] Failed to update patient password:`, updateError);
      throw new Error('Failed to update password in patient record');
    }

    console.log(`Password reset successful for patient ${patient.mrn}`);

    return NextResponse.json(
      { 
        success: true, 
        message: 'Password has been reset successfully' 
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error in reset password:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred processing your request' },
      { status: 500 }
    );
  }
}
