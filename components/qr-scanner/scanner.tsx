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
  onClose: () => void;
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
  const lastErrorTimeRef = useRef<number>(0);
  const restartTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up all video elements in the DOM
  const cleanupVideoElements = useCallback(() => {
    // Find all video elements
    const videoElements = document.querySelectorAll('video');
    videoElements.forEach(video => {
      try {
        // Force stop all media tracks
        if (video.srcObject instanceof MediaStream) {
          const tracks = video.srcObject.getTracks();
          tracks.forEach(track => {
            if (track.readyState === 'live') {
              track.stop();
            }
          });
        }
        video.srcObject = null;
        
        // Remove video element if it's hidden or not visible
        if (video.style.display === 'none' || 
            video.offsetParent === null || 
            video.offsetWidth === 0 || 
            video.offsetHeight === 0) {
          video.parentElement?.removeChild(video);
        }
      } catch (error) {
        console.error('Error cleaning up video element:', error);
      }
    });
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
      
      // Final cleanup
      if (restartTimerRef.current) {
        clearTimeout(restartTimerRef.current);
        restartTimerRef.current = null;
      }
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

  // Handle scan success
  const handleScanSuccess = useCallback((decodedText: string) => {
    if (onScanSuccess) {
      onScanSuccess(decodedText);
    }
  }, [onScanSuccess]);

  // Handle scan error
  const handleScanError = useCallback((errorMessage: string) => {
    if (!mountedRef.current) return;
    
    // Don't show errors to the user visually - keep UI clean
    console.error('QR Scanner error:', errorMessage);
  }, []);

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
        showZoomSliderIfSupported: false
      };
      
      // Start camera
      try {
        await html5QrCode.start(
          camera.id, 
          config,
          handleScanSuccess,
          handleScanError
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
          
          // Ensure video element is visible with correct styling
          setTimeout(() => {
            const videoElement = document.querySelector('#qr-reader video');
            if (videoElement && videoElement instanceof HTMLVideoElement) {
              videoElement.style.display = 'block';
              videoElement.style.width = '100%';
              videoElement.style.height = '100%';
              videoElement.style.objectFit = 'cover';
            }
          }, 100);
        }
        
        // Reset retry count on success
        retryCountRef.current = 0;
        lastErrorTimeRef.current = 0;
        
      } catch (error) {
        console.error('Error starting scanner:', error);
        
        // Update state on error
        if (mountedRef.current) {
          setIsLoading(false);
          setHasError(true);
          setScannerReady(false);
        }
        
        // Try to stop the scanner to release resources
        stopScanner();
        window._qrScannerState.isStarting = false;
        
        // Attempt retry if not too many failed attempts
        retryCountRef.current++;
        if (retryCountRef.current < 3 && mountedRef.current) {
          restartTimerRef.current = setTimeout(() => {
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
  }, [currentCameraIndex, detectCameras, handleScanError, handleScanSuccess, stopScanner]);

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

  // Handle unmounting
  useEffect(() => {
    mountedRef.current = true;
    
    return () => {
      mountedRef.current = false;
      stopScanner();
      
      // Clear any pending timers
      if (restartTimerRef.current) {
        clearTimeout(restartTimerRef.current);
      }
      
      // Final cleanup of any lingering video elements
      cleanupVideoElements();
    };
  }, [cleanupVideoElements, stopScanner]);

  // Start scanner on mount
  useEffect(() => {
    if (mountedRef.current) {
      startScanner();
    }
  }, [startScanner]);

  // Handle retry button click
  const handleRetry = useCallback(() => {
    retryCountRef.current = 0;
    startScanner();
  }, [startScanner]);

  // Handle close button click
  const handleClose = useCallback(() => {
    stopScanner();
    onClose();
  }, [onClose, stopScanner]);

  return (
    <div className={styles.qrScannerContainer} style={{ maxWidth }}>
      <div className={styles.qrScannerBorder}>
        <div id="qr-reader" className={styles.qrReader}></div>
        
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