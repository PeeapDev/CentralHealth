import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma-client"; // Updated import path
import { v4 as uuidv4 } from "uuid";

// Define enum types for the neonatal data
type CareLevel = 'NORMAL' | 'CRITICAL' | 'SPECIAL_CARE';
type NeonatalStatus = 'ACTIVE' | 'DISCHARGED' | 'TRANSFERRED';
type DischargeStatus = 'HOME' | 'TRANSFER' | 'DECEASED' | null;

// Define interface for transformed patient data to return to frontend
interface NeonatalPatient {
  id: string;
  mrn: string;
  name: string;
  dateOfBirth?: Date | string | null;
  ageInDays: number;
  birthWeight: number | null;
  careLevel: CareLevel;
  status: NeonatalStatus;
  dischargeStatus?: DischargeStatus;
  imageUrl?: string | null;
  motherId?: string | null;
  gestationalAgeAtBirth: number | null;
  apgarScore?: number | null;
  recordId?: string; // ID of the neonatal record
}

// Define response structure
interface NeonatalApiResponse {
  patients: NeonatalPatient[];
  stats: {
    totalPatients: number;
    activePatients: number;
    newAdmissions: number;
    criticalCases: number;
  };
  meta: {
    total: number;
    pages: number;
    currentPage: number;
    perPage: number;
  };
  requestId: string; // For tracking/debugging purpose
}

/**
 * Safely parse JSON data with error handling
 */
function safeParseJson(jsonString: any): any {
  if (!jsonString) return {};
  if (typeof jsonString !== 'string') return jsonString;
  
  try {
    return JSON.parse(jsonString);
  } catch (e) {
    console.error('Error parsing JSON:', e);
    return {};
  }
}

/**
 * Calculate age in days from date of birth
 */
function calculateAgeInDays(dob: Date | string | null | undefined): number {
  if (!dob) return 0;
  
  try {
    const birthDate = new Date(dob);
    const today = new Date();
    
    // Check if date is valid
    if (isNaN(birthDate.getTime())) return 0;
    
    // Calculate the difference in milliseconds
    const diffTime = Math.abs(today.getTime() - birthDate.getTime());
    
    // Convert to days
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  } catch (error) {
    console.error("Error calculating age in days:", error);
    return 0;
  }
}

/**
 * Extract patient name from patient data
 */
function extractPatientName(patientData: any): string {
  try {
    // Try to get name from data fields
    if (patientData.name) return patientData.name;
    
    if (patientData.firstName || patientData.lastName) {
      return `${patientData.firstName || ''} ${patientData.lastName || ''}`.trim();
    }
    
    // Last resort
    return "Unknown Patient";
  } catch (error) {
    console.error("Error extracting patient name:", error);
    return "Unknown Patient";
  }
}

/**
 * Extract image URL from patient data
 */
function getPatientImageUrl(patientData: any): string | null {
  try {
    // Try to get from photo field directly
    if (patientData?.photo) {
      return patientData.photo;
    }
    
    return null;
  } catch (error) {
    console.error("Error extracting patient image URL:", error);
    return null;
  }
}

export async function GET(request: NextRequest, { params }: { params: { hospitalName: string } }) {
  // Generate unique request ID for tracking
  const requestId = uuidv4();
  console.log(`[Neonatal API] [${requestId}] Processing request for hospital: ${params.hospitalName}`);
  
  try {
    // Parse URL for pagination parameters
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || '10', 10);
    const skip = (page - 1) * limit;
    
    // Get hospital by subdomain (not name) to satisfy Prisma unique constraints
    const hospital = await prisma.hospital.findUnique({
      where: { subdomain: params.hospitalName },
    });
    
    if (!hospital) {
      console.error(`Hospital not found with subdomain: ${params.hospitalName}`, { requestId });
      return NextResponse.json(
        { error: "Hospital not found", requestId },
        { status: 404 }
      );
    }

    // Count total records for pagination
    const totalCount = await prisma.neonatalRecord.count({
      where: { hospitalId: hospital.id },
    });

    // Get neonatal records with patient data using the correct relation name
    const neonatalRecords = await prisma.neonatalRecord.findMany({
      where: { hospitalId: hospital.id },
      include: {
        Patient_NeonatalRecord_patientIdToPatient: true,
      },
      skip,
      take: limit,
      orderBy: { updatedAt: 'desc' },
    });

    // Transform neonatal records into frontend-friendly format
    const transformedPatients: NeonatalPatient[] = neonatalRecords.map(record => {
      const patient = record.Patient_NeonatalRecord_patientIdToPatient;
      const patientName = extractPatientName(patient);
      const dateOfBirth = patient.dateOfBirth;
      const ageInDays = calculateAgeInDays(dateOfBirth);
      const imageUrl = null; // No photo field in patient model
      
      return {
        id: patient?.id || '',
        mrn: patient?.mrn || record.mrn || '',
        name: patientName,
        dateOfBirth,
        ageInDays,
        birthWeight: record.birthWeight || null,
        careLevel: (record.careLevel as CareLevel) || 'NORMAL',
        status: (record.status as NeonatalStatus) || 'ACTIVE',
        dischargeStatus: record.dischargeStatus as DischargeStatus || null,
        imageUrl,
        motherId: record.motherId || null,
        gestationalAgeAtBirth: record.gestationalAgeAtBirth || null,
        apgarScore: record.apgarScore || null,
        recordId: record.id,
      };
    });

    // Calculate statistics
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const [activePatients, criticalCases, newAdmissions] = await Promise.all([
      prisma.neonatalRecord.count({
        where: {
          hospitalId: hospital.id,
          status: 'ACTIVE'
        }
      }),
      prisma.neonatalRecord.count({
        where: {
          hospitalId: hospital.id,
          careLevel: 'CRITICAL'
        }
      }),
      prisma.neonatalRecord.count({
        where: {
          hospitalId: hospital.id,
          createdAt: { gte: oneWeekAgo }
        }
      })
    ]);

    // Prepare and return response
    return NextResponse.json({
      patients: transformedPatients,
      stats: {
        totalPatients: totalCount,
        activePatients,
        newAdmissions,
        criticalCases,
      },
      meta: {
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
        currentPage: page,
        perPage: limit,
      },
      requestId,
    });

  } catch (error: any) {
    console.error(`Error fetching neonatal patients: ${error.message}`, { error });
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const requestId = uuidv4();
  
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.hospitalId || !body.patientId || !body.birthWeight) {
      return NextResponse.json(
        { error: "Missing required fields", requestId },
        { status: 400 }
      );
    }

    // Create new neonatal record
    const newRecord = await prisma.neonatalRecord.create({
      data: {
        hospitalId: body.hospitalId,
        patientId: body.patientId,
        birthWeight: body.birthWeight,
        gestationalAgeAtBirth: body.gestationalAgeAtBirth || null,
        apgarScore: body.apgarScore || null,
        motherId: body.motherId || null,
        careLevel: body.careLevel || 'NORMAL',
        status: 'ACTIVE'
      }
    });

    return NextResponse.json(
      { success: true, record: newRecord, requestId },
      { status: 201 }
    );

  } catch (error: any) {
    console.error(`Error creating neonatal record: ${error.message}`, { error });
    
    return NextResponse.json(
      { 
        error: "Error creating neonatal record", 
        message: error.message || "Unknown error",
        requestId
      },
      { status: 500 }
    );
  }
}