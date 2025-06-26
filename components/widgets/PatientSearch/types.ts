import { ReactNode } from 'react';

// Role-based permission types
export type UserRole = 'super_admin' | 'hospital_admin' | 'clinical_admin' | 'physician' | 'nurse' | 'front_desk' | 'billing';

// Patient search parameters
export interface PatientSearchParams {
  query?: string;
  medicalId?: string; // mrn field - permanent medical ID
  name?: string;
  email?: string;
  dateOfBirth?: string;
  gender?: string;
  limit?: number;
  offset?: number;
  hospitalId?: string;
}

// Patient search response
export interface PatientSearchResponse {
  patients: PatientResult[];
  total: number;
  page: number;
  limit: number;
}

// Patient result with role-based field visibility
export interface PatientResult {
  // Core identifiers - visible to all roles
  id: string;            // System ID (UUID)
  mrn: string;           // The permanent medical ID (NHS-style)
  
  // Protected personal data - visibility varies by role
  name: string;          // Full name
  
  // These fields may be null based on role permissions
  gender?: string;
  dateOfBirth?: string;
  age?: number;
  email?: null | string;
  phone?: null | string;
  address?: null | string;
  
  // Clinical data - only visible to clinical roles
  onboardingCompleted?: boolean;
  lastVisit?: string | null;
  upcomingAppointment?: string | null;
  
  // Hospital-specific data
  hospitalId: string;
  departmentId?: string;
}

// Props for the PatientSearch component
export interface PatientSearchProps {
  onPatientSelect?: (patient: PatientResult) => void;
  currentUserRole: UserRole;
  hospitalId?: string;
  className?: string;
  placeholder?: string;
  maxResults?: number;
  showDetailedView?: boolean;
  headerContent?: ReactNode;
  footerContent?: ReactNode;
}

// Error types
export interface PatientSearchError {
  message: string;
  code?: string;
}