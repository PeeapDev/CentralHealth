import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// API endpoint to handle password reset
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { medicalNumber, resetCode, newPassword } = body;

    console.log('Password reset request received:', { medicalNumber, resetCodeProvided: !!resetCode });

    // Validate inputs
    if (!medicalNumber || !resetCode || !newPassword) {
      return NextResponse.json(
        { success: false, message: 'Medical number, reset code, and new password are required' },
        { status: 400 }
      );
    }

    // Find the patient with matching medical number and reset code
    const patient = await prisma.patient.findFirst({
      where: {
        medicalNumber: medicalNumber,
        // Use Prisma's string equality operation for resetCode
        resetCode: {
          equals: resetCode
        },
        // Check if the reset code hasn't expired
        resetExpiration: {
          gt: new Date()
        }
      }
    });

    // If patient not found or reset code is invalid or expired
    if (!patient) {
      console.log('Invalid or expired reset code');
      return NextResponse.json(
        { success: false, message: 'Invalid or expired reset code' },
        { status: 400 }
      );
    }

    // Update patient's password and clear reset code
    await prisma.patient.update({
      where: { id: patient.id },
      data: {
        password: newPassword, // In production, this should be hashed
        // Set these fields to null to clear the reset code
        resetCode: { set: null },
        resetExpiration: { set: null }
      }
    });

    console.log(`Password reset successful for patient ${patient.medicalNumber}`);

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
