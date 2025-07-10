import { NextRequest, NextResponse } from "next/server";
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/database/prisma-client';
import { v4 as uuidv4 } from 'uuid';
import { validateEmail, validateName, normalizeEmail } from '../../../../utils/validators';
import { validateStoredMedicalID } from '../../../../utils/medical-id';
import { isUniqueMedicalID, generateUniqueMedicalID } from '../../../../utils/check-id-uniqueness';
import { createPatientProfilePicture } from '../../../../utils/profile-picture';
import { isValidMedicalId, normalizeMedicalId } from '../../../../utils/qr-code';

/**
 * Medical ID preservation is critical. According to CentralHealth System requirements:
 * - Medical IDs must NEVER be regenerated for existing patients
 * - Each patient receives ONE permanent medical ID for their lifetime
 * - All medical IDs must follow NHS-style 5-character alphanumeric format
 * - Medical IDs must be stored consistently in the mrn field
 */

/**
 * Creates patient name string for database storage
 */
function createPatientName(firstName: string, lastName: string) {
  return `${firstName} ${lastName}`;
}

/**
 * Patient Registration API Endpoint
 * Implements centralized patient management without hospital association
 * Optimized for performance and reliability with timeout handling
 * Following CentralHealth System requirements for permanent medical IDs
 */
export async function POST(req: NextRequest) {
  console.log('Patient registration API called');
  
  try {
    const body = await req.json();
    
    // Validate that we have a registration request body
    if (!body) {
      console.error('Missing registration request body');
      return NextResponse.json(
        { success: false, error: "Invalid registration request" },
        { status: 400 }
      );
    }
    
    // Determine which registration flow we're handling
    if (body.registrationType === 'basic') {
      return await handleBasicRegistration(body, req);
    } else {
      // Default to basic registration if not specified
      return await handleBasicRegistration(body, req);
    }
  } catch (error) {
    console.error('Registration error:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json(
      { success: false, error: "Registration failed. Please try again." },
      { status: 500 }
    );
  }
}

/**
 * Handle the basic registration step (personal information)
 * Uses optimized database operations to avoid timeouts
 */
