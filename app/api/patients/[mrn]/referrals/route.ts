import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';

/**
 * GET /api/patients/[mrn]/referrals
 * 
 * Fetches all referrals for a patient with the given medical number.
 * Requires authentication and the user must be the patient or have appropriate permissions.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { mrn: string } }
) {
  try {
    // Get the authenticated session
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const { mrn } = params;
    
    // Validate medical number format
    if (!mrn || typeof mrn !== 'string' || mrn.length !== 5) {
      return NextResponse.json(
        { error: 'Invalid medical number format' },
        { status: 400 }
      );
    }
    
    // Find the patient by medical number
    const patient = await prisma.patient.findFirst({
      where: {
        mrn: mrn
      }
    });
    
    if (!patient) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      );
    }
    
    // Check if the authenticated user is the patient or has appropriate permissions
    const isPatientUser = session.user.id === patient.userId;
    const isAuthorizedStaff = session.user.role === 'ADMIN' || 
                              session.user.role === 'DOCTOR' || 
                              session.user.role === 'NURSE';
    
    if (!isPatientUser && !isAuthorizedStaff) {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 403 }
      );
    }
    
    // Fetch all referrals for the patient
    const referrals = await prisma.referral.findMany({
      where: {
        patientId: patient.id
      },
      include: {
        fromHospital: {
          select: {
            id: true,
            name: true,
            address: true,
            phone: true
          }
        },
        toHospital: {
          select: {
            id: true,
            name: true,
            address: true,
            phone: true
          }
        },
        referringDoctor: {
          select: {
            id: true,
            name: true,
            specialty: true
          }
        },
        receivingDoctor: {
          select: {
            id: true,
            name: true,
            specialty: true
          }
        },
        ambulanceDispatch: {
          select: {
            id: true,
            status: true,
            dispatchTime: true,
            estimatedArrival: true,
            ambulanceId: true,
            driverName: true,
            driverPhone: true,
            currentLocation: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    // Return the referrals
    return NextResponse.json(referrals);
  } catch (error) {
    console.error('Error fetching patient referrals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch referrals' },
      { status: 500 }
    );
  }
}
