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
    
    // Check if patient already exists with the same email
    const existingPatientByEmail = await prisma.patient.findFirst({
      where: {
        email: body.email // Direct equality check instead of contains
      }
    });

    // Check if patient already exists with the same phone number
    // We can't use contains with telecom, so use phone field directly
    const existingPatientByPhone = await prisma.patient.findFirst({
      where: {
        phone: phoneNumber
      }
    });

    if (existingPatientByEmail || existingPatientByPhone) {
      return NextResponse.json({
        success: false,
        error: 'A patient with this email or phone number already exists',
      }, { status: 409 });
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
    
    // Generate verification code and set expiry date (24 hours from now)
    const verificationCode = crypto.randomBytes(20).toString('hex');
    const verificationExpiry = new Date();
    verificationExpiry.setHours(verificationExpiry.getHours() + 24);
    
    try {
      // Create new patient with verification code (match Prisma schema)      
      const newPatient = await prisma.patient.create({
        data: {
          medicalNumber: medicalNumber,
          resourceType: 'Patient',
          active: false, // Initially inactive until email is verified
          
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
          // Store verification code in resetCode field
          resetCode: verificationCode,
          resetExpiration: verificationExpiry,
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
      
      let emailSent = false;
      try {
        // Try to send verification email
        await sendVerificationEmail({
          patientEmail: body.email,
          patientName: `${body.firstName} ${body.lastName}`,
          verificationCode,
          medicalNumber
        });
        emailSent = true;
      } catch (emailError) {
        console.error('Email sending failed, but continuing with registration:', emailError);
        // Continue with registration even if email fails
      }
      
      // Return success response
      return NextResponse.json({
        success: true,
        message: emailSent 
          ? 'Registration successful! Please check your email for verification instructions.' 
          : `Registration successful! Your medical number is ${medicalNumber}. Use this with your verification code: ${verificationCode}`,
        requiresVerification: true,
        verificationCode: emailSent ? undefined : verificationCode, // Only send code in response if email failed
        patient: patientResponse
      }, { status: 201 });
      
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
