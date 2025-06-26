import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { patientId, email, phone, address } = body;

    if (!patientId) {
      return NextResponse.json(
        { success: false, message: 'Patient ID is required' },
        { status: 400 }
      );
    }

    // Find the existing patient
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      select: {
        id: true,
        mrn: true,
        contact: true
      }
    });

    if (!patient) {
      return NextResponse.json(
        { success: false, message: 'Patient not found' },
        { status: 404 }
      );
    }

    // Parse existing contact data or initialize empty object
    let contactData = {};
    try {
      if (patient.contact) {
        contactData = typeof patient.contact === 'string'
          ? JSON.parse(patient.contact)
          : patient.contact;
      }
    } catch (e) {
      console.error('Failed to parse contact data:', e);
    }

    // Update contact data with new information
    const updatedContactData = {
      ...contactData,
      ...(email && { email }),
      ...(phone && { phone })
    };

    // Update address if provided
    if (address) {
      updatedContactData.address = {
        ...((contactData as any).address || {}),
        ...address
      };
    }

    // Update the patient record with the new contact information
    const updatedPatient = await prisma.patient.update({
      where: { id: patientId },
      data: {
        contact: updatedContactData
      },
      select: {
        id: true,
        mrn: true,
        name: true,
        contact: true
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Contact information updated successfully',
      patient: {
        id: updatedPatient.id,
        mrn: updatedPatient.mrn,
        name: updatedPatient.name,
        contact: updatedPatient.contact
      }
    });

  } catch (error: any) {
    console.error('Error updating patient contact:', error);
    return NextResponse.json(
      { success: false, message: 'Error updating contact information', error: error.message },
      { status: 500 }
    );
  }
}
