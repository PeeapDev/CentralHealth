/**
 * Patient Profile Type Definitions
 * 
 * Centralized type definitions for patient data across the application.
 * Ensures consistency in data structure and validation.
 */

export interface PatientProfile {
  id: string;
  mrn: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string | Date;
  gender?: string;
  email?: string;
  phone?: string;
  address?: string;
  photo?: string;
  user?: {
    id: string;
    photo?: string;
    email?: string;
  };
  User?: {
    id: string;
    photo?: string;
    email?: string;
  };
  contact?: string | {
    email?: string;
    phone?: string;
    telecom?: Array<{
      system?: string;
      value?: string;
    }>;
  };
  medicalHistory?: string | {
    allergies?: string[] | any[];
    conditions?: string[] | any[];
    medications?: string[] | any[];
    isPregnant?: boolean;
    recentBirth?: boolean;
    gestationalAge?: number;
    lastMenstrualPeriod?: string;
    dueDate?: string;
  };
  registrationData?: string | any;
  createdAt?: string;
  updatedAt?: string;
  onboardingCompleted?: boolean;
  specializedCareSettings?: string | {
    showMaternalCare?: boolean;
    autoShowBasedOnStatus?: boolean;
  };
}
