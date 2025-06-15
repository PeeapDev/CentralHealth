import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateHospitalMedicalID } from '@/utils/medical-id';

// GET endpoint to fetch patient profile data
export async function GET(req: NextRequest) {
  try {
    // Get user email from query params or test ID for development
    const userEmail = req.nextUrl.searchParams.get('email');
    const testId = req.nextUrl.searchParams.get('testId');
    
    if (!userEmail && !testId) {
      return NextResponse.json(
        { error: 'Authentication required. Please provide email or testId parameter.' },
        { status: 401 }
      );
    }
    
    console.log(`Fetching patient profile for ${userEmail ? 'email: ' + userEmail : 'testId: ' + testId}`);

    // Find the patient record
    let patient;
    
    if (userEmail) {
      // Get patient by email
      patient = await prisma.patient.findFirst({
        where: {
          email: userEmail,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          },
        }
      });
    } else if (testId) {
      // For testing, get patient by ID
      patient = await prisma.patient.findUnique({
        where: {
          id: testId,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          },
        }
      });
    }

    if (!patient) {
      console.log('Patient not found for query:', { userEmail, testId });
      
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      );
    }
    
    console.log('Patient found:', { id: patient.id, email: patient.email });

    // Parse JSON fields
    const nameData = patient.name ? JSON.parse(patient.name as string) : [];
    const telecomData = patient.telecom ? JSON.parse(patient.telecom as string) : [];
    const addressData = patient.address ? JSON.parse(patient.address as string) : [];
    const extensionData = patient.extension ? JSON.parse(patient.extension as string) : {};
    
    // Extract name components
    const lastName = nameData[0]?.family || '';
    const firstName = nameData[0]?.given?.[0] || '';
    
    // Extract contact information
    const emailContact = telecomData.find((item: any) => item.system === 'email');
    const phoneContact = telecomData.find((item: any) => item.system === 'phone');
    
    // Extract address
    const primaryAddress = addressData[0] || {};
    const addressString = primaryAddress.line 
      ? `${primaryAddress.line.join(', ')}, ${primaryAddress.city || ''}, ${primaryAddress.country || ''}`
      : '';

    // Calculate age from birthDate
    const calculateAge = (birthDate: Date | null) => {
      if (!birthDate) return null;
      const today = new Date();
      const birthDateObj = new Date(birthDate);
      let age = today.getFullYear() - birthDateObj.getFullYear();
      const monthDifference = today.getMonth() - birthDateObj.getMonth();
      if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDateObj.getDate())) {
        age--;
      }
      return age;
    };

    // Process birthdate
    const birthDate = patient.birthDate ? new Date(patient.birthDate) : null;
    const formattedBirthDate = birthDate ? birthDate.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    }) : null;
    
    // Generate hospital-specific medical ID if available
    // Get hospital code from patient record if available
    const hospitalId = patient.hospitalId || null;
    const hospitalCode = hospitalId ? hospitalId.substring(0, 4).toUpperCase() : '';
    const medicalId = patient.medicalNumber || extensionData.medicalId || '';

    // Mock data for fields we don't have yet in the database schema
    // In a real implementation, these should be proper fields in the database
    const mockInsurance = {
      provider: "HealthFirst Insurance",
      policyNumber: "HF-" + medicalId.slice(-7),
      group: "GRP-" + Math.floor(1000 + Math.random() * 9000),
      expirationDate: "Dec 31, 2025"
    };
    
    const mockAllergies = [
      { name: "No known allergies", severity: "None" }
    ];
    
    const mockConditions = ["No known conditions"];
    
    const mockMedications = [
      { name: "No current medications", dosage: "", frequency: "N/A" }
    ];

    // Prepare response with all necessary profile data
    const profileResponse = {
      id: patient.id,
      patientId: patient.medicalNumber,
      hospitalCode: hospitalCode,
      name: `${firstName} ${lastName}`,
      firstName: firstName,
      lastName: lastName,
      dob: formattedBirthDate,
      birthDate: patient.birthDate,
      age: calculateAge(birthDate),
      gender: patient.gender,
      bloodType: "Unknown", // Could be stored in extension in future
      email: emailContact?.value || patient.email,
      phone: phoneContact?.value || patient.phone,
      address: addressString,
      height: "Not recorded",
      weight: "Not recorded",
      onboardingCompleted: extensionData.onboardingCompleted || false,
      insurance: mockInsurance,
      allergies: mockAllergies,
      conditions: mockConditions,
      medications: mockMedications,
      createdAt: patient.createdAt,
      updatedAt: patient.updatedAt
    };

    return NextResponse.json(profileResponse);
    
  } catch (error) {
    console.error('Error fetching patient profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch patient profile' },
      { status: 500 }
    );
  }
}
