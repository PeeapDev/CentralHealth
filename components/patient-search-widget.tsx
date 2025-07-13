
"use client";

import React from 'react';
import PatientSearch from '@/components/widgets/PatientSearch';
import { Patient } from '@/components/widgets/PatientSearch/types';

// This is an adapter component that wraps the PatientSearch component
// to match the interface expected by the antenatal module
export function PatientSearchWidget({
  onSelect,
  placeholder = 'Search patients by name or medical ID...',
  className = '',
  hospitalId,
  showCameraButton = true
}: {
  onSelect: (patient: any) => void;
  placeholder?: string;
  className?: string;
  hospitalId?: string;
  showCameraButton?: boolean;
}) {
  // Define the fetchPatients function that will be passed to PatientSearch
  const fetchPatients = async (searchTerm: string) => {
    try {
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await fetch(`/api/patients?q=${encodeURIComponent(searchTerm)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        cache: 'no-store',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) throw new Error(`Failed to fetch patients: ${response.status}`);
      const data = await response.json();
      console.log('Search results:', data.patients?.length || 0, 'patients found');
      return data.patients || [];
    } catch (error) {
      console.error('Error fetching patients:', error);
      return [];
    }
  };

  // Define the fetchPatientByMrn function that will be passed to PatientSearch
  const fetchPatientByMrn = async (mrn: string) => {
    console.log('Fetching patient by MRN:', mrn);
    
    // Clean up the MRN to handle various formats
    const cleanMrn = mrn.trim().toUpperCase();
    console.log('Cleaned MRN:', cleanMrn);
    
    try {
      // Use a Promise.race with timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
      
      // Try the most direct endpoint first - optimized for speed
      const directEndpoint = `/api/patients/${encodeURIComponent(cleanMrn)}`;
      console.log(`Direct fetch from: ${directEndpoint}`);
      
      const response = await fetch(directEndpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'X-Priority': 'high'
        },
        cache: 'no-store',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      console.log(`Response status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Patient data found:', data);
        
        // Extract patient from various response formats
        const patient = data.patient || 
                      (data.patients?.[0]) || 
                      (Array.isArray(data) && data[0]) || 
                      (data.id ? data : null);
                      
        if (patient) {
          console.log('Returning patient data immediately');
          return patient;
        }
      }
      
      // If the direct fetch failed, try fallback endpoint
      console.log('Direct fetch failed, trying fallback');
      const fallbackEndpoint = `/api/patients?mrn=${encodeURIComponent(cleanMrn)}`;
      
      const fallbackController = new AbortController();
      const fallbackTimeoutId = setTimeout(() => fallbackController.abort(), 3000);
      
      const fallbackResponse = await fetch(fallbackEndpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'X-Priority': 'high'
        },
        cache: 'no-store',
        signal: fallbackController.signal
      });
      
      clearTimeout(fallbackTimeoutId);
      
      if (fallbackResponse.ok) {
        const data = await fallbackResponse.json();
        if (data.patients?.[0]) return data.patients[0];
        if (data.patient) return data.patient;
        if (Array.isArray(data) && data[0]) return data[0];
      }
    } catch (error) {
      console.error(`Patient fetch failed:`, error);
    }
    
    console.error('All attempts to fetch patient by MRN failed');
    return null;
  };

  // Handle the patient selection, ensuring the data format is consistent
  const handlePatientSelect = (patient: Patient) => {
    // Immediately convert and pass patient data to the registration flow
    console.log('Patient selected - immediately processing:', patient.id);
    
    // Adapt the patient data to match the expected interface
    const patientAny = patient as any; // Type assertion for accessing various possible fields
    const adaptedPatient = {
      id: patient.id,
      // Always use mrn as primary medical ID per CentralHealth requirements
      mrn: patientAny.mrn || '',
      medicalNumber: patientAny.mrn || patientAny.medicalNumber || '',
      name: typeof patientAny.name === 'string' 
        ? patientAny.name 
        : patientAny.fullName || patientAny.displayName || 'Unknown Patient',
      email: patientAny.email || '',
      photo: patientAny.photo || patientAny.avatarUrl || '',
      phone: patientAny.phone || ''
    };
    
    // Save to localStorage for quick access in antenatal flow
    try {
      localStorage.setItem('selectedAntenatalPatient', JSON.stringify(adaptedPatient));
      console.log('Patient data saved to localStorage');
    } catch (e) {
      console.error('Error saving patient to localStorage:', e);
    }
    
    // Call the onSelect callback immediately to start the antenatal registration flow
    console.log('Immediately starting antenatal registration flow');
    setTimeout(() => {
      onSelect(adaptedPatient);
    }, 0);
  };

  // Add a useEffect to check for selectedAntenatalPatient in localStorage on component mount
  React.useEffect(() => {
    try {
      const savedPatient = localStorage.getItem('selectedAntenatalPatient');
      if (savedPatient) {
        console.log('Found saved patient in localStorage, checking if we should auto-select');
        const patientData = JSON.parse(savedPatient);
        
        // Only auto-select if this component just mounted (within last 2 seconds)
        const mountTime = (window as any).__patientSearchMountTime;
        if (mountTime && (Date.now() - mountTime < 2000)) {
          console.log('Auto-selecting saved patient');
          onSelect(patientData);
          localStorage.removeItem('selectedAntenatalPatient'); // Clear after use
        }
      }
    } catch (e) {
      console.error('Error checking localStorage for patient:', e);
    }
    
    // Mark mount time
    (window as any).__patientSearchMountTime = Date.now();
  }, []);
  
  return (
    <PatientSearch
      onPatientSelect={handlePatientSelect}
      fetchPatients={fetchPatients}
      fetchPatientByMrn={fetchPatientByMrn}
      showQrScanner={showCameraButton}
      enableKeyboardShortcuts={true}
      searchPlaceholder={placeholder}
      className={className}
    />
  );
}

export default PatientSearchWidget;