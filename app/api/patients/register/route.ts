import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcryptjs from 'bcryptjs';

// Helper function to generate a 10-digit medical number
function generateMedicalNumber(): string {
  // Ensure the number is exactly 10 digits
  const min = 1000000000; // 10-digit number starts from 1000000000
  const max = 9999999999; // 10-digit number can't exceed 9999999999
  
  // Generate a random number between min and max
  const medicalNumber = Math.floor(Math.random() * (max - min + 1)) + min;
  
  return medicalNumber.toString();
}

// Helper to create a FHIR-compliant name object
function createFhirName(firstName: string, lastName: string, prefix?: string): any {
  const name = {
    use: "official",
    family: lastName,
    given: [firstName],
    text: `${firstName} ${lastName}`
  };
  
  if (prefix) {
    name['prefix'] = [prefix];
  }
  
  return name;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      firstName,
      lastName,
      prefix,
      email,
      password,
      gender,
      birthDate,
      phone,
      address 
    } = body;
    
    // Basic validation
    if (!firstName || !lastName || !email || !password || !gender || !birthDate) {
      return NextResponse.json({ 
        success: false, 
        error: 'Required fields are missing' 
      }, { status: 400 });
    }
    
    // Check if patient with email already exists
    const existingPatient = await prisma.patient.findUnique({
      where: { email }
    });
    
    if (existingPatient) {
      return NextResponse.json({ 
        success: false, 
        error: 'A patient with this email already exists' 
      }, { status: 409 });
    }
    
    // Generate unique medical number and ensure it doesn't exist
    let medicalNumber: string;
    let isUnique = false;
    
    while (!isUnique) {
      medicalNumber = generateMedicalNumber();
      
      const existingNumber = await prisma.patient.findUnique({
        where: { medicalNumber }
      });
      
      if (!existingNumber) {
        isUnique = true;
      }
    }
    
    // Hash password
    const hashedPassword = await bcryptjs.hash(password, 10);
    
    // Create FHIR-compliant name structure
    const nameStructure = createFhirName(firstName, lastName, prefix);
    
    // Create FHIR-compliant telecom structure for phone
    const telecom = [];
    if (phone) {
      telecom.push({
        system: "phone",
        value: phone,
        use: "home"
      });
    }
    
    // Add email to telecom
    telecom.push({
      system: "email",
      value: email,
      use: "home"
    });
    
    // Create FHIR-compliant address structure
    let addressStructure = null;
    if (address) {
      addressStructure = [{
        use: "home",
        type: "physical",
        text: address,
        line: [address],
      }];
    }
    
    // Create new patient with FHIR structure
    const patient = await prisma.patient.create({
      data: {
        medicalNumber,
        resourceType: "Patient",
        active: true,
        name: nameStructure,
        telecom: telecom.length > 0 ? telecom : undefined,
        gender: gender.toLowerCase(),
        birthDate: new Date(birthDate),
        address: addressStructure,
        email,
        password: hashedPassword,
      }
    });
    
    // Remove sensitive information
    const { password: _, ...safePatient } = patient;
    
    return NextResponse.json({ 
      success: true, 
      message: 'Patient registered successfully',
      patient: {
        ...safePatient,
        // Convert JSON fields for frontend consumption
        name: typeof patient.name === 'object' ? patient.name : JSON.parse(patient.name as any),
        telecom: patient.telecom ? 
          (typeof patient.telecom === 'object' ? patient.telecom : JSON.parse(patient.telecom as any)) : 
          undefined,
        address: patient.address ? 
          (typeof patient.address === 'object' ? patient.address : JSON.parse(patient.address as any)) : 
          undefined
      }
    }, { status: 201 });
    
  } catch (error) {
    console.error('Patient registration error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to register patient'
    }, { status: 500 });
  }
}
