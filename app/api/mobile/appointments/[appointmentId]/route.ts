import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuthHeader } from '@/lib/auth/jwt';

/**
 * GET a specific appointment
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { appointmentId: string } }
) {
  try {
    // Verify authentication token from header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization header is required' }, { status: 401 });
    }

    const payload = await verifyAuthHeader(authHeader);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const appointmentId = params.appointmentId;
    
    // Find the appointment
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            email: true,
            medicalNumber: true,
            gender: true,
            birthDate: true
          }
        },
        doctor: {
          select: {
            id: true,
            name: true,
            role: true,
            email: true
          }
        }
      }
    });

    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    // Check if user has permission to access this appointment
    if (payload.role === 'patient' && appointment.patientId !== payload.userId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    if (payload.role === 'provider' && appointment.doctorId !== payload.userId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json({ appointment });
    
  } catch (error) {
    console.error('Error fetching appointment:', error);
    return NextResponse.json({ error: 'Failed to fetch appointment' }, { status: 500 });
  }
}

/**
 * PUT - Update a specific appointment
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { appointmentId: string } }
) {
  try {
    // Verify authentication token from header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization header is required' }, { status: 401 });
    }

    const payload = await verifyAuthHeader(authHeader);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const appointmentId = params.appointmentId;
    const data = await request.json();
    
    // Find the appointment first to check permissions
    const existingAppointment = await prisma.appointment.findUnique({
      where: { id: appointmentId }
    });

    if (!existingAppointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    // Check permissions based on role
    if (payload.role === 'patient' && existingAppointment.patientId !== payload.userId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    if (payload.role === 'provider' && existingAppointment.doctorId !== payload.userId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Apply different update rules based on user role
    let updateData: any = {
      updatedAt: new Date()
    };
    
    // Admin can update any field
    if (payload.role === 'admin') {
      if (data.status) updateData.status = data.status;
      if (data.notes) updateData.notes = data.notes;
      if (data.patientId) updateData.patientId = data.patientId;
      if (data.doctorId) updateData.doctorId = data.doctorId;
    } 
    // Providers can update status and notes
    else if (payload.role === 'provider') {
      if (data.status) updateData.status = data.status;
      if (data.notes) updateData.notes = data.notes;
    } 
    // Patients can only cancel their appointments or update notes
    else if (payload.role === 'patient') {
      if (data.status === 'cancelled') updateData.status = 'cancelled'; 
      if (data.notes) updateData.notes = data.notes;
    }

    // Update the appointment
    const updatedAppointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: updateData,
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            medicalNumber: true
          }
        },
        doctor: {
          select: {
            id: true,
            name: true,
            role: true
          }
        }
      }
    });

    return NextResponse.json({ appointment: updatedAppointment });
    
  } catch (error) {
    console.error('Error updating appointment:', error);
    return NextResponse.json({ error: 'Failed to update appointment' }, { status: 500 });
  }
}

/**
 * DELETE an appointment
 * Only admins can delete appointments
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { appointmentId: string } }
) {
  try {
    // Verify authentication token from header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization header is required' }, { status: 401 });
    }

    const payload = await verifyAuthHeader(authHeader);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    // Only admins can delete appointments
    if (payload.role !== 'admin') {
      return NextResponse.json({ 
        error: 'Only administrators can delete appointments'
      }, { status: 403 });
    }

    const appointmentId = params.appointmentId;
    
    // Check if appointment exists
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId }
    });

    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    // Delete the appointment
    await prisma.appointment.delete({
      where: { id: appointmentId }
    });

    return NextResponse.json({ 
      success: true,
      message: 'Appointment deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting appointment:', error);
    return NextResponse.json({ error: 'Failed to delete appointment' }, { status: 500 });
  }
}
