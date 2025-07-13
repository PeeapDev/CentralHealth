/**
 * Secure Medical ID Generation Utility
 * 
 * Implements the CentralHealth System Medical ID requirements:
 * - Format: NHS-style 5-character alphanumeric format 
 * - Must contain a mix of letters and numbers
 * - Excludes confusing characters: i, l, 1, o, 0
 * - PERMANENT: Once assigned, an ID must never be regenerated
 * - Only generate new IDs for entirely new patients
 * - Supports hospital-specific ID format with prefix+UUID
 */

import crypto from 'crypto';

// Character set excluding confusing characters as per CentralHealth policy
const ALLOWED_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // No i, l, 1, o, 0
const LETTER_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ'; // Letters only
const NUMBER_CHARS = '23456789'; // Numbers only
const HOSPITAL_ID_SEPARATOR = '-';

// Explicitly prohibited medical IDs (Set for O(1) lookups)
const PROHIBITED_IDS = new Set([
  'TEST', 'DEMO', 'ADMIN', 'GUEST', 'DUMMY', 'SAMPL', 'EXAMPL',
  'MOCK', 'FAKE', 'XTEST', 'TESTA', 'TESTB', 'LOCAL'
]);

/**
 * Medical ID Generator class for creating secure, compliant medical IDs
 * Provides generation methods for standard NHS-style IDs and hospital-specific IDs
 */
export class MedicalIDGenerator {
  // Track generation statistics
  private static generationStats = {
    totalGenerated: 0,
    backupUsed: 0,
    lastGenerated: null as string | null
  };

  /**
   * Get generation statistics for monitoring and auditing
   */
  static getGenerationStats() {
    return { ...this.generationStats };
  }

  /**
   * Generates a standard 5-character NHS-style medical ID
   * Guaranteed to be secure, random, and policy-compliant with:
   * - Exactly 5 characters total
   * - 2-3 letters and 2-3 numbers (always adding up to 5)
   * - Follows NHS-style format requirements
   */
  static generateStandardID(): string {
    this.generationStats.totalGenerated++;
    
    // CRITICAL FIX: Use a fixed pattern approach to guarantee valid IDs
    // Always use 3 letters + 2 numbers in a fixed pattern to ensure compliance
    
    // Create secure random bytes for character selection
    const randomBytes = crypto.randomBytes(10);
    
    // Fixed pattern: LNLNL (Letter-Number-Letter-Number-Letter)
    // This guarantees a mix of letters and numbers in every ID
    let id = '';
    
    // Position 0: Letter
    id += LETTER_CHARS[randomBytes[0] % LETTER_CHARS.length];
    
    // Position 1: Number
    id += NUMBER_CHARS[randomBytes[1] % NUMBER_CHARS.length];
    
    // Position 2: Letter
    id += LETTER_CHARS[randomBytes[2] % LETTER_CHARS.length];
    
    // Position 3: Number
    id += NUMBER_CHARS[randomBytes[3] % NUMBER_CHARS.length];
    
    // Position 4: Letter
    id += LETTER_CHARS[randomBytes[4] % LETTER_CHARS.length];
    
    // Double-check that our ID contains both letters and numbers
    // This is a redundant safety check since our pattern guarantees it
    const hasLetter = /[A-Z]/.test(id);
    const hasNumber = /[0-9]/.test(id);
    
    if (!hasLetter || !hasNumber) {
      console.error('CRITICAL ERROR: Generated invalid medical ID:', id);
      // This should never happen with our fixed pattern, but just in case
      return this._generateBackupID();
    }
    
    // Ensure the ID isn't in the prohibited list
    if (PROHIBITED_IDS.has(id)) {
      // Try again recursively - this is safe as prohibited IDs are very few
      return this.generateStandardID();
    }
    
    this.generationStats.lastGenerated = id;
    return id;
  }

  /**
   * Generate a hospital-specific medical ID with 3-char prefix and UUID
   * @param hospitalPrefix 3-character hospital identifier
   */
  static generateHospitalID(hospitalPrefix: string): string {
    this.generationStats.totalGenerated++;
    
    // Ensure prefix is valid
    if (!/^[A-Z0-9]{3}$/.test(hospitalPrefix)) {
      throw new Error('Hospital prefix must be exactly 3 uppercase alphanumeric characters');
    }
    
    // Generate UUID v4 and convert to uppercase with hyphens removed
    const uuid = crypto.randomUUID().replace(/-/g, '').toUpperCase();
    
    // Combine prefix with UUID
    const id = `${hospitalPrefix}${HOSPITAL_ID_SEPARATOR}${uuid}`;
    
    this.generationStats.lastGenerated = id;
    return id;
  }

