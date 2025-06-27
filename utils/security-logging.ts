/**
 * Security Audit Logging Utility
 * 
 * This utility provides safe wrappers for security event logging
 * that won't crash the application if the SecurityAuditLog table doesn't exist.
 */

import { Prisma } from '@/lib/generated/prisma';
import { prisma } from '@/lib/database/prisma-client';

/**
 * Type for security audit log data.
 */
export interface AuditLogData {
  action: string;
  ipAddress?: string;
  details?: string | object;
  userId?: string;
  patientId?: string;
  success?: boolean;
  requestPath?: string;
  userAgent?: string;
}

/**
 * Safely logs a security event to the SecurityAuditLog table.
 * Will not crash if the table doesn't exist.
 */
export async function safeLogSecurityEvent(data: AuditLogData): Promise<void> {
  try {
    // Format details as JSON string if it's an object
    const details = typeof data.details === 'string' 
      ? data.details 
      : JSON.stringify(data.details || {});
      
    // Include patient ID in details field if present
    const detailsWithPatient = data.patientId ? 
      {...JSON.parse(details), patientId: data.patientId} : 
      JSON.parse(details);
    
    // Try to create the security audit log entry
    await prisma.securityAuditLog.create({
      data: {
        action: data.action,
        ipAddress: data.ipAddress || null,
        userAgent: data.userAgent || null,
        requestPath: data.requestPath || null,
        details: JSON.stringify(detailsWithPatient),
        userId: data.userId || '00000000-0000-0000-0000-000000000000', // Default system user ID
        success: data.success ?? true,
      }
    }).catch((error) => {
      // If it's a PrismaClientKnownRequestError with code P2002, it means the table doesn't exist
      // Instead of crashing, we'll just log to console
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        (error.code === 'P2002' || error.code === 'P2003' || error.code === 'P2010')
      ) {
        console.warn('SecurityAuditLog table may not exist:', error.message);
      } else if (error instanceof Error) {
        console.error('Security event logging error:', error.message);
      } else {
        console.error('Unknown security event logging error:', error);
      }
    });
  } catch (error) {
    // Catch any other errors to prevent app crashes
    console.error('Failed to log security event:', error instanceof Error ? error.message : String(error));
  }
}

/**
 * Log a successful authentication event
 */
export async function logSuccessfulAuth(userId: string, ipAddress?: string, userAgent?: string): Promise<void> {
  await safeLogSecurityEvent({
    action: 'AUTHENTICATION_SUCCESS',
    userId,
    ipAddress,
    userAgent,
    success: true,
    details: { timestamp: new Date().toISOString() }
  });
}

/**
 * Log a failed authentication event
 */
export async function logFailedAuth(attemptDetails: object, ipAddress?: string, userAgent?: string): Promise<void> {
  await safeLogSecurityEvent({
    action: 'AUTHENTICATION_FAILURE',
    ipAddress,
    userAgent,
    success: false,
    details: { 
      ...attemptDetails,
      timestamp: new Date().toISOString() 
    }
  });
}
