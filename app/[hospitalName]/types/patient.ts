/**
 * FHIR Patient interface
 * Defines the structure of patient data in the hospital system
 */
export interface FHIRPatient {
  id: string;
  resourceType: string;
  medicalNumber?: string;
  mrn?: string;           // Medical Record Number (alternative to medicalNumber)
  medicalId?: string;     // Another alternative name for medical number
  patientId?: string;     // Often used as alias for id
  active: boolean;
  name?: Array<{
    text?: string;
    family?: string;
    given?: string[];
  }> | string;
  telecom?: Array<{
    system: string;
    value: string;
    use?: string;
  }> | string;
  gender?: string;
  birthDate?: string;
  dateOfBirth?: Date;    // Alternative date format
  address?: Array<{
    line?: string[];
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  }> | string;
  photo?: string;
  email?: string;
  phoneNumber?: string;
  phone?: string;        // Alternative for phoneNumber
  hospitalId?: string;
  hospitalName?: string;
  hospital?: {
    name: string;
    subdomain: string;
    id?: string;
  };
  
  // User relationship
  user?: {
    id?: string;
    email?: string;
    name?: string;
    photo?: string;
  };
  
  // FHIR extension data
  extension?: string | any;
  medicalHistory?: any;
  contact?: any;
  
  // Extended fields for onboarding wizard
  bloodGroup?: string;
  allergies?: string[];
  chronicConditions?: string[];
  organDonor?: boolean;
  
  // Emergency contact information
  emergencyContact?: {
    name: string;
    relationship: string;
    phoneNumber: string;
  };
  
  // Additional patient details
  firstName?: string;
  lastName?: string;
  fullName?: string;
  displayName?: string;
  
  // Registration and onboarding status
  onboardingCompleted?: boolean;
  registrationDate?: string;
  qrCode?: string; // URL or base64 encoded QR code
  
  // Timestamps
  createdAt?: Date;
  updatedAt?: Date;
}
