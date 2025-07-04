/**
 * Types for QR Scanner Component
 */

// Scanner status states
export type QrScannerStatus = 'idle' | 'initializing' | 'active' | 'error' | 'success';

// Configuration for the scanner
export interface QrScanConfig {
  fps?: number;
  qrbox?: { width: number; height: number } | number;
  disableFlash?: boolean;
  aspectRatio?: number;
}

// Props for the QR Scanner component
export interface QrScannerProps {
  // Required callbacks
  onScanSuccess: (result: string) => void;
  onScanError?: (error: string) => void;
  onMount?: (stopFn: () => Promise<void>) => void;
  
  // Optional configuration
  width?: string | number;
  height?: string | number;
  showBorder?: boolean;
  preferredCamera?: 'user' | 'environment';
  scanConfig?: QrScanConfig;
}
