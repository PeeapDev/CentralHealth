import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

/**
 * API route to save antenatal booking visit data
 * 
 * This follows CentralHealth System requirements by ensuring:
 * - We maintain the patient's permanent medical ID
 * - We never generate new medical IDs for existing patients
 * - We properly track hospital transfers and visit history
 */
export async function POST(request: Request) {
  try {
    // Ensure authenticated user
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get request data
    const { patientId, hospitalName, bookingVisitData, isTransfer } = await request.json();
    
    if (!patientId || !hospitalName || !bookingVisitData) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get patient details to ensure we maintain permanent medical ID
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      select: { 
        id: true, 
        mrn: true,  // Permanent medical ID that must NEVER be regenerated
        name: true
      }
    });

    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    // Get hospital
    const hospital = await prisma.hospital.findFirst({
      where: { name: hospitalName }
    });

    if (!hospital) {
      return NextResponse.json({ error: 'Hospital not found' }, { status: 404 });
    }

    // Handle existing registration (update) or create new
    const existingRegistration = await prisma.antenatalRegistration.findFirst({
      where: { patientId: patientId },
      include: { bookingVisit: true }
    });

    if (existingRegistration) {
      // Update existing booking visit
      const updatedBookingVisit = await prisma.antenatalBookingVisit.update({
        where: { id: existingRegistration.bookingVisit.id },
        data: {
          lmp: new Date(bookingVisitData.lmp),
          edd: new Date(bookingVisitData.edd),
          gravida: parseInt(bookingVisitData.gravida),
          para: parseInt(bookingVisitData.para),
          updatedAt: new Date(),
          updatedBy: session.user?.id || 'system'
        }
      });

      // If this is a hospital transfer, update the hospital relation
      if (isTransfer) {
        await prisma.antenatalRegistration.update({
          where: { id: existingRegistration.id },
          data: {
            hospitalId: hospital.id,
            updatedAt: new Date(),
            transferredAt: new Date(),
            transferredFrom: existingRegistration.hospitalId,
            updatedBy: session.user?.id || 'system'
          }
        });
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Booking visit updated successfully',
        bookingVisit: updatedBookingVisit
      });
    } else {
      // Create new booking visit and registration
      const newBookingVisit = await prisma.antenatalBookingVisit.create({
        data: {
          lmp: new Date(bookingVisitData.lmp),
          edd: new Date(bookingVisitData.edd),
          gravida: parseInt(bookingVisitData.gravida),
          para: parseInt(bookingVisitData.para),
          createdBy: session.user?.id || 'system'
        }
      });

      // Create antenatal registration
      const newRegistration = await prisma.antenatalRegistration.create({
        data: {
          patientId: patientId,
          hospitalId: hospital.id,
          bookingVisitId: newBookingVisit.id,
          riskLevel: 'low', // Default risk level
          createdBy: session.user?.id || 'system'
        }
      });

      return NextResponse.json({ 
        success: true, 
        message: 'Booking visit created successfully',
        bookingVisit: newBookingVisit,
        registration: newRegistration
      });
    }
  } catch (error) {
    console.error('Error saving booking visit data:', error);
    return NextResponse.json({ error: 'Failed to save booking visit data' }, { status: 500 });
  }
}
