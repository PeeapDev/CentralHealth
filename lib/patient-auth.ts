"use client";

/**
 * Patient Authentication Utilities
 * Centralizes all patient authentication functions to ensure consistency
 * between login, logout, and session management
 */

/**
 * Store patient login credentials consistently across storage methods
 */
export function storePatientCredentials(medicalNumber: string, email?: string, patientId?: string) {
  if (typeof window === 'undefined') return false;
  
  try {
    // Always store the medical number (primary identifier)
    localStorage.setItem("medicalNumber", medicalNumber);
    sessionStorage.setItem("medicalNumber", medicalNumber);
    
    // Store email if provided
    if (email) {
      localStorage.setItem("userEmail", email);
      sessionStorage.setItem("userEmail", email);
      
      // Generate a display name from email
      const patientDisplayName = email.split('@')[0];
      localStorage.setItem("patientName", patientDisplayName);
    }
    
    // Store patient ID if provided
    if (patientId) {
      localStorage.setItem("patientId", patientId);
    }
    
    // Set login state flag
    localStorage.setItem("isPatientLoggedIn", "true");
    
    return true;
  } catch (error) {
    console.error("Error storing patient credentials:", error);
    return false;
  }
}

/**
 * Get patient credentials from storage
 */
export function getPatientCredentials() {
  if (typeof window === 'undefined') {
    return { medicalNumber: null, email: null, patientId: null, isLoggedIn: false };
  }
  
  try {
    const medicalNumber = localStorage.getItem("medicalNumber") || sessionStorage.getItem("medicalNumber");
    const email = localStorage.getItem("userEmail") || sessionStorage.getItem("userEmail");
    const patientId = localStorage.getItem("patientId");
    const isLoggedIn = localStorage.getItem("isPatientLoggedIn") === "true";
    
    return {
      medicalNumber,
      email,
      patientId,
      isLoggedIn
    };
  } catch (error) {
    console.error("Error fetching patient credentials:", error);
    return { medicalNumber: null, email: null, patientId: null, isLoggedIn: false };
  }
}

/**
 * Clear all patient authentication data (for logout)
 */
export function clearPatientCredentials() {
  if (typeof window === 'undefined') return false;
  
  try {
    // Clear localStorage items
    localStorage.removeItem("medicalNumber");
    localStorage.removeItem("patientName");
    localStorage.removeItem("patientInfo");
    localStorage.removeItem("token");
    localStorage.removeItem("isPatientLoggedIn");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("patientId");
    localStorage.removeItem("specializedCareSettings");
    
    // Clear sessionStorage items too
    sessionStorage.removeItem("userEmail");
    sessionStorage.removeItem("userSession");
    sessionStorage.removeItem("medicalNumber");
    
    return true;
  } catch (error) {
    console.error("Error clearing patient credentials:", error);
    return false;
  }
}

/**
 * Check if the patient is logged in
 */
export function isPatientLoggedIn() {
  if (typeof window === 'undefined') return false;
  
  try {
    // Check login state flag
    const isLoggedIn = localStorage.getItem("isPatientLoggedIn") === "true";
    
    // Verify essential credential is present
    const hasMedicalNumber = !!(localStorage.getItem("medicalNumber") || 
                               sessionStorage.getItem("medicalNumber"));
    
    return isLoggedIn && hasMedicalNumber;
  } catch (error) {
    console.error("Error checking patient login status:", error);
    return false;
  }
}
