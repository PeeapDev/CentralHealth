import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET endpoint to debug patient data - for development use only
export async function GET(req: NextRequest) {
  try {
    // Get a list of all patients (limit to 5 for safety)
    const patients = await prisma.patient.findMany({
      take: 5,
      select: {
        id: true,
        email: true,
        active: true,
        gender: true,
        birthDate: true,
        medicalNumber: true,
        firstName: true,
        lastName: true,
      }
    });

    if (!patients || patients.length === 0) {
      return NextResponse.json({
        message: 'No patients found in database',
        suggestion: 'Try registering a patient first or check database connection'
      }, { status: 404 });
    }

    // Return sample patient data for debugging
    return NextResponse.json({
      message: 'Found patients in database',
      count: patients.length,
      samplePatients: patients,
      suggestion: 'Use one of these emails in localStorage.setItem("userEmail", "email@example.com")'
    });

  } catch (error) {
    console.error('Error debugging patients:', error);
    return NextResponse.json(
      { error: 'Server error while debugging patients', details: (error as Error).message },
      { status: 500 }
    );
  }
}
