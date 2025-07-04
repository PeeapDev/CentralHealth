"use client";

import React from 'react';
import PatientSearch from './PatientSearch';
import { Patient } from './PatientSearch/types';
import { fetchPatientByMrn, searchPatients } from '@/lib/api-client/patientSearch';

interface ConnectedPatientSearchProps {
  onPatientSelect?: (patient: Patient) => void;
  showQrScanner?: boolean;
  enableKeyboardShortcuts?: boolean;
  searchPlaceholder?: string;
  className?: string;
}

/**
 * ConnectedPatientSearch component that connects the PatientSearch UI
 * to the database via our API client functions.
 * 
 * Provides both search functionality and QR scanning capabilities,
 * both connected to the same patient database following CentralHealth requirements.
 */
export default function ConnectedPatientSearch({
  onPatientSelect,
  showQrScanner = true,
  enableKeyboardShortcuts = true,
  searchPlaceholder = "Search patients...",
  className,
}: ConnectedPatientSearchProps) {
  
  const handlePatientSelect = (patient: Patient) => {
    console.log('Patient selected:', patient);
    if (onPatientSelect) {
      onPatientSelect(patient);
    }
  };

  return (
    <PatientSearch
      fetchPatients={searchPatients}
      fetchPatientByMrn={fetchPatientByMrn}
      onPatientSelect={handlePatientSelect}
      showQrScanner={showQrScanner}
      enableKeyboardShortcuts={enableKeyboardShortcuts}
      searchPlaceholder={searchPlaceholder}
      className={className}
    />
  );
}
