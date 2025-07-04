"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeScannerState, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import styles from './styles.module.css';

// Define global types
declare global {
  interface Window {
    _qrScannerState: {
      activeId: string | null;
      status: 'idle' | 'active';
      timestamp: number;
      isStarting: boolean;
    };
  }
}

// Ensure type safety with global state
const DEFAULT_QR_STATE = {
  activeId: null as string | null,
  status: 'idle' as 'idle' | 'active',
  timestamp: Date.now(),
  isStarting: false
};

// QR Scanner configuration types
interface QRScanConfig {
  fps?: number;
  qrbox?: { width: number; height: number } | number;
  aspectRatio?: number;
  disableFlip?: boolean;
  disableFlash?: boolean;
  formatsToSupport?: string[];
}

type QRScannerStatus = 'idle' | 'initializing' | 'active' | 'error' | 'success';

interface QRScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onScanError?: (errorMessage: string) => void;
  onMount?: (stopFn: () => Promise<void>) => void;
  width?: string;
  height?: string;
  showControls?: boolean;
  showBorder?: boolean;
  autoStart?: boolean;
  preferredCamera?: 'user' | 'environment';
  scanConfig?: QRScanConfig;
}

// Initialize global scanner state to prevent conflicts
if (typeof window !== 'undefined') {
  window._qrScannerState = window._qrScannerState || {
    ...DEFAULT_QR_STATE
  };
}

/**
 * QR Scanner Component
 * 
 * A comprehensive QR scanner implementation with robust error handling,
 * camera lifecycle management, and visual feedback.
 */
