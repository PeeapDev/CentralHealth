/**
 * Validation utilities for the CentralHealth System
 * 
 * These validators ensure data consistency and security across the platform
 * following the centralization requirements from the system spec.
 */

/**
 * Validates that a string is a proper name
 * Rules:
 * - At least 2 characters
 * - Only letters, spaces, hyphens, and apostrophes
 * - No numbers or special characters
 */
export function validateName(name?: string): boolean {
  if (!name || typeof name !== 'string') return false;
  if (name.length < 2) return false;
  
  // Allow letters, spaces, hyphens, apostrophes, and periods
  const nameRegex = /^[A-Za-z\s\-'\.]+$/;
  return nameRegex.test(name);
}

/**
 * Validates and normalizes email addresses
 * Rules:
 * - Basic email format validation
 * - Converts to lowercase for consistency
 * - Rejects obviously fake domains
 */
export function validateEmail(email?: string): boolean {
  if (!email || typeof email !== 'string') return false;
  
  // Convert to lowercase for consistency
  email = email.toLowerCase();
  
  // Basic email format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return false;
  
  // Reject obvious test domains
  const blockedDomains = [
    'test.com', 
    'example.com', 
    'sample.com', 
    'fake.com',
    'test.org',
    'example.org'
  ];
  
  const domain = email.split('@')[1];
  if (blockedDomains.includes(domain)) {
    console.warn(`Rejected email with test domain: ${email}`);
    return false;
  }
  
  return true;
}

/**
 * Normalizes an email address for storage or comparison
 * - Converts to lowercase
 * - Trims whitespace
 */
export function normalizeEmail(email?: string): string {
  if (!email) return '';
  return email.toLowerCase().trim();
}

/**
 * Validates a phone number
 * - Removes formatting characters for comparison
 * - Ensures minimum length
 */
export function validatePhone(phone?: string): boolean {
  if (!phone || typeof phone !== 'string') return false;
  
  // Remove formatting characters
  const digitsOnly = phone.replace(/\D/g, '');
  
  // Must have at least 7 digits
  if (digitsOnly.length < 7) return false;
  
  return true;
}

/**
 * Normalizes a phone number for storage
 * - Removes non-digit characters
 */
export function normalizePhone(phone?: string): string {
  if (!phone) return '';
  return phone.replace(/\D/g, '');
}
