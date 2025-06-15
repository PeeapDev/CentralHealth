import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuthHeader } from '@/lib/auth/jwt';

/**
 * Mobile-optimized appointments endpoint
 * Used by the Flutter mobile app to fetch appointments
 */
export async function GET(request: NextRequest) {
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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const hospitalId = searchParams.get('hospitalId') || payload.hospitalId;
    const patientId = searchParams.get('patientId');
    const doctorId = searchParams.get('doctorId');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Build query based on user role and filters
    let query: any = {};
    
    // Apply role-based filtering
    if (payload.role === 'admin') {
      query.hospitalId = hospitalId;
    } 
    else if (payload.role === 'provider') {
      query.doctorId = payload.userId;
    } 
    else if (payload.role === 'patient') {
      query.patientId = payload.userId;
    }

    // Apply additional filters
    if (patientId && (payload.role === 'admin' || payload.role === 'provider')) {
      query.patientId = patientId;
    }
    
    if (doctorId && payload.role === 'admin') {
      query.doctorId = doctorId;
    }
    
    if (status) {
      query.status = status;
    }
    
    // Count total matching appointments
    const total = await prisma.appointment.count({ where: query });
    
    // Fetch paginated appointments
    const appointments = await prisma.appointment.findMany({
      where: query,
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
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    });
    
    // Add pagination metadata
    return NextResponse.json({
      appointments,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return NextResponse.json({ error: 'Failed to fetch appointments' }, { status: 500 });
  }
}

/**
 * Create a new appointment
 */
export async function POST(request: NextRequest) {
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

    // Only admins, providers, or patients can create appointments
    if (!['admin', 'provider', 'patient'].includes(payload.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }
    
    const data = await request.json();
    
    // Validate required fields
    if (!data.patientId || !data.doctorId) {
      return NextResponse.json({ 
        error: 'Patient ID and Doctor ID are required fields'
      }, { status: 400 });
    }
    
    // Create new appointment
    const appointment = await prisma.appointment.create({
      data: {
        patientId: data.patientId,
        doctorId: data.doctorId,
        status: data.status || 'scheduled',
        notes: data.notes,
        // Add any other fields specific to your Appointment model
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    
    return NextResponse.json({
      success: true,
      appointment
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating appointment:', error);
    return NextResponse.json({ error: 'Failed to create appointment' }, { status: 500 });
  }
}