export default function QRScanner({
  onScanSuccess,
  onScanError,
  onMount,
  width = '100%',
  height = '250px',
  showControls = true,
  showBorder = false,
  autoStart = true,
  preferredCamera = 'environment',
  scanConfig = {}
}: QRScannerProps) {
  // Generate unique instance ID for this scanner
  const instanceId = useRef(`qr-scanner-${Math.random().toString(36).substring(2, 11)}`);
  
  // Refs
  const mountedRef = useRef(true);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const cameraIdRef = useRef<string | null>(null);
  const retryCountRef = useRef(0);
  const lastErrorTimeRef = useRef(0);
  const restartTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // State
  const [status, setStatus] = useState<QRScannerStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [availableCameras, setAvailableCameras] = useState<Array<{id: string, label: string}>>([]);
  
  // Detect available cameras
  const detectCameras = useCallback(async () => {
    if (!mountedRef.current) return [];
    
    try {
      console.log('[QR] Detecting available cameras...');
      const devices = await Html5Qrcode.getCameras();
      
      if (mountedRef.current) {
        setAvailableCameras(devices);
        
        // Set initial camera ID preference
        if (!cameraIdRef.current && devices.length > 0) {
          // Try to find environment camera if preferred
          if (preferredCamera === 'environment') {
            const envCamera = devices.find(cam => 
              cam.label.toLowerCase().includes('back') || 
              cam.label.toLowerCase().includes('environment') ||
              cam.label.toLowerCase().includes('rear')
            );
            cameraIdRef.current = envCamera?.id || devices[0].id;
          } 
          // Try to find user-facing camera if preferred
          else if (preferredCamera === 'user') {
            const userCamera = devices.find(cam => 
              cam.label.toLowerCase().includes('front') || 
              cam.label.toLowerCase().includes('user') ||
              cam.label.toLowerCase().includes('face')
            );
            cameraIdRef.current = userCamera?.id || devices[0].id;
          } 
          // Default to first camera
          else {
            cameraIdRef.current = devices[0].id;
          }
        }
      }
      
      return devices;
    } catch (err) {
      console.error('[QR] Error detecting cameras:', err);
      return [];
    }
  }, [preferredCamera]);
  
  // Clean up video elements created by html5-qrcode
  const cleanupVideoElements = useCallback(async () => {
    if (!mountedRef.current) return;
    
    try {
      // Find and remove any video elements created by html5-qrcode
      const videos = document.querySelectorAll('video');
      videos.forEach(video => {
        if (video.parentNode && 
            (video.parentNode as HTMLElement).classList.contains('html5-qrcode-element') || 
             video.classList.contains('html5-qrcode-video')) {
          // Pause and remove video tracks
          try {
            video.pause();
            if (video.srcObject instanceof MediaStream) {
              video.srcObject.getTracks().forEach(track => {
                try {
                  track.stop();
                } catch (e) {
                  console.warn('[QR] Error stopping video track:', e);
                }
              });
            }
            video.srcObject = null;
          } catch (e) {
            console.warn('[QR] Error cleaning up video element:', e);
          }
          
          // Attempt to remove from DOM if possible
          try {
            if (video.parentNode) {
              video.parentNode.removeChild(video);
            }
          } catch (e) {
            console.warn('[QR] Error removing video element from DOM:', e);
          }
        }
      });
    } catch (e) {
      console.warn('[QR] Error during video cleanup:', e);
    }
  }, []);
  
  // Stop the scanner safely
  const stopScanner = useCallback(async (): Promise<void> => {
    if (!mountedRef.current) return Promise.resolve();
    
    try {
      console.log('[QR] Stopping scanner...');
      setStatus('idle');
      
      // Clear any pending restart timer
      if (restartTimerRef.current) {
        clearTimeout(restartTimerRef.current);
        restartTimerRef.current = null;
      }
      
      // Stop the scanner if it exists
      if (scannerRef.current) {
        try {
          // Set a timeout for the stop operation
          const stopPromise = scannerRef.current.stop();
          const timeoutPromise = new Promise<void>((_, reject) => {
            setTimeout(() => reject(new Error('Scanner stop timeout')), 3000);
          });
          
          await Promise.race([stopPromise, timeoutPromise]);
        } catch (err) {
          console.warn('[QR] Error stopping scanner, continuing cleanup:', err);
        }
        
        // Clear reference even if stop fails
        scannerRef.current = null;
      }
      
      // Clean up video elements
      await cleanupVideoElements();
      
      // Update global state
      if (window._qrScannerState?.activeId === instanceId.current) {
        window._qrScannerState.activeId = null;
        window._qrScannerState.status = 'idle';
        window._qrScannerState.timestamp = Date.now();
        window._qrScannerState.isStarting = false;
      }
      
      console.log('[QR] Scanner stopped successfully');
      return Promise.resolve();
    } catch (err) {
      console.error('[QR] Error in stopScanner:', err);
      
      // Even on error, clear global state
      if (window._qrScannerState?.activeId === instanceId.current) {
        window._qrScannerState.activeId = null;
        window._qrScannerState.status = 'idle';
      }
      
      return Promise.reject(err);
    }
  }, [cleanupVideoElements]);
  
  // Handle scanner errors
  const handleScannerError = useCallback((errorMessage: string) => {
    if (!mountedRef.current) return;
    
    console.error('[QR] Scanner error:', errorMessage);
    setStatus('error');
    setErrorMessage(errorMessage);
    
    // Increment retry count and update last error time
    retryCountRef.current++;
    lastErrorTimeRef.current = Date.now();
    
    // Fatal errors that should not trigger auto-restart
    const fatalErrors = [
      'NotAllowedError',
      'PermissionDenied',
      'Permission denied',
      'requested device not found',
      'NotFoundError',
      'No camera found',
      'Camera access is not supported',
      'Could not start scanning',
      'Timeout waiting for getUserMedia',
      'The object can not be found here',
      'Failed to access the camera'
    ];
    
    const isFatalError = fatalErrors.some(msg => 
      errorMessage.includes(msg)
    );
    
    // Don't attempt restart for fatal errors
    if (isFatalError) {
      console.log('[QR] Fatal error, not attempting restart');
      return;
    }
    
    // Only attempt restart if we haven't had too many retries
    const now = Date.now();
    const timeSinceLastError = now - lastErrorTimeRef.current;
    
    if (retryCountRef.current >= 3 && timeSinceLastError < 30000) {
      console.warn(`[QR] Too many restart attempts (${retryCountRef.current}) in short period. Cooling down.`);
      return;
    }
    
    // Add delay before attempting restart
    console.log('[QR] Scheduling scanner restart after error...');
    
    // Clear any existing timer
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
    }
    
    // Set restart timer with increasing delay based on retry count
    const delay = Math.min(1000 * retryCountRef.current, 5000);
    restartTimerRef.current = setTimeout(() => {
      if (!mountedRef.current) return;
      
      console.log('[QR] Attempting scanner restart...');
      startScanner();
    }, 1000 + delay);
  }, []);
  
  // Start the scanner
  const startScanner = useCallback(async () => {
    // Don't start if unmounted or already running
    if (!mountedRef.current || status === 'active' || status === 'initializing') {
      console.log(`[QR] Cannot start scanner, state: ${status}, mounted: ${mountedRef.current}`);
      return;
    }
    
    // Block start if another start is already in progress
    if (window._qrScannerState?.isStarting) {
      console.log('[QR] Another scanner start operation in progress, blocking');
      return;
    }
    
    // Prevent rapid restart cycles
    const currentTime = Date.now();
    const lastStart = window._qrScannerState?.timestamp || 0;
    
    if (currentTime - lastStart < 3000) {
      console.log(`[QR] Blocking rapid restart, last start was ${currentTime - lastStart}ms ago`);
      return;
    }
    
    // Update global state
    window._qrScannerState.timestamp = currentTime;
    window._qrScannerState.isStarting = true;
    
    try {
      setStatus('initializing');
      setErrorMessage(null);
      
      // Set this scanner as active
      window._qrScannerState.activeId = instanceId.current;
      window._qrScannerState.status = 'active';
      
      // Get available cameras if needed
      if (!cameraIdRef.current || availableCameras.length === 0) {
        await detectCameras();
      }
      
      // Clean up any existing scanner
      if (scannerRef.current) {
        try {
          await scannerRef.current.stop();
        } catch (e) {
          console.warn('[QR] Error stopping existing scanner:', e);
        }
        scannerRef.current = null;
      }
      
      // Clean up any existing video elements
      await cleanupVideoElements();
      
      // Create the scanner
      if (!containerRef.current) {
        throw new Error('Scanner container not found');
      }
      
      scannerRef.current = new Html5Qrcode(instanceId.current);
      
      // Determine camera config
      let facingMode = preferredCamera;
      let cameraId = cameraIdRef.current || undefined;
      
      // Start the camera
      console.log(`[QR] Starting camera with ID: ${cameraId || 'auto'}, facing: ${facingMode}`);
      
      // Set timeout for camera start
      const startPromise = scannerRef.current.start(
        cameraId ? { deviceId: cameraId } : { facingMode },
        {
          fps: scanConfig?.fps || 10,
          qrbox: scanConfig?.qrbox || { width: 200, height: 200 },
          aspectRatio: scanConfig?.aspectRatio || 1.0,
          disableFlash: true
        },
        (decodedText) => {
          if (!mountedRef.current) return;
          
          console.log('[QR] Scan success:', decodedText);
          setStatus('success');
          onScanSuccess(decodedText);
          
          // Stop scanner after successful scan
          stopScanner();
        },
        (errorMessage) => {
          // Filter out common scanning errors to reduce noise
          const normalScanningErrors = [
            'QR code not found',
            'No QR code found',
            'No MultiFormat Readers were able to detect',
    }
  }, [
    status, 
    detectCameras, 
    onScanSuccess, 
    onScanError, 
    scanConfig, 
    cleanupVideoElements,
    availableCameras,
    preferredCamera,
    stopScanner
  ]);
  
  // Handle camera toggle
  const toggleCamera = useCallback(async () => {
    if (status === 'initializing' || availableCameras.length < 2) {
      return;
    }
    
    try {
      await stopScanner();
      
      // Select next camera in the list
      if (cameraIdRef.current && availableCameras.length > 1) {
        const currentIndex = availableCameras.findIndex(cam => cam.id === cameraIdRef.current);
        const nextIndex = (currentIndex + 1) % availableCameras.length;
        const newCamera = availableCameras[nextIndex];
        
        console.log(`[QR] Switching camera from ${cameraIdRef.current} to ${newCamera.id}`);
        cameraIdRef.current = newCamera.id;
      }
      
      // Delay to ensure clean transition between cameras
      setTimeout(startScanner, 500);
    } catch (err) {
      console.error('[QR] Error toggling camera:', err);
      setErrorMessage('Failed to switch camera');
    }
  }, [status, availableCameras, stopScanner, startScanner]);
  
  // Handle visibility changes
  const handleVisibilityChange = useCallback(() => {
    if (!mountedRef.current) return;
    
    if (document.visibilityState === 'hidden' && status === 'active') {
      console.log('[QR] Page hidden, pausing scanner');
      stopScanner();
    } else if (document.visibilityState === 'visible' && status === 'idle') {
      // Only auto-resume if we haven't had too many errors
      if (retryCountRef.current >= 3) {
        console.log('[QR] Not auto-resuming scanner due to previous errors');
        return;
      }
      
      console.log('[QR] Page visible, scheduling scanner resume');
      
      // Clear any pending restart timer
      if (restartTimerRef.current) {
        clearTimeout(restartTimerRef.current);
      }
      
      // Use a longer delay for visibility-based restarts
      restartTimerRef.current = setTimeout(() => {
        // Double-check state before restart
        if (mountedRef.current && 
            status === 'idle' && 
            document.visibilityState === 'visible' && 
            !window._qrScannerState?.isStarting) {
          console.log('[QR] Resuming scanner after visibility change');
          startScanner();
        }
      }, 2000);
    }
  }, [status, startScanner, stopScanner]);
  
  // Handle manual retry
  const handleRetry = useCallback(() => {
    if (status !== 'initializing') {
      // Reset retry count on manual retry
      retryCountRef.current = 0;
      lastErrorTimeRef.current = 0;
      
      // Add a delay before retry
      setTimeout(startScanner, 500);
    }
  }, [status, startScanner]);
  
  // Handle manual close
  const handleForceClose = useCallback(() => {
    console.log('[QR] Force closing camera...');
    stopScanner();
  }, [stopScanner]);
  
  // Setup and cleanup
  useEffect(() => {
    mountedRef.current = true;
    
    // Register stop function for parent component
    if (onMount) {
      onMount(stopScanner);
    }
    
    // Reset counters on mount
    retryCountRef.current = 0;
    lastErrorTimeRef.current = 0;
    
    // Delay scanner initialization
    const initTimer = setTimeout(() => {
      if (mountedRef.current && autoStart && !window._qrScannerState?.isStarting) {
        console.log('[QR] Auto-initializing scanner...');
        startScanner();
      }
    }, 800);
    
    restartTimerRef.current = initTimer;
    
    // Cleanup on unmount
    return () => {
      console.log('[QR] Component unmounting, cleaning up...');
      mountedRef.current = false;
      
      if (restartTimerRef.current) {
        clearTimeout(restartTimerRef.current);
        restartTimerRef.current = null;
      }
      
      // Force immediate cleanup
      const cleanup = async () => {
        try {
          if (scannerRef.current) {
            try {
              await scannerRef.current.stop();
            } catch (e) {
              console.warn('[QR] Error stopping scanner during unmount:', e);
            }
            scannerRef.current = null;
          }
          
          await cleanupVideoElements();
          
          // Clear global state
          if (window._qrScannerState?.activeId === instanceId.current) {
            window._qrScannerState = {
              activeId: null,
              status: 'idle',
              timestamp: Date.now(),
              isStarting: false
            };
          }
        } catch (e) {
          console.error('[QR] Cleanup error during unmount:', e);
        }
      };
      
      cleanup();
    };
  }, [startScanner, stopScanner, onMount, cleanupVideoElements, autoStart]);
  
  // Handle visibility changes
  useEffect(() => {
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [handleVisibilityChange]);
  
  // Render the scanner
  return (
    <div className={styles.wrapper}>
      <div 
        ref={containerRef}
        className={`${styles.container} ${showBorder ? styles.withBorder : ''}`} 
        style={{ width, height }}
        data-status={status}
      >
        {/* Camera container - html5-qrcode will insert video element here */}
        <div id={instanceId.current} className={styles.qrScanner}></div>
        
        {/* Loading overlay */}
        {status === 'initializing' && (
          <div className={styles.overlay}>
            <div className={styles.spinner}></div>
            <p>Initializing camera...</p>
          </div>
        )}
        
        {/* Error overlay */}
        {status === 'error' && errorMessage && (
          <div className={styles.overlay}>
            <div className={styles.errorIcon}>!</div>
            <p className={styles.errorMessage}>{errorMessage}</p>
            <button 
              onClick={handleRetry}
              className={styles.retryButton}
            >
              Retry
            </button>
          </div>
        )}
        
        {/* Controls */}
        {showControls && (
          <div className={styles.controls}>
            {/* Close button */}
            <button 
              onClick={handleForceClose}
              className={styles.closeButton}
              title="Close Scanner"
              aria-label="Close QR Scanner"
            >
              ✕
            </button>
            
            {/* Camera toggle button - only show if multiple cameras available */}
            {availableCameras.length > 1 && status === 'active' && (
              <button 
                onClick={toggleCamera}
                className={styles.cameraToggle}
                title="Toggle Camera"
                aria-label="Switch Camera"
              >
                🔄
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
