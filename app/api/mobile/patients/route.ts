import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuthHeader } from '@/lib/auth/jwt';

/**
 * Mobile-optimized patients list endpoint
 * Used by the Flutter mobile app to fetch patients
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication token from header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization header is required' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const payload = await verifyAuthHeader(authHeader);
    
    if (!payload) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const hospitalId = searchParams.get('hospitalId') || payload.hospitalId;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';

    // Build query based on user role
    let query: any = {};
    
    // For admin or provider, fetch patients from their hospital
    if (payload.role === 'admin' || payload.role === 'provider') {
      query.hospitalId = hospitalId;
    } 
    // For patients, only show their own data
    else if (payload.role === 'patient') {
      query.id = payload.userId;
    }
    
    // Add search condition if provided
    if (search) {
      query.OR = [
        { medicalNumber: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } },
        // For name, which is stored as JSON, we need a different approach
        // This depends on how name is stored in the JSON structure
      ];
    }
    
    // Count total matching patients
    const total = await prisma.patient.count({ where: query });
    
    // Fetch paginated patients
    const patients = await prisma.patient.findMany({
      where: query,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        birthDate: true,
        gender: true,
        medicalNumber: true,
        createdAt: true,
        hospital: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    });
    
    // Add pagination metadata
    return NextResponse.json({
      patients,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('Error fetching patients:', error);
    return NextResponse.json({ error: 'Failed to fetch patients' }, { status: 500 });
  }
}

/**
 * Create a new patient
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

    // Only admins and providers can create patients
    if (payload.role !== 'admin' && payload.role !== 'provider') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }
    
    const data = await request.json();
    
    // Validate required fields
    if (!data.name || !data.email) {
      return NextResponse.json({ 
        error: 'Name and email are required fields'
      }, { status: 400 });
    }
    
    // Check if patient with this email already exists
    const existingPatient = await prisma.patient.findFirst({
      where: {
        email: data.email,
        hospitalId: payload.hospitalId
      }
    });
    
    if (existingPatient) {
      return NextResponse.json({ 
        error: 'A patient with this email already exists' 
      }, { status: 409 });
    }
    
    // Create new patient with proper schema structure
    const patient = await prisma.patient.create({
      data: {
        // Handle name as JSON structure
        name: { firstName: data.firstName, lastName: data.lastName },
        email: data.email,
        phone: data.phone || '',
        birthDate: data.birthDate ? new Date(data.birthDate) : new Date(),
        gender: data.gender || 'other',
        medicalNumber: data.medicalNumber || `MRN-${Date.now()}`,
        hospitalId: payload.hospitalId
      }
    });
    
    return NextResponse.json({
      success: true,
      patient: {
        id: patient.id,
        name: patient.name,
        email: patient.email,
        phone: patient.phone,
        dateOfBirth: patient.dateOfBirth,
        gender: patient.gender,
        medicalNumber: patient.medicalNumber,
        createdAt: patient.createdAt,
      }
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating patient:', error);
    return NextResponse.json({ error: 'Failed to create patient' }, { status: 500 });
  }
}
