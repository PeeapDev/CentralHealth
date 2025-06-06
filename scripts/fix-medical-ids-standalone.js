// Self-contained script to fix Medical IDs without external dependencies
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Define the utility functions inline (copied from utils/medical-id.ts)
function generateMedicalID(length = 5) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let id = '';
  for (let i = 0; i < length; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

function isValidMedicalID(id) {
  if (!id || id.length !== 5) return false;
  
  // Check if it only contains allowed characters
  const allowedChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  for (let i = 0; i < id.length; i++) {
    if (!allowedChars.includes(id.charAt(i))) {
      return false;
    }
  }
  
  return true;
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
