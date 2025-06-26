import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Helper function to create a friendly display medical ID
 * 
 * Preserves the original 5-character medical IDs (like T6YB8) generated during registration.
 * These are unique identifiers that exclude visually similar characters (1, l, 0, i)
 * and are the primary identifiers used across the hospital system.
 */
function createFriendlyMedicalId(medicalId: string | undefined): string {
  if (!medicalId) return 'Not Assigned';
  
  // If it's a 5-character registration ID, preserve it exactly as is
  // But ONLY if it follows our proper format (at least one letter AND one number)
  if (medicalId.length === 5 && /^[A-Z0-9]{5}$/i.test(medicalId)) {
    // Reject all-letter formats that might be derived from names (like MOHAM)
    if (!/^[A-Z]+$/i.test(medicalId)) {
      return medicalId.toUpperCase();
    } else {
      console.warn('Rejected all-letter medical ID format:', medicalId);
      return 'Invalid Format';
    }
  }
  
  // If already in our P-format, return as is
  if (medicalId.match(/^P-[A-Z0-9]{4,6}$/)) {
    return medicalId;
  }
  
  // If it's a UUID, create a shorter, more user-friendly format
  if (medicalId.includes('-')) {
    const parts = medicalId.split('-');
    if (parts.length > 1) {
      return `P-${parts[1].substring(0, 4).toUpperCase()}`;
    }
  }
  
  // For any other format (non-UUID), use first 4-6 chars with P- prefix
  // But ONLY if it doesn't look like a name-derived all-letter format
  if (/^[A-Z]+$/i.test(medicalId.substring(0, 5))) {
    console.warn('Detected potential name-derived ID:', medicalId);
    return 'Invalid Format';
  }
  
  return `P-${medicalId.substring(0, Math.min(6, medicalId.length)).toUpperCase()}`;
}

/**
 * Debug logging utility
 */
function log(...args: any[]): void {
  console.log('[Patient Profile API]', ...args);
}

// Type definitions
type Hospital = {
  id: string;
  name: string;
  subdomain: string;
};

type Patient = {
  id: string;
  mrn: string;
  name: any;
  dateOfBirth: Date | null;
  gender: string;
  contact: any;
  medicalHistory: any;
  hospitalId: string;
  Hospital?: Hospital;
  createdAt: Date;
  updatedAt: Date;
  onboardingCompleted?: boolean;
  extension?: string | any;
  User?: any;
  user?: any;
  photo?: string;
  medicalNumber?: string;
  medicalId?: string;
  registrationData?: string | any;
  
  // For raw SQL results
  hospital_id?: string;
  hospital_name?: string;
  hospital_subdomain?: string;
};

interface ContactItem {
  system: string;
  value: string;
}

interface MedicalHistoryData {
  bloodType?: string;
  height?: string;
  weight?: string;
  address?: string;
  onboardingCompleted?: boolean;
  [key: string]: any;
}

interface PatientProfile {
  id: string;
  fullName: string;
  firstName: string;
  lastName: string;
  medicalNumber: string;
  displayMedicalNumber: string;
  email: string;
  phone: string;
  gender: string;
  dob: string;
  birthDate: Date | null;
  age: number;
  address: string;
  bloodType: string;
  height: string;
  weight: string;
  hospitalCode: string;
  hospitalName: string;
  insurance: any;
  allergies: any[];
  conditions: any[];
  medications: any[];
  onboardingCompleted: boolean;
  photo?: string;
  createdAt: Date;
  updatedAt: Date;
  [key: string]: any;
}

