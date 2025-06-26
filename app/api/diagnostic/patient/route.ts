import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma-client';

export async function GET(request: NextRequest) {
  const patientId = request.nextUrl.searchParams.get('id') || '5b06892e-7a84-4802-8f45-a48d01c5b1eb';
  
  try {
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        User: true,
        Emails: true,
        Phones: true,
        ProfilePicture: true
      }
    });
    
    if (!patient) {
      return NextResponse.json({ 
        error: 'Patient not found', 
        patientId 
      }, { status: 404 });
    }
    
    return NextResponse.json({
      patient: {
        id: patient.id,
        mrn: patient.mrn,
        name: patient.name,
        gender: patient.gender,
        dateOfBirth: patient.dateOfBirth,
        user: patient.User,
        emails: patient.Emails,
        phones: patient.Phones,
        hasProfilePicture: !!patient.ProfilePicture
      }
    });
    
  } catch (error) {
    console.error('Error fetching patient:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch patient data', 
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
