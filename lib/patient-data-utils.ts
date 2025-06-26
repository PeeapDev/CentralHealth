/**
 * Patient Data Utilities
 * 
 * This file contains utilities for consistent patient data handling
 * across registration, onboarding, and profile management.
 * 
 * IMPORTANT: This follows the CentralHealth System rules for patient data management:
 * - No mock/test data is ever used
 * - Medical IDs are preserved and never regenerated
 * - Patient data is stored consistently in centralized fields
 */

// To support both CommonJS and ES modules
// @ts-nocheck

/**
 * Standard structure for patient contact information
 * Includes authentication-related fields following CentralHealth System rules
 */
interface PatientContact {
  email: string;
  phone: string;
  address?: string;
  alternatePhone?: string;
  preferredContactMethod?: string;
  password?: string; // For authentication (should be bcrypt hashed)
}

/**
 * Extracts a value from an object using multiple possible property paths
 * 
 * @param obj Object to extract from
 * @param paths Array of possible property paths to try
 * @returns First non-empty value found or empty string
 */
function extractValue(obj: any, paths: string[]) {
  if (!obj) return '';
  
  for (const path of paths) {
    // Handle dot notation paths (e.g., 'contact.email')
    if (path.includes('.')) {
      const [parent, child] = path.split('.');
      if (obj[parent]?.[child]) return obj[parent][child];
      continue;
    }
    
    // Handle direct properties
    if (obj[path]) return obj[path];
  }
  
  // Handle special case for FHIR telecom array structure
  if (Array.isArray(obj.telecom)) {
    // If paths include email, look for email system
    if (paths.includes('email')) {
      const emailEntry = obj.telecom.find((t) => 
        t.system === 'email' && t.value);
      if (emailEntry?.value) return emailEntry.value;
    } 
    // If paths include phone, look for phone system
    else if (paths.includes('phone')) {
      const phoneEntry = obj.telecom.find((t) => 
        t.system === 'phone' && t.value);
      if (phoneEntry?.value) return phoneEntry.value;
    }
  }
  
  return '';
}

/**
 * Creates a properly structured patient contact object
 * This ensures contact data is stored consistently across the system
 * 
 * @param contactData Raw contact data from forms or API
 * @returns Properly structured contact object for database storage
 */
function createPatientContact(contactData: any): PatientContact {
  // Default empty contact structure
  const contact = {
    email: '',
    phone: '',
  };
  
  // Handle empty or null input
  if (!contactData) return contact;
  
  // Extract email from various potential sources
  contact.email = extractValue(contactData, [
    'email',
    'emailAddress',
    'userEmail',
    'contact.email',
    'patientEmail'
  ]);
  
  // Extract phone from various potential sources
  contact.phone = extractValue(contactData, [
    'phone',
    'phoneNumber',
    'contact.phone',
    'mobileNumber',
    'mobile',
    'tel'
  ]);
  
  // Extract password for authentication (already hashed from registration or login)  
  contact.password = extractValue(contactData, [
    'password',
    'contact.password',
    'userPassword',
    'credential',
    'medicalHistory.password'
  ]);

  // Add optional fields if present
  contact.address = extractValue(contactData, [
    'address',
    'homeAddress',
    'contact.address'
  ]);
  
  contact.alternatePhone = extractValue(contactData, [
    'alternatePhone',
    'secondaryPhone',
    'emergencyPhone',
    'workPhone'
  ]);
  
  contact.preferredContactMethod = extractValue(contactData, [
    'preferredContactMethod',
    'contactPreference'
  ]);
  
  return contact;
}

/**
 * Safely parses JSON contact data from database
 * 
 * @param contactJson Contact JSON from database
 * @returns Structured contact object
 */
function parsePatientContact(contactJson: any): PatientContact {
  if (!contactJson) return { email: '', phone: '' };
  
  try {
    // Handle string JSON
    if (typeof contactJson === 'string') {
      return createPatientContact(JSON.parse(contactJson));
    }
    
    // Handle already parsed JSON
    return createPatientContact(contactJson);
  } catch (error) {
    console.error('Failed to parse patient contact:', error);
    return { email: '', phone: '' };
  }
}

/**
 * Gets email from patient contact data
 * 
 * @param contact Patient contact data
 * @returns Email address or empty string
 */
function getPatientEmail(contact: any): string {
  return parsePatientContact(contact).email || '';
}

/**
 * Gets phone from patient contact data
 * 
 * @param contact Patient contact data
 * @returns Phone number or empty string
 */
function getPatientPhone(contact: any): string {
  return parsePatientContact(contact).phone || '';
}

/**
 * Validates if an email appears to be properly formatted
 * 
 * @param email Email to validate
 * @returns True if email appears valid
 */
function isValidEmail(email: any): boolean {
  if (!email) return false;
  // Basic email validation regex
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Ensures a patient's contact info is properly structured for the database
 * This is ideal for updates on existing patients
 * 
 * @param existingContact Current contact data from database
 * @param updates New contact updates to apply
 * @returns Properly structured contact object
 */
function updatePatientContact(existingContact: any, updates: any): PatientContact {
  const current = parsePatientContact(existingContact);
  
  return {
    ...current,
    ...updates
  };
}

// Export as both CommonJS and ES modules for compatibility
const patientDataUtils = {
  createPatientContact,
  parsePatientContact,
  getPatientEmail,
  getPatientPhone,
  isValidEmail,
  updatePatientContact
};

// Export as ES Module only - Next.js server components require consistent module system
export default patientDataUtils;

// Direct exports of all utilities
export {
  createPatientContact,
  parsePatientContact,
  getPatientEmail,
  getPatientPhone,
  isValidEmail,
  updatePatientContact
};

// Alias exports for backward compatibility
export const extractEmailFromPatient = getPatientEmail;
export const extractPhoneFromPatient = getPatientPhone;
export const parseContactJson = parsePatientContact;
