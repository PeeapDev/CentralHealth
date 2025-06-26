"use client"

import * as React from "react"
import { useState, useRef, useEffect, useCallback } from 'react'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { debounce } from 'lodash'
import { FaTimes, FaQrcode, FaEnvelope, FaPhone, FaSearch } from 'react-icons/fa'

// Define types for the html5-qrcode library
declare global {
  interface Window {
    Html5QrcodeScanner: {
      new(elementId: string, config: Html5QrcodeScannerConfig, verbose: boolean): {
        render: (
          onSuccess: (decodedText: string) => void,
          onFailure: (errorMessage: string) => void
        ) => void;
        clear: () => void;
      }
    };
    Html5Qrcode: any;
    qrErrorShown?: boolean;
    lastSKeypress?: number;
    currentScanner?: any;
  }
}

// Type declarations for ProcessedPatient
interface ProcessedPatient {
  id: string;
  mrn?: string; // medical record number (medical ID)
  name: string;
  email?: string;
  phone?: string;
  dob?: string;
  photo?: string; // Patient photo if available
  medicalNumber?: string; // Alias for mrn
  raw?: any; // raw patient data
}

interface PatientSearchWidgetProps {
  onSelect: (patient: ProcessedPatient) => void;
  placeholder?: string;
  createMode?: boolean;
  hospitalId?: string;
  showCameraButton?: boolean;
  className?: string;
}

// Define HTML5QrcodeScanner config type
interface Html5QrcodeScannerConfig {
  fps: number;
  qrbox: { width: number; height: number } | number;
  aspectRatio?: number;
  formatsToSupport?: any[];
  disableFlip?: boolean;
  videoConstraints?: { facingMode: string | { ideal: string } };
  experimentalFeatures?: { useBarCodeDetectorIfSupported: boolean };
  width?: number;
  height?: number;
}

// Main component for patient search
export function PatientSearchWidget(props: PatientSearchWidgetProps) {
  return <PatientSearchWidgetContent {...props} />
}

