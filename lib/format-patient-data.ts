// Helper functions for formatting FHIR patient data consistently across the application

// FHIR-compliant type definitions
export interface FHIRHumanName {
  use?: string;
  text?: string;
  family?: string;
  given?: string[];
  prefix?: string[];
  suffix?: string[];
}

export interface FHIRContactPoint {
  system: string;
  value: string;
  use?: string;
  rank?: number;
  period?: {
    start?: string;
    end?: string;
  };
}

export interface FHIRAddress {
  use?: string;
  type?: string;
  text?: string;
  line?: string[];
  city?: string;
  district?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface FHIRPatient {
  id: string;
  resourceType: string;
  medicalNumber: string;
  active: boolean;
  name: FHIRHumanName[] | string;
  telecom?: FHIRContactPoint[] | string;
  gender?: string;
  birthDate?: string;
  address?: FHIRAddress[] | string;
  contact?: any;
  communication?: any;
  email?: string;
  hospitalId?: string;
  hospitalName?: string;
  extension?: string | any;
  medicalHistory?: string | any;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}

export interface MedicalRecord {
  id: string;
  resourceType: string;
  status: string;
  code: string;
  subject: string;
  encounter?: string;
  effectiveDateTime: string;
  issued: string;
  performer: string;
  valueString?: string;
  valueQuantity?: {
    value: number;
    unit: string;
    system: string;
    code: string;
  };
  bodySite?: string;
  method?: string;
  device?: string;
  referenceRange?: any;
  interpretation?: string;
  note?: string;
  patientId: string;
  hospitalId: string;
  hospitalName: string;
  createdAt: string;
  updatedAt: string;
}

export interface PatientVisit {
  id: string;
  date: string;
  hospitalId: string;
  hospitalName: string;
  department: string;
  provider: string;
  diagnosis: string;
  status: string;
}

// Helper function to format FHIR name
export function formatFhirName(nameObj: any): string {
  try {
    if (!nameObj) return "Unknown";
    
    // Parse the name object if it's a string
    const nameData = typeof nameObj === 'string' ? JSON.parse(nameObj) : nameObj;
    
    // Use the text representation if available
    if (nameData.text) return nameData.text;
    
    // Try to get from given and family name
    if (Array.isArray(nameData)) {
      // Use the first name in the array
      const firstNameObj = nameData[0];
      
      // Return text if available
      if (firstNameObj.text) return firstNameObj.text;
      
      // Construct from given and family
      const given = firstNameObj.given ? firstNameObj.given.join(' ') : '';
      const family = firstNameObj.family || '';
      
      if (given || family) {
        return `${given} ${family}`.trim();
      }
    } else {
      // If it's a single name object
      const given = nameData.given ? nameData.given.join(' ') : '';
      const family = nameData.family || '';
      
      if (given || family) {
        return `${given} ${family}`.trim();
      }
    }
    
    return "Unknown";
  } catch (e) {
    console.error("Error parsing name:", e);
    return "Unknown";
  }
}

// Helper function to get initials
export function getPatientInitials(nameObj: any): string {
  const name = formatFhirName(nameObj);
  return name.split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase().substring(0, 2) || '??';
}

// Helper function to calculate age
export function calculateAge(birthDateStr: string): number {
  if (!birthDateStr) return 0;
  
  const birthDate = new Date(birthDateStr);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}

// Helper function to get contact info
export function getContactInfo(telecom: any): { phone: string, email: string } {
  let phone = '';
  let email = '';
  
  try {
    if (!telecom) return { phone, email };
    
    // Parse the telecom if it's a string
    const telecomData = typeof telecom === 'string' ? JSON.parse(telecom) : telecom;
    
    if (Array.isArray(telecomData)) {
      // Find phone
      const phoneContact = telecomData.find((t: any) => t.system === 'phone');
      if (phoneContact) phone = phoneContact.value;
      
      // Find email
      const emailContact = telecomData.find((t: any) => t.system === 'email');
      if (emailContact) email = emailContact.value;
    }
    
    return { phone, email };
  } catch (e) {
    console.error("Error parsing contact info:", e);
    return { phone, email };
  }
}

// Helper function to get address
export function getFormattedAddress(address: any): string {
  try {
    if (!address) return '';
    
    // Parse the address if it's a string
    const addressData = typeof address === 'string' ? JSON.parse(address) : address;
    
    if (Array.isArray(addressData) && addressData.length > 0) {
      const addr = addressData[0];
      
      // Return text representation if available
      if (addr.text) return addr.text;
      
      // Construct address from components
      const lines = addr.line ? addr.line.join(', ') : '';
      const city = addr.city ? addr.city : '';
      const state = addr.state ? addr.state : '';
      const postalCode = addr.postalCode ? addr.postalCode : '';
      const country = addr.country ? addr.country : '';
      
      return [lines, city, state, postalCode, country]
        .filter(Boolean)
        .join(', ');
    } else if (typeof addressData === 'object') {
      // If it's a single address object
      // Return text representation if available
      if (addressData.text) return addressData.text;
      
      // Construct address from components
      const lines = addressData.line ? addressData.line.join(', ') : '';
      const city = addressData.city ? addressData.city : '';
      const state = addressData.state ? addressData.state : '';
      const postalCode = addressData.postalCode ? addressData.postalCode : '';
      const country = addressData.country ? addressData.country : '';
      
      return [lines, city, state, postalCode, country]
        .filter(Boolean)
        .join(', ');
    }
    
    return '';
  } catch (e) {
    console.error("Error parsing address:", e);
    return '';
  }
}

// Format dates for display
export function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

// Define types for extension and medical history data
interface ExtensionData {
  bloodGroup?: string;
  medicalId?: string;
  onboardingCompleted?: boolean;
  qrCode?: string;
  userId?: string;
  [key: string]: any;
}

interface MedicalHistoryData {
  allergies?: string[];
  chronicConditions?: string[];
  organDonor?: boolean;
  [key: string]: any;
}

// Extract medical information
export function extractMedicalInfo(patientData: any): { 
  allergies: string[],
  chronicConditions: string[],
  bloodGroup: string, 
  organDonor: boolean,
  medicalId: string | undefined
} {
  let allergies: string[] = [];
  let chronicConditions: string[] = [];
  let bloodGroup = '';
  let organDonor = false;
  let medicalId: string | undefined;

  try {
    // Extract extension data
    let extensionData: ExtensionData = {};
    if (patientData?.extension) {
      if (typeof patientData.extension === 'string') {
        extensionData = JSON.parse(patientData.extension) as ExtensionData;
      } else {
        extensionData = patientData.extension as ExtensionData;
      }
      
      bloodGroup = extensionData.bloodGroup || '';
      medicalId = extensionData.medicalId;
    }

    // Extract medical history data
    let medicalHistoryData: MedicalHistoryData = {};
    if (patientData?.medicalHistory) {
      if (typeof patientData.medicalHistory === 'string') {
        medicalHistoryData = JSON.parse(patientData.medicalHistory) as MedicalHistoryData;
      } else {
        medicalHistoryData = patientData.medicalHistory as MedicalHistoryData;
      }

      allergies = medicalHistoryData.allergies || [];
      chronicConditions = medicalHistoryData.chronicConditions || [];
      organDonor = !!medicalHistoryData.organDonor;
    }
  } catch (e) {
    console.error("Error extracting medical info:", e);
  }

  return { allergies, chronicConditions, bloodGroup, organDonor, medicalId };
}
