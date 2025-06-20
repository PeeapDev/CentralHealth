import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuthHeader } from '@/lib/auth/jwt';

/**
 * Get patient details by ID
 */
export async function GET(
  request: NextRequest, 
  { params }: { params: { patientId: string | Promise<string> } }
) {
  try {
    const patientId = await params.patientId;

    // Verify authentication token from header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization header is required' }, { status: 401 });
    }
    
    const payload = await verifyAuthHeader(authHeader);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    // Build query to fetch patient
    let query: any = { id: patientId };
    
    // Non-admin users can only access patients within their hospital
    if (payload.role !== 'superadmin') {
      query.hospitalId = payload.hospitalId;
    }
    
    // Patients can only access their own data
    if (payload.role === 'patient') {
      query.id = payload.userId;
      
      // If the requested ID is not the patient's own ID, return forbidden
      if (patientId !== payload.userId) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }
    
    // Fetch patient with medical records and appointments
    const patient = await prisma.patient.findUnique({
      where: query,
      include: {
        records: { // 'records' not 'medicalRecords' in the schema
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        appointments: {
          orderBy: { createdAt: 'desc' }, // 'createdAt' not 'scheduledDate' in the schema
          take: 10,
        },
        hospital: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }
    
    return NextResponse.json({ patient });
  } catch (error) {
    console.error('Error fetching patient details:', error);
    return NextResponse.json({ error: 'Failed to fetch patient details' }, { status: 500 });
  }
}

/**
 * Update patient details
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { patientId: string | Promise<string> } }
) {
  try {
    const patientId = await params.patientId;
    
    // Verify authentication token from header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization header is required' }, { status: 401 });
    }
    
    const payload = await verifyAuthHeader(authHeader);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }
    
    // Check permissions - only admin, provider, or the patient themselves can update
    const isAuthorized = 
      payload.role === 'admin' || 
      payload.role === 'provider' || 
      (payload.role === 'patient' && payload.userId === patientId);
    
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }
    
    // Get update data
    const data = await request.json();
    
    // Check if patient exists
    const patient = await prisma.patient.findUnique({
      where: { id: patientId }
    });
    
    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }
    
    // For patients updating their own data, limit what they can update
    const updateData: any = {};
    
    // Basic fields anyone can update
    if (data.phone !== undefined) updateData.phone = data.phone;
    
    // Fields only admin/provider can update
    if (payload.role === 'admin' || payload.role === 'provider') {
      if (data.name !== undefined) updateData.name = data.name;
      if (data.email !== undefined) updateData.email = data.email;
      if (data.dateOfBirth !== undefined) {
        updateData.dateOfBirth = data.dateOfBirth ? new Date(data.dateOfBirth) : null;
      }
      if (data.gender !== undefined) updateData.gender = data.gender;
      if (data.medicalNumber !== undefined) updateData.medicalNumber = data.medicalNumber;
    }
    
    // Update patient
    const updatedPatient = await prisma.patient.update({
      where: { id: patientId },
      data: updateData
    });
    
    return NextResponse.json({ success: true, patient: updatedPatient });
    
  } catch (error) {
    console.error('Error updating patient:', error);
    return NextResponse.json({ error: 'Failed to update patient' }, { status: 500 });
  }
}

/**
 * Delete patient
 * Only admin can delete patients
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { patientId: string | Promise<string> } }
) {
  try {
    const patientId = await params.patientId;
    
    // Verify authentication token from header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization header is required' }, { status: 401 });
    }
    
    const payload = await verifyAuthHeader(authHeader);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }
    
    // Only admin can delete patients
    if (payload.role !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }
    
    // First check if the patient exists
    const patient = await prisma.patient.findUnique({
      where: { id: patientId, hospitalId: payload.hospitalId }
    });
    
    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }
    
    // Delete patient
    await prisma.patient.delete({
      where: { id: patientId }
    });
    
    return NextResponse.json({ success: true, message: 'Patient deleted successfully' });
    
  } catch (error) {
    console.error('Error deleting patient:', error);
    return NextResponse.json({ error: 'Failed to delete patient' }, { status: 500 });
  }
}
