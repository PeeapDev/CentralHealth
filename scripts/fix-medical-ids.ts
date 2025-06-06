/**
 * Data integrity script to fix inconsistent medical IDs
 * 
 * This script:
 * 1. Finds all patients with missing or improperly formatted medical IDs
 * 2. Generates proper 5-character alphanumeric IDs for them
 * 3. Updates their records in the database
 * 
 * Usage: ts-node scripts/fix-medical-ids.ts
 */

import { PrismaClient } from '@prisma/client';
import { generateMedicalID, isValidMedicalID } from '../utils/medical-id';

const prisma = new PrismaClient();

async function fixMedicalIds() {
  console.log('Starting medical ID data integrity check...');
  
  // Find all patients
  const patients = await prisma.patient.findMany({
    select: {
      id: true,
      medicalNumber: true,
      name: true,
      email: true,
    }
  });
  
  console.log(`Found ${patients.length} total patients to check`);
  
  let fixed = 0;
  let alreadyValid = 0;
  let errors = 0;
  
  // Process each patient
  for (const patient of patients) {
    try {
      // Skip patients who already have a valid medical ID
      if (patient.medicalNumber && isValidMedicalID(patient.medicalNumber)) {
        console.log(`Patient ${patient.id} already has valid medical ID: ${patient.medicalNumber}`);
        alreadyValid++;
        continue;
      }
      
      // Skip patients with P-prefixed medical IDs (these are valid in our system)
      if (patient.medicalNumber && 
          patient.medicalNumber.startsWith('P') && 
          isValidMedicalID(patient.medicalNumber.substring(1))) {
        console.log(`Patient ${patient.id} has valid P-prefixed medical ID: ${patient.medicalNumber}`);
        alreadyValid++;
        continue;
      }
  
      // Generate a new valid medical ID
      let newMedicalId = generateMedicalID();
      
      // Check uniqueness (avoid collisions)
      let isUnique = false;
      let attempts = 0;
      const MAX_ATTEMPTS = 10;
      
      while (!isUnique && attempts < MAX_ATTEMPTS) {
        // Check if this ID is already used by another patient
        const existingPatient = await prisma.patient.findFirst({
          where: { 
            medicalNumber: newMedicalId,
            NOT: { id: patient.id }
          }
        });
        
        if (!existingPatient) {
          isUnique = true;
        } else {
          console.log(`Generated ID ${newMedicalId} already exists, trying again...`);
          newMedicalId = generateMedicalID();
          attempts++;
        }
      }
      
      if (!isUnique) {
        console.error(`Failed to generate unique medical ID for patient ${patient.id} after ${MAX_ATTEMPTS} attempts`);
        errors++;
        continue;
      }
      
      // Get display name for logging
      let displayName = 'Unknown';
      try {
        if (patient.name) {
          if (typeof patient.name === 'string') {
            const nameObj = JSON.parse(patient.name);
            if (Array.isArray(nameObj) && nameObj.length > 0) {
              displayName = nameObj[0].family || patient.email || 'Unknown';
            }
          } else if (Array.isArray(patient.name) && patient.name.length > 0) {
            displayName = patient.name[0].family || patient.email || 'Unknown';
          }
        }
      } catch (e) {
        // If we can't parse the name, use email or ID as fallback
        displayName = patient.email || patient.id;
      }
      
      // Update the patient's medical ID
      await prisma.patient.update({
        where: { id: patient.id },
        data: { medicalNumber: newMedicalId }
      });
      
      console.log(`Fixed patient ${displayName}: Old ID "${patient.medicalNumber || 'none'}" -> New ID "${newMedicalId}"`);
      fixed++;
      
    } catch (e) {
      console.error(`Error processing patient ${patient.id}:`, e);
      errors++;
    }
  }
  
  console.log('\n=== Medical ID Fix Summary ===');
  console.log(`Total patients: ${patients.length}`);
  console.log(`Already valid: ${alreadyValid}`);
  console.log(`Fixed: ${fixed}`);
  console.log(`Errors: ${errors}`);
  console.log('===========================\n');
}

// Execute the function and handle cleanup
fixMedicalIds()
  .catch(e => {
    console.error('Error in medical ID fix script:', e);
    process.exit(1);
  })
  .finally(async () => {
    // Disconnect Prisma client
    await prisma.$disconnect();
    console.log('Medical ID fix complete!');
  });
