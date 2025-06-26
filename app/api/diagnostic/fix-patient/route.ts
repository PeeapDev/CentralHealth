import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma-client';

// Generate an NHS-style 5-character alphanumeric MRN
// Excluding confusing characters: i, l, 1, o, 0
function generateMedicalId() {
  const validChars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 5; i++) {
    result += validChars.charAt(Math.floor(Math.random() * validChars.length));
  }
  return result;
}

export async function GET(request: NextRequest) {
  // Target patient ID from URL or use the one from screenshot
  const patientId = request.nextUrl.searchParams.get('id') || '5b06892e-7a84-4802-8f45-a48d01c5b1eb';
  
  try {
    // First check if patient exists
    const existingPatient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        User: true,
        Emails: true,
        Phones: true
      }
    });
    
    if (!existingPatient) {
      return NextResponse.json({ 
        error: 'Patient not found', 
        patientId 
      }, { status: 404 });
    }
    
    // Report initial state
    const initialState = {
      id: existingPatient.id,
      mrn: existingPatient.mrn,
      name: existingPatient.name,
      emailCount: existingPatient.Emails?.length || 0,
      phoneCount: existingPatient.Phones?.length || 0,
      hasUser: !!existingPatient.User
    };

    // CRITICAL: If patient already has an MRN, DO NOT change it - medical IDs are permanent
    // per CentralHealth System rules
    const mrn = existingPatient.mrn || generateMedicalId();
    
    // Create a standard FHIR name structure if needed
    const name = existingPatient.name && 
                (Array.isArray(existingPatient.name) && existingPatient.name.length > 0) ? 
                existingPatient.name : 
                [{ family: "Doe", given: ["John"], use: "official" }];
    
    // Fix patient record with missing data
    const updatedPatient = await prisma.patient.update({
      where: { id: patientId },
      data: {
        // Only set MRN if it's missing - NEVER replace existing MRN
        ...(existingPatient.mrn ? {} : { mrn }),
        // Only update name if it's missing
        ...(Array.isArray(existingPatient.name) && existingPatient.name.length > 0 ? 
            {} : { name }),
        // Set gender if missing
        ...(existingPatient.gender ? {} : { gender: 'unknown' }),
      },
      include: {
        User: true,
        Emails: true,
        Phones: true
      }
    });
    
    // Add email if none exists
    let emailResult = null;
    if (!existingPatient.Emails || existingPatient.Emails.length === 0) {
      emailResult = await prisma.patientEmail.create({
        data: {
          patientId: patientId,
          email: `patient-${mrn.toLowerCase()}@example.com`,
          primary: true,
          verified: false
        }
      });
    }
    
    // Add phone if none exists
    let phoneResult = null;
    if (!existingPatient.Phones || existingPatient.Phones.length === 0) {
      phoneResult = await prisma.patientPhone.create({
        data: {
          patientId: patientId,
          phone: '1234567890',
          type: 'mobile',
          primary: true,
          verified: false
        }
      });
    }
    
    // Create user account if none exists
    let userResult = null;
    if (!existingPatient.User) {
      // Get email to use for user account
      const emailToUse = emailResult ? 
                         emailResult.email : 
                         (existingPatient.Emails && existingPatient.Emails.length > 0) ? 
                         existingPatient.Emails[0].email : 
                         `patient-${mrn.toLowerCase()}@example.com`;
      
      userResult = await prisma.user.create({
        data: {
          name: Array.isArray(name) && name.length > 0 ? 
                (name[0].given ? `${name[0].given.join(' ')} ${name[0].family}` : 'John Doe') : 
                'John Doe',
          email: emailToUse,
          role: 'PATIENT',
          patientId: patientId,
          password: '$2a$10$fakehashedpasswordabcdefghijklmnopqrstuvwxyz123456' // Pre-hashed placeholder
        }
      });
    }
    
    // Get the refreshed patient data
    const refreshedPatient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        User: true,
        Emails: true,
        Phones: true
      }
    });
    
    return NextResponse.json({
      success: true,
      message: 'Patient record updated successfully',
      initialState,
      updates: {
        mrnUpdated: !existingPatient.mrn && !!refreshedPatient?.mrn,
        nameUpdated: (!existingPatient.name || !Array.isArray(existingPatient.name) || existingPatient.name.length === 0) && 
                     (Array.isArray(refreshedPatient?.name) && refreshedPatient?.name?.length > 0),
        emailAdded: emailResult !== null,
        phoneAdded: phoneResult !== null,
        userCreated: userResult !== null
      },
      patient: {
        id: refreshedPatient?.id,
        mrn: refreshedPatient?.mrn,
        name: refreshedPatient?.name,
        emailCount: refreshedPatient?.Emails?.length || 0,
        phoneCount: refreshedPatient?.Phones?.length || 0,
        hasUser: !!refreshedPatient?.User
      }
    });
    
  } catch (error) {
    console.error('Error updating patient:', error);
    return NextResponse.json({ 
      error: 'Failed to update patient data', 
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
