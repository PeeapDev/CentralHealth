import { FHIRPatient } from '@/app/[hospitalName]/types/patient';

/**
 * Update a patient record in the database
 * @param patientId The ID of the patient to update
 * @param updateData The data to update
 * @returns The updated patient record
 */
export async function updatePatient(patientId: string, updateData: Partial<FHIRPatient>) {
  try {
    // Make an API call to update the patient record
    const response = await fetch(`/api/patients/${patientId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
      credentials: 'include', // Include cookies for authentication
    });

    if (!response.ok) {
      throw new Error(`Failed to update patient: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating patient:', error);
    return null;
  }
}

/**
 * Get a patient record by ID
 * @param patientId The ID of the patient to get
 * @returns The patient record
 */
export async function getPatient(patientId: string) {
  try {
    // Make an API call to get the patient record
    const response = await fetch(`/api/patients/${patientId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include cookies for authentication
    });

    if (!response.ok) {
      throw new Error(`Failed to get patient: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting patient:', error);
    return null;
  }
}
