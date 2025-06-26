import { useEffect, useRef, useState } from 'react';

interface QrScannerWrapperProps {
  onScanSuccess: (data: string) => void;
  onScanError?: (error: string) => void;
}

/**
 * QR Scanner Wrapper Component
 * 
 * This component provides a wrapper for the HTML5 QR code scanner
 * that handles dynamic loading of the library and proper cleanup.
 */
export function QrScannerWrapper({ onScanSuccess, onScanError }: QrScannerWrapperProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<HTMLDivElement>(null);
  const scannerInstance = useRef<any>(null);

  // Load and initialize the QR scanner
  useEffect(() => {
    async function loadQrLibrary() {
      if (typeof window === 'undefined') return;

      try {
        setIsLoading(true);
        // Import the library
        const html5QrCode = await import('html5-qrcode');
        
        if (!html5QrCode || !html5QrCode.Html5QrcodeScanner) {
          throw new Error('Failed to load QR scanner library');
        }

        // Create scanner configuration
        const config = {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          disableFlip: false,
          formatsToSupport: [0, 1, 2], // QR Code, Aztec, and Data Matrix
        };
        
        // Create and store the scanner instance
        const scanner = new html5QrCode.Html5QrcodeScanner(
          'qr-scanner-element',
          config,
          /* verbose= */ false
        );
        
        scannerInstance.current = scanner;
        
        // Render the scanner with callbacks
        scanner.render(
          // Success callback
          (decodedText: string) => {
            console.log('QR code scanned successfully:', decodedText);
            onScanSuccess(decodedText);
          },
          // Error callback (for scanning errors, not fatal)
          (errorMessage: string) => {
            // Don't show every failed scan attempt
            console.debug('QR scan attempt error:', errorMessage);
            if (onScanError) {
              onScanError(errorMessage);
            }
          }
        );
        
        setIsLoading(false);
      } catch (err) {
        console.error('Failed to initialize QR scanner:', err);
        setError('Failed to load QR scanner. Please try manual search instead.');
        setIsLoading(false);
        if (onScanError) {
          onScanError(err instanceof Error ? err.message : 'QR scanner initialization failed');
        }
      }
    }
    
    loadQrLibrary();
    
    // Clean up the scanner when component unmounts
    return () => {
      if (scannerInstance.current) {
        try {
          // Try to clear the scanner if it was initialized
          scannerInstance.current.clear();
        } catch (err) {
          console.error('Error cleaning up QR scanner:', err);
        }
      }
    };
  }, [onScanSuccess, onScanError]);

  return (
    <div className="qr-scanner-container">
      {isLoading && <div className="scanner-loading">Loading QR scanner...</div>}
      {error && <div className="scanner-error">{error}</div>}
      <div id="qr-scanner-element" ref={scannerRef} style={{ width: '100%', minHeight: '300px' }} />
    </div>
  );
}
