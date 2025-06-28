/**
 * Contact Model Utilities
 * 
 * This file contains utilities for working with the new PatientEmail and PatientPhone models
 * while maintaining backward compatibility with the legacy JSON contact field.
 * 
 * IMPORTANT: This follows the CentralHealth System rules for patient data management:
 * - No mock/test data is ever used
 * - Medical IDs are preserved and never regenerated
 * - Patient data is stored consistently in centralized fields
 */

import { prisma } from './database/prisma-client';
import { parsePatientContact } from './patient-data-utils';

/**
 * Get primary email address for a patient, checking both new model and legacy JSON
 * 
 * @param patientId - The patient's UUID
 * @returns Primary email address or null
 */
export async function getPrimaryEmail(patientId: string): Promise<string | null> {
  try {
    // First try with the new email model
    const emailRecord = await prisma.patientEmail.findFirst({
      where: {
        patientId,
        primary: true
      }
    });

    if (emailRecord?.email) {
      return emailRecord.email;
    }

    // Fall back to legacy JSON contact field
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      select: { contact: true }
    });

    if (patient?.contact) {
      const contactData = parsePatientContact(patient.contact);
      return contactData.email || null;
    }

    return null;
  } catch (error) {
    console.error('Error getting primary email:', error);
    return null;
  }
}

/**
 * Get primary phone number for a patient, checking both new model and legacy JSON
 * 
 * @param patientId - The patient's UUID
 * @returns Primary phone number or null
 */
export async function getPrimaryPhone(patientId: string): Promise<string | null> {
  try {
    // First try with the new phone model
    const phoneRecord = await prisma.patientPhone.findFirst({
      where: {
        patientId,
        primary: true
      }
    });

    if (phoneRecord?.phone) {
      return phoneRecord.phone;
    }

    // Fall back to legacy JSON contact field
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      select: { contact: true }
    });

    if (patient?.contact) {
      const contactData = parsePatientContact(patient.contact);
      return contactData.phone || null;
    }

    return null;
  } catch (error) {
    console.error('Error getting primary phone:', error);
    return null;
  }
}

/**
 * Normalize email for consistent storage
 * 
 * @param email - Email address to normalize
 * @returns Normalized email address
 */
export function normalizeEmail(email: string): string {
  if (!email) return '';
  return email.toLowerCase().trim();
}

/**
 * Normalize phone number for consistent storage
 * 
 * @param phone - Phone number to normalize
 * @returns Normalized phone number
 */
export function normalizePhone(phone: string): string {
  if (!phone) return '';
  // Remove common formatting characters
  return phone.replace(/[\s\-\(\)\.]/g, '').trim();
}

/**
 * Migrate patient contact info from JSON to dedicated tables
 * This is useful for gradually migrating existing patients
 * 
 * @param patientId - The patient's UUID
 * @returns Success status
 */
export async function migratePatientContactInfo(patientId: string): Promise<boolean> {
  try {
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      select: { 
        id: true,
        contact: true,
        emails: {
          where: {
            primary: true
          }
        },
        phones: {
          where: {
            primary: true
          }
        }
      }
    });

    if (!patient) return false;

    const contactData = parsePatientContact(patient.contact);
    const hasExistingEmail = patient.emails && patient.emails.length > 0;
    const hasExistingPhone = patient.phones && patient.phones.length > 0;
    
    // Only create new records if they don't already exist
    if (contactData.email && !hasExistingEmail) {
      await prisma.patientEmail.create({
        data: {
          email: normalizeEmail(contactData.email),
          primary: true,
          verified: false, // Default to unverified for migration
          patientId: patient.id,
          updatedAt: new Date()
        }
      });
    }
    
    if (contactData.phone && !hasExistingPhone) {
      await prisma.patientPhone.create({
        data: {
          phone: normalizePhone(contactData.phone),
          primary: true,
          verified: false, // Default to unverified for migration
          patientId: patient.id,
          updatedAt: new Date()
        }
      });
    }

    return true;
  } catch (error) {
    console.error('Error migrating patient contact info:', error);
    return false;
  }
}

/**
 * Check if an email is already in use by any patient
 * 
 * @param email - Email address to check
 * @param excludePatientId - Optional patient ID to exclude from check
 * @returns Boolean indicating if email exists
 */
export async function isEmailInUse(email: string, excludePatientId?: string): Promise<boolean> {
  if (!email) return false;
  
  const normalizedEmail = normalizeEmail(email);
  
  try {
    // First check the new dedicated email table
    const newModelCheck = await prisma.patientEmail.findFirst({
      where: {
        email: normalizedEmail,
        ...(excludePatientId ? { patientId: { not: excludePatientId } } : {})
      }
    });

    if (newModelCheck) return true;

    // Fall back to legacy JSON contact field
    const legacyCheck = await prisma.$queryRaw`
      SELECT id FROM "Patient"
      WHERE "contact"::jsonb ->> 'email' = ${normalizedEmail}
      ${excludePatientId ? prisma.$raw`AND id != ${excludePatientId}` : prisma.$raw``}
      LIMIT 1
    `;

    return Array.isArray(legacyCheck) && legacyCheck.length > 0;
  } catch (error) {
    console.error('Error checking email usage:', error);
    // Default to false in case of error to allow registration
    // Uniqueness will be enforced at database level
    return false;
  }
}

/**
 * Check if a phone number is already in use by any patient
 * 
 * @param phone - Phone number to check
 * @param excludePatientId - Optional patient ID to exclude from check
 * @returns Boolean indicating if phone exists
 */
export async function isPhoneInUse(phone: string, excludePatientId?: string): Promise<boolean> {
  if (!phone) return false;
  
  const normalizedPhone = normalizePhone(phone);
  
  try {
    // First check the new dedicated phone table
    const newModelCheck = await prisma.patientPhone.findFirst({
      where: {
        phone: normalizedPhone,
        ...(excludePatientId ? { patientId: { not: excludePatientId } } : {})
      }
    });

    if (newModelCheck) return true;

    // Fall back to legacy JSON contact field
    const legacyCheck = await prisma.$queryRaw`
      SELECT id FROM "Patient"
      WHERE "contact"::jsonb ->> 'phone' = ${normalizedPhone}
      ${excludePatientId ? prisma.$raw`AND id != ${excludePatientId}` : prisma.$raw``}
      LIMIT 1
    `;

    return Array.isArray(legacyCheck) && legacyCheck.length > 0;
  } catch (error) {
    console.error('Error checking phone usage:', error);
    // Default to false in case of error to allow registration
    return false;
  }
}
