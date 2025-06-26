// Simple test for QR code generation - ESM version
import { generatePatientQRCode } from './utils/qr-code.js';

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

// Run the test
// Self-invoking async function to run the test
(async () => {
  const success = await testQRCodeGeneration();
  console.log(`Test ${success ? 'PASSED' : 'FAILED'}`);
  process.exit(success ? 0 : 1);
})();
