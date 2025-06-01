import { NextRequest, NextResponse } from "next/server";
import { getPatientSession } from "@/lib/patient-session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function PUT(req: NextRequest) {
  try {
    // Get patient session
    const session = await getPatientSession();
    
    if (!session || !session.isLoggedIn) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }
    
    // Get request body
    const { email, phone, address } = await req.json();
    
    // Update patient in database
    const updatedPatient = await prisma.patient.update({
      where: { id: session.id },
      data: {
        email,
        phone,
        address: JSON.stringify(address) // Store address as JSON string
      },
      select: {
        id: true,
        medicalNumber: true,
        email: true,
        name: true,
        gender: true,
        birthDate: true,
        phone: true,
        active: true,
        resourceType: true,
        hospitalId: true,
        telecom: true,
        address: true
      }
    });
    
    if (!updatedPatient) {
      return NextResponse.json(
        { error: "Failed to update patient" },
        { status: 500 }
      );
    }
    
    // Return updated patient data
    return NextResponse.json(updatedPatient);
    
  } catch (error) {
    console.error("Error updating patient profile:", error);
    return NextResponse.json(
      { error: "Failed to update patient profile" },
      { status: 500 }
    );
  }
}
