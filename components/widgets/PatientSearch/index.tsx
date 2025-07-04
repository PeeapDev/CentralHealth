"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import StableQRScanner from '@/components/qr-scanner/stable-scanner';
import { PatientData } from '@/services/patientService';
import { Patient, PatientSearchProps } from './types';
import styles from './styles.module.css';

/**
 * Patient Search Widget
 * 
 * A comprehensive patient search component with QR scanning capabilities
 * that follows the CentralHealth data handling guidelines.
 */
export default function PatientSearch({
  onPatientSelect,
  fetchPatients,
  fetchPatientByMrn,
  showQrScanner = true,
  enableKeyboardShortcuts = true,
  searchPlaceholder = 'Search patients by name or medical ID...',
  className = ''
}: PatientSearchProps) {
  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
  const [isQrScannerOpenAllowed, setIsQrScannerOpenAllowed] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // References
  const stopScannerRef = useRef<(() => Promise<void>) | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchDebounceRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Handle opening the QR scanner with checks for allowed state
  const handleOpenQrScanner = useCallback(() => {
    if (isQrScannerOpenAllowed) {
      setIsQrScannerOpen(true);
      setIsQrScannerOpenAllowed(false); // Prevent rapid reopening
    } else {
      console.log('QR scanner open not allowed yet, please wait');
    }
  }, [isQrScannerOpenAllowed]);
  
  // Handle closing the QR scanner
  const handleCloseQrScanner = useCallback(() => {
    // Prevent duplicate close operations
    if (!isQrScannerOpenAllowed) {
      console.log('QR scanner already closing, ignoring duplicate close request');
      return;
    }
    
    // First stop the scanner properly
    if (stopScannerRef.current) {
      // Set a timeout to force close in case the stop function hangs
      const forceCloseTimer = setTimeout(() => {
        console.warn('Force closing QR scanner after timeout');
        setIsQrScannerOpen(false);
        stopScannerRef.current = null;
        // Small delay before allowing reopening to prevent rapid cycles
        setTimeout(() => {
          setIsQrScannerOpenAllowed(true);
        }, 2000);
      }, 3000);
      
      stopScannerRef.current()
        .then(() => {
          clearTimeout(forceCloseTimer);
          setIsQrScannerOpen(false);
          stopScannerRef.current = null;
          // Small delay before allowing reopening to prevent rapid cycles
          setTimeout(() => {
            setIsQrScannerOpenAllowed(true);
          }, 2000);
        })
        .catch((err: any) => {
          clearTimeout(forceCloseTimer);
          console.warn('Error stopping QR scanner:', err);
          setIsQrScannerOpen(false);
          stopScannerRef.current = null;
          // Small delay before allowing reopening to prevent rapid cycles
          setTimeout(() => {
            setIsQrScannerOpenAllowed(true);
          }, 2000);
        });
    } else {
      setIsQrScannerOpen(false);
      // Small delay before allowing reopening to prevent rapid cycles
      setTimeout(() => {
        setIsQrScannerOpenAllowed(true);
      }, 2000);
    }
  }, [isQrScannerOpenAllowed]);
  
  // Clean up any running search debounce on unmount
  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    if (!enableKeyboardShortcuts) return;
    
    const handleKeyDown = (event: KeyboardEvent) => {
      // Alt+Q to open QR scanner if allowed
      if (event.altKey && event.key === 'q' && showQrScanner && isQrScannerOpenAllowed) {
        event.preventDefault();
        handleOpenQrScanner();
      }
      
      // Alt+S to focus search input
      if (event.altKey && event.key === 's') {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
      
      // Escape to close QR scanner
      if (event.key === 'Escape' && isQrScannerOpen) {
        event.preventDefault();
        handleCloseQrScanner();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enableKeyboardShortcuts, showQrScanner, isQrScannerOpen, isQrScannerOpenAllowed, handleOpenQrScanner, handleCloseQrScanner]);
  
  // Handle search input change
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setError(null);
    
    // Clear previous timeout
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
    
    // If empty, clear results
    if (!value.trim()) {
      setPatients([]);
      return;
    }
    
    // Debounce search to prevent excessive API calls
    searchDebounceRef.current = setTimeout(async () => {
      if (!fetchPatients) return;
      
      try {
        setIsLoading(true);
        const results = await fetchPatients(value.trim());
        setPatients(results);
      } catch (err) {
        console.error('Error searching patients:', err);
        setError('Failed to search patients');
        setPatients([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);
  }, [fetchPatients]);
  
  // Handle patient selection from search results
  const handlePatientSelect = useCallback((patient: Patient) => {
    if (onPatientSelect) {
      onPatientSelect(patient);
    }
    
    // Clear search after selection
    setSearchTerm('');
    setPatients([]);
  }, [onPatientSelect]);
  
  // Handle QR scan success
  const handleQrScanSuccess = useCallback(async (result: string) => {
    console.log('QR scan result:', result);
    setIsLoading(true);
    setError(null);
    
    try {
      const scannedMrn = result.trim();
      console.log('Processed MRN:', scannedMrn);
      
      // Strict validation of NHS-style medical ID format (5-character alphanumeric)
      if (!scannedMrn || scannedMrn.length !== 5 || !/^[A-Z0-9]{5}$/.test(scannedMrn.toUpperCase())) {
        console.error('Invalid MRN format:', scannedMrn);
        setError('Invalid medical ID format. Please scan a valid QR code.');
        setIsLoading(false);
        return;
      }

      // Verify fetch function exists
      if (!fetchPatientByMrn) {
        console.error('fetchPatientByMrn function is not provided');
        setError('System configuration error: Cannot search by medical ID');
        setIsLoading(false);
        return;
      }

      // Fetch patient by MRN - first try direct function
      console.log('Attempting to fetch patient with MRN:', scannedMrn);
      let patient = await fetchPatientByMrn(scannedMrn);
      console.log('Direct function result:', patient ? 'Patient found' : 'Patient not found');
      
      // If the direct function didn't work, try the API endpoint
      if (!patient) {
        console.log('Direct function failed, trying API endpoint');
        try {
          const apiUrl = `/api/patients/${scannedMrn.toUpperCase()}`;
          console.log('Making API request to:', apiUrl);
          const response = await fetch(apiUrl);
          console.log('API response status:', response.status);
          
          if (response.ok) {
            const data = await response.json() as PatientData;
            console.log('API returned data:', data);
            // Convert from PatientData to the expected Patient format
            patient = {
              id: data.id,
              mrn: data.mrn,
              firstName: data.name.split(' ')[0] || '',
              lastName: data.name.split(' ').slice(1).join(' ') || '',
              dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth).toISOString() : undefined,
              sex: data.gender,
              photo: undefined
            };
            console.log('Converted patient data:', patient);
          } else {
            const errorText = await response.text();
            console.error('API error:', response.status, errorText);
          }
        } catch (apiError) {
          console.error('Error fetching from API:', apiError);
        }
      }
      
      if (patient) {
        // Wait briefly to show success before closing
        setTimeout(() => {
          setIsQrScannerOpen(false);
          handlePatientSelect(patient);
        }, 500);
      } else {
        setError('Patient not found with the scanned ID');
        setIsLoading(false);
      }
    } catch (e) {
      console.error('Error handling QR scan:', e);
      setError('Error processing QR code result');
      setIsLoading(false);
    }
  }, [fetchPatientByMrn, handlePatientSelect]);
  
  // Handle QR scan error
  const handleQrScanError = useCallback((errorMessage: string) => {
    // Only log significant errors, not the normal scanning ones
    // Our stable scanner already filters most common errors
    if (!errorMessage.includes('QR code not found') && 
        !errorMessage.includes('No MultiFormat Readers')) {
      console.warn('QR scan error:', errorMessage);
      setError(`Scanner error: ${errorMessage}`);
    }
  }, []);
  
  // Placeholder for where the functions were moved up
  
  return (
    <div className={`${styles.container} ${className}`}>
      <div className={styles.searchContainer}>
        <input
          ref={searchInputRef}
          type="text"
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder={searchPlaceholder}
          className={styles.searchInput}
          aria-label="Search patients"
        />
        
        {showQrScanner && (
          <button 
            type="button"
            onClick={handleOpenQrScanner}
            className={styles.qrButton}
            aria-label="Scan QR Code"
            title="Scan patient medical ID (Alt+Q)"
            disabled={!isQrScannerOpenAllowed}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <rect x="7" y="7" width="3" height="3"></rect>
              <rect x="14" y="7" width="3" height="3"></rect>
              <rect x="7" y="14" width="3" height="3"></rect>
              <rect x="14" y="14" width="3" height="3"></rect>
            </svg>
          </button>
        )}
      </div>
      
      {isLoading && (
        <div className={styles.loadingIndicator}>
          <div className={styles.spinner}></div>
          <span>Searching...</span>
        </div>
      )}
      
      {error && (
        <div className={styles.error}>
          {error}
          <button 
            onClick={() => setError(null)} 
            className={styles.dismissButton}
            aria-label="Dismiss error"
          >
            &times;
          </button>
        </div>
      )}
      
      {patients.length > 0 && (
        <ul className={styles.results}>
          {patients.map(patient => (
            <li key={patient.id} className={styles.resultItem}>
              <button
                type="button"
                onClick={() => handlePatientSelect(patient)}
                className={styles.resultButton}
              >
                <div className={styles.patientInfo}>
                  <span className={styles.patientName}>
                    {patient.firstName} {patient.lastName}
                  </span>
                  <span className={styles.patientDetails}>
                    {patient.mrn} &middot; {patient.sex} &middot; {patient.dateOfBirth}
                  </span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
      
      {/* QR Scanner Dialog - Only render when needed */}
      {isQrScannerOpen && (
        <Dialog open={isQrScannerOpen} onOpenChange={(open) => {
          // If closing the dialog, enforce a cooldown period
          // to prevent rapid open/close cycles
          if (!open && isQrScannerOpen) {
            setIsQrScannerOpen(false);
            // Block reopening for a short period
            setTimeout(() => {
              setIsQrScannerOpenAllowed(true);
            }, 2000); // 2 second cooldown
          }
        }}>
          <DialogContent>
            <div className={styles.qrScannerContainer}>
              <StableQRScanner
                onScanSuccess={handleQrScanSuccess}
                onClose={handleCloseQrScanner}
                maxWidth={500}
              />
              <div className={styles.scanInstructions}>
                <p>Scan the patient's QR code to select them</p>
                <p>Press ESC or the Close button to exit</p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
