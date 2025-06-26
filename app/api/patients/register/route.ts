import { NextRequest, NextResponse } from "next/server";
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/database/prisma-client';
import { v4 as uuidv4 } from 'uuid';
import { validateEmail, validateName, normalizeEmail } from '../../../../utils/validators';
import { isValidMedicalID } from '../../../../utils/medical-id';
import { isUniqueMedicalID, generateUniqueMedicalID } from '../../../../utils/check-id-uniqueness';
import { createPatientProfilePicture } from '../../../../utils/profile-picture';
import { generatePatientQRCode } from '../../../../utils/qr-code';

/**
 * Medical ID preservation is critical. According to CentralHealth System requirements:
 * - Medical IDs must NEVER be regenerated for existing patients
 * - Each patient receives ONE permanent medical ID for their lifetime
 * - All medical IDs must follow NHS-style 5-character alphanumeric format
 * - Medical IDs must be stored consistently in the mrn field
 */

/**
 * Creates FHIR-compatible name object for patient records
 */
function createPatientName(firstName: string, lastName: string) {
  // For new version of the API, the name needs to be a string
  return `${firstName} ${lastName}`;
}

/**
 * Patient Registration API Endpoint
 * Implements centralized patient management without hospital association
 * Following CentralHealth System requirements for permanent medical IDs
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Extract registration step information
    const { step } = body;
    
    // Handle multi-step registration process
    switch (step) {
      case 'basic':
        return handleBasicRegistration(body, req);
      case 'medical':
      case 'lifestyle':
      case 'documents':
        // All secondary steps are skipped - redirect to dashboard
        return NextResponse.json({
          success: true,
          message: 'Onboarding process has been removed. Redirecting to dashboard.',
          redirectTo: '/patient/dashboard',
          onboardingCompleted: true
        });
      default:
        // Default to basic registration for backward compatibility
        return handleBasicRegistration(body, req);
    }
  } catch (error) {
    console.error('Error in patient registration:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Invalid request data' 
    }, { status: 400 });
  }
}

/**
 * Handle the basic registration step (personal information)
 */
