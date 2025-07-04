import { NextRequest, NextResponse } from 'next/server';
import { getPatientByMrn } from '@/services/patientService';
import { safeLogSecurityEvent } from '@/utils/security-logging';

/**
 * API handler for patient lookup by MRN (Medical Record Number)
 * 
 * Complies with CentralHealth requirements:
 * - Medical IDs must follow NHS-style 5-character alphanumeric format
 * - Medical IDs are permanent and stored in the mrn field
 * - No test/mock patients allowed
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { mrn: string } }
) {
  const clientIp = request.headers.get('x-forwarded-for') ||
                   request.headers.get('x-real-ip') || 'unknown';
  
  console.log('API: Patient lookup by MRN request received');
  console.log('API: Request headers:', Object.fromEntries(request.headers.entries()));
  
  try {
    const { mrn } = params;
    console.log('API: MRN from URL params:', mrn);
    
    // Validate MRN format
    if (!mrn || mrn.length !== 5 || !/^[A-Z0-9]{5}$/i.test(mrn)) {
      // Log invalid format attempt
      await safeLogSecurityEvent({
        action: 'PATIENT_QR_SCAN_INVALID_FORMAT',
        ipAddress: clientIp.toString(),
        details: { attemptedMrn: mrn },
        success: false
      });
      
      return NextResponse.json(
        { error: 'Invalid medical ID format' },
        { status: 400 }
      );
    }
    
    // Get patient data from database
    console.log('API: Calling getPatientByMrn with:', mrn);
    const patient = await getPatientByMrn(mrn);
    console.log('API: Patient lookup result:', patient ? 'Found' : 'Not Found');
    
    // Log the access attempt
    try {
      await safeLogSecurityEvent({
        action: 'PATIENT_QR_SCAN',
        ipAddress: clientIp.toString(),
        details: { mrn: mrn.toUpperCase() },
        patientId: patient?.id,
        success: !!patient
        // Omitting userId to avoid foreign key constraint errors
      });
    } catch (error) {
      console.error('Failed to log security event:', error);
      // Continue processing even if logging fails
      // This ensures the app doesn't crash due to logging issues
    }
    
    if (!patient) {
      console.log('API: Patient not found, returning 404');
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      );
    }
    
    console.log('API: Found patient, returning data');
    
    // Return patient data
    return NextResponse.json(patient);
  } catch (error) {
    console.error('Error in patient lookup API:', error);
    console.error('Error stack:', (error as Error).stack);
    
    // Log error
    await safeLogSecurityEvent({
      action: 'PATIENT_QR_SCAN_ERROR',
      ipAddress: clientIp.toString(),
      details: { error: (error as Error).message },
      success: false
    }).catch(console.error); // Prevent error logging failures from causing additional errors
    
    return NextResponse.json(
      { error: 'Failed to retrieve patient data' },
      { status: 500 }
    );
  }
}
