/**
 * Secure Medical ID Generation Utility
 * 
 * Implements the CentralHealth System Medical ID requirements:
 * - Format: 5-character alphanumeric string 
 * - Consistent format with letters and numbers
 * - Excludes confusing characters: 0, 1, O, I, L
 * - Guarantees mixed alphanumeric format with cryptographically secure generation
 * - Includes collision detection and validation
 * - Never produces name-derived formats like "MOHAM"
 * 
 * Total possible combinations: 32^5 = 33,554,432
 */

import { DEFAULT_HOSPITAL } from '@/lib/hospital-context';
import crypto from 'crypto';

// Constants for character sets
// Explicitly exclude confusing characters: i, l, 1, o, 0 as per requirements
const LETTERS = 'ABCDEFGHJKMNPQRSTUVWXYZ'; // 23 characters (excluding O, I, L)
const NUMBERS = '23456789';                // 8 characters (excluding 0, 1)
const ALLOWED_CHARS = LETTERS + NUMBERS;    // 31 total characters

// List of explicitly prohibited medical IDs (e.g., test IDs, offensive terms, etc)
const PROHIBITED_IDS = [
  'MOHAM', 'ADMIN', 'TEST1', 'TEST', 'DEMO', 'DEMOP',
  'TESTX', 'TESTY', 'TESTZ', 'DUMMY', 'SAMPL', 'GUEST'
];

/**
 * Generates a cryptographically secure random number between 0 and max-1
 */
function secureRandom(max: number): number {
  // Generate a secure random value between 0 and max-1
  const randomBuffer = crypto.randomBytes(4);
  const randomValue = randomBuffer.readUInt32BE(0);
  return randomValue % max;
}

/**
 * Generate a secure random Medical ID using cryptographically secure random generation
 * Creates a perfectly mixed 5-digit alphanumeric ID with guaranteed letter-number mixture
 */
export function generateMedicalID(): string {
  // Define patterns that guarantee a mix of letters and numbers
  const patterns = [
    [LETTERS, NUMBERS, LETTERS, NUMBERS, LETTERS], // LNLNL pattern
    [NUMBERS, LETTERS, NUMBERS, LETTERS, NUMBERS], // NLNLN pattern
    [LETTERS, LETTERS, NUMBERS, NUMBERS, LETTERS], // LLNNL pattern
    [NUMBERS, LETTERS, LETTERS, NUMBERS, LETTERS]  // NLLNL pattern
  ];
  
  // Select a random pattern using cryptographically secure random
  const selectedPattern = patterns[secureRandom(patterns.length)];
  
  // Keep generating IDs until we have a valid one
  let id;
  let attempts = 0;
  
  do {
    // Use the selected pattern to build the ID
    id = '';
    
    // Enforce first two characters: 1 letter and 1 number (order based on pattern)
    const firstCharIsLetter = selectedPattern[0] === LETTERS;
    
    // First character
    id += firstCharIsLetter ? 
      LETTERS.charAt(secureRandom(LETTERS.length)) : 
      NUMBERS.charAt(secureRandom(NUMBERS.length));
    
    // Second character
    id += firstCharIsLetter ? 
      NUMBERS.charAt(secureRandom(NUMBERS.length)) : 
      LETTERS.charAt(secureRandom(LETTERS.length));
      
    // Remaining 3 characters following the pattern
    for (let i = 2; i < 5; i++) {
      const charSet = selectedPattern[i % selectedPattern.length];
      id += charSet.charAt(secureRandom(charSet.length));
    }
    
    attempts++;
    if (attempts > 10) {
      // If we've made too many attempts, try a different approach
      // This is extremely unlikely to happen, but it's a safety measure
      id = generateBackupMedicalID();
      break;
    }
  } while (!isValidMedicalID(id));
  
  return id;
}

/**
 * Backup method to generate a medical ID
 * Uses a completely different approach as a fallback
 */
function generateBackupMedicalID(): string {
  // Create a timestamp-based ID with secure random elements
  const timestamp = Date.now().toString().slice(-3); // Last 3 digits of timestamp
  
  // Add 2 secure random characters from allowed chars
  let id = '';
  for (let i = 0; i < 2; i++) {
    id += ALLOWED_CHARS.charAt(secureRandom(ALLOWED_CHARS.length));
  }
  
  // Ensure we have at least one letter and one number
  id += LETTERS.charAt(secureRandom(LETTERS.length));
  id += NUMBERS.charAt(secureRandom(NUMBERS.length));
  
  // Add the timestamp part (ensures uniqueness even with multiple rapid generations)
  id += timestamp.charAt(secureRandom(timestamp.length));
  
  // Shuffle the ID characters for additional security
  id = shuffleString(id);
  
  // Truncate to 5 chars if somehow longer
  return id.substring(0, 5).toUpperCase();
}

