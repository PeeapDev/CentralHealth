/**
 * Utility for generating and validating Medical IDs
 * 
 * Format: 5-character alphanumeric string
 * Excludes confusing characters: 0, 1, O, I, L
 * Allows: A-H, J-N, P-Z, 2-9 (32 total)
 * Total combinations: 32^5 = 33,554,432
 */

/**
 * Generate a random Medical ID using the specified character set
 */
export function generateMedicalID(length = 5): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let id = '';
  for (let i = 0; i < length; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
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
 * Generate a hospital-specific Medical ID with a prefix
 */
export function generateHospitalMedicalID(hospitalCode: string): string {
  return `${hospitalCode}-${generateMedicalID()}`;
}
