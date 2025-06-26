import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPatientSession, createPatientSession } from "@/lib/patient-session";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    // Get the current session
    const session = await getPatientSession();
    
    // If no session exists, return unauthorized
    if (!session || !session.isLoggedIn) {
      return NextResponse.json(
        { error: "No active session found" },
        { status: 401 }
      );
    }
    
    console.log('Refreshing session for patient ID:', session.id);
    
    // Find patient data in database to verify it exists, but don't modify anything
    const patient = await prisma.patient.findUnique({
      where: { id: session.id }
    });
    
    if (!patient) {
      console.error('Patient not found during session refresh:', session.id);
      return NextResponse.json(
        { error: "Patient not found" },
        { status: 404 }
      );
    }
    
    // CRITICAL: Always use the ORIGINAL session medical ID
    // NEVER generate a new one or replace it
    console.log('Using existing medical ID from session:', session.medicalNumber);
    
    // Re-create the session with the SAME VALUES to extend its lifetime
    // This maintains consistency and prevents medical ID changes
    await createPatientSession({
      id: session.id,
      medicalNumber: session.medicalNumber, // Keep the EXACT SAME medical ID
      firstName: session.firstName,
      lastName: session.lastName,
      email: session.email,
      createdAt: session.createdAt
    });
    
    return NextResponse.json({
      success: true,
      message: "Session refreshed successfully",
      patient: {
        id: session.id,
        medicalId: session.medicalNumber,
        firstName: session.firstName,
        lastName: session.lastName,
        email: session.email
      }
    });
    
  } catch (error: any) {
    console.error('Session refresh error:', error);
    return NextResponse.json(
      { error: error.message || "Failed to refresh session" },
      { status: 500 }
    );
  }
}
