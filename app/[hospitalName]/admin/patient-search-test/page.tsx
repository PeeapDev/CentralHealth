"use client";

import React, { useState } from 'react';
import ConnectedPatientSearch from '@/components/widgets/ConnectedPatientSearch';
import { Patient } from '@/components/widgets/PatientSearch/types';
import { PatientQRDisplay } from '@/components/patients/patient-qr-display';
import styles from './styles.module.css';

// Mock patient data for demonstration only
// Note: In production, this would be replaced with real patient data from the database
const mockPatients: Patient[] = [
  {
    id: '1',
    mrn: 'ABC23',
    firstName: 'John',
    lastName: 'Smith',
    dateOfBirth: '1985-03-15',
    sex: 'M'
  },
  {
    id: '2',
    mrn: 'DEF45',
    firstName: 'Emma',
    lastName: 'Johnson',
    dateOfBirth: '1990-11-22',
    sex: 'F'
  },
  {
    id: '3',
    mrn: 'GHJ67',
    firstName: 'Michael',
    lastName: 'Brown',
    dateOfBirth: '1978-06-30',
    sex: 'M'
  }
];

/**
 * Patient Search Test Page
 * 
 * This page demonstrates the integration of the Patient Search widget with QR scanning capabilities.
 */
export default function PatientSearchTestPage() {
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  // Mock search function - in production this would query the database
  const handlePatientSearch = async (searchTerm: string): Promise<Patient[]> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Simple filter for demonstration
    return mockPatients.filter(patient => 
      patient.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.mrn.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // Mock lookup function for QR code scans - in production this would query the database
  const handlePatientLookupByMrn = async (mrn: string): Promise<Patient | null> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Find patient by medical ID
    const patient = mockPatients.find(p => 
      p.mrn.toLowerCase() === mrn.toLowerCase()
    );
    
    return patient || null;
  };

  // Handle patient selection
  const handlePatientSelect = (patient: Patient) => {
    console.log('Selected patient:', patient);
    setSelectedPatient(patient);
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Patient Search with QR Scanner</h1>
      <div className={styles.description}>
        <p>This page demonstrates the new QR scanner integration with the patient search widget.</p>
        <p><strong>Features:</strong></p>
        <ul>
          <li>Search patients by name or medical ID</li>
          <li>Scan patient medical IDs via QR code</li>
          <li>Keyboard shortcuts: Alt+Q to open scanner, Alt+S to focus search</li>
        </ul>
      </div>

      <div className={styles.searchSection}>
        <h2>Patient Search</h2>
        <ConnectedPatientSearch
          onPatientSelect={handlePatientSelect}
          showQrScanner={true}
          enableKeyboardShortcuts={true}
        />
      </div>

      {selectedPatient && (
        <div className={styles.patientInfo}>
          <h2>Selected Patient</h2>
          <div className={styles.patientCard}>
            <div className={styles.patientDetails}>
              <div className={styles.patientName}>
                {selectedPatient.firstName} {selectedPatient.lastName}
              </div>
              <div className={styles.patientMeta}>
                <div><strong>Medical ID:</strong> {selectedPatient.mrn}</div>
                <div><strong>Date of Birth:</strong> {selectedPatient.dateOfBirth}</div>
                <div><strong>Sex:</strong> {selectedPatient.sex}</div>
              </div>
            </div>
            
            <div className={styles.qrSection}>
              <h3>Patient QR Code</h3>
              <div className={styles.qrCode}>
                <PatientQRDisplay 
                  medicalNumber={selectedPatient.mrn}
                  firstName={selectedPatient.firstName}
                  lastName={selectedPatient.lastName}
                  size={150}
                />
              </div>
              <div className={styles.qrNote}>
                <p>Scan this QR code to quickly look up this patient</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className={styles.instructions}>
        <h2>Implementation Notes</h2>
        <ul>
          <li>QR scanner component has been completely rebuilt from scratch</li>
          <li>Camera lifecycle is now properly managed to prevent conflicts</li>
          <li>Camera resources are properly released when component unmounts</li>
          <li>Robust error handling and retry functionality is included</li>
          <li>Camera toggle button appears when multiple cameras are available</li>
          <li>Global state prevents multiple scanner instances from conflicting</li>
        </ul>
      </div>
    </div>
  );
}
