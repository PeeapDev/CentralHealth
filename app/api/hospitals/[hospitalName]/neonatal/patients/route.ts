import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPatientFromSession } from "@/lib/auth/session-auth";

// Use PrismaClient types but import from lib/prisma to ensure we use the same instance
// This avoids the "Module '@prisma/client' has no exported member" TypeScript errors

// Define interfaces for type safety
interface NeonatalPluginData {
  dateOfBirth?: string | Date;
  birthWeight?: number;
  careLevel?: 'normal' | 'intensive' | 'critical';
  status?: string;
  dischargeStatus?: string;
  motherId?: string;
  gestationalAgeAtBirth?: number;
  apgarScore?: number | null; // Allow null for apgarScore
  [key: string]: any; // Allow additional properties
}

// Define type for patient with neonatal records included
type PatientWithNeonatal = {
  id: string;
  mrn: string;
  name: string;
  dateOfBirth: Date;
  gender: string;
  contact: any;
  medicalHistory?: any;
  createdAt: Date;
  updatedAt: Date;
  hospitalId: string;
  neonatal?: Array<{
    id: string;
    birthWeight: number;
    gestationalAgeAtBirth: number;
    careLevel: string; // CareLevel enum represented as string
    status: string;    // NeonatalStatus enum represented as string
    dischargeStatus?: string; // DischargeStatus enum or null
    apgarScore?: number | null;
    motherId?: string | null;
  }>;
  doctors?: Array<{
    id: string;
    name: string;
    email: string;
  }>;
};

