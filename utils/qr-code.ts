import QRCode from 'qrcode';

/**
 * Generates a QR code for a patient based on their medical record number (MRN)
 * Returns a base64 encoded string representation of the QR code
 * 
 * @param mrn - The patient's medical record number (unique identifier)
 * @returns Promise<string> - Base64 encoded QR code image
 */
export async function generatePatientQRCode(mrn: string): Promise<string> {
  try {
    // Format the QR code data in a standard format that includes the medical ID
    // Use a prefix to identify this as a CentralHealth patient QR code
    const qrCodeData = `CentralHealth:${mrn}`;
    
    // Generate QR code as a base64 encoded data URL
    const qrCodeImage = await QRCode.toDataURL(qrCodeData, {
      errorCorrectionLevel: 'H', // High error correction for better readability
      margin: 2,
      width: 300,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });
    
    return qrCodeImage;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error(`Failed to generate QR code: ${(error as Error).message}`);
  }
}