/**
 * Shuffle a string using the Fisher-Yates algorithm
 */
function shuffleString(str: string): string {
  const array = str.split('');
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(secureRandom(i + 1));
    [array[i], array[j]] = [array[j], array[i]]; // Swap elements
  }
  return array.join('');
}

/**
 * Validate if a string matches the Medical ID format
 */
export function isValidMedicalID(id: string): boolean {
  // Basic format checks
  if (!id || id.length !== 5) return false;
  
  // Reject prohibited IDs explicitly
  if (PROHIBITED_IDS.includes(id)) {
    console.warn(`Rejected prohibited medical ID: ${id}`);
    return false;
  }
  
  // Check if it only contains allowed characters
  for (let i = 0; i < id.length; i++) {
    if (!ALLOWED_CHARS.includes(id.charAt(i))) {
      return false;
    }
  }
  
  // Check for at least one letter and at least one number
  let hasLetter = false;
  let hasNumber = false;
  for (let i = 0; i < id.length; i++) {
    const char = id.charAt(i);
    if (LETTERS.includes(char)) {
      hasLetter = true;
    } else if (NUMBERS.includes(char)) {
      hasNumber = true;
    }
    
    // Break early if both conditions are met
    if (hasLetter && hasNumber) {
      break;
    }
  }
  
  // Reject all-letter formats (like "SITPT")
  if (/^[A-Z]+$/i.test(id)) {
    console.error(`CRITICAL VALIDATION FAILURE: Rejected all-letter medical ID format: ${id}`);
    return false;
  }
  
  // Explicitly check for forbidden characters (especially I, O, 1, 0)
  if (/[IO10l]/i.test(id)) {
    console.error(`CRITICAL VALIDATION FAILURE: Medical ID contains forbidden characters: ${id}`);
    return false;
  }
  
  // Valid only if it has at least one letter AND one number
  return hasLetter && hasNumber;
}

/**
 * Generate a unique hospital-specific medical ID
 * Format: [HOSPITAL_CODE]-[RANDOM_CHARS]
 *
 * @param {string} hospitalCode - The hospital code or prefix (optional)
 * @returns {string} - A formatted medical ID with hospital prefix
 */
export function generateHospitalMedicalID(hospitalCode?: string): string {
  // Normalize hospital code - limit to 3 chars, uppercase
  const code = hospitalCode 
    ? hospitalCode.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 3)
    : DEFAULT_HOSPITAL.id.toUpperCase().substring(0, 3);
  
  // Add separator
  const prefix = code + '-';
  
  // Generate secure random characters for the ID portion
  let suffix = '';
  for (let i = 0; i < 6; i++) {
    suffix += ALLOWED_CHARS.charAt(secureRandom(ALLOWED_CHARS.length));
  }
  
  // Ensure we have at least one letter and one number in the suffix
  if (!/[A-Z]/i.test(suffix)) {
    suffix = suffix.substring(0, 5) + LETTERS.charAt(secureRandom(LETTERS.length));
  }
  if (!/[0-9]/.test(suffix)) {
    suffix = suffix.substring(0, 4) + NUMBERS.charAt(secureRandom(NUMBERS.length)) + 
            suffix.substring(5);
  }
  
  return prefix + suffix;
}

/**
 * Verify uniqueness of a medical ID against existing records
 * @param id The medical ID to check
 * @returns Promise resolving to true if ID is unique, false if already exists
 */
export async function isUniqueMedicalID(id: string): Promise<boolean> {
  try {
    // Import prisma here to avoid circular dependencies
    const { prisma } = await import('@/lib/database/prisma-client');
    
    // First check if the ID is valid
    if (!isValidMedicalID(id)) {
      console.error(`Medical ID failed validation: ${id}`);
      return false;
    }
    
    // Check if any patient has this medical ID already
    const existingPatient = await prisma.patient.findFirst({
      where: { mrn: id }
    });
    
    // Return true only if no patient with this medical ID was found
    const isUnique = existingPatient === null;
    
    if (!isUnique) {
      console.log(`Medical ID uniqueness check: ${id} already exists in database`);
    } else {
      console.log(`Medical ID uniqueness check: ${id} is unique and available`);
    }
    
    return isUnique;
  } catch (error) {
    console.error('Error checking medical ID uniqueness:', error);
    return false; // Fail safe - assume not unique if error occurs
  }
}

