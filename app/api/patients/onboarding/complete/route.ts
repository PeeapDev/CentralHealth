import { NextRequest, NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";
import { getPatientSession } from "@/lib/patient-session";
import { sendWelcomeEmail } from "@/lib/email";
import { JsonValue } from '@prisma/client/runtime/library';

const DEBUG = true;
function log(...args: unknown[]) {
  if (DEBUG) {
    console.log('[ONBOARDING_API]', ...args);
  }
}

interface OnboardingRequestData {
  basicDetails?: {
    fullName?: string;
    gender?: string;
    dateOfBirth?: string;
    phoneNumber?: string;
    email?: string;
  };
  healthInfo?: {
    allergies?: string[];
    chronicConditions?: string[];
    bloodGroup?: string;
    organDonor?: boolean;
  };
  emergencyContact?: {
    name?: string;
    relationship?: string;
    phone?: string;
  };
  medicalId?: string;
  qrCode?: string;
  recoveryEmail?: string;
  photo?: string;
  isRecoveryAttempt?: boolean;
}

interface ContactEntry {
  system?: string;
  value?: string;
  use?: string;
  name?: string;
  relationship?: string;
}

function extractEmailFromContact(contactJson: JsonValue | null): string {
  if (!contactJson) return '';
  
  try {
    // Parse string JSON or use the value directly
    const contactData = typeof contactJson === 'string' 
      ? JSON.parse(contactJson) as unknown 
      : contactJson;
    
    // Handle array format (newer format)
    if (Array.isArray(contactData)) {
      // Need to cast array elements to expected shape
      const typedArray = contactData as ContactEntry[];
      const emailEntry = typedArray.find(entry => entry?.system === 'email');
      return emailEntry?.value || '';
    }
    
    // Handle object format (legacy format)
    const contactObject = contactData as Record<string, unknown>;
    return (contactObject.email as string) || '';
  } catch (error) {
    log('Error parsing contact JSON:', error);
    return '';
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    log('Starting onboarding completion process');
    
    const requestData: OnboardingRequestData = await req.json().catch((parseError: Error) => {
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
    
    const patientSession = await getPatientSession();
    log('Patient session:', patientSession ? {
      id: patientSession.id,
      email: patientSession.email,
      isLoggedIn: patientSession.isLoggedIn
    } : 'No session found');

    let recoveryAttempted = false;
    let recoverySuccessful = false;
    let recoveredPatientId = null;
    
    if (requestData.recoveryEmail && requestData.medicalId) {
      log('Attempting session recovery');
      recoveryAttempted = true;
      
      try {
        const patientByEmail = await prisma.patient.findFirst({
          where: { 
            contact: {
              path: ['$[*].value'],
              string_contains: requestData.recoveryEmail
            }
          },
          select: { id: true, contact: true, mrn: true }
        });
        
        if (patientByEmail && patientByEmail.mrn === requestData.medicalId) {
          log('Found patient with exact medicalId match:', patientByEmail.id);
          recoverySuccessful = true;
          recoveredPatientId = patientByEmail.id;
        }
        
        if (!recoverySuccessful) {
          // More efficient query that directly filters by email in contact JSON
          const patientByMrn = await prisma.patient.findFirst({
            where: {
              mrn: requestData.medicalId
            },
            select: { id: true, contact: true, mrn: true }
          });
          
          if (patientByMrn) {
            const patientEmail = extractEmailFromContact(patientByMrn.contact);
            if (patientEmail === requestData.recoveryEmail) {
              log('Found patient by medical ID:', patientByMrn.id);
              recoverySuccessful = true;
              recoveredPatientId = patientByMrn.id;
            }
          }
        }
        
        if (recoverySuccessful) {
          log('Session recovery successful, found patient:', recoveredPatientId);
        } else {
          log('Session recovery failed');
        }
      } catch (recoveryError: unknown) {
        log('Error during session recovery attempt:', recoveryError);
      }
    }

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
    
    if (requestData.isRecoveryAttempt && requestData.recoveryEmail && requestData.medicalId) {
      if (!recoverySuccessful && requestData.recoveryEmail) {
        log('Checking for existing patient with email');
        try {
          const existingPatient = await prisma.patient.findFirst({
            where: { 
              contact: {
                path: ['$[*].value'],
                string_contains: requestData.recoveryEmail
              }
            }
          });
          
          if (existingPatient) {
            log('Found existing patient:', existingPatient.id);
            recoverySuccessful = true;
            recoveredPatientId = existingPatient.id;
          } else {
            // Follow medical ID priority: requested medicalId > generated
            // This maintains consistency with registration flow that stores medicalId in localStorage
            const medicalNumber = requestData.medicalId || `P${Math.floor(10000 + Math.random() * 90000)}`;
            log('Using medical ID:', requestData.medicalId ? 'from request' : 'newly generated', medicalNumber);
            const newPatient = await prisma.patient.create({
              data: {
                contact: JSON.stringify([
                  { system: 'email', value: requestData.recoveryEmail },
                  { system: 'phone', value: requestData.basicDetails?.phoneNumber || '' }
                ]),
                gender: requestData.basicDetails?.gender || 'unknown',
                dateOfBirth: requestData.basicDetails?.dateOfBirth 
                  ? new Date(requestData.basicDetails.dateOfBirth) 
                  : new Date(),
                mrn: requestData.medicalId || medicalNumber,
                name: JSON.stringify({ text: requestData.basicDetails?.fullName || 'Patient' }),
                // Use a default hospital ID until we properly retrieve it from the session or other sources
                hospitalId: process.env.DEFAULT_HOSPITAL_ID || '00000000-0000-0000-0000-000000000000'
              }
            });
            log('Created new patient:', newPatient.id);
            recoverySuccessful = true;
            recoveredPatientId = newPatient.id;
          }
        } catch (createError: unknown) {
          log('Failed during patient lookup/creation:', createError);
        }
      }
    }
    
    if (!patientSession && !recoverySuccessful) {
      log('Authentication failed');
      return NextResponse.json(
        { 
          error: "Not authenticated and recovery failed. Please login again.",
          recoveryAttempted,
          recoveryEmail: requestData.recoveryEmail || null,
          hasMedicalId: !!requestData.medicalId
        },
        { status: 401 }
      );
    }
    
    if ((!patientSession || !patientSession.isLoggedIn) && recoverySuccessful) {
      log('Session expired but recovery succeeded');
    }
    
    // Use let instead of const since we might need to reassign it if we find or create a patient
    let patientId = recoverySuccessful ? recoveredPatientId : (patientSession ? patientSession.id : null);
    
    if (!patientId) {
      log('Fatal error: No valid patient ID');
      return NextResponse.json(
        { error: "Unable to identify patient. Please log in again." },
        { status: 401 }
      );
    }

    log('Validating onboarding data');
    
    if (!requestData.medicalId) {
      log('Medical ID is missing');
      return NextResponse.json(
        { error: "Medical ID is required" },
        { status: 400 }
      );
    }
    
    log('Looking up patient with ID:', patientId);

    let patient = await prisma.patient.findUnique({
      where: { id: patientId },
      select: {
        id: true,
        name: true,
        mrn: true,
        medicalHistory: true,
        contact: true,
        gender: true,
        dateOfBirth: true,
        hospitalId: true
      }
    });

    // If patient not found by ID, try to find by medical ID
    if (!patient && requestData.medicalId) {
      log('Patient not found by ID, trying to find by medicalId:', requestData.medicalId);
      patient = await prisma.patient.findFirst({
        where: {
          mrn: requestData.medicalId
        },
        select: {
          id: true,
          name: true,
          mrn: true,
          medicalHistory: true,
          contact: true,
          gender: true,
          dateOfBirth: true,
          hospitalId: true
        }
      });

      if (patient) {
        log('Found patient by medical ID:', patient.mrn);
        patientId = patient.id; // Update patientId to match found patient
      }
    }

    // Create new patient if not found
    if (!patient) {
      log('Patient record not found, creating new patient');
      const defaultHospitalId = process.env.DEFAULT_HOSPITAL_ID || '00000000-0000-0000-0000-000000000000';
      
      try {
        // Create a new patient record
        patient = await prisma.patient.create({
          data: {
            mrn: requestData.medicalId || `P${Math.floor(10000 + Math.random() * 90000)}`,
            name: JSON.stringify({
              text: requestData.basicDetails?.fullName || 'New Patient', 
              family: requestData.basicDetails?.fullName?.split(' ').pop() || '',
              given: requestData.basicDetails?.fullName?.split(' ').slice(0, -1) || []
            }),
            gender: requestData.basicDetails?.gender || 'unknown',
            dateOfBirth: requestData.basicDetails?.dateOfBirth ? 
              new Date(requestData.basicDetails.dateOfBirth) : new Date(),
            contact: JSON.stringify([
              { 
                system: 'email', 
                value: requestData.basicDetails?.email || requestData.recoveryEmail || ''
              },
              {
                system: 'phone',
                value: requestData.basicDetails?.phoneNumber || ''
              }
            ]),
            medicalHistory: JSON.stringify({}),
            hospitalId: defaultHospitalId
          },
          select: {
            id: true,
            name: true,
            mrn: true,
            medicalHistory: true,
            contact: true,
            gender: true,
            dateOfBirth: true,
            hospitalId: true
          }
        });
        patientId = patient.id;
        log('Created new patient:', patient.id, 'with mrn:', patient.mrn);
      } catch (createError) {
        log('Error creating patient:', createError);
        return NextResponse.json(
          { error: "Failed to create patient record" },
          { status: 500 }
        );
      }
    }

    log('Found patient record:', { id: patient.id, mrn: patient.mrn });

    // Update patient record with onboarding data
    const updatedPatient = await prisma.patient.update({
      where: { id: patientId },
      data: {
        name: JSON.stringify({
          text: requestData.basicDetails?.fullName || 'Patient',
          family: requestData.basicDetails?.fullName?.split(' ').pop() || '',
          given: requestData.basicDetails?.fullName?.split(' ').slice(0, -1) || []
        }),
        gender: requestData.basicDetails?.gender || patient.gender,
        // Ensure dateOfBirth is always properly converted to a Date object
        dateOfBirth: requestData.basicDetails?.dateOfBirth
          ? new Date(requestData.basicDetails.dateOfBirth)
          : (patient.dateOfBirth instanceof Date 
              ? patient.dateOfBirth 
              : new Date(patient.dateOfBirth)),

        contact: JSON.stringify([
          {
            system: 'phone',
            value: requestData.basicDetails?.phoneNumber || '',
            use: 'mobile'
          },
          {
            system: 'email',
            value: extractEmailFromContact(patient.contact) || '',
            use: 'home'
          },
          {
            system: 'phone',
            value: requestData.emergencyContact?.phone || '',
            use: 'emergency',
            name: requestData.emergencyContact?.name || '',
            relationship: requestData.emergencyContact?.relationship || ''
          }
        ]),
        // Store onboarding completion status in medicalHistory JSON
        medicalHistory: JSON.stringify({
          ...JSON.parse(typeof patient.medicalHistory === 'string' 
            ? patient.medicalHistory 
            : JSON.stringify(patient.medicalHistory || {})),
          allergies: requestData.healthInfo?.allergies || [],
          conditions: requestData.healthInfo?.chronicConditions || [],
          bloodGroup: requestData.healthInfo?.bloodGroup || 'Unknown',
          organDonor: requestData.healthInfo?.organDonor || false,
          onboardingCompleted: true,
          completedAt: new Date().toISOString()
        })
      }
    });

    log('Patient record updated successfully');

    // Send welcome email
    try {
      const patientEmail = extractEmailFromContact(patient.contact);
      if (patientEmail) {
        await sendWelcomeEmail({
          patientEmail: patientEmail,
          patientName: requestData.basicDetails?.fullName || 'Patient',
          medicalId: patient.mrn,
          gender: patient.gender,
          dateOfBirth: patient.dateOfBirth instanceof Date ? 
            patient.dateOfBirth.toISOString().split('T')[0] : 
            new Date(patient.dateOfBirth).toISOString().split('T')[0]
        });
        log('Welcome email sent successfully');
      } else {
        log('No email found in patient contact info, skipping welcome email');
      }
    } catch (emailError: unknown) {
      log('Error sending welcome email:', emailError);
    }

    return NextResponse.json(
      { 
        success: true,
        message: "Onboarding completed successfully",
        patient: {
          id: updatedPatient.id,
          medicalId: updatedPatient.mrn,
          name: requestData.basicDetails?.fullName,
          email: extractEmailFromContact(updatedPatient.contact)
        }
      },
      { status: 200 }
    );

  } catch (error) {
    log('Error in onboarding completion:', error);
    
    let errorMessage = "There was an error completing your onboarding. Please try again.";
    if (error instanceof Error) {
      errorMessage = error.message;
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
    // Connection is managed by Next.js
    log('Onboarding API call completed');
  }
}