import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  // Track execution time for performance monitoring
  const startTime = Date.now();
  
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Parse query parameters for filtering and pagination
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10); // Changed default page size to 10 for better pagination
    const search = searchParams.get('search') || '';
    const medicalNumber = searchParams.get('medicalNumber') || '';
    const hospitalId = searchParams.get('hospitalId') || '';
    
    // Log the request parameters for debugging
    console.log('Patient search parameters:', { search, medicalNumber, hospitalId, page, pageSize });
    
    // Build the where clause for the search
    const whereClause: any = {
      // Default filter is empty to return all patients
      // Ensure we only get records with resourceType = 'Patient' if needed
      // but for now we'll just get all patients regardless of resource type
      // and activity status to see what's available
    };
    
    console.log('Initial query will retrieve all patients in the database');
    
    console.log('Executing query with where clause:', whereClause);
    
    // If a specific medical number is provided, search by it
    if (medicalNumber) {
      whereClause.medicalNumber = {
        equals: medicalNumber
      };
    }
    
    // If a search term is provided, search across multiple fields
    if (search) {
      whereClause.OR = [
        // Search in medical number
        {
          medicalNumber: {
            contains: search,
            mode: 'insensitive',
          },
        },
        // Search in email
        {
          email: {
            contains: search,
            mode: 'insensitive',
          },
        },
        // Advanced search in JSON fields using raw filter conditions
        // Search in name field (JSON)
        {
          name: {
            contains: search,
            mode: 'insensitive',
          },
        },
        // We'll use a more advanced search for telecom/phone in the raw query below
      ];
    }
    
    // If search term looks like a phone number, add a custom raw query condition
    if (search && /\d/.test(search)) {
      // This is likely a phone number search, we'll handle it with a more advanced query later
      console.log('Phone number search detected:', search);
    }
    
    // If hospitalId is provided, filter by it
    // Note: not providing hospitalId will search across ALL hospitals (centralized search)
    if (hospitalId) {
      // Only search within the specified hospital
      whereClause.hospitalId = hospitalId;
      console.log(`Filtering patients for specific hospital: ${hospitalId}`);
    } else {
      console.log('Performing centralized search across ALL hospitals');
    }
    
    // Log the collection status first
    console.log('Attempting to fetch patients from database');
    
    try {
      // First check if there are any patients at all
      const patientCount = await prisma.patient.count();
      console.log(`Total patients in database: ${patientCount}`);
      
      // Show a sample of raw data to debug
      if (patientCount > 0) {
        const samplePatient = await prisma.patient.findFirst();
        console.log('Sample patient found:', samplePatient?.medicalNumber);
      }
    } catch (countError) {
      console.error('Error checking patient count:', countError);
    }
    
    // Note: Phone number search would typically use raw SQL to search in JSON fields
    // But we'll use standard Prisma queries instead due to connection configuration
    
    // Fetch patients from the database with more relaxed conditions
    // Define types to avoid TypeScript errors
    type PatientWithRelations = any; // Using any temporarily to avoid complex type issues
    let patients: PatientWithRelations[] = [];
    let total = 0;
    
    try {
      console.log('About to query the database for patients, where clause:', JSON.stringify(whereClause));
      
      // Use a more targeted select to avoid querying fields that might not exist
      const queryStartTime = Date.now();
      [patients, total] = await Promise.all([
        prisma.patient.findMany({
          where: whereClause,
          // Include essential fields and avoid fields that might be missing
          select: {
            id: true,
            medicalNumber: true,
            mrn: true,
            resourceType: true,
            active: true,
            name: true,
            gender: true,
            birthDate: true,
            email: true,
            phone: true,
            hospitalId: true,
            telecom: true, // Include telecom for contact info
            address: true, // Include address information
            extension: true, // Include extension for additional data
            createdAt: true,
            updatedAt: true,
            // Note: User relation appears to be missing in schema currently
            // Will handle any user-related data in post-processing
            hospital: {
              select: {
                name: true,
                subdomain: true
              }
            },
            // Include related appointments count
            appointments: {
              select: {
                id: true
              }
            },
            // Exclude potentially problematic fields
            password: false,
          },
        }),
        prisma.patient.count({ where: whereClause }),
      ]);
      
      // Log the result for debugging
      console.log(`Found ${patients.length} patients out of ${total} total`);
      
      // Log the raw patient data for debugging
      console.log(`Retrieved ${patients.length} patients from database`);
      if (patients.length > 0) {
        console.log('First patient sample (id, medical number):', {
          id: patients[0].id,
          medicalNumber: patients[0].medicalNumber
        });
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
      // Continue with empty results rather than failing the request
      patients = [];
      total = 0;
    }

    // Process patients to ensure JSON fields are properly formatted and merge User data
    const processedPatients = patients.map(patient => {
      const processedPatient = {
        ...patient,
      };
      
      // Remove password from response for security
      delete processedPatient.password;
      
      // Parse all JSON fields that might be stored as strings
      if (typeof processedPatient.name === 'string') {
        try {
          processedPatient.name = JSON.parse(processedPatient.name);
        } catch (error) {
          processedPatient.name = [];
        }
      }
      
      if (typeof processedPatient.telecom === 'string') {
        try {
          processedPatient.telecom = JSON.parse(processedPatient.telecom);
        } catch (error) {
          processedPatient.telecom = [];
        }
      }
      
      if (typeof processedPatient.address === 'string') {
        try {
          processedPatient.address = JSON.parse(processedPatient.address);
        } catch (error) {
          processedPatient.address = [];
        }
      }
      
      if (typeof processedPatient.extension === 'string') {
        try {
          processedPatient.extension = JSON.parse(processedPatient.extension);
        } catch (error) {
          processedPatient.extension = null;
        }
      }
      
      // Handle medical number display consistently
      // IMPORTANT: We should NOT generate random medical numbers here, as this causes inconsistency
      // between what's shown to the user during onboarding and what appears in the admin
      
      // For frontend display, we'll use the original medicalNumber field
      // - Never modify the original medicalNumber field
      // - Only use the displayMedicalNumber field for display purposes
      
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
      
      // Initialize name variables for each patient
      let firstName = '';
      let lastName = '';
      let fullName = '';
      
      // Extract name from patient data in FHIR format
      if (processedPatient.name) {
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
      }
      
      // Set the processed name fields
      // Add processed name fields to patient record
      processedPatient.firstName = firstName || 'Unknown';
      processedPatient.lastName = lastName || 'Unknown';
      processedPatient.fullName = fullName.trim() || 'Unknown';
      processedPatient.displayName = processedPatient.fullName;
      
      // Use patient email if available
      processedPatient.email = processedPatient.email || 'Unknown';
      
      // Set profile image (in future, this could come from patient.photo)
      processedPatient.profileImage = processedPatient.photo || null;
      
      // Extract phone from telecom for easier access
      if (processedPatient.telecom && Array.isArray(processedPatient.telecom)) {
        const phoneEntry = processedPatient.telecom.find((entry: { system: string; value: string }) => entry.system === 'phone');
        if (phoneEntry) {
          processedPatient.phoneNumber = phoneEntry.value;
        }
      }
      
      // Add formatted display name for convenience
      if (processedPatient.name) {
        try {
          // Handle name field formats
          let nameObj;
          if (typeof processedPatient.name === 'string') {
            // Parse JSON string
            try {
              nameObj = JSON.parse(processedPatient.name);
              console.log(`Successfully parsed name JSON for patient ${patient.id}`);
            } catch (parseError) {
              console.error(`Failed to parse name for patient ${patient.id}:`, parseError);
              // If can't parse, use as-is (might be a simple string name)
              nameObj = { text: processedPatient.name };
            }
          } else {
            // Already an object
            nameObj = processedPatient.name;
          }
            
          // Extract firstname and lastname from different possible formats
          let firstName = '';
          let lastName = '';
          
          if (nameObj.given && Array.isArray(nameObj.given) && nameObj.given.length > 0) {
            firstName = nameObj.given[0];
          } else if (nameObj.text) {
            // Try to split text into parts
            const parts = nameObj.text.split(' ');
            if (parts.length > 1) {
              firstName = parts[0];
              lastName = parts.slice(1).join(' ');
            } else {
              firstName = nameObj.text;
            }
          }
          
          // Get lastname from family field if available
          if (nameObj.family) {
            lastName = nameObj.family;
          }
          
          processedPatient.displayName = `${firstName} ${lastName}`.trim() || 'Unknown';
          console.log(`Display name for patient ${patient.id}: ${processedPatient.displayName}`);
        } catch (e) {
          console.error(`Error formatting name for patient ${patient.id}:`, e);
          processedPatient.displayName = 'Unknown';
        }
      } else {
        console.log(`No name field available for patient ${patient.id}`);
        processedPatient.displayName = 'Unknown';
      }
      
      return processedPatient;
    });
    
    // We've removed the raw SQL phone search due to Prisma configuration
    // Just use the standard patient results
    const mergedPatients = processedPatients;
    
    // Sort by most recently created
    mergedPatients.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
      const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
      return dateB.getTime() - dateA.getTime();
    });
    
    // Calculate execution time
    const executionTime = Date.now() - startTime;
    console.log(`Query execution time: ${executionTime}ms`);
    
    // Return a standard response with pagination info
    return NextResponse.json({
      success: true,
      patients: mergedPatients,
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
        hasMore: page * pageSize < total,
        search,
        filter: {
          medicalNumber,
          hospitalId
        },
        executionTimeMs: executionTime
      }
    });
  } catch (error) {
    console.error("Error fetching patients:", error);
    // Return empty array instead of error to handle gracefully on the frontend
    return NextResponse.json({ 
      success: false,
      patients: [],
      meta: {
        total: 0,
        page: 1,
        pageSize: 20,
        totalPages: 0
      },
      error: 'Failed to fetch patients'
    }, { status: 500 });
  }
}

