/**
 * Utility for generating and validating Medical IDs
 * 
 * Format: 5-character alphanumeric string
 * Excludes confusing characters: 0, 1, O, I, L
 * Allows: A-H, J-N, P-Z, 2-9 (32 total)
 * Total combinations: 32^5 = 33,554,432
 */

import { DEFAULT_HOSPITAL } from '@/lib/hospital-context';

/**
 * Generate a random Medical ID using the specified character set
 */
export function generateMedicalID(length = 5): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const numbers = '23456789';
  
  // Ensure we have at least one letter and one number
  let id = letters.charAt(Math.floor(Math.random() * letters.length));
  id += numbers.charAt(Math.floor(Math.random() * numbers.length));
  
  // Fill the remaining positions with random chars from the full set
  for (let i = 2; i < length; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  // Shuffle the ID to randomize positions of guaranteed letter and number
  return id.split('').sort(() => Math.random() - 0.5).join('');
}

/**
 * Validate if a string matches the Medical ID format
 */
export function isValidMedicalID(id: string): boolean {
  if (!id || id.length !== 5) return false;
  
  // Check if it only contains allowed characters
  const allowedChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  
  for (let i = 0; i < id.length; i++) {
    if (!allowedChars.includes(id.charAt(i))) {
      return false;
    }
  }
  
  return true;
}

/**
 * Generate a unique hospital-specific medical ID for patients
 * Falls back to default hospital if none is provided
 *
 * @param {string} hospitalCode - The hospital code or prefix (optional)
 * @returns {string} - A formatted medical ID
 */
export function generateHospitalMedicalID(hospitalCode?: string): string {
  const code = hospitalCode || DEFAULT_HOSPITAL.id;
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // excluding confusable characters
  let result = code.toUpperCase().substring(0, 3);
  
  // Add separator
  result += '-';
  
  // Add 6 more random characters
  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters.charAt(randomIndex);
  }
  
  return result;
}
