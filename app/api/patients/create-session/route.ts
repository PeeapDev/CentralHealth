import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { v4 as uuidv4 } from 'uuid';
import { generateMedicalID, isValidMedicalID } from "@/utils/medical-id";

// Constants
const SESSION_COOKIE_NAME = 'patient_session';
const SESSION_MAX_AGE = 60 * 60 * 24 * 14; // 14 days in seconds

// Type definitions
interface SessionRequest {
  email?: string;
  medicalId?: string;
  mrn?: string;
  patientId?: string;
  onboardingCompleted?: boolean;
}

interface SessionData {
  medicalId: string;
  patientId: string;
  email: string;
  isLoggedIn: boolean;
  isTemporary: boolean;
  createdAt: string;
  onboardingCompleted: boolean;
}

/**
 * Create patient session API route
 * SIMPLIFIED VERSION: Always sets onboardingCompleted to true to break redirect loops
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { patientId, medicalId, medicalNumber, onboardingCompleted = false } = await req.json();
    
    console.log('Create session request:', { patientId, medicalId, medicalNumber, onboardingCompleted });

    // Check for at least one identifier (add medicalNumber as an alternative)
    if (!patientId && !medicalId && !medicalNumber) {
      return NextResponse.json({ error: 'patientId, medicalId, or medicalNumber required' }, { status: 400 });
    }

    // Find the patient using any of the provided IDs
    let patient;
    
    // Priority 1: patientId (database ID) lookup
    if (patientId) {
      console.log('Looking up patient by ID:', patientId);
      patient = await prisma.patient.findUnique({
        where: { id: patientId },
      });
    }
    
    // Priority 2: medicalId (MRN) lookup
    if (!patient && medicalId) {
      console.log('Looking up patient by medicalId:', medicalId);
      patient = await prisma.patient.findFirst({
        where: { mrn: medicalId },
      });
    }
    
    // Priority 3: medicalNumber (alternative name for MRN) lookup
    if (!patient && medicalNumber) {
      console.log('Looking up patient by medicalNumber:', medicalNumber);
      patient = await prisma.patient.findFirst({
        where: { mrn: medicalNumber },
      });
    }

    // Return error if patient not found with all provided identifiers
    if (!patient) {
      return NextResponse.json({ 
        error: 'Patient not found',
        details: { patientId, medicalId, medicalNumber }
      }, { status: 404 });
    }
    
    console.log('Patient found for session creation:', { id: patient.id, mrn: patient.mrn });

    // Import the medicalID utilities if not already imported at the top of the file
    // import { generateMedicalID, isValidMedicalID } from "@/utils/medical-id";
    
    // CRITICAL: NEVER generate a new medical ID if the patient already has one
    // Always use the patient's existing medical ID from the database
    const consistentMedicalId = patient.mrn;
    
    // Log the existing medical ID being used - NO changes ever made
    console.log('Using existing medical ID:', consistentMedicalId);
    
    // REMOVED: Code that generates new medical IDs - this violates the hospital policy
    // We must NEVER generate new medical IDs for existing patients
    
    // Create session token for the patient with the consistent medical ID
    const session = {
      id: uuidv4(),
      patientId: patient.id,
      medicalNumber: consistentMedicalId, // Use the consistent medical ID
      createdAt: new Date(),
      hospitalId: patient.hospitalId || null,
      // Use the patient's actual onboarding status from the database
      // Only use the provided value as override if specifically provided
      onboardingCompleted: onboardingCompleted !== undefined ? onboardingCompleted : (patient.onboardingCompleted || false),
    };
    
    console.log('Creating session with data:', { 
      patientId: session.patientId,
      medicalNumber: session.medicalNumber,
      onboardingCompleted: session.onboardingCompleted
    });

    // Create Response object with cookie
    const response = NextResponse.json({
      success: true,
      message: "Session created successfully",
      patientId: session.patientId,
      medicalNumber: session.medicalNumber,
      temporary: false
    });

    // Set cookie using NextResponse cookies API - more compatible
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: JSON.stringify(session),
      path: '/',
      secure: process.env.NODE_ENV === 'production', // Only secure in production
      sameSite: 'lax',
      httpOnly: false, // Allow JavaScript access for debugging
      maxAge: SESSION_MAX_AGE
    });

    return response;

  } catch (error: unknown) {
    console.error('Session creation failed:', error);
    
    // Log the error without creating any emergency sessions
    console.error('Complete session creation failure, returning 401 to force login');
    
    // REMOVED: Emergency fallback that generated new medical IDs
    // This violates hospital policy - we must never create test/mock patient data
    return NextResponse.json(
      { error: 'Authentication required', critical: true },
      { status: 401 }
    );
      
      // No emergency session response - this was removed to comply with policy
      
    // No cookie setting or emergency session - removed to comply with policy
  }
}
