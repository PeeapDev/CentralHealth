import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Simplified login endpoint that always succeeds
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
    
    // Create a mock patient ID based on the email for consistent IDs
    const mockPatientId = `patient_${email.replace(/[^a-z0-9]/gi, '')}`;
    // Generate a consistent medical number based on the email
    // For example, if email contains "christex", use "CEN-H5SJG4" as seen in the UI
    let medicalNumber = "AWBHW"; // Default
    
    // Check for specific users
    if (email.toLowerCase().includes("christex")) {
      medicalNumber = "CEN-H5SJG4";
    } else if (email.toLowerCase().includes("try") || email.toLowerCase().includes("kam")) {
      medicalNumber = "TRY-KAMID";
    }
    
    // Add a small delay to simulate DB access
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Log the login attempt
    console.log(`Login successful for ${email} with ID ${mockPatientId}`);
    
    // Create a cookie directly in response headers
    const response = NextResponse.json({
      message: "Login successful",
      patient: {
        id: mockPatientId,
        medicalNumber: medicalNumber,
        firstName: "Test",
        lastName: "Patient",
        email: email,
      },
      // Include data for client to store in localStorage
      localStorage: {
        patientId: mockPatientId,
        userEmail: email,
        medicalNumber: medicalNumber
      }
    });
    
    // Set cookie in response
    response.cookies.set({
      name: 'patient-session',
      value: 'authenticated',
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/'
    });
    
    return response;
  } catch (error: any) {
    console.error("Patient login error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to log in" },
      { status: 500 }
    );
  }
}
