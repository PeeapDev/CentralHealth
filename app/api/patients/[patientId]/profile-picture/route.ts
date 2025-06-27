import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma-client';

// Using shared Prisma instance with updated import path

// Define the audit log data interface
interface AuditLogData {
  action: string;
  patientId?: string;
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
        patientId: data.patientId,
        success: data.success ?? true,
        timestamp: new Date()
      });
      return;
    }
    
    // Convert patientId to details if it exists
    let finalDetails = {...(data.details || {})};
    if (data.patientId) {
      // Use mrn field as the standard medical ID format per CentralHealth rules
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

export async function GET(
  request: Request,
  { params }: { params: { patientId: string } }
) {
  try {
    // Fix for Next.js App Router dynamic parameters warning
    // Clone params to avoid direct property access warning
    const { patientId: paramId } = params;
    const patientId = String(paramId);
    
    if (!patientId) {
      return NextResponse.json(
        { error: 'Patient ID is required' },
        { status: 400 }
      );
    }

    // Debug the incoming patientId
    console.log(`Looking up profile picture for patientId: ${patientId}`);
    
    // Try to find the patient record first to get the correct ID
    // The system uses multiple ID formats: UUID (internal), MRN (91BJ3 format)
    const patient = await prisma.patient.findFirst({
      where: {
        OR: [
          { id: patientId },
          { mrn: patientId } // MRN is the standard medical ID format (e.g., 91BJ3)
        ]
      },
      select: { id: true, mrn: true }
    });
    
    console.log('Found patient:', patient ? { id: patient.id, mrn: patient.mrn } : 'not found');
    
    // If we found a patient, use their ID to search for profile pictures
    let profilePicture = null;
    if (patient) {
      // Look for profile pictures with the patient's actual ID
      profilePicture = await prisma.profilePicture.findFirst({
        where: {
          OR: [
            { patientId: patient.id },
            { patientId: patient.mrn }
          ]
        },
        select: {
          id: true,
          imageUrl: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      
      console.log('Searched for profile picture using patient ID:', patient.id, 'and MRN:', patient.mrn);
    } else {
      // Try the original search as fallback if patient not found
      profilePicture = await prisma.profilePicture.findFirst({
        where: { patientId: patientId },
        select: {
          id: true,
          imageUrl: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      
      console.log('Searched for profile picture using original patientId:', patientId);
    }
    
    console.log('Profile picture query result:', profilePicture ? 'Found' : 'Not found');

    // Record security audit - but handle missing tables gracefully
    try {
      await logSecurityEvent({
        action: 'PROFILE_PICTURE_ACCESS',
        patientId: patientId,
        details: {
          resourceType: 'ProfilePicture',
          resourceId: profilePicture?.id || 'not-found',
          description: 'Access patient profile picture'
        },
        success: !!profilePicture
      });
    } catch (error) {
      // Log the error but don't fail the request
      console.warn('Failed to log security event:', error);
    }

    if (!profilePicture || !profilePicture.imageUrl) {
      // Return a default SVG avatar instead of error response
      // This prevents the client from having to handle 404 errors
      const defaultAvatarSvg = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0iIzNiODJmNiIgZD0iTTEyIDJDNi41IDIgMiA2LjUgMiAxMnM0LjUgMTAgMTAgMTAgMTAtNC41IDEwLTEwUzE3LjUgMiAxMiAyek0xMiA1YTMgMyAwIDEgMSAwIDYgMyAzIDAgMCAxIDAtNnptMCAxM2MtMi43IDAtNS4xLTEuNC02LjUtMy41LjMtMS4xIDMuMi0xLjcgNi41LTEuNyAzLjMgMCA2LjIuNiA2LjUgMS43QzE3LjEgMTYuNiAxNC43IDE4IDEyIDE4eiIvPjwvc3ZnPg==';
      
      // Log that we're using a default image
      console.log(`No profile picture found for patient ${patientId}, returning default avatar`); 
      
      return NextResponse.json({
        id: `default-${patientId}`,
        imageUrl: defaultAvatarSvg,
        createdAt: new Date(),
        updatedAt: new Date(),
        isDefault: true
      });
    }
    
    // Ensure we have a standard format for the image URL
    let standardizedImageUrl = profilePicture.imageUrl;
    
    // Check if the image URL needs content-type prefix for base64 data
    if (standardizedImageUrl.startsWith('data:')) {
      // Already has content type header, keep as is
    } else if (standardizedImageUrl.startsWith('/')) {
      // It's a relative URL, keep as is
    } else if (/^https?:\/\//.test(standardizedImageUrl)) {
      // It's a full URL, keep as is
    } else if (standardizedImageUrl.startsWith('data:image')) {
      // Already has content type header
    } else if (/^[A-Za-z0-9+/=]+$/.test(standardizedImageUrl)) {
      // Looks like base64 but missing content-type prefix
      // Default to PNG if no content type is apparent
      console.log('Adding content-type prefix to base64 image');
      standardizedImageUrl = `data:image/png;base64,${standardizedImageUrl}`;
    }

    // Return the profile picture with standardized URL
    return NextResponse.json({
      ...profilePicture,
      imageUrl: standardizedImageUrl
    });
  } catch (error) {
    console.error('Error retrieving profile picture:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve profile picture' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
