/**
 * Medical ID Card component types
 * 
 * Follows CentralHealth system rules:
 * - Medical IDs are permanent, immutable 5-character alphanumeric codes
 * - Medical IDs are stored in the mrn field
 * - No mock/test data allowed
 * - Medical ID display respects role-based access control
 */

// Role types for access control
export type UserRole = 'super_admin' | 'hospital_admin' | 'clinical_admin' | 'physician' | 
                     'nurse' | 'front_desk' | 'billing' | 'patient';

// Patient data required for Medical ID Card
export interface PatientMedicalIdData {
  // Core identifiers
  id: string;              // System UUID (internal use only)
  mrn: string;             // Permanent medical ID in NHS-style format
  
  // Patient info that may be displayed alongside the ID
  firstName?: string;      // May be null based on role
  lastName?: string;       // May be null based on role
  dateOfBirth?: string;    // May be null based on role
  onboardingCompleted?: boolean;
  registrationDate?: string;
  hospitalId?: string;     // Associated hospital
}

// Props for the MedicalIdCard component
export interface MedicalIdCardProps {
  // Patient data or a way to fetch it
  patientData?: PatientMedicalIdData;
  patientId?: string;      // Alternative: provide ID to fetch data
  medicalId?: string;      // Alternative: provide medical ID to fetch data
  
  // Display options
  showPatientName?: boolean;
  showRegistrationDate?: boolean;
  showQrCode?: boolean;    // Whether to display QR code with medical ID
  compact?: boolean;       // Whether to show in compact layout
  
  // Access control
  currentUserRole: UserRole;
  
  // Styling
  className?: string;
  
  // Events
  onError?: (error: Error) => void;
}