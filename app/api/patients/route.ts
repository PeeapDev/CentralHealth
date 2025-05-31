import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    
    // Get query parameters for filtering and searching
    const searchTerm = params.get('search') || '';
    const medicalNumber = params.get('medicalNumber') || '';
    const hospitalId = params.get('hospitalId') || '';
    const page = parseInt(params.get('page') || '1');
    const pageSize = parseInt(params.get('pageSize') || '20');
    const skip = (page - 1) * pageSize;
    
    // Log the request parameters for debugging
    console.log('Patient search parameters:', { searchTerm, medicalNumber, hospitalId, page, pageSize });
    
    // Build the where clause for the search
    const whereClause: any = {
      // Default filter is empty to return all patients
      // Ensure we only get records with resourceType = 'Patient'
      resourceType: 'Patient',
      active: true // Only show active patients
    };
    
    console.log('Executing query with where clause:', whereClause);
    
    // If a specific medical number is provided, search by it
    if (medicalNumber) {
      whereClause.medicalNumber = {
        equals: medicalNumber
      };
    }
    
    // If a search term is provided, search across multiple fields
    if (searchTerm) {
      whereClause.OR = [
        // Search in medical number
        {
          medicalNumber: {
            contains: searchTerm,
            mode: 'insensitive',
          },
        },
        // Search in email
        {
          email: {
            contains: searchTerm,
            mode: 'insensitive',
          },
        },
        // Advanced search in JSON fields using raw filter conditions
        // Search in name field (JSON)
        {
          name: {
            contains: searchTerm,
            mode: 'insensitive',
          },
        },
        // We'll use a more advanced search for telecom/phone in the raw query below
      ];
    }
    
    // If search term looks like a phone number, add a custom raw query condition
    if (searchTerm && /\d/.test(searchTerm)) {
      // This is likely a phone number search, we'll handle it with a more advanced query later
      console.log('Phone number search detected:', searchTerm);
    }
    
    // If hospitalId is provided, filter by it
    if (hospitalId) {
      whereClause.hospitalId = hospitalId;
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
    const [patients, total] = await Promise.all([
      prisma.patient.findMany({
        where: whereClause,
        // Include all fields except password for security
        select: {
          id: true,
          medicalNumber: true,
          mrn: true,
          resourceType: true,
          active: true,
          name: true,
          telecom: true,
          gender: true,
          birthDate: true,
          address: true,
          photo: true,
          email: true,
          hospitalId: true,
          createdAt: true,
          updatedAt: true,
          hospital: {
            select: {
              name: true,
              subdomain: true
            }
          },
          // Exclude these sensitive or complex fields
          password: false,
          contact: false,
          communication: false,
          extension: false,
          medicalHistory: false,
          generalPractitioner: false,
        },
        orderBy: {
          createdAt: 'desc', // Show newest patients first
        },
        skip,
        take: pageSize,
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

    // Process patients to ensure JSON fields are properly formatted
    const processedPatients = patients.map(patient => {
      const processedPatient: any = { ...patient };
      
      // Remove password from response for security
      delete processedPatient.password;
      
      // Process JSON fields if they're stored as strings
      try {
        if (processedPatient.name && typeof processedPatient.name === 'string') {
          processedPatient.name = JSON.parse(processedPatient.name);
        }
        
        if (processedPatient.telecom && typeof processedPatient.telecom === 'string') {
          processedPatient.telecom = JSON.parse(processedPatient.telecom);
        }
        
        if (processedPatient.address && typeof processedPatient.address === 'string') {
          processedPatient.address = JSON.parse(processedPatient.address);
        }
        
        // Add a computed full name property for convenience
        if (processedPatient.name) {
          const nameObj = processedPatient.name;
          let fullName = '';
          if (nameObj.given && Array.isArray(nameObj.given)) {
            fullName += nameObj.given.join(' ');
          }
          
          if (nameObj.family) {
            fullName += ' ' + nameObj.family;
          }
          
          processedPatient.fullName = fullName.trim();
        }
        
        // Extract phone from telecom for easier access
        if (processedPatient.telecom && Array.isArray(processedPatient.telecom)) {
          const phoneEntry = processedPatient.telecom.find((entry: { system: string; value: string }) => entry.system === 'phone');
          if (phoneEntry) {
            processedPatient.phoneNumber = phoneEntry.value;
          }
        }
      } catch (e) {
        console.error('Error processing patient JSON fields:', e);
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
    
    // Prepare the response
    return NextResponse.json({
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      patients: mergedPatients
    });
  } catch (error) {
    console.error("Error fetching patients:", error);
    // Return empty array instead of error to handle gracefully on the frontend
    return NextResponse.json({ 
      patients: [],
      pagination: {
        total: 0,
        page: 1,
        pageSize: 20,
        totalPages: 0,
      },
    }, { status: 200 });
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
      select: {
        id: true,
        medicalNumber: true,
        mrn: true,
        resourceType: true,
        active: true,
        name: true,
        telecom: true,
        gender: true,
        birthDate: true,
        address: true,
        photo: true,
        email: true,
        hospitalId: true,
        createdAt: true,
        updatedAt: true,
        // Exclude sensitive info
        password: false,
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
