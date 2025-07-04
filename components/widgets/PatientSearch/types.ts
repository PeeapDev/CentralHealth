/**
 * Patient Search Widget Types
 */

export interface Patient {
  id: string;
  mrn: string; // Medical ID following NHS-style 5-character alphanumeric format (permanent per CentralHealth policy)
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  sex?: string;
  photo?: string;
  // Additional fields needed for patient profile display
  fullName?: string;
  profilePicture?: {
    id?: string;
    imageUrl: string;
  };
  User?: {
    id: string;
    name: string;
    email: string;
  };
  // Additional metadata
  onboardingCompleted?: boolean;
  lastVisit?: string | Date;
  nextVisit?: string | Date;
  note?: string;
  _original?: any; // For preserving original data
}

export interface PatientSearchProps {
  /** Callback when a patient is selected */
  onPatientSelect?: (patient: Patient) => void;
  
  /** Function to fetch patients based on search term */
  fetchPatients?: (searchTerm: string) => Promise<Patient[]>;
  
  /** Function to fetch a patient by Medical ID (MRN) */
  fetchPatientByMrn?: (mrn: string) => Promise<Patient | null>;
  
  /** Whether to show the QR scanner button (default: true) */
  showQrScanner?: boolean;
  
  /** Whether to allow keyboard shortcuts (default: true) */
  enableKeyboardShortcuts?: boolean;
  
  /** Custom placeholder for search input */
  searchPlaceholder?: string;
  
  /** Additional CSS class names */
  className?: string;
}
