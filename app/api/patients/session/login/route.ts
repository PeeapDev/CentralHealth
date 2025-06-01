import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createPatientSession } from "@/lib/patient-session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate required fields
    const { email, password } = body;
    
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }
    
    // Find patient by email
    const patient = await prisma.patient.findFirst({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        active: true,
        medicalNumber: true,
        name: true
      }
    });
    
    // If patient not found or has no password set
    if (!patient || !patient.password) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }
    
    // Check password match
    const passwordMatch = await bcrypt.compare(password, patient.password);
    if (!passwordMatch) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }
    
    // Check if patient is active
    if (!patient.active) {
      return NextResponse.json(
        { error: "Your account is not active" },
        { status: 403 }
      );
    }
    
    // Parse patient name from JSON
    let firstName = "";
    let lastName = "";
    
    try {
      // Ensure patient.name is a string before parsing
      const nameString = typeof patient.name === 'string' ? patient.name : JSON.stringify([]);
      const nameData = JSON.parse(nameString);
      if (Array.isArray(nameData) && nameData.length > 0) {
        lastName = nameData[0].family || "";
        firstName = Array.isArray(nameData[0].given) ? nameData[0].given[0] || "" : "";
      }
    } catch (error) {
      console.error("Error parsing patient name:", error);
    }
    
    // Create patient session
    await createPatientSession({
      id: patient.id,
      medicalNumber: patient.medicalNumber,
      firstName,
      lastName,
      email: patient.email || email, // Use the login email as fallback
      createdAt: new Date().toISOString(),
    });
    
    // Return success response with patient data
    return NextResponse.json({
      message: "Login successful",
      patient: {
        id: patient.id,
        medicalNumber: patient.medicalNumber,
        firstName,
        lastName,
        email: patient.email,
      },
    });
  } catch (error: any) {
    console.error("Patient login error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to log in" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
