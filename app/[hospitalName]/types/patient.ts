/**
 * FHIR Patient interface
 * Defines the structure of patient data in the hospital system
 */
export interface FHIRPatient {
  id: string;
  resourceType: string;
  medicalNumber?: string;
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
  hospitalId?: string;
  hospitalName?: string;
  hospital?: {
    name: string;
    subdomain: string;
    id?: string;
  };
  
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
  
  // Registration and onboarding status
  onboardingCompleted?: boolean;
  registrationDate?: string;
  qrCode?: string; // URL or base64 encoded QR code
}
