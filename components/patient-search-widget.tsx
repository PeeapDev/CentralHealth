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
    try {
      const response = await fetch(`/api/patients?mrn=${encodeURIComponent(mrn)}`);
      if (!response.ok) throw new Error('Failed to fetch patient by MRN');
      const data = await response.json();
      return data.patients?.[0] || null;
    } catch (error) {
      console.error('Error fetching patient by MRN:', error);
      return null;
    }
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
