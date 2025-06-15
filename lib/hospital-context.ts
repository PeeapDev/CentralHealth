/**
 * Hospital Context Provider
 * 
 * This provides a default hospital context for the centralized hospital system.
 * Since this is a centralized system, we don't need to fetch specific hospital data
 * for patient authentication - instead we use the default system hospital.
 */

export type HospitalData = {
  id: string;
  name: string;
  logo?: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
};

// Default hospital data for the centralized system
export const DEFAULT_HOSPITAL: HospitalData = {
  id: 'central-hospital',
  name: 'Central Health System',
  description: 'Centralized hospital management system',
  address: '123 Medical Center Drive',
  phone: '(555) 123-4567',
  email: 'contact@centralhealthsystem.org',
};

/**
 * Get hospital data without making an API call
 * This prevents "hospital not found" errors in the patient portal
 */
export function getSystemHospital(): HospitalData {
  return DEFAULT_HOSPITAL;
}

/**
 * Check if we're in the patient portal section
 */
export function isPatientPortal(pathname: string): boolean {
  return pathname.startsWith('/patient/') || pathname === '/patient';
}
