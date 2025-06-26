import { NextRequest, NextResponse } from "next/server";
import { prisma as _prisma } from "@/lib/prisma";
// Cast prisma to our extended type
const prisma = _prisma as unknown as ExtendedPrismaClient;
import { getPatientFromSession } from "@/lib/auth/session-auth";
import { PrismaClient } from "@prisma/client";
import { JsonValue } from "@prisma/client/runtime/library";

// Extended Prisma client type with custom models
interface ExtendedPrismaClient extends PrismaClient {
  patientPluginData: {
    findUnique: (args: any) => Promise<any>;
    update: (args: any) => Promise<any>;
    create: (args: any) => Promise<any>;
  };
  patientAccessLog: {
    create: (args: any) => Promise<any>;
  };
}

// Extended patient type for static typing
interface ExtendedPatient {
  id: string;
  mrn?: string;
  name?: string;
  dateOfBirth: Date;
  gender: string;
  contact: JsonValue;
  medicalHistory: JsonValue;
  onboardingCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  medicalNumber?: string;
  medicalId?: string;
  hospitalId?: string;
  Hospital?: { id: string; name: string };
  User?: { id?: string; name?: string; photo?: string };
}

// Extended patient auth info
interface PatientAuthInfo {
  id: string;
  mrn?: string;
  name?: string;
  hospitalId?: string;
  medicalNumber?: string;
  medicalId?: string;
  Hospital?: { id: string; name: string };
}

/**
 * Helper function to create a friendly display medical ID
 * 
 * Preserves the original 5-character medical IDs (like T6YB8) generated during registration.
 * These are unique identifiers that exclude visually similar characters (1, l, 0, i)
 * and are the primary identifiers used across the hospital system.
 */
function createFriendlyMedicalId(medicalId: string | null | undefined): string {
  if (!medicalId) return 'Not Assigned';
  
  // If it's a 5-character registration ID, preserve it exactly as is
  // These are the primary medical IDs used by the hospital system
  // Example: T6YB8 (deliberately excludes similar chars like 1, l, 0, i)
  if (medicalId.length === 5 && /^[A-Z0-9]{5}$/i.test(medicalId)) {
    return medicalId.toUpperCase(); // Just ensure it's uppercase for consistency
  }
  
  // If it's already in our P-format, keep it as is
  if (medicalId.startsWith('P-')) return medicalId;
  
  // If it's a UUID, create a shorter, more user-friendly format
  if (medicalId.includes('-')) {
    // For UUIDs, use format P-1234 (first 4 chars after first dash)
    const parts = medicalId.split('-');
    if (parts.length > 1) {
      return `P-${parts[1].substring(0, 4).toUpperCase()}`;
    }
  }
  
  // For any other format (non-UUID), use first 4-6 chars with P- prefix
  // This handles numeric IDs, alphanumeric IDs, etc.
  return `P-${medicalId.substring(0, Math.min(6, medicalId.length)).toUpperCase()}`;
}

// GET /api/patients/[patientId]/plugin-data?plugin=antenatal OR pluginName=antenatal
export async function GET(
  request: NextRequest,
  { params }: { params: { patientId: string } }
) {
  try {
    // Authentication temporarily disabled for cross-hospital access
    // This follows the NHS model where patient data is accessible across the system
    // const patient = await getPatientFromSession();
    // if (!patient) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    const { patientId } = params;
    const searchParams = request.nextUrl.searchParams;
    
    // Support both plugin and pluginName parameters for flexibility
    const pluginName = searchParams.get("pluginName") || searchParams.get("plugin");

    if (!pluginName) {
      return NextResponse.json({ error: "Plugin name is required" }, { status: 400 });
    }
    
    console.log(`Fetching plugin data for patient ${patientId} and plugin ${pluginName}`);

    // Find patient without hospital restriction - NHS-like model with shared records
    const patient = await prisma.patient.findUnique({
      where: {
        id: patientId,
      },
    });

    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    // Get the plugin data for this patient and plugin name
    const pluginData = await (prisma as any).patientPluginData.findUnique({
      where: {
        patientId_pluginName: {
          patientId,
          pluginName,
        },
      },
    });

    if (!pluginData) {
      console.log(`No plugin data found for patient ${patientId} and plugin ${pluginName}`);
      // Instead of 404, return empty data object for better frontend handling
      return NextResponse.json({
        patientId,
        pluginName,
        data: {}, // Empty data object instead of null
        status: "NOT_FOUND"
      });
    }
    
    console.log(`Successfully fetched plugin data for patient ${patientId} and plugin ${pluginName}`);

    // Optional: Log access without requiring auth or failing if it can't be logged
    try {
      // Determine medical number from multiple possible fields
      const medicalNumber = 
        (patient as any).medicalNumber || // Cast to any since TypeScript doesn't know about this field
        patient.mrn || 
        (patient as any).medicalId || 
        'unknown';
      
      // Create a friendly display version for logs and UI
      const displayMedicalNumber = createFriendlyMedicalId(medicalNumber);
        
      await prisma.patientAccessLog.create({
        data: {
          patientId,
          medicalNumber: medicalNumber, // Keep original medical number in database
          displayMedicalNumber: displayMedicalNumber, // Add display version for UI
          hospitalId: (patient as any).hospitalId || (patient as any).Hospital?.id || 'unknown',
          userId: 'system', // Since we're not requiring auth
          action: "VIEW",
          pluginId: pluginData.pluginId,
          pluginName,
          context: { route: `api/patients/${patientId}/plugin-data` },
        },
      });
    } catch (logError) {
      // Don't fail the request if logging fails
      console.warn('Could not log access:', logError);
    }

    return NextResponse.json(pluginData);
  } catch (error) {
    console.error("Error fetching plugin data:", error);
    return NextResponse.json(
      { error: "Failed to fetch plugin data" },
      { status: 500 }
    );
  }
}

