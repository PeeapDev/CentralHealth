import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { JsonValue } from '@prisma/client/runtime/library';

// Define interfaces for proper typing
interface UserInfo {
  id: string;
  name: string;
  email: string;
  photo: string;
}

interface HospitalInfo {
  id: string;
  name: string;
}

// Base patient interface - matching what comes from Prisma
// FHIR Name format interface
interface FHIRName {
  text?: string;
  given?: string[];
  family?: string;
  prefix?: string[];
  suffix?: string[];
  use?: string;
}

interface BasePatient {
  id: string;
  name: string | FHIRName[] | any; // More specific typing for FHIR compatibility
  medicalNumber?: string; // Some patients may not have this yet
  mrn: string;
  dateOfBirth: Date;
  gender: string;
  contact: JsonValue;
  medicalHistory: JsonValue;
  onboardingCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  User?: UserInfo; // From the include in the Prisma query
  Hospital?: HospitalInfo; // From the include in the Prisma query
}

// Extended interface for processed patient with added properties
interface ProcessedPatient extends BasePatient {
  displayName: string;
  medicalId: string;
  displayMedicalNumber: string;
  onboardingStatus: string;
  [key: string]: any; // Allow additional dynamic properties
}

// Simple minimalist implementation of the patients API route
// that returns the data needed by the SuperAdmin dashboard
export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '20');
    const searchQuery = url.searchParams.get('search') || '';
    
    // Calculate pagination
    const skip = (page - 1) * pageSize;
    
    // Build where clause
    const where: any = {};
    if (searchQuery) {
      where.OR = [
        { id: { contains: searchQuery } },
        { medicalNumber: { contains: searchQuery } },
        { User: { name: { contains: searchQuery } } },
        { User: { email: { contains: searchQuery } } }
      ];
    }
    
    // Get total count for pagination
    console.log('Executing count query...');
    const total = await prisma.patient.count({ where });
    
    // Fetch patients with relations
    console.log('Fetching patients...');
    const patients = await prisma.patient.findMany({
      where,
      skip,
      take: pageSize,
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true,
            photo: true
          }
        },
        Hospital: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    // Basic patient processing to ensure needed fields exist
    const processedPatients = patients.map((patient: any) => {
      // Create a safe copy to manipulate as a ProcessedPatient
      const processedPatient = { ...patient } as unknown as ProcessedPatient;
      
      // Ensure display name is available
      if (patient.User?.name) {
        processedPatient.displayName = patient.User.name;
      } else if (patient.name) {
        // Handle FHIR formatted names
        if (typeof patient.name === 'string') {
          processedPatient.displayName = patient.name;
        } 
        else if (Array.isArray(patient.name) && patient.name.length > 0) {
          // Cast to FHIRName for better type safety
          const nameObj = patient.name[0] as FHIRName;
          if (nameObj.text) {
            processedPatient.displayName = nameObj.text;
          } else {
            const given = nameObj.given && Array.isArray(nameObj.given) ? nameObj.given[0] : '';
            const family = nameObj.family || '';
            processedPatient.displayName = `${given} ${family}`.trim();
          }
        }
      } else {
        processedPatient.displayName = 'Unknown Patient';
      }
      
      // Ensure medical ID display
      processedPatient.medicalId = patient.medicalNumber || patient.id;
      if (processedPatient.medicalId && processedPatient.medicalId.length === 5) {
        // Keep original 5-character registration IDs
        processedPatient.displayMedicalNumber = processedPatient.medicalId;
      } else if (processedPatient.medicalId) {
        processedPatient.displayMedicalNumber = `P-${processedPatient.medicalId.substring(0, 4).toUpperCase()}`;
      } else {
        processedPatient.displayMedicalNumber = 'Not Assigned';
      }
      
      // Ensure onboarding status
      processedPatient.onboardingStatus = patient.onboardingCompleted ? 'Completed' : 'Pending';
      
      return processedPatient;
    });
    
    console.log(`Returning ${processedPatients.length} processed patients`);
    
    // Return in the format expected by the dashboard
    return NextResponse.json({
      patients: processedPatients,
      totalCount: total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    });
  } catch (error) {
    console.error('Error in simplified patients API:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve patients', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
