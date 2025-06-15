import { NextRequest, NextResponse } from "next/server";
import { generateMedicalID, isValidMedicalID } from "@/utils/medical-id";
import { prisma } from "@/lib/prisma";

/**
 * Generate a new medical ID for a patient
 * POST /api/patients/medical-id
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { patientId, customMedicalId } = body;

    if (!patientId) {
      return NextResponse.json(
        { error: "Patient ID is required" },
        { status: 400 }
      );
    }

    // Find the patient
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      return NextResponse.json(
        { error: "Patient not found" },
        { status: 404 }
      );
    }

    // If a custom medical ID is provided, validate it
    if (customMedicalId) {
      if (!isValidMedicalID(customMedicalId)) {
        return NextResponse.json(
          { 
            error: "Invalid medical ID format. Must be 5 characters from A-H, J-N, P-Z, 2-9" 
          },
          { status: 400 }
        );
      }

      // Check if the custom medical ID is already in use
      const existingPatient = await prisma.patient.findFirst({
        where: { 
          medicalNumber: customMedicalId,
          NOT: { id: patientId }
        },
      });

      if (existingPatient) {
        return NextResponse.json(
          { error: "Medical ID already in use" },
          { status: 409 }
        );
      }
    }

    // Generate a new medical ID if none was provided
    let medicalId = customMedicalId;
    let isUnique = false;
    let attempts = 0;
    const MAX_ATTEMPTS = 10;

    // Generate and check uniqueness if no custom ID is provided
    if (!medicalId) {
      while (!isUnique && attempts < MAX_ATTEMPTS) {
        medicalId = generateMedicalID();
        attempts++;
        
        // Check if the generated ID is already in use
        const existingPatient = await prisma.patient.findFirst({
          where: { medicalNumber: medicalId },
        });
        
        if (!existingPatient) {
          isUnique = true;
        }
      }

      if (!isUnique) {
        return NextResponse.json(
          { error: "Failed to generate a unique medical ID after multiple attempts" },
          { status: 500 }
        );
      }
    }

    // Update the patient with the new medical ID
    const updatedPatient = await prisma.patient.update({
      where: { id: patientId },
      data: { 
        medicalNumber: medicalId,
        // Track when the medical ID was assigned
        updatedAt: new Date()
      },
      select: {
        id: true,
        name: true,
        medicalNumber: true,
        email: true,
        hospitalId: true,
        // phoneNumber field was removed as it doesn't exist in the Patient schema
      }
    });

    return NextResponse.json({
      message: "Medical ID assigned successfully",
      patient: updatedPatient
    });
    
  } catch (error) {
    console.error("Error assigning medical ID:", error);
    return NextResponse.json(
      { error: "Failed to assign medical ID" },
      { status: 500 }
    );
  }
}

/**
 * Verify if a medical ID is valid and available
 * GET /api/patients/medical-id/check?id=ABC12
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const medicalId = searchParams.get("id");

    if (!medicalId) {
      return NextResponse.json(
        { error: "Medical ID is required" },
        { status: 400 }
      );
    }

    // Validate the format
    if (!isValidMedicalID(medicalId)) {
      return NextResponse.json({
        valid: false,
        available: false,
        message: "Invalid medical ID format"
      });
    }

    // Check if the medical ID is already in use
    const existingPatient = await prisma.patient.findFirst({
      where: { medicalNumber: medicalId },
    });

    return NextResponse.json({
      valid: true,
      available: !existingPatient,
      message: existingPatient ? "Medical ID is already in use" : "Medical ID is available"
    });
    
  } catch (error) {
    console.error("Error checking medical ID:", error);
    return NextResponse.json(
      { error: "Failed to check medical ID" },
      { status: 500 }
    );
  }
}
