// Simple test for QR code generation - ESM version
import QRCode from 'qrcode';

/**
 * Generates a QR code for a patient based on their medical record number (MRN)
 * Returns a base64 encoded string representation of the QR code
 * 
 * @param mrn - The patient's medical record number (unique identifier)
 * @returns Promise<string> - Base64 encoded QR code image
 */
async function generatePatientQRCode(mrn) {
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
    throw new Error(`Failed to generate QR code: ${error.message}`);
  }
}

async function testQRCodeGeneration() {
  try {
    // Test with a sample MRN (medical record number)
    const testMrn = 'A1B2C';
    console.log(`Testing QR code generation for medical ID: ${testMrn}`);
    
    // Generate QR code
    const qrCode = await generatePatientQRCode(testMrn);
    
    // Verify the result
    console.log('QR code generation successful!');
    console.log('QR code data URL length:', qrCode.length);
    console.log('QR code data URL starts with:', qrCode.substring(0, 30) + '...');
    
    return true;
  } catch (error) {
    console.error('QR code generation failed:', error);
    return false;
  }
}

// Self-invoking async function to run the test
(async () => {
  const success = await testQRCodeGeneration();
  console.log(`Test ${success ? 'PASSED' : 'FAILED'}`);
  process.exit(success ? 0 : 1);
})();