async function handleBasicRegistration(body: any, req: NextRequest) {
  try {
    const { firstName, lastName, email, password, phone, gender, birthDate, profilePicture } = body;
    let medicalId = body.medicalId;
    
    console.log('Registration request for:', email);
    
    // Input validation for patient personal data
    if (!validateName(firstName) || !validateName(lastName)) {
      return NextResponse.json(
        { error: "Invalid name format" },
        { status: 400 }
      );
    }
    
    if (!validateEmail(email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }
    
    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }
    
    // Medical ID validation - required and must follow system rules
    if (!medicalId || !isValidMedicalID(medicalId)) {
      return NextResponse.json(
        { error: "Valid medical ID is required for registration" },
        { status: 400 }
      );
    }
    
    // ADDITIONAL EXPLICIT CHECK: Reject all-letter medical IDs (like "SITPT")
    if (/^[A-Za-z]+$/.test(medicalId)) {
      console.error(`Registration rejected: All-letter medical ID detected: ${medicalId}`);
      return NextResponse.json(
        { error: "Medical ID must contain both letters and numbers" },
        { status: 400 }
      );
    }
    
    // Check if the medical ID is unique in the database
    const isUnique = await isUniqueMedicalID(medicalId);
    if (!isUnique) {
      console.error(`Medical ID ${medicalId} already in use. Generating a new unique medical ID.`);
      const uniqueMedicalId = await generateUniqueMedicalID();
      console.log(`Generated new unique medical ID: ${uniqueMedicalId} to replace non-unique ID: ${medicalId}`);
      // Update the medicalId variable to use this unique ID
      medicalId = uniqueMedicalId;
    }

    console.log('Using validated medical ID:', medicalId);

    // Check if patient with email already exists in the dedicated email table
    const existingPatientByEmail = await prisma.patientEmail.findFirst({
      where: {
        email: email.toLowerCase().trim()
      },
      include: {
        patient: {
          select: { id: true }
        }
      }
    });

    if (existingPatientByEmail) {
      console.log('Patient with email already exists:', email);
      return NextResponse.json({ 
        success: false, 
        error: 'A patient with this email already exists' 
      }, { status: 409 });
    }

    // Create FHIR-compatible name structure
    const nameData = createPatientName(firstName, lastName);

    // Hash the password before storing it for security
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('Password hashed for secure storage');
    
    // Convert birthDate string to Date object if provided
    const birthDateObj = birthDate ? new Date(birthDate) : null;
    
    try {
      // First create a user for authentication
      const newUser = await prisma.user.create({
        data: {
          email: email.toLowerCase().trim(),
          password: hashedPassword,
          name: `${firstName} ${lastName}`,
          role: 'PATIENT',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      
      // Generate a unique UUID for the patient record ID
      const patientUUID = uuidv4();
      
      // Generate QR code for the patient based on their medical ID
      let qrCodeData: string | null = null;
      try {
        qrCodeData = await generatePatientQRCode(medicalId);
        console.log(`Generated QR code for medical ID: ${medicalId}`);
      } catch (qrError) {
        console.error('Failed to generate QR code:', qrError);
        // Continue with patient creation even if QR code generation fails
      }
      
      // Create the new patient record with UUID, specified medical ID, and QR code
      const newPatientRecord = await prisma.patient.create({
        data: {
          id: patientUUID, // Use UUID for the database primary key
          mrn: medicalId,  // Use the unique medical ID for MRN (permanent per hospital policy)
          name: nameData,  // Use FHIR-compatible name format
          dateOfBirth: birthDateObj,
          gender: gender || 'unknown',
          onboardingCompleted: true, // Mark onboarding as completed immediately
          updatedAt: new Date(),
          createdAt: new Date(),
          // Connect to the user we just created
          userId: newUser.id,
          // Save the generated QR code
          qrCode: qrCodeData
        }
      });
      
      console.log(`Created patient with UUID: ${patientUUID} and medical ID (MRN): ${medicalId}`);
      
      // Create email record in dedicated table
      const patientEmail = await prisma.patientEmail.create({
        data: {
          patientId: newPatientRecord.id,
          email: email.toLowerCase().trim(),
          primary: true, // First email is primary
          verified: false, // Requires verification
          updatedAt: new Date(),
          createdAt: new Date()
        }
      });
      
      let patientPhone = null;
      // Create phone record in dedicated table if phone number is provided
      if (phone) {
        patientPhone = await prisma.patientPhone.create({
          data: {
            patientId: newPatientRecord.id,
            phone: phone,
            type: 'mobile', // Default to mobile type
            primary: true, // First phone is primary 
            verified: false, // Requires verification
            updatedAt: new Date(),
            createdAt: new Date()
          }
        });
      }
      
      console.log('Patient created successfully in centralized system');
      console.log('Medical ID permanently assigned:', medicalId);
      
      // Handle profile picture if provided
      let profilePictureRecord = null;
      if (profilePicture && typeof profilePicture === 'string' && profilePicture.trim().length > 0) {
        try {
          console.log('Saving profile picture for patient:', newPatientRecord.id);
          profilePictureRecord = await createPatientProfilePicture(
            newPatientRecord.id,
            profilePicture,
            'image/jpeg', // Default mime type, could be determined from the data
            newPatientRecord.id // Self-uploaded
          );
          console.log('Profile picture saved successfully');

          // If profile picture created successfully, update the User record with the photo URL
          if (profilePictureRecord && newUser) {
            await prisma.user.update({
              where: { id: newUser.id },
              data: { photo: profilePictureRecord.imageUrl }
            });
          }
        } catch (pictureError) {
          // Non-blocking error - log but continue registration process
          console.error('Failed to save profile picture:', pictureError);
          // Registration still succeeds even if profile picture fails
        }
      }
      
      // Use the email and phone we created
      const primaryEmail = patientEmail.email;
      const primaryPhone = patientPhone?.phone || phone;
      
      // Return success response with patient data including QR code
      return NextResponse.json({
        success: true,
        patient: {
          id: newPatientRecord.id,
          medicalId: medicalId, // Primary permanent identifier
          mrn: medicalId,
          name: `${firstName} ${lastName}`,
          email: primaryEmail,
          phone: primaryPhone,
          userId: newUser.id,
          qrCode: newPatientRecord.qrCode, // Include the stored QR code
          profilePicture: profilePictureRecord ? {
            id: profilePictureRecord.id,
            url: profilePictureRecord.imageUrl
          } : null
        },
        onboardingCompleted: true,
        redirectTo: '/patient/dashboard',
        message: 'Registration completed successfully. Redirecting to dashboard.'
      }, { status: 201 });
      
    } catch (dbError) {
      // Handle database errors with detailed logging
      console.error('Database error during patient creation:', dbError);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to register patient. Please try again later.' 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in patient registration:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Invalid request data' 
    }, { status: 400 });
  }
}

/**
 * Handle the medical information registration step
 */
async function handleMedicalRegistration(body: any, req: NextRequest) {
  try {
    const { patientId, medicalHistory, allergies, medications, conditions, chronicConditions } = body;
    
    if (!patientId || !isValidMedicalID(patientId)) {
      return NextResponse.json({
        success: false,
        error: 'Valid patient ID (medical ID) is required'
      }, { status: 400 });
    }
    
    // Find the patient using the permanent medical ID
    const patient = await prisma.patient.findUnique({
      where: { id: patientId }
    });
    
    if (!patient) {
      return NextResponse.json({
        success: false,
        error: 'Patient not found. Complete basic registration first.'
      }, { status: 404 });
    }
    
    // Parse and prepare medical history data
    const medicalHistoryData = {};
    if (medicalHistory) {
      Object.assign(medicalHistoryData, {
        history: medicalHistory
      });
    }
    
    if (allergies) {
      Object.assign(medicalHistoryData, {
        allergies: Array.isArray(allergies) ? allergies : [allergies]
      });
    }
    
    if (medications) {
      Object.assign(medicalHistoryData, {
        medications: Array.isArray(medications) ? medications : [medications]
      });
    }
    
    if (conditions) {
      Object.assign(medicalHistoryData, {
        conditions: Array.isArray(conditions) ? conditions : [conditions]
      });
    }
    
    if (chronicConditions) {
      Object.assign(medicalHistoryData, {
        chronicConditions: Array.isArray(chronicConditions) ? chronicConditions : [chronicConditions]
      });
    }
    
    // Update patient with medical history
    const updatedPatient = await prisma.patient.update({
      where: { id: patientId },
      data: {
        medicalHistory: medicalHistoryData,
        updatedAt: new Date()
      },
      select: {
        id: true,
        mrn: true,
        medicalHistory: true
      }
    });
    
    return NextResponse.json({
      success: true,
      message: 'Medical information saved successfully',
      patientId: updatedPatient.id,
      step: 'medical',
      completed: true
    });
    
  } catch (error) {
    console.error('Error updating medical information:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update medical information',
      details: (error as Error).message
    }, { status: 500 });
  }
}

/**
 * Handle the lifestyle information registration step
 */
async function handleLifestyleRegistration(body: any, req: NextRequest) {
  try {
    const { patientId, smoking, alcohol, exercise, diet, occupation, stress } = body;
    
    if (!patientId || !isValidMedicalID(patientId)) {
      return NextResponse.json({
        success: false,
        error: 'Valid patient ID (medical ID) is required'
      }, { status: 400 });
    }
    
    // Find the patient using the permanent medical ID
    const patient = await prisma.patient.findUnique({
      where: { id: patientId }
    });
    
    if (!patient) {
      return NextResponse.json({
        success: false,
        error: 'Patient not found. Complete basic registration first.'
      }, { status: 404 });
    }
    
    // Get existing medical history or create new object
    let medicalHistory = {};
    if (patient.medicalHistory) {
      medicalHistory = typeof patient.medicalHistory === 'string' ?
        JSON.parse(patient.medicalHistory as string) :
        patient.medicalHistory;
    }
    
    // Add lifestyle information to medical history
    const lifestyleData = {
      smoking,
      alcohol,
      exercise,
      diet,
      occupation,
      stress
    };
    
    // Create a properly formatted medical history string (JSON) 
    const medicalHistoryJSON = JSON.stringify({
      ...medicalHistory,
      lifestyle: lifestyleData
    });
    
    // Update patient with lifestyle information
    const updatedPatient = await prisma.patient.update({
      where: { id: patientId },
      data: {
        medicalHistory: medicalHistoryJSON,
        updatedAt: new Date()
      },
      select: {
        id: true,
        mrn: true,
        medicalHistory: true
      }
    });
    
    return NextResponse.json({
      success: true,
      message: 'Lifestyle information saved successfully',
      patientId: updatedPatient.id,
      step: 'lifestyle',
      completed: true
    });
    
  } catch (error) {
    console.error('Error updating lifestyle information:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update lifestyle information',
      details: (error as Error).message
    }, { status: 500 });
  }
}