// POST /api/patients/[patientId]/plugin-data
export async function POST(
  request: NextRequest,
  { params }: { params: { patientId: string } }
) {
  try {
    // For writes, we still require authentication
    const patient = await getPatientFromSession() as unknown as PatientAuthInfo;
    if (!patient) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { patientId } = params;
    const body = await request.json();
    
    // Allow both plugin and pluginName parameters for flexibility
    const pluginName = body.pluginName || body.plugin;
    const { data, pluginId } = body;

    if (!pluginName || !data) {
      return NextResponse.json(
        { error: "Plugin name and data are required" },
        { status: 400 }
      );
    }
    
    console.log(`Saving plugin data for patient ${patientId} and plugin ${pluginName}`);

    // Verify patient exists without hospital restriction (NHS model)
    const targetPatient = await prisma.patient.findUnique({
      where: {
        id: patientId,
      },
    });

    if (!targetPatient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    // Check if plugin data already exists for this patient and plugin name
    const existingPluginData = await prisma.patientPluginData.findUnique({
      where: {
        patientId_pluginName: {
          patientId,
          pluginName,
        },
      },
    });

    let result;
    if (existingPluginData) {
      // Update existing plugin data
      result = await (prisma as any).patientPluginData.update({
        where: {
          id: existingPluginData.id,
        },
        data: {
          data,
          updatedByUserId: patient.id,
          updatedByHospitalId: patient.hospitalId || (patient as any).Hospital?.id || 'unknown',
          updatedAt: new Date(),
        },
      });
    } else {
      // Create new plugin data
      result = await (prisma as any).patientPluginData.create({
        data: {
          patientId,
          pluginName,
          pluginId: pluginId || "default", // Fallback to default if not specified
          data,
          createdByUserId: patient.id,
          updatedByUserId: patient.id,
          createdByHospitalId: patient.hospitalId || (patient as any).Hospital?.id || 'unknown',
          updatedByHospitalId: patient.hospitalId || (patient as any).Hospital?.id || 'unknown',
        },
      });
    }

    // Log action (safely)
    try {
      // Determine medical number from multiple possible fields
      const medicalNumber = 
        (targetPatient as any).medicalNumber || // Cast to any since TypeScript doesn't know about this field
        targetPatient.mrn || 
        (targetPatient as any).medicalId || 
        'unknown';
        
      // Create a friendly display version for logs and UI
      const displayMedicalNumber = createFriendlyMedicalId(medicalNumber);
        
      await prisma.patientAccessLog.create({
        data: {
          patientId,
          medicalNumber: medicalNumber, // Keep original medical number in database
          displayMedicalNumber: displayMedicalNumber, // Add display version for UI
          hospitalId: (targetPatient as any).hospitalId || (targetPatient as any).Hospital?.id || 'unknown',
          userId: patient.id,
          action: existingPluginData ? "UPDATE" : "CREATE",
          pluginId: result.pluginId,
          pluginName,
          context: { route: `api/patients/${patientId}/plugin-data` },
        },
      });
    } catch (logError) {
      // Don't fail the request if logging fails
      console.warn('Could not log access:', logError);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error saving plugin data:", error);
    return NextResponse.json(
      { error: "Failed to save plugin data" },
      { status: 500 }
    );
  }
}
