import { NextRequest, NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";
import { getPatientSession } from "@/lib/patient-session";
import { sendWelcomeEmail } from "@/lib/email";

// Add debugging for troubleshooting
const DEBUG = true;
function log(...args: any[]) {
  if (DEBUG) {
    console.log('[ONBOARDING_API]', ...args);
  }
}

// Type definitions for our data structures
interface PatientSession {
  id: string;
  authenticated: boolean;
}

interface ExtensionData {
  onboardingCompleted?: boolean;
  bloodGroup?: string;
  medicalId?: string;
  qrCode?: string;
  registrationDate?: string;
  organDonor?: boolean;
  [key: string]: any;
}

interface MedicalHistoryData {
  allergies?: string[];
  chronicConditions?: string[];
  [key: string]: any;
}

interface EmergencyContact {
  name?: string;
  relationship?: string;
  phone?: string;
  [key: string]: any;
}

interface ContactData {
  emergency?: EmergencyContact;
  [key: string]: any;
}

// We no longer need this function since we're directly using getPatientSession
// Keep it here temporarily for reference but it's not used anymore
/*
async function getPatientFromSession(): Promise<PatientSession | null> {
  try {
    const session = await getPatientSession();
    
    if (!session || !session.isLoggedIn) {
      return null;
    }
    
    return {
      id: session.id,
      authenticated: true
    };
  } catch (error) {
    console.error('Error getting patient from session:', error);
    return null;
  }
}
*/

export async function POST(req: NextRequest) {
  try {
    log('Starting onboarding completion process');
    
    // Parse the request body first for potential recovery information
    const requestData = await req.json().catch(parseError => {
      log('Failed to parse request body:', parseError);
      return null;
    });
    
    if (!requestData) {
      return NextResponse.json(
        { error: "Invalid request data format" },
        { status: 400 }
      );
    }
    
    log('Received onboarding data:', { 
      hasBasicDetails: !!requestData.basicDetails,
      hasHealthInfo: !!requestData.healthInfo,
      hasEmergencyContact: !!requestData.emergencyContact,
      hasRecoveryEmail: !!requestData.recoveryEmail,
      medicalId: requestData.medicalId
    });
    
    // Get the authenticated patient from the session
    const patientSession = await getPatientSession();

    // Log session information for debugging
    log('Patient session:', patientSession ? {
      id: patientSession.id,
      email: patientSession.email,
      isLoggedIn: patientSession.isLoggedIn
    } : 'No session found');

    // Session recovery handling
    let recoveryAttempted = false;
    let recoverySuccessful = false;
    let recoveredPatientId = null;
    
    // Always attempt session recovery if we have recovery email and medical ID,
    // regardless of whether we have a session or not
    if (requestData.recoveryEmail && requestData.medicalId) {
      log('Attempting session recovery using recoveryEmail and medicalId');
      recoveryAttempted = true;
      
      try {
        // Look for any patient with this email and medical ID
        const patientByEmail = await prisma.patient.findFirst({
          where: { 
            email: requestData.recoveryEmail
          },
          select: { id: true, extension: true }
        });
        
        if (patientByEmail) {
          // Check if this patient has the matching medical ID
          try {
            const extension = typeof patientByEmail.extension === 'string' 
              ? JSON.parse(patientByEmail.extension) 
              : patientByEmail.extension;
            
            if (extension && typeof extension === 'object') {
              // Try to find medical ID in the extension object
              if (extension.medicalId === requestData.medicalId) {
                log('Found patient with exact medicalId match:', patientByEmail.id);
                recoverySuccessful = true;
                recoveredPatientId = patientByEmail.id;
              } else if (JSON.stringify(extension).includes(requestData.medicalId)) {
                log('Found patient with medicalId in extension:', patientByEmail.id);
                recoverySuccessful = true;
                recoveredPatientId = patientByEmail.id;
              }
            }
          } catch (parseError) {
            log('Error parsing extension for patient:', patientByEmail.id, parseError);
          }
        }
        
        // If we still haven't found a match, try a broader search
        if (!recoverySuccessful) {
          // Look for any patient with this medical ID in their extension
          const patientsWithExtension = await prisma.patient.findMany({
            select: { id: true, email: true, extension: true }
          });
          
          // Manual check for medicalId in extension JSON for all patients
          for (const p of patientsWithExtension) {
            // Skip if email doesn't match - extra security check
            if (p.email !== requestData.recoveryEmail) continue;
            
            try {
              const extension = typeof p.extension === 'string' 
                ? JSON.parse(p.extension) 
                : p.extension;
                
              if (extension && (extension.medicalId === requestData.medicalId || 
                  JSON.stringify(extension).includes(requestData.medicalId))) {
                log('Found patient by medical ID in extension:', p.id);
                recoverySuccessful = true;
                recoveredPatientId = p.id;
                break;
              }
            } catch (err) {
              log('Error parsing extension for patient:', p.id, err);
            }
          }
        }
        
        // Log final recovery result
        if (recoverySuccessful) {
          log('Session recovery successful, found patient:', recoveredPatientId);
        } else {
          log('Session recovery failed, patient not found with provided recovery information');
        }
      } catch (recoveryError) {
        log('Error during session recovery attempt:', recoveryError);
      }
    }

    // Log detailed info about the recovery attempt
    log('Recovery status:', {
      recoveryAttempted,
      recoverySuccessful,
      recoveredPatientId,
      hasSession: !!patientSession,
      sessionLoggedIn: patientSession?.isLoggedIn,
      recoveryEmail: requestData.recoveryEmail,
      hasMedicalId: !!requestData.medicalId,
      isRecoveryAttempt: requestData.isRecoveryAttempt
    });
    
    // If this is an explicit recovery attempt (set by frontend), try harder to succeed
    if (requestData.isRecoveryAttempt && requestData.recoveryEmail && requestData.medicalId) {
      // For explicit recovery attempts, try to find existing patient by email first to prevent duplicates
      if (!recoverySuccessful && requestData.recoveryEmail) {
        log('Checking for existing patient with email before creating new one');
        try {
          // First check if a patient already exists with this email
          const existingPatient = await prisma.patient.findFirst({
            where: { email: requestData.recoveryEmail }
          });
          
          if (existingPatient) {
            log('Found existing patient with same email:', existingPatient.id);
            recoverySuccessful = true;
            recoveredPatientId = existingPatient.id;
          } else {
            // No existing patient found, create a new one
            log('No existing patient found with email, creating new patient');
            
            // Generate a unique medical number
            const medicalNumber = `P${Math.floor(10000 + Math.random() * 90000)}`;
            
            // Create a new patient with the recovery email and required fields
            const newPatient = await prisma.patient.create({
              data: {
                email: requestData.recoveryEmail,
                extension: JSON.stringify({ medicalId: requestData.medicalId }),
                // Required fields based on Prisma schema
                gender: requestData.basicDetails?.gender || 'unknown',
                birthDate: requestData.basicDetails?.dateOfBirth 
                  ? new Date(requestData.basicDetails.dateOfBirth) 
                  : new Date(),
                medicalNumber: medicalNumber,
                name: JSON.stringify({ text: requestData.basicDetails?.fullName || 'Patient' })
              }
            });
            log('Created new patient as part of recovery:', newPatient.id);
            recoverySuccessful = true;
            recoveredPatientId = newPatient.id;
          }
        } catch (createError) {
          log('Failed during patient lookup/creation:', createError);
        }
      }
    }
    
    // UPDATED APPROACH: In onboarding flow, we'll try to complete onboarding even if session is expired
    // We'll only return auth error if we have no session AND recovery failed
    if (!patientSession && !recoverySuccessful) {
      log('Authentication failed: No valid patient session and recovery failed/not attempted');
      return NextResponse.json(
        { 
          error: "Not authenticated and recovery failed. Please login again with your email and medical ID.",
          recoveryAttempted,
          recoveryEmail: requestData.recoveryEmail || null,
          hasMedicalId: !!requestData.medicalId
        },
        { status: 401 }
      );
    }
    
    // If session is expired but recovery succeeded, log this important event
    if ((!patientSession || !patientSession.isLoggedIn) && recoverySuccessful) {
      log('IMPORTANT: Session expired but recovery succeeded! Continuing with onboarding completion');
    }
    
    // Use the patient ID from either the session or recovery
    const patientId = recoverySuccessful ? recoveredPatientId : (patientSession ? patientSession.id : null);
    
    // Additional safety check
    if (!patientId) {
      log('Fatal error: No valid patient ID found after authentication/recovery checks');
      return NextResponse.json(
        { error: "Unable to identify patient. Please log in again." },
        { status: 401 }
      );
    }

    // We already parsed the body as requestData above, so no need to parse it again
    // Just make sure we have the required fields
    log('Validating onboarding data');
    
    // Validate medical ID
    if (!requestData.medicalId) {
      log('Medical ID is missing in request data');
      return NextResponse.json(
        { error: "Medical ID is required" },
        { status: 400 }
      );
    }
    
    log('Looking up patient with ID:', patientId);

    // Try to fetch existing patient record
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      select: {
        id: true,
        email: true,
        name: true,
        extension: true,
        medicalHistory: true,
        contact: true,
        phone: true, // Make sure we select the phone field
        medicalNumber: true // Critical: Include the medical number (PHN) field
      }
    });

    if (!patient) {
      log(`Patient record not found for ID: ${patientId}`);
      return NextResponse.json(
        { error: "Patient record not found. Your session may be invalid." },
        { status: 404 }
      );
    }

    log('Found patient record:', {
      id: patient.id,
      hasEmail: !!patient.email,
      hasExtension: !!patient.extension
    });

    // Parse existing JSON fields - with safety checks
    let extensionData: Record<string, any> = {};
    let medicalHistoryData: Record<string, any> = {};
    let contactData: Record<string, any> = {};
    let nameData: any[] = [];
    
    try {
      // Parse extension data (with fallback to empty object)
      if (patient.extension) {
        if (typeof patient.extension === 'string') {
          try {
            extensionData = JSON.parse(patient.extension);
            log('Successfully parsed extension data from string');
          } catch (e) {
            log('Failed to parse extension data, using empty object');
          }
        } else if (typeof patient.extension === 'object') {
          extensionData = patient.extension;
          log('Using extension data from object directly');
        }
      }
      
      // Check if medicalId exists in extension - this is critical for PHN consistency
      if (!extensionData.medicalId && patient.medicalNumber) {
        log('Adding missing medicalId from medicalNumber:', patient.medicalNumber);
        extensionData.medicalId = patient.medicalNumber;
      }
      
      // Parse medical history data (with fallback to empty object)
      if (patient.medicalHistory) {
        if (typeof patient.medicalHistory === 'string') {
          try {
            medicalHistoryData = JSON.parse(patient.medicalHistory);
          } catch (e) {
            log('Failed to parse medical history data, using empty object');
          }
        } else if (typeof patient.medicalHistory === 'object') {
          medicalHistoryData = patient.medicalHistory;
        }
      }
      
      // Parse contact data (with fallback to empty object)
      if (patient.contact) {
        if (typeof patient.contact === 'string') {
          try {
            contactData = JSON.parse(patient.contact);
          } catch (e) {
            log('Failed to parse contact data, using empty object');
          }
        } else if (typeof patient.contact === 'object') {
          contactData = patient.contact;
        }
      }
      
      // Parse name data (with fallback to empty array)
      if (patient.name) {
        if (typeof patient.name === 'string') {
          try {
            nameData = JSON.parse(patient.name);
            if (!Array.isArray(nameData)) {
              nameData = []; // Ensure nameData is always an array
            }
          } catch (e) {
            log('Failed to parse name data, using empty array');
            nameData = [];
          }
        } else if (Array.isArray(patient.name)) {
          nameData = patient.name;
        }
      }
      
      log('Successfully parsed existing patient data');
    } catch (parseError) {
      log('Error parsing existing patient data:', parseError);
      return NextResponse.json(
        { error: "Error processing existing patient data" },
        { status: 500 }
      );
    }

    log('Updating patient data with onboarding information');
    
    // Keep existing extension data and add/update new fields
    extensionData.onboardingCompleted = true;
    
    // CRITICAL FIX: Store the medical ID from onboarding into extension data
    // We'll update the medicalNumber field later when constructing updateData
    if (requestData.medicalId) {
      // Store the medicalId from onboarding in the extension data
      extensionData.medicalId = requestData.medicalId;
      log('Storing medicalId in extension data:', requestData.medicalId);
      // Note: We update the actual medicalNumber field later in the update operation
    } else if (!extensionData.medicalId && patient.medicalNumber) {
      // Fallback to the patient's medical number if medicalId is missing
      log('Using patient medicalNumber as medicalId fallback:', patient.medicalNumber);
      extensionData.medicalId = patient.medicalNumber;
    }
    
    // Other extension data
    if (requestData.qrCode) {
      extensionData.qrCode = requestData.qrCode;
    }
    
    if (!extensionData.registrationDate) {
      extensionData.registrationDate = new Date().toISOString();
    }
    
    // Log the extension data for debugging
    log('Updated extension data:', extensionData);
    
    // Add health information from onboarding
    if (requestData.healthInfo) {
      medicalHistoryData.allergies = requestData.healthInfo.allergies || [];
      medicalHistoryData.chronicConditions = requestData.healthInfo.chronicConditions || [];
      medicalHistoryData.bloodGroup = requestData.healthInfo.bloodGroup || 'Unknown';
      medicalHistoryData.organDonor = requestData.healthInfo.organDonor !== undefined ? requestData.healthInfo.organDonor : (medicalHistoryData.organDonor || false);
    }
    
    // Add emergency contact details
    if (requestData.emergencyContact) {
      contactData.emergency = {
        name: requestData.emergencyContact.name || '',
        relationship: requestData.emergencyContact.relationship || '',
        phone: requestData.emergencyContact.phone || ''
      };
    }
    
    // Add or update name information from basic details
    if (requestData.basicDetails && requestData.basicDetails.fullName) {
      const names = requestData.basicDetails.fullName.split(' ');
      const firstName = names[0] || '';
      const lastName = names.length > 1 ? names.slice(1).join(' ') : '';
      
      // FHIR-compliant name structure
      const nameObject = {
        use: 'official',
        family: lastName,
        given: [firstName]
      };
      
      if (nameData.length > 0) {
        nameData[0] = nameObject;
      } else {
        nameData.push(nameObject);
      }
    }
    
    // Update patient record in database
    log('Saving updated patient data to database');
    let updatedPatient;
    try {
      // Make sure patient is not null at this point
      if (!patient) {
        throw new Error('Patient record is null after retrieval');
      }
      
      // Prepare phone number - safely handle patient record
      const phoneNumber = requestData.basicDetails?.phoneNumber || 
        (patient && 'phone' in patient && typeof patient.phone === 'string' ? patient.phone : undefined);

      // First, get the current patient data to ensure we preserve critical fields
      const currentPatient = await prisma.patient.findUnique({
        where: { id: patientId },
        select: {
          id: true,
          medicalNumber: true,
          // Include other fields that should never be lost during update
        }
      });
      
      if (!currentPatient) {
        throw new Error('Failed to retrieve current patient data before update');
      }
      
      log('About to update patient with ID:', patientId);
      log('Current medicalNumber:', currentPatient.medicalNumber);
      
      // Critical: Create an update that preserves the medicalNumber
      // Define update data while explicitly preserving the medicalNumber
      const updateData: any = {
        // JSON fields that get updated
        extension: JSON.stringify(extensionData),
        medicalHistory: JSON.stringify(medicalHistoryData),
        contact: JSON.stringify(contactData),
        name: JSON.stringify(nameData),
      };
      
      // Only add these fields if they exist in the request to avoid unwanted nullification
      if (phoneNumber) updateData.phone = phoneNumber;
      if (requestData.basicDetails?.email) updateData.email = requestData.basicDetails.email;
      if (requestData.basicDetails?.gender) updateData.gender = requestData.basicDetails.gender;
      if (requestData.basicDetails?.dateOfBirth) {
        updateData.birthDate = new Date(requestData.basicDetails.dateOfBirth);
      }
      if (requestData.photo) updateData.photo = requestData.photo;
      
      // CRITICAL FIX: If we have a medical ID from onboarding, use it for medicalNumber field
      // This ensures consistency between onboarding and admin panel displays
      if (extensionData.medicalId) {
        log('Setting medicalNumber to match extension.medicalId:', extensionData.medicalId);
        updateData.medicalNumber = extensionData.medicalId;
      } else {
        log('No medicalId found in extension data, preserving existing medicalNumber');
      }
      
      log('Updating patient with data:', {
        patientId,
        hasPhoneUpdate: !!phoneNumber,
        hasEmailUpdate: !!requestData.basicDetails?.email,
        extensionHasMedicalId: !!extensionData.medicalId,
        currentMedicalNumber: currentPatient.medicalNumber
      });
      
      // Update the patient record
      updatedPatient = await prisma.patient.update({
        where: { id: patientId },
        data: updateData,
        select: {
          id: true,
          email: true,
          medicalNumber: true,
          name: true,
          extension: true,
          gender: true,
          birthDate: true,
          phone: true,
          photo: true
        }
      });
      
      // Verify the medicalNumber was preserved
      log('After update - medicalNumber:', updatedPatient.medicalNumber);
      log('Patient record updated successfully');
    } catch (updateError) {
      log('Failed to update patient record:', updateError);
      return NextResponse.json(
        { error: "Failed to update patient record: " + (updateError instanceof Error ? updateError.message : String(updateError)) },
        { status: 500 }
      );
    }
    
    if (!updatedPatient) {
      log('Update successful but no patient record returned');
      return NextResponse.json(
        { error: "Failed to update patient record" },
        { status: 500 }
      );
    }
    
    // Try to send welcome email with health card details
    log('Preparing to send welcome email with health card details');
    try {
      // Parse name information from updated patient data
      let patientName = "Patient";
      let patientEmail: string | null = null;
      
      try {
        // Extract name from the updated name data
        if (nameData.length > 0) {
          const nameInfo = nameData[0];
          const firstName = nameInfo.given?.[0] || '';
          const lastName = nameInfo.family || '';
          patientName = `${firstName} ${lastName}`.trim();
          log('Extracted patient name:', patientName);
        } else if (patientSession && patientSession.firstName) {
          // Fallback to session data if available
          patientName = `${patientSession.firstName || ''} ${patientSession.lastName || ''}`.trim();
          log('Using fallback patient name from session:', patientName);
        }
      } catch (nameError) {
        log('Error extracting patient name:', nameError);
        // Use fallback name or default
        if (patientSession && patientSession.firstName) {
          patientName = `${patientSession.firstName || ''} ${patientSession.lastName || ''}`.trim() || 'Patient';
        }
      }
      
      // Get email from patient record - safely check request data and updated patient
      patientEmail = requestData.basicDetails?.email || 
        (updatedPatient && updatedPatient.email ? updatedPatient.email : null);
      
      if (patientEmail) {
        log('Sending welcome email to:', patientEmail);
        // Generate health card URL with patient email and medical ID
        const healthCardUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.example.com'}/patient/card?id=${encodeURIComponent(patientEmail || '')}&m=${encodeURIComponent(requestData.medicalId || '')}`;
        await sendWelcomeEmail({
          patientEmail,
          patientName,
          medicalId: requestData.medicalId,
          bloodGroup: requestData.healthInfo?.bloodGroup || 'Unknown',
          gender: requestData.basicDetails.gender,
          dateOfBirth: requestData.basicDetails.dateOfBirth,
          photoUrl: requestData.photo // if this is a URL to the photo
        });
        log(`Welcome email with health card sent successfully to ${patientEmail}`);
      } else {
        log('Cannot send welcome email: Patient email not found');
      }
    } catch (emailError) {
      // Log error but don't fail the request if email sending fails
      log('Error sending welcome email:', emailError);
    }
    
    // Determine the patient email for the response - from the updated patient or the request
    let patientEmail = null;
    
    if (updatedPatient && updatedPatient.email) {
      patientEmail = updatedPatient.email;
    } else if (requestData.basicDetails?.email) {
      patientEmail = requestData.basicDetails.email;
    } else if (requestData.recoveryEmail) {
      patientEmail = requestData.recoveryEmail;
    }
    
    // Verify that the essential fields were preserved
    log('Verifying critical fields after update:', {
      medicalIdInExtension: extensionData.medicalId,
      updatedPatientMedicalNumber: updatedPatient.medicalNumber,
    });
    
    // Enhanced response with more data for debugging
    log('Onboarding completed successfully');
    return NextResponse.json({
      success: true,
      message: "Patient onboarding completed successfully",
      patientId: patientId,
      email: patientEmail || undefined,
      // Include critical fields in response for verification
      medicalNumber: updatedPatient?.medicalNumber || null,
      medicalId: extensionData?.medicalId || null,
      onboardingComplete: true
    });

  } catch (error: any) {
    // Log the full error object for debugging
    log('Unhandled error during onboarding completion:', error);
    
    // Try to extract a meaningful error message
    let errorMessage = "There was an error completing your onboarding. Please try again.";
    if (error instanceof Error) {
      errorMessage = error.message;
      // Log stack trace for development debugging
      if (error.stack && process.env.NODE_ENV === 'development') {
        log('Error stack trace:', error.stack);
      }
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else if (error && typeof error === 'object' && 'message' in error) {
      errorMessage = String(error.message);
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  } finally {
    log('Onboarding API call completed');
    // No need to disconnect Prisma in NextJS API routes as connections are pooled
  }
}
