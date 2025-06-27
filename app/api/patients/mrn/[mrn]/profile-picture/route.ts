import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma-client';

// Define the audit log data interface
interface AuditLogData {
  action: string;
  patientId?: string;
  mrn?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  success?: boolean;
}

// Simplified security logging function that handles missing tables gracefully
async function logSecurityEvent(data: AuditLogData): Promise<void> {
  try {
    // First check if the SecurityAuditLog table exists to prevent errors
    const tableExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'SecurityAuditLog'
      );
    `.catch(() => false);
    
    // If table doesn't exist, just log to console instead
    if (!tableExists) {
      console.log('Security event (table missing):', {
        action: data.action,
        mrn: data.mrn,
        patientId: data.patientId,
        success: data.success ?? true,
        timestamp: new Date()
      });
      return;
    }
    
    // Prepare details object with both MRN and patient ID if available
    let finalDetails = {...(data.details || {})};
    if (data.mrn) {
      // Use mrn field as the standard medical ID format per CentralHealth rules
      finalDetails.mrn = data.mrn;
    }
    if (data.patientId) {
      finalDetails.patientId = data.patientId;
    }

    // Log to database with a safe structure
    await prisma.$executeRaw`
      INSERT INTO "SecurityAuditLog" ("action", "ipAddress", "details", "success", "createdAt")
      VALUES (
        ${data.action},
        ${data.ipAddress || null},
        ${JSON.stringify(finalDetails)},
        ${data.success ?? true},
        ${new Date()}
      )
    `;
  } catch (error) {
    console.log('Failed to log security event:', error);
    // Just log the error but don't throw - security logging should not break functionality
  }
}

/**
 * GET handler for retrieving patient profile picture by MRN
 * This endpoint is in compliance with CentralHealth System requirements
 * that prioritize MRN as the standard medical ID format
 */
export async function GET(
  request: Request,
  { params }: { params: { mrn: string } }
) {
  try {
    // Fix for Next.js App Router dynamic parameters warning
    // Clone params to avoid direct property access warning
    const { mrn: paramMrn } = params;
    const mrn = String(paramMrn);
    
    if (!mrn) {
      return NextResponse.json(
        { error: 'Medical Record Number (MRN) is required' },
        { status: 400 }
      );
    }

    // Debug the incoming medical record number
    console.log(`Looking up profile picture for MRN: ${mrn}`);
    
    // First find the patient by MRN to ensure we're using valid medical records
    const patient = await prisma.patient.findFirst({
      where: {
        // Per CentralHealth standards, mrn is the standard medical ID field
        mrn: mrn
      },
      select: { id: true, mrn: true }
    });
    
    console.log('Found patient by MRN:', patient ? { id: patient?.id, mrn: patient?.mrn } : 'not found');
    
    if (!patient) {
      return NextResponse.json(
        { error: 'Patient not found', isDefault: true },
        { status: 404 }
      );
    }

    // Look for profile picture with the patient's ID or MRN
    const profilePicture = await prisma.profilePicture.findFirst({
      where: {
        OR: [
          { patientId: patient.id },
          { patientId: patient.mrn } // Some records might use MRN in patientId field
        ]
      },
      select: {
        id: true,
        imageUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    
    console.log('Profile picture query result:', profilePicture ? 'Found' : 'Not found');

    // Record security audit
    await logSecurityEvent({
      action: 'PROFILE_PICTURE_ACCESS_BY_MRN',
      mrn: mrn,
      patientId: patient.id,
      details: {
        resourceType: 'ProfilePicture',
        resourceId: profilePicture?.id || 'not-found',
        description: 'Access patient profile picture by MRN'
      },
      success: !!profilePicture
    });

    if (!profilePicture || !profilePicture.imageUrl) {
      return NextResponse.json(
        { 
          imageUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0iIzNiODJmNiIgZD0iTTEyIDJDNi41IDIgMiA2LjUgMiAxMnM0LjUgMTAgMTAgMTAgMTAtNC41IDEwLTEwUzE3LjUgMiAxMiAyek0xMiA1YTMgMyAwIDEgMSAwIDYgMyAzIDAgMCAxIDAtNnptMCAxM2MtMi43IDAtNS4xLTEuNC02LjUtMy41LjMtMS4xIDMuMi0xLjcgNi41LTEuNyAzLjMgMCA2LjIuNiA2LjUgMS43QzE3LjEgMTYuNiAxNC43IDE4IDEyIDE4eiIvPjwvc3ZnPg==',
          isDefault: true 
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { 
        imageUrl: profilePicture.imageUrl,
        isDefault: false 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching profile picture:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to retrieve profile picture',
        isDefault: true,
        imageUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0iIzNiODJmNiIgZD0iTTEyIDJDNi41IDIgMiA2LjUgMiAxMnM0LjUgMTAgMTAgMTAgMTAtNC41IDEwLTEwUzE3LjUgMiAxMiAyek0xMiA1YTMgMyAwIDEgMSAwIDYgMyAzIDAgMCAxIDAtNnptMCAxM2MtMi43IDAtNS4xLTEuNC02LjUtMy41LjMtMS4xIDMuMi0xLjcgNi41LTEuNyAzLjMgMCA2LjIuNiA2LjUgMS43QzE3LjEgMTYuNiAxNC43IDE4IDEyIDE4eiIvPjwvc3ZnPg=='
      },
      { status: 500 }
    );
  }
}