async function handleBasicRegistration(body: any, req: NextRequest) {
  try {
    const { firstName, lastName, email, password, phone, gender, birthDate, profilePicture, medicalId } = body;

    // Basic validation of required fields
    if (!firstName || !lastName || !email || !password) {
      console.error('Missing required registration fields');
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate email format
    if (!validateEmail(email)) {
      console.error('Invalid email format:', email);
      return NextResponse.json(
        { success: false, error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Normalize email for consistency
    const normalizedEmail = normalizeEmail(email);

    // Validate name fields
    if (!validateName(firstName) || !validateName(lastName)) {
      console.error('Invalid name format');
      return NextResponse.json(
        { success: false, error: "Invalid name format" },
        { status: 400 }
      );
    }
    
    // Simple email existence check with shorter timeout
    console.log('Checking if email exists:', normalizedEmail);
    try {
      // Direct query for better performance
      const existingEmailCheck = await Promise.race([
        prisma.user.findFirst({ where: { email: normalizedEmail } }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Email check timed out')), 2000))
      ]);
      
      if (existingEmailCheck) {
        console.log('Email already exists in User table');
        return NextResponse.json(
          { error: "Email already in use" },
          { status: 400 }
        );
      }
    } catch (emailCheckError) {
      console.log('Email check error:', emailCheckError instanceof Error ? emailCheckError.message : 'Unknown error');
      // Continue with registration even if check times out - the unique constraint will catch duplicates
    }

    // Generate a medical ID if not provided (modern flow)
    if (!medicalId) {
      console.log('No medical ID provided, generating one automatically...');
      try {
        medicalId = await generateUniqueMedicalID();
        console.log('Generated medical ID:', medicalId);
      } catch (idGenerationError) {
        console.error('Failed to generate medical ID:', idGenerationError);
        return NextResponse.json(
          { success: false, error: "Failed to generate medical ID" },
          { status: 500 }
        );
      }
    } else {
      // If medical ID was provided, validate it
      if (!validateStoredMedicalID(medicalId)) {
        console.error('Invalid medical ID format provided:', medicalId);
        return NextResponse.json(
          { success: false, error: "Invalid medical ID format" },
          { status: 400 }
        );
      }
      
      // Check if the provided medical ID is already in use
      try {
        const existingPatient = await prisma.patient.findFirst({
          where: { mrn: medicalId }
        });
        
        if (existingPatient) {
          console.error('Medical ID already in use:', medicalId);
          return NextResponse.json(
            { success: false, error: "Medical ID already in use" },
            { status: 400 }
          );
        }
      } catch (idCheckError) {
        console.error('Error checking medical ID uniqueness:', idCheckError);
        // Continue with registration attempt
      }
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Generate UUIDs for both User and Patient records
    const userId = uuidv4();
    const patientId = uuidv4();
    
    // We don't need to generate QR codes at registration time
    // QR codes are displayed in the patient profile based on their medical ID
    // This follows CentralHealth System policy for consistent medical ID usage
    console.log(`Registration with medical ID: ${medicalId}`);
    
    // Format the birthdate (if provided)
    let birthDateObj = null;
    if (birthDate) {
      birthDateObj = new Date(birthDate);
    }

    // 1. Create User record first
    console.log('Creating user record...');
    let newUser;
    try {
      newUser = await prisma.user.create({
        data: {
          id: userId,
          email: normalizedEmail,
          password: hashedPassword,
          name: createPatientName(firstName, lastName),
          role: 'PATIENT'
        }
      });
      console.log('User record created successfully with ID:', newUser.id);
    } catch (userError) {
      console.error('Failed to create user:', userError instanceof Error ? userError.message : 'Unknown error');
      return NextResponse.json({ 
        success: false, 
        error: 'Registration failed: User account could not be created. Email may already be in use.' 
      }, { status: 500 });
    }
    
    // 2. Create Patient record
    console.log('Creating patient record...');
    let newPatientRecord;
    try {
      newPatientRecord = await prisma.patient.create({
        data: {
          id: patientId,
          mrn: medicalId,
          name: createPatientName(firstName, lastName),
          dateOfBirth: birthDateObj,
          gender: gender || 'unknown',
          onboardingCompleted: true,
          userId: newUser.id // Simple reference instead of complex connect
        }
      });
      console.log('Patient record created successfully with ID:', newPatientRecord.id);
    } catch (patientError) {
      // If patient creation fails, clean up the user we created
      try {
        await prisma.user.delete({ where: { id: userId } });
        console.log('Cleaned up user record after patient creation failed');
      } catch (cleanupError) {
        console.error('Failed to clean up user record:', cleanupError);
      }
      
      console.error('Failed to create patient:', patientError instanceof Error ? patientError.message : 'Unknown error');
      return NextResponse.json({ 
        success: false, 
        error: 'Registration failed: Patient record could not be created.' 
      }, { status: 500 });
    }
    
    // 3. Create PatientEmail record - non-blocking
    console.log('Creating patient email record...');
    try {
      const patientEmail = await prisma.patientEmail.create({
        data: {
          email: normalizedEmail,
          patientId: newPatientRecord.id, // Simple reference instead of complex connect
          isVerified: false,
          isPrimary: true,
        }
      });
      console.log('Email record created successfully');
    } catch (emailError) {
      // Non-fatal error - log but continue
      console.warn('Failed to create email record:', emailError instanceof Error ? emailError.message : 'Unknown error');
    }
    
    // 4. Create phone record in dedicated table if phone number is provided
    if (phone) {
      try {
        const patientPhone = await prisma.patientPhone.create({
          data: {
            patientId: newPatientRecord.id,
            phone: phone,
            type: 'mobile',
            primary: true,
            verified: false
          }
        });
        console.log('Phone record created successfully');
      } catch (phoneError) {
        console.warn('Failed to create phone record:', phoneError instanceof Error ? phoneError.message : 'Unknown error');
        // Non-fatal error - continue
      }
    }
    
    // Handle profile picture if provided
    if (profilePicture) {
      try {
        const profilePicUrl = await createPatientProfilePicture(patientId, profilePicture);
        // Update patient with profile picture URL
        await prisma.patient.update({
          where: { id: newPatientRecord.id },
          data: { profilePicture: profilePicUrl }
        });
        console.log('Profile picture saved successfully');
      } catch (profilePicError) {
        console.warn('Failed to save profile picture:', profilePicError);
        // Non-fatal error - continue
      }
    }
    
    // Create search index for quick lookups - non-critical
    try {
      await prisma.patientSearchIndex.create({
        data: {
          patientId: newPatientRecord.id,
          content: `${createPatientName(firstName, lastName)} ${medicalId} ${normalizedEmail}`.toLowerCase(),
          tokens: [
            firstName.toLowerCase(),
            lastName.toLowerCase(),
            medicalId.toLowerCase(),
            normalizedEmail
          ]
        }
      });
      console.log('Search index created successfully');
    } catch (searchError) {
      console.warn('Failed to create search index:', searchError instanceof Error ? searchError.message : 'Unknown error');
      // Non-fatal error - continue
    }
    
    // Registration successful
    console.log('Patient registration complete successfully!');
    
    // Create response with patient information
    return NextResponse.json({
      success: true,
      message: "Registration successful",
      redirect: "/auth/login?registered=true&email=" + encodeURIComponent(normalizedEmail),
      patient: {
        id: newPatientRecord.id,
        name: createPatientName(firstName, lastName),
        email: normalizedEmail
      }
    });
  } catch (error) {
    console.error('Registration error:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({
      success: false,
      error: "Registration failed. Please try again."
    }, { status: 500 });
  }
}
