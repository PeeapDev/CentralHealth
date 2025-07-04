"use client";

import React, { useState, useCallback } from 'react';
import QrScanner from '@/components/qr-scanner';
import styles from './styles.module.css';

/**
 * QR Scanner Test Page
 * This page allows testing the QR scanner component in isolation.
 */
export default function QrTestPage() {
  const [isVisible, setIsVisible] = useState(true);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [stopScanner, setStopScanner] = useState<(() => Promise<void>) | null>(null);

  // Handle successful scan
  const handleScanSuccess = useCallback((result: string) => {
    console.log('Scan success:', result);
    setScanResult(result);
    
    // Auto-hide scanner after successful scan
    setIsVisible(false);
  }, []);

  // Handle scan errors
  const handleScanError = useCallback((error: string) => {
    console.error('Scan error:', error);
    setScanError(error);
  }, []);

  // Handle scanner mount to store stop function
  const handleScannerMount = useCallback((stopFn: () => Promise<void>) => {
    setStopScanner(() => stopFn);
  }, []);

  // Toggle scanner visibility
  const toggleScanner = useCallback(() => {
    if (isVisible && stopScanner) {
      // First stop the scanner
      stopScanner().then(() => {
        setIsVisible(false);
      });
    } else {
      // Show scanner
      setIsVisible(true);
      setScanResult(null);
    }
  }, [isVisible, stopScanner]);

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>QR Scanner Test</h1>
      
      <div className={styles.controls}>
        <button 
          onClick={toggleScanner}
          className={styles.button}
        >
          {isVisible ? 'Hide Scanner' : 'Show Scanner'}
        </button>
      </div>

      {isVisible && (
        <div className={styles.scannerContainer}>
          <QrScanner
            onScanSuccess={handleScanSuccess}
            onScanError={handleScanError}
            onMount={handleScannerMount}
            height="350px"
            showBorder={true}
            preferredCamera="environment"
            scanConfig={{
              fps: 10,
              qrbox: { width: 250, height: 250 },
              disableFlash: false
            }}
          />
        </div>
      )}

      <div className={styles.results}>
        {scanResult && (
          <div className={styles.resultBox}>
            <h2>Scan Result:</h2>
            <pre className={styles.resultCode}>{scanResult}</pre>
          </div>
        )}

        {scanError && !isVisible && (
          <div className={styles.errorBox}>
            <h2>Last Error:</h2>
            <pre className={styles.errorCode}>{scanError}</pre>
          </div>
        )}
      </div>

      <div className={styles.instructions}>
        <h2>Instructions</h2>
        <ol>
          <li>Allow camera permissions when prompted</li>
          <li>Point your camera at a QR code</li>
          <li>The scanner will automatically detect valid QR codes</li>
          <li>After a successful scan, the result will be displayed below</li>
          <li>If you have multiple cameras, a toggle button will appear</li>
        </ol>
        
        <div className={styles.note}>
          <p><strong>Note:</strong> This test page uses the real QR scanner component that can be integrated anywhere in the system. No mock data is used.</p>
        </div>
      </div>
    </div>
  );
}
