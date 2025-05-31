import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { serialize } from 'cookie';

// Helper function to generate JWT token
function generateToken(patient: any) {
  const jwtSecret = process.env.JWT_SECRET || 'fallback_secret_for_development';
  
  return jwt.sign(
    {
      id: patient.id,
      medicalNumber: patient.medicalNumber,
      email: patient.email,
      role: 'patient', // Role for authorization
    },
    jwtSecret,
    {
      expiresIn: '7d', // Token expires in 7 days
    }
  );
}

// Email verification endpoint
export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const body = await req.json();
    
    // Validate required fields
    if (!body.verificationCode || !body.medicalNumber) {
      return NextResponse.json({
        success: false,
        error: 'Verification code and medical number are required',
      }, { status: 400 });
    }
    
    // Find the patient by medical number
    const patient = await prisma.patient.findUnique({
      where: {
        medicalNumber: body.medicalNumber,
      },
    });
    
    // If patient doesn't exist
    if (!patient) {
      return NextResponse.json({
        success: false,
        error: 'Patient not found with this medical number',
      }, { status: 404 });
    }
    
    // Check verification code
    if (patient.resetCode !== body.verificationCode) {
      return NextResponse.json({
        success: false,
        error: 'Invalid verification code',
      }, { status: 400 });
    }
    
    // Check if verification code has expired
    if (patient.resetExpiration && new Date() > new Date(patient.resetExpiration)) {
      return NextResponse.json({
        success: false,
        error: 'Verification code has expired. Please register again.',
      }, { status: 400 });
    }
    
    // Update patient to be verified
    const updatedPatient = await prisma.patient.update({
      where: {
        id: patient.id,
      },
      data: {
        active: true,     // Activate the patient
        resetCode: null,  // Clear verification code
        resetExpiration: null, // Clear expiration date
      },
    });
    
    // Generate authentication token
    const token = generateToken(updatedPatient);
    
    // Set authentication cookie
    const cookieHeader = serialize('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
      sameSite: 'strict'
    });
    
    // Create response with cookie
    const response = NextResponse.json({
      success: true,
      message: 'Email verification successful!',
      patient: {
        id: updatedPatient.id,
        medicalNumber: updatedPatient.medicalNumber,
        email: updatedPatient.email,
      },
      redirectTo: '/patient/dashboard'
    }, { status: 200 });
    
    // Set cookie in response header
    response.headers.set('Set-Cookie', cookieHeader);
    
    return response;
  } catch (error) {
    console.error('Error during email verification:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to process verification',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