// FHIR Search endpoint with FHIR-compliant response format
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Extract FHIR search parameters
    const { resourceType, name, identifier, gender, birthDate, email, _count } = body;
    
    // Validate resource type
    if (resourceType !== 'Patient') {
      return NextResponse.json({
        resourceType: 'OperationOutcome',
        issue: [{
          severity: 'error',
          code: 'processing',
          diagnostics: 'Invalid resource type. This endpoint only supports Patient resources.'
        }]
      }, { status: 400 });
    }
    
    // Build the search criteria
    const whereClause: any = {
      resourceType: 'Patient',
      active: true, // Only return active patients by default
    };
    
    // Add search parameters to the query
    if (identifier) {
      // Search by medical number or MRN
      whereClause.OR = [
        { medicalNumber: identifier },
        { mrn: identifier }
      ];
    }
    
    if (name) {
      // Name search is more complex due to JSON structure
      // This is a simplified approach - in production you might use raw SQL or a database with better JSON support
      whereClause.OR = whereClause.OR || [];
      whereClause.OR.push({
        email: {
          contains: name,
          mode: 'insensitive',
        }
      });
    }
    
    if (gender) {
      whereClause.gender = gender.toLowerCase();
    }
    
    if (birthDate) {
      whereClause.birthDate = new Date(birthDate);
    }
    
    if (email) {
      whereClause.email = {
        contains: email,
        mode: 'insensitive',
      };
    }
    
    // Set page size
    const pageSize = _count ? parseInt(_count) : 20;
    
    // Fetch patients
    const patients = await prisma.patient.findMany({
      where: whereClause,
      include: {
        hospital: {
          select: {
            name: true,
            subdomain: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            profileImage: true,
          }
        },
        appointments: {
          select: {
            id: true
          }
        }
      },
      take: pageSize,
    });
    
    // Convert patients to FHIR Bundle format
    const entries = patients.map(patient => {
      const processedPatient: any = { ...patient };
      
      // Process JSON fields
      ['name', 'telecom', 'address', 'contact', 'communication', 'extension'].forEach(field => {
        if (processedPatient[field]) {
          if (typeof processedPatient[field] === 'string') {
            try {
              processedPatient[field] = JSON.parse(processedPatient[field] as string);
            } catch (e) {
              console.error(`Error parsing ${field} for patient ${patient.id}:`, e);
            }
          }
        }
      });
      
      return {
        resource: processedPatient,
        fullUrl: `http://example.org/fhir/Patient/${patient.id}`
      };
    });
    
    // Return FHIR Bundle response
    return NextResponse.json({
      resourceType: 'Bundle',
      type: 'searchset',
      total: entries.length,
      entry: entries
    });
    
  } catch (error) {
    console.error('Error in FHIR search:', error);
    return NextResponse.json({
      resourceType: 'OperationOutcome',
      issue: [{
        severity: 'error',
        code: 'processing',
        diagnostics: 'An error occurred while processing the search request'
      }]
    }, { status: 500 });
  }
}
