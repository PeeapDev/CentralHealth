import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Define interfaces for better type safety
interface FHIRHumanName {
  use?: string;
  text?: string;
  family?: string;
  given?: string[];
  prefix?: string[];
  suffix?: string[];
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

interface ProcessedPatient {
  id: string;
  medicalNumber: string;
  resourceType: string;
  name: any;
  gender?: string;
  birthDate?: string | Date;
  email?: string | null;
  phone?: string | null;
  telecom?: any;
  address?: any;
  extension?: any;
  // Added fields
  firstName?: string;
  lastName?: string;
  fullName?: string;
  displayName?: string;
  [key: string]: any; // Allow other properties
}

export async function GET(
  request: NextRequest,
  { params }: { params: { patientId: string } }
) {
  try {
    const patientId = params.patientId;
    
    if (!patientId) {
      return NextResponse.json(
        { error: 'Patient ID is required' },
        { status: 400 }
      );
    }

    console.log(`Fetching patient with ID: ${patientId}`);
    
    // Fetch patient data by ID with user relation
    const patient = await prisma.patient.findUnique({
      where: {
        id: patientId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            profileImage: true,
            createdAt: true,
            updatedAt: true,
            // Don't include password
          }
        },
        hospital: {
          select: {
            name: true,
            subdomain: true
          }
        }
      }
    });

    if (!patient) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      );
    }

    // Process the patient data for consistent format
    const processedPatient: ProcessedPatient = {
      ...patient,
    };

    // Remove password from response for security
    delete processedPatient.password;
    
    // Handle medical number display consistently
    // IMPORTANT: Never modify the original medicalNumber field
    // Only use displayMedicalNumber for display purposes
    
    // Add displayMedicalNumber field for frontend use
    processedPatient.displayMedicalNumber = processedPatient.medicalNumber;
    
    // If the medical number starts with 'P', we'll display it without the prefix
    if (processedPatient.medicalNumber && processedPatient.medicalNumber.startsWith('P')) {
      processedPatient.displayMedicalNumber = processedPatient.medicalNumber.substring(1);
    }
    
    // If there's no medical number at all, display 'Not Assigned' instead of generating a random one
    if (!processedPatient.medicalNumber || processedPatient.medicalNumber === 'null') {
      processedPatient.displayMedicalNumber = 'Not Assigned';
    }
    // Already handled the 'P' prefix case above
    
    // Parse JSON fields if they're stored as strings
    if (processedPatient.name && typeof processedPatient.name === 'string') {
      processedPatient.name = JSON.parse(processedPatient.name);
    }
    
    if (processedPatient.telecom && typeof processedPatient.telecom === 'string') {
      processedPatient.telecom = JSON.parse(processedPatient.telecom);
    }
    
    if (processedPatient.address && typeof processedPatient.address === 'string') {
      processedPatient.address = JSON.parse(processedPatient.address);
    }
    
    if (processedPatient.extension && typeof processedPatient.extension === 'string') {
      processedPatient.extension = JSON.parse(processedPatient.extension);
    }

    // Extract any additional meaningful data
    let firstName = '';
    let lastName = '';
    let fullName = '';
    let photo = '';

    try {
      // Handle array format (most common in this system)
      if (Array.isArray(processedPatient.name) && processedPatient.name.length > 0) {
        const nameObj = processedPatient.name[0]; // Use first name entry
        
        if (nameObj && nameObj.given && Array.isArray(nameObj.given)) {
          firstName = nameObj.given.map((name: string) => 
            // Capitalize first letter of each given name
            name.charAt(0).toUpperCase() + name.slice(1).toLowerCase()
          ).join(' ');
          fullName = firstName;
        }
        
        if (nameObj && nameObj.family) {
          // Capitalize family name
          lastName = typeof nameObj.family === 'string' ? 
            nameObj.family.charAt(0).toUpperCase() + nameObj.family.slice(1).toLowerCase() : '';
          fullName += fullName ? ' ' + lastName : lastName;
        }
      } 
      // Handle direct object format
      else if (typeof processedPatient.name === 'object') {
        const nameObj = processedPatient.name;
        
        if (nameObj && nameObj.given && Array.isArray(nameObj.given)) {
          firstName = nameObj.given.map((name: string) => 
            // Capitalize first letter of each given name
            name.charAt(0).toUpperCase() + name.slice(1).toLowerCase()
          ).join(' ');
          fullName = firstName;
        }
        
        if (nameObj && nameObj.family) {
          // Capitalize family name
          lastName = typeof nameObj.family === 'string' ? 
            nameObj.family.charAt(0).toUpperCase() + nameObj.family.slice(1).toLowerCase() : '';
          fullName += fullName ? ' ' + lastName : lastName;
        }
      }
    } catch (error) {
      console.error('Error extracting patient name:', error);
    }

    processedPatient.firstName = firstName || 'Unknown';
    processedPatient.lastName = lastName || 'Unknown';
    processedPatient.fullName = fullName.trim() || 'Unknown';
    processedPatient.displayName = processedPatient.fullName;

    // Add photo from user profile image or registration data
    if (patient.user?.profileImage) {
      photo = patient.user.profileImage;
    } else if (patient.user?.id) {
      try {
        // Try to get photo from registration data using raw SQL query
        // This is needed because 'registration_data' is a JSON field that's not properly defined in the Prisma schema
        const regDataQuery = `SELECT id, registration_data FROM User WHERE id = ?;`;
        const regDataResult = await prisma.$queryRawUnsafe(regDataQuery, patient.user.id);
        
        if (regDataResult && Array.isArray(regDataResult) && regDataResult.length > 0) {
          const userData = regDataResult[0] as any;
          if (userData?.id && userData?.registration_data) {
            try {
              const regData = typeof userData.registration_data === 'string'
                ? JSON.parse(userData.registration_data)
                : userData.registration_data;
                
              if (regData?.photo) {
                photo = regData.photo;
              }
            } catch (parseError) {
              console.error('Error parsing registration data:', parseError);
            }
          }
        }
      } catch (error) {
        console.error('Error retrieving user photo from registration data:', error);
      }
    }
    
    // Add photo to patient response
    processedPatient.photo = photo;

    return NextResponse.json(processedPatient);
  } catch (error) {
    console.error('Error fetching patient details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch patient details' },
      { status: 500 }
    );
  }
}
