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
    
    if (!searchTerm || searchTerm.trim().length === 0) {
      console.warn('Empty search term provided to searchPatients');
      return [];
    }
    
    // Make API request to our search endpoint with proper error handling
    const encodedSearchTerm = encodeURIComponent(searchTerm.trim());
    const url = `/api/patients/search?search=${encodedSearchTerm}`;
    
    console.log(`Making request to ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Add cache control to prevent stale results
      cache: 'no-cache',
    });

    if (!response.ok) {
      // Get more detailed error information if available
      let errorDetail = response.statusText;
      try {
        const errorData = await response.json();
        if (errorData?.message) {
          errorDetail = errorData.message;
        }
      } catch (parseError) {
        // If we can't parse the error response, just use the status text
      }
      
      console.error('Error searching patients:', response.status, errorDetail);
      throw new Error(`Error searching patients: ${errorDetail}`);
    }

    const data = await response.json();
    
    // Validate response structure
    if (!data.success) {
      console.error('API returned unsuccessful response:', data);
      return [];
    }
    
    // Handle both response formats (data or patients array)
    const patientsArray = Array.isArray(data.data) ? data.data : 
                         Array.isArray(data.patients) ? data.patients : [];
    
    if (patientsArray.length === 0) {
      console.log('No patients found for search term:', searchTerm);
      return [];
    }
    
    // Convert API response to Patient format for the PatientSearch component
    // Ensure mrn is prioritized as the primary medical ID field per CentralHealth policy
    return patientsArray.map((apiPatient: any) => {
      // Ensure we have a valid patient object
      if (!apiPatient || typeof apiPatient !== 'object' || !apiPatient.id) {
        console.warn('Invalid patient object in search results', apiPatient);
        return null;
      }
      
      return {
        id: apiPatient.id || '',
        // CRITICAL: Always prioritize mrn as the primary medical ID per CentralHealth policy
        mrn: apiPatient.mrn || apiPatient.medicalNumber || '',
        firstName: apiPatient.name?.split(' ')[0] || '',
        lastName: apiPatient.name?.split(' ').slice(1).join(' ') || '',
        dateOfBirth: apiPatient.dateOfBirth,
        sex: apiPatient.gender,
        photo: apiPatient.photo || undefined
      };
    }).filter(Boolean); // Remove any null entries
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