  /**
   * Backup method to generate a medical ID when the primary method fails
   * Implements guaranteed character distribution with 2 letters and 3 numbers
   */
  private static _generateBackupID(): string {
    this.generationStats.backupUsed++;
    
    const randomBytes = crypto.randomBytes(5); // Reduced from 10 since we only need 5 bytes
    
    // Create pattern that guarantees 2 letters and 3 numbers in random order
    const parts = [
      LETTER_CHARS[randomBytes[0] % LETTER_CHARS.length],
      LETTER_CHARS[randomBytes[1] % LETTER_CHARS.length],
      NUMBER_CHARS[randomBytes[2] % NUMBER_CHARS.length],
      NUMBER_CHARS[randomBytes[3] % NUMBER_CHARS.length],
      NUMBER_CHARS[randomBytes[4] % NUMBER_CHARS.length]
    ];
    
    // Shuffle to avoid predictable patterns
    for (let i = parts.length - 1; i > 0; i--) {
      const j = Math.floor((randomBytes[i % randomBytes.length] / 255) * (i + 1));
      [parts[i], parts[j]] = [parts[j], parts[i]];
    }
    
    const id = parts.join('');
    return PROHIBITED_IDS.has(id) ? 'XM25K' : id; // Fallback to known valid ID if prohibited
  }
}

/**
 * Medical ID Validator class for checking if IDs comply with CentralHealth policies
 */
export class MedicalIDValidator {
  /**
   * Validates if a medical ID (standard or hospital-specific) is compliant
   */
  static validate(id: string): boolean {
    if (!id || typeof id !== 'string') return false;
    
    // Check if it's a hospital-specific ID
    if (id.includes(HOSPITAL_ID_SEPARATOR)) {
      return this._validateHospitalID(id);
    }
    
    // Otherwise validate as standard ID
    return this.validateStandardID(id);
  }

  /**
   * Enhanced validation that provides detailed reasons for validation failures
   */
  static validateWithDetails(id: string): {
    isValid: boolean;
    reasons?: string[];
  } {
    const reasons: string[] = [];
    
    if (!id || typeof id !== 'string') {
      return { isValid: false, reasons: ['ID is empty or not a string'] };
    }
    
    if (id.includes(HOSPITAL_ID_SEPARATOR)) {
      return this._validateHospitalIDWithDetails(id);
    }
    
    return this._validateStandardIDWithDetails(id);
  }

  /**
   * Validates standard 5-character medical ID
   */
  static validateStandardID(id: string): boolean {
    if (!id || typeof id !== 'string' || id.length !== 5) return false;
    
    // Check if it's in the prohibited list
    if (PROHIBITED_IDS.has(id)) return false;
    
    let hasLetter = false;
    let hasNumber = false;
    
    // Check each character
    for (let i = 0; i < id.length; i++) {
      const char = id[i];
      
      // Check if character is allowed
      if (!ALLOWED_CHARS.includes(char)) return false;
      
      // Track if we have at least one letter and one number
      if (LETTER_CHARS.includes(char)) hasLetter = true;
      if (NUMBER_CHARS.includes(char)) hasNumber = true;
    }
    
    return hasLetter && hasNumber;
  }

  /**
   * Detailed validation for standard medical IDs with specific failure reasons
   */
  private static _validateStandardIDWithDetails(id: string) {
    const reasons: string[] = [];
    let isValid = true;

    if (id.length !== 5) {
      reasons.push('ID must be exactly 5 characters');
      isValid = false;
    }

    if (PROHIBITED_IDS.has(id)) {
      reasons.push('ID is in prohibited list');
      isValid = false;
    }

    let hasLetter = false;
    let hasNumber = false;
    
    for (let i = 0; i < id.length; i++) {
      const char = id[i];
      
      if (!ALLOWED_CHARS.includes(char)) {
        reasons.push(`Character '${char}' at position ${i+1} is not allowed`);
        isValid = false;
      }
      
      if (LETTER_CHARS.includes(char)) hasLetter = true;
      if (NUMBER_CHARS.includes(char)) hasNumber = true;
    }
    
    if (!hasLetter) {
      reasons.push('ID must contain at least one letter');
      isValid = false;
    }
    
    if (!hasNumber) {
      reasons.push('ID must contain at least one number');
      isValid = false;
    }
    
    return { isValid, reasons: reasons.length > 0 ? reasons : undefined };
  }

