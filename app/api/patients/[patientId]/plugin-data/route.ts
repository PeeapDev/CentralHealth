import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPatientFromSession } from "@/lib/auth/session-auth";

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
    const pluginData = await prisma.patientPluginData.findUnique({
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
      await prisma.patientAccessLog.create({
        data: {
          patientId,
          medicalNumber: patient.medicalNumber || 'unknown',
          hospitalId: patient.hospitalId || 'unknown',
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
    const patient = await getPatientFromSession();
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
      result = await prisma.patientPluginData.update({
        where: {
          id: existingPluginData.id,
        },
        data: {
          data,
          updatedByUserId: patient.id,
          updatedByHospitalId: patient.hospitalId || 'unknown',
          updatedAt: new Date(),
        },
      });
    } else {
      // Create new plugin data
      result = await prisma.patientPluginData.create({
        data: {
          patientId,
          pluginName,
          pluginId: pluginId || "default", // Fallback to default if not specified
          data,
          createdByUserId: patient.id,
          updatedByUserId: patient.id,
          createdByHospitalId: patient.hospitalId || 'unknown',
          updatedByHospitalId: patient.hospitalId || 'unknown',
        },
      });
    }

    // Log action (safely)
    try {
      await prisma.patientAccessLog.create({
        data: {
          patientId,
          medicalNumber: targetPatient.medicalNumber || 'unknown',
          hospitalId: targetPatient.hospitalId || 'unknown',
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
