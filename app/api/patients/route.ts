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
    };
    
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
        // We can't directly search in JSON fields easily with Prisma
        // For production, you might want to use raw SQL or a database with better JSON search
      ];
    }
    
    // If hospitalId is provided, filter by it
    if (hospitalId) {
      whereClause.hospitalId = hospitalId;
    }
    
    // Fetch patients from the database
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
          // Exclude these sensitive or complex fields
          password: false,
          contact: false,
          communication: false,
          extension: false,
          medicalHistory: false,
          generalPractitioner: false,
        },
        orderBy: {
          updatedAt: 'desc',
        },
        skip,
        take: pageSize,
      }),
      prisma.patient.count({ where: whereClause }),
    ]);
    
    // Process patients to ensure JSON fields are properly formatted
    const processedPatients = patients.map(patient => {
      const processedPatient: any = { ...patient };
      
      // Process JSON fields to ensure they're objects not strings
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
      
      return processedPatient;
    });
    
    // Return the response
    return NextResponse.json({ 
      patients: processedPatients,
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
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
