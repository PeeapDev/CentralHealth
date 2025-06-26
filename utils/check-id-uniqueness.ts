/**
 * Utility for checking medical ID uniqueness
 * 
 * This ensures each patient gets a permanent, unique medical ID
 * and no duplicates or test IDs are used.
 */

import { prisma } from '@/lib/database/prisma-client';
import { generateMedicalID, isValidMedicalID } from './medical-id';

/**
 * Verify uniqueness of a medical ID against existing patient records
 * @param id The medical ID to check
 * @returns Promise resolving to true if ID is unique, false if already exists
 */
export async function isUniqueMedicalID(id: string): Promise<boolean> {
  try {
    // Verify ID format first
    if (!isValidMedicalID(id)) {
      console.error(`Medical ID failed validation: ${id}`);
      return false;
    }
    
    // Check database for existing ID
    const existingPatient = await prisma.patient.findFirst({
      where: { mrn: id }
    });
    
    return existingPatient === null;
  } catch (error) {
    console.error('Error checking medical ID uniqueness:', error);
    return false; // Fail safe - assume not unique if error occurs
  }
}

/**
 * Generate a unique medical ID that's guaranteed not to exist in the database
 * @returns Promise resolving to a unique, valid medical ID
 */
export async function generateUniqueMedicalID(): Promise<string> {
  // Try up to 20 times to generate a unique ID using standard algorithm
  for (let attempt = 0; attempt < 20; attempt++) {
    const id = generateMedicalID();
    console.log(`Checking uniqueness of generated ID: ${id} (attempt ${attempt + 1})`);
    const isUnique = await isUniqueMedicalID(id);
    
    if (isUnique) {
      console.log(`Successfully generated unique medical ID: ${id}`);
      return id;
    }
    
    console.warn(`Generated medical ID already exists, retrying (attempt ${attempt + 1})`);
  }
  
  // If standard generation failed, try a timestamp-based approach
  console.warn('Standard medical ID generation failed, trying timestamp-based generation');
  
  // Use multiple timestamp-based attempts if needed
  for (let fallbackAttempt = 0; fallbackAttempt < 5; fallbackAttempt++) {
    // Generate a timestamp-based ID with more randomness
    const timestamp = Date.now().toString();
    const lastFourTimestamp = timestamp.slice(-4);
    const randomChar = 'ABCDEFGHJKLMNPQRSTUVWXYZ'.charAt(
      Math.floor(Math.random() * 23)
    );
    const randomNum = '23456789'.charAt(Math.floor(Math.random() * 8));
    
    // Create a 5-character ID that meets format requirements
    const fallbackId = `${randomChar}${randomNum}${lastFourTimestamp.slice(0, 3)}`;
    
    // Verify it meets our format requirements
    if (!isValidMedicalID(fallbackId)) {
      console.error(`Fallback ID failed validation: ${fallbackId}`);
      continue;
    }
    
    // Check uniqueness
    const isFallbackUnique = await isUniqueMedicalID(fallbackId);
    if (isFallbackUnique) {
      console.log(`Successfully generated unique fallback medical ID: ${fallbackId}`);
      return fallbackId;
    }
  }
  
  // If all attempts fail, this is a critical error
  throw new Error('Critical error: Cannot generate unique medical ID after multiple attempts');
}