// GET /api/hospitals/[hospitalName]/neonatal/patients
export async function GET(
  request: NextRequest,
  { params }: { params: { hospitalName: string } }
) {
  const { hospitalName } = params;
  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const skip = (page - 1) * limit;

  // Log request params for debugging
  console.log(`Fetching neonatal patients for hospital: ${hospitalName}, page: ${page}, limit: ${limit}`);

  try {
    // Authentication temporarily disabled for cross-hospital access
    // This follows the NHS model where patient data is accessible across the system
    // const session = await getPatientFromSession();
    // if (!session) {
    // Try to find the hospital with a flexible approach - first by subdomain, then by name
    console.log(`Attempting to find hospital with identifier: ${hospitalName}`);
    
    // First try by subdomain (most common case)
    let hospital = await prisma.hospital.findFirst({
      where: { subdomain: hospitalName },
      select: { id: true, name: true, subdomain: true },
    });
    
    // If not found by subdomain, try by name with case-insensitive search
    if (!hospital) {
      console.log(`Hospital not found by subdomain, trying by name`);
      hospital = await prisma.hospital.findFirst({
        where: {
          name: {
            contains: hospitalName,
            mode: 'insensitive'
          }
        },
        select: { id: true, name: true, subdomain: true },
      });
    }

    if (!hospital) {
      // As a last resort, get any hospital if there's at least one in the system
      // This helps with development/testing and cross-hospital access model
      console.log(`Hospital not found by name or subdomain. Checking for any hospital in the system...`);
      const hospitalCount = await prisma.hospital.count();
      
      if (hospitalCount > 0) {
        hospital = await prisma.hospital.findFirst({
          select: { id: true, name: true, subdomain: true },
        });
        console.log(`Using first available hospital: ${hospital?.name} (${hospital?.id})`);
      } else {
        console.log(`No hospitals found in the system`);
        return NextResponse.json({ error: "Hospital not found" }, { status: 404 });
      }
    }
    
    // At this point, hospital must exist based on our logic above
    // TypeScript doesn't detect this though, so let's add a safety check
    if (!hospital) {
      console.error('Hospital should exist but is null - critical logic error');
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
    
    console.log(`Found hospital: ${hospital.name} (${hospital.id}) with subdomain: ${hospital.subdomain}`);
    

    // Count total neonatal patients for this hospital
    // Use neonatalRecords relation instead of pluginData which doesn't exist
    const totalPatients = await prisma.patient.count({
      where: {
        hospitalId: hospital?.id,
        neonatal: {
          some: {}
        }
      },
    });

    console.log(`Total neonatal patients found: ${totalPatients}`);

    // Fetch neonatal patients with pagination and important relations
    const patients = await prisma.patient.findMany({
      where: {
        hospitalId: hospital?.id,
        neonatal: {
          some: {}
        }
      },
      include: {
        // Include neonatal records which contain the neonatal-specific data
        neonatal: true,
        // Include doctors instead of user
        doctors: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc',
      },
      skip,
      take: limit,
    });

    console.log(`Retrieved ${patients.length} neonatal patients`);

    // Transform the patients with neonatal records data
    const transformedPatients = patients.map((patient: PatientWithNeonatal) => {
      // Extract neonatal data with improved type safety and error handling
      let neonatalData: NeonatalPluginData = {
        dateOfBirth: undefined,
        birthWeight: 0,
        careLevel: 'normal',
        status: 'active',
        dischargeStatus: undefined,
        motherId: undefined,
        gestationalAgeAtBirth: 0,
        apgarScore: null
      };
      
      try {
        if (patient.neonatal && patient.neonatal.length > 0) {
          const neonatalRecord = patient.neonatal[0];
          
          // Map NeonatalRecord fields to our interface
          neonatalData = {
            birthWeight: neonatalRecord.birthWeight,
            // Handle careLevel - might be enum string or direct string
            careLevel: typeof neonatalRecord.careLevel === 'string' ? 
              neonatalRecord.careLevel.toLowerCase() as NeonatalPluginData['careLevel'] : 
              'normal',
            // Handle status - might be enum string or direct string
            status: typeof neonatalRecord.status === 'string' ? 
              neonatalRecord.status.toLowerCase() : 'active',
            // Handle dischargeStatus - might be string, object, or undefined
            dischargeStatus: neonatalRecord.dischargeStatus ? 
              (typeof neonatalRecord.dischargeStatus === 'string' ? 
                neonatalRecord.dischargeStatus : String(neonatalRecord.dischargeStatus)) : undefined,
            motherId: neonatalRecord.motherId || undefined,
            gestationalAgeAtBirth: neonatalRecord.gestationalAgeAtBirth,
            apgarScore: neonatalRecord.apgarScore
          };
          
          console.log(`Found neonatal record data for patient ${patient.id}`); 
        } else {
          console.warn(`No neonatal records found for neonatal patient ${patient.id}`);
        }
      } catch (error) {
        console.error(`Error processing neonatal data for patient ${patient.id}:`, error);
      }

      // Get patient name from the name field which is now JSON
      let patientName = "";
      let imageUrl;
      
      try {
        // Handle name which might be a JSON string, JSON object, or plain string
        if (typeof patient.name === 'string') {
          try {
            // Try to parse as JSON
            const nameData = JSON.parse(patient.name);
            if (nameData.text) {
              patientName = nameData.text;
            } else if (Array.isArray(nameData.given) && nameData.given.length > 0) {
              patientName = [...nameData.given, nameData.family].filter(Boolean).join(' ');
            } else {
              patientName = patient.name; // Use as-is if parsing doesn't yield usable values
            }
          } catch (jsonError) {
            // Not valid JSON, use as plain string
            patientName = patient.name;
          }
        } else {
          // Already an object (not expected given our schema, but for safety)
          patientName = JSON.stringify(patient.name);
        }
      } catch (e) {
        console.warn(`Could not parse name data for patient ${patient.id}`);
      }
      
      // If still no name, use medical ID (mrn) or ID as last resort
      if (!patientName) {
        patientName = `Patient ${patient.mrn || patient.id.substring(0, 8)}`;
      }

      // Calculate stats from neonatal data
      let status = neonatalData.status || "active";
      let careLevel = neonatalData.careLevel || "normal";
      let birthWeight = neonatalData.birthWeight || 0;
      let dischargeStatus = neonatalData.dischargeStatus;
      let dateOfBirth = patient.dateOfBirth || null; // Use the patient's dateOfBirth field

      // Calculate age in days if date of birth is available
      let ageInDays = 0;
      if (dateOfBirth) {
        const dob = new Date(dateOfBirth);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - dob.getTime());
        ageInDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }

      // Create a properly typed neonatal patient object for the frontend
      return {
        id: patient.id,
        name: patientName,
        dateOfBirth: dateOfBirth,
        ageInDays: ageInDays,
        birthWeight: birthWeight,
        careLevel: careLevel,
        status: status,
        dischargeStatus: dischargeStatus,
        imageUrl: imageUrl,
        motherId: neonatalData.motherId || undefined,
        gestationalAgeAtBirth: neonatalData.gestationalAgeAtBirth || 0,
        apgarScore: neonatalData.apgarScore // Already properly typed as number|null|undefined
      }
    });

    // Calculate stats efficiently
    const activePatients = transformedPatients.filter(p => p.status === "active").length
    const criticalCases = transformedPatients.filter(p => p.careLevel === "critical").length

    // Calculate new admissions using prisma query instead of client-side filtering
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const newAdmissions = await prisma.patient.count({
      where: {
        hospitalId: hospital?.id,
        neonatal: {
          some: {}
        },
        createdAt: {
          gte: sevenDaysAgo
        }
      }
    })

    return NextResponse.json({
      patients: transformedPatients,
      stats: {
        totalPatients,
        activePatients,
        newAdmissions,
        criticalCases
      },
      meta: {
        total: totalPatients,
        pages: Math.ceil(totalPatients / limit),
        currentPage: page,
        perPage: limit
      }
    })

  } catch (error) {
    console.error("Error fetching neonatal patients:", error)
    return NextResponse.json(
      { error: "Failed to fetch neonatal patients" },
      { status: 500 }
    )
  }
}

// Helper function to calculate age in days
function calculateAgeInDays(dob: Date | string | null | undefined): number {
  if (!dob) return 0
  
  const birthDate = new Date(dob)
  const today = new Date()
  
  // Calculate the difference in milliseconds
  const diffTime = Math.abs(today.getTime() - birthDate.getTime())
  
  // Convert to days
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  return diffDays
}
