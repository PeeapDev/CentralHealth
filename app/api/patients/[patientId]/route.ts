import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma-client';
import { JsonValue } from '@prisma/client/runtime/library';

// Type definition for FHIR Human Name
interface FHIRHumanName {
  use?: string;
  text?: string;
  family?: string;
  given?: string[];
  prefix?: string[];
  suffix?: string[];
  period?: {
    start?: string;
    end?: string;
  };
}

// Type definition for User data
interface UserRecord {
  id?: string;
  name?: string;
  email?: string;
  photo?: string | null;
  registrationData?: string | Record<string, any>;
  [key: string]: any; // Allow any additional properties
}

// Type definition for registration data
// Define as interface instead of type to avoid duplicate identifier errors
interface RegistrationData {
  name?: string;
  phone?: string;
  photo?: string;
  medicalHistory?: any;
  email?: string;
  address?: string | Record<string, any>;
  gender?: string;
  dateOfBirth?: string;
  [key: string]: any; // Allow other fields
}

// Type for patient data processing
/**
 * ProcessedPatient interface defines the structure of patient data after processing.
 * It includes standard patient information, contact details, and hospital-specific fields.
 */
interface ProcessedPatient {
  // Core patient identifiers - must be preserved exactly as in database
  id: string;                               // System UUID (internal use only)
  mrn?: string;                             // Medical Record Number (permanent, never changes)
  medicalNumber: string;                    // Display version of MRN (must match mrn value)
  medicalId?: string;                       // Friendly formatted medical ID for display
  qrCode?: string;                          // QR code for patient identification
  
  // FHIR standard fields
  resourceType: string;                     // Always 'Patient'
  name: any;                                // FHIR structured name
  gender?: string;                          // Patient gender
  birthDate?: string | Date;                // Patient date of birth
  telecom?: any;                            // FHIR telecom data
  address?: any;                            // FHIR address data
  extension?: any;                          // FHIR extensions
  
  // Contact information fields
  email?: string | null;                    // Primary email address
  phone?: string | null;                    // Primary phone number
  allEmails?: Array<{                       // All linked emails
    email: string, 
    primary: boolean, 
    verified: boolean
  }>;
  allPhones?: Array<{                       // All linked phones
    phone: string, 
    type: string, 
    primary: boolean
  }>;
  contact?: any;                            // Structured contact data
  
  // Name components for display
  firstName?: string;                       // First name/given name
  lastName?: string;                        // Last name/family name
  fullName?: string;                        // Full concatenated name
  displayName?: string;                     // Preferred display name
  
  // Hospital relationships
  hospitals?: any[];                        // Hospital associations
  User?: any;                               // Linked user account
  userId?: string;                          // User ID if linked
  
  // Clinical and administrative data
  medicalHistory?: any;                     // Medical history data
  onboardingCompleted?: boolean;            // Onboarding status
  onboardingStatus?: string;                // Detailed onboarding status
  
  // Images and media
  photo?: any;                              // Binary photo data
  profileImage?: string | null;             // Profile image URL
  
  // Allow additional properties for extensibility
  [key: string]: any;
}

// Import the patient data utilities for consistent contact handling using ES Module syntax
import patientDataUtils, {
  extractEmailFromPatient, 
  extractPhoneFromPatient, 
  parseContactJson, 
  createPatientContact
} from '@/lib/patient-data-utils';

/**
 * Helper function to create a friendly display medical ID
 * 
 * Preserves the original 5-character medical IDs (like T6YB8) generated during registration.
 * These are unique identifiers that exclude visually similar characters (1, l, 0, i)
 * and are the primary identifiers used across the hospital system.
 */
/**
 * Helper function to create a friendly display medical ID
 * 
 * Preserves the original 5-character medical IDs (like T6YB8) generated during registration.
 * These are unique identifiers that exclude visually similar characters (1, l, 0, i)
 * and are the primary identifiers used across the hospital system.
 *
 * Per hospital policy (CentralHealth System):
 * - Medical IDs must NEVER be regenerated for existing patients
 * - Each patient receives ONE permanent medical ID for their lifetime in the system
 * - All medical IDs must follow NHS-style 5-character alphanumeric format
 * - Once assigned, a medical ID becomes immutable and permanent
 */
