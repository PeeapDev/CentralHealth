import { Patient } from '@/components/widgets/PatientSearch/types';
import { PatientData } from '@/services/patientService';

/**
 * Search for patients by name or MRN
 * Returns formatted patients according to the Patient interface expected by the PatientSearch component
 * 
 * Complies with CentralHealth requirements:
 * - Medical IDs follow NHS-style 5-character alphanumeric format
 * - Medical IDs are permanent and stored in the mrn field
 * - No test/mock patients allowed
 */
export async function searchPatients(searchTerm: string): Promise<Patient[]> {
  try {
    console.log('Searching patients with term:', searchTerm);
    
    // Make API request to our search endpoint
    const response = await fetch(`/api/patients/search?search=${encodeURIComponent(searchTerm)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Error searching patients:', response.status, response.statusText);
      throw new Error(`Error searching patients: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.success || !Array.isArray(data.data)) {
      console.error('Invalid search response format:', data);
      return [];
    }
    
    // Convert API response to Patient format for the PatientSearch component
    return data.data.map((apiPatient: any) => ({
      id: apiPatient.id || '',
      mrn: apiPatient.medicalNumber || apiPatient.mrn || '',
      firstName: apiPatient.name?.split(' ')[0] || '',
      lastName: apiPatient.name?.split(' ').slice(1).join(' ') || '',
      dateOfBirth: apiPatient.dateOfBirth,
      sex: apiPatient.gender,
      photo: apiPatient.photo || undefined
    }));
  } catch (error) {
    console.error('Error in searchPatients:', error);
    throw error;
  }
}

/**
 * Fetch a patient by their Medical Record Number (MRN)
 * Follows CentralHealth requirements for MRN validation and patient data handling
 */
export async function fetchPatientByMrn(mrn: string): Promise<Patient | null> {
  try {
    console.log('Fetching patient with MRN:', mrn);
    
    // Validate MRN format (5-character alphanumeric)
    const normalizedMrn = mrn.toUpperCase();
    if (!normalizedMrn || normalizedMrn.length !== 5 || !/^[A-Z0-9]{5}$/.test(normalizedMrn)) {
      console.error('Invalid MRN format:', mrn);
      throw new Error('Invalid medical ID format');
    }
    
    // Make API request to our patient lookup endpoint
    const response = await fetch(`/api/patients/${normalizedMrn}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 404) {
      console.log('Patient not found with MRN:', normalizedMrn);
      return null;
    }

    if (!response.ok) {
      console.error('Error fetching patient:', response.status, response.statusText);
      throw new Error(`Error fetching patient: ${response.statusText}`);
    }

    // Get patient data from response
    const patientData = await response.json() as PatientData;
    console.log('Fetched patient data:', JSON.stringify(patientData, null, 2));
    
    // Convert from PatientData to the Patient format expected by the component
    // While preserving all fields needed for the dialog display
    return {
      id: patientData.id,
      mrn: patientData.mrn,  // Permanent medical ID per CentralHealth policy
      firstName: patientData.name?.split(' ')[0] || '',
      lastName: patientData.name?.split(' ').slice(1).join(' ') || '',
      dateOfBirth: patientData.dateOfBirth ? new Date(patientData.dateOfBirth).toISOString() : undefined,
      sex: patientData.gender,
      // Include profile picture from the correct field
      photo: patientData.profilePicture?.imageUrl,
      // Include User data to ensure we have the full name
      User: patientData.User,
      // Full profile picture object 
      profilePicture: patientData.profilePicture,
      // Include full name for convenience
      fullName: patientData.User?.name || patientData.name || '',
      // Include additional metadata
      onboardingCompleted: patientData.onboardingCompleted,
      lastVisit: patientData.lastVisit,
      nextVisit: patientData.nextVisit,
      note: patientData.note,
      // Original raw data for completeness
      _original: patientData
    };
  } catch (error) {
    console.error('Error in fetchPatientByMrn:', error);
    throw error;
  }
}
