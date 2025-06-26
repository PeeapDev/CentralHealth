/**
 * Fix Existing Medical IDs Script
 * 
 * This script:
 * 1. Scans the database for any medical IDs that don't meet our mixed alphanumeric requirement
 * 2. Replaces them with properly formatted IDs that include both letters and numbers
 * 3. Logs all changes for auditing purposes
 */
const { PrismaClient } = require('../lib/generated/prisma');
const prisma = new PrismaClient();
// Since we're importing from a TypeScript file, we need to create our own implementation
// that matches the logic in utils/medical-id.ts

/**
 * Generate a medical ID that always includes both letters and numbers
 */
function generateMedicalID() {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // 24 characters (excluding O, I, L)
  const numbers = '23456789';                  // 8 characters (excluding 0, 1)
  
  // We'll always use a guaranteed mixed pattern to ensure we have both letters and numbers
  // Using only two patterns that guarantee a good mix: LNLNL or NLNLN
  // where L = letter, N = number
  
  // Randomly select one of our two guaranteed patterns (0-1)
  const patternType = Math.floor(Math.random() * 2);
  
  let id = '';
  
  switch(patternType) {
    case 0: // LNLNL - 3 letters, 2 numbers - guaranteed mix
      id += letters.charAt(Math.floor(Math.random() * letters.length));
      id += numbers.charAt(Math.floor(Math.random() * numbers.length));
      id += letters.charAt(Math.floor(Math.random() * letters.length));
      id += numbers.charAt(Math.floor(Math.random() * numbers.length));
      id += letters.charAt(Math.floor(Math.random() * letters.length));
      break;
    case 1: // NLNLN - 2 letters, 3 numbers - guaranteed mix
      id += numbers.charAt(Math.floor(Math.random() * numbers.length));
      id += letters.charAt(Math.floor(Math.random() * letters.length));
      id += numbers.charAt(Math.floor(Math.random() * numbers.length));
      id += letters.charAt(Math.floor(Math.random() * letters.length));
      id += numbers.charAt(Math.floor(Math.random() * numbers.length));
      break;
  }
  
  return id;
}

/**
 * Check if the medical ID is valid (contains at least one letter AND one number)
 */
function isValidMixedMedicalID(id) {
  if (!id || typeof id !== 'string' || id.length !== 5) return false;
  
  // Check if it contains at least one letter
  const hasLetter = /[A-Z]/i.test(id);
  
  // Check if it contains at least one number
  const hasNumber = /[0-9]/.test(id);
  
  // Valid only if it has both at least one letter AND one number
  return hasLetter && hasNumber;
}

/**
 * Main function to fix all medical IDs
 */
async function fixExistingMedicalIDs() {
  console.log('Starting medical ID audit and correction...');
  
  try {
    // Get all patients from database
    const patients = await prisma.patient.findMany({
      select: {
        id: true,
        name: true, // Using name instead of firstName/lastName
        mrn: true
      }
    });
    
    console.log(`Found ${patients.length} patient records to check`);
    
    let fixedCount = 0;
    let alreadyValidCount = 0;
    let errorCount = 0;
    
    // Process each patient
    for (const patient of patients) {
      const displayName = `${patient.name || 'Unknown'} (ID: ${patient.id})`.trim();
      
      try {
        // If patient has no medical ID, generate one
        if (!patient.mrn) {
          const newMedicalId = generateMedicalID();
          await prisma.patient.update({
            where: { id: patient.id },
            data: { mrn: newMedicalId }
          });
          console.log(`Added missing medical ID for patient ${displayName}: "${newMedicalId}"`);
          fixedCount++;
          continue;
        }
        
        // Check if the medical ID is valid (contains at least one letter AND one number)
        if (isValidMixedMedicalID(patient.mrn)) {
          console.log(`Patient ${displayName} already has valid mixed medical ID: ${patient.mrn}`);
          alreadyValidCount++;
          continue;
        }
        
        // If we get here, the medical ID needs to be fixed
        console.log(`Found invalid medical ID for patient ${displayName}: "${patient.mrn}" (does not mix letters and numbers)`);
        
        // Generate a new valid medical ID
        const newMedicalId = generateMedicalID();
        
        // Update the patient record with the new ID
        await prisma.patient.update({
          where: { id: patient.id },
          data: { mrn: newMedicalId }
        });
        
        console.log(`Fixed patient ${displayName}: Old ID "${patient.mrn}" -> New ID "${newMedicalId}"`);
        fixedCount++;
        
      } catch (error) {
        console.error(`Error processing patient ${displayName}:`, error);
        errorCount++;
      }
    }
    
    // Print summary
    console.log('\n----- MEDICAL ID AUDIT SUMMARY -----');
    console.log(`Total patients processed: ${patients.length}`);
    console.log(`Already valid mixed IDs: ${alreadyValidCount}`);
    console.log(`Fixed medical IDs: ${fixedCount}`);
    console.log(`Errors encountered: ${errorCount}`);
    console.log('----------------------------------');

  } catch (error) {
    console.error('Failed to fix medical IDs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
fixExistingMedicalIDs()
  .then(() => {
    console.log('Medical ID correction complete!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Medical ID correction failed:', error);
    process.exit(1);
  });