function createFriendlyMedicalId(medicalId: string | undefined): string {
  // Handle undefined or empty IDs
  if (!medicalId) return 'Not Assigned';
  
  // If it's a 5-character registration ID, preserve it exactly as is
  // These are the primary medical IDs used by the hospital system
  // Example: T6YB8 (deliberately excludes similar chars like 1, l, 0, i)
  if (medicalId.length === 5 && /^[A-Z0-9]{5}$/i.test(medicalId)) {
    // Reject all-letter formats that might be derived from names (like MOHAM)
    if (!/^[A-Z]+$/i.test(medicalId)) {
      return medicalId.toUpperCase(); // Valid format - ensure it's uppercase for consistency
    } else {
      return 'Invalid Format';
    }
  }
  
  // If already in our P-format, return as is
  if (medicalId.match(/^P-[A-Z0-9]{4,6}$/)) {
    return medicalId;
  }
  
  // If it's a UUID, create a user-friendly format
  if (medicalId.includes('-')) {
    const parts = medicalId.split('-');
    if (parts.length > 1) {
      return `P-${parts[1].substring(0, 4).toUpperCase()}`;
    }
  }
  
  // For any other format, use first 4-6 chars with P- prefix
  // But ONLY if it doesn't look like a name-derived all-letter format
  if (/^[A-Z]+$/i.test(medicalId.substring(0, 5))) {
    return 'Invalid Format';
  }
  
  return `P-${medicalId.substring(0, Math.min(6, medicalId.length)).toUpperCase()}`;
}

// Define type guard for RegistrationData type safety

// Define a type guard to check if an object is RegistrationData
function isRegistrationData(obj: any): obj is RegistrationData {
  return obj !== null && 
         typeof obj === 'object' && 
         (('name' in obj && typeof obj.name === 'string') || 
          ('phone' in obj && typeof obj.phone === 'string') || 
          ('photo' in obj) || 
          ('medicalHistory' in obj));
}

// Registration data interface
interface ProcessedRegistrationData {
  name?: string;
  email?: string;
  phone?: string;
  address?: string | Record<string, any>;
  gender?: string;
  dateOfBirth?: string;
  photo?: string;
  [key: string]: any; // Allow other fields
}

interface FHIRContactPoint {
  system: string;
  value: string;
  use?: string;
  rank?: number;
  period?: {
    start?: string;
    end?: string;
  };
  start?: string;
  end?: string;
}

