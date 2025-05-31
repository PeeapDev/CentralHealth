import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// API endpoint to handle forgot password requests
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { medicalNumber, email } = body;

    console.log('Forgot password request received:', { medicalNumber, hasEmail: !!email });

    // Validate inputs
    if (!medicalNumber && !email) {
      return NextResponse.json(
        { success: false, message: 'Medical number or email is required' },
        { status: 400 }
      );
    }

    // Build query based on provided information
    const whereClause: any = {};
    if (medicalNumber) {
      whereClause.medicalNumber = medicalNumber;
    } else if (email) {
      whereClause.email = email;
    }

    // Try to find the patient
    const patient = await prisma.patient.findFirst({
      where: whereClause,
      select: {
        id: true,
        medicalNumber: true,
        email: true,
        name: true
      }
    });

    // If patient not found
    if (!patient) {
      console.log('Patient not found for password reset');
      // Always return success to prevent account enumeration attacks
      return NextResponse.json(
        { 
          success: true, 
          message: 'If a matching account is found, password reset instructions will be sent' 
        },
        { status: 200 }
      );
    }

    // Generate a temporary reset code (in a real app, we'd send this via email)
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const resetExpiration = new Date();
    resetExpiration.setHours(resetExpiration.getHours() + 1); // 1 hour expiration

    // Save the reset code to the patient record
    await prisma.patient.update({
      where: { id: patient.id },
      data: {
        resetCode: { set: resetCode },
        resetExpiration: { set: resetExpiration }
      }
    });

    console.log(`Reset code generated for patient ${patient.medicalNumber}: ${resetCode}`);

    // In a real application, send the reset code via email
    // For demo purposes, we'll return it directly (NEVER do this in production)
    return NextResponse.json(
      { 
        success: true, 
        message: 'Password reset instructions have been sent',
        // Only include debug info in development
        ...(process.env.NODE_ENV !== 'production' && {
          debug: {
            resetCode: resetCode,
            patient: {
              medicalNumber: patient.medicalNumber,
              email: patient.email
            }
          }
        })
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error in forgot password:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred processing your request' },
      { status: 500 }
    );
  }
}