// GET endpoint to fetch patient profile data
export async function GET(req: NextRequest) {
  try {
    // Get search parameters
    const searchParams = req.nextUrl.searchParams;
    const userEmail = searchParams.get('email');
    const patientId = searchParams.get('patientId');
    const medicalNumber = searchParams.get('medicalNumber');
    
    log('Request parameters:', { userEmail, patientId, medicalNumber });

    // Validate inputs
    if (!userEmail && !patientId && !medicalNumber) {
      return NextResponse.json(
        { 
          error: "No patient identifier provided.",
          instructions: "Please provide either an email, patientId, or medicalNumber parameter."
        }, 
        { status: 400 }
      );
    }

    // Define standard include options for patient queries
    // Hospital relation removed as patients are managed centrally
    const includeOptions = {
      // Include any related records we need
      // No Hospital relation as it's been removed from the Patient model
      ProfilePicture: true
    };

    // --------------------------------
    // Optimized Patient Lookup Strategy
    // --------------------------------
    let patient: Patient | null = null;
    let lookupMethod = '';
    
    // Debug: Check UUID pattern for patientId to detect misuse
    if (patientId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(patientId) && 
        /^[A-Z0-9]{5}$/i.test(patientId)) {
      log('⚠️ Warning: patientId appears to be a medical number format:', patientId);
    }

    // STRATEGY 1: Direct ID lookup (most efficient - primary key)
    if (!patient && patientId) {
      log('Lookup strategy: direct ID');
      // Only use as ID if it looks like a UUID
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(patientId)) {
        patient = await prisma.patient.findUnique({
          where: { id: patientId },
          include: includeOptions
        }) as (Patient | null);
        
        if (patient) {
          lookupMethod = 'patientId (UUID)';
          log('✓ Found patient by ID lookup');
        }
      } else {
        // Try lookup by other ID fields if not a UUID
        // Attempt mrn lookup first since this appears to be a medical ID format
        patient = await prisma.patient.findFirst({
          where: { mrn: patientId },
          include: includeOptions
        }) as (Patient | null);
        
        if (patient) {
          lookupMethod = 'patientId (treated as mrn)';
          log('✓ Found patient by treating patientId as medical number');
          log('⚠️ This indicates a frontend issue - patientId should be UUID format');
        }
      }
    }

    // STRATEGY 2: Medical Number lookup (indexed field)
    if (!patient && medicalNumber) {
      log('Lookup strategy: medical number');
      patient = await prisma.patient.findFirst({
        where: { mrn: medicalNumber },
        include: includeOptions
      }) as (Patient | null);
      
      if (patient) {
        lookupMethod = 'medicalNumber';
        log('✓ Found patient by medical number lookup');
      }
    }

    // STRATEGY 3: Email lookup (most expensive, last resort)
    if (!patient && userEmail) {
      log('Lookup strategy: email in JSON (last resort)');
      
      // First try to get all matching patients to detect potential duplicates
      const rawResultsCheck = await prisma.$queryRaw`
        SELECT p.id, p.mrn, p.name
        FROM "Patient" p
        WHERE p.contact::text ILIKE ${`%${userEmail}%`}
        ORDER BY p."updatedAt" DESC
      `;
      
      // Check for duplicate patients with the same email
      if (Array.isArray(rawResultsCheck) && rawResultsCheck.length > 1) {
        log(`⚠️ CRITICAL: Found ${rawResultsCheck.length} patients with the same email: ${userEmail}`);
        log('Duplicate patients:', rawResultsCheck);
      }

      // Now do the actual detailed lookup with LIMIT 1
      // We use ORDER BY "updatedAt" DESC to get the most recently updated patient
      // Hospital table no longer related to Patient as per schema changes
      const rawResults = await prisma.$queryRaw`
        SELECT p.*
        FROM "Patient" p
        WHERE p.contact::text ILIKE ${`%${userEmail}%`}
        ORDER BY p."updatedAt" DESC
        LIMIT 1
      `;
      
      if (Array.isArray(rawResults) && rawResults.length > 0) {
        lookupMethod = 'email';
        log('✓ Found patient by email in contact field');
        
        // Type cast raw results
        const rawPatient = rawResults[0] as any;
        patient = {
          ...rawPatient
          // Hospital relation removed - patients are managed centrally
        };
      }
    }
    
    // No patient found with any strategy
    if (!patient) {
      return NextResponse.json({
        error: "Patient not found",
        details: { userEmail, patientId, medicalNumber }
      }, { status: 404 });
    }

    // --------------------------------
    // Process Patient Data
    // --------------------------------
    log('Patient found:', { id: patient.id, lookupMethod });
    
    // Set up patient profile object with required fields
    const profile: PatientProfile = {
      id: patient.id,
      fullName: 'Unknown',
      firstName: '',
      lastName: '',
      medicalNumber: '',
      displayMedicalNumber: '',
      email: '',
      phone: '',
      gender: patient.gender || 'unknown',
      dob: '',
      birthDate: null,
      age: 0,
      address: 'No address on file',
      bloodType: 'Unknown',
      height: 'Not recorded',
      weight: 'Not recorded',
      hospitalCode: '',
      hospitalName: '',
      insurance: {},
      allergies: [],
      conditions: [],
      medications: [],
      onboardingCompleted: false,
      createdAt: patient.createdAt,
      updatedAt: patient.updatedAt
    };

    // --------------------------------
    // Process Name
    // --------------------------------
    if (patient.name) {
      if (typeof patient.name === 'string') {
        // Handle plain text name
        profile.fullName = patient.name.trim();
        
        // Simple name splitting for first/last name
        const nameParts = profile.fullName.split(' ');
        if (nameParts.length > 1) {
          profile.firstName = nameParts[0];
          profile.lastName = nameParts.slice(1).join(' ');
        } else {
          profile.firstName = profile.fullName;
          profile.lastName = '';
        }
      } else if (typeof patient.name === 'object') {
        // Handle object-based name formats
        const nameObj = patient.name;
        
        if (Array.isArray(nameObj) && nameObj.length > 0) {
          // Handle FHIR array format
          const name = nameObj[0];
          profile.firstName = name.given ? name.given[0] : '';
          profile.lastName = name.family || '';
          profile.fullName = [profile.firstName, profile.lastName].filter(Boolean).join(' ') || 'Unknown';
        } else {
          // Handle direct object format
          profile.firstName = nameObj.given ? nameObj.given[0] : '';
          profile.lastName = nameObj.family || '';
          profile.fullName = [profile.firstName, profile.lastName].filter(Boolean).join(' ') || nameObj.text || 'Unknown';
        }
      }
    }

    // --------------------------------
    // Process Contact Information
    // --------------------------------
    let contactData: ContactItem[] = [];
    if (patient.contact) {
      try {
        // Parse contact data
        const contactRaw = typeof patient.contact === 'string' 
          ? JSON.parse(patient.contact)
          : patient.contact;
          
        // Ensure it's an array
        contactData = Array.isArray(contactRaw) ? contactRaw : [contactRaw];
      } catch (error) {
        log('Error parsing contact JSON:', error);
        contactData = [];
      }
    }
    
    // Extract email and phone from contact
    const emailContact = contactData.find(item => item.system === 'email');
    const phoneContact = contactData.find(item => item.system === 'phone');
    profile.email = emailContact?.value || '';
    profile.phone = phoneContact?.value || '';
    
    // --------------------------------
    // Process Medical History
    // --------------------------------
    let medicalHistoryData: MedicalHistoryData = {};
    if (patient.medicalHistory) {
      try {
        medicalHistoryData = typeof patient.medicalHistory === 'string'
          ? JSON.parse(patient.medicalHistory) 
          : patient.medicalHistory;
      } catch (error) {
        log('Error parsing medicalHistory JSON:', error);
      }
    }
    
    // Extract medical history fields
    profile.bloodType = medicalHistoryData.bloodType || 'Unknown';
    profile.height = medicalHistoryData.height || 'Not recorded';
    profile.weight = medicalHistoryData.weight || 'Not recorded';
    profile.address = medicalHistoryData.address || 'No address on file';

    // --------------------------------
    // Process Hospital Info
    // --------------------------------
    const hospitalName = patient.Hospital?.name || '';
    const hospitalId = patient.Hospital?.id || patient.hospitalId || '';
    profile.hospitalCode = hospitalId ? hospitalId.substring(0, 4).toUpperCase() : '';
    profile.hospitalName = hospitalName;

    // --------------------------------
    // Process Medical ID
    // --------------------------------
    // Log the actual ID values received to help diagnose issues
    log(`Patient ID values - id: ${patient.id}, mrn: ${patient.mrn}, medicalNumber: ${searchParams ? searchParams.get('medicalNumber') || 'none' : 'none'}`);
    
    // Only use mrn from the database as the source of truth for medical ID display
    // This ensures consistency across the application
    profile.medicalNumber = patient.mrn;
    profile.displayMedicalNumber = patient.mrn;
    // Stop sending UUID to frontend as requested
    // profile.patientId = patient.id; -- removed as requested

    // --------------------------------
    // Process Date of Birth and Age
    // --------------------------------
    if (patient.dateOfBirth) {
      const dateOfBirth = new Date(patient.dateOfBirth);
      profile.birthDate = dateOfBirth;
      profile.dob = dateOfBirth.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
      
      // Calculate age
      profile.age = calculateAge(dateOfBirth);
    }
    
    // --------------------------------
    // Onboarding Status
    // --------------------------------
    profile.onboardingCompleted = patient.onboardingCompleted || 
                                 (medicalHistoryData.onboardingCompleted === true) || 
                                 false;
                                 
    // --------------------------------
    // Add Default Medical Data
    // --------------------------------
    profile.insurance = {
      provider: "National Health Service",
      policyNumber: "NHS-" + patient.id.substring(0, 8),
      group: "Standard Coverage",
      validUntil: "2025-12-31"
    };
    
    // Ensure allergies is always an array, even if we get a string or other format from DB
    let allergiesData = medicalHistoryData.allergies;
    if (!allergiesData || !Array.isArray(allergiesData)) {
      profile.allergies = [{ name: "No known allergies", severity: "N/A", reaction: "N/A" }];
    } else {
      profile.allergies = allergiesData;
    }
    
    profile.conditions = medicalHistoryData.chronicConditions || [
      { name: "No current conditions", status: "N/A", diagnosedDate: "N/A" }
    ];
    
    profile.medications = medicalHistoryData.medications || [
      { name: "No current medications", dosage: "N/A", frequency: "N/A" }
    ];
    
    // --------------------------------
    // Process Photo
    // --------------------------------
    // Debug what photo fields are available
    log('Photo fields available:', {
      userPhoto: patient.User?.photo ? 'Yes' : 'No',
      legacyPhoto: patient.user?.photo ? 'Yes' : 'No',
      userAvatar: patient.User?.avatar ? 'Yes' : 'No',
      directPhoto: patient.photo ? 'Yes' : 'No',
      contactPhoto: typeof patient.contact === 'object' && patient.contact?.photo ? 'Yes' : 'No',
      medicalHistoryPhoto: medicalHistoryData?.photo ? 'Yes' : 'No'
    });
    
    // First try User.photo (capitalized) - new standard
    if (patient.User?.photo) {
      profile.photo = patient.User.photo;
      log('Using photo from User.photo');
    }
    // Then try legacy user.photo (lowercase)
    else if (patient.user?.photo) {
      profile.photo = patient.user.photo;
      log('Using photo from user.photo');
    }
    // Try User.avatar as another possibility
    else if (patient.User?.avatar) {
      profile.photo = patient.User.avatar;
      log('Using photo from User.avatar');
    }
    // Try patient.photo directly
    else if (patient.photo) {
      profile.photo = patient.photo;
      log('Using photo directly from patient record');
    }
    // Try contact data for photo
    else if (typeof patient.contact === 'object' && patient.contact?.photo) {
      profile.photo = patient.contact.photo;
      log('Using photo from contact data');
    }
    // Try medical history for photo
    else if (medicalHistoryData?.photo) {
      profile.photo = medicalHistoryData.photo;
      log('Using photo from medical history');
    }
    // Finally check extension data for photo
    else if (patient.extension) {
      try {
        const extensionData = typeof patient.extension === 'string'
          ? JSON.parse(patient.extension)
          : patient.extension;
          
        if (extensionData.basicDetails?.photo) {
          profile.photo = extensionData.basicDetails.photo;
          log('Using photo from extension.basicDetails');
        }
      } catch (e) {
        log('Error parsing extension data for photo:', e);
      }
    }
    
    // Add a hardcoded photo for testing if none found
    if (!profile.photo) {
      log('No photo found in any patient record field');
    } else {
      log('Photo successfully assigned from patient record');
    }

    return NextResponse.json(profile);
  } catch (error) {
    log('Error in patient profile API:', error);
    return NextResponse.json({ 
      error: "Server error retrieving patient profile",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

/**
 * Calculate age from birth date with enhanced validation
 * 
 * @param birthDate The patient's birth date (Date object or ISO string)
 * @param referenceDate Optional date to calculate age against (defaults to today)
 * @returns The calculated age in years, or null if invalid input
 */
function calculateAge(birthDate: Date | string | null, referenceDate?: Date | string): number {
  // Handle null or invalid dates
  if (!birthDate) return 0;
  
  try {
    // Convert string dates to Date objects if needed
    const birthDateObj = typeof birthDate === 'string' ? new Date(birthDate) : birthDate;
    const today = referenceDate ? (typeof referenceDate === 'string' ? new Date(referenceDate) : referenceDate) : new Date();
    
    // Validate dates
    if (isNaN(birthDateObj.getTime()) || isNaN(today.getTime())) {
      console.error('Invalid date in calculateAge:', { birthDate, referenceDate });
      return 0;
    }
    
    // Future birth dates should return 0
    if (birthDateObj > today) {
      console.warn('Birth date is in the future:', birthDateObj);
      return 0;
    }
    
    // Calculate age
    let age = today.getFullYear() - birthDateObj.getFullYear();
    const monthDiff = today.getMonth() - birthDateObj.getMonth();
    
    // Adjust age if birth month/day has not occurred yet this year
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDateObj.getDate())) {
      age--;
    }
    
    // Age sanity check (cap at reasonable maximum)
    if (age > 120) {
      console.warn('Calculated age exceeds 120 years:', age, birthDateObj);
      return 120; // Cap at maximum reasonable age
    }
    
    return age;
  } catch (error) {
    console.error('Error calculating age:', error);
    return 0;
  }
}
