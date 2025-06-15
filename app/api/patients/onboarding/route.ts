import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST endpoint to complete patient onboarding
export async function POST(req: NextRequest) {
  try {
    const { patientId, email, ...onboardingData } = await req.json();

    if (!patientId && !email) {
      return NextResponse.json(
        { error: 'Patient identifier required (patientId or email)' },
        { status: 400 }
      );
    }

    // Find patient by ID or email
    const patient = patientId 
      ? await prisma.patient.findUnique({ where: { id: patientId } })
      : await prisma.patient.findFirst({ where: { email } });
    
    if (!patient) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      );
    }

    // Parse existing extension data if any
    let extensionData = {};
    try {
      if (patient.extension) {
        extensionData = JSON.parse(patient.extension as string);
      }
    } catch (error) {
      console.error('Error parsing patient extension data:', error);
    }

    // Prepare update data for patient record
    const updateData: any = {
      // Mark onboarding as completed in extension data
      extension: JSON.stringify({
        ...extensionData,
        onboardingCompleted: true,
        // Add any new extension data from onboarding
        ...onboardingData.extensionData
      })
    };

    // Update profile information if provided
    if (onboardingData.name) {
      const nameData = [{
        use: 'official',
        family: onboardingData.lastName || patient.lastName || '',
        given: [onboardingData.firstName || patient.firstName || ''],
        prefix: onboardingData.prefix || [],
        suffix: onboardingData.suffix || []
      }];
      updateData.name = JSON.stringify(nameData);
    }

    // Update telecom info if provided
    if (onboardingData.email || onboardingData.phone) {
      // Parse existing telecom data if any
      let telecomData = [];
      try {
        if (patient.telecom) {
          telecomData = JSON.parse(patient.telecom as string);
        }
      } catch (error) {
        console.error('Error parsing telecom data:', error);
      }
      
      // Filter out existing entries for systems we're going to update
      telecomData = telecomData.filter((item: any) => {
        if (onboardingData.email && item.system === 'email') return false;
        if (onboardingData.phone && item.system === 'phone') return false;
        return true;
      });
      
      // Add new telecom entries
      if (onboardingData.email) {
        telecomData.push({
          system: 'email',
          value: onboardingData.email,
          use: 'home'
        });
      }
      
      if (onboardingData.phone) {
        telecomData.push({
          system: 'phone',
          value: onboardingData.phone,
          use: 'mobile'
        });
      }
      
      updateData.telecom = JSON.stringify(telecomData);
    }

    // Update address if provided
    if (onboardingData.address) {
      const addressData = [{
        use: 'home',
        type: 'physical',
        line: [onboardingData.address.line || ''],
        city: onboardingData.address.city || '',
        district: onboardingData.address.district || '',
        state: onboardingData.address.state || '',
        postalCode: onboardingData.address.postalCode || '',
        country: onboardingData.address.country || 'Sierra Leone'
      }];
      updateData.address = JSON.stringify(addressData);
    }

    // Update direct fields
    if (onboardingData.gender) {
      updateData.gender = onboardingData.gender;
    }
    
    if (onboardingData.birthDate) {
      updateData.birthDate = new Date(onboardingData.birthDate);
    }

    // Update allergies if provided
    if (onboardingData.allergies && Array.isArray(onboardingData.allergies)) {
      updateData.allergies = JSON.stringify(onboardingData.allergies);
    }

    // Update conditions if provided
    if (onboardingData.conditions && Array.isArray(onboardingData.conditions)) {
      updateData.conditions = JSON.stringify(onboardingData.conditions);
    }

    // Update medications if provided
    if (onboardingData.medications && Array.isArray(onboardingData.medications)) {
      updateData.medications = JSON.stringify(onboardingData.medications);
    }

    // Save the updated patient record
    const updatedPatient = await prisma.patient.update({
      where: { id: patient.id },
      data: updateData,
      select: {
        id: true,
        medicalNumber: true,
        email: true,
        active: true,
        name: true,
        gender: true,
        birthDate: true,
        createdAt: true,
        updatedAt: true,
        extension: true
      }
    });

    // Check if onboarding was successfully completed
    let updatedExtension;
    try {
      updatedExtension = JSON.parse(updatedPatient.extension as string);
    } catch (error) {
      console.error('Error parsing updated extension data:', error);
      updatedExtension = {};
    }

    return NextResponse.json({
      success: true,
      message: 'Patient onboarding completed successfully',
      patientId: updatedPatient.id,
      onboardingCompleted: updatedExtension.onboardingCompleted === true
    });

  } catch (error) {
    console.error('Error completing patient onboarding:', error);
    return NextResponse.json(
      { error: 'Failed to complete patient onboarding', details: (error as Error).message },
      { status: 500 }
    );
  }
}

// GET endpoint to check patient onboarding status
export async function GET(req: NextRequest) {
  try {
    const patientId = req.nextUrl.searchParams.get('patientId');
    const email = req.nextUrl.searchParams.get('email');

    if (!patientId && !email) {
      return NextResponse.json(
        { error: 'Patient identifier required (patientId or email)' },
        { status: 400 }
      );
    }

    // Find patient by ID or email
    const patient = patientId 
      ? await prisma.patient.findUnique({ where: { id: patientId } })
      : await prisma.patient.findFirst({ where: { email: email as string } });
    
    if (!patient) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      );
    }

    // Check onboarding status in extension data
    let onboardingCompleted = false;
    try {
      if (patient.extension) {
        const extensionData = JSON.parse(patient.extension as string);
        onboardingCompleted = extensionData.onboardingCompleted === true;
      }
    } catch (error) {
      console.error('Error parsing patient extension data:', error);
    }

    return NextResponse.json({
      patientId: patient.id,
      onboardingCompleted,
      needsOnboarding: !onboardingCompleted
    });

  } catch (error) {
    console.error('Error checking onboarding status:', error);
    return NextResponse.json(
      { error: 'Failed to check onboarding status' },
      { status: 500 }
    );
  }
}