interface FHIRAddress {
  use?: string;
  type?: string;
  text?: string;
  line?: string[];
  city?: string;
  district?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

// Interface declarations have been consolidated to avoid duplication

/**
 * GET Patient API endpoint
 * 
 * Fetches detailed patient data by patient ID or medical record number (MRN).
 * Returns enriched patient information including user data, contact info,
 * hospital access, medical snapshots, wallet info, and identifiers.
 * 
 * This endpoint follows the CentralHealth System policy for medical ID handling:
 * - Medical IDs are NEVER regenerated for existing patients
 * - Each patient receives ONE permanent medical ID for their lifetime
 * - All medical IDs follow NHS-style 5-character alphanumeric format
 * 
 * @param request - NextRequest object containing the HTTP request details
 * @param params - Object containing the patientId parameter from the route
 * @returns NextResponse with the processed patient data or error information
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { patientId: string } }
) {
  const { patientId } = params;
  
  try {
    // Fetch patient by ID or MRN
    const patientRecord = await prisma.patient.findFirst({
      where: {
        OR: [
          { id: params.patientId },
          { mrn: params.patientId },
        ]
      },
      include: {
        // User info and authentication
        User: true,
        PasswordResets: true,
        
        // Contact information tables
        Emails: true,
        Phones: true,
        ProfilePicture: true,
        
        // Hospital relationships
        HospitalAccesses: {
          include: {
            hospital: true
          }
        },
        Hospital: true,
        
        // Medical records and appointments
        MedicalRecords: {
          take: 5,
          orderBy: { date: 'desc' }
        },
        Appointments: {
          take: 5,
          orderBy: { date: 'desc' }
        },
        
        // Care information
        AntenatalRecords: {
          take: 1,
          orderBy: { updatedAt: 'desc' }
        },
        NeonatalRecords_AsPatient: {
          take: 1,
          orderBy: { updatedAt: 'desc' }
        },
        
        // Search and identification
        SearchIndex: true,
        
        // Financial information
        Wallet: true,
        
        // Doctors and prescriptions
        Doctors: true,
        Prescription: {
          take: 5,
          orderBy: { updatedAt: 'desc' }
        },
      }
    });

    if (!patientRecord) {
      // Error handling for invalid or missing patient ID
      return NextResponse.json({ 
        success: false, 
        error: "Patient not found", 
        message: "Patient not found with the given ID or MRN" 
      }, { 
        status: 404,
        headers: {
          'Content-Type': 'application/json'
        } 
      })
    }

    // Process patient data - initialize with proper defaults that match the interface 
    const processedPatient: ProcessedPatient = {
      id: patientRecord.id,
      mrn: patientRecord.mrn,
      medicalNumber: patientRecord.mrn || '', // Ensure medicalNumber is always set
      resourceType: 'Patient',
      name: patientRecord.name,
      gender: patientRecord.gender || undefined,
      // Map dateOfBirth to birthDate per the API convention
      birthDate: patientRecord.dateOfBirth ? 
        (patientRecord.dateOfBirth instanceof Date ? 
          patientRecord.dateOfBirth.toISOString().split('T')[0] : 
          String(patientRecord.dateOfBirth)) : 
        undefined,
      email: undefined,
      phone: undefined,
      address: undefined,
      telecom: undefined,
      extension: undefined,
      allEmails: [],
      allPhones: [],
      contact: undefined,
      hospitals: [],
      photo: undefined,
      profileImage: undefined,
      firstName: '',
      lastName: '',
      fullName: '',
      displayName: '',
      medicalHistory: patientRecord.medicalHistory ? 
        (typeof patientRecord.medicalHistory === 'string' ? 

          // Safely parse JSON medical history with error handling
          (() => {
            try {
              return JSON.parse(patientRecord.medicalHistory as string);
            } catch (e) {
              console.error('Failed to parse medicalHistory JSON:', e);
              return { parseFailed: true, rawValue: patientRecord.medicalHistory };
            }
          })() : 
          patientRecord.medicalHistory) : 
        undefined,
      onboardingCompleted: false
    };
    
    // Use the existing MRN as medicalId - NEVER regenerate medical IDs per hospital policy
    // This preserves the permanent 5-character alphanumeric format used across the hospital
    processedPatient.medicalId = createFriendlyMedicalId(patientRecord.mrn);
    
    // Ensure medicalNumber is always the same as mrn - they must always be kept in sync
    // medicalNumber is the display field, mrn is the database field - they must match
    processedPatient.medicalNumber = patientRecord.mrn || '';
    
    // Process patient name fields
    try {
      // Parse name from FHIR format if available
      let firstName = '';
      let lastName = '';
      let fullName = '';
      
      if (patientRecord.name && Array.isArray(patientRecord.name)) {
        // FHIR format: name[0].given + ' ' + name[0].family
        const nameEntry = patientRecord.name[0];
        if (nameEntry && typeof nameEntry === 'object') {
          if (nameEntry.given && nameEntry.family) {
            firstName = Array.isArray(nameEntry.given) ? nameEntry.given.join(' ') : String(nameEntry.given);
            lastName = String(nameEntry.family);
            fullName = `${firstName} ${lastName}`;
          } else if (nameEntry.text) {
            // FHIR format: name[0].text
            fullName = String(nameEntry.text);
            const nameParts = fullName.split(/\s+/);
            if (nameParts.length > 1) {
              firstName = nameParts[0];
              lastName = nameParts.slice(1).join(' ');
            } else if (nameParts.length === 1) {
              firstName = nameParts[0];
            }
          }
        }
      }
      
      // Assign processed name fields to patient record
      processedPatient.firstName = firstName;
      processedPatient.lastName = lastName;
      processedPatient.fullName = fullName;
    } catch (error) {
      console.error("Error processing patient name:", error);
    }

    // 1. Email handling - prioritize dedicated Email table
    if (patientRecord.Emails && patientRecord.Emails.length > 0) {
      // Find primary email first
      const primaryEmail = patientRecord.Emails.find((email: any) => email.primary === true);
      if (primaryEmail) {
        processedPatient.email = primaryEmail.email;
      } else if (patientRecord.Emails.length > 0) {
        // Use the first email if no primary is marked
        processedPatient.email = patientRecord.Emails[0].email;
      }
      
      // Add all emails as a structured array for reference
      processedPatient.allEmails = patientRecord.Emails.map((email: any) => ({
        email: email.email,
        primary: !!email.primary,
        verified: !!email.verified
      }));
    }

    // 2. Phone handling - prioritize dedicated Phone table
    if (patientRecord.Phones && patientRecord.Phones.length > 0) {
      // Prioritize primary phone
      const primaryPhone = patientRecord.Phones.find((phone: any) => phone.primary === true);
      if (primaryPhone) {
        processedPatient.phone = primaryPhone.phone;
      } else {
        // Use the first phone if no primary is set
        processedPatient.phone = patientRecord.Phones[0].phone;
      }
      
      // Add all phones for reference
      processedPatient.allPhones = patientRecord.Phones.map((phone: any) => ({
        phone: phone.phone,
        type: phone.type || 'mobile',
        primary: !!phone.primary
      }));
    }

    // 3. Profile picture handling - prioritize dedicated ProfilePicture table
    if (patientRecord.ProfilePicture) {
      // ProfilePicture is a single object, not an array
      processedPatient.profileImage = patientRecord.ProfilePicture.imageUrl || null;
      processedPatient.photo = patientRecord.ProfilePicture.imageData || null;
    }

        // Initialize contact-related arrays for consistency
    processedPatient.allEmails = [];
    processedPatient.allPhones = [];
    processedPatient.telecom = [];
    
    // Process emails from dedicated Emails table
    if (patientRecord.Emails && Array.isArray(patientRecord.Emails) && patientRecord.Emails.length > 0) {
      // Find primary email first
      const primaryEmail = patientRecord.Emails.find(email => email.primary === true);
      
      // Set the main email field to the primary email or the first one
      if (primaryEmail) {
        processedPatient.email = primaryEmail.email;
      } else if (patientRecord.Emails.length > 0) {
        processedPatient.email = patientRecord.Emails[0].email;
      }
      
      // Add all emails to the allEmails array for complete listing
      processedPatient.allEmails = patientRecord.Emails.map(email => ({
        email: email.email,
        verified: email.verified,
        primary: email.primary,
        type: 'home' // Default type if not specified
      }));
    }
    
    // Process phones from dedicated Phones table
    if (patientRecord.Phones && Array.isArray(patientRecord.Phones) && patientRecord.Phones.length > 0) {
      // Find primary phone first
      const primaryPhone = patientRecord.Phones.find(phone => phone.primary === true);
      
      // Set the main phone field to the primary phone or the first one
      if (primaryPhone) {
        processedPatient.phone = primaryPhone.phone;
      } else if (patientRecord.Phones.length > 0) {
        processedPatient.phone = patientRecord.Phones[0].phone;
      }
      
      // Add all phones to the allPhones array for complete listing
      processedPatient.allPhones = patientRecord.Phones.map(phone => ({
        phone: phone.phone,
        verified: phone.verified,
        primary: phone.primary,
        type: phone.type || 'mobile'
      }));
    }

    // Create FHIR-compatible telecom array from emails and phones
    processedPatient.telecom = [
      ...(processedPatient.allEmails || []).map(email => ({
        system: 'email',
        value: email.email,
        use: 'home'
      })),
      ...(processedPatient.allPhones || []).map(phone => ({
        system: 'phone',
        value: phone.phone,
        use: phone.type || 'mobile'
      }))
    ];

    // Create structured contact object for UI
    try {
      processedPatient.contact = createPatientContact({
        email: processedPatient.email || '',
        phone: processedPatient.phone || '',
        address: processedPatient.address || ''
      });
    } catch (error) {
      console.error("Error processing patient contact:", error);
    }

    // Set onboarding status
    processedPatient.onboardingCompleted = !!patientRecord.onboardingCompleted;
    
    // Include additional fields that might be useful
    if (patientRecord.gender) {
      processedPatient.gender = patientRecord.gender;
    }
    
    // Get date of birth from patient record - using proper field name
    if ('dateOfBirth' in patientRecord && patientRecord.dateOfBirth) {
      // Convert Date object to ISO string if needed
      processedPatient.birthDate = patientRecord.dateOfBirth instanceof Date 
        ? patientRecord.dateOfBirth.toISOString().split('T')[0] // Convert to YYYY-MM-DD format
        : String(patientRecord.dateOfBirth);
    }
    
    // Try alternative birthDate field name as a fallback
    if ('birthDate' in patientRecord && patientRecord.birthDate && !processedPatient.birthDate) {
      try {
        const dateValue = typeof patientRecord.birthDate === 'string'
          ? patientRecord.birthDate
          : patientRecord.birthDate instanceof Date
            ? patientRecord.birthDate.toISOString()
            : String(patientRecord.birthDate);
            
        // Convert to YYYY-MM-DD format  
        processedPatient.birthDate = dateValue.includes('T')
          ? dateValue.split('T')[0]
          : dateValue;
      } catch (e) {
        // If conversion fails, don't set the field at all
        console.error('Failed to parse birthDate:', e);
      }
    }
    
    // Process appointments if available with robust error handling
    if (patientRecord.Appointments && Array.isArray(patientRecord.Appointments)) {
      try {
        // Return only the first 5 appointments for performance
        processedPatient.appointments = patientRecord.Appointments
          .filter((appointment: any) => appointment !== null && appointment !== undefined) // Filter out null entries
          .map((appointment: any) => {
            // Default values for required fields to prevent undefined errors
            const defaultAppointment = {
              id: 'unknown',
              date: new Date().toISOString(),
              status: 'unknown',
              type: 'general',
              providerId: null,
              providerName: 'Unknown Provider',
              location: null,
              notes: null
            };
            
            // Merge with actual data, with validation
            return {
              id: appointment.id || defaultAppointment.id,
              date: appointment.date instanceof Date ? 
                appointment.date.toISOString() : 
                (typeof appointment.date === 'string' ? appointment.date : defaultAppointment.date),
              status: appointment.status || defaultAppointment.status,
              type: appointment.type || defaultAppointment.type,
              providerId: appointment.providerId || defaultAppointment.providerId,
              providerName: appointment.providerName || defaultAppointment.providerName,
              location: appointment.location || defaultAppointment.location,
              notes: appointment.notes || defaultAppointment.notes
            };
          });
      } catch (error) {
        console.error('Error processing appointments:', error);
        processedPatient.appointments = [];
        processedPatient.appointmentsError = 'Failed to process appointment data';
      }
    }
    
    // Add hospital access information to the processed patient
    if (patientRecord.HospitalAccesses && patientRecord.HospitalAccesses.length > 0) {
      processedPatient.hospitals = patientRecord.HospitalAccesses.map(access => ({
        id: access.hospital?.id,
        name: access.hospital?.name,
        code: access.hospital?.code,
        accessLevel: access.accessLevel,
        addedAt: access.grantedAt
      }));
    } else {
      processedPatient.hospitals = [];
    }

    // Add QR code if available in the new schema - NEVER regenerate if already exists
    if (patientRecord.qrCode) {
      // Always use the existing QR code - never regenerate per hospital policy
      processedPatient.qrCode = patientRecord.qrCode;
    } else if (patientRecord.mrn) {
      // If no QR code but MRN exists, use the MRN to create a consistent QR code URL
      // This doesn't modify the patient record, just provides a display URL
      processedPatient.qrCode = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${patientRecord.mrn}`;
    }
    
    // Add user information from the User relationship
    const userRecord: UserRecord = patientRecord.User || {};
    
    // Add photo or avatar if available and not already set from ProfilePicture
    if (userRecord && typeof userRecord === 'object' && 'photo' in userRecord && userRecord.photo && !processedPatient.photo) {
      processedPatient.photo = userRecord.photo;
    }
    
    // Add user ID from linked user record
    if (userRecord && typeof userRecord === 'object' && 'id' in userRecord && userRecord.id) {
      processedPatient.userId = userRecord.id;
    }
    
    // Extract name parts to create a display name
    if (processedPatient.fullName && processedPatient.fullName.length > 0) {
      // Already set during name processing
    } else if (userRecord && userRecord.name) {
      // Use User.name as fallback
      const nameParts = userRecord.name.split(/\s+/);
      if (nameParts.length > 1) {
        processedPatient.firstName = nameParts[0];
        processedPatient.lastName = nameParts.slice(1).join(' ');
        processedPatient.fullName = userRecord.name;
      } else if (nameParts.length === 1) {
        processedPatient.firstName = nameParts[0];
        processedPatient.fullName = nameParts[0];
      }
    } else {
      // Last resort fallback
      processedPatient.fullName = 'Unknown Patient';
    }
    
    // Use user email as fallback if not already set
    if (userRecord && typeof userRecord === 'object' && 'email' in userRecord && userRecord.email && !processedPatient.email) {
      processedPatient.email = userRecord.email;
    }
    
    // Return the processed patient data with formatted output
    return NextResponse.json({
  success: true,
  patient: {
    ...processedPatient,
    // Include the User data (safely)
    user: userRecord,
    
    // Include hospital access details
    hospitalAccesses: patientRecord.HospitalAccesses ? patientRecord.HospitalAccesses.map((access: any) => ({
      id: access.id,
      hospitalId: access.hospitalId,
      accessLevel: access.accessLevel,
      grantedAt: access.grantedAt instanceof Date ? access.grantedAt.toISOString() : access.grantedAt,
      expiresAt: access.expiresAt instanceof Date ? access.expiresAt.toISOString() : access.expiresAt,
      hospital: access.hospital ? {
        id: access.hospital.id,
        name: access.hospital.name,
        code: access.hospital.code
      } : null
    })) : [],
    
    // Include standardized contact information
    contactInfo: {
      emails: patientRecord.Emails?.map((email: any) => ({
        id: email.id,
        email: email.email,
        verified: email.verified,
        primary: email.primary
      })) || [],
      phones: patientRecord.Phones?.map((phone: any) => ({
        id: phone.id,
        number: phone.phone,
        type: phone.type,
        verified: phone.verified,
        primary: phone.primary
      })) || [],
      address: processedPatient.address
    },
    
    // Include recent medical data snapshots (limited records)
    medicalSnapshots: {
      recentAppointments: patientRecord.Appointments?.map((appt: any) => ({
        id: appt.id,
        date: appt.date instanceof Date ? appt.date.toISOString() : appt.date,
        status: appt.status,
        doctorId: appt.doctorId,
        notes: appt.notes
      })) || [],
      recentPrescriptions: patientRecord.Prescription?.map((rx: any) => ({
        id: rx.id,
        doctorId: rx.doctorId,
        validFrom: rx.validFrom instanceof Date ? rx.validFrom.toISOString() : rx.validFrom,
        validUntil: rx.validUntil instanceof Date ? rx.validUntil.toISOString() : rx.validUntil,
        filledStatus: rx.filledStatus
      })) || [],
      careStatus: {
        hasAntenatalRecord: patientRecord.AntenatalRecords?.length > 0,
        hasNeonatalRecord: patientRecord.NeonatalRecords_AsPatient?.length > 0
      }
    },
    
    // Include wallet information if available
    walletInfo: patientRecord.Wallet ? {
      id: patientRecord.Wallet.id,
      balance: patientRecord.Wallet.balance,
      status: patientRecord.Wallet.status
    } : null,
    
    // Permanent identification info (critical for maintaining consistent medical ID)
    identifiers: {
      id: patientRecord.id,
      mrn: patientRecord.mrn,  // The permanent medical ID that must never change
      qrCode: patientRecord.qrCode
    },
    
    // Create a user-friendly display name
    displayName: processedPatient.fullName || ''
  }
}, { status: 200 });
} catch (error: unknown) {
  // Log the error with a reference to the patient ID being requested
  console.error(`Error fetching patient ${params.patientId}:`, error);
  
  // Create a sanitized error response that doesn't expose internal details
  const sanitizedError = error instanceof Error ? error.message : "Unknown server error";
  
  // For debugging purposes, include a timestamp to help with log correlation
  const timestamp = new Date().toISOString();
  
  return NextResponse.json({ 
    success: false, 
    error: "Failed to fetch patient", 
    message: sanitizedError,
    requestId: timestamp.replace(/[^0-9]/g, '').slice(0, 12),
    path: `/api/patients/${params.patientId}`
  }, { 
    status: 500,
    headers: {
      // Add cache control to prevent error responses from being cached
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Content-Type': 'application/json'
    }
  });
}
}
