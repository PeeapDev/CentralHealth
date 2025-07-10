"use client";

import React from 'react';
import PatientSearch from '@/components/widgets/PatientSearch';
import { Patient } from '@/components/widgets/PatientSearch/types';

// This is an adapter component that wraps the PatientSearch component
// to match the interface expected by the antenatal module
export function PatientSearchWidget({
  onSelect,
  placeholder = 'Search patients by name or medical ID...',
  className = ''
}: {
  onSelect: (patient: any) => void;
  placeholder?: string;
  className?: string;
}) {
  // Define the fetchPatients function that will be passed to PatientSearch
  const fetchPatients = async (searchTerm: string) => {
    try {
      const response = await fetch(`/api/patients?q=${encodeURIComponent(searchTerm)}`);
      if (!response.ok) throw new Error('Failed to fetch patients');
      const data = await response.json();
      return data.patients || [];
    } catch (error) {
      console.error('Error fetching patients:', error);
      return [];
    }
  };

  // Define the fetchPatientByMrn function that will be passed to PatientSearch
  const fetchPatientByMrn = async (mrn: string) => {
    console.log('Fetching patient by MRN:', mrn);
    let attempts = 0;
    const maxAttempts = 3;
    
    // Clean up the MRN to handle various formats
    const cleanMrn = mrn.trim().toUpperCase();
    console.log('Cleaned MRN:', cleanMrn);
    
    while (attempts < maxAttempts) {
      try {
        attempts++;
        console.log(`Attempt ${attempts} to fetch patient with MRN: ${cleanMrn}`);
        
        // Try different API endpoints to maximize chance of success
        let endpoints = [
          `/api/patients?mrn=${encodeURIComponent(cleanMrn)}`,
          `/api/patients/${encodeURIComponent(cleanMrn)}`,
          `/api/v1/patients?mrn=${encodeURIComponent(cleanMrn)}`
        ];
        
        // Try each endpoint until one succeeds
        for (const endpoint of endpoints) {
          try {
            console.log(`Trying endpoint: ${endpoint}`);
            const response = await fetch(endpoint, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
              },
              cache: 'no-store'
            });
            
            console.log(`Response status: ${response.status}`);
            
            if (response.ok) {
              const data = await response.json();
              console.log('Patient data found:', data);
              if (data.patients?.[0]) {
                return data.patients[0];
              } else if (data.patient) {
                return data.patient;
              } else if (Array.isArray(data) && data[0]) {
                return data[0];
              }
            }
          } catch (endpointError) {
            console.warn(`Error with endpoint ${endpoint}:`, endpointError);
            // Continue to next endpoint
          }
        }
        
        // Wait before retrying
        if (attempts < maxAttempts) {
          console.log(`Waiting before retry attempt ${attempts + 1}...`);
          await new Promise(resolve => setTimeout(resolve, 500 * attempts));
        }
      } catch (error) {
        console.error(`Attempt ${attempts} failed:`, error);
        if (attempts >= maxAttempts) break;
        await new Promise(resolve => setTimeout(resolve, 500 * attempts));
      }
    }
    
    console.error('All attempts to fetch patient by MRN failed');
    return null;
  };

  // Handle the patient selection, ensuring the data format is consistent
  const handlePatientSelect = (patient: Patient) => {
    // Adapt the patient data to match the expected interface
    const patientAny = patient as any; // Type assertion for accessing various possible fields
    const adaptedPatient = {
      id: patient.id,
      medicalNumber: patientAny.medicalNumber || patientAny.mrn || '',
      name: typeof patientAny.name === 'string' 
        ? patientAny.name 
        : patientAny.fullName || patientAny.displayName || 'Unknown Patient',
      email: patientAny.email || '',
      photo: patientAny.photo || patientAny.avatarUrl || '',
      phone: patientAny.phone || ''
    };
    
    onSelect(adaptedPatient);
  };

  return (
    <PatientSearch
      onPatientSelect={handlePatientSelect}
      fetchPatients={fetchPatients}
      fetchPatientByMrn={fetchPatientByMrn}
      showQrScanner={true}
      enableKeyboardShortcuts={true}
      searchPlaceholder={placeholder}
      className={className}
    />
  );
}

export default PatientSearchWidget;
