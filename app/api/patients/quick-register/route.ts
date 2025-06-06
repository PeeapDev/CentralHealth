import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { generateMedicalID } from '@/utils/medical-id';

// Helper function to generate a JWT token
function generateToken(patient: any) {
  const jwtSecret = process.env.JWT_SECRET || 'fallback_secret_for_development';
  
  return jwt.sign(
    {
      id: patient.id,
      medicalNumber: patient.medicalNumber,
      email: patient.email,
      role: 'patient',
    },
    jwtSecret,
    { expiresIn: '7d' }
  );
}

// Simple patient registration endpoint - no email verification
export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const body = await req.json();
    console.log('Quick register received data:', body);
    
    // Basic validation
    if (!body.firstName || !body.lastName || !body.email || !body.phone || !body.password) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields',
      }, { status: 400 });
    }
    
    // Format phone number
    let phoneNumber = body.phone;
    if (phoneNumber.startsWith('0')) {
      phoneNumber = phoneNumber.substring(1);
    }
    if (!phoneNumber.startsWith('+')) {
      phoneNumber = `+232${phoneNumber}`;
    }
    
    // Generate a medical number
    const medicalNumber = generateMedicalID();
    
    // Hash password
    const hashedPassword = await bcrypt.hash(body.password, 10);
    
    // Create JSON fields
    const nameData = [
      {
        use: 'official',
        family: body.lastName,
        given: [body.firstName]
      }
    ];
    
    const telecomData = [
      {
        system: 'phone',
        value: phoneNumber,
        use: 'mobile'
      },
      {
        system: 'email',
        value: body.email,
        use: 'work'
      }
    ];
    
    // Create patient with minimal fields - no verification needed
    const newPatient = await prisma.patient.create({
      data: {
        medicalNumber,
        resourceType: 'Patient',
        active: true, // Set to active immediately
        name: JSON.stringify(nameData),
        gender: 'unknown',
        birthDate: new Date('1990-01-01'),
        email: body.email,
        phone: phoneNumber,
        password: hashedPassword,
        telecom: JSON.stringify(telecomData),
        address: JSON.stringify([]),
        photo: '',
      }
    });
    
    // Generate token for immediate login
    const token = generateToken(newPatient);
    
    // Set cookie
    const response = NextResponse.json({
      success: true,
      message: 'Registration successful! You are now logged in.',
      token,
      patient: {
        id: newPatient.id,
        medicalNumber: newPatient.medicalNumber,
        name: `${body.firstName} ${body.lastName}`,
        email: body.email,
        phone: phoneNumber
      }
    }, { status: 201 });
    
    // Set HTTP-only cookie
    response.cookies.set({
      name: 'token',
      value: token,
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });
    
    return response;
      
  } catch (error) {
    console.error('Quick registration error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to register patient',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
