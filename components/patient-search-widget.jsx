"use client"

import * as React from "react"
import { useState, useRef, useEffect, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Loader2, Camera, X } from "lucide-react"
import { debounce } from "lodash"
import dynamic from "next/dynamic"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'

// No TypeScript global declarations in JSX

// No TypeScript interfaces in JSX
let Html5QrcodeScannerClass = null;
let Html5QrcodeSupportedFormats = null;

// Dummy component for dynamic import
const QrScannerComponent = ({ elementId }) => {
  return <div id={elementId} />;
};

// Helper function to load QR scanner library
const isCameraSupported = async () => {
  if (typeof window !== 'undefined' && !window.Html5QrcodeScanner) {
    try {
      const module = await import('html5-qrcode');
      // Assign to global window object for easier access
      window.Html5QrcodeScanner = module.Html5QrcodeScanner;
      window.Html5QrcodeSupportedFormats = module.Html5QrcodeSupportedFormats;
      window.Html5Qrcode = module.Html5Qrcode;
      
      Html5QrcodeScannerClass = module.Html5QrcodeScanner;
      Html5QrcodeSupportedFormats = module.Html5QrcodeSupportedFormats || {};
      
      console.log('QR scanner library loaded successfully');
      return true;
    } catch (error) {
      console.error('Failed to load QR scanner library:', error);
      return false;
    }
  }
  return !!window.Html5QrcodeScanner; // Return true if already loaded
};

// Dynamically import QR scanner with no SSR to prevent chunk load error
const QRScannerNoSSR = dynamic(
  () => Promise.resolve(QrScannerComponent),
  { ssr: false }
)

// Definition for processed patient results from API
// In JavaScript, we don't need interfaces, just use JSDoc comments for documentation
/**
 * @typedef {Object} ProcessedPatient
 * @property {string} id - Patient ID
 * @property {string} [medicalNumber] - Medical ID number
 * @property {string} name - Patient name
 * @property {string} [email] - Patient email
 * @property {string} [photo] - Patient photo URL
 * @property {string} [phone] - Patient phone number
 */

/**
 * @typedef {Object} PatientSearchWidgetProps
 * @property {function} onSelect - Callback when patient is selected
 * @property {boolean} [showCameraButton] - Whether to show camera button
 * @property {string} [placeholder] - Input placeholder text
 * @property {string} [className] - Additional CSS classes
 * @property {string} [hospitalId] - Hospital ID for filtering
 */

