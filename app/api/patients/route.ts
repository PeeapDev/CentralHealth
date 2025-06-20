import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Type definition for processed patient data
interface ProcessedPatient {
  id: string;
  userId?: string;
  hospitalId?: string;
  medicalNumber?: string;
  name?: any;
  email?: string;
  phone?: string;
  birthDate?: string;
  gender?: string;
  address?: any;
  telecom?: any;
  active?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  displayName: string;
  photo?: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  displayMedicalNumber?: string;
  phoneNumber?: string;
  profileImage?: string | null;
}

/**
 * Helper function to format a patient name from FHIR format
 */
function formatPatientName(nameObj: any): string {
  try {
    if (!nameObj) return 'Unknown';
    
    // Parse the name object if it's a string
    let nameData;
    if (typeof nameObj === 'string') {
      try {
        nameData = JSON.parse(nameObj);
      } catch {
        return nameObj || 'Unknown';
      }
    } else {
      nameData = nameObj;
    }
    
    let formattedName = '';
    
    // Handle array format (FHIR standard)
    if (Array.isArray(nameData) && nameData.length > 0) {
      const firstNameObj = nameData[0];
      
      if (firstNameObj.given && Array.isArray(firstNameObj.given)) {
        formattedName = firstNameObj.given.join(' ');
      }
      
      if (firstNameObj.family) {
        formattedName += formattedName ? ' ' + firstNameObj.family : firstNameObj.family;
      }
      
      return formattedName.trim() || 'Unknown';
    }
    
    // Handle direct object format
    if (nameData.given && Array.isArray(nameData.given)) {
      formattedName = nameData.given.join(' ');
    }
    
    if (nameData.family) {
      formattedName += formattedName ? ' ' + nameData.family : nameData.family;
    }
    
    return formattedName.trim() || 'Unknown';
  } catch (e) {
    console.error('Error parsing name:', e);
    return 'Unknown';
  }
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  console.log('Patient API called at', new Date().toISOString());
  
  try {
    console.log('Patient API called - optimized version with photo retrieval');
    const searchParams = request.nextUrl.searchParams;
    
    // Parse query parameters for filtering and pagination
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);
    const search = searchParams.get('search') || '';
    const medicalNumber = searchParams.get('medicalNumber') || '';
    const hospitalId = searchParams.get('hospitalId') || '';
    
    // Log the request parameters for debugging
    console.log('Patient search parameters:', { search, medicalNumber, hospitalId, page, pageSize });
    
    // Build the where clause for the search
    const whereClause: any = {};
    
    // Apply filters
    if (medicalNumber) {
      whereClause.medicalNumber = {
        equals: medicalNumber
      };
    }
    
    if (hospitalId) {
      whereClause.hospitalId = hospitalId;
    }
    
    if (search) {
      // Enhanced search for patient records with better JSON field handling
      whereClause.OR = [
        // Search by medical number (exact match or contains)
        { 
          medicalNumber: { 
            contains: search, 
            mode: 'insensitive' 
          } 
        },
        // Search by medical ID (for compatibility with both field names)
        { 
          medicalId: { 
            contains: search, 
            mode: 'insensitive' 
          } 
        },
        // Search by email
        { 
          email: { 
            contains: search, 
            mode: 'insensitive' 
          } 
        },
        // Search in phone number
        { 
          phone: { 
            contains: search, 
            mode: 'insensitive' 
          } 
        },
        // Search in name field (this is a JSON string in FHIR format)
        // We use contains to find partial matches within the JSON string
        { 
          name: { 
            contains: search, 
            mode: 'insensitive' 
          } 
        },
        // Search in telecom field (JSON string containing email and phone)
        // This helps when email is stored in the telecom field
        { 
          telecom: { 
            contains: search, 
            mode: 'insensitive' 
          } 
        },
      ];
      
      // Log the search query for debugging
      console.log('Patient search query:', search, 'Where clause:', JSON.stringify(whereClause));
    }
    
    // Execute query with pagination
    let patients: any[] = [];
    let total = 0;
    
    try {
      // First get total count
      total = await prisma.patient.count({ where: whereClause });
      
      // Then get paginated patients
      patients = await prisma.patient.findMany({
        where: whereClause,
        select: {
          id: true,
          userId: true,
          hospitalId: true,
          medicalNumber: true,
          name: true,
          email: true,
          phone: true,
          birthDate: true,
          gender: true,
          address: true,
          telecom: true,
          active: true,
          createdAt: true,
          updatedAt: true,
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: {
          createdAt: 'desc',
        },
      });
      
      console.log(`Retrieved ${patients.length} patients (total: ${total})`);
    } catch (error) {
      console.error('Error fetching patients:', error);
      patients = [];
      total = 0;
    }
    
    // Process patients with optimized approach - use efficient batch photo retrieval
    console.log(`Processing ${patients.length} patients with optimized photo retrieval`);
    const processedPatients: ProcessedPatient[] = [];
    
    // Get all user IDs from patients for optimized batch queries
    const userIds = patients
      .filter(p => p.userId)
      .map(p => p.userId);
      
    // Create maps for efficient lookups
    const userPhotoMap = new Map<string, string>();
    
    if (userIds.length > 0) {
      console.log(`Fetching profile images for ${userIds.length} users in one query`);
      
      try {
        // Get profile images in a SINGLE query instead of one per patient
        const users = await prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, profileImage: true }
        });
        
        // Map user IDs to their profile images
        for (const user of users) {
          if (user.profileImage) {
            userPhotoMap.set(user.id, user.profileImage);
          }
        }
        
        // Only get registration data for users WITHOUT profile images
        const usersWithoutProfileImage = userIds.filter(id => !userPhotoMap.has(id));
        
        if (usersWithoutProfileImage.length > 0) {
          console.log(`Fetching registration data for ${usersWithoutProfileImage.length} users in one query`);
          
          try {
            // Use parameterized query to prevent SQL injection
            const regDataQuery = `
              SELECT id, registration_data FROM User 
              WHERE id IN (${usersWithoutProfileImage.map(() => '?').join(',')});
            `;
            
            const registrationData = await prisma.$queryRawUnsafe(
              regDataQuery,
              ...usersWithoutProfileImage
            );
            
            if (registrationData && Array.isArray(registrationData)) {
              for (const row of registrationData as any[]) {
                if (row.id && row.registration_data) {
                  try {
                    const regData = typeof row.registration_data === 'string'
                      ? JSON.parse(row.registration_data)
                      : row.registration_data;
                      
                    if (regData?.photo) {
                      userPhotoMap.set(row.id, regData.photo);
                    }
                  } catch (parseErr) {
                    console.error(`Error parsing registration data for user ${row.id}:`, parseErr);
                  }
                }
              }
            }
          } catch (regDataErr) {
            console.error('Error fetching registration data:', regDataErr);
          }
        }
      } catch (err) {
        console.error('Error batch fetching user data:', err);
      }
    }
    
    // Process all patients with our pre-fetched photo data
    for (const patient of patients) {
      const processedPatient: ProcessedPatient = {
        ...patient,
        displayName: 'Unknown',
      };
      
      // Efficiently look up photos from our pre-fetched map
      if (patient.userId && userPhotoMap.has(patient.userId)) {
        processedPatient.photo = userPhotoMap.get(patient.userId);
      }
      
      // Parse string fields and format data
      try {
        // Parse telecom if it's a string
        if (typeof processedPatient.telecom === 'string') {
          try {
            processedPatient.telecom = JSON.parse(processedPatient.telecom);
          } catch {
            processedPatient.telecom = [];
          }
        }
        
        // Parse address if it's a string
        if (typeof processedPatient.address === 'string') {
          try {
            processedPatient.address = JSON.parse(processedPatient.address);
          } catch {
            processedPatient.address = {};
          }
        }
        
        // Format name fields
        let firstName = '';
        let lastName = '';
        let fullName = '';
        
        if (patient.name) {
          try {
            const nameObj = typeof patient.name === 'string' 
              ? JSON.parse(patient.name) 
              : patient.name;
            
            // Handle array format
            if (Array.isArray(nameObj) && nameObj.length > 0) {
              const name = nameObj[0];
              
              if (name.given && Array.isArray(name.given)) {
                firstName = name.given.join(' ');
              }
              
              if (name.family) {
                lastName = name.family;
              }
            } 
            // Handle direct object format
            else if (nameObj && (nameObj.given || nameObj.family)) {
              if (nameObj.given && Array.isArray(nameObj.given)) {
                firstName = nameObj.given.join(' ');
              }
              
              if (nameObj.family) {
                lastName = nameObj.family;
              }
            }
            
            fullName = [firstName, lastName].filter(Boolean).join(' ');
          } catch (nameErr) {
            console.error(`Error parsing name for patient ${patient.id}:`, nameErr);
          }
        }
        
        // Set formatted name fields
        processedPatient.firstName = firstName || 'Unknown';
        processedPatient.lastName = lastName || '';
        processedPatient.fullName = fullName || 'Unknown';
        processedPatient.displayName = fullName || 'Unknown';
        
        // Format medical number for display
        processedPatient.displayMedicalNumber = patient.medicalNumber || 'Not Assigned';
        
        // Set profile image
        processedPatient.profileImage = processedPatient.photo || null;
        
      } catch (formatErr) {
        console.error(`Error formatting patient data: ${formatErr}`);
        processedPatient.displayName = 'Unknown';
      }
      
      // Add the processed patient to our results array
      processedPatients.push(processedPatient);
    }
    
    // Return the results
    const endTime = Date.now();
    console.log(`Patient API completed in ${endTime - startTime}ms`);
    
    // Return data in a format compatible with both new and old components
    return NextResponse.json({
      patients: processedPatients,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      hasMore: page * pageSize < total,
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
        hasMore: page * pageSize < total,
      },
      filters: {
        search: search || '',
        medicalNumber: medicalNumber || '',
        hospitalId: hospitalId || '',
      }
    });
    
  } catch (error) {
    console.error('Patient API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch patients',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
