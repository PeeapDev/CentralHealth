import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPatientSession } from "@/lib/patient-session";

// Type definitions for consistent data structure
type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

interface MedicalHistory {
  allergies?: string[];
  chronicConditions?: string[];
  bloodGroup?: BloodGroup;
  [key: string]: any; // Allow additional properties
}

interface UserProfile {
  id: string;
  role?: string;
  name?: string;
  email?: string;
  image?: string | null;
}

interface FormattedPatient {
  id: string;
  mrn: string;
  name: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  gender?: string;
  bloodGroup?: string;
  allergies: string[];
  chronicConditions: string[];
  email?: string;
  phone?: string;
  userId?: string;
  userProfile?: UserProfile;
  qrCode?: string;
  createdAt: string;
  updatedAt: string;
}

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    // 1. Authentication Check
    const session = await getPatientSession();
    if (!session?.isLoggedIn || !session.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // 2. Fetch Patient Data
    const patient = await prisma.patient.findUnique({
      where: { id: session.id }
    });
    
    // Separately fetch user data if patient has userId
    let userData = null;
    if (patient?.userId) {
      userData = await prisma.user.findUnique({
        where: { id: patient.userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          photo: true
        }
      });
    }

    if (!patient) {
      return NextResponse.json(
        { error: "Patient record not found" },
        { status: 404 }
      );
    }

    // 3. Parse Medical History
    let medicalHistory: MedicalHistory = {};
    try {
      if (patient.medicalHistory) {
        medicalHistory = typeof patient.medicalHistory === 'string' 
          ? JSON.parse(patient.medicalHistory)
          : patient.medicalHistory;
      }
    } catch (error) {
      console.error("Error parsing medical history:", error);
    }

    // 4. Process Name Components
    const nameParts = patient.name?.split(' ') || [];
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    const displayName = patient.name || [firstName, lastName].filter(Boolean).join(' ') || 'Patient';

    // 5. Get Primary Contact Information
    const primaryEmail = userData?.email;
    // We don't have access to phone directly in this model - would need to parse from medicalHistory if needed
    const primaryPhone = undefined; // Use undefined instead of null to match the type

    // 6. Format Response Data
    const formattedPatient: FormattedPatient = {
      id: patient.id,
      mrn: patient.mrn || '',
      name: displayName,
      firstName,
      lastName,
      dateOfBirth: patient.dateOfBirth?.toISOString(),
      gender: patient.gender || undefined,
      bloodGroup: medicalHistory.bloodGroup,
      allergies: medicalHistory.allergies || [],
      chronicConditions: medicalHistory.chronicConditions || [],
      email: primaryEmail,
      phone: primaryPhone,
      userId: patient.userId || undefined,
      qrCode: patient.qrCode || undefined,
      createdAt: patient.createdAt.toISOString(),
      updatedAt: patient.updatedAt.toISOString()
    };

    // 7. Add User Profile if Available
    if (userData) {
      formattedPatient.userProfile = {
        id: userData.id,
        role: userData.role,
        name: userData.name || displayName,
        email: userData.email,
        image: userData.photo
      };
    }

    // 8. Return Successful Response
    return NextResponse.json({
      success: true,
      authenticated: true,
      patient: formattedPatient
    });

  } catch (error) {
    // 9. Error Handling
    console.error("Patient API Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
        authenticated: false
      },
      { status: 500 }
    );
  } finally {
    // 10. Cleanup Database Connection
    await prisma.$disconnect();
  }
}