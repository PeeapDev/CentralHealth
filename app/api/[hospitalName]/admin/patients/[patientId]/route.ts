import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET individual patient details
 * GET /api/[hospitalName]/admin/patients/[patientId]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { hospitalName: string | Promise<string>; patientId: string | Promise<string> } }
) {
  try {
    const hospitalName = await params.hospitalName;
    const patientId = await params.patientId;

    if (!patientId) {
      return NextResponse.json(
        { error: "Patient ID is required" },
        { status: 400 }
      );
    }

    // Find the hospital by subdomain
    const hospital = await prisma.hospital.findFirst({
      where: {
        subdomain: hospitalName,
      },
      select: {
        id: true,
      },
    });

    if (!hospital) {
      return NextResponse.json(
        { error: "Hospital not found" },
        { status: 404 }
      );
    }

    // Find the patient by ID and hospital
    const patient = await prisma.patient.findFirst({
      where: {
        id: patientId,
        hospitalId: hospital.id,
      },
    });

    if (!patient) {
      return NextResponse.json(
        { error: "Patient not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(patient);
  } catch (error) {
    console.error("Error fetching patient:", error);
    return NextResponse.json(
      { error: "Failed to fetch patient" },
      { status: 500 }
    );
  }
}
