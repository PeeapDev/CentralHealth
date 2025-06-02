import { NextRequest, NextResponse } from 'next/server';
import { sendVerificationEmail } from '@/lib/email';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// Helper function to generate a patient medical number
function generateMedicalNumber(): string {
  // Generate a random 5-digit number for patient identifier
  const randomDigits = Math.floor(10000 + Math.random() * 90000);
  // Format as P + 5 digits (e.g., P12345)
  return `P${randomDigits}`;
}

// Get JWT secret
const JWT_SECRET = process.env.JWT_SECRET || 'dev_fallback_secret_for_patient_authentication_do_not_use_in_production';
console.log('Using JWT_SECRET:', JWT_SECRET ? 'Secret defined' : 'Secret undefined - using fallback');

// Helper function to generate JWT token
function generateToken(patient: any) {
  return jwt.sign(
    {
      id: patient.id,
      medicalNumber: patient.medicalNumber,
      email: patient.email,
      role: 'patient', // Role for authorization
    },
    JWT_SECRET,
    {
      expiresIn: '7d', // Token expires in 7 days
    }
  );
}

// Patient registration endpoint
export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const body = await req.json();
    
    // Validate required fields
    const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'password'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({
          success: false,
          error: `Missing required field: ${field}`,
        }, { status: 400 });
      }
    }
    
    // Additional validation for email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid email format',
      }, { status: 400 });
    }
    
    // Process and normalize phone number (enforce +232 prefix for Sierra Leone)
    let phoneNumber = body.phone.trim();
    
    // If number starts with 0, remove it
    if (phoneNumber.startsWith('0')) {
      phoneNumber = phoneNumber.substring(1);
    }
    
    // If number doesn't have the country code, add it
    if (!phoneNumber.startsWith('+')) {
      // Sierra Leone country code
      phoneNumber = `+232${phoneNumber}`;
    } else if (!phoneNumber.startsWith('+232')) {
      // If has a different country code, standardize to Sierra Leone
      // Extract the number without the country code
      const numberWithoutCode = phoneNumber.substring(phoneNumber.indexOf('+') + 4);
      phoneNumber = `+232${numberWithoutCode}`;
    }
    
    // Generate unique medical number for the patient
    const medicalNumber = generateMedicalNumber();
    
    // Set a default birthdate if not provided
    const birthDate = body.birthDate ? new Date(body.birthDate) : new Date('1990-01-01');
    const gender = body.gender || 'unknown'; // Default gender
    
    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(body.password, saltRounds);
    
    // Determine hospital context if any
    const hospitalId = body.hospitalId || null;
    
    let hospitalInfo = null;
    if (hospitalId) {
      // Get hospital information for response context
      const hospital = await prisma.hospital.findUnique({
        where: { id: hospitalId },
        select: {
          id: true,
          name: true,
          subdomain: true,
        }
      });
      
      if (hospital) {
        hospitalInfo = hospital;
      }
    }
    
    // Only check for existing email if the email hasn't been verified yet
    // This prevents double-registration checks for emails that are already verified
    if (!body.emailVerified) {
      // Check if patient already exists with the same email
      const existingPatientByEmail = await prisma.patient.findFirst({
        where: {
          email: body.email 
        }
      });

      if (existingPatientByEmail) {
        return NextResponse.json({
          success: false,
          error: 'A patient with this email already exists',
        }, { status: 409 });
      }
    }
    
    // Check if patient already exists with the same phone number
    // Skip this check if we already have email verification
    if (!body.emailVerified) {
      const existingPatientByPhone = await prisma.patient.findFirst({
        where: {
          phone: phoneNumber
        }
      });
      
      if (existingPatientByPhone) {
        return NextResponse.json({
          success: false,
          error: 'A patient with this phone number already exists',
        }, { status: 409 });
      }
    }
    
    // Format name according to FHIR standard
    const nameData = [
      {
        use: 'official',
        family: body.lastName,
        given: [body.firstName],
        prefix: body.prefix || [],
        suffix: body.suffix || [],
      }
    ];
    
    // Format telecom according to FHIR standard
    const telecomData = [
      {
        system: 'phone',
        value: phoneNumber,
        use: 'mobile'
      },
      {
        system: 'email',
        value: body.email,
        use: 'home'
      }
    ];
    
    // Format address as a default if not provided
    const addressData = body.address ? [body.address] : [
      {
        use: 'home',
        type: 'physical',
        line: ['Unknown'],
        city: 'Freetown',
        district: 'Western Area Urban',
        country: 'Sierra Leone'
      }
    ];
    
    // Generate verification code
    const verificationCode = crypto.randomBytes(3).toString('hex').toUpperCase(); // 6 characters
    
    // Set verification code expiry (24 hours)
    const verificationExpiry = new Date();
    verificationExpiry.setHours(verificationExpiry.getHours() + 24);
    
    console.log('Generated verification code:', verificationCode);
    
    try {
      // Make sure the email is verified before creating a patient
      if (body.emailVerified === undefined || body.emailVerified === false) {
        return NextResponse.json({
          success: false,
          message: "Email verification is required to complete registration",
          details: { emailVerified: body.emailVerified }
        }, { status: 400 });
      }

      // Create new patient with verification code (match Prisma schema)      
      const newPatient = await prisma.patient.create({
        data: {
          medicalNumber: medicalNumber,
          resourceType: 'Patient',
          active: true, // Set to active immediately (no email verification)
          
          // JSON fields stored as strings
          name: JSON.stringify(nameData),
          gender: gender,
          birthDate: birthDate,
          email: body.email,
          phone: phoneNumber,
          password: hashedPassword,
          telecom: JSON.stringify(telecomData),
          address: JSON.stringify(addressData),
          photo: '',
          hospitalId: hospitalId,
          // Store verification code (using only resetCode, not verificationCode)
          resetCode: verificationCode,
          resetExpiration: verificationExpiry,
          
          // Set extension with onboardingCompleted = false to trigger wizard
          extension: JSON.stringify({
            onboardingCompleted: false
          })
        },
        select: {
          id: true,
          medicalNumber: true,
          email: true,
          phone: true,
          gender: true,
          birthDate: true,
          active: true,
          name: true,
          resetCode: true,
          createdAt: true,
          updatedAt: true,
        }
      });
      
      // Prepare patient data for response
      const nameObject = newPatient.name ? JSON.parse(newPatient.name as string) : nameData;
      const patientResponse = {
        id: newPatient.id,
        medicalNumber: newPatient.medicalNumber,
        firstName: body.firstName, // For convenience in response
        lastName: body.lastName,
        name: `${body.firstName} ${body.lastName}`,
        email: newPatient.email,
        phone: newPatient.phone,
        gender: newPatient.gender,
        birthDate: newPatient.birthDate ? new Date(newPatient.birthDate).toISOString() : null,
        createdAt: new Date(newPatient.createdAt).toISOString(),
        updatedAt: new Date(newPatient.updatedAt).toISOString(),
      };
      
      // We're no longer sending welcome email at registration time
      // It will now be sent after onboarding is completed
      
      // Log successful registration
      console.log(`Patient registered successfully: ${body.email} with medical number ${medicalNumber}`);
      console.log(`Patient will be redirected to onboarding after registration`);
      
      // No email is sent at this stage - welcome email with full details will be sent after onboarding
      
      // Generate JWT token
      const token = jwt.sign(
        {
          id: newPatient.id,
          medicalNumber: newPatient.medicalNumber,
          email: newPatient.email,
          role: 'patient', // Role for authorization
        },
        JWT_SECRET,
        {
          expiresIn: '7d', // Token expires in 7 days
        }
      );

      // Create response with token
      const response = NextResponse.json({
        success: true,
        message: 'Registration successful!',
        token,
        patient: patientResponse
      }, { status: 201 });
      
      // Set cookie for authentication
      response.cookies.set({
        name: 'token',
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
        sameSite: 'strict'
      });
      
      return response;
      
    } catch (dbError) {
      console.error('Database error during patient creation:', dbError);
      
      // Handle specific error cases
      let errorMessage = 'Failed to register patient';
      let statusCode = 500;
      
      const errorString = String(dbError);
      
      // Handle common error cases
      if (errorString.includes('Unique constraint') || errorString.includes('unique constraint')) {
        errorMessage = 'A patient with this information already exists';
        statusCode = 409;
      } else if (errorString.includes('validation')) {
        errorMessage = 'Invalid patient data format';
        statusCode = 400;
      }
      
      // Return error response with detailed information
      return NextResponse.json({
        success: false,
        error: errorMessage,
        details: dbError instanceof Error ? dbError.message : String(dbError)
      }, { status: statusCode });
    }
    
  } catch (error) {
    console.error('Unexpected error during patient registration:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to process registration request',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