export function PatientSearchWidget({
  onSelect,
  showCameraButton = true,
  placeholder = "Search by name, phone, or medical ID",
  className = "",
  hospitalId,
}) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [showError, setShowError] = useState(false)
  const [errorMessage, setErrorMessage] = useState("") 
  const [scannerActive, setScannerActive] = useState(false)
  const [scannerModalOpen, setScannerModalOpen] = useState(false)
  const [scannerLoading, setScannerLoading] = useState(false)
  const [scannerError, setScannerError] = useState("")
  const dropdownRef = useRef(null)
  const scannerRef = useRef(null)
  const [scanner, setScanner] = useState(null)

  // Handle clicks outside the dropdown to close it
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false)
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Clean up QR scanner when component unmounts
  useEffect(() => {
    return () => {
      if (scannerActive) {
        // Attempt to stop scanner if it exists
        try {
          const scannerElement = document.getElementById('html5qr-code-full-region')
          if (scannerElement) {
            scannerElement.innerHTML = ''
          }
        } catch (error) {
          console.error('Error cleaning up scanner:', error)
        }
      }
    }
  }, [scannerActive])

  // Create debounced search function with explicit flush type
  const debouncedSearch = debounce(async () => {
    await searchPatient(query)
  }, 300)

  // Cancel any pending search on cleanup
  useEffect(() => {
    return () => {
      debouncedSearch.cancel()
    }
  }, [])

  // Search for patient using the API
  const searchPatient = useCallback(
    async (searchQuery) => {
    // Clear any previous errors
    setShowError(false)
    
    if (searchQuery.trim().length < 2) {
      setResults([])
      setShowDropdown(false)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      
      // Build search URL with query parameters
      const searchParams = new URLSearchParams()
      searchParams.append('search', searchQuery)
      if (hospitalId) {
        searchParams.append('hospitalId', hospitalId)
      }
      
      console.log(`Searching patients with params: ${searchParams.toString()}`)
      
      // Add timeout to prevent hanging requests
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 seconds timeout
      
      const response = await fetch(`/api/patients/search?${searchParams.toString()}`, {
        credentials: 'include',
        signal: controller.signal
      })
      
      // Clear the timeout since request completed
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error')
        let errorMessage = `Search failed: ${response.statusText || response.status}`
        
        try {
          // Try to parse as JSON for structured error message
          const errorData = JSON.parse(errorText)
          if (errorData.error || errorData.message) {
            errorMessage = errorData.error || errorData.message
          }
        } catch (e) {
          // If not JSON, use the text directly if it's not too long
          if (errorText && errorText.length < 100) {
            errorMessage = errorText
          }
        }
        
        console.error('Search error response:', errorMessage)
        setErrorMessage(errorMessage)
        setShowError(true)
        setResults([])
        setShowDropdown(false)
        setLoading(false)
        return
      }
      
      const data = await response.json()
      
      // Check for API success status
      if (!data.success) {
        let errorMsg = data.error || data.message || 'Unknown search error';
        console.error('API returned error:', errorMsg)
        setErrorMessage(errorMsg)
        setShowError(true)
        setResults([])
        setShowDropdown(false)
        setLoading(false)
        return
      }
      
      // Extract patients data safely
      const foundPatients = data.patients || []
      
      console.log(`Found ${foundPatients.length} patients matching query`)
      
      if (foundPatients.length === 0) {
        // Show a message when no patients found
        setResults([])
        setShowDropdown(false)
        setErrorMessage(`No patients found matching "${searchQuery}"`)
        setShowError(true)
      } else {
        setResults(foundPatients)
        setShowDropdown(true)
        setShowError(false)
      }
      
    } catch (error) {
      console.error('Patient search error:', error)
      setErrorMessage(error.message || 'Search failed. Please try again.')
      setShowError(true)
      setResults([])
      setShowDropdown(false)
    } finally {
      setLoading(false)
    }
  }, [hospitalId])

  // Handle input change
  const handleInputChange = useCallback((e) => {
    const value = e.target.value;
    setQuery(value);
    debouncedSearch();
  }, [setQuery, debouncedSearch]);

  // Handle key down events (e.g., Enter to search immediately)
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      debouncedSearch.flush(); // Execute search immediately
    }
  }, [debouncedSearch]);

  // Handle patient selection
  const handleSelectPatient = useCallback((patient) => {
    onSelect(patient)
    setShowDropdown(false)
    setQuery(patient.name) // Update input with selected patient name
  }, [onSelect, setShowDropdown, setQuery]);

  // Get initials for avatar fallback
  const getInitials = (name) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2)
  }

  // Helper to close the scanner
  const closeScanner = () => {
    setScannerActive(false)
    setScannerModalOpen(false)
    setScannerLoading(false)
    setScannerError("")
    
    // Clean up scanner elements
    if (scanner) {
      try {
        scanner.clear()
      } catch (error) {
        console.error('Error clearing scanner:', error)
      }
    }
    
    const scannerElement = document.getElementById('patient-qr-reader')
    if (scannerElement) {
      scannerElement.innerHTML = ''
    }
  }

  // Handle opening the scanner modal
  const handleOpenScanner = useCallback(async () => {
    setScannerModalOpen(true)
    setScannerError("") // Clear any previous errors
    setScannerLoading(true)
    
    // Load the library first
    const libraryLoaded = await isCameraSupported();
    
    if (!libraryLoaded) {
      setScannerError('Failed to load QR scanner library. Please try refreshing the page.');
      setScannerLoading(false);
      return;
    }
    
    // Clear any existing scanner DIV contents
    const scannerElement = document.getElementById('patient-qr-reader')
    if (scannerElement) {
      scannerElement.innerHTML = ''
    }
    
    try {
      // Configure scanner with more options for better visibility
      const config = {
        fps: 15, // Higher FPS for better responsiveness
        qrbox: { width: 250, height: 250 },
        rememberLastUsedCamera: true,
        showTorchButtonIfSupported: true,
        showZoomSliderIfSupported: false, // Hide zoom to keep UI clean
        aspectRatio: 1.0
      }
      
      // Create scanner instance
      const scannerInstance = new window.Html5QrcodeScanner(
        'patient-qr-reader',
        config,
        false // Don't show verbose messages
      )
      
      // Store reference for cleanup
      setScanner(scannerInstance)
      
      // Render scanner with callbacks
      scannerInstance.render(
        // Success callback
        (decodedText) => {
          console.log('QR Code scanned:', decodedText)
          
          // Set query value
          setQuery(decodedText)
          
          // Search immediately
          const searchPatient = async () => {
            try {
              setLoading(true)
              
              // Build search URL
              const params = new URLSearchParams()
              params.append('search', decodedText)
              if (hospitalId) {
                params.append('hospitalId', hospitalId)
              }
              
              const response = await fetch(`/api/patients/search?${params.toString()}`, {
                credentials: 'include',
              })
              
              if (!response.ok) {
                throw new Error(`Search failed: ${response.status}`)
              }
              
              const data = await response.json()
              const foundPatients = data.patients || []
              
              if (foundPatients.length === 1) {
                // Auto-select if just one patient
                handleSelectPatient(foundPatients[0])
              } else if (foundPatients.length > 0) {
                // Show dropdown for multiple results
                setResults(foundPatients)
                setShowDropdown(true)
              }
              
              setLoading(false)
            } catch (error) {
              console.error('Search error:', error)
              setLoading(false)
            }
          }
          searchPatient()
          
          // Close scanner
          setScannerModalOpen(false)
          setScannerLoading(false)
          
          // Clean up
          try {
            scannerInstance.clear()
          } catch (e) {
            console.error('Error clearing scanner:', e)
          }
        },
        // Error callback (for single scan errors, not fatal)
        (errorMessage) => {
          // Don't show every QR detection error
          console.log('QR scan attempt error:', errorMessage)
        }
      )
      
      // Ensure loading spinner disappears after timeout
      setTimeout(() => {
        setScannerLoading(false)
      }, 2500)
    } catch (error) {
      console.error('Scanner initialization error:', error)
      setScannerError('Could not start camera: ' + error.message || 'Unknown error')
      setScannerLoading(false)
    }
  }, [hospitalId, setScanner, setScannerActive, setScannerLoading, setScannerError, setQuery, setResults, setShowDropdown, setLoading])

  // Handle keyboard shortcuts for quick access
  useEffect(() => {
    // Track keypresses for double-press detection
    const lastKeyPress = { key: '', time: 0 }
    const doublePressThreshold = 500 // ms between keypresses for double-press
    
    function handleKeyDown(e) {
      const now = Date.now()
      // Only trigger if we're not in an input field or textarea
      const activeEl = document.activeElement
      const isInput = activeEl instanceof HTMLInputElement || activeEl instanceof HTMLTextAreaElement
      
      if (!isInput) {
        // Check for double press of 'p' or space
        if ((e.key === 'p' || e.key === ' ') && 
            lastKeyPress.key === e.key &&
            now - lastKeyPress.time < doublePressThreshold) {
          // Open scanner on double press of p or space
          handleOpenScanner()
          // Reset to prevent triple-press triggering
          lastKeyPress.key = ''
          lastKeyPress.time = 0
        } else {
          // Record this keypress
          lastKeyPress.key = e.key
          lastKeyPress.time = now
        }
      }
    }
    
    // Add keyboard listener
    document.addEventListener('keydown', handleKeyDown)
    
    // Clean up
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleOpenScanner])

  // Close scanner when clicking the close button
  const onCloseScannerClick = useCallback(() => {
    closeScanner();
  }, []);

  return (
    <div className={`relative ${className}`}>
      <div className="flex">
        <div className="flex-1 relative">
          <Input
            type="text"
            placeholder={placeholder}
            className={`w-full pr-10 ${showError ? 'border-red-500' : ''}`}
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
          />
          {loading && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
        
        {showCameraButton && (
          <Button
            variant="outline"
            className="ml-2"
            type="button"
            onClick={handleOpenScanner}
          >
            <Camera className="h-4 w-4" />
            <VisuallyHidden>Scan QR Code</VisuallyHidden>
          </Button>
        )}
      </div>
      
      {/* Error message display */}
      {showError && errorMessage && (
        <div className="mt-2 text-sm text-red-500 animate-in fade-in">
          <div className="flex items-center">
            <X className="h-4 w-4 mr-1" />
            {errorMessage}
          </div>
        </div>
      )}
      
      <QRScannerNoSSR elementId="qr-scanner-loader" />
      
      {/* QR Scanner Modal */}
      <Dialog open={scannerModalOpen} onOpenChange={(open) => !open && closeScanner()}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden">
          <VisuallyHidden>
            <DialogTitle>Scan Patient QR Code</DialogTitle>
          </VisuallyHidden>
          <div ref={scannerRef} className="relative w-full aspect-square bg-black">
            {/* The scanner container - placed directly without extra divs */}
            <div id="patient-qr-reader" className="w-full h-full">
              {/* QR Scanner will render here */}
            </div>
            
            {/* Custom styles to hide scanner UI elements and make it cleaner */}
            <style jsx global>{`
              /* Hide scanner header and other elements */
              #patient-qr-reader__dashboard_section_csr,
              #patient-qr-reader__dashboard_section_swaplink,
              #patient-qr-reader__header_message,
              #patient-qr-reader__status_span {
                display: none !important;
              }
              
              /* Remove default scan region border */
              #patient-qr-reader__scan_region {
                border: none !important;
                padding: 0 !important;
                margin: 0 !important;
                background: transparent !important;
              }
              
              /* Make video container fill space */
              #patient-qr-reader__scan_region_camera_container {
                width: 100% !important;
                height: 100% !important;
                overflow: hidden !important;
                position: absolute !important;
                top: 0;
                left: 0;
              }
              
              /* Style the video element */
              #patient-qr-reader video {
                width: 100% !important;
                height: 100% !important;
                object-fit: cover !important;
              }
              
              /* Ensure overall container doesn't have extra margins */
              #patient-qr-reader {
                border: none !important;
                padding: 0 !important;
                margin: 0 !important;
                max-width: 100% !important;
                max-height: 100% !important;
                width: 100% !important;
                height: 100% !important;
              }
              /* Fix camera display */
              #patient-qr-reader video {
                width: 100% !important;
                height: 100% !important;
                object-fit: cover !important;
              }
              /* Hide irrelevant elements from scanner UI */
              #patient-qr-reader__scan_region {
                padding: 0 !important;
                margin: 0 !important;
              }
              #patient-qr-reader__scan_region_padding,
              #patient-qr-reader__dashboard_section_csr,
              #patient-qr-reader__scan_region img {
                display: none !important;
              }
              /* Hide the default header */
              #patient-qr-reader__header_message {
                display: none !important;
              }
            `}</style>
            
            {/* Circular overlay */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="flex items-center justify-center h-full">
                {/* Dark overlay with circular cutout */}
                <div className="absolute inset-0 bg-black/60"></div>
                
                {/* Circular mask with border */}
                <div className="relative z-10">
                  <div className="w-[250px] h-[250px] rounded-full border-2 border-white/70 relative">
                    {/* Create transparent circle in the overlay */}
                    <div className="absolute -inset-[1000px] bg-black/60">
                      <div className="absolute inset-[1000px] rounded-full bg-transparent"></div>
                    </div>
                  </div>
                  
                  {/* Instruction text */}
                  <div className="absolute top-0 transform -translate-y-10 text-white text-center w-full">
                    <p className="text-sm font-medium">Position QR code in the center</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Loading overlay */}
            {scannerLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-20">
                <Loader2 className="h-12 w-12 animate-spin text-white mb-2" />
                <p className="text-sm text-white">Initializing camera...</p>
              </div>
            )}
            
            {/* Error message */}
            {scannerError && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20">
                <div className="p-4 max-w-[80%] text-center">
                  <p className="text-white">{scannerError}</p>
                  <Button 
                    variant="outline" 
                    className="mt-4 bg-white text-black hover:bg-gray-100"
                    onClick={closeScanner}
                  >
                    Close
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Results Dropdown */}
      {showDropdown && results.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-1 max-h-60 overflow-auto z-50 rounded-md border bg-background shadow-md"
        >
          <div className="p-1">
            {results.map((patient) => (
              <div
                key={patient.id}
                className="flex items-center gap-2 p-2 hover:bg-muted rounded-sm cursor-pointer"
                onClick={() => handleSelectPatient(patient)}
              >
                <Avatar className="h-8 w-8">
                  {patient.photo ? (
                    <AvatarImage src={patient.photo} alt={patient.name} />
                  ) : (
                    <AvatarFallback>{getInitials(patient.name)}</AvatarFallback>
                  )}
                </Avatar>
                
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{patient.name}</span>
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    {patient.medicalNumber && (
                      <div>Medical ID: {patient.medicalNumber}</div>
                    )}
                    {patient.phone && (
                      <div>Phone: {patient.phone}</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
