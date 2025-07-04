import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

/**
 * API route to check if a patient is already registered for antenatal care
 * at any hospital in the system.
 * 
 * This follows CentralHealth System requirements by ensuring:
 * - We never generate new medical IDs for existing patients
 * - We track hospital transfers properly
 * - We maintain consistent patient data across hospitals
 */
export async function GET(request: Request) {
  try {
    // Ensure authenticated user
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get patient ID from query parameters
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    
    if (!patientId) {
      return NextResponse.json({ error: 'Patient ID is required' }, { status: 400 });
    }

    // Check if patient has existing antenatal registration
    const existingRegistration = await prisma.antenatalRegistration.findFirst({
      where: {
        patientId: patientId,
      },
      orderBy: {
        updatedAt: 'desc',
      },
      include: {
        hospital: true,
        bookingVisit: true,
        medicalHistory: true,
        physicalExam: true,
        labResults: true,
        visitSchedule: true,
      },
    });

    if (!existingRegistration) {
      return NextResponse.json({ 
        isRegistered: false 
      });
    }

    // Patient is registered - return hospital and registration details
    return NextResponse.json({
      isRegistered: true,
      hospitalName: existingRegistration.hospital.name,
      registrationDate: existingRegistration.createdAt,
      lastVisitDate: existingRegistration.updatedAt,
      antenatalData: {
        bookingVisit: {
          ...existingRegistration.bookingVisit,
          completed: true,
        },
        medicalHistory: {
          ...existingRegistration.medicalHistory,
          completed: true,
        },
        physicalExam: {
          ...existingRegistration.physicalExam,
          completed: true,
        },
        labRequests: {
          ...existingRegistration.labResults,
          completed: true,
        },
        visitPlan: {
          ...existingRegistration.visitSchedule,
          completed: true,
        },
        // Default complications to empty if not available
        complications: {
          riskFactors: existingRegistration.riskFactors || [],
          riskLevel: existingRegistration.riskLevel || 'low',
          completed: true,
        },
      }
    });
  } catch (error) {
    console.error('Error checking antenatal registration:', error);
    return NextResponse.json({ error: 'Failed to check registration status' }, { status: 500 });
  }
}
