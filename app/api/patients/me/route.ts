import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/lib/auth';

/**
 * GET /api/patients/me
 * Fetches the current logged-in patient's data based on JWT token
 */
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user from JWT token
    const auth = await getAuth(request);
    
    // Check if user is authenticated and is a patient
    if (!auth?.authenticated || !auth?.user?.id) {
      console.log('User not authenticated');
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    console.log(`Fetching patient data for ID: ${auth.user.id}`);

    // Get patient by ID from database
    const patient = await prisma.patient.findUnique({
      where: {
        id: auth.user.id
      },
      // Include hospital information 
      include: {
        hospital: {
          select: {
            id: true,
            name: true,
            subdomain: true
          }
        }
      }
    });

    // If patient not found
    if (!patient) {
      console.log('Patient not found in database');
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    // Process patient data for the frontend
    const processedPatient: any = {
      ...patient,
      password: undefined, // Remove password for security
    };

    // Process JSON fields to ensure they're objects not strings
    const jsonFields = ['name', 'telecom', 'address', 'contact', 'communication', 'extension'];
    jsonFields.forEach(field => {
      if (processedPatient[field]) {
        // Handle JSON fields from PostgreSQL - they may be strings or already parsed objects
        if (typeof processedPatient[field] === 'string') {
          try {
            processedPatient[field] = JSON.parse(processedPatient[field] as string);
          } catch (e) {
            console.error(`Error parsing ${field} for patient ${patient.id}:`, e);
          }
        }
      }
    });

    // Format name for display
    let displayName = 'Unknown';
    if (processedPatient.name) {
      try {
        const nameObj = typeof processedPatient.name === 'string' 
          ? JSON.parse(processedPatient.name) 
          : processedPatient.name;
          
        const firstName = nameObj.given?.[0] || '';
        const lastName = nameObj.family || '';
        displayName = `${firstName} ${lastName}`.trim() || 'Unknown';
        processedPatient.displayName = displayName;
      } catch (e) {
        console.error(`Error formatting name for patient ${patient.id}:`, e);
      }
    }

    // Return the processed patient data
    return NextResponse.json({ 
      patient: processedPatient,
      status: 'success'
    });
  } catch (error) {
    console.error("Error fetching patient data:", error);
    return NextResponse.json({ error: 'Server error', details: process.env.NODE_ENV === 'development' ? error : undefined }, { status: 500 });
  }
}
