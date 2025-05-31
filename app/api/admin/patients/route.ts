import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET handler to fetch all registered patients from MongoDB
export async function GET(request: NextRequest) {
  try {
    // Fetch all patients from the database
    const patients = await prisma.patient.findMany({
      select: {
        id: true,
        medicalNumber: true,
        name: true,
        gender: true,
        birthDate: true,
        email: true,
        photo: true,
        createdAt: true,
        active: true,
        telecom: true,
        address: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    // Format patients for the response
    const formattedPatients = patients.map(patient => {
      // Extract name from FHIR format
      const nameObj = patient.name as any;
      const firstName = nameObj?.given?.[0] || '';
      const lastName = nameObj?.family || '';
      const fullName = nameObj?.text || `${firstName} ${lastName}`;
      
      // Get email from telecom if available
      let email = patient.email as string;
      if (!email && patient.telecom) {
        const emailContact = (patient.telecom as any[])?.find(t => t.system === 'email');
        if (emailContact) {
          email = emailContact.value;
        }
      }

      return {
        id: patient.id,
        medicalNumber: patient.medicalNumber,
        firstName,
        lastName,
        name: fullName,
        gender: patient.gender,
        birthDate: patient.birthDate,
        email,
        photo: patient.photo,
        active: patient.active,
        createdAt: patient.createdAt
      };
    });
    
    // Return the formatted patients
    return NextResponse.json({ 
      success: true, 
      patients: formattedPatients
    });
  } catch (error) {
    console.error('Error fetching patients:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch patients',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
