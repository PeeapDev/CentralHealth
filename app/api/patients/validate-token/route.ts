import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  // Get token and reset ID from query params
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  const resetId = url.searchParams.get("id");

  // Validation
  if (!token || !resetId) {
    return NextResponse.json(
      { error: "Missing required parameters" },
      { status: 400 }
    );
  }

  try {
    // Find the password reset request by ID
    const passwordReset = await prisma.passwordReset.findUnique({
      where: {
        id: resetId
      },
      include: {
        patient: {
          select: {
            id: true,
            mrn: true,
            name: true
          }
        }
      }
    });

    if (!passwordReset) {
      console.log(`No password reset request found with id: ${resetId}`);
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 404 }
      );
    }
    
    // Check if token matches
    if (passwordReset.token !== token) {
      console.log('Token mismatch');
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 400 }
      );
    }
    
    // Check if token has been used
    if (passwordReset.usedAt) {
      console.log('Token already used');
      return NextResponse.json(
        { error: "Token has already been used" },
        { status: 400 }
      );
    }
    
    // Check if token is expired
    const now = new Date();
    if (passwordReset.expiresAt < now) {
      console.log('Token expired');
      return NextResponse.json(
        { error: "Token has expired" },
        { status: 400 }
      );
    }
    
    // Include associated patient's medical ID in response
    const patientInfo = passwordReset.patient ? {
      mrn: passwordReset.patient.mrn,
      name: passwordReset.patient.name
    } : null;

    // Token is valid
    return NextResponse.json({ 
      valid: true,
      patientInfo
    }, { status: 200 });
  } catch (error) {
    console.error('Error validating token:', error);
    return NextResponse.json(
      { error: "An error occurred while validating the token" },
      { status: 500 }
    );
  }
}
