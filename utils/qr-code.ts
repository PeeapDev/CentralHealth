/**
 * QR Code Utilities
 * Handles QR code validation for patient medical IDs
 */

/**
 * Validates if a string matches the NHS-style medical ID format
 * (5-character alphanumeric, excluding confusing characters i, l, 1, o, 0)
 */
export function isValidMedicalId(medicalId: string): boolean {
  if (!medicalId || typeof medicalId !== 'string') {
    return false;
  }

  // Medical IDs must be 5 characters long, alphanumeric
  const validFormat = /^[A-Za-z2-9]{5}$/;
  
  // Check if it contains any forbidden characters (case insensitive)
  const containsForbiddenChars = /[iIlL1oO0]/.test(medicalId);
  
  return validFormat.test(medicalId) && !containsForbiddenChars;
}

/**
 * Normalizes a medical ID by converting to uppercase
 * This ensures consistent format when searching by medical ID
 */
export function normalizeMedicalId(medicalId: string): string {
  if (!medicalId) return '';
  return medicalId.toUpperCase();
}

/**
 * Validates the data from a QR code scan to ensure it contains a valid medical ID
 * This function follows the CentralHealth requirements for medical IDs
 */
export function validateQrCodeData(qrData: string): {
  isValid: boolean;
  medicalId?: string;
  error?: string;
} {
  // If empty or not a string
  if (!qrData || typeof qrData !== 'string') {
    return {
      isValid: false,
      error: 'QR code did not contain any data'
    };
  }

  // Trim and normalize the data
  const trimmedData = qrData.trim();
  
  // Check if it matches the medical ID format
  if (!isValidMedicalId(trimmedData)) {
    return {
      isValid: false,
      error: 'QR code does not contain a valid medical ID format'
    };
  }

  // Return the normalized medical ID
  return {
    isValid: true,
    medicalId: normalizeMedicalId(trimmedData)
  };
}

/**
 * Extracts a medical ID from a QR code scan
 * Returns normalized medical ID if valid, or null if invalid
 */
export function extractMedicalIdFromQrCode(qrData: string): string | null {
  const validation = validateQrCodeData(qrData);
  return validation.isValid && validation.medicalId ? validation.medicalId : null;
}
