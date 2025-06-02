import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { serialize } from 'cookie';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// Get the JWT secret from environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-for-development';

// Implementation using PostgreSQL via Prisma for patient authentication

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, password } = body;
    
    console.log('Patient login attempt:', { phone: phone?.substring(0, 6) + '****', passwordProvided: !!password });

    // Input validation
    if (!phone || !password) {
      console.log('Login validation failed: missing credentials');
      return NextResponse.json(
        { success: false, message: 'Both phone number and password are required' },
        { status: 400 }
      );
    }

    // Format phone number if needed
    let formattedPhone = phone;
    if (!phone.startsWith('+232') && phone.length >= 8) {
      // If phone doesn't have country code, add it
      formattedPhone = '+232' + (phone.startsWith('0') ? phone.substring(1) : phone);
    }

    console.log(`Attempting login for patient with phone: ${formattedPhone.substring(0, 6)}****`);

    // Find patient by phone number
    const patient = await prisma.patient.findFirst({
      where: { phone: formattedPhone },
      select: {
        id: true,
        medicalNumber: true,
        name: true,
        email: true,
        phone: true,
        gender: true,
        birthDate: true,
        photo: true,
        active: true,
        password: true,
        hospitalId: true,
        createdAt: true, // Add createdAt to determine if onboarding is needed
      }
    });
    
    // Debug patient retrieval
    console.log('Patient lookup result:', patient ? 'Found' : 'Not found');
    
    // If patient not found or password doesn't match
    if (!patient) {
      console.log('Invalid credentials: Patient not found');
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    // Verify password using bcrypt
    let passwordValid = false;
    
    if (patient.password) {
      try {
        // Check if the password is already hashed (starts with $2a$ or $2b$)
        if (patient.password.startsWith('$2a$') || patient.password.startsWith('$2b$')) {
          // Use bcrypt compare for hashed passwords
          passwordValid = await bcrypt.compare(password, patient.password);
          console.log('Verified password using bcrypt:', passwordValid ? 'match' : 'mismatch');
        } else {
          // For backwards compatibility with non-hashed passwords
          passwordValid = patient.password === password;
          console.log('Verified password using direct comparison:', passwordValid ? 'match' : 'mismatch');
          
          // If using plain text password, update to hashed version
          if (passwordValid) {
            const hashedPassword = await bcrypt.hash(password, 10);
            await prisma.patient.update({
              where: { id: patient.id },
              data: { password: hashedPassword }
            });
            console.log(`Updated patient to hashed password for better security`);
          }
        }
      } catch (e) {
        console.error('Password comparison error:', e);
        passwordValid = false;
      }
    } else {
      // No password set
      passwordValid = false;
    }
    
    if (!passwordValid) {
      console.log('Invalid credentials: Password verification failed');
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    // Check if the patient's account is verified
    if (!patient.active) {
      console.log('Account not verified: Patient needs to verify email first');
      return NextResponse.json(
        { 
          success: false, 
          message: 'Please verify your email before logging in', 
          requiresVerification: true,
          medicalNumber: patient.medicalNumber 
        },
        { status: 403 }
      );
    }
    
    // Parse name from JSON
    let firstName = '';
    let lastName = '';
    try {
      const nameObj = JSON.parse(patient.name as string);
      firstName = nameObj.given?.[0] || '';
      lastName = nameObj.family || '';
    } catch (e) {
      console.error('Error parsing patient name:', e);
    }

    // Check if this is a new user who needs to complete onboarding
    // We'll consider a user as needing onboarding if they were created in the last hour
    const isNewUser = new Date().getTime() - patient.createdAt.getTime() < 3600000; // 1 hour in milliseconds
    
    // Generate JWT token with onboardingCompleted flag
    const token = jwt.sign(
      {
        patientId: patient.id,
        medicalNumber: patient.medicalNumber,
        role: 'patient',
        phone: patient.phone,
        name: `${firstName} ${lastName}`,
        // For new users, set onboardingCompleted to false
        onboardingCompleted: !isNewUser
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    console.log(`Patient authenticated successfully, setting JWT token`);
    
    // Set cookie for authentication using proper serialization
    const cookieHeader = serialize('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
      path: '/',
      sameSite: 'strict'
    });
    
    // Create response object
    const response = NextResponse.json({
      success: true,
      message: 'Authentication successful',
      patient: {
        id: patient.id,
        medicalNumber: patient.medicalNumber,
        name: `${firstName} ${lastName}`,
        firstName,
        lastName,
        email: patient.email,
        phone: patient.phone,
        gender: patient.gender,
        birthDate: patient.birthDate,
        photo: patient.photo,
      },
      token,
      redirectTo: '/patient/dashboard'
    });
    
    // Set cookie in response header
    response.headers.set('Set-Cookie', cookieHeader);
    
    return response;
    
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, message: 'Authentication failed', error: String(error) },
      { status: 500 }
    );
  }
}
