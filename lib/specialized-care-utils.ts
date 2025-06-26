/**
 * Specialized Care Dashboard Utilities
 * 
 * Central utility functions for managing specialized care dashboards.
 * These functions enforce CentralHealth policies around age-based conditions
 * and permanent medical ID preservation.
 */

/**
 * Minimum age threshold for displaying maternal care options
 */
export const MATERNAL_CARE_MIN_AGE = 12;

/**
 * Calculate patient age from date of birth
 * 
 * @param dateOfBirth Patient date of birth (string or Date object)
 * @returns Calculated age in years
 */
export function calculateAge(dateOfBirth: string | Date): number {
  if (!dateOfBirth) {
    return 0;
  }

  try {
    const birthDate = typeof dateOfBirth === 'string' ? new Date(dateOfBirth) : dateOfBirth;
    const today = new Date();
    
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    // Adjust age if birthday hasn't occurred yet this year
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    // Validate reasonable age range
    if (age < 0) return 0;
    if (age > 120) return 120; // Cap at reasonable maximum
    
    return age;
  } catch (error) {
    console.error('Error calculating age:', error);
    return 0;
  }
}

/**
 * Checks if a patient is eligible for maternal care dashboards based on age and gender
 * 
 * @param dateOfBirth Patient date of birth (string or Date object)
 * @param gender Patient gender
 * @returns Boolean indicating eligibility for maternal care dashboards
 */
export function isEligibleForMaternalCare(dateOfBirth: string | Date | undefined, gender: string | undefined): boolean {
  if (!dateOfBirth || !gender || gender.toLowerCase() !== 'female') {
    return false;
  }

  try {
    const age = calculateAge(dateOfBirth);
    return age >= MATERNAL_CARE_MIN_AGE;
  } catch (error) {
    console.error('Error calculating age for maternal care eligibility:', error);
    return false;
  }
}

/**
 * Interface for specialized care settings
 */
export interface SpecializedCareSettings {
  showMaternalCare: boolean;
  autoShowBasedOnStatus?: boolean;
}

/**
 * Default specialized care settings
 */
export const DEFAULT_SPECIALIZED_CARE_SETTINGS: SpecializedCareSettings = {
  showMaternalCare: false,
  autoShowBasedOnStatus: true
};

/**
 * Determines if maternal care dashboards should be shown based on:
 * 1. Patient age and gender eligibility
 * 2. User preference settings
 * 3. Current pregnancy or recent birth status (if autoShowBasedOnStatus=true)
 * 
 * @param dateOfBirth Patient date of birth
 * @param gender Patient gender
 * @param settings User settings for specialized care
 * @param isPregnant Current pregnancy status (if known)
 * @param recentBirth Whether the patient gave birth in last 6 months
 * @returns Boolean indicating whether maternal care should be shown
 */
export function shouldShowMaternalCare(
  dateOfBirth: string | Date | undefined,
  gender: string | undefined,
  settings: SpecializedCareSettings = DEFAULT_SPECIALIZED_CARE_SETTINGS,
  isPregnant?: boolean,
  recentBirth?: boolean
): boolean {
  // First check age/gender eligibility
  if (!isEligibleForMaternalCare(dateOfBirth, gender)) {
    return false;
  }

  // If auto-showing based on status is enabled and the patient is pregnant or had recent birth
  if (settings.autoShowBasedOnStatus && (isPregnant || recentBirth)) {
    return true;
  }

  // Otherwise use the user's preference setting
  return settings.showMaternalCare;
}
