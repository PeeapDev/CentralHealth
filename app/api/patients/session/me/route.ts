import { NextRequest, NextResponse } from "next/server";
import { getPatientSession } from "@/lib/patient-session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    // Get patient session
    const session = await getPatientSession();
    
    if (!session || !session.isLoggedIn) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }
    
    // Get fresh patient data from database
    const patient = await prisma.patient.findUnique({
      where: { id: session.id },
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
    
    if (!patient) {
      return NextResponse.json(
        { error: "Patient not found" },
        { status: 404 }
      );
    }
    
    // Parse JSON fields
    let nameData;
    let telecomData;
    let addressData;
    
    try {
      // Ensure all fields are strings before parsing
      const nameString = typeof patient.name === 'string' ? patient.name : JSON.stringify([]);
      const telecomString = typeof patient.telecom === 'string' ? patient.telecom : JSON.stringify([]);
      const addressString = typeof patient.address === 'string' ? patient.address : JSON.stringify([]);
      
      nameData = JSON.parse(nameString);
      telecomData = JSON.parse(telecomString);
      addressData = JSON.parse(addressString);
    } catch (error) {
      console.error("Error parsing patient JSON fields:", error);
      nameData = [];
      telecomData = [];
      addressData = [];
    }
    
    // Format the patient data for the response
    const formattedPatient = {
      ...patient,
      firstName: nameData?.[0]?.given?.[0] || "",
      lastName: nameData?.[0]?.family || "",
      name: `${nameData?.[0]?.given?.[0] || ""} ${nameData?.[0]?.family || ""}`.trim(),
      // Include parsed data
      nameData,
      telecomData,
      addressData
    };
    
    // Return patient data
    return NextResponse.json({
      authenticated: true,
      patient: formattedPatient
    });
  } catch (error: any) {
    console.error("Error getting patient session:", error);
    return NextResponse.json(
      { 
        error: error.message || "Failed to get patient session",
        authenticated: false
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