// Ensure component renders correctly even when parent doesn't have ChakraProvider
function PatientSearchWidgetContent({
  onSelect,
  placeholder = 'Search for patients by name, email, or medical ID...',
  createMode = false,
  hospitalId,
  showCameraButton = true,
  className = ''
}: PatientSearchWidgetProps) {
  // State for input and results
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [showError, setShowError] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [results, setResults] = useState<ProcessedPatient[]>([])
  const [showDropdown, setShowDropdown] = useState(false)

  // State for QR scanner
  const [scannerModalOpen, setScannerModalOpen] = useState(false)
  const [scannerActive, setScannerActive] = useState(false)
  const [scannerLoading, setScannerLoading] = useState(false)
  const [scannerError, setScannerError] = useState('')

  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const scannerRef = useRef<HTMLDivElement>(null)

  // Search by medical ID specifically
  const searchByMedicalId = useCallback((medicalId: string) => {
    if (!medicalId) return;
    
    setLoading(true);
    setShowError(false);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const searchParams = new URLSearchParams({
      medicalId: medicalId.trim()
    });
    
    if (hospitalId) {
      searchParams.append('hospitalId', hospitalId);
    }
    
    fetch(`/api/patients/search?${searchParams.toString()}`, {
      signal: controller.signal
    })
      .then(response => {
        clearTimeout(timeoutId);
        if (!response.ok) {
          throw new Error(`Search failed with status ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        setLoading(false);
        if (Array.isArray(data) && data.length > 0) {
          setResults(data);
          setShowDropdown(true);
          
          if (data.length === 1) {
            handleSelectPatient(data[0]);
          }
        } else {
          setErrorMessage('No patients found with that medical ID');
          setShowError(true);
          setResults([]);
          setShowDropdown(false);
        }
      })
      .catch(error => {
        clearTimeout(timeoutId);
        console.error('Error searching for patient by medical ID:', error);
        setErrorMessage('Error searching for patient');
        setShowError(true);
        setResults([]);
        setShowDropdown(false);
        setLoading(false);
      });
  }, [hospitalId]);

  // Handle selection of a patient
  const handleSelectPatient = useCallback((patient: ProcessedPatient) => {
    onSelect(patient);
    setResults([]);
    setShowDropdown(false);
    setQuery('');
    
    // Provide visual feedback
    if (inputRef.current) {
      inputRef.current.blur();
    }
  }, [onSelect]);

  // Search for patients by name, email, or medical ID
  const searchPatient = useCallback((searchTerm: string) => {
    setLoading(true);
    setShowError(false);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const searchParams = new URLSearchParams({ searchTerm });
    
    if (hospitalId) {
      searchParams.append('hospitalId', hospitalId);
    }
    
    fetch(`/api/patients/search?${searchParams.toString()}`, {
      signal: controller.signal
    })
      .then(response => {
        clearTimeout(timeoutId);
        if (!response.ok) {
          throw new Error(`Search failed with status ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        setLoading(false);
        if (Array.isArray(data) && data.length > 0) {
          setResults(data);
          setShowDropdown(true);
        } else {
          setResults([]);
          setShowDropdown(false);
        }
      })
      .catch(error => {
        clearTimeout(timeoutId);
        console.error('Error searching for patients:', error);
        setErrorMessage('Error searching for patients');
        setShowError(true);
        setResults([]);
        setShowDropdown(false);
        setLoading(false);
      });
  }, [hospitalId]);

  // Create debounced search function
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      if (query.trim().length >= 2) {
        searchPatient(query);
      } else {
        setResults([]);
        setShowDropdown(false);
      }
    }, 300),
    [searchPatient]
  );

  // Handle input changes
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setShowError(false);
    
    if (value.trim().length >= 2) {
      debouncedSearch(value);
    } else {
      setResults([]);
      setShowDropdown(false);
    }
  }, [debouncedSearch]);

  // Load the html5-qrcode library dynamically
  const loadQrLibrary = useCallback((): Promise<void> => {
    return new Promise<void>((resolve, reject) => {
      // Check if library is already loaded
      if (window.Html5QrcodeScanner) {
        resolve();
        return;
      }
      
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => {
        reject(new Error('Failed to load QR scanner library'));
      };
      
      document.head.appendChild(script);
    });
  }, []);
  
  // Clean up the scanner to prevent memory leaks
  const cleanupScanner = useCallback(() => {
    try {
      if (window.currentScanner) {
        window.currentScanner.clear();
        window.currentScanner = undefined;
      }
      
      // Remove any QR scanner HTML elements
      const scannerElement = document.getElementById('qr-reader');
      if (scannerElement) {
        while (scannerElement.firstChild) {
          scannerElement.removeChild(scannerElement.firstChild);
        }
      }
    } catch (error) {
      console.error('Error cleaning up scanner:', error);
    }
  }, []);
  
  // Initialize the QR scanner
  const initializeScanner = useCallback(() => {
    setScannerLoading(true);
    setScannerError('');
    
    // Load the QR scanner library
    loadQrLibrary()
      .then(() => {
        if (!scannerRef.current) return;
        
        try {
          // Clean up any existing scanner
          cleanupScanner();
          
          const config: Html5QrcodeScannerConfig = {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1,
            disableFlip: false,
            videoConstraints: { facingMode: 'environment' }
          };
          
          // Create a new scanner instance
          const scanner = new window.Html5QrcodeScanner(
            'qr-reader',
            config,
            /* verbose */ false
          );
          
          // Store scanner instance in window for cleanup
          window.currentScanner = scanner;
          
          // Start scanning
          scanner.render(
            (decodedText: string) => {
              console.log('QR Code detected:', decodedText);
              // Handle successful scan
              cleanupScanner();
              setScannerModalOpen(false);
              setScannerActive(false);
              
              // Try to process the QR code as a medical ID
              searchByMedicalId(decodedText);
            },
            (errorMessage: string) => {
              // Handle scan error (continue scanning)
              console.log('QR scan error:', errorMessage);
            }
          );
          
          setScannerLoading(false);
          setScannerActive(true);
        } catch (error) {
          console.error('Error initializing scanner:', error);
          setScannerError('Failed to initialize camera. Make sure you have granted camera permissions.');
          setScannerLoading(false);
        }
      })
      .catch((error) => {
        console.error('QR library load error:', error);
        setScannerError('Failed to load QR scanner. Please try again.');
        setScannerLoading(false);
      });
  }, [loadQrLibrary, cleanupScanner, searchByMedicalId]);
  
  // Handle opening the QR scanner modal
  const handleOpenScanner = useCallback(() => {
    setScannerModalOpen(true);
    setScannerLoading(true);
    setScannerError('');
    
    // Use timeout to ensure modal is rendered before initializing
    setTimeout(() => {
      initializeScanner();
    }, 300);
  }, [initializeScanner]);
  
  // Handle closing the QR scanner modal
  const handleCloseScanner = useCallback(() => {
    cleanupScanner();
    setScannerModalOpen(false);
    setScannerActive(false);
  }, [cleanupScanner]);

  // Handle clicks outside the dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Clean up QR scanner on unmount
  useEffect(() => {
    return () => {
      cleanupScanner();
    };
  }, [cleanupScanner]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Open QR scanner on Alt+S
      if (e.altKey && e.key === 's' && showCameraButton) {
        e.preventDefault();
        handleOpenScanner();
      }
      
      // Close QR scanner on Escape
      if (e.key === 'Escape' && scannerModalOpen) {
        e.preventDefault();
        handleCloseScanner();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [scannerModalOpen, handleOpenScanner, handleCloseScanner, showCameraButton]);

  return (
    <div className={`relative ${className}`}>
      {/* Search input */}
      <div className="flex items-center">
        <div className="relative flex-grow">
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            <FaSearch size={16} />
          </div>
          <Input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            className="pl-10 pr-10"
            value={query}
            onChange={handleInputChange}
            onFocus={() => results.length > 0 && setShowDropdown(true)}
          />
          {(query || loading) && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {loading ? (
                <Spinner size="sm" />
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    setResults([]);
                    setShowDropdown(false);
                    setShowError(false);
                    inputRef.current?.focus();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimes size={16} />
                </button>
              )}
            </div>
          )}
        </div>
        
        {/* QR scanner button */}
        {showCameraButton && (
          <Button
            type="button"
            onClick={handleOpenScanner}
            className="ml-2"
            aria-label="Scan QR Code"
            title="Scan QR Code (Alt+S)"
            variant="outline"
          >
            <FaQrcode size={16} />
          </Button>
        )}
      </div>
      
      {/* Error message */}
      {showError && (
        <div className="text-red-500 text-sm mt-1">{errorMessage}</div>
      )}
      
      {/* Results dropdown */}
      {showDropdown && results.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-10 w-full mt-1 bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-y-auto"
        >
          {results.map((patient) => (
            <div
              key={patient.id}
              onClick={() => handleSelectPatient(patient)}
              className="p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
            >
              <div className="font-medium">{patient.name}</div>
              <div className="flex text-sm text-gray-500 mt-1 flex-wrap gap-x-3">
                {patient.mrn && (
                  <div className="flex items-center space-x-1">
                    <span className="font-mono uppercase">{patient.mrn}</span>
                  </div>
                )}
                {patient.email && (
                  <div className="flex items-center space-x-1">
                    <FaEnvelope size={12} />
                    <span>{patient.email}</span>
                  </div>
                )}
                {patient.phone && (
                  <div className="flex items-center space-x-1">
                    <FaPhone size={12} />
                    <span>{patient.phone}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* QR scanner modal */}
      {scannerModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Scan QR Code</h3>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleCloseScanner}
                className="p-1"
              >
                <FaTimes size={16} />
              </Button>
            </div>
            
            {scannerLoading ? (
              <div className="flex flex-col items-center justify-center p-8">
                <Spinner />
                <p className="mt-4">Loading QR scanner...</p>
              </div>
            ) : scannerError ? (
              <div className="text-center p-8">
                <p className="text-red-500 mb-4">{scannerError}</p>
                <Button onClick={initializeScanner}>Retry</Button>
              </div>
            ) : (
              <div className="p-4">
                <div id="qr-reader" ref={scannerRef} className="w-full h-64" />
                <p className="text-xs text-gray-500 text-center mt-2">Position the QR code within the frame</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}