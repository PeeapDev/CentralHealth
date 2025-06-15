"use client";

import { DEFAULT_HOSPITAL } from '@/lib/hospital-context';

/**
 * Clear all patient-related data from localStorage and sessionStorage
 * This is used for logout, session expiration, and error handling
 * 
 * Note: This maintains the default hospital context to prevent "hospital not found" errors
 */
export function clearPatientData() {
  try {
    // Remove patient-specific data
    localStorage.removeItem('patientId');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('authToken');
    localStorage.removeItem('onboardingData');
    localStorage.removeItem('patientProfile');
    localStorage.removeItem('lastLogin');
    
    // Remove any session storage items
    sessionStorage.removeItem('patientId');
    sessionStorage.removeItem('userEmail');
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('onboardingData');
    
    // Set default hospital data to prevent "hospital not found" errors
    localStorage.setItem('hospitalId', DEFAULT_HOSPITAL.id);
    localStorage.setItem('hospitalName', DEFAULT_HOSPITAL.name);
    
    console.log('Successfully cleared patient data from storage');
    return true;
  } catch (error) {
    console.error('Error clearing patient data:', error);
    return false;
  }
}

/**
 * Get user email from localStorage
 */
export function getUserEmail(): string | null {
  try {
    return localStorage.getItem('userEmail');
  } catch (error) {
    console.error('Error retrieving user email:', error);
    return null;
  }
}

/**
 * Get patient ID from localStorage
 */
export function getPatientId(): string | null {
  try {
    return localStorage.getItem('patientId');
  } catch (error) {
    console.error('Error retrieving patient ID:', error);
    return null;
  }
}

/**
 * Get hospital ID from localStorage, fallback to default if not found
 */
export function getHospitalId(): string {
  try {
    const id = localStorage.getItem('hospitalId');
    return id || DEFAULT_HOSPITAL.id;
  } catch (error) {
    console.error('Error retrieving hospital ID:', error);
    return DEFAULT_HOSPITAL.id;
  }
}