/**
 * Handle the documents registration step
 */
async function handleDocumentsRegistration(body: any, req: NextRequest) {
  try {
    const { patientId, documents, consent, termsAccepted } = body;
    
    if (!patientId || !isValidMedicalID(patientId)) {
      return NextResponse.json({
        success: false,
        error: 'Valid patient ID (medical ID) is required'
      }, { status: 400 });
    }
    
    // Find the patient using the permanent medical ID
    const patient = await prisma.patient.findUnique({
      where: { id: patientId }
    });
    
    if (!patient) {
      return NextResponse.json({
        success: false,
        error: 'Patient not found. Complete basic registration first.'
      }, { status: 404 });
    }
    
    // Mark onboarding as completed with this step
    const updatedPatient = await prisma.patient.update({
      where: { id: patientId },
      data: {
        onboardingCompleted: true,
        updatedAt: new Date()
      },
      select: {
        id: true,
        mrn: true,
        onboardingCompleted: true
      }
    });
    
    return NextResponse.json({
      success: true,
      message: 'Registration and onboarding completed successfully',
      patientId: updatedPatient.id,
      step: 'documents',
      allStepsCompleted: true,
      onboardingCompleted: updatedPatient.onboardingCompleted
    });
    
  } catch (error) {
    console.error('Error finalizing registration:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to complete registration',
      details: (error as Error).message
    }, { status: 500 });
  }
}
