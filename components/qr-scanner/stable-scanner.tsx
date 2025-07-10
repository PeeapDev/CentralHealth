"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import styles from './stable-styles.module.css';

// Define types for html5-qrcode that aren't exported properly
interface CameraDevice {
  id: string;
  label: string;
}

// Global state type
type QRScannerState = {
  activeId: string | null;
  status: 'idle' | 'active';
  timestamp: number;
  isStarting: boolean;
};

// Add global window type
declare global {
  interface Window {
    _qrScannerState: QRScannerState;
  }
}

// Initialize global state
if (typeof window !== 'undefined') {
  if (!window._qrScannerState) {
    window._qrScannerState = {
      activeId: null,
      status: 'idle',
      timestamp: Date.now(),
      isStarting: false
    };
  }
}

interface StableQRScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onClose?: () => void; // Make onClose optional to prevent errors
  maxWidth?: number;
}

export default function StableQRScanner({ 
  onScanSuccess, 
  onClose, 
  maxWidth = 500 
}: StableQRScannerProps) {
  // Core state
  const [scannerReady, setScannerReady] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [currentCameraIndex, setCurrentCameraIndex] = useState<number>(0);
  
  // Refs for cleanup and instance tracking
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const instanceIdRef = useRef<string>(`qr-scanner-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`);
  const mountedRef = useRef<boolean>(true);
  const retryCountRef = useRef<number>(0);
  const styleIntervalRef = useRef<number | null>(null);

  // Clean up all video elements in the DOM
  const cleanupVideoElements = useCallback(() => {
    try {
      // First stop any active camera streams using MediaDevices API
      if (navigator.mediaDevices) {
        navigator.mediaDevices.getUserMedia({ video: true })
          .then(stream => {
            stream.getTracks().forEach(track => track.stop());
          })
          .catch(() => {}); // Ignore errors during cleanup
      }
      
      // Find and stop all video elements
      const videoElements = document.querySelectorAll('video');
      videoElements.forEach((video: HTMLVideoElement) => {
        try {
          // Force stop all media tracks
          if (video.srcObject instanceof MediaStream) {
            const tracks = video.srcObject.getTracks();
            tracks.forEach(track => {
              try {
                if (track.readyState === 'live') {
                  track.stop();
                }
              } catch (e) {}
            });
          }
          video.srcObject = null;
          video.pause();
          
          // Remove video element unless it's our main scanner video
          if (video.id !== 'qr-scanner-video-element' && video.parentElement) {
            video.parentElement.removeChild(video);
          }
        } catch (error) {}
      });
      
      // Clear any style intervals
      if (styleIntervalRef.current !== null) {
        window.clearInterval(styleIntervalRef.current);
        styleIntervalRef.current = null;
      }
      
      // Stop any existing scanner instances
      if (scannerRef.current) {
        try {
          scannerRef.current.stop().catch(() => {});
        } catch (e) {}
        scannerRef.current = null;
      }
      
      // Remove any extra scanner elements
      const qrReaderElements = document.querySelectorAll('[id^="qr-reader"]');
      qrReaderElements.forEach(element => {
        if (element.id !== 'qr-reader' && element.parentElement) {
          try {
            element.parentElement.removeChild(element);
          } catch (e) {}
        }
      });
      
      // Reset global state
      if (window._qrScannerState && window._qrScannerState.activeId === instanceIdRef.current) {
        window._qrScannerState = {
          activeId: null,
          status: 'idle',
          timestamp: Date.now(),
          isStarting: false
        };
      }
    } catch (error) {
      console.error('Error in cleanupVideoElements:', error);
    }
  }, []);

  // Aggressively stop the scanner and release all resources
  const stopScanner = useCallback(() => {
    try {
      // First stop all active media tracks directly
      cleanupVideoElements();
      
      // Then try to stop the scanner properly
      if (scannerRef.current) {
        try {
          scannerRef.current.stop().catch(e => {
            console.error('Error stopping scanner:', e);
          });
        } catch (e) {
          console.error('Error stopping scanner:', e);
        }
        scannerRef.current = null;
      }
      
      // Update global state
      if (window._qrScannerState && window._qrScannerState.activeId === instanceIdRef.current) {
        window._qrScannerState = {
          activeId: null,
          status: 'idle',
          timestamp: Date.now(),
          isStarting: false
        };
      }
      
      // Reset state
      setScannerReady(false);
      setIsLoading(true);
    } catch (error) {
      console.error('Error in stopScanner:', error);
    }
  }, [cleanupVideoElements]);

  // Detect available cameras
  const detectCameras = useCallback(async () => {
    try {
      const devices = await Html5Qrcode.getCameras();
      if (mountedRef.current && devices && devices.length) {
        setCameras(devices);
        return devices;
      }
      return [];
    } catch (error) {
      console.error('Error getting cameras:', error);
      if (mountedRef.current) {
        setCameras([]);
      }
      return [];
    }
  }, []);

  // Apply aggressive styling to video elements to ensure visibility
  const enforceVideoStyles = useCallback(() => {
    if (!mountedRef.current) return;
    
    try {
      // Target all video elements in the document
      const videoElements = document.querySelectorAll('video');
      videoElements.forEach((video: HTMLVideoElement) => {
        // Force display and ensure video is visible with aggressive styling
        video.style.display = 'block';
        video.style.width = '100%';
        video.style.height = '100%';
        video.style.objectFit = 'cover';
        video.style.position = 'absolute';
        video.style.top = '0';
        video.style.left = '0';
        video.style.zIndex = '5'; // Higher z-index
        video.style.opacity = '1';
        video.style.visibility = 'visible';
        video.style.transform = 'none'; // Prevent transforms that might hide it
        video.setAttribute('playsinline', 'true');
        video.setAttribute('autoplay', 'true');
        
        // Fix any parent divs that might be hiding the video
        let parent = video.parentElement;
        while (parent && parent !== document.body) {
          parent.style.overflow = 'visible';
          parent.style.opacity = '1';
          parent.style.visibility = 'visible';
          parent = parent.parentElement;
        }
      });
      
      // Move any videos from library containers to our container
      if (containerRef.current) {
        // Find library-generated containers
        const scanRegionElements = document.querySelectorAll('[id^="html5-qrcode-scan-region"]');
        scanRegionElements.forEach(region => {
          const videoEl = region.querySelector('video');
          if (videoEl && containerRef.current && videoEl.parentElement !== containerRef.current) {
            try {
              // Clone the video to keep the original working
              const clone = videoEl.cloneNode(true) as HTMLVideoElement;
              containerRef.current.appendChild(clone);
            } catch (e) {}
          }
        });
      }
      
      // Fix scan region styling
      const scanRegions = document.querySelectorAll('.scan-region-highlight');
      scanRegions.forEach((region: Element) => {
        const el = region as HTMLElement;
        el.style.border = '2px dashed red';
        el.style.boxShadow = 'none';
        el.style.background = 'transparent';
      });
      
      // Fix the main QR reader container
      const qrReader = document.getElementById('qr-reader');
      if (qrReader) {
        qrReader.style.width = '100%';
        qrReader.style.height = '100%';
        qrReader.style.overflow = 'visible';
        qrReader.style.position = 'relative';
      }
    } catch (error) {
      console.error('Error enforcing video styles:', error);
    }
  }, []);

  // Handle scan success
  const handleScanSuccess = useCallback((decodedText: string) => {
    if (onScanSuccess) {
      onScanSuccess(decodedText);
    }
  }, [onScanSuccess]);

  // Initialize and start the scanner
  const startScanner = useCallback(async () => {
    // Prevent multiple concurrent starts
    if (window._qrScannerState.isStarting) {
      return;
    }

    // Update global state
    window._qrScannerState.isStarting = true;
    
    // Clear previous state
    if (scannerRef.current) {
      stopScanner();
    }
    
    // Reset error state
    setHasError(false);
    setIsLoading(true);
    
    try {
      // First ensure we have camera permissions explicitly
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        });
        
        // Create a video element we control
        if (containerRef.current) {
          // Check if our video already exists
          let videoEl = document.getElementById('qr-scanner-video-element') as HTMLVideoElement | null;
          
          if (!videoEl) {
            // Create a new video element
            videoEl = document.createElement('video');
            videoEl.id = 'qr-scanner-video-element';
            videoEl.style.width = '100%';
            videoEl.style.height = '100%';
            videoEl.style.objectFit = 'cover';
            videoEl.style.position = 'absolute';
            videoEl.style.top = '0';
            videoEl.style.left = '0';
            videoEl.style.zIndex = '5';
            videoEl.autoplay = true;
            videoEl.playsInline = true;
            containerRef.current.appendChild(videoEl);
          }
          
          // Try to attach the stream to our video element
          try {
            videoEl.srcObject = stream;
            videoEl.play().catch(e => console.error('Error playing video:', e));
          } catch (e) {
            console.error('Error attaching stream to video:', e);
          }
        }
        
        // We'll let the scanner take over now, so stop this initial stream
        stream.getTracks().forEach(track => track.stop());
      } catch (err) {
        console.error('Camera access error:', err);
        setIsLoading(false);
        setHasError(true);
        window._qrScannerState.isStarting = false;
        return;
      }

      // Create scanner instance
      const html5QrCode = new Html5Qrcode("qr-reader");
      scannerRef.current = html5QrCode;
      
      // Detect cameras
      const availableCameras = await detectCameras();
      
      // Check if we have cameras and are still mounted
      if (!mountedRef.current || !availableCameras.length) {
        setIsLoading(false);
        if (mountedRef.current) {
          setHasError(true);
        }
        window._qrScannerState.isStarting = false;
        return;
      }
      
      // Determine which camera to use
      const cameraIndex = Math.min(currentCameraIndex, availableCameras.length - 1);
      const camera = availableCameras[cameraIndex];
      
      // Configure scanner
      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        showTorchButtonIfSupported: false,
        showZoomSliderIfSupported: false,
        videoConstraints: {
          width: { min: 320, ideal: 1280, max: 1920 },
          height: { min: 240, ideal: 720, max: 1080 },
          facingMode: { ideal: 'environment' }
        }
      };
      
      // Start camera with safety checks
      try {
        if (!mountedRef.current) {
          throw new Error('Component unmounted');
        }
        
        // Start the scanner with explicit camera ID
        await html5QrCode.start(
          camera.id, 
          config,
          (decodedText) => {
            // Direct call to ensure success callback works
            if (typeof onScanSuccess === 'function') {
              onScanSuccess(decodedText);
            }
          },
          (errorMessage) => {
            // Filter out common errors to reduce console noise
            const commonErrors = [
              'source height is 0',
              'Invalid element or state',
              'No MultiFormat Readers',
              'QR code not found',
              'No barcode or QR code detected',
              'Error = No barcode or QR code detected',
              'frame is undefined',
              'scanning in progress'
            ];
            
            // Check if this is a common error we should filter
            const isCommonError = commonErrors.some(commonError => 
              errorMessage.toLowerCase().includes(commonError.toLowerCase())
            );
            
            // Only log significant errors
            if (!isCommonError) {
              // Use warn instead of error to reduce severity in console
              console.warn('QR Scanner message:', errorMessage);
            }
          }
        );
        
        // Register in global state
        window._qrScannerState = {
          activeId: instanceIdRef.current,
          status: 'active',
          timestamp: Date.now(),
          isStarting: false
        };
        
        // Update component state
        if (mountedRef.current) {
          setScannerReady(true);
          setIsLoading(false);
          
          // Set up aggressive style enforcement
          enforceVideoStyles();
          setTimeout(enforceVideoStyles, 300);
          setTimeout(enforceVideoStyles, 800);
          
          // Set up interval to keep checking and fixing the video display
          if (styleIntervalRef.current !== null) {
            window.clearInterval(styleIntervalRef.current);
          }
          styleIntervalRef.current = window.setInterval(enforceVideoStyles, 1000);
        }
        
        // Reset retry count on success
        retryCountRef.current = 0;
        
      } catch (error) {
        console.error('Error starting scanner:', error);
        
        // Update state on error
        if (mountedRef.current) {
          setIsLoading(false);
          setHasError(true);
          setScannerReady(false);
        }
        
        // Reset global state
        window._qrScannerState.isStarting = false;
        
        // Try to stop the scanner to release resources
        stopScanner();
        
        // Attempt retry if not too many failed attempts
        retryCountRef.current++;
        if (retryCountRef.current < 3 && mountedRef.current) {
          setTimeout(() => {
            if (mountedRef.current) {
              startScanner();
            }
          }, 1000);
        }
      }
    } catch (error) {
      console.error('Error in scanner initialization:', error);
      if (mountedRef.current) {
        setIsLoading(false);
        setHasError(true);
      }
      window._qrScannerState.isStarting = false;
    }
  }, [currentCameraIndex, detectCameras, enforceVideoStyles, onScanSuccess, stopScanner]);

  // Switch to next available camera
  const switchCamera = useCallback(() => {
    if (cameras.length <= 1) return;
    
    // Compute next camera index
    const nextCameraIndex = (currentCameraIndex + 1) % cameras.length;
    setCurrentCameraIndex(nextCameraIndex);
    
    // Restart the scanner with the new camera
    stopScanner();
    setTimeout(() => {
      startScanner();
    }, 300);
  }, [cameras, currentCameraIndex, startScanner, stopScanner]);

  // Handle retry button click
  const handleRetry = useCallback(() => {
    retryCountRef.current = 0;
    startScanner();
  }, [startScanner]);

  // Handle close button click
  const handleClose = useCallback(() => {
    stopScanner();
    // Check if onClose is a function before calling it
    if (typeof onClose === 'function') {
      onClose();
    } else {
      console.warn('onClose prop is not a function');
      // If in a dialog context, try to close by history
      try {
        if (window.history && window.history.back) {
          window.history.back();
        }
      } catch (e) {
        console.error('Failed to navigate back:', e);
      }
    }
  }, [onClose, stopScanner]);

  // Start scanner on mount and handle visibility changes
  useEffect(() => {
    mountedRef.current = true;
    
    // Initialize scanner
    const initializeScanner = async () => {
      try {
        // Request camera permissions explicitly first
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          } 
        });
        
        // Stop this stream immediately, we just wanted permission
        stream.getTracks().forEach(track => track.stop());
        
        // Start the scanner
        if (mountedRef.current) {
          startScanner();
        }
      } catch (err) {
        console.error('Camera initialization error:', err);
        if (mountedRef.current) {
          setHasError(true);
          setIsLoading(false);
        }
      }
    };
    
    // Start initialization process
    initializeScanner();
    
    // Handle page visibility changes
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // Page is hidden, stop scanner to save resources
        stopScanner();
      } else if (document.visibilityState === 'visible' && mountedRef.current) {
        // Page is visible again, restart scanner
        cleanupVideoElements();
        setTimeout(() => startScanner(), 300);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Cleanup
    return () => {
      mountedRef.current = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      stopScanner();
      cleanupVideoElements();
    };
  }, [cleanupVideoElements, startScanner, stopScanner]);

  return (
    <div className={styles.qrScannerContainer} style={{ maxWidth }}>
      <div className={styles.qrScannerBorder}>
        <div id="qr-reader" className={styles.qrReader} ref={containerRef}>
          {/* The video element will be created programmatically */}
        </div>
        
        {/* Scanner Status Indicators (no text) */}
        {isLoading && !hasError && !scannerReady && (
          <div className={styles.scannerOverlay}>
            <div className={styles.spinnerContainer}>
              <div className={styles.spinner}></div>
            </div>
          </div>
        )}
        
        {hasError && (
          <div className={styles.scannerOverlay}>
            <div className={styles.errorContainer}>
              <button 
                onClick={handleRetry} 
                className={styles.retryButton}
                aria-label="Retry">
                🔄
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Control Buttons (no text, only icons) */}
      <div className={styles.controlButtons}>
        {cameras.length > 1 && scannerReady && (
          <button
            onClick={switchCamera}
            className={styles.controlButton}
            aria-label="Switch Camera">
            🔄
          </button>
        )}
        
        <button
          onClick={handleClose}
          className={styles.controlButton}
          aria-label="Close">
          ✕
        </button>
      </div>
    </div>
  );
}