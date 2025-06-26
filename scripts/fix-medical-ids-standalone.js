// Self-contained script to fix Medical IDs without external dependencies
// Uses the correct Prisma client path
const { PrismaClient } = require('../lib/generated/prisma');
const prisma = new PrismaClient();

// Medical ID generation function inline to avoid import issues
function generateMedicalID() {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // 24 characters (excluding O, I, L)
  const numbers = '23456789';                  // 8 characters (excluding 0, 1)
  
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


function isValidMedicalID(id) {
  if (!id || id.length !== 5) return false;
  
  // Check if it only contains allowed characters
  const allowedChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const numbers = '23456789';
  
  // First check: all characters must be from our allowed set
  for (let i = 0; i < id.length; i++) {
    if (!allowedChars.includes(id.charAt(i))) {
      return false;
    }
  }
  
  // Second check: must contain at least one letter
  let hasLetter = false;
  for (let i = 0; i < id.length; i++) {
    if (letters.includes(id.charAt(i))) {
      hasLetter = true;
      break;
    }
  }
  
  // Third check: must contain at least one number
  let hasNumber = false;
  for (let i = 0; i < id.length; i++) {
    if (numbers.includes(id.charAt(i))) {
      hasNumber = true;
      break;
    }
  }
  
  // Fourth check: reject all-letter formats (likely name-derived IDs like "MOHAM")
  if (id.length === 5 && /^[A-Z]+$/i.test(id)) {
    console.warn('Rejected all-letter medical ID format:', id);
    return false;
  }
  
  // Valid only if it has at least one letter AND one number
  return hasLetter && hasNumber;
}

/**
 * This script fixes inconsistent Medical IDs in the database:
 * 1. Finds patients with missing or invalid Medical IDs (P12345 format)
 * 2. Generates new 5-character alphanumeric IDs for them
 * 3. Updates the database records
 */
async function fixMedicalIDs() {
  console.log("Starting Medical ID consistency fix script...");
  
  try {
    // Get all patients
    const patients = await prisma.patient.findMany({
      select: {
        id: true,
        medicalNumber: true,
      }
    });

    console.log(`Found ${patients.length} patient records to check`);
    
    let fixedCount = 0;
    let skippedCount = 0;
    
    for (const patient of patients) {
      // Check if patient has a valid Medical ID (5 chars, alphanumeric)
      const hasValidID = patient.medicalNumber && isValidMedicalID(patient.medicalNumber);
      
      // Check if patient has a P-prefixed ID that needs to be replaced
      const hasPrefixedID = patient.medicalNumber && 
                            typeof patient.medicalNumber === 'string' && 
                            patient.medicalNumber.startsWith('P') && 
                            patient.medicalNumber.length > 1;
      
      if (hasValidID && !hasPrefixedID) {
        // Skip if already has valid ID and not using the old P prefix format
        skippedCount++;
        console.log(`Patient ${patient.id} already has valid Medical ID: ${patient.medicalNumber}`);
        continue;
      }
      
      // Generate a new consistent Medical ID
      let newMedicalId = generateMedicalID();
      let isUnique = false;
      let attempts = 0;
      
      // Ensure uniqueness of the new Medical ID
      while (!isUnique && attempts < 10) {
        attempts++;
        // Check if this Medical ID is already in use
        const existingPatient = await prisma.patient.findUnique({
          where: { medicalNumber: newMedicalId },
          select: { id: true }
        });
        
        if (!existingPatient) {
          isUnique = true;
        } else {
          console.log(`Generated ID ${newMedicalId} already exists, trying again...`);
          newMedicalId = generateMedicalID();
        }
      }
      
      if (!isUnique) {
        console.error(`Could not generate a unique Medical ID for patient ${patient.id} after ${attempts} attempts`);
        continue;
      }
      
      // Update the patient record with the new Medical ID
      await prisma.patient.update({
        where: { id: patient.id },
        data: { medicalNumber: newMedicalId }
      });
      
      console.log(`Fixed patient ${patient.id}: ${patient.medicalNumber || 'missing'} → ${newMedicalId}`);
      fixedCount++;
    }
    
    console.log(`Medical ID fix complete!`);
    console.log(`- Fixed: ${fixedCount} patients`);
    console.log(`- Skipped (already valid): ${skippedCount} patients`);
    
  } catch (error) {
    console.error("Error fixing Medical IDs:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
fixMedicalIDs().catch(console.error);