  /**
   * Validates hospital-specific ID with prefix and UUID format
   */
  private static _validateHospitalID(id: string): boolean {
    const parts = id.split(HOSPITAL_ID_SEPARATOR);
    if (parts.length !== 2) return false;
    
    const [prefix, uuid] = parts;
    
    // Validate prefix
    if (!/^[A-Z0-9]{3}$/.test(prefix)) return false;
    
    // Validate UUID part - only uppercase hex characters
    if (!/^[A-F0-9]{24}$/.test(uuid)) return false;
    
    return true;
  }

  /**
   * Detailed validation for hospital IDs with specific failure reasons
   */
  private static _validateHospitalIDWithDetails(id: string) {
    const reasons: string[] = [];
    
    const parts = id.split(HOSPITAL_ID_SEPARATOR);
    if (parts.length !== 2) {
      return { 
        isValid: false, 
        reasons: ['Hospital ID must contain exactly one separator'] 
      };
    }
    
    const [prefix, uuid] = parts;
    let isValid = true;
    
    // Validate prefix
    if (!/^[A-Z0-9]{3}$/.test(prefix)) {
      reasons.push('Hospital prefix must be exactly 3 uppercase alphanumeric characters');
      isValid = false;
    }
    
    // Validate UUID part
    if (!/^[A-F0-9]{24}$/.test(uuid)) {
      reasons.push('UUID part must be exactly 24 uppercase hexadecimal characters');
      isValid = false;
    }
    
    return { isValid, reasons: reasons.length > 0 ? reasons : undefined };
  }
}

/**
 * Medical ID Formatter class for display and normalization
 */
export class MedicalIDFormatter {
  /**
   * Formats a medical ID for display
   * Standard IDs: XX-XXX format
   * Hospital IDs: Already formatted with separator
   */
  static format(id: string): string {
    if (!id || typeof id !== 'string') return id;
    
    // Hospital IDs are already formatted
    if (id.includes(HOSPITAL_ID_SEPARATOR)) {
      return id;
    }
    
    // Format standard ID as XX-XXX
    if (id.length === 5) {
      return `${id.substring(0, 2)}-${id.substring(2)}`;
    }
    
    // Return original if format not recognized
    return id;
  }

  /**
   * Normalizes a medical ID by removing any formatting
   * For standard IDs: removes hyphens
   * For hospital IDs: preserves the separator
   */
  static normalize(id: string): string {
    if (!id || typeof id !== 'string') return id;
    
    // For hospital IDs, we need to preserve the main separator but remove any other hyphens
    if (id.includes(HOSPITAL_ID_SEPARATOR)) {
      const parts = id.split(HOSPITAL_ID_SEPARATOR);
      if (parts.length === 2) {
        return `${parts[0]}${HOSPITAL_ID_SEPARATOR}${parts[1].replace(/-/g, '')}`;
      }
    }
    
    // For standard IDs, just remove any hyphens
    return id.replace(/-/g, '');
  }
}

/**
 * Medical ID Uniqueness checker for database integration
 * Abstracts database checks to allow swapping of persistence layers
 */
export class MedicalIDUniqueness {
  /**
   * Check if a medical ID is unique in the database
   * This is a placeholder for actual database integration
   */
  static async isUnique(id: string, hospitalId?: string, currentPatientId?: string): Promise<boolean> {
    // This should be implemented to check against your database
    // Return true if the ID is unique, false otherwise
    // The hospitalId parameter can be used to scope the check to a specific hospital
    // The currentPatientId parameter can be used to exclude the current patient from the check (for updates)
    
    // Example implementation:
    // const count = await prisma.patient.count({
    //   where: {
    //     medicalId: id,
    //     hospitalId: hospitalId,
    //     id: { not: currentPatientId } // Exclude current patient if updating
    //   }
    // });
    // return count === 0;
    
    // Temporary placeholder that just performs basic validation
    return MedicalIDValidator.validate(id);
  }
}

// Legacy function aliases for backward compatibility
export function generateMedicalID(): string {
  return MedicalIDGenerator.generateStandardID();
}

export function validateStoredMedicalID(id: string): boolean {
  return MedicalIDValidator.validateStandardID(id);
}

/**
 * Validates if a medical ID follows the CentralHealth System requirements
 * - Must be 5 characters for standard IDs
 * - Must contain a mix of letters and numbers
 * - Must not be in the prohibited list
 * - For hospital IDs, must have valid format with proper separator
 */
export function isValidMedicalID(medicalID: string): boolean {
  return MedicalIDValidator.validate(medicalID);
}

export function formatMedicalID(id: string): string {
  return MedicalIDFormatter.format(id);
}

export function normalizeMedicalID(id: string): string {
  return MedicalIDFormatter.normalize(id);
}