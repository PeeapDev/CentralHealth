"use client";

// Helper functions to store and retrieve patient data in browser storage
// This helps maintain state between registration and dashboard

/**
 * Store user email after successful registration or login
 */
export function storeUserEmail(email: string) {
  if (typeof window !== 'undefined') {
    try {
      // Store in both localStorage and sessionStorage for redundancy
      localStorage.setItem('userEmail', email);
      sessionStorage.setItem('userEmail', email);
      return true;
    } catch (e) {
      console.error('Error storing user email:', e);
      return false;
    }
  }
  return false;
}

/**
 * Get stored user email
 */
export function getUserEmail(): string | null {
  if (typeof window !== 'undefined') {
    // Try localStorage first
    const email = localStorage.getItem('userEmail');
    if (email) return email;
    
    // Try sessionStorage next
    return sessionStorage.getItem('userEmail');
  }
  return null;
}

/**
 * Store patient ID after registration or profile fetch
 */
export function storePatientId(patientId: string) {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('patientId', patientId);
      return true;
    } catch (e) {
      console.error('Error storing patient ID:', e);
      return false;
    }
  }
  return false;
}

/**
 * Get stored patient ID
 */
export function getPatientId(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('patientId');
  }
  return null;
}

/**
 * Clear all stored patient data (for logout)
 */
export function clearPatientData() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('userEmail');
    localStorage.removeItem('patientId');
    sessionStorage.removeItem('userEmail');
    sessionStorage.removeItem('userSession');
  }
}
